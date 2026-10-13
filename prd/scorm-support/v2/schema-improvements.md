# Schema Improvements Plan (SCORM v2)

Companion to [`README.md`](./README.md). Written 12 October 2026 after reviewing the activity and SCORM schema as implemented on `feats/scorm-integration` (migration `0033_scorm_activities`, not yet on main, feature not live).

The decisions below ignore how long each change takes. Each one is judged only on which structure is best for the product and the data. Because nothing is live and `0033` is not on main, every database change folds into `0033`, with no data migration.

## 1. Decisions

### 1.1 `scorm_session_event`: keep it, write fewer rows

**Keep.** It is the only record of what happened inside a learner’s session that a course team or support can see: whether the package found the API, whether the final save arrived, which browser was used, and where the package failed.

- **It can’t be derived from the attempt tables.** `scorm_sco_attempt` holds only the latest state, `last_commit_at` and `terminated_at`, so “launched three times and never initialized” or “saved, then the tab closed without a final save” leave no trace there.
- **Application logs are not a substitute.** They are not visible to course teams, can’t be joined to a learner in the student sheet, and their retention is outside the product’s control.
- **It stays SCORM-specific rather than generic.** Its foreign key to the module try means a progress reset or an activity delete removes the events with the attempts. A generic `activity_event` table would point at different attempt tables per kind and lose that cascade. A future kind adds its own events table.

**Change what is written.** Today `recordScormSessionEvent` writes a row on every commit, including the 30-second autocommit: about 120 rows per learner per hour, almost all identical. From now on a commit writes an event only when it is:

- the first commit of a module try;
- a change to completion status, success status, score or the try’s status;
- rejected (stale sequence number, validation error, unknown try);
- a terminate commit, or a commit received by beacon.

Launch, initialize, not-initialized and error events are unchanged. A typical session drops to five to ten rows. `scorm_sco_attempt.last_commit_at` still records the latest save.

**Other changes:**
- `kind` becomes a database enum.
- An index on `created_at` lets the 90-day retention delete avoid scanning the whole table.
- `detail` is capped at 2 KB and `user_agent` at 512 characters, validated before insert.

### 1.2 `content_package_unit`: every rule input becomes a typed column, including `completionThreshold`

**The rule:** every manifest value the LMS uses to decide completion or success is a typed, range-checked column. `format_details` keeps only values nothing decides on.

`completionThreshold` is a rule input. `applyLmsRules` uses it to set SCORM 2004 `completion_status` from `progress_measure`, so it moves out. The code shows what the JSON costs today:

- `packages/core/src/services/activity/providers/scorm/launch.ts` and `apps/dashboard/src/lib/features/course/utils/scorm-utils.ts` parse `format_details` defensively with casts.
- `packages/core/src/services/activity/providers/scorm/results.ts` rebuilds units with `completionThreshold: null`, so any future rule evaluated from report rows would silently ignore the threshold.
- `packages/db/src/queries/scorm/report.ts` casts `format_details->>'scaledPassingScore'` in three queries.

Future uses also point the same way: the Results tab showing progress against the threshold, a minimum-score warning when an author’s rule conflicts with the manifest, and cmi5’s `masteryScore` (a scaled pass mark that belongs in the same column as SCORM 2004’s).

New unit columns:

| Column | Type and check | Filled from |
| --- | --- | --- |
| `mastery_score_raw` (renamed from `mastery_score`, so the scale is in the name) | numeric, 0 to 100 | SCORM 1.2 `adlcp:masteryscore` |
| `passing_score_scaled` | numeric, −1 to 1 | SCORM 2004 primary objective `minNormalizedMeasure` when `satisfiedByMeasure="true"`; later cmi5 `masteryScore` |
| `completion_threshold` | numeric, 0 to 1 | SCORM 2004 `completionThreshold` |

`format_details` keeps `maxTimeAllowed` and `timeLimitAction`, which ClassroomIO shows as a warning but does not enforce. It is typed as a discriminated type per format instead of `Record<string, unknown>`.

### 1.3 Course format and type: Self-paced and Compliance only is right

A course made of one package can be **Self-paced** or **Compliance**:

- **Live class doesn’t fit.** Live sessions, reminders and attendance are lesson features (`lesson_at`, `call_url`, `group_attendance.lesson_id`). A course without lessons has nothing to schedule or take attendance on.
- **Public doesn’t fit.** Public courses are taken anonymously, and SCORM needs a learner (decision 9). If anonymous play ships later, Public is added to the allowed list then.

Four improvements:

1. **The database enforces the pairing.** A CHECK constraint `course_format_type_check`: `format = 'standard' OR type IN ('SELF_PACED', 'COMPLIANCE')`. The allowed types live in one constant, `SINGLE_ACTIVITY_COURSE_TYPES`, used by the Zod schemas, the course service and the new-course modal. Today the rule is written out separately in `packages/core/src/services/course/course.ts` (create and update) and `new-course-modal.svelte`.
2. **The format value becomes generic: `standard` or `single_activity`, not `scorm`.**
   - The platform is generic so cmi5, LTI and H5P can be added later. Those kinds will want the same “a course that is one item” shape: a cmi5 course with several AUs, or a course that is one LTI tool.
   - With `scorm` as the value, each new kind would need a new format value, and every one of the 14 `format === 'scorm'` checks across the dashboard, API and core would need rewriting.
   - With `single_activity`, the course’s one activity says what it is. The user-facing name (“SCORM course”) and the nav label (“Package”) come from the activity’s kind through its provider.
3. **One typed helper replaces the casts.** `isSingleActivityCourse(course)` replaces the nine dashboard casts `(courseApi.course as { format?: string })`, using the inferred course type.
4. **`course.format` becomes a database enum**, `COURSE_FORMAT`, like `COURSE_TYPE`.

“Exactly one activity in a single-activity course” stays a service guard with tests. A CHECK constraint can’t see other rows, and the repository has no triggers.

### 1.4 Database enums for every enumerated column in the new tables

Each of these columns is free text today, accepted by the database whatever the value. Making them enums gives database-level integrity and Drizzle-inferred types, and matches the repository’s newer tables (`WIDGET_STATUS`, `COHORT_STATUS`, `PROGRAM_GOAL_STATUS`). Values come from shared constants in `packages/utils/src/constants/`, as `COURSE_TYPE` does.

| Enum | Values | Column |
| --- | --- | --- |
| `COURSE_FORMAT` | `standard`, `single_activity` | `course.format` |
| `ACTIVITY_KIND` | `scorm` | `course_activity.kind` |
| `CONTENT_PACKAGE_STATUS` | `uploading`, `processing`, `ready`, `failed`, `archived` | `content_package_version.status` |
| `CONTENT_PACKAGE_FORMAT` | `scorm12`, `scorm2004_2`, `scorm2004_3`, `scorm2004_4` | `content_package_version.format` |
| `CONTENT_PACKAGE_UNIT_TYPE` | `sco`, `asset` | `content_package_unit.unit_type` |
| `SCORM_COMPLETION_RULE` | `auto`, `completed`, `passed`, `score` | `activity_scorm.completion_rule` |
| `SCORM_LAUNCH_MODE` | `embedded`, `window` | `activity_scorm.launch_mode` |
| `SCORM_ATTEMPT_CLOSE_REASON` | `finished`, `replaced` | `scorm_attempt.close_reason` |
| `SCORM_SCO_ATTEMPT_STATUS` | `active`, `suspended`, `closed` | `scorm_sco_attempt.status` |
| `SCORM_SESSION_EVENT_KIND` | `launch`, `initialize`, `commit`, `terminate`, `beacon`, `error`, `not_initialized` | `scorm_session_event.kind` |

Adding a value later is one `ALTER TYPE … ADD VALUE` migration, as the locale migrations (`0025`, `0029`) already do. A new kind needs a migration for its own tables anyway.

### 1.5 `activity_completion`: keep `is_complete`, enforce consistency

Keep `is_complete`:
- it matches `lesson_completion`, so the progress queries read the same way for both;
- a later kind may need to un-complete an item (for example an LTI tool lowering a grade).

Add a CHECK constraint `activity_completion_complete_check`: `is_complete = (completed_at IS NOT NULL)`, so the two columns can never disagree.

### 1.6 Package version retention: archive, don’t keep forever

`scorm_attempt` points at the version it used and blocks that version’s deletion. The retention job (`listStaleUnpinnedPackageVersions`) therefore only removes versions nobody ever launched, so nearly every replaced version stays in storage forever. It also uses `updated_at` as a stand-in for “when this version was replaced”.

New rule, applied 30 days after a version stops being current:

| The replaced version… | What retention does |
| --- | --- |
| was never launched | Deletes its extracted files, its original ZIP and its row (units cascade) |
| was launched, and every attempt on it is closed | Deletes its extracted files only, keeps the ZIP and the rows, sets status `archived` and `archived_at` |
| still has an open attempt | Keeps everything until those attempts close (**Move everyone** closes them) |

- **Why keep the ZIP and rows:** results, interactions and module titles stay intact for audits, and the exact package a learner took can still be retrieved.
- **New columns:** `replaced_at` is set in the same transaction that makes another version current. `archived_at` is set by retention.
- **Review mode on an archived version** opens the current version with empty run-time data in review mode, with a banner: “You took an earlier version of this package. Your results are unchanged.” The attempt’s own data is never fed to a different version.
- **Cross-organization transfer** copies only the current version. Attempts never transfer, so older versions have no use in another organization. Same-organization clones keep sharing the asset, as today.

### 1.7 Considered and not changed

| Idea | Why not |
| --- | --- |
| Drop `activity_completion.is_complete` | Section 1.5 |
| Index on `activity_completion.profile_id` | Per-profile queries filter by the course’s activity ids too, which the unique `(activity_id, profile_id)` index serves; `lesson_completion` has the same shape. Add one only if a query plan shows a need |
| Index on `course_activity (course_id, section_id, order)` | `course_id` is indexed and ordering happens in code, as for lessons |
| One generic event table for all kinds | Section 1.1 |
| A trigger enforcing one activity per single-activity course | The repository has no triggers; the service guard and its tests cover every create path |

## 2. Final schema for the changed tables

```ts
export const courseFormat = pgEnum('COURSE_FORMAT', [...COURSE_FORMAT_VALUES]);
export const activityKind = pgEnum('ACTIVITY_KIND', [...ACTIVITY_KINDS]);
export const contentPackageStatus = pgEnum('CONTENT_PACKAGE_STATUS', [...CONTENT_PACKAGE_STATUSES]);
export const contentPackageFormat = pgEnum('CONTENT_PACKAGE_FORMAT', [...CONTENT_PACKAGE_FORMATS]);
export const contentPackageUnitType = pgEnum('CONTENT_PACKAGE_UNIT_TYPE', [...CONTENT_PACKAGE_UNIT_TYPES]);
export const scormCompletionRule = pgEnum('SCORM_COMPLETION_RULE', [...SCORM_COMPLETION_RULES]);
export const scormLaunchMode = pgEnum('SCORM_LAUNCH_MODE', [...SCORM_LAUNCH_MODES]);
export const scormAttemptCloseReason = pgEnum('SCORM_ATTEMPT_CLOSE_REASON', [...SCORM_ATTEMPT_CLOSE_REASONS]);
export const scormScoAttemptStatus = pgEnum('SCORM_SCO_ATTEMPT_STATUS', [...SCORM_SCO_ATTEMPT_STATUSES]);
export const scormSessionEventKind = pgEnum('SCORM_SESSION_EVENT_KIND', [...SCORM_SESSION_EVENT_KINDS]);
```

**`course`**: `format: courseFormat().default('standard').notNull()` and

```ts
check(
  'course_format_type_check',
  sql`${table.format} = 'standard' OR ${table.type} IN ('SELF_PACED', 'COMPLIANCE')`
)
```

The literal list in the CHECK is generated from `SINGLE_ACTIVITY_COURSE_TYPES` when the schema is built, so the constraint and the constant can’t drift.

**`course_activity`**: `kind: activityKind().notNull()`. Nothing else changes.

**`activity_completion`**: add

```ts
check('activity_completion_complete_check', sql`${table.isComplete} = (${table.completedAt} IS NOT NULL)`)
```

**`content_package_version`**:
- `status: contentPackageStatus().default('uploading').notNull()`
- `format: contentPackageFormat()`
- new `replacedAt: timestamp('replaced_at', { withTimezone: true, mode: 'string' })`
- new `archivedAt: timestamp('archived_at', { withTimezone: true, mode: 'string' })`
- new partial index `idx_content_package_version_replaced` on `replaced_at` where `is_current = false`
- new check `content_package_version_current_not_replaced_check`: `NOT (is_current AND replaced_at IS NOT NULL)`

**`content_package_unit`**:
- `unitType: contentPackageUnitType('unit_type').notNull()`
- `masteryScoreRaw: numeric('mastery_score_raw')` replaces `masteryScore`
- new `passingScoreScaled: numeric('passing_score_scaled')`
- new `completionThreshold: numeric('completion_threshold')`
- `formatDetails` typed `PackageUnitFormatDetails` = `{ format: 'scorm2004'; maxTimeAllowed: string | null; timeLimitAction: string | null } | { format: 'scorm12' }`
- checks: `mastery_score_raw BETWEEN 0 AND 100`, `passing_score_scaled BETWEEN -1 AND 1`, `completion_threshold BETWEEN 0 AND 1` (each also allows null)

**`activity_scorm`**: `completionRule: scormCompletionRule('completion_rule').default('auto').notNull()`, `launchMode: scormLaunchMode('launch_mode').default('embedded').notNull()`, and check `min_score_percent IS NULL OR min_score_percent BETWEEN 0 AND 100`.

**`scorm_attempt`**: `closeReason: scormAttemptCloseReason('close_reason')`, and check `(closed_at IS NULL) = (close_reason IS NULL)`.

**`scorm_sco_attempt`**: `status: scormScoAttemptStatus().default('active').notNull()`. The partial unique index keeps `status in ('active', 'suspended')`.

**`scorm_session_event`**: `kind: scormSessionEventKind().notNull()`, and new index `idx_scorm_session_event_created_at` on `created_at`.

## 3. Migration

1. Edit `packages/db/src/schema.ts` as in section 2.
2. Remove `0033_scorm_activities.sql`, its journal entry and its snapshot, then regenerate with `pnpm --filter @cio/db db:generate --name scorm_activities` so the result is still a single `0033`.
3. Read the generated SQL line by line:
   - the enums are created before the tables that use them;
   - every CHECK and index from section 2 is present;
   - nothing touches migration `0017`’s three foreign keys, which the snapshot disagrees with.
4. Run the high-water-mark check from `CLAUDE.md`. Restamp `when` and renumber if main has moved past `0033`.
5. Rebuild every database that already ran the old `0033`, because Drizzle never re-runs an applied migration: local machines (`pnpm --filter @cio/db db:setup:seed`), CI (fresh each run) and Railway preview environments (tear down and redeploy). Nothing is live, so no data is lost that matters.

## 4. Work items by area

### 4.1 Shared constants and validation (`packages/utils`)

| File | Change |
| --- | --- |
| `src/constants/course-format.ts` | `COURSE_FORMAT_VALUES = ['standard', 'single_activity']`; `SINGLE_ACTIVITY_COURSE_TYPES = ['SELF_PACED', 'COMPLIANCE']`; `isTypeAllowedForFormat(format, type)` |
| `src/constants/activity.ts` | Add `CONTENT_PACKAGE_STATUSES`, `CONTENT_PACKAGE_FORMATS`, `CONTENT_PACKAGE_UNIT_TYPES`, `SCORM_ATTEMPT_CLOSE_REASONS`, `SCORM_SCO_ATTEMPT_STATUSES`; move `SCORM_COMPLETION_RULES`, `SCORM_LAUNCH_MODES` and `SCORM_SESSION_EVENT_KINDS` here from `src/validation/activity/scorm.ts`, so `schema.ts` can import them; `scorm.ts` re-exports them |
| `src/validation/course/course-type.ts`, `src/validation/course/course.ts` | `ZCourseFormat` from the new values; create schema refines type with `isTypeAllowedForFormat`; update accepts only `single_activity → standard` |
| `src/validation/course/template-sync.ts` | Checked: the `completionThreshold` handling (lines 10, 519, 623) is the course-certificate threshold (`SettingCertificate.threshold`), not the SCORM unit column — no change. Package changes are detected via `packageUpdatedAt`, not per-unit JSON (units are immutable per version, so any threshold change arrives as a new version) |
| `src/validation/activity/scorm.ts` | `ZScormSessionEventDetail` with the 2 KB cap |

### 4.2 Database (`packages/db`)

| File | Change |
| --- | --- |
| `src/schema.ts` | Section 2 |
| `src/types.ts` | Types follow the schema; remove hand-written string unions that the enums now infer |
| `src/migrations/0033_scorm_activities.sql`, `meta/*` | Section 3 |
| `src/queries/scorm/outcome.ts` | `hasPassMark` reads `mastery_score_raw` and `passing_score_scaled` |
| `src/queries/scorm/report.ts` | Replace the three `format_details->>'scaledPassingScore'` reads with `u.passing_score_scaled`; select `completion_threshold` where units are rebuilt |
| `src/queries/activity/package-version.ts` | `setCurrentPackageVersion` sets `replaced_at` on the version it replaces, in the same transaction. Replace `listStaleUnpinnedPackageVersions` with `listVersionsDueForRetention(cutoff)` (returns each version with `hasAttempts` and `hasOpenAttempts`), `markPackageVersionArchived(id)`, and keep `deletePackageVersionsByIds` for never-launched versions |
| `src/queries/scorm/session-event.ts` | Insert validates kind and detail size; retention delete uses the new index |
| `src/queries/activity/activity.ts` | `upsertActivityCompletion` sets `completedAt` whenever `isComplete` is true and clears it otherwise, so the CHECK holds; `markActivityCompleteOnce` already does |
| `src/utils/seed/scormActivities.ts` | `format: 'single_activity'`; unit columns |
| Every query that reads `course.format` | Compare with `'single_activity'` through the shared constant |

### 4.3 Package parsing and processing

| File | Change |
| --- | --- |
| `packages/activity-packages/src/scorm/manifest/index.ts` | `ScormPackageUnit` gains `masteryScoreRaw`, `passingScoreScaled`, `completionThreshold`; `formatDetails` keeps only `maxTimeAllowed` and `timeLimitAction`; parser treats out-of-range values as absent with range guards |
| `packages/activity-packages/src/scorm/runtime/index.ts` | `applyLmsRules` and `hasPassMark` read the typed fields |
| `apps/jobs/src/processors/activity-package/process-scorm.ts` | Writes the typed columns |
| `packages/core/src/services/assets/asset-transfer.ts` | Copies typed columns; cross-organization transfer copies only the current version and its ZIP |

### 4.4 Services and routes

| File | Change |
| --- | --- |
| `apps/api/src/services/activity/runtime-scorm.ts` | New pure helper `shouldRecordCommitEvent(previous, next, context)` in `packages/activity-packages` decides per section 1.1; routine commits write no event; rejected commits write an `error` event with the reason |
| `packages/core/src/services/activity/providers/scorm/launch.ts` | Typed unit fields instead of parsing `format_details`; review on an archived version launches the current version with empty run-time data and `reviewOfArchivedVersion: true` in the launch result |
| `packages/core/src/services/activity/providers/scorm/results.ts` | Typed unit fields; remove the `completionThreshold: null` stand-in |
| `packages/core/src/services/activity/retention.ts` | The three-way rule in section 1.6; deletes ZIPs only for never-launched versions; logs counts per outcome |
| `apps/jobs/src/workers/maintenance.ts` | Reports archived and deleted counts separately |
| `packages/core/src/services/course/course.ts` | Create and update use `isTypeAllowedForFormat` and `'single_activity'`; the error names the allowed types |
| `packages/core/src/services/course/content.ts`, `packages/core/src/services/activity/activity.ts`, `packages/core/src/services/activity/courses.ts` | Guards and course-from-package use `'single_activity'` |
| `apps/api/src/services/course/compliance.ts` | Single-activity courses take the snapshot from the activity’s provider `complianceSnapshot`, not a SCORM check |
| `apps/api/src/services/course-import/course-import.ts`, `apps/api/src/routes/course/course.ts` | `'single_activity'` |
| `packages/core/src/services/activity/providers/index.ts` | Each provider declares `singleActivityCourse: { navLabelKey, courseLabelKey }` (SCORM: “Package”, “SCORM course”) |

### 4.5 Dashboard

| File | Change |
| --- | --- |
| New `apps/dashboard/src/lib/features/course/utils/course-format.ts` | `isSingleActivityCourse(course)` using the inferred `Course` type |
| `components/card.svelte`, `course-list-row.svelte`, `sidebar/course-sidebar-footer-nav.svelte`, `sidebar/course-sidebar-navigation.svelte`, `mobile/course-mobile-bottom-nav.svelte`, `content/content-create-modal.svelte`, `pages/settings.svelte`, `pages/lessons.svelte`, `apps/dashboard/src/lib/features/lms/components/course-preview-modal.svelte` | Replace casts and `=== 'scorm'` with the helper |
| `features/course/utils/functions.ts` | Nav label key from the activity kind’s `navLabelKey` |
| `components/new-course-modal.svelte` | Sends `format: 'single_activity'`; allowed types from `SINGLE_ACTIVITY_COURSE_TYPES` |
| `features/course/utils/scorm-utils.ts`, `components/activity/package-details.svelte` | Typed unit fields; no JSON parsing. `utils/template-display.ts` checked: course-template settings display with no package refs — no change |
| Activity player page | Banner for review of an archived version |
| `src/lib/utils/translations/*.json` | The archived-version banner; `pnpm translate` and a placeholder check |

### 4.6 Tests

- **Database constraints** (`apps/api/src/__tests__/activity-schema-constraints.db.test.ts`, new):
  - a single-activity course with type `LIVE_CLASS` or `PUBLIC` is rejected by the database;
  - `is_complete` without `completed_at` is rejected;
  - out-of-range pass marks are rejected;
  - a current version with `replaced_at` is rejected;
  - a closed attempt without a reason is rejected;
  - unknown enum values are rejected.
- **Event gating** (`packages/activity-packages`): a routine commit returns false; first commit, status change, score change, terminate, beacon and rejection return true. `runtime-scorm` database test: a 10-minute session with autocommits writes fewer than ten events.
- **Retention**: never-launched version deleted with its ZIP; launched-and-closed version archived with ZIP kept; version with an open attempt untouched; `replaced_at` set when making a version current.
- **Review fallback**: an attempt on an archived version launches the current version in review with empty data.
- **Typed units end to end**: a fixture with all three pass-mark values goes through the parser, the processor, `applyLmsRules`, `isScormRuleMet` and `scormAttemptRollupSql`, and the TypeScript and SQL outcomes match.
- **Transfer**: cross-organization clone copies only the current version.
- **Rename**: update every test and fixture that uses `format: 'scorm'` (`scorm-course-guards`, `activity-platform`, `activity-courses-from-packages`, `activity-compliance-snapshot`, `course-clone-activities`, `course-import-activities.db`, `utils-characterization`).
- **Regression**: the characterization suite from PR 0c must pass unchanged; none of these changes touch courses without activities.

### 4.7 Documentation

- `README.md`: decisions 10 and 11, § Data Model, § Content Serving (retention) and every “SCORM course” rule that names the format value. Updated together with this plan.
- `activity-integration-map.md`: rows 1.14 and 2.1 and the § 7f rows use `single_activity`.
- `implementation-plan.md`: PR 12 and PR 14 point to this file.

## 5. Order of work and parallel chunks

| Step | Who | Items | Depends on |
| --- | --- | --- | --- |
| 1 | One agent | 4.1 constants and validation, 4.2 `schema.ts`, `types.ts` and the regenerated `0033`, the constraint tests | — |
| 2a | Agent A | 4.3 parsing, processing and transfer; 4.4 `results.ts`; report and outcome queries | Step 1 |
| 2b | Agent B | 4.4 `runtime-scorm.ts` event gating, the session-event query and its tests | Step 1 |
| 2c | Agent C | 4.4 `launch.ts` review fallback, `retention.ts`, `maintenance.ts`, the package-version queries and the retention tests | Step 1 |
| 2d | Agent D | Format rename on the server: course, content, activity, courses, compliance, course import, routes, seed, provider labels, and their tests | Step 1 |
| 2e | Agent E | 4.5 dashboard, including translations | Step 1; the label keys from 2d |
| 3 | One agent | Full regression run, docs in 4.7, svelte-check against its baseline | Steps 2a to 2e |

No two step-2 agents own the same file. `launch.ts` belongs to 2c alone, because both the typed unit fields and the review fallback change it; 2a leaves it untouched.

## 6. Verification

```bash
export PATH="$HOME/.nvm/versions/node/v20.19.3/bin:$PATH"
pnpm --filter @cio/db db:setup:seed
pnpm --filter @cio/api^... build && pnpm --filter @cio/api build
pnpm --filter @cio/api exec vitest run
pnpm --filter @cio/utils test
pnpm --filter @cio/activity-packages test
pnpm --filter @cio/dashboard test
cd apps/dashboard && npx svelte-check --threshold error
pnpm format:check
```

The dashboard is checked with svelte-check against its pre-existing error baseline, not the Vite build.
