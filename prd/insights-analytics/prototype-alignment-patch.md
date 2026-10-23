# Insights Analytics: Prototype Alignment Patch

## 0. Read this first

**What this is.** A patch on top of the insights analytics implementation that already exists in this worktree (`feats/insights-analytics`, uncommitted). The goal is to make the cohort, course and organization dashboards match `prototypes/insights-analytics/index.html` in every product-facing detail, except the exclusions in 0.3. It also replaces the "required pass rate" with a clearer, more useful metric (section 1).

**Before you start:**
1. Read `prd/insights-analytics/implementation-plan.md`, sections 3 (definitions), 15 (db/API code) and 16 (dashboard code). This patch changes that code; it does not repeat it.
2. Open the prototype in a browser with customer mode on: in a copy, set `const CUSTOMER = true;`. That view hides the developer annotations and is the source of truth for every label, column, note and layout. Keep it open beside the app.
3. Follow `AGENTS.md` and `skills/writing-code/SKILL.md`:
   - no explanatory comments
   - JSDoc for contracts only
   - a blank line after early returns
   - no `await` or multi-call expressions inside object literals
   - types in `utils/types.ts`
   - copy in `en.json` only
   - theme tokens take `ui:`
4. Run `git status`. Another session built the feature, and may still be editing files in this worktree. Rebase your understanding on the files as they are, not on this document's snippets, wherever they differ.

**Base state this patch was written against (2026-10-23):**
- the db, API and dashboard layers from plan sections 15 and 16
- the other session's improvements, which this patch keeps:
  - gap-filled weekly `org_member_row` (`members_added` and `members_total`)
  - `fillRowSpans`
  - `line-chart.svelte`
  - refresh claims per spec hash
  - the `measure-insights.ts` script

### 0.1 Delivery

All of this is one PR, `fix(insights): align dashboards with the prototype and report first-try pass rates`. Like the rest of the feature it targets `main`, and it adds **no migration** (section 4.9). Order the work by section number: shared, then db, core, API, dashboard, tests, docs.

### 0.2 What "match the prototype" means

For each scope, the prototype's customer-mode render defines:
- the KPI cards, with their labels, context lines and trend colours
- the scope chips under the page title
- the course picker row
- every widget, with its title, chart type, columns, notes and width, in the prototype's order for each picker mode
- table columns and their order
- status pills and heat-cell colours
- learner selection behaviour
- the learner table's search, filters, sort, page size, footer and export

The prototype's "How the same widgets serve every scope" table also counts. It is why the course dashboard additionally carries the learners table, section scorecard and "needs attention", which the PRD requires because the old course page had a per-student table.

### 0.3 Exclusions: everything else must match

| Prototype element | Why it is excluded | What ships instead |
| --- | --- | --- |
| "Final exam" (columns, tags, KPI, histogram, "average by cohort") | Removed from the product by [#1255](https://github.com/classroomio/classroomio/pull/1255) | Exercises with a **pass mark**, and the **"Passed first try"** rate (section 1). The course histogram gets an exercise picker. The org widget becomes "Average score by cohort" |
| Learning time per day; peak concurrent learners | Blocked by #1299 | Nothing (already true) |
| Supervisor copied on reminders | Blocked by #1302 | Nothing (already true) |
| "Scheduled reports" card; customer-mode "Planned next" card | Not v1 product (PRD Phase 3) | Nothing |
| Developer annotations: data badges, metric spec lines, the placement banner, the "How the same widgets serve every scope" table | Prototype tooling, hidden in customer mode | Nothing |
| "Show 10 more" on the learners table | Appending pages to a list that refreshes every 30 seconds and sorts "lagging first" repeats or skips learners as their status changes. Each refresh would also re-read every row shown so far. The app's other tables use numbered pages | The app's `TablePagination`, 10 per page, under the footer "Showing 11–20 of N matching · N learners in cohort" (6.4, 6.9) |

**Range.** The course view's static **"Range: last 30 days"** chip becomes a working range picker on all three dashboards. It offers Marketing's options plus **All time**, which is the default and shows the dashboards as the rest of this patch describes. Section 2.5 defines what a range changes. The course numbers are live, like every other scope's, so the course page also shows the live chip (6.6).

**Wording the product generalises.** The prototype was written for one pilot customer. Two of its labels are that customer's own words, and would read as wrong for an organization that isn't hiring:
- "Hiring ramp vs target" ships as **"Enrolled learners vs target"**.
- "First-wave target" ships as **"Target"**.

The chart itself is unchanged (6.12).

## 1. Pass rate: decision and naming

### 1.1 What the current metric does

`required_pass` is pooled over (learner, exercise-with-pass-mark) pairs:

> pairs whose **best** graded attempt met the pass mark ÷ pairs with a graded attempt

Your test (HIPAA quiz, pass mark 79, one 1-point attempt scored 1/1) correctly gave 100%. Before you set the pass mark, no exercise in those courses had one, so the bar had no value and simply wasn't drawn.

### 1.2 Should it stay? No

The metric drifts to 100% by design, for two reasons:
- An exercise with a pass mark is how a course demands a pass. Completion and certificates require it (`submissionMeetsCompletionPolicySql`).
- Learners can retake it. Migration 0038 set `allow_multiple_attempts = true` on every converted final. Without retakes, one fail would block a learner forever, so authors who set a pass mark need retakes on.

So over time, "best attempt met the mark" approaches "everyone who tried, except whoever is mid-retake". It cannot compare cohorts or show which exercise is hard, which is what the prototype's pass-rate bars and KPIs are for.

| Option | Shows | Drifts to 100%? | Comparable across cohorts | Actionable |
| --- | --- | --- | --- | --- |
| A. Best attempt (today) | Who eventually passed | Yes | No | Weakly |
| **B. First try** | Who met the mark on their first graded attempt | No | Yes | Yes: which exercise, cohort or course is hard |
| **C. Still to pass** (count) | Who took it, was graded, and hasn't met the mark | Not a rate | n/a | Yes: who to help now |

**Decision: ship B as the rate, and C as a count beside it.** When retakes are off, B equals A, so nothing is lost. "First-time pass rate" is the standard certification-training measure, and it gives the prototype's bars a stable meaning.

### 1.3 Exact definitions

These are per (learner, exercise with a pass mark). An exercise has a pass mark when `completion_policy = 'passed'`, and the mark is `COALESCE(pass_threshold, 100)`.

- **First attempt:** the learner's earliest submission (`created_at`, then `id`).
- **`passed_first_try`:**
  - `NULL` when the first attempt is not graded yet (`grading_state <> 'completed'`), or when the exercise has no points.
  - Otherwise `ROUND(first_total × 100 / max_points) >= pass_mark`, the same rounding as completion.
  - A learner whose first attempt is still awaiting a grade drops out until it is graded. They are never counted as a fail.
- **`still_to_pass`:** the learner has a graded attempt, and `is_complete` is false (no attempt has met the mark yet).
- **"Passed first try" rate:**
  - for a course, cohort, exercise or section: Σ `passed_first_try` ÷ Σ (`passed_first_try IS NOT NULL`)
  - "–" when that denominator is 0
- **Section "Passed first try":** among learners with a graded first attempt on **every** exercise with a pass mark in the section, the share who passed all of them on the first try.

### 1.4 Names: a student's result never looks like your setting

| Concept | Owner | Label |
| --- | --- | --- |
| The threshold on an exercise | You (setting) | **Pass mark** (column tag "Pass mark 70%") |
| Rate defined above | Learners (result) | **Passed first try** |
| Count defined above | Learners (result) | **Still to pass** |
| Learner's exercises with a pass mark that they have met | Learner (result) | **Exercises passed**, "2 of 3" |
| Learners graded on any exercise with a pass mark | Learners (result) | **Took a pass-mark exercise** |

Tooltips spell out the meaning:
- "Passed first try": "Learners who reached the pass mark on their first graded attempt, on exercises that have a pass mark."
- "Still to pass": "Learners who were graded on an exercise with a pass mark and haven't reached it yet."

When a course has no exercise with a pass mark, every "Passed first try" cell and bar reads "–". The chart note then says why, so a missing bar never looks like a bug.

## 2. Gaps and fixes

Each fix is implemented by the task code in sections 3 to 7, so this table doubles as the review checklist. "Proto" quotes the customer-mode prototype.

### 2.1 Cohort

| # | Prototype | Current | Fix |
| --- | --- | --- | --- |
| C1 | Opens on **All courses**. The picker row reads "Course [All courses ▾]" above the KPIs, and always shows | A one-course cohort auto-selects its course and hides the picker | Always default to All courses and always show the picker (6.2, 6.11) |
| C2 | Chips: "Live · updated Ns ago · refreshes every 30s", "{cohort} · {description}", "{n} learners", "Courses: {n}" | No chips; a subtitle; "Updated…" in the header | `InsightsScopeChips` (6.6). Drop the subtitle |
| C3 | KPIs: Logged in today "n / N" "x% of the cohort"; Average progress "lessons completed / total"; Average score "across exercises taken"; Overdue "past their deadline, not done" (red when high); Completed "x% of the cohort · N certified" (certified only under All courses) | Partial context; no "% of the cohort"; no trend colour | KPI formatters and the `KpiCard` `trend` prop (6.1, 6.3) |
| C4 | **Courses in this cohort**: a grouped bar (7) of average progress, average score and pass rate, beside **Learners by status** (5) | Bar and table merged into one card | Separate widgets that share one request (5.1, 6.2, 6.8) |
| C5 | **Course details** table (12): Course, Learners, Avg progress, Avg score, Completed, Final exam taken, Final exam pass rate | Merged; no Completed column; no "taken" column | `course-details.svelte`: …, Completed, **Took a pass-mark exercise**, **Passed first try** (6.8) |
| C6 | Learner's courses, "{name}: courses" (12), **preselected** on the first learner. Columns: Course, Progress, Now at (section), Average score, Final exam. The note says to click a row to switch | Empty "select a learner" hint; generic title | Preselect the first learner, use the dynamic title, show "Now at" as the section, and an **Exercises passed** column (6.2, 6.8) |
| C7 | Single course: **"{name}: scores by exercise"** (7), with chips "Latest x%" and "Progress y% · now at {section}". The learner line is solid; the cohort average is muted and dashed | No chips, no dashes, generic title | `learner-progression.svelte` (6.8) |
| C8 | Single course: "Scores by exercise, {course}" | Generic title | Title variables (6.7) |
| C9 | Single course: "Scores and attendance by section" with x labels "Section 1…" | Section titles as labels | `section-scores.svelte` (6.8) |
| C10 | Scorecard rows "Section N · {title}"; Exercises taken "n / N"; heat cells for score and pass rate | Plain title; plain percentages | `section-scorecard.svelte` (6.8) |
| C11 | Needs attention: bar tones (inactive and low score red; overdue and low video amber); max = cohort size; note | Untoned; max = largest value | `needs-attention.svelte` (6.8) |
| C12 | Overdue: **one row per learner**, with Learner, Course, Progress, Last login, [Send reminder]. A button "Remind all {n} overdue learners". Sent rows turn to "Queued" | One row per item, with title, kind and days | `overdue_learner` source (4.4), `overdue-table.svelte` (6.8), and a per-learner reminder (5.3) |
| C13 | Hardest questions: the bar hint reads "{section} · most common wrong answer: X" | Wrong answer only | `question_context` (4.4); renderer (6.8) |
| C14 | Learners table: page size **10**, "Show 10 more", footer "Showing x of y matching · N learners in cohort". All-courses columns: Learner, Progress, Average score, Courses completed, Video, Classroom, **Certificate**, Last login, Status. One course: Learner, Progress, **Now at**, exercises (with the pass tag on pass-mark exercises), Trend, Video, Classroom, Certificate, Last login, Status. Tinted status pill, plus an "Overdue" pill | Page size 25; no Certificate column; no Now at; solid badges | Section 6.9, with numbered pages in place of "Show 10 more" (0.3) |
| C15 | Heat cells: ≥70 green, 50–69 amber, below 50 red; a pass-mark cell is green at or above the mark, red below | Four-tone marks palette | `scoreTone` and `TONE_CELL_CLASS` (6.3) |
| C16 | Logged in per day: columns, **6–7 days** | 14 days | `days: 7` (5.1) |
| C17 | Bucket labels: "0–25, 25–50, 50–75, 75–99, Done" and "<50, 50s, 60s, 70s, 80s, 90+" | Different wording | Translation keys (6.12) |
| C18 | Status donut with the total in the centre: "{n} learners" | No centre label | `DonutChart` centre props (6.5) |
| C19 | Widget notes (customer-mode text) under each card | None | Notes (6.7, 6.12) |

### 2.2 Course

| # | Prototype | Current | Fix |
| --- | --- | --- | --- |
| K1 | Chips: course title, "Cohorts: {n}", "{n} learners", "Range: last 30 days" | None | Scope chips (6.6), plus `cohortCount` in the summary (4.6). The range chip becomes the range picker (2.5, 6.14) |
| K2 | KPIs: Enrolled "+N this week" (up); Completion rate "+N pts vs last week"; **Average grade** "across exercises taken"; Final-exam pass rate "of N who took it…"; Median days to finish "enrolment to completion" | No deltas; no context | Week-over-week metrics (4.3), the Passed-first-try KPI (section 1), formatters (6.3) |
| K3 | "Scores by exercise, one line per cohort" (7): the 3 newest cohorts, dashed and labelled "(in progress)" while unfinished | Every cohort, solid | `scores-by-cohort.svelte` (6.8) |
| K4 | Lesson drop-off: tones below 75 amber and below 50 red; note "The steepest fall is between X and Y." | Untoned; no note | `lesson-dropoff.svelte` (6.8) |
| K5 | Hardest exercises: grouped bar of average score and pass rate, **4** bars | 5 | Limit 4, "Passed first try" series (5.1) |
| K6 | "Cohorts taking this course": grouped bar (12) of the 4 newest, with note "Showing 4 of N cohorts." and **Cohort details** table (12): Cohort, Learners, Progress, Avg score, pass rate, Overdue | Learner-driven, with a "No cohort" group, merged with its table | `cohort_summary` source (4.4), two widgets (5.1, 6.8). No "No cohort" row |
| K7 | Score-distribution histogram | Kept, with the exercise picker (the final-exam exclusion) | Default to the last exercise with a pass mark (already) |

### 2.3 Organization

| # | Prototype | Current | Fix |
| --- | --- | --- | --- |
| O1 | Chips: "Live · updated Ns ago", org name, "{n} active cohorts", "Seats: {used} of {limit}" | None | Scope chips, `activeCohortCount`, `$studentUsage` (6.6) |
| O2 | KPIs: Logged in, last 7 days "x% of enrolled"; Average progress "+N pts this week"; Completions "x% of enrolled" (up); **Certificates issued** "x% of completions"; Needs attention "inactive, low score or overdue" (red) | Four cards; no deltas; certificates folded into Completions | Five cards, deltas, trends (5.1, 6.3) |
| O3 | **Cohorts at a glance** (8), 5 newest: Cohort (link), **Created**, Learners, Progress bar, Avg score, Overdue, Health pill; note "Showing 5 of N cohorts…" | Learner-driven, so empty cohorts are missing; a "No cohort" row; no Created column; donut inside the card | `cohort_summary` source; `cohorts-glance.svelte` (4.4, 6.8) |
| O4 | **Learners by cohort health** donut (5), its own card, total in the centre, note "The five cohorts in the table above." | Merged into O3 | `cohort-health.svelte` (6.8) |
| O5 | **Hiring ramp vs target** (7): cumulative weekly enrolled learners over 6 weeks, with a dashed target line; y axis up to the seat limit | No target; 12 weeks; full width | An org setting `insights.learnerTarget` with an edit control (5.2, 6.8, 6.10); 6 weeks (4.3) |
| O6 | Logged in per day (7): a line, 7 days | 14 days | `days: 7` |
| O7 | "Final exam average, by cohort" (5) | "Average score by cohort", 10 cohorts | Same 5 cohorts as O3 (one request) (5.1); final-exam exclusion |
| O8 | Courses by completion (12) | OK | None |
| O9 | Order: KPIs, glance (8) + needs attention (4), donut (5) + target chart (7), logins (7) + scores (5), courses (12) | Donut missing, so the chart was widened to 12 | Preset order and spans (5.1) |

### 2.4 Shared behaviour

| # | Fix |
| --- | --- |
| S1 | Widgets with identical resolved specs share one request and one result (6.2). That makes split widgets free, and their numbers always agree |
| S2 | Title variables: `{name}` for the selected learner and `{course}` for the picked course (6.7) |
| S3 | `KpiCard` gets a `trend` (`up` green, `down` red, `flat` muted) on its context line, matching the prototype (6.1) |
| S4 | The page has no subtitle; the chips carry that information. Refresh stays in the header (PRD requirement) |
| S5 | A range picker beside Refresh on every scope: All time, Last 7 days, Last 30 days, Last 90 days (2.5, 6.14) |

### 2.5 Range filter

The picker sits in the page header beside Refresh, as on Marketing, on the cohort, course and organization dashboards:
- **All time** is the default. It shows the dashboards exactly as 2.1–2.4 describe, including the "this week" changes.
- **Last 7 days**, **Last 30 days** and **Last 90 days** are Marketing's options. A range covers today and the days before it, by UTC day, like the login data.
- The choice stays while you move between analytics pages, and resets on a full reload, as on Marketing.

**The rule.** A range shows what learners *did* in that window. Where learners *stand* is always as of now.

| Kind | Under a range | Examples |
| --- | --- | --- |
| Activity | Counts only what happened in the window | Logins; scores from attempts made in the window (best graded attempt per exercise); Passed first try for first attempts made in the window; hardest questions; median days to finish for completions in the window; the growth chart's axis |
| Standing, with change | The value stays current; the context line shows the change across the window | Average progress, Completion rate, Enrolled, Completed, Completions, Certificates issued |
| Standing | Unchanged, with a **Now** tag on the card | Status, needs attention, overdue, progress distribution, the course, cohort and section tables and comparisons, lesson drop-off, the learner's courses, the learners table |

Why standing cards don't follow the range: progress, status and overdue work are states, not events. A table that mixed current progress with windowed scores would contradict itself row by row. The **Now** tag (tooltip: "Shows where learners stand now. The range doesn't change this card.") makes the rule visible instead of surprising.

**Cards that follow the range.** Every other card is tagged Now.

| Scope | KPIs | Charts |
| --- | --- | --- |
| Cohort | Logged in (title becomes "Logged in, last N days"), Average progress (change), Average score, Completed (change) | Scores by exercise, "{name}: scores by exercise", Average score distribution (both modes), Hardest questions, Learners logged in per day (N days) |
| Course | Enrolled (change), Completion rate (change), Average grade, Passed first try, Median days to finish | Scores by exercise, one line per cohort; Score distribution, {exercise}; Hardest exercises; Hardest questions |
| Organization | Logged in (last N days), Average progress (change), Completions (change), Certificates issued (change) | Enrolled learners vs target (daily points for 7 and 30 days, weekly for 90 days), Learners logged in per day |

Overdue (cohort) and Needs attention (org) are the KPIs tagged Now.

**Context lines under a range**, using 30 days as the example:
- **Changes:** "+6 pts in the last 30 days", "+4 pts vs 30 days ago", "+212 in the last 30 days", "x% of the cohort · +3 in the last 30 days".
- **Activity:** "attempts in the last 30 days" (average score), "of 48 graded in the last 30 days · 5 still to pass" (Passed first try), "for completions in the last 30 days" (median days).

**Chart density.** A daily column chart with more than 31 points draws as a line, so 90 days of logins stay readable.

## 3. Shared code (`packages/utils`)

### 3.1 `src/constants/insights.ts`

**Sources:** add `'cohort_summary'` and `'overdue_learner'` to `INSIGHTS_SOURCES`.

**`INSIGHTS_METRICS`:**
- **Remove:** `'required_pass'`, `'required_total'`, `'required_passed'`, `'passed_all_required'`, `'logged_in_week'`.
- **Add:**

```ts
  'first_try_pass',
  'passed_first_try',
  'pass_mark_exercises',
  'pass_mark_passed',
  'still_to_pass',
  'took_pass_mark',
  'has_still_to_pass',
  'enrolled_in_period',
  'completed_in_period',
  'completion_rate_at_period_start',
  'overall_progress_pct_existing',
  'overall_progress_pct_at_period_start',
  'has_overdue_goal',
  'now_at_title',
  'question_context',
  'item_titles',
  'course_progress_pct',
  'has_goal',
  'learners',
  'pending_invites',
  'avg_progress_pct',
  'overdue_learners',
  'at_risk_learners',
  'completed_learners',
  'cohort_created_at',
  'logged_in_period',
  'completed_all_in_period',
  'completed_in_window',
  'certified_in_period',
```

**`INSIGHTS_DIMENSIONS`:** replace `'week'` with `'period'`. Only the org-member source used `week`.

`now_at_title` already exists on `learner_course`. Add it to `learner` too (4.4), and keep one entry in the list.

**Thresholds and limits:**

```ts
export const INSIGHTS_THRESHOLDS = {
  inactiveDays: 2,
  lowScorePct: 50,
  laggingScorePct: 65,
  lowVideoPct: 60,
  alertSharePct: 5,
  heatGoodPct: 70,
  heatWarnPct: 50,
  dropoffWarnPct: 75,
  dropoffBadPct: 50
} as const;

export const INSIGHTS_LIMITS = {
  pageSize: 25,
  learnersPageSize: 10,
  maxRows: 1000,
  maxExportRows: 50_000,
  maxMeasures: 16,
  maxFilterValues: 100,
  maxSearchLength: 100,
  maxOutlineCourses: 50,
  glanceCohorts: 5,
  comparedCohorts: 4,
  chartedCohorts: 3,
  hardestExercises: 4,
  learnerTargetMax: 1_000_000,
  maxRangeDays: 90
} as const;
```

**Ranges** (section 2.5):

```ts
export const INSIGHTS_RANGES = ['all', '7d', '30d', '90d'] as const;

export type TInsightsRange = (typeof INSIGHTS_RANGES)[number];

/**
 * Days each range covers, counting today. Null is All time.
 */
export const INSIGHTS_RANGE_DAYS: Record<TInsightsRange, number | null> = { all: null, '7d': 7, '30d': 30, '90d': 90 };

/**
 * The period "+N" changes compare against under All time: this week.
 */
export const INSIGHTS_DEFAULT_PERIOD_DAYS = 7;
```

### 3.2 `src/validation/insights/settings.ts` (new) and the export

```ts
import * as z from 'zod';

import { INSIGHTS_LIMITS } from '../../constants/insights';

export const ZUpdateInsightsSettings = z.object({
  learnerTarget: z.number().int().min(1).max(INSIGHTS_LIMITS.learnerTargetMax).nullable()
});

export type TUpdateInsightsSettings = z.infer<typeof ZUpdateInsightsSettings>;
```

Add `export * from './settings';` to `validation/insights/index.ts`.

### 3.3 `src/validation/cohort/cohort.ts`

```ts
export const ZRemindOverdueCohortGoals = z.object({
  courseId: z.string().uuid().optional(),
  profileId: z.string().uuid().optional()
});
```

### 3.4 `packages/db/src/schema.ts` (type only, no migration)

Add this inside `organization.settings` `$type<{…}>`:

```ts
      insights?: {
        learnerTarget?: number | null;
      };
```

Update the `insights-spec` snapshot (`packages/utils/tests/__snapshots__/insights-spec.test.ts.snap`) on purpose, after checking that the diff contains only these ids.

### 3.5 Range in specs and widgets (`src/validation/insights/`)

`spec.ts`, inside `ZInsightsQuerySpec`'s object:

```ts
    range: z.enum(INSIGHTS_RANGES).default('all'),
```

`dashboard.ts`, inside `ZInsightsWidget`: a widget opts in to the range, so standing widgets never refetch when it changes.

```ts
  usesRange: z.boolean().default(false),
```

Both defaults keep every existing spec and preset valid. Update the `insights-spec` snapshot for `range`, `usesRange`, `period` and the metric changes in 3.1.

## 4. Query layer (`packages/db/src/queries/insights`)

### 4.1 `scope.ts`

Export the inactive-member filter so the cohort summary can reuse it. Its body stays as it is:

```ts
export function inactiveOrgMemberFilter(profileColumn: SQL, orgId: string): SQL {
```

### 4.2 `types.ts`

```ts
export type InsightsSourceDefinition = {
  id: TInsightsSource;
  scopeTypes: readonly TInsightsScopeType[];
  requiresCohortBridge?: boolean;
  build: (context: InsightsCompileContext) => SQL;
  dimensions: Partial<Record<TInsightsDimension, InsightsDimensionDefinition>>;
  metrics: Partial<Record<TInsightsMetric, InsightsMetricDefinition>>;
  filters: Partial<Record<TInsightsFilterField, InsightsFilterDefinition>>;
  searchColumns?: readonly SQL[];
};

export type InsightsCompileContext = {
  scope: InsightsScopeRef;
  orderedItems: InsightsOrderedItem[];
  pushdown: InsightsPushdown;
  byCohort: boolean;
  loginWindowDays: number;
  rangeDays: number | null;
  periodDays: number;
};

export type InsightsScopeSummary = {
  name: string;
  description: string | null;
  learnerCount: number;
  pendingCount: number;
  cohortCount: number;
  activeCohortCount: number;
  learnerTarget: number | null;
  courses: InsightsScopeCourse[];
};
```

### 4.3 `fragments.ts`: full replacement

What changes, by CTE:

| CTE | Change |
| --- | --- |
| `member_exercise` | Adds the first attempt (state, score and time) and the completion time (earliest attempt that met the policy). Under a range, attempts, grading state and best score count only submissions made in the window. Completion always counts every submission, because progress is a standing figure (2.5) |
| `member_exercise_result` | Adds `passed_first_try` and `still_to_pass` (section 1.3). Under a range, a first attempt counts only when it was made in the window |
| `member_lesson` | Adds `completed_at` |
| `member_lesson_totals`, `member_exercise_totals` | Add counts at the period start and last completion times. The `required_*` columns become the pass-mark and first-try counts |
| `learner_course_row` | Adds `completed_at` (certificate time, or the time of the last item when complete without a certificate), the period flags, `completed_in_window`, `certified_in_period` (from a `certificate` lateral that also drives `is_certified`), `progress_pct_at_period_start` and the pass-mark columns. `days_to_finish` now uses `completed_at`, and under a range only for completions in the window. "Now at" becomes the **section** title |
| `learner_core`, `learner_activity` | Add progress at the period start (only for learners enrolled before it, so new learners don't skew the change), `completed_all_at`, `completed_all_in_period`, `logged_in_period` (replacing `logged_in_week`), `has_overdue_goal` and `now_at_title` |
| `overdue_learner_row` (new) | One row per overdue learner: courses, item titles, progress in those courses, last login, worst lateness, and whether a goal reminder applies |
| `cohort_summary_row` (new) | One row per non-archived cohort, empty cohorts included. Learner counts come from `cohort_member` in org scope (to match the cohort page) and from enrolments in course scope |
| `section_*` | First-try per section |
| `question_row` | Adds `question_context` (the section title, or else the exercise title). Under a range, each learner's best graded attempt is taken from the window |
| `org_member_row` | The column is `period`. All time: 6 weekly points (the prototype) instead of 12. Last 7 and 30 days: one point per day. Last 90 days: 13 weekly points |

**Window and period.** The compile context carries `rangeDays` (null under All time) and `periodDays` (the range, or 7 under All time); see 4.10. `inWindowSql` is `TRUE` under All time, so an All-time query is the same as before. `periodStartSql` replaces the old `WEEK_AGO`, which makes "this week" the All-time case of "since the period start".

```ts
import { sql, type SQL } from 'drizzle-orm';

import { QUESTION_TYPE_IDS } from '@cio/question-types';
import { ROLE } from '@cio/utils/constants';
import { INSIGHTS_THRESHOLDS } from '@cio/utils/constants/insights';

import { submissionMeetsCompletionPolicySql } from '../course/progression';
import { inactiveOrgMemberFilter, uuidList } from './scope';
import type { InsightsCompileContext } from './types';

const GROWTH_WEEKS_ALL_TIME = 6;
const DAILY_GROWTH_MAX_DAYS = 31;

function daysAgoStart(days: number): SQL {
  return sql`(CURRENT_DATE - ${days - 1}::int)::timestamptz`;
}

/**
 * Start of the selected range: today and the days before it. Null under All time.
 */
function windowStartSql(context: InsightsCompileContext): SQL | null {
  return context.rangeDays === null ? null : daysAgoStart(context.rangeDays);
}

/**
 * Start of the period KPI changes compare against: the selected range, or the last 7 days under All time.
 */
function periodStartSql(context: InsightsCompileContext): SQL {
  return daysAgoStart(context.periodDays);
}

function inWindowSql(column: SQL, context: InsightsCompileContext): SQL {
  const windowStart = windowStartSql(context);

  return windowStart ? sql`${column} >= ${windowStart}` : sql`TRUE`;
}

function growthBucketsSql(context: InsightsCompileContext): { series: SQL; step: SQL } {
  const days = context.rangeDays;
  if (days !== null && days <= DAILY_GROWTH_MAX_DAYS) {
    const step = sql`interval '1 day'`;

    return { series: sql`generate_series(CURRENT_DATE - ${days - 1}::int, CURRENT_DATE, ${step})`, step };
  }

  const weeks = days === null ? GROWTH_WEEKS_ALL_TIME : Math.ceil(days / 7);
  const step = sql`interval '1 week'`;
  const series = sql`generate_series(date_trunc('week', now()) - ${weeks - 1}::int * ${step}, date_trunc('week', now()), ${step})`;

  return { series, step };
}

function exerciseCtes(context: InsightsCompileContext): SQL {
  const meetsCompletionPolicy = submissionMeetsCompletionPolicySql('exercise', 'submission');
  const submissionInWindow = inWindowSql(sql`submission.created_at`, context);
  const firstAttemptInWindow = inWindowSql(sql`me.first_attempt_at`, context);

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
        attempt.first_grading_state,
        attempt.first_total,
        attempt.first_attempt_at,
        attempt.completed_at,
        COALESCE(attempt.is_complete, false) AS is_complete
      FROM scope_member sm
      JOIN scope_exercise sx ON sx.course_id = sm.course_id
      JOIN exercise ON exercise.id = sx.exercise_id
      CROSS JOIN LATERAL (
        SELECT
          COUNT(*) FILTER (WHERE ${submissionInWindow})::int AS attempts,
          COUNT(*) FILTER (WHERE submission.grading_state = 'completed' AND ${submissionInWindow})::int AS graded_attempts,
          (MAX(submission.total) FILTER (WHERE submission.grading_state = 'completed' AND ${submissionInWindow}))::numeric
            AS best_points,
          (array_agg(submission.grading_state ORDER BY submission.created_at, submission.id))[1] AS first_grading_state,
          ((array_agg(submission.total ORDER BY submission.created_at, submission.id))[1])::numeric AS first_total,
          MIN(submission.created_at) AS first_attempt_at,
          MIN(COALESCE(submission.updated_at, submission.created_at)) FILTER (WHERE ${meetsCompletionPolicy}) AS completed_at,
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
        CASE WHEN me.is_pass_required THEN me.is_complete END AS passed,
        CASE WHEN me.is_pass_required AND me.first_grading_state = 'completed' AND me.max_points > 0
          AND ${firstAttemptInWindow}
          THEN ROUND(COALESCE(me.first_total, 0) * 100.0 / me.max_points) >= me.pass_mark END AS passed_first_try,
        CASE WHEN me.is_pass_required AND me.graded_attempts > 0 THEN NOT me.is_complete END AS still_to_pass
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
        COALESCE(lesson_completion.is_complete, false) AS is_complete,
        CASE WHEN lesson_completion.is_complete
          THEN COALESCE(lesson_completion.updated_at, lesson_completion.created_at) END AS completed_at
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
    ),
    overdue_learner_course AS (
      SELECT
        oi.profile_id,
        course_id,
        bool_or(oi.cohort_id IS NULL) AS all_cohorts,
        array_remove(array_agg(DISTINCT oi.cohort_id), NULL) AS cohort_ids
      FROM overdue_item oi
      CROSS JOIN LATERAL unnest(oi.course_ids) AS course_id
      GROUP BY oi.profile_id, course_id
    ),
    overdue_learner AS (
      SELECT
        oi.profile_id,
        bool_or(oi.cohort_id IS NULL) AS all_cohorts,
        array_remove(array_agg(DISTINCT oi.cohort_id), NULL) AS cohort_ids,
        bool_or(oi.kind = 'goal') AS has_goal
      FROM overdue_item oi
      GROUP BY oi.profile_id
    )`;
}

function courseCtes(context: InsightsCompileContext): SQL {
  const periodStart = periodStartSql(context);
  const completedInWindow = inWindowSql(sql`completion.completed_at`, context);
  const nowAt = context.orderedItems.length
    ? sql`
      LEFT JOIN LATERAL (
        SELECT ci.item_id, COALESCE(course_section.title, ml.lesson_title, mer.exercise_title) AS title
        FROM course_item ci
        LEFT JOIN course_section ON course_section.id = ci.section_id
        LEFT JOIN member_lesson ml
          ON ci.item_type = 'LESSON' AND ml.group_member_id = sm.group_member_id AND ml.lesson_id = ci.item_id
        LEFT JOIN member_exercise_result mer
          ON ci.item_type = 'EXERCISE' AND mer.group_member_id = sm.group_member_id AND mer.exercise_id = ci.item_id
        WHERE ci.course_id = sm.course_id AND NOT COALESCE(ml.is_complete, mer.is_complete, false)
        ORDER BY ci.item_rank
        LIMIT 1
      ) now_at ON true`
    : sql`LEFT JOIN LATERAL (SELECT NULL::uuid AS item_id, NULL::text AS title) now_at ON true`;

  return sql`
    course_totals AS (
      SELECT
        sc.course_id,
        COALESCE(lsn.lessons_total, 0)::int AS lessons_total,
        COALESCE(sx.exercises_total, 0)::int AS exercises_total
      FROM scope_course sc
      LEFT JOIN (
        SELECT lsn.course_id, COUNT(*)::int AS lessons_total
        FROM scoped_lesson lsn
        GROUP BY lsn.course_id
      ) lsn ON lsn.course_id = sc.course_id
      LEFT JOIN (
        SELECT sx.course_id, COUNT(*)::int AS exercises_total
        FROM scope_exercise sx
        GROUP BY sx.course_id
      ) sx ON sx.course_id = sc.course_id
    ),
    member_lesson_totals AS (
      SELECT
        group_member_id,
        COUNT(*) FILTER (WHERE is_complete)::int AS lessons_completed,
        COUNT(*) FILTER (WHERE is_complete AND completed_at < ${periodStart})::int AS lessons_completed_at_period_start,
        MAX(completed_at) AS last_lesson_completed_at,
        COUNT(*) FILTER (WHERE is_video_tracked)::int AS video_lessons,
        COUNT(*) FILTER (WHERE is_video_tracked AND is_complete)::int AS video_watched
      FROM member_lesson
      GROUP BY group_member_id
    ),
    member_exercise_totals AS (
      SELECT
        group_member_id,
        COUNT(*) FILTER (WHERE is_complete)::int AS exercises_completed,
        COUNT(*) FILTER (WHERE is_complete AND completed_at < ${periodStart})::int AS exercises_completed_at_period_start,
        MAX(completed_at) FILTER (WHERE is_complete) AS last_exercise_completed_at,
        SUM(best_points) FILTER (WHERE state = 'graded' AND max_points > 0) AS graded_points,
        SUM(max_points) FILTER (WHERE state = 'graded' AND max_points > 0) AS graded_max_points,
        COUNT(*) FILTER (WHERE is_pass_required)::int AS pass_mark_exercises,
        COUNT(*) FILTER (WHERE is_pass_required AND passed)::int AS pass_mark_passed,
        COUNT(*) FILTER (WHERE passed_first_try IS NOT NULL)::int AS first_try_graded,
        COUNT(*) FILTER (WHERE passed_first_try)::int AS first_try_passed,
        COUNT(*) FILTER (WHERE still_to_pass)::int AS still_to_pass
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
        totals.items_completed_at_period_start,
        CASE WHEN totals.items_total > 0
          THEN ROUND(totals.items_completed * 100.0 / totals.items_total) ELSE 0 END AS progress_pct,
        CASE WHEN totals.items_total > 0
          THEN ROUND(totals.items_completed_at_period_start * 100.0 / totals.items_total) ELSE 0 END AS progress_pct_at_period_start,
        completion.completed_at IS NOT NULL AS is_completed,
        completion.completed_at,
        (completion.completed_at IS NOT NULL AND ${completedInWindow}) AS completed_in_window,
        certificate.issued_at IS NOT NULL AS is_certified,
        COALESCE(certificate.issued_at >= ${periodStart}, false) AS certified_in_period,
        COALESCE(sm.enrolled_at >= ${periodStart}, false) AS enrolled_in_period,
        COALESCE(sm.enrolled_at < ${periodStart}, false) AS enrolled_at_period_start,
        COALESCE(completion.completed_at >= ${periodStart}, false) AS completed_in_period,
        COALESCE(completion.completed_at < ${periodStart}, false) AS completed_at_period_start,
        COALESCE(met.graded_points, 0) AS graded_points,
        COALESCE(met.graded_max_points, 0) AS graded_max_points,
        CASE WHEN met.graded_max_points > 0
          THEN ROUND(met.graded_points * 100.0 / met.graded_max_points) END AS avg_score_pct,
        COALESCE(met.pass_mark_exercises, 0) AS pass_mark_exercises,
        COALESCE(met.pass_mark_passed, 0) AS pass_mark_passed,
        COALESCE(met.first_try_graded, 0) AS first_try_graded,
        COALESCE(met.first_try_passed, 0) AS first_try_passed,
        COALESCE(met.still_to_pass, 0) AS still_to_pass,
        COALESCE(met.first_try_graded, 0) > 0 AS took_pass_mark,
        COALESCE(met.still_to_pass, 0) > 0 AS has_still_to_pass,
        COALESCE(mlt.video_lessons, 0) AS video_lessons,
        COALESCE(mlt.video_watched, 0) AS video_watched,
        COALESCE(mat.attendance_lessons, 0) AS attendance_lessons,
        COALESCE(mat.attendance_present, 0) AS attendance_present,
        CASE WHEN completion.completed_at IS NOT NULL AND sm.enrolled_at IS NOT NULL AND ${completedInWindow}
          THEN GREATEST(0, EXTRACT(EPOCH FROM completion.completed_at - sm.enrolled_at) / 86400) END AS days_to_finish,
        (
          olc.profile_id IS NOT NULL
          AND (olc.all_cohorts OR se.cohort_id IS NULL OR se.cohort_id = ANY (olc.cohort_ids))
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
      LEFT JOIN overdue_learner_course olc
        ON olc.profile_id = sm.profile_id AND olc.course_id = sm.course_id
      CROSS JOIN LATERAL (
        SELECT COALESCE(sm.certificate_earned_at, MIN(issue.issued_at)) AS issued_at
        FROM course_certificate_issue issue
        WHERE issue.course_id = sm.course_id AND issue.profile_id = sm.profile_id AND issue.status = 'valid'
      ) certificate
      CROSS JOIN LATERAL (
        SELECT
          ct.lessons_total + ct.exercises_total AS items_total,
          COALESCE(mlt.lessons_completed, 0) + COALESCE(met.exercises_completed, 0) AS items_completed,
          COALESCE(mlt.lessons_completed_at_period_start, 0) + COALESCE(met.exercises_completed_at_period_start, 0) AS items_completed_at_period_start
      ) totals
      CROSS JOIN LATERAL (
        SELECT CASE
          WHEN sm.certificate_earned_at IS NOT NULL THEN sm.certificate_earned_at
          WHEN totals.items_total > 0 AND totals.items_completed >= totals.items_total
            THEN GREATEST(mlt.last_lesson_completed_at, met.last_exercise_completed_at)
        END AS completed_at
      ) completion
      ${nowAt}
    )`;
}

function learnerCtes(context: InsightsCompileContext): SQL {
  const { inactiveDays, lowScorePct, laggingScorePct, lowVideoPct } = INSIGHTS_THRESHOLDS;
  const periodStart = periodStartSql(context);

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
        COALESCE(SUM(lcr.items_completed_at_period_start), 0) AS items_completed_at_period_start,
        MIN(lcr.enrolled_at) AS first_enrolled_at,
        CASE WHEN COUNT(lcr.course_id) > 0 AND bool_and(lcr.is_completed) THEN MAX(lcr.completed_at) END AS completed_all_at,
        COALESCE(SUM(lcr.graded_points), 0) AS graded_points,
        COALESCE(SUM(lcr.graded_max_points), 0) AS graded_max_points,
        COALESCE(SUM(lcr.video_lessons), 0) AS video_lessons,
        COALESCE(SUM(lcr.video_watched), 0) AS video_watched,
        COALESCE(SUM(lcr.attendance_lessons), 0) AS attendance_lessons,
        COALESCE(SUM(lcr.attendance_present), 0) AS attendance_present,
        CASE WHEN COUNT(lcr.course_id) = 1 THEN MIN(lcr.now_at_title) END AS now_at_title
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
        CASE WHEN core.items_total > 0 AND core.first_enrolled_at < ${periodStart}
          THEN ROUND(core.items_completed * 100.0 / core.items_total) END AS overall_progress_pct_existing,
        CASE WHEN core.items_total > 0 AND core.first_enrolled_at < ${periodStart}
          THEN ROUND(core.items_completed_at_period_start * 100.0 / core.items_total) END AS overall_progress_pct_at_period_start,
        CASE WHEN core.graded_max_points > 0
          THEN ROUND(core.graded_points * 100.0 / core.graded_max_points) END AS avg_score_pct,
        CASE WHEN core.video_lessons > 0
          THEN ROUND(core.video_watched * 100.0 / core.video_lessons) END AS video_pct,
        CASE WHEN core.attendance_lessons > 0
          THEN ROUND(core.attendance_present * 100.0 / core.attendance_lessons) END AS attendance_pct,
        (core.courses_total > 0 AND core.courses_completed = core.courses_total) AS is_completed_all,
        COALESCE(core.completed_all_at >= ${periodStart}, false) AS completed_all_in_period,
        core.certificates > 0 AS has_certificate,
        login.last_login_at,
        CURRENT_DATE - login.last_login_date AS days_since_login,
        COALESCE(login.last_login_date = CURRENT_DATE, false) AS logged_in_today,
        COALESCE(login.last_login_at >= ${periodStart}, false) AS logged_in_period,
        (
          ola.profile_id IS NOT NULL
          AND (ola.all_cohorts OR core.cohort_id IS NULL OR core.cohort_id = ANY (ola.cohort_ids))
        ) AS is_overdue,
        COALESCE(ola.has_goal, false) AS has_overdue_goal
      FROM learner_core core
      JOIN profile ON profile.id = core.profile_id
      LEFT JOIN cohort ON cohort.id = core.cohort_id
      LEFT JOIN overdue_learner ola ON ola.profile_id = core.profile_id
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

function overdueLearnerCte(): SQL {
  return sql`
    overdue_learner_row AS (
      SELECT
        overdue.profile_id,
        learner.fullname,
        learner.email,
        learner.last_login_at,
        overdue.course_titles,
        overdue.item_titles,
        overdue.days_overdue,
        overdue.has_goal,
        progress.course_progress_pct
      FROM (
        SELECT
          oi.profile_id,
          array_agg(DISTINCT course_id) AS course_ids,
          string_agg(DISTINCT sc.course_title, ', ' ORDER BY sc.course_title) AS course_titles,
          string_agg(DISTINCT oi.item_title, ', ' ORDER BY oi.item_title) AS item_titles,
          MAX(GREATEST(0, CURRENT_DATE - (oi.due_at AT TIME ZONE 'UTC')::date))::int AS days_overdue,
          bool_or(oi.kind = 'goal') AS has_goal
        FROM overdue_item oi
        CROSS JOIN LATERAL unnest(oi.course_ids) AS course_id
        JOIN scope_course sc ON sc.course_id = course_id
        GROUP BY oi.profile_id
      ) overdue
      JOIN LATERAL (
        SELECT lr.fullname, lr.email, lr.last_login_at
        FROM learner_row lr
        WHERE lr.profile_id = overdue.profile_id
        LIMIT 1
      ) learner ON true
      CROSS JOIN LATERAL (
        SELECT CASE WHEN SUM(lcr.items_total) > 0
          THEN ROUND(SUM(lcr.items_completed) * 100.0 / SUM(lcr.items_total)) END AS course_progress_pct
        FROM learner_course_row lcr
        WHERE lcr.profile_id = overdue.profile_id AND lcr.course_id = ANY (overdue.course_ids)
      ) progress
    )`;
}

function cohortSummaryCte(context: InsightsCompileContext): SQL {
  const { scope, pushdown } = context;
  const courseScopeFilter =
    scope.type === 'course'
      ? sql`AND EXISTS (
          SELECT 1 FROM cohort_course cc JOIN scope_course sc ON sc.course_id = cc.course_id
          WHERE cc.cohort_id = cohort.id
        )`
      : sql``;
  const cohortFilter = pushdown.cohortIds?.length ? sql`AND cohort.id IN (${uuidList(pushdown.cohortIds)})` : sql``;
  const learnerCount =
    scope.type === 'org' ? sql`COALESCE(members.learners, 0)` : sql`COALESCE(stats.learners, 0)`;

  return sql`
    cohort_member_count AS (
      SELECT
        cm.cohort_id,
        COUNT(*) FILTER (
          WHERE cm.profile_id IS NOT NULL AND ${inactiveOrgMemberFilter(sql`cm.profile_id`, scope.orgId)}
        )::int AS learners,
        COUNT(*) FILTER (WHERE cm.profile_id IS NULL)::int AS pending_invites
      FROM cohort_member cm
      JOIN cohort ON cohort.id = cm.cohort_id AND cohort.organization_id = ${scope.orgId}
      WHERE cm.role_id = ${ROLE.STUDENT}
      GROUP BY cm.cohort_id
    ),
    cohort_learner_stats AS (
      SELECT
        cohort_id,
        COUNT(*)::int AS learners,
        ROUND(AVG(overall_progress_pct), 1) AS avg_progress_pct,
        ROUND(AVG(avg_score_pct), 1) AS avg_score_pct,
        COUNT(*) FILTER (WHERE is_overdue)::int AS overdue_learners,
        COUNT(*) FILTER (WHERE is_at_risk)::int AS at_risk_learners,
        COUNT(*) FILTER (WHERE is_completed_all)::int AS completed_learners
      FROM learner_row
      WHERE cohort_id IS NOT NULL
      GROUP BY cohort_id
    ),
    cohort_attempt_stats AS (
      SELECT
        cohort_id,
        SUM(first_try_passed)::int AS first_try_passed,
        SUM(first_try_graded)::int AS first_try_graded
      FROM learner_course_row
      WHERE cohort_id IS NOT NULL
      GROUP BY cohort_id
    ),
    cohort_summary_row AS (
      SELECT
        cohort.id AS cohort_id,
        cohort.name AS cohort_name,
        cohort.created_at AS cohort_created_at,
        ${learnerCount} AS learners,
        COALESCE(members.pending_invites, 0) AS pending_invites,
        stats.avg_progress_pct,
        stats.avg_score_pct,
        COALESCE(stats.overdue_learners, 0) AS overdue_learners,
        COALESCE(stats.at_risk_learners, 0) AS at_risk_learners,
        COALESCE(stats.completed_learners, 0) AS completed_learners,
        COALESCE(attempts.first_try_passed, 0) AS first_try_passed,
        COALESCE(attempts.first_try_graded, 0) AS first_try_graded
      FROM cohort
      LEFT JOIN cohort_member_count members ON members.cohort_id = cohort.id
      LEFT JOIN cohort_learner_stats stats ON stats.cohort_id = cohort.id
      LEFT JOIN cohort_attempt_stats attempts ON attempts.cohort_id = cohort.id
      WHERE cohort.organization_id = ${scope.orgId}
        AND cohort.status <> 'ARCHIVED'
        ${courseScopeFilter}
        ${cohortFilter}
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
        COUNT(*) FILTER (WHERE is_pass_required)::int AS pass_mark_exercises,
        COUNT(*) FILTER (WHERE passed_first_try IS NOT NULL)::int AS first_try_graded,
        COUNT(*) FILTER (WHERE passed_first_try)::int AS first_try_passed
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
        CASE WHEN COALESCE(sx.pass_mark_exercises, 0) = 0 OR sx.first_try_graded < sx.pass_mark_exercises THEN NULL
             ELSE sx.first_try_passed = sx.pass_mark_exercises END AS passed_first_try,
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
  const growth = growthBucketsSql(context);

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
      WHERE submission.grading_state = 'completed' AND ${inWindowSql(sql`submission.created_at`, context)}
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
        COALESCE(question_section.title, sx.exercise_title) AS question_context,
        question.id AS question_id,
        question.title AS question_title,
        COALESCE(ci.item_rank, 0) * 10000 + COALESCE(question."order", 0) AS question_rank,
        ROUND(COALESCE(qa.point, 0) * 100.0 / question.points) AS correct_pct,
        CASE WHEN COALESCE(qa.point, 0) < question.points THEN ${wrongAnswerSql()} END AS wrong_answer
      FROM best_submission bs
      JOIN scope_enrollment se ON se.group_member_id = bs.group_member_id
      JOIN scope_exercise sx ON sx.exercise_id = bs.exercise_id AND sx.course_id = se.course_id
      LEFT JOIN course_section question_section ON question_section.id = sx.section_id
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
    login_event_day AS (
      SELECT DISTINCT le.user_id, le.logged_in_date
      FROM analytics_login_events le
      WHERE le.logged_in_date >= CURRENT_DATE - ${context.loginWindowDays - 1}::int
    ),
    login_day_row AS (
      SELECT
        sl.profile_id,
        sl.cohort_id,
        cohort.name AS cohort_name,
        day.day::date AS day,
        led.user_id IS NOT NULL AS logged_in
      FROM scope_learner sl
      LEFT JOIN cohort ON cohort.id = sl.cohort_id
      CROSS JOIN generate_series(CURRENT_DATE - ${context.loginWindowDays - 1}::int, CURRENT_DATE, interval '1 day') AS day(day)
      LEFT JOIN login_event_day led
        ON led.user_id = sl.profile_id AND led.logged_in_date = day.day::date
    ),
    org_member_row AS (
      SELECT
        bucket.bucket_start::date AS period,
        COUNT(om.id) FILTER (WHERE om.created_at >= bucket.bucket_start)::int AS members_added,
        COUNT(om.id)::int AS members_total
      FROM ${growth.series} AS bucket(bucket_start)
      LEFT JOIN organizationmember om
        ON om.organization_id = ${context.scope.orgId}
        AND om.role_id = ${ROLE.STUDENT}
        AND om.status = 'ACTIVE'
        AND om.profile_id IS NOT NULL
        AND om.created_at < bucket.bucket_start + ${growth.step}
      GROUP BY bucket.bucket_start
    )`;
}

/**
 * Every metric CTE, in dependency order. Expects the CTEs from `scopeCtes` to precede it in the same WITH clause.
 */
export function insightsMetricCtes(context: InsightsCompileContext): SQL {
  return sql.join(
    [
      exerciseCtes(context),
      lessonCtes(),
      overdueCte(context),
      courseCtes(context),
      learnerCtes(context),
      overdueLearnerCte(),
      cohortSummaryCte(context),
      sectionCtes(),
      assessmentCtes(context)
    ],
    sql`,`
  );
}
```

Things to verify while implementing:
- **Column names:** `submission.updated_at` and `lesson_completion.updated_at` exist in `schema.ts` (both `updatedAt`).
- **`learner_core.now_at_title`:** this needs `orderedItems`. Because the column only exists when the scope resolves to one course, `requiresOrderedItems` already loads the structure when a spec asks for `now_at_title` (the compiler's `OUTLINE_METRICS`).
- **Measure performance:** `members_added` and `members_total` keep the other session's gap-filled shape. Re-run `apps/api/scripts/measure-insights.ts` after this change. The new lateral `array_agg`s and the cohort summary CTEs are the costliest additions.

### 4.4 Sources

`learner-course.ts`. Replace the `required_*` metrics, and add the period, window and pass-mark metrics:

```ts
import { sql } from 'drizzle-orm';

// …existing imports

  metrics: {
    rows: rowsMetric,
    name: textMetric('fullname'),
    title: textMetric('course_title'),
    progress_pct: percentMetric('progress_pct'),
    progress_pct_at_period_start: percentMetric('progress_pct_at_period_start'),
    avg_score_pct: percentMetric('avg_score_pct'),
    score_points: pooledMetric(baseColumn('graded_points'), baseColumn('graded_max_points')),
    first_try_pass: pooledMetric(baseColumn('first_try_passed'), baseColumn('first_try_graded')),
    pass_mark_exercises: numberMetric('pass_mark_exercises'),
    pass_mark_passed: numberMetric('pass_mark_passed'),
    still_to_pass: numberMetric('still_to_pass'),
    took_pass_mark: flagMetric('took_pass_mark'),
    has_still_to_pass: flagMetric('has_still_to_pass'),
    is_completed: flagMetric('is_completed'),
    is_certified: flagMetric('is_certified'),
    is_overdue: flagMetric('is_overdue'),
    enrolled_in_period: flagMetric('enrolled_in_period'),
    completed_in_period: flagMetric('completed_in_period'),
    completion_rate_at_period_start: pooledMetric(
      sql`(${baseColumn('completed_at_period_start')})::int`,
      sql`(${baseColumn('enrolled_at_period_start')})::int`
    ),
    days_to_finish: numberMetric('days_to_finish'),
    completed_in_window: flagMetric('completed_in_window'),
    certified_in_period: flagMetric('certified_in_period'),
    enrolled_at: valueMetric('datetime', 'enrolled_at'),
    now_at_item_id: valueMetric('id', 'now_at_item_id'),
    now_at_title: valueMetric('text', 'now_at_title')
  },
```

`learner.ts`. Rename `logged_in_week: flagMetric('logged_in_week')` to `logged_in_period: flagMetric('logged_in_period')`, and add these metrics:

```ts
    overall_progress_pct_existing: percentMetric('overall_progress_pct_existing'),
    overall_progress_pct_at_period_start: percentMetric('overall_progress_pct_at_period_start'),
    completed_all_in_period: flagMetric('completed_all_in_period'),
    has_overdue_goal: flagMetric('has_overdue_goal'),
    now_at_title: valueMetric('text', 'now_at_title'),
```

`org-member.ts`. The growth dimension is `period`, since its points are days or weeks depending on the range:

```ts
  dimensions: { period: { valueType: 'date', key: baseColumn('period') } },
```

`assessment-result.ts`. Replace the required-pass columns in `build` and in the metrics:

```ts
  build: () => sql`
    SELECT
      assessment_row.*,
      state = 'graded' AS is_graded,
      state <> 'not_taken' AS is_attempted,
      state = 'awaiting_grade' AS is_awaiting_grade,
      CASE WHEN state = 'graded' AND max_points > 0 THEN best_points END AS graded_points,
      CASE WHEN state = 'graded' AND max_points > 0 THEN max_points END AS graded_max_points,
      passed_first_try::int AS first_try_hit,
      CASE WHEN passed_first_try IS NOT NULL THEN 1 END AS first_try_try
    FROM assessment_row`,

  // metrics: remove required_pass; add
    first_try_pass: pooledMetric(baseColumn('first_try_hit'), baseColumn('first_try_try')),
    passed_first_try: flagMetric('passed_first_try'),
    still_to_pass: flagMetric('still_to_pass'),
```

`section-activity.ts`. Replace `passed_all_required` with `passed_first_try: flagMetric('passed_first_try')`.

`question-result.ts`. Add `question_context: textMetric('question_context')`.

`overdue-learner.ts` (new):

```ts
import { sql } from 'drizzle-orm';

import type { InsightsSourceDefinition } from '../types';
import {
  baseColumn,
  flagMetric,
  idDimension,
  numberMetric,
  percentMetric,
  rowsMetric,
  scopePushdownFilters,
  textMetric,
  valueMetric
} from './helpers';

export const overdueLearnerSource: InsightsSourceDefinition = {
  id: 'overdue_learner',
  scopeTypes: ['cohort', 'course'],
  build: () => sql`SELECT * FROM overdue_learner_row`,
  dimensions: {
    learner: idDimension('profile_id', 'fullname')
  },
  metrics: {
    rows: rowsMetric,
    name: textMetric('fullname'),
    email: textMetric('email'),
    course_titles: valueMetric('text', 'course_titles'),
    item_titles: valueMetric('text', 'item_titles'),
    course_progress_pct: percentMetric('course_progress_pct'),
    last_login_at: valueMetric('datetime', 'last_login_at'),
    days_overdue: numberMetric('days_overdue'),
    has_goal: flagMetric('has_goal')
  },
  filters: { course: scopePushdownFilters.course, learner: scopePushdownFilters.learner },
  searchColumns: [baseColumn('fullname'), baseColumn('email')]
};
```

`cohort-summary.ts` (new):

```ts
import { sql } from 'drizzle-orm';

import type { InsightsSourceDefinition } from '../types';
import {
  baseColumn,
  idDimension,
  numberMetric,
  percentMetric,
  pooledMetric,
  rowsMetric,
  scopePushdownFilters,
  valueMetric
} from './helpers';

export const cohortSummarySource: InsightsSourceDefinition = {
  id: 'cohort_summary',
  scopeTypes: ['course', 'org'],
  requiresCohortBridge: true,
  build: () => sql`SELECT * FROM cohort_summary_row`,
  dimensions: {
    cohort: idDimension('cohort_id', 'cohort_name')
  },
  metrics: {
    rows: rowsMetric,
    learners: numberMetric('learners'),
    pending_invites: numberMetric('pending_invites'),
    avg_progress_pct: percentMetric('avg_progress_pct'),
    avg_score_pct: percentMetric('avg_score_pct'),
    overdue_learners: numberMetric('overdue_learners'),
    at_risk_learners: numberMetric('at_risk_learners'),
    completed_learners: numberMetric('completed_learners'),
    first_try_pass: pooledMetric(baseColumn('first_try_passed'), baseColumn('first_try_graded')),
    cohort_created_at: valueMetric('datetime', 'cohort_created_at')
  },
  filters: { cohort: scopePushdownFilters.cohort }
};
```

`registry.ts`. Add both sources:

```ts
  cohort_summary: cohortSummarySource,
  overdue_learner: overdueLearnerSource,
```

### 4.5 `compile.ts`

A source can force the cohort bridge on, and the range sets the window, the period and the login days:

```ts
  const byCohort =
    Boolean(source.requiresCohortBridge) || spec.dimensions.includes('cohort') || Boolean(pushdown.cohortIds);
  const rangeDays = INSIGHTS_RANGE_DAYS[spec.range];
  const context: InsightsCompileContext = {
    scope: input.scope,
    orderedItems: input.orderedItems,
    pushdown,
    byCohort,
    loginWindowDays: rangeDays ?? spec.days ?? DEFAULT_LOGIN_WINDOW_DAYS,
    rangeDays,
    periodDays: rangeDays ?? INSIGHTS_DEFAULT_PERIOD_DAYS
  };
```

Import `INSIGHTS_DEFAULT_PERIOD_DAYS` and `INSIGHTS_RANGE_DAYS` from `@cio/utils/constants/insights`.

### 4.6 `summary.ts`

Add the description, the cohort counts and the learner target to the summary query and to its mapping.

There are two cohort counts:
- `cohortCount` counts the same cohorts as `cohort_summary`: every non-archived cohort (at course scope, those that include the course). It is the total in the "Showing 5 of N cohorts" notes.
- `activeCohortCount` counts only `ACTIVE` cohorts, for the org chip "{n} active cohorts". `INACTIVE` cohorts still appear in the tables, so the two counts differ.

```ts
function scopeDescriptionSql(scope: InsightsScopeRef): SQL {
  if (scope.type === 'cohort') return sql`(SELECT NULLIF(description, '') FROM cohort WHERE id = ${scope.id})`;

  return sql`NULL::text`;
}

function cohortCountSql(scope: InsightsScopeRef): SQL {
  if (scope.type === 'course') {
    return sql`(
      SELECT COUNT(DISTINCT cohort.id) FROM cohort
      JOIN cohort_course cc ON cc.cohort_id = cohort.id AND cc.course_id = ${scope.id}
      WHERE cohort.organization_id = ${scope.orgId} AND cohort.status <> 'ARCHIVED'
    )`;
  }

  if (scope.type === 'org') {
    return sql`(SELECT COUNT(*) FROM cohort WHERE organization_id = ${scope.orgId} AND status <> 'ARCHIVED')`;
  }

  return sql`0`;
}

function activeCohortCountSql(scope: InsightsScopeRef): SQL {
  if (scope.type !== 'org') return sql`0`;

  return sql`(SELECT COUNT(*) FROM cohort WHERE organization_id = ${scope.orgId} AND status = 'ACTIVE')`;
}

function learnerTargetSql(scope: InsightsScopeRef): SQL {
  if (scope.type !== 'org') return sql`NULL::int`;

  return sql`(SELECT (settings -> 'insights' ->> 'learnerTarget')::int FROM organization WHERE id = ${scope.orgId})`;
}
```

```ts
        ${scopeDescriptionSql(scope)} AS description,
        ${cohortCountSql(scope)}::int AS cohort_count,
        ${activeCohortCountSql(scope)}::int AS active_cohort_count,
        ${learnerTargetSql(scope)} AS learner_target,
```

```ts
    return {
      name: row?.name ?? '',
      description: row?.description ?? null,
      learnerCount: row?.learner_count ?? 0,
      pendingCount: row?.pending_count ?? 0,
      cohortCount: row?.cohort_count ?? 0,
      activeCohortCount: row?.active_cohort_count ?? 0,
      learnerTarget: row?.learner_target ?? null,
      courses: row?.courses ?? []
    };
```

### 4.7 `settings.ts` (new) and the index export

```ts
import * as schema from '@db/schema';
import { eq, sql } from 'drizzle-orm';

import { db, type DbOrTxClient } from '@db/drizzle';

/**
 * Stores or clears the org's insights learner target. Returns the stored value, or null when cleared or org missing.
 */
export async function setOrganizationLearnerTarget(
  orgId: string,
  learnerTarget: number | null,
  dbClient: DbOrTxClient = db
): Promise<number | null> {
  try {
    const nextSettings = sql`jsonb_set(
      COALESCE(${schema.organization.settings}, '{}'::jsonb),
      '{insights}',
      COALESCE(${schema.organization.settings} -> 'insights', '{}'::jsonb)
        || jsonb_build_object('learnerTarget', ${learnerTarget}::int)
    )`;
    const [row] = await dbClient
      .update(schema.organization)
      .set({ settings: nextSettings })
      .where(eq(schema.organization.id, orgId))
      .returning({ learnerTarget: sql<number | null>`(${schema.organization.settings} -> 'insights' ->> 'learnerTarget')::int` });

    return row?.learnerTarget ?? null;
  } catch (error) {
    console.error('setOrganizationLearnerTarget error:', error);
    throw new Error(`Failed to save learner target: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
```

### 4.8 `packages/db/src/queries/cohort/goal.ts`

Filter overdue reminders by learner as well as course:

```ts
export async function listOverdueAssignmentReminderContexts(
  cohortId: string,
  filters: { courseId?: string; profileId?: string },
  dbClient: DbOrTxClient = db
): Promise<CohortGoalReminderContext[]> {
  const courseCondition = filters.courseId
    ? sql`(jsonb_array_length(${schema.cohortGoal.courseIds}) = 0 OR ${schema.cohortGoal.courseIds} ? ${filters.courseId})`
    : undefined;
  const learnerCondition = filters.profileId ? eq(schema.cohortMember.profileId, filters.profileId) : undefined;
  // …same select as today, adding learnerCondition to the and(...)
}
```

Remove `getAssignmentReminderContext`. Its only caller is the single-assignment reminder, which section 5.5 removes.

### 4.9 Migrations

None. `organization.settings` is JSONB already, and the target lives at `settings.insights.learnerTarget`.

### 4.10 Range in the query layer

The range code sits in 4.2 (context), 4.3 (fragments), 4.4 (sources) and 4.5 (compiler). How it works:

- **A range is a spec field.** `spec.range` defaults to `'all'`, so every existing spec keeps its meaning. The spec hash includes it (`canonicalizeSpec` keeps every field), so each range is cached separately.
- **Two time anchors.**
  - `windowStartSql`: the start of the selected range, or none under All time. Activity counts only after it.
  - `periodStartSql`: the start of the period that "+N" changes compare against. That is the selected range, or the last 7 days under All time, which is what the KPIs show today.
- **Days, not hours.** A range covers today and the `N − 1` days before it, from midnight UTC, the same days as the login data. "Last 7 days" therefore matches the 7 bars of the logins chart.
- **What reads the window.**
  - Attempts, grading state and best score per exercise. Avg score, distributions, scores by exercise and by cohort, hardest exercises, the learner's line and still-to-pass all follow from these.
  - First attempts.
  - Best submissions for question rows.
  - `completed_in_window`, which drives `days_to_finish`.
  - Login days.
  - The growth chart's buckets.
- **What never reads the window.** Completion and progress, status, overdue work, video and classroom attendance, and certificates already issued. These are standing figures. A spec for a standing card never carries a range, so its query and cache entry are the same for every range.
- **Logins.** `loginWindowDays` is the range's days. Under All time it stays the spec's `days` (7 in the presets). `days` is ignored when a range is set.

## 5. Core and API

### 5.0 `packages/core/src/utils/redis/insights-cache.ts`

Saving a target has to show at once, not after the 60-second summary cache expires:

```ts
/**
 * Drops a scope's cached dashboard summary so the next load reads it fresh. Never throws.
 */
export async function invalidateInsightsDashboard(
  orgId: string,
  scopeType: TInsightsScopeType,
  scopeId: string
): Promise<void> {
  if (!env.REDIS_URL) return;

  try {
    await redis.del(insightsKey('dashboard', orgId, scopeType, scopeId));
  } catch (error) {
    logRedisUnavailableOnce('Redis invalidate failed for insights dashboard, continuing', error);
  }
}
```

### 5.1 Presets: `apps/api/src/services/insights/presets/`

Replace all four files. The order of each list **is** the prototype's order for each picker mode:
- `courseMode: 'all'` widgets render only under "All courses".
- `'single'` widgets render only with a course picked.
- `'any'` widgets render in both, and get the picked course appended as a filter.

Widgets that need the same numbers share an identical spec. The dashboard runs each unique spec once (6.2), so splitting the prototype's paired widgets costs no extra query, and the paired numbers always agree.

`shared.ts`:

```ts
import { INSIGHTS_LIMITS, INSIGHTS_PLACEHOLDERS } from '@cio/utils/constants/insights';
import type { TInsightsQuerySpecInput, TInsightsWidgetInput } from '@cio/utils/validation/insights';

export const pickedCourse = { field: 'course', op: 'eq', value: INSIGHTS_PLACEHOLDERS.course } as const;
export const selectedLearner = { field: 'learner', op: 'eq', value: INSIGHTS_PLACEHOLDERS.learner } as const;
export const pickedExercise = { field: 'exercise', op: 'eq', value: INSIGHTS_PLACEHOLDERS.exercise } as const;
export const notCompleted = { field: 'is_completed_all', op: 'is_false' } as const;

export const learnerStatusSpec: TInsightsQuerySpecInput = {
  source: 'learner',
  dimensions: ['status'],
  measures: [{ metric: 'rows', agg: 'count' }],
  sort: [{ field: 'status' }]
};

export const loginsPerDaySpec: TInsightsQuerySpecInput = {
  source: 'login_day',
  dimensions: ['day'],
  measures: [{ metric: 'logged_in', agg: 'count_if' }],
  sort: [{ field: 'day', dir: 'asc' }],
  days: 7,
  limit: INSIGHTS_LIMITS.maxRangeDays
};

/** Cohorts newest first, one shared spec for the paired cohort widgets of a scope. */
export function cohortSummarySpec(limit: number): TInsightsQuerySpecInput {
  return {
    source: 'cohort_summary',
    dimensions: ['cohort'],
    measures: [
      { metric: 'learners', agg: 'value' },
      { metric: 'pending_invites', agg: 'value' },
      { metric: 'avg_progress_pct', agg: 'value' },
      { metric: 'avg_score_pct', agg: 'value' },
      { metric: 'first_try_pass', agg: 'pooled' },
      { metric: 'overdue_learners', agg: 'value' },
      { metric: 'at_risk_learners', agg: 'value' },
      { metric: 'completed_learners', agg: 'value' },
      { metric: 'cohort_created_at', agg: 'value' }
    ],
    sort: [{ field: 'cohort_created_at__value', dir: 'desc' }],
    limit
  };
}

export const learnersTableWidget: TInsightsWidgetInput = {
  id: 'learners',
  titleKey: 'insights.widgets.learners.title',
  viz: 'matrix',
  span: 12,
  spec: {
    source: 'learner',
    dimensions: ['learner'],
    measures: [{ metric: 'name', agg: 'value' }],
    limit: INSIGHTS_LIMITS.learnersPageSize
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
  usesRange: true,
  spec: {
    source: 'question_result',
    filters: [pickedCourse],
    dimensions: ['question'],
    measures: [
      { metric: 'correct_pct', agg: 'avg' },
      { metric: 'wrong_answer', agg: 'mode' },
      { metric: 'question_context', agg: 'value' },
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
      { metric: 'passed_first_try', agg: 'rate' },
      { metric: 'video_pct', agg: 'avg' },
      { metric: 'attendance', agg: 'pooled' }
    ],
    sort: [{ field: 'section', dir: 'asc' }],
    limit: 100
  }
};

/** A cohort-scope widget reused at course scope, where the scope already is the course. */
export function courseWide(widget: TInsightsWidgetInput): TInsightsWidgetInput {
  const spec = { ...widget.spec, filters: (widget.spec.filters ?? []).filter((filter) => filter.field !== 'course') };

  return { ...widget, courseMode: 'any', spec };
}
```

The learners table loads through `InsightsLearnersApi` (`SELF_LOADING_WIDGET_IDS`), so its preset spec is only a placeholder that passes validation.

`cohort.ts`:

```ts
import type { TInsightsWidgetInput } from '@cio/utils/validation/insights';

import {
  hardestQuestionsWidget,
  learnerStatusSpec,
  learnersTableWidget,
  loginsPerDaySpec,
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
    usesRange: true,
    spec: {
      source: 'learner',
      measures: [
        { metric: 'logged_in_today', agg: 'count_if' },
        { metric: 'logged_in_period', agg: 'count_if' },
        { metric: 'rows', agg: 'count' }
      ]
    }
  },
  {
    id: 'kpi_avg_progress',
    titleKey: 'insights.widgets.kpi_avg_progress.title',
    viz: 'kpi',
    span: 4,
    usesRange: true,
    spec: {
      source: 'learner',
      measures: [
        { metric: 'overall_progress_pct', agg: 'avg' },
        { metric: 'overall_progress_pct_existing', agg: 'avg' },
        { metric: 'overall_progress_pct_at_period_start', agg: 'avg' }
      ]
    }
  },
  {
    id: 'kpi_avg_score',
    titleKey: 'insights.widgets.kpi_avg_score.title',
    viz: 'kpi',
    span: 4,
    usesRange: true,
    spec: { source: 'learner', measures: [{ metric: 'avg_score_pct', agg: 'avg' }] }
  },
  {
    id: 'kpi_overdue',
    titleKey: 'insights.widgets.kpi_overdue.title',
    viz: 'kpi',
    span: 4,
    spec: {
      source: 'learner',
      measures: [
        { metric: 'is_overdue', agg: 'count_if' },
        { metric: 'has_overdue_goal', agg: 'count_if' },
        { metric: 'rows', agg: 'count' }
      ]
    }
  },
  {
    id: 'kpi_completed',
    titleKey: 'insights.widgets.kpi_completed.title',
    viz: 'kpi',
    span: 4,
    usesRange: true,
    spec: {
      source: 'learner',
      measures: [
        { metric: 'is_completed_all', agg: 'count_if' },
        { metric: 'completed_all_in_period', agg: 'count_if' },
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
        { metric: 'took_pass_mark', agg: 'count_if' },
        { metric: 'first_try_pass', agg: 'pooled' }
      ],
      sort: [{ field: 'course', dir: 'asc' }],
      limit: 100
    }
  },
  { id: 'learners_by_status', titleKey: 'insights.widgets.learners_by_status.title', viz: 'donut', span: 5, courseMode: 'all', spec: learnerStatusSpec },
  {
    id: 'course_details',
    titleKey: 'insights.widgets.course_details.title',
    viz: 'table',
    span: 12,
    courseMode: 'all',
    spec: {
      source: 'learner_course',
      dimensions: ['course'],
      measures: [
        { metric: 'rows', agg: 'count' },
        { metric: 'progress_pct', agg: 'avg' },
        { metric: 'avg_score_pct', agg: 'avg' },
        { metric: 'is_completed', agg: 'count_if' },
        { metric: 'took_pass_mark', agg: 'count_if' },
        { metric: 'first_try_pass', agg: 'pooled' }
      ],
      sort: [{ field: 'course', dir: 'asc' }],
      limit: 100
    }
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
        { metric: 'pass_mark_passed', agg: 'value' },
        { metric: 'pass_mark_exercises', agg: 'value' },
        { metric: 'still_to_pass', agg: 'value' }
      ],
      sort: [{ field: 'course', dir: 'asc' }],
      limit: 100
    }
  },
  {
    id: 'scores_by_exercise',
    titleKey: 'insights.widgets.scores_by_exercise.title',
    viz: 'line_band',
    span: 7,
    courseMode: 'single',
    usesRange: true,
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
    usesRange: true,
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
    id: 'learners_by_status_course',
    titleKey: 'insights.widgets.learners_by_status.title',
    viz: 'donut',
    span: 5,
    courseMode: 'single',
    spec: { ...learnerStatusSpec, filters: [pickedCourse] }
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
  {
    id: 'score_distribution_course',
    titleKey: 'insights.widgets.score_distribution.title',
    viz: 'histogram',
    span: 5,
    courseMode: 'single',
    usesRange: true,
    spec: {
      source: 'learner',
      filters: [pickedCourse],
      dimensions: ['score_bucket_10'],
      measures: [{ metric: 'rows', agg: 'count' }],
      sort: [{ field: 'score_bucket_10', dir: 'asc' }]
    }
  },
  sectionScorecardWidget,
  needsAttentionWidget,
  {
    id: 'overdue',
    titleKey: 'insights.widgets.overdue.title',
    viz: 'table',
    span: 7,
    spec: {
      source: 'overdue_learner',
      dimensions: ['learner'],
      measures: [
        { metric: 'name', agg: 'value' },
        { metric: 'course_titles', agg: 'value' },
        { metric: 'item_titles', agg: 'value' },
        { metric: 'course_progress_pct', agg: 'value' },
        { metric: 'last_login_at', agg: 'value' },
        { metric: 'days_overdue', agg: 'value' },
        { metric: 'has_goal', agg: 'value' }
      ],
      sort: [{ field: 'days_overdue__value', dir: 'desc' }],
      limit: 5
    }
  },
  hardestQuestionsWidget,
  learnersTableWidget,
  { id: 'logins_per_day', titleKey: 'insights.widgets.logins_per_day.title', viz: 'column', span: 6, courseMode: 'all', usesRange: true, spec: loginsPerDaySpec },
  {
    id: 'score_distribution',
    titleKey: 'insights.widgets.score_distribution.title',
    viz: 'histogram',
    span: 6,
    courseMode: 'all',
    usesRange: true,
    spec: {
      source: 'learner',
      dimensions: ['score_bucket_10'],
      measures: [{ metric: 'rows', agg: 'count' }],
      sort: [{ field: 'score_bucket_10', dir: 'asc' }]
    }
  },
  {
    id: 'logins_per_day_course',
    titleKey: 'insights.widgets.logins_per_day.title',
    viz: 'column',
    span: 12,
    courseMode: 'single',
    usesRange: true,
    spec: loginsPerDaySpec
  }
];
```

Lines over 120 characters (the one-line `learners_by_status` entries) get wrapped by `pnpm format:changed`.

What this order renders (the prototype's sequence):
- **All courses:** five KPIs → courses (7) + status (5) → course details (12) → learner's courses (12) → needs attention (5) + overdue (7) → learners (12) → logins (6) + score distribution (6).
- **One course:** five KPIs → scores by exercise (7) + progress distribution (5) → learner progression (7) + status (5) → section scores (7) + score distribution (5) → scorecard (12) → needs attention (5) + overdue (7) → hardest questions (12) → learners (12) → logins (12).

`course.ts`:

```ts
import { INSIGHTS_LIMITS } from '@cio/utils/constants/insights';
import type { TInsightsWidgetInput } from '@cio/utils/validation/insights';

import {
  cohortSummarySpec,
  courseWide,
  hardestQuestionsWidget,
  learnersTableWidget,
  needsAttentionWidget,
  pickedExercise,
  sectionScorecardWidget
} from './shared';

const courseCohorts = cohortSummarySpec(100);

export const COURSE_WIDGETS: readonly TInsightsWidgetInput[] = [
  {
    id: 'kpi_enrolled',
    titleKey: 'insights.widgets.kpi_enrolled.title',
    viz: 'kpi',
    span: 4,
    usesRange: true,
    spec: {
      source: 'learner_course',
      measures: [
        { metric: 'rows', agg: 'count' },
        { metric: 'enrolled_in_period', agg: 'count_if' }
      ]
    }
  },
  {
    id: 'kpi_completion_rate',
    titleKey: 'insights.widgets.kpi_completion_rate.title',
    viz: 'kpi',
    span: 4,
    usesRange: true,
    spec: {
      source: 'learner_course',
      measures: [
        { metric: 'is_completed', agg: 'rate' },
        { metric: 'completion_rate_at_period_start', agg: 'pooled' }
      ]
    }
  },
  {
    id: 'kpi_avg_grade',
    titleKey: 'insights.widgets.kpi_avg_grade.title',
    viz: 'kpi',
    span: 4,
    usesRange: true,
    spec: { source: 'learner', measures: [{ metric: 'avg_score_pct', agg: 'avg' }] }
  },
  {
    id: 'kpi_first_try_pass',
    titleKey: 'insights.widgets.kpi_first_try_pass.title',
    viz: 'kpi',
    span: 4,
    requires: ['pass_required'],
    usesRange: true,
    spec: {
      source: 'learner_course',
      measures: [
        { metric: 'first_try_pass', agg: 'pooled' },
        { metric: 'took_pass_mark', agg: 'count_if' },
        { metric: 'has_still_to_pass', agg: 'count_if' }
      ]
    }
  },
  {
    id: 'kpi_median_days',
    titleKey: 'insights.widgets.kpi_median_days.title',
    viz: 'kpi',
    span: 4,
    usesRange: true,
    spec: { source: 'learner_course', measures: [{ metric: 'days_to_finish', agg: 'median' }] }
  },
  {
    id: 'scores_by_exercise_by_cohort',
    titleKey: 'insights.widgets.scores_by_exercise_by_cohort.title',
    viz: 'multi_line',
    span: 7,
    usesRange: true,
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
    usesRange: true,
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
    usesRange: true,
    spec: {
      source: 'assessment_result',
      dimensions: ['exercise'],
      measures: [
        { metric: 'best_score_pct', agg: 'avg' },
        { metric: 'first_try_pass', agg: 'pooled' }
      ],
      sort: [{ field: 'best_score_pct__avg', dir: 'asc' }],
      minGroupRows: 3,
      limit: INSIGHTS_LIMITS.hardestExercises
    }
  },
  courseWide(hardestQuestionsWidget),
  { id: 'cohorts_in_course', titleKey: 'insights.widgets.cohorts_in_course.title', viz: 'grouped_bar', span: 12, spec: courseCohorts },
  { id: 'cohort_details', titleKey: 'insights.widgets.cohort_details.title', viz: 'table', span: 12, spec: courseCohorts },
  courseWide(sectionScorecardWidget),
  needsAttentionWidget,
  learnersTableWidget
];
```

`org.ts`:

```ts
import { INSIGHTS_LIMITS } from '@cio/utils/constants/insights';
import type { TInsightsWidgetInput } from '@cio/utils/validation/insights';

import { cohortSummarySpec, loginsPerDaySpec, needsAttentionWidget, notCompleted } from './shared';

const newestCohorts = cohortSummarySpec(INSIGHTS_LIMITS.glanceCohorts);

export const ORG_WIDGETS: readonly TInsightsWidgetInput[] = [
  {
    id: 'kpi_logged_in_week',
    titleKey: 'insights.widgets.kpi_logged_in_week.title',
    viz: 'kpi',
    span: 4,
    usesRange: true,
    spec: {
      source: 'learner',
      measures: [
        { metric: 'logged_in_period', agg: 'count_if' },
        { metric: 'rows', agg: 'count' }
      ]
    }
  },
  {
    id: 'kpi_progress_trend',
    titleKey: 'insights.widgets.kpi_avg_progress.title',
    viz: 'kpi',
    span: 4,
    usesRange: true,
    spec: {
      source: 'learner',
      measures: [
        { metric: 'overall_progress_pct', agg: 'avg' },
        { metric: 'overall_progress_pct_existing', agg: 'avg' },
        { metric: 'overall_progress_pct_at_period_start', agg: 'avg' }
      ]
    }
  },
  {
    id: 'kpi_completions',
    titleKey: 'insights.widgets.kpi_completions.title',
    viz: 'kpi',
    span: 4,
    usesRange: true,
    spec: {
      source: 'learner_course',
      measures: [
        { metric: 'is_completed', agg: 'count_if' },
        { metric: 'rows', agg: 'count' },
        { metric: 'completed_in_period', agg: 'count_if' }
      ]
    }
  },
  {
    id: 'kpi_certificates',
    titleKey: 'insights.widgets.kpi_certificates.title',
    viz: 'kpi',
    span: 4,
    usesRange: true,
    spec: {
      source: 'learner_course',
      measures: [
        { metric: 'is_certified', agg: 'count_if' },
        { metric: 'certified_in_period', agg: 'count_if' },
        { metric: 'is_completed', agg: 'count_if' }
      ]
    }
  },
  {
    id: 'kpi_needs_attention',
    titleKey: 'insights.widgets.kpi_needs_attention.title',
    viz: 'kpi',
    span: 4,
    spec: {
      source: 'learner',
      filters: [notCompleted],
      measures: [
        { metric: 'is_at_risk', agg: 'count_if' },
        { metric: 'rows', agg: 'count' }
      ]
    }
  },
  { id: 'cohorts_at_a_glance', titleKey: 'insights.widgets.cohorts_at_a_glance.title', viz: 'table', span: 8, spec: newestCohorts },
  { ...needsAttentionWidget, span: 4 },
  { id: 'cohort_health', titleKey: 'insights.widgets.cohort_health.title', viz: 'donut', span: 5, spec: newestCohorts },
  {
    id: 'hiring_ramp',
    titleKey: 'insights.widgets.hiring_ramp.title',
    viz: 'line',
    span: 7,
    usesRange: true,
    spec: {
      source: 'org_member',
      dimensions: ['period'],
      measures: [{ metric: 'members_total', agg: 'value' }],
      sort: [{ field: 'period', dir: 'asc' }],
      limit: INSIGHTS_LIMITS.maxRangeDays
    }
  },
  { id: 'logins_per_day', titleKey: 'insights.widgets.logins_per_day.title', viz: 'line', span: 7, usesRange: true, spec: loginsPerDaySpec },
  { id: 'avg_score_by_cohort', titleKey: 'insights.widgets.avg_score_by_cohort.title', viz: 'hbar', span: 5, spec: newestCohorts },
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

Update `insights-presets.test.ts` (5.6) so the tiling check runs per picker mode, and so it asserts the order above.

### 5.2 Insights settings route and service

`apps/api/src/services/insights/settings.ts` (new):

```ts
import { invalidateInsightsDashboard } from '@cio/core/utils/redis/insights-cache';
import { setOrganizationLearnerTarget } from '@cio/db/queries/insights';
import type { TUpdateInsightsSettings } from '@cio/utils/validation/insights';

import { ErrorCodes } from '@api/utils/errors';
import { toInsightsError } from './errors';

/**
 * Saves the org's learner target for the growth chart, then drops the cached org summary so the next load shows it.
 */
export async function updateInsightsSettings(
  orgId: string,
  input: TUpdateInsightsSettings
): Promise<{ learnerTarget: number | null }> {
  try {
    const learnerTarget = await setOrganizationLearnerTarget(orgId, input.learnerTarget);
    await invalidateInsightsDashboard(orgId, 'org', orgId);

    return { learnerTarget };
  } catch (error) {
    throw toInsightsError(error, ErrorCodes.INSIGHTS_QUERY_FAILED);
  }
}
```

Export it from `services/insights/index.ts`.

In `routes/insights/index.ts`, append to the chain. The org comes from the verified header, never the body:

```ts
import { orgAdminMiddleware } from '@api/middlewares/org-admin';
import { ZUpdateInsightsSettings } from '@cio/utils/validation/insights';

  .put('/settings', authMiddleware, orgAdminMiddleware, zValidator('json', ZUpdateInsightsSettings), async (c) => {
    c.header('Cache-Control', INSIGHTS_CACHE_CONTROL);

    try {
      const orgId = c.req.header('cio-org-id')!;
      const input = c.req.valid('json');
      const settings = await updateInsightsSettings(orgId, input);

      return c.json({ success: true, data: settings }, 200);
    } catch (error) {
      return handleError(c, error, 'Failed to save analytics settings');
    }
  })
```

### 5.3 Reminders: per learner, through one endpoint

The prototype's "Send reminder" sits on a **learner** row and covers every overdue goal that learner has. The single-assignment endpoint is no longer used anywhere, so remove it:
- `POST /cohort/:cohortId/goal-assignments/:assignmentId/remind`
- `sendCohortGoalReminderNow`
- `getAssignmentReminderContext`
- `cohortGoalApi.remindAssignment`
- `RemindGoalAssignmentRequest`
- their tests

`POST /cohort/:cohortId/goal-assignments/remind-overdue` now accepts `{ courseId?, profileId? }`.

`apps/api/src/services/cohort/goal.ts`:

```ts
/**
 * Emails overdue learners on the cohort's active goals now: everyone, one course's goals, or one learner.
 */
export async function sendOverdueCohortGoalRemindersNow(
  cohortId: string,
  input: TRemindOverdueCohortGoals
): Promise<{ enqueued: number; skipped: number }> {
  const contexts = await listOverdueAssignmentReminderContexts(cohortId, {
    courseId: input.courseId,
    profileId: input.profileId
  });
  // …loop unchanged
}
```

The route keeps its middleware, rate limit and response. Only the validator changes, to the extended `ZRemindOverdueCohortGoals`.

### 5.4 Dashboard summary

`InsightsDashboard['scope']` already spreads the summary, so `description`, `cohortCount` and `learnerTarget` reach the client with no further API change.

### 5.5 Public API and MCP

No change. The `/public-api/v1` analytics routes still report their own numbers until Phase 3.

### 5.6 API tests to update or add

- **`insights-compiler.test.ts`:** `cohort_summary` always joins the bridge, and `overdue_learner` is refused at org scope.
- **`insights-metrics-db.test.ts`:** add these fixtures and assertions.
  - **First-try fixtures**, all on an exercise with pass mark 70:
    - L1 scores 60, then 80 → not first try, passed, not still to pass.
    - L2's first attempt is awaiting grade → excluded from first-try entirely.
    - L5 scores 90 → passed first try.
    - L6 scores 40 → `still_to_pass`.
  - **First-try results:** the course rate is 1 / 3 (L1, L5 and L6 graded first; L5 passed). `took_pass_mark` is 3 learners and `has_still_to_pass` is 1.
  - **Week-over-week:** enrolments 3 and 10 days old; a completion 2 days ago; lesson completions either side of the cutoff. Check `progress_pct_at_period_start`, `completed_in_period`, `completion_rate_at_period_start`, and that a learner enrolled 3 days ago has `overall_progress_pct_existing = NULL`.
  - **`cohort_summary`:** an archived cohort is absent. A cohort with courses and no students is present with 0 learners. A cohort with pending invites reports them. No row has a `null` cohort.
  - **`overdue_learner`:** a learner with two overdue goals and an overdue exercise appears once, with `has_goal = true` and `course_progress_pct` pooled over exactly those courses.
  - **`now_at_title`:** returns the section title when the first incomplete item is in a section, and the item title otherwise.
  - **`question_context`:** the section title when the exercise has a section, else the exercise title.
- **`routes-insights.test.ts`:** `PUT /insights/settings` returns 403 for a tutor, 200 for an admin; `null` clears the target; an out-of-range value returns 400.
- **`services-cohort-goal.test.ts`:** `remind-overdue` with `profileId` only enqueues that learner's assignments. Remove the single-assignment tests.
- **Range (`insights-compiler.test.ts`, `insights-metrics-db.test.ts`, `services-insights-canonicalize.test.ts`):**
  - A spec without `range` parses as `'all'`; an unknown range returns 400. Two specs that differ only in range hash differently.
  - `loginWindowDays` is the range's days and ignores `days`; under All time it is `days`.
  - **Attempts.** One exercise has attempts 40 and 5 days old. Under `'30d'`, `best_score_pct`, `state` and `avg_score_pct` use only the recent attempt. `passed_first_try` is null, because the first attempt is outside the window. Under `'all'`, both count.
  - **Standing columns.** `is_complete`, `progress_pct` and `status` are identical under `'7d'` and `'all'` for the same learner.
  - **Questions.** `question_result` under `'7d'` uses only the best attempt made in the last 7 days.
  - **Completions.** A completion 10 days ago: under `'7d'`, `completed_in_window` is false and `days_to_finish` is null; under `'30d'` both are set. `completed_in_period`, `enrolled_in_period` and `certified_in_period` use 30 days under `'30d'` and 7 under `'all'`.
  - **Growth.** `org_member` returns 6, 7, 30 and 13 rows for `'all'`, `'7d'`, `'30d'` and `'90d'`, and `members_total` never decreases.
  - **Logins.** `login_day` returns 90 days per learner under `'90d'`.
- **`insights-presets.test.ts`:**
  - Every preset parses.
  - `usesRange` is true on exactly the widgets in 2.5's "follow the range" table, and on no Overdue or Needs attention KPI. `loginsPerDaySpec` and `hiring_ramp` have `limit >= INSIGHTS_LIMITS.maxRangeDays`.
  - Each scope's widget order, for each picker mode, equals the lists in 5.1.
  - Visible panels tile 12 columns per mode (via `fillRowSpans`).
  - Paired widgets have deep-equal specs: `courses_summary`/`course_details`, `cohorts_in_course`/`cohort_details`, and org `cohorts_at_a_glance`/`cohort_health`/`avg_score_by_cohort`.

## 6. Dashboard (`apps/dashboard/src/lib/features/insights`)

Paths are relative to the feature folder unless they start with `apps/` or `packages/`.

Visual styling comes from the product's components and theme tokens (`Card`, `Table`, `Button`, `ui:` colours). The prototype's CSS is a sketch: copy its structure, copy, order, colour meaning (green, amber, red, primary) and behaviour, not its pixels.

### 6.1 `KpiCard` trend (`apps/dashboard/src/lib/features/ui/analytics/kpi-card.svelte`)

The prototype colours each KPI's context line: green for good movement, red for bad, muted otherwise. Add a `trend` prop. It is optional, so the Marketing page is unchanged.

```svelte
<script lang="ts">
  // …existing imports

  interface Props {
    title: string;
    value: number | string;
    description?: string;
    trend?: 'up' | 'down' | 'flat';
    icon?: Component;
    accent?: 'primary' | 'success' | 'warning' | 'danger';
    sparkline?: number[];
    loading?: boolean;
    class?: string;
  }

  let {
    title,
    value,
    description,
    trend = 'flat',
    icon: Icon,
    accent = 'primary',
    sparkline,
    loading = false,
    class: className
  }: Props = $props();

  const trendClass: Record<NonNullable<Props['trend']>, string> = {
    up: 'text-emerald-600 dark:text-emerald-400',
    down: 'text-rose-600 dark:text-rose-400',
    flat: 'ui:text-muted-foreground'
  };

  // …accentClass, sparklinePath unchanged
</script>

<!-- …header and value unchanged -->
    {#if description}
      {#if loading}
        <Skeleton class="mt-2 h-3 w-32" />
      {:else}
        <p class={cn('mt-1 text-xs tabular-nums', trendClass[trend])}>{description}</p>
      {/if}
    {/if}
```

### 6.2 `api/insights.svelte.ts`: full replacement

What changes:
- **One request per identical spec.** Widgets whose resolved specs are equal share one in-flight request and the same result. That covers the paired prototype widgets: courses chart and table, cohort chart and table, and the three org cohort widgets.
- **Cohorts open on All courses** (C1).
- **The range lives in the selection** (2.5). `#resetView` leaves it alone, so the chosen range carries over between analytics pages, like Marketing's.
- **The first learner is preselected** once the learners table loads (C6, C7). The selected learner's name drives the widget titles. In single-course mode, their progress and position in the course drive the chips on "{name}: scores by exercise".

```ts
import type { TInsightsRange } from '@cio/utils/constants/insights';
import { BaseApi, classroomio } from '$lib/utils/services/api';

import {
  defaultCourseId,
  defaultExerciseId,
  isWidgetVisible,
  oldestGeneratedAt,
  resolveWidgetSpec,
  SELF_LOADING_WIDGET_IDS,
  selectedLearnerCourseSpec,
  specRequestKey,
  widgetUsesPlaceholder
} from '../utils/insights-utils';
import type {
  InsightsDashboard,
  InsightsDashboardRequest,
  InsightsQueryRequest,
  InsightsResult,
  InsightsRow,
  InsightsScopeRef,
  InsightsSelection,
  InsightsSpec,
  InsightsWidget,
  InsightsWidgetState,
  SelectedLearner
} from '../utils/types';

const IDLE_WIDGET: InsightsWidgetState = { result: null, loading: false, failed: false };

class InsightsApi extends BaseApi {
  scope = $state<InsightsScopeRef | null>(null);
  dashboard = $state<InsightsDashboard | null>(null);
  dashboardFailed = $state(false);
  selection = $state<InsightsSelection>({ courseId: null, learnerId: null, exerciseId: null, range: 'all' });
  selectedLearner = $state<SelectedLearner | null>(null);
  selectedLearnerCourse = $state<InsightsRow | null>(null);
  widgetStates = $state<Record<string, InsightsWidgetState>>({});

  #dashboardSeq = 0;
  #learnerCourseSeq = 0;
  #widgetSeq = new Map<string, number>();
  #inFlight = new Map<string, Promise<InsightsResult | null>>();

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

  get usesLearnerSelection(): boolean {
    return (this.dashboard?.widgets ?? []).some((widget) => widgetUsesPlaceholder(widget, 'learner'));
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

    const result = await this.#sharedQuery(scope, spec, Boolean(options.refresh));
    if (this.#widgetSeq.get(widget.id) !== widgetSeq) return;

    this.widgetStates[widget.id] = result
      ? { result, loading: false, failed: false }
      : { ...previous, loading: false, failed: true };
  }

  async selectCourse(courseId: string | null) {
    this.selection.courseId = courseId;
    this.selection.exerciseId = null;

    await Promise.all([this.runVisibleWidgets(), this.#loadSelectedLearnerCourse()]);
  }

  /**
   * Switches the dashboard's range. Only the widgets that follow it run again; standing ones keep their results.
   */
  async selectRange(range: TInsightsRange) {
    this.selection.range = range;
    const widgets = this.visibleWidgets.filter((widget) => widget.usesRange);

    await Promise.all(widgets.map((widget) => this.runWidget(widget)));
  }

  async selectLearner(learner: SelectedLearner) {
    this.selectedLearner = learner;
    this.selection.learnerId = learner.id;
    const widgets = this.visibleWidgets.filter((widget) => widgetUsesPlaceholder(widget, 'learner'));
    const widgetRuns = widgets.map((widget) => this.runWidget(widget));

    await Promise.all([...widgetRuns, this.#loadSelectedLearnerCourse()]);
  }

  /**
   * Selects `learner` when this dashboard has learner widgets and nobody is selected yet, so they never open empty.
   */
  async ensureLearnerSelected(learner: SelectedLearner | null) {
    if (!learner || this.selection.learnerId || !this.usesLearnerSelection) return;

    await this.selectLearner(learner);
  }

  async selectExercise(exerciseId: string) {
    this.selection.exerciseId = exerciseId;
    const widgets = this.visibleWidgets.filter((widget) => widgetUsesPlaceholder(widget, 'exercise'));

    await Promise.all(widgets.map((widget) => this.runWidget(widget)));
  }

  async refreshAll() {
    await Promise.all([this.runVisibleWidgets({ refresh: true }), this.#loadSelectedLearnerCourse()]);
  }

  async poll() {
    await Promise.all([this.runVisibleWidgets(), this.#loadSelectedLearnerCourse()]);
  }

  reset() {
    this.#dashboardSeq += 1;
    this.#resetView(null);
  }

  #sharedQuery(scope: InsightsScopeRef, spec: InsightsSpec, refresh: boolean): Promise<InsightsResult | null> {
    const key = specRequestKey(scope, spec, refresh);
    const pending = this.#inFlight.get(key);
    if (pending) return pending;

    const request = this.#query(scope, spec, refresh).finally(() => this.#inFlight.delete(key));
    this.#inFlight.set(key, request);

    return request;
  }

  async #query(scope: InsightsScopeRef, spec: InsightsSpec, refresh: boolean): Promise<InsightsResult | null> {
    const response = await this.execute<InsightsQueryRequest>({
      requestFn: () => classroomio.insights.query.$post({ json: { scope, spec, refresh } }),
      logContext: `loading insights ${spec.source}`
    });

    return response?.data ?? null;
  }

  async #loadSelectedLearnerCourse() {
    this.#learnerCourseSeq += 1;
    const seq = this.#learnerCourseSeq;
    const scope = this.scope;
    const learnerId = this.selection.learnerId;
    const courseId = this.selection.courseId;
    if (!scope || !learnerId || !courseId || !this.usesLearnerSelection) {
      this.selectedLearnerCourse = null;
      return;
    }

    const spec = selectedLearnerCourseSpec(learnerId, courseId);
    const result = await this.#sharedQuery(scope, spec, false);
    if (seq !== this.#learnerCourseSeq) return;

    this.selectedLearnerCourse = result?.rows[0] ?? null;
  }

  #resetView(scope: InsightsScopeRef | null) {
    this.#learnerCourseSeq += 1;
    this.scope = scope;
    this.dashboard = null;
    this.dashboardFailed = false;
    this.widgetStates = {};
    this.selection.courseId = null;
    this.selection.learnerId = null;
    this.selection.exerciseId = null;
    this.selectedLearner = null;
    this.selectedLearnerCourse = null;
    this.#widgetSeq.clear();
    this.#inFlight.clear();
  }

  #defaultExercise(dashboard: InsightsDashboard): string | null {
    if (dashboard.scope.type !== 'course') return null;

    const courseId = dashboard.scope.courses[0]?.id;

    return courseId ? defaultExerciseId(dashboard.structures[courseId]) : null;
  }
}

export const insightsApi = new InsightsApi();
```

`utils/types.ts` additions:

```ts
export type SelectedLearner = { id: string; name: string };

export type InsightsTrend = 'up' | 'down' | 'flat';

export type InsightsKpiDisplay = { title?: string; value: string; description?: string; trend?: InsightsTrend };

export type InsightsKpiContext = { courseSelected: boolean; rangeDays: number | null };

export type InsightsWidgetContext = {
  scopeType: InsightsScopeType;
  courseSelected: boolean;
  cohortCount: number;
  learnerCount: number;
};

export type InsightsPillTone = 'ok' | 'lag' | 'risk' | 'done';

export type InsightsTitleVars = { name: string; course: string; exercise: string };

export type InsightsRangeOption = { value: TInsightsRange; label: string };
```

`InsightsSelection` gains the range:

```ts
export type InsightsSelection = {
  courseId: string | null;
  learnerId: string | null;
  exerciseId: string | null;
  range: TInsightsRange;
};
```

`pass-required-tag.svelte` is replaced by `pass-mark-tag.svelte` (6.8.1).

### 6.3 `utils/insights-utils.ts`

Apply these edits. Every function named here is covered by 7.2.

**Imports.**
- Constants: `INSIGHTS_DEFAULT_PERIOD_DAYS`, `INSIGHTS_LIMITS`, `INSIGHTS_PLACEHOLDERS`, `INSIGHTS_RANGES` and `INSIGHTS_THRESHOLDS`, and the `TInsightsRange` type, from `@cio/utils/constants/insights`.
- Types: add `InsightsKpiContext`, `InsightsPillTone`, `InsightsRangeOption`, `InsightsScopeRef`, `InsightsTitleVars`, `InsightsTrend`, `InsightsWidgetContext` and `SelectedLearner` to the existing import from `./types`.

**Colours and tones**

```ts
export const INSIGHTS_COLORS = {
  primary: 'var(--primary)',
  success: 'var(--success)',
  danger: 'var(--destructive)',
  warning: 'oklch(0.769 0.188 70.08)',
  muted: 'var(--chart-1)',
  neutral: 'var(--muted-foreground)'
} as const;

/**
 * The prototype's heat scale: green at 70% and above, amber from 50%, red below.
 */
export function scoreTone(scorePct: number | null): InsightsTone {
  if (scorePct === null) return 'muted';

  if (scorePct >= INSIGHTS_THRESHOLDS.heatGoodPct) return 'success';

  if (scorePct >= INSIGHTS_THRESHOLDS.heatWarnPct) return 'warning';

  return 'danger';
}

export function dropoffTone(completionPct: number | null): InsightsTone {
  if (completionPct === null) return 'muted';

  if (completionPct < INSIGHTS_THRESHOLDS.dropoffBadPct) return 'danger';

  return completionPct < INSIGHTS_THRESHOLDS.dropoffWarnPct ? 'warning' : 'info';
}

export const STATUS_PILL_TONE: Record<TInsightsStatus, InsightsPillTone> = {
  on_track: 'ok',
  lagging: 'lag',
  at_risk: 'risk',
  completed: 'done'
};

export const STATUS_DISPLAY_ORDER: readonly TInsightsStatus[] = ['on_track', 'lagging', 'at_risk', 'completed'];
```

`passTone` stays as it is. Delete `STATUS_BADGE_VARIANT`.

**Selection and request keys**

```ts
export function defaultCourseId(dashboard: InsightsDashboard): string | null {
  if (dashboard.scope.type !== 'course') return null;

  return dashboard.scope.courses[0]?.id ?? null;
}

function sortKeys(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortKeys);

  if (value === null || typeof value !== 'object') return value;

  const entries = Object.entries(value).sort(([left], [right]) => left.localeCompare(right));

  return Object.fromEntries(entries.map(([key, entry]) => [key, sortKeys(entry)]));
}

/**
 * One key per distinct request, whatever order the spec's keys were written in, so identical widgets share one request.
 */
export function specRequestKey(scope: InsightsScopeRef, spec: InsightsSpec, refresh: boolean): string {
  return JSON.stringify(sortKeys({ scope, spec, refresh }));
}

export function selectedLearnerCourseSpec(learnerId: string, courseId: string): InsightsSpec {
  return {
    source: 'learner_course',
    dimensions: ['course'],
    measures: [
      { metric: 'progress_pct', agg: 'value' },
      { metric: 'now_at_title', agg: 'value' }
    ],
    filters: [
      { field: 'course', op: 'eq', value: courseId },
      { field: 'learner', op: 'eq', value: learnerId }
    ],
    sort: [],
    limit: 1,
    page: 1,
    range: 'all'
  };
}

export function toSelectedLearner(row: InsightsRow | undefined): SelectedLearner | null {
  const id = textCell(row, 'learner_id');
  if (!id) return null;

  const name = textCell(row, 'name__value') ?? textCell(row, 'learner_label') ?? '';

  return { id, name };
}

/**
 * The selection a widget is still waiting for, or null when its spec can run.
 */
export function missingSelection(widget: InsightsWidget, selection: InsightsSelection): PlaceholderKey | null {
  const keys = Object.keys(PLACEHOLDER_BY_KEY) as PlaceholderKey[];

  return keys.find((key) => widgetUsesPlaceholder(widget, key) && !selection[SELECTION_BY_PLACEHOLDER[key]]) ?? null;
}
```

Export `PlaceholderKey`: `export type PlaceholderKey = keyof typeof PLACEHOLDER_BY_KEY;`. It is derived from a constant in this file, so it stays here.

**Cohort health from `cohort_summary` rows**

```ts
export type CohortHealth = TInsightsStatus;

/**
 * A cohort's health from its learners: completed when nearly everyone finished, at risk when a fifth are at risk,
 * lagging when the average score is low. Null for a cohort with no learners yet.
 */
export function cohortHealth(row: InsightsRow): CohortHealth | null {
  const learners = numberCell(row, 'learners__value') ?? 0;
  if (learners === 0) return null;

  const completed = numberCell(row, 'completed_learners__value') ?? 0;
  const atRisk = numberCell(row, 'at_risk_learners__value') ?? 0;
  const averageScore = numberCell(row, 'avg_score_pct__value');

  if (completed / learners >= 0.95) return 'completed';

  if (atRisk / learners >= 0.2) return 'at_risk';

  if (averageScore !== null && averageScore < INSIGHTS_THRESHOLDS.laggingScorePct) return 'lagging';

  return 'on_track';
}

export function toHealthSegments(result: InsightsResult, translate: Translate): DonutSegment[] {
  const learnersByHealth = new Map<CohortHealth, number>();

  for (const row of result.rows) {
    const health = cohortHealth(row);
    if (!health) continue;

    const learners = numberCell(row, 'learners__value') ?? 0;
    learnersByHealth.set(health, (learnersByHealth.get(health) ?? 0) + learners);
  }

  return STATUS_DISPLAY_ORDER.flatMap((health) => {
    const value = learnersByHealth.get(health);
    if (!value) return [];

    const label = translate(`insights.status.${health}`);

    return [{ key: health, label, value, color: STATUS_COLORS[health] }];
  });
}

export function cohortsShown(result: InsightsResult, limit: number): InsightsRow[] {
  return result.rows.slice(0, limit);
}
```

`toDonutSegments`: when `dimension === 'status'`, return the segments in `STATUS_DISPLAY_ORDER` and drop zero values. That is the prototype's legend order: On track, Lagging, At risk, Completed.

```ts
export function toDonutSegments(result: InsightsResult, dimension: string, translate: Translate): DonutSegment[] {
  const measureKey = result.columns.find((column) => column.role === 'measure')?.key ?? '';
  const segments = result.rows.map((row, index) => {
    const id = row[`${dimension}_id`];
    const color = isInsightsStatus(id) ? STATUS_COLORS[id] : SERIES_COLORS[index % SERIES_COLORS.length];
    const label = dimensionLabel(row, dimension, translate);
    const value = numberCell(row, measureKey) ?? 0;

    return { key: String(id ?? index), label, value, color };
  });
  if (dimension !== 'status') return segments;

  const order = STATUS_DISPLAY_ORDER as readonly string[];

  return segments
    .filter((segment) => segment.value > 0)
    .sort((left, right) => order.indexOf(left.key) - order.indexOf(right.key));
}
```

**Sections**

```ts
/**
 * "Section 2" (or "Section 2 · Title"), numbered by the section's position in the course outline.
 */
export function sectionLabel(
  sectionId: InsightsCell | undefined,
  structure: InsightsCourseStructure | undefined,
  translate: Translate,
  options: { withTitle: boolean }
): string {
  const section = structure?.sections.find((entry) => entry.id === sectionId);
  if (!section) return translate('insights.not_in_section');

  const number = section.rank + 1;

  return options.withTitle
    ? translate('insights.section_with_title', { number, title: section.title })
    : translate('insights.section_number', { number });
}
```

**Lesson drop-off**

```ts
/**
 * The adjacent pair of lessons with the largest fall in completion, or null when completion never falls.
 */
export function steepestDrop(items: readonly HbarItem[]): { from: string; to: string } | null {
  let steepest: { from: string; to: string; fall: number } | null = null;

  for (let index = 1; index < items.length; index += 1) {
    const previous = items[index - 1];
    const current = items[index];
    if (previous.value === null || current.value === null) continue;

    const fall = previous.value - current.value;
    if (fall > 0 && (!steepest || fall > steepest.fall)) {
      steepest = { from: previous.label, to: current.label, fall };
    }
  }

  return steepest ? { from: steepest.from, to: steepest.to } : null;
}
```

**Labels**

```ts
export const CHIP_CLASS = 'ui:border-border ui:bg-card rounded-full border px-3 py-1 text-xs tabular-nums';

export function truncateLabel(label: string, maxLength = 16): string {
  return label.length > maxLength ? `${label.slice(0, maxLength - 1)}…` : label;
}

export function formatShortDate(value: InsightsCell | undefined): string {
  if (typeof value !== 'string') return '–';

  return new Date(value).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' });
}
```

In `dimensionLabel`, date labels cover `period` instead of `week`: `if (dimension === 'day' || dimension === 'period')`. Then replace the null-cohort branch:

```ts
  if (id === null && dimension === 'cohort') return translate('insights.legend.all_learners');
```

The only place a null cohort still renders is the course chart's fallback line for a course that has no cohorts (6.8).

**Histograms leave out learners with no score.** The prototype counts scored learners only.

```ts
export function histogramPoints(result: InsightsResult, dimension: string, translate: Translate): InsightsChartPoint[] {
  const scored = result.rows.filter((row) => row[`${dimension}_id`] !== null);

  return toChartPoints({ ...result, rows: scored }, dimension, translate);
}
```

**Range.** `resolveWidgetSpec` sets the range on the widgets that follow it, and nowhere else (2.5):

```ts
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

  const range = widget.usesRange ? selection.range : 'all';

  return { ...widget.spec, filters, range };
}

/**
 * True for a card that stays as of now while a range is selected. Its Now tag says so.
 */
export function isNowCard(widget: InsightsWidget, range: TInsightsRange): boolean {
  return range !== 'all' && !widget.usesRange;
}

export function rangeOptions(translate: Translate): InsightsRangeOption[] {
  return INSIGHTS_RANGES.map((range) => ({ value: range, label: translate(`analytics.range.${range}`) }));
}
```

`SELECTION_BY_PLACEHOLDER` narrows to `Record<PlaceholderKey, 'courseId' | 'learnerId' | 'exerciseId'>`, because `range` is a selection field but not a placeholder.

**KPIs.** Replace `KPI_FORMATTERS` and `formatKpi`. Under All time each card reads as the prototype. Under a range, the activity cards describe the window and the standing ones show their change across it (2.5).

```ts
type KpiFormatter = (
  row: InsightsRow | undefined,
  translate: Translate,
  context: InsightsKpiContext
) => InsightsKpiDisplay;

type DeltaWording = 'gained' | 'compared';

function shareTrend(part: number | null, whole: number | null): InsightsTrend {
  const share = percentOf(part, whole);

  return share !== null && share >= INSIGHTS_THRESHOLDS.alertSharePct ? 'down' : 'flat';
}

function deltaPeriodKey(wording: DeltaWording, rangeDays: number | null): string {
  if (rangeDays === null) return wording === 'gained' ? 'this_week' : 'vs_last_week';

  return wording === 'gained' ? 'in_days' : 'vs_days_ago';
}

/**
 * The context line for a percentage that moved over the period: "+4 pts vs last week" under All time,
 * "+6 pts in the last 30 days" under a range. Green up, red down.
 */
export function formatPointsDelta(
  current: number | null,
  previous: number | null,
  wording: DeltaWording,
  rangeDays: number | null,
  translate: Translate
): Pick<InsightsKpiDisplay, 'description' | 'trend'> {
  if (current === null || previous === null) return {};

  const period = deltaPeriodKey(wording, rangeDays);
  const days = rangeDays ?? INSIGHTS_DEFAULT_PERIOD_DAYS;
  const points = Math.round(current - previous);
  if (points > 0) {
    return { description: translate(`insights.kpi.delta.${period}.up`, { count: points, days }), trend: 'up' };
  }

  if (points < 0) {
    return { description: translate(`insights.kpi.delta.${period}.down`, { count: -points, days }), trend: 'down' };
  }

  return { description: translate(`insights.kpi.delta.${period}.flat`, { days }), trend: 'flat' };
}

function addedInRange(count: number, rangeDays: number, translate: Translate): Pick<InsightsKpiDisplay, 'description' | 'trend'> {
  const description = translate('insights.kpi.added_in_days', { count, days: rangeDays });

  return { description, trend: count > 0 ? 'up' : 'flat' };
}

function loggedInTitle(rangeDays: number | null, translate: Translate): string | undefined {
  return rangeDays === null ? undefined : translate('insights.kpi.logged_in_days', { days: rangeDays });
}

function averageScoreKpi(
  row: InsightsRow | undefined,
  translate: Translate,
  context: InsightsKpiContext
): InsightsKpiDisplay {
  const value = formatPercent(row?.['avg_score_pct__avg']);
  const description =
    context.rangeDays === null
      ? translate('insights.kpi.avg_score_hint')
      : translate('insights.kpi.avg_score_in_days', { days: context.rangeDays });

  return { value, description, trend: 'flat' };
}

function progressKpi(row: InsightsRow | undefined, translate: Translate, rangeDays: number | null): InsightsKpiDisplay {
  const average = numberCell(row, 'overall_progress_pct__avg');
  const existingAverage = numberCell(row, 'overall_progress_pct_existing__avg');
  const averageAtStart = numberCell(row, 'overall_progress_pct_at_period_start__avg');
  const delta = formatPointsDelta(existingAverage, averageAtStart, 'gained', rangeDays, translate);

  return { value: formatPercent(average), ...delta };
}

function completedDescription(
  percent: string,
  certified: number,
  completedInPeriod: number,
  translate: Translate,
  context: InsightsKpiContext
): string {
  if (context.rangeDays !== null) {
    return translate('insights.kpi.completed_in_days', { percent, count: completedInPeriod, days: context.rangeDays });
  }

  if (context.courseSelected) return translate('insights.kpi.share_of_cohort', { percent });

  return translate('insights.kpi.completed_certified', { percent, count: certified });
}

const KPI_FORMATTERS: Record<string, KpiFormatter> = {
  kpi_logged_in_today: (row, translate, context) => {
    const activeKey = context.rangeDays === null ? 'logged_in_today__count_if' : 'logged_in_period__count_if';
    const active = numberCell(row, activeKey);
    const total = numberCell(row, 'rows__count');
    const value = `${formatCount(active)} / ${formatCount(total)}`;
    const percent = formatPercent(percentOf(active, total));
    const description = translate('insights.kpi.share_of_cohort', { percent });
    const title = loggedInTitle(context.rangeDays, translate);

    return { title, value, description, trend: 'flat' };
  },
  kpi_avg_progress: (row, translate, context) => {
    if (context.rangeDays !== null) return progressKpi(row, translate, context.rangeDays);

    const value = formatPercent(row?.['overall_progress_pct__avg']);
    const description = translate('insights.kpi.avg_progress_hint');

    return { value, description, trend: 'flat' };
  },
  kpi_avg_score: averageScoreKpi,
  kpi_avg_grade: averageScoreKpi,
  kpi_overdue: (row, translate) => {
    const overdue = numberCell(row, 'is_overdue__count_if');
    const total = numberCell(row, 'rows__count');
    const description = translate('insights.kpi.overdue_hint');

    return { value: formatCount(overdue), description, trend: shareTrend(overdue, total) };
  },
  kpi_completed: (row, translate, context) => {
    const completed = numberCell(row, 'is_completed_all__count_if');
    const total = numberCell(row, 'rows__count');
    const certified = numberCell(row, 'certificates__sum') ?? 0;
    const completedInPeriod = numberCell(row, 'completed_all_in_period__count_if') ?? 0;
    const percent = formatPercent(percentOf(completed, total));
    const description = completedDescription(percent, certified, completedInPeriod, translate, context);
    const trend = context.rangeDays !== null && completedInPeriod > 0 ? 'up' : 'flat';

    return { value: formatCount(completed), description, trend };
  },
  kpi_enrolled: (row, translate, context) => {
    const enrolled = numberCell(row, 'rows__count');
    const enrolledInPeriod = numberCell(row, 'enrolled_in_period__count_if') ?? 0;
    const description =
      context.rangeDays === null
        ? translate('insights.kpi.enrolled_this_week', { count: enrolledInPeriod })
        : translate('insights.kpi.enrolled_in_days', { count: enrolledInPeriod, days: context.rangeDays });

    return { value: formatCount(enrolled), description, trend: enrolledInPeriod > 0 ? 'up' : 'flat' };
  },
  kpi_completion_rate: (row, translate, context) => {
    const rate = numberCell(row, 'is_completed__rate');
    const rateAtStart = numberCell(row, 'completion_rate_at_period_start__pooled');
    const delta = formatPointsDelta(rate, rateAtStart, 'compared', context.rangeDays, translate);

    return { value: formatPercent(rate), ...delta };
  },
  kpi_first_try_pass: (row, translate, context) => {
    const took = numberCell(row, 'took_pass_mark__count_if') ?? 0;
    const stillToPass = numberCell(row, 'has_still_to_pass__count_if') ?? 0;
    const value = formatPercent(row?.['first_try_pass__pooled']);
    const description =
      context.rangeDays === null
        ? translate('insights.kpi.first_try_context', { took, still: stillToPass })
        : translate('insights.kpi.first_try_in_days', { took, still: stillToPass, days: context.rangeDays });

    return { value, description, trend: 'flat' };
  },
  kpi_median_days: (row, translate, context) => {
    const days = numberCell(row, 'days_to_finish__median');
    const description =
      context.rangeDays === null
        ? translate('insights.kpi.median_days_hint')
        : translate('insights.kpi.median_days_in_days', { days: context.rangeDays });

    return { value: formatCount(days), description, trend: 'flat' };
  },
  kpi_logged_in_week: (row, translate, context) => {
    const active = numberCell(row, 'logged_in_period__count_if');
    const total = numberCell(row, 'rows__count');
    const percent = formatPercent(percentOf(active, total));
    const description = translate('insights.kpi.share_of_enrolled', { percent });
    const title = loggedInTitle(context.rangeDays, translate);

    return { title, value: formatCount(active), description, trend: 'flat' };
  },
  kpi_progress_trend: (row, translate, context) => progressKpi(row, translate, context.rangeDays),
  kpi_completions: (row, translate, context) => {
    const completed = numberCell(row, 'is_completed__count_if');
    const enrolled = numberCell(row, 'rows__count');
    const completedInPeriod = numberCell(row, 'completed_in_period__count_if') ?? 0;
    if (context.rangeDays !== null) {
      return { value: formatCount(completed), ...addedInRange(completedInPeriod, context.rangeDays, translate) };
    }

    const percent = formatPercent(percentOf(completed, enrolled));
    const description = translate('insights.kpi.share_of_enrolled', { percent });

    return { value: formatCount(completed), description, trend: completedInPeriod > 0 ? 'up' : 'flat' };
  },
  kpi_certificates: (row, translate, context) => {
    const certified = numberCell(row, 'is_certified__count_if');
    const completed = numberCell(row, 'is_completed__count_if');
    const certifiedInPeriod = numberCell(row, 'certified_in_period__count_if') ?? 0;
    if (context.rangeDays !== null) {
      return { value: formatCount(certified), ...addedInRange(certifiedInPeriod, context.rangeDays, translate) };
    }

    const percent = formatPercent(percentOf(certified, completed));
    const description = translate('insights.kpi.share_of_completions', { percent });

    return { value: formatCount(certified), description, trend: 'flat' };
  },
  kpi_needs_attention: (row, translate) => {
    const flagged = numberCell(row, 'is_at_risk__count_if');
    const total = numberCell(row, 'rows__count');
    const description = translate('insights.kpi.needs_attention_hint');

    return { value: formatCount(flagged), description, trend: shareTrend(flagged, total) };
  }
};

export function formatKpi(
  widget: InsightsWidget,
  result: InsightsResult | null,
  translate: Translate,
  context: InsightsKpiContext
): InsightsKpiDisplay {
  const formatter = KPI_FORMATTERS[widget.id];
  const row = result?.rows[0];
  if (formatter) return formatter(row, translate, context);

  const firstMeasure = widget.spec.measures[0];
  const value = formatCount(row?.[`${firstMeasure?.metric}__${firstMeasure?.agg}`]);

  return { value };
}
```

`kpi_median_days` shows a bare number, like the prototype ("8"). The label already says "days", so the `insights.kpi.days` key goes.

**Remove:** every `required_pass`, `required_total`, `required_passed` and `passed_all_required` reference, and `kpi_required_pass_rate`.

### 6.4 `api/learners.svelte.ts`

- **Numbered pages instead of "Show more"** (0.3). The table shows one page of `INSIGHTS_LIMITS.learnersPageSize` (10) learners at a time, through the app's `TablePagination`. Remove `loadMore`, `hasMore` and `loadingMore`. Add `page`, `pageCount` and `goToPage`. `refreshVisible` (the 30-second poll) re-reads the current page quietly: no dimming and no error state, and if learners left so that the page no longer exists, it moves to the last one. Filters, sort, search, a course change and the first load all go back to page 1.
- **Measures.** Add `{ metric: 'now_at_title', agg: 'value' }` to `LEARNER_MEASURES`. The query returns it per learner when a course is picked; under All courses, learners with several courses get `null` and the column is hidden anyway.
- **Attempted counts per exercise.** The table hides a locked exercise that nobody has attempted. It used to read those counts from the `scores_by_exercise` widget, which the course page no longer has (5.1), so the learners API loads them itself, with one small query per load:

```ts
  attemptedResult = $state<InsightsResult | null>(null);

  #attemptedSpec(courseId: string): InsightsSpec {
    return {
      source: 'assessment_result',
      dimensions: ['exercise'],
      measures: [{ metric: 'is_attempted', agg: 'count_if' }],
      filters: [{ field: 'course', op: 'eq', value: courseId }],
      sort: [],
      limit: INSIGHTS_LIMITS.maxRows,
      page: 1,
      range: 'all'
    };
  }

  async #loadAttempted(seq: number) {
    const courseId = insightsApi.selection.courseId;
    if (!courseId) {
      this.attemptedResult = null;
      return;
    }

    const result = await this.#query(this.#attemptedSpec(courseId));
    if (seq !== this.#seq) return;

    this.attemptedResult = result;
  }
```

- **Reset.** `reset()` also sets `attemptedResult = null`.
- **Range.** `InsightsSpec` is the parsed spec type, so `range` is required on every spec the client builds. `#learnerSpec` and `#exerciseSpec` add `range: 'all'`, like the two specs above. The learners table is a standing card (2.5).
- **Preselect the first learner** after the first page lands (C6):

```ts
  page = $state(1);

  get pageCount(): number {
    return Math.max(1, Math.ceil(this.total / INSIGHTS_LIMITS.learnersPageSize));
  }

  async load() {
    this.page = 1;

    await this.#loadPage();
  }

  async goToPage(page: number) {
    if (page === this.page || page < 1 || page > this.pageCount) return;

    this.page = page;

    await this.#loadPage();
  }

  refreshVisible() {
    return this.#loadPage({ quiet: true });
  }

  async #loadPage(options: { quiet?: boolean } = {}) {
    this.#seq += 1;
    const seq = this.#seq;
    if (!options.quiet) {
      this.loadingPage = true;
      this.failed = false;
    }

    const result = await this.#query(this.#learnerSpec(this.page, INSIGHTS_LIMITS.learnersPageSize));
    if (seq !== this.#seq) return;

    this.loadingPage = false;
    this.hasLoaded = true;

    if (!result) {
      if (!options.quiet) this.failed = true;
      return;
    }

    this.total = result.total;
    if (this.page > this.pageCount) {
      this.page = this.pageCount;
      await this.#loadPage(options);
      return;
    }

    this.rows = result.rows;
    if (!options.quiet) this.cells = {};

    const firstLearner = toSelectedLearner(result.rows[0]);

    await Promise.all([
      this.#loadCells(result.rows, seq),
      this.#loadAttempted(seq),
      insightsApi.ensureLearnerSelected(firstLearner)
    ]);
  }
```

`#loadCells` now replaces the cells instead of merging them, since only one page is ever on screen: `this.cells = Object.assign({}, ...pivots);`. `reset()` also sets `page = 1`. The export is unchanged: it still exports every matching learner, not just the page.

### 6.5 Charts

**`charts/donut-chart.svelte`: total in the centre (C18), and the prototype's legend** with each segment's count and share.

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

  import { donutTotal, formatCount, formatPercent, percentOf } from '../../utils/insights-utils';
  import type { DonutSegment } from '../../utils/types';

  interface Props {
    segments: DonutSegment[];
    centerLabel: string;
  }

  let { segments, centerLabel }: Props = $props();

  const total = $derived(donutTotal(segments));
  const config = $derived(
    Object.fromEntries(
      segments.map((segment) => [segment.key, { label: segment.label, color: segment.color }])
    ) satisfies ChartConfig
  );
</script>

<div class="flex flex-col items-center gap-6 sm:flex-row">
  <div class="relative size-[180px] shrink-0">
    {#if browser}
      {#await loadChart()}
        <Skeleton class="size-[180px] rounded-full" />
      {:then Chart}
        <Chart.ChartContainer class="size-[180px]" {config}>
          <Chart.PieChart
            data={segments}
            key="key"
            label="label"
            value="value"
            c="color"
            innerRadius={0.62}
            padAngle={0.02}
          />
        </Chart.ChartContainer>
      {/await}
    {/if}
    <div class="pointer-events-none absolute inset-0 flex flex-col items-center justify-center" aria-hidden="true">
      <span class="text-2xl font-bold tabular-nums">{formatCount(total)}</span>
      <span class="ui:text-muted-foreground text-xs">{centerLabel}</span>
    </div>
  </div>
  <ul class="w-full flex-1 space-y-2 text-sm">
    {#each segments as segment (segment.key)}
      <li class="flex items-center gap-2">
        <span class="size-2.5 shrink-0 rounded-sm" style="background: {segment.color}" aria-hidden="true"></span>
        <span class="truncate">{segment.label}</span>
        <span class="ml-auto font-semibold tabular-nums">{formatCount(segment.value)}</span>
        <span class="ui:text-muted-foreground w-10 text-right text-xs tabular-nums">
          {formatPercent(percentOf(segment.value, total))}
        </span>
      </li>
    {/each}
  </ul>
</div>
```

Add to utils, and have every caller pass `centerLabel={$t('insights.donut.learners', { count: donutTotal(segments) })}`:

```ts
export function donutTotal(segments: readonly DonutSegment[]): number {
  return segments.reduce((sum, segment) => sum + segment.value, 0);
}
```

**`charts/line-chart.svelte`:** add an optional dashed target line and an explicit y maximum (O5).

```ts
  interface Props {
    points: InsightsChartPoint[];
    valueKey: string;
    label: string;
    color?: string;
    percent?: boolean;
    target?: { value: number; label: string } | null;
    yMax?: number | null;
  }

  let {
    points,
    valueKey,
    label,
    color = INSIGHTS_COLORS.primary,
    percent = false,
    target = null,
    yMax = null
  }: Props = $props();

  const TARGET_KEY = 'target';

  const labelByRank = $derived(new Map(points.map((point) => [point.rank, point.label])));
  const data = $derived(target ? points.map((point) => ({ ...point, [TARGET_KEY]: target.value })) : points);
  const series = $derived([
    {
      key: valueKey,
      label,
      color,
      props: { defined: (point: InsightsChartPoint) => typeof point[valueKey] === 'number' }
    },
    ...(target
      ? [{ key: TARGET_KEY, label: target.label, color: INSIGHTS_COLORS.neutral, props: { 'stroke-dasharray': '6 4' } }]
      : [])
  ]);
  const config = $derived(
    Object.fromEntries(series.map((entry) => [entry.key, { label: entry.label, color: entry.color }])) satisfies ChartConfig
  );
  const yDomain = $derived(percent ? [0, 100] : yMax ? [0, yMax] : undefined);
  const ticks = $derived(points.map((point) => point.rank));
```

Pass `data={data}` to `Chart.LineChart`. Layerchart spreads each series' `props` onto the SVG path, so `stroke-dasharray` reaches it.

**`charts/multi-line-chart.svelte`:** dashed series, and labels supplied by the caller (K3).

```ts
  interface Props {
    points: InsightsChartPoint[];
    seriesKeys: Array<{ key: string; label: string; dashed?: boolean }>;
  }

  // …
  const series = $derived(
    seriesKeys.map((entry, index) => {
      const color = SERIES_COLORS[index % SERIES_COLORS.length];
      const dash = entry.dashed ? { 'stroke-dasharray': '6 4' } : {};

      return {
        key: entry.key,
        label: entry.label,
        color,
        props: { ...dash, defined: (point: InsightsChartPoint) => typeof point[entry.key] === 'number' }
      };
    })
  );
```

**`charts/line-band-chart.svelte`:** a compare mode for "{name}: scores by exercise" (C7). The learner line is solid primary, and the cohort average is neutral and dashed.

```ts
  interface Props {
    points: InsightsChartPoint[];
    keys: { average: string; low?: string; high?: string; overlay?: string };
    labels: { average: string; band?: string; overlay?: string };
  }

  // …
  const isCompare = $derived(Boolean(keys.overlay));
  const averageColor = $derived(isCompare ? INSIGHTS_COLORS.neutral : INSIGHTS_COLORS.primary);
  const averageLine = $derived(isCompare ? { strokeWidth: 2, 'stroke-dasharray': '6 4' } : { strokeWidth: 2 });

  // in `series`: the overlay entry first (legend order: learner, then cohort average)
    ...(keys.overlay
      ? [
          {
            key: 'overlay',
            label: labels.overlay ?? '',
            value: keys.overlay,
            color: INSIGHTS_COLORS.primary,
            props: { fillOpacity: 0, line: { strokeWidth: 2.5 }, defined: isDefined(keys.overlay) }
          }
        ]
      : []),
    {
      key: 'average',
      label: labels.average,
      value: keys.average,
      color: averageColor,
      props: { fillOpacity: 0, line: averageLine, defined: isDefined(keys.average) }
    }
```

**`charts/grouped-bar-chart.svelte`:** truncate long x labels the way the line charts already do: `format: (key: string) => truncateLabel(labelByKey.get(key) ?? key)`. Leave the tooltip with the full label.

### 6.6 Scope chips: `components/insights-scope-chips.svelte` (new)

The prototype puts the scope's facts in chips under the page title (C2, K1, O1). This replaces the subtitle and `UpdatedAgo`.

```svelte
<script lang="ts">
  import { onMount } from 'svelte';
  import { t } from '$lib/utils/functions/translations';
  import { studentUsage } from '$lib/utils/store/org';

  import { insightsApi } from '../api';
  import { CHIP_CLASS, formatCount, formatUpdatedAgo } from '../utils/insights-utils';

  interface Props {
    showInterval?: boolean;
  }

  let { showInterval = false }: Props = $props();

  let now = $state(Date.now());

  onMount(() => {
    const timer = setInterval(() => (now = Date.now()), 1000);

    return () => clearInterval(timer);
  });

  const summary = $derived(insightsApi.dashboard?.scope ?? null);
  const updatedLabel = $derived(formatUpdatedAgo(insightsApi.generatedAt, now, $t));
  const intervalSeconds = $derived(insightsApi.dashboard?.refreshIntervalSeconds ?? 0);
</script>

{#if summary}
  <ul class="flex flex-wrap items-center gap-2" aria-label={$t('insights.chips.label')}>
    {#if updatedLabel}
      <li class="{CHIP_CLASS} flex items-center gap-1.5">
        <span class="size-2 rounded-full bg-emerald-500" aria-hidden="true"></span>
        {showInterval
          ? $t('insights.chips.live_every', { updated: updatedLabel, seconds: intervalSeconds })
          : $t('insights.chips.live', { updated: updatedLabel })}
      </li>
    {/if}
    <li class={CHIP_CLASS}>
      <span class="font-semibold">{summary.name}</span>
      {#if summary.type === 'cohort' && summary.description}
        · {summary.description}
      {/if}
    </li>
    {#if summary.type === 'org'}
      <li class={CHIP_CLASS}>
        {$t('insights.chips.active_cohorts', { count: summary.activeCohortCount })}
      </li>
      {#if $studentUsage?.limit}
        <li class={CHIP_CLASS}>
          {$t('insights.chips.seats', { used: formatCount($studentUsage.used), limit: formatCount($studentUsage.limit) })}
        </li>
      {/if}
    {:else}
      {#if summary.type === 'course'}
        <li class={CHIP_CLASS}>
          {$t('insights.chips.cohorts', { count: summary.cohortCount })}
        </li>
      {/if}
      <li class={CHIP_CLASS}>
        {$t('insights.chips.learners', { count: summary.learnerCount })}
      </li>
      {#if summary.type === 'cohort'}
        <li class={CHIP_CLASS}>
          {$t('insights.chips.courses', { count: summary.courses.length })}
        </li>
      {/if}
    {/if}
  </ul>
{/if}
```

`formatUpdatedAgo` keeps its keys but changes their copy to the chip wording ("updated 12s ago", "updated 3 min ago"). Delete `components/updated-ago.svelte`.

The prototype's course view shows "Range: last 30 days" as a chip and has no live chip. Here the range is the header picker on every scope (6.14), so it isn't repeated as a chip. The course numbers refresh every 30 seconds like the others, so the course page shows the live chip too.

### 6.7 Titles and notes

**Title variables (S2).** `{name}` is the selected learner, `{course}` the picked course, and `{exercise}` the picked exercise.

```ts
export function widgetTitleVars(
  dashboard: InsightsDashboard,
  selection: InsightsSelection,
  learnerName: string | null,
  translate: Translate
): InsightsTitleVars {
  const course = focusCourse(dashboard, selection);
  const structure = course ? dashboard.structures[course.id] : undefined;
  const exercise = structure?.items.find((item) => item.id === selection.exerciseId);

  return {
    name: learnerName || translate('insights.legend.learner'),
    course: course?.title ?? '',
    exercise: exercise?.title ?? ''
  };
}
```

`InsightsWidget` renders `$t(widget.titleKey, titleVars)`.

**Notes (C19).** Each note is the prototype's customer-mode text. Some are fixed; some depend on the scope, the picker mode or the result:

```ts
const STATIC_NOTE_KEYS: Record<string, string> = {
  score_distribution: 'insights.notes.score_distribution',
  score_distribution_course: 'insights.notes.score_distribution',
  course_details: 'insights.notes.course_details',
  learner_courses: 'insights.notes.learner_courses',
  learner_progression: 'insights.notes.learner_progression',
  section_scorecard: 'insights.notes.section_scorecard',
  overdue: 'insights.notes.overdue',
  hardest_questions: 'insights.notes.hardest_questions',
  logins_per_day_course: 'insights.notes.logins_per_day'
};

const FIRST_TRY_KEYS = ['first_try_pass__pooled', 'passed_first_try__rate'];

function hasNoFirstTryData(result: InsightsResult | null): boolean {
  const firstTryKey = result?.columns.find((column) => FIRST_TRY_KEYS.includes(column.key))?.key;
  if (!result || !firstTryKey || result.rows.length === 0) return false;

  return result.rows.every((row) => row[firstTryKey] === null);
}

function learnersNoteKey(context: InsightsWidgetContext): string {
  if (context.scopeType === 'course') return 'insights.notes.learners.course_scope';

  return context.courseSelected ? 'insights.notes.learners.one_course' : 'insights.notes.learners.all_courses';
}

/**
 * The notes under a widget, in the prototype's customer wording. Empty when the prototype shows none.
 */
export function widgetNotes(
  widget: InsightsWidget,
  result: InsightsResult | null,
  context: InsightsWidgetContext,
  translate: Translate
): string[] {
  const notes: string[] = [];
  const staticKey = STATIC_NOTE_KEYS[widget.id];
  const shown = result?.rows.length ?? 0;

  if (staticKey) notes.push(translate(staticKey));

  if (widget.id === 'needs_attention' && context.scopeType !== 'org') {
    notes.push(translate('insights.notes.needs_attention'));
  }

  if (widget.id === 'logins_per_day' && context.scopeType === 'cohort') {
    notes.push(translate('insights.notes.logins_per_day'));
  }

  if (widget.id === 'learners') notes.push(translate(learnersNoteKey(context)));

  if (widget.id === 'cohorts_in_course' && shown > 0) {
    const chartedCount = Math.min(shown, INSIGHTS_LIMITS.comparedCohorts);
    notes.push(translate('insights.notes.cohorts_shown', { shown: chartedCount, total: context.cohortCount }));
  }

  if (widget.id === 'cohorts_at_a_glance' && shown > 0) {
    notes.push(translate('insights.notes.cohorts_at_a_glance', { shown, total: context.cohortCount }));
  }

  if ((widget.id === 'cohort_health' || widget.id === 'avg_score_by_cohort') && shown > 0) {
    notes.push(translate('insights.notes.cohorts_in_table', { count: shown }));
  }

  if (widget.id === 'lesson_dropoff' && result) {
    const drop = steepestDrop(toHbarItems(result, 'lesson', translate));
    if (drop) notes.push(translate('insights.notes.lesson_dropoff', drop));
  }

  if (hasNoFirstTryData(result)) notes.push(translate('insights.notes.no_pass_mark'));

  return notes;
}
```

**`components/insights-widget.svelte`** renders titles, notes, the overdue empty state, and a skeleton while the first learner is being picked:

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

  import { insightsApi, insightsLearnersApi } from '../api';
  import {
    EMPTY_TITLE_KEYS,
    isNowCard,
    missingSelection,
    SELF_LOADING_WIDGET_IDS,
    WIDGET_SPAN_CLASS,
    widgetNotes,
    widgetTitleVars
  } from '../utils/insights-utils';
  import type { InsightsWidget, InsightsWidgetContext } from '../utils/types';
  import LearnersTable from './learners/learners-table.svelte';
  import NowTag from './now-tag.svelte';
  import WidgetSkeleton from './widget-skeleton.svelte';
  import { rendererFor } from './widgets';

  interface Props {
    widget: InsightsWidget;
    span: number;
    context: InsightsWidgetContext;
  }

  let { widget, span, context }: Props = $props();

  const state = $derived(insightsApi.widgetState(widget.id));
  const isSelfLoading = $derived(SELF_LOADING_WIDGET_IDS.has(widget.id));
  const missing = $derived(isSelfLoading ? null : missingSelection(widget, insightsApi.selection));
  const isPickingLearner = $derived(missing === 'learner' && !insightsLearnersApi.hasLoaded);
  const Renderer = $derived(rendererFor(widget));
  const titleVars = $derived(
    insightsApi.dashboard
      ? widgetTitleVars(insightsApi.dashboard, insightsApi.selection, insightsApi.selectedLearner?.name ?? null, $t)
      : undefined
  );
  const notes = $derived(widgetNotes(widget, state.result, context, $t));
  const emptyTitleKey = $derived(EMPTY_TITLE_KEYS[widget.id] ?? 'insights.empty.no_data');
  const spanClass = $derived(WIDGET_SPAN_CLASS[span] ?? 'lg:col-span-12');
  const showNowTag = $derived(isNowCard(widget, insightsApi.selection.range));
</script>

{#snippet nowTag()}
  <NowTag />
{/snippet}

<AnalyticsPanelCard
  title={$t(widget.titleKey, titleVars)}
  class={cn('col-span-1 min-w-0', spanClass)}
  action={showNowTag ? nowTag : undefined}
>
  {#if isSelfLoading}
    <LearnersTable />
  {:else if isPickingLearner}
    <WidgetSkeleton viz={widget.viz} />
  {:else if missing}
    <Empty icon={MousePointerClickIcon} title={$t(`insights.hints.${widget.id}`)} class="h-[240px]" />
  {:else if state.failed && !state.result}
    <Empty icon={CircleAlertIcon} title={$t('insights.empty.failed')} class="h-[240px]">
      <Button variant="outline" size="sm" onclick={() => insightsApi.runWidget(widget)}>{$t('insights.retry')}</Button>
    </Empty>
  {:else if !state.result}
    <WidgetSkeleton viz={widget.viz} />
  {:else if state.result.rows.length === 0}
    <Empty icon={ChartNoAxesColumnIcon} title={$t(emptyTitleKey)} class="h-[240px]" />
  {:else}
    <div class={cn('transition-opacity duration-200', state.loading && 'opacity-60')} aria-busy={state.loading}>
      <Renderer {widget} result={state.result} />
    </div>
  {/if}
  {#each notes as note (note)}
    <p class="ui:text-muted-foreground mt-3 text-xs">{note}</p>
  {/each}
</AnalyticsPanelCard>
```

```ts
export const EMPTY_TITLE_KEYS: Record<string, string> = {
  overdue: 'insights.empty.no_overdue',
  cohorts_at_a_glance: 'insights.empty.no_cohorts',
  cohorts_in_course: 'insights.empty.no_cohorts',
  cohort_details: 'insights.empty.no_cohorts',
  cohort_health: 'insights.empty.no_cohorts',
  avg_score_by_cohort: 'insights.empty.no_cohorts'
};
```

Drop `descriptionKey` handling from the component: no preset sets it, and notes replace it. `widget-skeleton.svelte` is unchanged.

**`components/insights-dashboard.svelte`** builds the context once and passes it down. The KPI row gets `courseSelected`:

```svelte
  const context = $derived<InsightsWidgetContext>({
    scopeType: scope.type,
    courseSelected: Boolean(insightsApi.selection.courseId),
    cohortCount: insightsApi.dashboard?.scope.cohortCount ?? 0,
    learnerCount: insightsApi.dashboard?.scope.learnerCount ?? 0
  });

  <!-- … -->
  <InsightsKpiRow widgets={kpiWidgets} courseSelected={context.courseSelected} />
  <!-- … -->
  <InsightsWidget {widget} span={panelSpans.get(widget.id) ?? widget.span} {context} />
```

`insights-kpi-row.svelte`:

```svelte
<script lang="ts">
  import { INSIGHTS_RANGE_DAYS } from '@cio/utils/constants/insights';
  import { KpiCard } from '$features/ui';
  import { t } from '$lib/utils/functions/translations';

  import { insightsApi } from '../api';
  import { formatKpi, isNowCard } from '../utils/insights-utils';
  import type { InsightsWidget } from '../utils/types';
  import NowTag from './now-tag.svelte';

  interface Props {
    widgets: InsightsWidget[];
    courseSelected: boolean;
  }

  let { widgets, courseSelected }: Props = $props();

  const gridClass = $derived(widgets.length === 4 ? 'xl:grid-cols-4' : 'xl:grid-cols-5');
  const range = $derived(insightsApi.selection.range);
  const rangeDays = $derived(INSIGHTS_RANGE_DAYS[range]);
</script>

{#snippet nowTag()}
  <NowTag />
{/snippet}

<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 {gridClass}">
  {#each widgets as widget (widget.id)}
    {@const state = insightsApi.widgetState(widget.id)}
    {@const display = formatKpi(widget, state.result, $t, { courseSelected, rangeDays })}
    <KpiCard
      title={display.title ?? $t(widget.titleKey)}
      value={display.value}
      description={display.description}
      trend={display.trend}
      badge={isNowCard(widget, range) ? nowTag : undefined}
      loading={!state.result && !state.failed}
    />
  {/each}
</div>
```

### 6.8 Widget renderers (`components/widgets/`)

**Registry (`widgets/index.ts`).** Every prototype widget with its own layout gets a renderer. Generic charts keep the simple ones: status donuts, progress and score histograms, logins, hardest exercises, and courses by completion.

```ts
import type { Component } from 'svelte';

import type { InsightsWidget, WidgetRendererProps } from '../../utils/types';
import CohortDetails from './cohort-details.svelte';
import CohortHealth from './cohort-health.svelte';
import CohortScores from './cohort-scores.svelte';
import CohortsGlance from './cohorts-glance.svelte';
import ComparisonChart from './comparison-chart.svelte';
import CourseDetails from './course-details.svelte';
import ExerciseDistribution from './exercise-distribution.svelte';
import GenericChart from './generic-chart.svelte';
import GenericTable from './generic-table.svelte';
import HardestQuestions from './hardest-questions.svelte';
import LearnerCourses from './learner-courses.svelte';
import LearnerGrowth from './learner-growth.svelte';
import LearnerProgression from './learner-progression.svelte';
import LessonDropoff from './lesson-dropoff.svelte';
import NeedsAttention from './needs-attention.svelte';
import OverdueTable from './overdue-table.svelte';
import ScoresByCohort from './scores-by-cohort.svelte';
import ScoresByExercise from './scores-by-exercise.svelte';
import SectionScorecard from './section-scorecard.svelte';
import SectionScores from './section-scores.svelte';

const WIDGET_RENDERERS: Record<string, Component<WidgetRendererProps>> = {
  courses_summary: ComparisonChart,
  cohorts_in_course: ComparisonChart,
  course_details: CourseDetails,
  learner_courses: LearnerCourses,
  scores_by_exercise: ScoresByExercise,
  learner_progression: LearnerProgression,
  section_scores: SectionScores,
  section_scorecard: SectionScorecard,
  needs_attention: NeedsAttention,
  overdue: OverdueTable,
  hardest_questions: HardestQuestions,
  scores_by_exercise_by_cohort: ScoresByCohort,
  exercise_score_distribution: ExerciseDistribution,
  lesson_dropoff: LessonDropoff,
  cohort_details: CohortDetails,
  cohorts_at_a_glance: CohortsGlance,
  cohort_health: CohortHealth,
  avg_score_by_cohort: CohortScores,
  hiring_ramp: LearnerGrowth
};

export function rendererFor(widget: InsightsWidget): Component<WidgetRendererProps> {
  return WIDGET_RENDERERS[widget.id] ?? (widget.viz === 'table' ? GenericTable : GenericChart);
}
```

Delete `group-summary.svelte`: `comparison-chart.svelte` and the two details tables replace it.

#### 6.8.1 Shared cells (`components/`)

`heat-cell.svelte` is the prototype's `cell()`: a percentage on the 70/50 heat scale, or "–".

```svelte
<script lang="ts">
  import { cn } from '@cio/ui/tools';

  import { formatPercent, scoreTone, TONE_CELL_CLASS } from '../utils/insights-utils';
  import type { InsightsCell } from '../utils/types';

  interface Props {
    value: InsightsCell | undefined;
  }

  let { value }: Props = $props();

  const scorePct = $derived(typeof value === 'number' ? value : null);
</script>

<span
  class={cn(
    'inline-flex min-w-12 justify-center rounded-md px-2 py-1 text-xs font-medium tabular-nums',
    TONE_CELL_CLASS[scoreTone(scorePct)]
  )}
>
  {formatPercent(scorePct)}
</span>
```

`progress-cell.svelte` is the prototype's mini progress bar with its percentage:

```svelte
<script lang="ts">
  import { Progress } from '@cio/ui/base/progress';

  import { formatPercent } from '../utils/insights-utils';
  import type { InsightsCell } from '../utils/types';

  interface Props {
    value: InsightsCell | undefined;
  }

  let { value }: Props = $props();

  const progress = $derived(typeof value === 'number' ? Math.min(100, Math.max(0, value)) : 0);
</script>

<div class="flex min-w-[120px] items-center gap-2">
  <Progress value={progress} class="h-2 flex-1" />
  <span class="w-10 text-right text-xs tabular-nums">{formatPercent(value)}</span>
</div>
```

`insights-pill.svelte` is the prototype's tinted pill (ok, lag, risk, done):

```svelte
<script lang="ts">
  import { cn } from '@cio/ui/tools';
  import type { Snippet } from 'svelte';

  import type { InsightsPillTone } from '../utils/types';

  interface Props {
    tone: InsightsPillTone;
    children: Snippet;
  }

  let { tone, children }: Props = $props();

  const TONE_CLASS: Record<InsightsPillTone, string> = {
    ok: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400',
    lag: 'bg-amber-500/15 text-amber-700 dark:text-amber-400',
    risk: 'bg-rose-500/15 text-rose-700 dark:text-rose-400',
    done: 'ui:bg-primary/10 ui:text-primary'
  };
</script>

<span class={cn('inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap', TONE_CLASS[tone])}>
  {@render children()}
</span>
```

`status-badge.svelte` now renders the pill:

```svelte
<script lang="ts">
  import type { TInsightsStatus } from '@cio/utils/constants/insights';
  import { t } from '$lib/utils/functions/translations';

  import { STATUS_PILL_TONE } from '../utils/insights-utils';
  import InsightsPill from './insights-pill.svelte';

  interface Props {
    status: TInsightsStatus;
  }

  let { status }: Props = $props();
</script>

<InsightsPill tone={STATUS_PILL_TONE[status]}>{$t(`insights.status.${status}`)}</InsightsPill>
```

`column-header.svelte` is a header label with the section 1.4 tooltip, for every learner-result column:

```svelte
<script lang="ts">
  import InfoIcon from '@lucide/svelte/icons/info';
  import * as Tooltip from '@cio/ui/base/tooltip';

  interface Props {
    label: string;
    hint?: string;
  }

  let { label, hint }: Props = $props();
</script>

{#if hint}
  <Tooltip.Provider>
    <Tooltip.Root>
      <Tooltip.Trigger class="inline-flex items-center gap-1 whitespace-normal">
        {label}
        <InfoIcon class="size-3 shrink-0" aria-hidden="true" />
      </Tooltip.Trigger>
      <Tooltip.Content side="top" sideOffset={4} class="max-w-xs">{hint}</Tooltip.Content>
    </Tooltip.Root>
  </Tooltip.Provider>
{:else}
  <span class="whitespace-normal">{label}</span>
{/if}
```

`pass-mark-tag.svelte` replaces `pass-required-tag.svelte`. Same markup, with the copy `insights.pass_mark_tag` ("Pass mark {mark}%").

#### 6.8.2 Cohort, All courses

**`comparison-chart.svelte`** draws "Courses in this cohort" (C4) and "Cohorts taking this course" (K6): average progress, average score and Passed first try, side by side. At course scope it shows the 4 newest cohorts.

```svelte
<script lang="ts">
  import { INSIGHTS_LIMITS } from '@cio/utils/constants/insights';
  import { t } from '$lib/utils/functions/translations';

  import { SERIES_COLORS, toChartPoints } from '../../utils/insights-utils';
  import type { WidgetRendererProps } from '../../utils/types';
  import GroupedBarChart from '../charts/grouped-bar-chart.svelte';

  let { widget, result }: WidgetRendererProps = $props();

  const SERIES_BY_SOURCE: Record<string, readonly string[]> = {
    learner_course: ['progress_pct__avg', 'avg_score_pct__avg', 'first_try_pass__pooled'],
    cohort_summary: ['avg_progress_pct__value', 'avg_score_pct__value', 'first_try_pass__pooled']
  };

  const LIMIT_BY_SOURCE: Record<string, number> = { cohort_summary: INSIGHTS_LIMITS.comparedCohorts };

  const dimension = $derived(widget.spec.dimensions?.[0] ?? 'course');
  const limit = $derived(LIMIT_BY_SOURCE[widget.spec.source] ?? result.rows.length);
  const shownRows = $derived(result.rows.slice(0, limit));
  const points = $derived(toChartPoints({ ...result, rows: shownRows }, dimension, $t));
  const series = $derived(
    (SERIES_BY_SOURCE[widget.spec.source] ?? []).map((key, index) => ({
      key,
      label: $t(`insights.measures.${key}`),
      color: SERIES_COLORS[index % SERIES_COLORS.length]
    }))
  );
</script>

<GroupedBarChart {points} {series} percent />
```

**`course-details.svelte`** (C5) has the prototype's columns, with the section 1 names:

```svelte
<script lang="ts">
  import * as Table from '@cio/ui/base/table';
  import { t } from '$lib/utils/functions/translations';

  import { formatCount, textCell } from '../../utils/insights-utils';
  import type { WidgetRendererProps } from '../../utils/types';
  import ColumnHeader from '../column-header.svelte';
  import HeatCell from '../heat-cell.svelte';

  let { result }: WidgetRendererProps = $props();
</script>

<Table.Root>
  <Table.Header>
    <Table.Row>
      <Table.Head>{$t('insights.columns.course')}</Table.Head>
      <Table.Head class="text-center">{$t('insights.columns.learners')}</Table.Head>
      <Table.Head class="text-center">{$t('insights.columns.avg_progress')}</Table.Head>
      <Table.Head class="text-center">{$t('insights.columns.avg_score')}</Table.Head>
      <Table.Head class="text-center">{$t('insights.columns.completed')}</Table.Head>
      <Table.Head class="text-center">
        <ColumnHeader label={$t('insights.columns.took_pass_mark')} hint={$t('insights.column_hints.took_pass_mark')} />
      </Table.Head>
      <Table.Head class="text-center">
        <ColumnHeader
          label={$t('insights.columns.passed_first_try')}
          hint={$t('insights.column_hints.passed_first_try')}
        />
      </Table.Head>
    </Table.Row>
  </Table.Header>
  <Table.Body>
    {#each result.rows as row (row['course_id'])}
      <Table.Row>
        <Table.Cell class="font-medium">
          <div class="min-w-[160px] whitespace-normal">{textCell(row, 'course_label')}</div>
        </Table.Cell>
        <Table.Cell class="text-center tabular-nums">{formatCount(row['rows__count'])}</Table.Cell>
        <Table.Cell class="text-center"><HeatCell value={row['progress_pct__avg']} /></Table.Cell>
        <Table.Cell class="text-center"><HeatCell value={row['avg_score_pct__avg']} /></Table.Cell>
        <Table.Cell class="text-center tabular-nums">{formatCount(row['is_completed__count_if'])}</Table.Cell>
        <Table.Cell class="text-center tabular-nums">{formatCount(row['took_pass_mark__count_if'])}</Table.Cell>
        <Table.Cell class="text-center"><HeatCell value={row['first_try_pass__pooled']} /></Table.Cell>
      </Table.Row>
    {/each}
  </Table.Body>
</Table.Root>
```

**`learner-courses.svelte`** ("{name}: courses", C6):

```svelte
<script lang="ts">
  import * as Table from '@cio/ui/base/table';
  import { cn } from '@cio/ui/tools';
  import { t } from '$lib/utils/functions/translations';

  import {
    exercisesPassedTone,
    LEARNER_DETAIL_ELEMENT_ID,
    nowAtLabel,
    numberCell,
    textCell,
    TONE_CELL_CLASS
  } from '../../utils/insights-utils';
  import type { WidgetRendererProps } from '../../utils/types';
  import ColumnHeader from '../column-header.svelte';
  import HeatCell from '../heat-cell.svelte';
  import ProgressCell from '../progress-cell.svelte';

  let { result }: WidgetRendererProps = $props();
</script>

<div id={LEARNER_DETAIL_ELEMENT_ID} class="scroll-mt-24">
  <Table.Root>
    <Table.Header>
      <Table.Row>
        <Table.Head>{$t('insights.columns.course')}</Table.Head>
        <Table.Head class="w-[180px]">{$t('insights.columns.progress')}</Table.Head>
        <Table.Head>{$t('insights.columns.now_at')}</Table.Head>
        <Table.Head class="text-center">{$t('insights.columns.average_score')}</Table.Head>
        <Table.Head class="text-center">
          <ColumnHeader
            label={$t('insights.columns.exercises_passed')}
            hint={$t('insights.column_hints.exercises_passed')}
          />
        </Table.Head>
      </Table.Row>
    </Table.Header>
    <Table.Body>
      {#each result.rows as row (row['course_id'])}
        {@const progress = numberCell(row, 'progress_pct__value')}
        {@const passMarkExercises = numberCell(row, 'pass_mark_exercises__value') ?? 0}
        {@const passMarkPassed = numberCell(row, 'pass_mark_passed__value') ?? 0}
        {@const stillToPass = numberCell(row, 'still_to_pass__value') ?? 0}
        {@const passedTone = exercisesPassedTone(passMarkPassed, passMarkExercises, stillToPass)}
        <Table.Row>
          <Table.Cell class="font-medium">{textCell(row, 'course_label')}</Table.Cell>
          <Table.Cell><ProgressCell value={progress} /></Table.Cell>
          <Table.Cell class="ui:text-muted-foreground">
            {nowAtLabel(progress, textCell(row, 'now_at_title__value'), $t)}
          </Table.Cell>
          <Table.Cell class="text-center"><HeatCell value={row['avg_score_pct__value']} /></Table.Cell>
          <Table.Cell class="text-center">
            {#if passMarkExercises > 0}
              <span class={cn('rounded-md px-2 py-1 text-xs tabular-nums', TONE_CELL_CLASS[passedTone])}>
                {$t('insights.of_total', { count: passMarkPassed, total: passMarkExercises })}
              </span>
            {:else}
              <span class="ui:text-muted-foreground">–</span>
            {/if}
          </Table.Cell>
        </Table.Row>
      {/each}
    </Table.Body>
  </Table.Root>
</div>
```

Add to utils:

```ts
/**
 * "Now at" for a learner in a course: "Finished" once done, else the section (or item) they reached.
 */
export function nowAtLabel(progressPct: number | null, title: string | null, translate: Translate): string {
  if (progressPct !== null && progressPct >= 100) return translate('insights.finished');

  return title ?? '–';
}

/**
 * Green when every pass-mark exercise is passed, red while one is graded below its mark, muted otherwise.
 */
export function exercisesPassedTone(passed: number, total: number, stillToPass: number): InsightsTone {
  if (total > 0 && passed >= total) return 'success';

  return stillToPass > 0 ? 'danger' : 'muted';
}
```

**The status donut, and score and progress histograms (`generic-chart.svelte`):**

```svelte
{#if widget.viz === 'donut' && firstDimension}
  {@const segments = toDonutSegments(result, firstDimension, $t)}
  <DonutChart {segments} centerLabel={$t('insights.donut.learners', { count: donutTotal(segments) })} />
{:else if widget.viz === 'histogram' && firstDimension && firstMeasure}
  <ColumnChart
    points={histogramPoints(result, firstDimension, $t)}
    valueKey={firstMeasure.key}
    label={$t(`insights.measures.${firstMeasure.key}`)}
    color={INSIGHTS_COLORS.primary}
  />
{:else if widget.viz === 'hbar'}
  <!-- …unchanged -->
```

`exercise-distribution.svelte` switches from `toChartPoints` to `histogramPoints`, so learners with no graded attempt drop out.

**Dense columns become a line (2.5).** Last 30 and 90 days give the logins chart up to 90 points. In `generic-chart.svelte`, the line branch also takes a column chart with more than 31 points:

```ts
  const MAX_COLUMN_POINTS = 31;

  const drawsAsLine = $derived(
    widget.viz === 'line' || (widget.viz === 'column' && points.length > MAX_COLUMN_POINTS)
  );
```

```svelte
{:else if drawsAsLine && firstMeasure}
  <LineChart … />
```

#### 6.8.3 Cohort, one course picked

**`scores-by-exercise.svelte`:** the legend reads "Cohort average" and "Middle 50% of learners". Delete the inline note; customer mode shows none.

```svelte
<LineBandChart
  {points}
  keys={{ average: 'best_score_pct__avg', low: 'best_score_pct__p25', high: 'best_score_pct__p75' }}
  labels={{ average: $t('insights.legend.cohort_average'), band: $t('insights.legend.middle_half') }}
/>
```

**`learner-progression.svelte`** ("{name}: scores by exercise", C7) has the two chips, then the learner line against a dashed cohort average:

```svelte
<script lang="ts">
  import { t } from '$lib/utils/functions/translations';

  import { insightsApi } from '../../api';
  import {
    CHIP_CLASS,
    formatPercent,
    latestScore,
    LEARNER_DETAIL_ELEMENT_ID,
    nowAtLabel,
    numberCell,
    textCell,
    toChartPoints
  } from '../../utils/insights-utils';
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
  const learnerName = $derived(insightsApi.selectedLearner?.name || $t('insights.legend.learner'));
  const latest = $derived(latestScore(result));
  const courseRow = $derived(insightsApi.selectedLearnerCourse ?? undefined);
  const progress = $derived(numberCell(courseRow, 'progress_pct__value'));
  const nowAt = $derived(nowAtLabel(progress, textCell(courseRow, 'now_at_title__value'), $t));
</script>

<div id={LEARNER_DETAIL_ELEMENT_ID} class="scroll-mt-24 space-y-3">
  <ul class="flex flex-wrap gap-2">
    <li class={CHIP_CLASS}>
      {$t('insights.learner_chips.latest')} <b class="tabular-nums">{formatPercent(latest)}</b>
    </li>
    <li class={CHIP_CLASS}>
      {$t('insights.learner_chips.progress')} <b class="tabular-nums">{formatPercent(progress)}</b>
      · {$t('insights.learner_chips.now_at', { place: nowAt })}
    </li>
  </ul>
  <LineBandChart
    {points}
    keys={{ average: 'best_score_pct__avg', overlay: 'learner' }}
    labels={{ average: $t('insights.legend.cohort_average'), overlay: learnerName }}
  />
</div>
```

```ts
export function latestScore(result: InsightsResult): number | null {
  const scores = result.rows
    .map((row) => numberCell(row, 'best_score_pct__value'))
    .filter((score): score is number => score !== null);

  return scores.at(-1) ?? null;
}
```

**`section-scores.svelte`** ("Scores and attendance by section", C9), with "Section N" on the axis:

```svelte
<script lang="ts">
  import { t } from '$lib/utils/functions/translations';

  import { insightsApi } from '../../api';
  import { focusStructure, SERIES_COLORS, sectionLabel, toChartPoints } from '../../utils/insights-utils';
  import type { WidgetRendererProps } from '../../utils/types';
  import GroupedBarChart from '../charts/grouped-bar-chart.svelte';

  let { result }: WidgetRendererProps = $props();

  const SERIES_KEYS = ['section_score_pct__avg', 'video_pct__avg', 'attendance__pooled'] as const;

  const structure = $derived(focusStructure(insightsApi.dashboard, insightsApi.selection));
  const points = $derived(
    toChartPoints(result, 'section', $t).map((point) => {
      const label = sectionLabel(point.key, structure, $t, { withTitle: false });

      return { ...point, label };
    })
  );
  const series = $derived(
    SERIES_KEYS.map((key, index) => ({ key, label: $t(`insights.measures.${key}`), color: SERIES_COLORS[index] }))
  );
</script>

<GroupedBarChart {points} {series} percent />
```

```ts
export function focusStructure(
  dashboard: InsightsDashboard | null,
  selection: InsightsSelection
): InsightsCourseStructure | undefined {
  if (!dashboard) return undefined;

  const course = focusCourse(dashboard, selection);

  return course ? dashboard.structures[course.id] : undefined;
}
```

**`section-scorecard.svelte`** (C10) has rows "Section N · {title}", "n / N" exercises taken, and heat cells:

```svelte
<script lang="ts">
  import * as Table from '@cio/ui/base/table';
  import { t } from '$lib/utils/functions/translations';

  import { insightsApi } from '../../api';
  import { focusStructure, formatCount, formatPercent, numberCell, sectionLabel } from '../../utils/insights-utils';
  import type { WidgetRendererProps } from '../../utils/types';
  import ColumnHeader from '../column-header.svelte';
  import HeatCell from '../heat-cell.svelte';

  let { result }: WidgetRendererProps = $props();

  const structure = $derived(focusStructure(insightsApi.dashboard, insightsApi.selection));
</script>

<Table.Root>
  <Table.Header>
    <Table.Row>
      <Table.Head>{$t('insights.columns.section')}</Table.Head>
      <Table.Head class="text-center">{$t('insights.columns.exercises_taken')}</Table.Head>
      <Table.Head class="text-center">{$t('insights.columns.avg_score')}</Table.Head>
      <Table.Head class="text-center">
        <ColumnHeader
          label={$t('insights.columns.passed_first_try')}
          hint={$t('insights.column_hints.section_passed_first_try')}
        />
      </Table.Head>
      <Table.Head class="text-center">{$t('insights.columns.video_attendance')}</Table.Head>
      <Table.Head class="text-center">{$t('insights.columns.classroom_attendance')}</Table.Head>
    </Table.Row>
  </Table.Header>
  <Table.Body>
    {#each result.rows as row, index (row['section_id'] ?? `none-${index}`)}
      {@const tookAll = numberCell(row, 'took_all__count_if') ?? 0}
      <Table.Row>
        <Table.Cell class="font-medium">
          <div class="min-w-[180px] whitespace-normal">
            {sectionLabel(row['section_id'], structure, $t, { withTitle: true })}
          </div>
        </Table.Cell>
        <Table.Cell class="text-center tabular-nums">
          {tookAll > 0 ? `${formatCount(tookAll)} / ${formatCount(row['rows__count'])}` : '–'}
        </Table.Cell>
        <Table.Cell class="text-center"><HeatCell value={row['section_score_pct__avg']} /></Table.Cell>
        <Table.Cell class="text-center"><HeatCell value={row['passed_first_try__rate']} /></Table.Cell>
        <Table.Cell class="text-center tabular-nums">{formatPercent(row['video_pct__avg'])}</Table.Cell>
        <Table.Cell class="text-center tabular-nums">{formatPercent(row['attendance__pooled'])}</Table.Cell>
      </Table.Row>
    {/each}
  </Table.Body>
</Table.Root>
```

**`hardest-questions.svelte`** (C13): the hint reads "{section} · most common wrong answer: X". Delete the inline note; it comes from `widgetNotes`.

```ts
  const items = $derived(
    result.rows.map((row, index): HbarItem => {
      const key = String(row['question_id'] ?? index);
      const label = textCell(row, 'question_label') ?? '';
      const value = numberCell(row, 'correct_pct__avg');
      const context = textCell(row, 'question_context__value');
      const wrongAnswer = textCell(row, 'wrong_answer__mode');
      const hint = questionHint(context, wrongAnswer, $t);

      return { key, label, value, display: formatPercent(value), hint, tone: correctnessTone(value) };
    })
  );
```

```ts
export function questionHint(context: string | null, wrongAnswer: string | null, translate: Translate): string | undefined {
  if (context && wrongAnswer) {
    return translate('insights.question_hint.context_and_answer', { context, answer: wrongAnswer });
  }

  if (wrongAnswer) return translate('insights.question_hint.answer', { answer: wrongAnswer });

  return context ?? undefined;
}
```

#### 6.8.4 Cohort, both modes

**`needs-attention.svelte`** (C11): fixed reason order and tones. Bars scale to the scope's learner count, so a bar's length reads as a share of everyone.

```svelte
<script lang="ts">
  import { t } from '$lib/utils/functions/translations';

  import { insightsApi } from '../../api';
  import { formatCount, numberCell } from '../../utils/insights-utils';
  import type { HbarItem, WidgetRendererProps } from '../../utils/types';
  import HbarList from '../charts/hbar-list.svelte';

  let { result }: WidgetRendererProps = $props();

  const REASONS: ReadonlyArray<{ key: string; tone: HbarItem['tone'] }> = [
    { key: 'is_inactive__count_if', tone: 'danger' },
    { key: 'is_low_score__count_if', tone: 'danger' },
    { key: 'is_overdue__count_if', tone: 'warning' },
    { key: 'is_low_video__count_if', tone: 'warning' }
  ];

  const row = $derived(result.rows[0]);
  const items = $derived(
    REASONS.map(({ key, tone }): HbarItem => {
      const value = numberCell(row, key);
      const label = $t(`insights.measures.${key}`);

      return { key, label, value, display: formatCount(value), tone };
    })
  );
  const max = $derived(Math.max(1, insightsApi.dashboard?.scope.learnerCount ?? 0));
</script>

<HbarList {items} {max} />
```

**`overdue-table.svelte`** (C12) has one row per learner, a per-learner reminder, "Remind all {n} overdue learners", and "Queued" states. Only learners with an overdue cohort goal can be reminded, because goals are what send reminder emails. Other rows (an exercise past its due date) show no button.

```svelte
<script lang="ts">
  import { SvelteSet } from 'svelte/reactivity';
  import { Button } from '@cio/ui/base/button';
  import * as Table from '@cio/ui/base/table';
  import { formatLastSeen } from '$features/audience/utils/audience-utils';
  import { cohortGoalApi } from '$features/cohort/api';
  import { t } from '$lib/utils/functions/translations';

  import { insightsApi } from '../../api';
  import { numberCell, textCell } from '../../utils/insights-utils';
  import type { WidgetRendererProps } from '../../utils/types';
  import ProgressCell from '../progress-cell.svelte';

  let { result }: WidgetRendererProps = $props();

  const queuedLearnerIds = new SvelteSet<string>();
  const sendingLearnerIds = new SvelteSet<string>();
  let queuedAllFor = $state<string | null>(null);
  let isRemindingAll = $state(false);

  const cohortId = $derived(insightsApi.scope?.type === 'cohort' ? insightsApi.scope.id : null);
  const courseKey = $derived(insightsApi.selection.courseId ?? 'all');
  const isAllQueued = $derived(queuedAllFor === courseKey);
  const overdueKpiRow = $derived(insightsApi.widgetResult('kpi_overdue')?.rows[0]);
  const remindableCount = $derived(numberCell(overdueKpiRow, 'has_overdue_goal__count_if') ?? 0);

  function isQueued(learnerId: string): boolean {
    return isAllQueued || queuedLearnerIds.has(learnerId);
  }

  async function remind(learnerId: string) {
    if (!cohortId || sendingLearnerIds.has(learnerId) || isQueued(learnerId)) return;

    sendingLearnerIds.add(learnerId);
    const courseId = insightsApi.selection.courseId;
    const enqueued = await cohortGoalApi.remindOverdue(cohortId, { courseId, profileId: learnerId });
    sendingLearnerIds.delete(learnerId);

    if (enqueued > 0) queuedLearnerIds.add(learnerId);
  }

  async function remindAll() {
    if (!cohortId || isRemindingAll || isAllQueued) return;

    isRemindingAll = true;
    const courseId = insightsApi.selection.courseId;
    const enqueued = await cohortGoalApi.remindOverdue(cohortId, { courseId });
    isRemindingAll = false;

    if (enqueued > 0) queuedAllFor = courseKey;
  }
</script>

<Table.Root>
  <Table.Header>
    <Table.Row>
      <Table.Head>{$t('insights.columns.learner')}</Table.Head>
      <Table.Head>{$t('insights.columns.course')}</Table.Head>
      <Table.Head>{$t('insights.columns.progress')}</Table.Head>
      <Table.Head>{$t('insights.columns.last_login')}</Table.Head>
      {#if cohortId}
        <Table.Head class="w-[1%]"><span class="sr-only">{$t('insights.columns.actions')}</span></Table.Head>
      {/if}
    </Table.Row>
  </Table.Header>
  <Table.Body>
    {#each result.rows as row (row['learner_id'])}
      {@const learnerId = textCell(row, 'learner_id') ?? ''}
      {@const lastLoginAt = textCell(row, 'last_login_at__value')}
      {@const isSending = sendingLearnerIds.has(learnerId)}
      <Table.Row>
        <Table.Cell class="font-medium">{textCell(row, 'name__value')}</Table.Cell>
        <Table.Cell>
          <div class="flex min-w-[160px] flex-col whitespace-normal">
            <span>{textCell(row, 'course_titles__value') ?? '–'}</span>
            <span class="ui:text-muted-foreground text-xs">{textCell(row, 'item_titles__value') ?? ''}</span>
          </div>
        </Table.Cell>
        <Table.Cell><ProgressCell value={row['course_progress_pct__value']} /></Table.Cell>
        <Table.Cell class="ui:text-muted-foreground text-xs whitespace-nowrap">
          {lastLoginAt ? formatLastSeen(lastLoginAt) : $t('insights.never')}
        </Table.Cell>
        {#if cohortId}
          <Table.Cell>
            {#if row['has_goal__value'] === true}
              <Button
                type="button"
                variant="outline"
                size="sm"
                loading={isSending}
                disabled={isSending || isQueued(learnerId)}
                onclick={() => remind(learnerId)}
              >
                {isQueued(learnerId) ? $t('insights.actions.queued') : $t('insights.actions.send_reminder')}
              </Button>
            {/if}
          </Table.Cell>
        {/if}
      </Table.Row>
    {/each}
  </Table.Body>
</Table.Root>

{#if cohortId && remindableCount > 0}
  <div class="mt-4 flex">
    <Button
      type="button"
      size="sm"
      loading={isRemindingAll}
      disabled={isRemindingAll || isAllQueued}
      onclick={remindAll}
      testId="insights-remind-all"
    >
      {isAllQueued
        ? $t('insights.actions.reminders_queued')
        : $t('insights.actions.remind_all_overdue', { count: remindableCount })}
    </Button>
  </div>
{/if}
```

**`apps/dashboard/src/lib/features/cohort/api/goal.svelte.ts`:** delete `remindAssignment` and the `RemindGoalAssignmentRequest` type, and replace `remindOverdue`:

```ts
  /**
   * Emails overdue learners on the cohort's active goals now: everyone, one course's goals, or one learner.
   * Returns how many reminders were queued.
   */
  async remindOverdue(cohortId: string, target: { courseId?: string | null; profileId?: string }): Promise<number> {
    const toastId = snackbar.loading(t.get('snackbar.insights.reminders_sending'));
    const courseId = target.courseId ?? undefined;

    const response = await this.execute<RemindOverdueGoalsRequest>({
      requestFn: () =>
        classroomio.cohort[':cohortId']['goal-assignments']['remind-overdue'].$post({
          param: { cohortId },
          json: { courseId, profileId: target.profileId }
        }),
      logContext: 'sending overdue cohort goal reminders',
      onSuccess: (result) => {
        const enqueued = result.data.enqueued;
        if (enqueued === 0) {
          snackbar.info('snackbar.insights.reminder_not_sent', toastId);
          return;
        }

        snackbar.success(t.get('snackbar.insights.reminders_sent', { count: enqueued }), toastId);
      },
      onError: () => snackbar.error('snackbar.insights.reminder_failed', toastId)
    });

    return response?.data.enqueued ?? 0;
  }
```

#### 6.8.5 Course

**`scores-by-cohort.svelte`** ("Scores by exercise, one line per cohort", K3) charts the 3 newest cohorts. A cohort with unfinished learners is dashed and labelled "(in progress)". A course with no cohorts shows one "All learners" line.

```svelte
<script lang="ts">
  import { t } from '$lib/utils/functions/translations';

  import { insightsApi } from '../../api';
  import { chartedCohorts, toSeriesPoints } from '../../utils/insights-utils';
  import type { WidgetRendererProps } from '../../utils/types';
  import MultiLineChart from '../charts/multi-line-chart.svelte';

  let { result }: WidgetRendererProps = $props();

  const lines = $derived(toSeriesPoints(result, 'exercise', 'cohort', 'best_score_pct__avg', $t));
  const cohorts = $derived(insightsApi.widgetResult('cohorts_in_course'));
  const seriesKeys = $derived(chartedCohorts(lines.seriesKeys, cohorts, $t));
</script>

<MultiLineChart points={lines.points} {seriesKeys} />
```

```ts
const NO_COHORT_SERIES_KEY = 'none';

/**
 * The newest cohorts to chart, newest first, dashed and marked "(in progress)" while some learners haven't finished.
 * A course with no cohorts charts all its learners as one line.
 */
export function chartedCohorts(
  seriesKeys: ReadonlyArray<{ key: string; label: string }>,
  cohorts: InsightsResult | null,
  translate: Translate
): Array<{ key: string; label: string; dashed: boolean }> {
  const cohortSeries = seriesKeys.filter((entry) => entry.key !== NO_COHORT_SERIES_KEY);
  if (cohortSeries.length === 0) return seriesKeys.map((entry) => ({ ...entry, dashed: false }));

  if (!cohorts) {
    return cohortSeries.slice(0, INSIGHTS_LIMITS.chartedCohorts).map((entry) => ({ ...entry, dashed: false }));
  }

  const seriesById = new Map(cohortSeries.map((entry) => [entry.key, entry]));
  const charted = cohorts.rows.flatMap((row) => {
    const entry = seriesById.get(textCell(row, 'cohort_id') ?? '');
    if (!entry) return [];

    const learners = numberCell(row, 'learners__value') ?? 0;
    const completed = numberCell(row, 'completed_learners__value') ?? 0;
    const isInProgress = completed < learners;
    const label = isInProgress ? translate('insights.legend.in_progress', { name: entry.label }) : entry.label;

    return [{ key: entry.key, label, dashed: isInProgress }];
  });

  return charted.slice(0, INSIGHTS_LIMITS.chartedCohorts);
}
```

`toSeriesPoints` already keys a null cohort as `'none'`. Use `NO_COHORT_SERIES_KEY` there too, instead of the literal.

**`lesson-dropoff.svelte`** (K4) is toned bars. The "steepest fall" note comes from `widgetNotes`.

```svelte
<script lang="ts">
  import { t } from '$lib/utils/functions/translations';

  import { dropoffTone, toHbarItems } from '../../utils/insights-utils';
  import type { WidgetRendererProps } from '../../utils/types';
  import HbarList from '../charts/hbar-list.svelte';

  let { result }: WidgetRendererProps = $props();

  const items = $derived(toHbarItems(result, 'lesson', $t).map((item) => ({ ...item, tone: dropoffTone(item.value) })));
</script>

<HbarList {items} />
```

**`cohort-details.svelte`** ("Cohort details", K6) lists every cohort that takes the course, newest first:

```svelte
<script lang="ts">
  import * as Table from '@cio/ui/base/table';
  import { t } from '$lib/utils/functions/translations';

  import { dimensionLabel, formatCount } from '../../utils/insights-utils';
  import type { WidgetRendererProps } from '../../utils/types';
  import ColumnHeader from '../column-header.svelte';
  import HeatCell from '../heat-cell.svelte';

  let { result }: WidgetRendererProps = $props();
</script>

<Table.Root>
  <Table.Header>
    <Table.Row>
      <Table.Head>{$t('insights.columns.cohort')}</Table.Head>
      <Table.Head class="text-center">{$t('insights.columns.learners')}</Table.Head>
      <Table.Head class="text-center">{$t('insights.columns.progress')}</Table.Head>
      <Table.Head class="text-center">{$t('insights.columns.avg_score')}</Table.Head>
      <Table.Head class="text-center">
        <ColumnHeader
          label={$t('insights.columns.passed_first_try')}
          hint={$t('insights.column_hints.passed_first_try')}
        />
      </Table.Head>
      <Table.Head class="text-center">{$t('insights.columns.overdue')}</Table.Head>
    </Table.Row>
  </Table.Header>
  <Table.Body>
    {#each result.rows as row (row['cohort_id'])}
      <Table.Row>
        <Table.Cell class="font-medium">{dimensionLabel(row, 'cohort', $t)}</Table.Cell>
        <Table.Cell class="text-center tabular-nums">{formatCount(row['learners__value'])}</Table.Cell>
        <Table.Cell class="text-center"><HeatCell value={row['avg_progress_pct__value']} /></Table.Cell>
        <Table.Cell class="text-center"><HeatCell value={row['avg_score_pct__value']} /></Table.Cell>
        <Table.Cell class="text-center"><HeatCell value={row['first_try_pass__pooled']} /></Table.Cell>
        <Table.Cell class="text-center tabular-nums">{formatCount(row['overdue_learners__value'])}</Table.Cell>
      </Table.Row>
    {/each}
  </Table.Body>
</Table.Root>
```

`exercise-distribution.svelte` (K7) keeps its exercise picker. Its title reads "Score distribution, {exercise}" through the title variables.

#### 6.8.6 Organization

**`cohorts-glance.svelte`** (O3) has the 5 newest cohorts. A row opens that cohort's dashboard. A cohort that only has invitations so far shows "{n} invited" under its zero.

```svelte
<script lang="ts">
  import { resolve } from '$app/paths';
  import * as Table from '@cio/ui/base/table';
  import { t } from '$lib/utils/functions/translations';

  import {
    cohortHealth,
    dimensionLabel,
    formatCount,
    formatShortDate,
    numberCell,
    textCell
  } from '../../utils/insights-utils';
  import type { WidgetRendererProps } from '../../utils/types';
  import HeatCell from '../heat-cell.svelte';
  import ProgressCell from '../progress-cell.svelte';
  import StatusBadge from '../status-badge.svelte';

  let { result }: WidgetRendererProps = $props();
</script>

<Table.Root>
  <Table.Header>
    <Table.Row>
      <Table.Head>{$t('insights.columns.cohort')}</Table.Head>
      <Table.Head>{$t('insights.columns.created')}</Table.Head>
      <Table.Head class="text-center">{$t('insights.columns.learners')}</Table.Head>
      <Table.Head class="min-w-[150px]">{$t('insights.columns.progress')}</Table.Head>
      <Table.Head class="text-center">{$t('insights.columns.avg_score')}</Table.Head>
      <Table.Head class="text-center">{$t('insights.columns.overdue')}</Table.Head>
      <Table.Head>{$t('insights.columns.health')}</Table.Head>
    </Table.Row>
  </Table.Header>
  <Table.Body>
    {#each result.rows as row (row['cohort_id'])}
      {@const cohortId = textCell(row, 'cohort_id') ?? ''}
      {@const health = cohortHealth(row)}
      {@const pendingInvites = numberCell(row, 'pending_invites__value') ?? 0}
      <Table.Row>
        <Table.Cell class="font-medium">
          <a
            class="ui:text-primary min-w-[140px] whitespace-normal hover:underline"
            href={resolve(`/cohorts/${cohortId}/analytics`, {})}
          >
            {dimensionLabel(row, 'cohort', $t)}
          </a>
        </Table.Cell>
        <Table.Cell class="whitespace-nowrap">{formatShortDate(row['cohort_created_at__value'])}</Table.Cell>
        <Table.Cell class="text-center tabular-nums">
          {formatCount(row['learners__value'])}
          {#if pendingInvites > 0}
            <span class="ui:text-muted-foreground block text-xs">
              {$t('insights.invited', { count: pendingInvites })}
            </span>
          {/if}
        </Table.Cell>
        <Table.Cell><ProgressCell value={row['avg_progress_pct__value']} /></Table.Cell>
        <Table.Cell class="text-center"><HeatCell value={row['avg_score_pct__value']} /></Table.Cell>
        <Table.Cell class="text-center tabular-nums">{formatCount(row['overdue_learners__value'])}</Table.Cell>
        <Table.Cell>
          {#if health}
            <StatusBadge status={health} />
          {:else}
            <span class="ui:text-muted-foreground">–</span>
          {/if}
        </Table.Cell>
      </Table.Row>
    {/each}
  </Table.Body>
</Table.Root>
```

**`cohort-health.svelte`** ("Learners by cohort health", O4) is its own card. It uses the same 5 cohorts, from the same request.

```svelte
<script lang="ts">
  import { t } from '$lib/utils/functions/translations';

  import { donutTotal, toHealthSegments } from '../../utils/insights-utils';
  import type { WidgetRendererProps } from '../../utils/types';
  import DonutChart from '../charts/donut-chart.svelte';

  let { result }: WidgetRendererProps = $props();

  const segments = $derived(toHealthSegments(result, $t));
</script>

<DonutChart {segments} centerLabel={$t('insights.donut.learners', { count: donutTotal(segments) })} />
```

**`cohort-scores.svelte`** ("Average score, by cohort", O7) uses the same 5 cohorts:

```svelte
<script lang="ts">
  import { t } from '$lib/utils/functions/translations';

  import { dimensionLabel, formatPercent, numberCell } from '../../utils/insights-utils';
  import type { HbarItem, WidgetRendererProps } from '../../utils/types';
  import HbarList from '../charts/hbar-list.svelte';

  let { result }: WidgetRendererProps = $props();

  const items = $derived(
    result.rows.map((row, index): HbarItem => {
      const value = numberCell(row, 'avg_score_pct__value');
      const label = dimensionLabel(row, 'cohort', $t);

      return { key: String(row['cohort_id'] ?? index), label, value, display: formatPercent(value) };
    })
  );
</script>

<HbarList {items} />
```

**`learner-growth.svelte`** (O5) is cumulative enrolled learners, with the target dashed. It shows 6 weekly points under All time, and the range's days or weeks otherwise (2.5). The y axis reaches the seat limit when the plan has one, like the prototype. An admin sets the target in place.

```svelte
<script lang="ts">
  import { t } from '$lib/utils/functions/translations';
  import { studentUsage } from '$lib/utils/store/org';

  import { insightsApi } from '../../api';
  import { growthYMax, toChartPoints } from '../../utils/insights-utils';
  import type { WidgetRendererProps } from '../../utils/types';
  import LineChart from '../charts/line-chart.svelte';
  import LearnerTargetEditor from '../learner-target-editor.svelte';

  let { result }: WidgetRendererProps = $props();

  const VALUE_KEY = 'members_total__value';

  const learnerTarget = $derived(insightsApi.dashboard?.scope.learnerTarget ?? null);
  const points = $derived(toChartPoints(result, 'period', $t));
  const target = $derived(learnerTarget ? { value: learnerTarget, label: $t('insights.legend.target') } : null);
  const yMax = $derived(growthYMax(points, VALUE_KEY, learnerTarget, $studentUsage?.limit ?? null));
</script>

<div class="mb-2 flex justify-end">
  <LearnerTargetEditor value={learnerTarget} />
</div>
<LineChart {points} valueKey={VALUE_KEY} label={$t('insights.legend.enrolled_learners')} {target} {yMax} />
```

`line-chart.svelte` passes `legend={Boolean(target)}` to `Chart.LineChart`, so the two lines are labelled as in the prototype.

```ts
export function growthYMax(
  points: readonly InsightsChartPoint[],
  valueKey: string,
  learnerTarget: number | null,
  seatLimit: number | null
): number {
  const values = points.map((point) => point[valueKey]).filter((value): value is number => typeof value === 'number');

  return Math.max(1, ...values, learnerTarget ?? 0, seatLimit ?? 0);
}
```

**`components/learner-target-editor.svelte`** is a popover with a `NumberField`. The draft is local and reset on open; nothing is written until Save.

```svelte
<script lang="ts">
  import TargetIcon from '@lucide/svelte/icons/target';
  import { Button } from '@cio/ui/base/button';
  import * as Popover from '@cio/ui/base/popover';
  import { NumberField } from '@cio/ui/custom/number-field';
  import { INSIGHTS_LIMITS } from '@cio/utils/constants/insights';
  import { t } from '$lib/utils/functions/translations';

  import { insightsSettingsApi } from '../api';

  interface Props {
    value: number | null;
  }

  let { value }: Props = $props();

  let open = $state(false);
  let draft = $state<number | null>(null);

  const canSave = $derived(draft !== null && draft !== value && !insightsSettingsApi.isSaving);

  function handleOpenChange(isOpen: boolean) {
    open = isOpen;

    if (isOpen) draft = value;
  }

  async function save(nextTarget: number | null) {
    const saved = await insightsSettingsApi.updateLearnerTarget(nextTarget);

    if (saved) open = false;
  }
</script>

<Popover.Root {open} onOpenChange={handleOpenChange}>
  <Popover.Trigger>
    {#snippet child({ props })}
      <Button {...props} type="button" variant="outline" size="sm" testId="insights-learner-target">
        <TargetIcon class="size-4" />
        {value ? $t('insights.target.edit') : $t('insights.target.set')}
      </Button>
    {/snippet}
  </Popover.Trigger>
  <Popover.Content align="end" class="w-[280px] space-y-3">
    <NumberField
      label={$t('insights.target.label')}
      helperMessage={$t('insights.target.helper')}
      bind:value={draft}
      min={1}
      max={INSIGHTS_LIMITS.learnerTargetMax}
      integer
      allowEmpty
      testId="insights-learner-target-input"
    />
    <div class="flex justify-end gap-2">
      {#if value}
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={insightsSettingsApi.isSaving}
          onclick={() => save(null)}
        >
          {$t('insights.target.clear')}
        </Button>
      {/if}
      <Button
        type="button"
        size="sm"
        loading={insightsSettingsApi.isSaving}
        disabled={!canSave}
        onclick={() => save(draft)}
      >
        {$t('insights.target.save')}
      </Button>
    </div>
  </Popover.Content>
</Popover.Root>
```

### 6.9 Learners table (C14)

**`components/learners/learners-table.svelte`: full replacement.**
- The columns per picker mode follow the prototype.
- A whole row selects that learner. The name stays a button, for keyboard users.
- Certificate column, "Now at" column, tinted pills, heat cells.
- Page size 10. The footer has the count and Export; below it is the app's `TablePagination`, used by the people and audience tables, instead of the prototype's "Show 10 more" (0.3).

```svelte
<script lang="ts">
  import UsersIcon from '@lucide/svelte/icons/users';
  import { Skeleton } from '@cio/ui/base/skeleton';
  import * as Table from '@cio/ui/base/table';
  import { Empty } from '@cio/ui/custom/empty';
  import { cn } from '@cio/ui/tools';
  import { INSIGHTS_LIMITS } from '@cio/utils/constants/insights';
  import { formatLastSeen } from '$features/audience/utils/audience-utils';
  import { ExportMenu, TablePagination } from '$features/ui';
  import { t } from '$lib/utils/functions/translations';

  import { insightsApi, insightsLearnersApi } from '../../api';
  import {
    attemptedByExercise,
    learnerPageRange,
    formatPercent,
    isInsightsStatus,
    LEARNER_DETAIL_ELEMENT_ID,
    nowAtLabel,
    numberCell,
    textCell,
    toSelectedLearner,
    visibleExerciseColumns
  } from '../../utils/insights-utils';
  import type { InsightsRow } from '../../utils/types';
  import HeatCell from '../heat-cell.svelte';
  import InsightsPill from '../insights-pill.svelte';
  import PassMarkTag from '../pass-mark-tag.svelte';
  import ProgressCell from '../progress-cell.svelte';
  import ScoreCell from '../score-cell.svelte';
  import Sparkline from '../sparkline.svelte';
  import StatusBadge from '../status-badge.svelte';
  import LearnersToolbar from './learners-toolbar.svelte';

  const courseId = $derived(insightsApi.selection.courseId);
  const structure = $derived(courseId ? insightsApi.dashboard?.structures[courseId] : undefined);
  const attempted = $derived(attemptedByExercise(insightsLearnersApi.attemptedResult));
  const exercises = $derived(courseId ? visibleExerciseColumns(structure, attempted) : []);
  const scopeTitle = $derived(insightsApi.dashboard?.scope.name ?? '');
  const scopeType = $derived(insightsApi.dashboard?.scope.type ?? 'cohort');
  const isCourseScope = $derived(scopeType === 'course');
  const scopeLearnerCount = $derived(insightsApi.dashboard?.scope.learnerCount ?? 0);
  const pageRange = $derived(learnerPageRange(insightsLearnersApi.page, insightsLearnersApi.rows.length));
  const footerLabel = $derived(
    $t(`insights.learners.showing.${scopeType}`, {
      from: pageRange.from,
      to: pageRange.to,
      total: insightsLearnersApi.total,
      count: scopeLearnerCount
    })
  );

  function learnerId(row: InsightsRow): string {
    return String(row['learner_id'] ?? '');
  }

  function selectLearner(row: InsightsRow) {
    const learner = toSelectedLearner(row);
    if (!learner || isCourseScope) return;

    void insightsApi.selectLearner(learner);

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    requestAnimationFrame(() =>
      document
        .getElementById(LEARNER_DETAIL_ELEMENT_ID)
        ?.scrollIntoView({ block: 'center', behavior: prefersReducedMotion ? 'auto' : 'smooth' })
    );
  }

  function handleNameClick(event: MouseEvent, row: InsightsRow) {
    event.stopPropagation();
    selectLearner(row);
  }

  function trend(row: InsightsRow): Array<number | null> {
    const cells = insightsLearnersApi.cells[learnerId(row)] ?? {};

    return exercises.map((exercise) => cells[exercise.id]?.scorePct ?? null);
  }

  function loadExportDocument() {
    // …unchanged
  }
</script>

<div class="space-y-4">
  <LearnersToolbar />

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
            <Table.Head class="ui:bg-background sticky left-0 z-10 min-w-[200px]">
              {$t('insights.columns.learner')}
            </Table.Head>
            <Table.Head class="min-w-[140px]">{$t('insights.columns.progress')}</Table.Head>
            {#if courseId}
              <Table.Head class="min-w-[140px]">{$t('insights.columns.now_at')}</Table.Head>
              {#each exercises as exercise (exercise.id)}
                <Table.Head class="min-w-[96px] text-center">
                  <div class="flex flex-col items-center gap-1">
                    <span class="line-clamp-2 text-xs" title={exercise.title}>{exercise.title}</span>
                    {#if exercise.passMark !== null}
                      <PassMarkTag passMark={exercise.passMark} />
                    {/if}
                  </div>
                </Table.Head>
              {/each}
              <Table.Head>{$t('insights.columns.trend')}</Table.Head>
            {:else}
              <Table.Head class="text-center">{$t('insights.columns.average_score')}</Table.Head>
              <Table.Head class="text-center">{$t('insights.columns.courses_completed')}</Table.Head>
            {/if}
            <Table.Head class="text-center">{$t('insights.columns.video')}</Table.Head>
            <Table.Head class="text-center">{$t('insights.columns.classroom')}</Table.Head>
            <Table.Head class="text-center">{$t('insights.columns.certificate')}</Table.Head>
            <Table.Head>{$t('insights.columns.last_login')}</Table.Head>
            <Table.Head>{$t('insights.columns.status')}</Table.Head>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {#each insightsLearnersApi.rows as row (learnerId(row))}
            {@const isSelected = insightsApi.selection.learnerId === learnerId(row)}
            {@const progress = numberCell(row, 'overall_progress_pct__value')}
            {@const status = row['status__value']}
            {@const lastLoginAt = textCell(row, 'last_login_at__value')}
            {@const certificates = numberCell(row, 'certificates__value') ?? 0}
            <Table.Row
              class={cn(!isCourseScope && 'cursor-pointer', isSelected && 'ui:bg-muted/60')}
              aria-selected={isCourseScope ? undefined : isSelected}
              onclick={() => selectLearner(row)}
            >
              <Table.Cell class="ui:bg-background sticky left-0 z-10">
                {#if isCourseScope && courseId}
                  <a
                    class="ui:focus-visible:ring-ring flex w-full flex-col items-start rounded text-left focus-visible:ring-2 focus-visible:outline-none"
                    href={`/courses/${courseId}/people/${learnerId(row)}?back=/courses/${courseId}/analytics`}
                  >
                    <span class="font-medium">{textCell(row, 'name__value')}</span>
                    <span class="ui:text-muted-foreground text-xs">{textCell(row, 'email__value')}</span>
                  </a>
                {:else}
                  <button
                    type="button"
                    class="ui:focus-visible:ring-ring flex w-full flex-col items-start rounded text-left focus-visible:ring-2 focus-visible:outline-none"
                    onclick={(event) => handleNameClick(event, row)}
                  >
                    <span class="font-medium">{textCell(row, 'name__value')}</span>
                    <span class="ui:text-muted-foreground text-xs">{textCell(row, 'email__value')}</span>
                  </button>
                {/if}
              </Table.Cell>
              <Table.Cell><ProgressCell value={progress} /></Table.Cell>
              {#if courseId}
                <Table.Cell class="ui:text-muted-foreground text-xs">
                  {nowAtLabel(progress, textCell(row, 'now_at_title__value'), $t)}
                </Table.Cell>
                {#each exercises as exercise (exercise.id)}
                  <Table.Cell class="text-center">
                    <ScoreCell
                      cell={insightsLearnersApi.cells[learnerId(row)]?.[exercise.id]}
                      passMark={exercise.passMark}
                    />
                  </Table.Cell>
                {/each}
                <Table.Cell>
                  <Sparkline values={trend(row)} label={$t('insights.columns.trend')} />
                </Table.Cell>
              {:else}
                {@const coursesCompleted = numberCell(row, 'courses_completed__value') ?? 0}
                {@const coursesTotal = numberCell(row, 'courses_total__value') ?? 0}
                <Table.Cell class="text-center"><HeatCell value={row['avg_score_pct__value']} /></Table.Cell>
                <Table.Cell class="text-center tabular-nums">
                  {$t('insights.of_total', { count: coursesCompleted, total: coursesTotal })}
                </Table.Cell>
              {/if}
              <Table.Cell class="text-center tabular-nums">{formatPercent(row['video_pct__value'])}</Table.Cell>
              <Table.Cell class="text-center tabular-nums">{formatPercent(row['attendance_pct__value'])}</Table.Cell>
              <Table.Cell class="text-center">
                {#if certificates > 0}
                  <InsightsPill tone="done">{$t('insights.certificate_issued', { count: certificates })}</InsightsPill>
                {:else}
                  <span class="ui:text-muted-foreground">–</span>
                {/if}
              </Table.Cell>
              <Table.Cell class="ui:text-muted-foreground text-xs whitespace-nowrap">
                {lastLoginAt ? formatLastSeen(lastLoginAt) : $t('insights.never')}
              </Table.Cell>
              <Table.Cell>
                <div class="flex flex-wrap items-center gap-1">
                  {#if isInsightsStatus(status)}
                    <StatusBadge {status} />
                  {/if}
                  {#if row['is_overdue__value'] === true}
                    <InsightsPill tone="risk">{$t('insights.flags.overdue')}</InsightsPill>
                  {/if}
                </div>
              </Table.Cell>
            </Table.Row>
          {/each}
        </Table.Body>
      </Table.Root>
    </div>
  {/if}

  {#if insightsLearnersApi.rows.length > 0}
    <div class="flex flex-col items-center justify-between gap-2 sm:flex-row">
      <p class="ui:text-muted-foreground text-xs">{footerLabel}</p>
      <ExportMenu
        document={loadExportDocument}
        estimatedRowCount={insightsLearnersApi.total}
        disabled={insightsLearnersApi.total === 0}
        testId="insights-learners-export"
      />
    </div>
  {/if}

  {#if insightsLearnersApi.pageCount > 1}
    <TablePagination
      count={insightsLearnersApi.total}
      perPage={INSIGHTS_LIMITS.learnersPageSize}
      page={insightsLearnersApi.page}
      onPageChange={(page) => insightsLearnersApi.goToPage(page)}
    />
  {/if}
</div>
```

Add to utils:

```ts
/**
 * The 1-based positions of the learners on screen, for "Showing 11–20 of 57".
 */
export function learnerPageRange(page: number, rowCount: number): { from: number; to: number } {
  const from = (page - 1) * INSIGHTS_LIMITS.learnersPageSize + 1;

  return { from, to: from + Math.max(0, rowCount - 1) };
}
```

`learners-toolbar.svelte` keeps its controls. Only its copy changes (6.12), to match the prototype's filter and sort wording.

### 6.10 Settings client: `api/settings.svelte.ts` (new)

```ts
import { ZUpdateInsightsSettings } from '@cio/utils/validation/insights';
import { snackbar } from '$features/ui/snackbar/store';
import { BaseApi, classroomio } from '$lib/utils/services/api';

import type { UpdateInsightsSettingsRequest } from '../utils/types';
import { insightsApi } from './insights.svelte';

class InsightsSettingsApi extends BaseApi {
  isSaving = $state(false);

  /**
   * Saves the org's learner target (null clears it) and draws it on the growth chart at once. Returns whether it saved.
   */
  async updateLearnerTarget(learnerTarget: number | null): Promise<boolean> {
    const parsed = ZUpdateInsightsSettings.safeParse({ learnerTarget });
    if (!parsed.success) {
      snackbar.error('snackbar.insights.target_invalid');
      return false;
    }

    this.isSaving = true;
    const response = await this.execute<UpdateInsightsSettingsRequest>({
      requestFn: () => classroomio.insights.settings.$put({ json: parsed.data }),
      logContext: 'saving insights settings',
      onSuccess: (result) => {
        if (insightsApi.dashboard) insightsApi.dashboard.scope.learnerTarget = result.data.learnerTarget;

        snackbar.success('snackbar.insights.target_saved');
      },
      onError: () => snackbar.error('snackbar.insights.target_failed')
    });
    this.isSaving = false;

    return Boolean(response);
  }
}

export const insightsSettingsApi = new InsightsSettingsApi();
```

- `utils/types.ts`: `export type UpdateInsightsSettingsRequest = typeof classroomio.insights.settings.$put;`
- `api/index.ts`: export `insightsSettingsApi`.

### 6.11 Pages

The page subtitles and `UpdatedAgo` go. The scope chips sit under the title (C2, K1, O1, S4). The range picker (6.14) and Refresh sit in the header actions, in that order, as on Marketing.

**`pages/cohort-insights.svelte`.** The picker row always shows, with a visible "Course" label, above the KPIs (C1):

```svelte
<Page.Root class="mx-auto w-full max-w-6xl px-4">
  <Page.Header>
    <Page.HeaderContent>
      <Page.Title>{$t('insights.title')}</Page.Title>
      {#if canView}
        <InsightsScopeChips showInterval />
      {/if}
    </Page.HeaderContent>
    {#if canView}
      <Page.Action>
        <InsightsRangePicker />
        <RefreshPageData disabled={!insightsApi.dashboard} onRefresh={handleRefresh} />
      </Page.Action>
    {/if}
  </Page.Header>
  <Page.Body>
    {#snippet child()}
      {#if canView}
        <div class="space-y-6">
          {#if courses.length > 0}
            <CoursePicker {courses} value={insightsApi.selection.courseId} onChange={handleCourseChange} />
          {/if}
          <InsightsDashboard {scope} />
        </div>
      {:else}
        <Empty icon={LockIcon} title={$t('insights.empty.not_permitted')} variant="page" />
      {/if}
    {/snippet}
  </Page.Body>
</Page.Root>
```

Replace the `UpdatedAgo` import with `import InsightsScopeChips from '../components/insights-scope-chips.svelte';`, and add `import InsightsRangePicker from '../components/insights-range-picker.svelte';`.

**`pages/course-insights.svelte`** and **`pages/org-insights.svelte`**: the same header shape, with `<InsightsScopeChips />` (no interval) in place of the subtitle paragraph, no `UpdatedAgo`, and `<InsightsRangePicker />` before the refresh button. On the org page, the chips stay inside the existing `{#if $isOrgAdmin !== false}` guard.

**`components/course-picker.svelte`** gets the prototype's visible label:

```svelte
<script lang="ts">
  import { Label } from '@cio/ui/base/label';
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
  const triggerId = $props.id();

  const selectedValue = $derived(value ?? ALL_COURSES);
  const selectedLabel = $derived(
    value ? (courses.find((course) => course.id === value)?.title ?? '') : $t('insights.all_courses')
  );

  function handleChange(next: string) {
    onChange(next === ALL_COURSES ? null : next);
  }
</script>

<div class="flex flex-wrap items-center gap-2">
  <Label for={triggerId} class="text-sm font-medium">{$t('insights.course_picker')}</Label>
  <Select.Root type="single" value={selectedValue} onValueChange={handleChange}>
    <Select.Trigger id={triggerId} class="w-full sm:w-[280px]" data-testid="insights-course-picker">
      <span class="truncate">{selectedLabel}</span>
    </Select.Trigger>
    <Select.Content>
      <Select.Item value={ALL_COURSES} label={$t('insights.all_courses')}>{$t('insights.all_courses')}</Select.Item>
      {#each courses as course (course.id)}
        <Select.Item value={course.id} label={course.title}>{course.title}</Select.Item>
      {/each}
    </Select.Content>
  </Select.Root>
</div>
```

### 6.12 Translations (`apps/dashboard/src/lib/utils/translations/en.json`)

Replace the whole `insights` object with this, then run `cd apps/dashboard && pnpm translate`. Check that every `{placeholder}` and every ICU `plural` survived in all 11 other locales.

```json
"insights": {
  "title": "Analytics",
  "updated_seconds_ago": "updated {count}s ago",
  "updated_minutes_ago": "{count, plural, one {updated # minute ago} other {updated # minutes ago}}",
  "retry": "Try again",
  "all_courses": "All courses",
  "course_picker": "Course",
  "exercise_picker": "Exercise",
  "not_in_section": "Not in a section",
  "section_number": "Section {number}",
  "section_with_title": "Section {number} · {title}",
  "finished": "Finished",
  "awaiting_grade": "Awaiting grade",
  "awaiting_grade_short": "Pending",
  "pass_mark_tag": "Pass mark {mark}%",
  "of_total": "{count} of {total}",
  "never": "Never",
  "invited": "{count} invited",
  "certificate_issued": "{count, plural, one {Issued} other {# issued}}",
  "question_hint": {
    "context_and_answer": "{context} · most common wrong answer: {answer}",
    "answer": "Most common wrong answer: {answer}"
  },
  "chips": {
    "label": "About this dashboard",
    "live": "Live · {updated}",
    "live_every": "Live · {updated} · refreshes every {seconds}s",
    "learners": "{count, plural, one {# learner} other {# learners}}",
    "courses": "Courses: {count}",
    "cohorts": "Cohorts: {count}",
    "active_cohorts": "{count, plural, one {# active cohort} other {# active cohorts}}",
    "seats": "Seats: {used} of {limit}"
  },
  "now_tag": {
    "label": "Now",
    "hint": "Shows where learners stand now. The range doesn't change this card."
  },
  "learner_chips": {
    "latest": "Latest",
    "progress": "Progress",
    "now_at": "now at {place}"
  },
  "donut": {
    "learners": "{count, plural, one {learner} other {learners}}"
  },
  "status": {
    "at_risk": "At risk",
    "lagging": "Lagging",
    "on_track": "On track",
    "completed": "Completed"
  },
  "flags": {
    "overdue": "Overdue"
  },
  "legend": {
    "middle_half": "Middle 50% of learners",
    "cohort_average": "Cohort average",
    "learner": "Learner",
    "all_learners": "All learners",
    "in_progress": "{name} (in progress)",
    "enrolled_learners": "Enrolled learners",
    "target": "Target"
  },
  "notes": {
    "score_distribution": "Learners per score band.",
    "course_details": "Pick a course above to see scores by exercise, the section-by-section scorecard and the hardest questions.",
    "learner_courses": "Search or filter the learners below and click a row to switch learner. Pick a course above to chart their scores by exercise.",
    "learner_progression": "Search or filter the learners below and click a row to switch learner.",
    "section_scorecard": "One row per course section. Video attendance is the share of lesson videos watched. Classroom attendance is marked by the tutor.",
    "needs_attention": "A learner can appear under more than one reason.",
    "overdue": "Learners already get scheduled reminder emails before a deadline. \"Send reminder\" sends one right now.",
    "hardest_questions": "The questions learners miss most, with the most common wrong answer.",
    "logins_per_day": "Learners who signed in each day.",
    "learners": {
      "all_courses": "Click a learner to see their courses above. Pick a course above to see each exercise.",
      "one_course": "Click a learner to chart their scores above. Search, filters and sort also apply to the export.",
      "course_scope": "Select a learner to open their progress in this course. Search, filters and sort also apply to the export."
    },
    "cohorts_shown": "Showing {shown} of {total, plural, one {# cohort} other {# cohorts}}.",
    "cohorts_at_a_glance": "Showing {shown} of {total, plural, one {# cohort} other {# cohorts}}. Select a cohort to open its dashboard.",
    "cohorts_in_table": "{count, plural, one {The cohort} other {The # cohorts}} in the table above.",
    "lesson_dropoff": "The steepest fall is between {from} and {to}.",
    "no_pass_mark": "No exercise here has a pass mark yet, so there is no first-try rate. Set a pass mark on an exercise to see it."
  },
  "buckets": {
    "progress": {
      "0": "0–25",
      "1": "25–50",
      "2": "50–75",
      "3": "75–99",
      "4": "Done"
    },
    "score": {
      "4": "<50",
      "5": "50s",
      "6": "60s",
      "7": "70s",
      "8": "80s",
      "9": "90+",
      "null": "No score"
    }
  },
  "kpi": {
    "share_of_cohort": "{percent} of the cohort",
    "share_of_enrolled": "{percent} of enrolled",
    "share_of_completions": "{percent} of completions",
    "avg_progress_hint": "lessons and exercises completed / total",
    "avg_score_hint": "across exercises taken",
    "overdue_hint": "past their deadline, not done",
    "completed_certified": "{percent} of the cohort · {count} certified",
    "enrolled_this_week": "{count, plural, =0 {No new learners this week} other {+# this week}}",
    "enrolled_in_days": "{count, plural, =0 {No new learners in the last {days} days} other {+# in the last {days} days}}",
    "added_in_days": "{count, plural, =0 {None in the last {days} days} other {+# in the last {days} days}}",
    "completed_in_days": "{percent} of the cohort{count, plural, =0 {} other { · +# in the last {days} days}}",
    "logged_in_days": "Logged in, last {days} days",
    "avg_score_in_days": "attempts in the last {days} days",
    "first_try_in_days": "of {took} graded in the last {days} days{still, plural, =0 {} other { · # still to pass}}",
    "median_days_in_days": "for completions in the last {days} days",
    "first_try_context": "of {took} who took a pass-mark exercise{still, plural, =0 {} other { · # still to pass}}",
    "median_days_hint": "enrolment to completion",
    "needs_attention_hint": "inactive, low score or overdue",
    "delta": {
      "this_week": {
        "up": "+{count} pts this week",
        "down": "−{count} pts this week",
        "flat": "No change this week"
      },
      "vs_last_week": {
        "up": "+{count} pts vs last week",
        "down": "−{count} pts vs last week",
        "flat": "No change vs last week"
      },
      "in_days": {
        "up": "+{count} pts in the last {days} days",
        "down": "−{count} pts in the last {days} days",
        "flat": "No change in the last {days} days"
      },
      "vs_days_ago": {
        "up": "+{count} pts vs {days} days ago",
        "down": "−{count} pts vs {days} days ago",
        "flat": "No change vs {days} days ago"
      }
    }
  },
  "widgets": {
    "kpi_logged_in_today": { "title": "Logged in today" },
    "kpi_logged_in_week": { "title": "Logged in, last 7 days" },
    "kpi_avg_progress": { "title": "Average progress" },
    "kpi_avg_score": { "title": "Average score" },
    "kpi_avg_grade": { "title": "Average grade" },
    "kpi_overdue": { "title": "Overdue" },
    "kpi_completed": { "title": "Completed" },
    "kpi_enrolled": { "title": "Enrolled" },
    "kpi_completion_rate": { "title": "Completion rate" },
    "kpi_first_try_pass": { "title": "Passed first try" },
    "kpi_median_days": { "title": "Median days to finish" },
    "kpi_completions": { "title": "Completions" },
    "kpi_certificates": { "title": "Certificates issued" },
    "kpi_needs_attention": { "title": "Needs attention" },
    "courses_summary": { "title": "Courses in this cohort" },
    "learners_by_status": { "title": "Learners by status" },
    "course_details": { "title": "Course details" },
    "learner_courses": { "title": "{name}: courses" },
    "scores_by_exercise": { "title": "Scores by exercise, {course}" },
    "progress_distribution": { "title": "Progress distribution" },
    "learner_progression": { "title": "{name}: scores by exercise" },
    "section_scores": { "title": "Scores and attendance by section" },
    "score_distribution": { "title": "Average score distribution" },
    "section_scorecard": { "title": "Section-by-section scorecard" },
    "needs_attention": { "title": "Needs attention, by reason" },
    "overdue": { "title": "Overdue, with reminders" },
    "hardest_questions": { "title": "Hardest questions" },
    "learners": { "title": "Learners" },
    "logins_per_day": { "title": "Learners logged in per day" },
    "scores_by_exercise_by_cohort": { "title": "Scores by exercise, one line per cohort" },
    "exercise_score_distribution": { "title": "Score distribution, {exercise}" },
    "lesson_dropoff": { "title": "Lesson completion drop-off" },
    "hardest_exercises": { "title": "Hardest exercises" },
    "cohorts_in_course": { "title": "Cohorts taking this course" },
    "cohort_details": { "title": "Cohort details" },
    "cohorts_at_a_glance": { "title": "Cohorts at a glance" },
    "cohort_health": { "title": "Learners by cohort health" },
    "hiring_ramp": { "title": "Enrolled learners vs target" },
    "avg_score_by_cohort": { "title": "Average score, by cohort" },
    "courses_by_completion": { "title": "Courses by completion" }
  },
  "measures": {
    "rows__count": "Learners",
    "progress_pct__avg": "Average progress",
    "avg_score_pct__avg": "Average score",
    "avg_progress_pct__value": "Average progress",
    "avg_score_pct__value": "Average score",
    "first_try_pass__pooled": "Passed first try",
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
    "members_total__value": "Enrolled learners"
  },
  "columns": {
    "learner": "Learner",
    "email": "Email",
    "course": "Course",
    "learners": "Learners",
    "progress": "Progress",
    "avg_progress": "Avg progress",
    "avg_score": "Avg score",
    "average_score": "Average score",
    "completed": "Completed",
    "took_pass_mark": "Took a pass-mark exercise",
    "passed_first_try": "Passed first try",
    "exercises_passed": "Exercises passed",
    "now_at": "Now at",
    "courses_completed": "Courses completed",
    "video": "Video",
    "classroom": "Classroom",
    "video_attendance": "Video attendance",
    "classroom_attendance": "Classroom attendance",
    "certificate": "Certificate",
    "certificates": "Certificates",
    "last_login": "Last login",
    "status": "Status",
    "trend": "Trend",
    "cohort": "Cohort",
    "created": "Created",
    "overdue": "Overdue",
    "health": "Health",
    "section": "Course section",
    "exercises_taken": "Exercises taken",
    "actions": "Actions"
  },
  "column_hints": {
    "passed_first_try": "Learners who reached the pass mark on their first graded attempt, on exercises that have a pass mark.",
    "section_passed_first_try": "Learners who reached the pass mark on their first graded attempt at every exercise with a pass mark in this section.",
    "took_pass_mark": "Learners graded on at least one exercise that has a pass mark.",
    "exercises_passed": "Exercises with a pass mark that this learner has reached the mark on, out of all exercises with a pass mark in the course."
  },
  "actions": {
    "send_reminder": "Send reminder",
    "queued": "Queued",
    "remind_all_overdue": "Remind all {count, plural, one {# overdue learner} other {# overdue learners}}",
    "reminders_queued": "Reminders queued"
  },
  "target": {
    "set": "Set target",
    "edit": "Edit target",
    "label": "Learner target",
    "helper": "How many enrolled learners you're aiming for. It shows as a dashed line.",
    "clear": "Remove target",
    "save": "Save target"
  },
  "hints": {
    "learner_courses": "No learners in this cohort yet",
    "learner_progression": "No learners in this course yet",
    "exercise_score_distribution": "Pick an exercise to see its scores"
  },
  "learners": {
    "search": "Search by name or email",
    "empty": "No learners match these filters",
    "showing": {
      "cohort": "Showing {from}–{to} of {total} matching · {count, plural, one {# learner} other {# learners}} in cohort",
      "course": "Showing {from}–{to} of {total} matching · {count, plural, one {# learner} other {# learners}} in course"
    },
    "clear_filters": "{count, plural, one {Clear # filter} other {Clear # filters}}",
    "sort": {
      "status": "Sort: lagging first",
      "progress": "Sort: least progress",
      "name": "Sort: name A to Z",
      "low_score": "Sort: lowest average score"
    },
    "filters": {
      "status": {
        "label": "Status",
        "any": "All statuses",
        "at_risk": "At risk",
        "lagging": "Lagging",
        "on_track": "On track",
        "completed": "Completed"
      },
      "activity": {
        "label": "Last login",
        "any": "Any login",
        "today": "Logged in today",
        "idle": "No login 2+ days"
      },
      "score": {
        "label": "Average score",
        "any": "Any average score",
        "lt50": "Under 50%",
        "mid": "50% to 69%",
        "gte70": "70% and above"
      },
      "flag": {
        "label": "Flags",
        "any": "Any flag",
        "overdue": "Overdue",
        "certified": "Certificate issued",
        "not_certified": "No certificate"
      }
    }
  },
  "empty": {
    "no_data": "No data yet",
    "no_overdue": "No overdue learners",
    "no_cohorts": "No cohorts yet",
    "failed": "This chart couldn't load",
    "dashboard_failed": "Analytics couldn't load",
    "not_permitted": "You don't have access to these analytics"
  }
}
```

The JSON above is compact for reading. `pnpm format:changed` expands the one-line `widgets` entries to the file's style.

`analytics.range` (Marketing's labels, outside the `insights` block) gains two keys. Insights reuses `7d`, `30d` and `90d` from it, so both pages name the ranges the same way:

```json
"all": "All time",
"label": "Time range"
```

`snackbar.insights` keeps its five keys and adds three:

```json
"target_saved": "Learner target saved",
"target_failed": "Couldn't save the learner target",
"target_invalid": "Enter a whole number from 1 to 1,000,000"
```

**Title choice for `hiring_ramp`.** The prototype's "Hiring ramp vs target" and "First-wave target" are the pilot customer's own words. An organization that isn't hiring would read them as wrong, so the product says "Enrolled learners vs target" and "Target". The chart, its target line and its axis are otherwise the prototype's.

### 6.13 Removals and renames

| Remove | Because |
| --- | --- |
| `components/updated-ago.svelte` | Replaced by the live chip (6.6) |
| `components/pass-required-tag.svelte` | Renamed to `pass-mark-tag.svelte` (6.8.1) |
| `components/widgets/group-summary.svelte` | Split into `comparison-chart`, `course-details` and `cohort-details` |
| `features/marketing/components/range-picker.svelte` and its export | Moved to `features/ui/analytics/range-picker.svelte`, shared with insights (6.14) |
| `cohortGoalApi.remindAssignment`, `RemindGoalAssignmentRequest` | The per-learner reminder goes through `remind-overdue` (5.3) |
| `STATUS_BADGE_VARIANT`, `kpi_required_pass_rate`, every `required_*` key | Section 1 |
| Translation keys `insights.subtitle.*`, `no_cohort`, `pass_required_tag`, `required_passed_of`, `most_common_wrong_answer`, `overdue_kind.*`, `legend.average`, `kpi.share_of_learners`, `kpi.certified`, `kpi.days`, `kpi.required_pass_hint`, `columns.required_passed`, `columns.overdue_item`, `columns.days_overdue`, `columns.pass_rate`, `learners.show_more` | Unused after this patch; the 6.12 block already leaves them out |

After the removals, run:

```bash
rg -n "required_pass|required_total|required_passed|passed_all_required|remindAssignment|pass_required_tag|UpdatedAgo|GroupSummary|no_cohort" apps packages
```

It must return nothing. The `pass_required` widget requirement does not match the pattern, and it stays.

### 6.14 Range picker and Now tags (2.5)

**Share Marketing's picker.** Move `features/marketing/components/range-picker.svelte` to `features/ui/analytics/range-picker.svelte`, make it generic over its options, and export it as `RangePicker` from `$features/ui` beside `KpiCard`. The buttons and look stay Marketing's.

```svelte
<script lang="ts" generics="TValue extends string | number">
  import { Button } from '@cio/ui/base/button';

  interface Props {
    value: TValue;
    options: ReadonlyArray<{ value: TValue; label: string }>;
    label: string;
    onChange: (value: TValue) => void;
    disabled?: boolean;
    testId?: string;
  }

  let { value, options, label, onChange, disabled = false, testId }: Props = $props();
</script>

<div class="inline-flex flex-wrap gap-1 rounded-md border p-1" role="group" aria-label={label} data-testid={testId}>
  {#each options as option (option.value)}
    <Button
      type="button"
      variant={value === option.value ? 'default' : 'ghost'}
      size="xs"
      aria-pressed={value === option.value}
      {disabled}
      onclick={() => onChange(option.value)}
    >
      {option.label}
    </Button>
  {/each}
</div>
```

**Marketing.**
- Add `export const MARKETING_RANGE_DAYS = [7, 30, 90] as const;` to `marketing-utils.ts`.
- The page builds its options as `MARKETING_RANGE_DAYS.map((days) => ({ value: days, label: $t(`analytics.range.${days}d`) }))`, and passes `label={$t('analytics.range.label')}`.
- Delete the marketing `RangePicker` export.
- Nothing else on Marketing changes.

**`components/insights-range-picker.svelte`** (new):

```svelte
<script lang="ts">
  import { RangePicker } from '$features/ui';
  import { t } from '$lib/utils/functions/translations';

  import { insightsApi } from '../api';
  import { rangeOptions } from '../utils/insights-utils';

  const options = $derived(rangeOptions($t));
</script>

<RangePicker
  value={insightsApi.selection.range}
  {options}
  label={$t('analytics.range.label')}
  disabled={!insightsApi.dashboard}
  onChange={(range) => insightsApi.selectRange(range)}
  testId="insights-range"
/>
```

**`components/now-tag.svelte`** (new):

```svelte
<script lang="ts">
  import * as Tooltip from '@cio/ui/base/tooltip';
  import { t } from '$lib/utils/functions/translations';
</script>

<Tooltip.Provider>
  <Tooltip.Root>
    <Tooltip.Trigger class="ui:bg-muted ui:text-muted-foreground rounded-full px-2 py-0.5 text-[11px] font-medium">
      {$t('insights.now_tag.label')}
    </Tooltip.Trigger>
    <Tooltip.Content side="top" sideOffset={4} class="max-w-xs">{$t('insights.now_tag.hint')}</Tooltip.Content>
  </Tooltip.Root>
</Tooltip.Provider>
```

**`apps/dashboard/src/lib/features/ui/analytics/analytics-panel-card.svelte`** gets an optional header action, rendered through `Card.Action`:

```svelte
<script lang="ts">
  import * as Card from '@cio/ui/base/card';
  import { cn } from '@cio/ui/tools';
  import type { Snippet } from 'svelte';

  interface Props {
    title: string;
    description?: string;
    action?: Snippet;
    class?: string;
    children?: Snippet;
  }

  let { title, description, action, class: className, children }: Props = $props();
</script>

<Card.Root class={cn(className)}>
  <Card.Header>
    <Card.Title>{title}</Card.Title>
    {#if description}
      <Card.Description>{description}</Card.Description>
    {/if}
    {#if action}
      <Card.Action>{@render action()}</Card.Action>
    {/if}
  </Card.Header>
  <Card.Content>
    {@render children?.()}
  </Card.Content>
</Card.Root>
```

**`KpiCard`** gets an optional `badge?: Snippet`, rendered after the title inside the existing header row:

```svelte
      <div class="flex items-center gap-2">
        <Card.Title class="…unchanged">{title}</Card.Title>
        {@render badge?.()}
      </div>
```

Both props are optional, so Marketing and the other analytics pages are unchanged.

**Where the range goes.**
- `InsightsWidget` and `InsightsKpiRow` render the Now tag (6.7).
- `InsightsApi.selectRange` reruns only the range widgets (6.2).
- `resolveWidgetSpec` puts the range on their specs (6.3).
- The learners table never reads the range: it is a standing roster, and it shows the Now tag through `InsightsWidget` like every other standing card.

## 7. Tests

### 7.1 Database and API

Section 5.6 lists every API test to add or change. The database-backed suites skip unless `DATABASE_URL` is set. Run them on a throwaway database, never the shared dev database, because migrating from a feature branch moves drizzle's high-water mark (see `AGENTS.md`, "Database migrations"):

1. `docker exec cio-postgres psql -U postgres -c "CREATE DATABASE cio_scratch"`.
2. From `packages/db`, with `DATABASE_URL` pointing at `cio_scratch`: `npx drizzle-kit migrate`, then `npx drizzle-kit push --force < /dev/null`.
3. Copy the reference rows the seed adds: `pg_dump --data-only -t public.role -t public.submissionstatus -t public.question_type` from `classroomio`, piped into `psql -d cio_scratch`.
4. Run `DATABASE_URL=… pnpm --filter @cio/api exec vitest run src/__tests__/insights-metrics-db.test.ts`, then the other insights suites. Drop the database afterwards.

**Fixture rules for the first-try cases.** Exercises need `completion_policy = 'passed'`, a `pass_threshold`, and questions with points. Give the submissions explicit `created_at` values a few minutes apart, so "first attempt" is unambiguous. A first attempt with `grading_state <> 'completed'` must drop out of both the numerator and the denominator.

**Period and range fixtures.** Use fixed `created_at` and `updated_at` offsets from `now()`:
- 3 and 10 days for enrolments
- 2 days for a completion
- lesson completions at 2 and 9 days
- attempts at 5 and 40 days

Run the period assertions under `'all'` (7 days) and `'30d'`. That way they don't depend on the day the suite runs. Keep every offset at least a day away from a window's edge, because windows start at midnight UTC.

### 7.2 Dashboard utilities (`utils/insights-utils.test.ts`)

Update the existing cases first:
- `defaultCourseId`: a one-course **cohort** now returns `null`. A course scope returns its course, and the org scope returns `null`.
- `cohortHealth`: switch to the `cohort_summary` keys and add the zero-learner case (below). Drop the inline comments in that test.
- `scoreTone`: the scale is now 70/50 (below).
- Every `InsightsDashboard` fixture gains `description`, `cohortCount`, `activeCohortCount` and `learnerTarget` on `scope`. Every `InsightsSelection` fixture gains `range: 'all'`, and every widget fixture `usesRange: false`.
- `resolveWidgetSpec` now always returns a `range`. Existing expectations that compare whole specs add `range: 'all'`.

Then add these cases. Add the new functions (including `isNowCard`, `rangeOptions` and `learnerPageRange`) to the test's import list, plus `INSIGHTS_PLACEHOLDERS` from `@cio/utils/constants/insights` and the `InsightsSpec` and `InsightsWidgetContext` types. `resultOf` builds a result the way the existing fixtures do:

```ts
function resultOf(rows: InsightsRow[], columns: InsightsResult['columns'] = []): InsightsResult {
  return { source: 'test', columns, rows, total: rows.length, generatedAt: '2026-10-23T10:00:00Z', ttlSeconds: 30 };
}

function widgetOf(id: string, spec: Partial<InsightsWidget['spec']> = {}): InsightsWidget {
  return {
    id,
    titleKey: `insights.widgets.${id}.title`,
    viz: 'table',
    span: 12,
    courseMode: 'any',
    requires: [],
    usesRange: false,
    spec: {
      source: 'learner',
      dimensions: [],
      measures: [],
      filters: [],
      sort: [],
      limit: 100,
      page: 1,
      range: 'all',
      ...spec
    }
  } as InsightsWidget;
}

const widgetContext: InsightsWidgetContext = {
  scopeType: 'cohort',
  courseSelected: false,
  cohortCount: 8,
  learnerCount: 40
};

describe('request sharing', () => {
  it('gives specs that differ only in key order one key, and keeps refreshes apart', () => {
    const scope = { type: 'cohort' as const, id: 'coh1' };
    const spec = widgetOf('a', { dimensions: ['course'] }).spec;
    const reordered = Object.fromEntries(Object.entries(spec).reverse()) as typeof spec;

    expect(specRequestKey(scope, reordered, false)).toBe(specRequestKey(scope, spec, false));
    expect(specRequestKey(scope, spec, true)).not.toBe(specRequestKey(scope, spec, false));
  });
});

describe('scoreTone', () => {
  it('uses the prototype heat scale', () => {
    expect(scoreTone(70)).toBe('success');
    expect(scoreTone(69)).toBe('warning');
    expect(scoreTone(50)).toBe('warning');
    expect(scoreTone(49)).toBe('danger');
    expect(scoreTone(null)).toBe('muted');
  });
});

describe('dropoffTone', () => {
  it('is amber below 75% and red below 50%', () => {
    expect(dropoffTone(80)).toBe('info');
    expect(dropoffTone(74)).toBe('warning');
    expect(dropoffTone(49)).toBe('danger');
  });
});

describe('cohortHealth', () => {
  it('reads cohort_summary rows and has no health without learners', () => {
    expect(cohortHealth({ learners__value: 0 })).toBeNull();
    expect(cohortHealth({ learners__value: 20, completed_learners__value: 19 })).toBe('completed');
    expect(cohortHealth({ learners__value: 20, at_risk_learners__value: 4 })).toBe('at_risk');
    expect(cohortHealth({ learners__value: 20, avg_score_pct__value: 60 })).toBe('lagging');
    expect(cohortHealth({ learners__value: 20, avg_score_pct__value: 80 })).toBe('on_track');
  });

  it('sums learners per health in the prototype order and skips empty cohorts', () => {
    const result = resultOf([
      { cohort_id: 'a', learners__value: 10, avg_score_pct__value: 80 },
      { cohort_id: 'b', learners__value: 5, completed_learners__value: 5 },
      { cohort_id: 'c', learners__value: 0 }
    ]);

    expect(toHealthSegments(result, mockTranslate).map(({ key, value }) => [key, value])).toEqual([
      ['on_track', 10],
      ['completed', 5]
    ]);
  });
});

describe('toDonutSegments', () => {
  it('orders statuses as the prototype legend and drops zeros', () => {
    const result = resultOf(
      [
        { status_id: 'at_risk', rows__count: 3 },
        { status_id: 'completed', rows__count: 0 },
        { status_id: 'on_track', rows__count: 7 }
      ],
      [{ key: 'rows__count', label: 'Learners', role: 'measure', valueType: 'integer' }]
    );

    expect(toDonutSegments(result, 'status', mockTranslate).map((segment) => segment.key)).toEqual([
      'on_track',
      'at_risk'
    ]);
  });
});

describe('sectionLabel', () => {
  const structure = {
    courseId: 'c1',
    isGrouped: true,
    sections: [
      { id: 's1', title: 'Intake', rank: 0 },
      { id: 's2', title: 'Credits', rank: 1 }
    ],
    items: []
  } as InsightsCourseStructure;

  it('numbers sections by outline position', () => {
    expect(sectionLabel('s2', structure, mockTranslate, { withTitle: false })).toBe(
      'insights.section_number:number=2'
    );
    expect(sectionLabel('s1', structure, mockTranslate, { withTitle: true })).toBe(
      'insights.section_with_title:number=1:title=Intake'
    );
    expect(sectionLabel(null, structure, mockTranslate, { withTitle: true })).toBe('insights.not_in_section');
  });
});

describe('steepestDrop', () => {
  it('finds the largest fall between neighbours', () => {
    const items = [
      { key: 'a', label: 'Credits', value: 71, display: '71%' },
      { key: 'b', label: 'Schedule C', value: 58, display: '58%' },
      { key: 'c', label: 'Review', value: 54, display: '54%' }
    ];

    expect(steepestDrop(items)).toEqual({ from: 'Credits', to: 'Schedule C' });
    expect(steepestDrop([...items].reverse())).toBeNull();
  });
});

describe('formatPointsDelta', () => {
  it('colours movement and stays silent without a baseline', () => {
    expect(formatPointsDelta(45, 41, 'compared', null, mockTranslate)).toEqual({
      description: 'insights.kpi.delta.vs_last_week.up:count=4:days=7',
      trend: 'up'
    });
    expect(formatPointsDelta(40, 46, 'gained', null, mockTranslate).trend).toBe('down');
    expect(formatPointsDelta(40, 40.2, 'gained', null, mockTranslate).trend).toBe('flat');
    expect(formatPointsDelta(40, null, 'gained', null, mockTranslate)).toEqual({});
  });

  it('words the change by the range', () => {
    expect(formatPointsDelta(70, 64, 'gained', 30, mockTranslate).description).toBe(
      'insights.kpi.delta.in_days.up:count=6:days=30'
    );
    expect(formatPointsDelta(40, 44, 'compared', 90, mockTranslate).description).toBe(
      'insights.kpi.delta.vs_days_ago.down:count=4:days=90'
    );
  });
});

describe('formatKpi', () => {
  const resultWith = (row: InsightsRow) => resultOf([row]);

  it('shows certificates on Completed only under All courses', () => {
    const row = { is_completed_all__count_if: 4, rows__count: 20, certificates__sum: 3 };
    const widget = widgetOf('kpi_completed');

    expect(formatKpi(widget, resultWith(row), mockTranslate, { courseSelected: false, rangeDays: null }).description).toBe(
      'insights.kpi.completed_certified:percent=20%:count=3'
    );
    expect(formatKpi(widget, resultWith(row), mockTranslate, { courseSelected: true, rangeDays: null }).description).toBe(
      'insights.kpi.share_of_cohort:percent=20%'
    );
  });

  it('turns Overdue red from 5% of learners', () => {
    const widget = widgetOf('kpi_overdue');

    expect(formatKpi(widget, resultWith({ is_overdue__count_if: 1, rows__count: 40 }), mockTranslate, { courseSelected: false, rangeDays: null }).trend).toBe('flat');
    expect(formatKpi(widget, resultWith({ is_overdue__count_if: 2, rows__count: 40 }), mockTranslate, { courseSelected: false, rangeDays: null }).trend).toBe('down');
  });

  it('describes Passed first try with who took one and who still has to pass', () => {
    const row = { first_try_pass__pooled: 62.5, took_pass_mark__count_if: 16, has_still_to_pass__count_if: 3 };
    const display = formatKpi(widgetOf('kpi_first_try_pass'), resultWith(row), mockTranslate, { courseSelected: true, rangeDays: null });

    expect(display.value).toBe('63%');
    expect(display.description).toBe('insights.kpi.first_try_context:took=16:still=3');
  });
});

describe('range', () => {
  const selection = { courseId: null, learnerId: null, exerciseId: null, range: '30d' as const };

  it('puts the range only on widgets that follow it', () => {
    const following = { ...widgetOf('scores_by_exercise'), usesRange: true };
    const standing = widgetOf('course_details');

    expect(resolveWidgetSpec(following, selection)?.range).toBe('30d');
    expect(resolveWidgetSpec(standing, selection)?.range).toBe('all');
  });

  it('tags standing cards Now only while a range is selected', () => {
    expect(isNowCard(widgetOf('course_details'), '30d')).toBe(true);
    expect(isNowCard(widgetOf('course_details'), 'all')).toBe(false);
    expect(isNowCard({ ...widgetOf('logins_per_day'), usesRange: true }, '30d')).toBe(false);
  });

  it('offers All time first, then the Marketing ranges', () => {
    expect(rangeOptions(mockTranslate).map((option) => option.value)).toEqual(['all', '7d', '30d', '90d']);
  });

  it('rewords KPIs for a range', () => {
    const logins = formatKpi(
      widgetOf('kpi_logged_in_today'),
      resultOf([{ logged_in_today__count_if: 2, logged_in_period__count_if: 30, rows__count: 40 }]),
      mockTranslate,
      { courseSelected: false, rangeDays: 30 }
    );
    const enrolled = formatKpi(
      widgetOf('kpi_enrolled'),
      resultOf([{ rows__count: 120, enrolled_in_period__count_if: 12 }]),
      mockTranslate,
      { courseSelected: true, rangeDays: 30 }
    );
    const certificates = formatKpi(
      widgetOf('kpi_certificates'),
      resultOf([{ is_certified__count_if: 50, certified_in_period__count_if: 0, is_completed__count_if: 60 }]),
      mockTranslate,
      { courseSelected: false, rangeDays: 7 }
    );

    expect(logins.title).toBe('insights.kpi.logged_in_days:days=30');
    expect(logins.value).toBe('30 / 40');
    expect(enrolled.description).toBe('insights.kpi.enrolled_in_days:count=12:days=30');
    expect(enrolled.trend).toBe('up');
    expect(certificates).toMatchObject({ value: '50', trend: 'flat' });
  });
});

describe('learner selection', () => {
  it('names the selection a widget still needs', () => {
    const widget = widgetOf('learner_courses', {
      filters: [{ field: 'learner', op: 'eq', value: INSIGHTS_PLACEHOLDERS.learner }]
    });

    expect(missingSelection(widget, { courseId: null, learnerId: null, exerciseId: null, range: 'all' })).toBe(
      'learner'
    );
    expect(missingSelection(widget, { courseId: null, learnerId: 'p1', exerciseId: null, range: 'all' })).toBeNull();
  });

  it('reads a learner from a table row', () => {
    expect(toSelectedLearner({ learner_id: 'p1', name__value: 'Ada' })).toEqual({ id: 'p1', name: 'Ada' });
    expect(toSelectedLearner(undefined)).toBeNull();
  });
});

describe('chartedCohorts', () => {
  const seriesKeys = [
    { key: 'c1', label: 'Cohort 1' },
    { key: 'c2', label: 'Cohort 2' },
    { key: 'c3', label: 'Cohort 3' },
    { key: 'c4', label: 'Cohort 4' },
    { key: 'none', label: 'All learners' }
  ];
  const cohorts = resultOf([
    { cohort_id: 'c4', learners__value: 10, completed_learners__value: 2 },
    { cohort_id: 'c3', learners__value: 10, completed_learners__value: 10 },
    { cohort_id: 'c2', learners__value: 10, completed_learners__value: 10 },
    { cohort_id: 'c1', learners__value: 10, completed_learners__value: 10 }
  ]);

  it('charts the 3 newest cohorts and dashes the unfinished ones', () => {
    expect(chartedCohorts(seriesKeys, cohorts, mockTranslate)).toEqual([
      { key: 'c4', label: 'insights.legend.in_progress:name=Cohort 4', dashed: true },
      { key: 'c3', label: 'Cohort 3', dashed: false },
      { key: 'c2', label: 'Cohort 2', dashed: false }
    ]);
  });

  it('falls back to one line for a course without cohorts', () => {
    expect(chartedCohorts([{ key: 'none', label: 'All learners' }], resultOf([]), mockTranslate)).toEqual([
      { key: 'none', label: 'All learners', dashed: false }
    ]);
  });
});

describe('widgetNotes', () => {
  it('shows the reasons note on cohort and course scopes only', () => {
    const widget = widgetOf('needs_attention');

    expect(widgetNotes(widget, null, widgetContext, mockTranslate)).toEqual(['insights.notes.needs_attention']);
    expect(widgetNotes(widget, null, { ...widgetContext, scopeType: 'org' }, mockTranslate)).toEqual([]);
  });

  it('counts the cohorts shown against every cohort', () => {
    const result = resultOf([{ cohort_id: 'a' }, { cohort_id: 'b' }]);

    expect(widgetNotes(widgetOf('cohorts_at_a_glance'), result, widgetContext, mockTranslate)).toEqual([
      'insights.notes.cohorts_at_a_glance:shown=2:total=8'
    ]);
  });

  it('explains an empty first-try column', () => {
    const result = resultOf(
      [{ course_id: 'c1', first_try_pass__pooled: null }],
      [{ key: 'first_try_pass__pooled', label: '', role: 'measure', valueType: 'percent' }]
    );

    expect(widgetNotes(widgetOf('course_details'), result, widgetContext, mockTranslate)).toContain(
      'insights.notes.no_pass_mark'
    );
  });

  it('switches the learners note with the picker and scope', () => {
    const widget = widgetOf('learners');

    expect(widgetNotes(widget, null, widgetContext, mockTranslate)).toEqual(['insights.notes.learners.all_courses']);
    expect(widgetNotes(widget, null, { ...widgetContext, courseSelected: true }, mockTranslate)).toEqual([
      'insights.notes.learners.one_course'
    ]);
    expect(widgetNotes(widget, null, { ...widgetContext, scopeType: 'course' }, mockTranslate)).toEqual([
      'insights.notes.learners.course_scope'
    ]);
  });
});

describe('learnerPageRange', () => {
  it('numbers the learners on the current page', () => {
    expect(learnerPageRange(1, 10)).toEqual({ from: 1, to: 10 });
    expect(learnerPageRange(3, 4)).toEqual({ from: 21, to: 24 });
  });
});

describe('small formatters', () => {
  it('leaves unscored learners out of histograms', () => {
    const result = resultOf(
      [
        { score_bucket_10_id: null, rows__count: 4 },
        { score_bucket_10_id: 7, rows__count: 2 }
      ],
      [{ key: 'rows__count', label: '', role: 'measure', valueType: 'integer' }]
    );

    expect(histogramPoints(result, 'score_bucket_10', mockTranslate)).toHaveLength(1);
  });

  it('formats now-at, exercises passed, question hints, latest score and the growth axis', () => {
    expect(nowAtLabel(100, 'Credits', mockTranslate)).toBe('insights.finished');
    expect(nowAtLabel(40, 'Credits', mockTranslate)).toBe('Credits');
    expect(nowAtLabel(40, null, mockTranslate)).toBe('–');

    expect(exercisesPassedTone(3, 3, 0)).toBe('success');
    expect(exercisesPassedTone(1, 3, 1)).toBe('danger');
    expect(exercisesPassedTone(0, 3, 0)).toBe('muted');

    expect(questionHint('Credits', 'B', mockTranslate)).toBe(
      'insights.question_hint.context_and_answer:context=Credits:answer=B'
    );
    expect(questionHint(null, null, mockTranslate)).toBeUndefined();

    expect(latestScore(resultOf([{ best_score_pct__value: 60 }, { best_score_pct__value: null }]))).toBe(60);

    const points = [{ key: 'w1', label: '', rank: 0, members_total__value: 120 }];
    expect(growthYMax(points, 'members_total__value', 2000, 5000)).toBe(5000);
    expect(growthYMax(points, 'members_total__value', null, null)).toBe(120);
  });
});
```

`pnpm format:changed` wraps the long `formatKpi` lines.

### 7.3 Components

No component tests exist for this feature. Check the components with svelte-check against a baseline (section 9), and with the parity checklist (9.3).

## 8. Help docs (`apps/help/content/help`)

Follow `skills/add-docs-image/SKILL.md` for every screenshot: 1350×830, device scale 1, framed with `pnpm --filter @cio/help frame-screenshot`.

| Article | Changes |
| --- | --- |
| `analytics-and-reporting/track-a-cohort-with-analytics.mdx` | **Opens on All courses**, and the **Course** picker always shows. Describe the chips. Update the KPI table with each card's hint, including "x% of the cohort · N certified". Add **Courses in this cohort** and **Course details** (Completed, Took a pass-mark exercise, Passed first try). **"{name}: courses"** opens on the first learner and has an **Exercises passed** column. One course: **"{name}: scores by exercise"** with its Latest and Progress chips, "Section N" labels, and the scorecard's **Passed first try**. Overdue now has one row per learner, with **Send reminder**, **Remind all N overdue learners** and **Queued**; reminders cover cohort goals only. The Learners table shows 10 per page with page numbers below it, and has **Certificate** and **Now at** columns. Update filter and sort wording. Add **Choose a time range**: the options, the 2.5 rule, the cohort cards that follow the range, the **Now** tag, and "Logged in today" becoming "Logged in, last N days". Retake `overview.webp`, `learners.webp` and `reminders.webp` |
| `analytics-and-reporting/review-course-performance-and-learner-progress.mdx` | KPIs: **Enrolled** "+N this week"; **Completion rate** "pts vs last week"; **Average grade**; **Passed first try** replaces "Required exercises pass rate", with its definition from 1.3; **Median days to finish** counts to completion, not to the certificate. Charts: **Scores by exercise, one line per cohort** (3 newest, with unfinished cohorts dashed); **Score distribution, {exercise}**; drop-off colours and the steepest-fall note; **Hardest exercises** (4, Passed first try); **Cohorts taking this course** (4 newest) plus **Cohort details** (every cohort). Remove the course-wide "Scores by exercise" paragraph; the course page has no such chart. "Pass 70%" becomes "Pass mark 70%". Learners: 10 per page, with page numbers instead of **Show 25 more**. Add **Choose a time range**: all five KPIs and the four score charts follow the range; lesson drop-off, the cohort comparisons, the scorecard and the learners table stay **Now** |
| `analytics-and-reporting/monitor-learners-across-your-organization.mdx` | Chips, including seats. Five KPIs: add **Certificates issued**, and "+N pts this week" on **Average progress**. **Cohorts at a glance**: the 5 newest, a **Created** column, invited counts, and empty cohorts included; delete the "No cohort" paragraph and fix the troubleshooting item about missing cohorts. **Learners by cohort health** is its own card. **Enrolled learners vs target**: 6 weeks, a dashed target, an axis up to the seat limit, and how to **Set target**. Logins cover 7 days. **Average score, by cohort** covers the same 5 cohorts. Add **Choose a time range**: the KPIs (except Needs attention), the growth chart (daily for 7 and 30 days, weekly for 90) and logins follow it; the cohort cards and courses by completion stay **Now** |
| `analytics-and-reporting/read-your-organization-analytics-overview.mdx` | In "Marketing or Analytics?": both pages now have **Last 7/30/90 days**. Analytics adds **All time** (its default), and some Analytics cards always show the current state |
| `reference/glossary.mdx` | Add **Pass mark** (your setting on an exercise), **Passed first try** and **Still to pass** (learner results), with the 1.3 definitions |
| `manage-learners/configure-cohort-goals-and-settings.mdx` | Where it mentions reminders: tutors can send one from **Analytics → Overdue, with reminders**, to a learner or to everyone overdue |

Run `rg -n "Required exercises|required pass|No cohort|Learners added|Show 25 more|Show 10 more|Pass 70%" apps/help` afterwards. It must return nothing.

## 9. Verification

### 9.1 Commands

Use the `.nvmrc` Node version (24.22.1 on this branch). **Do not build the dashboard with Vite.**

```bash
export PATH="$HOME/.nvm/versions/node/v24.22.1/bin:$PATH"
pnpm --filter @cio/utils test
pnpm --filter @cio/api^... build && pnpm --filter @cio/api build
pnpm --filter @cio/api exec vitest run src/__tests__/insights-*.test.ts src/__tests__/routes-insights.test.ts src/__tests__/services-insights-*.test.ts src/__tests__/services-cohort-goal.test.ts
pnpm --filter @cio/dashboard exec vitest run src/lib/features/insights
cd apps/dashboard && pnpm dlx svelte-check@4 --threshold error --output machine > /tmp/svelte-check-after.txt
```

- **svelte-check:** compare the result with a baseline taken on the base commit. The repo has existing errors, so a pass means no new error in `features/insights`, `features/ui/analytics` or `features/cohort/api`.
- **Translations:** run `cd apps/dashboard && pnpm translate`, then check the placeholders.
- **Formatting:** run `pnpm format:changed`, then `pnpm format:check`.
- **Migrations:** confirm `git diff --stat main -- packages/db/src/migrations` lists only `0039_insights_performance_indexes.sql` and the journal.

### 9.2 Manual run

Start the API and dashboard (`pnpm api:dev`, `pnpm dashboard:dev`). Sign in as `admin@test.com` / `123456` in the **udemy-test** org, and check:

1. **Org analytics:**
   - **Cohort 2**, which has courses and no students, appears in **Cohorts at a glance** with 0 learners and "–" health.
   - No "No cohort" row anywhere.
   - **Set target** to 3: the dashed line appears without a reload, and survives a reload. **Remove target** clears it.
2. **A cohort with one course:** the page opens on **All courses**, the picker shows, and "{first learner}: courses" is filled in.
3. **A course whose exercise has pass mark 79:** the HIPAA quiz in **coursera-test**. Sign in as `enterprise@test.com`, with students `enterprise-student@test.com` and one you enrol.
   - Submit 60 then 90 as a student, and grade both. **Passed first try** is 0%, and the learner is not "still to pass".
   - Submit 60 as a second student and grade it. **Still to pass** is 1, and Passed first try stays 0% with 2 graded first attempts.
4. **A course with no pass-mark exercise:** the Passed first try cells read "–", the note explains why, and the KPI is hidden.
5. **Learners pages:** with more than 10 matching learners, page numbers appear under the table. Page 2 shows "Showing 11–20 of N". Changing a filter returns to page 1. While a page is open, the 30-second refresh keeps it in place without dimming it.
6. **Reminders:** **Send reminder** turns into **Queued**; **Remind all** turns every row into **Queued**. Rows for overdue exercises without a goal show no button.
7. **Range,** on each scope:
   - Pick **Last 7 days**. Only the cards in 2.5's table refetch; DevTools shows no new request for a Now card. Every other card shows the **Now** tag.
   - With an attempt older than 7 days, the 7-day average score leaves it out, and **All time** includes it.
   - Picking **All time** brings back exactly the earlier numbers and titles ("Logged in today", "+N this week").
   - Open another analytics page: the range is still selected.
   - Marketing's range buttons still work and look the same.

### 9.3 Prototype parity checklist

Open the prototype in customer mode beside the app. Tick each line in both light and dark themes, and at 375px width.

**Cohort, All courses**
- [ ] Chips: live with interval, cohort · description, learners, courses
- [ ] Picker row "Course [All courses]" above the KPIs
- [ ] KPIs: Logged in today "n / N" "x% of the cohort"; Average progress; Average score; Overdue (red at 5% or more); Completed "x% of the cohort · N certified"
- [ ] Courses in this cohort (7) + Learners by status (5, total in the centre)
- [ ] Course details (12) with seven columns and its note
- [ ] "{name}: courses" (12), preselected, with Exercises passed and its note
- [ ] Needs attention (5), toned, with its note + Overdue, with reminders (7)
- [ ] Learners (12) without exercise columns; Certificate column; footer "Showing 1–10 of N matching · N learners in cohort"; 10 per page with numbered pages; note
- [ ] Logins per day (6) + Average score distribution (6), notes on both

**Cohort, one course**
- [ ] KPIs: same five; Completed without "certified"
- [ ] Scores by exercise, {course} (7) + Progress distribution (5), labels 0–25…Done
- [ ] "{name}: scores by exercise" (7) with its chips, the dashed cohort average and its note + Learners by status (5)
- [ ] Scores and attendance by section (7), "Section N" + Average score distribution (5), labels <50…90+
- [ ] Section-by-section scorecard (12): "Section N · title", n / N, heat cells, note
- [ ] Needs attention (5) + Overdue (7)
- [ ] Hardest questions (12): "{section} · most common wrong answer: X", note
- [ ] Learners (12) with Now at, exercise columns with pass-mark tags, Trend, Certificate
- [ ] Logins per day (12)

**Course**
- [ ] Chips: live, title, Cohorts: n, learners (no Range chip, pending the 0.3 decision)
- [ ] KPIs: Enrolled "+N this week"; Completion rate "±N pts vs last week"; Average grade; Passed first try (only with a pass-mark exercise); Median days to finish
- [ ] One line per cohort (7, newest 3, unfinished dashed "(in progress)") + Score distribution, {exercise} (5) with its picker
- [ ] Lesson drop-off (6), toned, steepest-fall note + Hardest exercises (6), 4 bars
- [ ] Hardest questions (12)
- [ ] Cohorts taking this course (12), 4 newest, "Showing 4 of N cohorts."
- [ ] Cohort details (12), every cohort, no "No cohort"
- [ ] Needs attention, section scorecard and learners (rows open the learner's course profile)

**Organization**
- [ ] Chips: live, org name, "n active cohorts", "Seats: used of limit" (when the plan has a limit)
- [ ] KPIs: Logged in, last 7 days; Average progress "±N pts this week"; Completions "x% of enrolled"; Certificates issued "x% of completions"; Needs attention (red at 5% or more)
- [ ] Cohorts at a glance (8): Created, invited counts, heat score, pill, link, "Showing 5 of N…" + Needs attention (4), no note
- [ ] Learners by cohort health (5): total in the centre, "The 5 cohorts in the table above." + Enrolled learners vs target (7): 6 weeks, dashed target, seat-limit axis, Set target
- [ ] Logins per day (7), line, 7 days + Average score, by cohort (5), same 5 cohorts
- [ ] Courses by completion (12)

**Range (every scope)**
- [ ] Picker beside Refresh: All time (default), Last 7 days, Last 30 days, Last 90 days; Marketing's look
- [ ] All time matches every line above exactly
- [ ] Under a range, the cards in 2.5's table change and every other card shows **Now** with its tooltip
- [ ] Cohort: "Logged in, last N days"; Average progress "±N pts in the last N days"; Average score "attempts in the last N days"; Completed "x% of the cohort · +N in the last N days"
- [ ] Course: Enrolled "+N in the last N days"; Completion rate "±N pts vs N days ago"; Passed first try "of N graded in the last N days"; Median days "for completions in the last N days"
- [ ] Org: "Logged in, last N days"; Completions and Certificates issued "+N in the last N days"; growth chart daily for 7 and 30 days, weekly for 90; logins chart draws as a line past 31 days
- [ ] Changing the range refetches only the range cards

**Everywhere**
- [ ] No subtitle under the title; Refresh in the header
- [ ] Paired widgets send one request (DevTools network: a single `/insights/query` per identical spec)
- [ ] Every learner-result column says "Passed first try", "Still to pass", "Exercises passed" or "Took a pass-mark exercise", with its tooltip. The only setting label is "Pass mark"
- [ ] Nothing shows "Final exam", "Required", "No cohort", "Scheduled reports" or "Planned"
