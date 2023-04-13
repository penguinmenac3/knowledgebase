import { Module } from "../framework/module";

export class Overview extends Module<HTMLDivElement> {
    public constructor() {
        super("div")

        this.htmlElement.innerText = "Hallo Welt!"
    }
}