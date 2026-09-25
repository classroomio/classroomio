# Lesson Editor Redesign PRD

## Prototype — visual and interaction reference

A high-fidelity, clickable prototype lives in [`prototypes/lesson-editor-redesign/`](../../prototypes/lesson-editor-redesign/), built on ClassroomIO's real design tokens and component recipes (`app-theme.css` mirrors `packages/ui/src/index.css`; layout/markup mirrors the actual `lesson.svelte`, `lesson-settings-tab.svelte`, `Sheet`/`Drawer`, `Field`, video/slide/document card, and `Empty` components). When this document and the prototype disagree on a UI detail, the prototype wins.

Start here: `prototypes/lesson-editor-redesign/index.html`

| State | File |
| --- | --- |
| Editor — Video + Note + Slide, Document missing (Add content) | `editor.html` |
| Editor — Video + Note only | `editor.html?content=video-note` |
| Settings slider closed / open | `editor.html` / `editor.html?panel=settings` |
| Edit state / Preview state | `editor.html` / `editor.html?mode=preview` |
| Empty lesson + Add content interaction | `empty-lesson.html` |
| Mobile editor / mobile settings slider | `mobile.html` / `mobile.html?panel=settings` |

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

## 6. No data model or API changes

Continue using the existing:

* `lesson`
* `lesson_language`
* `lesson_language_history`
* Lesson APIs
* Lesson-language APIs

No new database or API changes are expected.

If implementation discovers that a new data-model field is required, it should be flagged before being introduced.

## 7. Scope

Only the single-lesson content area changes.

The following remain unchanged:

* `CourseSidebar`
* `CourseHeader`
* Course-level Settings
* Course-level `lessonTabsOrder`
* Other dashboard routes

---

# Current-State Audit

| Area               | Current implementation                                                        |
| ------------------ | ----------------------------------------------------------------------------- |
| Editor             | `lessons/[lessonId]`, edit mode via `?mode=edit`                              |
| Content navigation | `UnderlineTabs`: Video, Note, Slide, Document, Settings                       |
| Content order      | `course.metadata.lessonTabsOrder`                                             |
| Video              | Card grid + Add Video modal; 6 sources                                        |
| Slides             | Embed-only; 10 platforms                                                      |
| Notes              | TipTap; per-locale content + version history                                  |
| Documents          | Upload + reorder; custom PDF viewer                                           |
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

---

# Product Goals

1. Edit Video, Note, Slide, and Document content from one lesson canvas.
2. Preview the in-app learner experience without leaving the editor.
3. Open lesson settings without replacing the content being edited.
4. Preserve all existing content types and capabilities.
5. Continue using the existing ClassroomIO design system.

---

# Non-Goals

The following are outside v1:

* Public renderer parity
* Learner experience redesign
* Persistent editor/preview split view
* Free-form Notion-style block editing
* Moving `lessonTabsOrder` into the editor
* New video, slide, or document integrations
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

## 5. Saving

No changes to saving behavior.

Keep:

* 2-second debounced autosave
* Save queue
* Manual save behavior
* `localStorage` note draft recovery
* Saving/Saved status

Do not introduce another save system.

---

## 6. Existing Capabilities

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

| Content      | Discovery                   | Access                       |
| ------------ | --------------------------- | ---------------------------- |
| Video        | Canvas section when present | Existing video editor        |
| Note         | Canvas section when present | Existing TipTap editor       |
| Slide        | Canvas section when present | Existing slide picker/editor |
| Document     | Canvas section when present | Existing document manager    |
| Missing type | Add content                 | Existing add flow            |
| Settings     | Header action               | Right-side slider            |

---

# User Flows

### Editing

Admin opens a lesson and sees all existing content sections in the configured order.

They edit directly within the sections.

Autosave continues using the existing save system.

### Adding content

Admin selects **Add content**, chooses a missing type, completes the existing add flow, and the new section appears in the configured position.

### Settings

Admin selects Settings, the slider opens, they update a field, then close it and return to the same canvas position.

### Preview

Admin selects Preview, reviews the **in-app learner experience**, then selects Edit to return to the authoring canvas.

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
* `SlideEmbedPicker`
* TipTap `TextEditor`
* `AddDocumentModal`
* `getViewModeComponents`
* `mode=view`
* `orderedTabs()`
* `course.metadata.lessonTabsOrder`
* `@cio/ui` Sheet/Drawer
* `Empty`
* `Chip`

Do not rebuild existing content functionality.

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

If implementation discovers that a data-model change is required, flag it before introducing it.

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

---

# Status

This PRD defines the scope, information architecture, interaction model, existing behavior to preserve, and implementation direction for the lesson editor redesign.

**Core decision:** The lesson becomes one editable canvas instead of four separate content tabs. Settings becomes a right-side slider, and Preview becomes an in-page toggle using the existing learner rendering path.

No content capability or data model is being changed.
