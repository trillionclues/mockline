'use client'

import { useState } from 'react'
import { PLANS } from '@/lib/data/data'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { Spinner } from '@/components/shared/Spinner'

function CheckIcon() {
    return (
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M2.5 7L5.5 10L11.5 4" stroke="#22c55e" strokeWidth="1.5"
                strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    )
}

function CrossIcon() {
    return (
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M4 4L10 10M10 4L4 10" stroke="var(--color-border)" strokeWidth="1.5"
                strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    )
}

export const PricingCard = ({
    plan,
    index,
    yearly,
    onCtaClick,
}: {
    plan: typeof PLANS[0]
    index: number
    yearly: boolean
    onCtaClick?: (planName: string) => Promise<void> | void
}) => {
    const [isLoading, setIsLoading] = useState(false)
    
    const price = yearly ? plan.yearlyPrice : plan.monthlyPrice
    const period = plan.monthlyPrice === 0 ? 'forever' : yearly ? '/ month, billed yearly' : '/ month'

    const ctaStyle = {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '40px',
        borderRadius: '6px',
        fontWeight: 600,
        fontSize: '13px',
        textDecoration: 'none',
        transition: 'opacity 120ms ease, background 120ms ease',
        cursor: 'pointer',
        border: 'none',
        width: '100%',
        ...(plan.highlighted
            ? { background: 'var(--color-logo-line)', color: 'var(--color-bg)' }
            : { background: 'transparent', color: 'var(--color-text)', border: '1px solid var(--color-border)' }),
    }

    // if team, it should be contact us
    const ctaLabel = onCtaClick
        ? plan.monthlyPrice === 0 ? 'Current plan' : plan.name === 'Team' ? 'Contact us' : `Upgrade to ${plan.name}`
        : plan.cta

    return (
        <motion.div
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
                duration: 0.5,
                delay: index * 0.1,
                ease: [0.21, 0.47, 0.32, 0.98],
            }}
            whileHover={!plan.highlighted ? { y: -4, transition: { duration: 0.2 } } : {}}
            style={{
                position: 'relative',
                background: plan.highlighted ? 'var(--color-surface-2)' : 'var(--color-surface)',
                border: plan.highlighted
                    ? '1px solid var(--color-logo-line)'
                    : '1px solid var(--color-border)',
                borderRadius: '8px',
                padding: '32px 28px',
                display: 'flex',
                flexDirection: 'column',
            }}
        >
            {plan.highlighted && (
                <div style={{
                    position: 'absolute',
                    top: '-1px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: 'var(--color-logo-line)',
                    color: 'var(--color-bg)',
                    fontWeight: 600,
                    fontSize: '10px',
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    padding: '3px 10px',
                    borderRadius: '0 0 6px 6px',
                }}>
                    Most popular
                </div>
            )}

            <div style={{ marginBottom: '24px' }}>
                <div style={{
                    fontWeight: 500,
                    fontSize: '13px',
                    color: plan.highlighted ? 'var(--color-logo-line)' : 'var(--color-text-strong)',
                    marginBottom: '6px',
                }}>
                    {plan.name}
                </div>
                <div style={{
                    fontSize: '12px',
                    color: 'var(--color-text)',
                    lineHeight: 1.5,
                }}>
                    {plan.description}
                </div>
            </div>

            <div style={{
                display: 'flex',
                alignItems: 'flex-end',
                gap: '4px',
                marginBottom: '6px',
            }}>
                <AnimatePresence mode="wait">
                    <motion.span
                        key={price}
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 8 }}
                        transition={{ duration: 0.2 }}
                        style={{
                            fontWeight: 700,
                            fontSize: '40px',
                            color: 'var(--color-text-strong)',
                            lineHeight: 1,
                            letterSpacing: '-0.03em',
                        }}
                    >
                        {plan.monthlyPrice === 0 ? '$0' : `$${price}`}
                    </motion.span>
                </AnimatePresence>
            </div>
            <div style={{
                fontSize: '12px',
                color: 'var(--color-text)',
                marginBottom: '28px',
                minHeight: '16px',
            }}>
                {period}
                {yearly && plan.monthlyPrice > 0 && (
                    <span style={{ color: '#22c55e', marginLeft: '6px' }}>
                        Save ${((plan.monthlyPrice - plan.yearlyPrice) * 12).toFixed(2)}/yr
                    </span>
                )}
            </div>

            <div style={{
                height: '1px',
                background: 'var(--color-border)',
                marginBottom: '24px',
            }} />

            <ul style={{
                listStyle: 'none',
                padding: 0,
                margin: '0 0 32px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                flex: 1,
            }}>
                {plan.features.map((feature, i) => (
                    <motion.li
                        key={feature.text}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 + i * 0.04 + 0.2 }}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            fontSize: '13px',
                            color: feature.included ? 'var(--color-text)' : 'var(--color-text-subtle)',
                        }}
                    >
                        <span style={{ flexShrink: 0 }}>
                            {feature.included ? <CheckIcon /> : <CrossIcon />}
                        </span>
                        {feature.text}
                    </motion.li>
                ))}
            </ul>

            {onCtaClick ? (
                <button
                    onClick={async () => {
                        setIsLoading(true)
                        await onCtaClick(plan.name)
                        setIsLoading(false)
                    }}
                    disabled={plan.monthlyPrice === 0 || isLoading}
                    style={{
                        ...ctaStyle,
                        opacity: (plan.monthlyPrice === 0 || isLoading) ? 0.7 : 1,
                        cursor: (plan.monthlyPrice === 0 || isLoading) ? 'not-allowed' : 'pointer',
                    }}
                    className={plan.highlighted ? 'pricing-cta-primary' : 'pricing-cta-secondary'}
                >
                    {isLoading ? <Spinner size={14} color={plan.highlighted ? 'var(--color-bg)' : 'var(--color-logo-line)'} /> : ctaLabel}
                </button>
            ) : (
                <Link
                    href={plan.ctaHref}
                    style={ctaStyle}
                    className={plan.highlighted ? 'pricing-cta-primary' : 'pricing-cta-secondary'}
                >
                    {plan.cta}
                </Link>
            )}
        </motion.div>
    )
}