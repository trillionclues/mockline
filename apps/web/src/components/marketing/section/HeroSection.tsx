'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'

const ease = [0.21, 0.47, 0.32, 0.98] as const;

export const HeroSection = () => {
    const { resolvedTheme } = useTheme()
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    return (
        <div style={{ background: 'var(--color-bg)' }}>
            <section style={{
                position: 'relative',
                textAlign: 'center',
                overflow: 'hidden',
            }}>
                <div style={{
                    position: 'absolute',
                    width: '700px',
                    height: '700px',
                    background: 'radial-gradient(circle, rgba(242,227,187,0.07) 0%, transparent 70%)',
                    top: '-200px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    pointerEvents: 'none',
                    zIndex: 0,
                }} />

                <div style={{
                    position: 'relative',
                    zIndex: 5,
                    maxWidth: '1120px',
                    margin: '0 auto',
                    padding: '96px 24px 0',
                }}>

                    <motion.div
                        initial={{ opacity: 0, y: -12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, ease }}
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '6px 16px',
                            border: '1px solid var(--color-border)',
                            borderRadius: '999px',
                            fontSize: '12px',
                            fontWeight: 500,
                            color: 'var(--color-text-muted)',
                            marginBottom: '32px',
                            background: 'var(--color-primary-muted)',
                        }}
                    >
                        <span style={{
                            width: '6px',
                            height: '6px',
                            background: 'var(--color-logo-line)',
                            borderRadius: '50%',
                            display: 'inline-block',
                            animation: 'pulse 2s ease-in-out infinite',
                        }} />
                        Built for engineering teams
                    </motion.div>

                    <h1 style={{
                        fontWeight: 800,
                        fontSize: 'clamp(36px, 5vw, 64px)',
                        lineHeight: 1.15,
                        letterSpacing: '-0.03em',
                        marginBottom: '20px',
                    }}>
                        <motion.span
                            initial={{ opacity: 0, y: 24 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.1, ease }}
                            style={{ color: 'var(--color-text)', display: 'block' }}
                        >
                            Stop waiting for the backend.
                        </motion.span>
                        <motion.span
                            initial={{ opacity: 0, y: 24 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.2, ease }}
                            style={{ color: 'var(--color-primary)', display: 'block', }}
                        >
                            Ship against live mocks.
                        </motion.span>
                    </h1>

                    <motion.p
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.3, ease }}
                        style={{
                            fontSize: '17px',
                            color: 'var(--color-text)',
                            maxWidth: '520px',
                            margin: '0 auto 36px',
                            lineHeight: 1.7,
                        }}
                    >
                        Upload any OpenAPI spec and get an isolated mock server
                        with a public URL—shareable with your team.
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: 0.4, ease }}
                    >
                        <div style={{
                            display: 'flex',
                            justifyContent: 'center',
                            gap: '12px',
                            marginBottom: '16px',
                            flexWrap: 'wrap',
                        }}>
                            <Link
                                // href="/login?intent=register"
                                href="/waitlist"
                                className="nav-cta"
                                style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    height: '44px',
                                    padding: '0 24px',
                                    background: 'var(--color-primary)',
                                    color: 'var(--color-cta-text)',
                                    borderRadius: '6px',
                                    fontWeight: 600,
                                    fontSize: '14px',
                                    textDecoration: 'none',
                                    transition: 'opacity 120ms ease',
                                }}
                            >
                                {/* Get started free */}
                                Join waitlist
                            </Link>
                            <Link
                                href="https://github.com/trillionclues/mockline"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="pricing-cta-secondary"
                                style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    height: '44px',
                                    padding: '0 24px',
                                    background: 'transparent',
                                    color: 'var(--color-text)',
                                    borderRadius: '6px',
                                    fontWeight: 600,
                                    fontSize: '14px',
                                    textDecoration: 'none',
                                    border: '1px solid var(--color-border)',
                                    transition: 'border-color 120ms ease',
                                }}
                            >
                                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                                    <path d="M8 .2C3.6.2 0 3.8 0 8.2c0 3.5 2.3 6.5 5.5 7.6.4.1.5-.2.5-.4v-1.4c-2.2.5-2.7-1.1-2.7-1.1-.4-.9-.9-1.2-.9-1.2-.7-.5.1-.5.1-.5.8.1 1.2.8 1.2.8.7 1.2 1.9.9 2.3.7.1-.5.3-.9.5-1.1-1.8-.2-3.7-.9-3.7-4 0-.9.3-1.6.8-2.1-.1-.2-.4-1 .1-2.1 0 0 .7-.2 2.2.8.6-.2 1.3-.3 2-.3s1.4.1 2 .3c1.5-1 2.2-.8 2.2-.8.4 1.1.2 1.9.1 2.1.5.6.8 1.3.8 2.1 0 3.1-1.9 3.8-3.7 4 .3.3.6.8.6 1.5v2.2c0 .2.1.5.6.4C13.7 14.7 16 11.7 16 8.2 16 3.8 12.4.2 8 .2z" />
                                </svg>
                                Star on GitHub
                            </Link>
                        </div>

                        <p style={{
                            fontSize: '12px',
                            color: 'var(--color-text-muted)',
                        }}>
                            No credit card required. Free tier forever.
                        </p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 48 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.7, delay: 0.55, ease }}
                        style={{
                            position: 'relative',
                            maxWidth: '1000px',
                            margin: '60px auto 0',
                            zIndex: 5,
                        }}
                    >
                        <div style={{
                            background: 'var(--color-surface)',
                            border: '1px solid var(--color-border)',
                            borderRadius: '8px 8px 0 0',
                            overflow: 'hidden',
                            boxShadow: `0 20px 60px var(--color-shadow)`,
                        }}>
                            <div style={{
                                height: '32px',
                                background: 'var(--color-surface-2)',
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
                                width: '100%',
                                aspectRatio: '16/9',
                                background: 'var(--color-surface-2)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                position: 'relative',
                                // padding: '0 2px',
                            }}>
                                {mounted ? (
                                    <video
                                        src={resolvedTheme === 'dark' ? '/hero-dark.mp4' : '/hero-light.mp4'}
                                        autoPlay
                                        loop
                                        muted
                                        playsInline
                                        style={{
                                            width: '100%',
                                            height: '100%',
                                            objectFit: 'contain',
                                            display: 'block',
                                            borderRadius: '6px',
                                            boxShadow: '0 8px 30px rgba(0,0,0,0.1)'
                                        }}
                                    />
                                ) : (
                                    <div style={{ width: '100%', height: '100%', background: 'var(--color-surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <span style={{ fontSize: '13px', color: 'var(--color-text-subtle)' }}>Loading Preview...</span>
                                    </div>
                                )}
                            </div>
                            {/* <div style={{
                                position: 'relative',
                                width: '100%',
                                aspectRatio: '16/9',
                                background: 'var(--color-surface-2)',
                            }}>
                                <Image
                                    src="/images/dash-prev2.png"
                                    alt="Mockline Dashboard API Explorer Preview"
                                    fill
                                    priority
                                    style={{
                                        objectFit: 'cover',
                                        objectPosition: 'top',
                                    }}
                                />
                            </div> */}
                        </div>
                        <div style={{
                            height: '140px',
                            background: 'linear-gradient(to bottom, transparent, var(--color-bg))',
                            marginTop: '-140px',
                            position: 'relative',
                            zIndex: 1,
                            pointerEvents: 'none',
                        }} />
                    </motion.div>

                </div>
            </section>
        </div>
    )
}