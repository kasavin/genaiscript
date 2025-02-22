import { normalizeInt, trimTrailingSlash } from "./util"
import { LanguageModelConfiguration, host } from "./host"
import {
    AZURE_OPENAI_API_VERSION,
    MAX_CACHED_TEMPERATURE,
    MAX_CACHED_TOP_P,
    MODEL_PROVIDER_AZURE,
    MODEL_PROVIDER_OPENAI,
    TOOL_ID,
} from "./constants"
import { estimateTokens } from "./tokens"
import {
    ChatCompletionChunk,
    ChatCompletionHandler,
    ChatCompletionRequestCacheKey,
    ChatCompletionResponse,
    ChatCompletionToolCall,
    LanguageModel,
    LanguageModelInfo,
    getChatCompletionCache,
} from "./chat"
import { RequestError, errorMessage } from "./error"
import { createFetch } from "./fetch"
import { parseModelIdentifier } from "./models"
import { JSON5TryParse } from "./json5"

function getConfigHeaders(cfg: LanguageModelConfiguration) {
    const res = {
        // openai
        authorization: /^Bearer /.test(cfg.token)
            ? cfg.token
            : cfg.token && (cfg.type === "openai" || cfg.type === "localai")
              ? `Bearer ${cfg.token}`
              : undefined,
        // azure
        "api-key":
            cfg.token && !/^Bearer /.test(cfg.token) && cfg.type === "azure"
                ? cfg.token
                : undefined,
        "user-agent": TOOL_ID,
    }
    return res
}

export const OpenAIChatCompletion: ChatCompletionHandler = async (
    req,
    cfg,
    options,
    trace
) => {
    const { temperature, top_p, seed, tools } = req
    const {
        requestOptions,
        partialCb,
        maxCachedTemperature = MAX_CACHED_TEMPERATURE,
        maxCachedTopP = MAX_CACHED_TOP_P,
        cache: useCache,
        cacheName,
        retry,
        retryDelay,
        maxDelay,
    } = options
    const { signal } = requestOptions || {}
    const { headers, ...rest } = requestOptions || {}
    const { token, source, ...cfgNoToken } = cfg
    const { model } = parseModelIdentifier(req.model)

    const cache = getChatCompletionCache(cacheName)
    const caching =
        useCache === true || // always use cache
        (useCache !== false && // never use cache
            seed === undefined && // seed is not cacheable (let the LLM make the run deterministic)
            !tools?.length && // assume tools are non-deterministic by default
            (isNaN(temperature) ||
                isNaN(maxCachedTemperature) ||
                temperature < maxCachedTemperature) && // high temperature is not cacheable (it's too random)
            (isNaN(top_p) || isNaN(maxCachedTopP) || top_p < maxCachedTopP))
    trace.itemValue(`caching`, caching)
    const cachedKey = caching
        ? <ChatCompletionRequestCacheKey>{
              ...req,
              ...cfgNoToken,
              model: req.model,
              temperature: req.temperature,
              top_p: req.top_p,
              max_tokens: req.max_tokens,
          }
        : undefined
    const { text: cached, finishReason: cachedFinishReason } =
        (cachedKey ? await cache.get(cachedKey) : undefined) || {}
    if (cached !== undefined) {
        partialCb?.({
            tokensSoFar: estimateTokens(model, cached),
            responseSoFar: cached,
            responseChunk: cached,
        })
        trace.itemValue(`cache hit`, await cache.getKeySHA(cachedKey))
        return { text: cached, finishReason: cachedFinishReason, cached: true }
    }

    const r2 = { ...req, model }
    let postReq: any = r2

    let url = ""
    const toolCalls: ChatCompletionToolCall[] = []

    if (cfg.type === "openai" || cfg.type === "localai") {
        r2.stream = true
        url = trimTrailingSlash(cfg.base) + "/chat/completions"
    } else if (cfg.type === "azure") {
        r2.stream = true
        delete r2.model
        url =
            trimTrailingSlash(cfg.base) +
            "/" +
            model.replace(/\./g, "") +
            `/chat/completions?api-version=${AZURE_OPENAI_API_VERSION}`
    } else throw new Error(`api type ${cfg.type} not supported`)

    trace.itemValue(`url`, `[${url}](${url})`)

    let numTokens = 0
    const fetchRetry = await createFetch({
        trace,
        retries: retry,
        retryDelay,
        maxDelay,
    })
    trace.dispatchChange()

    trace.detailsFenced(
        `✉️ fetch`,
        `curl -X POST ${url} \\
-H "Content-Type: application/json" \\
${Object.entries(cfg.curlHeaders || {})
    .map(([k, v]) => `-H "${k}: ${v}" \\`)
    .join("\n")}
-d '${JSON.stringify(postReq).replace(/'/g, "'\\''")}' 
`,
        "bash"
    )
    const body = JSON.stringify(postReq)
    let r: Response
    try {
        r = await fetchRetry(url, {
            headers: {
                ...getConfigHeaders(cfg),
                "content-type": "application/json",
                ...(headers || {}),
            },
            body,
            method: "POST",
            ...(rest || {}),
        })
    } catch (e) {
        trace.error(errorMessage(e), e)
        throw e
    }

    trace.itemValue(`response`, `${r.status} ${r.statusText}`)
    if (r.status !== 200) {
        let body: string
        try {
            body = await r.text()
        } catch (e) {}
        const { error } = JSON5TryParse(body, {}) as { error: unknown }
        if (error) trace.error(undefined, error)
        throw new RequestError(
            r.status,
            r.statusText,
            error,
            body,
            normalizeInt(r.headers.get("retry-after"))
        )
    }

    trace.content += "\n\n"

    let done = false
    let finishReason: ChatCompletionResponse["finishReason"] = undefined
    let chatResp = ""
    let pref = ""

    const decoder = host.createUTF8Decoder()
    if (r.body.getReader) {
        const reader = r.body.getReader()
        while (!signal?.aborted) {
            const { done, value } = await reader.read()
            if (done) break
            doChunk(value)
        }
    } else {
        for await (const value of r.body as any) {
            if (signal?.aborted) break
            doChunk(value)
        }
    }
    if (signal?.aborted) finishReason = "cancel"

    trace.content += "\n\n"
    trace.itemValue(`finish reason`, finishReason)
    if (done && finishReason === "stop")
        await cache.set(cachedKey, { text: chatResp, finishReason }, { trace })

    return { text: chatResp, toolCalls, finishReason }

    function doChunk(value: Uint8Array) {
        // Massage and parse the chunk of data
        let chunk = decoder.decode(value, { stream: true })

        chunk = pref + chunk
        const ch0 = chatResp
        chunk = chunk.replace(/^data:\s*(.*)[\r\n]+/gm, (_, json) => {
            if (json === "[DONE]") {
                done = true
                return ""
            }
            try {
                const obj: ChatCompletionChunk = JSON.parse(json)
                if (!obj.choices?.length) return ""
                else if (obj.choices?.length != 1)
                    throw new Error("too many choices in response")
                const choice = obj.choices[0]
                const { finish_reason, delta } = choice
                if (finish_reason) finishReason = finish_reason as any
                if (typeof delta?.content == "string") {
                    numTokens += estimateTokens(model, delta.content)
                    chatResp += delta.content
                    if (delta.content)
                        trace.content += delta.content.includes("`")
                            ? `\`\`\` ${delta.content.replace(/\n/g, " ")} \`\`\` `
                            : `\`${delta.content.replace(/\n/g, " ")}\` `
                } else if (Array.isArray(delta.tool_calls)) {
                    const { tool_calls } = delta
                    for (const call of tool_calls) {
                        const tc =
                            toolCalls[call.index] ||
                            (toolCalls[call.index] = {
                                id: call.id,
                                name: call.function.name,
                                arguments: "",
                            })
                        if (call.function.arguments)
                            tc.arguments += call.function.arguments
                    }
                }
                if (
                    finish_reason === "function_call" ||
                    finish_reason === "tool_calls"
                ) {
                    finishReason = "tool_calls"
                } else {
                    finishReason = finish_reason
                }
            } catch (e) {
                trace.error(`error processing chunk`, e)
            }
            return ""
        })
        const progress = chatResp.slice(ch0.length)
        if (progress != "") {
            // logVerbose(`... ${progress.length} chars`);
            partialCb?.({
                responseSoFar: chatResp,
                tokensSoFar: numTokens,
                responseChunk: progress,
            })
        }
        pref = chunk
    }
}

async function listModels(
    cfg: LanguageModelConfiguration
): Promise<LanguageModelInfo[]> {
    const fetch = await createFetch()
    const res = await fetch(cfg.base + "/models", {
        method: "GET",
        headers: {
            ...getConfigHeaders(cfg),
            Accept: "application/json",
        },
    })
    if (res.status !== 200) return []
    const { data } = (await res.json()) as {
        object: "list"
        data: {
            id: string
            object: "model"
            created: number
            owned_by: string
        }[]
    }
    return data.map(
        (m) =>
            <LanguageModelInfo>{
                id: m.id,
                details: `${m.id}, ${m.owned_by}`,
            }
    )
}

export const OpenAIModel = Object.freeze<LanguageModel>({
    completer: OpenAIChatCompletion,
    id: MODEL_PROVIDER_OPENAI,
    listModels,
})
