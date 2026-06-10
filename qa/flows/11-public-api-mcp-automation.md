# Flow 11 — Public API, MCP & automation keys

- **Personas:** Admin (issues keys); integrator (calls API)
- **Features covered (FEATURE_AUDIT §2):** 27 Public REST API (v1) · 28 Automation / API keys · 29 MCP server · 40 Outbound webhooks (⚠️ verify NOT shipped)
- **Modes:** both
- **Map refs:** FEATURE_AUDIT §3.22, §3.23, §7.1, §6D

## Preconditions
- Admin with a published course. A REST client (curl/Postman). Node for the MCP client.

## Happy path — keys & REST API
- [ ] **Create an automation key.** Org → API keys → create with scopes (type `api`/`mcp`/`zapier`). _Ref:_ `routes/organization/automation.ts`, `organizationApiKey` `schema.ts:2539`.
- [ ] **List courses via API.** `GET /public-api/v1/courses` with the key → returns org courses. _Ref:_ `routes/v1/courses.ts`, mounted `app.ts:218`.
- [ ] **Create/update/delete course via API.** Exercise write endpoints → reflected in dashboard. _Ref:_ `routes/v1/courses.ts`.
- [ ] **List students / export.** Audience endpoints return data. _Ref:_ `routes/v1/audience.ts`.
- [ ] **Get/put course structure.** Structure endpoints round-trip.
- [ ] **OpenAPI docs.** `/docs` renders the documented spec. _Ref:_ `hono-openapi`.

## Happy path — scopes & usage
- [ ] **Scope enforcement.** Call an endpoint without its scope → `403`. _Ref:_ `automationKeyScopesMiddleware`, `v1/courses.ts:47`.
- [ ] **Usage tracked.** Calls recorded with category `read|write|publish`. _Ref:_ `organizationAutomationUsage` `schema.ts:2574`, enum `schema.ts:32`.
- [ ] **Per-org isolation.** Key only sees its own org's data.

## Happy path — MCP
- [ ] **Configure MCP client** with an automation key → tools list. _Ref:_ `packages/mcp/src/*`.
- [ ] **Create/update a course via MCP** → reflected in dashboard. _Ref:_ `packages/mcp/src/tools/`.

## Edge cases / probes
- [ ] **Revoked/invalid key** → 401/403.
- [ ] **Expired/over-quota key** behavior.
- [ ] **⚠️ Outbound webhooks NOT shipped:** README advertises `certificate.issued` / `enrollment.completed` webhooks, but only inbound Polar exists. Confirm there is **no** outbound webhook config/delivery. Record result. _Ref:_ audit §7.1.

**Coverage:** features 27, 28, 29, 40(verify-absent).
