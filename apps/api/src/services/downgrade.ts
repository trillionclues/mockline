import { db } from '@mockline/db'
import { SPEC_LIMITS } from '@mockline/types'

export async function handleDowngrade(userId: string) {
    // Phase 7: Enforce free tier limits sequentially
    // Stub for now. We will implement deleting/freezing resources later.
    console.log(`[downgrade] user ${userId} downgraded to FREE`)
}
