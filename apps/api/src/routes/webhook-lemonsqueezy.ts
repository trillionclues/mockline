import { Hono } from 'hono'
import { db } from '@mockline/db'
import crypto from 'node:crypto'
import { sendPaymentFailureEmail } from '../services/email'

export const webhookLemonSqueezyRouter = new Hono()

// POST / — handle Lemon Squeezy webhook events
// Public route — verified by HMAC signature, NOT auth middleware.
// Must receive raw body (text) before JSON parsing for signature check.
webhookLemonSqueezyRouter.post('/', async (c) => {
    const rawBody = await c.req.text()
    const signature = c.req.header('x-signature')

    if (!signature) {
        return c.json({ data: null, error: { code: 'MISSING_SIG', message: 'Missing signature' } }, 401)
    }

    // Verify webhook signature
    const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET
    if (!secret) {
        return c.json({ data: null, error: { code: 'CONFIG_ERROR', message: 'Webhook secret not configured' } }, 500)
    }

    // Constant-time signature comparison
    const digest = crypto.createHmac('sha256', secret).update(rawBody).digest('hex')

    if (
        signature.length !== digest.length ||
        !crypto.timingSafeEqual(Buffer.from(signature, 'utf8'), Buffer.from(digest, 'utf8'))
    ) {
        return c.json({ data: null, error: { code: 'BAD_SIG', message: 'Invalid signature' } }, 401)
    }

    // --- Parse payload ---
    const payload = JSON.parse(rawBody)
    const eventName: string = payload.meta?.event_name
    const userId: string | undefined = payload.meta?.custom_data?.user_id
    const attrs = payload.data?.attributes
    const subscriptionId = String(payload.data?.id)

    if (!userId) {
        return c.json({ data: null, error: { code: 'NO_USER', message: 'No userId in webhook custom data' } }, 400)
    }

    // Verify user exists and fetch email/name for potential notifications
    const dbUser = await db.user.findUnique({ where: { id: userId }, select: { id: true, email: true, name: true } })
    if (!dbUser) {
        return c.json({ data: null, error: { code: 'USER_NOT_FOUND', message: 'User not found' } }, 404)
    }

    console.log(`[webhook] ${eventName} for user ${userId}`)

    switch (eventName) {
        // New subscription or plan change
        case 'subscription_created':
        case 'subscription_updated': {
            const isActive = attrs.status === 'active' || attrs.status === 'past_due'
            await db.user.update({
                where: { id: userId },
                data: {
                    tier: isActive ? 'PRO' : 'FREE',
                    lemonSqueezyCustomerId: String(attrs.customer_id),
                    lemonSqueezySubscriptionId: subscriptionId,
                    subscriptionStatus: attrs.status,
                    subscriptionRenewsAt: attrs.renews_at ? new Date(attrs.renews_at) : null,
                    subscriptionEndsAt: attrs.ends_at ? new Date(attrs.ends_at) : null,
                },
            })
            break
        }

        // User cancelled — still active until period ends
        // Since they paid through the end of the billing period,
        // we just mark the status so the frontend can show "Your plan will end on [date]" instead of "Renews on".
        case 'subscription_cancelled': {
            await db.user.update({
                where: { id: userId },
                data: {
                    subscriptionStatus: 'cancelled',
                    subscriptionEndsAt: attrs.ends_at ? new Date(attrs.ends_at) : null,
                },
            })
            break
        }

        // Subscription actually ended — hard downgrade
        case 'subscription_expired': {
            await db.user.update({
                where: { id: userId },
                data: {
                    tier: 'FREE',
                    subscriptionStatus: 'expired',
                    subscriptionEndsAt: attrs.ends_at ? new Date(attrs.ends_at) : null,
                },
            })
            try {
                const { handleDowngrade } = await import('../services/downgrade')
                await handleDowngrade(userId)
            } catch (err) {
                console.error('[webhook] Downgrade handler failed:', err)
            }
            break
        }

        // Renewal succeeded — keep tier active
        case 'subscription_payment_success': {
            await db.user.update({
                where: { id: userId },
                data: {
                    subscriptionStatus: 'active',
                    subscriptionRenewsAt: attrs.renews_at ? new Date(attrs.renews_at) : null,
                },
            })
            break
        }

        // Payment failed — don't downgrade yet (LS retries)
        // Mark as past_due so frontend can show a warning banner.
        case 'subscription_payment_failed': {
            await db.user.update({
                where: { id: userId },
                data: { subscriptionStatus: 'past_due' },
            })
            // Send payment failure notification email
            await sendPaymentFailureEmail(dbUser.email, dbUser.name)
            break
        }

        // Payment recovered after failure — restore active
        case 'subscription_payment_recovered': {
            await db.user.update({
                where: { id: userId },
                data: {
                    subscriptionStatus: 'active',
                    subscriptionRenewsAt: attrs.renews_at ? new Date(attrs.renews_at) : null,
                },
            })
            break
        }

        default:
            console.log('[webhook] Unhandled event:', eventName)
    }

    return c.json({ received: true })
})
