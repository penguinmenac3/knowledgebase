export class CallLaterButOnlyOnce {
    private activeTimeout: number | undefined = undefined
    constructor(private timeout: number) {

    }

    public defer(callback: CallableFunction): void {
        if (this.activeTimeout) {
            window.clearTimeout(this.activeTimeout)
        }
        this.activeTimeout = window.setTimeout(() => {
            this.activeTimeout = undefined
            callback()
        },this.timeout)
    }
}
