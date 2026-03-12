import { docker } from './client'
import type { StartMockContainerParams } from '@mockline/types'
import { DEFAULT_RESOURCE_LIMITS } from '@mockline/types'

const MOCK_NETWORK = 'mockline-network'

// Starts new container from built mock image with resource limits.
// Assigns Traefik labels for dynamic routing and connects to the mock network.
export async function startMockContainer(
    params: StartMockContainerParams,
): Promise<{ containerId: string; port: number }> {
    const { imageId, containerId, resourceLimits = DEFAULT_RESOURCE_LIMITS } = params
    const memoryBytes = (resourceLimits.memoryMb ?? DEFAULT_RESOURCE_LIMITS.memoryMb) * 1024 * 1024
    const cpuQuota = Math.floor((resourceLimits.cpuPercent ?? DEFAULT_RESOURCE_LIMITS.cpuPercent) * 1000)

    const port = await findAvailablePort()

    const container = await docker.createContainer({
        name: containerId,
        Image: imageId,
        ExposedPorts: { '3001/tcp': {} },
        HostConfig: {
            PortBindings: {
                '3001/tcp': [{ HostPort: String(port) }],
            },
            Memory: memoryBytes,
            MemorySwap: memoryBytes, // Same as memory = disable swap for this container
            NanoCpus: cpuQuota * 1_000_000,
            PidsLimit: 50,
            RestartPolicy: { Name: 'unless-stopped' },
            SecurityOpt: ['no-new-privileges'],
            CapDrop: ['ALL'],
            CapAdd: [],
        },
        Labels: {
            'mockline.managed': 'true',
            'mockline.container-id': containerId,
            // Traefik labels for dynamic routing
            'traefik.enable': 'true',
            [`traefik.http.routers.${containerId}.rule`]: `Host(\`${containerId}.${process.env.MOCK_BASE_DOMAIN ?? 'localhost'}\`)`,
            [`traefik.http.services.${containerId}.loadbalancer.server.port`]: '3001',
            [`traefik.http.routers.${containerId}.entrypoints`]: 'websecure',
            [`traefik.http.routers.${containerId}.tls.certresolver`]: 'letsencrypt-wildcard',
            [`traefik.http.routers.${containerId}.tls.domains[0].main`]: 'mockline.xyz',
            [`traefik.http.routers.${containerId}.tls.domains[0].sans`]: '*.mockline.xyz',

        },
    })

    // Connect to mock network if it exists
    try {
        const network = docker.getNetwork(MOCK_NETWORK)
        await network.connect({ Container: container.id })
    } catch {
        // Network might not exist in dev
    }

    await container.start()

    return { containerId: container.id, port }
}

// container with custom Contour CLI flags.
// when user selects options like --stateful, --delay, --error-rate.
export async function startMockContainerWithOptions(
    params: StartMockContainerParams & {
        contourOptions?: {
            stateful?: boolean
            deterministic?: boolean
            delay?: string
            errorRate?: number
            requireAuth?: boolean
        }
        specFilename?: string
    },
): Promise<{ containerId: string; port: number }> {
    const { contourOptions, specFilename = 'spec.yaml', ...baseParams } = params

    // Build custom CMD from options
    const cmd = ['contour', 'start', specFilename, '--port', '3001']

    if (contourOptions?.stateful) cmd.push('--stateful')
    if (contourOptions?.deterministic) cmd.push('--deterministic')
    if (contourOptions?.delay) cmd.push('--delay', contourOptions.delay)
    if (contourOptions?.errorRate !== undefined) cmd.push('--error-rate', String(contourOptions.errorRate))
    if (contourOptions?.requireAuth) cmd.push('--require-auth')

    // For custom CMD, need to modify the container creation
    const port = await findAvailablePort()
    const { resourceLimits = DEFAULT_RESOURCE_LIMITS, imageId, containerId } = baseParams
    const memoryBytes = (resourceLimits.memoryMb ?? DEFAULT_RESOURCE_LIMITS.memoryMb) * 1024 * 1024
    const cpuQuota = Math.floor((resourceLimits.cpuPercent ?? DEFAULT_RESOURCE_LIMITS.cpuPercent) * 1000)

    const container = await docker.createContainer({
        name: containerId,
        Image: imageId,
        Cmd: cmd,
        ExposedPorts: { '3001/tcp': {} },
        HostConfig: {
            PortBindings: {
                '3001/tcp': [{ HostPort: String(port) }],
            },
            Memory: memoryBytes,
            MemorySwap: memoryBytes, // Same as memory = disable swap for this container
            NanoCpus: cpuQuota * 1_000_000,
            PidsLimit: 50,
            RestartPolicy: { Name: 'unless-stopped' },
            SecurityOpt: ['no-new-privileges'],
            CapDrop: ['ALL'],
            CapAdd: [],
        },
        Labels: {
            'mockline.managed': 'true',
            'mockline.container-id': containerId,
            'traefik.enable': 'true',
            [`traefik.http.routers.${containerId}.rule`]: `Host(\`${containerId}.${process.env.MOCK_BASE_DOMAIN ?? 'localhost'}\`)`,
            [`traefik.http.services.${containerId}.loadbalancer.server.port`]: '3001',
            [`traefik.http.routers.${containerId}.entrypoints`]: 'websecure',
            [`traefik.http.routers.${containerId}.tls.certresolver`]: 'letsencrypt-wildcard',
            [`traefik.http.routers.${containerId}.tls.domains[0].main`]: 'mockline.xyz',
            [`traefik.http.routers.${containerId}.tls.domains[0].sans`]: '*.mockline.xyz',

        },
    })

    try {
        const network = docker.getNetwork(MOCK_NETWORK)
        await network.connect({ Container: container.id })
    } catch {
        // Network might not exist in dev
    }

    await container.start()

    return { containerId: container.id, port }
}

// Finds available port starting from 3100.
async function findAvailablePort(startPort = 3100): Promise<number> {
    const containers = await docker.listContainers({ all: true })
    const usedPorts = new Set<number>()

    for (const container of containers) {
        for (const portInfo of container.Ports ?? []) {
            if (portInfo.PublicPort) usedPorts.add(portInfo.PublicPort)
        }
    }

    let port = startPort
    while (usedPorts.has(port)) {
        port++
        if (port > 4000) throw new Error('No available ports in range 3100-4000')
    }

    return port
}
