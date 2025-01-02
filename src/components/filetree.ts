import "./filetree.css"
import { FileTree as WebFSFileTree, WebFS } from "../webfs/client/webfs";
import { Button,  FormInput, FormLabel } from "../webui/components/form";
import { humanFriendlyDate } from "../webui/utils/humanFriendlyDates";
import { KWARGS, Module } from "../webui/module";
import { PageManager } from "../webui/pagemanager";
import { STRINGS } from "../language/default";
import { iconBars, iconDots } from "../webui/icons";
import { SettingsPopup } from "./settings";
import { search, SearchResult } from "./filetreesearch";
import { UploadNewFilePopup } from "./uploadFilePopup";
import { ConfirmCancelPopup, ExitablePopup } from "../webui/components/popup";


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
        let iconClass = isFolder ? 'filetreeFolderIcon' : 'filetreeFileIcon'
        if (path == "") {
            iconClass = 'filetreeServerIcon'
        }
        element.htmlElement.innerHTML += `<span class="${iconClass}"></span> ${name.replaceAll("_", " ")}`;
        this.add(element);
    }

    protected onClick() {}

    protected showMenu() {
        let menu = new FileTreeElementMenu(this, this.isFolder, this.path != "", !this.hasChildren && this.path != "");
        menu.htmlElement.style.display = "block";
        menu.htmlElement.style.position = "absolute";
        const rect = this.elementSettings.htmlElement.getBoundingClientRect();
        let cx = (rect.left + rect.right) / 2
        let cy = (rect.top + rect.bottom) / 2
        let W = window.innerWidth;
        let H = window.innerHeight;
        let availableSpaceRight = W - cx;
        let availableSpaceBelow = H - cy;
        console.log(menu.htmlElement.getBoundingClientRect())
        console.log(availableSpaceBelow, menu.htmlElement.clientHeight)
        console.log(availableSpaceRight, menu.htmlElement.clientWidth)

        // Adjust menu position based on available space
        if (availableSpaceBelow < menu.htmlElement.clientHeight) {
            // If not enough space below, place it above the button
            menu.htmlElement.style.top = `${cy - menu.htmlElement.clientHeight}px`;
        } else {
            // Otherwise, place it below the button
            menu.htmlElement.style.top = `${cy}px`;
        }
    
        if (availableSpaceRight < menu.htmlElement.clientWidth) {
            // If not enough space to the right, place it to the left of the button
            menu.htmlElement.style.left = `${cx - menu.htmlElement.clientWidth}px`;
        } else {
            // Otherwise, place it to the right of the button
            menu.htmlElement.style.left = `${cx}px`;
        }
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
        let uri = this.getURI()
        let sessionName = uri.split(":")[0]
        let path = uri.split(":")[1]
        let session = WebFS.connections.get(sessionName)
        if (session == null) {
            alert(STRINGS.FILETREE_INVALID_SESSION)
            return
        }
        session.mkdir(path + "/New Folder")
        location.reload()
    }

    public async rename() {
        let uri = this.getURI()
        let sessionName = uri.split(":")[0]
        let path = uri.split(":")[1]
        let session = WebFS.connections.get(sessionName)
        if (session == null) {
            alert(STRINGS.FILETREE_INVALID_SESSION)
            return
        }

        let renamePopup = new ExitablePopup()
        renamePopup.htmlElement.style.width = "87%"
        renamePopup.htmlElement.style.maxWidth = "40em"

        renamePopup.add(new FormLabel(STRINGS.FILETREE_RENAME_CURRENT_PATH))
        let current_path = new FormInput("current_path", "", "text")
        current_path.value(path)
        current_path.htmlElement.disabled = true
        renamePopup.add(current_path)

        renamePopup.add(new FormLabel(STRINGS.FILETREE_RENAME_NEW_PATH))
        let new_path = new FormInput("current_path", "", "text")
        new_path.value(path)
        renamePopup.add(new_path)

        let confirmButton = new Button(STRINGS.FILETREE_RENAME_CONFIRM, "buttonWide")
        confirmButton.setClass("good")
        confirmButton.onClick = () => {
            session.mv(path, new_path.value())
            location.reload()
        }
        renamePopup.add(confirmButton)
    }

    public async delete() {
        let uri = this.getURI()
        let sessionName = uri.split(":")[0]
        let path = uri.split(":")[1]
        let session = WebFS.connections.get(sessionName)
        if (session == null) {
            alert(STRINGS.FILETREE_INVALID_SESSION)
            return
        }
        let md5 = ""
        if (!this.isFolder) {
            let md5 = await session.md5(path)
            if (md5 == null) {
                alert(STRINGS.VIEWER_READ_MD5_ERROR)
                return
            }
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
                session.rmdir(path)
            } else {
                session.rm(path, md5)
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
        if (this.isExpandedFolder()) {
            this.onClick()
        }
    }

    private isExpandedFolder(): boolean {
        if (!localStorage.kb_filetree_expanded_folders) {
            localStorage.kb_filetree_expanded_folders = "[]"
        }
        let folders: string[] = JSON.parse(localStorage.kb_filetree_expanded_folders)
        return folders.includes(this.getURI())
    }

    private setExpandedFolder(): void {
        if (!this.isExpandedFolder()) {
            let folders: string[] = JSON.parse(localStorage.kb_filetree_expanded_folders)
            folders.push(this.getURI())
            localStorage.kb_filetree_expanded_folders = JSON.stringify(folders)
        }
    }

    private unsetExpandedFolder(): void {
        if (this.isExpandedFolder()) {
            let folders: string[] = JSON.parse(localStorage.kb_filetree_expanded_folders)
            let uri = this.getURI()
            folders = folders.filter((ele, _) => ele != uri)
            localStorage.kb_filetree_expanded_folders = JSON.stringify(folders)
        }
    }

    protected onClick() {
        if (this.folderContent.htmlElement.style.display === "none") {
            this.folderContent.htmlElement.style.display = "";
            this.setExpandedFolder()
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
            this.unsetExpandedFolder()
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