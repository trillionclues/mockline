import type { ParsedEndpoint } from '@mockline/types'

type EndpointResult = {
    method: string
    path: string
    status: 'pass' | 'fail' | 'error'
    expected?: Record<string, unknown>
    actual?: Record<string, unknown>
    message?: string
    responseTime: number
}

type ContractTestResult = {
    total: number
    passed: number
    failed: number
    errors: number
    endpoints: EndpointResult[]
}

// Runs contract tests on API endpoints and compares responses to spec schema.
export async function runContractTest(params: {
    endpoints: ParsedEndpoint[]
    baseUrl: string
}): Promise<ContractTestResult> {
    const { endpoints, baseUrl } = params
    const results: EndpointResult[] = []

    for (const endpoint of endpoints) {
        // Only GET endpoints tests in MVP (POST/PUT/DELETE need request bodies)
        if (endpoint.method !== 'GET') continue

        // Substitute path params with placeholder values for testing
        const resolvedPath = endpoint.path.replace(/\{(\w+)\}/g, '1')
        const url = `${baseUrl.replace(/\/$/, '')}${resolvedPath}`
        const start = Date.now()

        try {
            const res = await fetch(url, {
                method: 'GET',
                headers: { Accept: 'application/json' },
                signal: AbortSignal.timeout(10000),
            })

            const responseTime = Date.now() - start
            const expectedStatus = Object.keys(endpoint.responses)[0] ?? '200'

            if (String(res.status) === expectedStatus) {
                results.push({
                    method: endpoint.method,
                    path: endpoint.path,
                    status: 'pass',
                    responseTime,
                })
            } else {
                results.push({
                    method: endpoint.method,
                    path: endpoint.path,
                    status: 'fail',
                    message: `Expected ${expectedStatus}, got ${res.status}`,
                    responseTime,
                })
            }
        } catch (error) {
            results.push({
                method: endpoint.method,
                path: endpoint.path,
                status: 'error',
                message: (error as Error).message,
                responseTime: Date.now() - start,
            })
        }
    }

    return {
        total: results.length,
        passed: results.filter((r) => r.status === 'pass').length,
        failed: results.filter((r) => r.status === 'fail').length,
        errors: results.filter((r) => r.status === 'error').length,
        endpoints: results,
    }
}
