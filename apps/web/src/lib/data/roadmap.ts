export type RoadmapItem = { title: string; desc: string }

export const SHIPPED: RoadmapItem[] = [
    { title: 'Google & GitHub OAuth', desc: 'Login and account management via social providers' },
    { title: 'Spec Upload', desc: 'YAML and JSON OpenAPI 3.0 support' },
    { title: 'Mock Provisioning', desc: 'Docker-powered isolated containers per spec version' },
    { title: 'Base Image Caching', desc: 'Contour CLI cached at startup, 5-10s provision time' },
    { title: 'Contract Testing', desc: 'Validate mock servers against their OpenAPI spec' },
    { title: 'Schema Diff', desc: 'Compare two versions of the same spec side-by-side' },
    { title: 'API Explorer', desc: 'In-dashboard HTTP client to test live mock endpoints' },
    { title: 'Pro Feature Controls', desc: 'Stateful mocks, response delays, and error rate injection' },
    { title: 'Subscription Billing', desc: 'Lemon Squeezy integration with tier auto-downgrade' },
    { title: 'Dashboard Polish', desc: 'Settings view, mobile drawer, and status banners' },
    { title: 'In-app OpenAPI Spec Designer', desc: 'PRO feature to build OpenAPI specs visually without writing YAML' },
]

export const IN_PROGRESS: RoadmapItem[] = [
    { title: 'EC2 Deployment', desc: 'Production infrastructure on AWS' },
    { title: 'Wildcard SSL', desc: 'Traefik + Let\'s Encrypt for *.mockline.xyz subdomains' },
]

export const PLANNED: RoadmapItem[] = [
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
]