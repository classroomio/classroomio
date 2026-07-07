# ClassroomIO Docker Self-Hosting

## Prerequisites

- Docker Desktop installed and running
- `git` installed

## Quick Start

```bash
git clone https://github.com/classroomio/classroomio.git
cd classroomio
cp .env.example .env
# Edit .env — set your dashboard domain and secrets
./run-docker-full-stack.sh
```

The script builds and starts: **postgres**, **redis**, **minio** (object storage), **api** (`localhost:3081`), **dashboard** (`localhost:3082`), and the **jobs** worker (background processing). Database schema setup runs automatically inside the `api` container on startup (see [`docker/entrypoint-api.sh`](../entrypoint-api.sh); skip with `SKIP_DB_SETUP=true`).

It auto-generates secure values for `PRIVATE_SERVER_KEY` and `BETTER_AUTH_SECRET` when they are missing or left at placeholders, and randomizes MinIO credentials on first provision.

> **The jobs worker is required, not optional.** Without it, video processing, captions/transcription, AI course generation, and most emails are enqueued in Redis but never run — uploads stay stuck "processing" with no error. See [Background Jobs Worker](#background-jobs-worker) below.

## Run from Pre-built Images (no build)

The Quick Start builds images from source — that needs the full repo and ~8 GB RAM for the
dashboard build. Most self-hosters should instead **pull** the published `classroomio/{api,dashboard,jobs}`
images. You only need [`docker-compose.images.yaml`](../../docker-compose.images.yaml) and a `.env`:

```bash
# 1. Get just the compose file + env template (no full clone required)
curl -O https://raw.githubusercontent.com/classroomio/classroomio/main/docker-compose.images.yaml
curl -o .env https://raw.githubusercontent.com/classroomio/classroomio/main/.env.example
# 2. Edit .env — set CIO_VERSION (pin a release!), DASHBOARD_ORIGIN, secrets, SMTP
# 3. Pull and start
CIO_VERSION=1.4.2 docker compose -f docker-compose.images.yaml --env-file .env pull
CIO_VERSION=1.4.2 docker compose -f docker-compose.images.yaml --env-file .env up -d
```

From a full clone you can also use the helper: `./run-docker-full-stack.sh --images`.

> Secrets aren't auto-generated in this path (the helper script does that). Set `BETTER_AUTH_SECRET`
> and `PRIVATE_SERVER_KEY` to strong random values yourself.

## Versioning & Upgrades

Published images use a **rolling `latest` + pinned releases** tag policy:

| Tag | Meaning | Use it for |
|-----|---------|-----------|
| `1.4.2` (exact) | An immutable, smoke-tested release | **Production — always pin this** |
| `1.4`, `1` | Latest patch/minor of that line | Tracking a line |
| `latest` | The freshest `main` build (rolling; may include unreleased code) | Trying the newest code |

`latest` moves on **every merge to `main`**, so it can change under you. **Pin `CIO_VERSION` to an
exact version in production** so a merge can't break you unattended.

```bash
# Upgrade: bump the version, pull, recreate
CIO_VERSION=1.5.0 docker compose -f docker-compose.images.yaml --env-file .env pull
CIO_VERSION=1.5.0 docker compose -f docker-compose.images.yaml --env-file .env up -d

# Rollback: set CIO_VERSION back to the previous release and repeat
```

Schema migrations run automatically on `api` startup (`db:setup`), so upgrades need no manual DB
step. If a release consolidates ("squashes") older migrations, the startup baseline detects an
existing instance and adopts the new baseline as already-applied — your database is upgraded in
place without re-running schema that already exists.

(Maintainers: every published image is boot-smoke-tested in CI before it ships — see
[`PUBLISHING_IMAGES.md`](PUBLISHING_IMAGES.md).)

## Environment Variables

All Docker services read from a single root `.env` file. See [`.env.example`](../../.env.example) for the full annotated template with required/optional grouping.

Key points:

- **Required:** `PUBLIC_IS_SELFHOSTED=true`, `DASHBOARD_ORIGIN` (set this to your real domain in production — it also drives public media URLs, see [Production Object Storage](#production-object-storage)).
- **API routing:** Browser dashboard calls go to the dashboard origin and are proxied to `PRIVATE_SERVER_URL` (default: `http://api:3081`). You do not need API/dashboard cookie-domain matching for normal dashboard auth.
- **Direct API access (optional):** Set `PUBLIC_SERVER_URL` and `TRUSTED_ORIGINS` only if browsers or third-party clients need to call the API origin directly.
- **CSP (runtime):** `ALLOWED_EXTERNAL_DOMAINS` (overrides all) or per-directive: `CSP_SCRIPT_SRC_DOMAINS`, `CSP_STYLE_SRC_DOMAINS`, `CSP_CONNECT_SRC_DOMAINS`, `CSP_FRAME_SRC_DOMAINS`, `CSP_FONT_SRC_DOMAINS`, `CSP_MEDIA_SRC_DOMAINS`. These are read at container startup — no image rebuild needed. The API does not need to be added for normal dashboard calls.
- **Auth cookies:** No cookie-domain env is needed. The dashboard proxy makes auth first-party and Better Auth sets host-only dashboard cookies.
- **Auto-generated:** `PRIVATE_SERVER_KEY`, `BETTER_AUTH_SECRET` (by `./run-docker-full-stack.sh`). A strong value you set yourself is never overwritten.
- **Auto-configured:** All `MINIO_*` / `OBJECT_STORAGE_*` vars (by the startup script, with randomized MinIO credentials).
- **Email (effectively required):** SMTP (or Zoho). See [Email](#email) — without it, signup verification, password reset, and invites do not send.
- **Optional:** Google OAuth, Unsplash, `LICENSE_KEY` (enterprise).
- **Optional — upload limits:** `UPLOAD_MAX_*_MB` vars (documents, images, videos, assignment files, etc.). See [`.env.example`](../../.env.example). Passed through to both `api` and `dashboard` containers; unset values use built-in defaults. Raise your reverse-proxy body-size limit too if you increase these.

`PRIVATE_SERVER_KEY` must be the same value in both API and dashboard — the script ensures this.

## Verify

```bash
docker compose --env-file .env -p classroomio -f docker-compose.yaml ps
curl -sS http://localhost:3081/    # API — returns JSON
curl -I  http://localhost:3082/    # Dashboard — returns 200
```

## Seed Demo Data

Schema setup runs automatically on `api` startup. To additionally seed demo data, run the
seed script inside the running `api` container:

```bash
docker exec cio-api pnpm --filter @cio/db db:setup:seed
```

## Command Reference

All commands use this prefix — abbreviated as `dc` below:

```
dc = docker compose --env-file .env -p classroomio -f docker-compose.yaml
```

| Task | Command |
|------|---------|
| Full stack (pulls pre-built images, with MinIO) | `./run-docker-full-stack.sh` |
| Build from source instead of pulling | `./run-docker-full-stack.sh --build` |
| Exclude MinIO | `./run-docker-full-stack.sh --no-minio` |
| API-only smoke test | `dc up --build -d postgres redis api` |
| Service status | `dc ps` |
| Stream logs | `dc logs -f api dashboard` |
| Rebuild one service | `dc up -d --build api` |
| Restart (env change, no rebuild) | `dc restart api dashboard` |
| Stop | `dc down` |
| Stop + delete volumes | `dc down -v` |

### Build Images Locally

```bash
docker build -f docker/Dockerfile.api -t classroomio/api:latest .
docker build -f docker/Dockerfile.dashboard -t classroomio/dashboard:latest .
```

### Inspect Container Env Vars

```bash
docker exec cio-api env | sort
docker exec cio-dashboard env | sort
```

Container names: `cio-postgres`, `cio-redis`, `cio-api`, `cio-dashboard`, `cio-jobs`, `cio-minio`.

## MinIO (Object Storage)

MinIO is included by default. The startup script auto-configures env vars, starts MinIO, and creates `videos`, `documents`, and `media` buckets.

- **API endpoint:** `http://localhost:9000`
- **Web UI:** `http://localhost:9001` (default: `minioadmin` / `minioadmin`)

To start MinIO manually (e.g. after `--no-minio`):

```bash
docker compose -f docker-compose.yaml --profile minio up -d
```

- **Web UI:** `http://localhost:9001` (credentials are the randomized `MINIO_ROOT_USER` / `MINIO_ROOT_PASSWORD` written to your `.env`).

**Security:** The startup script randomizes `MINIO_ROOT_USER` / `MINIO_ROOT_PASSWORD` on first provision and mirrors them into `OBJECT_STORAGE_ACCESS_KEY_ID` / `OBJECT_STORAGE_SECRET_ACCESS_KEY`. If you change them, keep both pairs in sync.

### MinIO Web UI Not Loading

If port 9001 does not respond, recreate the container:

```bash
docker rm -f cio-minio
docker compose -f docker-compose.yaml --profile minio up -d
```

Data is preserved in the `minio-data` volume.

## Background Jobs Worker

The `jobs` service (`cio-jobs`) is a BullMQ worker that processes everything ClassroomIO does
asynchronously:

- **Video processing** — probe, thumbnails, audio extraction, transcoding
- **Transcription / captions** — via OpenAI Whisper (needs `OPENAI_API_KEY`)
- **AI course generation** — the "generate a course with AI" agent
- **Emails** — invites, notifications, and other non-auth emails
- **Maintenance** — periodic cleanup

It shares Redis and the database with the API. It is started automatically by the full-stack
script. If it is not running, jobs accumulate in Redis and silently never complete.

```bash
docker compose --env-file .env -p classroomio -f docker-compose.yaml logs -f jobs
```

> Note: the in-course **AI tutor chat** runs synchronously inside the API and does not need the
> worker. Course *generation*, transcription, and media processing do.

## Email

Email is **effectively required**: signup verification and password reset are sent by the API,
and invites/notifications are sent by the worker. Configure one of:

- **SMTP:** `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_SENDER`
- **Zoho / ZeptoMail:** `ZOHO_TOKEN`

Both the `api` and `jobs` services read these. Without them, auth and invite flows appear to
succeed in the UI but no email is delivered (`ECONNREFUSED` in logs).

## Production Object Storage

The bundled MinIO is fine for a single host. Two things matter for a real deployment:

1. **Public media URLs must point at your domain, not `localhost`.** Media URLs are embedded in
   pages served to browsers, so `http://localhost:9000/...` breaks for every remote visitor. The
   startup script derives `OBJECT_STORAGE_PUBLIC_ENDPOINT` and
   `OBJECT_STORAGE_MEDIA_PUBLIC_BASE_URL` from `DASHBOARD_ORIGIN` when it is a real domain — make
   sure your reverse proxy routes `<your-domain>/media` to MinIO on port 9000 (or set those two
   variables explicitly).
2. **External S3 / Cloudflare R2 instead of MinIO.** Run with `--no-minio` and set the
   `OBJECT_STORAGE_*` variables (endpoint, public endpoint, access key, secret, buckets) to your
   provider. The startup script fails fast if `--no-minio` is used without an
   `OBJECT_STORAGE_ENDPOINT`, so you cannot accidentally launch with no storage.

## Backups & Persistence

All state lives in named Docker volumes: `postgres-data`, `redis-data`, `minio-data`
(see `docker-compose.yaml`). **`docker compose ... down -v` deletes them — and all your
data.** Back up regularly:

```bash
# Database (most important)
docker exec cio-postgres pg_dump -U postgres classroomio > backup-$(date +%F).sql

# Object storage — copy the minio-data volume, or use `mc mirror` to an off-box bucket
```

Restore the database into a fresh stack with `psql`/`pg_restore` against `cio-postgres`.

## Scaling & Repeated Startups

`db:setup` runs on every `api` container start (idempotent schema sync). If you run **multiple
API replicas**, set `SKIP_DB_SETUP=true` on all but one to avoid concurrent migration races, and
run setup once out-of-band. The worker queues can also be scaled independently by overriding the
`jobs` container command with the per-queue `start:*` scripts (e.g. `start:media`,
`start:media-transcribe`) — see `apps/jobs/package.json`.

## HLS Video Playback

Signed HLS playback (`HLS_SIGNING_SECRET`) is validated by the `tenant-router` Cloudflare Worker,
which is **not** part of this compose stack. Self-hosted deployments serve media via the object
storage public URL above; signed-HLS delivery is out of scope for the compose setup.

## Rebuild After Code Changes

This setup builds images from source (no live hot reload). Code changes require a rebuild:

```bash
# One service
docker compose --env-file .env -p classroomio -f docker-compose.yaml up -d --build api

# Both (e.g. shared packages/* changed)
docker compose --env-file .env -p classroomio -f docker-compose.yaml up -d --build api dashboard

# Full stack
./run-docker-full-stack.sh
```

## Troubleshooting

### "No space left on device"

```bash
df -h                          # check host disk
docker system df               # check Docker usage
docker builder prune -f        # free build cache
docker image prune -a -f       # free unused images
docker container prune -f      # free stopped containers
```

> **Warning:** `docker volume prune` removes volumes not used by any container. If run after `docker compose ... down`, it deletes `postgres-data`, `redis-data`, and `minio-data`. Use only the prunes above to free space safely.

Then restart: `./run-docker-full-stack.sh`

### "The database system is in recovery mode" (57P03)

Postgres has not finished starting. Wait 30-60 seconds and retry. The compose healthcheck requires a successful `SELECT 1` before dependent services start.

### MinIO "Storage reached its minimum free drive threshold"

Same root cause as disk full. Free space using the steps above and restart MinIO:

```bash
docker compose --env-file .env -p classroomio -f docker-compose.yaml restart minio
```

### SMTP Errors in Logs

`ECONNREFUSED 127.0.0.1:465` means SMTP is not configured. This does not block startup — configure SMTP or Zoho when you need email.

### Port Conflicts

```bash
lsof -nP -iTCP:3081 -sTCP:LISTEN
lsof -nP -iTCP:3082 -sTCP:LISTEN
```

## Related

- [Self-hosting docs](https://classroomio.com/docs/self-hosted/docker) — published guide with Docker, Railway, and Coolify instructions
- [`docker/docs/PUBLISHING_IMAGES.md`](PUBLISHING_IMAGES.md) — publishing Docker images to Docker Hub
