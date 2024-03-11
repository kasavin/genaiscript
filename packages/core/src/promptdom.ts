import { fenceMD } from "./markdown"
import { stringifySchemaToTypeScript } from "./schema"
import { MarkdownTrace } from "./trace"
import { assert, trimNewlines } from "./util"
import { YAMLStringify } from "./yaml"

export interface PromptNode {
    type?: "text" | "image" | "schema" | undefined
    children?: PromptNode[]
    priority?: number
    error?: unknown
}

export interface PromptTextNode extends PromptNode {
    type: "text"
    value: string | Promise<string>
}

export interface PromptImage {
    url: string
    detail?: "low" | "high"
}

export interface PromptImageNode extends PromptNode {
    type: "image"
    value: PromptImage | Promise<PromptImage>
}

export interface PromptSchemaNode extends PromptNode {
    type: "schema"
    name: string
    value: JSONSchema
    options?: DefSchemaOptions
}

export function createTextNode(
    value: string | Promise<string>
): PromptTextNode {
    assert(value !== undefined)
    return { type: "text", value }
}

export function createImageNode(
    value: PromptImage | Promise<PromptImage>
): PromptImageNode {
    assert(value !== undefined)
    return { type: "image", value }
}

export function createSchemaNode(
    name: string,
    value: JSONSchema,
    options?: DefSchemaOptions
): PromptSchemaNode {
    assert(!!name)
    assert(value !== undefined)
    return { type: "schema", name, value, options }
}

export function appendChild(parent: PromptNode, child: PromptNode): void {
    if (!parent.children) {
        parent.children = []
    }
    parent.children.push(child)
}

export async function visitNode(
    node: PromptNode,
    visitor: {
        node?: (node: PromptNode) => Promise<void>
        text?: (node: PromptTextNode) => Promise<void>
        image?: (node: PromptImageNode) => Promise<void>
        schema?: (node: PromptSchemaNode) => Promise<void>
    }
) {
    await visitor.node?.(node)
    switch (node.type) {
        case "text":
            await visitor.text?.(node as PromptTextNode)
            break
        case "image":
            await visitor.image?.(node as PromptImageNode)
            break
        case "schema":
            await visitor.schema?.(node as PromptSchemaNode)
            break
    }
    if (node.children) {
        for (const child of node.children) {
            await visitNode(child, visitor)
        }
    }
}

export async function renderPromptNode(
    node: PromptNode,
    options?: { trace: MarkdownTrace }
): Promise<{
    prompt: string
    images: PromptImage[]
    errors: unknown[]
    schemas: Record<string, JSONSchema>
}> {
    const { trace } = options || {}

    let prompt = ""
    const images: PromptImage[] = []
    const errors: unknown[] = []
    const schemas: Record<string, JSONSchema> = {}
    await visitNode(node, {
        text: async (n) => {
            try {
                const value = await n.value
                if (value != undefined) prompt += value + "\n"
            } catch (e) {
                node.error = e
                errors.push(e)
            }
        },
        image: async (n) => {
            try {
                const v = await n.value
                if (v !== undefined) {
                    images.push(v)
                    trace?.image(v.url, v.detail)
                }
            } catch (e) {
                node.error = e
                errors.push(e)
            }
        },
        schema: async (n) => {
            const { name: schemaName, value: schema, options } = n
            if (schemas[schemaName])
                trace.error("duplicate schema name: " + schemaName)
            schemas[schemaName] = schema
            const { format = "typescript" } = options || {}
            let schemaText: string
            switch (format) {
                case "json":
                    schemaText = JSON.stringify(schema, null, 2)
                    break
                case "yaml":
                    schemaText = YAMLStringify(schema)
                    break
                default:
                    schemaText = stringifySchemaToTypeScript(schema, {
                        typeName: schemaName,
                    })
                    break
            }
            prompt += `${schemaName}:
\`\`\`${format + "-schema"}
${trimNewlines(schemaText)}
\`\`\`
`
            if (trace && format !== "json")
                trace.detailsFenced(
                    `🧬 schema ${schemaName} as ${format}`,
                    schemaText,
                    format
                )
        },
    })
    return { prompt, images, errors, schemas }
}
