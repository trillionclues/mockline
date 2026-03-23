import { Hono } from 'hono'
import { requireAuth } from '../middleware/auth'
import {
    createCheckout,
    cancelSubscription,
} from '@lemonsqueezy/lemonsqueezy.js'
import { findUserSubscription } from '../repositories/subscription.repository'
import type { AppEnv } from '../types/env'

export const billingRouter = new Hono<AppEnv>()

// POST /billing/checkout
// Creates a Lemon Squeezy checkout session and returns the URL.
billingRouter.post('/checkout', requireAuth, async (c) => {
    const user = c.get('user')
    const { variantId = 'pro', yearly = false } = await c.req.json<{ variantId: string; yearly: boolean }>()

    const planType = variantId.toUpperCase() // PRO | TEAM
    const cycle = yearly ? 'YEARLY' : 'MONTHLY'
    const variant = process.env[`LEMONSQUEEZY_${planType}_${cycle}_VARIANT_ID`]
    // e.g. LEMONSQUEEZY_PRO_YEARLY_VARIANT_ID or LEMONSQUEEZY_TEAM_MONTHLY_VARIANT_ID

    if (!variant || !process.env.LEMONSQUEEZY_STORE_ID) {
        return c.json(
            { data: null, error: { code: 'CONFIG_ERROR', message: `Billing not configured for ${planType} ${cycle}` } },
            500,
        )
    }

    const checkout = await createCheckout(
        process.env.LEMONSQUEEZY_STORE_ID,
        variant,
        {
            checkoutOptions: { embed: false },
            checkoutData: {
                email: user.email,
                custom: { user_id: user.id },
            },
            productOptions: {
                redirectUrl: `${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/overview?upgraded=true`,
                receiptButtonText: 'Go to dashboard',
            },
        },
    )

    if (checkout.error) {
        return c.json(
            { data: null, error: { code: 'CHECKOUT_FAILED', message: checkout.error.message } },
            500,
        )
    }

    return c.json({ data: { checkoutUrl: checkout.data?.data.attributes.url }, error: null })
})

// cancel user's active sub
billingRouter.post('/cancel', requireAuth, async (c) => {
    const user = c.get('user')
    const dbUser = await findUserSubscription(user.id)

    if (!dbUser?.lemonSqueezySubscriptionId) {
        return c.json(
            { data: null, error: { code: 'NO_SUBSCRIPTION', message: 'No active subscription found' } },
            400,
        )
    }

    const result = await cancelSubscription(dbUser.lemonSqueezySubscriptionId)

    if (result.error) {
        return c.json(
            { data: null, error: { code: 'CANCEL_FAILED', message: result.error.message } },
            500,
        )
    }

    return c.json({ data: { cancelled: true }, error: null })
})
