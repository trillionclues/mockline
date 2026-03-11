'use client'

import { useInView } from "@/app/hooks/useInView"
import { FEATURES } from "@/lib/data/Features"
import { FeatureCard } from "../cards/FeaturesCard"

export function FeaturesGrid() {
    const { ref: headingRef, inView: headingInView } = useInView(0.2)

    return (
        <section style={{
            padding: '96px 0',
            background: '#111114',
            borderTop: '1px solid #1a1a2e',
            borderBottom: '1px solid #1a1a2e',
        }}>
            <div style={{
                maxWidth: '1300px',
                margin: '0 auto',
                padding: '0 24px',
            }}>
                <div
                    ref={headingRef}
                    style={{
                        textAlign: 'center',
                        marginBottom: '56px',
                        opacity: headingInView ? 1 : 0,
                        transform: headingInView ? 'translateY(0)' : 'translateY(20px)',
                        transition: 'opacity 500ms ease, transform 500ms ease',
                    }}
                >
                    <h2 style={{
                        fontWeight: 700,
                        fontSize: 'clamp(24px, 3vw, 36px)',
                        color: '#e4e4e7',
                        letterSpacing: '-0.02em',
                        marginBottom: '10px',
                    }}>
                        Everything your team needs to move faster
                    </h2>
                    <p style={{
                        fontSize: '16px',
                        color: '#959598ff',
                        maxWidth: '420px',
                        margin: '0 auto',
                        lineHeight: 1.6,
                    }}>
                        Built for teams that refuse to wait on backend readiness.
                    </p>
                </div>

                <div
                    className="features-grid"
                    style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(3, 1fr)',
                        gap: '3px',
                        background: '#1a1a2e',
                        borderRadius: '8px',
                        overflow: 'hidden',
                        border: '1px solid #1a1a2e',
                    }}
                >
                    {FEATURES.map((feature, i) => (
                        <FeatureCard key={feature.num} feature={feature} index={i} />
                    ))}
                </div>
            </div>

            <style>{`
                .feature-card:hover {
                    background: #141418 !important;
                }
                .feature-card:hover .feature-card-accent {
                    opacity: 1 !important;
                }
                @media (max-width: 640px) {
                    .features-grid { grid-template-columns: 1fr !important; }
                }
                @media (min-width: 641px) and (max-width: 1024px) {
                    .features-grid { grid-template-columns: repeat(2, 1fr) !important; }
                }
            `}</style>
        </section>
    )
}