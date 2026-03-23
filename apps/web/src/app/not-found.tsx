import Link from 'next/link'
import { MocklineWordmark } from '@/components/brand'

export default function NotFound() {
    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            background: 'var(--color-bg)',
            padding: '24px',
            textAlign: 'center',
        }}>
            <Link href="/" style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                textDecoration: 'none',
                marginBottom: '48px',
            }}>
                <MocklineWordmark size={20} />
            </Link>

            <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '12px',
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '24px',
                fontSize: '28px',
                color: 'var(--color-text-muted)',
            }}>
                ?
            </div>

            <h1 style={{
                fontSize: '48px',
                fontWeight: 800,
                color: 'var(--color-text-strong)',
                marginBottom: '8px',
                fontFamily: 'var(--font-family-heading)',
                letterSpacing: '-1px',
            }}>
                404
            </h1>

            <p style={{
                fontSize: '16px',
                fontWeight: 500,
                color: 'var(--color-text)',
                marginBottom: '8px',
            }}>
                Page not found
            </p>

            <p style={{
                fontSize: '14px',
                color: 'var(--color-text)',
                maxWidth: '360px',
                marginBottom: '32px',
                lineHeight: 1.6,
            }}>
                The page you&apos;re looking for doesn&apos;t exist or has been moved.
            </p>

            <div style={{ display: 'flex', gap: '12px' }}>
                <Link
                    href="/"
                    className="btn-primary"
                    style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        textDecoration: 'none',
                    }}
                >
                    Back to home
                </Link>
                <Link
                    href="/overview"
                    className="btn-secondary"
                    style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        textDecoration: 'none',
                    }}
                >
                    Go to dashboard
                </Link>
            </div>

            <p style={{
                fontSize: '12px',
                color: 'var(--color-text-muted)',
                marginTop: '48px',
            }}>
                © {new Date().getFullYear()} Mockline
            </p>
        </div>
    )
}
