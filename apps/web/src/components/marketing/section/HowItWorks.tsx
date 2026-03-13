"use client"

import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { STEPS } from "@/lib/data/data"

const ease = [0.21, 0.47, 0.32, 0.98] as const

function CodeBlock({ lines }: {
    lines: { text: string; color: string; indent?: boolean }[]
}) {
    return (
        <div style={{
            background: 'var(--color-bg)',
            border: '1px solid var(--color-border)',
            borderRadius: '8px',
            overflow: 'hidden',
        }}>
            <div style={{
                height: '32px',
                background: 'var(--color-surface)',
                borderBottom: '1px solid var(--color-border)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                paddingLeft: '14px',
            }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ef4444' }} />
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#C0B87A' }} />
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#22c55e' }} />
            </div>
            <div style={{
                padding: '20px 24px',
                fontSize: '13px',
                lineHeight: 1.9,
            }}>
                {lines.map((line, i) => (
                    <div key={i} style={{
                        color: line.color,
                        paddingLeft: line.indent ? '16px' : '0',
                    }}>
                        {line.text}
                    </div>
                ))}
            </div>
        </div>
    )
}

function Step({ step, index }: { step: typeof STEPS[0]; index: number }) {
    const ref = useRef<HTMLDivElement>(null)
    const inView = useInView(ref, { once: true, margin: '-60px' })

    const textVariants = {
        hidden: { opacity: 0, y: 28 },
        visible: (delay: number) => ({
            opacity: 1,
            y: 0,
            transition: { duration: 0.55, delay, ease },
        }),
    }

    return (
        <div
            ref={ref}
            className="hiw-step"
            style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '72px',
                alignItems: 'center',
                marginBottom: index < STEPS.length - 1 ? '96px' : '0',
            }}
        >
            <div
                className={step.reversed ? 'hiw-text hiw-text-reversed' : 'hiw-text'}
                style={{ order: step.reversed ? 2 : 1 }}
            >
                <motion.span
                    variants={textVariants}
                    initial="hidden"
                    animate={inView ? 'visible' : 'hidden'}
                    custom={0}
                    style={{
                        fontWeight: 800,
                        fontSize: '72px',
                        color: 'var(--color-border)',
                        lineHeight: 1,
                        display: 'block',
                        letterSpacing: '-0.03em',
                    }}
                >
                    {step.number}
                </motion.span>

                <motion.h3
                    variants={textVariants}
                    initial="hidden"
                    animate={inView ? 'visible' : 'hidden'}
                    custom={0.08}
                    style={{
                        fontWeight: 700,
                        fontSize: '22px',
                        color: 'var(--color-text)',
                        marginTop: '-12px',
                        letterSpacing: '-0.02em',
                    }}
                >
                    {step.title}
                </motion.h3>

                <motion.p
                    variants={textVariants}
                    initial="hidden"
                    animate={inView ? 'visible' : 'hidden'}
                    custom={0.16}
                    style={{
                        fontSize: '15px',
                        color: 'var(--color-text-muted)',
                        lineHeight: 1.7,
                        marginTop: '12px',
                        maxWidth: '340px',
                    }}
                >
                    {step.body}
                </motion.p>
            </div>

            <motion.div
                initial={{ opacity: 0, x: step.reversed ? -24 : 24 }}
                animate={inView ? { opacity: 1, x: 0 } : {}}
                transition={{ duration: 0.6, delay: 0.1, ease }}
                style={{ order: step.reversed ? 1 : 2 }}
            >
                <CodeBlock lines={step.lines} />
            </motion.div>
        </div>
    )
}

export function HowItWorks() {
    const headingRef = useRef<HTMLDivElement>(null)
    const headingInView = useInView(headingRef, { once: true, margin: '-40px' })

    return (
        <section style={{ padding: '96px 0' }}>
            <div style={{
                maxWidth: '1300px',
                margin: '0 auto',
                padding: '0 24px',
            }}>
                <motion.div
                    ref={headingRef}
                    initial={{ opacity: 0, y: 20 }}
                    animate={headingInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.5, ease }}
                    style={{
                        textAlign: 'center',
                        marginBottom: '72px',
                    }}
                >
                    <h2 style={{
                        fontWeight: 700,
                        fontSize: 'clamp(24px, 3vw, 36px)',
                        color: 'var(--color-text)',
                        letterSpacing: '-0.02em',
                        marginBottom: '10px',
                    }}>
                        From spec to live mock in three steps
                    </h2>
                    <p style={{
                        fontSize: '16px',
                        color: 'var(--color-text-muted)',
                        maxWidth: '440px',
                        margin: '0 auto',
                        lineHeight: 1.6,
                    }}>
                        No infrastructure to manage. No config files.
                        Upload spec, provision container, share remote URL.
                    </p>
                </motion.div>

                {STEPS.map((step, i) => (
                    <Step key={step.number} step={step} index={i} />
                ))}
            </div>

            <style>{`
                @media (max-width: 768px) {
                    .hiw-step {
                        grid-template-columns: 1fr !important;
                        gap: 28px !important;
                        margin-bottom: 64px !important;
                    }
                    .hiw-text { order: 1 !important; }
                    .hiw-text-reversed { order: 1 !important; }
                    .hiw-step > div:last-child { order: 2 !important; }
                    .hiw-step > div:first-child { order: 2 !important; }
                }
            `}</style>
        </section>
    )
}