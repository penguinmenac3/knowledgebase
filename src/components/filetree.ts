import "./filetree.css"
import { FileTree as WebFSFileTree, WebFS } from "../webfs/client/webfs";
import { Button,  FormInput } from "../webui/components/form";
import { humanFriendlyDate } from "../webui/utils/humanFriendlyDates";
import { KWARGS, Module } from "../webui/module";
import { PageManager } from "../webui/pagemanager";
import { STRINGS } from "../language/default";
import { iconBars } from "../webui/icons";
import { SettingsPopup } from "./settings";


interface Entry {
    filepath: string
    sessionName: string,
    modified: Date | null
    isFolder: boolean
    score?: number
}


export class FileTree extends Module<HTMLDivElement> {
    private searchField: FormInput
    private results: Module<HTMLDivElement>

    //private currentSearch: string | undefined = undefined
    private fileTrees: Map<string, WebFSFileTree> = new Map<string, WebFSFileTree>()
    private offlineConnections: string[] = []

    public constructor() {
        super("div", "", "filetree")
        this.searchField = new FormInput("search", STRINGS.FILETREE_SEARCH_PLACEHOLDER, "search", "filetreeSearch")
        this.searchField.onChange = (_value: string) => {
            this.updateSearchResults()
        }
        this.searchField.onChangeDone = (value: string) => {
            PageManager.update({search: value})
        }
        this.add(this.searchField)
        this.results = new Module("div")
        this.results.setClass("filetreeEntries")
        this.add(this.results)

        let settingsBtn = new Button(iconBars, "filetreeSettingsButton")
        settingsBtn.onClick = () => {
            let settingsPopup = new SettingsPopup()
            settingsPopup.onExit = this.updateSearchResults.bind(this)
        }
        this.add(settingsBtn)
    }

    private triggerFullUpdate() {
        this.update({search: this.searchField.value()}, true)
    }

    public async update(kwargs: KWARGS, changedPage: boolean): Promise<void> {
        if (WebFS.connections.size < 1) {
            this.fileTrees.clear()
            this.results.htmlElement.innerHTML = STRINGS.FILETREE_MISSING_CONNECTIONS
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
        this.searchField.value(kwargs.search)
        this.updateSearchResults();
    }

    private async updateSearchResults(showMax: number = 50) {
        let searchText = this.searchField.value()
        if (searchText == "") {
            searchText = "/"
        }
        this.results.htmlElement.innerHTML = "";
        let files: Entry[] = []
        for (let [sessionName, filetree] of this.fileTrees) {
            let tmp = this.flatten(sessionName, filetree)
            files = files.concat(tmp)
        }

        if (files.length == 0) {
            alert(STRINGS.FILETREE_FILETREE_IS_NULL)
            return
        }

        files = this.sortFilesByFolderAndName(files);
        if (searchText != "") {
            files = this.sortFilesByLastModified(files);
            files = this.sortFilesByRelevance(files, searchText);
            this.showOfflineStatus();
        }
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
            showMore.htmlElement.innerText = STRINGS.FILETREE_MORE_RESULTS;
            showMore.htmlElement.onclick = () => {
                this.updateSearchResults(showMax + 25);
            }
            this.results.add(showMore);
        }
    }

    private showOfflineStatus() {
        let offline = ""
        for (let sessionName of this.offlineConnections) {
            if (offline == "") {
                offline =  STRINGS.FILETREE_OFFLINE
            }
            offline +=  " " + sessionName
        }
        if (offline != "") {
            let module = new Module("div", offline, "filetreeOfflineStatus");
            this.results.add(module);
        }
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
    
    private sortFilesByFolderAndName(files: Entry[]): Entry[] {
        return files.sort((a: Entry, b: Entry) => {
            // Things which do not have a modified date should be put at the end.
            if (a.filepath == null) return 1
            if (b.filepath == null) return -1
            return a.filepath.localeCompare(b.filepath)
        });
    }

    private flatten(sessionName: string, fileTree: WebFSFileTree, pathPrefix: string = "", out: Entry[] = []): Entry[] {
        for (const filename in fileTree) {
            var value = fileTree[filename];
            if (!(typeof value === 'string')) {
                out = this.flatten(sessionName, value as WebFSFileTree, pathPrefix + filename + "/", out)
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

class SearchResult extends Module<HTMLDivElement> {
    constructor(filepath: string, sessionName: string, _modified: string, isFolder: boolean, searchField: FormInput, _triggerFullUpdate: CallableFunction) {
        super("div")
        this.setClass("searchResult")
        let { filename, folder } = splitFilepath(filepath);

        let filename_parts = filename.split(".")
        if (isFolder) filename_parts.push("DIR")

        this.htmlElement.innerHTML = filename
        
        this.htmlElement.onclick = () => {
            if (isFolder) {
                searchField.htmlElement.value = "/" + filepath
                searchField.onChange(searchField.htmlElement.value)
                searchField.onChangeDone(searchField.htmlElement.value)
            } else {
                let uri = sessionName + ":" + folder + "/" + filename
                PageManager.update({view: uri})
            }
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

