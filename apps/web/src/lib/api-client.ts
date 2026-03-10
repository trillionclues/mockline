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

// ── Specs ───────────
export const specsApi = {
    list: () => request<Spec[]>('/specs'),
    get: (id: string) => request<SpecDetail>(`/specs/${id}`),
    create: (body: CreateSpecInput) => request<Spec>('/specs', { method: 'POST', body: JSON.stringify(body) }),
    delete: (id: string) => request<void>(`/specs/${id}`, { method: 'DELETE' }),
    getVersions: (id: string) => request<SpecVersion[]>(`/specs/${id}/versions`),
    uploadVersion: (id: string, body: UploadVersionInput) => request<SpecVersion>(`/specs/${id}/versions`, { method: 'POST', body: JSON.stringify(body) }),
    diff: (id: string, v1: number, v2: number) => request<SchemaDiff>(`/specs/${id}/versions/${v1}/diff/${v2}`),
}

// ── Mocks ───────────
export const mocksApi = {
    list: () => request<MockServer[]>('/mocks'),
    get: (id: string) => request<MockServer>(`/mocks/${id}`),
    provision: (body: ProvisionMockInput) => request<MockServer>('/mocks', { method: 'POST', body: JSON.stringify(body) }),
    start: (id: string) => request<MockServer>(`/mocks/${id}/start`, { method: 'POST' }),
    stop: (id: string) => request<void>(`/mocks/${id}/stop`, { method: 'POST' }),
    delete: (id: string) => request<void>(`/mocks/${id}`, { method: 'DELETE' }),
}

// ── Contracts ───────────
export const contractsApi = {
    run: (body: RunContractInput) => request<ContractTestRun>('/contracts', { method: 'POST', body: JSON.stringify(body) }),
    get: (id: string) => request<ContractTestRun>(`/contracts/${id}`),
    list: (specId?: string) => request<ContractTestRun[]>(`/contracts${specId ? `?specId=${specId}` : ''}`),
}

