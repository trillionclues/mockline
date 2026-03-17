export type Spec = {
    id: string
    name: string
    format: 'YAML' | 'JSON'
    createdAt: string
    updatedAt: string
    versions: SpecVersion[]
    _count: { mockServers: number }
}

export type SpecDetail = Spec & {
    endpoints: Endpoint[]
}

export type SpecVersion = {
    id: string
    specId: string
    version: number
    content: string
    format: 'YAML' | 'JSON'
    hash: string
    createdAt: string
}

export type Endpoint = {
    method: string
    path: string
    summary?: string
    operationId?: string
}

export type CreateSpecInput = {
    name: string
    content?: string
    url?: string
    format?: 'yaml' | 'json'
}

export type UploadVersionInput = {
    content: string
    format: 'yaml' | 'json'
}

export type SchemaDiff = {
    breaking: DiffEntry[]
    nonBreaking: DiffEntry[]
}

export type DiffEntry = {
    type: 'added' | 'removed' | 'changed'
    path: string
    description: string
}

export type MockServer = {
    id: string
    specId: string
    specVersionId: string
    userId: string
    status: 'BUILDING' | 'RUNNING' | 'STOPPED' | 'FAILED'
    publicUrl: string | null
    port: number | null
    stateful: boolean
    config: Record<string, unknown> | null
    spec: { name: string }
    specVersion: { version: number }
    createdAt: string
    updatedAt: string
    lastAccessedAt: string
}

export type ProvisionMockInput = {
    specId: string
    specVersionId: string
    stateful?: boolean
    config?: Record<string, unknown>
}

export type ContractTestRun = {
    id: string
    specId: string
    baseUrl: string
    totalEndpoints: number
    passed: number
    failed: number
    duration: number
    status: 'RUNNING' | 'PASSED' | 'FAILED'
    results: ContractResult[]
    createdAt: string
}

export type ContractResult = {
    method: string
    path: string
    expectedStatus: number
    receivedStatus: number
    match: boolean
    detail?: string
}

export type RunContractInput = {
    specId: string
    baseUrl: string
}

export type ChangelogTag = 'feature' | 'fix' | 'performance' | 'breaking' | 'improvement'

export type ChangelogEntry = {
    version: string
    date: string
    title: string
    body: string
    bullets: string[]
    tags: ChangelogTag[]
}