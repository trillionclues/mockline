import { docker } from './client'

// Stops running container. Doesn't remove it (preserves logs for debugging).
export async function stopContainer(containerId: string): Promise<void> {
    const container = docker.getContainer(containerId)
    await container.stop()
}

// Removes stopped container and associated resources.
export async function removeContainer(containerId: string): Promise<void> {
    const container = docker.getContainer(containerId)
    await container.remove({ force: true })
}
