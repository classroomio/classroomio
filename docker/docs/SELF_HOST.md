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

# Email delivery (choose one approach)
# Option A: Zoho/ZeptoMail token
ZOHO_TOKEN=

# Option B: SMTP
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASSWORD=
SMTP_SENDER=
EOF
```

Important:

- `./run-docker-full-stack.sh` auto-generates secure values for `AUTH_BEARER_TOKEN` and `PRIVATE_SERVER_KEY` when missing/insecure.
- `./run-docker-full-stack.sh` always uses root `.env` (`docker compose --env-file .env ...`) for compose build/runtime variables.
- API key middleware for dashboard/server-to-server calls validates `PRIVATE_SERVER_KEY`.
- `AUTH_BEARER_TOKEN` is separate and is not used by `apiKeyMiddleware`.
- Dashboard API URL behavior is split by environment: browser requests use `PUBLIC_SERVER_URL`, and server-side dashboard requests use `PRIVATE_SERVER_URL` (fallback: `PUBLIC_SERVER_URL`).
- In hosted deployments, `PUBLIC_SERVER_URL` must be your public API domain (not `localhost`), while Docker internal SSR calls should use `PRIVATE_SERVER_URL=http://api:3081`.
- `AUTH_COOKIE_DOMAIN` is optional. Leave it empty for Better Auth defaults, or set it to `.your-domain.com` (shared cookies across subdomains) or your API host domain when you need explicit cookie domain control.
- Do not use invalid domains (for example `b.com` or `.com` when your backend is `api.b.com`); use `.b.com` or the exact backend host.
- For email sending, configure either `ZOHO_TOKEN` or a full SMTP config (`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_SENDER`).
- If neither Zoho token nor SMTP is configured, emails will not send.
- Keep real secrets out of version control.

## 4. Start Full Docker Stack

From repo root:

```bash
./run-docker-full-stack.sh

# Skip image rebuild and only start containers
./run-docker-full-stack.sh --no-build
```

This script:

- builds and starts `postgres`, `redis`, `db-init`, `api`, and `dashboard`
- prints compose status
- checks API (`3081`) and dashboard (`3082`) endpoints

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

## 10. If Docker Fails with "No space left on device"

```bash
docker builder prune -f
docker image prune -a
```
