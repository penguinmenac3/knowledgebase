import "./filetreeentry.css"
import { Module } from "../../webui/module";
import { Button } from "../../webui/components/form";
import { ComponentWithMenu, MenuAction } from "../../webui/components/componentWithMenu";
import { getFileIcon } from "./fileTypeRegistry";
import { chevronRight, chevronDown } from "../../icons";

export interface TreeNode {
    name: string;
    path: string;
    isFolder: boolean;
    hasChildren: boolean;
    isExpanded?: boolean;
}

export class FileTreeEntry extends ComponentWithMenu<HTMLDivElement> {
    private expandButton: Module<HTMLDivElement>;
    private onExpand?: (isExpanded: boolean) => void;
    private isExpanded: boolean = false;
    private treeEntryContent: TreeEntryContentModule;

    constructor(
        private node: TreeNode,
        actions: MenuAction[] = [],
        connectionStatus?: 'connected' | 'offline' | 'undefined'
    ) {
        // Create content module
        const content = new TreeEntryContentModule(node, connectionStatus);

        // Initialize parent ComponentWithMenu with content and actions
        super(content, actions, "div", "filetreeEntry");

        this.treeEntryContent = content;
        this.expandButton = content.expandButton;
        this.isExpanded = node.isExpanded ?? false;

        // Set up expand button if this is a folder
        if (this.node.isFolder && this.node.hasChildren) {
            this.treeEntryContent.onClick = () => {
                this.isExpanded = !this.isExpanded;
                this.updateExpandButton();
                if (this.onExpand) {
                    this.onExpand(this.isExpanded);
                }
            };
        }
    }

    private updateExpandButton(): void {
        const icon = this.isExpanded ? chevronDown : chevronRight;
        this.expandButton.htmlElement.innerHTML = icon;
    }

    public setOnExpand(callback: (isExpanded: boolean) => void): void {
        this.onExpand = callback;
    }

    public getIsExpanded(): boolean {
        return this.isExpanded;
    }

    public setIsExpanded(expanded: boolean): void {
        this.isExpanded = expanded;
        this.updateExpandButton();
    }

    public getNode(): TreeNode {
        return this.node;
    }

    public getButton(): Button {
        return this.treeEntryContent;
    }

    public setConnectionStatus(status: 'connected' | 'offline' | 'undefined'): void {
        this.treeEntryContent.updateConnectionStatus(status);
    }
}

/**
 * Content module for FileTreeEntry that renders tree node
 */
class TreeEntryContentModule extends Button {
    private elementButton: Module<HTMLDivElement>;
    public expandButton: Module<HTMLDivElement>;
    private node: TreeNode;

    constructor(node: TreeNode, connectionStatus?: 'connected' | 'offline' | 'undefined') {
        super("", "filetreeEntryContent");
        this.node = node;

        this.expandButton = new Module<HTMLDivElement>("div", "", "filetreeExpandButton");
        this.expandButton.htmlElement.style.visibility = node.hasChildren ? "visible" : "hidden";
        if (node.hasChildren) {
            this.expandButton.htmlElement.innerHTML = node.isExpanded ? chevronDown : chevronRight;
        }
        this.add(this.expandButton);

        this.elementButton = new Module<HTMLDivElement>("div", "", "fileTreeElementTitle");
        const icon = getFileIcon(node.path, node.isFolder, connectionStatus);
        let filename = node.name.replaceAll("_", " ")
        this.elementButton.htmlElement.innerHTML = `
            <div class="fileEntryMain">
                <span class="fileIcon" style="fill: ${icon.color}">${icon.icon}</span>
                <div class="fileEntryDetails">
                    <span>${filename}</span>
                </div>
            </div>
        `;
        this.add(this.elementButton);
    }

    public updateConnectionStatus(connectionStatus?: 'connected' | 'offline' | 'undefined'): void {
        const icon = getFileIcon(this.node.path, this.node.isFolder, connectionStatus);
        let filename = this.node.name.replaceAll("_", " ")
        this.elementButton.htmlElement.innerHTML = `
            <div class="fileEntryMain">
                <span class="fileIcon" style="fill: ${icon.color}">${icon.icon}</span>
                <div class="fileEntryDetails">
                    <span>${filename}</span>
                </div>
            </div>
        `;
    }
}
