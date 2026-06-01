import "./favourites.css"
import { Module } from "../webui/module";
import { fileTreeManager } from "./filetreemanager";
import { PageManager } from "../webui/pagemanager";
import { humanFriendlyDate } from "../webui/utils/humanFriendlyDates";
import { STRINGS } from "../language/default";
import { Button } from "../webui/components/form";
import { FileTree as WebFSFileTree } from "../webfs/client/webfs";

export class Favourites extends Module<HTMLDivElement> {
    private entriesView: Module<HTMLDivElement>

    public constructor() {
        super("div", "", "favourites")
        
        // Header
        let header = new Module("div", STRINGS.FAVOURITES_TITLE, "favouritesHeader");
        this.add(header);
        
        // Entries view
        this.entriesView = new Module("div", "", "favouritesEntries");
        this.add(this.entriesView);
        
        // Subscribe to manager updates
        fileTreeManager.subscribe(() => this.render());
    }

    public async update(): Promise<void> {
        await this.render();
    }

    private async render() {
        this.entriesView.htmlElement.innerHTML = "";
        
        let starredFiles = fileTreeManager.getStarredFiles();
        
        if (starredFiles.length === 0) {
            let emptyState = new Module("div", STRINGS.FAVOURITES_EMPTY, "favouritesEmpty");
            this.entriesView.add(emptyState);
            return;
        }
        
        for (let starred of starredFiles) {
            let fileTree = await fileTreeManager.getFileTree(starred.sessionName);
            if (!fileTree) continue;
            
            // Find file metadata in tree
            let metadata = this.findFileMetadata(fileTree, starred.path);
            if (!metadata) continue;
            
            let entry = new FavouriteEntry(
                starred.sessionName,
                starred.path,
                metadata.modified
            );
            this.entriesView.add(entry);
        }
    }
    
    private findFileMetadata(fileTree: WebFSFileTree, path: string): {modified: string | null} | null {
        // Navigate the tree to find the file and extract metadata
        let parts = path.split("/");
        let current: WebFSFileTree | string = fileTree;
        
        for (let i = 0; i < parts.length; i++) {
            let part = parts[i];
            if (part == ".") continue; // Skip current directory references

            if (typeof current === 'string') {
                // We've reached a file but still have path parts to traverse
                console.warn("Expected folder but found file while traversing path: " + path);
                return null;
            }
            if (!(part in current)) {
                // Path doesn't exist
                console.warn("Path part not found in filetree: " + part + " in path: " + path);
                return null;
            }
            current = current[part];
        }
        
        // After traversing all parts, check if we're at a file
        if (typeof current === 'string') {
            return { modified: current };
        }
        
        // It's a folder, not a file
        console.warn("Path points to a folder, not a file: " + path);
        return null;
    }
}

class FavouriteEntry extends Module<HTMLDivElement> {
    constructor(
        private sessionName: string,
        private path: string,
        private modified: string | null
    ) {
        super("div", "", "favouriteEntry");
        
        let filename = path.split("/").pop() || path;
        
        this.htmlElement.innerHTML = `
            <span class="favouriteIcon"></span>
            <span class="favouriteName">${filename}</span>
            <span class="favouritePath">${path}</span>
            <span class="favouriteSession">${sessionName}</span>
            ${modified ? `<span class="favouriteModified">${humanFriendlyDate(new Date(modified))}</span>` : ""}
        `;
        
        this.htmlElement.onclick = () => {
            let uri = sessionName + ":" + path;
            PageManager.update({view: uri});
        };
        
        // Add context menu button
        let menuButton = new Button("⋮", "favouriteMenuButton");
        menuButton.onClick = () => this.showMenu();
        this.add(menuButton);
    }
    
    private showMenu() {
        let menu = new FavouriteEntryMenu(this, this.sessionName, this.path);
        menu.htmlElement.style.display = "block";
        menu.htmlElement.style.position = "absolute";
        // Position logic similar to FileTreeElementMenu
        const rect = this.htmlElement.getBoundingClientRect();
        let cx = (rect.left + rect.right) / 2
        let cy = (rect.top + rect.bottom) / 2
        let W = window.innerWidth;
        let H = window.innerHeight;
        let availableSpaceRight = W - cx;
        let availableSpaceBelow = H - cy;

        // Adjust menu position based on available space
        if (availableSpaceBelow < menu.htmlElement.clientHeight) {
            menu.htmlElement.style.top = `${cy - menu.htmlElement.clientHeight}px`;
        } else {
            menu.htmlElement.style.top = `${cy}px`;
        }
    
        if (availableSpaceRight < menu.htmlElement.clientWidth) {
            menu.htmlElement.style.left = `${cx - menu.htmlElement.clientWidth}px`;
        } else {
            menu.htmlElement.style.left = `${cx}px`;
        }
    }
    
    public getURI(): string {
        let uri = this.sessionName + ":" + this.path;
        return uri;
    }
}

class FavouriteEntryMenu extends Module<HTMLDivElement> {
    private background: Module<HTMLDivElement>
    
    constructor(_parent: FavouriteEntry, sessionName: string, path: string) {
        super("div", "", "favouriteEntryMenu");
        
        let unstarAction = new Button("Unstar", "favouriteEntryMenuButton")
        unstarAction.onClick = () => { 
            this.close(); 
            fileTreeManager.removeStar(sessionName, path);
        }
        this.add(unstarAction)
        
        this.background = new Module<HTMLDivElement>("div", "", "toolPopupGrayout")
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
