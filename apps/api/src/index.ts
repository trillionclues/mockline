import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { serve } from '@hono/node-server'
import { auth } from './lib/auth'
import { requireAuth } from './middleware/auth'
import { specsRouter } from './routes/specs'
import { mocksRouter } from './routes/mocks'
import { contractsRouter } from './routes/contracts'

const app = new Hono()

// Global middleware
app.use('*', logger())
app.use(
    '*',
    cors({
        origin: process.env.CORS_ORIGIN ?? 'http://localhost:3000',
        credentials: true,
    }),
)

app.get('/health', (c) => c.json({ status: 'ok', timestamp: new Date().toISOString() }))

// BetterAuth handler
// (no auth middleware — handles login/callback itself)
app.on(['POST', 'GET'], '/api/auth/**', (c) => auth.handler(c.req.raw))

// Protected routes
app.use('/specs/*', requireAuth)
app.use('/mocks/*', requireAuth)
app.use('/contracts/*', requireAuth)

app.route('/specs', specsRouter)
app.route('/mocks', mocksRouter)
app.route('/contracts', contractsRouter)

const port = parseInt(process.env.PORT ?? '4000', 10)

console.log(`Mockline API starting on port ${port}`)

serve({ fetch: app.fetch, port }, (info) => {
    console.log(`Mockline API running at http://localhost:${info.port}`)
})

export default app
