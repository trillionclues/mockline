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