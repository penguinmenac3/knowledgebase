/**
 * File type registry - single source of truth for file type information
 * Maps file extensions to display properties, icons, and handling behavior
 */

import { iconTextFile, iconArchiveFile, iconWordFile, iconExcelFile, iconPowerpointFile, iconCode, iconImage, iconMarkdown, iconScratchpad, iconWeb, iconPdf, iconFolder, iconUnknownFile } from "../../icons";

export interface FileTypeInfo {
    icon: string; // SVG icon string
    displayName: string;
    isText?: boolean;
}

export interface FileIcon {
    icon: string;
    color: string;
}

/**
 * Map of file extensions to their type information
 */
const FILE_TYPE_REGISTRY: Record<string, FileTypeInfo> = {
    "folder": { icon: iconFolder, displayName: "Folder" },

    // Text files
    "txt": { icon: iconTextFile, displayName: "Text", isText: true },
    "json": { icon: iconCode, displayName: "JSON", isText: true },
    "yaml": { icon: iconCode, displayName: "YAML", isText: true },
    "yml": { icon: iconCode, displayName: "YAML", isText: true },

    // Markdown
    "md": { icon: iconMarkdown, displayName: "Markdown", isText: true },
    "markdown": { icon: iconMarkdown, displayName: "Markdown", isText: true },

    // Code
    "py": { icon: iconCode, displayName: "Python", isText: true },
    "ts": { icon: iconCode, displayName: "TypeScript", isText: true },
    "js": { icon: iconCode, displayName: "JavaScript", isText: true },
    "jsx": { icon: iconCode, displayName: "JSX", isText: true },
    "tsx": { icon: iconCode, displayName: "TSX", isText: true },
    "rs": { icon: iconCode, displayName: "Rust", isText: true },
    "c": { icon: iconCode, displayName: "C", isText: true },
    "h": { icon: iconCode, displayName: "Header", isText: true },
    "hpp": { icon: iconCode, displayName: "C++ Header", isText: true },
    "cpp": { icon: iconCode, displayName: "C++", isText: true },
    "sh": { icon: iconCode, displayName: "Shell", isText: true },
    "bash": { icon: iconCode, displayName: "Bash", isText: true },
    "bat": { icon: iconCode, displayName: "Batch", isText: true },
    "sql": { icon: iconCode, displayName: "SQL", isText: true },
    "html": { icon: iconWeb, displayName: "HTML", isText: true },
    "css": { icon: iconCode, displayName: "CSS", isText: true },

    // Data formats
    "csv": { icon: iconCode, displayName: "CSV", isText: true },
    "xml": { icon: iconCode, displayName: "XML", isText: true },
    "toml": { icon: iconCode, displayName: "TOML", isText: true },
    "ini": { icon: iconCode, displayName: "INI", isText: true },

    // Images
    "png": { icon: iconImage, displayName: "PNG Image" },
    "jpg": { icon: iconImage, displayName: "JPEG Image" },
    "jpeg": { icon: iconImage, displayName: "JPEG Image" },
    "gif": { icon: iconImage, displayName: "GIF Image" },
    "svg": { icon: iconImage, displayName: "SVG Image" },
    "webp": { icon: iconImage, displayName: "WebP Image" },
    "ico": { icon: iconImage, displayName: "Icon" },

    // Documents
    "pdf": { icon: iconPdf, displayName: "PDF" },
    "doc": { icon: iconWordFile, displayName: "Word" },
    "docx": { icon: iconWordFile, displayName: "Word" },
    "xls": { icon: iconExcelFile, displayName: "Excel" },
    "xlsx": { icon: iconExcelFile, displayName: "Excel" },
    "odt": { icon: iconWordFile, displayName: "OpenDocument Text" },
    "ppt": { icon: iconPowerpointFile, displayName: "PowerPoint" },
    "pptx": { icon: iconPowerpointFile, displayName: "PowerPoint" },

    // Archives
    "zip": { icon: iconArchiveFile, displayName: "ZIP Archive" },
    "tar": { icon: iconArchiveFile, displayName: "TAR Archive" },
    "gz": { icon: iconArchiveFile, displayName: "Gzip Archive" },
    "rar": { icon: iconArchiveFile, displayName: "RAR Archive" },
    "7z": { icon: iconArchiveFile, displayName: "7z Archive" },

    // Scratchpad
    "spf.svg": { icon: iconScratchpad, displayName: "Scratchpad" },
};

/**
 * Get the file extension from a path
 */
export function getFileExtension(path: string, parts: number = 1): string {
    const split_path = path.split(".");
    return split_path.length > parts ? split_path.slice(-parts).join(".").toLowerCase() : "";
}

/**
 * Get the file type information for a given file path
 */
export function getFileTypeInfo(path: string): FileTypeInfo {
    const ext = getFileExtension(path);
    const detailed_ext = getFileExtension(path, 2);
    return FILE_TYPE_REGISTRY[detailed_ext] || FILE_TYPE_REGISTRY[ext] || {
        icon: iconUnknownFile,
        displayName: "File",
        isText: false
    };
}

/**
 * Get the icon SVG for a file
 */
export function getFileIcon(path: string, isFolder: boolean = false, connectionStatus?: 'connected' | 'offline' | 'undefined'): FileIcon {
    let color = 'var(--color-text)'; // default white for undefined
    if (path === "" && connectionStatus) {
        // Top-level server icon with connection status
        if (connectionStatus === 'connected') {
            color = 'var(--color-good)'; // --color-good (green)
        } else if (connectionStatus === 'offline') {
            color = 'var(--color-bad)'; // --color-bad (red)
        }
        return { icon: FILE_TYPE_REGISTRY["folder"].icon, color }
    }
    if (isFolder) {
        // Use yellow color for folders
        const color = 'var(--color-accent)'; // --color-accent
        return { icon: FILE_TYPE_REGISTRY["folder"].icon, color }
    }
    return { icon: getFileTypeInfo(path).icon, color }
}

/**
 * Check if a file should be treated as text
 */
export function isTextFile(path: string): boolean {
    return getFileTypeInfo(path).isText ?? false;
}

/**
 * Get the display name for a file type
 */
export function getFileTypeName(path: string): string {
    return getFileTypeInfo(path).displayName;
}
