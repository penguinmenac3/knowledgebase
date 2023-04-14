import { FileTree, WebFS } from "../WebFS/webfs";
import { FormInput } from "../framework/form";
import { humanFriendlyDate } from "../framework/humanFriendlyDates";
import { KWARGS, Module } from "../framework/module";
import { PageManager } from "../framework/pagemanager";
import { STRINGS } from "../language/default";

import "./search.css"

export class Search extends Module<HTMLDivElement> {
    private searchField: FormInput
    private results: Module<HTMLDivElement>
    public constructor() {
        super("div")
        this.searchField = new FormInput("search", STRINGS.SEARCH_PLACEHOLDER, "text", "searchInput")
        this.searchField.onChange = (value: string) => {
            // Maybe make lazy: Only do after 1000 ms no change?
            PageManager.open("search", {q: value})
        }
        this.add(this.searchField)
        this.results = new Module("div")
        this.results.setClass("searchResults")
        this.add(this.results)
    }

    public async update(kwargs: KWARGS): Promise<void> {
        if (WebFS.instance == null) {
            PageManager.open("login", {})
            return
        }

        let fileTree = await WebFS.instance.walk(".")
        if (fileTree == null) {
            alert(STRINGS.SEARCH_FILETREE_IS_NULL)
            return
        }
        
        let files = this.flatten(fileTree)

        if (kwargs.q) {
            if ("" == this.searchField.value()) {
                this.searchField.value(kwargs.q)
            }
        } else {
            this.searchField.value("")
        }
        let keywords = this.searchField.value().toLowerCase().split(",").map((x: string) => x.trim())
        let data = []
        for (const [filename, modified] of files.entries()) {
            data.push([filename, modified])
        }
        // Sort by modified
        data = data.sort((a: any, b: any) => b[1].toISOString().localeCompare(a[1].toISOString()))

        // Sort by matching keywords from search
        let results = []
        for (let [filepath, modified] of data) {
            let { filename, folder } = splitFilepath(filepath as string);
            var score = 0
            for (let keyword of keywords) {
                if (keyword == "") {
                    score = 1
                    continue
                }
                let isFolder = keyword.startsWith("!")
                if (filename.toLowerCase().includes(keyword)) {
                    score += 100
                }
                if (!isFolder && folder.toLowerCase().includes(keyword)) {
                    score += 1
                }
                if (isFolder && folder.toLowerCase().startsWith(keyword.substring(1))) {
                    score += 100
                }
            }
            if (score > 0) {
                results.push([score, filepath, modified])
            }
        }
        results = results.sort((a: any, b: any) => b[0] - a[0])
        this.results.htmlElement.innerHTML = ""
        for (let [score, filename, modified] of results) {
            this.results.add(new SearchResult(filename as string, humanFriendlyDate(modified as Date)))
        }
    }

    private flatten(fileTree: FileTree, pathPrefix: string = "", out = new Map<string, Date>()): Map<string, Date> {
        for (const filename in fileTree) {
            const value = fileTree[filename];
            if (!(typeof value === 'string')) {
                out = this.flatten(value as FileTree, pathPrefix + filename + "/", out)
            } else {
                out.set(pathPrefix + filename, new Date(value as string))
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
        
        let header = document.createElement("div")
        header.innerText = filename
        header.classList.add("searchResultFilename")
        this.htmlElement.appendChild(header)
        
        let modifiedElement = document.createElement("div")
        modifiedElement.innerText = STRINGS.SEARCH_LAST_MODIFIED + ": " + modified
        modifiedElement.classList.add("searchResultModified")
        this.htmlElement.appendChild(modifiedElement)
        
        let folderElement = document.createElement("div")
        folderElement.innerText = folder
        folderElement.classList.add("searchResultFolder")
        this.htmlElement.appendChild(folderElement)
        
        this.htmlElement.onclick = () => {
            PageManager.open("edit", {folder: folder, file: filename})
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

