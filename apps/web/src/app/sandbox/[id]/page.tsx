import type { Metadata } from 'next'
import { SandboxSharePage } from './SandboxSharePage'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'

type SharePageData = {
    id: string
    specName: string
    label: string | null
    description: string | null
    publicUrl: string | null
    status: string
    expiresAt: string | null
    createdAt: string
    endpoints: { method: string; path: string; summary?: string }[]
    analytics: { totalHits: number; uniqueEndpoints: number }
    branding: 'white-label' | 'powered-by'
}

async function getShareData(id: string): Promise<SharePageData | null> {
    try {
        const res = await fetch(`${API_URL}/share/${id}`, {
            cache: 'no-store',
        })
        if (!res.ok) return null
        const json = await res.json()
        return json.data
    } catch {
        return null
    }
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
    const { id } = await params
    const data = await getShareData(id)

    if (!data) {
        return { title: 'Sandbox Not Found | Mockline' }
    }

    return {
        title: `${data.label ?? data.specName} — API Sandbox | Mockline`,
        description: data.description ?? `Explore the ${data.specName} API sandbox on Mockline`,
    }
}

export default async function SharePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const data = await getShareData(id)

    if (!data) {
        return <SandboxNotFound />
    }

    return <SandboxSharePage data={data} />
}

function SandboxNotFound() {
    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--color-bg)',
            color: 'var(--color-text)',
        }}>
            <div style={{ textAlign: 'center' }}>
                <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '8px', color: 'var(--color-text-strong)' }}>
                    Sandbox Not Found
                </h1>
                <p style={{ fontSize: '14px', color: 'var(--color-text-muted)' }}>
                    This sandbox doesn&apos;t exist, has expired, or sharing is not enabled.
                </p>
            </div>
        </div>
    )
}
