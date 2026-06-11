# ClassroomIO — Local Dev Setup Guide

A practical guide to running classroomio locally for development, plus a
troubleshooting reference for the errors you're likely to hit. Use it to set up a
fresh machine or to onboard a new contributor.

> Works on macOS, Linux, and Windows. **Windows users:** run the interactive
> commands in **Git Bash** (Unix commands like `cp` work there). The repo's package
> scripts are already cross-platform.

---

## 1. Prerequisites

| Tool | Version | Required? | Notes |
|------|---------|-----------|-------|
| Node.js | 20.x (`.nvmrc` = v20.19.3) | **Required** | `nvm install && nvm use` |
| pnpm | 10.x | **Required** | The package scripts call `pnpm` directly (e.g. `build:clean` runs `pnpm run build`) — npm/yarn are not supported substitutes. `corepack enable` then `corepack prepare pnpm@latest --activate`, or `npm i -g pnpm` |
| Docker (Desktop) | latest | **Required** | Runs Postgres + Redis (and optionally MinIO). No local install of those needed. |
| Git | latest | **Required** | Windows: includes Git Bash |
| ffmpeg / ffprobe | latest | Optional | Only for media/thumbnail background jobs |

---

## 2. Setup steps

### Step 1 — Install dependencies
```bash
pnpm i
```

### Step 2 — Create the `.env` files
Each app/package reads its **own** `.env`. Copy each `.env.example` to `.env` and fill
the values below. These are safe local-dev values (the same defaults the Docker stack
uses, with host ports). The two `PRIVATE_SERVER_KEY` values **must match**.

**`apps/api/.env`**
```bash
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/classroomio"
REDIS_URL="redis://localhost:6379"
PUBLIC_SERVER_URL="http://localhost:3002"
TRUSTED_ORIGINS="http://localhost:5173"        # the dashboard dev origin
BETTER_AUTH_SECRET="local-dev-only-secret-change-this"
AUTH_BEARER_TOKEN="local-dev-api-key"
PRIVATE_SERVER_KEY="local-dev-api-key"          # must match the dashboard
```

**`apps/dashboard/.env`**
```bash
PUBLIC_SERVER_URL="http://localhost:3002"
PRIVATE_SERVER_URL="http://localhost:3002"      # used by the SSR auth proxy — required for login
PRIVATE_SERVER_KEY="local-dev-api-key"          # must match the API
PUBLIC_IS_SELFHOSTED=true
```

**`apps/jobs/.env`** — only if you'll run the background workers (`pnpm api:dev` starts
them). Simplest: copy the API env, which already has `REDIS_URL` + `DATABASE_URL`.
```bash
cp apps/api/.env apps/jobs/.env
```

**`packages/db/.env`** — used by the DB setup scripts (Step 4). Created there.

> Why so many? The dashboard calls the API through a **server-side proxy**
> (`/api/auth/*`), so it needs `PRIVATE_SERVER_URL`. The API's better-auth needs
> `BETTER_AUTH_SECRET` (to sign sessions) and `TRUSTED_ORIGINS` (to trust the
> dashboard origin). Server-to-server data calls use the shared `PRIVATE_SERVER_KEY`.

### Step 3 — Start infrastructure (Postgres + Redis)
```bash
docker compose -f docker/docker-compose.yaml up -d postgres redis
```
(Optional — object storage for uploads:
`docker compose -f docker/docker-compose.yaml --profile minio up -d minio minio-init`.)

### Step 4 — Set up + seed the database
```bash
cp packages/db/.env.example packages/db/.env     # contains DATABASE_URL for the db scripts
pnpm --filter @cio/db db:setup:seed              # creates schema + demo data
```

### Step 5 — Build the shared packages once
```bash
pnpm build
```
The dashboard/api import workspace libs (`@cio/ui`, `@cio/api`, `@cio/db`, …) from
their `dist/`, which only exists after a build. (If `@cio/jobs-worker` fails here on
`ffmpegProbeLuma`, that's a known branch bug — see Known issues; it doesn't block
dashboard/api.)

### Step 6 — Run the app (two terminals)
```bash
pnpm api:dev          # API (port 3002) + background workers
pnpm dashboard:dev    # dashboard UI (port 5173)
```
> Don't use `pnpm dev` — it tries to start the whole monorepo (~20 services) and
> currently trips a turbo concurrency limit. The two scoped commands above are the
> day-to-day workflow.

### Step 7 — Log in
Open http://localhost:5173/login → `admin@test.com` / `123456`.

### Email (optional)
Email is **off by default** and the app runs fine without it. You only need it to
test auth emails (verify/reset) and notifications.

To enable, set the SMTP vars in **`apps/api/.env`** (auth-flow emails) and
**`apps/jobs/.env`** (all other emails) — both can point at the same server:
```bash
SMTP_HOST=  SMTP_PORT=  SMTP_USER=  SMTP_SENDER=  SMTP_PASSWORD=
```
Any SMTP provider works (Zoho ZeptoMail, Resend, Gmail SMTP, or Mailtrap for
throwaway testing). See the inline notes in [`apps/api/.env.example`](apps/api/.env.example)
for which emails each process sends.

**Cost:** most providers have a free tier for low volume; sustained/high volume is
paid. For local dev a free sandbox (e.g. Mailtrap) or a provider's free tier is
enough — developing costs nothing.

---

## 3. Ports

| Service     | URL / Port            | Notes                            |
|-------------|-----------------------|----------------------------------|
| API         | http://localhost:3002 | backend (`API_PORT` default)     |
| Dashboard   | http://localhost:5173 | Vite dev server                  |
| Postgres    | localhost:5432        | Docker container `cio-postgres`  |
| Redis       | localhost:6379        | Docker container `cio-redis`     |
| MinIO       | 9000 / console 9001   | only if started (optional)       |
| jobs-worker | (none)                | background worker, no HTTP port  |

## 4. Demo accounts

Seeded accounts use password **`123456`** (verified against the seed's bcrypt hashes):

- `admin@test.com` / `123456`  (admin — "Elon Gates")
- `enterprise@test.com`, `early-adopter@test.com`, and the `*-student@test.com`
  accounts — also `123456`

> `test@test.com`'s seed hash doesn't match common passwords — use `admin@test.com`.

---

## 5. Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| `no such service: db-init` | `db-init` was removed; the `api` container now runs DB setup | Don't reference `db-init`. For host dev use `db:setup:seed` (Step 4). |
| `DATABASE_URL or PRIVATE_DATABASE_URL ... required` | `packages/db/.env` missing (db scripts read their own dir) | `cp packages/db/.env.example packages/db/.env` |
| `password authentication failed for user "postgres"` | `localhost:5432` is another project's Postgres, not classroomio's | Stop the other container / free port 5432, then recreate: `docker compose -f docker/docker-compose.yaml up -d postgres` |
| `Failed to resolve entry for package "@cio/*"` | shared packages not built (`dist/` missing) | `pnpm build`, then re-run the dev commands |
| `'rm'/'cp' is not recognized` or `spawn EINVAL` (Windows) | Unix command / `.cmd` spawn in a script | Already fixed in-repo (rimraf, Node copy, `shell:true`). Run `pnpm i` to get latest. |
| `invalid task configuration … N persistent tasks … concurrency` | `pnpm dev` starts the whole monorepo past turbo's cap | Use scoped `pnpm api:dev` + `pnpm dashboard:dev` instead |
| `ZodError … REDIS_URL ... expected string, received undefined` | `apps/jobs/.env` missing `REDIS_URL` | `cp apps/api/.env apps/jobs/.env` and set `REDIS_URL=redis://localhost:6379` |
| `API upstream not configured` (502) on login | dashboard SSR proxy has no upstream | Set `PRIVATE_SERVER_URL=http://localhost:3002` in `apps/dashboard/.env`, restart dashboard |
| Login `Invalid email or password` | wrong demo password | Use `admin@test.com` / **`123456`** |
| Login still fails after upstream fix | API auth env empty | Fill `BETTER_AUTH_SECRET`, `TRUSTED_ORIGINS=http://localhost:5173`, `PUBLIC_SERVER_URL` in `apps/api/.env`, restart API |
| Changed a `.env` but nothing changed | env is read at process start | Restart the affected `*:dev` server |

> After editing any `.env`, **restart** the relevant dev server.

---

## 6. Known issues (not setup problems)

- **`ffmpegProbeLuma` not exported** — branch bug (commit `78ab13f54`):
  `apps/jobs/src/processors/media/generate-thumbnail.ts` imports `ffmpegProbeLuma`
  but `apps/jobs/src/utils/ffmpeg.ts` doesn't export it. Crashes the two **media**
  workers only; API / dashboard / emails / maintenance are fine. For the
  thumbnail-feature owner.
- **ffmpeg/ffprobe not installed** — media jobs need these binaries on `PATH` (or set
  `FFMPEG_PATH` / `FFPROBE_PATH`). Other workers are unaffected.
- **`pnpm dev` concurrency** — full-stack run needs a turbo `--concurrency` bump;
  intentionally not changed. Use the scoped workflow.

## 7. Windows notes

- Use **Git Bash** for interactive commands (`cp`, `rm`, etc.).
- The repo's package scripts were made cross-platform (`rimraf` instead of `rm -rf`,
  a Node postinstall, a Node file-copy, and `shell:true` when scripts spawn pnpm), so
  `pnpm i` / `pnpm build` work in `cmd.exe`/PowerShell too.

