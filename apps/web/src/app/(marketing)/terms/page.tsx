import type { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Terms of Service | Mockline',
    description: 'Terms of Service for Mockline',
}

export default function TermsPage() {
    return (
        <main className="prose-page">
            <h1 className="prose-title">Terms of Service</h1>
            <p className="prose-subtitle">Last updated: March 15, 2026</p>

            <hr className="prose-divider" />

            <section className="prose-section">
                <h2>1. Acceptance of Terms</h2>
                <p>
                    By accessing or using Mockline, you agree to be bound by these Terms of Service. If you do not agree, do not use the Service.
                </p>
            </section>

            <section className="prose-section">
                <h2>2. Description of Service</h2>
                <p>
                    Mockline is a platform that provisions isolated, Docker-powered mock API servers from OpenAPI specifications. The Service is provided on an as-is basis and subject to the limitations of your account tier.
                </p>
            </section>

            <section className="prose-section">
                <h2>3. Account Responsibilities</h2>
                <ul>
                    <li>You are responsible for maintaining the security of your GitHub OAuth connection</li>
                    <li>You must not use the Service to provision mock servers for illegal or harmful purposes</li>
                    <li>You are responsible for the content of OpenAPI specifications you upload</li>
                    <li>One account per person — do not share accounts</li>
                </ul>
            </section>

            <section className="prose-section">
                <h2>4. Acceptable Use</h2>
                <p>You agree not to:</p>
                <ul>
                    <li>Use the Service to serve content that violates applicable laws</li>
                    <li>Attempt to reverse engineer, decompile, or extract source code</li>
                    <li>Use automated scripts to provision excessive mock servers beyond plan limits</li>
                    <li>Resell or sublicense access to the Service</li>
                </ul>
            </section>

            <section className="prose-section">
                <h2>5. Service Limitations</h2>
                <table className="prose-table">
                    <thead>
                        <tr>
                            <th>Plan</th>
                            <th>Mock Servers</th>
                            <th>Spec Limit</th>
                            <th>Auto-stop</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>Free</td>
                            <td>1</td>
                            <td>1</td>
                            <td>Stops after 1hr, deleted after 24hr</td>
                        </tr>
                        <tr>
                            <td>Pro</td>
                            <td>5</td>
                            <td>Unlimited</td>
                            <td>After 24hr</td>
                        </tr>
                        <tr>
                            <td>Team</td>
                            <td>20</td>
                            <td>Unlimited</td>
                            <td>After 1 week</td>
                        </tr>
                    </tbody>
                </table>
            </section>

            <section className="prose-section">
                <h2>6. Intellectual Property</h2>
                <p>
                    OpenAPI specifications you upload remain your property. Mockline does not claim ownership of your content. We claim ownership of the platform, codebase, and branding.
                </p>
            </section>

            <section className="prose-section">
                <h2>7. Termination</h2>
                <p>
                    We reserve the right to suspend or terminate accounts that violate these Terms. You may delete your account at any time from the Settings page. Deletion removes all associated data within 30 days.
                </p>
            </section>

            <section className="prose-section">
                <h2>8. Limitation of Liability</h2>
                <p>
                    Mockline is provided &quot;as is&quot; without warranties of any kind. We are not liable for any indirect, incidental, or consequential damages arising from your use of the Service.
                </p>
            </section>

            <section className="prose-section">
                <h2>9. Changes to Terms</h2>
                <p>
                    We may update these Terms at any time. Continued use of the Service after changes constitutes acceptance of the new Terms. We will notify you of significant changes via email.
                </p>
            </section>

            <div className="prose-contact-block">
                <p style={{ margin: 0, fontWeight: 500, color: 'var(--color-text-strong)' }}>
                    Questions about these terms?
                </p>
                <p style={{ margin: '8px 0 0 0', fontSize: '13px', color: 'var(--color-text)' }}>
                    Email: <a href="mailto:legal@mockline.xyz" style={{ color: 'var(--color-nav-text)', textDecoration: 'none' }}>legal@mockline.xyz</a>
                </p>
            </div>
        </main>
    )
}
