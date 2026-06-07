# ClassroomIO Backend

## Supported Features

1. Certificate download for students.
2. Uploading videos to cloudflare (for storage) and Muse.ai (for transcription)

## Running locally with video upload + playback

Lesson videos run through an HLS pipeline on Cloud. The browser encodes a
360/720/1080 ABR ladder with Mediabunny, uploads segments to R2 via presigned
PUTs, and the player loads `/hls/{assetId}/master.m3u8` from the API.

How `/hls/*` resolves depends on the environment:

|                         | URL the browser hits                           | Who serves the bytes                                                                                                                       |
| ----------------------- | ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| Cloud production        | `https://<tenant-host>/hls/...`                | Cloudflare Worker (`apps/tenant-router`) — intercepts the path and streams directly from an R2 binding. Render is never in the bytestream. |
| Local dev / self-hosted | `${PUBLIC_SERVER_URL}/hls/...` (direct to API) | Hono streaming route on the API — session-auth, then `getS3Client().send(GetObjectCommand)`.                                               |

**Self-hosted (`PUBLIC_IS_SELFHOSTED=true`) skips HLS entirely** and falls
back to raw-MP4 upload — no R2-specific code path. Everything below is for
Cloud-style local development.

### Required env

`apps/api/.env`:

```bash
# Object storage — Cloudflare R2 OR an S3-compatible local backend (MinIO, etc.)
CLOUDFLARE_ACCOUNT_ID=…
CLOUDFLARE_ACCESS_KEY=…
CLOUDFLARE_SECRET_ACCESS_KEY=…
# (or OBJECT_STORAGE_ENDPOINT / OBJECT_STORAGE_ACCESS_KEY_ID / OBJECT_STORAGE_SECRET_ACCESS_KEY)

# Optional — only needed if you want extract-audio → Whisper transcripts
OPENAI_API_KEY=…

# Optional — Redis enables the BullMQ media job pipeline. Without it the
# asset row is still created, but no transcription/thumbnail jobs run.
REDIS_URL=redis://localhost:6379

# Only required when you want to exercise the production cookie-mint path
# (`POST /organization/assets/:assetId/hls/cookie`). Locally the Hono /hls/*
# route uses session auth, so most of the time you can leave this unset.
# Same value must also be set as a Cloudflare secret on tenant-router for prod.
HLS_SIGNING_SECRET=…
```

`apps/dashboard/.env`:

```bash
# Already required by the existing API client — used as the HLS base URL too.
PUBLIC_SERVER_URL=http://localhost:3000
```

### Run

```bash
pnpm --filter @cio/api dev
pnpm --filter @cio/dashboard dev
# (optional) pnpm --filter @cio/jobs dev  # for transcription + thumbnail jobs
```

Drop a video into a lesson; the dashboard encodes locally, you'll see
segments arrive under `videos/{assetId}/hls/…` in R2 and an `assets` row with
`hls_manifest_key` populated. Playback flows directly browser → API → R2 —
**no wrangler dev needed locally.**

### Production setup (one-time)

For Cloud deployment, generate the HMAC signing key the Worker uses to verify
playback cookies and set it on both sides:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```

```bash
# On Render (apps/api service env):
HLS_SIGNING_SECRET=<paste>

# On Cloudflare (apps/tenant-router):
pnpm --filter @cio/tenant-router exec wrangler secret put HLS_SIGNING_SECRET
# paste the same value when prompted
```

## Debugging Fly.io

View logs from fly.io in real time
