# Learning Paths PRD

## Status

- Draft (prototyped, ready for engineering review)

## Prototypes — the UX source of truth

**The UX of this feature must be taken from the prototype folder.** Interactive HTML prototypes for every surface live in [`prototypes/learning-paths/`](../../prototypes/learning-paths/) and are the approved design reference for layout, states (done / in progress / locked), copy, and navigation flow. When this document and a prototype disagree on a UI detail, the prototype wins.

**Start here:**

```
prototypes/learning-paths/index.html
```

Open it in a browser (`open prototypes/learning-paths/index.html`) — it maps all three journeys (visitor → learner → teacher) and every page cross-links so you can click through each flow end to end. Each page has a light/dark toggle.

The prototypes are built on the real design tokens (`packages/ui/src/index.css` for app pages via `app-theme.css`, the `minimal` org-landing theme for public pages via `landing-theme.css`) and encode every decision below.

| Surface | Files |
| --- | --- |
| Public (org site) | `org-landing.html`, `public-paths.html`, `public-path.html` |
| Learner (LMS) | `lms-home.html` (Dashboard), `mylearning.html` (My Learning → Learning Paths), `mylearning-courses.html` (My Learning → Courses), `paths.html`, `path-detail.html`, `course-in-path.html`, `explore.html`, `assignments.html`, `assignment-detail.html`, `certificates.html`, `community.html`, `settings.html` |
| Teacher (admin) | `teacher-paths.html`, `teacher-path-setup.html`, `teacher-path-builder.html`, `teacher-path-people.html`, `teacher-path-analytics.html`, `teacher-path-landing-editor.html`, `teacher-path-certificate.html`, `teacher-path-settings.html` |

**Scope note:** the Learner surface above is the full enrolled-student shell, not just the path-specific screens — Explore, Assignments, Certificates, Community, and Settings are the other primary destinations a student needs day to day, and Learning Paths only make sense in the product once they're seen alongside that shell (where a path sits next to ordinary courses, assignments, and certificates rather than in isolation). They're prototyped here, in this PRD, rather than split into a separate one, because the sidebar IA, card system, and status-color language below are shared across all of them and would otherwise drift. Redesign work on any of these screens should start from these prototypes.

## Purpose

Let orgs package multiple courses into an **ordered, sequentially unlocked, bundle-priced learning path** that is sold on the org's public site, completed step-by-step in the LMS, and finished with an optional path certificate. Reference experience: Coursera Professional Certificates (e.g. IBM Data Science).

## Problem Statement

- Courses can only be sold and taken individually; there is no way to sell a curriculum as one product with one price.
- Programs (shipped) group courses for cohort admin purposes but are explicitly **unordered**, have no gating, no public page, no pricing, and no path-level certificate.
- Instructors who run structured curricula cannot enforce prerequisites ("finish JS before React").
- The org landing page has no product above the individual course, so multi-course offerings are invisible to visitors.

## Confirmed Decisions

1. **New entity, separate from Programs.** `learning_path` is its own table set. Programs remain unchanged (cohort hub + newsfeed). No migration.
2. **Terminology**: "Learning Path" everywhere (admin, LMS, public site).
3. **Self-enrollment with bundle pricing.** A path is public on the org landing site with one price. Enrolling (buy or free) auto-enrolls the learner in every course in the path.
4. **Show savings.** The public page shows the bundle price against the summed individual course prices ("$199 ~~$280~~ · Save $81 (29%)"). Toggleable per path.
5. **Unlock rule = lessons + exercises.** Course N+1 unlocks when course N has every lesson complete AND every exercise submitted/passed. Sequential unlocking is a per-path toggle (off = take in any order).
6. **Path certificate is a teacher toggle** with its own admin tab; issued automatically on full completion; appears in the learner's LMS Certificates page.
7. **Teacher workspace tabs**: Courses (ordering), People, Analytics, Landing page, Certificate, Settings. **No path newsfeed** (Programs covers cohort communication).
8. **Visitor access is teacher-configurable**: teaser only / full syllabus / syllabus + preview lessons.
9. **Public path page follows the Coursera professional-certificate shape**: hero with stats + enroll CTA, what-you'll-learn, skills tags, sequential course cards with per-course outcomes and lesson outlines, certificate block, instructors, testimonials, FAQ accordion, pricing card.
10. **Org landing page: Learning Paths section sits ABOVE the Courses section.** Plus a `/paths` catalog page and `/path/[slug]` detail page mirroring how `/courses` and `/course/[slug]` work today.
11. **Course independence**: a course can be in multiple paths and remain individually sellable. Removing a course from a path or a learner from a path never deletes `groupmember` rows or progress.
12. **Statuses**: `ACTIVE` (public + LMS), `DRAFT` (hidden while building), `ARCHIVED` (hidden everywhere, restorable).
13. **Enrolled-student sidebar IA** (see `lms-home.html` etc.): **Main** — Dashboard, My Learning, Explore, Assignments, Community; **Personal** — Certificates; pinned above the account footer — Settings. "Cohorts" is not a standalone nav destination in this IA; enrolled cohorts remain reachable at `paths.html`/`path-detail.html` (unchanged routes) via My Learning rather than their own sidebar entry. "Exercises" is renamed "Assignments" in the nav label and page copy only — no route rename, to avoid breaking existing deep links. **Dashboard** (`lms-home.html`) is the action/progress-first landing page (greeting, stat overview, one Continue-Learning hero, a compact snapshot); **My Learning** (`mylearning.html`) is the full library — the two are deliberately not the same page, per the "reduce cognitive load" principle of showing less on the page whose job is to say "what's next," and more on the page whose job is "everything I'm enrolled in."
14. **My Learning drops tabs for a single content-type dropdown** (superseding the tabbed layout from Decision 13): a "Learning Paths ▾ / Courses ▾" selector is the one control that decides what's on the page — never two competing nav patterns at once. Rationale: with Explore already the place to discover new content, a third "Explore More" tab inside My Learning duplicated navigation; it survives only as a small teaser strip at the bottom of the Learning Paths view (Decision 15), not a tab. Content-type dropdown, a **Filters** popover (options scoped to whichever content type is selected — Learning Paths get Status/Difficulty/Category, Courses get Status/Category/Duration), and a **Grid/List** view toggle sit in one toolbar row above the content; switching any of the three never discards the other two states (e.g. changing content type keeps the chosen view). Grid is the default view. The same dropdown, filter-popover, and view-toggle components are shared verbatim by both content types and by Explore's filter (Decision 16), so they read as one system rather than three bespoke controls.
15. **Explore More Learning Paths** is a fixed strip at the bottom of My Learning's Learning Paths view only (not Courses) — a one-line tagline, three recommended (not-yet-enrolled) path cards, and a "View more" link (Decision 32) to the full Explore page. It exists to hand off to discovery without turning My Learning into a second Explore page.
16. **Explore drops category tabs and the Sort control.** Category is still a real filter dimension (it was previously a row of always-visible chip tabs), it just moves inside the same Filters popover as Difficulty and Duration, alongside a Content Type filter (Learning Paths / Courses) — one clean entry point instead of three competing controls (tabs + sort + filters) fighting for the same row. Search stays a first-class, always-visible control. Learning Paths and Courses keep their own labeled sections on the page (not a merged feed) specifically because Decision-13's content-type badges need a section-level home to stay legible at a glance.
17. **Content-type labels are a single reusable pattern**: `LEARNING PATH` and `COURSE` pills (`.badge-path-label` / `.badge-course-label` in `app-theme.css`) share identical typography, padding, and a glassmorphism treatment (Decision 27) — the only difference is the label text. Used identically on the Dashboard's Current Learning cards, every My Learning card/row, every Explore card, the Admin Learning Paths page, and — as a compact per-row marker — the numbered curriculum list inside Learning Path Detail. A course's relationship to its path is always the secondary line `Part of: {path name}` (`.part-of`), never a competing headline.
18. **Dashboard drops Recent Activity and Weekly Study Hours** (both were right-rail-only content with no other consumer) rather than replacing them with different analytics — the two-column dashboard shell reverts to a single full-width column. The freed width goes to widening Current Learning from 2 to 3 cards per row and placing Upcoming Assignments and Explore Something New side by side at the bottom, so removing the rail reads as an intentional simplification, not a hole in the layout.
19. **Mobile navigation is a slide-in drawer, not a vanished sidebar.** Below 860px every page (course-in-path's own lesson-player shell excepted, per Decision 13's scope) gets a hamburger button in the topbar that opens the same sidebar content as an off-canvas panel over a dimmed backdrop; the sidebar is otherwise identical markup to desktop, just repositioned. This closes a real gap the previous responsive pass left (the sidebar used to just `display:none` with no replacement).
20. **My Learning moves its content-type switch into the sidebar, superseding Decision 14's in-page dropdown.** The sidebar's My Learning entry becomes an expand/collapse group (`.nav-parent`/`.nav-sub` in `app-theme.css`) containing two real destinations — Learning Paths (`mylearning.html`) and Courses (`mylearning-courses.html`) — and neither page renders any content-type control of its own (no dropdown, no tabs). This was a correction, not an addition: a control that decides *what's on the page* belongs with the rest of primary navigation, not floating inside the page body competing with page-level Filters/Grid-List controls. Both pages share one information hierarchy — **Currently Learning** (a single large hero card for the learner's one most-active path or course) **→ {Learning Paths | Courses}** (the rest of what they're enrolled in, filterable, grid/list) **→ Explore More {Learning Paths | Courses}** (a discovery strip, not a tab) — so a learner never has to hold two different mental models for the two pages.
21. **No Category filter on My Learning or Explore.** Category was never added to `learning_path`'s schema (Technical Design below) or to any course field this PRD defines — the chip row it used to power on Explore was decorative categorization invented at the mock-content layer, not real product data. Removing it (rather than reintroducing it as a filter) keeps every filter option backed by something the data model actually has: Status, Difficulty, Duration. If categories become a real schema concept later, add the filter back then, everywhere at once.
22. **List-view progress bars were rendering collapsed — root cause and fix.** `.progress`'s base rule sets `flex: 1` (i.e. `flex-basis: 0%`), which silently overrides an explicit `width` set on the same element elsewhere in the cascade — CSS resolves `flex-basis` before `width` for main-axis sizing. `.lp-row-progress .progress { width: 90px }` was therefore never applied; inside an unconstrained flex column (`.lp-row-side`) the bar collapsed toward zero width. Fixed with `flex: none` alongside the explicit `width`, plus a stable `width: 130px` on the `.lp-row-progress` container itself so it isn't sized by content. This one rule is shared by every list view in the product (My Learning's two pages, the Admin Learning Paths list view) — fixed once, in `app-theme.css`, not per page.
23. **One content-type badge component, one button vocabulary, everywhere.** `.badge-path-label` (filled primary) and `.badge-course-label` (filled secondary) share identical typography, padding, radius, and — critically — the same top-left overlay position on a card's cover image; Explore's Course badge had drifted into the card body while its Learning Path badge stayed on the cover, which is the inconsistency this fixes. Buttons converge on one vocabulary applied by state, not by page: `Continue Learning` (in-progress path), `Continue Course` (in-progress course), `View Learning Path` / `View Course` (not-yet-enrolled, discovery context), `View Certificate` (completed path), `Review Course` (completed course), `Manage` (admin). Every Dashboard Current Learning card now shows its CTA explicitly — previously some cards were click-anywhere with no visible button, which read as a different, lower-affordance pattern next to My Learning's explicit-button cards.
24. **No three-dot / ellipsis menu on any Learning Path card — student or admin.** The original (pre-existing) admin table row had one; it's removed with nothing added in its place. A Learning Path card's job is identity, progress, and one clear primary action; a menu of secondary actions is exactly the "traditional LMS management table" feel this redesign moves away from. If a genuinely necessary secondary action turns up later (e.g. duplicate, delete), it belongs on the path's own workspace page, not hidden behind a kebab on the listing card.
25. **Admin Learning Paths (`teacher-paths.html`) is restyled to the same design system as the student experience, scope-limited to this one admin page** (Decision 7's teacher workspace tabs — Courses/People/Analytics/Landing page/Certificate/Settings — are unchanged; only the top-level listing page changes). It gains: a performance overview (Active Paths, Enrolled Learners, Completions, Completion Rate as a progress ring, reusing the same `.ring` component as the student Dashboard), search + a contextual Filters popover (Status, Enrollment size, Completion-rate bucket — no Category, same reasoning as Decision 21), a Grid/List toggle sharing the exact `.apath-card`/`.lp-row` pattern the student side uses, status badges renamed to match the product's real lifecycle (`Draft` / `Published` / `Archived`, replacing the old ad hoc `Active`/`Inactive`), and a previewable empty state (toggle button in this prototype only, so the state is demonstrable without needing a truly empty data set). Per Decision 30, this page stops at the four metric cards — it does not also render an aggregate progress visualization.
26. **The level-dots difficulty indicator is removed from Learning Path cards** (Explore's grid). It was a permanent on-card decoration duplicating what Difficulty (a filter dimension, Decisions 20/25) already communicates on demand — removing it declutters the card down to identity, progress, course count, duration, status, and one primary action, per the "keep Learning Path cards clean" principle already applied to the three-dot-menu removal (Decision 24).
27. **All progress bars are one shared pill shape, and content-type badges are glassmorphism.** `.progress` and `.progress > span` use `border-radius: 999px` globally (`app-theme.css`) — this single change makes every progress bar in the product visually identical by construction, including the two places that had drifted from it (Dashboard's featured Learning Path card and the legacy `paths.html`, both of which used a per-course segmented bar instead of the plain bar everyone else uses — both converted to the plain pill bar here). `.badge-path-label`/`.badge-course-label` get a frosted-glass treatment: `backdrop-filter: blur(8px)` plus a translucent tint and a soft border, in two variants — primary-tinted glass as the default (for badges on plain card/list backgrounds) and white-tinted glass wherever the badge overlays a colored cover image (`*-cover .badge`), since a primary tint would fight with arbitrary gradient colors there.
28. **The "Currently Learning" hero card (both My Learning pages) is a deliberately more premium treatment than an ordinary listing card**, not just structurally (it already was `.card`) but visually: a subtle primary-tinted border and elevated shadow that strengthens on hover, a large low-opacity content-type icon on the cover for depth instead of a flat color block, and an extra responsive breakpoint (cover narrows before it drops to a full-width stack) so it reads as considered at tablet width too, not just desktop and mobile.
29. **Filters adopt a pill/chip toggle pattern instead of checkbox lists**, matching the reference filter UI: a panel titled "Filters" with an inline "Clear all" link (not separate Clear/Apply buttons at the bottom), grouped by an uppercase label, with each group's options as single-select pills (clicking one deselects its siblings) defaulting to an "All"/"Any" pill. The selected-pill color is the product's primary blue — the reference used green, which was that surface's own accent, not a color to carry over. This is one shared component (`.filter-panel-head`, `.filter-pill-row`, `.filter-pill`) used identically on both My Learning pages, Explore, and the Admin Learning Paths page; only the group labels and options differ per page (Decisions 20/21/25).
30. **The "Learner progress across all paths" stacked-bar visualization is removed from the Admin Learning Paths page, with nothing added in its place.** Decision 25 originally paired the four metric cards with a compact stacked-bar + legend showing the Completed/In Progress/Not Started split across all enrolled learners. On review this pushed the page from "manage + understand performance at a glance" toward "a second analytics product" — the four metric cards already answer "is this healthy," and a further breakdown belongs in the path's own Analytics tab (`teacher-path-analytics.html`), not the listing page. The admin analytics ceiling is now simply: four metric cards, nothing else. Do not replace this component with a different aggregate widget (donut chart, sparkline, etc.) — the removal is deliberate, not a placeholder gap.
31. **Every bespoke `<button>`-based control must set an explicit `color`, never rely on inheritance.** Browsers do not inherit `color`/`font` into form controls by default (`<button>` renders with the UA system color `buttontext` unless a rule overrides it) — this file's global `button { font: inherit; }` reset (line ~135) only fixes the font half, not color. Several controls (`.filter-btn`, the sidebar's `.nav-parent`, and `course-in-path.html`'s `.pill-btn`/`.lang`) had no explicit `color`, so they silently rendered near-black UA-default text regardless of theme — invisible against the near-black `.dark` background even though every other token in the file was already theme-aware. Fixed by giving each an explicit `color` (`var(--foreground)` or `var(--sidebar-foreground)` to match its surrounding component) plus a matching hover/open-state color, and by auditing every other button-based class in the prototype for the same gap (`.btn*`, `.tab`, `.view-toggle button`, `.icon-btn`, `.mini`, `.round-btn` all already had explicit colors and needed no change). Any new bespoke button class added to this prototype must set `color` explicitly as part of its base rule, not assume inheritance.
32. **One microcopy for "see the rest of a capped list": "View more" (paired with the existing → arrow icon), never "View all" / "Explore All" / "See all" / "Show more".** This is link-level microcopy only — a section's own heading may still be descriptive (e.g. "Explore More Learning Paths" as an `<h2>`), only the trailing link text is standardized. Paired rule: any section that previews a longer list caps what it shows — 3 items for a compact row-style section (Dashboard's Upcoming Assignments/Explore Something New, My Learning's Explore More strips), up to 6 for a larger card-grid section (Dashboard's Current Learning) — and always ends with a "View more" link to the full listing, so the cap never reads as "this is everything."
33. **The Visitor/public pages are a deliberate, scoped exception to the shared `app-theme.css` component system.** `org-landing.html`, `public-paths.html`, and `public-path.html` link a separate stylesheet, `landing-theme.css`, with their own component vocabulary (`.lp-card`/`.lp-chip` cards and badges, `.lp-btn` pill CTA buttons, a persistent checkbox-list filter sidebar on `public-paths.html`) rather than the Student/Admin system's `.badge-path-label`, `.btn`, and `.filter-popover` pill pattern. This is intentional, not drift: these are pre-enrollment marketing/catalog pages (no learner progress exists yet, so the progress-bar system has no equivalent here), and a full-page catalog with a persistent filter rail is a conventional, well-established pattern for a public course catalog (distinct from the compact in-app toolbar popover the authenticated pages use). Cross-platform consistency work (Decisions 30–32 above) therefore applies to the Student and Admin surfaces, which already share `app-theme.css`; it does not extend to reskinning the Visitor pages onto that same system.

## Current-State Audit

| Capability | Current state | Notes |
| --- | --- | --- |
| Grouping above course | `program` tables (unordered, admin-enrolled, newsfeed) | Keep as-is; do not extend |
| Enrollment | `groupmember` per course group; `enrollInCourse()` in `apps/api/src/services/course/invite.ts` | Reuse for auto-enrollment |
| Course completion | lesson completion + exercise submissions tracked per course | Source data for the unlock rule |
| Public org site | `(org-site)` routes + `packages/ui/src/custom/org-landing-page/` (10 themes, default `minimal`) | Mirror for paths section/list/detail |
| Course landing page | theme `course.svelte` composer: hero → anchor nav → social proof → info blocks → curriculum → chips → instructor → reviews → pricing | Path page reuses these shared components where possible |
| Payments | course payment flow on paid enroll CTA (`course-landing-page.svelte`) | Path enroll reuses the same flow with the path as the product |
| Certificates | course certificate system + LMS Certificates page | Add path-level issuance |
| Setup checklist pattern | `routes/(app)/org/[slug]/setup/+page.svelte` + `PercentRingProgress` + `Item.*` | Reuse for "Set up your path" and learner checklist view |

## Product Goals

1. A visitor can discover a path on the org landing page, read a full Coursera-style path page, and self-enroll (paid or free).
2. Enrolling in a path creates path membership and `groupmember` rows for every course in it.
3. A learner sees paths in the LMS (home section + Learning Paths nav), opens a path hub with per-course progress and locked/unlocked states, and moves through courses in order.
4. Inside a course that belongs to a path, the learner sees path context (position stepper, "next course unlocks when…").
5. Teachers create a path via a setup checklist, order courses by drag, price the bundle, customize the public page, configure the certificate, and track a per-course funnel.
6. Completing all courses issues the path certificate (when enabled).
7. Programs, standalone courses, and existing enrollments are untouched (zero regression).

## Non-Goals (v1)

- Branching / non-linear paths (graphs, optional courses, parallel tracks).
- Path-level newsfeed or community.
- Subscriptions or installment pricing; coupon codes beyond what courses support.
- Path templates, cloning, or cross-org sharing.
- Per-learner overrides of the unlock rule (admin "skip ahead" can be a fast-follow).
- Team/B2B seat purchasing.

---

## Functional Requirements

### 1. Public — org landing site

**Landing page section** (above Courses; see `org-landing.html`):
- Section heading "Learning Paths" + lead line; grid of path cards.
- Path card: "Learning Path" chip, name, description, ordered course preview list (first 3 + "+N more"), meta row (course count, total hours, certificate), bundle price with struck-through sum.
- "View all learning paths" → `/paths`.
- Rendered per landing-page theme like the courses section (start with `minimal`; other themes can fall back to base styling).

**Catalog page `/paths`** (see `public-paths.html`): compact hero with search, filter sidebar (topic/tags, pricing, length), path card list, pagination. Mirrors `(org-site)/courses`.

**Detail page `/path/[slug]`** (see `public-path.html`), section order:
1. Hero: chip, headline, subheadline (teacher-editable), instructor avatar stack, Enroll CTA with price + savings chip, sticky enroll box (price, savings, feature list, CTA, enrolled/rating counts).
2. Stats row: courses, total hours, level, rating.
3. Sticky anchor nav: About / Courses / Certificate / Instructors / Testimonials / FAQ.
4. What you'll learn (outcome bullets) + Skills tags.
5. Course series: one card per course in order — number, title, lesson count + duration, per-course outcome bullets, expandable lesson outline (lessons marked preview are openable when the teacher allows).
6. Certificate block (when enabled).
7. Instructors (auto-derived from course tutors, hideable).
8. Testimonials (teacher-managed, hideable).
9. FAQ accordion (teacher-managed, hideable).
10. Pricing card + footer.
- Enroll: free path → enroll flow like `/course/{slug}/enroll`; paid path → payment flow with the path as product. Requires auth like course enrollment.
- Visitor access level (teaser / syllabus / syllabus+preview) gates sections 5's lesson detail.
- JSON-LD `Course`/`LearningResource` schema like the course page.

### 2. Learner — LMS

**Sidebar** (all learner pages): Main — Dashboard, **My Learning** (expandable — Learning Paths, Courses), Explore, Assignments (badged with an open-item count), Community; Personal — Certificates; pinned above the account footer — Settings. Per Decision 13, this is the full enrolled-student shell, not a paths-only nav. My Learning is a `<button>` that expands/collapses its two sub-items in place (Decision 20) — it carries no `href` of its own; the two sub-items are the only navigable destinations.

**Dashboard** (`lms-home.html`, the `/lms` entry point): a date line, "Good Morning, {name}." (name italicized in primary), and a progress-percentage subtitle; a **Pick up where you left off** banner naming the single next course/lesson with a Continue Learning CTA, above the 3-up learning-overview row (overall progress ring, Enrolled, Completed); a 3-up **Current Learning** grid (the learner's active path leads, followed by their top in-progress courses); then, side by side at the bottom, **Upcoming Assignments** and **Explore Something New** — two compact lists in the same row so removing the old right rail (Decision 18) still reads as balanced, not empty. No Recent Activity feed, no Weekly Study Hours chart, and no Learning Hours stat — the dashboard's job is progress and what's next, not analytics or time-tracking. Every Current Learning card now carries an explicit CTA (`Continue Learning` for the path, `Continue Course` for each course) — Decision 23 standardizes this instead of leaving some cards as click-anywhere with no visible action.

**My Learning is two pages, selected from the sidebar, not from a control inside either page** (Decision 20 — supersedes the in-page dropdown from the previous iteration). Neither page renders a content-type selector, tabs, or dropdown of its own; the sidebar's My Learning → Learning Paths / Courses sub-items are the only switch. Both pages share the shape **Currently Learning → {content list} → Explore More** (Decision 21), a toolbar of **Filters** (popover, scoped per page) + **Grid/List** toggle (grid default) above the content list, and the same card/row components.

- **`mylearning.html` = Learning Paths**: **Currently Learning** leads with one large hero card for the learner's most active path (badge, title, meta, a labeled Progress row with bar, "X of Y courses completed", Continue Learning) — Decision 20. Below it, **Learning Paths** lists the learner's other enrolled paths (in progress and completed alike — nothing is hidden by default; Status is a filter, not a hard cutoff) as premium cards, or, in List view, compact rows carrying the *same* facts (thumbnail, badge, title, description, meta, a progress bar, status, action) — list is a purpose-built layout, not a shrunk card (Decision 22 fixes a real bug here, see Technical Design). Filters: Status (Not Started / In Progress / Completed), Difficulty, Duration — **no Category** (Decision 21). Ends with the **Explore More Learning Paths** strip (not-yet-enrolled path cards + a link to Explore).
- **`mylearning-courses.html` = Courses**: same shape for the learner's enrolled individual courses. **Currently Learning** features the same course the Dashboard's "Pick up where you left off" banner names, so the two surfaces never disagree about what's active. **Courses** lists the rest, each card carrying the `Part of: {path}` relationship line (Decision 17) when applicable, subtle and never above the course title. Filters: Status, Difficulty, Duration — no Category. Ends with **Explore More Courses**.

**List `/lms/paths`** (`paths.html`): tabs In progress / Completed / All; rows with segment bar, next course, Continue / View certificate. Kept only as a working, unlinked deep link — superseded by `mylearning.html` (Decision 13/20); not reachable from the sidebar.

**Path hub `/lms/paths/[id]`** (`path-detail.html`): the journey spine — a vertical rail of course nodes that fills as courses complete. Per course: a `COURSE` label (Decision 17) beside its position number, state (Completed / In progress / Locked), progress bar, lesson+exercise counts, unlock note ("Unlocks after Course N"), certificate end-row.

**Course in path** (`course-in-path.html`): when the visited course belongs to a path the learner is in, wrap the course view with a path ribbon — back pill to the path, "Course 3 of 5", overall path %, horizontal stepper (done/current/locked) — and a "Next in your path" callout under the lesson showing what completing this course unlocks.

**Unlock enforcement**: locked courses are not openable from path surfaces; direct navigation to a locked course (URL) shows a "locked — finish {course} first" state. Learners enrolled in a course independently (outside the path) keep their normal access.

**Explore** (`explore.html`): a search box plus one **Filters** popover — no category tabs, no Sort control (Decision 16). Filter groups: Content Type (Learning Paths / Courses), Difficulty, Duration — **Category was removed** (Decision 21: `learning_path` has no category/tag column in the data model in Technical Design below, so a Category filter had nothing real to filter on; re-add it only alongside an actual schema column). Learning Paths and Courses render as two clearly labeled sections (not a merged feed) — a Learning Path card always carries a `LEARNING PATH` badge, course count, and duration; a Course card carries a `COURSE` badge and, when it belongs to a path, a `Part of: {path}` line — the two content types must never blur together. The old beginner/intermediate/advanced level-dots indicator on path cards is removed (Decision 26) — Difficulty is a filter now, not a permanent on-card decoration. Both badges sit in the exact same overlay position on the card cover (top-left, Decision 23 fixed a drift where Course badges had landed in the card body instead) — this is the same visual contract the public catalog uses, and the same badge components used everywhere else per Decision 17.

**Assignments** (`assignments.html`): a summary row (Total / Completed / In Progress / Submitted / Not Submitted) above a status table (Assignment, Course, Status, Due Date, Submission, Grade, Action) — explicitly not a Kanban board, and not scoped to path-exercises only; it covers every exercise across a learner's courses, in or out of a path.

**Assignment Detail** (`assignment-detail.html`): instructions, resources, a submission panel, and grade + feedback. The primary action is a real link into the course's lesson/exercise-taking flow, not a reimplementation of question-taking on this page.

**Certificates** (`certificates.html`): certificate tiles (preview face, issued-by, completion date, certificate ID, View/Download), plus an "in progress" strip for paths not yet complete — a path certificate (Decision 6) appears here exactly like a course certificate.

**Community** (`community.html`): recent discussions, announcements, and trending topics — kept secondary to learning, not a social-media surface.

**Settings** (`settings.html`): Profile, Preferences (notifications, language, timezone), Learning Preferences (reminders, course notifications), Account (security, sign out) — sectioned on one page, no tab bar needed at this depth.

### 3. Teacher — admin dashboard

**Org listing `/org/[slug]/paths`** (`teacher-paths.html`) — redesigned per Decision 25 to match the student design system rather than read as a generic admin table:

- **Header**: "Learning Paths" + subtitle, with **Create Learning Path** (primary) and **Create Course** (secondary) CTAs positioned together at the top — creating either is never more than one click away.
- **Performance overview**: four metric cards — Active Paths, Enrolled Learners, Completions (plain counts) and Completion Rate (a `.ring` progress circle, the same component the student Dashboard uses for overall progress) — so an admin reads path health at a glance without opening anything. This is the entire analytics surface on this page (Decision 30) — no further aggregate visualization follows it; a deeper breakdown belongs in the path's own Analytics tab.
- **Toolbar**: search (path name) + a Filters popover (Status, Enrollment size, Completion-rate bucket — no Category, Decision 21) + a Grid/List toggle (grid default), the identical `.filter-popover`/`.view-toggle` components the student pages use.
- **Grid view**: `.apath-card` — cover with a `LEARNING PATH` badge (top-left overlay, same as everywhere else), title, short description, a `Draft`/`Published`/`Archived` status badge, course count, learner count, a labeled Completion row with progress bar, "Updated {relative time}", and one primary action (`Manage`, or `Continue setup` for a Draft path with no learners yet). **No three-dot menu** (Decision 24).
- **List view**: `.lp-row` — the same shared row component as the student list views, carrying every field the grid card does (this is where Decision 22's progress-bar fix matters most, since the admin list view uses the identical CSS).
- **Empty state**: icon, "Create your first Learning Path" heading, one line of copy, both CTAs again. In this prototype it's reachable via a "Preview empty state" toggle next to the view switch, since the page can't otherwise demonstrate a state that only exists before any path has been created.

**Setup checklist `/paths/[id]/setup`** (`teacher-path-setup.html`): Get Started pattern (ring + dots + item rows): name/describe ✓ auto, add courses, set order, set price, customize landing page, activate. Each step deep-links to its tab. Shown until complete; "Finish setup · N%" chip in the workspace top bar.

**Path workspace `/paths/[id]/*`** — course-style sidebar (back link, path identity + status, tabs):

| Tab | File | Contents |
| --- | --- | --- |
| Courses | `teacher-path-builder.html` | "Unlock courses in order" toggle; drag-to-reorder course rows (order, thumb, lessons/exercises/price, open/remove); add-course picker (org courses not in path); certificate end-row. Remove-course confirmation notes nobody is unenrolled. |
| People | `teacher-path-people.html` | Auto-enroll info banner; search + progress filter; table: learner, path progress bar, current course, enrolled date, actions (view, remove — preserves course access). Add learners (batch email, like course invites). |
| Analytics | `teacher-path-analytics.html` | Stat cards (enrolled, active, completion rate, avg time); per-course funnel with drop-off callouts; "stuck" list (lessons/exercises blocking most learners). |
| Landing page | `teacher-path-landing-editor.html` | Hero headline/subheadline; visitor access radio (teaser / syllabus / syllabus+previews); what-you'll-learn bullets; skills tags; instructors toggle (auto from course tutors); testimonials CRUD + toggle; FAQ CRUD + toggle; "View live page". |
| Certificate | `teacher-path-certificate.html` | Award toggle; requirements summary (all lessons + all exercises); title + issuer fields; live preview; awarded count. |
| Settings | `teacher-path-settings.html` | General (name, description, cover); Pricing (bundle price, currency, show-savings toggle with computed sum); Enrollment & flow (self-enrollment toggle, unlock-in-order toggle, auto-enroll toggle); Status radio (Active / Draft / Archived); Danger zone (delete path — courses & progress preserved). |

### 4. Access control

- Org admins manage all paths; path-level TUTOR role can manage content but not delete (mirror Programs roles: ADMIN/TUTOR/STUDENT via `roleId`).
- Students: read path data they're members of; public endpoints serve ACTIVE paths only.
- DRAFT paths: admin/tutor only. ARCHIVED: hidden everywhere, data preserved.

#### Access & progression when a course is both standalone and inside a path

A course can be sold on its own *and* be step 3 of a path, and a learner may already have been enrolled in it long before the path existed. Two rules settle every case:

**1. One progression, always shared.** A learner has exactly one enrolment and one progress record per course, no matter how many paths contain it. There is no path-scoped copy of a course, no second set of lesson completions, no "path version" of a certificate. Consequences, all intended:

- A course the learner finished standalone last year shows as **already complete** the moment they enrol in the path, and immediately counts toward path completion and toward unlocking the next course.
- Work done inside the path counts outside it. Finishing step 3 within the path earns the ordinary course certificate too.
- A learner enrolled in two paths that share a course sees one progression in both.

This matches how Coursera Specializations behave (a course completed on its own counts toward the Specialization) and how Docebo learning plans derive plan status from the underlying course enrolment statuses. The alternative — requiring learners to re-take a course *through* the path for it to count, as Coursera's enterprise learning paths do — is the behaviour to avoid: it makes learners repeat work they have already done, and it is the single most common complaint about path features in other LMSs.

**2. Access is granted through `groupmember`, and every grant records its source.** Enrolling in a path inserts ordinary `groupmember` rows. The course side needs no knowledge of paths: `isUserCourseMemberOrOrgAdmin` keeps working unchanged.

What a bare `groupmember` row cannot express is *why* the learner is there — and this is a real, shipped defect in cohorts today, not a hypothetical. A cohort-enrolled learner and a directly-enrolled learner produce byte-identical `groupmember` rows, so the course People page (`getPaginatedCourseMembers`, which accepts only `page`/`limit`/`search`/`roleId`) shows one undifferentiated roster, and no course-scoped surface — gradebook, submissions, analytics, attendance — can be segmented by cohort. The nearest available answer, joining `cohort_member` on `profileId`, is a guess: it returns two rows when a learner belongs to two cohorts containing the course, and cannot see a direct enrolment at all.

Learning paths must not add a second instance of this problem, so provenance is modelled **once, for every enrolment route**, in `course_enrollment_grant`:

```
course_enrollment_grant
  groupmemberId · courseId · profileId
  source: SELF_ENROLL | INVITE | ADMIN_ADD | ORG_AUDIENCE | COHORT | LEARNING_PATH | PROGRAM | IMPORT
  cohortId (when source=COHORT) · learningPathId (when source=LEARNING_PATH)
  grantedByProfileId · grantedAt · revokedAt
  unique NULLS NOT DISTINCT (groupmemberId, source, cohortId, learningPathId)
```

`groupmember` stays the single access row, so nothing existing has to be refactored; this is the ledger beside it. `NULLS NOT DISTINCT` (Postgres 15+) is what makes re-running an enrolment idempotent for the sourceless kinds — without it two `SELF_ENROLL` grants, both with NULL cohort and path, would not collide.

Consequences:

- **The course roster can show where each learner came from** as a column on the existing People page — "via Frontend Bootcamp" instead of an unexplained name — computed per row from that learner's live grants.
- **Access is the union of live grants.** A learner may hold several at once — bought the course, then a path granted it, then a cohort did.
- **Revocation is conservative.** Leaving a path or cohort sets `revokedAt`; the `groupmember` row is deleted only when no grant with `revokedAt IS NULL` remains. A learner who bought the course never loses it because a path dropped them. This is Moodle's enrolment-instance model, where a user holds one enrolment row per method and access is their union.
- **History survives.** Grants are revoked, not deleted, so "did this path ever grant this course?" stays answerable after the learner leaves.

**Prerequisite — every enrolment must have at least one grant.** The conservative-revocation rule reads "no live grants left" as "nobody is claiming this enrolment, so remove it". That is only safe if every route that creates a `groupmember` row records a grant. If cohort enrolment writes no grant, then revoking a path grant would leave zero live grants on a row a cohort is relying on, and the cleanup would strip cohort-granted access. So before revocation is switched on:

1. Backfill a grant for every existing `groupmember` row — `COHORT` where the `cohort_member` × `cohort_course` join explains it, `IMPORT` for the rest.
2. Make the remaining enrolment routes write their grant: the cohort services, the audience and org-invite routes, and `ensureProgramCourseAccess`.

This is a narrow correctness requirement, not a cohort redesign: cohort enrolment needs a grant row so path revocation does not delete access it never granted. How cohorts segment a course is a separate question, answered by `prd/course-cohorts`.

`ensureProgramCourseAccess` is the one non-obvious case. `courseMemberMiddleware` calls it whenever `isUserCourseMemberOrOrgAdmin` returns false, lazily creating a `groupmember` row for legacy `program` members. Those rows have no grant, so for a learner in both a program and a path, the path's grant is the only one — unenrolling them from the path leaves zero live grants and the cleanup deletes the row. The middleware then recreates it on their next request, so the removal silently undoes itself. Writing a `PROGRAM` grant in that function fixes it. Whether the lazy write belongs in an authorization middleware at all is a separate question and out of scope here.

**Sequential unlock gates the grant, not just the UI.** Under `sequentialUnlock`, the `groupmember` row and its grant for a later course are not created until that course unlocks — locked means genuinely no access, not a hidden link. Under `autoEnroll` with sequential unlock off, all grants are created at enrolment time.

**Where per-path teacher data lives: on the path's own routes, not on the course.** `/paths/[id]/people` and `/paths/[id]/analytics` read `learning_path_member` and `learning_path_member_course` directly — the context is in the URL path, so it survives navigation and needs no grant filtering at all. Do **not** introduce a "view this course as path P" mode carried by a query parameter: a param is dropped the moment the teacher clicks into a lesson, so holding it would mean threading it through every link in the course shell. If a persistent scoped-course view is ever wanted, carry it in the route (`/paths/[id]/courses/[courseId]/…`) so a layout can inherit and authorize it once, not in a query string.

On the course's own screens the grant ledger is a **column, and at most an ordinary page-local filter** alongside the `search` and `roleId` that `ZCourseMembersQuery` already accepts. A filter that resets when you leave the page is correct filter behaviour, not state to preserve.

**Provenance and partitioning are different problems — do not merge them.** `prd/course-cohorts/README.md` segments a course by giving each batch its own `group`, which works because `submission`, `question_answer`, `group_attendance` and `lesson_comment` are already keyed on `groupmember.id`. That is a **partition**: every learner sits in exactly one batch, and a second membership deliberately forks their records (that PRD lists retakes as a feature). Learning paths need the opposite — one shared enrolment and one progression, so a course finished standalone counts inside the path. A path therefore cannot be a group, and access provenance cannot be a partition at all: one learner can hold many simultaneous reasons for access. Groups answer "which instance of this course is this record part of"; grants answer "why does this learner have access". Cohort segmentation is out of scope for this PRD and is addressed by `prd/course-cohorts`.

**Out of scope here:** per-cohort *content* — separate due dates, announcements or sessions inside a shared course. Cohort v1 partly addresses that with `cohort_newsfeed` and `cohort_goal`, and self-paced learning paths do not need it.

---

## Technical Design

### Data model (`packages/db/src/schema.ts`)

```
learning_path
  id uuid PK · organizationId FK(organization, cascade) · name varchar · slug varchar
  description text · coverImage text · status LEARNING_PATH_STATUS default 'DRAFT'
  difficulty LEARNING_PATH_DIFFICULTY nullable      -- Difficulty filter + public stats row
  estimatedDurationMinutes integer nullable          -- "~38 hours"; Duration filter buckets
  cost bigint default 0 · currency varchar default 'USD' · showSavings boolean default true
  sequentialUnlock boolean default true · selfEnrollment boolean default true · autoEnroll boolean default true
  certificateEnabled boolean default true · certificateTitle text · certificateIssuer text
  certificateDesign jsonb   -- mirrors course.certificate.design so @cio/certificates can render it
  landingPage jsonb  -- { headline, subheadline, visitorAccess: 'teaser'|'syllabus'|'preview',
                     --   outcomes: string[], skills: string[], showInstructors, testimonials: [...],
                     --   showTestimonials, faqs: [...], showFaqs, showRating, rating }
  visitorAccess is inside landingPage; no relational IDs inside the jsonb (per repo rule)
  courseOrderSetAt timestamptz nullable   -- only setup-checklist step not derivable from data
  createdByProfileId FK(profile) · createdAt / updatedAt
  unique(organizationId, slug) · index(organizationId) · index(organizationId, status)

learning_path_course
  id uuid PK · learningPathId FK(learning_path, cascade) · courseId FK(course, cascade)
  order integer NOT NULL          -- 1-based position; the gating sequence
  outcomes jsonb default []       -- per-course bullets on the public path page
  addedAt timestamptz
  unique(pathId, courseId) · index(pathId, order) · index(courseId)
  -- NOT unique(pathId, order): reordering rewrites every row in one transaction and a
  -- non-deferrable unique index rejects the intermediate states of a swap.

learning_path_member
  id uuid PK · learningPathId FK(learning_path, cascade) · profileId FK(profile) nullable · email text
  roleId FK(role) · enrolledAt · startedAt · completedAt timestamptz nullable
  -- rollup cache, recomputed alongside unlock evaluation; never source of truth:
  status LEARNING_PATH_MEMBER_STATUS · progressPercent integer · completedCourseCount integer
  currentCourseId FK(course, set null) · lastActivityAt timestamptz
  unique(pathId, profileId) · unique(pathId, email) · index(pathId) · index(profileId)

learning_path_member_course        -- progress cache only; provenance lives in course_enrollment_grant
  id uuid PK · learningPathMemberId FK(cascade) · learningPathCourseId FK(cascade)
  status LEARNING_PATH_COURSE_STATUS default 'LOCKED' · progressPercent integer
  lessonsCompleted / lessonsTotal / exercisesCompleted / exercisesTotal integer
  unlockedAt · startedAt · completedAt · updatedAt timestamptz
  unique(memberId, pathCourseId) · index(memberId) · index(pathCourseId)

course_enrollment_grant           -- cross-cutting: why any learner has access to any course
  id uuid PK · groupmemberId FK(groupmember, cascade) · courseId FK(course, cascade)
  profileId FK(profile, cascade) nullable
  source COURSE_ENROLLMENT_SOURCE
  cohortId FK(cohort, cascade) nullable · learningPathId FK(learning_path, cascade) nullable
  grantedByProfileId FK(profile, set null) · grantedAt · revokedAt timestamptz nullable
  unique NULLS NOT DISTINCT (groupmemberId, source, cohortId, learningPathId)
  index(courseId, source) · index(groupmemberId) · index(cohortId, courseId)
  index(learningPathId, courseId) · index(profileId)

learning_path_certificate_issue
  id uuid PK · learningPathId FK(cascade) · learningPathMemberId FK(cascade) · profileId FK(cascade)
  certificateId varchar UNIQUE     -- LP-8F42-19AC, shown on the learner's Certificates page
  title text · issuer text         -- frozen at issue time
  issuedAt · status default 'valid' · revokedAt · fileUrl
  unique(learningPathMemberId)

enum LEARNING_PATH_STATUS: ACTIVE | DRAFT | ARCHIVED
enum LEARNING_PATH_DIFFICULTY: BEGINNER | INTERMEDIATE | ADVANCED
enum LEARNING_PATH_MEMBER_STATUS: NOT_STARTED | IN_PROGRESS | COMPLETED
enum LEARNING_PATH_COURSE_STATUS: LOCKED | NOT_STARTED | IN_PROGRESS | COMPLETED
enum COURSE_ENROLLMENT_SOURCE: SELF_ENROLL | INVITE | ADMIN_ADD | ORG_AUDIENCE | COHORT | LEARNING_PATH | PROGRAM | IMPORT
```

Notes:
- The progress columns on `learning_path_member` and `learning_path_member_course` are a **cache** of lesson-completion + exercise-submission data, not a second copy of it. They exist because People, My Learning, the admin listing, and the analytics funnel all rank, filter, and aggregate by them. Any read may recompute; nothing may diverge.
- Savings figure is computed at read time from the sum of `course.cost` over path courses — never stored.
- `estimatedDurationMinutes` and `difficulty` are stored because nothing derivable backs them: courses carry no duration or difficulty column of their own.
- Schema work stops at a passing `@cio/db` build; migrations are handled outside this workflow.

### Completion / unlock logic (service layer)

```
courseCompleteForPath(profileId, courseId):
  lessonsComplete  = completedLessons  == totalLessons
  exercisesComplete = submittedOrPassedExercises == totalExercises
  return lessonsComplete && exercisesComplete

unlockedCourses(path, profileId):
  if !path.sequentialUnlock → all
  else → courses[0..k] where k = first index whose course is not complete
```

Path completion: all courses complete → set `completedAt`; if `certificateEnabled`, issue certificate (id `LP-XXXX-XXXX`), set `certificateIssuedAt`. Evaluate on lesson/exercise completion events for members of paths containing that course (reuse the pattern used by course-completion side effects).

### API routes (`apps/api/src/routes/learning-path/`)

Follow the standard layering (validation in `packages/utils/src/validation/learning-path/`, queries in `packages/db/src/queries/learning-path/`, services in `apps/api/src/services/learning-path/`). Mount as a single root segment: `.route('/learning-path', learningPathRouter)`.

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| GET | `/learning-path` | org admin | List org paths (admin) |
| POST | `/learning-path` | org admin | Create (name, description) → DRAFT |
| GET | `/learning-path/:pathId` | member/admin | Detail incl. ordered courses + caller progress |
| PUT | `/learning-path/:pathId` | admin/tutor | Update settings/pricing/landingPage/status |
| DELETE | `/learning-path/:pathId` | org admin | Delete (courses/progress preserved) |
| POST | `/learning-path/:pathId/courses` | admin/tutor | Add course (+ auto-enroll existing students) |
| PUT | `/learning-path/:pathId/courses/order` | admin/tutor | Reorder (array of courseIds) |
| DELETE | `/learning-path/:pathId/courses/:courseId` | admin/tutor | Remove (no unenrollment) |
| GET | `/learning-path/:pathId/members` | admin/tutor | Members + per-course progress |
| POST | `/learning-path/:pathId/members` | admin/tutor | Batch add (email+role) + auto-enroll |
| DELETE | `/learning-path/:pathId/members/:memberId` | admin/tutor | Remove (course access preserved) |
| GET | `/learning-path/:pathId/analytics` | admin/tutor | Funnel + stuck items |
| POST | `/learning-path/:pathId/enroll` | auth user | Self-enroll (free) / post-payment callback (paid) |
| GET | `/organization/learning-paths/enrolled` | auth user | LMS: caller's paths with progress + unlock states |

Public (org-site loaders, no auth): list ACTIVE paths for landing/catalog; get path by slug with landingPage content filtered by `visitorAccess`.

### Frontend plan (dashboard)

Follow CLAUDE.md conventions: types in `features/learning-path/utils/types.ts` inferred from the API, API classes in `features/learning-path/api/*.svelte.ts`, thin components, all copy in `en.json` under `"learningPath"`, `ui:` prefix for theme colors.

- **Admin**: nav item in `org-navigation.ts` after Courses using `PathIcon` from `@cio/ui/custom/moving-icons`; routes `org/[slug]/paths/+page.svelte` and `paths/[id]/{setup,courses,people,analytics,landing,certificate,settings}` with a `PathSidebar` mirroring the course sidebar pattern. Reuse `Item.*`, `PercentRingProgress`, `Field.*`, existing drag-reorder approach from lesson ordering if present.
- **LMS**: `lms/paths` + `lms/paths/[id]`; path ribbon injected in the course layout when course ∈ caller's path; reuse `course-progress-card` math for per-course %.
- **Public**: paths section added to org landing themes (start `minimal`), `(org-site)/paths` and `(org-site)/path/[slug]` mirroring the courses equivalents; reuse `CourseSectionNav`, `CourseSocialProof`, `CourseCurriculum`-style rows, `CoursePricing` card, `LandingButton`, footer.

### Build verification

```bash
pnpm --filter @cio/utils build && pnpm --filter @cio/db build && pnpm --filter @cio/api build
pnpm --filter @cio/dashboard^... build && pnpm --filter @cio/dashboard build
pnpm format:check
```

---

## Implementation Order

1. **Schema + validation + queries** (`learning_path*` tables, Zod schemas, query layer).
2. **API**: CRUD + course ordering + members + enroll service (auto-enroll transaction, `ON CONFLICT DO NOTHING` idempotency) + unlock/completion service + enrolled-paths endpoint.
3. **Admin UI**: listing → workspace shell + Courses tab → Settings → People → setup checklist → Landing editor → Certificate → Analytics.
4. **LMS**: enrolled section on home + nav, list, path hub (pick journey or checklist), course-in-path ribbon + lock enforcement.
5. **Public**: landing section (minimal theme) → catalog → detail page → enroll flow (free first, then paid via existing payment flow).
6. **Certificate issuance** + LMS Certificates page integration.

## Acceptance Criteria

1. Teacher can create a path, add + reorder courses, set a bundle price, and activate it; the setup checklist reflects real completion.
2. ACTIVE paths appear on the org landing page above courses, in `/paths`, and at `/path/[slug]` with all enabled sections; DRAFT/ARCHIVED paths do not.
3. Savings displays as bundle price vs summed course prices and updates when course prices change.
4. Visitor access level correctly gates lesson outlines/previews for non-enrolled visitors.
5. Enrolling (free or paid) creates the member row and `groupmember` rows for all path courses, idempotently.
6. With sequential unlock on, course N+1 is locked until course N's lessons AND exercises are complete — enforced in UI and API; toggle off restores free order.
7. Learner LMS shows path progress (segments + %), locked states, and the in-course path ribbon; direct URL access to a locked course is blocked with an explanatory state.
8. Completing all courses sets `completedAt` and (when enabled) issues the path certificate, visible in LMS Certificates.
9. Removing a course from a path or a member from a path never deletes course enrollments or progress.
10. Adding a course to a path with existing students auto-enrolls them in that course.
11. Analytics funnel counts match member course-completion data.
12. Programs and standalone courses behave exactly as before.
13. All user-facing strings use translation keys; all builds and `pnpm format:check` pass.

**Enrolled-student IA v2 (Decisions 13–19):**

14. Dashboard does not display a Recent Activity section or a Weekly Study Hours section, in any state.
15. Removing those sections does not leave visible empty space — Current Learning renders 3 cards per row and Upcoming Assignments / Explore Something New render side by side at full width.
16. ~~On My Learning, the learner switches between Learning Paths and Courses using a single dropdown~~ — superseded by item 24 below (Decision 20 moved this control into the sidebar).
17. Selecting Learning Paths shows only Learning Path cards/rows; selecting Courses shows only Course cards/rows — never both at once, never the other type's cards.
18. ~~The Filters popover on My Learning shows Status/Difficulty/Category...~~ — superseded by item 26 below (Category removed, Decision 21).
19. The learner can switch between Grid and List view on My Learning without losing which content type or filters are selected; switching view or content type never alters, resets, or deletes underlying enrollment/progress data — it only changes what's rendered.
20. My Learning's Learning Paths view ends with an "Explore More Learning Paths" strip of not-yet-enrolled paths and a link to the full Explore page; the Courses view does not render this strip.
21. ~~Explore renders no category tab row and no Sort control; a single Filters popover (Content Type, Difficulty, Duration, Category)...~~ — superseded by item 27 below (Category removed).
22. On Explore, every Learning Path card carries a `LEARNING PATH` badge and every Course card carries a `COURSE` badge; a Course belonging to a path additionally shows `Part of: {path name}` as a secondary line, never as the card's primary heading.
23. The `LEARNING PATH` / `COURSE` badge visual treatment (fill color, label text, casing) is identical across Dashboard, My Learning, Explore, and the Learning Path Detail curriculum list.

**Refinement pass (Decisions 20–25):**

24. My Learning has no in-page content-type control (no dropdown, no tabs) — the sidebar's My Learning group (expandable, Learning Paths / Courses) is the only way to switch between the two pages, and each page's own selected-state is reflected as the active sub-item.
25. Both My Learning pages render **Currently Learning** (one hero card) above **{Learning Paths | Courses}** (the rest, filterable, grid/list) above **Explore More {Learning Paths | Courses}**, in that order, on every load.
26. The Filters popover on My Learning → Learning Paths shows Status/Difficulty/Duration (no Category); on My Learning → Courses it shows Status/Difficulty/Duration (no Category).
27. Explore's Filters popover shows Content Type/Difficulty/Duration (no Category); no category tab row and no Sort control are rendered anywhere on the page.
28. Switching Grid ↔ List on any Learning Path or Course listing (My Learning's two pages, Admin Learning Paths) never removes the progress bar, percentage, course/completion count, or status — the same facts are always present, only the layout changes.
29. No Learning Path card, in any grid or list view, on the student side or the admin side, renders a three-dot / ellipsis menu.
30. `LEARNING PATH` and `COURSE` badges use the same component, sizing, and top-left cover-overlay position everywhere they appear (Dashboard, My Learning ×2, Explore, Learning Path Detail, Admin Learning Paths).
31. CTA button text is drawn from one fixed vocabulary by state (`Continue Learning`, `Continue Course`, `View Learning Path`, `View Course`, `View Certificate`, `Review Course`, `Manage`) — no page invents its own alternate phrasing for the same state.

**Admin Learning Paths (Decision 25):**

32. The Admin Learning Paths page shows a performance overview with Active Paths, Enrolled Learners, Completions, and a Completion Rate progress ring.
33. The page renders no aggregate learner-progress visualization (stacked bar, donut chart, sparkline, or otherwise) below the four metric cards — the four cards are the entire analytics surface on this page (Decision 30).
34. Grid and List views are both available, Grid is the default, and both are reachable from the same view-toggle component used on the student side.
35. Search (by Learning Path name) and a contextual Filters popover (Status, Enrollment, Completion rate — no Category) are both present in the toolbar.
36. Create Learning Path (primary) and Create Course (secondary) CTAs are visible near the page header at all times, and repeated in the empty state.
37. An empty state exists, is reachable in this prototype via a preview toggle, and offers both create actions.
38. No three-dot menu appears on any Admin Learning Path card or row.
39. Cards, badges, buttons, progress bars, and the Grid/List toggle on the Admin page use the exact same components as the student-facing pages — differing only in which data fields and actions are shown.

**Visual polish pass (Decisions 26–29):**

40. No Learning Path card on Explore renders a beginner/intermediate/advanced dot indicator.
41. Every progress bar in the prototype (Dashboard, both My Learning pages, Learning Path Detail, `paths.html`, the Admin Learning Paths page in both Grid and List view) renders as the same fully-rounded pill shape — no segmented/per-course bar remains anywhere.
42. Every `LEARNING PATH` and `COURSE` badge renders with the frosted-glass treatment (blur + translucent background + soft border) — white-tinted when the badge sits on a cover image, primary-tinted when it sits on a plain card or list-row background.
43. The Currently Learning hero card on both My Learning pages shows a visible border/shadow distinct from ordinary listing cards, a decorative cover icon, and reflows at a tablet width before collapsing fully at mobile.
44. The Filters popover on every page (both My Learning pages, Explore, Admin Learning Paths) renders as a "Filters" title + "Clear all" link header, followed by grouped, labeled rows of pill buttons — no checkboxes, no separate bottom Clear/Apply buttons.
45. Within a filter group, selecting a pill deselects any other pill in that same group (single-select), and the group's default option is always "All" or "Any".
46. The selected/active filter pill uses the product's primary blue in every instance — no page uses a different accent color for the selected state.

**Cross-platform consistency pass (Decisions 30–33):**

47. No page renders an aggregate "Learner progress across all paths" component or equivalent — it is removed from the prototype UI and from every PRD reference (Decision 30).
48. Every link that leads from a capped preview list to its full listing reads exactly "View more" with the shared arrow icon — no instance of "View all", "Explore All", "See all", or "Show more" remains anywhere in the enrolled-student or admin surfaces (Decision 32).
49. Every section that previews a longer list caps its visible items at 3 (compact row-style sections) or 6 (card-grid sections) and pairs the cap with a "View more" link (Decision 32); this holds on the Dashboard (Current Learning, Upcoming Assignments, Explore Something New) and both My Learning pages' "Explore More" strips.
50. In dark mode, the Filters button — idle, hover, and open/active states, including its icon — renders with readable contrast against its background on every page that has one (both My Learning pages, Explore, Admin Learning Paths) (Decision 31).
51. In dark mode, the sidebar's expandable "My Learning" label, `course-in-path.html`'s "Mark as Complete" pill button, and its language selector all render with readable contrast (Decision 31).
52. No bespoke `<button>`-based control in the prototype relies on the browser's default (UA) text color — every button class defines its own `color` explicitly, so introducing dark mode never silently reverts a control to unreadable text (Decision 31).
53. Switching Grid ↔ List view on any listing continues to preserve every progress fact (bar, percentage, completion count, status) with zero regressions from this round's changes (re-verifies Decision 22 / item 28 after the Decision 31 button-color fixes touched the same shared files).
54. The Visitor/public pages (`org-landing.html`, `public-paths.html`, `public-path.html`) are not required to adopt `app-theme.css`'s badge/progress/button/filter components — they keep `landing-theme.css`'s own card, chip, button, and checkbox-filter patterns by design (Decision 33).

## Risks and Mitigations

- **Unlock-rule evaluation cost** (checked on every lesson/exercise completion): scope the check to paths containing that course with the learner as member; index `learning_path_course.courseId`.
- **Auto-enroll transaction size** for large paths/cohorts: batch inserts with `ON CONFLICT DO NOTHING`; >500 members → background job (same mitigation as Programs).
- **Price drift**: savings computed at read time, so course price changes are always reflected; if a course in an active path becomes free/pricier, surface a notice in the Settings pricing section.
- **Learner already enrolled in a member course independently**: idempotent enrollment; their existing progress counts toward the unlock rule immediately (decide: acceptable and desirable).
- **Locked-course deep links** shared between learners: API must enforce the lock (not just UI), returning a typed error the frontend renders as the locked state.
- **Landing theme sprawl** (10 themes): v1 ships the paths section/pages for the base + `minimal` theme with a neutral fallback for others, mirroring how course landing tokens are layered.
