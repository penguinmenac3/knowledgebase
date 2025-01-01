import "./viewer.css"
import "./viewer-md.css"
import { STRINGS } from "../language/default";
import { WebFS } from "../webfs/client/webfs";
import { KWARGS, Module } from "../webui/module";
import { PageManager } from "../webui/pagemanager";
import { MDEdit } from "../mdedit/mdedit"
import { iconXmark } from "../webui/icons";
import { Button } from "../webui/components/form";
import { iconDownload, iconEdit, iconImage, iconOpenExternal, iconSave, iconUpload } from "../icons";
import { ConfirmCancelPopup } from "../webui/components/popup";
import { MasterDetailView } from "../webui/components/master-detail-view";
import { Navbar, NavbarButton, NavbarHeader } from "../webui/components/navbar";
import { UploadFilePopup } from "./uploadFilePopup";


const TEXT_FILETYPES = [
    "txt", "csv", "json", "yaml",
    "py", "ts", "js", "rs", "c", "h", "hpp", "cpp", "sh", "bat"
]


class FileMetaData {
    public static async get(uri: string): Promise<FileMetaData | null> {
        // Extract session name and file path from the URI
        let sessionName = uri.split(":")[0]
        let filepath = uri.split(":")[1]
        let filename = filepath.split("/")[filepath.split("/").length - 1]
        let filename_parts = filename.split(".")
        let ext = filename_parts[filename_parts.length - 1].toLowerCase()
        
        // Check if we have access to the file
        let instance = WebFS.connections.get(sessionName)
        if (instance == null) {
            return null
        }
        let md5 = await instance.md5(filepath)
        if (md5 == null) {
            return null
        }
        return new FileMetaData(instance, filepath, filename, md5, ext)
    }

    private constructor(
        public instance: WebFS,
        public filepath: string,
        public filename: string,
        public md5: string,
        public ext: string,
    ) {}
}


export class Viewer extends Module<HTMLDivElement> {
    private openDocument: string = ""
    private isDirty: boolean = false
    private saveCallback: CallableFunction | null = null

    public constructor() {
        super("div", "", "editPage")

        // CTRL + S triggers a save action
        document.addEventListener('keydown', e => {
            if (e.ctrlKey && e.key === 's') {
                e.preventDefault()
                if (this.saveCallback != null) {
                    this.saveCallback()
                }
            }
        })
    }

    public async update(kwargs: KWARGS, _changedPage: boolean): Promise<void> {
        if (kwargs.view == this.openDocument) {
            return
        } else {
            if (this.isDirty) {
                alert(STRINGS.VIEWER_UNSAVED_CHANGES)
                return
            }
        }
        this.openDocument = kwargs.view;
        // Keep master the prefered view until we know we can actually load the file
        (<MasterDetailView>this.parent!.parent!).setPreferedView("master")
        this.htmlElement.innerHTML = ""
        this.saveCallback = null
        
        // Extract info from uri in kwargs
        if (kwargs.view == "") {
            return
        }
        let fileMetaData = await FileMetaData.get(kwargs.view)
        if (fileMetaData == null) {
            alert(STRINGS.VIEWER_READ_FILE_ERROR)
            return
        }
        
        // We know we can display the file, so do it!
        (<MasterDetailView>this.parent!.parent!).setPreferedView("detail")
        if (["png", "jpg", "jpeg", "tiff", "tif"].includes(fileMetaData.ext)) {
            await this.handleImageFile(fileMetaData)
        } else if (["md"].includes(fileMetaData.ext)) {
            await this.handleMDFile(fileMetaData)
        } else if (TEXT_FILETYPES.includes(fileMetaData.ext)) {
            await this.handleTextFile(fileMetaData)
        } else if (["pdf"].includes(fileMetaData.ext)) {
            await this.handlePDFFile(fileMetaData)
        } else {
            await this.handleUnknownFile(fileMetaData)
        }
    }

    private async handleImageFile(fileMetaData: FileMetaData) {
        // Setup navbar
        this.createNavbar(fileMetaData);

        // Setup divs
        let container = new Module<HTMLDivElement>("div", "", "editImageBackground");
        let img = new Module<HTMLImageElement>("img", "", "editImageView");
        container.add(img);
        this.add(container);

        // Load image
        let preview = ["tiff", "tif"].includes(fileMetaData.ext) ? -1 : 0;
        img.htmlElement.src = fileMetaData.instance.readURL(fileMetaData.filepath, preview);
        img.htmlElement.onload = () => {
            let w = img.htmlElement.width;
            let h = img.htmlElement.height;
            let W = container.htmlElement.clientWidth;
            let H = container.htmlElement.clientHeight;
            let ws = w / W;
            let wh = h / H;
            let s = ws > wh ? ws : wh;
            img.htmlElement.width = w / s;
            img.htmlElement.height = h / s;
        };
    }

    private async handleMDFile(fileMetaData: FileMetaData) {
        // Setup navbar
        let save = new NavbarButton(iconSave)
        save.hide()
        this.createNavbar(fileMetaData, [save], [], () => simpleMD.isSaved())

        // Setup divs
        let textEditor = new Module<HTMLDivElement>("div", "", "editTextOutput");
        let mdEditor = new Module<HTMLDivElement>("div", "", "mdOutput");
        textEditor.add(mdEditor)
        this.add(textEditor)
        
        // Get file content
        let text = await fileMetaData.instance.readTxt(fileMetaData.filepath)
        if (text == null || fileMetaData.md5 == null) {
            alert(STRINGS.VIEWER_READ_FILE_ERROR)
            return
        }

        // Create markdown editor
        let simpleMD = new MDEdit(mdEditor.htmlElement, async (newText: string) => {
            return this.onSave(fileMetaData, newText, save, () => simpleMD.getText())
        }, false)  // Do not bind save action, as it would be bound multiple times
        simpleMD.load(text)
        simpleMD.onDirty = () => {
            if (simpleMD.isSaved()) {
                save.hide()
                this.isDirty = false
            } else {
                save.show()
                this.isDirty = true
            }
        }
        save.onClick = async () => {
            simpleMD.save()
        }
        this.saveCallback = save.onClick
    }

    private async handleTextFile(fileMetaData: FileMetaData) {
        // Setup navbar
        let isEditMode = false
        let save = new NavbarButton(iconSave)
        save.hide()
        let edit = new NavbarButton(iconEdit)
        this.createNavbar(fileMetaData,
            [save],
            [edit],
            () => textEditor.htmlElement.value.replaceAll("\r\n", "\n") == text
        )

        // Get file content
        let text = await fileMetaData.instance.readTxt(fileMetaData.filepath)
        if (text == null || fileMetaData.md5 == null) {
            alert(STRINGS.VIEWER_READ_FILE_ERROR)
            return
        }
        text = text.replaceAll("\r\n", "\n")

        // Create preview of document
        let textRendering = new Module<HTMLDivElement>("div", "", "editTextOutput")
        textRendering.htmlElement.innerHTML = text.replaceAll("\n", "<BR>")
        textRendering.htmlElement.style.paddingTop = "1em"
        this.add(textRendering)

        // Create editor of document
        let textEditor = new Module<HTMLTextAreaElement>("textarea", "", "editTextOutputEdit")
        textEditor.htmlElement.value = text
        textEditor.htmlElement.style.resize = "none"
        textEditor.hide()
        textEditor.htmlElement.oninput = () => {
            if (textEditor.htmlElement.value.replaceAll("\r\n", "\n") == text) {
                save.hide()
                this.isDirty = false
            } else {
                save.show()
                this.isDirty = true
            }
        }
        this.add(textEditor)

        // Handle document saving
        save.onClick = async () => {
            let newText = textEditor.htmlElement.value.replaceAll("\r\n", "\n")
            this.onSave(fileMetaData, newText, save, () => textEditor.htmlElement.value.replaceAll("\r\n", "\n"))
            text = newText
        }
        this.saveCallback = save.onClick

        // Handle switching between edit and view modes
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
    }

    private async handlePDFFile(fileMetaData: FileMetaData) {
        // Setup navbar
        this.createNavbar(fileMetaData)

        // Show PDF in iframe
        let iframe = new Module<HTMLIFrameElement>("iframe", "", "editIFrame");
        iframe.htmlElement.name = "editIFrame";
        iframe.htmlElement.src = fileMetaData.instance.readURL(fileMetaData.filepath);
        this.add(iframe);
    }

    private async handleUnknownFile(fileMetaData: FileMetaData) {
        // Setup navbar
        this.createNavbar(fileMetaData)

        // Show a button to display the file in an iframe (only if user wants to)
        let container = new Module<HTMLDivElement>("div", "", "centerChildren");
        let showButton = new Button(STRINGS.VIEWER_LOAD_HERE_FILE, "buttonLarge")
        showButton.htmlElement.style.backgroundColor = "var(--color-good)"
        showButton.onClick = () => {
            let iframe = new Module<HTMLIFrameElement>("iframe", "", "editIFrame");
            iframe.htmlElement.name = "editIFrame";
            iframe.htmlElement.src = fileMetaData.instance.readURL(fileMetaData.filepath);
            this.remove(container)
            this.add(iframe);
        }
        container.add(showButton)
        this.add(container)
    }

    public async onSave(fileMetaData: FileMetaData, newText: string, save: Button, checkText: CallableFunction): Promise<boolean> {
        if (fileMetaData.instance == null) return false
        let isSaved = await fileMetaData.instance.putTxt(fileMetaData.filepath, newText, fileMetaData.md5)
        if (!isSaved) {
            alert(STRINGS.VIEWER_SAVE_FILE_ERROR)
            return false
        } else {
            // Only hide save button if saved text matches the current document state
            // the user can edit the file while we waited for the server to respond
            if (checkText() == newText) {
                save.hide()
                this.isDirty = false
            }
            // update the md5 so we can save the file again later
            let newMD5 = await fileMetaData.instance.md5(fileMetaData.filepath)
            if (newMD5 == null) {
                alert(STRINGS.VIEWER_READ_MD5_ERROR)
                return false
            }
            fileMetaData.md5 = newMD5
        }
        return true
    }

    private createNavbar(fileMetaData: FileMetaData, left: NavbarButton[] = [], right: NavbarButton[] = [], isSaved: CallableFunction = () => true) {
        let navbar = new Navbar();
        // Add a close button to the left
        let close = new NavbarButton(iconXmark);
        close.setClass("left");
        close.onClick = () => {
            if (isSaved()) {
                // If the file is saved, close the page
                PageManager.update({view: ""})
            } else {
                // If the file is NOT saved, ask user if they are sure to close
                let popup = new ConfirmCancelPopup(
                    "popupContent", "popupContainer",
                    STRINGS.VIEWER_EXIT_WITHOUT_SAVE_QUESTION,
                    STRINGS.VIEWER_EXIT_WITHOUT_SAVE_CONTINUE_EDITING,
                    STRINGS.VIEWER_EXIT_WITHOUT_SAVE_EXIT,
                )
                popup.onConfirm = () => {
                    popup.dispose()
                }
                popup.onCancel = () => {
                    this.isDirty = false
                    PageManager.update({view: ""})
                }
            }
        };
        navbar.add(close);

        // Add user defined buttons
        left.forEach(button => {
            button.setClass("left")
            navbar.add(button)
        });

        // Add the title of the file
        navbar.add(new NavbarHeader(fileMetaData.filename));
        
        // If localhost, add an option to open the file natively
        let url = fileMetaData.instance.readURL(fileMetaData.filepath)
        if (url.includes("localhost") || url.includes("127.0.0.1")) {
            let openLocally = new NavbarButton(iconOpenExternal)
            openLocally.setClass("right")
            openLocally.onClick = () => {
                fileMetaData.instance.open(fileMetaData.filepath)
            }
            navbar.add(openLocally)
        }

        // Add a download button
        let downloadBtn = new NavbarButton(iconDownload);
        downloadBtn.setClass("right");
        downloadBtn.htmlElement.href = url
        downloadBtn.htmlElement.download = fileMetaData.filename;
        navbar.add(downloadBtn)

        // Add an upload button
        let uploadBtn = new NavbarButton(iconUpload);
        uploadBtn.setClass("right");
        uploadBtn.onClick = () => {
            new UploadFilePopup(fileMetaData.instance, fileMetaData.filepath, fileMetaData.md5, () => {location.reload()})
        };
        navbar.add(uploadBtn);

        // Add user defined buttons
        right.forEach(button => {
            button.setClass("right")
            navbar.add(button)
        });
        this.add(navbar)
    }

    public hide(): void {
        super.hide()
    }
}
