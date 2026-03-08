import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { serve } from '@hono/node-server'
import { specsRouter } from './routes/specs'
import { mocksRouter } from './routes/mocks'
import { contractsRouter } from './routes/contracts'

const app = new Hono()

// --- Middleware ---
app.use('*', logger())
app.use(
    '*',
    cors({
        origin: process.env.CORS_ORIGIN ?? 'http://localhost:3000',
        credentials: true,
    }),
)

app.get('/health', (c) => c.json({ status: 'ok', timestamp: new Date().toISOString() }))

app.route('/specs', specsRouter)
app.route('/mocks', mocksRouter)
app.route('/contracts', contractsRouter)

const port = parseInt(process.env.PORT ?? '4000', 10)

console.log(`Mockline API starting on port ${port}`)

serve({ fetch: app.fetch, port }, (info) => {
    console.log(`Mockline API running at http://localhost:${info.port}`)
})

export default app
