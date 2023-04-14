import { FileTree, WebFS } from "../WebFS/webfs";
import { FormInput } from "../framework/form";
import { humanFriendlyDate } from "../framework/humanFriendlyDates";
import { CallLaterButOnlyOnce } from "../framework/lazy";
import { KWARGS, Module } from "../framework/module";
import { PageManager } from "../framework/pagemanager";
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

    private currentSearch: string | undefined = undefined
    private updateHashLater: CallLaterButOnlyOnce = new CallLaterButOnlyOnce(1000)

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

    public async update(kwargs: KWARGS): Promise<void> {
        if (WebFS.instance == null) {
            PageManager.open("login", {})
            return
        }
        this.searchField.value(kwargs.q)
        this.updateSearchResults();
    }

    private async updateSearchResults() {
        let searchText = this.searchField.value()
        if (this.currentSearch == searchText) return
        this.currentSearch = searchText

        let fileTree = await WebFS.instance?.walk(".")
        if (fileTree == null) {
            alert(STRINGS.SEARCH_FILETREE_IS_NULL)
            return
        }

        let files = this.flatten(fileTree);
        files = this.sortFilesByLastModified(files);
        files = this.sortFilesByRelevance(files, searchText);
        files = files.slice(0, 50); // Only take first 50 results

        this.results.htmlElement.innerHTML = "";
        for (let entry of files) {
            this.results.add(new SearchResult(entry.filepath, humanFriendlyDate(entry.modified)));
        }
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
            WebFS.instance?.read(folder + "/" + filename, "_blank")
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

