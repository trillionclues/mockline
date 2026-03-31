export const LOGOS = [
    'PiggyVest',
    'Flutterwave',
    'Paystack',
    'Moniepoint',
    'Interswitch',
    'Helium Health',
    'Stripe',
    'Adyen',
    'Fincode',
]

export const COLUMNS = [
    {
        label: 'Product',
        links: [
            { label: 'Docs', href: '/docs' },
            { label: 'Pricing', href: '/pricing' },
            { label: 'Changelog', href: '/changelog' },
            { label: 'Roadmap', href: '/roadmap' },
        ],
    },
    {
        label: 'Developers',
        links: [
            { label: 'API Reference', href: '/docs/api' },
            { label: 'CLI Docs', href: 'https://contour.trillionclues.dev' },
            { label: 'GitHub', href: 'https://github.com/trillionclues/mockline' },
            { label: 'npm', href: 'https://www.npmjs.com/package/@trillionclues/contour' },
        ],
    },
    {
        label: 'Company',
        links: [
            { label: 'About', href: '/about' },
            { label: 'Blog', href: '/blog' },
            { label: 'Terms', href: '/terms' },
            { label: 'Privacy', href: '/privacy' },
        ],
    },
]

export const PLANS = [
    {
        name: 'Free',
        monthlyPrice: 0,
        yearlyPrice: 0,
        period: 'forever',
        description: 'For solo devs and exploration.',
        highlighted: false,
        features: [
            { text: '1 mock server', included: true },
            { text: '1 spec', included: true },
            { text: 'Mocks auto-delete after 24hr', included: true },
            { text: 'Shareable URL', included: true },
            { text: 'Community support', included: true },
            { text: 'Contract testing', included: false },
            { text: 'Schema diffing', included: false },
            { text: 'Advanced mock options', included: false },
        ],
        cta: 'Get started free',
        ctaHref: '/login?intent=register',
    },
    {
        name: 'Pro',
        monthlyPrice: 5.99,
        yearlyPrice: 4.75,
        period: '/ month',
        description: 'For developers who ship daily.',
        highlighted: true,
        features: [
            { text: '5 mock servers', included: true },
            { text: 'Unlimited specs', included: true },
            { text: 'Always-on servers', included: true },
            { text: 'Shareable URLs', included: true },
            { text: 'Email support', included: true },
            { text: 'Contract testing + History', included: true },
            { text: 'Schema diffing + Spec Designer', included: true },
            { text: 'Stateful, Delay & Error mocks', included: true },
        ],
        cta: 'Upgrade to Pro',
        ctaHref: '/login?intent=register&plan=pro',
    },
    {
        name: 'Team',
        monthlyPrice: 19.99,
        yearlyPrice: 15.99,
        period: '/ month',
        description: 'For teams that move together.',
        highlighted: false,
        features: [
            { text: 'Everything in Pro', included: true },
            { text: '20 mock servers', included: true },
            { text: 'Team workspaces', included: true },
            { text: 'Webhook alerts', included: true },
            { text: 'Priority support', included: true },
            { text: 'SSO (coming soon)', included: true },
            { text: 'Audit logs', included: true },
            { text: 'Custom mock servers & domains', included: true },
        ],
        cta: 'Contact us',
        ctaHref: 'mailto:admin@mockline.xyz',
    },
]

export const STEPS = [
    {
        number: '01',
        title: 'Upload your spec',
        body: 'Drag in any OpenAPI 3.x file. Mockline validates it instantly and parses every endpoint, schema, and response type.',
        reversed: false,
        lines: [
            { text: '$ mockline upload payments-api.yaml', color: '#71717a' },
            { text: '→ Parsing spec...', color: '#71717a' },
            { text: '✓ Valid — 24 endpoints parsed', color: '#22c55e' },
            { text: '', color: '#71717a' },
            { text: 'Schemas:    18', color: '#52525b' },
            { text: 'Responses:  42', color: '#52525b' },
            { text: 'Auth:       Bearer token', color: '#52525b' },
        ],
    },
    {
        number: '02',
        title: 'Container spins up',
        body: 'A Docker container with your spec baked in starts in under 60 seconds. Isolated. Reproducible. No shared state.',
        reversed: true,
        lines: [
            { text: '$ mockline provision payments-api', color: '#71717a' },
            { text: '⠋ Building container...', color: '#9b9564ff' },
            { text: '⠙ Installing @trillionclues/contour...', color: '#9b9564ff' },
            { text: '⠸ Baking spec into image...', color: '#9b9564ff' },
            { text: '', color: '#71717a' },
            { text: '✓ Container running', color: '#22c55e' },
            { text: '→ mock-kx92a.mockline.xyz', color: '#71717a' },
        ],
    },
    {
        number: '03',
        title: 'Share and test',
        body: 'Send the remote URL to your team. Point your CI pipeline at it. Run contract tests whenever your real API is ready.',
        reversed: false,
        lines: [
            { text: '$ curl mock-kx92a.mockline.xyz/payments', color: '#71717a' },
            { text: '', color: '#71717a' },
            { text: '{', color: '#52525b' },
            { text: '"id": "pay_kx92a4f1b",', color: '#52525b', indent: true },
            { text: '"amount": 4999,', color: '#52525b', indent: true },
            { text: '"currency": "usd",', color: '#52525b', indent: true },
            { text: '"status": "succeeded"', color: '#52525b', indent: true },
            { text: '}', color: '#52525b' },
        ],
    },
]


export const FAQS = [
    {
        q: "How do I import my API definition?",
        a: "You can paste your OpenAPI 3.x specification (YAML or JSON) directly into Mockline, import from a remote public URL (e.g., `https://petstore.swagger.io/v2/swagger.json`), or build your OpenAPI spec entirely in-app using the visual Spec Designer to provision a mock directly from it."
    },
    {
        q: "How does mock server provisioning work?",
        a: "When you deploy a mock, Mockline takes your spec and spins up a dedicated, highly-isolated Docker container behind a custom subdomain. It takes roughly 4 to 5 seconds to get a live, public HTTPS URL. Your mock stays running and responds using data extracted from your spec."
    },
    {
        q: "How do contract tests work?",
        a: "Contract testing helps ensure your real backend actually matches your documentation. You point Mockline to your real API's base URL, and it will execute endpoint tests to verify that request parameters and response schemas exactly correspond to the rules defined in your OpenAPI spec."
    },
    {
        q: "Does it include an API client?",
        a: "Yes! The dashboard features an integrated API Explorer. It automatically parses out all path parameters, queries, headers, and request bodies defined in your spec. You can fire HTTP requests right from the browser (proxied server-side to avoid CORS issues) and view syntax-highlighted JSON responses."
    },
    {
        q: "What are the limitations of the free tier?",
        a: "The free tier allows you to manage 1 OpenAPI specification and run 1 active mock server at a time, which will automatically spin down after an hour of inactivity. For unlimited specs, contract testing, schema diffing, and advanced configuration options (stateful caching, custom network delays, error rate injection), you can upgrade to the PRO tier."
    },
    {
        q: "Are mock responses stateful?",
        a: "By default, mock responses are generated dynamically based on the schemas and examples in your spec. On the PRO tier, you can enable Stateful Mode, meaning if you POST a record, a subsequent GET to that collection will actually reflect the new data in memory."
    }
]