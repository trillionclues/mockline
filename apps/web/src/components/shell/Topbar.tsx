'use client'
import { usePathname } from 'next/navigation'

const TITLES: Record<string, string> = {
    '/overview': 'Overview',
    '/specs': 'Specs',
    '/mocks': 'Mock Servers',
    '/contracts': 'Contracts',
    '/diff': 'Schema Diff',
    '/explorer': 'API Explorer',
    '/settings': 'Settings',
}

export function Topbar() {
    const pathname = usePathname()
    const title = Object.entries(TITLES).find(
        ([key]) => pathname.startsWith(key)
    )?.[1] ?? 'Mockline'

    return (
        <header style={{
            height: '48px',
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 24px',
            borderBottom: '1px solid #1a1a2e',
            background: '#0a0a0b',
        }}>
            <span style={{
                fontSize: '14px',
                fontWeight: 500,
                fontFamily: 'Inter, sans-serif',
                color: '#f4f4f5',
            }}>
                {title}
            </span>
        </header>
    )
}
