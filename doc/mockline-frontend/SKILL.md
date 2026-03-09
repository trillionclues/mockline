# WORKFLOW.md — Mockline Frontend Build

> Senior frontend engineering execution plan.
> Read this before opening any component file.
> This document dictates build order, API wiring strategy, layout contracts, and
> responsiveness rules for the landing page and full dashboard.

---

## Table of Contents

1. [Mental Model Before You Start](#1-mental-model-before-you-start)
2. [Build Order](#2-build-order)
3. [Shared Foundation (Do First, Touch Once)](#3-shared-foundation-do-first-touch-once)
4. [Landing Page — Full Build Spec](#4-landing-page--full-build-spec)
5. [Dashboard Shell — Layout Contract](#5-dashboard-shell--layout-contract)
6. [Page-by-Page Dashboard Build](#6-page-by-page-dashboard-build)
7. [API Integration Layer](#7-api-integration-layer)
8. [Responsiveness Contract](#8-responsiveness-contract)
9. [TanStack Query Patterns](#9-tanstack-query-patterns)
10. [Component Checklist Before Ship](#10-component-checklist-before-ship)

---

## 1. Mental Model Before You Start

### How Next.js 16 App Router Data Flows in This Project

```
Server Component (async)
  → fetches data server-side via internal API call
  → passes as props to Client Component
  → Client Component handles interactivity only

Client Component ('use client')
  → receives initial data as props (from server)
  → uses TanStack Query for mutations + real-time polling
  → never directly calls Prisma or docker-manager
```

**The split that matters:**

| What | Where | Why |
|------|-------|-----|
| Initial page data (spec list, mock list) | Server Component | No loading flash, SEO-safe, faster TTFB |
| Container status polling | Client Component + TanStack Query | Real-time, needs browser |
| Mutations (upload spec, start mock) | TanStack Query mutation + Server Action | Form submission stays in React |
| Auth session | Server Component via `auth()` helper | Session never exposed to client |

**Rule: if a component needs `useState` or `useEffect` for data — it should be getting that data from TanStack Query, not raw fetch.**

### The API Client Contract

All communication from the web app to `apps/api` goes through one typed file:

```
apps/web/src/lib/api-client.ts
```

This file is the **only place** base URLs, auth headers, and response envelope unwrapping live.
No component imports `fetch` directly. No component constructs API URLs.

---

## 2. Build Order

Build in this exact sequence. Each phase unlocks the next.

```
Phase 0 — Foundation (no visible UI)
  → api-client.ts
  → query-client setup
  → auth provider
  → layout tokens in globals.css

Phase 1 — Landing Page
  → Full static landing page
  → No auth, no data
  → Vercel deploy after this phase

Phase 2 — Dashboard Shell
  → Sidebar + topbar layout
  → Route structure
  → Auth guard
  → Empty states for every page

Phase 3 — Specs Feature
  → Spec list page (table)
  → Spec upload (modal + dropzone)
  → Spec detail page (endpoints tree)
  → Version history tab
  → Wire to real API

Phase 4 — Mock Servers Feature
  → Mock server list
  → Provision modal
  → Mock server detail (status + URL)
  → Live API explorer
  → Wire to real API + polling

Phase 5 — Contract Tests Feature
  → Run contract test (form)
  → Test results page
  → Wire to real API

Phase 6 — Schema Diff (Phase 3 of product)
  → Diff viewer component
  → Version selector
  → Breaking change indicators

Phase 7 — Polish + Responsive
  → Responsive audit (all pages)
  → Loading states
  → Error boundaries
  → Empty states check
```

**Do not start Phase 3 until Phase 2 is deployed and working. Do not start Phase 4 until the spec upload flow works end-to-end.**

---

## 3. Shared Foundation (Do First, Touch Once)

### 3.1 `globals.css` — Token Registration

```css
/* apps/web/src/app/globals.css */
@import "tailwindcss";

@theme {
  /* Core backgrounds — inherited from Contour CLI */
  --color-bg:            #0a0a0b;
  --color-bg-card:       #111114;
  --color-bg-terminal:   #0d0d10;

  /* Surfaces */
  --color-surface:       #111114;
  --color-surface-2:     #16161a;

  /* Borders */
  --color-border:        #1a1a2e;
  --color-border-highlight: rgba(242, 227, 187, 0.2);

  /* Primary accent — Contour's cream/gold */
  --color-primary:       #F2E3BB;
  --color-primary-muted: rgba(242, 227, 187, 0.08);
  --color-primary-glow:  rgba(242, 227, 187, 0.13);

  /* Text */
  --color-text:          #e4e4e7;
  --color-text-muted:    #71717a;
  --color-text-subtle:   #52525b;
  --color-text-strong:   #f4f4f5;

  /* Status — these stay, they're functional not brand */
  --color-status-running:  #22c55e;
  --color-status-building: #C0B87A;
  --color-status-stopped:  #71717a;
  --color-status-failed:   #ef4444;

  /* Semantic */
  --color-destructive:   #ef4444;
  --color-warning:       #C0B87A;
  --color-success:       #22c55e;

  /* Typography — inherited from Contour CLI */
  --font-family-heading: 'Outfit', sans-serif;
  --font-family-sans:    'Inter', -apple-system, sans-serif;
  --font-family-mono:    'JetBrains Mono', 'Fira Code', monospace;
}

* { box-sizing: border-box; margin: 0; }

body {
  background: var(--color-bg);
  color: var(--color-text);
  font-family: var(--font-family-sans);
  font-size: 14px;
  line-height: 1.5;
  -webkit-font-smoothing: antialiased;
}

/* Scrollbar — matches GitHub style */
::-webkit-scrollbar       { width: 8px; height: 8px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: var(--color-border); border-radius: 4px; }

/* Mono utility — used across the app */
.mono { font-family: var(--font-family-mono); }
```

### 3.2 `api-client.ts` — The Only Fetch Point

```typescript
// apps/web/src/lib/api-client.ts

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'

type ApiResponse<T> = { data: T; error: null } | { data: null; error: { code: string; message: string } }

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    credentials: 'include', // sends session cookie
  })

  const json: ApiResponse<T> = await res.json()

  if (!res.ok || json.error) {
    throw new Error(json.error?.message ?? `HTTP ${res.status}`)
  }

  return json.data
}

// ── Specs ─────────────────────────────────────────────────────────────────
export const specsApi = {
  list:           ()                                    => request<Spec[]>('/specs'),
  get:            (id: string)                          => request<SpecDetail>(`/specs/${id}`),
  create:         (body: CreateSpecInput)               => request<Spec>('/specs', { method: 'POST', body: JSON.stringify(body) }),
  delete:         (id: string)                          => request<void>(`/specs/${id}`, { method: 'DELETE' }),
  getVersions:    (id: string)                          => request<SpecVersion[]>(`/specs/${id}/versions`),
  uploadVersion:  (id: string, body: UploadVersionInput)=> request<SpecVersion>(`/specs/${id}/versions`, { method: 'POST', body: JSON.stringify(body) }),
  diff:           (id: string, v1: number, v2: number)  => request<SchemaDiff>(`/specs/${id}/versions/${v1}/diff/${v2}`),
}

// ── Mocks ──────────────────────────────────────────────────────────────────
export const mocksApi = {
  list:       ()                                => request<MockServer[]>('/mocks'),
  get:        (id: string)                      => request<MockServer>(`/mocks/${id}`),
  provision:  (body: ProvisionMockInput)        => request<MockServer>('/mocks', { method: 'POST', body: JSON.stringify(body) }),
  start:      (id: string)                      => request<MockServer>(`/mocks/${id}/start`, { method: 'POST' }),
  stop:       (id: string)                      => request<void>(`/mocks/${id}/stop`, { method: 'POST' }),
  delete:     (id: string)                      => request<void>(`/mocks/${id}`, { method: 'DELETE' }),
}

// ── Contracts ──────────────────────────────────────────────────────────────
export const contractsApi = {
  run:    (body: RunContractInput)  => request<ContractTestRun>('/contracts', { method: 'POST', body: JSON.stringify(body) }),
  get:    (id: string)              => request<ContractTestRun>(`/contracts/${id}`),
  list:   (specId?: string)         => request<ContractTestRun[]>(`/contracts${specId ? `?specId=${specId}` : ''}`),
}
```

### 3.3 `query-client.ts` — TanStack Query Config

```typescript
// apps/web/src/lib/query-client.ts
import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,        // 30s — data stays fresh, fewer background refetches
      retry: 1,                 // one retry on failure, then show error
      refetchOnWindowFocus: false, // developer tools open constantly — this gets annoying
    },
    mutations: {
      onError: (error) => {
        console.error('[mutation error]', error)
      },
    },
  },
})
```

### 3.4 Query Key Factory

Centralise query keys so invalidation is reliable:

```typescript
// apps/web/src/lib/query-keys.ts
export const queryKeys = {
  specs: {
    all:      ()       => ['specs'] as const,
    detail:   (id: string) => ['specs', id] as const,
    versions: (id: string) => ['specs', id, 'versions'] as const,
    diff:     (id: string, v1: number, v2: number) => ['specs', id, 'diff', v1, v2] as const,
  },
  mocks: {
    all:    ()         => ['mocks'] as const,
    detail: (id: string) => ['mocks', id] as const,
    status: (id: string) => ['mocks', id, 'status'] as const,
  },
  contracts: {
    all:     ()             => ['contracts'] as const,
    bySpec:  (specId: string) => ['contracts', 'spec', specId] as const,
    detail:  (id: string)   => ['contracts', id] as const,
  },
}
```

---

## 4. Landing Page — Full Build Spec

### Section Map

```
┌─────────────────────────────────────────────────────┐
│ NAV (sticky, blurs on scroll)                        │
├─────────────────────────────────────────────────────┤
│ HERO                                                 │
│   Headline + subheadline + CTA pair                  │
│   Mock terminal / code preview                       │
├─────────────────────────────────────────────────────┤
│ LOGOS (social proof — dev tools companies)           │
├─────────────────────────────────────────────────────┤
│ HOW IT WORKS (3-step flow)                           │
├─────────────────────────────────────────────────────┤
│ FEATURES (spec-by-spec product capabilities)         │
├─────────────────────────────────────────────────────┤
│ PRICING (3-column: Free / Pro / Team)                │
├─────────────────────────────────────────────────────┤
│ FOOTER                                               │
└─────────────────────────────────────────────────────┘
```

### Layout Rules

```
Page max-width:     1120px
Section padding-y:  80px desktop / 56px tablet / 40px mobile
Section padding-x:  24px (applied at container level, never per-element)
Content max-width:  680px for text-heavy sections (hero copy, how-it-works)
Grid max-width:     full container width for feature grids
```

### 4.1 Nav

```
Height:             56px
Background:         var(--bg) with backdrop-filter: blur(12px) when scrolled
Border-bottom:      none at top, 1px solid var(--border) on scroll
Position:           sticky top-0, z-50

Left:   Logo mark (icon + "Mockline" text, 15px 500)
Center: Nav links (Docs, Pricing, Changelog) — hidden below 768px
Right:  "Sign in" ghost button + "Get started" primary button
        On mobile: hamburger icon only
```

**Scroll detection:**
```tsx
'use client'
const [scrolled, setScrolled] = useState(false)
useEffect(() => {
  const handler = () => setScrolled(window.scrollY > 10)
  window.addEventListener('scroll', handler, { passive: true })
  return () => window.removeEventListener('scroll', handler)
}, [])
```

### 4.2 Hero

```
Layout:             Two-column (50/50) on desktop, stacked on mobile
Left column:        Copy block + CTAs
Right column:       Product preview (code terminal / mock URL demo)
Padding-top:        96px desktop / 64px mobile (accounts for nav)
```

**Copy block structure:**
```tsx
<section className="hero">
  <div className="hero-copy">
    {/* NO eyebrow label. Start straight with the headline. */}
    <h1>Mock APIs in seconds.<br />Ship without waiting.</h1>
    <p>
      Upload an OpenAPI spec. Get a live mock server running in an isolated
      container — shareable, contract-testable, and ready in under a minute.
    </p>
    <div className="hero-ctas">
      <a href="/register" className="btn-primary">Start for free</a>
      <a href="/docs" className="btn-secondary">Read the docs</a>
    </div>
    <span className="hero-meta">No credit card. Free tier forever.</span>
  </div>
  <div className="hero-preview">
    {/* Terminal component — see below */}
  </div>
</section>
```

```css
.hero          { display: grid; grid-template-columns: 1fr 1fr; gap: 64px;
                 align-items: center; padding: 96px 0 80px; }
h1             { font-size: clamp(28px, 4vw, 44px); font-weight: 600;
                 color: var(--text-strong); line-height: 1.2; margin-bottom: 16px; }
.hero p        { font-size: 16px; color: var(--text-muted); line-height: 1.6;
                 max-width: 480px; margin-bottom: 28px; }
.hero-ctas     { display: flex; gap: 12px; align-items: center; margin-bottom: 16px; }
.hero-meta     { font-size: 12px; color: var(--text-muted); }

@media (max-width: 768px) {
  .hero        { grid-template-columns: 1fr; gap: 40px; padding: 64px 0 48px; }
  .hero-preview{ order: -1; } /* preview above copy on mobile */
}
```

**Hero terminal preview component:**
```tsx
// Simulates the Mockline flow: upload → URL appears
// Static — no real API call. Typewriter effect on the URL appearing.
function HeroTerminal() {
  return (
    <div className="terminal">
      <div className="terminal-bar">
        <span className="terminal-dot dot-red" />
        <span className="terminal-dot dot-yellow" />
        <span className="terminal-dot dot-green" />
      </div>
      <div className="terminal-body">
        <div className="terminal-line">
          <span className="t-muted">$</span>
          <span className="t-text"> mockline upload ./openapi.yaml</span>
        </div>
        <div className="terminal-line">
          <span className="t-muted">→</span>
          <span className="t-text"> Validating spec...</span>
        </div>
        <div className="terminal-line">
          <span className="t-muted">→</span>
          <span className="t-text"> Building container...</span>
        </div>
        <div className="terminal-line terminal-line--result">
          <span className="t-success">✓</span>
          <span className="t-text"> Mock server running at</span>
        </div>
        <div className="terminal-url">
          mock-a3f9c2.mockline.dev
        </div>
      </div>
    </div>
  )
}
```

```css
.terminal         { background: var(--surface); border: 1px solid var(--border);
                    border-radius: 8px; overflow: hidden; }
.terminal-bar     { height: 36px; background: var(--surface-2);
                    border-bottom: 1px solid var(--border);
                    display: flex; align-items: center; gap: 6px; padding: 0 14px; }
.terminal-dot     { width: 10px; height: 10px; border-radius: 50%; }
.dot-red          { background: #f85149; }
.dot-yellow       { background: #d29922; }
.dot-green        { background: #3fb950; }
.terminal-body    { padding: 20px; display: flex; flex-direction: column; gap: 8px; }
.terminal-line    { display: flex; gap: 8px; font-family: var(--font-mono);
                    font-size: 13px; }
.t-muted          { color: var(--text-muted); }
.t-text           { color: var(--text); }
.t-success        { color: var(--status-running); }
.terminal-url     { font-family: var(--font-mono); font-size: 14px;
                    color: var(--primary); padding: 10px 14px;
                    background: var(--surface-2); border-radius: 6px;
                    margin-top: 4px; }
```

### 4.3 Logos Row

```
Layout:     Single row, space-between, grayscale logos
Copy:       "Trusted by teams at" — one line, text-muted, text-sm, centered above logos
Logos:      6-8 company wordmarks at 20-24px height, opacity: 0.4, greyscale filter
            On hover: opacity: 0.7, transition 120ms
Responsive: 2-row grid on mobile (3+3)
```

No animation. No carousel. Static row.

### 4.4 How It Works

```
Layout:     3 columns on desktop, stacked on mobile
Section heading: "How it works" — text-lg, text-strong, centered, NO decorative underline
```

```tsx
const steps = [
  {
    number: '01',
    title: 'Upload your spec',
    body: 'Drop in any OpenAPI 3.x spec — YAML or JSON. Mockline validates it instantly and extracts every endpoint.',
  },
  {
    number: '02',
    title: 'Get a live mock URL',
    body: 'A Docker container spins up with your spec baked in. Your unique mock URL is ready in under 60 seconds.',
  },
  {
    number: '03',
    title: 'Share and iterate',
    body: 'Send the URL to your frontend team or CI pipeline. Run contract tests when your real API is ready.',
  },
]
```

```css
.steps        { display: grid; grid-template-columns: repeat(3, 1fr); gap: 32px; }
.step-number  { font-family: var(--font-mono); font-size: 11px; color: var(--text-muted);
                margin-bottom: 12px; }
.step-title   { font-size: 15px; font-weight: 500; color: var(--text-strong);
                margin-bottom: 8px; }
.step-body    { font-size: 13px; color: var(--text-muted); line-height: 1.6; }

/* Connector line between steps */
.steps::before {
  content: '';
  position: absolute;
  top: 8px; left: calc(100% / 6);
  width: calc(100% * 2 / 3);
  height: 1px;
  background: var(--border);
}

@media (max-width: 768px) {
  .steps { grid-template-columns: 1fr; gap: 24px; }
  .steps::before { display: none; }
}
```

### 4.5 Features

4 feature blocks. 2x2 grid on desktop. Single column on mobile.

```tsx
const features = [
  {
    icon: UploadIcon,
    title: 'Instant mock servers',
    body: 'Every uploaded spec gets an isolated Docker container. No shared infrastructure, no interference between environments.',
  },
  {
    icon: FlaskIcon,
    title: 'Contract testing',
    body: 'Point the test runner at your staging API. It hits every endpoint and compares response shapes against your spec automatically.',
  },
  {
    icon: GitBranchIcon,
    title: 'Schema version history',
    body: 'Every spec upload creates a new version. Diff any two versions to see exactly what changed — and what broke.',
  },
  {
    icon: ShareIcon,
    title: 'Shareable environments',
    body: 'Every mock URL is public and shareable. Give your frontend team a URL, not a local server setup guide.',
  },
]
```

```css
.features-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1px;
                 border: 1px solid var(--border); border-radius: 8px; overflow: hidden;
                 background: var(--border); } /* gap creates border effect */
.feature-cell  { background: var(--surface); padding: 28px; }
.feature-icon  { width: 32px; height: 32px; color: var(--primary);
                 margin-bottom: 16px; }
.feature-title { font-size: 14px; font-weight: 500; color: var(--text-strong);
                 margin-bottom: 8px; }
.feature-body  { font-size: 13px; color: var(--text-muted); line-height: 1.6; }

@media (max-width: 640px) {
  .features-grid { grid-template-columns: 1fr; }
}
```

### 4.6 Pricing

```
Layout:     3 columns (Free / Pro / Team). Pro column highlighted.
Highlight:  border: 1px solid var(--primary). Same border-radius. No scale transform. No glow.
```

```tsx
const plans = [
  {
    name: 'Free',
    price: '$0',
    period: 'forever',
    highlight: false,
    features: [
      '1 mock server',
      '1 spec',
      'Auto-stops after 1hr',
      'Shareable URL',
    ],
    cta: 'Get started',
    ctaHref: '/register',
  },
  {
    name: 'Pro',
    price: '$9',
    period: 'per month',
    highlight: true,
    features: [
      '5 mock servers',
      'Unlimited specs',
      'Contract testing',
      'Schema diffing',
      'Always-on servers',
    ],
    cta: 'Start Pro trial',
    ctaHref: '/register?plan=pro',
  },
  {
    name: 'Team',
    price: '$29',
    period: 'per month',
    highlight: false,
    features: [
      'Everything in Pro',
      '20 mock servers',
      'Shared workspaces',
      'Webhook alerts',
      'Priority support',
    ],
    cta: 'Contact us',
    ctaHref: '/contact',
  },
]
```

```css
.pricing-grid   { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
.plan           { background: var(--surface); border: 1px solid var(--border);
                  border-radius: 8px; padding: 24px; }
.plan--highlight{ border-color: var(--primary); }
.plan-name      { font-size: 13px; font-weight: 500; color: var(--text-strong);
                  margin-bottom: 16px; }
.plan-price     { font-size: 28px; font-weight: 600; color: var(--text-strong);
                  font-family: var(--font-mono); }
.plan-period    { font-size: 12px; color: var(--text-muted); margin-bottom: 20px; }
.plan-features  { list-style: none; padding: 0; margin-bottom: 24px;
                  display: flex; flex-direction: column; gap: 10px; }
.plan-feature   { font-size: 13px; color: var(--text); display: flex;
                  align-items: center; gap: 8px; }
.plan-feature::before { content: ''; width: 12px; height: 12px;
                        background: var(--status-running); border-radius: 50%;
                        flex-shrink: 0; }

@media (max-width: 768px) {
  .pricing-grid { grid-template-columns: 1fr; max-width: 400px; margin: 0 auto; }
}
```

### 4.7 Footer

```
Layout:     Two rows. Top: logo + nav columns. Bottom: copyright.
Height:     auto — never fixed
Background: var(--surface). Border-top: 1px solid var(--border).
Padding:    48px top, 24px bottom
Columns:    Product / Developers / Company (3 columns, 160px each)
```

```css
.footer           { background: var(--surface); border-top: 1px solid var(--border);
                    padding: 48px 0 24px; }
.footer-inner     { display: grid; grid-template-columns: 1fr repeat(3, 160px);
                    gap: 48px; margin-bottom: 40px; }
.footer-brand     { display: flex; flex-direction: column; gap: 12px; }
.footer-col-title { font-size: 12px; font-weight: 500; color: var(--text-strong);
                    margin-bottom: 12px; }
.footer-link      { font-size: 13px; color: var(--text-muted); text-decoration: none;
                    display: block; margin-bottom: 8px;
                    transition: color 120ms ease; }
.footer-link:hover { color: var(--text); }
.footer-bottom    { border-top: 1px solid var(--border-muted); padding-top: 20px;
                    font-size: 12px; color: var(--text-muted); }

@media (max-width: 768px) {
  .footer-inner { grid-template-columns: 1fr 1fr; gap: 32px; }
}
@media (max-width: 480px) {
  .footer-inner { grid-template-columns: 1fr; }
}
```

---

## 5. Dashboard Shell — Layout Contract

This is set up once and never changed. All dashboard pages slot into `{children}`.

### File: `app/(dashboard)/layout.tsx`

```tsx
// Server Component — validates session, redirects if unauth'd
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { Sidebar } from '@/components/shell/Sidebar'
import { Topbar } from '@/components/shell/Topbar'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  if (!session) redirect('/login')

  return (
    <div className="dashboard-shell">
      <Sidebar user={session.user} />
      <div className="dashboard-main">
        <Topbar />
        <main className="dashboard-content">
          {children}
        </main>
      </div>
    </div>
  )
}
```

```css
.dashboard-shell   { display: flex; height: 100vh; overflow: hidden; }
.dashboard-main    { flex: 1; display: flex; flex-direction: column;
                     overflow: hidden; min-width: 0; }
.dashboard-content { flex: 1; overflow-y: auto; padding: 24px;
                     max-width: 1200px; width: 100%; margin: 0 auto; }
```

### Sidebar Component

```tsx
// components/shell/Sidebar.tsx — Client Component (needs active route detection)
'use client'
import { usePathname } from 'next/navigation'
import Link from 'next/link'

const NAV_ITEMS = [
  { href: '/overview',  label: 'Overview',        icon: HomeIcon },
  { href: '/specs',     label: 'Specs',            icon: FileIcon },
  { href: '/mocks',     label: 'Mock Servers',     icon: BoxIcon },
  { href: '/contracts', label: 'Contract Tests',   icon: CheckCircleIcon },
]

export function Sidebar({ user }: { user: SessionUser }) {
  const pathname = usePathname()

  return (
    <aside className="sidebar">
      {/* Brand */}
      <div className="sidebar-brand">
        <MocklineIcon size={18} />
        <span>Mockline</span>
      </div>

      {/* Nav */}
      <nav className="sidebar-nav">
        {NAV_ITEMS.map(item => (
          <Link
            key={item.href}
            href={item.href}
            className={`nav-item ${pathname.startsWith(item.href) ? 'nav-item--active' : ''}`}
          >
            <item.icon size={16} />
            {item.label}
          </Link>
        ))}
      </nav>

      {/* Divider + Settings */}
      <div className="sidebar-footer">
        <div className="sidebar-divider" />
        <Link href="/settings" className={`nav-item ${pathname === '/settings' ? 'nav-item--active' : ''}`}>
          <SettingsIcon size={16} />
          Settings
        </Link>
        {/* User row */}
        <div className="sidebar-user">
          <img src={user.avatarUrl} className="sidebar-avatar" alt="" />
          <span className="sidebar-username">{user.name}</span>
        </div>
      </div>
    </aside>
  )
}
```

```css
.sidebar          { width: 248px; flex-shrink: 0; height: 100vh;
                    background: var(--surface); border-right: 1px solid var(--border);
                    display: flex; flex-direction: column; overflow: hidden; }
.sidebar-brand    { height: 48px; display: flex; align-items: center; gap: 8px;
                    padding: 0 16px; border-bottom: 1px solid var(--border);
                    font-size: 15px; font-weight: 600; color: var(--text-strong); }
.sidebar-nav      { flex: 1; padding: 8px; display: flex; flex-direction: column; gap: 2px; }
.nav-item         { display: flex; align-items: center; gap: 8px; height: 36px;
                    padding: 0 10px; border-radius: 6px;
                    font-size: 13px; color: var(--text-muted);
                    text-decoration: none; transition: background 120ms, color 120ms; }
.nav-item:hover                { background: var(--surface-2); color: var(--text); }
.nav-item--active              { background: var(--primary-muted); color: var(--text-strong);
                                 border-left: 2px solid var(--primary);
                                 padding-left: 8px; }
.sidebar-footer   { padding: 8px; border-top: 1px solid var(--border); }
.sidebar-divider  { height: 1px; background: var(--border-muted); margin: 4px 0 8px; }
.sidebar-user     { display: flex; align-items: center; gap: 8px; padding: 8px 10px; }
.sidebar-avatar   { width: 24px; height: 24px; border-radius: 50%; }
.sidebar-username { font-size: 13px; color: var(--text-muted); }
```

### Topbar Component

```tsx
// components/shell/Topbar.tsx
'use client'
import { usePathname } from 'next/navigation'

const PAGE_TITLES: Record<string, string> = {
  '/overview':  'Overview',
  '/specs':     'Specs',
  '/mocks':     'Mock Servers',
  '/contracts': 'Contract Tests',
  '/settings':  'Settings',
}

export function Topbar() {
  const pathname = usePathname()
  const title = Object.entries(PAGE_TITLES).find(
    ([key]) => pathname.startsWith(key)
  )?.[1] ?? 'Mockline'

  return (
    <header className="topbar">
      <span className="topbar-title">{title}</span>
      <div className="topbar-right">
        {/* User menu dropdown — shadcn DropdownMenu */}
      </div>
    </header>
  )
}
```

```css
.topbar        { height: 48px; display: flex; align-items: center; justify-content: space-between;
                 padding: 0 24px; border-bottom: 1px solid var(--border);
                 background: var(--bg); flex-shrink: 0; }
.topbar-title  { font-size: 14px; font-weight: 500; color: var(--text-strong); }
```

---

## 6. Page-by-Page Dashboard Build

### 6.1 Overview Page (`/overview`)

**Data needed:** recent specs (5), active mock servers (all RUNNING), recent contract runs (3)

```tsx
// Server Component — fetch all three in parallel
export default async function OverviewPage() {
  const [specs, mocks, contracts] = await Promise.all([
    specsApi.list(),       // last 5
    mocksApi.list(),       // filter RUNNING client-side
    contractsApi.list(),   // last 3
  ])

  return (
    <div className="overview">
      <ActiveMocksSection mocks={mocks.filter(m => m.status === 'RUNNING')} />
      <RecentSpecsSection specs={specs.slice(0, 5)} />
      <RecentContractsSection runs={contracts.slice(0, 3)} />
    </div>
  )
}
```

```css
.overview { display: flex; flex-direction: column; gap: 24px; }
```

**No KPI metric grid. No "total specs" count cards. Go straight to real data.**

### 6.2 Specs Page (`/specs`)

```
Layout:
  PageHeader row:   "Specs" (h1 — only place we use a real heading) + "Upload spec" button (right)
  Table:            Name / Format / Versions / Last Updated / Actions
  Empty state:      When no specs
  Upload modal:     Opens on button click
```

```tsx
// app/(dashboard)/specs/page.tsx — Server Component
export default async function SpecsPage() {
  const specs = await specsApi.list()
  return <SpecsView initialSpecs={specs} />
}

// components/spec/SpecsView.tsx — Client Component
'use client'
export function SpecsView({ initialSpecs }: { initialSpecs: Spec[] }) {
  const [uploadOpen, setUploadOpen] = useState(false)

  const { data: specs } = useQuery({
    queryKey: queryKeys.specs.all(),
    queryFn: specsApi.list,
    initialData: initialSpecs,  // ← server data as initial, no loading state
  })

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Specs</h1>
        <Button variant="primary" onClick={() => setUploadOpen(true)}>
          Upload spec
        </Button>
      </div>

      {specs.length === 0
        ? <SpecsEmptyState onUpload={() => setUploadOpen(true)} />
        : <SpecsTable specs={specs} />
      }

      <UploadSpecModal open={uploadOpen} onClose={() => setUploadOpen(false)} />
    </>
  )
}
```

```css
.page-header  { display: flex; align-items: center; justify-content: space-between;
                margin-bottom: 20px; }
.page-title   { font-size: 18px; font-weight: 600; color: var(--text-strong); }
```

### 6.3 Spec Detail Page (`/specs/[id]`)

```
Layout:
  Breadcrumb:     Specs → [spec name]
  Tabs:           Endpoints | Versions | Contract Tests | Settings
  
  Endpoints tab:  Left panel (endpoint tree) + right panel (endpoint detail)
  Versions tab:   Version timeline table + "Compare" action
  Contracts tab:  List of contract runs for this spec
  Settings tab:   Rename, delete spec
```

```tsx
// app/(dashboard)/specs/[id]/page.tsx
export default async function SpecDetailPage({ params }: { params: { id: string } }) {
  const spec = await specsApi.get(params.id)
  return <SpecDetail initialSpec={spec} />
}
```

**Endpoint tree (left panel):**
```
GET    /users
GET    /users/{id}
POST   /users
PUT    /users/{id}
DELETE /users/{id}
GET    /products
POST   /products
```

Each entry: method badge + path. Clicking populates the right panel with schema detail.
Group by first path segment. Collapsible groups.

### 6.4 Mock Servers Page (`/mocks`)

```
Layout:
  PageHeader:   "Mock Servers" + "New mock server" button
  Table:         Name / Spec / Status / URL / Created / Actions
  Status:        Live polling — Client Component
```

```tsx
// The status column polls independently — don't re-fetch the whole table
// Use individual mock status queries per row
function MockStatusCell({ mockId }: { mockId: string }) {
  const { data } = useQuery({
    queryKey: queryKeys.mocks.status(mockId),
    queryFn:  () => mocksApi.get(mockId).then(m => m.status),
    refetchInterval: (data) =>
      data === 'BUILDING' ? 3000 : data === 'RUNNING' ? 15000 : false,
  })
  return <StatusBadge status={data ?? 'STOPPED'} />
}
```

### 6.5 Mock Server Detail Page (`/mocks/[id]`)

```
Layout:
  Top bar:        Mock name + StatusBadge + Start/Stop button (right)
  URL row:        MockUrl component (full width)
  Tabs:           Explorer | Logs | Settings

  Explorer tab:   Request panel (left, 40%) + Response panel (right, 60%)
  Logs tab:       Docker container log stream (future — Phase 2 stretch)
  Settings tab:   Resource limits, tier info, delete
```

**API Explorer layout:**

```tsx
function ApiExplorer({ mockUrl, endpoints }: ApiExplorerProps) {
  const [selectedEndpoint, setSelectedEndpoint] = useState(endpoints[0])
  const [response, setResponse] = useState<ApiResponse | null>(null)
  const [loading, setLoading] = useState(false)

  const sendRequest = async () => {
    setLoading(true)
    const start = performance.now()
    try {
      const res = await fetch(`${mockUrl}${selectedEndpoint.path}`, {
        method: selectedEndpoint.method,
      })
      const body = await res.json()
      setResponse({
        status: res.status,
        body,
        duration: Math.round(performance.now() - start),
        size: JSON.stringify(body).length,
      })
    } catch (e) {
      setResponse({ error: String(e) })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="explorer">
      <div className="explorer-request">
        <EndpointSelector
          endpoints={endpoints}
          value={selectedEndpoint}
          onChange={setSelectedEndpoint}
        />
        <RequestControls endpoint={selectedEndpoint} onSend={sendRequest} />
      </div>
      <div className="explorer-response">
        {response ? <ResponseDisplay response={response} /> : <ResponseEmpty />}
      </div>
    </div>
  )
}
```

```css
.explorer          { display: grid; grid-template-columns: 2fr 3fr;
                     gap: 0; height: calc(100vh - 200px);
                     border: 1px solid var(--border); border-radius: 8px; overflow: hidden; }
.explorer-request  { border-right: 1px solid var(--border); overflow-y: auto; }
.explorer-response { background: var(--surface-2); overflow-y: auto; }

@media (max-width: 900px) {
  .explorer        { grid-template-columns: 1fr; }
  .explorer-request{ border-right: none; border-bottom: 1px solid var(--border);
                     max-height: 300px; }
}
```

### 6.6 Contract Tests Page (`/contracts`)

```
Layout:
  PageHeader:   "Contract Tests" + "Run test" button
  Table:        Spec / Base URL / Endpoints / Pass / Fail / Run at / Status
  Run modal:    Spec picker + Base URL input + Run button
```

**Results page (`/contracts/[id]`):**

```
Layout:
  Summary row:   total endpoints / passed / failed / run time
  Results table: Method | Path | Expected Status | Got Status | Match | Detail
  Expandable rows: click to see expected vs received schema diff (inline, no modal)
```

```css
/* Pass/fail summary chips — not cards */
.summary-bar  { display: flex; gap: 16px; margin-bottom: 20px;
                padding: 14px 16px; background: var(--surface);
                border: 1px solid var(--border); border-radius: 8px; }
.summary-item { display: flex; align-items: center; gap: 6px;
                font-size: 13px; }
.summary-count{ font-family: var(--font-mono); font-weight: 600; }
.summary-label{ color: var(--text-muted); }
```

---

## 7. API Integration Layer

### Mutations with Optimistic Updates

```typescript
// Upload spec — invalidate list on success
function useCreateSpec() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: specsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.specs.all() })
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })
}

// Delete spec — optimistic removal from list
function useDeleteSpec() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: specsApi.delete,
    onMutate: async (specId) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.specs.all() })
      const previous = queryClient.getQueryData(queryKeys.specs.all())
      queryClient.setQueryData(queryKeys.specs.all(), (old: Spec[]) =>
        old.filter(s => s.id !== specId)
      )
      return { previous }
    },
    onError: (_, __, context) => {
      queryClient.setQueryData(queryKeys.specs.all(), context?.previous)
      toast.error('Failed to delete spec')
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.specs.all() })
    },
  })
}
```

### File Upload (Spec Upload Modal)

```typescript
// The spec file content is extracted in the browser and sent as a string
// Not multipart/form-data — the API accepts { name, content, format }
async function handleFileUpload(file: File) {
  const content = await file.text()
  const format = file.name.endsWith('.json') ? 'json' : 'yaml'

  // Client-side basic validation before API call
  if (file.size > 1_048_576) {
    throw new Error('Spec file must be under 1MB')
  }

  return specsApi.create({ name: file.name.replace(/\.(yaml|json)$/, ''), content, format })
}
```

### Error Display Conventions

```tsx
// Inline query error — inside the page, not full-page
{isError && (
  <div className="inline-error">
    <AlertIcon size={14} />
    <span>{error.message}</span>
    <button onClick={() => refetch()} className="btn-ghost">Retry</button>
  </div>
)}
```

```css
.inline-error { display: flex; align-items: center; gap: 8px; padding: 10px 14px;
                background: #2d0f0f; border: 1px solid var(--accent);
                border-radius: 6px; color: var(--accent); font-size: 13px; }
```

---

## 8. Responsiveness Contract

### Breakpoints

```
Mobile:  < 640px    (sm)
Tablet:  640–1024px (md)
Desktop: > 1024px   (lg)
```

### Dashboard Responsive Behaviour

| Breakpoint | Sidebar | Content |
|------------|---------|---------|
| Desktop (> 1024px) | 248px fixed | full |
| Tablet (640–1024px) | 64px icon-only | full |
| Mobile (< 640px) | hidden, hamburger opens sheet | full |

**Sidebar collapse (tablet):**
```tsx
// 64px wide — show only icons, tooltips on hover
// No text labels. No expansion on hover (that's a Codex move).
// Tablet users see icons with Tooltip from shadcn.
```

**Sidebar mobile (sheet):**
```tsx
// Use shadcn Sheet component
// Hamburger button in topbar (mobile only)
// Overlay closes on nav click
```

### Table Responsiveness

Tables do not collapse into card stacks on mobile. That is complex and rarely useful for developer tools.

Instead:
```css
/* Tables scroll horizontally on small screens */
.table-wrapper { overflow-x: auto; -webkit-overflow-scrolling: touch; }
```

Hide non-critical columns on small screens:
```css
@media (max-width: 640px) {
  .col-updated { display: none; } /* timestamp — not critical on mobile */
  .col-format  { display: none; } /* spec format — not critical on mobile */
}
```

### Typography Responsiveness

```css
/* Only the hero h1 is fluid. Everything else is fixed. */
h1 { font-size: clamp(28px, 4vw, 44px); }

/* All other type uses fixed sizes from the scale */
/* Never use vw or % for font-size in UI components */
```

### Touch Targets

All interactive elements must be at minimum `44px × 44px` on mobile:
```css
@media (max-width: 640px) {
  .btn-ghost { width: 44px; height: 44px; }
  .nav-item  { height: 44px; }
}
```

---

## 9. TanStack Query Patterns

### Standard Query Pattern

```typescript
// Every feature follows this hook pattern
export function useSpecs() {
  return useQuery({
    queryKey: queryKeys.specs.all(),
    queryFn: specsApi.list,
    staleTime: 30_000,
  })
}

export function useSpec(id: string) {
  return useQuery({
    queryKey: queryKeys.specs.detail(id),
    queryFn: () => specsApi.get(id),
    enabled: !!id,
  })
}
```

### Polling Pattern (Mock Status)

```typescript
export function useMockStatus(id: string) {
  return useQuery({
    queryKey: queryKeys.mocks.status(id),
    queryFn: () => mocksApi.get(id),
    refetchInterval: (query) => {
      const status = query.state.data?.status
      if (status === 'BUILDING') return 3_000   // poll fast while building
      if (status === 'RUNNING')  return 15_000  // poll slow while running
      return false                               // stop polling on STOPPED/FAILED
    },
    // Show stale data from list query immediately while detail loads
    placeholderData: (previousData) => previousData,
  })
}
```

### After Provision (Navigate + Poll)

```typescript
const provision = useMutation({
  mutationFn: mocksApi.provision,
  onSuccess: (newMock) => {
    // Add to cache immediately — no flicker on navigation
    queryClient.setQueryData(queryKeys.mocks.detail(newMock.id), newMock)
    queryClient.invalidateQueries({ queryKey: queryKeys.mocks.all() })
    router.push(`/mocks/${newMock.id}`)
    // Polling starts automatically when the detail page mounts
  },
})
```

---

## 10. Component Checklist Before Ship

Run through every component and page before marking it done.

### Structure
- [ ] Uses tokens (`var(--...)`) — no hardcoded hex values
- [ ] No `border-radius` over `8px` in any element
- [ ] No gradients (background, text, or border)
- [ ] No `box-shadow` over `0 2px 8px rgba(0,0,0,0.15)`
- [ ] No uppercase + letter-spacing labels
- [ ] No `<small>` tags used as eyebrows
- [ ] No decorative copy (section subtitles, "insight" blurbs)

### Data
- [ ] Server Component fetches initial data (no loading state on first render)
- [ ] Client Component receives `initialData` and passes to TanStack Query
- [ ] Error state handled inline (not full-page)
- [ ] Empty state implemented with functional copy + one CTA
- [ ] Loading state uses static placeholder rows (not spinners)

### Responsiveness
- [ ] Tested at 375px (mobile), 768px (tablet), 1280px (desktop)
- [ ] Tables use `overflow-x: auto` wrapper
- [ ] Non-critical table columns hidden on mobile
- [ ] All touch targets ≥ 44px on mobile
- [ ] Dashboard sidebar collapses to icon-only at tablet

### Accessibility
- [ ] All icon-only buttons have `title` attribute
- [ ] All form inputs have associated `<label>` with matching `htmlFor`/`id`
- [ ] Color is not the only indicator of state (StatusBadge has text label)
- [ ] Focus styles visible (browser default is fine — don't remove outlines)
- [ ] Images have `alt` attributes (empty string for decorative)

### Code
- [ ] No raw `fetch` calls outside `api-client.ts`
- [ ] No hardcoded API URLs anywhere
- [ ] Query keys use `queryKeys.*` factory — no inline strings
- [ ] Mutations invalidate the correct query keys on success