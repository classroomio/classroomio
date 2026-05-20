# Google OAuth across multiple apex domains

This doc explains how Google sign-in works for ClassroomIO across three different host families:

- `app.classroomio.com` — admin dashboard
- `<orgSiteName>.classroomio.school` — free-tier tenant sites
- `<customer-owned>.com` — BYOD custom domains via Cloudflare for SaaS

All three need to sign users in via Google, set host-only auth cookies on the originating host, and land the user back on the page they started from.

## The problem

Google OAuth requires every callback URL to be **registered ahead of time** in Google Cloud Console. Wildcards are not allowed in standard apps. We can't register `*.classroomio.school` or every BYOD customer's domain.

We also can't share auth cookies across apex domains: a cookie on `api.classroomio.com` won't be sent to a request on `acme.classroomio.school`. Even setting `Domain=.classroomio.school` won't help — the OAuth callback always lands on `api.classroomio.com` per the registered URI, and that response can only set cookies for `api.classroomio.com`.

## The architecture

```
acme.classroomio.school                         api.classroomio.com                 Google
─────────────────────────                       ─────────────────────               ──────

POST /proxy/api/auth/sign-in/social
         │
         ▼
   Cloudflare Worker (apps/tenant-router)
   ─── strips /proxy, forwards ─────────────▶  POST /api/auth/sign-in/social
                                                       │
                                                       │ oAuthProxy plugin sees
                                                       │ currentURL ≠ productionURL,
                                                       │ rewrites callbackURL to
                                                       │   acme.classroomio.school/
                                                       │     api/auth/oauth-proxy-callback
                                                       │ and forces redirect_uri to
                                                       │   api.classroomio.com/.../callback/google
                                                       ▼
                                              ◀───── 200 { url: google authorize URL } ─────────────
   browser navigates to Google ────────────────────────────────────────────────────────────────▶
                                                                                                  │
                                                                                                  │ user
                                                                                                  │ consents
                                                                                                  │
   ◀────────────────────────────────────────── 302 redirect_uri (api.classroomio.com/...) ───────
                                                       │
   GET /api/auth/callback/google?state=...&code=... ──▶│
                                                       │
                                                       │ oAuthProxy plugin: skipStateCookieCheck=true
                                                       │ Better Auth: exchange code, create user,
                                                       │              create session, set Set-Cookie
                                                       │              for api host
                                                       │ oAuthProxy after-middleware: encrypt all
                                                       │              Set-Cookie content into URL
                                                       │              location=…?cookies=<encrypted>
                                                       │
                                                       │ APP-LEVEL SWAP (apps/api/src/app.ts):
                                                       │   stash encrypted cookies in Redis
                                                       │   under a short token, rewrite location to
                                                       │   …?token=<short>  (drops 10KB → ~150 bytes)
                                                       ▼
   ◀────────── 302 …/oauth-proxy-callback?callbackURL=…&token=<short> ────────────────────────
   browser follows back to the tenant host
         │
         ▼
   Cloudflare Worker forwards (via `/api/auth/*` carve-out, no /proxy prefix)
         │
   GET /api/auth/oauth-proxy-callback?callbackURL=…&token=<short>
                                                       │
                                                       │ APP-LEVEL SWAP (inbound):
                                                       │   read token from Redis, restore
                                                       │   ?cookies=<encrypted>, delete token
                                                       │
                                                       │ Better Auth oAuthProxy endpoint:
                                                       │   decrypt the cookies blob,
                                                       │   re-emit each Set-Cookie on this response
                                                       │   (so the browser scopes them to the
                                                       │   tenant host)
                                                       ▼
   ◀────────────────────────────────────── 302 to original callbackURL ──────────────────────────
   browser lands on acme.classroomio.school/, logged in.
```

The same flow works for `app.classroomio.com` (the proxy-skip branch in `oAuthProxy` kicks in when `currentURL === productionURL`) and for BYOD domains (`learn.acme.com`) routed through Cloudflare for SaaS.

## Pieces and where they live

| Concern | File | Notes |
|---|---|---|
| Better Auth + `oAuthProxy` plugin registration | `packages/db/src/auth.ts` | `productionURL: CONSTANTS.BASE_URL` makes `api.classroomio.com` the canonical OAuth-callback URL. |
| Auth endpoint mount in Hono | `apps/api/src/app.ts` (`/api/auth/*` handler) | Rewrites `request.url` from `X-Forwarded-Host`/`-Proto` so the plugin sees the tenant host the user actually visited. |
| Cookies → token swap (outbound + inbound) | `apps/api/src/app.ts` (`/api/auth/*` handler) | Stashes the encrypted `cookies=…` blob in Redis under a short token, drops Location header from 10KB+ to ~150 bytes. |
| Redis storage helpers | `apps/api/src/utils/redis/oauth-handoff.ts` | `storeHandoffPayload` (2-minute TTL) + `consumeHandoffPayload` (single-use, GET-and-DEL). |
| Cloudflare Worker | `apps/tenant-router/src/index.ts` | Forwards `/proxy/*` → API (stripping prefix) and `/api/auth/*` → API (as-is, no strip), everything else → dashboard. |
| Browser-side base URL | `apps/dashboard/src/lib/utils/services/api/index.ts` (`getRequestBaseUrl`) | Returns `${origin}/proxy` in the browser so auth cookies stay host-only. |
| Browser-side auth client baseURL | `apps/dashboard/src/lib/utils/services/auth/client.ts` | `${origin}/proxy/api/auth` — Better Auth's client treats a baseURL with a path as the full auth root, so we encode the post-Worker-strip path here. |
| Auto-enrollment after first signup | `packages/db/src/auth/hooks/tenant-provisioning.ts` | Resolves the tenant org from `cio-org-id` header (email signup) or `x-forwarded-host` (OAuth host). Idempotent membership insert. |
| `customSession` plugin (adds `orgRoles` to session) | `packages/db/src/auth.ts` | Loads `{ [orgId]: roleId }` via `getUserOrgRolesMap` and ships it inside the `session_data` cookie cache. Org-scoped middlewares read it from `c.get('orgRoles')` — no per-request DB query. |

## Why the Redis handoff exists

Better Auth's `oAuthProxy` plugin handles cross-origin OAuth by encrypting **every Set-Cookie** the OAuth callback emits — `session_token`, `session_data`, `account_data`, `dontRememberToken` — into a single `cookies=<huge>` query parameter on the redirect URL. For ClassroomIO with `cookieCache.enabled: true` and `storeAccountCookie: true`, that blob hits ~5KB raw / ~10KB hex-encoded.

Some hop between Render and the browser (Render's edge proxy, suspect HTTP header size limit) silently drops responses with a Location header that big — the API thinks it sent a 302, but the browser never receives one. The OAuth flow hangs.

The Redis handoff sidesteps the size limit entirely:

- Encrypted cookies blob → Redis, keyed by a 32-hex-char token.
- Location header carries only the token (~150 bytes total URL).
- Tenant-host endpoint reads token from Redis, restores the cookies query param, hands the request to Better Auth as-if-original.

Single-use (GET-and-DEL on read) and 2-minute TTL keep the surface small.

## Google Cloud Console settings

You only ever need **one** OAuth client and **one** registered callback URI for unlimited tenants:

- **Authorized JavaScript origins**: `https://api.classroomio.com`
- **Authorized redirect URIs**: `https://api.classroomio.com/api/auth/callback/google`

Do **not** add tenant subdomains, `*.classroomio.school`, or BYOD customer domains — Google rejects wildcards for standard apps and the `oAuthProxy` plugin handles the redirect to the original tenant host on its own.

### Sensitive scopes warning

If Google's consent screen warns users that the app is requesting "sensitive" or "restricted" scopes (like Drive) during sign-in, check **Google Cloud Console → OAuth consent screen → Scopes**. Sign-in only requests `email`, `profile`, `openid`. If `drive.readonly` is in the declared scopes list there, remove it. Drive access is requested separately via the in-app picker (`apps/dashboard/src/lib/utils/functions/google-drive-picker.ts`) using incremental authorization, so the consent prompt for it only appears when a user actually opens the Drive picker.

## Required env vars

On the **API** Render service:

| Var | Value | Why |
|---|---|---|
| `BETTER_AUTH_SECRET` | random 32+ char string | Encrypts the oauth-proxy cookies blob and signs sessions. |
| `PUBLIC_SERVER_URL` | `https://api.classroomio.com` | Better Auth's `baseURL` and the `oAuthProxy` plugin's `productionURL`. |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | from Google Cloud Console | OAuth client credentials. |
| `REDIS_URL` | Render Key Value internal URL | Required for the cookies-→-token handoff. Without it the handoff falls back to inline cookies and the OAuth flow breaks on tenant subdomains. |

On the **dashboard** Render service:

| Var | Value | Why |
|---|---|---|
| `HOST_HEADER` | `x-forwarded-host` | SvelteKit adapter-node reads the effective host from this so `event.url.host` is the tenant/admin host the user is on. |
| `PROTOCOL_HEADER` | `x-forwarded-proto` | Same, for protocol. |
| `PRIVATE_APP_HOST` | `classroomio.school` | Used by `getSubdomain` in `layout-setup.ts` to extract the org siteName. |
| `PUBLIC_SERVER_URL` | `https://api.classroomio.com` | Used at runtime only as a fallback / for `authClient`'s SSR-time URL constructor; browser code uses `${origin}/proxy` via `getRequestBaseUrl`. |
| `PRIVATE_SERVER_URL` | API's internal Render URL | Server-side dashboard → API calls bypass the public edge. |

## Verifying the flow

After any change, exercise the full sequence and check the API logs:

```
[auth-handler] POST /api/auth/sign-in/social → 200
[auth-handler] GET /api/auth/callback/google → 302 location.length≈150
[auth-handler] GET /api/auth/oauth-proxy-callback → 302 (to original callbackURL)
```

If `location.length` is in the thousands again, the cookies → token swap didn't fire (check Redis connectivity, or that the response Location actually contains `cookies=`).

If the proxy-callback request never appears, the Worker's `/api/auth/*` carve-out isn't deployed (`pnpm --filter @cio/tenant-router deploy`).

If you get `state_security_mismatch`, the `oAuthProxy` plugin didn't detect the proxied flow on the callback side — most likely the `X-Forwarded-Host` rewrite in `apps/api/src/app.ts` isn't running, so `currentURL` looked like the production URL.

## Known gotchas

- **`storeAccountCookie: true` is fine again** with the Redis handoff. The size of the cookies blob no longer matters; it just has to fit in a Redis value (which has no practical ceiling here).
- **`customSession` is gone.** `orgRoles` is fetched per-request from Redis in `org-member`, `org-admin`, and `org-admin-or-automation-key` middlewares (DB on cache miss, 1-hour TTL). Anywhere that mutates `organizationmember` for an **existing** user should call `invalidateOrgRolesCache(userId)` so the role change is visible immediately instead of after the TTL.
- **OAuth state cookie check is skipped** on the callback when the `oAuthProxy` plugin engages (`skipStateCookieCheck: true`). CSRF is still protected by the unguessable random state token stored in the DB (Better Auth's `verification` table) and the 10-minute expiry. This is the documented Better Auth mitigation.
- **Render service name swap** — `cio-api.onrender.com` is the **dashboard** service, `cio-api-vymh.onrender.com` is the **API** service. Render doesn't allow renaming. See `apps/tenant-router/wrangler.toml` for the same warning.
