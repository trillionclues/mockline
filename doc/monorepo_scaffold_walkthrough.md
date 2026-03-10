# Mockline — Scaffolding Walkthrough

## What Was Built

A complete pnpm + Turborepo monorepo scaffolded and verified with `pnpm install`.

### Project Tree

```
mockline/
├── apps/
│   ├── web/                         # Next.js 15 (React 19) frontend
│   │   ├── src/app/
│   │   │   ├── layout.tsx           # Root layout with metadata template
│   │   │   ├── page.tsx             # Placeholder home page
│   │   │   └── globals.css          # TailwindCSS v4 entry
│   │   ├── next.config.ts           # Monorepo transpilation config
│   │   ├── postcss.config.mjs       # TailwindCSS v4 PostCSS plugin
│   │   ├── tsconfig.json            # Extends root, adds JSX + path aliases
│   │   └── .env.example
│   │
│   └── api/                         # Hono API server
│       ├── src/
│       │   ├── index.ts             # Entry: Hono app + CORS + logger + routes
│       │   ├── routes/
│       │   │   ├── specs.ts         # 7 endpoints (CRUD + versions + diff)
│       │   │   ├── mocks.ts         # 6 endpoints (provision, start, stop, delete)
│       │   │   └── contracts.ts     # 3 endpoints (run, get results, list)
│       │   └── lib/
│       │       └── redis.ts         # ioredis singleton
│       ├── tsconfig.json
│       └── .env.example
│
├── packages/
│   ├── types/                       # @mockline/types
│   │   └── src/index.ts             # Enums, API envelope, error class, constants
│   │
│   ├── db/                          # @mockline/db
│   │   ├── prisma/schema.prisma     # 8 models (User, Spec, SpecVersion, MockServer,
│   │   │                            #   ContractTestRun, Session, Account, Verification)
│   │   └── src/index.ts             # Prisma singleton client
│   │
│   ├── spec-parser/                 # @mockline/spec-parser
│   │   └── src/
│   │       ├── validate-spec.ts     # OpenAPI validation (stub)
│   │       ├── parse-endpoints.ts   # Endpoint extraction (stub)
│   │       └── detect-format.ts     # YAML/JSON detection (implemented)
│   │
│   └── docker-manager/              # @mockline/docker-manager
│       └── src/
│           ├── client.ts            # Dockerode singleton
│           ├── build-image.ts       # Image build (stub)
│           ├── start-container.ts   # Container start (stub)
│           ├── lifecycle.ts         # Stop + remove (implemented)
│           └── status.ts            # Container inspection (implemented)
│
├── docker/
│   ├── mock-server/Dockerfile       # Contour container template
│   └── traefik/traefik.yml          # Reverse proxy config
│
├── docker-compose.yml               # Local dev: Postgres + Redis + Traefik
├── pnpm-workspace.yaml              # Workspace definition
├── turbo.json                       # Build pipeline
├── tsconfig.json                    # Strict root config
├── package.json                     # Root scripts
├── .nvmrc                           # Node 22
├── .gitignore
└── .prettierrc
```

---

## Architecture — How It Fits Together

```
User's Browser → apps/web (Next.js :3000)
     ↓ TanStack Query / server fetch
apps/api (Hono :4000)
     ↓ Prisma
PostgreSQL (:5432) + Redis (:6379)
     ↓ dockerode
Docker Engine → mock containers (Contour :3001)
     ↓ Traefik
mock-{id}.mockline.dev → Container
```

**Key architecture decisions:**
1. **Hono over Next.js API routes** — Docker orchestration is long-running. Serverless functions have execution limits. Hono runs on a persistent Node.js server alongside the Docker socket.
2. **Specs baked into images** — No volume mounts. Same spec version = same image hash = reproducible behavior.
3. **Contour installed inside containers** — `apps/api` orchestrates; the container runs the mock. No port conflicts.

---

## Manual Setup Guide (If You Were Doing This By Hand)

### Step 1: Monorepo Foundation

```bash
mkdir mockline && cd mockline
git init
echo "22" > .nvmrc
nvm use

# pnpm workspace
pnpm init
# Edit package.json: add "private": true, scripts
# Create pnpm-workspace.yaml pointing to apps/* and packages/*
pnpm add -D turbo typescript prettier
```

### Step 2: Shared Packages (Build Dependency Tree)

```bash
mkdir -p packages/{types,db,spec-parser,docker-manager}/src

# Each package gets: package.json (name: @mockline/xxx), tsconfig.json
# Types package: define enums, API response envelope, error classes
# DB package: pnpm add @prisma/client && pnpm add -D prisma
#   → npx prisma init → write schema.prisma → prisma generate
# Spec-parser: pnpm add @readme/openapi-parser yaml
# Docker-manager: pnpm add dockerode && pnpm add -D @types/dockerode
```

### Step 3: Apps

```bash
# Web: Could use create-next-app, but in a monorepo it's easier to scaffold manually
mkdir -p apps/web/src/app
# Add package.json with next, react, react-dom, tailwindcss, etc.
# Write layout.tsx, page.tsx, globals.css, postcss.config.mjs, next.config.ts

# API: Pure TypeScript Hono server
mkdir -p apps/api/src/{routes,services,middleware,lib}
# Add package.json with hono, @hono/node-server, zod, ioredis, better-auth
# Wire up workspace deps: "@mockline/db": "workspace:*"
```

### Step 4: Docker Infrastructure

```bash
mkdir -p docker/{mock-server,traefik}

# mock-server/Dockerfile: FROM node:22-alpine, install contour, COPY spec, HEALTHCHECK
# traefik/traefik.yml: Docker provider, :80/:443 entrypoints
# docker-compose.yml: postgres:15 + redis:7-alpine + traefik:v3
```

### Step 5: Install & Verify

```bash
pnpm install          # Resolves all workspace deps
pnpm typecheck        # Would check once stubs are filled
docker compose up -d  # Start postgres, redis, traefik
pnpm db:migrate       # Run Prisma migrations
pnpm dev              # Start web + api concurrently via turbo
```

---

## Verification Results

| Check | Status |
|-------|--------|
| `pnpm install` | ✅ All 7 workspace projects resolved |
| Prisma client generated | ✅ Generated to node_modules |
| Workspace symlinks | ✅ `@mockline/*` packages linked correctly |
| All source files created | ✅ 28 project files across 4 packages + 2 apps |
| Docker configs | ✅ mock-server Dockerfile + Traefik + docker-compose ready |

> [!NOTE]
> Minor peer dependency warning: `better-call@1.1.8` wants `zod@^4.0.0` but we have `3.25.x`. This is a transitive dep from `better-auth` and doesn't affect functionality.

[!TIP]
Run these anytime you update the schema.prisma file:
# Update your database schema
pnpm --filter @mockline/db exec prisma db push

# Regenerate the Prisma Client types
pnpm --filter @mockline/db exec prisma generate

OR
pnpm --filter @mockline/db db:sync

## What's Next

1. **Copy env files** — `cp apps/api/.env.example apps/api/.env` (and web)
2. **Start Docker infra** — `docker compose up -d` (for Postgres + Redis)
3. **Run migrations** — `pnpm db:migrate`
4. **Start dev servers** — `pnpm dev`
5. **Implement stubs** — Start with spec-parser, then docker-manager, then API routes
