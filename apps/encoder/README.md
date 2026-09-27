# HLS encoder

Encodes an uploaded video into an adaptive-bitrate HLS ladder. One machine per
job, created by the dispatcher in `apps/jobs/src/workers/media-hls.ts`, which
exits when the job finishes.

## Why it holds no credentials

ffmpeg here processes attacker-supplied media — every upload is attacker-supplied
— so this is the least trusted process in the system. It gets:

- `CIO_SOURCE_URL` — a presigned GET for one object
- `CIO_JOB_TOKEN` — an HMAC token naming one asset, valid for six hours
- `CIO_API_URL` — where to call back
- `CIO_ASSET_ID` — for logging only; the API reads the asset from the token

No database URL, no Redis URL, no storage keys. Output objects are presigned by
the API, which forces every path under the asset's own prefix and restricts them
to playlist and segment content types. Compromising this process yields one
asset.

## The ladder

`p360` + `p720` + `p1080`, source-capped so nothing is upscaled, matching the
rungs the browser encoder uses. Always the full ladder: the browser drops to one
rung above 100 MB because WebCodecs blocks the user, which does not apply here.

One ffmpeg invocation splits the decoded video N ways, so the source is decoded
once. Audio is encoded once and shared via `agroup`. `-preset slow`, since VOD is
encoded once and served many times.

The master playlist is written by `plan.ts`, not ffmpeg: ffmpeg emits an
audio-only variant that would need stripping, and its BANDWIDTH figures are peak
rather than average.

## Deploying

```bash
fly apps create classroomio-encoder
fly deploy --config apps/encoder/fly.toml --dockerfile apps/encoder/Dockerfile .
```

Then point the dispatcher at the published image:

```bash
# on the jobs service
FLY_API_TOKEN=...            # a deploy token for this app
FLY_APP_NAME=classroomio-encoder
FLY_ENCODER_IMAGE=registry.fly.io/classroomio-encoder:deployment-...
FLY_ENCODER_REGION=iad
ENCODER_CALLBACK_API_URL=https://api.classroomio.com
HLS_SIGNING_SECRET=...       # must match the API's value
FLY_ENCODER_MAX_SOURCE_BYTES=2147483648   # optional; defaults to 2GiB in the encoder
```

Machines are created through the Machines API, which does not inherit `fly.toml`'s
`[env]`, so every variable the encoder reads is passed per job by the dispatcher.
That is why the source-size ceiling is configured here and not in `fly.toml`.

`HLS_SIGNING_SECRET` is already used for playback cookies. The dispatcher signs
job tokens with it and the API verifies them, so both sides must agree.

With `FLY_API_TOKEN`, `FLY_APP_NAME`, `FLY_ENCODER_IMAGE` or
`ENCODER_CALLBACK_API_URL` unset, dispatch is skipped and assets are marked
`skipped` rather than queueing behind an encoder that does not exist.
