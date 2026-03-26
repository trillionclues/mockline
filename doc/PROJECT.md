# CLAUDE.md — Mockline PaaS

> Agent context file. Read this before touching any code. This document is the source of truth for architecture decisions, conventions, and constraints for the Mockline project.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Architecture & Key Components](#2-architecture--key-components)
3. [Technical Stack](#3-technical-stack)
4. [Project Structure](#4-project-structure)
5. [Setup & Commands](#5-setup--commands)
6. [Coding Standards](#6-coding-standards)
7. [Next.js 16 Best Practices](#7-nextjs-16-best-practices)
8. [Docker Patterns](#8-docker-patterns)
9. [Database & Prisma Conventions](#9-database--prisma-conventions)
10. [API Design](#10-api-design)
11. [Testing Strategy](#11-testing-strategy)
12. [Git Rules](#12-git-rules)
13. [Security & Guardrails](#13-security--guardrails)
14. [Feature Phases & Scope Boundaries](#14-feature-phases--scope-boundaries)
15. [Known Decisions & Why](#15-known-decisions--why)

---

## 1. Project Overview

**mockline** is a B2B web platform where engineering teams upload OpenAPI specs and instantly receive a live, isolated mock API server — powered by [`@trillionclues/contour`](https://www.npmjs.com/package/@trillionclues/contour) running inside a Docker container.

### Core User Flow

```
User uploads OpenAPI spec (.yaml / .json)
  → Mockline validates + parses the spec
  → Mockline builds a Docker image (Node + Contour + spec baked in)
  → Container starts, Contour runs `contour start spec.yaml`
  → Mockline exposes a unique mock URL: mock-{id}.mockline.xyz
  → User shares URL with frontend devs, testers, CI pipelines
```

### What Mockline Is NOT
- Not a spec editor (Monaco is read-only preview; edits happen externally)
- Not a bookmaker, payment processor, or user data broker
- Not a replacement for Contour CLI — Mockline is the platform layer on top
- Not a general-purpose container hosting service

### Relationship with Contour CLI

| | Contour | Mockline |
|---|---------|-------|
| Repo | `trillionclues/contour` | `trillionclues/mockline` |
| Published | `npm i @trillionclues/contour` | Web app (not on npm) |
| Role | Mock engine + CLI | Web UI + orchestration platform |
| Usage | Standalone CLI tool | Installed inside each Docker container as a dep |

> **Rule:** Never modify Contour source from within this repo. If a Contour bug is found, open a separate PR in the Contour repo. Mockline pins a specific Contour version and updates deliberately.

---

## 2. Architecture & Key Components

### High-Level Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                Mockline — Automated Mock API PaaS               │
│                                                                 │
│  ┌──────────────┐    ┌──────────────────┐    ┌───────────────┐  │
│  │  Next.js 16  │───▶│   Hono API       │───▶│  Dockerode    │  │
│  │  (App Router)│    │  (Express-style) │    │  (Docker SDK) │  │
│  └──────────────┘    └────────┬─────────┘    └───────┬───────┘  │
│                               │                       │          │
│                    ┌──────────▼──────────┐            │          │
│                    │   PostgreSQL        │  ┌─────────▼───────┐  │
│                    │   (via Prisma)      │  │  Docker Engine  │  │
│                    └─────────────────────┘  │  (Hetzner VPS)  │  │
│                               │             └────────┬────────┘  │
│                    ┌──────────▼──────────┐           │           │
│                    │   Redis (Upstash)   │  ┌────────▼────────┐  │
│                    │   Sessions + Cache  │  │  Traefik Proxy  │  │
│                    └─────────────────────┘  │  mock-{id}.mockline│  │
│                                             └─────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

#### `apps/web` — Next.js 16 Frontend
- All user-facing UI: spec upload, API explorer, contract test reports, schema diff viewer
- Server Components for data fetching where possible (spec lists, dashboards)
- Client Components only for interactive elements (Monaco editor, request builder, live status)
- Communicates with `apps/api` via internal fetch (server-to-server) or TanStack Query (client)
- Also consult the [UI Design Standard](UNCODIXIFY-UI-STANDARD.md)

#### `apps/api` — Hono Backend
- REST API consumed by the frontend and externally (CI integrations)
- Owns all Docker orchestration via `dockerode`
- Owns all database writes via Prisma
- Stateless — no session logic here; sessions live in Redis via BetterAuth
- Also consult the [Workflow Orchestration](WORKFLOW-ORCHESTRATION.md)

#### `packages/docker-manager` — Docker Orchestration Layer
- Wraps `dockerode` with typed, high-level functions: `buildMockImage`, `startMockContainer`, `stopContainer`, `removeContainer`
- Enforces resource limits on every container (CPU, memory)
- Used exclusively by `apps/api` — never imported by `apps/web`

#### `packages/spec-parser` — OpenAPI Utilities
- Parses and validates OpenAPI 3.x YAML/JSON specs
- Extracts endpoints, schemas, and metadata for the UI tree view
- Shared between `apps/api` (server validation) and `apps/web` (client-side preview)

#### `packages/db` — Prisma Client + Schema
- Single Prisma schema, single generated client
- Exported and consumed by `apps/api` only — the web app never touches the DB directly

---

## 3. Technical Stack

### Pinned Versions

| Layer | Package | Version | Notes |
|-------|---------|---------|-------|
| Runtime | Node.js | `22.x LTS` | Use `.nvmrc` |
| Package Manager | pnpm | `9.x` | Monorepo workspaces |
| Framework | Next.js | `16.x` | App Router only. No Pages Router. |
| API | Hono | `^4.x` | Lightweight, typed, edge-compatible |
| Language | TypeScript | `^5.5` | Strict mode on everywhere |
| Styling | TailwindCSS | `^4.x` | |
| Components | shadcn/ui | latest | Copy components into `apps/web/components/ui` |
| Data Fetching | TanStack Query | `^5.x` | `@tanstack/react-query` |
| Editor | Monaco | `@monaco-editor/react ^4.x` | |
| ORM | Prisma | `^5.x` | |
| Auth | BetterAuth | `^1.x` | |
| Docker SDK | dockerode | `^4.x` | |
| Cache | ioredis | `^5.x` | Points to Upstash in prod |
| Spec Parsing | `@readme/openapi-parser` | `^3.x` | Validates + dereferences |
| Testing (unit) | Vitest | `^2.x` | |
| Testing (e2e) | Playwright | `^1.x` | |
| Linting | ESLint | `^9.x` (flat config) | |
| Formatting | Prettier | `^3.x` | |
| Contour Engine | `@trillionclues/contour` | pin to latest stable | Installed inside Docker images only |

### Monorepo Layout

```
mockline/
├── apps/
│   ├── web/                  # Next.js 16 (App Router)
│   └── api/                  # Hono API server
├── packages/
│   ├── db/                   # Prisma schema + client
│   ├── docker-manager/       # dockerode abstraction
│   ├── spec-parser/          # OpenAPI validation/parsing
│   └── types/                # Shared TypeScript types/interfaces
├── docker/
│   ├── mock-server/          # Dockerfile for @trillionclues/contour containers
│   └── traefik/              # Traefik config + labels
├── .github/
│   └── workflows/            # CI/CD pipelines
├── docker-compose.yml        # Local dev: postgres + redis + traefik + api + web
├── docker-compose.prod.yml   # Production overrides
├── pnpm-workspace.yaml
├── turbo.json
└── CLAUDE.md                 # ← you are here
```

---

## 4. Project Structure

### `apps/web` (Next.js)

```
apps/web/
├── app/
│   ├── (auth)/               # Route group: login, register pages
│   ├── (dashboard)/          # Route group: authenticated app shell
│   │   ├── layout.tsx        # Dashboard shell with sidebar
│   │   ├── page.tsx          # Overview / home
│   │   ├── specs/
│   │   │   ├── page.tsx      # Spec list
│   │   │   ├── [id]/
│   │   │   │   ├── page.tsx  # Spec detail + mock server
│   │   │   │   └── diff/
│   │   │   │       └── page.tsx  # Schema version diff
│   │   ├── mocks/
│   │   │   └── [id]/page.tsx # Live API explorer
│   │   └── contracts/
│   │       └── [id]/page.tsx # Contract test report
│   ├── api/                  # Next.js route handlers (auth callbacks only)
│   ├── globals.css
│   └── layout.tsx            # Root layout
├── components/
│   ├── ui/                   # shadcn/ui components (auto-generated)
│   ├── spec/                 # Spec-specific components
│   ├── mock/                 # Mock server components
│   ├── contracts/            # Contract testing components
│   └── shared/               # Generic app-wide components
├── lib/
│   ├── api-client.ts         # Typed fetch wrapper pointing to apps/api
│   ├── auth.ts               # BetterAuth client config
│   └── utils.ts              # cn(), formatters, etc.
├── hooks/                    # Custom React hooks
└── types/                    # Web-only type extensions
```

### `apps/api` (Hono)

```
apps/api/
├── src/
│   ├── index.ts              # Entry point, Hono app, middleware
│   ├── routes/
│   │   ├── specs.ts          # CRUD for OpenAPI specs
│   │   ├── mocks.ts          # Mock server lifecycle
│   │   ├── contracts.ts      # Contract test runner
│   │   └── schemas.ts        # Schema version history + diff
│   ├── services/
│   │   ├── mock-provisioner.ts  # Orchestrates docker-manager
│   │   ├── contract-runner.ts   # Hits real API + compares to spec
│   │   └── schema-differ.ts     # Computes diff between spec versions
│   ├── middleware/
│   │   ├── auth.ts           # Validates BetterAuth session
│   │   └── rate-limit.ts     # Redis-backed rate limiter
│   └── lib/
│       └── redis.ts          # ioredis client singleton
└── Dockerfile
```

---

## 5. Setup & Commands

### Prerequisites
- Docker Desktop (or Docker Engine on Linux)
- Node.js 22.x (use `nvm use` in repo root)
- pnpm 9.x (`npm i -g pnpm`)

### First-Time Setup

```bash
# Clone
git clone https://github.com/trillionclues/mockline
cd mockline

# Install all deps (all workspaces)
pnpm install

# Copy env files
cp apps/web/.env.example apps/web/.env.local
cp apps/api/.env.example apps/api/.env

# Spin up local infra (postgres, redis, traefik)
docker compose up -d db cache proxy

# Run DB migrations
pnpm db:migrate

# Seed dev data (optional)
pnpm db:seed

# Start all apps in dev mode
pnpm dev
```

### Common Commands

```bash
# Dev
pnpm dev                    # Starts web (3000) + api (4000) concurrently via turbo
pnpm dev --filter=web       # Only Next.js
pnpm dev --filter=api       # Only Hono API

# Database
pnpm db:migrate             # Run prisma migrate dev
pnpm db:push                # Push schema without migration (prototyping only)
pnpm db:studio              # Open Prisma Studio
pnpm db:seed                # Run seed script

# Build
pnpm build                  # Build all apps + packages
pnpm build --filter=web     # Build only Next.js

# Test
pnpm test                   # Run all unit tests (Vitest)
pnpm test:e2e               # Run Playwright tests
pnpm test:coverage          # Coverage report

# Lint & Format
pnpm lint                   # ESLint across all packages
pnpm format                 # Prettier write
pnpm typecheck              # tsc --noEmit across all packages

# Docker (local)
docker compose up -d        # Start all local services
docker compose down         # Stop all
docker compose logs -f api  # Tail API logs

# Docker (mock containers — for testing the provisioner)
pnpm mock:build             # Build the mock-server base image locally
pnpm mock:test              # Spin up a test mock container and hit it
```

### Environment Variables

#### `apps/api/.env`

```env
# Server
PORT=4000
NODE_ENV=development

# Database
DATABASE_URL="postgresql://mockline:mockline@localhost:5432/mockline_dev"

# Redis
REDIS_URL="redis://localhost:6379"

# Auth
BETTER_AUTH_SECRET="generate-with-openssl-rand-hex-32"
BETTER_AUTH_URL="http://localhost:4000"

# GitHub OAuth (BetterAuth)
GITHUB_CLIENT_ID=""
GITHUB_CLIENT_SECRET=""

# Docker
DOCKER_HOST="unix:///var/run/docker.sock"   # local
# DOCKER_HOST="tcp://hetzner-vps-ip:2375"   # prod (use TLS)
MOCK_BASE_DOMAIN="localhost"                 # prod: mockline.xyz

# Contour version to bake into containers
CONTOUR_VERSION="1.2.1"                     # pin to e.g. "0.4.2" in prod

# Internal
INTERNAL_API_SECRET="generate-random-secret" # used by web→api server calls
```

#### `apps/web/.env.local`

```env
NEXT_PUBLIC_API_URL="http://localhost:4000"
NEXT_PUBLIC_MOCK_BASE_URL="http://localhost"  # prod: https://mock-{id}.mockline.xyz

# BetterAuth (client)
NEXT_PUBLIC_AUTH_URL="http://localhost:4000"

# Internal server-to-server calls
INTERNAL_API_SECRET="must-match-api-value"
```

---

## 6. Coding Standards

### TypeScript

- **Strict mode always.** `tsconfig.json` must have `"strict": true`. No exceptions.
- **No `any`.** Use `unknown` and narrow, or define a proper type. `// @ts-ignore` requires a comment explaining why.
- **Prefer `type` over `interface`** for data shapes. Use `interface` only for things meant to be extended/implemented.
- **Explicit return types** on all exported functions and API route handlers.
- **Zod for all runtime validation.** Never trust external input (form data, API responses, spec file contents) without Zod parsing.

```typescript
// ✅ Good
import { z } from 'zod'

const CreateSpecSchema = z.object({
  name: z.string().min(1).max(100),
  content: z.string().min(1),
  format: z.enum(['yaml', 'json']),
})

type CreateSpecInput = z.infer<typeof CreateSpecSchema>

export async function createSpec(input: unknown): Promise<Spec> {
  const parsed = CreateSpecSchema.parse(input) // throws ZodError on invalid
  // ...
}

// ❌ Bad
export async function createSpec(input: any) {
  // trusting raw input
}
```

### Naming Conventions

| Thing | Convention | Example |
|-------|-----------|---------|
| Files | `kebab-case` | `mock-provisioner.ts` |
| React Components | `PascalCase` file + export | `SpecUploader.tsx` |
| Functions | `camelCase` | `buildMockImage()` |
| Types/Interfaces | `PascalCase` | `MockServer`, `SpecVersion` |
| Env vars | `SCREAMING_SNAKE_CASE` | `DOCKER_HOST` |
| DB table names | `snake_case` (Prisma maps) | `mock_servers` |
| Constants | `SCREAMING_SNAKE_CASE` | `MAX_CONTAINERS_PER_USER` |
| Zod schemas | `PascalCase + Schema` | `CreateSpecSchema` |

### Error Handling

- **Never swallow errors silently.** Either handle, rethrow, or log with context.
- API routes return consistent error shapes. Use a central `ApiError` class.
- Docker operations can fail at any point — wrap all `dockerode` calls in try/catch and update container status in DB on failure.

```typescript
// packages/types/src/errors.ts
export class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public code?: string
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

// Usage in routes
throw new ApiError(404, 'Spec not found', 'SPEC_NOT_FOUND')
throw new ApiError(429, 'Container limit reached', 'CONTAINER_LIMIT_EXCEEDED')
```

### Imports

- Use absolute imports via TypeScript path aliases. No `../../../` chains.
- Monorepo packages imported as `@mockline/db`, `@mockline/types`, `@mockline/docker-manager`.

```json
// tsconfig paths
{
  "@mockline/*": ["packages/*/src"]
}
```

### Comments

- **No comments that explain *what* code does** — that's what code is for.
- **Comments explain *why*** — business rules, non-obvious constraints, workarounds.
- JSDoc on all exported public API functions in `packages/`.

```typescript
// ✅ Good
// Containers are stopped (not removed) to preserve logs for debugging.
// Removed after 24hrs by the cleanup cron job.
await docker.stopContainer(containerId)

// ❌ Bad
// Stop the container
await docker.stopContainer(containerId)
```

---

## 7. Next.js 16 Best Practices

### App Router Rules

- **Default to Server Components.** Only add `'use client'` when the component uses browser APIs, event handlers, or React hooks.
- **Never fetch data in Client Components.** Data fetching belongs in Server Components or Route Handlers. Client components receive data as props or via TanStack Query.
- **Colocate loading and error states.** Every route segment that fetches data should have a `loading.tsx` and `error.tsx` sibling.
- **Parallel routes** for the dashboard layout (`@specs`, `@mocks` slots) where independent sections load simultaneously.

```
app/(dashboard)/
├── layout.tsx          # Shell: sidebar + @specs + @mocks in parallel
├── @specs/
│   ├── page.tsx
│   └── loading.tsx
└── @mocks/
    ├── page.tsx
    └── loading.tsx
```

### Data Fetching Patterns

```typescript
// ✅ Server Component: fetch directly, no useEffect
// app/(dashboard)/specs/page.tsx
import { getSpecs } from '@/lib/api-client'

export default async function SpecsPage() {
  const specs = await getSpecs()  // server-side fetch, no loading state needed
  return <SpecList specs={specs} />
}

// ✅ Client Component: TanStack Query for interactive/real-time data
// components/mock/MockStatus.tsx
'use client'
import { useQuery } from '@tanstack/react-query'

export function MockStatus({ mockId }: { mockId: string }) {
  const { data: status } = useQuery({
    queryKey: ['mock-status', mockId],
    queryFn: () => fetchMockStatus(mockId),
    refetchInterval: 3000,  // poll every 3s for live container status
  })
  return <StatusBadge status={status} />
}
```

### Server Actions

Use Server Actions for mutations triggered from Server Components. For mutations in Client Components, call the API directly via TanStack Query mutations (not Server Actions, to keep API logic in `apps/api`).

```typescript
// ✅ Server Action for spec upload form (Server Component context)
'use server'
export async function uploadSpec(formData: FormData) {
  const file = formData.get('spec') as File
  // validate + call apps/api
}
```

### Route Handlers (`app/api/`)

Only use Next.js route handlers for:
1. BetterAuth callbacks (`/api/auth/[...all]`)
2. Webhooks from external services

All other API logic lives in `apps/api` (Hono). Do not build a parallel API inside Next.js.

### Metadata & SEO

```typescript
// app/layout.tsx
export const metadata: Metadata = {
  title: { template: '%s | Mockline', default: 'Mockline — Automated Mock API PaaS' },
  description: 'Instant mock API servers from your OpenAPI specs',
}
```

### Performance

- Use `next/dynamic` with `{ ssr: false }` for Monaco Editor (large, browser-only)
- Use `<Suspense>` boundaries around any async Server Component trees
- `unstable_cache` or `cache()` for expensive server-side data (spec parsing, schema trees)
- Images via `next/image` always

```typescript
const MonacoEditor = dynamic(() => import('@monaco-editor/react'), {
  ssr: false,
  loading: () => <EditorSkeleton />,
})
```

---

## 8. Docker Patterns

### The Mock Container Dockerfile

Every mock server runs this image. Lives at `docker/mock-server/Dockerfile`.

```dockerfile
FROM node:22-alpine

WORKDIR /app

# Install Contour — this is the ONLY place Contour runs as a process
RUN npm install -g @trillionclues/contour@${CONTOUR_VERSION:-latest}

# The spec file is baked in at build time (not mounted)
# This ensures immutability — same image = same mock behavior
COPY spec.yaml ./spec.yaml

# Expose Contour's default port
EXPOSE 3001

# Health check so Docker (and we) know when it's ready
HEALTHCHECK --interval=5s --timeout=3s --retries=5 \
  CMD wget -qO- http://localhost:3001/health || exit 1

CMD ["contour", "start", "spec.yaml", "--port", "3001"]
```

> **Important:** Specs are baked into the image at build time, not mounted as volumes. This is intentional — it makes containers immutable and reproducible. If a user uploads a new spec version, a new image is built and a new container is started.

### `packages/docker-manager` API

```typescript
// All public functions in docker-manager

export async function buildMockImage(params: {
  specContent: string
  specFormat: 'yaml' | 'json'
  imageTag: string                 // e.g. "mockline-mock-{specId}-{versionHash}"
  contourVersion: string
}): Promise<{ imageId: string }>

export async function startMockContainer(params: {
  imageId: string
  containerId: string              // our DB ID, used as container name
  resourceLimits?: {
    memoryMb?: number              // default: 128
    cpuPercent?: number            // default: 10
  }
}): Promise<{ containerId: string; port: number }>

export async function stopContainer(containerId: string): Promise<void>
export async function removeContainer(containerId: string): Promise<void>
export async function getContainerStatus(containerId: string): Promise<ContainerStatus>
export async function listActiveContainers(): Promise<ContainerInfo[]>
```

### Resource Limits (Non-Negotiable)

Every container MUST have limits set. Without these, a single user can exhaust the host.

```typescript
const DEFAULT_RESOURCE_LIMITS = {
  Memory: 64,     // 128MB hard limit
  MemorySwap: 64 * 1024 * 1024, // 256MB swap limit
  NanoCpus: 0.1 * 1e9,           // 10% of one CPU core
  PidsLimit: 50,   
}
```

### Container Naming Convention

```
mockline-mock-{mockServerId}
```

e.g. `mockline-mock-cm8xyz123abc`

This makes it easy to find the DB record from Docker logs and vice versa.

### Traefik Labels

Traefik dynamically routes `mock-{id}.mockline.xyz` → container. Labels are set at container start:

```typescript
Labels: {
  'traefik.enable': 'true',
  [`traefik.http.routers.${containerId}.rule`]: `Host(\`mock-${mockId}.mockline.xyz\`)`,
  [`traefik.http.services.${containerId}.loadbalancer.server.port`]: '3001',
  'traefik.http.routers.${containerId}.entrypoints': 'websecure',
  'traefik.http.routers.${containerId}.tls.certresolver': 'letsencrypt',
}
```

### Auto-Stop Policy

Free tier containers auto-stop after 1 hour of inactivity. This is enforced by a cron job in `apps/api` that runs every 15 minutes, checks `lastAccessedAt` on mock servers, and stops stale ones.

```typescript
// Never trust container uptime alone — track access time in DB
await db.mockServer.update({
  where: { id: mockServerId },
  data: { lastAccessedAt: new Date() }
})
```

### Volume Persistence for Stateful Mock Servers *(Upcoming)*

Mock servers are **stateless by default**. When a user opts into stateful mode (`--stateful`), user-generated data (POST/PUT/DELETE operations) persists across container restarts via Docker named volumes.

#### Strategy: Backup volumes, not containers

| | Container | Volume |
|---|---|---|
| Contains | OS, Node, Contour binary, spec | User state — POST/PUT data, request logs, config |
| Rebuilt from | Docker image (deterministic) | Nothing — user-generated data |
| Typical size | 200–400MB | < 10MB |
| On restart | New container from same image | Same volume re-mounted |

#### Volume data layout

```
/mockline-data/
├── state.json          # POST/PUT/DELETE persisted records (--stateful only)
├── config.json         # Runtime options (delay, error-rate, auth, headers)
└── requests.log        # Request history for session explorer
```

#### Volume lifecycle

```
User provisions mock (stateful: true)
  → Container starts, named volume created: mockline-data-{mockId}
  → Volume mounted at /mockline-data inside container

User POSTs data → Written to volume state.json
Auto-stop fires → Container stopped, volume preserved ✓
User returns   → New container, same volume mounted, state restored ✓
User deletes   → Container + volume both removed
```

#### Contour CLI options passed as container env vars

The `config` JSON field on `MockServer` stores runtime options. These are passed through to the container as environment variables:

```typescript
// docker-manager/startMockContainer
const envVars = [
  `CONTOUR_PORT=3001`,
  config.stateful    ? `CONTOUR_STATEFUL=true` : '',
  config.delay       ? `CONTOUR_DELAY=${config.delay}` : '',
  config.errorRate   ? `CONTOUR_ERROR_RATE=${config.errorRate}` : '',
  config.requireAuth ? `CONTOUR_REQUIRE_AUTH=true` : '',
  config.deterministic ? `CONTOUR_DETERMINISTIC=true` : '',
].filter(Boolean)

// Volume mount (only for stateful mode)
const binds = config.stateful
  ? [`mockline-data-${mockId}:/mockline-data`]
  : []
```

#### Dockerfile update for volume support

```dockerfile
# Added to docker/mock-server/Dockerfile
VOLUME /mockline-data
ENV CONTOUR_DATA_DIR=/mockline-data

# CMD now reads env vars to build the CLI args
CMD ["sh", "-c", "contour start spec.yaml --port ${CONTOUR_PORT:-3001} ${CONTOUR_STATEFUL:+--stateful} ${CONTOUR_DELAY:+--delay $CONTOUR_DELAY} ${CONTOUR_ERROR_RATE:+--error-rate $CONTOUR_ERROR_RATE} ${CONTOUR_REQUIRE_AUTH:+--require-auth} ${CONTOUR_DETERMINISTIC:+--deterministic}"]
```

---

## 9. Database & Prisma Conventions

### Schema Design Principles

- All IDs are `cuid2` (`@default(cuid())`). No integer IDs exposed publicly.
- All tables have `createdAt` and `updatedAt` (via `@updatedAt`).
- Soft deletes via `deletedAt DateTime?` where history matters (specs, mock servers).
- JSON columns only for schema content (OpenAPI spec text) and test results — not for relational data.

### Key Models (abbreviated)

```prisma
model User {
  id            String       @id @default(cuid())
  email         String       @unique
  name          String?
  githubId      String?      @unique
  tier          Tier         @default(FREE)
  specs         Spec[]
  mockServers   MockServer[]
  createdAt     DateTime     @default(now())
  updatedAt     DateTime     @updatedAt
}

model Spec {
  id          String         @id @default(cuid())
  userId      String
  user        User           @relation(fields: [userId], references: [id])
  name        String
  versions    SpecVersion[]
  mockServers MockServer[]
  createdAt   DateTime       @default(now())
  updatedAt   DateTime       @updatedAt
  deletedAt   DateTime?
}

model SpecVersion {
  id          String     @id @default(cuid())
  specId      String
  spec        Spec       @relation(fields: [specId], references: [id])
  version     Int                          // auto-incrementing per spec
  content     String                       // raw YAML/JSON text
  format      SpecFormat                   // YAML | JSON
  hash        String                       // SHA256 of content for dedup
  createdAt   DateTime   @default(now())
  @@unique([specId, version])
}

model MockServer {
  id              String            @id @default(cuid())
  specId          String
  specVersionId   String
  userId          String
  dockerImageId   String?
  dockerContainerId String?
  status          MockServerStatus  @default(BUILDING)  // BUILDING|RUNNING|STOPPED|FAILED
  publicUrl       String?           // mock-{id}.mockline.xyz
  port            Int?              // exposed host port
  tier            Tier
  stateful        Boolean           @default(false)     // persist POST/PUT/DELETE data
  volumeName      String?           // Docker named volume (only when stateful)
  config          Json?             // runtime options: { delay, errorRate, requireAuth, deterministic }
  lastAccessedAt  DateTime          @default(now())
  createdAt       DateTime          @default(now())
  updatedAt       DateTime          @updatedAt
  deletedAt       DateTime?
}

enum Tier { FREE PRO TEAM }
enum MockServerStatus { BUILDING RUNNING STOPPED FAILED REMOVED }
enum SpecFormat { YAML JSON }
```

### Migration Rules

- Never edit migrations after merging. Create a new migration instead.
- Name migrations descriptively: `add_mock_server_status_enum`, not `migration_001`.
- No raw SQL in migrations unless Prisma can't express it. Document why if used.
- Always run `pnpm typecheck` after schema changes — Prisma types update and may break callers.

---

## 10. API Design

### Conventions

- **REST with consistent resource naming.** Nouns, not verbs. Plural collections.
- All responses wrapped in `{ data, error, meta }` envelope.
- Timestamps in ISO 8601 (`2025-01-15T10:30:00Z`).
- Pagination via `?page=1&limit=20` with meta: `{ total, page, limit, hasMore }`.

### Response Envelope

```typescript
// Success
{ "data": { ... }, "error": null }

// Error
{ "data": null, "error": { "code": "SPEC_NOT_FOUND", "message": "Spec not found" } }

// Paginated
{
  "data": [...],
  "error": null,
  "meta": { "total": 42, "page": 1, "limit": 20, "hasMore": true }
}
```

### Route Reference

```
# Specs
GET    /specs                        # List user's specs
POST   /specs                        # Upload new spec
GET    /specs/:id                    # Get spec + versions
DELETE /specs/:id                    # Soft delete spec
GET    /specs/:id/versions           # Version history
POST   /specs/:id/versions           # Upload new version
GET    /specs/:id/versions/:v1/diff/:v2  # Diff two versions

# Mock Servers
GET    /mocks                        # List user's mock servers
POST   /mocks                        # Provision new mock server (specVersionId in body)
GET    /mocks/:id                    # Get mock server details + status
POST   /mocks/:id/start              # Start a stopped server
POST   /mocks/:id/stop               # Stop a running server
DELETE /mocks/:id                    # Stop + remove

# Contract Testing
POST   /contracts                    # Run contract test (specId + baseUrl in body)
GET    /contracts/:id                # Get test run results
GET    /contracts?specId=...         # List test runs for a spec
```

### Rate Limits

Enforced in `apps/api` middleware via Redis:

| Tier | Endpoint | Limit |
|------|---------|-------|
| All | `POST /mocks` (provision) | 10/hour |
| Free | `POST /mocks` (running at once) | 1 total |
| Pro | `POST /mocks` (running at once) | 5 total |
| All | `POST /contracts` | 20/hour |
| All | General | 200 req/min |

---

## 11. Testing Strategy

### Pyramid

```
          /\
         /e2e\         ← Few: critical user flows only
        /------\
       / integr \      ← Some: API routes + Docker + DB
      /----------\
     /    unit    \    ← Many: services, utilities, parsers
    /--------------\
```

### Unit Tests (Vitest)

- Test all functions in `packages/spec-parser`, `packages/docker-manager`, and service layer in `apps/api/src/services/`
- Test Zod schemas with valid and invalid inputs
- No database or Docker connections in unit tests — mock with `vi.mock()`
- Colocate test files: `spec-parser.test.ts` next to `spec-parser.ts`
- Coverage threshold: 80% for `packages/`, 60% for `apps/api/src/services/`

```typescript
// packages/spec-parser/src/__tests__/validate-spec.test.ts
import { describe, it, expect } from 'vitest'
import { validateSpec } from '../validate-spec'

describe('validateSpec', () => {
  it('accepts valid OpenAPI 3.1 spec', async () => {
    const result = await validateSpec(validYamlFixture)
    expect(result.valid).toBe(true)
  })

  it('rejects spec missing openapi version field', async () => {
    const result = await validateSpec(missingVersionFixture)
    expect(result.valid).toBe(false)
    expect(result.errors).toContainEqual(
      expect.objectContaining({ path: 'openapi' })
    )
  })
})
```

### Integration Tests (Vitest + testcontainers)

- Test API routes with a real PostgreSQL container via `testcontainers`
- Mock Docker operations (don't spin up real containers in CI)
- Run against `apps/api` routes directly without an HTTP server (Hono supports this)
- Live in `apps/api/src/__tests__/`

```typescript
// Test the full spec upload + provisioning flow
// with real DB, mocked Docker
import { mockDockerManager } from '@mockline/docker-manager/mocks'
vi.mock('@mockline/docker-manager', () => mockDockerManager)
```

### E2E Tests (Playwright)

- Cover only the most critical paths:
  1. Sign in with GitHub
  2. Upload a spec, see it parsed
  3. Provision a mock server, see it go RUNNING
  4. Hit the mock URL and get a valid response
  5. Run a contract test, see results
- Run against a local Docker Compose stack with real containers
- Lives in `apps/web/e2e/`

### Test Fixtures

Maintain a set of OpenAPI spec fixtures in `packages/spec-parser/src/__tests__/fixtures/`:
- `petstore.yaml` — valid, simple
- `petstore-breaking-change.yaml` — removed endpoint, changed field type
- `invalid-missing-paths.yaml` — missing required field
- `large-spec.yaml` — 100+ endpoints for performance testing

---

## 12. Git Rules

### Branch Naming

```
feat/spec-upload-drag-drop
feat/mock-provisioner-dockerode
fix/container-timeout-not-clearing
chore/upgrade-prisma-5.12
docs/update-api-reference
test/mock-provisioner-unit-tests
```

### Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat(mocks): add auto-stop after 1hr inactivity
fix(api): handle dockerode build error on malformed spec
chore(deps): pin contour to 0.4.2
test(spec-parser): add fixtures for breaking change detection
docs(readme): add Docker setup instructions
refactor(docker-manager): extract resource limits to constants
```

**Scope** = the package/app/feature area. Keep it short.

### PR Rules

- Every PR must pass: `pnpm lint`, `pnpm typecheck`, `pnpm test`
- PRs touching Docker provisioning require at least one reviewer who has tested locally
- Never merge a PR that contains `// TODO: remove before merge` or `console.log` (except intentional logging)
- Squash-merge feature branches into `main`
- `main` must always be deployable

### Protected Branches

- `main` — squash merge only, no force push, CI must pass
- `production` — only from `main`, manual deploy trigger

---

## 13. Security & Guardrails

### Authentication & Authorization

- All `/api/*` routes in `apps/api` require a valid BetterAuth session, except `GET /health`
- Every resource query MUST include `userId` from the session — never trust a user-supplied `userId`
- Ownership check before any mutation: `WHERE id = ? AND userId = ?`

```typescript
// ✅ Safe: always scope queries to authenticated user
const spec = await db.spec.findFirst({
  where: { id: specId, userId: session.user.id }
})
if (!spec) throw new ApiError(404, 'Spec not found')

// ❌ Never: trust user-supplied ID alone
const spec = await db.spec.findFirst({ where: { id: specId } })
```

### Container Security

- **Never run containers as root.** The mock-server Dockerfile uses `USER node` after setup.
- **No host volume mounts** in mock containers. Specs are baked in at build time.
- **Network isolation.** Mock containers are on a dedicated Docker network with no access to the host network or other services.
- **Docker socket protection.** The `DOCKER_HOST` socket is never exposed to the web app. Only `apps/api` talks to Docker.
- **No privileged containers.** `dockerode` calls never set `Privileged: true`.

```typescript
// docker-manager always enforces this
const securityOpts = {
  Privileged: false,
  ReadonlyRootfs: false,        // Contour needs to write temp files
  SecurityOpt: ['no-new-privileges'],
  CapDrop: ['ALL'],             // Drop all Linux capabilities
  CapAdd: [],                   // Add back none
}
```

### Input Validation

- Every API endpoint validates its entire input with Zod before any business logic
- OpenAPI spec content is validated through `@readme/openapi-parser` — invalid specs are rejected before any Docker operation
- File upload size limit: 1MB per spec file (OpenAPI specs have no reason to be larger)
- Spec content is stored as text in PostgreSQL — never executed, never eval'd

### Secrets

- No secrets in code. All via env vars.
- No secrets in Docker image layers (they're baked in at runtime via env).
- GitHub Actions secrets for CI/CD — never hardcode tokens.
- Rotate `BETTER_AUTH_SECRET` will invalidate all sessions — document this.

### Rate Limiting

- Redis-backed rate limiting on all `POST` endpoints (see [API Design](#10-api-design))
- Per-user container limits enforced at DB level, not just Redis (double enforcement)
- Abuse signals: > 5 failed spec parses in 10 mins → temp block

### Dependency Security

```bash
# Run on every PR
pnpm audit --audit-level=high

# Automated via GitHub Actions weekly
```

### What Mockline Does NOT Need (Scope Guard)

- No payment processing in this repo (future: Stripe in separate service)
- No user-uploaded code execution beyond Contour's scope
- No file system access outside of designated temp dirs for image builds
- No inter-container communication (each mock container is isolated)

---

## 14. Feature Phases & Scope Boundaries

### Phase 1 — Foundation (Weeks 1–3)
**In scope:**
- Spec upload (YAML/JSON), validation, tree view
- Mock server provisioning via Docker
- Live API explorer (send requests to mock, see responses)
- Container lifecycle (start/stop/delete + auto-stop at 1hr)
- Auth (GitHub OAuth via BetterAuth)
- Shareable mock URLs

**Out of scope (do not build yet):**
- Contract testing
- Schema diffing
- Team workspaces
- Webhooks
- Payment/billing

### Phase 2 — Contract Testing (Weeks 4–5)
**In scope:**
- Contract test runner (spec + real API URL → pass/fail per endpoint)
- Test report UI
- `npx @trillionclues/contour test` CI command

**Out of scope:**
- GitHub Actions integration (Phase 2 stretch)
- Schema diffing

### Phase 3 — Schema Diffing & Collaboration (Weeks 6–7)
**In scope:**
- Spec version history
- Visual diff (added/removed/changed endpoints)
- Breaking change detection
- Shareable links (already done in Phase 1)
- Team workspaces (basic)

**Out of scope:**
- Webhook alerts (ship if time allows)
- Billing/payment (post-launch)

### Phase 4 — Stateful Mocks & Configure Panel *(Upcoming)*
**In scope:**
- Volume persistence: named Docker volumes for stateful mock servers
- `stateful`, `config`, `volumeName` fields on MockServer model
- Contour CLI options passed as container env vars (delay, error-rate, auth, deterministic)
- Dashboard UI: "Configure" panel when provisioning a mock server — toggles for stateful mode, delay range, error rate, require auth
- Request history explorer: view logged requests from the volume
- Volume cleanup on mock server deletion

**Out of scope:**
- Custom response overrides (per-endpoint response editing)
- Volume backup to external storage (S3/R2)

---

## 15. Known Decisions & Why

| Decision | Why |
|----------|-----|
| **Hono for API, not Next.js route handlers** | Docker orchestration is long-running and stateful. Next.js serverless functions have execution time limits. Hono runs on a persistent server alongside the Docker socket. |
| **Spec baked into image, not volume-mounted** | Immutability. Same spec version = same image hash = reproducible behavior. Mounts would allow drift. |
| **Contour installed in containers, not in `apps/api`** | Separation of concerns. `apps/api` orchestrates; the container runs the mock. Avoids port conflicts and process management complexity in the API server. |
| **PostgreSQL over MongoDB** | Relational data (users → specs → versions → mock servers) benefits from foreign keys and joins. JSON columns handle the unstructured spec content. |
| **Upstash Redis over self-hosted** | Free tier is sufficient for dev; no ops overhead for cache/rate-limit. Easy to swap for self-hosted if needed. |
| **No Pages Router** | App Router is the direction for Next.js. New patterns (Server Components, Server Actions) are only available in App Router. |
| **pnpm workspaces + Turborepo** | Monorepo with shared packages (`@mockline/db`, `@mockline/types`) needs a build graph. Turbo handles caching and parallelism. |
| **Soft deletes on Spec + MockServer** | Users may need to recover accidentally deleted specs. Hard deletes are irreversible. Docker images are cleaned up asynchronously. |
| **`cuid2` for all IDs** | Globally unique, URL-safe, unguessable, time-sortable. Better than UUIDs for public-facing URLs (`mock-cm8xyz123.mockline.xyz`). |
| **Volume-only backup, not container backup** | Containers are reproducible from the Docker image (which is built from the spec). Volumes hold the only irreproducible data (user POST/PUT state, request logs). Backing up a 400MB container when 99% is deterministic is wasteful vs. backing up a <10MB volume. |
| **Stateful mode is opt-in** | Most mock use cases (frontend dev, CI/CD, demos) are ephemeral. Stateful mode adds volume management overhead. Users who need it opt in explicitly. |