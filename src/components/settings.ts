import "./settings.css"
import { WebFS } from "../webfs/client/webfs";
import { Module } from "../webui/module";
import { ConfirmCancelPopup, ExitablePopup } from "../webui/components/popup";
import { STRINGS } from "../language/default";
import { createBulkImportForm } from "../webfs/client/login/bulk-import";
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
                let confirmCancelPopup = new ConfirmCancelPopup(STRINGS.SETTINGS_REMOVE_CONNECTION_QUESTION, STRINGS.SETTINGS_REMOVE_CONNECTION_CONFIRM, STRINGS.SETTINGS_REMOVE_CONNECTION_CANCEL)
                confirmCancelPopup.onConfirm = () => {
                    // Delete from kb_sessions (session names array)
                    if (localStorage.kb_sessions) {
                        let sessions = JSON.parse(localStorage.kb_sessions) as string[]
                        sessions = sessions.filter(session => session !== sessionName)
                        localStorage.kb_sessions = JSON.stringify(sessions)
                    }
                    // Delete from webfs_sessions (session details object - handled by removeSession)
                    session.removeSession()
                    location.reload()
                }
                confirmCancelPopup.show()
            }
            let serverName = new Module("div", "", "popupServer")
            serverName.addHtml("div", sessionName, "settingsServerName")
            serverName.add(deleteBtn)
            this.add(serverName)
        })

        /*this.add(new Module("div", STRINGS.SETTINGS_ADD_CONNECTION, "popupSubtitle"))
        this.add(createNewSessionForm())*/

        this.add(new Module("div", STRINGS.SETTINGS_BULK_IMPORT, "popupSubtitle"))
        this.add(createBulkImportForm())

        this.add(new Module("div", STRINGS.SETTINGS_HARD_RESET, "popupSubtitle"))
        let hardResetBtn = new Button(STRINGS.SETTINGS_HARD_RESET, "buttonWide")
        hardResetBtn.setClass("buttonBad")
        hardResetBtn.onClick = () => {
            let confirmPopup = new ConfirmCancelPopup(STRINGS.SETTINGS_HARD_RESET_QUESTION, STRINGS.SETTINGS_HARD_RESET_CONFIRM, STRINGS.SETTINGS_HARD_RESET_CANCEL)
            confirmPopup.onConfirm = () => {
                localStorage.clear()
                location.reload()
            }
            confirmPopup.show()
        }
        this.add(hardResetBtn)
    }

    public update(): void {}
}