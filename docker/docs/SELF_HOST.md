# ClassroomIO Docker Self-Hosting

## Prerequisites

- Docker Desktop installed and running
- `git` installed

## Quick Start

```bash
git clone https://github.com/classroomio/classroomio.git
cd classroomio
cp .env.example .env
# Edit .env — set your domain, secrets, and ALLOWED_EXTERNAL_DOMAINS
./run-docker-full-stack.sh
```

The script builds and starts: **postgres**, **redis**, **minio** (object storage), **db-init** (schema setup), **api** (`localhost:3081`), and **dashboard** (`localhost:3082`).

It auto-generates secure values for `AUTH_BEARER_TOKEN` and `PRIVATE_SERVER_KEY` when they are missing.

## Environment Variables

All Docker services read from a single root `.env` file. See [`.env.example`](../../.env.example) for the full annotated template with required/optional grouping.

Key points:

- **Required:** `PUBLIC_SERVER_URL`, `TRUSTED_ORIGINS`, `BETTER_AUTH_SECRET`, `PUBLIC_IS_SELFHOSTED=true`, `ALLOWED_EXTERNAL_DOMAINS`, `DASHBOARD_ORIGIN`.
- **Auth cookies:** Set `AUTH_COOKIE_DOMAIN` to your root domain (e.g. `.yourdomain.com`) when API and dashboard use different subdomains. Without it, auth cookies may not be set and login will fail.
- **Auto-generated:** `AUTH_BEARER_TOKEN`, `PRIVATE_SERVER_KEY` (by `./run-docker-full-stack.sh`).
- **Auto-configured:** All `MINIO_*` / `OBJECT_STORAGE_*` vars (by the startup script).
- **Optional:** Email (SMTP or Zoho), Google OAuth, Unsplash, `LICENSE_KEY` (enterprise).

`PRIVATE_SERVER_KEY` must be the same value in both API and dashboard — the script ensures this.

## Verify

```bash
docker compose --env-file .env -p classroomio -f docker/docker-compose.yaml ps
curl -sS http://localhost:3081/    # API — returns JSON
curl -I  http://localhost:3082/    # Dashboard — returns 200
```

## Seed Demo Data

```bash
docker compose --env-file .env -p classroomio -f docker/docker-compose.yaml \
  run --rm db-init sh -c "pnpm --filter @cio/db db:setup -- --seed"
```

## Command Reference

All commands use this prefix — abbreviated as `dc` below:

```
dc = docker compose --env-file .env -p classroomio -f docker/docker-compose.yaml
```

| Task | Command |
|------|---------|
| Full stack (with MinIO) | `./run-docker-full-stack.sh` |
| Skip image rebuild | `./run-docker-full-stack.sh --no-build` |
| Exclude MinIO | `./run-docker-full-stack.sh --no-minio` |
| API-only smoke test | `dc up --build -d postgres redis db-init api` |
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

Container names: `cio-postgres`, `cio-redis`, `cio-api`, `cio-dashboard`, `cio-minio`.

## MinIO (Object Storage)

MinIO is included by default. The startup script auto-configures env vars, starts MinIO, and creates `videos`, `documents`, and `media` buckets.

- **API endpoint:** `http://localhost:9000`
- **Web UI:** `http://localhost:9001` (default: `minioadmin` / `minioadmin`)

To start MinIO manually (e.g. after `--no-minio`):

```bash
docker compose -f docker/docker-compose.yaml --profile minio up -d
```

**Security:** Change `MINIO_ROOT_USER` / `MINIO_ROOT_PASSWORD` in `.env` for production. Use the same values for `OBJECT_STORAGE_ACCESS_KEY_ID` / `OBJECT_STORAGE_SECRET_ACCESS_KEY`.

### MinIO Web UI Not Loading

If port 9001 does not respond, recreate the container:

```bash
docker rm -f cio-minio
docker compose -f docker/docker-compose.yaml --profile minio up -d
```

Data is preserved in the `minio-data` volume.

## Rebuild After Code Changes

This setup builds images from source (no live hot reload). Code changes require a rebuild:

```bash
# One service
docker compose --env-file .env -p classroomio -f docker/docker-compose.yaml up -d --build api

# Both (e.g. shared packages/* changed)
docker compose --env-file .env -p classroomio -f docker/docker-compose.yaml up -d --build api dashboard

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
docker compose --env-file .env -p classroomio -f docker/docker-compose.yaml restart minio
```

### SMTP Errors in Logs

`ECONNREFUSED 127.0.0.1:465` means SMTP is not configured. This does not block startup — configure SMTP or Zoho when you need email.

### Port Conflicts

```bash
lsof -nP -iTCP:3081 -sTCP:LISTEN
lsof -nP -iTCP:3082 -sTCP:LISTEN
```

## Related

- [Self-hosting docs](https://classroomio.com/docs/quickstart/self-hosting) — published guide with Railway + Docker instructions
- [`docker/docs/PUBLISHING_IMAGES.md`](PUBLISHING_IMAGES.md) — publishing Docker images to Docker Hub
