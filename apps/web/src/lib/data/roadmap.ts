export type RoadmapItem = { title: string; desc: string }

export const SHIPPED: RoadmapItem[] = [
    { title: 'GitHub OAuth', desc: 'Login and account management via GitHub' },
    { title: 'Spec Upload', desc: 'YAML and JSON OpenAPI 3.0 support' },
    { title: 'Mock Provisioning', desc: 'Docker-powered isolated containers per spec version' },
    { title: 'Base Image Caching', desc: 'Contour CLI cached at startup, 5-10s provision time' },
    { title: 'Contract Testing', desc: 'Validate mock servers against their OpenAPI spec' },
    { title: 'Schema Diff', desc: 'Compare two versions of the same spec side-by-side' },
    { title: 'Auto-stop (Free)', desc: 'Free tier containers stop after 1 hour of inactivity' },
    { title: 'Spec Versioning', desc: 'Upload multiple versions of the same spec' },
    { title: 'Cascade Delete', desc: 'Deleting a spec stops and removes all mock containers' },
]

export const IN_PROGRESS: RoadmapItem[] = [
    { title: 'API Explorer', desc: 'In-dashboard HTTP client to test live mock endpoints' },
    { title: 'EC2 Deployment', desc: 'Production infrastructure on AWS' },
    { title: 'Wildcard SSL', desc: 'Traefik + Let\'s Encrypt for *.mockline.xyz subdomains' },
    { title: 'Dashboard Polish', desc: 'Overview stats, settings, mobile responsiveness' },
]

export const PLANNED: RoadmapItem[] = [
    { title: 'Visual Spec Builder', desc: 'Drag-and-drop editor to create OpenAPI specs without writing YAML' },
    { title: 'Team Workspaces', desc: 'Shared specs and mocks across a team' },
    { title: 'Webhook Simulation', desc: 'Trigger mock webhook payloads on demand' },
    { title: 'Request Logging', desc: 'Live request history per mock server' },
    { title: 'Mock Seeding', desc: 'Pre-populate stateful mocks with fixture data' },
    { title: 'CLI', desc: 'mockline provision <spec.yaml> from terminal' },
    { title: 'SDK', desc: 'JavaScript/TypeScript client for programmatic provisioning' },
    { title: 'Custom Domains', desc: 'Bring your own subdomain for mock URLs' },
    { title: 'SSO / SAML', desc: 'Enterprise auth for Team plan' },
]

export const CONSIDERING = [
    'GraphQL mock support',
    'gRPC mock support',
    'OpenAPI 3.1 support',
    'Postman collection import',
    'Hosted spec registry',
    'Mock server analytics',
    'Response delay simulation',
    'Error rate injection',
]