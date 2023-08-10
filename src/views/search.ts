import { FileTree, WebFS } from "../webfs/client/webfs";
import { FormInput } from "../webui/form";
import { humanFriendlyDate } from "../webui/humanFriendlyDates";
import { CallLaterButOnlyOnce } from "../webui/lazy";
import { KWARGS, Module } from "../webui/module";
import { PageManager } from "../webui/pagemanager";
import { STRINGS } from "../language/default";

import "./search.css"

interface Entry {
    filepath: string
    modified: Date
    score?: number
}


export class Search extends Module<HTMLDivElement> {
    private searchField: FormInput
    private results: Module<HTMLDivElement>

    //private currentSearch: string | undefined = undefined
    private fileTree: FileTree | null = null
    private updateHashLater: CallLaterButOnlyOnce = new CallLaterButOnlyOnce(200)

    public constructor() {
        super("div")
        this.searchField = new FormInput("search", STRINGS.SEARCH_PLACEHOLDER, "search", "searchInput")
        this.searchField.onChange = (value: string) => {
            this.updateSearchResults()
            this.updateHashLater.defer(() => {
                PageManager.open("search", {q: value})
            })
        }
        this.add(this.searchField)
        this.results = new Module("div")
        this.results.setClass("searchResults")
        this.add(this.results)
    }

    public async update(kwargs: KWARGS, changedPage: boolean): Promise<void> {
        if (WebFS.instance == null) {
            PageManager.open("login", {})
            return
        }

        if (changedPage) {
            this.fileTree = await WebFS.instance?.walk(".")
            this.searchField.value(kwargs.q)
            this.updateSearchResults();
        }
    }

    private async updateSearchResults() {
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
        this.showNumResults(files);
        files = files.slice(0, 50); // Only take first 50 results
        for (let entry of files) {
            this.results.add(new SearchResult(entry.filepath, humanFriendlyDate(entry.modified)));
        }
    }

    private showNumResults(files: Entry[]) {
        let numResults = new Module("div");
        numResults.htmlElement.innerText = files.length + " " + STRINGS.SEARCH_NUM_RESULTS;
        numResults.setClass("searchNumResults");
        this.results.add(numResults);
    }

    private sortFilesByRelevance(files: Entry[], searchText: string): Entry[] {
        let keywords = searchText.toLowerCase().split(",").map((x: string) => x.trim());
        let results: Entry[] = [];
        for (let entry of files) {
            let { filename, folder } = splitFilepath(entry.filepath);
            var score = 0;
            for (let keyword of keywords) {
                if (keyword == "") {
                    score = 1;
                    continue;
                }
                let isFolder = keyword.startsWith("!");
                if (filename.toLowerCase().includes(keyword)) {
                    score += 100;
                }
                if (!isFolder && folder.toLowerCase().includes(keyword)) {
                    score += 1;
                }
                if (isFolder && folder.toLowerCase().startsWith(keyword.substring(1))) {
                    score += 100;
                }
            }
            if (score > 0) {
                results.push({filepath: entry.filepath, modified: entry.modified, score: score});
            }
        }
        return results.sort((a: Entry, b: Entry) => b.score! - a.score!);
    }

    private sortFilesByLastModified(files: Entry[]): Entry[] {
        return files.sort((a: Entry, b: Entry) => b.modified.toISOString().localeCompare(a.modified.toISOString()));
    }

    private flatten(fileTree: FileTree, pathPrefix: string = "", out: Entry[] = []): Entry[] {
        for (const filename in fileTree) {
            const value = fileTree[filename];
            if (!(typeof value === 'string')) {
                out = this.flatten(value as FileTree, pathPrefix + filename + "/", out)
            } else {
                out.push({filepath: pathPrefix + filename, modified: new Date(value as string)})
            }
        }
        return out
    }
}

class SearchResult extends Module<HTMLDivElement> {
    constructor(filepath: string, modified: string) {
        super("div")
        this.setClass("searchResult")
        let { filename, folder } = splitFilepath(filepath);

        let filename_parts = filename.split(".")
        let ext = filename_parts[filename_parts.length - 1].toLowerCase()
        
        if (ext == "png" || ext == "jpg" || ext == "jpeg" || ext == "pdf"){
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
        } else if (ext == "txt" || ext == "md" || ext == "py" || ext == "csv" || ext == "json") {
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
        header.innerText = filename
        header.classList.add("searchResultFilename")
        meta.appendChild(header)
        
        let modifiedElement = document.createElement("div")
        modifiedElement.innerText = STRINGS.SEARCH_LAST_MODIFIED + ": " + modified
        modifiedElement.classList.add("searchResultModified")
        meta.appendChild(modifiedElement)
        
        let folderElement = document.createElement("div")
        folderElement.innerText = folder
        folderElement.classList.add("searchResultFolder")
        meta.appendChild(folderElement)
        
        this.htmlElement.onclick = () => {
            PageManager.open("edit", {folder: folder, filename: filename})
            //WebFS.instance?.read(folder + "/" + filename, "_blank")
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
            console.log("cached")
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