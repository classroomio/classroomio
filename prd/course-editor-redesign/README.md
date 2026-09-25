# Course Editor Redesign PRD

## Status

- Draft (codebase-audited, ready for design/engineering review)

This PRD does not yet have a companion `prototypes/course-editor-redesign/` folder. Several existing PRDs in this repo (`prd/course-templates/`, `prd/course-cohorts/`, `prd/multi-workspace/`) ship as text-only specs without prototypes, and this document follows that precedent since it was scoped as "write the PRD, do not implement." Given how much of this redesign is an interaction/layout change, building clickable HTML prototypes under `prototypes/course-editor-redesign/` (per `skills/write-prd/SKILL.md`) is the natural next step before implementation and is called out as a recommendation in [Risks and Mitigations](#risks-and-mitigations), not done here.

## Purpose

Replace the lesson editor's tab-based content model (Video / Slides / Notes / Documents / Settings, one panel visible at a time) with a unified authoring canvas where an admin edits a lesson's content directly, sees a learner-accurate preview without leaving the page, and reaches settings through a contextual right-side drawer instead of a fifth full-panel tab. The reference for the editing *philosophy* is Notion-style directness (content is the page, not a configuration form) — this PRD does not propose adopting Notion's visual design, block-drag system, or branding.

## Problem Statement

Based on the current implementation (`apps/dashboard/src/lib/features/course/pages/lesson.svelte`), the lesson editor has the following concrete problems:

- **Editing is single-panel by construction.** In `?mode=edit`, content renders inside an `UnderlineTabs.Root` strip with one `UnderlineTabs.Content` visible at a time (`lesson.svelte:569-625`; tab items defined in `apps/dashboard/src/lib/features/course/components/lesson/constants.ts:15-40`: Video, Note, Slide, Document). An admin building a lesson that needs a video, notes, and a slide deck must click through three isolated panels — none of the other content is visible while editing one.
- **Settings fully replaces the content area.** `LessonSettingsTab` (`.../lesson/lesson-settings-tab.svelte`) is rendered as a fifth `UnderlineTabs.Content` (`SETTINGS_TAB_VALUE`, `constants.ts:42`), so selecting Settings hides the lesson's content entirely rather than layering configuration over it.
- **There is no in-editor "what will my learner see" preview.** The only preview affordance, `viewAsStudent()` (`apps/dashboard/src/lib/features/course/utils/course-preview.ts:62-87`), mints a login-link token and opens a **new browser tab** at the course's first lesson — it is course-scoped, not lesson/tab-scoped, and requires fully leaving the editing workflow. Toggling the page's own `mode` from `edit` to `view` re-renders using the admin's own account/permissions, not a learner simulation, and still exits the tabbed editing UI.
- **The editor and the two learner-facing renderers disagree on what a lesson contains.** The authenticated in-app learner view (`lesson.svelte` in `mode=view`) reuses the *same* `Note`/`Slide`/`Video`/`Document` components as the editor, stacked vertically (`lesson.svelte:626-643`). The public/unauthenticated org-site renderer (`packages/ui/src/custom/public-course/lesson-view.svelte`, fed by `toPublicLessonView()` in `apps/dashboard/src/lib/features/course/utils/public-course-mappers.ts:66-77`) renders **only a single video and the note body** — no slides, no documents. An admin authoring in the tabbed editor cannot discover this gap without publishing and separately checking the public page.
- **Content-order configuration lives on a different screen than the content it orders.** Reordering Video/Note/Slide/Document tabs is done via drag-and-drop on the **course-level** Settings page (`apps/dashboard/src/lib/features/course/pages/settings.svelte`, using `reorder-material-tabs.svelte`), not from within the lesson editor.
- **No dedicated mobile layout for editing.** The tab strip degrades to horizontal scroll with hidden scrollbars (`packages/ui/src/custom/underline-tabs/underline-tabs-list.svelte`) as its only narrow-screen accommodation. The app's existing mobile affordances (`course-mobile-bottom-nav.svelte`, outline sheet) are explicitly gated to `isCourseLearnerView && isMobile` and do not apply when an admin is editing.

This is an information-architecture and workflow problem, not a data or functionality problem — every content type saves and autosaves reliably today (see [Current-State Audit](#current-state-audit)).

## Confirmed Decisions

These reflect explicit product direction given for this redesign, plus this PRD's codebase-informed recommendation on the one open question the brief left for investigation (the preview interaction model, decision 5).

1. **Editing philosophy, not visual redesign.** The lesson editor becomes a unified content canvas inspired by Notion's directness (content-first, minimal chrome), not a reskin using Notion's colors, iconography, or block-drag interaction model. ClassroomIO's existing `@cio/ui` design system remains the visual language.
2. **No content-type or capability removal.** All four content types (Video, Note, Slide, Document) and every existing capability within them (6 video sources, 10 slide-embed platforms, the custom PDF viewer, TipTap notes with version history, `lessonTabsOrder`-based ordering) remain fully available. This is an information-architecture and interaction change, not a feature cut.
3. **Settings becomes a right-side drawer**, not a tab: opens from the right, does not cover the full page, leaves the canvas visible/interactive behind it, closes without navigating away or losing scroll position.
4. **Settings drawer scope** is exactly the field set `LessonSettingsTab` exposes today (live-session call URL/date/timezone for `LIVE_CLASS` courses, completion policy + video-watch threshold + per-video watch enforcement, comments toggle) — no new settings are introduced by this PRD.
5. **Preview interaction model: an Edit/Preview toggle on the same page, not a persistent split view.** Recommendation, made after investigating the codebase: `packages/ui/src` has no resizable/split-panel primitive today (confirmed — none found under `packages/ui/src`), so a persistent side-by-side split would require new shared UI rather than reuse. The in-app learner view already reuses the editor's own components in `mode=view` (`getViewModeComponents`), so a toggle is close to a reuse of an existing code path rather than a new render pipeline. A toggle is recommended for v1; a persistent split view is left as a future option if a resizable-panel primitive is added to the design system for other reasons (see [Risks and Mitigations](#risks-and-mitigations)).
6. **Preview renders the in-app learner experience, not the public-site experience**, and is explicitly labeled as such, because those two renderers currently disagree on capability (see Problem Statement). Closing that gap is out of scope for this PRD (see [Non-Goals](#non-goals-v1)).
7. **No data model or API changes.** This is a front-end layout/interaction change against the existing `lesson` row, `lesson_language` table, and `PUT /course/:courseId/lesson/:lessonId` / `lesson-language.ts` endpoints.
8. **Scope boundary: single-lesson content area only.** The course-level shell (left `CourseSidebar`, `CourseHeader`) and the course-level Settings page (including `lessonTabsOrder` reordering) are unchanged; this PRD only redesigns what renders inside `Page.Body` for one lesson.

## Current-State Audit

| Capability | Current State | Notes |
| --- | --- | --- |
| Editor entry | Same route as viewing (`lessons/[lessonId]`); edit mode toggled by `?mode=edit` query param, not a distinct route | `lesson.svelte:165-173` (`toggleMode`) |
| Content navigation | `UnderlineTabs.Root` strip: Video, Note, Slide, Document + fixed Settings tab; one panel visible at a time; order configurable via `course.metadata.lessonTabsOrder` | `.../lesson/constants.ts:15-59`; reordering UI lives on the course-level Settings page (`pages/settings.svelte`, `reorder-material-tabs.svelte`), not the lesson editor |
| Video | Card grid + "Add Video" modal with 6 source tabs: YouTube, Vimeo, generic Embed, Upload, Library (reuse prior asset), Google Drive; HLS transcoding for uploads; transcript side panel | `.../lesson/video/video.svelte`, `add-video-modal.svelte`, `video/constants.ts` |
| Slides | Embed-only — no native slide editor. Platform picker: Google Slides, Canva, PowerPoint, Keynote, Figma, Prezi, Pitch, Gamma, SlideShare, "Beautiful"; produces an iframe embed | `.../lesson/slide/slide.svelte`; shared `SlideEmbedCard`/`SlideEmbedFrame`/`SlideEmbedPicker` in `packages/ui` |
| Notes | Rich text via the shared TipTap 3 editor (`@cio/ui/custom/editor`, via `svelte-tiptap`) — the same editor used app-wide in newsfeed, exercises, community Q&A, and landing-page forms. Per-locale content in `lesson_language`, with version history in `lesson_language_history` | `.../lesson/note/note.svelte`; `packages/ui/src/custom/editor/` |
| Documents | Upload + drag-reorder list; PDF viewing is a hand-rolled `pdf.js` canvas renderer with custom pager/zoom (not a shared component); non-PDF files open in a new tab | `.../lesson/document/document.svelte`, `document-list.svelte` |
| Settings | Full-panel tab: live-session call URL/date/timezone (`LIVE_CLASS` courses only), completion policy (`manual\|video_watch\|none`) + watch threshold + per-video watch enforcement, comments toggle. Title/slug/lock/delete live in the page header, not this tab | `.../lesson/lesson-settings-tab.svelte` |
| Preview | `viewAsStudent()` opens a new browser tab via a login-link token, scoped to the course (not the specific lesson being edited); no in-editor preview pane exists | `.../course/utils/course-preview.ts:62-87`, `view-as-student-modal.svelte` |
| Learner rendering (in-app) | Same `Note`/`Slide`/`Video`/`Document` components as the editor, rendered in `mode=view`, stacked vertically | `lesson.svelte:626-643`, `getViewModeComponents` in `.../lesson/utils.ts` |
| Learner rendering (public site) | Separate, simpler renderer: single video + note body only — **no slides, no documents** | `packages/ui/src/custom/public-course/lesson-view.svelte`; `public-course-mappers.ts:66-77` (`toPublicLessonView`) |
| Autosave | 2s-debounced autosave on any field mutation, serialized through a save queue; manual save also triggered by the header Save/Pencil toggle; separate `localStorage` draft-recovery for notes | `lesson.svelte:239-249, 295-369, 407-436`; `utils/lesson-draft.ts` |
| Responsive | Course-level `Sidebar.Root` collapses on mobile (`collapsible="icon"`); tab strip degrades to horizontal scroll only; mobile bottom nav/outline sheet exist but are gated to the learner view, not the editor | `+layout.svelte`; `underline-tabs-list.svelte`; `mobile-bottom-nav.ts` (`isCourseLearnerView && isMobile`) |
| Reusable design-system primitives | `@cio/ui/base/page` (`Page.Root/Header/Body/SettingsActions`), `@cio/ui/base/sheet`, `@cio/ui/base/drawer`, `@cio/ui/custom/underline-tabs`, `Empty`, `Chip` badges — `sheet`/`drawer` exist but are unused for lesson settings today (the editor currently uses modal `Dialog`s and a custom version-history "drawer") | `packages/ui/src/base/{page,sheet,drawer}/`; no resizable/split-panel primitive found anywhere under `packages/ui/src` |

## Data Sources Checked

- `apps/dashboard/src/lib/features/course/pages/lesson.svelte`
- `apps/dashboard/src/lib/features/course/components/lesson/constants.ts`
- `apps/dashboard/src/lib/features/course/components/lesson/lesson-settings-tab.svelte`
- `apps/dashboard/src/lib/features/course/components/lesson/{video,slide,note,document}/*.svelte`
- `apps/dashboard/src/lib/features/course/components/lesson/utils.ts` (`getViewModeComponents`)
- `apps/dashboard/src/lib/features/course/utils/course-preview.ts`, `view-as-student-modal.svelte`
- `apps/dashboard/src/lib/features/course/utils/lesson-draft.ts`
- `apps/dashboard/src/lib/features/course/utils/public-course-mappers.ts`
- `apps/dashboard/src/lib/features/course/api/lesson.svelte.ts`
- `apps/dashboard/src/lib/features/course/pages/settings.svelte`, `reorder-material-tabs.svelte`
- `apps/dashboard/src/routes/(app)/courses/[id]/+layout.svelte`
- `apps/dashboard/src/routes/(app)/courses/[id]/lessons/[lessonId]/+page.svelte`
- `apps/dashboard/src/routes/(org-site)/course/[slug]/lesson/[itemSlug]/+page.svelte`
- `packages/ui/src/custom/public-course/lesson-view.svelte`
- `packages/ui/src/custom/underline-tabs/`
- `packages/ui/src/base/{page,sheet,drawer,sidebar}/`
- `packages/db/src/schema.ts` (`lesson`, `lessonLanguage`, `lessonLanguageHistory`, `asset`, `assetUsage` tables)
- `packages/db/src/queries/lesson/lesson.ts`
- `apps/api/src/routes/course/lesson.ts`, `apps/api/src/routes/course/lesson-language.ts`
- `apps/dashboard/src/lib/features/course/components/mobile/*.svelte`, `utils/mobile-bottom-nav.ts`

## Product Goals

1. An admin edits a lesson's Video, Note, Slide, and Document content within one authoring canvas, without a full-panel tab switch for routine editing.
2. An admin can check the learner-accurate experience of a lesson without leaving the editor or opening a new browser tab.
3. Lesson settings open as a contextual right-side drawer that keeps the canvas visible, instead of replacing it.
4. Every content capability that exists today remains available — this is an information-architecture and interaction redesign, not a functionality cut.
5. The redesign uses existing ClassroomIO design-system primitives; no new visual language is introduced.

## Non-Goals (v1)

- **Closing the public-site renderer's feature gap** (single video + note only, no slides/documents in `lesson-view.svelte`). Flagged as a discovered asymmetry; a separate PRD should own deciding whether/how the public renderer reaches parity with the in-app renderer.
- **The learner-facing experience itself** (in-app or public) — this PRD only reuses existing learner-rendering components for the in-editor preview; it does not redesign how learners experience a course.
- **A persistent split-view (editor | preview side-by-side).** Not proposed for v1 given no resizable-panel primitive exists in the design system today (see Confirmed Decision 5); worth revisiting if one is added later.
- **A free-form, Notion-style block canvas** (arbitrary drag-and-drop insertion of interchangeable rich-text blocks anywhere on the page). Video/Slide/Note/Document remain structurally distinct content types with their own edit affordances, not interchangeable blocks; `lessonTabsOrder` already provides type-level ordering, which is sufficient.
- **Moving the `lessonTabsOrder` reordering UI** into the lesson editor. It stays on the course-level Settings page; not addressed by this PRD.
- **New video/slide/document source integrations.** No new content-type capabilities are proposed — only how the existing ones are presented.
- **The broader admin dashboard**, course creation flow, enrollment, analytics, attendance, marks, submissions, certificates, compliance, or landing-page editing — all separate, untouched routes/features.
- **The course-level navigation shell** (left `CourseSidebar`, `CourseHeader`) — this PRD is scoped to the content area of a single lesson's editor.

---

## Functional Requirements

### 1. Unified Content Canvas (replaces the tab strip)

- All content types configured on the lesson (Video, Note, Slide, Document) render together as sections of one scrollable canvas, in the order defined by the existing `course.metadata.lessonTabsOrder` (reusing `orderedTabs()` from `constants.ts`, adapted to order canvas sections instead of tab items).
- Each section is edited using its existing component and existing add/edit flow, unchanged: `AddVideoModal` (6 source tabs), `SlideEmbedPicker` (10 platforms), the TipTap `TextEditor`, `AddDocumentModal`. No content-type component is rebuilt — only re-hosted so multiple are visible/editable together instead of being mutually exclusive.
- A content type with no data yet does not render an empty panel; it is only reachable through "Add content" (Requirement 2).
- The tab-switch interaction is fully retired for content — there is no remaining "click a tab to see a different content type" affordance; navigation between content types becomes scrolling.

### 2. Add Content

- An explicit "Add content" entry point lists the content types not yet present on the lesson (of the four: Video, Note, Slide, Document).
- Selecting a type launches its existing add flow unchanged (e.g. `AddVideoModal`). On completion, the new section appears inline in the canvas, positioned per `lessonTabsOrder`.
- Existing per-type "add another" affordances (e.g. adding a second video) are preserved within their section — this requirement only changes how a lesson goes from not having a type to having it.

### 3. Preview

- A header-level Edit/Preview toggle switches the canvas to a read-only render using the existing `getViewModeComponents` path (the same components/order the authenticated in-app learner sees) and back.
- Preview is persistently labeled as showing the **in-app learner experience**; it does not claim parity with the public/unauthenticated course-site renderer, which has a known, documented gap (single video + note only).
- Toggling to Preview does not discard unsaved edits — the existing 2s-debounce autosave (Requirement 5) is relied upon to have already committed in-progress changes, consistent with how toggling `mode` behaves today.
- The existing `viewAsStudent()` course-level, new-tab preview flow is unchanged and remains available as a supplementary "check the actual public page" action; it is not replaced by the in-editor Preview toggle.

### 4. Settings Drawer

- A persistent "Settings" header action opens a right-side drawer (built on `@cio/ui/base/sheet` or `@cio/ui/base/drawer`) that occupies part of the screen; the canvas remains visible and interactive behind/beside it.
- The drawer contains exactly `LessonSettingsTab`'s current fields: live-session call URL/date/timezone (`LIVE_CLASS` courses), completion policy + video-watch threshold + per-video watch enforcement, comments toggle. Field logic and validation are unchanged — only the hosting container changes from an `UnderlineTabs.Content` panel to a drawer body.
- The drawer closes via an explicit close control, Escape, or overlay click, and closing does not navigate or reset the canvas's scroll position.
- On small screens where a partial-width right drawer is not viable, the drawer may need to become full-width (see [UI/UX Requirements — Responsive](#responsive)); the exact breakpoint/behavior is an implementation decision, not fixed by this PRD.

### 5. Saving

- No change to persistence behavior: the existing 2s-debounced autosave, save-queue serialization (`lesson.svelte:239-249, 295-369`), and `localStorage` draft-recovery for notes (`utils/lesson-draft.ts`) are preserved as-is. This PRD changes layout and navigation, not how or when data is written.

### 6. What Remains Unchanged

All six video sources, all ten slide-embed platforms, the hand-rolled PDF viewer, per-locale note content with version history, per-lesson comments, live-session scheduling, completion-policy/watch-threshold settings, and course-level `lessonTabsOrder` configurability — none of this is proposed for removal or modification beyond its hosting container.

---

## Information Architecture

**Today:** `Video | Note | Slide | Document | Settings` are five destinations an admin actively selects, one visible at a time, via a tab strip.

**Proposed:** the four content types become **sections within one authoring canvas**, discovered by scrolling in the admin's configured order, rather than destinations selected by clicking. A lesson with only a Note and a Video shows just those two sections; the other two are reachable through "Add content," not shown as empty panels. Settings is removed from this navigation model entirely and becomes a **contextual overlay** — a persistent header action opening a drawer — conceptually separate from content navigation rather than a sixth tab-like destination. "What content exists on this lesson" becomes visible at a glance by scrolling the canvas, rather than requiring a click into each tab to check; the existing per-tab `badgeValue` count mechanism (`constants.ts`) is repurposed as an indicator on the "Add content" entry point for types not yet present.

Concretely, admins discover and access each content type as follows:

| Content type | Discovery | Access |
| --- | --- | --- |
| Video (if present) | Visible as a canvas section | Edit in place; "Add video" within the section to add more |
| Note (if present) | Visible as a canvas section | Edit in place via TipTap editor |
| Slide (if present) | Visible as a canvas section | Edit in place; embed picker to add more |
| Document (if present) | Visible as a canvas section | Edit in place; upload to add more |
| Any type not yet present | Listed in "Add content" | Selecting it launches that type's existing add flow, then it becomes a canvas section |
| Settings | Persistent header action, always visible regardless of scroll position | Opens right-side drawer; does not change what's in the canvas |

---

## User Flows

**Flow 1 — Editing existing content.** Admin opens a course → opens a lesson → the canvas loads with all of the lesson's existing content sections visible (not hidden behind an inactive tab) → admin edits note text or swaps a video in place → autosave commits the change (existing 2s-debounce behavior) → the "Saving…/Saved" status label confirms persistence, matching current behavior.

**Flow 2 — Adding a new content block.** Admin opens the editor → uses "Add content" to add a type not yet present (e.g. a Slide when only a Video exists) → the existing add-flow for that type runs (e.g. `SlideEmbedPicker`'s platform picker) → the new section appears inline in the canvas, positioned per `lessonTabsOrder`.

**Flow 3 — Opening settings.** Admin clicks "Settings" → a right-side drawer slides in over part of the screen → the canvas remains visible behind it → admin changes completion policy or comments toggle (the same fields `LessonSettingsTab` exposes today) → closes the drawer (X, Escape, or overlay click) → returns to the exact scroll position/editing context, no navigation or reload.

**Flow 4 — Previewing as a learner.** Admin is editing lesson content → toggles Preview → sees the lesson rendered via the same components the authenticated in-app learner sees, clearly labeled as the in-app experience → toggles back to Edit without losing state.

---

## UI/UX Requirements

- **Header:** retains lesson title, lock/unlock, slug (public courses), version history, and Save/status indicator — unaffected, already in `LessonPageEditHeader`. Adds a Settings action and an Edit/Preview toggle.
- **Course/lesson context:** unaffected — the left `CourseSidebar` and `CourseHeader` from `+layout.svelte` remain the persistent navigation shell around the lesson content area.
- **Main editing canvas:** shows configured content sections in `lessonTabsOrder`; each section is directly editable in place using its existing component; scroll replaces tab-click as the navigation model between content types.
- **Content sections:** each keeps its existing internal UI (video card grid + modal, slide embed picker, TipTap note editor, document list with hand-rolled PDF viewer) — only the outer hosting changes from an isolated tab panel to a section within the canvas.
- **Content type selection ("Add content"):** lists only types not yet present on the lesson; launches that type's existing, unmodified add flow.
- **Preview:** full-content, read-only render using `getViewModeComponents`; reachable via the header toggle; persistently labeled as the in-app learner experience (not the public page).
- **Settings drawer:** opens from the right, partial width, canvas remains visible; explicit close affordance (X / Escape / overlay click); contains exactly `LessonSettingsTab`'s current fields.
- **Saving/autosave:** unchanged status-label behavior ("Saving…"/"Saved"), unchanged debounce and save-queue logic.
- **Empty states:** reuse the existing `Empty` component pattern; a lesson with no content at all prompts "Add content" rather than showing empty tab panels for each type.
- **Loading states:** no behavior change from what `lesson.svelte`/`lessonApi` already do while fetching a lesson.
- **Error states:** no behavior change from existing `lessonApi`/`BaseApiWithErrors` error-surfacing patterns.
- **Unsaved changes:** no new guard introduced or removed — autosave continues to be the mechanism that minimizes unsaved-state risk, as it is today.
- **Responsive behavior:** <a id="responsive"></a> the tab strip's horizontal-scroll pattern is retired in favor of a stacked canvas, which is inherently more mobile-friendly than switching tabs on a narrow screen. The settings drawer's small-screen behavior (e.g. a full-width sheet on phone widths, since a partial-width right drawer may not be viable there) needs an explicit implementation decision — not fixed by this PRD, flagged in [Risks and Mitigations](#risks-and-mitigations).

---

## Technical Design

### Reusable as-is

- `Note`, `Slide`, `Video`, `Document` components and their internal add/edit flows (`AddVideoModal`, `SlideEmbedPicker`, TipTap `TextEditor`, `AddDocumentModal`) — no rebuild, only re-hosting outside the `UnderlineTabs.Content` wrapper.
- `getViewModeComponents` / the existing `mode=view` render path — becomes the technical basis for the in-editor Preview toggle.
- `orderedTabs()` / `course.metadata.lessonTabsOrder` — becomes the ordering mechanism for canvas sections instead of tab items.
- Autosave, save-queue, and `localStorage` draft-recovery logic in `lesson.svelte` and `utils/lesson-draft.ts` — unchanged.
- `@cio/ui/base/sheet` and `@cio/ui/base/drawer` — existing, currently unused for lesson settings; natural basis for the settings drawer per the design system's own primitives.
- `Empty` component and the `Chip` badge pattern — reusable for empty-state and "content exists" indicator treatment on the Add-content entry point.

### Likely needs refactoring

- `apps/dashboard/src/lib/features/course/pages/lesson.svelte` — the `UnderlineTabs.Root` block (lines ~569-625) is the core of what changes; the `mode`/`currentTabValue`/`setTabQueryParam` logic (`toggleMode`, lines 165-173 and 221-232) needs to become edit/preview-toggle + canvas-scroll logic instead of tab-index logic.
- `lesson-settings-tab.svelte` — needs to be re-hosted inside a `Sheet`/`Drawer` instead of an `UnderlineTabs.Content` panel; its field logic does not need to change.
- `constants.ts`'s `MaterialTab` model — the `value`/tab-index concept may no longer be the right shape once tabs aren't the navigation mechanism; the "Add content" affordance needs a way to know which of the four types are not yet present on a given lesson (derivable from existing lesson data — non-empty `videos`/`slides`/`documents` arrays and note content — no new field needed).

### Data model and API

No changes anticipated. `lesson.videos`/`slides`/`documents` (jsonb arrays), `lesson.note` (legacy)/`lesson_language` (current), `PUT /course/:courseId/lesson/:lessonId`, and `apps/api/src/routes/course/lesson-language.ts` continue to read/write exactly the same data — only how it is presented and edited changes. If implementation discovers a need for a data-model change (e.g. tracking canvas-specific state), that is a deviation from this PRD's assumption and should be flagged before proceeding.

### Migration and backward compatibility

- No backfill needed — existing lessons render immediately in the new canvas layout using their current `lessonTabsOrder` and content data.
- The public/unauthenticated course-site renderer (`lesson-view.svelte`) is unaffected by this PRD and continues to render only a single video + note; that gap is surfaced to admins via Preview labeling, not resolved here (see [Non-Goals](#non-goals-v1)).
- Existing courses/lessons must continue to render correctly for learners (both in-app and public) after this ships — no lesson content should be lost, altered, or reordered as a side effect of the canvas/drawer refactor.

---

## Implementation Order

1. **Canvas refactor.** Replace the `UnderlineTabs.Root` block in `lesson.svelte` with a stacked-section canvas driven by `orderedTabs()`/`lessonTabsOrder`; re-host `Note`/`Slide`/`Video`/`Document` as sections instead of tab panels. Verify existing add/edit flows for each type still function unchanged inside the new hosting.
2. **Add content entry point.** Build the "Add content" affordance that lists content types absent from the current lesson and launches their existing add flows.
3. **Settings drawer.** Re-host `LessonSettingsTab`'s fields inside a `Sheet`/`Drawer` opened from a new header action; remove the Settings tab from the (now-retired) tab strip.
4. **Preview toggle.** Add the Edit/Preview header toggle, wired to the existing `getViewModeComponents` render path; add the "in-app learner experience" label.
5. **Responsive pass.** Confirm the stacked canvas behaves correctly at existing supported breakpoints; decide and implement the settings drawer's small-screen behavior.
6. **Verification.** Run `pnpm --filter @cio/dashboard^... build && pnpm --filter @cio/dashboard build` per this repo's dashboard verification requirement; manually confirm existing published courses still render correctly for learners in both the in-app and public views.

---

## Acceptance Criteria

1. Admins can view and edit a lesson's existing Video, Note, Slide, and Document content within one canvas, without switching between isolated tab panels.
2. All existing content capabilities remain available and unchanged: 6 video sources, 10 slide-embed platforms, document upload with the existing PDF viewer, TipTap rich-text notes with version history, completion policy + watch threshold + per-video watch enforcement, comments toggle, live-session fields (`LIVE_CLASS` courses), and course-level `lessonTabsOrder` configuration.
3. The editing experience no longer depends on the retired tab strip for content navigation — scrolling the canvas is the only way to move between content sections.
4. Admins can view a learner-accurate preview of the lesson (using the same components as the authenticated in-app learner view) without navigating to a new tab or route.
5. The preview is clearly labeled as representing the in-app learner experience and does not claim parity with the public/unauthenticated course-site renderer, which has a documented feature gap (no slides/documents).
6. Settings open in a right-side drawer that does not cover the full page; the canvas remains visible/legible while the drawer is open.
7. Closing the settings drawer returns the admin to their exact prior scroll position/editing context with no data loss.
8. All fields currently in `LessonSettingsTab` are present and functional inside the new settings drawer.
9. Autosave, save-status labeling, and draft recovery behave exactly as they do today — no regression in save reliability.
10. Existing published courses/lessons render correctly for learners (both in-app and public-site) after this change ships — no lesson content is lost, altered, or reordered as a side effect of the redesign.
11. The new editing layout works at desktop and at the app's existing supported mobile breakpoints without relying on the retired horizontal tab-scroll pattern.
12. The existing `viewAsStudent()` full-page/public preview flow continues to work unchanged as a supplementary check, separate from the new in-editor preview.
13. `course.metadata.lessonTabsOrder` continues to control content order, now applied to canvas sections instead of tabs.
14. `pnpm --filter @cio/dashboard^... build && pnpm --filter @cio/dashboard build` pass after implementation.

---

## Risks and Mitigations

- **Risk:** Building this UI-heavy redesign directly from prose risks drifting from what's actually workable in the design system, since no clickable prototype exists yet.
  - **Mitigation:** Before implementation, consider building `prototypes/course-editor-redesign/` per `skills/write-prd/SKILL.md` (as `prd/slide-builder/` and `prd/video-library/` did) covering: canvas with 2+ content sections, empty/Add-content state, settings drawer open/closed, and the Edit/Preview toggle — using the real `app-theme.css` tokens. This PRD intentionally does not include prototypes (see [Status](#status)).
- **Risk:** A partial-width right-side drawer may not be viable at phone widths, and no PRD-level decision fixes this.
  - **Mitigation:** Default to a full-width sheet below a defined breakpoint (consistent with how `@cio/ui/base/sheet` already commonly degrades), decided during implementation rather than blocking on this PRD.
- **Risk:** Removing the tab strip removes the only existing mechanism admins use today to jump directly to a specific content type (e.g. jump straight to Settings-adjacent fields), potentially adding scroll friction on long lessons.
  - **Mitigation:** Consider an in-canvas jump-to-section affordance (e.g. anchored mini-nav) if user feedback after shipping shows this is needed; not required for v1 per the "don't overdesign" direction in the product brief.
  - **Reference:** the existing `PageOutline` component (`@cio/ui/custom/page-outline`) may be a low-effort reuse candidate for this if it becomes necessary.
- **Risk:** Labeling Preview as "in-app learner experience" while a real capability gap exists against the public renderer could still confuse admins who assume "preview" means "what will be published."
  - **Mitigation:** Explicit, persistent copy in the Preview state naming the distinction (e.g. "Previewing as a logged-in learner — the public course page may render this differently"), rather than silently presenting an idealized view.
- **Risk:** Re-hosting four independently-built components (video/slide/note/document) into one scrollable canvas may surface layout/CSS conflicts (e.g. sticky headers, modal z-index) that didn't matter when each rendered alone in its own tab panel.
  - **Mitigation:** Implementation should verify each content type's add/edit modals and pickers still render correctly with multiple sections mounted simultaneously, not just in isolation.
