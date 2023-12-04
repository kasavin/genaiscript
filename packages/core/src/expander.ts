import {
    ChatCompletionsOptions,
    RequestError,
    getChatCompletions,
} from "./chat"
import { Fragment, PromptTemplate, allChildren } from "./ast"
import { Edits } from "./edits"
import { commentAttributes, stringToPos } from "./parser"
import { assert, fileExists, readText, relativePath } from "./util"
import {
    evalPrompt,
    extractFenced,
    renderFencedVariables,
    staticVars,
} from "./template"
import { host } from "./host"
import { inspect } from "./logging"
import { initToken } from "./oai_token"
import { applyLLMDiff, applyLLMPatch, parseLLMDiffs } from "./diff"

const defaultModel = "gpt-4"
const defaultTemperature = 0.2 // 0.0-2.0, defaults to 1.0
const defaultMaxTokens: number = undefined

export interface FragmentTransformResponse {
    /**
     * The env variables sent to the prompt
     */
    vars: Partial<ExpansionVariables>

    /**
     * Expanded prompt text
     */
    prompt: {
        system: string
        user: string
    }
    /**
     * Zero or more edits to apply.
     */
    edits: Edits[]

    /**
     * A map of file updates
     */
    fileEdits: Record<string, { before: string; after: string }>

    /**
     * MD-formatted trace.
     */
    trace: string

    /**
     * LLM output.
     */
    text: string

    /**
     * Summary of the output generated by the LLM
     */
    summary?: string
}

// 'foo.bar.baz' -> [ 'foo', 'foo.bar', 'foo.bar.baz' ]
function prefixes(w: string) {
    const words = w.split(".")
    return words.map((_, i) => words.slice(0, i + 1).join("."))
}

function trimNewlines(s: string) {
    return s.replace(/^\n*/, "").replace(/\n*$/, "")
}
const fence = "```"
const markdownFence = "``````"
export function fenceMD(t: string, contentType?: string) {
    if (!contentType) contentType = "markdown"
    const f = contentType === "markdown" ? markdownFence : fence
    return `\n${f}${contentType}\n${trimNewlines(t)}\n${f}\n`
}

async function callExpander(r: PromptTemplate, vars: ExpansionVariables) {
    let promptText = ""
    let errors = ""
    let success = true
    const env = new Proxy(vars, {
        get: (target: any, prop, recv) => {
            const v = target[prop]
            if (v === undefined) {
                errors += `-  \`env.${String(prop)}\` not defined\n`
                return ""
            }
            return v
        },
    })
    let logs = ""
    try {
        await evalPrompt(
            {
                env,
                text: (body) => {
                    promptText +=
                        body.replace(/\n*$/, "").replace(/^\n*/, "") + "\n\n"

                    const idx = body.indexOf(vars.error)
                    if (idx >= 0) {
                        const msg = body
                            .slice(idx + vars.error.length)
                            .replace(/\n[^]*/, "")
                        throw new Error(msg)
                    }
                },
                gptool: () => {},
                system: () => {},
                fetchText: async (urlOrFile) => {
                    if (typeof urlOrFile === "string") {
                        urlOrFile = {
                            label: urlOrFile,
                            filename: urlOrFile,
                            content: "",
                        }
                    }
                    const url = urlOrFile.filename
                    let ok = false
                    let status = 404
                    let text: string
                    if (/^https?:\/\//i.test(url)) {
                        const resp = await fetch(url)
                        ok = resp.ok
                        status = resp.status
                        if (ok) text = await resp.text()
                    } else {
                        try {
                            text = await readText("workspace://" + url)
                            ok = true
                        } catch (e) {
                            console.debug(e)
                            ok = false
                            status = 404
                        }
                    }
                    const file: LinkedFile = {
                        label: urlOrFile.label,
                        filename: urlOrFile.label,
                        content: text,
                    }
                    return {
                        ok,
                        status,
                        text,
                        file,
                    }
                },
            },
            r.jsSource,
            (msg) => {
                logs += msg + "\n"
            }
        )
    } catch (e) {
        success = false
        const m = /at eval.*<anonymous>:(\d+):(\d+)/.exec(e.stack)
        const info = m ? ` at prompt line ${m[1]}, column ${m[2]}` : ""
        errors += `-  ${e.name}: ${e.message}${info}\n`
    }
    return { logs, errors, success, text: promptText }
}

export function startDetails(title: string) {
    return `\n\n<details id="${title.replace(
        /\s+/g,
        "-"
    )}"><summary>${title}</summary>\n\n`
}

export function endDetails() {
    return `\n\n</details>\n`
}

export function details(title: string, body: string) {
    return `${startDetails(title)}${body}${endDetails()}`
}

async function expandTemplate(
    template: PromptTemplate,
    fragment: Fragment,
    env: ExpansionVariables
) {
    const varName: Record<string, string> = {}
    for (const [k, v] of Object.entries(env)) {
        if (!varName[v]) varName[v] = k
    }
    const varMap = env as any as Record<string, string | any[]>

    // we put errors on top so they draw attention
    let trace = `
# \`${template.id}\` trace

@@errors@@

`

    let errors = ``

    const prompt = await callExpander(template, env)

    const expanded = prompt.text
    errors += prompt.errors

    // always append, even if empty - should help with discoverability:
    // "Oh, so I can console.log() from prompt!"
    trace += startDetails("console output")
    if (prompt.logs?.length) trace += fenceMD(prompt.logs)
    else trace += `> tip: use \`console.log()\` from gptool.js files`
    trace += endDetails()

    trace += details("variables", traceVars())

    let systemText = ""
    let model = template.model
    let temperature = template.temperature
    let max_tokens = template.maxTokens

    trace += startDetails(`system gptools`)

    const systems = (template.system ?? []).slice(0)
    if (!systems.length) {
        systems.push("system")
        systems.push("system.explanations")
        systems.push("system.files")
        systems.push("system.summary")
    }
    for (let i = 0; i < systems.length; ++i) {
        let systemTemplate = systems[i]
        let system = fragment.file.project.getTemplate(systemTemplate)
        if (!system) {
            if (systemTemplate)
                trace += `\n** error: \`${systemTemplate}\` not found\n`
            if (i > 0) continue
            systemTemplate = "system"
            system = fragment.file.project.getTemplate(systemTemplate)
            assert(!!system)
        }

        const sysex = (await callExpander(system, env)).text
        systemText += sysex + "\n"

        model = model ?? system.model
        temperature = temperature ?? system.temperature
        max_tokens = max_tokens ?? system.maxTokens

        trace += `###  \`${systemTemplate}\` source\n`
        if (system.model) trace += `-  model: \`${system.model || ""}\`\n`
        if (system.temperature !== undefined)
            trace += `-  temperature: ${system.temperature || ""}\n`
        if (system.maxTokens !== undefined)
            trace += `-  max tokens: ${system.maxTokens || ""}\n`

        trace += fenceMD(system.jsSource, "js")
        trace += "#### expanded"
        trace += fenceMD(sysex)
    }
    trace += endDetails()

    trace += details("gptool source", fenceMD(template.jsSource, "js"))

    model = (env.vars["model"] ??
        model ??
        fragment.project.coarchJson.model ??
        defaultModel) as any
    temperature =
        tryParseFloat(env.vars["temperature"]) ??
        temperature ??
        defaultTemperature
    max_tokens =
        tryParseInt(env.vars["maxTokens"]) ?? max_tokens ?? defaultMaxTokens

    trace += startDetails("gptool expanded prompt")
    if (model) trace += `-  model: \`${model || ""}\`\n`
    if (temperature !== undefined)
        trace += `-  temperature: ${temperature || ""}\n`
    if (max_tokens !== undefined)
        trace += `-  max tokens: ${max_tokens || ""}\n`
    trace += fenceMD(expanded)

    trace += endDetails()
    trace = trace.replace("@@errors@@", errors)

    return {
        expanded,
        errors,
        trace,
        success: prompt.success,
        model,
        temperature,
        max_tokens,
        systemText,
    }

    function tryParseInt(v: string) {
        const i = parseInt(v)
        return isNaN(i) ? undefined : i
    }

    function tryParseFloat(v: string) {
        const i = parseFloat(v)
        return isNaN(i) ? undefined : i
    }

    function isComplex(k: string) {
        const v = varMap[k]
        if (typeof v === "string" && varName[v] != k) return false
        return (
            typeof v !== "string" ||
            v.length > 40 ||
            v.trim().includes("\n") ||
            v.includes("`")
        )
    }

    function traceVars() {
        let info =
            "> Variables are referenced through `env.NAME` in prompts.\n\n"

        for (const k of Object.keys(env)) {
            if (isComplex(k)) continue
            const v = varMap[k]
            if (typeof v === "string" && varName[v] != k)
                info += `-   env.**${k}**: same as **${varName[v]}**\n\n`
            else info += `-   env.**${k}**: \`${v}\`\n\n`
        }

        for (const k of Object.keys(env)) {
            if (!isComplex(k)) continue
            const v = varMap[k]
            info += `-   env.**${k}**${fenceMD(
                typeof v === "string" ? v : inspect(v),
                typeof v === "string" ? undefined : "js"
            )}\n`
        }

        return info
    }
}

async function fragmentVars(
    template: PromptTemplate,
    frag: Fragment,
    promptOptions: any
) {
    const { file } = frag
    const project = file.project
    const prjFolder = host.projectFolder()

    const links: LinkedFile[] = []
    for (const fr of allChildren(frag, true)) {
        for (const ref of fr.references) {
            // what about URLs?
            if (/^https:\/\//.test(ref.filename)) {
                if (!links.find((lk) => lk.filename === ref.filename)) {
                    let content: string = ""
                    try {
                        let url = ref.filename
                        const m =
                            /^https:\/\/github.com\/(\w+)\/(\w+)\/blob\/(.+)#?/i.exec(
                                url
                            )
                        if (m)
                            url = `https://raw.githubusercontent.com/${m[1]}/${m[2]}/${m[3]}`
                        const resp = await fetch(url)
                        if (resp.ok) content = await resp.text()
                    } catch (e) {
                        console.log(`failed to download ${ref.filename}`)
                        console.debug(e)
                    }
                    links.push({
                        label: ref.name,
                        filename: ref.filename,
                        content,
                    })
                }
                continue
            }

            // check for existing file
            const projectFile = project.allFiles.find(
                (f) => f.filename === ref.filename
            )
            if (!projectFile) {
                console.debug(`reference ${ref.filename} not found`)
                continue
            }

            const fn = relativePath(host.projectFolder(), projectFile.filename)
            if (!links.find((lk) => lk.filename === fn))
                links.push({
                    label: ref.name,
                    filename: fn,
                    content: projectFile.content,
                })
        }
    }
    const parents: LinkedFile[] = []
    if (frag.parent)
        parents.push({
            label: frag.parent.title,
            filename: relativePath(prjFolder, frag.parent.file.filename),
            content: frag.parent.file.content,
        })
    const attrs = commentAttributes(frag)

    const vars: Partial<ExpansionVariables> = {
        ...staticVars(),
        file: {
            filename: relativePath(host.projectFolder(), file.filename),
            label: "current",
            content: file.content,
        },
        links,
        parents,
        promptOptions,
        template,
        vars: attrs,
    }
    return { vars }
}

export type RunTemplateOptions = ChatCompletionsOptions & {
    infoCb?: (partialResponse: FragmentTransformResponse) => void
    promptOptions?: any
    maxCachedTemperature?: number
    skipLLM?: boolean
}

export async function runTemplate(
    template: PromptTemplate,
    fragment: Fragment,
    options?: RunTemplateOptions
): Promise<FragmentTransformResponse> {
    const { requestOptions = {}, skipLLM } = options || {}
    const { signal } = requestOptions

    options?.infoCb?.({
        vars: {},
        prompt: undefined,
        edits: [],
        trace: "",
        text: "> Running GPTool...",
        fileEdits: {},
    })

    const { vars } = await fragmentVars(
        template,
        fragment,
        options.promptOptions
    )
    let {
        expanded,
        success,
        trace,
        model,
        temperature,
        max_tokens,
        systemText,
    } = await expandTemplate(template, fragment, vars as ExpansionVariables)

    const prompt = {
        system: systemText,
        user: expanded,
    }

    // if the expansion failed, show the user the trace
    if (!success) {
        return {
            prompt,
            vars,
            trace,
            text: "# Template failed\nSee info below.\n" + trace,
            edits: [],
            fileEdits: {},
        }
    }

    // don't run LLM
    if (skipLLM) {
        return {
            prompt,
            vars,
            trace,
            text: undefined,
            edits: [],
            fileEdits: {},
        }
    }

    let text: string
    try {
        await initToken()
        options?.infoCb?.({
            prompt,
            vars,
            edits: [],
            trace,
            text: "> Waiting for response...",
            fileEdits: {},
        })
        text = await getChatCompletions(
            {
                model,
                temperature,
                max_tokens,
                messages: [
                    {
                        role: "system",
                        content: systemText,
                    },
                    {
                        role: "user",
                        content: expanded,
                    },
                ],
            },
            options
        )
    } catch (error: unknown) {
        if (error instanceof RequestError) {
            trace += `## Request error\n\n`
            if (error.body) {
                trace += `\n> ${error.body.message}\n\n`
                trace += `-  type: \`${error.body.type}\`\n`
                trace += `-  code: \`${error.body.code}\`\n`
            }
            trace += `-   status: \`${error.status}\`, ${error.statusText}\n`
            options.infoCb({
                prompt,
                vars,
                edits: [],
                trace,
                text: "Request error",
                fileEdits: {},
            })
        } else if (signal?.aborted) {
            trace += `## Request cancelled
            
The user requested to cancel the request.
`
            options.infoCb({
                prompt,
                vars,
                edits: [],
                trace,
                text: "Request cancelled",
                fileEdits: {},
            })
        }
        throw error
    }

    const edits: Edits[] = []
    const obj = {
        label: template.title,
        filename: fragment.file.filename,
    }

    trace += details("LLM response", fenceMD(text))

    const extr = extractFenced(text)
    trace += details("code regions", renderFencedVariables(extr))

    const res: FragmentTransformResponse = {
        prompt,
        vars,
        edits,
        fileEdits: {},
        trace,
        text,
    }
    const { fileEdits } = res

    const projFolder = host.projectFolder()
    const links: string[] = []
    const fp = fragment.file.filename
    const fragn = /^.\//.test(fp)
        ? host.resolvePath(projFolder, fragment.file.filename)
        : fp
    const ff = host.resolvePath(fp, "..")
    const refs = fragment.references
    const fragmentVirtual = await fileExists(fragment.file.filename, {
        virtual: true,
    })

    for (const fence of extr) {
        const { label: name, content: val } = fence
        const pm = /^((file|diff):?)\s+/i.exec(name)
        if (pm) {
            const n = name.slice(pm[0].length).trim()
            const fn = /^[^\/]/.test(n) ? host.resolvePath(projFolder, n) : n
            const ffn = relativePath(ff, fn)
            const curr = refs.find((r) => r.filename === fn)?.filename

            let fileEdit = fileEdits[fn]
            if (!fileEdit) {
                let before: string = null
                let after: string = undefined
                if (await fileExists(fn, { virtual: false }))
                    before = await readText(fn)
                else if (await fileExists(fn, { virtual: true }))
                    after = await readText(fn)
                fileEdit = fileEdits[fn] = { before, after }
            }
            if (/^file/i.test(name)) {
                fileEdit.after = val
            } else if (/^diff/i.test(name)) {
                const chunks = parseLLMDiffs(val)
                try {
                    fileEdit.after = applyLLMPatch(
                        fileEdit.after || fileEdit.before,
                        chunks
                    )
                } catch (e) {
                    console.debug(e)
                    res.trace += `\n\n### Error applying patch\n\n${fenceMD(
                        e.message
                    )}`

                    try {
                        fileEdit.after = applyLLMDiff(
                            fileEdit.after || fileEdit.before,
                            chunks
                        )
                    } catch (e) {
                        console.debug(e)
                        res.trace += `\n\n### Error applying diff\n\n${fenceMD(
                            e.message
                        )}`
                    }
                }
            }
            if (!curr && fragn !== fn) links.push(`-   [${ffn}](${ffn})`)
        } else if (/^summary$/i.test(name)) {
            res.summary = val
        }
    }

    // convert file edits into edits
    Object.entries(fileEdits)
        .filter(([, { before, after }]) => before !== after) // ignore unchanged files
        .forEach(([fn, { before, after }]) => {
            if (before) {
                edits.push({
                    label: `Update ${fn}`,
                    filename: fn,
                    type: "replace",
                    range: [[0, 0], stringToPos(after)],
                    text: after,
                })
            } else {
                edits.push({
                    label: `Create ${fn}`,
                    filename: fn,
                    type: "createfile",
                    text: after,
                    overwrite: true,
                })
            }
        })

    // add links to the end of the file
    if (
        links.length &&
        (!fragmentVirtual || fileEdits[fragment.file.filename]?.after)
    ) {
        edits.push({
            ...obj,
            type: "insert",
            pos: fragment.endPos,
            text: `\n${links.join("\n")}`,
        })
    }

    return res
}
