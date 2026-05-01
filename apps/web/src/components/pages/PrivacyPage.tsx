import React from 'react'

export const PrivacyPage = () => {
    return (
        <main className="prose-page">
            <h1 className="prose-title">Privacy Policy</h1>
            <p className="prose-subtitle">Last updated: March 15, 2026</p>

            <hr className="prose-divider" />

            <section className="prose-section">
                <h2>1. Introduction</h2>
                <p>
                    Mockline (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;) is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use Mockline — our mock API provisioning platform (&quot;Service&quot;).
                </p>
            </section>

            <section className="prose-section">
                <h2>2. Information We Collect</h2>
                <p><strong>Account Information</strong></p>
                <ul>
                    <li>Name and email address (via GitHub OAuth)</li>
                    <li>GitHub profile information (avatar, username)</li>
                    <li>Account tier and subscription status</li>
                </ul>
                <p><strong>Usage Data</strong></p>
                <ul>
                    <li>OpenAPI specifications you upload</li>
                    <li>Mock server provisioning history</li>
                    <li>Contract test results</li>
                    <li>Feature usage and access timestamps</li>
                </ul>
            </section>

            <section className="prose-section">
                <h2>3. How We Use Your Information</h2>
                <ul>
                    <li>Provision and manage your mock API containers</li>
                    <li>Authenticate your identity via GitHub OAuth</li>
                    <li>Process account tier and subscription state</li>
                    <li>Communicate about your account and service updates</li>
                    <li>Improve the Service based on aggregate usage patterns</li>
                </ul>
            </section>

            <section className="prose-section">
                <h2>4. Data Storage and Security</h2>
                <p>
                    Your data is stored on infrastructure hosted in EU-based data centers. We implement appropriate technical measures including encryption at rest and in transit, access controls, and regular security practices.
                </p>
            </section>

            <section className="prose-section">
                <h2>5. Data Retention</h2>
                <table className="prose-table">
                    <thead>
                        <tr>
                            <th>Plan</th>
                            <th>Retention</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>Free</td>
                            <td>7 days (mock servers auto-stop after 1hr)</td>
                        </tr>
                        <tr>
                            <td>Pro</td>
                            <td>30 days</td>
                        </tr>
                        <tr>
                            <td>Team</td>
                            <td>90 days</td>
                        </tr>
                    </tbody>
                </table>
            </section>

            <section className="prose-section">
                <h2>6. Your Rights</h2>
                <ul>
                    <li>Access your personal data</li>
                    <li>Correct inaccurate data</li>
                    <li>Request deletion of your account and all associated data</li>
                    <li>Export your specifications and test results</li>
                    <li>Withdraw consent at any time</li>
                </ul>
            </section>

            <div className="prose-contact-block">
                <p style={{ margin: 0, fontWeight: 500, color: 'var(--color-text-strong)' }}>
                    Questions about this policy?
                </p>
                <p style={{ margin: '8px 0 0 0', fontSize: '13px', color: 'var(--color-text)' }}>
                    Email: <a href="mailto:privacy@mockline.xyz" style={{ color: 'var(--color-nav-text)', textDecoration: 'none' }}>privacy@mockline.xyz</a>
                </p>
            </div>
        </main>
    )
}
