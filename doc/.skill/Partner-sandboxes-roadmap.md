# Mockline v2 — Partner Sandbox Roadmap

## The Strategic Shift

Reposition Mockline from **dev tool** (cost center, cuttable) to **sales enablement** (revenue enabler, sticky).

The buyer changes from:
- Engineering Manager / Developer → **Sales Engineer / Partnerships Lead**

These people have their own budget, their own tools (Gong, Outreach, Consensus), and a problem nobody solves well.

---

## The Problem to Sell Against

"Instead of sharing your postman collection, why not hand them the keys to a custom server?"

What actually happens in enterprise API sales:

1. Sales wants to demo to 10 prospects simultaneously
2. Each prospect's dev team wants to poke the API before committing
3. Backend gives Sales a shared staging environment that breaks constantly
4. Deal velocity slows because prospect integration is blocked on fragile infra

Current "solutions" teams use:
- Postman collections shared via email (no live URL, breaks on schema changes)
- Shared staging environment (unreliable, one team's test data pollutes another's)
- Dedicated UAT environment per prospect (infra cost, weeks to provision)

**The discovery question to ask SEs:**
> "How are you currently giving prospects a live API to integrate against before the deal closes, and what does it cost you in lost or delayed deals?"

If answer is "Postman collections and hope" → clear problem, no entrenched solution.
If answer is "dedicated UAT per prospect managed by infra team" → you're fighting budget and process.

### Competitive Blindspot:
Postman already has "Mock Servers" with team sharing. What they don't have is:

> Isolated containers per prospect (they use shared infra)
> Custom domains (huge trust gap)
> Usage analytics showing prospect engagement depth

Lean into those three differentiators in your messaging.

---

## MVP Scope (80% already built)

**Core feature:** "Provision a prospect sandbox from a spec, get a shareable URL, set an expiry."

### What needs to be added

**1. Expiry dates on containers**
Not auto-stop (idle timeout) — deliberate expiry. "This sandbox is live for 14 days."
- Add `expiresAt: DateTime?` to `MockServer` schema
- Extend auto-stop scheduler to check `expiresAt` and stop+remove when elapsed
- UI: date picker or preset (7 days / 14 days / 30 days) at provision time
- Show countdown on dashboard: "Expires in 9 days"

**2. Sandbox share page**
When a prospect hits `abc123.mockline.xyz`, instead of raw API responses, show:
(instead of {"error":"Not Found","message":"The requested endpoint does not exist in the mock spec"} on the base path)

- A simple landing page: API name, description, available endpoints list
- "Start integrating" section with base URL + example curl commands
- Powered by Mockline branding (trust signal for the prospect, distribution for Mockline)

**3. Usage analytics per sandbox**
- Log each request: endpoint hit, timestamp, response status (This could be inside the mockserver dynamic id page)
- Aggregate per sandbox: total hits, unique endpoints hit, last active
- Send weekly digest to the SE who provisioned it:
  > "Your Acme Corp sandbox was hit 47 times this week. They've tested /transactions and /webhooks."
- This is pipeline intelligence. Gets Mockline into the CRM conversation.

---

## Custom Domains (Enterprise Trust Signal)

`partner.yourcompany.com` masking `abc123.mockline.xyz`

**Implementation:**
- Customer adds a CNAME record: `partner.yourcompany.com → abc123.mockline.xyz`
- Mockline provisions a cert for `partner.yourcompany.com` via Traefik DNS challenge
- Traefik routes based on custom domain header

**Complexity:** Medium. Traefik already handles wildcard certs via Cloudflare DNS challenge. Per-domain cert provisioning is an extension of that — each custom domain needs its own ACME entry. Not a rebuild but needs careful cert lifecycle management.

Customer adds CNAME to their DNS
You generate cert via Let's Encrypt DNS challenge
You store that cert securely (HashiCorp Vault or similar)
You rotate certs every 90 days

**Gate behind:** Team tier or a new Enterprise tier. Enterprise would work well for this, we could replace it with TEAM tier

---

## Positioning to Test

> "Turn your OpenAPI spec into a prospect sandbox in 60 seconds. Track which prospects are actually integrating."

This is a **sales velocity story**, not a testing story.
Sales velocity has budget authority at any company size.

### Messaging by audience

**For Sales Engineers:**
"Stop losing deals because your staging environment is down. Give every prospect their own sandbox in 60 seconds."

**For Partnerships / BD:**
"Know exactly which integration partners are actively building before your QBR."

**For Engineering leadership:**
"Stop being the bottleneck for Sales. One spec upload, Sales handles the rest."

---

## Tier Placement (This might mean updating the PricingCard, Changelog and roadmap)

| Feature | FREE | PRO | TEAM |
|---|---|---|---|
| Expiry dates | — | ✓ (up to 14 days) | ✓ (up to 90 days) |
| Share page | — | ✓ | ✓ |
| Usage analytics | — | Basic (total hits) | Full (per endpoint, weekly digest) |
| Custom domains | — | — | ✓ |
| Sandbox seats | 0 | 3 | Unlimited |

---

## Before Building Anything

Talk to 3 Sales Engineers at mid-size SaaS companies (API-first companies: fintech, payments, communications).

Ask:
1. "What's your current budget for sales engineering tools?"
2. "How much did you spend on demo environment AWS costs last quarter?"
3. "What would it mean for your pipeline if you could provision an isolated sandbox per prospect in under a minute?"
4. "Would you allow a vendor to sit between your prospects and your API?" (Security/compliance concern)"

Do not ask "would you use this" — ask about cost of current pain.

Target companies to reach: API-first SaaS where the SE team is distinct from engineering (Paystack, Flutterwave, Mono, Stitch, any fintech with a developer API product).

---

## Why This Is Sticky

If 3 external companies build integrations against `partner-api.mockline.xyz`, you physically cannot turn it off without breaking their production systems.

1 enterprise customer provisions 20 partner sandboxes → 20 external teams see Mockline branding → inbound distribution.

Justifies high price: "Enable your sales team to demo to prospects without backend dependencies" = $500/mo vs $49/mo for internal devs.

---
## Critical Gaps to Address
1. The "Data Poisoning" Problem
Prospects testing POST/PUT/DELETE, but don't specify data isolation between prospects. If Salesforce provisions prospect-a.mockline.xyz and prospect-b.mockline.xyz from the same spec, do they share stateful data?
Fix: Make stateful mode per-sandbox isolated by default. If Prospect A creates a user with POST /users, Prospect B shouldn't see it. This requires your Phase 4 --stateful flag + unique Docker volumes per sandbox(I guess this is in place already).

2. Authentication Gap
Your doc mentions --require-auth, but partner sandboxes need granular auth, not just "Bearer token required."
Scenario: Stripe gives a sandbox to Uber. Uber shouldn't see Stripe's internal admin endpoints. You need endpoint-level whitelisting per sandbox: "This sandbox only exposes /payments and /webhooks, not /admin/refunds."

---

## Implementation Order

1. Custom domains ← gate behind customer discovery validation first
2. `expiresAt` field on MockServer + scheduler support ← lowest effort, highest signal
3. Usage logging middleware on mock containers ← needed before analytics
4. Sandbox share page ← trust signal, also improves demo quality
5. Weekly analytics digest email ← the hook that keeps SEs engaged
6. Partner Portal UI ← last, only after 1-2 paying customers confirm the use case


We are looking to build Mockline into "the only API sandbox that proves prospect engagement through usage analytics."