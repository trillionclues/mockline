export const SECTIONS = [
    {
        title: 'Getting Started',
        items: [
            { label: 'What is Mockline?', desc: 'An overview of the platform and what it does.' },
            { label: 'Quick Start', desc: 'Upload or design your first spec and provision a mock server in under a minute.' },
            { label: 'Authentication', desc: 'Sign in with GitHub or Google OAuth to access your dashboard.' },
        ],
    },
    {
        title: 'Core Concepts',
        items: [
            { label: 'Specs & Versions', desc: 'Upload OpenAPI 3.0 YAML or JSON specs. Each upload creates a new version.' },
            { label: 'Mock Servers', desc: 'Isolated Docker containers running your spec via the Contour engine.' },
            { label: 'Contract Testing', desc: 'Validate that a running mock server matches its OpenAPI spec.' },
            { label: 'Schema Diff', desc: 'Compare two versions of the same spec to see what changed.' },
        ],
    },
    {
        title: 'API Reference',
        items: [
            { label: 'Specs API', desc: 'CRUD operations for managing OpenAPI specifications.' },
            { label: 'Mocks API', desc: 'Provision, start, stop, and remove mock server containers.' },
            { label: 'Contracts API', desc: 'Run contract tests and retrieve results.' },
        ],
    },
    {
        title: 'Contour CLI',
        items: [
            { label: 'Installation', desc: 'Install the Contour CLI globally via npm or pnpm.' },
            { label: 'contour start', desc: 'Start a local mock server from an OpenAPI spec file.' },
            { label: 'Configuration', desc: 'Port, host, stateful mode, delay, and error rate options.' },
        ],
    },
]