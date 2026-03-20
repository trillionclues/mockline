import type { Context, Next } from 'hono'
import { redis } from '../lib/redis'
import { RATE_LIMITS_BY_TIER } from '@mockline/types'
import type { Tier } from '@mockline/types'
import type { AppEnv } from '../types/env'

type RateLimitType = 'GENERAL' | 'PROVISION' | 'CONTRACT_TEST'

// Tier-aware Redis rate limiter.
// Key is scoped per operation type + user, so provision limits don't
// eat into general API headroom and vice versa.
export function rateLimit(type: RateLimitType = 'GENERAL') {
    return async (c: Context<AppEnv>, next: Next): Promise<Response | void> => {
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
                { data: null, error: { code: 'RATE_LIMITED', message: 'Too many requests. Upgrade for higher limits.' } },
                429,
            )
        }

        c.header('X-RateLimit-Limit', String(config.max))
        c.header('X-RateLimit-Remaining', String(Math.max(0, config.max - current)))
        c.header('X-RateLimit-Reset', String(config.window))
        await next()
    }
}
