import { Hono } from 'hono'
import { createRequestLog, getMockMatch } from '../repositories/sandbox-log.repository'
import type { AppEnv } from '../types/env'

export const explorerRouter = new Hono<AppEnv>()

// POST /explorer/proxy
// Server-side proxy for API Explorer.
// Since browser can't send custom headers (X-Auth-Token, etc.) to mock
// servers on a different origin without the server responding to CORS
// preflights. By proxying through the API, the browser only talks to
// its own origin and we forward the request server-side — no CORS.

explorerRouter.post('/proxy', async (c) => {
    const body = await c.req.json<{
        mockId: string
        url: string
        method: string
        headers?: Record<string, string>
        body?: string
    }>()

    if (!body.url || !body.method) {
        return c.json({ data: null, error: { code: 'VALIDATION_ERROR', message: 'url and method are required' } }, 400)
    }

    const start = Date.now()

    try {
        const res = await fetch(body.url, {
            method: body.method.toUpperCase(),
            headers: body.headers ?? {},
            body: ['POST', 'PUT', 'PATCH'].includes(body.method.toUpperCase()) && body.body
                ? body.body
                : undefined,
            signal: AbortSignal.timeout(30_000),
        })

        const duration = Date.now() - start
        const contentType = res.headers.get('content-type') ?? ''
        let responseBody: unknown
        if (contentType.includes('application/json')) {
            responseBody = await res.json()
        } else {
            responseBody = await res.text()
        }

        const responseHeaders: Record<string, string> = {}
        res.headers.forEach((v, k) => { responseHeaders[k] = v })

        // Log directly using the mockId the frontend already knows —
        // no URL lookup needed, no ambiguity when multiple mocks share a spec
        if (body.mockId) {
            logRequest(body.mockId, body.url, body.method, res.status, duration).catch((err) => {
                console.error('[explorer] logRequest threw:', err)
            })
        }

        return c.json({
            data: {
                status: res.status,
                statusText: res.statusText,
                headers: responseHeaders,
                body: responseBody,
                duration,
            },
            error: null,
        })
    } catch (err) {
        return c.json({
            data: {
                error: (err as Error).message,
                duration: Date.now() - start,
            },
            error: null,
        })
    }
})

async function logRequest(
    mockId: string,
    url: string,
    method: string,
    statusCode: number,
    responseTimeMs: number,
) {
    // Verify the mock exists and belongs to a real server before logging
    const mock = await getMockMatch(mockId);
    if (!mock) return

    const parsedUrl = new URL(url)
    const path = parsedUrl.pathname + parsedUrl.search

    await createRequestLog({
        mockServerId: mock.id,
        method: method.toUpperCase(),
        path,
        statusCode,
        responseTimeMs,
    })
}
