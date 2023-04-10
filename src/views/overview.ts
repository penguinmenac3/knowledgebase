import { Module } from "../framework/module";

export class Overview extends Module {
    public constructor() {
        super()
        document.getElementById("app")?.appendChild(this.htmlElement)

        this.htmlElement.innerText = "Hallo Welt!"
    }
}