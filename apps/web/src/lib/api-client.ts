const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'

type ApiResponse<T> = { data: T; error: null } | { data: null; error: { code: string; message: string } }

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
        throw new Error(json.error?.message ?? `HTTP ${res.status}`)
    }

    return json.data
}

import type {
    Spec, SpecDetail, CreateSpecInput, SpecVersion, UploadVersionInput, SchemaDiff,
    MockServer, ProvisionMockInput, ContractTestRun, RunContractInput
} from '@/types'

export type {
    Spec, SpecDetail, CreateSpecInput, SpecVersion, UploadVersionInput, SchemaDiff,
    MockServer, ProvisionMockInput, ContractTestRun, RunContractInput
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
}

// ── Contracts ──
export const contractsApi = {
    run: (body: RunContractInput, opts?: RequestInit) => request<ContractTestRun>('/contracts', { ...opts, method: 'POST', body: JSON.stringify(body) }),
    get: (id: string, opts?: RequestInit) => request<ContractTestRun>(`/contracts/${id}`, opts),
    list: (specId?: string, opts?: RequestInit) => request<ContractTestRun[]>(`/contracts${specId ? `?specId=${specId}` : ''}`, opts),
}

