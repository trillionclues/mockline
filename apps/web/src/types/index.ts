export type User = {
    name?: string | null;
    email?: string | null;
    image?: string | null,
    tier?: 'FREE' | 'PRO' | 'TEAM' | null;
    subscriptionStatus?: string | null;
    subscriptionRenewsAt?: Date | string | null;
    subscriptionEndsAt?: Date | string | null;
}

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
    tags?: string[]
    parameters?: {
        name: string
        in: 'query' | 'path' | 'header' | 'cookie'
        required: boolean
        schema?: Record<string, unknown>
    }[]
    requestBody?: {
        required: boolean
        contentType: string
        schema?: Record<string, unknown>
    }
    responses?: Record<string, {
        description: string
        schema?: Record<string, unknown>
    }>
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
    // Partner sandbox fields
    expiresAt: string | null
    label: string | null
    sharePageEnabled: boolean
    description: string | null
    createdAt: string
    updatedAt: string
    lastAccessedAt: string
}

export type ProvisionMockInput = {
    specId: string
    specVersionId: string
    stateful?: boolean
    config?: Record<string, unknown>
    contourOptions?: {
        stateful?: boolean
        deterministic?: boolean
        delay?: string
        errorRate?: number
        requireAuth?: boolean
        strictValidation?: boolean
        strictLevel?: 'hard' | 'soft'
    }
    // Partner sandbox options (PRO+ only)
    sandboxOptions?: {
        expiresAt?: string
        label?: string           // e.g. "Acme Corp Integration"
        sharePageEnabled?: boolean
        description?: string
    }
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
    environment?: 'staging' | 'production' | 'other'
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

// Partner sandbox analytics
export type SandboxRequestLog = {
    id: string
    mockServerId: string
    method: string
    path: string
    statusCode: number
    responseTimeMs: number | null
    userAgent: string | null
    ipAddress: string | null
    createdAt: string
}

export type SandboxAnalytics = {
    totalHits: number
    uniqueEndpoints: number
    lastActive: string | null
    endpointBreakdown: {
        method: string
        path: string
        hitCount: number
        lastHit: string
    }[]
}

// Server-side spec drafts
export type SpecDraft = {
    id: string
    userId: string
    specId: string | null
    title: string | null
    content: string
    createdAt: string
    updatedAt: string
}