# Lesson Editor Redesign PRD

## Prototype — visual and interaction reference

A clickable, high-fidelity prototype lives at [`prototypes/lesson-editor-redesign/index.html`](../../prototypes/lesson-editor-redesign/index.html) — a single self-contained HTML file, built on the real `@cio/ui` design tokens, that a developer or reviewer can open directly in a browser (`open prototypes/lesson-editor-redesign/index.html`, no build step required). It demonstrates every interaction described in this PRD. The list below is the plain-English summary of what the prototype shows, and all of it is in this PRD's scope:

* **One canvas instead of tabs.** The lesson is an ordered list of content blocks, not one section per type. An admin can add any number of blocks, of any type, in any order, interleaved freely (see [Confirmed Decision 2](#2-the-canvas-is-an-ordered-list-of-blocks-not-one-section-per-type)).
* **Ten block types.** Note, Video, Slides, Document, and Image, plus five interactive blocks: **Chart, Flashcards, Tabs, Multiple Choice, and Process** (see [Confirmed Decisions 3 and 11](#11-five-interactive-blocks-chart-flashcards-tabs-multiple-choice-process)).
* **Three ways to add content**, all offering the same choices (see [Confirmed Decision 12](#12-three-ways-to-add-content)):
  * the **empty-lesson card** ("What goes in this lesson?", a 5×2 grid of block tiles) with **Ask AI** docked at the bottom where the floating nav sits;
  * the **floating nav** at the bottom of the editor (Ask AI plus the ten types), which appends to the end of the lesson;
  * the **per-gap "+"** between any two blocks, which opens a compact version of the same tile grid at that exact spot.
* **Ask AI opens a chat panel on the right**, like the production assistant. It drafts a Note the admin inserts into the lesson with one click (see [Confirmed Decision 4](#4-an-ai-assistant-can-draft-a-note-block)).
* **Adding Video, Slides, Document, or Image inserts a real, fully-rendered example immediately** — not a blank form — which the admin keeps, edits in place, or replaces via "Change …". The prototype's specific examples (one particular YouTube video, one particular stock photo) are illustrative only, not a literal product requirement (see [Confirmed Decision 10](#10-existing-add-video--add-slide-flows-are-preserved-exactly-only-re-hosted)).
* **Block actions.** Blocks can be reordered by drag handle or move up/down controls and removed from a per-block menu. Each block shows a small, quiet type label in Edit.
* **Notes support callout styles** (Info, Tip, Important, Warning, Highlight) in addition to plain text.
* **Settings is a right-side slider**, including a persisted per-lesson reading-density setting (Compact / Comfortable / Spacious).
* **Preview is one continuous learner page.** Video and Slides render large, every block's type label is hidden, and interactive blocks work the way a learner would use them (flip a card, pick a tab, check an answer, step through a process).
* **A scroll-position indicator** — one dot per block, inside the canvas column's left edge — shows where the admin is in a long lesson and jumps to any block on click; Preview shows the equivalent as a continuous progress fill. Hovering (or focusing) a dot shows a small, blue (`--primary`) tooltip with that block's own content-type icon and title, read live from the block itself.

When this document and the prototype disagree on a UI detail, the prototype wins.

## Purpose

Replace the current tab-based lesson editor with a unified authoring canvas.

Today, Video, Notes, Slides, Documents, and Settings are separate tabs, with only one panel visible at a time. The redesigned editor will let admins:

* Edit all existing lesson content from one canvas
* Add, reorder, and remove any number of content blocks — of any of ten types, in any order — without being limited to one section per type
* See content together in the order they actually arranged it
* Preview the lesson from the in-app learner perspective without leaving the page
* Access lesson settings through a right-side slider

The editing philosophy is inspired by Notion's directness, where the content itself is the main editing surface.

This does **not** mean adopting Notion's visual design, colors, branding, or free-form block system. ClassroomIO's existing `@cio/ui` design system remains the visual language, and block types stay fixed to the ten this PRD defines — admins choose from Note, Video, Slides, Document, Image, Chart, Flashcards, Tabs, Multiple Choice, and Process, not an open-ended block palette.

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

### 5. Content ordering is hard-coded to one slot per type, at course level

`course.metadata.lessonTabsOrder` orders exactly four fixed slots — Video, Note, Slide, Document — and that order applies to every lesson in the course.

An earlier version of this PRD proposed leaving that control untouched and simply following its existing order inside the new canvas. That is no longer sufficient: the canvas this PRD now describes lets an admin add any number of blocks of any type, interleaved in any sequence, per lesson (see [Confirmed Decision 2](#2-the-canvas-is-an-ordered-list-of-blocks-not-one-section-per-type)). A single course-wide, one-slot-per-type array cannot express two Note blocks separated by a Video, or a lesson with three Images and no Slide. Content order must become a **per-lesson** property. What happens to the existing course-level reorder control (`reorder-material-tabs.svelte`) for lessons that use the new canvas is an implementation decision — see [Data Model and API](#data-model-and-api) — not something to guess at here.

### 6. There is no dedicated mobile editing layout

The current tab strip horizontally scrolls on smaller screens.

A stacked canvas removes the need for content tabs and allows the lesson to naturally stack on mobile.

### 7. An admin can only ever have one of each content type

Today's model treats Video, Note, Slide, and Document as four fixed destinations, each holding one thing. There is also no way to author interactive content (a chart, flashcards, a tabbed section, a quiz question, a step-by-step process) inside a lesson. An admin who wants two videos with a note in between, or three reference images in a row, has no way to express that — the editor has no concept of ordering or repeating individual pieces of content, only of switching between four panels.

---

# Confirmed Decisions

## 1. Unified editing, existing visual language

Use a content-first canvas inspired by Notion's directness.

Do not introduce Notion's:

* Colors
* Branding
* Iconography
* Free-form block canvas (block types stay fixed to the ten this PRD defines)

Continue using `@cio/ui`.

## 2. The canvas is an ordered list of blocks, not one section per type

The canvas holds an ordered sequence of content blocks. Each block is one of: Note, Video, Slide, Document, Image, Chart, Flashcards, Tabs, Multiple Choice, Process.

* Any number of blocks of the same type is allowed (two Notes, three Images, two Charts, etc.).
* Blocks can appear in any order the admin chooses, not a fixed Video → Note → Slide → Document arrangement, and interactive blocks can sit anywhere among them.
* A block can be inserted at the end of the lesson, or precisely between any two existing blocks.
* Blocks can be reordered after the fact, by:
  * Dragging a block by its drag handle to a new position, or
  * Using explicit "move up" / "move down" controls in the block's own menu.
* A block is removed from that same per-block menu ("Remove block"), not an instant delete.

This replaces the one-section-per-type model and supersedes `course.metadata.lessonTabsOrder` as the mechanism for ordering content within a lesson — see [Problem Statement #5](#5-content-ordering-is-hard-coded-to-one-slot-per-type-at-course-level) and [Data Model and API](#data-model-and-api).

## 3. Image becomes a fifth content type

Image joins Video, Note, Slide, and Document as a first-class block type.

* Added by uploading an image file (drag-and-drop or click-to-browse); no stock-photo library or other image source is in scope for v1.
* Each Image block has its own settings: **Alt text** (for accessibility) and **Fit** — Fill (crop to fit its frame) or Fit (show the whole image, letterboxed if needed).
* Replacing an image is a distinct action ("Change image") from editing its alt text/fit (opened via a small on-image toolbar).
* No existing component renders Image today — this is new UI and, unlike Video/Slide/Document, has no existing add/edit modal to re-host.

## 4. An AI assistant can draft a Note block

An admin can describe what part of the lesson should cover, in a chat message, and get a draft Note back to insert and edit — not a finished, unreviewed piece of content.

* **Ask AI opens a chat panel docked on the right edge**, the same way the production assistant works. It does not open a modal dialog. The panel pushes the lesson over instead of covering it, so the admin can see where a draft will land.
* The panel opens from every add-content entry point: the "Ask AI" pill in the empty-lesson card and floating nav, the "Ask AI instead" row in the per-gap popover, and the `⌘ I` shortcut shown on those controls (the prototype shows the shortcut as a label only; wiring it matches production behavior).
* The panel starts with a short greeting and a few suggested prompts. The admin types a message (Enter sends, Shift+Enter adds a line) or taps a suggestion. The assistant replies with a drafted Note and an **Insert into lesson** button.
* Insert adds an ordinary, fully editable Note block, at the gap the admin opened Ask AI from, or at the end of the lesson when it was opened from the empty state or floating nav. The panel stays open so the admin can ask for another draft. From that point on the block behaves exactly like any other Note — there is no separate "AI block" type and no indicator in Preview that a Note started from a prompt.
* The panel closes with its close button or Escape. On narrow screens it covers the full width.
* The admin's prompt itself is not proposed to be stored or shown again after the session.
* The prototype's replies are canned placeholder text. Which model/provider is used, streaming, chat history, and how generation cost, rate limits, and content moderation are handled are implementation decisions — see [Data Model and API](#data-model-and-api).

## 5. Settings becomes a right-side slider

Settings is removed from content navigation.

Clicking Settings opens a right-side slider without replacing the lesson canvas.

The slider contains exactly the fields currently provided by `LessonSettingsTab`, matching its existing conditional behavior — nothing is shown unconditionally that isn't unconditional today:

* **Live class fields** (call URL, date, timezone) — shown only when the course is a live-class-type course (`courseApi.course?.type === 'LIVE_CLASS'`). Most lessons are not live-class lessons and will not see this section at all, exactly as today.
* **Progression** — a single "Completion rule" field (Manual / Video watch / None). Choosing "Video watch" reveals the video-watch threshold and the per-video "must be watched" checklist; any other choice keeps them hidden. This matches today's conditional reveal exactly — nothing new.
* **Lesson comments** — the existing comments toggle.
* **Reading density** (new) — see [Confirmed Decision 7](#7-preview-represents-the-in-app-learner-experience).

No other new settings are introduced.

Closing the slider must not navigate away, reload the lesson, reset scroll position, or lose edits.

## 6. Edit/Preview toggle instead of split view

Use an Edit/Preview toggle in the lesson header.

A persistent split view is not part of v1 because the codebase does not currently have a resizable/split-panel primitive.

Reuse the existing `mode=view` and `getViewModeComponents` learner rendering path.

A split view can be considered later if a reusable resizable-panel primitive is added to the design system.

## 7. Preview represents the in-app learner experience

Preview uses the existing authenticated learner rendering path.

It must be clearly labeled as the **in-app learner experience**.

It must not imply parity with the public/unauthenticated course renderer.

The existing `viewAsStudent()` flow remains available as a supplementary course/public check.

Preview also offers a reading-density control (Compact / Comfortable / Spacious) that changes the vertical spacing between blocks wherever the lesson is rendered for viewing — the admin's own Preview and the real in-app learner view alike. Unlike the earlier draft of this PRD, this is now a **persisted, per-lesson setting**: the admin sets it once, from the Settings slider (alongside Progression and Lesson comments), and it applies for every subsequent viewer until changed — it is not a per-session, forgotten-on-reload preference. It has no effect on the Edit canvas itself, which keeps its own fixed block spacing regardless of this setting.

## 8. The ordered block list is a necessary data-model change

An earlier version of this PRD stated that the canvas, Settings slider, and Preview would require no data-model or API changes. That held only for a one-section-per-type canvas. It no longer holds: representing an arbitrary, per-lesson, ordered sequence of Video/Note/Slide/Document/Image blocks — including repeats — is a real change to how lesson content is structured, not just how it's hosted.

The Settings slider and Preview's rendering path still need no changes beyond consuming the new ordered content. The one necessary addition is the ordered block list itself, plus the new Image type and the AI-drafting entry point — all scoped in [Data Model and API](#data-model-and-api), not prescribed in full here.

## 9. Scope

Only the single-lesson content area changes.

The following remain unchanged:

* `CourseSidebar`
* `CourseHeader`
* Course-level Settings
* Other dashboard routes

## 10. Existing Add Video / Add Slide flows are preserved exactly, only re-hosted

The current add-content pickers for Video and Slide are more capable than a simple form, and this PRD does not simplify them:

* **Add Video** already offers 6 sources (YouTube, Vimeo, Embed link, Upload, Library, Google Drive) in a tabbed modal.
* **Add Slide** already offers a two-pane picker: a searchable list of the 10 supported platforms (with real platform branding) on one side, and platform-specific step-by-step instructions, an embed-code field, a live "embed ready" preview, and a "how to embed" doc link on the other (`SlideEmbedPicker`). The "Add slide" action stays disabled until a valid embed is pasted.
* Removing a block already goes through a confirmation-style menu (a "⋯" action opening a small menu with a single "Remove block" item), not an instant delete.

The redesign re-hosts these exact flows inside the unified canvas — it does not rebuild, simplify, or restyle them. What changes is **when** they open:

* Choosing Video, Slides, Document, or Image from either Add Content entry point inserts a realistic, fully-rendered example of that type immediately (see [Functional Requirements #2](#2-add-content)) — it does not open the add modal first.
* That inserted example is a starting point, not configured content — its own "Change video" / "Change slide" / "Change document" / "Change image" action opens the existing Add modal, blank, exactly as if the admin had chosen that type for the first time.
* Editing a block the admin has actually configured (whether from scratch or by changing an example) opens the same existing modal, pre-filled with its current source, exactly as today.

**What the example itself is made of is illustrative, not prescribed.** The prototype hotlinks one specific real YouTube video and one specific real Unsplash photo so the canvas reads as a genuinely built lesson in a demo, rather than an empty frame. This PRD does not propose that production literally defaults every new Video/Image block to that same third-party video/photo for every admin. The actual default asset per type — e.g. a ClassroomIO-owned example video and image, served from ClassroomIO's own storage rather than hotlinked from YouTube/Unsplash — is an implementation decision, not something to guess at here. The Slide and Document examples (a designed cover-slide layout, a sample file row) are already ClassroomIO-authored content, not third-party hotlinks, and need no equivalent decision.

## 11. Five interactive blocks: Chart, Flashcards, Tabs, Multiple Choice, Process

Five new block types join Note, Video, Slides, Document, and Image. Each is authored in place on the canvas and works as a learner would use it in Preview. None has an existing component to reuse, so all five are new UI.

| Block | What the admin authors | What the learner does in Preview |
| --- | --- | --- |
| **Chart** | A title, a chart type (Bar, Line, Pie, or Donut), and a small data table (label, value, color per row, with add and remove row). The chart redraws live as the data changes, and a one-line summary shows the number of data points plus the highest value (Bar and Line) or the total (Pie and Donut). | Sees the title and the animated chart. Read-only. |
| **Flashcards** | A deck of cards, each with a question side and an answer side, edited directly on the card. A flip control edits the answer side. Thumbnails below the card jump to any card; controls add, delete, and move a card earlier or later. | Flips a card (click or Space) and moves through the deck with previous/next arrows, with a progress count and bar. |
| **Tabs** | A row of named tabs (rename inline, add, remove). Each tab has a short note and its own area where any other block can be added, using the same add-content choices. A tab with no content shows "This tab is empty" with a "+" that reveals the add-content choices. A position control aligns the tab row left, center, or right. | Switches between tabs; each tab shows its note followed by its blocks. |
| **Multiple Choice** | A question, lettered options (A, B, C …) with add and remove option, one option marked correct by clicking its letter, and an optional image on the question. | Chooses one answer, selects **Check answer**, and sees "Correct" or "Not quite" with the right answer highlighted, then can **Try again**. |
| **Process** | A sequence of steps, each with a heading, a body, and an optional image. Steps can be added and deleted, and the stepper shows each step's label. | Steps through with Back and Next, with a labelled stepper and progress bar. |

Rules that apply to all five:

* Each is one block in the ordered list, so it can be inserted, reordered, and removed exactly like any other block (see [Functional Requirements #5](#5-block-actions-reorder-and-remove)).
* Adding one inserts a realistic starting example immediately, the same as Video/Slides/Document/Image (see [Functional Requirements #2](#2-add-content)). The prototype's examples (quarterly revenue chart, customer-retention flashcards, an Overview/Setup/Advanced tab set, a capital-city question, an AI-introduction process) are illustrative, not prescribed.
* In Edit, authoring controls are visible. In Preview, every authoring control and the block's type label are hidden.
* Multiple Choice is single-answer only in v1. Checking an answer is a learner-side check: this PRD does not propose grading, scoring, storing learner answers, or reporting results (see [Non-Goals](#non-goals)).
* The Tabs block can hold other blocks. Whether a Tabs block may contain another Tabs block (nesting depth) is an implementation decision.

## 12. Three ways to add content

Every way of adding content offers the same choices: **Ask AI** plus the ten block types. All are available at all times, regardless of what the canvas already contains. The labels are Note, Video, Slides, Document, Image, Chart, Flashcards, Tabs, Multiple Choice, and Process.

1. **Empty-lesson card.** A lesson with no blocks shows a card titled "What goes in this lesson?" with the line "Pick a block to begin. You can add more at any time." Below it is a 5×2 grid of centered tiles, one per block type. The **Ask AI pill** (`Ask AI | ⌘ I`, matching production) is docked at the bottom of the screen, where the floating nav sits. When the admin adds the first block, the pill is replaced by the full floating nav.
2. **Floating nav.** Once the lesson has content, a bar at the bottom of the editor (centered on the editor column, not the whole window) shows Ask AI and the ten types. Choosing one always appends a block at the end of the lesson. It is hidden on narrow screens, where the per-gap control and the mobile layout take over.
3. **Per-gap "+".** A "+" between any two blocks (and below the last) inserts at that exact position. It is quiet and low-contrast at rest and turns accent-colored on hover or focus. Clicking it opens a **compact version of the empty-state tile grid** anchored to that gap: a 5×2 grid of small tiles with a slim "Ask AI instead ⌘ I" row underneath. It opens above the gap, or below when there is no room above, and the rest of the canvas dims while it is open. Escape or a click outside closes it. In a narrow column (the mobile frame, a nested tab) it drops to three columns instead of overflowing. It replaces an earlier radial (circular) menu, which was dropped because it was less scannable than a labelled grid.

---

# Current-State Audit

| Area               | Current implementation                                                        |
| ------------------ | ------------------------------------------------------------------------------ |
| Editor             | `lessons/[lessonId]`, edit mode via `?mode=edit`                              |
| Content navigation | `UnderlineTabs`: Video, Note, Slide, Document, Settings                       |
| Content order      | `course.metadata.lessonTabsOrder` — one course-wide slot per type, no per-lesson ordering, no repeats |
| Video              | Card grid + tabbed Add Video modal; 6 sources (YouTube, Vimeo, Embed, Upload, Library, Google Drive) |
| Slides             | Embed-only; two-pane picker (searchable platform list + steps + embed textarea + live preview validity); 10 platforms; remove via a "⋯" menu, not instant delete |
| Notes              | TipTap; per-locale content + version history; no callout/style variants |
| Documents          | Upload + reorder; custom PDF viewer; always rendered as a file/download row  |
| Image               | No dedicated content type exists today                                       |
| Interactive blocks  | No Chart, Flashcards, Tabs, Multiple Choice, or Process content type exists today |
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
* `apps/dashboard/src/lib/features/course/utils.ts`
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

1. Edit Note, Video, Slide, Document, Image, Chart, Flashcards, Tabs, Multiple Choice, and Process content — as any number of blocks, in any admin-chosen order — from one lesson canvas.
2. Preview the in-app learner experience without leaving the editor, with Video and Slides rendered at learner-facing size and prominence.
3. Open lesson settings without replacing the content being edited.
4. Preserve all existing content capabilities, including the full Add Video / Add Slide pickers exactly as they work today, re-hosted behind a "Change …" action rather than a first-add modal.
5. Continue using the existing ClassroomIO design system.
6. Let an admin add images directly to a lesson as their own content block, not only as formatting inside a Note.
7. Let an admin get a first draft of a Note from a chat message to Ask AI, as a starting point they edit rather than a finished product.
8. Let an admin make a lesson interactive (charts, flashcards, tabs, multiple-choice questions, step-by-step processes) without leaving the lesson editor.
9. Make adding content obvious: an empty-lesson card, a floating nav, and a per-gap "+" that all offer the same choices.

---

# Non-Goals

The following are outside v1:

* Public renderer parity
* Learner experience redesign
* Persistent editor/preview split view
* Free-form Notion-style block editing (block types remain the fixed ten: Note, Video, Slide, Document, Image, Chart, Flashcards, Tabs, Multiple Choice, Process)
* New video or slide source integrations beyond the existing 6 video sources and 10 slide platforms
* A stock-photo library, or any image source other than direct upload
* AI-generated content for any block type other than Note (no AI-generated video, slides, images, or documents)
* Persisting or re-surfacing the prompt used to generate an AI draft
* Grading, scoring, or storing learner answers to Multiple Choice, and any learner analytics or reporting for interactive blocks
* Multiple-answer or free-text questions (Multiple Choice is single-answer only in v1)
* Importing chart data from a file or spreadsheet, or chart types beyond Bar, Line, Pie, and Donut
* A radial/circular add-content menu (replaced by the compact tile grid)
* Course creation, enrollment, analytics, attendance, marks, submissions, certificates, compliance, or landing-page editing
* Changes to `CourseSidebar` or `CourseHeader`

---

# Functional Requirements

## 1. Unified Content Canvas

Replace the current `UnderlineTabs.Root` content area with one scrollable canvas holding an ordered list of content blocks.

Each block is one of: Note, Video, Slide, Document, Image, Chart, Flashcards, Tabs, Multiple Choice, Process. Any number of blocks of any type, in any order the admin has arranged, render top to bottom.

Existing components and flows must be reused for configuring each block's underlying content:

* `AddVideoModal`
* `SlideEmbedPicker`
* TipTap `TextEditor`
* `AddDocumentModal`
* Existing Video/Slide/Note/Document components

Image and the five interactive blocks have no existing component to reuse — they are new (see [Confirmed Decisions 3 and 11](#11-five-interactive-blocks-chart-flashcards-tabs-multiple-choice-process)).

Each block's type label (a small, quiet label), drag handle, and action menu are edit-mode affordances only — all hidden in Preview, where only the content itself renders.

Content tabs are removed. Scrolling becomes the normal way to move between blocks.

---

## 2. Add Content

There are three entry points for adding a block (see [Confirmed Decision 12](#12-three-ways-to-add-content)). All offer the same eleven choices — **Ask AI**, Note, Video, Slides, Document, Image, Chart, Flashcards, Tabs, Multiple Choice, Process — and all are always available regardless of what the canvas already contains:

* **Empty-lesson card.** The starting state of a lesson with no blocks: a "What goes in this lesson?" card with a 5×2 grid of block tiles. The Ask AI pill is docked at the bottom of the screen, where the floating nav sits, and the floating nav replaces it as soon as the first block exists.
* **Floating nav.** A bottom bar centered on the editor column, shown once the lesson has content. Choosing one always appends a new block at the end of the lesson. Hidden on narrow screens.
* **Per-gap "+".** A "+" between any two existing blocks (or above the first / below the last) opens a compact tile grid anchored to that exact gap, for precise mid-canvas insertion, with "Ask AI instead" along the bottom. The "+" itself is a quiet, low-contrast affordance in its resting state and becomes clearly actionable (accent color) on hover or focus — it must not look like a heavier, permanent part of the canvas. The popover closes on Escape, on a click outside, or when a choice is made.

Selecting a choice behaves as follows:

* **Ask AI** opens the chat panel on the right (see [Confirmed Decision 4](#4-an-ai-assistant-can-draft-a-note-block)). Nothing is inserted until the admin chooses **Insert into lesson** on a draft, which adds an editable Note at the gap (or at the end).
* **Note** inserts a new Note block with real starting guidance text the admin edits or replaces — not an empty field.
* **Video**, **Slides**, **Document**, **Image** each insert a realistic, fully-rendered example of that type immediately, flagged internally as a starting example. Its own "Change …" action always opens a fresh Add modal (never pre-filled from the example); any other, admin-configured block of that type opens the same modal pre-filled with its real source, exactly as today (see [Confirmed Decision 10](#10-existing-add-video--add-slide-flows-are-preserved-exactly-only-re-hosted)).
* **Chart**, **Flashcards**, **Tabs**, **Multiple Choice**, **Process** each insert a ready-to-edit example of that block (see [Confirmed Decision 11](#11-five-interactive-blocks-chart-flashcards-tabs-multiple-choice-process)), edited directly on the canvas with no modal.

After insertion, the new block is briefly highlighted and the canvas scrolls the minimum distance needed to bring it fully into view — never a jarring, page-length scroll.

Do not redesign the existing Add Video / Add Slide / Add Document flows themselves — only how and when they're reached.

---

## 3. Preview

Add an Edit/Preview toggle to the lesson header.

Preview uses `getViewModeComponents` and the existing authenticated learner rendering path.

It must:

* Be read-only
* Use the same block order as configured in Edit
* Be clearly labeled **In-app learner experience**
* Stay on the same page
* Not open a new browser tab
* Render Video as a large, prominent player (full canvas width, learner-page proportions) instead of the compact edit-mode card
* Render Slides as a large, prominent viewer (full canvas width) instead of the compact edit-mode card
* Hide every block's type label, drag handle, and action menu, so the lesson reads as one continuous page rather than a labeled form — the learner already knows what they're looking at from the content itself
* Reflect the lesson's persisted reading-density setting (Compact / Comfortable / Spacious, set from the Settings slider) as spacing between blocks — Preview shows exactly what the in-app learner view will show
* Make interactive blocks usable: flip and step through Flashcards, switch Tabs, check a Multiple Choice answer, step through a Process, and see Chart data read-only

Preview must not discard unsaved edits. Existing autosave continues to handle persistence.

`viewAsStudent()` remains available as a separate supplementary check.

---

## 4. Settings Slider

Remove Settings from content navigation.

Add a persistent Settings action to the lesson header.

Clicking Settings opens a right-side slider using the existing `@cio/ui` Sheet/Drawer primitives.

The slider contains the existing `LessonSettingsTab` fields, including their existing conditional visibility, plus one new field:

### Live class

Shown only when the course is a live-class-type course; not shown at all for any other course type (unchanged from today).

* Call URL
* Date
* Timezone

### Progression

* Completion rule (Manual / Video watch / None)
* Video-watch threshold — shown only when the completion rule is "Video watch" (unchanged from today)
* Per-video watch enforcement — shown only when the completion rule is "Video watch" (unchanged from today)

### Lesson comments

* Comments enabled toggle

### Reading density (new)

* Compact / Comfortable / Spacious — a persisted, per-lesson setting controlling block spacing wherever the lesson is rendered for viewing (Preview and the real in-app learner view); no effect on the Edit canvas

Existing validation and behavior remain unchanged for every field except Reading density, which is new.

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

## 4b. Interactive blocks

The five interactive blocks (Chart, Flashcards, Tabs, Multiple Choice, Process) follow the table in [Confirmed Decision 11](#11-five-interactive-blocks-chart-flashcards-tabs-multiple-choice-process). Requirements common to all:

* Authoring happens directly on the canvas. No modal is used to create or edit them.
* Edits are saved by the existing autosave (see [Saving](#7-saving)).
* In Preview they are fully usable by a learner and show no authoring controls or type label.
* They support the same per-block actions as every other block: drag, move up/down, remove.
* A Tabs block's inner areas use the same add-content choices as the main canvas, and a tab with no content shows an empty state with a "+" that reveals them.
* Multiple Choice never reveals the correct answer to a learner before they check their answer, and a learner can try again after checking.

---

## 5. Block actions: reorder and remove

Every block exposes, from a per-block menu:

* **Edit [type]** — for Video, Slide, Document, and Image, opens that type's existing Add/Edit modal pre-filled with the block's current source. Note has no separate edit entry; its text is directly editable in place.
* **Remove block** — removes the block immediately; this is the only delete path (no separate confirmation step beyond opening the menu).

Independently of the menu, every block also has:

* A **drag handle** that picks the block up and drops it at a new position among the other blocks.
* **Move up** / **move down** controls, for reordering without dragging.

A dismissible hint banner introduces the drag-to-reorder affordance the first time a lesson has reorderable content; dismissing it does not reappear for that admin.

---

## 6. Note callout styles

A Note block's toolbar includes a style picker with six options: Default (no callout), Info, Tip, Important, Warning, Highlight. Each styled option renders the note body inside a colored callout with its own icon and label, in both Edit and Preview. Switching styles does not alter the note's text.

---

## 7. Saving

No changes to saving behavior.

Keep:

* 2-second debounced autosave
* Save queue
* Manual save behavior
* `localStorage` note draft recovery
* Saving/Saved status

Do not introduce another save system.

---

## 8. Existing Capabilities

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

Only the page arrangement and ordering model change.

---

# Information Architecture

### Current

`Video | Note | Slide | Document | Settings`

Each is treated as a separate destination, one slot per type.

### Proposed

Content becomes an ordered list of blocks within one canvas. Each block is one of: Note, Video, Slide, Document, Image, Chart, Flashcards, Tabs, Multiple Choice, Process — any count, any order, set per lesson by the admin, not derived from a single course-wide `lessonTabsOrder`.

Settings becomes a header action that opens the right-side slider.

| Content      | Discovery                                | Access                                                     |
| ------------ | ----------------------------------------- | ----------------------------------------------------------- |
| Video        | Canvas block                              | Realistic example on add; existing tabbed Add Video modal via "Change video" or Edit |
| Note         | Canvas block                              | Existing TipTap editor, directly in place; optional AI-drafted starting text |
| Slide        | Canvas block                              | Realistic example on add; existing two-pane `SlideEmbedPicker` via "Change slide" or Edit |
| Document     | Canvas block                              | Realistic example on add; existing document manager via "Change document" or Edit |
| Image        | Canvas block                              | Upload on add; alt text + fit settings via its own toolbar  |
| Chart        | Canvas block                              | Edited in place: title, chart type, data table              |
| Flashcards   | Canvas block                              | Edited in place: cards, flip, reorder                        |
| Tabs         | Canvas block                              | Edited in place: named tabs, each holding its own blocks    |
| Multiple Choice | Canvas block                           | Edited in place: question, options, correct answer, image   |
| Process      | Canvas block                              | Edited in place: steps with heading, body, image            |
| Any type     | Add Content (empty-lesson card, floating nav, or per-gap "+") | Always available, regardless of what the canvas already has |
| Ask AI       | Add Content entry points and `⌘ I`        | Chat panel on the right                                      |
| Settings     | Header action                             | Right-side slider                                            |

---

# User Flows

### Editing

Admin opens a lesson and sees all existing content blocks in the order they were arranged.

They edit directly within each block.

Autosave continues using the existing save system.

### Adding content

Admin starts from the empty-lesson card, the floating nav, or a per-gap "+", and chooses a type. A Note, an example of a media block, or a ready-to-edit interactive block appears immediately at the chosen position, briefly highlighted, with the canvas scrolled to show it.

### Drafting a note with AI

Admin chooses Ask AI from any add-content entry point (or presses `⌘ I`). A chat panel opens on the right. They describe what that part of the lesson should cover, or tap a suggestion, and the assistant replies with a draft. They select **Insert into lesson** and a Note block appears at the chosen position for them to edit. The panel stays open for another draft until they close it.

### Authoring an interactive block

Admin adds a Chart, Flashcards, Tabs, Multiple Choice, or Process block and edits it directly on the canvas: changing chart data, writing card faces, naming tabs and filling each tab, writing a question and marking the correct option, or writing process steps. Preview shows how a learner will use it.

### Reordering content

Admin drags a block by its handle to a new position, or uses its move up/down controls. The canvas reflects the new order immediately; autosave persists it.

### Settings

Admin selects Settings, the slider opens, they update a field, then close it and return to the same canvas position.

### Preview

Admin selects Preview and sees Video and Slides rendered large, no block-type labels, and the lesson at their chosen reading density — reviewing the **in-app learner experience** as one continuous page — then selects Edit to return to the authoring canvas.

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

* Stacked content blocks, in the admin-defined per-lesson order
* Any number of blocks of the same type
* Flat visual treatment — no card drop-shadows
* Existing content components remain unchanged for configuring a block's source
* No horizontal content-tab navigation
* A per-gap "+" for precise insertion, quiet/low-contrast at rest and only clearly visible (accent color) on hover or focus. It opens a compact tile grid, not a circular menu.
* A small, quiet type label on each block in Edit (hidden in Preview)
* A floating nav at the bottom, centered on the editor column
* A drag handle and move up/down controls on every block for reordering
* A newly inserted block is briefly highlighted and auto-scrolled into view
* A scroll-position indicator — one dot per block, just inside the canvas column's **left** edge, not pinned to the viewport edge — highlights the block currently in view and jumps to a block on click. Present on the desktop and empty-lesson screens; the mobile frame keeps native scrolling with no dot rail.
* Hovering or keyboard-focusing a dot shows a small tooltip naming that block: its content-type icon plus its title, read directly from the block's own rendered content (a video/slide's displayed title, a document's filename, an image's alt text, a note's own heading/opening text) — never hardcoded. A block with no real title falls back to a generic label ("Untitled note", "Untitled image", etc.). The tooltip uses the `--primary` accent color (the same blue as the active dot), not a neutral dark tone, and fades/slides in next to its dot and disappears when the pointer or focus moves away. It defaults to the dot's outer (left) side and flips to the inner (right) side if there isn't room, so it never covers the dot rail itself or runs off the viewport. This is purely a read of existing, already-rendered content — no new data is stored for it.

## Add Content

* Three entry points: the empty-lesson card, the floating nav, and the per-gap "+"
* The empty-lesson card is titled "What goes in this lesson?", with a 5×2 grid of centered tiles (icon above label) and the Ask AI pill docked at the bottom where the floating nav sits; the floating nav replaces the pill after the first block
* The per-gap popover is a compact version of that grid, with an "Ask AI instead" row, and it shrinks to three columns in a narrow column
* All offer the same eleven choices (Ask AI plus ten block types) regardless of what already exists — no "only show missing types"
* Video, Slides, Document, and Image insert a realistic example immediately; Note inserts starting text; interactive blocks insert a ready-to-edit example
* Use existing add flows for "Change …" and for editing an admin-configured block
* Ask AI opens the right-side chat panel (see below)

## Ask AI panel

* A 380px panel docked to the right edge, below the header, that pushes the lesson over rather than covering it; full-width on narrow screens
* Header with the AI icon, "Ask AI", and a close button
* A chat log that starts with a greeting and suggested prompts, then alternates the admin's messages with the assistant's drafts
* A composer at the bottom: Enter sends, Shift+Enter adds a line
* Each draft has an **Insert into lesson** button that adds a Note at the gap the panel was opened from, or at the end of the lesson
* Closes with the close button or Escape; the floating nav re-centers in the space that remains while it is open

## Interactive blocks

* Authoring controls (chart type switch and data table, card thumbnails and flip/move/delete, tab names and tab-position control, option letters and add option, step add/delete) are edit-only and hidden in Preview
* Preview shows only what a learner uses: the chart, the card deck with arrows and progress, the tabs, the question with Check answer, and the process with Back/Next and progress

## Preview

* Read-only
* Uses `getViewModeComponents`
* Clearly labeled as the in-app learner experience
* Video renders as a large, full-width player, not a compact card
* Slides render as a large, full-width viewer, not a compact card
* All block-type labels are hidden — the page reads as one continuous lesson
* Reflects the lesson's persisted reading-density setting (Compact / Comfortable / Spacious, set from the Settings slider) as spacing between blocks
* The scroll-position indicator becomes a continuous progress fill instead of discrete dots

## Documents

* Existing file row (upload, PDF viewer, download) is unchanged
* Reordering now happens at the block level (drag handle / move up-down), alongside every other content type, rather than a document-specific reorder control

## Image

* Upload only — drag-and-drop or click to browse; no stock-photo library
* Per-image Alt text and Fit (Fill / Fit) settings, reachable from an on-image toolbar
* "Change image" replaces the file; editing alt text/fit does not

## Settings

* Right-side slider
* Canvas remains visible on desktop
* Close button, Escape, and overlay click supported
* Full-width on smaller screens if needed

## Responsive

The content tab strip is removed.

The canvas stacks naturally on smaller screens.

The Settings slider should use an appropriate breakpoint for switching to full-width.

The per-gap Add Content popover shrinks to fit a narrower column (the mobile frame, a resized window, a nested tab) rather than overflowing it. The floating nav is hidden on narrow screens. The Ask AI panel covers the full width on narrow screens.

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
* `@cio/ui` Sheet/Drawer
* `Empty`
* `Chip`

Do not rebuild existing content functionality — this applies in full to `SlideEmbedPicker`, which already has more surface area (search, guided per-platform steps, live embed validation) than a simple "add" form.

Image has no existing component or modal to reuse — it is new work, modeled after the existing Document upload pattern where practical (see [Data Model and API](#data-model-and-api)).

The five interactive blocks (Chart, Flashcards, Tabs, Multiple Choice, Process) are all new components. Chart needs a chart renderer; the dashboard already depends on `layerchart`, which must follow the SSR rules in `CLAUDE.md` (browser-only dynamic import). Tabs needs to host a nested ordered block list, so the canvas component must be reusable inside a tab.

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
* An ordered list of block components, rendered from the new per-lesson block data (see [Data Model and API](#data-model-and-api))
* Canvas scrolling, including the scroll-position indicator

### `lesson-settings-tab.svelte`

Re-host the existing settings fields inside the new slider.

Keep the existing field logic.

### `constants.ts`

The existing `MaterialTab` model and `orderedTabs()` are no longer sufficient: they assume exactly one slot per type, ordered by a single course-wide `lessonTabsOrder`. Both need to be replaced by logic that reads and writes the new per-lesson ordered block list.

### AI note drafting (new)

Needs a right-side chat panel (new UI) and a server endpoint that accepts a prompt and returns generated note content (HTML/rich text) for the client to insert as a new Note block. Provider/model choice, cost controls, rate limiting, and any content moderation are implementation decisions, not specified here.

### Image block (new)

Needs upload handling for the new Image type — object storage, a served URL, and a reasonable size limit — modeled after the existing document-upload path where practical. No existing `Image` component exists to extend.

---

# Data Model and API

## Settings slider and Preview rendering

No changes are expected for the existing settings (Live class, Progression/completion rule, video-watch threshold and enforcement, Lesson comments) beyond consuming the new ordered block data described below. Continue using:

* `lesson_language`
* Existing lesson-language endpoints

## Reading density (new)

* Needs a persisted, per-lesson field (e.g. `lesson.readingDensity`, enum `compact` / `comfortable` / `spacious`, default `comfortable`) — its exact shape is an implementation decision against `packages/db/src/schema.ts`.
* Read wherever the lesson is rendered for viewing: the admin's in-page Preview and the real in-app learner view. Not read or applied anywhere in the Edit canvas.

## The ordered block list (new)

This is the change Decision 8 calls out as necessary. Scoped narrowly to what it requires:

* Each lesson needs an ordered list of block entries — not the current fixed `videos` / `slides` / `documents` / `note` shape, which has no way to express repeats or an interleaved order.
* Each entry needs at minimum: a block type (Video / Note / Slide / Document / Image), a position, and a reference to its underlying content — an existing video/slide/document record, inline note content, or a new image reference.
* The exact shape (a new ordered jsonb array on `lesson`, a new child table, or another approach) is an implementation decision to make against the real shape in `packages/db/src/schema.ts`, not something to guess at here.
* What becomes of `course.metadata.lessonTabsOrder` and the course-level reorder control (`reorder-material-tabs.svelte`) once lessons carry their own order is also an implementation decision — options range from leaving it as a legacy/default ordering for lessons that haven't been touched, to retiring it entirely — not prescribed here.

## Image (new)

* Needs a way to store an uploaded image's reference (object storage key/URL), alt text, and fit mode, associated with its position in the lesson's block list.
* No change is proposed to how other lesson media (e.g. documents) is uploaded, stored, or served — Image should follow the same underlying storage approach where practical.
* The default example shown when an admin first adds a Video or Image block (see [Confirmed Decision 10](#10-existing-add-video--add-slide-flows-are-preserved-exactly-only-re-hosted)) needs its own ClassroomIO-owned asset — not a hotlinked third-party URL — stored and served the same way as any other lesson media. Sourcing/producing that specific asset is an implementation detail, not prescribed here.

## Interactive blocks (new)

Each interactive block is one entry in the ordered block list, with its own content stored inline in the entry, since none of it refers to an existing record. The shapes below are what the prototype uses and are a starting point, not a final schema:

* **Chart:** `title`, `type` (bar / line / pie / donut), and parallel `labels` and `values` (plus a color per row).
* **Flashcards:** an ordered list of `{ question, answer }`.
* **Tabs:** an ordered list of `{ id, label, note, blocks }`, where `blocks` is itself an ordered block list. Nesting depth is an implementation decision.
* **Multiple Choice:** `question`, an optional image reference, and an ordered list of `{ text, correct }` with exactly one correct option.
* **Process:** an ordered list of `{ heading, body, image }`.

Images inside Multiple Choice and Process follow the same storage approach as the Image block. No learner answers or progress for interactive blocks are stored in v1.

## AI note drafting (new)

* Needs a server endpoint that takes a prompt and returns generated note content; the client inserts the result as an ordinary, immediately-editable Note block.
* No persistence of the prompt itself is proposed.
* Provider/model selection, cost, rate limiting, and content moderation are implementation decisions, out of scope for this PRD.

If implementation discovers that any other part of this PRD requires a data-model change beyond these, flag it before introducing it.

---

# Migration and Backward Compatibility

Existing lessons must map into the new ordered block list without loss or unintended reordering: a lesson's current Video/Note/Slide/Document content becomes an equivalent block list, in its existing `lessonTabsOrder`-derived order, the first time it's represented in the new canvas. The exact migration mechanics (a one-time backfill, a read-time fallback, or another approach) are an implementation decision against the real schema, not prescribed here.

The public course renderer is unchanged.

Existing learner experiences must continue working.

No lesson content should be lost, modified, or unintentionally reordered.

---

# Implementation Order

## 1. Ordered block data model

Introduce the per-lesson ordered block list described in [Data Model and API](#data-model-and-api), and a migration path for existing lessons' current content.

## 2. Canvas

Render the stacked canvas from the new ordered block list.

Verify all existing content components work when mounted together, any number of times, in any order.

## 3. Add Content

Add the three entry points (empty-lesson card, floating nav, per-gap compact tile grid), the eleven choices, and the realistic-example-on-add behavior for Video/Slides/Document/Image.

## 4. Block actions

Add the per-block menu (Edit/Remove), drag reordering, and move up/down controls.

## 5. Image

Build the new Image block: upload, rendering, and its alt-text/fit settings.

## 6. Interactive blocks

Build Chart, Flashcards, Multiple Choice, and Process, then Tabs last (it depends on the canvas being reusable inside a tab). Each ships with its Edit and Preview behavior together.

## 6b. AI note drafting

Build the right-side chat panel and the server-side draft-generation endpoint, and the Insert into lesson action.

## 7. Settings Slider

Remove Settings from the tab structure and re-host `LessonSettingsTab` inside the existing slider primitive.

Verify scroll position and editing context are preserved.

## 8. Preview

Add Edit/Preview.

Connect Preview to `getViewModeComponents`.

Add clear in-app learner labeling, the reading-density control, and the progress-fill scroll indicator.

## 9. Responsive

Verify desktop and mobile layouts, including the per-gap popover's narrower-column behavior.

Determine the breakpoint for switching the Settings slider to full-width.

## 10. Verification

Run:

`pnpm --filter @cio/dashboard^... build && pnpm --filter @cio/dashboard build`

Manually verify:

* Existing published courses
* Existing lessons, migrated into the new block list
* All ten block types, including multiple blocks of the same type
* Each interactive block in Edit and in Preview (flip a card, switch a tab, check an answer, step through a process, change a chart type)
* All three add-content entry points, including the per-gap popover near the top, bottom, and in a narrow column
* Drag and move-up/down reordering
* AI note drafting through the right-side chat panel
* In-app learner rendering
* Public rendering
* Autosave
* Preview, including reading density and the progress-fill indicator
* Settings
* Mobile behavior

---

# Acceptance Criteria

1. All ten block types (Note, Video, Slide, Document, Image, Chart, Flashcards, Tabs, Multiple Choice, Process) can be viewed and edited in one canvas, as any number of blocks in any admin-chosen order.
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
12. Existing published lessons continue to work in both in-app and public experiences after migrating into the new block list.
13. Existing content is not lost, changed, or unintentionally reordered by the migration.
14. The editor works across existing desktop and mobile breakpoints without horizontal content tabs.
15. `viewAsStudent()` continues to work.
16. Required dashboard builds pass.
17. In Preview, Video renders as a large, full-width player, not a compact edit-mode card.
18. In Preview, Slides render as a large, full-width viewer, not a compact edit-mode card.
19. In Preview, no block's type label is shown.
20. The existing Add Video (6 sources) and Add Slide (search, 10 platforms, guided steps, live embed validation) flows are re-hosted unchanged, reached via "Change …" or Edit — no reduction in sources, platforms, or steps.
21. A lesson can contain more than one block of the same type (e.g. two Notes, three Images), in an order the admin controls.
22. A block can be moved via drag handle or move up/down controls without any content being lost.
23. Adding Video, Slides, Document, or Image inserts a realistic, immediately-viewable example rather than a blank form; its "Change …" action opens the existing Add modal blank, not pre-filled from the example.
24. A new block is briefly highlighted and the canvas scrolls it into view without a jarring, page-length jump.
25. Choosing Ask AI opens a chat panel docked on the right (not a modal), and the lesson stays visible beside it. A draft can be inserted as an editable Note with **Insert into lesson**, at the gap it was opened from or at the end of the lesson. The panel stays open after inserting and closes with its close button or Escape. The prompt itself is not persisted.
26. Note blocks support the six callout styles (Default, Info, Tip, Important, Warning, Highlight), selectable without altering the note's text.
27. Image blocks can be uploaded, and their alt text and fit can be edited independently of replacing the image.
28. Reading density is a persisted, per-lesson setting: set once from the Settings slider, it determines block spacing in both Preview and the real in-app learner view, with no effect on the Edit canvas.
29. The Settings slider's visibility rules match production exactly: Live class fields only for live-class-type courses; video-watch threshold and per-video enforcement only when the completion rule is "Video watch".
30. The scroll-position indicator (dots in Edit, progress fill in Preview) reflects the block currently in view and can jump to any block on click; it does not appear on the mobile frame.
31. Hovering or focusing a scroll-position dot shows a tooltip with that block's real content-type icon and title (reading it from the block's own content, not a hardcoded value, with an "Untitled …" fallback when the block has no title); it disappears when the pointer or focus moves away, and this works identically for the admin's Edit/Preview canvas and the real in-app learner view.

32. An empty lesson shows the "What goes in this lesson?" card with a 5×2 grid of the ten block types, and the Ask AI pill is docked at the bottom where the floating nav sits. Adding the first block replaces the pill with the floating nav.
33. Once the lesson has content, the floating nav at the bottom offers Ask AI and the ten types and appends a new block at the end. It is centered on the editor column and re-centers while the Ask AI panel is open.
34. Every gap between blocks has a "+" that is quiet at rest and accent-colored on hover or focus. Clicking it opens a compact tile grid with all ten types and an "Ask AI instead" row, at that gap, and the chosen block is inserted exactly there. The popover opens below the gap when there is no room above, shows three columns in a narrow column, and closes on Escape or an outside click.
35. All three add-content entry points offer the same eleven choices at all times, and there is no radial/circular add-content menu.
36. A Chart block lets the admin set a title, switch between Bar, Line, Pie, and Donut, and edit the label/value/color data table (add and remove rows); the chart and its summary line update live. In Preview the chart is read-only.
37. A Flashcards block lets the admin edit both faces of each card, add, delete, and reorder cards, and jump to any card. In Preview a learner flips a card (click or Space) and moves through the deck with previous/next and a progress indicator.
38. A Tabs block lets the admin rename, add, and remove tabs, set the tab row's position (left, center, right), and add any block inside each tab. An empty tab shows an empty state with a "+" that reveals the add-content choices. In Preview a learner switches tabs and sees each tab's note and blocks.
39. A Multiple Choice block lets the admin write a question, add and remove lettered options, mark exactly one as correct, and add an optional image. In Preview a learner picks one option, selects **Check answer**, sees correct/incorrect feedback with the right answer highlighted, and can **Try again**. The correct answer is not revealed before they check, and no answer is stored.
40. A Process block lets the admin add and delete steps, each with a heading, body, and optional image. In Preview a learner moves through the steps with Back/Next, a labelled stepper, and a progress indicator.
41. In Preview, none of the interactive blocks shows authoring controls or a type label, and each can be used as a learner would use it.
42. Each block shows a small, quiet type label in Edit, hidden in Preview.
43. Interactive blocks can be dragged, moved up/down, and removed like any other block, and every interactive block autosaves through the existing save system.

---

# Status

Draft, backed by a working prototype (`prototypes/lesson-editor-redesign/index.html`). This PRD defines the scope, information architecture, interaction model, existing behavior to preserve, and implementation direction for the lesson editor redesign.

**Core decision:** The lesson becomes one editable canvas holding an ordered list of ten block types — Note, Video, Slide, Document, Image, Chart, Flashcards, Tabs, Multiple Choice, and Process — any count, any order, per lesson, instead of four fixed content tabs. Content is added from an empty-lesson card, a floating nav, or a per-gap compact tile grid, and Ask AI opens a chat panel on the right. Settings becomes a right-side slider, and Preview becomes an in-page toggle using the existing learner rendering path, rendering Video and Slides at full learner-facing size, hiding block-type labels, and offering a reading-density control.

**Scope of data-model change:** the per-lesson ordered block list (replacing `lessonTabsOrder`'s role in content ordering), a new Image block, five new interactive blocks (Chart, Flashcards, Tabs, Multiple Choice, Process) stored inline in the block list, a new AI note-drafting endpoint behind the right-side chat panel, and a new persisted reading-density field. Everything else — the existing Live class / Progression / Lesson comments settings (with their existing conditional visibility unchanged), Preview's rendering path, and the existing Add Video/Add Slide/Add Document flows — continues on existing data and APIs.
