# Zapier Integration PRD

## Status

- Draft

## Purpose

Ship a Zapier integration that lets non-engineering teams connect ClassroomIO to the tools they already use (CRMs, HRIS, Slack, spreadsheets, email platforms, ticketing) without writing code. The integration must work today against the existing public API and silently upgrade to real-time delivery as the webhooks platform lands.

## Problem Statement

ClassroomIO already exposes a versioned public REST API at `/public-api/v1/*` and ships an MCP server, but those surfaces only serve engineering teams. The customers who run training programs (HR, customer success, sales enablement) cannot:

- Enroll learners automatically when a contact reaches a CRM stage.
- Sync course completions and certificates to HRIS, Drive, or BI warehouses.
- Trigger Slack/email workflows on learner activity.
- Connect ClassroomIO into the no-code stacks (Zapier, Make, n8n, Pipedream) that those teams already operate.

The dashboard already advertises Zapier as an `Automation` tab (`/org/[slug]/automation/zapier`) and the automation-key system supports `type: 'zapier'`, but the page is a coming-soon callout and no Zapier app exists. We have customers who need this integration shipped now.

## Confirmed Decisions

These are locked before implementation begins:

1. **Distribution**: ship as a private Zapier app via a single shared invite URL first; promote to the public Zapier directory after ~5 paying orgs are using it and v1 is stable.
2. **Plan gating**: Early Adopter+ only. Access is binary — either your plan includes Zapier or it doesn't. No monthly task credits. Per-minute rate limits still apply as abuse protection.
3. **Plan downgrade behavior**: hard cutoff. When an org drops below Early Adopter, all existing OAuth grants are revoked immediately. No grace period.
4. **Authentication**: OAuth 2.0 authorization code flow with refresh tokens, shipping in v1. No API-key-paste fallback for Zapier. Direct API consumers (Make, n8n, Pipedream, raw curl) keep using existing `type: 'api'` automation keys; Zapier exclusively uses OAuth.
5. **Scopes**: `zapier:read` and `zapier:write` exist as OAuth scopes. Zapier requests both at connection time; the consent screen lets admins downgrade to read-only.
6. **Triggers in v1**: polling only. No webhook dependency. Real-time REST Hooks ship in v1.1 once the webhooks PRD lands.
7. **Trigger scope**: org-wide by default, with optional `Course` and `Tag` dropdown filters per trigger. No separate per-course trigger duplicates.
8. **iPaaS parity**: the public REST API is the integration surface. Zapier connects via OAuth; Make / n8n / Pipedream can use OAuth too (all three support it) or `type: 'api'` keys for raw HTTP. The Zapier app is packaging only — no Zapier-specific endpoints or payloads.
9. **Repo location**: `apps/zapier`. The Zapier app is a deployable that gets `zapier push`-ed to Zapier's cloud. Nothing else in the monorepo imports from it, so it sits next to `apps/api` and `apps/dashboard` rather than in `packages/`.
10. **Revoke UX**: per-grant revoke is available in the dashboard for the safety-net case (compromised Zapier account, employee offboarding). No bulk "Disconnect Zapier" button — customers managing their integration normally do so from inside Zapier.

## Current-State Audit

| Capability | Current State | Notes |
| --- | --- | --- |
| Org-scoped automation keys | available | `organization_api_key` already supports `type: 'mcp' \| 'api' \| 'zapier'`. Rotation, revoke, last-used tracking all shipped. The `'zapier'` value becomes unused under the OAuth model (see Technical Design). |
| Bearer auth middleware | available | `automationKeyMiddleware` + `automationKeyScopesMiddleware` in `apps/api/src/middlewares/`. Will be extended to also accept OAuth access tokens. |
| OAuth 2.0 server | missing | No OAuth authorization-code flow exists on the API. Required for v1. |
| OAuth consent screen | missing | No dashboard consent screen for third-party app authorization. Required for v1. |
| Public REST API | partial | `/public-api/v1/courses` and `/public-api/v1/audience` shipped. Tags, announcements, certificates, course clone, full audience update still missing. |
| Test-connection endpoint | missing | No `GET /public-api/v1/me` for Zapier's auth-test step. |
| Polling cursor / since filter | missing | List endpoints support `page/limit` but no `?since=` or `?cursor=` for stable Zapier polling. |
| Email/slug search filters | missing | Audience list does not accept `?email=`; courses list does not accept `?slug=` or `?title=`. |
| Webhooks delivery | missing | `prd/webhooks/README.md` written but unshipped. Not a v1 dependency. |
| Dashboard Zapier tab | partial | `/org/[slug]/automation/zapier` route exists but renders a `coming_soon` callout. Will become an OAuth-grant management page, not a key-management page. |
| Automation usage tracking | available | `organization_automation_usage` already records `read \| write \| publish` per key. Will be extended to record per OAuth grant. |
| Plan gating utilities | available | `MCP_AUTOMATION_LIMITS_BY_PLAN` pattern in `packages/utils/src/plans/automation.ts` is the reference for Zapier rate limits. |
| Marketing positioning | partial | `apps/website/src/routes/automation/+page.svelte` advertises API + Webhooks + MCP. Does not yet mention Zapier. |

## Data Sources Checked

- `packages/db/src/schema.ts` (`organization_api_key`, `organization_automation_usage`)
- `packages/utils/src/validation/organization/automation-key.ts`
- `packages/utils/src/validation/public-api/audience.ts`
- `packages/utils/src/validation/public-api/course.ts`
- `packages/utils/src/plans/automation.ts`
- `apps/api/src/middlewares/automation-key.ts`
- `apps/api/src/middlewares/automation-key-scopes.ts`
- `apps/api/src/routes/v1/courses.ts`
- `apps/api/src/routes/v1/audience.ts`
- `apps/api/src/services/v1/course.ts`
- `apps/api/src/services/v1/audience.ts`
- `apps/api/src/services/organization/automation-key.ts`
- `apps/api/src/services/course/{invite,people,certificate,completion,clone,compliance}.ts`
- `apps/api/src/services/submission/submission.ts`
- `apps/api/src/services/newsfeed/newsfeed.ts`
- `apps/api/src/services/tag.ts`
- `apps/dashboard/src/lib/features/automation/pages/{mcp,zapier}.svelte`
- `apps/website/src/routes/automation/+page.svelte`
- `prd/public-api [DONE]/README.md`
- `prd/webhooks/README.md`

## Product Goals

1. An org admin can connect ClassroomIO from inside Zapier in under 60 seconds without copying or pasting any token. The flow is: click Connect on Zapier → log into ClassroomIO → consent → done.
2. Non-engineering customers can build the three canonical Zaps without code:
   - CRM new customer → enroll in onboarding course.
   - Certificate issued → upload to HRIS / Drive.
   - Exercise submitted → notify tutor in Slack.
3. The Zapier app exposes a useful but small surface: 5 triggers, 5 actions, 2 searches in v1.
4. Same OAuth flow and REST endpoints work for Make, n8n, and Pipedream — they support OAuth natively, so no additional development is needed beyond the Zapier package.
5. Connected Zapier instances are visible to admins in the dashboard, with per-grant revoke for the safety-net case.
6. The integration is forward-compatible with webhooks: when REST Hooks become available, high-volume triggers (exercise submitted, lesson completed) upgrade with no UX change for the Zapier user.

## Non-Goals (v1)

1. Public listing in the Zapier directory (deferred until v1 is validated with ~5 customers).
2. Real-time triggers via REST Hooks (deferred to v1.1, gated on `prd/webhooks`).
3. High-volume triggers (`exercise.submitted`, `lesson.completed`) that are impractical on polling.
4. Make / n8n / Pipedream apps as separate packaged listings (the REST API + OAuth supports them; no curated app yet).
5. Free / Basic plan access (gated to Early Adopter+).
6. Inbound webhooks from Zapier to ClassroomIO (Zapier writes via REST actions, not webhooks).
7. Monthly task credits or Zapier-specific credit budgets (Zapier is a binary plan feature; per-minute rate limits remain for abuse protection only).
8. Custom triggers / dynamic events authored by the customer.
9. PKCE / device-code / implicit OAuth grants (only authorization_code + refresh_token grants ship in v1).
10. OAuth dynamic client registration (Zapier is a hard-coded confidential client; other iPaaS vendors are added by hand in v1).
11. Bulk "Disconnect Zapier" button in the dashboard (customers disconnect from Zapier's side; admins use per-grant revoke for safety-net cases).
12. Branding review and Zapier marketplace screenshots (post-private validation).

## User Stories

1. As an HR ops admin, I want a new hire in BambooHR to auto-enroll in the onboarding course so I don't manage a spreadsheet.
2. As a sales engineer, I want a HubSpot deal moving to "Customer" to enroll the buyer in the product training so onboarding starts on day zero.
3. As an L&D admin, I want every `certificate.issued` to upload a PDF to the employee's Google Drive folder so my audit trail lives in the source-of-truth.
4. As a tutor, I want every `exercise.submitted` for my course to DM me in Slack so I can grade quickly.
5. As a finance ops admin, I want every `payment_request.created` to create a HubSpot deal so I don't reconcile manually.
6. As an org admin, I want a Zapier-scoped key separate from my raw API keys so I can revoke Zapier without breaking my internal integrations.
7. As an org admin, I want my Zapier usage to count against the same plan limits as MCP and API so I'm not over-billed by tool sprawl.

## UX Requirements

### Dashboard Zapier Tab

Route: `/org/[slug]/automation/zapier`. Diverges from the MCP page because Zapier authenticates via OAuth grants, not bearer keys.

Required sections (top to bottom):

1. **Admin permission callout** for non-admin users.
2. **Plan gating callout** for orgs below Early Adopter — copy "Upgrade to Early Adopter to use Zapier" with an upgrade CTA. No connect flow visible.
3. **"Connect on Zapier" CTA** linking to the shared private invite URL (later the public listing).
4. **Connected Zapier instances table** — one row per active OAuth grant. Columns: label (e.g. "Zapier — workspace abc.com"), scopes (`read` / `read+write`), last used, connected at, status. Row action: revoke.
5. **Rate limit summary** — current per-minute read and write caps for the org's plan.
6. **Setup guide** — step-by-step screenshots of the Connect flow from inside Zapier (click Connect → log in → consent → done).
7. **Docs callout** linking to `apps/docs` Zapier guide.

Reuse where possible:

- Read OAuth grants and usage via a new `automationOauth.svelte.ts` API class in `apps/dashboard/src/lib/features/automation/api/`.
- Shared types live in `apps/dashboard/src/lib/features/automation/utils/types.ts`.
- Replace the current placeholder in `apps/dashboard/src/lib/features/automation/pages/zapier.svelte`.

### Consent Screen

Route: `/oauth/consent` in the dashboard. Triggered by Zapier's `authorize` redirect.

Behavior:

1. If the user is not logged in, redirect to the existing login flow with a `redirect_to=/oauth/consent?...` parameter so they return here after auth.
2. Render the consenting org's name, the requesting app (Zapier), the requested scopes (`zapier:read`, `zapier:write`), and the redirect URI.
3. For multi-org users, show an org picker — only orgs where the user is admin AND the plan is Early Adopter+ appear.
4. Show two buttons: `Authorize` and `Deny`. On `Authorize`, the dashboard POSTs to the API to issue an authorization code, then redirects to Zapier's callback with `?code=…&state=…`. On `Deny`, redirects to Zapier's callback with `?error=access_denied&state=…`.
5. Admins can untick `zapier:write` on the consent screen to grant a read-only connection.

### Zapier App UX

The Zapier app surface, as seen by a Zap author:

- **App name**: ClassroomIO
- **Auth flow**: OAuth 2.0. User clicks `Connect` in Zapier → Zapier opens our `/oauth/authorize` URL → user logs in (if needed) and consents → redirected back to Zapier with a code → Zapier exchanges for tokens silently. No copy-paste.
- **Test step**: after token exchange, Zapier calls `GET /public-api/v1/me` with the new access token. Shows `{org.name}` on Zapier's connections page.
- **Trigger picker** lists the 5 triggers below with one-line descriptions matching the website's voice.
- **Action picker** lists the 5 actions below.
- **Search picker** lists the 2 searches below.
- **Dynamic dropdowns**:
  - `Course` dropdown is powered by `GET /public-api/v1/courses?fields=id,title&limit=100`.
  - `Tag` dropdown is powered by `GET /public-api/v1/tags?limit=100` (new endpoint, see Technical Design).
- **Sample data**: every trigger ships a static sample record so Zap authors can build downstream steps without firing a real event.
- **Token refresh**: the Zapier app uses Zapier's built-in `refresh_token` handling — Zapier auto-refreshes access tokens via our `/oauth/token` endpoint when they expire.

### Marketing Surface

Update `apps/website/src/routes/automation/+page.svelte` and the home page automation band to mention Zapier alongside REST API + Webhooks + MCP. Add a `Connect via Zapier` row to the integrations section. Update the `automate-section.svelte` copy to name Zapier explicitly ("New hire joins BambooHR → enrolled via Zapier").

This marketing work is a follow-up PR after the integration is private-listed. Tracked in this PRD but does not gate v1 ship.

## Trigger Catalog (v1)

All triggers ship as polling. Each trigger emits `createdAt`-ordered records and dedupes by `id` on the Zapier side.

| Trigger | Description | Source endpoint | Optional filters |
| --- | --- | --- | --- |
| `new_audience_member` | New student added to the organization audience | `GET /public-api/v1/audience?sortBy=createdAt&sortOrder=desc` | none |
| `student_enrolled_in_course` | A student was added to a course (invite accepted or direct add) | `GET /public-api/v1/audience/enrollments?sortBy=createdAt&sortOrder=desc` (new) | `courseId`, `tagId` |
| `course_completed` | A student completed all required lessons in a course | `GET /public-api/v1/course-completions?sortBy=completedAt&sortOrder=desc` (new) | `courseId`, `tagId` |
| `certificate_issued` | A certificate was issued for a learner | `GET /public-api/v1/certificates?sortBy=issuedAt&sortOrder=desc` (new) | `courseId` |
| `payment_request_created` | A learner submitted a payment request form | `GET /public-api/v1/payment-requests?sortBy=createdAt&sortOrder=desc` (new) | `courseId` |

Deferred to v1.1 (require webhooks for sane volume / latency):

- `exercise_submitted`
- `exercise_graded`
- `lesson_completed`
- `newsfeed_post_created`
- `community_question_created`
- `compliance_course_overdue`

Deferred to v2 (no current customer ask):

- `program_completed`

## Action Catalog (v1)

Each action is a thin Zapier wrapper over an existing or new public API write endpoint.

| Action | Description | Endpoint | Scope |
| --- | --- | --- | --- |
| `enroll_student_in_course` | Find-or-create the student by email and assign to one or more courses | `POST /public-api/v1/audience` + `POST /public-api/v1/audience/assign-courses` | `zapier:write` |
| `add_student` | Create an audience member without course assignment | `POST /public-api/v1/audience` | `zapier:write` |
| `update_student` | Update audience member profile (name, email, custom attributes) | `PUT /public-api/v1/audience/:memberId` (extend payload schema) | `zapier:write` |
| `remove_student` | Remove a student from the organization | `DELETE /public-api/v1/audience/:memberId` | `zapier:write` |
| `tag_student` | Apply or remove a tag on an audience member | `POST /public-api/v1/audience/:memberId/tags` (new) | `zapier:write` |

Deferred to v1.1 (need new public API routes that aren't critical-path):

- `send_announcement` (newsfeed post)
- `issue_certificate`
- `clone_course_from_template`
- `publish_course_draft` (already an MCP tool; trivial to expose later)
- `create_payment_request`

## Search Catalog (v1)

| Search | Description | Endpoint |
| --- | --- | --- |
| `find_student_by_email` | Look up audience member by exact email | `GET /public-api/v1/audience?email=…` (new filter) |
| `find_course` | Look up a course by slug or title | `GET /public-api/v1/courses?slug=…` or `?title=…` (new filters) |

Both searches power Zapier's find-or-create pattern; together with the create actions, Zapier auto-generates "Find or Create Student" and "Find or Create Course" steps with no extra Zapier app code.

## Authentication and Scopes

### OAuth 2.0 server (new)

Implement the authorization_code + refresh_token grants from RFC 6749 only. No PKCE, implicit, device, or client_credentials grants in v1. Zapier is registered as a single confidential OAuth client.

Endpoints (hosted on the API):

| Endpoint | Method | Purpose |
| --- | --- | --- |
| `/oauth/authorize` | `GET` | Validates `client_id`, `redirect_uri`, `response_type=code`, `scope`, `state`. Redirects the browser to the dashboard consent screen `/oauth/consent`. |
| `/oauth/authorize/issue` | `POST` | Called by the dashboard consent screen after the admin clicks `Authorize`. Issues a single-use authorization code (TTL 60 seconds) bound to `org_id`, `client_id`, `scopes`, `redirect_uri`, and the consenting user. Returns the code to the dashboard, which redirects the browser to `redirect_uri?code=…&state=…`. |
| `/oauth/token` | `POST` | Exchanges an authorization code for an access token (TTL 1 hour) + refresh token (TTL 90 days). Also handles `grant_type=refresh_token`. |
| `/oauth/revoke` | `POST` | Revokes an access or refresh token (RFC 7009). |

Library choice: lean on `oauth4webapi` or roll a minimal implementation. The scope is narrow enough that hand-rolling is reasonable; pick during implementation kickoff.

### OAuth client registration

Zapier client credentials are stored as environment variables, not in the database, in v1:

- `ZAPIER_OAUTH_CLIENT_ID`
- `ZAPIER_OAUTH_CLIENT_SECRET`
- `ZAPIER_OAUTH_REDIRECT_URIS` (comma-separated list of allowed callbacks from Zapier's docs)

A `packages/utils/src/oauth/clients.ts` resolver returns the registered clients keyed by `client_id`. Adding Make / n8n / Pipedream later is a config-only change.

### Token storage

New tables (see Technical Design):

- `oauth_authorization_code` — short-lived single-use codes.
- `oauth_access_token` — hashed `Bearer` tokens.
- `oauth_refresh_token` — hashed long-lived tokens.

Every token row carries: `id`, `client_id`, `organization_id`, `granted_by_profile_id`, `scopes`, `created_at`, `expires_at`, `revoked_at`, `last_used_at`.

### Middleware integration

Extend `automationKeyMiddleware` to a unified `bearerAuthMiddleware` that:

1. Reads `Authorization: Bearer …`.
2. Tries to resolve the token as an OAuth access token (hash-and-lookup against `oauth_access_token`). If found and not expired or revoked, sets `c.set('orgId')`, `c.set('actorId', granted_by_profile_id)`, `c.set('authSource', 'oauth')`, `c.set('scopes', grant.scopes)`.
3. Falls back to the existing automation-key path (`organization_api_key`) for `type: 'api'` / `type: 'mcp'` consumers.
4. Returns 401 if neither path matches.

This means existing API keys keep working unchanged for Make / n8n / Pipedream users who prefer raw bearer tokens. Zapier-only consumers go through OAuth.

### Scopes

Two OAuth scopes:

- `zapier:read` — list, get, search on courses, audience, submissions, certificates, tags, completions, payment requests.
- `zapier:write` — create, update, delete on audience, course assignments, tags.

Scope-to-route map:

| Endpoint | Required scopes (OAuth) | Required scopes (API key fallback) |
| --- | --- | --- |
| `GET /public-api/v1/me` | `zapier:read` | `public_api:*` |
| All `GET /public-api/v1/*` triggers and searches | `zapier:read` | `public_api:*` |
| Audience / course / tag write endpoints | `zapier:write` | `public_api:*` |

`automationKeyScopesMiddleware` is extended to check whichever scope set applies based on `c.get('authSource')`.

### Dropping `type: 'zapier'` from API key types

Under the OAuth model, the dashboard never issues Zapier API keys. Update `ZOrganizationApiKeyType` in `packages/utils/src/validation/organization/automation-key.ts` to remove `'zapier'`. Existing rows are zero (the dashboard tab has always been a placeholder), so no migration is needed beyond the schema/enum change.

## Polling Contract

Every list endpoint exposed to Zapier triggers must guarantee:

1. **Stable sort**: `sortBy` and `sortOrder` defaulted to newest-first.
2. **Stable record ID**: each record returns an `id` that does not change across pages.
3. **`since` cursor**: accept an optional `?since=<ISO-8601>` query parameter so Zapier can request only records newer than the highest `createdAt` it has already seen. If `since` is absent, return the most recent page only.
4. **`limit` <= 100** with a default of 50.
5. **Idempotent**: identical query returns identical results within the polling window.

Zapier polls every 1–15 minutes depending on the customer's Zapier plan. Our endpoints must remain cheap to poll under that cadence.

## Future REST Hooks Upgrade Path

When `prd/webhooks/README.md` ships, we add to the Zapier app:

1. Replace the existing `subscribe` / `unsubscribe` no-ops with calls to the webhook management API (`POST /organization/webhooks` with a Zapier-managed endpoint).
2. Move the high-volume triggers (`exercise_submitted`, `lesson_completed`, `newsfeed_post_created`) to REST Hook mode and ship them in v1.1.
3. Keep the existing polling triggers as a fallback when the webhook URL is unreachable.

This is a Zapier-app-only change in v1.1 — the public API surface does not change shape.

## Plan Gating

Zapier is a binary plan feature. No monthly credit budgets.

Add `ZAPIER_AUTOMATION_LIMITS_BY_PLAN` to `packages/utils/src/plans/automation.ts`:

| Plan | Zapier enabled | Max active grants | Per-org reads / min | Per-org writes / min |
| --- | --- | --- | --- | --- |
| Basic | no | 0 | 0 | 0 |
| Early Adopter | yes | 5 | 120 | 40 |
| Enterprise | yes | 25 | 360 | 120 |

Enforcement points:

1. **At `/oauth/authorize`**: reject the request with `error=access_denied` if the consenting org's plan does not include Zapier, or if `max active grants` is already reached.
2. **At `bearerAuthMiddleware`** for OAuth tokens: reject with 403 + `code: PLAN_GATED` if the org's plan has dropped below Early Adopter since the grant was issued.
3. **At route entry**: rate-limit against the per-minute caps using the existing rate-limiter middleware, keyed by `(org_id, scope_category)`.

Usage tracking: every Zapier API call still increments `organization_automation_usage` with category `read` or `write` for visibility, but no credits are deducted.

Plan downgrade flow:

1. The plan-change service emits an internal event `organization.plan.changed`.
2. A handler in `apps/api/src/services/oauth/` checks whether the new plan disables Zapier.
3. If yes, revoke all active OAuth grants for the org by setting `revoked_at` on every related access and refresh token.
4. The dashboard Zapier tab then shows the plan-gating callout with an upgrade CTA.

Basic / free plan users still see the dashboard Zapier tab so they understand the feature exists. The Connect CTA is replaced by an upgrade CTA. No connect link is rendered.

## Technical Design

### Schema additions

In `packages/db/src/schema.ts`:

1. `oauth_authorization_code`
   - `id` (UUID, primary)
   - `code_hash` (string, indexed unique)
   - `client_id` (string)
   - `organization_id` (UUID, FK)
   - `granted_by_profile_id` (UUID, FK)
   - `redirect_uri` (string)
   - `scopes` (text[])
   - `created_at`, `expires_at` (60 s TTL)
   - `consumed_at` (nullable; codes are single-use)
2. `oauth_access_token`
   - `id` (UUID, primary)
   - `token_hash` (string, indexed unique)
   - `token_prefix` (first 6 chars for dashboard display)
   - `client_id`
   - `organization_id` (FK)
   - `granted_by_profile_id` (FK)
   - `refresh_token_id` (FK to `oauth_refresh_token`)
   - `scopes`
   - `created_at`, `expires_at` (1 h TTL)
   - `revoked_at`, `last_used_at`
3. `oauth_refresh_token`
   - `id` (UUID, primary)
   - `token_hash` (string, indexed unique)
   - `client_id`
   - `organization_id` (FK)
   - `granted_by_profile_id` (FK)
   - `scopes`
   - `label` (e.g., "Zapier — workspace abc.com" — derived from the Zapier callback URI host)
   - `created_at`, `expires_at` (90 d TTL, sliding)
   - `revoked_at`, `last_used_at`

Remove `'zapier'` from the `organization_api_key.type` enum (no migration since no rows use it).

### Validation Layer

Add new files:

- `packages/utils/src/validation/oauth/oauth.ts` — `ZOauthAuthorizeQuery`, `ZOauthIssueCodeBody`, `ZOauthTokenBody`, `ZOauthRevokeBody`, `ZOauthScope`.
- `packages/utils/src/validation/public-api/tag.ts`
- `packages/utils/src/validation/public-api/me.ts`
- `packages/utils/src/validation/public-api/enrollments.ts`
- `packages/utils/src/validation/public-api/completions.ts`
- `packages/utils/src/validation/public-api/certificates.ts`
- `packages/utils/src/validation/public-api/payment-requests.ts`

Extend:

- `packages/utils/src/validation/public-api/audience.ts` — accept `email` filter on `ZPublicApiAudienceQuery` and broaden `ZPublicApiUpdateAudience` to support full profile (name, locale, custom attributes).
- `packages/utils/src/validation/public-api/course.ts` — accept `slug` and `title` filters on the list query.
- `packages/utils/src/validation/organization/automation-key.ts` — remove `'zapier'` from `ZOrganizationApiKeyType`. The `'zapier:read'` / `'zapier:write'` scope strings live in the new OAuth scope enum, not in the automation-key scope enum.

### Query Layer

Add:

- `packages/db/src/queries/oauth/authorization-code.ts` — issue, consume, expire.
- `packages/db/src/queries/oauth/access-token.ts` — issue, lookup by hash, revoke, touch `last_used_at`.
- `packages/db/src/queries/oauth/refresh-token.ts` — issue, lookup by hash, revoke, list active grants per org.
- `packages/db/src/queries/course/completions.ts` — list completions ordered by `completedAt` with `since` cursor.
- `packages/db/src/queries/course/certificates.ts` — list issued certificates with `since` cursor.
- `packages/db/src/queries/course/payment-requests.ts` — list payment requests with `since` cursor.
- `packages/db/src/queries/organization/me.ts` — read org + grant metadata for the test-connection endpoint.

### Service Layer

New services:

- `apps/api/src/services/oauth/clients.ts` — load Zapier client config from env.
- `apps/api/src/services/oauth/authorize.ts` — validate authorize request, issue code on consent.
- `apps/api/src/services/oauth/token.ts` — exchange code for tokens, refresh tokens.
- `apps/api/src/services/oauth/revoke.ts` — revoke tokens.
- `apps/api/src/services/oauth/plan-guard.ts` — revoke all grants when an org drops below Early Adopter.
- `apps/api/src/services/v1/me.ts`
- `apps/api/src/services/v1/tag.ts`
- `apps/api/src/services/v1/enrollments.ts`
- `apps/api/src/services/v1/completions.ts`
- `apps/api/src/services/v1/certificates.ts`
- `apps/api/src/services/v1/payment-requests.ts`

Extend `apps/api/src/services/v1/audience.ts` to handle the broadened `update` payload and the `tag/untag` action.

Wire `oauth/plan-guard.ts` into the existing plan-change pathway in `apps/api/src/services/license.ts` so downgrades immediately revoke grants.

### Middleware Layer

- New: rename `automationKeyMiddleware` to `bearerAuthMiddleware` (or wrap it) so it tries OAuth tokens first, then falls back to `organization_api_key`.
- Extend `automationKeyScopesMiddleware` to honor `c.get('authSource')` and check OAuth scopes vs API-key scopes accordingly.

### Route Layer

New OAuth routes (mounted at the API root, not under `/public-api`):

- `GET /oauth/authorize`
- `POST /oauth/authorize/issue` (called by the dashboard consent screen with session auth, not bearer)
- `POST /oauth/token`
- `POST /oauth/revoke`

New public API routes (all under `/public-api/v1`):

- `GET /public-api/v1/me`
- `GET /public-api/v1/audience/enrollments`
- `GET /public-api/v1/course-completions`
- `GET /public-api/v1/certificates`
- `GET /public-api/v1/payment-requests`
- `GET /public-api/v1/tags`
- `POST /public-api/v1/audience/:memberId/tags`
- `DELETE /public-api/v1/audience/:memberId/tags/:tagId`

Public API routes follow the existing v1 pattern: `bearerAuthMiddleware` + `automationKeyScopesMiddleware` + `describeRoute` + `validator`. Each route returns a single response type per the routing rules in `AGENTS.md`.

### Dashboard Routes

New routes:

- `apps/dashboard/src/routes/(app)/oauth/consent/+page.svelte` — consent screen.
- `apps/dashboard/src/routes/(app)/oauth/consent/+page.server.ts` — load consent context (client, scopes, redirect URI, eligible orgs).

Replace:

- `apps/dashboard/src/lib/features/automation/pages/zapier.svelte` — new OAuth grant management page.
- `apps/dashboard/src/routes/(app)/org/[slug]/zapier/+page.svelte` and any associated `+page.server.ts` — hydrate grants list and rate-limit data.

New API class:

- `apps/dashboard/src/lib/features/automation/api/automation-oauth.svelte.ts` — list grants, revoke a grant, consent action.

### Zapier App (`apps/zapier`)

New workspace package:

```
apps/zapier/
├── package.json
├── tsconfig.json
├── index.ts                    # Zapier app entry
├── authentication.ts
├── triggers/
│   ├── new-audience-member.ts
│   ├── student-enrolled.ts
│   ├── course-completed.ts
│   ├── certificate-issued.ts
│   ├── payment-request-created.ts
│   └── program-completed.ts
├── creates/                    # Zapier name for "actions"
│   ├── enroll-student-in-course.ts
│   ├── add-student.ts
│   ├── update-student.ts
│   ├── remove-student.ts
│   └── tag-student.ts
├── searches/
│   ├── find-student-by-email.ts
│   └── find-course.ts
├── utils/
│   └── client.ts              # shared fetch wrapper, base URL, headers
└── test/
    └── *.test.ts
```

Dependencies (not introduced into root):

- `zapier-platform-core` (Zapier-required runtime).
- `@cio/utils` for typed payload schemas via workspace protocol.

Build/release flow:

- `pnpm --filter @cio/zapier build` — typechecks the app.
- `pnpm --filter @cio/zapier zapier:push` — uploads to Zapier under a private app version.
- `pnpm --filter @cio/zapier zapier:promote` — manual step to promote a tested version.

No CI auto-push. Promotion is a manual step gated on the on-call engineer.

## API and Docs

1. Every new `/public-api/v1/*` route added under this PRD is annotated with `describeRoute` so it lands in the existing OpenAPI generator.
2. Run `pnpm --filter @cio/api upload:openapi` after route additions.
3. Add a Zapier guide in `apps/docs`:
   - Connecting your account (create key in dashboard, paste in Zapier).
   - Trigger catalog with sample payloads.
   - Action catalog with required fields.
   - Search catalog.
   - Rate limits and plan limits.
   - Troubleshooting (key revoked, scope missing, plan downgrade).
4. Update `apps/website/src/routes/automation/+page.svelte` to add a Zapier section alongside REST API + Webhooks + MCP. Include the canonical Zaps as copy.
5. Add a `Connect on Zapier` button to `apps/website/src/lib/components/automate-section.svelte`.

## Rollout Plan

### Phase 1: OAuth server foundation

1. Schema: `oauth_authorization_code`, `oauth_access_token`, `oauth_refresh_token`.
2. Queries, services, validation for OAuth.
3. Routes: `/oauth/authorize`, `/oauth/authorize/issue`, `/oauth/token`, `/oauth/revoke`.
4. Extend `bearerAuthMiddleware` to resolve OAuth tokens before falling back to automation keys.
5. Add `zapier:read` / `zapier:write` scope enforcement to `automationKeyScopesMiddleware`.
6. Plan-guard hook into `license.ts` for downgrade revocation.
7. Drop `'zapier'` from `organization_api_key.type` enum.

### Phase 2: Consent screen + dashboard

1. Build `/oauth/consent` page in the dashboard with org picker, scope-edit, Authorize / Deny.
2. Replace `pages/zapier.svelte` placeholder with the OAuth grant management page.
3. Add `automation.zapier.*` translations (followed by `pnpm translate`).
4. Plan-gating callout for Basic plan.

### Phase 3: Public API surface

1. Add `GET /public-api/v1/me`.
2. Extend audience update payload + add `?email=` filter.
3. Add course list `?slug=` / `?title=` filters.
4. Add tag list + tag/untag audience endpoints.
5. Add `enrollments`, `course-completions`, `certificates`, `payment-requests` list endpoints with `?since=` cursors.
6. Build and upload OpenAPI spec.

### Phase 4: Zapier app

1. Scaffold `apps/zapier` with `zapier-platform-core` configured for OAuth 2.0.
2. Implement triggers, creates, searches against the public API.
3. Add dynamic dropdowns powered by `/courses` and `/tags`.
4. Add sample data for each trigger.
5. `zapier push` private app version 1.0.0.

### Phase 5: Private validation

1. Distribute the shared private invite URL to paying orgs.
2. Collect usage data via `organization_automation_usage`.
3. Iterate on copy, scopes UX, and field defaults based on Zap author feedback.
4. Update docs and marketing.

### Phase 6: Public listing

1. Submit to Zapier directory review.
2. Promote app version once approved.
3. Update marketing site and announce.

### Phase 7 (v1.1): REST Hooks upgrade

1. Wait for `prd/webhooks` ship.
2. Wire `subscribe` / `unsubscribe` to the webhook management API.
3. Promote `exercise_submitted`, `lesson_completed`, `newsfeed_post_created` to instant triggers.

### Phase 8 (v2): Programs, more actions, more iPaaS apps

1. Add `program_completed` trigger and `apps/zapier` integration.
2. Add `send_announcement`, `issue_certificate`, `clone_course_from_template`, `publish_course_draft`, `create_payment_request` actions.
3. Register Make / n8n / Pipedream as additional OAuth clients (config-only).
4. Consider native Make and Pipedream packages if customers ask.

## Success Metrics

1. >= 5 orgs connect a Zapier key within 30 days of private invite.
2. >= 100 Zap runs/week within 60 days of private invite.
3. p95 trigger latency under 5 minutes on the Early Adopter plan (Zapier polling cadence).
4. < 2% of Zap runs fail due to API errors (excluding user misconfiguration).
5. >= 80% of connected orgs use at least one trigger and one action (i.e., the integration is bidirectional, not one-way data export).
6. Zero security incidents related to leaked or misused Zapier keys.

## Risks and Mitigations

1. **OAuth server is a new attack surface.**
   - Mitigation: keep the implementation minimal (authorization_code + refresh_token only). Hash tokens at rest. Single-use authorization codes with 60-second TTL. Server-side scope validation. Add OAuth-specific security tests. Run a security review of the implementation before public listing.
2. **Polling latency dissatisfies customers expecting real-time.**
   - Mitigation: set expectation in dashboard and docs ("delivered within ~5 minutes on polling, instant after webhooks v1.1"). Prioritize webhooks PRD ship.
3. **`exercise_submitted` demand on polling.**
   - Mitigation: do not ship it in v1. Document that it lands with v1.1 / webhooks.
4. **Zapier's marketplace review rejects public listing.**
   - Mitigation: stay private until v1 is polished. Use private validation period to fix UX issues Zapier reviewers commonly flag (sample data, error messages, dropdown UX, OAuth flow edge cases).
5. **Plan gating frustrates Basic users who see the tab but cannot use it.**
   - Mitigation: clear upgrade CTA copy, and a docs link explaining why Zapier sits on Early Adopter+.
6. **Plan downgrade silently revokes grants and breaks live Zaps.**
   - Mitigation: surface a banner in the dashboard 7 days before a known billing-driven downgrade fires (where the billing system gives notice). For immediate downgrades, send a notification email naming each revoked grant and the Zaps that may be affected.
7. **Drift between Zapier app schema and public API schema.**
   - Mitigation: `apps/zapier` consumes types from `@cio/utils/validation/public-api` directly so a schema change at the API breaks the Zapier build at CI time.
8. **Shared private invite URL leaks publicly.**
   - Mitigation: enforce plan gating at the `/oauth/authorize` step regardless of who clicks Connect. Leakage of the invite URL is harmless because the OAuth flow still verifies the user is an admin of an Early Adopter+ org.

## Build and Verification Commands

1. `pnpm --filter @cio/utils build`
2. `pnpm --filter @cio/db build`
3. `pnpm --filter @cio/api build`
4. `pnpm --filter @cio/api upload:openapi`
5. `pnpm --filter @cio/dashboard build`
6. `pnpm --filter @cio/zapier build`
7. `pnpm --filter @cio/zapier zapier:push` (manual, gated)

Manual verification:

1. Install the Zapier app via the private invite URL while logged out — confirm Zapier prompts for ClassroomIO login during the OAuth handshake.
2. Complete the OAuth flow as an org admin on Early Adopter — confirm `Test Connection` in Zapier shows the org name returned by `GET /public-api/v1/me`.
3. Try the OAuth flow as a non-admin of the same org — confirm `Authorize` is hidden or disabled and Deny redirects with `error=access_denied`.
4. Try the OAuth flow on a Basic-plan org — confirm `/oauth/authorize` rejects with the upgrade CTA visible.
5. Untick `zapier:write` on the consent screen — confirm the resulting token only allows read endpoints and `403`s on write endpoints.
6. Build a Zap: `New audience member` → Slack message. Trigger by adding an audience member; receive Slack message within 5 minutes.
7. Build a Zap: HubSpot deal → `Enroll student in course`. Add a deal; confirm the audience member appears and is assigned.
8. Build a Zap: `Certificate issued` → Google Drive upload. Issue a cert; confirm the file appears.
9. Revoke the grant from the dashboard; confirm all three Zaps surface authentication errors on next run and Zapier shows a re-connect prompt.
10. Downgrade the org to Basic; confirm the dashboard tab shows the upgrade CTA, the existing grants are revoked immediately, and Zaps fail with a `PLAN_GATED` error.
11. Force an access token expiry; confirm Zapier transparently refreshes via `/oauth/token` without user interaction.

## Open Questions

1. Should we use `oauth4webapi` (lighter, OAuth-spec-compliant), `node-oauth2-server` (heavier but battle-tested), or hand-roll the minimal authorization_code + refresh_token grants? Decide at implementation kickoff.
2. Refresh-token rotation strategy: rotate on every refresh (safer, more complex) or keep the same refresh token across refreshes (simpler, Zapier-compatible)? Zapier supports both — confirm with Zapier docs during build.
3. Should the consent screen support cross-org consent in a single screen (one Zapier connection covers multiple orgs), or strictly one OAuth grant per org? v1 is one grant per org; cross-org is a v2 question if multi-org admins ask for it.
4. Where do we display `last_used_at` for a grant? Inside the dashboard grants table only, or also in an email digest? v1 is dashboard-only.
5. Do we expose any OAuth telemetry (token issue / refresh / revoke counts) to the internal admin tooling, or rely on database queries on demand?
