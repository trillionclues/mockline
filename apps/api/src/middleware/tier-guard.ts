import type { Context, Next } from 'hono'
import type { Tier } from '@mockline/types'
import type { AppEnv } from '../types/env'

const tierRank: Record<Tier, number> = { FREE: 0, PRO: 1, TEAM: 2 }

export function requireTier(minimumTier: 'PRO' | 'TEAM') {
    const required = tierRank[minimumTier]

    return async (c: Context<AppEnv>, next: Next): Promise<Response | void> => {
        const user = c.get('user')
        const userTier = (user?.tier ?? 'FREE') as Tier
        const userRank = tierRank[userTier] ?? 0

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



// ================ NOTES ================= 
// Look to replace the implicit permissions with more explicit implmenentation

// const permissions: Record<Tier, string[]> = {
//   FREE:  ['mocks:create', 'specs:create'],
//   PRO:   ['mocks:create', 'specs:create', 'mocks:stateful', 'mocks:delay'],
//   TEAM:  ['mocks:create', 'specs:create', 'mocks:stateful', 'mocks:delay', 'team:invite'],
// }


// Then your routes become declarative and self-documenting:

// mocksRouter.post('/', requirePermission('mocks:create'), async (c) => { ... })
// mocksRouter.post('/stateful', requirePermission('mocks:stateful'), async (c) => { ... })