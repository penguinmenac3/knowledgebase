import "./fileentry.css"
import { Module } from "../../webui/module";
import { PageManager } from "../../webui/pagemanager";
import { humanFriendlyDate } from "../../webui/utils/humanFriendlyDates";
import { Button } from "../../webui/components/form";
import { ComponentWithMenu, MenuAction } from "../../webui/components/componentWithMenu";
import { getFileIcon } from "./fileTypeRegistry";

export class FileEntry extends ComponentWithMenu<HTMLDivElement> {
    private elementButton: Button

    constructor(
        sessionName: string,
        path: string,
        modified: Date | null,
        isFolder: boolean = false,
        onClick?: () => void,
        actions: MenuAction[] = [],
        isMissing: boolean = false
    ) {
        // Create content module that displays file metadata
        const content = new FileEntryContentModule(
            path,
            sessionName,
            modified,
            isFolder,
            isMissing
        );

        // Initialize parent ComponentWithMenu with content and actions
        super(content, actions, "div", "fileEntry");
        
        this.elementButton = content.elementButton;

        // Set up click handler
        this.elementButton.onClick = () => {
            if (onClick) {
                onClick();
            } else {
                let uri = sessionName + ":" + path;
                PageManager.update({view: uri});
            }
        };
    }
}

/**
 * Content module for FileEntry that renders file metadata
 */
class FileEntryContentModule extends Module<HTMLDivElement> {
    public elementButton: Button;

    constructor(
        path: string,
        sessionName: string,
        modified: Date | null,
        isFolder: boolean = false,
        isMissing: boolean = false
    ) {
        super("div", "", "fileEntryContent");
        
        let filename = path.split("/").pop() || path;
        let folder = path.substring(0, path.lastIndexOf("/")) || "";
        let modifiedDisplay = modified ? humanFriendlyDate(modified) : "";
        
        const icon = getFileIcon(path, isFolder);
        const iconColor = isMissing ? "var(--color-bad)" : icon.color;
        
        this.elementButton = new Button("", "fileTreeElementTitle");
        this.elementButton.htmlElement.innerHTML = `
            <div class="fileEntryMain">
                <span class="fileIcon" style="fill: ${iconColor}">${icon.icon}</span>
                <div class="fileEntryDetails">
                    <span class="fileEntryFilename">${filename}</span>
                    ${modifiedDisplay ? `<span class="fileEntryModified">Last Modified: ${modifiedDisplay}</span>` : ''}
                    ${isMissing ? `<span class="fileEntryMissing">File no longer exists</span>` : ''}
                    <span class="fileEntryInfo">${sessionName}/${folder}</span>
                </div>
            </div>
        `;
        this.add(this.elementButton);
    }
}
