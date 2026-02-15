# Lesson Page Edit Mode Ideation

## Purpose
Ensure that in lesson edit mode, teachers can edit the lesson title, lock/unlock the lesson, and delete the lesson directly from the lesson page.

## Data Sources Checked
- `apps/dashboard/src/lib/features/course/pages/lesson.svelte`
- `apps/dashboard/src/lib/features/course/components/lesson/delete-lesson-confirmation.svelte`
- `apps/dashboard/src/lib/features/course/components/lesson/store.ts`
- `apps/dashboard/src/lib/features/course/api/lesson.svelte.ts`
- `packages/db/src/schema.ts`

## Data Availability & Effort

Legend: ✅ available now, ⚠️ exists but not wired in UI, ❌ missing data

| Capability | Availability | Source / Notes | Effort | UI Placement | Should Implement |
| --- | --- | --- | --- | --- | --- |
| Edit lesson title | ⚠️ | `lessonApi.lesson.title` exists; lesson page does not edit title | Medium | Page header title (editable in edit mode) | [ ] |
| Lock / unlock lesson | ⚠️ | `lesson.isUnlocked` exists; update endpoint supports it | Medium | Header action toggle (teacher-only) | [ ] |
| Delete lesson | ⚠️ | `lessonApi.delete` + `DeleteLessonConfirmation` exists | Medium | Header action (trash icon + confirm) | [ ] |

## Kanban Board (Ideation Phase)

| Ticket | Title | Todo | In Progress | Verification | Done |
| --- | --- | --- | --- | --- | --- |
| T1 | Lesson edit: title inline editing | [ ] | [ ] | [ ] | [ ] |
| T2 | Lesson edit: lock/unlock toggle | [ ] | [ ] | [ ] | [ ] |
| T3 | Lesson edit: delete action + confirmation | [ ] | [ ] | [ ] | [ ] |

## Ticket Breakdown (Backend/UI Split)

| Parent Ticket | Backend Ticket | UI Ticket |
| --- | --- | --- |
| T1 | T1-BE: confirm update API accepts `title` (existing) | T1-UI: editable header title + save wiring |
| T2 | T2-BE: confirm update API accepts `isUnlocked` (existing) | T2-UI: lock toggle + state sync |
| T3 | T3-BE: confirm delete API route (existing) | T3-UI: add delete button + confirmation modal |
