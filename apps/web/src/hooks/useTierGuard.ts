'use client'

import { useSession } from '@/lib/auth-client'
import { useUpgradeModal } from '@/contexts/upgrade-modal'
import type { Tier } from '@mockline/types'
import { User } from '@/types'

const TIER_RANK: Record<string, number> = { FREE: 0, PRO: 1, TEAM: 2 }

export function useTierGuard() {
    const { data: session } = useSession()
    const { open: openUpgrade } = useUpgradeModal()
    const user = session?.user as User | undefined;

    const userTier = (user?.tier ?? 'FREE') as Tier
    const userRank = TIER_RANK[userTier] ?? 0

    const canAccess = (requiredTier: 'PRO' | 'TEAM'): boolean => {
        return userRank >= TIER_RANK[requiredTier]
    }

    // If tier insufficient → opens upgrade modal and returns false
    const guardAction = (requiredTier: 'PRO' | 'TEAM'): boolean => {
        if (!canAccess(requiredTier)) {
            openUpgrade()
            return false
        }
        return true
    }

    return { userTier, canAccess, guardAction }
}
