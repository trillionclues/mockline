
import { WaitlistView } from '@/components/waitlist/WaitlistView'
import type { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Join the Waitlist — Mockline',
    description: 'Be the first to know when Mockline launches. Mock APIs in seconds from your OpenAPI spec.',
}

export default function WaitlistPage() {
    return <WaitlistView />
}