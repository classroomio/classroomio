# Testing Guide: Course Content Refactor

## Prerequisites
- Ensure DB migrations are applied (including `0003_course_content_exercises.sql`).
- Run the backfill script if you have legacy exercises linked to lessons.

## Manual Test Checklist

### 1) Course Content Loading
1. Open a course in the dashboard.
2. Confirm the sidebar “Content” shows lessons and exercises together.
3. Toggle the new “Content grouping” setting in course settings and verify:
   - Grouped view shows sections with mixed lessons/exercises.
   - Linear view shows lessons/exercises in a single list.

### 2) Add Content Flow
1. Click the add (+) icon in the sidebar content section.
2. Repeat on the lessons page “Add content” button.
3. In both, verify the stepper lets you choose:
   - Section (creates a section).
   - Lesson (creates a lesson).
   - Exercise (creates an exercise).
4. If grouping is enabled, verify lesson/exercise requires selecting a section.

### 3) Lesson Routing
1. Navigate to a lesson via sidebar or lessons list.
2. Confirm URL is `/courses/:courseId/lessons/:lessonId`.
3. Ensure lesson content loads normally (materials, editing, completion).

### 4) Exercise Routing
1. Click an exercise from the sidebar or lessons list.
2. Confirm URL is `/courses/:courseId/exercises/:exerciseId`.
3. Verify:
   - Exercise title appears as the page title.
   - Save/preview/add-question actions are in `Page.Actions`.
   - No breadcrumbs are shown.

### 5) Submissions/People/LMS Links
1. From People page, click an exercise link → should open `/exercises/:exerciseId`.
2. From Submissions page, click an exercise link → should open `/exercises/:exerciseId`.
3. From LMS exercises page, links should open `/courses/:courseId/exercises/:exerciseId`.

## Optional: API Validation
- Create exercise with `courseId` + `sectionId` via API and confirm it appears in course response.
- Confirm exercises still work if `lessonId` is present (legacy).
