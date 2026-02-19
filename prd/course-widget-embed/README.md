# Course Widget Embed PRD (Org Widgets)

## Purpose
Ship an organization-scoped widget system so admins can embed selected courses on external websites from `/org/[slug]/widgets`, with a visual editor and lightweight runtime.

## Confirmed Decisions (2026-02-17)
1. Editor route is in dashboard org context: `/org/[slug]/widgets` (user-facing equivalent: `/org/id/widgets`).
2. Embed runtime must be plain Svelte (no SvelteKit in the embed runtime path) for minimal JS payload.
3. Widget rendering supports multiple layouts:
- cards
- table
- primary single course
- carousel
- tag-filtered list (tags as top badges)
4. Widget authoring UI opens an editor with left panel sections:
- `Select Courses`
- `Widgets`
- `Design`
5. Published widgets deploy to Cloudflare-backed static hosting/edge delivery.
6. Dashboard editing imports the widget package in dev mode for real preview parity.
7. Dashboard preview does not call a preview endpoint; it uses already-fetched dashboard state and passes payload into an iframe.
8. Public embed fetches computed widget payload (courses + design config) from server endpoints.

## Problem Statement
Organizations currently show courses mainly on their own landing pages. There is no first-class way to publish reusable, brandable, copy-paste course widgets for external websites.

This creates gaps:
- No reusable embed snippet per organization.
- No dashboard-managed widget lifecycle (draft, publish, version rollback).
- No lightweight runtime optimized for third-party pages.
- No structured design controls for layout/theme/branding.

## Product Goals
1. Let org admins create and publish embeddable course widgets.
2. Keep embed runtime lightweight and isolated from host-site CSS/JS conflicts.
3. Reuse existing course and tag data models for content selection/filtering.
4. Provide clear plan-gated design controls (free vs paid capabilities).
5. Support versioned publishing with safe rollbacks.

## Non-Goals (v1)
- Full website/page builder replacement.
- Server-rendered widget runtime.
- Cross-org shared widget templates marketplace.
- Arbitrary third-party JS execution inside widgets.

## Data Sources Checked
- `apps/dashboard/src/lib/features/ui/navigation/org-navigation.ts`
- `apps/dashboard/src/routes/org/[slug]/courses/+page.server.ts`
- `apps/dashboard/src/routes/org/[slug]/tags/+page.server.ts`
- `apps/dashboard/src/lib/features/org/api/org.svelte.ts`
- `apps/dashboard/src/lib/features/org/components/landing-page/landing-page.svelte`
- `apps/dashboard/src/lib/features/course/components/card.svelte`
- `apps/api/src/routes/organization/organization.ts`
- `apps/api/src/services/organization.ts`
- `packages/db/src/schema.ts`
- `packages/db/src/queries/course/course.ts`
- `packages/db/src/queries/tag/tag.ts`
- `packages/utils/src/plans/constants.ts`
- `packages/course-app/README.md`

## User Roles

### Admin (`ROLE.ADMIN`)
- Create/edit/delete/archive widgets.
- Select courses and widget layout.
- Configure design controls and plan-gated options.
- Publish widget versions and rollback.
- Copy embed snippet.

### Tutor (`ROLE.TUTOR`)
- Create/edit widget drafts and use live preview.
- No publish, rollback, or destructive lifecycle actions in v1.

### Student/Public
- No dashboard access.
- Consume published embed on external sites.

## Functional Requirements

### 1. Widget Lifecycle
- Create widget with:
  - `name`
  - `layoutType`
  - selection mode (`manual` course selection or `published courses`)
  - initial design config
- Status model:
  - `DRAFT`
  - `PUBLISHED`
  - `ARCHIVED`
- Save model:
  - manual save only (`Save` button)
  - no autosave in v1
- Publish creates immutable version snapshot.
- Rollback can point latest published to a previous version.

### 2. Widget Editor UX (`/org/[slug]/widgets/:widgetId`)
- Left panel tabs:
  - `Select Courses`
  - `Widgets`
  - `Design`
- Main panel:
  - live preview using the same shared render package as embed
  - desktop/mobile preview toggle
  - embed code tab
- Live preview behavior:
  - every design/content change updates a local draft state
  - dashboard uses already-fetched state (courses/tags/widget draft) to build preview payload
  - preview payload is passed down through iframe (`postMessage`) to preview runtime
  - iframe mounts the same widget component contract used by public embed
  - changes are preview-only until user clicks `Save`

### 3. Select Courses
- Source modes:
  - manual selected courses
  - all published org courses
- Filters:
  - tag include/exclude using existing org tags
  - search by course title
- Ordering:
  - manual order
  - newest
  - title A-Z

### 4. Widget Layout Types
- `cards`
- `table`
- `primary_course`
- `carousel`
- `tag_filter`

Each layout supports required shared props:
- `showCourseImage`
- `showCourseTypeBadge`
- `showLessonsCount`
- `showPrice`
- `showDescriptionExcerpt`
- `ctaLabel`

### 5. Design Controls
Design panel is grouped as:

#### Content
- limit courses toggle + max count
- load more label
- hide load more toggle
- show border toggle
- border width
- shadow size + style + color
- border radius scale
- show metadata toggles (lessons/type/price)
- shorten long description toggle
- show highlighted/featured style toggle

#### Colors
- primary color
- background color
- text color
- badge/rating color
- border color
- highlight color

#### Typography
- font family selector
- font size scale

#### Filters
- add/remove tag filter rows
- top badge style for tag filter layout

#### Branding
- `Show Classroomio Powered By` toggle

#### Advanced
- custom CSS textarea (sanitized + size-limited)

### 6. Plan Gating
- Free (`PLAN.BASIC`):
  - limited preset color theme only
  - branding forced on
  - custom CSS disabled
- Paid (`PLAN.EARLY_ADOPTER`, `PLAN.ENTERPRISE`):
  - full color controls
  - branding toggle available
  - custom CSS enabled

### 7. Public Embed Contract
- Copy-paste script embed:
  - `<script async src="https://widgets.classroomio.com/v1/loader.js" data-widget="wgt_xxx"></script>`
- Loader pulls published widget payload via public key and mounts Svelte widget.
- Host page should not require framework dependencies.
- Payload shape must match dashboard preview payload contract.

### 8. Runtime Constraints (Lightweight Requirement)
- Plain Svelte runtime package (`packages/widgets`) compiled in library mode.
- No SvelteKit runtime in embed bundle.
- Use style isolation (Shadow DOM custom element or strict scoped prefix).
- Performance budgets:
  - loader <= 3KB gzip
  - base runtime <= 35KB gzip (excluding fetched data)
  - first render <= 1.2s on mid-tier 4G for <= 6 courses

### 9. Security and Safety
- Public widget key must be non-guessable.
- Custom CSS restricted to CSS only; reject `<script>`/URL JS vectors.
- Public endpoint returns only publish-approved fields (no internal org data).
- Rate limit public widget payload endpoint.

### 10. Analytics
- Capture:
  - widget impressions
  - course CTA clicks
  - optional filter interactions
- Store per widget version for A/B or rollback analysis.

### 11. Shared Payload Contract (Hard Requirement)
- One canonical payload schema defines widget data:
  - selected courses
  - resolved ordering/filters
  - normalized design tokens and defaults
  - plan-gated fields
- Dashboard preview builds payload client-side from already-fetched state and passes it to iframe.
- Public embed builds/fetches payload server-side from persisted widget config and course queries.
- The embed renderer accepts only this payload schema + minimal runtime options.
- No separate dashboard-only renderer data shape is allowed.

## Proposed Architecture

### Package and App Boundaries
1. `packages/widgets`
- plain Svelte renderer components
- layout implementations
- shared design token mapping
- build output: ESM + browser bundle

2. `apps/dashboard`
- widget editor UI and preview
- imports renderer from `@cio/widgets` in dev/prod build

3. `apps/api`
- org-protected widget CRUD/publish routes
- public widget payload route
- shared `computeWidgetPayload(...)` service used for public payload routes

4. Cloudflare publish target
- stores versioned JS/CSS artifacts
- serves loader + static assets + cache headers

### Render Data Flow
1. Dashboard editor loads widget draft and related data into state (courses/tags/config).
2. Left panel changes update local draft JSON in state.
3. Dashboard builds preview payload from state and sends it to preview iframe via `postMessage`.
4. Preview iframe mounts `@cio/widgets` renderer with received payload.
5. Publish stores snapshot; public loader requests server-computed payload for published version and mounts same renderer.

### Data Model (Proposed)
1. `widget`
- `id`, `organization_id`, `name`, `status`, `layout_type`
- `selection_mode`, `public_key`, `latest_published_version_id`
- `created_by`, `updated_by`, timestamps

2. `widget_course`
- `widget_id`, `course_id`, `order`

3. `widget_version`
- `id`, `widget_id`, `version`
- `config_snapshot` (jsonb)
- `artifact_manifest` (jsonb: js/css URLs + integrity)
- `published_at`, `published_by`

## API Contract Additions (Target)
### Organization-Scoped (auth + org membership)
1. `GET /organization/widgets`
2. `POST /organization/widgets`
3. `GET /organization/widgets/:widgetId`
4. `PUT /organization/widgets/:widgetId`
5. `DELETE /organization/widgets/:widgetId`
6. `POST /organization/widgets/:widgetId/publish`
7. `POST /organization/widgets/:widgetId/rollback`

### Public
1. `GET /widgets/:publicKey/payload`
2. `POST /widgets/:publicKey/events` (optional in v1, can be deferred)

## UX Flow
1. Admin opens `/org/[slug]/widgets`.
2. Clicks `Create Widget`.
3. Editor opens with left tabs (`Select Courses`, `Widgets`, `Design`).
4. Admin previews and adjusts design.
5. Admin publishes, receives embed snippet.
6. External website adds script tag; widget renders courses.

## Open Questions
1. Should free plan allow any color tweaks or only fixed presets?
2. Should `POST /widgets/:publicKey/events` be v1 or phase 2?
3. Should widget runtime support locale detection in v1 or keep single-language labels?
4. For CSS isolation, do we prefer Shadow DOM custom element or scoped class strategy first?

## Expanded TODOs (Priority)

### TODO-2: Iframe Protocol Spec
- Define strict preview iframe message protocol:
  - `WIDGET_PREVIEW_READY`
  - `WIDGET_PREVIEW_RENDER`
  - `WIDGET_PREVIEW_ERROR`
  - `WIDGET_PREVIEW_RESIZE` (optional)
- Define payload envelope:
  - `version`
  - `requestId`
  - `widgetPayload`
  - `timestamp`
- Security rules:
  - strict `targetOrigin` usage (never `*` in production)
  - origin validation in iframe before handling messages
  - message schema validation (reject unknown/malformed messages)
- Reliability rules:
  - parent sends render only after `READY` ack
  - support retry on missing ack (limited attempts)
  - render errors surface in parent UI with fallback preview state
- Documentation output:
  - one protocol spec file under PRD/tech docs
  - sequence diagram (parent -> iframe -> ack/render)

### TODO-3: Preview Data Freshness
- Define dashboard data freshness strategy for preview inputs:
  - source datasets: courses, tags, current widget draft
  - initial fetch path: `+page.server.ts` hydration
  - refresh triggers: manual refresh only in v1
- Staleness UX:
  - show `Last synced at` timestamp
  - `Refresh data` button in editor
  - warning badge when source data might be stale
- Consistency behavior:
  - if course/tag removed after load, show non-blocking warning in preview
  - keep local draft stable until explicit refresh or save
- Performance guardrails:
  - avoid refetch on every left-panel change
  - preview must re-render from local state only
- Documentation output:
  - list of freshness states (`fresh`, `stale`, `refreshing`, `error`)
  - state transition table for editor UI

## Success Criteria
1. Admin can publish a widget and embed it externally in under 5 minutes.
2. Embed snippet works across static HTML, React, and WordPress hosts.
3. Runtime stays within performance budget and has no host CSS collisions.
4. Support tickets for “embed broken by host CSS” remain near zero.
5. Dashboard live preview matches public embed rendering for the same payload and version.
