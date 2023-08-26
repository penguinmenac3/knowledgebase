import { Converter } from "showdown";
import { STRINGS } from "../../language/default";
import { WebFS } from "../../webfs/client/webfs";
import { KWARGS, Module } from "../../webui/module";
import { PageManager } from "../../webui/pagemanager";

import "./edit.css"
import { Button, FormInput } from "../../webui/form";
import { iconArrowLeft, iconEdit, iconImage, iconSave, iconUpload } from "../../icons";
import { ConfirmCancelPopup } from "../../webui/popup";


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
        
        let md5 = await WebFS.instance!.md5(filepath)
        if (md5 == null) {
            alert(STRINGS.EDIT_READ_FILE_ERROR)
            return
        }

        if (ext == "png" || ext == "jpg" || ext == "jpeg" || ext == "tiff" || ext == "tif") {
            let navbar = new Module("div", "", "editNavbar")
            let back = new Button(iconArrowLeft, "editNavbarButton")
            back.onClick = () => {
                history.back()
            }
            back.setClass("left")
            navbar.add(back)
            let uploadBtn = new Button(iconUpload, "editNavbarButton")
            uploadBtn.setClass("right")
            uploadBtn.onClick = () => {
                alert("Not yet implemented!")
            }
            navbar.add(uploadBtn)
            let title = new Module("div", kwargs.filename, "editNavbarTitle")
            navbar.add(title)
            this.add(navbar)
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
            let text = await WebFS.instance!.readTxt(filepath)
            if (text == null || md5 == null) {
                alert(STRINGS.EDIT_READ_FILE_ERROR)
                // TODO show error
                return
            }
            text = text.replaceAll("\r\n", "\n")
            let textRendering = new Module<HTMLDivElement>("div", "", "editTextOutput")
            this.renderText(ext, text, textRendering);
            this.add(textRendering)

            let textEditor = new Module<HTMLTextAreaElement>("textarea", "", "editTextOutputEdit")
            textEditor.htmlElement.value = text
            textEditor.htmlElement.style.resize = "none"
            textEditor.hide()
            textEditor.htmlElement.oninput = () => {
                if (textEditor.htmlElement.value.replaceAll("\r\n", "\n") == text) {
                    save.hide()
                } else {
                    save.show()
                }
            }
            this.add(textEditor)
            save.onClick = async () => {
                let newText = textEditor.htmlElement.value.replaceAll("\r\n", "\n")
                let isSaved = await WebFS.instance!.putTxt(filepath, newText, md5!)
                if (!isSaved) {
                    alert(STRINGS.EDIT_SAVE_FILE_ERROR)
                } else {
                    text = newText
                    if (textEditor.htmlElement.value.replaceAll("\r\n", "\n") == text) {
                        save.hide()
                    }
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
            back.onClick = () => {
                if (textEditor.htmlElement.value.replaceAll("\r\n", "\n") == text) {
                    history.back()
                } else {
                    let popup = new ConfirmCancelPopup(
                        "popupContent", "popupContainer",
                        STRINGS.EDIT_EXIT_WITHOUT_SAVE_QUESTION,
                        STRINGS.EDIT_EXIT_WITHOUT_SAVE_EXIT,
                        STRINGS.EDIT_EXIT_WITHOUT_SAVE_CONTINUE_EDITING
                    )
                    popup.onConfirm = () => {
                        history.back()
                    }
                    popup.onCancel = () => {
                        popup.dispose()
                    }
                }
            }
        } else if (ext == "pdf") {
            let iframe = new Module<HTMLIFrameElement>("iframe", "", "editIFrame")
            iframe.htmlElement.name = "editIFrame"
            this.add(iframe)
            WebFS.instance?.read(filepath, "editIFrame")
        } else {
            let navbar = new Module("div", "", "editNavbar")
            let back = new Button(iconArrowLeft, "editNavbarButton")
            back.onClick = () => {
                history.back()
            }
            back.setClass("left")
            navbar.add(back)
            let title = new Module("div", kwargs.filename, "editNavbarTitle")
            navbar.add(title)
            this.add(navbar)
            let content = new Module("div", "", "editUnsupportedDocument")
            let downloadHeading = new Module("div", STRINGS.EDIT_DOWNLOAD_HEADING, "editHeading")
            content.add(downloadHeading)
            let downloadBtn = new Button(STRINGS.EDIT_DOWNLOAD_BTN, "buttonWide")
            downloadBtn.htmlElement.href = WebFS.instance!.readURL(filepath)
            console.log(kwargs.filename)
            content.add(downloadBtn)
            let openLocally = new Button(STRINGS.EDIT_OPEN_NATIVELY, "buttonWide")
            if (downloadBtn.htmlElement.href.includes("localhost")) {
                openLocally.htmlElement.href = downloadBtn.htmlElement.href.replace("read", "open")
                content.add(openLocally)
            }
            let uploadHeading = new Module("div", STRINGS.EDIT_UPLOAD_HEADING, "editHeading")
            content.add(uploadHeading)
            let uploadInput = new FormInput("editUploadFile", "", "file", "editUploadFile")
            content.add(uploadInput)
            let upload = new Button(iconUpload, "buttonWide")
            upload.onClick = async () => {
                if (WebFS.instance == null) return
                upload.htmlElement.disabled = true
                let file = uploadInput.htmlElement.files![0]
                let result = await WebFS.instance.putFile(filepath, file, md5!)
                upload.htmlElement.disabled = false
                if (result) {
                    uploadInput.value("")
                    md5 = await WebFS.instance!.md5(filepath)
                } else {
                    alert(STRINGS.UPLOAD_FAILED)
                }
            }
            content.add(upload)
            this.add(content)
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
