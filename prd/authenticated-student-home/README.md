# Authenticated Student Home PRD

## Status

- Draft — implementation plan for [classroomio/classroomio#961](https://github.com/classroomio/classroomio/issues/961)

## Prototypes

No prototype yet. This feature adds one settings control and one server redirect. Its UI states are fully specified in [FR-2](#fr-2--settings-control-customize-lms). If a prototype is wanted before build, create `prototypes/authenticated-student-home/customize-lms.html` following `skills/write-prd/SKILL.md` Phase 4. Once it exists, it becomes the UX source of truth.

## Purpose

Many academies use ClassroomIO as a private learning portal, not a storefront. For them, the public landing page is in the way: a signed-in student who opens `acme.classroomio.com` sees marketing copy and has to click **Continue Learning** before reaching anything useful.

This feature adds an organization setting, **Student home**, that admins configure on the Customize LMS page. The admin picks a learning-portal page (Dashboard, My Learning, Certificates, …) or a specific course. A signed-in student who opens the academy root (`/`) is then redirected there on the server, before any landing-page HTML renders. Anonymous visitors, staff, and signed-in non-members still see the landing page exactly as today.

## Problem Statement

- A signed-in student at `/` on an org site always gets the landing page. `routeUserToNextPage` deliberately returns early for public routes on org sites (`apps/dashboard/src/lib/features/app/init.svelte.ts:357-360`).
- Login lands on `/` by default (`(auth)/login/+page.svelte:109-110`). So every student who signs in from the academy's own sign-in page gets the marketing page before the portal.
- An org whose students all take one onboarding or compliance course cannot send them straight to it.
- There is no per-org control over where students start. Every academy behaves the same.

## Confirmed Decisions

These are the plan's decisions. Decisions marked ⚑ are product calls #961 did not answer explicitly; each states the recommendation and its reason. The questions that were open during planning are settled in [Recommendations on Former Open Questions](#recommendations-on-former-open-questions).

1. **Who is redirected:** only users whose **active** membership in *this* org has `roleId === ROLE.STUDENT` (3). ⚑ Admins and tutors are not redirected. They need `/` to see their own landing page, and the landing nav already gives them a one-click **Continue Learning**.
2. **Who is never redirected:** anonymous visitors, and signed-in users who are not members of this org. Non-members need the landing page's **Join Academy** CTA.
3. **Only the bare root route redirects.** Only a `GET /` on an org site (platform `?org=` in dev, tenant subdomain, verified custom domain, self-hosted). Explicit destinations still win: `?redirect=` after login, direct links to `/lms/*` or `/courses/*`, and the public `/courses` catalog.
4. **The redirect happens on the server**, in `apps/dashboard/src/routes/+page.server.ts`. There is no flash of the landing page, and it works the same on full loads and on client-side navigation to `/` (SvelteKit runs the server load for both).
5. **Unset means today's behaviour.** The default select option is **Landing page (default)**, which stores `NULL`. Existing orgs get no data change and no behaviour change.
6. **Storage is two typed columns, not one free-form URL.** ⚑ This deliberately refines the issue's "persist the route/path":
   - **LMS pages** store their canonical path (`/lms`, `/lms/mylearning`, …) in `student_home_path`. That follows the issue literally.
   - **Courses** store a real FK in `student_home_course_id`, never a `/courses/<uuid>/…` string. The repo rule ("Persisted columns store data… store the relationship (a real FK column)") forbids copying another row's identity into a string. An FK also lets Postgres null the setting when a course is hard-deleted, and it keeps the student-facing course path derived at runtime. If the course route ever changes, no stored data goes stale.
7. **One source of truth for LMS destinations.** A new pure registry in `packages/utils` defines every LMS page: key, path, label key, and availability rule. The sidebar, the search catalog, the settings options, server-side validation and the redirect resolver all read it, so they can never drift apart. This is the issue's "existing LMS navigation configuration should be the source of truth".
8. **Course options** are courses the org's students can open: `status = 'ACTIVE'`, `isPublished = true`, `isTemplate = false`, in this org. All course types are included.
9. **Course resolution per student is tiered.** ⚑ The admin picked the course so students start on it. Every tier gets the student as close to the course as they're allowed, without passing through a marketing page:

   | Student's situation | Destination | Why |
   | --- | --- | --- |
   | Can open the course (enrolled, org admin, or via a learning path) | `/courses/{id}/lessons?next=true` (`getStudentCourseContinuePath`) | Straight to their first incomplete lesson |
   | `PUBLIC`-type course | `/course/{slug}` | That route already skips the landing page and redirects to the first lesson |
   | Not enrolled; course is free and open for self-enrollment | `/course/{slug}/enroll?from=student-home` | A focused **Join course** screen, not the course's marketing page. One click, then straight into the lessons |
   | Not enrolled; course is paid, invite-only or closed to self-enrollment | `/lms` | The student can't get in on their own. A sales page or a blocked join screen would be a dead end, and the feature exists to keep signed-in students off marketing pages |

   The third tier uses the same rules the enroll page already applies: `isSelfEnrollmentAllowed(metadata)` and `isCoursePaid(cost, metadata)`, both in `@cio/utils`.
   - *Rejected:* `/course/{slug}` (the public course landing page) for non-enrolled students. It is a marketing page for the course: hero, outline, pricing. Sending signed-in students there defeats the feature's purpose.
   - *Rejected:* `/lms` for every non-enrolled student. It is safe, but it hides the one thing the admin chose to show them.
9a. **Arriving from the student home never enrolls a student by itself.** ⚑ Today the enroll page **auto-enrolls** a signed-in student on load (`$effect` → `completeEnrollment()` in `(org-site)/course/[slug]/enroll/+page.svelte`). That behaviour exists to resume an enroll the student started before logging in. A redirect from `/` carries no such intent. Enrolling is a consequential write: it sends welcome and "student joined" emails and fires analytics. So with `?from=student-home` the page skips auto-enroll and shows its existing **Join course** button. The student confirms with one click.
   - *Rejected:* letting auto-enroll run. It saves a click, but every homepage visit would silently enrol students and email teachers.
10. **Safe fallback is `/lms`.** Every invalid, unavailable, cross-org, unpublished, deleted or inaccessible destination resolves to `/lms`. That is the student's Dashboard, which every student can always open. The resolver never returns `/` and never returns an external origin.
11. **Placement:** a new **Student home** section at the top of `/org/[slug]/settings/customize-lms`. It saves with that page's existing `Page.SettingsActions` bar in the same `PUT /organization` request, so it is one save and one transaction. There is no separate settings page.
12. **Available on every plan.** ⚑ Routing is a basic portal capability. Plan-gated destinations (Certificates) are still gated by their own rule.
13. **Unavailable LMS pages stay visible but disabled** in the select, with the reason ("Turn it on in the Dashboard section below", "Available on paid plans"). That beats hiding them: the admin learns why a page is missing and how to enable it.
14. **LMS route guards ship in this PR.** Today, turning Exercises or Community off only hides the sidebar link; the pages still open by direct URL. The same registry that drives the sidebar and the student home also drives a guard in `(app)/lms/+layout.svelte`. A student on any LMS page that is unavailable for the org is sent to `/lms`. See [FR-6](#fr-6--lms-route-guards).
15. **The resolver still checks availability itself, even with the guards.** The guard is client-side and runs only after the org finishes loading. Without the resolver check, a student whose home is a turned-off page would get a server redirect to it, a flash of that page, then a second redirect to `/lms`. Checking in the resolver gives one hop to the right place. The settings warning needs the same answer anyway. Both call the same registry function, so nothing is duplicated.
16. **Signup and `/join-academy` honour the student home in this plan.** A brand-new student's first visit is when the student home matters most. Without this, every new student would land on `/lms` regardless of the setting. When there is no explicit `?redirect=` and the org has a student home, these flows go to `/`, and the same server redirect takes over. See [FR-7](#fr-7--signup-and-join-academy-honour-the-student-home).

## Current-State Audit

| Capability | Current state | Notes / file |
| --- | --- | --- |
| `/` on an org site | Renders the landing theme, never redirects | `routes/+page.server.ts`, `+page.ts`, `+page.svelte` |
| Post-auth routing on `/` | Returns early for public routes on org sites | `features/app/init.svelte.ts:357-360` (`routeUserToNextPage`) |
| Server session at `/` | Available. At runtime `locals` = `{ user, session, orgRoles, fromSessions }` | `hooks.server.ts:124-128`, `lib/utils/services/auth/session.ts`. **`App.Locals` (`app.d.ts`) declares `profile`/`organizations` and omits `orgRoles`. The type is wrong** |
| Session role freshness | `orgRoles` lives in a better-auth cookie cache, so it can be ~1h stale | `packages/db/src/auth.ts:96-102,148-158`. The resolver must confirm the role in the DB (see Risks) |
| Org on `/` server load | `PublicOrg` from `toPublicOrg`, stripped of `customization.dashboard`, plan details, etc. | `features/app/public-org.ts:14-51`. Fetched uncached on every request via `getOrgBySiteName` / `getOrgsByCustomDomain` / `getFirstOrg` |
| LMS nav config | `baseNavConfig` + `getLmsNavigationItems`. Visibility via `show(currentOrg)` | `features/ui/navigation/lms-navigation.ts:50-186`. Imports Svelte icons and `$env`, so the API cannot use it |
| LMS nav availability rules | Certificates: `!isOrgOnFreePlan(...)`. Exercises: `customization.dashboard.exercise`. Community: `customization.dashboard.community`. Everything else always on | Same file, l.68-73, 92, 99 |
| Other nav consumers | Breadcrumbs, search catalog | `navigation/lms-breadcrumbs.svelte`, `search/utils/static-catalog.ts` |
| LMS route guards | **None.** `/lms/exercises`, `/lms/community/**` (and `/lms/certificates` on the free plan) load by direct URL even when the sidebar hides them. No file under `routes/(app)/lms`, `features/lms` or `features/community` reads `customization` | Fixed in this PR ([FR-6](#fr-6--lms-route-guards)). `(app)/lms/+layout.svelte` is a plain sidebar shell today, so it is the natural place for the guard |
| Community API | `/community` endpoints use `orgMemberMiddleware` and do not check the toggle | They also serve the admin community at `/org/[slug]/community`, so the toggle cannot simply block them. See Non-Goals |
| Public course page `/course/[slug]` | Course marketing page (`CourseLandingPage`: hero, outline, pricing). **Enroll** → `/course/{slug}/enroll` (free) or a payment modal (paid). A `PUBLIC`-type course redirects straight to its first lesson | `(org-site)/course/[slug]/+page.server.ts`, `features/ui/course-landing-page/components/pricing-section.svelte:41-57` |
| Enroll page `/course/[slug]/enroll` | Focused join screen inside the auth card: title, description, **Join course** button. Anonymous → login/signup with `?redirect=` back here. **Signed-in → auto-enrolls on load** when `canJoinCourse`, then goes to `getStudentCourseContinuePath`. Paid or invite-only → "requires payment or invite" message + **Back to course** link to `/course/{slug}` | `(org-site)/course/[slug]/enroll/+page.svelte:61-67,151,196-211,250-260`, `+page.server.ts` (`requiresPaymentOrInvite`) |
| Enrollment rules (shared) | `isSelfEnrollmentAllowed(metadata)` and `isCoursePaid(cost, metadata)` | `packages/utils/src/functions/course-enrollment.ts:30`, `packages/utils/src/validation/course/course.ts:472`. The API already imports `isCoursePaid` |
| `organization.customization` | `json` (not jsonb), replaced wholesale on update. Zod is `z.record(z.string(), z.unknown())` | `packages/db/src/schema.ts:2404-2426`; `packages/utils/src/validation/organization/organization.ts:150` |
| Update org | `PUT /organization` → `authMiddleware` + `orgAdminMiddleware` → `updateOrg` → `updateOrganization` (deep-merges only `settings`) | `apps/api/src/routes/organization/organization.ts:843`, `services/organization.ts:780`, `packages/db/src/queries/organization/organization.ts:1180` |
| Customize LMS page | Local draft + snapshot dirty-check + `Page.SettingsActions`. Saves via `orgApi.update` | `routes/(app)/org/[slug]/settings/customize-lms/+page.svelte`, `features/settings/pages/customize-lms.svelte` |
| Course published / deleted | `isPublished` bool. Soft delete is `status = 'DELETED'` (no `deletedAt`). `isTemplate` bool | `schema.ts:785,819,698` |
| Course access check | `isUserCourseMemberOrOrgAdmin` + `ensureProgramCourseAccess` (learning-path backfill) in `courseMemberMiddleware` | `apps/api/src/middlewares/course-member.ts`, `packages/db/src/queries/group/group.ts:145`. Note: `isUserCourseMember` (l.120) throws on no rows, so do not use it |
| Org role in DB | `getOrganizationMemberRoleId(orgId, profileId)` (ACTIVE only) | `packages/db/src/queries/organization/organization.ts:206` |
| Student course entry | `getStudentCourseContinuePath(courseId)` → `/courses/{id}/lessons?next=true` | `features/course/utils/student-course-navigation.ts` |
| Select primitives | `@cio/ui/base/select` (groups, labels), `@cio/ui/base/command`, `@cio/ui/base/popover`. No combobox component | Grouped example: `features/course/components/exercise/question-type-select.svelte:72-116` |
| Org course search | `searchOrgCourses(orgId, search, limit)` (ACTIVE, non-template; no published filter) | `packages/db/src/queries/course/course.ts:1022` |
| Latest migration | `0029_add_italian_locale`, journal `when: 1791460509638` | Re-check against `origin/main` at merge time |

## Product Goals

1. A signed-in student who opens their academy's root lands where the academy wants them, with no landing-page flash.
2. Admins choose that destination by name ("My Learning", "SOC 2 Security Basics"), never by URL.
3. A destination that later breaks (course unpublished, Community turned off, plan downgraded) degrades silently to `/lms` for students. The admin sees an explicit warning.
4. Zero change for orgs that don't set it, for anonymous visitors, for staff, and for non-members.
5. Identical behaviour on `?org=` dev sites, tenant subdomains, verified custom domains and self-hosted.

## Non-Goals

- **Per-role or per-group homes.** One destination per org, for students only.
- **Redirecting staff** (admins/tutors) or adding a "preview as student" mode.
- **Arbitrary or external URLs** as the destination.
- **Changing entry points other than `/`, signup and `/join-academy`.** These keep their current targets:
  - login with `?redirect=`;
  - invite acceptance (`/lms`);
  - the app-host → tenant hop in `goToLMS` (`/lms`);
  - the landing nav's **Continue Learning** CTA (`/lms`).

  See [Recommendations](#recommendations-on-former-open-questions) for why.
- **Blocking the Community API when Community is off.** The same endpoints serve the admin community at `/org/[slug]/community`, so enforcing the toggle there needs a role-aware rule. Recommended as the next change after this plan (see Recommendations, item 4). FR-6 closes the student-facing pages, which is what the toggle promises admins today.
- **Public API / MCP exposure** of the setting.
- **A "skip redirect" escape hatch** (e.g. `/?landing=1`) for students. Revisit if academies ask for a "view our site" link.

## Functional Requirements

### FR-1 — Redirect at `/` (student)

On every `GET /` (full load or client navigation), the root `+page.server.ts` evaluates the following, in order. It stops at the first rule that fails, and a failed rule means the landing page renders as today:

| # | Condition | Result if false |
| --- | --- | --- |
| 1 | `isOrgSite && org` | Admin-host behaviour, unchanged |
| 2 | `org.hasStudentHome` (derived, see Technical Design) | Landing page |
| 3 | `locals.user` present | Landing page |
| 4 | `locals.orgRoles?.[org.id] === ROLE.STUDENT` (cheap session pre-check) | Landing page |
| 5 | `GET /organization/student-home/resolve` returns `{ path: string }` (DB-verified role + destination) | Landing page (`path: null`, API error, or timeout) |
| — | All pass | `redirect(303, path)` |

- Conditions 1–4 cost no network calls. Anonymous traffic and orgs without the setting pay nothing.
- Condition 5 is the only extra request, made only for signed-in students of orgs that use the feature.
- On an API failure, render the landing page and log it. Never error the page or redirect blindly.
- The redirect also runs before `+page.ts` imports the landing theme, so no theme bundle is loaded.
- Custom domains: the existing `withRedirectFallbackBody` in `hooks.server.ts:99-114` already adds a meta-refresh body to server redirects behind Approximated. No extra work is needed, but verify it in QA.

### FR-2 — Settings control (Customize LMS)

Location: new first section in `features/settings/pages/customize-lms.svelte`, above Language. It follows the CLAUDE.md **Form Structure** pattern (`Field.Set` + `Field.Legend` + `Field.Description`).

**Copy (translation keys under `components.settings.customize_lms.student_home.*`):**

| Key | English |
| --- | --- |
| `heading` | Student home |
| `description` | Choose where signed-in students go when they open your academy's homepage. Visitors who aren't signed in, and your team, still see your landing page. |
| `label` | Authenticated student home |
| `placeholder` | Search pages and courses |
| `option_default` | Landing page (default) |
| `option_default_hint` | Students see your landing page first |
| `group_pages` | Learning portal |
| `group_courses` | Courses |
| `reason_disabled_toggle` | Turn it on in the Dashboard section below |
| `reason_paid_plan` | Available on paid plans |
| `courses_empty` | No published courses yet |
| `search_empty` | No pages or courses match "{query}" |
| `warning_unavailable` | {destination} isn't available to students right now, so they're sent to Dashboard instead. Choose another destination or make it available again. |
| `warning_course_missing` | The course you chose was deleted or unpublished, so students are sent to Dashboard instead. |
| `course_hint_open` | Enrolled students go straight to their next lesson. Students who aren't enrolled can join in one click. |
| `course_hint_restricted` | Enrolled students go straight to their next lesson. This course is paid or invite-only, so students who aren't enrolled go to Dashboard. |

Page labels reuse the existing `lms_navigation.*` keys (`home` → "Dashboard", `my_learning`, `certificates`, `explore`, `cohorts`, `exercise`, `community`, `settings`). There are no new strings for them, and they stay identical to the sidebar.

**Control:** a searchable single-select combobox, composed in the dashboard feature from `@cio/ui/base/popover` + `@cio/ui/base/command` (the same primitives as the command palette). A plain `Select` breaks down once an org has dozens of courses. The trigger is full width, shows the selected label and its icon, and uses the `testId` `customize-lms-student-home`.

Popover contents, top to bottom:

1. Search input (`Command.Input`).
2. **Landing page (default)**, with a muted hint line.
3. Group **Learning portal**: every registry destination in sidebar order, with its sidebar icon and translated label.
   - Destinations not available under the **current draft** are disabled, with the reason as a muted trailing hint.
   - Turning on Community in the same page's Dashboard section enables the Community option immediately, without saving first.
4. Group **Courses**: published courses by title (plus a small type badge for Live / Compliance).
   - Up to 50 results come from the server. Search is debounced (`DebouncedSearch`) and server-backed, so large catalogs work.
   - Empty state: `courses_empty`.
5. Checkmark on the selected row. Full keyboard support comes from `Command`.

**States:**

| State | Behaviour |
| --- | --- |
| Loading course options | Skeleton rows in the Courses group. The pages group renders immediately (client-side registry) |
| Unset | Trigger shows **Landing page (default)** |
| Valid selection | Trigger shows label + icon (course: book icon + title). No warning |
| Course selected | A muted helper line under the field explains what non-enrolled students get: `course_hint_open` when the course is free and open for self-enrollment, otherwise `course_hint_restricted`. The options endpoint returns `canSelfEnroll` per course for this. Admins then know before saving whether a paid or invite-only course will send new students to Dashboard |
| Saved page now unavailable (e.g. Community toggled off in the draft or on save, or plan downgraded) | Trigger keeps the saved label with an "Unavailable" badge. Inline `warning_unavailable` alert below the field. Save is **not** blocked |
| Saved course deleted or unpublished | The options endpoint still returns the saved course (`includeCourseId`) with `isAvailable: false`, so the trigger shows its title + "Unavailable" badge + `warning_course_missing`. If the course was hard-deleted, the FK has already nulled the setting, so the trigger shows default |
| Dirty | Participates in the page's existing snapshot dirty-check, so `Page.SettingsActions` appears and Discard restores the saved value |
| Save error (server rejected destination) | Field-level error from the API's `field: 'studentHome'` via the existing `BaseApiWithErrors` mapping |
| Mobile | Popover content matches the trigger width; the list scrolls inside the popover |

**Saving a new value** must pass server validation (FR-3). **Keeping an existing unavailable value** on save is allowed. Otherwise an admin who turns Community off could not save the rest of the page. The client therefore sends `studentHome` only when it changed.

### FR-3 — Server validation (save)

When `PUT /organization` includes `studentHome`, it is validated against the customization in the **same** request when present (else the stored one), and against the org's current plan:

- `null` → clear both columns.
- `{ type: 'page', key }` → `key` must exist in the registry **and** be available under the effective customization and plan. Otherwise: 400 `STUDENT_HOME_UNAVAILABLE`, `field: 'studentHome'`.
- `{ type: 'course', courseId }` → the course must belong to this org (via `group.organizationId`) and be ACTIVE, published and non-template. A cross-org or unknown ID returns 400 `STUDENT_HOME_INVALID_COURSE` with the same message for both cases, so callers cannot probe for course IDs.
- Zod rejects every other shape (any string URL, external origin, `/`) at the boundary.

### FR-4 — Landing-page editor hint

On `/org/[slug]/landingpage` (and the edit screen header), when the setting is on, show a small info callout: "Signed-in students skip this page and go to **{destination}**. [Change]". The link goes to `settings/customize-lms`. This prevents the "why don't my students see my new landing page?" support question. Copy keys go under `components.settings.landing_page.student_home_notice.*`.

### FR-5 — Docs

- Update `apps/help/content/help/account-team-security/update-organization-settings.mdx`, or add `publish-and-brand/student-home.mdx`, covering what it does, who is redirected, fallback behaviour and how to turn it off.
- Screenshot per `skills/add-docs-image/SKILL.md` (1350×830, framed).
- Cross-link from `org-landing-page.mdx`.
- In the Customize LMS docs, state that turning off Exercises or Community now also closes those pages to students who open them by link (FR-6).

### FR-6 — LMS route guards

Applies to every LMS page in the registry, not just the student-home choice. This keeps "what the sidebar shows" and "what a student can open" identical.

- **Where:** `routes/(app)/lms/+layout.svelte`, which wraps every `/lms/**` page.
- **Matching:** `findLmsDestinationForPathname(pathname)` from the registry matches on path segments. `/lms/community/ask` and `/lms/community/how-to-x` match **Community**, and `/lms/settings/notifications` matches **Settings**. **Home** (`/lms`) matches only exactly, so it never swallows other pages.
- **Rule:** once `appInitApi.isInitializedAndReady`, if the matched destination is not available for `$currentOrg` (same `isLmsDestinationAvailable` the sidebar uses), call `goto('/lms', { replaceState: true })`. With `replaceState`, the back button does not bounce the student into the blocked page again.
- **No flash:** for destinations whose rule can fail (Exercises, Community, Certificates), the layout renders a page skeleton instead of `children` until the org is initialized. Always-available pages render immediately, as today.
- **Who it applies to:** everyone viewing `/lms/**`. On cloud org sites, admins see the student experience too, and the sidebar already hides these pages for them. The admin's own community stays at `/org/[slug]/community`, which is untouched.
- **Behaviour changes to call out in the release notes:**
  - `/lms/exercises` and `/lms/community/**` stop opening by direct link or bookmark when turned off.
  - `/lms/certificates` stops opening on the free plan. The sidebar already hides it there.
- **Copy:** none. The redirect is silent, matching how the sidebar silently hides the link.

### FR-7 — Signup and Join Academy honour the student home

A brand-new student's first impression is the moment the student home matters most. But these flows never pass through `/`, so the FR-1 redirect never runs for them:

| Flow | Today | File |
| --- | --- | --- |
| Org-site email signup | `orgApi.joinAcademy(org.id, redirectUrl \|\| '/lms')` | `routes/(auth)/signup/+page.svelte` (~l.181) |
| OAuth signup (Google/SSO, new user) | `newUserCallbackPathname` → `/join-academy` (with `?redirect=` if one was given) | `routes/(auth)/signup/+page.svelte:59-64` |
| `/join-academy` | `redirect` param or `'/lms'` | `routes/(org-site)/join-academy/+page.svelte` (~l.32) |
| `joinAcademy` | `redirectTo = '/lms'` default; on success `window.location.href = resolveOrgJoinRedirect(…)`. A pending invite already goes to `/` | `features/org/api/org.svelte.ts:90-113`, `features/org/utils/org-join-redirect.ts` |

**Behaviour.**
- With an explicit `?redirect=` (for example from a course enroll link): unchanged, the redirect wins.
- No `?redirect=`, and the org has a student home: go to `/`. FR-1 then resolves the destination with the same resolver, rules and fallbacks. No second resolver exists.
- No `?redirect=`, and no student home: `/lms`, exactly as today.
- Example, a brand-new student whose home is a free, open course: signup → `/` → `/course/{slug}/enroll?from=student-home` → **Join course** → first lesson.

**Why `/` is safe here.** `joinAcademy` already refreshes the session (`authClient.getSession({ query: { disableCookieCache: true } })`) before navigating. When `/` loads, `orgRoles` already holds the new STUDENT role, so the FR-1 pre-check passes. The resolver re-checks the role in the DB anyway.

## Technical Design

### Destination registry (shared, pure)

New file `packages/utils/src/lms/lms-destinations.ts`, exported as `@cio/utils/lms`. It has no Svelte, `$env` or `$lib` imports, so the API, the dashboard server and the dashboard client can all use it.

```ts
export const LMS_DESTINATION_KEYS = [
  'home', 'mylearning', 'certificates', 'explore', 'cohorts', 'exercises', 'community', 'settings'
] as const;
export type LmsDestinationKey = (typeof LMS_DESTINATION_KEYS)[number];

export type LmsAvailabilityContext = {
  orgId: string | null | undefined;
  plans: OrgPlanLike[] | null | undefined;
  isSelfHosted: boolean;
  customization: { dashboard?: { exercise?: boolean; community?: boolean } } | null | undefined;
};

export type LmsUnavailableReason = 'customization' | 'plan';

export type LmsDestination = {
  key: LmsDestinationKey;
  path: `/lms${string}`;
  titleKey: `lms_navigation.${string}`;
  /** True when `unavailableReason` can return non-null; the route guard shows a skeleton until the org loads. */
  isConditional: boolean;
  unavailableReason: (context: LmsAvailabilityContext) => LmsUnavailableReason | null;
};

export const LMS_DESTINATIONS: readonly LmsDestination[] = [
  { key: 'home', path: '/lms', titleKey: 'lms_navigation.home', unavailableReason: () => null },
  { key: 'mylearning', path: '/lms/mylearning', titleKey: 'lms_navigation.my_learning', unavailableReason: () => null },
  {
    key: 'certificates',
    path: '/lms/certificates',
    titleKey: 'lms_navigation.certificates',
    unavailableReason: ({ orgId, plans, isSelfHosted }) =>
      isOrgOnFreePlan({ orgId, plans, isSelfHosted }) ? 'plan' : null
  },
  { key: 'explore', path: '/lms/explore', titleKey: 'lms_navigation.explore', unavailableReason: () => null },
  { key: 'cohorts', path: '/lms/cohorts', titleKey: 'lms_navigation.cohorts', unavailableReason: () => null },
  {
    key: 'exercises',
    path: '/lms/exercises',
    titleKey: 'lms_navigation.exercise',
    unavailableReason: ({ customization }) => (customization?.dashboard?.exercise === true ? null : 'customization')
  },
  {
    key: 'community',
    path: '/lms/community',
    titleKey: 'lms_navigation.community',
    unavailableReason: ({ customization }) => (customization?.dashboard?.community === true ? null : 'customization')
  },
  { key: 'settings', path: '/lms/settings', titleKey: 'lms_navigation.settings', unavailableReason: () => null }
];

// Each entry also sets `isConditional`: true for certificates, exercises and community; false otherwise
// (omitted above for brevity).

export const LMS_FALLBACK_PATH = '/lms';

export function getLmsDestinationByKey(key: string): LmsDestination | undefined;
/** Exact match on a stored student-home path. */
export function getLmsDestinationByPath(path: string): LmsDestination | undefined;
/** Segment-prefix match for any pathname under /lms (used by the route guard). Home matches only `/lms` exactly. */
export function findLmsDestinationForPathname(pathname: string): LmsDestination | undefined;
export function isLmsDestinationAvailable(destination: LmsDestination, context: LmsAvailabilityContext): boolean;
```

**Refactor (no behaviour change):** `features/ui/navigation/lms-navigation.ts` builds `baseNavConfig` by mapping `LMS_DESTINATIONS`. It adds the dashboard-only fields (icon, `matchPattern`, `items`, `nestedRoutes`, `useHashUrl`, `supportsDynamicSegment`) from a `Record<LmsDestinationKey, …>`, so TypeScript errors if a registry key has no UI entry. `show` becomes `(org) => isLmsDestinationAvailable(destination, toAvailabilityContext(org))`. Breadcrumbs and `static-catalog.ts` keep working through `baseNavConfig`.

### Data model

`packages/db/src/schema.ts`, `organization` table:

```ts
studentHomePath: text('student_home_path'),
studentHomeCourseId: uuid('student_home_course_id'),
```

```ts
foreignKey({
  columns: [table.studentHomeCourseId],
  foreignColumns: [course.id],
  name: 'organization_student_home_course_id_fkey'
}).onDelete('set null'),
check(
  'organization_student_home_single_destination',
  sql`${table.studentHomePath} IS NULL OR ${table.studentHomeCourseId} IS NULL`
),
```

- Both `NULL`: unset (landing page, today's behaviour).
- `studentHomePath` holds only registry paths. The service enforces that, because a DB `CHECK` list would need a migration each time a page is added.
- No backfill. Existing rows default to `NULL`.

Migration `packages/db/src/migrations/0030_student_home.sql`:

```sql
ALTER TABLE "organization" ADD COLUMN "student_home_path" text;
ALTER TABLE "organization" ADD COLUMN "student_home_course_id" uuid;
ALTER TABLE "organization" ADD CONSTRAINT "organization_student_home_course_id_fkey"
  FOREIGN KEY ("student_home_course_id") REFERENCES "public"."course"("id") ON DELETE SET NULL;
ALTER TABLE "organization" ADD CONSTRAINT "organization_student_home_single_destination"
  CHECK ("student_home_path" IS NULL OR "student_home_course_id" IS NULL);
```

**Migration rules (CLAUDE.md):**
- One migration file for the whole PR.
- Its `_journal.json` `when` must be greater than `origin/main`'s maximum, currently `1791460509638`. Stamp it with `int(time.time() * 1000)`.
- Re-run the two-line check from CLAUDE.md right before merge, and renumber if `0030` collides.

### Validation

`packages/utils/src/validation/organization/student-home.ts`:

```ts
export const ZStudentHomeDestination = z.discriminatedUnion('type', [
  z.object({ type: z.literal('page'), key: z.enum(LMS_DESTINATION_KEYS) }),
  z.object({ type: z.literal('course'), courseId: z.uuid() })
]);
export type TStudentHomeDestination = z.infer<typeof ZStudentHomeDestination>;

export const ZStudentHomeCourseOptionsQuery = z.object({
  search: z.string().trim().max(200).optional(),
  includeCourseId: z.uuid().optional()
});
```

`ZUpdateOrganization` gains `studentHome: ZStudentHomeDestination.nullable().optional()`. The API contract uses the typed destination. Translating it to the column representation is the service's job, so the stored path format can never leak into, or be forged through, the request.

### Queries (`packages/db/src/queries/organization/student-home.ts`)

All queries accept an optional `DbOrTxClient` and log as `functionName error:` in `catch`.

| Function | Purpose |
| --- | --- |
| `getStudentHomeCourseCandidate(orgId, courseId, db?)` | `{ id, slug, type, status, isPublished, isTemplate, cost, metadata }` for a course whose group belongs to `orgId`, else `null` |
| `listStudentHomeCourseOptions(orgId, { search, includeCourseId, limit }, db?)` | Published ACTIVE non-template courses by `title ILIKE`, ordered by `displayOrder, title`, limit 50, **unioned with** `includeCourseId` regardless of status. Returns rows with `cost` and `metadata`; the service maps them to `{ id, title, type, isAvailable, canSelfEnroll }[]` |
| `getOrganizationStudentHome(orgId, db?)` | `{ studentHomePath, studentHomeCourseId, customization, plans }` for the resolver |
| `setOrganizationStudentHome(orgId, { path, courseId }, db)` | Column update. Called inside the `updateOrg` transaction |

Reused as they are: `getOrganizationMemberRoleId` (DB role) and `isUserCourseMemberOrOrgAdmin`.

### Services (`apps/api/src/services/organization/student-home.ts`)

```ts
export async function assertStudentHomeDestination(orgId, destination, effectiveCustomization, tx): Promise<{ path: string | null; courseId: string | null }>
// null → { path: null, courseId: null }
// page → registry lookup + isLmsDestinationAvailable(…) else AppError(400, STUDENT_HOME_UNAVAILABLE, field 'studentHome')
// course → getStudentHomeCourseCandidate + ACTIVE/published/non-template else AppError(400, STUDENT_HOME_INVALID_COURSE)

export async function resolveStudentHomePath(orgId, profileId): Promise<string | null>
// 1. roleId = getOrganizationMemberRoleId(orgId, profileId); if roleId !== ROLE.STUDENT → null
// 2. home = getOrganizationStudentHome(orgId); if neither column set → null
// 3. path set:
//      destination = getLmsDestinationByPath(path)
//      return destination && isLmsDestinationAvailable(destination, ctx) ? destination.path : LMS_FALLBACK_PATH
// 4. courseId set:
//      course = getStudentHomeCourseCandidate(orgId, courseId)
//      if !course or status !== 'ACTIVE' or !isPublished or isTemplate → LMS_FALLBACK_PATH
//      if course.type === 'PUBLIC' → `/course/${course.slug}`
//      if canProfileOpenCourse(course.id, profileId) → `/courses/${course.id}/lessons?next=true`
//      if canSelfEnrollForFree(course) → `/course/${course.slug}/enroll?from=student-home`
//      else → LMS_FALLBACK_PATH

function canSelfEnrollForFree(course): boolean
// isSelfEnrollmentAllowed(course.metadata) && !isCoursePaid(course.cost, course.metadata)
// Same two @cio/utils rules the enroll page uses, so the resolver never sends a student
// to a join screen that would then refuse them.
```

- `canProfileOpenCourse` is extracted from `courseMemberMiddleware` (`isUserCourseMemberOrOrgAdmin` then `ensureProgramCourseAccess`). The resolver and the course layout then grant access by the same rule. If they disagreed, a student redirected to a course would bounce to a 404.
- `updateOrg` (`services/organization.ts:780`): if `data.studentHome !== undefined`, it calls `assertStudentHomeDestination` with `data.customization ?? existing.customization` inside the transaction, then `setOrganizationStudentHome`. `updateOrg` currently calls `updateOrganization` without a transaction. Wrap both writes in one `db.transaction`, passing `tx` to both query helpers (CLAUDE.md **Transactions**).
- `studentHome` must be stripped from the object passed to `updateOrganization`. It is not a column.

### API routes

| Method | Path | Middleware | Body / query | Response `data` |
| --- | --- | --- | --- | --- |
| `PUT` | `/organization` *(existing)* | `authMiddleware`, `orgAdminMiddleware` | `ZUpdateOrganization` incl. `studentHome` | Updated org row (now incl. `studentHomePath`, `studentHomeCourseId`) |
| `GET` | `/organization/student-home/courses` | `authMiddleware`, `orgAdminMiddleware` | `ZStudentHomeCourseOptionsQuery` | `{ id, title, type, isAvailable, canSelfEnroll }[]` |
| `GET` | `/organization/student-home/resolve` | `authMiddleware`, `orgMemberMiddleware` | none (`cio-org-id` header) | `{ path: string \| null }` |

- New router `apps/api/src/routes/organization/student-home.ts`, composed inside the organization router as `.route('/student-home', organizationStudentHomeRouter)`. No new mount in `app.ts`, per the single-root-segment rule.
- Each route returns one type.
- The resolve route uses the session for membership, then re-verifies the role from the DB in the service. That covers the cookie-cache staleness described under Risks.

### Dashboard: server

1. **`app.d.ts`**: fix `App.Locals` to match runtime: `user`, `session`, `orgRoles: Record<string, number>`, `fromSessions?`. Remove `profile` and `organizations`. Then fix the two fallbacks that read `locals.organizations` (`org-landing-auth-action.ts:101-103`, `org-landing-learner-account.ts:138-140`). This is a type-correctness fix the feature depends on. Keep it in the same PR but in its own commit.
2. **`features/app/public-org.ts`**: add `hasStudentHome: !!(org.studentHomePath || org.studentHomeCourseId)` to `toPublicOrg`, and the field to `PublicOrg` in `features/app/types.ts`. Only the boolean is exposed: the destination, course ID and plan never reach anonymous HTML.
3. **`routes/+page.server.ts`**: add the FR-1 guard before the public-courses fetch:

```ts
export const load = async ({ parent, cookies }) => {
  const { isOrgSite, orgSiteName, org, locals } = await parent();

  const studentHomePath = await resolveStudentHomeRedirect({ isOrgSite, org, locals, cookies });
  if (studentHomePath) redirect(303, studentHomePath);

  // …existing body unchanged
};
```

`resolveStudentHomeRedirect` lives in `features/org/api/student-home.server.ts`, a stateless server function like `org.server.ts`:

```ts
export async function resolveStudentHomeRedirect({ isOrgSite, org, locals, cookies }): Promise<string | null> {
  if (!isOrgSite || !org?.hasStudentHome || !locals.user) return null;
  if (locals.orgRoles?.[org.id] !== ROLE.STUDENT) return null;

  const headers = getApiHeaders(cookies);
  headers.headers['cio-org-id'] = org.id;
  const result = await safeServerApi<ResolveStudentHomeSuccess>(() =>
    classroomio.organization['student-home'].resolve.$get(undefined, headers)
  );
  if (!result.ok) return null;

  const path = result.body.data.path;
  return path && isSafeStudentHomePath(path) ? path : null;
}
```

`isSafeStudentHomePath` is a final belt-and-braces check. The path must start with `/`, must not start with `//`, must not equal `/`, and must match `^/(lms|courses|course)(/|$)`. If the API ever returned something odd, the dashboard would still never redirect off-origin or to itself.

4. **Enroll page** (`routes/(org-site)/course/[slug]/enroll/+page.svelte`): read `page.url.searchParams.get('from') === 'student-home'`. When true, the auto-enroll `$effect` returns early, and the page shows its normal **Join course** button (Decision 9a).
   - Clicking it runs the existing `completeEnrollment()`, which already ends at `getStudentCourseContinuePath`.
   - The param changes nothing else. Anonymous visitors, paid/invite messaging, and the student-limit check all behave as today.

### LMS route guard (FR-6)

`routes/(app)/lms/+layout.svelte`:

```svelte
<script lang="ts">
  const destination = $derived(findLmsDestinationForPathname(page.url.pathname));
  const availabilityContext = $derived(toLmsAvailabilityContext($currentOrg));
  const isOrgReady = $derived(appInitApi.isInitializedAndReady);
  const hasConditionalRule = $derived(destination?.isConditional === true);
  const isBlocked = $derived(isOrgReady && !!destination && !isLmsDestinationAvailable(destination, availabilityContext));

  $effect(() => {
    if (!isBlocked) return;

    void goto(resolve('/lms', {}), { replaceState: true });
  });
</script>

{#if isBlocked || (hasConditionalRule && !isOrgReady)}
  <PageSkeleton />
{:else}
  {@render children?.()}
{/if}
```

- `toLmsAvailabilityContext` lives in `lms-navigation.ts` next to the sidebar's use of it. One adapter turns `AccountOrg` into the registry context for the sidebar, breadcrumbs, search catalog and guard.
- `hasConditionalRule` comes from the registry's `isConditional` flag (true for Certificates, Exercises and Community), not a hard-coded key list. A future gated page gets the skeleton automatically.
- The effect writes nothing it reads, so it cannot loop. `/lms` (Home) is always available, so the redirect target can never itself be blocked.

### Dashboard: client

- **Types**: `features/org/utils/types.ts` gets `ResolveStudentHomeRequest`, `GetStudentHomeCoursesRequest`, `StudentHomeCourseOption` (inferred from the RPC), and `StudentHomeOption` (a union of default/page/course, for the combobox view model).
- **API class**: `features/org/api/student-home.svelte.ts`, `StudentHomeApi extends BaseApiWithErrors`, with `courses: StudentHomeCourseOption[] | null`, `loading`, `listCourses({ search, includeCourseId })` via `this.execute`.
- **Utils**: `features/org/utils/student-home-utils.ts`, pure functions:
  - `toStudentHomeDestination(org)`: columns → `TStudentHomeDestination | null`.
  - `buildStudentHomePageOptions(t, availabilityContext)`: registry → labelled options with `disabledReason`.
  - `getStudentHomeWarning(destination, pageOptions, courseOptions)`.
- **Component**: `features/settings/components/student-home-field.svelte` (Popover + Command), `bind:value` to the page draft. Course options load in an `$effect` keyed on `$currentOrg.id` (CLAUDE.md **Loading org-scoped page data**). Search goes through `DebouncedSearch`.
- **`customize-lms.svelte`**:
  - Add `studentHome` to the local draft and the snapshot used for `hasUnsavedChanges`.
  - In `handleSave`, include `studentHome` in the `orgApi.update` payload **only when it differs from the saved value** (see FR-2).
  - Availability context for the options is built from the **draft** `customization`, so toggling Community updates the options live.
- **`orgApi.update`** already re-merges the returned org into `currentOrg`, so the new columns flow back with no extra work.
- **Post-join destination (FR-7)**: add `getPostJoinRedirect(org, redirectParam)` to `features/org/utils/org-join-redirect.ts`. It returns `redirectParam` when present, else `'/'` when `org?.hasStudentHome`, else `'/lms'`.
  - Use it in `signup/+page.svelte` (the `joinAcademy` call) and `join-academy/+page.svelte`. `joinAcademy`'s own `'/lms'` default stays, so other callers are unchanged.
  - Read `hasStudentHome` from the root layout's `data.org` (`PublicOrg`), not `$currentOrg`. After `/account` loads, `$currentOrg` becomes the full `AccountOrg` row, which has the columns but not the derived flag.
  - Vitest the helper for all three branches.
- **Translations**: add the keys to `en.json`, run `cd apps/dashboard && pnpm translate`, and verify `{destination}`/`{query}` placeholders survived in all 11 other locales (da, de, es, fr, hi, it, pl, pt, ru, tr, vi).

### Flow

```text
Student opens acme.classroomio.com/
  └─ hooks.server.ts → locals { user, orgRoles }
  └─ +layout.server.ts → getOrgSiteInfo → PublicOrg { id, hasStudentHome, … }
  └─ +page.server.ts
       ├─ not org site / !hasStudentHome / anonymous / orgRoles[org.id] ≠ 3 → landing page (no extra request)
       └─ GET /organization/student-home/resolve (session cookie + cio-org-id)
            ├─ DB role ≠ STUDENT                         → { path: null } → landing page
            ├─ page, available                           → '/lms/mylearning'
            ├─ course, student can open it               → '/courses/<id>/lessons?next=true'
            ├─ course, PUBLIC type                       → '/course/<slug>'
            ├─ course, not enrolled, free + self-enroll  → '/course/<slug>/enroll?from=student-home' (Join button, no auto-enroll)
            └─ anything else (paid, invite-only, broken) → '/lms'
       └─ redirect(303, path)

New student finishes signup or /join-academy (no ?redirect=)
  └─ getPostJoinRedirect → org.hasStudentHome ? '/' : '/lms'
  └─ '/' → same +page.server.ts path as above

Student opens any /lms/** page (direct link, bookmark, redirect)
  └─ (app)/lms/+layout.svelte
       ├─ conditional page and org not loaded yet → skeleton
       ├─ page unavailable for this org            → goto('/lms', { replaceState: true })
       └─ otherwise                                → page renders
```

## Implementation Order

Each step can be committed on its own (Conventional Commits). Steps 1–2 change no behaviour.

1. **Registry**: add `packages/utils/src/lms/lms-destinations.ts` and the package export, plus vitest unit tests:
   - each availability rule;
   - exact and segment-prefix lookups, including `/lms/community/ask`, `/lms/settings/notifications`, and `/lms` matching only Home;
   - every key unique;
   - `isConditional` agrees with `unavailableReason`.

   Refactor `lms-navigation.ts` onto it. `refactor(dashboard): derive LMS nav from shared destination registry`
2. **Locals type fix**: correct `App.Locals` and the `locals.organizations` / `locals.profile` reads. `fix(dashboard): type App.Locals as the session payload`
3. **LMS route guards** (FR-6): the guard in `(app)/lms/+layout.svelte` + skeleton. `fix(dashboard): block LMS pages the org has turned off`. Steps 1–3 can ship as their own PR ahead of the feature if useful.
4. **Schema + migration**: columns, FK, check, the `0030_student_home` migration and journal entry. Run the CLAUDE.md journal check. `feat(db): add organization student home columns`
5. **Validation**: `ZStudentHomeDestination`, `ZStudentHomeCourseOptionsQuery`, and the `studentHome` field on `ZUpdateOrganization`.
6. **Queries**: `student-home.ts`. Extract `canProfileOpenCourse` from `courseMemberMiddleware` (the middleware calls it, so behaviour is unchanged).
7. **Services**: `assertStudentHomeDestination`, `resolveStudentHomePath` (with all four course tiers) and the options mapping (`canSelfEnroll`). Wrap `updateOrg`'s writes in a transaction. Add API vitest coverage for every resolver branch and every validation error, plus a rollback test (invalid `studentHome` + valid `name` → nothing persisted).
8. **Routes**: `student-home.ts` router composed into organization. Then `pnpm --filter @cio/api^... build && pnpm --filter @cio/api build`.
9. **Dashboard server redirect**: `toPublicOrg.hasStudentHome`, `student-home.server.ts`, `+page.server.ts` guard, `isSafeStudentHomePath` + tests.
10. **Enroll page**: skip auto-enroll when `from=student-home` (Decision 9a).
11. **Signup and join academy** (FR-7): `getPostJoinRedirect` + vitest, wired into signup and `/join-academy`.
12. **Settings UI**: types, API class, utils (+ vitest), `student-home-field.svelte` (incl. course hint), `customize-lms.svelte` wiring, translations + `pnpm translate` + placeholder review.
13. **Landing editor hint** (FR-4).
14. **E2E**: Playwright spec under `e2e/` (see Acceptance). Add the `customize-lms-student-home` hook to `e2e/README.md`'s registry.
15. **Docs** (FR-5) with framed screenshot, plus a release note for the FR-6 behaviour change.
16. **Verify**:

```bash
export PATH="$HOME/.nvm/versions/node/v20.19.3/bin:$PATH"
pnpm --filter @cio/utils test
pnpm --filter @cio/api^... build && pnpm --filter @cio/api build
pnpm --filter @cio/dashboard test
cd apps/dashboard && pnpm exec svelte-kit sync && pnpm exec svelte-check --tsconfig ./tsconfig.json; cd -
pnpm format:check
```

The dashboard has no `check` script. Compare the svelte-check output against a baseline from `main`, since the repo has pre-existing errors.

## Acceptance Criteria

1. An org admin sees **Student home** on Customize LMS and can choose Landing page (default), any registry page, or any published course. The value persists across reloads.
2. Options show translated page names (identical to the sidebar labels) and course titles. No route string appears anywhere in the control.
3. Pages unavailable under the current draft (Exercises/Community off, Certificates on the free plan) appear disabled with the reason. Toggling Community on in the same page enables its option before saving.
4. Choosing a page stores its canonical path in `organization.student_home_path`. Choosing a course stores its ID in `organization.student_home_course_id`. Default stores `NULL` in both, and the check constraint makes both-set impossible.
5. A signed-in **student** visiting `/` is redirected (303) server-side, with no landing-page HTML rendered or flashed, to:
   - the chosen page;
   - `/courses/{id}/lessons?next=true` when they can open the course;
   - `/course/{slug}` for a PUBLIC course;
   - `/course/{slug}/enroll?from=student-home` when they are not enrolled and the course is free and open for self-enrollment.
6. On `/course/{slug}/enroll?from=student-home`, a signed-in student is **not** enrolled until they click **Join course**. After clicking they land on their first lesson. Without the param, the enroll page's auto-enroll works exactly as on `main`.
7. When a student isn't enrolled and the course is paid, invite-only or closed to self-enrollment, the student goes to `/lms`, never to a sales page or a blocked join screen.
8. A course selected in settings shows the matching hint (`course_hint_open` / `course_hint_restricted`).
9. An anonymous visitor, a signed-in non-member, an org admin and an org tutor visiting `/` all see the landing page unchanged.
10. With the setting unset, `/` behaves exactly as on `main` for every persona, and no extra API request is made.
11. Each of these resolves to `/lms`: course unpublished, soft-deleted, made a template, or in another org; page turned off in customization; Certificates after a downgrade to the free plan. A hard-deleted course nulls the setting (FK `SET NULL`) and shows the landing page.
12. `PUT /organization` rejects:
    - a page key that is unavailable under the effective customization (400 `STUDENT_HOME_UNAVAILABLE`);
    - a course not in the org (400 `STUDENT_HOME_INVALID_COURSE`);
    - any non-schema shape, including URLs (400).

    Saving the page without touching an already-unavailable value succeeds.
13. A student whose session cookie still lists them as a student after removal from the org is not redirected (DB role check), and no redirect loop occurs.
14. Verified on: localhost `?org=`, a tenant subdomain, a verified custom domain (meta-refresh fallback present), and self-hosted mode.
15. Login without `?redirect=` from an org site lands a student on their student home. Login with `?redirect=/lms/certificates` lands on Certificates.
16. The landing-page settings screen shows the "students skip this page" notice when the setting is on.
17. With Exercises off, opening `/lms/exercises` by URL lands on `/lms`, and Back does not return to `/lms/exercises`. The same holds for `/lms/community`, `/lms/community/ask`, `/lms/community/<slug>` with Community off, and for `/lms/certificates` on the free plan. When those pages are on, they render with no skeleton flash after the first load.
18. The admin community at `/org/[slug]/community` is unaffected by FR-6.
19. A student who signs up on an org site with a student home lands on it: email signup, OAuth signup via `/join-academy`, and a direct `/join-academy` visit. Without a student home they land on `/lms`, as today. An explicit `?redirect=` takes precedence in every case.
20. All copy uses translation keys, and all 12 dashboard locales contain the new keys with placeholders intact.
21. The LMS sidebar, breadcrumbs and search catalog render the same items as before the registry refactor, for free and paid orgs with every toggle combination (zero regression).

## Risks and Mitigations

| Risk | Mitigation |
| --- | --- |
| **Stale `orgRoles` (cookie cache ~1h) causes a loop.** A removed student is redirected to `/lms`; `routeUserToNextPage` sends non-members on `/lms` back to `/`; the cookie again says student… | The resolver re-reads the role from the DB (`getOrganizationMemberRoleId`) and returns `null` unless ACTIVE + STUDENT. The session check is only a cheap pre-filter. AC 13 covers it |
| Redirect to a course the student can't open → 404 page | Course access in the resolver uses the same `canProfileOpenCourse` as `courseMemberMiddleware`. Anything else falls back to `/lms` |
| Resolver sends a student to a join screen that then refuses them | The resolver applies the same `isSelfEnrollmentAllowed` / `isCoursePaid` rules as the enroll page's `canJoinCourse`. The enroll page still validates on its own, so any edge case shows its existing message rather than enrolling wrongly |
| Silent enrolment and teacher emails triggered by a homepage visit | `?from=student-home` disables auto-enroll; enrolment needs a click (Decision 9a). AC 6 covers it |
| Open redirect / off-origin redirect | Typed destination at the API boundary (no URL input). The path is derived server-side from the registry or the FK. The dashboard runs a final `isSafeStudentHomePath` check before `redirect` |
| Cross-org course ID probing via the save endpoint | Course lookup is scoped by `group.organizationId`. The same error is returned for "not in org" and "doesn't exist" |
| LMS sidebar, guards and setting options drift apart | Single registry. The dashboard nav maps `Record<LmsDestinationKey, …>`, so adding a key without UI metadata is a type error. AC 21 regression check |
| FR-6 surprises orgs whose students bookmarked a turned-off page | Intended: it is what the toggle promised. Called out in the release note. The student lands on Dashboard rather than an error |
| Guard flashes a blocked page before redirecting | Conditional pages render a skeleton until the org is loaded. The resolver never sends students to an unavailable page in the first place (Decision 15) |
| Leaking settings to anonymous HTML | `PublicOrg` exposes only `hasStudentHome: boolean` |
| Extra latency on `/` | The resolve call happens only for signed-in students of orgs using the feature. On API error or timeout the landing page renders. Everyone else pays nothing |
| Admin turns Community off while it is the student home, and can't save | Keeping an existing unavailable value is allowed. The UI shows a warning and students fall back to `/lms` |
| `customization` replaced wholesale on update, so a stale client could validate against old toggles | Validation uses the customization in the same request when present. The server is the authority on save |
| Signup lands on `/` before the session knows the new role, so the student sees the landing page | `joinAcademy` refreshes the session with the cookie cache disabled before navigating (FR-7). AC 19 covers it |

## Recommendations on Former Open Questions

Each question that came up during planning, with the recommendation this plan adopts.

1. **Should admins and tutors also be redirected?** **No.** They are the ones who edit and check the landing page, so redirecting them would hide their own site from them. The landing nav already gives them one-click **Continue Learning**. A staff toggle can be added later if academies ask; nothing in this design blocks it (Decision 1).
2. **One-click Join, or auto-enroll when arriving from the student home?** **One click.** Enrolling sends welcome and "student joined" emails and fires analytics. That should follow a student's action, not a homepage visit. One click on a focused join screen keeps the flow fast without surprise side effects (Decision 9a).
3. **Should the feature be plan-gated?** **No.** Choosing where students start is basic portal behaviour, not a premium feature. Gated destinations such as Certificates stay gated by their own rule (Decision 12).
4. **Should the Community API also enforce the toggle for students?** **Yes, but as a separate change after this plan.** The same endpoints serve the admin community, so enforcement needs a role-aware rule (block STUDENT, allow ADMIN/TUTOR) and its own tests. FR-6 already closes the student-facing pages, which is what the toggle promises admins today.
5. **Should other entry points also honour the student home?** **Not in this plan.**
   - **Login with `?redirect=`, and the Continue Learning CTA:** keep their targets. A `?redirect=` is an explicit destination. Students with a student home never see the CTA, because `/` redirects them first.
   - **Invite acceptance** (`invite/**` → `/lms`): keep. Course invites carry their own intent (that course), and org-invite routing was not audited for this plan.
   - **App-host → tenant hop** (`goToLMS`): keep. It runs before the tenant site loads, and changing it touches cross-host login. If wanted later, it is a one-line change to point at `/` on the tenant when the org has a student home.
