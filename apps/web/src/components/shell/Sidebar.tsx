'use client'
import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { authClient } from '@/lib/auth-client'
import { MocklineWordmark } from '@/components/brand'
import { LogOut, Settings } from 'lucide-react'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { useUpgradeModal } from '@/contexts/upgrade-modal'
import type { User } from '@/types'

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

type Props = { user?: User; onMobileMenuOpen?: () => void, onNavigate?: () => void }

export function Sidebar({ user, onMobileMenuOpen, onNavigate }: Props) {
    const pathname = usePathname()
    const router = useRouter()
    const [logoutOpen, setLogoutOpen] = useState(false)
    const { open: openUpgrade } = useUpgradeModal()

    const isActive = (href: string) => pathname.startsWith(href)

    const handleLogout = async () => {
        await authClient.signOut()
        router.push('/login')
    }

    return (
        <aside className="sidebar">
            <div className="sidebar-header">
                <Link href="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
                    <MocklineWordmark size={16} />
                </Link>
                <button className="sidebar-hamburger" onClick={onMobileMenuOpen} aria-label="Close menu">
                    ✕
                </button>
            </div>

            <nav className="sidebar-nav">
                {NAV.map(item => (
                    <Link key={item.href} href={item.href} onClick={onNavigate} className={`sidebar-nav-item ${isActive(item.href) ? 'active' : ''}`}>
                        {item.label}
                    </Link>
                ))}

                <span className="sidebar-section-label" style={{
                    marginTop: 10
                }}>Tools</span>

                {TOOLS.map(item => (
                    <Link key={item.href} href={item.href} onClick={onNavigate} className={`sidebar-nav-item ${isActive(item.href) ? 'active' : ''}`}>
                        {item.label}
                    </Link>
                ))}
            </nav>

            <div className="sidebar-footer">
                <Link href="/settings" onClick={onNavigate} className={`sidebar-nav-item ${isActive('/settings') ? 'active' : ''}`}>
                    <Settings size={14} style={{ marginRight: '8px', opacity: 0.6 }} />
                    Settings
                </Link>

                <button
                    className="sidebar-nav-item"
                    onClick={() => setLogoutOpen(true)}
                    style={{ border: 'none', width: '100%', textAlign: 'left', cursor: 'pointer' }}
                >
                    <LogOut size={14} style={{ marginRight: '8px', opacity: 0.6 }} />
                    Sign out
                </button>

                {(!user?.tier || user.tier === 'FREE') && (
                    <div style={{ display: 'flex', gap: '6px', margin: '10px 0px' }}>
                        <span
                            style={{
                                flex: 1,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                height: '32px',
                                background: 'transparent',
                                borderRadius: '6px',
                                fontSize: '11px',
                                fontWeight: 600,
                                color: 'var(--color-text-muted)',
                                textDecoration: 'none',
                            }}
                        >
                            {user?.tier ?? 'FREE'}
                        </span>
                        <button
                            onClick={openUpgrade}
                            className="sidebar-upgrade-btn cursor-pointer"
                            style={{
                                flex: 1,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                height: '32px',
                                background: 'var(--color-primary-muted)',
                                border: '1px solid var(--color-border-highlight)',
                                borderRadius: '6px',
                                fontSize: '11px',
                                fontWeight: 600,
                                color: 'var(--color-logo-line)',
                                textDecoration: 'none',
                                transition: 'background 120ms ease',
                                letterSpacing: '0.03em',
                            }}
                        >
                            {user?.tier !== 'PRO' ? 'Upgrade' : 'TEAM'}
                        </button>
                    </div>
                )}

            </div>

            <ConfirmDialog
                open={logoutOpen}
                onClose={() => setLogoutOpen(false)}
                title="Sign out"
                description="Are you sure you want to sign out of Mockline?"
                onConfirm={handleLogout}
                variant="default"
            />
        </aside>
    )
}