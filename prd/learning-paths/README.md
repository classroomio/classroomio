# Learning Paths PRD

## Status

- Draft (prototyped, ready for engineering review)
- Design conversation: [transcript.html](./transcript.html)

## Implementation source of truth — courses in the app

**Binding rule.** How courses work in the live dashboard is the source of truth for everything that is not unique to learning paths. Enrolment, settings, sidebar, layouts, search, filters, drag-and-drop, create flow, listing pages, People, certificates, landing-page editor, publish, org nav, LMS chrome: copy the existing course implementation. Reuse the same components (`Page.*`, `Search`, `CourseFilterPopover` / `SortSelect`, `Page.SettingsActions`, `UnsavedChanges`, `Field.Group` / `Field.Set`, `svelte-dnd-action` Start/End reorder, `invitation-modal`, `CourseSidebar`, course landing overlay + live preview). Do not invent a second version of those.

This rule **overrides** Confirmed Decisions 13–33 (now collapsed to a do-not-copy list) and any leftover prototype copy in Functional Requirements. Those passages describe prototype exploration. They are not an implementation spec. When a later section, a prototype HTML file, or this document disagrees with the live course UI on a **shared** pattern, **the live course UI wins**.

The prototypes in [`prototypes/learning-paths/`](../../prototypes/learning-paths/) show **path-specific** product only (ordered curriculum, path hub, public path page, unlock ribbon, bundle savings). They are not a redesign brief for the rest of the app. CSS classes, pill filters, metric rings, glass badges, card systems, and LMS IA in the prototype are exploration — implement with the components courses already use.

**Do not reinvent the wheel.** Except for something that only exists on a learning path, structure, share, and implement the same way courses do today.

Path-specific only (do not look to courses for these): ordered course list and sequential unlock, bundle price and savings, path hub / journey spine, in-course path ribbon, learner course URL `/paths/[publicId]/courses/[courseId]/*` (same children as `/courses/[courseId]/*`), `course.requiresLearningPath`, path certificate as a second credential, `course_enrollment_grant` origin, public path landing sections that courses do not have.

**Shared course UI.** Lesson player, exercise player, course header, content list, Ask AI, and the rest of taking a course are the existing course components — independent `/courses/[courseId]/lessons` and path taking mount the same pages. Path route files are thin. Path-only chrome is the ribbon, lock state, and hub back-link. Do not fork `lessons/+page.svelte` (or any course player page) into a paths folder.

### Shared patterns — implement like courses

| Concern | Course source of truth |
| --- | --- |
| Org listing | `org/[slug]/courses` + `features/course/pages/courses.svelte`: `Page.Root` / `Page.Header` / `Page.Body`, `Search`, filter popover, grid/list toggle (admin only), cards or `ResourceListRow`, `CreateCourseButton`, `CoursePublishBadge`, `Empty` |
| Create | `?create=true` → `NewCourseModal` (title + description), then land in the workspace. Courses have no `/setup` page **yet**. Paths ship `/paths/[publicId]/setup` first (org setup chrome); courses can copy that later |
| Workspace shell | `courses/[id]/+layout.svelte` + `CourseSidebar`: `BackButton`, identity, sidebar nav (not horizontal tabs), `CourseHeader` |
| Settings | `courses/[id]/settings`: `Field.Group` / `Field.Set` / `Field.Separator`, `isPublished` `Switch`, `UnsavedChanges`, `Page.SettingsActions` |
| People / enrolment | `courses/[id]/people`: header Add → `?add=true` → `invitation-modal` (existing members, bulk email, invite link), `Search` + role `Select`, table (Learner, Progress, Stage, Last login, Enrolled at, actions) |
| Drag reorder | Lessons: **Start reorder / End reorder** toggle + `svelte-dnd-action` (`dndzone`); persist when reorder mode ends. Not always-on drag |
| LMS list | `/lms/mylearning`: one page, existing In progress / Complete tabs, **grid only**. Mixed cards: path card vs course card (different components). Course cards = live **non-path** grant only |
| Org nav | `org-navigation.ts` content group, same listing patterns as Courses |
| Public catalog | `(org-site)/courses` and course landing composer — extend, do not restyle from `landing-theme.css` unless the public course page already does that |
| Landing editor (path public page) | `courses/[id]/landingpage`: full-screen overlay (`fixed inset-0`), left `Sidebar` section list, right live `CourseLandingPage` preview in `editMode`, `setLandingPageEditContext` click-to-select, `UnsavedChanges`. Not a settings form inside the workspace. Path-specific sections only (visitor access, FAQ, sequential course series, bundle savings) |
| Org landing editor | `org/[slug]/landingpage/edit`: same overlay pattern. Add a Learning Paths section above Courses by extending `landingpage-editor/courses-section.svelte` — do not invent a second org editor |
| Certificate admin | `courses/[id]/certificates` + `Page.SettingsActions` — same page, path certificate as a second credential |
| LMS nav | `lms-navigation.ts` as shipped. Paths are cards on My Learning, not a second nav item. Do not rename Exercises, hide Cohorts, or rewrite the drawer |

### Prototype / PRD items that do **not** follow course convention

Do not implement these as specified in the prototype. Use the course pattern instead, and only add the path-specific column or field.

| Prototype / PRD | Why it is wrong | Do this instead |
| --- | --- | --- |
| “When this document and a prototype disagree, the prototype wins” | Shared UI would drift from the app | Live course UI wins for shared patterns; prototype wins only for path-specific UX |
| Admin listing metric cards (Active Paths, Enrolled Learners, Completions, Completion Rate ring) | Course listing has no analytics overview | Path listing matches course listing. Path analytics stay on the path Analytics tab |
| Create Path **and** Create Course CTAs on the path listing | Course listing only creates courses | One create CTA for paths. Create course stays on the courses page |
| Dedicated `/paths/[id]/setup` as the **create** flow (replacing the modal) / prototype checklist chrome | Create stays a modal like courses. Prototype `teacher-path-setup.html` is not the page chrome | Create modal → `/paths/[publicId]/setup`. That **subpage** is real: copy org `/org/[slug]/setup` (`Page.*`, `Item.*`, progress). Steps deep-link into Courses / Settings / landing overlay. Same pattern is the template for a future `/courses/[id]/setup` |
| Admin listing restyled as student cards (`.apath-card`, `.lp-row`, glass badges) | Admin courses already have `CourseCardList` / `CourseListRow` | Reuse those list/card components; add path fields (course count, etc.) |
| Prototype pill/chip Filters (`.filter-pill`, “Clear all”, no Apply) | Courses use `CourseFilterPopover` + `SortSelect` | Same popover/select components, path-specific filter groups |
| Grid/List on LMS My Learning | LMS course list is **grid only** (`isLMS` hides the toggle) | Same: no view toggle on LMS |
| My Learning rebuilt (Currently Learning hero, Explore More strip, sidebar expand Paths/Courses, in-progress+completed mixed with a Status filter) | LMS My Learning is `UnderlineTabs` In progress / Complete + `CoursesPage` | Extend those tabs/pages to include paths. Do not redesign LMS home or My Learning in this feature |
| Dashboard redesign (drop Recent Activity, 3-up Current Learning, etc.) | Not path-specific | Out of scope. LMS home stays as shipped |
| Explore rebuilt (Content Type sections, Difficulty/Duration pills, no Sort) | Explore is courses + search + `SortSelect` | Add paths to the existing Explore page; keep its toolbar |
| “No three-dot menu on any path card” | Course cards/rows have a context menu | Keep the same menu pattern; path-specific actions go there |
| People: progress-only filter, “batch email like course invites” as a one-off | People uses role filter + `invitation-modal` with tutors/students/invite link | Same modal and filters. Extra path columns (current course, path %) are path-specific |
| Settings as a custom prototype form (status radios, no save bar) | Settings use Field primitives + sticky `Page.SettingsActions` | Same. Path-specific fields: bundle price, savings, sequential unlock, auto-enroll, `isPublished` switch |
| Builder: always-on drag rows | Content reorder is an explicit Start/End reorder mode | Same toggle + `svelte-dnd-action` |
| Path workspace described as “tabs” | Course workspace is a **sidebar**, no horizontal tabs | `PathSidebar` mirroring `CourseSidebar` |
| Public `/paths` filter **sidebar** (`landing-theme.css` checkbox rail) | Public courses catalog uses the existing org-site courses page + sheets | Mirror `(org-site)/courses` |
| Prototype-only CSS (`.badge-path-label` glassmorphism, `.ring`, “View more” microcopy, button `color` rules, list-view flex-basis bugfix in `app-theme.css`) | App already has badges, buttons, Empty, Progress | Use `@cio/ui` / dashboard course components. Do not port prototype CSS into the app |
| Learner sidebar IA rewrite (Assignments rename, My Learning expand-group, hide Cohorts, mobile drawer) | LMS nav is `lms-navigation.ts` as shipped | Add a Learning Paths entry where Courses / My Learning sit. Do not rename Exercises, hide Cohorts, or restyle the LMS chrome |
| LMS Assignments / Community / Settings pages in the prototype | Those screens already exist (`/lms/exercises`, `/lms/community`, `/lms/settings`) | Out of scope. Do not rebuild them in this feature |
| Path landing editor as stacked cards inside the workspace (`teacher-path-landing-editor.html`: Hero / Visitor access / What you'll learn / Skills / Instructors / Testimonials / FAQ + custom radio-cards, tags, sticky `.savebar`, “View live page” as an external link) | Course landing editor is a **full-screen overlay**: section sidebar + live preview, click a section on the page to edit it. Hero ≈ header, outcomes ≈ goals, skills ≈ chips, instructors ≈ instructor, testimonials ≈ reviews, pricing already has a form | Copy `courses/[id]/landingpage` (`Editor` + `CourseLandingPage` `editMode`). Add path-only sections (visitor access, FAQ, sequential course series / per-course outcomes, show-savings on pricing). Do not ship a settings-style form. “View live page” is the in-editor preview, same as courses |
| Org landing “Learning Paths” block as a new editor | Org already edits the public site at `org/[slug]/landingpage/edit` | Extend that editor’s courses section (paths above courses). Same overlay, same `Field.*` / dnd section chrome |

---

## Prototypes — path-specific UX only

Interactive HTML for path-specific surfaces lives in [`prototypes/learning-paths/`](../../prototypes/learning-paths/). Use them for: public path page **sections** (what the visitor sees), path hub / journey spine, in-course path ribbon, unlock states, bundle savings on the public page. Do not use them as a layout spec for listing, settings, people, filters, the LMS shell, **or the landing-page editor chrome**.

**Start here:** `prototypes/learning-paths/index.html` (maps visitor / learner / teacher and cross-links each flow).

| Surface | Files | Role |
| --- | --- | --- |
| Public (org site) | `org-landing.html`, `public-paths.html`, `public-path.html` | Path-specific public page and landing section |
| Learner | `path-detail.html`, `course-in-path.html` | Path hub and in-course ribbon. Other learner HTML in this folder is **not** a mandate to redesign LMS |
| Teacher | `teacher-path-builder.html`, `teacher-path-analytics.html`, `teacher-path-certificate.html` | Path-specific workspace **content**. `teacher-path-landing-editor.html` is **not** the editor chrome — implement like `courses/[id]/landingpage`. Listing / people / settings HTML is illustrative — implement like courses |

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
3. **Self-enrollment with bundle pricing.** A path is public on the org landing site with one price. Enrolling (buy or free) writes path membership and grants course access for courses unlocked now (the first course under sequential unlock, all of them otherwise).
4. **Show savings.** The public page shows the bundle price against the summed individual course prices ("$199 ~~$280~~ · Save $81 (29%)"). Toggleable per path.
5. **Unlock rule = lessons + exercises.** Course N+1 unlocks when course N has every lesson complete AND every exercise submitted/passed. Sequential unlocking is a per-path toggle (off = take in any order).
6. **Path certificate is a teacher toggle** with its own workspace nav item (same place as course certificates); issued automatically on full completion; appears in the learner's LMS Certificates page.
7. **Teacher workspace sidebar**, same shell as `CourseSidebar` (not horizontal tabs): Courses (ordering; **default** at `/paths/[publicId]`, like `/courses/[id]` → lessons), People, Analytics, Landing page, Certificate, Settings. Plus a **Setup subpage** at `/paths/[publicId]/setup` (org setup chrome — not a replacement for the create modal). **No path newsfeed** (Programs covers cohort communication). Teachers do not view or take a course “through” the path. They edit a course at `/courses/[courseId]/…`. Path-wide funnel is `/paths/[publicId]/analytics`.
8. **Visitor access is teacher-configurable**: teaser only / full syllabus / syllabus + preview lessons.
9. **Public path page follows the Coursera professional-certificate shape**: hero with stats + enroll CTA, what-you'll-learn, skills tags, sequential course cards with per-course outcomes and lesson outlines, certificate block, instructors, testimonials, FAQ accordion, pricing card.
10. **Org landing page: Learning Paths section sits ABOVE the Courses section.** Plus a `/paths` catalog page and `/path/[slug]` detail page mirroring how `/courses` and `/course/[slug]` work today.
11. **Course independence is a course-level switch.** A course can sit in multiple paths. `course.requiresLearningPath` default **false** (still independently enrollable). When **true**, learners cannot take it on its own: public `/course/[slug]/enroll`, Explore, course invite links, and course People → Add are rejected. Access is a live `LEARNING_PATH` grant. Turning the flag on does not revoke existing independent grants. Removing a course from a path or a learner from a path never deletes `groupmember` rows or progress.
12. **Publish flag, not a status enum.** Same paradigm as `course.isPublished`: a boolean. Unpublished paths are hidden from the public catalog and reject self-enrollment. Already-enrolled learners keep access; teachers can still add members from the People page while building. No Draft / Archived / Published enum.
13. **Dashboard/LMS path URLs use `publicId`, not UUID.** `learning_path.id` stays UUID PK; FKs stay on `id`. `publicId` is 8 mixed-case `[0-9A-Za-z]` (e.g. `1GlQpMod`), globally unique, immutable, generated at insert. Public org-site stays `/path/[slug]`. Course ids in nested taking stay UUID.
14. **A path visit mounts the whole course tree under the path:** `/paths/[publicId]/courses/[courseId]/*` is the same children as `/courses/[courseId]/*` (`/`, `lessons`, `exercises`, `certificates`, `marks`, …). Shared course pages; ribbon binds to `publicId`. Independent taking stays `/courses/[courseId]/*`. Same `/paths/[publicId]` is the teacher Courses page and the learner hub (role split). Teachers edit a course at `/courses/[courseId]/*`, not under the path.
15. **Setup is a workspace subpage.** `/paths/[publicId]/setup` copies org `/org/[slug]/setup` (`Page.*`, `Item.*`, progress). Create is still `?create=true` modal, then this page. Incomplete chip in the path workspace links here. Courses do not have this yet; `/courses/[id]/setup` can follow the same pattern later.

### Prototype LMS / admin exploration (Decisions 13–33) — do not implement

**Superseded by [Implementation source of truth](#implementation-source-of-truth--courses-in-the-app).** The numbered items that used to live here documented HTML prototype experiments. They are **not** product requirements. Kept as a reminder of what **not** to copy from `prototypes/learning-paths/`:

- LMS sidebar rewrite (Assignments rename, hide Cohorts, My Learning expand-group, new mobile drawer)
- LMS home redesign (drop Recent Activity, 3-up Current Learning, new dashboard chrome)
- My Learning rebuild (hero card, Explore More strip, Grid/List, Status filter mixing in-progress+completed, sidebar content-type switch)
- Explore rebuild (drop Sort, pill filters, Content Type sections, glass badges, no kebab)
- Admin listing rebuild (metric cards, dual Create CTAs, `.apath-card` / `.lp-row`, pill filters, no context menu)
- Prototype CSS (`app-theme.css` glass badges, `.ring`, pill progress, “View more” microcopy, button `color` rules)
- Public `/paths` checkbox filter sidebar (`landing-theme.css`) as a new catalog chrome — public courses already have a catalog; mirror that
- Path landing editor as a settings form (`teacher-path-landing-editor.html`) — course landing editor is the overlay + live preview at `courses/[id]/landingpage`

The prototype HTML remains useful for **path-specific** surfaces (path hub, in-course ribbon, public path page sections, bundle savings, **setup checklist steps**). Shared UI is implemented like courses (setup **chrome** like org setup). Path-specific product in Decisions 1–15 still stands.

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
| Setup checklist pattern | `routes/(app)/org/[slug]/setup/+page.svelte` + `Item.*` + progress | **Use it.** Path setup is `/paths/[publicId]/setup` with that chrome. Prototype `teacher-path-setup.html` supplies the steps only. Future `/courses/[id]/setup` copies this. |

## Product Goals

1. A visitor can discover a path on the org landing page, read a full Coursera-style path page, and self-enroll (paid or free).
2. Enrolling in a path creates path membership and grants course access for courses unlocked now (not necessarily every course at once).
3. A learner has **one** My Learning page: path cards (membership) and course cards (non-path grants only), different card components. Path hub at `/paths/[publicId]`.
4. Opening a course from a path uses `/paths/[publicId]/courses/[courseId]/*` (same course pages as `/courses/[courseId]/*`, plus that path’s ribbon). Independent taking (when `requiresLearningPath` is false) stays `/courses/[courseId]/*` with no ribbon.
5. Teachers create a path the same way they create a course (`?create=true` modal, title + description), then land on `/paths/[publicId]/setup`. Workspace default after that is the Courses page at `/paths/[publicId]`: order courses (Start/End reorder like lessons), People (`invitation-modal`), Settings (`Page.SettingsActions`), landing editor, certificate, analytics. They do not open a course through the path.
6. Completing all courses issues the path certificate (when enabled).
7. Programs, standalone courses, and existing enrollments are untouched (zero regression).

## Non-Goals (v1)

- Branching / non-linear paths (graphs, optional courses, parallel tracks).
- Path-level newsfeed or community.
- Subscriptions or installment pricing; coupon codes beyond what courses support.
- Path templates, cloning, or cross-org sharing.
- Per-learner overrides of the unlock rule (admin "skip ahead" can be a fast-follow).
- Team/B2B seat purchasing.
- Redesigning LMS home, sidebar IA, My Learning chrome, Explore toolbar, Exercises, Community, LMS Settings, or the org course-listing pattern. Paths extend those surfaces; they do not restyle them.

---

## Functional Requirements

### 1. Public — org landing site

**Landing page section** (above Courses; see `org-landing.html` for **visitor** layout only):
- Section heading "Learning Paths" + lead line; grid of path cards.
- Path card: "Learning Path" chip, name, description, ordered course preview list (first 3 + "+N more"), meta row (course count, total hours, certificate), bundle price with struck-through sum.
- "View all learning paths" → `/paths`.
- Rendered per landing-page theme like the courses section (start with `minimal`; other themes can fall back to base styling).
- **Editor:** teachers add/reorder this section in the existing org landing editor (`org/[slug]/landingpage/edit`), by extending `landingpage-editor/courses-section.svelte`. Same full-screen overlay. Do not build a separate org-landing editor for paths.

**Catalog page `/paths`**: mirror `(org-site)/courses` — same shell, search, and catalog filters/sheets the public courses page already uses. Prototype `public-paths.html` checkbox filter **sidebar** is exploration; do not ship it.

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

**Shared LMS chrome stays as shipped.** `lms-navigation.ts` is not redesigned. Paths are **not** a second sidebar item. LMS home, Exercises, Community, and Settings pages are out of scope.

**My Learning** (`/lms/mylearning`) — **same URL as today**, not renamed or moved. One page, to avoid two libraries of the same work. Existing In progress / Complete `UnderlineTabs`, `Search`, **grid only**. The grid mixes two card types (different components, not the same course card with a badge):

- **Path card** — one per path membership (course count, path progress). Opens `/paths/[publicId]`. Does not explode into five course cards.
- **Course card** — only courses with a live **non-path** grant (`SELF_ENROLL`, `INVITE`, `ADMIN_ADD`, `COHORT`, …). Opens `/courses/[courseId]/lessons`. Path-granted-only courses do not appear here, even after they unlock.

**Explore** (`/lms/explore`): add published paths to the existing Explore page. Keep its toolbar. A `requiresLearningPath` course is not independently enrollable here and is not listed as a takeable course in the public catalog; CTA is the path(s) it belongs to.

**Certificates**: a path certificate appears on the existing LMS Certificates page the same way a course certificate does.

**Path hub `/paths/[publicId]`** (`path-detail.html` — path-specific, **learners only**): journey spine of ordered courses with Completed / In progress / Locked. Opening a course from here is a path visit at `/paths/[publicId]/courses/[courseId]/` (same default as `/courses/[courseId]/`).

**Course in a path** (`course-in-path.html` — path-specific chrome only): `/paths/[publicId]/courses/[courseId]/*` — **every child `/courses/[courseId]` already has** (`/`, `lessons`, `lessons/[lessonId]`, `exercises/[exerciseId]`, `certificates`, `marks`, …). Same course pages and sidebar; path layout adds the ribbon (“Course 3 of 5”, next unlock, back to hub). `publicId` in the URL is which path this visit is. Course id stays the course UUID. In-course links (`getLessonsRoute` / `getNavItemRoute` / mentions) must keep the `/paths/[publicId]/courses/[courseId]` prefix or the ribbon dies on the next click. Teachers edit the course at `/courses/[courseId]/*`, not under the path.

Independent taking (live non-path grant, `requiresLearningPath` false) stays at `/courses/[courseId]/*` with no ribbon. When `requiresLearningPath` is **true**, the course is not in the public course catalog and learners cannot enrol on it directly. Hitting `/courses/[courseId]/*` without a non-path grant redirects to the same child under `/paths/[publicId]/courses/[courseId]/` if the learner has exactly one live `LEARNING_PATH` grant for it, otherwise to the path hub / My Learning.

**Unlock enforcement**: locked courses have no live `LEARNING_PATH` grant for that path; the player 403s (or shows locked). Independent access to the same course (non-path grant) still uses `/courses/[courseId]/lessons` and is not blocked by another path’s sequential unlock.

### 3. Teacher — admin dashboard

**Org listing `/org/[slug]/paths`**: same page as `org/[slug]/courses` / `features/course/pages/courses.svelte`. `Page.Root` / `Page.Header` / `Page.Body`, one Create CTA (`?create=true` → create modal, title + description, land on `/paths/[publicId]/setup`), `Search`, `CourseFilterPopover` / `SortSelect`, admin grid/list toggle, `CourseCardList` / `CourseListRow` (or the shared `ResourceListRow`) with a context menu, `CoursePublishBadge`, `Empty`. Path-specific fields only: course count, etc. **No** metric cards, **no** second Create Course button, **no** prototype `.apath-card` / `.lp-row` / glass badges, **no** pill filters.

**Create**: `?create=true` modal (title + description), then **`/paths/[publicId]/setup`**. Setup is a workspace **subpage**, not the create IA and not a replacement for Courses.

**Setup `/paths/[publicId]/setup`**: copy org `/org/[slug]/setup` — `Page.Root` / `Page.Header` / `Page.Body`, `Item.*` rows, progress. Prototype `teacher-path-setup.html` is the **step list** only (add courses, set order, set price, landing page, publish/`isPublished`). Name/describe is already done by the create modal. Each row deep-links to the matching workspace page (Courses, Settings publish, landing overlay). Incomplete chip in the path header links here. Do not port prototype rings/CSS. This page is the template for a later `/courses/[id]/setup`.

**Path workspace `/paths/[publicId]/*`**: `PathSidebar` copied from `CourseSidebar` (`BackButton`, identity, **sidebar nav**, header). Not nested under `/org/[slug]`. Not horizontal tabs. Default content page is **Courses** at `/paths/[publicId]` (no `/courses` suffix). Teachers do not have a path-scoped course player; opening a course from the builder goes to `/courses/[courseId]/…`.

| Nav | Course analogue | URL | Contents |
| --- | --- | --- | --- |
| Courses (default) | Lessons / content list | `/paths/[publicId]` | Sequential-unlock toggle (path-specific). Reorder with the **same Start reorder / End reorder** mode as course content (`svelte-dnd-action`); persist when reorder ends. Add-course picker; remove confirms nobody is unenrolled. Prototype always-on drag is wrong. |
| Setup | `org/[slug]/setup` | `/paths/[publicId]/setup` | Checklist subpage (org setup chrome). Not a forever primary nav item; header chip while incomplete. Steps: add courses, order (`courseOrderSetAt`), price, landing page, publish. Template for a later `/courses/[id]/setup`. |
| People | `courses/[id]/people` | `/paths/[publicId]/people` | Header Add → `?add=true` → `invitation-modal` (existing members, bulk email, invite link). `Search` + role `Select`. Table like course People; path-specific columns: current course, path %. Remove revokes the path grant; they keep the course only if another live grant remains. |
| Analytics | Course analytics | `/paths/[publicId]/analytics` | Path-specific funnel across the path’s courses (enrolled, drop-off, stuck lessons/exercises). Per-course gradebook/analytics stay on the course. This is where listing metric cards belong, not the org listing. |
| Landing page | `courses/[id]/landingpage` | `/paths/[publicId]/landingpage` | **Same editor chrome**, not a form in the path workspace. Full-screen overlay, left section list, right live path-page preview (`editMode` + `setLandingPageEditContext`). Map existing course sections: header (hero), goals (what you'll learn), chips (skills), instructor (auto from course tutors + show toggle), reviews (testimonials), certificate, pricing (add show-savings). Path-only sections: visitor access (teaser / syllabus / syllabus+preview), FAQ, sequential course series with per-course outcomes. Curriculum on a course is auto from lessons — here the series is the ordered path courses. Do not copy the prototype’s stacked cards, radio-cards, or external “View live page” link. |
| Certificate | `courses/[id]/certificates` | `/paths/[publicId]/certificates` | Award toggle, title/issuer, preview, `Page.SettingsActions`. Path-specific: issued on full path completion. |
| Settings | `courses/[id]/settings` | `/paths/[publicId]/settings` | `Field.Group` / `Field.Set` / `Field.Separator`, `isPublished` `Switch`, `UnsavedChanges`, sticky `Page.SettingsActions`. Path-specific fields: bundle price, show-savings, sequential unlock, auto-enroll, self-enrollment. Danger zone deletes the path, not courses or progress. Course settings (on the course) gain `requiresLearningPath` next to `allowSelfEnrollment`. |

### 4. Access control

- Org admins manage all paths; tutors can view/list and manage assigned paths (or content), but cannot create, clone, or delete (mirror Programs roles: ADMIN/TUTOR/STUDENT via `roleId`).
- Students: read path data they're members of (including unpublished paths they already joined). Public endpoints serve published paths only.
- Unpublished paths: admin/tutor only on public/catalog surfaces. Self-enrollment and public invite-link enrollment are rejected, matching `enrollInCourse`'s `isPublished` gate. Teachers can still add members from the People page. Unpublishing does not revoke existing grants.

#### Alignments

- **One shared progression.** One enrolment and one progress record per learner per course. A course they already finished counts in the path. Work in the path counts on the course.
- **Progression lives in existing course tables.** Truth: `lesson_completion` and `submission`. Caches: `learning_path_member_course` and `learning_path_member`. Course completion: `groupmember.certificateEarnedAt`. Path completion: `learning_path_member.completedAt`.
- **Access is `groupmember` plus a grant.** Joining a path writes `learning_path_member`, then a `groupmember` row if missing, then a `LEARNING_PATH` grant. Sequential unlock delays that grant until the course unlocks. Origin is `course_enrollment_grant`, not `groupmember`.
- **Path vs personal.** `source = LEARNING_PATH` + `learningPathId` vs `SELF_ENROLL` / `INVITE` / `ADMIN_ADD`. Both at once is allowed. The People page shows one person, with both origins listed.
- **`requiresLearningPath` (course column, default false).** When true: reject independent student enroll (public enroll, Explore, course invite, course People → Add); the course is not listed as takeable in the public course catalog. Path People / path self-enroll still write a `LEARNING_PATH` grant. Existing independent grants stay. Explore/public CTA for that course is the path(s), not course enroll. Hitting `/courses/[courseId]/*` redirects into `/paths/[publicId]/courses/[courseId]/*` (same child) when the learner has exactly one live path grant, otherwise to the hub / My Learning. When false: the course stays in the public catalog and learners can enrol on it independently.
- **My Learning is one page.** Path membership → path card. Course card only if a live **non-path** grant exists. Unlocking a path course does not add a course card.
- **Course People, gradebook, and analytics include everyone with a live grant**, path students included. Source is a column, plus an optional page-local filter. Path funnel numbers live on `/paths/[publicId]/people` and `/paths/[publicId]/analytics`. Course **admin** routes stay `/courses/[courseId]/…` with no path in the URL.
- **A path visit is `/paths/[publicId]/courses/[courseId]/*`.** Same children as `/courses/[courseId]/*`. Shared course pages + ribbon. Teachers edit at `/courses/[courseId]/*`. Independent taking stays `/courses/[courseId]/*`. In-course href helpers must preserve the path prefix on a path visit.
- **`publicId` is URL-only.** UUID PK and FKs unchanged. 8 mixed-case `[0-9A-Za-z]`, globally unique, immutable. Layout loaders resolve `publicId` → `id` once.
- **Removed from a path.** Revoke the path grant, set `learning_path_member.removedAt`. Do not delete `groupmember` or progress. They lose the course only if that grant was their last one.
- **Access check is “has a live grant”.** `isUserCourseMemberOrOrgAdmin` / `isCourseTeamMemberOrOrgAdmin` gain one `EXISTS` on an un-revoked grant. Before that ships, backfill a grant for every existing `groupmember` (`COHORT` where the join explains it, `IMPORT` otherwise) and have remaining enrolment routes write theirs, including `ensureProgramCourseAccess`.
- **Publish, not a status enum.** `isPublished` like courses. Unpublished: off the public catalog, self-enrolment rejected. Existing members keep access. Teachers can still add members while building.
- **Cohort segmentation is out of scope.** See `prd/course-cohorts`.

### What happens on enrol and unenrol

**Enrolling** (`learningPathId`, `profileId`), one transaction:

| Table | Write |
| --- | --- |
| `learning_path_member` | Insert (`NOT_STARTED`), or clear `removedAt` if they were previously removed |
| `learning_path_member_course` | One row per path course: first `NOT_STARTED`, the rest `LOCKED` under sequential unlock, else all `NOT_STARTED` |
| `organizationmember` | Insert if absent, after the student-limit check |
| `groupmember` | Insert only for courses granted now, and only if the row is missing |
| `course_enrollment_grant` | Upsert one `LEARNING_PATH` grant per granted course |

**Unlocking a later course:** flip `LOCKED` → `NOT_STARTED`, insert `groupmember` if missing, upsert its grant.

**Unenrolling**, one transaction:

| Table | Write |
| --- | --- |
| `course_enrollment_grant` | Set `revokedAt` on this path's live grants |
| `learning_path_member` | Set `removedAt` |
| `groupmember`, `lesson_completion`, `submission` | Untouched |

### Routes

Public org-site (same host as `/courses` / `/course/[slug]`):

| URL | Role |
| --- | --- |
| `/` | Org landing; paths section above courses (existing editor) |
| `/paths` | Path catalog |
| `/path/[slug]` | Public path page |
| `/path/[slug]/enroll` | Path enroll |
| `/course/[slug]` | Public course page. If `requiresLearningPath`, enroll CTA is the path(s), not course enroll; course is not independently listed as takeable |
| `/course/[slug]/enroll` | Independent course enroll — **rejected** when `requiresLearningPath` |

LMS (path segment is `publicId`, not UUID):

| URL | Role |
| --- | --- |
| `/lms/mylearning` | **Unchanged.** One library: path cards + independent course cards |
| `/lms/explore` | Discover paths and independently enrollable courses |
| `/lms/certificates` | Course + path certificates |
| `/paths/[publicId]` | Learner hub (list of courses in the path). Not `/lms/paths/[publicId]` |
| `/paths/[publicId]/courses/[courseId]/*` | Path visit of that course. **Same children as `/courses/[courseId]/*`** (`/`, `lessons`, `exercises`, `certificates`, `marks`, …). `courseId` is the course UUID |
| `/courses/[courseId]/*` | Independent course. When `requiresLearningPath`, redirect to the same child under `/paths/[publicId]/courses/[courseId]/` if exactly one live path grant, else hub / My Learning |

Dashboard (`publicId` in the URL so workspace paths stay short):

| URL | Role |
| --- | --- |
| `/org/[slug]/paths` | Listing (`?create=true` → modal → `/paths/[publicId]/setup`) |
| `/org/[slug]/landingpage/edit` | Org landing editor (add paths section here) |
| `/paths/[publicId]` | Teacher default: Courses (order/add/remove). Same URL as learner hub; role split |
| `/paths/[publicId]/setup` | Setup checklist (org setup chrome). After create, land here |
| `/paths/[publicId]/people` | Roster (`?add=true`) |
| `/paths/[publicId]/people/[personId]` | Member detail |
| `/paths/[publicId]/analytics` | Funnel across the path’s courses |
| `/paths/[publicId]/landingpage` | Overlay editor |
| `/paths/[publicId]/certificates` | Path certificate |
| `/paths/[publicId]/certificates/editor` | Design editor |
| `/paths/[publicId]/settings` | Path settings |
| `/courses/[courseId]/…` | Course workspace (edit, People, course analytics). Teachers go here from the path builder, not to the learner taking URL |

No `?learningPathId=` on `/courses/[courseId]/people` or other **course admin** routes. Teacher path Courses is `/paths/[publicId]`; `/paths/[publicId]/courses/[courseId]/*` is the course tree for a path visit. Setup is `/paths/[publicId]/setup`.

Route files: `paths/[publicId]/+layout` resolves `publicId` → uuid. Workspace pages (index, people, analytics, …) use a PathSidebar layout group. `/paths/[publicId]/courses/[courseId]/*` is a sibling group that remounts the existing `(app)/courses/[id]/*` pages + ribbon — same `getNavItemRoute` children, prefix swapped.

### Locked: path course URL

**B.** `/paths/[publicId]/courses/[courseId]/*` mirrors `/courses/[courseId]/*` (`/`, `lessons`, `certificates`, `marks`, …).

- Shared course pages. Path-only chrome is the ribbon / lock / back to hub.
- Teachers edit the course at `/courses/[courseId]/*`. Path Courses page is `/paths/[publicId]`. Path analytics is `/paths/[publicId]/analytics`. Create lands on `/paths/[publicId]/setup` (org setup chrome).
- `publicId` is URL-only (UUID PK unchanged). Course id in the nested segment stays UUID.
- My Learning stays `/lms/mylearning`.
- `requiresLearningPath` true: not independently in the public catalog; `/courses/[courseId]/*` redirects as above. False: catalog + independent enroll stay.

---

## Technical Design

### Data model (`packages/db/src/schema.ts`)

```
learning_path
  id uuid PK · publicId varchar(8) unique not null   -- URL only, e.g. 1GlQpMod; FKs stay on id
  organizationId FK(organization, cascade) · name varchar · slug varchar
  description text · coverImage text · isPublished boolean default false
  -- same paradigm as course.isPublished: unpublished = hidden from catalog, self-enroll rejected
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
  unique(publicId) · unique(organizationId, slug) · index(organizationId) · index(organizationId, isPublished)

learning_path_course
  id uuid PK · learningPathId FK(learning_path, cascade) · courseId FK(course, cascade)
  order integer NOT NULL          -- 1-based position; the gating sequence
  outcomes jsonb default []       -- per-course bullets on the public path page
  addedAt timestamptz
  unique(pathId, courseId) · index(pathId, order) · index(courseId)
  -- NOT unique(pathId, order): reordering rewrites every row in one transaction and a
  -- non-deferrable unique index rejects the intermediate states of a swap.

course (existing table, new column)
  requiresLearningPath boolean default false  -- independent enroll blocked; path grant only

learning_path_member
  id uuid PK · learningPathId FK(learning_path, cascade) · profileId FK(profile) nullable · email text
  roleId FK(role) · enrolledAt · startedAt · completedAt · removedAt timestamptz nullable
  -- removedAt is a soft-remove: deleting the row would cascade the member's per-course
  -- cache and their issued certificate. Re-enrolling clears it instead of inserting again.
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

enum LEARNING_PATH_DIFFICULTY: BEGINNER | INTERMEDIATE | ADVANCED
enum LEARNING_PATH_MEMBER_STATUS: NOT_STARTED | IN_PROGRESS | COMPLETED
enum LEARNING_PATH_COURSE_STATUS: LOCKED | NOT_STARTED | IN_PROGRESS | COMPLETED
enum COURSE_ENROLLMENT_SOURCE: SELF_ENROLL | INVITE | ADMIN_ADD | ORG_AUDIENCE | COHORT | LEARNING_PATH | PROGRAM | IMPORT
```

Notes:
- **Where progression is stored.** Source of truth is the existing course tables: `lesson_completion` and `submission`. There is no path-scoped copy of progress. `learning_path_member_course` and `learning_path_member` hold a cache (status/percent/counts) recomputed from that truth. Course completion is still `groupmember.certificateEarnedAt`. Path completion is `learning_path_member.completedAt`.
- **`learning_path.publicId`** is URL-only (dashboard/LMS `/paths/[publicId]/…`). UUID PK and FKs unchanged. 8 mixed-case `[0-9A-Za-z]`, globally unique, generated at insert with retry. Public site still uses `slug`.
- **`course.requiresLearningPath`** is a first-class column (not metadata). Independent enroll reads it next to `allowSelfEnrollment`.
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
| GET | `/learning-path` | admin/tutor | List org paths (admin: all; tutor: assigned paths) |
| POST | `/learning-path` | org admin | Create (name, description) → unpublished |
| GET | `/learning-path/:pathId` | member/admin | Detail incl. ordered courses + caller progress |
| PUT | `/learning-path/:pathId` | admin/tutor | Update settings/pricing/landingPage/isPublished |
| DELETE | `/learning-path/:pathId` | org admin | Delete (courses/progress preserved) |
| POST | `/learning-path/:pathId/courses` | admin/tutor | Add course (+ auto-enroll existing students) |
| PUT | `/learning-path/:pathId/courses/order` | admin/tutor | Reorder (array of courseIds) |
| DELETE | `/learning-path/:pathId/courses/:courseId` | admin/tutor | Remove (no unenrollment) |
| GET | `/learning-path/:pathId/members` | admin/tutor | Members + per-course progress |
| POST | `/learning-path/:pathId/members` | admin/tutor | Batch add (email+role) + auto-enroll |
| DELETE | `/learning-path/:pathId/members/:memberId` | admin/tutor | Soft-remove (`removedAt`); revoke `LEARNING_PATH` grants. Course access remains only if another live grant exists |
| GET | `/learning-path/:pathId/analytics` | admin/tutor | Funnel + stuck items |
| POST | `/learning-path/:pathId/enroll` | auth user | Self-enroll (free) / post-payment callback (paid) |
| GET | `/organization/learning-paths/enrolled` | auth user | LMS: caller's paths with progress + unlock states |

Public (org-site loaders, no auth): list published paths for landing/catalog; get path by slug with landingPage content filtered by `visitorAccess`. Self-enroll requires `isPublished` (same gate as `enrollInCourse`). `enrollInCourse` also rejects `requiresLearningPath` courses (path enroll is the only student path in).

### Frontend plan (dashboard)

Follow CLAUDE.md conventions: types in `features/learning-path/utils/types.ts` inferred from the API, API classes in `features/learning-path/api/*.svelte.ts`, thin components, all copy in `en.json` under `"learningPath"`, `ui:` prefix for theme colors.

- **Admin**: nav item in `org-navigation.ts` after Courses using `PathIcon` from `@cio/ui/custom/moving-icons`; routes `org/[slug]/paths/+page.svelte` (same listing as courses) and `/paths/[publicId]` (Courses default) plus `/paths/[publicId]/{setup,people,analytics,landingpage,certificates,settings}` with a `PathSidebar` copied from `CourseSidebar`. Setup copies `org/[slug]/setup`. Reuse `Page.*`, `Search`, `CourseFilterPopover`, `Field.*`, `invitation-modal`, `Page.SettingsActions`, and the lesson **Start reorder / End reorder** + `svelte-dnd-action` pattern. Teachers open a member course at `/courses/[courseId]/…`, not under the path.
- **LMS**: one `/lms/mylearning` grid (URL unchanged; path cards + independent course cards); Explore; hub `/paths/[publicId]`; `/paths/[publicId]/courses/[courseId]/*` remounts the existing course pages + ribbon. Do not add an LMS Paths nav item. Do not fork course pages.
- **Public**: paths section added to org landing themes (start `minimal`) via the **existing** org landing editor; `(org-site)/paths` and `(org-site)/path/[slug]` mirroring the **existing** courses catalog and course landing. Path public-page **editor** copies `courses/[id]/landingpage` (overlay + live preview), not `teacher-path-landing-editor.html`. Reuse `CourseSectionNav`, `CourseSocialProof`, `CourseCurriculum`-style rows, `CoursePricing` card, `LandingButton`, footer. `requiresLearningPath` courses do not self-enroll from `/course/[slug]/enroll` and are not independently takeable in the public catalog.

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
3. **Admin UI**: listing (course listing pattern) → create modal → `/paths/[publicId]/setup` → `PathSidebar` + Courses default at `/paths/[publicId]` (Start/End reorder) → Settings (`Page.SettingsActions`) → People (`invitation-modal`) → Landing editor → Certificate → Analytics.
4. **LMS**: mixed cards on `/lms/mylearning` (URL unchanged); Explore; hub `/paths/[publicId]`; `/paths/[publicId]/courses/[courseId]/*` (shared course pages + ribbon). Do not rebuild LMS home, sidebar, Exercises, Community, or Settings.
5. **Public**: landing section (minimal theme) → catalog (mirror `(org-site)/courses`) → detail page → enroll flow (free first, then paid via existing payment flow).
6. **Certificate issuance** + existing LMS Certificates page.

## Acceptance Criteria

1. Teacher can create a path (course create-modal pattern), lands on `/paths/[publicId]/setup`, add + reorder courses (Start/End reorder like lessons), set a bundle price, and publish it (`isPublished` + `Page.SettingsActions`).
2. Published paths appear on the org landing page above courses, in `/paths` (same catalog chrome as `/courses`), and at `/path/[slug]` with all enabled sections; unpublished paths do not.
3. Savings displays as bundle price vs summed course prices and updates when course prices change.
4. Visitor access level correctly gates lesson outlines/previews for non-enrolled visitors.
5. Enrolling (free or paid) creates the member row and grants course access for courses unlocked now, idempotently. Unpublished paths reject self-enrollment.
6. With sequential unlock on, course N+1 is locked until course N's lessons AND exercises are complete — enforced in UI and API; toggle off restores free order.
7. My Learning stays `/lms/mylearning`: path cards for membership, course cards only for live non-path grants. A path visit is `/paths/[publicId]/courses/[courseId]/*` (same children as `/courses/[courseId]/*`, shared pages + ribbon). Locked path courses have no live grant and 403. When `requiresLearningPath`, independent `/courses/[courseId]/*` redirects into the same child under the path if exactly one live path grant, else hub / My Learning; the course is not independently in the public catalog.
8. Completing all courses sets `completedAt` and (when enabled) issues the path certificate, visible in LMS Certificates.
9. Removing a course from a path or a member from a path never deletes `groupmember` rows or progress. Path unenrollment revokes the path's grants; the learner keeps the course only if another live grant remains.
10. Adding a course to a path with existing students auto-enrolls them in that course (subject to sequential unlock).
11. Analytics funnel counts match member course-completion data.
12. Programs and standalone courses behave exactly as before.
13. All user-facing strings use translation keys; all builds and `pnpm format:check` pass.
14. Shared UI matches the live course implementation: org listing, create modal, `PathSidebar`, People (`invitation-modal` + role filter), Settings (`Field.*` + `Page.SettingsActions`), filters/search, LMS My Learning (tabs + grid only, mixed path/course cards), Explore toolbar, drag-reorder mode, **landing editor** overlay. Prototype Decisions 13–33 that redesigned those surfaces are **not** acceptance criteria.
15. `course.requiresLearningPath` blocks independent student enroll (public, Explore, course invite, course People → Add), hides the course as independently takeable in the public catalog, and does not revoke grants that already exist.
16. Dashboard/LMS path URLs use `learning_path.publicId` (8 mixed-case `[0-9A-Za-z]`). Teachers land on `/paths/[publicId]/setup` after create; Courses default is `/paths/[publicId]`. A path visit of a course is `/paths/[publicId]/courses/[courseId]/*` — the **same** course pages as `/courses/[courseId]/*`; path chrome is ribbon only. `/lms/mylearning` does not change.
17. `/paths/[publicId]/setup` exists as a workspace subpage using org setup chrome (`Page.*`, `Item.*`). It is not the create modal. `/courses/[id]/setup` is out of scope here and can copy this later.



## Risks and Mitigations

- **Unlock-rule evaluation cost** (checked on every lesson/exercise completion): scope the check to paths containing that course with the learner as member; index `learning_path_course.courseId`.
- **Auto-enroll transaction size** for large paths/cohorts: batch inserts with `ON CONFLICT DO NOTHING`; >500 members → background job (same mitigation as Programs).
- **Price drift**: savings computed at read time, so course price changes are always reflected; if a course in an active path becomes free/pricier, surface a notice in the Settings pricing section.
- **Learner already enrolled in a member course independently**: idempotent enrollment; their existing progress counts toward the unlock rule immediately (decide: acceptable and desirable).
- **Locked-course deep links** shared between learners: API must enforce the lock (not just UI), returning a typed error the frontend renders as the locked state.
- **Landing theme sprawl** (10 themes): v1 ships the paths section/pages for the base + `minimal` theme with a neutral fallback for others, mirroring how course landing tokens are layered.
