# Course Templates PRD

## Purpose

Enable instructors to create reusable course blueprints (templates) that can be used to quickly spin up new courses with pre-built structure, content, and settings. Templates reduce repetitive setup work and help organizations standardize course quality.

## Problem Statement

Currently, the only way to reuse course content in ClassroomIO is the clone feature, which creates a full copy of a specific course. This has limitations:

- **No discoverability**: There is no way to browse reusable starting points when creating a course. Instructors must know which existing course to clone.
- **No separation of blueprint vs live course**: Cloned courses immediately become live courses with active status, mixing templates with real courses in the listing.
- **No selective content inclusion**: Clone copies everything — there is no way to include structure but exclude detailed content, or include exercises but exclude lesson notes.
- **No organizational template library**: Organizations cannot curate a set of approved course structures for their instructors to use.
- **`isTemplate` field is unused**: The `course` table already has an `isTemplate` boolean (defaults to `true`), but it is never meaningfully filtered on — every course has it set to `true`.

## Confirmed Decisions

1. **Templates are courses**: A template is a `course` row with `isTemplate = true` and `status = 'TEMPLATE'`. No new content tables are needed. The existing course editor is reused for building templates.
2. **Org-scoped**: Templates belong to an organization (via the existing `group` → `organizationId` relationship). Each org has its own template library.
3. **Built on clone infrastructure**: Creating a course from a template reuses the existing `cloneCourse()` service with modifications to mark the result as a real course (`isTemplate = false`).
4. **Templates are never published**: Templates do not appear in public course listings, student-facing pages, or enrollment flows. They are instructor-only blueprints.
5. **Non-destructive**: Deleting a template does not affect courses already created from it. Courses created from a template become fully independent copies.
6. **Selective content**: When saving an existing course as a template, instructors can choose which content types to include (structure, lesson content, exercises, settings).

## Current-State Audit

| Capability | Current State | Notes |
| --- | --- | --- |
| `isTemplate` field | Exists on `course` table, defaults to `true` | Never filtered on — effectively unused |
| Course cloning | Full deep-copy via `cloneCourse()` service | Copies sections, lessons, exercises, questions, options, translations |
| Clone UI | "Clone" option in course card dropdown menu | Component: `copy-course-modal.svelte` |
| Clone endpoint | `POST /course/:courseId/clone` | Accepts `title`, `description`, `slug`, `organizationId` |
| Course creation | Two-step modal: type selection → title/description | Component: `new-course-modal.svelte` |
| Exercise templates | Separate `exercise_template` table | Existing pattern for template-based creation at exercise level |
| Course listing filter | Queries `getOrgCourses()` with filters for title, tags, sort | No filter for `isTemplate` or `status = 'TEMPLATE'` |
| Course status | Text field, default `'ACTIVE'` | Used for soft delete (`'DELETED'`), no `'TEMPLATE'` value |

## Data Sources Checked

- `packages/db/src/schema.ts` — course table definition, `isTemplate` field
- `apps/api/src/services/course/clone.ts` — full clone implementation
- `apps/api/src/services/course/course.ts` — course creation flow
- `apps/api/src/routes/course/course.ts` — course routes including clone
- `apps/dashboard/src/lib/features/course/components/new-course-modal.svelte` — creation UI
- `apps/dashboard/src/lib/features/course/components/copy-course-modal.svelte` — clone UI
- `apps/dashboard/src/lib/features/course/api/course.svelte.ts` — frontend course API
- `apps/dashboard/src/lib/features/course/api/course-clone.svelte.ts` — frontend clone API
- `apps/dashboard/src/routes/org/[slug]/courses/+page.svelte` — course listing page
- `packages/db/src/queries/course/course.ts` — course queries
- `apps/dashboard/src/lib/features/ui/navigation/org-navigation.ts` — org navigation

## Product Goals

1. Instructors can save any existing course as a reusable template with selective content inclusion.
2. Instructors can create templates from scratch using the existing course editor.
3. When creating a new course, instructors can choose to start from a template instead of a blank course.
4. Organizations have a template library (tab on the courses page) where templates are managed.
5. Templates are cleanly separated from live courses in all listings and queries.
6. Courses created from templates are fully independent — no ongoing link or sync.
7. The existing course creation and clone flows remain unchanged for users who do not use templates.

## Non-Goals (v1)

- Platform-wide template marketplace (orgs sharing templates publicly).
- ClassroomIO-provided starter templates (curated by the platform team).
- AI-generated templates (e.g., "Generate a template for a 4-week React course").
- Template versioning or change tracking.
- Syncing updates from a template to courses already created from it.
- Template access control (e.g., restricting which instructors can use which templates).
- Template analytics beyond usage count.

## UX Flow

### Flow 1: Creating a Template from an Existing Course

**Entry points:**
- Course card dropdown menu → "Save as Template" (alongside existing "Clone" option)
- Course Settings page → "Save as Template" button

**Steps:**

1. User clicks "Save as Template."
2. A modal appears with:
   - **Template name** — pre-filled with `"{course title} Template"`, editable.
   - **Description** — pre-filled from course description, editable.
   - **Category** — optional free-text or select from existing categories (e.g., "Onboarding", "Compliance", "Technical").
   - **What to include** — checkboxes:
     - Sections & structure (always on, disabled)
     - Lesson content (notes, videos, documents) — default on
     - Exercises & quizzes — default on
     - Course settings (grading, certificates, metadata) — default on
     - Landing page content — default off
   - Info note: "Student data, submissions, and enrollments are never included."
3. User confirms → system clones the course into a new `course` row with `isTemplate = true`, `status = 'TEMPLATE'`, `isPublished = false`.
4. Success snackbar: "Template created" with a link to the templates tab.

### Flow 2: Creating a Template from Scratch

**Entry point:** Templates tab on the courses page → "Create Template" button.

**Steps:**

1. User clicks "Create Template."
2. Same two-step modal as course creation (type selection → title/description), but the resulting course is marked as a template.
3. Navigates to the course editor with a "Template" badge in the header.
4. User builds out the structure (sections, lessons, exercises) using the existing editor.
5. Template never appears in student-facing listings.

### Flow 3: Creating a Course from a Template

**Entry point:** Existing "Create Course" button on the courses page.

**Steps:**

1. User clicks "Create Course."
2. **Step 1 — Choose starting point** (replaces the current type selection step):
   - Two cards: **"Blank Course"** and **"From Template"**.
   - "Blank Course" proceeds to the existing flow (type → title/description).
   - "From Template" opens the template picker (step 1b).
3. **Step 1b — Template picker:**
   - Search bar to filter templates by name.
   - Category filter tabs (if categories exist).
   - Grid of template cards showing: name, description snippet, lesson count, exercise count, course type badge.
   - Each card has a "Preview" action that expands a panel showing the full section/lesson outline (read-only).
   - User selects a template and clicks "Use Template."
4. **Step 2 — Customize:**
   - Title — pre-filled from template, editable.
   - Description — pre-filled from template, editable.
   - Type — inherited from template, overridable (Live Class / Self-paced).
   - Subtitle: "Based on: {template name}".
5. User clicks "Create Course" → system clones the template into a real course (`isTemplate = false`, `status = 'ACTIVE'`) → navigates to the new course editor with all template content pre-populated.

### Flow 4: Managing Templates

**Entry point:** Courses page → "Templates" tab.

The courses page (`/org/[slug]/courses`) gets a tab bar: **[My Courses]** | **[Templates]**.

**Templates tab features:**
- Grid of template cards with: name, description, course type, lesson count, exercise count, usage count ("Used N times").
- Card dropdown menu: Edit, Duplicate, Delete.
- "Create Template" button.
- **Edit**: Opens the course editor with a "Template" badge. Same editing experience as a real course.
- **Duplicate**: Clones the template into another template.
- **Delete**: Soft-deletes the template (`status = 'DELETED'`). Confirmation dialog: "This will not affect courses already created from this template."

## Technical Design

### Data Model Changes

#### Modified Table: `course`

1. **Fix `isTemplate` default** from `true` to `false`. New courses should not be flagged as templates by default.
2. **Add `templateSourceId`** — nullable UUID FK to `course.id`. Tracks which template a course was created from. Used for usage count analytics ("12 courses created from this template").
3. **Add `templateCategory`** — nullable varchar. Optional category for organizing templates in the picker.

```typescript
// packages/db/src/schema.ts — additions to course table

isTemplate: boolean('is_template').default(false),  // changed from true to false
templateSourceId: uuid('template_source_id'),
templateCategory: varchar('template_category'),

// Add to constraints:
foreignKey({
  columns: [table.templateSourceId],
  foreignColumns: [table.id],
  name: 'course_template_source_id_fkey'
}).onDelete('set null')
```

No new tables needed. Templates are courses filtered by `isTemplate = true` and `status = 'TEMPLATE'`.

#### Backward Compatibility

Existing courses all have `isTemplate = true` due to the current default. A data migration will set `isTemplate = false` for all existing courses (they are real courses, not templates). The migration is safe because the field is not currently used in any queries or business logic.

### Migration

Create migration file: `packages/db/src/migrations/XXXX_add_course_templates.sql`

```sql
-- 1. Fix isTemplate for all existing courses (they are real courses, not templates)
UPDATE course SET is_template = false WHERE is_template = true;

-- 2. Change default for is_template to false
ALTER TABLE course ALTER COLUMN is_template SET DEFAULT false;

-- 3. Add template_source_id column
ALTER TABLE course ADD COLUMN template_source_id UUID REFERENCES course(id) ON DELETE SET NULL;

-- 4. Add template_category column
ALTER TABLE course ADD COLUMN template_category VARCHAR(255);

-- 5. Add index for template queries
CREATE INDEX idx_course_is_template ON course(is_template) WHERE is_template = true;

-- 6. Add index for template usage count
CREATE INDEX idx_course_template_source_id ON course(template_source_id) WHERE template_source_id IS NOT NULL;
```

### Validation Layer

File: `packages/utils/src/validation/course/template.ts`

```typescript
import { z } from 'zod';

export const ZSaveAsTemplate = z.object({
  title: z.string().min(1).max(255),
  description: z.string().min(1),
  category: z.string().max(100).optional(),
  includeLessonContent: z.boolean().default(true),
  includeExercises: z.boolean().default(true),
  includeSettings: z.boolean().default(true),
  includeLandingPage: z.boolean().default(false)
});

export type TSaveAsTemplate = z.infer<typeof ZSaveAsTemplate>;

export const ZCreateFromTemplate = z.object({
  templateId: z.string().uuid(),
  title: z.string().min(1),
  description: z.string().min(1),
  type: z.enum(['LIVE_CLASS', 'SELF_PACED']).optional(),
  organizationId: z.string().min(1)
});

export type TCreateFromTemplate = z.infer<typeof ZCreateFromTemplate>;

export const ZCreateTemplate = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  type: z.enum(['LIVE_CLASS', 'SELF_PACED']),
  category: z.string().max(100).optional(),
  organizationId: z.string().min(1)
});

export type TCreateTemplate = z.infer<typeof ZCreateTemplate>;

export const ZUpdateTemplate = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().min(1).optional(),
  category: z.string().max(100).nullable().optional()
});

export type TUpdateTemplate = z.infer<typeof ZUpdateTemplate>;
```

Export from: `packages/utils/src/validation/course/index.ts`

### Query Layer

File: `packages/db/src/queries/course/template.ts`

Functions:
- `getOrgTemplates(organizationId)` — list all templates for an org. Returns templates with lesson count, exercise count, and usage count (number of courses with `templateSourceId` pointing to this template). Ordered by `createdAt` desc.
- `getTemplateById(templateId)` — single template with full details and usage count.
- `getTemplateUsageCount(templateId)` — count of courses created from this template.

Export from: `packages/db/src/queries/course/index.ts`

### Service Layer

File: `apps/api/src/services/course/template.ts`

#### `saveAsTemplate(courseId, userId, data: TSaveAsTemplate)`
- Fetch the source course.
- Clone it via a modified `cloneCourse()` that respects the `include*` flags:
  - Always clone sections (structure).
  - Skip lesson content (notes, videos, documents) if `includeLessonContent = false` — create lessons with title and order only.
  - Skip exercises if `includeExercises = false`.
  - Skip metadata fields if `includeSettings = false`.
  - Skip landing page fields (bannerImage, metadata.videoUrl, etc.) if `includeLandingPage = false`.
- Set `isTemplate = true`, `status = 'TEMPLATE'`, `isPublished = false` on the new course.
- Set `templateCategory` if provided.
- Return the new template.

#### `createTemplate(userId, data: TCreateTemplate)`
- Create a new course with `isTemplate = true`, `status = 'TEMPLATE'`, `isPublished = false`.
- Follow the same transaction as `createCourse()` (create group → course → add creator as TUTOR).
- Set `templateCategory` if provided.
- Return the new template.

#### `createFromTemplate(templateId, userId, data: TCreateFromTemplate)`
- Fetch the template. Verify `isTemplate = true`.
- Clone via `cloneCourse()` with all content included.
- Override: `isTemplate = false`, `status = 'ACTIVE'`, `isPublished = false`.
- Override: `title`, `description`, `type` from user input.
- Set `templateSourceId = templateId` on the new course.
- Return the new course.

#### `deleteTemplate(templateId)`
- Verify the course is a template (`isTemplate = true`).
- Soft delete: set `status = 'DELETED'`.
- Does not affect courses with `templateSourceId = templateId`.

### Route Layer

File: `apps/api/src/routes/course/template.ts`

All routes nested under `/course/template` and require `authMiddleware` + admin/tutor role.

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/course/template` | List org templates (query param: `organizationId`) |
| `POST` | `/course/template` | Create blank template |
| `GET` | `/course/template/:templateId` | Get template details |
| `PUT` | `/course/template/:templateId` | Update template metadata |
| `DELETE` | `/course/template/:templateId` | Soft-delete template |
| `POST` | `/course/:courseId/save-as-template` | Save existing course as template |
| `POST` | `/course/template/:templateId/create-course` | Create new course from template |
| `POST` | `/course/template/:templateId/duplicate` | Duplicate a template |

#### Route Registration

```typescript
// apps/api/src/routes/course/index.ts
export * from './template';

// Registration in course router
.route('/template', templateRouter)
```

### Modified Existing Queries

#### `getOrgCourses(organizationId, ...)`
Add filter: `WHERE is_template = false AND status != 'TEMPLATE'` to exclude templates from the normal course listing. This ensures the "My Courses" tab only shows real courses.

### Error Codes

Add to `apps/api/src/utils/errors.ts`:

```typescript
TEMPLATE_NOT_FOUND: 'TEMPLATE_NOT_FOUND',
NOT_A_TEMPLATE: 'NOT_A_TEMPLATE',
```

### Build Verification

```bash
pnpm --filter @cio/utils build
pnpm --filter @cio/db build
pnpm --filter @cio/api build
```

## Frontend Plan (Dashboard)

### Request Types

File: `apps/dashboard/src/lib/features/course/utils/types.ts`

```typescript
export type ListTemplatesRequest = typeof classroomio.course.template.$get;
export type CreateTemplateRequest = typeof classroomio.course.template.$post;
export type GetTemplateRequest = typeof classroomio.course.template[':templateId']['$get'];
export type UpdateTemplateRequest = typeof classroomio.course.template[':templateId']['$put'];
export type DeleteTemplateRequest = typeof classroomio.course.template[':templateId']['$delete'];
export type SaveAsTemplateRequest = typeof classroomio.course[':courseId']['save-as-template']['$post'];
export type CreateFromTemplateRequest = typeof classroomio.course.template[':templateId']['create-course']['$post'];

export type ListTemplatesSuccess = Extract<InferResponseType<ListTemplatesRequest>, { success: true }>;
export type CourseTemplate = ListTemplatesSuccess['data'][number];
```

### API Class

File: `apps/dashboard/src/lib/features/course/api/template.svelte.ts`

```typescript
class TemplateApi extends BaseApiWithErrors {
  templates = $state<CourseTemplate[]>([]);
  loading = $state(false);

  async list(organizationId: string) { ... }
  async create(data: TCreateTemplate) { ... }
  async update(templateId: string, data: TUpdateTemplate) { ... }
  async remove(templateId: string) { ... }
  async saveAsTemplate(courseId: string, data: TSaveAsTemplate) { ... }
  async createFromTemplate(templateId: string, data: TCreateFromTemplate) { ... }
  async duplicate(templateId: string) { ... }
}
```

### New/Modified Components

#### `save-as-template-modal.svelte`
Location: `apps/dashboard/src/lib/features/course/components/save-as-template-modal.svelte`

Modal with: title, description, category, content inclusion checkboxes, confirm button.

#### `template-picker.svelte`
Location: `apps/dashboard/src/lib/features/course/components/template-picker.svelte`

Grid of template cards with search, category filters, preview panel, and "Use Template" action.

#### Modified: `new-course-modal.svelte`
Add a new initial step: "Blank Course" vs "From Template" card selection. "Blank" proceeds to existing flow. "From Template" shows `template-picker.svelte`, then proceeds to the customize step.

#### Modified: Course card dropdown
Add "Save as Template" option alongside existing "Clone" option.

#### Modified: Courses page
Add tab bar: **[My Courses]** | **[Templates]**. The templates tab renders the template management grid.

### Template Badge

When editing a template in the course editor, show a persistent badge in the header: a colored pill reading "Template" (e.g., `bg-blue-100 text-blue-800`). This makes it clear the user is editing a blueprint, not a live course.

### Routes

| Route | Page |
| --- | --- |
| `/org/[slug]/courses?tab=templates` | Templates tab on courses page (no new route file — tab state via query param) |

No new route files needed — the templates tab lives on the existing courses page, controlled by a `tab` query parameter.

### Translations

File: `apps/dashboard/src/lib/utils/translations/en.json`

Add keys under `course.templates`:

```json
{
  "course": {
    "templates": {
      "title": "Templates",
      "create": "Create Template",
      "save_as_template": "Save as Template",
      "from_template": "From Template",
      "blank_course": "Blank Course",
      "blank_course_description": "Start with an empty course",
      "from_template_description": "Choose from your template library",
      "choose_starting_point": "How would you like to start?",
      "choose_template": "Choose a template",
      "customize_course": "Customize your course",
      "based_on": "Based on: {name}",
      "use_template": "Use Template",
      "preview": "Preview",
      "template_name": "Template Name",
      "category": "Category",
      "what_to_include": "What to include",
      "sections_structure": "Sections & structure",
      "lesson_content": "Lesson content (notes, videos, documents)",
      "exercises_quizzes": "Exercises & quizzes",
      "course_settings": "Course settings (grading, certificates)",
      "landing_page_content": "Landing page content",
      "student_data_note": "Student data, submissions, and enrollments are never included.",
      "template_created": "Template created",
      "view_templates": "View in Templates",
      "template_badge": "Template",
      "used_times": "Used {count} times",
      "no_templates": "No templates yet. Save an existing course as a template or create one from scratch.",
      "delete_confirm": "This will not affect courses already created from this template.",
      "lessons_count": "{count} lessons",
      "exercises_count": "{count} exercises",
      "search_templates": "Search templates..."
    }
  }
}
```

### Frontend Build Verification

```bash
pnpm --filter @cio/dashboard build
```

## Implementation Order

### Phase 1: Database + Schema

1. Update `isTemplate` default from `true` to `false` in schema.
2. Add `templateSourceId` and `templateCategory` columns to `course` table in schema.
3. Create migration: fix existing data, add columns, add indexes.
4. Run `pnpm --filter @cio/db build`.

### Phase 2: Validation + Queries

1. Create `packages/utils/src/validation/course/template.ts` with all Zod schemas.
2. Export from `packages/utils/src/validation/course/index.ts`.
3. Create `packages/db/src/queries/course/template.ts` with query functions.
4. Update `getOrgCourses` to exclude templates.
5. Export from `packages/db/src/queries/course/index.ts`.
6. Run `pnpm --filter @cio/utils build` and `pnpm --filter @cio/db build`.

### Phase 3: Service + Routes

1. Create `apps/api/src/services/course/template.ts` with all service functions.
2. Refactor `cloneCourse()` to accept an options object for selective content cloning.
3. Create `apps/api/src/routes/course/template.ts` with all route handlers.
4. Register template router in course route index.
5. Add error codes to `apps/api/src/utils/errors.ts`.
6. Run `pnpm --filter @cio/api build`.

### Phase 4: Frontend — Template Management

1. Add request types to `apps/dashboard/src/lib/features/course/utils/types.ts`.
2. Create `apps/dashboard/src/lib/features/course/api/template.svelte.ts` API class.
3. Add translation keys to `en.json`.
4. Add "Templates" tab to courses page.
5. Create template card component for the grid.
6. Add "Save as Template" to course card dropdown and course settings.
7. Create `save-as-template-modal.svelte`.
8. Run `pnpm --filter @cio/dashboard build`.

### Phase 5: Frontend — Create from Template

1. Modify `new-course-modal.svelte` to add "Blank" vs "From Template" step.
2. Create `template-picker.svelte` with search, categories, preview.
3. Add customize step with template-prefilled fields.
4. Add "Template" badge to course editor header when editing a template.
5. Run `pnpm --filter @cio/dashboard build`.

## Acceptance Criteria

1. Instructor can save an existing course as a template with selective content inclusion.
2. Instructor can create a blank template from the templates tab.
3. Templates appear in the "Templates" tab and do not appear in the "My Courses" tab.
4. Instructor can create a new course from a template via the "Create Course" flow.
5. Courses created from templates are fully independent — editing the template does not affect the course and vice versa.
6. Template cards show lesson count, exercise count, and usage count.
7. Template picker supports search and category filtering.
8. Template preview shows the section/lesson outline in a read-only view.
9. Existing course creation flow ("Blank Course") is unchanged.
10. Existing clone functionality is unchanged.
11. Deleting a template does not affect courses created from it.
12. Templates are not visible to students in any listing or enrollment flow.
13. Editing a template uses the same course editor with a "Template" badge.
14. All existing courses have `isTemplate = false` after migration.
15. All new UI strings use translation keys (no hardcoded English).
16. `pnpm --filter @cio/api build` and `pnpm --filter @cio/dashboard build` pass after implementation.

## Risks and Mitigations

- **Risk**: Changing `isTemplate` default from `true` to `false` and bulk-updating existing courses could cause issues if any code relies on `isTemplate = true`.
  - **Mitigation**: Codebase search confirms `isTemplate` is never used in filtering or conditional logic — it is only copied during clone. The migration is safe.

- **Risk**: Refactoring `cloneCourse()` to support selective content could break existing clone functionality.
  - **Mitigation**: The refactor adds an optional `options` parameter. When not provided, all content is cloned (current behavior). Existing clone callers are not affected.

- **Risk**: Templates accumulate and become hard to find.
  - **Mitigation**: Category filtering and search are built into the template picker from v1. Categories can be extended to tags in a future iteration.

## Future Considerations

- **Platform starter templates**: ClassroomIO-provided templates shown in a separate "ClassroomIO Templates" section of the picker.
- **AI-generated templates**: "Generate with AI" as a third option in the course creation flow alongside "Blank" and "From Template."
- **Template marketplace**: Orgs opt-in to share templates publicly.
- **Template versioning**: Track changes and allow courses to "pull updates" from the source template.
- **Template access control**: Restrict which instructors can use or edit certain templates.
- **Cohort integration**: When course cohorts ship, templates could include default cohort configuration.
