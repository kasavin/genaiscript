import ora, { Ora } from "ora"
import { ChatCompletionsProgressReport, ChildGenerationProgress, GenerationProgress, Progress } from "genaiscript-core"

export class ProgressSpinner extends Progress, implements GenerationProgress {
    constructor(readonly spinner: Ora) {
        super()
    }
    name: string
    id: string
    log(text: string): void {
        throw new Error("Method not implemented.")
    }
    completion(value: ChatCompletionsProgressReport): void {
        throw new Error("Method not implemented.")
    }

    override report(value: {
        message?: string
        count?: number
        succeeded?: boolean
    }): void {
        const { message, count, succeeded } = value
        if (succeeded === true) {
            this.spinner.succeed(message || "")
            this.spinner.stopAndPersist()
        } else if (succeeded === false) {
            this.spinner.fail(message || "")
            this.spinner.stopAndPersist()
        } else if (message) {
            this.spinner.suffixText = ""
            this.spinner.start(message)
        }
        if (!isNaN(count)) this.spinner.suffixText = "" + count
    }

    warn(message: string) {
        this.spinner.warn(message)
    }

    stop() {
        this.spinner.stop()    
        super.stop()
    }

    get text() {
        return this.spinner.text
    }
}

export function createProgressSpinner(
    message: string,
    interval = 200
): ProgressSpinner {
    return new ProgressSpinner(ora({ interval }).start(message))
}
