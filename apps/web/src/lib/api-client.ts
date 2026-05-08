import { ApiError, type ApiResponse } from '@mockline/types'
import type {
    Spec, SpecDetail, CreateSpecInput, SpecVersion, UploadVersionInput, SchemaDiff,
    MockServer, ProvisionMockInput, ContractTestRun, RunContractInput,
    SandboxAnalytics, SandboxRequestLog,
} from '@/types'

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'

export async function request<T>(
    path: string,
    options: RequestInit = {}
): Promise<T> {
    const res = await fetch(`${BASE_URL}${path}`, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...options.headers,
        },
        credentials: 'include', // sends session cookie
    })

    const json = await res.json() as ApiResponse<T>

    if (!res.ok || json.error) {
        // expired/invalid session
        if (res.status === 401 && typeof window !== 'undefined') {
            window.location.href = '/login'
            return undefined as never
        }
        throw new ApiError(res.status, json.error?.message ?? `HTTP ${res.status}`, json.error?.code ?? 'UNKNOWN')
    }

    return json.data
}

export type {
    Spec, SpecDetail, CreateSpecInput, SpecVersion, UploadVersionInput, SchemaDiff,
    MockServer, ProvisionMockInput, ContractTestRun, RunContractInput,
    SandboxAnalytics, SandboxRequestLog,
}

// ── Specs ──
export const specsApi = {
    list: (opts?: RequestInit) => request<Spec[]>('/specs', opts),
    get: (id: string, opts?: RequestInit) => request<SpecDetail>(`/specs/${id}`, opts),
    create: (body: CreateSpecInput, opts?: RequestInit) => request<Spec>('/specs', { ...opts, method: 'POST', body: JSON.stringify(body) }),
    delete: (id: string, opts?: RequestInit) => request<void>(`/specs/${id}`, { ...opts, method: 'DELETE' }),
    getVersions: (id: string, opts?: RequestInit) => request<SpecVersion[]>(`/specs/${id}/versions`, opts),
    uploadVersion: (id: string, body: UploadVersionInput, opts?: RequestInit) => request<SpecVersion>(`/specs/${id}/versions`, { ...opts, method: 'POST', body: JSON.stringify(body) }),
    diff: (id: string, v1: number, v2: number, opts?: RequestInit) => request<SchemaDiff>(`/specs/${id}/versions/${v1}/diff/${v2}`, opts),
}

// ── Mocks ──
export const mocksApi = {
    list: (opts?: RequestInit) => request<MockServer[]>('/mocks', opts),
    get: (id: string, opts?: RequestInit) => request<MockServer>(`/mocks/${id}`, opts),
    provision: (body: ProvisionMockInput, opts?: RequestInit) => request<MockServer>('/mocks', { ...opts, method: 'POST', body: JSON.stringify(body) }),
    start: (id: string, opts?: RequestInit) => request<MockServer>(`/mocks/${id}/start`, { ...opts, method: 'POST' }),
    stop: (id: string, opts?: RequestInit) => request<void>(`/mocks/${id}/stop`, { ...opts, method: 'POST' }),
    delete: (id: string, opts?: RequestInit) => request<void>(`/mocks/${id}`, { ...opts, method: 'DELETE' }),
    // Sandbox analytics
    analytics: (id: string, since?: string, opts?: RequestInit) =>
        request<SandboxAnalytics>(`/mocks/${id}/analytics${since ? `?since=${since}` : ''}`, opts),
    logs: (id: string, params?: { page?: number; date?: string }, opts?: RequestInit) => {
        const searchParams = new URLSearchParams()
        if (params?.page) searchParams.set('page', String(params.page))
        if (params?.date) searchParams.set('date', params.date)
        const qs = searchParams.toString()
        return request<SandboxRequestLog[]>(`/mocks/${id}/logs${qs ? `?${qs}` : ''}`, opts)
    },
}

// ── Contracts ──
export const contractsApi = {
    run: (body: RunContractInput, opts?: RequestInit) => request<ContractTestRun>('/contracts', { ...opts, method: 'POST', body: JSON.stringify(body) }),
    get: (id: string, opts?: RequestInit) => request<ContractTestRun>(`/contracts/${id}`, opts),
    list: (specId?: string, opts?: RequestInit) => request<ContractTestRun[]>(`/contracts${specId ? `?specId=${specId}` : ''}`, opts),
}

// ── Billing ──
export const billingApi = {
    checkout: (variantId: string, yearly: boolean, opts?: RequestInit) => request<{ checkoutUrl: string }>('/billing/checkout', { ...opts, method: 'POST', body: JSON.stringify({ variantId, yearly }) }),
    cancel: (opts?: RequestInit) => request<{ cancelled: boolean }>('/billing/cancel', { ...opts, method: 'POST' }),
}

// ── Explorer ──
export type ExplorerProxyResponse = {
    status?: number
    statusText?: string
    headers?: Record<string, string>
    body?: unknown
    error?: string
    duration: number
}

export const explorerApi = {
    proxy: (payload: { mockId: string; url: string; method: string; headers?: Record<string, string>; body?: string }) =>
        request<ExplorerProxyResponse>('/explorer/proxy', {
            method: 'POST',
            body: JSON.stringify(payload),
        }),
}

