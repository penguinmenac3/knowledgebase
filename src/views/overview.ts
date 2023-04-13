import { FileTree, WebFS } from "../WebFS/webfs";
import { KWARGS, Module } from "../framework/module";
import { PageManager } from "../framework/pagemanager";
import { STRINGS } from "../language/default";

export class Overview extends Module<HTMLDivElement> {
    public constructor() {
        super("div")
    }

    public async update(_: KWARGS): Promise<void> {
        if (WebFS.instance == null) {
            PageManager.open("login", {})
            return
        }

        let fileTree = await WebFS.instance.walk(".")
        if (fileTree == null) {
            alert(STRINGS.OVERVIEW_FILETREE_IS_NULL)
            return
        }
        
        let files = this.flatten(fileTree)
        this.htmlElement.innerHTML = ""
        for (const filename of files) {
            this.htmlElement.innerHTML += filename + "<BR>"
        }
    }

    private flatten(fileTree: FileTree, pathPrefix: string = ""): string[] {
        let out: string[] = []
        for (const filename in fileTree) {
            const value = fileTree[filename];
            if (!Number.isInteger(value)) {
                out = out.concat(this.flatten(value as FileTree, pathPrefix + filename + "/"))
            } else {
                out.push(pathPrefix + filename)
            }
        }
        return out
    }
}