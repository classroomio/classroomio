# Add content: created-success UX

Spec for the post-create step in the course **Add content** modal (`content-create-modal.svelte`). HTML prototype: [`prototype.html`](./prototype.html).

This is a design spec, not an implementation. Do not treat copy, layout, or branching here as already shipped.

## Problem

Teachers build a course outline in bursts: several sections, then lessons, then exercises. The modal should confirm the create and then **ask** what to do next. Today it does not.

| Type | What happens after create | Why it is wrong |
| --- | --- | --- |
| **Section** | Modal closes. Outline refreshes. No confirmation, no next action. | Silent success. The empty section is easy to miss, and the natural next step (put a lesson or exercise in it) requires reopening the modal. |
| **Lesson** | Modal closes and the app **always** routes to `/courses/:id/lessons/:lessonId`. | Forces the editor even when the teacher only wanted to scaffold titles. |
| **Exercise** | Modal closes and the app **always** routes to `/courses/:id/exercises/:exerciseId`. | Same forced navigation, including after “from template”. |

The target pattern is the document-upload success state: name the created item, confirm success, then offer **repeat**, **open**, or **later**.

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

### Create steps (unchanged by this spec)

1. **Type** (optional): radio cards + **Continue**.
2. **Details**
   - Section: required **Section Title**. Primary: **Create section**.
   - Lesson: required **Lesson title**, plus section select when grouping is on and the modal was not opened from a section. Primary: **Create lesson**.
   - Exercise: (a) how to create — From Scratch / Use a Template / Use AI (disabled), then (b) title or template grid. Primary: **Next**, then **Finish**.

Validation, loading on the primary button, Back, and create APIs stay as they are. This spec only changes **what happens after a successful create**.

## Goals

1. Every successful create stays in the modal and shows a success step.
2. Opening the new lesson or exercise is a choice, never an automatic navigation.
3. Creating another item of the same type does not close the modal or restart type selection.
4. Creating a section offers a way to add a lesson or exercise into **that** section without closing.
5. Closing (Later, X, Escape, overlay) leaves the teacher on the content outline. The new row is already in the list (refresh still runs before the success step).

## Non-goals

- Redesign type cards, title fields, or the exercise template picker.
- Add a section editor page. Sections still have no destination URL.
- Success toasts in addition to the modal. The success step **is** the confirmation.
- Bulk create, drag-and-drop, or AI exercise (still Coming soon).

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

Insert a **success** step in the same dialog after `lessonApi` / `exerciseApi` reports success and `refreshCourse` has finished. Do not close. Do not `goto`.

### Success layout

Keep the dialog chrome: title **Add content**, close **X**.

Replace the form with a single status panel (bordered, muted background):

- Type icon (section / lesson / exercise) with a small success badge.
- Created title, prominent.
- Green check + **{Type} has been created successfully!**

Footer, `justify-between`, matching the upload pattern:

| Side | Control | Style |
| --- | --- | --- |
| Left | Repeat | Outline |
| Right | Dismiss, then primary | Secondary, then solid primary |

Do not show Back on the success step. Create already committed; Back would be ambiguous.

## Actions by type

### Lesson

| Control | Label | Behavior |
| --- | --- | --- |
| Repeat | **Create another lesson** | Reset the lesson form (empty title, focus). Keep section context and skip type selection. |
| Dismiss | **Later** | Close. Stay on the content outline. |
| Primary | **Open now** | Close and `goto` `/courses/:courseId/lessons/:lessonId`. |

### Exercise

Same structure.

| Control | Label | Behavior |
| --- | --- | --- |
| Repeat | **Create another exercise** | Reset the exercise stepper to step 0 (how to create). Keep section context. |
| Dismiss | **Later** | Close. Stay on the outline. |
| Primary | **Open now** | Close and `goto` `/courses/:courseId/exercises/:exerciseId`. |

Resetting exercise to step 0 (not the last title/template screen) is intentional: the next exercise might be from scratch or from a template.

### Section

Sections have no editor URL (`openSectionEditor` only inline-renames on the outline). **Open now** does not apply.

| Control | Label | Behavior |
| --- | --- | --- |
| Repeat | **Create another section** | Reset the section title field. Stay in the section form (type picker still skipped). |
| Dismiss | **Later** | Close. Stay on the outline. The new section is visible. |
| Primary | **Add content** | Do not close. Switch to the Lesson / Exercise type picker with `sectionId` = the section just created (same as `openContentUnit`). Show “Adding to **{title}**”. |

**Add content** after a section is the highest-value action: the page **Add content** button with grouping on currently creates a section and stops, which is the worst of the three types today.

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
| `openContentUnit(sectionId)` + lesson | Another lesson in that section | Open the lesson |
| `openContentUnit(sectionId)` + exercise | Another exercise in that section | Open the exercise |
| `openDefault()` + lesson | Another lesson (section select still shown if grouping on) | Open the lesson |
| `openDefault()` + exercise | Another exercise | Open the exercise |
| Section success → **Add content** → lesson/exercise | Repeat that lesson/exercise in the new section | Open it |

## Errors, loading, keyboard

- Failed create: stay on the details step. Existing snackbar / field errors. No success step.
- Primary stays `loading` until the API **and** `refreshCourse` finish, then the success step renders.
- Escape / overlay / **X** on success = **Later**.
- Escape on type/details = close without creating (current).
- On success, move focus to the primary button (**Open now** or **Add content**).
- Announce the success sentence with `aria-live="polite"`.
- Enter on the success step activates the focused primary (browser default). Do not auto-navigate on a timeout.

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

Reuse the created title as the heading of the status panel; do not bake it into the success sentence.

## Implementation notes (for a follow-up PR)

Not in this PR.

1. Stop navigating inside `onCreated` in `content-create-modal.svelte`. Pass `{ id, title, type }` (section create should return the new section id; today `onCreated('')`).
2. Add a success view to the modal: `step === 'success'` or `phase: 'form' | 'success'`.
3. **Later** / close still uses `contentCreateStoreUtils.close()`.
4. **Open now** is the only path that `goto`s the lesson or exercise URL.
5. **Add content** after a section sets `selectedType` default Lesson, `sectionId` to the new section, `sectionFromContext = true`, `step` back to type selection with Section filtered out.
6. **Create another** calls the active stepper `reset()` and returns to the details step for that type.
7. No extra success snackbar.
8. All new strings in `en.json`, then `pnpm translate`.

## Prototype

Open [`prototype.html`](./prototype.html) in a browser.

- **Proposed** (default): success step, repeat / later / open (or add content).
- **Current**: section closes with no follow-up; lesson and exercise auto-route.
- Scenarios: page **Add content** (section), section **+**, full type picker, exercise from scratch.

The fake outline behind the modal is static chrome so the dialog matches production. Outcome toasts in the prototype stand in for `goto` / close.
