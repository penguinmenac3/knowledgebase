import { WebFS } from "../WebFS/webfs";
import { KWARGS, Module } from "../framework/module";
import { PageManager } from "../framework/pagemanager";

export class Overview extends Module<HTMLDivElement> {
    public constructor() {
        super("div")
        this.htmlElement.innerText = "Hallo Welt!"
    }

    public update(_: KWARGS): void {
        if (WebFS.instance == null) {
            PageManager.open("login", {})
            return
        }
    }
}