export type BuilderState = {
    info: BuilderInfo
    endpoints: BuilderEndpoint[]
}

export type BuilderInfo = {
    title: string
    version: string
    description: string
    basePath: string
}

export type BuilderEndpoint = {
    id: string
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS'
    path: string
    summary: string
    description: string
    tag?: string
    pathParams: BuilderParam[]
    queryParams: BuilderParam[]
    requestBody: BuilderRequestBody | null
    responses: BuilderResponse[]
}

export type BuilderParam = {
    id: string
    name: string
    description: string
    required: boolean
    schema: { type: BuilderSchemaField['type']; fields: BuilderSchemaField[] }
}

export type BuilderRequestBody = {
    required: boolean
    description: string
    schema: { type: string; fields: BuilderSchemaField[] }
}

export type BuilderResponse = {
    id: string
    statusCode: string
    description: string
    schema: { type: string; fields: BuilderSchemaField[] }
}

export type BuilderSchemaField = {
    id: string
    name: string
    type: 'string' | 'number' | 'integer' | 'boolean' | 'object' | 'array'
    format?: string
    required: boolean
    description: string
    example?: string
    fields: BuilderSchemaField[]    // for object type
    items: { type: string; fields: BuilderSchemaField[] } | null  // for array type
}
