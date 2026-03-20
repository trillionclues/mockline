import { Hono } from 'hono'
import { z } from 'zod'
import { db, Prisma } from '@mockline/db'
import { validateSpec } from '@mockline/spec-parser'
import { runContractTest } from '../services/contract-runner'
import { requireTier } from '../middleware/tier-guard'
import type { AppEnv } from '../types/env'

export const contractsRouter = new Hono<AppEnv>()

// Gate all contract routes to PRO+
contractsRouter.use('*', requireTier('PRO'))

// Transform Prisma contractTestRun record into shape the frontend expects
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function transformRun(run: any) {
    const summary = (run.summary ?? {}) as Record<string, number>
    const rawResults = (run.results ?? []) as Array<Record<string, unknown>>

    const results = rawResults.map((r) => ({
        method: r.method as string,
        path: r.path as string,
        match: r.status === 'pass',
        expectedStatus: 200,
        receivedStatus: r.status === 'pass' ? 200 : 0,
        detail: (r.message as string) ?? undefined,
    }))

    const totalDuration = rawResults.reduce((sum, r) => sum + (Number(r.responseTime) || 0), 0)

    return {
        id: run.id,
        specId: run.specId,
        baseUrl: run.baseUrl,
        totalEndpoints: summary.total ?? results.length,
        passed: summary.passed ?? results.filter((r) => r.match).length,
        failed: (summary.failed ?? 0) + (summary.errors ?? 0),
        duration: totalDuration,
        status: run.status === 'completed'
            ? ((summary.failed ?? 0) > 0 || (summary.errors ?? 0) > 0 ? 'FAILED' : 'PASSED')
            : run.status === 'failed' ? 'FAILED' : 'RUNNING',
        results,
        createdAt: run.createdAt,
    }
}

const RunContractSchema = z.object({
    specId: z.string().min(1),
    baseUrl: z.string().url(),
})

// POST /contracts — Run contract test
contractsRouter.post('/', async (c) => {
    const userId = c.get('user').id
    const body = await c.req.json()
    const parsed = RunContractSchema.safeParse(body)

    if (!parsed.success) {
        return c.json(
            { data: null, error: { code: 'VALIDATION_ERROR', message: parsed.error.message } },
            400,
        )
    }

    const { specId, baseUrl } = parsed.data

    // Get latest spec version
    const spec = await db.spec.findFirst({
        where: { id: specId, userId, deletedAt: null },
        include: { versions: { orderBy: { version: 'desc' }, take: 1 } },
    })

    if (!spec || spec.versions.length === 0) {
        return c.json({ data: null, error: { code: 'NOT_FOUND', message: 'Spec not found' } }, 404)
    }

    const latestVersion = spec.versions[0]!
    const format = latestVersion.format === 'YAML' ? 'yaml' : 'json'
    const validation = await validateSpec(latestVersion.content, format as 'yaml' | 'json')

    if (!validation.valid) {
        return c.json(
            { data: null, error: { code: 'SPEC_INVALID', message: 'Spec failed validation' } },
            400,
        )
    }

    // Create test run record
    const testRun = await db.contractTestRun.create({
        data: {
            specId,
            userId,
            baseUrl,
            results: [],
            summary: { total: 0, passed: 0, failed: 0 },
            status: 'running',
        },
    })

    // Run tests
    try {
        const results = await runContractTest({
            endpoints: validation.endpoints,
            baseUrl,
        })

        await db.contractTestRun.update({
            where: { id: testRun.id },
            data: {
                results: results.endpoints as unknown as Prisma.InputJsonValue,
                summary: {
                    total: results.total,
                    passed: results.passed,
                    failed: results.failed,
                    errors: results.errors,
                },
                status: 'completed',
            },
        })

        return c.json({ data: { id: testRun.id, ...results }, error: null }, 201)
    } catch (error) {
        await db.contractTestRun.update({
            where: { id: testRun.id },
            data: { status: 'failed' },
        })

        return c.json(
            { data: null, error: { code: 'TEST_FAILED', message: (error as Error).message } },
            500,
        )
    }
})

// GET /contracts/:id — Get test run results
contractsRouter.get('/:id', async (c) => {
    const userId = c.get('user').id
    const testRun = await db.contractTestRun.findFirst({
        where: { id: c.req.param('id'), userId },
    })

    if (!testRun) {
        return c.json(
            { data: null, error: { code: 'NOT_FOUND', message: 'Test run not found' } },
            404,
        )
    }

    return c.json({ data: transformRun(testRun), error: null })
})

// GET /contracts — List test runs for a spec
contractsRouter.get('/', async (c) => {
    const userId = c.get('user').id
    const specId = c.req.query('specId')

    const testRuns = await db.contractTestRun.findMany({
        where: {
            userId,
            ...(specId ? { specId } : {}),
        },
        orderBy: { createdAt: 'desc' },
        take: 20,
    })

    return c.json({ data: testRuns.map(transformRun), error: null })
})
