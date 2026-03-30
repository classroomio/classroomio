# Programs PRD

## Purpose

Enable instructors and org admins to group multiple courses — along with shared announcements, files, and community discussions — into a single **program**. Enrolling a student in a program auto-enrolls them in every course inside it, eliminating the need to manage per-course enrollment manually when delivering a structured program.

## Problem Statement

Currently, ClassroomIO has no entity above the individual course. Every course has its own independent enrollment roster. This creates several pain points:

- An instructor running a program (e.g., a bootcamp, onboarding track, or certification pathway) must enroll students in each constituent course one by one.
- There is no shared space for program-wide announcements, files, or discussions that span multiple courses.
- Students cannot see a unified "program" view in the LMS — they only see a flat list of individual courses.
- Org admins have no way to bundle courses for a specific cohort of learners (e.g., "Q1 2026 New Hire Onboarding") without creating separate organizations or duplicating content.

## Confirmed Decisions

1. **Terminology**: "Program" in both the instructor-facing admin UI and the student-facing LMS.
2. **Auto-enrollment**: Joining a program automatically creates `groupmember` records for every course inside the program. Removing a student from a program does not remove them from individual course groups, preserving their submission and progress data.
3. **Shared materials**: Each program has three shared material surfaces: announcements (instructor-authored posts), a file library, and a community Q&A board.
4. **Many-to-many courses**: A course can belong to multiple programs. Courses and programs are independent entities linked by a join table.
5. **LMS visibility**: Programs are visible to students in the LMS under a dedicated "Programs" section. Students see enrolled programs and can navigate courses from within a program hub page.
6. **Roles**: Program roles mirror the existing system (`ADMIN`/roleId 1, `TUTOR`/roleId 2, `STUDENT`/roleId 3). Program admins and tutors can manage the program; program students get read access to materials.
7. **Program status**: Programs can be `ACTIVE`, `INACTIVE`, or `ARCHIVED`. `INACTIVE` programs are hidden from students in the LMS but preserved for instructors. `ARCHIVED` programs are soft-deleted and hidden everywhere.
8. **Course independence**: Courses in a program remain fully independent. A student enrolled in a program is a regular `groupmember` in each course — existing course pages, progress tracking, submissions, and grading are unchanged.
9. **Community reuse**: The existing `community_question` table gains a nullable `programId` FK. Program-level Q&A behaves identically to course-level community Q&A but scoped to the program.

## Current-State Audit

| Capability | Current State | Notes |
| --- | --- | --- |
| Organization structure | `organization` → `group` (1:1 with `course`) → `course` | No intermediate grouping layer above course |
| Course enrollment | `groupmember` rows per course's `group` | Per-course, no bulk enrollment mechanism |
| Student LMS view | Flat list of enrolled courses under `/lms/mylearning` | No program/program concept |
| Community Q&A | `community_question.courseId` scoped | Reusable with additional `programId` FK |
| Shared file library | Per-course via `assets` table; no org-wide shared files | New `program_file` table needed |
| Announcements | Per-course `course_newsfeed` | New `program_announcement` table needed |
| Org admin navigation | "Courses" section listing all courses | "Programs" nav item needed |
| LMS navigation | Home, My Learning, Exercises, Community, Explore, Settings | "Programs" nav item needed |
| Enrollment service | `enrollInCourse()` in `apps/api/src/services/course/invite.ts` | Must be called per-course when adding program member |

**Key insight**: Because enrollment = `groupmember` rows per course, adding a student to a program is purely a matter of calling the existing enrollment logic for each course in the program within a single transaction. No course-level schema changes are needed.

## Product Goals

1. Org admins and instructors can create a program, add courses to it, and manage program membership from the admin dashboard.
2. Adding a student to a program auto-enrolls them in all courses currently in the program.
3. Adding a new course to an existing program auto-enrolls all current program students in that course.
4. Each program has a shared announcements feed, file library, and community board visible to all program members.
5. Students can see their enrolled programs in the LMS with a unified hub view showing all courses, announcements, and files.
6. Programs without students, and courses outside any program, continue to work exactly as they do today (zero regression).

## Non-Goals (v1)

- Program-level invite links (v1 enrollment is admin-managed; students cannot self-enroll in a program via a token).
- Program-specific exercise deadlines or content overrides (courses are shared as-is).
- Program progress analytics aggregated across all courses (available per-course; cross-course aggregation is a future improvement).
- Removing a student from a program also unenrolling them from individual courses (data preservation is the default).
- Program templates or program cloning.
- Public/discoverable program landing pages (programs are private to org members).
- Billing or pricing at the program level.
- Program-level attendance tracking separate from per-course attendance.

## Data Sources Checked

- `packages/db/src/schema.ts` — all table definitions and constraint patterns
- `apps/api/src/services/course/course.ts` — course creation flow
- `apps/api/src/services/course/invite.ts` — enrollment flow (`enrollInCourse`)
- `apps/api/src/routes/course/course.ts` — course router and sub-router mounting
- `apps/api/src/app.ts` — top-level router registration
- `packages/db/src/queries/course/people.ts` — group member management
- `packages/db/src/queries/group/group.ts` — group/member queries
- `packages/db/src/queries/community/community.ts` — community Q&A pattern
- `apps/dashboard/src/lib/features/lms/` — LMS navigation and pages
- `apps/dashboard/src/lib/features/org/` — org admin navigation
- `apps/dashboard/src/routes/lms/` — LMS SvelteKit routes
- `apps/dashboard/src/routes/courses/` — course admin SvelteKit routes

## Functional Requirements

### 1. Program CRUD (Admin)

- Org admins can create a program with: name (required), description (optional), cover image (optional).
- Programs can be updated (name, description, cover image, status).
- Archiving a program sets `status = 'ARCHIVED'` and hides it from all views. Archived programs can be restored.
- A program belongs to exactly one organization.
- Program names do not need to be unique within an org (unlike course slugs), but should be descriptive.

### 2. Course Management in a Program (Admin)

- Org admins and program tutors can add existing org courses to a program.
- A course can belong to multiple programs simultaneously.
- Adding a course to a program triggers auto-enrollment: all existing `STUDENT` program members are enrolled in the new course (a `groupmember` row is created in the course's `group` for each student not already enrolled).
- Removing a course from a program does not unenroll any students from that course. Their progress and submissions are preserved.
- Courses within a program are ordered (integer `order` field) so instructors can sequence them.

### 3. Program Membership (Admin)

- Org admins can add members to a program by profile ID or email, assigning them a role (ADMIN, TUTOR, or STUDENT).
- Adding a STUDENT member triggers auto-enrollment: a `groupmember` row is created in every course currently in the program (skipping courses the student is already enrolled in; idempotent).
- Adding an ADMIN or TUTOR member does not auto-enroll them in courses (their course-level permissions are managed separately via course membership).
- Removing a member from a program removes the `program_member` row only. Individual `groupmember` rows in courses are left intact, preserving submissions, grades, and progress.
- Batch add: admins can add multiple members at once (array of `{ email, roleId }` pairs).

### 4. Program Announcements (Admin + LMS)

- Program admins and tutors can post announcements to the program feed.
- Announcements have a title and a rich-text body.
- Announcements are visible to all program members (students, tutors, and admins) in both the admin program view and the LMS program hub.
- Students cannot post announcements (read-only for students).
- Announcements are ordered by `createdAt` descending (newest first).

### 5. Program File Library (Admin + LMS)

- Program admins and tutors can upload files to the program file library.
- Each file record stores: name, URL (stored via the existing presigned upload flow), MIME type, size, uploader profile ID.
- All program members can view and download files.
- Only program admins and tutors can delete files.

### 6. Program Community (Admin + LMS)

- Program-level community Q&A reuses the existing `community_question` / `community_answer` infrastructure.
- A nullable `programId` FK is added to `community_question`. Questions with `programId` set are program-scoped (not visible on the course-level community board).
- All program members can post questions and answers in the program community.
- The existing voting, commenting, and answer-acceptance behavior is unchanged.

### 7. LMS — My Programs (Student)

- A "Programs" nav item appears in the LMS sidebar when the student is enrolled in at least one program.
- The `/lms/programs` page lists all programs the student is enrolled in.
- Each program card shows: program name, cover image, number of courses, brief description.
- Clicking a program opens the program hub page.

### 8. LMS — Program Hub (Student)

- The program hub at `/lms/programs/[programId]` is the student's central page for a program.
- It is divided into three tabs or sections:
  - **Courses**: All courses in the program, each with the student's individual progress bar and a direct link to the course. Courses are shown in the instructor-defined order.
  - **Announcements**: Program announcements in reverse-chronological order (read-only for students).
  - **Resources**: The program file library (download only) and a link to the program community board.
- The program community board lives at `/lms/programs/[programId]/community` and behaves identically to the existing course community pages.

### 9. Admin — Programs Section

- "Programs" is added as a top-level nav item in the org admin sidebar, alongside "Courses".
- The `/courses/programs` page lists all org programs with name, course count, student count, and status badge.
- A "Create Program" button opens a creation form.
- Each program links to a program detail view with sub-pages: Overview, Courses, People, Announcements, Files.

### 10. Access Control

- Only `ADMIN` and `TUTOR` role members of a program (or org admins) can manage program content and membership.
- Students can read announcements and files, participate in the community, and view the course list.
- A student who is removed from the org loses access to all program content.
- An `INACTIVE` program is hidden from students in the LMS but all data is preserved.

---

## Technical Design

### Data Model

#### New Enum: `PROGRAM_STATUS`

```typescript
// packages/db/src/schema.ts
export const programStatus = pgEnum('PROGRAM_STATUS', ['ACTIVE', 'INACTIVE', 'ARCHIVED']);
```

#### New Table: `program`

```typescript
// packages/db/src/schema.ts
export const lmsProgram = pgTable(
  'program',
  {
    id: uuid()
      .default(sql`gen_random_uuid()`)
      .primaryKey()
      .notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow(),
    organizationId: uuid('organization_id').notNull(),
    name: varchar().notNull(),
    description: text(),
    coverImage: text('cover_image'),
    status: programStatus().default('ACTIVE').notNull(),
    createdByProfileId: uuid('created_by_profile_id')
  },
  (table) => [
    foreignKey({
      columns: [table.organizationId],
      foreignColumns: [organization.id],
      name: 'class_organization_id_fkey'
    }).onDelete('cascade'),
    foreignKey({
      columns: [table.createdByProfileId],
      foreignColumns: [profile.id],
      name: 'class_created_by_profile_id_fkey'
    }),
    index('idx_program_organization_id').on(table.organizationId)
  ]
);
```

#### New Table: `program_course`

Many-to-many join between program and course, with an instructor-controlled display order.

```typescript
// packages/db/src/schema.ts
export const programCourse = pgTable(
  'program_course',
  {
    id: uuid()
      .default(sql`gen_random_uuid()`)
      .primaryKey()
      .notNull(),
    programId: uuid('program_id').notNull(),
    courseId: uuid('course_id').notNull(),
    order: integer().default(0).notNull(),
    addedAt: timestamp('added_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull()
  },
  (table) => [
    foreignKey({
      columns: [table.programId],
      foreignColumns: [lmsProgram.id],
      name: 'program_course_class_id_fkey'
    }).onDelete('cascade'),
    foreignKey({
      columns: [table.courseId],
      foreignColumns: [course.id],
      name: 'program_course_course_id_fkey'
    }).onDelete('cascade'),
    unique('program_course_class_id_course_id_unique').on(table.programId, table.courseId),
    index('idx_program_course_class_id').on(table.programId)
  ]
);
```

#### New Table: `program_member`

Membership roster for a program. Does not replace `groupmember` — it is a separate layer.

```typescript
// packages/db/src/schema.ts
export const programMember = pgTable(
  'program_member',
  {
    id: uuid()
      .default(sql`gen_random_uuid()`)
      .primaryKey()
      .notNull(),
    programId: uuid('program_id').notNull(),
    profileId: uuid('profile_id'),
    roleId: integer('role_id').notNull(),
    email: text(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull()
  },
  (table) => [
    foreignKey({
      columns: [table.programId],
      foreignColumns: [lmsProgram.id],
      name: 'program_member_class_id_fkey'
    }).onDelete('cascade'),
    foreignKey({
      columns: [table.profileId],
      foreignColumns: [profile.id],
      name: 'program_member_profile_id_fkey'
    }),
    foreignKey({
      columns: [table.roleId],
      foreignColumns: [role.id],
      name: 'program_member_role_id_fkey'
    }),
    unique('program_member_class_id_profile_id_unique').on(table.programId, table.profileId),
    index('idx_program_member_class_id').on(table.programId),
    index('idx_program_member_profile_id').on(table.profileId)
  ]
);
```

#### New Table: `program_announcement`

```typescript
// packages/db/src/schema.ts
export const programAnnouncement = pgTable(
  'program_announcement',
  {
    id: uuid()
      .default(sql`gen_random_uuid()`)
      .primaryKey()
      .notNull(),
    programId: uuid('program_id').notNull(),
    authorProfileId: uuid('author_profile_id'),
    title: varchar().notNull(),
    body: text(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow()
  },
  (table) => [
    foreignKey({
      columns: [table.programId],
      foreignColumns: [lmsProgram.id],
      name: 'program_announcement_class_id_fkey'
    }).onDelete('cascade'),
    foreignKey({
      columns: [table.authorProfileId],
      foreignColumns: [profile.id],
      name: 'program_announcement_author_profile_id_fkey'
    }),
    index('idx_program_announcement_class_id').on(table.programId)
  ]
);
```

#### New Table: `program_file`

```typescript
// packages/db/src/schema.ts
export const programFile = pgTable(
  'program_file',
  {
    id: uuid()
      .default(sql`gen_random_uuid()`)
      .primaryKey()
      .notNull(),
    programId: uuid('program_id').notNull(),
    uploadedByProfileId: uuid('uploaded_by_profile_id'),
    name: varchar().notNull(),
    url: text().notNull(),
    mimeType: varchar('mime_type'),
    size: integer(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull()
  },
  (table) => [
    foreignKey({
      columns: [table.programId],
      foreignColumns: [lmsProgram.id],
      name: 'program_file_class_id_fkey'
    }).onDelete('cascade'),
    foreignKey({
      columns: [table.uploadedByProfileId],
      foreignColumns: [profile.id],
      name: 'program_file_uploaded_by_profile_id_fkey'
    }),
    index('idx_program_file_class_id').on(table.programId)
  ]
);
```

#### Modified Table: `community_question`

Add a nullable `programId` FK so community questions can be scoped to a program:

```typescript
// Add to community_question table columns:
programId: uuid('program_id')

// Add to community_question table constraints:
foreignKey({
  columns: [table.programId],
  foreignColumns: [lmsProgram.id],
  name: 'community_question_class_id_fkey'
}).onDelete('cascade')
```

When `programId` is set, the question is program-scoped. When `courseId` is set, it is course-scoped. The two are mutually exclusive in practice (enforced at the service layer).

#### Relationship Diagram

```
organization
  └── program
        ├── program_course  ──────────────────────→  course
        │     (order, addedAt)                        └── group → groupmember ← (auto-created)
        ├── program_member  ──────────────────────→  profile
        │     (roleId: ADMIN/TUTOR/STUDENT)
        ├── program_announcement
        │     (title, body, authorProfileId)
        ├── program_file
        │     (name, url, mimeType, size)
        └── community_question (programId set)
              └── community_answer
```

### Migration

File: `packages/db/src/migrations/XXXX_add_programs.sql`

```sql
-- 1. Create PROGRAM_STATUS enum
CREATE TYPE "PROGRAM_STATUS" AS ENUM ('ACTIVE', 'INACTIVE', 'ARCHIVED');

-- 2. Create program table
CREATE TABLE program (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  organization_id UUID NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
  name VARCHAR NOT NULL,
  description TEXT,
  cover_image TEXT,
  status "PROGRAM_STATUS" NOT NULL DEFAULT 'ACTIVE',
  created_by_profile_id UUID REFERENCES profile(id)
);

CREATE INDEX idx_program_organization_id ON program(organization_id);

-- 3. Create program_course join table
CREATE TABLE program_course (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id UUID NOT NULL REFERENCES program(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES course(id) ON DELETE CASCADE,
  "order" INTEGER NOT NULL DEFAULT 0,
  added_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(program_id, course_id)
);

CREATE INDEX idx_program_course_class_id ON program_course(program_id);

-- 4. Create program_member table
CREATE TABLE program_member (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id UUID NOT NULL REFERENCES program(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES profile(id),
  role_id INTEGER NOT NULL REFERENCES role(id),
  email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(program_id, profile_id)
);

CREATE INDEX idx_program_member_class_id ON program_member(program_id);
CREATE INDEX idx_program_member_profile_id ON program_member(profile_id);

-- 5. Create program_announcement table
CREATE TABLE program_announcement (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id UUID NOT NULL REFERENCES program(id) ON DELETE CASCADE,
  author_profile_id UUID REFERENCES profile(id),
  title VARCHAR NOT NULL,
  body TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_program_announcement_class_id ON program_announcement(program_id);

-- 6. Create program_file table
CREATE TABLE program_file (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id UUID NOT NULL REFERENCES program(id) ON DELETE CASCADE,
  uploaded_by_profile_id UUID REFERENCES profile(id),
  name VARCHAR NOT NULL,
  url TEXT NOT NULL,
  mime_type VARCHAR,
  size INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_program_file_class_id ON program_file(program_id);

-- 7. Add programId to community_question
ALTER TABLE community_question ADD COLUMN program_id UUID REFERENCES program(id) ON DELETE CASCADE;
```

---

## Access Control Logic

Two middleware functions are needed in `apps/api/src/middleware/`:

### `programAccessMiddleware` (read access)

Verifies the caller is either an org admin or a `program_member` for the given `:programId`. Used on all `GET /program/:programId/*` routes.

```typescript
// apps/api/src/middleware/program-access.ts
export async function programAccessMiddleware(c, next) {
  const { programId } = c.req.param();
  const user = c.get('user')!;
  const isMember = await isProgramMember(programId, user.profileId);
  const isOrgAdmin = await isOrgAdminByProgramId(programId, user.profileId);
  if (!isMember && !isOrgAdmin) throw new AppError('Forbidden', ErrorCodes.FORBIDDEN, 403);
  await next();
}
```

### `programAdminMiddleware` (write access)

Verifies the caller has `roleId` 1 (ADMIN) or 2 (TUTOR) within the program, or is an org admin. Used on all mutating routes.

```typescript
// apps/api/src/middleware/program-admin.ts
export async function programAdminMiddleware(c, next) {
  const { programId } = c.req.param();
  const user = c.get('user')!;
  const role = await getProgramMemberRole(programId, user.profileId);
  const isOrgAdmin = await isOrgAdminByProgramId(programId, user.profileId);
  if (!isOrgAdmin && (!role || role > 2)) throw new AppError('Forbidden', ErrorCodes.FORBIDDEN, 403);
  await next();
}
```

---

## API and Route Plan

### Validation Layer

File: `packages/utils/src/validation/program/program.ts`

```typescript
import { z } from 'zod';

export const ZCreateProgram = z.object({
  name: z.string().min(1).max(255),
  description: z.string().max(2000).optional(),
  coverImage: z.string().url().optional()
});
export type TCreateProgram = z.infer<typeof ZCreateProgram>;

export const ZUpdateProgram = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().max(2000).nullable().optional(),
  coverImage: z.string().url().nullable().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'ARCHIVED']).optional()
});
export type TUpdateProgram = z.infer<typeof ZUpdateProgram>;

export const ZAddCourseToProgram = z.object({
  courseId: z.string().uuid(),
  order: z.number().int().min(0).optional()
});
export type TAddCourseToProgram = z.infer<typeof ZAddCourseToProgram>;

export const ZAddProgramMembers = z.object({
  members: z.array(
    z.object({
      email: z.string().email(),
      roleId: z.number().int().min(1).max(3)
    })
  ).min(1)
});
export type TAddProgramMembers = z.infer<typeof ZAddProgramMembers>;

export const ZUpdateProgramMember = z.object({
  roleId: z.number().int().min(1).max(3)
});
export type TUpdateProgramMember = z.infer<typeof ZUpdateProgramMember>;

export const ZCreateProgramAnnouncement = z.object({
  title: z.string().min(1).max(500),
  body: z.string().max(10000).optional()
});
export type TCreateProgramAnnouncement = z.infer<typeof ZCreateProgramAnnouncement>;

export const ZUpdateProgramAnnouncement = z.object({
  title: z.string().min(1).max(500).optional(),
  body: z.string().max(10000).nullable().optional()
});
export type TUpdateProgramAnnouncement = z.infer<typeof ZUpdateProgramAnnouncement>;

export const ZAddProgramFile = z.object({
  name: z.string().min(1).max(255),
  url: z.string().url(),
  mimeType: z.string().optional(),
  size: z.number().int().positive().optional()
});
export type TAddProgramFile = z.infer<typeof ZAddProgramFile>;
```

Export from: `packages/utils/src/validation/program/index.ts` and re-export from `packages/utils/src/validation/index.ts`.

### Query Layer

File: `packages/db/src/queries/program/program.ts`

| Function | Description |
| --- | --- |
| `createProgram(data)` | Insert into `program`, return created row |
| `getProgramById(programId)` | Single program with member count and course count |
| `getProgramsByOrg(orgId)` | All non-archived programs for org, ordered by `createdAt` desc |
| `updateProgram(programId, data)` | Update name, description, coverImage, status |
| `getProgramMemberRole(programId, profileId)` | Return `roleId` for the given profile in the program, or null |
| `isProgramMember(programId, profileId)` | Boolean check |
| `isOrgAdminByProgramId(programId, profileId)` | Joins `program → organization → organizationmember` to check admin role |
| `addProgramMember(programId, profileId, roleId, email)` | Insert `program_member` row (upsert on conflict) |
| `removeProgramMember(programId, memberId)` | Delete `program_member` by `id` |
| `getProgramMembers(programId)` | All members joined to `profile` for display |
| `getEnrolledProgramsByProfile(orgId, profileId)` | All `ACTIVE` programs where profile is a program member, for LMS |
| `addCourseToProgram(programId, courseId, order)` | Insert `program_course` row |
| `removeCourseFromProgram(programId, courseId)` | Delete `program_course` row |
| `getCoursesByProgram(programId)` | All courses in program ordered by `order`, joined to `course` |
| `getStudentMemberIdsByProgram(programId)` | All `profileId` values with `roleId = 3` in program (for auto-enrollment) |
| `createProgramAnnouncement(data)` | Insert `program_announcement` |
| `getProgramAnnouncements(programId)` | All announcements ordered by `createdAt` desc, joined to `profile` |
| `updateProgramAnnouncement(announcementId, data)` | Update title/body |
| `deleteProgramAnnouncement(announcementId)` | Delete row |
| `addProgramFile(data)` | Insert `program_file` |
| `getProgramFiles(programId)` | All files ordered by `createdAt` desc |
| `deleteProgramFile(fileId)` | Delete `program_file` by `id` |

Export from: `packages/db/src/queries/program/index.ts`

### Service Layer

File: `apps/api/src/services/program/program.ts`

#### `createProgram(orgId, profileId, data: TCreateProgram)`

- Insert `program` row.
- Add creator as `program_member` with `roleId = 1` (ADMIN).
- Return the new program.

#### `addCourseToProgram(programId, courseId)`

- Verify program exists and course belongs to the same org.
- Insert `program_course` row (error if already linked).
- Fetch all current STUDENT program members (`getStudentMemberIdsByProgram`).
- For each student profile, look up their `groupmember` status in the course's group; if not already enrolled, call `enrollInCourse` (or insert `groupmember` directly if the course is free and no invite is needed).
- All writes in a single transaction.
- Return updated course list for the program.

#### `removeCourseFromProgram(programId, courseId)`

- Delete `program_course` row.
- No changes to `groupmember` records.
- Return updated course list.

#### `addMembersToProgram(programId, members: TAddProgramMembers['members'])`

Transaction:
1. For each member in the batch, resolve `profileId` from `email` (look up `profile` by email, create if none exists as an invited-but-unregistered user following the same pattern as `addGroupMember`).
2. Insert `program_member` row (skip if already a member of the program).
3. If `roleId = 3` (STUDENT), fetch all courses in the program (`getCoursesByProgram`). For each course, check if the student is already a `groupmember`; if not, insert a `groupmember` row with `roleId = 3`.

#### `removeMemberFromProgram(programId, memberId)`

- Delete `program_member` row by `id`.
- Leave all `groupmember` rows in individual courses intact.

#### `createAnnouncement(programId, profileId, data: TCreateProgramAnnouncement)`

- Verify caller is program admin or tutor.
- Insert `program_announcement` row.
- Return new announcement.

#### `addFile(programId, profileId, data: TAddProgramFile)`

- Insert `program_file` row.
- Return new file record.

#### `deleteFile(fileId, profileId)`

- Verify caller is program admin or tutor.
- Delete `program_file` row.

### Route Layer

File: `apps/api/src/routes/program/program.ts`

All routes require `authMiddleware`. Routes scoped to a `:programId` also apply `programAccessMiddleware` (read) or `programAdminMiddleware` (write) as noted.

| Method | Path | Middleware | Description |
| --- | --- | --- | --- |
| `GET` | `/program` | `authMiddleware` | List org's programs (org admin sees all; tutors/students see their own) |
| `POST` | `/program` | `authMiddleware` + orgAdmin | Create program |
| `GET` | `/program/:programId` | `programAccessMiddleware` | Get program with member/course counts |
| `PUT` | `/program/:programId` | `programAdminMiddleware` | Update program name, description, cover, status |
| `DELETE` | `/program/:programId` | orgAdmin | Archive program (`status = 'ARCHIVED'`) |
| `GET` | `/program/:programId/courses` | `programAccessMiddleware` | List courses in program (ordered) |
| `POST` | `/program/:programId/courses` | `programAdminMiddleware` | Add course to program + auto-enroll students |
| `DELETE` | `/program/:programId/courses/:courseId` | `programAdminMiddleware` | Remove course from program |
| `GET` | `/program/:programId/members` | `programAdminMiddleware` | List program members with profile info |
| `POST` | `/program/:programId/members` | `programAdminMiddleware` | Batch-add members + auto-enroll students |
| `PUT` | `/program/:programId/members/:memberId` | `programAdminMiddleware` | Update member role |
| `DELETE` | `/program/:programId/members/:memberId` | `programAdminMiddleware` | Remove member from program |
| `GET` | `/program/:programId/announcements` | `programAccessMiddleware` | List announcements |
| `POST` | `/program/:programId/announcements` | `programAdminMiddleware` | Create announcement |
| `PUT` | `/program/:programId/announcements/:announcementId` | `programAdminMiddleware` | Update announcement |
| `DELETE` | `/program/:programId/announcements/:announcementId` | `programAdminMiddleware` | Delete announcement |
| `GET` | `/program/:programId/files` | `programAccessMiddleware` | List files |
| `POST` | `/program/:programId/files` | `programAdminMiddleware` | Add file record |
| `DELETE` | `/program/:programId/files/:fileId` | `programAdminMiddleware` | Delete file |

#### Route Registration

```typescript
// apps/api/src/routes/program/index.ts
export * from './program';

// apps/api/src/app.ts
import { classRouter } from '@api/routes/program';
export const app = new Hono()
  // ... existing routes ...
  .route('/program', classRouter);
```

#### LMS Enrolled Programs Route

Add to `apps/api/src/routes/organization/organization.ts`:

```
GET /organization/programs/enrolled
```

Returns all `ACTIVE` programs where the current user is a STUDENT `program_member`, including the course list with per-course progress. Used by the LMS "My Programs" and "Program Hub" pages.

#### Build Verification

```bash
pnpm --filter @cio/utils build
pnpm --filter @cio/db build
pnpm --filter @cio/api build
```

---

## Frontend Plan (Dashboard)

### Request Types

File: `apps/dashboard/src/lib/features/program/utils/types.ts`

```typescript
import { classroomio, type InferResponseType } from '$lib/utils/services/api';

export type ListClassesRequest = typeof classroomio.program.$get;
export type CreateClassRequest = typeof classroomio.program.$post;
export type GetClassRequest = typeof classroomio.program[':programId']['$get'];
export type UpdateClassRequest = typeof classroomio.program[':programId']['$put'];
export type ListProgramCoursesRequest = typeof classroomio.program[':programId']['courses']['$get'];
export type AddCourseToClassRequest = typeof classroomio.program[':programId']['courses']['$post'];
export type ListProgramMembersRequest = typeof classroomio.program[':programId']['members']['$get'];
export type AddProgramMembersRequest = typeof classroomio.program[':programId']['members']['$post'];
export type ListAnnouncementsRequest = typeof classroomio.program[':programId']['announcements']['$get'];
export type CreateAnnouncementRequest = typeof classroomio.program[':programId']['announcements']['$post'];
export type ListProgramFilesRequest = typeof classroomio.program[':programId']['files']['$get'];

export type ListClassesSuccess = Extract<InferResponseType<ListClassesRequest>, { success: true }>;
export type ProgramItem = ListClassesSuccess['data'][number];

export type GetClassSuccess = Extract<InferResponseType<GetClassRequest>, { success: true }>;
export type ProgramDetail = GetClassSuccess['data'];

export type ListProgramCoursesSuccess = Extract<InferResponseType<ListProgramCoursesRequest>, { success: true }>;
export type ProgramCourse = ListProgramCoursesSuccess['data'][number];

export type ListProgramMembersSuccess = Extract<InferResponseType<ListProgramMembersRequest>, { success: true }>;
export type ProgramMember = ListProgramMembersSuccess['data'][number];

export type ListAnnouncementsSuccess = Extract<InferResponseType<ListAnnouncementsRequest>, { success: true }>;
export type ProgramAnnouncement = ListAnnouncementsSuccess['data'][number];

export type ListProgramFilesSuccess = Extract<InferResponseType<ListProgramFilesRequest>, { success: true }>;
export type ProgramFile = ListProgramFilesSuccess['data'][number];

// LMS enrolled programs
export type EnrolledClassesRequest = typeof classroomio.organization.programs.enrolled['$get'];
export type EnrolledClassesSuccess = Extract<InferResponseType<EnrolledClassesRequest>, { success: true }>;
export type EnrolledClass = EnrolledClassesSuccess['data'][number];
```

### API Program

File: `apps/dashboard/src/lib/features/program/api/program.svelte.ts`

```typescript
program ProgramApi extends BaseApiWithErrors {
  programs = $state<ProgramItem[]>([]);
  currentClass = $state<ProgramDetail | null>(null);
  courses = $state<ProgramCourse[]>([]);
  members = $state<ProgramMember[]>([]);
  announcements = $state<ProgramAnnouncement[]>([]);
  files = $state<ProgramFile[]>([]);
  loading = $state(false);

  async list() { /* GET /program */ }
  async get(programId: string) { /* GET /program/:programId */ }
  async create(data: TCreateProgram) { /* POST /program */ }
  async update(programId: string, data: TUpdateProgram) { /* PUT /program/:programId */ }
  async archive(programId: string) { /* DELETE /program/:programId */ }

  async listCourses(programId: string) { /* GET /program/:programId/courses */ }
  async addCourse(programId: string, data: TAddCourseToProgram) { /* POST /program/:programId/courses */ }
  async removeCourse(programId: string, courseId: string) { /* DELETE /program/:programId/courses/:courseId */ }

  async listMembers(programId: string) { /* GET /program/:programId/members */ }
  async addMembers(programId: string, data: TAddProgramMembers) { /* POST /program/:programId/members */ }
  async removeMember(programId: string, memberId: string) { /* DELETE /program/:programId/members/:memberId */ }

  async listAnnouncements(programId: string) { /* GET /program/:programId/announcements */ }
  async createAnnouncement(programId: string, data: TCreateProgramAnnouncement) { /* POST */ }
  async deleteAnnouncement(programId: string, announcementId: string) { /* DELETE */ }

  async listFiles(programId: string) { /* GET /program/:programId/files */ }
  async addFile(programId: string, data: TAddProgramFile) { /* POST /program/:programId/files */ }
  async deleteFile(programId: string, fileId: string) { /* DELETE /program/:programId/files/:fileId */ }
}

export const programApi = new ProgramApi();
```

### LMS API Program

File: `apps/dashboard/src/lib/features/lms/api/program.svelte.ts`

```typescript
program LmsProgramApi extends BaseApiWithErrors {
  enrolledClasses = $state<EnrolledClass[]>([]);
  loading = $state(false);

  async listEnrolled() { /* GET /organization/programs/enrolled */ }
}

export const lmsProgramApi = new LmsProgramApi();
```

### Admin Pages

| Route | File | Purpose |
| --- | --- | --- |
| `/courses/programs` | `apps/dashboard/src/routes/courses/programs/+page.svelte` | List all org programs |
| `/courses/programs/new` | `apps/dashboard/src/routes/courses/programs/new/+page.svelte` | Create program form |
| `/courses/programs/[programId]` | `apps/dashboard/src/routes/courses/programs/[programId]/+page.svelte` | Program overview |
| `/courses/programs/[programId]/courses` | `.../courses/+page.svelte` | Manage courses |
| `/courses/programs/[programId]/people` | `.../people/+page.svelte` | Manage members |
| `/courses/programs/[programId]/announcements` | `.../announcements/+page.svelte` | Manage announcements |
| `/courses/programs/[programId]/files` | `.../files/+page.svelte` | File library management |

Feature pages live in: `apps/dashboard/src/lib/features/program/pages/`

### LMS Pages

| Route | File | Purpose |
| --- | --- | --- |
| `/lms/programs` | `apps/dashboard/src/routes/lms/programs/+page.svelte` | My enrolled programs |
| `/lms/programs/[programId]` | `apps/dashboard/src/routes/lms/programs/[programId]/+page.svelte` | Program hub (courses + announcements + files) |
| `/lms/programs/[programId]/community` | `.../community/+page.svelte` | Program community Q&A |

Feature pages live in: `apps/dashboard/src/lib/features/lms/pages/program/`

### Navigation Updates

**Org admin sidebar** (`apps/dashboard/src/lib/features/org/`):
- Add "Programs" nav item at the same level as "Courses", linking to `/courses/programs`.
- Use a suitable icon (e.g., a group/layers icon).

**LMS sidebar** (`apps/dashboard/src/lib/features/lms/`):
- Add "Programs" nav item (shown conditionally: only when `enrolledClasses.length > 0`).
- Position between "My Learning" and "Exercises".

### Translations

File: `apps/dashboard/src/lib/utils/translations/en.json`

Add keys under `program`:

```json
{
  "program": {
    "title": "Programs",
    "my_classes": "My Programs",
    "create": "Create Program",
    "create_description": "Group multiple courses and materials under one program for your students.",
    "name": "Program Name",
    "description": "Description",
    "cover_image": "Cover Image",
    "status": "Status",
    "active": "Active",
    "inactive": "Inactive",
    "archived": "Archived",
    "courses": "Courses",
    "people": "People",
    "announcements": "Announcements",
    "files": "Files",
    "community": "Community",
    "add_course": "Add Course",
    "remove_course": "Remove Course",
    "add_members": "Add Members",
    "remove_member": "Remove Member",
    "course_count": "{count} courses",
    "student_count": "{count} students",
    "new_announcement": "New Announcement",
    "announcement_title": "Announcement Title",
    "announcement_body": "Write your announcement...",
    "upload_file": "Upload File",
    "no_classes": "No programs yet. Create one to get started.",
    "no_courses": "No courses in this program yet.",
    "no_members": "No members yet. Add students or tutors.",
    "no_announcements": "No announcements yet.",
    "no_files": "No files uploaded yet.",
    "archive_confirm": "Archiving this program will hide it from all views. Are you sure?",
    "auto_enroll_note": "Adding this course will enroll all current program students in it.",
    "remove_course_note": "Removing this course will not unenroll any students.",
    "remove_member_note": "Removing this member will not unenroll them from individual courses."
  }
}
```

### Frontend Build Verification

```bash
pnpm --filter @cio/dashboard build
```

---

## Implementation Order

### Phase 1: Database + Schema

1. Add `programStatus` enum to `packages/db/src/schema.ts`.
2. Add `lmsProgram`, `programCourse`, `programMember`, `programAnnouncement`, `programFile` tables to schema.
3. Add `programId` FK column to `communityQuestion` table in schema.
4. Write and apply migration SQL: `packages/db/src/migrations/XXXX_add_programs.sql`.
5. Run `pnpm --filter @cio/db build`.

### Phase 2: Validation + Queries

1. Create `packages/utils/src/validation/program/program.ts` with all Zod schemas.
2. Export from `packages/utils/src/validation/program/index.ts` and re-export from `packages/utils/src/validation/index.ts`.
3. Run `pnpm --filter @cio/utils build`.
4. Create `packages/db/src/queries/program/program.ts` with all query functions.
5. Create `packages/db/src/queries/program/index.ts` and export.
6. Run `pnpm --filter @cio/db build`.

### Phase 3: Service + Routes

1. Create `apps/api/src/services/program/program.ts` with all service functions (auto-enrollment transactions are the most complex part).
2. Create access control utilities: `apps/api/src/middleware/program-access.ts` and `apps/api/src/middleware/program-admin.ts`.
3. Add new error codes to `apps/api/src/utils/errors.ts`: `PROGRAM_NOT_FOUND`, `PROGRAM_FORBIDDEN`, `COURSE_ALREADY_IN_PROGRAM`, `MEMBER_ALREADY_IN_PROGRAM`.
4. Create `apps/api/src/routes/program/program.ts` with all route handlers.
5. Create `apps/api/src/routes/program/index.ts` and register in `apps/api/src/app.ts`.
6. Add `GET /organization/programs/enrolled` to the organization router.
7. Run `pnpm --filter @cio/api build`.

### Phase 4: Admin Frontend

1. Add request/response types to `apps/dashboard/src/lib/features/program/utils/types.ts`.
2. Create `apps/dashboard/src/lib/features/program/api/program.svelte.ts` API program.
3. Add translation keys to `en.json`.
4. Create admin feature pages under `apps/dashboard/src/lib/features/program/pages/`.
5. Create SvelteKit route files under `apps/dashboard/src/routes/courses/programs/`.
6. Add "Programs" nav item to the org admin sidebar.
7. Run `pnpm --filter @cio/dashboard build`.

### Phase 5: LMS Frontend

1. Create `apps/dashboard/src/lib/features/lms/api/program.svelte.ts`.
2. Create LMS feature pages under `apps/dashboard/src/lib/features/lms/pages/program/`.
3. Create SvelteKit route files under `apps/dashboard/src/routes/lms/programs/`.
4. Add "Programs" nav item to the LMS sidebar (conditional on having enrolled programs).
5. Run `pnpm --filter @cio/dashboard build`.

---

## Acceptance Criteria

1. Org admin can create a program, add courses to it, and add students — all from the admin dashboard.
2. When a student is added to a program, `groupmember` rows are automatically created for every course in the program.
3. When a course is added to an existing program that already has students, all those students are enrolled in the new course.
4. Removing a student from a program does not remove their `groupmember` records in individual courses.
5. Removing a course from a program does not unenroll any students.
6. Students see a "Programs" section in the LMS sidebar (only when enrolled in at least one program).
7. The program hub page shows all courses with per-course progress bars, the announcements feed, and the file library.
8. Program admins and tutors can post announcements and upload files; students can only view them.
9. Program community Q&A is scoped to the program and does not appear on course community boards.
10. `INACTIVE` programs are hidden from the student LMS but remain fully accessible to admins and tutors.
11. `ARCHIVED` programs are hidden from all views.
12. Courses that are not in any program, and courses whose students were enrolled independently, continue to work exactly as they do today (zero regression on existing `groupmember` and course data).
13. All user-facing strings use translation keys (no hardcoded English).
14. `pnpm --filter @cio/api build` and `pnpm --filter @cio/dashboard build` pass after implementation.

---

## Risks and Mitigations

- **Risk**: Auto-enrollment transaction for large programs (hundreds of students, tens of courses) times out or partially fails.
  - **Mitigation**: Process auto-enrollment in the service layer using a single transaction with batch inserts (insert multiple `groupmember` rows in one query using Drizzle's batch insert). For very large programs (> 500 students), offload to a background job via the existing email job queue or a new async task runner, and return a `202 Accepted` with a polling endpoint.

- **Risk**: A student is already enrolled in a course independently before being added to a program. Duplicate `groupmember` rows violate the `(groupId, profileId)` unique constraint.
  - **Mitigation**: The enrollment logic in `addMembersToProgram` must check for existing membership before inserting. Use `INSERT ... ON CONFLICT DO NOTHING` or check with `isUserCourseMember` before inserting. This is already idempotent in the existing enrollment service.

- **Risk**: The `community_question.programId` column causes existing community queries to break if they don't filter by `programId IS NULL` for course-scoped questions.
  - **Mitigation**: Add `programId IS NULL` to all existing community query filters where `courseId` is used. The column is nullable so existing rows default to NULL and behavior is unchanged. Update `packages/db/src/queries/community/community.ts` alongside the schema migration.

- **Risk**: Removing a course from a program causes confusion: students are still enrolled in the course but it no longer appears in the program hub.
  - **Mitigation**: Show a confirmation dialog in the admin UI with the note: "Removing this course will not unenroll any students. They will still have access to it via My Learning." Use the `program.remove_course_note` translation key already specified.

- **Risk**: Org nav gets crowded with a new "Programs" top-level item.
  - **Mitigation**: Place "Programs" directly below "Courses" in the sidebar. Consider grouping them under a "Learning" section header if more items are added in future.
