# Railway Staging & PR Preview Environments

ClassroomIO's production SaaS runs on Render + Cloudflare — **not** Railway. This
setup adds a **separate, internal Railway project** that provides a long-lived **staging**
environment plus **short-lived preview environments** for testing a branch/PR of the full
stack (api, dashboard, jobs, Postgres, Redis, MinIO) before it merges to `main`.

Real users are never routed here; it's a team-only sandbox.

## How to deploy to staging

Push or merge your change to the branch connected to the staging environment (staging). Railway
picks it up automatically and redeploys — no manual step required.

## How to deploy a PR to a preview environment

Two mechanisms, both enabled:

| | Native PR environments | Manual workflow (`railway-preview.yml`) |
|---|---|---|
| Trigger | Automatic on every opened PR | You run it from the **Actions** tab |
| Teardown | Automatic on PR merge/close | `action = destroy`, or auto via `railway-preview-teardown.yml` on PR close |
| Control | Whole base env is duplicated | Same, but you choose when and can re-seed the DB |
| Requires | App services connected to the GitHub repo (Dockerfile builder) | A Railway account/team token in CI |

> A service that deploys from a **fixed Docker Hub image tag can never get a PR preview** —
> an image tag has no branch. That's why the Railway app services build **from the repo**
> via `docker/Dockerfile.*`, not from `docker-compose.images.yaml`.

### Using the manual workflow

> 🎥 Demo video: TODO

**Actions → "Railway Preview Environment" → Run workflow:**
- `branch` — the branch/PR head to deploy.
- `mode` — `full-stack` (default) duplicates all of `staging`; `frontend-only` creates just
  one dashboard-only service inside `staging` itself (see below).
- `action` — `deploy` (create/update) or `destroy` (delete).
- `seed` — also load the full demo dataset (`admin@test.com` etc.); migrations + essential
  seed always run on api boot regardless. Ignored in `frontend-only` mode.

The run prints the preview **Dashboard URL** in its job **summary**. The env (or, in
`frontend-only` mode, the service) is named `pr-<branch-slug>-<hash>` — an 8-character hash
of the branch name is appended because the slug alone is lossy (e.g. `foo/bar` and
`foo_bar` both slug to `foo-bar`).

The deploy step starts the app-service build(s) **in parallel** (each `railway up --ci`
streams its build logs and blocks until that service passes its deploy/healthcheck), then
waits for all of them — so the printed URL is live the moment the run finishes, and a failed
healthcheck fails the run rather than reporting a broken preview.

#### `frontend-only` mode

Most changes only touch dashboard UI, so most previews don't need a whole duplicated stack.
With `mode = frontend-only`, the workflow skips environment duplication entirely and
instead creates **one new service**, `pr-<branch-slug>-<hash>-dashboard`, directly inside
`staging` — built from the branch's `docker/Dockerfile.dashboard` and wired via Railway
reference variables to `staging`'s already-running `cio-api` and `cio-minio`. No new
project, environment, Postgres, Redis, or MinIO volume.

Trade-off: this preview is **not isolated**. It shares staging's Postgres, Redis, MinIO,
and auth session store with `cio-api` — anything created while testing (users, uploads, org
data) lands in the shared `staging` dataset, not a private sandbox. Use `full-stack` mode
instead when a change needs its own isolated backend/data.

**One-time prerequisite:** `cio-api`'s `TRUSTED_ORIGINS` (read once at boot, comma-separated,
supports `*` wildcards — see `apps/api/src/constants`) must include
`https://*.up.railway.app` so every `frontend-only` preview's Railway-generated domain is
trusted for CORS/session cookies. Add this once to staging's `cio-api` service (Railway
dashboard, or `railway variables --service cio-api --set 'TRUSTED_ORIGINS=...'` appended to
whatever's already set) — it's never touched per-PR, so creating/destroying a
`frontend-only` preview never mutates or restarts the shared `cio-api`.

Tear down with `action = destroy`, `mode = frontend-only`, and the same branch.

## MinIO Storage

- **Single Domain:** Railway allows only **one Railway-provided domain per service**, so the
  workflow pins `cio-minio`'s generated domain to **port 9000 (S3 API)** — used for backend
  uploads (`OBJECT_STORAGE_ENDPOINT`) and browser presigned uploads.
- **Web Console:** the console listens on port 9001 but gets **no automatic public domain**
  in previews. To browse buckets, add a custom domain targeting 9001 on `cio-minio` →
  **Settings → Networking**, then set `MINIO_BROWSER_REDIRECT_URL=https://<that-domain>` on
  the service. Locally, the console is simply at `http://localhost:9001`.
- **CORS & CSP:** Previews set `MINIO_API_CORS_ALLOW_ORIGIN=*` on `cio-minio` and append the
  MinIO API domain to `ALLOWED_EXTERNAL_DOMAINS` on `cio-dashboard` so browser uploads and
  video playback pass Content Security Policy checks. Variable updates are retried and fail
  the run instead of leaving the preview misconfigured.
- **Persistence:** Ensure a Railway Volume is mounted to `/data` under `cio-minio` -> **Volumes** so uploaded files and buckets survive service redeploys.

## Database behavior

- Each environment has its **own isolated Postgres** — previews start fresh.
- `cio-api` **self-migrates on boot** (`docker/entrypoint-api.sh` → `pnpm --filter @cio/db
  db:setup` → `drizzle-kit migrate` + essential seed). No manual migrate step needed.
- **The branch must include a committed Drizzle migration** (`pnpm --filter @cio/db
  db:generate`) — the boot path runs committed migrations only, not schema `push`.

## Verify before relying on it (spike, do on a throwaway env)

Railway's docs are thin on a couple of points the workflow depends on — confirm these once:

1. **`railway environment new --duplicate <env>` copies service config *and* variables.**
   If your CLI version lacks `--duplicate`, use the GraphQL
   `environmentCreate(sourceEnvironmentId)` mutation instead.
2. **A duplicated env's Postgres starts empty** (so boot migration builds a clean schema).
3. **The demo-seed step's DB reachability.** `railway run` executes on the GitHub runner, so
   it needs a DB URL reachable from CI (Railway's public TCP proxy `DATABASE_PUBLIC_URL`),
   not the private `railway.internal` one. If unreachable, drop the seed step and rely on the
   boot-time essential seed. These caveats are marked `# SPIKE:` in `railway-preview.yml`.

## Cost

Every full-stack environment (staging + each preview) runs the full 6 services incl. a
MinIO volume, so previews are not free while alive. Destroy them promptly — the teardown
workflow handles PR close automatically; use `action = destroy` for previews whose PR is
still open. `frontend-only` previews are much cheaper — just one extra service — since they
share staging's Postgres/Redis/MinIO instead of duplicating them.
