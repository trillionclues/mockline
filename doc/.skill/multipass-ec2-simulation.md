# Mockline — Local EC2 Simulation with Multipass

> Simulate exact AWS EC2 Ubuntu 24.04 environment locally before deploying.
> Covers staging and production VM setup, Docker, Traefik, SSL workarounds,
> and the differences you need to account for vs real EC2.

---

## Table of Contents

1. [What Multipass gives vs real EC2](#1-what-multipass-gives-you-vs-real-ec2)
2. [Install Multipass](#2-install-multipass)
3. [Create VMs — Staging and Production](#3-create-vms--staging-and-production)
4. [Server Hardening — identical to EC2](#4-server-hardening--identical-to-ec2)
5. [Install Docker](#5-install-docker)
6. [Clone and configure Mockline](#6-clone-and-configure-mockline)
7. [SSL — the local difference](#7-ssl--the-local-difference)
8. [Local DNS — fake the domains](#8-local-dns--fake-your-domains)
9. [Deploy and test](#9-deploy-and-test)
10. [Differences to account for in production](#10-differences-to-account-for-in-production)
11. [Multipass daily commands](#11-multipass-daily-commands)
12. [Cleanup](#12-cleanup)

---

## 1. What Multipass gives you vs real EC2

### What is identical

- Ubuntu 24.04 LTS — byte-for-byte same kernel and packages
- systemd, apt, UFW, Fail2ban all behave identically
- Docker and Docker Compose work identically
- Your hardening scripts run without modification
- Network interfaces, port binding — same behaviour
- The deploy scripts from your DEPLOYMENT-FLOW.md work unchanged

### What is different

| Real EC2 | Multipass |
|----------|-----------|
| Elastic IP (public static IP) | VM gets a local IP on your Mac (e.g. 192.168.64.x) |
| AWS Security Groups (firewall at network edge) | UFW only (firewall inside the VM) |
| Public internet reachable | Only reachable from your Mac by default |
| Let's Encrypt HTTP challenge works (real domain → real IP) | Let's Encrypt cannot verify — use local SSL workaround |
| Wildcard DNS (*.mockline.xyz → your IP) | Must fake with /etc/hosts entries |

Everything else — Docker, Traefik routing logic, your app stack,
migrations, CI/CD script logic — is identical.

---

## 2. Install Multipass

```bash
brew install multipass
```

Verify:

```bash
multipass version
# multipass   1.14.x
# multipassd  1.14.x
```

Multipass uses Apple Hypervisor Framework on Mac — no VirtualBox, no VMware needed.
It runs as a background daemon (`multipassd`) that starts automatically.

---

## 3. Create VMs — Staging and Production

Create two separate VMs to simulate your two server environments.

### Staging VM

```bash
multipass launch 24.04 \
  --name mockline-staging \
  --cpus 1 \
  --memory 1G \
  --disk 10G
```

This matches your EC2 t2.micro specs (1 vCPU, 1GB RAM).

### Production VM

```bash
multipass launch 24.04 \
  --name mockline-prod \
  --cpus 2 \
  --memory 4G \
  --disk 20G
```

This matches your planned Hetzner CX23 (2 vCPU, 4GB RAM).

### Get VM IP addresses

```bash
multipass list
```

Output:
```
Name               State    IPv4             Image
mockline-staging   Running  192.168.64.10    Ubuntu 24.04 LTS
mockline-prod      Running  192.168.64.11    Ubuntu 24.04 LTS
```

Note these IPs — you will use them throughout this guide.
They are stable while the VM is running but may change on restart.
We will handle this in the DNS section.

### Shell into a VM

```bash
# Staging
multipass shell mockline-staging

# Production
multipass shell mockline-prod
```

You are now inside the VM as the `ubuntu` user — same as EC2.

---

## 4. Server Hardening — identical to EC2

Run these inside each VM. These are the exact same commands from your
DEPLOYMENT-FLOW.md — they work identically on Multipass.

```bash
# Update packages
sudo apt update && sudo apt upgrade -y

# Enable swap — critical for 1GB staging VM
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
free -h

# SSH hardening — do not change port to 2222, leave at 22
# sudo sed -i 's/#Port 22/Port 2222/' /etc/ssh/sshd_config
# sudo sed -i 's/Port 22/Port 2222/' /etc/ssh/sshd_config
sudo sed -i 's/#PermitRootLogin prohibit-password/PermitRootLogin no/' /etc/ssh/sshd_config
sudo sed -i 's/#PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config
sudo sed -i 's/PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config
sudo systemctl restart sshd

# Firewall — UFW replaces AWS Security Groups here
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp   # SSH
sudo ufw allow 80/tcp     # HTTP
sudo ufw allow 443/tcp    # HTTPS
sudo ufw --force enable

# Fail2ban (block brute force)
sudo apt install fail2ban -y
sudo systemctl enable fail2ban
sudo systemctl start fail2ban

# Auto security updates
sudo apt install unattended-upgrades -y
sudo dpkg-reconfigure --priority=low unattended-upgrades
```

### Create deploy user

```bash
sudo adduser deploy
sudo usermod -aG sudo deploy

# Copy ubuntu's SSH authorized_keys to deploy
sudo mkdir -p /home/deploy/.ssh
sudo cp ~/.ssh/authorized_keys /home/deploy/.ssh/
sudo chown -R deploy:deploy /home/deploy/.ssh
sudo chmod 700 /home/deploy/.ssh
sudo chmod 600 /home/deploy/.ssh/authorized_keys
```

### SSH into VM as deploy user from your Mac

```bash
# Find the VM IP
multipass list

# SSH in (port 22, same as real EC2 after hardening)
ssh -p 22 deploy@192.168.64.10
```

Note: Multipass VMs accept SSH with your Mac's existing SSH key automatically
because it copies your public key in during launch. No .pem file needed locally.

---

## 5. Install Docker

Run inside the VM as ubuntu user:

```bash
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker deploy

# Log out and back in as deploy
exit
ssh -p 22 deploy@192.168.64.10

# Verify
docker --version
docker compose version

# Create project directory
sudo mkdir -p /opt/mockline
sudo chown deploy:deploy /opt/mockline
```

---

## 6. Clone and configure Mockline

Inside the VM as deploy:

```bash
cd /opt/mockline
git clone https://github.com/trillionclues/mockline.git .
```

Create the .env file:

```bash
nano .env
```

Use these local-specific values for Multipass testing:

```bash
# ── App ──────────────────────────────────────────────────
NODE_ENV=production
PORT=4000
CORS_ORIGIN=https://mockline.local

# ── Database ─────────────────────────────────────────────
POSTGRES_USER=mockline
POSTGRES_PASSWORD=localtest123
POSTGRES_DB=mockline_staging
DATABASE_URL=postgresql://mockline:localtest123@db:5432/mockline_staging

# ── Redis ─────────────────────────────────────────────────
REDIS_URL=redis://cache:6379

# ── BetterAuth ───────────────────────────────────────────
BETTER_AUTH_SECRET=localtestsecretxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
BETTER_AUTH_URL=https://api.mockline.local

# ── GitHub OAuth ─────────────────────────────────────────
# Use your existing staging OAuth app from GitHub
# Callback URL must match: https://api.mockline.local/api/auth/callback/github
GITHUB_CLIENT_ID=your_staging_client_id
GITHUB_CLIENT_SECRET=your_staging_client_secret

# ── Google OAuth ─────────────────────────────────────────
GOOGLE_CLIENT_ID=your_staging_google_client_id
GOOGLE_CLIENT_SECRET=your_staging_google_client_secret

# ── Internal ─────────────────────────────────────────────
INTERNAL_API_SECRET=localinternalsecret

# ── Frontend (web is on Vercel, these are for API only) ──
NEXT_PUBLIC_API_URL=https://api.mockline.local
NEXT_PUBLIC_APP_URL=https://mockline.local
NEXT_PUBLIC_MOCK_BASE_URL=https://mock.mockline.local
NEXT_PUBLIC_AUTH_URL=https://api.mockline.local

# ── Docker ───────────────────────────────────────────────
DOCKER_HOST=unix:///var/run/docker.sock
MOCK_BASE_DOMAIN=mockline.local
CONTOUR_VERSION=1.2.0

# ── Traefik — NO Cloudflare token needed locally ─────────
# CF_DNS_API_TOKEN=   ← leave blank or omit entirely

# ── Lemon Squeezy ────────────────────────────────────────
LEMONSQUEEZY_API_KEY=your_key
LEMONSQUEEZY_STORE_ID=your_store_id
LEMONSQUEEZY_WEBHOOK_SECRET=your_webhook_secret
LEMONSQUEEZY_PRO_MONTHLY_VARIANT_ID=
LEMONSQUEEZY_PRO_YEARLY_VARIANT_ID=
LEMONSQUEEZY_TEAM_MONTHLY_VARIANT_ID=
LEMONSQUEEZY_TEAM_YEARLY_VARIANT_ID=
```

---

## 7. SSL — the local difference

This is the main difference from real EC2. Let's Encrypt cannot verify
your local domain (mockline.local) because it is not publicly reachable.

### Option A — self-signed certificate (quickest)

Generate a self-signed cert inside the VM and configure Traefik to use it.
Your browser will show a "not secure" warning which you click through.
Everything else works identically.

```bash
# Inside the VM
sudo mkdir -p /opt/mockline/certs
cd /opt/mockline/certs

# Generate self-signed cert for *.mockline.local
sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout mockline.local.key \
  -out mockline.local.crt \
  -subj "/CN=*.mockline.local" \
  -addext "subjectAltName=DNS:mockline.local,DNS:*.mockline.local,DNS:api.mockline.local"

sudo chmod 600 mockline.local.key
```

Create `docker/traefik/traefik.local.yml` (new file, keep traefik.prod.yml unchanged):

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

tls:
  certificates:
    - certFile: /certs/mockline.local.crt
      keyFile: /certs/mockline.local.key

api:
  dashboard: true
  insecure: true
```

Update `docker-compose.yml` proxy service for local testing
(or create a `docker-compose.local.yml` override):

```yaml
# docker-compose.local.yml
services:
  proxy:
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
      - ./docker/traefik/traefik.local.yml:/etc/traefik/traefik.yml:ro
      - ./certs:/certs:ro   # mount self-signed certs
    ports:
      - "80:80"
      - "443:443"
      - "8080:8080"   # Traefik dashboard — useful locally
```

Start with local override:

```bash
docker compose -f docker-compose.yml -f docker-compose.local.yml up -d --build
```

### Option B — mkcert (browser trusts it, no warning)

`mkcert` creates a local CA that your browser trusts so there is no warning.
More setup but cleaner experience.

```bash
# On your Mac (not in the VM) — install mkcert
brew install mkcert
mkcert -install  # installs local CA into Mac's keychain

# Generate cert for your local domains
mkcert "mockline.local" "*.mockline.local" "api.mockline.local"
# Creates mockline.local+2.pem and mockline.local+2-key.pem
```

Copy the certs into the VM:

```bash
# From your Mac
scp -P 22 mockline.local+2.pem deploy@192.168.64.10:/opt/mockline/certs/mockline.local.crt
scp -P 22 mockline.local+2-key.pem deploy@192.168.64.10:/opt/mockline/certs/mockline.local.key
```

Then use the same `traefik.local.yml` as Option A above.
With mkcert, your browser will show the padlock with no warning.

**Recommendation: use Option B (mkcert). The 5 extra minutes are worth it.**

---

## 8. Local DNS — fake your domains

Let's Encrypt and Cloudflare are not in play locally.
You fake DNS by editing `/etc/hosts` on your Mac so that
`mockline.local` and its subdomains point to your Multipass VM IP.

### Get your VM IP

```bash
multipass list
# mockline-staging   Running  192.168.64.10
```

### Edit /etc/hosts on your Mac

```bash
sudo nano /etc/hosts
```

Add these lines at the bottom (replace with your actual VM IP):

```
# Mockline local staging
192.168.64.10  mockline.local
192.168.64.10  api.mockline.local
192.168.64.10  www.mockline.local

# Mock server subdomains — add individual ones as you test
# (wildcards don't work in /etc/hosts)
192.168.64.10  mock-test123.mockline.local
```

Save and test:

```bash
ping mockline.local
# Should reply from 192.168.64.10
```

### Wildcard DNS workaround

/etc/hosts does not support wildcards (*.mockline.local).
Each mock server gets a unique subdomain (e.g. mock-abc123.mockline.local).
For testing, add them manually as you create them.

Or use dnsmasq on your Mac to handle the wildcard:

```bash
brew install dnsmasq

# Add wildcard rule
echo "address=/.mockline.local/192.168.64.10" >> /opt/homebrew/etc/dnsmasq.conf

# Start dnsmasq
sudo brew services start dnsmasq

# Tell Mac to use dnsmasq for .local domains
sudo mkdir -p /etc/resolver
echo "nameserver 127.0.0.1" | sudo tee /etc/resolver/mockline.local
```

Now any subdomain of .mockline.local resolves to your VM IP automatically.
This is the closest you get to the wildcard A record in Cloudflare.

---

## 9. Deploy and test

### Start the full stack

Inside the VM as deploy:

```bash
cd /opt/mockline

# Using local override (self-signed SSL + local traefik config)
docker compose -f docker-compose.yml -f docker-compose.local.yml up -d --build

# Check status
docker compose ps

# Watch logs
docker compose logs -f
```

### Run migrations and BetterAuth setup (first time only)

```bash
# Wait for containers to be healthy, then:
docker compose exec api pnpm dlx @better-auth/cli migrate \
  --config apps/api/src/lib/auth.ts

# Verify health
curl -k https://api.mockline.local/health
# -k skips SSL verification for self-signed certs
```

### Access the local stack from your Mac

```
https://mockline.local             → your frontend (or test API directly)
https://api.mockline.local         → Hono API
https://api.mockline.local/health  → health check
http://192.168.64.10:8080          → Traefik dashboard (local only)
```

If using Vercel for your frontend, your web app on Vercel still points to
`https://api.mockline.xyz` (real EC2). For local API testing, either:
- Hit `https://api.mockline.local` directly with curl or Postman
- Or temporarily set `NEXT_PUBLIC_API_URL=https://api.mockline.local`
  in a local `.env.local` for `apps/web`

### Test mock server provisioning locally

From your dashboard or via curl, provision a new mock.
The container will spin up and get a URL like:
`http://localhost:PORT` (since MOCK_BASE_DOMAIN=mockline.local but
Traefik routing requires DNS — use the port directly for local testing)

Or set MOCK_BASE_DOMAIN to the VM IP for direct port access during testing.

---

## 10. Differences to account for in production

These are things that work differently locally vs real EC2.
Know these so you are not surprised when you deploy.

### 1. Wildcard SSL

Locally: self-signed cert covers *.mockline.local
Real EC2: Traefik requests wildcard cert from Let's Encrypt via Cloudflare DNS challenge
The cert files (acme.json) must exist with chmod 600 before Traefik starts.
This is already covered in your DEPLOYMENT-FLOW.md.

### 2. Mock server URLs

Locally: mock containers accessible via port on VM IP
  (e.g. http://192.168.64.10:3100)
Real EC2: Traefik routes mock-abc123.mockline.xyz → container via Docker labels
The Traefik labels in startMockContainer() are correct for production already.
Locally you access by port, in production by subdomain.

### 3. GitHub/Google OAuth callback URLs

Your OAuth apps have specific callback URLs:
  https://api.mockline.xyz/api/auth/callback/github
  https://api.mockline.xyz/api/auth/callback/google

For local Multipass testing, you need to add these to your OAuth apps too:
  https://api.mockline.local/api/auth/callback/github
  https://api.mockline.local/api/auth/callback/google

GitHub: Settings → Developer settings → OAuth Apps → your app → Edit
Google: Cloud Console → APIs & Services → Credentials → edit your client

### 4. Lemon Squeezy webhooks

Lemon Squeezy cannot reach your local VM for webhook delivery.
Use ngrok tunneling to your local API port:

```bash
# On your Mac, tunnel to the VM's API port
# First, expose VM port to your Mac:
# (Multipass VMs are directly reachable from your Mac via their IP)
ssh -p 22 -L 4000:localhost:4000 deploy@192.168.64.10

# Then in another terminal, ngrok that port
npx ngrok http 4000
# Use the ngrok URL in Lemon Squeezy webhook settings for local testing
```

### 5. VM IP changes on restart

Multipass VM IPs can change when you restart them.
If your IP changes:
1. Update /etc/hosts on your Mac
2. Update dnsmasq config if using it

To get a stable IP, you can try assigning a fixed IP but this requires
Multipass bridge networking (more complex). For most testing, just
update /etc/hosts when needed — it takes 30 seconds.

---

## 11. Multipass daily commands

```bash
# List all VMs and their IPs
multipass list

# Start a stopped VM
multipass start mockline-staging

# Stop a VM (preserves all data)
multipass stop mockline-staging

# Shell into VM
multipass shell mockline-staging

# SSH from terminal (after hardening to port 22)
ssh -p 22 deploy@192.168.64.10

# Copy files from Mac to VM
multipass transfer ./file.txt mockline-staging:/tmp/file.txt

# Or via scp
scp -P 22 ./file.txt deploy@192.168.64.10:/tmp/

# View VM info (IP, resources, state)
multipass info mockline-staging

# Pause VM (saves RAM, restores faster than stop/start)
multipass suspend mockline-staging
multipass start mockline-staging  # resumes from snapshot
```

---

## 12. Cleanup

```bash
# Stop VMs (keeps them for later)
multipass stop mockline-staging mockline-prod

# Delete a VM permanently
multipass delete mockline-staging
multipass purge   # frees disk space from deleted VMs

# Remove /etc/hosts entries when done
sudo nano /etc/hosts
# Delete the mockline.local lines

# Remove dnsmasq config (if you set it up)
sudo brew services stop dnsmasq
sudo rm /etc/resolver/mockline.local
```

---

## Quick start summary (from zero to running stack)

```bash
# 1. Install Multipass
brew install multipass

# 2. Create staging VM
multipass launch 24.04 --name mockline-staging --cpus 1 --memory 1G --disk 10G

# 3. Get its IP
multipass list

# 4. Shell in and harden
multipass shell mockline-staging
# ... run hardening commands from Section 4 ...

# 5. Install Docker and create deploy user
# ... Section 5 commands ...

# 6. On your Mac — install mkcert and generate certs
brew install mkcert && mkcert -install
mkcert "mockline.local" "*.mockline.local" "api.mockline.local"

# 7. On your Mac — set up DNS
sudo nano /etc/hosts
# Add: 192.168.64.10  mockline.local api.mockline.local www.mockline.local

# 8. Inside VM — clone repo, create .env, copy certs
ssh -p 22 deploy@192.168.64.10
cd /opt/mockline
git clone https://github.com/trillionclues/mockline.git .
nano .env   # paste local values from Section 6
# ... copy certs from Section 7 Option B ...

# 9. Start stack
docker compose -f docker-compose.yml -f docker-compose.local.yml up -d --build

# 10. Test
curl -k https://api.mockline.local/health
```

Total setup time: approximately 20-30 minutes first time.
Subsequent sessions: `multipass start mockline-staging` → ready in under 60 seconds.