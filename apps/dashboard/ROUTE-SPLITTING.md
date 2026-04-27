# Route Group Splitting — Optimization for Org Landing Pages

## Problem

When a user opens an organization via its subdomain (e.g. `myorg.classroomio.com`), the entire dashboard application was loaded before the landing page could render. This includes heavy dependencies like `UpgradeModal`, `PageLoadProgress`, `appInitApi`, `authClient`, and all theme components — none of which are needed to display a public landing page.

The result: slow initial load for org landing pages, which should be lightweight and fast.

## Solution: SvelteKit Route Groups

Instead of deploying a separate app (which conflicts with the single-domain self-hosted architecture), we split routes into **route groups** with separate layout chains. This leverages SvelteKit's built-in code splitting — each group only loads the JS it needs.

### Route Group Structure

```
routes/
├── +layout.svelte            # Ultra-thin: global CSS, MetaTags, ModeWatcher, Snackbar
├── +layout.server.ts         # Root server layout: org detection (getOrgSiteInfo)
├── +page.svelte              # Root page: branches between org landing page and dashboard entry
├── _dashboard-entry.svelte   # Dynamically imported: auth + setupApp for non-org root visits
│
├── (org-site)/               # Public org pages — lightweight layout
│   ├── +layout.svelte        # Org store setup + optional auth (no login redirect)
│   ├── +layout.ts            # Passthrough load
│   ├── courses/              # /courses — public course listing
│   └── course/[slug]/        # /course/[slug] — individual course page + enrollment
│
├── (app)/                    # Authenticated dashboard — full layout
│   ├── +layout.svelte        # Auth session, appInitApi.setupApp(), UpgradeModal, etc.
│   ├── +layout.ts            # Passthrough load
│   ├── courses/              # Course management
│   ├── org/                  # Org settings
│   ├── lms/                  # Student LMS
│   ├── programs/             # Programs
│   └── home/                 # Dashboard home
│
├── (auth)/                   # Auth pages (login, signup, etc.)
├── invite/                   # Invite handling
└── api/                      # API routes
```

## Key Architecture Decisions

### 1. Root Layout is Ultra-Thin

`+layout.svelte` only contains:

- Global CSS import
- `MetaTags` (with merge from page data)
- `ModeWatcher` (dark mode)
- `Snackbar`

No auth logic, no org-specific logic, no heavy component imports. This ensures the shared root bundle is minimal for all routes.

### 2. Root Page (`+page.svelte`) Branches by Context

The `/` route handles two completely different experiences:

- **Org site** (`data.isOrgSite === true`): SSR-fetches public courses in `+page.server.ts`, then dynamically imports the theme component via `importThemeComponent()`. Sets up org stores (`currentOrg`, `globalStore`).
- **Non-org site** (`data.isOrgSite === false`): Dynamically imports `_dashboard-entry.svelte`, which handles auth session checking and `appInitApi.setupApp()` for redirect logic.

The dynamic imports are critical — they prevent the dashboard's auth dependencies from being bundled with the org landing page, and vice versa.

### 3. `(org-site)` Layout — Lightweight with Optional Auth

`(org-site)/+layout.svelte` responsibilities:

- Set up org stores from server data (`currentOrg`, `globalStore.isOrgSite`, theme)
- Set user store from `data.locals` if available
- Check auth session via `authClient.useSession()`
- When session is ready, call `appInitApi.setupApp()` to load full account details
- **Does NOT redirect to `/login`** — these pages are public

The auth handling is needed so that logged-in users see the correct state (e.g. "Go to LMS" vs "Login" button in the nav). `setupApp` loads the user's organizations and roles, which populates `isOrgStudent` and `basePath`.

`routeUserToNextPage` inside `setupApp` already handles org-site public routes — it skips redirects when `isPublicRoute(path) && (path !== '/' || isOrgSite)`.

### 4. `(app)` Layout — Full Auth + App Initialization

`(app)/+layout.svelte` responsibilities:

- `authClient.useSession()` with redirect to `/login` for unauthenticated users
- `appInitApi.setupApp()` for full account loading
- `UpgradeModal`, `PageLoadProgress`, `PageRestricted`
- Org store setup from server data

This layout carries all the heavy dashboard dependencies, which are only loaded for authenticated routes.

### 5. Dynamic Theme Imports

Previously, all three landing page themes (bold, classic, minimal) were statically imported, meaning all theme code was bundled even when only one was used.

Now `importThemeComponent()` in `$features/org/utils/landing-page.ts` uses dynamic imports:

```typescript
export function importThemeComponent(theme: LandingPageThemeKey) {
  switch (theme) {
    case 'bold':
      return import('@cio/ui/custom/org-landing-page/bold.svelte');
    case 'classic':
      return import('@cio/ui/custom/org-landing-page/classic.svelte');
    default:
      return import('@cio/ui/custom/org-landing-page/minimal.svelte');
  }
}
```

Static imports of all themes are preserved in `$features/org/utils/landing-page-components.ts` — this file is only imported by the dashboard's landing page editor where all themes are needed for preview.

### 6. SSR for Public Course Data

`+page.server.ts` fetches public courses server-side for org sites, so the landing page renders with data immediately instead of showing a loading state while fetching client-side.

## Store Refactoring: `isOrgStudent`

### Before

- `isOrgStudent` lived in `$lib/utils/store/org.ts`
- `globalStore` had an `isStudent` field
- Three separate `$effect` blocks in `+page.svelte`, `(org-site)/+layout.svelte`, and `(app)/+layout.svelte` manually synced `isOrgStudent` → `globalStore.isStudent`
- `isStudentExperience` derived from `globalStore.isStudent`

This was fragile — if any sync `$effect` was removed (as happened during refactoring), `isStudentExperience` and `basePath` would break.

### After

- `isOrgStudent` moved to `$lib/utils/store/app.ts`, derived directly from `currentOrg.roleId`
- `globalStore.isStudent` removed entirely
- `isStudentExperience` now derives from `[globalStore, isOrgStudent]` directly — no manual sync needed
- All `$effect` sync blocks removed from layouts and root page
- All component reads of `$globalStore.isStudent` replaced with `$isOrgStudent`

One source of truth, no manual sync, no fragile `$effect` chains.

## Auth Flow — Centralized in Root Layout

Auth session checking and `appInitApi.setupApp()` live in the **root layout** (`+layout.svelte`). This is the single solution that handles auth for all routes — no per-group duplication, no route audits.

### Why centralized?

An earlier iteration put auth in each group layout (`(app)`, `(org-site)`, `_dashboard-entry`). This broke when new route groups (like `(auth)`) didn't have auth handling — authenticated users on `/login` or `/signup` would see infinite spinners instead of being redirected. Centralizing eliminates that class of bugs entirely.

### What the root layout does

1. `authClient.useSession()` — checks for an active session on every route
2. When session is ready, calls `appInitApi.setupApp()` — loads full account (profile, orgs, roles)
3. `setupApp` → `routeUserToNextPage()` handles redirects based on context:
   - On `/login`, `/signup`, `/onboarding`, or `/`: redirects to `/lms` or `/org/[slug]` based on role
   - On public org-site routes (`/courses`, `/course/[slug]`): skips redirect (user stays on page with correct login state)
   - On other public routes: skips redirect
4. Sets up user store, org stores, and theme from server data
5. No redirect to `/login` — that's the `(app)` layout's job (protected routes only)

### What each group layout does

- **`(app)/+layout.svelte`**: Redirects to `/login` if unauthenticated (protected routes). Renders `UpgradeModal`, `PageLoadProgress`, `PageRestricted`.
- **`(org-site)/+layout.svelte`**: `PageRestricted` gating only. No auth logic — root handles it.
- **`(auth)` group**: No layout file needed. Root layout handles session → `setupApp` → redirect away if already authenticated.

### Flow: login on org site

1. User logs in at `/login` → redirected to `/`
2. Root layout detects session, calls `setupApp` → loads account details
3. `routeUserToNextPage` sees `isPublicRoute('/') && isOrgSite` → skips redirect
4. User sees landing page with correct login state ("Go to LMS" button)

### Flow: login on non-org site

1. User visits `/` → root layout calls `setupApp`
2. `routeUserToNextPage` redirects to `/lms`, `/org/[slug]`, or `/onboarding` based on role
3. `+page.svelte` shows spinner while redirect happens

### Flow: authenticated user hits /login

1. Root layout detects session, calls `setupApp`
2. `routeUserToNextPage` sees `shouldRedirectOnAuth('/login')` → true
3. Redirects to `/lms` or `/org/[slug]`

## Files Changed

### Store layer

- `apps/dashboard/src/lib/utils/store/app.ts` — added `isOrgStudent`, removed `globalStore.isStudent`, rewrote `isStudentExperience`
- `apps/dashboard/src/lib/utils/store/org.ts` — removed `isOrgStudent` export
- `apps/dashboard/src/lib/features/app/init.svelte.ts` — updated `isOrgStudent` import path

### Layout layer

- `apps/dashboard/src/routes/+layout.svelte` — stripped to minimal
- `apps/dashboard/src/routes/+page.svelte` — branching logic for org vs non-org
- `apps/dashboard/src/routes/_dashboard-entry.svelte` — new, handles non-org auth
- `apps/dashboard/src/routes/(org-site)/+layout.svelte` — org store setup + optional auth
- `apps/dashboard/src/routes/(app)/+layout.svelte` — full auth + app init

### Component layer (isOrgStudent migration)

- `features/course/pages/exercise.svelte`
- `features/course/pages/lesson.svelte`
- `features/course/pages/attendance.svelte`
- `features/course/components/exercise/view-mode.svelte`
- `features/course/components/lesson/content-list.svelte`
- `features/course/components/lesson/content-navigation-actions.svelte`
- `features/course/components/lesson/content-section-list.svelte`
- `features/course/components/lesson/lesson-page-edit-header.svelte`
- `features/course/components/sidebar/course-sidebar.svelte`
- `routes/(app)/courses/[id]/exercises/[exerciseId]/+page.svelte`

### Landing page optimization

- `features/org/utils/landing-page.ts` — dynamic `importThemeComponent()`
- `features/org/utils/landing-page-components.ts` — new, static imports for editor only
- `routes/+page.server.ts` — SSR course data for org sites

## Remaining Work / Known Issues

- **Compliance utils (`isSelfPacedLikeCourse`)**: Several components (`exercise.svelte`, `view-mode.svelte`, `content-list.svelte`, `content-section-list.svelte`) had `isSelfPacedLikeCourse` from `compliance-utils.ts` mixed into the `isOrgStudent` commit. These have been reverted to inline `=== 'SELF_PACED'` checks and should be re-introduced in a dedicated compliance commit.
- **`$inspect` and `console.log` cleanup**: `(app)/+layout.svelte` contains `$inspect('session', $session)` and env-logging `console.log` calls that should be removed before production.
- **Bundle size verification**: Run `pnpm --filter @cio/dashboard build` and compare chunk sizes for org-site vs app routes to confirm the code splitting is effective.
- **`(org-site)` course pages**: `courses/+page.svelte` and `course/[slug]/+page.svelte` still statically import nav/hero components from `@cio/ui/custom/org-landing-page`. These could be dynamically imported for further optimization.
