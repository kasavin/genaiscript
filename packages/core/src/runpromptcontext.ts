import { minimatch } from "minimatch"
import {
    PromptNode,
    appendChild,
    createAssistantNode,
    createChatParticipant,
    createDefDataNode,
    createDefNode,
    createFunctionNode,
    createImageNode,
    createSchemaNode,
    createStringTemplateNode,
    createTextNode,
} from "./promptdom"
import { MarkdownTrace } from "./trace"
import { GenerationOptions } from "./promptcontext"
import { CancelError } from "./error"
import { promptParametersSchemaToJSONSchema } from "./parameters"
import { isJSONSchema } from "./schema"
import { consoleLogFormat } from "./logging"
import { resolveFileDataUri } from "./file"

export function createChatTurnGenerationContext(
    options: GenerationOptions,
    trace: MarkdownTrace
): ChatTurnGenerationContext & { node: PromptNode } {
    const node: PromptNode = { children: [] }

    const log = (...args: any[]) => {
        const line = consoleLogFormat(...args)
        if (line) trace.log(line)
    }
    const console = Object.freeze<PromptGenerationConsole>({
        log,
        debug: log,
        warn: (args) => trace.warn(consoleLogFormat(...args)),
        error: (args) => trace.error(consoleLogFormat(...args)),
    })

    const ctx = <ChatTurnGenerationContext & { node: PromptNode }>{
        node,
        writeText: (body, options) => {
            if (body !== undefined && body !== null) {
                const { priority, maxTokens } = options || {}
                appendChild(
                    node,
                    options?.assistant
                        ? createAssistantNode(body, { priority, maxTokens })
                        : createTextNode(body, { priority, maxTokens })
                )
            }
        },
        $(strings, ...args) {
            appendChild(node, createStringTemplateNode(strings, args))
        },
        def(name, body, defOptions) {
            name = name ?? ""
            const doptions = { ...(defOptions || {}), trace }
            doptions.lineNumbers = doptions.lineNumbers ?? options.lineNumbers
            // shortcuts
            if (body === undefined || body === null) {
                if (!doptions.ignoreEmpty)
                    throw new CancelError(`def ${name} is ${body}`)
                return undefined
            } else if (Array.isArray(body)) {
                if (body.length === 0 && !doptions.ignoreEmpty)
                    throw new CancelError(`def ${name} files is empty`)
                body.forEach((f) => ctx.def(name, f, defOptions))
            } else if (typeof body === "object" && body.filename) {
                const { glob, endsWith } = defOptions || {}
                const filename = body.filename
                if (glob && filename) {
                    const match = minimatch(filename, glob, {
                        windowsPathsNoEscape: true,
                    })
                    if (!match) return undefined
                }
                if (endsWith && !filename.endsWith(endsWith)) return undefined
                appendChild(node, createDefNode(name, body, doptions))
            } else if (typeof body === "string") {
                if (body.trim() === "" && !doptions.ignoreEmpty)
                    throw new CancelError(`def ${name} is empty`)
                appendChild(
                    node,
                    createDefNode(
                        name,
                        { filename: "", content: body },
                        doptions
                    )
                )
            }

            // TODO: support clause
            return name
        },
        defData: (name, data, defOptions) => {
            appendChild(node, createDefDataNode(name, data, defOptions))
            return name
        },
        fence(body, options?: DefOptions) {
            ctx.def("", body, options)
            return undefined
        },
        console,
    }

    return ctx
}

export interface RunPromptContextNode extends ChatGenerationContext {
    node: PromptNode
}

export function createChatGenerationContext(
    options: GenerationOptions,
    trace: MarkdownTrace
): RunPromptContextNode {
    const turnCtx = createChatTurnGenerationContext(options, trace)
    const node = turnCtx.node

    const defTool: (
        name: string,
        description: string,
        parameters: PromptParametersSchema | JSONSchema,
        fn: ChatFunctionHandler
    ) => void = (name, description, parameters, fn) => {
        const parameterSchema = isJSONSchema(parameters)
            ? (parameters as JSONSchema)
            : promptParametersSchemaToJSONSchema(
                  parameters as PromptParametersSchema
              )
        appendChild(
            node,
            createFunctionNode(name, description, parameterSchema, fn)
        )
    }

    const defSchema = (
        name: string,
        schema: JSONSchema,
        defOptions?: DefSchemaOptions
    ) => {
        appendChild(node, createSchemaNode(name, schema, defOptions))

        return name
    }

    const defImages = (files: StringLike, defOptions?: DefImagesOptions) => {
        const { detail } = defOptions || {}
        if (Array.isArray(files))
            files.forEach((file) => defImages(file, defOptions))
        else if (typeof files === "string")
            appendChild(node, createImageNode({ url: files, detail }))
        else {
            const file: WorkspaceFile = files
            appendChild(
                node,
                createImageNode(
                    (async () => {
                        const url = await resolveFileDataUri(file, { trace })
                        return {
                            url,
                            filename: file.filename,
                            detail,
                        }
                    })()
                )
            )
        }
    }

    const defChatParticipant = (
        generator: ChatParticipantHandler,
        options?: ChatParticipantOptions
    ) => {
        if (generator)
            appendChild(node, createChatParticipant({ generator, options }))
    }

    const ctx = <RunPromptContextNode>{
        ...turnCtx,
        defTool,
        defSchema,
        defImages,
        defChatParticipant,
    }

    return ctx
}
