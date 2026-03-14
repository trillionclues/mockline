'use client'

import { PricingModal } from '@/components/shared/PricingModal'
import { createContext, useContext, useState } from 'react'

const UpgradeModalContext = createContext<{ open: () => void }>({ open: () => { } })

export function UpgradeModalProvider({ children }: { children: React.ReactNode }) {
    const [isOpen, setIsOpen] = useState(false)
    return (
        <UpgradeModalContext.Provider value={{ open: () => setIsOpen(true) }}>
            {children}
            <PricingModal open={isOpen} onClose={() => setIsOpen(false)} />
        </UpgradeModalContext.Provider>
    )
}

export const useUpgradeModal = () => useContext(UpgradeModalContext)