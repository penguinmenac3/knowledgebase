import { KWARGS, Module } from "./module";

export interface Pages{
    [x: string]: Module<HTMLElement>
}


export class PageManager {
    private currentPage = ""

    constructor(
        private defaultPage: string,
        private pages: Pages,
    ) {
        if (location.hash.slice(1) == "") {
            location.hash = "#" + defaultPage;
        }
        window.onhashchange = (_: HashChangeEvent) => {
            this.onOpen()
        }
        for (const page in pages) {
            document.getElementById("app")?.appendChild(pages[page].htmlElement)
            pages[page].hide()
        }
        
        this.onOpen()
    }

    private onOpen() {
        let kwargs: KWARGS = {}
        let page = this.defaultPage

        let hash = location.hash.slice(1)  // remove #
        let parts = hash.split("&")
        if (parts.length > 0) {
            page = parts[0]
            parts = parts.splice(1)
        }
        for (const part of parts) {
            let tokens = part.split("=")
            let key = decodeURIComponent(tokens[0])
            let val = decodeURIComponent(tokens[1])
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
        window.setTimeout(() => {
            let kwargs_str = ""
            for (let key in kwargs) {
                kwargs_str += "&" + encodeURIComponent(key) + "=" + encodeURIComponent(kwargs[key])
            }
            location.hash = "#" + encodeURIComponent(page) + kwargs_str
        }, 200)
    }

    public static back() {
        history.back()
    }
}
