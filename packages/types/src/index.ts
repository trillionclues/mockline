// ===================
// Mockline — Shared Types
// ===================

// Enums
export type Tier = 'FREE' | 'PRO' | 'TEAM'

export type MockServerStatus = 'BUILDING' | 'RUNNING' | 'STOPPED' | 'FAILED' | 'REMOVED'

export type SpecFormat = 'YAML' | 'JSON'

// API Response Envelope
export type ApiResponse<T> = {
    data: T
    error: null
} | {
    data: null
    error: ApiErrorBody
}

export type ApiPaginatedResponse<T> = {
    data: T[]
    error: null
    meta: PaginationMeta
} | {
    data: null
    error: ApiErrorBody
}

export type ApiErrorBody = {
    code: string
    message: string
}

export type PaginationMeta = {
    total: number
    page: number
    limit: number
    hasMore: boolean
}

// Errors
export class ApiError extends Error {
    constructor(
        public statusCode: number,
        message: string,
        public code?: string,
    ) {
        super(message)
        this.name = 'ApiError'
    }
}

// Docker Manager Types
export type ContainerStatus = {
    id: string
    state: 'running' | 'stopped' | 'paused' | 'dead' | 'not_found'
    health: 'healthy' | 'unhealthy' | 'starting' | 'none'
    startedAt?: string
    ports?: { host: number; container: number }[]
}

export type ContainerInfo = {
    id: string
    name: string
    status: ContainerStatus['state']
    imageId: string
    createdAt: string
}

export type ResourceLimits = {
    memoryMb?: number
    cpuPercent?: number
}

export type BuildMockImageParams = {
    specContent: string
    specFormat: SpecFormat
    imageTag: string
    contourVersion: string
}

export type StartMockContainerParams = {
    imageId: string
    containerId: string
    resourceLimits?: ResourceLimits
}

// Spec Parser Types
export type ParsedEndpoint = {
    method: string
    path: string
    summary?: string
    operationId?: string
    tags?: string[]
    parameters?: ParsedParameter[]
    requestBody?: ParsedRequestBody
    responses: Record<string, ParsedResponse>
}

export type ParsedParameter = {
    name: string
    in: 'query' | 'path' | 'header' | 'cookie'
    required: boolean
    schema?: Record<string, unknown>
}

export type ParsedRequestBody = {
    required: boolean
    contentType: string
    schema?: Record<string, unknown>
}

export type ParsedResponse = {
    description: string
    schema?: Record<string, unknown>
}

export type SpecValidationResult = {
    valid: boolean
    errors: SpecValidationError[]
    endpoints: ParsedEndpoint[]
    info?: {
        title: string
        version: string
        description?: string
    }
}

export type SpecValidationError = {
    path: string
    message: string
}

// Constants
export const MAX_SPEC_FILE_SIZE = 1024 * 1024 // 1MB

export const DEFAULT_RESOURCE_LIMITS: Required<ResourceLimits> = {
    memoryMb: 64, // 64MB hard limit per container
    cpuPercent: 10,
}

export const CONTAINER_LIMITS = {
    FREE: 1,
    PRO: 5,
    TEAM: 20,
} as const satisfies Record<Tier, number>

export const SPEC_LIMITS = {
    FREE: 1,
    PRO: Infinity,
    TEAM: Infinity,
} as const satisfies Record<Tier, number>

export const AUTO_STOP_MINUTES = {
    FREE: 60, // 1 hour
    PRO: 24 * 60, // 24 hours
    TEAM: 7 * 24 * 60, // 1 week
} as const satisfies Record<Tier, number>

export const RATE_LIMITS_BY_TIER = {
    FREE: {
        GENERAL:       { window: 60,   max: 60  },
        PROVISION:     { window: 3600, max: 5   },
        CONTRACT_TEST: { window: 3600, max: 5   },
    },
    PRO: {
        GENERAL:       { window: 60,   max: 300 },
        PROVISION:     { window: 3600, max: 20  },
        CONTRACT_TEST: { window: 3600, max: 50  },
    },
    TEAM: {
        GENERAL:       { window: 60,   max: 600 },
        PROVISION:     { window: 3600, max: 50  },
        CONTRACT_TEST: { window: 3600, max: 200 },
    },
} as const satisfies Record<Tier, Record<string, { window: number; max: number }>>

// Backwards-compat alias — maps to FREE defaults
export const RATE_LIMITS = RATE_LIMITS_BY_TIER.FREE
