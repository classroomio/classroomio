# Public Courses PRD

## Purpose
Enable course creators to publish **Public Courses** — a new course type where content is fully accessible without signup. Public courses treat every visitor as a guest: there is no "sign in to unlock" flow, no progress tracking, no submissions sent to the server. The goal is a low-friction, SEO-indexable surface that creators can use as top-of-funnel content marketing.

## Product Goals
1. Add a third course type: **Public** (alongside Live Class and Self Paced; Compliance stays unchanged).
2. Allow anonymous browsing of a public course's full tree (sections, lessons, exercises) with clean readable URLs.
3. Keep the implementation deliberately small: no auth gating on public courses, no server-side submissions, no analytics, no donations, no live viewer counts.
4. Give creators a single customizable **Callout** to drive viewers somewhere (main site, sign-up, paid course, etc.).
5. Design the lesson surface as a focused, distraction-free reading/watching experience.

## Non-Goals (v1)
Everything below is explicitly out of scope for this PRD:
- Guest vs authenticated distinction on public courses (everyone is treated the same)
- Progress tracking (server, database, or localStorage)
- Server-side exercise submissions and scoring
- Guest-to-account conversion / progress merge
- Analytics, guest events, conversion funnels
- Live viewer counts / "people learning now"
- Donations / Stripe payment links on public courses
- Public-courses directory or landing-page tab
- Feature flag / phased rollout gating
- Downloadable asset gating
- Discussion / community for public courses
- Per-lesson public/private toggle beyond the existing lock state
- Public course certificates

## User Roles

Public courses have **one** viewer role: everyone. Authentication state does not change what a viewer can do on a public course — a logged-in user visiting a public course is treated identically to an anonymous visitor.

### Course Creator / Admin
- Selects course type at creation: **Live Class | Self Paced | Public** (Compliance remains a separate flow).
- Can convert an existing course between types (behavior of conversion is not changed by this PRD).
- When the course type is `PUBLIC`:
  - The question-type picker is filtered to **only auto-gradable** question types.
  - Per-item slugs (lesson / exercise) are editable; otherwise they are auto-generated from the title.
  - A **Callout** settings panel is available (title, description, button label, button URL).

## Functional Requirements

### 1. Course Type Selection

`COURSE_TYPE` enum today is `['SELF_PACED', 'LIVE_CLASS', 'COMPLIANCE']` with default `'LIVE_CLASS'`. This PRD changes it to:

```
enum COURSE_TYPE = ['SELF_PACED', 'LIVE_CLASS', 'COMPLIANCE', 'PUBLIC']
default = 'SELF_PACED'
```

Changing the default from `LIVE_CLASS` to `SELF_PACED` is intentional.

A public course must still have `isPublished = true` to be reachable at its public URL. An unpublished public course behaves like any other unpublished course (not accessible).

### 2. Only Auto-Gradable Question Types in Public Courses

Public courses are graded **entirely on the client**. The question-type registry already exposes an `autoGradable: boolean` flag on every question type.

- When the course type is `PUBLIC`, the question-type picker only shows question types with `autoGradable === true`.
- The API rejects attempts to attach a non-auto-gradable question to an exercise belonging to a public course.
- If a course is converted **into** `PUBLIC` and it already contains non-auto-gradable questions, the conversion is blocked with a clear error listing the offending questions. (No silent data loss.)

### 3. Lock State (reuse existing)

Public courses reuse the existing `lesson.isUnlocked` flag (and the existing `exercise.isUnlocked` flag) as the gate for "free vs gated" content.

- `isUnlocked = true` → content renders normally.
- `isUnlocked = false` → the content area is replaced by the course's **Callout** (see §5). The sidebar row for a locked item still renders, with a lock icon next to the number.

Since every visitor is treated as a guest, there is no "sign in to unlock" path. A locked item is a call-to-action surface for the creator's callout.

### 4. Public URLs and Slugs

#### Routes
```
(org-site)/course/[courseSlug]                    # course overview: tree of sections/lessons/exercises
(org-site)/course/[courseSlug]/lesson/[itemSlug]  # a single lesson or exercise page
```

The URL segment is always `/lesson/` whether the item is a lesson or an exercise. The `itemSlug` resolves to one or the other.

#### Slug storage
- Add `slug VARCHAR` to `lesson` and `exercise` tables.
- Slugs are **unique per course** across both `lesson` and `exercise` (they share the same URL segment).
- On lesson / exercise create, slug is auto-generated from the title (kebab-case, collision-resolved by appending `-2`, `-3`, ...).
- On title rename, slug is **not** automatically updated (URLs are stable).
- When the course type is `PUBLIC`, creators can edit the slug from the lesson / exercise settings UI.
- When the course type is not `PUBLIC`, slugs are still generated and stored (so converting a course to `PUBLIC` later works) but are not surfaced in the UI.

#### Slug format
- 1–80 chars, `[a-z0-9]` with single `-` separators, no leading/trailing `-`.
- Validated on both client and server with a shared Zod schema.

### 5. Data Loading Strategy

- `GET (org-site) /course/[courseSlug]` loads the **full tree** server-side: course metadata, sections, lessons, exercises, slugs, titles, order, and `isUnlocked`. No lesson bodies, no exercise question bodies.
- `GET (org-site) /course/[courseSlug]/lesson/[itemSlug]` loads the **content** of the single item server-side (video URL, lesson body, or exercise questions with answer keys). This render is SSR for SEO.
- The tree is not re-fetched when the client navigates between lesson URLs — it is passed down through the shared `+layout.server.ts`.

### 6. Lesson Page Layout

Reference designs in `prd/public-courses/design/`:
- `lesson-page-reference.png` — overall layout
- `lesson-page-full.png` — full composition (hero video + title + body)
- `sidebar-active-state.png` — active lesson state in the sidebar

Two-column, non-collapsible layout. No hamburger toggle, no accordion on the sidebar, no hide/show. Sidebar is always visible on desktop.

#### Left sidebar (navigation)
- Grouped by the course's **sections** (existing `courseSection` / lesson-section concept).
- Each section renders:
  - A small, muted section heading (e.g. "AI Foundations"). Plain text — not a button, not collapsible.
  - A vertical list of that section's lessons and exercises, in their existing `order`.
- Each row contains:
  - A **square number badge** on the left with the per-section index (1, 2, 3, …). Numbering resets at the start of each section and is shared across lessons + exercises (they interleave by `order`).
  - The item title to the right of the badge.
  - If the item's `isUnlocked === false`, a lock icon replaces the number badge or sits next to it (final placement: TBD with design).
- The active item (matching the current `itemSlug`) renders with:
  - **Primary color** (the app's `--primary` token, *not* the hard-coded orange in the screenshots) filling the number badge background, white number text.
  - **Primary color** title text.
  - A subtle primary-colored vertical accent bar on the far left edge (outside the sidebar content area, aligned with the row).
- Hover state (non-active rows):
  - Number badge gets a slightly darker muted fill.
  - Title text gets a subtle color shift (muted-foreground → foreground).
  - Cursor is pointer.
- No icons on normal rows, no progress rings, no status dots. Keep it text-first.

#### Right content column
Vertical order, top to bottom:
1. **Video** (if the item has one) — full-width within the content column, rounded corners, single centered play affordance. Omitted entirely if no video (no empty placeholder).
2. **Section label** — small, muted text above the title (the name of the section this item belongs to).
3. **Item title** — large, prominent heading.
4. **Body** — prose / rich text for lessons, or the rendered question UI for exercises. Readable line length, generous line-height.
5. **Callout** (see §7) — rendered as an inline card at the bottom of the body, only if the course has a callout configured.

If the item is **locked** (`isUnlocked = false`), the body and video are replaced by the callout card rendered in a larger, centered variant; steps 1–4 above are skipped.

No top banner, no hero image above the video, no breadcrumb. Minimal page chrome.

#### Responsive

**Desktop (≥ `lg`)**
- Two columns: sidebar fixed width on the left, content column fluid on the right.
- Sidebar is always visible (not collapsible).
- No bottom navigation bar.

**Mobile / tablet (< `lg`)**
- The left sidebar is **hidden**.
- A **fixed bottom navigation bar** is pinned to the viewport. It has three regions:
  - **Left**: previous-item button (arrow-left icon). Navigates to the previous item in the flattened, section-ordered sequence. Disabled visually at the first item.
  - **Center**: large tap target. Shows the current item's position (e.g. the per-section number badge + the item title, or "3 / 12"). Tapping opens a bottom sheet.
  - **Right**: next-item button (arrow-right icon). Disabled visually at the last item.
- The bottom sheet (built on `@cio/ui/base/drawer` — vaul-based) slides up from the bottom and contains the **full sidebar tree**: every section with its heading and every numbered row. The sheet supports the native drag-to-dismiss gesture ("swiper from bottom up"). The current item is visually active in the sheet. Tapping a row navigates and auto-closes the sheet.
- The content column takes the full viewport width minus the bottom bar's height. The page adds bottom padding equal to the bar's height so the callout / body never sits under the bar.
- The bottom bar uses `--primary` for the center button's accent (matching the sidebar active state) and solid surface background with a top hairline border.

**Shared**
- "Prev / next sequence" is the flat `ORDER BY sections.order, items.order` across all items (lessons + exercises interleaved). Locked items are part of the sequence — tapping prev/next into a locked item still navigates; the locked state is then rendered in the content column as described in §6.
- Keyboard shortcuts on desktop: `←` / `→` also move through this sequence (nice-to-have, not required for v1 acceptance).

#### Colors
All accent colors in the sidebar must resolve to the app's **primary** color token (`--primary`), not the hard-coded orange visible in the reference screenshots. The screenshots are from Cursor Learn and are included purely as a layout reference.

### 7. Creator Callout (per-course setting)

Each public course has an optional **Callout** configured by the creator:

```typescript
type CourseCallout = {
  title: string;        // short, 1 line
  description: string;  // 1–3 lines
  buttonLabel: string;  // e.g. "Read more on my site"
  buttonUrl: string;    // absolute URL, validated
} | null;
```

- Stored as a nullable JSONB column on `course` (e.g. `callout`).
- Configured from the course settings page (only visible when course type is `PUBLIC`).
- Rendered on the public lesson page:
  - As an inline card at the bottom of the lesson/exercise body (on every item).
  - As the full replacement when an item is locked (larger centered variant).
- Opens `buttonUrl` in a new tab (`target="_blank" rel="noopener"`).

When `callout` is `null`, no callout is rendered anywhere (lesson still reads cleanly without it; locked items show a plain "This lesson is locked" state).

### 8. Client-Side Grading

For exercises on a public course:
- The server ships full question data including answer keys to the client.
- Grading happens entirely in the browser — correctness, explanations, and "you got X / Y correct" all computed locally.
- No submission is sent to the server.
- No attempt history is recorded.
- Refreshing the page resets the exercise state.

This is an intentional trade-off: public courses are marketing surfaces, so answer keys are not considered sensitive.

### 9. SEO

- Public course lesson URLs render server-side (SvelteKit SSR).
- Each lesson page sets:
  - `<title>` = item title + course title
  - `<meta name="description">` = course description or first ~150 chars of the item body
  - `<link rel="canonical">` = the public URL
  - `og:type=article`, `og:title`, `og:description`, `og:image` (course banner)
- Locked items still render meta tags but the body is replaced by the callout; the `<description>` falls back to the course description.
- No `robots` meta restrictions beyond what the org already sets globally.

## Data Model Changes

### `course` table
- `type` enum: add `'PUBLIC'`, change default to `'SELF_PACED'`.
- New column `callout JSONB NULL` (shape described in §7).

### `lesson` table
- New column `slug VARCHAR NULL`.
- Backfill existing rows with kebab-cased titles (collision-resolved per course).
- After backfill, `slug` becomes `NOT NULL` in a follow-up migration.
- Existing `public BOOLEAN` column is deprecated — not referenced in new code. Column is **not** dropped in this PRD (to keep the migration small).

### `exercise` table
- New column `slug VARCHAR NULL`, same treatment as `lesson.slug`.

### Slug uniqueness
- Enforced at the application layer: a slug is unique per-course across the union of `lesson.slug` and `exercise.slug`.
- A DB-level constraint is not added in v1 (would require a materialized view or a trigger across two tables); application code must check before insert/update.

## API Changes

### New / modified endpoints (high level)

```
GET  (public) /org-site/course/:courseSlug
  → Returns course metadata + tree (sections, lessons, exercises with slugs, titles, order, isUnlocked).
  → No auth required when course.type === 'PUBLIC' && course.isPublished === true.

GET  (public) /org-site/course/:courseSlug/item/:itemSlug
  → Returns either a lesson content payload or an exercise payload (with answer keys).
  → Response is a single shape with a discriminator field (e.g. `kind: 'lesson' | 'exercise'`).
  → No auth required under the same conditions as above.

PATCH (authed) /courses/:courseId/lessons/:lessonId
  → Accepts `slug` field (validated against slug regex and per-course uniqueness).
PATCH (authed) /courses/:courseId/exercises/:exerciseId
  → Accepts `slug` field (same validation).

POST (authed)  /courses/:courseId/exercises/:exerciseId/questions
PATCH (authed) /courses/:courseId/exercises/:exerciseId/questions/:questionId
  → Reject non-auto-gradable question types when the parent course is PUBLIC.

PATCH (authed) /courses/:courseId
  → Accepts `callout` object (nullable).
  → Accepts `type` (validates transition, including the "no non-auto-gradable questions exist" check when converting to PUBLIC).
```

Per the repo's single-response-shape rule: the item endpoint returns one response shape with a `kind` discriminator; client narrows on `kind`.

## UI Components Needed

- `PublicCourseShell` (layout wrapper: sidebar + content)
- `PublicCourseSidebar` (the numbered, sectioned nav — reusable for any item count)
- `PublicCourseSidebarRow` (number badge + title + lock state)
- `PublicLessonView` (video + section label + title + body + callout)
- `PublicExerciseView` (exercise questions rendered for client-side grading)
- `PublicCourseCallout` (inline + locked variants)
- `CourseCalloutSettings` (creator settings panel, only visible when course is PUBLIC)
- `LessonSlugField` / `ExerciseSlugField` (editable slug inputs in item settings, only visible when course is PUBLIC)

Existing components (`QuestionRenderer`, `QuestionList`, etc.) are reused for exercise rendering, configured with the client-grading mode.

## Storybook-First Build

The public course UI is built as a set of Storybook components and consumed by the `(org-site)` routes. Stories are the primary development + review surface — reviewers test desktop and mobile layouts in Storybook before the routes are wired up.

Required stories (at minimum):
- `PublicCourseShell` — desktop and mobile viewports, with and without callout.
- `PublicCourseSidebar` — default state, with a locked item, with many sections.
- `PublicCourseSidebarRow` — default, hover, active, locked variants as individual stories.
- `PublicCourseBottomNav` — first item (prev disabled), middle item, last item (next disabled).
- `PublicCourseMobileSheet` — closed and open states (open state is the default story for review).
- `PublicLessonView` — with video, without video, long body, short body.
- `PublicExerciseView` — unanswered, mid-answer, after-grade (client-side).
- `PublicCourseCallout` — inline and full (locked) variants, and "no callout configured" fallback.
- `PublicCoursePage` — composed story showing the full page; run with Storybook's viewport addon to verify desktop and mobile side-by-side.

All stories must resolve colors through the app's theme tokens (`--primary`, etc.), not hard-coded values.

## Open Items (non-blocking)

- Precise placement of the lock icon in a sidebar row (inside the number badge, replacing it, or beside it) — design review later.
- Center button content in the mobile bottom bar — "3 / 12" vs "Section • item title" vs both — finalized during Storybook review.

## Success Criteria

1. A creator can set a course's type to `PUBLIC` and the course becomes reachable at `(org-site)/course/[slug]` with no sign-in required.
2. The question-type picker hides non-auto-gradable types when the course type is `PUBLIC`.
3. Lesson and exercise slugs are auto-generated and editable (for public courses).
4. Locked items on a public course render the creator's callout in place of content; unlocked items render normally.
5. Exercises on public courses are graded entirely in the browser with no server submission.
6. The lesson page layout matches the reference designs: non-collapsible sidebar, per-section numbering, content column order (video → section label → title → body → callout).
7. All accent colors resolve to `--primary`, not a hard-coded orange.
