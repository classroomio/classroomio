# Reset Student Course Progress

## Purpose

Give course admins/tutors a safe, well-scoped way to **clear a single student's
progress in a single course** from the student's profile page (Course →
People → student detail). This is intended for cases like:

- Re-running a learner through a course after a failed cohort attempt.
- Letting a learner retake a compliance/certification cycle from scratch.
- Cleaning up test data accidentally produced by a real account.

This PRD documents only the new behavior; it does **not** modify the existing
"remove member from course" flow (that is destructive and removes the
`groupmember` row).

## Scope

In scope:

- A **Reset progress** action on the course people detail page (`/courses/[id]/people/[personId]`).
- A confirmation **dialog** (using `Dialog.Footer`) that explicitly lists what
  will be deleted, and offers **Cancel** / **Delete** actions.
- A backend endpoint that performs the reset for one `(courseId, profileId)`
  pair inside a single DB transaction.
- Telemetry / audit logging so we can trace who reset whom.

Out of scope (for v1):

- Bulk reset (multiple students at once).
- Resetting only a subset of progress (e.g. only exercises). v1 is "reset
  everything for this student in this course".
- Restoring/undoing a reset. The action is final.
- Resetting program-level goal assignments. Program goals re-evaluate from
  course-level state, so clearing course progress will indirectly recompute
  program goal status on the next evaluation; we do not delete
  `program_goal_assignment` rows.

## User Story

> As a course admin or tutor, when I open a student in **Course → People →
> [student]**, I want a clearly labeled button to **clear that student's
> progress in this course** (lesson completion, video progress, exercise
> submissions, comments, certificate state, …). Before anything is deleted I
> want a confirmation modal that spells out **exactly** what will be removed,
> with a **Cancel** and a destructive **Delete** action. The student should
> remain enrolled (still appear in the People list) so they can restart the
> course.

## UX Flow

1. Admin/tutor opens `/courses/:courseId/people/:personId`.
2. In the page header (next to the existing back/refresh actions in the people
   layout), a new destructive-styled **Reset progress** button is shown.
   - Only visible for roles `ADMIN` (`1`) and `TUTOR` (`2`) — gated via the
     existing `RoleBasedSecurity` wrapper used in
     `routes/(app)/courses/[id]/people/+layout.svelte`.
   - The button is hidden / disabled if the analytics fail to load (we do not
     want to allow reset without seeing the impact).
3. Clicking the button opens a **Reset progress dialog**.
   - Title: e.g. *"Reset progress for {studentName}?"*
   - Body:
     - One sentence framing: *"This permanently deletes this student's
       progress in this course. They will stay enrolled and can restart from
       lesson 1."*
     - A bullet list spelling out what will be deleted, populated with the
       counts from the loaded analytics (so the teacher sees real numbers):
       - **Lessons completed** — _N_ of _M_
       - **Exercises submitted** — _N_ submissions
       - **Lesson comments** by this student — _N_
       - **Newsfeed and community posts/replies** by this student — _N_
       - **Video watch progress** — _N_ lessons tracked
       - **Attendance entries** — _N_
       - **Certification / compliance records** — _yes / no_
     - A small destructive callout: *"This cannot be undone."*
   - `Dialog.Footer`:
     - **Cancel** — `variant="outline"`, closes the dialog.
     - **Delete** — `variant="destructive"`, runs the reset and shows a
       loading state. On success the dialog closes and a snackbar confirms
       *"Progress reset"*; the page reloads the analytics so the counts and
       UI reflect the cleared state.
4. After reset, the student profile page re-renders with empty progress
   (0% complete, 0 exercises, no completed lessons, etc.) but the user is
   still listed in `Course → People`.

## What Gets Deleted

The reset is scoped to a single `(courseId, profileId)` pair. The
corresponding `groupmember` row in this course is identified by joining
`groupmember` → `course` on `course.group_id` and using the page's
`personId` (which today is a `profile.id`).

The following rows are deleted inside a single transaction:

### Direct learner progress

- `lesson_completion` where `profile_id = student.profileId` and
  `lesson_id` belongs to a `lesson` whose `course_id = courseId`.
- `lesson_video_progress` where `profile_id = student.profileId` and
  `lesson_id` belongs to a `lesson` whose `course_id = courseId`.
- `submission` where `course_id = courseId` and `submitted_by =
  groupmember.id` (the student's `groupmember.id` for **this** course).
  - Cascades take care of related `question_answer` rows that are linked to
    submissions via existing FKs.
- `group_attendance` where `course_id = courseId` and `student_id =
  groupmember.id`.

### Student-authored social content tied to this course

- `lesson_comment` where `groupmember_id = student.groupmember.id`.
- `course_newsfeed` rows authored by the student in this course
  (`course_id = courseId` AND `author_id = student.profileId`).
- `course_newsfeed_comment` authored by the student on newsfeed posts that
  belong to this course (join through `course_newsfeed.course_id`).
- `community_question` and `community_answer` authored by the student in
  this course (community questions filter on `course_id`; community answers
  filter via the question's `course_id`).

### Certification & compliance state (course-scoped)

- `course_certificate_issue` for `(course_id = courseId, profile_id =
  student.profileId)`.
- `course_completion_notification_event` cascaded via
  `course_completion_record` for `(course_id, profile_id)`.
- `course_completion_record` for `(course_id = courseId, profile_id =
  student.profileId)`.
- `groupmember.certificate_earned_at` and
  `groupmember.certification_email_sent_at` are reset to `NULL` for the
  student's groupmember row in this course.

### AI / chat state scoped to this course

- `ai_chat_conversation` rows for `(course_id = courseId, user_id =
  student.profileId)`.
  - Connected `ai_chat_document` etc. fall away through their FKs if any;
    if no cascade is wired we delete dependents explicitly inside the
    transaction.

### Explicitly NOT deleted

- `groupmember` itself (the student stays enrolled).
- `profile` / `user` / `organization_member` rows.
- `course_invite` history and invite audit logs.
- Program-level rows: `program_member`, `program_goal`,
  `program_goal_assignment`. Program goals are re-evaluated from course
  state on their next run, so the goal status will naturally update.
- AI tutor monthly counters (`ai_tutor_message_count`,
  `ai_tutor_cap_event`). Those are billing/abuse signals, not progress.
- Org-wide analytics aggregates (`analytics_course_daily`, etc.). Those
  are point-in-time aggregates and should not be retroactively rewritten.

The PRD update step during implementation must add any newly introduced
"progress-like" tables to this list and to the reset transaction.

## Implementation Plan

This follows the route conventions in `AGENTS.md`.

### 1. Validation schema

`packages/utils/src/validation/course/people.ts`:

```ts
export const ZResetCourseMemberProgressParam = z.object({
  courseId: z.string().uuid(),
  memberId: z.string().uuid()
});
export type TResetCourseMemberProgressParam = z.infer<
  typeof ZResetCourseMemberProgressParam
>;
```

We key the route on `memberId` (the `groupmember.id`) to stay consistent
with the existing `PUT /course/:courseId/members/:memberId` and `DELETE
/course/:courseId/members/:memberId` shape. The service resolves the
`profileId` server-side.

### 2. DB queries

New file `packages/db/src/queries/course/reset-progress.ts` with a single
exported function:

```ts
export async function resetStudentCourseProgress(input: {
  courseId: string;
  groupMemberId: string;
  profileId: string;
}): Promise<ResetStudentCourseProgressSummary>;
```

- Runs everything inside `db.transaction(async (tx) => { ... })`.
- Performs the deletes listed in **What Gets Deleted** above.
- Returns a small summary object with the row counts deleted per table so
  the service can log it and the API can return it for the snackbar /
  audit trail.
- Each delete is implemented with explicit, narrow `where(...)` filters
  joined through the schema so we cannot accidentally delete rows from
  another course.
- Wrapped in `try/catch` with `console.error('resetStudentCourseProgress
  error:', error)` per repo convention.

### 3. Service

`apps/api/src/services/course/people.ts` gets a new function:

```ts
export async function resetMemberCourseProgress(
  courseId: string,
  memberId: string
): Promise<ResetStudentCourseProgressSummary>;
```

- Loads the member via `getCourseMember(courseId, memberId)`.
- Throws `AppError('Course member not found', ErrorCodes.NOT_FOUND, 404)`
  if missing or if `profileId` is null (invite-only ghost member — nothing
  to reset).
- Calls `resetStudentCourseProgress({ courseId, groupMemberId: memberId,
  profileId: member.profileId })`.
- Logs `{ actorProfileId, courseId, memberId, summary }` so audit grep is
  easy.

### 4. Route

In `apps/api/src/routes/course/people.ts`, mount a new endpoint:

```
POST /course/:courseId/members/:memberId/reset-progress
```

- Uses `courseTeamMemberMiddleware` (admin/tutor only) — same gate as the
  other destructive member routes.
- Validates params with `ZResetCourseMemberProgressParam`.
- Calls `resetMemberCourseProgress(...)`.
- Returns `{ success: true, data: summary }` on success and uses
  `handleError(c, error, 'Failed to reset course member progress')` in
  the catch.

Method choice: `POST` (rather than `DELETE`) because the action is
**state-changing on multiple tables** and we want the body to carry a
summary response. A `DELETE` on `…/progress` would technically work but
clients (and Hono RPC type inference) handle `POST … success/data` more
cleanly.

### 5. Register

The `membersRouter` is already mounted under `/course/:courseId/members`.
No changes to `app.ts` are needed.

### 6. Build & frontend types

After `pnpm --filter @cio/api build`, add to
`apps/dashboard/src/lib/features/course/utils/types.ts`:

```ts
export type ResetMemberCourseProgressRequest =
  (typeof classroomio.course)[':courseId']['members'][':memberId']['reset-progress']['$post'];
```

### 7. Frontend API class

Add a method to `apps/dashboard/src/lib/features/course/api/people.svelte.ts`:

```ts
async resetCourseProgress(courseId: string, memberId: string) {
  await this.execute<ResetMemberCourseProgressRequest>({
    requestFn: () =>
      classroomio.course[':courseId']['members'][':memberId']['reset-progress'].$post({
        param: { courseId, memberId }
      }),
    logContext: 'resetting course member progress',
    onSuccess: () => {
      snackbar.success('snackbar.course.people.progress_reset');
      this.success = true;
      this.errors = {};
    },
    onError: (result) => {
      if (typeof result === 'string') {
        snackbar.error('snackbar.course.people.progress_reset_failed');
      }
    }
  });
}
```

The page that calls this also invalidates `+page.server.ts` so the
analytics are re-fetched after success.

### 8. UI

Two new files under
`apps/dashboard/src/lib/features/course/components/people/`:

- `reset-progress-button.svelte` — a destructive-styled `Button` that
  opens the dialog. Uses `RoleBasedSecurity allowedRoles={[1, 2]}`.
- `reset-progress-dialog.svelte` — the `Dialog.Root` confirmation modal.
  - Uses `Dialog.Header` (title + description), a list of impact bullets
    built from `data.userCourseAnalytics`, and `Dialog.Footer` with
    **Cancel** (`variant="outline"`) and **Delete** (`variant="destructive"`).
  - Disables the **Delete** button while `peopleApi.isLoading` is true and
    shows a spinner on the button. Closes the dialog and snackbars on
    completion.

Mount points:

- The **Reset progress** button is rendered in the people **layout** when
  `data.personId` is present (so it appears next to the back arrow and
  refresh action). The dialog itself can live alongside it.

  Alternative: place the button inside the person `+page.svelte` next to
  the hero card. Layout placement keeps the destructive action visually
  grouped with the rest of the per-person actions and matches where the
  back/refresh controls already are.

  Decision: **layout placement**, so the action is consistently positioned
  for every person detail view.

### 9. Translations

Add the following keys to
`apps/dashboard/src/lib/utils/translations/en.json` (exact text TBD with
copy review):

- `course.navItem.people.reset_progress.button`
- `course.navItem.people.reset_progress.dialog.title`
- `course.navItem.people.reset_progress.dialog.intro`
- `course.navItem.people.reset_progress.dialog.bullets.lessons`
- `course.navItem.people.reset_progress.dialog.bullets.exercises`
- `course.navItem.people.reset_progress.dialog.bullets.comments`
- `course.navItem.people.reset_progress.dialog.bullets.community`
- `course.navItem.people.reset_progress.dialog.bullets.video_progress`
- `course.navItem.people.reset_progress.dialog.bullets.attendance`
- `course.navItem.people.reset_progress.dialog.bullets.certificate`
- `course.navItem.people.reset_progress.dialog.warning`
- `course.navItem.people.reset_progress.dialog.cancel`
- `course.navItem.people.reset_progress.dialog.confirm`
- `snackbar.course.people.progress_reset`
- `snackbar.course.people.progress_reset_failed`

Bullet copy uses `{count}` placeholders (e.g. *"Delete {count} exercise
submissions"*) and is fed from the analytics that already power the
person page. Per repo workflow, after editing `en.json` run `cd
apps/dashboard && pnpm translate` and review the generated locale files
to make sure `{count}` placeholders survived.

## Authorization & Safety

- **Auth**: the route is behind `courseTeamMemberMiddleware`. Only course
  admins/tutors can call it. The UI button is gated by `RoleBasedSecurity
  allowedRoles={[1, 2]}` to match.
- **Confirmation**: destructive action is gated behind a modal with an
  explicit *"This cannot be undone."* warning and a *Delete* (not "OK")
  action button.
- **Idempotency**: re-running the action on an already-cleared student is
  a no-op (all `delete` queries simply match zero rows).
- **Atomicity**: all deletes happen inside one DB transaction. Either the
  student's whole course state is cleared or nothing is.
- **Audit**: server logs `{ actorProfileId, courseId, memberId, summary
  }` on every successful reset. We do not (in v1) write a new audit row;
  if the team wants persistent auditing we can add a `course_audit_log`
  later (see Future Work).

## Testing

- **Unit (`packages/db`)**: a Vitest test that seeds a course with two
  students, fills in lessons completed / submissions / lesson comments /
  newsfeed comments / certificate / completion record for both, calls
  `resetStudentCourseProgress` for one, and asserts:
  - The targeted student has 0 rows left in every affected table for this
    course.
  - The other student is **untouched**.
  - Rows from a second course owned by the same student are **untouched**.
  - `groupmember.certificate_earned_at` and `certification_email_sent_at`
    are `NULL` for the targeted student in this course.
  - `groupmember` row itself is still present.
- **Service**: returns 404 `AppError` when called with an unknown
  `memberId` or with a member whose `profileId` is null.
- **API integration**: a request from a non-team member returns 403 via
  the existing middleware; a request from an admin returns 200 and the
  expected summary shape.
- **Dashboard (Playwright/manual)**: open a populated student profile,
  click **Reset progress**, confirm the modal, verify analytics show
  zeroed counts after refresh.

## Future Work

- Bulk reset across selected students.
- "Reset cycle only" mode for compliance courses with cycles — clear the
  current cycle but keep prior `course_completion_record` rows for
  history.
- Persistent audit log surfaced in the org admin panel.
- Granular reset (e.g. "only exercise submissions" or "only lesson
  progress") if user research shows demand.
