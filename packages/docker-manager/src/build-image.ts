import { docker } from './client'
import type { BuildMockImageParams } from '@mockline/types'
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { Readable } from 'node:stream'

// Builds a Docker image with contour and the user's spec baked in.
// Writes spec to a temp directory, creates a Dockerfile, builds via dockerode.
export async function buildMockImage(params: BuildMockImageParams): Promise<{ imageId: string }> {
    const { specContent, specFormat, imageTag, contourVersion } = params
    const specFilename = specFormat === 'YAML' ? 'spec.yaml' : 'spec.json'

    // Create temp build context
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'mockline-build-'))

    try {
        fs.writeFileSync(path.join(tmpDir, specFilename), specContent, 'utf-8')

        // Write Dockerfile inline (self-contained without external reference)
        const dockerfile = [
            'FROM node:22-alpine',
            'WORKDIR /app',
            `ARG CONTOUR_VERSION=${contourVersion}`,
            'RUN npm install -g @trillionclues/contour@${CONTOUR_VERSION}',
            'USER node',
            `COPY --chown=node:node ${specFilename} ./${specFilename}`,
            'EXPOSE 3001',
            'HEALTHCHECK --interval=5s --timeout=3s --retries=5 \\',
            '  CMD wget -qO- http://localhost:3001/health || exit 1',
            `CMD ["contour", "start", "${specFilename}", "--port", "3001"]`,
        ].join('\n')

        fs.writeFileSync(path.join(tmpDir, 'Dockerfile'), dockerfile, 'utf-8')

        // Build the image
        const tarStream = await createTarball(tmpDir, [specFilename, 'Dockerfile'])
        const buildStream = await docker.buildImage(tarStream, {
            t: imageTag,
            buildargs: { CONTOUR_VERSION: contourVersion },
        })

        const imageId = await waitForBuild(buildStream, imageTag)
        return { imageId }
    } finally {
        // Clean temp dir
        fs.rmSync(tmpDir, { recursive: true, force: true })
    }
}

// Creates tar archive from build context for dockerode.
async function createTarball(dir: string, files: string[]): Promise<Readable> {
    const tar = await import('tar-fs')
    return tar.pack(dir, { entries: files })
}

// Waits for a Docker build stream to complete, returns image ID.
function waitForBuild(stream: NodeJS.ReadableStream, imageTag: string): Promise<string> {
    return new Promise((resolve, reject) => {
        docker.modem.followProgress(stream, (err: Error | null, output: Array<{ stream?: string; aux?: { ID: string } }>) => {
            if (err) {
                reject(new Error(`Docker build failed: ${err.message}`))
                return
            }

            // Find image ID from build output
            const auxEntry = output.find((o) => o.aux?.ID)
            if (auxEntry?.aux?.ID) {
                resolve(auxEntry.aux.ID)
                return
            }

            // If no aux, try to get image by tag
            docker.getImage(imageTag).inspect()
                .then((info) => resolve(info.Id))
                .catch(() => reject(new Error('Build completed but image not found')))
        })
    })
}
