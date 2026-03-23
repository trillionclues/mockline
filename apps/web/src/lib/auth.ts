import { headers } from 'next/headers'

export const getSession = async () => {
    const baseURL = process.env.NEXT_PUBLIC_AUTH_URL ?? 'http://localhost:4000'
    try {
        const reqHeaders = await headers()
        const fetchHeaders = new Headers()
        
        // Only forward specific headers to avoid Vercel's Host header overriding Traefik's routing expectations
        const cookie = reqHeaders.get('cookie')
        if (cookie) fetchHeaders.set('cookie', cookie)
            
        const userAgent = reqHeaders.get('user-agent')
        if (userAgent) fetchHeaders.set('user-agent', userAgent)

        const res = await fetch(`${baseURL}/api/auth/get-session`, {
            headers: fetchHeaders,
            cache: 'no-store'
        })
        if (!res.ok) return null
        return (await res.json()) || null
    } catch (e) {
        console.error('Failed to fetch session from API proxy:', e)
        return null
    }
}
