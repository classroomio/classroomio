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
./run-docker-full-stack.sh

# Skip image rebuild and only start containers
./run-docker-full-stack.sh --no-build
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

SERVER_URL=https://api.your-domain.com
PUBLIC_SERVER_URL=https://api.your-domain.com
PRIVATE_SERVER_URL=http://api:3081
TRUSTED_ORIGINS=https://app.your-domain.com
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

CLOUDFLARE_BUCKET_DOMAIN=
CLOUDFLARE_ACCESS_KEY=
CLOUDFLARE_SECRET_ACCESS_KEY=
CLOUDFLARE_ACCOUNT_ID=
CLOUDFLARE_RENDERING_API_KEY=

UNSPLASH_API_KEY=
```

Important:

- `./run-docker-full-stack.sh` auto-generates secure `AUTH_BEARER_TOKEN`/`PRIVATE_SERVER_KEY` values when missing or insecure placeholders are used.
- `./run-docker-full-stack.sh` always uses root `.env` (`docker compose --env-file .env ...`) so compose build/runtime variables come from repository-root `.env`.
- API key middleware for dashboard/server-to-server calls validates `PRIVATE_SERVER_KEY`.
- `AUTH_BEARER_TOKEN` is a separate token and is not used by `apiKeyMiddleware`.
- Dashboard URL selection is environment-aware: browser calls use `PUBLIC_SERVER_URL`, while SSR/server-side calls use `PRIVATE_SERVER_URL` (fallback: `PUBLIC_SERVER_URL`).
- In Docker, set `PRIVATE_SERVER_URL=http://api:3081` for internal service-to-service traffic, and keep `PUBLIC_SERVER_URL` as your public API URL (do not use `localhost` in hosted deployments).

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

## Troubleshooting

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

## Related Docs

- `docker/docs/commands.md` for quick command snippets
- `docker/docs/PUBLISHING_IMAGES.md` for Docker Hub publishing
