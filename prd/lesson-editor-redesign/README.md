# Lesson Editor Redesign PRD

## Prototype — visual and interaction reference

A clickable, high-fidelity prototype lives at [`prototypes/lesson-editor-redesign/index.html`](../../prototypes/lesson-editor-redesign/index.html) — a single self-contained HTML file, built on the real `@cio/ui` design tokens, that a developer or reviewer can open directly in a browser (`open prototypes/lesson-editor-redesign/index.html`, no build step required). It demonstrates every interaction described in this PRD: the unified canvas, the Settings slider, the Edit/Preview toggle, and the Add Video / Add Slide / Add Document flows, including the two states below that were added after hands-on review of this prototype and are now part of this PRD's scope:

* **Preview renders Video and Slides large and prominent** (a full-width player/viewer, not a compact edit-mode card), and hides the Video/Note/Slide/Document labels, so Preview reads as one continuous learner page rather than a labeled form.
* **Documents can be added as inline Note content or as a Downloadable Link** — a new proposed capability, not present in production today (see [Confirmed Decision 8](#8-documents-can-become-inline-note-content-or-stay-a-downloadable-link) and [Data Model and API](#data-model-and-api)).

When this document and the prototype disagree on a UI detail, the prototype wins.

## Purpose

Replace the current tab-based lesson editor with a unified authoring canvas.

Today, Video, Notes, Slides, Documents, and Settings are separate tabs, with only one panel visible at a time. The redesigned editor will let admins:

* Edit all existing lesson content from one canvas
* See content together in its configured order
* Preview the lesson from the in-app learner perspective without leaving the page
* Access lesson settings through a right-side slider

The editing philosophy is inspired by Notion's directness, where the content itself is the main editing surface.

This does **not** mean adopting Notion's visual design, colors, branding, block system, or drag-and-drop model. ClassroomIO's existing `@cio/ui` design system remains the visual language.

---

# Problem Statement

The current editor works, but its tab-based structure creates unnecessary friction.

### 1. Content is separated into tabs

In `apps/dashboard/src/lib/features/course/pages/lesson.svelte`, edit mode renders Video, Note, Slide, and Document through `UnderlineTabs`, with only one panel visible at a time (`lesson.svelte:569-625`).

This means an admin creating a lesson with multiple content types has to switch between separate panels instead of working through the lesson as one piece of content.

### 2. Settings replaces the content

`LessonSettingsTab` is currently another `UnderlineTabs.Content` using `SETTINGS_TAB_VALUE`.

Selecting Settings removes the lesson content from view.

Settings should be contextual to the lesson rather than treated as another content destination.

### 3. Preview requires leaving the editor

`viewAsStudent()` in `course-preview.ts` creates a login-link token and opens a new browser tab.

It is also course-scoped rather than specifically representing the lesson being edited.

The new editor needs an in-page Preview using the existing learner rendering path.

### 4. Learner renderers are not fully aligned

The authenticated in-app learner view renders Note, Slide, Video, and Document components vertically.

The public course renderer currently renders only one video and the note body through `toPublicLessonView()`.

Therefore, the new Preview must clearly represent the **authenticated in-app learner experience**, not the public course page.

Public renderer parity is outside this PRD.

### 5. Content ordering is managed at course level

`course.metadata.lessonTabsOrder` controls the order of Video, Note, Slide, and Document.

The ordering UI remains on the course-level Settings page.

This PRD does not move that control. The existing order simply determines the order of sections in the new canvas.

### 6. There is no dedicated mobile editing layout

The current tab strip horizontally scrolls on smaller screens.

A stacked canvas removes the need for content tabs and allows the lesson to naturally stack on mobile.

### 7. A document can only ever be a file attachment

Today a document is always rendered the same way to a learner: a file row with view/download actions (`document.svelte`, `AttachmentList`). There is no way to present a document's actual content as part of the lesson text itself — an admin who wants a PDF's content to read as part of the lesson has to manually retype it into the Note section, duplicating the content and creating two sources of truth.

---

# Confirmed Decisions

## 1. Unified editing, existing visual language

Use a content-first canvas inspired by Notion's directness.

Do not introduce Notion's:

* Colors
* Branding
* Iconography
* Block-drag system
* Free-form block canvas

Continue using `@cio/ui`.

## 2. No content or capability removal

The editor continues to support:

* Video
* Note
* Slide
* Document
* 6 video sources
* 10 slide platforms
* PDF viewer
* TipTap notes
* Note version history
* `lessonTabsOrder`
* Existing save/autosave behavior

This is an information architecture change, not a functionality cut.

## 3. Settings becomes a right-side slider

Settings is removed from content navigation.

Clicking Settings opens a right-side slider without replacing the lesson canvas.

The slider contains exactly the fields currently provided by `LessonSettingsTab`:

* Live-session call URL
* Live-session date
* Timezone
* Completion policy
* Video-watch threshold
* Per-video watch enforcement
* Comments toggle

No new settings are introduced.

Closing the slider must not navigate away, reload the lesson, reset scroll position, or lose edits.

## 4. Edit/Preview toggle instead of split view

Use an Edit/Preview toggle in the lesson header.

A persistent split view is not part of v1 because the codebase does not currently have a resizable/split-panel primitive.

Reuse the existing `mode=view` and `getViewModeComponents` learner rendering path.

A split view can be considered later if a reusable resizable-panel primitive is added to the design system.

## 5. Preview represents the in-app learner experience

Preview uses the existing authenticated learner rendering path.

It must be clearly labeled as the **in-app learner experience**.

It must not imply parity with the public/unauthenticated course renderer.

The existing `viewAsStudent()` flow remains available as a supplementary course/public check.

## 6. No data model or API changes for the canvas, Settings slider, or Preview

The unified canvas, the Settings slider, and the Edit/Preview toggle continue using the existing:

* `lesson`
* `lesson_language`
* `lesson_language_history`
* Lesson APIs
* Lesson-language APIs

No new database or API changes are expected for these three pieces. The one exception is the new Document capability in Decision 8 below, which does require a data-model addition — scoped and called out there, not silently introduced.

## 7. Scope

Only the single-lesson content area changes.

The following remain unchanged:

* `CourseSidebar`
* `CourseHeader`
* Course-level Settings
* Course-level `lessonTabsOrder`
* Other dashboard routes

## 8. Documents can become inline Note content or stay a Downloadable Link

This is a new proposed capability, not present in production today, added to this PRD after it was demonstrated in the prototype.

* When adding a document, the admin chooses one of two modes, presented as a simple choice at add time: **Add as Note** or **Add as Downloadable Link**. The choice can be changed later per document.
* **Add as Downloadable Link** is today's existing behavior: the document renders to the learner as a file row with a download/open action. No change here.
* **Add as Note** is new: the document's content appears directly in the lesson as readable text, styled like the existing Note content, instead of requiring the learner to open or download the original file.
* This PRD does **not** propose automatic text extraction (OCR, PDF parsing, etc.) from the uploaded file. "Add as Note" assumes the admin supplies or edits the text that will display — see [Data Model and API](#data-model-and-api) for what this requires and what remains an open implementation question.
* This applies only to newly-added or explicitly-reconfigured documents. Existing documents keep behaving exactly as they do today (Downloadable Link) unless an admin opts them into Note mode.

## 9. Existing Add Video / Add Slide flows are preserved exactly, only re-hosted

The current add-content pickers for Video and Slide are more capable than a simple form, and this PRD does not simplify them:

* **Add Video** already offers 6 sources (YouTube, Vimeo, Embed link, Upload, Library, Google Drive) in a tabbed modal.
* **Add Slide** already offers a two-pane picker: a searchable list of the 10 supported platforms (with real platform branding) on one side, and platform-specific step-by-step instructions, an embed-code field, a live "embed ready" preview, and a "how to embed" doc link on the other (`SlideEmbedPicker`). The "Add slide" action stays disabled until a valid embed is pasted.
* Removing a video or slide already goes through a confirmation-style menu (a "⋯" action opening a small menu with a single "Remove" item), not an instant delete.

The redesign re-hosts these exact flows inside the unified canvas — it does not rebuild, simplify, or restyle them.

---

# Current-State Audit

| Area               | Current implementation                                                        |
| ------------------ | ----------------------------------------------------------------------------- |
| Editor             | `lessons/[lessonId]`, edit mode via `?mode=edit`                              |
| Content navigation | `UnderlineTabs`: Video, Note, Slide, Document, Settings                       |
| Content order      | `course.metadata.lessonTabsOrder`                                             |
| Video              | Card grid + tabbed Add Video modal; 6 sources (YouTube, Vimeo, Embed, Upload, Library, Google Drive) |
| Slides             | Embed-only; two-pane picker (searchable platform list + steps + embed textarea + live preview validity); 10 platforms; remove via a "⋯" menu, not instant delete |
| Notes              | TipTap; per-locale content + version history                                  |
| Documents          | Upload + reorder; custom PDF viewer; always rendered as a file/download row — no inline-note mode exists today |
| Settings           | Full-panel tab                                                                |
| Preview            | `viewAsStudent()` opens a new tab                                             |
| In-app learner     | Existing Note/Slide/Video/Document components                                 |
| Public learner     | Separate renderer; currently video + note                                     |
| Autosave           | 2-second debounce + save queue                                                |
| Mobile             | Horizontal content-tab scrolling                                              |
| Existing UI        | `Page`, `Sheet`, `Slider/Drawer`, `Sidebar`, `UnderlineTabs`, `Empty`, `Chip` |

---

# Data Sources Checked

The redesign is based on the current implementation in:

* `apps/dashboard/src/lib/features/course/pages/lesson.svelte`
* `apps/dashboard/src/lib/features/course/components/lesson/constants.ts`
* `apps/dashboard/src/lib/features/course/components/lesson/lesson-settings-tab.svelte`
* `apps/dashboard/src/lib/features/course/components/lesson/{video,slide,note,document}/*.svelte`
* `apps/dashboard/src/lib/features/course/components/lesson/utils.ts`
* `apps/dashboard/src/lib/features/course/utils/course-preview.ts`
* `apps/dashboard/src/lib/features/course/utils/lesson-draft.ts`
* `apps/dashboard/src/lib/features/course/utils/public-course-mappers.ts`
* `apps/dashboard/src/lib/features/course/api/lesson.svelte.ts`
* `apps/dashboard/src/lib/features/course/pages/settings.svelte`
* `apps/dashboard/src/lib/features/course/reorder-material-tabs.svelte`
* `apps/dashboard/src/routes/(app)/courses/[id]/+layout.svelte`
* `apps/dashboard/src/routes/(app)/courses/[id]/lessons/[lessonId]/+page.svelte`
* `apps/dashboard/src/routes/(org-site)/course/[slug]/lesson/[itemSlug]/+page.svelte`
* `packages/ui/src/custom/public-course/lesson-view.svelte`
* `packages/ui/src/custom/underline-tabs/`
* `packages/ui/src/base/{page,sheet,drawer,sidebar}/`
* `packages/db/src/schema.ts`
* `packages/db/src/queries/lesson/lesson.ts`
* `apps/api/src/routes/course/lesson.ts`
* `apps/api/src/routes/course/lesson-language.ts`
* `apps/dashboard/src/lib/features/course/components/mobile/*.svelte`
* `apps/dashboard/src/lib/features/course/utils/mobile-bottom-nav.ts`
* `packages/ui/src/custom/slide-embed/slide-embed-picker.svelte`
* `packages/ui/src/custom/slide-embed/slide-embed-card.svelte`
* `packages/ui/src/custom/slide-embed/slide-platform-icon.svelte`
* `packages/utils/src/functions/slide-embed.ts`
* `apps/dashboard/src/lib/utils/translations/en.json` (`course.navItem.lessons.materials.tabs.slide.*` copy)

---

# Product Goals

1. Edit Video, Note, Slide, and Document content from one lesson canvas.
2. Preview the in-app learner experience without leaving the editor, with Video and Slides rendered at learner-facing size and prominence.
3. Open lesson settings without replacing the content being edited.
4. Preserve all existing content types and capabilities, including the full Add Video / Add Slide pickers exactly as they work today.
5. Continue using the existing ClassroomIO design system.
6. Let an admin present a document's content as part of the lesson text, not only as a downloadable file.

---

# Non-Goals

The following are outside v1:

* Public renderer parity
* Learner experience redesign
* Persistent editor/preview split view
* Free-form Notion-style block editing
* Moving `lessonTabsOrder` into the editor
* New video, slide, or document integrations
* Automatic text extraction from uploaded documents (OCR, PDF-to-text parsing, etc.) for the new "Add as Note" mode — the admin supplies the note text
* Course creation, enrollment, analytics, attendance, marks, submissions, certificates, compliance, or landing-page editing
* Changes to `CourseSidebar` or `CourseHeader`

---

# Functional Requirements

## 1. Unified Content Canvas

Replace the current `UnderlineTabs.Root` content area with one scrollable canvas.

Content sections render in the order defined by `course.metadata.lessonTabsOrder`.

Reuse/adapt `orderedTabs()` from `constants.ts`.

Only content types that currently contain content should render.

For example, a lesson containing Video, Note, and Document should show those three sections in the configured order, without an empty Slide section.

Existing components and flows must be reused:

* `AddVideoModal`
* `SlideEmbedPicker`
* TipTap `TextEditor`
* `AddDocumentModal`
* Existing Video/Slide/Note/Document components

The main change is how these components are hosted, not how they work.

Content tabs are removed. Scrolling becomes the normal way to move between sections.

---

## 2. Add Content

Add an **Add content** entry point.

It should show content types not currently present:

* Video
* Note
* Slide
* Document

Selecting a type opens its existing add flow.

After content is added, its section appears according to `lessonTabsOrder`.

Existing "add another" functionality remains unchanged.

Do not redesign the existing add flows.

---

## 3. Preview

Add an Edit/Preview toggle to the lesson header.

Preview uses `getViewModeComponents` and the existing authenticated learner rendering path.

It must:

* Be read-only
* Use the same content ordering as the learner experience
* Be clearly labeled **In-app learner experience**
* Stay on the same page
* Not open a new browser tab
* Render Video as a large, prominent player (full canvas width, learner-page proportions) instead of the compact edit-mode card
* Render Slides as a large, prominent viewer (full canvas width) instead of the compact edit-mode card
* Render each Document according to its configured mode: inline Note-styled text, or a simple "Open/Download document" link (see [Confirmed Decision 8](#8-documents-can-become-inline-note-content-or-stay-a-downloadable-link))
* Hide the Video / Note / Slide / Document section labels, so the lesson reads as one continuous page rather than a labeled form — the learner already knows what they're looking at from the content itself

Preview must not discard unsaved edits. Existing autosave continues to handle persistence.

`viewAsStudent()` remains available as a separate supplementary check.

---

## 4. Settings Slider

Remove Settings from content navigation.

Add a persistent Settings action to the lesson header.

Clicking Settings opens a right-side slider using the existing `@cio/ui` Sheet/Drawer primitives.

The slider contains the existing `LessonSettingsTab` fields:

### Live class

* Call URL
* Date
* Timezone

### Completion

* Completion policy
* Video-watch threshold
* Per-video watch enforcement

### Engagement

* Comments toggle

Existing validation and behavior remain unchanged.

The slider can be closed through:

* Close button
* Escape
* Overlay click

Closing it must not:

* Navigate away
* Reload the lesson
* Reset scroll position
* Lose edits

On smaller screens, it may become full-width.

---

## 5. Documents: Note or Downloadable Link

New capability (see [Confirmed Decision 8](#8-documents-can-become-inline-note-content-or-stay-a-downloadable-link)).

When adding a document, the admin sees a simple choice: **Add as Note** or **Add as Downloadable Link**. Each already-added document shows this same choice, so it can be changed at any time, not only at add time.

* **Downloadable Link** (default for existing documents): unchanged from today — a file row with view/download actions in edit mode, and a simple "Open/Download document" link in Preview.
* **Note**: in edit mode, the document keeps its existing file row (so the original file is never lost or hidden); in Preview, its content renders as Note-styled text directly in the lesson instead of the file row.

Switching modes must not delete or re-upload the underlying file — it only changes how the document is presented to the learner.

---

## 6. Saving

No changes to saving behavior.

Keep:

* 2-second debounced autosave
* Save queue
* Manual save behavior
* `localStorage` note draft recovery
* Saving/Saved status

Do not introduce another save system.

---

## 7. Existing Capabilities

The redesign must preserve:

* 6 video sources
* 10 slide platforms
* Document upload
* PDF viewer
* TipTap notes
* Per-locale notes
* Note version history
* Comments
* Live-session settings
* Completion policies
* Video-watch threshold
* Per-video watch enforcement
* Course-level `lessonTabsOrder`

Only the page arrangement changes.

---

# Information Architecture

### Current

`Video | Note | Slide | Document | Settings`

Each is treated as a separate destination.

### Proposed

Content becomes sections within one canvas:

`Video → Note → Slide → Document`

The actual order follows `lessonTabsOrder` and only existing content types are displayed.

Settings becomes a header action that opens the right-side slider.

| Content      | Discovery                   | Access                                                  |
| ------------ | --------------------------- | -------------------------------------------------------- |
| Video        | Canvas section when present | Existing video editor and tabbed Add Video modal          |
| Note         | Canvas section when present | Existing TipTap editor                                   |
| Slide        | Canvas section when present | Existing two-pane `SlideEmbedPicker`                      |
| Document     | Canvas section when present | Existing document manager, plus a Note/Downloadable Link choice per document |
| Missing type | Add content                 | Existing add flow                                        |
| Settings     | Header action                | Right-side slider                                        |

---

# User Flows

### Editing

Admin opens a lesson and sees all existing content sections in the configured order.

They edit directly within the sections.

Autosave continues using the existing save system.

### Adding content

Admin selects **Add content**, chooses a missing type, completes the existing add flow, and the new section appears in the configured position.

### Choosing how a document presents (new)

Admin adds a document, or opens an existing one already in the lesson, and picks **Add as Note** or **Add as Downloadable Link**. Switching to Preview immediately reflects the choice — inline text for Note, a link for Downloadable Link — without leaving the canvas.

### Settings

Admin selects Settings, the slider opens, they update a field, then close it and return to the same canvas position.

### Preview

Admin selects Preview and sees Video and Slides rendered large, Documents rendered per their configured mode, and no content-type labels — reviewing the **in-app learner experience** as one continuous page — then selects Edit to return to the authoring canvas.

---

# UI/UX Requirements

## Header

Keep the existing:

* Lesson title
* Lock/unlock
* Public slug
* Version history
* Save/status indicator

Add:

* Settings
* Edit/Preview

## Canvas

* Stacked content sections
* Order follows `lessonTabsOrder`
* Existing content components remain unchanged
* No horizontal content-tab navigation

## Add Content

* Only show missing content types
* Use existing add flows
* Use existing `Empty` pattern when the lesson has no content

## Preview

* Read-only
* Uses `getViewModeComponents`
* Clearly labeled as the in-app learner experience
* Video renders as a large, full-width player, not a compact card
* Slides render as a large, full-width viewer, not a compact card
* Documents render per their configured mode (inline Note text, or a Downloadable Link)
* Video / Note / Slide / Document labels are hidden — the page reads as one continuous lesson

## Documents

* Existing file row (upload, reorder, PDF viewer, download) is unchanged
* A Note/Downloadable Link choice is available per document, in edit mode
* Switching modes never deletes or re-uploads the file

## Settings

* Right-side slider
* Canvas remains visible on desktop
* Close button, Escape, and overlay click supported
* Full-width on smaller screens if needed

## Responsive

The content tab strip is removed.

The canvas stacks naturally on smaller screens.

The Settings slider should use an appropriate breakpoint for switching to full-width.

---

# Technical Design

## Reuse

Reuse the existing:

* `Note`
* `Slide`
* `Video`
* `Document`
* `AddVideoModal`
* `SlideEmbedPicker`, `SlideEmbedCard`, `SlidePlatformIcon` (search, platform list, per-platform steps, embed textarea, live preview validity, and the platform brand icons all come along unchanged)
* TipTap `TextEditor`
* `AddDocumentModal`
* `getViewModeComponents`
* `mode=view`
* `orderedTabs()`
* `course.metadata.lessonTabsOrder`
* `@cio/ui` Sheet/Drawer
* `Empty`
* `Chip`

Do not rebuild existing content functionality — this applies in full to `SlideEmbedPicker`, which already has more surface area (search, guided per-platform steps, live embed validation) than a simple "add" form.

## Likely Refactoring

### `lesson.svelte`

Replace the `UnderlineTabs.Root` content area around `569-625`.

Refactor:

* `mode`
* `currentTabValue`
* `setTabQueryParam`
* `toggleMode`
* Tab-specific navigation

The editor now needs:

* Edit/Preview state
* Canvas sections
* Canvas scrolling

### `lesson-settings-tab.svelte`

Re-host the existing settings fields inside the new slider.

Keep the existing field logic.

### `constants.ts`

The existing `MaterialTab` model may need to be adapted because content is no longer navigated through tabs.

Content presence can be derived from existing lesson data:

* Non-empty `videos`
* Non-empty `slides`
* Non-empty `documents`
* Existing note content

No new database field is required.

---

# Data Model and API

## Canvas, Settings, and Preview

No changes are expected.

Continue using:

* `lesson.videos`
* `lesson.slides`
* `lesson.documents`
* `lesson.note`
* `lesson_language`
* Existing lesson endpoints
* Existing lesson-language endpoints

Existing persistence continues through:

`PUT /course/:courseId/lesson/:lessonId`

and:

`apps/api/src/routes/course/lesson-language.ts`

## Documents: Note or Downloadable Link (new)

This is the one part of this PRD that requires a data-model addition, scoped narrowly to what Decision 8 needs:

* Each entry in `lesson.documents` needs a way to record its presentation mode (Note vs Downloadable Link) alongside its existing `type`, `name`, `link`, `size`, and `key`/`assetId` fields.
* "Note" mode needs somewhere to hold the text the admin wants displayed — this PRD does not prescribe whether that is a new field on the document entry itself, a reuse of the existing rich-text infrastructure, or another approach. That is an implementation decision to make against the actual `lesson.documents` jsonb shape in `packages/db/src/schema.ts`, not something to guess at here.
* No change is proposed to how the underlying file is uploaded, stored, or served — only to how its presence is presented to the learner.

If implementation discovers that any other part of this PRD requires a data-model change beyond this one, flag it before introducing it.

---

# Migration and Backward Compatibility

No migration or backfill is required.

Existing lessons should render using:

* Existing content
* Existing `lessonTabsOrder`
* Existing lesson data

The public course renderer is unchanged.

Existing learner experiences must continue working.

No lesson content should be lost, modified, or unintentionally reordered.

---

# Implementation Order

## 1. Canvas

Replace the tab content area with the stacked canvas.

Use `orderedTabs()` and `lessonTabsOrder`.

Verify all existing content components work when mounted together.

## 2. Add Content

Add the missing-content entry point and connect each option to its existing add flow.

## 3. Settings Slider

Remove Settings from the tab structure and re-host `LessonSettingsTab` inside the existing slider primitive.

Verify scroll position and editing context are preserved.

## 4. Preview

Add Edit/Preview.

Connect Preview to `getViewModeComponents`.

Add clear in-app learner labeling.

## 5. Responsive

Verify desktop and mobile layouts.

Determine the breakpoint for switching the Settings slider to full-width.

## 6. Verification

Run:

`pnpm --filter @cio/dashboard^... build && pnpm --filter @cio/dashboard build`

Manually verify:

* Existing published courses
* Existing lessons
* All four content types
* In-app learner rendering
* Public rendering
* Autosave
* Preview
* Settings
* Mobile behavior

---

# Acceptance Criteria

1. Video, Note, Slide, and Document can be viewed and edited in one canvas.
2. All existing content capabilities remain available.
3. Content tabs are removed.
4. Admins can Preview without opening another page or browser tab.
5. Preview uses the authenticated in-app learner rendering path.
6. Preview is clearly labeled as the in-app learner experience.
7. Settings opens in a right-side slider.
8. The lesson canvas remains visible while Settings is open on desktop.
9. Closing Settings preserves the editing context and scroll position.
10. All existing `LessonSettingsTab` fields remain functional.
11. Autosave, save status, save queue, and draft recovery continue working.
12. Existing published lessons continue to work in both in-app and public experiences.
13. Existing content is not lost, changed, or unintentionally reordered.
14. The editor works across existing desktop and mobile breakpoints without horizontal content tabs.
15. `viewAsStudent()` continues to work.
16. `lessonTabsOrder` continues to control content order.
17. Required dashboard builds pass.
18. In Preview, Video renders as a large, full-width player, not a compact edit-mode card.
19. In Preview, Slides render as a large, full-width viewer, not a compact edit-mode card.
20. In Preview, the Video / Note / Slide / Document section labels are not shown.
21. The existing Add Video (6 sources) and Add Slide (search, 10 platforms, guided steps, live embed validation) flows are re-hosted unchanged — no reduction in sources, platforms, or steps.
22. Each document can be set to **Add as Note** or **Add as Downloadable Link**; Preview reflects the selected mode.
23. Switching a document's mode does not delete, re-upload, or otherwise alter the underlying file.
24. Existing documents default to Downloadable Link and continue rendering exactly as they do today unless an admin explicitly changes the mode.

---

# Status

Draft, backed by a working prototype (`prototypes/lesson-editor-redesign/index.html`). This PRD defines the scope, information architecture, interaction model, existing behavior to preserve, and implementation direction for the lesson editor redesign.

**Core decision:** The lesson becomes one editable canvas instead of four separate content tabs. Settings becomes a right-side slider, and Preview becomes an in-page toggle using the existing learner rendering path, rendering Video and Slides at full learner-facing size and hiding content-type labels.

**Scope of data-model change:** none, except the new Documents Note/Downloadable Link capability (Decision 8), which needs a small, implementation-defined addition to how a document's presentation mode is stored.
