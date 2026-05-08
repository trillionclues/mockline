import { Hono } from 'hono'
import {
    getSandboxAnalytics,
    getRequestLogs,
    createRequestLog,
} from '../repositories/sandbox-log.repository'
import { findMock } from '../repositories/mock.repository'
import type { AppEnv } from '../types/env'
import { z } from 'zod'

export const sandboxAnalyticsRouter = new Hono<AppEnv>()

// /mocks/:id/analytics — aggregate analytics for sandbox
sandboxAnalyticsRouter.get('/:id/analytics', async (c) => {
    const userId = c.get('user').id
    const mockId = c.req.param('id')

    const mock = await findMock(mockId, userId)
    if (!mock) {
        return c.json({ data: null, error: { code: 'NOT_FOUND', message: 'Mock not found' } }, 404)
    }

    const sinceParam = c.req.query('since')
    const since = sinceParam ? new Date(sinceParam) : undefined

    const analytics = await getSandboxAnalytics(mockId, since)

    return c.json({ data: analytics, error: null })
})

// /mocks/:id/logs — paginated request logs (for log viewer)
sandboxAnalyticsRouter.get('/:id/logs', async (c) => {
    const userId = c.get('user').id
    const mockId = c.req.param('id')

    const mock = await findMock(mockId, userId)
    if (!mock) {
        return c.json({ data: null, error: { code: 'NOT_FOUND', message: 'Mock not found' } }, 404)
    }

    const page = parseInt(c.req.query('page') ?? '1', 10)
    const limit = Math.min(parseInt(c.req.query('limit') ?? '50', 10), 100)
    const date = c.req.query('date') // YYYY-MM-DD for calendar dropdown

    const result = await getRequestLogs(mockId, { page, limit, date })

    return c.json({ data: result.logs, error: null, meta: result.meta })
})

// /mocks/:id/logs — ingest a request log entry
// Used by Traefik access log webhook or future middleware
const LogEntrySchema = z.object({
    method: z.string(),
    path: z.string(),
    statusCode: z.number(),
    responseTimeMs: z.number().optional(),
    userAgent: z.string().optional(),
    ipAddress: z.string().optional(),
})

sandboxAnalyticsRouter.post('/:id/logs', async (c) => {
    const userId = c.get('user').id
    const mockId = c.req.param('id')

    const mock = await findMock(mockId, userId)
    if (!mock) {
        return c.json({ data: null, error: { code: 'NOT_FOUND', message: 'Mock not found' } }, 404)
    }

    const body = await c.req.json()
    const parsed = LogEntrySchema.safeParse(body)

    if (!parsed.success) {
        return c.json(
            { data: null, error: { code: 'VALIDATION_ERROR', message: parsed.error.message } },
            400,
        )
    }

    const log = await createRequestLog({
        mockServerId: mockId,
        ...parsed.data,
    })

    return c.json({ data: log, error: null }, 201)
})
