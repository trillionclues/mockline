import type { StartMockContainerParams } from '@mockline/types'
import { DEFAULT_RESOURCE_LIMITS } from '@mockline/types'

// Starts new container from built mock image with resource limits enforced.
export async function startMockContainer(
    _params: StartMockContainerParams,
): Promise<{ containerId: string; port: number }> {
    // TODO: Implement
    // 1. docker.createContainer() with resource limits + Traefik labels
    // 2. container.start()
    // 3. Return containerId + mapped port
    void DEFAULT_RESOURCE_LIMITS
    throw new Error('Not implemented')
}
