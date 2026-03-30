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
19. [Staging vs Production Checklist](#20-staging-vs-production-checklist)
20. [Runbook — Common Operations](#21-runbook--common-operations)
21. [Migrating Providers Later](#22-migrating-providers-later)

---

## 1. Architecture Decision

### Frontend on Vercel. API + DB + Redis + mock containers on VPS.

`apps/web` (Next.js) doesn't need the Docker socket — it just needs to exist
somewhere and make requests to `api.mockline.xyz`. Vercel handles it for free,
with global CDN, automatic deploys on push, and zero server management.

`apps/api` (Hono) must spawn Docker containers for mock provisioning. That requires
direct access to the Docker socket. It lives on EC2. Vercel, Railway, and Render are
serverless or container platforms — they do not expose the Docker socket.
A VPS is the only option where this works cleanly.

This means `mockline.xyz` is always live even when EC2 is stopped.
Anyone visiting the domain sees a real product. API calls will fail gracefully
during development downtime — which is fine before real users exist.

```
┌─────────────────────────────────────────────────-┐
│                    Vercel (free)                 │
│                                                  │
│  ┌────────────────────────────────────────────┐  │
│  │  apps/web — Next.js                        │  │
│  │  mockline.xyz / www.mockline.xyz           │  │
│  │  Always live. No server needed.            │  │
│  └────────────────────────────────────────────┘  │
└────────────────────────────────────────────────-─┘

┌─────────────────────────────────────────────────────────────┐
│              VPS (AWS EC2 t2.micro → Hetzner CX23)          │
│                                                             │
│  ┌──────────┐  ┌────────┐  ┌─────────────┐                  │
│  │ apps/api │  │   db   │  │    cache    │                  │
│  │  Hono    │  │Postgres│  │    Redis    │                  │
│  │ :4000    │  │ :5432  │  │   :6379     │                  │
│  └──────────┘  └────────┘  └─────────────┘                  │
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

User → Cloudflare DNS → VPS IP → Traefik → correct container
```
mockline.xyz        → Vercel CDN → Next.js app
api.mockline.xyz    → Cloudflare DNS → EC2 → Traefik → Hono API
*.mockline.xyz      → Cloudflare DNS → EC2 → Traefik → mock container
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
nameservers at Cloudflare. All DNS management happens in Cloudflare from then on.

---

## 2. Cost Summary

### AWS Free Tier (first 12 months)
| Service | Spec | Cost |
|---------|------|------|
| **Vercel** | Frontend hosting | $0 (free tier, always) |
| EC2 t2.micro | 1 vCPU, 1GB RAM | $0 (750 hrs/mo free) |
| EBS Storage | 30GB SSD | $0 (30GB free) |
| Data transfer | 15GB/mo out | $0 (15GB free) |
| Elastic IP | Static IP | $0 while attached to running instance |
| **mockline.xyz domain** | Namecheap 1yr | ~$2–15 |
| **Total** | | **~$2–15 first year** |

### After Free Tier / Move to Hetzner
| Service | Spec | Cost |
|---------|------|------|
| **Vercel** | Frontend hosting | $0 (free tier, always) |
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
- Frontend stays live on Vercel regardless — domain never goes dark

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
Without it you'll need to update DNS every time the instance starts.

---

## 4. Multi-Stage Docker Builds

Multi-stage builds copy only what's needed to run, leaving build tools behind.
Typical result: images go from 1.2GB → 200MB.

`apps/web` is deployed via Vercel — no Dockerfile needed for it.
Only `apps/api` and `docker/mock-server` need Docker images.

### `apps/api/Dockerfile`

```dockerfile
FROM node:22-alpine AS base
RUN apk add --no-cache openssl
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

# ── pruner ─────────
FROM base AS pruner
WORKDIR /app
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
RUN pnpm add -g turbo
COPY . .
RUN turbo prune @mockline/api --docker

# ── deps ───────────
FROM base AS deps
WORKDIR /app
COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/out/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=pruner /app/out/full/packages/db/prisma/schema.prisma ./packages/db/prisma/schema.prisma
RUN pnpm install --frozen-lockfile -r

# ── builder ───────
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages ./packages
COPY --from=deps /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=pruner /app/out/full/ .
COPY --from=pruner /app/tsconfig.json ./tsconfig.json
RUN pnpm --filter=@mockline/api build
RUN pnpm --filter=@mockline/db prisma generate

# ── runner ───────────
FROM node:22-alpine AS runner
RUN apk add --no-cache openssl
WORKDIR /app
ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 honojs

COPY --chown=honojs:nodejs --from=builder /app/apps/api/dist ./apps/api/dist
COPY --chown=honojs:nodejs --from=builder /app/apps/api/node_modules ./apps/api/node_modules
COPY --chown=honojs:nodejs --from=builder /app/node_modules ./node_modules
COPY --chown=honojs:nodejs --from=builder /app/packages/db ./packages/db
COPY --chown=honojs:nodejs --from=builder /app/package.json ./

USER honojs
EXPOSE 4000
CMD ["sh", "-c", "packages/db/node_modules/.bin/prisma migrate deploy --schema=packages/db/prisma/schema.prisma && node apps/api/dist/index.js"]
```

### `docker/mock-server/Dockerfile` — updated with multi-stage

```dockerfile
FROM node:22-alpine AS installer
WORKDIR /app
ENV PNPM_HOME=/usr/local/share/pnpm
ENV PATH=/usr/local/share/pnpm:$PATH

ARG CONTOUR_VERSION=1.2.1
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
RUN pnpm add -g @trillionclues/contour@${CONTOUR_VERSION}
RUN chmod -R 755 /usr/local/share/pnpm

# ── runner ────────────
FROM node:22-alpine AS runner
WORKDIR /app
ENV PNPM_HOME=/usr/local/share/pnpm
ENV PATH=/usr/local/share/pnpm:$PATH

COPY --from=installer /usr/local/share/pnpm /usr/local/share/pnpm
RUN chmod -R 755 /usr/local/share/pnpm

USER node
COPY --chown=node:node spec.yaml ./spec.yaml

EXPOSE 3001
HEALTHCHECK --interval=5s --timeout=3s --retries=5 \
  CMD wget -qO- http://localhost:3001/_contour/health || exit 1

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
    web/                            ← deployed via Vercel, no Dockerfile needed
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
  api:
    build:
      context: .                        # monorepo root as build context
      dockerfile: apps/api/Dockerfile   # relative to context

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
After this, all DNS changes happen in Cloudflare. Namecheap is irrelevant for DNS.

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
4. **Instance type**: t3.micro
5. **Key pair**: Create new → ED25519 → download `.pem` → save to `~/.ssh/mockline-staging.pem`

NB: if file is in download folder (move or copy it)
mv ~/Downloads/mockline-key.pem ~/.ssh/mockline-staging.pem
or
cp ~/Downloads/mockline-key.pem ~/.ssh/mockline-staging.pem
<!-- 
ls -la ~/.ssh. ==== see the contents of your .ssh directory
chmod 400 ~/.ssh/mockline-staging.pem

 -->
Key pair (login):
Click Create new key pair.
Name it mockline-staging.
Key pair type: ED25519 (more modern/secure than RSA).
Format: .pem.
Click Create key pair and download it to your Mac (move it to ~/.ssh/mockline-staging.pem).

6. **Security group** — new group with rules:
   ```
   SSH    TCP  22   My IP only    
   HTTP   TCP  80     Anywhere
   HTTPS  TCP  443    Anywhere
   ```
   Do NOT open ports 5432 (Postgres) or 6379 (Redis) — keep those internal to Docker.
   Network settings:

Click Edit in the corner of this panel.
Select Create security group.
Name it mockline-sg.
Under Inbound security group rules:
Rule 1: Type SSH, Source type My IP. (This restrict SSH to your current location only).
Rule 2: Click "Add security group rule". Type HTTP, Source type Anywhere.
Rule 3: Click "Add security group rule". Type HTTPS, Source type Anywhere.
7. **Storage**: 30GB gp3
8. Launch

### Step 2 — Allocate Elastic IP

EC2 → Elastic IPs → Allocate → Associate → select your instance
If you restart your server without this, your IP changes and DNS breaks.

In the EC2 Dashboard left sidebar, under Network & Security, click Elastic IPs.
Click Allocate Elastic IP address.
Leave everything default and click Allocate.
Select the newly created IP address, click the Actions dropdown, and select Associate Elastic IP address.
Instance: Select your mockline-staging instance from the dropdown.
Click Associate.

This IP is permanent. Add it to `api`, `api.staging`, and `*` DNS records.
`@` and `www` go to Vercel — not here.

### Step 3 — Connect

```bash
chmod 400 ~/.ssh/mockline-staging.pem
ssh -i ~/.ssh/mockline-staging.pem ubuntu@<YOUR_ELASTIC_IP>
```

Ubuntu 24.04 on EC2 uses `ubuntu` as the default user.

### Step 4 — Create deploy user

```bash
sudo adduser --disabled-password --gecos "" deploy
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
# so it doesn't crash when running Docker builds
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
free -h   # verify

# SSH hardening by disabling root login and password login (key only)
sudo sed -i 's/#PermitRootLogin prohibit-password/PermitRootLogin no/' /etc/ssh/sshd_config
sudo sed -i 's/#PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config
sudo sed -i 's/PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config
sudo systemctl restart ssh

# NOTE
# In newer versions of Ubuntu, the SSH service is named ssh instead of sshd. Your modifications to the config file were completely successful, it just couldn't find the old name to restart the service.
# Run this command instead to safely restart it and apply the changes:
# sudo systemctl restart ssh

# Firewall
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp  # SSH (Security Group already restricts to your IP)
sudo ufw allow 80/tcp  # HTTP (Traefik → Let's Encrypt)
sudo ufw allow 443/tcp # HTTPS
sudo ufw --force enable

# Fail2ban — block brute-force IPs attacks after repeated failed SSH attempts
sudo apt install fail2ban -y
sudo systemctl enable fail2ban
sudo systemctl start fail2ban

# Auto security updates
sudo apt install unattended-upgrades -y
sudo dpkg-reconfigure --priority=low unattended-upgrades

sudo apt install rkhunter -y
sudo rkhunter --update
sudo rkhunter --check

sudo apt install lynis -y
sudo lynis audit system
```

**From now on, SSH/connect as:**
```bash
ssh -i ~/.ssh/mockline-staging.pem deploy@<ELASTIC_IP>
```

---NEXT---

## 9. Docker + Docker Compose on Server

```bash
# Install Docker and
# give deploy user permission to run docker commands
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker deploy

# Create the project directory
sudo mkdir -p /opt/mockline
sudo chown deploy:deploy /opt/mockline

# Verify
docker --version
docker compose version

# Log out and back in
exit
ssh -i ~/.ssh/mockline-staging.pem deploy@<ELASTIC_IP>
```
---


Log back in as deploy tep 1: Clone the Repository
ssh -i ~/.ssh/mockline-staging.pem deploy@<YOUR_ELASTIC_IP>

Right now, you are connected to an empty server. Let's pull down your code. Run these commands:
cd /opt/mockline
git clone https://github.com/trillionclues/mockline.git .

### On VPS — `/opt/mockline/.env`
OR checkin and 
```bash
nano .env
```

To update the env file
nano /opt/mockline/.env
Use the arrow keys to scroll down to the GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET lines. Delete the placeholder values and type in your real ones.

Save and exit: Ctrl + O → Enter → Ctrl + X.
Then retart the API
docker compose restart api



Created manually on the server. Never committed to git.
API-only. No `NEXT_PUBLIC_*` vars needed here — web is on Vercel.

```bash
# ── App ────────────
NODE_ENV=production
PORT=4000
CORS_ORIGIN=https://mockline.xyz
COOKIE_DOMAIN=.mockline.xyz

# ── Database ────────────
POSTGRES_USER=mockline
POSTGRES_PASSWORD=
POSTGRES_DB=mockline_prod
# 'db' = Docker service name — correct for container-to-container
DATABASE_URL=postgresql://mockline:your_secure_db_password@db:5432/mockline_prod

# ── Redis ────────────
# 'cache' = Docker service name
REDIS_URL=redis://cache:6379

# ── BetterAuth ────────────
BETTER_AUTH_SECRET= # openssl rand -hex 32
BETTER_AUTH_URL=https://api.mockline.xyz

# ── GitHub OAuth ────────────
# Create NEW OAuth app: github.com/settings/developers/new
# Homepage URL:  https://mockline.xyz
# Use your existing staging OAuth app from GitHub
# Callback URL must match: https://api.mockline.xyz/api/auth/callback/github
GITHUB_CLIENT_ID=your_staging_client_id
GITHUB_CLIENT_SECRET=your_staging_client_secret

# ── Google OAuth ──────
GOOGLE_CLIENT_ID=your_staging_google_client_id
GOOGLE_CLIENT_SECRET=your_staging_google_client_secret

# ── Internal ────────────
INTERNAL_API_SECRET= # openssl rand -hex 32

# ── Frontend (vercel)────────────
NEXT_PUBLIC_API_URL=https://api.mockline.xyz
NEXT_PUBLIC_APP_URL=https://mockline.xyz
NEXT_PUBLIC_MOCK_BASE_URL=https://mock.mockline.xyz
NEXT_PUBLIC_AUTH_URL=https://api.mockline.xyz

# ── Docker ────────────
DOCKER_HOST=unix:///var/run/docker.sock
MOCK_BASE_DOMAIN=mockline.xyz
CONTOUR_VERSION=1.2.1

# ── Traefik ────────────
CF_DNS_API_TOKEN= # from Cloudflare API token step

# ── Lemon Squeezy ──────────
LEMONSQUEEZY_API_KEY=
LEMONSQUEEZY_STORE_ID=
LEMONSQUEEZY_WEBHOOK_SECRET=
LEMONSQUEEZY_PRO_MONTHLY_VARIANT_ID=
LEMONSQUEEZY_PRO_YEARLY_VARIANT_ID=
LEMONSQUEEZY_TEAM_MONTHLY_VARIANT_ID=
LEMONSQUEEZY_TEAM_YEARLY_VARIANT_ID=

# resend
RESEND_API_KEY=""
RESEND_FROM_EMAIL=""
```

Save the file and exit:
Press Ctrl + O then Enter (to save).
Press Ctrl + X (to exit).


**Note on `DATABASE_URL` hostname:**
In Docker Compose, services talk to each other by service name.
`db` resolves to the Postgres container inside the Docker network.
`localhost:5432` only works outside Docker (local dev).

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

### Create Traefik cert files on VPS
Traefik needs a place to securely store the SSL certificates it gets from Let's Encrypt. Run this block to create the empty, secure files:

Setup Traefik SSL Certificates
Traefik needs a place to securely store the SSL certificates it gets from Let's Encrypt. Run this block to create the empty, secure files:

```bash
mkdir -p /opt/mockline/letsencrypt
touch /opt/mockline/letsencrypt/acme.json
touch /opt/mockline/letsencrypt/acme-wildcard.json
chmod 600 /opt/mockline/letsencrypt/acme.json
chmod 600 /opt/mockline/letsencrypt/acme-wildcard.json
```

Or if already inside /opt/mockline

```bash
mkdir -p letsencrypt
touch letsencrypt/acme.json letsencrypt/acme-wildcard.json
chmod 600 letsencrypt/acme.json letsencrypt/acme-wildcard.json
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
Step 2: Create your .env File
Your GitHub repository doesn't (and shouldn't) contain your production secrets, so you must create the .env file manually on the server.


### Local dev — current setup is correct
- `apps/api/.env` — real values, gitignored ✓
- `apps/web/.env.local` — real values, gitignored ✓
- `packages/.env` — Postgres credentials for local Docker ✓

### apps/web on Vercel — environment variables set in Vercel dashboard

`NEXT_PUBLIC_*` vars are set in the Vercel project dashboard, not in any `.env` file
on the VPS. Vercel bakes them into the build at deploy time.

Vercel Dashboard → your project → Settings → Environment Variables:

```
NEXT_PUBLIC_API_URL          https://api.mockline.xyz
NEXT_PUBLIC_APP_URL          https://mockline.xyz
NEXT_PUBLIC_MOCK_BASE_URL    https://mock.mockline.xyz
NEXT_PUBLIC_AUTH_URL         https://api.mockline.xyz
INTERNAL_API_SECRET          <must match API value>
BETTER_AUTH_SECRET           <must match API value>
```

## 12. Database + Redis — Self-Hosted in Docker

Updated `docker-compose.yml` for production:
API, DB, Redis, Traefik only. No `web` service.

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

  api:
    build:
      context: .
      dockerfile: apps/api/Dockerfile
    container_name: mockline-api
    restart: unless-stopped
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
    env_file: .env
    environment:
      - DATABASE_URL=postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@db:5432/${POSTGRES_DB}?schema=public
      - REDIS_URL=redis://cache:6379
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

# Start everything
docker compose up -d --build

Run this command in your server terminal right now to see your hard drive space:

```bash
df -h /
```

If you ever modify volume on aws, run these two commands to tell Ubuntu to expand into the new space:

```bash
sudo growpart /dev/root 1
sudo resize2fs /dev/root
```

If you update storage on AWS, login as root back to your Mac terminal (inside the server) and run these two commands to tell Ubuntu to expand into the new space:
sudo growpart /dev/root 1
sudo resize2fs /dev/root

After doing that, run df -h / again. The Size column should now proudly display ~29G or 30G.

Once you confirm you have the space, clear out the broken Docker files from the first attempt and start the build again!

Clear out the broken Docker files from the first attempt and start the build again!
docker system prune -a --volumes -f
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

docker compose logs --tail=20 api

#Verify SSL & DNS (Critical)
docker compose logs --tail=20 proxy

```

Add these Environment Variables to CLoudlfare 
Type    Name    Content              Proxy
A       api     <ELASTIC_IP>         DNS only
A       *       <ELASTIC_IP>         DNS only
A       api-staging       <ELASTIC_IP>         DNS only

GitHub Actions Secrets (Section 16)

Go to your repo → Settings → Secrets and variables → Actions
API_HOST           <your Elastic IP>
API_USER           deploy
API_SSH_KEY        <contents of ~/.ssh/mockline-staging.pem>

NB: On your Mac terminal, run this command to copy the entire contents of the .pem file to your clipboard:
cat ~/.ssh/mockline-staging.pem | pbcopy

---

## 13. Prisma Migrations + BetterAuth Tables
To find out errors in any container, run this command to see the error logs for just that container:
docker compose logs --tail=50 api

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
Because this is a brand new database, we need to create the user, session, and account tables that better-auth uses.

```bash
# On VPS, after first deploy:
  docker compose exec api pnpm dlx @better-auth/cli migrate --config apps/api/src/lib/auth.ts
```
This creates four tables:
- `user` — core user record
- `session` — active sessions
- `account` — OAuth provider links
- `verification` — email verification tokens (unused if Google-only)

These tables are separate from the app schema. Run this once per
new database (staging and production separately).  Never again unless you wipe the database.

IF THIS DOESNT WORK
It could be that the API image is highly optimized for production, it only contains your lean, compiled index.mjs file and Node.js. It purposely does not have raw TypeScript files (src/lib/auth.ts) or heavy package managers like pnpm taking up space. It is incredibly secure and fast
The clean way to do it: Since the raw source code right there on the server in /opt/mockline (which is cloned via git), we can just spin up a tiny, temporary Node container on the fly. It will connect to your database network, run the migration using the source code, and immediately delete itself!

```bash
docker run --rm -it \
  --network mockline-network \
  --env-file /opt/mockline/.env \
  -e NODE_ENV=development \
  node:22-alpine \
  sh -c "apk add --no-cache git openssl && git clone https://github.com/trillionclues/mockline.git /tmp/mig && cd /tmp/mig && corepack enable && pnpm install && pnpm dlx prisma@5.22.0 generate --schema=packages/db/prisma/schema.prisma && pnpm dlx @better-auth/cli@1.2.7 migrate --config apps/api/src/lib/auth.ts"
```
(This command mounts the current /opt/mockline folder into /app inside a fresh Node container, enables pnpm, installs openssl which Prisma often needs, and successfully runs the Better-Auth CLI against the internal database).
---

## 15. DNS Records

Add in Cloudflare DNS dashboard.

**Vercel records** — use the values Vercel gives you when you add the domain.
Keep proxy OFF (DNS only) — Vercel has its own CDN and SSL.

**EC2 records** — proxy OFF (DNS only).
Traefik handles SSL — Cloudflare proxying on top causes double-SSL cert errors.

```
Type    Name          Content                        TTL    Proxy
──────────────────────────────────────────────────────────────────
A       @             76.76.21.21 (Vercel)           Auto   DNS only
CNAME   www           cname.vercel-dns.com           Auto   DNS only
A       api           <ELASTIC_IP>                   Auto   DNS only
A       api.staging   <ELASTIC_IP>                   Auto   DNS only
A       *             <ELASTIC_IP>                   Auto   DNS only ← wildcard for mock containers
```

The exact Vercel IP and CNAME values are shown in your Vercel dashboard
when you add the domain — use those, not the example values above.

The `*` wildcard on EC2 catches `mock-abc123.mockline.xyz`. Traefik reads
Docker container labels and routes to the correct mock container.

---

## 16. GitHub Actions CI/CD — Provider Agnostic

Two separate workflows — one for Vercel (web), one for EC2 (API).
The EC2 workflow only needs: IP, SSH key, username.
Switching providers = changing three secrets. Nothing else

### Repository secrets

Settings → Secrets and variables → Actions

```
# API / EC2
API_HOST             # Elastic IP (or Hetzner IP later)
API_USER             # deploy

<!-- if using aws ec2 -->
<!-- run this command to copy the entire contents of the .pem file to your clipboard -->
cat ~/.ssh/mockline-staging.pem | pbcopy
API_SSH_KEY        <contents of ~/.ssh/mockline-staging.pem>

# Vercel (web)
VERCEL_TOKEN         # from vercel.com → Account Settings → Tokens
VERCEL_ORG_ID        # from .vercel/project.json after first deploy
VERCEL_PROJECT_ID    # from .vercel/project.json after first deploy
```

> **Note:** No `API_DATABASE_URL` secret needed. Prisma migrations run inside
> the Docker container at startup (the API Dockerfile CMD handles this).
> The DB is only accessible within the Docker network — not from CI runners.

### `.github/workflows/deploy-web.yml`

Deploys `apps/web` to Vercel on every push to `main`.

```yaml
name: Deploy — Web (Vercel)

on:
  push:
    branches: [main]
    paths:
      - 'apps/web/**'
      - 'packages/types/**'

env:
  NODE_VERSION: '22'
  PNPM_VERSION: '9'

jobs:
  deploy:
    name: Deploy to Vercel
    runs-on: ubuntu-latest
    environment: staging
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v4
        with: { version: '${{ env.PNPM_VERSION }}' }

      - uses: actions/setup-node@v4
        with: { node-version: '${{ env.NODE_VERSION }}', cache: pnpm }

      - run: pnpm install --frozen-lockfile

      - name: Deploy to Vercel
        run: |
          pnpm dlx vercel --token=${{ secrets.VERCEL_TOKEN }} \
            --prod \
            --yes
        env:
          VERCEL_ORG_ID: ${{ secrets.VERCEL_ORG_ID }}
          VERCEL_PROJECT_ID: ${{ secrets.VERCEL_PROJECT_ID }}
```

Note: Vercel's GitHub integration auto-deploys on push without needing this workflow.
This workflow gives you explicit control and lets you gate it behind quality checks.
If you prefer the simpler Vercel Git integration, skip this workflow entirely and
let Vercel handle web deploys automatically.



### `.github/workflows/deploy-api.yml`

Deploys `apps/api` to EC2 on every push to `main`.


```yaml
name: Deploy — API (EC2)

on:
  push:
    branches: [main]
    paths:
      - 'apps/api/**'
      - 'packages/db/**'
      - 'packages/types/**'
      - 'packages/docker-manager/**'
      - 'docker-compose.yml'
  workflow_dispatch:

env:
  NODE_VERSION: '22'

concurrency:
  group: deploy-api-staging
  cancel-in-progress: true

jobs:
  quality:
    name: Type Check + Lint
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with: { node-version: '${{ env.NODE_VERSION }}', cache: pnpm }
      - run: pnpm install --frozen-lockfile
      - run: pnpm typecheck
      - run: pnpm lint

  # No separate migrate job — the API Dockerfile CMD runs
  # `prisma migrate deploy` on every container start.
  # DB is only reachable inside the Docker network.

  deploy:
    name: Deploy to EC2
    runs-on: ubuntu-latest
    needs: quality
    environment:
      name: staging
    steps:
      - name: Deploy via SSH
        uses: appleboy/ssh-action@v1
        with:
          host: ${{ secrets.API_HOST }}
          username: ${{ secrets.API_USER }}
          script: |
            set -e
            cd /opt/mockline

            # Save current image ID for rollback
            PREV_IMAGE=$(docker inspect --format='{{.Image}}' mockline-api 2>/dev/null || echo "none")

            git pull origin main
            docker compose up -d --build api
            docker image prune -f

            # Internal health check with rollback
            sleep 15
            if ! curl --fail --silent http://localhost:4000/health | grep -q '"status":"ok"'; then
                echo "⚠ Internal health check failed — rolling back"
                if [ "$PREV_IMAGE" != "none" ]; then
                    docker tag "$PREV_IMAGE" mockline-api:rollback
                fi
                docker compose down api
                exit 1
            fi

            echo "✓ API deploy complete — $(git rev-parse --short HEAD)"

      - name: Health check
        run: |
          sleep 20
          curl --fail --silent https://api.mockline.xyz/health \
            | grep -q '"status":"ok"' \
            || (echo "Health check failed" && exit 1)
          echo "✓ Health check passed"
```

### `.github/workflows/deploy-api-prod.yml`

Production API deploy — triggered by git tag `v*`, requires manual approval.

```yaml
name: Deploy — API Production

on:
  push:
    tags:
      - 'v*'
  workflow_dispatch:

env:
  NODE_VERSION: '22'

concurrency:
  group: deploy-api-production
  cancel-in-progress: true

jobs:
  quality:
    name: Type Check + Lint
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with: { node-version: '${{ env.NODE_VERSION }}', cache: pnpm }
      - run: pnpm install --frozen-lockfile
      - run: pnpm typecheck
      - run: pnpm lint

  # No separate migrate job — same as staging.
  # API Dockerfile CMD runs `prisma migrate deploy` on container start.

  deploy:
    name: Deploy to Production
    runs-on: ubuntu-latest
    needs: quality
    environment:
      name: production
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

            # Save current image ID for rollback
            PREV_IMAGE=$(docker inspect --format='{{.Image}}' mockline-api 2>/dev/null || echo "none")

            git fetch --tags
            git checkout ${{ github.ref_name }}
            docker compose up -d --build api
            docker image prune -f

            # Internal health check with rollback
            sleep 15
            if ! curl --fail --silent http://localhost:4000/health | grep -q '"status":"ok"'; then
                echo "⚠ Internal health check failed — rolling back"
                if [ "$PREV_IMAGE" != "none" ]; then
                    docker tag "$PREV_IMAGE" mockline-api:rollback
                fi
                docker compose down api
                exit 1
            fi

            echo "✓ Production API deploy complete — ${{ github.ref_name }}"

      - name: Health check
        run: |
          sleep 20
          curl --fail --silent ${{ secrets.PROD_API_URL || 'https://api.mockline.xyz' }}/health \
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

Note: `mockline.xyz` stays up even when EC2 is stopped (Vercel).
Only the API monitor will alert when EC2 is down.

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
```

---

## 19. Staging vs Production Checklist

### Staging (AWS EC2 free tier)

```
[ ] mockline.xyz on Namecheap ✓
[ ] Cloudflare account created, mockline.xyz added
[ ] Namecheap nameservers → Cloudflare
[ ] Cloudflare API token created (Edit zone DNS scope)

[ ] Vercel project created, repo connected
[ ] apps/web root directory set in Vercel
[ ] NEXT_PUBLIC_* env vars added in Vercel dashboard
[ ] mockline.xyz and www added as Vercel domains
[ ] Vercel DNS values added in Cloudflare (proxy OFF)
[ ] https://mockline.xyz loads landing page

[ ] EC2 t2.micro launched (Ubuntu 24.04, 30GB gp3)
[ ] Elastic IP allocated and associated
[ ] Security group: 22, 80, 443 open
[ ] SSH key: chmod 400
[ ] deploy user created, SSH key copied
[ ] Server hardened (UFW, Fail2ban)
[ ] Swap enabled (2GB)
[ ] Docker + Docker Compose installed
[ ] deploy user in docker group
[ ] /opt/mockline created, owned by deploy
[ ] Repo cloned to /opt/mockline
[ ] .env created (API vars only — no NEXT_PUBLIC_*)
[ ] letsencrypt/ created, acme files chmod 600
[ ] api and * DNS A records added in Cloudflare (proxy OFF)
[ ] docker compose up -d --build
[ ] docker compose ps — all services healthy
[ ] Initial Prisma migration created locally and committed
[ ] Prisma migrations deployed
[ ] BetterAuth tables migrated (once)
[ ] curl https://api.mockline.xyz/health returns 200
[ ] GitHub OAuth app created for staging
[ ] Login flow works end to end
[ ] Backup script + cron job active
[ ] UptimeRobot monitors added
[ ] GitHub Actions secrets added (API_HOST, API_USER, VERCEL_*)
[ ] staging environment created in GitHub
[ ] First CI deploys triggered by push to main
[ ] mockline_default network removed
```

### Production (new server when ready)

```
[ ] New server provisioned (separate from staging)
[ ] All EC2 checklist items repeated for prod server
[ ] New GitHub OAuth app for production (separate credentials)
[ ] Vercel production env vars verified
[ ] production environment in GitHub with required reviewer
[ ] First release: git tag v0.1.0 && git push origin v0.1.0
[ ] UptimeRobot monitors for production
[ ] Backup cron running
```

---

## 20. Runbook — Common Operations

### Push a frontend change
```bash
git add .
git commit -m "feat: update landing page"
git push origin main
# Vercel auto-deploys — live in ~1 minute
```

### Push an API change
```bash
git add .
git commit -m "fix: api description"
git push origin main
# deploy-api.yml runs — EC2 updated in ~4 minutes
```

### Release to production
```bash
git tag v0.2.0 -m "Release v0.2.0"
git push origin v0.2.0
# GitHub Actions → approve production gate
```

### SSH into server
```bash
# AWS (uses .pem key from EC2 setup)
ssh -i ~/.ssh/mockline-staging.pem deploy@<ELASTIC_IP>

# Hetzner / DigitalOcean (uses your default SSH key)
ssh deploy@<VPS_IP>
```

### View logs
```bash
docker compose logs -f api
docker compose logs -f traefik
docker compose logs -f db
```

### Restart a service without rebuilding
```bash
docker compose restart api
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
docker compose up -d --build api
```

### Stop EC2 to preserve free tier hours
```bash
aws ec2 stop-instances --instance-ids i-xxxxxxxxxxxx
```

### Add a new environment variable
```bash
nano /opt/mockline/.env
docker compose up -d api
# Also add to GitHub Secrets for CI access
# For web: add in Vercel dashboard → triggers a redeploy
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
scp -P 22 /tmp/migrate.sql.gz deploy@:/tmp/

# New server — restore
gunzip -c /tmp/migrate.sql.gz \
  | docker compose exec -T db psql -U mockline mockline_prod
```

### Step 3 — Update three GitHub secrets
```
API_HOST    → new server IP
API_USER    → deploy (unchanged)
```

### Step 4 — Update DNS
Cloudflare → change `api` and `*` A records to new IP.
`@` and `www` (Vercel records) are unchanged.

### Step 5 — Verify and terminate old server
```bash
curl https://api.mockline.xyz/health  # confirms new server is live
# Then terminate old EC2 instance in AWS Console
```

The application, CI/CD pipeline, Traefik config, and Docker Compose
are completely unchanged. The migration is a data move + three secrets + DNS update.

---

*Last updated: March 2026 — Vercel frontend + AWS EC2 API, provider-agnostic CI/CD, self-hosted Postgres + Redis.*





<!-- ---------------- note for spaceship vps ------------>
Spaceship uses port 22022, not 22.
Spaceship requires a passphrase (at least 8 chars, upper/lowercase, number, special char). 

Run to generate one
ssh-keygen -t ecdsa -b 521 -f ~/.ssh/id_ecdsa
<!-- Store it somewhere safe (your password manager) because it can't be recovered. -->

Then run:
cat ~/.ssh/id_ecdsa.pub
<!-- copy and paste into Spaceship's SSH key field -->

ls ~/.ssh/id_ecdsa*
# id_ecdsa        ← private, stays on your machine only
# id_ecdsa.pub    ← this is what you paste into Spaceship

ssh in
ssh -p 22022 root@209.74.86.10

<!-- after setting up deploy user -->
ssh -p 22022 deploy@209.74.86.10

<!-- to query the db -->
docker exec -it mockline-db psql -U your_db_user -d your_db_name

SELECT id, email, name, "createdAt" FROM users ORDER BY "createdAt" DESC LIMIT 20;
SELECT COUNT(*) FROM users;