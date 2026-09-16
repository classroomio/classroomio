# Learning Paths PRD

## Status

- Draft (prototyped, ready for engineering review)

## Implementation source of truth — courses in the app

**Binding rule.** How courses work in the live dashboard is the source of truth for everything that is not unique to learning paths. Enrolment, settings, sidebar, layouts, search, filters, drag-and-drop, create flow, listing pages, People, certificates, landing-page editor, publish, org nav, LMS chrome: copy the existing course implementation. Reuse the same components (`Page.*`, `Search`, `CourseFilterPopover` / `SortSelect`, `Page.SettingsActions`, `UnsavedChanges`, `Field.Group` / `Field.Set`, `svelte-dnd-action` Start/End reorder, `invitation-modal`, `CourseSidebar`, course landing overlay + live preview). Do not invent a second version of those.

This rule **overrides** Confirmed Decisions 13–33 (now collapsed to a do-not-copy list) and any leftover prototype copy in Functional Requirements. Those passages describe prototype exploration. They are not an implementation spec. When a later section, a prototype HTML file, or this document disagrees with the live course UI on a **shared** pattern, **the live course UI wins**.

The prototypes in [`prototypes/learning-paths/`](../../prototypes/learning-paths/) show **path-specific** product only (ordered curriculum, path hub, public path page, unlock ribbon, bundle savings). They are not a redesign brief for the rest of the app. CSS classes, pill filters, metric rings, glass badges, card systems, and LMS IA in the prototype are exploration — implement with the components courses already use.

**Do not reinvent the wheel.** Except for something that only exists on a learning path, structure, share, and implement the same way courses do today.

Path-specific only (do not look to courses for these): ordered course list and sequential unlock, bundle price and savings, path hub / journey spine, in-course path ribbon, `course.requiresLearningPath`, path certificate as a second credential, `course_enrollment_grant` origin, public path landing sections that courses do not have. How a path course is addressed in the URL is **open** — see [Course-in-path player URL (open)](#course-in-path-player-url-open).

### Shared patterns — implement like courses

| Concern | Course source of truth |
| --- | --- |
| Org listing | `org/[slug]/courses` + `features/course/pages/courses.svelte`: `Page.Root` / `Page.Header` / `Page.Body`, `Search`, filter popover, grid/list toggle (admin only), cards or `ResourceListRow`, `CreateCourseButton`, `CoursePublishBadge`, `Empty` |
| Create | `?create=true` → `NewCourseModal` (title + description), then land in the workspace. Not a dedicated setup page |
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
| Dedicated `/paths/[id]/setup` checklist as the create flow | Courses create via modal, then workspace | Create modal → path workspace. Optional in-workspace setup chip is fine if it mirrors org setup items, not a separate IA |
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
7. **Teacher workspace sidebar**, same shell as `CourseSidebar` (not horizontal tabs): Courses (ordering), People, Analytics, Landing page, Certificate, Settings. **No path newsfeed** (Programs covers cohort communication).
8. **Visitor access is teacher-configurable**: teaser only / full syllabus / syllabus + preview lessons.
9. **Public path page follows the Coursera professional-certificate shape**: hero with stats + enroll CTA, what-you'll-learn, skills tags, sequential course cards with per-course outcomes and lesson outlines, certificate block, instructors, testimonials, FAQ accordion, pricing card.
10. **Org landing page: Learning Paths section sits ABOVE the Courses section.** Plus a `/paths` catalog page and `/path/[slug]` detail page mirroring how `/courses` and `/course/[slug]` work today.
11. **Course independence is a course-level switch.** A course can sit in multiple paths. `course.requiresLearningPath` default **false** (still independently enrollable). When **true**, learners cannot take it on its own: public `/course/[slug]/enroll`, Explore, course invite links, and course People → Add are rejected. Access is a live `LEARNING_PATH` grant. Turning the flag on does not revoke existing independent grants. Removing a course from a path or a learner from a path never deletes `groupmember` rows or progress.
12. **Publish flag, not a status enum.** Same paradigm as `course.isPublished`: a boolean. Unpublished paths are hidden from the public catalog and reject self-enrollment. Already-enrolled learners keep access; teachers can still add members from the People page while building. No Draft / Archived / Published enum.

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

The prototype HTML remains useful for **path-specific** surfaces (path hub, in-course ribbon, public path page sections, bundle savings). Shared UI is implemented like courses. Path-specific product in Decisions 1–12 still stands.

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
| Setup checklist pattern | `routes/(app)/org/[slug]/setup/+page.svelte` + `PercentRingProgress` + `Item.*` | Optional in-workspace chip only. Courses do not use a dedicated setup route as the create flow; neither should paths |

## Product Goals

1. A visitor can discover a path on the org landing page, read a full Coursera-style path page, and self-enroll (paid or free).
2. Enrolling in a path creates path membership and grants course access for courses unlocked now (not necessarily every course at once).
3. A learner has **one** My Learning page: path cards (membership) and course cards (non-path grants only), different card components. Path hub at `/paths/[id]`.
4. Opening a course from a path shows that path’s in-course ribbon. Independent taking (when allowed) stays `/courses/[id]/lessons` with no ribbon. **The player URL that names which path this visit is is not locked** — see [Course-in-path player URL (open)](#course-in-path-player-url-open).
5. Teachers create a path the same way they create a course (`?create=true` modal, title + description), then work in a `PathSidebar` workspace: order courses (Start/End reorder like lessons), People (`invitation-modal`), Settings (`Page.SettingsActions`), landing editor, certificate, analytics. Optional in-workspace setup chip only — not a dedicated setup IA.
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

**My Learning** (`/lms/mylearning`) — one page, to avoid two libraries of the same work. Existing In progress / Complete `UnderlineTabs`, `Search`, **grid only**. The grid mixes two card types (different components, not the same course card with a badge):

- **Path card** — one per path membership (course count, path progress). Opens `/paths/[id]`. Does not explode into five course cards.
- **Course card** — only courses with a live **non-path** grant (`SELF_ENROLL`, `INVITE`, `ADMIN_ADD`, `COHORT`, …). Opens `/courses/[id]/lessons`. Path-granted-only courses do not appear here, even after they unlock.

**Explore** (`/lms/explore`): add published paths to the existing Explore page. Keep its toolbar. A `requiresLearningPath` course is not independently enrollable here; CTA is the path(s) it belongs to.

**Certificates**: a path certificate appears on the existing LMS Certificates page the same way a course certificate does.

**Path hub `/paths/[id]`** (`path-detail.html` — path-specific): journey spine of ordered courses with Completed / In progress / Locked. Opening a course from here is a path visit: the ribbon (“Course 3 of 5”, next unlock, back to hub) is **that** path. A course can sit in several paths, so the visit needs a path identity. **Which URL carries that identity is open** — see [Course-in-path player URL (open)](#course-in-path-player-url-open).

**Course in a path** (`course-in-path.html` — path-specific): same course player; do not fork the lesson/exercise pages. Independent taking (live non-path grant) stays at `/courses/[id]/lessons` with no ribbon. A `requiresLearningPath` course is not independently enrollable; hitting `/courses/[id]/lessons` without a non-path grant is rejected or sent to the path hub / My Learning (exact redirect depends on the URL we pick).

**Unlock enforcement**: locked courses have no live `LEARNING_PATH` grant for that path; the player 403s (or shows locked) however we address it. Independent access to the same course (non-path grant) still uses `/courses/[id]/lessons` and is not blocked by another path’s sequential unlock.

### 3. Teacher — admin dashboard

**Org listing `/org/[slug]/paths`**: same page as `org/[slug]/courses` / `features/course/pages/courses.svelte`. `Page.Root` / `Page.Header` / `Page.Body`, one Create CTA (`?create=true` → create modal, title + description, land in the workspace), `Search`, `CourseFilterPopover` / `SortSelect`, admin grid/list toggle, `CourseCardList` / `CourseListRow` (or the shared `ResourceListRow`) with a context menu, `CoursePublishBadge`, `Empty`. Path-specific fields only: course count, etc. **No** metric cards, **no** second Create Course button, **no** prototype `.apath-card` / `.lp-row` / glass badges, **no** pill filters.

**Create**: not a dedicated `/paths/[id]/setup` page. Optional in-workspace setup chip (org setup `Item.*` / ring) is allowed; it is not the create IA.

**Path workspace `/paths/[id]/*`**: `PathSidebar` copied from `CourseSidebar` (`BackButton`, identity, **sidebar nav**, header). Not nested under `/org/[slug]`. Not horizontal tabs.

| Nav | Course analogue | Contents |
| --- | --- | --- |
| Courses | Lessons / content list | Sequential-unlock toggle (path-specific). Reorder with the **same Start reorder / End reorder** mode as course content (`svelte-dnd-action`); persist when reorder ends. Add-course picker; remove confirms nobody is unenrolled. Prototype always-on drag is wrong. |
| People | `courses/[id]/people` | Header Add → `?add=true` → `invitation-modal` (existing members, bulk email, invite link). `Search` + role `Select`. Table like course People; path-specific columns: current course, path %. Remove revokes the path grant; they keep the course only if another live grant remains. |
| Analytics | Course analytics | Path-specific funnel (enrolled, drop-off, stuck lessons/exercises). This is where listing metric cards belong, not the org listing. |
| Landing page | `courses/[id]/landingpage` | **Same editor chrome**, not a form in the path workspace. Full-screen overlay, left section list, right live path-page preview (`editMode` + `setLandingPageEditContext`). Map existing course sections: header (hero), goals (what you'll learn), chips (skills), instructor (auto from course tutors + show toggle), reviews (testimonials), certificate, pricing (add show-savings). Path-only sections: visitor access (teaser / syllabus / syllabus+preview), FAQ, sequential course series with per-course outcomes. Curriculum on a course is auto from lessons — here the series is the ordered path courses. Do not copy the prototype’s stacked cards, radio-cards, or external “View live page” link. |
| Certificate | `courses/[id]/certificates` | Award toggle, title/issuer, preview, `Page.SettingsActions`. Path-specific: issued on full path completion. |
| Settings | `courses/[id]/settings` | `Field.Group` / `Field.Set` / `Field.Separator`, `isPublished` `Switch`, `UnsavedChanges`, sticky `Page.SettingsActions`. Path-specific fields: bundle price, show-savings, sequential unlock, auto-enroll, self-enrollment. Danger zone deletes the path, not courses or progress. Course settings (on the course) gain `requiresLearningPath` next to `allowSelfEnrollment`. |

### 4. Access control

- Org admins manage all paths; path-level TUTOR role can manage content but not delete (mirror Programs roles: ADMIN/TUTOR/STUDENT via `roleId`).
- Students: read path data they're members of (including unpublished paths they already joined). Public endpoints serve published paths only.
- Unpublished paths: admin/tutor only on public/catalog surfaces. Self-enrollment and public invite-link enrollment are rejected, matching `enrollInCourse`'s `isPublished` gate. Teachers can still add members from the People page. Unpublishing does not revoke existing grants.

#### Alignments

- **One shared progression.** One enrolment and one progress record per learner per course. A course they already finished counts in the path. Work in the path counts on the course.
- **Progression lives in existing course tables.** Truth: `lesson_completion` and `submission`. Caches: `learning_path_member_course` and `learning_path_member`. Course completion: `groupmember.certificateEarnedAt`. Path completion: `learning_path_member.completedAt`.
- **Access is `groupmember` plus a grant.** Joining a path writes `learning_path_member`, then a `groupmember` row if missing, then a `LEARNING_PATH` grant. Sequential unlock delays that grant until the course unlocks. Origin is `course_enrollment_grant`, not `groupmember`.
- **Path vs personal.** `source = LEARNING_PATH` + `learningPathId` vs `SELF_ENROLL` / `INVITE` / `ADMIN_ADD`. Both at once is allowed. The People page shows one person, with both origins listed.
- **`requiresLearningPath` (course column, default false).** When true: reject independent student enroll (public enroll, Explore, course invite, course People → Add). Path People / path self-enroll still write a `LEARNING_PATH` grant. Existing independent grants stay. Explore/public CTA for that course is the path(s), not course enroll.
- **My Learning is one page.** Path membership → path card. Course card only if a live **non-path** grant exists. Unlocking a path course does not add a course card.
- **Course People, gradebook, and analytics include everyone with a live grant**, path students included. Source is a column, plus an optional page-local filter. Path funnel numbers live on `/paths/[id]/people` and `/paths/[id]/analytics`. Course **admin** routes stay `/courses/[id]/…` with no path in the URL.
- **In-path taking needs a path identity for the ribbon.** A course can belong to several paths. Progress is shared (`lesson_completion` / `submission`); only the chrome (ribbon, hub back-link, which unlock sequence this visit is in) is path-scoped. Independent taking stays `/courses/[id]/lessons`. **Player URL is not locked** — see [Course-in-path player URL (open)](#course-in-path-player-url-open).
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
| `/course/[slug]` | Public course page. If `requiresLearningPath`, enroll CTA is the path(s), not course enroll |
| `/course/[slug]/enroll` | Independent course enroll — **rejected** when `requiresLearningPath` |

LMS:

| URL | Role |
| --- | --- |
| `/lms/mylearning` | One library: path cards + independent course cards |
| `/lms/explore` | Discover paths and independently enrollable courses |
| `/lms/certificates` | Course + path certificates |
| `/paths/[id]` | Path hub (learner). Not `/lms/paths/[id]` |
| `/courses/[id]/lessons/…` | Independent player (live non-path grant). Path-visit player URL is **open** |

Dashboard:

| URL | Role |
| --- | --- |
| `/org/[slug]/paths` | Listing (`?create=true` → modal → `/paths/[id]/courses`) |
| `/org/[slug]/landingpage/edit` | Org landing editor (add paths section here) |
| `/paths/[id]` | Hub |
| `/paths/[id]/courses` | Order courses (teacher) |
| `/paths/[id]/people` | Roster (`?add=true`) |
| `/paths/[id]/people/[personId]` | Member detail |
| `/paths/[id]/analytics` | Funnel |
| `/paths/[id]/landingpage` | Overlay editor |
| `/paths/[id]/certificates` | Path certificate |
| `/paths/[id]/certificates/editor` | Design editor |
| `/paths/[id]/settings` | Path settings |
| `/courses/[id]/settings` | Course settings, including `requiresLearningPath` |

No `/paths/[id]/setup`. No `?learningPathId=` on `/courses/[id]/people` or other **course admin** routes. That constraint is about People / settings / analytics staying course-scoped; it does not by itself pick the learner player URL.

### Course-in-path player URL (open)

Not decided. Locked pieces: do not fork the player; independent taking stays `/courses/[id]/lessons`; course admin stays `/courses/[id]/…`; ribbon needs a path identity because a course can sit in several paths; progress is shared regardless of URL.

Teacher `/paths/[id]/courses` is the ordering page. Learner hub is `/paths/[id]`. Those two are listing/workspace, not the player.

Options (tradeoffs only — pick later):

| | Shape | Ribbon knows the path because | Bookmark / share | Layout / routing |
| --- | --- | --- | --- | --- |
| A | Same player `/courses/[id]/lessons` | Session/store set when opening from the hub. If only one live `LEARNING_PATH` grant, infer it. If several, last-opened or a picker | URL does not name the path. Returning later can lose the ribbon or pick the wrong path | Reuse `(app)/courses/[id]/+layout.svelte` as-is. No new route tree |
| B | Nested `/paths/[pathId]/courses/[courseId]/lessons` (and `…/lessons/[lessonId]`, `…/exercises/[exerciseId]`) | `pathId` in the path | Shareable. Two paths → two URLs, same progress | SvelteKit can nest under teacher `/paths/[id]/courses`, but `paths/[id]/+layout` would mix PathSidebar, hub, and player. Needs route groups / a player layout that is not the teacher workspace |
| C | Distinct learner prefix, e.g. `/paths/[pathId]/learn/[courseId]/lessons` (or `/take/`) | `pathId` in the path | Same as B | Avoids colliding with teacher `…/courses`. Still a second mount of the existing player pages |
| D | Query `/courses/[id]/lessons?path=[pathId]` | Query string | Shareable until something strips `?path=`. Easy to drop on in-player navigation | Reuse the course layout. Earlier “no `?learningPathId=`” was about **admin** course pages, not a veto of this shape for the player — still easy to leak into People / settings if we are sloppy |
| E | LMS-prefixed `/lms/paths/[pathId]/courses/[courseId]/…` | `pathId` in the path | Same as B | Splits learner path URLs under `/lms` while the hub is `/paths/[id]`. Consistent with My Learning / Explore sitting under `/lms`, inconsistent with the hub |

Whatever we pick: a `requiresLearningPath` course without a live non-path grant is not a valid independent take. Locked path courses 403 (or locked UI) from the grant, not from the URL string.

---

## Technical Design

### Data model (`packages/db/src/schema.ts`)

```
learning_path
  id uuid PK · organizationId FK(organization, cascade) · name varchar · slug varchar
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
  unique(organizationId, slug) · index(organizationId) · index(organizationId, isPublished)

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
| GET | `/learning-path` | org admin | List org paths (admin) |
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

- **Admin**: nav item in `org-navigation.ts` after Courses using `PathIcon` from `@cio/ui/custom/moving-icons`; routes `org/[slug]/paths/+page.svelte` (same listing as courses) and `/paths/[id]/{courses,people,analytics,landingpage,certificates,settings}` with a `PathSidebar` copied from `CourseSidebar`. Reuse `Page.*`, `Search`, `CourseFilterPopover`, `Field.*`, `invitation-modal`, `Page.SettingsActions`, and the lesson **Start reorder / End reorder** + `svelte-dnd-action` pattern. Optional in-workspace setup chip only — no `/setup` create route.
- **LMS**: one `/lms/mylearning` grid (path cards + independent course cards); Explore; hub `/paths/[id]`; in-path taking reuses the course player (URL open). Do not add an LMS Paths nav item.
- **Public**: paths section added to org landing themes (start `minimal`) via the **existing** org landing editor; `(org-site)/paths` and `(org-site)/path/[slug]` mirroring the **existing** courses catalog and course landing. Path public-page **editor** copies `courses/[id]/landingpage` (overlay + live preview), not `teacher-path-landing-editor.html`. Reuse `CourseSectionNav`, `CourseSocialProof`, `CourseCurriculum`-style rows, `CoursePricing` card, `LandingButton`, footer. `requiresLearningPath` courses do not self-enroll from `/course/[slug]/enroll`.

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
3. **Admin UI**: listing (course listing pattern) → `PathSidebar` + Courses (Start/End reorder) → Settings (`Page.SettingsActions`) → People (`invitation-modal`) → Landing editor → Certificate → Analytics. Optional setup chip, not a setup route.
4. **LMS**: mixed cards on `/lms/mylearning`; Explore; hub `/paths/[id]`; reuse the course player for in-path taking (URL open). Do not rebuild LMS home, sidebar, Exercises, Community, or Settings.
5. **Public**: landing section (minimal theme) → catalog (mirror `(org-site)/courses`) → detail page → enroll flow (free first, then paid via existing payment flow).
6. **Certificate issuance** + existing LMS Certificates page.

## Acceptance Criteria

1. Teacher can create a path (course create-modal pattern), add + reorder courses (Start/End reorder like lessons), set a bundle price, and publish it (`isPublished` + `Page.SettingsActions`).
2. Published paths appear on the org landing page above courses, in `/paths` (same catalog chrome as `/courses`), and at `/path/[slug]` with all enabled sections; unpublished paths do not.
3. Savings displays as bundle price vs summed course prices and updates when course prices change.
4. Visitor access level correctly gates lesson outlines/previews for non-enrolled visitors.
5. Enrolling (free or paid) creates the member row and grants course access for courses unlocked now, idempotently. Unpublished paths reject self-enrollment.
6. With sequential unlock on, course N+1 is locked until course N's lessons AND exercises are complete — enforced in UI and API; toggle off restores free order.
7. My Learning is one page: path cards for membership, course cards only for live non-path grants. Taking via a path shows that path’s ribbon. Locked path courses have no live grant and 403. Independent `/courses/[id]/lessons` is rejected when `requiresLearningPath` and there is no non-path grant. Player URL shape is not an acceptance criterion until picked.
8. Completing all courses sets `completedAt` and (when enabled) issues the path certificate, visible in LMS Certificates.
9. Removing a course from a path or a member from a path never deletes `groupmember` rows or progress. Path unenrollment revokes the path's grants; the learner keeps the course only if another live grant remains.
10. Adding a course to a path with existing students auto-enrolls them in that course (subject to sequential unlock).
11. Analytics funnel counts match member course-completion data.
12. Programs and standalone courses behave exactly as before.
13. All user-facing strings use translation keys; all builds and `pnpm format:check` pass.
14. Shared UI matches the live course implementation: org listing, create modal, `PathSidebar`, People (`invitation-modal` + role filter), Settings (`Field.*` + `Page.SettingsActions`), filters/search, LMS My Learning (tabs + grid only, mixed path/course cards), Explore toolbar, drag-reorder mode, **landing editor** overlay. Prototype Decisions 13–33 that redesigned those surfaces are **not** acceptance criteria.
15. `course.requiresLearningPath` blocks independent student enroll (public, Explore, course invite, course People → Add) and does not revoke grants that already exist.



## Risks and Mitigations

- **Unlock-rule evaluation cost** (checked on every lesson/exercise completion): scope the check to paths containing that course with the learner as member; index `learning_path_course.courseId`.
- **Auto-enroll transaction size** for large paths/cohorts: batch inserts with `ON CONFLICT DO NOTHING`; >500 members → background job (same mitigation as Programs).
- **Price drift**: savings computed at read time, so course price changes are always reflected; if a course in an active path becomes free/pricier, surface a notice in the Settings pricing section.
- **Learner already enrolled in a member course independently**: idempotent enrollment; their existing progress counts toward the unlock rule immediately (decide: acceptable and desirable).
- **Locked-course deep links** shared between learners: API must enforce the lock (not just UI), returning a typed error the frontend renders as the locked state.
- **Landing theme sprawl** (10 themes): v1 ships the paths section/pages for the base + `minimal` theme with a neutral fallback for others, mirroring how course landing tokens are layered.
