import { LOGOS } from '@/lib/data/data'
import React from 'react'

export const LogoMarquee = () => {
    const items = [...LOGOS, ...LOGOS]

    return (
        <section style={{
            maxWidth: '1300px',
            margin: '0 auto',
            padding: '48px 0',
            borderTop: '1px solid var(--color-border)',
            borderBottom: '1px solid var(--color-border)',
            position: 'relative',
            overflow: 'hidden',
        }}>
            <p style={{
                fontSize: '11px',
                color: 'var(--color-text-muted)',
                textAlign: 'center',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                marginBottom: '65px',
            }}>
                Trusted by teams who ship fast
            </p>
            <div style={{ position: 'relative' }}>
                <div style={{
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    width: '120px',
                    height: '100%',
                    background: 'linear-gradient(to right, var(--color-bg), transparent)',
                    zIndex: 2,
                    pointerEvents: 'none',
                }} />

                <div style={{
                    position: 'absolute',
                    right: 0,
                    top: 0,
                    width: '120px',
                    height: '100%',
                    background: 'linear-gradient(to left, var(--color-bg), transparent)',
                    zIndex: 2,
                    pointerEvents: 'none',
                }} />

                <div
                    className="marquee-track"
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0',
                        width: 'max-content',
                        animation: 'marquee 28s linear infinite',
                    }}
                >
                    {items.map((name, i) => (
                        <div
                            key={i}
                            className="marquee-item"
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0',
                                flexShrink: 0,
                            }}
                        >
                            <span style={{
                                fontWeight: 600,
                                fontSize: '18px',
                                color: 'var(--color-text-subtle)',
                                padding: '0 36px',
                                transition: 'color 200ms ease',
                                whiteSpace: 'nowrap',
                                cursor: 'default',
                            }}
                                className="marquee-logo"
                            >
                                {name}
                            </span>

                            <span style={{
                                width: '3px',
                                height: '3px',
                                borderRadius: '50%',
                                background: 'var(--color-border)',
                                flexShrink: 0,
                            }} />
                        </div>
                    ))}
                </div>
            </div>
            <style>{`
        @keyframes marquee {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }

        .marquee-track:hover {
          animation-play-state: paused;
        }

        .marquee-logo:hover {
          color: var(--color-text-muted) !important;
        }
      `}</style>
        </section>
    )
}
