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
5. Published widgets deploy to Cloudflare-backed static hosting/edge delivery (R2 + Workers).
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
  - **1 preset theme only** (default Classroomio theme)
  - branding forced on
  - custom CSS disabled
- Paid (`PLAN.EARLY_ADOPTER`, `PLAN.ENTERPRISE`):
  - **All preset themes available** (3-5 curated themes)
  - full color controls (custom colors)
  - branding toggle available
  - custom CSS enabled

### 7. Public Embed Contract
- Copy-paste script embed:
  - `<script async src="https://widgets.classroomio.com/v1/loader.js" data-widget="wgt_xxx"></script>`
- Loader pulls published widget payload via public key and mounts Svelte widget.
- Host page should not require framework dependencies.
- Payload shape must match dashboard preview payload contract.

### 8. Runtime Constraints (Lightweight Requirement)
- Plain Svelte runtime package (`packages/widgets`) compiled in library mode (Vite `build.lib`).
- No SvelteKit runtime in embed bundle.
- Use style isolation: **Shadow DOM custom element** (`<widget-root>`) with `:host` selector support.
- Performance budgets:
  - loader <= 3KB gzip
  - base runtime <= 35KB gzip (excluding fetched data)
  - first render <= 1.2s on mid-tier 4G for <= 6 courses
- Accessibility:
  - All interactive elements keyboard accessible
  - ARIA labels on course cards (`aria-label="Course: ${title}"`)
  - Alt text on course images
  - Focus visible indicators

### 9. Security and Safety
- Public widget key must be non-guessable (format: `wgt_<base58>`).
- Custom CSS sanitized with `css-tree` parser (whitelist approach):
  - Max size: 5KB
  - Reject: `@import`, `javascript:`, expression(), behavior:, binding:, `-moz-binding`
  - Reject properties: `position: fixed` (can overlay host page maliciously)
  - Allowed: standard visual styles (color, spacing, typography, flex/grid layout)
- Public endpoint returns only publish-approved fields (no internal org data).
- Rate limit public widget payload endpoint: 100 req/min per IP, 1000 req/min per widget key.
- iframe origin validation: strict `targetOrigin` matching dashboard domain.

### 10. Analytics (Schema Reserved for Phase 2)
**Deferred to Phase 2**, but schema defined for forward compatibility:

```typescript
// Table: widget_analytics_event
{
  id: string;
  widget_id: string;
  widget_version_id: string;
  event_type: 'impression' | 'cta_click' | 'filter_interaction';
  course_id?: string;       // for cta_click events
  filter_tag_id?: string;   // for filter_interaction events
  session_id: string;       // anonymous session fingerprint
  timestamp: Date;
  user_agent_hash: string;  // privacy-preserving hash
  country_code?: string;    // from CF-IPCountry header
}
```

- Ingestion: Batch insert every 30 seconds or 1000 events
- Retention: 90 days raw, aggregated forever
- v1: No events endpoint; schema created but not populated

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

### 11. Cloudflare Publish Pipeline (Phase E)

#### Artifact Generation
1. **Build Trigger**: API call `POST /organization/widgets/:widgetId/publish`
2. **Build Process**:
   ```
   a. API receives publish request
   b. Compute final payload with resolved courses + design config
   c. Trigger build worker (Cloudflare Worker or GitHub Actions)
   d. Build @cio/widgets package with embedded design tokens
   e. Generate hashed filenames (e.g., `widget.a3f2b1c.js`)
   f. Upload to R2 bucket: `widgets/{orgId}/{widgetId}/v{version}/`
   g. Return manifest URLs to API
   h. API saves `artifact_manifest` to `widget_version` table
   ```

#### Artifact Manifest Format
```json
{
  "version": "v1",
  "widgetId": "wgt_xxx",
  "orgId": "org_yyy",
  "createdAt": "2026-02-19T12:00:00Z",
  "files": {
    "js": {
      "url": "https://cdn.classroomio.com/widgets/org_yyy/wgt_xxx/v3/widget.a3f2b1c.js",
      "integrity": "sha384-abc123...",
      "size": 24567
    },
    "css": {
      "url": "https://cdn.classroomio.com/widgets/org_yyy/wgt_xxx/v3/styles.7e8d9f0.css",
      "integrity": "sha384-def456...",
      "size": 3456
    }
  },
  "designHash": "sha256:abc..."
}
```

#### Cleanup Policy
- Keep last 10 versions per widget
- Delete older artifacts after 30 days (R2 lifecycle rule)
- Soft-delete in DB (set `deleted_at`), hard-delete after 90 days

#### Delivery Architecture
```
User's Website                    Cloudflare
|                                 |
|-- script src="loader.js" -----> |-- Worker: validate key
|                                 |-- Check cache (KV)
|                                 |-- Cache miss: fetch from R2
|<-- loader.js -------------------|
|                                 |
|-- loader fetches manifest ----->|-- Return artifact_manifest
|                                 |
|-- loader injects JS/CSS ------->|-- Serve from R2 (immutable cache)
```

---

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

### Plan Gating UX Pattern
- **Free users**: Show paid features as disabled with upgrade tooltip
  - Theme selector shows 1 option with "Upgrade to unlock more themes" on hover
  - Custom color picker disabled with "Upgrade to customize colors" tooltip
  - Custom CSS textarea shows lock icon with upgrade CTA
  - "Powered by Classroomio" toggle is locked ON with tooltip
- **Paid users**: Full access to all controls, branding toggle available

## Open Questions (Resolved)
1. ✅ **Free plan color tweaks** – **1 preset theme only** (default). Paid users get all preset themes (3-5) plus custom color picker.
2. ✅ **Events endpoint** – Deferred to Phase 2; schema reserved but not implemented in v1.
3. ✅ **Locale detection** – Deferred to Phase 2; widgets use single-language labels from org default locale in v1.
4. ✅ **CSS isolation** – **Shadow DOM custom element** preferred for strongest isolation. Fallback to scoped classes only if Shadow DOM causes critical theming issues during Phase C testing.

## Additional Architecture Decisions

### Widget Key Format
- Format: `wgt_<base58(16-bytes-random)>`
- Example: `wgt_3J98t1WpEZ73CNmYv`
- Includes implicit typo detection via base58 checksum behavior
- Length: 23 characters (prefix + 16 chars)

### Rollback Mechanics
- Rollback is **pointer-swap**, not append-only
- `latest_published_version_id` points to any previous version
- No new version created on rollback
- Analytics remain tied to version ID (history preserved)
- UI shows version history (read-only) with "Restore to this version" action

### Caching Strategy
- Public payload endpoint: `Cache-Control: public, max-age=60, stale-while-revalidate=300`
- Widget JS/CSS artifacts: `Cache-Control: public, max-age=31536000, immutable`
- Loader script: `Cache-Control: public, max-age=3600` (versioned via query param)

## Expanded TODOs (Priority)

### TODO-2: Iframe Protocol Spec (Detailed)

#### Message Types
```typescript
// Parent → Iframe
type ParentMessage = 
  | { type: 'WIDGET_PREVIEW_RENDER'; payload: WidgetPayload; requestId: string }
  | { type: 'WIDGET_PREVIEW_PING' }; // health check

// Iframe → Parent
type IframeMessage =
  | { type: 'WIDGET_PREVIEW_READY'; iframeId: string; timestamp: number }
  | { type: 'WIDGET_PREVIEW_RENDERED'; requestId: string; timestamp: number }
  | { type: 'WIDGET_PREVIEW_ERROR'; requestId: string; error: string; timestamp: number }
  | { type: 'WIDGET_PREVIEW_RESIZE'; height: number; width?: number }
  | { type: 'WIDGET_PREVIEW_CTA_CLICK'; courseId: string }; // for preview interactivity
```

#### Payload Envelope
```typescript
interface WidgetPayload {
  version: 'v1';
  widgetId: string;
  layoutType: 'cards' | 'table' | 'primary_course' | 'carousel' | 'tag_filter';
  courses: Course[];
  design: DesignConfig;
  planGatedFields: PlanGatedFields;
  timestamp: number; // epoch ms for cache-busting
}
```

#### Security Rules
1. **Origin Validation**:
   - Production: `targetOrigin` must match `VITE_DASHBOARD_URL` (e.g., `https://app.classroomio.com`)
   - Development: allow `http://localhost:*` with port wildcard
   - Never use `*` in production
   
2. **Message Validation**:
   - Reject messages without `type` field
   - Reject unknown message types
   - Validate payload schema with Zod before processing

3. **iframe Sandboxing**:
   - Use `sandbox="allow-scripts"` attribute
   - No `allow-same-origin` (prevents cookie access)

#### Reliability Rules
1. **Handshake Flow**:
   ```
   Parent: mount iframe → wait for READY (timeout: 5s)
   Iframe: mount complete → send READY
   Parent: receive READY → send RENDER with payload
   Iframe: render complete → send RENDERED or ERROR
   ```

2. **Retry Logic**:
   - READY timeout: 3 retry attempts, exponential backoff (1s, 2s, 4s)
   - RENDERED timeout: 2 retry attempts, show error state in parent

3. **Error Handling**:
   - Render errors: Show fallback UI in parent ("Preview unavailable")
   - Log error details to console with `[WidgetPreview]` prefix
   - Surface user-friendly error in editor UI

#### Sequence Diagram
```
Parent (Dashboard)          Iframe (Widget Runtime)
       |                              |
       |--- mount iframe ------------>|
       |                              |
       |<-- WIDGET_PREVIEW_READY -----|
       |    (iframe ready)            |
       |                              |
       |--- WIDGET_PREVIEW_RENDER --->|
       |    (payload + config)        |
       |                              |
       |<-- WIDGET_PREVIEW_RESIZE ----|
       |    (dynamic height)          |
       |                              |
       |<-- WIDGET_PREVIEW_RENDERED --|
       |    OR WIDGET_PREVIEW_ERROR   |
```

#### Documentation Output
- Spec file: `prd/course-widget-embed/iframe-protocol.md` (this section)
- Implementation: `packages/widgets/src/preview/iframe-bridge.ts` + `apps/dashboard/src/lib/features/widget/preview/iframe-parent.ts`

### TODO-3: Preview Data Freshness (Implementation Details)

#### Freshness States
| State | Indicator | User Action | Behavior |
|-------|-----------|-------------|----------|
| `fresh` | Green dot + "Live" | None | Data synced with server within last 5 minutes |
| `stale` | Yellow dot + "Refresh suggested" | Manual refresh button | Data older than 5 minutes or tab was backgrounded |
| `refreshing` | Spinner + "Syncing..." | Disabled | Fetch in progress |
| `error` | Red dot + "Sync failed" | Retry button | Last fetch failed, using cached data |

#### Implementation Rules
1. **Initial Load**: `+page.server.ts` provides hydrated data with `serverTimestamp`
2. **Stale Detection**:
   - Check `Date.now() - lastSyncTime > 5 * 60 * 1000` on mount
   - Listen to `visibilitychange` event: when tab becomes visible, check staleness
3. **Background Sync**:
   - Use `navigator.sendBeacon` or `fetch` with `keepalive` for refresh
   - Debounce refresh calls (minimum 30s between requests)
4. **Warning UX**:
   - Non-blocking toast when stale data detected
   - Course/tag removed warning appears in preview area (not blocking)
5. **Consistency**:
   - Draft state is never auto-refreshed; only source data (courses/tags list)
   - User must explicitly refresh to see new courses/tags

#### State Machine
```
         initial load
[empty] ----------> [fresh]
                       |
            5min timeout | visibility change
                       v
                   [stale] <------.
                       |          |
            manual or |          | error
            auto refresh          |
                       v          |
                  [refreshing] ----'
                       |
            success |  | failure
                 |     |
                 v     v
              [fresh] [error]
                 ^       |
                 '-------'
                  retry
```

---

### TODO-4: CSS Sanitizer Implementation

#### Library Choice
- **Primary**: `css-tree` for parsing + whitelist validation
- **Backup**: `reworkcss` if `css-tree` bundle size exceeds 15KB

#### Validation Rules
```typescript
const CSS_SANITIZER_CONFIG = {
  maxSizeBytes: 5120, // 5KB
  
  // Allowed at-rules
  allowedAtRules: ['media', 'supports', 'keyframes', '-webkit-keyframes'],
  
  // Blocked at-rules (security)
  blockedAtRules: ['import', 'charset', 'namespace', 'font-face', 'page', 'document'],
  
  // Allowed properties (whitelist approach)
  allowedProperties: [
    // Layout
    'display', 'position', 'top', 'right', 'bottom', 'left',
    'flex', 'flex-direction', 'flex-wrap', 'flex-grow', 'flex-shrink', 'flex-basis',
    'justify-content', 'align-items', 'align-content', 'gap', 'row-gap', 'column-gap',
    'grid', 'grid-template', 'grid-column', 'grid-row', 'grid-area',
    // Box model
    'width', 'height', 'min-width', 'min-height', 'max-width', 'max-height',
    'margin', 'margin-top', 'margin-right', 'margin-bottom', 'margin-left',
    'padding', 'padding-top', 'padding-right', 'padding-bottom', 'padding-left',
    'border', 'border-radius', 'box-sizing', 'overflow', 'overflow-x', 'overflow-y',
    // Visual
    'color', 'background', 'background-color', 'background-image', 'background-size',
    'background-position', 'background-repeat', 'opacity', 'box-shadow',
    'border-color', 'border-width', 'border-style', 'border-top', 'border-right',
    // Typography
    'font-family', 'font-size', 'font-weight', 'font-style', 'line-height',
    'text-align', 'text-decoration', 'text-transform', 'letter-spacing', 'word-spacing',
    'white-space', 'word-break', 'overflow-wrap',
    // Effects
    'transform', 'transition', 'animation', 'filter', 'backdrop-filter'
  ],
  
  // Blocked values (regex patterns)
  blockedValuePatterns: [
    /javascript:/i,
    /expression\s*\(/i,
    /behavior\s*:/i,
    /binding\s*:/i,
    /-moz-binding/i,
    /url\s*\(\s*["']?\s*data:/i, // data URIs (potential XSS)
  ],
  
  // Special property validations
  propertyValidators: {
    'position': (value: string) => value !== 'fixed', // No fixed positioning
    'background-image': (value: string) => !value.includes('url') || value.startsWith('url(https://')
  }
};
```

#### Error Handling
- Invalid CSS is stripped silently (not rejected entirely)
- User sees warning: "Some CSS rules were removed for security"
- Log sanitized rules to console in dev mode only

---

### TODO-5: Accessibility Requirements (v1)

#### Keyboard Navigation
- Tab order: logical flow through course cards
- Enter/Space: activate CTA buttons
- Escape: close any open modals/filter dropdowns

#### Screen Reader Support
- Course cards: `role="article"` with `aria-labelledby` pointing to title
- CTA buttons: descriptive `aria-label` (e.g., "View Introduction to Python course")
- Filter badges: `aria-pressed` state for active filters
- Live regions: announce filter results changes (`aria-live="polite"`)

#### Visual Requirements
- Focus indicators: 2px solid outline with 2px offset (using `:focus-visible`)
- Color contrast: minimum 4.5:1 for text (validated in design tokens)
- Reduced motion: respect `prefers-reduced-motion` for carousel animations

---

### TODO-6: Bundle Size Enforcement

#### CI Configuration
```yaml
# packages/widgets/bundle-size.json
{
  "limits": {
    "loader.js": "3kb",
    "runtime.js": "35kb",
    "runtime.css": "5kb"
  },
  "failOnViolation": true
}
```

#### Build Script
```bash
#!/bin/bash
# packages/widgets/scripts/check-bundle-size.sh

max_size_loader=$((3 * 1024))     # 3KB
max_size_runtime=$((35 * 1024))   # 35KB

loader_size=$(gzip -c dist/loader.js | wc -c)
runtime_size=$(gzip -c dist/runtime.js | wc -c)

if [ $loader_size -gt $max_size_loader ]; then
  echo "❌ Loader exceeds budget: ${loader_size}B > ${max_size_loader}B"
  exit 1
fi

if [ $runtime_size -gt $max_size_runtime ]; then
  echo "❌ Runtime exceeds budget: ${runtime_size}B > ${max_size_runtime}B"
  exit 1
fi

echo "✅ Bundle sizes within budget"
```

## Success Criteria
1. Admin can publish a widget and embed it externally in under 5 minutes.
2. Embed snippet works across static HTML, React, and WordPress hosts.
3. Runtime stays within performance budget and has no host CSS collisions.
4. Support tickets for “embed broken by host CSS” remain near zero.
5. Dashboard live preview matches public embed rendering for the same payload and version.
6. **Accessibility**: Widgets are keyboard-navigable (Tab order, Enter/Space to activate CTAs) and screen-reader friendly (ARIA labels on course cards, alt text on images).
7. **Security**: Zero XSS vectors through custom CSS or malformed payloads in penetration testing.
