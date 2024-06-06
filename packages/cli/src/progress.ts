import ora, { Ora } from "ora"
import {
    ChatCompletionsProgressReport,
    GenerationProgress,
    Progress,
} from "genaiscript-core"
import { isQuiet } from "./log"

export class ProgressSpinner extends Progress implements GenerationProgress {
    constructor(readonly spinner: Ora) {
        super()
    }
    name: string
    id: string

    log(message: string): void {
        this.report({ message })
    }
    completion(value: ChatCompletionsProgressReport): void {
        this.report({ count: value.tokensSoFar })
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

export class ConsoleProgress extends Progress implements GenerationProgress {
    constructor(readonly options: ConsoleProgressOptions) {
        super()
    }
    name: string
    id: string

    count: number = 0
    log(message: string): void {
        if (!this.options.quiet) process.stderr.write(message + "\n")
    }
    completion(value: ChatCompletionsProgressReport): void {
        const { responseChunk } = value
        if (this.options.stream && responseChunk)
            process.stdout.write(responseChunk)
        this.report({ count: value.tokensSoFar })
    }
    report(value: {
        message?: string
        count?: number
        succeeded?: boolean
    }): void {
        const { message = "", count, succeeded } = value
        if (succeeded === true) {
            this.log(`✅ ${message}`)
        } else if (succeeded === false) {
            this.log(`❌ ${message}`)
        } else if (message) {
            this.log(message)
        }
        if (!isNaN(count)) {
            this.count = count
        }
    }
    warn(message: string) {
        this.log(`warning: ${message}`)
    }
}

export interface ConsoleProgressOptions {
    stream: boolean
    quiet: boolean
}

export function createConsoleProgress(
    options: ConsoleProgressOptions
): ConsoleProgress {
    return new ConsoleProgress(options)
}
