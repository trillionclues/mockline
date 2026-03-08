<p align="center">
  <strong>mockline</strong>
</p>

<p align="center">
  API mocking platform powered by OpenAPI specs.<br />
  Upload a spec. Get a live mock server. Share the URL.
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@trillionclues/contour">Built on Contour</a> ·
  <a href="#quick-start">Quick Start</a> ·
  <a href="#architecture">Architecture</a> ·
  <a href="doc/PROJECT.md">Full Project Doc</a>
</p>

---

## What is Mockline?

Mockline is an automated PaaS for engineering teams to deploy and manage isolated, Docker-powered mock API servers from OpenAPI specs.

```
Upload spec.yaml  →  Validate + parse  →  Build Docker image  →  Start container  →  mock-abc123.mockline.dev
```

Each mock server runs [`@trillionclues/contour`](https://www.npmjs.com/package/@trillionclues/contour) inside an isolated Docker container with resource limits, automatic health checks, and auto-stop after idle timeout.

### How it relates to Contour CLI

| | Contour | Mockline |
|---|---------|----------|
| What | CLI tool — `contour start spec.yaml` | Web platform + API |
| Published | `npm i @trillionclues/contour` | Self-hosted web app |
| Role | Mock engine (generates responses from specs) | Orchestration layer (Docker, auth, dashboards) |
| Usage | Developers run locally | Contour runs *inside* each Docker container |

Mockline does not fork or modify Contour. It installs Contour as a dependency inside Docker images and starts it with the user's spec.

---

## Features

- **Spec management** — Upload OpenAPI 3.x YAML/JSON specs, version history, validation
- **Mock servers** — One-click provisioning, live status, shareable URLs
- **Contract testing** — Test real APIs against their OpenAPI contracts, pass/fail per endpoint
- **Schema diffing** — Compare spec versions, detect breaking changes
- **API Explorer** — Send requests to mock servers, inspect responses *(coming soon)*
- **Stateful mode** — Persist POST/PUT/DELETE data across container restarts via Docker volumes *(coming soon)*
- **Auto-stop** — Idle containers stopped automatically to save resources

---

## Quick Start

### Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (or Docker Engine on Linux)
- [Node.js 22+](https://nodejs.org/) (use `nvm use` if `.nvmrc` exists)
- [pnpm 9+](https://pnpm.io/) (`npm i -g pnpm`)

### Setup

```bash
# Clone
git clone https://github.com/trillionclues/mockline
cd mockline

# Install dependencies
pnpm install

# Set up environment
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local
```

Edit the `.env` files:

**`apps/api/.env`** — minimum required:

```env
DATABASE_URL="postgresql://mockline:mockline@localhost:5432/mockline_dev"
REDIS_URL="redis://localhost:6379"
BETTER_AUTH_SECRET="<run: openssl rand -hex 32>"
BETTER_AUTH_URL="http://localhost:4000"
GITHUB_CLIENT_ID="<from GitHub OAuth app>"
GITHUB_CLIENT_SECRET="<from GitHub OAuth app>"
CORS_ORIGIN="http://localhost:3000"
```

**`apps/web/.env.local`** — minimum required:

```env
NEXT_PUBLIC_API_URL="http://localhost:4000"
NEXT_PUBLIC_AUTH_URL="http://localhost:4000"
```

### Start infrastructure + dev servers

```bash
# Start Postgres + Redis
docker compose up -d db cache

# Run database migrations
pnpm db:migrate

# Start both web (3000) and api (4000)
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

### GitHub OAuth Setup

1. Go to **GitHub → Settings → Developer settings → OAuth Apps → New**
2. Set **Homepage URL** to `http://localhost:3000`
3. Set **Authorization callback URL** to `http://localhost:4000/api/auth/callback/github`
4. Copy the Client ID and Client Secret into `apps/api/.env`

---

## Architecture

```
┌───────────────────────────────────────────────┐
│                 Mockline Platform              │
│                                               │
│  Next.js ──► Hono API ──► Docker Engine       │
│  (port 3000)  (port 4000)   (containers)      │
│                   │                           │
│              PostgreSQL    Redis               │
│              (Prisma ORM)  (sessions, cache)   │
│                                               │
│  Each mock container:                         │
│  ┌──────────────────────────┐                 │
│  │ Node + Contour CLI       │                 │
│  │ contour start spec.yaml  │                 │
│  │ Port 3001 (internal)     │                 │
│  └──────────────────────────┘                 │
└───────────────────────────────────────────────┘
```

### Monorepo Structure

```
mockline/
├── apps/
│   ├── web/                    # Next.js 15 — dashboard UI
│   └── api/                    # Hono — REST API + Docker orchestration
├── packages/
│   ├── db/                     # Prisma schema + generated client
│   ├── docker-manager/         # buildMockImage, startMockContainer, stopContainer
│   ├── spec-parser/            # OpenAPI validation + endpoint extraction
│   ├── types/                  # Shared TypeScript types
│   └── contract-runner/        # Contract test execution engine
├── docker-compose.yml          # Local dev: Postgres + Redis
├── turbo.json                  # Turborepo task config
├── pnpm-workspace.yaml
└── doc/
    ├── PROJECT.md              # Full architecture doc (agent context)
    └── mockline-frontend/
        └── SKILL.md            # UI design system spec
```

### Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15, React Query, Tailwind CSS v4 |
| API | Hono, Zod validation |
| Database | PostgreSQL via Prisma |
| Cache | Redis (Upstash in prod) |
| Auth | BetterAuth (GitHub OAuth) |
| Docker | Dockerode SDK |
| Mock Engine | @trillionclues/contour |
| Monorepo | pnpm workspaces + Turborepo |

---

## Commands

```bash
# Development
pnpm dev                        # Start web + api
pnpm dev --filter=web           # Next.js only
pnpm dev --filter=api           # Hono API only

# Database
pnpm db:migrate                 # Run Prisma migrations
pnpm db:studio                  # Open Prisma Studio GUI

# Build
pnpm build                      # Build all apps + packages
pnpm typecheck                  # tsc --noEmit across all packages

# Test
pnpm test                       # Run Vitest
pnpm lint                       # ESLint

# Docker
docker compose up -d db cache   # Start Postgres + Redis
docker compose down             # Stop all
docker compose logs -f api      # Tail API logs
```

---

## API Reference

All endpoints require authentication (BetterAuth session) except `GET /health`.

Responses follow the envelope format: `{ data, error }`.

### Specs

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/specs` | List user's specs |
| `POST` | `/specs` | Upload new spec (name + content) |
| `GET` | `/specs/:id` | Spec detail + versions |
| `DELETE` | `/specs/:id` | Soft delete |
| `GET` | `/specs/:id/versions` | Version history |
| `POST` | `/specs/:id/versions` | Upload new version |
| `GET` | `/specs/:id/versions/:v1/diff/:v2` | Diff two versions |

### Mock Servers

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/mocks` | List user's mock servers |
| `POST` | `/mocks` | Provision new mock server |
| `GET` | `/mocks/:id` | Mock server details + status |
| `POST` | `/mocks/:id/start` | Start stopped server |
| `POST` | `/mocks/:id/stop` | Stop running server |
| `DELETE` | `/mocks/:id` | Stop + remove |

### Contract Testing

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/contracts` | Run contract test (specId + baseUrl) |
| `GET` | `/contracts/:id` | Test run results |
| `GET` | `/contracts?specId=...` | List runs for a spec |

---

## Database Schema (Key Models)

```
User  →  Spec  →  SpecVersion
  │         │
  │         └── MockServer (status, publicUrl, port, config)
  │
  └── ContractTestRun (baseUrl, summary, results)
```

8 tables total. See `packages/db/prisma/schema.prisma` for the full schema.

---

## Docker Container Lifecycle

```
Spec uploaded
  → Image built (Node + Contour + baked-in spec)
  → Container created with resource limits (128MB RAM, 10% CPU)
  → Contour starts: contour start spec.yaml --port 3001
  → Status: RUNNING, publicUrl assigned
  → Auto-stop after 1hr idle (cron checks every 15min)
  → User can restart → new container, same image
  → User deletes → container + image cleaned up
```

### Resource Limits (enforced on every container)

| Resource | Limit |
|----------|-------|
| Memory | 128MB |
| Memory + swap | 256MB |
| CPU | 10% of one core |
| Processes | 50 max |
| Capabilities | ALL dropped |
| Privileges | `no-new-privileges` |

---

#### multiple specs per user?
NB: To allow multiple specs per user, we'll need to update the Traefik labels to route based on the spec ID, not just the user ID.

#### add new dependency to the web app
NB: To add a new dependency to the web app, run `pnpm add --filter @mockline/web <dependency-name>`.

## Contour CLI Options *(Upcoming: Phase 4)*

When provisioning a mock server, users will be able to configure Contour's runtime options:

| Option | Description | Example |
|--------|-------------|---------|
| `--stateful` | Persist POST/PUT/DELETE data in memory | Survives container restart via Docker volume |
| `--delay <min-max>` | Simulate network latency | `--delay 200-500` (200-500ms) |
| `--error-rate <pct>` | Simulate random failures | `--error-rate 10` (10% of requests fail) |
| `--require-auth` | Require Bearer token | Rejects requests without `Authorization` header |
| `--deterministic` | Reproducible fake data | Same request → same response (for E2E tests) |

These options are stored as JSON in the `MockServer.config` field and passed to the container as environment variables.

---

## Project Documentation

| Document | Path | Purpose |
|----------|------|---------|
| Full architecture doc | `doc/PROJECT.md` | Comprehensive agent context: coding standards, API design, Docker patterns, security, feature phases |
| UI design system | `doc/mockline-frontend/SKILL.md` | Dashboard design rules, color palette, typography, component patterns |

---

## License

MIT

---

<p align="center">
  Built on <a href="https://www.npmjs.com/package/@trillionclues/contour">@trillionclues/contour</a>
</p>