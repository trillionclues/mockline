import type { BuilderState, BuilderSchemaField } from './types'

export function generateOpenAPI(state: BuilderState): Record<string, unknown> {
    const paths: Record<string, unknown> = {}

    for (const endpoint of state.endpoints) {
        if (!paths[endpoint.path]) paths[endpoint.path] = {}

        const operation: Record<string, unknown> = {}

        if (endpoint.summary) operation.summary = endpoint.summary
        if (endpoint.description) operation.description = endpoint.description
        if (endpoint.tag) operation.tags = [endpoint.tag]

        // Parameters
        const parameters = [
            ...endpoint.pathParams.map(p => ({
                name: p.name,
                in: 'path',
                required: true,
                description: p.description || undefined,
                schema: { type: p.schema.type },
            })),
            ...endpoint.queryParams.map(p => ({
                name: p.name,
                in: 'query',
                required: p.required,
                description: p.description || undefined,
                schema: { type: p.schema.type },
            })),
        ]
        if (parameters.length > 0) operation.parameters = parameters

        // Request body
        if (endpoint.requestBody && ['POST', 'PUT', 'PATCH'].includes(endpoint.method)) {
            operation.requestBody = {
                required: endpoint.requestBody.required,
                content: {
                    'application/json': {
                        schema: buildSchema(endpoint.requestBody.schema)
                    }
                }
            }
        }

        // Responses
        const responses: Record<string, unknown> = {}
        for (const resp of endpoint.responses) {
            const responseObj: Record<string, unknown> = {
                description: resp.description || 'Response',
            }
            if (resp.schema?.fields?.length > 0) {
                responseObj.content = {
                    'application/json': {
                        schema: buildSchema(resp.schema)
                    }
                }
            }
            responses[resp.statusCode] = responseObj
        }
        operation.responses = responses

            ; (paths[endpoint.path] as Record<string, unknown>)[endpoint.method.toLowerCase()] = operation
    }

    return {
        openapi: '3.0.3',
        info: {
            title: state.info.title || 'Untitled API',
            version: state.info.version || '1.0.0',
            ...(state.info.description ? { description: state.info.description } : {}),
        },
        servers: [{ url: state.info.basePath || '/api' }],
        paths,
    }
}

function buildSchema(schema: { type: string; fields: BuilderSchemaField[] }): Record<string, unknown> {
    if (schema.type !== 'object' || schema.fields.length === 0) {
        return { type: schema.type }
    }

    const properties: Record<string, unknown> = {}
    const required: string[] = []

    for (const field of schema.fields) {
        if (!field.name) continue

        let fieldSchema: Record<string, unknown> = { type: field.type }
        if (field.format) fieldSchema.format = field.format
        if (field.description) fieldSchema.description = field.description
        if (field.example !== undefined && field.example !== '') fieldSchema.example = field.example

        if (field.type === 'object' && field.fields.length > 0) {
            fieldSchema = { ...buildSchema({ type: 'object', fields: field.fields }), ...fieldSchema, type: 'object' }
        }

        if (field.type === 'array' && field.items) {
            fieldSchema.items = field.items.fields?.length > 0
                ? buildSchema({ type: field.items.type, fields: field.items.fields })
                : { type: field.items.type }
        }

        properties[field.name] = fieldSchema
        if (field.required) required.push(field.name)
    }

    return {
        type: 'object',
        properties,
        ...(required.length > 0 ? { required } : {}),
    }
}
