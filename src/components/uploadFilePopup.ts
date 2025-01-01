import "./uploadFilePopup.css"
import { WebFS } from "../webfs/client/webfs";
import { Button, FormInput, FormLabel } from "../webui/components/form";
import { Module } from "../webui/module";
import { ExitablePopup } from "../webui/components/popup";
import { STRINGS } from "../language/default";


export class UploadNewFilePopup extends ExitablePopup {
    public constructor(currentFolder: string, currentFile: string, triggerFullUpdate: CallableFunction) {
        super("popupContent-fullscreen", "popupContainer", "popupExitBtn")
        this.setClass("upload")
        let sessionName = currentFolder.split(":")[0]
        let folder = currentFolder.split(":")[1]

        this.add(new Module("div", STRINGS.UPLOAD_TITLE, "popupTitle"))
        this.add(new FormLabel(STRINGS.UPLOAD_SERVER + ": " + sessionName))
        this.add(new FormLabel(STRINGS.UPLOAD_FOLDERNAME + ": " + folder))
        this.add(new FormLabel(STRINGS.UPLOAD_FILENAME))
        let filenameInput = new FormInput("filename", currentFile, "text")
        filenameInput.value(currentFile)
        this.add(filenameInput)
        let emptyFile = new Button(STRINGS.UPLOAD_MARKDOWN, "buttonWide")
        emptyFile.onClick = async () => {
            let instance = WebFS.connections.get(sessionName)
            if (instance == null) return
            sendBtn.disable()
            emptyFile.disable()
            if (folder.endsWith("/")) {
                folder = folder.slice(0, folder.length - 1)
            }
            let filename = filenameInput.value()
            let path = folder + "/" + filename
            let result = await instance.putTxt(path, "", "")
            sendBtn.enable()
            emptyFile.enable()
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
            let instance = WebFS.connections.get(sessionName)
            if (instance == null) return
            sendBtn.disable()
            emptyFile.disable()
            let file = fileInput.htmlElement.files![0]
            if (folder.endsWith("/")) {
                folder = folder.slice(0, folder.length - 1)
            }
            let filename = filenameInput.value()
            let path = folder + "/" + filename
            let result = await instance.putFile(path, file, "")
            sendBtn.enable()
            emptyFile.enable()
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
            sendBtn.disable()
            let file = fileInput.htmlElement.files![0]
            // TODO check if a file is selected
            let result = await webfsInstance.putFile(filepath, file, md5)
            sendBtn.enable()
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
