# Analytics naming: implementation plan

Status: implemented across the stack. Applies to
[classroomio/classroomio#1444](https://github.com/classroomio/classroomio/pull/1444) (core) →
[classroomio/classroomio#1445](https://github.com/classroomio/classroomio/pull/1445) (dashboard) →
[classroomio/classroomio#1495](https://github.com/classroomio/classroomio/pull/1495) (public API and MCP).

Inventory baseline: stack head `5295a0ed9`. The term "insight" appears in 215 feature files (3,705 lines, 166 paths, 284 identifiers). Re-run [Appendix A](#appendix-a-inventory-commands) after the rebase, since the numbers move.

## 0. The org page name is a variable

The new organization-wide dashboard (the engine at org scope) gets its own name in the Analytics menu. That name is chosen by product and may change. Every place in this plan that depends on it uses a placeholder:

| Placeholder | Form | Used in | Current value |
| --- | --- | --- | --- |
| `{{PAGE}}` | Label, Title Case | nav item, page heading, breadcrumbs, help prose, OpenAPI tag, docs sidebar | `Academy` |
| `{{page}}` | URL segment, kebab-case | dashboard route, public API path, test ids, help image folders | `academy` |
| `{{page_snake}}` | Tool segment, snake_case | MCP tool names | `academy` |

A valid name must:
- work as the name of the engine's whole domain, because the engine-wide endpoints (`catalog`, `query`) sit under `/analytics/{{page}}` and also serve course and cohort scopes
- not repeat an existing org nav label: Home, Dashboard, Courses, Cohorts, Media, Tags, Widgets, Landing Page, Audience, Community, Automation, Settings, Marketing, Compliance
- not repeat a column label that sits next to it in the UI (for example "Progress")
- read naturally in `get_{{page_snake}}_analytics` and in "**Analytics → {{PAGE}}**"

**Stable identifiers never take the name.** These stay the same whatever `{{PAGE}}` is, so a rename touches only the surfaces in [Appendix B](#appendix-b-changing-the-org-page-name):
- the engine module name `analytics`
- the org page component `OrgAnalyticsPage` (`org-analytics.svelte`)
- the translation keys `org_navigation.org_analytics` and `analytics.org_page_title`
- error codes, the settings key, cache keys, internal RPC routes and the `analytics:read` scope

**One source of truth in code.** `packages/utils/src/constants/analytics-pages.ts` exports:

```ts
export const ORG_ANALYTICS_PAGE = { label: 'Academy', slug: 'academy', toolSegment: 'academy' } as const;
```

The following read from it instead of repeating the literal:
- public route mounts
- `MCP_V1_ROUTE_TOOL_MAP` keys and values
- MCP tool names and descriptions
- `OPERATION_SUMMARIES` keys
- the OpenAPI tag
- the dashboard nav `path` and the redirect in §4.2

Places that cannot import it repeat the literal, and the consistency test in §5.4 checks them against the constant:
- the dashboard route folder
- translation values
- `apps/docs/blume.config.ts`
- every doc

## 1. The problem

The product has several things that are each called "analytics", plus a fourth word, "insights", that only exists in code:

| Thing | Dashboard today | Public API and MCP today | Code today |
| --- | --- | --- | --- |
| Learner performance engine | **Stats → Analytics** (org), course **Analytics**, cohort **Analytics** | `/analytics/insights/*`, `*_insights_*` tools | `insights` everywhere |
| Traffic and funnel | **Stats → Marketing** | `GET /analytics?include=traffic,…`, `get_org_analytics`, `GET /courses/{id}/analytics?include=funnel` | `@cio/analytics`, `services/analytics`, `queries/analytics`, `/dash/*`, `dashAnalytics*` |
| Compliance | **Stats → Compliance** | `GET /analytics?include=compliance`, `/analytics/compliance/learners` | `compliance` |
| Org home totals and logins | **Dashboard** | `GET /analytics?include=overview,loginActivity` | `services/dash`, `getOrganisationAnalytics` |
| Old course numbers (no longer shown) | nothing | `GET /courses/{id}/analytics`, `/courses/{id}/analytics/students` | `getCourseAnalytics`, `buildCourseStudentAnalytics` |

What this causes:
- A caller cannot tell from a name which of these it is talking to.
- `GET /analytics` mixes four dashboard pages.
- Two published endpoints return numbers the dashboard no longer shows.
- The menu that groups the three org pages is called "Stats", which is used nowhere else.
- The public API says "learners", while the UI says "Students": 352 en.json values use "student", and no compliance string uses "learner".

## 2. Decisions

### 2.1 Information architecture and the one rule

The org "Stats" menu becomes **Analytics**, and its children are **{{PAGE}}**, **Marketing** and **Compliance**.

| Dashboard today | Dashboard after |
| --- | --- |
| Stats (menu, `/stats` hash) | **Analytics** (menu) |
| Stats → Analytics `/org/[slug]/analytics` | Analytics → **{{PAGE}}** `/org/[slug]/analytics/{{page}}` |
| Stats → Marketing `/org/[slug]/marketing` | Analytics → **Marketing** `/org/[slug]/analytics/marketing` |
| Stats → Compliance `/org/[slug]/compliance` | Analytics → **Compliance** `/org/[slug]/analytics/compliance` |
| — | `/org/[slug]/analytics` redirects: admins to `{{page}}`, tutors to `marketing` (the only child tutors may open) |
| Course **Analytics** `/courses/[id]/analytics` | unchanged |
| Cohort **Analytics** `/cohorts/[id]/analytics` | unchanged |

**Rule.** Every public name is the word on the screen, and every public path is the dashboard page path with `/org/[slug]` dropped. Tools are named after the path they call.

| Dashboard page | Public path |
| --- | --- |
| `/org/[slug]/analytics/{{page}}` | `/analytics/{{page}}` |
| `/org/[slug]/analytics/marketing` | `/analytics/marketing` |
| `/org/[slug]/analytics/compliance` | `/analytics/compliance` |
| `/courses/[id]/analytics` | `/courses/{courseId}/analytics` |
| `/cohorts/[id]/analytics` | `/cohorts/{cohortId}/analytics` |
| `/org/[slug]/dash` (Dashboard) | `/organization/overview` |
| `/org/[slug]/audience/{profileId}` | `/audience/{profileId}/analytics` |
| `/courses/[id]/people/{personId}` | `/courses/{courseId}/members/{memberId}/analytics` (unchanged) |

**Vocabulary:**
- **Analytics:** the menu, and the course and cohort pages.
- **{{PAGE}}:** the org engine page.
- **Marketing** and **Compliance:** their own pages.
- **Overview:** the org home totals.
- **Student:** never "learner".
- "insight" and "learner" appear in no public path, tool, tag, summary, error code or JSON field that this stack adds or touches.

The same engine has two labels: **{{PAGE}}** at org level and **Analytics** in a course or cohort. This mirrors the UI on purpose. The course and cohort sidebars have a single Analytics entry, while the org menu groups three pages.

### 2.2 Public API v1 (old → new)

All routes keep the `analytics:read` scope (§2.6).

**{{PAGE}}** (the engine). OpenAPI tag `{{PAGE}}`.

| Old | New | Tool |
| --- | --- | --- |
| `GET /analytics/insights/dashboards/org/{orgId}` | `GET /analytics/{{page}}` | `get_{{page_snake}}_analytics` |
| `GET /analytics/insights/students` (org) | `GET /analytics/{{page}}/students` | `list_{{page_snake}}_students` |
| `GET /analytics/insights/catalog` | `GET /analytics/{{page}}/catalog` | `get_{{page_snake}}_catalog` |
| `POST /analytics/insights/query` | `POST /analytics/{{page}}/query` (scope in the body: org, course or cohort) | `query_{{page_snake}}_analytics` |
| `GET /analytics/insights/dashboards/course/{courseId}` | `GET /courses/{courseId}/analytics` (**replaces** the old-engine endpoint) | `get_course_analytics` |
| `GET /analytics/insights/students` (course) | `GET /courses/{courseId}/analytics/students` (**replaces** the old-engine rows) | `list_course_analytics_students` |
| `GET /analytics/insights/dashboards/cohort/{cohortId}` | `GET /cohorts/{cohortId}/analytics` | `get_cohort_analytics` |
| `GET /analytics/insights/students` (cohort) | `GET /cohorts/{cohortId}/analytics/students` | `list_cohort_analytics_students` |
| `GET /analytics/insights/dashboards/{scopeType}/{scopeId}` | removed; split into the scoped routes above | — |

The three snapshot routes share one service (`getAnalyticsDashboardSnapshotForActor`), one rate limiter (`analytics_snapshot:{keyId}`) and one query schema. The three students routes do the same.

Tool descriptions must cross-reference each other. `get_{{page_snake}}_analytics` says "organization-wide; for one course use `get_course_analytics`, for one cohort use `get_cohort_analytics`", and the reverse. An LLM that is asked for "{{page}} analytics for course X" then picks the course tool.

**Marketing.** OpenAPI tag `Marketing`.

| Old | New | Tool |
| --- | --- | --- |
| `GET /analytics?include=traffic,countries,funnel,courseTypes,topCourses` | `GET /analytics/marketing?include=…` (same sections, `days`, `limit`) | `get_marketing_analytics` |
| `GET /courses/{courseId}/analytics?include=funnel` | `GET /analytics/marketing/courses/{courseId}` | `get_course_marketing_analytics` |

The course funnel keeps its own route. Folding it into `?courseId=` would give the `funnel` section two shapes depending on a query parameter, which `CLAUDE.md` forbids.

**Compliance.** OpenAPI tag `Compliance`.

| Old | New | Tool |
| --- | --- | --- |
| `GET /analytics?include=compliance` | `GET /analytics/compliance` | `get_compliance_analytics` |
| `GET /analytics/compliance/learners` | `GET /analytics/compliance/students` | `list_compliance_students` |

**Overview and student pages.**

| Old | New | Tag | Tool |
| --- | --- | --- | --- |
| `GET /analytics?include=overview,loginActivity` | `GET /organization/overview?include=summary,loginActivity` | `Organization` | `get_org_overview` |
| `GET /analytics/learners/{profileId}` | `GET /audience/{profileId}/analytics` | `Audience` | `get_student_analytics` |
| `GET /courses/{courseId}/members/{memberId}/analytics` | unchanged | `Course Members` | `get_course_member_analytics` |
| `POST /cohorts/{cohortId}/goals/remind-overdue` | unchanged | `Cohort Goals` | `remind_overdue_cohort_goals` |

`/audience/{memberId}` takes a numeric member id. `/audience/{profileId}/analytics` takes a uuid profile id, because that is what the dashboard page, the compliance list and the students lists return. Validate it as a uuid and say so in the param description. Hono separates the two by depth.

**Removed outright:**
- `GET /analytics` (root)
- `get_org_analytics`
- every `/analytics/insights/*` route
- `/analytics/learners/{profileId}`
- `/analytics/compliance/learners`
- the old-engine `summary` section and student rows of the course endpoints
- `PUBLIC_API_COURSE_ANALYTICS_SECTIONS` and its notes

There is no endpoint at `/analytics` itself. It is a menu, not a page.

### 2.3 MCP tools (old → new)

One tool per route, as `MCP_V1_ROUTE_TOOL_MAP` already requires.

| Old | New |
| --- | --- |
| `get_insights_dashboard` (org) | `get_{{page_snake}}_analytics` |
| `list_insights_students` (org) | `list_{{page_snake}}_students` |
| `get_insights_catalog` | `get_{{page_snake}}_catalog` |
| `query_insights` | `query_{{page_snake}}_analytics` |
| `get_insights_dashboard` (course), old `get_course_analytics` | `get_course_analytics` (engine snapshot) |
| `list_insights_students` (course), old `list_course_analytics_students` | `list_course_analytics_students` (engine rows) |
| `get_insights_dashboard` (cohort) | `get_cohort_analytics` |
| `list_insights_students` (cohort) | `list_cohort_analytics_students` |
| `get_org_analytics` (marketing sections) | `get_marketing_analytics` |
| `get_course_analytics` (`funnel`) | `get_course_marketing_analytics` |
| `get_org_analytics` (`compliance`) | `get_compliance_analytics` |
| `list_compliance_learners` | `list_compliance_students` |
| `get_org_analytics` (`overview`, `loginActivity`) | `get_org_overview` |
| `get_learner_analytics` | `get_student_analytics` |
| `get_org_analytics` | removed |
| `get_course_member_analytics`, `remind_overdue_cohort_goals` | unchanged |

Tool files in `packages/mcp/src/tools/`:
- `analytics.ts`: engine tools (org, course and cohort)
- `marketing.ts`, `compliance.ts`: new
- the org file: `get_org_overview`
- `audience.ts`: `get_student_analytics`

Each file exports its own `register*Tools`.

### 2.4 Internal names

Inside the code, "analytics" means only the engine. It is a stable name and does not follow `{{PAGE}}`. The layers that used to share the word get their own names:

| Layer | Name | What moves |
| --- | --- | --- |
| Engine (was insights) | `analytics` | everything in §4.1 commit 2 and §4.2 step 2 |
| Event collection: beacon, taxonomy, ingest, daily rollups, de-identification | `tracking` | `packages/analytics` → `packages/tracking` (`@cio/tracking`); `apps/api/src/services/analytics/ingest.ts` → `services/tracking/ingest.ts`; the collection half of `packages/db/src/queries/analytics/analytics.ts` → `queries/tracking/` |
| Traffic and funnel reads | `marketing` | `services/analytics/reads.ts` → `services/marketing/reads.ts`; the `select*` half of `queries/analytics/analytics.ts` → `queries/marketing/`; internal `/dash/{landing-stats,country-breakdown,course-funnel,popular-types,top-courses}` → internal `/marketing/*`; `dashAnalyticsKey`, `ZDashAnalyticsRange`, `ZDashCourseFunnel` → `marketingKey`, `ZMarketingRange`, `ZMarketingCourseFunnel` |
| Per-student progress (audience and course-people pages) | `student-progress` | `getLastLogin`, `getLastSeenForUserIds`, `getUserExercisesStats`, `getLessonsWithCompletion`, `getProfileCourseProgress` → `queries/student-progress/` |
| Org home | `dash` (unchanged) and `overview` | `getOrganisationAnalytics` → `getOrganizationOverview`; `/dash/compliance-overview` moves to the internal compliance routes; `dashAnalyticsRouter` → `dashRouter` |
| Shared stat widgets | `stats` | `apps/dashboard/src/lib/features/ui/analytics/` → `features/ui/stats/` |
| Dashboard routes | — | `(app)/org/[slug]/analytics/+page.svelte` → `analytics/{{page}}/+page.svelte`; `(app)/org/[slug]/marketing` → `analytics/marketing`; `(app)/org/[slug]/compliance` → `analytics/compliance`; new `analytics/+page.server.ts` (the redirect in §2.1) |

How `queries/analytics/analytics.ts` splits, by function:
- **tracking:** `insertPageEvents`, `collapseLatestActivityByMember`, `upsertOrgDailyRows`, `upsertCourseDailyRows`, `upsertCountryDailyRows`, `deidentifyPageEventsForUser`
- **marketing:** `selectOrgDailyAggregates`, `selectCourseDailyAggregates`, `selectCountryDailyAggregates`, `selectPopularCourseTypes`, `selectTopCoursesByViews`, `selectOrgDailyRange`, `selectCourseDailyRange`, `selectCountryBreakdown`
- **student-progress:** the five functions listed in the table above

### 2.5 Mechanical rename rule (the engine)

These renames apply to every identifier, file, folder, key, code and string listed in §4.1 and §4.2:
- `Insights` → `Analytics`
- `insights` → `analytics`
- `INSIGHTS` → `ANALYTICS`
- `insight` → `analytics` (in prose)

These exceptions override the rule:

| Rule result | Use instead | Why |
| --- | --- | --- |
| `v1AnalyticsInsightsRouter` → `v1AnalyticsAnalyticsRouter` | `v1OrgAnalyticsPageRouter`, mounted at `/${ORG_ANALYTICS_PAGE.slug}` inside the restructured `v1AnalyticsRouter` | stable name, variable path |
| `ANALYTICS_INSIGHTS_QUERY_PATH` | `ANALYTICS_QUERY_PATH`, built from `ORG_ANALYTICS_PAGE.slug` | |
| `INSIGHTS_TAG` (`'Analytics Insights'`) | `ORG_ANALYTICS_PAGE.label` | the tag is `{{PAGE}}` |
| `insightsForbiddenResponses` | a single `analyticsForbiddenResponses` | the old one moves to the marketing and compliance docs files |
| `INSIGHTS_CACHE_CONTROL` | delete; import the existing `ANALYTICS_CACHE_CONTROL` | same value |
| `OrgInsightsPage` / `org-insights.svelte` | `OrgAnalyticsPage` / `org-analytics.svelte` | stable; never `OrgLearningPage` |
| `routes-v1-analytics-insights.test.ts` | `routes-v1-analytics.test.ts` | the old analytics tests move with their code |
| `services-v1-analytics-insights(-roles).test.ts` | `services-v1-analytics(-roles).test.ts` | the existing `services-v1-analytics.test.ts` moves to marketing and compliance first |
| `prd/insights-analytics` | `prd/analytics-dashboards` | |
| `prototypes/insights-analytics` | `prototypes/analytics-dashboards` | |
| translation `insights.*` | `analytics.*`, **after** §4.2 step 3.1 empties the old `analytics.*` | 90 existing keys |

Dashboard types such as `AnalyticsRow` keep shadowing the db and api types of the same name, as they do today. That is allowed, because the dashboard must not import from `@cio/db`.

### 2.6 Kept on purpose

| Name | Why it stays |
| --- | --- |
| Scope `analytics:read` | Scopes are stored on API keys and OAuth grants; a rename means a backfill and re-consent. It now reads as "read everything under Analytics, the org overview and student analytics". Say so in `oauth.mdx`. |
| Tables `analytics_login_events`, `analytics_page_event`, `analytics_org_daily`, `analytics_course_daily`, `analytics_country_daily` and their Drizzle exports | Renaming live tables breaks running API instances during a rolling deploy and needs a two-phase migration. These are storage names of the tracking layer. |
| `/internal/analytics/rollup-daily` URL | It is called by a scheduler outside this repo. Rename the router symbol to `internalTrackingRouter`, and change the URL only when the scheduler owner changes the caller in the same deploy. Otherwise leave the path. |
| `settings.landing_page.editor.hero.stats.label` ("Stats") | Unrelated: a landing-page hero block. Exclude it from the "Stats" sweep. |
| Branch names `feat/insights-analytics-*` and past commit messages | Renaming head branches of a stacked set retargets PRs and risks closing them. Both disappear at merge. |
| "Academy" as the org's own name elsewhere | `account.workspaces.site_name_label` and `onboarding.organisation_sitename` ("Academy subdomain"), `settings.subheadings.view_site` ("Your Academy") and `add_org.org_sitename` all use "Academy" to mean the org/tenant itself, not this dashboard page. Chosen anyway: the two uses sit in different contexts (account/settings vs. the Analytics menu). If support feedback shows confusion ("which Academy?"), revisit via Appendix B. |

## 3. Backward compatibility: port and ignore

**The current PRs handle none.**
- #1445 moves the marketing page with no redirect.
- #1444 renames two published help slugs with no redirect.
- #1495 only adds endpoints.

**Past renames of routes and tools were hard cuts:**
- [classroomio/classroomio#1556](https://github.com/classroomio/classroomio/pull/1556) (merged 2026-11-13) removed 11 MCP tools and the v1 course-draft routes with no alias.
- [classroomio/classroomio#1343](https://github.com/classroomio/classroomio/pull/1343) replaced the exercise tools.
- [classroomio/classroomio#1224](https://github.com/classroomio/classroomio/pull/1224) removed `reorder_course_content`.
- [classroomio/classroomio#1211](https://github.com/classroomio/classroomio/pull/1211) removed `upload_video` and `attach_lesson_video` from the key path.

Deprecation exists only for **response fields**: `logo`, `theme`, `allowNewStudent` and the lesson `note`/`videoUrl`/`slides` are kept with "Deprecated; use X".

**Decision.** For routes and tools: port and ignore. No aliases, no deprecation window.

**Published page URLs keep redirects.** The help center already does this, and a dashboard redirect is one file:

| Old URL (published on `main`) | Redirect to | Where |
| --- | --- | --- |
| `/org/[slug]/compliance` | `/org/[slug]/analytics/compliance` | `(app)/org/[slug]/compliance/+page.server.ts` (`redirect(308, …)`) |
| `/org/[slug]/analytics` | the role-aware redirect in §2.1 | `(app)/org/[slug]/analytics/+page.server.ts` |
| `/help/analytics-and-reporting/review-course-performance-and-learner-progress` | `…/review-course-performance-and-student-progress` | `REDIRECTS` in `apps/help/scripts/package-assets.mjs` |
| `/help/analytics-and-reporting/view-a-learners-analytics` | `…/view-a-students-analytics` | same |
| `/help/analytics-and-reporting/read-your-organization-analytics-overview` | `…/read-your-marketing-overview` | same |

`/org/[slug]/marketing` and `/api/insights` were never published, so they need no redirect. No email or webhook links to the org Analytics, Marketing or Compliance pages; webhooks link only to `/courses/{id}/compliance`.

**Removed vs. changed meaning.** `GET /analytics` and `get_org_analytics` are now **removed**, not reused. A caller gets a 404, which is the safe failure. Two names keep their spelling but return different data:
- `GET /courses/{id}/analytics` and `get_course_analytics`
- `GET /courses/{id}/analytics/students` and `list_course_analytics_students`

The release note lists those two first. Bump `@classroomio/mcp` to `0.5.0`; a minor bump is breaking in 0.x.

## 4. What changes, per PR

**Placement rule:** a change lands in the lowest PR where every consumer of it exists, and a doc lands in the PR whose code makes it true.

### 4.0 Before any rename

1. Rebase #1444 onto `main`, then #1445 onto #1444, then #1495 onto #1445.
2. Run the migration check from `CLAUDE.md` against `main`. If `main` gained a `0050_*` or a later `when`, restamp and renumber.
3. Re-run Appendix A and save the output as the checklist for §6.

### 4.1 #1444: engine, collision moves, tracking package

**Commit 1** `refactor: split the shared analytics modules into tracking, marketing and student-progress`
- `packages/analytics` → `packages/tracking` (`@cio/tracking`):
  - Update `package.json` deps in `apps/api`, `apps/dashboard` and `apps/jobs`, and every import.
  - Run `pnpm install` so the lockfile records the rename.
- Split `packages/db/src/queries/analytics/analytics.ts` into `queries/tracking/`, `queries/marketing/` and `queries/student-progress/` (per §2.4). Delete the folder's `index.ts`; commit 2 re-creates the folder for the engine.
- Move `apps/api/src/services/analytics/{ingest,reads}.ts` → `services/tracking/ingest.ts` and `services/marketing/reads.ts`. Update their importers, including `services/v1/analytics/{org,course}.ts` and `services/dash.ts`.
- Rename `getOrganisationAnalytics` → `getOrganizationOverview` and `internalAnalyticsRouter` → `internalTrackingRouter` (URL per §2.6).

**Commit 2** `refactor(analytics): rename the insights engine to analytics`. Apply §2.5 to:

- **utils:**
  - `constants/insights.ts` → `analytics.ts`
  - `validation/insights/` → `validation/analytics/`
  - the barrels
  - `error-codes.ts`: `INSIGHTS_*` → `ANALYTICS_*`, with values equal to the keys, plus the comment
- **db:**
  - `queries/insights/` (including `sources/`) → `queries/analytics/`
  - `schema.ts`: `insights?:` → `analytics?:`
  - `settings.ts`: `jsonb_set '{analytics}'`
  - `summary.ts`
- **core:**
  - `utils/redis/insights-cache.ts` → `analytics-cache.ts`, with keys `analytics:{query|dashboard|structure|plan}:…` and `analytics:refresh:…`
  - the `invalidateInsights*` callers in `services/course/{content,course,section}.ts`, `exercise.ts` and `lesson.ts`
- **api:**
  - `services/insights/` → `services/analytics/`
  - `routes/insights/` → `routes/analytics/`
  - `app.ts` `.route('/analytics', analyticsRouter)`
  - the rate-limit key `analytics_export`
  - the `toAnalyticsError` fallback text "Analytics request failed"
  - the `logContext` strings
- **migration:** `0050_insights_performance_indexes.sql` → `0051_analytics_performance_indexes.sql` (renumbered after main's `0050_lesson_history_client_name`), plus the `_journal.json` tag and the line-1 comment.
- **seeds and scripts:**
  - `seed-analytics-{load,states}.ts` and `db:seed:analytics-*`
  - siteNames `analytics-load` and `analytics-states`
  - emails `@analytics-states.demo`, usernames `analytics-admin` and `analytics-tutor`
  - course slugs and asset ids
  - the org display name "Analytics States"
  - `apps/api/scripts/measure-analytics.ts`
  - env vars `ANALYTICS_LOAD_ORG`, `ANALYTICS_BENCHMARK_RUNS`, `ANALYTICS_EXPLAIN_WIDGET`
- **tests:**
  - the 13 `insights-*` / `services-insights-*` files and `routes-insights.test.ts`
  - `packages/utils/tests/insights-spec.test.ts` and its snapshot: delete the `.snap`, regenerate it, and review that only names changed
  - the `describe`/`it` text, the `vi.mock` targets, and the test-org siteNames
- **docs in this PR:**
  - `packages/db/README.md`: the "Analytics state seed" section
  - `packages/ui/README.md:542`
  - `prd/insights-analytics/` → `prd/analytics-dashboards/`:
    - title
    - the `/insights` routes
    - the cache-key line
    - the folder rationale on L196 (now §2.4)
    - settings and table names
    - **Placement table (L177-189)** and **Phase 0 (L285-288)**: rewrite both for §2.1 (Analytics menu; {{PAGE}}, Marketing and Compliance under it; the routes; the redirects)
    - a short "Naming" section that links here
  - `prototypes/insights-analytics/` → `prototypes/analytics-dashboards/`:
    - titles
    - `index.html:778` nav head `'Stats'` → `'Analytics'`
    - the org child labels → `{{PAGE}}`, Marketing, Compliance
    - routes at `index.html:768` → `/org/[slug]/analytics/{{page}}` and `/org/[slug]/analytics/marketing`
  - `PRD-TRACKER.md`: drop the stale L35 draft row and point L48 at the renamed folder.
  - `ONBOARDING.md`:
    - L44 and L448: **Analytics → Marketing** (`/org/[slug]/analytics/marketing`) for landing KPIs, countries and funnel, plus a line for **Analytics → {{PAGE}}** (`/org/[slug]/analytics/{{page}}`)
    - L45, L103 and L451: **Analytics → Compliance** (`/org/[slug]/analytics/compliance`)
    - L451: "learner table" → "student table"

**Dev data note.** `organization.settings.insights` exists only in dev databases. Reseed, or run this locally:

```sql
update organization set settings = (settings - 'insights') || jsonb_build_object('analytics', settings -> 'insights') where settings ? 'insights';
```

**Commit 3** `docs(help): move the analytics help changes to the dashboard PR`
- On #1444, restore `apps/help/**` to `main` for every article and image that describes UI introduced in #1445: the Marketing page, the new Analytics pages, the cohort Analytics item and the Stats submenu.
- Keep only help fixes that are true against `main`.
- The fact-check sub agent decides per file.

### 4.2 #1445: dashboard, navigation, help center

1. **Re-point the stack.** After the rebase, change `classroomio.insights.*` RPC calls → `classroomio.analytics.*`.

2. **Feature folder** `features/insights/` → `features/analytics/`, per §2.5:
   - API classes: `AnalyticsApi`, `analyticsApi`, `AnalyticsStudentsApi`, `AnalyticsStudentSheetApi`, `AnalyticsSettingsApi`
   - components: `insights-*.svelte` → `analytics-*.svelte`
   - pages: `{cohort,course,org}-analytics.svelte`, exported as `{Cohort,Course,Org}AnalyticsPage`
   - utils: `analytics-utils`, `analytics-export`, `analytics-poller`, `ANALYTICS_COLORS`, `isAnalyticsStatus`
   - all types in `utils/types.ts`
   - `features/cohort/api/goal.svelte.ts`

3. **Translations**, in this order, across all 12 locale files:
   1. Move every key of the existing `analytics.*` (90 keys) to the namespace of the feature that uses it, with values unchanged and by script (Appendix A, command 4):
      - marketing components → `marketing.*`
      - audience and course-people student pages → `student_progress.*`
      - keys used by several features → `common.*`
   2. Rename `insights.*` → `analytics.*` and `snackbar.insights.*` → `snackbar.analytics.*`, with values unchanged. Where the `title` translations differ (es, hi, it, pt, tr), the engine's value wins.
   3. Delete `insights.empty.{no_cohorts,no_data,no_overdue}` from the 11 non-English locales.
   4. Navigation and the org page title:
      - Delete `org_navigation.stats`.
      - Keep `org_navigation.analytics` = "Analytics"; it now labels the menu.
      - Add `org_navigation.org_analytics` = "{{PAGE}}".
      - Add `analytics.org_page_title` = "{{PAGE}}" and use it for the heading and `<title>` of `org-analytics.svelte`. Course and cohort pages keep `analytics.title` = "Analytics".
   5. Run `cd apps/dashboard && pnpm translate`, then check every `{placeholder}`. Have a native speaker or reviewer confirm how "{{PAGE}}" was translated in each locale, since it is a page name, not a verb.

4. **Navigation** (`features/ui/navigation/org-navigation.ts`). The menu entry becomes:

   ```ts
   {
     group: null,
     titleKey: 'org_navigation.analytics',
     path: '/analytics',
     icon: ChartColumnIcon,
     useHashUrl: true,
     matchPattern: '^/org/[^/]+/analytics(/.*)?$',
     items: [
       { titleKey: 'org_navigation.org_analytics', path: `/analytics/${ORG_ANALYTICS_PAGE.slug}`, requiresAdmin: true, matchPattern: `^/org/[^/]+/analytics/${ORG_ANALYTICS_PAGE.slug}(/.*)?$` },
       { titleKey: 'org_navigation.marketing', path: '/analytics/marketing', matchPattern: '^/org/[^/]+/analytics/marketing(/.*)?$' },
       { titleKey: 'org_navigation.compliance', path: '/analytics/compliance', requiresAdmin: true, matchPattern: '^/org/[^/]+/analytics/compliance(/.*)?$' }
     ]
   }
   ```

   `orgNavTestId` derives the test ids from the paths:
   - `org-nav-stats` → `org-nav-analytics` (the menu)
   - the org page → `org-nav-analytics-{{page}}`
   - `org-nav-analytics-marketing`, `org-nav-analytics-compliance`

   `org-nav-analytics` used to mean the child page. No e2e spec uses it, but update the example in `e2e/README.md` if it names any of these.

5. **Routes:**
   - `git mv "(app)/org/[slug]/analytics/+page.svelte" "(app)/org/[slug]/analytics/{{page}}/+page.svelte"`
   - `git mv "(app)/org/[slug]/marketing" "(app)/org/[slug]/analytics/marketing"`
   - `git mv "(app)/org/[slug]/compliance" "(app)/org/[slug]/analytics/compliance"`
   - Add `(app)/org/[slug]/analytics/+page.server.ts`. It sends org admins to `{{page}}` and everyone else to `marketing`, using `redirect(307, …)` because the target depends on the role.
   - Add `(app)/org/[slug]/compliance/+page.server.ts` with `redirect(308, …)` to `analytics/compliance`.
   - Search the dashboard for hard-coded links to `/marketing` or `/compliance` at org level, and to `/analytics` meaning the org page. Today there are none outside the nav config, but re-check after the rebase.

6. **Test ids:** `insights-*` → `analytics-*` (13 ids).

7. **Shared stat widgets:** `features/ui/analytics/` → `features/ui/stats/`. Rename `AnalyticsPanelCard` → `StatsPanelCard`, and update the exports in `features/ui/index.ts`.

8. **Internal marketing routes** (API and dashboard together):
   - `/dash/{landing-stats,country-breakdown,course-funnel,popular-types,top-courses}` → an internal `/marketing` router at `apps/api/src/routes/marketing/`, mounted at a single root.
   - `/dash/compliance-overview` → the internal compliance routes.
   - `validation/dash/analytics.ts` → `validation/marketing/`.
   - `dashAnalyticsKey` → `marketingKey`.
   - Update the callers in `features/marketing/api/marketing.svelte.ts`, `features/compliance/api` and `features/org/api/dash-stats.svelte.ts`.

9. **Dead old-engine route:** delete internal `GET /course/:courseId/analytics` and its tests.

10. **Constant:** add `packages/utils/src/constants/analytics-pages.ts` (§0) here. The navigation is its first consumer.

11. **Help center**, all in this PR:

    a. **Restore** the analytics help changes that commit 3 of §4.1 removed from #1444, then apply these edits.

    b. **Article edits.** Line numbers are at `5295a0ed9`; find them again after the rebase.

    | File (`apps/help/content/help/…`) | Change |
    | --- | --- |
    | `analytics-and-reporting/monitor-students-across-your-organization.mdx` | L7 "Open **Stats → Analytics**" → "Open **Analytics → {{PAGE}}**". L13 alt "Organization Analytics page" → "Organization {{PAGE}} page". L17 "can open **Analytics**" → "can open **{{PAGE}}**". L28 "…moved to **Stats → Marketing**" → "…are on **Analytics → Marketing**" (state where they are, not where they moved from). L125 link label → "Read your marketing overview" and new slug. L114 "**Analytics couldn't load**" stays only if `analytics.empty.dashboard_failed` still reads that way. |
    | `analytics-and-reporting/read-your-organization-analytics-overview.mdx` → `read-your-marketing-overview.mdx` (move its `images/` folder too) | Title "Read your marketing overview" and description. L7 "Open **Stats → Marketing**" → "Open **Analytics → Marketing**". L28 "## Marketing or Analytics?" → "## Marketing or {{PAGE}}?". L32 "**Stats → Analytics** shows…" → "**Analytics → {{PAGE}}** shows…". L36 course **Analytics** unchanged. |
    | `analytics-and-reporting/analyze-landing-views-enrollments-and-completions.mdx` | L7 "**Stats → Marketing**" → "**Analytics → Marketing**". L29 link label and slug. |
    | `analytics-and-reporting/compare-your-top-courses.mdx` | L13 "**Stats → Marketing**" → "**Analytics → Marketing**". |
    | `analytics-and-reporting/view-top-countries-and-popular-course-types.mdx` | L7 → "**Analytics → Marketing**". L25 link label and slug. |
    | `analytics-and-reporting/report-on-compliance-status.mdx` | L7 "**Stats → Compliance**" → "**Analytics → Compliance**". |
    | `analytics-and-reporting/understand-the-organization-dashboard.mdx` | L22 "open **Marketing** instead" → "open **Analytics → Marketing** instead". L27 link label and slug. |
    | `deliver-and-engage/monitor-organization-compliance.mdx` | L11 "Open **Stats → Compliance**" → "Open **Analytics → Compliance**". |
    | `organization-and-team/roles-and-permissions.mdx` | L41-43: "Organization **Analytics → {{PAGE}}** \| Admins", "Organization **Analytics → Marketing** \| Admins and Tutors", "Organization **Analytics → Compliance** \| Admins". L44-45 (cohort and course **Analytics**) unchanged. |
    | `troubleshooting-and-reference/roles-and-permissions-reference.mdx` | L17: "organization **Analytics → {{PAGE}}** and **Analytics → Compliance** are admin-only, **Analytics → Marketing** also allows tutors". |
    | Every file linking to `read-your-organization-analytics-overview` (5 today) | New slug and label. |

    c. **Sidebar** (`apps/help/blume.config.ts`, "Analytics and reporting" group):
       - "Use marketing stats" → "Use Marketing"
       - "Read your organization analytics overview" → "Read your marketing overview", with the new `root`
       - Every other label stays. Their titles describe tasks, not page names.

    d. **Redirects:** add the three help rows from §3 to `REDIRECTS`.

    e. **Screenshots: the sidebar fan-out.** The org sidebar has shown "Stats" since `main` commit `ac3a2c14a` (2026-05-18). Every help image that shows the org sidebar therefore goes stale when the label becomes "Analytics", including articles this stack never touched. Procedure:
       1. Have a read-only sub agent open each of the 206 `apps/help/content/help/**/*.webp` images. It should list every image whose sidebar shows the org menu (Home, Dashboard, Stats …), plus any image that shows the Stats submenu or a "Stats >" breadcrumb.
       2. Recapture each listed image from #1445 after steps 1-10 are done, following `skills/add-docs-image/SKILL.md`:
          - 1350×830, device scale 1, `coursera-test` org (or the renamed `analytics-states` seed where the article needs its data)
          - framed with `pnpm --filter @cio/help frame-screenshot`
       3. Open every recapture and compare it with its article and alt text before staging (§5.3).

       Known images that need it in any case:
       - `analytics-and-reporting/images/monitor-students-across-your-organization/{overview,courses,cohorts,trends,seats}.webp`
       - `…/read-your-organization-analytics-overview/overview.webp` (moves to `read-your-marketing-overview/`)
       - `…/analyze-landing-views-enrollments-and-completions/overview.webp`
       - `…/compare-your-top-courses/overview.webp`
       - `…/view-top-countries-and-popular-course-types/overview.webp`
       - `…/report-on-compliance-status/overview.webp`
       - `…/understand-the-organization-dashboard/overview.webp`
       - `deliver-and-engage/images/monitor-organization-compliance/overview.webp`
       - `analytics-and-reporting/images/track-a-cohort-with-analytics/*` (4) and `review-course-performance-and-student-progress/overview.webp`, which show the "Insights States" seed org

    f. **Open findings** to fix in the same pass:
       - the cohort `students.webp` At risk badges (r4562726561)
       - "Attendance tab" in `take-attendance.mdx` (r4562726656)
       - "Marks tab" in `show-course-news-feeds-and-grading.mdx` (r4562726781)
       - the invite-link claim in `reference/course.mdx` L12 (r4562726871)

    g. **Backlog:** update `apps/help/help-center-content-backlog.md` L390-445 to the current titles, slugs and menu path. Add the new articles.

### 4.3 #1495: public API, MCP, developer docs

1. **Routes**, per §2.2:
   - `routes/v1/analytics/index.ts` mounts:
     - `/${ORG_ANALYTICS_PAGE.slug}` (snapshot, students, catalog, query)
     - `/marketing` (with `/courses/:courseId`)
     - `/compliance` (with `/students`)
   - Each child has its own `docs.ts`.
   - Replace `routes/v1/courses/analytics.ts` with the engine routes.
   - Add `routes/v1/cohorts/analytics.ts`, `routes/v1/organization/overview.ts`, and `GET /:profileId/analytics` in `routes/v1/audience.ts`.
   - Nothing answers `GET /analytics`.

2. **Services:**
   - `services/v1/analytics/insights.ts` → `services/v1/analytics/index.ts`
   - Split `org.ts` into `services/v1/marketing.ts`, `services/v1/compliance.ts` and `services/v1/organization/overview.ts`.
   - `learner.ts` → `services/v1/audience/analytics.ts`.
   - Delete `course.ts`, and move its funnel read to `services/v1/marketing.ts`.
   - Delete `getCourseAnalytics` and `buildCourseStudentAnalytics` from `packages/core/src/services/course/course.ts` once `rg` shows no callers.

3. **Validation:**
   - `validation/public-api/insights{,-responses}.ts` take over `analytics{,-responses}.ts` (`ZPublicApiAnalytics*`).
   - Split the old org and course analytics schemas into `marketing{,-responses}.ts`, `compliance{,-responses}.ts` and `organization-overview{,-responses}.ts`.
   - `ZPublicApiLearnerAnalytics*` → `ZPublicApiStudentAnalytics*` in `audience`.
   - Rename JSON fields that say "learner" in responses this PR touches (Appendix A, command 5).
   - `packages/utils/src/insights/` → `packages/utils/src/analytics/`, and the `./insights` export → `./analytics`.
   - `constants/insights-catalog.ts` → `analytics-catalog.ts`.

4. **Scopes and metering**, all in one commit:
   - `ANALYTICS_QUERY_PATH` in `public-api-scopes.ts`
   - `MCP_V1_ROUTE_TOOL_MAP`: every row of §2.3, with org-page keys built from `ORG_ANALYTICS_PAGE`
   - `MCP_TOOL_CREDIT_COST` and the read list in `getMcpAutomationCategory`
   - rate-limit keys `analytics_query:{keyId}` and `analytics_snapshot:{keyId}`, and their messages

5. **MCP:**
   - tool files per §2.3, with org-page tool names and descriptions built from `ORG_ANALYTICS_PAGE`
   - `api-client.ts` methods
   - `server.ts` registration
   - version `0.5.0`

6. **OpenAPI metadata** (`packages/utils/src/openapi/public-api.ts`):
   - `OPERATION_SUMMARIES`, one per new path:
     - "Get the {{PAGE}} dashboard for the organization"
     - "List students on the {{PAGE}} page"
     - "List {{PAGE}} sources, metrics and filters"
     - "Run a {{PAGE}} analytics query"
     - "Get a course's analytics"
     - "Get a cohort's analytics"
     - "Get marketing analytics"
     - "Get a course's marketing funnel"
     - "Get compliance analytics"
     - "List compliance status per student"
     - "Get the organization overview"
     - "Get a student's analytics"
   - `OPERATION_TAGS`
   - Tags:
     - `{{PAGE}}`: "The numbers on the organization's {{PAGE}} page and on each course's and cohort's Analytics page"
     - `Marketing`
     - `Compliance`
   - Delete `Analytics Insights` and the old `Analytics` tag.

7. **Tests:**
   - Rename and rewrite every insight-named test in §1 of the inventory.
   - Move the old analytics route and service tests to marketing, compliance, overview and audience.
   - Update `mcp.test.ts`, `server.test.ts`, `v1-mcp-usage.test.ts`, `public-api-scopes.test.ts` and `routes-v1-cohort-metering.test.ts` (`ANALYTICS_CASES`).
   - Regenerate `public-api-analytics-contract.test.ts.snap`.

8. **Guards** (§5.4).

9. **Developer docs:**
   - `apps/docs/content/docs/api/insights.mdx` → `api/analytics.mdx`:
     - Open with the menu: **Analytics** in the dashboard has {{PAGE}}, Marketing and Compliance, and the API mirrors it.
     - Cover the {{PAGE}} endpoints (org, course and cohort).
     - Add short sections pointing at the Marketing, Compliance and Overview reference.
     - Fix the search-caching claim (r4562708208): searches bypass the cache.
   - `blume.config.ts`:
     - `API_SECTIONS`: one section labelled `Analytics` with tags `{{PAGE}}`, `Marketing` and `Compliance`. `Organization` and `Audience` stay where they are.
     - Getting started `'/api/insights'` → `'/api/analytics'`.
   - `api/index.mdx`: replace the "Analytics" and "Insights" bullets with one "Analytics: {{PAGE}}, Marketing and Compliance" bullet.
   - `rate-limits.mdx`, `errors.mdx`, `developers/mcp/{index,access-and-limits}.mdx`: "insights queries/snapshots" → "{{PAGE}} analytics queries" and "analytics snapshots".
   - `developers/oauth.mdx` scope row: "`analytics:read`: everything under Analytics ({{PAGE}}, Marketing, Compliance), the organization overview, and student analytics".
   - `packages/mcp/README.md`:
     - the tool list and analytics section (L130-139, L314, L367-383), grouped as {{PAGE}}, Marketing, Compliance and Other
     - the search-caching claim (r4562708327)
   - Help: `integrations-and-automation/understand-mcp-limits-and-permissions.mdx` and `understand-classroomio-mcp.mdx`.

10. **Release note** (PR description and MCP package changelog):
    - first the two changed-meaning names (§3)
    - then the removed `GET /analytics` and `get_org_analytics`
    - then every old → new pair from §2.2 and §2.3

## 5. Keeping the docs true

### 5.1 Every commit

Follow `skills/stage-and-commit/SKILL.md` step 4: an independent read-only sub agent checks `git diff --cached` against the code. Fix and stage its findings in the same commit, recapture or remove stale screenshots, and re-run the check when a fix touches code.

Also give it the places the CI bot skips:
- `prd/`, `prototypes/`, `PRD-TRACKER.md`, `ONBOARDING.md`
- `apps/help/help-center-content-backlog.md`, `apps/help/blume.config.ts`
- `apps/docs/blume.config.ts`, `packages/utils/src/openapi/public-api.ts`
- MCP tool description strings
- `docs.ts` route descriptions

### 5.2 Surfaces that state the same contract (change together, same commit)

| Contract | All the places it is written |
| --- | --- |
| Endpoint list and paths | route files, `OPERATION_SUMMARIES`/`OPERATION_TAGS`, `MCP_V1_ROUTE_TOOL_MAP`, `public-api-scopes.ts`, `api-client.ts`, `api/analytics.mdx`, `packages/mcp/README.md`, route tests |
| Tool names | tool files, `server.ts`, `MCP_TOOL_CREDIT_COST`, `getMcpAutomationCategory`, `MCP_V1_ROUTE_TOOL_MAP`, `packages/mcp/README.md`, `server.test.ts`, `mcp.test.ts`, `v1-mcp-usage.test.ts` |
| Rate limits and fail-closed rules | limiter config, `rate-limits.mdx`, `errors.mdx`, `developers/mcp/access-and-limits.mdx`, help `understand-mcp-limits-and-permissions.mdx`, `packages/mcp/README.md` |
| Caching and freshness | `query.ts`, `snapshot.ts`, `api/analytics.mdx`, `packages/mcp/README.md`, tool descriptions |
| Who can call it | `authorize.ts`, `docs.ts` rule constants, tool descriptions, `api/analytics.mdx`, `packages/mcp/README.md`, help roles tables |
| Menu, page names and routes | `org-navigation.ts`, `ORG_ANALYTICS_PAGE`, the route folders and redirects, `en.json` (`org_navigation.*`, `analytics.org_page_title`), every help article in §4.2 step 11b, `apps/help/blume.config.ts`, `ONBOARDING.md`, the PRD placement table, the prototype nav, and the duplicate pairs `organization-and-team/roles-and-permissions.mdx` ↔ `troubleshooting-and-reference/roles-and-permissions-reference.mdx`, `reference/cohorts.mdx` ↔ `troubleshooting-and-reference/cohort.mdx`, `reference/exports.mdx` ↔ `troubleshooting-and-reference/exports-reference.mdx` |
| The org page name `{{PAGE}}` | every row of Appendix B |

### 5.3 Screenshots

- Capture only from the PR that ships the UI.
- Open each image before staging, and check its tab, state, columns, sidebar labels and breadcrumb against the article and alt text. Earlier recaptures regressed on exactly these.
- The skill frames with Node 20 (`v20.19.3`), but `apps/help/.nvmrc` is `24.22.1`. Use whichever the frame script runs under, and fix the skill text in a separate commit that touches only `skills/`.

### 5.4 Guards (tests)

1. **MCP sync:** the tools registered by `createMcpServer` (plus local-only tools) equal the keys of `MCP_TOOL_CREDIT_COST`, equal the tool names in `packages/mcp/README.md`, and every value of `MCP_V1_ROUTE_TOOL_MAP` is a registered tool. (#1495)
2. **OpenAPI placement:** every tag in the generated spec is in `apps/docs/blume.config.ts` `API_SECTIONS`, every path has an `OPERATION_SUMMARIES` entry, and every summary key is a real path. (#1495)
3. **Forbidden words:** no generated OpenAPI path, tag or summary, MCP tool name or description, `ErrorCodes` key, or `en.json` key contains `insight`. No public path or tool name contains `learner`. No help article contains "Stats →". (#1495)
4. **Org page name consistency** (`analytics-page-name.test.ts`, #1495). It reads `ORG_ANALYTICS_PAGE` and asserts:
   - `apps/dashboard/src/routes/(app)/org/[slug]/analytics/<slug>/+page.svelte` exists
   - `en.json` `org_navigation.org_analytics` and `analytics.org_page_title` equal `label`
   - the generated spec has a tag named `label`, placed in `API_SECTIONS` under "Analytics"
   - `packages/mcp/README.md` lists `get_<toolSegment>_analytics`, `list_<toolSegment>_students`, `get_<toolSegment>_catalog` and `query_<toolSegment>_analytics`
   - the help files in §4.2 step 11b contain "**Analytics → `label`**" and no other "**Analytics → X**" naming the org engine page

   When someone changes the name, this test lists every place they missed.
5. **Docs preview:** add a generate-only mode to `apps/api/scripts/upload-openapi-spec.ts` that writes `apps/docs/openapi/public-api.json`, and a flag on `apps/docs/scripts/fetch-openapi.mjs` that skips the fetch. Reviewers can then see the reference before merge. (#1495)

## 6. Verification

Run on Node 24 (`export PATH="$HOME/.nvm/versions/node/v24.22.1/bin:$PATH"`), per PR, before each push.

1. `pnpm --filter @cio/api^... build && pnpm --filter @cio/api build`
2. **Dashboard:** `svelte-check` and `vitest`. Do not run the dashboard Vite build.
3. `pnpm --filter @cio/utils test`, `pnpm --filter @classroomio/mcp test`, and the api vitest suite.
4. **DB-backed api tests** on a throwaway database (migrate, push, reference rows).
5. **Migration check** from `CLAUDE.md` against `main` (#1444).
6. **Translations:** the placeholder check across the 12 locales, plus a manual read of the `{{PAGE}}` translations (#1445).
7. **Help and docs:** `pnpm --filter @cio/help validate && pnpm --filter @cio/help build`, and the docs validate against the locally generated spec.
8. **Dashboard by hand** (#1445), as an admin and as a tutor:
   - the menu reads Analytics → {{PAGE}} / Marketing / Compliance, and tutors see only Marketing
   - `/org/[slug]/analytics` redirects by role
   - `/org/[slug]/compliance` redirects
   - breadcrumbs read "Analytics > {{PAGE}}"
   - the course and cohort sidebars still say Analytics
9. `pnpm format:changed`, then `pnpm format:check`.
10. **Final sweep on the #1495 head.** Run Appendix A. The expected result is:
    - zero `insight` matches outside §2.6 and unrelated prose
    - zero public `learner` names
    - zero "Stats →" in docs
    - every `analytics` match is the engine, the Analytics menu, or a §2.6 storage name
11. **One fact-check sub agent** over `git diff origin/main...<1495 head>` against every surface in §5.1 and §5.2.
12. **Hosted MCP by hand:**
    - List the tools.
    - With an `mcp` key and with an OAuth token, call `get_{{page_snake}}_analytics`, `get_course_analytics`, `get_cohort_analytics`, `query_{{page_snake}}_analytics`, `get_marketing_analytics`, `list_compliance_students` and `get_student_analytics`.
    - Confirm the metering rows carry the new tool names.

## 7. Communication

**PR titles:**
- #1444 `feat(analytics): add the analytics engine, internal API and docs`
- #1445 `feat(analytics): add the Analytics menu, dashboards and reporting UI`
- #1495 `feat(analytics): expose analytics, marketing and compliance through the public API and MCP`

**PR descriptions:** each links this plan. #1495 carries the release note and the docs sidebar tree that `skills/public-api-review/SKILL.md` requires.

**Reply on the review**, once the push is up:

> Renamed throughout, and the dashboard now matches. The org "Stats" menu is now **Analytics**, with **{{PAGE}}**, **Marketing** and **Compliance** under it, and the API mirrors it: `/analytics/{{page}}`, `/analytics/marketing`, `/analytics/compliance`, plus `/courses/{id}/analytics` and `/cohorts/{id}/analytics` for the course and cohort pages. MCP tools follow the paths (`get_{{page_snake}}_analytics`, `query_{{page_snake}}_analytics`, `get_marketing_analytics`, `get_compliance_analytics`, …). "insights" is gone from code, keys, error codes and docs. The old mixed `GET /analytics` is removed, and its sections moved to the page they belong to. No aliases, matching how #1556 handled its tool removals. The mapping is in the #1495 description.

## 8. Out of scope

- **Per-student numbers.** The engine counts optional (`completionPolicy: 'none'`) content in progress denominators; the audience and course-people student pages do not. Fix that separately.
- **A course-level compliance endpoint** (`/courses/{id}/compliance`). It would be a feature, not a rename.
- **Implementation review findings** reported earlier (snapshot donut skip, effective range, `total`, page bounds, docs examples). Fix them in #1495 alongside this work, but track them separately.

## Appendix A: inventory commands

Run from the repo root on the #1495 head. In zsh, quote `"${REF}:path"`.

```bash
git grep -n -i insight -- ':!prototypes/alternatives-site' ':!prototypes/seo-alternatives' ':!prototypes/landing-customer-education' ':!prototypes/lesson-reader' ':!prototypes/org-landing-page' ':!prototypes/mobile-app' ':!prototypes/zapier-integration' ':!apps/website' ':!skills' ':!CHANGELOG.md' ':!CONTRIBUTING.md' ':!prd/course-cohorts' ':!prd/lesson-reader' ':!packages/storybook' ':!packages/db/src/utils/seed/platform-templates' ':!apps/help/help-center-sidebar-proposal.html'
```

```bash
git ls-files | grep -i insight
```

```bash
git grep -n -E "'/[^']*'" -- apps/api/src/routes/v1 apps/api/src/middlewares/v1-mcp-usage.ts | grep -i -E "analytic|marketing|compliance|overview|learner"
```

```bash
git grep -l -E "t\(['\"]analytics\." -- apps/dashboard/src
```

```bash
git grep -n -i learner -- packages/utils/src/validation/public-api packages/mcp/src apps/api/src/routes/v1 packages/utils/src/openapi
```

```bash
git grep -n -E "Stats →|\bStats\b" -- apps/help/content apps/help/blume.config.ts apps/docs/content packages/mcp/README.md ONBOARDING.md prd prototypes/analytics-dashboards
```

## Appendix B: changing the org page name

Use this when the org engine page is renamed after this plan ships. Example: from `Academy` (`academy`, `academy`) to `NewName` (`new-name`, `new_name`). Do it in one PR. The guard in §5.4 step 4 fails until every row is done.

**Before choosing,** check the new name against the constraints in §0.

| # | Surface | Change |
| --- | --- | --- |
| 1 | `packages/utils/src/constants/analytics-pages.ts` | `label`, `slug`, `toolSegment`. This updates the public route mount, `MCP_V1_ROUTE_TOOL_MAP`, the scope-path regex, the MCP tool names and descriptions, `OPERATION_SUMMARIES` keys, the OpenAPI tag and the dashboard nav path. |
| 2 | Dashboard route folder | `git mv "apps/dashboard/src/routes/(app)/org/[slug]/analytics/<old-slug>" ".../analytics/<new-slug>"` |
| 3 | Dashboard redirect | Leave `(app)/org/[slug]/analytics/+page.server.ts` as it is: it reads the constant. Add a redirect folder at the **old** slug (`analytics/<old-slug>/+page.server.ts`, `redirect(308, …)`) if the old URL was published. |
| 4 | Translations | `org_navigation.org_analytics` and `analytics.org_page_title` in `en.json`, then `pnpm translate` and a manual read of the 11 other locales. Keys never change. |
| 5 | `OPERATION_SUMMARIES` text and tag description | Summaries containing the label (§4.3 step 6). |
| 6 | `apps/docs/blume.config.ts` | The tag name in the "Analytics" `API_SECTIONS` entry. |
| 7 | Developer docs | `api/analytics.mdx`, `api/index.mdx`, `rate-limits.mdx`, `errors.mdx`, `developers/mcp/{index,access-and-limits}.mdx`, `developers/oauth.mdx`: label, paths and tool names. |
| 8 | `packages/mcp/README.md` | Tool names, the group heading and the paths. Bump the MCP package minor version, since tool names change. |
| 9 | Help articles | Every file in §4.2 step 11b that contains "**Analytics → {{PAGE}}**", "**{{PAGE}}**" for the org page, "## Marketing or {{PAGE}}?" or "Organization {{PAGE}} page" alt text. Find them with `git grep -n -E "Analytics → <Old>\|\*\*<Old>\*\*\|or <Old>\?\|Organization <Old> page" -- apps/help/content`. |
| 10 | Help sidebar | Only if a label names the page; today none do. |
| 11 | Help screenshots | Every image showing the Analytics submenu or the org page heading or breadcrumb (§4.2 step 11e list, plus anything the sub-agent pass finds). |
| 12 | `ONBOARDING.md` | The "**Analytics → {{PAGE}}**" lines and the `/org/[slug]/analytics/{{page}}` path. |
| 13 | `prd/analytics-dashboards/README.md`, `prototypes/analytics-dashboards/` | Placement table, Phase 0, the prototype nav label and route. |
| 14 | This plan | The §0 table values. |
| 15 | Tests | Snapshot and contract tests that print paths or tool names. Regenerate, then review that only the name changed. |
| 16 | Release note | Public API paths and MCP tool names change. That is breaking: say so, per §3. |

Nothing else changes. The engine module, `OrgAnalyticsPage`, translation keys, error codes, settings key, cache keys, internal RPC routes, the scope and the course and cohort pages are stable by design (§0).
