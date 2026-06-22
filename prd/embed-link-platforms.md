# Embed Link Platforms (Twitter/X + Vimeo)

## Purpose

Extend the lesson "Embed Link" video source to support platform-specific embeds (Twitter/X videos, Vimeo, and future platforms) instead of treating every URL as a raw HTML5 video source. The user selects the target platform from a dropdown; the system validates the URL, fetches metadata, and renders the appropriate embed player.

## Goals

- Redesign the Embed Link tab with a platform source dropdown + URL input.
- Support Twitter/X video/post embedding via oEmbed + widgets.js.
- Support Vimeo embedding via iframe player URL.
- Keep the `generic` video type for raw HTML5 video URLs (Mp4, WebM).
- Lay a pattern for adding future platforms (Loom, Wistia, etc.) without schema changes per platform.
- Rename the tab from "Embed Link" to "Embed" to reflect the broader scope.

## Non-Goals

- Adding a dedicated tab per platform in the add-video modal.
- Implementing watch enforcement or transcript support for embed platforms (they render as iframes, not HTML5 video).
- Supporting Twitter/X as a downloadable video source.

## Constraints

- Existing `generic` type behavior must be preserved (HTML5 `<video>` via Plyr) when no platform is selected.
- Platform selection is stored in a new top-level `platform` field on the video object, not inside `metadata`.
- Asset `provider` uses the platform name (e.g. `'twitter'`, `'vimeo'`) so canonical asset metadata can be enriched later.
- `mapProviderToVideoType` in `lesson-media.ts` maps these providers to `'generic'` type for backward compatibility.
- Twitter oEmbed fetch requires a server-side proxy (Twitter's oEmbed API does not support CORS).
- Vimeo oEmbed is optional (the embed URL can be constructed from the video ID directly).

## UX Design

### Embed Link Tab (renamed to "Embed")

```
┌─ Source ──────────────────────┐
│  [HTML5 Video          ▼]     │
│  ─────────────────────         │
│  HTML5 Video                  │
│  Twitter / X                  │
│  Vimeo                        │
└───────────────────────────────┘

[URL: ___________________________________]

[Add Video]
```

- **HTML5 Video (default)**: Current behavior. Placeholder: `https://example.com/video.mp4`. Validates basic URL format.
- **Twitter / X**: Placeholder: `https://x.com/username/status/123456789`. Validates tweet URL pattern. Fetches oEmbed metadata on add.
- **Vimeo**: Placeholder: `https://vimeo.com/123456789`. Validates Vimeo video URL. Fetches oEmbed metadata on add (or constructs embed URL from video ID).

### Display in lesson

- Video card shows the platform icon/name (e.g. "Twitter / X · Feb 15, 2026").
- Thumbnail from oEmbed metadata (Twitter returns `thumbnail_url`; Vimeo returns `thumbnail_url`).
- View mode renders the platform-specific embed (iframe for Twitter via widgets.js; iframe for Vimeo player).

## Schema Changes

### Database (`packages/db/src/schema.ts`)

Add `platform` to the videos JSONB type union:

```typescript
type: 'youtube' | 'generic' | 'upload' | 'google_drive';
platform?: 'twitter' | 'vimeo';  // NEW: embed platform discriminator
link: string;
key?: string;
assetId?: string;
watchEnforced?: boolean;
fileName?: string;
metadata?: {
  svid?: string;
  title?: string;
  description?: string;
  thumbnailUrl?: string;
  duration?: number;
  aspectRatio?: string;
  createdAt?: string;
  // NEW (stored from oEmbed):
  embedHtml?: string;       // Twitter oEmbed HTML (omit_script=true)
  authorName?: string;      // Twitter: @username / Vimeo: uploader name
  videoId?: string;         // Vimeo: numeric video ID
};
```

### Validation (`packages/utils/src/validation/lesson/lesson.ts`)

```typescript
platform: z.enum(['twitter', 'vimeo']).optional(),
```

### Media Player Types (`packages/ui/src/custom/media-player/types.ts`)

```typescript
export interface VideoSource {
  type: VideoType;
  url: string;
  platform?: 'twitter' | 'vimeo';  // NEW
  hls?: boolean;
  metadata?: {
    svid?: string;
    thumbnailUrl?: string;
    title?: string;
    embedHtml?: string;  // NEW: for Twitter oEmbed HTML
    authorName?: string; // NEW
    videoId?: string;    // NEW: for Vimeo
  };
  tracks?: VideoTextTrack[];
}
```

## Backend Changes

### 1. Twitter oEmbed Utility (`packages/core/src/utils/twitter-embed.ts` — NEW)

```typescript
export function getTweetId(url: string): string | null
// Extracts tweet ID from:
//   https://x.com/{user}/status/{id}
//   https://twitter.com/{user}/status/{id}
//   https://x.com/{user}/status/{id}?param=value
//   https://twitter.com/{user}/status/{id}/photo/1 (strips suffix)

export async function fetchTwitterOEmbed(url: string): Promise<{
  html: string;
  author_name: string;
  title: string;
  thumbnail_url: string;
  cache_age: number;
} | null>
// Fetches https://publish.x.com/oembed?url={encodedUrl}&omit_script=true
// Returns parsed JSON or null on failure.
```

### 2. Vimeo Utility (`packages/core/src/utils/vimeo-embed.ts` — NEW)

```typescript
export function getVimeoVideoId(url: string): string | null
// Extracts video ID from:
//   https://vimeo.com/{id}
//   https://vimeo.com/{id}?param=value
//   https://vimeo.com/channels/{channel}/{id}
//   https://vimeo.com/album/{album}/video/{id}
//   https://player.vimeo.com/video/{id}

export function formatVimeoEmbedUrl(videoId: string): string
// Returns https://player.vimeo.com/video/{videoId}

export async function fetchVimeoOEmbed(url: string): Promise<{
  title: string;
  thumbnail_url: string;
  author_name: string;
  duration: number;
} | null>
// Optionally fetches https://vimeo.com/api/oembed.json?url={encodedUrl}
// Embed URL can be constructed from videoId alone (oEmbed is optional).
```

### 3. Asset Provider Mapping (`packages/core/src/utils/lesson-media.ts`)

Update `mapProviderToVideoType`:

```typescript
function mapProviderToVideoType(provider: string): LessonVideo['type'] {
  if (provider === 'youtube') return 'youtube';
  if (provider === 'google_drive') return 'google_drive';
  if (provider === 'generic' || provider === 'external_url') return 'generic';
  if (provider === 'twitter' || provider === 'vimeo') return 'generic'; // NEW
  return 'upload';
}
```

### 4. API Route — Twitter oEmbed Proxy (`apps/api/src/routes/media/twitter.ts` — NEW)

```
GET /api/media/twitter/oembed?url={tweetUrl}
```

Proxies `https://publish.x.com/oembed?url={url}&omit_script=true`. Returns oEmbed JSON directly. This avoids CORS issues when fetching from the browser.

### 5. API Route — Vimeo Embed Proxy (`apps/api/src/routes/media/vimeo.ts` — NEW)

```
GET /api/media/vimeo/oembed?url={vimeoUrl}
```

Proxies `https://vimeo.com/api/oembed.json?url={url}`. Returns oEmbed JSON directly.

### 6. Register Routes (`apps/api/src/routes/media/index.ts`)

Mount the new twitter and vimeo routers.

## Frontend Changes

### 1. Embed Link Tab Redesign (`apps/dashboard/.../embed-link.svelte`)

Major rewrite:

- Add platform selector dropdown above the URL input.
- Dropdown options: `HTML5 Video`, `Twitter / X`, `Vimeo`.
- On platform change: update URL input placeholder, clear validation state.
- On submit:
  - **HTML5 Video**: current behavior (type: `'generic'`, no platform).
  - **Twitter**: validate tweet URL → fetch oEmbed via API → create asset with `provider: 'twitter'` → store video with `type: 'generic', platform: 'twitter', metadata: { embedHtml, authorName, thumbnailUrl, title, createdAt }`.
  - **Vimeo**: validate Vimeo URL → optionally fetch oEmbed → create asset with `provider: 'vimeo'` → store video with `type: 'generic', platform: 'vimeo', metadata: { videoId, title, thumbnailUrl, authorName, duration, createdAt }`.

Validation helpers (new file or inline):

```typescript
const TWITTER_URL_RE = /^https?:\/\/(x\.com|twitter\.com)\/[^/]+\/status\/(\d+)/;
const VIMEO_URL_RE = /^https?:\/\/(www\.)?vimeo\.com\/(\d+)/;

function isValidTwitterUrl(url: string): boolean { ... }
function isValidVimeoUrl(url: string): boolean { ... }
```

### 2. Media Player (`packages/ui/src/custom/media-player/media-player.svelte`)

Add platform branching alongside the existing type branches:

```
if (source.type === 'muse' && source.metadata?.svid) → MusePlayer
else if (source.type === 'google_drive') → iframe
else if (source.type === 'youtube') → iframe (formatYoutubeEmbedUrl)
else if (source.type === 'generic' && source.platform === 'twitter') → Twitter embed
else if (source.type === 'generic' && source.platform === 'vimeo') → Vimeo embed
else → PlyrPlayer (HTML5 video)
```

**Twitter render**:
- Container `<div bind:this={container}>` with a `<blockquote class="twitter-tweet">` containing `<a href={source.url}>`.
- Load `widgets.js` once on page (module-level flag).
- On mount / when source changes, call `twttr.widgets.load(container)`.

**Vimeo render**:
- Iframe with `src={formatVimeoEmbedUrl(source.metadata.videoId)}`.
- Same styling/constraints as YouTube embed (aspect-ratio, fullscreen, etc.).

### 3. Video Card Utils (`.../video-card-utils.ts`)

Update platform-aware helpers:

- `getVideoTitle`: Add `'twitter'` → "X / Twitter post", `'vimeo'` → "Vimeo video" (or use title from metadata).
- `getVideoThumbnailUrl`: Add Twitter case (uses `metadata.thumbnailUrl` from oEmbed), Vimeo case (uses `metadata.thumbnailUrl` from oEmbed).

### 4. Video Card (`.../lesson-video-simple-card.svelte`)

Update `sourceKindLabel`:

```typescript
const key =
  video.type === 'youtube' ? 'kind_youtube' :
  video.type === 'upload' ? 'kind_upload' :
  video.type === 'google_drive' ? 'kind_google_drive' :
  video.platform === 'twitter' ? 'kind_twitter' :
  video.platform === 'vimeo' ? 'kind_vimeo' :
  'kind_generic';
```

### 5. Video Player (`.../lesson-video-player.svelte`)

Pass platform info to MediaPlayer:

```typescript
<MediaPlayer
  source={{
    type: video.type,
    url: playbackUrl,
    platform: (video as any).platform,  // NEW
    hls: isHls,
    metadata: { ...video.metadata, embedHtml: ..., authorName: ..., videoId: ... },
    tracks
  }}
  ...
/>
```

### 6. Constants (`.../video/constants.ts`)

Update tab name from "Embed Link" to "Embed":

```typescript
{
  value: 2,
  title: 'course.navItem.lessons.materials.tabs.video.embed',
  icon: FileSymlinkIcon
}
```

### 7. Add-Video Modal (`add-video-modal.svelte`)

Import remains the same (embed-link.svelte is the component; no new imports needed).

### 8. Filters in Video Card List (`embed-link.svelte` and `video.svelte`)

The existing video list filters by `video.type === 'generic'` in embed-link.svelte and shows all types in video.svelte. Since Twitter/Vimeo use `type: 'generic'`, they'll naturally show up in both places without filter changes.

## Media API Changes

### `media-manager.svelte.ts`

No structural changes needed — `createAsset` already accepts arbitrary `provider` and `metadata` strings. The embed-link component will call it with `provider: 'twitter'` or `provider: 'vimeo'` directly.

## Translation Keys (en.json)

Under `course.navItem.lessons.materials.tabs.video`:

| Key | Value |
|-----|-------|
| `embed` | "Embed" (renamed from `embed_link`) |
| `add_video.source_label` | "Source" |
| `add_video.source_html5` | "HTML5 Video" |
| `add_video.source_twitter` | "Twitter / X" |
| `add_video.source_vimeo` | "Vimeo" |
| `add_video.twitter_placeholder` | "https://x.com/username/status/..." |
| `add_video.vimeo_placeholder` | "https://vimeo.com/..." |
| `add_video.invalid_twitter` | "Invalid Twitter/X link" |
| `add_video.invalid_vimeo` | "Invalid Vimeo link" |
| `simple_card.kind_twitter` | "Twitter / X" |
| `simple_card.kind_vimeo` | "Vimeo" |

## Extensibility

Adding a new platform (e.g. Loom) requires:

1. Add `'loom'` to the `platform` enum in schema + validation.
2. Create a utility in `packages/core/src/utils/` for URL parsing/oEmbed.
3. Add an API proxy route in `apps/api/src/routes/media/`.
4. Add the platform to the dropdown in `embed-link.svelte`.
5. Add a render branch in `media-player.svelte`.
6. Add translation keys.

No DB migration needed (the `platform` field is optional on `generic` type).

## Open Questions

- Should we store the full oEmbed HTML for Twitter in the database, or reconstruct the `<blockquote>` markup from the tweet URL at render time? Reconstructing is simpler and avoids storing large HTML blobs. The `widgets.js` approach works with just the URL.
- Vimeo: skip oEmbed entirely and just construct `player.vimeo.com/video/{id}` from the URL? Saves an API call.
- Mobile responsiveness: Twitter embeds via widgets.js handle responsive sizing natively. Vimeo iframes need aspect-ratio handling (same as YouTube).
