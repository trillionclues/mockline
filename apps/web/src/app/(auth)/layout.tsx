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
            background: '#0a0a0b',
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
                background: '#111114',
                border: '1px solid #2e2e49ff',
                borderRadius: '12px',
                padding: '32px',
            }}>
                {children}
            </div>

            <p style={{
                fontFamily: 'Inter, -apple-system, sans-serif',
                fontSize: '12px',
                color: '#959598ff',
                marginTop: '24px',
            }}>
                © {new Date().getFullYear()} Mockline
            </p>
        </div>
    )
}
