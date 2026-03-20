import { db } from '@mockline/db'
import { stopContainer } from '@mockline/docker-manager'
import { SPEC_LIMITS, CONTAINER_LIMITS } from '@mockline/types'
import type { Tier } from '@mockline/types'

// Called when a user's subscription expires and they return to FREE.
// Enforces FREE-tier resource limits:
// 1. Soft-deletes excess specs (keeps most recently updated)
// 2. Stops excess running mock servers (keeps most recently accessed)
export async function handleDowngrade(userId: string) {
    const user = await db.user.findUnique({
        where: { id: userId },
        select: { id: true, tier: true },
    })

    if (!user) return

    const tier = user.tier as Tier
    const specLimit = SPEC_LIMITS[tier]
    const containerLimit = CONTAINER_LIMITS[tier]

    if (specLimit !== Infinity) {
        const specs = await db.spec.findMany({
            where: { userId, deletedAt: null },
            orderBy: { updatedAt: 'desc' },
        })

        if (specs.length > specLimit) {
            const excessSpecs = specs.slice(specLimit)
            const now = new Date()
            await db.spec.updateMany({
                where: { id: { in: excessSpecs.map(s => s.id) } },
                data: { deletedAt: now },
            })
            console.log(`[downgrade] Soft-deleted ${excessSpecs.length} excess spec(s) for user ${userId}`)
        }
    }

    const runningMocks = await db.mockServer.findMany({
        where: { userId, status: 'RUNNING', deletedAt: null },
        orderBy: { lastAccessedAt: 'desc' },
    })

    if (runningMocks.length > containerLimit) {
        const excessMocks = runningMocks.slice(containerLimit)

        for (const mock of excessMocks) {
            if (!mock.dockerContainerId) continue
            try {
                await stopContainer(mock.dockerContainerId)
                await db.mockServer.update({
                    where: { id: mock.id },
                    data: { status: 'STOPPED' },
                })
                console.log(`[downgrade] Stopped mock ${mock.id} for user ${userId}`)
            } catch (err) {
                console.error(`[downgrade] Failed to stop mock ${mock.id}:`, (err as Error).message)
            }
        }
    }
}
