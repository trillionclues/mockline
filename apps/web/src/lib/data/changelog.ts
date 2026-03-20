import { ChangelogEntry, ChangelogTag } from "@/types";

export const TAG_STYLES: Record<ChangelogTag, { background: string; color: string; label: string }> = {
    feature: { background: 'rgba(59,130,246,0.08)', color: '#3b82f6', label: 'Feature' },
    fix: { background: 'rgba(239,68,68,0.08)', color: '#ef4444', label: 'Fix' },
    performance: { background: 'rgba(34,197,94,0.08)', color: '#22c55e', label: 'Performance' },
    breaking: { background: 'rgba(239,68,68,0.12)', color: '#ef4444', label: 'Breaking' },
    improvement: { background: 'rgba(192,184,122,0.08)', color: '#C0B87A', label: 'Improvement' },
}

export const ENTRIES: ChangelogEntry[] = [
    {
        version: 'v0.5.1',
        date: 'March 21, 2026',
        title: 'Google OAuth Authentication',
        tags: ['feature'],
        body: 'Added Google OAuth as an alternative sign-in method, alongside the existing GitHub OAuth. Existing users can link their accounts seamlessly.',
        bullets: [
            'Sign in using your Google account',
            'Settings page now correctly reflects your authentication method(s)'
        ],
    },
    {
        version: 'v0.5.0',
        date: 'March 21, 2026',
        title: 'Subscription Billing & Payment Integration',
        tags: ['feature'],
        body: 'Integrated Lemon Squeezy for subscription management with full webhook lifecycle handling.',
        bullets: [
            'One-click checkout for PRO and TEAM plans with monthly/yearly billing cycles.',
            'Full webhook lifecycle: subscription created, updated, cancelled, expired, payment success/failure/recovered.',
            'Subscription cancellation keeps access active until billing period ends.',
            'Payment failure detection marks account as past_due with dashboard warning banner.',
            'Subscription management section added to Settings page with cancel option.',
            'Automated payment failure notification emails via Resend.',
        ],
    },
    {
        version: 'v0.4.0',
        date: 'March 20, 2026',
        title: 'Tier Limits & Feature Paywalls',
        tags: ['feature', 'improvement'],
        body: 'Introduced tiered and rate limits for free and pro users, enforcing limits on endpoints and spec uploads.',
        bullets: [
            'Pro users get unlimited specs; Free users limit to 1.',
            'Contract testing and Schema diffing now exclusive to PRO and TEAM tiers.',
            'Advanced mock options (stateful, delay, error rate) moved to PRO.',
            'User deletion correctly cascades to delete specs, mocks, and terminates running containers.',
            'New API Rate Limiter middleware dynamically adjusts limits based on current subscription tier.',
        ],
    },
    {
        version: 'v0.3.2',
        date: 'March 19, 2026',
        title: 'Upstream Patch Eliminated',
        tags: ['improvement', 'performance'],
        body: 'Updated to Contour CLI v1.2.0 which now binds to 0.0.0.0 by default. Removed the sed patch from Docker image builds — provision time reduced slightly and the build process much cleaner.',
        bullets: [
            'Contour CLI now supports --host flag and HOST env variable',
            'Default host changed to 0.0.0.0 — correct for Docker environments',
            'Removed runtime source patching from mock server image builds',
            'CONTOUR_VERSION bumped to 1.2.0',
        ],
    },
    {
        version: 'v0.3.1',
        date: 'March 18, 2026',
        title: 'Remote URL Spec Import',
        body: 'You can now import an OpenAPI spec directly from a remote URL — paste the link to any .yaml or .json file and Mockline fetches it for you.',
        bullets: [
            'New "Import URL" source option in the Upload Spec modal',
            'Server-side fetch with 15s timeout and format auto-detection',
            'Works with any publicly accessible OpenAPI spec URL',
        ],
        tags: ['feature'],
    },
    {
        version: 'v0.3.0',
        date: 'March 17, 2026',
        title: 'API Explorer, Contracts & Marketing Pages',
        body: 'The dashboard now surfaces parsed endpoints from your spec and lets you run contract tests with real results. Marketing pages round out the public site.',
        bullets: [
            'API Explorer now parses and displays all endpoints from your uploaded spec',
            'Contract test results display correctly with pass/fail per endpoint',
            'Path template params (e.g. {petId}) are auto-substituted during contract tests',
            'Privacy Policy, Terms of Service, About, Changelog, and Roadmap pages added',
            'Spec deletion now cascades — stops and removes all associated mock containers',
        ],
        tags: ['feature', 'improvement'],
    },
    {
        version: 'v0.2.0',
        date: 'March 13, 2026',
        title: 'Base Image Caching & Container Fixes',
        body: 'Two infrastructure fixes that make mock provisioning significantly faster and actually reachable from outside Docker.',
        bullets: [
            'Introduced base image strategy — Contour CLI is built once at API startup and cached. Provision time reduced from ~2 minutes to 5–10 seconds',
            'Patched Contour CLI binding from 127.0.0.1 to 0.0.0.0 at build time so mock containers are reachable from outside Docker',
            'Spec deletion now cascades — deleting a spec stops and removes all associated mock containers',
            'Image inspect uses retry logic to avoid race conditions after Docker build',
        ],
        tags: ['performance', 'fix'],
    },
    {
        version: 'v0.1.0',
        date: 'March 10, 2026',
        title: 'Initial Release',
        body: 'Mockline is now live. Upload an OpenAPI spec, provision a Docker-powered mock server, and get a live URL in seconds.',
        bullets: [
            'Upload YAML or JSON OpenAPI 3.0 specifications',
            'Provision isolated Docker containers per spec version',
            'Automatic port assignment and public URL generation',
            'GitHub OAuth authentication via BetterAuth',
            'Free tier: 1 mock server, auto-stops after 1 hour',
            'Dashboard with Overview, Specs, Mocks, Contracts, Schema Diff, API Explorer, and Settings pages',
        ],
        tags: ['feature'],
    },
]