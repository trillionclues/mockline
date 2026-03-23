import { Hono } from 'hono'
import { verifyHmacSignature } from '../lib/webhook-utils'
import { handleSubscriptionEvent } from '../services/webhook-handler'
import { WebhookEvent } from '@/types/webhook'

export const webhookLemonSqueezyRouter = new Hono()

// handle Lemon Squeezy webhook events
webhookLemonSqueezyRouter.post('/', async (c) => {
    const rawBody = await c.req.text()
    const signature = c.req.header('x-signature')

    if (!signature) {
        return c.json({ data: null, error: { code: 'MISSING_SIG', message: 'Missing signature' } }, 401)
    }

    const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET
    if (!secret) {
        return c.json({ data: null, error: { code: 'CONFIG_ERROR', message: 'Webhook secret not configured' } }, 500)
    }

    // Verify signature
    if (!verifyHmacSignature(rawBody, signature, secret)) {
        return c.json({ data: null, error: { code: 'BAD_SIG', message: 'Invalid signature' } }, 401)
    }

    // Parse and normalize Lemon Squeezy payload
    const payload = JSON.parse(rawBody)
    const eventName: string = payload.meta?.event_name
    const userId: string | undefined = payload.meta?.custom_data?.user_id
    const attrs = payload.data?.attributes

    if (!userId) {
        return c.json({ data: null, error: { code: 'NO_USER', message: 'No userId in webhook custom data' } }, 400)
    }

    const event: WebhookEvent = {
        event: eventName as WebhookEvent['event'],
        userId,
        subscriptionId: String(payload.data?.id),
        customerId: String(attrs?.customer_id),
        status: attrs?.status ?? '',
        renewsAt: attrs?.renews_at ?? null,
        endsAt: attrs?.ends_at ?? null,
    }

    // Delegate to provider-agnostic handler
    const result = await handleSubscriptionEvent(event)

    if (!result.success && result.error) {
        return c.json(
            { data: null, error: { code: result.error.code, message: result.error.message } },
            result.error.status as 404 | 400 | 500,
        )
    }

    return c.json({ received: true })
})
