# Insights Analytics PRD

> **UI reference:** the clickable prototype at [`prototypes/insights-analytics/`](../../prototypes/insights-analytics/index.html) shows the cohort, course and organization dashboards with sample data. Every widget carries its metric spec and a data-availability badge. This file covers scope, data, API and sequencing.

## Purpose

Give admins, tutors and executives live learner analytics at three levels (a **cohort**, a **course** and the whole **organization**) from one shared definition, without hard-coding a chart per page. Dashboards are built from stored **query specs** over a small registry of metrics, so the same widget works at every scope and users can later build their own.

## Problem Statement

Enterprise training teams run many cohorts of learners at once and need to answer, without downloading files:

- Where is each learner right now, and who needs help today?
- How are scores moving across the exercises in a course, up to the final exam?
- How do cohorts compare, and how is the whole programme doing?

What exists today falls short:

1. **No cohort analytics.** Cohorts have people, newsfeed and goals, but no analytics view.
2. **Course analytics does not scale.** `getCourseAnalytics` (`packages/core/src/services/course/course.ts`) builds a row per student in JS before averaging.
3. **Org analytics is marketing-shaped.** `analytics_org_daily` and `analytics_course_daily` hold views, enrollments and completions as daily counters, not learner performance.
4. **Every chart is a bespoke component.** Adding a metric means new API, new query and new UI.

The prospect that prompted this runs about 5,000 contract learners in cohorts of about 250, with several cohorts running in parallel and starting on different days. Their bar is real-time cohort analytics that a CEO can open without downloading anything.

## Confirmed Decisions

1. **One spec, three scopes.** A widget is a query spec plus a viz type. Scope (`org`, `course`, `cohort`) is a filter, not a different widget.
2. **Presets are data, not components.** Built-in dashboards ship as JSON specs in code. A later builder only persists and edits the same shape.
3. **Registry, not raw SQL.** Users combine whitelisted metrics, dimensions and filters. The server compiles specs to parameterized SQL and injects tenant and scope filters.
4. **Live queries with a short cache.** Learner performance is read live from source tables with a 30- to 60-second Redis cache (`cachedRead`). No new rollup tables in v1.
5. **Exercises are shown by name, in course order.** There is no pre-assessment or module label. The only special exercise is the **final exam**, which the course already designates for its certificate. No schema change (see below).
6. **Show only what we can compute.** Where the data is not collected yet, a ticket tracks collecting it, the dashboard does not show the widget, the section here is marked **Blocked by** that ticket, and its implementation items stay commented out until the ticket ships (see Blocked Sections).

## Exercises and the Final Exam

Every score view shows a course's exercises as columns, using the real exercise title, ordered by section `order`, then exercise `order`. There are no generic labels such as "pre" or "module". The names come from the course.

The **final exam** is explicit, not positional. It is the exercise the course already requires for its certificate:

- Exercise: `course.certificate.requiredExerciseId`.
- Pass mark: `course.certificate.exerciseMinScorePercent` (compliance courses fall back to `course.compliance.passingScore`; the default is 100).
- It is tagged "Final exam" with its pass mark. If a course has no required exercise, nothing is tagged and there is no final-exam pass rate.

| Case | Rule |
| --- | --- |
| Exercise reordered or added | Columns follow the new order. Scores stay attached to the same exercise |
| Locked exercises (`isUnlocked = false`) | Not shown as columns. `isUnlocked` belongs to the exercise, not to a cohort or learner, so it says nothing about which cohort has reached what. The final exam column is kept even when it is locked, so its tag and pass mark are never lost |
| Score percent | Best completed attempt: `submission.total` over the sum of `question.points`, counting only `gradingState = completed`. This matches how certification checks the final exam (`evaluateFinalExerciseRule`) |
| Awaiting manual grade | Shown as "awaiting grade", never as zero |
| Pass | Final exam uses `exerciseMinScorePercent`. Other exercises use `exercise.passThreshold` when set |

## Cohorts with Several Courses

A cohort can have several courses (`cohort_course`), and each course has its own exercises, so one set of score columns cannot cover them. The cohort dashboard has a **course picker**:

- **All courses (default).** KPIs and needs-attention are cohort level. A "Courses in this cohort" table shows learners, average progress, average score, completed, final exam taken and final exam pass rate per course. Overall progress and average score are pooled across the learner's courses, not averages of per-course percentages: progress is completed lessons and exercises over total lessons and exercises, and average score is points earned over points possible across the exercises the learner has taken (best completed attempt), so a short course does not weigh the same as a long one. The learners list has one row per learner with overall progress, average score, courses completed (for example "1 of 3"), video and classroom attendance, certificate, last login and status. Clicking a learner opens a panel listing their courses: progress, current section, average score and final exam score against the pass mark.
- **One course.** The learners list shows that course's exercises as columns, with the final exam tagged. Scores by exercise, learner score progression, the section-by-section scorecard and the hardest questions all switch to that course.
- **Overdue.** The list shows which course each learner is late on, and filters to the picked course.

## Section Scorecard Rules

The section-by-section scorecard has one row per `course_section`, ordered by `order`. Exercises join to a section through `exercise.section_id` and lessons through `lesson.section_id`. Items without a section are listed under "Other", last.

- **Exercise grain.** For exercise metrics, one row per learner and exercise, holding the best completed attempt (score percent as defined above). Exercise rollups start from this grain, so multiple attempts cannot duplicate results.
- **Attendance grain.** Video and classroom attendance are computed independently at learner-and-section grain, not from the exercise rows. A learner with attendance records but no completed exercise still counts in the attendance averages. The scorecard row joins the exercise and attendance results by section.
- **Exercises taken.** Learners with a completed attempt on every exercise in the section.
- **Average score.** For each learner who took the section, the mean of their exercise scores in it. The row value is the mean across those learners, so each learner counts once.
- **Pass rate.** The share of learners who took the section and met the pass mark on every exercise in it that has one. Exercises with no pass mark are ignored. A section with no pass mark shows "–".
- **Video attendance.** A lesson with video counts as watched when every one of its video assets has `lesson_video_progress.is_complete = true`. Assets collapse to the lesson first, so several assets cannot duplicate a lesson. A learner's value is watched lessons over lessons with video in the section, and the row value is the mean across the cohort's learners. `watched_seconds` is not used: it is cumulative and cannot be split by day.
- **Classroom attendance.** From `group_attendance` (one row per learner and lesson where attendance was taken) for lessons in the section: present rows over recorded rows for the cohort's learners. Lessons with no attendance taken are not counted as absent.

## Current-State Audit

| Capability | Today | Where |
| --- | --- | --- |
| Cohort ↔ learners ↔ courses | `cohort`, `cohort_member`, `cohort_course`. Per-course progress lives on `groupmember` | `packages/db/src/schema.ts` |
| Cohort start date | **None.** `cohort` has `createdAt` only. Not needed: cohorts are compared by course section, not by calendar day | `schema.ts` (`cohort`) |
| Scores | `submission.total`, `question_answer.point`, `question.points` (the maximum), `exercise.passThreshold`, `exercise.dueBy` | `schema.ts` |
| Final exam | `course.certificate.requiredExerciseId` with `exerciseMinScorePercent`. Certification already scores it as best completed attempt over maximum points | `schema.ts` (`course.certificate`), `apps/api/src/services/course/completion.ts` |
| Course deadline and progress threshold | `course.certificate.deadline` and `course.certificate.threshold` | `schema.ts` (`course.certificate`) |
| Lesson progress | `lesson_completion` | `schema.ts` |
| Video attendance | `lesson_video_progress.watched_seconds`, `is_complete` (cumulative per lesson, no per-day split) | `schema.ts` |
| Classroom attendance | `group_attendance.is_present`, tutor-marked per lesson | `schema.ts` |
| Deadlines and overdue | `cohort_goal_assignment` per learner (`due_date`, status including `at_risk` and `overdue`, completed and required counts), `course_completion_record.due_date` (compliance courses), `exercise.dueBy` | `schema.ts` |
| Reminders | Cohort goals send scheduled reminder emails to the learner (`runCohortGoalReminderScan`, `reminderDaysBefore`). No supervisor copy (#1302) and no manual "send now" | `apps/api/src/services/cohort/goal.ts` |
| Supervisor of a learner | **None** (tracked in #1302) | n/a |
| Certificates | `course_certificate_issue` | `schema.ts` |
| Logins | `analytics_login_events`, one row per user per day | `schema.ts` |
| Page events | Marketing events only (landing, course page, sign-in, pricing, CTA, enrollment, completion, certificate). **No lesson or exercise events** (tracked in #1299) | `packages/analytics/src/events/taxonomy.ts` |
| Time spent | `course_completion_record.time_spent_minutes` exists but is **always written as 0** | `apps/api/src/services/course/compliance.ts` |
| Last active | Member last-active timestamp bumped from page events | `queries/analytics/analytics.ts` |
| Public API | `v1/analytics` routes for org, course and learner summaries | `apps/api/src/routes/v1/analytics` |

## Product Goals

1. A cohort dashboard a trainer can use all day: search and filter 250 learners, see each learner's score progression, spot who needs attention.
2. The same widgets on a course (across its cohorts) and on the organization (across cohorts).
3. Data fresh enough to call "live", with a visible last-updated indicator.
4. A path to user-built dashboards without a rewrite.
5. CSV export of any table with the current filters applied.

### Non-Goals (v1)

- User-built widgets and dashboards (Phase 2).
- Custom formula metrics (Phase 3).
- A simulation or practice-case feature. It is a separate product feature, not part of analytics.
- Replacing the compliance pages. They stay as they are. The course analytics page is replaced (see Placement and What It Replaces).

## Concepts

- **Scope:** `{ type: 'org' | 'course' | 'cohort', id }`. The resolver turns it into learner ids and course ids. Cohort scope is the cohort's student members joined to the cohort's courses through `groupmember`. Pending members (no `profileId`) are excluded and counted separately.
- **Metric registry:** code-defined and typed. Each metric has an id, a translation key, a value type, a source and a SQL expression.
- **Sources (v1):** `learner_course` (progress, status, due date), `assessment_result` (score per learner and exercise, passed), `activity` (video and classroom attendance, last login).
- **Query spec:** validated with Zod against the registry. Returns a single shape, `{ columns, rows }`.
- **Widget:** a spec plus a viz (`kpi`, `bar`, `line`, `table`, `matrix`, `distribution`).
- **Dashboard preset:** an ordered list of widgets for a scope type.

```jsonc
{
  "source": "assessment_result",
  "measures": [{ "metric": "score_pct", "agg": "avg" }],
  "dimensions": ["exercise"],
  "filters": [{ "field": "course", "op": "eq", "value": "<courseId>" }],
  "sort": [{ "field": "exercise_order" }],
  "viz": { "type": "line" }
}
```

## Dashboards by Scope

Badges match the prototype: **Available** (already stored), **Derived** (computed from stored data), **Needs work** (a feature to build, not missing data). Widgets whose data is not collected yet are **Blocked by** a ticket. They are not shown in the prototype and are listed under Blocked Sections.

### Cohort

| Widget | Data | Status |
| --- | --- | --- |
| Logged in today | `analytics_login_events` | Available |
| Average progress, average latest score, completed | `lesson_completion`, `submission` | Derived |
| Overdue | `cohort_goal_assignment` (`due_date`, status), `course_completion_record.due_date`, `exercise.dueBy` | Derived |
| Scores by exercise (course order, with middle 50% band) | `submission`. The final exam is the course's required exercise | Derived |
| Courses in this cohort (all-courses view) | `lesson_completion`, `submission`, grouped by course | Derived |
| Progress distribution | `lesson_completion` | Derived |
| Learner score progression (selected learner vs cohort average) | `submission` | Derived |
| Section-by-section scorecard (one row per course section: tests, avg score, pass rate, video and classroom attendance) | `submission`, `lesson_video_progress`, `group_attendance`, grouped by `course_section` | Derived |
| Needs attention, by reason | derived flags | Derived |
| Hardest questions | `question_answer` | Available |
| Learners logged in per day | `analytics_login_events` | Available |
| Learners: search, status, last login, average score and flag filters, sort, export (per course or all courses) | all of the above | Derived |
| Overdue list with "send reminder now" | `cohort_goal_assignment`, reminder email | Needs work (manual send action) |
| Scheduled reports | saved dashboard, scheduler | Needs work |
| Learning time per day against 5–6 hours | time on lesson | **Blocked by #1299** |
| Supervisor copied on reminders | supervisor of a learner | **Blocked by #1302** |

### Course

Enrolled, completion rate, average grade, final pass rate (against the course's pass mark), median days to finish (enrolment to completion). Scores by exercise with one line per cohort, final-exam histogram, lesson drop-off, hardest tests, hardest questions, cohorts taking this course.

### Organization

Logged in (7 days), average progress, completions, certificates issued, needs attention. Cohorts at a glance, needs attention by reason, final exam average by cohort, hiring ramp, courses by completion. Peak concurrent learners is **blocked by #1299**. Scheduled reports and a read-only executive login need product decisions.

## Blocked Sections

Each section below needs data the product does not collect today. A ticket tracks collecting it. The section is not built, and not shown in the prototype, until its ticket ships.

| Section | Blocked by | What is missing |
| --- | --- | --- |
| Cohort: learning time per day against 5–6 hours | #1299 | Active time in lessons and exercises. `time_spent_minutes` is always 0 and lesson pages send no events |
| Organization: peak concurrent learners | #1299 | The same heartbeat, counted per time bucket |
| Reminders that copy a supervisor | #1302 | A supervisor relationship for each learner |

## Placement and What It Replaces

| Scope | Where it lives | What happens to what exists today |
| --- | --- | --- |
| Cohort | A new "Analytics" tab at `/cohorts/[id]/analytics`, beside newsfeed, people, courses and settings | Nothing exists today, so nothing is replaced |
| Course | `/courses/[id]/analytics`, the existing "Analytics" item in the course sidebar | **Replaced.** Same route and nav item, new content. The new course dashboard covers what the page shows today: course KPIs and the per-student table, with filters and export |
| Organization | `/org/[slug]/analytics`, labelled "Analytics" in the org navigation | The page at that path today shows landing-page and marketing stats (views, enrollments, funnel, countries, top courses). It is **renamed "Marketing"** and moves to `/org/[slug]/marketing`. The new learner dashboard takes the "Analytics" name and path |

Unchanged: the course and organization compliance pages, course marks, course attendance, and the per-user analytics in the audience page. The audience page links into the new learner list.

Notes for the change:

- **API stays.** `GET /course/:courseId/analytics` and the `v1/analytics` routes keep serving the public API and MCP. Only the dashboard page is replaced, and the page moves onto `/insights`.
- **Navigation and copy.** The org navigation (`org-navigation.ts`) gets a new "Marketing" item for the renamed page and keeps "Analytics" for the new one. The `org_navigation` translation keys change in `en.json`, so every other dashboard locale needs updating (see the translation rule in `CLAUDE.md`).
- **Order.** The rename ships first and on its own (Phase 0), so the Analytics path is free before the new dashboard arrives. Anyone with a bookmark to the old marketing page lands on the new Analytics page after Phase 1, so release notes should say so.

## Architecture

Follows the layering in `CLAUDE.md`:

1. **Validation:** `packages/utils/src/validation/insights/` holds the spec, result and dashboard schemas.
2. **Queries:** `packages/db/src/queries/insights/` holds the registry, scope resolver and compiler. The folder is named `insights` because `queries/analytics` is page events and `queries/report` is content moderation. Each query accepts an optional `DbOrTxClient` and logs the original error with its function name.
3. **Service:** `apps/api/src/services/insights/` handles authorization, caching (`cachedRead`, key = spec hash + scope) and orchestration. It throws `AppError`.
4. **Routes:** one `/insights` root mounted in `app.ts`.
   - `POST /insights/query` returns `{ columns, rows }` (one type).
   - `GET /insights/dashboards/:scopeType/:scopeId` returns the preset specs.
   - Authorization is scope-aware and runs in the service. The existing `cohortTeamMemberMiddleware` and `courseTeamMemberMiddleware` read `cohortId` and `courseId` from the path, and these routes do not have those params, so the routes use `authMiddleware` only. The service reuses the underlying queries: `getCohortMemberRole` and `isOrgAdminByCohortId` for cohort scope, `isCourseTeamMemberOrOrgAdmin` for course scope, and an org admin check for org scope.
5. **Dashboard app:** `apps/dashboard/src/lib/features/insights/` with API class, `utils/types.ts` inferred from the RPC client, widget components, and a dashboard tab on cohort, course and org pages.
   - Charts use the browser-only dynamic import (see Chart Imports and SSR in `CLAUDE.md`).
   - All copy goes through translations.
   - Filters and search follow the live-update form rules (`DebouncedSearch` for server-backed search).
6. **Public API and MCP (Phase 3):** expose `POST /insights/query` through `v1/analytics` with the existing scopes.

### Security

- The compiler accepts only whitelisted metrics, dimensions and filter fields. No raw SQL.
- The organization id and scope are injected server-side. A spec can never widen them.
- Cohort and course access is checked per scope. Learners never see these dashboards.
- Export applies the same filters and the same authorization as the table.

### Performance

- Aggregate in SQL. Do not build per-student rows in JS.
- Target: a 250-learner cohort dashboard under one second warm, and an org rollup over 5,000 learners using grouped queries and the 30- to 60-second cache.
- Add indexes only after measuring against a seeded 5,000-learner org.

## Schema Changes

Phase 1 needs no schema change.

Phase 2 adds an `insights_dashboard` table (`org_id`, `scope_type`, `definition jsonb`, schema version).

## Implementation Plan

### Phase 0: rename the marketing page

- [ ] Rename the org "Analytics" page to "Marketing": route `/org/[slug]/marketing`, org navigation item and `org_navigation` translation keys, and all dashboard locales.
- [ ] Rename the `features/analytics` folder to `features/marketing` so it is not confused with the new learner analytics.

### Phase 1: cohort scope, then course and org

- [ ] Spec, result and dashboard Zod schemas.
- [ ] Scope resolver (cohort, course, org) with tenant-isolation tests.
- [ ] Registry: `learner_course`, `assessment_result`, `activity` sources and about 15 metrics.
- [ ] Exercise ordering (section order, then exercise order) and final-exam resolver (`course.certificate.requiredExerciseId`) with edge-case tests.
- [ ] Query compiler and `POST /insights/query`, plus preset dashboards endpoint.
- [ ] Widgets: KPI, line with band, bar and distribution, matrix table, horizontal bar.
- [ ] Cohort dashboard: KPIs, course picker, courses table (all courses), scores by exercise, progress distribution, learner score progression, section-by-section scorecard, needs attention, hardest questions, logged in per day, learner matrix with search, filters, sort and CSV export.
- [ ] Last-updated indicator and 30 second auto-refresh.
- [ ] Course dashboard and organization dashboard from the same widgets.
- [ ] Placement: new `/cohorts/[id]/analytics` tab, new `/org/[slug]/analytics` page, and the course analytics page at `/courses/[id]/analytics` replaced (remove its old components and export utils once the new page ships).
- [ ] Rollback-sensitive and cache tests, and a seeded 5,000-learner performance check.

<!--
Blocked by #1299 (time-on-lesson tracking, https://github.com/classroomio/classroomio/issues/1299).
Nothing stores active learning time today: `course_completion_record.time_spent_minutes` is always written as 0,
lesson pages send no events, and `lesson_video_progress.watched_seconds` is video-only and cumulative.

- [ ] Cohort widget "Learning time per day against 5–6 hours":
  - source `time on lesson` (new), measure `active_minutes` summed, dimensions learner and day
  - column chart per day with a target line, plus a list of learners under target
  - the target (for example 5 to 6 hours) is a per-dashboard setting, not a constant
- [ ] Organization widget "Peak concurrent learners": distinct learners with a heartbeat per time bucket, max per hour

Blocked by #1302 (supervisor of a learner, https://github.com/classroomio/classroomio/issues/1302).

- [ ] Copy the learner's supervisor on overdue reminders
-->

### Phase 2: user-built dashboards

- [ ] `insights_dashboard` table and CRUD.
- [ ] Widget editor limited to registry metrics, dimensions and filters.
- [ ] Clone and edit presets, per scope type.

### Phase 3: extensibility

- [ ] Custom metrics as formulas over registry metrics (for example final exam score minus the first exercise score).
- [ ] Scheduled email digests and threshold alerts.
- [ ] Read-only share links or a viewer role for executives.
- [ ] Expose `POST /insights/query` through the public API and MCP.

## Open Decisions

1. **Executive access.** Admin account for now, or a read-only viewer role in Phase 3.
2. **Classroom attendance rows.** Confirm whether tutors create a `group_attendance` row for absent learners or only mark present ones. That decides the denominator.
3. **Retakes.** Best completed attempt, as certification does. Confirm whether a "latest attempt" option is needed.
4. **Needs-attention thresholds.** No login for 2 or more days, average score under 50%, overdue, video attendance under 60% are placeholders.
5. **Blocked sections.** Time tracking (#1299) and supervisor (#1302) each have their own open questions, tracked in those issues.

## Success Criteria

1. A trainer can find any learner in a 250-person cohort by name and see their score progression in two interactions.
2. The same widget renders at cohort, course and organization scope from one spec.
3. Every number on a dashboard is reproducible by its metric spec.
4. No widget is shown for data that does not exist.
