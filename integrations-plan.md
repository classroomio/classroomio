# Insights Analytics: Public API and MCP — Implementation Plan

**Status:** Ready to implement.

## 0. Read this first

**What this covers.** Everything left of the Insights Analytics feature after the engine ([classroomio/classroomio#1444](https://github.com/classroomio/classroomio/pull/1444)) and the dashboards ([classroomio/classroomio#1445](https://github.com/classroomio/classroomio/pull/1445)):

1. the public REST API (`/public-api/v1`)
2. MCP tools (remote server and the `@classroomio/mcp` package)

The PRD lists exposing insights through the public API and MCP under Phase 3. This plan covers only that item, because it was asked for; the assistant and the PRD's other Phase 2 and Phase 3 items are out of scope.

**Sources, in order of authority:**
- this plan
- `prd/insights-analytics/README.md` on `origin/docs/insights-analytics-prd` ([classroomio/classroomio#1300](https://github.com/classroomio/classroomio/pull/1300)), section Architecture (item 6) and the public API and MCP item in Phase 3
- the engine as built on `feat/insights-analytics-core`; where the PRD and the code disagree, the code wins and this plan says so

**Rules that apply to every step:**
- `AGENTS.md` / `CLAUDE.md`: layering (validation → queries → services → routes), one response type per route, types only in `utils/types.ts`, translations, chart SSR imports, `testId`, one migration per PR.
- `skills/writing-code/SKILL.md`: no explanatory comments; JSDoc only for contracts.
- `skills/public-api-review/SKILL.md`: the contract, authorization, scope, MCP and docs-sidebar rules. Every v1 and MCP item below is written to satisfy its PR checklist.
- `skills/stage-and-commit/SKILL.md`: including the sub-agent docs fact-check on every commit.
- Node **24.22.1** (`.nvmrc`). `skills/ship-feature/SKILL.md` still says Node 20; that line is stale.
- Do not run the dashboard Vite build locally. Use `pnpm dlx svelte-check@4` against the current error baseline plus vitest; CI runs the build.

**Worktree.** `/Users/user/Documents/ClassroomIO/Dev/Codebases/classroomio-insights-api`, branch `feat/insights-analytics-api`, cut from `origin/feat/insights-analytics-dashboard` with no upstream set. Push with `git push -u origin feat/insights-analytics-api` so it never lands on the dashboard or core branch by mistake.

## 1. Where things stand (2026-11-05)

| Item | State |
| --- | --- |
| Engine, `/insights` routes, presets, help docs | [classroomio/classroomio#1444](https://github.com/classroomio/classroomio/pull/1444), base `main`, open |
| Dashboards (cohort, course, org) | [classroomio/classroomio#1445](https://github.com/classroomio/classroomio/pull/1445), base `feat/insights-analytics-core`, open. It changes no file under `apps/api`, `packages/db`, `packages/utils` or `packages/core` |
| Public API, MCP | Nothing exists. No v1 route, MCP tool, scope map or metering entry mentions insights |
| Existing v1 analytics | `GET /analytics`, `/analytics/compliance/learners`, `/analytics/learners/{profileId}`, `/courses/{courseId}/analytics`, `/courses/{courseId}/analytics/students`, built on the pre-insights services (`getCourseAnalytics`, `getUserAnalytics`, `getOrganisationAnalytics`), with MCP mirrors in `packages/mcp/src/tools/analytics.ts` |

### 1.1 Blocker on #1444 (fix before anything here merges)

`main` now has `0046_index_cleanup` (`when` 1793782571227). The core branch has `0046_insights_performance_indexes` (`when` 1793630964657). Same index, and core's stamp is lower than main's, so on every existing database Drizzle would skip the insights indexes silently (see "Database migrations" in `AGENTS.md`).

Fix on `feat/insights-analytics-core`:
1. Merge `origin/main` into the branch.
2. Rename the file to `0047_insights_performance_indexes.sql`, set its journal `idx` to 47, and restamp `when` to `int(time.time() * 1000)`.
3. Run both journal checks from `AGENTS.md`; the branch value must be greater.
4. Rebase `feat/insights-analytics-dashboard` and this branch on the result.

Main's cleanup drops `idx_analytics_login_events_user_id`. Insights is unaffected: the `analytics_login_events_user_id_date_unique` constraint on `(user_id, logged_in_date)` covers lookups by user.

### 1.2 Engine follow-ups worth folding into #1444 (not blockers)

- `POST /insights/dashboards-refresh` claims the refresh slot before the service authorizes the scope (`routes/insights/index.ts`). Authorize first.
- `updateInsightsSettings` reports failures as `INSIGHTS_QUERY_FAILED`. Add `INSIGHTS_SETTINGS_FAILED`.
- `ZInsightsStudentExportRequest` and `ZUpdateInsightsSettings` have no JSON-schema snapshot in `packages/utils/tests/insights-spec.test.ts`. Add them.

## 2. Delivery

One branch and one draft PR:

| PR | Title (Conventional Commits) | Base | Migration |
| --- | --- | --- | --- |
| 1 | `feat(analytics): expose insights through the public API and MCP` | `feat/insights-analytics-dashboard` | None |

PR 1 ships the API and the MCP tools together, as [classroomio/classroomio#1193](https://github.com/classroomio/classroomio/pull/1193) did for the current v1 analytics: the tools are thin wrappers and must not ship ahead of, or behind, their routes.

## 3. Definitions every surface shares

- **Actor.** Dashboard: the session user with session `orgRoles`. Public API and MCP: `actorId` is the key or OAuth-grant creator, and `orgId` comes from the credential. v1 never sets `orgRoles`, so v1 code builds an `InsightsActor` by reading the creator's **live** org role from the database on every request. A creator who loses admin loses org scope on the next call. OAuth actors are always active org admins (enforced at consent and per request); legacy `cio_mcp_` key creators may be tutors.
- **Scope access** (unchanged from the engine's `resolveAuthorizedScope`):
  - **org:** org admin only. This is stricter than `GET /v1/analytics`, which admits tutors. Keep the dashboard rule and document the difference.
  - **cohort:** org admin, or cohort admin or tutor.
  - **course:** course admin or tutor, or org admin.
  - Errors are 404 `INSIGHTS_SCOPE_NOT_FOUND` for another org's id and 403 `INSIGHTS_SCOPE_FORBIDDEN`.
- **Effective range.** The engine silently clamps `30d`, `90d` and `all` to `7d` on the Free plan (`services/insights/plan.ts`). Every external surface reports the range actually used. Section 4.1 adds it to the result.
- **Freshness.** Results are cached per scope and spec hash for 30 seconds (cohort, course) or 60 seconds (org), shared across authorized viewers. External surfaces do not expose `refresh`; they return `generatedAt` and `cached`.
- **Personal data.** Student rows carry name, email and avatar. The public API returns them, because roster sync is a primary use.

## 4. PR 1, part A: shared groundwork

These move logic that today lives only in the dashboard client into shared, tested code, so the dashboard, the API and MCP compute the same numbers.

### 4.1 Effective range and the actor helper (`apps/api/src/services/insights/`)

- `query.ts`: `runInsightsQueryForActor` and `exportInsightsQueryForActor` return `range: TInsightsRange`, the value after `resolveInsightsRange`. Add it to `InsightsQueryResult` in `types.ts`. Update `services-insights-query.test.ts` with a Free-plan case asserting `range: '7d'` for a `30d` request.
- `actor.ts` (new): `resolveInsightsActorForCreator(orgId, profileId): Promise<InsightsActor>` builds `{ profileId, orgId, orgRoles: { [orgId]: roleId } }` from `getOrganizationMemberRoleId`. It throws 401 `UNAUTHORIZED` when the creator is no longer an org member. Export it from `index.ts`. Test it with admin, tutor, removed member, and a role change between two calls.

### 4.2 Widget resolution moves to `packages/utils`

Today `resolveWidgetSpec`, `isWidgetVisible`, `availableBreakdownGroups`, `activeBreakdownGroup`, `defaultBreakdownGroup`, `defaultCourseId`, `defaultExerciseId` and the placeholder fill live in `apps/dashboard/src/lib/features/insights/utils/insights-utils.ts` (around L200–420). The server cannot resolve a preset without them.

- Create `packages/utils/src/insights/widgets.ts` with these pure functions. They take a minimal `InsightsWidgetSelection` (`courseId`, `exerciseId`, `range`, `breakdown`, `pages`) and a minimal scope summary (`type`, `cohortCount`, `courses[{ id, isGrouped, hasPassRequired }]`), not the dashboard's types.
- Export it as `@cio/utils/insights` (add the subpath to `packages/utils/package.json` `exports`, matching existing subpaths).
- The dashboard imports from there and deletes its copies. `insights-utils.test.ts` cases for these functions move to `packages/utils/tests/insights-widgets.test.ts` unchanged, so the move is provably behavior-neutral.
- Also move the student table spec: `STUDENT_MEASURES` and the spec builder in `apps/dashboard/src/lib/features/insights/api/students.svelte.ts` become `studentsTableSpec({ search, status, isOverdue, courseId, page, limit, sort })` in the same module. The dashboard's students API calls it.

### 4.3 Catalog descriptions (`packages/utils/src/constants/insights-catalog.ts`, new)

External callers (and language models) need to know what a source or metric means. Add one-sentence English descriptions:
- `INSIGHTS_SOURCE_DESCRIPTIONS: Record<TInsightsSource, string>`
- `INSIGHTS_METRIC_DESCRIPTIONS: Record<TInsightsMetric, string>`
- `INSIGHTS_DIMENSION_DESCRIPTIONS: Record<TInsightsDimension, string>`
- `INSIGHTS_WIDGET_DESCRIPTIONS: Record<string, string>`, keyed by preset widget id

These are API documentation strings, not dashboard UI copy; the dashboard keeps using `en.json`. Tests: every source, metric, dimension and preset widget id has a non-empty description, and no description names a value that is not in the registry.

Derive each description from the metric's SQL in `packages/db/src/queries/insights/fragments.ts` and the definitions in `implementation-plan.md` section 3, not from the dashboard label.

### 4.4 Registry description (`packages/db/src/queries/insights/registry.ts`)

Add `describeInsightsRegistry(): InsightsRegistryDescription`, a pure function that returns, per source:
- the scope types it supports
- dimensions (`hasLabel`, `hasRank`)
- metrics (`valueType`, allowed aggregations)
- filters (ops, value type, allowed values)
- whether search applies

It reads the existing definitions, so the catalog can never drift from the compiler. Unit test: every compiled column for a sample spec per source appears in the description.

### 4.5 Snapshot and students services (`apps/api/src/services/insights/`)

- `snapshot.ts` (new): `getInsightsDashboardSnapshotForActor(actor, scope, selection): Promise<InsightsDashboardSnapshot>`.
  1. Authorizes once.
  2. Loads the dashboard, fills the defaults the dashboard uses (`defaultCourseId`, `defaultExerciseId`, `defaultBreakdownGroup`), and keeps widgets where `isWidgetVisible` is true.
  3. Skips the self-loading ids (`students`, `students_by_status`); those have their own endpoint.
  4. Runs each resolved spec through `runInsightsQueryForActor`, at most 4 at a time.

  The result is `{ scope, selection (effective, including range), generatedAt, widgets: [{ id, viz, description, spec, result: { columns, rows, total } | null, errorCode: string | null }] }`. A widget failure becomes `errorCode` (for example `INSIGHTS_QUERY_FAILED`) and never fails the whole snapshot. The cohort comparison widget returns every cohort's line; callers narrow it with the query endpoint.
- `students.ts` (new): `listInsightsStudentsForActor(actor, scope, query)` runs `studentsTableSpec` and maps rows to a typed `InsightsStudentRow` (camelCase: `id`, `name`, `email`, `avatarUrl`, `progressPct`, `avgScorePct`, `coursesCompleted`, `coursesTotal`, `videoPct`, `attendancePct`, `certificates`, `lastLoginAt`, `isOverdue`, `status`, `nowAt`), plus `{ page, limit, total }`.
- Tests: `services-insights-snapshot.test.ts` covering:
  - visibility per scope and selection
  - placeholder fill
  - one widget failing while the others succeed
  - the concurrency cap
  - authorization running once, before any query

  And `services-insights-students.test.ts` covering mapping, nulls, paging and filters.

## 5. PR 1, part B: public API (`/public-api/v1`)

### 5.1 Endpoints

New tag `Analytics Insights`, shown as **Insights** under the Analytics section. The existing `Analytics` tag stays flat above it.

| Method and path | Summary | Scope | Actor rule | Extra limiter (per key, `failClosed`) | MCP tool | Credits |
| --- | --- | --- | --- | --- | --- | --- |
| GET `/analytics/insights/catalog` | List insights sources, metrics and filters | `analytics:read` | org team member | none | `get_insights_catalog` | 0 |
| POST `/analytics/insights/query` | Run an insights query | `analytics:read` (explicit read mapping, 5.3) | per scope (section 3) | 60/min, key `insights_query:{keyId}` | `query_insights` | 0 |
| GET `/analytics/insights/dashboards/{scopeType}/{scopeId}` | Get an insights dashboard snapshot | `analytics:read` | per scope | 20/min, key `insights_snapshot:{keyId}` | `get_insights_dashboard` | 0 |
| GET `/analytics/insights/students` | List students with their insights | `analytics:read` | per scope | none beyond the global 100/min | `list_insights_students` | 0 |
| POST `/cohorts/{cohortId}/goals/remind-overdue` | Send overdue goal reminders now | `cohort:write` (already mapped by `COHORT_PATH`) | cohort admin or tutor, or org admin | 20/min, key `cohort_remind:{keyId}` | `remind_overdue_cohort_goals` | same as `evaluate_all_cohort_goals` |

**Why `query` is a POST.** The spec is a nested object (measures, filters with arrays, sort). Encoding it in a query string is fragile and length-bound. It stays a read: no side effects, cached, mapped to `analytics:read`, and metered as `read`. Document this in the route description and in the API guide.

**Why the old analytics endpoints stay.** Their numbers come from older definitions; changing them under existing clients is a breaking change. This PR adds the new endpoints and says, in the Analytics tag description and the guide, that the Insights endpoints match the dashboards. Deprecating the old ones is a separate, announced change.

**Parity boundary** (goes in the PR description and the guide):

| Dashboard capability | API | Notes |
| --- | --- | --- |
| Any dashboard number | `query` | Specs are the same ones the dashboard runs |
| A dashboard as a whole | `dashboards/...` snapshot | First page of every paged widget; paged widgets continue via `query` with `page` |
| Students table, filters, search, sort | `students` | |
| Student export (CSV, XLSX, PDF) | `students`, paged | No server-side file; the export file is a dashboard UI concern |
| Send reminder / remind all overdue | `remind-overdue` | Same service, same daily idempotency key, same caps |
| Refresh now | Not exposed | Freshness is documented instead |
| Student target setting | Not exposed (UI-only in v1) | Org settings write; revisit with demand |
| Charts, range picker, Now tags, course picker | UI-only | |

### 5.2 Public schemas (`packages/utils/src/validation/public-api/`)

- `insights.ts` (requests) and `insights-responses.ts` (responses, OpenAPI-only like `analytics-responses.ts`), exported from the barrel.
- Defined **independently** of `validation/insights/*`. They reuse only the deliberately shared primitives: the `INSIGHTS_*` enums and limits from `@cio/utils/constants/insights`.
- Field rules, each stated in that field's `.describe()`:
  - `scope`: `{ type: 'cohort' | 'course' | 'org', id: uuid }`.
  - `spec.source`: enum. Measures: 1–16. Dimensions: 0–2. Filters: up to 10. Sort: up to 3.
  - `limit`: 1–1000, default 25. `page`: 1–4000, default 1. `range`: `all | 7d | 30d | 90d`, default `all`.
  - Filter values: a string value starting with `$` is rejected with 400, because placeholders are dashboard-internal.
  - `in`: uuids only, at most 100.
- Snapshot query: `courseId?`, `exerciseId?` (uuids), `range?`, `breakdown?` (`courses | cohorts`).
- Students query: `scopeType`, `scopeId`, `courseId?`, `search?` (max 100), `status?` (statuses enum), `isOverdue?` (boolean), `sort?` (`status | name | progress | score | lastLogin`, default `status`), `dir?`, `page`, `limit` 1–100 default 20.
- Remind body: `{ courseId?: uuid, profileId?: uuid }`, reusing `ZRemindOverdueCohortGoals`'s rules through a public copy.
- Responses declare every field: query `data: { columns: [{ key, role, valueType }], rows: Array<Record<string, string | number | boolean | null>> }` plus `meta: { generatedAt, cached, range }` and `pagination`. No bare `{ type: 'object' }` (the data-shape test enforces this for `data`; follow it for `meta` too).
- Snapshot tests: `packages/utils/tests/public-api-insights-contract.test.ts`, covering every public request schema, so internal schema changes cannot change the public contract silently.

### 5.3 Routes, services, middleware

- `apps/api/src/routes/v1/analytics/insights.ts` (new): `v1AnalyticsInsightsRouter`. Mount it in `routes/v1/analytics/index.ts` with `.route('/insights', ...)` **before** `/`.
  - Use `describeRoute` and `validator` from `hono-openapi`, as every v1 route does (not `zValidator`).
  - Each route: `handlePublicApiError`, `Cache-Control: private, no-store` (`ANALYTICS_CACHE_CONTROL`), and responses via `itemResponse`, `itemWithMetaResponse` or `paginatedResponse`.
  - Documented statuses: 400, 401, 403 (text names both the scope and the actor rule), 404, 429 (`mcpRateLimitResponse`), and 503 where `failClosed` applies.
- `apps/api/src/routes/v1/analytics/docs.ts`: add `INSIGHTS_TAG`, `INSIGHTS_SCOPE_RULE` ("the key creator must be an org admin for org scope, a cohort admin or tutor for cohort scope, or a course admin or tutor for course scope") and the 403/404 response objects.
- Remind route: in `routes/v1/cohorts/goals.ts`, under tag `Cohort Goals`, after the existing `evaluate-all` route.
- `apps/api/src/services/v1/analytics/insights.ts` (new): each function is `(orgId, actorId, params, query)`. It calls `assertAutomationActor`, builds the actor with `resolveInsightsActorForCreator`, and calls the insights service. No business logic of its own.
  - Catalog: `assertOrgTeamMember`, then `describeInsightsRegistry()` merged with the descriptions from 4.3.
- `services/v1/cohorts/goals.ts`: `remindPublicApiOverdueCohortGoalsService` runs `assertCohortBelongsToOrganization`, then the cohort team check, then `sendOverdueCohortGoalRemindersNow`. It returns `{ enqueued, skipped, truncated }`. Add an audit row through the existing automation-usage record (the remind is a mutation that sends email).
- `apps/api/src/middlewares/public-api-scopes.ts`: in `getPublicApiRouteScope`, map exactly `POST /public-api/v1/analytics/insights/query` to `analytics:read`, before the generic analytics rule. Keep the existing test that `POST /analytics` is refused for `analytics:read`, and add tests that:
  - the query POST is allowed with `analytics:read`
  - any other analytics POST is still refused
- **Metering** (`apps/api/src/middlewares/v1-mcp-usage.ts`):
  - Add the five routes to `MCP_V1_ROUTE_TOOL_MAP`.
  - Take the category from `getMcpAutomationCategory(tool)` when the route is mapped, and fall back to the HTTP method only for unmapped routes.
  - In `packages/utils/src/plans/automation.ts`, add the four read tools to the explicit read list in `getMcpAutomationCategory` and all five to `MCP_TOOL_CREDIT_COST`.
  - Update the assertion in `v1-mcp-usage.test.ts` (around L125) from "GET means read" to "the mapped category equals `getMcpAutomationCategory(tool)`". Add a test that `query_insights` reserves a read slot.

  This is a deliberate convention change; call it out in the PR.
- **OpenAPI** (`packages/utils/src/openapi/public-api.ts`): add the five `OPERATION_SUMMARIES` entries keyed `"METHOD /public-api/v1/path/{param}"`, and the `Analytics Insights` tag in `OPERATION_TAGS` ("Query the analytics behind the cohort, course and organization dashboards.").
- **Docs sidebar** (`apps/docs/blume.config.ts` `API_SECTIONS`): the Analytics section becomes `[{ tag: 'Analytics', flat: true }, { tag: 'Analytics Insights', label: 'Insights' }]`. The remind route joins the existing `Cohort Goals` placement.

Sidebar breakdown for the PR description:

```
Analytics
├─ GET    Get organization analytics
├─ GET    List compliance status per learner
├─ GET    Get a learner's analytics
├─ GET    Get course analytics
├─ GET    List per-student course analytics
└─ Insights
   ├─ GET  List insights sources, metrics and filters
   ├─ POST Run an insights query
   ├─ GET  Get an insights dashboard snapshot
   └─ GET  List students with their insights
Cohorts
└─ Goals
   └─ POST Send overdue goal reminders now   (added to the existing group)
```

Confirm the existing course-analytics rows sit where the current spec shows them before pasting.

### 5.4 Tests (`apps/api/src/__tests__/`)

- `routes-v1-analytics-insights.test.ts`:
  - 200 for each route
  - validation 400s: placeholder value, `in` over 100, limit over max, bad uuid
  - pagination pass-through
  - the cache header
  - `meta.range` reflecting the Free-plan clamp
  - an OpenAPI assertion block (summary, tags, status keys), as `routes-v1-team-audience.test.ts` does
- `services-v1-analytics-insights.test.ts` role matrix per scope:
  - org admin, org tutor (403 on org scope), course tutor on another course (403)
  - cohort tutor, removed creator (401)
  - cross-org scope id (404)
  - a creator demoted between two calls
- `routes-v1-cohort-goals-remind.test.ts`:
  - scope `cohort:write`, cohort team rule, cross-org cohort 404
  - idempotency: a second call the same day enqueues nothing new
  - the limiter failing closed with 503
- `routes-v1-openapi-data-shape.test.ts` passes unchanged (new responses are fully typed).
- `routes-v1-cohort-metering.test.ts`: the five tools are recorded with their names, categories and credits.

## 6. PR 1, part C: MCP

### 6.1 Tools (`packages/mcp/src/tools/insights.ts`, new; register in `src/server.ts`)

| Tool | Annotations | Input schema | Description (one sentence plus, where needed, one hint) |
| --- | --- | --- | --- |
| `get_insights_catalog` | `READ_ONLY` | none | "List the insights sources, metrics, dimensions and filters you can query; the key creator must be an org admin or tutor." |
| `query_insights` | `READ_ONLY` | public query request schema | "Run one insights query for a cohort, course or organization scope; {scope rule}. Call get_insights_catalog first to choose a source, metrics and filters." |
| `get_insights_dashboard` | `READ_ONLY` | scope params plus snapshot query | "Get the numbers behind a cohort, course or organization analytics dashboard; {scope rule}." |
| `list_insights_students` | `READ_ONLY` | students query | "List students in a scope with progress, score, status and last login; {scope rule}." |
| `remind_overdue_cohort_goals` | `WRITE`, `idempotentHint: true` | cohort param plus remind body | "Email overdue goal reminders now to a cohort's overdue students, or one student; {cohort team rule}. A student is reminded at most once a day." |

- Schemas come from `@cio/utils/validation/public-api` (`.extend` for path params), and handlers re-`parse` their args, as `tools/analytics.ts` does.
- Annotation constants come from `tools/cohort-tool-text.ts`. Do not redefine them in the new file.
- `src/api-client.ts`: add `getInsightsCatalog`, `queryInsights` (`requestWithMeta` plus pagination), `getInsightsDashboard`, `listInsightsStudents` (`requestPaginated`), `remindOverdueCohortGoals`.
- Output stays `jsonContent(...)`, matching every other tool.

### 6.2 Scopes, release, docs

- **No scope migration.** `analytics:read` and `cohort:write` are already in `DEFAULT_SCOPES.mcp`. `cohort:write` has been in the MCP default from the start, migration 0028 backfilled `analytics:read` onto older keys, and OAuth grants can request both. Confirm with `routes-v1-mcp-default-scopes.test.ts`, which must pass unchanged.
- `packages/mcp/src/server.test.ts`: assert the five tools are registered in remote and local modes. `apps/api/src/routes/mcp/mcp.test.ts`: `tools/list` contains `query_insights`, and `tools/call get_insights_catalog` dispatches internally to `/public-api/v1/analytics/insights/catalog`. CI does not run the package tests, so run `pnpm --filter @classroomio/mcp test` locally. API tests load the built `packages/mcp/dist/server.js`, so run `pnpm mcp:build` first.
- **Release.** Do not bump `packages/mcp/package.json` in this PR. After merge, the next `chore(mcp): release 0.5.0` commit bumps the minor version (new tool surface) and runs `publish-mcp.yml`. The hosted server at `mcp.classroomio.com` picks the tools up with the API deploy.
- **Docs:**
  - `packages/mcp/README.md`: add an Insights section next to Analytics (around L355) and the tools to the Tool Surface list.
  - `apps/docs/content/docs/developers/mcp/index.mdx`: one line on analytics questions, with an example prompt.
  - New API guide `apps/docs/content/docs/api/insights.mdx`, added to the API sidebar's Getting started list in `blume.config.ts`. It covers:
    - the catalog
    - a worked query
    - the snapshot
    - students paging for exports
    - the effective range and freshness
    - the difference from the older Analytics endpoints
- After merge, the published OpenAPI spec regenerates through `.github/workflows/upload-openapi-spec.yml`. The docs build reads the published spec, so the new tag appears only after that upload.

### 6.3 PR 1 verification

```bash
export PATH="$HOME/.nvm/versions/node/v24.22.1/bin:$PATH"
```

```bash
pnpm --filter @cio/api^... build && pnpm --filter @cio/api build
```

```bash
pnpm mcp:build && pnpm --filter @classroomio/mcp test
```

```bash
pnpm --filter @cio/api test -- insights analytics-insights cohort-goals-remind mcp public-api-scopes v1-mcp-usage openapi-data-shape
```

```bash
pnpm --filter @cio/utils test
```

```bash
cd apps/dashboard && npx vitest run src/lib/features/insights && pnpm dlx svelte-check@4 --threshold error
```

```bash
pnpm format:check
```

Then call every endpoint with a real `api` key and through the remote MCP server with an OAuth grant against the seeded org. Record the requests in the PR's "How should this be tested?" section.

## 7. Still blocked

Learning time per day and peak concurrent learners are blocked by [classroomio/classroomio#1299](https://github.com/classroomio/classroomio/issues/1299). Copying a supervisor on reminders is blocked by [classroomio/classroomio#1302](https://github.com/classroomio/classroomio/issues/1302). Nothing here changes that.

## 8. Product calls made in this plan

1. **Org scope** stays org-admin-only for the API and MCP, matching the dashboard, although `GET /v1/analytics` admits tutors.
2. **The public students list returns emails**, because roster sync is a primary use.
3. **The existing v1 analytics endpoints stay unchanged**; no deprecation in PR 1.
4. **A POST query is a read** (`analytics:read`, metered as read), with the metering category taken from the tool, not the HTTP method.

## 9. Found while planning, outside this feature

- **`POST /agent/credits/purchase`** (`apps/api/src/routes/agent/agent.ts`, `authOrApiKeyMiddleware`) accepts any signed-in user and writes credits for any `orgId` in the body (`recordCreditPurchase` checks only that the order id is new). It is meant to be called by the dashboard's Polar webhook handler (`features/agent/api/credit-purchase.server.ts`). Present on `main`.
- **`GET /agent/usage/leaderboard`** returns team members' emails to any org member, students included (`orgMemberMiddleware` only).

Both belong in their own security fix, not in this PR.
