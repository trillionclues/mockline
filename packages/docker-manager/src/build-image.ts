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
            'FROM node:22-alpine AS installer',
            'WORKDIR /app',
            `ARG CONTOUR_VERSION=${contourVersion}`,
            'ENV PNPM_HOME=/usr/local/share/pnpm',
            'ENV PATH=/usr/local/share/pnpm:$PATH',
            'RUN corepack enable && corepack prepare pnpm@9.15.0 --activate',
            `RUN pnpm add -g @trillionclues/contour@${contourVersion}`,

            // Make the binary executable by all users
            'RUN chmod -R 755 /usr/local/share/pnpm',
            '',
            'FROM node:22-alpine AS runner',
            'WORKDIR /app',

            // Set PATH before switching user so node user inherits it
            'ENV PNPM_HOME=/usr/local/share/pnpm',
            'ENV PATH=/usr/local/share/pnpm:$PATH',
            'COPY --from=installer /usr/local/share/pnpm /usr/local/share/pnpm',

            // Ensure node user can read/execute
            'RUN chmod -R 755 /usr/local/share/pnpm',

            // Patch contour to bind to 0.0.0.0 (all interfaces) instead of 127.0.0.1
            // This must run in the runner stage BEFORE switching to non-root user
            `RUN find /usr/local/share/pnpm -path "*/@trillionclues/contour/dist/*" -name "*.js" -exec sed -i "s/'127.0.0.1'/'0.0.0.0'/g" {} +`,
            'USER node',
            `COPY --chown=node:node ${specFilename} ./${specFilename}`,
            'EXPOSE 3001',
            'HEALTHCHECK --interval=5s --timeout=3s --retries=5 \\',
            '  CMD wget -qO- http://localhost:3001/_contour/health || exit 1',
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
        docker.modem.followProgress(stream, async (err: Error | null, output: Array<{ stream?: string; aux?: { ID: string } }>) => {
            if (err) {
                reject(new Error(`Docker build failed: ${err.message}`))
                return
            }

            // Find image ID from build output - use the LAST aux ID for multi-stage builds
            const auxEntries = output.filter((o) => o.aux?.ID)
            const auxEntry = auxEntries[auxEntries.length - 1]
            if (auxEntry?.aux?.ID) {
                resolve(auxEntry.aux.ID)
                return
            }

            // If no aux, try to get image by tag
            docker.getImage(imageTag).inspect()
                .then((info) => resolve(info.Id))
                .catch(() => reject(new Error('Build completed but image not found')))


            // const maxAttempts = 5
            // for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            //     try {
            //         const info = await docker.getImage(imageTag).inspect()
            //         resolve(info.Id)
            //         return
            //     } catch {
            //         if (attempt === maxAttempts) {
            //             reject(new Error(
            //                 `Build completed but image "${imageTag}" not found after ${maxAttempts} attempts.\n\nBuild log:\n${buildLog}`
            //             ))
            //             return
            //         }
            //         // Wait before retrying: 200ms, 400ms, 800ms, 1600ms
            //         await new Promise(r => setTimeout(r, 200 * attempt))
            //     }
            // }
        })
    })
}
