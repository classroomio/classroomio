# Content Search PRD

## Status

- Draft (brainstorm). Prototypes are the UX source of truth for the three interaction models.

## Prototypes — the UX source of truth

When this document and the prototypes disagree on a UI detail, the prototype wins.

Start here:

```
prototypes/content-search/index.html
```

| Surface | File | What it explores |
| --- | --- | --- |
| All three models | `prototypes/content-search/index.html` | Picker: **Palette**, **Moments**, **Preview**. Each is a clickable end-to-end flow (query → ranked hit → land at the timestamp). |
| Shared tokens | `prototypes/content-search/app-theme.css` | Mirrors `packages/ui/src/index.css`. |
| Search chrome | `prototypes/content-search/search-proto.css` | Palette, results page, preview pane, player seek, locked cards. |

Flip variants with `1` / `2` / `3`, or the bottom picker.

---

## Purpose

Learners (and visitors on a public academy) should type a phrase they remember from a lesson — including something said in an uploaded video or a YouTube embed — and land on the exact lesson, exercise, or **video second**.

This is not a new search product bolted onto the existing command palette. It is one **content index** with two access-filtered surfaces:

1. **In-app** (authenticated LMS + staff dashboard).
2. **Public academy** (org site, anonymous or logged-out).

PlanetScale's TIN (Text INdex) is the cloud ranking engine. Self-hosted keeps the same table and a `tsvector` + GIN fallback.

## Problem Statement

- Command palette search (`⌘K`) only `ILIKE`s course/cohort/widget/tag/audience **titles**. It never searches lesson bodies, exercises, or transcripts.
- LMS search is the same title filter, scoped to enrollments.
- Public `/courses` search is title/description only.
- The student AI tool `search_course` `ILIKE`s lesson/exercise text and **skips transcripts**.
- Timestamped transcripts already exist (`media_transcript.segments`) for uploads and, where captions were fetched, YouTube. The lesson transcript panel already seeks. Nothing connects a global query to that seek.
- Paid / locked / unpublished content has no search policy. A naive FTS query would leak spoken words from courses the viewer cannot play.

## Confirmed Decisions

These are locked for v1 of this brainstorm. Items marked **(assumed)** were not explicitly confirmed by a product owner in this thread — veto them if wrong.

1. **One product, two surfaces.** Content Search is a single feature (one index, one query service, one access policy). In-app and public academy are filters + chrome on that product, not two roadmaps.
2. **Transcripts are first-class documents.** Each caption segment is its own search hit with `startSeconds` / `endSeconds`, so a result can deep-link to a moment.
3. **YouTube and uploads are the same hit type.** Once `media_transcript` exists for the asset, search does not care whether the video is an upload or a YouTube embed. Caption fetch remains the YouTube Embed Transcripts pipeline; this PRD consumes that store.
4. **Search never leaks gated content.** If the viewer cannot play the video or open the lesson, the API does not return transcript text, lesson body, or exercise prompts. Course-level catalog fields (title, description, price) may still appear as a teaser with an enroll/lock CTA.
5. **LMS content hits = enrolled courses only.** A learner's lesson / exercise / transcript results come only from courses they are enrolled in (or staff can manage). Other published courses may appear as **course teasers**, never as inner hits.
6. **Public content hits = public + unlocked only.** Transcript and lesson-body hits on the org site require `COURSE_TYPE = PUBLIC`, `isPublished`, and `isUnlocked` on that item. Paid/self-paced catalog courses can appear as course cards, matching today's public catalog.
7. **Staff org search stays a separate scope.** Admins keep today's people/widgets/tags palette and **gain** content hits across the org, including drafts they can already open. Staff results are never shown on the public site.
8. **Deep link contract.** Authenticated: `/courses/{courseId}/lessons/{lessonId}?t={seconds}&asset={assetId}`. Public: `/course/{courseSlug}/lesson/{itemSlug}?t={seconds}&asset={assetId}`. On load, the existing `lessonVideoBus.seek` runs.
9. **v1 corpus.** Courses, lessons (title + note + body), exercises (title + prompt text, never answer keys), transcript segments. Newsfeed, community, certificates, landing-page copy, and widgets are out of v1 content search.
10. **Engine. (assumed)** Cloud on PlanetScale Postgres uses TIN. Self-hosted / vanilla Postgres 16 uses `to_tsvector` + GIN behind the same query helper. No Meilisearch/Typesense in v1.
11. **Recommended ship mix. (assumed)** Ship **Palette** for in-app and **Moments** for the public academy. **Preview** is a later in-course enhancement, not v1. The three prototypes exist so we can disagree with that mix before building.

## Current-State Audit

| Capability | Current state | Notes |
| --- | --- | --- |
| Staff command palette | Shipped. `organization.search` | Title `ILIKE` on courses, cohorts, widgets, tags, audience. |
| LMS command palette | Shipped. `organization.search/lms` | Enrolled course/cohort titles only. |
| Public catalog search | Shipped. `(org-site)/courses?search=` | Course title/description `ILIKE`. |
| AI `search_course` | Shipped. `student-tools.ts` | Lesson title/body + exercise title/description `ILIKE`. No transcripts. |
| Upload transcripts | Shipped. `media_transcript` | `{ start, end, text }[]` + concatenated `text`. Whisper job. |
| YouTube captions | Shipped path + paid gate | `youtube_caption` write-through to `media_transcript`. See `prd/youtube-embed-transcripts`. |
| Click-to-seek | Shipped. `transcript-side-panel.svelte` | `lessonVideoBus.seek(start)`. No `?t=` URL read on lesson load. |
| Public locked lessons | Shipped. `lesson.isUnlocked` | Locked public items show the course callout, not content. |
| Paid courses | Shipped. `course.cost` | Catalog-visible when published; inner content requires enrollment. |
| FTS index | Missing | Every search is `ILIKE '%q%'`. |

Related PRDs that are **not** this feature:

- [`prd/youtube-embed-transcripts`](../youtube-embed-transcripts/README.md) — get captions into `media_transcript`. This feature searches that table.
- [`prd/public-courses [DONE]`](../public-courses%20[DONE]/README.md) — public course type and lock/callout rules. Search must honor them.
- [`prd/ai-course-assistant [DONE]`](../ai-course-assistant%20[DONE]/README.md) — in-course agent. `search_course` should call the new index.

## Is this one feature or combined?

**One feature.** Treat it as "Content Search" in the roadmap, not "in-app search" plus "academy search" plus "video search".

What combines:

| Layer | Shared | Split |
| --- | --- | --- |
| Index | `search_document` rows, TIN/tsvector, indexing jobs | Nothing |
| Policy | One access function: `canReadDocument(viewer, doc)` | Viewer identity differs (anon vs learner vs staff) |
| API | Same query shape | `scope=lms \| org \| public` |
| UX | Result kinds, snippets, `?t=` seek | Chrome: palette vs public results page |

What must **not** combine into the same UI:

- Staff people/tag/widget navigation (today's org palette) vs learner content search. Same dialog is fine; different result groups and different endpoints.
- Public marketing catalog vs authenticated LMS. Different hosts, different default filters.

## Access model — the product heart

### Viewer kinds

| Viewer | Who | Content the query may return |
| --- | --- | --- |
| **Public visitor** | Anon or logged-in user on the org site, not using LMS | Inner hits only from published **Public** courses, **unlocked** items. Course teasers from any published catalog course (title/description/price already public). |
| **Learner (LMS)** | Authenticated org member in LMS scope | Inner hits from **enrolled** courses (and not-deleted, published-for-students items). Course teasers from other published courses the org lists in Explore. Never drafts. |
| **Staff** | Org team member in org scope | Inner hits from any course they can already open in the dashboard, including drafts. Audience/widget/tag groups stay as they are today. |

### What "inner hit" vs "teaser" means

- **Inner hit** — lesson body, exercise prompt, or **transcript snippet**. These are the words behind the paywall / lock.
- **Teaser** — course title, description, cover, price, "Enroll to search inside". Safe because the public catalog already shows them.

### Matrix

| Source | Public visitor | Learner, not enrolled | Learner, enrolled | Staff |
| --- | --- | --- | --- | --- |
| Public course, unlocked lesson / transcript | Inner hit + seek | Inner hit + seek | Inner hit + seek | Inner hit |
| Public course, locked lesson (`isUnlocked = false`) | Teaser + lock. **No snippet.** | Same | Same (public courses treat everyone as a guest for locks) | Inner hit (they can unlock in the editor) |
| Free self-paced, published, not enrolled | Course teaser only | Course teaser + enroll | Inner hits | Inner hit |
| Paid course (`cost > 0`), not enrolled | Course teaser only | Course teaser + enroll. **No snippet.** | Inner hits | Inner hit |
| Unpublished / draft | None | None | None | Inner hit |
| Sequential progression, future lesson | — | — | Inner hit allowed; existing seek-forward block still applies in the player | Inner hit |
| YouTube with no captions yet | Omit (nothing to rank) | Omit | Omit, or "transcript processing" only in staff | Staff may see "captions pending" |

**Hard rule:** ranking and snippet generation run **after** the access filter, never before. Do not FTS the whole table and then strip snippets in the client.

### Why enrolled-only for LMS inner hits

A learner searching "OAuth refresh tokens" should not read a paragraph from a $199 course they have not bought, even if we hide the "Open" button. The snippet **is** the content.

Teasers still let Explore work: "This is in Advanced React ($49) · Enroll".

### Public academy

The academy search box replaces title-only `?search=` with the same index, `scope=public`. Visitors can:

- Jump into a free/public lesson at `?t=`.
- Discover a paid course as a card, then enroll.
- Never hear/read a paid transcript from search.

## Ideal UX

### In-app (learner) — recommended: Palette

Keep `⌘K` / the header search field. When the query is non-empty, add groups above today's course/cohort rows:

1. **In videos** — timestamp, YouTube vs upload badge, course · lesson, highlighted snippet.
2. **Lessons** — title + text snippet.
3. **Exercises** — title + prompt snippet.
4. **Courses** — enrolled matches, then muted teasers for other catalog courses.

Selecting a video row routes to the lesson with `?t=` and `?asset=`. The player seeks; the transcript panel opens on that line.

Locked teasers are not selectable as seek. They select into the course landing / checkout.

Keyboard: arrows, enter, esc — same as today's command dialog (`shouldFilter={false}`, server ranked).

### Public academy — recommended: Moments

A dedicated `/search?q=` page, not a command dialog (no `⌘K` on a marketing site, and results need thumbnails).

- Search field stays in the public nav and on `/courses`.
- Submitting goes to a results page with chips: All · Videos · Lessons · Courses.
- Video rows look like YouTube moments: thumbnail, `8:12` overlay, quoted transcript, course name.
- Locked/paid rows are visually distinct (lock, no quote, enroll).
- Clicking an allowed moment opens the public lesson player at `?t=`.

### Optional later: Preview

While already inside a course, a wide overlay with results on the left and a live player on the right. Hover/select a moment and the preview seeks without navigating. Best for "is this the clip?" — extra implementation cost (two players, YouTube cue, mobile). Not v1.

### Empty / pending / error states (all surfaces)

- No query: recents + suggested (in-app only).
- No hits: "Nothing in your courses. 2 catalog courses match the title." (LMS) vs "No public lessons match. Try a course name." (public).
- Transcript still processing: omit the segment; do not show a broken timestamp.
- Captions unavailable for a YouTube video: omit. Do not invent a snippet from the video title.

## What it will take

This is a backend-shaped feature with a thin UI on top of existing chrome. Rough shape, not calendar time:

### 1. Index (largest piece)

- `search_document` table (org, course, entity type/id, visibility, title, body, url, asset, start/end seconds).
- TIN index on PlanetScale; GIN `tsvector` for self-hosted.
- Writers: lesson save, exercise save, course publish/unpublish/price change, lock toggle, enrollment does **not** rewrite documents (enrollment is a query-time join).
- Transcription complete (`upsertMediaTranscript`) and YouTube caption write-through: delete+insert segment rows for that asset.
- Backfill job for existing courses and `media_transcript` rows.
- Reconciliation job for drift.

### 2. Access-aware query

- `searchContent({ orgId, viewer, scope, q, kinds, courseId?, limit })`.
- Filter first (org + visibility + enrollment join + unlock + published), then `==>` / `@@`, then `tin.score` / `ts_rank`, then snippet.
- Never return answer keys. Strip exercise options' `isCorrect` the same way `read_exercise` already does.
- Pagination later; v1 is top 8–20.

### 3. API

| Method | Path | Scope |
| --- | --- | --- |
| GET | `/organization/search` | Staff — keep, add `content` group or a sibling `/organization/search/content` |
| GET | `/organization/search/lms` | Learner — keep titles, add content groups |
| GET | `/public/search` (or org-site load function) | Anon, cookie/host org resolution. No auth required. |

Do not reuse one route that returns a union of shapes based on a query flag. Follow the existing split (`/` vs `/lms`) and add a public route.

### 4. Frontend

- Extend `SearchResultKind` with `lesson`, `exercise`, `moment`, `course_teaser`.
- Palette groups + moment row (timestamp, YouTube badge, snippet).
- Lesson pages: read `t` / `asset` on mount, call `lessonVideoBus.seek`, select transcript source.
- Public `/search` page + upgrade `(org-site)/courses` search box to navigate there (or stay on catalog for course-only queries — product call; prototype uses a results page).
- Point AI `search_course` at the same query helper (course-scoped, enrolled already implied by the tool).

### 5. Engine adapter

```ts
searchBody(column, query) // TIN ==> or tsvector @@
rank(ctid | tsvector)
```

Feature-detect `CREATE EXTENSION tin` in cloud migrations; self-hosted migration creates GIN instead.

### Risks

| Risk | Mitigation |
| --- | --- |
| TIN is PlanetScale-only; Docker Postgres 16 cannot load it | Adapter + GIN fallback from day one. Do not put `==>` in shared SQL. |
| Snippet leak via ranking before ACL | ACL in SQL `WHERE`, not in the mapper. Tests: paid transcript must be absent from public and unenrolled LMS responses. |
| Segment-row explosion (1h video ≈ 400–800 rows) | TIN/GIN are built for this. Cap snippet length. Collapse adjacent hits from the same asset in the UI (show best 2 moments per lesson). |
| YouTube captions missing / plan-gated | Search simply has no moment rows. Do not block lesson-title search. |
| Sequential courses + seek-forward block | Search may land at a timestamp the player refuses to skip to. Keep existing `seek_blocked` toast; still a valid hit. |
| Self-hosted search quality vs TIN | Accept weaker ranking on GIN; do not add a third engine in v1. |

## Product Goals

1. A learner can find a spoken sentence from an enrolled YouTube or uploaded video and play from that second.
2. A public visitor can do the same on unlocked public-course videos, and only see teasers for paid courses.
3. Staff can search lesson/transcript content from `⌘K` without a new app.
4. No gated transcript or lesson body is returned to a viewer who cannot open that item.
5. One index powers palette, public page, and AI `search_course`.

## Non-Goals (v1)

- Semantic / embedding search (additive later).
- Meilisearch, Typesense, Elasticsearch.
- Newsfeed, community, certificates, landing-page copy in the index.
- Whisper-transcribing YouTube when captions do not exist (legal; owned by the YouTube transcripts PRD).
- In-place Preview split pane.
- Search analytics dashboards.
- Cross-org search (platform-wide).
- Translating queries or captions.

## Functional Requirements

### Learner LMS (Palette prototype)

- Header search / `⌘K` opens the existing command dialog (`apps/dashboard/src/lib/features/search/components/command-palette.svelte`).
- Ranked content groups as in Ideal UX.
- Moment rows include `startLabel` (`8:12`), source (`YouTube` | `Video`), snippet with term highlight, course and lesson titles.
- Teaser rows for unenrolled published courses: lock, price, no snippet.
- Selecting a moment navigates and seeks. Selecting a teaser goes to the course overview.
- Empty state distinguishes "nothing in your courses" from "catalog teasers exist".

### Public academy (Moments prototype)

- Search in public nav and `/courses`.
- `/search?q=` results page with kind chips.
- Same ACL as the public visitor row in the matrix.
- Moment click → public lesson with `?t=`.
- Locked public lessons and paid courses render as teasers.

### Staff dashboard

- Org-scope palette gains the same content groups, unfiltered by enrollment, still org-scoped.
- Draft courses allowed. Public site never sees them.

### Lesson player (all allowed viewers)

- On mount, parse `t` (seconds) and optional `asset`.
- Seek the matching player (upload or YouTube).
- Highlight the transcript segment. Open the transcript panel if it is closed.
- Invalid `t` is ignored (play from 0).

## Technical Design

### Data model

```sql
CREATE TABLE search_document (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
  course_id uuid REFERENCES course(id) ON DELETE CASCADE,
  entity_type text NOT NULL, -- course | lesson | exercise | transcript_segment
  entity_id uuid NOT NULL,
  video_asset_id uuid REFERENCES assets(id) ON DELETE CASCADE,
  start_seconds numeric,
  end_seconds numeric,
  title text NOT NULL,
  body text NOT NULL,
  url_path text NOT NULL,
  visibility text NOT NULL, -- public_unlocked | catalog | enrolled | staff
  is_published boolean NOT NULL,
  course_cost integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX search_document_org ON search_document (organization_id, visibility, entity_type);
-- PlanetScale:
-- CREATE INDEX search_document_body_tin ON search_document USING tin(body);
-- Self-hosted:
-- CREATE INDEX search_document_body_fts ON search_document
--   USING gin (to_tsvector('english', body));
```

`visibility` is denormalized from course type + `isUnlocked` + published so public queries do not join lesson rows on the hot path. Enrollment is **not** denormalized; it is a query-time join to membership.

`catalog` = published course teasers (title + description only in `body`).

### Indexing (pseudocode)

```
onTranscriptUpsert(assetId):
  delete search_document where video_asset_id = assetId and entity_type = 'transcript_segment'
  for each segment in media_transcript.segments:
    insert document(body = segment.text, start_seconds, visibility = derive(lesson, course))

onLessonSave(lesson):
  upsert lesson document from title + note + language content
  re-derive visibility for that lesson's segment rows if lock/publish changed
```

### Query (pseudocode)

```
searchContent({ orgId, viewer, scope, q }):
  docs = documents where organization_id = orgId
  if scope == public:
    docs = docs where visibility in ('public_unlocked', 'catalog')
  else if scope == lms:
    enrolled = course ids for viewer
    docs = docs where
      (visibility in ('public_unlocked', 'enrolled') and course_id in enrolled)
      or visibility = 'catalog'
  else: # staff
    docs = docs  # all org rows

  rank by engine(q)
  map to API kinds; strip body for visibility = 'catalog'
```

### Frontend plan

- Types in `apps/dashboard/src/lib/features/search/utils/types.ts` (infer from API; do not import `@cio/db/queries`).
- API class stays `search.svelte.ts`.
- Public search: org-site `+page.server.ts` calling the public endpoint (`.server.ts`, no RPC in UI).
- Translations in `en.json` under `app.search.*` and `public_search.*`.

## Implementation Order

1. `search_document` migration + query helper with tsvector (works locally). TIN adapter behind a flag.
2. Index writers for lessons/exercises/courses + transcript segments; backfill.
3. Access-filtered `searchContent`; tests for the matrix (paid snippet must not leak).
4. LMS + staff palette kinds + `?t=` seek on lesson load.
5. Public `/search` page + catalog box.
6. Point `search_course` at the helper.
7. Collapse adjacent moments per lesson; YouTube badge.

Verification:

```bash
export PATH="$HOME/.nvm/versions/node/v20.19.3/bin:$PATH"
pnpm --filter @cio/api^... build && pnpm --filter @cio/api build
pnpm --filter @cio/dashboard^... build && pnpm --filter @cio/dashboard build
pnpm format:check
```

## Acceptance Criteria

1. Enrolled learner query matching a YouTube caption lands on the lesson and the player is at that timestamp.
2. The same query as an anonymous public visitor does not include that snippet if the course is paid/self-paced; it may include a course teaser.
3. A public-course unlocked moment is searchable and seekable while logged out.
4. A locked public lesson does not return transcript text.
5. Staff palette still finds people/tags/widgets.
6. AI `search_course` can return transcript moments with ids + seconds.
7. Self-hosted search works without TIN (GIN path).
8. Existing title search and command palette recents still work.
9. All new copy uses translation keys.
10. Zero regression on enrollment, payments, and public lock/callout behavior.

## The three UX models (picker)

| # | Variant | Axis | When it wins | Cost |
| --- | --- | --- | --- | --- |
| 1 | **Palette** | Keyboard overlay, extends shipped `⌘K` | Daily LMS use; staff already live here | Weak for public; dense rows; no thumbnails |
| 2 | **Moments** | Full results page, YouTube-like cards | Public academy; sharing a search URL | Extra route; heavier than a palette |
| 3 | **Preview** | Split list + live seek before navigate | In-course "is this the clip?" | Two players, mobile, YouTube cueing |

**Proposal:** ship 1 in-app and 2 on the org site, same API. Keep 3 on the shelf.

## Open questions

1. Should unenrolled LMS teasers be on or off by default? (Prototype: on, muted group "In the catalog".)
2. Public `/search` vs keep results on `/courses`? (Prototype: dedicated `/search`.)
3. Collapse to max two moments per lesson in v1?
4. TIN-only in cloud, or always ship GIN too for local/dev parity?

---

*PlanetScale TIN announcement: [Introducing TIN: full-text search for Postgres](https://planetscale.com/blog/introducing-tin) (16 Sep 2026).*
