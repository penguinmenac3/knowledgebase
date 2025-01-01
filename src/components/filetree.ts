import "./filetree.css"
import { FileTree as WebFSFileTree, WebFS } from "../webfs/client/webfs";
import { Button,  FormInput } from "../webui/components/form";
import { humanFriendlyDate } from "../webui/utils/humanFriendlyDates";
import { KWARGS, Module } from "../webui/module";
import { PageManager } from "../webui/pagemanager";
import { STRINGS } from "../language/default";
import { iconBars, iconDots } from "../webui/icons";
import { SettingsPopup } from "./settings";
import { search, SearchResult } from "./filetreesearch";
import { UploadNewFilePopup } from "./uploadFilePopup";
import { ConfirmCancelPopup } from "../webui/components/popup";


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
        if (this.searchField.value() != kwargs.search || changedPage) {
            this.searchField.value(kwargs.search)
            this.updateEntriesView()
        }
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
    private elementSettings: Button

    constructor(protected path: string, protected name: string, private isFolder: boolean, private hasChildren: boolean) {
        super("li", "", isFolder ? "fileTreeFolder" : "fileTreeFile");

        this.elementSettings = new Button(iconDots, "fileTreeElementSettings");
        this.elementSettings.setClass("right");
        this.elementSettings.onClick = () => { this.showMenu(); };
        this.add(this.elementSettings);

        let element = new Button("", "fileTreeElementTitle");
        element.onClick = () => { this.onClick(); };
        element.htmlElement.innerHTML += `<span class="${isFolder ? 'filetreeFolderIcon' : 'filetreeFileIcon'}"></span> ${name.replaceAll("_", " ")}`;
        this.add(element);
    }

    protected onClick() {}

    protected showMenu() {
        let menu = new FileTreeElementMenu(this, this.isFolder, this.path != "", !this.hasChildren && this.path != "");
        const rect = this.elementSettings.htmlElement.getBoundingClientRect();
        let W = window.innerWidth;
        let H = window.innerHeight;
        // TODO ensure the menu popup is within the window bounds and does not extend beyond bottom or right edge
        menu.htmlElement.style.left = `${rect.left}px`;
        menu.htmlElement.style.top = `${rect.bottom}px`;
        menu.htmlElement.style.display = "block";
        menu.htmlElement.style.position = "absolute";
    }

    protected getURI(): string {
        let uri = this.path + "/" + this.name
        uri = uri.replace("/", "").replace("/", ":./")
        if (!uri.includes(":./")) {
            uri = uri + ":./"
        }
        return uri
    }

    public async newFile() {
        new UploadNewFilePopup(this.getURI(), "", () => location.reload())
    }

    public async newFolder() {
        alert("New Folder not implemented");
    }

    public async rename() {
        alert("Rename not implemented");
    }

    public async delete() {
        let uri = this.getURI()
        let sessionName = uri.split(":")[0]
        let path = uri.split(":")[1]
        let session = WebFS.connections.get(sessionName)
        let md5 = await session?.md5(path)
        if (md5 == null) {
            alert(STRINGS.VIEWER_READ_MD5_ERROR)
            return
        }
        let popup = new ConfirmCancelPopup(
            "popupContent", "popupContainer",
            STRINGS.FILETREE_DELETE_QUESTION + " " + this.path + "/" + this.name,
            STRINGS.FILETREE_DELETE_CANCEL,
            STRINGS.FILETREE_DELETE_CONFIRM,
        )
        popup.onConfirm = () => {}
        popup.onCancel = () => {
            if (this.isFolder) {
                session?.rmdir(path)
            } else {
                session?.rm(path, md5)
            }
            location.reload()
        }
    }
}

class FileTreeFolder extends FileTreeElement {
    private folderContent: Module<HTMLUListElement>

    constructor(path: string, name: string, private children: WebFSFileTree) {
        super(path, name, true, Object.keys(children).length > 0)
        
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
    constructor(path: string, name: string) {
        super(path, name, false, false)
    }

    protected onClick(): void {
        PageManager.update({view: this.getURI()})
    }
}


class FileTreeElementMenu extends Module<HTMLDivElement> {
    private background: Module<HTMLDivElement>

    constructor(parent: FileTreeElement, isFolder: boolean, isMovable: boolean, isDeletable: boolean) {
        super("div", "", "filetreeElementMenu");

        if (isFolder) {
            let newFileAction = new Button("New File", "filetreeElementMenuButton")
            newFileAction.onClick = () => { this.close(); parent.newFile(); }
            this.add(newFileAction)
            let newFolderAction = new Button("New Folder", "filetreeElementMenuButton")
            newFolderAction.onClick = () => { this.close(); parent.newFolder(); }
            this.add(newFolderAction)
        }
        if (isMovable) {
            let renameAction = new Button("Move", "filetreeElementMenuButton")
            renameAction.onClick = () => { this.close(); parent.rename(); }
            this.add(renameAction)
        }
        if (isDeletable) {
            let deleteAction = new Button("Delete", "filetreeElementMenuButton")
            deleteAction.onClick = () => { this.close(); parent.delete(); }
            this.add(deleteAction)
        }

        this.background = new Module<HTMLDivElement>("div", "", "popupContainer")
        this.background.htmlElement.style.backgroundColor = "transparent"
        this.background.htmlElement.onclick = () => {
            this.close()
        }
        document.body.appendChild(this.background.htmlElement)
        document.body.appendChild(this.htmlElement)
    }

    private close() {
        document.body.removeChild(this.background.htmlElement)
        document.body.removeChild(this.htmlElement)
    }
}