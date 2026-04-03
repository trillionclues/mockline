# Mockline v2 — Partner Sandbox Roadmap
The Problem
Enterprise API sales teams currently use: Postman collections (no live URL), shared staging envs (breaks, data pollution), or dedicated UAT per prospect (weeks + infra cost).

## The Strategic Shift

Repositioning from dev tool (cost center) → sales enablement (revenue enabler). The buyer persona is shifting from Engineering Manager → Sales Engineer / Partnerships Lead.

### Differentiators vs Postman Mock Servers
1. Isolated containers per prospect (Postman uses shared infra)
2. Custom domains (`partner.yourcompany.com`) — trust signal
3. Usage analytics showing prospect engagement depth

The buyer changes from:
- Engineering Manager / Developer → **Sales Engineer / Partnerships Lead**

Core value prop to test: "Turn your OpenAPI spec into a prospect sandbox in 60 seconds. Track which prospects are actually integrating."

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
| Expiry dates | — | ✓ up to 14 days | ✓ up to 90 days |
| Share page | — | ✓ | ✓ |
| Usage analytics | — | Basic (total hits) | Full (per endpoint + weekly digest) |
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

### Implementation Order
 
1. `expiresAt` field on `MockServer` + scheduler — lowest effort, highest signal
2. Usage logging middleware on mock containers — prerequisite for analytics
3. Sandbox share page — trust signal, improves demo quality
4. Weekly analytics digest email — the hook that keeps SEs engaged
5. Custom domains — gate behind customer discovery validation first
6. Partner Portal UI — only after 1–2 paying customers confirm use case


### Schema Changes Needed
 
**`expiresAt` on MockServer:**
```prisma
model MockServer {
  // ...existing fields
  expiresAt DateTime? // deliberate expiry — distinct from idleTimeout auto-stop
}
```
Extend the existing auto-stop scheduler to also check `expiresAt` and stop+remove when elapsed. UI: date picker or presets (7 / 14 / 30 days) at provision time. Dashboard countdown: "Expires in 9 days."
 
### Critical Gaps
 
**Data poisoning** — likely already solved since each sandbox is its own Docker container with per-container in-memory state for `--stateful`. Verify that the `--stateful` flag does NOT use a shared Redis keyspace across containers. If confirmed isolated → cross this off.

We are looking to build Mockline into "the only API sandbox that proves prospect engagement through usage analytics."




---
 
## 5. Server-side Drafts — Implementation Guide
 
Persists spec designer drafts to DB for cross-device access. Replaces the existing localStorage-only auto-save.
 
### 5.1 Prisma Schema
 
```prisma
model SpecDraft {
  id        String   @id @default(cuid())
  userId    String
  specId    String?  // null = new unsaved draft; set once linked to a Spec
  title     String?
  content   String   // JSON.stringify'd OpenAPI spec object
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
 
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  spec Spec? @relation(fields: [specId], references: [id], onDelete: SetNull)
 
  @@unique([userId, specId]) // one draft per spec per user — enables clean upsert
  @@index([userId])
}
```
 
**Edge case:** Prisma treats `null` as non-matching in unique constraints. Multiple `null`-specId drafts can coexist — so for new specs (no specId yet), always persist the returned `draftId` in localStorage to hit the same row on subsequent saves.
 
### 5.2 Hono Routes (`/api/drafts`)
 
```typescript
// GET /api/drafts — list drafts (title + updatedAt only, no content)
drafts.get('/', async (c) => {
  const user = c.get('user')
  const drafts = await db.specDraft.findMany({
    where: { userId: user.id },
    select: { id: true, title: true, specId: true, updatedAt: true },
    orderBy: { updatedAt: 'desc' },
  })
  return c.json(drafts)
})
 
// GET /api/drafts/:id
drafts.get('/:id', async (c) => {
  const user = c.get('user')
  const draft = await db.specDraft.findFirst({
    where: { id: c.req.param('id'), userId: user.id },
  })
  if (!draft) return c.json({ error: 'Not found' }, 404)
  return c.json(draft)
})
 
// PUT /api/drafts/upsert — main auto-save endpoint
drafts.put('/upsert', zValidator('json', upsertDraftSchema), async (c) => {
  const user = c.get('user')
  const { specId, title, content } = c.req.valid('json')
 
  const draft = await db.specDraft.upsert({
    where: { userId_specId: { userId: user.id, specId: specId ?? '' } },
    update: { title, content, updatedAt: new Date() },
    create: { userId: user.id, specId, title, content },
  })
  return c.json(draft)
})
 
// DELETE /api/drafts/:id — call after successful publish to avoid orphaned rows
drafts.delete('/:id', async (c) => {
  const user = c.get('user')
  await db.specDraft.deleteMany({
    where: { id: c.req.param('id'), userId: user.id },
  })
  return c.json({ ok: true })
})
```
 
### 5.3 Frontend Hook (`hooks/use-draft-sync.ts`)
 
```typescript
const DEBOUNCE_MS = 1500
 
export function useDraftSync(specId: string | null) {
  const [draftId, setDraftId] = useState<string | null>(
    () => localStorage.getItem(`draft_id_${specId ?? 'new'}`)
  )
  const [syncState, setSyncState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
 
  const save = useDebouncedCallback(async (title: string, content: object) => {
    setSyncState('saving')
    try {
      const res = await fetch('/api/drafts/upsert', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ specId, title, content: JSON.stringify(content) }),
      })
      const draft = await res.json()
      if (!draftId) {
        setDraftId(draft.id)
        localStorage.setItem(`draft_id_${specId ?? 'new'}`, draft.id)
      }
      setSyncState('saved')
    } catch {
      setSyncState('error')
    }
  }, DEBOUNCE_MS)
 
  const loadDraft = useCallback(async () => {
    if (!draftId) return null
    const res = await fetch(`/api/drafts/${draftId}`)
    if (!res.ok) return null
    return res.json()
  }, [draftId])
 
  // Call after successful publish — clears DB row + localStorage key
  const clearDraft = useCallback(async () => {
    if (!draftId) return
    await fetch(`/api/drafts/${draftId}`, { method: 'DELETE' })
    localStorage.removeItem(`draft_id_${specId ?? 'new'}`)
    setDraftId(null)
  }, [draftId, specId])
 
  return { save, syncState, loadDraft, clearDraft }
}
```
 
### 5.4 Spec Designer Integration
 
```typescript
const { save, syncState, loadDraft, clearDraft } = useDraftSync(specId)
 
// Hydrate from DB on mount
useEffect(() => {
  loadDraft().then((draft) => {
    if (draft) {
      setTitle(draft.title ?? '')
      setSpec(JSON.parse(draft.content))
    }
  })
}, [])
 
// Debounced auto-save on any change
useEffect(() => {
  save(title, spec)
}, [title, spec])
 
// Status indicator in toolbar
<span className="text-xs text-muted-foreground">
  {syncState === 'saving' && 'Saving...'}
  {syncState === 'saved' && 'Draft saved'}
  {syncState === 'error' && 'Save failed'}
</span>
 
// On publish success:
await publishSpec(...)
await clearDraft()
```
 
---