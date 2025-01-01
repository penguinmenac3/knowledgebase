import "./filetreesearch.css"
import { FileTree as WebFSFileTree } from "../webfs/client/webfs";
import {  FormInput } from "../webui/components/form";
import { Module } from "../webui/module";
import { PageManager } from "../webui/pagemanager";
import { splitFilepath } from "../webui/utils/path";


export interface Entry {
    filepath: string
    sessionName: string,
    modified: Date | null
    isFolder: boolean
    score?: number
}

export class SearchResult extends Module<HTMLDivElement> {
    constructor(filepath: string, sessionName: string, _modified: string, isFolder: boolean, searchField: FormInput, _triggerFullUpdate: CallableFunction) {
        super("div", "", "searchResult")
        let { filename, folder } = splitFilepath(filepath);
        let displayFolder = folder
        if (displayFolder == ".") {
            displayFolder = ""
        }
        this.htmlElement.innerHTML = filename + "<BR><span class='searchResultInfo'>" + sessionName + "/" + displayFolder + "</span>"

        let filename_parts = filename.split(".")
        if (isFolder) filename_parts.push("DIR")
        
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


export function search(fileTrees: Map<string, WebFSFileTree>, searchText: string): Entry[] {
    let files: Entry[] = []
    for (let [sessionName, filetree] of fileTrees) {
        files = files.concat(flatten(sessionName, filetree))
    }
    files = sortFilesByFolderAndName(files);
    files = sortFilesByLastModified(files);
    files = sortFilesByRelevance(files, searchText);
    return files
}

function sortFilesByRelevance(files: Entry[], searchText: string): Entry[] {
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

function sortFilesByLastModified(files: Entry[]): Entry[] {
    return files.sort((a: Entry, b: Entry) => {
        // Things which do not have a modified date should be put at the end.
        if (a.modified == null) return 1
        if (b.modified == null) return -1
        return b.modified.toISOString().localeCompare(a.modified.toISOString())
    });
}

function sortFilesByFolderAndName(files: Entry[]): Entry[] {
    return files.sort((a: Entry, b: Entry) => {
        // Things which do not have a modified date should be put at the end.
        if (a.filepath == null) return 1
        if (b.filepath == null) return -1
        return a.filepath.localeCompare(b.filepath)
    });
}

function flatten(sessionName: string, fileTree: WebFSFileTree, pathPrefix: string = "", out: Entry[] = []): Entry[] {
    for (const filename in fileTree) {
        var value = fileTree[filename];
        if (!(typeof value === 'string')) {
            out = flatten(sessionName, value as WebFSFileTree, pathPrefix + filename + "/", out)
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
