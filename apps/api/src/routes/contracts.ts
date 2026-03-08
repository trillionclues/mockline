import { Hono } from 'hono'

export const contractsRouter = new Hono()

// POST /contracts — Run contract test
contractsRouter.post('/', async (c) => {
    // TODO: Implement — spec + baseUrl → hit endpoints → compare to schema
    return c.json({ data: null, error: { code: 'NOT_IMPLEMENTED', message: 'Not implemented' } }, 501)
})

// GET /contracts/:id — Get test run results
contractsRouter.get('/:id', async (c) => {
    const _id = c.req.param('id')
    // TODO: Implement
    return c.json({ data: null, error: { code: 'NOT_IMPLEMENTED', message: 'Not implemented' } }, 501)
})

// GET /contracts?specId=... — List test runs for a spec
contractsRouter.get('/', async (c) => {
    const _specId = c.req.query('specId')
    // TODO: Implement
    return c.json({ data: [], error: null })
})
