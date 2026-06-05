
import { NextResponse, type NextRequest } from 'next/server'

export default async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl

    const isPublic =
        pathname === '/' ||
        pathname === '/waitlist' ||
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
        pathname.startsWith('/blog') ||
        pathname.startsWith('/webhooks/')

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
            // BetterAuth uses __Secure- prefix in production (HTTPS), plain name on localhost (HTTP)
            const sessionCookie =
                request.cookies.get('__Secure-better-auth.session_token') ??
                request.cookies.get('better-auth.session_token')
            if (sessionCookie) {
                const url = new URL('/overview', request.url)
                url.search = request.nextUrl.search // Preserve search params (e.g., plan=pro)
                return NextResponse.redirect(url)
            }
        }
        return NextResponse.next()
    }

    const sessionCookie =
        request.cookies.get('__Secure-better-auth.session_token') ??
        request.cookies.get('better-auth.session_token')
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
