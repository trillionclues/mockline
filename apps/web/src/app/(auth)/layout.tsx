import { MocklineWordmark } from '@/components/brand'
import Link from 'next/link'

export default function AuthLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            background: 'var(--color-bg)',
            padding: '24px',
        }}>
            <Link href="/" style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                textDecoration: 'none',
                marginBottom: '20px',
            }}>
                <MocklineWordmark size={20} />
            </Link>

            <div style={{
                width: '100%',
                maxWidth: '450px',
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: '12px',
                padding: '32px',
            }}>
                {children}
            </div>

            <p style={{
                fontSize: '12px',
                color: 'var(--color-nav-text)',
                marginTop: '24px',
            }}>
                © {new Date().getFullYear()} Mockline
            </p>
        </div>
    )
}
