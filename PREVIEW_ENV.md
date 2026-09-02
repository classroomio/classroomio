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
- `mode` — `full_deploy` (default) duplicates all of `staging`; `frontend_backend` creates a
  fresh dashboard+api pair inside `staging`, sharing its DB/Redis/MinIO; `frontend` creates
  just a dashboard service inside `staging`, wired to `staging`'s shared api (see below).
- `action` — `deploy` (create/update) or `destroy` (delete).
- `seed` — also load the full demo dataset (`admin@test.com` etc.); migrations + essential
  seed always run on api boot regardless. Ignored outside `full_deploy` mode.

The run prints the preview **Dashboard URL** in its job **summary**. Everything is named off
`pr-<branch-slug>-<hash>` — an 8-character hash of the branch name is appended because the
slug alone is lossy (e.g. `foo/bar` and `foo_bar` both slug to `foo-bar`) — as an
**environment** for `full_deploy`, a `pr-<branch-slug>-<hash>-dashboard` **service** for
`frontend`, or both `pr-<branch-slug>-<hash>-dashboard` and `pr-<branch-slug>-<hash>-api`
**services** for `frontend_backend`.

The deploy step starts the app-service build(s) **in parallel** (each `railway up --ci`
streams its build logs and blocks until that service passes its deploy/healthcheck), then
waits for all of them — so the printed URL is live the moment the run finishes, and a failed
healthcheck fails the run rather than reporting a broken preview.

#### `frontend` mode

Most changes only touch dashboard UI, so most previews don't need a whole duplicated stack.
With `mode = frontend`, the workflow skips environment duplication entirely and instead
creates **one new service**, `pr-<branch-slug>-<hash>-dashboard`, directly inside `staging`
— built from the branch's `docker/Dockerfile.dashboard` and wired via Railway reference
variables to `staging`'s already-running `cio-api` and `cio-minio`. No new project,
environment, Postgres, Redis, or MinIO volume.

Trade-off: this preview is **not isolated**. It shares staging's Postgres, Redis, MinIO,
and auth session store with `cio-api` — anything created while testing (users, uploads, org
data) lands in the shared `staging` dataset, not a private sandbox. Use `full_deploy` mode
instead when a change needs its own isolated backend/data.

**No manual setup needed.** The workflow trusts this preview's *exact* dashboard origin on
staging `cio-api`'s `TRUSTED_ORIGINS` (comma-append, read once at boot — see
`apps/api/src/constants`) when it deploys, and untrusts that exact origin again when it's
destroyed. Deliberately not a `*.up.railway.app` wildcard — that would trust every app on
that shared Railway domain suffix, not just this one. Cost: each `frontend` deploy/destroy
redeploys the shared staging `cio-api` (variable changes redeploy by default), briefly
affecting anyone else on staging at that moment.

Tear down with `action = destroy`, `mode = frontend`, and the same branch.

#### `frontend_backend` mode

For a change that touches both dashboard and API code but doesn't need its own isolated
database. With `mode = frontend_backend`, the workflow creates **two new services**,
`pr-<branch-slug>-<hash>-dashboard` and `pr-<branch-slug>-<hash>-api`, paired with each
other — built from `docker/Dockerfile.dashboard`/`docker/Dockerfile.api` — but still
pointed at `staging`'s shared Postgres, Redis, and MinIO. `staging`'s existing `cio-jobs`
keeps handling background work for this preview too, since it reads off the same shared
Redis queue regardless of which api enqueued a job — no dedicated jobs service is created.

Because the new api and dashboard trust each other directly (`DASHBOARD_ORIGIN` on the new
api references the new dashboard, the same way `full_deploy` previews' duplicated `cio-api`
trusts its own duplicated dashboard), this mode never touches staging's shared `cio-api`
`TRUSTED_ORIGINS` at all — no redeploy of shared staging on create/destroy, unlike
`frontend` mode.

Trade-offs:
- **Not isolated**: same shared-Postgres/Redis/MinIO caveat as `frontend` mode — signups,
  uploads, and org data land in `staging`'s shared dataset.
- **No new migrations**: the new api runs with `SKIP_DB_SETUP=true` (staging's own `cio-api`
  remains the one that migrates the shared schema — running migrations from two instances
  against the same live Postgres concurrently risks a race). **If your branch adds a new,
  not-yet-applied DB migration, use `full_deploy` instead** — this mode won't apply it.

Tear down with `action = destroy`, `mode = frontend_backend`, and the same branch.

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

- **`full_deploy` previews** get their **own isolated Postgres** — they start fresh.
  `cio-api` **self-migrates on boot** (`docker/entrypoint-api.sh` → `pnpm --filter @cio/db
  db:setup` → `drizzle-kit migrate` + essential seed). No manual migrate step needed. The
  branch must include a committed Drizzle migration (`pnpm --filter @cio/db db:generate`) —
  the boot path runs committed migrations only, not schema `push`.
- **`frontend`/`frontend_backend` previews share `staging`'s own Postgres** — no isolation,
  and (for `frontend_backend`) the new api runs with `SKIP_DB_SETUP=true` so it never
  migrates that shared schema itself. See each mode's section above for the trade-offs.

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

Every `full_deploy` environment (staging + each preview) runs the full 6 services incl. a
MinIO volume, so previews are not free while alive. Destroy them promptly — the teardown
workflow handles PR close automatically; use `action = destroy` for previews whose PR is
still open. `frontend`/`frontend_backend` previews are much cheaper — one or two extra
services — since they share staging's Postgres/Redis/MinIO instead of duplicating them.
