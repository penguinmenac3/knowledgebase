import "./search.css"
import { FileTree, WebFS } from "../webfs/client/webfs";
import { Button, FormCheckbox, FormInput, FormLabel } from "../webui/form";
import { humanFriendlyDate } from "../webui/utils/humanFriendlyDates";
import { KWARGS, Module } from "../webui/module";
import { PageManager } from "../webui/pagemanager";
import { ExitablePopup } from "../webui/popup";
import { STRINGS } from "../language/default";
import { bars } from "../webui/icons/icons";
import { iconFlag, iconFlagOutline, iconFolder, iconHouse, iconStar, iconStarOutline, iconUpload } from "../icons";

interface Entry {
    filepath: string
    modified: Date | null
    isFolder: boolean
    score?: number
}


export class Search extends Module<HTMLDivElement> {
    private searchField: FormInput
    private results: Module<HTMLDivElement>

    //private currentSearch: string | undefined = undefined
    private fileTree: FileTree | null = null
    private isOffline: boolean = false
    private favouritesOnly: boolean = false
    private todoOnly: boolean = false

    public constructor() {
        super("div")
        this.searchField = new FormInput("search", STRINGS.SEARCH_PLACEHOLDER, "search", "searchInput")
        this.searchField.onChange = (_value: string) => {
            this.updateSearchResults()
        }
        this.searchField.onChangeDone = (value: string) => {
            PageManager.open("search", {q: value})
        }
        this.add(this.searchField)
        this.results = new Module("div")
        this.results.setClass("searchResults")
        this.add(this.results)

        let navBar = new Module("div", "", "searchBottomNavbar")
        let normal = new Button(iconHouse, "searchBottomNavbarIcon")
        normal.onClick = () => {
            this.searchField.htmlElement.value = ""
            this.searchField.onChangeDone("")
                    }
        navBar.add(normal)
        let folders = new Button(iconFolder, "searchBottomNavbarIcon")
        folders.onClick = () => {
            this.searchField.htmlElement.value = "/"
            this.searchField.onChangeDone("/")
                    }
        navBar.add(folders)
        let favourites = new Button(iconStarOutline, "searchBottomNavbarIcon")
        favourites.onClick = () => {
            this.favouritesOnly = !this.favouritesOnly
            if (this.favouritesOnly) {
                favourites.htmlElement.innerHTML = iconStar
            } else {
                favourites.htmlElement.innerHTML = iconStarOutline
            }
            this.updateSearchResults()
                    }
        navBar.add(favourites)
        let todos = new Button(iconFlagOutline, "searchBottomNavbarIcon")
        todos.onClick = () => {
            this.todoOnly = !this.todoOnly
            if (this.todoOnly) {
                todos.htmlElement.innerHTML = iconFlag
            } else {
                todos.htmlElement.innerHTML = iconFlagOutline
            }
            this.updateSearchResults()
                    }
        navBar.add(todos)
        this.add(navBar)
        
        let upload = new Button(iconUpload, "searchUploadButton")
        upload.onClick = () => {
            let currentFolder = "/"
            let keywords = this.searchField.value().split(",").map((x: string) => x.trim());
            for (let keyword of keywords) {
                if (keyword.startsWith("/")) {
                    currentFolder = keyword
                    break
                }
            }
            new UploadPopup(currentFolder, "", this.triggerFullUpdate.bind(this))
        }
        this.add(upload)

        let settingsBtn = new Button(bars, "settingsOpen")
        settingsBtn.onClick = () => {
            new SettingsPopup()
                    }
        this.add(settingsBtn)
    }

    private triggerFullUpdate() {
        this.update({q: this.searchField.value()}, true)
    }

    public async update(kwargs: KWARGS, changedPage: boolean): Promise<void> {
        if (WebFS.instance == null) {
            PageManager.open("login", {})
            return
        }

        if (changedPage) {
            this.fileTree = await WebFS.instance?.walk(".")
            if (this.fileTree == null) {
                let sessionName = WebFS.instance.getSessionName()
                let jsonFiletree = localStorage["kb_filetree_cache_" + sessionName]
                if (jsonFiletree) {
                    this.fileTree = JSON.parse(jsonFiletree)
                }
                this.isOffline = true
            } else {
                let sessionName = WebFS.instance.getSessionName()
                let jsonFiletree = JSON.stringify(this.fileTree)
                localStorage["kb_filetree_cache_" + sessionName] = jsonFiletree
                this.isOffline = false
            }
        }
        this.searchField.value(kwargs.q)
        this.updateSearchResults();
    }

    private async updateSearchResults(showMax: number = 50) {
        let searchText = this.searchField.value()
        //if (this.currentSearch == searchText) return
        //this.currentSearch = searchText

        this.results.htmlElement.innerHTML = "";
        if (this.fileTree == null) {
            alert(STRINGS.SEARCH_FILETREE_IS_NULL)
            return
        }

        let files = this.flatten(this.fileTree);
        files = this.sortFilesByLastModified(files);
        files = this.sortFilesByRelevance(files, searchText);
        files = files.filter((entry: Entry) => {
            let filename = splitFilepath(entry.filepath).filename
            if (this.favouritesOnly && !filename.includes(".fav")) return false
            if (this.todoOnly && !filename.includes(".todo")) return false
            return true
        })
        this.showNumResults(files);
        let numResults = files.length;
        files = files.slice(0, showMax); // Only take first 50 results
        for (let entry of files) {
            this.results.add(new SearchResult(
                entry.filepath,
                entry.modified != null ? humanFriendlyDate(entry.modified) : "",
                entry.isFolder,
                this.searchField,
                this.triggerFullUpdate.bind(this)
            ))
        }
        if (numResults > showMax) {
            let showMore = new Module("div");
            showMore.htmlElement.innerText = STRINGS.SEARCH_MORE_RESULTS;
            showMore.setClass("searchMoreResults");
            showMore.htmlElement.onclick = () => {
                this.updateSearchResults(showMax + 25);
            }
            this.results.add(showMore);
        }
    }

    private showNumResults(files: Entry[]) {
        let numResults = new Module("div");
        let offline = ""
        if (this.isOffline) {
            offline =  " " + STRINGS.SEARCH_OFFLINE
        }
        numResults.htmlElement.innerHTML = files.length + " " + STRINGS.SEARCH_NUM_RESULTS + offline;
        numResults.setClass("searchNumResults");
        this.results.add(numResults);
    }

    private sortFilesByRelevance(files: Entry[], searchText: string): Entry[] {
        let keywords = searchText.toLowerCase().split(",").map((x: string) => x.trim());
        let results: Entry[] = [];
        for (let entry of files) {
            let { filename, folder } = splitFilepath(entry.filepath)
            filename = filename.toLowerCase()
            folder = folder.toLowerCase()
            var score = 0;
            for (let keyword of keywords) {
                if (keyword == "") {
                    score += 1;
                    continue;
                }
                let isFolder = keyword.startsWith("/");
                let foldername = keyword.substring(1)
                if (foldername == "") foldername = "."
                if (!isFolder && filename.includes(keyword)) {
                    score += 100;
                    if (entry.isFolder) score += 10;
                }
                if (isFolder && entry.isFolder && filename.includes(foldername)) {
                    if (entry.filepath.toLowerCase() != foldername) {
                        score += 125;
                        if (filename == foldername) score += 25
                    }
                }
                if (isFolder && folder == foldername) {
                    score += 100;
                    if (entry.isFolder) score += 10;
                }
            }
            if (score > 0) {
                if (filename.includes(".fav")) {
                    score += 3
                }
                if (filename.includes(".todo")) {
                    score += 4
                }
                results.push({
                    filepath: entry.filepath, modified: entry.modified,
                    isFolder: entry.isFolder, score: score
                });
            }
        }
        return results.sort((a: Entry, b: Entry) => b.score! - a.score!);
    }

    private sortFilesByLastModified(files: Entry[]): Entry[] {
        return files.sort((a: Entry, b: Entry) => {
            // Things which do not have a modified date should be put at the end.
            if (a.modified == null) return 1
            if (b.modified == null) return -1
            return b.modified.toISOString().localeCompare(a.modified.toISOString())
        });
    }

    private flatten(fileTree: FileTree, pathPrefix: string = "", out: Entry[] = []): Entry[] {
        for (const filename in fileTree) {
            const value = fileTree[filename];
            if (!(typeof value === 'string')) {
                out = this.flatten(value as FileTree, pathPrefix + filename + "/", out)
                out.push({
                    filepath: pathPrefix + filename,
                    modified: null,
                    isFolder: true
                })
            } else {
                out.push({
                    filepath: pathPrefix + filename,
                    modified: new Date(value as string),
                    isFolder: false
                })
            }
        }
        return out
    }
}

class SearchResult extends Module<HTMLDivElement> {
    constructor(filepath: string, modified: string, isFolder: boolean, searchField: FormInput, triggerFullUpdate: CallableFunction) {
        super("div")
        this.setClass("searchResult")
        let { filename, folder } = splitFilepath(filepath);

        let filename_parts = filename.split(".")
        if (isFolder) filename_parts.push("DIR")
        let ext = filename_parts[filename_parts.length - 1].toLowerCase()
        
        if ((localStorage.kb_allow_img_previews == 'true' && (ext == "png" || ext == "jpg" || ext == "jpeg")
         || (localStorage.kb_allow_pdf_previews == 'true' && ext == "pdf"))) {
            let preview = document.createElement("img")
            preview.classList.add("searchResultPreview")
            preview.onerror = () => {
                let previewElement = document.createElement("div")
                previewElement.innerHTML = "<BR>" + ext.toUpperCase()
                previewElement.classList.add("searchResultPreview")
                this.htmlElement.replaceChild(previewElement, this.htmlElement.childNodes[0]);
            }
            preview.src = WebFS.instance!.readURL(filepath, true)
            this.htmlElement.appendChild(preview)
        } else if (localStorage.kb_allow_txt_previews == 'true' && (ext == "txt" || ext == "md" || ext == "py" || ext == "csv" || ext == "json")) {
            let preview = document.createElement("div")
            preview.style.fontSize = "1em"
            preview.style.textAlign = "left"
            preview.innerHTML = "loading..."
            PreviewCache.getTxtPreview(filepath).then((txt) => {
                let parts = txt.split("\n")
                parts = parts.map((val, _idx, _arr) => {
                    if (val.startsWith("#")) {
                        return "<b style='font-size: 1.2em'>" + val + "</b>"
                    }
                    return val
                })
                txt = parts.join("<BR>")
                preview.innerHTML = txt
            })
            preview.classList.add("searchResultPreview")
            this.htmlElement.appendChild(preview)
        } else {
            let preview = document.createElement("div")
            preview.innerHTML = "<BR>" + ext.toUpperCase()
            preview.classList.add("searchResultPreview")
            this.htmlElement.appendChild(preview)
        }

        let meta = document.createElement("div")
        meta.classList.add("searchResultMeta")
        this.htmlElement.appendChild(meta)
        
        let header = document.createElement("div")
        header.innerText = filename.replace(".todo", "").replace(".fav", "")
        header.classList.add("searchResultFilename")
        meta.appendChild(header)
        
        if (modified != "") {
            let modifiedElement = document.createElement("div")
            modifiedElement.innerText = STRINGS.SEARCH_LAST_MODIFIED + ": " + modified
            modifiedElement.classList.add("searchResultModified")
            meta.appendChild(modifiedElement)
        }
        
        let folderElement = document.createElement("div")
        folderElement.innerText = folder
        folderElement.classList.add("searchResultFolder")
        meta.appendChild(folderElement)
        
        this.htmlElement.onclick = () => {
            if (isFolder) {
                searchField.htmlElement.value = "/" + filepath
                searchField.onChange(searchField.htmlElement.value)
                searchField.onChangeDone(searchField.htmlElement.value)
            } else {
                PageManager.open("edit", {folder: folder, filename: filename})
                //WebFS.instance?.read(folder + "/" + filename, "_blank")
            }
        }

        if (!isFolder) {
            let buttonContainer = new Module("div", "", "searchResultFlagButtonContainer")
            let isFav = filename.includes(".fav")
            let favButton = new Button(isFav ? iconStar : iconStarOutline, "searchResultFlagButton")
            if (isFav) favButton.setClass("searchResultFlagButtonActive")
            favButton.onClick = async () => {
                if (WebFS.instance == null) return
                if (isFav) {
                    await WebFS.instance.mv(filepath, filepath.replace(".fav", ""))
                } else {
                    let parts = filepath.split(".")
                    parts.splice(parts.length - 1, 0, "fav")
                    await WebFS.instance.mv(filepath, parts.join("."))
                }
                triggerFullUpdate()
            }
            buttonContainer.add(favButton)
            let isTodo = filename.includes(".todo")
            let todoButton = new Button(isTodo ? iconFlag : iconFlagOutline, "searchResultFlagButton")
            if (isTodo) todoButton.setClass("searchResultFlagButtonActive")
            todoButton.onClick = async () => {
                if (WebFS.instance == null) return
                if (isTodo) {
                    await WebFS.instance.mv(filepath, filepath.replace(".todo", ""))
                } else {
                    let parts = filepath.split(".")
                    parts.splice(parts.length - 1, 0, "todo")
                    await WebFS.instance.mv(filepath, parts.join("."))
                }
                triggerFullUpdate()
            }
            buttonContainer.add(todoButton)
            this.add(buttonContainer)
        }
    }
}
function splitFilepath(filepath: string) {
    let pathtokens = filepath.split("/");
    let filename = pathtokens.pop()!;
    let folder = pathtokens.join("/");
    if (folder == "") {
        folder = ".";
    }
    return { filename, folder };
}
class PreviewCache {
    private constructor() {}

    public static async getTxtPreview(filepath: string): Promise<string> {
        let cache = JSON.parse(localStorage.getItem("kb_preview_cache") || "{}")
        if (cache[filepath]) {
            return cache[filepath]
        }
        let txt = await WebFS.instance!.readTxt(filepath)
        if (txt != null) {
            let parts = txt.split("\n").slice(0, 13)
            parts = parts.map((val, _idx, _arr) => {return val.slice(0, 40)})
            txt = parts.join("\n")
            let cache = JSON.parse(localStorage.getItem("kb_preview_cache") || "{}")
            cache[filepath] = txt
            localStorage.setItem("kb_preview_cache", JSON.stringify(cache))
            return txt
        }
        return "error loading preview"
    }

    public static async getImgPreview(_filepath: string): Promise<string> {
        return ""
    }
}

export class SettingsPopup extends ExitablePopup {
    public constructor() {
        super("fullscreenPopupContent", "fullscreenPopupContainer", "fullscreenPopupExitBtn")
        this.add(new Module("div", STRINGS.SETTINGS_TITLE, "popupTitle"))
        
        this.add(new Module("div", STRINGS.SETTINGS_GENERAL, "popupSubtitle"))

        this.add(new Module("div", STRINGS.SETTINGS_DISPLAY, "popupSubtitle"))
        let showTxtPreviews = new FormCheckbox(
            "showTxtPreviews",
            STRINGS.SETTINGS_SHOW_TXT_PREVIEWS,
            "settingsCheckbox",
            localStorage.kb_allow_txt_previews == 'true')
            showTxtPreviews.onChange = (state: boolean) => {
            localStorage.kb_allow_txt_previews = state
        }
        this.add(showTxtPreviews)
        let showImgPreviews = new FormCheckbox(
            "showImgPreviews",
            STRINGS.SETTINGS_SHOW_IMG_PREVIEWS,
            "settingsCheckbox",
            localStorage.kb_allow_img_previews == 'true')
        showImgPreviews.onChange = (state: boolean) => {
            localStorage.kb_allow_img_previews = state
        }
        this.add(showImgPreviews)
        let showPDFPreviews = new FormCheckbox(
            "showPDFPreviews",
            STRINGS.SETTINGS_SHOW_PDF_PREVIEWS,
            "settingsCheckbox",
            localStorage.kb_allow_pdf_previews == 'true')
        showPDFPreviews.onChange = (state: boolean) => {
            localStorage.kb_allow_pdf_previews = state
        }
        this.add(showPDFPreviews)

        this.add(new Module("div", STRINGS.SETTINGS_CONNECTION, "popupSubtitle"))
        let loginButton = new Button(STRINGS.SETTINGS_SELECT_SERVER, "buttonWide")
        loginButton.onClick = () => {
            this.dispose()
            PageManager.open("login", {})
                    }
        this.add(loginButton)
    }

    public update(): void {}
}

export class UploadPopup extends ExitablePopup {
    public constructor(currentFolder: string, currentFile: string, triggerFullUpdate: CallableFunction) {
        super("fullscreenPopupContent", "fullscreenPopupContainer", "fullscreenPopupExitBtn")
        this.setClass("upload")
        this.add(new Module("div", STRINGS.UPLOAD_TITLE, "popupTitle"))
        this.add(new FormLabel(STRINGS.UPLOAD_FOLDERNAME))
        let folderInput = new FormInput("foldername", currentFolder, "text")
        folderInput.value(currentFolder)
        this.add(folderInput)
        this.add(new FormLabel(STRINGS.UPLOAD_FILENAME))
        let filenameInput = new FormInput("filename", currentFile, "text")
        filenameInput.value(currentFile)
        this.add(filenameInput)
        this.add(new FormLabel(STRINGS.UPLOAD_FILE))
        let fileInput = new FormInput("file", "", "file", "fileInput")
        fileInput.onChangeDone = (value: string) => {
            if (filenameInput.value() == "") {
                let parts = value.replaceAll("\\", "/").split("/")
                filenameInput.value(parts[parts.length - 1])
            }
        }
        this.add(fileInput)
        let sendBtn = new Button(STRINGS.UPLOAD_SEND, "buttonWide")
        sendBtn.onClick = async () => {
            if (WebFS.instance == null) return
            sendBtn.htmlElement.disabled = true
            let file = fileInput.htmlElement.files![0]
            let folder = folderInput.value()
            if (folder.endsWith("/")) {
                folder = folder.slice(0, folder.length - 1)
            }
            let filename = filenameInput.value()
            let path = folder + "/" + filename
            let result = await WebFS.instance.putFile(path, file, "")
            sendBtn.htmlElement.disabled = false
            if (result) {
                this.dispose()
                triggerFullUpdate()
            } else {
                alert(STRINGS.UPLOAD_FAILED)
            }
        }
        this.add(sendBtn)
    }

    public update(): void {}
}
