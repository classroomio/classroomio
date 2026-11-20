# Learner Gamification PRD

## Status

- Draft (prototyped, ready for engineering review)

## Prototypes — the UX source of truth

**The UX of this feature must be taken from the prototype folder.** Clickable prototypes for every surface live in [`prototypes/gamification/`](../../prototypes/gamification/) and are the reference for layout, states (locked, earned, off, saved), copy, and navigation. When this document and a prototype disagree on a UI detail, the prototype wins.

**Start here:**

```
prototypes/gamification/index.html
```

| Surface | File |
| --- | --- |
| Learner home (streak, XP, goal, courses, badges) | `Main.dc.html` |
| Lesson completion (XP toast, milestone card) | `Lesson.dc.html` |
| Achievements and XP history | `Achievements.dc.html` |
| Weekly leaderboard and visibility | `Leaderboard.dc.html` |
| Admin gamification settings | `Settings.dc.html` |

The `.dc.html` files are canvas artboards (`canvas.json` is the index). They need the canvas runtime to click through, so the live canvas is the easiest way to review them: [ClassroomIO Gamification](https://claude.ai/artifact/CQUJDMX7Cww9Y9Qj8nMrGv).

The admin settings screen follows the course settings pattern in `apps/dashboard/src/lib/features/course/pages/settings.svelte`: titled `SettingsCard` groups, rows with a label, a muted description and a switch, and `SettingsSeparator` dividers.

## Purpose

Make real learning visible and rewarding. Learners earn XP, keep learning streaks, and collect badges for completing lessons, submitting exercises, and attending live sessions. Logins and page views never count. The feature is off until an org admin turns it on.

## Problem Statement

- The learner home "Streak" counts logins (`analytics_login_events`), so it rewards opening the app rather than learning.
- Nothing marks progress between enrolling and finishing a course. Learners who stall go unnoticed until a teacher checks course analytics.
- There are no XP, badge, achievement, or ranking tables anywhere in the codebase. The existing "leaderboard" (`ai-credits/team-leaderboard.svelte`) is about AI-credit usage and is unrelated.

## Confirmed Decisions

1. **Off by default for every org.** Admins turn gamification on in their own settings. No XP is awarded and no UI appears until then.
2. **Feature switches.** Admins can turn each feature on or off: streaks, XP and levels, badges, Veteran badge, weekend freeze, leaderboards, and streak reminder emails.
3. **Launch day starts at zero.** Everyone starts at zero XP on the day an org turns gamification on. Past activity never counts toward XP.
4. **Veteran badge.** Learners with activity before the turn-on date get a one-time Veteran badge. It gives no XP.
5. **Weekends never break a streak.** Saturday and Sunday are skipped automatically, so a Monday-to-Friday learner keeps their streak. This replaces the weekly freeze.
6. **Points come only from learning.** Lessons, exercises, live sessions, milestones, and course completion. Never logins, page views, or community upvotes.
7. **Leaderboards are opt-in per course.** They reset every Monday, show first name and last initial only, and learners can hide themselves. They default to off for compliance courses.
8. **Per-course override.** A teacher can turn gamification off for one course.
9. **Settings follow the course settings pattern.** Titled cards, rows with a switch, dividers, and the standard unsaved-changes bar.
10. **Teacher tools come last (Phase 3).** Time-boxed quests and engagement columns ship after Phases 1 and 2.
11. **Scope is one org.** No cross-org leaderboards, no prizes, and no changes to grading.

## Current-State Audit

| Capability | Current state | Notes |
| --- | --- | --- |
| Login streak | `analytics_login_events`, read by `getUserLoginStreak` (`packages/db/src/queries/dash/dash.ts`) and served by `GET /dash/login-streak` (`apps/api/src/routes/dash/stats.ts`) | Keep the endpoint and card. Change the data source to qualifying activity. |
| Lesson completion | `lesson_completion`. `upsertLessonCompletionService` in `packages/core/src/services/lesson/lesson.ts`. Route `PUT /:lessonId/completion` in `apps/api/src/routes/course/lesson.ts` | Hook point for lesson XP and milestones. |
| Video progress | `lesson_video_progress` with `watched_seconds`, `furthest_seconds`, `is_complete`. `updateLessonWatchProgressService` in `lesson.ts` | Gate video XP at 80%. |
| Exercise submissions | `submission` (`total`, `status_id`, `submitted_by`) and `question_answer`. `createSubmissionService` and `updateSubmissionService` in `apps/api/src/services/submission/submission.ts` | Hook point for on-time and first-attempt XP. `exercise.due_by` and `allow_multiple_attempts` already exist. |
| Grading points | `question.points`, `question_answer.point` | Exercise scoring only. Not XP. |
| Attendance | `group_attendance`. `upsertAttendanceService` in `apps/api/src/services/attendance/attendance.ts` | Hook point for live session XP. |
| Course completion | `course_completion_record`, `course_certificate_issue`. `evaluateCourseCertification` in `apps/api/src/services/course/completion.ts` | Single place all completion paths reach. Hook for course-finish XP. |
| Community | `community_question`, `community_answer` with `votes` counters only | No per-user vote table, so upvotes cannot be trusted for XP. |
| Org settings | `organization.settings` jsonb, typed, with `emailNotifications` | Add a `gamification` block here. |
| Course settings | `course.metadata` jsonb | Add a `gamification` override here. `metadata.reward` is landing-page copy only. |
| Email preferences | `organizationmember_email_notifications` boolean columns | Add a streak reminder opt-out column. |
| Email sending | `packages/email/src/emails` templates, `emails.send` job | Streak reminders are org-branded (`branding`, `buildEmailFromName`). |
| Scheduled jobs | BullMQ queues in `packages/jobs`. Scan pattern in `apps/jobs/src/workers/notifications.ts` and `processors/notifications/session-reminder-scan.ts` | Reuse for the streak reminder scan and the overnight recalculation. |
| Teacher analytics | `apps/dashboard/src/lib/features/course/components/analytics/student-table.svelte` | Engagement columns (Phase 3) go here. |
| Settings UI | `SettingsCard`, `SettingsSeparator` in `apps/dashboard/src/lib/features/ui` | Reuse for the admin settings screen. |

## Product Goals

- Weekly active learners, counted by lessons, exercises, and live sessions, rise in pilot orgs compared with their own prior four weeks.
- Lesson completion rate per course rises after launch.
- No increase in support tickets about grades or points.

## Non-Goals (v1)

- Money, prizes, or certificates earned through XP.
- Cross-org leaderboards.
- Any change to grading, certificates, or compliance status.
- A native mobile treatment.

## Functional Requirements

Priority: P1 = Phase 1, P2 = Phase 2, P3 = Phase 3.

### Org admin (settings)

| ID | Pri | Requirement | Acceptance criteria |
| --- | --- | --- | --- |
| A1 | P1 | Gamification is off by default for every org. | A new or existing org has the master switch off. No XP is awarded and no gamification UI appears until it is on. |
| A2 | P1 | Admins can switch each feature on or off separately. | Turning a feature off hides its UI and stops its awards for all learners in the org. Turning gamification off hides everything. |
| A3 | P1 | Admins can edit XP values for each rule. | Values are saved per org. A change applies to new activity. Past XP is recalculated overnight. |
| A4 | P1 | Each course can turn gamification off. | A course with it off earns no XP, and its learners see no gamification UI there. |
| A5 | P2 | Leaderboards default to off for compliance courses. | A new compliance course starts with leaderboards off and shows the "Off for compliance courses" label. |
| A6 | P1 | Settings follow the course settings pattern. | Titled cards, rows with label, muted description and switch, dividers, and the standard save bar. |

### Launch and history

| ID | Pri | Requirement | Acceptance criteria |
| --- | --- | --- | --- |
| B1 | P1 | On the turn-on date, every learner starts at zero XP. | No XP is awarded for activity dated before `enabledAt`. |
| B2 | P1 | Learners with activity before the turn-on date get a one-time Veteran badge. | Awarded once per learner, based on at least one lesson completion or exercise submission before `enabledAt`. A re-run does not award it again. |

### Learner: points

| ID | Pri | Requirement | Acceptance criteria |
| --- | --- | --- | --- |
| C1 | P1 | Every award is one ledger row with org, learner, course, rule, source type, source id, points, and timestamp. | Each row links to the record that earned it. |
| C2 | P1 | A learner cannot receive the same award twice. | A unique key on learner, rule, and source enforces this. A retried job creates no duplicate. |
| C3 | P1 | Awards are written by a background job queued after the originating transaction commits. | A failed award job does not roll back the lesson, submission, or attendance that triggered it. |
| D1 | P1 | Completing a lesson awards 20 XP, once per lesson. | A video lesson awards XP only after 80% is watched. Re-completing awards nothing. |
| D2 | P1 | An exercise submitted before its due date awards 10 XP, once per exercise. | A late or resubmitted exercise awards nothing. |
| D3 | P1 | First-attempt score bonus, up to 30 XP. | Only the first attempt counts. |
| D4 | P1 | Attending a live session awards 15 XP. | Counts once per session in `group_attendance`. |
| D5 | P1 | Milestones at 25%, 50%, and 75% award 25 XP each. Finishing a course awards 100 XP. | Each is awarded once per course. |
| D6 | P1 | Logins, page views, and time on page never award XP. | No ledger row is created for these events. |
| D7 | P2 | Community upvotes never award XP. Helpful answer is awarded only when an instructor marks an answer helpful. | Upvote counts create no ledger rows. |

### Learner: streaks, levels, and badges

| ID | Pri | Requirement | Acceptance criteria |
| --- | --- | --- | --- |
| E1 | P1 | A streak counts consecutive days with a lesson completion, exercise submission, or live session attendance. | Replaces the login streak on the learner home. `GET /dash/login-streak` keeps its path and card, with a new source. |
| E2 | P1 | Days are counted in the learner's time zone. | A lesson at 23:30 local time counts for that local day. |
| E3 | P1 | Saturday and Sunday never break a streak. | A Monday-to-Friday learner keeps their streak. Weekend activity still counts. |
| F1 | P2 | Ten built-in badges, each with a rule and a progress indicator. | Locked badges show progress, such as "12 / 30 days". Earned badges show the date. |
| F2 | P1 | Levels are calculated from total XP. | The home page shows the current level and the XP needed for the next. |
| F3 | P1 | Milestone celebrations appear on the lesson screen. | The "Halfway there" card shows once per milestone and can be dismissed. |

### Learner: leaderboards

| ID | Pri | Requirement | Acceptance criteria |
| --- | --- | --- | --- |
| G1 | P2 | Leaderboards rank learners by XP earned in the current week, per course. | The board resets every Monday. |
| G2 | P2 | Learners can hide themselves. | A hidden learner's row is removed for classmates. The learner still sees their own rank. |
| G3 | P2 | Leaderboards show first name and last initial only. | No full names or emails appear. |
| G4 | P2 | Leaderboards are limited to one org. | No cross-org ranking exists. |

### Email

| ID | Pri | Requirement | Acceptance criteria |
| --- | --- | --- | --- |
| H1 | P2 | A streak reminder is sent when a learner with a streak of 3 or more days has no qualifying activity by late evening in their time zone. | Org-branded: `branding` field, `buildEmailFromName`. |
| H2 | P2 | Learners can opt out. | A new column in `organizationmember_email_notifications` stores the choice. An opted-out learner receives nothing. |

### Teacher

| ID | Pri | Requirement | Acceptance criteria |
| --- | --- | --- | --- |
| I1 | P3 | Teachers can create time-boxed quests, such as 2x XP for a module this week. | A quest applies only to its course and dates. Its XP is recorded in the ledger with a quest source. |
| I2 | P3 | The course student table shows XP, streak, and last active. | The columns sort and export like the existing columns. |

### Cross-cutting

| ID | Pri | Requirement | Acceptance criteria |
| --- | --- | --- | --- |
| J1 | P1 | All learner-facing copy uses translation keys. | No hardcoded English in components. Keys exist in `en.json` and the other locale files. |
| J2 | P1 | The UI meets the accessibility pattern. | Switches use `role="switch"` and `aria-checked`. Icon-only controls have labels. Colour is never the only signal. |
| J3 | P1 | Enabling or disabling gamification does not change grades, certificates, or compliance status. | Grades and certificates are identical before and after toggling. |

## Technical Design

### Data model

```ts
// packages/db/src/schema.ts
export const learnerXpEvent = pgTable(
  'learner_xp_event',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    orgId: uuid('org_id').notNull().references(() => organization.id, { onDelete: 'cascade' }),
    profileId: uuid('profile_id').notNull().references(() => profile.id, { onDelete: 'cascade' }),
    courseId: uuid('course_id').references(() => course.id, { onDelete: 'set null' }),
    rule: text('rule').notNull(),
    sourceType: text('source_type').notNull(),
    sourceId: text('source_id').notNull(),
    points: integer('points').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    unique('learner_xp_event_award_key').on(table.profileId, table.rule, table.sourceType, table.sourceId),
    index('learner_xp_event_org_created_idx').on(table.orgId, table.createdAt)
  ]
);
```

Totals, levels, streaks, and leaderboard ranks are **computed from the ledger**, never stored. Settings live in typed jsonb:

```ts
// organization.settings
gamification?: {
  enabled: boolean;
  enabledAt: string | null; // launch date; awards before this are ignored
  features: {
    streaks: boolean;
    xpLevels: boolean;
    badges: boolean;
    veteranBadge: boolean;
    weekendFreeze: boolean;
    leaderboards: boolean;
    streakReminders: boolean;
  };
  xp: {
    lessonComplete: number; // 20
    exerciseOnTime: number; // 10
    firstAttemptBonusMax: number; // 30
    liveSession: number; // 15
    milestone: number; // 25
    courseFinish: number; // 100
  };
};

// course.metadata
gamification?: { enabled: boolean };
```

Email opt-out is a new boolean column (`streak_reminder`) on `organizationmember_email_notifications`, default `true`.

### Core logic (pseudocode)

```text
awardOnActivity(event):
  org = load org settings
  if !org.gamification.enabled: return
  if event.occurredAt < org.gamification.enabledAt: return
  if course override is off: return
  rule = rule for event.type            # lesson, exercise, attendance, course finish
  points = org.xp[rule] (plus first-attempt bonus when attempt == 1)
  insert ledger row ON CONFLICT (profile, rule, source) DO NOTHING
  if inserted: evaluate milestones and badges for this learner

currentStreak(profile, now):
  days = distinct local dates of qualifying activity for profile
  day = today if active today else yesterday
  count = 0
  while true:
    if day is Saturday or Sunday and weekendFreeze: day = day - 1; continue
    if day in days: count += 1; day = day - 1
    else: break
  return count

veteranBackfill(org):
  for each learner with activity before enabledAt and no Veteran row:
    insert ledger row with points 0 and rule 'veteran' (ON CONFLICT DO NOTHING)
```

Reminder scan (daily, in the jobs app): for each opted-in learner whose streak is 3 or more and who has no qualifying activity today, enqueue `emails.send` with the org-branded template.

### API routes

Mounted at a single root, `/gamification`, in `apps/api/src/app.ts`.

| Method | Path | Purpose | Who |
| --- | --- | --- | --- |
| GET | `/gamification/me` | Level, XP, streak, badges summary | Learner |
| GET | `/gamification/badges` | Badges with progress | Learner |
| GET | `/gamification/xp-history` | Paged ledger rows | Learner |
| GET | `/gamification/leaderboard?courseId=` | Weekly ranking, hidden learners excluded | Learner |
| PUT | `/gamification/leaderboard/visibility` | Hide or show self | Learner |
| GET | `/gamification/settings` | Org settings | Admin |
| PUT | `/gamification/settings` | Update org settings | Admin |
| PUT | `/gamification/courses/:courseId` | Per-course override | Teacher |
| GET | `/gamification/course-students?courseId=` | Engagement columns | Teacher (P3) |

`GET /dash/login-streak` keeps its path and response shape. Only its query changes to the qualifying-activity source.

### Layering

Follows CLAUDE.md: validation in `packages/utils/src/validation/gamification/`, pure queries in `packages/db/src/queries/gamification/`, orchestration in `packages/core` or `apps/api/src/services/gamification/`, routes in `apps/api/src/routes/gamification/`, and feature types in `apps/dashboard/src/lib/features/gamification/utils/types.ts`, inferred from the RPC client. Settings UI and the learner screens use `SettingsCard` and the `ui:` token classes.

## Implementation Order

1. **Schema and migration.** Add `learner_xp_event` and the email opt-out column. One migration file. Run the `when` check in CLAUDE.md before merging.
2. **Validation and queries.** Zod schemas for settings and the ledger. Query helpers that accept an optional transaction client.
3. **Award service and job.** Idempotent award, milestone and badge evaluation. Queue on a new `gamification` BullMQ queue.
4. **Hook points.** Lesson completion, video progress, exercise submission and grading, attendance, and course completion each queue an award after commit.
5. **Streak source.** Replace the login query behind `GET /dash/login-streak`.
6. **Veteran backfill job.** Batched, idempotent, run once per org at turn-on.
7. **Routes.** `/gamification` router, mounted once in `app.ts`.
8. **Learner UI.** Home card replacement, lesson completion toast and milestone card, achievements, leaderboard.
9. **Admin settings UI.** Settings page using `SettingsCard`, plus the per-course override in course settings.
10. **Email.** Streak reminder template, daily scan job, opt-out column in preferences.
11. **Phase 3.** Quests and engagement columns.
12. **Translations.** All copy in `en.json` and the other locale files.

Verification before each push:

```bash
export PATH="$HOME/.nvm/versions/node/v20.19.3/bin:$PATH"
pnpm --filter @cio/api^... build && pnpm --filter @cio/api build
pnpm --filter @cio/dashboard^... build && pnpm --filter @cio/dashboard build
pnpm format:check
```

## Acceptance Criteria

1. A new org has gamification off. Turning it on awards nothing for activity before `enabledAt`.
2. Each award creates exactly one ledger row. Retrying a job creates no duplicate.
3. A video lesson below 80% awards no lesson XP.
4. A late exercise, a resubmission, or a second attempt awards no on-time or first-attempt XP.
5. Logins and page views create no ledger rows.
6. A streak of Monday to Friday activity is unbroken across the weekend.
7. Streaks are computed in the learner's time zone.
8. Each learner receives the Veteran badge at most once and no XP for it.
9. A hidden learner does not appear to classmates on a leaderboard, and still sees their own rank.
10. Leaderboards reset every Monday and show first name and last initial only.
11. Compliance courses start with leaderboards off.
12. Turning gamification off changes no grades, certificates, or compliance status.
13. Every learner-facing string uses a translation key.
14. Zero regression on existing features, including the login streak endpoint's response shape.

## Risks and Mitigations

| Risk | Mitigation |
| --- | --- |
| Double awards from retries or concurrent jobs | Unique key on the ledger, and `ON CONFLICT DO NOTHING` inserts. |
| Learner time zone is not stored on the profile | Confirm the source before Phase 1 lands. If none exists, store the browser time zone on the profile at login and fall back to the org's time zone. |
| Veteran backfill is slow for large orgs | Batch by learner, run as a job, and make it idempotent so it can resume. |
| Streak query gets slow as activity grows | Index on `(profile_id, created_at)` for the source tables, and cache the day set per learner per day. |
| XP value changes leave totals stale | Overnight recalculation job. Totals are computed, so the fix is a re-run. |
| Leaderboards expose compliance learners | Default off for compliance courses, and the hide option is always visible. |
| Prototype and production drift | The prototype is the UX reference. Engineering changes to a screen update its prototype file in the same PR. |

## Open Questions

- [ ] Where does a learner's time zone come from today? (Blocks E2.)
- [ ] Which two or three orgs pilot first? Gamification is off by default, so each admin opts in.
- [ ] Who reviews non-English copy for XP labels and badge names?
