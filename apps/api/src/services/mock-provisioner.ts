import { db } from '@mockline/db'
import { buildMockImage, startMockContainer } from '@mockline/docker-manager'
import { validateSpec } from '@mockline/spec-parser'
import { detectFormat } from '@mockline/spec-parser'
import { CONTAINER_LIMITS, DEFAULT_RESOURCE_LIMITS } from '@mockline/types'
import type { Tier } from '@mockline/types'
import crypto from 'node:crypto'

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
}): Promise<{ id: string; publicUrl: string; status: string }> {
    const { specVersionId, userId, tier } = params

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
        },
    })

    // Build image (async — don't block response)
    const imageTag = `mockline-mock-${mockServer.id}-${specVersion.hash.slice(0, 8)}`

    try {
        const { imageId } = await buildMockImage({
            specContent: specVersion.content,
            specFormat: specVersion.format,
            imageTag,
            contourVersion: process.env.CONTOUR_VERSION ?? '1.2.0',
        })

        const containerName = `mock-${mockServer.id}`
        const { containerId, port } = await startMockContainer({
            imageId,
            containerId: containerName,
            resourceLimits: DEFAULT_RESOURCE_LIMITS,
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
        throw new Error(`Invalid spec: ${validation.errors.map((e) => e.message).join(', ')}`)
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
        throw new Error(`Invalid spec: ${validation.errors.map((e) => e.message).join(', ')}`)
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
