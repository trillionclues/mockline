export const queryKeys = {
    specs: {
        all: () => ['specs'] as const,
        detail: (id: string) => ['specs', id] as const,
        versions: (id: string) => ['specs', id, 'versions'] as const,
        diff: (id: string, v1: number, v2: number) => ['specs', id, 'diff', v1, v2] as const,
    },
    mocks: {
        all: () => ['mocks'] as const,
        detail: (id: string) => ['mocks', id] as const,
        status: (id: string) => ['mocks', id, 'status'] as const,
        analytics: (id: string) => ['mocks', id, 'analytics'] as const,
        logs: (id: string, page?: number, date?: string) => ['mocks', id, 'logs', { page, date }] as const,
    },
    contracts: {
        all: () => ['contracts'] as const,
        bySpec: (specId: string) => ['contracts', 'spec', specId] as const,
        detail: (id: string) => ['contracts', id] as const,
    },
}
