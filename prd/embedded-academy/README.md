# Embedded Academy PRD (Full-Page Widget / Page Template)

## Status

- Draft (ready for prototype review)

## Date

- September 6, 2026

## Prototypes — the UX source of truth

**The UX of this feature must be taken from the prototype folder.** Interactive HTML prototypes for every surface live in [`prototypes/embedded-academy/`](../../prototypes/embedded-academy/) and are the approved design reference for layout, states (signed-in / anonymous / locked / empty / paid), copy, and navigation flow. When this document and a prototype disagree on a UI detail, the prototype wins.

**Start here:**

```
prototypes/embedded-academy/index.html
```

Open it in a browser (`open prototypes/embedded-academy/index.html`) — it maps both journeys (admin author → embedded learner) and every page cross-links so you can click through each flow end to end. Each page has a light/dark toggle.

The prototypes are built on the real design tokens. `app-theme.css` mirrors `packages/ui/src/index.css` (OKLCH palette, Geist, radii, and the Button/Badge/Item/Progress recipes) for the dashboard screens; `academy.css` holds the embedded runtime's own namespaced `--ac-*` tokens plus the mock host-app chrome, so the "native to the customer's product" requirement is visible on every learner screen.

Every page carries a state switcher in the bottom-right. On the learner screens it also toggles **Bounds** (where the embed starts and ends on the host page) and **Inherit host** (the `theme.mode: 'inherit-host'` behavior).

| Surface | Files |
| --- | --- |
| Admin (dashboard) | `admin-academies.html`, `admin-editor.html`, `admin-embed.html`, `admin-analytics.html` |
| Embedded runtime (in host app) | `embed-learn.html`, `embed-learn-anon.html`, `embed-category.html`, `embed-course.html`, `embed-lesson.html`, `embed-exercise.html` |

## Purpose

Let an organization embed its **entire academy** — a branded Learn page, category browsing, course detail, and the lesson/exercise player — directly inside its own product, as a single copy-paste script. The learner is identified by the host app, sees their own progress and recommendations, and never leaves the host application.

Reference experience: the **Claude app's "Learn" page** (Featured courses, Getting started tutorials, Browse by role with a "For you" badge). Today a ClassroomIO widget renders one block of course cards; this feature makes a widget render a whole page, and then makes that page a working LMS.

## Problem Statement

- A widget is capped at **one layout and one course list** (`widget.layout_type` is a single enum column). A real Learn page needs many blocks with different sources — featured, getting-started, browse-by-role.
- The embed is **anonymous**. There is no way to show progress, "Continue where you left off", or a personalized "For you" badge, which is exactly what makes an in-product academy useful rather than decorative.
- Every CTA **ejects the learner** to the academy on another domain. For customer education inside a SaaS product, that context switch is the main reason embedded academies get rejected.
- Customers who want an in-app academy today must build it themselves against the public API, re-implementing course detail and the lesson player that we already ship.
- Org landing pages are hosted by us and themed per template; there is no equivalent surface a customer can drop into their own React/Vue/Rails app.

## Confirmed Decisions

1. **Primary use case is an in-app authenticated Learn page** inside the customer's own product, modeled on the Claude Learn page. Public/anonymous rendering is a supported fallback state, not the target.
2. **Full mini-app depth.** Index → category → course detail → lesson player → exercise player all render inside the embed. The learner never leaves the host app.
3. **One deliberate exception to (2): paid checkout.** Free and admin-assigned enrollment happens inline; a paid course opens the academy in a new tab for checkout. Payment does not run inside a third-party frame.
4. **Grow the existing plain-Svelte shadow-DOM runtime** in `apps/embeds` rather than iframing a SvelteKit route. This must be a **route-split** build with per-chunk budgets, not one bundle.
5. **Section renderers are built once in `packages/ui`** as a shared set. Migrating the org landing page onto the same section system is an explicit **non-goal** of v1.
6. **Naming: "Embedded Academy."** The widget list separates **Blocks** (today's single-layout widgets) from **Academies** (pages).
7. **Router uses a pluggable history adapter.** Default `memory` (zero host-router conflict), upgradeable to query-param sync with `data-cio-router="query"`, plus `window.CIO.learn.navigate()` / `onNavigate()` for hosts that own their routing.
8. **Two-request data model.** An anonymous, CDN-cached payload snapshot drives first paint; a separate uncached per-learner overlay supplies progress, resume, and "For you". The overlay merges client-side.
9. **Cookie-free auth.** Third-party cookies are blocked by default in Safari and Firefox, so the embed cannot carry a session cookie. The host signs a JWT with the org's existing token-auth secret; the embed exchanges it for a short-lived access token held in memory and sent as a bearer header.
10. **Gating: the Embedded Academy page requires a paid plan; the identity overlay and the embedded LMS require Enterprise** (they ride `organization_token_auth`, which is already Enterprise-gated).
11. **v1 section catalog**: `page_header`, `card_grid`, `compact_list`, `category_grid`, `continue_learning`, `carousel`, `editorial_spotlight`, `cta_banner`, `rich_text`. `path_list` is **reserved** in the enum for the drafted Learning Paths feature but not implemented. `certificate_showcase` is deferred.
12. **Editor UX is a section list panel plus live preview** — add / drag-reorder / delete in the left panel, selecting a section opens its settings. Click-in-preview selection is deferred.
13. **Embed-only.** The same sections are not published to a hosted org-site route in v1; the org landing page remains the hosted surface.
14. **Section-level analytics ship in v1**, populating the `widget_analytics_event` schema reserved by the shipped widget PRD. *(Author's call — see Open Calls.)*

## Current-State Audit

The audit changed the shape of this feature twice: the lesson/exercise player and the identity plumbing already exist and are reusable, which is what makes "full mini-app" tractable on a plain-Svelte runtime.

| Capability | Current state | Notes for this feature |
| --- | --- | --- |
| Widget entity | `widget`, `widget_course`, `widget_version` in `packages/db/src/schema.ts:2407-2530` | Reuse wholesale. Add a `kind` column; add section tables. Versioning, publish, rollback, soft-delete all carry over. |
| Layout catalog | 7 layouts in `packages/ui/src/custom/widget-layouts/` | Six become section types with no rewrite. Only `page_header`, `category_grid`, `continue_learning`, `cta_banner`, `rich_text` are new. |
| Payload builder | `buildWidgetPayload()` in `packages/utils/src/validation/widget/build-payload.ts` | Resolve → filter by tag → sort → slice already exists. Page payload runs the same resolver **once per section**. |
| Public payload endpoint | `GET /widgets/:publicKey/payload`, `Cache-Control: public, max-age=60, stale-while-revalidate=300` (`apps/api/src/routes/widgets/widgets.ts:35`) | Extend to emit `sections[]` when `kind = 'page'`. Cache policy unchanged. |
| Third-party CORS | `publicApiCors` (`origin: '*'`, `credentials: false`) already applies to the `/widgets/` prefix; `Authorization` is already an allowed header (`apps/api/src/middlewares/cors.ts`) | The cookie-free bearer pattern is **already established**. All embed traffic stays under `/widgets/` so the wildcard-CORS surface remains auditable. |
| Org → learner identity | `organization_token_auth` (Enterprise, HS256 signing secret) + `exchangeToken()` in `packages/db/src/auth/token-exchange.ts`, which verifies the JWT, finds-or-creates the user, and ensures org membership. Its docstring: *"Caller is responsible for creating session and setting cookie."* | The verification half is **done**. We add a second caller that returns a bearer token as JSON instead of setting a cookie and redirecting. |
| Bearer sessions | Better Auth `bearer()` plugin is **not** in the plugin list (`packages/db/src/auth.ts:135-159`) | Must be added, or the access token must be resolved by a dedicated embed middleware. This is the one genuinely missing auth primitive. |
| Course detail + player UI | `packages/ui/src/custom/public-course/` ships `PublicCourseShell`, `PublicCourseSidebar`, `PublicLessonView`, `PublicExerciseView`, `PublicCourseCallout`, plus attempt storage — all plain-data props | **The hardest part of the mini-app already exists as reusable UI.** The org-site route `(org-site)/course/[slug]/lesson/[itemSlug]/+page.svelte` is a thin wrapper around it; the embed becomes a second wrapper. |
| Public course data | `GET /org-site/course/:courseSlug` and `/item/:itemSlug` (`apps/api/src/routes/org-site/public-course.ts`) | Same service layer feeds the embed's course and item routes. |
| Learner write endpoints | `POST /course/:courseId/enroll`, `GET /course/:courseId/progress`, `PUT /course/:courseId/lesson/:lessonId/completion`, `POST /course/:courseId/exercise/:exerciseId/submission` | All exist and are session-authed under `sessionCors`. The embed cannot call them cross-origin; mirror them under `/widgets/:publicKey/...` as thin routes delegating to the **same services**. |
| Widget editor | `apps/dashboard/src/lib/features/widget/` — icon rail + `select-courses`/`layout`/`design`/`embed` panels, iframe preview over `postMessage`, save/publish/rollback header | Add a `sections` panel to the rail. Preview protocol (`READY/RENDER/ERROR/RESIZE`) is reused unchanged. |
| Embed build | `apps/embeds` Vite multi-mode build, one entry per widget, `vite-plugin-css-injected-by-js`, upload via `scripts/upload-embeds.ts` | Add a third entry. Route splitting needs dynamic `import()` boundaries and a per-chunk size gate. |
| Current bundle | loader 6.41 kB (2.20 kB gz), runtime 80.03 kB (22.35 kB gz); documented budget ≤ 35 kB gz | The single global budget **cannot survive a player**. Replaced by per-chunk budgets below. |
| Analytics | `widget_analytics_event` schema reserved in the shipped PRD, never implemented | Implemented here, with `section_id` added. |
| Learning Paths | Drafted, not built (`prd/learning-paths/README.md`) | `path_list` reserved in the section-type enum so paths slot in without a migration. |

## Product Goals

1. Let an admin compose a full academy page from ordered sections, each with its own source and layout, in the existing widget editor.
2. Let a learner browse, enrol, read lessons, and submit exercises **without leaving the host application**.
3. Personalize the page to the signed-in learner — progress, resume, recommended-for-role — using identity the host already has.
4. Reuse the shipped course/lesson/exercise UI and services rather than re-implementing them in the embed.
5. Keep first paint fast and the CDN cache model intact despite personalization.
6. Make the page feel native to the host app rather than isolated inside it.

## Non-Goals (v1)

- Migrating the org landing page onto the section system (renderers are built to allow it later).
- A hosted twin of the academy page on the org site.
- Paid checkout inside the embed.
- Course authoring, grading, or any admin surface inside the embed.
- `certificate_showcase` and `path_list` section implementations.
- Server-side rendering or SEO support for the embedded page.
- Community, newsfeed, cohorts, and AI tutor inside the embed.
- Multi-language runtime; the embed uses the org's default locale, as the shipped widget does.

## Functional Requirements

### 1. Admin — Academy list (`prototypes/embedded-academy/admin-academies.html`)

The existing `/org/[slug]/widgets` list gains a kind split.

- Two tabs: **Blocks** (existing single-layout widgets, unchanged) and **Academies** (pages).
- Create flow asks for a name and a starting template: **Blank**, **Learn page** (page_header + compact_list + card_grid + category_grid, pre-filled), or **Catalog** (page_header + category_grid + card_grid).
- Each card shows status (Draft / Published / Archived), section count, last published, and whether identity is configured for the org.
- States to show: empty (no academies yet), draft with unpublished changes, published, archived.
- Free-plan orgs see the Academies tab with an upgrade lock over create, following the existing `UpgradeBanner` / `UpgradeLock` pattern.

### 2. Admin — Academy editor (`prototypes/embedded-academy/admin-editor.html`)

Extends `apps/dashboard/src/lib/features/widget/pages/widget-editor.svelte`. The icon rail gains a **Sections** entry, which becomes the default panel for `kind = 'page'`.

- **Sections panel**: ordered list of sections, each row showing type icon, heading, and source summary ("12 courses · tag: Engineering"). Drag to reorder, duplicate, delete, and an **Add section** menu grouped as *Content* (page_header, rich_text, cta_banner) and *Courses* (card_grid, compact_list, carousel, editorial_spotlight, category_grid, continue_learning).
- **Selecting a section** opens its settings in place: heading, subheading, source mode (manual / tag / all published / continue learning), the source picker for that mode, and the layout options that already exist for that layout type.
- `continue_learning` has no source picker — it is driven entirely by the learner overlay — and shows an inline note that it renders nothing for anonymous viewers.
- `category_grid` picks ordered tags, each with an optional icon and a per-tag destination (filtered category view).
- **Design panel** is unchanged except for a new **Theme mode** control: `preset` (today's behavior), `inherit-host` (adopt the host page's font stack and surface colors), or `custom`.
- **Preview** reuses the existing iframe + `postMessage` pipeline. A toggle switches between **Anonymous** and **Signed-in (sample learner)** so the admin can see both states; the signed-in preview uses synthetic overlay data.
- Save / discard / publish / rollback behave exactly as they do for block widgets. Validation blocks publish when a section has no resolvable source.
- States to show: empty (no sections), a section selected, drag in progress, validation error on publish, unsaved-changes bar.

### 3. Admin — Embed & identity (`prototypes/embedded-academy/admin-embed.html`)

- Copy-paste snippet:

```html
<div data-cio-widget="academy" data-widget-key="wgt_xxx"></div>
<script async type="module" src="https://<embed-host>/embeds/academy/academy.js"></script>
```

- **Identity setup** section: shows whether org token auth is active (linking to the existing `/org/[slug]/settings/auth/token-auth` page), and a copyable server-side snippet showing how to sign a learner JWT and hand it to the embed:

```js
// server-side, per request
const token = await new SignJWT({ sub: user.id, email: user.email, name: user.name })
  .setProtectedHeader({ alg: 'HS256' })
  .setIssuedAt()
  .setExpirationTime('2m')
  .sign(new TextEncoder().encode(process.env.CIO_TOKEN_AUTH_SECRET));
```

```html
<div data-cio-widget="academy" data-widget-key="wgt_xxx" data-cio-token="<%= token %>"></div>
```

- **Router mode** selector writes the `data-cio-router` attribute into the snippet and documents the `window.CIO.learn` API.
- **Allowed origins** field: the origins permitted to mount this academy, so a leaked public key cannot be re-hosted elsewhere.
- States: identity not configured (Enterprise upsell), configured but inactive, active.

### 4. Admin — Analytics (`prototypes/embedded-academy/admin-analytics.html`)

- Per-section impressions and CTA clicks, ranked, over a date range.
- Top courses by click, and — when identity is on — enrolments and completions attributed to the academy.
- Empty state before any events land.

### 5. Learner — Academy index, signed in (`prototypes/embedded-academy/embed-learn.html`)

Rendered inside a mock host-app chrome so the embed's boundaries are visible.

- Sections render in configured order. This is the screen that mirrors the reference: page header, a `compact_list` of featured courses with arrow CTAs, a `card_grid` of short tutorials with duration badges, and a `category_grid` of roles.
- With an overlay present: enrolled courses show a progress bar and a **Continue** CTA resolving to the learner's last lesson; the `continue_learning` section appears at the top; the category matching the learner's role trait carries a **For you** badge.
- Section-level impression events fire once per section per session; CTA clicks fire on navigation.
- States to show: fully personalized, overlay still loading (skeleton on progress affordances only — never block first paint), overlay failed (degrade silently to anonymous).

### 6. Learner — Academy index, anonymous (`prototypes/embedded-academy/embed-learn-anon.html`)

- Identical layout from the cached snapshot, with no progress, no Continue, no For-you badge.
- `continue_learning` renders nothing and collapses without leaving a gap.
- CTAs read "View course" and open course detail in the embed; enrolment prompts sign-in on the academy.

### 7. Learner — Category view (`prototypes/embedded-academy/embed-category.html`)

- Reached by clicking a `category_grid` tile. Shows the tag name, description, and the filtered course list.
- Back returns to the index; with `data-cio-router="query"` the browser back button does the same.
- States: results, empty category, loading.

### 8. Learner — Course detail (`prototypes/embedded-academy/embed-course.html`)

- Renders the public course view — hero, description, outcomes, curriculum, instructor — using the same `packages/ui/src/custom/public-course` primitives as the org-site route.
- CTA resolves by state: **Enrol** (free, signed-in — inline, no navigation), **Continue** (already enrolled), **Sign in to enrol** (anonymous), **Get this course** (paid — opens the academy checkout in a new tab, the one deliberate ejection).
- States to show: free/not enrolled, enrolled with progress, paid, anonymous, unpublished/unavailable.

### 9. Learner — Lesson player (`prototypes/embedded-academy/embed-lesson.html`)

- `PublicCourseShell` with the course sidebar, `PublicLessonView` for the body, and footer next/previous navigation.
- Video plays via the existing HLS path; the embed mints its playback cookie through a widget-scoped endpoint rather than the org-site one.
- Marking complete writes through to the same completion service the LMS uses — one source of truth for progress.
- States: in progress, complete, locked (not enrolled), mobile sheet open.

### 10. Learner — Exercise player (`prototypes/embedded-academy/embed-exercise.html`)

- `PublicExerciseView` with the shipped question types.
- Signed-in submissions post to the same submission service; anonymous attempts fall back to the existing local-storage attempt store (`public-exercise-attempts-storage.ts`) exactly as the public course does today.
- States: unanswered, in progress, submitted, graded, anonymous attempt.

## Technical Design

### Data model

`kind` separates the two widget shapes without disturbing anything shipped.

```sql
CREATE TYPE "WIDGET_KIND" AS ENUM ('block', 'page');

ALTER TABLE widget ADD COLUMN kind "WIDGET_KIND" NOT NULL DEFAULT 'block';
```

Sections are relational, not jsonb blobs — course and tag references are real foreign keys so cascade deletes stay correct and a deleted course cannot leave a dangling id inside a config document. `config` holds **presentational options only** (columns, density, badge style, icon name), never relational ids and never computed values.

```ts
// packages/db/src/schema.ts
export const widgetSectionType = pgEnum('WIDGET_SECTION_TYPE', [
  'page_header',
  'rich_text',
  'cta_banner',
  'card_grid',
  'compact_list',
  'carousel',
  'editorial_spotlight',
  'category_grid',
  'continue_learning',
  'path_list' // reserved for Learning Paths; rejected by validation in v1
]);

export const widgetSectionSource = pgEnum('WIDGET_SECTION_SOURCE', [
  'manual',
  'tag',
  'published',
  'overlay' // continue_learning: resolved per learner, never in the snapshot
]);

export const widgetSection = pgTable('widget_section', {
  id: uuid().default(sql`gen_random_uuid()`).primaryKey().notNull(),
  widgetId: uuid('widget_id').notNull(),
  position: integer().default(0).notNull(),
  type: widgetSectionType('type').notNull(),
  sourceMode: widgetSectionSource('source_mode').default('manual').notNull(),
  heading: varchar({ length: 160 }),
  subheading: varchar({ length: 320 }),
  config: jsonb('config').default(sql`'{}'::jsonb`).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).default(sql`timezone('utc'::text, now())`).notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).default(sql`timezone('utc'::text, now())`).notNull()
}, (table) => [
  foreignKey({ columns: [table.widgetId], foreignColumns: [widget.id], name: 'widget_section_widget_id_fkey' }).onDelete('cascade'),
  index('idx_widget_section_widget_id').on(table.widgetId),
  unique('widget_section_widget_position_key').on(table.widgetId, table.position)
]);

export const widgetSectionCourse = pgTable('widget_section_course', {
  id: uuid().default(sql`gen_random_uuid()`).primaryKey().notNull(),
  widgetSectionId: uuid('widget_section_id').notNull(),
  courseId: uuid('course_id').notNull(),
  order: integer().default(0).notNull()
}, (table) => [
  foreignKey({ columns: [table.widgetSectionId], foreignColumns: [widgetSection.id], name: 'widget_section_course_section_id_fkey' }).onDelete('cascade'),
  foreignKey({ columns: [table.courseId], foreignColumns: [course.id], name: 'widget_section_course_course_id_fkey' }).onDelete('cascade'),
  unique('widget_section_course_key').on(table.widgetSectionId, table.courseId)
]);

export const widgetSectionTagRole = pgEnum('WIDGET_SECTION_TAG_ROLE', ['include', 'exclude', 'category']);

export const widgetSectionTag = pgTable('widget_section_tag', {
  id: uuid().default(sql`gen_random_uuid()`).primaryKey().notNull(),
  widgetSectionId: uuid('widget_section_id').notNull(),
  tagId: uuid('tag_id').notNull(),
  role: widgetSectionTagRole('role').default('include').notNull(),
  order: integer().default(0).notNull(),
  iconName: varchar('icon_name', { length: 64 })
}, (table) => [
  foreignKey({ columns: [table.widgetSectionId], foreignColumns: [widgetSection.id], name: 'widget_section_tag_section_id_fkey' }).onDelete('cascade'),
  foreignKey({ columns: [table.tagId], foreignColumns: [tag.id], name: 'widget_section_tag_tag_id_fkey' }).onDelete('cascade'),
  unique('widget_section_tag_key').on(table.widgetSectionId, table.tagId, table.role)
]);
```

Analytics, implementing the schema the shipped widget PRD reserved, plus `section_id`:

```ts
export const widgetAnalyticsEvent = pgTable('widget_analytics_event', {
  id: uuid().default(sql`gen_random_uuid()`).primaryKey().notNull(),
  widgetId: uuid('widget_id').notNull(),
  widgetVersionId: uuid('widget_version_id'),
  widgetSectionId: uuid('widget_section_id'),
  eventType: widgetEventType('event_type').notNull(), // impression | cta_click | category_click | enroll
  courseId: uuid('course_id'),
  sessionId: varchar('session_id', { length: 64 }).notNull(),
  countryCode: varchar('country_code', { length: 2 }),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).default(sql`timezone('utc'::text, now())`).notNull()
});
```

`widget_course` is untouched and continues to serve block widgets.

### Payload: snapshot + overlay

The published snapshot stays anonymous and cacheable. Personalization is a second, uncached request the runtime merges in.

```ts
// packages/utils/src/validation/widget/build-page-payload.ts — pure, dependency-free
export function buildWidgetPagePayload(input: BuildPagePayloadInput): TWidgetPagePayload {
  const sections = input.sections
    .filter((section) => section.sourceMode !== 'overlay') // continue_learning ships empty
    .map((section) => {
      const resolvedCourses = resolveSectionCourses(section, input); // reuses the existing
                                                                    // filter → sort → slice pipeline
      return {
        id: section.id,
        type: section.type,
        heading: section.heading,
        subheading: section.subheading,
        options: section.config,
        courses: resolvedCourses.map((course) => toPayloadCourse(course, input.orgBaseUrl)),
        categories: buildSectionCategories(section, input)
      };
    });

  return ZWidgetPagePayload.parse({ version: 'v1', kind: 'page', /* …org, design, labels… */ sections });
}
```

The overlay is deliberately small — ids and numbers only, no course content, so it stays cheap and leaks nothing the snapshot did not already contain:

```ts
type TAcademyOverlay = {
  learner: { id: string; name: string; roleTraits: string[] };
  enrollments: Array<{
    courseId: string;
    progressPercent: number;      // computed at read time, never stored
    resumeItemSlug: string | null;
    lastActiveAt: string;
  }>;
  continueLearning: string[];      // ordered courseIds for the continue_learning section
};
```

Merge rules in the runtime: a course in `enrollments` renders the Continue CTA and its progress bar; `continue_learning` renders only when the array is non-empty; a `category_grid` tile whose tag slug intersects `roleTraits` gets the For-you badge. Overlay failure is non-fatal — the page stays in its anonymous state.

### Auth chain (cookie-free)

```
host server          embed runtime                     api
    │                      │                            │
    │ sign JWT (HS256,     │                            │
    │ org token-auth       │                            │
    │ secret, 2 min TTL)   │                            │
    ├──── data-cio-token ─→│                            │
    │                      ├─ POST /widgets/:key/session│
    │                      │   { token }                │
    │                      │                            ├─ exchangeToken(): verify sig,
    │                      │                            │  find-or-create user,
    │                      │                            │  ensure org membership
    │                      │                            ├─ assert widget.org === token org
    │                      │←── { accessToken, expiresAt, learner } ─┤
    │                      │   (in memory only — never localStorage)
    │                      ├─ Authorization: Bearer …  →│  embedLearnerMiddleware
    │                      │                            │  resolves → c.set('user')
```

`exchangeToken()` already does the verification, user provisioning, and membership work; the new endpoint is a second caller of it that returns JSON instead of setting a cookie. Better Auth's `bearer()` plugin is added to `packages/db/src/auth.ts` so the issued session token resolves through the existing session path, and `embedLearnerMiddleware` additionally asserts that the bearer's org matches the widget's org before any handler runs.

The access token lives in a closure inside the runtime — never `localStorage`, never a cookie — and is refreshed silently by re-posting the host's token when it expires.

### API routes

All embed traffic stays under the `/widgets/` prefix, which already has wildcard CORS with `credentials: false`. Nothing outside that prefix becomes reachable from a third-party origin.

| Method | Route | Auth | Notes |
| --- | --- | --- | --- |
| `GET` | `/organization/widgets` | session + org | Extended with a `kind` filter |
| `POST` | `/organization/widgets` | session + admin | Accepts `kind` and an optional starter template |
| `GET` `PUT` | `/organization/widgets/:widgetId` | session + org | Returns/accepts sections for `kind = 'page'` |
| `POST` | `/organization/widgets/:widgetId/sections` | session + org | Create a section |
| `PUT` `DELETE` | `/organization/widgets/:widgetId/sections/:sectionId` | session + org | Update / delete |
| `PUT` | `/organization/widgets/:widgetId/sections/order` | session + org | Reorder in one transaction |
| `GET` | `/organization/widgets/:widgetId/analytics` | session + org | Section and course rollups |
| `GET` | `/widgets/:publicKey/payload` | none | Extended to emit `sections[]`; cache policy unchanged |
| `POST` | `/widgets/:publicKey/session` | org-signed JWT | Returns a short-lived bearer token. Rate limited hard. |
| `GET` | `/widgets/:publicKey/me` | bearer | The overlay. `Cache-Control: private, no-store` |
| `GET` | `/widgets/:publicKey/course/:courseSlug` | bearer optional | Course tree, via the existing public-course service |
| `GET` | `/widgets/:publicKey/course/:courseSlug/item/:itemSlug` | bearer optional | Lesson/exercise view data |
| `POST` | `/widgets/:publicKey/course/:courseSlug/item/:itemSlug/hls-cookie` | bearer optional | Widget-scoped mint of the existing playback cookie |
| `POST` | `/widgets/:publicKey/course/:courseId/enroll` | bearer | Free/assigned only; paid returns `PAYMENT_REQUIRED` with a checkout URL |
| `GET` | `/widgets/:publicKey/course/:courseId/progress` | bearer | Delegates to the existing progress service |
| `PUT` | `/widgets/:publicKey/course/:courseId/lesson/:lessonId/completion` | bearer | Delegates to the existing completion service |
| `POST` | `/widgets/:publicKey/course/:courseId/exercise/:exerciseId/submission` | bearer | Delegates to the existing submission service |
| `POST` | `/widgets/:publicKey/events` | none | Batched analytics, fire-and-forget |

Every one of these routes is thin: validate, call an existing service, return one type. No new business logic lands in the route layer, and no route opens a database transaction.

### Runtime and bundle budgets

The single 35 kB budget is replaced by per-chunk budgets, enforced in CI (the shipped PRD left budget enforcement unimplemented; this feature makes it mandatory).

| Chunk | Loads when | Budget (gzip) |
| --- | --- | --- |
| `academy.js` loader | Always | ≤ 3 kB |
| `index` (sections + cards + router) | Always | ≤ 30 kB |
| `course` (course detail) | First course opened | ≤ 25 kB |
| `player` (lesson + exercise + question types) | First lesson opened | ≤ 60 kB |

First paint must still render the index from the cached snapshot before the overlay resolves. Course and player chunks are prefetched on hover/idle after first paint, never blocking it.

Router adapters share one internal history stack:

```ts
type RouterAdapter = 'memory' | 'query' | 'custom';
// memory: internal only (default)
// query:  history.replaceState with ?cio=course/react-basics
// custom: window.CIO.learn.navigate() / onNavigate()
```

Style isolation stays Shadow DOM. `theme.mode = 'inherit-host'` reads computed `font-family` and background/foreground from the mount point at boot and maps them onto the `--cio-*` custom properties, so the academy adopts the host's typography without letting host CSS reach inside the shadow root.

### Frontend layering

Following CLAUDE.md: validation in `packages/utils/src/validation/widget/` (`ZWidgetSection`, `ZWidgetPagePayload`, `ZAcademyOverlay`), pure queries in `packages/db/src/queries/widget/`, orchestration and transactions in `apps/api/src/services/widget-*.ts`, thin routes, and dashboard request types inferred in `apps/dashboard/src/lib/features/widget/utils/types.ts` with all logic in the API class. Section reordering and section-with-courses writes run inside one service-level transaction. All user-facing copy uses translation keys in `en.json`, with the other locales regenerated via `pnpm translate`.

## Implementation Order

1. **Validation and payload contracts.** `ZWidgetSection`, `ZWidgetPagePayload`, `ZAcademyOverlay`, section option schemas, and `buildWidgetPagePayload()` reusing the existing resolver. Unit tests for per-section resolution, ordering, and the reserved `path_list` rejection. → `pnpm --filter @cio/utils build`
2. **Schema and queries.** `widget.kind`, `widget_section`, `widget_section_course`, `widget_section_tag`, `widget_analytics_event` plus the SQL migration, and query helpers accepting an optional `DbOrTxClient`. → `pnpm --filter @cio/db build`
3. **Org-scoped API.** Section CRUD and reorder in one transaction, page-aware publish/version/rollback, analytics rollups. → `pnpm --filter @cio/api build`
4. **Section renderers in `packages/ui`.** The five new section components plus adapters wrapping the six existing widget layouts, each with a Storybook story covering every state. → `pnpm --filter @cio/ui prefix && pnpm --filter @cio/storybook build`
5. **Editor.** Sections panel with drag-reorder, per-section settings, theme-mode control, anonymous/signed-in preview toggle, embed + identity panel. → `pnpm --filter @cio/dashboard^... build && pnpm --filter @cio/dashboard build`
6. **Runtime, phase 1 — index.** New `academy` embed entry, router with the three adapters, section rendering from the snapshot, analytics events, per-chunk size gate in CI. → `pnpm --filter @cio/embeds build`
7. **Identity.** Better Auth `bearer()` plugin, `POST /widgets/:key/session` as a JSON caller of `exchangeToken()`, `embedLearnerMiddleware`, the `/me` overlay endpoint, and runtime merge. Integration tests for cross-org rejection and expiry.
8. **Runtime, phase 2 — mini-app.** Course detail and player chunks wrapping `packages/ui/src/custom/public-course`, the widget-scoped course/item/HLS/enroll/completion/submission routes, and the paid-course ejection.
9. **Docs and rollout.** `apps/docs` page for embedding and identity, feature flag, staged rollout.

Verification before any commit or PR, per CLAUDE.md: `pnpm --filter @cio/api^... build && pnpm --filter @cio/api build`, `pnpm --filter @cio/dashboard^... build && pnpm --filter @cio/dashboard build`, `pnpm --filter @cio/embeds build`, and `pnpm format:check`.

## Acceptance Criteria

1. An admin on a paid plan can create an academy, add and reorder at least six section types, publish it, and roll back to a previous version.
2. The published academy renders every configured section on a third-party origin with no host-page framework and no console errors.
3. An anonymous visitor sees the full page; `continue_learning` collapses without leaving a gap, and no personalization affordance appears.
4. A learner whose host app supplies a signed token sees their progress, a working Continue CTA that resumes at the correct item, and the For-you badge on the category matching their role trait.
5. Overlay failure or expiry degrades to the anonymous state without blanking the page or blocking first paint.
6. A signed-in learner can enrol in a free course, complete a lesson, and submit an exercise entirely inside the embed, and those writes appear in the LMS and admin reports as the same records the LMS would have created.
7. A paid course opens academy checkout in a new tab; no payment UI renders inside the embed.
8. Course detail, lesson, and exercise inside the embed are rendered by the same `packages/ui/src/custom/public-course` components the org-site route uses — no forked copies.
9. Every chunk is within its gzip budget, enforced by a CI gate that fails the build on regression.
10. A bearer token issued for one org is rejected on another org's widget key, and a widget key mounted on a non-allowlisted origin is refused.
11. The access token is never written to `localStorage`, `sessionStorage`, or a cookie.
12. Section impression and CTA-click events appear in the admin analytics view within one minute.
13. All copy uses translation keys; `en.json` changes are propagated to every other locale via `pnpm translate`.
14. Zero regression on existing features: block widgets, their payload endpoint, publish/rollback, the org landing page, and the org-site public course routes behave exactly as before, with the shipped widget test suite still green.

## Risks and Mitigations

| Risk | Mitigation |
| --- | --- |
| Scope: this is an LMS inside an embed, and the player is the largest piece | Phases 6 and 8 are separable releases. Phase 6 (index + sections, anonymous) is shippable value on its own; the mini-app can follow without rework because the router and chunk boundaries are designed for it in phase 6. |
| Bundle growth swamps the "lightweight embed" promise | Per-chunk budgets with a CI gate, lazy route chunks, and index-first paint. The learner who only browses never downloads the player. |
| Re-implementing the lesson player diverges from the LMS | Hard acceptance criterion (8): the embed must consume `packages/ui/src/custom/public-course`. Any prop the embed needs is added to the shared component, never forked. |
| Third-party cookie policy shifts again | The design is already cookie-free; the token lives in memory and is re-minted from the host on expiry. |
| A leaked public key lets someone re-host the academy | Per-widget allowed-origins list checked at session exchange, plus the existing per-key and per-IP rate limits. |
| Wildcard CORS surface grows with each new embed route | Every embed route stays under `/widgets/:publicKey/`, scoped to a widget key and its org, and each one delegates to an existing service rather than adding new authorization logic. |
| Personalization tempts us into leaking data into the cached snapshot | The snapshot builder physically cannot see learner data — `buildWidgetPagePayload` is pure and takes no learner argument. Personalization exists only in the `no-store` overlay. |
| Host app CSS or routing conflicts | Shadow DOM for styling; the router defaults to the memory adapter so no host history is touched until the customer opts in. |
| Section system diverges from the org landing page, leaving two page builders | Renderers are built in `packages/ui` with no embed-specific dependencies, so the landing page can adopt them later. Explicitly deferred, not designed out. |

## Open Calls

Two product calls were made without an explicit answer and can be vetoed:

1. **Section-level analytics ship in v1** (Decision 14). The reserved schema plus an admin view is roughly a phase of work; cutting it defers phases 3-analytics and the analytics prototype.
2. **`certificate_showcase` is deferred.** It was not selected for the v1 section catalog, so it is listed as a non-goal rather than reserved in the enum.
