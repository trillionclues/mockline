# Mockline — Full Deployment Flow

> Provider-agnostic. Works on AWS, Hetzner, DigitalOcean, or any VPS with Docker.
> Start on AWS free tier. Move to Hetzner later. The CI/CD pipeline doesn't care.

---

## Table of Contents

1. [Architecture Decision](#1-architecture-decision)
2. [Cost Summary](#2-cost-summary)
3. [Provider Strategy — AWS Now, Hetzner Later](#3-provider-strategy--aws-now-hetzner-later)
4. [Multi-Stage Docker Builds](#4-multi-stage-docker-builds)
5. [File Structure — What Lives Where](#5-file-structure--what-lives-where)
6. [Domain — Namecheap + Cloudflare](#6-domain--namecheap--cloudflare)
7. [Server Provisioning — AWS EC2](#7-server-provisioning--aws-ec2)
8. [Server Hardening](#8-server-hardening)
9. [Docker + Docker Compose on Server](#9-docker--docker-compose-on-server)
10. [SSL — Traefik + Let's Encrypt](#10-ssl--traefik--lets-encrypt)
11. [Environment Variables](#11-environment-variables)
12. [Database + Redis — Self-Hosted in Docker](#12-database--redis--self-hosted-in-docker)
13. [Prisma Migrations + BetterAuth Tables](#13-prisma-migrations--betterauth-tables)
14. [Application Deployment](#14-application-deployment)
15. [DNS Records](#15-dns-records)
16. [GitHub Actions CI/CD — Provider Agnostic](#16-github-actions-cicd--provider-agnostic)
17. [Database Backups](#17-database-backups)
18. [Monitoring + Uptime](#18-monitoring--uptime)
19. [Network Cleanup](#19-network-cleanup)
20. [Staging vs Production Checklist](#20-staging-vs-production-checklist)
21. [Runbook — Common Operations](#21-runbook--common-operations)
22. [Migrating Providers Later](#22-migrating-providers-later)

---

## 1. Architecture Decision

### Everything on one VPS. Self-hosted DB and Redis. No managed services.

The core reason: `apps/api` must spawn Docker containers to provision mock servers.
This requires direct access to the Docker socket. Vercel, Railway, and Render are
serverless or container platforms — they do not expose the Docker socket.
A VPS is the only option where this works cleanly.

```
┌─────────────────────────────────────────────────────────────┐
│              VPS (AWS EC2 t2.micro → Hetzner CX23)          │
│                                                             │
│  ┌──────────┐  ┌──────────┐  ┌────────┐  ┌─────────────┐    │
│  │ apps/web │  │ apps/api │  │   db   │  │    cache    │    │
│  │ Next.js  │  │  Hono    │  │Postgres│  │    Redis    │    │
│  │ :3000    │  │  :4000   │  │ :5432  │  │   :6379     │    │
│  └──────────┘  └──────────┘  └────────┘  └─────────────┘    │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Traefik — reverse proxy + SSL + routing             │   │
│  │  :80 → redirect to :443                              │   │
│  │  :443 → routes by hostname to correct service        │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Mock containers (dynamically provisioned by API)    │   │
│  │  mock-abc123 :3001 → mock-abc123.mockline.xyz        │   │
│  │  mock-def456 :3001 → mock-def456.mockline.xyz        │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

**Traffic flow:**
```
User → Cloudflare DNS → VPS IP → Traefik → correct container
```

**Why self-hosted DB and Redis instead of Neon/Upstash:**
- Zero additional cost — Postgres and Redis run in Docker alongside the app
- No cold starts, no connection limits on free tiers
- One `.env` file, one server, one bill
- When you need managed DB later — swap `DATABASE_URL` in CI secrets and nothing else changes

**Why this architecture works across providers:**
The CI/CD pipeline only needs an IP, an SSH key, and a username.
Switching from AWS to Hetzner means changing three GitHub secrets.
The Docker Compose file, Traefik config, and application code are identical.

**Why Cloudflare as DNS even with Namecheap as registrar:**
Traefik's wildcard SSL certificate requires a DNS challenge.
The DNS challenge requires an API token from your DNS provider.
Cloudflare has a clean API that Traefik supports natively.
You keep Namecheap as the registrar — you just point Namecheap's
nameservers at Cloudflare.

---

## 2. Cost Summary

### AWS Free Tier (first 12 months)
| Service | Spec | Cost |
|---------|------|------|
| EC2 t2.micro | 1 vCPU, 1GB RAM | $0 (750 hrs/mo free) |
| EBS Storage | 30GB SSD | $0 (30GB free) |
| Data transfer | 15GB/mo out | $0 (15GB free) |
| Elastic IP | Static IP | $0 while attached to running instance |
| **mockline.xyz domain** | Namecheap 1yr | ~$2–15 |
| **Total** | | **~$2–15 first year** |

### After Free Tier / Move to Hetzner
| Service | Spec | Cost |
|---------|------|------|
| Hetzner CX23 | 2 vCPU, 4GB RAM, 40GB SSD | €3.49/mo |
| mockline.xyz renewal | Namecheap | ~$10–15/yr |
| **Total** | | **~€3.49/mo** |

**Note on t2.micro:**
1GB RAM is tight. Enable swap immediately after provisioning (covered in hardening).
Fine for staging and early dev — not for production with real users.

---

## 3. Provider Strategy — AWS Now, Hetzner Later

### Why AWS now
- 12 months free on t2.micro
- Forces you to learn EC2, Security Groups, Elastic IPs, IAM — all industry standard
- Stop the instance when not developing to preserve free hours
- Spin it back up in 30 seconds when needed

### Why Hetzner later
- CX23 (€3.49) gives 4GB RAM vs t2.micro's 1GB for less money after free tier

### The migration is three steps
1. Provision new Hetzner VPS, run the same setup scripts from this doc
2. Migrate database dump to new server
3. Update three GitHub secrets: `STAGING_HOST`, `STAGING_USER`, `STAGING_SSH_KEY`

### Stopping EC2 between sessions
```bash
# AWS Console → EC2 → Instances → Stop
# Or CLI:
aws ec2 stop-instances --instance-ids i-xxxxxxxxxxxx
aws ec2 start-instances --instance-ids i-xxxxxxxxxxxx
```

Use an **Elastic IP** (free while attached) so your IP doesn't change on restart.

---

## 4. Multi-Stage Docker Builds

Multi-stage builds copy only what's needed to run, leaving build tools behind.
Typical result: images go from 1.2GB → 200MB.

### `apps/web/Dockerfile`

```dockerfile
FROM node:22-alpine AS base
RUN corepack enable && corepack prepare pnpm@latest --activate

# ── deps ────────
FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY apps/web/package.json ./apps/web/
COPY packages/db/package.json ./packages/db/
COPY packages/types/package.json ./packages/types/
RUN pnpm install --frozen-lockfile

# ── builder ──────
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/web/node_modules ./apps/web/node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm --filter=web build

# ── runner — smallest possible ──────
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/apps/web/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
CMD ["node", "apps/web/server.js"]
```

**Required in `apps/web/next.config.ts`:**
```typescript
const nextConfig = {
  output: 'standalone',  // enables the multi-stage runner above
}
```

### `apps/api/Dockerfile`

```dockerfile
FROM node:22-alpine AS base
RUN corepack enable && corepack prepare pnpm@latest --activate

# ── deps ───────────
FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY apps/api/package.json ./apps/api/
COPY packages/db/package.json ./packages/db/
COPY packages/types/package.json ./packages/types/
COPY packages/docker-manager/package.json ./packages/docker-manager/
RUN pnpm install --frozen-lockfile

# ── builder ───────
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm --filter=api build
RUN pnpm --filter=@mockline/db prisma generate

# ── runner ───────────
FROM node:22-alpine AS runner
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app
ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 honojs

COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/db/prisma ./packages/db/prisma
COPY --from=builder /app/package.json ./

USER honojs
EXPOSE 4000
CMD ["sh", "-c", "node_modules/.bin/prisma migrate deploy --schema=packages/db/prisma/schema.prisma && node apps/api/dist/index.js"]
```

### `docker/mock-server/Dockerfile` — updated with multi-stage

```dockerfile
FROM node:22-alpine AS installer
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@latest --activate

ARG CONTOUR_VERSION=1.1.1
RUN pnpm add -g @trillionclues/contour@${CONTOUR_VERSION}

# ── runner ────────────
FROM node:22-alpine AS runner
WORKDIR /app

COPY --from=installer /usr/local/bin/contour /usr/local/bin/contour
COPY --from=installer /usr/local/lib/node_modules /usr/local/lib/node_modules

USER node
COPY --chown=node:node spec.yaml ./spec.yaml

EXPOSE 3001
HEALTHCHECK --interval=5s --timeout=3s --retries=5 \
  CMD wget -qO- http://localhost:3001/health || exit 1

CMD ["contour", "start", "spec.yaml", "--port", "3001"]
```

---

## 5. File Structure — What Lives Where

```
mockline/                           ← monorepo root
  docker-compose.yml                ← root (correct)
  docker-compose.dev.yml            ← dev overrides (ports, dev traefik config)
  .env                              ← local dev only, gitignored
  docker/
    mock-server/
      Dockerfile
    traefik/
      traefik.dev.yml               ← dashboard on, insecure mode
      traefik.prod.yml              ← https, no dashboard, letsencrypt
  apps/
    web/
      Dockerfile                    ← create (multi-stage above)
    api/
      Dockerfile                    ← create (multi-stage above)
  packages/
    db/
      prisma/
        schema.prisma
        migrations/                 ← committed to git
```

### Docker Compose path corrections

Your `docker-compose.yml` Dockerfile references need explicit paths:

```yaml
services:
  web:
    build:
      context: .                        # monorepo root as build context
      dockerfile: apps/web/Dockerfile   # relative to context

  api:
    build:
      context: .
      dockerfile: apps/api/Dockerfile

  proxy:
    volumes:
      - ./docker/traefik/traefik.prod.yml:/etc/traefik/traefik.yml:ro
```

---

## 6. Domain — Namecheap + Cloudflare

You already own `mockline.xyz` on Namecheap. ✓

### Step 1 — Add to Cloudflare

1. cloudflare.com → Create free account → Add a Site → `mockline.xyz`
2. Select Free plan → Continue
3. Copy the two nameservers Cloudflare gives you eg.:
   ```
   aria.ns.cloudflare.com
   bob.ns.cloudflare.com
   ```

### Step 2 — Update Namecheap nameservers

Namecheap → Domain List → Manage → mockline.xyz
→ Nameservers → Custom DNS → enter both Cloudflare nameservers → Save

Propagation: 5–30 minutes. Cloudflare emails you when active.

### Step 3 — Create Cloudflare API Token (for wildcard SSL)

Cloudflare → My Profile → API Tokens → Create Token
→ Template: "Edit zone DNS" → Zone: mockline.xyz
→ Create Token → **copy immediately — shown once** - you'll need it for Traefik

This becomes `CF_DNS_API_TOKEN` in your `.env`.

---

## 7. Server Provisioning — AWS EC2

### Step 1 — Launch EC2 instance

1. AWS Console → EC2 → Launch Instance
2. **Name**: `mockline-staging`
3. **AMI**: Ubuntu Server 24.04 LTS (free tier eligible)
4. **Instance type**: t2.micro
5. **Key pair**: Create new → ED25519 → download `.pem` → save to `~/.ssh/mockline-staging.pem`
6. **Security group** — new group with rules:
   ```
   SSH    TCP  2222   My IP only    ← custom port
   HTTP   TCP  80     Anywhere
   HTTPS  TCP  443    Anywhere
   ```
   Do NOT open port 22, 5432 (Postgres), or 6379 (Redis).
7. **Storage**: 30GB gp3
8. Launch

### Step 2 — Allocate Elastic IP

EC2 → Elastic IPs → Allocate → Associate → select your instance

This IP is permanent. Add it to all DNS records.

### Step 3 — Connect

```bash
chmod 400 ~/.ssh/mockline-staging.pem
ssh -i ~/.ssh/mockline-staging.pem ubuntu@
```

Ubuntu 24.04 on EC2 uses `ubuntu` as the default user.

### Step 4 — Create deploy user

```bash
sudo adduser deploy
sudo usermod -aG sudo deploy
sudo mkdir -p /home/deploy/.ssh
sudo cp ~/.ssh/authorized_keys /home/deploy/.ssh/
sudo chown -R deploy:deploy /home/deploy/.ssh
sudo chmod 700 /home/deploy/.ssh
sudo chmod 600 /home/deploy/.ssh/authorized_keys
```

---

## 8. Server Hardening

Run as `ubuntu`. Do this immediately after provisioning.

```bash
# Update
sudo apt update && sudo apt upgrade -y

# Enable swap — critical on t2.micro (1GB RAM)
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
free -h   # verify

# SSH hardening
# Change SSH port (makes automated scanners skip you)
# Disable root login over SSH
# Disable password auth (key only)
sudo sed -i 's/#Port 22/Port 2222/' /etc/ssh/sshd_config
sudo sed -i 's/Port 22/Port 2222/' /etc/ssh/sshd_config
sudo sed -i 's/#PermitRootLogin prohibit-password/PermitRootLogin no/' /etc/ssh/sshd_config
sudo sed -i 's/#PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config
sudo sed -i 's/PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config
sudo systemctl restart sshd

# Firewall
sudo ufw allow 2222/tcp # SSH (new port)
sudo ufw allow 80/tcp # HTTP (Traefik → Let's Encrypt)
sudo ufw allow 443/tcp # HTTPS
sudo ufw --force enable

# Fail2ban - blocks IPs after repeated failed SSH attempts
sudo apt install fail2ban -y
sudo systemctl enable fail2ban
sudo systemctl start fail2ban

# Auto security updates
sudo apt install unattended-upgrades -y
sudo dpkg-reconfigure --priority=low unattended-upgrades
```

**Update AWS Security Group:** Change the SSH inbound rule from port 22 → 2222.

**From now on, SSH/connect as:**
```bash
ssh -i ~/.ssh/mockline-staging.pem -p 2222 deploy@
```

---

## 9. Docker + Docker Compose on Server

```bash
# Install Docker and add deploy user to docker group
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker deploy

# Log out and back in
exit
ssh -i ~/.ssh/mockline-staging.pem -p 2222 deploy@

# Verify
docker --version
docker compose version

sudo mkdir -p /opt/mockline
sudo chown deploy:deploy /opt/mockline
```

---

## 10. SSL — Traefik + Let's Encrypt

### Create `docker/traefik/traefik.prod.yml`

Your existing `traefik.yml` has `insecure: true` and `dashboard: true` — keep that
as `traefik.dev.yml` for local use. Create a separate production config:

```yaml
global:
  checkNewVersion: false
  sendAnonymousUsage: false

log:
  level: INFO

entryPoints:
  web:
    address: ":80"
    http:
      redirections:
        entryPoint:
          to: websecure
          scheme: https
          permanent: true
  websecure:
    address: ":443"

providers:
  docker:
    endpoint: "unix:///var/run/docker.sock"
    exposedByDefault: false
    network: mockline-network
  file:
    directory: /etc/traefik/dynamic
    watch: true

certificatesResolvers:
  # HTTP challenge — named subdomains
  letsencrypt:
    acme:
      email: [EMAIL_ADDRESS]
      storage: /letsencrypt/acme.json
      httpChallenge:
        entryPoint: web

  # DNS challenge via Cloudflare — required for *.mockline.xyz wildcard
  letsencrypt-wildcard:
    acme:
      email: [EMAIL_ADDRESS]
      storage: /letsencrypt/acme-wildcard.json
      dnsChallenge:
        provider: cloudflare
        resolvers:
          - "1.1.1.1:53"
          - "8.8.8.8:53"

api:
  dashboard: false
```

### Create cert files on VPS

```bash
mkdir -p /opt/mockline/letsencrypt
touch /opt/mockline/letsencrypt/acme.json
touch /opt/mockline/letsencrypt/acme-wildcard.json
chmod 600 /opt/mockline/letsencrypt/acme.json
chmod 600 /opt/mockline/letsencrypt/acme-wildcard.json
```

### Wildcard cert for mock containers

Each dynamically provisioned mock container receives these labels from `docker-manager`:

```typescript
Labels: {
  'traefik.enable': 'true',
  [`traefik.http.routers.${containerId}.rule`]: `Host(\`${containerId}.mockline.xyz\`)`,
  [`traefik.http.routers.${containerId}.entrypoints`]: 'websecure',
  [`traefik.http.routers.${containerId}.tls.certresolver`]: 'letsencrypt-wildcard',
  [`traefik.http.routers.${containerId}.tls.domains[0].main`]: 'mockline.xyz',
  [`traefik.http.routers.${containerId}.tls.domains[0].sans`]: '*.mockline.xyz',
  [`traefik.http.services.${containerId}.loadbalancer.server.port`]: '3001',
}
```

The wildcard cert is issued once and reused for every `mock-*.mockline.xyz` subdomain.

---

## 11. Environment Variables

### Local dev — current setup is correct
- `apps/api/.env` — real values, gitignored ✓
- `apps/web/.env.local` — real values, gitignored ✓
- `packages/.env` — Postgres credentials for local Docker ✓

### On VPS — `/opt/mockline/.env`

Created manually on the server. Never committed to git.

```bash
# ── App ────────────
NODE_ENV=production
PORT=4000
CORS_ORIGIN=https://mockline.xyz

# ── Database ────────────
POSTGRES_USER=mockline
POSTGRES_PASSWORD=
POSTGRES_DB=mockline_prod
# 'db' = Docker service name — correct for container-to-container
DATABASE_URL=postgresql://mockline:@db:5432/mockline_prod

# ── Redis ────────────
# 'cache' = Docker service name
REDIS_URL=redis://cache:6379

# ── BetterAuth ────────────
BETTER_AUTH_SECRET= # openssl rand -hex 32
BETTER_AUTH_URL=https://api.mockline.xyz

# ── GitHub OAuth ────────────
# Create NEW OAuth app: github.com/settings/developers/new
# Homepage URL:  https://mockline.xyz
# Callback URL:  https://api.mockline.xyz/api/auth/callback/github
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=

# ── Internal ────────────
INTERNAL_API_SECRET= # openssl rand -hex 32

# ── Frontend ────────────
NEXT_PUBLIC_API_URL=https://api.mockline.xyz
NEXT_PUBLIC_APP_URL=https://mockline.xyz
NEXT_PUBLIC_MOCK_BASE_URL=https://mock.mockline.xyz
NEXT_PUBLIC_AUTH_URL=https://api.mockline.xyz

# ── Docker ────────────
DOCKER_HOST=unix:///var/run/docker.sock
MOCK_BASE_DOMAIN=mockline.xyz
CONTOUR_VERSION=1.1.1

# ── Traefik ────────────
CF_DNS_API_TOKEN= # from Cloudflare API token step
```

**Note on `DATABASE_URL` hostname:**
In Docker Compose, services talk to each other by service name.
`db` resolves to the Postgres container inside the Docker network.
`localhost:5432` only works outside Docker (local dev).

---

## 12. Database + Redis — Self-Hosted in Docker

Updated `docker-compose.yml` for production:

```yaml
services:
  db:
    image: postgres:15-alpine
    container_name: mockline-db
    restart: unless-stopped
    environment:
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: ${POSTGRES_DB}
    # No ports: — DB not accessible from outside in production
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER}"]
      interval: 5s
      timeout: 3s
      retries: 5
    networks:
      - mockline-network

  cache:
    image: redis:7-alpine
    container_name: mockline-cache
    restart: unless-stopped
    # No ports: — Redis not accessible from outside in production
    volumes:
      - redisdata:/data
    command: redis-server --appendonly yes
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 3s
      retries: 5
    networks:
      - mockline-network

  proxy:
    image: traefik:v3.2
    container_name: mockline-proxy
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
      # No 8080 in production
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
      - ./docker/traefik/traefik.prod.yml:/etc/traefik/traefik.yml:ro
      - ./letsencrypt:/letsencrypt
    environment:
      - CF_DNS_API_TOKEN=${CF_DNS_API_TOKEN}
    networks:
      - mockline-network

  web:
    build:
      context: .
      dockerfile: apps/web/Dockerfile
    container_name: mockline-web
    restart: unless-stopped
    env_file: .env
    depends_on:
      db:
        condition: service_healthy
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.web.rule=Host(`mockline.xyz`) || Host(`www.mockline.xyz`)"
      - "traefik.http.routers.web.entrypoints=websecure"
      - "traefik.http.routers.web.tls.certresolver=letsencrypt"
      - "traefik.http.services.web.loadbalancer.server.port=3000"
    networks:
      - mockline-network

  api:
    build:
      context: .
      dockerfile: apps/api/Dockerfile
    container_name: mockline-api
    restart: unless-stopped
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
    env_file: .env
    depends_on:
      db:
        condition: service_healthy
      cache:
        condition: service_healthy
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.api.rule=Host(`api.mockline.xyz`)"
      - "traefik.http.routers.api.entrypoints=websecure"
      - "traefik.http.routers.api.tls.certresolver=letsencrypt"
      - "traefik.http.services.api.loadbalancer.server.port=4000"
    networks:
      - mockline-network

networks:
  mockline-network:
    name: mockline-network
    driver: bridge

volumes:
  pgdata:
  redisdata:
```

### Local dev override — `docker-compose.dev.yml`

```yaml
# Use with: docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d
services:
  db:
    ports:
      - "5432:5432"

  cache:
    ports:
      - "6379:6379"

  proxy:
    ports:
      - "8080:8080"
    volumes:
      - ./docker/traefik/traefik.dev.yml:/etc/traefik/traefik.yml:ro
```

Add to root `package.json`:
```json
{
  "scripts": {
    "docker:dev": "docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d",
    "docker:down": "docker compose down"
  }
}
```
---

## 13. Prisma Migrations + BetterAuth Tables

### Create your first migration (not done yet)

```bash
cd packages/db
pnpm prisma migrate dev --name init
```

This creates `packages/db/prisma/migrations/TIMESTAMP_init/migration.sql`.
Commit this file — CI uses it to know what to apply on the server.

### Schema change workflow

```
Local:      pnpm prisma migrate dev      ← creates migration file, commit it
Staging:    pnpm prisma migrate deploy   ← runs in CI before deploy
Production: pnpm prisma migrate deploy   ← runs in CI, behind approval gate

Never do this in staging/prod: pnpm prisma db push (no migration history, destructive)
```

### BetterAuth tables — run once per new database
BetterAuth manages its own schema. After the database is reachable:

```bash
# On VPS, after first deploy:
docker compose exec api pnpm dlx @better-auth/cli migrate \
  --config apps/api/src/lib/auth.ts
```
This creates four tables:
- `user` — core user record
- `session` — active sessions
- `account` — OAuth provider links
- `verification` — email verification tokens (unused if Google-only)

These tables are separate from the app schema. Run this once per
new database (staging and production separately).
---

## 14. Application Deployment

### First deploy — manual, run once

```bash
# On VPS as deploy user
cd /opt/mockline
git clone https://github.com/trillionclues/mockline.git .

# Create .env (paste all values from Section 11)
nano .env

# Create cert files
mkdir -p letsencrypt
touch letsencrypt/acme.json letsencrypt/acme-wildcard.json
chmod 600 letsencrypt/acme.json letsencrypt/acme-wildcard.json

# Start everything
docker compose up -d --build

# Check status
docker compose ps
docker compose logs -f
```

### After containers are healthy

```bash
# Run BetterAuth migration (once only)
docker compose exec api pnpm dlx @better-auth/cli migrate \
  --config apps/api/src/lib/auth.ts

# Verify health
curl https://api.mockline.xyz/health
```

---

## 15. DNS Records

Add in Cloudflare. **Proxy OFF (grey cloud / DNS only) for all records.**
Traefik handles SSL — Cloudflare proxying SSL on top creates double-SSL cert errors.

```
Type   Name          Content         TTL    Proxy
──────────────────────────────────────────────────
A      @             <ELASTIC_IP>    Auto   DNS only
A      www           <ELASTIC_IP>    Auto   DNS only
A      api           <ELASTIC_IP>    Auto   DNS only
A      staging       <ELASTIC_IP>    Auto   DNS only
A      api.staging   <ELASTIC_IP>    Auto   DNS only
A      *             <ELASTIC_IP>    Auto   DNS only ← wildcard for mock containers
```

The `*` wildcard catches `mock-abc123.mockline.xyz`. Traefik reads
the Docker container labels and routes to the correct mock container.

---

## 16. GitHub Actions CI/CD — Provider Agnostic

The pipeline only needs: IP, SSH key, username.
Changing providers = changing three secrets. Nothing else.

### Repository secrets

Settings → Secrets and variables → Actions

```
STAGING_HOST          # Elastic IP (or Hetzner IP later)
STAGING_USER          # deploy
STAGING_SSH_KEY       # private key contents (id_ed25519 or .pem content)
STAGING_SSH_PORT      # 2222
STAGING_DATABASE_URL  # postgresql://mockline:<pw>@<ELASTIC_IP>:5432/mockline_prod
                      # use IP not 'db' — CI runs outside Docker network

PROD_HOST
PROD_USER
PROD_SSH_KEY
PROD_SSH_PORT
PROD_DATABASE_URL
```

### `.github/workflows/staging.yml`

```yaml
name: Deploy — Staging

on:
  push:
    branches: [main]

env:
  NODE_VERSION: '22'
  PNPM_VERSION: '9'

jobs:
  quality:
    name: Type Check + Lint
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with: { version: '${{ env.PNPM_VERSION }}' }
      - uses: actions/setup-node@v4
        with: { node-version: '${{ env.NODE_VERSION }}', cache: pnpm }
      - run: pnpm install --frozen-lockfile
      - run: pnpm typecheck
      - run: pnpm lint

  build:
    name: Build
    runs-on: ubuntu-latest
    needs: quality
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with: { version: '${{ env.PNPM_VERSION }}' }
      - uses: actions/setup-node@v4
        with: { node-version: '${{ env.NODE_VERSION }}', cache: pnpm }
      - run: pnpm install --frozen-lockfile
      - run: pnpm build

  migrate:
    name: Run Migrations
    runs-on: ubuntu-latest
    needs: build
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with: { version: '${{ env.PNPM_VERSION }}' }
      - uses: actions/setup-node@v4
        with: { node-version: '${{ env.NODE_VERSION }}', cache: pnpm }
      - run: pnpm install --frozen-lockfile
      - name: Deploy migrations
        env:
          DATABASE_URL: ${{ secrets.STAGING_DATABASE_URL }}
        run: pnpm --filter=@mockline/db prisma migrate deploy

  deploy:
    name: Deploy to Staging
    runs-on: ubuntu-latest
    needs: migrate
    environment: staging
    steps:
      - name: Deploy via SSH
        uses: appleboy/ssh-action@v1
        with:
          host: ${{ secrets.STAGING_HOST }}
          username: ${{ secrets.STAGING_USER }}
          key: ${{ secrets.STAGING_SSH_KEY }}
          port: ${{ secrets.STAGING_SSH_PORT }}
          script: |
            set -e
            cd /opt/mockline
            git pull origin main
            docker compose up -d --build web api
            docker image prune -f
            echo "✓ Staging deploy complete — $(git rev-parse --short HEAD)"

      - name: Health check
        run: |
          sleep 20
          curl --fail --silent https://api.staging.mockline.xyz/health \
            | grep -q '"status":"ok"' \
            || (echo "Health check failed" && exit 1)
          echo "✓ Health check passed"
```

### `.github/workflows/production.yml`
Triggers on git tag `v*`. Requires manual approval.

```yaml
name: Deploy — Production

on:
  push:
    tags:
      - 'v*'

env:
  NODE_VERSION: '22'
  PNPM_VERSION: '9'

jobs:
  quality:
    name: Type Check + Lint
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with: { version: '${{ env.PNPM_VERSION }}' }
      - uses: actions/setup-node@v4
        with: { node-version: '${{ env.NODE_VERSION }}', cache: pnpm }
      - run: pnpm install --frozen-lockfile
      - run: pnpm typecheck
      - run: pnpm lint

  build:
    name: Build
    runs-on: ubuntu-latest
    needs: quality
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with: { version: '${{ env.PNPM_VERSION }}' }
      - uses: actions/setup-node@v4
        with: { node-version: '${{ env.NODE_VERSION }}', cache: pnpm }
      - run: pnpm install --frozen-lockfile
      - run: pnpm build

  migrate:
    name: Run Migrations
    runs-on: ubuntu-latest
    needs: build
    environment: production   # ← manual approval gate
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with: { version: '${{ env.PNPM_VERSION }}' }
      - uses: actions/setup-node@v4
        with: { node-version: '${{ env.NODE_VERSION }}', cache: pnpm }
      - run: pnpm install --frozen-lockfile
      - name: Deploy migrations
        env:
          DATABASE_URL: ${{ secrets.PROD_DATABASE_URL }}
        run: pnpm --filter=@mockline/db prisma migrate deploy

  deploy:
    name: Deploy to Production
    runs-on: ubuntu-latest
    needs: migrate
    environment: production
    steps:
      - name: Deploy via SSH
        uses: appleboy/ssh-action@v1
        with:
          host: ${{ secrets.PROD_HOST }}
          username: ${{ secrets.PROD_USER }}
          key: ${{ secrets.PROD_SSH_KEY }}
          port: ${{ secrets.PROD_SSH_PORT }}
          script: |
            set -e
            cd /opt/mockline
            git fetch --tags
            git checkout ${{ github.ref_name }}
            docker compose up -d --build web api
            docker image prune -f
            echo "✓ Production deploy complete — ${{ github.ref_name }}"

      - name: Health check
        run: |
          sleep 20
          curl --fail --silent https://api.mockline.xyz/health \
            | grep -q '"status":"ok"' \
            || (echo "Production health check failed" && exit 1)
          echo "✓ Production health check passed"
```

### GitHub environment setup

Repo → Settings → Environments:
1. `staging` — no protection rules (auto-deploys on push to main)
2. `production` — Required reviewers: add yourself

GitHub Actions picks up the tag, runs lint + build, then
pauses at the `production` environment gate waiting for your approval.
Go to GitHub → Actions → the run → Review deployments → Approve.

### Tagging a production release

```bash
git tag v0.1.0 -m "Release v0.1.0"
git push origin v0.1.0
# GitHub Actions → approve the production gate
```

---

## 17. Database Backups
### Self-hosted backup script (optional, belt-and-suspenders)
If you want off-platform backups to a file:

```bash
# /opt/mockline/scripts/backup.sh
#!/bin/bash
set -e
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR=/opt/mockline/backups
mkdir -p "$BACKUP_DIR"

docker compose -f /opt/mockline/docker-compose.yml exec -T db \
  pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB" --no-owner --no-acl \
  | gzip > "$BACKUP_DIR/mockline_$TIMESTAMP.sql.gz"

find "$BACKUP_DIR" -name "*.sql.gz" -mtime +14 -delete
echo "$(date): Backup complete — mockline_$TIMESTAMP.sql.gz" >> /var/log/mockline-backup.log
```

```bash
chmod +x /opt/mockline/scripts/backup.sh
crontab -e
# Add:
0 2 * * * /opt/mockline/scripts/backup.sh
```

### Restore from backup

```bash
gunzip -c /opt/mockline/backups/mockline_TIMESTAMP.sql.gz \
  | docker compose exec -T db psql -U mockline mockline_prod
```

---

## 18. Monitoring + Uptime

### UptimeRobot (free — 50 monitors, 5-min intervals)

uptimerobot.com → Add monitors:
- `https://mockline.xyz` — HTTP, 5 min
- `https://api.mockline.xyz/health` — HTTP, 5 min
- `https://staging.mockline.xyz` — HTTP, 5 min

Alert contact: email + optional Discord webhook.

### Health endpoint — already in `apps/api/src/index.ts` ✓

```typescript
app.get('/health', (c) => c.json({ status: 'ok', timestamp: new Date().toISOString() }))
```

---

### Docker container monitoring (on VPS)

```bash
# Check running containers
docker compose ps

# Container resource usage
docker stats --no-stream

# Logs for a specific service
docker compose logs --tail=100 api
docker compose logs --tail=100 web
```

---

## 19. Staging vs Production Checklist

### Staging (AWS EC2 free tier)

```
[ ] mockline.xyz on Namecheap ✓ (done)
[ ] Cloudflare account created, mockline.xyz added
[ ] Namecheap nameservers → Cloudflare
[ ] Cloudflare API token created
[ ] EC2 t2.micro launched (Ubuntu 24.04, 30GB gp3)
[ ] Elastic IP allocated and associated
[ ] Security group: 2222, 80, 443 open
[ ] SSH key permissions: chmod 400
[ ] deploy user created, SSH key copied
[ ] Server hardened (port 2222, UFW, Fail2ban)
[ ] Swap enabled (2GB)
[ ] Docker + Docker Compose installed
[ ] deploy user in docker group
[ ] /opt/mockline created, owned by deploy
[ ] Repo cloned
[ ] .env created with all values
[ ] letsencrypt/ created, acme files chmod 600
[ ] DNS A records added (including * wildcard), proxy OFF
[ ] docker compose up -d --build
[ ] docker compose ps — all services healthy
[ ] Initial Prisma migration created locally (prisma migrate dev --name init)
[ ] Migration file committed and pushed
[ ] Prisma migrations deployed on server
[ ] BetterAuth tables migrated (once)
[ ] curl https://api.staging.mockline.xyz/health returns 200
[ ] Landing page loads at https://staging.mockline.xyz
[ ] GitHub OAuth app created for staging
[ ] GitHub login works end to end
[ ] Backup script + cron job active
[ ] UptimeRobot monitors added
[ ] GitHub Actions secrets added (STAGING_*)
[ ] staging environment created in GitHub
[ ] First CI deploy triggered by push to main ✓
[ ] mockline_default network removed
```

### Production (new server when ready)

```
[ ] New server provisioned (separate from staging)
[ ] All staging checklist items repeated
[ ] New GitHub OAuth app for production (separate credentials)
[ ] production environment in GitHub with required reviewer
[ ] First release: git tag v0.1.0 && git push origin v0.1.0
[ ] UptimeRobot monitors for production URLs
[ ] Backup cron running
```

---

## 20. Runbook — Common Operations

### Push a fix to staging
```bash
git add .
git commit -m "fix: description"
git push origin main
# CI updates staging in ~4 minutes
```

### Release to production
```bash
git tag v0.2.0 -m "Release v0.2.0"
git push origin v0.2.0
# GitHub Actions → approve production gate
```

### SSH into server
```bash
ssh -i ~/.ssh/mockline-staging.pem -p 2222 deploy@
```

### View logs
```bash
docker compose logs -f api
docker compose logs -f web
docker compose logs -f traefik
docker compose logs -f db
```

### Restart a service without rebuilding
```bash
docker compose restart api
docker compose restart web
```

### Force rebuild a service
```bash
docker compose up -d --build api --no-deps
```

### Roll back to previous version
```bash
cd /opt/mockline
git log --oneline --tags
git checkout v0.1.0
docker compose up -d --build web api
```

### Stop EC2 to preserve free tier hours
```bash
aws ec2 stop-instances --instance-ids i-xxxxxxxxxxxx
```

### Add a new environment variable
```bash
nano /opt/mockline/.env
docker compose up -d web api
# Also add to GitHub Secrets for CI access
```

### Reset a stuck mock container
```bash
docker ps | grep mock-    # find the container
docker stop mock-abc123 && docker rm mock-abc123
# The API will re-provision on next user request
```

### Renew SSL certificates manually (Traefik auto-renews, but if needed)
```bash
docker compose restart traefik
# Traefik re-requests certs on startup if they're within 30 days of expiry
```
---


## 21. Migrating Providers Later

### Step 1 — Provision new server
Follow Sections 7–9 on the new provider. Same commands, different console.

### Step 2 — Migrate data
```bash
# Old server — dump
docker compose exec db pg_dump -U mockline mockline_prod \
  | gzip > /tmp/migrate.sql.gz

# Copy to new server
scp -P 2222 /tmp/migrate.sql.gz deploy@:/tmp/

# New server — restore
gunzip -c /tmp/migrate.sql.gz \
  | docker compose exec -T db psql -U mockline mockline_prod
```

### Step 3 — Update three GitHub secrets
```
STAGING_HOST    → new server IP
STAGING_USER    → deploy (unchanged)
STAGING_SSH_KEY → new server SSH key (or reuse same key)
```

### Step 4 — Update DNS
Cloudflare → change all A records to new IP. Done in seconds.

### Step 5 — Verify and terminate old server
```bash
curl https://api.mockline.xyz/health  # confirms new server is live
# Then terminate old EC2 instance in AWS Console
```

The application, CI/CD pipeline, Traefik config, and Docker Compose
are completely unchanged. The migration is a data move + three secrets + DNS update.

---

Last updated: March 2026 — AWS EC2 free tier staging, provider-agnostic CI/CD, self-hosted Postgres + Redis.*
