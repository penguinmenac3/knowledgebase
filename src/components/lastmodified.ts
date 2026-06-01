import "./lastmodified.css"
import { Module } from "../webui/module";
import { fileTreeManager } from "./filetreemanager";
import { PageManager } from "../webui/pagemanager";
import { humanFriendlyDate } from "../webui/utils/humanFriendlyDates";
import { STRINGS } from "../language/default";
import { FileTree as WebFSFileTree } from "../webfs/client/webfs";

export class LastModified extends Module<HTMLDivElement> {
    private entriesView: Module<HTMLDivElement>
    private showMax: number = 50

    public constructor() {
        super("div", "", "last-modified")
        
        // Header
        let header = new Module("div", STRINGS.LASTMODIFIED_TITLE, "lastModifiedHeader");
        this.add(header);
        
        // Entries view
        this.entriesView = new Module("div", "", "lastModifiedEntries");
        this.add(this.entriesView);
        
        // Subscribe to manager updates
        fileTreeManager.subscribe(() => this.render());
    }

    public async update(): Promise<void> {
        await this.render();
    }

    private async render() {
        this.entriesView.htmlElement.innerHTML = "";
        
        let allFileTrees = fileTreeManager.getAllFileTrees();
        let files = this.flattenAndSortFiles(allFileTrees);
        
        if (files.length === 0) {
            let emptyState = new Module("div", STRINGS.LASTMODIFIED_EMPTY, "lastModifiedEmpty");
            this.entriesView.add(emptyState);
            return;
        }
        
        let displayFiles = files.slice(0, this.showMax);
        
        for (let file of displayFiles) {
            let entry = new LastModifiedEntry(
                file.sessionName,
                file.path,
                file.modified
            );
            this.entriesView.add(entry);
        }
        
        if (files.length > this.showMax) {
            let showMore = new Module("div", STRINGS.LASTMODIFIED_SHOW_MORE, "lastModifiedShowMore");
            showMore.htmlElement.onclick = () => {
                this.showMax += 25;
                this.render();
            }
            this.entriesView.add(showMore);
        }
    }
    
    private flattenAndSortFiles(fileTrees: Map<string, WebFSFileTree>): Array<{
        sessionName: string,
        path: string,
        modified: string
    }> {
        let files: Array<{sessionName: string, path: string, modified: string}> = [];
        
        for (let [sessionName, fileTree] of fileTrees) {
            this.traverseTree(fileTree, "", sessionName, files);
        }
        
        // Sort by modified timestamp (descending)
        files.sort((a, b) => {
            return new Date(b.modified).getTime() - new Date(a.modified).getTime();
        });
        
        return files;
    }
    
    private traverseTree(
        tree: WebFSFileTree,
        currentPath: string,
        sessionName: string,
        files: Array<{sessionName: string, path: string, modified: string}>
    ) {
        for (let [name, value] of Object.entries(tree)) {
            if (typeof value === 'string') {
                // It's a file (value is modified timestamp)
                let path = currentPath ? `${currentPath}/${name}` : name;
                files.push({
                    sessionName: sessionName,
                    path: path,
                    modified: value
                });
            } else {
                // It's a folder (value is nested tree)
                let path = currentPath ? `${currentPath}/${name}` : name;
                this.traverseTree(value, path, sessionName, files);
            }
        }
    }
}

class LastModifiedEntry extends Module<HTMLDivElement> {
    constructor(
        private sessionName: string,
        private path: string,
        private modified: string
    ) {
        super("div", "", "lastModifiedEntry");
        
        let filename = path.split("/").pop() || path;
        
        this.htmlElement.innerHTML = `
            <span class="lastModifiedIcon"></span>
            <span class="lastModifiedName">${filename}</span>
            <span class="lastModifiedPath">${path}</span>
            <span class="lastModifiedSession">${sessionName}</span>
            <span class="lastModifiedDate">${humanFriendlyDate(new Date(modified))}</span>
        `;
        
        this.htmlElement.onclick = () => {
            let uri = sessionName + ":" + path;
            PageManager.update({view: uri});
        };
    }
}
