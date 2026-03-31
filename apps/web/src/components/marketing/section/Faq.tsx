'use client'

import { useState, useRef } from 'react'
import { motion, useInView, AnimatePresence } from 'framer-motion'
import { Plus, Minus } from 'lucide-react'
import { FAQS } from '@/lib/data/data'

export function Faq() {
    const sectionRef = useRef<HTMLElement>(null)
    const isInView = useInView(sectionRef, { once: true, margin: '-80px' })
    const [openIndex, setOpenIndex] = useState<number | null>(null)

    return (
        <section ref={sectionRef} style={{ padding: '96px 0', background: 'var(--color-bg)' }}>
            <div style={{ maxWidth: '800px', margin: '0 auto', padding: '0 24px' }}>
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.5 }}
                    style={{ textAlign: 'center', marginBottom: '48px' }}
                >
                    <h2 style={{
                        fontSize: 'clamp(28px, 4vw, 36px)',
                        fontWeight: 700,
                        color: 'var(--color-text-strong)',
                        letterSpacing: '-0.02em',
                        marginBottom: '16px',
                    }}>
                        Frequently Asked Questions
                    </h2>
                    <p style={{
                        fontSize: '16px',
                        color: 'var(--color-text-subtitle)',
                    }}>
                        Everything you need to know about how Mockline works.
                    </p>
                </motion.div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {FAQS.map((faq, index) => {
                        const isOpen = openIndex === index
                        return (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 10 }}
                                animate={isInView ? { opacity: 1, y: 0 } : {}}
                                transition={{ duration: 0.4, delay: 0.1 + index * 0.05 }}
                                style={{
                                    border: '1px solid var(--color-border)',
                                    borderRadius: '8px',
                                    background: 'var(--color-surface)',
                                    overflow: 'hidden',
                                }}
                            >
                                <button
                                    onClick={() => setOpenIndex(isOpen ? null : index)}
                                    style={{
                                        width: '100%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        padding: '20px 24px',
                                        background: 'transparent',
                                        border: 'none',
                                        cursor: 'pointer',
                                        textAlign: 'left',
                                        color: 'var(--color-text-strong)',
                                        fontSize: '15px',
                                        fontWeight: 500,
                                    }}
                                >
                                    {faq.q}
                                    <span style={{
                                        color: 'var(--color-text-muted)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        width: '24px',
                                        height: '24px',
                                        borderRadius: '50%',
                                        background: isOpen ? 'var(--color-surface-2)' : 'transparent',
                                        transition: 'background 0.2s ease',
                                    }}>
                                        {isOpen ? <Minus size={16} /> : <Plus size={16} />}
                                    </span>
                                </button>

                                <AnimatePresence initial={false}>
                                    {isOpen && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.3, ease: 'easeInOut' }}
                                        >
                                            <div style={{
                                                padding: '0 24px 20px',
                                                color: 'var(--color-text)',
                                                fontSize: '14px',
                                                lineHeight: 1.6,
                                            }}>
                                                {faq.a.split('`').map((part, i) =>
                                                    i % 2 === 1
                                                        ? <code key={i} style={{
                                                            fontFamily: 'var(--font-family-mono)',
                                                            fontSize: '12px',
                                                            background: 'var(--color-surface-2)',
                                                            padding: '2px 4px',
                                                            borderRadius: '4px',
                                                            color: 'var(--color-text-strong)'
                                                        }}>{part}</code>
                                                        : part
                                                )}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        )
                    })}
                </div>
            </div>
        </section>
    )
}
