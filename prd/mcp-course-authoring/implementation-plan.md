# MCP Course Authoring from Structured Payloads Implementation Plan

## Scope Lock (v1)

1. The MCP server is a thin API adapter, not a persistence layer.
2. Draft review is mandatory before publish.
3. External agents submit normalized course payloads.
4. ClassroomIO does not parse PDFs or source material in v1.
5. Publish uses existing ClassroomIO services for course, section, lesson, and lesson language creation.
6. Authentication is org-scoped and must reject cross-org mutations.

## Delivery Phases

1. Phase A: Payload schema, validation, and draft persistence
2. Phase B: Draft create/get/update API
3. Phase C: Draft publish orchestration
4. Phase D: MCP server and tool contracts
5. Phase E: Observability, auth hardening, and idempotency

## Ticket Breakdown

| ID | Area | Task | Key Files | Dependencies | Done When |
| --- | --- | --- | --- | --- | --- |
| MCP-A1 | Validation | Add structured course payload validation module | `packages/utils/src/validation/course-import/course-import.ts` | None | Schemas exported and built |
| MCP-A2 | DB | Add draft persistence table | `packages/db/src/schema.ts` | None | Draft schema updated |
| MCP-A3 | DB | Add draft query module | `packages/db/src/queries/course-import/course-import.ts` | MCP-A2 | CRUD/query helpers exist |
| MCP-A4 | API | Add draft route skeleton | `apps/api/src/routes/organization/course-import.ts` | MCP-A1 | Route group registered |
| MCP-B1 | API | Implement draft create service | `apps/api/src/services/course-import/course-import.ts` | MCP-A4 | Structured payload creates draft |
| MCP-B2 | API | Implement draft fetch/update endpoints | `apps/api/src/routes/organization/course-import.ts` | MCP-B1 | Draft can be reviewed and edited |
| MCP-C1 | API | Implement draft publish service | `apps/api/src/services/course-import/course-import.ts` | MCP-B2 | Draft creates course, sections, lessons, languages |
| MCP-C2 | API | Add idempotent publish behavior | `apps/api/src/services/course-import/course-import.ts` | MCP-C1 | Retries do not duplicate courses |
| MCP-D1 | MCP | Scaffold MCP package | `apps/mcp/` or `packages/mcp/` | MCP-B2 | Stdio server runs locally |
| MCP-D2 | MCP | Add `create_course_draft` tool | MCP server tool files | MCP-D1, MCP-B1 | Claude can create drafts |
| MCP-D3 | MCP | Add `get_course_draft` and `update_course_draft` tools | MCP server tool files | MCP-B2 | Claude can inspect and revise drafts |
| MCP-D4 | MCP | Add `publish_course_draft` tool | MCP server tool files | MCP-C2 | Claude can publish reviewed drafts |
| MCP-E1 | Security | Enforce org-scoped auth and rate limits | middleware + routes | MCP-A4 | Unauthorized access returns 401/403 |
| MCP-E2 | Observability | Add structured logging and audit trail | services + middleware | MCP-C1 | Draft and publish actions are traceable |
| MCP-E3 | Docs | Document setup and consumption contract | `prd/mcp-course-authoring/` and docs follow-up | MCP-D4 | Operator docs exist |

## Suggested First Sprint Slice

1. Draft schema and table
2. Draft create endpoint
3. Draft get/update endpoint
4. Draft publish endpoint
5. Minimal MCP server with:
   - `create_course_draft`
   - `get_course_draft`
   - `publish_course_draft`

## Build and Verification Commands

1. `pnpm --filter @cio/utils build`
2. `pnpm --filter @cio/db build`
3. `pnpm --filter @cio/api build`
4. Build the MCP package/app once created
