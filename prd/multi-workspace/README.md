---
name: Multi-Workspace (Multiple Orgs Under One Account)
overview: Allow a single customer account to operate multiple organizations ("workspaces") under one subscription. The customer pays in their primary workspace; secondary workspaces inherit the subscription, share pooled quotas (learners, AI tokens), and don't bill separately. Surfaces as a paid tier feature — Growth includes 2 workspaces, Business 3, Enterprise unlimited; extras as a paid add-on. Wedge story: "one account, multiple academies" — customer-facing + internal + partners under one bill.
todos:
  - id: schema-decision
    content: Decide between Option A (parentOrganizationId on organization) and Option B (separate account table). Recommendation: Option A for v1.
    status: pending
  - id: data-model
    content: Add parentOrganizationId column to organization table; backfill existing orgs to NULL (primary)
    status: pending
  - id: billing-routing
    content: Refactor Stripe subscription handling so the primary workspace holds the subscription and webhook events propagate state to all linked workspaces
    status: pending
  - id: pooled-quotas
    content: Move learner-count and AI-token quota enforcement from per-org to per-account (sum across linked workspaces)
    status: pending
  - id: account-endpoints
    content: Build POST/GET/DELETE /account/workspaces and GET /account/usage endpoints
    status: pending
  - id: account-settings-ui
    content: Build account settings page accessible from primary workspace — list workspaces, per-workspace usage, "Create workspace" CTA
    status: pending
  - id: workspace-switcher
    content: Update existing org switcher to clearly distinguish "workspaces in my account" vs "orgs I'm invited to"
    status: pending
  - id: secondary-billing-ui
    content: Hide or alias billing UI in secondary workspaces — show "Billing managed by [primary workspace name]"
    status: pending
  - id: downgrade-grace
    content: Implement 7-day read-only grace period when a customer downgrades below their current workspace count
    status: pending
  - id: free-tier-cap
    content: Enforce 1-workspace cap on Free tier to prevent abuse
    status: pending
  - id: pricing-page-update
    content: Update marketing pricing page to surface "Workspaces included" row and add-on pricing
    status: pending
  - id: homepage-section
    content: Add "One account, multiple academies" section to apps/website homepage (after feature ships)
    status: pending
isProject: true
---

# Multi-Workspace PRD

## Status

- Draft (2026-05-15)
- Owner: TBD

## Problem

Today, every ClassroomIO organization is its own billing entity. A customer who wants:
- A customer-facing academy on `learn.acme.com`, AND
- An internal employee training portal on `team.acme.com`

…must create two separate orgs with two separate paid subscriptions. This:
1. Doubles the cost for no clear product reason
2. Creates billing friction (two invoices, two payment methods)
3. Discourages expansion
4. Misses the wedge story — "one account, multiple academies"

## Goals

1. Let a customer create multiple workspaces (full orgs) under a single subscription
2. Enable centralized billing — one Stripe customer, one invoice
3. Share quotas (learners, AI tokens) across linked workspaces
4. Surface this as a paid tier feature: Growth includes 2 workspaces, Business 3, Enterprise unlimited; extras as paid add-on
5. Keep each workspace fully independent operationally (own brand, domain, members, courses, certificates)

## Non-goals (v1)

- Cross-workspace data sharing (a learner enrolling in courses across both workspaces with a single identity)
- Cross-workspace analytics roll-ups
- Reparenting a workspace to a different primary mid-subscription (manual support op for v1)
- Self-serve "split off" of a secondary workspace into its own subscription (manual for v1)
- Per-workspace seat limits separate from pooled quota

## Users & jobs

| Persona | Job |
|---|---|
| **Account owner** (founder / VP CX) | "I want a second academy for our internal team without paying for a second plan." |
| **Workspace admin** (delegated owner of a secondary workspace) | "I want to manage my workspace fully — branding, courses, members — without seeing billing." |
| **Learner** | No change. Sees only their workspace. |

## Key concepts

- **Account** — the billing entity. Tied to one Stripe customer. Owns 1+ workspaces.
- **Workspace** — a full `organization` row (custom domain, branding, members, courses). Each workspace has exactly one parent account.
- **Primary workspace** — holds the subscription. The first org a user creates becomes their primary by default.
- **Secondary workspace** — any workspace beyond the primary in the same account. Inherits subscription state.

## User stories

### Onboarding
- As an existing paid customer on Growth, I can create a second workspace from a "Workspaces" tab in account settings without entering payment info again.
- The new workspace counts against my plan's workspace allowance (Growth = 2 included).
- If I exceed the allowance, I'm prompted to add a paid workspace add-on or upgrade tier.

### Day-to-day
- I can switch between workspaces via the org switcher.
- I can see pooled usage (X / 1,000 learners, Y / 10M AI tokens) and a per-workspace breakdown.
- A workspace admin (not the account owner) sees their workspace normally; billing UI is hidden or shows "Managed by [primary workspace name]".

### Billing
- The Stripe subscription lives on the primary workspace.
- One invoice lists: base plan + workspace add-ons + overages.
- If the primary workspace cancels or fails payment, **all** linked workspaces are affected (downgrade to free or readonly per existing policy).

### Downgrade / overage handling
- If a customer downgrades from Growth (2 included) to Starter (1 included) while having 2 workspaces:
  - All workspaces remain readable but lock to read-only until the customer either deletes a workspace or upgrades back.
  - 7-day grace period to resolve.
- If a customer exceeds pooled learner quota, existing per-tier overage policy applies.

### Edge: primary owner leaves the company
- Support can manually transfer subscription ownership to another admin in the primary workspace. Self-serve in v2.

## Functional requirements

### Data model (proposed)

**Option A — direct parent pointer (recommended for v1):**
```
organization.parentOrganizationId → organization.id (nullable)
```
- Primary = `parentOrganizationId IS NULL`
- All workspaces with same parent (or themselves as parent) belong to one account
- ✅ Minimal migration
- ⚠️ Reparenting requires updating all children

**Option B — explicit account table (cleaner long-term):**
```
account (id, stripe_customer_id, plan_id, created_at)
organization.account_id → account.id
```
- ✅ Cleaner billing semantics; future-proof for transfers
- ⚠️ Migration: every existing org needs an account row

**Recommendation: Option A for v1.** Migrate to Option B in v2 if data-model strain shows up.

### Subscription / billing
- One Stripe subscription per account, on the primary workspace.
- Subscription line items:
  - 1× base plan
  - N× workspace add-on (N = total workspaces − tier's included count, ≥ 0)
  - Overage line items
- Webhook handlers must propagate subscription state to all linked workspaces.

### Quota enforcement
- Learner count = SUM of active learners across all workspaces in account.
- AI token usage = SUM of tokens consumed across all workspaces in account.
- Quotas checked at the **account** level on every usage event.
- Per-workspace usage tracked for visibility, not enforced separately.

### Routes & API surface

**New endpoints:**
- `POST /account/workspaces` — create a secondary workspace (account-level auth required)
- `GET /account/workspaces` — list all workspaces in account with per-workspace usage
- `DELETE /account/workspaces/:id` — delete a secondary workspace (cannot delete primary while account exists)
- `POST /account/workspaces/:id/transfer-primary` — promote secondary to primary (v2)
- `GET /account/usage` — pooled usage breakdown

**Existing endpoints affected:**
- All `organization/*` endpoints already scope to the active workspace — no change
- Billing/subscription endpoints operate on the account/primary workspace

### Dashboard UI

1. **Workspace switcher** — existing; needs to scope to "workspaces in my account" plus invited-as-member orgs
2. **Account settings page** (new) — accessible from primary workspace only:
   - List of workspaces with status, learner count, AI usage
   - "Create workspace" button (tier-aware: "1 of 2 included" / "Add another for $79/mo")
   - Billing tab moved here from per-workspace settings (or aliased)
3. **Per-workspace settings** — billing UI hidden on secondary workspaces; shows "Billing managed by [primary workspace name]"
4. **Pooled usage banner** — in account settings: "1,247 of 5,000 active learners across 3 workspaces"

## Pricing logic

| Tier | Workspaces included | Extra workspace |
|---|---|---|
| Free | 1 | – (must upgrade) |
| Starter $49 | 1 | – (must upgrade) |
| Growth $149 | 2 | +$79/mo each |
| Business $399 | 3 | +$149/mo each |
| Enterprise | Unlimited | included |

- Extras prorate normally.
- Annual subscriptions: workspace add-ons priced at 10× monthly (2 months free), matching plan annual logic.

## Success metrics

- **Activation:** % of paid customers who create a 2nd workspace within 90 days. Target: 20% by month 6, 30% by month 12.
- **Expansion ARR lift:** `workspace_addon_mrr / base_plan_mrr`. Target: 10%+ blended lift.
- **Retention:** Net retention on customers with 2+ workspaces vs 1. Hypothesis: 2+ workspace customers churn ~50% less.
- **Support tickets:** No more than 1 ticket per 10 workspace creations in v1.

## Rollout plan

### v1 (4 weeks)
- Schema: add `parentOrganizationId` to `organization`
- Backend: secondary workspace endpoints, pooled quota enforcement, billing updates
- Dashboard: account settings page, workspace switcher tweak, pooled usage banner
- Marketing: ship "one account, multiple academies" homepage section
- Ship to existing paid customers first (manual feature flag), then GA

### v2 (post-launch, scope TBD)
- Self-serve "split workspace into own subscription"
- Cross-workspace analytics roll-up
- Account-level RBAC (single user as admin across all workspaces without per-org invites)
- Migrate to `account` table (Option B) if data model strain emerges

## Open questions

1. **Should free-tier users be able to create multiple workspaces?** Recommend: no (1-workspace cap).
2. **Quota fairness:** if Workspace A burns all the AI tokens, Workspace B has zero — do we expose per-workspace caps as an optional admin control? Recommend: not in v1.
3. **Are workspaces transferrable between accounts?** v1: no, manual support. v2: yes, with consent flow.
4. **Subdomain vs custom domain per workspace:** already supported per-org — confirm SSO/auth flows scope correctly.
5. **Billing edge case:** when adding a paid workspace add-on mid-cycle, prorate immediately or at next renewal? Recommend: immediate prorate (Stripe default).

## Risks

- **Confusing UX** if terminology isn't tight — pick one term ("workspace" or "academy") and use it everywhere
- **Quota gaming** — customers stuffing free workspaces; mitigated by 1-workspace cap on Free
- **Per-workspace SSO config** — each workspace's OIDC config is independent; confirm no cross-pollination of identities
- **Backwards compat** — existing orgs become primary by default; migration is a single backfill (no-op, NULL is already default)

## Out of scope

- Cross-workspace shared course library
- Account-level admin role separate from per-workspace admin
- Public marketplace of shared courses across accounts
