# Course Widget Embed Implementation Plan (v1)

## Scope Lock
1. Widget embed runtime is plain Svelte package output (no SvelteKit runtime dependency in embedded widget).
2. Admin + Tutor can edit drafts; publish/rollback/delete remain admin-only.
3. Org-scoped widgets only; no cross-org sharing.
4. Required layout types in v1:
- cards
- table
- primary course
- carousel
- tag filter badges
5. Editor route is `/org/[slug]/widgets` with create/edit flows.
6. Publish target is Cloudflare-hosted static assets + edge delivery.
7. Dashboard live preview is local state -> iframe (no preview API endpoint).
8. Public embed fetches server-computed payload from widget public endpoint.
9. Both paths must use the same shared payload schema.
10. Draft editing is manual-save only (no autosave in v1).
11. Shadow DOM is the default isolation strategy; fallback to scoped classes only if critical issues arise.
12. CSS sanitizer uses `css-tree` with 5KB limit and whitelist validation.

## Delivery Phases
1. Phase A: Data model + validation + DB query layer.
2. Phase B: API services/routes (org + public payload).
3. Phase C: `@cio/widgets` package (plain Svelte runtime + loader contract).
4. Phase D: Dashboard widgets feature (list, editor, preview, publish).
5. Phase E: Cloudflare publish pipeline + observability + hardening.

## Ticket Breakdown

| ID | Area | Task | Key Files | Dependencies | Done When |
| --- | --- | --- | --- | --- | --- |
| CW-A1 | DB | Add widget schemas (`widget`, `widget_course`, `widget_version`) | `packages/db/src/schema.ts` | None | Tables/migrations compile with org-scoped FKs and indexes |
| CW-A2 | DB Queries | Implement widget query module | `packages/db/src/queries/widget/widget.ts` | CW-A1 | CRUD + version + selection queries implemented with error logging pattern |
| CW-A3 | Utils Validation | Add widget validation schemas | `packages/utils/src/validation/widget/widget.ts` + exports | CW-A1 | Zod schemas cover create/update/publish/public payload |
| CW-A4 | DB Types | Export new widget types | `packages/db/src/types.ts` | CW-A1 | Type generation/build includes widget entities |
| CW-B1 | API Service | Add widget service layer | `apps/api/src/services/widget.ts` | CW-A2,CW-A3 | Role/org checks + business rules in service layer |
| CW-B2 | API Routes | Add org widget routes | `apps/api/src/routes/organization/widgets.ts` | CW-B1 | CRUD/publish/rollback endpoints working |
| CW-B3 | API Routes | Add public widget payload route | `apps/api/src/routes/widgets/widgets.ts` | CW-B1 | Public payload returns publish-safe data only |
| CW-B4 | API Register | Register routes in app tree | `apps/api/src/routes/organization/index.ts`, `apps/api/src/app.ts` | CW-B2,CW-B3 | RPC + public routes reachable |
| CW-B5 | API Analytics | Track view/click events (optional gate) | `apps/api/src/services/widget.ts` + route | CW-B3 | Event path available or clearly deferred behind feature flag |
| CW-B6 | API Compute Service | Add canonical payload builder for public embed | `apps/api/src/services/widget-payload.ts`, `apps/api/src/routes/widgets/widgets.ts` | CW-B1 | Public payload route uses one compute function for courses + design config |
| CW-C1 | Widgets Package | Create `@cio/widgets` package (plain Svelte runtime) | `packages/widgets/*` | CW-A3 | Package builds to ESM/browser bundle without SvelteKit |
| CW-C2 | Layouts | Implement 5 layout renderers | `packages/widgets/src/layouts/*` | CW-C1 | All required layouts render from same config contract |
| CW-C3 | Design Tokens | Add config-to-style mapper + Shadow DOM isolation | `packages/widgets/src/styles/*` | CW-C1 | Host CSS does not break widget visuals; Shadow DOM encapsulation verified in tests |
| CW-C4 | Loader Contract | Add loader bootstrap interface | `packages/widgets/src/loader/*` | CW-C1 | Loader can mount widget by payload id/key |
| CW-C5 | Size Budget | Add bundle size CI checks (loader ≤3KB, runtime ≤35KB gzip) | `packages/widgets/package.json` scripts + CI workflow | CW-C1 | CI fails when runtime exceeds target budgets; budget file in `bundle-size.json` |
| CW-C6 | Renderer Contract | Add strict typed payload contract shared by dashboard and API | `packages/widgets/src/types/payload.ts` | CW-C1,CW-B6 | Renderer accepts canonical payload schema only |
| CW-D1 | Dashboard Types | Add request/response types for widget API | `apps/dashboard/src/lib/features/widget/utils/types.ts` | CW-B4 | Types follow `typeof classroomio...` pattern |
| CW-D2 | Dashboard API | Add widget API class | `apps/dashboard/src/lib/features/widget/api/widget.svelte.ts` | CW-D1 | All widget requests use `this.execute<RequestType>()` |
| CW-D3 | Widgets List Page | Add `/org/[slug]/widgets` list route/page | `apps/dashboard/src/routes/org/[slug]/widgets/+page.svelte`, `+page.server.ts` | CW-D2 | Admin can see/create/open widgets |
| CW-D4 | Editor Page | Add `/org/[slug]/widgets/[widgetId]` editor route/page | `apps/dashboard/src/routes/org/[slug]/widgets/[widgetId]/+page.svelte`, `+page.server.ts` | CW-D3,CW-D2 | Left panel tabs + live preview + save/publish works |
| CW-D5 | Sidebar Nav | Add widgets entry to org sidebar | `apps/dashboard/src/lib/features/ui/navigation/org-navigation.ts` | CW-D3 | Sidebar highlights widgets route correctly |
| CW-D6 | Translations | Add all widget UI copy keys | `apps/dashboard/src/lib/utils/translations/en.json` | CW-D4 | No hardcoded user-facing strings |
| CW-D12 | Accessibility | Add ARIA labels, keyboard navigation, focus indicators | widget layouts + preview | CW-C2 | Widget passes axe-core automated checks |
| CW-D7 | Plan Gating UI | Add paid/free UI gate: 1 theme for free, all themes + custom colors for paid | widget feature pages + store | CW-D4 | Free users see 1 theme option with upgrade prompt; paid users see all themes + custom colors |
| CW-D8 | Live Preview Pipeline | Build local state -> iframe preview pipeline | `apps/dashboard/src/routes/org/[slug]/widgets/[widgetId]/+page.server.ts`, editor feature files, preview iframe files | CW-C6 | Editing left-panel settings re-renders iframe preview without API roundtrip |
| CW-D9 | Manual Save UX | Add explicit save/discard workflow and dirty-state handling | editor feature files + stores | CW-D8 | No autosave; unsaved changes are preserved locally until user saves/discards |
| CW-D10 | Iframe Protocol | Implement iframe message protocol with origin/schema validation per spec in README | preview parent + iframe runtime files | CW-D8 | `READY/RENDER/ERROR/RESIZE` flow works with 3 retry attempts and strict origin checks |
| CW-D11 | Freshness Controls | Add data freshness states + manual refresh button in editor | editor route/feature files | CW-D8 | Editor shows `Last synced`, supports manual refresh, and handles stale warnings |
| CW-E1 | Publish Pipeline | Build widget artifact + upload to Cloudflare | `scripts/widgets/*` or api worker hook | CW-C4,CW-B2 | Publish produces versioned URLs + manifest persisted |
| CW-E2 | Cloudflare Delivery | Configure edge/static delivery and cache policy | deployment config/docs | CW-E1 | Loader/assets served with immutable cache headers |
| CW-E3 | Hardening | Add CSS sanitizer (css-tree), key generation (base58), rate limiting | API service/routes | CW-B3 | Public endpoints pass security checks; CSS validator tests pass |
| CW-E4 | Tests | Unit/integration tests for config + publish + payload | API/db/package tests | CW-B4,CW-C2 | Core flows covered and passing in CI |
| CW-E5 | Rollout | Add feature flag + staged rollout checklist | env/config docs | CW-D4 | Safe enable/disable by environment |

## API Contract (Target)

### Org Protected
1. `GET /organization/widgets`
2. `POST /organization/widgets`
3. `GET /organization/widgets/:widgetId`
4. `PUT /organization/widgets/:widgetId`
5. `DELETE /organization/widgets/:widgetId`
6. `POST /organization/widgets/:widgetId/publish`
7. `POST /organization/widgets/:widgetId/rollback`

### Public
1. `GET /widgets/:publicKey/payload`
2. `POST /widgets/:publicKey/events` (if enabled in v1)

## Widget Runtime Notes (Strict)
1. Use plain Svelte components compiled via Vite library mode.
2. Do not ship SvelteKit runtime artifacts in embed bundle.
3. Keep dependency graph minimal (avoid heavy UI libraries in embed package).
4. Isolate styles (prefer Shadow DOM custom element or strict prefixed scoping).
5. Renderer input type is the canonical payload contract shared across dashboard preview and public embed.

## Dashboard UI Notes
1. Follow existing route pattern:
- route file contains `Page.Root/Page.Header`
- feature page contains business logic
2. Keep form controls using `@cio/ui` components.
3. Store all user-facing strings in translations.
4. Keep preview component using the same package renderer used in published bundle.
5. Editor `+page.server.ts` provides initial data for local preview state (courses/tags/draft config).
6. Left-panel changes update local payload and send it to iframe via `postMessage` (debounced/throttled).
7. Preview iframe should not fetch widget data; it only renders payload received from parent state.
8. No autosave; user must click `Save` to persist draft changes.
9. Provide explicit `Discard changes` action for local draft reset.

## Acceptance Criteria by Phase

### Phase A
1. Migration runs cleanly.
2. Org isolation enforced at query/service level.
3. Validation schemas compile in `@cio/utils`.
4. CSS sanitizer config defined and testable.

### Phase B
1. Admin can CRUD and publish widget via API.
2. Public payload endpoint returns only published widget versions.
3. Unauthorized org access returns proper 403/404 behavior.
4. Public payload endpoint uses canonical compute service for courses + design config.
5. CSS sanitization rejects malicious input in tests.
6. Rate limiting enforced on public endpoints.

### Phase C
1. `@cio/widgets` package builds independently.
2. Runtime meets bundle budget and renders all required layouts.
3. Host-site CSS does not break widget UI in smoke tests (Shadow DOM verified).
4. Renderer consumes only canonical computed payload type.
5. Accessibility: keyboard navigation and ARIA labels implemented.
6. Bundle size CI check fails builds exceeding budget.

### Phase D
1. Admin can create/edit/publish from `/org/[slug]/widgets`.
2. Tutors can edit drafts from `/org/[slug]/widgets` editor.
3. Editor left panel has `Select Courses`, `Widgets`, `Design`.
4. Live preview updates as settings change using local state passed to iframe.
5. Embed snippet is copyable from dashboard.
6. Plan gates visibly enforce free vs paid restrictions (disabled with tooltips).
7. Editing is manual-save only; no background persistence happens.
8. Iframe protocol is stable (`READY/RENDER/ERROR/RESIZE`) with strict origin validation and retry logic.
9. Data freshness UI supports manual refresh and stale-state warnings.
10. Accessibility: widgets pass axe-core automated checks.

### Phase E
1. Publish creates versioned immutable artifact URLs in Cloudflare R2.
2. Rollback switches manifest pointer to previous version without data loss.
3. Monitoring/logs show publish failures and public payload errors.
4. Artifact cleanup policy (10 versions kept) verified.
5. Cache headers correctly configured for all asset types.

## Verification Commands
1. `pnpm --filter @cio/utils build`
2. `pnpm --filter @cio/db build`
3. `pnpm --filter @cio/api build`
4. `pnpm --filter @cio/widgets build`
5. `pnpm --filter @cio/dashboard build`
6. Run widget API and package tests (unit/integration).

## Suggested First Sprint Slice
1. CW-A1 to CW-A4 (DB + validation foundation)
2. CW-B1 to CW-B6 (API services + routes + payload compute)
3. CW-C1 + CW-C6 (widgets package scaffold + payload contract)
4. CW-D3 + CW-D8 + CW-D9 (widgets list + preview pipeline + manual save skeleton)

This slice creates the core contracts and route surface so editor/publish can iterate quickly afterward.

### Definition of Ready per Ticket
Each ticket must include:
- Data flow diagram (if applicable)
- Interface/type definitions
- Error scenarios and handling
- Test plan (unit + integration)

### Definition of Done per Phase
- All builds pass (`pnpm --filter @cio/* build`)
- Bundle size check passes (Phase C+)
- Security review passed (Phase B+)
- Accessibility smoke test passed (Phase D+)
