# Insights Analytics Implementation Plan

## Status and sources

- **Product spec:** the Insights Analytics PRD and prototype in [classroomio/classroomio#1300](https://github.com/classroomio/classroomio/pull/1300) (branch `docs/insights-analytics-prd`, not merged when this plan was written). Read them before starting:

  ```bash
  git fetch origin docs/insights-analytics-prd
  git show origin/docs/insights-analytics-prd:prd/insights-analytics/README.md
  git show origin/docs/insights-analytics-prd:prototypes/insights-analytics/index.html > /tmp/insights-prototype.html
  ```

  If #1300 has merged, read `prd/insights-analytics/README.md` and open `prototypes/insights-analytics/index.html` in a browser instead.

- **This plan** maps that PRD onto `main` at `687a11df4` (2026-10-22). Where they disagree, **this plan wins**: the PRD was written before [#1255](https://github.com/classroomio/classroomio/pull/1255) removed the course final exercise, so some of its definitions no longer match the product. Section 1 lists every disagreement and how it is resolved. Anything still undecided is listed in section 12. Put those questions in the PR description for the PRD owner instead of guessing.
- **Worktree:** `/Users/user/Documents/ClassroomIO/Dev/insights-analytics`, branch `feats/insights-analytics`, cut from `main`.

## 0. Read before writing code

1. `AGENTS.md` (`CLAUDE.md` links to it). Pay particular attention to these sections:
   - layering (validation → queries → services → routes)
   - one response type per route
   - single-segment mounts in `app.ts`
   - types only in `utils/types.ts`
   - translations
   - the org-scoped `$effect` loading pattern
   - skeleton cards
   - chart SSR imports
   - `testId`
   - one migration per PR
2. `skills/writing-code/SKILL.md`: no comments by default, JSDoc only for contracts.
3. `skills/stage-and-commit/SKILL.md` and `skills/ship-feature/SKILL.md`: translation sync, formatting, Conventional Commits, no agent attribution.
4. `skills/write-docs/SKILL.md` and `skills/add-docs-image/SKILL.md` for the Help Center changes in section 10.
5. `skills/public-api-review/SKILL.md`, only if you touch `/public-api/v1` (Phase 3, not in this plan's PRs).

The repo now runs on **Node 24.22.1** (`.nvmrc`, [#1413](https://github.com/classroomio/classroomio/pull/1413)). `AGENTS.md` still says Node 20, but that text is stale. Use the `.nvmrc` version:

```bash
nvm install 24.22.1
export PATH="$HOME/.nvm/versions/node/v24.22.1/bin:$PATH"
pnpm install
```

## 1. What changed on main since the PRD, and the resolution

| PRD assumption | `main` today | Resolution in this plan |
| --- | --- | --- |
| The final exam is `course.certificate.requiredExerciseId` with `exerciseMinScorePercent`, falling back to `compliance.passingScore` and then 100 | #1255 removed all three. Migration `0038_remove_final_exercise_and_completion_threshold.sql` turned each old final exercise into `exercise.completion_policy = 'passed'` with `pass_threshold`, and set `allow_multiple_attempts = true` | Drop the "final exam" concept. Any exercise with `completion_policy = 'passed'` is a **pass-required exercise**, and its pass mark is `COALESCE(pass_threshold, 100)`. Section 3.4 has the full rules. Every PRD widget that used the final exam gets a pass-required equivalent (section 5) |
| "Other exercises use `exercise.passThreshold` when set" | `pass_threshold` is only read when `completion_policy = 'passed'` (`packages/db/src/queries/course/progression.ts:56-78`) | Only pass-required exercises have a pass mark. All other exercises show "–" for pass rate |
| Course "completed" relates to `certificate.threshold` | The threshold was removed. A certificate now needs every lesson and exercise complete (`REQUIRED_COURSE_COMPLETION_PERCENT = 100`), within `certificate.deadline` | Completed means progress is 100%, or `groupmember.certificate_earned_at` is set (section 3.3) |
| Exercise columns are ordered by section `order`, then exercise `order` | The mixed outline from [#1324](https://github.com/classroomio/classroomio/pull/1324) lets standalone lessons and exercises share one order run with sections. When grouping is off, everything is one flat list. Legacy lesson-embedded exercises (`exercise.lesson_id`, deprecated) still exist | Order by the learner's navigation order from `getOrderedCourseItems` / `getCourseItemRanks` (`packages/core/src/services/course/outline.ts`). An exercise's section is `COALESCE(exercise.section_id, lesson.section_id)` |
| Section scorecard lists items without a section under "Other" | Standalone items are real outline entries. Courses with grouping off show no sections | Keep a single "Not in a section" row, last. Hide the scorecard and the section bar chart when `metadata.isContentGroupingEnabled === false` |
| Open decision: classroom attendance denominator | Tutors create a `group_attendance` row only when they toggle a checkbox. The attendance page shows a missing row as **absent** (`features/course/pages/attendance.svelte:70`) | Decided: a lesson counts once it has at least one row for that course. Every enrolled learner is then in the denominator, and a missing row counts as absent (section 3.6) |
| Video attendance: "every video asset of the lesson is complete" | Rows exist only for watch-tracked assets, chosen by `resolveWatchEnforcedAssetIds(videos, completionPolicy)` (`packages/core/src/utils/lesson-watch-enforcement.ts`) | Watch progress exists only for `video_watch` lessons, and those lessons auto-complete exactly when every required video is watched. Video attendance is therefore completed `video_watch` lessons over all `video_watch` lessons (section 3.6) |
| "Last active" comes from page events | Cohort People uses `MAX(analytics_login_events.logged_in_at)` only, because `session.updated_at` is pruned (`packages/db/src/queries/cohort/cohort.ts:623-628`) | Last login uses login events only, matching Cohort People |
| `cachedRead` returns `{ data, generatedAt }` and can be refreshed | It does return that, but it has **no bypass or refresh option** | Add an optional `{ refresh: true }` argument (section 4.6) |
| Overdue reminders use the existing scan | `runCohortGoalReminderScan` only sends on due day 0 and the configured days before it, never after the due date | The new "Send reminder now" works for overdue assignments (section 7, PR 2) |
| `features/analytics` is renamed to `features/marketing` | `KpiCard` and `AnalyticsPanelCard` from that folder are also imported by the course analytics components | Move both cards to `features/ui/analytics/` in PR 1, then rename the folder |
| Learning time (#1299), supervisor copy (#1302) | Both issues still open. #1301 (cohort start date) and #1303 (practice cases) are closed and not needed | Still blocked. Do not build or show these widgets |

## 2. Delivery plan

One PR per row. Each PR ships its own translations, tests and Help Center updates. Main keeps moving, so rebase rather than waiting.

| PR | Title (Conventional Commits) | Depends on | Contents |
| --- | --- | --- | --- |
| 1 | `refactor(dashboard): rename org analytics page to Marketing` | none | PRD Phase 0 (section 7). Must merge before PR 4 |
| 2 | `feat(insights): add insights engine and cohort analytics` | none | Validation, registry, scope resolver, compiler, service, `/insights` routes, caching, the cohort dashboard, its sidebar item, and "Send reminder now" |
| 3 | `feat(insights): replace course analytics with the insights dashboard` | 2 | Replace the page at `/courses/[id]/analytics` and delete the old components |
| 4 | `feat(insights): add organization learner analytics` | 1, 2 | Add the new page at `/org/[slug]/analytics` and the nav item, and remove PR 1's temporary redirect |

None of these PRs adds a migration unless measurement in section 9 shows an index is needed. If one is needed, it is a single migration in the PR that needs it, and the `when` stamp must be checked as `AGENTS.md` describes under "Database migrations".

## 3. Canonical definitions

Every number on every dashboard comes from these definitions. Implement each one once, as a SQL fragment in `packages/db/src/queries/insights/`. Sources reuse those fragments; never re-derive a definition per widget.

**Roles:** `ROLE = { ADMIN: 1, TUTOR: 2, STUDENT: 3 }` (`@cio/utils/constants`). A **learner** is a profile with a `groupmember` row whose `role_id = 3` in a course in scope.

### 3.1 Scope resolution

The organization link is indirect: `course.group_id → group.organization_id`. **Every** scope CTE joins `group` and filters `group.organization_id = :orgId`, where `orgId` is the server-verified header org (section 4.5).

Courses in scope must have `course.status = 'ACTIVE'` and `course.is_template = false`.

The full SQL is in section 15.5. Every query starts with five CTEs, and every source reads only through them:
- `scope_course`
- `scope_learner (profile_id, cohort_id)`
- `scope_enrollment (group_member_id, profile_id, course_id, …, cohort_id)`
- `scope_member` (distinct enrollments)
- `course_item` (outline ranks)

**Cohort scope** (`:cohortId`):
- Courses are the cohort's `cohort_course` rows.
- Learners are its `cohort_member` rows with role 3 and a profile.
- Enrollments are those learners' role-3 `groupmember` rows in the cohort's courses.
- `cohort_id` is always the cohort.
- **Pending members:** cohort members with `profile_id IS NULL` are excluded. Return their count as `pendingCount` in the dashboard metadata.
- **Learners with no enrollments:** a cohort learner with no `groupmember` row in a cohort course still counts as a learner, with 0% progress and "Not started".

**Course scope** (`:courseId`):
- `scope_course` is that one course, with the same org and status checks.
- Learners are the distinct `groupmember.profile_id` values with role 3 in its group.

**Org scope:**
- `scope_course` is every ACTIVE, non-template course whose group belongs to the org.
- Learners are defined the same way as in course scope.

**Deactivated members.** In every scope, a learner is excluded when they have an `organizationmember` row in the org whose `status <> 'ACTIVE'`. The check is `NOT EXISTS`, not an inner join, so learners with no `organizationmember` row (older data) still count.

**Cohort bridge.** In course and org scopes, cohort is a dimension, so `scope_enrollment` needs a bridge. Add a `LEFT JOIN LATERAL` to the learner's role-3 cohort memberships in non-archived cohorts that contain the course. Join it **only** when a spec groups or filters by cohort, so that ordinary queries never multiply rows. An enrollment with no matching cohort gets `cohort_id = NULL`, shown as "No cohort".

A learner who is in two cohorts that both contain the course counts once per cohort when grouped by cohort, and once overall. Make sure the tests cover this.

### 3.2 Course structure and ordering

Column order must match what learners see, and that order is computed in TypeScript, not SQL. So the **service** builds the structure and the compiler receives it as parameters:

- **Ordered items:** load the content once with `getCourseContentItems`, then run `buildCourseContent` and `flattenNavigableItems`. This is the same path `getOrderedCourseItems` in `packages/core/src/services/course/outline.ts` takes. It returns the lessons and exercises in navigation order, and `rank` is the index in that list.
- **Sections:** `getCourseOutline(content)` gives the sections in outline order. `section_rank` is the section's index. Items outside any section get `section_id = NULL` and are shown last as "Not in a section".
- **Exercise metadata for column headers:** pass-required, pass mark, locked and max points, from `getInsightsExerciseMeta`.

The service code is in section 15.14 (`structure.ts`).

The compiler receives **only the ordering**, as a `VALUES` CTE called `course_item (course_id, item_id, item_type, item_rank, section_id, section_rank)`. It is built with `sql.join`; the repo passes no array parameters elsewhere. Pass rules, max points, titles and completion are always read live in SQL, so a cached structure can only make the order stale, never a number.

Cache the structure for 10 minutes (section 4.6). Only specs that group by exercise, section, lesson or question, or that ask for `now_at_*`, load it (`requiresOrderedItems`). Such specs are refused above 50 courses, so org-wide widgets never load every course's outline.

**Locked exercises.** A locked exercise (`is_unlocked = false`) is hidden as a column, with two exceptions: it is pass-required, or some learner in scope already has a submission for it. `isUnlocked` belongs to the exercise, not to the cohort, so it says nothing about who has reached it.

### 3.3 Progress, completion, certification

These must match the existing canonical code paths: `getCourseProgress` in `packages/db/src/queries/course/course.ts`, `calcCourseProgressPercent` in `apps/api/src/utils/course-completion.ts`, and `buildCertificationEvaluation` in `apps/api/src/services/course/completion.ts`.

Definitions per **learner-course** (one `scope_enrollment` row):

- **`items_total`:** every lesson where `lesson.course_id` matches, plus every exercise where `COALESCE(exercise.course_id, lesson.course_id)` matches. Lessons with `completion_policy = 'none'` still count.
- **`lessons_completed`:** `lesson_completion.is_complete = true` for the profile, on lessons of the course.
- **`exercises_completed`:** count of exercises where `submissionMeetsCompletionPolicySql('exercise', 'submission')` holds for at least one of the learner's submissions.
  - Import that function from `packages/db/src/queries/course/progression.ts`; never re-derive it.
  - It requires the table aliases `exercise` and `submission`, so the source SQL must use them.
- **`progress_pct`:** `ROUND((lessons_completed + exercises_completed) * 100.0 / NULLIF(items_total, 0))`, or `0` when there are no items.
- **`is_completed`:** `certificate_earned_at IS NOT NULL OR (items_total > 0 AND lessons_completed + exercises_completed >= items_total)`.
- **`is_certified`:** `certificate_earned_at IS NOT NULL`.
  - For compliance courses with downloadable certificates, also count a `course_certificate_issue` row with `status = 'valid'`.
  - Content completed after `certificate.deadline` is completed but not certified.
- **`completed_at`:** `certificate_earned_at`. No other completion timestamp exists, so learners who are completed but not certified have no `completed_at`.
- **`days_to_finish`:** `EXTRACT(EPOCH FROM certificate_earned_at - enrolled_at) / 86400`. Only defined when both timestamps exist.

Pooled values per **learner** across that learner's courses in the selection:

- **`overall_progress_pct`:** `ROUND(SUM(completed items) * 100.0 / NULLIF(SUM(items_total), 0))`. Never average per-course percentages.
- **`courses_completed`:** `COUNT(*) FILTER (WHERE is_completed)`, displayed as "1 of 3".

### 3.4 Exercise results and pass-required exercises

This section replaces the final exam.

Grain is one row per **learner × exercise** (`assessment_result` source):

- **`max_points`:** `COALESCE(SUM(question.points), 0)` over the exercise's **current** questions, the same as progression (`getExerciseMaxPoints`).
- **`attempts`:** count of the learner's `submission` rows (`submitted_by = group_member_id`).
- **`graded_attempts`:** count where `grading_state = 'completed'`.
- **`best_points`:** `MAX(total) FILTER (WHERE grading_state = 'completed')`. The best graded attempt, as in certification, the gradebook and the compliance snapshot.
- **`best_score_pct`:** `ROUND(best_points * 100.0 / max_points)` when `max_points > 0`, otherwise `NULL`. Use `ROUND`, the same as the completion predicate.
- **`state`:**
  - `not_taken` when `attempts = 0`
  - `awaiting_grade` when `attempts > 0 AND graded_attempts = 0`. This covers `queued`, `processing`, `awaiting_manual` and `failed`. Show "Awaiting grade", never 0.
  - `graded` otherwise
- **`is_complete`:** the completion predicate from 3.3, so it matches the learner's sidebar exactly.
- **`is_pass_required`:** `completion_policy = 'passed'`.
- **`pass_mark`:** `COALESCE(pass_threshold, 100)` when pass-required, otherwise `NULL`.
- **`passed`:** `is_complete` when pass-required, otherwise `NULL`. For pass-required exercises, complete means passed.

Rollups:

- **Average score (learner, learner-course or any group):** pooled points over graded exercises with `max_points > 0`, as `ROUND(SUM(best_points) * 100.0 / NULLIF(SUM(max_points), 0))`. This differs from the old course page, which used the latest attempt and counted unsubmitted exercises as 0. Say so in PR 3's description.
- **Cohort or course "Average score" KPI:** mean of the learners' pooled average score, over learners with at least one graded exercise, so each learner counts once.
- **Per-exercise pass rate** (pass-required only): `COUNT(*) FILTER (WHERE passed) / COUNT(*) FILTER (WHERE state = 'graded')`.
- **Pass-required pass rate** (course, cohort, or cohort × course): the same ratio pooled over every (learner, pass-required exercise) pair in the group. Show "–" and hide the KPI when the course has no pass-required exercise.
- **Passed all required** (learner-course): `pass_required_total > 0 AND pass_required_passed = pass_required_total`.

UI wording replaces "Final exam":
- Column tag: "Pass required · 80%".
- KPI: "Required exercises pass rate".
- Learner course panel: "Required exercises passed: 2 of 3".
- Course histogram: "Score distribution" with an exercise picker. It defaults to the **last pass-required exercise in outline order**, otherwise the last exercise with graded attempts. This default is a UI choice only and does not affect any metric.

### 3.5 Section scorecard

This follows the PRD's "Section Scorecard Rules", adapted to 3.2 and 3.4. Grain is **learner × course × section** (`section_activity` source). It has two independent halves that are then joined on (profile, course, section):

1. **Exercise half**, from `assessment_result` rows grouped by section:
   - `exercises_total`
   - `exercises_graded`
   - `section_score_pct`: mean of the learner's `best_score_pct` over graded exercises in the section
   - `required_total`
   - `required_passed`
2. **Attendance half**, at its own grain (3.6). Learners with attendance but no graded exercise still count.

Row values:
- **Exercises taken:** learners with `exercises_graded = exercises_total` (and `exercises_total > 0`), shown as "n / learners".
- **Average score:** mean over learners with at least one graded exercise in the section.
- **Pass rate:** learners with `required_passed = required_total`, divided by learners who took every required exercise in the section. Show "–" when the section has no pass-required exercise.
- **Video attendance:** mean of the learners' video percentages.
- **Classroom attendance:** pooled.

### 3.6 Video and classroom attendance

**Video, per learner × section.** This was verified in `packages/core/src/services/lesson/lesson.ts:579-720`:
- Watch progress is recorded only for lessons with `completion_policy = 'video_watch'`, and only for assets from `resolveWatchEnforcedAssetIds`.
- The service upserts `lesson_completion(is_complete = true)` at the moment every required asset is complete.
- Manual completion of these lessons is rejected (400).

So the lesson completion row *is* the watched signal, and no asset rule is re-implemented in SQL:

- `video_lessons`: lessons in the section with `completion_policy = 'video_watch'` and at least one `upload` video with an `assetId`. That is exactly when the required-asset list is non-empty.
- `video_watched`: those lessons with `lesson_completion.is_complete = true` for the profile.
- Percent: `video_watched / video_lessons`, or `NULL` when `video_lessons = 0`.
- `lesson_video_progress` and `watched_seconds` are not read.

**Classroom, per learner × section:**
- `attendance_lessons`: lessons in the section that have at least one `group_attendance` row with `course_id` set to that course. These are the lessons where attendance was taken.
- `attendance_present`: those lessons with a row `student_id = group_member_id AND is_present = true`.
- A missing row counts as absent, which matches the attendance page.
- Pool across learners: `SUM(present) / SUM(lessons)`.

### 3.7 Activity

- **`last_login_at`:** `MAX(analytics_login_events.logged_in_at)` where `user_id = profile_id`. The profile id is the user id.
- **`logged_in_today`:** `EXISTS (... logged_in_date = CURRENT_DATE)`. `logged_in_date` is the database's date (UTC), and logins are **platform-wide, not per org**. Put both limitations in the tooltip.
- **`days_since_login`:** `CURRENT_DATE - MAX(logged_in_date)`, or `NULL` when the learner has never logged in.
- **`logged_in_week`:** at least one login in the last 7 days. This feeds the org "Logged in (7 days)" KPI.
- **Logged in per day:** one row per learner × day over a `generate_series` window, so empty days are present as zeros. Count `logged_in` per day. The default window is 14 days; allowed windows are 7, 14 and 30 days.

### 3.8 Overdue

A learner is overdue in a selection when **any** of the following items is overdue. The `overdue_item` source has one row per item, with `kind`, `course_ids`, `title`, `due_at`, `days_overdue` and `assignment_id` (goal rows only).

| Kind | Rule | Course link | "Send reminder" |
| --- | --- | --- | --- |
| `goal` | `cohort_goal_assignment.due_date < now()` and `status NOT IN ('completed','waived')` and goal `status = 'active'`. This is computed live, not read from the stored status, which is only as fresh as the last sweep | `cohort_goal.course_ids` (jsonb array). A course filter keeps goals whose `course_ids ? :courseId`, or whose list is empty | Yes |
| `compliance` | Latest-cycle `course_completion_record` with `due_date < now()`, `completed_at IS NULL` and `status NOT IN ('compliant','waived')` | `course_id` | No. Compliance has its own reminder scan |
| `exercise` | `exercise.due_by < (now() AT TIME ZONE 'UTC')` (`due_by` is a timestamp **without** time zone) and not `is_complete` | the exercise's course | No |

In cohort scope only that cohort's goals count. In course and org scopes, goals are reached through the cohort bridge.

### 3.9 Status and needs attention

Put the thresholds in one module, `packages/utils/src/constants/insights.ts`, because both the API and the dashboard read them. They are placeholders until the PRD owner confirms them (section 12):

```ts
export const INSIGHTS_THRESHOLDS = {
  inactiveDays: 2,
  lowScorePct: 50,
  laggingScorePct: 65,
  lowVideoPct: 60
} as const;
```

**Flags per learner**, evaluated over the current selection (all courses, or the picked course):
- `inactive`: `days_since_login >= 2`, or the learner has never logged in.
- `low_score`: average score below 50.
- `overdue`: from 3.8.
- `low_video`: video percentage below 60, ignored when it is `NULL`.

**Status**, checked in this order:
1. `completed`: every course in the selection is completed.
2. `at_risk`: `inactive` or `low_score` or `overdue`.
3. `lagging`: average score below 65, or `low_video`.
4. `on_track`: otherwise.

**Needs attention by reason:** count of non-completed learners per flag. A learner can appear under several reasons.

**Org "Cohort health"** is derived on the client from the aggregated row, using the same constants:
- `completed` when at least 95% of learners are completed
- `at_risk` when at least 20% are at risk
- `lagging` when the average score is below 65
- `on_track` otherwise

Put this rule in `insights-utils.ts` and unit-test it.

### 3.10 Questions

`question_result` source, one row per learner × question, read from the learner's **best graded submission** of that exercise. Ties go to the latest `created_at`:

- **`correct_pct`:** `question_answer.point * 100.0 / question.points`. Skip questions where `points` is `NULL` or 0.
- **Hardest questions:** `AVG(correct_pct)` ascending. Require at least 5 answers.
- **Most common wrong answer:** the mode over answers with `point < points`. Only these question types have one; every other type shows none:
  - RADIO (`answer_data->>'optionId'` → `option.label`)
  - TRUE_FALSE (`answer_data->>'value'`)
  - CHECKBOX (the sorted `optionIds` joined into option labels)

### 3.11 Course and org extras

- **Lesson drop-off (course):** `lesson_progress` source, learner × lesson. Rate of `lesson_completion.is_complete` per lesson, in outline order.
- **Median days to finish (course):** `percentile_cont(0.5)` over `days_to_finish`.
- **Hiring ramp (org):** `org_member` source, one row per ISO week over the last 12 weeks from `generate_series`, so a week with no new members still has a row. `members_total` is the running count of `organizationmember` rows with `role_id = 3` and `status = 'ACTIVE'` created before the end of that week; `members_added` counts those created during it. The widget draws `members_total` as a line. The "target" line needs stored settings, so it moves to Phase 2. Draw no target line in v1.
- **Certificates issued (org):** count of learner-courses with `is_certified`.

## 4. Engine architecture

### 4.1 Shared constants and validation (`packages/utils`)

The code is in sections 15.1 to 15.3.

- **`src/constants/insights.ts`** holds every id as an `as const` array, plus:
  - `INSIGHTS_THRESHOLDS`
  - `INSIGHTS_LIMITS`
  - `INSIGHTS_PLACEHOLDERS` (`$course`, `$learner`, `$exercise`, which the dashboard replaces before sending a spec)

  Export the module from the constants barrel.
- **`src/validation/insights/`** contains `spec.ts`, `dashboard.ts` and `index.ts`:
  - `ZInsightsQuerySpec` (with `minGroupRows` for `HAVING COUNT(*) >=`)
  - `ZInsightsExportSpec`
  - the request schemas
  - `ZInsightsWidget` (with `courseMode` and `requires`)

  Add `export * from './insights'` to `validation/index.ts`. No `package.json` change is needed, because `./validation/*` is already wildcarded.
- No custom error messages in schemas (`packages/utils/src/validation/README.md`). The filter op/value check is a bare `.refine(…, { path: ['value'] })`.
- Add `packages/utils/tests/insights-spec.test.ts`:
  - spec defaults
  - limits
  - rejection of unknown ids
  - a `z.toJSONSchema` snapshot, so contract changes are deliberate

### 4.2 Query layer (`packages/db/src/queries/insights/`)

Import as `@cio/db/queries/insights` (no `package.json` change). Every exported function takes `dbClient: DbOrTxClient = db` and logs in `catch` as `console.error('<fnName> error:', error)`.

| File | Exports | Notes |
| --- | --- | --- |
| `types.ts` | Compile context, source definition, result types | 15.4 |
| `scope.ts` | `scopeCtes(context)`, `plainScopeContext(scope)`, `uuidList(ids)` | The section 3.1 CTEs and the `course_item` `VALUES` CTE (15.5) |
| `fragments.ts` | `insightsMetricCtes(context)` | The single implementation of every section 3 definition, as `*_row` CTEs. Reuses `submissionMeetsCompletionPolicySql` (15.6) |
| `sources/*.ts` | One file per source (below), plus `helpers.ts` | Each exports an `InsightsSourceDefinition` (15.7) |
| `registry.ts` | `INSIGHTS_REGISTRY` | Typed as `Record<TInsightsSource, …>`, so a missing source fails the build (15.8) |
| `compile.ts` | `compileInsightsQuery(spec, { scope, orderedItems })`, `requiresOrderedItems(spec)` | Pure function, easy to unit test (15.9) |
| `run.ts` | `runInsightsQuery(spec, input, dbClient?)` | Returns `{ columns, rows, total }` (15.10) |
| `summary.ts` | `getInsightsScopeSummary(scope)`, `listInsightsScopeCourseIds(scope)` | Dashboard header and the scope's course ids (15.10) |
| `structure.ts` | `getInsightsExerciseMeta(courseIds)` | Pass rules, lock state and max points for column headers (15.10) |

**Sources (v1).** The PRD's three sources are kept, and further sources are split off so that each grain is explicit. That split is what stops attempts, video assets or cohorts from duplicating rows.

| Source | Grain | Key fields |
| --- | --- | --- |
| `learner` | learner, or learner × cohort when grouped or filtered by cohort | name, email, overall_progress_pct, avg_score_pct, courses_total, courses_completed, last_login_at, days_since_login, logged_in_today, video_pct, attendance_pct, certificates, flags, status |
| `learner_course` | learner × course | progress_pct, is_completed, is_certified, completed_at, enrolled_at, days_to_finish, avg_score_pct, required_total, required_passed, now_at_item_id |
| `assessment_result` | learner × exercise | 3.4 fields, exercise_rank, section_id |
| `section_activity` | learner × course × section | 3.5 and 3.6 fields |
| `question_result` | learner × question | correct_pct, wrong-answer key |
| `lesson_progress` | learner × lesson | is_complete, lesson_rank |
| `login_day` | learner × day | logged_in |
| `overdue_item` | overdue item | 3.8 fields |
| `org_member` | week (last 12, gap-filled) | members_added, members_total |

**`InsightsSourceDefinition`** (in `types.ts`) declares:
- `scopeTypes`: the scopes the source is available in.
- `build(context)`: the base relation, normally `SELECT * FROM <name>_row`.
- `dimensions`: key, label and rank expressions.
- `metrics`: the value expression, an optional denominator, and the allowed aggregations.
- `filters`: a `pushdown` target or a `predicate` with allowed ops and values.
- `searchColumns`.

**Pushdown.** Course, cohort and learner filters are **pushed down** into the scope CTEs. Every pooled value is therefore computed over the selection, rather than filtered afterwards. Grouping or filtering by cohort switches on the cohort bridge.

**`now_at_item_id`** is "the first incomplete item in navigation order", the same rule as `deriveCourseMemberStage` in `apps/api/src/services/course/member-progress.ts`. Compute it in SQL as the item with the lowest `rank` that is not complete. Show "Finished" when nothing is incomplete.

**Compiler rules.**
- The output has this shape:

  ```sql
  WITH <scope CTEs>, <metric CTEs>, base AS (<source.build>)
  SELECT <dimension id/label/rank>, <measures>, COUNT(*) OVER() AS __total
  FROM base
  WHERE <predicate filters> [AND <search>]
  GROUP BY <dimensions>
  [HAVING COUNT(*) >= :minGroupRows]
  ORDER BY <sort, then a deterministic tiebreak on dimension keys>
  LIMIT :limit OFFSET (:page - 1) * :limit
  ```
- **Aggregations:**
  - `value`: the single value of a one-row group.
  - `count`, `count_if`, `sum`, `avg`.
  - `median`, `p25`, `p75` (`percentile_cont`).
  - `rate`: the share of true values, × 100.
  - `pooled`: `SUM(num) / SUM(den)`, × 100.
  - `mode`.
  - `running_count`: a cumulative count over the first dimension.

  Each metric declares which of these it accepts.
- **Output types:** numeric outputs are cast to `float8` and integers to `int`, because postgres-js returns `numeric` and `bigint` as strings. Dates come back as ISO strings via `to_json`.
- **Values:** every value goes in through Drizzle `sql` parameters. Identifiers come only from the registry. A sort field must be one of the spec's dimensions or measures.
- **Search:** `ILIKE` on `profile.fullname` and `profile.email`. Escape `%`, `_` and `\`.
- **Buckets** (`progress_bucket_25`, `score_bucket_10`) are registry dimensions with fixed widths, not free formulas.
- **Defensive validation:** throw `OperationalQueryError` (`queries/query-errors.ts`) for any id the registry does not know, even though Zod already rejected it.

### 4.3 Service (`apps/api/src/services/insights/`)

| File | Responsibility |
| --- | --- |
| File | Responsibility |
| --- | --- |
| `types.ts` | `InsightsActor`, `AuthorizedInsightsScope`, `InsightsQueryResult`, `InsightsCourseStructure`, `InsightsDashboard` |
| `errors.ts` | `toInsightsError`: keeps an `AppError`, maps `OperationalQueryError` to its own status, and wraps anything else as a 500 |
| `authorize.ts` | `resolveAuthorizedScope(actor, scope)`. The rules are in 4.5. Returns `{ orgId, type, id, courseIds }` |
| `structure.ts` | `getInsightsCourseStructure(orgId, courseId)` (cached 10 minutes) and `toOrderedItems(structure)` |
| `canonicalize.ts` | `canonicalizeSpec(spec)` sorts filters and `in` values and trims search. `hashSpec(spec)` is a SHA-256 of stable JSON with sorted keys |
| `query.ts` | `runInsightsQueryForActor` (authorize, canonicalize, key, TTL, refresh gate, `cachedRead`, and uncached search) and `exportInsightsQueryForActor` (same authorization, no cache, export row cap) |
| `dashboards.ts` | `getInsightsDashboardForActor`: the scope summary (cached at the scope TTL), each in-scope course's structure (none for org scope), the presets, and `refreshIntervalSeconds` |
| `presets/*.ts` | Preset widgets as plain data (section 5), parsed with `ZInsightsWidget` at load |

The code is in section 15.14. Errors are `AppError`; the new codes are listed in 15.3.

### 4.4 Routes and contract (`apps/api/src/routes/insights/`)

```ts
// routes/insights/index.ts
export const insightsRouter = new Hono()
  .post('/query', authMiddleware, orgMemberMiddleware, zValidator('json', ZInsightsQueryRequest), handler)
  .post('/export', authMiddleware, orgMemberMiddleware, insightsExportRateLimit, zValidator('json', ZInsightsExportRequest), handler)
  .get('/dashboards/:scopeType/:scopeId', authMiddleware, orgMemberMiddleware, zValidator('param', ZInsightsDashboardParam), handler);
```

- **Mounting:** add `.route('/insights', insightsRouter)` inside the `app.ts` chain, before `.onError`.
- **`orgMemberMiddleware`** requires the `cio-org-id` header and sets `c.get('orgId')`. The service never reads an org id from the body or query.
- **Rate limit:** `insightsExportRateLimit = createRateLimiter({ windowMs: 60_000, maxRequests: 6, keyGenerator: (c) => \`insights_export:${c.get('user')?.id}\` })`. It only enforces in production.
- **Response headers:** every response sets `c.header('Cache-Control', 'private, no-store')`.
- **Response shapes** (one type per route):
  - `/query` and `/export` return `{ success: true, data: { columns: Array<{ key, role: 'dimension' | 'measure', valueType }>, rows: Array<Record<string, string | number | boolean | null>>, total: number, generatedAt: string, cached: boolean, refreshThrottled: boolean } }`
  - `/dashboards` returns `{ success: true, data: { scope: { type, id, name, learnerCount, pendingCount, courses: Array<{ id, title, isGrouped, hasPassRequired }> }, structures: Record<courseId, { courseId, isGrouped, sections, items }>, widgets: TInsightsWidget[], refreshIntervalSeconds: number } }`
- **Dimension columns** come back as `<dim>_id` and `<dim>_label`, and as `<dim>_rank` when the dimension is ordered. Long format only. The dashboard pivots the learner × exercise matrix.

### 4.5 Authorization (service-level, before any cache read)

The cohort and course middlewares read `cohortId` and `courseId` from the path, so they cannot guard `/insights/*`. That is why the check lives in `authorize.ts`. Use the session's `orgRoles`, which only contains ACTIVE memberships, rather than `isOrgAdminByCohortId`, which ignores status.

| Scope | Allowed | Checks |
| --- | --- | --- |
| `org` | Org admins | `scope.id === orgId` (else 404 `INSIGHTS_SCOPE_NOT_FOUND`), and `orgRoles[orgId] === ROLE.ADMIN` (else 403) |
| `cohort` | Org admins, plus that cohort's ADMIN or TUTOR members | `getCohortOrganizationId(cohortId) === orgId` (else 404). Then org admin, or `getCohortMemberRole(cohortId, profileId)` is 1 or 2 |
| `course` | Org admins and the course team | The `getCourseOrganizationId(courseId)` helper currently in `queries/tag/tag.ts` must equal `orgId` (else 404). Then `isCourseTeamMemberOrOrgAdmin(courseId, profileId)` |

Students always get 403. A filter value such as a course id outside the scope just matches nothing, because every source joins `scope_course`. Tests must cover this case explicitly.

### 4.6 Caching

Follow the PRD's "Caching" section, with these concrete choices:

- **Key and invalidation helpers** go in a new `packages/core/src/utils/redis/insights-cache.ts`, next to `org-stats-cache.ts`. They live in core, not in `apps/api` `key-generators.ts`, because the code that changes structure (`updateExerciseService`, `reorderCourseContent`) is in `packages/core`. The file exports:
  - `insightsKey(section: 'query' | 'dashboard' | 'structure', orgId, scopeType, scopeId, hash?)`, which builds `insights:{section}:{orgId}:{scopeType}:{scopeId}[:{hash}]`
  - `insightsStructureKey(orgId, courseId)` and `insightsTtlSeconds(scopeType)`
  - `INSIGHTS_TTL_SECONDS = { scope: 30, org: 60, structure: 600 }`
  - `claimInsightsRefresh(profileId, scopeType, scopeId, specHash)`, the refresh gate below
  - `invalidateInsightsCourseStructure(courseId)`, which resolves the org itself and never throws

  The code is in 15.12.
- **`cachedRead` gets an optional fourth argument**, `cachedRead(key, ttl, compute, { refresh?: boolean })`. With `refresh` it skips the read, computes under the same lock and overwrites the entry. The old entry stays readable until it is overwritten, so normal readers never recompute during a refresh. If the lock is already held, a refreshing caller waits for an entry whose `generatedAt` is newer than its own start time, and computes only if none arrives. Add cases to `apps/api/src/__tests__/cached-read.test.ts`. The behavior without the argument stays exactly as it is today.
- **Refresh gate:** `redis.set(\`insights:refresh:${profileId}:${scopeType}:${scopeId}:${specHash}\`, '1', { NX: true, EX: 15 })`, where `specHash` is the same `hashSpec(spec)` the cache key uses.
  - The gate is per widget. **Refresh** sends every widget's request at once, so a per-scope key let the first request claim the slot and throttled the other nine; the 4c manual check caught this on the org page. A second press within 15 seconds is still throttled for every widget.
  - If the key was not set, serve the cached entry and return `refreshThrottled: true`; this is not an error.
  - If Redis is unavailable, let the refresh through.
- **TTL:** `scope` for cohort and course, `org` for org. Never cache search requests or exports.
- **Structure invalidation:** call `invalidateInsightsCourseStructure` after commit in these places:
  - `updateExerciseService` (`packages/core/src/services/exercise/exercise.ts:397`), when `completionPolicy`, `passThreshold`, `isUnlocked`, `order`, `sectionId` or `title` change. `apps/api/src/services/exercise/utils.ts` duplicates the update mapping, so check whether an API path bypasses core.
  - `reorderCourseContent`, `updateCourseContent` and `deleteCourseContent` (`packages/core/src/services/course/content.ts`).
- **Data in Redis:** cached rows contain learner names and emails for at most 60 seconds, which is acceptable, and they are never in an HTTP shared cache.

## 5. Widget catalogue (presets)

Each widget is a spec plus a viz. In the "Spec" column, "→" separates the source from its measures. Every `titleKey` is under `insights.widgets.*`.

### 5.1 Cohort: all courses (default)

| Widget | Viz | Spec |
| --- | --- | --- |
| Logged in today | kpi | `learner` → `count_if(logged_in_today)` and `count` |
| Average progress | kpi | `learner` → `avg(overall_progress_pct)` |
| Average score | kpi | `learner` → `avg(avg_score_pct)` (learners with a graded exercise) |
| Overdue | kpi | `learner` → `count_if(is_overdue)` |
| Completed | kpi | `learner` → `count_if(is_completed_all)`, `sum(certificates)` |
| Courses in this cohort | grouped bar + table | `learner_course` dims `[course]` → `count`, `avg(progress_pct)`, `avg(avg_score_pct)`, `count_if(is_completed)`, `pooled(required_pass)` |
| Learners by status | donut | `learner` dims `[status]` → `count` |
| Learner's courses (selected learner) | table | `learner_course` filter `learner = :id` dims `[course]` → progress, now at, average score, "Required passed x of y" |
| Needs attention by reason | horizontal bars | `learner` → `count_if` per flag (non-completed learners) |
| Overdue, with reminders | table + action | `overdue_item` sorted by `days_overdue desc`, limit 5, with "View all" (dialog, paged). "Remind all" covers goal rows only |
| Learners | table | section 6.4 |
| Logged in per day | column chart | `login_day` dims `[day]` → `count_if(logged_in)`, `days: 14` |
| Average score distribution | histogram | `learner` dims `[score_bucket_10]` → `count` |

### 5.2 Cohort: one course picked

All KPIs get filter `course = :courseId`. These are the widgets that appear or change:

| Widget | Viz | Spec |
| --- | --- | --- |
| Scores by exercise | line + middle-50% band | `assessment_result` filter course dims `[exercise]` → `avg`, `p25`, `p75` (`best_score_pct`), `count_if(is_graded)`, `count_if(is_attempted)`. Plot a point only once at least 25% of learners are graded. Hide a locked exercise whose `is_attempted` count is 0 (3.2) |
| Progress distribution | column | `learner_course` filter course dims `[progress_bucket_25]` → `count` |
| Learner score progression | line vs cohort average | `assessment_result` filter course and learner dims `[exercise]`. The cohort line reuses the widget above |
| Scores and attendance by section | grouped bar | `section_activity` filter course dims `[section]`. Requires `grouping` |
| Section-by-section scorecard | table | the same source, with the 3.5 values. Requires `grouping` |
| Hardest questions | horizontal bars | `question_result` filter course dims `[question]` → `avg(correct_pct)`, `mode(wrong_answer)`. Sort ascending, `minGroupRows: 5`, limit 5 |
| Learners | matrix | section 6.4, with exercise columns |

### 5.3 Course

| Widget | Viz | Spec |
| --- | --- | --- |
| Enrolled · Completion rate · Average score · Required exercises pass rate · Median days to finish | kpi row | `learner_course` (`count`, `rate(is_completed)`, `median(days_to_finish)`), `learner` (`avg(avg_score_pct)`), and `assessment_result` (`pooled(required_pass)`, shown only when the course has a pass-required exercise) |
| Scores by exercise, one line per cohort | multi-line | `assessment_result` dims `[exercise, cohort]` → `avg(best_score_pct)`. The chart draws the 5 largest cohorts from "Cohorts taking this course" and offers the rest in its legend |
| Score distribution | histogram + exercise picker | `assessment_result` filter `exercise = :picked` dims `[score_bucket_10]` → `count` |
| Lesson completion drop-off | horizontal bars | `lesson_progress` dims `[lesson]` → `rate(is_complete)` |
| Hardest exercises | grouped bar | `assessment_result` dims `[exercise]` → `avg(best_score_pct)`, pass rate. Sort ascending, limit 5 |
| Scores by exercise | line + middle-50% band | as 5.2, across every learner. The Learners matrix reads its `is_attempted` counts (3.2) so locked-but-attempted exercises keep their column |
| Hardest questions | horizontal bars | same as 5.2 |
| Section-by-section scorecard | table | same as 5.2, across every learner |
| Cohorts taking this course | grouped bar + table | `learner_course` dims `[cohort]` → learners, `avg(progress_pct)`, `avg(avg_score_pct)`, required pass rate, overdue count. Learners in no cohort are grouped under "No cohort" |
| Learners | matrix | replaces the old student table, with the same row link to `/courses/{id}/people/{personId}?back=/courses/{id}/analytics` |

### 5.4 Organization

| Widget | Viz | Spec |
| --- | --- | --- |
| Logged in (7 days) · Average progress · Completions · Certificates issued · Needs attention | kpi row | `learner` (`count_if(logged_in_week)`, `avg(overall_progress_pct)`, `count_if(is_at_risk)` over non-completed learners) and `learner_course` (`count_if(is_completed)`, `count_if(is_certified)`) |
| Cohorts at a glance | table + progress, row links to `/cohorts/{id}/analytics` | `learner` dims `[cohort]` → `count`, `avg(overall_progress_pct)`, `avg(avg_score_pct)`, `count_if(is_overdue)`, `count_if(is_at_risk)`, `count_if(is_completed_all)`. Health is derived on the client (3.9) |
| Needs attention by reason | horizontal bars | as 5.1 |
| Learners by cohort health | donut | client-side, from the table above |
| Hiring ramp | line | `org_member` dims `[week]`, cumulative. No target line in v1 |
| Learners logged in per day | line | `login_day` dims `[day]`, `days: 14` |
| Average score by cohort | horizontal bars | `learner` dims `[cohort]` → `avg(avg_score_pct)`. Replaces "Final exam average by cohort" |
| Courses by completion | horizontal bars | `learner_course` dims `[course]` → `rate(is_completed)`, descending, limit 10 |

Not built in v1 (the PRD marks these "Needs work" or "Blocked"): scheduled reports, the executive read-only role, learning time per day (#1299), peak concurrency (#1299), and supervisor copy (#1302). Show no placeholder card for them.

## 6. Dashboard app (`apps/dashboard`)

This section summarizes the dashboard work; the reference code is in section 16. Where the two differ, follow section 16.

### 6.1 Feature folder `src/lib/features/insights/`

| Path | Contents |
| --- | --- |
| `utils/types.ts` | `InsightsQueryRequest = typeof classroomio.insights.query.$post`, `InsightsExportRequest`, `InsightsDashboardRequest = (typeof classroomio.insights.dashboards)[':scopeType'][':scopeId']['$get']`, and `Extract<InferResponseType<…>, { success: true }>['data']` types. Never import `@cio/db` types |
| `api/insights.svelte.ts` | `class InsightsApi extends BaseApi` (section 6.3) |
| `utils/insights-utils.ts` | pivot (long format to matrix), value formatters, heat tone (reuses the `marks.svelte` grade thresholds; move that function here and use it in both places), status tone, cohort health (3.9), ExportDocument builders |
| `utils/insights-poller.svelte.ts` | `class InsightsPoller`: an interval that runs only while `document.visibilityState === 'visible'`, refetches once on return to the tab, and is cleared on destroy. Follow the patterns in `domains.svelte:352` and `app-version-notifier.svelte:26` |
| `components/` | below |
| `pages/` | `cohort-insights.svelte`, `course-insights.svelte`, `org-insights.svelte`, and `index.ts` |
| `index.ts` | exports `insightsApi` and the pages |

Components, kebab-case, no comments:
- **Layout:** `insights-grid.svelte`, `widget-card.svelte` (title, `UpdatedAgo`, `RefreshButton`, skeleton).
- **Status bits:** `updated-ago.svelte`.
- **Pickers:** `course-picker.svelte` (`Select.Root type="single"`), `exercise-picker.svelte`.
- **Tables:** `learners-table.svelte`, `learner-courses-panel.svelte`, `section-scorecard.svelte`, `overdue-table.svelte`.
- **Small viz:** `score-cell.svelte`, `sparkline.svelte`, `kpi-row.svelte` (uses `KpiCard`), `status-badge.svelte`, `pass-required-tag.svelte`.

Charts go in `components/charts/`. Every chart uses the browser-only `loadChart()` plus `{#await}` pattern from `AGENTS.md` and `features/analytics/components/trend-chart.svelte`:
- `line-band-chart.svelte`: `LineChart` plus an `AreaChart` range series.
- `multi-line-chart.svelte`
- `grouped-bar-chart.svelte`: `BarChart seriesLayout="group"`.
- `histogram-chart.svelte`: `BarChart` over registry buckets.
- `donut-chart.svelte`: `PieChart` with an inner radius.
- `hbar-list.svelte`: the CSS bar list from `top-courses.svelte`, no layerchart.

The layerchart 2.2.0 props for range areas, grouped bars and donut inner radius are **unverified**. Check them against `node_modules/layerchart` (or the 2.2.0 docs) before use. If a prop is missing, draw that one chart as inline SVG, as the prototype does.

**Colors:**
- `--chart-1` to `--chart-5` are all shades of one blue, so define categorical series colors in the widget config instead: `CHART_COLORS` from `packages/ui/src/custom/exercise-question/renderers/submission-utils.ts`, or semantic success, warning and danger tokens.
- Heat cells use the `marks.svelte` palette.

**Placement:** keep all of these in the feature folder. They read translations and insights types, so they are not generic `packages/ui` components. If one is later moved to `packages/ui`, it needs `ui:` prefixes and a Storybook story in that same change.

### 6.2 Moved shared cards (PR 1)

Move `kpi-card.svelte` and `analytics-panel-card.svelte` from `features/analytics/components/` to `features/ui/analytics/`, next to `ActivityCard`. Export them from `$features/ui` and update the four importers that section 7 lists.

In PR 2, give `KpiCard` a `loading` skeleton state. It shows a `Spinner` today, which breaks the skeleton-cards rule. Use `Skeleton` blocks with the same footprint.

### 6.3 `InsightsApi` behavior

- **State:** `dashboard`, `results: Record<widgetId, Result>`, `loadingByWidget`, `errorByWidget`, `generatedAtByWidget`, `scopeKey`.
- **`loadDashboard(scope)`:** loads the presets and structure, then runs every visible widget **in parallel**. Use one request-sequence guard per widget, like the one in `features/analytics/api/analytics.svelte.ts:96-112`.
- **Refetching:** `runWidget(widget, params)` keeps the previous result while a refetch runs, so nothing blanks. `refreshAll()` sends `refresh: true`.
- **Selection:** a course picker change re-runs only the widgets whose spec depends on `course`.
- **Polling:** `InsightsPoller` calls `runWidget` for every widget every `refreshIntervalSeconds`, and only while the tab is visible.
- **`UpdatedAgo`:** shows `max(now - generatedAt)` across the page in seconds or minutes. It ticks every second with a local `$state(Date.now())`. Add the keys `insights.updated_seconds_ago` and `insights.updated_minutes_ago` (ICU plural `{count}`).
- **Skeletons:** show skeletons while `results[widget.id]` is undefined. Never show a spinner instead.

### 6.4 Learners table (cohort, course, org drill-down)

**Toolbar:**
- **Search:** `Search` from `@cio/ui/custom/search`, bound to `DebouncedSearch`.
- **Status:** at risk, lagging, on track, completed.
- **Last login:** logged in today, or no login for 2+ days.
- **Average score:** under 50, 50 to 69, 70 and above.
- **Flags:** overdue, certificate, no certificate.
- **Sort:** `SortSelect` with "lagging first", "least progress", "name A to Z" and "lowest score". "Lagging first" orders by status priority, then by lowest score.

Filters, search and sort live in page state. Mutate fields in place; never reassign the object.

**Data:**
1. `learner` source with `limit: 25` and `page: 1`. "Show more" requests the next page and appends it.
2. When one course is picked, also query `assessment_result` with filter `course` and `learner in <visible ids>` for the exercise columns, plus a sparkline.

**Columns:**
- All courses: Learner, Progress, Average score, Courses completed, Video, Classroom, Certificate, Last login, Status.
- One course: Learner, Progress, Now at, one column per visible exercise (with its `PassRequiredTag`), Trend, Video, Classroom, Certificate, Last login, Status.

**Cells:**
- Score cells are colored by the heat tone.
- "Awaiting grade" is muted text.
- A pass-required cell is green at or above its pass mark, red below.

**Row click:** select the learner. That drives the "Learner's courses" panel or the progression chart above, as in the prototype, and scrolls it into view (respect `prefers-reduced-motion`). In the course scope, also show a link to the learner's people page.

**Export:** `ExportMenu` with a lazy `document`.
- It calls `/insights/export` with the same filters, page 1 and the export limit.
- When one course is picked, it makes a second `assessment_result` export for the course and pivots the result into exercise columns.
- Build the file with an `ExportDocument` builder in `insights-utils.ts` and translated headers.

### 6.5 Pages, routes and navigation

**Cohort (PR 2).**
- Add `routes/(app)/cohorts/[id]/analytics/+page.svelte`, a thin wrapper. It renders `CohortInsightsPage` inside `Page.Root`/`Page.Header`/`Page.Body`, using `{#snippet child()}`.
- Load in an `$effect` keyed on `$currentOrg.id` and `data.cohortId`.
- Show the course picker only when the cohort has more than one course.
- Add a sidebar item in `features/cohort/components/sidebar/cohort-sidebar-navigation.svelte`, after People: `{ id: 'analytics', title: $t('cohorts.sidebar.analytics'), url: \`/cohorts/${id}/analytics\`, isActive: currentPath.endsWith('/analytics'), icon: AnalyticsIcon, show: () => canManageMembers }`. `AnalyticsIcon` comes from `@cio/ui/custom/moving-icons`.
- On the page, show `Empty` with a "not permitted" message for anyone who fails `canManageMembers`. The API enforces this anyway.

**Course (PR 3).**
- Replace `routes/(app)/courses/[id]/analytics/+page.svelte`, and **delete** its `+page.server.ts` (the SSR call to the old endpoint).
- Render `CourseInsightsPage` inside `RoleBasedSecurity allowedRoles={[ROLE.ADMIN, ROLE.TUTOR]}` with an `onDenied` redirect to the lessons page, following the marks page.
- Keep the course sidebar item as it is.
- Delete:
  - `features/course/pages/analytics.svelte` and its export in `pages/index.ts`
  - `features/course/components/analytics/*`
  - `features/course/utils/course-analytics-export-utils.ts`
  - `courseApi.courseAnalytics` and `courseApi.getAnalytics` (unused)
  - the legacy `CourseAnalytics` and `StudentOverview` in `src/lib/utils/types/analytics.ts`, unless something else still uses them (grep first)
- Keep `GET /course/:courseId/analytics` and `getCourseAnalytics`. The public API and MCP still use them.

**Org (PR 4).**
- Remove PR 1's redirect and add `routes/(app)/org/[slug]/analytics/+page.svelte`, which renders `OrgInsightsPage`.
- Gate the page with `$isOrgAdmin`: `null` means still loading, so show skeletons; `false` shows `Empty`.
- In `org-navigation.ts`, add a Stats sub-item `{ titleKey: 'org_navigation.analytics', path: '/analytics', requiresAdmin: true, matchPattern: '^/org/[^/]+/analytics(/.*)?$' }` **before** Marketing.

**`testId`s:**
- `insights-course-picker`
- `insights-refresh`
- `insights-learners-search`
- `insights-learners-export`
- `insights-remind-all`
- `cohort-nav-analytics`, if the cohort sidebar supports ids; otherwise rely on role and label

### 6.6 Translations

- **New top-level namespace `insights`:**
  - `title`
  - `subtitle.{cohort,course,org}`
  - `updated_*`
  - `widgets.<id>.{title,description}`
  - `metrics.*`
  - `status.*`
  - `flags.*`
  - `filters.*`
  - `sort.*`
  - `columns.*`
  - `empty.*`
  - `reminders.*`
  - `pass_required_tag` (`"Pass required · {mark}%"`)
  - `awaiting_grade`
  - `not_in_section`
  - `no_cohort`
  - `finished`
- **Other new keys:**
  - `cohorts.sidebar.analytics`
  - `org_navigation.marketing` (PR 1)
  - `marketing.title` and `marketing.subtitle` (PR 1)
- **Do not move existing `analytics.*` keys.** The audience, compliance, org site and course people pages share them.
- After editing `en.json`, run `cd apps/dashboard && pnpm translate` and check that every `{placeholder}` survived in all 11 other locales. Fix `tr.json` by hand if the script leaves English.

## 7. PR-by-PR steps

### PR 1: Marketing rename (PRD Phase 0)

1. Move `KpiCard` and `AnalyticsPanelCard` to `features/ui/analytics/` (6.2). Update their importers:
   - `features/course/components/analytics/analytics-graph.svelte`
   - `features/course/components/analytics/course-analytics-kpis.svelte`
   - `features/course/pages/analytics.svelte`
   - `features/analytics/components/landing-kpis.svelte` and the other internal users
2. `git mv apps/dashboard/src/lib/features/analytics apps/dashboard/src/lib/features/marketing`. Rename `analyticsApi` to `marketingApi` and `AnalyticsApi` to `MarketingApi`, and update `index.ts` and the imports.
3. `git mv apps/dashboard/src/routes/(app)/org/[slug]/analytics apps/dashboard/src/routes/(app)/org/[slug]/marketing`. Switch the page to `marketing.title` and `marketing.subtitle`, and leave every other `analytics.*` key alone.
4. Add a temporary `routes/(app)/org/[slug]/analytics/+page.ts` that throws `redirect(307, \`/org/${params.slug}/marketing\`)`, so bookmarks keep working until PR 4.
5. In `features/ui/navigation/org-navigation.ts`:
   - Set the Stats `matchPattern` to `'^/org/[^/]+/(analytics|marketing|compliance)(/.*)?$'`.
   - Replace the Analytics sub-item with `{ titleKey: 'org_navigation.marketing', path: '/marketing', matchPattern: '^/org/[^/]+/marketing(/.*)?$' }`.
   - The test id becomes `org-nav-marketing` automatically. Update `e2e/README.md` if it lists `org-nav-analytics`.
6. Add `org_navigation.marketing` ("Marketing"), `marketing.title` and `marketing.subtitle` to `en.json`, then run `pnpm translate`.
7. Check what else consumes the nav config (`features/search/utils/static-catalog.ts`, `breadcrumb.ts`). They derive from it, so confirm the command palette shows "Marketing".
8. Help Center:
   - Update the five org-analytics articles and `blume.config.ts` labels: "Analytics" becomes **Marketing**, and the sidebar path is now Stats → Marketing.
   - Recapture screenshots with the add-docs-image skill.
   - Leave `understand-the-organization-dashboard.mdx` alone apart from the label in line 22.
9. Release note: "The landing-page stats page is now called Marketing."

### PR 2: engine, cohort dashboard, reminders

1. **Shared code:** add the constants and validation (4.1) with their utils tests.
2. **Query layer:** add `packages/db/src/queries/insights/` (4.2): scope, fragments, sources, registry, compiler and run.
3. **Cache helpers:** add `packages/core/src/utils/redis/insights-cache.ts` and the `cachedRead` refresh option, with tests.
4. **Services:** add `apps/api/src/services/insights/` (4.3) and the error codes.
5. **Routes:** add `apps/api/src/routes/insights/index.ts` and mount it in `app.ts`. Build the API so the dashboard gets the RPC types: `pnpm --filter @cio/api^... build && pnpm --filter @cio/api build`.
6. **Structure invalidation:** add the calls in core (4.6).
7. **Send reminder now:**
   The code is in 15.11 and 15.16.
   1. **Query** (`packages/db/src/queries/cohort/goal.ts`): pull the select in `listAssignmentsForReminderScan` out into `selectReminderContexts`. Add `getAssignmentReminderContext(cohortId, assignmentId, dbClient?)`, which returns a `CohortGoalReminderContext` or `null`, and `listOverdueAssignmentReminderContexts(cohortId, courseId?)`.
      - The email becomes `COALESCE(profile.email, cohort_member.email)`. Members added by profile id have `cohort_member.email = NULL`, so the current scan silently skips them; say so in the PR.
   2. **Service** (`apps/api/src/services/cohort/goal.ts`): move the scan's per-row body into `enqueueCohortGoalReminder(context, { email, daysUntilDue, idempotencyKey })`. The scan keeps its own key. Add `sendCohortGoalReminderNow(cohortId, assignmentId)`:
      - 404 `COHORT_GOAL_ASSIGNMENT_NOT_FOUND` when the assignment is missing or not in the cohort
      - 409 `COHORT_GOAL_REMINDER_NOT_ALLOWED` when the assignment is `completed` or `waived`, the goal is archived, or there is no due date
      - 400 `COHORT_GOAL_REMINDER_NO_EMAIL` when there is no email
      - `daysUntilDue` may be negative; the template already renders overdue copy for `<= 0`
      - idempotency key `cohort-goal-reminder-manual:${assignmentId}:${dayKey}`, so it never dedupes against the scan
      - returns `{ enqueued: boolean }`
   3. Add `sendOverdueCohortGoalRemindersNow(cohortId, { courseId? })`, capped at 500 assignments. It returns `{ enqueued, skipped }`.
   4. **Routes** in `apps/api/src/routes/cohort/cohort.ts`:
      - `POST /:cohortId/goal-assignments/:assignmentId/remind`
      - `POST /:cohortId/goal-assignments/remind-overdue` with JSON `{ courseId?: uuid }` (`ZRemindOverdueCohortGoals`)

      The separate `goal-assignments` prefix keeps them clear of the existing `/:cohortId/goals/:goalId` routes. Both use `authMiddleware`, `cohortTeamMemberMiddleware`, `createRateLimiter({ windowMs: 60_000, maxRequests: 20, keyGenerator: (c) => \`cohort_goal_remind:${c.get('user')?.id}\` })`, and `zValidator` for params and body.
   5. **Org branding:** reminder emails are org-branded. Pass `from: buildEmailFromName(\`${orgName} (via ClassroomIO.com)\`)` in `enqueueCohortGoalReminder`, which also fixes the scan path, and note this in the PR.
   6. **Subject line:** the English subject "Reminder: a cohort goal is due soon" (`packages/utils/src/email/catalog.ts:35-39`) reads wrongly for overdue reminders. If the catalog supports a field-based subject, use overdue copy when `daysUntilDue <= 0`. If it does not, list this as an open item instead of growing the PR.
   7. **Tests:** add the reminder cases to `apps/api/src/__tests__/services-cohort-goal.test.ts`.
8. **Dashboard:**
   - the `features/insights` folder (6.1–6.4)
   - the cohort route and sidebar item (6.5)
   - the `KpiCard` skeleton (6.2)
   - the cohort `RemindButton` and `RemindAllButton` in `overdue-table.svelte`, which call new `cohortGoalApi.remind` and `cohortGoalApi.remindOverdue` methods with snackbar keys
9. **Translations** (6.6).
10. **Help Center:** a new article, `analytics-and-reporting/track-a-cohort-with-analytics.mdx`. Add it to `blume.config.ts` and link it from the cohort help articles. Include framed screenshots.
11. **Tests:** the PR 2 parts of section 8.
12. **Performance:** the seed and measurement in section 9. Paste the numbers into the PR.

### PR 3: course dashboard

1. Add the course presets (5.3).
   - **Gap fixed:** 5.3 originally listed only the per-cohort "Scores by exercise" variant. The course preset also carries the course-wide `scores_by_exercise` widget (5.2 spec, `courseMode: 'any'`), because the Learners matrix and the learner-progression overlay read its `is_attempted` counts; without it the empty result hides locked-but-attempted exercise columns (3.2).
2. Add `CourseInsightsPage` and replace the route (6.5).
3. Delete the old components (6.5). `grep -rn "course/components/analytics\|course-analytics-export-utils\|courseAnalytics\|AnalyticsPage" apps/dashboard/src` must return nothing afterwards.
4. Help Center: rewrite `analytics-and-reporting/review-course-performance-and-learner-progress.mdx` for the new page, with new screenshots.
5. PR description: say that average score and progress now follow the canonical rules (3.3 and 3.4), so the numbers can differ from the old page and from `/public-api/v1/courses/:id/analytics`. Phase 3 aligns the public API.

### PR 4: organization dashboard

1. Add the org presets (5.4) and `OrgInsightsPage`.
2. Add the route, the nav item and the admin gate, and remove the PR 1 redirect (6.5).
3. Make each "Cohorts at a glance" row link to `/cohorts/{id}/analytics`.
4. Help Center: a new article, `analytics-and-reporting/monitor-learners-across-your-organization.mdx`, plus a link from the Marketing articles explaining the difference.
5. Release note: `/org/<slug>/analytics` is now learner analytics, and the stats it used to show are under Marketing.

## 8. Tests

Put API tests in `apps/api/src/__tests__/`. They run with `pnpm --filter @cio/api exec vitest run`. The `test` script itself is malformed, so do not use `pnpm test`.

| Test file | What it proves |
| --- | --- |
| `insights-compiler.test.ts` | Uses `new PgDialect().sqlToQuery(compileInsightsQuery(...))`, as in `services/cohort/__tests__/cohort-member-authorization.test.ts`. Checks that: the org id parameter is always present; unknown ids throw; values are parameters and never interpolated; search escapes `%` and `_`; page and limit are applied and capped; sort only accepts spec fields; the cohort bridge is joined only for cohort dimensions or filters |
| `insights-canonicalize.test.ts` | Specs that differ only in key order, filter order or `in` value order produce the same hash. Different scopes or orgs produce different keys |
| `services-insights-authorization.test.ts` | Every scope and role in 4.5, including cross-org ids returning 404 and students returning 403. A failed check never calls `cachedRead`, which is mocked and asserted not called |
| `services-insights-cache.test.ts` | The right TTL per scope. Search and export bypass the cache. A refresh inside 15 seconds returns `refreshThrottled` without recomputing; outside 15 seconds it rewrites the entry. When Redis is down, results are still correct |
| `cached-read.test.ts` (extend) | `refresh: true` skips the read, takes the lock and overwrites the entry; readers keep getting the old entry meanwhile; a second refresh while the lock is held waits for a newer `generatedAt` |
| `routes-insights.test.ts` | `Cache-Control: private, no-store`; one response shape; missing `cio-org-id` returns 400; the body cannot override the header org. Follow the pattern in `routes-dash-stats.test.ts` |
| `insights-metrics-db.test.ts` | DB-backed, `describe.skipIf(!hasDatabase)`, following `services-course-content-db.test.ts`. Fixtures (below) with every expected value hand-computed in the test |
| `services-cohort-goal.test.ts` (extend) | Manual reminder: idempotency key, overdue `daysUntilDue < 0`, 404/409/400 paths, `from` set, bulk cap |
| `packages/utils/tests/insights-spec.test.ts` | Spec schema and snapshot |
| `apps/dashboard/src/lib/features/insights/utils/insights-utils.test.ts` | Pivot, formatters, heat and status tones, cohort health, export document |
| `insights-poller.test.ts` | Fake timers and visibility changes: no polling while hidden, one refetch on return |

**DB fixtures.** All in one test file, with a timestamp suffix for every id. Delete everything in `afterAll`. The data:

- **Orgs:** org A and org B. Org B has a course and learner with identical shape, used to prove tenant isolation.
- **Cohort and course 1:** cohort C1 with two courses, K1 and K2. K1 is grouped:
  - Section S1 holds a lesson with a tracked video and an exercise E1 (`submitted`).
  - Section S2 holds E2 (`passed`, threshold 70) and a locked exercise E3 with no submissions.
  - A standalone exercise E4 sits outside any section.
  - There is also a legacy lesson-embedded exercise E5.
- **Course 2:** K2 is ungrouped, with one `passed` exercise and no threshold, so its pass mark is 100.
- **Learners:**
  - L1: two attempts on E2 (60, then 80), so best attempt and passed.
  - L2: only `awaiting_manual` on E2.
  - L3: also in a second cohort, C2, that contains K1, to prove counting by cohort.
  - L4: in the cohort but not enrolled in K2.
  - A pending email-only cohort member.
  - A deactivated org member, who must be excluded.
- **Attendance:** rows only for L1 (present) and L2 (absent) on lesson X, and none for L3. L3 must count as absent.
- **Goals:** a goal assignment overdue for L2, one completed for L1, and an exercise `due_by` in the past for L3.
- **Logins:** events today for L1, three days ago for L2, never for L3.

**Assertions.** Each source's output must match the hand-computed values. Also add three **parity checks**:
- `learner_course.progress_pct` equals `calcCourseProgressPercent` over `getCourseProgress` for every learner-course.
- `assessment_result.is_complete` equals `getBatchCompletedExerciseIdsForMembers`.
- `is_completed` agrees with `buildCertificationEvaluation` where the deadline allows it.

**Running DB tests on a branch** without touching the shared dev DB (which follows the main checkout):

```bash
docker exec cio-postgres psql -U postgres -c "CREATE DATABASE cio_insights_test"
cd packages/db && DATABASE_URL=<dev url with /cio_insights_test> npx drizzle-kit migrate
pg_dump --data-only -t public.role -t public.submissionstatus -t public.question_type <dev url> | psql <scratch url>
DATABASE_URL=<scratch url> pnpm --filter @cio/api exec vitest run src/__tests__/insights-metrics-db.test.ts
docker exec cio-postgres psql -U postgres -c "DROP DATABASE cio_insights_test"
```

Never run `drizzle-kit migrate` from a feature branch against the shared dev database.

## 9. Performance

**Load seed.** Add `packages/db/src/scripts/seed-insights-load.ts` and register it as `db:seed:insights-load` in `packages/db/package.json`, following `seed-coursera-grading-demo.ts`. Run it only against a scratch database. It creates:
- One org with 5,000 student members and 20 cohorts of 250.
- 3 courses per cohort, drawn from 6 shared courses, each with 4 sections, about 12 lessons and 7 exercises, 2 of which are pass-required.
- Realistic submissions: 1 to 3 attempts, about 10% awaiting grade.
- Lesson completions, video progress, attendance for live lessons, goal assignments with about 5% overdue, and 30 days of login events.

**Measure** every preset widget's query, uncached, by calling `runInsightsQuery` directly in a small script, or by running `EXPLAIN (ANALYZE, BUFFERS)` on the compiled SQL. Record p50 and p95 for each widget.

**Budgets** (from the PRD): a whole cohort dashboard under 1 second warm, and every org widget within budget **uncached**, since Redis may be down.

**Indexes:** only if measurement shows a widget is over budget. The candidates are below, all currently missing according to the schema audit. Add the ones you need in one migration in the PR that needs them, and follow the `when` rule.

- `submission(exercise_id, submitted_by)`
- `question(exercise_id)`
- `question_answer(submission_id)`
- `lesson_completion(profile_id, lesson_id)`
- `groupmember(profile_id)`
- `group_attendance(course_id, lesson_id)` and `group_attendance(student_id)`
- `exercise(section_id)`, `lesson(section_id)`, `course_section(course_id)`, `cohort_course(course_id)`

`analytics_login_events(user_id, logged_in_at DESC)` already exists in the database (migration 0017), although `schema.ts` does not declare it.

**Script.** `apps/api/scripts/measure-insights.ts` times every preset widget uncached (it calls `runInsightsQuery` directly, so Redis is never read), then runs each scope's widgets **in parallel** as one dashboard load and reports that wall-clock time, which is what an admin waits for when the cache is cold or Redis is down. Set `INSIGHTS_EXPLAIN_WIDGET=<id>` to print one widget's `EXPLAIN (ANALYZE, BUFFERS)`.

```bash
DATABASE_URL=<scratch url with the load seed> INSIGHTS_BENCHMARK_RUNS=5 pnpm --filter @cio/api exec tsx scripts/measure-insights.ts
```

**PR 4 results (2026-10-23).** Load seed: 5,002 org members, 20 cohorts, 15,000 enrollments, 168,265 submissions, all migrations through 0039. Uncached, five runs:

| Scope | Whole dashboard before (p50 / p95) | After (p50 / p95) |
| --- | --- | --- |
| Org, 10 widgets in parallel | 1,113 / 1,345 ms | 846 / 906 ms |
| Cohort, 19 widgets in parallel | 164 / 1,221 ms | 91 / 149 ms |
| Course, 14 widgets in parallel | 124 / 144 ms | 78 / 84 ms |

The org widgets that read learner progress (`kpi_avg_progress`, `kpi_completions`, `cohorts_at_a_glance`, `needs_attention`, `courses_by_completion`) cost 600–1,000 ms each on their own, because every one evaluates completion for all 15,000 enrollments. `EXPLAIN` showed `member_exercise` grouping 189,000 learner × submission rows by a twelve-column key, which sorted about 38 MB on disk (`external merge`). Computing each learner × exercise's attempts in a `CROSS JOIN LATERAL` aggregate (15.6) keeps the same values per row, removes that grouped sort, and cut the CTE from about 760 ms to 440 ms. The parity tests against `getBatchCompletedExerciseIdsForMembers` still pass. No new index was needed for PR 4; the remaining cost is the canonical definition over every enrollment, which the 60-second org cache absorbs once warm.

## 10. Help Center

| PR | Articles |
| --- | --- |
| 1 | `read-your-organization-analytics-overview`, `compare-your-top-courses`, `view-top-countries-and-popular-course-types`, `analyze-landing-views-enrollments-and-completions`, `understand-the-organization-dashboard` (label only). Also the `blume.config.ts` group label "Use organization analytics" becomes "Use marketing stats" |
| 2 | New: track a cohort with analytics. Link it from the cohort articles |
| 3 | Rewrite `review-course-performance-and-learner-progress` |
| 4 | New: monitor learners across your organization. Update `roles-and-permissions` (org analytics is admin only) |

Write every article with the write-docs skill. Capture every screenshot at 1350×830, scale 1, then frame it with `pnpm --filter @cio/help frame-screenshot`. Use the seeded tenants (`admin@test.com` / `123456`), plus a cohort seeded for demos.

### Screenshot capture queue

Screenshots ship last, once the analytics UI is final. Pipeline: capture at 1350×830 with device scale 1, inspect, frame, then reference from the article. Track every shot here so none are missed. Recapture all of an article's shots after a UI pass that changes its layout, labels, or data.

**PR 2 — `analytics-and-reporting/track-a-cohort-with-analytics`**

- [x] `overview.webp` — lead. Cohort **Analytics** landing: header, five summary cards, **Learners by status**, **Needs attention, by reason**.
- [x] `learners.webp` — **Learners** card: search, four filters, sort, **Export as CSV**, table rows and scores.
- [x] `reminders.webp` — **Overdue** card: **Send reminder** on each goal row and **Remind all overdue learners**.
- [ ] Recapture all three after the final UI pass. Confirm one sidebar, no clipped labels or buttons, the **Overdue** action buttons fully visible, and re-frame each file.
- [ ] Use a multi-course, score-rich cohort so the **Course** picker and the **All courses** view are visible. The current demo cohort has one course and no graded attempts.

**Demo data for this article.** The three captures above use a local cohort, `Frontend Fundamentals — October 2026`, in the **Udemy Test** org (`admin@test.com` / `123456`). It is linked to **Modern Web Development with React**, holds all 138 course students, and has one overdue goal with six assignments. Recreate that cohort before recapturing. For a richer cohort, `pnpm --filter @cio/db db:seed:insights-load` creates **Load Cohort 1–20** (250 students and three courses each, with graded attempts, attendance, and logins). Its `admin@insights-load.demo` user has no password; sign in with `pnpm --filter @cio/db db:login-link admin@insights-load.demo`.

**PR 3 — `analytics-and-reporting/review-course-performance-and-learner-progress`**

- [ ] `overview.webp` — lead. Course **Analytics** landing: page title with the learner count and **Updated … ago**, the summary cards, and the top of **Scores by exercise, by cohort**.
- [ ] `charts.webp` — **Scores by exercise, by cohort** and **Scores by exercise** with their legends, **Score distribution** with an exercise picked in the **Exercise** menu, and **Lesson completion drop-off**.
- [ ] `learners.webp` — **Learners** card: search, the four filters, sort, **Export as CSV**, exercise columns with **Pass** tags, and **Status** and **Overdue** badges.
- [ ] `view-submissions-and-completion-data/overview.webp` — replacement lead for the inbound guide: the course **Submissions** page with one exercise selected and its grading states. The previous file showed the retired course Analytics page and is no longer referenced by that article.
- [ ] Capture all four after the final UI pass, frame each with `pnpm --filter @cio/help frame-screenshot`, and save the new course overview over the legacy `overview.webp` path (the rewrite no longer references the old file).
- [ ] Use a course with sections, exercises both with and without a pass mark, graded attempts, and at least two cohorts so the per-cohort line chart and **No cohort** group are visible. **Modern Web Development with React** in the **Udemy Test** org (`admin@test.com` / `123456`) covers the course data; link a second cohort or use **Load Cohort 1–20** for the cohort comparison.

**PR 4 — `analytics-and-reporting/monitor-learners-across-your-organization`**

The article ships without images until these are captured; add each reference beside the section named here. The **Who can open analytics** table added to `organization-and-team/roles-and-permissions` is text only and needs no capture.

- [ ] `overview.webp` — lead, after the opening paragraph. Organization **Stats → Analytics** with the sidebar item highlighted, the page title and learner count, **Updated … ago**, the four summary cards, and the top of **Cohorts at a glance**.
- [ ] `cohorts.webp` — **Compare your cohorts**. **Cohorts at a glance** with the health donut, at least three cohorts in different **Health** states, and a **No cohort** row.
- [ ] `trends.webp` — **Follow growth and logins**. **Learners added** (12 weeks, at least one flat week) and **Learners logged in per day** beside **Average score by cohort**.
- [ ] Capture all three after the final UI pass, frame each with `pnpm --filter @cio/help frame-screenshot`, and add the three image references to the article.
- [ ] Use an org with several cohorts in different states and logins on most days: `pnpm --filter @cio/db db:seed:insights-load` (**Load Cohort 1–20**) covers this. The seeded tenants have too few cohorts for the health spread.

**PR 1 / 3 articles:** add their entries to this queue when that article work starts, and check them again before the PR that owns the article merges.

## 11. Verification before each commit

```bash
export PATH="$HOME/.nvm/versions/node/v24.22.1/bin:$PATH"
pnpm --filter @cio/api^... build && pnpm --filter @cio/api build
pnpm --filter @cio/api exec vitest run
pnpm --filter @cio/utils test
(cd apps/dashboard && pnpm exec svelte-kit sync && pnpm dlx svelte-check@4 --tsconfig ./tsconfig.json --threshold error)
pnpm --filter @cio/dashboard test
pnpm format:changed && pnpm format:check
pnpm --filter @cio/ui prefix:check:changed
```

- **svelte-check** is not a dashboard dependency, hence `pnpm dlx`. It has roughly 270 errors on `main` already. Record the count before you start and make sure your changes add none.
- **Dashboard build:** `AGENTS.md` also asks for `pnpm --filter @cio/dashboard^... build && pnpm --filter @cio/dashboard build`. Run it where the machine allows. On the maintainer's laptop it runs out of heap, so rely on svelte-check plus vitest there and let CI build it.
- **Manual check, in cloud mode, as `admin@test.com`:**
  - Open each dashboard and switch courses.
  - Search, filter and sort the learners, then export.
  - Leave the tab hidden, come back, and confirm it refetches once.
  - Press Refresh twice within 15 seconds; the second press must not recompute.
  - Log in as a tutor of the cohort: the cohort page works and the org page is denied.
  - Log in as `student@test.com`: no nav items, and the API returns 403.
- **PR demo:** record a walkthrough and put it in the PR's "Demo" section. Its absence turns the PR back into a draft.

**PR 4 manual check (2026-10-23), cloud mode, Udemy Test.** Every item above passed after these fixes, all now in the code and in section 16:

- **Refresh only refreshed one widget.** The gate was per scope, so nine of ten concurrent requests came back throttled. It is now per widget spec (4.6). After the fix, the first press recomputed 10 of 10 and the second, within 15 seconds, throttled 10 of 10.
- **"Cohorts at a glance" hid its Health column** behind a horizontal scroll at 1,440 px, and "Courses in this cohort" cut off "Required pass rate". Both tables now let long names and headers wrap (16.9).
- **Denied viewers saw "0 learners" and a disabled refresh button.** The org and cohort headers now show the subtitle and actions only to viewers who can see the dashboard (16.11).

Also confirmed: Stats lists Analytics before Marketing (`org-nav-analytics`), rows link to `/cohorts/{id}/analytics`, the hiring ramp shows all 12 weeks including quiet ones, hidden-tab polling stops and refetches once on return (simulated through `document.visibilityState`, because the browser pane keeps background tabs visible), CSV export matches the filtered rows, a tutor gets 403 `INSIGHTS_SCOPE_FORBIDDEN` for the org scope and 200 for their cohort, a student gets 403 for all three scopes, responses carry `Cache-Control: private, no-store`, the page has no horizontal scroll at 375 px, and dark mode keeps contrast.

## 12. Open decisions for the PRD owner

List these in PR 2's description. The plan's default is in bold; build with the default unless told otherwise.

1. **Final exam replacement:** **pass-required exercises (3.4)**. Alternative: let authors mark one exercise as "final" again, which would need a schema change.
2. **Who counts as a learner:** **ACTIVE org members only**. Deactivated and archived members are excluded everywhere.
3. **Learners in several cohorts:** **counted in each cohort when grouped by cohort**.
4. **Thresholds** (2 days, 50%, 65%, 60%): **placeholders in `INSIGHTS_THRESHOLDS`**.
5. **Retakes:** **best graded attempt**, which matches progression, certification, the gradebook and compliance. A "latest attempt" option is Phase 2.
6. **Executive access:** **org admins only** for the org dashboard. Cohort and course dashboards are also open to their tutors.
7. **Exercise due dates in Overdue:** **included**, with a "Due date" kind label.
8. **"Today" and per-day charts:** **UTC days**, from `analytics_login_events.logged_in_date`, and logins are platform-wide. Per-org time zones would need a new setting.
9. **Hiring-ramp target:** **not shown in v1**. It needs stored settings (Phase 2).
10. **Overdue reminder subject line:** **reuse the existing template**, plus overdue subject copy if the catalog allows it.

## 13. Pre-existing issues found while planning

These are out of scope. Do not fix them in these PRs; report them separately.

- **Possible cross-tenant read:** `GET /cohort/goals/overview` (`apps/api/src/routes/cohort/cohort.ts:662`) authorizes the `cio-org-id` header org with `orgTeamMemberMiddleware`. It then loads `getOrgGoalsOverview` for the `organizationId` **query parameter**, without checking that the two match.
- `isOrgAdminByCohortId` and `isUserOrgAdmin` ignore `organizationmember.status`. The session `orgRoles` map and the course checks do not.
- Cohort goal "course completed" (`getNonComplianceCourseCompletions` in `packages/db/src/queries/cohort/goal.ts`) counts lessons only and ignores exercises, so it disagrees with course completion.
- The `score` and `pass_rate` goal types only work for compliance courses, because they read `course_completion_record.score`.
- The old course analytics, the audience user analytics and `getProfileCourseProgress` each compute average grade and exercise completion in different ways, none of which match 3.3 and 3.4. Phase 3 should move the public API and MCP onto the insights engine.
- The `/dash` marketing endpoints use `orgMemberMiddleware`, so students can read them.
- `AGENTS.md` still says Node 20; `.nvmrc` says 24.22.1.
- `apps/api` `package.json` has a malformed `test` script: `vitest NODE_ENV=test`.

## 14. Later phases (not in these PRs)

- **Phase 2:** an `insights_dashboard` table (`org_id`, `scope_type`, `definition jsonb`, schema version), CRUD, a widget editor limited to the registry, cloning presets, hiring-ramp and learning-time targets as dashboard settings, and a "latest attempt" option.
- **Phase 3:**
  - Formula metrics.
  - Scheduled digests and alerts.
  - A read-only executive role.
  - `POST /public-api/v1/insights/query`. It needs a new scope in `public-api-scopes.ts`, because the analytics regex maps reads only. `COHORT_PATH` is matched before the analytics regex, so a `/cohorts/:id/analytics` path would need `cohort:read` instead. Follow `skills/public-api-review`.
  - An MCP tool.
- **Blocked:** learning time per day and peak concurrent learners (#1299); supervisor copy on reminders (#1302).

## 15. Proposed code: db and API layers

This section is the reference implementation of sections 3 and 4. It is written against `main` at `687a11df4`, using the real helpers, import paths and column names. It has not been compiled. Build each package as you go, and treat a type error as a sign to adjust the code here, not to work around the design.

Rules the code follows, from `AGENTS.md` and `skills/writing-code/SKILL.md`:
- no comments except JSDoc contracts
- a blank line after every early return
- no `await` or multi-call expressions inside object literals
- query functions take `dbClient: DbOrTxClient = db` and log as `'<fn> error:'`
- services throw `AppError`
- each route returns one shape

### 15.1 Shared constants: `packages/utils/src/constants/insights.ts`

Also add `export * from './insights';` to `packages/utils/src/constants/index.ts`.

```ts
export const INSIGHTS_SCOPE_TYPES = ['cohort', 'course', 'org'] as const;

export const INSIGHTS_SOURCES = [
  'learner',
  'learner_course',
  'assessment_result',
  'section_activity',
  'question_result',
  'lesson_progress',
  'login_day',
  'overdue_item',
  'org_member'
] as const;

export const INSIGHTS_DIMENSIONS = [
  'learner',
  'course',
  'cohort',
  'exercise',
  'section',
  'lesson',
  'question',
  'item',
  'day',
  'week',
  'status',
  'overdue_kind',
  'progress_bucket_25',
  'score_bucket_10'
] as const;

export const INSIGHTS_METRICS = [
  'rows',
  'name',
  'email',
  'avatar_url',
  'title',
  'overall_progress_pct',
  'progress_pct',
  'avg_score_pct',
  'best_score_pct',
  'section_score_pct',
  'score_points',
  'required_pass',
  'required_total',
  'required_passed',
  'pass_mark',
  'passed',
  'attempts',
  'state',
  'is_pass_required',
  'is_graded',
  'is_attempted',
  'is_awaiting_grade',
  'is_complete',
  'is_completed',
  'is_completed_all',
  'is_certified',
  'certificates',
  'courses_total',
  'courses_completed',
  'days_to_finish',
  'enrolled_at',
  'now_at_item_id',
  'now_at_title',
  'took_all',
  'passed_all_required',
  'video_pct',
  'attendance_pct',
  'attendance',
  'last_login_at',
  'days_since_login',
  'logged_in_today',
  'logged_in_week',
  'logged_in',
  'is_overdue',
  'is_inactive',
  'is_low_score',
  'is_low_video',
  'is_at_risk',
  'status',
  'status_rank',
  'correct_pct',
  'wrong_answer',
  'kind',
  'due_at',
  'days_overdue',
  'assignment_id',
  'course_titles',
  'members_added',
  'members_total'
] as const;

export const INSIGHTS_AGGS = [
  'value',
  'count',
  'count_if',
  'sum',
  'avg',
  'median',
  'p25',
  'p75',
  'rate',
  'pooled',
  'mode',
  'running_count'
] as const;

export const INSIGHTS_FILTER_FIELDS = [
  'course',
  'cohort',
  'learner',
  'exercise',
  'section',
  'status',
  'overdue_kind',
  'avg_score_pct',
  'is_pass_required',
  'logged_in_today',
  'is_inactive',
  'is_overdue',
  'is_completed_all',
  'has_certificate'
] as const;

export const INSIGHTS_FILTER_OPS = ['eq', 'in', 'gte', 'lt', 'is_true', 'is_false'] as const;

export const INSIGHTS_VIZ_TYPES = [
  'kpi',
  'line',
  'line_band',
  'multi_line',
  'grouped_bar',
  'column',
  'histogram',
  'donut',
  'hbar',
  'table',
  'matrix'
] as const;

export const INSIGHTS_STATUSES = ['at_risk', 'lagging', 'on_track', 'completed'] as const;

export const INSIGHTS_OVERDUE_KINDS = ['goal', 'compliance', 'exercise'] as const;

export const INSIGHTS_LOGIN_WINDOWS = [7, 14, 30] as const;

export const INSIGHTS_THRESHOLDS = {
  inactiveDays: 2,
  lowScorePct: 50,
  laggingScorePct: 65,
  lowVideoPct: 60
} as const;

export const INSIGHTS_LIMITS = {
  pageSize: 25,
  maxRows: 1000,
  maxExportRows: 50_000,
  maxMeasures: 16,
  maxFilterValues: 100,
  maxSearchLength: 100,
  maxOutlineCourses: 50
} as const;

export const INSIGHTS_PLACEHOLDERS = {
  course: '$course',
  learner: '$learner',
  exercise: '$exercise'
} as const;

export type TInsightsScopeType = (typeof INSIGHTS_SCOPE_TYPES)[number];
export type TInsightsSource = (typeof INSIGHTS_SOURCES)[number];
export type TInsightsDimension = (typeof INSIGHTS_DIMENSIONS)[number];
export type TInsightsMetric = (typeof INSIGHTS_METRICS)[number];
export type TInsightsAgg = (typeof INSIGHTS_AGGS)[number];
export type TInsightsFilterField = (typeof INSIGHTS_FILTER_FIELDS)[number];
export type TInsightsFilterOp = (typeof INSIGHTS_FILTER_OPS)[number];
export type TInsightsVizType = (typeof INSIGHTS_VIZ_TYPES)[number];
export type TInsightsStatus = (typeof INSIGHTS_STATUSES)[number];
```

### 15.2 Validation: `packages/utils/src/validation/insights/`

`spec.ts`:

```ts
import * as z from 'zod';

import {
  INSIGHTS_AGGS,
  INSIGHTS_DIMENSIONS,
  INSIGHTS_FILTER_FIELDS,
  INSIGHTS_FILTER_OPS,
  INSIGHTS_LIMITS,
  INSIGHTS_LOGIN_WINDOWS,
  INSIGHTS_METRICS,
  INSIGHTS_SCOPE_TYPES,
  INSIGHTS_SOURCES
} from '../../constants/insights';

const ZInsightsFilterScalar = z.union([z.string().min(1).max(64), z.number().finite()]);

const ZInsightsFilterValues = z.array(z.string().uuid()).min(1).max(INSIGHTS_LIMITS.maxFilterValues);

function hasValueForOp(filter: { op: (typeof INSIGHTS_FILTER_OPS)[number]; value?: unknown }): boolean {
  if (filter.op === 'is_true' || filter.op === 'is_false') return filter.value === undefined;

  if (filter.op === 'in') return Array.isArray(filter.value);

  return filter.value !== undefined && !Array.isArray(filter.value);
}

export const ZInsightsScope = z.object({
  type: z.enum(INSIGHTS_SCOPE_TYPES),
  id: z.string().uuid()
});

export const ZInsightsFilter = z
  .object({
    field: z.enum(INSIGHTS_FILTER_FIELDS),
    op: z.enum(INSIGHTS_FILTER_OPS),
    value: z.union([ZInsightsFilterScalar, ZInsightsFilterValues]).optional()
  })
  .refine(hasValueForOp, { path: ['value'] });

export const ZInsightsMeasure = z.object({
  metric: z.enum(INSIGHTS_METRICS),
  agg: z.enum(INSIGHTS_AGGS)
});

export const ZInsightsSort = z.object({
  field: z
    .string()
    .regex(/^[a-z0-9_]+$/)
    .max(64),
  dir: z.enum(['asc', 'desc']).default('asc')
});

export const ZInsightsQuerySpec = z.object({
  source: z.enum(INSIGHTS_SOURCES),
  measures: z.array(ZInsightsMeasure).min(1).max(INSIGHTS_LIMITS.maxMeasures),
  dimensions: z.array(z.enum(INSIGHTS_DIMENSIONS)).max(2).default([]),
  filters: z.array(ZInsightsFilter).max(10).default([]),
  sort: z.array(ZInsightsSort).max(3).default([]),
  search: z.string().trim().max(INSIGHTS_LIMITS.maxSearchLength).optional(),
  limit: z.number().int().min(1).max(INSIGHTS_LIMITS.maxRows).default(INSIGHTS_LIMITS.pageSize),
  page: z.number().int().min(1).max(INSIGHTS_LIMITS.maxPage).default(1),
  minGroupRows: z.number().int().min(1).max(1000).optional(),
  days: z
    .number()
    .int()
    .refine((days) => (INSIGHTS_LOGIN_WINDOWS as readonly number[]).includes(days))
    .optional()
});

export const ZInsightsExportSpec = ZInsightsQuerySpec.safeExtend({
  limit: z.number().int().min(1).max(INSIGHTS_LIMITS.maxExportRows).default(INSIGHTS_LIMITS.maxExportRows)
});

export const ZInsightsQueryRequest = z.object({
  scope: ZInsightsScope,
  spec: ZInsightsQuerySpec,
  refresh: z.boolean().optional()
});

export const ZInsightsExportRequest = z.object({
  scope: ZInsightsScope,
  spec: ZInsightsExportSpec
});

export const ZInsightsDashboardParam = z.object({
  scopeType: z.enum(INSIGHTS_SCOPE_TYPES),
  scopeId: z.string().uuid()
});

export type TInsightsScope = z.infer<typeof ZInsightsScope>;
export type TInsightsFilter = z.infer<typeof ZInsightsFilter>;
export type TInsightsMeasure = z.infer<typeof ZInsightsMeasure>;
export type TInsightsQuerySpec = z.infer<typeof ZInsightsQuerySpec>;
export type TInsightsQuerySpecInput = z.input<typeof ZInsightsQuerySpec>;
export type TInsightsQueryRequest = z.infer<typeof ZInsightsQueryRequest>;
export type TInsightsExportRequest = z.infer<typeof ZInsightsExportRequest>;
export type TInsightsDashboardParam = z.infer<typeof ZInsightsDashboardParam>;
```

`dashboard.ts`:

```ts
import * as z from 'zod';

import { INSIGHTS_VIZ_TYPES } from '../../constants/insights';
import { ZInsightsQuerySpec } from './spec';

export const ZInsightsWidget = z.object({
  id: z.string().regex(/^[a-z0-9_]+$/),
  titleKey: z.string().min(1),
  descriptionKey: z.string().min(1).optional(),
  viz: z.enum(INSIGHTS_VIZ_TYPES),
  span: z.union([z.literal(4), z.literal(5), z.literal(6), z.literal(7), z.literal(8), z.literal(12)]),
  courseMode: z.enum(['all', 'single', 'any']).default('any'),
  requires: z.array(z.enum(['grouping', 'pass_required'])).default([]),
  spec: ZInsightsQuerySpec
});

export type TInsightsWidget = z.infer<typeof ZInsightsWidget>;
export type TInsightsWidgetInput = z.input<typeof ZInsightsWidget>;
```

`index.ts`:

```ts
export * from './dashboard';
export * from './spec';
```

Also add `export * from './insights';` to `packages/utils/src/validation/index.ts`.

Then add the "remind overdue" body schema to `packages/utils/src/validation/cohort/cohort.ts`, next to `ZCreateCohortGoal`:

```ts
export const ZRemindOverdueCohortGoals = z.object({
  courseId: z.string().uuid().optional()
});
export type TRemindOverdueCohortGoals = z.infer<typeof ZRemindOverdueCohortGoals>;
```

### 15.3 Error codes: `packages/utils/src/constants/error-codes.ts`

Add the insights group before `VALIDATION_ERROR`, and the reminder codes next to the other `COHORT_GOAL_*` codes:

```ts
  COHORT_GOAL_ASSIGNMENT_NOT_FOUND: 'COHORT_GOAL_ASSIGNMENT_NOT_FOUND',
  COHORT_GOAL_REMINDER_NOT_ALLOWED: 'COHORT_GOAL_REMINDER_NOT_ALLOWED',
  COHORT_GOAL_REMINDER_NO_EMAIL: 'COHORT_GOAL_REMINDER_NO_EMAIL',

  // Insights errors
  INSIGHTS_SCOPE_NOT_FOUND: 'INSIGHTS_SCOPE_NOT_FOUND',
  INSIGHTS_SCOPE_FORBIDDEN: 'INSIGHTS_SCOPE_FORBIDDEN',
  INSIGHTS_QUERY_INVALID: 'INSIGHTS_QUERY_INVALID',
  INSIGHTS_QUERY_FAILED: 'INSIGHTS_QUERY_FAILED',
  INSIGHTS_EXPORT_FAILED: 'INSIGHTS_EXPORT_FAILED',
  INSIGHTS_DASHBOARD_FAILED: 'INSIGHTS_DASHBOARD_FAILED',
```

### 15.4 Query layer types: `packages/db/src/queries/insights/types.ts`

```ts
import type { SQL } from 'drizzle-orm';

import type {
  TInsightsAgg,
  TInsightsDimension,
  TInsightsFilterField,
  TInsightsFilterOp,
  TInsightsMetric,
  TInsightsScopeType,
  TInsightsSource
} from '@cio/utils/constants/insights';

export type InsightsValueType = 'id' | 'text' | 'integer' | 'number' | 'percent' | 'boolean' | 'date' | 'datetime';

export type InsightsScopeRef = {
  orgId: string;
  type: TInsightsScopeType;
  id: string;
};

export type InsightsOrderedItem = {
  courseId: string;
  itemId: string;
  itemType: 'LESSON' | 'EXERCISE';
  itemRank: number;
  sectionId: string | null;
  sectionRank: number | null;
};

export type InsightsPushdown = {
  courseIds?: string[];
  cohortIds?: string[];
  learnerIds?: string[];
};

export type InsightsCompileContext = {
  scope: InsightsScopeRef;
  orderedItems: InsightsOrderedItem[];
  pushdown: InsightsPushdown;
  byCohort: boolean;
  loginWindowDays: number;
};

export type InsightsDimensionDefinition = {
  valueType: InsightsValueType;
  key: SQL;
  label?: SQL;
  rank?: SQL;
};

export type InsightsMetricDefinition = {
  valueType: InsightsValueType;
  value: SQL;
  denominator?: SQL;
  aggs: readonly TInsightsAgg[];
};

export type InsightsFilterDefinition =
  | { kind: 'pushdown'; target: keyof InsightsPushdown }
  | {
      kind: 'predicate';
      column: SQL;
      valueType: InsightsValueType;
      ops: readonly TInsightsFilterOp[];
      allowedValues?: readonly string[];
    };

export type InsightsSourceDefinition = {
  id: TInsightsSource;
  scopeTypes: readonly TInsightsScopeType[];
  build: (context: InsightsCompileContext) => SQL;
  dimensions: Partial<Record<TInsightsDimension, InsightsDimensionDefinition>>;
  metrics: Partial<Record<TInsightsMetric, InsightsMetricDefinition>>;
  filters: Partial<Record<TInsightsFilterField, InsightsFilterDefinition>>;
  searchColumns?: readonly SQL[];
};

export type InsightsColumn = {
  key: string;
  role: 'dimension' | 'measure';
  valueType: InsightsValueType;
};

export type InsightsCell = string | number | boolean | null;

export type InsightsRow = Record<string, InsightsCell>;

export type InsightsQueryOutput = {
  columns: InsightsColumn[];
  rows: InsightsRow[];
  total: number;
};

export type InsightsScopeCourse = {
  id: string;
  title: string;
  isGrouped: boolean;
  hasPassRequired: boolean;
};

export type InsightsScopeSummary = {
  name: string;
  learnerCount: number;
  pendingCount: number;
  courses: InsightsScopeCourse[];
};

export type InsightsExerciseMeta = {
  id: string;
  courseId: string;
  completionPolicy: string;
  passThreshold: number | null;
  isUnlocked: boolean | null;
  maxPoints: number;
};
```

### 15.5 Scope CTEs: `packages/db/src/queries/insights/scope.ts`

This file implements section 3.1. `scope_course` is the only place an org id reaches the data, and every other CTE joins through it.

```ts
import { sql, type SQL } from 'drizzle-orm';

import { ROLE } from '@cio/utils/constants';

import type { InsightsCompileContext, InsightsOrderedItem, InsightsScopeRef } from './types';

/**
 * Comma-separated uuid parameters for an `IN (...)` list. Callers must pass a non-empty array.
 */
export function uuidList(values: readonly string[]): SQL {
  return sql.join(
    values.map((value) => sql`${value}::uuid`),
    sql`, `
  );
}

function scopeTypeCourseFilter(scope: InsightsScopeRef): SQL {
  if (scope.type === 'cohort') {
    return sql`AND co.id IN (
      SELECT cc.course_id
      FROM cohort_course cc
      JOIN cohort ch ON ch.id = cc.cohort_id
      WHERE cc.cohort_id = ${scope.id} AND ch.organization_id = ${scope.orgId}
    )`;
  }

  if (scope.type === 'course') return sql`AND co.id = ${scope.id}`;

  return sql``;
}

function inactiveOrgMemberFilter(profileColumn: SQL, orgId: string): SQL {
  return sql`NOT EXISTS (
    SELECT 1
    FROM organizationmember om
    WHERE om.organization_id = ${orgId}
      AND om.profile_id = ${profileColumn}
      AND om.status <> 'ACTIVE'
  )`;
}

function scopeCourseSql(context: InsightsCompileContext): SQL {
  const { scope, pushdown } = context;
  const pushdownFilter = pushdown.courseIds?.length ? sql`AND co.id IN (${uuidList(pushdown.courseIds)})` : sql``;

  return sql`
    SELECT
      co.id AS course_id,
      co.group_id,
      co.title AS course_title,
      COALESCE((co.metadata ->> 'isContentGroupingEnabled')::boolean, true) AS is_grouped
    FROM course co
    JOIN "group" g ON g.id = co.group_id
    WHERE g.organization_id = ${scope.orgId}
      AND co.status = 'ACTIVE'
      AND co.is_template = false
      ${scopeTypeCourseFilter(scope)}
      ${pushdownFilter}`;
}

function cohortScopeLearnerSql(context: InsightsCompileContext): SQL {
  const { scope, pushdown } = context;
  const learnerFilter = pushdown.learnerIds?.length
    ? sql`AND cm.profile_id IN (${uuidList(pushdown.learnerIds)})`
    : sql``;

  return sql`
    SELECT DISTINCT cm.profile_id, ${scope.id}::uuid AS cohort_id
    FROM cohort_member cm
    JOIN cohort ch ON ch.id = cm.cohort_id AND ch.organization_id = ${scope.orgId}
    WHERE cm.cohort_id = ${scope.id}
      AND cm.role_id = ${ROLE.STUDENT}
      AND cm.profile_id IS NOT NULL
      AND ${inactiveOrgMemberFilter(sql`cm.profile_id`, scope.orgId)}
      ${learnerFilter}`;
}

function cohortScopeEnrollmentSql(): SQL {
  return sql`
    SELECT
      gm.id AS group_member_id,
      gm.profile_id,
      sc.course_id,
      sc.course_title,
      gm.created_at AS enrolled_at,
      gm.certificate_earned_at,
      sl.cohort_id
    FROM scope_course sc
    JOIN groupmember gm ON gm.group_id = sc.group_id AND gm.role_id = ${ROLE.STUDENT}
    JOIN scope_learner sl ON sl.profile_id = gm.profile_id`;
}

function cohortBridgeJoin(context: InsightsCompileContext): SQL {
  if (!context.byCohort) return sql``;

  return sql`
    LEFT JOIN LATERAL (
      SELECT cm.cohort_id
      FROM cohort_member cm
      JOIN cohort ch ON ch.id = cm.cohort_id AND ch.organization_id = ${context.scope.orgId} AND ch.status <> 'ARCHIVED'
      JOIN cohort_course cc ON cc.cohort_id = cm.cohort_id AND cc.course_id = sc.course_id
      WHERE cm.profile_id = gm.profile_id AND cm.role_id = ${ROLE.STUDENT}
    ) bridge ON true`;
}

function wideScopeEnrollmentSql(context: InsightsCompileContext): SQL {
  const { scope, pushdown, byCohort } = context;
  const cohortColumn = byCohort ? sql`bridge.cohort_id` : sql`NULL::uuid`;
  const learnerFilter = pushdown.learnerIds?.length
    ? sql`AND gm.profile_id IN (${uuidList(pushdown.learnerIds)})`
    : sql``;
  const cohortFilter =
    byCohort && pushdown.cohortIds?.length ? sql`AND bridge.cohort_id IN (${uuidList(pushdown.cohortIds)})` : sql``;

  return sql`
    SELECT
      gm.id AS group_member_id,
      gm.profile_id,
      sc.course_id,
      sc.course_title,
      gm.created_at AS enrolled_at,
      gm.certificate_earned_at,
      ${cohortColumn} AS cohort_id
    FROM scope_course sc
    JOIN groupmember gm ON gm.group_id = sc.group_id AND gm.role_id = ${ROLE.STUDENT} AND gm.profile_id IS NOT NULL
    ${cohortBridgeJoin(context)}
    WHERE ${inactiveOrgMemberFilter(sql`gm.profile_id`, scope.orgId)}
      ${learnerFilter}
      ${cohortFilter}`;
}

function orderedItemsSql(items: readonly InsightsOrderedItem[]): SQL {
  if (items.length === 0) {
    return sql`
      SELECT NULL::uuid AS course_id, NULL::uuid AS item_id, NULL::text AS item_type,
             NULL::int AS item_rank, NULL::uuid AS section_id, NULL::int AS section_rank
      WHERE false`;
  }

  const rows = items.map(
    (item) =>
      sql`(${item.courseId}::uuid, ${item.itemId}::uuid, ${item.itemType}::text, ${item.itemRank}::int, ${item.sectionId}::uuid, ${item.sectionRank}::int)`
  );

  return sql`
    SELECT * FROM (VALUES ${sql.join(rows, sql`, `)})
      AS ordered(course_id, item_id, item_type, item_rank, section_id, section_rank)`;
}

/**
 * The scope CTEs for one query: scope_course, scope_learner, scope_enrollment, scope_member and course_item.
 * Every row any source reads is reachable only through these, so the org id can never be widened by a spec.
 */
export function scopeCtes(context: InsightsCompileContext): SQL {
  const courseItem = orderedItemsSql(context.orderedItems);

  if (context.scope.type === 'cohort') {
    return sql`
      scope_course AS (${scopeCourseSql(context)}),
      scope_learner AS (${cohortScopeLearnerSql(context)}),
      scope_enrollment AS (${cohortScopeEnrollmentSql()}),
      scope_member AS (
        SELECT DISTINCT group_member_id, profile_id, course_id, course_title, enrolled_at, certificate_earned_at
        FROM scope_enrollment
      ),
      course_item AS (${courseItem})`;
  }

  return sql`
    scope_course AS (${scopeCourseSql(context)}),
    scope_enrollment AS (${wideScopeEnrollmentSql(context)}),
    scope_learner AS (SELECT DISTINCT profile_id, cohort_id FROM scope_enrollment),
    scope_member AS (
      SELECT DISTINCT group_member_id, profile_id, course_id, course_title, enrolled_at, certificate_earned_at
      FROM scope_enrollment
    ),
    course_item AS (${courseItem})`;
}

/**
 * A compile context with no filters, for summary and course-list queries.
 */
export function plainScopeContext(scope: InsightsScopeRef): InsightsCompileContext {
  return { scope, orderedItems: [], pushdown: {}, byCohort: false, loginWindowDays: 14 };
}
```

### 15.6 Metric SQL: `packages/db/src/queries/insights/fragments.ts`

This is the single implementation of every definition in sections 3.3 to 3.11. Sources only select from the `*_row` CTEs defined here. PostgreSQL does not evaluate a `SELECT` CTE that nothing references, so including all of them in every query costs nothing.

```ts
import { sql, type SQL } from 'drizzle-orm';

import { QUESTION_TYPE_IDS } from '@cio/question-types';
import { ROLE } from '@cio/utils/constants';
import { INSIGHTS_THRESHOLDS } from '@cio/utils/constants/insights';

import { submissionMeetsCompletionPolicySql } from '../course/progression';
import type { InsightsCompileContext } from './types';

function exerciseCtes(): SQL {
  const meetsCompletionPolicy = submissionMeetsCompletionPolicySql('exercise', 'submission');

  return sql`
    scope_exercise AS (
      SELECT
        exercise.id AS exercise_id,
        sc.course_id,
        exercise.title AS exercise_title,
        COALESCE(exercise.section_id, lesson.section_id) AS section_id,
        exercise.completion_policy = 'passed' AS is_pass_required,
        CASE WHEN exercise.completion_policy = 'passed' THEN COALESCE(exercise.pass_threshold, 100) END AS pass_mark,
        COALESCE(exercise.is_unlocked, true) AS is_unlocked,
        exercise.due_by,
        COALESCE((SELECT SUM(question.points) FROM question WHERE question.exercise_id = exercise.id), 0)::numeric AS max_points
      FROM exercise
      LEFT JOIN lesson ON lesson.id = exercise.lesson_id
      JOIN scope_course sc ON sc.course_id = COALESCE(exercise.course_id, lesson.course_id)
    ),
    member_exercise AS (
      SELECT
        sm.group_member_id,
        sm.profile_id,
        sm.course_id,
        sm.course_title,
        sx.exercise_id,
        sx.exercise_title,
        sx.section_id,
        sx.is_pass_required,
        sx.pass_mark,
        sx.max_points,
        sx.is_unlocked,
        sx.due_by,
        attempt.attempts,
        attempt.graded_attempts,
        attempt.best_points,
        COALESCE(attempt.is_complete, false) AS is_complete
      FROM scope_member sm
      JOIN scope_exercise sx ON sx.course_id = sm.course_id
      JOIN exercise ON exercise.id = sx.exercise_id
      CROSS JOIN LATERAL (
        SELECT
          COUNT(*)::int AS attempts,
          COUNT(*) FILTER (WHERE submission.grading_state = 'completed')::int AS graded_attempts,
          (MAX(submission.total) FILTER (WHERE submission.grading_state = 'completed'))::numeric AS best_points,
          bool_or(${meetsCompletionPolicy}) AS is_complete
        FROM submission
        WHERE submission.exercise_id = sx.exercise_id AND submission.submitted_by = sm.group_member_id
      ) attempt
    ),
    member_exercise_result AS (
      SELECT
        me.*,
        CASE WHEN me.max_points > 0 AND me.best_points IS NOT NULL
          THEN ROUND(me.best_points * 100.0 / me.max_points) END AS best_score_pct,
        CASE WHEN me.attempts = 0 THEN 'not_taken'
             WHEN me.graded_attempts = 0 THEN 'awaiting_grade'
             ELSE 'graded' END AS state,
        CASE WHEN me.is_pass_required THEN me.is_complete END AS passed
      FROM member_exercise me
    )`;
}

function lessonCtes(): SQL {
  return sql`
    scoped_lesson AS (
      SELECT
        lesson.id AS lesson_id,
        lesson.course_id,
        lesson.title AS lesson_title,
        lesson.section_id,
        (
          lesson.completion_policy = 'video_watch'
          AND EXISTS (
            SELECT 1
            FROM jsonb_array_elements(COALESCE(lesson.videos, '[]'::jsonb)) AS video
            WHERE video ->> 'type' = 'upload' AND COALESCE(video ->> 'assetId', '') <> ''
          )
        ) AS is_video_tracked
      FROM lesson
      JOIN scope_course sc ON sc.course_id = lesson.course_id
    ),
    member_lesson AS (
      SELECT
        sm.group_member_id,
        sm.profile_id,
        sm.course_id,
        lsn.lesson_id,
        lsn.lesson_title,
        lsn.section_id,
        lsn.is_video_tracked,
        COALESCE(lesson_completion.is_complete, false) AS is_complete
      FROM scope_member sm
      JOIN scoped_lesson lsn ON lsn.course_id = sm.course_id
      LEFT JOIN lesson_completion
        ON lesson_completion.lesson_id = lsn.lesson_id AND lesson_completion.profile_id = sm.profile_id
    ),
    attendance_taken AS (
      SELECT DISTINCT group_attendance.course_id, group_attendance.lesson_id
      FROM group_attendance
      JOIN scoped_lesson lsn ON lsn.lesson_id = group_attendance.lesson_id AND lsn.course_id = group_attendance.course_id
    ),
    member_attendance AS (
      SELECT
        sm.group_member_id,
        sm.course_id,
        taken.lesson_id,
        lsn.section_id,
        COALESCE(bool_or(group_attendance.is_present), false) AS is_present
      FROM scope_member sm
      JOIN attendance_taken taken ON taken.course_id = sm.course_id
      JOIN scoped_lesson lsn ON lsn.lesson_id = taken.lesson_id
      LEFT JOIN group_attendance
        ON group_attendance.course_id = taken.course_id
        AND group_attendance.lesson_id = taken.lesson_id
        AND group_attendance.student_id = sm.group_member_id
      GROUP BY sm.group_member_id, sm.course_id, taken.lesson_id, lsn.section_id
    )`;
}

function overdueCte(context: InsightsCompileContext): SQL {
  return sql`
    overdue_item AS (
      SELECT
        'goal'::text AS kind,
        cga.id AS item_id,
        cm.profile_id,
        goal.cohort_id,
        goal.title AS item_title,
        cga.due_date AS due_at,
        goal_courses.course_ids,
        cga.id AS assignment_id
      FROM cohort_goal_assignment cga
      JOIN cohort_goal goal ON goal.id = cga.goal_id AND goal.status = 'active'
      JOIN cohort ON cohort.id = goal.cohort_id AND cohort.organization_id = ${context.scope.orgId}
      JOIN cohort_member cm ON cm.id = cga.cohort_member_id AND cm.role_id = ${ROLE.STUDENT}
      JOIN scope_learner sl ON sl.profile_id = cm.profile_id AND (sl.cohort_id IS NULL OR sl.cohort_id = goal.cohort_id)
      CROSS JOIN LATERAL (
        SELECT COALESCE(array_agg(cc.course_id), '{}'::uuid[]) AS course_ids
        FROM cohort_course cc
        JOIN scope_course sc ON sc.course_id = cc.course_id
        WHERE cc.cohort_id = goal.cohort_id
          AND (jsonb_array_length(goal.course_ids) = 0 OR goal.course_ids ? cc.course_id::text)
      ) goal_courses
      WHERE cga.due_date < now()
        AND cga.status NOT IN ('completed', 'waived')
        AND cardinality(goal_courses.course_ids) > 0

      UNION ALL

      SELECT
        'compliance'::text,
        latest.id,
        latest.profile_id,
        NULL::uuid,
        sm.course_title,
        latest.due_date,
        ARRAY[latest.course_id],
        NULL::uuid
      FROM (
        SELECT DISTINCT ON (record.group_member_id) record.*
        FROM course_completion_record record
        JOIN scope_member member ON member.group_member_id = record.group_member_id
        ORDER BY record.group_member_id, record.cycle_number DESC
      ) latest
      JOIN scope_member sm ON sm.group_member_id = latest.group_member_id
      WHERE latest.due_date < now()
        AND latest.completed_at IS NULL
        AND latest.status NOT IN ('compliant', 'waived')

      UNION ALL

      SELECT
        'exercise'::text,
        mer.exercise_id,
        mer.profile_id,
        NULL::uuid,
        mer.exercise_title,
        mer.due_by AT TIME ZONE 'UTC',
        ARRAY[mer.course_id],
        NULL::uuid
      FROM member_exercise_result mer
      WHERE mer.due_by < (now() AT TIME ZONE 'UTC') AND NOT mer.is_complete
    ),
    overdue_row AS (
      SELECT
        oi.*,
        oi.kind || ':' || oi.item_id::text || ':' || oi.profile_id::text AS item_key,
        profile.fullname,
        profile.email,
        cohort.name AS cohort_name,
        GREATEST(0, CURRENT_DATE - (oi.due_at AT TIME ZONE 'UTC')::date) AS days_overdue,
        (SELECT string_agg(sc.course_title, ', ' ORDER BY sc.course_title)
         FROM scope_course sc WHERE sc.course_id = ANY (oi.course_ids)) AS course_titles
      FROM overdue_item oi
      JOIN profile ON profile.id = oi.profile_id
      LEFT JOIN cohort ON cohort.id = oi.cohort_id
    )`;
}

function courseCtes(): SQL {
  return sql`
    course_totals AS (
      SELECT
        sc.course_id,
        (SELECT COUNT(*) FROM scoped_lesson lsn WHERE lsn.course_id = sc.course_id)::int AS lessons_total,
        (SELECT COUNT(*) FROM scope_exercise sx WHERE sx.course_id = sc.course_id)::int AS exercises_total
      FROM scope_course sc
    ),
    member_lesson_totals AS (
      SELECT
        group_member_id,
        COUNT(*) FILTER (WHERE is_complete)::int AS lessons_completed,
        COUNT(*) FILTER (WHERE is_video_tracked)::int AS video_lessons,
        COUNT(*) FILTER (WHERE is_video_tracked AND is_complete)::int AS video_watched
      FROM member_lesson
      GROUP BY group_member_id
    ),
    member_exercise_totals AS (
      SELECT
        group_member_id,
        COUNT(*) FILTER (WHERE is_complete)::int AS exercises_completed,
        SUM(best_points) FILTER (WHERE state = 'graded' AND max_points > 0) AS graded_points,
        SUM(max_points) FILTER (WHERE state = 'graded' AND max_points > 0) AS graded_max_points,
        COUNT(*) FILTER (WHERE is_pass_required)::int AS required_total,
        COUNT(*) FILTER (WHERE is_pass_required AND state = 'graded')::int AS required_graded,
        COUNT(*) FILTER (WHERE is_pass_required AND passed)::int AS required_passed
      FROM member_exercise_result
      GROUP BY group_member_id
    ),
    member_attendance_totals AS (
      SELECT
        group_member_id,
        COUNT(*)::int AS attendance_lessons,
        COUNT(*) FILTER (WHERE is_present)::int AS attendance_present
      FROM member_attendance
      GROUP BY group_member_id
    ),
    learner_course_row AS (
      SELECT
        se.cohort_id,
        cohort.name AS cohort_name,
        sm.group_member_id,
        sm.profile_id,
        profile.fullname,
        profile.email,
        sm.course_id,
        sm.course_title,
        sm.enrolled_at,
        sm.certificate_earned_at,
        totals.items_total,
        totals.items_completed,
        CASE WHEN totals.items_total > 0
          THEN ROUND(totals.items_completed * 100.0 / totals.items_total) ELSE 0 END AS progress_pct,
        (
          sm.certificate_earned_at IS NOT NULL
          OR (totals.items_total > 0 AND totals.items_completed >= totals.items_total)
        ) AS is_completed,
        (
          sm.certificate_earned_at IS NOT NULL
          OR EXISTS (
            SELECT 1 FROM course_certificate_issue issue
            WHERE issue.course_id = sm.course_id AND issue.profile_id = sm.profile_id AND issue.status = 'valid'
          )
        ) AS is_certified,
        COALESCE(met.graded_points, 0) AS graded_points,
        COALESCE(met.graded_max_points, 0) AS graded_max_points,
        CASE WHEN met.graded_max_points > 0
          THEN ROUND(met.graded_points * 100.0 / met.graded_max_points) END AS avg_score_pct,
        COALESCE(met.required_total, 0) AS required_total,
        COALESCE(met.required_graded, 0) AS required_graded,
        COALESCE(met.required_passed, 0) AS required_passed,
        COALESCE(mlt.video_lessons, 0) AS video_lessons,
        COALESCE(mlt.video_watched, 0) AS video_watched,
        COALESCE(mat.attendance_lessons, 0) AS attendance_lessons,
        COALESCE(mat.attendance_present, 0) AS attendance_present,
        CASE WHEN sm.certificate_earned_at IS NOT NULL AND sm.enrolled_at IS NOT NULL
          THEN EXTRACT(EPOCH FROM sm.certificate_earned_at - sm.enrolled_at) / 86400 END AS days_to_finish,
        EXISTS (
          SELECT 1 FROM overdue_item oi
          WHERE oi.profile_id = sm.profile_id
            AND sm.course_id = ANY (oi.course_ids)
            AND (oi.cohort_id IS NULL OR se.cohort_id IS NULL OR oi.cohort_id = se.cohort_id)
        ) AS is_overdue,
        now_at.item_id AS now_at_item_id,
        now_at.title AS now_at_title
      FROM scope_enrollment se
      JOIN scope_member sm ON sm.group_member_id = se.group_member_id
      JOIN profile ON profile.id = sm.profile_id
      LEFT JOIN cohort ON cohort.id = se.cohort_id
      JOIN course_totals ct ON ct.course_id = sm.course_id
      LEFT JOIN member_lesson_totals mlt ON mlt.group_member_id = sm.group_member_id
      LEFT JOIN member_exercise_totals met ON met.group_member_id = sm.group_member_id
      LEFT JOIN member_attendance_totals mat ON mat.group_member_id = sm.group_member_id
      CROSS JOIN LATERAL (
        SELECT
          ct.lessons_total + ct.exercises_total AS items_total,
          COALESCE(mlt.lessons_completed, 0) + COALESCE(met.exercises_completed, 0) AS items_completed
      ) totals
      LEFT JOIN LATERAL (
        SELECT ci.item_id, COALESCE(ml.lesson_title, mer.exercise_title) AS title
        FROM course_item ci
        LEFT JOIN member_lesson ml
          ON ci.item_type = 'LESSON' AND ml.group_member_id = sm.group_member_id AND ml.lesson_id = ci.item_id
        LEFT JOIN member_exercise_result mer
          ON ci.item_type = 'EXERCISE' AND mer.group_member_id = sm.group_member_id AND mer.exercise_id = ci.item_id
        WHERE ci.course_id = sm.course_id AND NOT COALESCE(ml.is_complete, mer.is_complete, false)
        ORDER BY ci.item_rank
        LIMIT 1
      ) now_at ON true
    )`;
}

function learnerCtes(): SQL {
  const { inactiveDays, lowScorePct, laggingScorePct, lowVideoPct } = INSIGHTS_THRESHOLDS;

  return sql`
    learner_core AS (
      SELECT
        sl.profile_id,
        sl.cohort_id,
        COUNT(lcr.course_id)::int AS courses_total,
        COUNT(lcr.course_id) FILTER (WHERE lcr.is_completed)::int AS courses_completed,
        COUNT(lcr.course_id) FILTER (WHERE lcr.is_certified)::int AS certificates,
        COALESCE(SUM(lcr.items_total), 0) AS items_total,
        COALESCE(SUM(lcr.items_completed), 0) AS items_completed,
        COALESCE(SUM(lcr.graded_points), 0) AS graded_points,
        COALESCE(SUM(lcr.graded_max_points), 0) AS graded_max_points,
        COALESCE(SUM(lcr.video_lessons), 0) AS video_lessons,
        COALESCE(SUM(lcr.video_watched), 0) AS video_watched,
        COALESCE(SUM(lcr.attendance_lessons), 0) AS attendance_lessons,
        COALESCE(SUM(lcr.attendance_present), 0) AS attendance_present
      FROM scope_learner sl
      LEFT JOIN learner_course_row lcr
        ON lcr.profile_id = sl.profile_id AND lcr.cohort_id IS NOT DISTINCT FROM sl.cohort_id
      GROUP BY sl.profile_id, sl.cohort_id
    ),
    learner_activity AS (
      SELECT
        core.*,
        profile.fullname,
        profile.email,
        profile.avatar_url,
        cohort.name AS cohort_name,
        CASE WHEN core.items_total > 0
          THEN ROUND(core.items_completed * 100.0 / core.items_total) ELSE 0 END AS overall_progress_pct,
        CASE WHEN core.graded_max_points > 0
          THEN ROUND(core.graded_points * 100.0 / core.graded_max_points) END AS avg_score_pct,
        CASE WHEN core.video_lessons > 0
          THEN ROUND(core.video_watched * 100.0 / core.video_lessons) END AS video_pct,
        CASE WHEN core.attendance_lessons > 0
          THEN ROUND(core.attendance_present * 100.0 / core.attendance_lessons) END AS attendance_pct,
        (core.courses_total > 0 AND core.courses_completed = core.courses_total) AS is_completed_all,
        core.certificates > 0 AS has_certificate,
        login.last_login_at,
        CURRENT_DATE - login.last_login_date AS days_since_login,
        COALESCE(login.last_login_date = CURRENT_DATE, false) AS logged_in_today,
        COALESCE(login.last_login_date > CURRENT_DATE - 7, false) AS logged_in_week,
        EXISTS (
          SELECT 1 FROM overdue_item oi
          WHERE oi.profile_id = core.profile_id
            AND (oi.cohort_id IS NULL OR core.cohort_id IS NULL OR oi.cohort_id = core.cohort_id)
        ) AS is_overdue
      FROM learner_core core
      JOIN profile ON profile.id = core.profile_id
      LEFT JOIN cohort ON cohort.id = core.cohort_id
      LEFT JOIN LATERAL (
        SELECT MAX(le.logged_in_at) AS last_login_at, MAX(le.logged_in_date) AS last_login_date
        FROM analytics_login_events le
        WHERE le.user_id = core.profile_id
      ) login ON true
    ),
    learner_flagged AS (
      SELECT
        la.*,
        (la.days_since_login IS NULL OR la.days_since_login >= ${inactiveDays}) AS is_inactive,
        COALESCE(la.avg_score_pct < ${lowScorePct}, false) AS is_low_score,
        COALESCE(la.avg_score_pct < ${laggingScorePct}, false) AS is_below_lagging,
        COALESCE(la.video_pct < ${lowVideoPct}, false) AS is_low_video
      FROM learner_activity la
    ),
    learner_status AS (
      SELECT
        lf.*,
        CASE WHEN lf.is_completed_all THEN 'completed'
             WHEN lf.is_inactive OR lf.is_low_score OR lf.is_overdue THEN 'at_risk'
             WHEN lf.is_below_lagging OR lf.is_low_video THEN 'lagging'
             ELSE 'on_track' END AS status
      FROM learner_flagged lf
    ),
    learner_row AS (
      SELECT
        ls.*,
        CASE ls.status WHEN 'at_risk' THEN 0 WHEN 'lagging' THEN 1 WHEN 'on_track' THEN 2 ELSE 3 END AS status_rank,
        ls.status = 'at_risk' AS is_at_risk
      FROM learner_status ls
    )`;
}

function sectionCtes(): SQL {
  return sql`
    section_exercise AS (
      SELECT
        group_member_id,
        course_id,
        section_id,
        COUNT(*)::int AS exercises_total,
        COUNT(*) FILTER (WHERE state = 'graded')::int AS exercises_graded,
        ROUND(AVG(best_score_pct) FILTER (WHERE state = 'graded')) AS section_score_pct,
        COUNT(*) FILTER (WHERE is_pass_required)::int AS required_total,
        COUNT(*) FILTER (WHERE is_pass_required AND state = 'graded')::int AS required_graded,
        COUNT(*) FILTER (WHERE is_pass_required AND passed)::int AS required_passed
      FROM member_exercise_result
      GROUP BY group_member_id, course_id, section_id
    ),
    section_lesson AS (
      SELECT
        group_member_id,
        course_id,
        section_id,
        COUNT(*) FILTER (WHERE is_video_tracked)::int AS video_lessons,
        COUNT(*) FILTER (WHERE is_video_tracked AND is_complete)::int AS video_watched
      FROM member_lesson
      GROUP BY group_member_id, course_id, section_id
    ),
    section_attendance AS (
      SELECT
        group_member_id,
        course_id,
        section_id,
        COUNT(*)::int AS attendance_lessons,
        COUNT(*) FILTER (WHERE is_present)::int AS attendance_present
      FROM member_attendance
      GROUP BY group_member_id, course_id, section_id
    ),
    section_key AS (
      SELECT group_member_id, course_id, section_id FROM section_exercise
      UNION
      SELECT group_member_id, course_id, section_id FROM section_lesson
      UNION
      SELECT group_member_id, course_id, section_id FROM section_attendance
    ),
    section_row AS (
      SELECT
        se.cohort_id,
        cohort.name AS cohort_name,
        sm.profile_id,
        sm.course_id,
        sm.course_title,
        k.section_id,
        course_section.title AS section_title,
        (SELECT MIN(ci.section_rank) FROM course_item ci
         WHERE ci.course_id = k.course_id AND ci.section_id = k.section_id) AS section_rank,
        COALESCE(sx.exercises_total, 0) AS exercises_total,
        (COALESCE(sx.exercises_total, 0) > 0 AND sx.exercises_graded = sx.exercises_total) AS took_all,
        sx.section_score_pct,
        CASE WHEN COALESCE(sx.required_total, 0) = 0 OR sx.required_graded < sx.required_total THEN NULL
             ELSE sx.required_passed = sx.required_total END AS passed_all_required,
        CASE WHEN slx.video_lessons > 0
          THEN ROUND(slx.video_watched * 100.0 / slx.video_lessons) END AS video_pct,
        COALESCE(sa.attendance_lessons, 0) AS attendance_lessons,
        COALESCE(sa.attendance_present, 0) AS attendance_present
      FROM section_key k
      JOIN scope_member sm ON sm.group_member_id = k.group_member_id
      JOIN scope_enrollment se ON se.group_member_id = k.group_member_id
      LEFT JOIN cohort ON cohort.id = se.cohort_id
      LEFT JOIN course_section ON course_section.id = k.section_id
      LEFT JOIN section_exercise sx
        ON sx.group_member_id = k.group_member_id AND sx.section_id IS NOT DISTINCT FROM k.section_id
      LEFT JOIN section_lesson slx
        ON slx.group_member_id = k.group_member_id AND slx.section_id IS NOT DISTINCT FROM k.section_id
      LEFT JOIN section_attendance sa
        ON sa.group_member_id = k.group_member_id AND sa.section_id IS NOT DISTINCT FROM k.section_id
    )`;
}

function wrongAnswerSql(): SQL {
  return sql`CASE question.question_type_id
    WHEN ${QUESTION_TYPE_IDS.RADIO} THEN (
      SELECT o.label FROM "option" o WHERE o.id = (qa.answer_data ->> 'optionId')::bigint
    )
    WHEN ${QUESTION_TYPE_IDS.TRUE_FALSE} THEN qa.answer_data ->> 'value'
    WHEN ${QUESTION_TYPE_IDS.CHECKBOX} THEN (
      SELECT string_agg(o.label, ', ' ORDER BY o.label)
      FROM "option" o
      WHERE o.id IN (SELECT jsonb_array_elements_text(qa.answer_data -> 'optionIds')::bigint)
    )
  END`;
}

function assessmentCtes(context: InsightsCompileContext): SQL {
  return sql`
    assessment_row AS (
      SELECT
        mer.*,
        se.cohort_id,
        cohort.name AS cohort_name,
        profile.fullname,
        ci.item_rank AS exercise_rank,
        ci.section_rank
      FROM member_exercise_result mer
      JOIN scope_enrollment se ON se.group_member_id = mer.group_member_id
      JOIN profile ON profile.id = mer.profile_id
      LEFT JOIN cohort ON cohort.id = se.cohort_id
      LEFT JOIN course_item ci ON ci.item_id = mer.exercise_id
    ),
    best_submission AS (
      SELECT DISTINCT ON (submission.submitted_by, submission.exercise_id)
        submission.id AS submission_id,
        submission.submitted_by AS group_member_id,
        submission.exercise_id
      FROM submission
      JOIN scope_member sm ON sm.group_member_id = submission.submitted_by
      JOIN scope_exercise sx ON sx.exercise_id = submission.exercise_id AND sx.course_id = sm.course_id
      WHERE submission.grading_state = 'completed'
      ORDER BY submission.submitted_by, submission.exercise_id, submission.total DESC NULLS LAST, submission.created_at DESC
    ),
    question_row AS (
      SELECT
        se.cohort_id,
        cohort.name AS cohort_name,
        se.profile_id,
        se.course_id,
        se.course_title,
        bs.exercise_id,
        sx.exercise_title,
        question.id AS question_id,
        question.title AS question_title,
        COALESCE(ci.item_rank, 0) * 10000 + COALESCE(question."order", 0) AS question_rank,
        ROUND(COALESCE(qa.point, 0) * 100.0 / question.points) AS correct_pct,
        CASE WHEN COALESCE(qa.point, 0) < question.points THEN ${wrongAnswerSql()} END AS wrong_answer
      FROM best_submission bs
      JOIN scope_enrollment se ON se.group_member_id = bs.group_member_id
      JOIN scope_exercise sx ON sx.exercise_id = bs.exercise_id AND sx.course_id = se.course_id
      JOIN question ON question.exercise_id = bs.exercise_id AND question.points > 0
      LEFT JOIN question_answer qa ON qa.submission_id = bs.submission_id AND qa.question_id = question.id
      LEFT JOIN cohort ON cohort.id = se.cohort_id
      LEFT JOIN course_item ci ON ci.item_id = bs.exercise_id
    ),
    lesson_row AS (
      SELECT
        se.cohort_id,
        cohort.name AS cohort_name,
        ml.profile_id,
        ml.course_id,
        ml.lesson_id,
        ml.lesson_title,
        ci.item_rank AS lesson_rank,
        ml.is_complete
      FROM member_lesson ml
      JOIN scope_enrollment se ON se.group_member_id = ml.group_member_id
      LEFT JOIN cohort ON cohort.id = se.cohort_id
      LEFT JOIN course_item ci ON ci.item_id = ml.lesson_id
    ),
    login_day_row AS (
      SELECT
        sl.profile_id,
        sl.cohort_id,
        cohort.name AS cohort_name,
        day.day::date AS day,
        EXISTS (
          SELECT 1 FROM analytics_login_events le
          WHERE le.user_id = sl.profile_id AND le.logged_in_date = day.day::date
        ) AS logged_in
      FROM scope_learner sl
      LEFT JOIN cohort ON cohort.id = sl.cohort_id
      CROSS JOIN generate_series(CURRENT_DATE - ${context.loginWindowDays - 1}::int, CURRENT_DATE, interval '1 day') AS day(day)
    ),
    org_member_row AS (
      SELECT
        week.week_start::date AS week,
        COUNT(om.id) FILTER (WHERE om.created_at >= week.week_start)::int AS members_added,
        COUNT(om.id)::int AS members_total
      FROM generate_series(
        date_trunc('week', now()) - interval '11 weeks',
        date_trunc('week', now()),
        interval '1 week'
      ) AS week(week_start)
      LEFT JOIN organizationmember om
        ON om.organization_id = ${context.scope.orgId}
        AND om.role_id = ${ROLE.STUDENT}
        AND om.status = 'ACTIVE'
        AND om.profile_id IS NOT NULL
        AND om.created_at < week.week_start + interval '1 week'
      GROUP BY week.week_start
    )`;
}

/**
 * Every metric CTE, in dependency order. Expects the CTEs from `scopeCtes` to precede it in the same WITH clause.
 */
export function insightsMetricCtes(context: InsightsCompileContext): SQL {
  return sql.join(
    [exerciseCtes(), lessonCtes(), overdueCte(context), courseCtes(), learnerCtes(), sectionCtes(), assessmentCtes(context)],
    sql`,`
  );
}
```

Check `QUESTION_TYPE_IDS` keys against `packages/question-types/src/question-type-keys.ts` before relying on them. The ids per `schema.ts` are RADIO 1, CHECKBOX 2 and TRUE_FALSE 4.

### 15.7 Sources: `packages/db/src/queries/insights/sources/`

`helpers.ts`:

```ts
import { sql, type SQL } from 'drizzle-orm';

import type { TInsightsAgg, TInsightsFilterOp } from '@cio/utils/constants/insights';

import type {
  InsightsDimensionDefinition,
  InsightsFilterDefinition,
  InsightsMetricDefinition,
  InsightsValueType
} from '../types';

const NUMBER_AGGS = ['value', 'sum', 'avg', 'median', 'p25', 'p75'] as const satisfies readonly TInsightsAgg[];
const PERCENT_AGGS = ['value', 'avg', 'median', 'p25', 'p75'] as const satisfies readonly TInsightsAgg[];
const FLAG_AGGS = ['value', 'count_if', 'rate'] as const satisfies readonly TInsightsAgg[];
const TEXT_AGGS = ['value', 'mode'] as const satisfies readonly TInsightsAgg[];
const INTEGER_AGGS = ['value', 'sum'] as const satisfies readonly TInsightsAgg[];

export function baseColumn(name: string): SQL {
  return sql.raw(`base.${name}`);
}

export const rowsMetric: InsightsMetricDefinition = { valueType: 'integer', value: sql`1`, aggs: ['count', 'running_count'] };

export function percentMetric(column: string): InsightsMetricDefinition {
  return { valueType: 'percent', value: baseColumn(column), aggs: PERCENT_AGGS };
}

export function numberMetric(column: string): InsightsMetricDefinition {
  return { valueType: 'number', value: baseColumn(column), aggs: NUMBER_AGGS };
}

export function integerMetric(column: string): InsightsMetricDefinition {
  return { valueType: 'integer', value: baseColumn(column), aggs: INTEGER_AGGS };
}

export function flagMetric(column: string): InsightsMetricDefinition {
  return { valueType: 'boolean', value: baseColumn(column), aggs: FLAG_AGGS };
}

export function textMetric(column: string): InsightsMetricDefinition {
  return { valueType: 'text', value: baseColumn(column), aggs: TEXT_AGGS };
}

export function valueMetric(valueType: InsightsValueType, column: string): InsightsMetricDefinition {
  return { valueType, value: baseColumn(column), aggs: ['value'] };
}

export function pooledMetric(numerator: SQL, denominator: SQL): InsightsMetricDefinition {
  return { valueType: 'percent', value: numerator, denominator, aggs: ['pooled'] };
}

export function idDimension(keyColumn: string, labelColumn?: string, rankColumn?: string): InsightsDimensionDefinition {
  return {
    valueType: 'id',
    key: baseColumn(keyColumn),
    label: labelColumn ? baseColumn(labelColumn) : undefined,
    rank: rankColumn ? baseColumn(rankColumn) : undefined
  };
}

export function progressBucketDimension(column: string): InsightsDimensionDefinition {
  const value = baseColumn(column);

  return {
    valueType: 'integer',
    key: sql`CASE WHEN ${value} >= 100 THEN 4 ELSE FLOOR(${value} / 25)::int END`
  };
}

export function scoreBucketDimension(column: string): InsightsDimensionDefinition {
  const value = baseColumn(column);

  return {
    valueType: 'integer',
    key: sql`CASE WHEN ${value} IS NULL THEN NULL ELSE GREATEST(4, LEAST(9, FLOOR(${value} / 10)::int)) END`
  };
}

export function predicateFilter(
  column: string,
  valueType: InsightsValueType,
  ops: readonly TInsightsFilterOp[],
  allowedValues?: readonly string[]
): InsightsFilterDefinition {
  return { kind: 'predicate', column: baseColumn(column), valueType, ops, allowedValues };
}

export function flagFilter(column: string): InsightsFilterDefinition {
  return predicateFilter(column, 'boolean', ['is_true', 'is_false']);
}

export const scopePushdownFilters = {
  course: { kind: 'pushdown', target: 'courseIds' },
  cohort: { kind: 'pushdown', target: 'cohortIds' },
  learner: { kind: 'pushdown', target: 'learnerIds' }
} as const satisfies Record<string, InsightsFilterDefinition>;
```

`learner.ts`:

```ts
import { sql } from 'drizzle-orm';

import { INSIGHTS_STATUSES } from '@cio/utils/constants/insights';

import type { InsightsSourceDefinition } from '../types';
import {
  baseColumn,
  flagFilter,
  flagMetric,
  idDimension,
  numberMetric,
  percentMetric,
  predicateFilter,
  rowsMetric,
  scopePushdownFilters,
  scoreBucketDimension,
  textMetric,
  valueMetric
} from './helpers';

export const learnerSource: InsightsSourceDefinition = {
  id: 'learner',
  scopeTypes: ['cohort', 'course', 'org'],
  build: () => sql`SELECT * FROM learner_row`,
  dimensions: {
    learner: idDimension('profile_id', 'fullname'),
    cohort: idDimension('cohort_id', 'cohort_name'),
    status: { valueType: 'text', key: baseColumn('status'), rank: baseColumn('status_rank') },
    score_bucket_10: scoreBucketDimension('avg_score_pct')
  },
  metrics: {
    rows: rowsMetric,
    name: textMetric('fullname'),
    email: textMetric('email'),
    avatar_url: valueMetric('text', 'avatar_url'),
    overall_progress_pct: percentMetric('overall_progress_pct'),
    avg_score_pct: percentMetric('avg_score_pct'),
    video_pct: percentMetric('video_pct'),
    attendance_pct: percentMetric('attendance_pct'),
    courses_total: numberMetric('courses_total'),
    courses_completed: numberMetric('courses_completed'),
    certificates: numberMetric('certificates'),
    last_login_at: valueMetric('datetime', 'last_login_at'),
    days_since_login: numberMetric('days_since_login'),
    logged_in_today: flagMetric('logged_in_today'),
    logged_in_week: flagMetric('logged_in_week'),
    is_overdue: flagMetric('is_overdue'),
    is_inactive: flagMetric('is_inactive'),
    is_low_score: flagMetric('is_low_score'),
    is_low_video: flagMetric('is_low_video'),
    is_at_risk: flagMetric('is_at_risk'),
    is_completed_all: flagMetric('is_completed_all'),
    status: textMetric('status'),
    status_rank: numberMetric('status_rank')
  },
  filters: {
    ...scopePushdownFilters,
    status: predicateFilter('status', 'text', ['eq'], INSIGHTS_STATUSES),
    avg_score_pct: predicateFilter('avg_score_pct', 'percent', ['gte', 'lt']),
    logged_in_today: flagFilter('logged_in_today'),
    is_inactive: flagFilter('is_inactive'),
    is_overdue: flagFilter('is_overdue'),
    is_completed_all: flagFilter('is_completed_all'),
    has_certificate: flagFilter('has_certificate')
  },
  searchColumns: [baseColumn('fullname'), baseColumn('email')]
};
```

`learner-course.ts`:

```ts
import { sql } from 'drizzle-orm';

import type { InsightsSourceDefinition } from '../types';
import {
  baseColumn,
  flagFilter,
  flagMetric,
  idDimension,
  numberMetric,
  percentMetric,
  pooledMetric,
  progressBucketDimension,
  rowsMetric,
  scopePushdownFilters,
  textMetric,
  valueMetric
} from './helpers';

export const learnerCourseSource: InsightsSourceDefinition = {
  id: 'learner_course',
  scopeTypes: ['cohort', 'course', 'org'],
  build: () => sql`SELECT * FROM learner_course_row`,
  dimensions: {
    learner: idDimension('profile_id', 'fullname'),
    course: idDimension('course_id', 'course_title'),
    cohort: idDimension('cohort_id', 'cohort_name'),
    progress_bucket_25: progressBucketDimension('progress_pct')
  },
  metrics: {
    rows: rowsMetric,
    name: textMetric('fullname'),
    title: textMetric('course_title'),
    progress_pct: percentMetric('progress_pct'),
    avg_score_pct: percentMetric('avg_score_pct'),
    score_points: pooledMetric(baseColumn('graded_points'), baseColumn('graded_max_points')),
    required_pass: pooledMetric(baseColumn('required_passed'), baseColumn('required_graded')),
    required_total: numberMetric('required_total'),
    required_passed: numberMetric('required_passed'),
    is_completed: flagMetric('is_completed'),
    is_certified: flagMetric('is_certified'),
    is_overdue: flagMetric('is_overdue'),
    days_to_finish: numberMetric('days_to_finish'),
    enrolled_at: valueMetric('datetime', 'enrolled_at'),
    now_at_item_id: valueMetric('id', 'now_at_item_id'),
    now_at_title: valueMetric('text', 'now_at_title')
  },
  filters: {
    ...scopePushdownFilters,
    is_overdue: flagFilter('is_overdue')
  },
  searchColumns: [baseColumn('fullname'), baseColumn('email')]
};
```

`assessment-result.ts`:

```ts
import { sql } from 'drizzle-orm';

import type { InsightsSourceDefinition } from '../types';
import {
  baseColumn,
  flagFilter,
  flagMetric,
  idDimension,
  numberMetric,
  percentMetric,
  pooledMetric,
  predicateFilter,
  rowsMetric,
  scopePushdownFilters,
  scoreBucketDimension,
  textMetric,
  valueMetric
} from './helpers';

export const assessmentResultSource: InsightsSourceDefinition = {
  id: 'assessment_result',
  scopeTypes: ['cohort', 'course', 'org'],
  build: () => sql`
    SELECT
      assessment_row.*,
      state = 'graded' AS is_graded,
      state <> 'not_taken' AS is_attempted,
      state = 'awaiting_grade' AS is_awaiting_grade,
      CASE WHEN state = 'graded' AND max_points > 0 THEN best_points END AS graded_points,
      CASE WHEN state = 'graded' AND max_points > 0 THEN max_points END AS graded_max_points,
      CASE WHEN is_pass_required AND state = 'graded' THEN passed::int END AS required_pass_hit,
      CASE WHEN is_pass_required AND state = 'graded' THEN 1 END AS required_pass_try
    FROM assessment_row`,
  dimensions: {
    exercise: idDimension('exercise_id', 'exercise_title', 'exercise_rank'),
    learner: idDimension('profile_id', 'fullname'),
    course: idDimension('course_id', 'course_title'),
    cohort: idDimension('cohort_id', 'cohort_name'),
    section: idDimension('section_id', undefined, 'section_rank'),
    score_bucket_10: scoreBucketDimension('best_score_pct')
  },
  metrics: {
    rows: rowsMetric,
    best_score_pct: percentMetric('best_score_pct'),
    score_points: pooledMetric(baseColumn('graded_points'), baseColumn('graded_max_points')),
    required_pass: pooledMetric(baseColumn('required_pass_hit'), baseColumn('required_pass_try')),
    pass_mark: valueMetric('integer', 'pass_mark'),
    attempts: numberMetric('attempts'),
    state: textMetric('state'),
    passed: flagMetric('passed'),
    is_pass_required: flagMetric('is_pass_required'),
    is_graded: flagMetric('is_graded'),
    is_attempted: flagMetric('is_attempted'),
    is_awaiting_grade: flagMetric('is_awaiting_grade'),
    is_complete: flagMetric('is_complete')
  },
  filters: {
    ...scopePushdownFilters,
    exercise: predicateFilter('exercise_id', 'id', ['eq', 'in']),
    section: predicateFilter('section_id', 'id', ['eq']),
    is_pass_required: flagFilter('is_pass_required')
  }
};
```

`section-activity.ts`:

```ts
import { sql } from 'drizzle-orm';

import type { InsightsSourceDefinition } from '../types';
import { baseColumn, flagMetric, idDimension, percentMetric, pooledMetric, rowsMetric, scopePushdownFilters } from './helpers';

export const sectionActivitySource: InsightsSourceDefinition = {
  id: 'section_activity',
  scopeTypes: ['cohort', 'course'],
  build: () => sql`SELECT * FROM section_row`,
  dimensions: {
    section: idDimension('section_id', 'section_title', 'section_rank'),
    course: idDimension('course_id', 'course_title'),
    cohort: idDimension('cohort_id', 'cohort_name')
  },
  metrics: {
    rows: rowsMetric,
    section_score_pct: percentMetric('section_score_pct'),
    video_pct: percentMetric('video_pct'),
    attendance: pooledMetric(baseColumn('attendance_present'), baseColumn('attendance_lessons')),
    took_all: flagMetric('took_all'),
    passed_all_required: flagMetric('passed_all_required')
  },
  filters: { ...scopePushdownFilters }
};
```

`question-result.ts`, `lesson-progress.ts`, `login-day.ts`, `overdue-item.ts` and `org-member.ts`:

```ts
export const questionResultSource: InsightsSourceDefinition = {
  id: 'question_result',
  scopeTypes: ['cohort', 'course', 'org'],
  build: () => sql`SELECT * FROM question_row`,
  dimensions: {
    question: idDimension('question_id', 'question_title', 'question_rank'),
    exercise: idDimension('exercise_id', 'exercise_title'),
    course: idDimension('course_id', 'course_title'),
    cohort: idDimension('cohort_id', 'cohort_name')
  },
  metrics: {
    rows: rowsMetric,
    correct_pct: percentMetric('correct_pct'),
    wrong_answer: textMetric('wrong_answer')
  },
  filters: {
    ...scopePushdownFilters,
    exercise: predicateFilter('exercise_id', 'id', ['eq', 'in'])
  }
};

export const lessonProgressSource: InsightsSourceDefinition = {
  id: 'lesson_progress',
  scopeTypes: ['cohort', 'course'],
  build: () => sql`SELECT * FROM lesson_row`,
  dimensions: {
    lesson: idDimension('lesson_id', 'lesson_title', 'lesson_rank'),
    cohort: idDimension('cohort_id', 'cohort_name')
  },
  metrics: { rows: rowsMetric, is_complete: flagMetric('is_complete') },
  filters: { ...scopePushdownFilters }
};

export const loginDaySource: InsightsSourceDefinition = {
  id: 'login_day',
  scopeTypes: ['cohort', 'course', 'org'],
  build: () => sql`SELECT * FROM login_day_row`,
  dimensions: {
    day: { valueType: 'date', key: baseColumn('day') },
    cohort: idDimension('cohort_id', 'cohort_name')
  },
  metrics: { rows: rowsMetric, logged_in: flagMetric('logged_in') },
  filters: { ...scopePushdownFilters }
};

export const overdueItemSource: InsightsSourceDefinition = {
  id: 'overdue_item',
  scopeTypes: ['cohort', 'course', 'org'],
  build: () => sql`SELECT * FROM overdue_row`,
  dimensions: {
    item: { valueType: 'text', key: baseColumn('item_key') },
    learner: idDimension('profile_id', 'fullname'),
    cohort: idDimension('cohort_id', 'cohort_name'),
    overdue_kind: { valueType: 'text', key: baseColumn('kind') }
  },
  metrics: {
    rows: rowsMetric,
    name: textMetric('fullname'),
    email: textMetric('email'),
    kind: textMetric('kind'),
    title: textMetric('item_title'),
    course_titles: textMetric('course_titles'),
    due_at: valueMetric('datetime', 'due_at'),
    days_overdue: numberMetric('days_overdue'),
    assignment_id: valueMetric('id', 'assignment_id')
  },
  filters: {
    ...scopePushdownFilters,
    overdue_kind: predicateFilter('kind', 'text', ['eq'], ['goal', 'compliance', 'exercise'])
  },
  searchColumns: [baseColumn('fullname'), baseColumn('email')]
};

export const orgMemberSource: InsightsSourceDefinition = {
  id: 'org_member',
  scopeTypes: ['org'],
  build: () => sql`SELECT * FROM org_member_row`,
  dimensions: { week: { valueType: 'date', key: baseColumn('week') } },
  metrics: {
    members_added: integerMetric('members_added'),
    members_total: integerMetric('members_total')
  },
  filters: {}
};
```

Give each source its own file, importing from `./helpers` as the first three do.

### 15.8 Registry: `packages/db/src/queries/insights/registry.ts`

```ts
import type { TInsightsSource } from '@cio/utils/constants/insights';

import type { InsightsSourceDefinition } from './types';
import { assessmentResultSource } from './sources/assessment-result';
import { learnerSource } from './sources/learner';
import { learnerCourseSource } from './sources/learner-course';
import { lessonProgressSource } from './sources/lesson-progress';
import { loginDaySource } from './sources/login-day';
import { orgMemberSource } from './sources/org-member';
import { overdueItemSource } from './sources/overdue-item';
import { questionResultSource } from './sources/question-result';
import { sectionActivitySource } from './sources/section-activity';

export const INSIGHTS_REGISTRY: Record<TInsightsSource, InsightsSourceDefinition> = {
  learner: learnerSource,
  learner_course: learnerCourseSource,
  assessment_result: assessmentResultSource,
  section_activity: sectionActivitySource,
  question_result: questionResultSource,
  lesson_progress: lessonProgressSource,
  login_day: loginDaySource,
  overdue_item: overdueItemSource,
  org_member: orgMemberSource
};
```

Using `Record<TInsightsSource, …>` means TypeScript fails the build if a source in the shared constants has no definition.

### 15.9 Compiler: `packages/db/src/queries/insights/compile.ts`

```ts
import { sql, type SQL } from 'drizzle-orm';

import {
  INSIGHTS_LIMITS,
  type TInsightsAgg,
  type TInsightsDimension,
  type TInsightsMetric
} from '@cio/utils/constants/insights';
import type { TInsightsFilter, TInsightsMeasure, TInsightsQuerySpec } from '@cio/utils/validation/insights';

import { OperationalQueryError } from '../query-errors';
import { insightsMetricCtes } from './fragments';
import { INSIGHTS_REGISTRY } from './registry';
import { scopeCtes } from './scope';
import type {
  InsightsColumn,
  InsightsCompileContext,
  InsightsDimensionDefinition,
  InsightsFilterDefinition,
  InsightsMetricDefinition,
  InsightsOrderedItem,
  InsightsPushdown,
  InsightsScopeRef,
  InsightsSourceDefinition,
  InsightsValueType
} from './types';

const OUTLINE_DIMENSIONS: ReadonlySet<TInsightsDimension> = new Set(['exercise', 'section', 'lesson', 'question']);
const OUTLINE_METRICS: ReadonlySet<TInsightsMetric> = new Set(['now_at_item_id', 'now_at_title']);
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DEFAULT_LOGIN_WINDOW_DAYS = 14;

type CompiledDimension = {
  id: TInsightsDimension;
  definition: InsightsDimensionDefinition;
  select: SQL[];
  groupBy: SQL[];
  columns: InsightsColumn[];
  orderBy: SQL;
};

type CompiledMeasure = {
  alias: string;
  select: SQL;
  column: InsightsColumn;
};

export type CompiledInsightsQuery = {
  query: SQL;
  columns: InsightsColumn[];
};

function invalidSpec(message: string): OperationalQueryError {
  return new OperationalQueryError(message, 'INSIGHTS_QUERY_INVALID', 400);
}

function alias(name: string): SQL {
  return sql.identifier(name);
}

function outputValue(valueType: InsightsValueType, expression: SQL): SQL {
  if (valueType === 'date' || valueType === 'datetime') return sql`(to_json(${expression}) #>> '{}')`;

  if (valueType === 'integer') return sql`(${expression})::int`;

  if (valueType === 'number' || valueType === 'percent') return sql`(${expression})::float8`;

  return expression;
}

function aggregateSql(agg: TInsightsAgg, metric: InsightsMetricDefinition, firstDimensionKey: SQL | null): SQL {
  const value = metric.value;

  switch (agg) {
    case 'value':
      return sql`(array_agg(${value}))[1]`;
    case 'count':
      return sql`COUNT(*)`;
    case 'count_if':
      return sql`COUNT(*) FILTER (WHERE ${value})`;
    case 'sum':
      return sql`SUM(${value})`;
    case 'avg':
      return sql`ROUND(AVG(${value})::numeric, 1)`;
    case 'median':
      return sql`percentile_cont(0.5) WITHIN GROUP (ORDER BY ${value})`;
    case 'p25':
      return sql`percentile_cont(0.25) WITHIN GROUP (ORDER BY ${value})`;
    case 'p75':
      return sql`percentile_cont(0.75) WITHIN GROUP (ORDER BY ${value})`;
    case 'rate':
      return sql`ROUND(AVG(CASE WHEN ${value} THEN 100.0 WHEN ${value} IS NOT NULL THEN 0 END), 1)`;
    case 'pooled':
      return sql`ROUND(SUM(${value}) * 100.0 / NULLIF(SUM(${metric.denominator}), 0), 1)`;
    case 'mode':
      return sql`mode() WITHIN GROUP (ORDER BY ${value})`;
    case 'running_count':
      if (!firstDimensionKey) throw invalidSpec('running_count needs one dimension');

      return sql`SUM(COUNT(*)) OVER (ORDER BY ${firstDimensionKey})`;
  }
}

function aggregateValueType(agg: TInsightsAgg, metric: InsightsMetricDefinition): InsightsValueType {
  if (agg === 'count' || agg === 'count_if' || agg === 'running_count') return 'integer';

  if (agg === 'rate' || agg === 'pooled') return 'percent';

  return metric.valueType;
}

function compileDimension(source: InsightsSourceDefinition, id: TInsightsDimension): CompiledDimension {
  const definition = source.dimensions[id];
  if (!definition) throw invalidSpec(`Dimension ${id} is not available on ${source.id}`);

  const select = [sql`${outputValue(definition.valueType, definition.key)} AS ${alias(`${id}_id`)}`];
  const groupBy = [definition.key];
  const columns: InsightsColumn[] = [{ key: `${id}_id`, role: 'dimension', valueType: definition.valueType }];

  if (definition.label) {
    select.push(sql`${definition.label} AS ${alias(`${id}_label`)}`);
    groupBy.push(definition.label);
    columns.push({ key: `${id}_label`, role: 'dimension', valueType: 'text' });
  }

  if (definition.rank) {
    select.push(sql`(${definition.rank})::int AS ${alias(`${id}_rank`)}`);
    groupBy.push(definition.rank);
    columns.push({ key: `${id}_rank`, role: 'dimension', valueType: 'integer' });
  }

  const orderBy = definition.rank ?? definition.label ?? definition.key;

  return { id, definition, select, groupBy, columns, orderBy };
}

function compileMeasure(
  source: InsightsSourceDefinition,
  measure: TInsightsMeasure,
  firstDimensionKey: SQL | null
): CompiledMeasure {
  const metric = source.metrics[measure.metric];
  if (!metric) throw invalidSpec(`Metric ${measure.metric} is not available on ${source.id}`);

  if (!metric.aggs.includes(measure.agg)) throw invalidSpec(`Metric ${measure.metric} does not support ${measure.agg}`);

  const measureAlias = `${measure.metric}__${measure.agg}`;
  const valueType = aggregateValueType(measure.agg, metric);
  const aggregate = aggregateSql(measure.agg, metric, firstDimensionKey);

  return {
    alias: measureAlias,
    select: sql`${outputValue(valueType, aggregate)} AS ${alias(measureAlias)}`,
    column: { key: measureAlias, role: 'measure', valueType }
  };
}

function assertFilterValue(definition: InsightsFilterDefinition, filter: TInsightsFilter): void {
  const values = Array.isArray(filter.value) ? filter.value : [filter.value];
  const isIdFilter = definition.kind === 'pushdown' || definition.valueType === 'id';

  if (isIdFilter && values.some((value) => typeof value !== 'string' || !UUID_PATTERN.test(value))) {
    throw invalidSpec(`Filter ${filter.field} needs uuid values`);
  }

  if (definition.kind === 'predicate' && definition.allowedValues) {
    const allowed = definition.allowedValues;
    if (values.some((value) => typeof value !== 'string' || !allowed.includes(value))) {
      throw invalidSpec(`Filter ${filter.field} has an unsupported value`);
    }
  }
}

function collectPushdown(source: InsightsSourceDefinition, filters: TInsightsFilter[]): InsightsPushdown {
  const pushdown: InsightsPushdown = {};

  for (const filter of filters) {
    const definition = source.filters[filter.field];
    if (!definition || definition.kind !== 'pushdown') continue;

    if (filter.op !== 'eq' && filter.op !== 'in') throw invalidSpec(`Filter ${filter.field} only supports eq and in`);

    assertFilterValue(definition, filter);
    const values = Array.isArray(filter.value) ? filter.value : [String(filter.value)];
    pushdown[definition.target] = values;
  }

  return pushdown;
}

function predicateSql(definition: Extract<InsightsFilterDefinition, { kind: 'predicate' }>, filter: TInsightsFilter): SQL {
  const column = definition.column;

  switch (filter.op) {
    case 'eq':
      return sql`${column} = ${filter.value}`;
    case 'in':
      return sql`${column} IN (${sql.join(
        (filter.value as string[]).map((value) => sql`${value}`),
        sql`, `
      )})`;
    case 'gte':
      return sql`${column} >= ${filter.value}`;
    case 'lt':
      return sql`${column} < ${filter.value}`;
    case 'is_true':
      return sql`${column} IS TRUE`;
    case 'is_false':
      return sql`${column} IS NOT TRUE`;
  }
}

function compilePredicates(source: InsightsSourceDefinition, spec: TInsightsQuerySpec): SQL[] {
  const predicates: SQL[] = [];

  for (const filter of spec.filters) {
    const definition = source.filters[filter.field];
    if (!definition) throw invalidSpec(`Filter ${filter.field} is not available on ${source.id}`);

    if (definition.kind === 'pushdown') continue;

    if (!definition.ops.includes(filter.op)) throw invalidSpec(`Filter ${filter.field} does not support ${filter.op}`);

    assertFilterValue(definition, filter);
    predicates.push(predicateSql(definition, filter));
  }

  const search = spec.search?.trim();
  if (search && source.searchColumns?.length) {
    const pattern = `%${search.replace(/[\\%_]/g, (character) => `\\${character}`)}%`;
    predicates.push(sql`concat_ws(' ', ${sql.join([...source.searchColumns], sql`, `)}) ILIKE ${pattern} ESCAPE '\\'`);
  }

  return predicates;
}

function compileOrderBy(spec: TInsightsQuerySpec, dimensions: CompiledDimension[], measures: CompiledMeasure[]): SQL[] {
  const dimensionsById = new Map(dimensions.map((dimension) => [dimension.id as string, dimension]));
  const measureAliases = new Set(measures.map((measure) => measure.alias));
  const orderBy: SQL[] = [];

  for (const sort of spec.sort) {
    const direction = sort.dir === 'desc' ? sql`DESC` : sql`ASC`;
    const dimension = dimensionsById.get(sort.field);

    if (dimension) {
      orderBy.push(sql`${dimension.orderBy} ${direction} NULLS LAST`);
      continue;
    }

    if (!measureAliases.has(sort.field)) throw invalidSpec(`Cannot sort by ${sort.field}`);

    orderBy.push(sql`${alias(sort.field)} ${direction} NULLS LAST`);
  }

  for (const dimension of dimensions) {
    orderBy.push(sql`${dimension.orderBy} ASC NULLS LAST`, sql`${dimension.definition.key} ASC NULLS LAST`);
  }

  return orderBy;
}

/**
 * True when the spec needs course outline ranks, which the service must load and pass in as `orderedItems`.
 */
export function requiresOrderedItems(spec: Pick<TInsightsQuerySpec, 'dimensions' | 'measures'>): boolean {
  const hasOutlineDimension = spec.dimensions.some((dimension) => OUTLINE_DIMENSIONS.has(dimension));
  const hasOutlineMetric = spec.measures.some((measure) => OUTLINE_METRICS.has(measure.metric));

  return hasOutlineDimension || hasOutlineMetric;
}

/**
 * Compiles a validated spec into one parameterized query. Throws `OperationalQueryError` (400) for anything the
 * registry does not allow. Every value is a bound parameter; identifiers only ever come from the registry.
 */
export function compileInsightsQuery(
  spec: TInsightsQuerySpec,
  input: { scope: InsightsScopeRef; orderedItems: InsightsOrderedItem[] }
): CompiledInsightsQuery {
  const source = INSIGHTS_REGISTRY[spec.source];
  if (!source.scopeTypes.includes(input.scope.type)) {
    throw invalidSpec(`Source ${spec.source} is not available for ${input.scope.type} scope`);
  }

  const pushdown = collectPushdown(source, spec.filters);
  const byCohort = spec.dimensions.includes('cohort') || Boolean(pushdown.cohortIds);
  const context: InsightsCompileContext = {
    scope: input.scope,
    orderedItems: input.orderedItems,
    pushdown,
    byCohort,
    loginWindowDays: spec.days ?? DEFAULT_LOGIN_WINDOW_DAYS
  };

  const dimensions = spec.dimensions.map((dimensionId) => compileDimension(source, dimensionId));
  const firstDimensionKey = dimensions[0]?.definition.key ?? null;
  const measures = spec.measures.map((measure) => compileMeasure(source, measure, firstDimensionKey));
  const predicates = compilePredicates(source, spec);
  const orderBy = compileOrderBy(spec, dimensions, measures);
  const limit = Math.min(spec.limit, INSIGHTS_LIMITS.maxExportRows);

  const selectList = [
    ...dimensions.flatMap((dimension) => dimension.select),
    ...measures.map((measure) => measure.select),
    sql`COUNT(*) OVER ()::int AS __total`
  ];
  const whereClause = predicates.length ? sql`WHERE ${sql.join(predicates, sql` AND `)}` : sql``;
  const groupByClause = dimensions.length
    ? sql`GROUP BY ${sql.join(dimensions.flatMap((dimension) => dimension.groupBy), sql`, `)}`
    : sql``;
  const havingClause = dimensions.length && spec.minGroupRows ? sql`HAVING COUNT(*) >= ${spec.minGroupRows}` : sql``;
  const orderByClause = orderBy.length ? sql`ORDER BY ${sql.join(orderBy, sql`, `)}` : sql``;

  const query = sql`
    WITH
      ${scopeCtes(context)},
      ${insightsMetricCtes(context)},
      base AS (${source.build(context)})
    SELECT ${sql.join(selectList, sql`, `)}
    FROM base
    ${whereClause}
    ${groupByClause}
    ${havingClause}
    ${orderByClause}
    LIMIT ${limit} OFFSET ${(spec.page - 1) * limit}`;

  const dimensionColumns = dimensions.flatMap((dimension) => dimension.columns);
  const measureColumns = measures.map((measure) => measure.column);

  return { query, columns: [...dimensionColumns, ...measureColumns] };
}
```

### 15.10 Running, summary and structure queries

`run.ts`:

```ts
import { db, type DbOrTxClient } from '@db/drizzle';
import type { TInsightsQuerySpec } from '@cio/utils/validation/insights';

import { OperationalQueryError } from '../query-errors';
import { compileInsightsQuery } from './compile';
import type { InsightsOrderedItem, InsightsQueryOutput, InsightsRow, InsightsScopeRef } from './types';

const TOTAL_COLUMN = '__total';

function withoutTotal(row: Record<string, unknown>): InsightsRow {
  return Object.fromEntries(Object.entries(row).filter(([key]) => key !== TOTAL_COLUMN)) as InsightsRow;
}

/**
 * Runs one insights spec. `total` is the number of grouped rows before limit and page, or 0 when the page is empty.
 */
export async function runInsightsQuery(
  spec: TInsightsQuerySpec,
  input: { scope: InsightsScopeRef; orderedItems: InsightsOrderedItem[] },
  dbClient: DbOrTxClient = db
): Promise<InsightsQueryOutput> {
  try {
    const { query, columns } = compileInsightsQuery(spec, input);
    const result = await dbClient.execute(query);
    const rows = Array.from(result) as Array<Record<string, unknown>>;
    const total = Number(rows[0]?.[TOTAL_COLUMN] ?? 0);

    return { columns, rows: rows.map(withoutTotal), total };
  } catch (error) {
    if (error instanceof OperationalQueryError) throw error;

    console.error('runInsightsQuery error:', error);
    throw new Error(`Failed to run insights query: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
```

`summary.ts`:

```ts
import { sql, type SQL } from 'drizzle-orm';

import { ROLE } from '@cio/utils/constants';
import { db, type DbOrTxClient } from '@db/drizzle';

import { plainScopeContext, scopeCtes } from './scope';
import type { InsightsScopeCourse, InsightsScopeRef, InsightsScopeSummary } from './types';

function scopeNameSql(scope: InsightsScopeRef): SQL {
  if (scope.type === 'cohort') return sql`(SELECT name FROM cohort WHERE id = ${scope.id})`;

  if (scope.type === 'course') return sql`(SELECT title FROM course WHERE id = ${scope.id})`;

  return sql`(SELECT name FROM organization WHERE id = ${scope.orgId})`;
}

function pendingCountSql(scope: InsightsScopeRef): SQL {
  if (scope.type !== 'cohort') return sql`0`;

  return sql`(
    SELECT COUNT(*) FROM cohort_member
    WHERE cohort_id = ${scope.id} AND role_id = ${ROLE.STUDENT} AND profile_id IS NULL
  )`;
}

/**
 * Name, learner counts and in-scope courses for a dashboard header. The caller must authorize the scope first.
 */
export async function getInsightsScopeSummary(
  scope: InsightsScopeRef,
  dbClient: DbOrTxClient = db
): Promise<InsightsScopeSummary> {
  try {
    const result = await dbClient.execute(sql`
      WITH ${scopeCtes(plainScopeContext(scope))}
      SELECT
        COALESCE(${scopeNameSql(scope)}, '') AS name,
        (SELECT COUNT(DISTINCT profile_id) FROM scope_learner)::int AS learner_count,
        ${pendingCountSql(scope)}::int AS pending_count,
        COALESCE((
          SELECT json_agg(json_build_object(
            'id', sc.course_id,
            'title', sc.course_title,
            'isGrouped', sc.is_grouped,
            'hasPassRequired', EXISTS (
              SELECT 1 FROM exercise
              LEFT JOIN lesson ON lesson.id = exercise.lesson_id
              WHERE COALESCE(exercise.course_id, lesson.course_id) = sc.course_id
                AND exercise.completion_policy = 'passed'
            )
          ) ORDER BY sc.course_title)
          FROM scope_course sc
        ), '[]'::json) AS courses`);
    const [row] = Array.from(result) as Array<{
      name: string;
      learner_count: number;
      pending_count: number;
      courses: InsightsScopeCourse[];
    }>;

    return {
      name: row?.name ?? '',
      learnerCount: row?.learner_count ?? 0,
      pendingCount: row?.pending_count ?? 0,
      courses: row?.courses ?? []
    };
  } catch (error) {
    console.error('getInsightsScopeSummary error:', error);
    throw new Error(`Failed to load insights scope: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Ids of the active, non-template courses an authorized scope covers.
 */
export async function listInsightsScopeCourseIds(scope: InsightsScopeRef, dbClient: DbOrTxClient = db): Promise<string[]> {
  try {
    const result = await dbClient.execute(sql`
      WITH ${scopeCtes(plainScopeContext(scope))}
      SELECT course_id FROM scope_course`);

    return (Array.from(result) as Array<{ course_id: string }>).map((row) => row.course_id);
  } catch (error) {
    console.error('listInsightsScopeCourseIds error:', error);
    throw new Error(`Failed to list insights scope courses: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
```

`structure.ts`:

```ts
import * as schema from '@db/schema';
import { eq, inArray, or, sql } from 'drizzle-orm';

import { db, type DbOrTxClient } from '@db/drizzle';

import type { InsightsExerciseMeta } from './types';

/**
 * Pass rules, lock state and max points for every exercise in the given courses, including legacy lesson-embedded ones.
 */
export async function getInsightsExerciseMeta(
  courseIds: string[],
  dbClient: DbOrTxClient = db
): Promise<InsightsExerciseMeta[]> {
  if (courseIds.length === 0) return [];

  try {
    return await dbClient
      .select({
        id: schema.exercise.id,
        courseId: sql<string>`COALESCE(${schema.exercise.courseId}, ${schema.lesson.courseId})`,
        completionPolicy: schema.exercise.completionPolicy,
        passThreshold: schema.exercise.passThreshold,
        isUnlocked: schema.exercise.isUnlocked,
        maxPoints: sql<number>`COALESCE(SUM(${schema.question.points}), 0)::float8`
      })
      .from(schema.exercise)
      .leftJoin(schema.lesson, eq(schema.exercise.lessonId, schema.lesson.id))
      .leftJoin(schema.question, eq(schema.question.exerciseId, schema.exercise.id))
      .where(or(inArray(schema.exercise.courseId, courseIds), inArray(schema.lesson.courseId, courseIds)))
      .groupBy(schema.exercise.id, schema.lesson.courseId);
  } catch (error) {
    console.error('getInsightsExerciseMeta error:', error);
    throw new Error(`Failed to load exercise metadata: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
```

`index.ts`:

```ts
export * from './compile';
export * from './registry';
export * from './run';
export * from './structure';
export * from './summary';
export * from './types';
```

### 15.11 Reminder contexts: `packages/db/src/queries/cohort/goal.ts`

Replace `listAssignmentsForReminderScan` with a shared builder, and add the two lookups the "Send reminder now" routes need.

The email falls back to `profile.email`. Members added by profile id get `cohort_member.email = NULL` (`apps/api/src/services/cohort/cohort.ts:352-388`), so the current scan silently skips them. Say so in the PR, because the nightly scan will now reach those learners too.

```ts
import { and, asc, eq, inArray, lt, notInArray, sql, type SQL } from 'drizzle-orm';

export const COHORT_GOAL_OPEN_ASSIGNMENT_STATUSES = ['not_started', 'in_progress', 'at_risk', 'overdue'] as const;
export const COHORT_GOAL_CLOSED_ASSIGNMENT_STATUSES = ['completed', 'waived'] as const;
export const COHORT_GOAL_MAX_BULK_REMINDERS = 500;

export type CohortGoalReminderContext = {
  assignment: TCohortGoalAssignment;
  goal: TCohortGoal;
  profileId: string;
  email: string | null;
  cohortId: string;
  cohortName: string;
  organizationId: string;
  organizationName: string;
  organizationSiteName: string | null;
  organizationCustomDomain: string | null;
  organizationIsCustomDomainVerified: boolean | null;
  organizationAvatarUrl: string | null;
  organizationTheme: string | null;
};

function selectReminderContexts(dbClient: DbOrTxClient, where: SQL | undefined) {
  return dbClient
    .select({
      assignment: schema.cohortGoalAssignment,
      goal: schema.cohortGoal,
      profileId: schema.cohortMember.profileId,
      email: sql<string | null>`COALESCE(${schema.profile.email}, ${schema.cohortMember.email})`,
      cohortId: schema.cohort.id,
      cohortName: schema.cohort.name,
      organizationId: schema.organization.id,
      organizationName: schema.organization.name,
      organizationSiteName: schema.organization.siteName,
      organizationCustomDomain: schema.organization.customDomain,
      organizationIsCustomDomainVerified: schema.organization.isCustomDomainVerified,
      organizationAvatarUrl: schema.organization.avatarUrl,
      organizationTheme: schema.organization.theme
    })
    .from(schema.cohortGoalAssignment)
    .innerJoin(schema.cohortMember, eq(schema.cohortGoalAssignment.cohortMemberId, schema.cohortMember.id))
    .innerJoin(schema.cohortGoal, eq(schema.cohortGoalAssignment.goalId, schema.cohortGoal.id))
    .innerJoin(schema.cohort, eq(schema.cohortGoal.cohortId, schema.cohort.id))
    .innerJoin(schema.organization, eq(schema.cohort.organizationId, schema.organization.id))
    .leftJoin(schema.profile, eq(schema.cohortMember.profileId, schema.profile.id))
    .where(where);
}

type ReminderContextRow = Awaited<ReturnType<typeof selectReminderContexts>>[number];

function toReminderContexts(rows: ReminderContextRow[]): CohortGoalReminderContext[] {
  return rows.flatMap((row) => (row.profileId ? [{ ...row, profileId: row.profileId }] : []));
}

/**
 * Every open assignment on an active goal. The scan decides which ones are due a reminder today.
 */
export async function listAssignmentsForReminderScan(dbClient: DbOrTxClient = db): Promise<CohortGoalReminderContext[]> {
  try {
    const rows = await selectReminderContexts(
      dbClient,
      and(
        eq(schema.cohortGoal.status, 'active'),
        inArray(schema.cohortGoalAssignment.status, [...COHORT_GOAL_OPEN_ASSIGNMENT_STATUSES])
      )
    );

    return toReminderContexts(rows);
  } catch (error) {
    console.error('listAssignmentsForReminderScan error:', error);
    throw new Error(`Failed to list assignments for reminder scan: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * One assignment with everything a reminder email needs, or null when it is not in the cohort.
 */
export async function getAssignmentReminderContext(
  cohortId: string,
  assignmentId: string,
  dbClient: DbOrTxClient = db
): Promise<CohortGoalReminderContext | null> {
  try {
    const rows = await selectReminderContexts(
      dbClient,
      and(eq(schema.cohortGoalAssignment.id, assignmentId), eq(schema.cohortGoal.cohortId, cohortId))
    ).limit(1);

    return toReminderContexts(rows)[0] ?? null;
  } catch (error) {
    console.error('getAssignmentReminderContext error:', error);
    throw new Error(`Failed to load goal assignment: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Overdue, still-open assignments on the cohort's active goals, oldest due date first, optionally limited to goals
 * that cover one course.
 */
export async function listOverdueAssignmentReminderContexts(
  cohortId: string,
  courseId: string | undefined,
  dbClient: DbOrTxClient = db
): Promise<CohortGoalReminderContext[]> {
  const courseCondition = courseId
    ? sql`(jsonb_array_length(${schema.cohortGoal.courseIds}) = 0 OR ${schema.cohortGoal.courseIds} ? ${courseId})`
    : undefined;

  try {
    const rows = await selectReminderContexts(
      dbClient,
      and(
        eq(schema.cohortGoal.cohortId, cohortId),
        eq(schema.cohortGoal.status, 'active'),
        lt(schema.cohortGoalAssignment.dueDate, sql`now()`),
        notInArray(schema.cohortGoalAssignment.status, [...COHORT_GOAL_CLOSED_ASSIGNMENT_STATUSES]),
        courseCondition
      )
    )
      .orderBy(asc(schema.cohortGoalAssignment.dueDate))
      .limit(COHORT_GOAL_MAX_BULK_REMINDERS);

    return toReminderContexts(rows);
  } catch (error) {
    console.error('listOverdueAssignmentReminderContexts error:', error);
    throw new Error(`Failed to list overdue assignments: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
```

Drizzle's `.where()` returns a builder that still accepts `.orderBy()` and `.limit()`. If the inferred row type grows too awkward, return the joined query without `.where()` from the builder and apply `.where()` at each call site.

### 15.12 Cache helpers: `packages/core/src/utils/redis/insights-cache.ts`

This file sits in core, next to `org-stats-cache.ts`, so that `packages/core` services can invalidate entries after they commit.

```ts
import { env } from '../../config/env';
import { getCourseOrganizationId } from '@cio/db/queries/tag';
import type { TInsightsScopeType } from '@cio/utils/constants/insights';
import { logRedisUnavailableOnce, redis } from './redis';

export const INSIGHTS_TTL_SECONDS = { scope: 30, org: 60, structure: 600 } as const;

export const INSIGHTS_REFRESH_COOLDOWN_SECONDS = 15;

export type InsightsCacheSection = 'query' | 'dashboard' | 'structure';

export function insightsKey(
  section: InsightsCacheSection,
  orgId: string,
  scopeType: TInsightsScopeType,
  scopeId: string,
  specHash?: string
): string {
  const parts = ['insights', section, orgId, scopeType, scopeId];
  if (specHash) parts.push(specHash);

  return parts.join(':');
}

export function insightsStructureKey(orgId: string, courseId: string): string {
  return insightsKey('structure', orgId, 'course', courseId);
}

export function insightsTtlSeconds(scopeType: TInsightsScopeType): number {
  return scopeType === 'org' ? INSIGHTS_TTL_SECONDS.org : INSIGHTS_TTL_SECONDS.scope;
}

/**
 * Claims the refresh slot for one user, scope and widget spec. True when this caller may recompute now. Fails open
 * without Redis.
 */
export async function claimInsightsRefresh(
  profileId: string,
  scopeType: TInsightsScopeType,
  scopeId: string,
  specHash: string
): Promise<boolean> {
  if (!env.REDIS_URL) return true;

  try {
    const claimed = await redis.set(`insights:refresh:${profileId}:${scopeType}:${scopeId}:${specHash}`, '1', {
      NX: true,
      EX: INSIGHTS_REFRESH_COOLDOWN_SECONDS
    });

    return claimed === 'OK';
  } catch (error) {
    logRedisUnavailableOnce('Redis refresh gate failed for insights, allowing refresh', error);
    return true;
  }
}

/**
 * Drops a course's cached outline and pass rules. Call after the change commits. Never throws.
 */
export async function invalidateInsightsCourseStructure(courseId: string): Promise<void> {
  if (!env.REDIS_URL) return;

  try {
    const orgId = await getCourseOrganizationId(courseId);
    if (!orgId) return;

    await redis.del(insightsStructureKey(orgId, courseId));
  } catch (error) {
    logRedisUnavailableOnce('Redis invalidate failed for insights structure, continuing', error);
  }
}
```

### 15.13 `cachedRead` with refresh: `apps/api/src/utils/redis/cached-read.ts`

Callers that pass no fourth argument behave exactly as they do today.

```ts
import { env } from '@cio/core/config/env';
import { logRedisUnavailableOnce, redis } from '@cio/core/utils/redis/redis';

export type CachedRead<T> = { data: T; generatedAt: string };

export type CachedReadOptions = { refresh?: boolean };

const LOCK_TTL_SECONDS = 30;
const LOCK_WAIT_MS = 100;
const LOCK_WAIT_ATTEMPTS = 20;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function readEntry<T>(key: string): Promise<CachedRead<T> | null> {
  try {
    const raw = await redis.get(key);
    return raw ? (JSON.parse(raw) as CachedRead<T>) : null;
  } catch (error) {
    logRedisUnavailableOnce('Redis get failed for cached read, using database', error);
    return null;
  }
}

async function tryLock(lockKey: string): Promise<'acquired' | 'held' | 'unavailable'> {
  try {
    return (await redis.set(lockKey, '1', { NX: true, EX: LOCK_TTL_SECONDS })) === 'OK' ? 'acquired' : 'held';
  } catch (error) {
    logRedisUnavailableOnce('Redis lock failed for cached read, using database', error);
    return 'unavailable';
  }
}

function isNewEnough<T>(entry: CachedRead<T>, notBefore: number | null): boolean {
  return notBefore === null || Date.parse(entry.generatedAt) >= notBefore;
}

async function waitForEntry<T>(key: string, notBefore: number | null): Promise<CachedRead<T> | null> {
  for (let attempt = 0; attempt < LOCK_WAIT_ATTEMPTS; attempt++) {
    await sleep(LOCK_WAIT_MS);
    const entry = await readEntry<T>(key);
    if (entry && isNewEnough(entry, notBefore)) return entry;
  }

  return null;
}

/**
 * Cache-aside read with stampede protection. On a miss, one caller takes `{key}:lock` and computes; the others wait
 * up to ~2s for its result, then compute anyway so a stuck lock never blocks reads. With `refresh`, the read is
 * skipped and the entry is overwritten; the old entry keeps serving other readers until then, and a refresh that
 * finds the lock held waits only for an entry generated after it started. Without Redis it just computes.
 */
export async function cachedRead<T>(
  key: string,
  ttlSeconds: number,
  compute: () => Promise<T>,
  options: CachedReadOptions = {}
): Promise<CachedRead<T>> {
  if (!env.REDIS_URL) {
    return { data: await compute(), generatedAt: new Date().toISOString() };
  }

  const startedAt = Date.now();

  if (!options.refresh) {
    const cached = await readEntry<T>(key);
    if (cached) return cached;
  }

  const lockKey = `${key}:lock`;
  const lock = await tryLock(lockKey);
  const hasLock = lock === 'acquired';

  if (lock === 'held') {
    const notBefore = options.refresh ? startedAt : null;
    const filled = await waitForEntry<T>(key, notBefore);
    if (filled) return filled;
  }

  try {
    const entry: CachedRead<T> = { data: await compute(), generatedAt: new Date().toISOString() };

    try {
      await redis.setEx(key, ttlSeconds, JSON.stringify(entry));
    } catch (error) {
      logRedisUnavailableOnce('Redis set failed for cached read, continuing', error);
    }

    return entry;
  } finally {
    if (hasLock) {
      await redis.del(lockKey).catch(() => undefined);
    }
  }
}
```

The `const entry: CachedRead<T> = { data: await compute(), … }` line already exists on `main`. Leave it alone in this change; moving it is a separate cleanup.

### 15.14 Services: `apps/api/src/services/insights/`

`types.ts`:

```ts
import type { InsightsQueryOutput, InsightsScopeRef, InsightsScopeSummary } from '@cio/db/queries/insights';
import type { TInsightsScopeType } from '@cio/utils/constants/insights';
import type { TInsightsWidget } from '@cio/utils/validation/insights';

export type InsightsActor = {
  profileId: string;
  orgId: string;
  orgRoles: Record<string, number>;
};

export type AuthorizedInsightsScope = InsightsScopeRef & { courseIds: string[] };

export type InsightsQueryResult = InsightsQueryOutput & {
  generatedAt: string;
  cached: boolean;
  refreshThrottled: boolean;
};

export type InsightsStructureItem = {
  id: string;
  type: 'LESSON' | 'EXERCISE';
  title: string;
  rank: number;
  sectionId: string | null;
  isPassRequired: boolean;
  passMark: number | null;
  isLocked: boolean;
  maxPoints: number | null;
};

export type InsightsCourseStructure = {
  courseId: string;
  isGrouped: boolean;
  sections: Array<{ id: string; title: string; rank: number }>;
  items: InsightsStructureItem[];
};

export type InsightsDashboard = {
  scope: InsightsScopeSummary & { type: TInsightsScopeType; id: string };
  structures: Record<string, InsightsCourseStructure>;
  widgets: TInsightsWidget[];
  refreshIntervalSeconds: number;
};
```

`errors.ts`:

```ts
import { OperationalQueryError } from '@cio/db/queries/query-errors';

import { AppError, type ErrorCode } from '@api/utils/errors';

/**
 * Keeps AppErrors, maps query-layer rule failures to their own status, and wraps anything else as a 500.
 */
export function toInsightsError(error: unknown, fallbackCode: ErrorCode): AppError {
  if (error instanceof AppError) return error;

  if (error instanceof OperationalQueryError) {
    return new AppError(error.message, error.errorCode, error.statusCode, error.field);
  }

  return new AppError(error instanceof Error ? error : 'Insights request failed', fallbackCode, 500);
}
```

`authorize.ts`. This implements section 4.5, and it runs before any cache read:

```ts
import { getCohortMemberRole, getCohortOrganizationId } from '@cio/db/queries/cohort';
import { isCourseTeamMemberOrOrgAdmin } from '@cio/db/queries/group';
import { listInsightsScopeCourseIds } from '@cio/db/queries/insights';
import { getCourseOrganizationId } from '@cio/db/queries/tag';
import { ROLE } from '@cio/utils/constants';
import type { TInsightsScopeType } from '@cio/utils/constants/insights';
import type { TInsightsScope } from '@cio/utils/validation/insights';

import { AppError, ErrorCodes } from '@api/utils/errors';
import type { AuthorizedInsightsScope, InsightsActor } from './types';

type ScopeAssertion = (actor: InsightsActor, scopeId: string, isOrgAdmin: boolean) => Promise<void>;

function scopeNotFound(): AppError {
  return new AppError('Analytics scope not found', ErrorCodes.INSIGHTS_SCOPE_NOT_FOUND, 404);
}

function scopeForbidden(): AppError {
  return new AppError('You do not have access to these analytics', ErrorCodes.INSIGHTS_SCOPE_FORBIDDEN, 403);
}

async function assertOrgScope(actor: InsightsActor, orgId: string, isOrgAdmin: boolean): Promise<void> {
  if (orgId !== actor.orgId) throw scopeNotFound();

  if (!isOrgAdmin) throw scopeForbidden();
}

async function assertCohortScope(actor: InsightsActor, cohortId: string, isOrgAdmin: boolean): Promise<void> {
  const cohortOrgId = await getCohortOrganizationId(cohortId);
  if (cohortOrgId !== actor.orgId) throw scopeNotFound();

  if (isOrgAdmin) return;

  const cohortRoleId = await getCohortMemberRole(cohortId, actor.profileId);
  if (cohortRoleId !== ROLE.ADMIN && cohortRoleId !== ROLE.TUTOR) throw scopeForbidden();
}

async function assertCourseScope(actor: InsightsActor, courseId: string): Promise<void> {
  const courseOrgId = await getCourseOrganizationId(courseId);
  if (courseOrgId !== actor.orgId) throw scopeNotFound();

  const isCourseTeam = await isCourseTeamMemberOrOrgAdmin(courseId, actor.profileId);
  if (!isCourseTeam) throw scopeForbidden();
}

const SCOPE_ASSERTIONS: Record<TInsightsScopeType, ScopeAssertion> = {
  org: assertOrgScope,
  cohort: assertCohortScope,
  course: assertCourseScope
};

/**
 * Checks the actor may read the scope in their verified org, then returns it with its course ids.
 * Throws 404 for a scope in another org and 403 for a scope the actor cannot see.
 */
export async function resolveAuthorizedScope(
  actor: InsightsActor,
  scope: TInsightsScope
): Promise<AuthorizedInsightsScope> {
  const isOrgAdmin = actor.orgRoles[actor.orgId] === ROLE.ADMIN;
  await SCOPE_ASSERTIONS[scope.type](actor, scope.id, isOrgAdmin);

  const scopeRef = { orgId: actor.orgId, type: scope.type, id: scope.id };
  const courseIds = await listInsightsScopeCourseIds(scopeRef);

  return { ...scopeRef, courseIds };
}
```

`canonicalize.ts`:

```ts
import { createHash } from 'node:crypto';

import type { TInsightsQuerySpec } from '@cio/utils/validation/insights';

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;

  if (value && typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>)
      .filter(([, entryValue]) => entryValue !== undefined)
      .sort(([left], [right]) => left.localeCompare(right));

    return `{${entries.map(([key, entryValue]) => `${JSON.stringify(key)}:${stableStringify(entryValue)}`).join(',')}}`;
  }

  return JSON.stringify(value);
}

/**
 * Returns the spec in one canonical form, so specs that mean the same thing hash the same.
 * Keeps the order of measures, dimensions and sort, which changes the result.
 */
export function canonicalizeSpec<TSpec extends TInsightsQuerySpec>(spec: TSpec): TSpec {
  const filters = spec.filters
    .map((filter) => (Array.isArray(filter.value) ? { ...filter, value: [...filter.value].sort() } : filter))
    .sort((left, right) => stableStringify(left).localeCompare(stableStringify(right)));
  const search = spec.search?.trim() || undefined;

  return { ...spec, filters, search };
}

export function hashSpec(spec: TInsightsQuerySpec): string {
  return createHash('sha256').update(stableStringify(spec)).digest('hex').slice(0, 32);
}
```

`structure.ts`:

```ts
import type { CourseContentItem } from '@cio/core/services/course/utils';
import { buildCourseContent, DEFAULT_CONTENT_GROUPING } from '@cio/core/services/course/utils';
import { INSIGHTS_TTL_SECONDS, insightsStructureKey } from '@cio/core/utils/redis/insights-cache';
import { getCourseById } from '@cio/db/queries/course';
import { getCourseContentItems } from '@cio/db/queries/course/content';
import { getInsightsExerciseMeta, type InsightsExerciseMeta, type InsightsOrderedItem } from '@cio/db/queries/insights';
import { ContentType } from '@cio/utils/constants';
import { getCourseOutline } from '@cio/utils/functions/course-content';
import { flattenNavigableItems } from '@cio/utils/functions/course-progression';

import { cachedRead } from '@api/utils/redis/cached-read';
import type { InsightsCourseStructure, InsightsStructureItem } from './types';

function toStructureItem(
  item: CourseContentItem,
  rank: number,
  sectionIds: ReadonlySet<string>,
  meta: InsightsExerciseMeta | undefined
): InsightsStructureItem {
  const isExercise = item.type === ContentType.Exercise;
  const isPassRequired = meta?.completionPolicy === 'passed';
  const passMark = isPassRequired ? (meta?.passThreshold ?? 100) : null;
  const maxPoints = isExercise ? (meta?.maxPoints ?? 0) : null;
  const sectionId = item.sectionId && sectionIds.has(item.sectionId) ? item.sectionId : null;

  return {
    id: item.id,
    type: isExercise ? 'EXERCISE' : 'LESSON',
    title: item.title,
    rank,
    sectionId,
    isPassRequired,
    passMark,
    isLocked: item.isUnlocked === false,
    maxPoints
  };
}

async function buildCourseStructure(courseId: string): Promise<InsightsCourseStructure> {
  const [course] = await getCourseById(courseId);
  const rows = await getCourseContentItems(courseId);
  const exerciseMeta = await getInsightsExerciseMeta([courseId]);
  const isGrouped = course?.metadata?.isContentGroupingEnabled ?? DEFAULT_CONTENT_GROUPING;
  const content = buildCourseContent(rows, isGrouped);
  const outlineSections = isGrouped
    ? getCourseOutline(content).flatMap((entry) => (entry.kind === 'section' ? [entry.section] : []))
    : [];
  const sectionIds = new Set(outlineSections.map((section) => section.id));
  const metaById = new Map(exerciseMeta.map((meta) => [meta.id, meta]));
  const items = flattenNavigableItems(content)
    .filter((item) => item.type === ContentType.Lesson || item.type === ContentType.Exercise)
    .map((item, rank) => toStructureItem(item, rank, sectionIds, metaById.get(item.id)));
  const sections = outlineSections.map((section, rank) => ({ id: section.id, title: section.title, rank }));

  return { courseId, isGrouped, sections, items };
}

/**
 * A course's outline in learner order, with pass rules per exercise. Cached for 10 minutes and dropped by
 * `invalidateInsightsCourseStructure` when content order or exercise rules change.
 */
export async function getInsightsCourseStructure(orgId: string, courseId: string): Promise<InsightsCourseStructure> {
  const entry = await cachedRead(insightsStructureKey(orgId, courseId), INSIGHTS_TTL_SECONDS.structure, () =>
    buildCourseStructure(courseId)
  );

  return entry.data;
}

export function toOrderedItems(structure: InsightsCourseStructure): InsightsOrderedItem[] {
  const sectionRankById = new Map(structure.sections.map((section) => [section.id, section.rank]));

  return structure.items.map((item) => ({
    courseId: structure.courseId,
    itemId: item.id,
    itemType: item.type,
    itemRank: item.rank,
    sectionId: item.sectionId,
    sectionRank: item.sectionId ? (sectionRankById.get(item.sectionId) ?? null) : null
  }));
}
```

`query.ts`:

```ts
import { claimInsightsRefresh, insightsKey, insightsTtlSeconds } from '@cio/core/utils/redis/insights-cache';
import {
  requiresOrderedItems,
  runInsightsQuery,
  type InsightsOrderedItem,
  type InsightsQueryOutput
} from '@cio/db/queries/insights';
import { INSIGHTS_LIMITS } from '@cio/utils/constants/insights';
import type { TInsightsExportRequest, TInsightsQueryRequest, TInsightsQuerySpec } from '@cio/utils/validation/insights';

import { AppError, ErrorCodes } from '@api/utils/errors';
import { cachedRead } from '@api/utils/redis/cached-read';
import { resolveAuthorizedScope } from './authorize';
import { canonicalizeSpec, hashSpec } from './canonicalize';
import { toInsightsError } from './errors';
import { getInsightsCourseStructure, toOrderedItems } from './structure';
import type { AuthorizedInsightsScope, InsightsActor, InsightsQueryResult } from './types';

function courseIdsForSpec(scope: AuthorizedInsightsScope, spec: TInsightsQuerySpec): string[] {
  const courseFilter = spec.filters.find((filter) => filter.field === 'course');
  if (!courseFilter?.value) return scope.courseIds;

  const requestedIds = Array.isArray(courseFilter.value) ? courseFilter.value : [String(courseFilter.value)];
  const requested = new Set(requestedIds);

  return scope.courseIds.filter((courseId) => requested.has(courseId));
}

async function loadOrderedItems(scope: AuthorizedInsightsScope, spec: TInsightsQuerySpec): Promise<InsightsOrderedItem[]> {
  if (!requiresOrderedItems(spec)) return [];

  const courseIds = courseIdsForSpec(scope, spec);
  if (courseIds.length > INSIGHTS_LIMITS.maxOutlineCourses) {
    throw new AppError('Pick a course to break results down by exercise, section or lesson', ErrorCodes.INSIGHTS_QUERY_INVALID, 400);
  }

  const structures = await Promise.all(courseIds.map((courseId) => getInsightsCourseStructure(scope.orgId, courseId)));

  return structures.flatMap(toOrderedItems);
}

async function computeInsightsQuery(scope: AuthorizedInsightsScope, spec: TInsightsQuerySpec): Promise<InsightsQueryOutput> {
  const orderedItems = await loadOrderedItems(scope, spec);

  return runInsightsQuery(spec, { scope, orderedItems });
}

function uncachedResult(output: InsightsQueryOutput): InsightsQueryResult {
  const generatedAt = new Date().toISOString();

  return { ...output, generatedAt, cached: false, refreshThrottled: false };
}

/**
 * Runs one widget spec for the actor. Authorizes before touching the cache, serves cached results inside the scope
 * TTL, recomputes on an allowed refresh, and never caches free-text search.
 */
export async function runInsightsQueryForActor(
  actor: InsightsActor,
  request: TInsightsQueryRequest
): Promise<InsightsQueryResult> {
  try {
    const scope = await resolveAuthorizedScope(actor, request.scope);
    const spec = canonicalizeSpec(request.spec);

    if (spec.search) {
      const output = await computeInsightsQuery(scope, spec);
      return uncachedResult(output);
    }

    const startedAt = Date.now();
    const specHash = hashSpec(spec);
    const key = insightsKey('query', scope.orgId, scope.type, scope.id, specHash);
    const ttlSeconds = insightsTtlSeconds(scope.type);
    const refresh = request.refresh
      ? await claimInsightsRefresh(actor.profileId, scope.type, scope.id, specHash)
      : false;
    const entry = await cachedRead(key, ttlSeconds, () => computeInsightsQuery(scope, spec), { refresh });
    const cached = Date.parse(entry.generatedAt) < startedAt;
    const refreshThrottled = Boolean(request.refresh) && !refresh;

    return { ...entry.data, generatedAt: entry.generatedAt, cached, refreshThrottled };
  } catch (error) {
    throw toInsightsError(error, ErrorCodes.INSIGHTS_QUERY_FAILED);
  }
}

/**
 * Same authorization and spec as a widget, read fresh and without the page-size cap.
 */
export async function exportInsightsQueryForActor(
  actor: InsightsActor,
  request: TInsightsExportRequest
): Promise<InsightsQueryResult> {
  try {
    const scope = await resolveAuthorizedScope(actor, request.scope);
    const spec = canonicalizeSpec(request.spec);
    const output = await computeInsightsQuery(scope, spec);

    return uncachedResult(output);
  } catch (error) {
    throw toInsightsError(error, ErrorCodes.INSIGHTS_EXPORT_FAILED);
  }
}
```

`dashboards.ts`:

```ts
import { INSIGHTS_LIMITS } from '@cio/utils/constants/insights';
import { insightsKey, insightsTtlSeconds } from '@cio/core/utils/redis/insights-cache';
import { getInsightsScopeSummary } from '@cio/db/queries/insights';
import type { TInsightsDashboardParam } from '@cio/utils/validation/insights';

import { ErrorCodes } from '@api/utils/errors';
import { cachedRead } from '@api/utils/redis/cached-read';
import { resolveAuthorizedScope } from './authorize';
import { toInsightsError } from './errors';
import { INSIGHTS_PRESETS } from './presets';
import { getInsightsCourseStructure } from './structure';
import type { AuthorizedInsightsScope, InsightsActor, InsightsCourseStructure, InsightsDashboard } from './types';

async function loadDashboardStructures(scope: AuthorizedInsightsScope): Promise<Record<string, InsightsCourseStructure>> {
  if (scope.type === 'org') return {};

  const courseIds = scope.courseIds.slice(0, INSIGHTS_LIMITS.maxOutlineCourses);
  const structures = await Promise.all(courseIds.map((courseId) => getInsightsCourseStructure(scope.orgId, courseId)));

  return Object.fromEntries(structures.map((structure) => [structure.courseId, structure]));
}

/**
 * Header data, course outlines and preset widgets for one scope. The summary shares the scope's TTL.
 */
export async function getInsightsDashboardForActor(
  actor: InsightsActor,
  param: TInsightsDashboardParam
): Promise<InsightsDashboard> {
  try {
    const scope = await resolveAuthorizedScope(actor, { type: param.scopeType, id: param.scopeId });
    const ttlSeconds = insightsTtlSeconds(scope.type);
    const summaryKey = insightsKey('dashboard', scope.orgId, scope.type, scope.id);
    const summary = await cachedRead(summaryKey, ttlSeconds, () => getInsightsScopeSummary(scope));
    const structures = await loadDashboardStructures(scope);
    const widgets = INSIGHTS_PRESETS[scope.type];

    return {
      scope: { ...summary.data, type: scope.type, id: scope.id },
      structures,
      widgets,
      refreshIntervalSeconds: ttlSeconds
    };
  } catch (error) {
    throw toInsightsError(error, ErrorCodes.INSIGHTS_DASHBOARD_FAILED);
  }
}
```

`presets/index.ts`. Presets are plain data. They are parsed once at load, so a bad preset fails the API test run instead of reaching a user.

`courseMode` decides how the dashboard treats the course picker:
- `all`: the widget shows only under "All courses".
- `single`: the widget shows only when one course is picked. The client swaps `$course` for that course's id.
- `any`: the widget always shows. The client appends `{ field: 'course', op: 'eq', value: <id> }` when a course is picked.

`$learner` and `$exercise` are filled the same way, from the selected learner and the picked exercise. The server rejects any placeholder that reaches it unreplaced: those filters only accept uuids.

```ts
import { ZInsightsWidget, type TInsightsWidget, type TInsightsWidgetInput } from '@cio/utils/validation/insights';
import type { TInsightsScopeType } from '@cio/utils/constants/insights';

import { COHORT_WIDGETS } from './cohort';
import { COURSE_WIDGETS } from './course';
import { ORG_WIDGETS } from './org';

function parseWidgets(widgets: readonly TInsightsWidgetInput[]): TInsightsWidget[] {
  return widgets.map((widget) => ZInsightsWidget.parse(widget));
}

export const INSIGHTS_PRESETS: Record<TInsightsScopeType, TInsightsWidget[]> = {
  cohort: parseWidgets(COHORT_WIDGETS),
  course: parseWidgets(COURSE_WIDGETS),
  org: parseWidgets(ORG_WIDGETS)
};
```

`presets/shared.ts`:

```ts
import { INSIGHTS_PLACEHOLDERS } from '@cio/utils/constants/insights';
import type { TInsightsWidgetInput } from '@cio/utils/validation/insights';

export const pickedCourse = { field: 'course', op: 'eq', value: INSIGHTS_PLACEHOLDERS.course } as const;
export const selectedLearner = { field: 'learner', op: 'eq', value: INSIGHTS_PLACEHOLDERS.learner } as const;
export const pickedExercise = { field: 'exercise', op: 'eq', value: INSIGHTS_PLACEHOLDERS.exercise } as const;
export const notCompleted = { field: 'is_completed_all', op: 'is_false' } as const;

export const learnersTableWidget: TInsightsWidgetInput = {
  id: 'learners',
  titleKey: 'insights.widgets.learners.title',
  viz: 'matrix',
  span: 12,
  spec: {
    source: 'learner',
    dimensions: ['learner'],
    measures: [
      { metric: 'name', agg: 'value' },
      { metric: 'email', agg: 'value' },
      { metric: 'avatar_url', agg: 'value' },
      { metric: 'overall_progress_pct', agg: 'value' },
      { metric: 'avg_score_pct', agg: 'value' },
      { metric: 'courses_completed', agg: 'value' },
      { metric: 'courses_total', agg: 'value' },
      { metric: 'video_pct', agg: 'value' },
      { metric: 'attendance_pct', agg: 'value' },
      { metric: 'certificates', agg: 'value' },
      { metric: 'last_login_at', agg: 'value' },
      { metric: 'is_overdue', agg: 'value' },
      { metric: 'status', agg: 'value' },
      { metric: 'status_rank', agg: 'value' }
    ],
    sort: [
      { field: 'status_rank__value', dir: 'asc' },
      { field: 'avg_score_pct__value', dir: 'asc' }
    ],
    limit: 25
  }
};

export const needsAttentionWidget: TInsightsWidgetInput = {
  id: 'needs_attention',
  titleKey: 'insights.widgets.needs_attention.title',
  viz: 'hbar',
  span: 5,
  spec: {
    source: 'learner',
    filters: [notCompleted],
    measures: [
      { metric: 'is_inactive', agg: 'count_if' },
      { metric: 'is_low_score', agg: 'count_if' },
      { metric: 'is_overdue', agg: 'count_if' },
      { metric: 'is_low_video', agg: 'count_if' }
    ]
  }
};

export const hardestQuestionsWidget: TInsightsWidgetInput = {
  id: 'hardest_questions',
  titleKey: 'insights.widgets.hardest_questions.title',
  viz: 'hbar',
  span: 12,
  courseMode: 'single',
  spec: {
    source: 'question_result',
    filters: [pickedCourse],
    dimensions: ['question'],
    measures: [
      { metric: 'correct_pct', agg: 'avg' },
      { metric: 'wrong_answer', agg: 'mode' },
      { metric: 'rows', agg: 'count' }
    ],
    sort: [{ field: 'correct_pct__avg', dir: 'asc' }],
    minGroupRows: 5,
    limit: 5
  }
};

export const sectionScorecardWidget: TInsightsWidgetInput = {
  id: 'section_scorecard',
  titleKey: 'insights.widgets.section_scorecard.title',
  viz: 'table',
  span: 12,
  courseMode: 'single',
  requires: ['grouping'],
  spec: {
    source: 'section_activity',
    filters: [pickedCourse],
    dimensions: ['section'],
    measures: [
      { metric: 'rows', agg: 'count' },
      { metric: 'took_all', agg: 'count_if' },
      { metric: 'section_score_pct', agg: 'avg' },
      { metric: 'passed_all_required', agg: 'rate' },
      { metric: 'video_pct', agg: 'avg' },
      { metric: 'attendance', agg: 'pooled' }
    ],
    sort: [{ field: 'section', dir: 'asc' }],
    limit: 100
  }
};
```

`presets/cohort.ts`:

```ts
import type { TInsightsWidgetInput } from '@cio/utils/validation/insights';

import {
  hardestQuestionsWidget,
  learnersTableWidget,
  needsAttentionWidget,
  pickedCourse,
  sectionScorecardWidget,
  selectedLearner
} from './shared';

export const COHORT_WIDGETS: readonly TInsightsWidgetInput[] = [
  {
    id: 'kpi_logged_in_today',
    titleKey: 'insights.widgets.kpi_logged_in_today.title',
    viz: 'kpi',
    span: 4,
    spec: {
      source: 'learner',
      measures: [
        { metric: 'logged_in_today', agg: 'count_if' },
        { metric: 'rows', agg: 'count' }
      ]
    }
  },
  {
    id: 'kpi_avg_progress',
    titleKey: 'insights.widgets.kpi_avg_progress.title',
    viz: 'kpi',
    span: 4,
    spec: { source: 'learner', measures: [{ metric: 'overall_progress_pct', agg: 'avg' }] }
  },
  {
    id: 'kpi_avg_score',
    titleKey: 'insights.widgets.kpi_avg_score.title',
    viz: 'kpi',
    span: 4,
    spec: { source: 'learner', measures: [{ metric: 'avg_score_pct', agg: 'avg' }] }
  },
  {
    id: 'kpi_overdue',
    titleKey: 'insights.widgets.kpi_overdue.title',
    viz: 'kpi',
    span: 4,
    spec: { source: 'learner', measures: [{ metric: 'is_overdue', agg: 'count_if' }] }
  },
  {
    id: 'kpi_completed',
    titleKey: 'insights.widgets.kpi_completed.title',
    viz: 'kpi',
    span: 4,
    spec: {
      source: 'learner',
      measures: [
        { metric: 'is_completed_all', agg: 'count_if' },
        { metric: 'certificates', agg: 'sum' },
        { metric: 'rows', agg: 'count' }
      ]
    }
  },
  {
    id: 'courses_summary',
    titleKey: 'insights.widgets.courses_summary.title',
    viz: 'grouped_bar',
    span: 7,
    courseMode: 'all',
    spec: {
      source: 'learner_course',
      dimensions: ['course'],
      measures: [
        { metric: 'rows', agg: 'count' },
        { metric: 'progress_pct', agg: 'avg' },
        { metric: 'avg_score_pct', agg: 'avg' },
        { metric: 'is_completed', agg: 'count_if' },
        { metric: 'required_pass', agg: 'pooled' }
      ],
      sort: [{ field: 'course', dir: 'asc' }],
      limit: 100
    }
  },
  {
    id: 'learners_by_status',
    titleKey: 'insights.widgets.learners_by_status.title',
    viz: 'donut',
    span: 5,
    spec: { source: 'learner', dimensions: ['status'], measures: [{ metric: 'rows', agg: 'count' }], sort: [{ field: 'status' }] }
  },
  {
    id: 'learner_courses',
    titleKey: 'insights.widgets.learner_courses.title',
    viz: 'table',
    span: 12,
    courseMode: 'all',
    spec: {
      source: 'learner_course',
      filters: [selectedLearner],
      dimensions: ['course'],
      measures: [
        { metric: 'progress_pct', agg: 'value' },
        { metric: 'now_at_title', agg: 'value' },
        { metric: 'avg_score_pct', agg: 'value' },
        { metric: 'required_passed', agg: 'value' },
        { metric: 'required_total', agg: 'value' },
        { metric: 'is_completed', agg: 'value' }
      ],
      sort: [{ field: 'course', dir: 'asc' }],
      limit: 100
    }
  },
  needsAttentionWidget,
  {
    id: 'overdue',
    titleKey: 'insights.widgets.overdue.title',
    viz: 'table',
    span: 7,
    spec: {
      source: 'overdue_item',
      dimensions: ['item'],
      measures: [
        { metric: 'name', agg: 'value' },
        { metric: 'title', agg: 'value' },
        { metric: 'course_titles', agg: 'value' },
        { metric: 'kind', agg: 'value' },
        { metric: 'days_overdue', agg: 'value' },
        { metric: 'assignment_id', agg: 'value' }
      ],
      sort: [{ field: 'days_overdue__value', dir: 'desc' }],
      limit: 5
    }
  },
  learnersTableWidget,
  {
    id: 'logins_per_day',
    titleKey: 'insights.widgets.logins_per_day.title',
    viz: 'column',
    span: 6,
    spec: {
      source: 'login_day',
      dimensions: ['day'],
      measures: [{ metric: 'logged_in', agg: 'count_if' }],
      sort: [{ field: 'day', dir: 'asc' }],
      days: 14,
      limit: 30
    }
  },
  {
    id: 'score_distribution',
    titleKey: 'insights.widgets.score_distribution.title',
    viz: 'histogram',
    span: 6,
    spec: {
      source: 'learner',
      dimensions: ['score_bucket_10'],
      measures: [{ metric: 'rows', agg: 'count' }],
      sort: [{ field: 'score_bucket_10', dir: 'asc' }]
    }
  },
  {
    id: 'scores_by_exercise',
    titleKey: 'insights.widgets.scores_by_exercise.title',
    viz: 'line_band',
    span: 7,
    courseMode: 'single',
    spec: {
      source: 'assessment_result',
      filters: [pickedCourse],
      dimensions: ['exercise'],
      measures: [
        { metric: 'best_score_pct', agg: 'avg' },
        { metric: 'best_score_pct', agg: 'p25' },
        { metric: 'best_score_pct', agg: 'p75' },
        { metric: 'is_graded', agg: 'count_if' },
        { metric: 'is_attempted', agg: 'count_if' }
      ],
      sort: [{ field: 'exercise', dir: 'asc' }],
      limit: 200
    }
  },
  {
    id: 'progress_distribution',
    titleKey: 'insights.widgets.progress_distribution.title',
    viz: 'column',
    span: 5,
    courseMode: 'single',
    spec: {
      source: 'learner_course',
      filters: [pickedCourse],
      dimensions: ['progress_bucket_25'],
      measures: [{ metric: 'rows', agg: 'count' }],
      sort: [{ field: 'progress_bucket_25', dir: 'asc' }]
    }
  },
  {
    id: 'learner_progression',
    titleKey: 'insights.widgets.learner_progression.title',
    viz: 'line',
    span: 7,
    courseMode: 'single',
    spec: {
      source: 'assessment_result',
      filters: [pickedCourse, selectedLearner],
      dimensions: ['exercise'],
      measures: [
        { metric: 'best_score_pct', agg: 'value' },
        { metric: 'state', agg: 'value' }
      ],
      sort: [{ field: 'exercise', dir: 'asc' }],
      limit: 200
    }
  },
  {
    id: 'section_scores',
    titleKey: 'insights.widgets.section_scores.title',
    viz: 'grouped_bar',
    span: 7,
    courseMode: 'single',
    requires: ['grouping'],
    spec: {
      source: 'section_activity',
      filters: [pickedCourse],
      dimensions: ['section'],
      measures: [
        { metric: 'section_score_pct', agg: 'avg' },
        { metric: 'video_pct', agg: 'avg' },
        { metric: 'attendance', agg: 'pooled' }
      ],
      sort: [{ field: 'section', dir: 'asc' }],
      limit: 100
    }
  },
  sectionScorecardWidget,
  hardestQuestionsWidget
];
```

`presets/course.ts`:

```ts
import type { TInsightsWidgetInput } from '@cio/utils/validation/insights';

import { hardestQuestionsWidget, learnersTableWidget, pickedExercise, sectionScorecardWidget } from './shared';

function courseWide(widget: TInsightsWidgetInput): TInsightsWidgetInput {
  const spec = { ...widget.spec, filters: [] };

  return { ...widget, courseMode: 'any', spec };
}

export const COURSE_WIDGETS: readonly TInsightsWidgetInput[] = [
  {
    id: 'kpi_enrolled',
    titleKey: 'insights.widgets.kpi_enrolled.title',
    viz: 'kpi',
    span: 4,
    spec: { source: 'learner_course', measures: [{ metric: 'rows', agg: 'count' }] }
  },
  {
    id: 'kpi_completion_rate',
    titleKey: 'insights.widgets.kpi_completion_rate.title',
    viz: 'kpi',
    span: 4,
    spec: { source: 'learner_course', measures: [{ metric: 'is_completed', agg: 'rate' }] }
  },
  {
    id: 'kpi_avg_score',
    titleKey: 'insights.widgets.kpi_avg_score.title',
    viz: 'kpi',
    span: 4,
    spec: { source: 'learner', measures: [{ metric: 'avg_score_pct', agg: 'avg' }] }
  },
  {
    id: 'kpi_required_pass_rate',
    titleKey: 'insights.widgets.kpi_required_pass_rate.title',
    viz: 'kpi',
    span: 4,
    requires: ['pass_required'],
    spec: { source: 'assessment_result', measures: [{ metric: 'required_pass', agg: 'pooled' }] }
  },
  {
    id: 'kpi_median_days',
    titleKey: 'insights.widgets.kpi_median_days.title',
    viz: 'kpi',
    span: 4,
    spec: { source: 'learner_course', measures: [{ metric: 'days_to_finish', agg: 'median' }] }
  },
  {
    id: 'scores_by_exercise_by_cohort',
    titleKey: 'insights.widgets.scores_by_exercise_by_cohort.title',
    viz: 'multi_line',
    span: 7,
    spec: {
      source: 'assessment_result',
      dimensions: ['exercise', 'cohort'],
      measures: [{ metric: 'best_score_pct', agg: 'avg' }],
      sort: [{ field: 'exercise', dir: 'asc' }],
      limit: 1000
    }
  },
  {
    id: 'exercise_score_distribution',
    titleKey: 'insights.widgets.exercise_score_distribution.title',
    viz: 'histogram',
    span: 5,
    spec: {
      source: 'assessment_result',
      filters: [pickedExercise],
      dimensions: ['score_bucket_10'],
      measures: [{ metric: 'rows', agg: 'count' }],
      sort: [{ field: 'score_bucket_10', dir: 'asc' }]
    }
  },
  {
    id: 'lesson_dropoff',
    titleKey: 'insights.widgets.lesson_dropoff.title',
    viz: 'hbar',
    span: 6,
    spec: {
      source: 'lesson_progress',
      dimensions: ['lesson'],
      measures: [{ metric: 'is_complete', agg: 'rate' }],
      sort: [{ field: 'lesson', dir: 'asc' }],
      limit: 200
    }
  },
  {
    id: 'hardest_exercises',
    titleKey: 'insights.widgets.hardest_exercises.title',
    viz: 'grouped_bar',
    span: 6,
    spec: {
      source: 'assessment_result',
      dimensions: ['exercise'],
      measures: [
        { metric: 'best_score_pct', agg: 'avg' },
        { metric: 'required_pass', agg: 'pooled' }
      ],
      sort: [{ field: 'best_score_pct__avg', dir: 'asc' }],
      minGroupRows: 5,
      limit: 5
    }
  },
  courseWide(hardestQuestionsWidget),
  courseWide(sectionScorecardWidget),
  {
    id: 'cohorts_in_course',
    titleKey: 'insights.widgets.cohorts_in_course.title',
    viz: 'grouped_bar',
    span: 12,
    spec: {
      source: 'learner_course',
      dimensions: ['cohort'],
      measures: [
        { metric: 'rows', agg: 'count' },
        { metric: 'progress_pct', agg: 'avg' },
        { metric: 'avg_score_pct', agg: 'avg' },
        { metric: 'required_pass', agg: 'pooled' },
        { metric: 'is_overdue', agg: 'count_if' }
      ],
      sort: [{ field: 'rows__count', dir: 'desc' }],
      limit: 50
    }
  },
  learnersTableWidget
];
```

`presets/org.ts`:

```ts
import type { TInsightsWidgetInput } from '@cio/utils/validation/insights';

import { needsAttentionWidget, notCompleted } from './shared';

export const ORG_WIDGETS: readonly TInsightsWidgetInput[] = [
  {
    id: 'kpi_logged_in_week',
    titleKey: 'insights.widgets.kpi_logged_in_week.title',
    viz: 'kpi',
    span: 4,
    spec: {
      source: 'learner',
      measures: [
        { metric: 'logged_in_week', agg: 'count_if' },
        { metric: 'rows', agg: 'count' }
      ]
    }
  },
  {
    id: 'kpi_avg_progress',
    titleKey: 'insights.widgets.kpi_avg_progress.title',
    viz: 'kpi',
    span: 4,
    spec: { source: 'learner', measures: [{ metric: 'overall_progress_pct', agg: 'avg' }] }
  },
  {
    id: 'kpi_completions',
    titleKey: 'insights.widgets.kpi_completions.title',
    viz: 'kpi',
    span: 4,
    spec: {
      source: 'learner_course',
      measures: [
        { metric: 'is_completed', agg: 'count_if' },
        { metric: 'is_certified', agg: 'count_if' }
      ]
    }
  },
  {
    id: 'kpi_needs_attention',
    titleKey: 'insights.widgets.kpi_needs_attention.title',
    viz: 'kpi',
    span: 4,
    spec: { source: 'learner', filters: [notCompleted], measures: [{ metric: 'is_at_risk', agg: 'count_if' }] }
  },
  {
    id: 'cohorts_at_a_glance',
    titleKey: 'insights.widgets.cohorts_at_a_glance.title',
    viz: 'table',
    span: 8,
    spec: {
      source: 'learner',
      dimensions: ['cohort'],
      measures: [
        { metric: 'rows', agg: 'count' },
        { metric: 'overall_progress_pct', agg: 'avg' },
        { metric: 'avg_score_pct', agg: 'avg' },
        { metric: 'is_overdue', agg: 'count_if' },
        { metric: 'is_at_risk', agg: 'count_if' },
        { metric: 'is_completed_all', agg: 'count_if' }
      ],
      sort: [{ field: 'cohort', dir: 'asc' }],
      limit: 100
    }
  },
  { ...needsAttentionWidget, span: 4 },
  {
    id: 'hiring_ramp',
    titleKey: 'insights.widgets.hiring_ramp.title',
    viz: 'line',
    span: 12,
    spec: {
      source: 'org_member',
      dimensions: ['week'],
      measures: [{ metric: 'members_total', agg: 'value' }],
      sort: [{ field: 'week', dir: 'asc' }],
      limit: 12
    }
  },
  {
    id: 'logins_per_day',
    titleKey: 'insights.widgets.logins_per_day.title',
    viz: 'line',
    span: 7,
    spec: {
      source: 'login_day',
      dimensions: ['day'],
      measures: [{ metric: 'logged_in', agg: 'count_if' }],
      sort: [{ field: 'day', dir: 'asc' }],
      days: 14,
      limit: 30
    }
  },
  {
    id: 'avg_score_by_cohort',
    titleKey: 'insights.widgets.avg_score_by_cohort.title',
    viz: 'hbar',
    span: 5,
    spec: {
      source: 'learner',
      dimensions: ['cohort'],
      measures: [{ metric: 'avg_score_pct', agg: 'avg' }],
      sort: [{ field: 'avg_score_pct__avg', dir: 'desc' }],
      limit: 10
    }
  },
  {
    id: 'courses_by_completion',
    titleKey: 'insights.widgets.courses_by_completion.title',
    viz: 'hbar',
    span: 12,
    spec: {
      source: 'learner_course',
      dimensions: ['course'],
      measures: [{ metric: 'is_completed', agg: 'rate' }],
      sort: [{ field: 'is_completed__rate', dir: 'desc' }],
      limit: 10
    }
  }
];
```

The org panels tile the 12-column grid with no gaps: "Cohorts at a glance" (8) with "Needs attention" (4), the hiring ramp alone (12), logins per day (7) with average score by cohort (5), then courses by completion (12). The prototype gave the health donut its own 5-column card beside the hiring ramp; here the donut sits inside "Cohorts at a glance", so the hiring ramp takes the full row instead of leaving a 5-column hole. `insights-presets.test.ts` checks the tiling.

Org scope never exposes outline dimensions, because `loadOrderedItems` would need every course's structure. Course scope drops the picker placeholder (`courseWide`), because the scope already is that course.

`index.ts`:

```ts
export * from './authorize';
export * from './dashboards';
export * from './query';
export * from './types';
```

### 15.15 Routes: `apps/api/src/routes/insights/index.ts` and `app.ts`

```ts
import type { Context } from 'hono';
import { zValidator } from '@hono/zod-validator';

import { ZInsightsDashboardParam, ZInsightsExportRequest, ZInsightsQueryRequest } from '@cio/utils/validation/insights';

import { authMiddleware } from '@api/middlewares/auth';
import { orgMemberMiddleware } from '@api/middlewares/org-member';
import { createRateLimiter } from '@api/middlewares/rate-limiter';
import {
  exportInsightsQueryForActor,
  getInsightsDashboardForActor,
  runInsightsQueryForActor,
  type InsightsActor
} from '@api/services/insights';
import type { AuthSession } from '@api/types/auth';
import { handleError } from '@api/utils/errors';
import { Hono } from '@api/utils/hono';

const INSIGHTS_CACHE_CONTROL = 'private, no-store';

const insightsExportRateLimit = createRateLimiter({
  windowMs: 60_000,
  maxRequests: 6,
  message: 'Too many exports. Please try again shortly.',
  keyGenerator: (c) => `insights_export:${c.get('user')?.id ?? 'anonymous'}`
});

function getInsightsActor(c: Context<AuthSession>): InsightsActor {
  const user = c.get('user')!;
  const orgId = c.get('orgId')!;
  const orgRoles = c.get('orgRoles') ?? {};

  return { profileId: user.id, orgId, orgRoles };
}

export const insightsRouter = new Hono()
  .post('/query', authMiddleware, orgMemberMiddleware, zValidator('json', ZInsightsQueryRequest), async (c) => {
    c.header('Cache-Control', INSIGHTS_CACHE_CONTROL);

    try {
      const actor = getInsightsActor(c);
      const request = c.req.valid('json');
      const result = await runInsightsQueryForActor(actor, request);

      return c.json({ success: true, data: result }, 200);
    } catch (error) {
      return handleError(c, error, 'Failed to load analytics');
    }
  })
  .post(
    '/export',
    authMiddleware,
    orgMemberMiddleware,
    insightsExportRateLimit,
    zValidator('json', ZInsightsExportRequest),
    async (c) => {
      c.header('Cache-Control', INSIGHTS_CACHE_CONTROL);

      try {
        const actor = getInsightsActor(c);
        const request = c.req.valid('json');
        const result = await exportInsightsQueryForActor(actor, request);

        return c.json({ success: true, data: result }, 200);
      } catch (error) {
        return handleError(c, error, 'Failed to export analytics');
      }
    }
  )
  .get(
    '/dashboards/:scopeType/:scopeId',
    authMiddleware,
    orgMemberMiddleware,
    zValidator('param', ZInsightsDashboardParam),
    async (c) => {
      c.header('Cache-Control', INSIGHTS_CACHE_CONTROL);

      try {
        const actor = getInsightsActor(c);
        const param = c.req.valid('param');
        const dashboard = await getInsightsDashboardForActor(actor, param);

        return c.json({ success: true, data: dashboard }, 200);
      } catch (error) {
        return handleError(c, error, 'Failed to load analytics dashboard');
      }
    }
  );
```

In `apps/api/src/app.ts`, add the import and one mount inside the chain, before `.onError`:

```ts
import { insightsRouter } from '@api/routes/insights';
// …
  .route('/cohort', cohortRouter)
  .route('/insights', insightsRouter)
  .route('/report', reportRouter)
```

### 15.16 "Send reminder now": service and routes

In `apps/api/src/services/cohort/goal.ts`, replace the per-row body of `runCohortGoalReminderScan` with `enqueueCohortGoalReminder`, and add the two manual entry points:

```ts
import { buildEmailBranding, buildEmailFromName } from '@cio/email';
import {
  getAssignmentReminderContext,
  listAssignmentsForReminderScan,
  listOverdueAssignmentReminderContexts,
  type CohortGoalReminderContext
} from '@cio/db/queries/cohort';
import type { TRemindOverdueCohortGoals } from '@cio/utils/validation/cohort';

const CLOSED_ASSIGNMENT_STATUSES: ReadonlySet<string> = new Set(['completed', 'waived']);

function dayKey(now: Date): string {
  return now.toISOString().slice(0, 10);
}

/**
 * Queues one org-branded reminder email. False when nothing was queued: the learner opted out or email is unavailable.
 */
async function enqueueCohortGoalReminder(
  context: CohortGoalReminderContext,
  options: { email: string; daysUntilDue: number; idempotencyKey: string }
): Promise<boolean> {
  const baseUrl = getDashboardBaseUrl({
    siteName: context.organizationSiteName,
    customDomain: context.organizationCustomDomain,
    isCustomDomainVerified: context.organizationIsCustomDomainVerified
  });
  const branding = buildEmailBranding({
    name: context.organizationName,
    avatarUrl: context.organizationAvatarUrl,
    theme: context.organizationTheme
  });
  const from = buildEmailFromName(`${context.organizationName} (via ClassroomIO.com)`);

  const result = await enqueueTransactionalEmail('cohortGoalReminder', {
    to: options.email,
    from,
    fields: {
      orgName: context.organizationName,
      cohortName: context.cohortName,
      goalTitle: context.goal.title,
      daysUntilDue: options.daysUntilDue,
      completedCount: context.assignment.completedCount ?? 0,
      requiredCount: context.assignment.requiredCount ?? 0,
      loginUrl: `${baseUrl}/lms/cohorts/${context.cohortId}`,
      branding
    },
    idempotencyKey: options.idempotencyKey,
    preference: { organizationId: context.organizationId, recipientProfileId: context.profileId }
  });

  return result.jobIds.length > 0;
}

export async function runCohortGoalReminderScan(): Promise<{ scanned: number; remindersEnqueued: number }> {
  const now = new Date();
  const contexts = await listAssignmentsForReminderScan();
  let remindersEnqueued = 0;

  for (const context of contexts) {
    if (!context.assignment.dueDate || !context.email) continue;

    const dueDate = new Date(context.assignment.dueDate);
    if (Number.isNaN(dueDate.getTime())) continue;

    const daysUntilDue = getWholeDaysUntil(now, dueDate);
    const reminderDays = context.goal.reminderDaysBefore ?? [];
    const matchesReminder = (daysUntilDue > 0 && reminderDays.includes(daysUntilDue)) || daysUntilDue === 0;
    if (!matchesReminder) continue;

    try {
      const idempotencyKey = `cohort-goal-reminder:${context.assignment.id}:${daysUntilDue}:${dayKey(now)}`;
      const enqueued = await enqueueCohortGoalReminder(context, { email: context.email, daysUntilDue, idempotencyKey });
      if (enqueued) remindersEnqueued += 1;
    } catch (error) {
      console.error(`runCohortGoalReminderScan: enqueue failed for assignment ${context.assignment.id}`, error);
    }
  }

  return { scanned: contexts.length, remindersEnqueued };
}

function assertRemindable(context: CohortGoalReminderContext): { email: string; dueDate: Date } {
  if (context.goal.status !== 'active' || CLOSED_ASSIGNMENT_STATUSES.has(context.assignment.status)) {
    throw new AppError('This goal is already complete for the learner', ErrorCodes.COHORT_GOAL_REMINDER_NOT_ALLOWED, 409);
  }

  if (!context.assignment.dueDate) {
    throw new AppError('This goal has no due date', ErrorCodes.COHORT_GOAL_REMINDER_NOT_ALLOWED, 409);
  }

  if (!context.email) {
    throw new AppError('The learner has no email address', ErrorCodes.COHORT_GOAL_REMINDER_NO_EMAIL, 400);
  }

  return { email: context.email, dueDate: new Date(context.assignment.dueDate) };
}

/**
 * Emails one learner about one goal now, including after the due date. At most one manual reminder per assignment
 * per day; a second call that day reports `enqueued: false`.
 */
export async function sendCohortGoalReminderNow(cohortId: string, assignmentId: string): Promise<{ enqueued: boolean }> {
  const context = await getAssignmentReminderContext(cohortId, assignmentId);
  if (!context) {
    throw new AppError('Goal assignment not found', ErrorCodes.COHORT_GOAL_ASSIGNMENT_NOT_FOUND, 404);
  }

  const { email, dueDate } = assertRemindable(context);
  const now = new Date();
  const daysUntilDue = getWholeDaysUntil(now, dueDate);
  const idempotencyKey = `cohort-goal-reminder-manual:${assignmentId}:${dayKey(now)}`;
  const enqueued = await enqueueCohortGoalReminder(context, { email, daysUntilDue, idempotencyKey });

  return { enqueued };
}

/**
 * Emails every overdue learner on the cohort's active goals, optionally only for goals covering one course.
 */
export async function sendOverdueCohortGoalRemindersNow(
  cohortId: string,
  input: TRemindOverdueCohortGoals
): Promise<{ enqueued: number; skipped: number }> {
  const contexts = await listOverdueAssignmentReminderContexts(cohortId, input.courseId);
  const now = new Date();
  let enqueued = 0;
  let skipped = 0;

  for (const context of contexts) {
    if (!context.email || !context.assignment.dueDate) {
      skipped += 1;
      continue;
    }

    const daysUntilDue = getWholeDaysUntil(now, new Date(context.assignment.dueDate));
    const idempotencyKey = `cohort-goal-reminder-manual:${context.assignment.id}:${dayKey(now)}`;
    const queued = await enqueueCohortGoalReminder(context, { email: context.email, daysUntilDue, idempotencyKey });

    if (queued) {
      enqueued += 1;
      continue;
    }

    skipped += 1;
  }

  return { enqueued, skipped };
}
```

BullMQ silently drops a job whose id it already holds, so a second same-day manual send returns `jobIds: []`. The `enqueued: false` result therefore covers three cases: already sent today, learner opted out, and email unavailable. The dashboard shows one neutral message for all three, not an error.

In `apps/api/src/routes/cohort/cohort.ts`, the routes use their own `goal-assignments` prefix so they can never collide with the `/:cohortId/goals/:goalId` routes:

```ts
import { createRateLimiter } from '@api/middlewares/rate-limiter';
import { ZRemindOverdueCohortGoals } from '@cio/utils/validation/cohort';
import { sendCohortGoalReminderNow, sendOverdueCohortGoalRemindersNow } from '@api/services/cohort/goal';

const ZGoalAssignmentParam = z.object({ cohortId: z.string().uuid(), assignmentId: z.string().uuid() });

const cohortGoalReminderRateLimit = createRateLimiter({
  windowMs: 60_000,
  maxRequests: 20,
  message: 'Too many reminders. Please try again shortly.',
  keyGenerator: (c) => `cohort_goal_remind:${c.get('user')?.id ?? 'anonymous'}`
});

  .post(
    '/:cohortId/goal-assignments/:assignmentId/remind',
    authMiddleware,
    cohortTeamMemberMiddleware,
    cohortGoalReminderRateLimit,
    zValidator('param', ZGoalAssignmentParam),
    async (c) => {
      try {
        const { cohortId, assignmentId } = c.req.valid('param');
        const result = await sendCohortGoalReminderNow(cohortId, assignmentId);

        return c.json({ success: true, data: result }, 200);
      } catch (error) {
        return handleError(c, error, 'Failed to send reminder');
      }
    }
  )
  .post(
    '/:cohortId/goal-assignments/remind-overdue',
    authMiddleware,
    cohortTeamMemberMiddleware,
    cohortGoalReminderRateLimit,
    zValidator('param', ZCohortParam),
    zValidator('json', ZRemindOverdueCohortGoals),
    async (c) => {
      try {
        const { cohortId } = c.req.valid('param');
        const input = c.req.valid('json');
        const result = await sendOverdueCohortGoalRemindersNow(cohortId, input);

        return c.json({ success: true, data: result }, 200);
      } catch (error) {
        return handleError(c, error, 'Failed to send reminders');
      }
    }
  )
```

### 15.17 Structure invalidation call sites

These calls run after the write has committed, and they never throw:

```ts
import { invalidateInsightsCourseStructure } from '../../utils/redis/insights-cache';
```

- **`packages/core/src/services/exercise/exercise.ts`, `updateExerciseService`:** after the update succeeds, call `void invalidateInsightsCourseStructure(courseId)` when any of these changed: `completionPolicy`, `passThreshold`, `isUnlocked`, `order`, `sectionId` or `title`. Read the course id from the updated row: `exercise.courseId`, or the lesson's course for legacy rows.
- **`packages/core/src/services/course/content.ts`:** call it at the end of `updateCourseContent`, `reorderCourseContent` and `deleteCourseContent`, for the course they touched.
- **Exercise and lesson creation, and section create, rename and delete:** grep the services for `insert(schema.exercise)`, `insert(schema.lesson)` and `courseSection` writes, and add the same call. A missed site only means the outline is up to 10 minutes stale, never wrong data.

### 15.18 Representative tests

These go in `apps/api/src/__tests__/`. Follow the mocking style of the neighbouring files.

`insights-compiler.test.ts`:

```ts
import { PgDialect } from 'drizzle-orm/pg-core';
import { describe, expect, it } from 'vitest';

import { compileInsightsQuery } from '@cio/db/queries/insights';
import { ZInsightsQuerySpec } from '@cio/utils/validation/insights';

const ORG_ID = '11111111-1111-4111-8111-111111111111';
const COHORT_ID = '22222222-2222-4222-8222-222222222222';
const COURSE_ID = '33333333-3333-4333-8333-333333333333';
const dialect = new PgDialect();
const scope = { orgId: ORG_ID, type: 'cohort' as const, id: COHORT_ID };

function compile(input: unknown) {
  const spec = ZInsightsQuerySpec.parse(input);
  const { query, columns } = compileInsightsQuery(spec, { scope, orderedItems: [] });

  return { ...dialect.sqlToQuery(query), columns };
}

describe('compileInsightsQuery', () => {
  it('binds the org id and never inlines filter values', () => {
    const compiled = compile({
      source: 'learner',
      measures: [{ metric: 'rows', agg: 'count' }],
      filters: [{ field: 'course', op: 'eq', value: COURSE_ID }]
    });

    expect(compiled.params).toContain(ORG_ID);
    expect(compiled.params).toContain(COURSE_ID);
    expect(compiled.sql).not.toContain(COURSE_ID);
  });

  it('escapes LIKE wildcards in search', () => {
    const compiled = compile({ source: 'learner', measures: [{ metric: 'rows', agg: 'count' }], search: '50%_off' });

    expect(compiled.params).toContain('%50\\%\\_off%');
  });

  it('rejects a metric the source does not define', () => {
    expect(() => compile({ source: 'login_day', measures: [{ metric: 'avg_score_pct', agg: 'avg' }] })).toThrow(/not available/);
  });

  it('rejects a placeholder that was never replaced', () => {
    expect(() =>
      compile({
        source: 'learner',
        measures: [{ metric: 'rows', agg: 'count' }],
        filters: [{ field: 'course', op: 'eq', value: '$course' }]
      })
    ).toThrow(/uuid/);
  });

  it('joins the cohort bridge only when grouping by cohort', () => {
    const courseScope = { orgId: ORG_ID, type: 'course' as const, id: COURSE_ID };
    const plain = dialect.sqlToQuery(
      compileInsightsQuery(ZInsightsQuerySpec.parse({ source: 'learner', measures: [{ metric: 'rows', agg: 'count' }] }), {
        scope: courseScope,
        orderedItems: []
      }).query
    );
    const grouped = dialect.sqlToQuery(
      compileInsightsQuery(
        ZInsightsQuerySpec.parse({ source: 'learner', dimensions: ['cohort'], measures: [{ metric: 'rows', agg: 'count' }] }),
        { scope: courseScope, orderedItems: [] }
      ).query
    );

    expect(plain.sql).not.toContain('bridge');
    expect(grouped.sql).toContain('bridge');
  });
});
```

`services-insights-authorization.test.ts`:

```ts
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@cio/db/queries/cohort', () => ({ getCohortOrganizationId: vi.fn(), getCohortMemberRole: vi.fn() }));
vi.mock('@cio/db/queries/group', () => ({ isCourseTeamMemberOrOrgAdmin: vi.fn() }));
vi.mock('@cio/db/queries/tag', () => ({ getCourseOrganizationId: vi.fn() }));
vi.mock('@cio/db/queries/insights', () => ({ listInsightsScopeCourseIds: vi.fn().mockResolvedValue([]) }));

import { getCohortMemberRole, getCohortOrganizationId } from '@cio/db/queries/cohort';
import { resolveAuthorizedScope } from '@api/services/insights/authorize';

const ORG_A = 'org-a';
const tutor = { profileId: 'tutor-1', orgId: ORG_A, orgRoles: { [ORG_A]: 2 } };

describe('resolveAuthorizedScope', () => {
  beforeEach(() => vi.clearAllMocks());

  it('hides a cohort from another org as not found', async () => {
    vi.mocked(getCohortOrganizationId).mockResolvedValue('org-b');

    await expect(resolveAuthorizedScope(tutor, { type: 'cohort', id: 'cohort-1' })).rejects.toMatchObject({ statusCode: 404 });
  });

  it('forbids a cohort the tutor does not staff', async () => {
    vi.mocked(getCohortOrganizationId).mockResolvedValue(ORG_A);
    vi.mocked(getCohortMemberRole).mockResolvedValue(3);

    await expect(resolveAuthorizedScope(tutor, { type: 'cohort', id: 'cohort-1' })).rejects.toMatchObject({ statusCode: 403 });
  });

  it('forbids the org scope to anyone but an org admin', async () => {
    await expect(resolveAuthorizedScope(tutor, { type: 'org', id: ORG_A })).rejects.toMatchObject({ statusCode: 403 });
  });
});
```

Use real uuids in the actual file; the service does not check id format.

Add these as well:

- **`cached-read.test.ts`:** refresh cases.
  - `refresh: true` never calls `redis.get` first.
  - It overwrites the entry.
  - When the lock is held, it returns only an entry whose `generatedAt` is at or after its start time.
- **`services-insights-query.test.ts`:**
  - A failed authorization means `cachedRead` is never called.
  - Search bypasses the cache.
  - A throttled refresh returns `refreshThrottled: true` and passes `{ refresh: false }`.
- **`services-cohort-goal.test.ts`:** the manual-reminder cases from PR 2 step 7.7.
- **`insights-metrics-db.test.ts`:** the fixture test described in section 8.

## 16. Proposed code: dashboard layer

This section is the reference implementation of section 6. It is written against `main` at `687a11df4`, plus PR 1's moves: `KpiCard` and `AnalyticsPanelCard` now live in `features/ui/analytics/`, and the old folder is now `features/marketing`.

It uses components that already exist:
- `KpiCard`, `AnalyticsPanelCard`, `ExportMenu`, `RefreshPageData`, `SortSelect` and `RoleBasedSecurity` from `$features/ui`
- `Page`, `Table`, `Select`, `Skeleton`, `Badge`, `Button` and `Progress` from `@cio/ui/base/*`
- `Search` and `Empty` from `@cio/ui/custom/*`
- `DebouncedSearch`, `snackbar`, `t`
- the stores `currentOrg`, `isOrgAdmin` and `profile`
- the moving-icon `AnalyticsIcon`

Charts follow the browser-only `loadChart()` pattern of `features/marketing/components/trend-chart.svelte`.

The layerchart 2.2.0 props used here were checked against its type definitions in the main checkout's `node_modules`:
- `BarChart` `seriesLayout="group"`
- `PieChart` `innerRadius`
- `AreaChart` series `props.y0` / `props.y1`
- the `yDomain` and `legend` props on `Chart`

Nothing in this section has been compiled yet. Before treating the code as final, run svelte-check and the vitest files in 16.13.

Rules the code follows, from `AGENTS.md`:
- **Data flow:** components stay thin; logic lives in the API classes and `utils`. Types live in `utils/types.ts`, inferred from the RPC client.
- **Copy:** none in components; every string is a translation key.
- **Classes:** theme-token classes take `ui:`, standard Tailwind utilities do not.
- **State:** search and filters update on `input`. Bound state objects are mutated in place, never reassigned.
- **Loading:** org-scoped data loads in an `$effect` that waits for `$currentOrg.id`. Card rows show skeleton cards until their first result arrives, and keep the last result while a refetch runs.
- **Controls:** icon-only buttons use `variant="secondary"`.

Nothing here adds a component to `packages/ui`, so no Storybook story is needed. Every new component is insights-specific and reads translations.

### 16.1 File map

```
apps/dashboard/src/lib/features/insights/
├── index.ts
├── api/
│   ├── index.ts
│   ├── insights.svelte.ts          InsightsApi: dashboard, selection, per-widget results, polling, refresh
│   └── learners.svelte.ts          InsightsLearnersApi: search, filters, sort, paging, exercise cells, export
├── utils/
│   ├── types.ts                    RPC-inferred request/response types and view types
│   ├── insights-utils.ts           spec resolution, visibility, formatting, tones, chart adapters
│   ├── insights-utils.test.ts
│   ├── insights-export.ts          ExportDocument builder for the learners table
│   ├── insights-poller.ts          visibility-aware interval
│   └── insights-poller.test.ts
├── components/
│   ├── insights-dashboard.svelte   KPI row + 12-column widget grid
│   ├── insights-kpi-row.svelte
│   ├── insights-widget.svelte      card, skeleton, empty, error/retry, refetch dimming, renderer dispatch
│   ├── widget-skeleton.svelte
│   ├── updated-ago.svelte
│   ├── course-picker.svelte
│   ├── exercise-picker.svelte
│   ├── score-cell.svelte
│   ├── status-badge.svelte
│   ├── pass-required-tag.svelte
│   ├── sparkline.svelte
│   ├── charts/
│   │   ├── line-band-chart.svelte  average line + middle-50% band (+ optional learner overlay)
│   │   ├── multi-line-chart.svelte
│   │   ├── grouped-bar-chart.svelte
│   │   ├── column-chart.svelte
│   │   ├── donut-chart.svelte
│   │   └── hbar-list.svelte
│   ├── widgets/
│   │   ├── index.ts                widget-id → renderer, viz → renderer
│   │   ├── generic-table.svelte
│   │   ├── scores-by-exercise.svelte
│   │   ├── learner-progression.svelte
│   │   ├── learner-courses.svelte
│   │   ├── overdue-table.svelte
│   │   ├── section-scorecard.svelte
│   │   ├── cohorts-glance.svelte
│   │   └── hardest-questions.svelte
│   └── learners/
│       ├── learners-table.svelte
│       └── learners-toolbar.svelte
└── pages/
    ├── index.ts
    ├── cohort-insights.svelte
    ├── course-insights.svelte
    └── org-insights.svelte
```

The plan also edits these existing files:
- `features/ui/analytics/kpi-card.svelte`: show a skeleton when loading.
- `features/cohort/api/goal.svelte.ts` and `features/cohort/utils/types.ts`: the reminder calls.
- `features/cohort/components/sidebar/cohort-sidebar-navigation.svelte`
- `features/ui/navigation/org-navigation.ts`
- the three route folders
- `en.json`

### 16.2 Types: `utils/types.ts`

```ts
import { classroomio, type InferRequestType, type InferResponseType } from '$lib/utils/services/api';
import type { TInsightsStatus } from '@cio/utils/constants/insights';

export type InsightsQueryRequest = typeof classroomio.insights.query.$post;
export type InsightsExportRequest = typeof classroomio.insights.export.$post;
export type InsightsDashboardRequest = (typeof classroomio.insights.dashboards)[':scopeType'][':scopeId']['$get'];

type InsightsQuerySuccess = Extract<InferResponseType<InsightsQueryRequest>, { success: true }>;
export type InsightsResult = InsightsQuerySuccess['data'];
export type InsightsRow = InsightsResult['rows'][number];
export type InsightsCell = InsightsRow[string];
export type InsightsColumn = InsightsResult['columns'][number];

export type InsightsQueryBody = InferRequestType<InsightsQueryRequest>['json'];
export type InsightsSpec = InsightsQueryBody['spec'];
export type InsightsScopeRef = InsightsQueryBody['scope'];
export type InsightsScopeType = InsightsScopeRef['type'];
export type InsightsFilter = NonNullable<InsightsSpec['filters']>[number];

type InsightsDashboardSuccess = Extract<InferResponseType<InsightsDashboardRequest>, { success: true }>;
export type InsightsDashboard = InsightsDashboardSuccess['data'];
export type InsightsWidget = InsightsDashboard['widgets'][number];
export type InsightsScopeSummary = InsightsDashboard['scope'];
export type InsightsScopeCourse = InsightsScopeSummary['courses'][number];
export type InsightsCourseStructure = InsightsDashboard['structures'][string];
export type InsightsStructureItem = InsightsCourseStructure['items'][number];

export type InsightsSelection = {
  courseId: string | null;
  learnerId: string | null;
  exerciseId: string | null;
};

export type InsightsWidgetState = {
  result: InsightsResult | null;
  loading: boolean;
  failed: boolean;
};

export type InsightsTone = 'success' | 'info' | 'warning' | 'danger' | 'muted';

export type InsightsChartPoint = { key: string; label: string; rank: number } & Record<string, number | string | null>;

export type InsightsChartSeries = { key: string; label: string; color: string };

export type InsightsKpiDisplay = { value: string; description?: string };

export type WidgetRendererProps = { widget: InsightsWidget; result: InsightsResult };

export type DonutSegment = { key: string; label: string; value: number; color: string };

export type HbarItem = {
  key: string;
  label: string;
  value: number | null;
  display: string;
  hint?: string;
  tone?: InsightsTone;
};

export type LearnerStatusFilter = '' | TInsightsStatus;
export type LearnerActivityFilter = '' | 'today' | 'idle';
export type LearnerScoreFilter = '' | 'lt50' | 'mid' | 'gte70';
export type LearnerFlagFilter = '' | 'overdue' | 'certified' | 'not_certified';
export type LearnerSort = 'status' | 'progress' | 'name' | 'low_score';

export type LearnerFilters = {
  status: LearnerStatusFilter;
  activity: LearnerActivityFilter;
  score: LearnerScoreFilter;
  flag: LearnerFlagFilter;
};

export type LearnerExerciseCell = {
  scorePct: number | null;
  state: 'not_taken' | 'awaiting_grade' | 'graded';
  passed: boolean | null;
};

export type LearnerExportHeaders = {
  name: string;
  email: string;
  progress: string;
  averageScore: string;
  coursesCompleted: string;
  video: string;
  classroom: string;
  certificates: string;
  lastLogin: string;
  status: string;
  statusLabels: Record<TInsightsStatus, string>;
};
```

`InsightsSpec` is inferred from the query route, and its `limit` is a plain `number` in TypeScript. Each route's Zod schema enforces its own cap: 1,000 rows for `/query` and 50,000 for `/export`.

### 16.3 Utilities: `utils/insights-utils.ts`

```ts
import { INSIGHTS_PLACEHOLDERS, INSIGHTS_THRESHOLDS, type TInsightsStatus } from '@cio/utils/constants/insights';

import type {
  DonutSegment,
  HbarItem,
  InsightsCell,
  InsightsChartPoint,
  InsightsCourseStructure,
  InsightsDashboard,
  InsightsFilter,
  InsightsKpiDisplay,
  InsightsResult,
  InsightsRow,
  InsightsScopeCourse,
  InsightsSelection,
  InsightsSpec,
  InsightsStructureItem,
  InsightsTone,
  InsightsWidget,
  LearnerExerciseCell,
  LearnerFilters,
  LearnerSort
} from './types';

type Translate = (key: string, vars?: Record<string, string | number>) => string;

export const SELF_LOADING_WIDGET_IDS: ReadonlySet<string> = new Set(['learners']);

export const LEARNER_DETAIL_ELEMENT_ID = 'insights-learner-detail';

export const WIDGET_SPAN_CLASS: Record<number, string> = {
  4: 'lg:col-span-4',
  5: 'lg:col-span-5',
  6: 'lg:col-span-6',
  7: 'lg:col-span-7',
  8: 'lg:col-span-8',
  12: 'lg:col-span-12'
};

export const INSIGHTS_COLORS = {
  primary: 'var(--primary)',
  success: 'var(--success)',
  danger: 'var(--destructive)',
  warning: 'oklch(0.769 0.188 70.08)',
  muted: 'var(--chart-1)'
} as const;

export const SERIES_COLORS = [
  INSIGHTS_COLORS.primary,
  INSIGHTS_COLORS.success,
  INSIGHTS_COLORS.warning,
  INSIGHTS_COLORS.muted,
  INSIGHTS_COLORS.danger
] as const;

export const STATUS_COLORS: Record<TInsightsStatus, string> = {
  at_risk: INSIGHTS_COLORS.danger,
  lagging: INSIGHTS_COLORS.warning,
  on_track: INSIGHTS_COLORS.success,
  completed: INSIGHTS_COLORS.primary
};

const PLACEHOLDER_BY_KEY = {
  course: INSIGHTS_PLACEHOLDERS.course,
  learner: INSIGHTS_PLACEHOLDERS.learner,
  exercise: INSIGHTS_PLACEHOLDERS.exercise
} as const;

type PlaceholderKey = keyof typeof PLACEHOLDER_BY_KEY;

const SELECTION_BY_PLACEHOLDER: Record<PlaceholderKey, keyof InsightsSelection> = {
  course: 'courseId',
  learner: 'learnerId',
  exercise: 'exerciseId'
};

/** True when a widget's spec needs the given selection to be filled in before it can run. */
export function widgetUsesPlaceholder(widget: InsightsWidget, key: PlaceholderKey): boolean {
  return (widget.spec.filters ?? []).some((filter) => filter.value === PLACEHOLDER_BY_KEY[key]);
}

function fillPlaceholder(filter: InsightsFilter, selection: InsightsSelection): InsightsFilter | null {
  const placeholder = (Object.keys(PLACEHOLDER_BY_KEY) as PlaceholderKey[]).find(
    (key) => filter.value === PLACEHOLDER_BY_KEY[key]
  );
  if (!placeholder) return filter;

  const value = selection[SELECTION_BY_PLACEHOLDER[placeholder]];
  if (!value) return null;

  return { ...filter, value };
}

/**
 * The spec to send for a widget under the current selection, or null when a required selection is missing.
 * `courseMode: 'any'` widgets gain a course filter when a course is picked.
 */
export function resolveWidgetSpec(widget: InsightsWidget, selection: InsightsSelection): InsightsSpec | null {
  const filters: InsightsFilter[] = [];

  for (const filter of widget.spec.filters ?? []) {
    const filled = fillPlaceholder(filter, selection);
    if (!filled) return null;

    filters.push(filled);
  }

  const hasCourseFilter = filters.some((filter) => filter.field === 'course');
  if (widget.courseMode === 'any' && selection.courseId && !hasCourseFilter) {
    filters.push({ field: 'course', op: 'eq', value: selection.courseId });
  }

  return { ...widget.spec, filters };
}

/** The course the course-dependent widgets describe: the picked course, or the course itself in course scope. */
export function focusCourse(dashboard: InsightsDashboard, selection: InsightsSelection): InsightsScopeCourse | null {
  if (dashboard.scope.type === 'course') return dashboard.scope.courses[0] ?? null;

  return dashboard.scope.courses.find((course) => course.id === selection.courseId) ?? null;
}

export function isWidgetVisible(
  widget: InsightsWidget,
  dashboard: InsightsDashboard,
  selection: InsightsSelection
): boolean {
  if (widget.courseMode === 'all' && selection.courseId) return false;

  if (widget.courseMode === 'single' && !selection.courseId) return false;

  const course = focusCourse(dashboard, selection);
  if (widget.requires.includes('grouping') && !course?.isGrouped) return false;

  if (widget.requires.includes('pass_required') && !course?.hasPassRequired) return false;

  return true;
}

/** The course a cohort dashboard opens on: the only course when there is one, otherwise "All courses". */
export function defaultCourseId(dashboard: InsightsDashboard): string | null {
  if (dashboard.scope.type !== 'cohort') return null;

  return dashboard.scope.courses.length === 1 ? (dashboard.scope.courses[0]?.id ?? null) : null;
}

/** The exercise the course score histogram opens on: the last pass-required exercise, else the last exercise. */
export function defaultExerciseId(structure: InsightsCourseStructure | undefined): string | null {
  const exercises = (structure?.items ?? []).filter((item) => item.type === 'EXERCISE');
  const lastPassRequired = exercises.findLast((item) => item.isPassRequired);

  return lastPassRequired?.id ?? exercises.at(-1)?.id ?? null;
}

/** Columns for the learners matrix: locked exercises appear only when pass-required or already attempted. */
export function visibleExerciseColumns(
  structure: InsightsCourseStructure | undefined,
  attemptedByExercise: ReadonlyMap<string, number>
): InsightsStructureItem[] {
  return (structure?.items ?? []).filter(
    (item) =>
      item.type === 'EXERCISE' && (!item.isLocked || item.isPassRequired || (attemptedByExercise.get(item.id) ?? 0) > 0)
  );
}

/** exercise id → learners with at least one attempt, from the `scores_by_exercise` result. */
export function attemptedByExercise(result: InsightsResult | null): Map<string, number> {
  const attempted = new Map<string, number>();

  for (const row of result?.rows ?? []) {
    const exerciseId = textCell(row, 'exercise_id');
    if (!exerciseId) continue;

    attempted.set(exerciseId, numberCell(row, 'is_attempted__count_if') ?? 0);
  }

  return attempted;
}

export function numberCell(row: InsightsRow | undefined, key: string): number | null {
  const value = row?.[key];

  return typeof value === 'number' ? value : null;
}

export function textCell(row: InsightsRow | undefined, key: string): string | null {
  const value = row?.[key];

  return typeof value === 'string' ? value : null;
}

export function formatPercent(value: InsightsCell | undefined): string {
  return typeof value === 'number' ? `${Math.round(value)}%` : '–';
}

export function formatCount(value: InsightsCell | undefined): string {
  return typeof value === 'number' ? Math.round(value).toLocaleString() : '–';
}

export function percentOf(part: number | null, whole: number | null): number | null {
  if (part === null || !whole) return null;

  return (part / whole) * 100;
}

export function scoreTone(scorePct: number | null): InsightsTone {
  if (scorePct === null) return 'muted';

  if (scorePct >= 90) return 'success';

  if (scorePct >= 80) return 'info';

  if (scorePct >= 70) return 'warning';

  return 'danger';
}

export function passTone(scorePct: number | null, passMark: number | null): InsightsTone {
  if (scorePct === null || passMark === null) return scoreTone(scorePct);

  return scorePct >= passMark ? 'success' : 'danger';
}

export const TONE_CELL_CLASS: Record<InsightsTone, string> = {
  success: 'bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400',
  info: 'bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400',
  warning: 'bg-amber-50 text-amber-800 dark:bg-amber-950/30 dark:text-amber-400',
  danger: 'bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400',
  muted: 'bg-transparent ui:text-muted-foreground'
};

export const STATUS_BADGE_VARIANT: Record<TInsightsStatus, 'destructive' | 'warning' | 'success' | 'default'> = {
  at_risk: 'destructive',
  lagging: 'warning',
  on_track: 'success',
  completed: 'default'
};

export function isInsightsStatus(value: InsightsCell | undefined): value is TInsightsStatus {
  return value === 'at_risk' || value === 'lagging' || value === 'on_track' || value === 'completed';
}

export type CohortHealth = TInsightsStatus;

/** Cohort health from an aggregated "cohorts at a glance" row (section 3.9). */
export function cohortHealth(row: InsightsRow): CohortHealth {
  const learners = numberCell(row, 'rows__count') ?? 0;
  const completed = numberCell(row, 'is_completed_all__count_if') ?? 0;
  const atRisk = numberCell(row, 'is_at_risk__count_if') ?? 0;
  const averageScore = numberCell(row, 'avg_score_pct__avg');

  if (learners > 0 && completed / learners >= 0.95) return 'completed';

  if (learners > 0 && atRisk / learners >= 0.2) return 'at_risk';

  if (averageScore !== null && averageScore < INSIGHTS_THRESHOLDS.laggingScorePct) return 'lagging';

  return 'on_track';
}

/** Learners per cohort-health bucket, for the org "learners by cohort health" donut. */
export function toHealthSegments(result: InsightsResult, translate: Translate): DonutSegment[] {
  const learnersByHealth = new Map<CohortHealth, number>();

  for (const row of result.rows) {
    const health = cohortHealth(row);
    const learners = numberCell(row, 'rows__count') ?? 0;
    learnersByHealth.set(health, (learnersByHealth.get(health) ?? 0) + learners);
  }

  return [...learnersByHealth.entries()].map(([health, value]) => {
    const label = translate(`insights.status.${health}`);

    return { key: health, label, value, color: STATUS_COLORS[health] };
  });
}

export function formatUpdatedAgo(generatedAt: string | null, now: number, translate: Translate): string {
  if (!generatedAt) return '';

  const seconds = Math.max(0, Math.round((now - Date.parse(generatedAt)) / 1000));
  if (seconds < 60) return translate('insights.updated_seconds_ago', { count: seconds });

  return translate('insights.updated_minutes_ago', { count: Math.floor(seconds / 60) });
}

/** The oldest `generatedAt` among loaded widgets, so the page never looks fresher than its stalest number. */
export function oldestGeneratedAt(results: ReadonlyArray<InsightsResult | null>): string | null {
  const timestamps = results.flatMap((result) => (result ? [result.generatedAt] : []));
  if (timestamps.length === 0) return null;

  return timestamps.reduce((oldest, timestamp) => (Date.parse(timestamp) < Date.parse(oldest) ? timestamp : oldest));
}

const BUCKET_TRANSLATION_PREFIX: Record<string, string> = {
  progress_bucket_25: 'insights.buckets.progress',
  score_bucket_10: 'insights.buckets.score'
};

/** Display label for a dimension value, including the null buckets "Not in a section" and "No cohort". */
export function dimensionLabel(row: InsightsRow, dimension: string, translate: Translate): string {
  const id = row[`${dimension}_id`];
  const label = textCell(row, `${dimension}_label`);
  const bucketPrefix = BUCKET_TRANSLATION_PREFIX[dimension];

  if (bucketPrefix) return translate(`${bucketPrefix}.${id}`);

  if (dimension === 'status') return translate(`insights.status.${id}`);

  if (dimension === 'day' || dimension === 'week') {
    return typeof id === 'string' ? new Date(`${id}T00:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : '';
  }

  if (id === null && dimension === 'section') return translate('insights.not_in_section');

  if (id === null && dimension === 'cohort') return translate('insights.no_cohort');

  return label ?? String(id ?? '');
}

/** One chart point per row of the first dimension, keyed by measure alias, in rank then label order. */
export function toChartPoints(result: InsightsResult, dimension: string, translate: Translate): InsightsChartPoint[] {
  const measureKeys = result.columns.filter((column) => column.role === 'measure').map((column) => column.key);

  return result.rows.map((row, index) => {
    const values = Object.fromEntries(measureKeys.map((key) => [key, numberCell(row, key)]));
    const label = dimensionLabel(row, dimension, translate);

    return {
      ...values,
      key: String(row[`${dimension}_id`] ?? `none-${index}`),
      label,
      rank: numberCell(row, `${dimension}_rank`) ?? index
    };
  });
}

function createChartPoint(
  row: InsightsRow,
  dimension: string,
  key: string,
  index: number,
  translate: Translate
): InsightsChartPoint {
  const label = dimensionLabel(row, dimension, translate);
  const rank = numberCell(row, `${dimension}_rank`) ?? index;

  return { key, label, rank };
}

/** Rows of a two-dimension result reshaped as one point per first-dimension value with a column per series key. */
export function toSeriesPoints(
  result: InsightsResult,
  xDimension: string,
  seriesDimension: string,
  measureKey: string,
  translate: Translate
): { points: InsightsChartPoint[]; seriesKeys: Array<{ key: string; label: string }> } {
  const pointsByKey = new Map<string, InsightsChartPoint>();
  const seriesByKey = new Map<string, string>();

  result.rows.forEach((row, index) => {
    const xKey = String(row[`${xDimension}_id`] ?? `none-${index}`);
    const seriesKey = String(row[`${seriesDimension}_id`] ?? 'none');
    const point = pointsByKey.get(xKey) ?? createChartPoint(row, xDimension, xKey, index, translate);

    point[seriesKey] = numberCell(row, measureKey);
    pointsByKey.set(xKey, point);
    seriesByKey.set(seriesKey, dimensionLabel(row, seriesDimension, translate));
  });

  const points = [...pointsByKey.values()].sort((left, right) => left.rank - right.rank);
  const seriesKeys = [...seriesByKey.entries()].map(([key, label]) => ({ key, label }));

  return { points, seriesKeys };
}

/** Donut segments for a one-dimension result, coloured by status when the dimension is `status`. */
export function toDonutSegments(result: InsightsResult, dimension: string, translate: Translate): DonutSegment[] {
  const measureKey = result.columns.find((column) => column.role === 'measure')?.key ?? '';

  return result.rows.map((row, index) => {
    const id = row[`${dimension}_id`];
    const color = isInsightsStatus(id) ? STATUS_COLORS[id] : SERIES_COLORS[index % SERIES_COLORS.length];
    const label = dimensionLabel(row, dimension, translate);
    const value = numberCell(row, measureKey) ?? 0;

    return { key: String(id ?? index), label, value, color };
  });
}

/**
 * Bars for an `hbar` widget: one per dimension value, or, with no dimension, one per measure (the needs-attention
 * shape). Percent measures are shown as percentages, counts as counts.
 */
export function toHbarItems(result: InsightsResult, dimension: string | null, translate: Translate): HbarItem[] {
  const measures = result.columns.filter((column) => column.role === 'measure');
  const firstMeasure = measures[0];
  if (!firstMeasure) return [];

  const isPercent = firstMeasure.valueType === 'percent';
  const format = isPercent ? formatPercent : formatCount;

  if (!dimension) {
    const row = result.rows[0];

    return measures.map((measure) => {
      const value = numberCell(row, measure.key);
      const label = translate(`insights.measures.${measure.key}`);

      return { key: measure.key, label, value, display: format(value), tone: 'danger' };
    });
  }

  return toChartPoints(result, dimension, translate).map((point) => {
    const raw = point[firstMeasure.key];
    const value = typeof raw === 'number' ? raw : null;

    return { key: point.key, label: point.label, value, display: format(value) };
  });
}

export function hbarMax(items: HbarItem[], isPercent: boolean): number {
  if (isPercent) return 100;

  return Math.max(1, ...items.map((item) => item.value ?? 0));
}

export const LEARNER_FILTER_OPTIONS: { [Key in keyof LearnerFilters]: ReadonlyArray<LearnerFilters[Key]> } = {
  status: ['', 'at_risk', 'lagging', 'on_track', 'completed'],
  activity: ['', 'today', 'idle'],
  score: ['', 'lt50', 'mid', 'gte70'],
  flag: ['', 'overdue', 'certified', 'not_certified']
};

export const LEARNER_SORTS: readonly LearnerSort[] = ['status', 'progress', 'name', 'low_score'];

export function isLearnerFilterValue(key: keyof LearnerFilters, value: string): boolean {
  return (LEARNER_FILTER_OPTIONS[key] as readonly string[]).includes(value);
}

export function isLearnerSort(value: string): value is LearnerSort {
  return (LEARNER_SORTS as readonly string[]).includes(value);
}

const LEARNER_SORT_SPEC: Record<LearnerSort, InsightsSpec['sort']> = {
  status: [
    { field: 'status_rank__value', dir: 'asc' },
    { field: 'avg_score_pct__value', dir: 'asc' }
  ],
  progress: [{ field: 'overall_progress_pct__value', dir: 'asc' }],
  name: [{ field: 'learner', dir: 'asc' }],
  low_score: [{ field: 'avg_score_pct__value', dir: 'asc' }]
};

/** Server filters and sort for the learners table toolbar. */
export function learnerQueryParts(
  filters: LearnerFilters,
  sort: LearnerSort
): { filters: InsightsFilter[]; sort: InsightsSpec['sort'] } {
  const specFilters: InsightsFilter[] = [];

  if (filters.status) specFilters.push({ field: 'status', op: 'eq', value: filters.status });

  if (filters.activity === 'today') specFilters.push({ field: 'logged_in_today', op: 'is_true' });

  if (filters.activity === 'idle') specFilters.push({ field: 'is_inactive', op: 'is_true' });

  if (filters.score === 'lt50') specFilters.push({ field: 'avg_score_pct', op: 'lt', value: 50 });

  if (filters.score === 'mid') {
    specFilters.push({ field: 'avg_score_pct', op: 'gte', value: 50 }, { field: 'avg_score_pct', op: 'lt', value: 70 });
  }

  if (filters.score === 'gte70') specFilters.push({ field: 'avg_score_pct', op: 'gte', value: 70 });

  if (filters.flag === 'overdue') specFilters.push({ field: 'is_overdue', op: 'is_true' });

  if (filters.flag === 'certified') specFilters.push({ field: 'has_certificate', op: 'is_true' });

  if (filters.flag === 'not_certified') specFilters.push({ field: 'has_certificate', op: 'is_false' });

  return { filters: specFilters, sort: LEARNER_SORT_SPEC[sort] };
}

export function countActiveLearnerFilters(filters: LearnerFilters): number {
  return Object.values(filters).filter(Boolean).length;
}

function isExerciseState(value: InsightsCell | undefined): value is LearnerExerciseCell['state'] {
  return value === 'not_taken' || value === 'awaiting_grade' || value === 'graded';
}

/** learner id → exercise id → cell, from an `assessment_result` result grouped by learner and exercise. */
export function pivotLearnerExercises(result: InsightsResult): Record<string, Record<string, LearnerExerciseCell>> {
  const cells: Record<string, Record<string, LearnerExerciseCell>> = {};

  for (const row of result.rows) {
    const learnerId = textCell(row, 'learner_id');
    const exerciseId = textCell(row, 'exercise_id');
    if (!learnerId || !exerciseId) continue;

    const state = row['state__value'];
    const passed = row['passed__value'];

    cells[learnerId] ??= {};
    cells[learnerId][exerciseId] = {
      scorePct: numberCell(row, 'best_score_pct__value'),
      state: isExerciseState(state) ? state : 'not_taken',
      passed: typeof passed === 'boolean' ? passed : null
    };
  }

  return cells;
}

const KPI_FORMATTERS: Record<string, (row: InsightsRow | undefined, translate: Translate) => InsightsKpiDisplay> = {
  kpi_logged_in_today: (row, translate) => {
    const active = numberCell(row, 'logged_in_today__count_if');
    const total = numberCell(row, 'rows__count');
    const value = `${formatCount(active)} / ${formatCount(total)}`;
    const percent = formatPercent(percentOf(active, total));
    const description = translate('insights.kpi.share_of_learners', { percent });

    return { value, description };
  },
  kpi_logged_in_week: (row, translate) => {
    const active = numberCell(row, 'logged_in_week__count_if');
    const total = numberCell(row, 'rows__count');
    const percent = formatPercent(percentOf(active, total));
    const description = translate('insights.kpi.share_of_learners', { percent });

    return { value: formatCount(active), description };
  },
  kpi_avg_progress: (row, translate) => ({
    value: formatPercent(row?.['overall_progress_pct__avg']),
    description: translate('insights.kpi.avg_progress_hint')
  }),
  kpi_avg_score: (row, translate) => ({
    value: formatPercent(row?.['avg_score_pct__avg']),
    description: translate('insights.kpi.avg_score_hint')
  }),
  kpi_overdue: (row, translate) => ({
    value: formatCount(row?.['is_overdue__count_if']),
    description: translate('insights.kpi.overdue_hint')
  }),
  kpi_completed: (row, translate) => ({
    value: formatCount(row?.['is_completed_all__count_if']),
    description: translate('insights.kpi.certified', { count: numberCell(row, 'certificates__sum') ?? 0 })
  }),
  kpi_enrolled: (row) => ({ value: formatCount(row?.['rows__count']) }),
  kpi_completion_rate: (row) => ({ value: formatPercent(row?.['is_completed__rate']) }),
  kpi_required_pass_rate: (row, translate) => ({
    value: formatPercent(row?.['required_pass__pooled']),
    description: translate('insights.kpi.required_pass_hint')
  }),
  kpi_median_days: (row, translate) => {
    const days = numberCell(row, 'days_to_finish__median');

    return { value: days === null ? '–' : translate('insights.kpi.days', { count: Math.round(days) }) };
  },
  kpi_completions: (row, translate) => ({
    value: formatCount(row?.['is_completed__count_if']),
    description: translate('insights.kpi.certified', { count: numberCell(row, 'is_certified__count_if') ?? 0 })
  }),
  kpi_needs_attention: (row, translate) => ({
    value: formatCount(row?.['is_at_risk__count_if']),
    description: translate('insights.kpi.needs_attention_hint')
  })
};

export function formatKpi(widget: InsightsWidget, result: InsightsResult | null, translate: Translate): InsightsKpiDisplay {
  const formatter = KPI_FORMATTERS[widget.id];
  const row = result?.rows[0];
  if (formatter) return formatter(row, translate);

  const firstMeasure = widget.spec.measures[0];
  const value = formatCount(row?.[`${firstMeasure?.metric}__${firstMeasure?.agg}`]);

  return { value };
}
```

`Array.prototype.findLast` needs ES2023 in the dashboard's `lib`. If the compile target rejects it, use `[...exercises].reverse().find(…)`.

`utils/insights-poller.ts`:

```ts
/**
 * Calls `onTick` every interval while the tab is visible. While hidden it skips ticks, then fires once on return.
 */
export class InsightsPoller {
  readonly #intervalMs: number;
  readonly #onTick: () => void;
  #timer: ReturnType<typeof setInterval> | undefined;
  #missedTick = false;

  constructor(intervalMs: number, onTick: () => void) {
    this.#intervalMs = intervalMs;
    this.#onTick = onTick;
  }

  start() {
    this.stop();
    document.addEventListener('visibilitychange', this.#handleVisibilityChange);
    this.#timer = setInterval(this.#tick, this.#intervalMs);
  }

  stop() {
    document.removeEventListener('visibilitychange', this.#handleVisibilityChange);
    if (this.#timer === undefined) return;

    clearInterval(this.#timer);
    this.#timer = undefined;
  }

  #tick = () => {
    if (document.visibilityState !== 'visible') {
      this.#missedTick = true;
      return;
    }

    this.#onTick();
  };

  #handleVisibilityChange = () => {
    if (document.visibilityState !== 'visible' || !this.#missedTick) return;

    this.#missedTick = false;
    this.#onTick();
  };
}
```

`utils/insights-export.ts`:

```ts
import type { ExportDocument } from '@cio/utils/export';

import { isInsightsStatus, numberCell, textCell } from './insights-utils';
import type { InsightsRow, InsightsStructureItem, LearnerExerciseCell, LearnerExportHeaders } from './types';

type LearnerExportRow = { row: InsightsRow; cells: Record<string, LearnerExerciseCell> };

function roundOrNull(value: number | null): number | null {
  return value === null ? null : Math.round(value);
}

/** The learners table as an export document, with one column per exercise when a course is picked. */
export function buildLearnersExportDocument(params: {
  filename: string;
  title: string;
  subtitle?: string;
  headers: LearnerExportHeaders;
  rows: LearnerExportRow[];
  exercises: InsightsStructureItem[];
}): ExportDocument<LearnerExportRow> {
  const { headers } = params;
  const exerciseColumns = params.exercises.map((exercise) => ({
    key: `exercise_${exercise.id}`,
    header: exercise.title,
    value: (entry: LearnerExportRow) => roundOrNull(entry.cells[exercise.id]?.scorePct ?? null)
  }));

  const columns = [
    { key: 'name', header: headers.name, value: (entry: LearnerExportRow) => textCell(entry.row, 'name__value') },
    { key: 'email', header: headers.email, value: (entry: LearnerExportRow) => textCell(entry.row, 'email__value') },
    {
      key: 'progress',
      header: headers.progress,
      value: (entry: LearnerExportRow) => roundOrNull(numberCell(entry.row, 'overall_progress_pct__value'))
    },
    {
      key: 'average_score',
      header: headers.averageScore,
      value: (entry: LearnerExportRow) => roundOrNull(numberCell(entry.row, 'avg_score_pct__value'))
    },
    {
      key: 'courses_completed',
      header: headers.coursesCompleted,
      value: (entry: LearnerExportRow) => numberCell(entry.row, 'courses_completed__value')
    },
    ...exerciseColumns,
    { key: 'video', header: headers.video, value: (entry: LearnerExportRow) => roundOrNull(numberCell(entry.row, 'video_pct__value')) },
    {
      key: 'classroom',
      header: headers.classroom,
      value: (entry: LearnerExportRow) => roundOrNull(numberCell(entry.row, 'attendance_pct__value'))
    },
    {
      key: 'certificates',
      header: headers.certificates,
      value: (entry: LearnerExportRow) => numberCell(entry.row, 'certificates__value')
    },
    { key: 'last_login', header: headers.lastLogin, value: (entry: LearnerExportRow) => textCell(entry.row, 'last_login_at__value') },
    {
      key: 'status',
      header: headers.status,
      value: (entry: LearnerExportRow) => {
        const status = entry.row['status__value'];

        return isInsightsStatus(status) ? headers.statusLabels[status] : null;
      }
    }
  ];

  return { filename: params.filename, title: params.title, subtitle: params.subtitle, columns, rows: params.rows };
}
```

### 16.4 API classes

`api/insights.svelte.ts`:

```ts
import { BaseApi, classroomio } from '$lib/utils/services/api';

import {
  defaultCourseId,
  defaultExerciseId,
  isWidgetVisible,
  oldestGeneratedAt,
  resolveWidgetSpec,
  SELF_LOADING_WIDGET_IDS,
  widgetUsesPlaceholder
} from '../utils/insights-utils';
import type {
  InsightsDashboard,
  InsightsDashboardRequest,
  InsightsQueryRequest,
  InsightsResult,
  InsightsScopeRef,
  InsightsSelection,
  InsightsWidget,
  InsightsWidgetState
} from '../utils/types';

const IDLE_WIDGET: InsightsWidgetState = { result: null, loading: false, failed: false };

class InsightsApi extends BaseApi {
  scope = $state<InsightsScopeRef | null>(null);
  dashboard = $state<InsightsDashboard | null>(null);
  dashboardFailed = $state(false);
  selection = $state<InsightsSelection>({ courseId: null, learnerId: null, exerciseId: null });
  widgetStates = $state<Record<string, InsightsWidgetState>>({});

  #dashboardSeq = 0;
  #widgetSeq = new Map<string, number>();

  get visibleWidgets(): InsightsWidget[] {
    const dashboard = this.dashboard;
    if (!dashboard) return [];

    return dashboard.widgets.filter((widget) => isWidgetVisible(widget, dashboard, this.selection));
  }

  get generatedAt(): string | null {
    const results = this.visibleWidgets.map((widget) => this.widgetState(widget.id).result);

    return oldestGeneratedAt(results);
  }

  get isRefetching(): boolean {
    return Object.values(this.widgetStates).some((state) => state.loading && state.result !== null);
  }

  widgetState(widgetId: string): InsightsWidgetState {
    return this.widgetStates[widgetId] ?? IDLE_WIDGET;
  }

  widgetResult(widgetId: string): InsightsResult | null {
    return this.widgetState(widgetId).result;
  }

  async loadDashboard(scope: InsightsScopeRef) {
    this.#dashboardSeq += 1;
    const dashboardSeq = this.#dashboardSeq;

    this.#resetView(scope);

    await this.execute<InsightsDashboardRequest>({
      requestFn: () =>
        classroomio.insights.dashboards[':scopeType'][':scopeId'].$get({
          param: { scopeType: scope.type, scopeId: scope.id }
        }),
      logContext: 'loading insights dashboard',
      onSuccess: (response) => {
        if (dashboardSeq !== this.#dashboardSeq) return;

        this.dashboard = response.data;
        this.selection.courseId = defaultCourseId(response.data);
        this.selection.exerciseId = this.#defaultExercise(response.data);
      },
      onError: () => {
        if (dashboardSeq !== this.#dashboardSeq) return;

        this.dashboardFailed = true;
      }
    });

    if (dashboardSeq !== this.#dashboardSeq) return;

    await this.runVisibleWidgets();
  }

  async runVisibleWidgets(options: { refresh?: boolean } = {}) {
    const widgets = this.visibleWidgets.filter((widget) => !SELF_LOADING_WIDGET_IDS.has(widget.id));

    await Promise.all(widgets.map((widget) => this.runWidget(widget, options)));
  }

  async runWidget(widget: InsightsWidget, options: { refresh?: boolean } = {}) {
    const scope = this.scope;
    const spec = resolveWidgetSpec(widget, this.selection);
    if (!scope || !spec) return;

    const widgetSeq = (this.#widgetSeq.get(widget.id) ?? 0) + 1;
    const previous = this.widgetState(widget.id);
    this.#widgetSeq.set(widget.id, widgetSeq);
    this.widgetStates[widget.id] = { ...previous, loading: true, failed: false };

    await this.execute<InsightsQueryRequest>({
      requestFn: () => classroomio.insights.query.$post({ json: { scope, spec, refresh: options.refresh } }),
      logContext: `loading insights widget ${widget.id}`,
      onSuccess: (response) => {
        if (this.#widgetSeq.get(widget.id) !== widgetSeq) return;

        this.widgetStates[widget.id] = { result: response.data, loading: false, failed: false };
      },
      onError: () => {
        if (this.#widgetSeq.get(widget.id) !== widgetSeq) return;

        this.widgetStates[widget.id] = { ...previous, loading: false, failed: true };
      }
    });
  }

  async selectCourse(courseId: string | null) {
    this.selection.courseId = courseId;
    this.selection.exerciseId = null;

    await this.runVisibleWidgets();
  }

  async selectLearner(learnerId: string) {
    this.selection.learnerId = learnerId;
    const widgets = this.visibleWidgets.filter((widget) => widgetUsesPlaceholder(widget, 'learner'));

    await Promise.all(widgets.map((widget) => this.runWidget(widget)));
  }

  async selectExercise(exerciseId: string) {
    this.selection.exerciseId = exerciseId;
    const widgets = this.visibleWidgets.filter((widget) => widgetUsesPlaceholder(widget, 'exercise'));

    await Promise.all(widgets.map((widget) => this.runWidget(widget)));
  }

  refreshAll() {
    return this.runVisibleWidgets({ refresh: true });
  }

  poll() {
    return this.runVisibleWidgets();
  }

  reset() {
    this.#dashboardSeq += 1;
    this.#resetView(null);
  }

  #resetView(scope: InsightsScopeRef | null) {
    this.scope = scope;
    this.dashboard = null;
    this.dashboardFailed = false;
    this.widgetStates = {};
    this.selection.courseId = null;
    this.selection.learnerId = null;
    this.selection.exerciseId = null;
    this.#widgetSeq.clear();
  }

  #defaultExercise(dashboard: InsightsDashboard): string | null {
    if (dashboard.scope.type !== 'course') return null;

    const courseId = dashboard.scope.courses[0]?.id;

    return courseId ? defaultExerciseId(dashboard.structures[courseId]) : null;
  }
}

export const insightsApi = new InsightsApi();
```

`api/learners.svelte.ts`:

```ts
import { INSIGHTS_LIMITS } from '@cio/utils/constants/insights';
import type { ExportDocument } from '@cio/utils/export';
import { BaseApi, classroomio } from '$lib/utils/services/api';

import { buildLearnersExportDocument } from '../utils/insights-export';
import {
  isLearnerFilterValue,
  isLearnerSort,
  learnerQueryParts,
  pivotLearnerExercises,
  visibleExerciseColumns
} from '../utils/insights-utils';
import type {
  InsightsExportRequest,
  InsightsQueryRequest,
  InsightsResult,
  InsightsRow,
  InsightsSpec,
  LearnerExerciseCell,
  LearnerExportHeaders,
  LearnerFilters,
  LearnerSort
} from '../utils/types';
import { insightsApi } from './insights.svelte';

const LEARNER_MEASURES: InsightsSpec['measures'] = [
  { metric: 'name', agg: 'value' },
  { metric: 'email', agg: 'value' },
  { metric: 'avatar_url', agg: 'value' },
  { metric: 'overall_progress_pct', agg: 'value' },
  { metric: 'avg_score_pct', agg: 'value' },
  { metric: 'courses_completed', agg: 'value' },
  { metric: 'courses_total', agg: 'value' },
  { metric: 'video_pct', agg: 'value' },
  { metric: 'attendance_pct', agg: 'value' },
  { metric: 'certificates', agg: 'value' },
  { metric: 'last_login_at', agg: 'value' },
  { metric: 'is_overdue', agg: 'value' },
  { metric: 'status', agg: 'value' },
  { metric: 'status_rank', agg: 'value' }
];

const EXERCISE_MEASURES: InsightsSpec['measures'] = [
  { metric: 'best_score_pct', agg: 'value' },
  { metric: 'state', agg: 'value' },
  { metric: 'passed', agg: 'value' }
];

function chunkIds(ids: string[], size: number): string[][] {
  const chunks: string[][] = [];

  for (let start = 0; start < ids.length; start += size) {
    chunks.push(ids.slice(start, start + size));
  }

  return chunks;
}

class InsightsLearnersApi extends BaseApi {
  rows = $state<InsightsRow[]>([]);
  total = $state(0);
  cells = $state<Record<string, Record<string, LearnerExerciseCell>>>({});
  filters = $state<LearnerFilters>({ status: '', activity: '', score: '', flag: '' });
  sort = $state<LearnerSort>('status');
  search = $state('');
  hasLoaded = $state(false);
  loadingPage = $state(false);
  loadingMore = $state(false);
  failed = $state(false);

  #seq = 0;

  get hasMore(): boolean {
    return this.rows.length < this.total;
  }

  #learnerSpec(page: number, limit: number): InsightsSpec {
    const parts = learnerQueryParts(this.filters, this.sort);
    const courseId = insightsApi.selection.courseId;
    const courseFilter = courseId ? [{ field: 'course' as const, op: 'eq' as const, value: courseId }] : [];

    return {
      source: 'learner',
      dimensions: ['learner'],
      measures: LEARNER_MEASURES,
      filters: [...parts.filters, ...courseFilter],
      sort: parts.sort,
      search: this.search || undefined,
      limit,
      page
    };
  }

  #exerciseSpec(learnerIds: string[] | null, courseId: string, limit: number): InsightsSpec {
    const learnerFilter = learnerIds ? [{ field: 'learner' as const, op: 'in' as const, value: learnerIds }] : [];

    return {
      source: 'assessment_result',
      dimensions: ['learner', 'exercise'],
      measures: EXERCISE_MEASURES,
      filters: [{ field: 'course', op: 'eq', value: courseId }, ...learnerFilter],
      limit
    };
  }

  async #query(spec: InsightsSpec): Promise<InsightsResult | null> {
    const scope = insightsApi.scope;
    if (!scope) return null;

    const response = await this.execute<InsightsQueryRequest>({
      requestFn: () => classroomio.insights.query.$post({ json: { scope, spec } }),
      logContext: 'loading insights learners'
    });

    return response?.data ?? null;
  }

  async #loadCells(rows: InsightsRow[], seq: number) {
    const courseId = insightsApi.selection.courseId;
    const learnerIds = rows.flatMap((row) => (typeof row['learner_id'] === 'string' ? [row['learner_id']] : []));
    if (!courseId || learnerIds.length === 0) return;

    const structure = insightsApi.dashboard?.structures[courseId];
    const exerciseCount = Math.max(1, structure?.items.filter((item) => item.type === 'EXERCISE').length ?? 0);
    const chunkSize = Math.max(1, Math.min(INSIGHTS_LIMITS.maxFilterValues, Math.floor(INSIGHTS_LIMITS.maxRows / exerciseCount)));
    const chunks = chunkIds(learnerIds, chunkSize);
    const results = await Promise.all(
      chunks.map((ids) => this.#query(this.#exerciseSpec(ids, courseId, ids.length * exerciseCount)))
    );
    if (seq !== this.#seq) return;

    const pivots = results.flatMap((result) => (result ? [pivotLearnerExercises(result)] : []));
    this.cells = Object.assign({}, this.cells, ...pivots);
  }

  /** Loads the first page for the current selection, search, filters and sort. Keeps old rows until it lands. */
  async load() {
    this.#seq += 1;
    const seq = this.#seq;
    this.loadingPage = true;
    this.failed = false;

    const result = await this.#query(this.#learnerSpec(0, INSIGHTS_LIMITS.pageSize));
    if (seq !== this.#seq) return;

    this.loadingPage = false;
    this.hasLoaded = true;

    if (!result) {
      this.failed = true;
      return;
    }

    this.rows = result.rows;
    this.total = result.total;
    this.cells = {};
    await this.#loadCells(result.rows, seq);
  }

  async loadMore() {
    if (this.loadingMore || !this.hasMore) return;

    const seq = this.#seq;
    this.loadingMore = true;

    const result = await this.#query(this.#learnerSpec(this.rows.length, INSIGHTS_LIMITS.pageSize));
    this.loadingMore = false;
    if (!result || seq !== this.#seq) return;

    this.rows = [...this.rows, ...result.rows];
    this.total = result.total;
    await this.#loadCells(result.rows, seq);
  }

  /** Reloads every row already on screen, for polling and Refresh, without collapsing "Show more". */
  async refreshVisible() {
    const seq = this.#seq;
    const limit = Math.min(INSIGHTS_LIMITS.maxRows, Math.max(INSIGHTS_LIMITS.pageSize, this.rows.length));
    const result = await this.#query(this.#learnerSpec(0, limit));
    if (!result || seq !== this.#seq) return;

    this.rows = result.rows;
    this.total = result.total;
    await this.#loadCells(result.rows, seq);
  }

  setSearch(search: string) {
    this.search = search;

    return this.load();
  }

  setSort(sort: LearnerSort) {
    this.sort = sort;

    return this.load();
  }

  /** Applies a toolbar value, ignoring anything that is not one of that filter's options. */
  setFilter(key: keyof LearnerFilters, value: string) {
    if (!isLearnerFilterValue(key, value)) return;

    Object.assign(this.filters, { [key]: value });

    return this.load();
  }

  setSortValue(value: string) {
    if (!isLearnerSort(value)) return;

    return this.setSort(value);
  }

  clearFilters() {
    this.filters.status = '';
    this.filters.activity = '';
    this.filters.score = '';
    this.filters.flag = '';

    return this.load();
  }

  reset() {
    this.#seq += 1;
    this.rows = [];
    this.total = 0;
    this.cells = {};
    this.search = '';
    this.sort = 'status';
    this.hasLoaded = false;
    this.failed = false;
    this.filters.status = '';
    this.filters.activity = '';
    this.filters.score = '';
    this.filters.flag = '';
  }

  async #export(spec: InsightsSpec): Promise<InsightsResult | null> {
    const scope = insightsApi.scope;
    if (!scope) return null;

    const response = await this.execute<InsightsExportRequest>({
      requestFn: () => classroomio.insights.export.$post({ json: { scope, spec } }),
      logContext: 'exporting insights learners'
    });

    return response?.data ?? null;
  }

  /** Every matching learner, read fresh, with exercise columns when a course is picked. */
  async buildExportDocument(params: {
    filename: string;
    title: string;
    subtitle?: string;
    headers: LearnerExportHeaders;
    attemptedByExercise: ReadonlyMap<string, number>;
  }): Promise<ExportDocument<{ row: InsightsRow; cells: Record<string, LearnerExerciseCell> }>> {
    const courseId = insightsApi.selection.courseId;
    const learners = await this.#export(this.#learnerSpec(0, INSIGHTS_LIMITS.maxExportRows));
    const exerciseResult = courseId
      ? await this.#export(this.#exerciseSpec(null, courseId, INSIGHTS_LIMITS.maxExportRows))
      : null;
    const cells = exerciseResult ? pivotLearnerExercises(exerciseResult) : {};
    const structure = courseId ? insightsApi.dashboard?.structures[courseId] : undefined;
    const exercises = courseId ? visibleExerciseColumns(structure, params.attemptedByExercise) : [];
    const rows = (learners?.rows ?? []).map((row) => {
      const learnerCells = cells[String(row['learner_id'])] ?? {};

      return { row, cells: learnerCells };
    });

    return buildLearnersExportDocument({
      filename: params.filename,
      title: params.title,
      subtitle: params.subtitle,
      headers: params.headers,
      rows,
      exercises
    });
  }
}

export const insightsLearnersApi = new InsightsLearnersApi();
```

The export spec gets `limit: maxExportRows`, but `ZInsightsQuerySpec` caps `limit` at `maxRows`. The export body is validated by `ZInsightsExportSpec`, so type `#export`'s argument as `InferRequestType<InsightsExportRequest>['json']['spec']` once the RPC types exist. `#learnerSpec` returns a value both accept.

`api/index.ts`:

```ts
export { insightsApi } from './insights.svelte';
export { insightsLearnersApi } from './learners.svelte';
```

**Reminder calls** go in `features/cohort/api/goal.svelte.ts`, added to `CohortGoalApi`. Snackbar messages are translation keys, as `AGENTS.md` prescribes. `t.get` is used only where a count is interpolated:

```ts
  async remindAssignment(cohortId: string, assignmentId: string): Promise<void> {
    await this.execute<RemindGoalAssignmentRequest>({
      requestFn: () =>
        classroomio.cohort[':cohortId']['goal-assignments'][':assignmentId'].remind.$post({
          param: { cohortId, assignmentId }
        }),
      logContext: 'sending cohort goal reminder',
      onSuccess: (response) => {
        if (response.data.enqueued) {
          snackbar.success('snackbar.insights.reminder_sent');
          return;
        }

        snackbar.info('snackbar.insights.reminder_not_sent');
      },
      onError: () => snackbar.error('snackbar.insights.reminder_failed')
    });
  }

  async remindOverdue(cohortId: string, courseId: string | null): Promise<void> {
    const toastId = snackbar.loading(t.get('snackbar.insights.reminders_sending'));
    const json = courseId ? { courseId } : {};

    await this.execute<RemindOverdueGoalsRequest>({
      requestFn: () =>
        classroomio.cohort[':cohortId']['goal-assignments']['remind-overdue'].$post({ param: { cohortId }, json }),
      logContext: 'sending overdue cohort goal reminders',
      onSuccess: (response) => {
        snackbar.success(t.get('snackbar.insights.reminders_sent', { count: response.data.enqueued }), toastId);
      },
      onError: () => snackbar.error('snackbar.insights.reminder_failed', toastId)
    });
  }
```

Add the matching types to `features/cohort/utils/types.ts`, next to `GoalsOverviewRequest`:

```ts
export type RemindGoalAssignmentRequest =
  (typeof classroomio.cohort)[':cohortId']['goal-assignments'][':assignmentId']['remind']['$post'];
export type RemindOverdueGoalsRequest =
  (typeof classroomio.cohort)[':cohortId']['goal-assignments']['remind-overdue']['$post'];
```

### 16.5 `KpiCard` skeleton: `features/ui/analytics/kpi-card.svelte`

`KpiCard` shows a `Spinner` while it loads. That breaks the skeleton-cards rule, and the row jumps when values land. Replace the spinner with a block of the same height. Marketing and course KPIs pick up the fix too.

```svelte
<script lang="ts">
  import { Skeleton } from '@cio/ui/base/skeleton';
  // …existing imports, minus Spinner
</script>

    {#if loading}
      <Skeleton class="h-9 w-24" />
    {:else}
      <p class="ui:text-foreground text-3xl font-semibold tabular-nums">{value}</p>
    {/if}
    {#if description}
      {#if loading}
        <Skeleton class="mt-2 h-3 w-32" />
      {:else}
        <p class="ui:text-muted-foreground mt-1 text-xs">{description}</p>
      {/if}
    {/if}
```

### 16.6 Dashboard shell

**Row filling.** Which panels are visible depends on the course picker, grouping and pass-required exercises, so preset spans alone cannot tile every state (a cohort with one course picked shows `learner_progression` and `section_scores`, both 7 wide). `fillRowSpans(panelWidgets)` in `insights-utils.ts` packs the visible panels in order on the 12-column grid and widens the last panel of any row that is not full. `insights-dashboard.svelte` passes the result to `InsightsWidget` as `span`, and `WIDGET_SPAN_CLASS` lists every width from 4 to 12. Presets keep their order and default widths; `insights-utils.test.ts` covers the packing.

`components/insights-dashboard.svelte`. While the dashboard metadata is loading, it shows skeleton cards with the final footprint. A failed load shows one retry, so the page never sits blank:

```svelte
<script lang="ts">
  import CircleAlertIcon from '@lucide/svelte/icons/circle-alert';
  import { Button } from '@cio/ui/base/button';
  import { Skeleton } from '@cio/ui/base/skeleton';
  import { Empty } from '@cio/ui/custom/empty';
  import { t } from '$lib/utils/functions/translations';

  import { insightsApi } from '../api';
  import type { InsightsScopeRef } from '../utils/types';
  import InsightsKpiRow from './insights-kpi-row.svelte';
  import InsightsWidget from './insights-widget.svelte';

  interface Props {
    scope: InsightsScopeRef;
  }

  let { scope }: Props = $props();

  const kpiWidgets = $derived(insightsApi.visibleWidgets.filter((widget) => widget.viz === 'kpi'));
  const panelWidgets = $derived(insightsApi.visibleWidgets.filter((widget) => widget.viz !== 'kpi'));
</script>

{#if insightsApi.dashboardFailed}
  <Empty icon={CircleAlertIcon} title={$t('insights.empty.dashboard_failed')} variant="page">
    <Button variant="outline" size="sm" onclick={() => insightsApi.loadDashboard(scope)}>{$t('insights.retry')}</Button>
  </Empty>
{:else if !insightsApi.dashboard}
  <div class="space-y-6" aria-busy="true">
    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
      {#each [0, 1, 2, 3, 4] as index (index)}
        <Skeleton class="h-[118px] w-full rounded-xl" />
      {/each}
    </div>
    <div class="grid grid-cols-1 gap-4 lg:grid-cols-12">
      {#each ['lg:col-span-7', 'lg:col-span-5', 'lg:col-span-12'] as spanClass (spanClass)}
        <Skeleton class="h-[320px] w-full rounded-xl {spanClass}" />
      {/each}
    </div>
  </div>
{:else}
  <div class="space-y-6">
    {#if kpiWidgets.length > 0}
      <InsightsKpiRow widgets={kpiWidgets} />
    {/if}
    <div class="grid grid-cols-1 gap-4 lg:grid-cols-12">
      {#each panelWidgets as widget (widget.id)}
        <InsightsWidget {widget} />
      {/each}
    </div>
  </div>
{/if}
```

`components/insights-kpi-row.svelte`:

```svelte
<script lang="ts">
  import { KpiCard } from '$features/ui';
  import { t } from '$lib/utils/functions/translations';

  import { insightsApi } from '../api';
  import { formatKpi } from '../utils/insights-utils';
  import type { InsightsWidget } from '../utils/types';

  interface Props {
    widgets: InsightsWidget[];
  }

  let { widgets }: Props = $props();

  const gridClass = $derived(widgets.length === 4 ? 'xl:grid-cols-4' : 'xl:grid-cols-5');
</script>

<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 {gridClass}">
  {#each widgets as widget (widget.id)}
    {@const state = insightsApi.widgetState(widget.id)}
    {@const display = formatKpi(widget, state.result, $t)}
    <KpiCard
      title={$t(widget.titleKey)}
      value={display.value}
      description={display.description}
      loading={!state.result && !state.failed}
    />
  {/each}
</div>
```

`components/insights-widget.svelte` gives every widget the same states:
- **Before the first result:** a skeleton.
- **No rows:** an empty state with the reason.
- **Missing selection** (for example "pick a learner"): a hint.
- **Failure with nothing to show:** a retry.
- **Refetching:** the last result stays visible, dimmed.

```svelte
<script lang="ts">
  import ChartNoAxesColumnIcon from '@lucide/svelte/icons/chart-no-axes-column';
  import CircleAlertIcon from '@lucide/svelte/icons/circle-alert';
  import MousePointerClickIcon from '@lucide/svelte/icons/mouse-pointer-click';
  import { Button } from '@cio/ui/base/button';
  import { Empty } from '@cio/ui/custom/empty';
  import { cn } from '@cio/ui/tools';
  import { AnalyticsPanelCard } from '$features/ui';
  import { t } from '$lib/utils/functions/translations';

  import { insightsApi } from '../api';
  import { SELF_LOADING_WIDGET_IDS, WIDGET_SPAN_CLASS, resolveWidgetSpec } from '../utils/insights-utils';
  import type { InsightsWidget } from '../utils/types';
  import LearnersTable from './learners/learners-table.svelte';
  import WidgetSkeleton from './widget-skeleton.svelte';
  import { rendererFor } from './widgets';

  interface Props {
    widget: InsightsWidget;
  }

  let { widget }: Props = $props();

  const state = $derived(insightsApi.widgetState(widget.id));
  const isSelfLoading = $derived(SELF_LOADING_WIDGET_IDS.has(widget.id));
  const isWaitingForSelection = $derived(!isSelfLoading && resolveWidgetSpec(widget, insightsApi.selection) === null);
  const Renderer = $derived(rendererFor(widget));
  const description = $derived(widget.descriptionKey ? $t(widget.descriptionKey) : undefined);
  const spanClass = $derived(WIDGET_SPAN_CLASS[widget.span] ?? 'lg:col-span-12');
</script>

<AnalyticsPanelCard title={$t(widget.titleKey)} {description} class={cn('col-span-1 min-w-0', spanClass)}>
  {#if isSelfLoading}
    <LearnersTable />
  {:else if isWaitingForSelection}
    <Empty icon={MousePointerClickIcon} title={$t(`insights.hints.${widget.id}`)} class="h-[240px]" />
  {:else if state.failed && !state.result}
    <Empty icon={CircleAlertIcon} title={$t('insights.empty.failed')} class="h-[240px]">
      <Button variant="outline" size="sm" onclick={() => insightsApi.runWidget(widget)}>{$t('insights.retry')}</Button>
    </Empty>
  {:else if !state.result}
    <WidgetSkeleton viz={widget.viz} />
  {:else if state.result.rows.length === 0}
    <Empty icon={ChartNoAxesColumnIcon} title={$t('insights.empty.no_data')} class="h-[240px]" />
  {:else}
    <div class={cn('transition-opacity duration-200', state.loading && 'opacity-60')} aria-busy={state.loading}>
      <Renderer {widget} result={state.result} />
    </div>
  {/if}
</AnalyticsPanelCard>
```

`components/widget-skeleton.svelte`:

```svelte
<script lang="ts">
  import { Skeleton } from '@cio/ui/base/skeleton';

  import type { InsightsWidget } from '../utils/types';

  interface Props {
    viz: InsightsWidget['viz'];
  }

  let { viz }: Props = $props();
</script>

{#if viz === 'table' || viz === 'matrix'}
  <div class="space-y-2" aria-hidden="true">
    {#each [0, 1, 2, 3, 4, 5] as index (index)}
      <Skeleton class="h-9 w-full" />
    {/each}
  </div>
{:else if viz === 'donut'}
  <div class="flex h-[240px] items-center gap-6" aria-hidden="true">
    <Skeleton class="size-40 rounded-full" />
    <div class="flex-1 space-y-3">
      {#each [0, 1, 2, 3] as index (index)}
        <Skeleton class="h-4 w-full" />
      {/each}
    </div>
  </div>
{:else if viz === 'hbar'}
  <div class="space-y-3" aria-hidden="true">
    {#each [0, 1, 2, 3, 4] as index (index)}
      <Skeleton class="h-6 w-full" />
    {/each}
  </div>
{:else}
  <Skeleton class="h-[240px] w-full" />
{/if}
```

`components/updated-ago.svelte`. It ticks every second and always shows the age of the **oldest** widget:

```svelte
<script lang="ts">
  import { onMount } from 'svelte';
  import { t } from '$lib/utils/functions/translations';

  import { formatUpdatedAgo } from '../utils/insights-utils';

  interface Props {
    generatedAt: string | null;
  }

  let { generatedAt }: Props = $props();

  let now = $state(Date.now());

  onMount(() => {
    const timer = setInterval(() => (now = Date.now()), 1000);

    return () => clearInterval(timer);
  });

  const label = $derived(formatUpdatedAgo(generatedAt, now, $t));
</script>

{#if label}
  <span class="ui:text-muted-foreground flex items-center gap-1.5 text-xs tabular-nums">
    <span class="size-1.5 rounded-full bg-emerald-500" aria-hidden="true"></span>
    {label}
  </span>
{/if}
```

### 16.7 Small components

`components/course-picker.svelte`:

```svelte
<script lang="ts">
  import * as Select from '@cio/ui/base/select';
  import { t } from '$lib/utils/functions/translations';

  import type { InsightsScopeCourse } from '../utils/types';

  interface Props {
    courses: InsightsScopeCourse[];
    value: string | null;
    onChange: (courseId: string | null) => void;
  }

  let { courses, value, onChange }: Props = $props();

  const ALL_COURSES = 'all';

  const selectedValue = $derived(value ?? ALL_COURSES);
  const selectedLabel = $derived(
    value ? (courses.find((course) => course.id === value)?.title ?? '') : $t('insights.all_courses')
  );

  function handleChange(next: string) {
    onChange(next === ALL_COURSES ? null : next);
  }
</script>

<Select.Root type="single" value={selectedValue} onValueChange={handleChange}>
  <Select.Trigger class="w-full sm:w-[260px]" aria-label={$t('insights.course_picker')} data-testid="insights-course-picker">
    <span class="truncate">{selectedLabel}</span>
  </Select.Trigger>
  <Select.Content>
    <Select.Item value={ALL_COURSES} label={$t('insights.all_courses')}>{$t('insights.all_courses')}</Select.Item>
    {#each courses as course (course.id)}
      <Select.Item value={course.id} label={course.title}>{course.title}</Select.Item>
    {/each}
  </Select.Content>
</Select.Root>
```

`components/exercise-picker.svelte` follows the same pattern, without the "all" option. It lists the course's exercises from the structure and marks pass-required ones with `PassRequiredTag`.

`components/score-cell.svelte` is the heat cell. It uses the `marks.svelte` palette, now shared as `TONE_CELL_CLASS`:

```svelte
<script lang="ts">
  import { cn } from '@cio/ui/tools';
  import { t } from '$lib/utils/functions/translations';

  import { passTone, TONE_CELL_CLASS } from '../utils/insights-utils';
  import type { LearnerExerciseCell } from '../utils/types';

  interface Props {
    cell: LearnerExerciseCell | undefined;
    passMark: number | null;
  }

  let { cell, passMark }: Props = $props();

  const tone = $derived(cell?.state === 'graded' ? passTone(cell.scorePct, passMark) : 'muted');
</script>

<span class={cn('inline-flex min-w-12 justify-center rounded-md px-2 py-1 text-xs font-medium tabular-nums', TONE_CELL_CLASS[tone])}>
  {#if cell?.state === 'graded' && cell.scorePct !== null}
    {Math.round(cell.scorePct)}%
  {:else if cell?.state === 'awaiting_grade'}
    <span title={$t('insights.awaiting_grade')}>{$t('insights.awaiting_grade_short')}</span>
  {:else}
    –
  {/if}
</span>
```

`components/status-badge.svelte`:

```svelte
<script lang="ts">
  import { Badge } from '@cio/ui/base/badge';
  import { t } from '$lib/utils/functions/translations';
  import type { TInsightsStatus } from '@cio/utils/constants/insights';

  import { STATUS_BADGE_VARIANT } from '../utils/insights-utils';

  interface Props {
    status: TInsightsStatus;
  }

  let { status }: Props = $props();
</script>

<Badge variant={STATUS_BADGE_VARIANT[status]}>{$t(`insights.status.${status}`)}</Badge>
```

`components/pass-required-tag.svelte`:

```svelte
<script lang="ts">
  import { t } from '$lib/utils/functions/translations';

  interface Props {
    passMark: number;
  }

  let { passMark }: Props = $props();
</script>

<span class="ui:bg-primary/10 ui:text-primary rounded px-1.5 py-0.5 text-[10px] font-semibold whitespace-nowrap">
  {$t('insights.pass_required_tag', { mark: passMark })}
</span>
```

`components/sparkline.svelte`. This takes the path logic from `KpiCard`, kept local because it is the only other user. It draws nothing below two points:

```svelte
<script lang="ts">
  interface Props {
    values: Array<number | null>;
    label: string;
  }

  let { values, label }: Props = $props();

  const WIDTH = 88;
  const HEIGHT = 26;
  const PADDING = 3;

  const points = $derived(
    values.flatMap((value, index) => {
      if (value === null) return [];

      const x = PADDING + (index * (WIDTH - 2 * PADDING)) / Math.max(values.length - 1, 1);
      const y = PADDING + (1 - value / 100) * (HEIGHT - 2 * PADDING);

      return [{ x, y }];
    })
  );
  const path = $derived(points.map((point, index) => `${index ? 'L' : 'M'}${point.x.toFixed(1)},${point.y.toFixed(1)}`).join(' '));
  const lastPoint = $derived(points.at(-1));
</script>

{#if points.length >= 2 && lastPoint}
  <svg viewBox="0 0 {WIDTH} {HEIGHT}" width={WIDTH} height={HEIGHT} role="img" aria-label={label} class="ui:text-primary">
    <path d={path} fill="none" stroke="currentColor" stroke-width="1.75" stroke-linejoin="round" />
    <circle cx={lastPoint.x} cy={lastPoint.y} r="2.5" fill="currentColor" />
  </svg>
{:else}
  <span class="ui:text-muted-foreground">–</span>
{/if}
```

### 16.8 Charts: `components/charts/`

Each chart is a thin, data-only wrapper: points in, chart out. Each one follows the browser-only import pattern from `AGENTS.md` and holds the final height while the chart chunk loads. Categorical x axes key on the point `key`, so two exercises with the same title never merge, and they render the `label`.

`column-chart.svelte` (used for histograms, distributions and logins per day):

```svelte
<script module lang="ts">
  function loadChart() {
    if (typeof window === 'undefined') return Promise.reject(new Error('browser-only'));

    return import('@cio/ui/base/chart');
  }
</script>

<script lang="ts">
  import { browser } from '$app/environment';
  import type { ChartConfig } from '@cio/ui/base/chart/types';
  import { Skeleton } from '@cio/ui/base/skeleton';

  import { INSIGHTS_COLORS } from '../../utils/insights-utils';
  import type { InsightsChartPoint } from '../../utils/types';

  interface Props {
    points: InsightsChartPoint[];
    valueKey: string;
    label: string;
    color?: string;
    percent?: boolean;
  }

  let { points, valueKey, label, color = INSIGHTS_COLORS.primary, percent = false }: Props = $props();

  const labelByKey = $derived(new Map(points.map((point) => [point.key, point.label])));
  const config = $derived({ [valueKey]: { label, color } } satisfies ChartConfig);
  const series = $derived([{ key: valueKey, label, color }]);
  const yDomain = $derived(percent ? [0, 100] : undefined);
</script>

{#if browser}
  {#await loadChart()}
    <Skeleton class="h-[240px] w-full" />
  {:then Chart}
    <Chart.ChartContainer class="h-[240px] w-full" {config}>
      <Chart.BarChart
        data={points}
        x="key"
        xScale={Chart.scaleBand().padding(0.25)}
        axis="x"
        {series}
        {yDomain}
        props={{ xAxis: { format: (key: string) => labelByKey.get(key) ?? key } }}
      >
        {#snippet tooltip()}
          <Chart.Tooltip labelFormatter={(key: string) => labelByKey.get(key) ?? key} />
        {/snippet}
      </Chart.BarChart>
    </Chart.ChartContainer>
  {/await}
{:else}
  <Skeleton class="h-[240px] w-full" />
{/if}
```

`grouped-bar-chart.svelte` has the same skeleton and imports, with `series: InsightsChartSeries[]` and `percent` as props:

```svelte
  const config = $derived(
    Object.fromEntries(series.map((entry) => [entry.key, { label: entry.label, color: entry.color }])) satisfies ChartConfig
  );

      <Chart.BarChart
        data={points}
        x="key"
        xScale={Chart.scaleBand().padding(0.2)}
        seriesLayout="group"
        axis="x"
        legend
        {series}
        yDomain={percent ? [0, 100] : undefined}
        props={{ xAxis: { format: (key: string) => labelByKey.get(key) ?? key } }}
      >
```

`line-band-chart.svelte` draws the average as a line, the middle 50% as a band (`AreaChart` with per-series `y0`/`y1`), and an optional learner line on top. A point that is `null` leaves a gap instead of dropping to 0:

```svelte
<script module lang="ts">
  function loadChart() {
    if (typeof window === 'undefined') return Promise.reject(new Error('browser-only'));

    return import('@cio/ui/base/chart');
  }
</script>

<script lang="ts">
  import { browser } from '$app/environment';
  import type { ChartConfig } from '@cio/ui/base/chart/types';
  import { Skeleton } from '@cio/ui/base/skeleton';

  import { INSIGHTS_COLORS } from '../../utils/insights-utils';
  import type { InsightsChartPoint } from '../../utils/types';

  interface Props {
    points: InsightsChartPoint[];
    keys: { average: string; low?: string; high?: string; overlay?: string };
    labels: { average: string; band?: string; overlay?: string };
  }

  let { points, keys, labels }: Props = $props();

  const labelByRank = $derived(new Map(points.map((point) => [point.rank, point.label])));
  const isDefined = (key: string) => (point: InsightsChartPoint) => typeof point[key] === 'number';

  const series = $derived([
    ...(keys.low && keys.high
      ? [
          {
            key: 'band',
            label: labels.band ?? '',
            value: keys.high,
            color: INSIGHTS_COLORS.primary,
            props: { y0: keys.low, y1: keys.high, line: false, fillOpacity: 0.14, defined: isDefined(keys.high) }
          }
        ]
      : []),
    {
      key: 'average',
      label: labels.average,
      value: keys.average,
      color: INSIGHTS_COLORS.primary,
      props: { fillOpacity: 0, line: { strokeWidth: 2 }, defined: isDefined(keys.average) }
    },
    ...(keys.overlay
      ? [
          {
            key: 'overlay',
            label: labels.overlay ?? '',
            value: keys.overlay,
            color: INSIGHTS_COLORS.success,
            props: { fillOpacity: 0, line: { strokeWidth: 2.5 }, defined: isDefined(keys.overlay) }
          }
        ]
      : [])
  ]);
  const config = $derived(
    Object.fromEntries(series.map((entry) => [entry.key, { label: entry.label, color: entry.color }])) satisfies ChartConfig
  );
  const ticks = $derived(points.map((point) => point.rank));
</script>

{#if browser}
  {#await loadChart()}
    <Skeleton class="h-[260px] w-full" />
  {:then Chart}
    <Chart.ChartContainer class="h-[260px] w-full" {config}>
      <Chart.AreaChart
        data={points}
        x="rank"
        yDomain={[0, 100]}
        legend
        {series}
        props={{ xAxis: { ticks, format: (rank: number) => labelByRank.get(rank) ?? '' } }}
      >
        {#snippet tooltip()}
          <Chart.Tooltip labelFormatter={(rank: number) => labelByRank.get(rank) ?? ''} />
        {/snippet}
      </Chart.AreaChart>
    </Chart.ChartContainer>
  {/await}
{:else}
  <Skeleton class="h-[260px] w-full" />
{/if}
```

Long exercise titles overlap on the x axis. When there are more than 8 points, pass `format` a truncated label (`label.slice(0, 14) + '…'`). The tooltip already shows the full title.

`multi-line-chart.svelte` (scores by exercise, one line per cohort) uses `Chart.LineChart` with `x="rank"`, the same ticks, format and tooltip as above, and one series per cohort from `toSeriesPoints`. Colors come from `SERIES_COLORS[index % SERIES_COLORS.length]`.

`donut-chart.svelte` reuses the existing `ChartLegend` for the values next to the ring:

```svelte
<script module lang="ts">
  function loadChart() {
    if (typeof window === 'undefined') return Promise.reject(new Error('browser-only'));

    return import('@cio/ui/base/chart');
  }
</script>

<script lang="ts">
  import { browser } from '$app/environment';
  import type { ChartConfig } from '@cio/ui/base/chart/types';
  import { Skeleton } from '@cio/ui/base/skeleton';

  interface Props {
    segments: Array<{ key: string; label: string; value: number; color: string }>;
  }

  let { segments }: Props = $props();

  const config = $derived(
    Object.fromEntries(segments.map((segment) => [segment.key, { label: segment.label, color: segment.color }])) satisfies ChartConfig
  );
  const legendItems = $derived(segments.map((segment) => ({ label: segment.label, color: segment.color, value: segment.value })));
</script>

<div class="flex flex-col items-center gap-6 sm:flex-row">
  <div class="size-[180px] shrink-0">
    {#if browser}
      {#await loadChart()}
        <Skeleton class="size-[180px] rounded-full" />
      {:then Chart}
        <Chart.ChartContainer class="size-[180px]" {config}>
          <Chart.PieChart data={segments} key="key" label="label" value="value" c="color" innerRadius={0.62} padAngle={0.02} />
        </Chart.ChartContainer>
      {/await}
    {/if}
  </div>
  {#if browser}
    {#await loadChart() then Chart}
      <Chart.ChartLegend items={legendItems} />
    {/await}
  {/if}
</div>
```

`hbar-list.svelte` is pure CSS, the same pattern as the marketing top-courses list, with no chart chunk. It is used for "needs attention", drop-off, "hardest" lists and "average score by cohort":

```svelte
<script lang="ts">
  import { cn } from '@cio/ui/tools';

  import type { InsightsTone } from '../../utils/types';

  interface Props {
    items: Array<{ key: string; label: string; value: number | null; display: string; hint?: string; tone?: InsightsTone }>;
    max?: number;
  }

  let { items, max = 100 }: Props = $props();

  const BAR_TONE_CLASS: Record<InsightsTone, string> = {
    success: 'bg-emerald-500/70',
    info: 'ui:bg-primary/70',
    warning: 'bg-amber-500/70',
    danger: 'bg-rose-500/70',
    muted: 'ui:bg-muted-foreground/40'
  };
</script>

<ul class="space-y-3">
  {#each items as item (item.key)}
    {@const width = item.value === null || max <= 0 ? 0 : Math.min(100, (item.value / max) * 100)}
    <li class="space-y-1">
      <div class="flex items-center justify-between gap-3 text-sm">
        <span class="truncate" title={item.label}>{item.label}</span>
        <span class="ui:text-muted-foreground shrink-0 tabular-nums">{item.display}</span>
      </div>
      <div class="ui:bg-muted h-2 overflow-hidden rounded-full">
        <div class={cn('h-full rounded-full transition-[width] duration-500', BAR_TONE_CLASS[item.tone ?? 'info'])} style="width: {width}%"></div>
      </div>
      {#if item.hint}
        <p class="ui:text-muted-foreground text-xs">{item.hint}</p>
      {/if}
    </li>
  {/each}
</ul>
```

### 16.9 Widget renderers: `components/widgets/`

`index.ts` maps a widget id to a bespoke renderer, falling back to the generic chart or table. Adding a preset needs no new component unless it needs bespoke layout. This is the dashboard half of "presets are data":

```ts
import type { Component } from 'svelte';

import type { InsightsWidget, WidgetRendererProps } from '../../utils/types';
import CohortsGlance from './cohorts-glance.svelte';
import ExerciseDistribution from './exercise-distribution.svelte';
import GenericChart from './generic-chart.svelte';
import GenericTable from './generic-table.svelte';
import GroupSummary from './group-summary.svelte';
import HardestQuestions from './hardest-questions.svelte';
import LearnerCourses from './learner-courses.svelte';
import LearnerProgression from './learner-progression.svelte';
import OverdueTable from './overdue-table.svelte';
import ScoresByExercise from './scores-by-exercise.svelte';
import SectionScorecard from './section-scorecard.svelte';

const WIDGET_RENDERERS: Record<string, Component<WidgetRendererProps>> = {
  courses_summary: GroupSummary,
  cohorts_in_course: GroupSummary,
  cohorts_at_a_glance: CohortsGlance,
  learner_courses: LearnerCourses,
  overdue: OverdueTable,
  scores_by_exercise: ScoresByExercise,
  learner_progression: LearnerProgression,
  section_scorecard: SectionScorecard,
  hardest_questions: HardestQuestions,
  exercise_score_distribution: ExerciseDistribution
};

export function rendererFor(widget: InsightsWidget): Component<WidgetRendererProps> {
  return WIDGET_RENDERERS[widget.id] ?? (widget.viz === 'table' ? GenericTable : GenericChart);
}
```

`generic-chart.svelte` adapts a result to a chart by `viz`. All shaping lives in tested helpers in `insights-utils.ts`. The measures' translated labels come from `insights.measures.<alias>`:

```svelte
<script lang="ts">
  import { t } from '$lib/utils/functions/translations';

  import {
    hbarMax,
    INSIGHTS_COLORS,
    SERIES_COLORS,
    toChartPoints,
    toDonutSegments,
    toHbarItems,
    toSeriesPoints
  } from '../../utils/insights-utils';
  import type { WidgetRendererProps } from '../../utils/types';
  import ColumnChart from '../charts/column-chart.svelte';
  import DonutChart from '../charts/donut-chart.svelte';
  import GroupedBarChart from '../charts/grouped-bar-chart.svelte';
  import HbarList from '../charts/hbar-list.svelte';
  import LineChart from '../charts/line-chart.svelte';
  import MultiLineChart from '../charts/multi-line-chart.svelte';

  let { widget, result }: WidgetRendererProps = $props();

  const dimensions = $derived(widget.spec.dimensions ?? []);
  const firstDimension = $derived(dimensions[0] ?? null);
  const measures = $derived(result.columns.filter((column) => column.role === 'measure'));
  const firstMeasure = $derived(measures[0]);
  const isPercent = $derived(firstMeasure?.valueType === 'percent');
  const points = $derived(firstDimension ? toChartPoints(result, firstDimension, $t) : []);
  const series = $derived(
    measures.map((measure, index) => ({
      key: measure.key,
      label: $t(`insights.measures.${measure.key}`),
      color: SERIES_COLORS[index % SERIES_COLORS.length]
    }))
  );
</script>

{#if widget.viz === 'donut' && firstDimension}
  <DonutChart segments={toDonutSegments(result, firstDimension, $t)} />
{:else if widget.viz === 'hbar'}
  {@const items = toHbarItems(result, firstDimension, $t)}
  <HbarList {items} max={hbarMax(items, isPercent)} />
{:else if widget.viz === 'grouped_bar'}
  <GroupedBarChart {points} {series} percent />
{:else if widget.viz === 'multi_line' && dimensions.length === 2 && firstMeasure}
  {@const lines = toSeriesPoints(result, dimensions[0], dimensions[1], firstMeasure.key, $t)}
  <MultiLineChart points={lines.points} seriesKeys={lines.seriesKeys} />
{:else if widget.viz === 'line' && firstMeasure}
  <LineChart
    {points}
    valueKey={firstMeasure.key}
    label={$t(`insights.measures.${firstMeasure.key}`)}
    color={INSIGHTS_COLORS.primary}
    percent={isPercent}
  />
{:else if firstMeasure}
  <ColumnChart
    {points}
    valueKey={firstMeasure.key}
    label={$t(`insights.measures.${firstMeasure.key}`)}
    color={INSIGHTS_COLORS.primary}
    percent={isPercent}
  />
{/if}
```

`scores-by-exercise.svelte`. A point is plotted only once at least 25% of learners are graded, so one early finisher can't draw the cohort line:

```svelte
<script lang="ts">
  import { t } from '$lib/utils/functions/translations';

  import { insightsApi } from '../../api';
  import { numberCell, toChartPoints } from '../../utils/insights-utils';
  import type { InsightsChartPoint, WidgetRendererProps } from '../../utils/types';
  import LineBandChart from '../charts/line-band-chart.svelte';

  let { result }: WidgetRendererProps = $props();

  const MIN_GRADED_SHARE = 0.25;

  const learnerCount = $derived(insightsApi.dashboard?.scope.learnerCount ?? 0);
  const points = $derived(
    toChartPoints(result, 'exercise', $t).map((point): InsightsChartPoint => {
      const graded = typeof point['is_graded__count_if'] === 'number' ? point['is_graded__count_if'] : 0;
      const hasEnough = learnerCount === 0 || graded / learnerCount >= MIN_GRADED_SHARE;

      return hasEnough
        ? point
        : { ...point, best_score_pct__avg: null, best_score_pct__p25: null, best_score_pct__p75: null };
    })
  );
</script>

<LineBandChart
  {points}
  keys={{ average: 'best_score_pct__avg', low: 'best_score_pct__p25', high: 'best_score_pct__p75' }}
  labels={{ average: $t('insights.legend.average'), band: $t('insights.legend.middle_half') }}
/>
<p class="ui:text-muted-foreground mt-2 text-xs">{$t('insights.notes.scores_by_exercise')}</p>
```

`learner-progression.svelte`. This overlays the selected learner on the cohort average, which it reads from the already-loaded `scores_by_exercise` result, so it makes no extra request:

```svelte
<script lang="ts">
  import { t } from '$lib/utils/functions/translations';

  import { insightsApi, insightsLearnersApi } from '../../api';
  import { LEARNER_DETAIL_ELEMENT_ID, numberCell, textCell, toChartPoints } from '../../utils/insights-utils';
  import type { WidgetRendererProps } from '../../utils/types';
  import LineBandChart from '../charts/line-band-chart.svelte';

  let { result }: WidgetRendererProps = $props();

  const cohortResult = $derived(insightsApi.widgetResult('scores_by_exercise'));
  const learnerScores = $derived(
    new Map(result.rows.map((row) => [textCell(row, 'exercise_id') ?? '', numberCell(row, 'best_score_pct__value')]))
  );
  const points = $derived(
    toChartPoints(cohortResult ?? result, 'exercise', $t).map((point) => {
      const learnerScore = learnerScores.get(point.key) ?? null;

      return { ...point, learner: learnerScore };
    })
  );
  const selectedRow = $derived(
    insightsLearnersApi.rows.find((row) => row['learner_id'] === insightsApi.selection.learnerId)
  );
  const learnerName = $derived(textCell(selectedRow, 'name__value') ?? $t('insights.legend.learner'));
</script>

<div id={LEARNER_DETAIL_ELEMENT_ID} class="scroll-mt-24">
  <LineBandChart
    {points}
    keys={{ average: 'best_score_pct__avg', overlay: 'learner' }}
    labels={{ average: $t('insights.legend.cohort_average'), overlay: learnerName }}
  />
</div>
```

`learner-courses.svelte` (all-courses view, selected learner):

```svelte
<script lang="ts">
  import { Progress } from '@cio/ui/base/progress';
  import * as Table from '@cio/ui/base/table';
  import { t } from '$lib/utils/functions/translations';

  import { formatPercent, LEARNER_DETAIL_ELEMENT_ID, numberCell, textCell } from '../../utils/insights-utils';
  import type { WidgetRendererProps } from '../../utils/types';

  let { result }: WidgetRendererProps = $props();
</script>

<div id={LEARNER_DETAIL_ELEMENT_ID} class="scroll-mt-24">
  <Table.Root>
    <Table.Header>
      <Table.Row>
        <Table.Head>{$t('insights.columns.course')}</Table.Head>
        <Table.Head class="w-[180px]">{$t('insights.columns.progress')}</Table.Head>
        <Table.Head>{$t('insights.columns.now_at')}</Table.Head>
        <Table.Head class="text-right">{$t('insights.columns.average_score')}</Table.Head>
        <Table.Head class="text-right">{$t('insights.columns.required_passed')}</Table.Head>
      </Table.Row>
    </Table.Header>
    <Table.Body>
      {#each result.rows as row (row['course_id'])}
        {@const progress = numberCell(row, 'progress_pct__value') ?? 0}
        {@const requiredTotal = numberCell(row, 'required_total__value') ?? 0}
        {@const requiredPassed = numberCell(row, 'required_passed__value') ?? 0}
        <Table.Row>
          <Table.Cell class="font-medium">{textCell(row, 'course_label')}</Table.Cell>
          <Table.Cell>
            <div class="flex items-center gap-2">
              <Progress value={progress} class="h-2" />
              <span class="w-10 text-right text-xs tabular-nums">{Math.round(progress)}%</span>
            </div>
          </Table.Cell>
          <Table.Cell class="ui:text-muted-foreground">
            {progress >= 100 ? $t('insights.finished') : (textCell(row, 'now_at_title__value') ?? '–')}
          </Table.Cell>
          <Table.Cell class="text-right tabular-nums">{formatPercent(row['avg_score_pct__value'])}</Table.Cell>
          <Table.Cell class="text-right tabular-nums">
            {requiredTotal > 0 ? $t('insights.required_passed_of', { passed: requiredPassed, total: requiredTotal }) : '–'}
          </Table.Cell>
        </Table.Row>
      {/each}
    </Table.Body>
  </Table.Root>
</div>
```

`overdue-table.svelte`. "Send reminder" only appears on goal rows, and only in cohort scope. Each row's button has its own pending state:

```svelte
<script lang="ts">
  import { SvelteSet } from 'svelte/reactivity';
  import { Badge } from '@cio/ui/base/badge';
  import { Button } from '@cio/ui/base/button';
  import * as Table from '@cio/ui/base/table';
  import { cohortGoalApi } from '$features/cohort/api';
  import { t } from '$lib/utils/functions/translations';

  import { insightsApi } from '../../api';
  import { formatCount, textCell } from '../../utils/insights-utils';
  import type { WidgetRendererProps } from '../../utils/types';

  let { result }: WidgetRendererProps = $props();

  const pendingAssignmentIds = new SvelteSet<string>();

  const cohortId = $derived(insightsApi.scope?.type === 'cohort' ? insightsApi.scope.id : null);
  const hasGoalRows = $derived(result.rows.some((row) => row['kind__value'] === 'goal'));
  let isRemindingAll = $state(false);

  async function remind(assignmentId: string) {
    if (!cohortId || pendingAssignmentIds.has(assignmentId)) return;

    pendingAssignmentIds.add(assignmentId);
    await cohortGoalApi.remindAssignment(cohortId, assignmentId);
    pendingAssignmentIds.delete(assignmentId);
  }

  async function remindAll() {
    if (!cohortId || isRemindingAll) return;

    isRemindingAll = true;
    await cohortGoalApi.remindOverdue(cohortId, insightsApi.selection.courseId);
    isRemindingAll = false;
  }
</script>

<Table.Root>
  <Table.Header>
    <Table.Row>
      <Table.Head>{$t('insights.columns.learner')}</Table.Head>
      <Table.Head>{$t('insights.columns.overdue_item')}</Table.Head>
      <Table.Head class="text-right">{$t('insights.columns.days_overdue')}</Table.Head>
      {#if cohortId}<Table.Head class="w-[1%]"></Table.Head>{/if}
    </Table.Row>
  </Table.Header>
  <Table.Body>
    {#each result.rows as row (row['item_id'])}
      {@const assignmentId = textCell(row, 'assignment_id__value')}
      <Table.Row>
        <Table.Cell class="font-medium">{textCell(row, 'name__value')}</Table.Cell>
        <Table.Cell>
          <div class="flex flex-col gap-1">
            <span class="truncate">{textCell(row, 'title__value')}</span>
            <span class="ui:text-muted-foreground flex items-center gap-2 text-xs">
              <Badge variant="secondary">{$t(`insights.overdue_kind.${row['kind__value']}`)}</Badge>
              {textCell(row, 'course_titles__value') ?? ''}
            </span>
          </div>
        </Table.Cell>
        <Table.Cell class="text-right tabular-nums">{formatCount(row['days_overdue__value'])}</Table.Cell>
        {#if cohortId}
          <Table.Cell>
            {#if assignmentId}
              <Button
                type="button"
                variant="outline"
                size="sm"
                loading={pendingAssignmentIds.has(assignmentId)}
                disabled={pendingAssignmentIds.has(assignmentId)}
                onclick={() => remind(assignmentId)}
              >
                {$t('insights.actions.send_reminder')}
              </Button>
            {/if}
          </Table.Cell>
        {/if}
      </Table.Row>
    {/each}
  </Table.Body>
</Table.Root>

{#if cohortId && hasGoalRows}
  <div class="mt-4 flex justify-end">
    <Button
      type="button"
      size="sm"
      loading={isRemindingAll}
      disabled={isRemindingAll}
      onclick={remindAll}
      testId="insights-remind-all"
    >
      {$t('insights.actions.remind_all_overdue')}
    </Button>
  </div>
{/if}
```

`Button` renders its spinner only when `type` is set (`packages/ui/src/base/button/button.svelte:124`), so every loading button here passes `type="button"`.

`section-scorecard.svelte` (a `null` section reads "Not in a section"; the pass rate reads "–" when the section has no pass-required exercise):

```svelte
<script lang="ts">
  import * as Table from '@cio/ui/base/table';
  import { cn } from '@cio/ui/tools';
  import { t } from '$lib/utils/functions/translations';

  import { dimensionLabel, formatCount, formatPercent, numberCell, scoreTone, TONE_CELL_CLASS } from '../../utils/insights-utils';
  import type { WidgetRendererProps } from '../../utils/types';

  let { result }: WidgetRendererProps = $props();
</script>

<Table.Root>
  <Table.Header>
    <Table.Row>
      <Table.Head>{$t('insights.columns.section')}</Table.Head>
      <Table.Head class="text-right">{$t('insights.columns.exercises_taken')}</Table.Head>
      <Table.Head class="text-right">{$t('insights.columns.average_score')}</Table.Head>
      <Table.Head class="text-right">{$t('insights.columns.pass_rate')}</Table.Head>
      <Table.Head class="text-right">{$t('insights.columns.video')}</Table.Head>
      <Table.Head class="text-right">{$t('insights.columns.classroom')}</Table.Head>
    </Table.Row>
  </Table.Header>
  <Table.Body>
    {#each result.rows as row, index (row['section_id'] ?? `none-${index}`)}
      {@const averageScore = numberCell(row, 'section_score_pct__avg')}
      <Table.Row>
        <Table.Cell class="font-medium">{dimensionLabel(row, 'section', $t)}</Table.Cell>
        <Table.Cell class="text-right tabular-nums">
          {formatCount(row['took_all__count_if'])} / {formatCount(row['rows__count'])}
        </Table.Cell>
        <Table.Cell class="text-right">
          <span class={cn('rounded-md px-2 py-1 text-xs tabular-nums', TONE_CELL_CLASS[scoreTone(averageScore)])}>
            {formatPercent(averageScore)}
          </span>
        </Table.Cell>
        <Table.Cell class="text-right tabular-nums">{formatPercent(row['passed_all_required__rate'])}</Table.Cell>
        <Table.Cell class="text-right tabular-nums">{formatPercent(row['video_pct__avg'])}</Table.Cell>
        <Table.Cell class="text-right tabular-nums">{formatPercent(row['attendance__pooled'])}</Table.Cell>
      </Table.Row>
    {/each}
  </Table.Body>
</Table.Root>
```

`group-summary.svelte` (`courses_summary` and `cohorts_in_course`) is a chart and a table over **one** result, so the two can never disagree:

```svelte
<script lang="ts">
  import * as Table from '@cio/ui/base/table';
  import { t } from '$lib/utils/functions/translations';

  import { dimensionLabel, formatCount, formatPercent, SERIES_COLORS, toChartPoints } from '../../utils/insights-utils';
  import type { WidgetRendererProps } from '../../utils/types';
  import GroupedBarChart from '../charts/grouped-bar-chart.svelte';

  let { widget, result }: WidgetRendererProps = $props();

  const CHART_MEASURES = ['progress_pct__avg', 'avg_score_pct__avg', 'required_pass__pooled'] as const;

  const dimension = $derived(widget.spec.dimensions?.[0] ?? 'course');
  const points = $derived(toChartPoints(result, dimension, $t));
  const series = $derived(
    CHART_MEASURES.map((key, index) => ({ key, label: $t(`insights.measures.${key}`), color: SERIES_COLORS[index] }))
  );
</script>

<GroupedBarChart {points} {series} percent />

<Table.Root class="mt-4">
  <Table.Header>
    <Table.Row>
      <Table.Head>{$t(`insights.columns.${dimension}`)}</Table.Head>
      <Table.Head class="text-right">{$t('insights.measures.rows__count')}</Table.Head>
      <Table.Head class="text-right">
        <span class="whitespace-normal">{$t('insights.measures.progress_pct__avg')}</span>
      </Table.Head>
      <Table.Head class="text-right">
        <span class="whitespace-normal">{$t('insights.measures.avg_score_pct__avg')}</span>
      </Table.Head>
      <Table.Head class="text-right">
        <span class="whitespace-normal">{$t('insights.measures.required_pass__pooled')}</span>
      </Table.Head>
    </Table.Row>
  </Table.Header>
  <Table.Body>
    {#each result.rows as row, index (row[`${dimension}_id`] ?? `none-${index}`)}
      <Table.Row>
        <Table.Cell class="font-medium">
          <div class="min-w-[140px] whitespace-normal">{dimensionLabel(row, dimension, $t)}</div>
        </Table.Cell>
        <Table.Cell class="text-right tabular-nums">{formatCount(row['rows__count'])}</Table.Cell>
        <Table.Cell class="text-right tabular-nums">{formatPercent(row['progress_pct__avg'])}</Table.Cell>
        <Table.Cell class="text-right tabular-nums">{formatPercent(row['avg_score_pct__avg'])}</Table.Cell>
        <Table.Cell class="text-right tabular-nums">{formatPercent(row['required_pass__pooled'])}</Table.Cell>
      </Table.Row>
    {/each}
  </Table.Body>
</Table.Root>
```

`cohorts-glance.svelte`. Each row links to that cohort's dashboard; the "No cohort" row has no link. Health is derived on the client from the same row (3.9):

```svelte
<script lang="ts">
  import { resolve } from '$app/paths';
  import * as Table from '@cio/ui/base/table';
  import { t } from '$lib/utils/functions/translations';

  import { cohortHealth, dimensionLabel, formatCount, formatPercent, numberCell, textCell } from '../../utils/insights-utils';
  import type { WidgetRendererProps } from '../../utils/types';
  import StatusBadge from '../status-badge.svelte';

  let { result }: WidgetRendererProps = $props();
</script>

<Table.Root>
  <Table.Header>
    <Table.Row>
      <Table.Head>{$t('insights.columns.cohort')}</Table.Head>
      <Table.Head class="text-right">{$t('insights.measures.rows__count')}</Table.Head>
      <Table.Head class="min-w-[160px]">{$t('insights.columns.progress')}</Table.Head>
      <Table.Head class="text-right">{$t('insights.columns.average_score')}</Table.Head>
      <Table.Head class="text-right">{$t('insights.flags.overdue')}</Table.Head>
      <Table.Head>{$t('insights.columns.health')}</Table.Head>
    </Table.Row>
  </Table.Header>
  <Table.Body>
    {#each result.rows as row, index (row['cohort_id'] ?? `none-${index}`)}
      {@const cohortId = textCell(row, 'cohort_id')}
      {@const progress = numberCell(row, 'overall_progress_pct__avg') ?? 0}
      <Table.Row>
        <Table.Cell class="font-medium">
          <div class="min-w-[160px] whitespace-normal">
            {#if cohortId}
              <a class="ui:text-primary hover:underline" href={resolve(`/cohorts/${cohortId}/analytics`, {})}>
                {dimensionLabel(row, 'cohort', $t)}
              </a>
            {:else}
              {dimensionLabel(row, 'cohort', $t)}
            {/if}
          </div>
        </Table.Cell>
        <Table.Cell class="text-right tabular-nums">{formatCount(row['rows__count'])}</Table.Cell>
        <Table.Cell>
          <div class="flex items-center gap-2">
            <div class="ui:bg-muted h-2 flex-1 overflow-hidden rounded-full">
              <div class="ui:bg-primary h-full rounded-full" style="width: {Math.min(100, progress)}%"></div>
            </div>
            <span class="w-10 text-right text-xs tabular-nums">{formatPercent(progress)}</span>
          </div>
        </Table.Cell>
        <Table.Cell class="text-right tabular-nums">{formatPercent(row['avg_score_pct__avg'])}</Table.Cell>
        <Table.Cell class="text-right tabular-nums">{formatCount(row['is_overdue__count_if'])}</Table.Cell>
        <Table.Cell><StatusBadge status={cohortHealth(row)} /></Table.Cell>
      </Table.Row>
    {/each}
  </Table.Body>
</Table.Root>
```

The PRD's "learners by cohort health" donut is the same rows grouped by health. Render `<DonutChart segments={toHealthSegments(result, $t)} />` above this table.

`hardest-questions.svelte`:

```svelte
<script lang="ts">
  import { t } from '$lib/utils/functions/translations';

  import { formatPercent, numberCell, textCell } from '../../utils/insights-utils';
  import type { HbarItem, WidgetRendererProps } from '../../utils/types';
  import HbarList from '../charts/hbar-list.svelte';

  let { result }: WidgetRendererProps = $props();

  function correctnessTone(value: number | null): HbarItem['tone'] {
    if (value === null) return 'muted';

    if (value < 50) return 'danger';

    return value < 65 ? 'warning' : 'info';
  }

  const items = $derived(
    result.rows.map((row, index): HbarItem => {
      const key = String(row['question_id'] ?? index);
      const label = textCell(row, 'question_label') ?? '';
      const value = numberCell(row, 'correct_pct__avg');
      const display = formatPercent(value);
      const wrongAnswer = textCell(row, 'wrong_answer__mode');
      const hint = wrongAnswer ? $t('insights.most_common_wrong_answer', { answer: wrongAnswer }) : undefined;
      const tone = correctnessTone(value);

      return { key, label, value, display, hint, tone };
    })
  );
</script>

<HbarList {items} />
<p class="ui:text-muted-foreground mt-3 text-xs">{$t('insights.notes.hardest_questions')}</p>
```

`exercise-distribution.svelte` (course scope):

```svelte
<script lang="ts">
  import { t } from '$lib/utils/functions/translations';

  import { insightsApi } from '../../api';
  import { toChartPoints } from '../../utils/insights-utils';
  import type { WidgetRendererProps } from '../../utils/types';
  import ColumnChart from '../charts/column-chart.svelte';
  import ExercisePicker from '../exercise-picker.svelte';

  let { result }: WidgetRendererProps = $props();

  const courseId = $derived(insightsApi.dashboard?.scope.courses[0]?.id ?? null);
  const exercises = $derived(
    (courseId ? insightsApi.dashboard?.structures[courseId]?.items : [])?.filter((item) => item.type === 'EXERCISE') ?? []
  );
  const points = $derived(toChartPoints(result, 'score_bucket_10', $t));
</script>

<div class="mb-3 flex justify-end">
  <ExercisePicker {exercises} value={insightsApi.selection.exerciseId} onChange={(id) => insightsApi.selectExercise(id)} />
</div>
<ColumnChart {points} valueKey="rows__count" label={$t('insights.measures.rows__count')} />
```

`generic-table.svelte`, the fallback for any `table` widget without a bespoke renderer, renders the columns the API returned:
- Dimension columns show their `_label`, or the `_id` when there is no label.
- Measure columns are formatted by `valueType`: percent with `formatPercent`, integer and number with `formatCount`, dates with `toLocaleDateString`.
- Headers come from `insights.measures.<key>` and `insights.columns.<dimension>`.

`multi-line-chart.svelte` and `grouped-bar-chart.svelte` share `column-chart.svelte`'s skeleton, `loadChart()` and `labelByKey` handling (the props differ as shown in 16.8):
- `multi-line-chart` uses `Chart.LineChart` with `x="rank"`, `yDomain={[0, 100]}`, `legend`, and one series per entry of `seriesKeys`, coloured by `SERIES_COLORS[index % SERIES_COLORS.length]`.
- The line series use `props: { defined: (point) => typeof point[key] === 'number' }`, so a cohort that has not reached an exercise shows a gap, not a drop to zero.

`line-chart.svelte` draws one series for `viz: 'line'` (the org hiring ramp and logins per day). It has the same props as `column-chart.svelte` and the same `x="rank"` axis as `multi-line-chart`, but no fixed domain: `LineChart` already sets `yBaseline` to 0 in layerchart 2.2.0, so counts start at zero and scale to the data. `percent` fixes the domain at 0–100.

### 16.10 Learners table: `components/learners/`

`learners-toolbar.svelte`. Search is server-backed through `DebouncedSearch`, so it updates on input. The filters are the existing `Select` primitives and the sort is `SortSelect`:

```svelte
<script lang="ts">
  import { onDestroy } from 'svelte';
  import * as Select from '@cio/ui/base/select';
  import { Button } from '@cio/ui/base/button';
  import { Search } from '@cio/ui/custom/search';
  import { SortSelect } from '$features/ui';
  import { DebouncedSearch } from '$lib/utils/functions/debounced-search.svelte';
  import { t } from '$lib/utils/functions/translations';

  import { insightsLearnersApi } from '../../api';
  import { countActiveLearnerFilters, LEARNER_FILTER_OPTIONS, LEARNER_SORTS } from '../../utils/insights-utils';
  import type { LearnerFilters } from '../../utils/types';

  const search = new DebouncedSearch({
    initial: insightsLearnersApi.search,
    onApply: (value) => void insightsLearnersApi.setSearch(value)
  });

  onDestroy(() => search.destroy());

  const filterKeys = Object.keys(LEARNER_FILTER_OPTIONS) as Array<keyof LearnerFilters>;

  const sortOptions = $derived(LEARNER_SORTS.map((value) => ({ value, label: $t(`insights.learners.sort.${value}`) })));
  const activeFilterCount = $derived(countActiveLearnerFilters(insightsLearnersApi.filters));

  function filterLabel(key: keyof LearnerFilters, value: string): string {
    return $t(`insights.learners.filters.${key}.${value || 'any'}`);
  }
</script>

<div class="flex flex-wrap items-center gap-2">
  <Search
    value={search.draft}
    onValueChange={(value) => search.input(value)}
    placeholder={$t('insights.learners.search')}
    class="w-full sm:max-w-[260px]"
    data-testid="insights-learners-search"
  />
  {#each filterKeys as filterKey (filterKey)}
    <Select.Root
      type="single"
      value={insightsLearnersApi.filters[filterKey]}
      onValueChange={(value) => insightsLearnersApi.setFilter(filterKey, value)}
    >
      <Select.Trigger class="min-w-[150px]" aria-label={$t(`insights.learners.filters.${filterKey}.label`)}>
        {filterLabel(filterKey, insightsLearnersApi.filters[filterKey])}
      </Select.Trigger>
      <Select.Content>
        {#each LEARNER_FILTER_OPTIONS[filterKey] as option (option)}
          <Select.Item value={option} label={filterLabel(filterKey, option)}>{filterLabel(filterKey, option)}</Select.Item>
        {/each}
      </Select.Content>
    </Select.Root>
  {/each}
  <SortSelect
    options={sortOptions}
    value={insightsLearnersApi.sort}
    onValueChange={(value) => insightsLearnersApi.setSortValue(value)}
  />
  {#if activeFilterCount > 0}
    <Button variant="ghost" size="sm" onclick={() => insightsLearnersApi.clearFilters()}>
      {$t('insights.learners.clear_filters', { count: activeFilterCount })}
    </Button>
  {/if}
</div>
```

`learners-table.svelte`:
- With all courses, the columns are overall values.
- With a course picked, there is one score column per visible exercise. Pass-required columns carry their tag; the cells are heat cells; a sparkline shows the trend.
- The name column is sticky, like the marks page.
- A row is selected with a real button, so keyboard users can do it too.
- Selection drives the detail widget and scrolls it into view, honouring reduced motion.
- "Show more" appends rows.
- Export reads every matching row fresh.

```svelte
<script lang="ts">
  import UsersIcon from '@lucide/svelte/icons/users';
  import { Badge } from '@cio/ui/base/badge';
  import { Button } from '@cio/ui/base/button';
  import { Skeleton } from '@cio/ui/base/skeleton';
  import * as Table from '@cio/ui/base/table';
  import { Empty } from '@cio/ui/custom/empty';
  import { cn } from '@cio/ui/tools';
  import { ExportMenu } from '$features/ui';
  import { t } from '$lib/utils/functions/translations';
  import { formatLastSeen } from '$features/audience/utils/audience-utils';

  import { insightsApi, insightsLearnersApi } from '../../api';
  import {
    attemptedByExercise,
    formatPercent,
    isInsightsStatus,
    LEARNER_DETAIL_ELEMENT_ID,
    numberCell,
    textCell,
    visibleExerciseColumns
  } from '../../utils/insights-utils';
  import type { InsightsRow } from '../../utils/types';
  import PassRequiredTag from '../pass-required-tag.svelte';
  import ScoreCell from '../score-cell.svelte';
  import Sparkline from '../sparkline.svelte';
  import StatusBadge from '../status-badge.svelte';
  import LearnersToolbar from './learners-toolbar.svelte';

  const courseId = $derived(insightsApi.selection.courseId);
  const structure = $derived(courseId ? insightsApi.dashboard?.structures[courseId] : undefined);
  const attempted = $derived(attemptedByExercise(insightsApi.widgetResult('scores_by_exercise')));
  const exercises = $derived(courseId ? visibleExerciseColumns(structure, attempted) : []);
  const scopeTitle = $derived(insightsApi.dashboard?.scope.name ?? '');

  function learnerId(row: InsightsRow): string {
    return String(row['learner_id'] ?? '');
  }

  function selectLearner(row: InsightsRow) {
    void insightsApi.selectLearner(learnerId(row));

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    requestAnimationFrame(() =>
      document
        .getElementById(LEARNER_DETAIL_ELEMENT_ID)
        ?.scrollIntoView({ block: 'center', behavior: prefersReducedMotion ? 'auto' : 'smooth' })
    );
  }

  function trend(row: InsightsRow): Array<number | null> {
    const cells = insightsLearnersApi.cells[learnerId(row)] ?? {};

    return exercises.map((exercise) => cells[exercise.id]?.scorePct ?? null);
  }

  function loadExportDocument() {
    return insightsLearnersApi.buildExportDocument({
      filename: `${scopeTitle} learners`,
      title: scopeTitle,
      headers: {
        name: $t('insights.columns.learner'),
        email: $t('insights.columns.email'),
        progress: $t('insights.columns.progress'),
        averageScore: $t('insights.columns.average_score'),
        coursesCompleted: $t('insights.columns.courses_completed'),
        video: $t('insights.columns.video'),
        classroom: $t('insights.columns.classroom'),
        certificates: $t('insights.columns.certificates'),
        lastLogin: $t('insights.columns.last_login'),
        status: $t('insights.columns.status'),
        statusLabels: {
          at_risk: $t('insights.status.at_risk'),
          lagging: $t('insights.status.lagging'),
          on_track: $t('insights.status.on_track'),
          completed: $t('insights.status.completed')
        }
      },
      attemptedByExercise: attempted
    });
  }
</script>

<div class="space-y-4">
  <div class="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
    <LearnersToolbar />
    <ExportMenu
      document={loadExportDocument}
      estimatedRowCount={insightsLearnersApi.total}
      disabled={insightsLearnersApi.total === 0}
      testId="insights-learners-export"
    />
  </div>

  {#if !insightsLearnersApi.hasLoaded}
    <div class="space-y-2" aria-busy="true">
      {#each [0, 1, 2, 3, 4, 5] as index (index)}
        <Skeleton class="h-11 w-full" />
      {/each}
    </div>
  {:else if insightsLearnersApi.rows.length === 0}
    <Empty icon={UsersIcon} title={$t('insights.learners.empty')} class="h-[200px]" />
  {:else}
    <div class={cn('transition-opacity duration-200', insightsLearnersApi.loadingPage && 'opacity-60')}>
        <Table.Root>
          <Table.Header>
            <Table.Row>
              <Table.Head class="ui:bg-background sticky left-0 z-10 min-w-[200px]">{$t('insights.columns.learner')}</Table.Head>
              <Table.Head class="min-w-[140px]">{$t('insights.columns.progress')}</Table.Head>
              {#if courseId}
                {#each exercises as exercise (exercise.id)}
                  <Table.Head class="min-w-[96px] text-center">
                    <div class="flex flex-col items-center gap-1">
                      <span class="line-clamp-2 text-xs" title={exercise.title}>{exercise.title}</span>
                      {#if exercise.passMark !== null}
                        <PassRequiredTag passMark={exercise.passMark} />
                      {/if}
                    </div>
                  </Table.Head>
                {/each}
                <Table.Head>{$t('insights.columns.trend')}</Table.Head>
              {:else}
                <Table.Head class="text-right">{$t('insights.columns.average_score')}</Table.Head>
                <Table.Head class="text-right">{$t('insights.columns.courses_completed')}</Table.Head>
              {/if}
              <Table.Head class="text-right">{$t('insights.columns.video')}</Table.Head>
              <Table.Head class="text-right">{$t('insights.columns.classroom')}</Table.Head>
              <Table.Head>{$t('insights.columns.last_login')}</Table.Head>
              <Table.Head>{$t('insights.columns.status')}</Table.Head>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {#each insightsLearnersApi.rows as row (learnerId(row))}
              {@const isSelected = insightsApi.selection.learnerId === learnerId(row)}
              {@const progress = numberCell(row, 'overall_progress_pct__value') ?? 0}
              {@const status = row['status__value']}
              {@const lastLoginAt = textCell(row, 'last_login_at__value')}
              <Table.Row class={cn(isSelected && 'ui:bg-muted/60')} aria-selected={isSelected}>
                <Table.Cell class="ui:bg-background sticky left-0 z-10">
                  <button
                    type="button"
                    class="ui:focus-visible:ring-ring flex w-full flex-col items-start rounded text-left focus-visible:ring-2 focus-visible:outline-none"
                    onclick={() => selectLearner(row)}
                  >
                    <span class="font-medium">{textCell(row, 'name__value')}</span>
                    <span class="ui:text-muted-foreground text-xs">{textCell(row, 'email__value')}</span>
                  </button>
                </Table.Cell>
                <Table.Cell>
                  <div class="flex items-center gap-2">
                    <div class="ui:bg-muted h-2 w-20 overflow-hidden rounded-full">
                      <div class="ui:bg-primary h-full rounded-full" style="width: {Math.min(100, progress)}%"></div>
                    </div>
                    <span class="text-xs tabular-nums">{Math.round(progress)}%</span>
                  </div>
                </Table.Cell>
                {#if courseId}
                  {#each exercises as exercise (exercise.id)}
                    <Table.Cell class="text-center">
                      <ScoreCell cell={insightsLearnersApi.cells[learnerId(row)]?.[exercise.id]} passMark={exercise.passMark} />
                    </Table.Cell>
                  {/each}
                  <Table.Cell>
                    <Sparkline values={trend(row)} label={$t('insights.columns.trend')} />
                  </Table.Cell>
                {:else}
                  {@const coursesCompleted = numberCell(row, 'courses_completed__value') ?? 0}
                  {@const coursesTotal = numberCell(row, 'courses_total__value') ?? 0}
                  <Table.Cell class="text-right tabular-nums">{formatPercent(row['avg_score_pct__value'])}</Table.Cell>
                  <Table.Cell class="text-right tabular-nums">
                    {$t('insights.of_total', { count: coursesCompleted, total: coursesTotal })}
                  </Table.Cell>
                {/if}
                <Table.Cell class="text-right tabular-nums">{formatPercent(row['video_pct__value'])}</Table.Cell>
                <Table.Cell class="text-right tabular-nums">{formatPercent(row['attendance_pct__value'])}</Table.Cell>
                <Table.Cell class="ui:text-muted-foreground text-xs whitespace-nowrap">
                  {lastLoginAt ? formatLastSeen(lastLoginAt) : $t('insights.never')}
                </Table.Cell>
                <Table.Cell>
                  <div class="flex flex-wrap items-center gap-1">
                    {#if isInsightsStatus(status)}
                      <StatusBadge {status} />
                    {/if}
                    {#if row['is_overdue__value'] === true}
                      <Badge variant="destructive">{$t('insights.flags.overdue')}</Badge>
                    {/if}
                  </div>
                </Table.Cell>
              </Table.Row>
            {/each}
          </Table.Body>
        </Table.Root>
    </div>

    <div class="flex flex-col items-center justify-between gap-2 sm:flex-row">
      <p class="ui:text-muted-foreground text-xs">
        {$t('insights.learners.showing', { shown: insightsLearnersApi.rows.length, total: insightsLearnersApi.total })}
      </p>
      {#if insightsLearnersApi.hasMore}
        <Button
          type="button"
          variant="outline"
          size="sm"
          loading={insightsLearnersApi.loadingMore}
          disabled={insightsLearnersApi.loadingMore}
          onclick={() => insightsLearnersApi.loadMore()}
        >
          {$t('insights.learners.show_more')}
        </Button>
      {/if}
    </div>
  {/if}
</div>
```

`formatLastSeen` (`features/audience/utils/audience-utils.ts`) already gives "3 days ago" in every locale, so reuse it rather than adding another relative-time helper. It prints "a while ago" for a missing value, so "Never" is handled before calling it.

### 16.11 Pages, routes and navigation

`pages/cohort-insights.svelte`:
- Load: an org-scoped `$effect` keyed on org and cohort.
- Header: a course picker, shown only when there is more than one course.
- Live: "Updated Ns ago" and Refresh, plus a visibility-aware poller at the scope's TTL.
- Access: a staff check that matches the sidebar.

```svelte
<script lang="ts">
  import { onDestroy, untrack } from 'svelte';
  import LockIcon from '@lucide/svelte/icons/lock';
  import * as Page from '@cio/ui/base/page';
  import { Empty } from '@cio/ui/custom/empty';
  import { ROLE } from '@cio/utils/constants';
  import { cohortApi } from '$features/cohort/api';
  import { RefreshPageData } from '$features/ui';
  import { t } from '$lib/utils/functions/translations';
  import { currentOrg, isOrgAdmin } from '$lib/utils/store/org';
  import { profile } from '$lib/utils/store/user';

  import { insightsApi, insightsLearnersApi } from '../api';
  import CoursePicker from '../components/course-picker.svelte';
  import InsightsDashboard from '../components/insights-dashboard.svelte';
  import UpdatedAgo from '../components/updated-ago.svelte';
  import { InsightsPoller } from '../utils/insights-poller';

  interface Props {
    cohortId: string;
  }

  let { cohortId }: Props = $props();

  let loadedKey = '';

  const memberRole = $derived(cohortApi.members.find((member) => member.profileId === $profile.id)?.roleId ?? null);
  const canView = $derived($isOrgAdmin === true || (memberRole !== null && memberRole <= ROLE.TUTOR));
  const scope = $derived({ type: 'cohort' as const, id: cohortId });
  const courses = $derived(insightsApi.dashboard?.scope.courses ?? []);

  $effect(() => {
    const organizationId = $currentOrg.id;
    if (!organizationId || !canView) return;

    const key = `${organizationId}:${cohortId}`;
    if (key === loadedKey) return;

    loadedKey = key;
    untrack(() => {
      insightsLearnersApi.reset();
      void insightsApi.loadDashboard(scope).then(() => insightsLearnersApi.load());
    });
  });

  $effect(() => {
    const intervalSeconds = insightsApi.dashboard?.refreshIntervalSeconds;
    if (!intervalSeconds) return;

    const poller = new InsightsPoller(intervalSeconds * 1000, () => {
      void insightsApi.poll();
      void insightsLearnersApi.refreshVisible();
    });
    poller.start();

    return () => poller.stop();
  });

  onDestroy(() => {
    insightsApi.reset();
    insightsLearnersApi.reset();
  });

  async function handleCourseChange(courseId: string | null) {
    await Promise.all([insightsApi.selectCourse(courseId), insightsLearnersApi.load()]);
  }

  async function handleRefresh() {
    await Promise.all([insightsApi.refreshAll(), insightsLearnersApi.refreshVisible()]);
  }
</script>

<svelte:head>
  <title>{$t('insights.title')} · {cohortApi.cohort?.name ?? ''} - ClassroomIO</title>
</svelte:head>

<Page.Root class="w-full">
  <Page.Header>
    <Page.HeaderContent>
      <Page.Title>{$t('insights.title')}</Page.Title>
      {#if canView}
        <p class="ui:text-muted-foreground text-sm">
          {$t('insights.subtitle.cohort', { count: insightsApi.dashboard?.scope.learnerCount ?? 0 })}
        </p>
      {/if}
    </Page.HeaderContent>
    {#if canView}
      <Page.Action>
        {#if courses.length > 1}
          <CoursePicker {courses} value={insightsApi.selection.courseId} onChange={handleCourseChange} />
        {/if}
        <UpdatedAgo generatedAt={insightsApi.generatedAt} />
        <RefreshPageData disabled={!insightsApi.dashboard} onRefresh={handleRefresh} />
      </Page.Action>
    {/if}
  </Page.Header>
  <Page.Body>
    {#snippet child()}
      {#if canView}
        <InsightsDashboard {scope} />
      {:else}
        <Empty icon={LockIcon} title={$t('insights.empty.not_permitted')} variant="page" />
      {/if}
    {/snippet}
  </Page.Body>
</Page.Root>
```

On the course and org pages, `selectCourse` and `insightsLearnersApi.load()` both read `insightsApi.selection.courseId`. Because `selectCourse` sets that synchronously before its first `await`, running the two in parallel is safe.

`pages/course-insights.svelte` is the same shell with `scope = { type: 'course', id: courseId }`, no course picker, and subtitle `insights.subtitle.course`. Access uses `RoleBasedSecurity` in the route (below).

`pages/org-insights.svelte`:
- `$isOrgAdmin === null` means the role is still resolving, so the page shows the dashboard skeleton. `false` shows "not permitted".
- The org presets have no learners table, so this page never touches `insightsLearnersApi`.

```svelte
<script lang="ts">
  import { onDestroy, untrack } from 'svelte';
  import LockIcon from '@lucide/svelte/icons/lock';
  import * as Page from '@cio/ui/base/page';
  import { Empty } from '@cio/ui/custom/empty';
  import { RefreshPageData } from '$features/ui';
  import { t } from '$lib/utils/functions/translations';
  import { currentOrg, isOrgAdmin } from '$lib/utils/store/org';

  import { insightsApi } from '../api';
  import InsightsDashboard from '../components/insights-dashboard.svelte';
  import UpdatedAgo from '../components/updated-ago.svelte';
  import { InsightsPoller } from '../utils/insights-poller';

  let loadedOrgId = '';

  const scope = $derived({ type: 'org' as const, id: $currentOrg.id });

  $effect(() => {
    const organizationId = $currentOrg.id;
    if (!organizationId || $isOrgAdmin !== true || organizationId === loadedOrgId) return;

    loadedOrgId = organizationId;
    untrack(() => void insightsApi.loadDashboard({ type: 'org', id: organizationId }));
  });

  $effect(() => {
    const intervalSeconds = insightsApi.dashboard?.refreshIntervalSeconds;
    if (!intervalSeconds) return;

    const poller = new InsightsPoller(intervalSeconds * 1000, () => void insightsApi.poll());
    poller.start();

    return () => poller.stop();
  });

  onDestroy(() => insightsApi.reset());
</script>

<svelte:head>
  <title>{$t('insights.title')} - ClassroomIO</title>
</svelte:head>

<Page.Root class="w-full">
  <Page.Header>
    <Page.HeaderContent>
      <Page.Title>{$t('insights.title')}</Page.Title>
      {#if $isOrgAdmin !== false}
        <p class="ui:text-muted-foreground text-sm">
          {$t('insights.subtitle.org', { count: insightsApi.dashboard?.scope.learnerCount ?? 0 })}
        </p>
      {/if}
    </Page.HeaderContent>
    {#if $isOrgAdmin !== false}
      <Page.Action>
        <UpdatedAgo generatedAt={insightsApi.generatedAt} />
        <RefreshPageData disabled={!insightsApi.dashboard} onRefresh={() => insightsApi.refreshAll()} />
      </Page.Action>
    {/if}
  </Page.Header>
  <Page.Body>
    {#snippet child()}
      {#if $isOrgAdmin === false}
        <Empty icon={LockIcon} title={$t('insights.empty.not_permitted')} variant="page" />
      {:else}
        <InsightsDashboard {scope} />
      {/if}
    {/snippet}
  </Page.Body>
</Page.Root>
```

`pages/index.ts`:

```ts
export { default as CohortInsightsPage } from './cohort-insights.svelte';
export { default as CourseInsightsPage } from './course-insights.svelte';
export { default as OrgInsightsPage } from './org-insights.svelte';
```

`index.ts` (the feature root):

```ts
export { insightsApi, insightsLearnersApi } from './api';
export * from './pages';
```

**Routes** are thin wrappers:

```svelte
<!-- apps/dashboard/src/routes/(app)/cohorts/[id]/analytics/+page.svelte -->
<script lang="ts">
  import { CohortInsightsPage } from '$features/insights';

  let { data } = $props();
</script>

<CohortInsightsPage cohortId={data.cohortId} />
```

```svelte
<!-- apps/dashboard/src/routes/(app)/courses/[id]/analytics/+page.svelte (delete +page.server.ts) -->
<script lang="ts">
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import { ROLE } from '@cio/utils/constants';
  import { CourseInsightsPage } from '$features/insights';
  import { RoleBasedSecurity } from '$features/ui';

  let { data } = $props();
</script>

<RoleBasedSecurity
  allowedRoles={[ROLE.ADMIN, ROLE.TUTOR]}
  onDenied={() => goto(resolve(`/courses/${data.courseId}/lessons?next=true`, {}))}
>
  <CourseInsightsPage courseId={data.courseId} />
</RoleBasedSecurity>
```

```svelte
<!-- apps/dashboard/src/routes/(app)/org/[slug]/analytics/+page.svelte (delete PR 1's +page.ts redirect) -->
<script lang="ts">
  import { OrgInsightsPage } from '$features/insights';
</script>

<OrgInsightsPage />
```

**Cohort sidebar** (`features/cohort/components/sidebar/cohort-sidebar-navigation.svelte`). Add `AnalyticsIcon` to the existing `@cio/ui/custom/moving-icons` import, and insert this after the People item:

```ts
      {
        id: 'analytics',
        title: $t('cohorts.sidebar.analytics'),
        url: `/cohorts/${id}/analytics`,
        isActive: currentPath.endsWith('/analytics'),
        icon: AnalyticsIcon,
        show: () => canManageMembers
      },
```

**Org navigation** (`features/ui/navigation/org-navigation.ts`). Insert this before the Marketing sub-item, in PR 4. Its test id becomes `org-nav-analytics`:

```ts
      {
        titleKey: 'org_navigation.analytics',
        path: '/analytics',
        requiresAdmin: true,
        matchPattern: '^/org/[^/]+/analytics(/.*)?$'
      },
```

### 16.12 Translations: `en.json`

Add a top-level `insights` namespace, then run `cd apps/dashboard && pnpm translate` and check every `{placeholder}` survived in all 11 locales. Measure labels are keyed by the measure alias the API returns (`<metric>__<agg>`), so a new preset only adds keys, never code.

```json
"insights": {
  "title": "Analytics",
  "subtitle": {
    "cohort": "{count, plural, one {# learner} other {# learners}} in this cohort",
    "course": "{count, plural, one {# learner} other {# learners}} in this course",
    "org": "{count, plural, one {# learner} other {# learners}} across your organization"
  },
  "updated_seconds_ago": "Updated {count}s ago",
  "updated_minutes_ago": "{count, plural, one {Updated # minute ago} other {Updated # minutes ago}}",
  "retry": "Try again",
  "all_courses": "All courses",
  "course_picker": "Course",
  "exercise_picker": "Exercise",
  "not_in_section": "Not in a section",
  "no_cohort": "No cohort",
  "finished": "Finished",
  "awaiting_grade": "Awaiting grade",
  "awaiting_grade_short": "Pending",
  "pass_required_tag": "Pass {mark}%",
  "required_passed_of": "{passed} of {total} passed",
  "of_total": "{count} of {total}",
  "never": "Never",
  "most_common_wrong_answer": "Most common wrong answer: {answer}",
  "status": { "at_risk": "At risk", "lagging": "Lagging", "on_track": "On track", "completed": "Completed" },
  "flags": { "overdue": "Overdue" },
  "overdue_kind": { "goal": "Goal", "compliance": "Compliance", "exercise": "Due date" },
  "legend": {
    "average": "Average",
    "middle_half": "Middle 50% of learners",
    "cohort_average": "Cohort average",
    "learner": "Learner"
  },
  "notes": {
    "scores_by_exercise": "Exercises in course order. A point appears once a quarter of learners have a graded attempt.",
    "hardest_questions": "Share of learners who answered correctly, from each learner's best graded attempt. Questions with fewer than 5 answers are left out."
  },
  "buckets": {
    "progress": { "0": "0–24%", "1": "25–49%", "2": "50–74%", "3": "75–99%", "4": "Done" },
    "score": { "4": "Under 50%", "5": "50s", "6": "60s", "7": "70s", "8": "80s", "9": "90%+" }
  },
  "kpi": {
    "share_of_learners": "{percent} of learners",
    "avg_progress_hint": "Lessons and exercises completed",
    "avg_score_hint": "Best graded attempt, across exercises taken",
    "overdue_hint": "Past a due date and not done",
    "certified": "{count, plural, one {# certified} other {# certified}}",
    "required_pass_hint": "Attempts that met the pass mark",
    "needs_attention_hint": "Inactive, low score or overdue",
    "days": "{count, plural, one {# day} other {# days}}"
  },
  "widgets": {
    "kpi_logged_in_today": { "title": "Logged in today" },
    "kpi_logged_in_week": { "title": "Logged in, last 7 days" },
    "kpi_avg_progress": { "title": "Average progress" },
    "kpi_avg_score": { "title": "Average score" },
    "kpi_overdue": { "title": "Overdue" },
    "kpi_completed": { "title": "Completed" },
    "kpi_enrolled": { "title": "Enrolled" },
    "kpi_completion_rate": { "title": "Completion rate" },
    "kpi_required_pass_rate": { "title": "Required exercises pass rate" },
    "kpi_median_days": { "title": "Median days to finish" },
    "kpi_completions": { "title": "Completions" },
    "kpi_needs_attention": { "title": "Needs attention" },
    "courses_summary": { "title": "Courses in this cohort" },
    "learners_by_status": { "title": "Learners by status" },
    "learner_courses": { "title": "Learner's courses" },
    "needs_attention": { "title": "Needs attention, by reason" },
    "overdue": { "title": "Overdue" },
    "learners": { "title": "Learners" },
    "logins_per_day": { "title": "Learners logged in per day" },
    "score_distribution": { "title": "Average score distribution" },
    "scores_by_exercise": { "title": "Scores by exercise" },
    "progress_distribution": { "title": "Progress distribution" },
    "learner_progression": { "title": "Learner score progression" },
    "section_scores": { "title": "Scores and attendance by section" },
    "section_scorecard": { "title": "Section-by-section scorecard" },
    "hardest_questions": { "title": "Hardest questions" },
    "scores_by_exercise_by_cohort": { "title": "Scores by exercise, by cohort" },
    "exercise_score_distribution": { "title": "Score distribution" },
    "lesson_dropoff": { "title": "Lesson completion drop-off" },
    "hardest_exercises": { "title": "Hardest exercises" },
    "cohorts_in_course": { "title": "Cohorts taking this course" },
    "cohorts_at_a_glance": { "title": "Cohorts at a glance" },
    "hiring_ramp": { "title": "Learners added" },
    "avg_score_by_cohort": { "title": "Average score by cohort" },
    "courses_by_completion": { "title": "Courses by completion" }
  },
  "measures": {
    "rows__count": "Learners",
    "progress_pct__avg": "Average progress",
    "avg_score_pct__avg": "Average score",
    "required_pass__pooled": "Required pass rate",
    "is_completed__count_if": "Completed",
    "is_completed__rate": "Completion rate",
    "is_inactive__count_if": "No login, 2+ days",
    "is_low_score__count_if": "Average score under 50%",
    "is_overdue__count_if": "Overdue",
    "is_low_video__count_if": "Video attendance under 60%",
    "logged_in__count_if": "Learners logged in",
    "section_score_pct__avg": "Average score",
    "video_pct__avg": "Video attendance",
    "attendance__pooled": "Classroom attendance",
    "best_score_pct__avg": "Average score",
    "is_complete__rate": "Completed",
    "members_total__value": "Learners"
  },
  "columns": {
    "learner": "Learner",
    "email": "Email",
    "course": "Course",
    "progress": "Progress",
    "now_at": "Now at",
    "average_score": "Average score",
    "required_passed": "Required exercises",
    "courses_completed": "Courses completed",
    "video": "Video",
    "classroom": "Classroom",
    "certificates": "Certificates",
    "last_login": "Last login",
    "status": "Status",
    "trend": "Trend",
    "overdue_item": "Overdue item",
    "days_overdue": "Days overdue",
    "cohort": "Cohort",
    "section": "Course section",
    "exercises_taken": "Exercises taken",
    "pass_rate": "Pass rate",
    "health": "Health"
  },
  "actions": { "send_reminder": "Send reminder", "remind_all_overdue": "Remind all overdue learners" },
  "hints": {
    "learner_courses": "Select a learner below to see their courses",
    "learner_progression": "Select a learner below to chart their scores",
    "exercise_score_distribution": "Pick an exercise to see its scores"
  },
  "learners": {
    "search": "Search by name or email",
    "empty": "No learners match these filters",
    "show_more": "Show 25 more",
    "showing": "Showing {shown} of {total}",
    "clear_filters": "{count, plural, one {Clear # filter} other {Clear # filters}}",
    "sort": { "status": "Lagging first", "progress": "Least progress", "name": "Name A to Z", "low_score": "Lowest score" },
    "filters": {
      "status": { "label": "Status", "any": "All statuses", "at_risk": "At risk", "lagging": "Lagging", "on_track": "On track", "completed": "Completed" },
      "activity": { "label": "Last login", "any": "Any login", "today": "Logged in today", "idle": "No login 2+ days" },
      "score": { "label": "Average score", "any": "Any score", "lt50": "Under 50%", "mid": "50% to 69%", "gte70": "70% and above" },
      "flag": { "label": "Flags", "any": "Any flag", "overdue": "Overdue", "certified": "Certified", "not_certified": "Not certified" }
    }
  },
  "empty": {
    "no_data": "No data yet",
    "failed": "This chart couldn't load",
    "dashboard_failed": "Analytics couldn't load",
    "not_permitted": "You don't have access to these analytics"
  }
}
```

Elsewhere in `en.json`:
- `cohorts.sidebar.analytics`: `"Analytics"`.
- `snackbar.insights` gains:
  - `reminder_sent`: `"Reminder sent"`
  - `reminder_not_sent`: `"Reminder not sent: already sent today, or the learner turned off these emails"`
  - `reminder_failed`: `"Couldn't send the reminder"`
  - `reminders_sending`: `"Sending reminders…"`
  - `reminders_sent`: `"{count, plural, one {# reminder sent} other {# reminders sent}}"`

Check the existing `snackbar` block's nesting before adding these.

### 16.13 Dashboard tests

Put tests next to the code, as `features/marketing/utils/marketing-utils.test.ts` does. Run them with `pnpm --filter @cio/dashboard test`.

`utils/insights-utils.test.ts` covers:
- **`resolveWidgetSpec`:**
  - Fills `$course`, `$learner` and `$exercise`.
  - Returns `null` when a selection is missing.
  - Appends a course filter for `courseMode: 'any'` only when a course is picked, and never twice.
- **`isWidgetVisible`:** the `all`, `single` and `any` modes, `requires: ['grouping']` against a non-grouped course, and `pass_required`.
- **Defaults:** `defaultCourseId` picks the only course in a one-course cohort. `defaultExerciseId` prefers the last pass-required exercise.
- **`visibleExerciseColumns`:** hides a locked, unattempted exercise; keeps a locked pass-required one; keeps a locked attempted one.
- **`learnerQueryParts`:** every filter value maps to the right spec filters, and "50–69" yields two filters.
- **`pivotLearnerExercises`:** state, score and passed per learner and exercise.
- **`toSeriesPoints`:** sorts by rank and keeps every series.
- **`cohortHealth`:** each branch at its boundary.
- **Formatting:** `formatUpdatedAgo` on both sides of 60 seconds, and `oldestGeneratedAt` picks the oldest timestamp.

`utils/insights-poller.test.ts` uses `vi.useFakeTimers()` and stubs `document.visibilityState`:
- It ticks while the tab is visible.
- It skips ticks while hidden.
- It fires exactly once on return to the tab, then resumes the interval.
- `stop()` removes the listener.

**Manual check:** run through the checklist in section 11 at 375px and 1440px widths, and in light and dark themes. Confirm:
- KPI and chart cards hold their size from skeleton to data.
- A refetch dims cards but never blanks them.
- Keyboard selection of a learner scrolls to the detail without motion when reduced motion is on.
