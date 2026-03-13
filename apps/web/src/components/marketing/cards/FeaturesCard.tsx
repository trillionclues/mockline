"use client"
import { useInView } from "@/app/hooks/useInView";
import { FEATURES } from "@/lib/data/Features";

export const FeatureCard = ({ feature, index }: { feature: typeof FEATURES[0]; index: number }) => {
    const { ref, inView } = useInView(0.05)
    const row = Math.floor(index / 3)

    return (
        <div
            ref={ref}
            className="feature-card"
            style={{
                background: 'var(--color-surface)',
                padding: '28px',
                position: 'relative',
                cursor: 'default',
                opacity: inView ? 1 : 0,
                transform: inView ? 'translateY(0)' : 'translateY(24px)',
                transition: `opacity 500ms ease, transform 500ms ease, background 200ms ease`,
                transitionDelay: `${(index % 3) * 80 + row * 40}ms`,
            }}
        >
            <div className="feature-card-accent" style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '1px',
                background: 'linear-gradient(90deg, transparent, rgba(242,227,187,0.4), transparent)',
                opacity: 0,
                transition: 'opacity 200ms ease',
            }} />

            <div style={{
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                marginBottom: '20px',
            }}>
                <div style={{
                    width: '36px',
                    height: '36px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'var(--color-primary-muted)',
                    borderRadius: '6px',
                    border: '1px solid var(--color-border-highlight)',
                }}>
                    {feature.icon}
                </div>
                <span style={{
                    fontSize: '11px',
                    color: 'var(--color-nav-text)',
                    letterSpacing: '0.05em',
                }}>
                    {feature.num}
                </span>
            </div>

            <h3 style={{
                fontWeight: 600,
                fontSize: '15px',
                color: 'var(--color-text)',
                marginBottom: '8px',
                letterSpacing: '-0.01em',
            }}>
                {feature.title}
            </h3>
            <p style={{
                fontSize: '13px',
                color: 'var(--color-text-muted)',
                lineHeight: 1.65,
            }}>
                {feature.body}
            </p>
        </div>
    )
}