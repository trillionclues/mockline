import { headers } from 'next/headers'

export const getSession = async () => {
    const baseURL = process.env.NEXT_PUBLIC_AUTH_URL ?? 'http://localhost:4000'
    try {
        const res = await fetch(`${baseURL}/api/auth/get-session`, {
            headers: await headers(),
            cache: 'no-store'
        })
        if (!res.ok) return null
        return (await res.json()) || null
    } catch (e) {
        console.error('Failed to fetch session from API proxy:', e)
        return null
    }
}
