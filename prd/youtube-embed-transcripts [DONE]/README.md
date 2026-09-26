---
name: YouTube Embed Transcripts
overview: Fetch and persist captions for YouTube videos embedded in lessons, then reuse that stored text for AI chat context and the existing transcript UI. Cache by YouTube video ID so the provider is only hit once per video.
todos:
  - id: prd-review
    content: Confirm provider (Supadata native captions), paid-plan gate, and legal approval for storing third-party public captions
    status: pending
  - id: caption-cache
    content: Add youtube_caption_cache keyed by YouTube video ID plus language, and write through to media_transcript for the lesson asset
    status: pending
  - id: provider-adapter
    content: Implement a pluggable caption provider with Supadata as the default production adapter and graceful unavailable states
    status: pending
  - id: agent-tools
    content: Extend get_lesson_transcript and read_lesson_transcript to include YouTube embeds via cache-first then provider fetch
    status: pending
  - id: prefetch-on-embed
    content: Enqueue a background caption fetch when a paid org embeds a YouTube video so the first chat turn is a cache hit
    status: pending
  - id: transcript-ui
    content: Reuse the existing lesson transcript panel and captions track for YouTube assets once media_transcript exists
    status: pending
  - id: plan-gating
    content: Gate provider fetches to paid cloud plans; self-hosted ungated; free orgs keep the current no-transcript behavior
    status: pending
  - id: observability
    content: Log cache hits, provider calls, failures, language, and cost so we can tune quotas and detect blocks
    status: pending
isProject: false
---

# YouTube Embed Transcripts PRD

## Status

- Draft

## Date

- August 14, 2026

## Purpose

When a lesson embeds a YouTube video, ClassroomIO should be able to obtain that video's spoken content as text, store it, and reuse it the same way uploaded-video transcripts already work.

The first consumer is AI chat in a lesson: the agent already reads lesson notes and uploaded-video transcripts, but it cannot answer questions about an embedded YouTube video. After this ships, asking "what did the video say about X?" should work for YouTube embeds on paying workspaces, without calling an external API on every question.

## Does this already exist?

**No. This product capability is not in the platform today.**

What exists:

| Capability | Current state |
| --- | --- |
| YouTube lesson embeds | Shipped. Teachers paste a YouTube URL; the lesson stores `type: 'youtube'` and creates an `assets` row with `provider: 'youtube'` and an `assetId`. |
| YouTube ID / metadata | Shipped. `packages/core/src/services/assets/assets.ts` parses video IDs and fetches oEmbed title/thumbnail/duration. |
| Uploaded-video transcripts | Shipped. Jobs extract audio, Whisper transcribes into `media_transcript` keyed by `assetId`. Teachers can view, edit, and caption from the lesson transcript panel. |
| AI lesson context | Shipped. Teacher tool `get_lesson_transcript` and student tool `read_lesson_transcript` load `media_transcript` for uploaded assets only. |
| YouTube caption fetch | **Missing.** Those tools currently return: *"Only uploaded videos are transcribed — embedded links (YouTube, Google Drive, etc.) are not."* Transcription jobs refuse `provider !== 'upload'`. The transcript panel only registers upload assets. |
| Legacy `video_transcripts` table | Unused leftover (`muse_svid`). Do not reuse it. |

Related PRDs that are **not** this feature:

- [`prd/youtube-research-courses`](../youtube-research-courses/README.md) — a research workflow that *discovers* YouTube videos and builds a course. It calls out the same transcript gap and proposes a `youtube_video_transcript` table for research candidates. This PRD is the smaller, lesson-scoped capability, and should become the shared caption cache that research courses later reuse.
- [`prd/study-from-source`](../study-from-source/README.md) — document / URL / pasted-text ingestion. YouTube is explicitly out of scope there.
- [`prd/embed-link-platforms.md`](../embed-link-platforms.md) — Twitter/Vimeo embeds. Transcripts for those platforms are a non-goal.
- [`prd/ai-course-assistant [DONE]`](../ai-course-assistant%20[DONE]/README.md) — shipped in-course agent. This feature extends its existing transcript tool rather than adding a parallel chat product.

## Problem Statement

Teachers commonly teach from YouTube instead of uploading a file. Learners then ask the AI tutor about what the video explained.

Today the agent makes two content reads:

1. Lesson notes / HTML (`get_lesson_content` / `read_lesson`).
2. Uploaded-video transcript (`get_lesson_transcript` / `read_lesson_transcript`).

If the lesson only has a YouTube embed, step 2 is empty. The model has no spoken-content context, so it guesses, refuses, or answers from the notes alone.

Fetching captions on every chat turn would be slow, expensive, and fragile. The product need is: **get the transcript once, persist it, reuse it everywhere transcripts already appear.**

## Goals

1. Give AI chat (teacher agent and student tutor) the spoken content of YouTube videos embedded in the current lesson.
2. Persist captions so the second request for the same YouTube video does not hit the provider.
3. Reuse the existing `media_transcript` consumer path so captions, the side panel, and agent tools do not grow a second transcript model.
4. Cache by **YouTube video ID**, not only by lesson `assetId`, because embedding the same URL today creates a new asset each time.
5. Gate provider spend to paying cloud orgs. Self-hosted is ungated when a provider key is configured.
6. Fail clearly when captions are missing, private, age-restricted, or disabled — never invent a transcript.
7. Keep the provider swappable. Official YouTube caption download is not a viable default for third-party public videos.

## Non-Goals (v1)

- Downloading, hosting, or re-encoding YouTube video/audio files.
- Whisper / audio transcription of third-party YouTube videos when no captions exist (legal and ToS review required; deferred).
- Google Drive, Vimeo, Twitter/X, Loom, or generic iframe transcripts.
- A new student-facing "fetch captions" button as the primary flow (lazy AI fetch + embed prefetch are enough).
- Translating captions into another language in v1 (store the best available track; prefer lesson locale, then English, then default).
- Owner-only official YouTube Data API OAuth (useful later for orgs that embed *their own* channel).
- Building the YouTube Research Courses product. This PRD only supplies the caption-cache layer that product can call.

## Product Decisions

1. **Working name:** YouTube Embed Transcripts.
2. **No new AI tool in v1.** Extend `get_lesson_transcript` and `read_lesson_transcript`. The model already knows to call those when the question is about the video. A separate `get_youtube_transcript` tool would duplicate the path and keep the "YouTube has no transcript" wording around.
3. **Cache-first:** look up by YouTube video ID. On miss, call the provider, store the result, then return it in the same tool response.
4. **Two writes on a successful fetch:**
   - Platform caption cache keyed by `youtubeVideoId` + language (avoids repeat provider calls across lessons and orgs).
   - `media_transcript` row for that lesson's YouTube `assetId` (existing UI and queries keep working).
5. **Prefetch on embed for paid orgs.** When a teacher adds a YouTube link, enqueue a background fetch. AI chat still lazy-fetches if prefetch has not finished or failed.
6. **Native captions only in v1.** Prefer creator-uploaded tracks, then YouTube auto-captions. Do not generate a new transcription from audio until legal signs off.
7. **Paid cloud gate.** Free (`BASIC`) orgs keep today's empty-transcript behavior. `EARLY_ADOPTER` and `ENTERPRISE` may fetch. Self-hosted skips the gate (same pattern as other paid cloud features).
8. **Public-caption cache is platform-wide.** Captions of a public YouTube video are not tenant secrets. Sharing the cache is how we keep provider cost down. Lesson access control still applies: an org only receives a transcript for a video it has embedded in a lesson it can read.
9. **Do not revive `video_transcripts`.** Add a dedicated cache table (name below). Research Courses should reuse this table instead of inventing a second one.

## Recommended provider

### Why not the official YouTube Data API

Verified against [YouTube Data API captions](https://developers.google.com/youtube/v3/docs/captions/list):

- `captions.list` returns track metadata, not caption text, and costs 50 quota units.
- `captions.download` requires OAuth from the **video owner / content owner**. An API key is not enough.
- Auto-generated captions are not available through this API.

That API is the right fit only when ClassroomIO is fetching captions for a channel the org has connected. It is the wrong default for "teacher pasted `https://www.youtube.com/watch?v=…`".

### Why not scrape timedtext from our servers

Libraries such as Python `youtube-transcript-api` and npm `youtube-transcript` read YouTube's internal timedtext endpoints. They are fine for local scripts and are **not** a production backend: datacenter IPs get blocked, the HTML/player contract changes without notice, and there is no vendor SLA.

### Default: Supadata, native-captions mode

Use a commercial caption API behind an internal adapter.

**Default production adapter: [Supadata](https://supadata.ai/youtube-transcript-api)** (`@supadata/js`).

Reasons it fits this codebase:

- First-class Node/TypeScript SDK, same runtime as `apps/api` and `apps/jobs`.
- Input is a YouTube URL or video ID; output is plain text plus timestamped segments.
- `mode: 'native'` returns existing captions (manual or YouTube ASR) without generating a new Whisper job.
- `mode: 'auto'` / `'generate'` exist later if legal allows audio fallback.
- Language parameter matches lesson locale selection.

v1 call shape:

```ts
await supadata.transcript({
  url: canonicalWatchUrl,
  lang: preferredLanguage, // lesson locale, then 'en', then omit
  text: false,             // keep timestamped chunks
  mode: 'native'
});
```

Map chunks into the existing `media_transcript.segments` shape `{ start, end, text }` (convert ms offsets to seconds). Concatenate for `media_transcript.text`.

### Adapter contract

```ts
type YoutubeCaptionProvider = 'supadata' | 'manual' | 'unavailable';

interface YoutubeCaptionFetchResult {
  youtubeVideoId: string;
  language: string;
  isGenerated: boolean;
  text: string;
  segments: Array<{ start: number; end: number; text: string }>;
  provider: YoutubeCaptionProvider;
  sourceTrackKind: 'manual' | 'asr' | 'unknown';
}

interface YoutubeCaptionAdapter {
  fetchNativeCaptions(input: {
    youtubeVideoId: string;
    canonicalUrl: string;
    preferredLanguages: string[];
  }): Promise<YoutubeCaptionFetchResult | { unavailable: true; reason: string }>;
}
```

Env:

- `YOUTUBE_CAPTION_PROVIDER=supadata` (default when key is set)
- `SUPADATA_API_KEY`

If the key is missing, behave like today: no YouTube transcript, no hard failure of chat.

Self-hosted orgs can set the same env. Optional later: org-level bring-your-own key.

### Alternatives (if Supadata is rejected)

| Option | Use when |
| --- | --- |
| TranscriptAPI / similar caption SaaS | Same adapter, different HTTP client. |
| Official captions.download | Only for OAuth-connected *owned* channels. |
| OpenAI Whisper on extracted audio | Last resort after legal review; reuse the uploaded-video job, never as the v1 default. |

Pick one production provider. Do not call two providers on the hot AI path.

## Current-state audit (implementation touchpoints)

| Area | File | Change |
| --- | --- | --- |
| Agent teacher tool | `packages/core/src/services/agent/chat-tools.ts` | `get_lesson_transcript` description currently excludes YouTube. |
| Agent student tool | `apps/api/src/services/agent/student-tools.ts` | Same for `read_lesson_transcript`. |
| Transcript assembly | `packages/core/src/services/agent/lesson-transcript.ts` | Only collects `videos[].assetId` and `listMediaTranscriptsByAssetIds`. YouTube assets already have `assetId`s — the miss is that no `media_transcript` row is ever created for them. |
| Upload-only transcribe job | `apps/api/src/services/jobs/media-jobs.ts` | Rejects `provider !== 'upload'`. Leave that path alone; YouTube must not go through ffmpeg/Whisper. |
| YouTube embed create | `apps/dashboard/src/lib/features/course/components/lesson/video/youtube-video.svelte` | Already creates a YouTube asset + `assetId`. Hook prefetch here (API, not in the Svelte file). |
| Transcript UI | `lesson-video-player.svelte`, `video-card-dropdown.svelte` | Upload-only (`video.type === 'upload'`). Extend to YouTube once `media_transcript` exists. |
| YouTube ID parse | `packages/core/src/services/assets/assets.ts` | Reuse. |

## User stories

### Learner — paid org, captions exist

- I open a lesson that embeds a YouTube video and ask the tutor "what were the three steps in the demo?"
- The tutor answers from the video's captions.
- The first question in the workspace may wait on a provider fetch; later questions, and other lessons that embed the same video, do not.

### Learner — free org

- I ask about the YouTube video.
- The tutor has lesson notes only, same as today.
- I am not shown an upgrade prompt inside the tutor (buyer is the admin). If we surface this in marketing/settings, it lives on the pricing / AI credits page.

### Teacher — paid org

- I paste a YouTube URL into the lesson.
- Captions start fetching in the background.
- When ready, the existing transcript side panel and caption track work like an uploaded video.
- I can edit the stored transcript (existing admin edit path on `media_transcript`).

### Teacher / tutor AI

- I ask the course assistant to write quiz questions from the YouTube lesson.
- `get_lesson_transcript` returns the YouTube caption text, so generated questions are grounded in the video.

### Failure — no captions

- The video has captions disabled, is private, or the provider returns 404.
- We store a negative cache (see data model) so we do not retry on every chat message.
- The tool result explains that this YouTube video has no captions available. Chat continues using notes.

## Functional requirements

### 1. Resolve YouTube videos on a lesson

For each `lesson.videos[]` entry:

- `type === 'upload'` with `assetId`: existing `media_transcript` path.
- `type === 'youtube'` with `assetId` and/or `link`: parse `youtubeVideoId` from `metadata.videoId` or the URL.

A lesson may contain mixed uploads and YouTube videos. The tool concatenates all available transcripts, labeled by video title.

### 2. Cache lookup

Order:

1. `media_transcript` for this asset (fast path for this lesson).
2. `youtube_caption_cache` by `youtubeVideoId` (and preferred language). On hit, copy into this asset's `media_transcript` if missing.
3. Negative cache: if a recent `unavailable` row exists, do not call the provider.
4. Else provider fetch (paid + key present only).

### 3. Provider fetch

- Timeout the HTTP call (recommend 8–15s on the AI path). If it exceeds that, return "transcript is still being fetched" and enqueue/reuse the background job rather than blocking the model for a long time.
- On success, write cache + `media_transcript`, then return text to the tool.
- On provider 404 / no captions: write negative cache (`status: 'unavailable'`, `reason`).
- On 429 / 5xx: do **not** negative-cache for long; retry with backoff via the jobs worker.

### 4. Persist like uploaded videos

Reuse `media_transcript`:

- `assetId`: the YouTube asset
- `organizationId`: lesson org
- `provider`: `supadata` (or `youtube_native`) rather than `openai`
- `model`: caption track id / provider mode, not `whisper-1`
- `language`, `text`, `segments`
- `vttStorageKey` / `vttBucket`: generate a VTT from segments and store it the same way uploads do, so the player caption track works. If VTT upload is the expensive part of the upload pipeline, it is still in scope — that is how "transcripts work like every other function in the app."

`media_transcript` is unique on `assetId`, so a later refetch upserts.

### 5. Prefetch job

New job on the existing jobs app, **not** the ffmpeg/Whisper pipeline:

- Name e.g. `youtube-captions.fetch`
- Trigger: YouTube asset created or attached to a lesson, org is paid (or self-hosted with key)
- Idempotent on `youtubeVideoId`
- Same writer as the AI lazy path

### 6. Plan gating

| Context | Fetch provider? |
| --- | --- |
| Cloud `BASIC` | No |
| Cloud `EARLY_ADOPTER` / `ENTERPRISE` | Yes |
| Self-hosted | Yes if key configured |
| Provider key missing | No, soft skip |

Gating applies to **fetch**, not to **read**. If a transcript is already in `media_transcript` (e.g. org later downgraded, or a teacher pasted/edited text), AI and the panel may still read it.

### 7. Agent tool wording

Replace the "YouTube is not transcribed" sentence with:

- Use this for uploaded videos **and** YouTube embeds.
- Spoken content is not in the lesson HTML.
- If captions are still fetching, say so.
- If captions are unavailable, say so; do not invent content.

### 8. UI

Once `media_transcript` exists for a YouTube `assetId`:

- Register the asset on `lessonVideoBus` like uploads.
- Show the transcript side panel, click-to-seek, and caption track.
- Hide "Generate transcript" (Whisper) for YouTube. Optional later: "Refresh captions" for paid admins.

v1 does not require a new empty-state marketing card on the video tab. Prefetch + AI lazy fetch is the product.

## Data model proposal

### `youtube_caption_cache`

Platform-wide caption store. One row per video + language.

| Column | Notes |
| --- | --- |
| `id` | UUID PK |
| `youtubeVideoId` | Canonical 11-char id |
| `language` | BCP-47, e.g. `en` |
| `status` | `ready \| unavailable \| failed` |
| `unavailableReason` | `no_captions \| private \| not_found \| disabled \| other` |
| `isGenerated` | YouTube ASR vs creator-uploaded |
| `text` | Full caption text (`null` when unavailable) |
| `segments` | JSON `{ start, end, text }[]` |
| `provider` | `supadata` |
| `sourceHash` | Hash of provider payload for change detection |
| `costCents` | Provider cost if billed per call |
| `fetchedAt` | |
| `expiresAt` | Optional; default none for `ready`. Negative cache TTL ~24h |
| `createdAt` / `updatedAt` | |

Unique: `(youtubeVideoId, language)`.

Index: `youtubeVideoId`.

This is the table [`prd/youtube-research-courses`](../youtube-research-courses/README.md) should use instead of a research-only `youtube_video_transcript`.

Do **not** store org id on this cache. Org scoping lives on `assets` / `media_transcript` / course membership.

### `media_transcript`

No schema change required if `provider` / `model` remain unconstrained varchars. Confirm VTT columns: if they are `NOT NULL`, the YouTube writer must still produce a VTT object (recommended) or we migrate those columns to nullable for external captions.

## Runtime flows

### AI tool call

```
get_lesson_transcript(lessonId)
  → load lesson videos
  → for each video, resolve transcript
       upload → media_transcript
       youtube → media_transcript → youtube_caption_cache → provider (paid)
  → concatenate labeled texts
  → return { hasTranscript, transcript, message? }
```

### Embed

```
Teacher submits YouTube URL
  → create youtube asset + attach to lesson (existing)
  → if org can fetch captions: enqueue youtube-captions.fetch
  → job writes cache + media_transcript
```

## Observability

Log (no caption text in logs):

- `youtubeVideoId`, org id, lesson id, cache hit/miss, provider, language, latency, status, cost cents

Metrics:

- cache hit rate
- provider success / unavailable / error
- p95 fetch latency on the AI path vs job path
- monthly provider calls vs unique videos

Alert if error rate spikes (provider outage or YouTube block).

## Compliance and ToS

Treat this as storing **public caption text** for videos a teacher chose to embed, for teaching and Q&A inside their org — not as a caption-scraping product or a redistribution CDN.

Required before production enablement:

1. Legal review of the chosen provider and of persisting third-party captions.
2. No video file download.
3. Native captions only in v1 (no audio derivation).
4. Respect unavailable/private videos; do not circumvent.
5. If a video later becomes private, keep serving the cached text to orgs that already embedded it, or expire on a documented policy. Default v1: keep `ready` rows; do not refetch into a worse state on random TTL.

Self-hosted operators are responsible for their own provider key and policy.

## Plan and pricing

- No new SKU. This is part of paid AI / course value.
- Provider cost is ours (cloud). Cache-by-video-id is the control.
- Free orgs: zero provider spend.
- If provider invoices grow, add a per-org monthly unique-video cap later; do not add it in v1 unless usage is already high.

## Acceptance criteria

1. A paid org lesson with only a YouTube embed: student tutor can answer a question that is only in the video captions, not in the notes.
2. Second question, same video, same or different lesson in any org: no provider call (cache hit). Verified in logs.
3. Free org: no provider call; tool result matches today's empty YouTube behavior.
4. Video with captions disabled: tool says captions are unavailable; subsequent calls do not hammer the provider (negative cache).
5. Uploaded-video transcripts still work; mixed lessons return both.
6. After a successful fetch, the lesson transcript panel can show timestamped captions for the YouTube video.
7. Missing `SUPADATA_API_KEY` does not break chat.
8. Official YouTube Data API is not required for the default path.

## Test plan

- Unit: YouTube ID parse, segment mapping, cache hit / negative cache / paid gate.
- Integration: mock Supadata; assert `youtube_caption_cache` + `media_transcript` writes; agent tool payload.
- Manual: embed a public captioned video in a paid seeded org (`admin@test.com`); ask the tutor a caption-only question; confirm panel; re-embed the same URL in another lesson and confirm cache hit.

## Open questions

1. Legal: may we persist public third-party captions in a platform-wide cache?
2. Confirm Supadata vs another caption SaaS after contract / DPA.
3. Should VTT storage for YouTube captions land in v1, or is `media_transcript.segments` enough for the panel and AI, with player captions as v1.1?
4. Negative-cache TTL (recommend 24h).
5. When a teacher replaces a lesson's YouTube URL, do we delete the old asset's `media_transcript`? (Cache row for the old video id stays.)
6. Bring-your-own provider key for self-hosted in v1 or later?

## Related files

- `packages/core/src/services/agent/lesson-transcript.ts`
- `packages/core/src/services/agent/chat-tools.ts`
- `apps/api/src/services/agent/student-tools.ts`
- `packages/db/src/schema.ts` (`media_transcript`, `assets`, unused `video_transcripts`)
- `packages/db/src/queries/media-transcript/media-transcript.ts`
- `apps/dashboard/src/lib/features/course/components/lesson/video/youtube-video.svelte`
- `apps/jobs/src/processors/media/transcribe-audio.ts` (do not reuse for YouTube)
- [`prd/youtube-research-courses/README.md`](../youtube-research-courses/README.md)
- [`prd/study-from-source/README.md`](../study-from-source/README.md)
