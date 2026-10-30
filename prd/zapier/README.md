# Zapier Integration PRD

## Status

Draft (updated to match the clickable prototype in `prototypes/zapier-integration`)

## Purpose

Ship a Zapier integration that lets non-engineering teams connect ClassroomIO to the tools they already use (CRMs, HRIS, Slack, spreadsheets, email platforms, ticketing) without writing code. The integration must work today against the existing public API and silently upgrade to real-time delivery as the webhooks platform lands.

## Problem Statement

ClassroomIO already exposes a versioned public REST API at `/public-api/v1/*` and ships an MCP server, but those surfaces only serve engineering teams. The customers who run training programs (HR, customer success, sales enablement) cannot:

- Enroll learners automatically when a contact reaches a CRM stage.
- Sync course completions and certificates to HRIS, Drive, or BI warehouses.
- Trigger Slack/email workflows on learner activity.
- Connect ClassroomIO into the no-code stacks (Zapier, Make, n8n, Pipedream) that those teams already operate.

The dashboard already advertises Zapier as an Automation tab (`/org/[slug]/automation/zapier`) and the automation-key system supports `type: 'zapier'`, but the page is a coming-soon callout and no Zapier app exists. We have customers who need this integration shipped now.

## Confirmed Decisions

These are locked before implementation begins:

1. **Distribution:** Ship as a private Zapier app via a single shared invite URL first; promote to the public Zapier directory after ~5 paying orgs are using it and v1 is stable.
2. **Plan gating:** Early Adopter+ only. Access is binary — either your plan includes Zapier or it doesn't. No monthly task credits. Per-minute rate limits still apply as abuse protection.
3. **Plan downgrade behavior:** Hard cutoff. When an org drops below Early Adopter, all existing OAuth grants are revoked immediately. No grace period.
4. **Authentication:** OAuth 2.0 authorization code flow with refresh tokens, shipping in v1. No API-key-paste fallback for Zapier. Direct API consumers (Make, n8n, Pipedream, raw curl) keep using existing `type: 'api'` automation keys; Zapier exclusively uses OAuth.
5. **Scopes:** `zapier:read` and `zapier:write` exist as OAuth scopes. Zapier requests both at connection time; the consent screen lets admins downgrade to read-only.
6. **Triggers in v1:** Polling only. No webhook dependency. Real-time REST Hooks ship in v1.1 once the webhooks PRD lands.
7. **Trigger scope:** Org-wide by default, with optional Course and Tag dropdown filters per trigger. No separate per-course trigger duplicates.
8. **iPaaS parity:** The public REST API is the integration surface. Zapier connects via OAuth; Make / n8n / Pipedream can use OAuth too (all three support it) or `type: 'api'` keys for raw HTTP. The Zapier app is packaging only — no Zapier-specific endpoints or payloads.
9. **Repo location:** `apps/zapier`. The Zapier app is a deployable that gets `zapier push`-ed to Zapier's cloud. Nothing else in the monorepo imports from it, so it sits next to `apps/api` and `apps/dashboard` rather than in `packages/`.
10. **Revoke UX:** Per-grant revoke is available in the dashboard for the safety-net case (compromised Zapier account, employee offboarding). No bulk "Disconnect Zapier" button — customers managing their integration normally do so from inside Zapier.
11. **Two ways in, one OAuth flow:** An admin can start connecting from Zapier (private invite URL) or from the ClassroomIO Zapier tab (Zaps page, App Directory, per-app page). Every path ends in the same OAuth consent screen and the same grant. ClassroomIO never stores a Zapier credential outside that grant.
12. **ClassroomIO does not build Zaps:** Zap building, trigger and action pickers, field mapping, testing and publishing stay on `zapier.com`. The dashboard only helps an admin discover an integration, connect, and manage the grant.
13. **Connecting from the dashboard always goes through consent:** "Create a Zap" and "Connect Apps" on a not-connected org open the consent flow first. The Zapier editor is only opened directly once the org is connected.
14. **Curated App Directory (20 apps):** The in-dashboard directory is a static, curated list of 20 apps chosen in `prd/zapier/integration-research.md`, not Zapier's full 6,000+ catalog. It is a discovery aid and does not create per-app connections.
15. **Connection model:** A connection is one OAuth grant to one Zapier workspace for one org. Third-party apps such as HubSpot are connected inside Zapier, not in ClassroomIO.

## Current-State Audit

| Capability | Current State | Notes |
|---|---|---|
| Org-scoped automation keys | Available | `organization_api_key` already supports `type: 'mcp' \| 'api' \| 'zapier'`. Rotation, revoke, last-used tracking all shipped. The `'zapier'` value becomes unused under the OAuth model (see Technical Design). |
| Bearer auth middleware | Available | `automationKeyMiddleware` + `automationKeyScopesMiddleware` in `apps/api/src/middlewares/`. Will be extended to also accept OAuth access tokens. |
| OAuth 2.0 server | Missing | No OAuth authorization-code flow exists on the API. Required for v1. |
| OAuth consent screen | Missing | No dashboard consent screen for third-party app authorization. Required for v1. |
| Public REST API | Partial | `/public-api/v1/courses` and `/public-api/v1/audience` shipped. Tags, announcements, certificates, course clone, full audience update still missing. |
| Test-connection endpoint | Missing | No `GET /public-api/v1/me` for Zapier's auth-test step. |
| Polling cursor / since filter | Missing | List endpoints support page/limit but no `?since=` or `?cursor=` for stable Zapier polling. |
| Email/slug search filters | Missing | Audience list does not accept `?email=`; courses list does not accept `?slug=` or `?title=`. |
| Webhooks delivery | Missing | `prd/webhooks/README.md` written but unshipped. Not a v1 dependency. |
| Dashboard Zapier tab | Partial | `/org/[slug]/automation/zapier` route exists but renders a `coming_soon` callout. Will become an OAuth-grant management page, not a key-management page. |
| Automation usage tracking | Available | `organization_automation_usage` already records `read \| write \| publish` per key. Will be extended to record per OAuth grant. |
| Plan gating utilities | Available | `MCP_AUTOMATION_LIMITS_BY_PLAN` pattern in `packages/utils/src/plans/automation.ts` is the reference for Zapier rate limits. |
| Marketing positioning | Partial | `apps/website/src/routes/automation/+page.svelte` advertises API + Webhooks + MCP. Does not yet mention Zapier. |

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
- `prd/public-api/README.md` [DONE]
- `prd/webhooks/README.md`

## Product Goals

1. An org admin can connect ClassroomIO to Zapier in under 60 seconds without copying or pasting any token, from either entry point.
   - From Zapier: click Connect → log into ClassroomIO → consent → done.
   - From ClassroomIO: Zapier tab → Create a Zap or Connect Apps → consent → continue to Zapier.
2. Non-engineering customers can build the three canonical Zaps without code:
   - CRM new customer → enroll in onboarding course.
   - Certificate issued → upload to HRIS / Drive.
   - Exercise submitted → notify tutor in Slack.
3. The Zapier app exposes a useful but small surface: 5 triggers, 5 actions, 2 searches in v1.
4. Same OAuth flow and REST endpoints work for Make, n8n, and Pipedream — they support OAuth natively, so no additional development is needed beyond the Zapier package.
5. Connected Zapier instances are visible to admins in the dashboard, with per-grant revoke for the safety-net case, and a link out to the connection on Zapier.
6. The integration is forward-compatible with webhooks: when REST Hooks become available, high-volume triggers (exercise submitted, lesson completed) upgrade with no UX change for the Zapier user.

## Non-Goals (v1)

- Public listing in the Zapier directory (deferred until v1 is validated with ~5 customers).
- Real-time triggers via REST Hooks (deferred to v1.1, gated on `prd/webhooks`).
- High-volume triggers (`exercise.submitted`, `lesson.completed`) that are impractical on polling.
- Make / n8n / Pipedream apps as separate packaged listings (the REST API + OAuth supports them; no curated app yet).
- Free / Basic plan access (gated to Early Adopter+).
- Inbound webhooks from Zapier to ClassroomIO (Zapier writes via REST actions, not webhooks).
- Monthly task credits or Zapier-specific credit budgets (Zapier is a binary plan feature; per-minute rate limits remain for abuse protection only).
- Custom triggers / dynamic events authored by the customer.
- PKCE / device-code / implicit OAuth grants (only `authorization_code` + `refresh_token` grants ship in v1).
- OAuth dynamic client registration (Zapier is a hard-coded confidential client; other iPaaS vendors are added by hand in v1).
- Bulk "Disconnect Zapier" button in the dashboard (customers disconnect from Zapier's side; admins use per-grant revoke for safety-net cases).
- Branding review and Zapier marketplace screenshots (post-private validation).
- A Zap builder, template gallery, trigger or action picker, field mapping or test step inside ClassroomIO.
- Showing Zapier's full app catalog inside ClassroomIO (the directory is the curated 20).
- Listing which apps an org's Zaps use. ClassroomIO has no visibility into Zap contents, and Zapier does not expose it to the app.

## User Stories

- As an HR ops admin, I want a new hire in BambooHR to auto-enroll in the onboarding course so I don't manage a spreadsheet.
- As a sales engineer, I want a HubSpot deal moving to "Customer" to enroll the buyer in the product training so onboarding starts on day zero.
- As an L&D admin, I want every `certificate.issued` to upload a PDF to the employee's Google Drive folder so my audit trail lives in the source-of-truth.
- As a tutor, I want every `exercise.submitted` for my course to DM me in Slack so I can grade quickly.
- As a finance ops admin, I want every `payment_request.created` to create a HubSpot deal so I don't reconcile manually.
- As an org admin, I want Zapier to connect through its own revocable grant, separate from my raw API keys, so I can revoke Zapier without breaking my internal integrations.
- As an org admin, I want my Zapier usage to count against the same plan limits as MCP and API so I'm not over-billed by tool sprawl.
- As an org admin with no connection yet, I want to browse the apps ClassroomIO works with and start connecting from the dashboard, so I don't have to find the Zapier invite first.
- As an org admin, I want to see who connected Zapier, with what access, and when it was last used, and open the connection on Zapier, so I can audit it.
- As a non-admin member, I want a clear message that I need admin access, so I know who to ask.

## UX Requirements

### Dashboard Zapier Tab

Route: `/org/[slug]/automation/zapier`.

Diverges from the MCP page because Zapier authenticates via OAuth grants, not bearer keys. The tab has two states, driven by whether the org has an active grant. Shell, sidebar and breadcrumb follow the existing Automation group (MCP, API, Zapier). The Automation hub card for Zapier shows Connect (opens the consent flow) when there is no grant and Manage (opens the connection screen below) when there is one.

**Gates, shown above either state:**

- Admin permission callout for non-admin users ("You need admin access to manage this integration"). Connect and manage controls are disabled.
- Plan gating callout for orgs below Early Adopter, with copy "Upgrade to Early Adopter to use Zapier" and an upgrade CTA. Every connect link is hidden, including Create a Zap, Connect Apps and the invite link. The tab itself stays visible so the feature is discoverable.

### State A: Not connected (Zaps page)

- Heading "Zaps" and an empty-state card: "No Zaps yet. ClassroomIO isn't connected to Zapier yet. Approve access once, then build your Zaps on Zapier."
- Primary Create a Zap → consent flow (no app preselected).
- Secondary Connect Apps → App Directory.
- Text link "Or connect on Zapier with the private invite" → shared private invite URL (later the public listing).
- Returning from a denied consent shows a toast ("Access denied. Nothing was connected.") and stays here.

### State B: Connected (Zaps page)

- Status banner "Your ClassroomIO organization is connected to Zapier" with an Active badge.
- One connection card: label (e.g. "Zapier workspace: acme-academy"), access (Read + write or Read only), last used, connected at.
- Actions:
  - View connection (dashboard connection screen).
  - View on Zapier (opens `https://zapier.com/app/connections` in a new tab).
- Create More Zaps opens the Zapier editor (`https://zapier.com/app/editor`) in a new tab. No consent step, because the org is already connected.

### Connection screen

(`zapier-connected` in the prototype; same route family, e.g. `/org/[slug]/automation/zapier/connection`)

Required sections (top to bottom):

1. Admin and plan callouts as above.
2. On a plan downgrade, show: "Zapier connections were turned off when this org dropped below Early Adopter. All Zapier connections were revoked immediately. Zaps that use them now fail with a plan-gated error. Upgrade to reconnect."
3. Status banner with the workspace and granted date.
4. "Connect on Zapier" CTA linking to the shared private invite URL, with:
   - Manage your Zaps on Zapier (`https://zapier.com/app/zaps`)
   - View connections on Zapier (`https://zapier.com/app/connections`)
5. Connected Zapier instances table — one row per active OAuth grant.
   - Columns: label (e.g. "Zapier workspace: acme-academy", plus "Authorized by {email}"), scopes (read / read+write), status, last used, connected at.
   - Row action: Revoke, behind a confirm dialog ("Any Zaps using it will stop running until reconnected").
   - Revoking the last grant returns the org to State A.
6. Rate limit summary — active grants vs the plan cap (e.g. 1 / 5), and per-minute read and write caps for the org's plan (e.g. 120 / 40 on Early Adopter).
7. Setup guide — four steps for the Connect flow: click Connect → log in → approve access → start building.
8. Docs callout linking to apps/docs Zapier guide.

### App Directory and App Pages (discovery)

These screens help an admin find an integration and start connecting. They are optional shortcuts; the invite URL path stays fully supported.

**Directory route:** `/org/[slug]/automation/zapier/apps`.

- Sidebar search, category filters with live counts, Popular / A–Z sort, View more apps pagination, and `?category=` / `?q=` query params to arrive pre-filtered.
- State (filters, sort, how far the user has paginated) lives in the query string.
- Catalog: static config in the dashboard, 20 curated apps with category, brand color, one-line description and a detail blurb (source: `integration-research.md`).
- Category counts are the real count of apps in that category.
- When every app is visible, a closing card says the list is a sample of Zapier's 6,000+ apps and offers Connect ClassroomIO to Zapier.

**App page route:** `/org/[slug]/automation/zapier/apps/[slug]`.

- Shows what ClassroomIO enables for that app, the 5 v1 triggers, the 5 v1 actions, and a Connect {App} CTA.
- The 2 searches are not listed because Zapier generates "Find or Create" steps itself.
- Connect {App}: opens the consent flow with the app as context ("Connecting {App} to your organization").
- If the org is already connected, it skips consent and goes straight to Zapier.
- Brand marks: use licensed or official assets before shipping. The prototype uses hand-built approximations that must not ship.

### Zapier-side landing page (not built by ClassroomIO)

After consent, the user lands on Zapier's own integration page for "ClassroomIO + {App}" ("When this happens... automatically do this!", Continue to Zapier). This page is hosted by Zapier. The prototype recreates it only to show the flow. ClassroomIO builds nothing for it and does not depend on its layout. The one ClassroomIO-owned element around it is a link back to the dashboard connection screen.

### Consent Screen

Route: `/oauth/consent` in the dashboard. Triggered by Zapier's authorize redirect.

**Behavior:**

- If the user is not logged in, redirect to the existing login flow with a `redirect_to=/oauth/consent?...` parameter so they return here after auth.
- Render the consenting org's name, the requesting app (Zapier), the requested scopes (`zapier:read`, `zapier:write`), and the redirect URI.
- When the flow started from an App Directory page, also show a "Connecting {App}" chip as context only; it does not change the scopes or the grant.
- For multi-org users, show an org picker — only orgs where the user is admin AND the plan is Early Adopter+ appear.
- Show two buttons: Authorize and Deny.
- On Authorize, the dashboard POSTs to the API to issue an authorization code, then redirects to Zapier's callback with `?code=…&state=…`.
- On Deny, redirects to Zapier's callback with `?error=access_denied&state=…`.
- Admins can untick `zapier:write` on the consent screen to grant a read-only connection. `zapier:read` is required and cannot be unticked.
- A signed-in user who is not an admin on any Early Adopter+ org sees no org picker, a message ("You're not an admin on any organization eligible to connect Zapier. Ask an admin on an Early Adopter or above plan to connect it instead."), and only Deny.
- While redirecting after Authorize, show a short "Redirecting to Zapier… Finishing the connection" state.
- Footer note: "You can revoke this connection at any time from Automation → Zapier in ClassroomIO."
- When the flow starts from the dashboard (Create a Zap, Connect Apps, Connect {App}), ClassroomIO sends the user into Zapier's connect flow, which calls `/oauth/authorize` and returns here. The dashboard never issues a code without that Zapier-initiated state.

## Zapier App UX

The Zapier app surface, as seen by a Zap author:

- **App name:** ClassroomIO
- **Auth flow:** OAuth 2.0. User clicks Connect in Zapier → Zapier opens our `/oauth/authorize` URL → user logs in (if needed) and consents → redirected back to Zapier with a code → Zapier exchanges for tokens silently. No copy-paste.
- **Test step:** After token exchange, Zapier calls `GET /public-api/v1/me` with the new access token. Shows `{org.name}` on Zapier's connections page.
- **Trigger picker:** Lists the 5 triggers below with one-line descriptions matching the website's voice.
- **Action picker:** Lists the 5 actions below.
- **Search picker:** Lists the 2 searches below.
- **Dynamic dropdowns:**
  - Course dropdown is powered by `GET /public-api/v1/courses?fields=id,title&limit=100`.
  - Tag dropdown is powered by `GET /public-api/v1/tags?limit=100` (new endpoint, see Technical Design).
- **Sample data:** Every trigger ships a static sample record so Zap authors can build downstream steps without firing a real event.
- **Token refresh:** The Zapier app uses Zapier's built-in `refresh_token` handling — Zapier auto-refreshes access tokens via our `/oauth/token` endpoint when they expire.

## Marketing Surface

Update `apps/website/src/routes/automation/+page.svelte` and the home page automation band to mention Zapier alongside REST API + Webhooks + MCP. Add a Connect via Zapier row to the integrations section. Update the `automate-section.svelte` copy to name Zapier explicitly ("New hire joins BambooHR → enrolled via Zapier").

This marketing work is a follow-up PR after the integration is private-listed. Tracked in this PRD but does not gate v1 ship.

## Trigger Catalog (v1)

All triggers ship as polling. Each trigger emits createdAt-ordered records and dedupes by id on the Zapier side.

| Trigger | Description | Source endpoint | Optional filters |
|---|---|---|---|
| `new_audience_member` | New student added to the organization audience | `GET /public-api/v1/audience?sortBy=createdAt&sortOrder=desc` | None |
| `student_enrolled_in_course` | A student was added to a course (invite accepted or direct add) | `GET /public-api/v1/audience/enrollments?sortBy=createdAt&sortOrder=desc` (new) | `courseId`, `tagId` |
| `course_completed` | A student completed all required lessons in a course | `GET /public-api/v1/course-completions?sortBy=completedAt&sortOrder=desc` (new) | `courseId`, `tagId` |
| `certificate_issued` | A certificate was issued for a learner | `GET /public-api/v1/certificates?sortBy=issuedAt&sortOrder=desc` (new) | `courseId` |
| `payment_request_created` | A learner submitted a payment request form | `GET /public-api/v1/payment-requests?sortBy=createdAt&sortOrder=desc` (new) | `courseId` |

### Deferred to v1.1 (require webhooks for sane volume / latency)

- `exercise_submitted`
- `exercise_graded`
- `lesson_completed`
- `newsfeed_post_created`
- `community_question_created`
- `compliance_course_overdue`

### Deferred to v2 (no current customer ask)

- `program_completed`

## Action Catalog (v1)

Each action is a thin Zapier wrapper over an existing or new public API write endpoint.

| Action | Description | Endpoint | Scope |
|---|---|---|---|
| `enroll_student_in_course` | Find-or-create the student by email and assign to one or more courses | `POST /public-api/v1/audience` + `POST /public-api/v1/audience/assign-courses` | `zapier:write` |
| `add_student` | Create an audience member without course assignment | `POST /public-api/v1/audience` | `zapier:write` |
| `update_student` | Update audience member profile (name, email, custom attributes) | `PUT /public-api/v1/audience/:memberId` (extend payload schema) | `zapier:write` |
| `remove_student` | Remove a student from the organization | `DELETE /public-api/v1/audience/:memberId` | `zapier:write` |
| `tag_student` | Apply or remove a tag on an audience member | `POST /public-api/v1/audience/:memberId/tags` (new) | `zapier:write` |

### Deferred to v1.1 (need new public API routes that aren't critical-path)

- `send_announcement` (newsfeed post)
- `issue_certificate`
- `clone_course_from_template`
- `publish_course_draft` (already an MCP tool; trivial to expose later)
- `create_payment_request`

## Search Catalog (v1)

| Search | Description | Endpoint |
|---|---|---|
| `find_student_by_email` | Look up audience member by exact email | `GET /public-api/v1/audience?email=…` (new filter) |
| `find_course` | Look up a course by slug or title | `GET /public-api/v1/courses?slug=…` or `?title=…` (new filters) |

Both searches power Zapier's find-or-create pattern; together with the create actions, Zapier auto-generates "Find or Create Student" and "Find or Create Course" steps with no extra Zapier app code.

## Authentication and Scopes

### OAuth 2.0 server (new)

Implement the `authorization_code` + `refresh_token` grants from RFC 6749 only. No PKCE, implicit, device, or `client_credentials` grants in v1. Zapier is registered as a single confidential OAuth client.

**Endpoints (hosted on the API):**

| Endpoint | Method | Purpose |
|---|---|---|
| `/oauth/authorize` | GET | Validates `client_id`, `redirect_uri`, `response_type=code`, `scope`, `state`. Redirects the browser to the dashboard consent screen `/oauth/consent`. |
| `/oauth/authorize/issue` | POST | Called by the dashboard consent screen after the admin clicks Authorize. Issues a single-use authorization code (TTL 60 seconds) bound to `org_id`, `client_id`, scopes, `redirect_uri`, and the consenting user. Returns the code to the dashboard, which redirects the browser to `redirect_uri?code=…&state=…`. |
| `/oauth/token` | POST | Exchanges an authorization code for an access token (TTL 1 hour) + refresh token (TTL 90 days). Also handles `grant_type=refresh_token`. |
| `/oauth/revoke` | POST | Revokes an access or refresh token (RFC 7009). |

**Library choice:** Lean on `oauth4webapi` or roll a minimal implementation. The scope is narrow enough that hand-rolling is reasonable; pick during implementation kickoff.

### OAuth client registration

Zapier client credentials are stored as environment variables, not in the database, in v1:

- `ZAPIER_OAUTH_CLIENT_ID`
- `ZAPIER_OAUTH_CLIENT_SECRET`
- `ZAPIER_OAUTH_REDIRECT_URIS` (comma-separated list of allowed callbacks from Zapier's docs)

A `packages/utils/src/oauth/clients.ts` resolver returns the registered clients keyed by `client_id`. Adding Make / n8n / Pipedream later is a config-only change.

### Token storage

New tables (see Technical Design):

- `oauth_authorization_code` — short-lived single-use codes.
- `oauth_access_token` — hashed Bearer tokens.
- `oauth_refresh_token` — hashed long-lived tokens.

Every token row carries: `id`, `client_id`, `organization_id`, `granted_by_profile_id`, `scopes`, `created_at`, `expires_at`, `revoked_at`, `last_used_at`.

### Middleware integration

Extend `automationKeyMiddleware` to a unified `bearerAuthMiddleware` that:

1. Reads `Authorization: Bearer …`.
2. Tries to resolve the token as an OAuth access token (hash-and-lookup against `oauth_access_token`). If found and not expired or revoked, sets:
   - `c.set('orgId')`
   - `c.set('actorId', granted_by_profile_id)`
   - `c.set('authSource', 'oauth')`
   - `c.set('scopes', grant.scopes)`
3. Falls back to the existing automation-key path (`organization_api_key`) for `type: 'api'` / `type: 'mcp'` consumers.
4. Returns `401` if neither path matches.

This means existing API keys keep working unchanged for Make / n8n / Pipedream users who prefer raw bearer tokens. Zapier-only consumers go through OAuth.

### Scopes

Two OAuth scopes:

- `zapier:read` — list, get, search on courses, audience, submissions, certificates, tags, completions, payment requests.
- `zapier:write` — create, update, delete on audience, course assignments, tags.

**Scope-to-route map:**

| Endpoint | Required scopes (OAuth) | Required scopes (API key fallback) |
|---|---|---|
| `GET /public-api/v1/me` | `zapier:read` | `public_api:*` |
| All GET `/public-api/v1/*` triggers and searches | `zapier:read` | `public_api:*` |
| Audience / course / tag write endpoints | `zapier:write` | `public_api:*` |

`automationKeyScopesMiddleware` is extended to check whichever scope set applies based on `c.get('authSource')`.

### Dropping `type: 'zapier'` from API key types

Under the OAuth model, the dashboard never issues Zapier API keys. Update `ZOrganizationApiKeyType` in `packages/utils/src/validation/organization/automation-key.ts` to remove `'zapier'`. Existing rows are zero (the dashboard tab has always been a placeholder), so no migration is needed beyond the schema/enum change.

## Polling Contract

Every list endpoint exposed to Zapier triggers must guarantee:

- **Stable sort:** `sortBy` and `sortOrder` defaulted to newest-first.
- **Stable record ID:** Each record returns an `id` that does not change across pages.
- **Since cursor:** Accept an optional `?since=<ISO-8601>` query parameter so Zapier can request only records newer than the highest `createdAt` it has already seen. If `since` is absent, return the most recent page only.
- **Limit:** `limit <= 100` with a default of 50.
- **Idempotent:** Identical query returns identical results within the polling window.

Zapier polls every 1–15 minutes depending on the customer's Zapier plan. Our endpoints must remain cheap to poll under that cadence.

## Future REST Hooks Upgrade Path

When `prd/webhooks/README.md` ships, we add to the Zapier app:

1. Replace the existing subscribe / unsubscribe no-ops with calls to the webhook management API (`POST /organization/webhooks` with a Zapier-managed endpoint).
2. Move the high-volume triggers (`exercise_submitted`, `lesson_completed`, `newsfeed_post_created`) to REST Hook mode and ship them in v1.1.
3. Keep the existing polling triggers as a fallback when the webhook URL is unreachable.

This is a Zapier-app-only change in v1.1 — the public API surface does not change shape.

## Plan Gating

Zapier is a binary plan feature. No monthly credit budgets.

Add `ZAPIER_AUTOMATION_LIMITS_BY_PLAN` to `packages/utils/src/plans/automation.ts`:

| Plan | Zapier enabled | Max active grants | Per-org reads / min | Per-org writes / min |
|---|---|---:|---:|---:|
| Basic | No | 0 | 0 | 0 |
| Early Adopter | Yes | 5 | 120 | 40 |
| Enterprise | Yes | 25 | 360 | 120 |

**Enforcement points:**

- At `/oauth/authorize`: reject the request with `error=access_denied` if the consenting org's plan does not include Zapier, or if max active grants is already reached.
- At `bearerAuthMiddleware` for OAuth tokens: reject with `403` + `code: PLAN_GATED` if the org's plan has dropped below Early Adopter since the grant was issued.
- At route entry: rate-limit against the per-minute caps using the existing rate-limiter middleware, keyed by `(org_id, scope_category)`.
- Usage tracking: every Zapier API call still increments `organization_automation_usage` with category `read` or `write` for visibility, but no credits are deducted.

### Plan downgrade flow

1. The plan-change service emits an internal event `organization.plan.changed`.
2. A handler in `apps/api/src/services/oauth/` checks whether the new plan disables Zapier.
3. If yes, revoke all active OAuth grants for the org by setting `revoked_at` on every related access and refresh token.
4. The dashboard Zapier tab then shows the plan-gating callout with an upgrade CTA.

Basic / free plan users still see the dashboard Zapier tab so they understand the feature exists. The Connect CTA is replaced by an upgrade CTA. No connect link is rendered.

## Technical Design

### Schema additions

In `packages/db/src/schema.ts`:

#### `oauth_authorization_code`

- `id` (UUID, primary)
- `code_hash` (string, indexed unique)
- `client_id` (string)
- `organization_id` (UUID, FK)
- `granted_by_profile_id` (UUID, FK)
- `redirect_uri` (string)
- `scopes` (text[])
- `created_at`, `expires_at` (60 s TTL)
- `consumed_at` (nullable; codes are single-use)

#### `oauth_access_token`

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

#### `oauth_refresh_token`

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

- `packages/utils/src/validation/public-api/audience.ts` — accept email filter on `ZPublicApiAudienceQuery` and broaden `ZPublicApiUpdateAudience` to support full profile (name, locale, custom attributes).
- `packages/utils/src/validation/public-api/course.ts` — accept slug and title filters on the list query.
- `packages/utils/src/validation/organization/automation-key.ts` — remove `'zapier'` from `ZOrganizationApiKeyType`. The `zapier:read` / `zapier:write` scope strings live in the new OAuth scope enum, not in the automation-key scope enum.

### Query Layer

Add:

- `packages/db/src/queries/oauth/authorization-code.ts` — issue, consume, expire.
- `packages/db/src/queries/oauth/access-token.ts` — issue, lookup by hash, revoke, touch `last_used_at`.
- `packages/db/src/queries/oauth/refresh-token.ts` — issue, lookup by hash, revoke, list active grants per org.
- `packages/db/src/queries/course/completions.ts` — list completions ordered by `completedAt` with since cursor.
- `packages/db/src/queries/course/certificates.ts` — list issued certificates with since cursor.
- `packages/db/src/queries/course/payment-requests.ts` — list payment requests with since cursor.
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

Extend `apps/api/src/services/v1/audience.ts` to handle the broadened update payload and the tag/untag action.

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

Public API routes follow the existing v1 pattern: `bearerAuthMiddleware` + `automationKeyScopesMiddleware` + `describeRoute` + validator. Each route returns a single response type per the routing rules in `AGENTS.md`.

### Dashboard Routes

New routes:

- `apps/dashboard/src/routes/(app)/oauth/consent/+page.svelte` — consent screen.
- `apps/dashboard/src/routes/(app)/oauth/consent/+page.server.ts` — load consent context (client, scopes, redirect URI, eligible orgs).

New routes:

- `apps/dashboard/src/routes/(app)/org/[slug]/automation/zapier/apps/+page.svelte` — App Directory.
- `apps/dashboard/src/routes/(app)/org/[slug]/automation/zapier/apps/[slug]/+page.svelte` — per-app page.
- `apps/dashboard/src/routes/(app)/org/[slug]/automation/zapier/connection/+page.svelte` — connection screen (grants table, rate limits, setup guide).
- `apps/dashboard/src/lib/features/automation/utils/zapier-apps.ts` — the curated 20-app catalog (static config).

Replace:

- `apps/dashboard/src/lib/features/automation/pages/zapier.svelte` — Zaps page with the not-connected and connected states.
- `apps/dashboard/src/routes/(app)/org/[slug]/zapier/+page.svelte` and any associated `+page.server.ts` — hydrate grants list and rate-limit data.

New API class:

- `apps/dashboard/src/lib/features/automation/api/automation-oauth.svelte.ts` — list grants, revoke a grant, consent action.

### Zapier App (`apps/zapier`)

New workspace package:

```text
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

## Dependencies

Dependencies (not introduced into root):

- `zapier-platform-core` (Zapier-required runtime).
- `@cio/utils` for typed payload schemas via workspace protocol.

### Build/Release Flow

- `pnpm --filter @cio/zapier build` — typechecks the app.
- `pnpm --filter @cio/zapier zapier:push` — uploads to Zapier under a private app version.
- `pnpm --filter @cio/zapier zapier:promote` — manual step to promote a tested version.
- No CI auto-push. Promotion is a manual step gated on the on-call engineer.

## API and Docs

- Every new `/public-api/v1/*` route added under this PRD is annotated with `describeRoute` so it lands in the existing OpenAPI generator.
- Run `pnpm --filter @cio/api upload:openapi` after route additions.
- Add a Zapier guide in `apps/docs`:
  - Connecting your account (click Connect on Zapier or from the ClassroomIO Zapier tab, approve access, done).
  - Trigger catalog with sample payloads.
  - Action catalog with required fields.
  - Search catalog.
  - Rate limits and plan limits.
  - Troubleshooting (connection revoked, scope missing, plan downgrade).
- Update `apps/website/src/routes/automation/+page.svelte` to add a Zapier section alongside REST API + Webhooks + MCP. Include the canonical Zaps as copy.
- Add a Connect on Zapier button to `apps/website/src/lib/components/automate-section.svelte`.

## Rollout Plan

### Phase 1: OAuth Server Foundation

- Schema: `oauth_authorization_code`, `oauth_access_token`, `oauth_refresh_token`.
- Queries, services, validation for OAuth.
- Routes: `/oauth/authorize`, `/oauth/authorize/issue`, `/oauth/token`, `/oauth/revoke`.
- Extend `bearerAuthMiddleware` to resolve OAuth tokens before falling back to automation keys.
- Add `zapier:read` / `zapier:write` scope enforcement to `automationKeyScopesMiddleware`.
- Plan-guard hook into `license.ts` for downgrade revocation.
- Drop `'zapier'` from `organization_api_key.type` enum.

### Phase 2: Consent Screen + Dashboard

- Build `/oauth/consent` page in the dashboard with org picker, scope-edit, Authorize / Deny, and the non-admin state.
- Replace `pages/zapier.svelte` placeholder with the Zaps page (not-connected and connected states) and add the connection screen with per-grant Revoke, rate limits, setup guide and docs callout.
- Add the admin-permission and plan-gating callouts, and hide every connect link on Basic.
- Build the App Directory and per-app pages from the static 20-app catalog. These can ship after the consent screen and connection screen without blocking them.
- Add `automation.zapier.*` translations (followed by `pnpm translate`).

### Phase 3: Public API Surface

- Add `GET /public-api/v1/me`.
- Extend audience update payload + add `?email=` filter.
- Add course list `?slug=` / `?title=` filters.
- Add tag list + tag/untag audience endpoints.
- Add enrollments, course-completions, certificates, payment-requests list endpoints with `?since=` cursors.
- Build and upload OpenAPI spec.

### Phase 4: Zapier App

- Scaffold `apps/zapier` with `zapier-platform-core` configured for OAuth 2.0.
- Implement triggers, creates, searches against the public API.
- Add dynamic dropdowns powered by `/courses` and `/tags`.
- Add sample data for each trigger.
- `zapier push` private app version `1.0.0`.

### Phase 5: Private Validation

- Distribute the shared private invite URL to paying orgs.
- Collect usage data via `organization_automation_usage`.
- Iterate on copy, scopes UX, and field defaults based on Zap author feedback.
- Update docs and marketing.

### Phase 6: Public Listing

- Submit to Zapier directory review.
- Promote app version once approved.
- Update marketing site and announce.

### Phase 7 (v1.1): REST Hooks Upgrade

- Wait for `prd/webhooks` ship.
- Wire subscribe / unsubscribe to the webhook management API.
- Promote `exercise_submitted`, `lesson_completed`, `newsfeed_post_created` to instant triggers.

### Phase 8 (v2): Programs, More Actions, More iPaaS Apps

- Add `program_completed` trigger and `apps/zapier` integration.
- Add `send_announcement`, `issue_certificate`, `clone_course_from_template`, `publish_course_draft`, `create_payment_request` actions.
- Register Make / n8n / Pipedream as additional OAuth clients (config-only).
- Consider native Make and Pipedream packages if customers ask.

## Success Metrics

- ≥ 5 orgs connect Zapier (an active grant) within 30 days of private invite.
- ≥ 100 Zap runs/week within 60 days of private invite.
- p95 trigger latency under 5 minutes on the Early Adopter plan (Zapier polling cadence).
- < 2% of Zap runs fail due to API errors (excluding user misconfiguration).
- ≥ 80% of connected orgs use at least one trigger and one action (i.e., the integration is bidirectional, not one-way data export).
- Zero security incidents related to leaked or misused Zapier grants or tokens.
- ≥ 50% of connected orgs started from the dashboard (Create a Zap, Connect Apps or an app page) rather than the invite URL, once the directory ships.

## Risks and Mitigations

| Risk | Mitigation |
|---|---|
| OAuth server is a new attack surface. | Keep the implementation minimal (`authorization_code` + `refresh_token` only). Hash tokens at rest. Single-use authorization codes with 60-second TTL. Server-side scope validation. Add OAuth-specific security tests. Run a security review of the implementation before public listing. |
| Polling latency dissatisfies customers expecting real-time. | Set expectation in dashboard and docs ("delivered within ~5 minutes on polling, instant after webhooks v1.1"). Prioritize webhooks PRD ship. |
| `exercise_submitted` demand on polling. | Do not ship it in v1. Document that it lands with v1.1 / webhooks. |
| Zapier's marketplace review rejects public listing. | Stay private until v1 is polished. Use private validation period to fix UX issues Zapier reviewers commonly flag (sample data, error messages, dropdown UX, OAuth flow edge cases). |
| Plan gating frustrates Basic users who see the tab but cannot use it. | Clear upgrade CTA copy, and a docs link explaining why Zapier sits on Early Adopter+. |
| Plan downgrade silently revokes grants and breaks live Zaps. | Surface a banner in the dashboard 7 days before a known billing-driven downgrade fires (where the billing system gives notice). For immediate downgrades, send a notification email naming each revoked grant and the Zaps that may be affected. |
| Drift between Zapier app schema and public API schema. | `apps/zapier` consumes types from `@cio/utils/validation/public-api` directly so a schema change at the API breaks the Zapier build at CI time. |
| Shared private invite URL leaks publicly. | Enforce plan gating at the `/oauth/authorize` step regardless of who clicks Connect. Leakage of the invite URL is harmless because the OAuth flow still verifies the user is an admin of an Early Adopter+ org. |

## Build and Verification Commands

```bash
pnpm --filter @cio/utils build
pnpm --filter @cio/db build
pnpm --filter @cio/api build
pnpm --filter @cio/api upload:openapi
pnpm --filter @cio/dashboard build
pnpm --filter @cio/zapier build
pnpm --filter @cio/zapier zapier:push
```

`zapier:push` is a manual, gated step.

### Manual Verification

1. Install the Zapier app via the private invite URL while logged out — confirm Zapier prompts for ClassroomIO login during the OAuth handshake.
2. Complete the OAuth flow as an org admin on Early Adopter — confirm Test Connection in Zapier shows the org name returned by `GET /public-api/v1/me`.
3. Try the OAuth flow as a non-admin of the same org — confirm Authorize is hidden or disabled and Deny redirects with `error=access_denied`.
4. Try the OAuth flow on a Basic-plan org — confirm `/oauth/authorize` rejects with the upgrade CTA visible.
5. Untick `zapier:write` on the consent screen — confirm the resulting token only allows read endpoints and 403s on write endpoints.
6. Build a Zap: New audience member → Slack message. Trigger by adding an audience member; receive Slack message within 5 minutes.
7. Build a Zap: HubSpot deal → Enroll student in course. Add a deal; confirm the audience member appears and is assigned.
8. Build a Zap: Certificate issued → Google Drive upload. Issue a cert; confirm the file appears.
9. Revoke the grant from the dashboard; confirm all three Zaps surface authentication errors on next run and Zapier shows a re-connect prompt.
10. Downgrade the org to Basic; confirm the dashboard tab shows the upgrade CTA, the existing grants are revoked immediately, and Zaps fail with a `PLAN_GATED` error.
11. Force an access token expiry; confirm Zapier transparently refreshes via `/oauth/token` without user interaction.
12. As an admin on a not-connected org, click Create a Zap and Connect Apps → app → Connect; confirm both go through the consent screen before reaching Zapier, and that Deny returns to the Zaps page with the "Access denied" toast and no grant.
13. On a connected org, confirm Create More Zaps opens the Zapier editor without a consent step, View connection opens the connection screen, and View on Zapier opens `https://zapier.com/app/connections` in a new tab.
14. Revoke the only grant from the connection screen; confirm the org returns to the not-connected state and the Automation hub card shows Connect again.
15. Switch to a non-admin member; confirm the admin callout shows and connect, manage and revoke controls are disabled.
16. On a Basic-plan org, confirm the plan callout shows, the tab stays visible, and no connect, directory or invite link is rendered.
17. In the App Directory, confirm search, category filters with real counts, sort and View more apps work, and that filters and pagination survive a reload through the query string.

