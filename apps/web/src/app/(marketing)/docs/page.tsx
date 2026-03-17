import { SECTIONS } from '@/lib/data/docs'
import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
    title: 'Documentation',
    description: 'Learn how to use Mockline — upload specs, provision mock servers, run contract tests, and more.',
}

export default function DocsPage() {
    return (
        <main className="prose-page" style={{ maxWidth: '1300px' }}>
            <h1 className="prose-title">Documentation</h1>
            <p className="prose-subtitle">
                Everything you need to build with Mockline.
            </p>

            <hr className="prose-divider" />

            <div style={{
                background: 'var(--color-surface)',
                border: '1px solid var(--color-status-building)',
                borderRadius: '8px',
                padding: '16px 20px',
                marginBottom: '40px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px',
            }}>
                <span style={{ fontSize: '18px', lineHeight: 1 }}>🚧</span>
                <div>
                    <p style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: 'var(--color-text-strong)' }}>
                        Documentation is under construction
                    </p>
                    <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--color-text-muted)' }}>
                        Full docs are coming soon. In the meantime, check out the{' '}
                        <Link href="https://github.com/trillionclues/mockline" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-logo-line)', textDecoration: 'none' }}>
                            GitHub repo
                        </Link>{' '}
                        or the{' '}
                        <Link href="https://contour.trillionclues.dev" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-logo-line)', textDecoration: 'none' }}>
                            Contour CLI docs
                        </Link>.
                    </p>
                </div>
            </div>

            {SECTIONS.map((section) => (
                <section key={section.title} className="prose-section">
                    <h2>{section.title}</h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        {section.items.map((item) => (
                            <div
                                key={item.label}
                                className="docs-item"
                            >
                                <div style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-text-strong)' }}>
                                    {item.label}
                                </div>
                                <div style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                                    {item.desc}
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            ))}

            <div className="prose-contact-block" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <p style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: 'var(--color-text-strong)' }}>
                    Need help?
                </p>
                <p style={{ margin: 0, fontSize: '13px', color: 'var(--color-text-muted)' }}>
                    Open an issue on{' '}
                    <Link href="https://github.com/trillionclues/mockline/issues" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-logo-line)', textDecoration: 'none' }}>
                        GitHub
                    </Link>{' '}
                    or email{' '}
                    <a href="mailto:support@mockline.xyz" style={{ color: 'var(--color-logo-line)', textDecoration: 'none' }}>
                        support@mockline.xyz
                    </a>.
                </p>
            </div>
        </main>
    )
}
