---
name: Public API with Organization-Scoped Automation Keys
overview: Build the public API on top of the shipped organization automation foundation: the `/org/[slug]/automation` section already exists, MCP is live, `/automation/api` and `/automation/zapier` exist as placeholder pages, and org-scoped automation keys already exist in the backend. This PRD updates the remaining work to ship the actual public API experience and docs.
todos:
  - id: confirm-existing-foundation
    content: Confirm and preserve the shipped automation foundation (`Automation` nav, `/org/[slug]/automation` redirect, MCP page, organization automation key backend)
    status: completed
  - id: org-automation-foundation
    content: Keep using `organization_api_key` and `/organization/automation/*` as the shared automation-key foundation for MCP, API, and Zapier
    status: completed
  - id: mcp-page-reference
    content: Use the existing MCP implementation as the structural reference for the API page (route shell, server load, feature API class, feature page component, translations)
    status: completed
  - id: agents-guidance
    content: Ensure all implementation in this initiative follows `AGENTS.md`
    status: completed
  - id: api-tab-page
    content: Replace the placeholder `/org/[slug]/automation/api` page with a real API page that follows the MCP page pattern
    status: pending
  - id: api-tab-server-load
    content: Add `/org/[slug]/automation/api/+page.server.ts` to load API key and usage data using the existing organization automation endpoints
    status: pending
  - id: api-tab-copy
    content: Add API-specific translations and content for docs links, usage messaging, and key management states
    status: pending
  - id: v1-validation-schemas
    content: Add public API input/output validation schemas on top of the existing automation-key schemas
    status: pending
  - id: v1-services
    content: Create versioned public API services for courses and audience/students
    status: pending
  - id: v1-routes
    content: Create and register `/v1` public API routes authenticated by organization automation keys
    status: pending
  - id: public-api-scopes
    content: Finalize the public API scope model and middleware requirements for `api` and `zapier` automation keys
    status: pending
  - id: tests
    content: Add API tests for automation auth, `/v1` routes, and contract coverage
    status: pending
  - id: openapi-contracts
    content: Ensure all public API routes are represented in generated OpenAPI output
    status: pending
  - id: openapi-publish
    content: Regenerate and upload the latest OpenAPI spec via `upload-openapi-spec.ts`
    status: pending
  - id: docs-openapi-integration
    content: Add the public API docs experience in `apps/docs`
    status: pending
  - id: build-verify
    content: Build and verify API and docs packages after implementation
    status: pending
isProject: false
---

# Public API with Organization-Scoped Automation Keys

## Goal

Ship a versioned public API on top of the existing organization automation platform. The current codebase already supports shared org-scoped automation keys and a dedicated Automation section in `/org`; this PRD now focuses on the remaining API product work rather than re-specifying the already-shipped foundation.

## Implementation Guardrails

- All implementation in this initiative must follow [AGENTS.md](../../AGENTS.md).
- Do not design this as a brand-new standalone automation surface. Follow the existing patterns already used by the MCP implementation.
- For dashboard work, the API page must mirror the MCP structure:
  - route shell under `apps/dashboard/src/routes/org/[slug]/automation/*`
  - server-side data loading in `+page.server.ts`
  - state and mutations in `apps/dashboard/src/lib/features/automation/api/automation.svelte.ts`
  - request/response types in `apps/dashboard/src/lib/features/automation/utils/types.ts`
  - page composition in `apps/dashboard/src/lib/features/automation/pages/api.svelte`
- Do not define new dashboard types inside `.svelte.ts` files. Keep feature types in `utils/types.ts` and infer them from the API client.
- Keep user-facing copy in `apps/dashboard/src/lib/utils/translations/en.json`.

## Current State Confirmed in Code

### Org navigation and routes

These pieces already exist and should be treated as the current baseline:

- `apps/dashboard/src/lib/features/ui/navigation/org-navigation.ts`
  - contains an admin-only `Automation` section under `/org/[slug]/automation`
  - exposes nested entries for `MCP`, `Zapier`, and `API`
- `apps/dashboard/src/routes/org/[slug]/automation/+page.ts`
  - redirects `/org/[slug]/automation` to `/org/[slug]/automation/mcp`
- `apps/dashboard/src/routes/org/[slug]/automation/mcp/+page.svelte`
  - shipped MCP route shell using `Page.Root`, `Page.Header`, and `Page.Body`
- `apps/dashboard/src/routes/org/[slug]/automation/mcp/+page.server.ts`
  - already loads automation keys and usage for `type=mcp`
- `apps/dashboard/src/routes/org/[slug]/automation/api/+page.svelte`
  - already exists, but is currently a placeholder
- `apps/dashboard/src/routes/org/[slug]/automation/zapier/+page.svelte`
  - already exists, but is currently a placeholder

### Frontend automation feature foundation

These pieces already exist and should be reused:

- `apps/dashboard/src/lib/features/automation/api/automation.svelte.ts`
  - shared automation API class for list/create/revoke/rotate
- `apps/dashboard/src/lib/features/automation/utils/types.ts`
  - shared request and response inference types
- `apps/dashboard/src/lib/features/automation/pages/mcp.svelte`
  - the current reference implementation for page structure and composition
- `apps/dashboard/src/lib/features/automation/pages/api.svelte`
  - currently renders only a coming-soon callout
- `apps/dashboard/src/lib/utils/translations/en.json`
  - already contains automation navigation and MCP copy

### Backend automation-key foundation

This work is already implemented and should not be re-invented as a separate `/api-key` system:

- `packages/db/src/schema.ts`
  - already defines `organization_api_key`
  - already defines `organization_automation_usage`
- `packages/utils/src/validation/organization/automation-key.ts`
  - already defines key types: `mcp`, `api`, `zapier`
  - already defines scopes, query params, creation payload, and param validation
- `packages/db/src/queries/organization/automation-key.ts`
  - already handles persistence for organization automation keys
- `apps/api/src/services/organization/automation-key.ts`
  - already handles secret generation, hashing, creation, revoke, rotate, and auth
- `apps/api/src/routes/organization/automation.ts`
  - already exposes:
    - `GET /organization/automation/usage`
    - `GET /organization/automation/keys`
    - `POST /organization/automation/keys`
    - `DELETE /organization/automation/keys/:keyId`
    - `POST /organization/automation/keys/:keyId/rotate`

### Important correction to the old PRD

The old PRD assumed:

- a brand-new Automation page still needed to be created
- Automation should be one page with internal tabs
- a standalone `/api-key` backend should be introduced
- `Webhooks` was one of the primary tabs

That is no longer accurate.

The current product structure is:

- org navigation owns the Automation section
- Automation is split into nested routes: `mcp`, `zapier`, and `api`
- the shared backend lives under `/organization/automation/*`
- MCP is the shipped reference page
- `api` and `zapier` are present as placeholder pages

## Existing Foundation to Build On

### 1. Shared Automation Keys

The public API must reuse the existing organization-scoped automation-key model.

Current model:

- table: `organization_api_key`
- key types: `mcp`, `api`, `zapier`
- key prefixes: generated from the actual secret prefix
- auth: bearer token via the existing automation-key service/middleware path
- rotation and revocation: already implemented
- usage tracking: already implemented in `organization_automation_usage`

Design requirement:

- do not introduce a second key table or a second dashboard key-management surface
- do not reintroduce the older `/api-key` route design from the original PRD
- build the public API on the existing `organization/automation` contracts unless there is a deliberate migration plan

### 2. Dashboard Information Architecture

The Automation product is already organized as nested org routes, not a tabbed single-page shell.

Required route structure:

- `/org/[slug]/automation`
  - redirect only
- `/org/[slug]/automation/mcp`
  - existing reference implementation
- `/org/[slug]/automation/api`
  - target page for public API setup and management
- `/org/[slug]/automation/zapier`
  - separate placeholder or future implementation

Design requirement:

- keep the org sidebar/navigation pattern unchanged
- do not replace nested routes with a new internal tabs container for top-level Automation navigation
- if tabs are used inside a page, use them only for local subcontent, the way MCP uses setup tabs for client snippets

## Remaining Product Scope

### 3. API Page in Dashboard

The next dashboard milestone is to replace the placeholder API page with a real implementation.

### Target route files

- `apps/dashboard/src/routes/org/[slug]/automation/api/+page.svelte`
- `apps/dashboard/src/routes/org/[slug]/automation/api/+page.server.ts`
- `apps/dashboard/src/lib/features/automation/pages/api.svelte`
- `apps/dashboard/src/lib/features/automation/api/automation.svelte.ts`
- `apps/dashboard/src/lib/features/automation/utils/types.ts`
- `apps/dashboard/src/lib/utils/translations/en.json`

### Required structure

The API page must follow the same structural pattern already used by MCP:

1. Route shell:
   - use `Page.Root`, `Page.Header`, `Page.HeaderContent`, `Page.Title`, and `Page.Body`
   - set the page title from `automation.tabs.api`
   - use an API-specific subtitle, not the generic coming-soon copy

2. Server load:
   - add `+page.server.ts`
   - load key data with `classroomio.organization.automation.keys.$get({ query: { type: 'api' } })`
   - load usage data with `classroomio.organization.automation.usage.$get({ query: { type: 'api' } })`
   - hydrate the shared `automationApi` store the same way MCP currently does

3. Feature page:
   - keep composition in `apps/dashboard/src/lib/features/automation/pages/api.svelte`
   - mirror the MCP page layout style and sectioning
   - do not leave this page as a single callout

### Required API page sections

The real API page should include the following, using the MCP page as the UX baseline:

- admin permission callout for non-admin users
- usage cards or equivalent summary block for API-specific limits
- API key table filtered to `type === 'api'`
- create key flow
- rotate key flow
- revoke key flow
- one-time secret reveal after creation or rotation
- docs/discovery section with a link to the public API documentation
- API-specific setup guidance

### Reuse requirements

- reuse `automationApi` instead of introducing a separate API-only dashboard client
- reuse shared automation types in `utils/types.ts`
- add new helper utilities only if the API page needs API-specific setup snippets or docs helpers

### 4. Public API Routes

The actual public API is still pending.

### Router structure

Create:

- `apps/api/src/routes/v1/index.ts`
- `apps/api/src/routes/v1/courses.ts`
- `apps/api/src/routes/v1/audience.ts`

Register in `apps/api/src/app.ts` as:

```typescript
.route('/public-api/v1', v1Router)
```

### Authentication model

All `/public-api/v1` routes must authenticate with organization automation keys.

Requirements:

- use the existing automation-key authentication path
- require `type: 'api'` or an equivalent scope model that intentionally permits public API access
- document and enforce scopes clearly
- do not rely on session auth for `/public-api/v1`

### Planned endpoint groups

Initial public API surface:

| Method | Path | Description |
| ------ | ---- | ----------- |
| GET | `/public-api/v1/courses` | List organization courses |
| POST | `/public-api/v1/courses` | Create a course |
| GET | `/public-api/v1/courses/:courseId` | Get course details |
| PUT | `/public-api/v1/courses/:courseId` | Update a course |
| DELETE | `/public-api/v1/courses/:courseId` | Soft-delete a course |
| GET | `/public-api/v1/courses/:courseId/export` | Export course content as JSON |
| GET | `/public-api/v1/courses/:courseId/students` | List enrolled students |
| GET | `/public-api/v1/audience` | List organization audience members |
| POST | `/public-api/v1/audience` | Add a student to the organization |
| POST | `/public-api/v1/audience/assign-courses` | Assign one or more audience members to one or more courses |
| GET | `/public-api/v1/audience/:studentId` | Get student details |
| PUT | `/public-api/v1/audience/:studentId` | Update student details |
| DELETE | `/public-api/v1/audience/:studentId` | Remove a student from the organization |

Enrollment decision:

- keep only the audience assignment endpoint for enrollment
- do not add a separate course-centric enrollment route such as `POST /public-api/v1/courses/:courseId/students`
- a single audience member plus a single course in `POST /public-api/v1/audience/assign-courses` covers the single-enrollment case
- multiple audience members and multiple courses in the same payload cover the bulk-assignment case

### 5. Validation and Services

Add public API schemas and services on top of the existing automation-key foundation.

Target files:

- `packages/utils/src/validation/...`
- `apps/api/src/services/v1/course.ts`
- `apps/api/src/services/v1/audience.ts`

Requirements:

- follow the route/service/validation split defined in `AGENTS.md`
- each route must return a single response type shape
- keep business logic in services, not routes
- reuse existing DB queries where possible

### 6. OpenAPI and Docs

The backend already has OpenAPI infrastructure. The remaining work is to ensure the new public API is included and discoverable.

### OpenAPI requirements

- all new `/public-api/v1/*` routes must be documented with the existing Hono OpenAPI patterns
- request params, query, body, success, and error responses must be declared
- avoid undocumented public API routes

### Spec publishing

Use the existing script:

- `apps/api/scripts/upload-openapi-spec.ts`

Required flow after API changes:

1. Implement or update routes and schemas.
2. Run `pnpm --filter @cio/api upload:openapi`.
3. Verify the latest spec includes the new routes.

### Docs integration

Add the public API docs experience in `apps/docs`.

Target tasks:

1. Add the API docs page or route.
2. Wire it to the published OpenAPI source.
3. Add docs navigation for API.
4. Verify the docs build still passes.

### 7. Testing

Add tests for:

- organization automation key auth behavior relevant to public API access
- `/v1/courses`
- `/v1/audience`
- OpenAPI contract inclusion for public API routes

Use Hono app-level testing where possible.

### 8. Build and Verification

Required verification commands after implementation:

1. `pnpm --filter @cio/api build`
2. `pnpm --filter @cio/api upload:openapi`
3. `pnpm --filter @cio/docs build`

Manual verification:

1. `/org/[slug]/automation` still redirects to `/org/[slug]/automation/mcp`
2. `/org/[slug]/automation/api` now renders the real API page rather than the placeholder
3. API key creation, rotation, and revoke flows work for `type=api`
4. `/public-api/v1/*` routes respond under the new base path
5. docs navigation exposes the public API docs entry
