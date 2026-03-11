'use client'

import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import Link from 'next/link'
import { MocklineWordmark } from '../brand'
import { COLUMNS } from '@/lib/data/data'

const ease = [0.21, 0.47, 0.32, 0.98] as const

export const Footer = () => {
    const ref = useRef<HTMLElement>(null)
    const inView = useInView(ref, { once: true, margin: '-40px' })

    return (
        <footer ref={ref} style={{
            background: '#111114',
            borderTop: '1px solid #1a1a2e',
            padding: '56px 0 32px',
        }}>
            <div style={{
                maxWidth: '1120px',
                margin: '0 auto',
                padding: '0 24px',
            }}>
                <div className="footer-grid" style={{
                    display: 'grid',
                    gridTemplateColumns: '2fr 1fr 1fr 1fr',
                    gap: '48px',
                }}>
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        animate={inView ? { opacity: 1, y: 0 } : {}}
                        transition={{ duration: 0.5, delay: 0, ease }}
                    >
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            marginBottom: '12px',
                        }}>
                            {/* <MocklineLogo /> */}
                            <MocklineWordmark size={20} />
                        </div>
                        <p style={{
                            fontSize: '13px',
                            color: '#959598ff',
                            maxWidth: '200px',
                            lineHeight: 1.6,
                        }}>
                            Provision live mock servers from any OpenAPI spec.
                        </p>

                        <div className='flex gap-3'>
                            <Link
                                href="https://github.com/trillionclues/mockline"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="footer-github-link"
                                style={{
                                    display: 'inline-block',
                                    marginTop: '16px',
                                    color: '#71717a',
                                    transition: 'color 120ms ease',
                                }}
                            >
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                                </svg>
                            </Link>
                            <Link
                                href="https://www.npmjs.com/package/@trillionclues/contour"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="footer-npm-link"
                                style={{
                                    display: 'inline-block',
                                    marginTop: '16px',
                                    color: '#71717a',
                                    transition: 'color 120ms ease',
                                }}
                            >
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M0 7.334v8h6.666v1.333H12V15.334h12v-8H0zm6.666 6.666H5.333V8.667h-1.333v5.333H1.333v-5.333h4v6.667zm6.667 0h-1.333v1.333H9.333V8.667h4v5.333zm8-1.333h-1.333v1.333h-1.333v-1.333h-1.334v1.333H14.667V8.667h8v5.333zM12 11.334h-1.333v2.667H12v-2.667zM21.333 10h-1.333v4h1.333V10zm-2.666 0h-1.334v4h1.334V10z" />
                                </svg>


                            </Link>
                        </div>
                    </motion.div>
                    {COLUMNS.map((col, i) => (
                        <motion.div
                            key={col.label}
                            initial={{ opacity: 0, y: 16 }}
                            animate={inView ? { opacity: 1, y: 0 } : {}}
                            transition={{ duration: 0.5, delay: (i + 1) * 0.07, ease }}
                        >
                            <div style={{
                                fontSize: '12px',
                                color: '#71717a',
                                marginBottom: '14px',
                                fontWeight: 500,
                            }}>
                                {col.label}
                            </div>
                            {col.links.map((link) => (
                                <FooterLink key={link.label} href={link.href}>
                                    {link.label}
                                </FooterLink>
                            ))}
                        </motion.div>
                    ))}
                </div>
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={inView ? { opacity: 1 } : {}}
                    transition={{ duration: 0.5, delay: 0.35, ease }}
                    style={{
                        borderTop: '1px solid #1a1a2e',
                        marginTop: '40px',
                        paddingTop: '24px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                    }}
                >
                    <span style={{ fontSize: '12px', color: '#959598ff', }}>
                        © {new Date().getFullYear()} Mockline
                    </span>

                    <Link
                        href="https://www.npmjs.com/package/@trillionclues/contour"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="footer-built-link"
                        style={{
                            fontSize: '12px',
                            color: '#959598ff',
                            textDecoration: 'none',
                            transition: 'color 120ms ease',
                        }}
                    >
                        Built on Contour CLI
                    </Link>
                </motion.div>
            </div>

            <style>{`
                @media (max-width: 768px) {
                    .footer-grid {
                        grid-template-columns: 1fr 1fr !important;
                        gap: 32px !important;
                    }
                }
                @media (max-width: 480px) {
                    .footer-grid {
                        grid-template-columns: 1fr !important;
                    }
                }
            `}</style>
        </footer>
    )
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
    const isExternal = href.startsWith('http')
    const style: React.CSSProperties = {
        fontSize: '13px',
        color: '#959598ff',
        textDecoration: 'none',
        display: 'block',
        marginBottom: '10px',
        transition: 'color 120ms ease',
    }
    if (isExternal) return (
        <Link href={href} target="_blank" rel="noopener noreferrer"
            className="footer-link" style={style}>
            {children}
        </Link>
    )
    return <Link href={href} className="footer-link" style={style}>{children}</Link>
}