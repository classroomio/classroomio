# @cio/tenant-router

Cloudflare Worker that fronts every browser-facing ClassroomIO host:

- `*.myclassroomio.com/*` — free-tier tenant sites
- `myclassroomio.com/*` — apex (301 → `classroomio.com`)
- `app.classroomio.com/*` — admin dashboard
- `embed.classroomio.com/*` — public embed widget scripts (R2 `assets` bucket, path-for-path)
- `*.classroomio-content.com/*` — SCORM/activity package content (R2 `scorm` bucket, token-checked, edge-cached)
- BYOD customer domains via Approximated (their proxy forwards to `cio-api.onrender.com` directly, not through this Worker)

The Worker forwards each request to one of two Render services based on path:

| Host / path                  | Upstream                                                                       |
| ---------------------------- | ------------------------------------------------------------------------------ |
| `embed.*`                    | R2 `assets` bucket — `/{widget}` maps to internal keys (`src/embed-assets.ts`) |
| `*.classroomio-content.com` + `/activity/content/*` | R2 `scorm` bucket — per-version content token, edge-cached (`src/activity-content.ts`) |
| `*.classroomio-content.com` + `/activity/player*`, `/activity/scorm/runtime/*` | API service (path preserved, `X-Forwarded-Host` set) |
| `/proxy/*`                   | API service (`/proxy` prefix stripped, rest forwarded as-is)                   |
| anything else                | Dashboard service                                                              |

The `/proxy` prefix is the same-origin escape hatch the dashboard's
browser code uses so its auth cookies stay host-only while still reaching
the API. Example: a browser request to
`https://app.classroomio.com/proxy/api/auth/sign-in/email` becomes
`/api/auth/sign-in/email` on the API service (where Better Auth lives).

It preserves the original host as `X-Forwarded-Host` so:

- The dashboard's SvelteKit adapter-node reads it via `HOST_HEADER=x-forwarded-host` and `event.url.host` becomes the tenant/admin/BYOD host.
- Better Auth on the API emits session cookies without a `Domain` attribute (see `packages/db/src/auth.ts` — `crossSubDomainCookies: { enabled: false }`), so the browser scopes each session to the exact host it called. Tenants on `acme.myclassroomio.com`, the admin app on `app.classroomio.com`, and BYOD `learn.acme.com` each get host-only sessions.

## Deploy

```bash
pnpm --filter @cio/tenant-router deploy
```

The content route must be deployed by hand with `wrangler deploy` before the
cloud SCORM beta: until the `*.classroomio-content.com` route is live, package
files have no edge origin.

Live tail:

```bash
pnpm --filter @cio/tenant-router tail
```

## Activity content (`src/activity-content.ts`)

`GET`/`HEAD /activity/content/{contentToken}/{path}` on a content subdomain
(`{orgKey}.classroomio-content.com`) reads `{p}/{path}` from the private
`scorm` bucket, where `p` is the storage prefix inside the verified content
token. The token is checked before any cache read. Behavior mirrors the API
content route (self-hosted origin) except the edge cache:

- Missing, forged or expired tokens get 401; a token naming another
  organization gets 403. Tokens are accepted in their mint week and the next.
- Paths are normalized (backslash, Unicode NFC, `..`, absolute and drive
  paths rejected with 400) and never escape `p`.
- On an exact-key miss, `{p}/index.json` (then `{p}.index.json`) resolves a
  case-insensitive match for packages built on Windows with wrong-case
  references. The processor writes the index as a JSON array of
  prefix-relative paths.
- `Range` returns 206; unsatisfiable ranges return 416 with
  `Content-Range: bytes */{size}`.
- Full 200 responses are stored in `caches.default` keyed by storage path
  plus a hash of the allowed ancestors (never the token), so repeat launches
  in a week share edge entries while different ancestors never do. Range
  responses are never cached. Files over 512 MB bypass the cache.
- Responses carry `Cache-Control: public, max-age=604800, immutable`,
  `Accept-Ranges: bytes`, stored-or-extension content types,
  `Content-Security-Policy: frame-ancestors 'self' {ancestors}`,
  `Cross-Origin-Opener-Policy: unsafe-none`,
  `Referrer-Policy: strict-origin`, `X-Content-Type-Options: nosniff` and
  `Cross-Origin-Resource-Policy: cross-origin`.
  No `X-Frame-Options` is set.
- `/activity/content/*` off the content host is 404, and any other path on
  the content host is 404 except `/activity/player*` and
  `/activity/scorm/runtime/*`, which forward to the API upstream with the
  path preserved.

Verify after deploy (spike Q9 / acceptance criterion 27):

```bash
dig +short anything.classroomio-content.com
curl -sS -o /dev/null -w '%{http_code}\n' https://<orgKey>.classroomio-content.com/activity/content/<token>/index.json
curl -sSI https://<orgKey>.classroomio-content.com/activity/content/<token>/sco.html | grep -i cf-cache-status
```

The second request for the same immutable file must return
`cf-cache-status: HIT`.

## Env vars (wrangler.toml `[vars]`)

| Var                       | Value                                                                           |
| ------------------------- | ------------------------------------------------------------------------------- |
| `DASHBOARD_UPSTREAM_HOST` | `.onrender.com` host of the dashboard service (no scheme)                       |
| `API_UPSTREAM_HOST`       | `.onrender.com` host of the API service                                         |
| `APEX_REDIRECT_TARGET`    | URL to redirect `myclassroomio.com` apex to (default `https://classroomio.com`) |
| `EMBED_HOST`              | Hostname for public embed widgets (default `embed.classroomio.com`)             |
| `API_URL`                 | API origin injected into embed scripts as `window.CIO.apiBaseUrl`               |
| `SCORM_CONTENT_DOMAIN`    | Registrable content domain (default `classroomio-content.com`)                  |

Update the values in `wrangler.toml` after looking them up in the Render dashboard.

## Cloudflare DNS expected setup

`myclassroomio.com` zone:

- `*` CNAME → any valid target, **Proxied**
- `@` CNAME → any valid target, **Proxied** (Worker serves the 301)

`classroomio.com` zone:

- `app` CNAME → **Proxied** so the route binds
- `embed` CNAME → **Proxied** (serves `embeds/*` from R2 via Worker)
- `api` CNAME → **DNS only** (server-to-server callers and webhooks bypass the Worker)

`classroomio-content.com` zone (SCORM/activity content):

- `*` CNAME → any valid target, **Proxied**
- No apex serving record; only `*.classroomio-content.com` serves content
- Secret: `wrangler secret put ACTIVITY_SIGNING_SECRET` (same value as the
  API `ACTIVITY_SIGNING_SECRET`)

## BYOD custom domains

Handled by [Approximated](https://approximated.app/), not this Worker. Cloudflare for SaaS can't front a Render origin (Render itself runs on Cloudflare), so we use Approximated's dedicated edge cluster instead. See `apps/api/src/services/org/domain.ts` for the integration. Customers point an A record at the IP Approximated returns; the proxy forwards directly to `cio-api.onrender.com`.
