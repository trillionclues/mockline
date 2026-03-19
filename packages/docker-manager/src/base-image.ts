import { docker } from './client'
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'

export function getBaseImageTag(contourVersion: string): string {
    return `mockline/contour-base:${contourVersion}`
}

export async function ensureContourBaseImage(contourVersion: string): Promise<string> {
    const baseTag = getBaseImageTag(contourVersion)

    // Already built — skip
    try {
        const info = await docker.getImage(baseTag).inspect()
        console.log(`[base-image] ${baseTag} already exists, skipping build`)
        return info.Id
    } catch {
        // doesn't exist yet, build it
    }

    console.log(`[base-image] Building ${baseTag}...`)

    const dockerfile = [
        'FROM node:22-alpine',
        'ENV PNPM_HOME=/usr/local/share/pnpm',
        'ENV PATH=/usr/local/share/pnpm:$PATH',
        'RUN corepack enable && corepack prepare pnpm@9.15.0 --activate',
        `RUN pnpm add -g @trillionclues/contour@${contourVersion}`,

        // Make the binary executable by all users
        'RUN chmod -R 755 /usr/local/share/pnpm',
        // Patch contour to bind to 0.0.0.0
        // `RUN find /usr/local/share/pnpm -path "*/@trillionclues/contour/dist/*" -name "*.js" -exec sed -i "s/'127.0.0.1'/'0.0.0.0'/g" {} +`,
    ].join('\n')

    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'mockline-base-'))

    try {
        fs.writeFileSync(path.join(tmpDir, 'Dockerfile'), dockerfile, 'utf-8')

        const tar = await import('tar-fs')
        const tarStream = tar.pack(tmpDir, { entries: ['Dockerfile'] })

        const buildStream = await docker.buildImage(tarStream, { t: baseTag })

        return await new Promise((resolve, reject) => {
            docker.modem.followProgress(
                buildStream,
                async (err, output: Array<{ stream?: string; error?: string; aux?: { ID: string } }>) => {
                    if (err) {
                        reject(new Error(`Base image build failed: ${err.message}`))
                        return
                    }

                    const errorLine = output.find(o => o.error)
                    if (errorLine?.error) {
                        reject(new Error(`Base image build error: ${errorLine.error}`))
                        return
                    }

                    const auxEntries = output.filter(o => o.aux?.ID)
                    const lastAux = auxEntries[auxEntries.length - 1]
                    if (lastAux?.aux?.ID) {
                        console.log(`[base-image] ${baseTag} built successfully`)
                        resolve(lastAux.aux.ID)
                        return
                    }

                    try {
                        const info = await docker.getImage(baseTag).inspect()
                        console.log(`[base-image] ${baseTag} built successfully`)
                        resolve(info.Id)
                    } catch {
                        reject(new Error(`Base image build completed but ${baseTag} not found`))
                    }
                }
            )
        })
    } finally {
        fs.rmSync(tmpDir, { recursive: true, force: true })
    }
}