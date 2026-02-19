# Course Content Search (Course Header)

## Purpose
Deliver a lightweight, high‑value search that lets learners and instructors quickly jump to lessons or exercises from the course header on `/courses/{id}`.

## Goal
Make it easy to find and navigate to course content without scrolling or expanding the sidebar tree.

## Non-Goals
- Full‑text search inside lesson/exercise content
- Cross‑course search
- Backend indexing or search services (v1 is client‑side only)

## Primary Users
- Students: jump to the next lesson or exercise
- Teachers/Admins: quickly locate content while managing a course

## Current State
- Search input exists in the course header but has no behavior.
- Course content (sections, lessons, exercises) is already loaded in memory.

## UX Proposal (v1)
- Input lives in the course header.
- Typing filters in‑memory course content by title.
- Results appear in a dropdown (popover) directly under the input.
- Clicking a result navigates to the lesson/exercise route.
- Each result shows:
  - Content title
  - Content type (Lesson/Exercise)
  - Optional section label for context
- Empty state: “No results found” message.

## Scope
### Included
- Search by lesson/exercise title
- Navigation to lesson/exercise
- Section label context (if grouped content)
- Use only `@cio/ui` components for input + dropdown/modal (no native inputs)
- Keyboard: Arrow up/down to move; Enter to open (optional in v1)

### Optional (Nice-to-have)
- Cmd/Ctrl+K to focus the search input
- Fuzzy matching (simple `includes` acceptable for v1)

## Data Sources Checked
- `apps/dashboard/src/lib/features/course/components/course-header.svelte`
- `apps/dashboard/src/lib/features/course/utils/content.ts`
- `apps/dashboard/src/lib/features/course/api/course.svelte.ts`

## Data Availability
Legend: ✅ available now, ⚠️ requires change, ❌ not available

| Field | Availability | Source / Notes |
| --- | --- | --- |
| Content title | ✅ | `courseApi.course.content` items
| Content type | ✅ | `courseApi.course.content` items
| Section title | ✅ | `courseApi.course.content.sections`
| Content route | ✅ | `getContentRoute` helper
| Content body text | ❌ | Not available on page load (requires new endpoint)

## Implementation Outline
1. Update search component to support `bind:value` and placeholder props.
2. Add a content‑flattening helper in `apps/dashboard/src/lib/features/course/utils`.
3. Wire `course-header.svelte` to compute filtered results and render a dropdown.
4. Add translations for placeholder and empty state.

## Success Criteria
- Users can find any lesson/exercise in under 3 seconds.
- Search input reliably navigates to the selected content.
- No noticeable performance issues on courses with 100+ items.

## Open Questions
- Should section titles be searchable, or only displayed as context?
- Should the dropdown appear on focus even before typing?
- Should results include exercises/lessons that are locked (students view)?
