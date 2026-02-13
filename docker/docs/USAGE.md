# Docker Usage Guide

This directory contains Docker files for local self-hosting and image publishing.

## Stack Overview

`docker/docker-compose.yaml` starts these services:

- `postgres`: primary database used by `@cio/db` and `@cio/api`
- `redis`: cache/rate-limit store used by `@cio/api`
- `db-init`: one-off setup job (`pnpm --filter @cio/db db:setup`, which creates required roles and syncs schema)
- `api`: backend service on `http://localhost:3081`
- `dashboard`: frontend service on `http://localhost:3082`

Notes:

- Postgres and Redis are internal-only in compose (not exposed on host ports by default).
- `db-init` is expected to exit with code `0` after setup.
- If you run seed-only commands, make sure setup has already run once so schema exists.

## Quick Start

Run from the repository root:

```bash
./run-docker-full-stack.sh
```

Verify:

```bash
docker compose -p classroomio -f docker/docker-compose.yaml ps
curl -sS http://localhost:3081/
curl -I http://localhost:3082/
```

Expected:

- API returns welcome JSON
- Dashboard returns `HTTP/1.1 200 OK`

## API-Only Smoke Test

If you only want to validate API startup (recommended first check):

```bash
docker compose -p classroomio -f docker/docker-compose.yaml up --build -d postgres redis db-init api
docker compose -p classroomio -f docker/docker-compose.yaml ps
docker compose -p classroomio -f docker/docker-compose.yaml logs --tail=100 api
curl -sS http://localhost:3081/
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
- The script keeps `PRIVATE_SERVER_KEY` and `AUTH_BEARER_TOKEN` aligned for dashboard server-side API calls.

## Common Commands

```bash
# Start / rebuild
docker compose -p classroomio -f docker/docker-compose.yaml up --build -d

# Stream logs
docker compose -p classroomio -f docker/docker-compose.yaml logs -f api dashboard

# Stop
docker compose -p classroomio -f docker/docker-compose.yaml down

# Stop and remove volumes (deletes local DB/cache data)
docker compose -p classroomio -f docker/docker-compose.yaml down -v
```

## Troubleshooting

### API or dashboard fails to start

```bash
docker compose -p classroomio -f docker/docker-compose.yaml logs --tail=200 api dashboard db-init postgres redis
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
- `docker/docs/README.md` for Docker Hub publishing
