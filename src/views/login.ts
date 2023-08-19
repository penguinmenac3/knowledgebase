import { WebFS } from "../webfs/client/webfs";
import { Button, Form, FormInput, FormLabel, FormSubmit } from "../webui/form";
import { KWARGS, Module } from "../webui/module";
import { PageManager } from "../webui/pagemanager";
import { STRINGS } from "../language/default";
import "./login.css"
import { ConfirmCancelPopup } from "../webui/popup";

export class Login extends Module<HTMLDivElement> {
    private connections: Module<HTMLDivElement>
    
    public constructor() {
        super("div")
        this.setClass("loginView")
        this.connections = new Module("div")
        this.add(this.connections)
        let addEndpointForm = new Form(
            new FormLabel(STRINGS.LOGIN_SESSION_NAME, "loginLabel"),
            new FormInput("sessionName", "myserver", "text", "loginInput"),
            new FormLabel(STRINGS.LOGIN_API_ENDPOINT_LABEL, "loginLabel"),
            new FormInput("apiEndpoint", "https://myserver/webfs/api.php", "url", "loginInput"),
            new FormLabel(STRINGS.LOGIN_API_TOKEN_LABEL, "loginLabel"),
            new FormInput("apiToken", "a4ef9...", "password", "loginInput"),
            new FormSubmit(STRINGS.LOGIN_SUBMIT, "buttonWide")
        )
        addEndpointForm.setClass("loginForm")
        addEndpointForm.onSubmit = this.onCreateSession.bind(this)
        this.add(addEndpointForm)
    }

    public update(_kwargs: KWARGS, _changedPage: boolean): void {
        this.connections.htmlElement.innerHTML = ""
        if (localStorage.kb_sessions) {
            let sessions: string[] = JSON.parse(localStorage.kb_sessions)
            if (sessions.length > 0) {
                this.connections.add(new FormLabel(STRINGS.LOGIN_KNOWN_CONNECTIONS, "loginLabel"))
            }
            for (const sessionName of sessions) {
                let button = new Button(sessionName, "buttonWide")
                button.onClick = () => {reuseSession(sessionName)}
                this.connections.add(button)
            }
            if (sessions.length > 0) {
                let divider = new Module("hr")
                divider.setClass("loginDivider")
                this.connections.add(divider)
            }
        }
    }

    private async onCreateSession(formData: FormData) {
        let sessionName = formData.get("sessionName") as string
        let apiEndpoint = formData.get("apiEndpoint") as string
        let apiToken = formData.get("apiToken") as string
        if (sessionName == "" || apiEndpoint == "" || apiToken == "" ||
            sessionName == null || apiEndpoint == null || apiToken == null) {
            alert(STRINGS.LOGIN_ERROR_MISSING_INPUTS)
            return
        }
        let webFS = new WebFS(sessionName)
        if (await webFS.login(apiEndpoint, apiToken)) {
            // if successfull, add to session list, set global api and continue to "overview"
            let sessions: string[] = []
            if (localStorage.kb_sessions) {
                sessions = JSON.parse(localStorage.kb_sessions)
            }
            sessions.push(sessionName)
            localStorage.kb_sessions = JSON.stringify(sessions)
            WebFS.instance = webFS
            PageManager.back()
        } else {
            // if session token invalid, show error to user  and remain on login site.
            alert(STRINGS.LOGIN_ERROR_LOGIN_FAILED)
        } 
    }
}

async function reuseSession(sessionName: string, silent: boolean = false): Promise<void> {
    console.log("Connecting to: " + sessionName)
    let webFS = new WebFS(sessionName)
    if (await webFS.ping()) {
        WebFS.instance = webFS
        localStorage.kb_last_session = sessionName
        if (!silent) {
            PageManager.back()
        }
    } else {
            let modal = new ConfirmCancelPopup(
                "popupContent", "popupContainer",
                STRINGS.LOGIN_OFFLINE_MODAL_QUESTION,
                STRINGS.LOGIN_OFFLINE_MODAL_CONFIRM,
                STRINGS.LOGIN_OFFLINE_MODAL_CANCEL
            )
            modal.onConfirm = () => {
                WebFS.instance = webFS
                localStorage.kb_last_session = sessionName
                if (!silent) {
                    PageManager.back()
                }
            }
            modal.onCancel = () => {}
    }
}

export async function tryReconnectToLastSession() {
    if (localStorage.kb_sessions) {
        let sessions: string[] = JSON.parse(localStorage.kb_sessions)
        if (sessions.length > 0) {
            let sessionName = sessions[0]
            if (localStorage.kb_last_session) {
                sessionName = localStorage.kb_last_session
            }
            await reuseSession(sessionName, true)
        }
    }
}
