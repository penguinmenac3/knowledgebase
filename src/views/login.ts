import { WebFS } from "../WebFS/client/webfs";
import { Button } from "../framework/button";
import { Form, FormInput, FormLabel, FormSubmit } from "../framework/form";
import { KWARGS, Module } from "../framework/module";
import { PageManager } from "../framework/pagemanager";
import { STRINGS } from "../language/default";
import "./login.css"

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
            new FormSubmit(STRINGS.LOGIN_SUBMIT, "loginButton")
        )
        addEndpointForm.setClass("loginForm")
        addEndpointForm.onSubmit = this.onCreateSession.bind(this)
        this.add(addEndpointForm)
    }

    public update(_: KWARGS): void {
        this.connections.htmlElement.innerHTML = ""
        if (localStorage.kb_sessions) {
            let sessions: string[] = JSON.parse(localStorage.kb_sessions)
            if (sessions.length > 0) {
                this.connections.add(new FormLabel(STRINGS.LOGIN_KNOWN_CONNECTIONS, "loginLabel"))
            }
            for (const sessionName of sessions) {
                let button = new Button(sessionName, "loginButton")
                button.onClick = () => {this.onReuseSession(sessionName)}
                this.connections.add(button)
            }
            if (sessions.length > 0) {
                let divider = new Module("hr")
                divider.setClass("loginDivider")
                this.connections.add(divider)
            }
        }
    }

    private async onReuseSession(sessionName: string) {
        let webFS = new WebFS(sessionName)
        if (await webFS.ping()) {
            WebFS.instance = webFS
            PageManager.back()
        } else {
            alert("Connection refused. Either the server is not available or the connection was not used for too long.")
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
