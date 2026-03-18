'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { MocklineWordmark } from '../brand'
import { ThemeToggle } from '../theme-toggle'

export const Nav = () => {
    const [scrolled, setScrolled] = useState(false)

    useEffect(() => {
        const handler = () => setScrolled(window.scrollY > 8)
        window.addEventListener('scroll', handler, { passive: true })
        return () => window.removeEventListener('scroll', handler)
    }, [])

    return (
        <nav style={{
            position: 'sticky',
            top: 0,
            zIndex: 50,
            height: '70px',
            background: scrolled
                ? 'var(--color-nav-bg-scrolled)'
                : 'transparent',
            backdropFilter: scrolled ? 'blur(12px)' : 'none',
            WebkitBackdropFilter: scrolled ? 'blur(12px)' : 'none',
            borderBottom: scrolled
                ? '1px solid var(--color-border)'
                : '1px solid transparent',
            transition: 'background 200ms ease, border-color 200ms ease, backdrop-filter 200ms ease',
        }}>
            <div style={{
                maxWidth: '1300px',
                margin: '0 auto',
                padding: '0 48px',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
            }}>
                <Link href="/" style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    textDecoration: 'none',
                }}>
                    <MocklineWordmark size={20} />
                </Link>

                <div className="nav-center-links" style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '36px',
                }}>
                    <NavLink href="/docs">Docs</NavLink>
                    <NavLink href="/pricing">Pricing</NavLink>
                    <NavLink href="/changelog">Changelog</NavLink>
                    <NavLink href="/roadmap">Roadmap</NavLink>
                </div>

                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                }}>
                    <ThemeToggle />
                    {/* <Link
                        href="/login"
                        className="nav-signin-link nav-signin"
                        style={{
                            fontSize: '14px',
                            color: 'var(--color-nav-text)',
                            textDecoration: 'none',
                            transition: 'color 120ms ease',
                        }}
                    >
                        Sign in
                    </Link> */}
                    <Link
                        // href="/login?intent=register"
                        href="/waitlist"
                        className="nav-cta"
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            height: '38px',
                            padding: '0 18px',
                            background: 'var(--color-primary)',
                            color: 'var(--color-cta-text)',
                            borderRadius: '6px',
                            fontWeight: 600,
                            fontSize: '13px',
                            textDecoration: 'none',
                            transition: 'opacity 120ms ease',
                        }}
                    >
                        {/* Get started */}
                        Join waitlist
                    </Link>
                </div>
            </div>
        </nav>
    )
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
    return (
        <Link
            href={href}
            className="nav-link"
            style={{
                fontSize: '14px',
                color: 'var(--color-nav-text)',
                textDecoration: 'none',
                transition: 'color 120ms ease',
                fontWeight: 500,
            }}
        >
            {children}
        </Link>
    )
}