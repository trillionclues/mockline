export type RoadmapItem = { title: string; desc: string }

export const SHIPPED: RoadmapItem[] = [
    { title: 'Google & GitHub OAuth', desc: 'Login and account management via social providers' },
    { title: 'Spec Upload', desc: 'YAML and JSON OpenAPI 3.0 support with remote URL import' },
    { title: 'Mock Provisioning', desc: 'Docker-powered isolated containers per spec version' },
    { title: 'Base Image Caching', desc: 'Contour CLI cached at startup, 5-10s provision time' },
    { title: 'Contract Testing', desc: 'Validate mock servers against their OpenAPI spec' },
    { title: 'Schema Diff', desc: 'Compare two versions of the same spec side-by-side' },
    { title: 'API Explorer', desc: 'Server-proxied HTTP client with syntax-highlighted responses and full header support' },
    { title: 'Pro Feature Controls', desc: 'Stateful mocks, response delays, and error rate injection' },
    { title: 'Subscription Billing', desc: 'Lemon Squeezy integration with tier auto-downgrade' },
    { title: 'Dashboard Polish', desc: 'Settings view, mobile drawer, and status banners' },
    { title: 'In-app OpenAPI Spec Designer', desc: 'Visual spec builder with draft auto-save and $ref resolution' },
    { title: 'EC2 Deployment', desc: 'Production infrastructure on AWS with CI/CD pipeline' },
    { title: 'Wildcard SSL', desc: 'Traefik + Let\'s Encrypt for *.mockline.xyz subdomains' },
    { title: 'Large Spec Support', desc: '10 MB upload limit for enterprise-scale specs' },
    { title: 'Centralized Email Templates', desc: 'Shared @mockline/emails package for consistent transactional emails' },
    { title: 'Strict Request Validation', desc: 'Validate request bodies and parameters against the OpenAPI schema with hard/soft modes' },
]

export const IN_PROGRESS: RoadmapItem[] = [

    { title: 'Request Logging', desc: 'Live request history per mock server' },
    { title: 'Team Workspaces', desc: 'Shared specs and mocks across a team' },
    { title: 'Server-side Drafts', desc: 'Persist spec designer drafts to the database for cross-device access' },
]

export const PLANNED: RoadmapItem[] = [
    { title: 'Sandbox Share Pages', desc: 'Branded landing pages for prospects to view API details and curl examples' },
    { title: 'Sandbox Expirations', desc: 'Set 14 to 90-day deliberate expirations on prospect sandboxes' },
    { title: 'Sandbox Analytics', desc: 'Log request hits and send weekly activity digests to Sales Engineers' },
    { title: 'Webhook Simulation', desc: 'Trigger mock webhook payloads on demand' },
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
]