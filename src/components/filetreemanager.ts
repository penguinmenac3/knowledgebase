import { FileTree as WebFSFileTree, WebFS } from "../webfs/client/webfs";

class FileTreeManager {
  private static instance: FileTreeManager;
  
  // State
  private fileTrees: Map<string, WebFSFileTree> = new Map()
  private offlineConnections: string[] = []
  private subscribers: Set<() => void> = new Set()
  
  // Starred files (localStorage: "kb_starred_files")
  // Format: Array of {sessionName: string, path: string}
  
  private constructor() {}
  
  public static getInstance(): FileTreeManager {
    if (!FileTreeManager.instance) {
      FileTreeManager.instance = new FileTreeManager();
    }
    return FileTreeManager.instance;
  }
  
  // FileTree methods
  public async getFileTree(sessionName: string): Promise<WebFSFileTree | null> {
    // Check if already cached
    if (this.fileTrees.has(sessionName)) {
      return this.fileTrees.get(sessionName)!;
    }
    
    // Fetch from WebFS.walk() or use cached offline data
    console.log("Gathering filetrees for: " + sessionName)
    let webFS = WebFS.connections.get(sessionName)
    if (!webFS) return null;
    let fileTree = await webFS.walk(".");
    if (fileTree == null) {
      console.log("Session offline: " + sessionName);
      let jsonFiletree = localStorage["kb_filetree_cache_" + sessionName];
      if (jsonFiletree) {
        fileTree = JSON.parse(jsonFiletree);
      }
      if (!this.offlineConnections.includes(sessionName)) {
        this.offlineConnections.push(sessionName);
      }
    } else {
      let jsonFiletree = JSON.stringify(fileTree);
      localStorage["kb_filetree_cache_" + sessionName] = jsonFiletree;
    }
    if (fileTree != null) {
      this.fileTrees.set(sessionName, fileTree);
    }
    return fileTree
  }
  
  public async refreshAll(): Promise<void> {
    console.log("Refreshing all filetrees...")
    // Fetch fresh filetrees from server for all sessions
    // Clear this.fileTrees and this.offlineConnections
    this.fileTrees.clear();
    this.offlineConnections = [];
    
    // Fetch for each session in WebFS.connections
    for (let sessionName of WebFS.connections.keys()) {
      await this.getFileTree(sessionName);
    }
    console.log("Filetrees refreshed.")
    
    // Notify subscribers after completion
    this.notifySubscribers();
  }
  
  public getAllFileTrees(): Map<string, WebFSFileTree> {
    return this.fileTrees;
  }
  
  public isOffline(sessionName: string): boolean {
    return this.offlineConnections.includes(sessionName);
  }
  
  // Starred files methods
  public getStarredFiles(): Array<{sessionName: string, path: string}> {
    // Read from localStorage["kb_starred_files"]
    // Return parsed array or empty array
    let json = localStorage["kb_starred_files"];
    if (!json) return [];
    try {
      return JSON.parse(json);
    } catch (e) {
      return [];
    }
  }
  
  public isStarred(sessionName: string, path: string): boolean {
    // Check if file exists in starred list
    let starredFiles = this.getStarredFiles();
    return starredFiles.some(f => f.sessionName === sessionName && f.path === path);
  }
  
  public toggleStar(sessionName: string, path: string): void {
    // Add or remove from starred list based on current state
    if (this.isStarred(sessionName, path)) {
      this.removeStar(sessionName, path);
    } else {
      this.addStar(sessionName, path);
    }
  }
  
  public addStar(sessionName: string, path: string): void {
    // Add to starred list if not already present
    // Update localStorage
    // Notify subscribers
    let starredFiles = this.getStarredFiles();
    if (!this.isStarred(sessionName, path)) {
      starredFiles.push({sessionName, path});
      localStorage["kb_starred_files"] = JSON.stringify(starredFiles);
      this.notifySubscribers();
    }
  }
  
  public removeStar(sessionName: string, path: string): void {
    // Remove from starred list
    // Update localStorage
    // Notify subscribers
    let starredFiles = this.getStarredFiles();
    starredFiles = starredFiles.filter(f => !(f.sessionName === sessionName && f.path === path));
    localStorage["kb_starred_files"] = JSON.stringify(starredFiles);
    this.notifySubscribers();
  }
  
  // Subscription
  public subscribe(callback: () => void): void {
    this.subscribers.add(callback);
  }
  
  public unsubscribe(callback: () => void): void {
    this.subscribers.delete(callback);
  }
  
  private notifySubscribers(): void {
    this.subscribers.forEach(callback => callback());
  }
}

export const fileTreeManager = FileTreeManager.getInstance();
