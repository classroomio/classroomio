# @cio/jobs-worker

BullMQ worker process for ClassroomIO. Runs every background job the
`@cio/api` enqueues — emails, lesson video post-processing (probe / thumbnail /
extract-audio / transcribe), and maintenance tasks.

The worker is a separate Node process from the API. They communicate **only**
through Redis. Stop the worker, restart the worker, redeploy the worker — the
API keeps serving requests; queued work just waits in Redis until a worker
picks it up.

## How it fits together

```
┌──────────┐  enqueue(payload)   ┌───────┐  pop job   ┌─────────────────┐
│  @cio/api │ ──────────────────▶ │ Redis │ ─────────▶ │ @cio/jobs-worker │
└──────────┘                     └───────┘            └─────────────────┘
      ▲                                                        │
      │ HTTP                                          provider │
      │                                                  call ▼
   browser                                            ┌─────────────────┐
                                                     │ SMTP / S3 / etc │
                                                     └─────────────────┘
```

| Layer                         | Responsibility                                                                                                                                                 |
| ----------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `@cio/api` services           | Validate input, write domain rows, then enqueue jobs via `enqueueTransactionalEmail` / `enqueueRawEmail` / `startMediaJob`. Returns to the client immediately. |
| Redis (BullMQ)                | Persistent job queue. Tracks state (`waiting`, `active`, `completed`, `failed`), retries with exponential backoff, retention.                                  |
| `@cio/jobs-worker` (this app) | Pops jobs, calls the provider (`@cio/email`, `ffmpeg`, OpenAI, …), updates `media_job` rows where applicable, dead-letters terminal failures.                  |

### Heads-up: the API still sends a few emails directly

Auth-flow emails are sent synchronously by `@cio/api` — **not** queued.
They're the four templates Better Auth needs in-line during sign-up / password
recovery (the user is waiting for a link to arrive in their inbox):

- `forgotPassword`
- `onPasswordReset`
- `verifyEmail` (sign-up + email-change)

So **both processes need SMTP credentials**. They can point at the same SMTP
server. Everything else (welcome, invites, newsfeed, course completion,
payment requests, the public `/mail` route, submission notifications) goes
through this worker.

### Queues

| Queue              | Jobs                                                    | Where the payload comes from                                                                  |
| ------------------ | ------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| `emails`           | `send`                                                  | `enqueueTransactionalEmail` / `enqueueRawEmail` in `apps/api/src/services/jobs/email-jobs.ts` |
| `media`            | `probe-metadata`, `generate-thumbnail`, `extract-audio` | `startMediaJob` after a video asset upload                                                    |
| `media-transcribe` | `transcribe-audio`                                      | Same flow; only enqueued when `OPENAI_API_KEY` is set                                         |
| `maintenance`      | `retention-compact`, `dead-letter-cleanup`              | Repeatable scheduled jobs                                                                     |

### Persisted state (Postgres)

The worker writes to three tables:

- `media_job` — user-visible processing state (queued → probing → thumbnailing → extracting → completed). Surfaces as the upload progress bar in the dashboard.
- `job_step` — per-step idempotency ledger so retries skip already-finished work (e.g. don't re-upload a thumbnail).
- `dead_letter_job` — terminal failures after BullMQ exhausts retries. Used for operator triage.

Email jobs intentionally don't have a parallel DB ledger - BullMQ's own job
state (visible via bull-board, see below) is the source of truth for "did this
email send?", and `dead_letter_job` captures final failures.

## Running locally

### Prerequisites

1. Redis on `localhost:6379` (e.g. `docker run --rm -d -p 6379:6379 redis:7-alpine`)
2. Postgres reachable via `DATABASE_URL`
3. `ffmpeg` + `ffprobe` on `$PATH` (only required for the media worker —
   emails and maintenance workers boot fine without them; the worker logs a
   warning at startup if missing and media jobs will fail until it's installed)
   - macOS: `brew install ffmpeg`
   - Debian/Ubuntu: `apt install ffmpeg`
   - Override with `FFMPEG_PATH` / `FFPROBE_PATH` for non-standard locations.

### Env

The worker reuses most of `apps/api/.env`. The fastest setup is to symlink:

```bash
cd apps/jobs
ln -s ../api/.env .env
```

Or copy `.env.example` and fill in the values. The bare minimum to boot is
`REDIS_URL`. Add `DATABASE_URL` + `SMTP_*` for emails to actually send, and
`OBJECT_STORAGE_*` for media jobs to read source video files.

See [`.env.example`](./.env.example) for the full list with comments.

### Start

From the repo root:

```bash
# In one terminal — API
pnpm api:dev

# In another terminal — worker (runs media + emails + maintenance in parallel)
pnpm jobs:dev
```

Or run a single worker directly:

```bash
cd apps/jobs
pnpm dev:emails        # just the emails queue
pnpm dev:media         # just the media queue
pnpm dev:maintenance   # just retention / dead-letter cleanup
```

The worker prints `email-worker-ready`, `media-worker-ready`, etc. once it
connects to Redis. After that, every enqueue from the API logs an
`email-job-start` → `email-sent` (or `email-job-failed`) line.

## Smoke test

```bash
# Hit the API mail route — accepts immediately, returns 202 + jobIds
curl -X POST http://localhost:8787/mail \
  -H 'Content-Type: application/json' \
  -H 'x-api-key: <api key>' \
  -d '[{"to":"you@example.com","subject":"BullMQ test","content":"<p>hi</p>"}]'

# Watch the worker terminal for:
# [email-job-start] jobName=send bullmqJobId=… attempt=1
# [email-sent]      kind=raw recipient=you@example.com providerId=…
```

### Manually re-trigger transcription (uploaded lesson videos)

After a video upload, transcription usually runs as part of the media pipeline. You can **enqueue only extract-audio → Whisper** for an existing S3-backed video asset:

```bash
# Replace <org header> and Bearer token with a normal member session for the org.
curl -X POST "http://localhost:8787/jobs/media/asset/<assetId>/transcribe" \
  -H "Authorization: Bearer <jwt>" \
  -H "cio-org-id: <organizationUuid>" \
  -i
```

| HTTP    | Meaning                                                                            |
| ------- | ---------------------------------------------------------------------------------- |
| **202** | Job created and enqueued (`success: true`, `data` is the new `media_job` row).     |
| **503** | `OPENAI_KEY_MISSING` — `OPENAI_API_KEY` is not set on the API.                     |
| **400** | `ASSET_NOT_TRANSCRIBABLE` — not an upload video with storage, or wrong asset kind. |
| **409** | Another active `media_job` already exists for this asset.                          |

To inspect the queue without a UI:

```bash
redis-cli LLEN bull:emails:wait      # waiting jobs
redis-cli LLEN bull:emails:active    # currently processing
redis-cli LLEN bull:emails:failed    # exhausted retries
```

For a real UI, ClassroomIO mounts [Workbench](https://github.com/pontusab/workbench)
in `apps/api` at `/admin/queues`.

## Behaviour matrix when the worker is down

| Scenario                 | API behaviour                                                                                         | Job state                                                                           |
| ------------------------ | ----------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| Worker stopped, Redis up | API enqueues normally, returns success                                                                | Sits in `waiting`. Drains as soon as the worker starts.                             |
| Worker + Redis both down | Email helper logs once, returns empty result; media falls back to a `media_job` row with no BullMQ id | Domain action still succeeds; work is dropped (email) or stuck in `queued` (media). |
| Worker crashes mid-job   | Other workers / next worker boot picks up retry                                                       | BullMQ moves the job back to `waiting` after the visibility timeout.                |
| Job exhausts all retries | API unaffected                                                                                        | Row in `dead_letter_job` for triage.                                                |

## Production

Run the worker as its own service alongside the API. They scale independently

- typically you want N API instances for HTTP concurrency and a smaller fixed
  number of worker instances tuned via `*_WORKER_CONCURRENCY` env vars.

Use `node dist/index.js` to run all queues in one process, or
`node dist/workers/<name>.js` to run them as separate services (recommended for
prod so a slow media job can't starve email throughput).

The included `Dockerfile` installs `ffmpeg` and ships the all-in-one entry
point.
