import type { ContainerStatus, ContainerInfo } from '@mockline/types'
import { docker } from './client'

// Gets current status of a specific container.
export async function getContainerStatus(containerId: string): Promise<ContainerStatus> {
    try {
        const container = docker.getContainer(containerId)
        const info = await container.inspect()

        return {
            id: containerId,
            state: info.State.Running
                ? 'running'
                : info.State.Paused
                    ? 'paused'
                    : info.State.Dead
                        ? 'dead'
                        : 'stopped',
            health:
                info.State.Health?.Status === 'healthy'
                    ? 'healthy'
                    : info.State.Health?.Status === 'unhealthy'
                        ? 'unhealthy'
                        : info.State.Health?.Status === 'starting'
                            ? 'starting'
                            : 'none',
            startedAt: info.State.StartedAt,
            ports: Object.entries(info.NetworkSettings.Ports || {}).map(([containerPort, hostBindings]) => ({
                container: parseInt(containerPort),
                host: hostBindings?.[0] ? parseInt(hostBindings[0].HostPort) : 0,
            })),
        }
    } catch {
        return { id: containerId, state: 'not_found', health: 'none' }
    }
}

// Lists all active (running) Mockline containers.
export async function listActiveContainers(): Promise<ContainerInfo[]> {
    const containers = await docker.listContainers({
        filters: { name: ['mockline-mock-'] },
    })

    return containers.map((c) => ({
        id: c.Id,
        name: c.Names[0]?.replace('/', '') ?? '',
        status: c.State as ContainerStatus['state'],
        imageId: c.ImageID,
        createdAt: new Date(c.Created * 1000).toISOString(),
    }))
}
