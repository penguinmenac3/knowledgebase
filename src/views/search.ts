import "./search.css"
import { FileTree, WebFS } from "../webfs/client/webfs";
import { Button, FormCheckbox, FormDropdown, FormInput, FormLabel } from "../webui/components/form";
import { humanFriendlyDate } from "../webui/utils/humanFriendlyDates";
import { KWARGS, Module } from "../webui/module";
import { PageManager } from "../webui/pagemanager";
import { ExitablePopup } from "../webui/components/popup";
import { STRINGS } from "../language/default";
import { iconArrowLeft, iconBars } from "../webui/icons";
import { iconChat, iconFlag, iconFlagOutline, iconFolder, iconGraph, iconPlus, iconStar, iconStarOutline } from "../icons";

interface Entry {
    filepath: string
    sessionName: string,
    modified: Date | null
    isFolder: boolean
    score?: number
}


export class Search extends Module<HTMLDivElement> {
    private searchField: FormInput
    private results: Module<HTMLDivElement>

    //private currentSearch: string | undefined = undefined
    private fileTrees: Map<string, FileTree> = new Map<string, FileTree>()
    private offlineConnections: string[] = []

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
        // let normal = new NavbarButton("Latest", iconHouse)
        // normal.onClick = () => {
        //     this.searchField.htmlElement.value = ""
        //     this.searchField.onChangeDone("")
        //             }
        // navBar.add(normal)
        let folders = new NavbarButton("Folders", iconFolder)
        folders.onClick = () => {
            this.searchField.htmlElement.value = "/"
            this.searchField.onChangeDone("/")
        }
        navBar.add(folders)
        let ai = new NavbarButton("AI", iconChat)
        ai.onClick = () => {
            alert("AI-feature is not yet implemented!")
        }
        navBar.add(ai)
        let graph = new NavbarButton("Graph", iconGraph)
        graph.onClick = () => {
            alert("Graph View is not yet implemented")
        }
        navBar.add(graph)
        let settingsBtn = new NavbarButton("Settings", iconBars)
        settingsBtn.onClick = () => {
            let settingsPopup = new SettingsPopup()
            settingsPopup.onExit = this.updateSearchResults.bind(this)
        }
        navBar.add(settingsBtn)
        this.add(navBar)
        
        let upload = new Button(iconPlus, "searchUploadButton")
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

        let backBtn = new Button(iconArrowLeft, "settingsOpen")
        backBtn.onClick = () => {
            let searchText = this.searchField.value().trim()
            if (searchText != "" && searchText != "/") {
                history.back()
            }
        }
        this.add(backBtn)
    }

    private triggerFullUpdate() {
        this.update({q: this.searchField.value()}, true)
    }

    public async update(kwargs: KWARGS, changedPage: boolean): Promise<void> {
        if (WebFS.connections.size < 1) {
            PageManager.open("login", {})
            return
        }

        if (changedPage) {
            this.offlineConnections = []
            this.fileTrees.clear()
            this.results.htmlElement.innerHTML = ""
            for (let [sessionName, webFS] of WebFS.connections) {
                console.log("Gathering filetrees for: " + sessionName)
                let fileTree = await webFS.walk(".")
                if (fileTree == null) {
                    console.log("Session offline: " + sessionName)
                    let jsonFiletree = localStorage["kb_filetree_cache_" + sessionName]
                    if (jsonFiletree) {
                        fileTree = JSON.parse(jsonFiletree)
                    }
                    this.offlineConnections.push(sessionName)
                } else {
                    let jsonFiletree = JSON.stringify(fileTree)
                    localStorage["kb_filetree_cache_" + sessionName] = jsonFiletree
                }
                if (fileTree != null) {
                    this.fileTrees.set(sessionName, fileTree)
                }
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
        let files: Entry[] = []
        for (let [sessionName, filetree] of this.fileTrees) {
            let tmp = this.flatten(sessionName, filetree)
            console.log(sessionName + ": " + tmp.length)
            files = files.concat(tmp)
        }

        if (files.length == 0) {
            alert(STRINGS.SEARCH_FILETREE_IS_NULL)
            return
        }

        files = this.sortFilesByLastModified(files);
        files = this.sortFilesByRelevance(files, searchText);
        this.showNumResults(files);
        let numResults = files.length;
        files = files.slice(0, showMax); // Only take first 50 results
        for (let entry of files) {
            this.results.add(new SearchResult(
                entry.filepath,
                entry.sessionName,  
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
        for (let sessionName of this.offlineConnections) {
            if (offline == "") {
                offline =  STRINGS.SEARCH_OFFLINE
            }
            offline +=  " " + sessionName
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
                    filepath: entry.filepath, sessionName: entry.sessionName, modified: entry.modified,
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

    private flatten(sessionName: string, fileTree: FileTree, pathPrefix: string = "", out: Entry[] = []): Entry[] {
        for (const filename in fileTree) {
            var value = fileTree[filename];
            if (!(typeof value === 'string')) {
                out = this.flatten(sessionName, value as FileTree, pathPrefix + filename + "/", out)
                out.push({
                    filepath: pathPrefix + filename,
                    sessionName: sessionName,
                    modified: null,
                    isFolder: true
                })
            } else {
                if (value.indexOf("GMT") < 0) {
                    value += " GMT+0000"
                }
                out.push({
                    filepath: pathPrefix + filename,
                    sessionName: sessionName,
                    modified: new Date(value),
                    isFolder: false
                })
            }
        }
        return out
    }
}

class NavbarButton extends Button {
    constructor(text: string, iconSVG: string) {
        super("", "searchBottomNavbarButton")
        this.add(new Module<HTMLDivElement>("div", iconSVG, "searchBottomNavbarIcon"))
        this.add(new Module<HTMLDivElement>("div", text, "searchBottomNavbarText"))
    }

    public setIcon(iconSVG: string): void {
        this.htmlElement.children[0].innerHTML = iconSVG
    }
}

class SearchResult extends Module<HTMLDivElement> {
    constructor(filepath: string, sessionName: string, modified: string, isFolder: boolean, searchField: FormInput, triggerFullUpdate: CallableFunction) {
        super("div")
        this.setClass("searchResult")
        let instance = WebFS.connections.get(sessionName)
        let { filename, folder } = splitFilepath(filepath);

        let filename_parts = filename.split(".")
        if (isFolder) filename_parts.push("DIR")
        let ext = filename_parts[filename_parts.length - 1].toLowerCase()
        
        if ((localStorage.kb_allow_img_previews == 'true' && (ext == "png" || ext == "jpg" || ext == "jpeg" || ext == "tiff" || ext == "tif")
         || (localStorage.kb_allow_pdf_previews == 'true' && ext == "pdf"))) {
            let preview = document.createElement("img")
            preview.classList.add("searchResultPreview")
            preview.onerror = () => {
                let previewElement = document.createElement("div")
                previewElement.innerHTML = "<BR>" + ext.toUpperCase()
                previewElement.classList.add("searchResultPreview")
                this.htmlElement.replaceChild(previewElement, this.htmlElement.childNodes[0]);
            }
            if (instance != null) {
                preview.src = instance.readURL(filepath, 256)
            }
            this.htmlElement.appendChild(preview)
        } else if (localStorage.kb_allow_txt_previews == 'true' && (ext == "txt" || ext == "md" || ext == "py" || ext == "csv" || ext == "json")) {
            let preview = document.createElement("div")
            preview.style.fontSize = "1em"
            preview.style.textAlign = "left"
            preview.innerHTML = "loading..."
            PreviewCache.getTxtPreview(sessionName, filepath).then((txt) => {
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
        
        let server = document.createElement("div")
        server.innerText = sessionName
        server.classList.add("searchResultServer")
        meta.appendChild(server)

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
                PageManager.open("edit", {sessionName: sessionName, folder: folder, filename: filename})
                //WebFS.instance?.read(folder + "/" + filename, "_blank")
            }
        }

        
        let hover = document.createElement("div")
        hover.classList.add("searchResultHover")
        this.htmlElement.appendChild(hover)

        if (!isFolder) {
            let buttonContainer = new Module("div", "", "searchResultFlagButtonContainer")
            let isFav = filename.includes(".fav")
            let favButton = new Button(isFav ? iconStar : iconStarOutline, "searchResultFlagButton")
            favButton.onClick = async () => {
                if (instance == null) return
                if (isFav) {
                    await instance.mv(filepath, filepath.replace(".fav", ""))
                } else {
                    let parts = filepath.split(".")
                    parts.splice(parts.length - 1, 0, "fav")
                    await instance.mv(filepath, parts.join("."))
                }
                triggerFullUpdate()
            }
            buttonContainer.add(favButton)
            let isTodo = filename.includes(".todo")
            let todoButton = new Button(isTodo ? iconFlag : iconFlagOutline, "searchResultFlagButton")
            todoButton.onClick = async () => {
                if (instance == null) return
                if (isTodo) {
                    await instance.mv(filepath, filepath.replace(".todo", ""))
                } else {
                    let parts = filepath.split(".")
                    parts.splice(parts.length - 1, 0, "todo")
                    await instance.mv(filepath, parts.join("."))
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

    public static async getTxtPreview(sessionName: string, filepath: string): Promise<string> {
        let cache = JSON.parse(localStorage.getItem("kb_preview_cache") || "{}")
        if (cache[filepath]) {
            return cache[filepath]
        }
        let txt = await WebFS.connections.get(sessionName)?.readTxt(filepath)
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
        super("popupContent-fullscreen", "popupContainer", "popupExitBtn")
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
            WebFS.connections.clear()
            PageManager.open("login", {})
        }
        this.add(loginButton)
        let autoLogin = new FormCheckbox(
            "autoLogin",
            STRINGS.SETTINGS_AUTOLOGIN,
            "settingsCheckbox",
            localStorage.kb_autologin == 'true')
            autoLogin.onChange = (state: boolean) => {
            localStorage.kb_autologin = state
        }
        this.add(autoLogin)
    }

    public update(): void {}
}

export class UploadPopup extends ExitablePopup {
    public constructor(currentFolder: string, currentFile: string, triggerFullUpdate: CallableFunction) {
        super("popupContent-fullscreen", "popupContainer", "popupExitBtn")
        this.setClass("upload")
        this.add(new Module("div", STRINGS.UPLOAD_TITLE, "popupTitle"))
        this.add(new FormLabel(STRINGS.UPLOAD_SERVER))
        let sessions: string[] = []
        for(let sessionName of WebFS.connections.keys()) {
            sessions.push(sessionName)
        }
        let serverInput = new FormDropdown("sessionName", sessions, "")
        this.add(serverInput)
        this.add(new FormLabel(STRINGS.UPLOAD_FOLDERNAME))
        let folderInput = new FormInput("foldername", currentFolder, "text")
        folderInput.value(currentFolder)
        this.add(folderInput)
        this.add(new FormLabel(STRINGS.UPLOAD_FILENAME))
        let filenameInput = new FormInput("filename", currentFile, "text")
        filenameInput.value(currentFile)
        this.add(filenameInput)
        let emptyFile = new Button(STRINGS.UPLOAD_MARKDOWN, "buttonWide")
        emptyFile.onClick = async () => {
            let sessionName = serverInput.value()
            let instance = WebFS.connections.get(sessionName)
            if (instance == null) return
            sendBtn.htmlElement.disabled = true
            emptyFile.htmlElement.disabled = true
            let folder = folderInput.value()
            if (folder.endsWith("/")) {
                folder = folder.slice(0, folder.length - 1)
            }
            let filename = filenameInput.value()
            let path = folder + "/" + filename
            let result = await instance.putTxt(path, "", "")
            sendBtn.htmlElement.disabled = false
            emptyFile.htmlElement.disabled = false
            if (result) {
                this.dispose()
                triggerFullUpdate()
            } else {
                alert(STRINGS.UPLOAD_FAILED)
            }
        }
        this.add(emptyFile)
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
            let sessionName = serverInput.value()
            let instance = WebFS.connections.get(sessionName)
            if (instance == null) return
            sendBtn.htmlElement.disabled = true
            emptyFile.htmlElement.disabled = true
            let file = fileInput.htmlElement.files![0]
            let folder = folderInput.value()
            if (folder.endsWith("/")) {
                folder = folder.slice(0, folder.length - 1)
            }
            let filename = filenameInput.value()
            let path = folder + "/" + filename
            let result = await instance.putFile(path, file, "")
            sendBtn.htmlElement.disabled = false
            emptyFile.htmlElement.disabled = false
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
