import "./filetree.css"
import { FileTree as WebFSFileTree, WebFS } from "../webfs/client/webfs";
import { Button,  FormInput } from "../webui/components/form";
import { humanFriendlyDate } from "../webui/utils/humanFriendlyDates";
import { KWARGS, Module } from "../webui/module";
import { PageManager } from "../webui/pagemanager";
import { STRINGS } from "../language/default";
import { iconBars } from "../webui/icons";
import { SettingsPopup } from "./settings";
import { search, SearchResult } from "./filetreesearch";


export class FileTree extends Module<HTMLDivElement> {
    private searchField: FormInput
    private entriesView: Module<HTMLDivElement>

    //private currentSearch: string | undefined = undefined
    private fileTrees: Map<string, WebFSFileTree> = new Map<string, WebFSFileTree>()
    private offlineConnections: string[] = []

    public constructor() {
        super("div", "", "filetree")
        this.searchField = new FormInput("search", STRINGS.FILETREE_SEARCH_PLACEHOLDER, "search", "filetreeSearch")
        this.searchField.onChange = (_value: string) => {
            this.updateEntriesView()
        }
        this.searchField.onChangeDone = (value: string) => {
            PageManager.update({search: value})
        }
        this.add(this.searchField)
        this.entriesView = new Module("div")
        this.entriesView.setClass("filetreeEntries")
        this.add(this.entriesView)

        let settingsBtn = new Button(iconBars, "filetreeSettingsButton")
        settingsBtn.onClick = () => {new SettingsPopup()}
        this.add(settingsBtn)
    }

    private triggerFullUpdate() {
        this.update({search: this.searchField.value()}, true)
    }

    public async update(kwargs: KWARGS, changedPage: boolean): Promise<void> {
        if (WebFS.connections.size < 1) {
            this.fileTrees.clear()
            this.entriesView.htmlElement.innerHTML = STRINGS.FILETREE_MISSING_CONNECTIONS
            return
        }

        if (changedPage) {
            this.offlineConnections = []
            this.fileTrees.clear()
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
        this.updateEntriesView()
    }

    private async updateEntriesView(showMax: number = 50) {
        this.entriesView.htmlElement.innerHTML = "";
        this.showOfflineStatus();
        let searchText = this.searchField.value()
        if (searchText == "") {
            await this.renderFiletreeView()
        } else {
            await this.renderSearchResults(searchText, showMax)
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
            this.entriesView.add(module);
        }
    }

    private async renderSearchResults(searchText: string, showMax: number) {
        let files = search(this.fileTrees, searchText)
        let numResults = files.length;
        files = files.slice(0, showMax); // Only take first 50 results
        for (let entry of files) {
            this.entriesView.add(new SearchResult(
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
                this.updateEntriesView(showMax + 25);
            }
            this.entriesView.add(showMore);
        }
    }

    private async renderFiletreeView() {
        this.entriesView.htmlElement.innerHTML = "";
        let filetreeList = new Module<HTMLUListElement>("ul", "", "filetreeRoot");
        for (let [sessionName, fileTree] of this.fileTrees) {    
            filetreeList.add(new FileTreeFolder("", sessionName, fileTree))
        }
        this.entriesView.add(filetreeList);
    }
}

class FileTreeElement extends Module<HTMLLIElement> {
    constructor(name: string, isFolder: boolean) {
        super("li", "", isFolder ? "fileTreeFolder" : "fileTreeFile")
        let element = new Module<HTMLDivElement>("div", `<span class="${isFolder ? 'filetreeFolderIcon' : 'filetreeFileIcon'}"></span> ${name}`, "fileTreeElementTitle")
        
        element.htmlElement.addEventListener("click", () => {
            this.onClick()
        })
        this.add(element)
    }

    protected onClick() {}
}

class FileTreeFolder extends FileTreeElement {
    private folderContent: Module<HTMLUListElement>

    constructor(private path: string, private name: string, private children: WebFSFileTree) {
        super(name, true)
        
        this.folderContent = new Module<HTMLUListElement>("ul")
        this.folderContent.htmlElement.style.display = "none";
        this.add(this.folderContent)

    }

    protected onClick() {
        if (this.folderContent.htmlElement.style.display === "none") {
            this.folderContent.htmlElement.style.display = "";
            if (this.folderContent.htmlElement.children.length == 0) {
                let path = this.path + "/" + this.name
                let folders = []
                let files = []
                let filenames = []
                for (const filename in this.children) {
                    filenames.push(filename)
                }
                filenames = filenames.sort((a: string, b: string) => a.toLowerCase().localeCompare(b.toLowerCase()))
                for (const filename of filenames) {
                    let value = this.children[filename]
                    if (!(typeof value === 'string')) {
                        folders.push(new FileTreeFolder(path, filename, value))
                    } else {
                        files.push(new FileTreeFile(path, filename))
                    }
                }
                for (const entry of folders) {
                    this.folderContent.add(entry)
                }
                for (const entry of files) {
                    this.folderContent.add(entry)
                }
            }
        } else {
            this.folderContent.htmlElement.style.display = "none";
        }
    }
}

class FileTreeFile extends FileTreeElement {
    constructor(private path: string, private name: string) {
        super(name, false)
    }

    protected onClick(): void {
        alert("OPEN: " + this.path + "/" + this.name);
    }
}
