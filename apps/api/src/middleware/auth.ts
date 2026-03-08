import type { Context, Next } from 'hono'
import { auth } from '../lib/auth'

// Middleware: validates BetterAuth session.
// Attaches `c.set('user', user)` and `c.set('session', session)` on success.
// Returns 401 if no valid session.
export async function requireAuth(c: Context, next: Next): Promise<Response | void> {
    const session = await auth.api.getSession({
        headers: c.req.raw.headers,
    })

    if (!session) {
        return c.json(
            { data: null, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
            401,
        )
    }

    c.set('user', session.user)
    c.set('session', session.session)
    await next()
}
