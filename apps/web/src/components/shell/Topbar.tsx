'use client'
import { usePathname } from 'next/navigation'
import { ThemeToggle } from '../theme-toggle'
import { Menu } from 'lucide-react'
import Link from 'next/link'

const TITLES: Record<string, string> = {
    '/overview': 'Overview',
    '/specs': 'Specs',
    '/mocks': 'Mock Servers',
    '/contracts': 'Contracts',
    '/diff': 'Schema Diff',
    '/explorer': 'API Explorer',
    '/settings': 'Settings',
}

type Props = {
    onMobileMenuOpen?: () => void
    user?: { name?: string | null; email?: string | null; image?: string | null }
}

export function Topbar({ onMobileMenuOpen, user }: Props) {
    const pathname = usePathname()
    const title = Object.entries(TITLES).find(
        ([key]) => pathname.startsWith(key)
    )?.[1] ?? 'Mockline'

    return (
        <header className="topbar">
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <button
                    className="topbar-mobile-menu"
                    onClick={onMobileMenuOpen}
                    aria-label="Open menu"
                >
                    <Menu size={18} />
                </button>
                <span className="topbar-title">{title}</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <ThemeToggle size="small" />
                {user && (
                    <Link href="/settings" style={{ textDecoration: 'none' }}>
                        {user.image ? (
                            <img
                                src={user.image}
                                alt={user.name ?? 'User'}
                                className="topbar-avatar"
                                title={user.name ?? user.email ?? ''}
                            />
                        ) : (
                            <div className="topbar-avatar topbar-avatar-fallback" title={user.name ?? user.email ?? ''}>
                                {(user.name ?? user.email ?? 'U')[0].toUpperCase()}
                            </div>
                        )}
                    </Link>
                )}
            </div>
        </header>
    )
}