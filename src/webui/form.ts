import { Button } from "./button";
import { Module } from "./module";

export class Form extends Module<HTMLDivElement> {
    constructor(...modules: Module<HTMLElement>[]) {
        super("div")
        for (const module of modules) {
            this.add(module)
        }
    }

    public submit() {
        let params = new FormData()
        for (const key in this.htmlElement.children) {
            let module = this.htmlElement.children[key]
            if (module instanceof HTMLInputElement) {
                params.append(module.name, module.value)
            }
        }
        this.onSubmit(params)
    }

    public onSubmit(formData: FormData) {
        console.log("Form::onSubmit: Not implemented! Must be implemented by subclass.")
        console.log(formData)
    }
}

export class FormInput extends Module<HTMLInputElement> {
    constructor(name: string, placeholder: string, type: string, cssClass: string = "") {
        super("input")
        this.htmlElement.name = name
        this.htmlElement.placeholder = placeholder
        this.htmlElement.type = type
        if (cssClass != "") {
            this.setClass(cssClass)
        }
        this.htmlElement.oninput = () => {
            this.onChange(this.htmlElement.value)
        }
    }

    public value(setval: string | undefined = undefined): string {
        if (setval !== undefined) {
            this.htmlElement.value = setval
        }
        return this.htmlElement.value
    }

    public onChange(_: string) {
        //console.log(value)
    }
}

export class FormLabel extends Module<HTMLLabelElement> {
    constructor(text: string, cssClass: string = "") {
        super("label")
        this.htmlElement.innerText = text
        if (cssClass != "") {
            this.setClass(cssClass)
        }
    }
}

export class FormSubmit extends Button {
    public onClick() {
        let parent = this.parent as Form
        parent.submit()
    }
}
