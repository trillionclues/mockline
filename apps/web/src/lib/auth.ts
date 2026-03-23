import { headers } from 'next/headers'
import { authClient } from './auth-client'

export const getSession = async () => {
    try {
        const reqHeaders = await headers()
        const fetchHeaders = new Headers()
        
        const cookie = reqHeaders.get('cookie')
        if (cookie) fetchHeaders.set('cookie', cookie)
            
        const userAgent = reqHeaders.get('user-agent')
        if (userAgent) fetchHeaders.set('user-agent', userAgent)

        const { data } = await authClient.getSession({
            fetchOptions: {
                headers: fetchHeaders
            }
        })
        
        // Assert the returned user type includes our custom schema fields
        return data as (typeof data & { 
            user: { 
                tier: 'FREE' | 'PRO' | 'TEAM'; 
                subscriptionStatus?: string | null; 
                subscriptionRenewsAt?: string | Date | null; 
                subscriptionEndsAt?: string | Date | null; 
            } 
        }) | null
    } catch (e) {
        console.error('Failed to fetch session from API proxy:', e)
        return null
    }
}
