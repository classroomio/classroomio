---
name: api-contract-review
description: >-
  Design and review ClassroomIO APIs for security, authorization, API contract
  quality, MCP/API-key behavior, and dashboard feature parity. Use when adding
  or reviewing API routes, public APIs, automation endpoints, or MCP tools.
---

# API Contract Review

Apply this skill when designing, implementing, or reviewing an API route, public API, automation endpoint, or MCP tool.

## Start with the product contract

- Identify the equivalent dashboard workflow and its supported roles, states, defaults, and business rules.
- List the domain operations external clients need. Check the full resource lifecycle, state-changing actions, bulk operations, exports/files, search/filtering, reporting/history, notifications/webhooks, and administrative/audit operations as applicable.
- Treat each dashboard capability as one of these categories and decide whether it belongs in the API, is intentionally UI-only, or is out of scope.
- Treat previewing and rendering as UI concerns unless the API must produce an artifact. Expose the data or export operation clients need instead.
- Document included capabilities and intentional parity gaps in the PR and API docs.

## Establish the actor and authorization model

- Derive the actor from the authenticated session or API-key owner. Never accept a caller-supplied member/user ID to impersonate another person.
- Check both resource organization ownership and the actor's role/access to that resource.
- Match read and write permissions to the dashboard, but enforce them independently in the API.
- Test organization admins, course team members, course members, unauthorized actors, cross-organization IDs, and API-key creators whose permissions later change.
- For every new API-key or MCP scope, audit all existing endpoints reachable through that scope before widening it.

## Design the endpoint contract

- Use `GET` for reads, `POST` for creation/actions, `PATCH` for partial updates, and `PUT` for replacement semantics.
- If omitted fields are retained, use `PATCH` or explicitly document the idempotent merge behavior, including how `null`, empty objects, and empty strings clear values.
- Keep one predictable response shape per endpoint and use the repository's standard success, error, and pagination structures.
- Decide whether responses contain stored values or effective/defaulted values. Prefer normalized effective values when clients must reproduce dashboard behavior.
- Make sensitive list fields intentional and return only the personal data consumers need.
- Document idempotency, concurrency behavior, pagination limits, filtering, sorting, and error responses in OpenAPI and client docs.

## Validate at the public boundary

- Define public request and response schemas independently from internal dashboard schemas. Reuse only deliberately shared primitives.
- Validate the format promised by the contract: dates, URLs, UUIDs, emails, enums, numeric ranges, and cross-resource relationships.
- Do not use `z.string().min(1)` for values with a stricter format contract.
- Validate related identifiers belong to the same organization/course and preserve existing business invariants.
- Add contract tests so internal schema changes cannot silently change the public API.

## Check security and operational failure modes

- Prevent IDOR/BOLA by checking organization and actor access for every resource operation.
- Do not trust organization IDs, roles, member IDs, or permissions supplied by the caller.
- Rate-limit expensive and mutating operations.
- Make quota/usage enforcement atomic or fail closed. Never silently continue when recording usage, audit events, or another security control fails.
- Use transactions or row locking for read-modify-write updates that can lose fields under concurrency.
- Protect exports/downloads with authorization and expiring access where appropriate.
- Add audit events for administrative mutations and manual issuance.

## MCP and automation checks

- Mark read tools read-only and mutations as write/destructive tools.
- Ensure the default key flow grants the scopes required by new tools, or clearly document the required setup and dependency.
- Enforce permissions in the API, not only in tool metadata.
- Ensure tool usage limits are enforced for every invocation and remain safe when usage storage is unavailable.
- Keep MCP tool names, API paths, scopes, and documentation consistent.
- Do not ship a tool that returns 403 for normally-created keys unless that is an intentional, documented rollout dependency.

## Required tests

- Happy-path reads, writes, exports, actions, listing, filtering, and pagination.
- Authentication, organization isolation, and role matrix tests.
- API-key scope and creator-permission-change tests.
- Invalid format, omitted field, `null`, empty payload, and cross-resource validation tests.
- Idempotency and concurrent update tests.
- Rate-limit, quota, usage-recording failure, and audit failure tests.
- OpenAPI/public contract tests and MCP tool tests where applicable.

## PR checklist

- [ ] Dashboard reference workflow and parity boundary are documented.
- [ ] Actor identity and authorization matrix are documented.
- [ ] Required scopes are minimal, configured, and tested.
- [ ] Public schemas are stable and validate the documented formats.
- [ ] Defaults and partial-update semantics are documented.
- [ ] Security and failure-mode tests are included.
- [ ] Resource lifecycle, actions, bulk operations, exports/files, reporting/history, notifications/webhooks, and audit operations are either supported or explicitly scoped out as applicable.
- [ ] OpenAPI, examples, and MCP documentation match the implementation.
