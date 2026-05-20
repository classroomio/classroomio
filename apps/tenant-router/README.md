# @cio/tenant-router

Cloudflare Worker that fronts every browser-facing ClassroomIO host:

- `*.classroomio.school/*` — free-tier tenant sites
- `classroomio.school/*` — apex (301 → `classroomio.com`)
- `app.classroomio.com/*` — admin dashboard
- BYOD customer domains via Cloudflare for SaaS

The Worker forwards each request to one of two Render services based on path:

| Path | Upstream |
|---|---|
| `/proxy/*` | API service (`/proxy` prefix stripped, rest forwarded as-is) |
| anything else | Dashboard service |

The `/proxy` prefix is the same-origin escape hatch the dashboard's
browser code uses so its auth cookies stay host-only while still reaching
the API. Example: a browser request to
`https://app.classroomio.com/proxy/api/auth/sign-in/email` becomes
`/api/auth/sign-in/email` on the API service (where Better Auth lives).

It preserves the original host as `X-Forwarded-Host` so:

- The dashboard's SvelteKit adapter-node reads it via `HOST_HEADER=x-forwarded-host` and `event.url.host` becomes the tenant/admin/BYOD host.
- Better Auth on the API emits session cookies without a `Domain` attribute (see `packages/db/src/auth.ts` — `crossSubDomainCookies: { enabled: false }`), so the browser scopes each session to the exact host it called. Tenants on `acme.classroomio.school`, the admin app on `app.classroomio.com`, and BYOD `learn.acme.com` each get host-only sessions.

## Deploy

```bash
pnpm --filter @cio/tenant-router deploy
```

Live tail:

```bash
pnpm --filter @cio/tenant-router tail
```

## Env vars (wrangler.toml `[vars]`)

| Var | Value |
|---|---|
| `DASHBOARD_UPSTREAM_HOST` | `.onrender.com` host of the dashboard service (no scheme) |
| `API_UPSTREAM_HOST` | `.onrender.com` host of the API service |
| `APEX_REDIRECT_TARGET` | URL to redirect `classroomio.school` apex to (default `https://classroomio.com`) |

Update the values in `wrangler.toml` after looking them up in the Render dashboard.

## Cloudflare DNS expected setup

`classroomio.school` zone (new):

- `*` CNAME → any valid target, **Proxied**
- `@` CNAME → any valid target, **Proxied** (Worker serves the 301)
- `cname` CNAME → any valid target, **Proxied** — this is the value BYOD customers point their CNAME at

`classroomio.com` zone:

- `app` CNAME → **Proxied** so the route binds
- `api` CNAME → **DNS only** (server-to-server callers and webhooks bypass the Worker)
- The old wildcard `*` CNAME on `classroomio.com` should be deleted — tenant traffic now belongs on `classroomio.school`.

## Cloudflare for SaaS (BYOD)

On the `classroomio.school` zone:

- **SSL/TLS → Custom Hostnames**: enabled
- **Fallback Origin**: `cname.classroomio.school` — BYOD traffic lands on the Worker route and is forwarded through the same code path as `*.classroomio.school`.

The API uses these env vars (`apps/api/src/services/org/domain.ts`):

- `CLOUDFLARE_CUSTOM_HOSTNAMES_API_TOKEN` — Cloudflare API token scoped to the `classroomio.school` zone with `Zone → SSL and Certificates → Edit` + `Zone → Zone → Read`.
- `CLOUDFLARE_CUSTOM_HOSTNAMES_ZONE_ID` — Zone ID for `classroomio.school`.
- `CLOUDFLARE_CUSTOM_HOSTNAME_CNAME_TARGET=cname.classroomio.school`.
