---
name: public-api-review
description: >-
  Design and review ClassroomIO public APIs for security, authorization, API contract
  quality, MCP/API-key behavior, and dashboard feature parity. Use when adding
  or reviewing API routes, public APIs, automation endpoints, or MCP tools.
---

# API Contract Review

Apply this skill when designing, implementing, or reviewing a public API, automation endpoint, or MCP tool. It is specifically for externally reachable contracts and their trust boundaries; do not use it as a replacement for the repository's internal route, service, query, or separation-of-concerns guidance.

## Start with the product contract

- Identify the equivalent dashboard workflow and its supported roles, states, defaults, and business rules.
- List the domain operations external clients need. Check the full resource lifecycle, state-changing actions, bulk operations, exports/files, search/filtering, reporting/history, notifications/webhooks, and administrative/audit operations as applicable.
- Treat each dashboard capability as one of these categories and decide whether it belongs in the API, is intentionally UI-only, or is out of scope.
- Treat previewing and interactive rendering as UI concerns unless the API must produce an artifact. Expose the data, export/download, reporting, or history operation clients need instead.
- Do not claim complete dashboard parity if a meaningful dashboard workflow is missing. Name intentional UI-only or out-of-scope capabilities in the public docs and PR description.
- Follow established repository conventions when extending an existing API. Do not flag a method only because it differs from a generic REST preference.
- Document included capabilities and intentional parity gaps in the PR and API docs.

## Establish the actor and authorization model

- Derive the actor from the authenticated session or API-key owner. Never accept a caller-supplied member/user ID to impersonate another person.
- Model self-actions from that actor context. For example, a reaction endpoint should accept a reaction/unreaction action and update only the authenticated actor's reaction; it should not accept a list of member IDs that lets one caller write other people's reactions.
- Check both resource organization ownership and the actor's role/access to that resource.
- Match read and write permissions to the dashboard, but enforce them independently in the API.
- Test organization admins, course team members, course members, unauthorized actors, cross-organization IDs, and API-key creators whose permissions later change.
- For every new API-key or MCP scope, audit all existing endpoints reachable through that scope before widening it.

## Design the endpoint contract

- Use `GET` for reads and `POST` for creation/actions. Prefer `PATCH` for new partial-update APIs and `PUT` for replacement semantics, but preserve an established repository convention when extending an existing API.
- If `PUT` retains omitted fields, explicitly document that it is an idempotent merge update, including how `null`, empty objects, and empty strings clear values. Keep the behavior consistent with existing clients.
- Keep one predictable response shape per endpoint and use the repository's standard success, error, and pagination structures.
- Decide whether responses contain stored values or effective/defaulted values. Prefer normalized effective values when clients must reproduce dashboard behavior.
- Every success response declares the exact shape of `data`, for single items, list items, and mutation results alike. A bare `{ type: "object" }` is not allowed: generated clients cannot discover fields or validate responses from it.
- Make sensitive list fields intentional and return only the personal data consumers need.
- Document idempotency, concurrency behavior, pagination limits, filtering, sorting, and error responses in OpenAPI and client docs.

## Validate at the public API boundary

- Define public request and response schemas independently from internal dashboard schemas. Reuse only deliberately shared primitives.
- Validate the format promised by the contract: dates, URLs, UUIDs, emails, enums, numeric ranges, and cross-resource relationships.
- Do not use `z.string().min(1)` for values with a stricter format contract.
- Validate related identifiers belong to the same organization/course and preserve existing business invariants.
- Add contract tests so internal schema changes cannot silently change the public API.

## Enforce product entitlements server-side

- Treat dashboard plan checks as product rules, not security. Re-enforce every plan-gated capability at the API/service boundary for every relevant write path.
- A guard on a later operation is insufficient: for example, blocking issuance does not protect a certificate-settings update. Check the entitlement before configuration, mutation, issuance, export, and other gated operations as applicable.
- Use one shared entitlement/plan guard and consistent error semantics across dashboard, public API, and MCP paths. Do not rely only on hiding a dashboard control or on checking the plan when an API key is created.
- Test allowed and disallowed plans, existing keys after plan changes, and every route that can create or mutate the gated resource.

## Check security and operational failure modes

- Prevent IDOR/BOLA by checking organization and actor access for every resource operation.
- Do not trust organization IDs, roles, member IDs, or permissions supplied by the caller.
- Rate-limit expensive and mutating operations.
- Make rate-limit enforcement reliable and fail closed when the limiter cannot make a decision. Never silently bypass rate limits, audit events, or another security control.
- Use transactions or row locking for read-modify-write updates that can lose fields under concurrency.
- Protect exports/downloads with authorization and expiring access where appropriate.
- Add audit events for administrative mutations and manual issuance.

## MCP and automation checks

Apply this section when the public API is exposed through MCP or automation keys.

- Mark read tools read-only and mutations as write/destructive tools.
- Ensure the default key flow grants the scopes required by new tools, or clearly document the required setup and dependency.
- Enforce permissions in the API, not only in tool metadata.
- Ensure tool rate limits are enforced for every invocation and remain safe when the limiter or its backing store is unavailable.
- Keep MCP tool names, API paths, scopes, and documentation consistent.
- Do not ship a tool that returns 403 for normally-created keys unless that is an intentional, documented rollout dependency.
- Prefer narrow, domain-specific scopes over `public_api:*`. Before granting a scope, review every existing route it unlocks for actor authorization and dashboard parity.
- Scope migrations must preserve least privilege: only backfill keys matching the intended prior default scope set, do not widen custom-scope keys, remove obsolete broad scopes when required, and coordinate migrations with the documented merge order and journal.
- Treat new MCP tools and public contract changes as release-managed package changes. Bump and publish the MCP package when consumers need the new tool surface; do not assume source changes are available to already-installed clients.

## Keep the public API navigable

- Group route and service modules by domain under the versioned API tree (`routes/v1/{domain}/` and `services/v1/{domain}/`). Keep the version root responsible for mounting aggregate routers.
- Prefer concise domain filenames inside those folders over a flat `v1/` directory filled with repeated prefixes. This is part of the public API's maintainability and discoverability, not an internal-only concern.

## Structure the API docs sidebar

The docs site (`apps/docs`) renders the public API reference sidebar from the OpenAPI tags. Follow this structure when adding or re-tagging endpoints:

- **One tag per sub-resource concept, one section per resource family.** A section (`Organization`, `Courses`, `Cohorts`, `Analytics`) is a non-collapsible header; each tag under it is a collapsible group, except the family's core CRUD routes, which render as flat items directly beneath the section header. Never nest a collapsible group whose label equals its section label ("Courses → Courses").
- **Tags keep full names; display labels drop the family prefix.** OpenAPI tags must be unique across the spec, so tags stay `Course Members`, `Cohort Goals`, etc., while the sidebar shows `Members`, `Goals` — the section header provides the context. Cross-reference `apps/docs/blume.config.ts` (`API_SECTIONS`) where each tag maps to its display label.
- **Don't strand operations.** Every endpoint must live in a tag listed in `API_SECTIONS`; the config warns on unplaced tags at build time. Fold single-op tags (e.g. the gradebook read) into their nearest coherent group, and split any tag exceeding ~10 operations by sub-concept (e.g. exercise questions, exercise sections, newsfeed comments).
- **Where tag changes land (all or nothing):** per-route `tags:`/`TAG` constants in `apps/api/src/routes/v1/**`, the tag registry in `packages/utils/src/openapi/public-api.ts` (`OPERATION_TAGS`), operation summaries (`OPERATION_SUMMARIES`), tag assertions in `apps/api/src/__tests__/routes-v1-*` and `routes/v1/index.test.ts`, and the sidebar layout in `apps/docs/blume.config.ts`. The docs build fetches the published OpenAPI spec from R2 (`scripts/fetch-openapi.mjs`); `enrichPublicApiOpenApiSpec` adds shared tag metadata locally but does not change operation-level tags, so route-level tag changes require regenerating the published spec (`pnpm --filter @cio/api run upload:openapi`) before the docs build picks them up.
- **Every PR that adds or re-tags public API endpoints includes the resulting sidebar structure breakdown in its description** — the full section → group → operation tree with HTTP methods, so reviewers can evaluate the docs IA without building the site or opening the app. New endpoints must be placed in the tree before merge, not left for an unplaced-tag warning.
- **Sidebar styling** (badge placement, wrapping, section typography) lives in `apps/docs/theme.css`, scoped to `[data-blume-nav-tree]`. Method badges lead the row, labels wrap instead of truncating, and section headers are small uppercase muted labels — do not regress to badge-after-label or truncated rows.

## Required tests

- Happy-path reads, writes, exports, actions, listing, filtering, and pagination.
- Authentication, organization isolation, and role matrix tests.
- API-key scope and creator-permission-change tests.
- Invalid format, omitted field, `null`, empty payload, and cross-resource validation tests.
- Idempotency and concurrent update tests.
- Rate-limit, limiter-failure, and audit-failure tests.
- OpenAPI/public contract tests and MCP tool tests where applicable.

## PR checklist

- [ ] Dashboard reference workflow and parity boundary are documented.
- [ ] Actor identity and authorization matrix are documented.
- [ ] Self-actions are actor-derived; no payload can impersonate another member.
- [ ] Every plan-gated API/MCP operation has a server-side entitlement guard, including configuration writes and exports—not only downstream execution.
- [ ] Required scopes are minimal, configured, and tested.
- [ ] Scope migrations do not widen custom keys and are ordered safely with the migration journal.
- [ ] Public schemas are stable and validate the documented formats.
- [ ] Every success response declares the exact shape of `data`; no bare `{ type: "object" }`.
- [ ] Defaults and partial-update semantics are documented.
- [ ] Routes and services are grouped by versioned domain folders.
- [ ] Security and failure-mode tests are included.
- [ ] Applicable resource lifecycle, actions, bulk operations, exports/files, reporting/history, notifications/webhooks, and audit operations are either supported or explicitly scoped out.
- [ ] OpenAPI, examples, and MCP documentation match the implementation.
- [ ] The docs sidebar structure follows the section/tag rules above; every tag is placed in `API_SECTIONS` and the published spec is regenerated after tag changes.
- [ ] PRs adding or re-tagging public API endpoints include the sidebar structure breakdown in the description.
