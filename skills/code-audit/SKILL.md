---
name: code-audit
description: Static security and code audit for ClassroomIO stack (Hono API backend, Svelte 5 / SvelteKit dashboard frontend, Drizzle ORM, Zod validation, Better-Auth authentication, PostgreSQL, pnpm + turbo monorepo). Reviews authentication, authorization (BOLA/IDOR, BFLA, privilege escalation), multi-tenant organization isolation, payment/subscription entitlement gating (Polar/Stripe), Zod mass assignment / excessive data exposure, system vs org-branded email security, and OWASP-style vulnerabilities (SQLi via raw Drizzle, XSS, SSRF, secrets, CSRF). Read-only code review skill that flags missing or misconfigured security controls and rule violations in source.
---

# Security & Code Audit (ClassroomIO Stack)

Static, read-only review of ClassroomIO source code for missing or broken security controls and compliance with project architectural conventions. Same two-phase discipline as any refactor skill: **flag and explain first, fix only what's approved.**

## Hard boundaries (do not cross these)

This skill is a **code reviewer**, not a penetration tester:
- Read and reason about source code only. Never send requests to a running server, staging, or production instance to "test" whether a vuln is exploitable.
- Never write exploit code, proof-of-concept payloads, injection strings, or scripts designed to demonstrate a vulnerability against a live target.
- Never scan or probe infrastructure you don't have explicit code-level access to in this workspace.
- If a finding would benefit from confirming exploitability, say so and stop — recommend the user use a proper authorized pentest process instead. Do not offer to "verify it works."
- Secrets found in code get flagged by location and type only — never echo the actual secret value back in full (mask it, e.g. `sk_live_***...9f2`).

If any of this ever seems like it's blocking legitimate work, that's a sign to slow down and check with the user rather than route around it.

## Phase 0: Identify the application stack

ClassroomIO is a pnpm monorepo using TypeScript:

| Layer | Technology | Key Patterns & Paths |
|---|---|---|
| API Backend | Hono, Node.js, Cloudflare Wrangler | `apps/api/src/routes/**`, `apps/api/src/services/**`, `@api/utils/hono` |
| Database | PostgreSQL + Drizzle ORM | `packages/db/src/queries/**`, `packages/db/src/schema/**` |
| Validation | Zod | `packages/utils/src/validation/**` |
| Auth & Sessions | Better-Auth, `authMiddleware` | `apps/api/src/middlewares/**` |
| Frontend Dashboard | Svelte 5 / SvelteKit, Vite | `apps/dashboard/src/routes/**`, `apps/dashboard/src/lib/features/**` |
| UI & Styling | Bits UI, Tailwind CSS (`ui:` prefix) | `packages/ui/src/**` |
| Async Workers | `apps/jobs-worker` | `apps/jobs-worker/src/**` |
| Transactional Email | `@cio/email` | `packages/email/src/emails/**` (system vs org-branded) |

Once confirmed, apply stack-specific checks in Phase 1 & Phase 2.

## Phase 1: Locate — translate categories into stack-specific searches

Every category needs four things located: **route/endpoint definitions**, **auth/permission checks**, **data access (ORM/query) calls**, and **outbound requests**. Here are the idioms for ClassroomIO and common stacks:

| What to find | ClassroomIO (Hono / Drizzle / Svelte) | Generic Node / Express |
|---|---|---|
| Route definitions | `new Hono().get/post/put/delete`, `app.route(...)` in `apps/api/src/routes/**` | `router.get/post/put/delete` |
| Auth/permission check | `authMiddleware`, `c.get('user')`, org membership check, `zValidator` | custom middleware, `passport` |
| Data access | Drizzle queries in `packages/db/src/queries/**` (`db.select()`, `db.insert()`, `db.update()`, `db.delete()`) | Mongoose/Prisma/Sequelize calls |
| Outbound request | `axios`, `fetch`, `ky`, `@polar-sh/sdk`, Sentry | `fetch`, `axios` |

ClassroomIO Grep Cheat-Sheet:
```bash
# Route definitions in Hono API
grep -rn "new Hono\|.route(\|.get(\|.post(\|.put(\|.delete(" apps/api/src/routes

# Auth middleware usage in API routes
grep -rn "authMiddleware\|c.get('user')" apps/api/src/routes

# Database query helper invocations
grep -rn "packages/db/src/queries" apps/api/src/services

# Secrets scan
grep -rnE "(api[_-]?key|secret|password|token)\s*[:=]\s*['\"][A-Za-z0-9]{16,}" apps/ packages/
```

Read each matched location in full context — a route handler is meaningless without seeing its middleware/decorator chain, whatever form that takes in this stack.

## Phase 2: Classify (universal categories, apply via the stack identified in Phase 0)

### A. Authentication

| Check | Look for (concept — apply via stack idiom) |
|---|---|
| Missing auth on sensitive routes | A route/endpoint touching user data, admin actions, or mutations has no auth check in its chain — whether that's Express middleware, a Django decorator, a Spring annotation, or a Rails `before_action` |
| Weak session/token handling | JWT decoded without signature verification; no expiry check; signing secret hardcoded instead of sourced from config/env/secret manager |
| Insecure cookies | Session cookies missing `HttpOnly`, `Secure`, or `SameSite` — check whatever session config mechanism the framework uses (Express session config, Django `SESSION_COOKIE_*` settings, Rails `session_store`, etc.) |
| Password handling | Plaintext storage/comparison instead of bcrypt/argon2/scrypt (or the framework's built-in hasher — Django's `make_password`, Rails' `has_secure_password`); missing rate limiting on login |

### B. Authorization / Access control

Frame every finding as **horizontal** or **vertical** privilege escalation:
- **Horizontal** = accessing/modifying another user's data at the same permission level (BOLA/IDOR).
- **Vertical** = gaining a higher permission level than granted (BFLA, role/tier escalation).

| Check | Look for |
|---|---|
| Broken Object Level Authorization (BOLA/IDOR) — horizontal | An endpoint fetches/mutates a resource by an id from the request without checking it belongs to the authenticated caller — this is a universal pattern regardless of ORM |
| Broken Function Level Authorization (BFLA) — vertical | An endpoint that is admin/privileged-only *in intent* (delete user, refund, change role) has no stronger check than "is logged in" |
| Missing role/permission checks | Auth confirms identity but not authority — no role/permission/policy check before a sensitive action |
| Client-side-only protection | Frontend route guard or conditional render (React `<ProtectedRoute>`, Vue nav guard, Angular route guard, or server-rendered template `{% if user.is_admin %}`) with no matching backend enforcement — the real vulnerability is always the missing backend check |
| View-mode / feature-flag as security | Hiding an admin panel/view behind client state or a feature flag instead of a real permission check |
| Mass assignment (a.k.a. object injection) | A create/update handler binds the full request body to a model without an allowlist, letting a client set fields like `role` or `is_admin` directly — relevant to any framework with auto-binding (Rails strong params done wrong, Django ModelForm without `fields=`, .NET model binding, Express body directly passed to an ORM update) |
| Excessive data exposure | An endpoint serializes and returns the full internal object (password hash, internal flags, other users' fields) relying on the frontend to filter — check serializers/DTOs/response schemas, not just route logic |

Mass assignment + excessive data exposure are sometimes grouped as **Broken Object Properties (BOP)**. Same fix either way: an explicit allowlist of fields on both write and read.

Always trace a frontend guard down to its backend enforcement before concluding anything — a frontend-only finding is incomplete; report both halves.

### C. Payment / subscription / entitlement gating

Universal principle: any check deciding "can this account do/see/export X" must be enforced server-side, at the point of the action — not just at checkout, and never trusted from the client, regardless of stack.

| Check | Look for |
|---|---|
| Client-side-only feature gating | Frontend checks a plan/tier field to show/hide a feature; the corresponding backend endpoint doesn't independently check entitlement |
| Trusting client-supplied plan/price | Checkout/order endpoint accepts price or plan id from the request instead of looking it up server-side from a trusted source |
| Webhook signature not verified | Payment provider webhook handler (Stripe, Paddle, etc.) processes events without verifying the signature — same risk in any language's webhook receiver |
| Missing idempotency on payment webhooks | Handler can be replayed to double-credit an account |
| Tier escalation via user-editable field | Plan/role stored on a record the user's own update endpoint can touch |
| Trial/quota enforced client-side only | Usage counters checked in frontend state rather than server-side before the gated action executes |
| Coupon/discount abuse | Discount validated only client-side, or backend doesn't check usage limits/expiry |

### D. Multi-tenant data isolation

Relevant for any SaaS/dashboard app with orgs, workspaces, or accounts, in any stack.

| Check | Look for |
|---|---|
| Missing tenant scope in queries | A query fetches by id alone without also filtering by tenant/org/account id matching the authenticated caller — lets one tenant read/edit another's data |
| Tenant id trusted from the client | Request body/query/header supplies the tenant id directly instead of deriving it from the authenticated session |
| Shared resource pools without tenant checks | Background jobs, caches, queues, or file storage keyed only by a resource id, not namespaced by tenant |
| Cross-tenant admin/impersonation paths | Support/impersonate-user features that don't scope or log which tenant an admin is acting within |

### E. Real-time & collaborative app access control

Relevant to WebSocket/real-time features in any stack (Socket.IO, native WebSockets, Django Channels, ActionCable, Phoenix Channels, SignalR).

| Check | Look for |
|---|---|
| Room/session join with no membership check | A socket/channel join accepts any connected client without verifying invitation/participation — a guessable or leaked room id becomes an open door |
| Server trusts client-asserted identity | Real-time handler uses a user id/role sent in the message payload instead of the value bound at connection/auth time |
| Role elevation via client message | A participant can send a message claiming an elevated role (e.g. `role: 'host'`) and the server acts on it without checking their actual assigned role |
| Recording/export access | Recording or export actions not restricted to the owner/host role |
| Predictable/sequential share links | Room/project share URLs use incrementing ids instead of unguessable tokens |
| Collaborative edit permission bypass | Any connected client in a shared document/canvas can send edit events regardless of granted permission level (view vs. edit) |
| Long-lived relay/TURN credentials | Static credentials shipped to the client instead of short-lived, per-session generated ones |

### F. OWASP-style checks (universal, framework-agnostic)

| Category | Look for |
|---|---|
| Injection | Raw string concatenation into a query instead of parameterized queries/ORM methods (applies to SQL, NoSQL, and even OS command construction); `eval`/dynamic code execution on user input |
| XSS | Unsanitized user content rendered without escaping — `dangerouslySetInnerHTML` in React, `\|safe`/`mark_safe` in Django/Jinja, `raw()` in Rails/ERB, `v-html` in Vue — the mechanism differs, the risk (server or template trusts unescaped user input) is identical |
| SSRF | Server code makes an outbound request to a URL/host taken from user input without an allowlist — can reach internal services, `localhost`, or cloud metadata endpoints (`169.254.169.254`). Check any endpoint accepting a URL, hostname, or "callback" field, in any language's HTTP client |
| CSRF | State-changing endpoints with no CSRF token check when using cookie-based sessions (most frameworks have a built-in CSRF mechanism — check it's actually enabled, not just available) |
| Secrets in source | API keys, DB URLs, signing secrets committed directly instead of read from environment/secret manager |
| Insecure headers | Missing security headers (CSP, `X-Frame-Options`, HSTS) — check the framework's standard mechanism (`helmet` for Express, Django `SECURE_*` settings, Rails `secure_headers` gem, etc.) |
| Open redirect | Redirect target taken directly from user input without an allowlist |
| Rate limiting | Auth/password-reset/OTP endpoints with no rate limiter |
| Dependency risk | Flag that the ecosystem's audit tool should be run (`npm audit`, `pip-audit`, `bundle audit`, `govulncheck`) — don't enumerate CVEs from memory since that data goes stale |

### ✅ Not a finding
Auth/role checks present and correctly ordered/applied; parameterized queries; secrets sourced from environment/config, not committed; backend-enforced access control even if the frontend also hides the option; server-derived tenant/room/role scoping; webhook signature verification present; server-side price/plan lookups; explicit response serializers/allowlists in use. Report these as reviewed-OK — don't manufacture findings to seem thorough.

## Phase 3: Report

State the detected stack up front, then group findings by file, one line per finding, severity-tagged:

```
Stack detected: Django 4.x backend, React frontend (Vite)

api/views.py
  L34  🔴 HIGH   Authorization (BFLA, vertical) — delete_user view has @login_required but no permission/role check; any authenticated user can delete any account
  L51  🟡 MEDIUM — serializer includes password_hash field in API response (excessive data exposure)
  L12  ✅ Reviewed — login view rate-limited and uses Django's built-in password hasher, OK

frontend/src/components/AdminPanel.jsx
  L9   🔴 HIGH   Authorization — panel rendering gated on client isAdmin only; confirm /api/admin/* views are independently protected (see api/views.py L34)

api/integrations/webhooks.py
  L15  🔴 HIGH   SSRF — webhook handler fetches an unvalidated client-supplied callback URL
```

Severity guide: 🔴 HIGH = missing/bypassable access control, exposed secret, or confirmed SSRF/injection surface. 🟡 MEDIUM = defense-in-depth gap (missing rate limit, weak header config, excessive data exposure without a clear exploit path). 🟢 LOW = hardening suggestion, not an active gap.

Stop here. Ask which findings (all/some/none) to fix.

## Phase 4: Fix

Only for approved findings:
1. Apply the minimal correct fix using the *framework's own idiom* — e.g. add the missing Django `permission_classes`, Rails `before_action`, Spring `@PreAuthorize`, or Express middleware; don't introduce a foreign pattern from a different ecosystem.
2. Show before/after diff.
3. If a fix needs a new package, check the project's existing manifest first (`package.json`, `requirements.txt`, `Gemfile`, etc.) and flag the addition rather than assuming it's wanted.
4. Never invent a parallel auth/permission system if one already exists partially — extend the existing pattern found in the codebase, don't create a competing one.