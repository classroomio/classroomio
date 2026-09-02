---
name: Interactive Video Checkpoints
overview: Pause an uploaded lesson video at teacher-set timestamps, show a single-choice or true/false question overlay, then resume playback when the learner answers. Reuses existing lessons, the Plyr media player, RADIO/TRUE_FALSE renderers, sequential progression, the final-exam Exercise, and certificate rules. Does not add a new course content type.
todos:
  - id: schema-checkpoints
    content: Add lesson_video_checkpoint, lesson_video_checkpoint_option, and lesson_video_checkpoint_answer tables in packages/db/src/schema.ts
    status: pending
  - id: api-crud-answer
    content: Lesson-nested checkpoint CRUD plus student answer route, wired through validation → queries → services → routes
    status: pending
  - id: player-overlay
    content: Cue engine on HTML5/Plyr playback with in-player overlay, seek lock past unanswered cues, fullscreen-safe
    status: pending
  - id: teacher-timeline
    content: Video-tab timeline authoring for uploaded videos; YouTube/Drive/generic remain blocked with an upload CTA
    status: pending
  - id: completion-gating
    content: Extend video_watch and manual completion so unanswered checkpoints block lesson complete, clone, and reset-progress
    status: pending
  - id: public-practice
    content: Public course preview can show overlays in-memory only; no persisted answers
    status: pending
isProject: false
---

# Interactive Video Checkpoints PRD

## Status

- Draft (prototyped, ready for engineering review)

## Date

- September 2, 2026

## Prototypes — the UX source of truth

**The UX of this feature must be taken from the prototype folder.** Interactive HTML prototypes for every surface live in [`prototypes/interactive-video-checkpoints/`](../../prototypes/interactive-video-checkpoints/) and are the approved design reference for layout, states (empty / YouTube-blocked / overlay / resume / exam / certificate), copy, and navigation flow. When this document and a prototype disagree on a UI detail, the prototype wins.

**Start here:**

```
prototypes/interactive-video-checkpoints/index.html
```

Open it in a browser — it maps the teacher authoring journey and the learner pause → answer → resume → exam → certificate journey. Each page has a light/dark toggle.

The prototypes are built on the real design tokens: `app-theme.css` mirrors `packages/ui/src/index.css` (OKLCH palette, Geist, `--radius: 0.625rem`, Button / Badge / Item recipes). Lesson chrome matches the authenticated course lesson page (`Page.Header` + contents sidebar + Video tab), not a new builder product.

| Surface | File |
| --- | --- |
| Entry | `index.html` |
| Teacher — course outline | `course-contents.html` |
| Teacher — Video tab + timeline | `teacher-video-tab.html` |
| Teacher — add/edit checkpoint | `teacher-add-checkpoint.html` |
| Teacher — YouTube blocked | `teacher-youtube-blocked.html` |
| Learner — playing | `student-playing.html` |
| Learner — overlay | `student-checkpoint.html` |
| Learner — resume | `student-resume.html` |
| Learner — final exam | `student-exam.html` |
| Learner — certificate | `student-certificate.html` |
| Public org-site preview | `public-preview.html` |

## Purpose

Let a non-programmer teacher attach **in-video questions** to an uploaded lesson video so playback pauses at a timestamp, the learner taps an answer, and the video resumes. The rest of the course — six short lessons, a graded final exam, an automatic certificate — stays the current ClassroomIO model.

The trigger is a typical LMS buyer who needs LearnWorlds-style “questions that pop up during the video,” but already has (or would be better served by) ClassroomIO’s lessons, exercises, watch enforcement, and certificates. The product answer is a **player feature on uploaded lessons**, not a parallel course builder.

## Problem Statement

- Teachers can already ship a six-video course with a passing exam and a branded certificate. They **cannot** pause the lesson player to ask a question without sending the student to a separate Exercise page.
- Exercises are **siblings of lessons** in the contents tree (`/courses/{id}/exercises/{id}`). Using them for mid-video checks would add sidebar items, submission emails, and grading rows for something that should be a tap-and-resume.
- The HTML5 player already tracks time, blocks seeking, and auto-completes on watch threshold. It has **no cue/overlay layer**.
- YouTube and Google Drive lesson videos are **dumb iframes** (`packages/ui/src/custom/media-player/media-player.svelte`). The app cannot pause them at 2:14, so any design that promises in-video questions on a pasted YouTube link will fail the same way LearnWorlds failed this user (UI that claims a resume action the player cannot perform).
- Watch enforcement, sequential progression, and certificate evaluation already exist. A new content type or a hidden exercise would fork those pipelines.

## Confirmed Decisions

1. **Checkpoints hang off a lesson video, not a new contents-tree item.** They never appear in the course sidebar as Lessons or Exercises. The six videos stay six lessons; the exam stays one Exercise.
2. **v1 question types are `RADIO` and `TRUE_FALSE` only.** Reuse `@cio/question-types` keys and `@cio/ui/custom/exercise-question` take/edit renderers. No checkbox, numeric, file, or video-recording inside the player.
3. **In-video answers are formative.** They do **not** write `submission` / `question_answer` rows, do **not** email teachers, and do **not** feed `course.certificate.exerciseMinScorePercent`. The graded exam remains `course.certificate.requiredExerciseId`.
4. **Default resume policy is `any`:** the learner clicks an option and playback continues. Optional per-checkpoint `correct`: wrong answers stay on the overlay with “Try again”; correct answers resume. No LearnWorlds-style action menu (jump, open URL, skip).
5. **Uploaded / HLS videos only in v1.** Same enforceability rule as watch tracking (`isEnforceableLessonVideo` in `packages/core/src/utils/lesson-watch-enforcement.ts`). YouTube, Google Drive, generic embeds, and Muse show a blocked state with an upload CTA.
6. **Completion is an extension of today’s policies, not a fourth policy.** If a lesson has checkpoints: `video_watch` requires watch threshold **and** all checkpoints satisfied; `manual` rejects “Mark as complete” until they are satisfied; `none` still does not block sequential progression (overlays still pause playback).
7. **Seek-forward cannot skip an unanswered checkpoint.** Combine with the existing `seekPolicy.mode: 'locked_until_complete'` so the next unanswered timestamp is a hard ceiling, even if watch progress is further along.
8. **Overlay lives inside the player wrapper** so it survives Plyr fullscreen. It is not a `Dialog` (`z-modal`) and not a route change.
9. **Relational tables, not JSON on `lesson.videos`.** Checkpoint ids, options, and answers are rows. `lesson.videos` already stores `assetId`; we do not add nested question payloads there (no relational ids in jsonb; clone/reset/query stay SQL).
10. **Public org-site lessons** may show overlays for an unlocked public video, but answers stay in memory (same as today’s public Exercise practice). Authenticated LMS is the source of truth.
11. **Teacher authoring is on the existing Video tab**, under the uploaded player: a timestamp timeline + “Add question” at the current playhead. Not a new lesson tab, not Settings, not the Exercise editor.
12. **No programmer-facing concepts in the UI.** Copy is “Add a question at this time,” “Resume when they answer,” “Require the correct answer.” Never “cue,” “action,” or “resume video” as a hidden dropdown.

## Current-State Audit

| Capability | Current State | Gap |
| --- | --- | --- |
| Course contents | Lessons and exercises are ordered siblings (`packages/db/src/queries/course/content.ts`) | Do not add checkpoints to this union |
| Lesson videos | `lesson.videos` jsonb + `assets` + `asset_usages` (`slotType: 'lesson_video'`) | No timestamped child entities |
| HTML5 player | Plyr in `plyr-player.svelte`: `onTimeUpdate`, `onPlayerReady`, seek lock, pause-on-hide, loading overlay at `z-10` | No cue list, no question overlay, no play-lock while overlay open |
| YouTube / Drive / generic | Native `<iframe>` in `media-player.svelte`; **no** IFrame API, **no** timeupdate | Cannot host checkpoints; must be an explicit unsupported state |
| Watch progress | `lesson_video_progress` + `PUT .../watch-progress` every ~15s (`packages/core/src/services/lesson/lesson.ts`) | Completion ignores unanswered questions |
| Lesson completion | `manual` \| `video_watch` \| `none` (`lesson.completionPolicy`) | No “checkpoints satisfied” predicate |
| Sequential progression | `course.metadata.progressionMode` (`packages/utils/src/functions/course-progression.ts`); lessons with policy ≠ `none` block | Works automatically once lesson complete is gated |
| Question types | `RADIO` (id 1), `TRUE_FALSE` (id 4) auto-grade via `@cio/question-types` | Renderers exist; they only mount on the exercise page |
| Exercises / submissions | Full-page take, `submission` + emails + grading board | Wrong primitive for mid-video taps |
| Certificates | `evaluateCourseCertification`: progress threshold + optional `requiredExerciseId` (`apps/api/src/services/course/completion.ts`) | Keep as-is; do not add a checkpoint score rule |
| Course clone | Copies `lesson.videos` jsonb, then exercises (`apps/api/src/services/course/clone.ts`) | Must copy checkpoint + option rows keyed to new lesson ids (same `assetId`) |
| Reset progress | Deletes `lesson_completion` + `lesson_video_progress` (`packages/db/src/queries/course/reset-progress.ts`) | Must also delete checkpoint answers |
| Public lesson | First video only, no watch progress (`packages/ui/src/custom/public-course/lesson-view.svelte`) | Optional in-memory overlay; no API writes |
| AI / MCP lesson tools | `create_lesson`, `update_lesson_content` (`packages/core/src/services/agent/chat-tools.ts`) | Out of scope for v1 (cannot author checkpoints yet) |
| HOTSPOT question type | Built, **disabled** (`prd/exercise-question-types`) | Image hotspots, not video cues — do not reuse |

## Product Goals

1. A teacher uploads a short lesson video, scrubs to a moment, and adds a question without leaving the Video tab.
2. A learner watching that lesson is paused at each marker, answers in place, and the video continues from the same timestamp.
3. Unanswered checkpoints block lesson completion (and therefore sequential unlock of later lessons).
4. The existing final Exercise + certificate path is unchanged and remains how the course is “passed.”
5. YouTube-only lessons fail closed with a clear upload path, rather than showing a timeline that cannot fire.
6. Zero regression on lessons without checkpoints, YouTube embeds, watch enforcement, exercises, and certificates.

## Non-Goals (v1)

- YouTube IFrame API / Vimeo / Google Drive interactive cues.
- Scoring checkpoints into the exam or the certificate.
- Branching (jump to timestamp, open URL, skip remaining video).
- Question types other than `RADIO` and `TRUE_FALSE`.
- Checkpoints as Exercise rows, hidden or otherwise.
- A new completion policy value.
- In-player comments, polls, or discussion.
- AI/MCP authoring of checkpoints.
- Public-API / webhook events for checkpoint answers.
- Mobile native app (dashboard + public web only).
- Requiring a correct answer by default (that is an opt-in per question).

## Data Sources Checked

- Lesson schema and `videos` jsonb: `packages/db/src/schema.ts`
- Watch enforcement: `packages/core/src/utils/lesson-watch-enforcement.ts`
- Watch progress service: `packages/core/src/services/lesson/lesson.ts`
- Lesson routes: `apps/api/src/routes/course/lesson.ts`
- Media player split (iframe vs Plyr): `packages/ui/src/custom/media-player/media-player.svelte`, `players/plyr-player.svelte`
- Lesson Video tab: `apps/dashboard/src/lib/features/course/components/lesson/video/video.svelte`, `lesson-video-player.svelte`
- Progression: `packages/utils/src/functions/course-progression.ts`
- Certification: `apps/api/src/services/course/completion.ts`
- Clone: `apps/api/src/services/course/clone.ts`
- Reset progress: `packages/db/src/queries/course/reset-progress.ts`
- Question renderers: `packages/ui/src/custom/exercise-question/renderers/radio/take.svelte`, `true-false/take.svelte`
- Public lesson: `packages/ui/src/custom/public-course/lesson-view.svelte`

---

## Functional Requirements

### 1. Teacher — course outline (`course-contents.html`)

No new content type. The teacher still builds:

- Six lessons (one uploaded video each), sequential progression on, lesson completion `video_watch`.
- One Exercise at the end, `completionPolicy: 'passed'`, pass threshold (e.g. 70%).
- Certificates: downloadable, 100% progress, `requiredExerciseId` = that exam.

The contents list may show a **small question-count badge** on a lesson that has checkpoints (e.g. “2 questions”). It must not gain extra rows.

### 2. Teacher — Video tab timeline (`teacher-video-tab.html`)

Shown only when the selected video is an enforceable upload (has `assetId`, `type === 'upload'`).

- Player as today, plus a **marker rail** under the progress bar (or a sibling timeline using duration from `assets.durationSeconds` / `metadata.duration`).
- **Add question** primary button uses the current playhead. Disabled until metadata duration is known.
- Marker list under the player: time, prompt snippet, type chip, resume-policy chip, edit / delete.
- Drag a marker to change its timestamp (snap 1s). Collision: reject if within **2 seconds** of another marker on the same asset.
- Empty state: “Pause the video with a question. Students answer in place, then the video keeps playing.”
- Deleting the video deletes its checkpoints (cascade). Replacing the file (new `assetId`) does **not** migrate markers — timestamps would be wrong; show a confirm copy.

Badge on the Video tab = video count, unchanged. Checkpoint count lives on the marker list, not a new tab.

### 3. Teacher — add/edit dialog (`teacher-add-checkpoint.html`)

Dialog (not a new route). Fields:

- Timestamp (mm:ss), prefilled from playhead, editable.
- Type: Single answer / True or false (`QuestionTypePicker` subset).
- Prompt (`title`).
- Options: RADIO 2–6 options, exactly one `isCorrect`. TRUE_FALSE fixed True/False labels, one correct.
- Resume: radio **Continue after they answer** (default) vs **Require the correct answer**.
- Save / Cancel. Validation errors inline (`Field.Error`).

No points field. No “section.” No images on options in v1 (keeps the overlay compact).

YouTube/Drive/generic: `teacher-youtube-blocked.html` — helper + “Upload a video instead,” no fake timeline.

### 4. Learner — pause, answer, resume (`student-playing.html`, `student-checkpoint.html`, `student-resume.html`)

Authenticated lesson page, same route. When `onTimeUpdate` crosses an unanswered checkpoint for the current `assetId`:

1. `player.pause()`.
2. Overlay covers the video surface (inside the same `ui:relative` wrapper as the loading overlay). Heading = prompt. Body = existing take renderer. Primary control is choosing an option (RADIO/TRUE_FALSE already commit on select; add a **Continue** button so accidental clicks don’t auto-advance — **product call, see Risks**).
3. `resumePolicy === 'any'`: persist answer, close overlay, `player.play()`. Do not reveal the key.
4. `resumePolicy === 'correct'` and wrong: inline error, stay paused. Correct: persist, resume.
5. Space bar / Plyr play must not dismiss the overlay. Clicking the darkened video must not dismiss it.
6. Already-answered checkpoints never re-open on rewind. Rewind is allowed; playback through an answered marker is silent.
7. On reload, unanswered markers still fire; answered ids come from GET lesson (or GET checkpoints).

Keyboard: overlay traps focus; Escape does **not** skip.

### 5. Completion and progression

`areLessonCheckpointsSatisfied(lessonId, profileId)`:

- No checkpoints → true.
- Every checkpoint on the lesson’s videos has an answer row.
- If `resumePolicy === 'correct'`, that answer’s `isCorrect` must be true (the take UI already prevents leaving the overlay otherwise; this is the server guard).

Wire into:

- `updateLessonWatchProgressService` — do not set `lesson_completion` until watch threshold **and** checkpoints satisfied.
- `upsertLessonCompletionService` — if `manual` and checkpoints unsatisfied, `AppError` (same family as rejecting manual complete on `video_watch`).
- Contents sidebar lock state uses existing `isComplete`; no new lock reason.

### 6. Final exam and certificate

Unchanged. After the last lesson completes, Next goes to the Exercise. Passing that exercise + progress threshold issues the certificate. Checkpoints never appear on `/courses/{id}/submissions`.

### 7. Public preview (`public-preview.html`)

If the public lesson’s first video is an upload with checkpoints, overlays may run client-side. No POST. Refresh clears answers. Locked public lessons stay behind the existing callout.

### 8. Clone, reset, delete

- **Clone course:** after `createLessons`, copy checkpoint + option rows onto new `lessonId`s; keep `assetId` (clone already reuses the same video assets via jsonb).
- **Reset student progress:** delete `lesson_video_checkpoint_answer` for that profile on the course’s lessons, in the same transaction as video progress.
- **Delete lesson / video:** FK cascade from lesson; deleting one video’s `assetId` from `lesson.videos` must also delete checkpoints for that pair in the lesson-update service.

---

## Technical Design

### Data model

Do **not** generate files under `packages/db/src/migrations`. Edit `packages/db/src/schema.ts` only (repo convention). CI `db push` applies it.

```ts
export const lessonVideoCheckpoint = pgTable(
  'lesson_video_checkpoint',
  {
    id: uuid().default(sql`gen_random_uuid()`).primaryKey().notNull(),
    lessonId: uuid('lesson_id').notNull(),
    assetId: text('asset_id').notNull(),
    timestampSeconds: integer('timestamp_seconds').notNull(),
    questionType: varchar('question_type').notNull(), // 'RADIO' | 'TRUE_FALSE'
    title: text().notNull(),
    resumePolicy: varchar('resume_policy').notNull().default('any'), // 'any' | 'correct'
    order: integer().notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull()
  },
  (table) => [
    foreignKey({
      columns: [table.lessonId],
      foreignColumns: [lesson.id],
      name: 'lesson_video_checkpoint_lesson_id_fkey'
    }).onDelete('cascade'),
    index('idx_lesson_video_checkpoint_lesson_asset').on(table.lessonId, table.assetId)
  ]
);

export const lessonVideoCheckpointOption = pgTable(
  'lesson_video_checkpoint_option',
  {
    id: uuid().default(sql`gen_random_uuid()`).primaryKey().notNull(),
    checkpointId: uuid('checkpoint_id').notNull(),
    label: text().notNull(),
    isCorrect: boolean('is_correct').notNull().default(false),
    order: integer().notNull().default(0)
  },
  (table) => [
    foreignKey({
      columns: [table.checkpointId],
      foreignColumns: [lessonVideoCheckpoint.id],
      name: 'lesson_video_checkpoint_option_checkpoint_id_fkey'
    }).onDelete('cascade')
  ]
);

export const lessonVideoCheckpointAnswer = pgTable(
  'lesson_video_checkpoint_answer',
  {
    id: uuid().default(sql`gen_random_uuid()`).primaryKey().notNull(),
    checkpointId: uuid('checkpoint_id').notNull(),
    profileId: uuid('profile_id').notNull(),
    selectedOptionId: uuid('selected_option_id').notNull(),
    isCorrect: boolean('is_correct').notNull(),
    answeredAt: timestamp('answered_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull()
  },
  (table) => [
    foreignKey({
      columns: [table.checkpointId],
      foreignColumns: [lessonVideoCheckpoint.id],
      name: 'lesson_video_checkpoint_answer_checkpoint_id_fkey'
    }).onDelete('cascade'),
    foreignKey({
      columns: [table.profileId],
      foreignColumns: [profile.id],
      name: 'lesson_video_checkpoint_answer_profile_id_fkey'
    }).onDelete('cascade'),
    unique('lesson_video_checkpoint_answer_checkpoint_profile_unique').on(table.checkpointId, table.profileId)
  ]
);
```

Limits (service-enforced, not DB CHECKs):

- `timestampSeconds >= 0`, and `< durationSeconds` when duration is known.
- Minimum **2s** gap between timestamps on the same `(lessonId, assetId)`.
- Max **20** checkpoints per asset.
- RADIO: 2–6 options, exactly one `isCorrect`.
- TRUE_FALSE: exactly two options, labels supplied by the client from translation keys at save time? **No** — persist `True`/`False` as data the teacher sees in their locale at edit time is wrong. Persist stable keys `true` / `false` in `label` **or** store `value` `'true'|'false'` and render labels from i18n. Prefer a `value` column? Keep `label` as the displayed string the teacher typed (TRUE_FALSE uses translated defaults prefilled in the dialog, teacher can leave them). Student sees stored labels (same as exercise options today).

`assetId` is `text`, matching `lesson_video_progress.assetId` (not a FK to `assets`, because watch progress already uses text and clone shares ids).

Student GET must **omit `isCorrect` on options** until after that checkpoint is answered (and only then if we decide to reveal — v1 `any` never reveals; `correct` reveals by forcing retry). Teacher GET includes `isCorrect`.

### Core logic (pseudocode)

```
onTimeUpdate(seconds):
  if overlayOpen: return
  next = unanswered
    .filter(c => c.assetId == currentAssetId)
    .sort(by timestampSeconds)
    .find(c => seconds >= c.timestampSeconds)
  if next:
    pause()
    openOverlay(next)

maxSeekable = min(
  watchLockFurthestSeconds,          // existing
  nextUnanswered?.timestampSeconds   // new ceiling
)

completeLessonIfReady():
  watchOk = policy != video_watch || allEnforcedAssetsComplete
  checksOk = areLessonCheckpointsSatisfied(...)
  if policy == none: return
  if watchOk and checksOk: upsertLessonCompletion(true)
```

Answer POST is idempotent per `(checkpointId, profileId)`: first answer wins for `any`; for `correct`, allow update until `isCorrect` is true, then freeze.

### API routes

Mount on the existing lesson router (`apps/api/src/routes/course/lesson.ts`). Do **not** add a new `app.ts` root.

| Method | Path | Auth | Role | Body / notes |
| --- | --- | --- | --- | --- |
| `GET` | `/course/:courseId/lesson/:lessonId/checkpoints` | member | teacher: full; student: prompts + options without `isCorrect`, plus `answeredCheckpointIds` | |
| `POST` | `/course/:courseId/lesson/:lessonId/checkpoints` | staff | create | `assetId`, `timestampSeconds`, `questionType`, `title`, `resumePolicy`, `options[]` |
| `PUT` | `/course/:courseId/lesson/:lessonId/checkpoints/:checkpointId` | staff | update | same fields |
| `DELETE` | `/course/:courseId/lesson/:lessonId/checkpoints/:checkpointId` | staff | delete | |
| `POST` | `/course/:courseId/lesson/:lessonId/checkpoints/:checkpointId/answer` | enrolled student (or learner-view staff) | `{ optionId }` | returns `{ isCorrect, satisfied, didJustComplete }` |

Also include `checkpoints` + `checkpointAnswers` on `GET /course/:courseId/lesson/:lessonId` so the player does not wait on a second round-trip. Shape the student payload so options never leak the key.

Validation lives in `packages/utils/src/validation/lesson/` (new `checkpoint.ts`, re-exported from `lesson/index` if present, else `validation/lesson/lesson.ts` neighbor). Queries in `packages/db/src/queries/lesson/checkpoints.ts`. Services in `packages/core/src/services/lesson/` (or `apps/api/src/services` only if the work is HTTP-only — prefer core next to watch progress). Routes call services; no Drizzle in routes.

### Frontend plan

Follow dashboard layering: types in `apps/dashboard/src/lib/features/course/utils/types.ts` inferred from the Hono client; API class methods on `lesson.svelte.ts` via `this.execute`. No types in `.svelte.ts`. Copy in `en.json` then `pnpm translate`.

| Piece | Where |
| --- | --- |
| Overlay chrome | `@cio/ui/custom/video-checkpoint` (new). Host passes prompt, renderer slot, labels. **Storybook story required** (`packages/storybook/src/molecules/video-checkpoint/`). All Tailwind in `packages/ui` uses `ui:` prefix. |
| Cue engine | `apps/dashboard/.../lesson/video/checkpoint-engine.svelte.ts` (plain module, not types). Driven by `onTimeUpdate` + `onPlayerReady`. |
| Player mount | `lesson-video-player.svelte` wraps `MediaPlayer` in a relative box and slots the overlay **as a sibling covering the player**, including fullscreen (`:fullscreen` on that wrapper — may require putting the overlay *inside* `plyr-player.svelte` via a snippet/prop). Prefer a `checkpointOverlay` snippet/prop on `MediaPlayerOptions` so the overlay is a child of the same `ui:relative` div that already hosts loading/error overlays. |
| Authoring | `apps/dashboard/.../lesson/video/checkpoint-timeline.svelte` + `checkpoint-editor-dialog.svelte` on the Video tab, edit mode, enforceable videos only. |
| Public | `packages/ui/src/custom/public-course/lesson-view.svelte` — only if the public video source is HTML5; in-memory set of answered ids. |

Do not statically import `@cio/ui/base/chart`. Overlay has no charts.

Icon-only buttons (delete marker, skip-less timeline controls) use `variant="secondary"`.

### Seek / play lock

Extend `MediaPlayerOptions.seekPolicy` **or** add `cuePolicy: { maxSeconds: number }` that `handleSeekAttempt` already understands. Cleanest: compute `maxSeconds = min(watchFurthest, nextCue)` in `lesson-video-player` and pass it into the existing lock as `initialFurthestSeconds` that the cue engine **lowers** when an unanswered checkpoint is ahead. Do not fork a second seek interceptor.

While overlay is open: `player.pause()` on any `play` event (guard), `controls` click on play is no-op. Tab-hide already pauses when seek lock is on.

### Tests

- DB/service: create/update collision gap; answer idempotency; completion does not flip true with unanswered cues; `correct` policy rejects complete; clone copies N checkpoints; reset deletes answers; deleting a video’s asset clears its rows.
- Player unit (if extractable): given cues at 10 and 40, timeupdate 10.1 opens first; after answer, 40.0 opens second; rewind to 5 does not reopen.
- Do not add a dashboard jest file unless the existing jest config is fixed (known broken). Prefer vitest next to `packages/core` / `packages/utils`.

---

## Implementation Order

See [`implementation-plan.md`](./implementation-plan.md) for ticket-level breakdown. Phases an engineer can execute top to bottom:

1. **Schema + validation + queries** (no UI). `pnpm --filter @cio/utils build` / `@cio/db` types.
2. **Services + lesson routes** including GET lesson payload. `pnpm --filter @cio/api^... build && pnpm --filter @cio/api build`.
3. **Media player overlay slot + cue engine** on authenticated lesson (hard-coded fixture ok for a spike, then API). Storybook story in the same change as the UI component.
4. **Teacher timeline + dialog** on Video tab; YouTube blocked state.
5. **Completion gating + seek ceiling + clone + reset.**
6. **Public in-memory overlay.**
7. **Translations** (`cd apps/dashboard && pnpm translate`), `pnpm format:changed`, `pnpm format:check`, dashboard build.

Node 20:

```bash
export PATH="$HOME/.nvm/versions/node/v20.19.3/bin:$PATH"
```

---

## Acceptance Criteria

1. Teacher can add, edit, drag, and delete `RADIO` and `TRUE_FALSE` checkpoints on an uploaded lesson video from the Video tab without opening the Exercise editor.
2. Learner playback pauses at each unanswered timestamp, shows the overlay inside the player (including fullscreen), and resumes from the same time after a valid answer.
3. `resumePolicy: 'any'` resumes on the first option click/Continue; `'correct'` stays until the right option.
4. Forward seek and play cannot pass an unanswered checkpoint.
5. A lesson with checkpoints does not complete (watch auto-complete or Mark as complete) until every checkpoint is satisfied.
6. Sequential courses keep later lessons locked until that happens.
7. Final exam Exercise, submissions UI, and certificate evaluation behave exactly as today; checkpoint answers never appear as submissions.
8. YouTube / Drive / generic videos show the blocked empty state; no timeline.
9. Lessons with zero checkpoints are byte-for-byte the current player behavior (no extra pause, no extra API errors).
10. Course clone copies checkpoints; reset student progress clears answers; deleting the lesson or that video removes rows.
11. Public unlocked upload may overlay in-memory; refresh does not persist.
12. All user-facing copy uses translation keys; `{placeholders}` survive `pnpm translate`.
13. New `@cio/ui` component ships with a Storybook story and passes `pnpm --filter @cio/ui prefix:check`.
14. `pnpm format:check` and the API + dashboard builds for touched packages pass.

## Risks and Mitigations

| Risk | Mitigation |
| --- | --- |
| Overlay outside Plyr fullscreen is invisible | Mount overlay in the same relative wrapper as `plyr-player.svelte` loading overlay; verify fullscreen in the Storybook story and in the lesson page |
| `timeupdate` granularity skips a short cue | Fire when `seconds >= timestamp` and unanswered, not only on an equality window; ceiling seek so the playhead cannot jump over it |
| Teachers expect YouTube (the Reddit user’s likely source) | Blocked state with upload CTA; PRD is explicit that IFrame API is a later player upgrade, not v1 |
| Using Exercise rows “to save time” | Forbidden in Confirmed Decisions; it would spam submissions and the contents tree |
| Continue-on-select vs Continue button | Prototype uses an explicit Continue after selecting an option so mis-taps don’t burn a `correct` attempt; if engineering prefers RADIO’s native select-to-submit, update the prototype — prototype currently wins |
| Duration unknown (upload still processing) | Disable Add question until `durationSeconds` is present; same as watch enforcement waiting on duration |
| Multiple videos on one lesson | Checkpoints keyed by `assetId`; cue engine only inspects the player whose asset is playing |
| Clone shares `assetId` across courses | Acceptable (assets are already shared via copied jsonb). Checkpoints are per `lessonId`, so answers do not leak across the clone |

## Product calls made without a later veto

These came from the architecture discussion that preceded this PRD. Veto in review if needed:

1. Explicit **Continue** button on the overlay (not submit-on-radio-select).
2. Default resume policy **any**, not require-correct.
3. No correctness reveal after `any` answers.
4. Video-tab badge stays “number of videos,” not checkpoint count.

## How this maps to the six-video + exam + certificate course

```
Course (SELF_PACED, progressionMode: sequential)
├── Lesson 1  upload + checkpoints     completionPolicy: video_watch
├── Lesson 2  upload + checkpoints
├── Lesson 3  upload
├── Lesson 4  upload + checkpoints
├── Lesson 5  upload
├── Lesson 6  upload + checkpoints
└── Exercise  Final exam               completionPolicy: passed, passThreshold: 70
                                         certificate.requiredExerciseId + exerciseMinScorePercent
```

Teacher work is existing screens plus timeline markers. Student work never leaves the lesson player until the exam. That is the whole feature.
