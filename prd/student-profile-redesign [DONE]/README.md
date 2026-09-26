# Student Profile Redesign PRD

## Status

- Draft

## Prototypes — the UX source of truth

UX comes from Storybook, not from this document. Where prose and prototype disagree on a UI detail, **the prototype wins**.

```bash
pnpm --filter @cio/storybook dev   # http://localhost:6006
```

Then open **Templates → Student Profile** and **Templates → Course Student Detail**.

| Surface                                     | Story                                        | Files                                                                      |
| ------------------------------------------- | -------------------------------------------- | -------------------------------------------------------------------------- |
| Org student profile — Courses tab            | `Templates/Student Profile → Student Profile`             | `packages/storybook/src/templates/student-profile/student-profile.stories.svelte` |
| Org student profile — Grades tab             | `… → Student Profile Grades Tab`             | same                                                                       |
| Org student profile — Activity tab (empty)   | `… → Student Profile Activity Tab`           | same                                                                       |
| Org student profile — one course, not started | `… → Student Profile Single Course`          | same                                                                       |
| Org student profile — no enrollments         | `… → Student Profile No Courses`             | same                                                                       |
| Course student detail                        | `Templates/Course Student Detail → Course Student Detail` | `packages/storybook/src/templates/student-profile/course-student.stories.svelte` |
| Course student detail — nothing attempted    | `… → Course Student Detail Not Started`      | same                                                                       |
| Course student detail — no exercises authored | `… → Course Student Detail No Exercises`     | same                                                                       |

Shared mock data: `packages/storybook/src/templates/student-profile/fixtures.ts`. Field names mirror the real payloads exactly, so a component can be lifted from a story into the app without reshaping data.

> **Deviation from the house process:** these are Storybook stories built from the real `@cio/ui` components, not standalone HTML under `prototypes/`. For a redesign of two existing admin pages that reuse shipped primitives (`UnderlineTabs`, `PercentRingProgress`, `ResourceListRow`, `Table`, `Empty`), Storybook is higher fidelity than a hand-styled HTML mock and cannot drift from the design system. Flagged for veto.

## Purpose

Two dashboard pages answer the same question — "how is this student doing?" — at two scopes: across an org (`/org/[slug]/audience/[profileId]`) and inside one course (`/courses/[id]/people/[personId]`). Both are currently a stack of KPI cards above a colour-coded list. This redesign gives both a persistent identity rail with the metrics that matter, moves the detail into a scannable column, and surfaces per-exercise grades that the API already computes and throws away.

## Problem Statement

- **The page heading says nothing.** Both pages title themselves generically ("Student profile", "People") and bury the person's name in a card below — a heading that costs vertical space on every view while identifying nobody.
- **Three progress indicators compete** on the org page: an overall bar, a per-course bar, and green/yellow card backgrounds that read as warnings rather than status.
- **Grades are a single number.** `Total Average Grade` is the only grade signal on the org page, even though the API fetches every exercise's score per course and discards it (`apps/api/src/services/organization.ts:856-861`).
- **A failed load looks like a loading state.** Both pages end in `{:else} <LoadingPage />`, and their loaders coalesce failures to `null` — so a dead API spins a skeleton forever.
- **There is nowhere to put activity.** The team wants a lesson/submission timeline; the current single-column layout has no home for it.
- **A destructive action sits in the header.** `Reset progress` is a standing `variant="destructive"` button on the course people page (`routes/(app)/courses/[id]/people/+layout.svelte:62`).
- **The org page's overall average grade is numerically broken** — it can render `5200 %`. See Decision 8.

## Confirmed Decisions

1. **Direction: identity rail + tabbed detail** for the org student profile. Chosen from three Storybook prototypes; the other two (single-column "Overview", dense "Compact roster") were deleted.
2. **v1 scope: page shell + Courses tab + Grades tab.** The Activity tab is visible but renders an empty state explaining it is not in this release.
3. **Selected tab lives in the URL** as `?tab=courses|grades|activity`, so staff can link a colleague straight to a student's grades.
4. **The course student detail page gets no tab bar.** It has exactly one dataset (per-exercise attempts); a one-tab tab bar is chrome for nothing. It gets the same rail, with the exercise list beside it.
5. **No shared rail component.** Each page owns its rail. Accepted trade-off: faster to land page-by-page, at the cost of drift risk (see Risks).
6. **Header actions collapse into one 3-dot menu.** `Export progress` on both pages; `Reset progress` joins the menu on the course page instead of being a standing destructive button. `Message student` and `Remove from audience` are cut — no backend exists for either.
7. **Grades show per-exercise rows grouped under a course header row**, matching what the course-scoped page shows for a single course. Requires the API change in Technical Design.
8. **`overallAverageGrade` is fixed as part of this work.** Two separate defects, both live in `apps/api/src/services/organization.ts:947-948`:

   ```ts
   const allGrades = sumArrObject(coursesWithStats, 'average_grade'); // a SUM of percentages
   const overallAverageGrade = calcPercentageWithRounding(allGrades, coursesWithStats.length);
   // calcPercentageWithRounding(a, b) === Math.round((a / b) * 100)
   ```

   - **Double-scaling.** The values are already percentages, so multiplying by 100 again is wrong. Course grades of 72/91/45/0 produce `Math.round((208 / 4) * 100)` = **5200**, and the page renders `5200 %`. Nothing clamps it client-side. It reads as `0 %` only when every course grade is 0 — which is exactly the state the current screenshots happen to be in, which is why it has gone unnoticed.
   - **Dilution.** A course with no grade contributes a `0` to the mean. Excluding those, the same data averages **69%**, not 52%.

   Both are fixed together; `overallCourseProgress` on the line above is correct (it divides raw lesson counts) and must not be touched.

9. **Neither page renders a `Page.Title` or `Page.Subtitle`.** The header carries only the back link and the 3-dot menu; the rail identifies the student. This removes "Student profile / Progress, grades, and activity across their courses." and "People / _course title_". Two consequences that are easy to get wrong — see Technical Design § Removing the page headings.

10. **"No grade" is representable, and is not a grade of zero.** `average_grade` and `overallAverageGrade` become `number | null`; `null` renders as an em dash, never `0%`. Two things force this:

    - `calcPercentageWithRounding(0, 0)` returns `0`, so a course with nothing gradeable already reports a real-looking `0%` today.
    - **Filtering on `exercises.length > 0` is not sufficient.** An authored exercise whose questions sum to zero points also cannot yield a grade. The test is whether the course has any gradeable points at all — `sum(totalPoints) > 0` — not whether exercises exist.

    Same rule as the existing `—/20` treatment for an ungraded submission: absence of a mark is shown as absence, not as zero.

11. **The grade for an exercise is its latest submission.** `getUserExercisesStats` selects submissions with no `ORDER BY` and then calls `submissions.find(...)`, and there is **no unique constraint on `submission(exerciseId, submittedBy)`** — only foreign keys. So a student with two submissions for one exercise currently gets whichever row Postgres happens to return first. The query must order deterministically and the policy must be stated: **most recent submission by `created_at`, tie-broken by `id`**.

12. **A failed exercise query must not look like an empty one.** `getUserExercisesStats` catches every error and returns `[]` (`packages/db/src/queries/analytics/analytics.ts:213-217`). Exposing that as `exercises: []` would render the Grades tab's "nothing graded yet" empty state on a database failure — the exact confusion this PRD sets out to remove elsewhere. The failure has to reach the caller.

## Current-State Audit

| Capability                    | Current state                                                                                      | Notes                                                                             |
| ----------------------------- | -------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| Org page identity             | `HeroProfileCard` (`$features/ui/analytics/hero-profile-card.svelte`)                               | Also used by the course page. **Keep the component** — both pages stop using it.  |
| KPI tiles                     | 3× `ActivityCard`                                                                                   | Used in **5 other places** (lms dashboard, mcp, media, org dash). Do not delete.  |
| Per-exercise data (org page)  | Fetched per course by `getUserExercisesStats`, then discarded after averaging                        | `apps/api/src/services/organization.ts:850-861`                                   |
| Per-exercise data (course page) | Already returned as `userCourseAnalytics.userExercisesStats`                                       | Full shape: `id, lessonId, lessonTitle, title, status, score, totalPoints, isCompleted` |
| Failed server load            | Coalesced to `null` by `safeServerApi`, then rendered as `<LoadingPage />`                           | No error state exists anywhere in the dashboard                                    |
| Empty state idiom             | `Empty` from `@cio/ui/custom/empty`, `variant="page"`                                               | 40 files use it; the pattern to follow                                            |
| Tab state in URL              | None on either page                                                                                 | Canonical pattern to copy: `$features/course/pages/exercise.svelte:476-523`        |
| Reset progress                | Shipped: `POST /course/:courseId/members/:memberId/reset-progress`, `ResetProgressButton` + dialog   | `prd/reset-student-course-progress [DONE]`. Course-scoped only.                    |
| Export progress               | Does not exist                                                                                      | Reuse the CSV pattern in `$features/course/utils/marks-utils.ts:151` (`Papa.unparse`) |
| `ScrollToTop`                 | Does not exist in `packages/ui`                                                                     | Specced in `prd/scroll-to-top/README.md`. **Out of scope here** — see Non-Goals.  |
| Org page container width      | `md:max-w-5xl`                                                                                      | Fits a 19rem rail + detail column                                                 |
| Course page container width   | `md:max-w-3xl`                                                                                       | Too narrow for a rail; must widen                                                 |
| Dashboard types               | Hand-written `UserCourseWithStats` (`$lib/utils/types/analytics.ts:70-89`)                            | 7 declared fields do not exist at runtime (`org_id`, `total_lessons`, `total_students`, `member_profile_id`, `banner_image`, `is_published`, `progress_rate`) |
| `features/audience/`          | No `utils/types.ts`; the route's `+page.server.ts` inlines its inferred types                        | CLAUDE.md wants them in `features/{domain}/utils/types.ts`                         |
| Translations                  | Most needed keys already exist under `analytics.*`                                                    | `exercises`, `graded`, `not_graded`, `average_grade`, `last_seen`, `a_while_ago`, `lessons_completed` are all present and unused by these pages |

## Product Goals

1. The student being viewed is identifiable at a glance on both pages, at any scroll position.
2. A teacher can see every exercise a student attempted, its score, and whether it has been graded — without leaving the page.
3. Both pages tell the truth when data fails to load.
4. The two pages read as one system.
5. No regression for the five other consumers of `ActivityCard` or the one other consumer of `HeroProfileCard`.

## Non-Goals (v1)

- **The Activity timeline.** The timestamps exist (`lesson_completion.created_at`, `submission.created_at`), but no query or endpoint returns them. The tab ships as an empty state.
- **A shared rail component** (Decision 5).
- **`Message student` and `Remove from audience`** — no endpoints exist.
- **`ScrollToTop`.** It is unbuilt; building it belongs to `prd/scroll-to-top/README.md`, not here. Note that both redesigned pages qualify for it once it exists.
- **A per-lesson completion list.** Only counts exist today, not per-lesson rows.
- **Retiring the hand-written `analytics.ts` types.** The new pages use inferred types; the legacy interfaces stay for their other consumers.

## Functional Requirements

### Org student profile — `/org/[slug]/audience/[profileId]`

Prototype: `Templates/Student Profile`.

**Identity rail** (sticky from `lg` up, 19rem): avatar, full name, email, a `Last seen` badge, a `PercentRingProgress` for overall course progress, then a facts list — Enrolled courses, Completed, In progress, Average grade.

**Tabs** — `Courses` (with a count badge), `Grades`, `Activity`. Selected tab syncs to `?tab=`; an unknown or absent value normalizes to `courses`.

- **Courses tab** — one card per course: logo, title (links to the course), description clamped to two lines, a status badge (`Complete` / `In progress` / `Not started`, derived from `lessons_completed` vs `lessons_count`), then a footer with the progress ring plus Lessons, Exercises and Grade figures. Empty state when the student has no enrollments.
- **Grades tab** — a single table. Each course contributes a muted group header row (course title, exercises completed/total, average-grade badge) followed by one row per exercise: title (links to the exercise), lesson title beneath, score, and status. **An ungraded submission renders `—/20`, never `0/20`** — a zero the student did not earn is a different claim. Status is `Graded` / `Awaiting grade` / `Not submitted`. A course with no exercises shows its header row only. Empty state when there are no enrollments.
- **Activity tab** — `Empty` state naming what will land here and why it has not.

**Header** — the back link to Audience on the left, a 3-dot menu containing `Export progress` on the right. No heading or subtitle (Decision 9).

### Course student detail — `/courses/[id]/people/[personId]`

Prototype: `Templates/Course Student Detail`.

**Identity rail** — same construction, course-scoped facts: Lessons, Exercises, Assignment completion, Average grade, and a ring for course progress.

**Header** — the back link to People on the left, the 3-dot menu on the right. No heading or subtitle (Decision 9). Which course this is stays legible from the surrounding course shell and nav, so it is not repeated here.

**Exercise list** — a card with an `Exercises` header (count badge plus a completion bar), then one row per exercise: an icon, the title (links to the exercise), the lesson title beneath (links to the lesson) or `Course-level exercise` when `lessonId` is null, the score, and a status badge. Same `—/N` rule for ungraded work. Empty state when the course has no exercises authored.

**Header** — the 3-dot menu holds `Export progress` and `Reset progress`. Reset keeps its existing confirmation dialog, its `RoleBasedSecurity allowedRoles={[1, 2]}` gate, and its disabled condition (`memberId && progressImpact`); a disabled reset renders as a disabled menu item.

### Both pages

- A failed load renders `Empty variant="page"` with an error icon and a retry action — never `LoadingPage`.
- All copy comes from translation keys.

## Technical Design

### API — one changed response, no new routes

`getUserAnalytics` already has the rows in hand; it just stops discarding them. There is **no zod response schema, DTO or serializer** on this route, so the new field flows to the dashboard's `InferResponseType` automatically.

```ts
// apps/api/src/services/organization.ts — inside the per-course map
const totalEarnedPoints = sumArrObject(userExercisesStats, 'score');
const totalPoints = sumArrObject(userExercisesStats, 'totalPoints');
const averageGrade = calcPercentageWithRounding(totalEarnedPoints, totalPoints);

return {
  ...course,
  ...courseProgress,
  progress_percentage: calcPercentageWithRounding(lessonsCompleted, lessonsCount),
  average_grade: averageGrade,
  exercises: userExercisesStats // ← was discarded
};
```

Decisions 8 and 10 together. Note that `calcPercentageWithRounding` is **not** the right helper for the aggregate — its `× 100` is what produces `5200 %`. These values are already percentages, so this is a plain mean, and a course with no gradeable points is excluded rather than counted as zero:

```ts
// A course is gradeable only if its exercises carry points. Authored exercises
// worth 0 points cannot produce a grade any more than no exercises can.
const gradeablePoints = (exercises: StudentExerciseStat[]) =>
  exercises.reduce((sum, exercise) => sum + exercise.totalPoints, 0);

const averageGrade = gradeablePoints(userExercisesStats) > 0
  ? calcPercentageWithRounding(totalEarnedPoints, totalPoints)
  : null; // per-course, replaces the old `average_grade: 0`

// …then, across courses:
const graded = coursesWithStats.filter((course) => course.average_grade !== null);
const gradeTotal = graded.reduce((sum, course) => sum + course.average_grade!, 0);
const overallAverageGrade = graded.length === 0 ? null : Math.round(gradeTotal / graded.length);
```

`sumArrObject` is not used here — it coerces `null` to `0` via `|| 0`, which would reintroduce the dilution this fixes.

Leave `overallCourseProgress` alone — `calcPercentageWithRounding(completedLessons, totalLessons)` is correct because those are raw counts, not percentages.

All 8 `calcPercentageWithRounding` call sites in the repo were audited — line 948 is the only one that passes already-percentage values. The rest divide raw counts and are correct.

### Query-layer changes (Decisions 11 and 12)

`getUserExercisesStats` needs two fixes before its rows can be trusted on a page, in `packages/db/src/queries/analytics/analytics.ts`:

```ts
// Decision 11 — deterministic submission choice. Latest wins.
const submissions = await db
  .select({ /* … */ createdAt: schema.submission.createdAt })
  .from(schema.submission)
  .where(and(inArray(/* … */), eq(schema.submission.submittedBy, groupMember[0].id)))
  .orderBy(desc(schema.submission.createdAt), desc(schema.submission.id));
// `submissions.find(…)` then returns the newest for that exercise, not an arbitrary row.
```

```ts
// Decision 12 — stop swallowing failures.
} catch (error) {
  console.error('getUserExerciseStats error:', error);
  throw new Error('Failed to fetch user exercise stats');
}
```

The `throw` matches the repo's query-layer convention (CLAUDE.md § Query error logging), but **the blast radius makes it the wrong first move.** There are two other callers: `packages/core/src/services/course/course.ts:666`, and `course.ts:553` — which calls it **once per student inside a course-wide loop**. Converting the catch to a throw there means one unreadable submission row takes down the entire course analytics page, trading a quiet wrong answer for a loud outage.

Preferred approach: leave the `catch` in place and have `getUserAnalytics` distinguish the two cases itself, so only this feature changes behaviour — e.g. return `exercises: StudentExerciseStat[] | null` per course, with `null` meaning "could not load" and `[]` meaning "none authored", and have the Grades tab render an error row for that course. Revisit the throw as its own hardening PR across all three call sites.

The early `return []` paths (no exercises, course missing, user not a group member) are legitimate empties and stay as they are.

### Dashboard types

Add `apps/dashboard/src/lib/features/audience/utils/types.ts`, following `features/tag/utils/types.ts`:

```ts
import { classroomio, type InferResponseType } from '$lib/utils/services/api';

export type GetAudienceAnalyticsRequest = (typeof classroomio.organization.audience)[':userId']['analytics']['$get'];
export type GetAudienceAnalyticsSuccess = Extract<InferResponseType<GetAudienceAnalyticsRequest>, { success: true }>;
export type AudienceAnalytics = GetAudienceAnalyticsSuccess['data'];
export type AudienceAnalyticsCourse = AudienceAnalytics['courses'][number];
export type AudienceAnalyticsExercise = AudienceAnalyticsCourse['exercises'][number];
```

Then move the inlined types out of `+page.server.ts` and **type the page props from `AudienceAnalytics`**. This matters: `user-analytics.svelte` currently does untyped `let { data } = $props()` and annotates with the hand-written `UserAnalytics`, which silently overrides the inferred shape — the reason the phantom fields went unnoticed for so long.

### Submission status

`status` is a raw FK code with no label in the payload. Use the existing constant, never a literal `3`:

```ts
import { STATUS } from '$features/course/components/exercise/constants';
// { PENDING: 0, SUBMITTED: 1, IN_PROGRESS: 2, GRADED: 3 }
```

`status` is `undefined` when there is no submission — "not submitted" is `!isCompleted`, never `status === 0`.

### URL tab state

Copy `$features/course/pages/exercise.svelte:476-523` verbatim in shape: a `normalizeTab()` that falls back to `courses`, an `onMount` hydrate, a URL→state `$effect`, and a state→URL `$effect` guarded with `untrack` so it cannot self-navigate. Navigate with `goto(…, { replaceState: true, keepFocus: true, noScroll: true })`. No `invalidateAll` — the tab does not change what the loader fetches.

### Removing the page headings

Decision 9 is not a two-line deletion. Two traps:

1. **Keep the browser tab title.** `routes/(app)/org/[slug]/audience/[...params]/+page.svelte` uses `audience.user_analytics.title` in two places — a `<svelte:head><title>` and the `Page.Title`. Only the second goes. The translation key stays in use; do not delete it.

2. **The course page's heading belongs to a shared layout.** `routes/(app)/courses/[id]/people/+layout.svelte` wraps both the people **list** and the person **detail** view, and its `Page.Title` currently contains the back button _inside_ the heading:

   ```svelte
   <Page.Title>
     {#if data.personId}
       <RoleBasedSecurity allowedRoles={[1, 2]}>
         <IconButton onclick={handleBackNavigation}><ArrowLeftIcon size={16} /></IconButton>
       </RoleBasedSecurity>
     {/if}
     {$t('course.navItem.people.title')}
   </Page.Title>
   ```

   Deleting it outright would strip the "People" heading off the list page too. Restructure so the back button is a sibling of the heading rather than a child, and render the heading only when `!data.personId`.

### Failed-load state

Have each loader return a discriminant beside the coalesced data, then branch on it:

```ts
const result = await safeServerApi<GetAudienceAnalyticsSuccess>(() => /* … */);
return { userId, orgId, analytics: result.ok ? result.body.data : null, loadFailed: !result.ok };
```

### Frontend file plan

| File                                                                            | Change                                                                    |
| ------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| `features/audience/utils/types.ts`                                              | New — inferred types above                                                |
| `features/audience/components/student-profile-rail.svelte`                       | New — identity rail                                                       |
| `features/audience/components/student-course-card.svelte`                        | New — Courses tab card                                                    |
| `features/audience/components/student-grades-table.svelte`                       | New — grouped grades table                                                |
| `features/audience/components/index.ts`                                          | Export the three                                                          |
| `features/audience/pages/user-analytics.svelte`                                  | Rewrite to rail + tabs; drop `HeroProfileCard`/`ActivityCard`; add error state |
| `routes/(app)/org/[slug]/audience/[...params]/+page.server.ts`                   | Import types from the feature; add `loadFailed`                           |
| `routes/(app)/org/[slug]/audience/[...params]/+page.svelte`                      | Drop `Page.Title`/`Page.Subtitle`; **keep** the `<svelte:head><title>`     |
| `features/course/components/people/student-course-rail.svelte`                   | New — course-scoped rail                                                  |
| `features/course/components/people/student-exercise-list.svelte`                 | New — exercise list                                                       |
| `features/course/components/people/student-actions-menu.svelte`                  | New — 3-dot menu wrapping export + `ResetProgressDialog`                  |
| `routes/(app)/courses/[id]/people/+layout.svelte`                                | Swap the standing reset button for the menu; widen to `md:max-w-5xl`; heading only when `!data.personId`, back button lifted out of `Page.Title` |
| `routes/(app)/courses/[id]/people/[personId]/+page.svelte`                       | Rewrite to rail + list; **delete the `console.log` `$effect` at lines 73-75**; add error state |
| `features/course/utils/export-progress.ts`                                       | New — CSV builder modelled on `marks-utils.ts:151`                        |
| `lib/utils/translations/en.json`                                                 | New keys (below), then `pnpm translate`                                   |

### Translation keys

Reuse the existing `analytics.*` keys wherever they fit (`exercises`, `graded`, `not_graded`, `average_grade`, `last_seen`, `a_while_ago`, `lessons_completed`, `enrolled_courses`, `overall_course_progress`, `completed`, `incomplete`). New keys needed under `audience.user_analytics.*` and `analytics.*`:

`tabs.courses`, `tabs.grades`, `tabs.activity`, `activity_empty_title`, `activity_empty_description`, `in_progress`, `not_started`, `awaiting_grade`, `not_submitted`, `assignment_completion` (exists), `course_level_exercise`, `score`, `status`, `export_progress`, `student_actions`, `no_courses_title`, `no_courses_description`, `no_exercises_title`, `no_exercises_description`, `no_grades_title`, `no_grades_description`, `load_failed_title`, `load_failed_description`, `retry`.

After editing `en.json`: `cd apps/dashboard && pnpm translate`, then verify `{}` placeholders survived translation in all 9 other locales.

## Implementation Order

1. **API** — add `exercises` to each course in `getUserAnalytics`; fix `overallAverageGrade` per Decision 8. Verify: `pnpm --filter @cio/api^... build && pnpm --filter @cio/api build`.
2. **Types** — add `features/audience/utils/types.ts`; repoint `+page.server.ts`; type the page props from `AudienceAnalytics`. This is the step that proves step 1 reached the dashboard.
3. **Org page shell** — rail + tabs + URL sync + Courses tab + empty and failed states.
4. **Grades tab** — grouped table.
5. **Course page** — widen the container, rail + exercise list, 3-dot menu with export and reset, delete the debug `$effect`.
6. **Export progress** — CSV on both pages.
7. **Translations** — `en.json`, then `pnpm translate`, then review placeholders.
8. **Verify** — `test -f apps/dashboard/.env || cp apps/dashboard/.env.example apps/dashboard/.env`, then `pnpm --filter @cio/dashboard^... build && pnpm --filter @cio/dashboard build`, then `pnpm format:check`.

Node 20 throughout: `export PATH="$HOME/.nvm/versions/node/v20.19.3/bin:$PATH"`.

## Acceptance Criteria

1. Both pages show the student's name, email and last-seen at any scroll position on `lg` and above.
2. `?tab=grades` deep-links to the Grades tab; an unknown value falls back to Courses; switching tabs adds no browser-history entries and does not scroll the page.
3. The Grades tab lists every exercise the API returns, grouped by course, with the course's average on the group row.
4. An ungraded submission renders `—/N`. No screen anywhere renders an unearned `0/N`.
5. `overallAverageGrade` is a true mean in the range 0–100 — a student with course grades 72/91/45 and one exercise-free course reports `69%`, not `5200%` and not `52%`.
6. A course with no gradeable points renders an em dash, not `0%`. This holds both for a course with no exercises and for a course whose exercises sum to zero points. A student with nothing gradeable anywhere shows an em dash for the overall figure, and nothing divides by zero.
7. An exercise with two submissions shows the most recent one, deterministically, across repeated loads.
8. A failed exercise query renders an error, not the "nothing graded yet" empty state.
9. Killing the API makes both pages render an error state with a retry — not a skeleton.
10. `Reset progress` works from the 3-dot menu with its confirmation dialog, role gate and disabled condition intact.
11. `Export progress` downloads a CSV whose rows match what is on screen.
12. The course page renders correctly for an exercise with `lessonId: null`.
13. Neither page renders a heading or subtitle; the browser tab still titles correctly on the audience page, and the people **list** page keeps its "People" heading.
14. **Zero regression:** the five other `ActivityCard` consumers and the `HeroProfileCard` consumer render unchanged.
15. All user-facing copy resolves from translation keys; no literal strings in components; the 9 non-English locales keep every `{}` placeholder.
16. `pnpm --filter @cio/dashboard build`, `pnpm --filter @cio/api build` and `pnpm format:check` all pass.

## Risks and Mitigations

| Risk                                                                                                   | Mitigation                                                                                                                          |
| ------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------- |
| Two rail implementations drift (Decision 5)                                                             | Build the course rail by copying the audience rail in the same PR, so they start identical; note in both files that they are a pair. |
| Deleting `ActivityCard`/`HeroProfileCard` breaks six other screens                                      | Neither is deleted. Acceptance criterion 14 covers it.                                                                              |
| `exercises` bloats the audience payload for a student in many courses                                    | Rows are small and already computed. If it becomes a problem, move the Grades tab to its own endpoint — the tab is already lazy UI.  |
| The `average_grade` fix changes a number people may have screenshotted or reported on                   | Call it out in the changelog as a correction with both formulas stated. The old value was not a plausible-but-different number — it was out of range — so nothing downstream can have been calibrated to it. |
| The same percentage-of-percentages defect exists elsewhere                                               | Checked: it does not. All 8 `calcPercentageWithRounding` call sites were audited (`apps/api/src/services/organization.ts`, `packages/core/src/services/course/course.ts`) and line 948 is the only one passing already-percentage values; every other divides raw counts. No follow-up needed. |
| Hand-written `UserAnalytics` keeps masking type errors elsewhere                                         | Step 2 types these two pages from the API. The legacy interfaces are left for other consumers and flagged for a separate cleanup.    |
| `status === 3` literals spread further                                                                  | Import `STATUS`; grep for bare `=== 3` in the touched files before opening the PR.                                                   |
| Both pages qualify for `ScrollToTop`, which does not exist                                              | Explicit Non-Goal, tracked in `prd/scroll-to-top/README.md`. Revisit once that component lands.                                      |
