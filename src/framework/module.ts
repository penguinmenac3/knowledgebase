export interface KWARGS {
    [x: string]: string
}


export class Module {
    protected htmlElement: HTMLElement
    private displayStyle: string = ""

    protected constructor(htmlElement: HTMLElement | null = null) {
        if (htmlElement == null) {
            this.htmlElement = document.createElement("div")
        } else {
            this.htmlElement = htmlElement
        }
    }
    
    protected add(module: Module): void {
        this.htmlElement.appendChild(module.htmlElement)
    }

    protected remove(module: Module): void {
        this.htmlElement.removeChild(module.htmlElement)
    }

    public hide() {
        if (this.htmlElement.style.display == "None") return;
        this.displayStyle = this.htmlElement.style.display
        this.htmlElement.style.display = "None"
    }

    public show() {
        if (this.displayStyle == "") return;
        this.htmlElement.style.display = this.displayStyle
    }

    public update(kwargs: KWARGS) {}

    public select() {
        this.setClass("selected")
    }

    public unselect() {
        this.unsetClass("selected")
    }

    protected setClass(className: string) {
        if (!this.htmlElement.classList.contains(className)) {
            this.htmlElement.classList.add(className)
        }
    }

    protected unsetClass(className: string) {
        if (!this.htmlElement.classList.contains(className)) {
            this.htmlElement.classList.remove(className)
        }
    }

    // To duplicate the object use structuredClone(module):
    // https://developer.mozilla.org/en-US/docs/Web/API/structuredClone
}
