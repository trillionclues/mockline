import { Hono } from 'hono'
import { db } from '@mockline/db'
import { cleanupUserResources } from '../services/user-cleanup'
import type { AppEnv } from '../types/env'

export const userRouter = new Hono<AppEnv>()

// DELETE /user/me — delete own account
userRouter.delete('/me', async (c) => {
    const userId = c.get('user').id

    try {
        // Stop and remove all Docker containers
        await cleanupUserResources(userId)

        // Delete the user record - Prisma cascade handles:
        // specs, spec_versions, mock_servers, sessions, accounts
        await db.user.delete({ where: { id: userId } })

        return c.json({ data: { deleted: true }, error: null })
    } catch (error) {
        return c.json(
            { data: null, error: { code: 'DELETE_FAILED', message: (error as Error).message } },
            500,
        )
    }
})
