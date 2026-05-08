import { findStaleFreeMocks, findStaleRunningMocks, findExpiredSandboxes, updateMockStatus } from '@/repositories/mock.repository'
import { stopContainer, removeContainer, removeImage, pruneDockerImages } from '@mockline/docker-manager'
import { AUTO_STOP_MINUTES } from '@mockline/types'
import type { Tier } from '@mockline/types'
import { cleanupExpiredLogs } from './log-retention'
import { ingestTraefikAccessLogs } from './traefik-log-ingester'


// Auto-stop cron(5mins): finds mock servers that haven't been accessed
// within their tier's AUTO_STOP_MINUTES and stops their containers.
export async function autoStopInactiveContainers(): Promise<{ stopped: number }> {
    let stopped = 0
    const tiers: Tier[] = ['FREE', 'PRO', 'TEAM']

    for (const tier of tiers) {
        const timeoutMinutes = AUTO_STOP_MINUTES[tier]
        const cutoff = new Date(Date.now() - timeoutMinutes * 60 * 1000)

        const staleServers = await findStaleRunningMocks(tier, cutoff)

        for (const server of staleServers) {
            if (!server.dockerContainerId) continue

            try {
                await stopContainer(server.dockerContainerId)
                await updateMockStatus(server.id, 'STOPPED')
                stopped++
                console.log(`Auto-stopped container ${server.dockerContainerId} (tier: ${tier}, idle ${timeoutMinutes}+ min)`)
            } catch (error) {
                console.error(`Failed to auto-stop ${server.dockerContainerId}:`, (error as Error).message)
            }
        }
    }

    return { stopped }
}

// Auto-remove cron: finds Free tier mock servers that are older than 24hrs
// and deletes both the container and the MockServer DB record and not the spec.
export async function autoRemoveStaleFreeMocks(): Promise<{ removed: number }> {
    let removed = 0
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000)

    const staleServers = await findStaleFreeMocks(cutoff)

    for (const server of staleServers) {
        try {
            if (server.dockerContainerId) {
                await removeContainer(server.dockerContainerId)
            }

            if (server.dockerImageId) {
                await removeImage(server.dockerImageId)
            }
            await updateMockStatus(server.id, 'REMOVED', {
                deletedAt: new Date(),
                publicUrl: null,
                dockerContainerId: null,
            })
            removed++
            console.log(`Auto-removed free mock ${server.id} (older than 24h)`)
        } catch (error) {
            console.error(`Failed to auto-remove free mock ${server.id}:`, (error as Error).message)
        }
    }

    return { removed }
}

// Auto-remove expired partner sandboxes: finds mock servers whose deliberate
// expiresAt has elapsed and stops + removes them.
export async function autoRemoveExpiredSandboxes(): Promise<{ expired: number }> {
    let expired = 0
    const expiredServers = await findExpiredSandboxes()

    for (const server of expiredServers) {
        try {
            if (server.dockerContainerId) {
                try {
                    await stopContainer(server.dockerContainerId)
                } catch { /* container may already be stopped */ }
                await removeContainer(server.dockerContainerId)
            }

            if (server.dockerImageId) {
                await removeImage(server.dockerImageId)
            }

            await updateMockStatus(server.id, 'REMOVED', {
                deletedAt: new Date(),
                publicUrl: null,
                dockerContainerId: null,
            })
            expired++
            console.log(`Expired sandbox ${server.id} (label: ${server.label ?? 'unnamed'}, expired at: ${server.expiresAt?.toISOString()})`)
        } catch (error) {
            console.error(`Failed to remove expired sandbox ${server.id}:`, (error as Error).message)
        }
    }

    return { expired }
}

// Starts the auto-stop and auto-remove interval at server startup.
export function startAutoStopScheduler(intervalMs = 5 * 60 * 1000): NodeJS.Timeout {
    console.log(`Auto-stop scheduler started (checks every ${intervalMs / 1000}s)`)

    // prune dangling images
    pruneDockerImages();
    setInterval(pruneDockerImages, 60 * 60 * 1000);

    return setInterval(async () => {
        try {
            const { stopped } = await autoStopInactiveContainers()
            if (stopped > 0) {
                console.log(`Auto-stop: stopped ${stopped} idle container(s)`)
            }

            const { removed } = await autoRemoveStaleFreeMocks()
            if (removed > 0) {
                console.log(`Auto-remove: deleted ${removed} 24h+ free mock(s)`)
            }

            const { expired } = await autoRemoveExpiredSandboxes()
            if (expired > 0) {
                console.log(`Sandbox expiry: removed ${expired} expired sandbox(es)`)
            }

            const { deleted } = await cleanupExpiredLogs()
            if (deleted > 0) {
                console.log(`Log retention: purged ${deleted} expired log(s)`)
            }

            // Ingest Traefik access logs — runs every tick (every 5 min by default)
            // In prod, Traefik writes to /var/log/traefik/access.log (shared Docker volume)
            const { ingested } = await ingestTraefikAccessLogs()
            if (ingested > 0) {
                console.log(`Traefik ingester: recorded ${ingested} new request(s)`)
            }
        } catch (error) {
            console.error('Auto-scheduler error:', (error as Error).message)
        }
    }, intervalMs)
}
