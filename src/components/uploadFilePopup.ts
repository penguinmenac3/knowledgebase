import "./uploadFilePopup.css"
import { WebFS } from "../webfs/client/webfs";
import { Button, FormDropdown, FormInput, FormLabel } from "../webui/components/form";
import { Module } from "../webui/module";
import { ExitablePopup } from "../webui/components/popup";
import { STRINGS } from "../language/default";

// Example Usage:
//
// let upload = new Button(iconPlus, "searchUploadButton")
// upload.onClick = () => {
//     let currentFolder = "/"
//     let keywords = this.searchField.value().split(",").map((x: string) => x.trim());
//     for (let keyword of keywords) {
//         if (keyword.startsWith("/")) {
//             currentFolder = keyword
//             break
//         }
//     }
//     new UploadPopup(currentFolder, "", this.triggerFullUpdate.bind(this))
// }
// this.add(upload)

export class UploadNewFilePopup extends ExitablePopup {
    public constructor(currentFolder: string, currentFile: string, triggerFullUpdate: CallableFunction) {
        super("popupContent-fullscreen", "popupContainer", "popupExitBtn")
        this.setClass("upload")
        this.add(new Module("div", STRINGS.UPLOAD_TITLE, "popupTitle"))
        this.add(new FormLabel(STRINGS.UPLOAD_SERVER))
        let sessions: string[] = []
        for(let sessionName of WebFS.connections.keys()) {
            sessions.push(sessionName)
        }
        let serverInput = new FormDropdown("sessionName", sessions, "")
        this.add(serverInput)
        this.add(new FormLabel(STRINGS.UPLOAD_FOLDERNAME))
        let folderInput = new FormInput("foldername", currentFolder, "text")
        folderInput.value(currentFolder)
        this.add(folderInput)
        this.add(new FormLabel(STRINGS.UPLOAD_FILENAME))
        let filenameInput = new FormInput("filename", currentFile, "text")
        filenameInput.value(currentFile)
        this.add(filenameInput)
        let emptyFile = new Button(STRINGS.UPLOAD_MARKDOWN, "buttonWide")
        emptyFile.onClick = async () => {
            let sessionName = serverInput.value()
            let instance = WebFS.connections.get(sessionName)
            if (instance == null) return
            sendBtn.htmlElement.disabled = true
            emptyFile.htmlElement.disabled = true
            let folder = folderInput.value()
            if (folder.endsWith("/")) {
                folder = folder.slice(0, folder.length - 1)
            }
            let filename = filenameInput.value()
            let path = folder + "/" + filename
            let result = await instance.putTxt(path, "", "")
            sendBtn.htmlElement.disabled = false
            emptyFile.htmlElement.disabled = false
            if (result) {
                this.dispose()
                triggerFullUpdate()
            } else {
                alert(STRINGS.UPLOAD_FAILED)
            }
        }
        this.add(emptyFile)
        this.add(new FormLabel(STRINGS.UPLOAD_FILE_OPTIONAL))
        let fileInput = new FormInput("file", "", "file", "fileInput")
        fileInput.onChangeDone = (value: string) => {
            if (filenameInput.value() == "") {
                let parts = value.replaceAll("\\", "/").split("/")
                filenameInput.value(parts[parts.length - 1])
            }
        }
        this.add(fileInput)
        let sendBtn = new Button(STRINGS.UPLOAD_SEND, "buttonWide")
        sendBtn.onClick = async () => {
            let sessionName = serverInput.value()
            let instance = WebFS.connections.get(sessionName)
            if (instance == null) return
            sendBtn.htmlElement.disabled = true
            emptyFile.htmlElement.disabled = true
            let file = fileInput.htmlElement.files![0]
            let folder = folderInput.value()
            if (folder.endsWith("/")) {
                folder = folder.slice(0, folder.length - 1)
            }
            let filename = filenameInput.value()
            let path = folder + "/" + filename
            let result = await instance.putFile(path, file, "")
            sendBtn.htmlElement.disabled = false
            emptyFile.htmlElement.disabled = false
            if (result) {
                this.dispose()
                triggerFullUpdate()
            } else {
                alert(STRINGS.UPLOAD_FAILED)
            }
        }
        this.add(sendBtn)
    }

    public update(): void {}
}


export class UploadFilePopup extends ExitablePopup {
    public constructor(webfsInstance: WebFS, filepath: string, md5: string, triggerFullUpdate: CallableFunction) {
        super("popupContent-fullscreen", "popupContainer", "popupExitBtn")
        this.setClass("upload")
        this.add(new Module("div", STRINGS.UPLOAD_TITLE, "popupTitle"))
        this.add(new FormLabel(STRINGS.UPLOAD_FILE))
        let fileInput = new FormInput("file", "", "file", "fileInput")
        this.add(fileInput)
        let sendBtn = new Button(STRINGS.UPLOAD_SEND, "buttonWide")
        sendBtn.onClick = async () => {
            if (webfsInstance == null) return
            sendBtn.htmlElement.disabled = true
            let file = fileInput.htmlElement.files![0]
            // TODO check if a file is selected
            let result = await webfsInstance.putFile(filepath, file, md5)
            sendBtn.htmlElement.disabled = false
            if (result) {
                this.dispose()
                triggerFullUpdate()
            } else {
                alert(STRINGS.UPLOAD_FAILED)
            }
        }
        this.add(sendBtn)
    }

    public update(): void {}
}
