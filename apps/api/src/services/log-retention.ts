import { deleteExpiredLogs } from '@/repositories/sandbox-log.repository'
import { LOG_RETENTION_DAYS } from '@mockline/types'
import { db } from '@mockline/db'

// Cleans up request logs past the tier-specific retention period.
// PRO: 14 days, TEAM: 30 days.
// Runs as part of the auto-stop scheduler interval.
export async function cleanupExpiredLogs(): Promise<{ deleted: number }> {
    let totalDeleted = 0

    const serversWithLogs = await db.mockServer.findMany({
        where: {
            requestLogs: { some: {} },
            deletedAt: null,
        },
        select: { id: true, tier: true },
    })

    // Group by tier and delete logs older than retention period
    const tierGroups = new Map<string, string[]>()
    for (const server of serversWithLogs) {
        const existing = tierGroups.get(server.tier) ?? []
        existing.push(server.id)
        tierGroups.set(server.tier, existing)
    }

    for (const [tier, serverIds] of tierGroups) {
        const retentionDays = LOG_RETENTION_DAYS[tier as keyof typeof LOG_RETENTION_DAYS]
        if (retentionDays <= 0) continue

        const cutoff = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000)

        const result = await db.sandboxRequestLog.deleteMany({
            where: {
                mockServerId: { in: serverIds },
                createdAt: { lt: cutoff },
            },
        })

        totalDeleted += result.count
    }

    // clean up logs for deleted/removed servers (no retention needed)
    const orphanedDeleted = await deleteExpiredLogs(
        new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day grace for removed servers
    )

    return { deleted: totalDeleted + orphanedDeleted }
}
