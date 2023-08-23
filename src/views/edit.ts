import { WebFS } from "../webfs/client/webfs";
import { KWARGS, Module } from "../webui/module";
import { PageManager } from "../webui/pagemanager";

import "./edit.css"


export class Edit extends Module<HTMLDivElement> {
    public constructor() {
        super("div", "", "editPage")
    }

    public async update(kwargs: KWARGS, _changedPage: boolean): Promise<void> {
        if (WebFS.instance == null) {
            PageManager.open("login", {})
            return
        }
        this.htmlElement.innerHTML = ""
        let filepath = kwargs.folder + "/" + kwargs.filename
        
        let filename_parts = kwargs.filename.split(".")
        let ext = filename_parts[filename_parts.length - 1].toLowerCase()
        
        if (ext == "png" || ext == "jpg" || ext == "jpeg" || ext == "tiff" || ext == "tif") {
            let container = new Module<HTMLDivElement>("div", "", "editImageBackground")
            let img = new Module<HTMLImageElement>("img", "", "editImageView")
            let preview = (ext == "tiff" || ext == "tif") ? -1 : 0
            img.htmlElement.src = WebFS.instance!.readURL(filepath, preview)
            img.htmlElement.onload = () => {
                let w = img.htmlElement.width
                let h = img.htmlElement.height
                let W = window.innerWidth
                let H = window.innerHeight
                let ws = w/W
                let wh = h/H
                let s = ws > wh ? ws : wh
                img.htmlElement.width = w / s
                img.htmlElement.height = h / s
            }
            container.add(img)
            this.add(container)
        } else {
            let iframe = new Module<HTMLIFrameElement>("iframe", "", "editIFrame")
            iframe.htmlElement.name = "editIFrame"
            this.add(iframe)
            WebFS.instance?.read(filepath, "editIFrame")
        }
    }

    public hide(): void {
        super.hide()
    }
}
