# Lesson Reader PRD

## Status

- Draft (prototyped, not started)

## Prototypes — the UX source of truth

Every surface in this PRD is prototyped as standalone HTML on the real `packages/ui` tokens and the seeded **Data Science with Python and Pandas** course. **When this document and a prototype disagree on a UI detail, the prototype wins.** Each page has a **Prototype** button (bottom right) that switches learner state, AI on/off, video source, completion policy and app theme.

Start here:

```
prototypes/lesson-reader/index.html
```

| Surface | Persona | File |
| --- | --- | --- |
| Text lesson (selection toolbar, margin answers, Aa settings, notebook panel, map, focus, listen, brief, resume) | Learner | `lesson.html` |
| Video lesson (player markers, Bookmark / Note / Ask about this moment, transcript selection, video notebook, YouTube and Drive variants) | Learner | `video-lesson.html` |
| Course notebook page | Learner | `notebook.html` |
| "From your notebook" resurfacing on the student dashboard | Learner | `home.html` |
| Phone layouts (text and video) | Learner | `mobile.html` |
| Signed-out public lesson | Visitor | `public-lesson.html` |
| Reading insights (text) | Teacher | `insights.html` |
| Video insights | Teacher | `video-lesson.html?view=teacher` |

Useful states: `lesson.html?state=returning&demo=explain`, `lesson.html?state=returning&open=settings`, `video-lesson.html?state=returning&demo=select`, `video-lesson.html?state=returning&source=drive&open=notebook`. The full param list is in `prototypes/lesson-reader/README.md`.

## Purpose

Make reading and watching a lesson the best part of a ClassroomIO course. The reference is **Gloss** (a reader by @nutlope built on Together AI): select any line, ask it anything, and the answer appears in the margin next to that sentence; highlights go into a notebook and come back later. ClassroomIO adds what a standalone reader can't: the notebook spans a whole course, works on video lessons through the transcript, resurfaces on the student dashboard, and tells teachers which passages and moments confuse learners.

## Problem Statement

- Learners can't highlight, annotate or bookmark anything in a lesson. Revision means re-reading or re-watching from the start.
- Asking AI about a passage means copying text into the Assistant (`quote-selection.svelte` only offers "quote to AI"). The answer lands in a chat panel, away from the sentence it explains, and isn't saved anywhere tied to the lesson.
- Lesson text has one fixed look: no size, typeface, spacing, width or theme control, and no dyslexia-friendly option.
- Text lessons have no reading progress or resume. Only video has that (`lesson_video_progress`).
- On video lessons there is no way to save a moment, take a timestamped note, or ask about what was just said. The transcript panel can be read and clicked, but not selected or saved from.
- "Summarize lesson" runs per learner, so a 500-learner course pays 500 times for the same summary.
- Teachers have no signal about which paragraphs or video moments learners struggle with.

## Decisions

These are the product calls the prototype is built on. They were proposed in the plan and adopted in the prototypes without a separate sign-off, so **each one is open to veto before its phase starts**.

1. **One reader on the existing lesson page**, not a separate mode or route. Learners get two new header buttons, **Aa** (reader settings) and **Notebook (n)**. Everything else appears on demand.
2. **Defaults change nothing.** The default theme follows the app (light/dark), the default font stays Geist and paragraph numbers are off, so a lesson looks the same until a learner changes something.
3. **Reader themes recolour the whole course player** (sidebar, header and lesson column), not just the text column.
4. **Highlights are anchored, never written into lesson content.** Block indexes are derived at render time; `lesson_language.content` is never modified.
5. **AI answers attach to the selection** and appear as margin cards on desktop, inline cards under the paragraph when space is tight and on mobile. Learners can switch answers to the Assistant chat in **Aa → Answers**.
6. **Explain / Define / Ask count against the student tutor quota** (`enforceStudentTutorPolicy`). A card and its follow-ups count as one thread, not one message per follow-up.
7. **AI switched off** (org setting, no keys, or quota used up) hides AI actions and the brief. Highlights, notes, bookmarks, focus, listen and the notebook still work.
8. **Public (signed-out) lessons** get reading comfort and highlights stored in the browser only ("These live in this browser only. Sign in to keep them on every device"). AI actions ask visitors to sign in.
9. **The lesson brief is generated once per lesson, locale and content version** and shared by the whole course. It replaces the per-learner "Summarize lesson" call.
10. **Read-to-complete is a teacher opt-in** per lesson (`completionPolicy: 'read'`). The default stays `manual`.
11. **Video lessons use the same notebook.** Entries anchor to a time (and, from the transcript, to segment offsets plus the exact words). Bookmark (`B`), Note (`N`) and Ask about this moment (`A`) live in the player.
12. **Provider capability decides video features.** Uploads get everything. YouTube and Vimeo need their player APIs before markers and seek work. Google Drive and generic embeds can't report time, so notes there belong to the whole video with an optional time the learner types.
13. **The Notebook is a new course sidebar item** with its own page, plus a side panel on lesson pages.
14. **Teacher insights are aggregate only.** A passage or moment shows only once 3 or more learners have marked it, and learners are never named.

## Current-State Audit

| Capability | Current state | Notes |
| --- | --- | --- |
| Lesson body | TipTap HTML in `lesson_language.content`, rendered by `components/lesson/note/note.svelte` → `HTMLRender` → `SafeHtmlContent` (DOMPurify) | Reader wraps this render; content stays author-only |
| Selection chip | `components/lesson/note/quote-selection.svelte` shows "quote to AI" | Grows into the selection toolbar |
| Side panels | `features/side-panel/side-panel-rail.svelte` hosts AI chat and transcript panels | Notebook becomes another panel |
| Heading ids / outline | `injectHeadingIds` + `PageOutline` (`packages/ui/src/custom/page-outline`) used by `public-course/lesson-view.svelte` | Same approach for block indexes: derived, not stored |
| AI | `/agent/chat` (streaming), `/agent/summarize` in `apps/api/src/routes/agent/agent.ts`; `createModel` in `packages/ai-assistant/src/providers` | Explain reuses the provider plumbing with a small fast model |
| Tutor quota | `enforceStudentTutorPolicy` in `apps/api/src/services/agent/tutor-usage.ts` | Explain/Define/Ask go through it. See `prd/ai-tutor-fair-use` |
| User preferences | `profile.settings` jsonb, merged on update | Reader prefs live under `settings.reader` |
| Resume / progress | `lesson_video_progress` (`lastPositionSeconds`, `furthestSeconds`) via `GET/PUT /course/:courseId/lesson/:lessonId/watch-progress` | Text needs its own equivalent |
| Completion policies | `lesson.completion_policy`: `manual` \| `video_watch` \| `none` (`packages/utils/src/validation/lesson/lesson.ts`) | Add `read` |
| Video transcripts | `media_transcript.segments` (Whisper, uploads) and `youtube_caption.segments`, both `{ start, end, text }` | The text layer for video annotations |
| Video player | `components/lesson/video/lesson-video-player.svelte`, `lesson-video-bus.svelte.ts` (current time, `seek`), `transcript-side-panel.svelte` | YouTube/Vimeo are plain iframes: the YouTube transcript source registers `seek: () => {}` |
| Highlights, notes, bookmarks | None | New |
| Reading progress for text | None | New |
| Reader settings (type, size, theme) | None | New |
| Read aloud | None | Browser `speechSynthesis` in v1 |
| Teacher reading/watching signals | None | New, aggregate only |

## Product Goals

- A learner can highlight, annotate and ask about any line of a text lesson, and any moment or transcript line of a video lesson, without leaving the lesson.
- AI answers are fast, short, tied to the sentence or moment, and saved.
- Everything a learner saves is findable later: per lesson, across the course, and resurfaced on the dashboard.
- Reading is comfortable and accessible: themes, type, size, spacing, width, a legible font, focus and listen.
- Teachers see where learners struggle, without identifying anyone.

## Non-Goals (v1)

- Server-generated audio for Listen (v2 option; v1 uses the browser voice).
- Sharing highlights between learners, social or public highlights.
- Annotating slides, documents or PDFs (only the lesson note body and video transcripts).
- Annotating exercises.
- Flashcards or spaced-repetition beyond the dashboard resurfacing card.
- Teacher-visible individual notebooks.
- Vimeo transcripts (no transcript store exists for Vimeo yet).

## Functional Requirements

### Learner — text lesson (`lesson.html`)

**Header.** Under the title: reading time and section count ("12 min read · 8 sections"). Actions: **Aa**, **Notebook** with a count badge, **Mark as complete** (or a read-progress ring when the lesson uses `completionPolicy: 'read'`), prev/next, language.

**Selection toolbar.** Selecting text shows a floating toolbar: **Ask · Explain · Define | Highlight (colour on hover) · Note · Read aloud · Copy**. Keyboard: Shift+arrows to select, then `A`, `E`, `D`, `H`, `N`, `L`; `Esc` closes. Copy includes a `¶n` reference. With AI off, the first group is hidden. On mobile the toolbar docks above the bottom nav.

**Highlights and notes.** Four colours. A highlight can carry a note. Clicking a highlight opens a menu (change colour, add/edit note, ask, delete). Undo is offered in the toast after creating or deleting.

**Margin answers.** Explain, Define and Ask stream into a card in the right margin, joined to its sentence, labelled with the action and `¶n`. The key phrase of the answer is marked in the pen colour. Cards accept follow-ups and offer **Open in chat**, which carries the quote and answer into the Assistant. When the margin is too narrow (side panel open, mobile) cards render inline under their paragraph. A paragraph with a question shows a small marker.

**Ask.** Turns the toolbar into an input with the quoted text and suggestion chips.

**Aa settings** (popover on desktop, sheet on mobile):
- *Look*: themes (Auto, Paper, Sepia, Snow, Night), pen colour, highlighter colour, toggles for paragraph numbers, map, focus, listen.
- *Text*: typeface (Sans/Geist, Serif, Book, Legible), size, spacing, width, alignment, paragraph style, reset.
- *Answers*: length (brief/detailed), level (simple/standard/expert), where answers appear (margin/chat), show brief, remaining tutor allowance.

**Map rail.** A minimap with one tick per block: position, furthest read, headings, highlight and question marks. Click or drag to jump.

**Resume.** Returning learners see "Continue reading at ¶42" with the section name.

**Lesson brief.** A collapsible card above the lesson: the gist, key claims and a section list with paragraph ranges that jump to the section. First visitor triggers generation; everyone after reads the cache.

**Focus.** Hides course chrome (sidebar, header, Ask AI bar, panel rail) and dims all but the current paragraph. `Esc` exits.

**Listen.** Reads from the chosen paragraph with the browser voice for the lesson locale, highlighting the current sentence. Play/pause, skip paragraph, speed. Sentence-level highlighting with a timer fallback (see Risks).

**Notebook panel.** Tabs All / Questions / Highlights; scope This lesson / Whole course; items jump to their paragraph; copy and download as Markdown. A highlight whose passage changed shows "This passage changed after you highlighted it. Your original text is kept here."

**States.** First visit (empty notebook with guidance), returning, AI off, read-to-complete, quota exhausted (AI actions show the "taking a break" state from `prd/ai-tutor-fair-use`), multiple locales (annotations are per locale).

### Learner — video lesson (`video-lesson.html`)

**Player.** Notebook markers on the scrub bar (bookmark, note, highlight range, question), colour-coded. Hovering the bar shows a time label; hovering a marker previews its content; clicking jumps there. **Bookmark (`B`)**, **Note (`N`)** and **Ask (`A`)** sit in the control bar on desktop and in a row under the player on mobile. Other shortcuts: `Space`/`K`, `J`/`L` (±10s), arrows (±5s), `C` captions, `T` transcript.

**Note.** `N` pauses and opens a composer under the player with the time, the transcript line being spoken, a colour and a text field. "Save and resume" when the video was playing.

**Ask about this moment.** Composer under the player showing the transcript window used as context (45s before to 15s after the playhead), an input and chips ("What did they just say?", "Explain this step", "Give me an example", "Why does this matter?"). The answer card appears under the player with its time chip and is saved.

**Transcript panel.** Selecting words gives the reader toolbar: **Ask · Explain · Define | Highlight · Note · Play from here · Copy (with timestamp)**. Explain/Define/Ask answers open inline under the selected line. Bookmarks and notes appear as chips on their lines. "Follow video" auto-scroll pauses while the learner hovers or scrolls.

**Notebook panel (video).** Tabs All / Moments / Highlights / Questions. Groups: the video in time order, then lesson-notes entries by `¶`, then entries from a video the teacher replaced ("Your teacher replaced this video. Your note and the line you saved are kept."). Time chips play from that moment.

**Provider variants.**

| Provider | Markers / seek | Transcript | Behaviour |
| --- | --- | --- | --- |
| Upload | Our player | Whisper (`media_transcript`) | Everything |
| YouTube | Strip under the player (YouTube draws its own controls); needs the IFrame API | Cached captions (`youtube_caption`) | Everything once the API is wired |
| Vimeo | Strip under the player; needs the Player SDK | None | Bookmarks, notes, Ask (no transcript selection) |
| Google Drive, generic embed | None | None | Notes on the whole video with an optional typed time; Ask uses the lesson notes |

**Watch enforcement.** When skipping ahead is blocked, seeking past the furthest point shows the existing "You cannot skip ahead on this video" message and unwatched transcript lines are dimmed. Notebook jumps never exceed the furthest point because entries can only be created at watched moments.

**Not carried over to video.** Read aloud and paragraph numbers. Focus becomes theatre mode.

### Learner — course notebook (`notebook.html`)

A new **Notebook** item in the course sidebar. Stats (highlights, questions, notes, lessons), "Review what you saved" quiz built only from the learner's own entries, tabs (All, Highlights, Questions, Notes), colour filter, search, export (copy/download Markdown). Entries are grouped by section and lesson; text entries link to `¶n`, video entries link to their time. Empty state explains how to save things.

### Learner — dashboard resurfacing (`home.html`)

A "From your notebook" card on the student dashboard brings back highlights and video moments on a schedule (1 day, 3 days, a week, a month). Each item: the quote (or a short clip for video moments), source, **Open in lesson / Watch in lesson**, **Test me on this** (reveals an answer prompt), **Got it** (pushes it back). "All caught up" empty state. A "Recently asked" list links to the questions.

### Visitor — public lesson (`public-lesson.html`)

Reader settings and highlights work, stored in the browser. The notebook footer says entries live in this browser only. Explain/Define/Ask show a locked card with **Sign in**. On sign-in, browser highlights for that lesson are offered for import.

### Teacher — reading insights (`insights.html`)

Per lesson, paragraph heat (highlights + questions), question dots, the top questions per passage, and **Rewrite with AI** for a passage. Only passages marked by 3+ learners appear. No learner names.

### Teacher — video insights (`video-lesson.html?view=teacher`)

A heat strip along the timeline (bookmarks + questions + rewinds per 12-second bin), peaks labelled with their time, and a list of top moments with counts, the top question and a suggested next step. Actions: **Draft a note for the lesson**, **Add chapter here**, **See all questions** (unnamed). Same 3-learner threshold.

## Technical Design

### Blocks and anchors

- **Block index.** On render, walk top-level blocks of the note body (paragraphs, list items, headings, callouts, table cells, code blocks) and assign indexes. They drive `¶` numbers, the map, resume and brief ranges. Nothing is written into `lesson_language.content`, matching how `injectHeadingIds` works.
- **Text anchor.** Store a text-quote selector: `quote_exact`, ~32-character `quote_prefix` / `quote_suffix`, `block_index`, `start_offset`, `end_offset` and the `content_hash` of the version it was made on. The quote is the anchor itself, not a display copy of another row, so it does not break the "copied values" rule in CLAUDE.md. The PR must say this explicitly.
- **Re-anchoring.** If `content_hash` differs: search for `prefix + exact + suffix` near the old block, then anywhere, then fuzzy on `exact`. If nothing matches, the entry is shown as "passage changed". This status is computed at render time and never stored.
- **Video anchor.** Store `start_seconds` (and `end_seconds` for ranges), the video reference, and for transcript selections the segment indexes, offsets and `quote_exact`. Time is the primary anchor; the quote re-anchors after re-transcription. An entry whose video is no longer in `lesson.videos` is shown as "video replaced", computed at render.
- **Painting.** Use the CSS Custom Highlight API (`CSS.highlights`, `::highlight()`), which paints without touching the `{@html}` DOM, so KaTeX, sandboxed iframes and author TipTap marks are left alone. Supported in Chrome, Safari 17.2+ and Firefox 140+. Fallback for older browsers: highlights are listed in the notebook but not painted.

### Data model

One migration per phase PR (CLAUDE.md: one migration file per PR).

```ts
// packages/db/src/schema.ts
export const lessonAnnotation = pgTable(
  'lesson_annotation',
  {
    id: uuid().default(sql`gen_random_uuid()`).primaryKey().notNull(),
    profileId: uuid('profile_id').notNull(),
    courseId: uuid('course_id').notNull(),
    lessonId: uuid('lesson_id').notNull(),
    parentId: uuid('parent_id'), // follow-up question → its thread root
    locale: varchar({ length: 8 }).notNull(),
    kind: varchar({ length: 16 }).notNull(), // 'highlight' | 'note' | 'bookmark' | 'question'
    source: varchar({ length: 8 }).notNull(), // 'text' | 'video'
    color: varchar({ length: 16 }),
    note: text(),

    // text anchor
    blockIndex: integer('block_index'),
    contentHash: varchar('content_hash', { length: 64 }),

    // video anchor
    videoAssetId: uuid('video_asset_id'), // uploads; FK asset.id, on delete set null
    videoProvider: varchar('video_provider', { length: 16 }), // 'upload' | 'youtube' | 'vimeo' | 'google_drive' | 'generic'
    videoExternalId: varchar('video_external_id', { length: 64 }), // YouTube / Vimeo id
    startSeconds: numeric('start_seconds'),
    endSeconds: numeric('end_seconds'),
    segmentStart: integer('segment_start'),
    segmentEnd: integer('segment_end'),

    // shared selection fields (text block offsets or transcript segment offsets)
    startOffset: integer('start_offset'),
    endOffset: integer('end_offset'),
    quoteExact: text('quote_exact'),
    quotePrefix: text('quote_prefix'),
    quoteSuffix: text('quote_suffix'),

    // questions
    action: varchar({ length: 16 }), // 'explain' | 'define' | 'ask' | 'moment'
    question: text(),
    answer: text(),
    contextFromSeconds: numeric('context_from_seconds'),
    contextToSeconds: numeric('context_to_seconds'),

    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
    deletedAt: timestamp('deleted_at', { withTimezone: true, mode: 'string' })
  },
  (table) => [
    // FKs: profile (cascade), course (cascade), lesson (cascade), asset (set null), parent (cascade)
    index('idx_lesson_annotation_profile_lesson').on(table.profileId, table.lessonId),
    index('idx_lesson_annotation_profile_course').on(table.profileId, table.courseId),
    index('idx_lesson_annotation_lesson_kind').on(table.lessonId, table.kind)
  ]
);

export const lessonReadingProgress = pgTable(
  'lesson_reading_progress',
  {
    id: uuid().default(sql`gen_random_uuid()`).primaryKey().notNull(),
    profileId: uuid('profile_id').notNull(),
    lessonId: uuid('lesson_id').notNull(),
    locale: varchar({ length: 8 }).notNull(),
    lastBlockIndex: integer('last_block_index').default(0).notNull(),
    furthestBlockIndex: integer('furthest_block_index').default(0).notNull(),
    blockCount: integer('block_count').notNull(),
    contentHash: varchar('content_hash', { length: 64 }).notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull()
  },
  (table) => [unique('lesson_reading_progress_profile_lesson_unique').on(table.profileId, table.lessonId)]
);

export const lessonBrief = pgTable(
  'lesson_brief',
  {
    id: uuid().default(sql`gen_random_uuid()`).primaryKey().notNull(),
    lessonId: uuid('lesson_id').notNull(),
    locale: varchar({ length: 8 }).notNull(),
    contentHash: varchar('content_hash', { length: 64 }).notNull(),
    brief: jsonb().$type<{ gist: string; claims: { text: string; block: number }[]; parts: { title: string; fromBlock: number; toBlock: number }[] }>().notNull(),
    model: varchar({ length: 64 }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull()
  },
  (table) => [unique('lesson_brief_lesson_locale_hash_unique').on(table.lessonId, table.locale, table.contentHash)]
);
```

Rules this follows:

- Relational IDs are real columns with FKs (`video_asset_id`, `parent_id`), never inside jsonb. `video_external_id` is a provider's id, not a relation.
- Computed values are not stored: read percentage is derived from `furthestBlockIndex / blockCount`; "passage changed" and "video replaced" are computed at render.
- `answer` is the learner's own saved data, not a copy of another row.

**Reader preferences** live in `profile.settings.reader` (no new table):

```ts
type ReaderPrefs = {
  theme: 'auto' | 'paper' | 'sepia' | 'snow' | 'night';
  pen: 'cobalt' | 'vermillion' | 'green' | 'graphite';
  highlighter: 'yellow' | 'green' | 'blue' | 'pink';
  face: 'sans' | 'serif' | 'book' | 'legible';
  size: number;
  spacing: 'snug' | 'even' | 'airy';
  width: 'narrow' | 'even' | 'wide';
  align: 'left' | 'justify';
  paragraphs: 'spaced' | 'indented';
  numbers: boolean;
  map: boolean;
  answerLength: 'brief' | 'detailed';
  answerLevel: 'simple' | 'standard' | 'expert';
  answersIn: 'margin' | 'chat';
  showBrief: boolean;
};
```

Signed-out visitors keep prefs and highlights in `localStorage`.

**Completion.** Add `'read'` to `completionPolicy` (`z.enum(['manual', 'video_watch', 'none', 'read'])`). A lesson with `read` completes when `furthestBlockIndex` reaches the last block (90% of blocks for very long lessons). Existing completion flow handles the transition.

**Video rewinds (insights only).** `lesson_video_progress` doesn't record rewinds today. Phase 6 adds a per-learner rewatch histogram (counts per 12-second bin) to that table, written from the existing watch-progress heartbeat. Until then, video insights use bookmarks, notes and questions only.

### Core logic

```
reanchor(entry, blocks):
  if entry.contentHash == currentHash: return rangeAt(entry.blockIndex, entry.startOffset, entry.endOffset)
  near = search(blocks[entry.blockIndex - 3 .. entry.blockIndex + 3], prefix + exact + suffix)
  if near: return near
  anywhere = search(blocks, prefix + exact + suffix) ?? search(blocks, exact)
  if anywhere: return anywhere
  return fuzzy(blocks, exact, threshold = 0.8) ?? ORPHANED

explain(courseId, lessonId, locale, action, selection, blockIndex | seconds, question?, prefs):
  assertEnrolledStudentContentAccess(...)
  enforceStudentTutorPolicy(orgId, courseId, userId)   // counts once per thread (parentId == null)
  context = source == 'text'
    ? lessonBlocks(lessonId, locale)[blockIndex - 2 .. blockIndex + 2]   // loaded server-side, never trusted from client
    : transcriptSegments(video)[seconds - 45 .. seconds + 15]
  stream(createModel(fastModel), prompt(action, selection, context, prefs))
  on finish: insert lesson_annotation(kind = 'question', ...), record tutor usage

brief(lessonId, locale):
  hash = sha256(lesson_language.content)
  return lesson_brief where (lessonId, locale, hash) ?? generateAndInsert(...)   // one generation per version, unique constraint de-dupes races

insights(lessonId):
  select block_index | time_bin, kind, count(*), count(distinct profile_id) as learners
  from lesson_annotation where lesson_id = ? and deleted_at is null
  group by ... having count(distinct profile_id) >= 3
```

### API

Course routes mount under the existing `/course` router (`/course/:courseId/lesson/...`), and Explain under the existing `/agent` router, so `app.ts` gets no new mounts. Every learner route uses `authMiddleware`, `courseMemberMiddleware` and `assertEnrolledStudentContentAccess`, like `watch-progress`.

| Method | Path | Who | Returns |
| --- | --- | --- | --- |
| GET | `/course/:courseId/lesson/:lessonId/annotations` | Learner (own rows) | Annotations for the lesson and locale |
| POST | `/course/:courseId/lesson/:lessonId/annotations` | Learner | Created annotation |
| PATCH | `/course/:courseId/lesson/:lessonId/annotations/:annotationId` | Learner (own row) | Updated annotation (colour, note) |
| DELETE | `/course/:courseId/lesson/:lessonId/annotations/:annotationId` | Learner (own row) | Soft delete |
| POST | `/course/:courseId/lesson/:lessonId/annotations/import` | Learner | Imports browser-stored highlights after sign-in |
| GET | `/course/:courseId/lesson/:lessonId/reading-progress` | Learner | Progress row |
| PUT | `/course/:courseId/lesson/:lessonId/reading-progress` | Learner | Progress row (debounced heartbeat) |
| GET | `/course/:courseId/lesson/:lessonId/brief` | Learner | Cached brief or `null` |
| POST | `/course/:courseId/lesson/:lessonId/brief` | Learner | Brief (generates when missing for this hash) |
| GET | `/course/:courseId/notebook` | Learner | All own annotations in the course, grouped by lesson |
| GET | `/course/:courseId/notebook/resurface` | Learner | Due items for the dashboard card |
| POST | `/course/:courseId/notebook/resurface/:annotationId` | Learner | Marks "Got it" and schedules the next date |
| GET | `/course/:courseId/lesson/:lessonId/insights` | Teacher/admin | Aggregates above the threshold |
| POST | `/agent/explain` | Learner | Streamed answer; persists the question annotation |

Each route returns a single shape (CLAUDE.md). Validation lives in `packages/utils/src/validation/lesson-reader/`, queries in `packages/db/src/queries/lesson-reader/`, services in `apps/api/src/services/lesson-reader/`.

The resurfacing schedule (`next_review_at`, `review_step`) is stored on a small `lesson_annotation_review` table (profile, annotation, next date, step) added in Phase 6, so `lesson_annotation` stays focused.

### Frontend

- **`packages/ui/src/custom/lesson-reader/`** (each with a Storybook story covering every state):
  - `reader-surface` — theme and type variables scoped to the course player; covers `callout.css`, KaTeX and code blocks.
  - `reader-settings` — Look / Text / Answers popover and sheet.
  - `reader-map`
  - `margin-card`
  - `lesson-brief-card`
  - `notebook-item` (text and video variants)
  - Living in `packages/ui` lets the authenticated lesson and `public-course/lesson-view.svelte` share one implementation.
- **`apps/dashboard/src/lib/features/course/components/lesson/reader/`**:
  - `selection-toolbar.svelte` (replaces `quote-selection.svelte`)
  - `listen-controls.svelte`
  - `block-index.ts`, `text-anchor.ts` — pure, unit-tested helpers
- **Video:** extend `lesson-video-player.svelte` with markers and moment buttons; `transcript-side-panel.svelte` gets selection and inline cards; `lesson-video-bus.svelte.ts` gets real `seek` for YouTube (IFrame API) and Vimeo (Player SDK).
- **Notebook:** `apps/dashboard/src/lib/features/notebook/` — side panel registration (scope `'lesson' | 'course'`), the course page route, and the dashboard card.
- **API classes:** `AnnotationApi`, `ReaderApi`, `NotebookApi` in their feature `api/` folders using `this.execute<RequestType>()`; types inferred in `utils/types.ts`.
- **Copy:** all strings in `en.json`, then `pnpm translate`.
- `ScrollToTop` is already mounted on the course layout; the map rail and listen player must keep its clearance.

## Implementation Order

Each phase is its own PR with at most one migration.

1. **Reader foundations** — block index, reading time, Aa settings (Look, Text), focus, `¶` numbers, map, resume, `profile.settings.reader`. Migration: `lesson_reading_progress`.
2. **Highlights and notebook (text)** — anchoring and re-anchoring, Custom Highlight painting, notebook panel, course notebook page and sidebar item, export, public browser-only highlights and import. Migration: `lesson_annotation`.
3. **AI margin** — `/agent/explain`, Explain / Define / Ask, margin and inline cards, follow-ups, Open in chat, Answers settings, quota handling. No migration.
4. **Lesson brief** — cached brief, replaces "Summarize lesson" on text lessons. Migration: `lesson_brief`.
5. **Video notebook** — bookmarks, notes, markers and notebook for uploads; transcript selection and Ask about this moment; then YouTube IFrame API and Vimeo SDK. No migration (uses `lesson_annotation`).
6. **Listen, resurfacing and insights** — browser TTS, dashboard card, `read` completion policy, teacher text and video insights, rewatch histogram. Migration: `lesson_annotation_review` + rewatch column.

Verification per phase (Node 20):

```bash
export PATH="$HOME/.nvm/versions/node/v20.19.3/bin:$PATH"
pnpm --filter @cio/api^... build && pnpm --filter @cio/api build
test -f apps/dashboard/.env || cp apps/dashboard/.env.example apps/dashboard/.env
pnpm --filter @cio/dashboard^... build && pnpm --filter @cio/dashboard build
pnpm --filter @cio/ui prefix:check
pnpm format:check
```

Check the migration journal `when` against `main` before merging each migration PR (see CLAUDE.md).

## Acceptance Criteria

1. Selecting text in a lesson shows the toolbar within 100 ms; Highlight saves and paints the selection and survives a reload.
2. Editing a lesson keeps existing highlights in place when their text still exists; highlights whose text was removed appear in the notebook as "passage changed" with the original quote.
3. `lesson_language.content` is byte-identical before and after any learner action.
4. Explain / Define / Ask stream an answer into a card tied to the selection; the first token arrives in under 1.5 s on the configured fast model; the question is saved and appears in the notebook.
5. A card's follow-ups count once against the tutor quota; with the quota exhausted, AI actions show the "taking a break" state and highlights still work.
6. With AI off for the org, no AI control, brief or Ask bar is rendered, and highlights, notes, focus, listen and the notebook work.
7. Reader settings persist across devices for signed-in learners and in the browser for visitors.
8. A returning learner sees resume at their last block; `completionPolicy: 'read'` completes the lesson at the last block.
9. The brief is generated once per lesson, locale and content version, no matter how many learners open it.
10. On an uploaded video, `B` adds a marker at the current time, `N` pauses and saves a note, `A` answers from the transcript window; clicking a marker or notebook time chip seeks there.
11. Selecting transcript words offers Highlight, Note, Ask, Explain, Define, Play from here and Copy; saved items show on the transcript line and in the notebook.
12. With skipping blocked, no notebook jump or marker click seeks past the furthest watched point.
13. YouTube lessons show markers on the strip and seek correctly once the IFrame API ships; Google Drive lessons offer whole-video notes only.
14. The course notebook lists every own entry grouped by lesson, filters and searches live, and exports Markdown with `¶n` and `[m:ss]` references.
15. Teacher insights never show a passage or moment marked by fewer than 3 learners and never show a learner's name.
16. A learner can never read or modify another learner's annotations (API returns 404).
17. Every reader surface works at 390 px, with keyboard only, with `prefers-reduced-motion`, and meets contrast in every theme.
18. All copy uses translation keys; other locales are generated with `pnpm translate`.
19. Zero regression on existing lesson, video, transcript, Assistant, completion and public lesson behaviour.

## Risks and Mitigations

| Risk | Mitigation |
| --- | --- |
| Teacher edits break highlights | Text-quote anchors with prefix/suffix, nearby-then-global-then-fuzzy re-anchoring, orphans kept with the original quote |
| Custom highlights unsupported in an older browser | Feature-detect `CSS.highlights`; list highlights in the notebook without painting |
| iOS native selection menu clashes with a custom toolbar | Docked bottom action bar on touch devices; inline answer cards |
| AI cost from a large course | Tutor quota per thread; small fast model; brief cached per version, not per learner |
| Prompt injection through lesson text sent by the client | The server loads lesson blocks and transcript segments itself; the client sends only ids, offsets and the question |
| `speechSynthesis` boundary events don't fire on Android or with network voices | Highlight by sentence and advance on `end` with a timer fallback; never depend on word boundaries |
| YouTube/Vimeo players are plain iframes today | Phase 5 adds the IFrame API / Player SDK; until then markers render but seek is disabled with a tooltip |
| Teachers swap a video and orphan notes | Anchor to `video_asset_id` / provider id, never the index in `lesson.videos`; show "video replaced" with the saved line |
| Learners identifiable in small cohorts | 3-learner threshold on every aggregate; no names, no per-learner drill-down |
| Reviewers flag `quote_exact` as a copied value | PR description states it is the anchor itself, required for re-anchoring, not display data from another row |
| Theme bleed into embedded content (KaTeX, callouts, code, iframes) | Theme variables scoped to the course player and audited against `callout.css`, KaTeX and code blocks in Storybook |
