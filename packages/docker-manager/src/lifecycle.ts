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

// remove image
export async function removeImage(imageId: string): Promise<void> {
    const image = docker.getImage(imageId)
    await image.remove({ force: true })
}

// prune dangling images
export async function pruneDockerImages(): Promise<{ pruned: number }> {
    try {
        const result = await docker.pruneImages({ filters: { dangling: { true: true } } })
        const pruned = result.ImagesDeleted?.length ?? 0
        if (pruned > 0) {
            console.log(`Image prune: removed ${pruned} dangling image(s), freed ${result.SpaceReclaimed} bytes`)
        }
        return { pruned }
    } catch (error) {
        console.error('Image prune failed:', (error as Error).message)
        return { pruned: 0 }
    }
}