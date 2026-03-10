export const FEATURES = [
    {
        num: '01',
        title: 'Isolated containers',
        body: 'Every spec gets its own Docker container. No cross-contamination, no shared infrastructure.',
        icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#F2E3BB" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="7" width="20" height="14" rx="2" />
                <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
                <line x1="12" y1="12" x2="12" y2="16" />
                <line x1="10" y1="14" x2="14" y2="14" />
            </svg>
        ),
    },
    {
        num: '02',
        title: 'Contract testing',
        body: 'Point the runner at your staging API and compare every response against your spec automatically.',
        icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#F2E3BB" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2v-4M9 21H5a2 2 0 0 1-2-2v-4m0 0h18" />
            </svg>
        ),
    },
    {
        num: '03',
        title: 'Version history',
        body: 'Every upload creates a new version. Full history, always accessible, always diffable.',
        icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#F2E3BB" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
            </svg>
        ),
    },
    {
        num: '04',
        title: 'Visual schema diff',
        body: 'Side-by-side diff of any two versions. Breaking changes are flagged before they reach production.',
        icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#F2E3BB" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
            </svg>
        ),
    },
    {
        num: '05',
        title: 'Shareable URLs',
        body: 'Every mock server gets a unique public URL. Share it — no local setup required on the other end.',
        icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#F2E3BB" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
            </svg>
        ),
    },
    {
        num: '06',
        title: 'CI ready',
        body: 'Drop the URL into your CI pipeline. Contract tests run on every PR with zero infrastructure.',
        icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#F2E3BB" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="4 17 10 11 4 5" /><line x1="12" y1="19" x2="20" y2="19" />
            </svg>
        ),
    },
]