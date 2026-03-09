# Docker Usage Guide

This directory contains Docker files for local self-hosting and image publishing.

## Stack Overview

`docker/docker-compose.yaml` starts these services:

- `postgres`: primary database used by `@cio/db` and `@cio/api`
- `redis`: cache/rate-limit store used by `@cio/api`
- `db-init`: one-off setup job (`pnpm --filter @cio/db db:setup`, which creates required roles and syncs schema)
- `api`: backend service on `http://localhost:3081`
- `dashboard`: frontend service on `http://localhost:3082`

For published-image deployments, use `docker/docker-compose.prod.yaml` (same services, but `api`, `dashboard`, and `db-init` run from published images instead of local builds).

Notes:

- Postgres and Redis are internal-only in compose (not exposed on host ports by default).
- `db-init` is expected to exit with code `0` after setup.
- If you run seed-only commands, make sure setup has already run once so schema exists.

## Quick Start

Run from the repository root:

```bash
# Full stack with MinIO (object storage) - default
./run-docker-full-stack.sh

# Skip image rebuild and only start containers
./run-docker-full-stack.sh --no-build

# Exclude MinIO (video/document/media uploads will not work)
./run-docker-full-stack.sh --no-minio
```

Verify:

```bash
docker compose --env-file .env -p classroomio -f docker/docker-compose.yaml ps
curl -sS http://localhost:3081/
curl -I http://localhost:3082/
```

Expected:

- API returns welcome JSON
- Dashboard returns `HTTP/1.1 200 OK`

## API-Only Smoke Test

If you only want to validate API startup (recommended first check):

```bash
docker compose --env-file .env -p classroomio -f docker/docker-compose.yaml up --build -d postgres redis db-init api
docker compose --env-file .env -p classroomio -f docker/docker-compose.yaml ps
docker compose --env-file .env -p classroomio -f docker/docker-compose.yaml logs --tail=100 api
curl -sS http://localhost:3081/
```

## Production (Published Images)

Create a production env file from the template:

```bash
cp docker/.env.prod.example docker/.env.prod
```

Set pinned image tags in `docker/.env.prod`:

```bash
CIO_API_IMAGE=classroomio/api:v0.1.0
CIO_DASHBOARD_IMAGE=classroomio/dashboard:v0.1.0
# Optional: Enterprise-only features (SSO, token-auth, no-tracking)
# LICENSE_KEY=your-issued-license-key
```

Then deploy:

```bash
docker compose -p classroomio --env-file docker/.env.prod -f docker/docker-compose.prod.yaml pull
docker compose -p classroomio --env-file docker/.env.prod -f docker/docker-compose.prod.yaml up -d
```

## Environment Variables

Create a root `.env` file for compose. For local Docker, you can leave the token values blank and the startup script will generate secure values and keep them synchronized:

```bash
POSTGRES_DB=classroomio
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres

BETTER_AUTH_SECRET=replace-with-a-strong-secret
AUTH_BEARER_TOKEN=
PRIVATE_SERVER_KEY=
# Optional: required only for Enterprise-only features (SSO, token-auth, no-tracking)
LICENSE_KEY=

PUBLIC_SERVER_URL=https://api.your-domain.com
PRIVATE_SERVER_URL=http://api:3081
TRUSTED_ORIGINS=https://app.your-domain.com
AUTH_COOKIE_DOMAIN=
```

Optional integrations (if used):

```bash
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASSWORD=
SMTP_SENDER=

GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

UNSPLASH_API_KEY=
```

Object storage (MinIO included by default; script auto-sets these):

```bash
MINIO_ROOT_USER=minioadmin
MINIO_ROOT_PASSWORD=minioadmin
OBJECT_STORAGE_ENDPOINT=http://minio:9000
OBJECT_STORAGE_PUBLIC_ENDPOINT=http://localhost:9000
OBJECT_STORAGE_ACCESS_KEY_ID=minioadmin
OBJECT_STORAGE_SECRET_ACCESS_KEY=minioadmin
OBJECT_STORAGE_FORCE_PATH_STYLE=true
OBJECT_STORAGE_MEDIA_PUBLIC_BASE_URL=http://localhost:9000/media
```

Important:

- `./run-docker-full-stack.sh` auto-generates secure `AUTH_BEARER_TOKEN`/`PRIVATE_SERVER_KEY` values when missing or insecure placeholders are used.
- `./run-docker-full-stack.sh` always uses root `.env` (`docker compose --env-file .env ...`) so compose build/runtime variables come from repository-root `.env`.
- API key middleware for dashboard/server-to-server calls validates `PRIVATE_SERVER_KEY`.
- `AUTH_BEARER_TOKEN` is a separate token and is not used by `apiKeyMiddleware`.
- Enterprise-only features (SSO, token-auth, no-tracking) require `LICENSE_KEY`. If you do not use those features, leave it unset.
- Dashboard URL selection is environment-aware: browser calls use `PUBLIC_SERVER_URL`, while SSR/server-side calls use `PRIVATE_SERVER_URL` (fallback: `PUBLIC_SERVER_URL`).
- In Docker, set `PRIVATE_SERVER_URL=http://api:3081` for internal service-to-service traffic, and keep `PUBLIC_SERVER_URL` as your public API URL (do not use `localhost` in hosted deployments).
- `AUTH_COOKIE_DOMAIN` is required for setting cookies. Set it to `.your-domain.com` for cross-subdomain cookies, or to your exact API host when you need host-scoped cookies. Leave empty to use Better Auth defaults.

## Common Commands

```bash
# Start / rebuild
docker compose --env-file .env -p classroomio -f docker/docker-compose.yaml up --build -d

# Stream logs
docker compose --env-file .env -p classroomio -f docker/docker-compose.yaml logs -f api dashboard

# Stop
docker compose --env-file .env -p classroomio -f docker/docker-compose.yaml down

# Stop and remove volumes (deletes local DB/cache data)
docker compose --env-file .env -p classroomio -f docker/docker-compose.yaml down -v
```

### API or dashboard fails to start

```bash
docker compose --env-file .env -p classroomio -f docker/docker-compose.yaml logs --tail=200 api dashboard db-init postgres redis
```

### SMTP errors in API logs

If SMTP is not configured, logs may include `ECONNREFUSED 127.0.0.1:465`. This does not block API startup.

### Port conflicts

```bash
lsof -nP -iTCP:3081 -sTCP:LISTEN
lsof -nP -iTCP:3082 -sTCP:LISTEN
```

## MinIO (S3-compatible storage)

MinIO is **included by default** when you run `./run-docker-full-stack.sh`. The script auto-configures env vars and starts MinIO + minio-init (creates videos, documents, media buckets).

To start MinIO manually (e.g. if you used `--no-minio` previously):

```bash
docker compose -f docker/docker-compose.yaml --profile minio up -d
```

### Access URLs

| Purpose | URL | Notes |
|---------|-----|-------|
| API | `http://localhost:9000` | Used by the ClassroomIO API for S3-compatible storage |
| Web UI | `http://localhost:9001` | Login to browse buckets, manage objects (default: `minioadmin` / `minioadmin`) |

> **Security:** Change the default credentials (`minioadmin` / `minioadmin`) in production. Set `MINIO_ROOT_USER` and `MINIO_ROOT_PASSWORD` in `.env`, and use the same values for `OBJECT_STORAGE_ACCESS_KEY_ID` and `OBJECT_STORAGE_SECRET_ACCESS_KEY`.

### Environment variables

Set in `.env`:

```bash
# MinIO container credentials (must match OBJECT_STORAGE_* below)
MINIO_ROOT_USER=minioadmin
MINIO_ROOT_PASSWORD=minioadmin

# When API runs in Docker: use minio (Docker service name)
OBJECT_STORAGE_ENDPOINT=http://minio:9000
OBJECT_STORAGE_PUBLIC_ENDPOINT=http://localhost:9000
OBJECT_STORAGE_ACCESS_KEY_ID=minioadmin
OBJECT_STORAGE_SECRET_ACCESS_KEY=minioadmin
OBJECT_STORAGE_FORCE_PATH_STYLE=true
OBJECT_STORAGE_MEDIA_PUBLIC_BASE_URL=http://localhost:9000/media
```

> **API in Docker:** Use `OBJECT_STORAGE_ENDPOINT=http://minio:9000` so the API container can reach MinIO on the Docker network. Use `OBJECT_STORAGE_ENDPOINT=http://localhost:9000` when the API runs locally (e.g. `pnpm api:dev`).

`MINIO_ROOT_USER` and `MINIO_ROOT_PASSWORD` configure the MinIO container. Set them to the same values as `OBJECT_STORAGE_ACCESS_KEY_ID` and `OBJECT_STORAGE_SECRET_ACCESS_KEY` when using the built-in MinIO service.

### MinIO troubleshooting

#### Web UI not loading

MinIO assigns a **random port** for the Web Console by default. If the Web UI at `http://localhost:9001` does not load, your container may have been created before we pinned the console port.

**Fix:** Remove the old container and recreate it:

```bash
docker rm -f cio-minio
docker compose -f docker/docker-compose.yaml --profile minio up -d
```

Our `docker-compose.yaml` uses `--console-address ":9001"` so the Web UI consistently listens on port 9001. Your data is stored in the `minio-data` volume and is preserved across container recreation.

#### Container name conflict

If you see `The container name "/cio-minio" is already in use`, remove the existing container first:

```bash
docker rm -f cio-minio
docker compose -f docker/docker-compose.yaml --profile minio up -d
```

## Related Docs

- `docker/docs/commands.md` for quick command snippets
- `docker/docs/PUBLISHING_IMAGES.md` for Docker Hub publishing
