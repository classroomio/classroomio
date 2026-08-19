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
- `action` — `deploy` (create/update) or `destroy` (delete).
- `seed` — also load the full demo dataset (`admin@test.com` etc.); migrations + essential
  seed always run on api boot regardless.

The run prints both the preview **Dashboard URL** and the **MinIO Web Console URL** in its job **summary**. The env is named `pr-<branch-slug>`.

The deploy step runs `railway up --ci` (no `--detach`), which streams build logs and **blocks until
each service passes its deploy/healthcheck** before the next one starts — so the printed URLs are live
the moment the run finishes, and a failed healthcheck fails the run rather than reporting a broken
preview.

## MinIO Storage & Web UI

- **Dual Domains:** `cio-minio` generates two separate public domain ports on Railway:
  - **Port 9000 (S3 API):** Used for backend uploads (`OBJECT_STORAGE_ENDPOINT`) and browser presigned uploads.
  - **Port 9001 (Web Console):** Open in browser to log into the MinIO dashboard (`videos`, `documents`, `media` buckets).
- **CORS & CSP:** Previews automatically set `MINIO_API_CORS_ALLOW_ORIGIN=*` on `cio-minio` and append the MinIO API domain to `ALLOWED_EXTERNAL_DOMAINS` on `cio-dashboard` so browser uploads and video playback pass Content Security Policy checks.
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

Every environment (staging + each preview) runs the full 6 services incl. a MinIO volume, so
previews are not free while alive. Destroy them promptly — the teardown workflow handles PR
close automatically; use `action = destroy` for previews whose PR is still open.
