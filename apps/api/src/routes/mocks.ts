import { Hono } from 'hono'
import { z } from 'zod'
import { stopContainer, removeContainer, getContainerStatus } from '@mockline/docker-manager'
import { provisionMockServer } from '../services/mock-provisioner'
import {
    listMocks,
    findMock,
    findMockByStatus,
    findMockBasic,
    updateMockStatus,
    touchLastAccessed,
} from '../repositories/mock.repository'
import type { AppEnv } from '../types/env'
import { rateLimit } from '../middleware/rate-limit'

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

// list user's mock servers
mocksRouter.get('/', async (c) => {
    const userId = c.get('user').id
    const mocks = await listMocks(userId)
    return c.json({ data: mocks, error: null })
})

// provision new mock server
mocksRouter.post('/', rateLimit('PROVISION'), async (c) => {
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
            contourOptions: parsed.data.contourOptions ? {
                isStateful: parsed.data.contourOptions.stateful,
                isDeterministic: parsed.data.contourOptions.deterministic,
                delay: parsed.data.contourOptions.delay,
                errorRate: parsed.data.contourOptions.errorRate,
                requireAuth: parsed.data.contourOptions.requireAuth,
            } : undefined,
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

// get mock server details + live status
mocksRouter.get('/:id', async (c) => {
    const userId = c.get('user').id
    const mock = await findMock(c.req.param('id'), userId)

    if (!mock) {
        return c.json({ data: null, error: { code: 'NOT_FOUND', message: 'Mock not found' } }, 404)
    }

    // fetch container status if running
    let containerStatus = null
    if (mock.dockerContainerId) {
        containerStatus = await getContainerStatus(mock.dockerContainerId)
    }

    // Update lastAccessedAt
    await touchLastAccessed(mock.id)

    return c.json({ data: { ...mock, containerStatus }, error: null })
})

// start a stopped server
mocksRouter.post('/:id/start', async (c) => {
    const userId = c.get('user').id
    const mock = await findMockByStatus(c.req.param('id'), userId, 'STOPPED')

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

        await updateMockStatus(mock.id, 'RUNNING', { lastAccessedAt: new Date() })

        return c.json({ data: { status: 'RUNNING' }, error: null })
    } catch (error) {
        return c.json(
            { data: null, error: { code: 'START_FAILED', message: (error as Error).message } },
            500,
        )
    }
})

// stop a running server
mocksRouter.post('/:id/stop', async (c) => {
    const userId = c.get('user').id
    const mock = await findMockByStatus(c.req.param('id'), userId, 'RUNNING')

    if (!mock?.dockerContainerId) {
        return c.json(
            { data: null, error: { code: 'NOT_FOUND', message: 'Running mock not found' } },
            404,
        )
    }

    await stopContainer(mock.dockerContainerId)
    await updateMockStatus(mock.id, 'STOPPED')

    return c.json({ data: { status: 'STOPPED' }, error: null })
})

// stop and remove mock
mocksRouter.delete('/:id', async (c) => {
    const userId = c.get('user').id
    const mock = await findMockBasic(c.req.param('id'), userId)

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

    await updateMockStatus(mock.id, 'REMOVED', { deletedAt: new Date() })

    return c.json({ data: { deleted: true }, error: null })
})
