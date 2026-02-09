# Lessons List Page Ideation

## Purpose
Define the most useful, straight-to-the-point information to show in a non-grouped lessons list page (lessons + exercises), split by persona and course type, plus a data availability audit and implementation effort.

## Data Sources Checked
- `apps/dashboard/src/lib/features/course/pages/lessons.svelte`
- `apps/dashboard/src/lib/features/course/components/lesson/content-list.svelte`
- `apps/api/src/services/course/course.ts`
- `apps/api/src/services/course/utils.ts`
- `packages/db/src/queries/course/content.ts`
- `packages/db/src/schema.ts`

## Data Availability & Effort

Legend: ✅ available now, ⚠️ exists but not in list payload, ❌ missing data

### Teachers — Generic

| Field | Content Type (Lesson/Exercise) | Availability | Source / Notes | Effort | Visualization | Should Implement |
| --- | --- | --- | --- | --- | --- | --- |
| Title | Both | ✅ | `CourseContentItem.title` | Low | Primary title text | [x] |
| Item type icon | Both | ✅ | `CourseContentItem.type` | Low | Lesson/Exercise icon (no text) | [x] |
| Quick actions | Both | ✅ | UI-only | Low | Action buttons (Edit/Assign/Preview) | [x] |
| Lock status (locked/unlocked) | Both | ✅ | `isUnlocked` on lessons/exercises | Low | Lock/unlock icon (clickable) | [x] |
| Resources attached | Lesson | ✅ | `documentsCount` + `videosCount` in list payload | Medium | Icons with counts | [x] |
| Question count | Exercise | ✅ | `questionCount` in list payload | Medium–High | “5 questions” chip | [x] |

### Teachers — Live Class

| Field | Content Type (Lesson/Exercise) | Availability | Source / Notes | Effort | Visualization | Should Implement |
| --- | --- | --- | --- | --- | --- | --- |
| Scheduled date/time | Lesson | ✅ | `lessonAt` in list payload | Medium | Date/time chip + calendar icon | [x] |
| Join/host link | Lesson | ✅ | `callUrl` in list payload | Medium | Primary CTA button | [x] |
| Submissions count | Exercise | ⚠️ | Submissions endpoints exist, not per exercise | High | Count pill + “needs review” tag | [ ] |
| Attendance snapshot | Lesson | ❌ | Attendance has only upsert, no GET | High | Mini stat: “12/18 attended” | [ ] |

### Teachers — Self-Paced

| Field | Content Type (Lesson/Exercise) | Availability | Source / Notes | Effort | Visualization | Should Implement |
| --- | --- | --- | --- | --- | --- | --- |
| Status (Not started/Submitted/Graded) | Exercise | ⚠️ | Needs submission grading state in list payload | Medium–High | Status badge | [ ] |
| Due date / window | Exercise | ✅ | `dueBy` in list payload | Medium | Date chip | [x] |
| Due date / window | Lesson | ❌ | No lesson due date field | High | Date chip | [ ] |
| Submissions pending review | Exercise | ⚠️ | “for-grading” exists, not per exercise | High | Count + alert pill | [ ] |
| Last student activity | Both | ❌ | No per-item activity log | High | “Last activity: 2d ago” text | [ ] |

### Students — Generic

| Field | Content Type (Lesson/Exercise) | Availability | Source / Notes | Effort | Visualization | Should Implement |
| --- | --- | --- | --- | --- | --- | --- |
| Title | Both | ✅ | `CourseContentItem.title` | Low | Primary title text | [x] |
| Item type icon | Both | ✅ | `CourseContentItem.type` | Low | Lesson/Exercise icon (no text) | [x] |
| Lock status (locked/unlocked) | Both | ✅ | `isUnlocked` on lessons/exercises (read-only) | Low | Lock icon (disabled) | [x] |
| Lesson content (materials) | Lesson | ✅ | `documentsCount` + `videosCount` in list payload | Medium | Icons with counts | [x] |
| Completion state (Complete/Not complete) | Lesson | ✅ | `isComplete` | Low | Status badge | [x] |
| Submission state (Not started/Submitted/Graded) | Exercise | ⚠️ | Needs submission/grading state | Medium | Status badge | [ ] |
| Next step | Both | ✅ | Derive from `isComplete`/`isUnlocked` | Low | “Continue” button | [x] |

### Students — Live Class

| Field | Content Type (Lesson/Exercise) | Availability | Source / Notes | Effort | Visualization | Should Implement |
| --- | --- | --- | --- | --- | --- | --- |
| Scheduled date/time | Lesson | ✅ | `lessonAt` in list payload | Medium | Date/time chip | [x] |
| Join link/button | Lesson | ✅ | `callUrl` in list payload | Medium | Primary CTA button | [x] |
| Lesson content (materials) | Lesson | ✅ | `documentsCount` + `videosCount` in list payload | Medium | Icons with counts | [x] |
| Instructor name | Lesson | ⚠️ | `lesson.teacherId` exists; needs profile join | High | Secondary label | [ ] |
| Notes / prep checklist | Lesson | ✅ | `hasNoteContent` in list payload (derived from lesson note translations) | Medium | Note/`no-content` chip | [x] |

### Students — Self-Paced

| Field | Content Type (Lesson/Exercise) | Availability | Source / Notes | Effort | Visualization | Should Implement |
| --- | --- | --- | --- | --- | --- | --- |
| Due date | Exercise | ✅ | `dueBy` in list payload | Medium | Date chip | [x] |
| Due date | Lesson | ❌ | No lesson due date field | High | Date chip | [ ] |
| Estimated time | Both | ❌ | No field currently | High | “~30 min” text | [ ] |

## Implemented (2026-02-08)

### Field Contract Added to Course Content List Payload
- `lessonAt: string | null`
- `callUrl: string | null`
- `hasNoteContent: boolean | null`
- `videosCount: number | null`
- `documentsCount: number | null`
- `questionCount: number | null`
- `dueBy: string | null`

### UI Behavior Delivered
- Persona-first rendering for teachers/admin vs students in both list modes (grouped and non-grouped).
- Date rendering uses existing app formatter (`formatDate`); missing values are hidden.
- Lock toggle is teacher/admin-only; students get read-only lock state.
- Teacher/admin rows include schedule/join CTA for live class, resources count for lessons, question count and due date for exercises.
- Student rows include completion state (lesson), materials count (lesson), note/no-content status (lesson), schedule/join (live), due date (self-paced), and next-step CTA.

### Verification Run
- `pnpm --filter @cio/dashboard build` ✅
- `pnpm --filter @cio/api build` ✅

## Visualization Recommendations (Summary)
- Use a **two-line row**: title, then meta chips.
- Status and time should be **chips/badges** aligned right or under title.
- Progress should be implied by status; avoid redundant percent bars.
- Resources and requirements should be **icons with counts**.
- Primary action should be a **single CTA** (Join / Continue / Review).
- Separate lesson items from exercise items (distinct sections or tabs).

## Kanban Board (Ideation Phase)

| Ticket | Title | Todo | In Progress | Verification | Done |
| --- | --- | --- | --- | --- | --- |
| T1 | Teachers: show lesson/exercise title | [ ] | [ ] | [x] | [x] |
| T2 | Teachers: show lesson/exercise type icon | [ ] | [ ] | [x] | [x] |
| T3 | Teachers: show quick actions | [ ] | [ ] | [x] | [x] |
| T4 | Teachers: show lock/unlock status | [ ] | [ ] | [x] | [x] |
| T5 | Teachers: show lesson resources count | [ ] | [ ] | [x] | [x] |
| T6 | Teachers: show exercise question count | [ ] | [ ] | [x] | [x] |
| T7 | Teachers live class: show schedule time | [ ] | [ ] | [x] | [x] |
| T8 | Teachers live class: show join/host link | [ ] | [ ] | [x] | [x] |
| T9 | Teachers self-paced: show exercise due date | [ ] | [ ] | [x] | [x] |
| T10 | Students: show lesson/exercise title | [ ] | [ ] | [x] | [x] |
| T11 | Students: show lesson/exercise type icon | [ ] | [ ] | [x] | [x] |
| T12 | Students: show lock status (read-only) | [ ] | [ ] | [x] | [x] |
| T13 | Students: show lesson materials count | [ ] | [ ] | [x] | [x] |
| T14 | Students: show lesson completion state | [ ] | [ ] | [x] | [x] |
| T15 | Students: show next-step action | [ ] | [ ] | [x] | [x] |
| T16 | Students live class: show schedule time | [ ] | [ ] | [x] | [x] |
| T17 | Students live class: show join button | [ ] | [ ] | [x] | [x] |
| T18 | Students live class: show lesson materials | [ ] | [ ] | [x] | [x] |
| T19 | Students self-paced: show exercise due date | [ ] | [ ] | [x] | [x] |

## Ticket Breakdown (Backend/UI Split)

| Parent Ticket | Backend Ticket | UI Ticket |
| --- | --- | --- |
| T1 | T1-BE: ensure list payload includes title (existing) | T1-UI: render title in list row |
| T2 | T2-BE: ensure item type present (existing) | T2-UI: show lesson/exercise icon |
| T3 | T3-BE: none | T3-UI: render actions per role |
| T4 | T4-BE: ensure `isUnlocked` for lessons/exercises (existing) | T4-UI: render lock status (teacher toggles) |
| T5 | T5-BE: add documents/videos counts to list payload | T5-UI: render lesson resources count |
| T6 | T6-BE: add exercise question count to list payload | T6-UI: render question count chip |
| T7 | T7-BE: add `lessonAt` to list payload | T7-UI: render schedule date/time |
| T8 | T8-BE: add `callUrl` to list payload | T8-UI: render join/host CTA |
| T9 | T9-BE: add `dueBy` to list payload | T9-UI: render exercise due date chip |
| T10 | T10-BE: ensure list payload includes title (existing) | T10-UI: render title in list row |
| T11 | T11-BE: ensure item type present (existing) | T11-UI: show lesson/exercise icon |
| T12 | T12-BE: ensure `isUnlocked` for lessons/exercises (existing) | T12-UI: render lock icon (read-only) |
| T13 | T13-BE: add documents/videos counts to list payload | T13-UI: render lesson materials count |
| T14 | T14-BE: ensure `isComplete` for lessons (existing) | T14-UI: render completion badge |
| T15 | T15-BE: none | T15-UI: render next-step CTA |
| T16 | T16-BE: add `lessonAt` to list payload | T16-UI: render schedule date/time |
| T17 | T17-BE: add `callUrl` to list payload | T17-UI: render join CTA |
| T18 | T18-BE: add documents/videos counts to list payload | T18-UI: render lesson materials count |
| T19 | T19-BE: add `dueBy` to list payload | T19-UI: render exercise due date chip |
