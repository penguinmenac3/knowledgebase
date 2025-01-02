export class English {
    protected constructor() {}

    public static APPLY_COUNTED(num: number, format: string): string {
        return format.replace("{count}", num.toString())
    }

    public static TIME_LOCALE = "en"
    public static TIME_YESTERDAY = "yesterday"
    public static TIME_HOURS_AGO = "{count} hour(s) ago"
    public static TIME_MINUTES_AGO = "{count} minute(s) ago"
    public static TIME_SECONDS_AGO = "{count} second(s) ago"
    public static TIME_TODAY_AT = "today at"
    public static TIME_JUST_NOW = "just now"

    public static APPNAME = "Knowledgebase"

    public static LOGIN_KNOWN_CONNECTIONS = "Reuse Connection"
    public static LOGIN_SESSION_NAME = "Session Name"
    public static LOGIN_API_ENDPOINT_LABEL = "API Endpoint URL"
    public static LOGIN_API_TOKEN_LABEL = "API Token"
    public static LOGIN_SUBMIT = "Add Connection"
    public static LOGIN_ALL_CONNECTIONS = "All"
    public static LOGIN_ERROR_MISSING_INPUTS = "You must provide all fields (session name, api endpoint and api token)."
    public static LOGIN_ERROR_LOGIN_FAILED = "The provided login information is wrong. Is the URL and API token correct?"
    
    public static LOGIN_OFFLINE_MODAL_QUESTION = "Cannot connect to server. Do you want to continue in offline mode? Offline mode might show you outdated files and data."
    public static LOGIN_OFFLINE_MODAL_CONFIRM = "Continue offline"
    public static LOGIN_OFFLINE_MODAL_CANCEL = "Return to login"

    public static FILETREE_MISSING_CONNECTIONS = "Add a server via settings!"
    public static FILETREE_FILETREE_IS_NULL = "Cannot retrieve filetree. Maybe you have a weak internet connection?"
    public static FILETREE_SEARCH_PLACEHOLDER = "Search (Keyword, Keyword)"
    public static FILETREE_OFFLINE = "Offline:"
    public static FILETREE_MORE_RESULTS = "Show more results!"
    public static FILETREE_DELETE_QUESTION = "Are you sure you want to delete this file?"
    public static FILETREE_DELETE_CONFIRM = "Delete"
    public static FILETREE_DELETE_CANCEL = "Keep File"
    public static FILETREE_RENAME_CURRENT_PATH = "Current Path"
    public static FILETREE_RENAME_NEW_PATH = "New Path"
    public static FILETREE_RENAME_CONFIRM = "Rename"
    public static FILETREE_INVALID_SESSION = "You appear to have a broken session. Try to remove it and add it again."

    public static SETTINGS_TITLE = "Settings"
    public static SETTINGS_GENERAL = "General"
    public static SETTINGS_LIST_CONNECTIONS = "Connections"
    public static SETTINGS_ADD_CONNECTION = "Add New Connection"
    public static SETTINGS_REMOVE_CONNECTION = "delete"
    public static SETTINGS_REMOVE_CONNECTION_QUESTION = "Are you sure you want to delete this connection?"
    public static SETTINGS_REMOVE_CONNECTION_CONFIRM = "Yes, delete this connection."
    public static SETTINGS_REMOVE_CONNECTION_CANCEL = "No, keep this connection."

    public static UPLOAD_TITLE = "Upload File"
    public static UPLOAD_SERVER = "Server"
    public static UPLOAD_FOLDERNAME = "Foldername"
    public static UPLOAD_LOCATION = "Location: "
    public static UPLOAD_FILENAME = "Filename"
    public static UPLOAD_FILE = "File"
    public static UPLOAD_FILE_OPTIONAL = "File (optional)"
    public static UPLOAD_SEND = "Upload File"
    public static UPLOAD_MARKDOWN = "Empty File"
    public static UPLOAD_FAILED = "Upload failed. Reasons could be: The file already exists, the folder is invalid or the server is currently unreachable."

    public static VIEWER_READ_FILE_ERROR = "Cannot read file or reach server. Maybe your internet connection is too weak or the server is down."
    public static VIEWER_SAVE_FILE_ERROR = "Cannot save file. It was either changed on the server or you have too weak internet."
    public static VIEWER_READ_MD5_ERROR = "Cannot read md5 of file. Maye there was an error saving or your internet is weak."
    public static VIEWER_EXIT_WITHOUT_SAVE_QUESTION = "You did not save your changes. Do you want to exit anyways or continue editing?"
    public static VIEWER_EXIT_WITHOUT_SAVE_EXIT = "Exit (Discard Changes)"
    public static VIEWER_EXIT_WITHOUT_SAVE_CONTINUE_EDITING = "Continue Editing"
    public static VIEWER_LOAD_HERE_FILE = "Open (here)"
    public static VIEWER_UPLOAD_HEADING = "Update File"
    public static VIEWER_UPLOAD_BTN = "Upload"
    public static VIEWER_UNSAVED_CHANGES = "You cannot open a new file while having a file with unsaved changes open!"

    public static MD_EMPTY_CELL = "Empty, click to add text!"

    public static NOTEPAD_CLEAR_QUESTION = "Are you sure you want to clear the document? This will delete all strokes and content of it irreversibly!"
    public static NOTEPAD_CLEAR_CONFIRM = "Yes, delete it"
    public static NOTEPAD_CLEAR_CANCEL = "No, keep it"

    public static NOTEPAD_IMPORT_QUESTION = "What file do you want to import (*.spf.svg or *.spf)? Note: Importing will overwrite content currently displayed."
    public static NOTEPAD_IMPORT_CONFIRM = "Import"
    public static NOTEPAD_IMPORT_UNSUPPORTED_FILE = "ERROR: Only *.spf and *.spf.svg are supported filetypes."

}
