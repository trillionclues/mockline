import { db } from '@mockline/db'
import { removeContainer } from '@mockline/docker-manager'

// Cleans up all Docker containers owned by a user before account deletion.
export async function cleanupUserResources(userId: string): Promise<void> {
    const mocks = await db.mockServer.findMany({
        where: {
            userId,
            deletedAt: null,
            status: { not: 'REMOVED' },
        },
        select: { id: true, dockerContainerId: true, status: true },
    })

    await Promise.allSettled(
        mocks.map(async (mock) => {
            if (mock.dockerContainerId) {
                try {
                    await removeContainer(mock.dockerContainerId)
                } catch {
                    // Container may already be stopped or gone — continue
                }
            }
            await db.mockServer.update({
                where: { id: mock.id },
                data: { status: 'REMOVED', deletedAt: new Date() },
            })
        })
    )
}
