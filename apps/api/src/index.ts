import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { serve } from '@hono/node-server'
import { auth } from './lib/auth'
import { requireAuth } from './middleware/auth'
import { specsRouter } from './routes/specs'
import { mocksRouter } from './routes/mocks'
import { contractsRouter } from './routes/contracts'
import { startAutoStopScheduler } from './services/auto-stop'
import { ensureContourBaseImage } from '@mockline/docker-manager/src/base-image'

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
    startAutoStopScheduler()

    // Build base image in background — first provision will be fast
    const contourVersion = process.env.CONTOUR_VERSION ?? '1.2.0'
    ensureContourBaseImage(contourVersion).catch(err =>
        console.error('[base-image] Failed to build base image:', err)
    )
})

export default app
