import { db } from '@mockline/db'
import { buildMockImage, startMockContainerWithOptions } from '@mockline/docker-manager'
import { validateSpec } from '@mockline/spec-parser'
import { detectFormat } from '@mockline/spec-parser'
import { CONTAINER_LIMITS, DEFAULT_RESOURCE_LIMITS } from '@mockline/types'
import type { ContourOptions, Tier } from '@mockline/types'
import crypto from 'node:crypto'

function sanitizeErrorMessage(msg: string): string {
    // Strip absolute file paths & anything that looks like HTML
    let cleaned = msg.replace(/\/[\w./-]+\//g, '').replace(/[A-Z]:\\[\w.\\-]+\\/gi, '')

    cleaned = cleaned.replace(/<[^>]+>/g, '').trim()
    if (cleaned.length > 200) {
        cleaned = cleaned.slice(0, 200) + '…'
    }
    return cleaned || 'The provided content is not a valid OpenAPI specification'
}

/**
 * Provisions a new mock server:
 * 1. Validates the spec version exists
 * 2. Checks user hasn't exceeded container limit
 * 3. Builds Docker image with spec baked in
 * 4. Starts container
 * 5. Returns mock server record
 */

export async function provisionMockServer(params: {
    specVersionId: string
    userId: string
    tier: Tier
    contourOptions?: ContourOptions
}): Promise<{ id: string; publicUrl: string; status: string }> {
    const { specVersionId, userId, tier, contourOptions } = params

    // Check container limit
    const activeCount = await db.mockServer.count({
        where: { userId, status: 'RUNNING', deletedAt: null },
    })

    const limit = CONTAINER_LIMITS[tier]
    if (activeCount >= limit) {
        throw new Error(`Container limit reached (${limit} for ${tier} tier)`)
    }

    // Get spec version
    const specVersion = await db.specVersion.findUnique({
        where: { id: specVersionId },
        include: { spec: true },
    })

    if (!specVersion) {
        throw new Error('Spec version not found')
    }

    // Create mock server record
    const mockServer = await db.mockServer.create({
        data: {
            specId: specVersion.specId,
            specVersionId,
            userId,
            status: 'BUILDING',
            tier,
            isStateful: contourOptions?.isStateful ?? false,
            isDeterministic: contourOptions?.isDeterministic ?? false,
            delay: contourOptions?.delay ?? null,
            errorRate: contourOptions?.errorRate ?? 0,
            requireAuth: contourOptions?.requireAuth ?? false,
        },
    })

    // Build image (async — don't block response)
    const imageTag = `mockline-mock-${mockServer.id}-${specVersion.hash.slice(0, 8)}`

    try {
        const { imageId } = await buildMockImage({
            specContent: specVersion.content,
            specFormat: specVersion.format,
            imageTag,
            contourVersion: process.env.CONTOUR_VERSION ?? '1.2.1',
        })

        // generate mock server slug for url
        const cleanName = specVersion.spec.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'mock'
        const shortHash = crypto.randomBytes(2).toString('hex')
        const containerName = `${cleanName}-${shortHash}`

        const specFilename = specVersion.format === 'YAML' ? 'spec.yaml' : 'spec.json'

        const { containerId, port } = await startMockContainerWithOptions({
            imageId,
            containerId: containerName,
            resourceLimits: DEFAULT_RESOURCE_LIMITS,
            specFilename,
            contourOptions: {
                stateful: mockServer.isStateful,
                deterministic: mockServer.isDeterministic,
                delay: mockServer.delay || undefined,
                errorRate: mockServer.errorRate,
                requireAuth: mockServer.requireAuth
            }
        })

        const mockBaseDomain = process.env.MOCK_BASE_DOMAIN ?? 'localhost'
        const publicUrl =
            mockBaseDomain === 'localhost'
                ? `http://localhost:${port}`
                : `https://${containerName}.${mockBaseDomain}`

        await db.mockServer.update({
            where: { id: mockServer.id },
            data: {
                status: 'RUNNING',
                dockerImageId: imageId,
                dockerContainerId: containerId,
                publicUrl,
                port,
            },
        })

        return { id: mockServer.id, publicUrl, status: 'RUNNING' }
    } catch (error) {
        await db.mockServer.update({
            where: { id: mockServer.id },
            data: { status: 'FAILED' },
        })
        throw error
    }
}

// Creates new spec and its first version.
export async function createSpec(params: {
    name: string
    content: string
    userId: string
}): Promise<{ id: string; versionId: string }> {
    const { name, content, userId } = params
    const format = detectFormat(content)

    // Validate before saving
    const validation = await validateSpec(content, format === 'YAML' ? 'yaml' : 'json')
    if (!validation.valid) {
        const sanitized = validation.errors
            .map((e) => sanitizeErrorMessage(e.message))
            .join(', ')
        throw new Error(`Invalid spec: ${sanitized}`)
    }

    const hash = crypto.createHash('sha256').update(content).digest('hex')

    const spec = await db.spec.create({
        data: {
            name,
            userId,
            versions: {
                create: {
                    version: 1,
                    content,
                    format,
                    hash,
                },
            },
        },
        include: { versions: true },
    })

    return { id: spec.id, versionId: spec.versions[0]!.id }
}

// Adds new version to existing spec.
export async function addSpecVersion(params: {
    specId: string
    content: string
    userId: string
}): Promise<{ versionId: string; version: number }> {
    const { specId, content, userId } = params

    // Verify ownership
    const spec = await db.spec.findFirst({
        where: { id: specId, userId, deletedAt: null },
        include: { versions: { orderBy: { version: 'desc' }, take: 1 } },
    })

    if (!spec) throw new Error('Spec not found')

    const format = detectFormat(content)
    const validation = await validateSpec(content, format === 'YAML' ? 'yaml' : 'json')
    if (!validation.valid) {
        const sanitized = validation.errors
            .map((e) => sanitizeErrorMessage(e.message))
            .join(', ')
        throw new Error(`Invalid spec: ${sanitized}`)
    }

    const hash = crypto.createHash('sha256').update(content).digest('hex')
    const nextVersion = (spec.versions[0]?.version ?? 0) + 1

    // Dedup: if hash matches latest, don't create a new version
    if (spec.versions[0]?.hash === hash) {
        return { versionId: spec.versions[0].id, version: spec.versions[0].version }
    }

    const version = await db.specVersion.create({
        data: {
            specId,
            version: nextVersion,
            content,
            format,
            hash,
        },
    })

    return { versionId: version.id, version: version.version }
}
