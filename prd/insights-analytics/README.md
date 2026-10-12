# Insights Analytics PRD

> **UI reference:** the clickable prototype at [`prototypes/insights-analytics/`](../../prototypes/insights-analytics/index.html) shows the cohort, course and organization dashboards with sample data. Every widget carries its metric spec and a data-availability badge. This file covers scope, data, API and sequencing.

## Purpose

Give admins, tutors and executives live learner analytics at three levels (a **cohort**, a **course** and the whole **organization**) from one shared definition, without hard-coding a chart per page. Dashboards are built from stored **query specs** over a small registry of metrics, so the same widget works at every scope and users can later build their own.

## Problem Statement

Enterprise training teams run many batches of learners at once and need to answer, without downloading files:

- Where is each learner right now, and who needs help today?
- How are scores moving from the pre-assessment, through each module test, to the final?
- How do batches compare, and how is the whole programme doing?

What exists today falls short:

1. **No cohort analytics.** Cohorts have people, newsfeed and goals, but no analytics view.
2. **Course analytics does not scale.** `getCourseAnalytics` (`packages/core/src/services/course/course.ts`) builds a row per student in JS before averaging.
3. **Org analytics is marketing-shaped.** `analytics_org_daily` and `analytics_course_daily` hold views, enrollments and completions as daily counters, not learner performance.
4. **Every chart is a bespoke component.** Adding a metric means new API, new query and new UI.

The prospect that prompted this runs about 5,000 contract learners in batches of about 250, with several batches running in parallel and starting on different days. Their bar is real-time batch analytics that a CEO can open without downloading anything.

## Confirmed Decisions

1. **One spec, three scopes.** A widget is a query spec plus a viz type. Scope (`org`, `course`, `cohort`) is a filter, not a different widget.
2. **Presets are data, not components.** Built-in dashboards ship as JSON specs in code. A later builder only persists and edits the same shape.
3. **Registry, not raw SQL.** Users combine whitelisted metrics, dimensions and filters. The server compiles specs to parameterized SQL and injects tenant and scope filters.
4. **Live queries with a short cache.** Learner performance is read live from source tables with a 30 to 60 second Redis cache (`cachedRead`). No new rollup tables in v1.
5. **Assessment roles are position-based.** No schema change to mark pre-assessments, module tests or finals (see below).
6. **Show only what we can compute.** Widgets without data are not shown. They stay in this document, commented out in the implementation plan, with the issue that unblocks them.

## Assessment Roles (position-based)

Within a course, order exercises by section `order`, then exercise `order`:

- The first exercise is **Pre**.
- The last exercise is **Final**.
- Everything between is **Mod 1, Mod 2, …** in order.

The dashboard shows the real exercise title with the role as a label. The role is derived and never stored.

| Case | Rule |
| --- | --- |
| One exercise in the course | It is **Final** only |
| Two exercises | **Pre** and **Final** |
| Three or more | **Pre**, **Mod 1..n**, **Final** |
| Exercise reordered or added | Roles shift. Scores stay attached to the same exercise, only the labels move |
| Locked exercises (`isUnlocked = false`) | Excluded, so batches that have not reached them show no empty columns |
| Cohort with several courses | Roles are computed per course and the score chart groups by course |
| Retakes (`allowMultipleAttempts`) | Best attempt by default, latest as a per-widget option |

"Learning day" is assumed to be one **course section**. This must be confirmed with the customer.

## Current-State Audit

| Capability | Today | Where |
| --- | --- | --- |
| Cohort ↔ learners ↔ courses | `cohort`, `cohort_member`, `cohort_course`. Per-course progress lives on `groupmember` | `packages/db/src/schema.ts` |
| Cohort start date | **None.** `cohort` has `createdAt` only | `schema.ts` (`cohort`) |
| Scores | `submission.total`, `question_answer.point`, `exercise.passThreshold`, `exercise.dueBy` | `schema.ts` |
| Lesson progress | `lesson_completion` | `schema.ts` |
| Video attendance | `lesson_video_progress.watched_seconds`, `is_complete` (cumulative per lesson, no per-day split) | `schema.ts` |
| Classroom attendance | `group_attendance.is_present`, tutor-marked per lesson | `schema.ts` |
| Deadlines | `course_completion_record.due_date` (compliance courses), `exercise.dueBy` | `schema.ts` |
| Certificates | `course_certificate_issue` | `schema.ts` |
| Logins | `analytics_login_events`, one row per user per day | `schema.ts` |
| Page events | Marketing events only (landing, course page, sign-in, pricing, CTA, enrollment, completion, certificate). **No lesson or exercise events** | `packages/analytics/src/events/taxonomy.ts` |
| Time spent | `course_completion_record.time_spent_minutes` exists but is **always written as 0** | `apps/api/src/services/course/compliance.ts` |
| Last active | Member last-active timestamp bumped from page events | `queries/analytics/analytics.ts` |
| Public API | `v1/analytics` routes for org, course and learner summaries | `apps/api/src/routes/v1/analytics` |

## Product Goals

1. A cohort dashboard a trainer can use all day: search and filter 250 learners, see each learner's score progression, spot who needs attention.
2. The same widgets on a course (across its cohorts) and on the organization (across batches).
3. Data fresh enough to call "live", with a visible last-updated indicator.
4. A path to user-built dashboards without a rewrite.
5. CSV export of any table with the current filters applied.

### Non-Goals (v1)

- User-built widgets and dashboards (Phase 2).
- Custom formula metrics (Phase 3).
- A simulation or practice-case feature. The "ready for the floor" widget counts exercise submissions against a target and needs a product decision before it ships.
- Replacing the existing course analytics and compliance pages. They migrate onto presets later.

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
  "filters": [{ "field": "exercise_role", "op": "in", "value": ["pre", "module", "final"] }],
  "time": { "relativeTo": "cohort_start", "bucket": "day" },
  "sort": [{ "field": "exercise_order" }],
  "viz": { "type": "line" }
}
```

## Dashboards by Scope

Badges match the prototype: **Available** (already stored), **Derived** (computed from stored data), **Needs work** (new tracking or a product decision).

### Cohort

| Widget | Data | Status |
| --- | --- | --- |
| Logged in today | `analytics_login_events` | Available |
| Average progress, average latest score, completed | `lesson_completion`, `submission` | Derived |
| Overdue | `exercise.dueBy`, `course_completion_record.due_date` | Derived |
| Score journey (pre to final, with middle 50% band) | `submission` by exercise position | Derived |
| Progress distribution, improvement since pre-assessment | `lesson_completion`, `submission` | Derived |
| Learner score progression (selected learner vs batch average) | `submission` | Derived |
| Day-by-day scorecard (tests, avg score, pass rate, video and classroom attendance) | `submission`, `lesson_video_progress`, `group_attendance`, by section | Derived |
| Needs attention, by reason | derived flags | Derived |
| Video watch time per lesson | `lesson_video_progress` | Available |
| Hardest questions | `question_answer` | Available |
| Learners logged in per day | `analytics_login_events` | Available |
| Learner matrix: search, status, last login, latest score and flag filters, sort, export | all of the above | Derived |
| Overdue with reminders | deadlines, reminder email | Needs work (supervisor field) |
| Ready for the floor | `submission`, certificates, practice cases | Needs work (product decision) |
| Scheduled reports | saved dashboard, scheduler | Needs work |

### Course

Enrolled, completion rate, average grade, final pass rate, median days to finish (enrolment to completion). Score journey by cohort, final-exam histogram, lesson drop-off, hardest tests, hardest questions, cohorts taking this course.

### Organization

Logged in (7 days), average progress, completions, certificates issued, needs attention. Batches at a glance, needs attention by reason, pre vs final by batch, hiring ramp, courses by completion. Batches compared at the same day needs `cohort.startsAt`. Scheduled reports and a read-only executive login need product decisions.

## Architecture

Follows the layering in `CLAUDE.md`:

1. **Validation:** `packages/utils/src/validation/insights/` holds the spec, result and dashboard schemas.
2. **Queries:** `packages/db/src/queries/insights/` holds the registry, scope resolver and compiler. The folder is named `insights` because `queries/analytics` is page events and `queries/report` is content moderation. Each query accepts an optional `DbOrTxClient` and logs the original error with its function name.
3. **Service:** `apps/api/src/services/insights/` handles authorization, caching (`cachedRead`, key = spec hash + scope) and orchestration. It throws `AppError`.
4. **Routes:** one `/insights` root mounted in `app.ts`.
   - `POST /insights/query` returns `{ columns, rows }` (one type).
   - `GET /insights/dashboards/:scopeType/:scopeId` returns the preset specs.
   - Access reuses the cohort-team-member and course-team middleware.
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
- Target: a 250-learner cohort dashboard under one second warm, and an org rollup over 5,000 learners using grouped queries and the 30 to 60 second cache.
- Add indexes only after measuring against a seeded 5,000-learner org.

## Schema Changes

One migration for the whole PR (see **Database migrations** in `CLAUDE.md`):

- `cohort.starts_at` (nullable `timestamptz`). Needed for "Day N since batch start" and batches compared at the same day.

Phase 2 adds an `insights_dashboard` table (`org_id`, `scope_type`, `definition jsonb`, schema version).

## Implementation Plan

### Phase 1: cohort scope, then course and org

- [ ] Spec, result and dashboard Zod schemas.
- [ ] Scope resolver (cohort, course, org) with tenant-isolation tests.
- [ ] Registry: `learner_course`, `assessment_result`, `activity` sources and about 15 metrics.
- [ ] Position-based assessment role resolver with edge-case tests.
- [ ] Query compiler and `POST /insights/query`, plus preset dashboards endpoint.
- [ ] `cohort.starts_at` migration and the field in cohort create and edit.
- [ ] Widgets: KPI, line with band, bar and distribution, matrix table, horizontal bar.
- [ ] Cohort dashboard: KPIs, score journey, progress distribution, learner score progression, improvement, day-by-day scorecard, needs attention, video watch time, hardest questions, logged in per day, learner matrix with search, filters, sort and CSV export.
- [ ] Last-updated indicator and 30 second auto-refresh.
- [ ] Course dashboard and organization dashboard from the same widgets.
- [ ] Rollback-sensitive and cache tests, and a seeded 5,000-learner performance check.

<!--
Deferred until time-on-lesson tracking exists (https://github.com/classroomio/classroomio/issues/1299).
Nothing stores active learning time today: `course_completion_record.time_spent_minutes` is always written as 0,
lesson pages send no events, and `lesson_video_progress.watched_seconds` is video-only and cumulative.

- [ ] Cohort widget "Learning time per day against 5–6 hours":
  - source `time on lesson` (new), measure `active_minutes` summed, dimensions learner and day
  - column chart per day with a target line, plus a list of learners under target
  - the target (for example 5 to 6 hours) is a per-dashboard setting, not a constant
-->

### Phase 2: user-built dashboards

- [ ] `insights_dashboard` table and CRUD.
- [ ] Widget editor limited to registry metrics, dimensions and filters.
- [ ] Clone and edit presets, per scope type.

### Phase 3: extensibility

- [ ] Custom metrics as formulas over registry metrics (for example final minus pre).
- [ ] Scheduled email digests and threshold alerts.
- [ ] Read-only share links or a viewer role for executives.
- [ ] Expose `POST /insights/query` through the public API and MCP.
- [ ] Peak concurrent learners (needs the heartbeat from #1299).
- [ ] Overdue reminders that copy a supervisor (needs a supervisor field).

## Open Decisions

1. **Learning day.** Confirm one course section per learning day.
2. **Executive access.** Admin account for now, or a read-only viewer role in Phase 3.
3. **Retakes.** Best attempt by default. Confirm how `submission.total` normalizes against maximum points before defining `score_pct`.
4. **Needs-attention thresholds.** No login for 2 or more days, latest score under 50%, overdue, video attendance under 60% are placeholders.
5. **Practice cases.** The product has no simulation feature. Decide whether "ready for the floor" counts exercise submissions or waits for a simulation feature.
6. **Supervisor on reminders.** Not in the data model today.
7. **Retention.** Any new per-learner time data must be covered by account and org deletion (relevant to #1299).

## Success Criteria

1. A trainer can find any learner in a 250-person cohort by name and see their score progression in two interactions.
2. The same widget renders at cohort, course and organization scope from one spec.
3. Every number on a dashboard is reproducible by its metric spec.
4. No widget is shown for data that does not exist.
