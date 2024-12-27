import "./settings.css"
import { WebFS } from "../webfs/client/webfs";
import { Module } from "../webui/module";
import { ConfirmCancelPopup, ExitablePopup } from "../webui/components/popup";
import { STRINGS } from "../language/default";
import { createNewSessionForm } from "../webfs/client/login/login";
import { Button } from "../webui/components/form";


export class SettingsPopup extends ExitablePopup {
    public constructor() {
        super("popupContent-fullscreen", "popupContainer", "popupExitBtn")
        this.add(new Module("div", STRINGS.SETTINGS_TITLE, "popupTitle"))
        
        // this.add(new Module("div", STRINGS.SETTINGS_GENERAL, "popupSubtitle"))

        // this.add(new Module("div", STRINGS.SETTINGS_DISPLAY, "popupSubtitle"))
        // let showTxtPreviews = new FormCheckbox(
        //     "showTxtPreviews",
        //     STRINGS.SETTINGS_SHOW_TXT_PREVIEWS,
        //     localStorage.kb_allow_txt_previews == 'true')
        //     showTxtPreviews.onChange = (state: boolean) => {
        //     localStorage.kb_allow_txt_previews = state
        // }
        // this.add(showTxtPreviews)

        this.add(new Module("div", STRINGS.SETTINGS_LIST_CONNECTIONS, "popupSubtitle"))
        WebFS.connections.forEach((session: WebFS) => {
            let sessionName = session.getSessionName()
            let deleteBtn = new Button(STRINGS.SETTINGS_REMOVE_CONNECTION)
            deleteBtn.setClass("buttonBad")
            deleteBtn.onClick = () => {
                let sessions = JSON.parse(localStorage.kb_sessions) as string[]
                sessions = sessions.filter(session => session !== sessionName)
                localStorage.kb_sessions = JSON.stringify(sessions)
                session.removeSession()
                location.reload()
            }
            let serverName = new Module("div", "", "popupServer")
            serverName.addHtml("div", sessionName, "settingsServerName")
            serverName.add(deleteBtn)
            this.add(serverName)
        })

        this.add(new Module("div", STRINGS.SETTINGS_ADD_CONNECTION, "popupSubtitle"))
        this.add(createNewSessionForm())
    }

    public update(): void {}
}