'use client'
import { useEffect } from 'react'
import { Sidebar } from './Sidebar'

type User = { name?: string | null; email?: string | null; image?: string | null }

type Props = {
    open: boolean
    onClose: () => void
    user?: User
}

export function MobileSidebarDrawer({ open, onClose, user }: Props) {
    useEffect(() => {
        document.body.style.overflow = open ? 'hidden' : ''
        return () => { document.body.style.overflow = '' }
    }, [open])

    return (
        <>
            {open && (
                <div className="mobile-drawer-backdrop" onClick={onClose} />
            )}
            <div className={`mobile-drawer ${open ? 'open' : ''}`}>
                <Sidebar
                    user={user}
                    onMobileMenuOpen={onClose}
                    onNavigate={onClose}
                />
            </div>
        </>
    )
}