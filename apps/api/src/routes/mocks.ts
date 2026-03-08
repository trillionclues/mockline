import { Hono } from 'hono'

export const mocksRouter = new Hono()

// GET /mocks — List user's mock servers
mocksRouter.get('/', async (c) => {
    // TODO: Implement
    return c.json({ data: [], error: null })
})

// POST /mocks — Provision new mock server
mocksRouter.post('/', async (c) => {
    // TODO: Implement — build Docker image + start container
    return c.json({ data: null, error: { code: 'NOT_IMPLEMENTED', message: 'Not implemented' } }, 501)
})

// GET /mocks/:id — Get mock server details + status
mocksRouter.get('/:id', async (c) => {
    const _id = c.req.param('id')
    // TODO: Implement
    return c.json({ data: null, error: { code: 'NOT_IMPLEMENTED', message: 'Not implemented' } }, 501)
})

// POST /mocks/:id/start — Start a stopped server
mocksRouter.post('/:id/start', async (c) => {
    const _id = c.req.param('id')
    // TODO: Implement
    return c.json({ data: null, error: { code: 'NOT_IMPLEMENTED', message: 'Not implemented' } }, 501)
})

// POST /mocks/:id/stop — Stop a running server
mocksRouter.post('/:id/stop', async (c) => {
    const _id = c.req.param('id')
    // TODO: Implement
    return c.json({ data: null, error: { code: 'NOT_IMPLEMENTED', message: 'Not implemented' } }, 501)
})

// DELETE /mocks/:id — Stop + remove
mocksRouter.delete('/:id', async (c) => {
    const _id = c.req.param('id')
    // TODO: Implement
    return c.json({ data: null, error: { code: 'NOT_IMPLEMENTED', message: 'Not implemented' } }, 501)
})
