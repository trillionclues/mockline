import { db } from '@mockline/db'

// Create new request log entry for a sandbox
export async function createRequestLog(data: {
    mockServerId: string
    method: string
    path: string
    statusCode: number
    responseTimeMs?: number
    userAgent?: string
    ipAddress?: string
}) {
    return db.sandboxRequestLog.create({ data })
}

// aggregate analytics for a sandbox
export async function getSandboxAnalytics(mockServerId: string, since?: Date) {
    const where = {
        mockServerId,
        ...(since ? { createdAt: { gte: since } } : {}),
    }

    const [totalHits, endpointBreakdown, lastLog] = await Promise.all([
        db.sandboxRequestLog.count({ where }),

        db.sandboxRequestLog.groupBy({
            by: ['method', 'path'],
            where,
            _count: true,
            _max: { createdAt: true },
            orderBy: { _count: { path: 'desc' } },
            take: 50,
        }),

        db.sandboxRequestLog.findFirst({
            where: { mockServerId },
            orderBy: { createdAt: 'desc' },
            select: { createdAt: true },
        }),
    ])

    const uniqueEndpoints = endpointBreakdown.length

    return {
        totalHits,
        uniqueEndpoints,
        lastActive: lastLog?.createdAt?.toISOString() ?? null,
        endpointBreakdown: endpointBreakdown.map(e => ({
            method: e.method,
            path: e.path,
            hitCount: e._count,
            lastHit: e._max.createdAt?.toISOString() ?? '',
        })),
    }
}

// paginated request logs for a sandbox (for log viewer)
export async function getRequestLogs(
    mockServerId: string,
    options: { date?: string; page?: number; limit?: number } = {},
) {
    const { date, page = 1, limit = 50 } = options

    // Filter by specific day if provided (calendar dropdown)
    const dateFilter = date
        ? {
            createdAt: {
                gte: new Date(`${date}T00:00:00.000Z`),
                lt: new Date(`${date}T23:59:59.999Z`),
            },
        }
        : {}

    const where = { mockServerId, ...dateFilter }

    const [logs, total] = await Promise.all([
        db.sandboxRequestLog.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            skip: (page - 1) * limit,
            take: limit,
        }),
        db.sandboxRequestLog.count({ where }),
    ])

    return {
        logs,
        meta: {
            total,
            page,
            limit,
            hasMore: page * limit < total,
        },
    }
}

// Bulk delete old logs past retention period
export async function deleteExpiredLogs(olderThan: Date) {
    const result = await db.sandboxRequestLog.deleteMany({
        where: { createdAt: { lt: olderThan } },
    })
    return result.count
}

// Batch insert for log ingestion (Traefik access log import)
export async function bulkCreateRequestLogs(entries: {
    mockServerId: string
    method: string
    path: string
    statusCode: number
    responseTimeMs?: number
    userAgent?: string
    ipAddress?: string
    createdAt?: Date
}[]) {
    return db.sandboxRequestLog.createMany({ data: entries })
}

export async function getMockMatch(mockId: string) {

    const mock = await db.mockServer.findFirst({
        where: { id: mockId, deletedAt: null },
        select: { id: true },
    })
    return mock;
}