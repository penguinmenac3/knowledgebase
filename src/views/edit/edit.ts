import { Converter } from "showdown";
import { STRINGS } from "../../language/default";
import { WebFS } from "../../webfs/client/webfs";
import { KWARGS, Module } from "../../webui/module";
import { PageManager } from "../../webui/pagemanager";

import "./edit.css"
import { Button } from "../../webui/form";
import { iconArrowLeft, iconEdit, iconImage, iconSave } from "../../icons";


export class Edit extends Module<HTMLDivElement> {
    private mdConverter: Converter = new Converter()

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
        } else if (ext == "txt" || ext == "md" || ext == "py" || ext == "csv" || ext == "json") {
            let isEditMode = false
            let navbar = new Module("div", "", "editNavbar")
            let back = new Button(iconArrowLeft, "editNavbarButton")
            back.setClass("left")
            // TODO
            navbar.add(back)
            let title = new Module("div", kwargs.filename, "editNavbarTitle")
            navbar.add(title)
            let edit = new Button(iconEdit, "editNavbarButton")
            edit.setClass("right")
            navbar.add(edit)
            let save = new Button(iconSave, "editNavbarButton")
            save.setClass("right")
            save.hide()
            navbar.add(save)
            this.add(navbar)
            let md5 = await WebFS.instance!.md5(filepath)
            let text = await WebFS.instance!.readTxt(filepath)
            if (text == null || md5 == null) {
                alert(STRINGS.EDIT_READ_FILE_ERROR)
                // TODO show error
                return
            }
            let textRendering = new Module<HTMLDivElement>("div", "", "editTextOutput")
            this.renderText(ext, text, textRendering);
            this.add(textRendering)

            let textEditor = new Module<HTMLTextAreaElement>("textarea", "", "editTextOutputEdit")
            textEditor.htmlElement.value = text
            textEditor.htmlElement.style.resize = "none"
            textEditor.hide()
            textEditor.htmlElement.oninput = () => {
                if (textEditor.htmlElement.value == text) {
                    save.hide()
                } else {
                    save.show()
                }
            }
            this.add(textEditor)
            save.onClick = async () => {
                let isSaved = await WebFS.instance!.putTxt(filepath, textEditor.htmlElement.value, md5!)
                if (!isSaved) {
                    alert(STRINGS.EDIT_SAVE_FILE_ERROR)
                } else {
                    save.hide()
                    let newMD5 = await WebFS.instance!.md5(filepath)
                    if (newMD5 == null) {
                        alert(STRINGS.EDIT_READ_MD5_ERROR)
                        return
                    }
                    md5 = newMD5
                }
            }
            edit.onClick = () => {
                isEditMode = !isEditMode
                if (isEditMode) {
                    edit.htmlElement.innerHTML = iconImage
                    textRendering.hide()
                    textEditor.show()
                } else {
                    edit.htmlElement.innerHTML = iconEdit
                    this.renderText(ext, textEditor.htmlElement.value, textRendering)
                    textRendering.show()
                    textEditor.hide()
                }
            }
        } else {
            let iframe = new Module<HTMLIFrameElement>("iframe", "", "editIFrame")
            iframe.htmlElement.name = "editIFrame"
            this.add(iframe)
            WebFS.instance?.read(filepath, "editIFrame")
        }
    }

    private renderText(ext: string, text: string, textRendering: Module<HTMLDivElement>) {
        let formattedText = "";
        if (ext == "md") {
            formattedText = this.mdConverter.makeHtml(text);
        } else {
            formattedText = text.replaceAll("\n", "<BR>");
        }
        textRendering.htmlElement.innerHTML = formattedText;
    }

    public hide(): void {
        super.hide()
    }
}
