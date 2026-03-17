import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
    title: 'About | Mockline',
    description: 'About Mockline — open source PaaS for Docker-powered mock API servers from OpenAPI specs.',
}

export default function AboutPage() {
    return (
        <main className="prose-page">
            <h1 className="prose-title">About Mockline</h1>
            <p style={{ fontSize: '18px', lineHeight: 1.6, color: 'var(--color-nav-text)', maxWidth: '560px', marginTop: '12px' }}>
                &quot;Mockline exists because frontend teams waste hours waiting for backend APIs that aren&apos;t ready yet.&quot;
            </p>

            <hr className="prose-divider" />

            <section className="prose-section">
                <h2>Why we built this</h2>
                <p>
                    Frontend developers block their entire sprint when a backend endpoint isn&apos;t ready. You either build against fake data in your codebase — which drifts from the real spec — or you wait.
                </p>
                <p>
                    Mockline removes that bottleneck. You upload an OpenAPI spec and get a live, isolated Docker container with real HTTP responses in seconds. No faking. No waiting. No drift.
                </p>
                <p>
                    We built Mockline because we felt this pain directly and couldn&apos;t find a tool that solved it simply.
                </p>
            </section>

            <hr className="prose-divider" />

            <section className="prose-section">
                <h2>What we&apos;re building</h2>
                <p>
                    A platform where the spec is the source of truth. Upload it once, spin up as many isolated mock environments as you need, test against them with real contract validation, and diff versions when the API changes.
                </p>
                <p>
                    Currently in active development and open source.
                </p>
            </section>

            <hr className="prose-divider" />

            <div className="prose-contact-block" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                    <p style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: 'var(--color-text-strong)' }}>
                        Mockline is open source.
                    </p>
                    <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--color-nav-text)' }}>
                        The core engine (<code style={{ fontSize: '12px' }}>@trillionclues/contour</code>) is available on npm.
                    </p>
                </div>
                <Link
                    href="https://github.com/trillionclues/mockline"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '8px 16px',
                        background: 'var(--color-logo-line)',
                        color: 'var(--color-bg)',
                        borderRadius: '6px',
                        fontSize: '13px',
                        fontWeight: 500,
                        textDecoration: 'none',
                        width: 'fit-content',
                        transition: 'opacity 120ms ease',
                    }}
                >
                    View on GitHub →
                </Link>
            </div>

            <p style={{ fontSize: '13px', color: 'var(--color-nav-text)', marginTop: '32px' }}>
                Built by Excel Nwachukwu —{' '}
                <Link
                    href="https://trillionclues.dev"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: 'var(--color-nav-text)', textDecoration: 'none' }}
                >
                    @trillionclues
                </Link>
                {' '}— Lagos, Nigeria.
            </p>
        </main>
    )
}
