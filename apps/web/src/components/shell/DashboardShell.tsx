'use client'
import { useState } from 'react'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'
import { MobileSidebarDrawer } from './MobileSidebarDrawer'
import { UpgradeModalProvider } from '@/contexts/upgrade-modal'

type User = { name?: string | null; email?: string | null; image?: string | null }

export function DashboardShell({
    children,
    user,
}: {
    children: React.ReactNode
    user: User
}) {
    const [mobileOpen, setMobileOpen] = useState(false)

    return (
        <UpgradeModalProvider>
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
                    <main className="dashboard-main">
                        <div className="dashboard-main-inner">
                            {children}
                        </div>
                    </main>
                </div>
            </div>
        </UpgradeModalProvider>
    )
}