import { WebFS } from "../webfs/client/webfs";
import { KWARGS, Module } from "../webui/module";
import { PageManager } from "../webui/pagemanager";

import "./edit.css"


export class Edit extends Module<HTMLDivElement> {
    private iframe: HTMLIFrameElement

    public constructor() {
        super("div")
        this.iframe = document.createElement("iframe")
        this.iframe.name = "editFrame"
        this.iframe.classList.add("editFrame")
        this.htmlElement.appendChild(this.iframe)
    }

    public async update(kwargs: KWARGS): Promise<void> {
        if (WebFS.instance == null) {
            PageManager.open("login", {})
            return
        }
        WebFS.instance?.read(kwargs.folder + "/" + kwargs.filename, "editFrame")
    }

    public hide(): void {
        this.iframe.src = "about:blank"
        super.hide()
    }
}
