# Mockline — Deployment Readiness Audit

Full review against [DEPLOYMENT-FLOW.md](file:///Users/user/dev-projects/mockline/doc/DEPLOYMENT-FLOW.md) for AWS EC2 t2.micro deployment.

---

## 🟢 What's Good (Already Aligned with DEPLOYMENT-FLOW.md)

| Area | Status |
|------|--------|
| **API Dockerfile** — multi-stage with turbo prune (4 stages: base→pruner→deps→builder→runner) | ✅ Better than the doc's 3-stage recommendation |
| **Mock-server Dockerfile** — multi-stage (installer→runner) | ✅ Matches doc |
| **docker-compose.yml** — DB, Redis, Traefik, API with healthchecks, named network | ✅ Matches doc exactly |
| **docker-compose.dev.yml** — port overrides, dev Traefik config swap | ✅ Matches doc |
| **Traefik prod config** — HTTP→HTTPS redirect, dual cert resolvers (HTTP + DNS challenge) | ✅ Matches doc |
| **Traefik dev config** — dashboard on :8080, insecure mode | ✅ Correct separation |
| **GitHub Actions [deploy-api.yml](file:///Users/user/dev-projects/mockline/.github/workflows/deploy-api.yml)** — quality gate → SSH deploy → health check | ✅ Matches doc |
| **GitHub Actions [deploy-api-prod.yml](file:///Users/user/dev-projects/mockline/.github/workflows/deploy-api-prod.yml)** — tag-triggered, production environment gate | ✅ Matches doc |
| **GitHub Actions [deploy-web.yml](file:///Users/user/dev-projects/mockline/.github/workflows/deploy-web.yml)** — path-filtered Vercel deploy | ✅ Matches doc |
| **Prisma schema** — `binaryTargets` includes `linux-musl-openssl-3.0.x` for Alpine | ✅ Critical for Docker |
| **Initial migration committed** (`20260308013926_init`) | ✅ Required for `prisma migrate deploy` |
| **Health endpoint** at `/health` in [apps/api/src/index.ts](file:///Users/user/dev-projects/mockline/apps/api/src/index.ts) | ✅ Matches doc |
| **Docker socket** mounted read-write for API (needed for mock provisioning) | ✅ Correct |
| **No DB/Redis ports exposed in production compose** | ✅ Secure |
| **Non-root user** in API Dockerfile (`honojs:nodejs`) | ✅ Good security practice |
| **Resource limits** on mock containers (memory, CPU, PID limit, no-new-privileges) | ✅ Important for t2.micro |
| **Root [.env](file:///Users/user/dev-projects/mockline/.env) is gitignored** — not tracked by git | ✅ Verified |

---

## 🔴 Critical Issues

### 1. Mock container Traefik labels are missing TLS/entrypoint config

> [!CAUTION]
> Mock containers will NOT get HTTPS in production. They'll be unreachable via `*.mockline.xyz` because Traefik won't route them through the `websecure` entrypoint.

**Current** in [start-container.ts](file:///Users/user/dev-projects/mockline/packages/docker-manager/src/start-container.ts#L35-L42):
```typescript
Labels: {
    'traefik.enable': 'true',
    [`traefik.http.routers.${containerId}.rule`]: `Host(...)`,
    [`traefik.http.services.${containerId}.loadbalancer.server.port`]: '3001',
}
```

**Missing** (from DEPLOYMENT-FLOW.md Section 10):
```typescript
[`traefik.http.routers.${containerId}.entrypoints`]: 'websecure',
[`traefik.http.routers.${containerId}.tls.certresolver`]: 'letsencrypt-wildcard',
[`traefik.http.routers.${containerId}.tls.domains[0].main`]: 'mockline.xyz',
[`traefik.http.routers.${containerId}.tls.domains[0].sans`]: '*.mockline.xyz',
```

**Fix:** Add these 4 labels in **both** [startMockContainer()](file:///Users/user/dev-projects/mockline/packages/docker-manager/src/start-container.ts#7-57) and [startMockContainerWithOptions()](file:///Users/user/dev-projects/mockline/packages/docker-manager/src/start-container.ts#58-127).

---

### 2. [build-image.ts](file:///Users/user/dev-projects/mockline/packages/docker-manager/src/build-image.ts) generates single-stage Dockerfiles (no multi-stage)

> [!WARNING]
> Dynamically built mock images will be ~300-400MB instead of ~100MB. On a t2.micro with 30GB EBS, this matters significantly when users provision multiple mocks.

**Current** in [build-image.ts](file:///Users/user/dev-projects/mockline/packages/docker-manager/src/build-image.ts#L21-L33): generates a single-stage `FROM node:22-alpine` Dockerfile inline.

**Should match** [docker/mock-server/Dockerfile](file:///Users/user/dev-projects/mockline/docker/mock-server/Dockerfile) which uses a 2-stage build (installer → runner). The inline Dockerfile should use the same pattern:

```typescript
const dockerfile = [
    'FROM node:22-alpine AS installer',
    'WORKDIR /app',
    `ARG CONTOUR_VERSION=${contourVersion}`,
    'RUN corepack enable && corepack prepare pnpm@latest --activate',
    `RUN pnpm add -g @trillionclues/contour@${contourVersion}`,
    '# ── runner ────────────',
    'FROM node:22-alpine AS runner',
    'WORKDIR /app',
    'COPY --from=installer /usr/local/bin/contour /usr/local/bin/contour',
    'COPY --from=installer /usr/local/lib/node_modules /usr/local/lib/node_modules',
    'USER node',
    `COPY --chown=node:node ${specFilename} ./${specFilename}`,
    'EXPOSE 3001',
    'HEALTHCHECK --interval=5s --timeout=3s --retries=5 \\',
    '  CMD wget -qO- http://localhost:3001/health || exit 1',
    `CMD ["contour", "start", "${specFilename}", "--port", "3001"]`,
].join('\n')
```

---

### 3. [.gitignore](file:///Users/user/dev-projects/mockline/.gitignore) missing `letsencrypt/` directory

> [!WARNING]
> If acme certificate files are ever created locally, they could get committed — exposing private keys.

**Add to [.gitignore](file:///Users/user/dev-projects/mockline/.gitignore):**
```
letsencrypt/
```

---

## 🟡 Important Improvements

### 4. [.dockerignore](file:///Users/user/dev-projects/mockline/.dockerignore) is too minimal — slow builds on t2.micro

The current [.dockerignore](file:///Users/user/dev-projects/mockline/.dockerignore) only ignores `node_modules` and env files. With `COPY . .` in the pruner stage, Docker sends the entire monorepo (including `.git`, `apps/web`, `out/`, `docker/`, `dist/`, `.turbo/`, docs) as build context.

**Recommended `.dockerignore`:**
```
node_modules
.git
.github
.turbo
.next
out
dist
coverage
playwright-report
test-results
doc
docker
letsencrypt
apps/web
*.md
!README.md
.DS_Store
.env
.env.*
!.env.example
```

This should cut Docker build context from ~200MB+ to under 5MB, **massively speeding up builds on t2.micro**.

---

### 5. API Dockerfile copies entire `/packages` into runner stage

In [apps/api/Dockerfile:45](file:///Users/user/dev-projects/mockline/apps/api/Dockerfile#L45):
```dockerfile
COPY --chown=honojs:nodejs --from=builder /app/packages ./packages
```

This copies **all packages** into the final image (including `spec-parser` source, `docker-manager` source, etc.). Only the Prisma client and schema are needed at runtime.

**Recommended change:**
```dockerfile
COPY --chown=honojs:nodejs --from=builder /app/packages/db ./packages/db
```

Or more precisely — copy only `packages/db/prisma/` and the generated Prisma client from `node_modules/.prisma/`.

---

### 6. `corepack prepare pnpm@latest` is non-deterministic

In both Dockerfiles and build-image.ts, `pnpm@latest` means every build could get a different pnpm version. The root `package.json` specifies `"packageManager": "pnpm@9.15.0"`.

**Pin it:**
```dockerfile
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
```

---

### 7. API Dockerfile runner stage installs pnpm but doesn't need it

In [apps/api/Dockerfile:1-3](file:///Users/user/dev-projects/mockline/apps/api/Dockerfile#L1-L3), the `base` stage enables corepack + pnpm. The `runner` stage inherits from `base`, but the CMD only needs `node` and `prisma`.

**Consider:** Runner stage should extend `node:22-alpine` directly (not `base`), since it doesn't need pnpm. This saves ~20MB in the final image.

---

### 8. Production health check URL in `deploy-api-prod.yml` is wrong

[deploy-api-prod.yml:59](file:///Users/user/dev-projects/mockline/.github/workflows/deploy-api-prod.yml#L59) checks `https://api.mockline.xyz/health` — but if you're running staging and production on different servers, the production health check should hit the **production** URL (which may differ from staging).

If staging and production share the same domain, this is fine for now. But if you add a separate production domain later, parametrize this with a secret like `${{ secrets.PROD_API_URL }}`.

---

### 9. No rollback mechanism in deploy scripts

The SSH deploy scripts do `git pull` + `docker compose up -d --build`, but if the health check fails, the bad container keeps running. 

**Suggested improvement** for the SSH deploy script:
```bash
set -e
cd /opt/mockline
git pull origin main

# Save current image for rollback
PREV_IMAGE=$(docker inspect --format='{{.Image}}' mockline-api 2>/dev/null || echo "none")

docker compose up -d --build api
docker image prune -f

# If health check fails inside the script, roll back
sleep 15
if ! curl --fail --silent http://localhost:4000/health | grep -q '"status":"ok"'; then
    echo "Health check failed — rolling back"
    docker compose down api
    if [ "$PREV_IMAGE" != "none" ]; then
        docker tag "$PREV_IMAGE" mockline-api:rollback
    fi
    exit 1
fi

echo "✓ API deploy complete — $(git rev-parse --short HEAD)"
```

---

### 10. Docker Compose `api` service has potentially conflicting `DATABASE_URL`

In [docker-compose.yml:59-61](file:///Users/user/dev-projects/mockline/docker-compose.yml#L59-L61), the API service uses both:
- `env_file: .env` (which may define `DATABASE_URL`)
- `environment: - DATABASE_URL=postgresql://...@db:5432/...` (explicit override)

The explicit `environment` takes precedence, which is correct for Docker networking. But if the `.env` also defines `DATABASE_URL` with `localhost`, it could cause confusion. **Document this clearly** — or remove `DATABASE_URL` from the `.env` template since docker-compose handles it.

---

## 📋 Pre-Deploy Checklist (Things to Do Before EC2)

| # | Item | Status |
|---|------|--------|
| 1 | Fix mock container Traefik TLS labels in `start-container.ts` | 🔴 Required |
| 2 | Update `build-image.ts` to use multi-stage Dockerfile | 🟡 Recommended |
| 3 | Add `letsencrypt/` to `.gitignore` | 🔴 Required |
| 4 | Expand `.dockerignore` | 🟡 Strongly recommended for t2.micro |
| 5 | Pin pnpm version in Dockerfiles | 🟡 Recommended |
| 6 | Slim runner stage in API Dockerfile (remove pnpm, narrow `/packages` copy) | 🟡 Recommended |
| 7 | Verify all GitHub secrets are set: `API_HOST`, `API_USER`, `API_SSH_KEY` | 🔴 Required |
| 8 | Create GitHub `staging` environment (Settings → Environments) | 🔴 Required |
| 9 | Create Cloudflare API token + add `api` and `*` DNS A records | 🔴 Required |
| 10 | Prepare `/opt/mockline/.env` on EC2 with production values | 🔴 Required |
| 11 | Generate production secrets: `BETTER_AUTH_SECRET`, `INTERNAL_API_SECRET` with `openssl rand -hex 32` | 🔴 Required |
| 12 | Create new GitHub OAuth app with production callback URL | 🔴 Required |
| 13 | Run BetterAuth migration once after first deploy | 🔴 Required |

---

## Summary Verdict

The project structure is **well-organized** and closely follows the DEPLOYMENT-FLOW.md guide. The main gap is the **mock container Traefik labels** — without the TLS labels, dynamically provisioned mock servers won't be reachable over HTTPS in production. The `build-image.ts` single-stage Dockerfile and the slim `.dockerignore` are the next priorities since they directly impact the constrained resources on a t2.micro instance.

Everything else (GitHub Actions, docker-compose, Prisma, health endpoints, security) is solid and ready to go.



<!-- ENVIRONMENTS AND SECRETS -->
Yes — you need to set up GitHub secrets, GitHub environments, and Vercel environment variables before your workflows will function. Here's the exact checklist:

1. GitHub Environments
Go to Repo → Settings → Environments and create two:

Environment	Protection Rules
staging	None (auto-deploys on push to main)
production	Required reviewers → add yourself (manual approval gate for tag deploys)

2. GitHub Secrets
Go to Repo → Settings → Secrets and variables → Actions → New repository secret:

API / EC2 (needed after you provision)
Secret	Value	Used by
API_HOST	Your Elastic IP (e.g. 54.x.x.x)	

deploy-api.yml
API_USER	deploy	

deploy-api.yml
API_SSH_KEY	Full contents of your .pem private key	

deploy-api.yml

<!-- Production (separate server, when ready) -->
Secret	Value	Used by
PROD_HOST	Production server IP	

deploy-api-prod.yml
PROD_USER	deploy	

deploy-api-prod.yml
PROD_SSH_KEY	Production SSH private key	

deploy-api-prod.yml
PROD_SSH_PORT	SSH port (e.g. 22 or 2222)	

deploy-api-prod.yml
PROD_API_URL	(optional) Falls back to https://api.mockline.xyz	

deploy-api-prod.yml


<!-- Vercel / Web -->
Secret	Value	Used by
VERCEL_TOKEN	From vercel.com → Account Settings → Tokens	

deploy-web.yml
VERCEL_ORG_ID	From .vercel/project.json after first Vercel deploy	

deploy-web.yml
VERCEL_PROJECT_ID	From .vercel/project.json after first Vercel deploy	

deploy-web.yml








## NOTES ON LOCAL EC2 DEPLOYMENT AND SIMULATION
On simulating EC2 locally — yes, use Multipass.Vagrant needs VirtualBox or VMware as a backend and is heavy. Multipass is the lightweight answer — it spins up real Ubuntu VMs on your Mac in seconds using the same Ubuntu images EC2 uses.

# Install
brew install multipass

# Launch an Ubuntu 24.04 VM — same as your EC2 AMI
multipass launch 24.04 --name mockline-staging --cpus 1 --memory 1G --disk 10G

# Shell into it
multipass shell mockline-staging

# It's a real Ubuntu VM — run your exact hardening scripts from the deployment doc
# SSH config, UFW, Fail2ban, Docker install — all work identically to EC2

When you're done:
multipass stop mockline-staging
multipass delete mockline-staging
multipass purge

It's free, uses Apple Hypervisor on Mac so it's fast, and the environment is byte-for-byte the same Ubuntu 24.04 you'll deploy to. The only difference from real EC2 is no Elastic IP and no security groups — you use UFW directly instead.