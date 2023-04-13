import { WebFS } from "../WebFS/webfs";
import { Button } from "../framework/button";
import { Form, FormInput, FormLabel, FormSubmit } from "../framework/form";
import { Module } from "../framework/module";
import { STRINGS } from "../language/default";
import "./login.css"

export class Login extends Module<HTMLDivElement> {
    public constructor() {
        super("div")
        if (localStorage.kb_sessions) {
            let sessions = JSON.parse(localStorage.kb_sessions)
            for (const sessionName of sessions) {
                let button = new Button(sessionName, "loginButton")
                button.onClick = () => {this.onReuseSession(sessionName)}
            }
        }
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

    private onReuseSession(sessionName: string) {
        // TODO
        console.log("TODO: Use session '" + sessionName + "' to connect to endpoint.")

        // TODO if session invalid by now, remove from button list, show error to user and remain on login site.
        // TODO if successfull, continue to "overview"
    }

    private onCreateSession(formData: FormData) {
        let sessionName = formData.get("sessionName")
        let apiEndpoint = formData.get("apiEndpoint")
        let apiToken = formData.get("apiToken")
        if (sessionName == "" || apiEndpoint == "" || apiToken == "") {
            alert(STRINGS.LOGIN_ERROR_MISSING_INPUTS)
            return
        }
        // let webFS = new WebFS(sessionName)
        // TODO
        console.log("TODO: Create session '" + formData.get("sessionName") + "' to connect to endpoint.")

        
        // TODO if session token invalid, show error to user  and remain on login site.
        // TODO if successfull, add to session list and continue to "overview"
    }
}
