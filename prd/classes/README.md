# Classes PRD

## Purpose

Enable instructors and org admins to group multiple courses — along with shared announcements, files, and community discussions — into a single **class**. Enrolling a student in a class auto-enrolls them in every course inside it, eliminating the need to manage per-course enrollment manually when delivering a structured program.

## Problem Statement

Currently, ClassroomIO has no entity above the individual course. Every course has its own independent enrollment roster. This creates several pain points:

- An instructor running a program (e.g., a bootcamp, onboarding track, or certification pathway) must enroll students in each constituent course one by one.
- There is no shared space for class-wide announcements, files, or discussions that span multiple courses.
- Students cannot see a unified "program" view in the LMS — they only see a flat list of individual courses.
- Org admins have no way to bundle courses for a specific cohort of learners (e.g., "Q1 2026 New Hire Onboarding") without creating separate organizations or duplicating content.

## Confirmed Decisions

1. **Terminology**: "Class" in both the instructor-facing admin UI and the student-facing LMS.
2. **Auto-enrollment**: Joining a class automatically creates `groupmember` records for every course inside the class. Removing a student from a class does not remove them from individual course groups, preserving their submission and progress data.
3. **Shared materials**: Each class has three shared material surfaces: announcements (instructor-authored posts), a file library, and a community Q&A board.
4. **Many-to-many courses**: A course can belong to multiple classes. Courses and classes are independent entities linked by a join table.
5. **LMS visibility**: Classes are visible to students in the LMS under a dedicated "Classes" section. Students see enrolled classes and can navigate courses from within a class hub page.
6. **Roles**: Class roles mirror the existing system (`ADMIN`/roleId 1, `TUTOR`/roleId 2, `STUDENT`/roleId 3). Class admins and tutors can manage the class; class students get read access to materials.
7. **Class status**: Classes can be `ACTIVE`, `INACTIVE`, or `ARCHIVED`. `INACTIVE` classes are hidden from students in the LMS but preserved for instructors. `ARCHIVED` classes are soft-deleted and hidden everywhere.
8. **Course independence**: Courses in a class remain fully independent. A student enrolled in a class is a regular `groupmember` in each course — existing course pages, progress tracking, submissions, and grading are unchanged.
9. **Community reuse**: The existing `community_question` table gains a nullable `classId` FK. Class-level Q&A behaves identically to course-level community Q&A but scoped to the class.

## Current-State Audit

| Capability | Current State | Notes |
| --- | --- | --- |
| Organization structure | `organization` → `group` (1:1 with `course`) → `course` | No intermediate grouping layer above course |
| Course enrollment | `groupmember` rows per course's `group` | Per-course, no bulk enrollment mechanism |
| Student LMS view | Flat list of enrolled courses under `/lms/mylearning` | No program/class concept |
| Community Q&A | `community_question.courseId` scoped | Reusable with additional `classId` FK |
| Shared file library | Per-course via `assets` table; no org-wide shared files | New `class_file` table needed |
| Announcements | Per-course `course_newsfeed` | New `class_announcement` table needed |
| Org admin navigation | "Courses" section listing all courses | "Classes" nav item needed |
| LMS navigation | Home, My Learning, Exercises, Community, Explore, Settings | "Classes" nav item needed |
| Enrollment service | `enrollInCourse()` in `apps/api/src/services/course/invite.ts` | Must be called per-course when adding class member |

**Key insight**: Because enrollment = `groupmember` rows per course, adding a student to a class is purely a matter of calling the existing enrollment logic for each course in the class within a single transaction. No course-level schema changes are needed.

## Product Goals

1. Org admins and instructors can create a class, add courses to it, and manage class membership from the admin dashboard.
2. Adding a student to a class auto-enrolls them in all courses currently in the class.
3. Adding a new course to an existing class auto-enrolls all current class students in that course.
4. Each class has a shared announcements feed, file library, and community board visible to all class members.
5. Students can see their enrolled classes in the LMS with a unified hub view showing all courses, announcements, and files.
6. Classes without students, and courses outside any class, continue to work exactly as they do today (zero regression).

## Non-Goals (v1)

- Class-level invite links (v1 enrollment is admin-managed; students cannot self-enroll in a class via a token).
- Class-specific exercise deadlines or content overrides (courses are shared as-is).
- Class progress analytics aggregated across all courses (available per-course; cross-course aggregation is a future improvement).
- Removing a student from a class also unenrolling them from individual courses (data preservation is the default).
- Class templates or class cloning.
- Public/discoverable class landing pages (classes are private to org members).
- Billing or pricing at the class level.
- Class-level attendance tracking separate from per-course attendance.

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

### 1. Class CRUD (Admin)

- Org admins can create a class with: name (required), description (optional), cover image (optional).
- Classes can be updated (name, description, cover image, status).
- Archiving a class sets `status = 'ARCHIVED'` and hides it from all views. Archived classes can be restored.
- A class belongs to exactly one organization.
- Class names do not need to be unique within an org (unlike course slugs), but should be descriptive.

### 2. Course Management in a Class (Admin)

- Org admins and class tutors can add existing org courses to a class.
- A course can belong to multiple classes simultaneously.
- Adding a course to a class triggers auto-enrollment: all existing `STUDENT` class members are enrolled in the new course (a `groupmember` row is created in the course's `group` for each student not already enrolled).
- Removing a course from a class does not unenroll any students from that course. Their progress and submissions are preserved.
- Courses within a class are ordered (integer `order` field) so instructors can sequence them.

### 3. Class Membership (Admin)

- Org admins can add members to a class by profile ID or email, assigning them a role (ADMIN, TUTOR, or STUDENT).
- Adding a STUDENT member triggers auto-enrollment: a `groupmember` row is created in every course currently in the class (skipping courses the student is already enrolled in; idempotent).
- Adding an ADMIN or TUTOR member does not auto-enroll them in courses (their course-level permissions are managed separately via course membership).
- Removing a member from a class removes the `class_member` row only. Individual `groupmember` rows in courses are left intact, preserving submissions, grades, and progress.
- Batch add: admins can add multiple members at once (array of `{ email, roleId }` pairs).

### 4. Class Announcements (Admin + LMS)

- Class admins and tutors can post announcements to the class feed.
- Announcements have a title and a rich-text body.
- Announcements are visible to all class members (students, tutors, and admins) in both the admin class view and the LMS class hub.
- Students cannot post announcements (read-only for students).
- Announcements are ordered by `createdAt` descending (newest first).

### 5. Class File Library (Admin + LMS)

- Class admins and tutors can upload files to the class file library.
- Each file record stores: name, URL (stored via the existing presigned upload flow), MIME type, size, uploader profile ID.
- All class members can view and download files.
- Only class admins and tutors can delete files.

### 6. Class Community (Admin + LMS)

- Class-level community Q&A reuses the existing `community_question` / `community_answer` infrastructure.
- A nullable `classId` FK is added to `community_question`. Questions with `classId` set are class-scoped (not visible on the course-level community board).
- All class members can post questions and answers in the class community.
- The existing voting, commenting, and answer-acceptance behavior is unchanged.

### 7. LMS — My Classes (Student)

- A "Classes" nav item appears in the LMS sidebar when the student is enrolled in at least one class.
- The `/lms/classes` page lists all classes the student is enrolled in.
- Each class card shows: class name, cover image, number of courses, brief description.
- Clicking a class opens the class hub page.

### 8. LMS — Class Hub (Student)

- The class hub at `/lms/classes/[classId]` is the student's central page for a class.
- It is divided into three tabs or sections:
  - **Courses**: All courses in the class, each with the student's individual progress bar and a direct link to the course. Courses are shown in the instructor-defined order.
  - **Announcements**: Class announcements in reverse-chronological order (read-only for students).
  - **Resources**: The class file library (download only) and a link to the class community board.
- The class community board lives at `/lms/classes/[classId]/community` and behaves identically to the existing course community pages.

### 9. Admin — Classes Section

- "Classes" is added as a top-level nav item in the org admin sidebar, alongside "Courses".
- The `/courses/classes` page lists all org classes with name, course count, student count, and status badge.
- A "Create Class" button opens a creation form.
- Each class links to a class detail view with sub-pages: Overview, Courses, People, Announcements, Files.

### 10. Access Control

- Only `ADMIN` and `TUTOR` role members of a class (or org admins) can manage class content and membership.
- Students can read announcements and files, participate in the community, and view the course list.
- A student who is removed from the org loses access to all class content.
- An `INACTIVE` class is hidden from students in the LMS but all data is preserved.

---

## Technical Design

### Data Model

#### New Enum: `CLASS_STATUS`

```typescript
// packages/db/src/schema.ts
export const classStatus = pgEnum('CLASS_STATUS', ['ACTIVE', 'INACTIVE', 'ARCHIVED']);
```

#### New Table: `class`

```typescript
// packages/db/src/schema.ts
export const lmsClass = pgTable(
  'class',
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
    status: classStatus().default('ACTIVE').notNull(),
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
    index('idx_class_organization_id').on(table.organizationId)
  ]
);
```

#### New Table: `class_course`

Many-to-many join between class and course, with an instructor-controlled display order.

```typescript
// packages/db/src/schema.ts
export const classCourse = pgTable(
  'class_course',
  {
    id: uuid()
      .default(sql`gen_random_uuid()`)
      .primaryKey()
      .notNull(),
    classId: uuid('class_id').notNull(),
    courseId: uuid('course_id').notNull(),
    order: integer().default(0).notNull(),
    addedAt: timestamp('added_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull()
  },
  (table) => [
    foreignKey({
      columns: [table.classId],
      foreignColumns: [lmsClass.id],
      name: 'class_course_class_id_fkey'
    }).onDelete('cascade'),
    foreignKey({
      columns: [table.courseId],
      foreignColumns: [course.id],
      name: 'class_course_course_id_fkey'
    }).onDelete('cascade'),
    unique('class_course_class_id_course_id_unique').on(table.classId, table.courseId),
    index('idx_class_course_class_id').on(table.classId)
  ]
);
```

#### New Table: `class_member`

Membership roster for a class. Does not replace `groupmember` — it is a separate layer.

```typescript
// packages/db/src/schema.ts
export const classMember = pgTable(
  'class_member',
  {
    id: uuid()
      .default(sql`gen_random_uuid()`)
      .primaryKey()
      .notNull(),
    classId: uuid('class_id').notNull(),
    profileId: uuid('profile_id'),
    roleId: integer('role_id').notNull(),
    email: text(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull()
  },
  (table) => [
    foreignKey({
      columns: [table.classId],
      foreignColumns: [lmsClass.id],
      name: 'class_member_class_id_fkey'
    }).onDelete('cascade'),
    foreignKey({
      columns: [table.profileId],
      foreignColumns: [profile.id],
      name: 'class_member_profile_id_fkey'
    }),
    foreignKey({
      columns: [table.roleId],
      foreignColumns: [role.id],
      name: 'class_member_role_id_fkey'
    }),
    unique('class_member_class_id_profile_id_unique').on(table.classId, table.profileId),
    index('idx_class_member_class_id').on(table.classId),
    index('idx_class_member_profile_id').on(table.profileId)
  ]
);
```

#### New Table: `class_announcement`

```typescript
// packages/db/src/schema.ts
export const classAnnouncement = pgTable(
  'class_announcement',
  {
    id: uuid()
      .default(sql`gen_random_uuid()`)
      .primaryKey()
      .notNull(),
    classId: uuid('class_id').notNull(),
    authorProfileId: uuid('author_profile_id'),
    title: varchar().notNull(),
    body: text(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow()
  },
  (table) => [
    foreignKey({
      columns: [table.classId],
      foreignColumns: [lmsClass.id],
      name: 'class_announcement_class_id_fkey'
    }).onDelete('cascade'),
    foreignKey({
      columns: [table.authorProfileId],
      foreignColumns: [profile.id],
      name: 'class_announcement_author_profile_id_fkey'
    }),
    index('idx_class_announcement_class_id').on(table.classId)
  ]
);
```

#### New Table: `class_file`

```typescript
// packages/db/src/schema.ts
export const classFile = pgTable(
  'class_file',
  {
    id: uuid()
      .default(sql`gen_random_uuid()`)
      .primaryKey()
      .notNull(),
    classId: uuid('class_id').notNull(),
    uploadedByProfileId: uuid('uploaded_by_profile_id'),
    name: varchar().notNull(),
    url: text().notNull(),
    mimeType: varchar('mime_type'),
    size: integer(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull()
  },
  (table) => [
    foreignKey({
      columns: [table.classId],
      foreignColumns: [lmsClass.id],
      name: 'class_file_class_id_fkey'
    }).onDelete('cascade'),
    foreignKey({
      columns: [table.uploadedByProfileId],
      foreignColumns: [profile.id],
      name: 'class_file_uploaded_by_profile_id_fkey'
    }),
    index('idx_class_file_class_id').on(table.classId)
  ]
);
```

#### Modified Table: `community_question`

Add a nullable `classId` FK so community questions can be scoped to a class:

```typescript
// Add to community_question table columns:
classId: uuid('class_id')

// Add to community_question table constraints:
foreignKey({
  columns: [table.classId],
  foreignColumns: [lmsClass.id],
  name: 'community_question_class_id_fkey'
}).onDelete('cascade')
```

When `classId` is set, the question is class-scoped. When `courseId` is set, it is course-scoped. The two are mutually exclusive in practice (enforced at the service layer).

#### Relationship Diagram

```
organization
  └── class
        ├── class_course  ──────────────────────→  course
        │     (order, addedAt)                        └── group → groupmember ← (auto-created)
        ├── class_member  ──────────────────────→  profile
        │     (roleId: ADMIN/TUTOR/STUDENT)
        ├── class_announcement
        │     (title, body, authorProfileId)
        ├── class_file
        │     (name, url, mimeType, size)
        └── community_question (classId set)
              └── community_answer
```

### Migration

File: `packages/db/src/migrations/XXXX_add_classes.sql`

```sql
-- 1. Create CLASS_STATUS enum
CREATE TYPE "CLASS_STATUS" AS ENUM ('ACTIVE', 'INACTIVE', 'ARCHIVED');

-- 2. Create class table
CREATE TABLE class (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  organization_id UUID NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
  name VARCHAR NOT NULL,
  description TEXT,
  cover_image TEXT,
  status "CLASS_STATUS" NOT NULL DEFAULT 'ACTIVE',
  created_by_profile_id UUID REFERENCES profile(id)
);

CREATE INDEX idx_class_organization_id ON class(organization_id);

-- 3. Create class_course join table
CREATE TABLE class_course (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID NOT NULL REFERENCES class(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES course(id) ON DELETE CASCADE,
  "order" INTEGER NOT NULL DEFAULT 0,
  added_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(class_id, course_id)
);

CREATE INDEX idx_class_course_class_id ON class_course(class_id);

-- 4. Create class_member table
CREATE TABLE class_member (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID NOT NULL REFERENCES class(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES profile(id),
  role_id INTEGER NOT NULL REFERENCES role(id),
  email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(class_id, profile_id)
);

CREATE INDEX idx_class_member_class_id ON class_member(class_id);
CREATE INDEX idx_class_member_profile_id ON class_member(profile_id);

-- 5. Create class_announcement table
CREATE TABLE class_announcement (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID NOT NULL REFERENCES class(id) ON DELETE CASCADE,
  author_profile_id UUID REFERENCES profile(id),
  title VARCHAR NOT NULL,
  body TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_class_announcement_class_id ON class_announcement(class_id);

-- 6. Create class_file table
CREATE TABLE class_file (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID NOT NULL REFERENCES class(id) ON DELETE CASCADE,
  uploaded_by_profile_id UUID REFERENCES profile(id),
  name VARCHAR NOT NULL,
  url TEXT NOT NULL,
  mime_type VARCHAR,
  size INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_class_file_class_id ON class_file(class_id);

-- 7. Add classId to community_question
ALTER TABLE community_question ADD COLUMN class_id UUID REFERENCES class(id) ON DELETE CASCADE;
```

---

## Access Control Logic

Two middleware functions are needed in `apps/api/src/middleware/`:

### `classAccessMiddleware` (read access)

Verifies the caller is either an org admin or a `class_member` for the given `:classId`. Used on all `GET /class/:classId/*` routes.

```typescript
// apps/api/src/middleware/class-access.ts
export async function classAccessMiddleware(c, next) {
  const { classId } = c.req.param();
  const user = c.get('user')!;
  const isMember = await isClassMember(classId, user.profileId);
  const isOrgAdmin = await isOrgAdminByClassId(classId, user.profileId);
  if (!isMember && !isOrgAdmin) throw new AppError('Forbidden', ErrorCodes.FORBIDDEN, 403);
  await next();
}
```

### `classAdminMiddleware` (write access)

Verifies the caller has `roleId` 1 (ADMIN) or 2 (TUTOR) within the class, or is an org admin. Used on all mutating routes.

```typescript
// apps/api/src/middleware/class-admin.ts
export async function classAdminMiddleware(c, next) {
  const { classId } = c.req.param();
  const user = c.get('user')!;
  const role = await getClassMemberRole(classId, user.profileId);
  const isOrgAdmin = await isOrgAdminByClassId(classId, user.profileId);
  if (!isOrgAdmin && (!role || role > 2)) throw new AppError('Forbidden', ErrorCodes.FORBIDDEN, 403);
  await next();
}
```

---

## API and Route Plan

### Validation Layer

File: `packages/utils/src/validation/class/class.ts`

```typescript
import { z } from 'zod';

export const ZCreateClass = z.object({
  name: z.string().min(1).max(255),
  description: z.string().max(2000).optional(),
  coverImage: z.string().url().optional()
});
export type TCreateClass = z.infer<typeof ZCreateClass>;

export const ZUpdateClass = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().max(2000).nullable().optional(),
  coverImage: z.string().url().nullable().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'ARCHIVED']).optional()
});
export type TUpdateClass = z.infer<typeof ZUpdateClass>;

export const ZAddCourseToClass = z.object({
  courseId: z.string().uuid(),
  order: z.number().int().min(0).optional()
});
export type TAddCourseToClass = z.infer<typeof ZAddCourseToClass>;

export const ZAddClassMembers = z.object({
  members: z.array(
    z.object({
      email: z.string().email(),
      roleId: z.number().int().min(1).max(3)
    })
  ).min(1)
});
export type TAddClassMembers = z.infer<typeof ZAddClassMembers>;

export const ZUpdateClassMember = z.object({
  roleId: z.number().int().min(1).max(3)
});
export type TUpdateClassMember = z.infer<typeof ZUpdateClassMember>;

export const ZCreateClassAnnouncement = z.object({
  title: z.string().min(1).max(500),
  body: z.string().max(10000).optional()
});
export type TCreateClassAnnouncement = z.infer<typeof ZCreateClassAnnouncement>;

export const ZUpdateClassAnnouncement = z.object({
  title: z.string().min(1).max(500).optional(),
  body: z.string().max(10000).nullable().optional()
});
export type TUpdateClassAnnouncement = z.infer<typeof ZUpdateClassAnnouncement>;

export const ZAddClassFile = z.object({
  name: z.string().min(1).max(255),
  url: z.string().url(),
  mimeType: z.string().optional(),
  size: z.number().int().positive().optional()
});
export type TAddClassFile = z.infer<typeof ZAddClassFile>;
```

Export from: `packages/utils/src/validation/class/index.ts` and re-export from `packages/utils/src/validation/index.ts`.

### Query Layer

File: `packages/db/src/queries/class/class.ts`

| Function | Description |
| --- | --- |
| `createClass(data)` | Insert into `class`, return created row |
| `getClassById(classId)` | Single class with member count and course count |
| `getClassesByOrg(orgId)` | All non-archived classes for org, ordered by `createdAt` desc |
| `updateClass(classId, data)` | Update name, description, coverImage, status |
| `getClassMemberRole(classId, profileId)` | Return `roleId` for the given profile in the class, or null |
| `isClassMember(classId, profileId)` | Boolean check |
| `isOrgAdminByClassId(classId, profileId)` | Joins `class → organization → organizationmember` to check admin role |
| `addClassMember(classId, profileId, roleId, email)` | Insert `class_member` row (upsert on conflict) |
| `removeClassMember(classId, memberId)` | Delete `class_member` by `id` |
| `getClassMembers(classId)` | All members joined to `profile` for display |
| `getEnrolledClassesByProfile(orgId, profileId)` | All `ACTIVE` classes where profile is a class member, for LMS |
| `addCourseToClass(classId, courseId, order)` | Insert `class_course` row |
| `removeCourseFromClass(classId, courseId)` | Delete `class_course` row |
| `getCoursesByClass(classId)` | All courses in class ordered by `order`, joined to `course` |
| `getStudentMemberIdsByClass(classId)` | All `profileId` values with `roleId = 3` in class (for auto-enrollment) |
| `createClassAnnouncement(data)` | Insert `class_announcement` |
| `getClassAnnouncements(classId)` | All announcements ordered by `createdAt` desc, joined to `profile` |
| `updateClassAnnouncement(announcementId, data)` | Update title/body |
| `deleteClassAnnouncement(announcementId)` | Delete row |
| `addClassFile(data)` | Insert `class_file` |
| `getClassFiles(classId)` | All files ordered by `createdAt` desc |
| `deleteClassFile(fileId)` | Delete `class_file` by `id` |

Export from: `packages/db/src/queries/class/index.ts`

### Service Layer

File: `apps/api/src/services/class/class.ts`

#### `createClass(orgId, profileId, data: TCreateClass)`

- Insert `class` row.
- Add creator as `class_member` with `roleId = 1` (ADMIN).
- Return the new class.

#### `addCourseToClass(classId, courseId)`

- Verify class exists and course belongs to the same org.
- Insert `class_course` row (error if already linked).
- Fetch all current STUDENT class members (`getStudentMemberIdsByClass`).
- For each student profile, look up their `groupmember` status in the course's group; if not already enrolled, call `enrollInCourse` (or insert `groupmember` directly if the course is free and no invite is needed).
- All writes in a single transaction.
- Return updated course list for the class.

#### `removeCourseFromClass(classId, courseId)`

- Delete `class_course` row.
- No changes to `groupmember` records.
- Return updated course list.

#### `addMembersToClass(classId, members: TAddClassMembers['members'])`

Transaction:
1. For each member in the batch, resolve `profileId` from `email` (look up `profile` by email, create if none exists as an invited-but-unregistered user following the same pattern as `addGroupMember`).
2. Insert `class_member` row (skip if already a member of the class).
3. If `roleId = 3` (STUDENT), fetch all courses in the class (`getCoursesByClass`). For each course, check if the student is already a `groupmember`; if not, insert a `groupmember` row with `roleId = 3`.

#### `removeMemberFromClass(classId, memberId)`

- Delete `class_member` row by `id`.
- Leave all `groupmember` rows in individual courses intact.

#### `createAnnouncement(classId, profileId, data: TCreateClassAnnouncement)`

- Verify caller is class admin or tutor.
- Insert `class_announcement` row.
- Return new announcement.

#### `addFile(classId, profileId, data: TAddClassFile)`

- Insert `class_file` row.
- Return new file record.

#### `deleteFile(fileId, profileId)`

- Verify caller is class admin or tutor.
- Delete `class_file` row.

### Route Layer

File: `apps/api/src/routes/class/class.ts`

All routes require `authMiddleware`. Routes scoped to a `:classId` also apply `classAccessMiddleware` (read) or `classAdminMiddleware` (write) as noted.

| Method | Path | Middleware | Description |
| --- | --- | --- | --- |
| `GET` | `/class` | `authMiddleware` | List org's classes (org admin sees all; tutors/students see their own) |
| `POST` | `/class` | `authMiddleware` + orgAdmin | Create class |
| `GET` | `/class/:classId` | `classAccessMiddleware` | Get class with member/course counts |
| `PUT` | `/class/:classId` | `classAdminMiddleware` | Update class name, description, cover, status |
| `DELETE` | `/class/:classId` | orgAdmin | Archive class (`status = 'ARCHIVED'`) |
| `GET` | `/class/:classId/courses` | `classAccessMiddleware` | List courses in class (ordered) |
| `POST` | `/class/:classId/courses` | `classAdminMiddleware` | Add course to class + auto-enroll students |
| `DELETE` | `/class/:classId/courses/:courseId` | `classAdminMiddleware` | Remove course from class |
| `GET` | `/class/:classId/members` | `classAdminMiddleware` | List class members with profile info |
| `POST` | `/class/:classId/members` | `classAdminMiddleware` | Batch-add members + auto-enroll students |
| `PUT` | `/class/:classId/members/:memberId` | `classAdminMiddleware` | Update member role |
| `DELETE` | `/class/:classId/members/:memberId` | `classAdminMiddleware` | Remove member from class |
| `GET` | `/class/:classId/announcements` | `classAccessMiddleware` | List announcements |
| `POST` | `/class/:classId/announcements` | `classAdminMiddleware` | Create announcement |
| `PUT` | `/class/:classId/announcements/:announcementId` | `classAdminMiddleware` | Update announcement |
| `DELETE` | `/class/:classId/announcements/:announcementId` | `classAdminMiddleware` | Delete announcement |
| `GET` | `/class/:classId/files` | `classAccessMiddleware` | List files |
| `POST` | `/class/:classId/files` | `classAdminMiddleware` | Add file record |
| `DELETE` | `/class/:classId/files/:fileId` | `classAdminMiddleware` | Delete file |

#### Route Registration

```typescript
// apps/api/src/routes/class/index.ts
export * from './class';

// apps/api/src/app.ts
import { classRouter } from '@api/routes/class';
export const app = new Hono()
  // ... existing routes ...
  .route('/class', classRouter);
```

#### LMS Enrolled Classes Route

Add to `apps/api/src/routes/organization/organization.ts`:

```
GET /organization/classes/enrolled
```

Returns all `ACTIVE` classes where the current user is a STUDENT `class_member`, including the course list with per-course progress. Used by the LMS "My Classes" and "Class Hub" pages.

#### Build Verification

```bash
pnpm --filter @cio/utils build
pnpm --filter @cio/db build
pnpm --filter @cio/api build
```

---

## Frontend Plan (Dashboard)

### Request Types

File: `apps/dashboard/src/lib/features/class/utils/types.ts`

```typescript
import { classroomio, type InferResponseType } from '$lib/utils/services/api';

export type ListClassesRequest = typeof classroomio.class.$get;
export type CreateClassRequest = typeof classroomio.class.$post;
export type GetClassRequest = typeof classroomio.class[':classId']['$get'];
export type UpdateClassRequest = typeof classroomio.class[':classId']['$put'];
export type ListClassCoursesRequest = typeof classroomio.class[':classId']['courses']['$get'];
export type AddCourseToClassRequest = typeof classroomio.class[':classId']['courses']['$post'];
export type ListClassMembersRequest = typeof classroomio.class[':classId']['members']['$get'];
export type AddClassMembersRequest = typeof classroomio.class[':classId']['members']['$post'];
export type ListAnnouncementsRequest = typeof classroomio.class[':classId']['announcements']['$get'];
export type CreateAnnouncementRequest = typeof classroomio.class[':classId']['announcements']['$post'];
export type ListClassFilesRequest = typeof classroomio.class[':classId']['files']['$get'];

export type ListClassesSuccess = Extract<InferResponseType<ListClassesRequest>, { success: true }>;
export type ClassItem = ListClassesSuccess['data'][number];

export type GetClassSuccess = Extract<InferResponseType<GetClassRequest>, { success: true }>;
export type ClassDetail = GetClassSuccess['data'];

export type ListClassCoursesSuccess = Extract<InferResponseType<ListClassCoursesRequest>, { success: true }>;
export type ClassCourse = ListClassCoursesSuccess['data'][number];

export type ListClassMembersSuccess = Extract<InferResponseType<ListClassMembersRequest>, { success: true }>;
export type ClassMember = ListClassMembersSuccess['data'][number];

export type ListAnnouncementsSuccess = Extract<InferResponseType<ListAnnouncementsRequest>, { success: true }>;
export type ClassAnnouncement = ListAnnouncementsSuccess['data'][number];

export type ListClassFilesSuccess = Extract<InferResponseType<ListClassFilesRequest>, { success: true }>;
export type ClassFile = ListClassFilesSuccess['data'][number];

// LMS enrolled classes
export type EnrolledClassesRequest = typeof classroomio.organization.classes.enrolled['$get'];
export type EnrolledClassesSuccess = Extract<InferResponseType<EnrolledClassesRequest>, { success: true }>;
export type EnrolledClass = EnrolledClassesSuccess['data'][number];
```

### API Class

File: `apps/dashboard/src/lib/features/class/api/class.svelte.ts`

```typescript
class ClassApi extends BaseApiWithErrors {
  classes = $state<ClassItem[]>([]);
  currentClass = $state<ClassDetail | null>(null);
  courses = $state<ClassCourse[]>([]);
  members = $state<ClassMember[]>([]);
  announcements = $state<ClassAnnouncement[]>([]);
  files = $state<ClassFile[]>([]);
  loading = $state(false);

  async list() { /* GET /class */ }
  async get(classId: string) { /* GET /class/:classId */ }
  async create(data: TCreateClass) { /* POST /class */ }
  async update(classId: string, data: TUpdateClass) { /* PUT /class/:classId */ }
  async archive(classId: string) { /* DELETE /class/:classId */ }

  async listCourses(classId: string) { /* GET /class/:classId/courses */ }
  async addCourse(classId: string, data: TAddCourseToClass) { /* POST /class/:classId/courses */ }
  async removeCourse(classId: string, courseId: string) { /* DELETE /class/:classId/courses/:courseId */ }

  async listMembers(classId: string) { /* GET /class/:classId/members */ }
  async addMembers(classId: string, data: TAddClassMembers) { /* POST /class/:classId/members */ }
  async removeMember(classId: string, memberId: string) { /* DELETE /class/:classId/members/:memberId */ }

  async listAnnouncements(classId: string) { /* GET /class/:classId/announcements */ }
  async createAnnouncement(classId: string, data: TCreateClassAnnouncement) { /* POST */ }
  async deleteAnnouncement(classId: string, announcementId: string) { /* DELETE */ }

  async listFiles(classId: string) { /* GET /class/:classId/files */ }
  async addFile(classId: string, data: TAddClassFile) { /* POST /class/:classId/files */ }
  async deleteFile(classId: string, fileId: string) { /* DELETE /class/:classId/files/:fileId */ }
}

export const classApi = new ClassApi();
```

### LMS API Class

File: `apps/dashboard/src/lib/features/lms/api/class.svelte.ts`

```typescript
class LmsClassApi extends BaseApiWithErrors {
  enrolledClasses = $state<EnrolledClass[]>([]);
  loading = $state(false);

  async listEnrolled() { /* GET /organization/classes/enrolled */ }
}

export const lmsClassApi = new LmsClassApi();
```

### Admin Pages

| Route | File | Purpose |
| --- | --- | --- |
| `/courses/classes` | `apps/dashboard/src/routes/courses/classes/+page.svelte` | List all org classes |
| `/courses/classes/new` | `apps/dashboard/src/routes/courses/classes/new/+page.svelte` | Create class form |
| `/courses/classes/[classId]` | `apps/dashboard/src/routes/courses/classes/[classId]/+page.svelte` | Class overview |
| `/courses/classes/[classId]/courses` | `.../courses/+page.svelte` | Manage courses |
| `/courses/classes/[classId]/people` | `.../people/+page.svelte` | Manage members |
| `/courses/classes/[classId]/announcements` | `.../announcements/+page.svelte` | Manage announcements |
| `/courses/classes/[classId]/files` | `.../files/+page.svelte` | File library management |

Feature pages live in: `apps/dashboard/src/lib/features/class/pages/`

### LMS Pages

| Route | File | Purpose |
| --- | --- | --- |
| `/lms/classes` | `apps/dashboard/src/routes/lms/classes/+page.svelte` | My enrolled classes |
| `/lms/classes/[classId]` | `apps/dashboard/src/routes/lms/classes/[classId]/+page.svelte` | Class hub (courses + announcements + files) |
| `/lms/classes/[classId]/community` | `.../community/+page.svelte` | Class community Q&A |

Feature pages live in: `apps/dashboard/src/lib/features/lms/pages/class/`

### Navigation Updates

**Org admin sidebar** (`apps/dashboard/src/lib/features/org/`):
- Add "Classes" nav item at the same level as "Courses", linking to `/courses/classes`.
- Use a suitable icon (e.g., a group/layers icon).

**LMS sidebar** (`apps/dashboard/src/lib/features/lms/`):
- Add "Classes" nav item (shown conditionally: only when `enrolledClasses.length > 0`).
- Position between "My Learning" and "Exercises".

### Translations

File: `apps/dashboard/src/lib/utils/translations/en.json`

Add keys under `class`:

```json
{
  "class": {
    "title": "Classes",
    "my_classes": "My Classes",
    "create": "Create Class",
    "create_description": "Group multiple courses and materials under one class for your students.",
    "name": "Class Name",
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
    "no_classes": "No classes yet. Create one to get started.",
    "no_courses": "No courses in this class yet.",
    "no_members": "No members yet. Add students or tutors.",
    "no_announcements": "No announcements yet.",
    "no_files": "No files uploaded yet.",
    "archive_confirm": "Archiving this class will hide it from all views. Are you sure?",
    "auto_enroll_note": "Adding this course will enroll all current class students in it.",
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

1. Add `classStatus` enum to `packages/db/src/schema.ts`.
2. Add `lmsClass`, `classCourse`, `classMember`, `classAnnouncement`, `classFile` tables to schema.
3. Add `classId` FK column to `communityQuestion` table in schema.
4. Write and apply migration SQL: `packages/db/src/migrations/XXXX_add_classes.sql`.
5. Run `pnpm --filter @cio/db build`.

### Phase 2: Validation + Queries

1. Create `packages/utils/src/validation/class/class.ts` with all Zod schemas.
2. Export from `packages/utils/src/validation/class/index.ts` and re-export from `packages/utils/src/validation/index.ts`.
3. Run `pnpm --filter @cio/utils build`.
4. Create `packages/db/src/queries/class/class.ts` with all query functions.
5. Create `packages/db/src/queries/class/index.ts` and export.
6. Run `pnpm --filter @cio/db build`.

### Phase 3: Service + Routes

1. Create `apps/api/src/services/class/class.ts` with all service functions (auto-enrollment transactions are the most complex part).
2. Create access control utilities: `apps/api/src/middleware/class-access.ts` and `apps/api/src/middleware/class-admin.ts`.
3. Add new error codes to `apps/api/src/utils/errors.ts`: `CLASS_NOT_FOUND`, `CLASS_FORBIDDEN`, `COURSE_ALREADY_IN_CLASS`, `MEMBER_ALREADY_IN_CLASS`.
4. Create `apps/api/src/routes/class/class.ts` with all route handlers.
5. Create `apps/api/src/routes/class/index.ts` and register in `apps/api/src/app.ts`.
6. Add `GET /organization/classes/enrolled` to the organization router.
7. Run `pnpm --filter @cio/api build`.

### Phase 4: Admin Frontend

1. Add request/response types to `apps/dashboard/src/lib/features/class/utils/types.ts`.
2. Create `apps/dashboard/src/lib/features/class/api/class.svelte.ts` API class.
3. Add translation keys to `en.json`.
4. Create admin feature pages under `apps/dashboard/src/lib/features/class/pages/`.
5. Create SvelteKit route files under `apps/dashboard/src/routes/courses/classes/`.
6. Add "Classes" nav item to the org admin sidebar.
7. Run `pnpm --filter @cio/dashboard build`.

### Phase 5: LMS Frontend

1. Create `apps/dashboard/src/lib/features/lms/api/class.svelte.ts`.
2. Create LMS feature pages under `apps/dashboard/src/lib/features/lms/pages/class/`.
3. Create SvelteKit route files under `apps/dashboard/src/routes/lms/classes/`.
4. Add "Classes" nav item to the LMS sidebar (conditional on having enrolled classes).
5. Run `pnpm --filter @cio/dashboard build`.

---

## Acceptance Criteria

1. Org admin can create a class, add courses to it, and add students — all from the admin dashboard.
2. When a student is added to a class, `groupmember` rows are automatically created for every course in the class.
3. When a course is added to an existing class that already has students, all those students are enrolled in the new course.
4. Removing a student from a class does not remove their `groupmember` records in individual courses.
5. Removing a course from a class does not unenroll any students.
6. Students see a "Classes" section in the LMS sidebar (only when enrolled in at least one class).
7. The class hub page shows all courses with per-course progress bars, the announcements feed, and the file library.
8. Class admins and tutors can post announcements and upload files; students can only view them.
9. Class community Q&A is scoped to the class and does not appear on course community boards.
10. `INACTIVE` classes are hidden from the student LMS but remain fully accessible to admins and tutors.
11. `ARCHIVED` classes are hidden from all views.
12. Courses that are not in any class, and courses whose students were enrolled independently, continue to work exactly as they do today (zero regression on existing `groupmember` and course data).
13. All user-facing strings use translation keys (no hardcoded English).
14. `pnpm --filter @cio/api build` and `pnpm --filter @cio/dashboard build` pass after implementation.

---

## Risks and Mitigations

- **Risk**: Auto-enrollment transaction for large classes (hundreds of students, tens of courses) times out or partially fails.
  - **Mitigation**: Process auto-enrollment in the service layer using a single transaction with batch inserts (insert multiple `groupmember` rows in one query using Drizzle's batch insert). For very large classes (> 500 students), offload to a background job via the existing email job queue or a new async task runner, and return a `202 Accepted` with a polling endpoint.

- **Risk**: A student is already enrolled in a course independently before being added to a class. Duplicate `groupmember` rows violate the `(groupId, profileId)` unique constraint.
  - **Mitigation**: The enrollment logic in `addMembersToClass` must check for existing membership before inserting. Use `INSERT ... ON CONFLICT DO NOTHING` or check with `isUserCourseMember` before inserting. This is already idempotent in the existing enrollment service.

- **Risk**: The `community_question.classId` column causes existing community queries to break if they don't filter by `classId IS NULL` for course-scoped questions.
  - **Mitigation**: Add `classId IS NULL` to all existing community query filters where `courseId` is used. The column is nullable so existing rows default to NULL and behavior is unchanged. Update `packages/db/src/queries/community/community.ts` alongside the schema migration.

- **Risk**: Removing a course from a class causes confusion: students are still enrolled in the course but it no longer appears in the class hub.
  - **Mitigation**: Show a confirmation dialog in the admin UI with the note: "Removing this course will not unenroll any students. They will still have access to it via My Learning." Use the `class.remove_course_note` translation key already specified.

- **Risk**: Org nav gets crowded with a new "Classes" top-level item.
  - **Mitigation**: Place "Classes" directly below "Courses" in the sidebar. Consider grouping them under a "Learning" section header if more items are added in future.
