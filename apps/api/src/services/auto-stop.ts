import { db } from '@mockline/db'
import { stopContainer } from '@mockline/docker-manager'
import { AUTO_STOP_MINUTES } from '@mockline/types'

// Auto-stop cron: finds mock servers that haven't been accessed
// within AUTO_STOP_MINUTES and stops their containers.
// Run every 5 minutes.
export async function autoStopInactiveContainers(): Promise<{ stopped: number }> {
    const cutoff = new Date(Date.now() - AUTO_STOP_MINUTES * 60 * 1000)

    const staleServers = await db.mockServer.findMany({
        where: {
            status: 'RUNNING',
            lastAccessedAt: { lt: cutoff },
            deletedAt: null,
        },
    })

    let stopped = 0

    for (const server of staleServers) {
        if (!server.dockerContainerId) continue

        try {
            await stopContainer(server.dockerContainerId)
            await db.mockServer.update({
                where: { id: server.id },
                data: { status: 'STOPPED' },
            })
            stopped++
            console.log(`Auto-stopped container ${server.dockerContainerId} (idle ${AUTO_STOP_MINUTES}+ min)`)
        } catch (error) {
            console.error(`Failed to auto-stop ${server.dockerContainerId}:`, (error as Error).message)
        }
    }

    return { stopped }
}

// Starts the auto-stop interval at server startup.
export function startAutoStopScheduler(intervalMs = 5 * 60 * 1000): NodeJS.Timeout {
    console.log(`Auto-stop scheduler started (checks every ${intervalMs / 1000}s, stops after ${AUTO_STOP_MINUTES}min idle)`)

    return setInterval(async () => {
        try {
            const { stopped } = await autoStopInactiveContainers()
            if (stopped > 0) {
                console.log(`Auto-stop: stopped ${stopped} idle container(s)`)
            }
        } catch (error) {
            console.error('Auto-stop scheduler error:', (error as Error).message)
        }
    }, intervalMs)
}
