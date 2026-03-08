import { Hono } from 'hono'

export const specsRouter = new Hono()

// GET /specs — List user's specs
specsRouter.get('/', async (c) => {
    // TODO: Implement — query DB for user's specs
    return c.json({ data: [], error: null })
})

// POST /specs — Upload new spec
specsRouter.post('/', async (c) => {
    // TODO: Implement — validate + save spec
    return c.json({ data: null, error: { code: 'NOT_IMPLEMENTED', message: 'Not implemented' } }, 501)
})

// GET /specs/:id — Get spec + versions
specsRouter.get('/:id', async (c) => {
    const _id = c.req.param('id')
    // TODO: Implement
    return c.json({ data: null, error: { code: 'NOT_IMPLEMENTED', message: 'Not implemented' } }, 501)
})

// DELETE /specs/:id — Soft delete spec
specsRouter.delete('/:id', async (c) => {
    const _id = c.req.param('id')
    // TODO: Implement
    return c.json({ data: null, error: { code: 'NOT_IMPLEMENTED', message: 'Not implemented' } }, 501)
})

// GET /specs/:id/versions — Version history
specsRouter.get('/:id/versions', async (c) => {
    const _id = c.req.param('id')
    // TODO: Implement
    return c.json({ data: [], error: null })
})

// POST /specs/:id/versions — Upload new version
specsRouter.post('/:id/versions', async (c) => {
    const _id = c.req.param('id')
    // TODO: Implement
    return c.json({ data: null, error: { code: 'NOT_IMPLEMENTED', message: 'Not implemented' } }, 501)
})

// GET /specs/:id/versions/:v1/diff/:v2 — Diff two versions
specsRouter.get('/:id/versions/:v1/diff/:v2', async (c) => {
    const _id = c.req.param('id')
    const _v1 = c.req.param('v1')
    const _v2 = c.req.param('v2')
    // TODO: Implement
    return c.json({ data: null, error: { code: 'NOT_IMPLEMENTED', message: 'Not implemented' } }, 501)
})
