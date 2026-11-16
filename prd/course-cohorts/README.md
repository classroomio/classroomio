# Course Cohorts PRD

## Status

- Draft v2 (rewrite). Supersedes the v1 draft that proposed a separate `course_cohort` table.

## Purpose

Run one course for many batches of learners. Each batch is a **cohort**, the org-level entity that already exists (`cohort`, `cohort_course`, `cohort_member`). A course linked to several cohorts keeps **one copy of its content**, while each cohort gets its own enrollment, submissions, grades, progress, attendance, comments, newsfeed and live-session schedule.

Customers who already duplicated a course per batch get a **Merge courses** flow that folds the copies into one course with one cohort per copy, keeps every learner record, and can be **undone for 30 days**.

## Problem Statement

### Why customers duplicate today

Adding students to a cohort enrolls them into the linked course's single group (`course.group_id`, see `enrollCohortStudentsInGroups` in `apps/api/src/services/cohort/cohort.ts`). If one course is linked to two cohorts, both batches land in the same group: they share lesson comments and the newsfeed, and instructors see both batches mixed together in People, Submissions, Marks and Attendance. To keep batches apart, customers duplicate the whole course and link each copy to its own cohort.

### What duplication costs (production audit, 2026-11-16)

Read-only audit of `cio-prod` for the two academies that run batches.

| | Academy A | Academy B |
| --- | --- | --- |
| Courses / cohorts | 9 copies of "Data Analysis" (2 deleted), 7 cohorts, 123 students | 3 copies of "Career Track", 3 cohorts, 7 students |
| Lessons stored vs one canonical copy | 266 vs 32 (8.3×) | 251 vs 121 (2.1×) |
| Blocks stored vs canonical | 332 vs 35 (9.5×) | 484 vs 232 (2.1×) |
| Questions / options stored vs canonical | 211 / 583 vs 39 / 113 | 379 / 1506 vs 169 / 666 |
| Asset files | 27 assets behind 227 media blocks (files shared, blocks copied) | 109 assets, 61 shared |

Content comparison, matched by section and lesson title and fingerprinted by note text and asset IDs:

- **Same content:** all 28 non-live Academy A lessons are identical in every full copy. Academy B's 06 Nov and 14 Nov copies are identical. Questions and options match wherever the exercise was cloned rather than rebuilt.
- **Real per-cohort data:** live-session lessons differ by date (`lesson_at`), call link (`call_url`) and the meeting-details note. Lock state differs: Academy B's copies lock 29 lessons and 2 quizzes for drip release.
- **Drift caused by duplication:**
  - Two Academy A cohorts (36 students) never received Week 4: 9 lessons and the Week 4 project are missing from their copies.
  - Academy A's middle copies have hand-rebuilt exercises with different titles, question counts, points and attempt settings.
  - Academy B's later edits exist only in the copies, and the original has Weeks 5 to 8 that the copies lack.
- **Clone bugs:**
  - Plain duplication records no `source_id`, so nothing links a copy to its origin.
  - Every exercise in every copy has `due_by` set to the clone timestamp (`clone.ts` uses `now()` unless `preserveSchedule`), so each copied exercise has been overdue since it was created.
- **Roster drift:** cohort membership does not match course enrollment. A1 has 0 cohort students but 33 course students; B3 has a student and no linked course.

## Confirmed Decisions

1. **Reuse the existing cohort.** No new cohort entity. `cohort` stays the batch, `cohort_course` stays the link between a cohort and a course.
2. **Isolation lives on the link.** Each `cohort_course` row owns its own `group`. Cohort students enroll into that group, not into `course.group_id`.
3. **One content tree per course.** Sections, lessons, blocks, exercises and questions are shared by every cohort on the course.
4. **Per-cohort schedule is in scope.** Live-session date, call link, recording, lock state and exercise due date can differ per cohort through overrides. Content cannot.
5. **Merge existing copies is in scope for v1**, including a reversible merge with a 30-day undo window.
6. **Students keep today's experience.** They already see the cohorts they belong to (`/lms/cohorts`). Inside a course they see their own cohort's schedule and activity, with no cohort picker. A student in two cohorts of one course (retake) sees a "Previous enrollment" switch.
7. **URLs are stable.** A course keeps its slug. A merged copy's slug redirects to the course it was merged into.

## Current-State Audit

| Area | Today | Change needed |
| --- | --- | --- |
| Cohort ↔ course | `cohort_course(cohort_id, course_id)`, unique pair | Add `group_id`, `starts_at`, `ends_at` |
| Cohort enrollment | Students inserted into `course.group_id` | Insert into `cohort_course.group_id` |
| Course access | `canProfileOpenCourse` checks the course group | Check every enrollment group of the course |
| `course.group_id` usage | About 108 references in 28 query and service files (101 typed `course.groupId` in 25 files, plus raw-SQL joins in `analytics/scope.ts`, `organization/audience.ts`, `organization/member-lifecycle.ts`) | Route through an enrollment-group resolver (see Read paths) |
| Submissions | Write scoped by `submitted_by → groupmember`; reads filter by `course_id` | Reads filter by group |
| Question answers | `group_member_id` | Follows submission |
| Lesson comments | Write scoped by `groupmember_id`; reads filter by `lesson_id` | Reads filter by group |
| Attendance | Reads filter by `course_id` | Reads filter by group |
| Lesson completion | Unique `(lesson_id, profile_id)` | Add `group_member_id`, unique `(lesson_id, group_member_id)` |
| Video progress | Unique `(lesson_id, profile_id, asset_id)` | Add `group_member_id`, unique per group member and asset |
| Completion records / certificates | Unique `(course_id, profile_id, cycle_number)` | Unique `(group_member_id, cycle_number)` |
| Course newsfeed | `course_id` only | Add `group_id` (null = all cohorts) |
| Course invites | `course_invite.course_id` | Add `cohort_course_id` |
| Live lesson schedule | Columns on `lesson` | Per-cohort override table |
| Exercise due date / lock | Columns on `exercise` | Per-cohort override table |
| Duplicate course | No lineage, `due_by = now()` | Record lineage, preserve schedule, suggest a cohort instead |

Production shape (2026-11-16): 59 cohorts in 44 orgs, 43 cohort-course links, 9 cohorts with several courses, 1 course already linked to 2 cohorts (sharing one group today).

## Product Goals

1. Link one course to many cohorts without content copies.
2. Isolate each cohort's enrollment, submissions, grades, progress, comments, attendance and newsfeed.
3. Let each cohort have its own live-session dates, call links, recordings, drip locks and due dates.
4. Give instructors a cohort filter on every course page that lists learner data, plus an "All cohorts" view. Course analytics already breaks results down by cohort ("Direct students", "Cohorts taking this course", from `cohort_member`); the filter extends that to the new per-link groups.
5. Merge existing per-batch copies into one course, safely and reversibly.
6. Stop new duplication: steer "Duplicate course" toward "Run a new cohort".
7. Zero regression for courses with no cohort links, and for Programs-style cohorts that bundle several courses.

## Non-Goals (v1)

- Content variations per cohort (a lesson that exists for one cohort only).
- Automatic cohort assignment rules.
- Per-cohort pricing.
- Merging courses across organizations.
- Merging courses that are templates (`is_template = true`).
- Undo after the 30-day window.

## Functional Requirements

### 1. Cohort-scoped enrollment

- Linking a course to a cohort (`POST /cohort/:cohortId/courses`) creates a `group` for that link and stores it in `cohort_course.group_id`. Cohort staff keep their cohort role (ADMIN or TUTOR), cohort students are added as STUDENT, matching `enrollCohortStaffInCourseGroups` today.
- Adding a member to a cohort enrolls them into the group of each of the cohort's course links.
- Removing a member removes them from those groups. Their records stay (same as removing a course member today). This is new: today removing a cohort member deletes only the `cohort_member` row and leaves their course enrollment, as the help center says (`manage-learners/assign-learners-to-a-cohort.mdx`, `troubleshooting-and-reference/cohort.mdx`). Update those articles when this ships.
- A course can still have direct enrollments in `course.group_id` (invites, free enroll, payments). Those learners form the **Direct** bucket in the cohort filter.
- A student can belong to two cohorts on the same course. Each enrollment is its own `groupmember` with its own progress.

### 2. Course access

- A student can open a course when they have a `groupmember` row in `course.group_id` or in any `cohort_course.group_id` for that course.
- A cohort link outside its `starts_at`–`ends_at` window blocks student access through that link. Staff keep access.
- Today cohort `status` only hides non-ACTIVE cohorts from search and stops invite links from accepting new members; it does not affect course access. New: `INACTIVE` and `ARCHIVED` cohorts block student access through their links.

### 3. Viewer context resolution

`resolveCourseEnrollment(courseId, profileId, { cohortId? })` returns the group and groupmember the request acts in.

- **Students:** the one enrollment they have. With several, the most recently active link inside its window, unless `?enrollment=<groupmemberId>` selects another one of their own.
- **Staff:** `?cohortId=` selects one cohort. No `cohortId` means **All cohorts** for list and analytics pages. Write actions that need a group (posting to the newsfeed, marking attendance) require a cohort or Direct.

### 4. Per-cohort schedule overrides

Shared content keeps its base values. A cohort link can override:

| Item | Overridable fields |
| --- | --- |
| Lesson | `lesson_at`, `call_url`, `recording_url`, `session_duration_minutes`, `is_unlocked`, `unlock_at` (new, override-only) |
| Exercise | `due_by`, `is_unlocked`, `unlock_at` (new, override-only) |

- Each overridable field has three states:
  - **Inherit** (default): the cohort uses the course's base value.
  - **Set**: the cohort uses its own value.
  - **Cleared**: the cohort has no value (no due date, no recording) even when the base has one.
- Stored as a nullable column per field plus `cleared_fields text[]` on the override row. Resolution: the field is in `cleared_fields` → null; else the override value if it is not null; else the base value. A plain `override ?? base` is not enough because it cannot express Cleared.
- Applied in the read path for students and in the cohort-filtered staff view.
- **Shift schedule:** when linking a course to a new cohort, staff can copy another cohort's overrides and shift every date by N days (default: the difference between the two links' `starts_at`).
- Live-session reminders (`live_session_reminder_delivery`) are sent per cohort link, using the resolved `lesson_at`. Its unique key `(lesson, profile, offset)` gains the group member, so a student in two cohorts of one course gets both reminders.

### 5. Read paths that must filter by group

Every query that lists learner data through `course.group_id` or `course_id` filters by the resolved group set: one cohort, Direct, or all. The work covers the 28 files that reference `course.group_id` today, including:

- People, marks, submissions (list, for-grading, counts), attendance, lesson comments.
- Student progress, member progress, compliance, course analytics, dash stats.
- Newsfeed, sessions, invites, payment requests.
- Webhook payload details, product events, the agent route.
- Public API v1 course member endpoints and MCP tools (`list_course_members`, `list_course_submissions`, `get_course_marks`, `list_course_analytics_students`). Each gains an optional `cohortId`.

### 6. Course newsfeed and comments

- `course_newsfeed.group_id`: posts go to one cohort, Direct, or everyone (null).
- Students see posts for their group plus everyone posts.
- Lesson comments are shown to members of the commenter's group, and to all staff.

### 7. Invites

- `course_invite.cohort_course_id` (nullable). An invite created from a cohort's view enrolls into that link's group and adds the student to the cohort roster.
- Existing invites keep enrolling into `course.group_id`.

### 8. Cohort filter in the course UI

- A cohort filter sits in the course header on People, Submissions, Marks, Attendance, Analytics and Newsfeed: **All cohorts · Direct · each linked cohort**, each with a student count and a status dot.
- Choosing a cohort is kept in `?cohortId=` and survives page changes within the course.
- Lesson and exercise editors get a **Schedule by cohort** panel listing each linked cohort's date, link, lock and due date, with "Same as course" as the empty state.

### 9. Duplicate course

- `cloneCourse` always records lineage (`source_id` on sections, lessons, exercises, plus `course.source_course_id`), and keeps `due_by` instead of stamping `now()`.
- "Duplicate" on a course that is linked to a cohort opens a choice: **Run a new cohort** (link this course to a new or existing cohort) or **Duplicate anyway**.

### 10. Merge courses

#### 10.1 Who and where

- Org admins only. All courses must be in the same org, not templates, not deleted.
- Entry points:
  - A suggestion banner on the Courses page when copies are detected: "7 courses look like copies of Data Analysis".
  - A **Merge courses** button in the Courses page toolbar.
  - "Merge with other copies…" in a course's ⋯ menu.

#### 10.2 Detecting copies

A **copy group** is a set of courses where:

- titles match after removing date and batch suffixes (`- 23rd August`, `- 08th November 2026`, `dummy`), and
- at least 60% of lesson titles match after normalizing case, whitespace and punctuation.

Lineage (`source_id`), when present, groups courses directly. Groups are computed on demand by `GET /course/merge/suggestions`.

#### 10.3 Choosing the primary course

- The primary course keeps its ID, slug, title, settings and content. The other courses are **copies**.
- Recommended primary: the copy with the most lessons and exercises, ties broken by most recent content edit. The UI shows the reason ("Most complete: 32 lessons, 7 exercises").

#### 10.4 Matching content

Each copy item is matched to a primary item:

1. by `source_id` lineage, then
2. by normalized section title + lesson title (exercise title for exercises), then
3. by fuzzy title (edit distance ≤ 2, e.g. "Intoduction" → "Introduction", "Week 2 - Project" → "Week 2 Project") within the same section.

Each copy item lands in one class:

| Class | Meaning | Default action |
| --- | --- | --- |
| Same | Blocks (note text, asset IDs) or questions/options identical, empty notes ignored | Map to primary item |
| Schedule differs | Only overridable fields differ | Map, and save the copy's values as that cohort's overrides |
| Content differs | Text, blocks, questions, points or settings differ | Map to primary item (primary content wins); copy content stays in the archived copy |
| Missing in copy | Primary item the copy never had (Academy A Week 4) | The cohort gains it. Option: lock it for this cohort |
| Only in copy | Copy item with no match | Leave in archived copy (default when it has no learner activity), or add to the primary course |

A `due_by` within two minutes of the course's `created_at` was stamped by duplication, not set by a person:

- On a copy, the cohort gets a **Cleared** due date (no deadline), so it never inherits a date the copy did not have.
- On the primary, the base `due_by` is cleared (recorded in the change log, so undo restores it).
- The review step lists these exercises under "Due dates set by duplication" so the admin can set real dates per cohort afterwards.

When a copy's schedule field is empty and the primary's is not (no recording, no call link), the merge saves it as **Cleared** for that cohort, not as Inherit.

#### 10.5 Moving learner data

For each copy merged into primary course P as cohort K:

1. **Enrollment moves as a whole group.** The copy's group becomes the group of link (K, P). No `groupmember` row changes, so `submission.submitted_by`, `question_answer.group_member_id`, attendance and comments keep their IDs.
2. **Remap content references** from copy IDs to primary IDs:
   - `submission.exercise_id`, `submission.course_id`, `question_answer.question_id`
   - `lesson_completion.lesson_id`, `lesson_video_progress.lesson_id`, `lesson_comment.lesson_id`
   - `group_attendance.course_id` / `lesson_id`, `course_newsfeed.course_id` (+ `group_id` = the moved group)
   - `course_completion_record.course_id`, `course_certificate_issue.course_id`
   - `course_invite.course_id` (+ `cohort_course_id`), tag assignments
3. **Answers to questions that do not match** stay attached to the archived copy's question rows. Submission totals, grades and feedback are kept as they were. Grading shows "3 answers belong to questions removed in the merge" with a link to view them.
4. **Schedule differences** become rows in `cohort_course_item_override`.
5. **Cohort links:** every link on the copy moves to P, keeping its ID and its group, so no cohort is left linked to the archived course. A copy with no link gets one: the admin picks or creates a cohort in the wizard.
   - The copy's Direct group (`course.group_id`): if the copy has exactly one cohort link, its Direct students move into that link's group (how per-batch copies are used today). Otherwise they move into P's Direct group. Both are `groupmember.group_id` updates, so IDs are kept.
6. **Roster sync (optional, on by default):** add course students missing from the cohort roster (A1: 33). Never removes roster members.
7. **The copy is archived:** `course.status = 'MERGED'`, `merged_into_course_id = P`, unpublished, hidden from course lists and catalogs. Its slug redirects to P.
8. Cache invalidation, webhooks (`course.merged`), analytics events and emails run after the transaction commits.

**Plan validation (before the merge can start).** `POST /course/merge/plan` rejects the selection, and the wizard's Cohorts step shows why and blocks **Merge courses**, when:

- a cohort is already linked to the primary course and to a selected copy, or to two selected copies (`cohort_course` allows one row per cohort and course);
- a student would be moved into a group where they already have a `groupmember` row (`unique_group_profile`).

The admin resolves it by unlinking the cohort from one of the courses (the cohort page's existing remove-course action) or by deselecting a copy, then re-runs the plan. Combining two enrollment groups into one is out of scope for v1. Because conflicts are caught in the plan, an accepted plan cannot fail on these constraints partway through the job.

Each copy merges in its own transaction inside a background job (BullMQ). The job reports progress per step. While it runs, all involved courses are read-only and show "Merge in progress".

#### 10.6 Undo merge

- Every changed row is recorded in `course_merge_change(merge_id, table_name, row_id, column_name, old_value, new_value)`.
- **Undo merge** is available in the primary course's Settings → Merge history, and on the merge result screen, for 30 days.
- Undo replays the change log in reverse: restores the copies (`status`, slug, publish state), moves cohort links and groups back, restores remapped references, deletes the created overrides and synced roster rows.
- Activity created after the merge:
  - on items the copy had: moved back to the copy's item through the match map;
  - on items the copy never had (gained in the merge): undo clones those items into the restored copy (with `source_id` lineage) and moves the activity onto the clones, so the student still sees it in the course they are enrolled in. The undo preview lists them ("Week 4: 10 lessons and 1 project will be added to the restored course, with 12 lesson completions").
- Content edits made to the primary course after the merge stay on the primary course. Copies come back as they were at merge time, plus any gained items that carry post-merge activity.
- After 30 days the merge is finalized: a scheduled job purges the change log and the archived copies' unreferenced content. Finalizing early is an admin action.
  - `question_answer.question_id` cascades on delete, so the purge never deletes a question that has answers. Those questions, their options and their exercise stay as read-only rows on the archived copy, which grading links to ("3 answers belong to questions removed in the merge").
  - The archived course row itself is kept for the redirect and for those references; only unreferenced sections, lessons, blocks, exercises and questions are purged.

#### 10.7 Merge wizard (UI)

Full-page flow at `/org/[slug]/courses/merge`, built only from existing app components:

- Page shell: `@cio/ui/base/page` (`Page.Root`, `Page.Header`, `Page.Body`), the shell the Courses page builds on (`Page.Root` and `Page.Body`).
- Step indicator: the onboarding `Stepper` (`$features/onboarding/components/stepper.svelte`: "Step 1 of 4" label, step name, segmented bars). Move it to `@cio/ui/custom/stepper` so both flows share it, with a Storybook story.
- Footer actions follow the dialog button hierarchy: Back `variant="secondary"`, Cancel `variant="outline"`, primary CTA on the right, all `size="sm"`.
- Lists use `Item` and `Table`, states use `Badge`, notices use `Alert`, side-by-side diffs open in a `Sheet`, empty states use `Empty`.
- No custom shadows, gradients or one-off cards. Courses render with the existing `CourseCard`.
- All copy in `en.json` under `course.merge.*`; Playwright hooks via `testId` (`course-merge-start`, `course-merge-submit`, `course-merge-undo`).

Four steps and a result screen:

1. **Choose courses.** Detected copy group preselected. Each row shows title, students, lessons, exercises, created date, linked cohort, and a radio for **Primary** with a "Recommended" badge and its reason. Admins can add or remove courses.
2. **Review content.** One tree of the primary course (sections → lessons and exercises) with a column per copy. Each cell is a chip: Same, Schedule, Differs, Missing, Only here. A summary bar counts each class. Clicking a cell opens a side-by-side diff (blocks, or questions and options) and the action choices from 10.4.
3. **Cohorts.** One row per copy: linked cohort (or a picker to choose or create one), students moving, cohort start date, roster sync toggle with the number of students it adds.
4. **Confirm.** Course name after the merge (default: the primary's title without its batch suffix, e.g. "Data Analysis"). Plain-language summary: courses becoming one, enrollments, submissions and completions moving, items added per cohort, copies archived, undo date. A checkbox to confirm, then **Merge courses**.

**Merging animation.** The selected `CourseCard`s slide into the primary card and stack, using Svelte's `animate:flip` and `fly` transitions, as the dashboard already does elsewhere. A checklist shows the job's real steps (matching content, moving enrollments, moving submissions and answers, saving cohort schedules, archiving copies) with live counts. Respects `prefers-reduced-motion` (no movement, checklist only).

**Result.** One course card ("Data Analysis · 7 cohorts · 126 students"), **Open course**, and a callout: "You can undo this merge until 16 Dec 2026 from Settings → Merge history."

#### 10.8 Undo UI

Settings → Merge history lists merges with date, admin, courses and days left. **Undo merge** opens a preview: courses that come back, enrollments that move back, post-merge activity and where it goes. Confirm runs a reverse animation (the card splits back into the copies) and ends on the restored course list.

#### 10.9 Student experience during and after a merge

- The course title and URL become the primary course's. The old URL redirects.
- Progress, grades, comments and certificates are kept.
- Items the cohort gained appear in the curriculum, locked if the admin chose to.
- No email is sent by default. The wizard offers an optional newsfeed post to each cohort.

## Technical Design

### Data model

```typescript
// packages/db/src/schema.ts

// cohort_course: add
groupId: uuid('group_id'), // FK group.id; new links always get their own group
startsAt: timestamp('starts_at', { withTimezone: true, mode: 'string' }),
endsAt: timestamp('ends_at', { withTimezone: true, mode: 'string' }),

export const cohortCourseItemOverride = pgTable(
  'cohort_course_item_override',
  {
    id: uuid().default(sql`gen_random_uuid()`).primaryKey().notNull(),
    cohortCourseId: uuid('cohort_course_id').notNull(), // FK cohort_course.id, cascade
    lessonId: uuid('lesson_id'), // FK lesson.id, cascade
    exerciseId: uuid('exercise_id'), // FK exercise.id, cascade
    lessonAt: timestamp('lesson_at', { withTimezone: true, mode: 'string' }),
    callUrl: text('call_url'),
    recordingUrl: text('recording_url'),
    sessionDurationMinutes: integer('session_duration_minutes'),
    dueBy: timestamp('due_by', { withTimezone: true, mode: 'string' }),
    isUnlocked: boolean('is_unlocked'),
    unlockAt: timestamp('unlock_at', { withTimezone: true, mode: 'string' }), // no base column on lesson/exercise
    clearedFields: text('cleared_fields').array().notNull().default(sql`'{}'`), // fields resolved to null instead of the base value
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow()
  },
  (table) => [
    check('override_one_target', sql`(lesson_id is null) <> (exercise_id is null)`),
    uniqueIndex('override_link_lesson').on(table.cohortCourseId, table.lessonId).where(sql`lesson_id is not null`),
    uniqueIndex('override_link_exercise').on(table.cohortCourseId, table.exerciseId).where(sql`exercise_id is not null`)
  ]
);

// lesson_completion, lesson_video_progress: add
groupMemberId: uuid('group_member_id'), // FK groupmember.id, cascade

// course_newsfeed: add
groupId: uuid('group_id'), // null = every learner on the course

// course_invite: add
cohortCourseId: uuid('cohort_course_id'),

// course: add
sourceCourseId: uuid('source_course_id'),
mergedIntoCourseId: uuid('merged_into_course_id'),
// course.status gains 'MERGED'

export const courseMerge = pgTable('course_merge', {
  id: uuid().default(sql`gen_random_uuid()`).primaryKey().notNull(),
  organizationId: uuid('organization_id').notNull(),
  primaryCourseId: uuid('primary_course_id').notNull(),
  copyCourseIds: uuid('copy_course_ids').array().notNull(),
  plan: jsonb().notNull(), // match map and actions confirmed in the wizard
  status: varchar().notNull(), // PENDING | RUNNING | COMPLETED | FAILED | REVERTING | REVERTED | FINALIZED
  createdByProfileId: uuid('created_by_profile_id').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
  completedAt: timestamp('completed_at', { withTimezone: true, mode: 'string' }),
  undoUntil: timestamp('undo_until', { withTimezone: true, mode: 'string' }),
  revertedAt: timestamp('reverted_at', { withTimezone: true, mode: 'string' })
});

export const courseMergeChange = pgTable('course_merge_change', {
  id: bigserial({ mode: 'number' }).primaryKey(),
  mergeId: uuid('merge_id').notNull(), // FK course_merge.id, cascade
  tableName: varchar('table_name').notNull(),
  rowId: text('row_id').notNull(),
  columnName: varchar('column_name').notNull(),
  oldValue: jsonb('old_value'),
  newValue: jsonb('new_value')
});
```

### Migration (one file)

1. Add the columns and tables above. Use `'MERGED'` as a new `course.status` value (a free `text` column today with ACTIVE and DELETED, so no DDL).
2. Give every existing cohort link its own group, including courses with a single link, so cohort learners are no longer Direct learners:
   - Create a group per `cohort_course` row and store it in `cohort_course.group_id`.
   - **Move** each student `groupmember` in `course.group_id` whose profile is on that link's cohort roster into the link's group by updating `groupmember.group_id`. The row keeps its ID, so submissions, answers, attendance, comments and completion records stay attached.
   - A student on the rosters of two cohorts linked to the same course (the one production course with two links) keeps their existing row in the earliest link's group and gets a new, empty enrollment in the other.
   - Students not on any linked roster stay in `course.group_id` and show as **Direct**. Students missing from their cohort's roster (roster drift) therefore show as Direct until an admin adds them to the cohort, or until a merge's roster sync does.
   - Staff (ADMIN, TUTOR) stay in `course.group_id` and are also inserted into each link group with their cohort role (on conflict do nothing).
   - The cohort filter labels each link group with its cohort's name and `course.group_id` as "Direct".
   - Course access, cohort status and the cohort window then apply to cohort learners as FR2 describes, because they no longer hold a Direct enrollment.
3. Backfill `lesson_completion.group_member_id` and `lesson_video_progress.group_member_id` from the profile's groupmember for that course, whether it is in `course.group_id` or a `cohort_course.group_id`. For a student enrolled in two link groups, use the row moved in step 2 (the earliest link's). Rows with no groupmember (6 completions in production, from removed students) stay null.
4. Replace unique `(lesson_id, profile_id)` on `lesson_completion` with unique `(lesson_id, group_member_id)` where `group_member_id is not null`, keeping `(lesson_id, profile_id)` unique where it is null. Same for video progress with `asset_id`.
5. Replace `course_completion_record_course_profile_cycle_key` with unique `(group_member_id, cycle_number)`.

Check the journal `when` against `main` before merging (see CLAUDE.md, Database migrations).

### Query layer (`packages/db/src/queries/`)

- `cohort/cohort-course.ts`: `getCourseEnrollmentGroups(courseId, tx?)`, `getCohortCourseByGroupId`, `createCohortCourseGroup`, overrides CRUD, `getResolvedLessonSchedule(lessonId, cohortCourseId)`.
- `course/merge.ts`: `findCopyGroupCandidates(orgId)`, `loadCourseGraph(courseId)` (export and reuse the private `loadGraph` in `template-sync.ts`), `insertMergeChanges`, `remapRows(table, column, idMap, tx)` returning the changes, `listMergeChanges(mergeId)`.
- Existing queries in the 28 files take a `groupIds: string[]` filter instead of reading `course.group_id`.

### Services (`apps/api/src/services/`)

- `course/enrollment-context.ts`: `resolveCourseEnrollment`.
- `cohort/cohort.ts`: link creation makes a group; enroll and remove target link groups.
- `cohort/schedule.ts`: overrides, shift schedule.
- `course/merge/plan.ts`: suggestions, matching, classification, plan preview (no writes).
- `course/merge/run.ts`: job handler, per-copy transaction, progress events.
- `course/merge/revert.ts`: undo preview and undo job.
- `course/clone.ts`: always set lineage, keep `due_by`.

### Routes

| Method | Path | Description | Auth |
| --- | --- | --- | --- |
| `GET` | `/course/merge/suggestions` | Copy groups for the org | Org admin |
| `POST` | `/course/merge/plan` | Build a plan for chosen courses and primary | Org admin |
| `POST` | `/course/merge` | Start a merge from a confirmed plan | Org admin |
| `GET` | `/course/merge/:mergeId` | Status and progress | Org admin |
| `GET` | `/course/merge/:mergeId/revert-preview` | What undo will do | Org admin |
| `POST` | `/course/merge/:mergeId/revert` | Start undo | Org admin |
| `GET` | `/course/:courseId/merges` | Merge history for a course | Org admin |
| `GET` | `/cohort/:cohortId/courses/:courseId/schedule` | Overrides for a link | Cohort team |
| `PUT` | `/cohort/:cohortId/courses/:courseId/schedule` | Upsert overrides | Cohort team |
| `POST` | `/cohort/:cohortId/courses/:courseId/schedule/shift` | Copy and shift from another link | Cohort team |

Existing course list endpoints (people, marks, submissions, attendance, analytics, newsfeed) accept `cohortId` (or `cohortId=direct`). Each route returns one response shape.

### Dashboard

- `features/course/components/cohort-filter.svelte`: header filter, state in `?cohortId=`.
- `features/course/components/schedule-by-cohort.svelte`: lesson and exercise editor panel.
- `features/course/pages/merge/`: wizard steps, animation, result.
- `features/course/components/merge-history.svelte`: settings section and undo dialog.
- Courses page: suggestion banner and toolbar button.
- All copy in `en.json` under `course.cohorts.*` and `course.merge.*`; run `pnpm translate`.

## Implementation Order

1. **Schema and backfill.** Migration, backfills, unique-key changes. No behavior change.
2. **Enrollment groups.** Link groups, cohort enroll and remove, access check, `resolveCourseEnrollment`.
3. **Read paths.** Group filters across the 28 files, API v1 and MCP `cohortId` params.
4. **Cohort filter UI** on course pages.
5. **Schedule overrides** (API, editor panel, reminders).
6. **Clone fixes** and the "Run a new cohort" choice.
7. **Merge plan** (suggestions, matching, review UI) behind a feature flag.
8. **Merge run and undo** (job, change log, animation, history).
9. **Pilot** with Academy A and Academy B before general release.

## Acceptance Criteria

1. Linking a course to a second cohort creates a separate group. Students of cohort A cannot see cohort B's submissions, comments, attendance or newsfeed posts.
2. A course with no cohort links behaves exactly as before.
3. A Programs-style cohort with several courses behaves exactly as before for its students.
4. A student in two cohorts of one course has independent progress, submissions and completion records in each.
5. A live lesson shows each cohort its own date, call link and recording. A lesson locked for one cohort is open for another.
6. Instructors can filter every learner list by cohort, Direct, or All cohorts.
7. Duplicating a course records lineage and keeps exercise due dates.
8. The merge wizard detects the Academy A and Academy B copy groups and recommends a primary with a stated reason.
9. Merging Academy A's 7 active copies yields one course with 7 cohorts. 126 enrollments, 217 submissions, 1347 answers and 899 lesson completions remain visible under the right cohort.
10. The two Academy A cohorts missing Week 4 gain it after the merge, locked if the admin chose that.
11. Answers to questions that did not match remain viewable, before and after finalization, and submission totals are unchanged.
12. Undo within 30 days restores every copy, its enrollments and its activity. Post-merge activity on gained items moves to clones of those items in the restored copy, and stays visible to the student.
13. Old copy URLs redirect to the merged course.
14. All new UI strings use translation keys. API and dashboard builds pass.

## Risks and Mitigations

- **Missed read paths leak data across cohorts.** Route every learner query through `getCourseEnrollmentGroups` and add an integration test per endpoint that seeds two cohorts and asserts isolation.
- **Merge corrupts data.** Per-copy transactions, a change log written in the same transaction, a dry-run plan the admin reviews, read-only lock during the job, and a rollback-sensitive integration test (fail on the last copy, assert earlier copies are intact or fully applied).
- **Fuzzy matching pairs the wrong items.** Fuzzy matches are never applied silently; they appear as "Matched by similar title" in the review step for the admin to confirm.
- **Undo after heavy post-merge activity.** The undo preview lists the gained items that will be cloned into each restored copy and the activity that moves onto them, before the admin confirms.
- **Backfill moves the wrong students.** The backfill only moves students whose profile is on the link's cohort roster; everyone else stays Direct. Run it first as a dry run that reports per course how many students move to each cohort and how many stay Direct, and add a migration test with one course, two linked cohorts, a Direct student and a student on both rosters.

## Customer follow-ups (from the audit)

Independent of this build, raise these with the customers or fix in data:

1. **Academy B, cohort B3** has 1 student and no linked course; the 14 Nov 2026 copy has 0 students. That student has no course access today.
2. **Roster drift:** A1 (0 of 33), A3 (0 of 9), A4 (1 of 8), B1 (4 of 5), B2 (1 of 2) cohort rosters do not match course enrollment.
3. **Missing content:** Academy A's 23 Aug and 05 Sep cohorts (36 students) never received Week 4.
4. **Overdue exercises:** every exercise in every duplicated course is due at the moment it was cloned.
5. **Retakes:** 3 Academy A students are enrolled in more than one copy. After a merge they hold two enrollments on one course, which FR1 supports.

## Open Questions

1. Should Direct enrollments be allowed on a course that has cohort links, or should new direct enrollments be routed to a default cohort?
2. Should the undo window be configurable per org, or fixed at 30 days?
3. Should merging also combine course-level analytics history (`analytics_course_daily`), or keep the copies' history under the archived courses?
