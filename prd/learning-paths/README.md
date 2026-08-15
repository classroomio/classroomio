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
| Learner (LMS) | `lms-home.html`, `paths.html`, `path-detail.html`, `course-in-path.html` |
| Teacher (admin) | `teacher-paths.html`, `teacher-path-setup.html`, `teacher-path-builder.html`, `teacher-path-people.html`, `teacher-path-analytics.html`, `teacher-path-landing-editor.html`, `teacher-path-certificate.html`, `teacher-path-settings.html` |

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

**Home** (`lms-home.html`): "Learning Paths" section above Courses when `enrolledPaths.length > 0`; path cards show segmented per-course progress (one segment per course: done/current/locked) + overall %, and "Next: {course}". Course cards belonging to a path carry a "{path} · i/N" chip.

**Nav**: "Learning Paths" item in the LMS sidebar with enrolled count badge, shown only when enrolled in ≥1 path.

**List `/lms/paths`** (`paths.html`): tabs In progress / Completed / All; rows with segment bar, next course, Continue / View certificate.

**Path hub `/lms/paths/[id]`** (`path-detail.html`): the journey spine — a vertical rail of course nodes that fills as courses complete. Per course: state (Completed / In progress / Locked), progress bar, lesson+exercise counts, unlock note ("Unlocks after Course N"), certificate end-row.

**Course in path** (`course-in-path.html`): when the visited course belongs to a path the learner is in, wrap the course view with a path ribbon — back pill to the path, "Course 3 of 5", overall path %, horizontal stepper (done/current/locked) — and a "Next in your path" callout under the lesson showing what completing this course unlocks.

**Unlock enforcement**: locked courses are not openable from path surfaces; direct navigation to a locked course (URL) shows a "locked — finish {course} first" state. Learners enrolled in a course independently (outside the path) keep their normal access.

### 3. Teacher — admin dashboard

**Org listing `/org/[slug]/paths`** (`teacher-paths.html`): nav item "Learning Paths" after Courses; stat cards (active paths, enrolled learners, completions); table (name, courses, learners, status); Create path → creation modal → setup checklist.

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

---

## Technical Design

### Data model (`packages/db/src/schema.ts`)

```
learning_path
  id uuid PK · organizationId FK(organization, cascade) · name varchar · slug varchar (unique per org)
  description text · coverImage text · status LEARNING_PATH_STATUS default 'DRAFT'
  cost numeric · currency varchar default 'USD' · showSavings boolean default true
  sequentialUnlock boolean default true · selfEnrollment boolean default true · autoEnroll boolean default true
  certificateEnabled boolean default true · certificateTitle text · certificateIssuer text
  landingPage jsonb  -- { headline, subheadline, visitorAccess: 'teaser'|'syllabus'|'preview',
                     --   outcomes: string[], skills: string[], showInstructors, testimonials: [...],
                     --   showTestimonials, faqs: [...], showFaqs }
  visitorAccess is inside landingPage; no relational IDs inside the jsonb (per repo rule)
  createdByProfileId FK(profile) · createdAt / updatedAt

learning_path_course
  id uuid PK · pathId FK(learning_path, cascade) · courseId FK(course, cascade)
  order integer NOT NULL          -- 1-based position; the gating sequence
  unique(pathId, courseId) · unique(pathId, order) · index(pathId)

learning_path_member
  id uuid PK · pathId FK(learning_path, cascade) · profileId FK(profile) · roleId FK(role)
  enrolledAt timestamptz · completedAt timestamptz nullable
  certificateIssuedAt timestamptz nullable · certificateId varchar nullable
  unique(pathId, profileId) · index(pathId) · index(profileId)

enum LEARNING_PATH_STATUS: ACTIVE | DRAFT | ARCHIVED
```

Notes:
- No denormalized progress on `learning_path_member` beyond `completedAt`; per-course progress is computed from existing lesson-completion + exercise-submission data (already queried for course cards).
- Savings figure is computed at read time from the sum of `course.cost` over path courses — never stored.
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

- **Admin**: nav item in `org-navigation.ts` after Courses; routes `org/[slug]/paths/+page.svelte` and `paths/[id]/{setup,courses,people,analytics,landing,certificate,settings}` with a `PathSidebar` mirroring the course sidebar pattern. Reuse `Item.*`, `PercentRingProgress`, `Field.*`, existing drag-reorder approach from lesson ordering if present.
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

## Risks and Mitigations

- **Unlock-rule evaluation cost** (checked on every lesson/exercise completion): scope the check to paths containing that course with the learner as member; index `learning_path_course.courseId`.
- **Auto-enroll transaction size** for large paths/cohorts: batch inserts with `ON CONFLICT DO NOTHING`; >500 members → background job (same mitigation as Programs).
- **Price drift**: savings computed at read time, so course price changes are always reflected; if a course in an active path becomes free/pricier, surface a notice in the Settings pricing section.
- **Learner already enrolled in a member course independently**: idempotent enrollment; their existing progress counts toward the unlock rule immediately (decide: acceptable and desirable).
- **Locked-course deep links** shared between learners: API must enforce the lock (not just UI), returning a typed error the frontend renders as the locked state.
- **Landing theme sprawl** (10 themes): v1 ships the paths section/pages for the base + `minimal` theme with a neutral fallback for others, mirroring how course landing tokens are layered.
