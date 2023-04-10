import { KWARGS, Module } from "./module";

export interface Pages{
    [x: string]: Module
}


export class PageManager {
    private currentPage = ""

    constructor(
        private defaultPage: string,
        private pages: Pages,
    ) {
        window.onhashchange = (ev: HashChangeEvent) => {
            this.onOpen()
        }
        for (const page in pages) {
            pages[page].hide()
        }
        this.onOpen()
    }

    private onOpen() {
        let kwargs: KWARGS = {}
        let page = this.defaultPage

        let hash = location.hash.slice(1)  // remove #
        let parts = hash.split("&")
        for (const part of parts) {
            let tokens = part.split("=")
            let key = tokens[0]
            let val = tokens[1]
            if (key == "page") {
                page = val
            }
            kwargs[key] = val
        }

        if (this.currentPage != page) {
            console.log("Hide page: " + this.currentPage)
            this.pages[this.currentPage]?.hide()
            this.currentPage = page
            console.log("Show page: " + page)
            this.pages[this.currentPage]?.show()
        }
        console.log("Calling page.update with: " + JSON.stringify(kwargs))

        this.pages[this.currentPage]?.update(kwargs)
    }

    public static open(page: string, kwargs: KWARGS) {
        let kwargs_str = ""
        for (let key in kwargs) {
            kwargs_str += "&" + key + "=" + kwargs[key]
        }
        location.hash = "#page=" + page + kwargs_str
    }

    public static back() {
        history.back()
    }
}
