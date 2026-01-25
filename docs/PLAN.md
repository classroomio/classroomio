# Course Content Refactor Plan

## Status Summary
- [x] Data model updates for exercises (`courseId`, `sectionId`, `order`) + backfill scripts
- [x] Backend query/service updates (core queries updated, needs final type alignment)
- [x] Content model utilities + `ContentType` enum + registry
- [x] Routing changes (new lesson/exercise routes added, remaining links verified)
- [x] Dashboard UI updates (sidebar + lessons list + add content flow wired)
- [x] Content creation stepper (modal + exercise stepper created, types aligned)
- [x] Exercise page structure updated to `Page` layout
- [x] Grouping toggle in settings (UI + metadata aligned)
- [x] Legacy exercise list code removed

## Implementation Summary (What was done)
- Added exercise `courseId`, `sectionId`, and `order` columns with migration and backfill script.
- Updated exercise/course queries to support course-level exercises with legacy lesson joins.
- Adjusted analytics/marks/submission queries to work without mandatory lesson linkage.
- Added `ContentType` enum, `ContentItem` model, and `CONTENT_DEFINITIONS` registry for future types.
- Rebuilt sidebar and lessons list to display mixed content (lessons + exercises) with icons.
- Added content creation modal + exercise stepper and wired add-content entry points.
- Created new exercise route (`/courses/[id]/exercises/[exerciseId]`) and new lesson route.
- Removed legacy lesson param route and exercise list components.
- Updated exercise page to use `Page` layout and moved actions into `Page.Action`.
- Added course settings toggle for content grouping and defaulted metadata.

## 1) Data model changes (exercises as course content)
- [x] Add `courseId` + `sectionId` + `order` to `exercise` in `packages/db/src/schema.ts`.
- [x] Keep `lessonId` nullable for backward compatibility.
- [x] Add migration and backfill script:
  - `packages/db/src/migrations/0003_course_content_exercises.sql`
  - `packages/db/src/scripts/backfill-exercise-course.ts`

## 2) Backend query/service updates
- [x] Update exercise queries to filter by `courseId` directly (optional `sectionId`).
- [x] Update `getCourseWithRelations` to include exercises (legacy lesson joins supported).
- [x] Adjust analytics/marks/submission queries for mixed exercises.
- [x] Extend exercise validation schemas for `sectionId`.
- [x] Finish type alignment for new exercise fields across API responses.

## 3) Content model + future-proofing
- [x] Add `ContentType` enum in `packages/utils/src/constants/content.ts`.
- [x] Add `ContentItem` and `CONTENT_DEFINITIONS` registry in `apps/dashboard/src/lib/features/course/utils/content.ts`.
- [x] Route helpers for content items.

## 4) Routing changes
- [x] Replace `/lessons/[...lessonParams]` with `/lessons/[lessonId]`.
  - Added `apps/dashboard/src/routes/courses/[id]/lessons/[lessonId]/*`.
  - Removed `apps/dashboard/src/routes/courses/[id]/lessons/[...lessonParams]`.
- [x] Add `/courses/[id]/exercises/[exerciseId]` route.
- [x] Update remaining links (people + submissions + LMS updated; verify any others).

## 5) Dashboard UI updates
- [x] Sidebar “Content” uses mixed content registry + icons.
- [x] Lessons list page now renders grouped or linear content.
- [x] Add “Add content” entry points (sidebar + lessons page).
- [x] Ensure course store/types expose `exercises` to avoid TS errors.

## 6) Content creation stepper
- [x] Add `content-create-modal` with type selection and section/lesson/exercise flows.
- [x] Add `exercise-create-stepper` based on old `new-exercise-modal`.
- [x] Align TypeScript types for `sectionId` in create payloads.

## 7) Exercise page structure
- [x] Remove breadcrumbs and use `Page.Header` / `Page.Action` / `Page.Body`.
- [x] Move save/add question controls into `Page.Action`.

## 8) Grouping toggle (course settings)
- [x] UI toggle in course settings with `isContentGroupingEnabled` metadata.
- [x] Fix type definitions for `settings` store and metadata typing.

## 9) Remove stale exercise list code
- [x] Removed legacy exercises list components + route usage.
- [x] Removed `exerciseApi.list` usage and related types.

## Remaining Implementation Notes (next agent)
- None. Optional: add non-English translations for the new content labels.
