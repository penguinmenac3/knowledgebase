import { STRINGS } from "../language/default";
import { Button, FormCheckbox } from "../webui/form";
import { Module } from "../webui/module";
import { PageManager } from "../webui/pagemanager";
import { SettingsPopup } from "../webui/popup";

import "./settings.css"


export class Settings extends SettingsPopup {
    public constructor() {
        super("settingsOverlayContent", "settingsOverlay", "settingsToggle")
        this.addToDivById("global")
        this.add(new Module("div", STRINGS.SETTINGS_TITLE, "settingsTitle"))
        
        this.add(new Module("div", STRINGS.SETTINGS_GENERAL, "settingsSubtitle"))

        this.add(new Module("div", STRINGS.SETTINGS_DISPLAY, "settingsSubtitle"))
        let showTxtPreviews = new FormCheckbox(
            "showTxtPreviews",
            STRINGS.SETTINGS_SHOW_TXT_PREVIEWS,
            "settingsCheckbox",
            localStorage.kb_allow_txt_previews == 'true')
            showTxtPreviews.onChange = (state: boolean) => {
            localStorage.kb_allow_txt_previews = state
        }
        this.add(showTxtPreviews)
        let showImgPreviews = new FormCheckbox(
            "showImgPreviews",
            STRINGS.SETTINGS_SHOW_IMG_PREVIEWS,
            "settingsCheckbox",
            localStorage.kb_allow_img_previews == 'true')
        showImgPreviews.onChange = (state: boolean) => {
            localStorage.kb_allow_img_previews = state
        }
        this.add(showImgPreviews)
        let showPDFPreviews = new FormCheckbox(
            "showPDFPreviews",
            STRINGS.SETTINGS_SHOW_PDF_PREVIEWS,
            "settingsCheckbox",
            localStorage.kb_allow_pdf_previews == 'true')
        showPDFPreviews.onChange = (state: boolean) => {
            localStorage.kb_allow_pdf_previews = state
        }
        this.add(showPDFPreviews)

        this.add(new Module("div", STRINGS.SETTINGS_CONNECTION, "settingsSubtitle"))
        let loginButton = new Button(STRINGS.SETTINGS_SELECT_SERVER, "buttonWide")
        loginButton.onClick = () => {
            this.toggleVisibility()
            PageManager.open("login", {})
        }
        this.add(loginButton)

    }

    public update(): void {}
}
