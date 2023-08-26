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
    public static LOGIN_ERROR_MISSING_INPUTS = "You must provide all fields (session name, api endpoint and api token)."
    public static LOGIN_ERROR_LOGIN_FAILED = "The provided login information is wrong. Is the URL and API token correct?"
    
    public static LOGIN_OFFLINE_MODAL_QUESTION = "Cannot connect to server. Do you want to continue in offline mode? Offline mode might show you outdated files and data."
    public static LOGIN_OFFLINE_MODAL_CONFIRM = "Continue offline"
    public static LOGIN_OFFLINE_MODAL_CANCEL = "Return to login"

    public static SEARCH_FILETREE_IS_NULL = "Cannot retrieve list of files. Maybe you have a weak internet connection."
    public static SEARCH_PLACEHOLDER = "Search (Keyword, Keyword, Keyword)"
    public static SEARCH_LAST_MODIFIED = "modified"
    public static SEARCH_CREATED = "created"
    public static SEARCH_NUM_RESULTS = "files found"
    public static SEARCH_OFFLINE = "(<span style='color: red'>offline</span>)"
    public static SEARCH_MORE_RESULTS = "Click here to show more results!"

    public static SETTINGS_TITLE = "Settings"
    public static SETTINGS_GENERAL = "General"
    public static SETTINGS_CONNECTION = "Connection"
    public static SETTINGS_SELECT_SERVER = "Select server"
    public static SETTINGS_DISPLAY = "Display"
    public static SETTINGS_SHOW_TXT_PREVIEWS = "Show previews for text documents"
    public static SETTINGS_SHOW_IMG_PREVIEWS = "Show previews for images"
    public static SETTINGS_SHOW_PDF_PREVIEWS = "Show previews for PDFs"
    public static SETTINGS_AUTOLOGIN = "Autoconnect to last server"

    public static UPLOAD_TITLE = "Upload File"
    public static UPLOAD_FOLDERNAME = "Foldername"
    public static UPLOAD_FILENAME = "Filename"
    public static UPLOAD_FILE = "File"
    public static UPLOAD_SEND = "Upload"
    public static UPLOAD_FAILED = "Upload failed. Reasons could be: The file already exists, the folder is invalid or the server is currently unreachable."

    public static EDIT_READ_FILE_ERROR = "Cannot read file. Maybe your internet connection is too weak."
    public static EDIT_SAVE_FILE_ERROR = "Cannot save file. It was either changed on the server or you have too weak internet."
    public static EDIT_READ_MD5_ERROR = "Cannot read md5 of file. Maye there was an error saving or your internet is weak."
    public static EDIT_EXIT_WITHOUT_SAVE_QUESTION = "You did not save your changes. Do you want to exit anyways or continue editing?"
    public static EDIT_EXIT_WITHOUT_SAVE_EXIT = "Exit (Discard Changes)"
    public static EDIT_EXIT_WITHOUT_SAVE_CONTINUE_EDITING = "Continue Editing"
    public static EDIT_DOWNLOAD_HEADING = "Access File"
    public static EDIT_DOWNLOAD_BTN = "Open (Here)"
    public static EDIT_OPEN_NATIVELY = "Open (Native)"
    public static EDIT_UPLOAD_HEADING = "Update File"
    public static EDIT_UPLOAD_BTN = "Upload"
}
