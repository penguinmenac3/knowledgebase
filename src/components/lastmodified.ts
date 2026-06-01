import "./lastmodified.css"
import { Module, KWARGS } from "../webui/module";
import { fileTreeManager } from "./filetreemanager";
import { PageManager } from "../webui/pagemanager";
import { STRINGS } from "../language/default";
import { FileTree as WebFSFileTree, WebFS } from "../webfs/client/webfs";
import { FileEntry } from "./parts/fileentry";
import { buildFileContextMenu } from "./parts/fileContextMenus";
import { Button, FormInput } from "../webui/components/form";

export class LastModified extends Module<HTMLDivElement> {
    private entriesView: Module<HTMLDivElement>
    private filetreeButtons: Module<HTMLDivElement>
    private searchField: FormInput
    private showMax: number = 50
    private starredOnly: boolean = false
    private searchQuery: string = ""
    private selectedFileTrees: Set<string> = new Set()
    private filterButtons: Map<string, Button> = new Map()
    private loadingSessions: Set<string> = new Set()
    private isUpdatingFromLastModified: boolean = false

    public constructor() {
        super("div", "", "last-modified")
        
        // Initialize default selection from current view
        this.initializeDefaultSelection();
        
        // Search row
        let searchRow = new Module("div", "", "lastModifiedSearchRow");
        this.searchField = new FormInput("search", STRINGS.LASTMODIFIED_SEARCH_PLACEHOLDER, "search", "lastModifiedSearch");
        this.searchField.onChange = (value: string) => {
            this.searchQuery = value;
            this.render();
        };
        this.searchField.onChangeDone = (value: string) => {
            PageManager.update({search: value});
        };
        searchRow.add(this.searchField);
        this.add(searchRow);
        
        // Filter buttons row
        let filterRow = new Module("div", "", "lastModifiedFilterRow");
        
        // Star toggle button (leftmost)
        let starButton = new Button("★", "lastModifiedStarButton");
        starButton.onClick = () => {
            this.starredOnly = !this.starredOnly;
            this.updateStarButton();
            this.render();
        };
        filterRow.add(starButton);
        
        // Filetree selector buttons
        this.filetreeButtons = new Module("div", "", "lastModifiedFiletreeButtons");
        filterRow.add(this.filetreeButtons);
        
        this.add(filterRow);
        
        // Entries view
        this.entriesView = new Module("div", "", "lastModifiedEntries");
        this.add(this.entriesView);
        
        // Subscribe to manager updates
        fileTreeManager.subscribe(() => {
            if (!this.isUpdatingFromLastModified) {
                this.syncSelectionWithExpandedFolders();
                this.updateFiletreeButtons();
                this.render();
            }
        });
        
        // Initialize filetree buttons
        this.updateFiletreeButtons();
    }
    
    private initializeDefaultSelection() {
        // Always sync with filetree expanded state as the primary source of truth
        this.syncSelectionWithExpandedFolders();
    }

    private syncSelectionWithExpandedFolders() {
        const expandedFolders = fileTreeManager.getExpandedFolders();
        // Extract session names from expanded folder URIs
        const expandedSessions = new Set<string>();
        for (const uri of expandedFolders) {
            // Extract session name from URI (format: "sessionName:path")
            const sessionName = uri.split(":")[0];
            const sessionPath = uri.split(":")[1];
            if (sessionName && sessionPath && sessionPath == "./") {
                expandedSessions.add(sessionName);
            }
        }
        // Update selection to match expanded folders
        this.selectedFileTrees = expandedSessions;
    }
    
    private updateStarButton() {
        let starButton = this.htmlElement.querySelector(".lastModifiedStarButton") as HTMLAnchorElement;
        if (starButton) {
            starButton.classList.toggle("active", this.starredOnly);
        }
    }
    
    private updateFiletreeButtons() {
        this.filetreeButtons.htmlElement.innerHTML = "";
        this.filterButtons.clear();
        
        // Get all sessions from localStorage (not just connected ones)
        let allSessions: string[] = [];
        if (localStorage.kb_sessions) {
            allSessions = JSON.parse(localStorage.kb_sessions);
        }
        let sessionNames = allSessions.sort();
        
        // Get connected filetrees to check which are loaded
        let allFileTrees = fileTreeManager.getAllFileTrees();
        
        // "All" button
        let allButton = new Button(STRINGS.LASTMODIFIED_FILTER_ALL, "lastModifiedFilterButton");
        // "All" button is active when all sessions are selected
        if (this.selectedFileTrees.size === sessionNames.length && sessionNames.length > 0) {
            allButton.htmlElement.classList.add("active");
        }
        allButton.onClick = () => {
            this.isUpdatingFromLastModified = true;
            // If all sessions are currently selected, deselect all
            // Otherwise, select all sessions
            if (this.selectedFileTrees.size === sessionNames.length && sessionNames.length > 0) {
                this.selectedFileTrees.clear();
                // Collapse all folders in filetree
                for (let sessionName of sessionNames) {
                    fileTreeManager.unsetExpandedFolder(sessionName + ":./");
                }
            } else {
                this.selectedFileTrees.clear();
                for (let sessionName of sessionNames) {
                    this.selectedFileTrees.add(sessionName);
                    // Expand folder in filetree
                    fileTreeManager.setExpandedFolder(sessionName + ":./");
                }
                this.loadAllSessions();
            }
            this.updateFiletreeButtons();
            this.render();
            this.isUpdatingFromLastModified = false;
        };
        this.filetreeButtons.add(allButton);
        this.filterButtons.set("all", allButton);
        
        // Individual filetree buttons
        for (let sessionName of sessionNames) {
            let isConnected = WebFS.connections.has(sessionName);
            let isLoaded = allFileTrees.has(sessionName);
            let isLoading = this.loadingSessions.has(sessionName);
            
            let buttonText = sessionName;
            if (isLoading) {
                buttonText = sessionName + " ⏳";
            } else if (!isConnected) {
                buttonText = sessionName + " (offline)";
            }
            
            let button = new Button(buttonText, "lastModifiedFilterButton");
            if (this.selectedFileTrees.has(sessionName)) {
                button.htmlElement.classList.add("active");
            }
            if (!isConnected) {
                button.htmlElement.classList.add("offline");
            }
            button.onClick = () => {
                this.isUpdatingFromLastModified = true;
                if (this.selectedFileTrees.has(sessionName)) {
                    this.selectedFileTrees.delete(sessionName);
                    // Collapse folder in filetree
                    fileTreeManager.unsetExpandedFolder(sessionName + ":./");
                } else {
                    this.selectedFileTrees.add(sessionName);
                    // Expand folder in filetree
                    fileTreeManager.setExpandedFolder(sessionName + ":./");
                    // Load session if not yet loaded
                    if (!isLoaded && !isLoading) {
                        this.loadSession(sessionName);
                    }
                }
                this.updateFiletreeButtons();
                this.render();
                this.isUpdatingFromLastModified = false;
            };
            this.filetreeButtons.add(button);
            this.filterButtons.set(sessionName, button);
        }
    }
    
    private async loadSession(sessionName: string) {
        this.loadingSessions.add(sessionName);
        this.updateFiletreeButtons();
        
        try {
            await fileTreeManager.getFileTree(sessionName);
        } catch (e) {
            console.error("Failed to load session:", sessionName, e);
        }
        
        this.loadingSessions.delete(sessionName);
        this.updateFiletreeButtons();
        this.render();
    }
    
    private async loadAllSessions() {
        let allSessions: string[] = [];
        if (localStorage.kb_sessions) {
            allSessions = JSON.parse(localStorage.kb_sessions);
        }
        
        let allFileTrees = fileTreeManager.getAllFileTrees();
        
        for (let sessionName of allSessions) {
            if (!allFileTrees.has(sessionName) && !this.loadingSessions.has(sessionName)) {
                this.loadSession(sessionName);
            }
        }
    }

    public async update(kwargs: KWARGS, changedPage: boolean): Promise<void> {
        if (this.searchField.value() != kwargs.search || changedPage) {
            this.searchField.value(kwargs.search || "");
            this.searchQuery = kwargs.search || "";
            this.render();
        }
    }

    private async render() {
        this.entriesView.htmlElement.innerHTML = "";
        
        let allFileTrees = fileTreeManager.getAllFileTrees();
        let files = this.flattenAndSortFiles(allFileTrees);
        
        // Apply filters
        files = this.filterFiles(files);
        
        if (files.length === 0) {
            let emptyState = new Module("div", STRINGS.LASTMODIFIED_EMPTY, "lastModifiedEmpty");
            this.entriesView.add(emptyState);
            return;
        }
        
        let displayFiles = files.slice(0, this.showMax);
        
        for (let file of displayFiles) {
            // Use shared menu builder with starred status
            const isStarred = fileTreeManager.isStarred(file.sessionName, file.path);
            const actions = buildFileContextMenu(file.sessionName, file.path, isStarred);
            
            let entry = new FileEntry(
                file.sessionName,
                file.path,
                new Date(file.modified),
                false,
                () => {
                    let uri = file.sessionName + ":" + file.path;
                    PageManager.update({view: uri});
                },
                actions
            );
            
            let wrapper = new Module("div", "", "lastModifiedEntry");
            wrapper.add(entry);
            this.entriesView.add(wrapper);
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
    
    private filterFiles(files: Array<{sessionName: string, path: string, modified: string}>): Array<{sessionName: string, path: string, modified: string}> {
        // When starredOnly is true and no specific filetrees selected, load sessions with starred files
        if (this.starredOnly && this.selectedFileTrees.size === 0) {
            this.loadSessionsWithStarredFiles();
        }
        
        // Filter by starred status
        if (this.starredOnly) {
            files = files.filter(file => fileTreeManager.isStarred(file.sessionName, file.path));
        }
        
        // Filter by selected filetrees
        // If no filetrees are selected, show nothing (nothing selected is a valid state)
        if (this.selectedFileTrees.size > 0) {
            files = files.filter(file => this.selectedFileTrees.has(file.sessionName));
        } else if (!this.starredOnly) {
            // If nothing selected and not filtering by starred, show nothing
            files = [];
        }
        
        // Filter by search query
        if (this.searchQuery.trim() !== "") {
            function path_fix(k: string) {
                if (k.startsWith("/")) {
                    return k.slice(1)
                }
                return k
            }
            let keywords = this.searchQuery.toLowerCase().split(",").map(k => k.trim()).map(path_fix).filter(k => k !== "");
            files = files.filter(file => {
                let filePath = file.path.toLowerCase();
                return keywords.every(keyword => filePath.includes(keyword));
            });
        }
        
        return files;
    }
    
    private loadSessionsWithStarredFiles() {
        let starredFiles = fileTreeManager.getStarredFiles();
        let allFileTrees = fileTreeManager.getAllFileTrees();
        
        // Get unique session names from starred files
        let sessionsWithStarred = new Set(starredFiles.map(f => f.sessionName));
        
        // Load sessions that have starred files but aren't loaded yet
        for (let sessionName of sessionsWithStarred) {
            if (!allFileTrees.has(sessionName) && !this.loadingSessions.has(sessionName)) {
                this.loadSession(sessionName);
            }
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
