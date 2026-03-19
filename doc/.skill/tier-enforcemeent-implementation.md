# Mockline — Tier Enforcement & Payments Implementation Guide

> Implementation order matters. Each phase builds on the one before it.
> Complete each phase fully before moving to the next.

---

## Table of Contents

1. [Phase 1 — Delete User Cleanup](#phase-1--delete-user-cleanup)
2. [Phase 2 — Spec Upload Limit Enforcement](#phase-2--spec-upload-limit-enforcement)
3. [Phase 3 — Feature Paywalls on API](#phase-3--feature-paywalls-on-api)
4. [Phase 4 — Frontend Paywall Layer](#phase-4--frontend-paywall-layer)
5. [Phase 5 — Rate Limiting by Tier](#phase-5--rate-limiting-by-tier)
6. [Phase 6 — Lemon Squeezy Integration](#phase-6--lemon-squeezy-integration)
7. [Phase 7 — Downgrade Handling](#phase-7--downgrade-handling)
8. [Phase 8 — PRO Feature Controls in UI](#phase-8--pro-feature-controls-in-ui)

---

## Existing Context

### Tier limits (already in `packages/types/src/index.ts`)

```typescript
export const CONTAINER_LIMITS = {
    FREE: 1,
    PRO: 5,
    TEAM: 20,
} as const

export const AUTO_STOP_MINUTES = {
    FREE: 60,
    PRO: 24 * 60,
    TEAM: 7 * 24 * 60,
} as const
```

### Schema facts

- `User.tier` is a Prisma enum: `FREE | PRO | TEAM`
- `Spec`, `MockServer`, `Session`, `Account` all have `onDelete: Cascade` on their `User` relation
- `MockServer` has `deletedAt` for soft delete
- `ContractTestRun` has `userId` and `specId`

### Contour CLI flags already supported

```
--stateful        in-memory CRUD persistence
--deterministic   reproducible data for E2E tests
--delay 200-500   simulate network latency
--error-rate 10   random 500 failures
```

---

## Phase 1 — Delete User Cleanup

### Problem

BetterAuth's `deleteUser()` cascades DB records but does NOT stop running Docker containers.
A deleted user's containers keep running orphaned, consuming port space and memory.
The user must also be able to sign up again with the same GitHub account after deleting their account.

### What to implement

**`apps/api/src/services/user-cleanup.ts`** — create this file:

```typescript
import { db } from '@mockline/db'
import { removeContainer } from '@mockline/docker-manager'

export async function cleanupUserResources(userId: string): Promise<void> {
    // Find all non-removed mock servers for this user
    const mocks = await db.mockServer.findMany({
        where: {
            userId,
            deletedAt: null,
            status: { not: 'REMOVED' },
        },
        select: { id: true, dockerContainerId: true, status: true },
    })

    // Stop and remove all containers in parallel
    await Promise.allSettled(
        mocks.map(async (mock) => {
            if (mock.dockerContainerId) {
                try {
                    await removeContainer(mock.dockerContainerId)
                } catch {
                    // Container may already be stopped or gone — continue
                }
            }
            await db.mockServer.update({
                where: { id: mock.id },
                data: { status: 'REMOVED', deletedAt: new Date() },
            })
        })
    )
}
```

**`apps/api/src/routes/user.ts`** — create this file:

```typescript
import { Hono } from 'hono'
import { db } from '@mockline/db'
import { auth } from '../lib/auth'
import { requireAuth } from '../middleware/auth'
import { cleanupUserResources } from '../services/user-cleanup'
import type { AppEnv } from '../types/env'

export const userRouter = new Hono<AppEnv>()

// DELETE /user/me — delete own account
userRouter.delete('/me', requireAuth, async (c) => {
    const userId = c.get('user').id

    try {
        // 1. Stop and remove all Docker containers first
        await cleanupUserResources(userId)

        // 2. Delete the user — Prisma cascade handles:
        //    specs, mock_servers, sessions, accounts, spec_versions
        await db.user.delete({ where: { id: userId } })

        // 3. Invalidate session cookie
        return c.json({ data: { deleted: true }, error: null })
    } catch (error) {
        return c.json(
            { data: null, error: { code: 'DELETE_FAILED', message: (error as Error).message } },
            500,
        )
    }
})
```

**`apps/api/src/index.ts`** — register the new router:

```typescript
import { userRouter } from './routes/user'

app.use('/user/*', requireAuth)
app.route('/user', userRouter)
```

**`apps/web/src/components/settings/SettingsView.tsx`** — update the delete handler:

The existing `ConfirmDialog` calls `authClient.deleteUser()` which is BetterAuth's
client-side method. Replace it with a direct call to your new API endpoint instead,
since you need the server to clean up Docker containers first: We use react query in the app not fetch api

```typescript
onConfirm={async () => {
    // Call your cleanup endpoint first
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/user/me`, {
        method: 'DELETE',
        credentials: 'include',
    })
    // Then sign out and redirect
    await authClient.signOut()
    router.push('/')
}}
```

### Re-signup after deletion

Because `Account.onDelete: Cascade` removes the GitHub OAuth link when the user is deleted,
the same GitHub account can sign up again fresh. BetterAuth will create a new `User` and
`Account` record on next OAuth login. No additional work needed.

---

## Phase 2 — Spec Upload Limit Enforcement

### Limits

| Tier | Specs allowed |
|------|--------------|
| FREE | 1 |
| PRO  | Unlimited |
| TEAM | Unlimited |

### Add to `packages/types/src/index.ts`

```typescript
export const SPEC_LIMITS = {
    FREE: 1,
    PRO: Infinity,
    TEAM: Infinity,
} as const satisfies Record<Tier, number>
```

### Update `apps/api/src/routes/specs.ts` — POST /specs

Add the check before `createSpec()`:

```typescript
specsRouter.post('/', async (c) => {
    const userId = c.get('user').id
    const user = c.get('user')
    const body = await c.req.json()
    const parsed = CreateSpecSchema.safeParse(body)

    if (!parsed.success) {
        return c.json(
            { data: null, error: { code: 'VALIDATION_ERROR', message: parsed.error.message } },
            400,
        )
    }

    // Enforce spec limit by tier
    const specLimit = SPEC_LIMITS[user.tier ?? 'FREE']
    if (specLimit !== Infinity) {
        const existingCount = await db.spec.count({
            where: { userId, deletedAt: null },
        })
        if (existingCount >= specLimit) {
            return c.json(
                {
                    data: null,
                    error: {
                        code: 'UPGRADE_REQUIRED',
                        message: `Spec limit reached (${specLimit} for ${user.tier} tier). Upgrade to Pro for unlimited specs.`,
                        requiredTier: 'PRO',
                    },
                },
                403,
            )
        }
    }

    try {
        const result = await createSpec({ ...parsed.data, userId })
        return c.json({ data: result, error: null }, 201)
    } catch (error) {
        return c.json(
            { data: null, error: { code: 'SPEC_INVALID', message: (error as Error).message } },
            400,
        )
    }
})
```

---

## Phase 3 — Feature Paywalls on API

### Features gated to PRO and TEAM only

| Feature | FREE | PRO | TEAM |
|---------|------|-----|------|
| Contract testing | ✗ | ✓ | ✓ |
| Schema diff | ✗ | ✓ | ✓ |
| Stateful mocks(normal mocks for free) | ✗ | ✓ | ✓ |
| Error rate / delay config | ✗ | ✓ | ✓ |
| API Explorer | ✓ | ✓ | ✓ |

### Create `apps/api/src/middleware/tier-guard.ts`

```typescript
import type { Context, Next } from 'hono'
import type { Tier } from '@mockline/types'
import type { AppEnv } from '../types/env'

export function requireTier(minimumTier: 'PRO' | 'TEAM') {
    const tierRank: Record<Tier, number> = { FREE: 0, PRO: 1, TEAM: 2 }
    const required = tierRank[minimumTier]

    return async (c: Context<AppEnv>, next: Next): Promise<Response | void> => {
        const user = c.get('user')
        const userTier = user?.tier ?? 'FREE'
        const userRank = tierRank[userTier as Tier] ?? 0

        if (userRank < required) {
            return c.json(
                {
                    data: null,
                    error: {
                        code: 'UPGRADE_REQUIRED',
                        message: `This feature requires ${minimumTier} tier or above.`,
                        requiredTier: minimumTier,
                        currentTier: userTier,
                    },
                },
                403,
            )
        }

        await next()
    }
}
```

### Update `apps/api/src/routes/contracts.ts` — gate entire router

```typescript
import { requireTier } from '../middleware/tier-guard'

// Apply to all contract routes
contractsRouter.use('*', requireTier('PRO'))
```

### Update `apps/api/src/routes/specs.ts` — gate schema diff endpoint

```typescript
import { requireTier } from '../middleware/tier-guard'

// Gate diff endpoint to PRO+
specsRouter.get('/:id/versions/:v1/diff/:v2', requireTier('PRO'), async (c) => {
    // ... existing diff logic unchanged
})
```

### Update `apps/api/src/routes/mocks.ts` — gate PRO provision options

In `POST /mocks`, validate that FREE users cannot pass `contourOptions`:(On the client side, dont know if we need additional buttons to select the options when its pro or team and disable when its free)

```typescript
mocksRouter.post('/', async (c) => {
    const user = c.get('user')
    const userId = user.id
    const body = await c.req.json()
    const parsed = ProvisionSchema.safeParse(body)

    if (!parsed.success) {
        return c.json(
            { data: null, error: { code: 'VALIDATION_ERROR', message: parsed.error.message } },
            400,
        )
    }

    // PRO-only contour options
    if (parsed.data.contourOptions && (user.tier === 'FREE')) {
        const opts = parsed.data.contourOptions
        const usesProFeature =
            opts.stateful ||
            opts.delay ||
            (opts.errorRate !== undefined && opts.errorRate > 0)

        if (usesProFeature) {
            return c.json(
                {
                    data: null,
                    error: {
                        code: 'UPGRADE_REQUIRED',
                        message: 'Stateful mocks, delay simulation, and error rate require PRO tier.',
                        requiredTier: 'PRO',
                    },
                },
                403,
            )
        }
    }

    // ... rest of existing provision logic unchanged
})
```

---

## Phase 4 — Frontend Paywall Layer

### Create `apps/web/src/hooks/useTierGuard.ts`

```typescript
import { useSession } from '@/lib/auth-client'
import { useUpgradeModal } from '@/contexts/upgrade-modal'
import type { Tier } from '@/types'

const TIER_RANK: Record<string, number> = { FREE: 0, PRO: 1, TEAM: 2 }

export function useTierGuard() {
    const { data: session } = useSession()
    const { open: openUpgrade } = useUpgradeModal()

    const userTier = (session?.user?.tier ?? 'FREE') as Tier
    const userRank = TIER_RANK[userTier] ?? 0

    const canAccess = (requiredTier: 'PRO' | 'TEAM'): boolean => {
        return userRank >= TIER_RANK[requiredTier]
    }

    // Call this instead of directly invoking an action
    // If tier insufficient → opens upgrade modal and returns false
    // If tier sufficient → returns true, caller proceeds
    const guardAction = (requiredTier: 'PRO' | 'TEAM'): boolean => {
        if (!canAccess(requiredTier)) {
            openUpgrade()
            return false
        }
        return true
    }

    return { userTier, canAccess, guardAction }
}
```

### Create `apps/web/src/components/shared/TierBadge.tsx`

Used to show lock icon + "PRO" badge on gated features:

```tsx
import { Lock } from 'lucide-react'

type Props = {
    tier: 'PRO' | 'TEAM'
}

export function TierBadge({ tier }: Props) {
    return (
        <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '3px',
            fontSize: '9px',
            fontWeight: 700,
            padding: '1px 5px',
            borderRadius: '3px',
            background: 'var(--color-primary-muted)',
            color: 'var(--color-primary)',
            border: '1px solid var(--color-border-highlight)',
            letterSpacing: '0.04em',
            flexShrink: 0,
        }}>
            <Lock size={8} />
            {tier}
        </span>
    )
}
```

### Update `apps/web/src/components/contracts/ContractsView.tsx`

```tsx
import { useTierGuard } from '@/hooks/useTierGuard'
import { TierBadge } from '@/components/shared/TierBadge'

export function ContractsView({ initialRuns, specs, mocks }: Props) {
    const { canAccess, guardAction } = useTierGuard()
    const hasAccess = canAccess('PRO')
    // ... existing state

    return (
        <div>
            <PageHeader
                title="Contracts"
                description="Run contract tests to validate mock servers against OpenAPI specs."
                action={{
                    label: 'Run Tests',
                    onClick: () => {
                        if (!guardAction('PRO')) return
                        setRunOpen(true)
                    },
                    // Pass badge to PageHeader so it renders inline with button
                    badge: !hasAccess ? <TierBadge tier="PRO" /> : undefined,
                }}
            />

            {!hasAccess ? (
                // Show locked empty state instead of real content
                <LockedFeatureState
                    title="Contract testing is a PRO feature"
                    description="Validate your mock servers against their OpenAPI specifications automatically."
                    tier="PRO"
                />
            ) : runs.length === 0 ? (
                <EmptyState ... />
            ) : (
                <ContractResultsTable runs={runs} />
            )}
        </div>
    )
}
```

### Create `apps/web/src/components/shared/LockedFeatureState.tsx`

```tsx
import { Lock } from 'lucide-react'
import { useUpgradeModal } from '@/contexts/upgrade-modal'

type Props = {
    title: string
    description: string
    tier: 'PRO' | 'TEAM'
}

export function LockedFeatureState({ title, description, tier }: Props) {
    const { open } = useUpgradeModal()

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '48px 24px',
            background: 'var(--color-surface)',
            border: '1px dashed var(--color-border)',
            borderRadius: '8px',
            textAlign: 'center',
        }}>
            <div style={{
                width: '44px',
                height: '44px',
                borderRadius: '8px',
                background: 'var(--color-primary-muted)',
                border: '1px solid var(--color-border-highlight)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '16px',
            }}>
                <Lock size={20} color="var(--color-primary)" />
            </div>

            <h3 style={{
                fontSize: '15px',
                fontWeight: 600,
                color: 'var(--color-text-strong)',
                marginBottom: '8px',
            }}>
                {title}
            </h3>

            <p style={{
                fontSize: '13px',
                color: 'var(--color-text-muted)',
                maxWidth: '320px',
                marginBottom: '20px',
                lineHeight: 1.5,
            }}>
                {description}
            </p>

            <button onClick={open} className="btn-primary" style={{ height: '36px', padding: '0 20px' }}>
                Upgrade to {tier}
            </button>
        </div>
    )
}
```

### Update `apps/web/src/components/diff/DiffView.tsx`

Apply same pattern as contracts — check tier before rendering controls:

```tsx
const { canAccess, guardAction } = useTierGuard()
const hasAccess = canAccess('PRO')

// If no access, render LockedFeatureState instead of the diff controls
if (!hasAccess) {
    return (
        <div>
            <h1 className="page-title">Schema Diff</h1>
            <LockedFeatureState
                title="Schema diff is a PRO feature"
                description="Compare two versions of the same spec to identify breaking changes before they hit production."
                tier="PRO"
            />
        </div>
    )
}
```

### Update `apps/web/src/components/specs/SpecsView.tsx`

Show upgrade prompt if FREE user hits spec limit:

```tsx
// In the mutation onError handler in UploadSpecModal:
onError: (err: Error) => {
    // API returns UPGRADE_REQUIRED code when limit hit
    if (err.message.includes('limit reached') || err.message.includes('UPGRADE_REQUIRED')) {
        openUpgrade()  // open pricing modal
        onClose()
        return
    }
    setError(err.message)
}
```

### Update `PageHeader` to accept optional badge

```tsx
type Props = {
    title: string
    description?: string
    action?: {
        label: string
        onClick: () => void
        badge?: React.ReactNode   // ← add this
    }
}

export function PageHeader({ title, description, action }: Props) {
    return (
        <div className="page-header">
            <div>
                <h1 className="page-title">{title}</h1>
                {description && <p className="page-description">{description}</p>}
            </div>
            {action && (
                <button onClick={action.onClick} className="btn-primary page-header-btn"
                    style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {action.label}
                    {action.badge}
                </button>
            )}
        </div>
    )
}
```

---

## Phase 5 — Rate Limiting by Tier

### Update `packages/types/src/index.ts`

Replace static `RATE_LIMITS` with tier-aware version:

```typescript
export const RATE_LIMITS_BY_TIER = {
    FREE: {
        GENERAL:       { window: 60,   max: 60  },
        PROVISION:     { window: 3600, max: 5   },
        CONTRACT_TEST: { window: 3600, max: 5   },
    },
    PRO: {
        GENERAL:       { window: 60,   max: 300 },
        PROVISION:     { window: 3600, max: 20  },
        CONTRACT_TEST: { window: 3600, max: 50  },
    },
    TEAM: {
        GENERAL:       { window: 60,   max: 600 },
        PROVISION:     { window: 3600, max: 50  },
        CONTRACT_TEST: { window: 3600, max: 200 },
    },
} as const satisfies Record<Tier, Record<string, { window: number; max: number }>>

// Keep old RATE_LIMITS for backwards compat — maps to FREE defaults
export const RATE_LIMITS = RATE_LIMITS_BY_TIER.FREE
```

### Update `apps/api/src/middleware/rate-limit.ts`

```typescript
import type { Context, Next } from 'hono'
import { redis } from '../lib/redis'
import { RATE_LIMITS_BY_TIER } from '@mockline/types'
import type { Tier } from '@mockline/types'

type RateLimitType = 'GENERAL' | 'PROVISION' | 'CONTRACT_TEST'

export function rateLimit(type: RateLimitType = 'GENERAL') {
    return async (c: Context, next: Next): Promise<Response | void> => {
        const user = c.get('user')
        const userId = user?.id ?? c.req.header('x-forwarded-for') ?? 'anonymous'
        const tier = (user?.tier ?? 'FREE') as Tier

        const config = RATE_LIMITS_BY_TIER[tier][type]
        const key = `rl:${type}:${userId}`

        const current = await redis.incr(key)
        if (current === 1) {
            await redis.expire(key, config.window)
        }

        if (current > config.max) {
            return c.json(
                { data: null, error: { code: 'RATE_LIMITED', message: 'Too many requests' } },
                429,
            )
        }

        c.header('X-RateLimit-Limit', String(config.max))
        c.header('X-RateLimit-Remaining', String(Math.max(0, config.max - current)))
        await next()
    }
}
```

### Apply rate limiting in `apps/api/src/index.ts`

```typescript
import { rateLimit } from './middleware/rate-limit'

// Apply general rate limit to all protected routes
app.use('/specs/*',     requireAuth, rateLimit('GENERAL'))
app.use('/mocks/*',     requireAuth, rateLimit('GENERAL'))
app.use('/contracts/*', requireAuth, rateLimit('GENERAL'))

// Tighter limit on expensive operations
mocksRouter.post('/',     rateLimit('PROVISION'))
contractsRouter.post('/', rateLimit('CONTRACT_TEST'))
```

---

## Phase 6 — Lemon Squeezy Integration

### Setup

1. Create account at lemonsqueezy.com
2. Create a Store → name: Mockline
3. Create two Products:
   - **Mockline Pro** — subscription, $9/month + $7/month yearly variant
   - Add variant IDs to env vars
4. Enable webhooks: Dashboard → Settings → Webhooks
   - URL: `https://api.mockline.xyz/webhooks/lemonsqueezy`
   - Events: `subscription_created`, `subscription_updated`, `subscription_cancelled`
   - Copy signing secret

### Install

```bash
pnpm add @lemonsqueezy/lemonsqueezy.js --filter=api
```

### Environment variables

```bash
# apps/api/.env
LEMONSQUEEZY_API_KEY=
LEMONSQUEEZY_STORE_ID=
LEMONSQUEEZY_WEBHOOK_SECRET=
LEMONSQUEEZY_PRO_MONTHLY_VARIANT_ID=
LEMONSQUEEZY_PRO_YEARLY_VARIANT_ID=
```

### Update Prisma schema — add billing fields to User

```prisma
model User {
  // ... existing fields

  // Lemon Squeezy billing
  lemonSqueezyCustomerId     String?
  lemonSqueezySubscriptionId String?
  subscriptionStatus         String?   // active | cancelled | expired | past_due
  subscriptionRenewsAt       DateTime?
  subscriptionEndsAt         DateTime?

  @@map("users")
}
```

Run migration:
```bash
cd packages/db
pnpm prisma migrate dev --name add-billing-fields
```

### Create `apps/api/src/lib/lemonsqueezy.ts`

```typescript
import { lemonSqueezySetup, getAuthenticatedUser } from '@lemonsqueezy/lemonsqueezy.js'

export function initLemonSqueezy() {
    lemonSqueezySetup({
        apiKey: process.env.LEMONSQUEEZY_API_KEY!,
        onError: (error) => console.error('[LemonSqueezy]', error),
    })
}
```

### Create `apps/api/src/routes/billing.ts`

```typescript
import { Hono } from 'hono'
import { db } from '@mockline/db'
import { requireAuth } from '../middleware/auth'
import {
    createCheckout,
    getSubscription,
    cancelSubscription,
} from '@lemonsqueezy/lemonsqueezy.js'
import crypto from 'node:crypto'
import type { AppEnv } from '../types/env'

export const billingRouter = new Hono<AppEnv>()

// POST /billing/checkout — create a checkout session
billingRouter.post('/checkout', requireAuth, async (c) => {
    const user = c.get('user')
    const { variantId, yearly = false } = await c.req.json()

    const variant = yearly
        ? process.env.LEMONSQUEEZY_PRO_YEARLY_VARIANT_ID!
        : process.env.LEMONSQUEEZY_PRO_MONTHLY_VARIANT_ID!

    const checkout = await createCheckout(
        process.env.LEMONSQUEEZY_STORE_ID!,
        variant,
        {
            checkoutOptions: { embed: false },
            checkoutData: {
                email: user.email,
                custom: { userId: user.id },
            },
            productOptions: {
                redirectUrl: `${process.env.NEXT_PUBLIC_APP_URL}/overview?upgraded=true`,
                receiptButtonText: 'Go to dashboard',
            },
        }
    )

    if (checkout.error) {
        return c.json(
            { data: null, error: { code: 'CHECKOUT_FAILED', message: checkout.error.message } },
            500,
        )
    }

    return c.json({ data: { checkoutUrl: checkout.data?.data.attributes.url }, error: null })
})

// POST /billing/cancel — cancel subscription
billingRouter.post('/cancel', requireAuth, async (c) => {
    const user = c.get('user')

    if (!user.lemonSqueezySubscriptionId) {
        return c.json(
            { data: null, error: { code: 'NO_SUBSCRIPTION', message: 'No active subscription' } },
            400,
        )
    }

    const result = await cancelSubscription(user.lemonSqueezySubscriptionId)

    if (result.error) {
        return c.json(
            { data: null, error: { code: 'CANCEL_FAILED', message: result.error.message } },
            500,
        )
    }

    return c.json({ data: { cancelled: true }, error: null })
})

// POST /webhooks/lemonsqueezy — handle Lemon Squeezy events
// Note: this route is PUBLIC (no requireAuth) — verified by signature instead
billingRouter.post('/webhook', async (c) => {
    const rawBody = await c.req.text()
    const signature = c.req.header('x-signature')

    // Verify webhook signature
    const hmac = crypto.createHmac('sha256', process.env.LEMONSQUEEZY_WEBHOOK_SECRET!)
    const digest = hmac.update(rawBody).digest('hex')

    if (signature !== digest) {
        return c.json({ error: 'Invalid signature' }, 401)
    }

    const payload = JSON.parse(rawBody)
    const eventName = payload.meta?.event_name
    const customData = payload.meta?.custom_data
    const userId = customData?.userId
    const attributes = payload.data?.attributes

    if (!userId) {
        return c.json({ error: 'No userId in webhook' }, 400)
    }

    switch (eventName) {
        case 'subscription_created':
        case 'subscription_updated': {
            const isActive = attributes.status === 'active'
            await db.user.update({
                where: { id: userId },
                data: {
                    tier: isActive ? 'PRO' : 'FREE',
                    lemonSqueezyCustomerId: String(attributes.customer_id),
                    lemonSqueezySubscriptionId: String(payload.data.id),
                    subscriptionStatus: attributes.status,
                    subscriptionRenewsAt: attributes.renews_at
                        ? new Date(attributes.renews_at)
                        : null,
                    subscriptionEndsAt: attributes.ends_at
                        ? new Date(attributes.ends_at)
                        : null,
                },
            })
            break
        }

        case 'subscription_cancelled':
        case 'subscription_expired': {
            await db.user.update({
                where: { id: userId },
                data: {
                    tier: 'FREE',
                    subscriptionStatus: attributes.status,
                    subscriptionEndsAt: attributes.ends_at
                        ? new Date(attributes.ends_at)
                        : null,
                },
            })
            // Trigger downgrade handling (Phase 7)
            const { handleDowngrade } = await import('../services/downgrade')
            await handleDowngrade(userId)
            break
        }
    }

    return c.json({ received: true })
})
```

### Register billing routes in `apps/api/src/index.ts`

```typescript
import { billingRouter } from './routes/billing'
import { initLemonSqueezy } from './lib/lemonsqueezy'

// Initialize Lemon Squeezy at startup
initLemonSqueezy()

// Webhook route — must be public, before auth middleware
app.route('/webhooks/lemonsqueezy', billingRouter)
// Note: webhook route handles its own auth via signature verification

// Billing routes — protected
app.use('/billing/*', requireAuth)
app.route('/billing', billingRouter)
```

### Frontend — upgrade flow

In `apps/web/src/contexts/upgrade-modal.tsx`, update the `PricingModal` CTA handler:

```typescript
// When user clicks "Upgrade to Pro" in the modal:
onCtaClick={async (planName) => {
    if (planName === 'Free') return  // disabled button

    const yearly = /* from toggle state */ false
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/billing/checkout`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ variantId: 'pro', yearly }),
    })
    const data = await res.json()
    if (data.data?.checkoutUrl) {
        window.location.href = data.data.checkoutUrl
    }
}}
```

### Show subscription status in Settings

Add to `apps/web/src/components/settings/SettingsView.tsx` — new section between Profile and API Access:

```tsx
{user?.subscriptionStatus && user.tier !== 'FREE' && (
    <section className="settings-section settings-card">
        <h2 className="section-title">Subscription</h2>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
                <div className="settings-name">{user.tier} Plan</div>
                <div className="settings-email">
                    {user.subscriptionStatus === 'active'
                        ? `Renews ${new Date(user.subscriptionRenewsAt!).toLocaleDateString()}`
                        : `Ends ${new Date(user.subscriptionEndsAt!).toLocaleDateString()}`}
                </div>
            </div>
            {user.subscriptionStatus === 'active' && (
                <button
                    className="btn-secondary"
                    style={{ height: '32px', fontSize: '12px' }}
                    onClick={handleCancelSubscription}
                >
                    Cancel plan
                </button>
            )}
        </div>
    </section>
)}
```

---

## Phase 7 — Downgrade Handling

### Create `apps/api/src/services/downgrade.ts`

```typescript
import { db } from '@mockline/db'
import { CONTAINER_LIMITS } from '@mockline/types'

export async function handleDowngrade(userId: string): Promise<void> {
    const user = await db.user.findUnique({
        where: { id: userId },
        select: { id: true, tier: true, email: true },
    })

    if (!user) return

    const limit = CONTAINER_LIMITS[user.tier]

    // Count active mocks
    const activeMocks = await db.mockServer.findMany({
        where: { userId, status: 'RUNNING', deletedAt: null },
        orderBy: { createdAt: 'asc' }, // oldest first for auto-stop
    })

    if (activeMocks.length <= limit) return

    // Mark account as over limit — frontend shows banner
    // Auto-stop oldest mocks after 48 hours grace period
    const overLimitCount = activeMocks.length - limit
    const mocksToStop = activeMocks.slice(0, overLimitCount)

    // Set a 48-hour auto-stop scheduled time on these mocks
    const autoStopAt = new Date(Date.now() + 48 * 60 * 60 * 1000)

    await Promise.all(
        mocksToStop.map(mock =>
            db.mockServer.update({
                where: { id: mock.id },
                data: {
                    // Store scheduled stop time in config JSON field
                    config: { scheduledStopAt: autoStopAt.toISOString() },
                },
            })
        )
    )
}
```

### Update `apps/api/src/services/auto-stop.ts` — check scheduled stops

In the existing auto-stop scheduler, add a check for scheduled downgrade stops:

```typescript
// Inside the scheduler tick, add:
const scheduledStops = await db.mockServer.findMany({
    where: {
        status: 'RUNNING',
        deletedAt: null,
        config: { path: '$.scheduledStopAt', not: null },
    },
})

for (const mock of scheduledStops) {
    const config = mock.config as { scheduledStopAt?: string } | null
    if (!config?.scheduledStopAt) continue

    const stopAt = new Date(config.scheduledStopAt)
    if (new Date() >= stopAt) {
        await stopContainer(mock.dockerContainerId!)
        await db.mockServer.update({
            where: { id: mock.id },
            data: { status: 'STOPPED', config: null },
        })
    }
}
```

### Frontend — downgrade banner

In `apps/web/src/components/shell/DashboardShell.tsx`, add a banner check:

```tsx
// Fetch user's active mock count and compare to tier limit
// Show banner if over limit

{isOverLimit && (
    <div style={{
        background: 'rgba(192, 184, 122, 0.1)',
        border: '1px solid var(--color-status-building)',
        borderRadius: '6px',
        padding: '10px 16px',
        margin: '12px 24px 0',
        fontSize: '13px',
        color: 'var(--color-status-building)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
    }}>
        <span>
            Your plan changed. You have {overCount} mock{overCount !== 1 ? 's' : ''} above
            your {userTier} limit. Oldest mocks will stop automatically in 48 hours.
        </span>
        <Link href="/mocks" style={{ color: 'var(--color-primary)', fontSize: '12px', fontWeight: 500, textDecoration: 'none', flexShrink: 0 }}>
            Manage mocks →
        </Link>
    </div>
)}
```

---

## Phase 8 — PRO Feature Controls in UI

These features are already implemented in the backend (Contour CLI supports the flags).
This phase surfaces them in the `ProvisionMockModal` for PRO users.

### Update `ProvisionMockModal.tsx` — add PRO options section

```tsx
import { useTierGuard } from '@/hooks/useTierGuard'
import { TierBadge } from '@/components/shared/TierBadge'
import { useUpgradeModal } from '@/contexts/upgrade-modal'

// Inside the modal, after the version select, add:
const { canAccess } = useTierGuard()
const { open: openUpgrade } = useUpgradeModal()
const isProUser = canAccess('PRO')

// State for PRO options
const [stateful, setStateful] = useState(false)
const [delay, setDelay] = useState('')
const [errorRate, setErrorRate] = useState('')

// PRO options section (show for all users — locked for FREE):
<div style={{
    marginTop: '4px',
    padding: '16px',
    background: 'var(--color-bg)',
    border: '1px solid var(--color-border)',
    borderRadius: '6px',
}}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
        <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--color-text-muted)' }}>
            Mock options
        </span>
        {!isProUser && <TierBadge tier="PRO" />}
    </div>

    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', opacity: isProUser ? 1 : 0.4, pointerEvents: isProUser ? 'auto' : 'none' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', color: 'var(--color-text)' }}>
            <input
                type="checkbox"
                checked={stateful}
                onChange={e => setStateful(e.target.checked)}
                style={{ accentColor: 'var(--color-primary)' }}
            />
            Stateful mode — persist changes in memory
        </label>

        <div style={{ display: 'flex', gap: '8px' }}>
            <div className="form-field" style={{ flex: 1 }}>
                <label className="form-label">Response delay (ms range)</label>
                <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. 200-500"
                    value={delay}
                    onChange={e => setDelay(e.target.value)}
                />
            </div>
            <div className="form-field" style={{ flex: 1 }}>
                <label className="form-label">Error rate (%)</label>
                <input
                    type="number"
                    className="form-input"
                    placeholder="0–100"
                    min="0"
                    max="100"
                    value={errorRate}
                    onChange={e => setErrorRate(e.target.value)}
                />
            </div>
        </div>
    </div>

    {!isProUser && (
        <button
            onClick={openUpgrade}
            style={{
                marginTop: '10px',
                fontSize: '12px',
                color: 'var(--color-primary)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: 0,
            }}
        >
            Upgrade to PRO to unlock these options →
        </button>
    )}
</div>

// Update mutation to include contourOptions:
const mutation = useMutation({
    mutationFn: () => mocksApi.provision({
        specId,
        specVersionId,
        stateful: false,
        ...(isProUser && {
            contourOptions: {
                stateful: stateful || undefined,
                delay: delay || undefined,
                errorRate: errorRate ? parseInt(errorRate) : undefined,
            }
        }),
    }),
    // ... rest unchanged
})
```

---

## Environment Variables Summary

```bash
# apps/api/.env — add these
LEMONSQUEEZY_API_KEY=
LEMONSQUEEZY_STORE_ID=
LEMONSQUEEZY_WEBHOOK_SECRET=
LEMONSQUEEZY_PRO_MONTHLY_VARIANT_ID=
LEMONSQUEEZY_PRO_YEARLY_VARIANT_ID=
```

---

## Implementation Checklist

```
PHASE 1 — DELETE USER
[ ] apps/api/src/services/user-cleanup.ts created
[ ] apps/api/src/routes/user.ts created with DELETE /user/me
[ ] Route registered in apps/api/src/index.ts
[ ] SettingsView updated to call /user/me instead of authClient.deleteUser()
[ ] Test: delete account → containers stopped → re-signup works with same GitHub

PHASE 2 — SPEC LIMITS
[ ] SPEC_LIMITS added to packages/types/src/index.ts
[ ] Spec count check added to POST /specs
[ ] Test: FREE user creating 2nd spec gets 403 UPGRADE_REQUIRED

PHASE 3 — API PAYWALLS
[ ] apps/api/src/middleware/tier-guard.ts created
[ ] requireTier('PRO') applied to contractsRouter
[ ] requireTier('PRO') applied to schema diff endpoint
[ ] PRO contourOptions check in POST /mocks
[ ] Test: FREE user hitting /contracts gets 403 with UPGRADE_REQUIRED code

PHASE 4 — FRONTEND PAYWALL
[ ] useTierGuard hook created
[ ] TierBadge component created
[ ] LockedFeatureState component created
[ ] ContractsView shows locked state for FREE users
[ ] DiffView shows locked state for FREE users
[ ] UploadSpecModal handles UPGRADE_REQUIRED error → opens PricingModal
[ ] PageHeader updated to accept badge prop

PHASE 5 — RATE LIMITING
[ ] RATE_LIMITS_BY_TIER added to packages/types/src/index.ts
[ ] rate-limit middleware updated to accept type and read user.tier
[ ] Rate limiting applied in index.ts per route type

PHASE 6 — LEMON SQUEEZY
[ ] LemonSqueezy account created, store and products configured
[ ] Billing fields added to User model and migrated
[ ] apps/api/src/lib/lemonsqueezy.ts created
[ ] apps/api/src/routes/billing.ts created
[ ] Webhook route registered (public, signature-verified)
[ ] Billing routes registered (protected)
[ ] Frontend checkout flow wired in PricingModal
[ ] Subscription status shown in Settings
[ ] Test: checkout → webhook fires → user.tier updates to PRO

PHASE 7 — DOWNGRADE HANDLING
[ ] apps/api/src/services/downgrade.ts created
[ ] handleDowngrade called from subscription_cancelled webhook
[ ] Auto-stop scheduler checks scheduledStopAt
[ ] Downgrade banner shown in DashboardShell when over limit

PHASE 8 — PRO FEATURE CONTROLS
[ ] ProvisionMockModal shows PRO options section
[ ] Options locked with TierBadge for FREE users
[ ] contourOptions passed to provision API for PRO users
[ ] Test: PRO user can provision stateful mock with delay
```