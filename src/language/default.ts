import { English } from "./english";
import { German } from "./german";

export let STRINGS = English

export function setLanguage(languageCode: string) {
    localStorage.language = languageCode
    setupLanguage()
}

export function setupLanguage() {
    switch(localStorage.language) {
        case "de":
            STRINGS = German; break;
        case "en":
        case "us":
        default:
            STRINGS = English; break;
    }
}
