'use client'

import { useState, useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { PricingCard } from '../cards/PricingCard'
import { PLANS } from '@/lib/data/data'



export function Pricing() {
    const [yearly, setYearly] = useState(false)
    const sectionRef = useRef<HTMLDivElement>(null)
    const isInView = useInView(sectionRef, { once: true, margin: '-80px' })

    return (
        <section style={{ padding: '96px 0' }} ref={sectionRef}>
            <div style={{
                maxWidth: '1300px',
                margin: '0 auto',
                padding: '0 24px',
            }}>
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.5 }}
                    style={{ textAlign: 'center', marginBottom: '48px' }}
                >

                    <p style={{
                        fontSize: '16px',
                        color: 'var(--color-text-muted)',
                        marginBottom: '28px',
                    }}>
                        Start free. Scale when you need to.
                    </p>

                    <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '4px',
                        background: 'var(--color-surface)',
                        border: '1px solid var(--color-border)',
                        borderRadius: '8px',
                    }}>
                        <button
                            onClick={() => setYearly(false)}
                            style={{
                                padding: '6px 16px',
                                borderRadius: '6px',
                                border: 'none',
                                fontSize: '13px',
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
                                padding: '6px 16px',
                                borderRadius: '6px',
                                border: 'none',
                                fontSize: '13px',
                                fontWeight: 500,
                                cursor: 'pointer',
                                transition: 'background 150ms ease, color 150ms ease',
                                background: yearly ? 'var(--color-border)' : 'transparent',
                                color: yearly ? 'var(--color-text)' : 'var(--color-text-muted)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
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
                </motion.div>

                {isInView && (
                    <div
                        className="pricing-grid"
                        style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(3, 1fr)',
                            gap: '16px',
                            alignItems: 'start',
                        }}
                    >
                        {PLANS.map((plan, i) => (
                            <PricingCard
                                key={plan.name}
                                plan={plan}
                                index={i}
                                yearly={yearly}
                            />
                        ))}
                    </div>
                )}

                <motion.p
                    initial={{ opacity: 0 }}
                    animate={isInView ? { opacity: 1 } : {}}
                    transition={{ delay: 0.6 }}
                    style={{
                        textAlign: 'center',
                        fontSize: '12px',
                        color: 'var(--color-text-subtle)',
                        marginTop: '32px',
                    }}
                >
                    No credit card required to start. Cancel anytime.
                </motion.p>
            </div>

            <style>{`
                .pricing-cta-primary:hover { opacity: 0.88 !important; }
                .pricing-cta-secondary:hover {
                    background: var(--color-border) !important;
                    border-color: var(--color-border-highlight) !important;
                }
                @media (max-width: 768px) {
                    .pricing-grid {
                        grid-template-columns: 1fr !important;
                        max-width: 400px !important;
                        margin: 0 auto !important;
                    }
                }
            `}</style>
        </section>
    )
}