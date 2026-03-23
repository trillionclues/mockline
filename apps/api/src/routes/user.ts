import { Hono } from 'hono'
import { cleanupUserResources } from '../services/user-cleanup'
import { deleteUser } from '../repositories/user.repository'
import type { AppEnv } from '../types/env'

export const userRouter = new Hono<AppEnv>()

// delete own account
userRouter.delete('/me', async (c) => {
    const userId = c.get('user').id

    try {
        // stop and remove all docker containers
        await cleanupUserResources(userId)

        // delete the user record - prisma cascade handles:
        // specs, spec_versions, mock_servers, sessions, accounts
        await deleteUser(userId)

        return c.json({ data: { deleted: true }, error: null })
    } catch (error) {
        return c.json(
            { data: null, error: { code: 'DELETE_FAILED', message: (error as Error).message } },
            500,
        )
    }
})
