import type { ParsedEndpoint, ParsedParameter, ParsedResponse } from '@mockline/types'

type PathsObject = Record<string, Record<string, OperationObject>>
type OperationObject = {
    summary?: string
    operationId?: string
    tags?: string[]
    parameters?: ParameterObject[]
    requestBody?: RequestBodyObject
    responses?: Record<string, ResponseObject>
}
type ParameterObject = {
    name: string
    in: string
    required?: boolean
    schema?: Record<string, unknown>
}
type RequestBodyObject = {
    required?: boolean
    content?: Record<string, { schema?: Record<string, unknown> }>
}
type ResponseObject = {
    description?: string
    content?: Record<string, { schema?: Record<string, unknown> }>
    // Swagger 2.0 converted specs may have a top-level `schema`
    schema?: Record<string, unknown>
}

const HTTP_METHODS = ['get', 'post', 'put', 'patch', 'delete', 'options', 'head'] as const

// Resolve a $ref pointer like "#/components/schemas/Foo" against the spec.
// Returns the referenced object, or the original value if not a $ref.
function resolveRef(
    value: Record<string, unknown> | undefined,
    spec: Record<string, unknown>,
): Record<string, unknown> | undefined {
    if (!value) return value
    const ref = value['$ref']
    if (typeof ref !== 'string') return value

    const parts = ref.replace(/^#\//, '').split('/')
    let current: unknown = spec
    for (const part of parts) {
        if (current && typeof current === 'object' && part in current) {
            current = (current as Record<string, unknown>)[part]
        } else {
            return value
        }
    }
    return (current && typeof current === 'object') ? current as Record<string, unknown> : value
}

// Extracts endpoint definitions from parsed OpenAPI spec object.
export function parseEndpoints(specObject: Record<string, unknown>): ParsedEndpoint[] {
    const paths = specObject.paths as PathsObject | undefined
    if (!paths) return []

    const endpoints: ParsedEndpoint[] = []

    for (const [path, methods] of Object.entries(paths)) {
        for (const method of HTTP_METHODS) {
            const operation = methods[method]
            if (!operation) continue

            const parameters: ParsedParameter[] = (operation.parameters ?? []).map((p) => ({
                name: p.name,
                in: p.in as ParsedParameter['in'],
                required: p.required ?? false,
                schema: resolveRef(p.schema, specObject),
            }))

            const responses: Record<string, ParsedResponse> = {}
            if (operation.responses) {
                for (const [code, res] of Object.entries(operation.responses)) {
                    const contentType = res.content ? Object.keys(res.content)[0] : undefined
                    // Resolve schema — handles both OAS3 content.schema and Swagger 2.0 top-level schema
                    const rawSchema = contentType
                        ? res.content?.[contentType]?.schema
                        : res.schema
                    responses[code] = {
                        description: res.description ?? '',
                        schema: resolveRef(rawSchema, specObject),
                    }
                }
            }

            const requestBody = operation.requestBody
            const contentType = requestBody?.content ? Object.keys(requestBody.content)[0] : undefined
            const rawBodySchema = contentType ? requestBody?.content?.[contentType]?.schema : undefined

            endpoints.push({
                method: method.toUpperCase(),
                path,
                summary: operation.summary,
                operationId: operation.operationId,
                tags: operation.tags,
                parameters: parameters.length > 0 ? parameters : undefined,
                requestBody: requestBody
                    ? {
                        required: requestBody.required ?? false,
                        contentType: contentType ?? 'application/json',
                        schema: resolveRef(rawBodySchema, specObject),
                    }
                    : undefined,
                responses,
            })
        }
    }

    return endpoints
}
