import { Hono } from 'hono'
import { db } from '@mockline/db'
import { getSandboxAnalytics } from '../repositories/sandbox-log.repository'

export const shareRouter = new Hono()

// GET /share/:id — public endpoint for sandbox share pages (no auth)
shareRouter.get('/:id', async (c) => {
    const mockId = c.req.param('id')

    const mock = await db.mockServer.findFirst({
        where: {
            id: mockId,
            sharePageEnabled: true,
            deletedAt: null,
        },
        include: {
            spec: { select: { name: true } },
            specVersion: {
                select: {
                    version: true,
                    content: true,
                    format: true,
                },
            },
            user: {
                select: {
                    tier: true,
                },
            },
        },
    })

    if (!mock) {
        return c.json({ data: null, error: { code: 'NOT_FOUND', message: 'Sandbox not found or share page not enabled' } }, 404)
    }

    if (mock.expiresAt && mock.expiresAt < new Date()) {
        return c.json({ data: null, error: { code: 'EXPIRED', message: 'This sandbox has expired' } }, 410)
    }

    // Parse endpoints from spec content
    let endpoints: { method: string; path: string; summary?: string }[] = []
    try {
        const spec = mock.specVersion.format === 'JSON'
            ? JSON.parse(mock.specVersion.content)
            : (await import('yaml')).parse(mock.specVersion.content)

        if (spec.paths) {
            for (const [path, methods] of Object.entries(spec.paths)) {
                for (const [method, details] of Object.entries(methods as Record<string, { summary?: string }>)) {
                    if (['get', 'post', 'put', 'patch', 'delete', 'head', 'options'].includes(method)) {
                        endpoints.push({
                            method: method.toUpperCase(),
                            path,
                            summary: details?.summary,
                        })
                    }
                }
            }
        }
    } catch {
        // If spec parsing fails, return empty endpoints
    }

    // Get basic analytics (total hits only)
    const analytics = await getSandboxAnalytics(mockId)

    return c.json({
        data: {
            id: mock.id,
            specName: mock.spec.name,
            label: mock.label,
            description: mock.description,
            publicUrl: mock.publicUrl,
            status: mock.status,
            expiresAt: mock.expiresAt?.toISOString() ?? null,
            createdAt: mock.createdAt.toISOString(),
            endpoints,
            analytics: {
                totalHits: analytics.totalHits,
                uniqueEndpoints: analytics.uniqueEndpoints,
            },
            branding: mock.user.tier === 'TEAM' ? 'white-label' : 'powered-by',
        },
        error: null,
    })
})
