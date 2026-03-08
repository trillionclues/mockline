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
}

const HTTP_METHODS = ['get', 'post', 'put', 'patch', 'delete', 'options', 'head'] as const

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
                schema: p.schema,
            }))

            const responses: Record<string, ParsedResponse> = {}
            if (operation.responses) {
                for (const [code, res] of Object.entries(operation.responses)) {
                    const contentType = res.content ? Object.keys(res.content)[0] : undefined
                    responses[code] = {
                        description: res.description ?? '',
                        schema: contentType ? res.content?.[contentType]?.schema : undefined,
                    }
                }
            }

            const requestBody = operation.requestBody
            const contentType = requestBody?.content ? Object.keys(requestBody.content)[0] : undefined

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
                        schema: contentType ? requestBody.content?.[contentType]?.schema : undefined,
                    }
                    : undefined,
                responses,
            })
        }
    }

    return endpoints
}
