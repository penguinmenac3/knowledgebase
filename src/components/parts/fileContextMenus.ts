import { MenuAction } from "../../webui/components/componentWithMenu";
import { fileTreeManager } from "../filetreemanager";
import { WebFS } from "../../webfs/client/webfs";
import { UploadNewFilePopup } from "../uploadFilePopup";
import { ExitablePopup, ConfirmCancelPopup } from "../../webui/components/popup";
import { Button, FormInput, FormLabel } from "../../webui/components/form";
import { STRINGS } from "../../language/default";

/**
 * Builds menu actions for a file entry (consistent across all views)
 * Includes: Star/Unstar, Move, Delete
 */
export function buildFileContextMenu(
    sessionName: string,
    path: string,
    isStarred?: boolean
): MenuAction[] {
    const actions: MenuAction[] = [];

    // Star/Unstar
    const starLabel = isStarred ? "Unstar" : "Star";
    actions.push({
        label: starLabel,
        id: "star",
        onClick: () => fileTreeManager.toggleStar(sessionName, path)
    });

    // Move
    actions.push({
        label: "Move",
        id: "move",
        onClick: () => moveFile(sessionName, path)
    });

    // Delete
    actions.push({
        label: "Delete",
        id: "delete",
        onClick: () => deleteFile(sessionName, path, false)
    });

    return actions;
}

/**
 * Builds menu actions for a folder entry (consistent across all views)
 * Includes: New File, New Folder, Move
 */
export function buildFolderContextMenu(
    sessionName: string,
    path: string
): MenuAction[] {
    const actions: MenuAction[] = [];

    // New File
    actions.push({
        label: "New File",
        id: "new-file",
        onClick: () => newFile(sessionName, path)
    });

    // New Folder
    actions.push({
        label: "New Folder",
        id: "new-folder",
        onClick: () => newFolder(sessionName, path)
    });

    // Move
    actions.push({
        label: "Move",
        id: "move",
        onClick: () => moveFile(sessionName, path)
    });

    // Delete
    actions.push({
        label: "Delete",
        id: "delete",
        onClick: () => deleteFile(sessionName, path, true)
    });

    return actions;
}

// ============ Implementation Details ============

function buildURI(sessionName: string, path: string): string {
    // Build URI in format "sessionName:./path"
    if (path === "" || path === "/") {
        return sessionName + ":./" ;
    }
    return sessionName + ":" + path;
}

async function newFile(sessionName: string, folderPath: string): Promise<void> {
    const uri = buildURI(sessionName, folderPath);
    new UploadNewFilePopup(uri, "", () => location.reload());
}

async function newFolder(sessionName: string, folderPath: string): Promise<void> {
    const session = WebFS.connections.get(sessionName);
    if (session == null) {
        alert(STRINGS.FILETREE_INVALID_SESSION);
        return;
    }
    session.mkdir(folderPath + "/New Folder");
    location.reload();
}

async function moveFile(sessionName: string, path: string): Promise<void> {
    const session = WebFS.connections.get(sessionName);
    if (session == null) {
        alert(STRINGS.FILETREE_INVALID_SESSION);
        return;
    }

    const renamePopup = new ExitablePopup();
    renamePopup.htmlElement.style.width = "87%";
    renamePopup.htmlElement.style.maxWidth = "40em";

    renamePopup.add(new FormLabel(STRINGS.FILETREE_RENAME_CURRENT_PATH));
    const currentPathInput = new FormInput("current_path", "", "text");
    currentPathInput.value(path);
    currentPathInput.htmlElement.disabled = true;
    renamePopup.add(currentPathInput);

    renamePopup.add(new FormLabel(STRINGS.FILETREE_RENAME_NEW_PATH));
    const newPathInput = new FormInput("new_path", "", "text");
    newPathInput.value(path);
    renamePopup.add(newPathInput);

    const confirmButton = new Button(STRINGS.FILETREE_RENAME_CONFIRM, "buttonWide");
    confirmButton.setClass("good");
    confirmButton.onClick = () => {
        session.mv(path, newPathInput.value());
        location.reload();
    };
    renamePopup.add(confirmButton);
}

async function deleteFile(
    sessionName: string,
    path: string,
    isFolder: boolean
): Promise<void> {
    const session = WebFS.connections.get(sessionName);
    if (session == null) {
        alert(STRINGS.FILETREE_INVALID_SESSION);
        return;
    }

    let md5: string | null = "";
    if (!isFolder) {
        md5 = await session.md5(path);
        if (md5 == null || md5 == "") {
            alert(STRINGS.VIEWER_READ_MD5_ERROR);
            return;
        }
    }

    const filename = path.split("/").pop() || path;
    const popup = new ConfirmCancelPopup(
        STRINGS.FILETREE_DELETE_QUESTION + " " + filename,
        STRINGS.FILETREE_DELETE_CANCEL,
        STRINGS.FILETREE_DELETE_CONFIRM
    );

    popup.onConfirm = () => {};
    popup.onCancel = async () => {
        let result = false;
        if (isFolder) {
            result = await session.rmdir(path);
        } else {
            result = await session.rm(path, md5);
        }
        if (result) {
            location.reload();
        }
    };
}
