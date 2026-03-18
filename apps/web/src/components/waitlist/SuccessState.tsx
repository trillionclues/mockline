import Link from 'next/link'
import React from 'react'

export const SuccessState = ({ email }: { email: string }) => {
    return (
        <div style={{ textAlign: 'center', padding: '8px 0' }}>
            <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                background: 'rgba(34,197,94,0.1)',
                border: '1px solid rgba(34,197,94,0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 20px',
            }}>
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path d="M4 10L8 14L16 6" stroke="#22c55e" strokeWidth="2"
                        strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            </div>

            <h2 style={{
                fontSize: '20px',
                fontWeight: 700,
                color: 'var(--color-text-strong)',
                letterSpacing: '-0.02em',
                marginBottom: '8px',
            }}>
                You're on the list.
            </h2>

            <p style={{
                fontSize: '14px',
                color: 'var(--color-text)',
                lineHeight: 1.6,
                marginBottom: '8px',
            }}>
                We'll send a confirmation to{' '}
                <span style={{ color: 'var(--color-logo-line)', fontWeight: 500 }}>{email}</span>.
            </p>

            <p style={{
                fontSize: '13px',
                color: 'var(--color-nav-text)',
                lineHeight: 1.6,
                marginBottom: '28px',
            }}>
                We'll reach out when early access opens.
            </p>

            <Link href="/" style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '13px',
                color: 'var(--color-text)',
                textDecoration: 'none',
                border: '1px solid var(--color-border)',
                borderRadius: '6px',
                padding: '8px 16px',
                transition: 'border-color 120ms ease',
            }}
                className="waitlist-back-btn"
            >
                ← Back to home
            </Link>
        </div>

    )
}
