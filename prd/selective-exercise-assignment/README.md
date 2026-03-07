# Selective Exercise Assignment PRD

## Status

- Draft

## Date

- March 4, 2026

## Implementation Plan

- See [implementation-plan.md](./implementation-plan.md) for phased delivery.

## Purpose

Enable instructors to assign an exercise to only selected students in a course, instead of all students by default, while keeping existing course behavior unchanged for non-targeted exercises.

## Problem Statement

Today, every exercise in a course is implicitly available to every enrolled student. This creates problems for common teaching workflows:

1. Remedial assignments cannot be sent to only struggling students.
2. Advanced assignments cannot be targeted to a smaller high-performing group.
3. Makeup tasks cannot be assigned privately without cloning content or creating separate courses.
4. Student analytics and completion rates are skewed when students are expected to ignore irrelevant exercises.

## Current-State Audit

| Area | Current State | Gap for Selective Assignment |
| --- | --- | --- |
| `exercise` data model | Global `isUnlocked`, no audience targeting | No way to represent "who this exercise is for" |
| Course membership | `groupmember` links profile to course group | No exercise-level audience mapping |
| Course content fetch | `getCourseContentItems(courseId, profileId?)` returns all exercises in course | Students always see all exercises |
| Exercise detail fetch | `GET /course/:courseId/exercise/:exerciseId` allows any course member | Unassigned students can still fetch exercise payload |
| Exercise submission | `POST /course/:courseId/exercise/:exerciseId/submission` only checks course membership | No server-side assignment guard |
| LMS exercises feed | `getLMSExercises(profileId, orgId)` loads all exercises in enrolled courses | Unassigned exercises appear in student LMS views |
| Progress & analytics | Exercise totals are computed from all course exercises | Unassigned exercises lower completion rates unfairly |
| Instructor UI | Exercise page has content editing only | No "assign to students" controls |

## Data Sources Checked

- `packages/db/src/schema.ts`
- `packages/db/src/queries/course/content.ts`
- `packages/db/src/queries/exercise/exercise.ts`
- `packages/db/src/queries/exercise/lms.ts`
- `packages/db/src/queries/course/course.ts`
- `packages/db/src/queries/analytics/analytics.ts`
- `apps/api/src/routes/course/exercise.ts`
- `apps/api/src/services/exercise/exercise.ts`
- `apps/api/src/routes/course/course.ts`
- `apps/api/src/routes/organization/organization.ts`
- `apps/dashboard/src/lib/features/course/pages/exercise.svelte`
- `apps/dashboard/src/lib/features/course/api/exercise.svelte.ts`
- `apps/dashboard/src/lib/features/course/components/lesson/content-list.svelte`
- `apps/dashboard/src/lib/features/course/components/sidebar/course-content-tree.svelte`

## Confirmed Decisions

1. Default behavior remains unchanged: new and existing exercises are assigned to all students.
2. Selective assignment applies only to students (`ROLE.STUDENT`), never tutors/admins.
3. Assignment is stored against `groupmember.id` (course-scoped membership identity).
4. Unassigned students do not see targeted exercises in content trees or LMS exercise lists.
5. Direct API access is blocked server-side for unassigned students.
6. Existing submissions are preserved if a student is later unassigned.
7. Newly enrolled students are not auto-added to selectively assigned exercises.
8. Instructor analytics should not count unassigned exercises in a student's denominator.

## Goals

1. Let instructors set each exercise audience to either all students or selected students.
2. Ensure selective assignment is enforced consistently in all student-facing APIs.
3. Keep instructor and admin experience fully intact with visibility into all exercises.
4. Keep migration low risk and backward compatible.
5. Keep performance stable for courses with large student rosters.

## Non-Goals (v1)

- Assignment by invite email before student enrollment.
- Group rules like "assign by tag/domain/score threshold."
- Scheduled auto-assignment rules.
- Assignment for lessons (this PRD is exercise-only).
- Student-facing "why I am not assigned" messaging model beyond standard hidden behavior.

## Primary Users

- Instructors (admins/tutors) creating targeted learning paths.
- Students receiving only relevant exercises.
- Program managers reading analytics that reflect actual assigned workload.

## User Stories

1. As a tutor, I can assign Exercise A to only 12 students who need extra practice.
2. As a tutor, I can switch Exercise A back to all students later without recreating it.
3. As a student not assigned Exercise A, I should not see it in my course content list.
4. As a student assigned Exercise A, I can open and submit it like any normal exercise.
5. As an instructor, analytics should not mark unassigned students as incomplete for Exercise A.

## Functional Requirements

### FR-1: Assignment Modes per Exercise

Each exercise has one audience mode:

- `ALL_STUDENTS` (default)
- `SELECTED_STUDENTS`

Rules:

- `ALL_STUDENTS`: every current and future student in course group has access.
- `SELECTED_STUDENTS`: only explicitly assigned students have access.
- `SELECTED_STUDENTS` cannot be saved with an empty student list.

### FR-2: Instructor Assignment Management

Instructors can:

1. Open assignment settings on exercise page.
2. Switch mode between all students and selected students.
3. Search/select enrolled students (course members with `roleId = ROLE.STUDENT`).
4. Save assignment changes atomically.
5. See summary label such as:
- `Assigned to all students`
- `Assigned to 12 students`

### FR-3: Student Visibility and Access Control

For student viewers:

1. Unassigned exercises are excluded from course content payload.
2. Unassigned exercises are excluded from organization LMS exercises payload.
3. `GET /course/:courseId/exercise/:exerciseId` returns access-denied behavior for unassigned students.
4. `POST /course/:courseId/exercise/:exerciseId/submission` is rejected for unassigned students.

For non-student viewers (tutor/admin/org admin):

1. All exercises remain visible.
2. Full assignment metadata is available where needed.

### FR-4: Reassignment Semantics

When an instructor changes assignment:

1. `ALL_STUDENTS -> SELECTED_STUDENTS`:
- Removed students immediately lose access.
- Existing submissions from removed students remain visible to instructors.
2. `SELECTED_STUDENTS -> ALL_STUDENTS`:
- All students immediately gain access.
3. Updating selected list:
- Added students gain access immediately.
- Removed students lose access immediately.

### FR-5: Enrollment Behavior

1. New student joins course:
- Exercises in `ALL_STUDENTS` are accessible immediately.
- Exercises in `SELECTED_STUDENTS` are not accessible unless explicitly assigned.
2. Student removed from course:
- Related assignment rows are cleaned via FK cascade.

### FR-6: Analytics and Progress Correctness

For student-specific analytics and progress:

1. Exercise denominator includes only exercises assigned to that student.
2. Completion rate and average grade calculations use assigned exercise set.
3. Course-level aggregate analytics reuse corrected per-student data.

## Technical Design

### 1. Data Model

#### 1.1 New Enum on Exercise

```sql
CREATE TYPE EXERCISE_ASSIGNMENT_MODE AS ENUM ('ALL_STUDENTS', 'SELECTED_STUDENTS');

ALTER TABLE exercise
  ADD COLUMN assignment_mode EXERCISE_ASSIGNMENT_MODE NOT NULL DEFAULT 'ALL_STUDENTS';
```

Drizzle (`packages/db/src/schema.ts`):

```typescript
export const exerciseAssignmentMode = pgEnum('EXERCISE_ASSIGNMENT_MODE', [
  'ALL_STUDENTS',
  'SELECTED_STUDENTS'
]);

// in exercise table
assignmentMode: exerciseAssignmentMode('assignment_mode').default('ALL_STUDENTS').notNull();
```

#### 1.2 New Join Table

```sql
CREATE TABLE exercise_assignment (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exercise_id UUID NOT NULL REFERENCES exercise(id) ON DELETE CASCADE,
  group_member_id UUID NOT NULL REFERENCES groupmember(id) ON DELETE CASCADE,
  assigned_by_profile_id UUID REFERENCES profile(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE UNIQUE INDEX exercise_assignment_unique
  ON exercise_assignment (exercise_id, group_member_id);

CREATE INDEX idx_exercise_assignment_exercise_id
  ON exercise_assignment (exercise_id);

CREATE INDEX idx_exercise_assignment_group_member_id
  ON exercise_assignment (group_member_id);
```

Design notes:

1. `group_member_id` ensures assignment is tied to course membership context.
2. Service layer validates each selected `groupmember` belongs to exercise course and is student role.
3. No denormalized `course_id` is added to avoid redundant consistency checks.

### 2. Query Layer Changes

#### 2.1 New exercise-assignment queries

Add query functions under `packages/db/src/queries/exercise`:

1. `listExerciseAssignments(exerciseId)`
2. `replaceExerciseAssignments(exerciseId, groupMemberIds, assignedByProfileId, tx?)`
3. `getExerciseAssignmentSummary(exerciseId)`
4. `isExerciseAssignedToGroupMember(exerciseId, groupMemberId)`
5. `resolveViewerExerciseAccess(courseId, exerciseId, profileId)` returning `{ roleId, groupMemberId, hasAccess }`

#### 2.2 Course content query filtering

Update `getCourseContentItems(courseId, profileId?)`:

1. Resolve viewer role/groupmember for this course when `profileId` exists.
2. For student viewer, include exercise row only when:
- `exercise.assignment_mode = 'ALL_STUDENTS'`, or
- assignment row exists for viewer `groupmember`.
3. For non-student or anonymous viewer, keep current behavior.
4. Keep completion query semantics unchanged except for filtered exercise set.

#### 2.3 Student analytics/progress query filtering

Update these functions to use assignment-aware exercise sets:

- `packages/db/src/queries/course/course.ts`
1. `getCourseProgress(courseId, profileId)`

- `packages/db/src/queries/analytics/analytics.ts`
1. `getUserExercisesStats(courseId, userId)`
2. `getProfileCourseProgress(courseId, profileId)`

- `packages/db/src/queries/exercise/lms.ts`
1. `getLMSExercises(profileId, orgId)`

### 3. API Design

#### 3.1 New validation schema

Add `packages/utils/src/validation/exercise/assignment.ts`:

```typescript
export const ZExerciseAssignmentUpdate = z
  .object({
    mode: z.enum(['ALL_STUDENTS', 'SELECTED_STUDENTS']),
    studentIds: z.array(z.string().uuid()).default([])
  })
  .superRefine((value, ctx) => {
    if (value.mode === 'SELECTED_STUDENTS' && value.studentIds.length === 0) {
      ctx.addIssue({ code: 'custom', path: ['studentIds'], message: 'Select at least one student' });
    }
  });
```

#### 3.2 New routes

In `apps/api/src/routes/course/exercise.ts`:

1. `GET /course/:courseId/exercise/:exerciseId/assignment`
- Auth: `courseTeamMemberMiddleware`
- Response: mode + assigned student list + count

2. `PUT /course/:courseId/exercise/:exerciseId/assignment`
- Auth: `courseTeamMemberMiddleware`
- Body: `ZExerciseAssignmentUpdate`
- Behavior: atomic mode update + assignment replace

#### 3.3 Updated existing routes

1. `GET /course/:courseId/exercise`
- Student callers receive only assigned exercises
2. `GET /course/:courseId/exercise/:exerciseId`
- Student callers blocked if unassigned
3. `POST /course/:courseId/exercise/:exerciseId/submission`
- Student callers blocked if unassigned

### 4. Service Layer

Add service functions in `apps/api/src/services/exercise/exercise.ts`:

1. `getExerciseAssignment(exerciseId, courseId)`
2. `updateExerciseAssignment(exerciseId, courseId, mode, studentIds, actorProfileId)`
3. `assertStudentExerciseAccess(courseId, exerciseId, profileId)`

Access check behavior:

1. Tutor/admin/org-admin: allow.
2. Student:
- allow if mode is `ALL_STUDENTS`
- allow if mode `SELECTED_STUDENTS` and assignment exists
- deny otherwise

### 5. Frontend Design (Dashboard)

#### 5.1 Types

Add API-derived types in:

- `apps/dashboard/src/lib/features/course/utils/types.ts`

Types:

1. `GetExerciseAssignmentRequest`
2. `UpdateExerciseAssignmentRequest`
3. `ExerciseAssignmentSuccess`

#### 5.2 API class methods

Extend `apps/dashboard/src/lib/features/course/api/exercise.svelte.ts`:

1. `getAssignment(courseId, exerciseId)`
2. `updateAssignment(courseId, exerciseId, payload)`

Use `this.execute<RequestType>()` pattern and zod validation mapping.

#### 5.3 Instructor UI

Add assignment panel component under:

- `apps/dashboard/src/lib/features/course/components/exercise/exercise-assignment-panel.svelte`

UI behavior:

1. Visible only for `ROLE.ADMIN` and `ROLE.TUTOR`.
2. Mode selector: all students vs selected students.
3. Student multi-select sourced from existing members API (filtered to student role).
4. Save CTA with success/error snackbar keys.
5. No hardcoded copy; all translation keys in `en.json`.

Integrate panel into:

- `apps/dashboard/src/lib/features/course/pages/exercise.svelte`

#### 5.4 Student UI behavior

No new explicit student controls.

Expected result:

1. Sidebar and lesson content lists naturally omit unassigned exercises because course content API is filtered.
2. Direct navigation to unassigned exercise path shows access-denied outcome from server response.

### 6. Error Handling

Add new API error code:

- `EXERCISE_NOT_ASSIGNED`

Recommended statuses:

1. Exercise detail read: `403` with `EXERCISE_NOT_ASSIGNED` for students.
2. Submission create: `403` with `EXERCISE_NOT_ASSIGNED`.

### 7. Migration and Backward Compatibility

1. Existing exercises default to `assignment_mode = ALL_STUDENTS`.
2. `exercise_assignment` starts empty.
3. No data backfill is required.
4. Existing clients continue to work because default mode preserves current behavior.

## API Response Shapes (Proposed)

### GET assignment

```json
{
  "success": true,
  "data": {
    "exerciseId": "uuid",
    "mode": "SELECTED_STUDENTS",
    "assignedCount": 2,
    "students": [
      {
        "groupMemberId": "uuid",
        "profileId": "uuid",
        "fullname": "Ada Lovelace",
        "email": "ada@example.com"
      }
    ]
  }
}
```

### PUT assignment

```json
{
  "mode": "SELECTED_STUDENTS",
  "studentIds": ["groupmember-uuid-1", "groupmember-uuid-2"]
}
```

## Observability

Log structured events for assignment mutations:

1. `exercise_assignment_updated`
2. `exercise_assignment_access_denied`

Fields:

- `courseId`, `exerciseId`, `mode`, `assignedCount`, `actorProfileId`, `viewerProfileId`

## Testing Strategy

### Unit Tests

1. Validation schema tests for mode/studentIds rules.
2. Query tests for assignment replacement and uniqueness behavior.
3. Access helper tests for all role/mode combinations.

### Integration/API Tests

1. Instructor can set selected students and read assignment back.
2. Unassigned student cannot fetch exercise detail.
3. Unassigned student cannot submit.
4. Assigned student can fetch and submit.
5. Course content for student excludes unassigned exercises.
6. LMS exercises list excludes unassigned exercises.

### Regression Tests

1. Existing all-students exercises behave exactly as before.
2. Non-student users still see full exercise list.
3. Analytics computations remain stable and assignment-aware.

## Rollout Plan

1. Ship DB schema first (safe default behavior).
2. Ship backend enforcement + new endpoints behind feature flag.
3. Ship instructor UI for selective assignment.
4. Enable feature for internal orgs, then broad rollout.
5. Monitor access-denied and assignment update logs.

## Risks and Mitigations

1. Risk: Assignment checks missed in one endpoint.
- Mitigation: centralize access helper and use integration tests per endpoint.
2. Risk: Analytics regressions due to denominator changes.
- Mitigation: snapshot tests for representative student datasets.
3. Risk: Large student lists in assignment selector.
- Mitigation: client-side search now; add paginated search endpoint if needed.
4. Risk: Confusion when removing assigned students who already submitted.
- Mitigation: show confirmation text before save and keep historical submissions.

## Open Questions

1. Should we support assigning by email before enrollment in v2?
2. Should assignment changes trigger student notifications?
3. Should instructors be able to "copy assignment set" across exercises?

## Definition of Done

1. Schema and migrations are merged and deploy cleanly.
2. Instructor can manage exercise audience from dashboard.
3. Student cannot see or submit unassigned exercises through any supported route.
4. Student progress and exercise analytics are assignment-aware.
5. Existing exercises with default mode show no behavioral regression.
6. API, DB, and dashboard builds pass.
