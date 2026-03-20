import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { serve } from '@hono/node-server'
import { auth } from './lib/auth'
import { requireAuth } from './middleware/auth'
import { rateLimit } from './middleware/rate-limit'
import { specsRouter } from './routes/specs'
import { mocksRouter } from './routes/mocks'
import { contractsRouter } from './routes/contracts'
import { userRouter } from './routes/user'
import { startAutoStopScheduler } from './services/auto-stop'
import { ensureContourBaseImage } from '@mockline/docker-manager/src/base-image'
import { billingRouter } from './routes/billing'
import { webhookLemonSqueezyRouter } from './routes/webhook-lemonsqueezy'
import { initLemonSqueezy } from './lib/lemonsqueezy'

const app = new Hono()

// Initialize billing integration
initLemonSqueezy()

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

// Webhook route — public, verified by HMAC (must be before auth middleware)
app.route('/webhooks/lemonsqueezy', webhookLemonSqueezyRouter)

// Protected routes — auth + general rate limit
app.use('/specs/*', requireAuth, rateLimit('GENERAL'))
app.use('/mocks/*', requireAuth, rateLimit('GENERAL'))
app.use('/contracts/*', requireAuth, rateLimit('GENERAL'))

app.route('/specs', specsRouter)
app.route('/mocks', mocksRouter)
app.route('/contracts', contractsRouter)

// User account routes
app.use('/user/*', requireAuth)
app.route('/user', userRouter)

// Billing routes — protected
app.use('/billing/*', requireAuth)
app.route('/billing', billingRouter)

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
