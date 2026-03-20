'use client'
import { useState } from 'react'
import { PLANS } from '@/lib/data/data'
import { X } from 'lucide-react'
import { PricingCard } from '../marketing/cards/PricingCard'

type Props = {
    open: boolean
    onClose: () => void
}

export function PricingModal({ open, onClose }: Props) {
    const [yearly, setYearly] = useState(false)

    if (!open) return null

    const handleCtaClick = (planName: string) => {
        console.log('Upgrade to:', planName)
        onClose();
    }

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div
                onClick={e => e.stopPropagation()}
                style={{
                    background: 'var(--color-surface)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '12px',
                    width: '100%',
                    maxWidth: '900px',
                    maxHeight: '90vh',
                    overflowY: 'auto',
                    padding: '32px',
                    position: 'relative',
                }}
            >
                <button
                    onClick={onClose}
                    className="btn-icon"
                    style={{ position: 'absolute', top: '16px', right: '16px' }}
                >
                    <X size={16} />
                </button>

                <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                    <h2 style={{ fontSize: '20px', fontWeight: 600, color: 'var(--color-text-strong)', marginBottom: '8px' }}>
                        Upgrade your plan
                    </h2>
                    <p style={{ fontSize: '14px', color: 'var(--color-text-muted)', marginBottom: '20px' }}>
                        Start free. Scale when you need to.
                    </p>

                    <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '4px',
                        background: 'var(--color-bg)',
                        border: '1px solid var(--color-border)',
                        borderRadius: '8px',
                    }}>
                        <button
                            onClick={() => setYearly(false)}
                            style={{
                                padding: '5px 14px',
                                borderRadius: '6px',
                                border: 'none',
                                fontSize: '12px',
                                fontWeight: 500,
                                cursor: 'pointer',
                                transition: 'background 150ms ease, color 150ms ease',
                                background: !yearly ? 'var(--color-border)' : 'transparent',
                                color: !yearly ? 'var(--color-text)' : 'var(--color-text-muted)',
                            }}
                        >
                            Monthly
                        </button>
                        <button
                            onClick={() => setYearly(true)}
                            style={{
                                padding: '5px 14px',
                                borderRadius: '6px',
                                border: 'none',
                                fontSize: '12px',
                                fontWeight: 500,
                                cursor: 'pointer',
                                transition: 'background 150ms ease, color 150ms ease',
                                background: yearly ? 'var(--color-border)' : 'transparent',
                                color: yearly ? 'var(--color-text)' : 'var(--color-text-muted)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                            }}
                        >
                            Yearly
                            <span style={{
                                fontSize: '10px',
                                fontWeight: 600,
                                color: '#22c55e',
                                background: 'rgba(34,197,94,0.1)',
                                padding: '1px 6px',
                                borderRadius: '4px',
                            }}>
                                -20%
                            </span>
                        </button>
                    </div>
                </div>

                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                    gap: '12px',
                }}>
                    {PLANS.map((plan, i) => (
                        <PricingCard
                            key={plan.name}
                            plan={plan}
                            index={i}
                            yearly={yearly}
                            onCtaClick={(planName) => handleCtaClick(planName)}
                        />
                    ))}
                </div>

                <p style={{
                    textAlign: 'center',
                    fontSize: '11px',
                    color: 'var(--color-text-subtle)',
                    marginTop: '24px',
                }}>
                    No credit card required to start. Cancel anytime.
                </p>
            </div>
        </div>
    )
}