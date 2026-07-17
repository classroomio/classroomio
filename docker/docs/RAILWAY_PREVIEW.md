# Railway Staging & PR Preview Environments

ClassroomIO's production SaaS runs on Render + Cloudflare + Vercel — **not** Railway. This
setup adds a **separate, internal Railway project** that provides a long-lived **staging**
environment plus **short-lived preview environments** for testing a branch/PR of the full
stack (api, dashboard, jobs, Postgres, Redis, MinIO) before it merges to `main`.

Real users are never routed here; it's a team-only sandbox.

## How previews are triggered

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

## One-time setup

### 1. Railway project (dashboard)
Follow the full topology in `RAILWAY_SETUP_GUIDE.md` (repo root, untracked). In short:
create project `classroomio-staging`, rename its base environment to **`staging`**, and add
6 services: Postgres, Redis, `cio-minio` (+ `/data` volume, seed buckets), `cio-api`,
`cio-dashboard`, `cio-jobs`. The three app services connect to **GitHub repo → Dockerfile
builder**, branch `main`, root `/`.

### 2. Enable native PR environments
Project **Settings → Environments → PR Environments → enable**, and set
**Base environment = `staging`** (explicitly, not blank) so previews inherit staging's
variables + service config.

### 3. CI credentials (GitHub → repo settings)
| Kind | Name | Value |
|---|---|---|
| Secret | `RAILWAY_API_TOKEN` | A Railway **account or team** token (project/env-scoped tokens can't create environments). |
| Variable | `RAILWAY_PROJECT_ID` | The `classroomio-staging` project id. |
| Variable | `RAILWAY_BASE_ENV` | *(optional)* env to duplicate; defaults to `staging`. |

## Using the manual workflow

**Actions → "Railway Preview Environment" → Run workflow:**
- `branch` — the branch/PR head to deploy.
- `action` — `deploy` (create/update) or `destroy` (delete).
- `seed` — also load the full demo dataset (`admin@test.com` etc.); migrations + essential
  seed always run on api boot regardless.

The run prints the preview dashboard URL in its job **summary**. The env is named
`pr-<branch-slug>`.

The deploy step runs `railway up --ci` (no `--detach`), which streams build logs and **blocks until
each service passes its deploy/healthcheck** before the next one starts — so the printed URL is live
the moment the run finishes, and a failed healthcheck fails the run rather than reporting a broken
preview.

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

## Do not commit secrets

`RAILWAY_SETUP_GUIDE.md` is intentionally **untracked/gitignored** and contains test secrets.
Keep real secrets in Railway's variable store and GitHub secrets — never in the repo.
