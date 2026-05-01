# How I Engineered a Developer Infrastructure Platform from Scratch in 3 Weeks

I built and operate a developer tool used by engineering teams.

---

Have you ever been blocked by a backend API that isn't ready yet? It's a classic bottleneck in software development. Frontend and mobile developers wait weeks for endpoints to be provisioned, stunting velocity and killing momentum.

I decided to solve this. Over the past few weeks, I built Mockline — a platform that takes any OpenAPI specification and instantly spins up a live, stateful mock server to query against.

Building it was a brutal, incredible crash course in infrastructure, networking, and software architecture. From dynamically orchestrating Docker containers via Node.js to provisioning wildcard SSL certificates via Let's Encrypt, here is exactly how I built Mockline, the technical decisions I made, and the massive hurdles I faced along the way.

---

## The Stack: Choosing the Right Tools

When architecting Mockline, I knew the system would be split into two very distinct operational profiles: a static, globally available frontend dashboard, and a heavy, container-spawning backend.

**The Frontend:** I chose Next.js deployed on Vercel. Vercel's global CDN meant the dashboard would be lightning-fast anywhere in the world, and I didn't have to think about it again.

**The Backend API:** Because the API needed direct access to the Docker socket to spawn user containers, serverless was completely out of the question. Docker orchestration is long-running and stateful — Next.js serverless functions have execution time limits and no socket access. I chose Hono.js (built for the Edge but incredibly fast on Node) running on a self-hosted VPS.

**The Engine:** To actually power the mock endpoints, I used Contour — a CLI tool I built separately that shapes API mocks from OpenAPI specs. Each mock server is just a Docker container running `contour start spec.yaml`. Mockline is the orchestration layer on top of it.

**The Database:** PostgreSQL managed by Prisma ORM, alongside Redis for caching and rate-limiting.

To manage all of this without worrying about which package was calling which, I used PNPM workspaces with Turborepo. The monorepo structure decoupled the frontend (`apps/web`), the backend (`apps/api`), the database connection logic (`packages/db`), and the container orchestration layer (`packages/docker-manager`). Everything is typed end-to-end — no guessing what shape data is in when it crosses a package boundary.

---

## The Architecture: Embracing the Repository Pattern

In the early days of working on Mockline, API route handlers would bleed into database queries and business logic (skill issue lmao). Thanks to Bright for the review here and there.

Integrating Lemon Squeezy for subscription billing — Free, Pro, and Team tiers — made things complicated fast. Webhook handlers were getting messy, and I had to enforce separation of concerns properly. I implemented the Repository Pattern across the entire API layer:

- **Controllers (Routes):** Parse the incoming request and verify signatures.
- **Services (`webhook-handler.ts`, `downgrade.ts`):** Contain the pure business logic.
- **Repositories (`subscription.repository.ts`, `mock.repository.ts`):** Handle all Prisma database transactions.

This meant when a Lemon Squeezy webhook fires, the handler doesn't need an HTTP request object to downgrade a user — it just calls the repository methods directly. Clean separation, easy to test, easy to reason about.

Handling subscription expirations also surfaced a crucial tradeoff: **Server Time vs. Database Time**. Relying on user time zones or client-side clocks for expiration thresholds is a recipe for disaster. I made the strict decision to drive all expiration logic exclusively using standardized UTC timestamps at the database level. If a subscription downgrades, the database enforces the boundary. No timezone drift, no edge cases.

---

## First Time with Dockerode: Orchestrating Containers via API

Mockline's core feature is taking a user's uploaded OpenAPI spec and instantly serving it as a live mock. Doing this required interacting with Docker programmatically — something I had never done before.

Using the Dockerode SDK, I built a system that generates an inline Dockerfile on the fly. When a user clicks "Create Mock", the API:

1. Takes the user's OpenAPI spec content
2. Pulls a base Alpine Node image pre-loaded with the Contour CLI (built once at API startup — more on this below)
3. Dynamically builds a new image `mockline-mock-<specId>` via a tarball stream
4. Uses `docker.createContainer()` to spin it up, applying strict CPU and memory limits to prevent a single complex mock from crashing the entire server

The base image strategy was a key optimization. On API startup, a background task builds `mockline/contour-base:1.3.0` — a single image containing Node 22 Alpine and the global Contour CLI installation. When a user provisions a mock, the build step just does `FROM mockline/contour-base` and copies in their spec. Result: provisioning takes around 4 seconds instead of 2 minutes, and each new user container only costs ~1KB of disk space thanks to Docker layer caching.

**The tradeoff I considered:** Building images dynamically takes CPU cycles. I could have mounted specs as volumes to a single monolithic server, but isolating each user's mock into its own dedicated, resource-limited container guaranteed zero cross-contamination and isolated crash domains. One user's broken spec can't take down another user's mock.

Resource limits are non-negotiable on every container:

```
Memory:     128MB hard limit
CPU:        10% of one core
PIDs:       50 max (prevents fork bombs)
CapDrop:    ALL (container runs without Linux root capabilities)
```

---

## Traefik for Wildcard SSL & Dynamic Routing

If a user provisions a mock, they need a URL to hit. I couldn't manually configure Nginx every time a new mock was created. I stumbled on Traefik for this specific use case.

Traefik is a modern reverse proxy that integrates natively with Docker. By simply attaching labels to the containers I spawned via Dockerode — like `traefik.http.routers.mock-xyz.rule=Host('stripe-api-a7b2.mockline.xyz')` — Traefik instantly discovers the container and routes traffic to it. No config file changes, no restarts, no manual intervention.

To secure these generated endpoints, I integrated Let's Encrypt. But traditional HTTP challenges don't work cleanly for massive amounts of dynamically generated subdomains. Instead, I configured a **Cloudflare DNS Challenge**.

By providing Traefik with a Cloudflare API token, Let's Encrypt verifies domain ownership at the DNS level and provisions a `*.mockline.xyz` wildcard certificate. Every new container gets instant, valid HTTPS without a single rate-limit bottleneck. The wildcard cert is issued once and reused for every `mock-*.mockline.xyz` subdomain that gets provisioned.

---

## The Alpine Linux Bug

There was one bug that nearly sent me crazy lolz.

Mock containers would spin up, Contour would log `Server running on 0.0.0.0:3001`, but Traefik would aggressively drop the container and return a 404.

After hours of debugging, I looked at the output of `docker ps` and saw the container was marked as `(unhealthy)`.

I had baked a Docker `HEALTHCHECK` into the container:

```dockerfile
HEALTHCHECK --interval=5s --timeout=3s --retries=5 \
  CMD wget -qO- http://localhost:3001/_contour/health || exit 1
```

Here was the trap: in newer versions of Alpine Linux, `wget localhost` prioritizes the IPv6 loopback (`::1`). But Node.js had bound to the IPv4 interface (`0.0.0.0`). Because `wget` failed to connect internally, Docker marked the perfectly functional container as "unhealthy" — causing Traefik to sever the routing connection instantly.

The fix? Removing the rigid healthcheck entirely and relying purely on Docker's `running` state, allowing Traefik to natively proxy the traffic. The container was healthy the whole time. Docker just didn't know it.

---

## Deploying to a VPS

Getting everything working locally with `docker-compose` is one thing. Putting it on the internet is another.

Deploying to a bare VPS taught me everything — bare metal Linux, network security, server hardening by completely disabling root and password logins, and enforcing `.pem` SSH keys. The architecture ended up clean:

```
mockline.xyz        → Vercel CDN → Next.js app
api.mockline.xyz    → Cloudflare DNS → VPS → Traefik → Hono API
*.mockline.xyz      → Cloudflare DNS → VPS → Traefik → mock container
```

The frontend stays live on Vercel regardless of what's happening on the VPS. Anyone visiting the domain sees a real product even during backend downtime.

Now the real issue: my GitHub Actions CI/CD pipeline constantly failed with an `i/o timeout` error. My server's security group had port 22 (SSH) set to "My IP Only". Because GitHub Actions runs on thousands of dynamic IP addresses across the globe, the firewall was silently dropping GitHub's connection packets.

Opening port 22 to `0.0.0.0/0` (safeguarded by the `.pem` key requirement) would instantly fix this — but I'm not sure that's a tradeoff I'm making yet.

---

## The Auto-Stop Scheduler

Containers can't run forever. A cron-like scheduler runs in the background of the Node process, scanning for running mock servers and comparing `lastAccessedAt` against each tier's idle threshold:

- **Free:** 1 hour
- **Pro:** 24 hours
- **Team:** 1 week

When a container crosses the threshold, the scheduler stops it via `docker-manager` to free up RAM. The user can restart it anytime — same image, same URL, same config. If they're on stateful mode, their data persists in a named Docker volume that gets re-mounted on the next start.

This keeps the infrastructure lean without punishing users who just haven't checked in recently.

---

## What I Took Away

Building Mockline pushed me entirely out of my comfort zone. I started with simple API routes and ended up orchestrating automated Cloudflare DNS challenges, managing dynamic Docker networks, debugging raw Linux networking protocols, and building a highly scalable, isolated infrastructure platform.

If there's one thing I took away from this project: **don't abstract away the infrastructure too early.** Getting your hands dirty with raw Docker, VPS provisioning, and Traefik teaches you exactly how the cloud actually works under the hood. Every managed service you use is just someone else's version of what I built here.

Mockline is live, open source, and the codebase is stronger than ever. If you're tired of waiting on backend developers, you know where to go.

Get started for free at [mockline.xyz](https://mockline.xyz).
