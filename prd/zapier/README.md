# Zapier Integration PRD

## Status

- Draft (v2). Rewritten after the webhooks PRD shipped: triggers are instant (REST Hooks), not polling.

## Purpose

Ship a Zapier integration that lets non-engineering teams connect ClassroomIO to the tools they already use (CRMs, HRIS, Slack, spreadsheets, email platforms, ticketing) without writing code. Triggers fire instantly from the shipped webhooks platform. Actions call the existing public REST API.

## At a Glance

### Triggers (ClassroomIO → Zapier: "when this happens in ClassroomIO, start a Zap")

| # | Trigger | What it does | Webhook event |
| --- | --- | --- | --- |
| 1 | New Course Enrollment | Fires when a student is added to a course, however it happened (invite, invite link, self-enroll, import, API, SSO, payment, admin, cohort). Includes the source. | `course.member.added` |
| 2 | Student Removed from Course | Fires when a student is removed from a course. Includes their progress at removal. | `course.member.removed` |
| 3 | Course Completed | Fires when a student completes all required lessons in a course. | `course.completed` |
| 4 | Certificate Issued | Fires when a certificate is issued to a learner. Includes certificate id, issue/expiry dates. | `course.certificate.issued` |
| 5 | Exercise Submitted | Fires when a student submits an exercise. | `course.submission.created` |
| 6 | Submission Status Changed | Fires when a submission is graded or its status changes. Includes previous and new status. | `course.submission.status_changed` |
| 7 | Lesson Completed | Fires when a student marks a lesson complete. | `lesson.completion.updated` (`isComplete: true`) |
| 8 | Course Invite Accepted | Fires when a student accepts a course invite. | `course.invite.accepted` |
| 9 | Payment Request Created | Fires when a learner submits a payment request for a course. | `course.payment_request.created` |
| 10 | New Organization Member | Fires when someone joins the organization (student, tutor, or admin). | `organization.member.added` |
| 11 | Compliance Status Changed | Fires when a learner's compliance record changes (compliant, overdue, expired, and so on). Includes due date and valid-until. | `compliance.record.status_changed` |
| 12 | Course Published | Fires when a course is published. | `course.published` |
| 13 | Live Session Scheduled | Fires when a lesson session is scheduled or rescheduled. Includes start time and call URL. | `lesson.session.scheduled` |
| 14 | Cohort Member Added | Fires when a student is added to a cohort. | `cohort.member.added` |

Optional filters per trigger (applied in the Zapier app): `Course` on triggers 1–9, 11–13; `Cohort` on 14; `Source` on trigger 1.

### Actions (Zapier → ClassroomIO: "do this in ClassroomIO")

| # | Action | What it does | Endpoint | Status |
| --- | --- | --- | --- | --- |
| 1 | Enroll Student in Course | Finds or creates the student by email and enrolls them in a course. | `POST /audience` + `POST /courses/:courseId/members` | exists |
| 2 | Add Student to Organization | Creates an audience member without enrolling them. | `POST /audience` | exists |
| 3 | Update Student | Updates name, email, or profile fields of an audience member. | `PUT /audience/:memberId` | exists (payload extension) |
| 4 | Remove Student from Organization | Removes a student from the organization. | `DELETE /audience/:memberId` | exists |
| 5 | Remove Student from Course | Removes a student from one course. | `DELETE /courses/:courseId/members/:memberId` | exists |
| 6 | Send Course Invite | Emails an invite to join a course. | `POST /courses/:courseId/invites` | exists |
| 7 | Revoke Course Invite | Cancels a pending invite. | `POST /courses/:courseId/invites/:inviteId/revoke` | exists |
| 8 | Reset Student Course Progress | Resets a student's progress in a course. | `POST /courses/:courseId/members/:memberId/reset-progress` | exists |
| 9 | Mark Lesson Complete | Marks a lesson complete on a student's behalf. | `PUT /courses/:courseId/members/:memberId/lessons/:lessonId/completion` | exists |
| 10 | Grade Submission | Sets the grade on an exercise submission. | `PUT /courses/:courseId/submissions/:submissionId/grades` | exists |
| 11 | Add Student to Cohort | Adds a student to a cohort. | `POST /cohorts/:cohortId/members` | exists |
| 12 | Post to Cohort Feed | Posts an announcement to a cohort's newsfeed. | `POST /cohorts/:cohortId/newsfeed` | exists |
| 13 | Clone Course | Creates a copy of an existing course. | `POST /courses/:courseId/clone` | exists |
| 14 | Add / Remove Tag on Student | Applies or removes a tag on an audience member. | `POST` / `DELETE /audience/:memberId/tags` | **new** |

### Searches (find a record so later steps can use it)

| # | Search | What it does | Endpoint |
| --- | --- | --- | --- |
| 1 | Find Student | Looks up an audience member by exact email. Powers "Find or Create Student". | `GET /audience?email=` (**new filter**) |
| 2 | Find Course | Looks up a course by slug or title. Powers "Find or Create Course". | `GET /courses?slug=` / `?title=` (**new filters**) |

### Deferred (not in v1)

- Triggers: `exercise.completion.updated`, invite created/revoked (course and organization), `organization.member.removed`, `organization.member.updated`, `compliance.record.waived`, `course.unpublished`, `cohort.member.removed`.
- Actions: Issue Certificate and Create Payment Request (no public API route yet), Create Course, Update Course, Publish Course.
- `program_completed` (no webhook event yet).

## Problem Statement

ClassroomIO exposes a versioned public REST API at `/public-api/v1/*`, an MCP server, and a webhooks platform. All three serve engineering teams. The customers who run training programs (HR, customer success, sales enablement) cannot:

- Enroll learners automatically when a contact reaches a CRM stage.
- Sync course completions and certificates to HRIS, Drive, or BI warehouses.
- Trigger Slack/email workflows on learner activity.
- Connect ClassroomIO into the no-code stacks (Zapier, Make, n8n, Pipedream) those teams operate.

The dashboard already advertises Zapier as an `Automation` tab (`/org/[slug]/automation/zapier`), but the page is a coming-soon callout and no Zapier app exists.

## Confirmed Decisions

1. **Distribution**: private Zapier app via a single shared invite URL first; promote to the public Zapier directory after ~5 paying orgs use it and v1 is stable.
2. **Plan gating**: Early Adopter+ only. Binary access, no monthly task credits. Per-minute rate limits remain as abuse protection. Zapier's gate must match the webhook delivery entitlement (see Plan Gating).
3. **Plan downgrade**: hard cutoff. All existing OAuth grants and Zapier webhook subscriptions are revoked immediately.
4. **Authentication**: OAuth 2.0 authorization code flow with refresh tokens in v1. No API-key-paste fallback for Zapier. Make / n8n / Pipedream / raw HTTP keep using existing `type: 'api'` automation keys, or OAuth.
5. **Scopes**: `zapier:read` and `zapier:write`. Zapier requests both; the consent screen lets admins downgrade to read-only. Subscribing to a trigger needs only `zapier:read`.
6. **Triggers are instant**: REST Hooks backed by the shipped webhooks platform. No polling triggers in v1.
7. **Trigger scope**: org-wide by default, with optional `Course` / `Cohort` / `Source` dropdown filters applied in the Zapier app.
8. **iPaaS parity**: the public REST API plus webhooks is the integration surface. The Zapier app is packaging only, with no Zapier-specific payloads. The subscription endpoint is generic so other iPaaS vendors can use it.
9. **Repo location**: `apps/zapier`, a deployable pushed to Zapier's cloud. Nothing else imports from it.
10. **Revoke UX**: per-grant revoke in the dashboard for the safety-net case. No bulk "Disconnect Zapier" button.

## Current-State Audit

| Capability | Current State | Notes |
| --- | --- | --- |
| Webhooks platform | **shipped** | 25 event types in `packages/utils/src/validation/webhook/events.ts`. HMAC-SHA256 signing, delivery log, redeliver, retries (`WEBHOOK_MAX_ATTEMPTS = 3`), cap of 20 endpoints per org (`WEBHOOK_MAX_ENDPOINTS_PER_ORG`). |
| Webhook management API | session auth only | `/organization/webhooks` uses `authMiddleware` + `orgAdminMiddleware`. An OAuth token cannot call it. Zapier needs a bearer-auth subscription route (see Route Layer). |
| Public REST API | broad | Courses, course members, invites, certificates, submissions and grades, lesson completion, cohorts (members, invites, newsfeed), team, analytics, media, templates. |
| Public API gaps | small | `GET /me`, tags (list, tag, untag), `?email=` on audience, `?slug=` / `?title=` on courses, broader audience update payload. |
| Org-scoped automation keys | available | `organization_api_key` supports `mcp \| api \| zapier`. `'zapier'` becomes unused under OAuth. |
| Bearer auth middleware | available | `automationKeyMiddleware` + `automationKeyScopesMiddleware`. Extended to accept OAuth access tokens. |
| OAuth 2.0 server and consent screen | missing | Required for v1. |
| Dashboard Zapier tab | partial | Route exists with a `coming_soon` callout. Becomes an OAuth-grant management page. |
| Automation usage tracking | available | `organization_automation_usage` records `read \| write \| publish`. Extended per OAuth grant. |
| Plan gating utilities | available | `MCP_AUTOMATION_LIMITS_BY_PLAN` in `packages/utils/src/plans/automation.ts` is the reference pattern. |
| Marketing positioning | partial | Automation page advertises API + Webhooks + MCP, not Zapier. |

## Product Goals

1. An org admin connects ClassroomIO from inside Zapier in under 60 seconds, with no token copy-paste: Connect → log in → consent → done.
2. Non-engineering customers can build the canonical Zaps without code:
   - CRM new customer → Enroll Student in Course.
   - Certificate Issued → upload to HRIS / Drive.
   - Exercise Submitted → notify the tutor in Slack.
3. 14 instant triggers, 14 actions, and 2 searches in v1.
4. The same OAuth flow, REST endpoints, and subscription endpoint work for Make, n8n, and Pipedream.
5. Connected Zapier instances are visible to admins in the dashboard, with per-grant revoke.
6. A Zap fires within seconds of the event, not on a polling cadence.

## Non-Goals (v1)

1. Public listing in the Zapier directory (after private validation).
2. Polling triggers (superseded by webhooks).
3. Make / n8n / Pipedream curated app listings.
4. Free / Basic plan access.
5. Inbound webhooks from Zapier to ClassroomIO (Zapier writes via REST actions).
6. Monthly task credits.
7. Customer-authored custom triggers.
8. PKCE / device-code / implicit OAuth grants (authorization_code + refresh_token only).
9. OAuth dynamic client registration (Zapier is a hard-coded confidential client).
10. Bulk "Disconnect Zapier" button.
11. Branding review and Zapier marketplace screenshots.
12. Deferred triggers and actions listed in At a Glance.

## User Stories

1. As an HR ops admin, I want a new hire in BambooHR to auto-enroll in the onboarding course so I don't manage a spreadsheet.
2. As a sales engineer, I want a HubSpot deal moving to "Customer" to enroll the buyer in product training so onboarding starts on day zero.
3. As an L&D admin, I want every certificate issued to upload a PDF to the employee's Google Drive folder so my audit trail lives in the source of truth.
4. As a tutor, I want every exercise submission in my course to DM me in Slack so I can grade quickly.
5. As a finance ops admin, I want every payment request to create a HubSpot deal so I don't reconcile manually.
6. As a compliance lead, I want an overdue or expired compliance record to open a ticket so nothing slips.
7. As an org admin, I want to revoke Zapier access without breaking my other integrations.

## UX Requirements

### Dashboard Zapier Tab

Route: `/org/[slug]/automation/zapier`. Sections, top to bottom:

1. Admin permission callout for non-admins.
2. Plan gating callout for orgs below Early Adopter, with an upgrade CTA. No connect flow visible.
3. "Connect on Zapier" CTA linking to the shared private invite URL (later the public listing).
4. Connected Zapier instances table, one row per active OAuth grant: label, scopes (`read` / `read+write`), active Zap subscriptions, last used, connected at, status. Row action: revoke.
5. Rate-limit and subscription-limit summary for the org's plan.
6. Setup guide with screenshots of the Connect flow.
7. Docs callout linking to the `apps/docs` Zapier guide.

Revoking a grant also deletes that grant's webhook subscriptions. Zapier-created subscriptions are labeled in the existing webhooks tab and are read-only there.

Reuse: `automation-oauth.svelte.ts` API class in `apps/dashboard/src/lib/features/automation/api/`, types in `apps/dashboard/src/lib/features/automation/utils/types.ts`, replacing `pages/zapier.svelte`.

### Consent Screen

Route: `/oauth/consent` in the dashboard, reached from Zapier's authorize redirect.

1. Unauthenticated users are redirected to login with `redirect_to=/oauth/consent?...`.
2. Show the org name, the requesting app (Zapier), the requested scopes, and the redirect URI.
3. Multi-org users get an org picker listing only orgs where they are admin and the plan is Early Adopter+.
4. `Authorize` POSTs to the API to issue a code, then redirects to Zapier with `?code=…&state=…`. `Deny` redirects with `?error=access_denied&state=…`.
5. Admins can untick `zapier:write` for a read-only connection.

### Zapier App UX

- **App name**: ClassroomIO.
- **Auth**: OAuth 2.0, with Zapier's built-in refresh handling against `/oauth/token`.
- **Test step**: `GET /public-api/v1/me`, shows the org name on Zapier's connections page.
- **Dynamic dropdowns**: `Course` from `GET /public-api/v1/courses?fields=id,title&limit=100`, `Cohort` from the cohorts list, `Tag` from `GET /public-api/v1/tags?limit=100` (new).
- **Sample data**: each trigger returns the org's most recent real event of that type, falling back to a static sample (see Route Layer).

### Marketing Surface

Update `apps/website/src/routes/automation/+page.svelte`, the home automation band, and `automate-section.svelte` to name Zapier alongside REST API + Webhooks + MCP. Follow-up PR after private listing; does not gate v1.

## Trigger Design (REST Hooks)

Each trigger is a Zapier REST Hook trigger:

1. **subscribe**: Zapier calls `POST /public-api/v1/webhooks/subscriptions` with its unique `targetUrl` and the trigger's event type. The API creates a Zapier-managed webhook endpoint bound to the OAuth grant and returns its id.
2. **perform**: ClassroomIO delivers the standard webhook envelope to `targetUrl`. The Zapier app unwraps `data`, applies the optional `Course` / `Cohort` / `Source` filter, and returns the record.
3. **unsubscribe**: Zapier calls `DELETE /public-api/v1/webhooks/subscriptions/:id` when a Zap is turned off.
4. **performList**: Zapier calls `GET /public-api/v1/webhooks/subscriptions/samples?event=<type>` to populate the Zap editor with the latest real payload of that event type for the org, or a static sample when none exists.

Envelope, headers, signing, and retries are those of `prd/webhooks`. Delivery is at-least-once; the Zapier app dedupes on the envelope `id`.

Zapier targets are unguessable HTTPS URLs on `hooks.zapier.com`. Subscribe rejects any other host. Signing stays on.

## Authentication and Scopes

### OAuth 2.0 server (new)

authorization_code + refresh_token grants (RFC 6749) only. Zapier is registered as a single confidential client.

| Endpoint | Method | Purpose |
| --- | --- | --- |
| `/oauth/authorize` | `GET` | Validates `client_id`, `redirect_uri`, `response_type=code`, `scope`, `state`, then redirects to the dashboard consent screen. |
| `/oauth/authorize/issue` | `POST` | Called by the consent screen (session auth). Issues a single-use code (60 s TTL) bound to org, client, scopes, redirect URI, and consenting user. |
| `/oauth/token` | `POST` | Exchanges a code for an access token (1 h) + refresh token (90 d, sliding). Also handles `grant_type=refresh_token`. |
| `/oauth/revoke` | `POST` | Revokes an access or refresh token (RFC 7009). |

### Client registration

Env vars: `ZAPIER_OAUTH_CLIENT_ID`, `ZAPIER_OAUTH_CLIENT_SECRET`, `ZAPIER_OAUTH_REDIRECT_URIS`. A resolver in `packages/utils/src/oauth/clients.ts` returns clients keyed by `client_id`, so adding other iPaaS vendors is config-only.

### Token storage

Tables `oauth_authorization_code`, `oauth_access_token`, `oauth_refresh_token` (see Technical Design). Tokens and codes are hashed at rest.

### Middleware

Extend `automationKeyMiddleware` into a unified `bearerAuthMiddleware`:

1. Read `Authorization: Bearer …`.
2. Try an OAuth access token (hash lookup). If valid, set `orgId`, `actorId` (the granting profile), `authSource: 'oauth'`, and `scopes`.
3. Fall back to the `organization_api_key` path for `type: 'api'` / `'mcp'`.
4. Return 401 if neither matches.

`automationKeyScopesMiddleware` checks OAuth scopes or API-key scopes depending on `authSource`.

### Scopes

- `zapier:read`: all `GET` endpoints, `GET /me`, and trigger subscribe/unsubscribe/samples.
- `zapier:write`: all actions (create, update, delete).

### Drop `type: 'zapier'` from API key types

Remove `'zapier'` from `ZOrganizationApiKeyType` in `packages/utils/src/validation/organization/automation-key.ts` and from the `organization_api_key.type` enum. No rows exist, so no data migration.

## Plan Gating

Zapier is a binary plan feature.

`ZAPIER_AUTOMATION_LIMITS_BY_PLAN` in `packages/utils/src/plans/automation.ts`:

| Plan | Zapier enabled | Max active grants | Max active trigger subscriptions | Writes / min |
| --- | --- | --- | --- | --- |
| Basic | no | 0 | 0 | 0 |
| Early Adopter | yes | 5 | 50 | 40 |
| Enterprise | yes | 25 | 250 | 120 |

Reads use the existing public API per-minute limits.

Trigger subscriptions are counted separately from the 20-endpoint cap on customer-managed webhooks, so a Zapier-heavy org does not exhaust the cap. The subscription numbers are a starting proposal.

Webhook delivery is itself plan-gated (`webhook-entitlement`). The Zapier plan list must be no wider than the webhook entitlement, so a grant can never exist on a plan where deliveries are suppressed. Confirm the entitlement's plan list before implementation and align the two.

Enforcement:

1. `/oauth/authorize`: reject with `access_denied` if the org's plan excludes Zapier or the grant cap is reached.
2. `bearerAuthMiddleware`: reject OAuth tokens with 403 + `PLAN_GATED` if the plan dropped below Early Adopter.
3. Subscribe: reject when the subscription cap is reached.
4. Route entry: rate-limit writes by `(org_id, scope_category)`.

Downgrade flow: the plan-change path in `apps/api/src/services/license.ts` calls `oauth/plan-guard.ts`, which sets `revoked_at` on all of the org's tokens and deletes its Zapier webhook subscriptions. The dashboard tab then shows the upgrade CTA.

Usage tracking: every Zapier API call increments `organization_automation_usage`. Webhook deliveries are tracked in the existing delivery log.

## Technical Design

### Schema additions (`packages/db/src/schema.ts`)

1. `oauth_authorization_code`: `id`, `code_hash` (unique), `client_id`, `organization_id`, `granted_by_profile_id`, `redirect_uri`, `scopes`, `created_at`, `expires_at` (60 s), `consumed_at`.
2. `oauth_access_token`: `id`, `token_hash` (unique), `token_prefix`, `client_id`, `organization_id`, `granted_by_profile_id`, `refresh_token_id`, `scopes`, `created_at`, `expires_at` (1 h), `revoked_at`, `last_used_at`.
3. `oauth_refresh_token`: `id`, `token_hash` (unique), `client_id`, `organization_id`, `granted_by_profile_id`, `scopes`, `label`, `created_at`, `expires_at` (90 d, sliding), `revoked_at`, `last_used_at`.
4. Webhook endpoint table: add nullable `oauth_refresh_token_id` (FK) and a `managed_by` marker (`'zapier'`) so subscriptions are tied to a grant, hidden from the editable list, and removed on revoke. Reuse the existing webhook tables; do not add a parallel delivery system.

One migration file for the PR, per the repo's migration rules.

### Validation layer

- `packages/utils/src/validation/oauth/oauth.ts`: `ZOauthAuthorizeQuery`, `ZOauthIssueCodeBody`, `ZOauthTokenBody`, `ZOauthRevokeBody`, `ZOauthScope`.
- `packages/utils/src/validation/public-api/me.ts`, `tag.ts`, `webhook-subscription.ts`.
- Extend `audience.ts` (add `email` filter, broaden update payload) and `course.ts` (add `slug`, `title` filters).
- Webhook event schemas stay in `validation/webhook/events.ts`; `apps/zapier` imports them.

### Query layer

- `packages/db/src/queries/oauth/{authorization-code,access-token,refresh-token}.ts`.
- `packages/db/src/queries/organization/me.ts`.
- Webhook queries: create, delete, and list Zapier-managed endpoints per grant; latest event of a type per org.
- Every query logs the original error with its function name.

### Service layer

- `apps/api/src/services/oauth/{clients,authorize,token,revoke,plan-guard}.ts`.
- `apps/api/src/services/v1/me.ts`, `tag.ts`, `webhook-subscription.ts`.
- Extend `services/v1/audience.ts` for the update payload and tag/untag.
- Subscribe validates the target host, the plan, and the cap, then creates the endpoint inside one transaction.

### Route layer

OAuth (API root): `GET /oauth/authorize`, `POST /oauth/authorize/issue` (session auth), `POST /oauth/token`, `POST /oauth/revoke`.

New public API (`/public-api/v1`), each with `describeRoute` and one response type:

- `GET /me`
- `GET /tags`
- `POST /audience/:memberId/tags`, `DELETE /audience/:memberId/tags/:tagId`
- `POST /webhooks/subscriptions`, `DELETE /webhooks/subscriptions/:id`
- `GET /webhooks/subscriptions/samples?event=`

Extended: `GET /audience?email=`, `GET /courses?slug=&title=`, `PUT /audience/:memberId`.

### Dashboard routes

- `apps/dashboard/src/routes/(app)/oauth/consent/+page.svelte` and `+page.server.ts`.
- Replace `features/automation/pages/zapier.svelte`.
- New `features/automation/api/automation-oauth.svelte.ts`.
- Translations under `automation.zapier.*`, then `pnpm translate`.

### Zapier app (`apps/zapier`)

```
apps/zapier/
├── package.json
├── tsconfig.json
├── index.ts
├── authentication.ts
├── triggers/        # one file per trigger, all REST Hook
├── creates/         # one file per action
├── searches/
│   ├── find-student.ts
│   └── find-course.ts
├── utils/
│   ├── client.ts
│   └── hook.ts      # shared subscribe / unsubscribe / unwrap / dedupe
└── test/
```

Dependencies: `zapier-platform-core`, and `@cio/utils` via workspace protocol so webhook and API schema changes break the Zapier build at CI time.

Release: `pnpm --filter @cio/zapier build`, `zapier:push` and `zapier:promote` manual and gated on the on-call engineer. No CI auto-push.

## API and Docs

1. Annotate every new route with `describeRoute`; run `pnpm --filter @cio/api upload:openapi`.
2. Add a Zapier guide in `apps/docs`: connect your account (OAuth), trigger catalog with sample payloads, action catalog with required fields, searches, limits, troubleshooting (grant revoked, scope missing, plan downgrade).
3. Marketing updates as described above (follow-up).

## Rollout Plan

1. **OAuth server**: schema, queries, services, routes, `bearerAuthMiddleware`, scope enforcement, plan-guard, drop `'zapier'` from the key type.
2. **Consent screen and dashboard**: `/oauth/consent`, grants page, translations, plan callout.
3. **Public API and subscriptions**: `/me`, filters, tags, audience update, webhook subscription routes, samples, OpenAPI upload.
4. **Zapier app**: scaffold, 14 triggers, 14 actions, 2 searches, dropdowns, `zapier push` 1.0.0.
5. **Private validation**: share the invite URL with paying orgs, watch usage and delivery logs, iterate, update docs and marketing.
6. **Public listing**: submit for directory review, promote, announce.
7. **v2**: deferred triggers and actions, Issue Certificate and Create Payment Request routes, other iPaaS OAuth clients.

## Success Metrics

1. At least 5 orgs connect via OAuth within 30 days of the private invite.
2. At least 100 Zap runs per week within 60 days.
3. p95 event-to-Zap latency under 30 seconds.
4. Under 2% of Zap runs fail on API errors (excluding misconfiguration).
5. At least 80% of connected orgs use one trigger and one action.
6. Zero security incidents involving OAuth tokens.

## Risks and Mitigations

1. **OAuth server is a new attack surface.** Keep it minimal, hash tokens, single-use 60 s codes, server-side scope validation, security tests, and a security review before public listing.
2. **Subscription volume.** Each Zap trigger is one subscription. Mitigation: separate caps from the 20-endpoint webhook limit, delete on Zap-off and on revoke, and show counts in the dashboard.
3. **Retries.** Webhooks retry only 3 times, so a Zapier outage can drop events. Mitigation: dedupe on envelope id; the delivery log lets admins redeliver; consider more attempts for Zapier-managed endpoints.
4. **Auto-disable.** Failing endpoints get degraded or disabled by the webhook health logic. Mitigation: surface disabled Zapier subscriptions in the grants table and recover them on the next subscribe.
5. **Plan mismatch.** Zapier and webhook entitlement drifting apart. Mitigation: derive both from one plan helper and add a test.
6. **Downgrade silently breaks live Zaps.** Send a notification email naming each revoked grant, and show a dashboard banner ahead of known billing-driven downgrades.
7. **Directory review rejects the listing.** Stay private until sample data, errors, dropdowns, and OAuth edge cases are polished.
8. **Invite URL leaks.** Plan gating and the admin check at `/oauth/authorize` apply regardless of who clicks Connect.
9. **Schema drift between the Zapier app and the API.** `apps/zapier` imports `@cio/utils` types.

## Build and Verification Commands

1. `pnpm --filter @cio/utils build`
2. `pnpm --filter @cio/db build`
3. `pnpm --filter @cio/api build`
4. `pnpm --filter @cio/api upload:openapi`
5. `pnpm --filter @cio/dashboard build`
6. `pnpm --filter @cio/zapier build`
7. `pnpm --filter @cio/zapier zapier:push` (manual, gated)

Manual verification:

1. Install via the invite URL while logged out; Zapier prompts for ClassroomIO login.
2. Complete OAuth as an Early Adopter admin; the Test step shows the org name from `/me`.
3. Try OAuth as a non-admin; Authorize is unavailable and Deny returns `access_denied`.
4. Try OAuth on a Basic org; `/oauth/authorize` rejects with the upgrade CTA.
5. Untick `zapier:write`; write endpoints return 403 and triggers still work.
6. Zap: Exercise Submitted → Slack. Submit an exercise; the message arrives within seconds.
7. Zap: HubSpot deal → Enroll Student in Course. The student appears and is enrolled.
8. Zap: Certificate Issued → Google Drive upload.
9. Turn a Zap off; confirm its subscription is deleted. Turn it on; confirm a new one is created.
10. Revoke the grant in the dashboard; Zaps show re-connect, and its subscriptions are gone.
11. Downgrade to Basic; the tab shows the upgrade CTA, grants and subscriptions are revoked, and Zaps fail with `PLAN_GATED`.
12. Force access token expiry; Zapier refreshes silently.
13. Make the target return 500 repeatedly; confirm retries, the delivery log entry, and the health state.

## Open Questions

1. OAuth library: `oauth4webapi`, `node-oauth2-server`, or hand-rolled.
2. Refresh-token rotation: rotate on every refresh or reuse (Zapier supports both).
3. One OAuth grant per org (v1) versus cross-org consent later.
4. Should Zapier-managed endpoints get more than 3 delivery attempts?
5. Exact subscription caps per plan, and whether Zapier subscriptions should be hidden from the customer's webhooks tab or shown read-only (proposed: read-only).
6. Which plans webhook delivery is entitled to today; Zapier must match.
7. Whether cohort and compliance triggers belong in v1 or wait for a customer ask.
