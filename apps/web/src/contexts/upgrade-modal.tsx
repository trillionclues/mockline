'use client'

import { PricingModal } from '@/components/shared/PricingModal'
import { createContext, useContext, useState, useEffect, Suspense, useRef } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'

const UpgradeModalContext = createContext<{ open: () => void }>({ open: () => { } })

function PlanParamInterceptor({ openModal }: { openModal: () => void }) {
    const searchParams = useSearchParams()
    const router = useRouter()
    const handledRef = useRef(false)

    useEffect(() => {
        if (handledRef.current) return

        const plan = searchParams.get('plan')
        if (plan && (plan === 'pro' || plan === 'team')) {
            handledRef.current = true
            openModal()

            // Clean up URL after pricing modal mounts
            // to prevent Next.js interrupting the render
            setTimeout(() => {
                const newUrl = new URL(window.location.href)
                newUrl.searchParams.delete('plan')
                router.replace(newUrl.pathname + newUrl.search, { scroll: false })
            }, 50)
        }
    }, [searchParams, router, openModal])

    return null
}

export function UpgradeModalProvider({ children }: { children: React.ReactNode }) {
    const [isOpen, setIsOpen] = useState(false)
    return (
        <UpgradeModalContext.Provider value={{ open: () => setIsOpen(true) }}>
            {children}
            <PricingModal open={isOpen} onClose={() => setIsOpen(false)} />
            <Suspense fallback={null}>
                <PlanParamInterceptor openModal={() => setIsOpen(true)} />
            </Suspense>
        </UpgradeModalContext.Provider>
    )
}

export const useUpgradeModal = () => useContext(UpgradeModalContext)