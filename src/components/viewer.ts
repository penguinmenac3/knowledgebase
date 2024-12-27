import { STRINGS } from "../language/default";
import { WebFS } from "../webfs/client/webfs";
import { KWARGS, Module } from "../webui/module";
import { PageManager } from "../webui/pagemanager";
import { MDEdit } from "../mdedit/mdedit"

import "./viewer.css"
import "./md.css"
import { iconArrowLeft, iconBars, iconXmark } from "../webui/icons";
import { Button, FormInput } from "../webui/components/form";
import { iconEdit, iconImage, iconSave, iconUpload } from "../icons";
import { ConfirmCancelPopup } from "../webui/components/popup";
import { MasterDetailView } from "../webui/components/master-detail-view";


const TEXT_FILETYPES = [
    "txt", "csv", "json", "yaml",
    "py", "ts", "js", "rs", "c", "h", "hpp", "cpp", "sh", "bat"
]


export class Edit extends Module<HTMLDivElement> {
    public constructor() {
        super("div", "", "editPage")
    }

    public async update(kwargs: KWARGS, _changedPage: boolean): Promise<void> {
        if (kwargs.view == "") {
            (<MasterDetailView>this.parent!.parent!).setPreferedView("master")
            this.htmlElement.innerHTML = ""
            return
        }
        (<MasterDetailView>this.parent!.parent!).setPreferedView("detail")
        let sessionName = kwargs.view.split(":")[0]
        let filepath = kwargs.view.split(":")[1]
        let filename = filepath.split("/")[filepath.split("/").length - 1]
        let instance = WebFS.connections.get(sessionName)
        if (instance == null) {
            PageManager.open("login", {})
            return
        }
        this.htmlElement.innerHTML = ""
        
        let filename_parts = filename.split(".")
        let ext = filename_parts[filename_parts.length - 1].toLowerCase()
        
        let md5 = await instance.md5(filepath)
        if (md5 == null) {
            alert(STRINGS.EDIT_READ_FILE_ERROR)
            PageManager.back()
        }

        if (ext == "png" || ext == "jpg" || ext == "jpeg" || ext == "tiff" || ext == "tif") {
            let navbar = new Module("div", "", "editNavbar")
            let back = new Button(iconXmark, "editNavbarButton")
            back.onClick = () => {
                PageManager.update({view: ""})
            }
            back.setClass("left")
            navbar.add(back)
            let title = new Module("div", filename, "editNavbarTitle")
            navbar.add(title)
            let uploadBtn = new Button(iconUpload, "editNavbarButton")
            uploadBtn.setClass("right")
            uploadBtn.onClick = () => {
                alert("Not yet implemented!")
            }
            navbar.add(uploadBtn)
            this.add(navbar)
            let container = new Module<HTMLDivElement>("div", "", "editImageBackground")
            let img = new Module<HTMLImageElement>("img", "", "editImageView")
            let preview = (ext == "tiff" || ext == "tif") ? -1 : 0
            img.htmlElement.src = instance.readURL(filepath, preview)
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
        } else if (ext == "md") {
            let navbar = new Module("div", "", "editNavbar")
            let back = new Button(iconXmark, "editNavbarButton")
            back.setClass("left")
            navbar.add(back)
            let save = new Button(iconSave, "editNavbarButton")
            save.setClass("left")
            save.hide()
            navbar.add(save)
            let title = new Module("div", filename, "editNavbarTitle")
            navbar.add(title)
            let settings = new Button(iconBars, "editNavbarButton")
            settings.setClass("right")
            navbar.add(settings)
            this.add(navbar)
            let text = await instance.readTxt(filepath)
            if (text == null || md5 == null) {
                alert(STRINGS.EDIT_READ_FILE_ERROR)
                // TODO show error
                return
            }
            let textEditor = new Module<HTMLDivElement>("div", "", "editTextOutput");
            let mdEditor = new Module<HTMLDivElement>("div", "", "mdOutput");
            textEditor.add(mdEditor)
            this.add(textEditor)
            let simpleMD = new MDEdit(mdEditor.htmlElement, async (newText: string) => {
                if (instance == null) return false
                let isSaved = await instance.putTxt(filepath, newText, md5!)
                if (!isSaved) {
                    alert(STRINGS.EDIT_SAVE_FILE_ERROR)
                } else {
                    if (simpleMD.getText() == newText) {
                        save.hide()
                    }
                    let newMD5 = await instance.md5(filepath)
                    if (newMD5 == null) {
                        alert(STRINGS.EDIT_READ_MD5_ERROR)
                        return false
                    }
                    md5 = newMD5
                }
                return true
            })
            simpleMD.load(text)
            simpleMD.onDirty = () => {
                save.show()
            }
            save.onClick = async () => {
                simpleMD.save()
            }
            back.onClick = () => {
                if (simpleMD.isSaved()) {
                    PageManager.update({view: ""})
                } else {
                    let popup = new ConfirmCancelPopup(
                        "popupContent", "popupContainer",
                        STRINGS.EDIT_EXIT_WITHOUT_SAVE_QUESTION,
                        STRINGS.EDIT_EXIT_WITHOUT_SAVE_CONTINUE_EDITING,
                        STRINGS.EDIT_EXIT_WITHOUT_SAVE_EXIT,
                    )
                    popup.onConfirm = () => {
                        popup.dispose()
                    }
                    popup.onCancel = () => {
                        PageManager.update({view: ""})
                    }
                }
            }
        } else if (TEXT_FILETYPES.includes(ext)) {
            let isEditMode = false
            let navbar = new Module("div", "", "editNavbar")
            let back = new Button(iconXmark, "editNavbarButton")
            back.setClass("left")
            navbar.add(back)
            let save = new Button(iconSave, "editNavbarButton")
            save.setClass("left")
            save.hide()
            navbar.add(save)
            let title = new Module("div", filename, "editNavbarTitle")
            navbar.add(title)
            let edit = new Button(iconEdit, "editNavbarButton")
            edit.setClass("right")
            navbar.add(edit)
            this.add(navbar)
            let text = await instance.readTxt(filepath)
            if (text == null || md5 == null) {
                alert(STRINGS.EDIT_READ_FILE_ERROR)
                // TODO show error
                return
            }
            text = text.replaceAll("\r\n", "\n")
            let textRendering = new Module<HTMLDivElement>("div", "", "editTextOutput")
            textRendering.htmlElement.innerHTML = text.replaceAll("\n", "<BR>")
            textRendering.htmlElement.style.paddingTop = "1em"
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
                if (instance == null) return
                let newText = textEditor.htmlElement.value.replaceAll("\r\n", "\n")
                let isSaved = await instance.putTxt(filepath, newText, md5!)
                if (!isSaved) {
                    alert(STRINGS.EDIT_SAVE_FILE_ERROR)
                } else {
                    text = newText
                    if (textEditor.htmlElement.value.replaceAll("\r\n", "\n") == text) {
                        save.hide()
                    }
                    let newMD5 = await instance.md5(filepath)
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
                    textRendering.htmlElement.innerHTML = textEditor.htmlElement.value.replaceAll("\n", "<BR>")
                    textRendering.show()
                    textEditor.hide()
                }
            }
            back.onClick = () => {
                if (textEditor.htmlElement.value.replaceAll("\r\n", "\n") == text) {
                    PageManager.update({view: ""})
                } else {
                    let popup = new ConfirmCancelPopup(
                        "popupContent", "popupContainer",
                        STRINGS.EDIT_EXIT_WITHOUT_SAVE_QUESTION,
                        STRINGS.EDIT_EXIT_WITHOUT_SAVE_CONTINUE_EDITING,
                        STRINGS.EDIT_EXIT_WITHOUT_SAVE_EXIT,
                    )
                    popup.onConfirm = () => {
                        popup.dispose()
                    }
                    popup.onCancel = () => {
                        PageManager.update({view: ""})
                    }
                }
            }
        } else if (ext == "pdf") {
            let navbar = new Module("div", "", "editNavbar")
            let back = new Button(iconXmark, "editNavbarButton")
            back.onClick = () => {
                PageManager.update({view: ""})
            }
            back.setClass("left")
            navbar.add(back)
            let title = new Module("div", filename, "editNavbarTitle")
            navbar.add(title)
            this.add(navbar)
            let iframe = new Module<HTMLIFrameElement>("iframe", "", "editIFrame")
            iframe.htmlElement.name = "editIFrame"
            this.add(iframe)
            instance.read(filepath, "editIFrame")
        } else {
            let navbar = new Module("div", "", "editNavbar")
            let back = new Button(iconXmark, "editNavbarButton")
            back.onClick = () => {
                PageManager.update({view: ""})
            }
            back.setClass("left")
            navbar.add(back)
            let title = new Module("div", filename, "editNavbarTitle")
            navbar.add(title)
            this.add(navbar)
            let content = new Module("div", "", "editUnsupportedDocument")
            let downloadHeading = new Module("div", STRINGS.EDIT_DOWNLOAD_HEADING, "editHeading")
            content.add(downloadHeading)
            let downloadBtn = new Button(STRINGS.EDIT_DOWNLOAD_BTN, "buttonWide")
            let openURL = instance.readURL(filepath)
            downloadBtn.onClick = () => {
                this.openURLinIFrame(kwargs, filename, openURL);
            }
            console.log(filename)
            content.add(downloadBtn)
            if (downloadBtn.htmlElement.href.includes("localhost") || downloadBtn.htmlElement.href.includes("127.0.0.1")) {
                let openLocally = new Button(STRINGS.EDIT_OPEN_NATIVELY, "buttonWide")
                let openLocalURL = downloadBtn.htmlElement.href.replace("read", "open")
                openLocally.onClick = () => {
                    this.openURLinIFrame(kwargs, filename, openLocalURL);
                }
                content.add(openLocally)
            }
            let uploadHeading = new Module("div", STRINGS.EDIT_UPLOAD_HEADING, "editHeading")
            content.add(uploadHeading)
            let uploadInput = new FormInput("editUploadFile", "", "file", "editUploadFile")
            content.add(uploadInput)
            let upload = new Button(iconUpload, "buttonWide")
            upload.onClick = async () => {
                if (instance == null) return
                upload.htmlElement.disabled = true
                let file = uploadInput.htmlElement.files![0]
                let result = await instance.putFile(filepath, file, md5!)
                upload.htmlElement.disabled = false
                if (result) {
                    uploadInput.value("")
                    md5 = await instance.md5(filepath)
                } else {
                    alert(STRINGS.UPLOAD_FAILED)
                }
            }
            content.add(upload)
            this.add(content)
        }
    }

    private openURLinIFrame(kwargs: KWARGS, filename: string, openURL: string) {
        this.htmlElement.innerHTML = "";
        let navbar = new Module("div", "", "editNavbar");
        let back = new Button(iconArrowLeft, "editNavbarButton");
        back.onClick = () => {
            this.update(kwargs, false);
        };
        back.setClass("left");
        navbar.add(back);
        let title = new Module("div", filename, "editNavbarTitle");
        navbar.add(title);
        this.add(navbar);
        let iframe = new Module<HTMLIFrameElement>("iframe", "", "editIFrame");
        iframe.htmlElement.name = "editIFrame";
        iframe.htmlElement.src = openURL;
        this.add(iframe);
    }

    public hide(): void {
        super.hide()
    }
}
