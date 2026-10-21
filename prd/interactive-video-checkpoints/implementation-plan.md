# Interactive Video Checkpoints — Implementation Plan

Companion to [`README.md`](./README.md). Tickets are ordered so each phase can merge without a half-wired player.

## Scope lock (v1)

1. Checkpoints are rows on `(lessonId, assetId)`, not Exercise / `question` / `submission` rows.
2. Every enabled auto-gradable type (`RADIO`, `CHECKBOX`, `TRUE_FALSE`, `NUMERIC`, `FILL_BLANK`, `WORD_BANK`, premium `ORDERING` / `STAR`). No manual, survey, or disabled types.
3. Only enforceable uploaded videos (`type === 'upload'` + `assetId`).
4. Formative answers only — no certificate score, no grading board.
5. Resume policies: `any` (default) and `correct`.
6. Schema changes only in `packages/db/src/schema.ts` (no new files under `packages/db/src/migrations`).
7. Lesson router only — no new `app.ts` mount.
8. Overlay mounts inside the HTML5 player wrapper (fullscreen-safe).
9. Public answers are in-memory; authenticated answers persist.
10. Zero behavior change for lessons with no checkpoints.
11. Plan-gated with video upload (`FEATURES.EA_VIDEO_UPLOAD`); one service-layer guard for dashboard, public API and MCP.
12. Add/edit and Results are `@cio/ui/base/sheet` drawers, not dialogs.
13. Public API v1 and MCP tools ship with the feature (Phase F).

## Phase A — Foundation

| ID | Ticket | Done when |
| --- | --- | --- |
| A1 | Schema: `lessonVideoCheckpoint` (`settings` jsonb), `lessonVideoCheckpointOption` (`value`, `settings`), `lessonVideoCheckpointAnswer` (`answerData` jsonb) + Drizzle types | Types export from `@cio/db/types` |
| A2 | Zod: `ZCheckpointCreate`, `ZCheckpointUpdate`, `ZCheckpointAnswer` in `packages/utils/src/validation/lesson/` | `questionType` ∈ enabled auto-gradable keys; reuse exercise option/settings rules; `answerData` is `AnswerData`; `resumePolicy` enum; timestamp ≥ 0 |
| A3 | Queries in `packages/db/src/queries/lesson/checkpoints.ts`: list by lesson, list by asset, insert/update/delete checkpoint+options in one helper, upsert answer, list answers for profile, delete answers for profile+lessonIds, clone rows to a new lessonId | Optional `DbOrTxClient` on every write |
| A4 | `areLessonCheckpointsSatisfied(lessonId, profileId, client?)` | True when no rows; false when any unanswered; `correct` policy requires `isCorrect` |

**Verify:** `export PATH="$HOME/.nvm/versions/node/v20.19.3/bin:$PATH"` then `pnpm --filter @cio/utils build && pnpm --filter @cio/db build`.

## Phase B — API

| ID | Ticket | Done when |
| --- | --- | --- |
| B1 | Core services next to watch progress (`packages/core/src/services/lesson/`): staff CRUD, student list (strip answer keys), answer via `@cio/question-types` scoring, gap/max-20/enforceable-asset/premium-type guards | `AppError` + `ErrorCodes` on all failure paths |
| B2 | Routes on `apps/api/src/routes/course/lesson.ts` (table in the PRD) | Staff vs student payload split; `assertEnrolledStudentContentAccess` on answer + student GET |
| B3 | Include `checkpoints` (+ student `answeredCheckpointIds`) on `GET /course/:courseId/lesson/:lessonId` | Player can boot from one payload |
| B4 | Completion: `updateLessonWatchProgressService` and `upsertLessonCompletionService` call `areLessonCheckpointsSatisfied` | Manual complete rejected with a dedicated error code; `video_watch` waits on both watch + checkpoints |
| B5 | Clone: after `createLessons` in `apps/api/src/services/course/clone.ts`, copy checkpoints+options | New lesson ids, same `assetId` |
| B6 | Reset: delete answers in `reset-progress.ts` in the same transaction as `lesson_video_progress` | Impact counts include checkpoint answers |
| B8 | Plan guard: one shared entitlement check in core services, called by create, update, delete and results | Disallowed plan gets the standard plan `AppError`; reads of existing checkpoints still work after a downgrade |
| B9 | Results query and service: per-checkpoint answered / correct % / common wrong option, per-student list, CSV rows | Staff only; route `GET .../checkpoints/results` |
| B7 | Delete video: lesson update that drops an `assetId` from `lesson.videos` deletes that pair’s checkpoints | No orphan markers on a replaced file |

**Verify:** `pnpm --filter @cio/api^... build && pnpm --filter @cio/api build`. Add vitest next to core/utils for A4, B4, gap collision, answer freeze.

## Phase C — Player

| ID | Ticket | Done when |
| --- | --- | --- |
| C1 | `MediaPlayerOptions` grows a slot for overlay content (snippet or component) rendered inside the existing `ui:relative` wrapper in `plyr-player.svelte` | Loading overlay `z-10`, error `z-20`, checkpoint overlay above video, below error |
| C2 | `@cio/ui/custom/video-checkpoint` overlay chrome: prompt, slot for take renderer, Continue, try-again error, `ui:` prefix | Storybook story with idle / open / try-again / reduced-motion; `fields.ts` + `autodocs` |
| C3 | Cue engine in dashboard lesson video: subscribe to `onTimeUpdate`, pause, set active checkpoint, resume on Continue | Unanswered `seconds >= timestamp` fires; answered never re-fires |
| C4 | Seek ceiling = `min(watchFurthest, nextUnanswered.timestampSeconds)` using the existing `seekPolicy` interceptor | Cannot drag past an unanswered marker |
| C5 | Play lock while overlay open (ignore Space / Plyr play) | Overlay focus trap; Escape does not skip |
| C6 | Wire every enabled auto-gradable take renderer from `@cio/ui/custom/exercise-question` with host-supplied labels; overlay card scrolls | No English strings in `packages/ui` |

**Verify:** `pnpm --filter @cio/ui prefix` then `prefix:check`. Storybook story renders every overlay state.

## Phase D — Teacher UI

| ID | Ticket | Done when |
| --- | --- | --- |
| D1 | Types in `course/utils/types.ts` inferred from the new RPC paths; methods on `lesson.svelte.ts` via `this.execute` | No interfaces in `.svelte.ts` |
| D2 | Timeline + marker list on Video tab (`checkpoint-timeline.svelte`) for enforceable uploads | Empty state + populated state match prototype |
| D3 | Add/edit drawer (`checkpoint-editor-sheet.svelte`, replaces the dialog; pattern: `webhook-form-sheet.svelte`) with `question-type-select` filtered to auto-gradable types, matching edit renderer, resume policy, premium gate on `ORDERING` / `STAR` | `onOpenChange` resets fields in place (no `$effect` tied to `open === false`; no whole-object reassign) |
| D7 | Results drawer (`checkpoint-results-sheet.svelte`, replaces the responses dialog): summary, per-checkpoint table, per-student level, CSV export | Opens from a button on the Video tab; staff only |
| D8 | Free-plan state: timeline visible, upgrade prompt instead of Save and Results | Matches the server guard |
| D4 | YouTube / Drive / generic: helper + upload CTA, no timeline | `teacher-youtube-blocked.html` |
| D5 | Contents-list optional question-count on the lesson row | Not a new tree node |
| D6 | `en.json` keys + `cd apps/dashboard && pnpm translate`; fix any `{placeholder}` corruption | All locales updated before commit |

## Phase E — Learner, public, polish

| ID | Ticket | Done when |
| --- | --- | --- |
| E1 | Authenticated lesson player consumes GET payload + answer POST; `didJustComplete` still triggers certification | Existing complete modal unchanged |
| E2 | Learner-view (teacher preview) can answer (same as watching as student) | Does not create `submission` rows |
| E3 | Public lesson: in-memory overlay when first video is HTML5 upload with checkpoints | No POST; refresh clears |
| E4 | Format: `pnpm format:changed` then `pnpm format:check` | Lefthook-equivalent clean |
| E5 | Dashboard build | `test -f apps/dashboard/.env \|\| cp apps/dashboard/.env.example apps/dashboard/.env`; `pnpm --filter @cio/dashboard^... build && pnpm --filter @cio/dashboard build` |

## Phase F — Public API and MCP

Read [`skills/public-api-review/SKILL.md`](../../skills/public-api-review/SKILL.md) first.

| ID | Ticket | Done when |
| --- | --- | --- |
| F1 | Public v1 schemas separate from dashboard schemas; exact `data` shapes | No bare `{ type: "object" }`; contract tests |
| F2 | Routes in `apps/api/src/routes/v1/` domain folder, services in `services/v1/`: list, create, update, delete checkpoints; results; CSV export | Actor from API key; org and course-staff checks; role matrix and cross-org tests |
| F3 | Narrow scope(s) and migration that does not widen custom keys; audit routes the scope unlocks | Default key flow grants what the tools need |
| F4 | Plan guard (B8) on every v1 write and on results | Plan-changed-after-key-creation test |
| F5 | Rate limits (fail closed) and audit events | Limiter-failure test |
| F6 | MCP tools: list, create, update, delete, results; read-only vs write metadata; one-sentence descriptions | MCP tool tests; `@cio/mcp` version bumped and published |
| F7 | OpenAPI: `OPERATION_TAGS`, `OPERATION_SUMMARIES`, `API_SECTIONS` in `apps/docs/blume.config.ts`, regenerate spec | Sidebar section → group → operation tree in the PR description |

## Out of this plan (follow-ups, not v1 tickets)

- YouTube IFrame API timeupdate + pause.
- AI-generated question suggestions from transcripts (builds on the Phase F tools).
- `checkpoint.answered` webhook.
- Manual / survey / disabled types in the overlay (`TEXTAREA`, `SHORT_ANSWER`, `FILE_UPLOAD`, `LINK`, `VIDEO_RECORDING`, `THUMBS`, `MATCHING`, `HOTSPOT`).
- Branching actions (jump, open URL, skip remaining video).

## Suggested PR slices

Ship as stacked PRs if one diff is too large:

1. A + B (API only, no UI, includes the plan guard) — feature-flag unused.
2. C + E1 (player + student) with a seed/fixture lesson.
3. D (teacher authoring drawers + Results) + E3 public + translations.
4. F (public API v1 + MCP + docs), after B services are stable.

Do not merge player UI without the completion guards (B4) or students can skip questions and still complete.
