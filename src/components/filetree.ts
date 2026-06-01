import "./filetree.css"
import { FileTree as WebFSFileTree, WebFS } from "../webfs/client/webfs";
import { FormInput } from "../webui/components/form";
import { KWARGS, Module } from "../webui/module";
import { PageManager } from "../webui/pagemanager";
import { STRINGS } from "../language/default";
import { search, SearchResult } from "./filetreesearch";
import { fileTreeManager } from "./filetreemanager";
import { FileTreeEntry, TreeNode } from "./parts/filetreeentry";
import { buildFileContextMenu, buildFolderContextMenu } from "./parts/fileContextMenus";

export class FileTree extends Module<HTMLDivElement> {
    private searchField: FormInput
    private entriesView: Module<HTMLDivElement>

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
        
        // Subscribe to manager updates
        fileTreeManager.subscribe(() => this.triggerFullUpdate());
    }

    private triggerFullUpdate() {
        this.update({search: this.searchField.value()}, true)
    }

    public async update(kwargs: KWARGS, changedPage: boolean): Promise<void> {
        if (WebFS.connections.size < 1) {
            this.entriesView.htmlElement.innerHTML = STRINGS.FILETREE_MISSING_CONNECTIONS
            return
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
        for (let sessionName of WebFS.connections.keys()) {
            if (fileTreeManager.isOffline(sessionName)) {
                if (offline == "") {
                    offline = STRINGS.FILETREE_OFFLINE
                }
                offline += " " + sessionName
            }
        }
        if (offline != "") {
            let module = new Module("div", offline, "filetreeOfflineStatus");
            this.entriesView.add(module);
        }
    }

    private async renderSearchResults(searchText: string, showMax: number) {
        let files = search(fileTreeManager.getAllFileTrees(), searchText)
        let numResults = files.length;
        files = files.slice(0, showMax); // Only take first 50 results
        for (let entry of files) {
            this.entriesView.add(new SearchResult(
                entry.filepath,
                entry.sessionName,  
                entry.modified,
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

        for (let sessionName of WebFS.connections.keys()) {
            let node = new FileTreeFolderNode("", sessionName, null, async () => await fileTreeManager.getFileTree(sessionName));
            filetreeList.add(node);
        }
        this.entriesView.add(filetreeList);
    }
}

/**
 * New tree node implementation using FileTreeEntry and shared menu builders
 */
class FileTreeFolderNode extends Module<HTMLDivElement> {
    private entry: FileTreeEntry;
    private folderContent: Module<HTMLUListElement>;
    private childElements: WebFSFileTree | null;
    private getChildElements: CallableFunction | null;
    private sessionName: string;
    private fullPath: string;

    constructor(
        path: string,
        private name: string,
        childElements: WebFSFileTree | null,
        getChildElements: CallableFunction | null = null,
    ) {
        super("div", "", "filetreeNodeWrapper");
        this.childElements = childElements;
        this.getChildElements = getChildElements;
        this.sessionName = path === "" ? name : path.split("/")[0];
        this.fullPath = path === "" ? "" : path + "/" + name;

        // Determine if this is a root server node or a folder
        const isRoot = path === "";
        const hasChildren = childElements == null || Object.keys(childElements).length > 0;

        // Create TreeNode for FileTreeEntry
        const node: TreeNode = {
            name: name,
            path: this.fullPath,
            isFolder: true,
            hasChildren: hasChildren,
            isExpanded: this.isExpandedFolder()
        };

        // Build menu actions using shared builder
        const actions = buildFolderContextMenu(this.sessionName, this.fullPath);

        // Create FileTreeEntry with connection status for top-level folders
        let connectionStatus: 'connected' | 'offline' | 'undefined' = "undefined"
        if (isRoot) {
            connectionStatus = fileTreeManager.getConnectivityStatus(this.sessionName);
        }
        this.entry = new FileTreeEntry(node, actions, connectionStatus);

        // Set up click handler for navigation
        this.entry.getButton().onClick = () => {
            this.toggleExpand();
        };

        // Set up expand callback
        this.entry.setOnExpand(() => {
            this.toggleExpand();
        });

        // Create folder content container
        this.folderContent = new Module<HTMLUListElement>("ul");
        this.folderContent.htmlElement.style.display = node.isExpanded ? "" : "none";

        this.add(this.entry);
        this.add(this.folderContent);

        // Auto-expand if it was previously expanded
        if (node.isExpanded) {
            this.loadChildren();
        }

    }


    private isExpandedFolder(): boolean {
        return fileTreeManager.isFolderExpanded(this.getURI());
    }

    private setExpandedFolder(): void {
        fileTreeManager.setExpandedFolder(this.getURI());
    }

    private unsetExpandedFolder(): void {
        fileTreeManager.unsetExpandedFolder(this.getURI());
    }

    private getURI(): string {
        if (this.fullPath === "") {
            return this.sessionName + ":./";
        }
        let uri = this.sessionName + ":" + this.fullPath.replaceAll(this.sessionName + "/", "")
        return uri
    }

    private async toggleExpand() {
        const isCurrentlyExpanded = this.folderContent.htmlElement.style.display !== "none";
        
        if (isCurrentlyExpanded) {
            this.folderContent.htmlElement.style.display = "none";
            this.entry.setIsExpanded(false);
            this.unsetExpandedFolder();
        } else {
            this.folderContent.htmlElement.style.display = "";
            this.entry.setIsExpanded(true);
            this.setExpandedFolder();
            await this.loadChildren();
        }
    }

    private async loadChildren() {
        if (this.folderContent.htmlElement.children.length > 0) {
            return; // Already loaded
        }

        let path = this.fullPath;
        let isRoot = false;
        if (path === "") {
            isRoot = true
            path = this.name;
        }
        if (this.childElements == null) {
            if (this.getChildElements == null) return;
            this.childElements = await this.getChildElements();
        }
        if (isRoot) {
            this.entry.setConnectionStatus(fileTreeManager.getConnectivityStatus(this.sessionName));
        }

        const folders: FileTreeFolderNode[] = [];
        const files: FileTreeFileNode[] = [];
        const filenames: string[] = [];

        for (const filename in this.childElements) {
            filenames.push(filename);
        }

        filenames.sort((a: string, b: string) => a.toLowerCase().localeCompare(b.toLowerCase()));

        for (const filename of filenames) {
            const value = this.childElements![filename];
            if (!(typeof value === 'string')) {
                folders.push(new FileTreeFolderNode(path, filename, value));
            } else {
                files.push(new FileTreeFileNode(path, filename, value, this.sessionName));
            }
        }

        for (const entry of folders) {
            this.folderContent.add(entry);
        }
        for (const entry of files) {
            this.folderContent.add(entry);
        }
    }
}

class FileTreeFileNode extends Module<HTMLLIElement> {
    private entry: FileTreeEntry;
    private sessionName: string;
    private fullPath: string;

    constructor(parentPath: string, name: string, _modified: string, parentSessionName: string) {
        super("li", "", "fileTreeFile");
        this.sessionName = parentSessionName;
        this.fullPath = (parentPath + "/" + name).replaceAll(this.sessionName + "/", "");

        const node: TreeNode = {
            name: name,
            path: this.fullPath,
            isFolder: false,
            hasChildren: false
        };

        // Build menu actions using shared builder
        const isStarred = fileTreeManager.isStarred(this.sessionName, this.fullPath);
        const actions = buildFileContextMenu(this.sessionName, this.fullPath, isStarred);

        this.entry = new FileTreeEntry(node, actions);

        // Set up click handler for navigation
        this.entry.getButton().onClick = () => {
            PageManager.update({view: this.getURI()});
        };

        this.add(this.entry);
    }


    private getURI(): string {
        return this.sessionName + ":" + this.fullPath;
    }
}
