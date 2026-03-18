
import { NextResponse, type NextRequest } from 'next/server'

export default async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl

    const isPublic =
        pathname === '/' ||
        pathname.startsWith('/api/waitlist') ||
        pathname === '/pricing' ||
        pathname.startsWith('/login') ||
        pathname.startsWith('/api/auth') ||
        pathname.startsWith('/docs') ||
        pathname.startsWith('/changelog') ||
        pathname.startsWith('/roadmap') ||
        pathname.startsWith('/about') ||
        pathname.startsWith('/privacy') ||
        pathname.startsWith('/terms') ||
        pathname.startsWith('/blog')

    // allow static files and Next.js internals
    if (
        pathname.startsWith('/_next') ||
        pathname.startsWith('/images') ||
        pathname.includes('.')
    ) {
        return NextResponse.next()
    }

    if (isPublic) {
        // If user is on /login and is already authenticated, redirect to /overview
        if (pathname.startsWith('/login')) {
            const sessionCookie = request.cookies.get('better-auth.session_token')
            if (sessionCookie) {
                // typically should verify it, but for middleware speed, cookie presence + 
                // a quick fetch check or just optimistically redirecting is cool.
                // If it's invalid, the dashboard layout will catch it.
                return NextResponse.redirect(new URL('/overview', request.url))
            }
        }
        return NextResponse.next()
    }

    const sessionCookie = request.cookies.get('better-auth.session_token')
    if (!sessionCookie) {
        // No session, redirect to login
        const url = new URL('/login', request.url)
        url.searchParams.set('redirect_to', pathname + request.nextUrl.search)
        return NextResponse.redirect(url)
    }

    // dashboard layout `await auth()`
    // handles checking if cookie is truly valid.
    return NextResponse.next()
}

export const config = {
    matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
