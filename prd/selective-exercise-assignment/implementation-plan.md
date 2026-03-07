# Selective Exercise Assignment Implementation Plan

## Scope Lock

1. Feature targets exercises only, not lessons.
2. Assignment is by enrolled student membership (`groupmember.id`), not by raw profile/email.
3. Exercise assignment modes are only `ALL_STUDENTS` and `SELECTED_STUDENTS`.
4. Assignment enforcement must run server-side for all student-facing exercise access paths.
5. Existing exercises stay globally visible (`ALL_STUDENTS`) unless explicitly changed.

## Delivery Phases

1. Phase A: DB schema + query foundations.
2. Phase B: API validation, services, and routes.
3. Phase C: Student visibility and analytics enforcement.
4. Phase D: Dashboard instructor UX.
5. Phase E: Testing, rollout, and hardening.

## Ticket Breakdown

| ID | Area | Task | Key Files | Depends On | Done When |
| --- | --- | --- | --- | --- | --- |
| SEA-A1 | DB Schema | Add `EXERCISE_ASSIGNMENT_MODE` enum and `exercise.assignment_mode` column | `packages/db/src/schema.ts` | None | Schema compiles and defaults to `ALL_STUDENTS` |
| SEA-A2 | DB Schema | Add `exercise_assignment` table + constraints + indexes | `packages/db/src/schema.ts` | SEA-A1 | Table has FK cascade and unique `(exercise_id, group_member_id)` |
| SEA-A3 | DB Migration | Generate migration SQL and metadata | `packages/db/src/migrations/*` | SEA-A1, SEA-A2 | Migration applies and rollback is validated |
| SEA-A4 | DB Queries | Add assignment CRUD helpers | `packages/db/src/queries/exercise/exercise.ts` (or new `assignment.ts`) | SEA-A2 | Replace/list/read helpers available with error logging pattern |
| SEA-A5 | DB Queries | Add shared access-check query helper for profile -> exercise | `packages/db/src/queries/exercise/*` | SEA-A4 | Helper returns role/groupmember/access decision reliably |
| SEA-B1 | Validation | Add assignment update schema | `packages/utils/src/validation/exercise/assignment.ts` + exports | SEA-A1 | Zod enforces non-empty studentIds for selected mode |
| SEA-B2 | API Errors | Add `EXERCISE_NOT_ASSIGNED` error code | `apps/api/src/utils/errors.ts` | None | Services can return specific denial code |
| SEA-B3 | API Service | Add `getExerciseAssignment` and `updateExerciseAssignment` service methods | `apps/api/src/services/exercise/exercise.ts` | SEA-A4, SEA-B1 | Team members can view/update assignment atomically |
| SEA-B4 | API Service | Add reusable `assertStudentExerciseAccess` guard | `apps/api/src/services/exercise/exercise.ts` | SEA-A5 | Guard can be called by detail/list/submission paths |
| SEA-B5 | API Route | Add `GET /course/:courseId/exercise/:exerciseId/assignment` | `apps/api/src/routes/course/exercise.ts` | SEA-B3 | Returns mode + assigned students |
| SEA-B6 | API Route | Add `PUT /course/:courseId/exercise/:exerciseId/assignment` | `apps/api/src/routes/course/exercise.ts` | SEA-B3 | Updates mode and assignment list |
| SEA-B7 | API Route | Enforce assignment guard on exercise detail endpoint | `apps/api/src/routes/course/exercise.ts` | SEA-B4 | Unassigned students blocked server-side |
| SEA-B8 | API Route | Enforce assignment guard on exercise submission endpoint | `apps/api/src/routes/course/exercise.ts` | SEA-B4 | Unassigned students cannot submit |
| SEA-C1 | Course Content | Filter unassigned exercises in course content fetch for students | `packages/db/src/queries/course/content.ts` | SEA-A5 | Student course payload excludes unassigned exercises |
| SEA-C2 | Exercise List | Filter unassigned exercises in list endpoint for students | `packages/db/src/queries/exercise/exercise.ts`, `apps/api/src/services/exercise/exercise.ts` | SEA-A5 | Student list endpoint returns only assigned exercises |
| SEA-C3 | LMS Exercises | Filter unassigned exercises in org LMS exercises query | `packages/db/src/queries/exercise/lms.ts` | SEA-A5 | Student LMS exercise page excludes unassigned items |
| SEA-C4 | Progress Query | Make `getCourseProgress` assignment-aware | `packages/db/src/queries/course/course.ts` | SEA-A5 | Denominator uses assigned exercise set |
| SEA-C5 | Analytics Query | Make `getUserExercisesStats` assignment-aware | `packages/db/src/queries/analytics/analytics.ts` | SEA-A5 | Stats only include assigned exercises |
| SEA-C6 | Analytics Query | Make `getProfileCourseProgress` assignment-aware | `packages/db/src/queries/analytics/analytics.ts` | SEA-A5 | Profile progress excludes unassigned exercises |
| SEA-D1 | Dashboard Types | Add request/response assignment types in course feature `utils/types.ts` | `apps/dashboard/src/lib/features/course/utils/types.ts` | SEA-B5, SEA-B6 | Types inferred from API RPC contract |
| SEA-D2 | Dashboard API | Add `getAssignment` + `updateAssignment` methods | `apps/dashboard/src/lib/features/course/api/exercise.svelte.ts` | SEA-D1 | API class handles loading/success/error states |
| SEA-D3 | Dashboard UI | Build instructor assignment panel component | `apps/dashboard/src/lib/features/course/components/exercise/exercise-assignment-panel.svelte` | SEA-D2 | Instructor can set mode + selected students |
| SEA-D4 | Dashboard UI | Integrate panel into exercise page (admin/tutor only) | `apps/dashboard/src/lib/features/course/pages/exercise.svelte` | SEA-D3 | Assignment controls visible and functional in exercise page |
| SEA-D5 | Translations | Add assignment-related translation keys | `apps/dashboard/src/lib/utils/translations/en.json` | SEA-D3 | No hardcoded user-facing copy |
| SEA-D6 | UX Hardening | Add warning modal when removing assigned students with submissions | assignment panel + API check | SEA-D3 | Instructor sees explicit warning before save |
| SEA-E1 | Tests | Add validation + query unit tests | `packages/utils`, `packages/db` test locations | SEA-A4, SEA-B1 | Core rules and DB helper behavior covered |
| SEA-E2 | Tests | Add API integration tests for access enforcement | `apps/api` tests | SEA-B7, SEA-B8, SEA-C1 | Student access blocked consistently |
| SEA-E3 | Tests | Add regression tests for all-students default behavior | API + query tests | SEA-B8 | Existing flow unchanged when mode is default |
| SEA-E4 | Rollout | Add feature flag (optional), staged enable checklist, and monitoring hooks | API config/docs | SEA-E2 | Safe staged rollout documented and executable |
| SEA-E5 | Verification | Run cross-package builds and smoke checks | workspace commands | SEA-D6 | `@cio/db`, `@cio/utils`, `@cio/api`, `@cio/dashboard` build clean |

## API Contract Targets

### Protected Course Routes

1. `GET /course/:courseId/exercise/:exerciseId/assignment`
2. `PUT /course/:courseId/exercise/:exerciseId/assignment`

### Updated Protected Behavior

1. `GET /course/:courseId/exercise` returns assigned-only list for student viewers.
2. `GET /course/:courseId/exercise/:exerciseId` enforces assignment for student viewers.
3. `POST /course/:courseId/exercise/:exerciseId/submission` enforces assignment for student viewers.

## Acceptance Criteria by Phase

### Phase A

1. Migration adds new enum, column, and join table.
2. Existing exercises resolve to `ALL_STUDENTS`.
3. Query helper API is available for assignment set replacement and access checks.

### Phase B

1. Team members can fetch and update assignment state via new endpoints.
2. Validation rejects `SELECTED_STUDENTS` with empty student list.
3. API returns consistent error code for unassigned access.

### Phase C

1. Student course content payload excludes unassigned exercises.
2. Student LMS exercises feed excludes unassigned exercises.
3. Student progress/analytics denominator excludes unassigned exercises.
4. Non-student viewers still see all exercises.

### Phase D

1. Instructor UI allows mode switch and student selection.
2. UI uses translation keys and existing API class patterns.
3. Save flow is explicit and resilient to validation failures.

### Phase E

1. Automated tests cover access rules and regression paths.
2. Rollout checklist is documented.
3. Build verification passes across affected packages.

## Verification Commands

1. `pnpm --filter @cio/db build`
2. `pnpm --filter @cio/utils build`
3. `pnpm --filter @cio/api build`
4. `pnpm --filter @cio/dashboard build`
5. Run targeted tests for DB queries and API routes.

## Suggested First Sprint Slice

1. SEA-A1, SEA-A2, SEA-A3, SEA-A4
2. SEA-B1, SEA-B2, SEA-B3, SEA-B4
3. SEA-B7, SEA-B8
4. SEA-C1

This delivers schema + core enforcement quickly so student access correctness is solved before UI polish.
