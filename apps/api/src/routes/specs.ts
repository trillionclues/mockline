import { Hono } from 'hono'
import { z } from 'zod'
import { db } from '@mockline/db'
import { parseEndpoints, detectFormat } from '@mockline/spec-parser'
import yaml from 'yaml'
import { createSpec, addSpecVersion } from '../services/mock-provisioner'
import type { AppEnv } from '../types/env'

export const specsRouter = new Hono<AppEnv>()

const CreateSpecSchema = z.object({
    name: z.string().min(1).max(100),
    content: z.string().min(1).max(1024 * 1024), // 1MB limit
})

const AddVersionSchema = z.object({
    content: z.string().min(1).max(1024 * 1024),
})

// GET /specs — List user's specs
specsRouter.get('/', async (c) => {
    const userId = c.get('user').id
    const specs = await db.spec.findMany({
        where: { userId, deletedAt: null },
        include: {
            versions: { orderBy: { version: 'desc' }, take: 1 },
            _count: { select: { mockServers: { where: { deletedAt: null } } } },
        },
        orderBy: { updatedAt: 'desc' },
    })
    return c.json({ data: specs, error: null })
})

// POST /specs — Upload new spec
specsRouter.post('/', async (c) => {
    const userId = c.get('user').id
    const body = await c.req.json()
    const parsed = CreateSpecSchema.safeParse(body)

    if (!parsed.success) {
        return c.json(
            { data: null, error: { code: 'VALIDATION_ERROR', message: parsed.error.message } },
            400,
        )
    }

    try {
        const result = await createSpec({ ...parsed.data, userId })
        return c.json({ data: result, error: null }, 201)
    } catch (error) {
        return c.json(
            { data: null, error: { code: 'SPEC_INVALID', message: (error as Error).message } },
            400,
        )
    }
})

// GET /specs/:id — Get spec + versions + parsed endpoints
specsRouter.get('/:id', async (c) => {
    const userId = c.get('user').id
    const spec = await db.spec.findFirst({
        where: { id: c.req.param('id'), userId, deletedAt: null },
        include: { versions: { orderBy: { version: 'desc' } } },
    })

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

// DELETE /specs/:id — Soft delete spec
specsRouter.delete('/:id', async (c) => {
    const userId = c.get('user').id
    const spec = await db.spec.findFirst({
        where: { id: c.req.param('id'), userId, deletedAt: null },
    })

    if (!spec) {
        return c.json({ data: null, error: { code: 'NOT_FOUND', message: 'Spec not found' } }, 404)
    }

    // Cascade: stop and remove all mock containers for this spec
    const mocks = await db.mockServer.findMany({
        where: { specId: spec.id, deletedAt: null },
    });

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
            await db.mockServer.update({
                where: { id: mock.id },
                data: { status: 'REMOVED', deletedAt: new Date() },
            })
        })
    )

    await db.spec.update({
        where: { id: spec.id },
        data: { deletedAt: new Date() },
    })
    return c.json({ data: { deleted: true }, error: null })
})

// GET /specs/:id/versions — Version history
specsRouter.get('/:id/versions', async (c) => {
    const userId = c.get('user').id
    const spec = await db.spec.findFirst({
        where: { id: c.req.param('id'), userId, deletedAt: null },
    })

    if (!spec) {
        return c.json({ data: null, error: { code: 'NOT_FOUND', message: 'Spec not found' } }, 404)
    }

    const versions = await db.specVersion.findMany({
        where: { specId: spec.id },
        orderBy: { version: 'desc' },
        select: { id: true, version: true, format: true, hash: true, createdAt: true },
    })
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

// GET /specs/:id/versions/:v1/diff/:v2 — Diff two versions
specsRouter.get('/:id/versions/:v1/diff/:v2', async (c) => {
    const userId = c.get('user').id
    const specId = c.req.param('id')
    const v1 = parseInt(c.req.param('v1'))
    const v2 = parseInt(c.req.param('v2'))

    const spec = await db.spec.findFirst({
        where: { id: specId, userId, deletedAt: null },
    })
    if (!spec) {
        return c.json({ data: null, error: { code: 'NOT_FOUND', message: 'Spec not found' } }, 404)
    }

    const [version1, version2] = await Promise.all([
        db.specVersion.findFirst({ where: { specId, version: v1 } }),
        db.specVersion.findFirst({ where: { specId, version: v2 } }),
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
