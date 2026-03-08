import type { User, Session } from '@mockline/db'

// Hono env types for Mockline API.
// these define what c.get() and c.set() can access.
export type AppEnv = {
    Variables: {
        user: User
        session: Session
    }
}
