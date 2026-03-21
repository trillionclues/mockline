import yaml from 'yaml'
import type { BuilderState, BuilderEndpoint, BuilderSchemaField, BuilderResponse, BuilderRequestBody } from './types'

export function parseSpecToBuilder(content: string, format: 'YAML' | 'JSON'): BuilderState {
    const spec = format === 'YAML' ? yaml.parse(content) : JSON.parse(content)

    const info = {
        title: spec.info?.title ?? '',
        version: spec.info?.version ?? '1.0.0',
        description: spec.info?.description ?? '',
        basePath: spec.servers?.[0]?.url ?? '/api',
    }

    const endpoints: BuilderEndpoint[] = []

    for (const [path, methods] of Object.entries(spec.paths ?? {})) {
        for (const [method, operation] of Object.entries(methods as Record<string, unknown>)) {
            if (!['get', 'post', 'put', 'patch', 'delete', 'head', 'options'].includes(method)) continue
            const op = operation as Record<string, unknown>

            // Parse parameters
            const params = (op.parameters ?? []) as Array<Record<string, unknown>>
            const pathParams = params
                .filter(p => p.in === 'path')
                .map(p => ({
                    id: crypto.randomUUID(),
                    name: String(p.name ?? ''),
                    description: String(p.description ?? ''),
                    required: Boolean(p.required ?? true),
                    schema: { type: 'string' as const, fields: [] },
                }))

            const queryParams = params
                .filter(p => p.in === 'query')
                .map(p => ({
                    id: crypto.randomUUID(),
                    name: String(p.name ?? ''),
                    description: String(p.description ?? ''),
                    required: Boolean(p.required ?? false),
                    schema: { type: 'string' as const, fields: [] },
                }))

            // Parse request body
            let requestBody: BuilderRequestBody | null = null
            if (op.requestBody && ['post', 'put', 'patch'].includes(method)) {
                const rb = op.requestBody as Record<string, unknown>
                const jsonSchema = (rb.content as Record<string, unknown>)?.['application/json'] as Record<string, unknown> | undefined
                const schema = jsonSchema?.schema as Record<string, unknown> | undefined
                requestBody = {
                    required: Boolean(rb.required ?? false),
                    description: String(rb.description ?? ''),
                    schema: schema ? parseSchemaToFields(schema) : { type: 'object', fields: [] },
                }
            }

            // Parse responses
            const responses: BuilderResponse[] = Object.entries(op.responses ?? {}).map(([code, resp]) => {
                const r = resp as Record<string, unknown>
                const jsonContent = (r.content as Record<string, unknown>)?.['application/json'] as Record<string, unknown> | undefined
                const jsonSchema = jsonContent?.schema as Record<string, unknown> | undefined
                return {
                    id: crypto.randomUUID(),
                    statusCode: code,
                    description: String(r.description ?? ''),
                    schema: jsonSchema ? parseSchemaToFields(jsonSchema) : { type: 'object' as const, fields: [] },
                }
            })

            endpoints.push({
                id: crypto.randomUUID(),
                method: method.toUpperCase() as BuilderEndpoint['method'],
                path,
                summary: String(op.summary ?? ''),
                description: String(op.description ?? ''),
                tag: (op.tags as string[] | undefined)?.[0],
                pathParams,
                queryParams,
                requestBody,
                responses,
            })
        }
    }

    return { info, endpoints }
}

function parseSchemaToFields(schema: Record<string, unknown>): { type: string; fields: BuilderSchemaField[] } {
    const schemaType = String(schema.type ?? 'object')

    if (schemaType === 'array') {
        const itemsSchema = schema.items as Record<string, unknown> | undefined
        return {
            type: 'array',
            fields: itemsSchema ? parseSchemaToFields(itemsSchema).fields : [],
        }
    }

    if (schemaType !== 'object' || !schema.properties) {
        return { type: schemaType, fields: [] }
    }

    const requiredFields = new Set((schema.required as string[]) ?? [])

    const fields: BuilderSchemaField[] = Object.entries(schema.properties as Record<string, unknown>).map(([name, prop]) => {
        const p = prop as Record<string, unknown>
        const fieldType = String(p.type ?? 'string') as BuilderSchemaField['type']

        let nestedFields: BuilderSchemaField[] = []
        let items: { type: string; fields: BuilderSchemaField[] } | null = null

        // Recursively parse nested objects
        if (fieldType === 'object' && p.properties) {
            const nested = parseSchemaToFields(p)
            nestedFields = nested.fields
        }

        // Recursively parse array items
        if (fieldType === 'array' && p.items) {
            const itemsObj = p.items as Record<string, unknown>
            const itemType = String(itemsObj.type ?? 'string')
            const itemNested = itemType === 'object' && itemsObj.properties
                ? parseSchemaToFields(itemsObj)
                : { type: itemType, fields: [] }
            items = { type: itemType, fields: itemNested.fields }
        }

        return {
            id: crypto.randomUUID(),
            name,
            type: fieldType,
            format: p.format ? String(p.format) : undefined,
            required: requiredFields.has(name),
            description: String(p.description ?? ''),
            fields: nestedFields,
            items,
            example: p.example !== undefined ? String(p.example) : undefined,
        }
    })

    return { type: 'object', fields }
}
