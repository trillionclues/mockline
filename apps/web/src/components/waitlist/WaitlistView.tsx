'use client'
import { useState } from 'react'
import { MocklineWordmark } from '@/components/brand'
import Link from 'next/link'
import { SuccessState } from './SuccessState'

type FormState = 'idle' | 'loading' | 'success' | 'error'

export function WaitlistView() {
    const [email, setEmail] = useState('')
    const [name, setName] = useState('')
    const [state, setState] = useState<FormState>('idle')
    const [errorMessage, setErrorMessage] = useState('')

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!email.trim() || state === 'loading') return

        setState('loading')
        setErrorMessage('')

        try {
            const res = await fetch('/api/waitlist', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: email.trim(), name: name.trim() || undefined }),
            })

            const data = await res.json()

            if (!res.ok) {
                setErrorMessage(data.error ?? 'Something went wrong.')
                setState('error')
                return
            }

            setState('success')
        } catch {
            setErrorMessage('Network error. Please try again.')
            setState('error')
        }
    }

    return (

        <div style={{
            minHeight: '100vh',
            background: 'var(--color-bg)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '48px 24px',
            position: 'relative',
            overflowX: 'hidden',
        }}>

            <div style={{
                position: 'absolute',
                top: 0,
                left: '50%',
                transform: 'translateX(-50%)',
                width: '100%',
                maxWidth: '600px',
                height: '400px',
                background: 'radial-gradient(ellipse at center top, rgba(242,227,187,0.06), transparent 70%)',
                pointerEvents: 'none',
            }} />

            <div style={{ marginBottom: '48px', position: 'relative' }}>
                <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
                    <MocklineWordmark size={20} />
                </Link>
            </div>
            <div style={{
                width: '100%',
                maxWidth: '480px',
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: '12px',
                padding: '30px',
                position: 'relative',
            }}>
                {state === 'success' ? (
                    <SuccessState email={email} />
                ) : (
                    <>
                        <div style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '4px 10px',
                            background: 'var(--color-primary-muted)',
                            border: '1px solid var(--color-border-highlight)',
                            borderRadius: '100px',
                            fontSize: '11px',
                            fontWeight: 500,
                            color: 'var(--color-nav-text)',
                            marginBottom: '20px',
                        }}>
                            <span style={{
                                width: '5px',
                                height: '5px',
                                borderRadius: '50%',
                                background: 'var(--color-nav-text)',
                                animation: 'pulse 2s ease-in-out infinite',
                            }} />
                            Early access
                        </div>

                        <h1 style={{
                            fontSize: '26px',
                            fontWeight: 700,
                            color: 'var(--color-text-strong)',
                            letterSpacing: '-0.02em',
                            lineHeight: 1.2,
                            marginBottom: '12px',
                        }}>
                            Skip the backend queue.
                        </h1>

                        <p style={{
                            fontSize: '14px',
                            color: 'var(--color-text)',
                            lineHeight: 1.6,
                            marginBottom: '24px',
                        }}>
                            Mockline turns your OpenAPI spec into a live mock server in seconds.
                            Be first to know when we launch!
                        </p>

                        <form onSubmit={handleSubmit} style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '15px',
                            marginBottom: '4px',
                        }}>
                            <input
                                type="text"
                                placeholder="Your name (optional)"
                                value={name}
                                onChange={e => setName(e.target.value)}
                                disabled={state === 'loading'}
                                style={{
                                    height: '42px',
                                    padding: '0 12px',
                                    borderRadius: '6px',
                                    border: '1px solid var(--color-border)',
                                    background: 'transparent',
                                    color: 'var(--color-text)',
                                    fontSize: '16px',
                                    outline: 'none',
                                }}
                                onFocus={e => (e.target.style.borderColor = 'var(--color-primary)')}
                                onBlur={e => (e.target.style.borderColor = 'var(--color-border)')}
                            />

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <input
                                    type="email"
                                    placeholder="you@company.com"
                                    value={email}
                                    onChange={e => {
                                        setEmail(e.target.value)
                                        if (state === 'error') setState('idle')
                                    }}
                                    required
                                    autoFocus={state === 'error'}
                                    disabled={state === 'loading'}
                                    style={{
                                        height: '42px',
                                        padding: '0 12px',
                                        borderRadius: '6px',
                                        border: `1px solid ${state === 'error'
                                            ? 'var(--color-destructive)'
                                            : 'var(--color-border)'
                                            }`,
                                        background: 'transparent',
                                        color: 'var(--color-text)',
                                        fontSize: '16px',
                                        outline: 'none',
                                    }}
                                    onFocus={e => (e.target.style.borderColor = 'var(--color-primary)')}
                                    onBlur={e =>
                                    (e.target.style.borderColor =
                                        state === 'error'
                                            ? 'var(--color-destructive)'
                                            : 'var(--color-border)')
                                    }
                                />

                                {state === 'error' && errorMessage && (
                                    <span
                                        style={{
                                            fontSize: '12px',
                                            color: 'var(--color-destructive)',
                                        }}
                                    >
                                        {errorMessage}
                                    </span>
                                )}
                            </div>

                            <button
                                type="submit"
                                disabled={!email.trim() || state === 'loading'}
                                style={{
                                    height: '44px',
                                    background: 'var(--color-primary)',
                                    color: 'var(--color-bg)',
                                    border: 'none',
                                    borderRadius: '6px',
                                    fontWeight: 600,
                                    fontSize: '14px',
                                    cursor:
                                        !email.trim() || state === 'loading'
                                            ? 'not-allowed'
                                            : 'pointer',
                                    opacity:
                                        !email.trim() || state === 'loading' ? 0.5 : 1,
                                    transition: 'all 120ms ease',
                                    marginTop: '2px',
                                }}
                            >
                                {state === 'loading' ? 'Joining...' : 'Get early access'}
                            </button>
                        </form>

                        <p style={{
                            fontSize: '11px',
                            color: 'var(--color-text-subtle)',
                            textAlign: 'center',
                            marginTop: '16px',
                        }}>
                            No spam. One email when we launch.
                        </p>
                    </>
                )}
            </div>

            <div style={{
                marginTop: '32px',
                display: 'flex',
                gap: '20px',
                fontSize: '12px',
                color: 'var(--color-text-subtle)',
            }}>
                <Link href="/" style={{ color: 'var(--color-nav-text)', textDecoration: 'none' }}
                    className="waitlist-footer-link">
                    Home
                </Link>
                <Link href="/privacy" style={{ color: 'var(--color-nav-text)', textDecoration: 'none' }}
                    className="waitlist-footer-link">
                    Privacy
                </Link>
                <a href="https://github.com/trillionclues/mockline" target="_blank" rel="noopener noreferrer"
                    style={{ color: 'var(--color-nav-text)', textDecoration: 'none' }}
                    className="waitlist-footer-link">
                    GitHub
                </a>
            </div>
        </div>
    )
}

