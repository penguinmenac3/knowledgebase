import { FileTree, WebFS } from "../WebFS/webfs";
import { humanFriendlyDate } from "../framework/humanFriendlyDates";
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
        for (const [filename, modified] of files.entries()) {
            this.htmlElement.innerHTML += filename + ":" + humanFriendlyDate(modified) + "<BR>"
        }
    }

    private flatten(fileTree: FileTree, pathPrefix: string = "", out = new Map<string, Date>()): Map<string, Date> {
        for (const filename in fileTree) {
            const value = fileTree[filename];
            if (!(typeof value === 'string')) {
                out = this.flatten(value as FileTree, pathPrefix + filename + "/", out)
            } else {
                out.set(pathPrefix + filename, new Date(value as string))
            }
        }
        return out
    }
}