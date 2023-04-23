import { Module } from "./module"

export class Button extends Module<HTMLLinkElement> {
    constructor(text: string, cssClass: string = "") {
        super("a")
        this.htmlElement.innerText = text
        if (cssClass != "") {
            this.setClass(cssClass)
        }
        this.htmlElement.onclick = () => {this.onClick()}
    }

    public onClick() {
        console.log("Buttom::onClick: Not implemented! Must be implemented by subclass.")
    }
}
