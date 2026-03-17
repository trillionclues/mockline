import { CONSIDERING, IN_PROGRESS, PLANNED, SHIPPED } from '@/lib/data/roadmap';
import type { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Roadmap | Mockline',
    description: 'What we\'re working on and what\'s coming next for Mockline.',
}

function StatusDot({ color, pulse }: { color: string; pulse?: boolean }) {
    return (
        <span
            style={{
                display: 'inline-block',
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: color,
                flexShrink: 0,
                animation: pulse ? 'pulse 2s ease-in-out infinite' : undefined,
            }}
        />
    )
}

export default function RoadmapPage() {
    return (
        <main className="roadmap-page">
            <style>{`
                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.4; }
                }
            `}</style>

            <h1 className="prose-title">Roadmap</h1>
            <p className="prose-subtitle">What we&apos;re working on and what&apos;s coming next.</p>
            <p style={{ fontSize: '12px', color: 'var(--color-text)', marginTop: '8px' }}>
                This roadmap reflects current priorities and may change. Last updated: March 2026.
            </p>

            <div className="roadmap-legend" style={{ marginTop: '24px' }}>
                <span className="roadmap-legend-item"><StatusDot color="#22c55e" /> Shipped</span>
                <span className="roadmap-legend-item"><StatusDot color="#C0B87A" pulse /> In Progress</span>
                <span className="roadmap-legend-item"><StatusDot color="#71717a" /> Planned</span>
                <span className="roadmap-legend-item"><StatusDot color="#52525b" /> Considering</span>
            </div>

            <div className="roadmap-grid">
                <div className="roadmap-column">
                    <div className="roadmap-column-header" style={{ color: 'var(--color-status-running)' }}>
                        <StatusDot color="#22c55e" /> Shipped
                    </div>
                    {SHIPPED.map((item) => (
                        <div key={item.title} className="roadmap-item">
                            <div className="roadmap-item-title">{item.title}</div>
                            <div className="roadmap-item-desc">{item.desc}</div>
                        </div>
                    ))}
                </div>

                <div className="roadmap-column">
                    <div className="roadmap-column-header" style={{ color: 'var(--color-status-building)' }}>
                        <StatusDot color="#C0B87A" pulse /> In Progress
                    </div>
                    {IN_PROGRESS.map((item) => (
                        <div key={item.title} className="roadmap-item">
                            <div className="roadmap-item-title">{item.title}</div>
                            <div className="roadmap-item-desc">{item.desc}</div>
                        </div>
                    ))}
                </div>

                <div className="roadmap-column">
                    <div className="roadmap-column-header" style={{ color: 'var(--color-text-muted)' }}>
                        <StatusDot color="#71717a" /> Planned
                    </div>
                    {PLANNED.map((item) => (
                        <div key={item.title} className="roadmap-item">
                            <div className="roadmap-item-title">{item.title}</div>
                            <div className="roadmap-item-desc">{item.desc}</div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="roadmap-considering">
                <h2 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text)' }}>Considering</h2>
                <p style={{ fontSize: '12px', color: 'var(--color-nav-text)', marginTop: '4px' }}>
                    No commitment yet — these need more user feedback.
                </p>
                <div className="roadmap-considering-tags">
                    {CONSIDERING.map((tag) => (
                        <span key={tag} className="roadmap-considering-tag">{tag}</span>
                    ))}
                </div>
            </div>
        </main>
    )
}
