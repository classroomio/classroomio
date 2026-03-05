# Course Cohorts PRD

## Purpose

Enable instructors to run a single course with multiple independent groups of learners (cohorts). Each cohort has its own enrollment, assignment submissions, grading, newsfeed, attendance, and progress tracking, while sharing the same course content. Cohorts can be deactivated to revoke access or scheduled to start at a future date.

## Problem Statement

Currently, ClassroomIO has a 1:1 relationship between a course and its membership group. If an instructor wants to run the same training for a new batch of students, they must clone the entire course. This leads to:
- Content duplication and drift between copies
- No unified view of all batches running under one course
- No way to deactivate a past batch while keeping content accessible for new ones
- Manual bookkeeping to track which copy belongs to which batch

## Confirmed Decisions

1. **Terminology**: "Cohorts" internally and in the instructor-facing UI.
2. **Opt-in**: Cohorts are opt-in per course. Courses without cohorts work exactly as they do today (default single group).
3. **Cross-cohort analytics**: Instructors can view aggregated analytics across all cohorts.
4. **Student retakes**: A student can be enrolled in multiple cohorts of the same course (e.g., retake scenarios).
5. **Deadlines**: Cohort-level deadlines are controlled by `cohort.startsAt` / `cohort.endsAt` and `cohort.status`. Exercise-level `dueBy` on the shared content is unrelated to cohort scheduling.
6. **Student visibility**: Students never see or choose cohorts. Cohorts are an instructor-only organizational concept. Students are enrolled into a specific cohort via invite links created by the instructor. The student experience is identical to today — they just see "the course."
7. **URLs**: The course landing page URL does not change. Cohort context is carried by the invite token, not by the URL.

## Current-State Audit

| Capability | Current State | Notes |
| --- | --- | --- |
| Course ↔ Group relationship | 1:1 via `course.groupId` | Single group per course |
| Student enrollment | `groupmember` rows in course's group | Tied to one group |
| Submissions | `submission.submittedBy` → `groupmember.id` | Already group-scoped |
| Question answers | `question_answer.groupMemberId` → `groupmember.id` | Already group-scoped |
| Attendance | `group_attendance.studentId` → `groupmember.id` | Already group-scoped |
| Lesson completion | `lesson_completion(lessonId, profileId)` unique | NOT group-scoped, uses `profileId` |
| Lesson comments | `lesson_comment.groupmemberId` → `groupmember.id` | Already group-scoped |
| Course newsfeed | `course_newsfeed.courseId` (no group filter) | Shared across all members, NOT group-scoped |
| Newsfeed comments | FK to `course_newsfeed` | Follows parent newsfeed |
| Course content | Lessons, exercises, sections belong to `courseId` | Shared (this is what we want) |
| Course creation | Creates group → course → groupmember → default newsfeed in transaction | `apps/api/src/services/course/course.ts` |
| Enrollment | `enrollInCourse()` adds to `course.groupId` group | `apps/api/src/services/course/invite.ts` |
| Course type enum | `COURSE_TYPE`: `SELF_PACED`, `LIVE_CLASS` | `packages/db/src/schema.ts:23` |

**Key insight**: Submissions, question answers, attendance, and lesson comments are already scoped by `groupmember.id`. If each cohort gets its own `group`, these records are naturally isolated with zero schema changes to those tables.

## Product Goals

1. Allow a course to have multiple cohorts, each with its own independent group of learners.
2. Each cohort has isolated: enrollment, submissions, grading, newsfeed, attendance, progress tracking.
3. All cohorts share the same course content (lessons, exercises, sections, questions).
4. Instructors can deactivate a cohort (students lose access) or schedule access windows.
5. Courses without cohorts enabled continue to work exactly as they do today.
6. Instructors can view per-cohort and cross-cohort aggregated analytics.
7. Students can be enrolled in multiple cohorts of the same course.

## Non-Goals (v1)

- Per-cohort exercise deadline overrides (exercise `dueBy` differences between cohorts).
- Cohort-specific content variations (all cohorts see the same content).
- Automatic cohort assignment rules (e.g., auto-assign by domain).
- Cohort templates or cohort cloning.
- Cohort-level pricing (all cohorts share the course price).
- Notifications/emails when a cohort is about to start or end.

## Data Sources Checked

- `packages/db/src/schema.ts` — all table definitions
- `apps/api/src/services/course/course.ts` — course creation flow
- `apps/api/src/services/course/invite.ts` — enrollment flow
- `apps/api/src/routes/course/course.ts` — course routes
- `apps/api/src/routes/course/` — all course sub-routers
- `packages/db/src/queries/course/` — course query layer
- `packages/db/src/queries/course/people.ts` — member management
- `packages/db/src/queries/newsfeed/newsfeed.ts` — newsfeed queries
- `packages/db/src/queries/submission/submission.ts` — submission queries
- `packages/db/src/queries/mark/mark.ts` — grading queries
- `apps/dashboard/src/routes/courses/[id]/` — course detail pages
- `apps/dashboard/src/lib/features/course/` — course frontend feature

## Functional Requirements

### 1. Enable Cohorts on a Course

- Instructors can enable cohorts on an existing course via course settings.
- When cohorts are enabled:
  - A `course_cohort` record is created for each cohort.
  - Each cohort gets its own `group` for membership isolation.
  - The existing `course.groupId` group becomes the "Default" cohort (backward compatible).
- When cohorts are disabled (reverted):
  - Only allowed if there is exactly one active cohort.
  - That cohort's group becomes the direct `course.groupId` again.

### 2. Cohort CRUD

- Instructors can create, update, and archive cohorts.
- Each cohort has: name, description, status, optional start/end dates, optional max student cap.
- Cohort names must be unique within a course.
- Creating a cohort creates a new `group` and adds the creator as TUTOR in that group.
- A default welcome newsfeed post is created for each new cohort.

### 3. Cohort Status and Access Control

- Cohort statuses: `ACTIVE`, `INACTIVE`, `SCHEDULED`.
- Access rules enforced server-side (not just UI):
  - `ACTIVE`: full access for enrolled students.
  - `INACTIVE`: students cannot access course content. Instructors/admins can still view for grading/review.
  - `SCHEDULED` with `startsAt` in the future: students see "This cohort starts on [date]" message.
  - `endsAt` in the past: treated as `INACTIVE` regardless of status field.
- Deactivating a cohort does NOT remove group members or delete data. It only blocks access.

### 4. Cohort-Scoped Enrollment

- Students are enrolled into a specific cohort, not the course directly.
- Enrollment creates a `groupmember` in the cohort's `group`.
- A student can exist in multiple cohorts of the same course (retakes).
- Invite links are scoped to a cohort (not the course). The instructor creates an invite for a specific cohort, and the generated link carries that context via the invite token.
- The existing `course_invite` table gets a nullable `cohort_id` column.
- **Students never see or select cohorts.** The cohort is resolved server-side from the invite token. From the student's perspective, they click an invite link and join "the course" — the cohort assignment is invisible to them.
- **Free course direct enrollment** (no invite token): when cohorts are enabled, the instructor designates one cohort as the "open enrollment" cohort. The course-level `POST /course/:courseId/enroll` (no token) routes to that cohort's group. This is stored as `course.defaultCohortId`. If no default cohort is set, direct free enrollment returns an error asking the student to use an invite link.

### 4a. URL and Landing Page Behavior

- **Landing page** (`/course/[slug]`): Unchanged. Shows the shared course info. There is one course, one slug, one landing page regardless of how many cohorts exist.
- **Enroll page** (`/course/[slug]/enroll?invite_token=...`): Unchanged URL structure. The invite token carries the `cohortId` — the backend resolves it and enrolls the student into the correct cohort's group.
- **Free enrollment** (`/course/[slug]/enroll` with no token): Routes to the course's default cohort when cohorts are enabled.
- **Inside the LMS** (`/courses/[id]/...`): Students see the course as they do today. The backend resolves which cohort the student belongs to and returns cohort-scoped data (newsfeed, submissions, progress). If a student is in multiple cohorts (retake), the backend uses the most recently active cohort by default, with the option for the URL to carry `?cohort=[cohortId]` — but this is not surfaced in the UI as a "cohort picker." Instead, the course shows a simple "You have a previous enrollment" note with the option to switch, without exposing cohort terminology.

### 5. Cohort-Scoped Newsfeed

- Each cohort has its own newsfeed.
- Add `cohort_id` (nullable) to `course_newsfeed`.
- When querying newsfeed, filter by `cohortId`.
- For non-cohort courses, `cohort_id` is null and behavior is unchanged.

### 6. Cohort-Scoped Lesson Completion

- Add `cohort_id` (nullable) to `lesson_completion`.
- Change unique constraint from `(lesson_id, profile_id)` to `(lesson_id, profile_id, cohort_id)`.
- A student's lesson completion in one cohort does not affect another.
- For non-cohort courses, `cohort_id` is null and behavior is unchanged.

### 7. Per-Cohort Views (Dashboard)

- **Instructor view**: When viewing a cohort-enabled course, the instructor sees a cohort selector dropdown. Per-cohort pages: newsfeed, people, submissions, marks, attendance, analytics. All data is filtered by the selected cohort.
- **Student view**: Students never see a cohort selector or cohort names. The backend automatically resolves the student's cohort from their `groupmember` record and returns cohort-scoped data. If enrolled in multiple cohorts (retake), the most recently active cohort is used by default.

### 8. Cross-Cohort Analytics

- Instructors can view aggregated analytics across all cohorts of a course.
- Metrics: total students, lesson completion rates, exercise completion rates, average grades — broken down by cohort and as totals.

### 9. Migration for Existing Courses

- When a course has cohorts enabled, a "Default" cohort is auto-created pointing to the existing `course.groupId` group.
- All existing newsfeed posts for that course get the default cohort's `cohort_id` backfilled.
- All existing `lesson_completion` rows for members of that group get the default cohort's `cohort_id` backfilled.
- This ensures zero data loss and full backward compatibility.

## Technical Design

### Data Model

#### New Table: `course_cohort`

```typescript
// packages/db/src/schema.ts

export const cohortStatus = pgEnum('COHORT_STATUS', ['ACTIVE', 'INACTIVE', 'SCHEDULED']);

export const courseCohort = pgTable(
  'course_cohort',
  {
    id: uuid().default(sql`gen_random_uuid()`).primaryKey().notNull(),
    courseId: uuid('course_id').notNull(),
    groupId: uuid('group_id').notNull(),
    name: varchar().notNull(),
    description: text(),
    status: cohortStatus().default('ACTIVE').notNull(),
    startsAt: timestamp('starts_at', { withTimezone: true, mode: 'string' }),
    endsAt: timestamp('ends_at', { withTimezone: true, mode: 'string' }),
    maxStudents: integer('max_students'),
    createdByProfileId: uuid('created_by_profile_id'),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow()
  },
  (table) => [
    foreignKey({
      columns: [table.courseId],
      foreignColumns: [course.id],
      name: 'course_cohort_course_id_fkey'
    }).onDelete('cascade'),
    foreignKey({
      columns: [table.groupId],
      foreignColumns: [group.id],
      name: 'course_cohort_group_id_fkey'
    }),
    foreignKey({
      columns: [table.createdByProfileId],
      foreignColumns: [profile.id],
      name: 'course_cohort_created_by_profile_id_fkey'
    }),
    unique('course_cohort_course_name_unique').on(table.courseId, table.name),
    index('idx_course_cohort_course_id').on(table.courseId),
    index('idx_course_cohort_group_id').on(table.groupId)
  ]
);
```

#### Modified Table: `course`

Add cohort mode flag and default cohort reference:

```typescript
// Add to course table definition
cohortsEnabled: boolean('cohorts_enabled').default(false).notNull(),
defaultCohortId: uuid('default_cohort_id')

// Add to constraints
foreignKey({
  columns: [table.defaultCohortId],
  foreignColumns: [courseCohort.id],
  name: 'course_default_cohort_id_fkey'
})
```

- `cohortsEnabled` — whether cohort mode is active for this course.
- `defaultCohortId` — the cohort used for free direct enrollment (no invite token). When cohorts are first enabled, this points to the auto-created "Default" cohort. Instructors can change it to any active cohort.

#### Modified Table: `course_newsfeed`

Add nullable cohort reference:

```typescript
// Add to course_newsfeed table definition
cohortId: uuid('cohort_id')

// Add to constraints
foreignKey({
  columns: [table.cohortId],
  foreignColumns: [courseCohort.id],
  name: 'course_newsfeed_cohort_id_fkey'
})
```

#### Modified Table: `lesson_completion`

Add nullable cohort reference and update unique constraint:

```typescript
// Add to lesson_completion table definition
cohortId: uuid('cohort_id')

// Add to constraints
foreignKey({
  columns: [table.cohortId],
  foreignColumns: [courseCohort.id],
  name: 'lesson_completion_cohort_id_fkey'
})

// Replace existing unique constraint:
// OLD: unique('unique_lesson_profile').on(table.lessonId, table.profileId)
// NEW: unique('unique_lesson_profile_cohort').on(table.lessonId, table.profileId, table.cohortId)
```

#### Modified Table: `course_invite`

Add nullable cohort reference:

```typescript
// Add to course_invite table definition
cohortId: uuid('cohort_id')

// Add to constraints
foreignKey({
  columns: [table.cohortId],
  foreignColumns: [courseCohort.id],
  name: 'course_invite_cohort_id_fkey'
})
```

#### Relationship Diagram

```
course (content: lessons, exercises, sections, questions)
  ├── cohortsEnabled: boolean
  ├── defaultCohortId → course_cohort (for free enrollment without invite token)
  │
  ├── [cohortsEnabled = false] → course.groupId → group → groupmember (legacy 1:1 behavior)
  │
  └── [cohortsEnabled = true] → course_cohort (one per batch)
       ├── name, status, startsAt, endsAt
       └── groupId → group → groupmember (enrollment per cohort)
                                ├── submission (already scoped by groupmember.id)
                                ├── question_answer (already scoped by groupmember.id)
                                ├── group_attendance (already scoped by groupmember.id)
                                └── lesson_comment (already scoped by groupmember.id)

  course_newsfeed.cohortId → scoped per cohort
  lesson_completion.cohortId → scoped per cohort

  URL structure (unchanged for students):
    /course/[slug]                              → landing page (shared, cohort-unaware)
    /course/[slug]/enroll?invite_token=abc123   → enroll (cohort resolved from token)
    /course/[slug]/enroll                       → enroll (free, routes to defaultCohortId)
    /courses/[id]/...                           → LMS (cohort resolved from groupmember)
```

### Migration

Create migration file: `packages/db/src/migrations/XXXX_add_course_cohorts.sql`

```sql
-- 1. Create cohort status enum
CREATE TYPE "COHORT_STATUS" AS ENUM ('ACTIVE', 'INACTIVE', 'SCHEDULED');

-- 2. Create course_cohort table
CREATE TABLE course_cohort (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES course(id) ON DELETE CASCADE,
  group_id UUID NOT NULL REFERENCES "group"(id),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  status "COHORT_STATUS" NOT NULL DEFAULT 'ACTIVE',
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  max_students INTEGER,
  created_by_profile_id UUID REFERENCES profile(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(course_id, name)
);

CREATE INDEX idx_course_cohort_course_id ON course_cohort(course_id);
CREATE INDEX idx_course_cohort_group_id ON course_cohort(group_id);

-- 3. Add cohorts_enabled and default_cohort_id to course
ALTER TABLE course ADD COLUMN cohorts_enabled BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE course ADD COLUMN default_cohort_id UUID REFERENCES course_cohort(id);

-- 4. Add cohort_id to course_newsfeed
ALTER TABLE course_newsfeed ADD COLUMN cohort_id UUID REFERENCES course_cohort(id);

-- 5. Add cohort_id to lesson_completion
ALTER TABLE lesson_completion ADD COLUMN cohort_id UUID REFERENCES course_cohort(id);

-- 6. Drop old unique constraint and create new one on lesson_completion
ALTER TABLE lesson_completion DROP CONSTRAINT IF EXISTS unique_lesson_profile;
ALTER TABLE lesson_completion ADD CONSTRAINT unique_lesson_profile_cohort
  UNIQUE (lesson_id, profile_id, cohort_id);

-- 7. Add cohort_id to course_invite
ALTER TABLE course_invite ADD COLUMN cohort_id UUID REFERENCES course_cohort(id);
```

### Access Control Logic

```typescript
// apps/api/src/services/course/cohort.ts

function canAccessCohort(cohort: { status: string; startsAt: string | null; endsAt: string | null }): boolean {
  if (cohort.status === 'INACTIVE') return false;

  const now = new Date();
  if (cohort.status === 'SCHEDULED' && cohort.startsAt && now < new Date(cohort.startsAt)) return false;
  if (cohort.endsAt && now > new Date(cohort.endsAt)) return false;

  return true;
}
```

This check must be enforced:
- In route middleware for any cohort-scoped endpoint.
- Before serving course content to students in a specific cohort.
- Exception: instructors/admins always have access for grading and review.

## API and Route Plan

### Validation Layer

File: `packages/utils/src/validation/course/cohort.ts`

```typescript
import { z } from 'zod';

export const ZCreateCohort = z.object({
  name: z.string().min(1).max(255),
  description: z.string().max(2000).optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'SCHEDULED']).default('ACTIVE'),
  startsAt: z.string().datetime().optional(),
  endsAt: z.string().datetime().optional(),
  maxStudents: z.number().int().positive().optional()
});

export type TCreateCohort = z.infer<typeof ZCreateCohort>;

export const ZUpdateCohort = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().max(2000).optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'SCHEDULED']).optional(),
  startsAt: z.string().datetime().nullable().optional(),
  endsAt: z.string().datetime().nullable().optional(),
  maxStudents: z.number().int().positive().nullable().optional()
});

export type TUpdateCohort = z.infer<typeof ZUpdateCohort>;

export const ZEnableCohorts = z.object({
  enabled: z.boolean()
});

export type TEnableCohorts = z.infer<typeof ZEnableCohorts>;
```

Export from: `packages/utils/src/validation/course/index.ts`

### Query Layer

File: `packages/db/src/queries/course/cohort.ts`

Functions:
- `createCohort(data)` — insert into `course_cohort` with given `groupId`.
- `getCohortById(cohortId)` — single cohort with group member count.
- `getCohortsByCourseId(courseId)` — all cohorts for a course, ordered by `createdAt`, with member counts.
- `updateCohort(cohortId, data)` — update name, description, status, dates, maxStudents.
- `getCohortByGroupId(groupId)` — look up cohort from a group ID (useful for resolving context).
- `getActiveCohortForMember(courseId, profileId)` — find which cohort(s) a student belongs to in a course.

Export from: `packages/db/src/queries/course/index.ts`

### Service Layer

File: `apps/api/src/services/course/cohort.ts`

Functions:

#### `enableCohorts(courseId, profileId)`
- Verify course exists and user is admin/tutor.
- Create "Default" cohort pointing to existing `course.groupId`.
- Set `course.cohortsEnabled = true` and `course.defaultCohortId` to the new default cohort.
- Backfill `cohort_id` on existing `course_newsfeed` rows for this course.
- Backfill `cohort_id` on existing `lesson_completion` rows for members of this course's group.
- All in a transaction.

#### `disableCohorts(courseId)`
- Verify there is exactly one active cohort.
- Set `course.cohortsEnabled = false`.
- Nullify `cohort_id` on newsfeed and lesson_completion rows.
- All in a transaction.

#### `createCohort(courseId, profileId, data: TCreateCohort)`
- Verify course has cohorts enabled.
- Create new `group` (name = cohort name, organizationId from course's org).
- Insert `course_cohort` row.
- Add creator as TUTOR `groupmember` in the new group.
- Create default welcome newsfeed post for the cohort.
- All in a transaction.
- Return the new cohort.

#### `updateCohort(cohortId, data: TUpdateCohort)`
- Validate dates (if `endsAt` provided, must be after `startsAt`).
- Update the `course_cohort` row.
- Return the updated cohort.

#### `deactivateCohort(cohortId)`
- Set `status = 'INACTIVE'`.
- Return the updated cohort.

#### `enrollInCohort(cohortId, user, context)`
- Verify cohort exists and `canAccessCohort()`.
- Check `maxStudents` cap if set.
- Add student to cohort's group via `groupmember`.
- Handle org membership creation if needed (same pattern as `enrollInCourse`).
- Idempotent: if student is already in this cohort's group, return success.

#### `getCohortAnalytics(cohortId)`
- Same logic as `getCourseAnalytics` but filtered to the cohort's group members.

#### `getCrossCohortsAnalytics(courseId)`
- Aggregate analytics across all cohorts of a course.
- Return per-cohort breakdown plus totals.

### Route Layer

File: `apps/api/src/routes/course/cohort.ts`

All routes are nested under `/course/:courseId/cohort` and require `authMiddleware`.

| Method | Path | Description | Auth |
| --- | --- | --- | --- |
| `POST` | `/course/:courseId/cohort/enable` | Enable/disable cohorts on course | Admin/Tutor |
| `GET` | `/course/:courseId/cohort` | List all cohorts for a course | Admin/Tutor |
| `POST` | `/course/:courseId/cohort` | Create a new cohort | Admin/Tutor |
| `GET` | `/course/:courseId/cohort/:cohortId` | Get cohort details | Admin/Tutor |
| `PUT` | `/course/:courseId/cohort/:cohortId` | Update cohort | Admin/Tutor |
| `POST` | `/course/:courseId/cohort/:cohortId/deactivate` | Deactivate cohort | Admin/Tutor |
| `POST` | `/course/:courseId/cohort/:cohortId/enroll` | Enroll student in cohort | Authenticated |
| `GET` | `/course/:courseId/cohort/:cohortId/analytics` | Cohort analytics | Admin/Tutor |
| `GET` | `/course/:courseId/cohort/analytics` | Cross-cohort analytics | Admin/Tutor |

#### Route Registration

```typescript
// apps/api/src/routes/course/cohort.ts
export const cohortRouter = new Hono()
  .post('/enable', authMiddleware, zValidator('json', ZEnableCohorts), async (c) => { ... })
  .get('/', authMiddleware, async (c) => { ... })
  .post('/', authMiddleware, zValidator('json', ZCreateCohort), async (c) => { ... })
  // ... etc

// apps/api/src/routes/course/index.ts
export * from './cohort';

// In the course router setup (apps/api/src/routes/course/course.ts or where sub-routers are mounted):
.route('/:courseId/cohort', cohortRouter)
```

### Modified Existing Endpoints

Several existing endpoints need cohort-awareness:

#### Newsfeed Routes (`apps/api/src/routes/course/newsfeed.ts`)
- `GET /course/:courseId/newsfeed` — accept optional `cohortId` query param. If course has cohorts enabled, `cohortId` is required and newsfeed is filtered by it.
- `POST /course/:courseId/newsfeed` — accept optional `cohortId` in body. If course has cohorts enabled, `cohortId` is required.

#### Submission Routes (`apps/api/src/routes/course/submission.ts`)
- Already scoped by `groupmember.id`, but list endpoints that join through `course.groupId` need to accept a `cohortId` param to filter to the correct group.
- `GET /course/:courseId/submission/for-grading` — add `cohortId` query param.

#### People Routes (`apps/api/src/routes/course/people.ts`)
- `GET /course/:courseId/people` — add `cohortId` query param to list members of a specific cohort's group.

#### Marks Routes (`apps/api/src/routes/course/mark.ts`)
- `GET /course/:courseId/marks` — add `cohortId` query param to filter marks by cohort group.

#### Attendance Routes (`apps/api/src/routes/course/attendance.ts`)
- Already scoped by `groupmember.id`. List endpoints need `cohortId` param.

#### Course Progress (`apps/api/src/services/course/course.ts`)
- `getCourseProgress` — pass `cohortId` to filter `lesson_completion` by cohort.

#### Enrollment (`apps/api/src/services/course/invite.ts`)
- `enrollInCourse` (no invite token, free courses) — if course has cohorts enabled:
  - Use `course.defaultCohortId` as the target cohort.
  - If `defaultCohortId` is null, return error: "This course requires an invite link to enroll."
  - Verify cohort is active via `canAccessCohort()`.
  - Enroll student into the default cohort's group, not `course.groupId`.
- `course_invite` creation — attach `cohortId` when course has cohorts enabled. Instructor selects the target cohort when creating an invite.
- `acceptStudentInvite` — read `cohort_id` from invite to determine target group. Enroll into the cohort's group instead of `course.groupId`.

### Build Verification

After implementing backend changes:

```bash
pnpm --filter @cio/utils build
pnpm --filter @cio/db build
pnpm --filter @cio/api build
```

## Frontend Plan (Dashboard)

### Request Types

File: `apps/dashboard/src/lib/features/course/utils/types.ts`

Add:

```typescript
export type ListCohortsRequest = typeof classroomio.course[':courseId']['cohort']['$get'];
export type CreateCohortRequest = typeof classroomio.course[':courseId']['cohort']['$post'];
export type UpdateCohortRequest = typeof classroomio.course[':courseId']['cohort'][':cohortId']['$put'];
export type EnableCohortsRequest = typeof classroomio.course[':courseId']['cohort']['enable']['$post'];
export type DeactivateCohortRequest = typeof classroomio.course[':courseId']['cohort'][':cohortId']['deactivate']['$post'];
export type CohortAnalyticsRequest = typeof classroomio.course[':courseId']['cohort'][':cohortId']['analytics']['$get'];

export type ListCohortsSuccess = Extract<InferResponseType<ListCohortsRequest>, { success: true }>;
export type Cohort = ListCohortsSuccess['data'][number];
```

### API Class

File: `apps/dashboard/src/lib/features/course/api/cohort.svelte.ts`

```typescript
class CohortApi extends BaseApiWithErrors {
  cohorts = $state<Cohort[]>([]);
  selectedCohortId = $state<string | null>(null);
  loading = $state(false);

  get selectedCohort() {
    return this.cohorts.find(c => c.id === this.selectedCohortId) ?? null;
  }

  async list(courseId: string) { ... }
  async create(courseId: string, data: TCreateCohort) { ... }
  async update(courseId: string, cohortId: string, data: TUpdateCohort) { ... }
  async enable(courseId: string, enabled: boolean) { ... }
  async deactivate(courseId: string, cohortId: string) { ... }
}
```

### Cohort Selector Component

File: `apps/dashboard/src/lib/features/course/components/cohort-selector.svelte`

- Dropdown in the course header/sidebar.
- Shows cohort name and status badge (active/inactive/scheduled).
- Instructors can switch between cohorts.
- Includes "Manage Cohorts" link to cohort management page.

### Cohort Management Page

Route: `apps/dashboard/src/routes/courses/[id]/cohorts/+page.svelte`
Feature page: `apps/dashboard/src/lib/features/course/pages/cohorts.svelte`

Features:
- List all cohorts with name, status, student count, dates.
- Create new cohort (name, description, status, dates, max students).
- Edit cohort settings.
- Deactivate/reactivate cohort.
- Status badges: Active (green), Inactive (gray), Scheduled (blue).

### Enable Cohorts Toggle

In course settings page (`apps/dashboard/src/routes/courses/[id]/settings/`):
- Add "Enable Cohorts" toggle.
- When toggled on: creates default cohort, shows success message.
- When toggled off: only works if single cohort, shows confirmation dialog.

### Student Multi-Enrollment Handling

Students are never exposed to cohort terminology. For the rare case where a student is enrolled in multiple cohorts of the same course (retake):
- The backend defaults to the most recently active cohort.
- The course page shows a subtle note: "You have a previous enrollment. [Switch]" — without using the word "cohort."
- Switching passes `?cohort=[cohortId]` as a query param internally, but the UI labels it generically (e.g., "January 2026 Training" vs "June 2026 Training" — using the cohort name set by the instructor).
- If enrolled in only one cohort (the common case), no extra UI is shown.

### Modified Existing Pages

These existing pages need to pass `cohortId` when the course has cohorts enabled:

| Page | File | Change |
| --- | --- | --- |
| Newsfeed | `apps/dashboard/src/lib/features/course/pages/newsfeed.svelte` | Pass `cohortId` to newsfeed API calls |
| People | Course people page | Pass `cohortId` to filter group members |
| Submissions | `apps/dashboard/src/lib/features/course/pages/submissions.svelte` | Pass `cohortId` to list submissions |
| Marks | `apps/dashboard/src/lib/features/course/pages/marks.svelte` | Pass `cohortId` to filter marks |
| Attendance | `apps/dashboard/src/lib/features/course/pages/attendance.svelte` | Pass `cohortId` to filter attendance |
| Analytics | `apps/dashboard/src/lib/features/course/pages/analytics.svelte` | Pass `cohortId` or show cross-cohort toggle |
| Course Progress | Student progress tracking | Pass `cohortId` to filter `lesson_completion` |

### Navigation Update

File: `apps/dashboard/src/lib/features/course/` (course sidebar/nav)

- Add "Cohorts" nav item (visible only when cohorts enabled, for instructors).
- Cohort selector visible in sidebar header when cohorts enabled.

### Translations

File: `apps/dashboard/src/lib/utils/translations/en.json`

Add keys under `course.cohorts`:

```json
{
  "course": {
    "cohorts": {
      "title": "Cohorts",
      "create": "Create Cohort",
      "enable": "Enable Cohorts",
      "disable": "Disable Cohorts",
      "name": "Cohort Name",
      "description": "Description",
      "status": "Status",
      "active": "Active",
      "inactive": "Inactive",
      "scheduled": "Scheduled",
      "starts_at": "Starts At",
      "ends_at": "Ends At",
      "max_students": "Max Students",
      "student_count": "Students",
      "deactivate": "Deactivate Cohort",
      "reactivate": "Reactivate Cohort",
      "selector_label": "Select Cohort",
      "manage": "Manage Cohorts",
      "default_name": "Default",
      "default_welcome": "Welcome to this cohort!",
      "enable_confirm": "This will organize your current students into a default cohort. You can then create additional cohorts.",
      "disable_confirm": "You can only disable cohorts if there is exactly one active cohort.",
      "deactivate_confirm": "Students in this cohort will lose access to the course. Their data will be preserved.",
      "access_blocked": "This cohort is not currently active.",
      "scheduled_message": "This cohort starts on {date}.",
      "ended_message": "This cohort has ended.",
      "no_cohorts": "No cohorts yet. Create one to get started.",
      "cross_cohort_analytics": "All Cohorts",
      "previous_enrollment": "You have a previous enrollment.",
      "switch_enrollment": "Switch",
      "requires_invite": "This course requires an invite link to enroll."
    }
  }
}
```

### Frontend Build Verification

```bash
pnpm --filter @cio/dashboard build
```

## Implementation Order

### Phase 1: Database + Schema (do first)

1. Add `cohortStatus` enum to schema.
2. Add `courseCohort` table to schema.
3. Add `cohortsEnabled` and `defaultCohortId` columns to `course` table.
4. Add `cohortId` column to `course_newsfeed`.
5. Add `cohortId` column to `lesson_completion` and update unique constraint.
6. Add `cohortId` column to `course_invite`.
7. Generate and apply migration.
8. Run `pnpm --filter @cio/db build`.

### Phase 2: Validation + Queries (do second)

1. Create `packages/utils/src/validation/course/cohort.ts` with all Zod schemas.
2. Export from `packages/utils/src/validation/course/index.ts`.
3. Create `packages/db/src/queries/course/cohort.ts` with all query functions.
4. Export from `packages/db/src/queries/course/index.ts`.
5. Run `pnpm --filter @cio/utils build` and `pnpm --filter @cio/db build`.

### Phase 3: Service + Routes (do third)

1. Create `apps/api/src/services/course/cohort.ts` with all service functions.
2. Create `apps/api/src/routes/course/cohort.ts` with all route handlers.
3. Register cohort router in course route index.
4. Add new error codes to `apps/api/src/utils/errors.ts` if needed (e.g., `COHORT_NOT_FOUND`, `COHORTS_NOT_ENABLED`, `COHORT_ACCESS_DENIED`, `COHORT_FULL`).
5. Update existing newsfeed, submission, people, marks, attendance routes to accept `cohortId` param.
6. Update `enrollInCourse` to handle cohort-aware enrollment.
7. Run `pnpm --filter @cio/api build`.

### Phase 4: Frontend — Cohort Management (do fourth)

1. Add request types to `apps/dashboard/src/lib/features/course/utils/types.ts`.
2. Create `apps/dashboard/src/lib/features/course/api/cohort.svelte.ts` API class.
3. Add translation keys to `en.json`.
4. Create cohort management page: `apps/dashboard/src/routes/courses/[id]/cohorts/+page.svelte` and feature page.
5. Add "Enable Cohorts" toggle to course settings.
6. Add cohort selector component.
7. Add "Cohorts" to course navigation.
8. Run `pnpm --filter @cio/dashboard build`.

### Phase 5: Frontend — Cohort-Scoped Views (do fifth)

1. Update newsfeed page to pass `cohortId`.
2. Update people page to pass `cohortId`.
3. Update submissions page to pass `cohortId`.
4. Update marks page to pass `cohortId`.
5. Update attendance page to pass `cohortId`.
6. Update analytics page with per-cohort / cross-cohort toggle.
7. Update course progress to pass `cohortId`.
8. Add backend cohort resolution for student views (auto-resolve from `groupmember`, default to most recent active cohort).
9. Add subtle "previous enrollment" switcher for multi-cohort students (no cohort terminology exposed).
10. Run `pnpm --filter @cio/dashboard build`.

## Acceptance Criteria

1. Instructor can enable cohorts on an existing course and a "Default" cohort is auto-created with all existing members.
2. Instructor can create a new cohort with name, description, status, dates.
3. Students enrolled in Cohort A cannot see submissions, newsfeed, or attendance of Cohort B.
4. Deactivating a cohort blocks student access but preserves all data.
5. A student can be enrolled in multiple cohorts of the same course.
6. Courses without cohorts enabled work exactly as they do today (zero regression).
7. Lesson completion is tracked independently per cohort.
8. Newsfeed posts are scoped to the cohort they were created in.
9. Instructor can view aggregated analytics across all cohorts.
10. Invite links are scoped to a specific cohort when cohorts are enabled.
11. Cohort status `SCHEDULED` with future `startsAt` blocks student access until the start date.
12. Students never see the word "cohort" or any cohort selection UI. Cohort assignment is fully transparent to students.
13. Course landing page URL (`/course/[slug]`) is unchanged regardless of cohort state.
14. Free course enrollment routes to the course's default cohort when cohorts are enabled.
15. All new UI strings use translation keys (no hardcoded English).
16. `pnpm --filter @cio/api build` and `pnpm --filter @cio/dashboard build` pass after implementation.

## Risks and Mitigations

- **Risk**: Existing queries that join through `course.groupId` break when cohorts are enabled (course has multiple groups now).
  - **Mitigation**: When cohorts are enabled, all member-facing queries must go through `course_cohort.groupId`, not `course.groupId`. The `course.groupId` field remains but only points to the default/first cohort's group. Queries should check `cohortsEnabled` and branch accordingly.

- **Risk**: Lesson completion unique constraint migration fails on existing duplicate data.
  - **Mitigation**: The new constraint includes `cohort_id` which is null for all existing rows. Since `(lesson_id, profile_id, NULL)` is still unique under the old data, the migration is safe. PostgreSQL treats each NULL as distinct in unique constraints, so we need a partial unique index instead: `UNIQUE (lesson_id, profile_id) WHERE cohort_id IS NULL` plus `UNIQUE (lesson_id, profile_id, cohort_id) WHERE cohort_id IS NOT NULL`.

- **Risk**: Performance degradation with many cohorts per course.
  - **Mitigation**: Index `course_cohort.course_id`. Member counts are computed via joins, not stored. For cross-cohort analytics, batch queries per cohort and aggregate in service layer.

- **Risk**: Student enrolled in multiple cohorts (retake) doesn't know which enrollment they're viewing.
  - **Mitigation**: Backend defaults to most recently active cohort. For the rare multi-enrollment case, a subtle "You have a previous enrollment" note is shown without cohort terminology. Students never see a cohort picker or cohort names directly.

## Updated Unique Constraint Strategy for `lesson_completion`

Due to PostgreSQL treating NULL as distinct in unique constraints, use two constraints:

```sql
-- For non-cohort courses (cohort_id IS NULL)
CREATE UNIQUE INDEX unique_lesson_profile_no_cohort
  ON lesson_completion (lesson_id, profile_id)
  WHERE cohort_id IS NULL;

-- For cohort courses (cohort_id IS NOT NULL)
CREATE UNIQUE INDEX unique_lesson_profile_cohort
  ON lesson_completion (lesson_id, profile_id, cohort_id)
  WHERE cohort_id IS NOT NULL;
```

This replaces the simple `UNIQUE(lesson_id, profile_id, cohort_id)` approach and ensures correct behavior for both cohort and non-cohort courses.
