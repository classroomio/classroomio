# ClassroomIO Security & Code Audit

**Stack detected:** Hono API backend (Node.js), Svelte 5 / SvelteKit dashboard frontend, Drizzle ORM, PostgreSQL, Better-Auth sessions, Zod validation, pnpm + Turborepo monorepo.

---

## Summary

| Severity | Count |
|---|---|
| 🔴 HIGH | 3 |
| 🟡 MEDIUM | 6 |
| 🟢 LOW | 4 |

---

## Findings

### `apps/api/src/routes/agent/agent.ts`

```
L301  🔴 HIGH   Authorization (BFLA, vertical / Payment entitlement) — POST /agent/credits/purchase
      accepts a Polar webhook payload with authOrApiKeyMiddleware only (user session OR server API key).
      There is no Polar webhook signature verification before crediting an org's token balance.
      Any caller who can supply a valid PRIVATE_SERVER_KEY (or any authenticated user!) can invoke
      this endpoint and fabricate a providerOrderId to add arbitrary token credits.
      The idempotency check (findCreditPurchaseByOrderId) prevents replay of the *same* order ID
      but does not prevent creation of a new one with an invented id and any token amount.
      Expected fix: guard this endpoint with a verified Polar webhook signature (Polar provides an
      HMAC secret) and move it off the shared PRIVATE_SERVER_KEY. Authorized pentest recommended
      to confirm exploitability.
```

```
L288  🟡 MEDIUM  Authorization (BFLA, vertical) — POST /agent/credits
      Directly adds credits to an org's token balance with orgAdminMiddleware only.
      Any org admin (not just ClassroomIO staff) can self-top-up without a payment flow.
      This appears intentional for self-hosted / gifting scenarios but there is no server-side
      verification that the request comes from a trusted billing path (e.g. the Polar webhook).
      If this is an admin-only manual top-up, document it explicitly and consider requiring the
      PRIVATE_SERVER_KEY as well so it cannot be called from the authenticated dashboard.
```

---

### `apps/api/src/middlewares/api-key.ts` and `apps/api/src/middlewares/rate-limiter.ts`

```
L37   🟡 MEDIUM  Timing side-channel — apiKeyMiddleware uses `apiKey !== expectedApiKey` (plain
      string equality) to verify the PRIVATE_SERVER_KEY. This is timing-unsafe: an attacker
      receiving sub-millisecond response time differences over many requests could theoretically
      brute-force the key one character at a time.
      The queue-dashboard uses timingSafeEqual (correctly) but apiKeyMiddleware and
      isTrustedServerApiKeyRequest in rate-limiter.ts do not.
      Expected fix: use `crypto.timingSafeEqual(Buffer.from(apiKey), Buffer.from(expectedApiKey))`
      (also guard equal-length check before calling timingSafeEqual).
```

---

### `apps/api/src/routes/organization/organization.ts`

```
L562  🟡 MEDIUM  Authorization (BFLA, vertical) — POST /organization/plan
L583  🟡 MEDIUM  Authorization (BFLA, vertical) — PUT /organization/plan
L604  🟡 MEDIUM  Authorization (BFLA, vertical) — POST /organization/plan/cancel
      All three plan-management endpoints accept authOrApiKeyMiddleware (user session OR API key).
      That means any authenticated user can call POST /organization/plan with an arbitrary
      {orgId, planName, subscriptionId} in the body and upgrade any org's subscription record
      without going through the Polar checkout flow. The routes are intended as server-side
      webhook sinks but there is no additional guard (e.g. apiKeyMiddleware only, or Polar
      signature check) preventing an authenticated end-user from calling them.
      Expected fix: change auth guard to apiKeyMiddleware-only (no user session allowed), and add
      Polar webhook signature verification for the plan-create path.
```

```
L650  🟢 LOW    Debug artifact — PUT / (updateOrg) contains `console.log(c.req.valid('json'))`
      which logs the full org update payload (including potentially sensitive customization/landingpage
      JSON, custom domain strings, etc.) to stdout on every request. Remove before release.
```

```
L741  🟡 MEDIUM  Authorization (BFLA, vertical) — POST /audience/assign-courses
      Uses orgTeamMemberMiddleware (ADMIN or TUTOR). The code comment says "Requires … admin role"
      but tutors can also assign audience members to courses. Review whether tutors should be
      allowed to perform bulk course enrollment. If not, downgrade to orgAdminMiddleware.
      (Compare: audience/import at L712 uses orgTeamMemberMiddleware with the same discrepancy
      between comment and actual check.)
```

---

### `apps/api/src/routes/unsplash/unsplash.ts`

```
L16   🟡 MEDIUM  Missing authentication — POST /unsplash is explicitly noted as "No authentication
      required - public route". This endpoint proxies to the Unsplash API using the server's
      UNSPLASH_API_KEY. Any unauthenticated client can use this route to exhaust the Unsplash
      API rate limit / quota associated with the ClassroomIO API key. The global rate-limiter
      applies, but unauthenticated traffic is keyed on IP which is trivially rotatable.
      Expected fix: require at minimum authMiddleware (or apiKeyMiddleware for SSR use-cases).
```

---

### `apps/dashboard/src/lib/features/ai-assistant/message-bubble.svelte` and `utils/markdown.ts`

```
L166  🟡 MEDIUM  XSS risk (stored/reflected via AI response) — AI chat messages are rendered with:
      {@html renderMentions(renderMarkdown(part.text as string), courseId)}
      `marked` (v14.x) does NOT sanitize HTML by default — it passes raw HTML through.
      If the AI model ever echoes back a malicious payload (prompt-injection attack, compromised
      provider, or rogue tool result), the output would be injected into the DOM unsanitized.
      The `renderMentions` helper applies partial escaping only for mention titles, not for the
      full HTML tree from marked.
      Expected fix: pipe the output of `marked.parse()` through DOMPurify (browser build) before
      passing it to {@html}. Install `dompurify` and `@types/dompurify` and wrap:
        import DOMPurify from 'dompurify';
        return DOMPurify.sanitize(marked.parse(text, { async: false }) as string);
```

---

### `apps/api/src/routes/org-site/` and `apps/dashboard/src/routes/(org-site)/course/[slug]/+page.svelte`

```
L33   🟢 LOW    JSON-LD injection — `{@html \`<script type="application/ld+json">${courseJsonLd}</script>\`}`
      The page correctly applies `.replace(/</g, '\\u003c')` before injecting, which neutralizes
      </script> injection. ✅ Reviewed — JSON-LD injection mitigation is present, OK.
      (Same pattern confirmed in lesson page.)
```

---

### `apps/api/src/middlewares/rate-limiter.ts`

```
L48   🟢 LOW    Rate limiting disabled outside production — `if (env.NODE_ENV !== 'production') return next()`
      skips all rate limiting in development and staging. This is a common and reasonable dev
      ergonomic but means that staging environments (if NODE_ENV is not `production`) have no
      rate limiting on auth endpoints. Ensure NODE_ENV is set to `production` in any
      internet-exposed staging deployment.
```

---

### General / Cross-cutting

```
      🟢 LOW    Dependency audit — run `pnpm audit` across the monorepo. The `marked` package
      in particular has had historic XSS issues in older versions; verify you are on a patched
      release (v14+). This tool does not enumerate CVEs from memory.
```

---

## Reviewed-OK (not findings)

- **Authentication (global)** — Better Auth session resolved on every non-public request in `app.ts` middleware; `authMiddleware` correctly guards sensitive mutations. ✅
- **Org isolation** — `orgAdminMiddleware` and `orgMemberMiddleware` derive org role from the server-side session `orgRoles` map (populated by Better Auth plugin), not from client-supplied input. `cio-org-id` header is cross-checked against session; a user cannot claim membership in an org they are not in. ✅
- **Org ID trusted from session** — Middleware reads `orgRoles[orgId]` from the Better Auth session, not from the request body. Tenant isolation is session-derived. ✅
- **Internal routes (`/internal/*`)** — All sub-routes use `apiKeyMiddleware`. ✅
- **Invite flows** — All invite acceptance endpoints have per-route rate limiters and require `authMiddleware`. Token-based invite previews require `apiKeyMiddleware`. ✅
- **Public API (`/public-api/v1/*`)** — All routes require `automationKeyMiddleware` + scope check. CORS is correctly set to `*` with `credentials: false`. ✅
- **Admin queue dashboard (`/admin/queues`)** — In production, gated with HTTP Basic Auth using `timingSafeEqual`. Not mounted if `QUEUE_DASHBOARD_PASSWORD` is unset. ✅
- **SSO endpoints** — All SSO CRUD routes require `authMiddleware` + `orgAdminMiddleware` + `requireLicense(SSO)`. ✅
- **Asset routes** — Assets consistently scoped by `orgId` from header (session-verified); individual asset operations pass `orgId` to every service call, preventing cross-tenant access. ✅
- **CORS** — Session routes use an allowlist (`resolveTrustedBrowserOriginForCors`), not `*`. ✅
- **Secrets** — No raw secrets found committed in source. `env.*` references used throughout; `.env` is git-ignored. ✅
- **Secure headers** — `secureHeaders()` middleware applied globally; HLS cookie issued with `HttpOnly: true`, `Secure: true`. ✅
- **Outbound fetch calls** — All `fetch()` calls in service code target hard-coded or env-var base URLs (Unsplash, Approximated, Cloudflare AI), not user-supplied URLs. No SSRF surface found. ✅

---

## Next Steps

> Per the audit skill: **stop here**. Reply with which findings (all / some / none) to fix, and fixes will be applied with before/after diffs using the framework's own idioms.
