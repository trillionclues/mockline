import { Hono } from 'hono'
import { z } from 'zod'
import { parseEndpoints, detectFormat } from '@mockline/spec-parser'
import yaml from 'yaml'
import { createSpec, addSpecVersion } from '../services/mock-provisioner'
import { SPEC_LIMITS } from '@mockline/types'
import { requireTier } from '../middleware/tier-guard'
import {
    listSpecs,
    findSpec,
    findSpecBasic,
    countSpecs,
    softDeleteSpec,
    listVersions,
    findVersion,
} from '../repositories/spec.repository'
import { findMocksBySpec, updateMockStatus } from '../repositories/mock.repository'
import type { AppEnv } from '../types/env'

export const specsRouter = new Hono<AppEnv>()

const CreateSpecSchema = z.object({
    name: z.string().min(1).max(100),
    content: z.string().max(10 * 1024 * 1024).optional(), // 10MB limit
    url: z.string().url().optional(),
}).refine(data => data.content || data.url, {
    message: 'Either content or url must be provided',
})

const AddVersionSchema = z.object({
    content: z.string().min(1).max(10 * 1024 * 1024), // 10MB limit
})

// list user's specs
specsRouter.get('/', async (c) => {
    const userId = c.get('user').id
    const specs = await listSpecs(userId)
    return c.json({ data: specs, error: null })
})

// upload new spec (paste content OR import from URL)
specsRouter.post('/', async (c) => {
    const userId = c.get('user').id
    const userTier = c.get('user').tier
    const body = await c.req.json()
    const parsed = CreateSpecSchema.safeParse(body)

    if (!parsed.success) {
        return c.json(
            { data: null, error: { code: 'VALIDATION_ERROR', message: parsed.error.message } },
            400,
        )
    }

    // enforce spec limit by tier
    const specLimit = SPEC_LIMITS[userTier ?? 'FREE']
    if (specLimit !== Infinity) {
        const existingCount = await countSpecs(userId)
        if (existingCount >= specLimit) {
            return c.json(
                {
                    data: null,
                    error: {
                        code: 'UPGRADE_REQUIRED',
                        message: `Spec limit reached. Upgrade to Pro for unlimited specs.`,
                        requiredTier: 'PRO',
                    },
                },
                403,
            )
        }
    }

    let { content } = parsed.data
    const { name, url } = parsed.data

    // If URL provided, fetch the spec content from it
    if (url && !content) {
        try {
            const res = await fetch(url, {
                headers: { Accept: 'application/json, application/x-yaml, text/yaml, text/plain' },
                signal: AbortSignal.timeout(15000),
            })
            if (!res.ok) {
                return c.json(
                    { data: null, error: { code: 'URL_FETCH_FAILED', message: `Failed to fetch URL: HTTP ${res.status}` } },
                    400,
                )
            }
            content = await res.text()
            if (!content.trim()) {
                return c.json(
                    { data: null, error: { code: 'URL_EMPTY', message: 'URL returned empty content' } },
                    400,
                )
            }
        } catch (error) {
            return c.json(
                { data: null, error: { code: 'URL_FETCH_FAILED', message: `Could not fetch URL: ${(error as Error).message}` } },
                400,
            )
        }
    }

    try {
        const result = await createSpec({ name, content: content!, userId })
        return c.json({ data: result, error: null }, 201)
    } catch (error) {
        return c.json(
            { data: null, error: { code: 'SPEC_INVALID', message: (error as Error).message } },
            400,
        )
    }
})

// get spec + versions + parsed endpoints
specsRouter.get('/:id', async (c) => {
    const userId = c.get('user').id
    const spec = await findSpec(c.req.param('id'), userId)

    if (!spec) {
        return c.json({ data: null, error: { code: 'NOT_FOUND', message: 'Spec not found' } }, 404)
    }

    // Parse endpoints from the latest version for the API Explorer
    let endpoints: ReturnType<typeof parseEndpoints> = []
    const latestVersion = spec.versions[0]
    if (latestVersion) {
        try {
            const format = detectFormat(latestVersion.content)
            const specObject = format === 'YAML'
                ? yaml.parse(latestVersion.content)
                : JSON.parse(latestVersion.content)
            endpoints = parseEndpoints(specObject)
        } catch {
            // If parsing fails, return empty endpoints rather than erroring
        }
    }

    return c.json({ data: { ...spec, endpoints }, error: null })
})

// soft delete spec
specsRouter.delete('/:id', async (c) => {
    const userId = c.get('user').id
    const spec = await findSpecBasic(c.req.param('id'), userId)

    if (!spec) {
        return c.json({ data: null, error: { code: 'NOT_FOUND', message: 'Spec not found' } }, 404)
    }

    // cascade: stop and remove all mock containers for this spec
    const mocks = await findMocksBySpec(spec.id)

    const { removeContainer } = await import('@mockline/docker-manager')

    await Promise.allSettled(
        mocks.map(async (mock) => {
            if (mock.dockerContainerId) {
                try {
                    await removeContainer(mock.dockerContainerId)
                } catch {
                    // container may already be gone, continue
                }
            }
            await updateMockStatus(mock.id, 'REMOVED', { deletedAt: new Date() })
        })
    )

    await softDeleteSpec(spec.id)
    return c.json({ data: { deleted: true }, error: null })
})

// version history
specsRouter.get('/:id/versions', async (c) => {
    const userId = c.get('user').id
    const spec = await findSpecBasic(c.req.param('id'), userId)

    if (!spec) {
        return c.json({ data: null, error: { code: 'NOT_FOUND', message: 'Spec not found' } }, 404)
    }

    const versions = await listVersions(spec.id)
    return c.json({ data: versions, error: null })
})

// POST /specs/:id/versions — Upload new version
specsRouter.post('/:id/versions', async (c) => {
    const userId = c.get('user').id
    const body = await c.req.json()
    const parsed = AddVersionSchema.safeParse(body)

    if (!parsed.success) {
        return c.json(
            { data: null, error: { code: 'VALIDATION_ERROR', message: parsed.error.message } },
            400,
        )
    }

    try {
        const result = await addSpecVersion({
            specId: c.req.param('id'),
            content: parsed.data.content,
            userId,
        })
        return c.json({ data: result, error: null }, 201)
    } catch (error) {
        return c.json(
            { data: null, error: { code: 'SPEC_INVALID', message: (error as Error).message } },
            400,
        )
    }
})

// diff two versions (PRO+)
specsRouter.get('/:id/versions/:v1/diff/:v2', requireTier('PRO'), async (c) => {
    const userId = c.get('user').id
    const specId = c.req.param('id')
    const v1 = parseInt(c.req.param('v1'))
    const v2 = parseInt(c.req.param('v2'))

    const spec = await findSpecBasic(specId, userId)
    if (!spec) {
        return c.json({ data: null, error: { code: 'NOT_FOUND', message: 'Spec not found' } }, 404)
    }

    const [version1, version2] = await Promise.all([
        findVersion(specId, v1),
        findVersion(specId, v2),
    ])

    if (!version1 || !version2) {
        return c.json(
            { data: null, error: { code: 'NOT_FOUND', message: 'Version not found' } },
            404,
        )
    }

    const { diffSpecs } = await import('../services/schema-differ')
    const diff = diffSpecs(version1.content, version2.content)
    return c.json({ data: diff, error: null })
})
