import type { Metadata } from 'next'
import { Pricing } from '@/components/marketing/section/Pricing'

export const metadata: Metadata = {
    title: 'Pricing | Mockline',
    description: 'Simple, transparent pricing for Mockline. Start free, scale when you need to.',
}

export default function PricingPage() {
    return (
        <main className="prose-page" style={{ maxWidth: '1300px', padding: '40px 24px 80px' }}>
            <h1 className="prose-title" style={{ textAlign: 'center' }}>Pricing</h1>
            <Pricing />
        </main>
    )
}
