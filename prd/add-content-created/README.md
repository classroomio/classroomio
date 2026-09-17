# Add content created-success PRD

**Feature area:** Course → Content outline → Add content modal
**Status:** Draft for review
**Date:** 2026-08-16
**Related prototype:** [`prototypes/add-content-created/index.html`](../../prototypes/add-content-created/index.html)

This PRD specifies the post-create step in `content-create-modal.svelte`. It does not ship the modal change; that is a follow-up implementation PR.

## Purpose

After a teacher creates a section, lesson, or exercise from the Add content modal, confirm success in the same dialog and let them choose the next action: create another, open the new item, or stay on the outline.

## Problem

Teachers build a course outline in bursts: several sections, then lessons, then exercises. The modal should confirm the create and then **ask** what to do next. Today it does not.

| Type | What happens after create | Why it is wrong |
| --- | --- | --- |
| **Section** | Modal closes. Outline refreshes. No confirmation, no next action. | Silent success. The empty section is easy to miss, and putting a lesson or exercise in it requires reopening the modal. |
| **Lesson** | Modal closes and the app **always** routes to `/courses/:id/lessons/:lessonId`. | Forces the editor even when the teacher only wanted to scaffold titles. |
| **Exercise** | Modal closes and the app **always** routes to `/courses/:id/exercises/:exerciseId`. | Same forced navigation, including after “from template”. |

The target pattern is the document-upload success state: name the created item, confirm success, then offer **repeat**, **open**, or **later**.

## Goals

1. Every successful create stays in the modal and shows a success step.
2. Opening the new lesson or exercise is a choice, never an automatic navigation.
3. Creating another item of the same type does not close the modal or restart type selection.
4. Creating a section offers a way to add a lesson or exercise into **that** section without closing.
5. Closing (Later, X, Escape, overlay) leaves the teacher on the content outline. The new row is already in the list.

## Non-goals

- Redesign type cards, title fields, or the exercise template picker.
- Add a section editor page. Sections still have no destination URL.
- Success toasts in addition to the modal. The success step **is** the confirmation.
- Bulk create, drag-and-drop, or AI exercise (still Coming soon).
- Highlight/scroll animation for the new outline row (nice-to-have, not v1).

## Confirmed decisions

1. **Same dialog, extra step.** Do not open a second modal. After create succeeds, replace the form body with a success panel.
2. **Dialog title stays “Add content”.** The chrome is stable; the status panel names the created item.
3. **No Back on the success step.** Create is already committed. Back would be ambiguous (undo vs. edit vs. type picker).
4. **No success snackbar while this step is visible.** Today `lessonApi.create`, `createSection`, and `exerciseApi.create` fire a success snackbar. Suppress those for this modal flow so confirmation is not doubled. Keep error snackbars.
5. **Section primary is “Add content”, not “Open now”.** `openSectionEditor` only inline-renames on the outline. There is no section URL.
6. **Repeat stays on the same type** and keeps section context. It never returns to the three-type picker.
7. **Create another exercise resets to stepper step 0** (how to create), not the last title/template screen.
8. **Capture create IDs from the API response.** Do not infer the new section by title after `refreshCourse`. The section POST already returns `data` (`apps/api/src/routes/course/section.ts`); the dashboard `createSection` currently ignores the id.

## Current modal (as built)

Source of truth: `apps/dashboard/src/lib/features/course/components/content/`.

### Shell

- `Dialog` titled **Add content**, close **X** top-right, max width `xl`, body scrolls, footer holds Back + primary.
- No success step. `onCreated` either closes (section) or closes and `goto` (lesson / exercise).

### Entry points

| Trigger | Store helper | First screen |
| --- | --- | --- |
| Content page **Add content**, grouping **on** | `openSection()` | Section title form. Type picker skipped. `initialType = Section`. |
| Content page **Add content**, grouping **off** | `openDefault()` | Type picker: Lesson, Exercise (Section hidden). |
| Section row **+** | `openContentUnit(sectionId)` | Type picker: Lesson, Exercise. Section is locked (“Adding to **{section}**”). |
| Sidebar **+** with no section | `openSection()` or `openDefault()` | Same as the content page button. |

`CONTENT_OPTIONS` when grouping is on and there is no section context: **Section**, **Lesson**, **Exercise** (three radio cards).

If the teacher opened via `openSection()` and presses **Back**, production still shows the type picker (`step = 0`). That existing Back behavior is unchanged.

### Create steps (unchanged)

1. **Type** (optional): radio cards + **Continue**.
2. **Details**
   - Section: required **Section Title**. Primary: **Create section**.
   - Lesson: required **Lesson title**, plus section select when grouping is on and the modal was not opened from a section. Primary: **Create lesson**.
   - Exercise: (a) how to create — From Scratch / Use a Template / Use AI (disabled), then (b) title or template grid. Primary: **Next**, then **Finish**.

Validation, loading on the primary button, Back, and create APIs stay as they are. This PRD only changes **what happens after a successful create**.

## Proposed flow

```
[entry] → type? → details → (create API) → SUCCESS
                                    │
            ┌───────────────────────┼───────────────────────┐
            │                       │                       │
     Create another              Open now /              Later / X
     (reset details,             Add content             close modal
      same type +                (navigate or            stay on outline
      section)                   continue in modal)
```

Insert a **success** step in the same dialog after the create API reports success. Do not close. Do not `goto` until **Open now**.

`refreshCourse` should still run so the outline behind the modal is current, but success rendering must not depend on it. The created `{ id, title, type }` comes from the create response.

### Success layout

Keep the dialog chrome: title **Add content**, close **X**.

Replace the form with a single status panel (bordered, muted background):

- Type icon (section / lesson / exercise) with a small success badge.
- Created title, prominent. Truncate long titles with an ellipsis; full title on `title` / tooltip.
- Green check + **{Type} has been created successfully!**

Footer, `justify-between`, matching the upload pattern:

| Side | Control | Style |
| --- | --- | --- |
| Left | Repeat | Outline |
| Right | Dismiss, then primary | Secondary, then solid primary |

On narrow viewports the footer may wrap; keep Repeat first, then Later, then the primary.

## Actions by type

### Lesson

| Control | Label | Behavior |
| --- | --- | --- |
| Repeat | **Create another lesson** | Reset the lesson form (empty title, focus). Keep section context and skip type selection. |
| Dismiss | **Later** | Close. Stay on the content outline. |
| Primary | **Open now** | Close and `goto` `/courses/:courseId/lessons/:lessonId`. |

### Exercise

| Control | Label | Behavior |
| --- | --- | --- |
| Repeat | **Create another exercise** | Reset the exercise stepper to step 0 (how to create). Keep section context. |
| Dismiss | **Later** | Close. Stay on the outline. |
| Primary | **Open now** | Close and `goto` `/courses/:courseId/exercises/:exerciseId`. |

For template creates, the status title is the created exercise’s title from the API (not the template card label, if they differ).

### Section

| Control | Label | Behavior |
| --- | --- | --- |
| Repeat | **Create another section** | Reset the section title field. Stay in the section form (type picker still skipped). |
| Dismiss | **Later** | Close. Stay on the outline. The new section is visible. |
| Primary | **Add content** | Do not close. Switch to the Lesson / Exercise type picker with `sectionId` = the section just created (same as `openContentUnit`). Show “Adding to **{title}**”. |

**Add content** after a section is the highest-value action: the page **Add content** button with grouping on currently creates a section and stops.

## Repeat: what is preserved

| | Keep | Reset |
| --- | --- | --- |
| Content type | Yes | |
| Section id (from context or the picker) | Yes | |
| Type-selection skip (`openSection` / post-success repeat) | Yes | |
| Title / template / exercise method | | Yes |
| Success payload | | Yes |

Repeat never goes back to the three-type picker. To create a different type, use **Later** and open Add content again, or after a section use **Add content**.

## Entry-point matrix

| Opened via | After success, Repeat | After success, primary |
| --- | --- | --- |
| `openSection()` | Another section | **Add content** into that section |
| `openSection()` → Back → type picker → lesson | Another lesson (section select shown if grouping on and no locked section) | Open the lesson |
| `openContentUnit(sectionId)` + lesson | Another lesson in that section | Open the lesson |
| `openContentUnit(sectionId)` + exercise | Another exercise in that section | Open the exercise |
| `openDefault()` + lesson (grouping **off**) | Another lesson, no section picker | Open the lesson |
| `openDefault()` + exercise (grouping **off**) | Another exercise, no section picker | Open the exercise |
| Section success → **Add content** → lesson/exercise | Repeat that lesson/exercise in the new section | Open it |

`openDefault()` is grouping-off only. Do not treat it as “grouping on with a section dropdown”.

## Errors, loading, keyboard

- **Failed create:** stay on the details step. Existing error snackbars / field errors. No success step.
- **Submitting:** primary stays `loading`. Disable Repeat/Later/Open (they are not on screen yet). Disable the success-path dismissals until success renders.
- **Close while submitting:** allow Escape / X / overlay to abort waiting. If the in-flight create later succeeds, refresh the outline and do **not** reopen the modal or auto-navigate. Do not show a success step on a closed dialog.
- **`refreshCourse` fails after create succeeds:** still show the success step (id/title come from the create response). Open now still works. Later may show a stale outline until the next refresh; that is acceptable. Do not block success on refresh.
- **Escape / overlay / X on success** = Later.
- **Escape on type/details** = close without creating (current).
- **Focus on success:** move to the primary button (**Open now** or **Add content**).
- **Announce** the success sentence with `aria-live="polite"`.
- **Enter** on the success step activates the focused primary (browser default). Do not auto-navigate on a timeout.
- **Double submit:** ignore further primary clicks while `isSubmitting` is true (already true for steppers).

## Copy (en)

Proposed keys under `course.navItem.lessons`:

| Key | EN |
| --- | --- |
| `add_content_created_section` | Section has been created successfully! |
| `add_content_created_lesson` | Lesson has been created successfully! |
| `add_content_created_exercise` | Exercise has been created successfully! |
| `add_content_create_another_section` | Create another section |
| `add_content_create_another_lesson` | Create another lesson |
| `add_content_create_another_exercise` | Create another exercise |
| `add_content_open_now` | Open now |
| `add_content_later` | Later |
| `add_content_add_to_section` | Add content |

Reuse the created title as the heading of the status panel; do not bake it into the success sentence. All new UI copy goes through `en.json` and `pnpm translate`. No hardcoded strings in the Svelte modal.

## Accessibility

- Success panel is inside the existing dialog focus trap.
- Status sentence is `aria-live="polite"` (not `assertive` — the teacher just clicked Create).
- Icon-only close control already has an sr-only **Close** label; keep it.
- Repeat / Later / primary are real buttons with visible labels.
- Truncated titles remain available to assistive tech via the full text in the heading.

## Acceptance criteria

1. Creating a **section** from the page Add content button (grouping on) shows the success step with **Create another section**, **Later**, and **Add content**. The modal does not close by itself.
2. **Add content** after a section opens Lesson / Exercise type selection locked to that new section (“Adding to **{title}**”) without closing the modal.
3. Creating a **lesson** or **exercise** shows the success step with **Create another {type}**, **Later**, and **Open now**. The app does not route until Open now.
4. **Open now** closes the modal and navigates to the lesson or exercise editor URL for the created id.
5. **Later**, **X**, Escape, and overlay click close the modal and leave the teacher on the outline. The new item is present after a successful create.
6. **Create another** resets the form for the same type, keeps section context, and does not show the three-type picker.
7. **Create another exercise** returns to “how do you want to create your exercise?”.
8. Failed creates never show the success step; existing error handling remains.
9. Closing during an in-flight create does not later auto-navigate to the editor.
10. No success snackbar appears on top of the success step.
11. New copy is translated via `en.json` + `pnpm translate`.
12. Keyboard: focus lands on the primary success action; Enter activates it.

## Implementation notes (follow-up PR)

Not in this PR.

1. Stop navigating inside `onCreated` in `content-create-modal.svelte`. Pass `{ id, title, type }`.
2. Persist the created section id from `createSection`’s `response.data` (API already returns it). Today `onCreated('')` is not enough for **Add content**.
3. Add a success view: `step === 'success'` or `phase: 'form' | 'success'`.
4. **Later** / close still uses `contentCreateStoreUtils.close()`.
5. **Open now** is the only path that `goto`s the lesson or exercise URL.
6. **Add content** after a section sets `selectedType` default Lesson, `sectionId` to the new section, `sectionFromContext = true`, `step` back to type selection with Section filtered out.
7. **Create another** calls the active stepper `reset()` and returns to the details step for that type (exercise: internal step 0).
8. Suppress create success snackbars for this modal path; keep error snackbars.
9. If `refreshCourse` fails, still show success from the create payload.
10. All new strings in `en.json`, then `pnpm translate`.

## Open questions

1. After **Later**, should the new outline row get a short highlight? Deferred from v1; the prototype flashes a green outline as a suggestion only.
2. Should **Open now** be the focused control? Enter then navigates. Alternative: focus Later to make accidental Enter less disruptive. Current spec: focus the primary (Open now / Add content).

## Prototype

Open [`prototypes/add-content-created/index.html`](../../prototypes/add-content-created/index.html) in a browser.

- **Proposed** (default): success step, repeat / later / open (or add content).
- **Current**: section closes with no follow-up; lesson and exercise auto-route.
- Scenarios: page **Add content** (section), section **+**, full type picker, exercise from scratch.

The fake outline behind the modal is chrome so the dialog matches production. Outcome banners in the prototype stand in for `goto` / close. The HTML file is a design mock, not dashboard code.
