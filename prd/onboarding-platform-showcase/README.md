# Onboarding Platform Showcase PRD

## Status
- Draft

## Date
- May 20, 2026

## Purpose
Redesign the new-user onboarding flow so creators see (a) what their public-facing **org landing page** can look like and pick a theme, and (b) land in a workspace that is already pre-populated with **goal-relevant demo courses** instead of an empty `/courses` page. The goal is to move first impression from "blank slate" to "this platform is alive and ready for me."

## Problem Statement
Today's onboarding is a sterile 2-step form:

1. Org name + slug + full name
2. Goal + source + locale

Then the user is dropped onto `/org/{slug}/courses?create=true` — a page with zero courses, zero branding decisions made, and no visible evidence that ClassroomIO is anything more than a CRUD form for a course list. Two problems compound:

1. **The landing page feature is invisible.** We ship 8 production-quality landing page themes (`minimal`, `bold`, `classic`, `saas`, `tech`, `studio`, `corporate`, `terminal`) with full preview PNGs, but new users never see them — they have to discover Settings → Landing Page on their own.
2. **The workspace looks empty.** New users have no reference for what a "real" ClassroomIO course looks like (sections, lessons, video embeds, certificates). They have to imagine the product from a blank canvas.

Result: low activation, high time-to-first-meaningful-action, and the impression that the platform is thinner than it actually is.

## ICP (Primary)
1. SaaS founders launching a product academy.
2. Independent course creators selling self-paced cohorts.
3. Operations leaders running employee/compliance training.
4. Customer-success teams running customer enablement.

## Target Jobs-To-Be-Done
1. Quickly evaluate whether ClassroomIO can produce a school site that looks like the creator's brand.
2. See what a "good" course structure looks like on the platform without having to build one to find out.
3. Get to a publishable-feeling state in a single session.

## Confirmed Product Decisions
1. **Theme picker** is a real step (not a passive preview gallery). The user's selection is persisted to `organization.landingPage.theme`.
2. **Auto-seed goal-relevant demo courses** — no extra picker step. The existing `goal` answer in metadata drives which course set lands in the org.
3. **Step order**: `org-setup → theme-picker (+ course preview) → user-metadata → seed-and-redirect`.
4. **Course source**: a **new curated demo set** authored in code (not the existing `seedCourses()` templates in `packages/db/src/utils/seed/course.ts`, which were built for E2E/dev seeding).

## Non-Goals (v1)
- AI-generated courses from a URL — that is a separate initiative tracked in `prd/onboarding-ai-bootstrap/`.
- Custom theme editing inside onboarding (colors, hero text, logo upload). The full landing-page editor stays in `/settings/landingpage`.
- Letting the user pick *which* demo courses to seed. Goal-mapping is opinionated.
- Multi-language demo course content. v1 demo courses ship in English only; the user's `locale` choice affects UI chrome but not seeded course text.
- Surfacing demo courses on the **public** landing page automatically — they seed as unpublished/draft so the org owner reviews first.

## Data Sources Checked
- `apps/dashboard/src/routes/(auth)/onboarding/+page.svelte`
- `apps/dashboard/src/lib/features/onboarding/api/onboarding.svelte.ts`
- `apps/dashboard/src/lib/features/onboarding/utils/constants.ts`
- `apps/dashboard/src/lib/features/onboarding/utils/types.ts`
- `apps/dashboard/src/lib/features/onboarding/components/verify-email-modal.svelte`
- `apps/dashboard/src/lib/features/onboarding/components/welcome-modal.svelte`
- `apps/dashboard/src/lib/features/org/utils/landing-page.ts`
- `apps/dashboard/src/lib/utils/types/org.ts`
- `apps/dashboard/src/lib/features/settings/pages/landingpage.svelte`
- `apps/dashboard/static/templates/*.png` (8 theme preview PNGs)
- `packages/ui/src/custom/org-landing-page/` (theme component implementations)
- `apps/api/src/routes/onboarding/onboarding.ts`
- `apps/api/src/services/onboarding.ts`
- `apps/api/src/services/course/course.ts` (createCourse pattern)
- `apps/api/src/services/course-import/course-import.ts` (bulk lesson/section seed pattern)
- `apps/api/src/routes/organization/course-import.ts`
- `packages/db/src/schema.ts` (organization, course, courseSection, lesson, courseImportDraft)
- `packages/db/src/utils/seed/course.ts` (existing dev seed, reference only)
- `packages/utils/src/validation/onboarding/onboarding.ts`
- `prd/onboarding-ai-bootstrap/README.md` (sibling initiative, must not conflict)
- `prd/org-landing-page-theme-picker [DONE]/README.md` (foundation shipped Apr 2026)

## Current Baseline (As-Is)
1. `ONBOARDING_STEPS = { ORG_SETUP: 1, USER_METADATA: 2 }` — two steps.
2. `createOrganizationWithOwner` creates the org with `landingPage = createDefaultLandingPageSettings()` (theme `'minimal'`, default hero copy from `defaultLandingPageHero` in `apps/dashboard/src/lib/features/org/utils/landing-page.ts:33`).
3. `updateUserOnboarding` saves goal/source/fullname, updates user locale, and the API class redirects to `/org/{siteName}?welcomePopup=...`.
4. No course creation happens during onboarding. The "create=true" query param on the courses page is unused.
5. Theme picker exists *only* in `/settings/landingpage` — never surfaced to first-time users.
6. The 8 theme preview PNGs at `apps/dashboard/static/templates/{theme}.png` are already shipped and used by the settings editor; we can reuse them as-is.

---

## Proposed Experience

### Step 1: Account + Org Basics (unchanged)
- `fullname`
- `orgName`
- `siteName`

On submit: existing `createOrganizationWithOwner` runs and the org is created with the default `'minimal'` theme.

### Step 2 (NEW): Theme Picker + Course Preview

Single screen, two stacked sections inside the existing centered onboarding card.

**Top section — "Pick a look for your school"**
- Responsive 4-up grid (collapsing to 2-up on small screens) of 8 theme cards.
- Each card: `/templates/{theme}.png` + theme display name + a subtle "Selected" ring when active.
- Default selection: `minimal` (matches what was already saved at org-create time).
- Clicking a card sets local `fields.theme`. No autosave — persistence happens on "Continue".

**Bottom section — "Your workspace will come pre-loaded"**
- 4 static course-tile mockups (using the same primitive `/courses` uses) showing variety: one `SELF_PACED`, one `LIVE_CLASS`, one `COMPLIANCE`, one with a certificate badge.
- Subtext: "We'll add a few sample courses you can edit, publish, or delete."
- These tiles are *previews only* — not the actual courses that will be seeded. They communicate "you're not landing in an empty room."

**Continue**: calls a new `POST /onboarding/select-theme` with `{ theme }`, then advances to step 3.
**Back**: returns to step 1 without losing org data (org is already persisted; back is just a step-state change).

### Step 3: User Metadata (unchanged in shape, behavior change on submit)
- `goal` (radio)
- `source` (radio)
- `locale` (select)

On submit: existing `updateUserOnboarding` runs, **then** the route invokes `seedDemoCoursesForGoal(orgId, profileId, goal)` synchronously (with a short timeout — see FR-4) before returning. Response includes `seededCourseIds` so the frontend can surface them in the post-redirect view.

### Post-Onboarding
- Redirect to `/org/{siteName}/courses` (drop the `?create=true` marker — it was unused and the page is no longer empty).
- The existing `welcomePopup` modal still fires and now references the seeded courses ("We added a few sample courses to get you started — feel free to edit or delete them.").

---

## Functional Requirements

### FR-1 — Theme Persistence
- `POST /onboarding/select-theme` accepts `{ theme: OrgLandingPageTheme }`, validates against `landingPageThemes` (8 values), and patches `organization.landingPage.theme` using a `jsonb_set` so other landing-page fields (hero, navItems, footer) remain untouched.
- Endpoint requires `authMiddleware`. Caller must be the owner of the org tied to the current onboarding session.
- Idempotent — re-submitting the same theme is a no-op success; re-submitting a different theme overwrites.

### FR-2 — Curated Demo Course Set
- Define `DEMO_COURSES_BY_GOAL: Record<OnboardingGoal, DemoCourseSpec[]>` in `packages/db/src/utils/demo-courses/index.ts`.
- Each `DemoCourseSpec` includes: `title`, `description`, `overview` (markdown), `type` (`SELF_PACED` | `LIVE_CLASS` | `COMPLIANCE` | `PUBLIC`), `bannerImage` (URL to a static asset), optional `certificate` config, and a `sections: Array<{ title, lessons: Array<{ title, note, videos? }> }>` tree.
- Lesson content: title + ~150-word markdown `note` + optional public YouTube embed reference. No file uploads required.
- Target size: 2 courses per goal, 3 sections per course, 3 lessons per section — enough to look real, cheap to seed.
- Mapping (initial):
  - `sell-online` → "Launch Your First Paid Course" (`SELF_PACED`), "Marketing Funnels for Course Creators" (`SELF_PACED`)
  - `teach-online` → "Designing Engaging Live Cohorts" (`LIVE_CLASS`), "Active Learning Toolkit" (`SELF_PACED`)
  - `employees` → "Workplace Compliance 101" (`COMPLIANCE`, with certificate), "Manager Essentials" (`SELF_PACED`)
  - `customers` → "Customer Onboarding Bootcamp" (`SELF_PACED`), "Product Mastery" (`PUBLIC`)
  - `expanding-platform` → one of each `type` (broadest exposure)

### FR-3 — Demo Course Seeding
- New service `seedDemoCoursesForGoal(orgId, profileId, goal)` in `apps/api/src/services/onboarding/seed-demo-courses.ts`.
- Internally calls a new query helper `createDemoCoursesForOrg(orgId, ownerProfileId, specs)` in `packages/db/src/queries/onboarding/demo-courses.ts` that runs **inside a single transaction**, mirroring the insert shape used by `createCourse` (`apps/api/src/services/course/course.ts:181`) — group + course + group-member + default section + welcome newsfeed — extended for the additional sections/lessons.
- Seeded courses are created with `isPublished: false` and `isTemplate: false` so they appear as drafts the owner can edit/publish/delete.
- **Idempotency**: before seeding, the service counts the org's non-template courses; if `>= 1`, it skips. This guards against double-submit of `/update-metadata`.

### FR-4 — Seed Failure Doesn't Block Redirect
- The `/update-metadata` handler awaits `seedDemoCoursesForGoal` with a 5-second timeout.
- On timeout or thrown error: log structured warning (`onboarding.seed_demo_courses.failed` with `orgId`, `goal`, `error`), return `{ success: true, data: { ...metadata, seededCourseIds: [] } }` so the user is not stranded. A background retry is **not** in scope for v1.

### FR-5 — Theme Picker UI
- New `apps/dashboard/src/lib/features/onboarding/components/theme-picker.svelte`.
- Renders the 8-theme grid + the 4-tile preview block.
- Theme list is sourced from `landingPageThemes` in `apps/dashboard/src/lib/features/org/utils/landing-page.ts:22` (single source of truth).
- Theme labels are translation keys: `onboarding.theme.{themeId}`.
- Preview tiles reuse the existing course-card primitive (the one rendered at `/courses` — verify the component name during implementation; if multiple exist, pick the one used in the published course list).

### FR-6 — Step Constants & Progress Bar
- Update `ONBOARDING_STEPS` to `{ ORG_SETUP: 1, THEME_PICKER: 2, USER_METADATA: 3 }`.
- The existing progress bar (`apps/dashboard/src/routes/(auth)/onboarding/+page.svelte:24`) uses `Object.keys(ONBOARDING_STEPS).length`, so it auto-scales.
- Back button is enabled on steps 2 and 3 (currently only enabled when `step > ORG_SETUP`).

### FR-7 — Validation
- Add `ZOnboardingSelectTheme` in `packages/utils/src/validation/onboarding/`:
  ```ts
  export const ZOnboardingSelectTheme = z.object({
    theme: z.enum(LANDING_PAGE_THEMES)
  });
  ```
- `LANDING_PAGE_THEMES` must be a single shared literal exported once (either from `@cio/ui/custom/org-landing-page/types` or `@cio/utils`) and reused by both the validator and the frontend `landingPageThemes` array.

### FR-8 — Frontend Type Hygiene
- Per CLAUDE.md frontend conventions:
  - All request/response types live in `apps/dashboard/src/lib/features/onboarding/utils/types.ts`, inferred from the API (`typeof classroomio.onboarding['select-theme'].$post`).
  - **No** type definitions in `.svelte.ts` files.
  - All copy lives in `apps/dashboard/src/lib/utils/translations/en.json` under `onboarding.theme.*`.

### FR-9 — Observability
- Emit funnel events (whatever analytics layer the dashboard currently uses — verify before instrumenting):
  - `onboarding.theme_picker_viewed`
  - `onboarding.theme_selected` (with `theme` property)
  - `onboarding.demo_courses_seeded` (with `goal`, `count`, `latency_ms`)
  - `onboarding.demo_courses_seed_failed` (with `goal`, `error`)
- These are additive; do not remove existing onboarding analytics.

### FR-10 — Self-Host Safety
- The demo-course seed payload is a static constant in `@cio/db`. Self-hosted instances get the same behavior with no external dependencies (no LLM calls, no image hosting beyond static assets bundled with the dashboard).
- Default theme `'minimal'` continues to be applied at org-create time, so users who skip step 2 (e.g. close the tab) still end up with a working landing page.

---

## Proposed API + Service Design

### Validation — `packages/utils/src/validation/onboarding/`
- `ZOnboardingSelectTheme` — see FR-7.
- `ZOnboardingUpdateMetadata` — **no shape change**; behavior change is server-side only.

### Routes — `apps/api/src/routes/onboarding/onboarding.ts`
- `POST /onboarding/select-theme` *(new)* — auth + zValidator(ZOnboardingSelectTheme); delegates to `selectOnboardingTheme(profileId, orgId, theme)`.
- `POST /onboarding/update-metadata` *(extended)* — after `updateUserOnboarding`, awaits `seedDemoCoursesForGoal(orgId, profileId, goal)` with timeout/log-on-fail behavior in FR-4. Returns `{ success: true, data: { ...existing, seededCourseIds } }`.

### Services — `apps/api/src/services/onboarding/`
- `select-theme.ts` — `selectOnboardingTheme(profileId, orgId, theme)`. Authorizes profile is owner; calls query helper.
- `seed-demo-courses.ts` — `seedDemoCoursesForGoal(orgId, profileId, goal)`. Idempotency check + delegate to query helper.

### Queries — `packages/db/src/queries/`
- `organization/landing-page.ts` — `updateOrgLandingPageTheme(orgId, theme)` using `jsonb_set`.
- `onboarding/demo-courses.ts` — `createDemoCoursesForOrg(orgId, profileId, specs)` running in a single transaction.

### Data — `packages/db/src/utils/demo-courses/index.ts`
- Static export `DEMO_COURSES_BY_GOAL` + types. Lives in `@cio/db` so both API services and (future) self-host migration tools can import it.

### Dashboard — `apps/dashboard/src/lib/features/onboarding/`
- `utils/constants.ts` — add `THEME_PICKER` step.
- `utils/types.ts` — extend `OnboardingField` with `theme?: OrgLandingPageTheme`; add request type for the new endpoint.
- `api/onboarding.svelte.ts` — add `submitTheme(theme)` method; update step dispatcher; advance to `USER_METADATA` on success.
- `components/theme-picker.svelte` *(new)* — the new step UI.
- `routes/(auth)/onboarding/+page.svelte` — extend the if/else block to a 3-way switch; wire back-button to step down through all 3 states.

---

## Data Model Changes
**None at schema level.** Both new behaviors reuse existing tables:
- Theme selection writes to the existing `organization.landingPage` jsonb column.
- Demo courses use the existing `course`, `courseSection`, `lesson` tables (no new columns).

No migration is required. (Aligns with the user's standing rule: schema edits stop at a passing `@cio/db` build; migrations are handled outside this workflow.)

---

## Translation Keys (new)
Under `onboarding.theme.*` in `apps/dashboard/src/lib/utils/translations/en.json`:
- `heading` — "Pick a look for your school"
- `subheading` — "You can change this anytime in settings."
- `demo_heading` — "Your workspace will come pre-loaded"
- `demo_subheading` — "We'll add a few sample courses you can edit, publish, or delete."
- `minimal`, `bold`, `classic`, `saas`, `tech`, `studio`, `corporate`, `terminal` — display labels.

---

## UX Quality Bar
Per the user's standing UI rules:
- Use `@cio/ui/base/card` for theme tiles, with `ui:ring-primary` for selected state (color tokens prefixed `ui:` for theme resolution).
- Use the same course-card primitive `/courses` uses for the preview tiles — do not invent a new card. If a suitable component does not exist, extract one rather than copy-pasting markup.
- No hardcoded user-facing strings.
- No native `<input>` / `<label>` in this UI; use `@cio/ui/custom/*-field` wrappers if any inputs are needed (none required for v1, but applies if scope grows).

---

## Rollout Plan
1. **Phase 1 — internal alpha (week 1)**: ship behind a soft "feature flag" by gating step 2 on an env var (`PUBLIC_ONBOARDING_SHOWCASE_ENABLED`) so we can test in staging without exposing to prod signups.
2. **Phase 2 — 25% cloud rollout (week 2)**: bucket by user ID hash.
3. **Phase 3 — 100% cloud (week 3, assuming no regression)**: remove the env gate; legacy 2-step flow code is deleted.
4. **Phase 4 — self-host**: ships with the next normal release; no toggle needed (no external dependencies).

---

## Success Metrics
1. **+15% relative lift in onboarding completion** (step-3 submit / step-1 view).
2. **+30% relative lift in "user views the public landing page in their first session"** — proxy for "did the theme picker land?"
3. **+50% relative lift in "user edits at least one course in their first session"** — proxy for the seeded courses being a real lure into the editor.
4. **Median onboarding time stays under 4 minutes** — adding a step must not bloat the flow.
5. **<2% seed-failure rate** measured by `onboarding.demo_courses_seed_failed` over `onboarding.theme_selected`.

---

## Risks and Mitigations
1. **Risk**: Seeded demo courses confuse users who think they're real templates they have to keep. **Mitigation**: courses ship as `isPublished: false` drafts; welcome popup copy explicitly says "feel free to edit or delete"; a small "Sample" badge on the course card is a v1.1 candidate.
2. **Risk**: Demo course content drifts and looks dated. **Mitigation**: content is in code (`DEMO_COURSES_BY_GOAL`) and reviewed every release; quarterly content refresh is owned by the content team.
3. **Risk**: Seed transaction is slow on large goal sets (5+ courses × 9 lessons each = lots of inserts). **Mitigation**: bulk insert with a single transaction; cap demo set at 2 courses × 3 sections × 3 lessons; FR-4 timeout protects the user-facing path.
4. **Risk**: Goal value drift (someone adds a 6th goal to `GOALS`) breaks the `DEMO_COURSES_BY_GOAL` lookup. **Mitigation**: TypeScript `Record<OnboardingGoal, ...>` makes this a compile-time error; CI catches it.
5. **Risk**: Conflict with the parallel `onboarding-ai-bootstrap` PRD. **Mitigation**: that PRD adds a *website URL* step and AI-generated courses; this PRD's theme step and curated demo set are orthogonal and can stack later (AI courses replace demo courses when AI flow runs; theme picker is shared). Document in `prd/onboarding-ai-bootstrap/README.md` once both are merged.
6. **Risk**: Theme choice in onboarding gets overwritten by the default-applied theme on org create. **Mitigation**: org create still applies `'minimal'` default; the new `/select-theme` endpoint runs after and uses `jsonb_set` to patch only the theme field — confirmed by manual E2E in the verification plan.

---

## Open Questions
1. Should the preview tiles in step 2 be **personalized** with the org's just-entered name (e.g. "Welcome to {orgName}") to feel less canned? Adds complexity for marginal trust gain.
2. Should the welcome popup link directly to one of the seeded courses to encourage immediate editing, vs. dropping the user on the courses list?
3. Should `locale != 'en'` users see a banner saying "Sample courses are in English — translate or replace as you like" instead of getting English-language content silently?
4. Do we want to display a "Sample" pill on the seeded courses in the course list so the owner remembers what's editable demo content? (Recommendation: yes, but ship in v1.1.)
5. Should the theme picker also let the user upload a logo? (Recommendation: no — keep scope tight; logo upload lives in settings.)

---

## Verification Plan
1. **Build**: `pnpm --filter @cio/db build && pnpm --filter @cio/api build && pnpm --filter @cio/dashboard check`
2. **Manual E2E**, fresh user per run:
   - Sign up → confirm step 1 looks unchanged.
   - Step 2: 8 themes render with correct preview PNGs; selection ring follows clicks; "Continue" persists theme.
   - Step 3: submit metadata → confirm redirect to `/org/{slug}/courses` populated with 2 demo courses matching the chosen goal.
   - Public landing page `/{slug}` renders the picked theme (not `minimal`).
   - Settings → Landing Page reflects the picked theme.
   - Open a seeded course → confirm sections, lessons, and lesson notes render.
3. **Goal coverage**: run the E2E once per `goal` value (5 runs) — confirm correct course set per goal.
4. **Idempotency**: replay `POST /onboarding/update-metadata` via dev tools — confirm no duplicate courses created.
5. **Seed failure path**: temporarily throw inside `createDemoCoursesForOrg` — confirm user still completes onboarding and lands on `/courses` (empty but functional), and that `onboarding.demo_courses_seed_failed` log line emits.
6. **Theme override**: change theme via back button in step 2 multiple times — last selection wins.
