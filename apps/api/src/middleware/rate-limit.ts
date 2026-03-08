import type { Context, Next } from 'hono'
import { redis } from '../lib/redis'
import { RATE_LIMITS } from '@mockline/types'

type RateLimitConfig = { window: number; max: number }

// Creates Redis-backed rate limiter middleware.
export function rateLimit(config: RateLimitConfig = RATE_LIMITS.GENERAL) {
    return async (c: Context, next: Next): Promise<Response | void> => {
        const userId = c.get('user')?.id ?? c.req.header('x-forwarded-for') ?? 'anonymous'
        const key = `rl:${c.req.path}:${userId}`

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
