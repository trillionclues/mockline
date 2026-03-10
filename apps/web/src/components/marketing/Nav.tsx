'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { MocklineWordmark } from '../brand'

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
                ? 'rgba(10, 10, 11, 0.85)'
                : 'transparent',
            backdropFilter: scrolled ? 'blur(12px)' : 'none',
            WebkitBackdropFilter: scrolled ? 'blur(12px)' : 'none',
            borderBottom: scrolled
                ? '1px solid #1a1a2e'
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
                    <NavLink href="#pricing">Pricing</NavLink>
                    <NavLink href="/changelog">Changelog</NavLink>
                </div>

                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '20px',
                }}>
                    <Link
                        href="/login"
                        className="nav-signin-link nav-signin"
                        style={{
                            fontFamily: 'Inter, -apple-system, sans-serif',
                            fontSize: '14px',
                            color: '#959598ff',
                            textDecoration: 'none',
                            transition: 'color 120ms ease',
                        }}
                    >
                        Sign in
                    </Link>
                    <Link
                        href="/login?intent=register"
                        className="nav-cta"
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            height: '38px',
                            padding: '0 18px',
                            background: '#F2E3BB',
                            color: '#0a0a0b',
                            borderRadius: '6px',
                            fontFamily: 'Inter, -apple-system, sans-serif',
                            fontWeight: 600,
                            fontSize: '13px',
                            textDecoration: 'none',
                            transition: 'opacity 120ms ease',
                        }}
                    >
                        Get started
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
                fontFamily: 'Inter, -apple-system, sans-serif',
                fontSize: '14px',
                color: '#959598ff',
                textDecoration: 'none',
                transition: 'color 120ms ease',
                fontWeight: 500,
            }}
        >
            {children}
        </Link>
    )
}