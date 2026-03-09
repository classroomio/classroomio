# ClassroomIO Docker Selfhosting Setup

This guide is for someone setting up ClassroomIO with Docker for the first time.

## 1. Prerequisites

- Docker Desktop installed and running
- `git` installed
- `curl` installed (recommended for health checks)

## 2. Clone the Repo

```bash
git clone --branch feat/course-v2 https://github.com/classroomio/classroomio.git
cd classroomio
```

## 3. Create Root `.env` for Docker Compose

Create `./.env` in the repository root:

```bash
cat > .env <<'EOF'
# Database
POSTGRES_DB=classroomio
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres

# API auth/secrets
# Leave blank to auto-generate on first ./run-docker-full-stack.sh
AUTH_BEARER_TOKEN=
BETTER_AUTH_SECRET=replace-with-a-long-random-secret

# Dashboard server-to-server auth
# Leave blank to auto-generate on first ./run-docker-full-stack.sh
PRIVATE_SERVER_KEY=

# Enterprise features (optional: SSO, token-auth, no-tracking)
# Request a key from ClassroomIO. Leave empty if you do not use Enterprise-only features.
LICENSE_KEY=

# API and dashboard URLs
PUBLIC_SERVER_URL=http://localhost:3081

# Dashboard server-side calls (inside Docker network)
PRIVATE_SERVER_URL=http://api:3081
TRUSTED_ORIGINS=http://localhost:3082,http://localhost:5173
AUTH_COOKIE_DOMAIN=
PUBLIC_IS_SELFHOSTED=true

# Dashboard domain config
PRIVATE_APP_HOST=domain.com
PRIVATE_APP_SUBDOMAINS=app,launchweek

# CSP: External domains (required when PUBLIC_IS_SELFHOSTED=true; no defaults)
# Passed as build args to the dashboard. Rebuild dashboard after changing: --build dashboard
# Comma-separated list for Content-Security-Policy. Include your CDN, API, and video domains.
# Example (adjust to your instance):
ALLOWED_EXTERNAL_DOMAINS=https://*.classroomio.com,https://api.classroomio.com,https://pgrest.classroomio.com,wss://*.classroomio.com,https://assets.cdn.clsrio.com,https://cdn.plyr.io

# Email delivery (choose one approach)
# Option A: Zoho/ZeptoMail token
ZOHO_TOKEN=

# Option B: SMTP
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASSWORD=
SMTP_SENDER=

# Object storage - MinIO (included by default; script auto-sets these if missing)
MINIO_ROOT_USER=minioadmin
MINIO_ROOT_PASSWORD=minioadmin
OBJECT_STORAGE_ENDPOINT=http://minio:9000
OBJECT_STORAGE_PUBLIC_ENDPOINT=http://localhost:9000
OBJECT_STORAGE_ACCESS_KEY_ID=minioadmin
OBJECT_STORAGE_SECRET_ACCESS_KEY=minioadmin
OBJECT_STORAGE_FORCE_PATH_STYLE=true
OBJECT_STORAGE_MEDIA_PUBLIC_BASE_URL=http://localhost:9000/media
EOF
```

Important:

- `./run-docker-full-stack.sh` auto-generates secure values for `AUTH_BEARER_TOKEN` and `PRIVATE_SERVER_KEY` when missing/insecure.
- `./run-docker-full-stack.sh` always uses root `.env` (`docker compose --env-file .env ...`) for compose build/runtime variables.
- API key middleware for dashboard/server-to-server calls validates `PRIVATE_SERVER_KEY`.
- `AUTH_BEARER_TOKEN` is separate and is not used by `apiKeyMiddleware`.
- Enterprise-only features (SSO, token-auth, no-tracking) require `LICENSE_KEY`. If you do not need those features, leave `LICENSE_KEY` empty.
- Dashboard API URL behavior is split by environment: browser requests use `PUBLIC_SERVER_URL`, and server-side dashboard requests use `PRIVATE_SERVER_URL` (fallback: `PUBLIC_SERVER_URL`).
- In hosted deployments, `PUBLIC_SERVER_URL` must be your public API domain (not `localhost`), while Docker internal SSR calls should use `PRIVATE_SERVER_URL=http://api:3081`.
- `AUTH_COOKIE_DOMAIN` is optional. Leave it empty for Better Auth defaults, or set it to `.your-domain.com` (shared cookies across subdomains) or your API host domain when you need explicit cookie domain control.
- Do not use invalid domains (for example `b.com` or `.com` when your backend is `api.b.com`); use `.b.com` or the exact backend host.
- For email sending, configure either `ZOHO_TOKEN` or a full SMTP config (`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_SENDER`).
- If neither Zoho token nor SMTP is configured, emails will not send.
- Keep real secrets out of version control.
- When `PUBLIC_IS_SELFHOSTED=true`, the dashboard CSP uses **only** env vars—no defaults. Set `ALLOWED_EXTERNAL_DOMAINS` with all external domains your instance needs (CDNs, video providers, analytics, etc.).
- **Object storage:** MinIO is included by default. The script auto-sets MinIO env vars if missing. Use `--no-minio` to exclude object storage (video/document/media uploads will not work).

## 4. Start Full Docker Stack

From repo root:

```bash
./run-docker-full-stack.sh

# Skip image rebuild and only start containers
./run-docker-full-stack.sh --no-build

# Exclude MinIO (video/document/media uploads will not work)
./run-docker-full-stack.sh --no-minio
```

This script:

- builds and starts `postgres`, `redis`, `db-init`, `api`, `dashboard`, and **MinIO** (object storage)
- auto-configures MinIO env vars (if missing), runs `minio-init` (creates videos, documents, media buckets)
- prints compose status
- checks API (`3081`) and dashboard (`3082`) endpoints

MinIO Web UI: `http://localhost:9001` (default: `minioadmin` / `minioadmin`).

## 5. Verify Manually (Optional)

```bash
docker compose --env-file .env -p classroomio -f docker/docker-compose.yaml ps
curl -sS http://localhost:3081/
curl -I http://localhost:3082/
```

## 6. Access

- API: `http://localhost:3081`
- Dashboard: `http://localhost:3082`

## 7. Trigger Seed Data

To run DB setup and seed demo data in one command:

```bash
docker compose --env-file .env -p classroomio -f docker/docker-compose.yaml run --rm db-init sh -c "pnpm --filter @cio/db db:setup -- --seed"
```

Seed only (skip DB setup):

```bash
docker compose --env-file .env -p classroomio -f docker/docker-compose.yaml run --rm db-init sh -c "pnpm --filter @cio/db seed"
```

Use seed-only only after setup has already run at least once (`db:setup`, which now creates roles and syncs schema).

`--rm` removes the one-off `db-init` container after the command finishes so you do not accumulate stopped seed containers.

## 8. Restart After Source Code Changes

Because this Docker setup builds images from source (no live bind-mount hot reload), code changes require a rebuild.

Rebuild and restart only one service:

```bash
docker compose --env-file .env -p classroomio -f docker/docker-compose.yaml up -d --build api
docker compose --env-file .env -p classroomio -f docker/docker-compose.yaml up -d --build dashboard
```

If you changed shared code used by both (`packages/*`), rebuild both:

```bash
docker compose --env-file .env -p classroomio -f docker/docker-compose.yaml up -d --build api dashboard
```

Rebuild full stack:

```bash
./run-docker-full-stack.sh
```

If you only changed environment variables (no code change), restart without rebuild:

```bash
docker compose --env-file .env -p classroomio -f docker/docker-compose.yaml restart api dashboard
```

## 9. Stop

```bash
docker compose --env-file .env -p classroomio -f docker/docker-compose.yaml down
```

## 10. If PostgreSQL or Docker Fails with "No space left on device"

The error `could not write lock file "postmaster.pid": No space left on device` means the disk (or Docker storage) is full. Fix it by freeing space, then restart Postgres.

**1. Check disk usage**

```bash
df -h
docker system df
```

**2. Free Docker space (safe — removes unused build cache and images)**

```bash
docker builder prune -f
docker image prune -a -f
docker container prune -f
```

**3. If still low on space, remove unused volumes** (only if you do not need data in other projects’ volumes)

```bash
docker volume prune -f
```

Warning: `docker volume prune` removes volumes not used by any container. If you run it after `docker compose ... down`, it can remove `postgres-data`, `redis-data`, and `minio-data`, and you will lose database and object storage data. To free space without touching Classroom.io data, avoid `down` and use only the prunes in step 2, or remove specific unused volumes by name.

**4. Restart the stack**

```bash
docker compose --env-file .env -p classroomio -f docker/docker-compose.yaml up -d
```

If the host disk is still full after pruning, free space elsewhere (e.g. large files, old logs, other apps) or increase disk capacity.

## 11. "The database system is in recovery mode" (57P03)

This happens when the API (or another service) hits Postgres before it has finished starting or replaying WAL after a crash/restart. Our Postgres healthcheck now requires a successful `SELECT 1` (not just `pg_isready`) so dependent services only start once the DB accepts queries.

If you still see it (e.g. old compose file or a very slow disk):

1. Wait 30–60 seconds and retry the request.
2. Ensure you’re using the latest `docker/docker-compose.yaml` (healthcheck runs `pg_isready` and `psql ... SELECT 1`).
3. Restart the stack so Postgres gets a clean start and the API waits for the updated healthcheck: `./run-docker-full-stack.sh`.

## 12. MinIO: "Storage reached its minimum free drive threshold"

MinIO’s data scanner reports this when the disk (or the volume backing `minio-data`) is below MinIO’s minimum free space. Same root cause as [§10](#10-if-postgresql-or-docker-fails-with-no-space-left-on-device): the host or Docker storage is too full.

**What to do:**

1. Free space using the same steps as in **§10** (e.g. `docker system df`, `docker builder prune -f`, `docker image prune -a -f`, `docker container prune -f`). Avoid `docker volume prune` if you need to keep existing data.
2. After freeing space, restart MinIO (or the full stack) so the scanner sees the new free space:
   ```bash
   docker compose --env-file .env -p classroomio -f docker/docker-compose.yaml restart minio
   ```
   Or restart everything: `./run-docker-full-stack.sh`.
3. If the disk is still near full, remove unneeded objects from MinIO buckets (via Console or `mc`) or add/attach more storage.

MinIO does not expose an env var to lower or disable this threshold; freeing space or adding capacity is the intended fix.
