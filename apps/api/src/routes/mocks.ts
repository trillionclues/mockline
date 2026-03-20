import { Hono } from 'hono'
import { z } from 'zod'
import { db } from '@mockline/db'
import { stopContainer, removeContainer, getContainerStatus } from '@mockline/docker-manager'
import { provisionMockServer } from '../services/mock-provisioner'
import type { AppEnv } from '../types/env'

export const mocksRouter = new Hono<AppEnv>()

const ProvisionSchema = z.object({
    specVersionId: z.string().min(1),
    contourOptions: z
        .object({
            stateful: z.boolean().optional(),
            deterministic: z.boolean().optional(),
            delay: z.string().optional(),
            errorRate: z.number().min(0).max(100).optional(),
            requireAuth: z.boolean().optional(),
        })
        .optional(),
})

// GET /mocks — List user's mock servers
mocksRouter.get('/', async (c) => {
    const userId = c.get('user').id
    const mocks = await db.mockServer.findMany({
        where: { userId, deletedAt: null },
        include: { spec: { select: { name: true } } },
        orderBy: { updatedAt: 'desc' },
    })
    return c.json({ data: mocks, error: null })
})

// POST /mocks — Provision new mock server
mocksRouter.post('/', async (c) => {
    const userId = c.get('user').id
    const user = c.get('user')
    const body = await c.req.json()
    const parsed = ProvisionSchema.safeParse(body)

    if (!parsed.success) {
        return c.json(
            { data: null, error: { code: 'VALIDATION_ERROR', message: parsed.error.message } },
            400,
        )
    }

    // PRO-only contour options
    if (parsed.data.contourOptions && (user.tier === 'FREE')) {
        const opts = parsed.data.contourOptions
        const usesProFeature =
            opts.stateful ||
            opts.delay ||
            (opts.errorRate !== undefined && opts.errorRate > 0)

        if (usesProFeature) {
            return c.json(
                {
                    data: null,
                    error: {
                        code: 'UPGRADE_REQUIRED',
                        message: 'Stateful mocks, delay simulation, and error rate require PRO tier.',
                        requiredTier: 'PRO',
                    },
                },
                403,
            )
        }
    }

    try {
        const result = await provisionMockServer({
            specVersionId: parsed.data.specVersionId,
            userId,
            tier: user.tier ?? 'FREE',
        })
        return c.json({ data: result, error: null }, 201)
    } catch (error) {
        const message = (error as Error).message
        const isLimitError = message.includes('limit reached')
        return c.json(
            { data: null, error: { code: isLimitError ? 'LIMIT_REACHED' : 'PROVISION_FAILED', message } },
            isLimitError ? 429 : 500,
        )
    }
})

// GET /mocks/:id — Get mock server details + live status
mocksRouter.get('/:id', async (c) => {
    const userId = c.get('user').id
    const mock = await db.mockServer.findFirst({
        where: { id: c.req.param('id'), userId, deletedAt: null },
        include: { spec: { select: { name: true } }, specVersion: { select: { version: true } } },
    })

    if (!mock) {
        return c.json({ data: null, error: { code: 'NOT_FOUND', message: 'Mock not found' } }, 404)
    }

    // Fetch live container status if running
    let containerStatus = null
    if (mock.dockerContainerId) {
        containerStatus = await getContainerStatus(mock.dockerContainerId)
    }

    // Update lastAccessedAt
    await db.mockServer.update({
        where: { id: mock.id },
        data: { lastAccessedAt: new Date() },
    })

    return c.json({ data: { ...mock, containerStatus }, error: null })
})

// POST /mocks/:id/start — Start a stopped server
mocksRouter.post('/:id/start', async (c) => {
    const userId = c.get('user').id
    const mock = await db.mockServer.findFirst({
        where: { id: c.req.param('id'), userId, status: 'STOPPED', deletedAt: null },
    })

    if (!mock?.dockerContainerId) {
        return c.json(
            { data: null, error: { code: 'NOT_FOUND', message: 'Stopped mock not found' } },
            404,
        )
    }

    try {
        const { docker } = await import('@mockline/docker-manager')
        const container = docker.getContainer(mock.dockerContainerId)
        await container.start()

        await db.mockServer.update({
            where: { id: mock.id },
            data: { status: 'RUNNING', lastAccessedAt: new Date() },
        })

        return c.json({ data: { status: 'RUNNING' }, error: null })
    } catch (error) {
        return c.json(
            { data: null, error: { code: 'START_FAILED', message: (error as Error).message } },
            500,
        )
    }
})

// POST /mocks/:id/stop — Stop a running server
mocksRouter.post('/:id/stop', async (c) => {
    const userId = c.get('user').id
    const mock = await db.mockServer.findFirst({
        where: { id: c.req.param('id'), userId, status: 'RUNNING', deletedAt: null },
    })

    if (!mock?.dockerContainerId) {
        return c.json(
            { data: null, error: { code: 'NOT_FOUND', message: 'Running mock not found' } },
            404,
        )
    }

    await stopContainer(mock.dockerContainerId)
    await db.mockServer.update({
        where: { id: mock.id },
        data: { status: 'STOPPED' },
    })

    return c.json({ data: { status: 'STOPPED' }, error: null })
})

// DELETE /mocks/:id — Stop + remove
mocksRouter.delete('/:id', async (c) => {
    const userId = c.get('user').id
    const mock = await db.mockServer.findFirst({
        where: { id: c.req.param('id'), userId, deletedAt: null },
    })

    if (!mock) {
        return c.json({ data: null, error: { code: 'NOT_FOUND', message: 'Mock not found' } }, 404)
    }

    if (mock.dockerContainerId) {
        try {
            await removeContainer(mock.dockerContainerId)
        } catch {
            // Container may already be gone
        }
    }

    await db.mockServer.update({
        where: { id: mock.id },
        data: { status: 'REMOVED', deletedAt: new Date() },
    })

    return c.json({ data: { deleted: true }, error: null })
})
