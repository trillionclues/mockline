'use client'
import { useState } from 'react'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'
import { MobileSidebarDrawer } from './MobileSidebarDrawer'
import { UpgradeModalProvider, useUpgradeModal } from '@/contexts/upgrade-modal'
import type { User } from '@/types'

export function DashboardShell({
    children,
    user,
}: {
    children: React.ReactNode
    user: User
}) {
    return (
        <UpgradeModalProvider>
            <DashboardShellInner user={user}>{children}</DashboardShellInner>
        </UpgradeModalProvider>
    )
}

function DashboardShellInner({
    children,
    user,
}: {
    children: React.ReactNode
    user: User
}) {
    const [mobileOpen, setMobileOpen] = useState(false)
    const { open: openUpgrade } = useUpgradeModal()

    return (
        <div className="dashboard-shell">
            <div className="dashboard-sidebar-desktop">
                <Sidebar user={user} />
            </div>

            <MobileSidebarDrawer
                open={mobileOpen}
                onClose={() => setMobileOpen(false)}
                user={user}
            />

            <div className="dashboard-content">
                <Topbar onMobileMenuOpen={() => setMobileOpen(true)} user={user} />

                {user.subscriptionStatus === 'past_due' && (
                    <div style={{
                        background: 'rgba(239,68,68,0.06)',
                        border: '1px solid rgba(239,68,68,0.15)',
                        borderRadius: '6px',
                        padding: '10px 16px',
                        margin: '12px 24px 0',
                        fontSize: '13px',
                        color: '#ef4444',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '12px',
                    }}>
                        <span>Your last payment failed. Update your payment method to avoid losing access.</span>
                        <a href="/settings" style={{ color: '#ef4444', fontSize: '12px', fontWeight: 500, textDecoration: 'underline', flexShrink: 0 }}>
                            Go to Settings →
                        </a>
                    </div>
                )}

                {user.subscriptionStatus === 'expired' && (
                    <div style={{
                        background: 'rgba(192,184,122,0.06)',
                        border: '1px solid rgba(192,184,122,0.15)',
                        borderRadius: '6px',
                        padding: '10px 16px',
                        margin: '12px 24px 0',
                        fontSize: '13px',
                        color: 'var(--color-status-building)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '12px',
                    }}>
                        <span>Your subscription has expired. Excess specs and mock servers have been adjusted to FREE limits.</span>
                        <button onClick={openUpgrade} className="sidebar-upgrade-btn" style={{
                            background: 'var(--color-primary-muted)',
                            border: '1px solid var(--color-border-highlight)',
                            borderRadius: '6px',
                            padding: '6px 12px',
                            fontSize: '11px',
                            fontWeight: 600,
                            color: 'var(--color-logo-line)',
                            cursor: 'pointer',
                            flexShrink: 0,
                        }}>
                            Upgrade
                        </button>
                    </div>
                )}

                <main className="dashboard-main">
                    <div className="dashboard-main-inner">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    )
}