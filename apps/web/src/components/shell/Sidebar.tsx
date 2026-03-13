'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV = [
    { href: '/overview', label: 'Overview' },
    { href: '/specs', label: 'Specs' },
    { href: '/mocks', label: 'Mock Servers' },
    { href: '/contracts', label: 'Contracts' },
]

const TOOLS = [
    { href: '/diff', label: 'Schema Diff' },
    { href: '/explorer', label: 'API Explorer' },
]

export function Sidebar() {
    const pathname = usePathname()

    const isActive = (href: string) => pathname.startsWith(href)

    const itemStyle = (active: boolean): React.CSSProperties => ({
        display: 'flex',
        alignItems: 'center',
        height: '36px',
        padding: '0 12px',
        borderRadius: '6px',
        fontSize: '13px',
        color: active ? 'var(--color-text-strong)' : 'var(--color-text-muted)',
        background: active ? 'var(--color-primary-muted)' : 'transparent',
        borderLeft: active ? '2px solid var(--color-primary)' : '2px solid transparent',
        textDecoration: 'none',
        transition: 'color 120ms ease, background 120ms ease',
        cursor: 'pointer',
    })

    return (
        <aside style={{
            width: '220px',
            flexShrink: 0,
            height: '100vh',
            background: 'var(--color-surface)',
            borderRight: '1px solid var(--color-border)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
        }}>
            <div style={{
                height: '48px',
                display: 'flex',
                alignItems: 'center',
                padding: '0 16px',
                borderBottom: '1px solid var(--color-border)',
                fontSize: '15px',
                fontWeight: 600,
                color: 'var(--color-text-strong)',
                flexShrink: 0,
            }}>
                mockline
            </div>

            <nav style={{
                flex: 1,
                padding: '8px',
                display: 'flex',
                flexDirection: 'column',
                gap: '2px',
                overflowY: 'auto',
            }}>
                {NAV.map(item => (
                    <Link key={item.href} href={item.href} style={itemStyle(isActive(item.href))}>
                        {item.label}
                    </Link>
                ))}

                <div style={{
                    fontSize: '11px',
                    color: 'var(--color-text-subtle)',
                    padding: '12px 12px 4px',
                    letterSpacing: 'normal',
                    textTransform: 'none',
                }}>
                    Tools
                </div>

                {TOOLS.map(item => (
                    <Link key={item.href} href={item.href} style={itemStyle(isActive(item.href))}>
                        {item.label}
                    </Link>
                ))}
            </nav>

            <div style={{
                padding: '12px',
                borderTop: '1px solid var(--color-border)',
                flexShrink: 0,
            }}>
                <Link href="/settings" style={itemStyle(isActive('/settings'))}>
                    Settings
                </Link>
            </div>
        </aside>
    )
}
