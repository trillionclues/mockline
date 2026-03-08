import type { BuildMockImageParams } from '@mockline/types'

// Builds a Docker image with contour and the user's spec baked in.
// The spec is written to a temp directory, used as Docker build context.
export async function buildMockImage(_params: BuildMockImageParams): Promise<{ imageId: string }> {
    // TODO: Implement
    // 1. Create temp dir with spec file
    // 2. Copy Dockerfile from docker/mock-server/Dockerfile
    // 3. Build image via dockerode.buildImage()
    // 4. Return imageId
    throw new Error('Not implemented')
}
