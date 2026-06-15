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

1. **Distribution**: ship as a private Zapier app via invite link first; promote to the public Zapier directory after ~5 paying orgs are using it and v1 is stable.
2. **Plan gating**: Early Adopter+ only. Mirrors MCP gating.
3. **Scopes**: introduce two new automation-key scopes, `zapier:read` and `zapier:write`. Both are granted by default when an admin creates a Zapier-typed key; admins can downgrade to read-only.
4. **Triggers in v1**: polling only. No webhook dependency. Real-time REST Hooks ship in v1.1 once the webhooks PRD lands.
5. **Trigger scope**: org-wide by default, with optional `Course` and `Tag` dropdown filters per trigger. No separate per-course trigger duplicates.
6. **iPaaS parity**: the public REST API is the integration surface. Zapier, Make, n8n, and Pipedream all consume the same endpoints with the same Zapier-typed key. The Zapier app is packaging only — no Zapier-specific endpoints, payloads, or auth shapes.
7. **Repo location**: `apps/zapier`. The Zapier app is a deployable that gets `zapier push`-ed to Zapier's cloud. Nothing else in the monorepo imports from it, so it sits next to `apps/api` and `apps/dashboard` rather than in `packages/`.

## Current-State Audit

| Capability | Current State | Notes |
| --- | --- | --- |
| Org-scoped automation keys | available | `organization_api_key` already supports `type: 'mcp' \| 'api' \| 'zapier'`. Rotation, revoke, last-used tracking all shipped. |
| Bearer auth middleware | available | `automationKeyMiddleware` + `automationKeyScopesMiddleware` in `apps/api/src/middlewares/`. |
| Public REST API | partial | `/public-api/v1/courses` and `/public-api/v1/audience` shipped. Tags, announcements, certificates, course clone, full audience update still missing. |
| Test-connection endpoint | missing | No `GET /public-api/v1/me` for Zapier's auth-test step. |
| Polling cursor / since filter | missing | List endpoints support `page/limit` but no `?since=` or `?cursor=` for stable Zapier polling. |
| Email/slug search filters | missing | Audience list does not accept `?email=`; courses list does not accept `?slug=` or `?title=`. |
| Webhooks delivery | missing | `prd/webhooks/README.md` written but unshipped. Not a v1 dependency. |
| Dashboard Zapier tab | partial | `/org/[slug]/automation/zapier` route exists but renders a `coming_soon` callout. |
| Automation usage tracking | available | `organization_automation_usage` already records `read \| write \| publish` by automation key. |
| Plan gating utilities | available | `MCP_AUTOMATION_LIMITS_BY_PLAN` pattern in `packages/utils/src/plans/automation.ts` is the reference for Zapier limits. |
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

1. An org admin can create a Zapier-typed automation key in `/org/[slug]/automation/zapier` and paste it into Zapier to authenticate the app in under 2 minutes.
2. Non-engineering customers can build the three canonical Zaps without code:
   - CRM new customer → enroll in onboarding course.
   - Certificate issued → upload to HRIS / Drive.
   - Exercise submitted → notify tutor in Slack.
3. The Zapier app exposes a useful but small surface: 6 triggers, 5 actions, 2 searches in v1.
4. Same endpoints work for Make, n8n, and Pipedream with no additional development.
5. Plan and usage limits are visible to admins on the Zapier dashboard tab, identical in shape to the MCP tab.
6. The integration is forward-compatible with webhooks: when REST Hooks become available, high-volume triggers (exercise submitted, lesson completed) upgrade with no UX change for the Zapier user.

## Non-Goals (v1)

1. Public listing in the Zapier directory (deferred until v1 is validated with ~5 customers).
2. Real-time triggers via REST Hooks (deferred to v1.1, gated on `prd/webhooks`).
3. High-volume triggers (`exercise.submitted`, `lesson.completed`) that are impractical on polling.
4. Make / n8n / Pipedream apps as separate packaged listings (the REST API supports them; no curated app yet).
5. Free-plan access (gated to Early Adopter+).
6. Inbound webhooks from Zapier to ClassroomIO (Zapier writes via REST actions, not webhooks).
7. Per-key task quotas in v1 (we rely on Zapier's plan-level task quotas and the existing org-wide credit pool).
8. Custom triggers / dynamic events authored by the customer.
9. Branding review and Zapier marketplace screenshots (post-private validation).

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

Route: `/org/[slug]/automation/zapier`. Mirror the MCP page (`apps/dashboard/src/lib/features/automation/pages/mcp.svelte`) section-for-section.

Required sections (top to bottom):

1. **Admin permission callout** for non-admin users.
2. **Usage cards** for Zapier-specific limits (active keys / monthly task credits / read+write rates). Hydrate from `GET /organization/automation/usage?type=zapier`.
3. **Key table** filtered to `type === 'zapier'`. Columns: label, scopes, last used, created at, status. Row actions: rotate, revoke.
4. **Create key flow** with one-time secret reveal. Default scopes: both `zapier:read` and `zapier:write`. Admins can untick `zapier:write` to make a read-only key.
5. **"Connect on Zapier" CTA** linking to the private invite URL (and later the public listing).
6. **Setup guide** with the same screenshot/step pattern MCP uses: copy key → open Zapier → paste in `Connect ClassroomIO`.
7. **Docs callout** linking to `apps/docs` Zapier guide.

Reuse:

- `automationApi` (`apps/dashboard/src/lib/features/automation/api/automation.svelte.ts`).
- Shared types in `apps/dashboard/src/lib/features/automation/utils/types.ts`.
- Replace the current placeholder in `apps/dashboard/src/lib/features/automation/pages/zapier.svelte`.

### Zapier App UX

The Zapier app surface, as seen by a Zap author:

- **App name**: ClassroomIO
- **Auth screen**:
  - Single field: `API Key` (bearer token from `/automation/zapier`).
  - Test step calls `GET /public-api/v1/me` and shows `{org.name} ({key.label})`.
- **Trigger picker** lists the 6 triggers below with one-line descriptions matching the website's voice.
- **Action picker** lists the 5 actions below.
- **Search picker** lists the 2 searches below.
- **Dynamic dropdowns**:
  - `Course` dropdown is powered by `GET /public-api/v1/courses?fields=id,title&limit=100`.
  - `Tag` dropdown is powered by `GET /public-api/v1/tags?limit=100` (new endpoint, see Technical Design).
- **Sample data**: every trigger ships a static sample record so Zap authors can build downstream steps without firing a real event.

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
| `program_completed` | A learner finished an entire program | `GET /public-api/v1/program-completions?sortBy=completedAt&sortOrder=desc` (new) | `programId` |

Deferred to v1.1 (require webhooks for sane volume / latency):

- `exercise_submitted`
- `exercise_graded`
- `lesson_completed`
- `newsfeed_post_created`
- `community_question_created`
- `compliance_course_overdue`

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

### Bearer token

- Reuse `automationKeyMiddleware`. No new auth path.
- The Zapier app sends `Authorization: Bearer <key>` on every call.
- Zapier's `Test Connection` step calls `GET /public-api/v1/me` and renders the returned `org.name` and `key.label`.

### New scopes

Add to `ZOrganizationApiKeyScope` in `packages/utils/src/validation/organization/automation-key.ts`:

```typescript
'zapier:read',
'zapier:write'
```

Scope-to-route map:

| Endpoint | Required scopes |
| --- | --- |
| `GET /public-api/v1/me` | `zapier:read \| public_api:*` |
| All `GET /public-api/v1/*` triggers and searches | `zapier:read \| public_api:*` |
| Audience/course/tag write endpoints used by Zapier actions | `zapier:write \| public_api:*` |

The `public_api:*` alias remains valid so existing public-API keys keep working unchanged. Zapier-typed keys default to both scopes at creation; admins can untick `zapier:write` for a read-only key.

### Key-type guard

`automationKeyScopesMiddleware` already enforces scope membership. No additional middleware needed. Existing `public_api:*` keys can still drive the same endpoints — Zapier-typed keys are simply the convention we recommend in the dashboard, and the dashboard surfaces them separately so admins can revoke Zapier independently.

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

Add `ZAPIER_AUTOMATION_LIMITS_BY_PLAN` to `packages/utils/src/plans/automation.ts` alongside the existing MCP table:

| Plan | Active keys | Monthly task credits | Per-key reads / min | Per-key writes / min |
| --- | --- | --- | --- | --- |
| Basic | 0 | 0 | 0 | 0 |
| Early Adopter | 3 | 1,000 | 60 | 20 |
| Enterprise | 10 | 10,000 | 180 | 60 |

Usage categories: every `zapier:read` call counts as `read`, every `zapier:write` call as `write`. Reuse the existing `organization_automation_usage` table; no new schema.

Free / Basic plan users see the Zapier tab but cannot create a key; the create CTA links to the upgrade flow with copy `Upgrade to Early Adopter to use Zapier`.

## Technical Design

### Validation Layer

Add new files:

- `packages/utils/src/validation/public-api/tag.ts`
- `packages/utils/src/validation/public-api/me.ts`
- `packages/utils/src/validation/public-api/enrollments.ts`
- `packages/utils/src/validation/public-api/completions.ts`
- `packages/utils/src/validation/public-api/certificates.ts`
- `packages/utils/src/validation/public-api/payment-requests.ts`

Extend:

- `packages/utils/src/validation/public-api/audience.ts` — accept `email` filter on `ZPublicApiAudienceQuery` and broaden `ZPublicApiUpdateAudience` to support full profile (name, locale, custom attributes).
- `packages/utils/src/validation/public-api/course.ts` — accept `slug` and `title` filters on the list query.
- `packages/utils/src/validation/organization/automation-key.ts` — add `'zapier:read'` and `'zapier:write'` to `ZOrganizationApiKeyScope`.

### Query Layer

Reuse where possible (audience, course, tag queries already exist in `packages/db/src/queries/*`). Add only:

- `packages/db/src/queries/course/completions.ts` — list completions ordered by `completedAt` with `since` cursor.
- `packages/db/src/queries/course/certificates.ts` — list issued certificates with `since` cursor.
- `packages/db/src/queries/course/payment-requests.ts` — list payment requests with `since` cursor.
- `packages/db/src/queries/program/completions.ts` — same shape for programs.
- `packages/db/src/queries/organization/me.ts` — read org + key metadata for the test-connection endpoint.

### Service Layer

New services:

- `apps/api/src/services/v1/me.ts`
- `apps/api/src/services/v1/tag.ts`
- `apps/api/src/services/v1/enrollments.ts`
- `apps/api/src/services/v1/completions.ts`
- `apps/api/src/services/v1/certificates.ts`
- `apps/api/src/services/v1/payment-requests.ts`

Extend `apps/api/src/services/v1/audience.ts` to handle the broadened `update` payload and the `tag/untag` action.

### Route Layer

New routes (all under `/public-api/v1`):

- `GET /public-api/v1/me`
- `GET /public-api/v1/audience/enrollments`
- `GET /public-api/v1/course-completions`
- `GET /public-api/v1/program-completions`
- `GET /public-api/v1/certificates`
- `GET /public-api/v1/payment-requests`
- `GET /public-api/v1/tags`
- `POST /public-api/v1/audience/:memberId/tags`
- `DELETE /public-api/v1/audience/:memberId/tags/:tagId`

Routes follow the existing v1 pattern: `automationKeyMiddleware` + `automationKeyScopesMiddleware` + `describeRoute` + `validator`. Each route returns a single response type per the routing rules in `AGENTS.md`.

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

### Phase 1: API foundation

1. Add `zapier:read` and `zapier:write` scopes.
2. Add `GET /public-api/v1/me`.
3. Extend audience update payload + add `?email=` filter.
4. Add course list `?slug=` / `?title=` filters.
5. Add tag list + tag/untag audience endpoints.
6. Build and upload OpenAPI spec.

### Phase 2: Trigger endpoints

1. Add `enrollments`, `course-completions`, `program-completions`, `certificates`, `payment-requests` list endpoints.
2. Ensure each accepts `?since=` cursor and `sortBy/sortOrder` defaults.

### Phase 3: Dashboard Zapier tab

1. Replace `pages/zapier.svelte` placeholder with the real implementation mirroring `pages/mcp.svelte`.
2. Add `+page.server.ts` to load Zapier keys and usage.
3. Add `automation.zapier.*` translations (followed by `pnpm translate`).
4. Add plan-gating callout for Basic plan.

### Phase 4: Zapier app

1. Scaffold `apps/zapier` with `zapier-platform-core`.
2. Implement triggers, creates, searches against the public API.
3. Add dynamic dropdowns powered by `/courses` and `/tags`.
4. Add sample data for each trigger.
5. `zapier push` private app version 1.0.0.

### Phase 5: Private validation

1. Distribute the private invite URL to ~5 paying orgs.
2. Collect usage data via `organization_automation_usage`.
3. Iterate on copy and field defaults based on Zap author feedback.
4. Update docs and marketing.

### Phase 6: Public listing

1. Submit to Zapier directory review.
2. Promote app version once approved.
3. Update marketing site and announce.

### Phase 7 (v1.1): REST Hooks upgrade

1. Wait for `prd/webhooks` ship.
2. Wire `subscribe` / `unsubscribe` to the webhook management API.
3. Promote `exercise_submitted`, `lesson_completed`, `newsfeed_post_created` to instant triggers.

## Success Metrics

1. >= 5 orgs connect a Zapier key within 30 days of private invite.
2. >= 100 Zap runs/week within 60 days of private invite.
3. p95 trigger latency under 5 minutes on the Early Adopter plan (Zapier polling cadence).
4. < 2% of Zap runs fail due to API errors (excluding user misconfiguration).
5. >= 80% of connected orgs use at least one trigger and one action (i.e., the integration is bidirectional, not one-way data export).
6. Zero security incidents related to leaked or misused Zapier keys.

## Risks and Mitigations

1. **Polling latency dissatisfies customers expecting real-time.**
   - Mitigation: set expectation in dashboard and docs ("delivered within ~5 minutes on polling, instant after webhooks v1.1"). Prioritize webhooks PRD ship.
2. **`exercise_submitted` demand on polling.**
   - Mitigation: do not ship it in v1. Document that it lands with v1.1 / webhooks.
3. **Zapier's marketplace review rejects public listing.**
   - Mitigation: stay private until v1 is polished. Use private validation period to fix UX issues Zapier reviewers commonly flag (sample data, error messages, dropdown UX).
4. **Plan gating frustrates Basic users who see the tab but cannot use it.**
   - Mitigation: clear upgrade CTA copy, and a docs link explaining why Zapier sits on Early Adopter+.
5. **Customers paste raw API keys into Zaps and forget to revoke when offboarding employees.**
   - Mitigation: encourage labelled Zapier-typed keys per Zap; show `lastUsedAt` in the dashboard table; auto-disable keys idle for 180 days (post-v1).
6. **Drift between Zapier app schema and public API schema.**
   - Mitigation: `apps/zapier` consumes types from `@cio/utils/validation/public-api` directly so a schema change at the API breaks the Zapier build at CI time.

## Build and Verification Commands

1. `pnpm --filter @cio/utils build`
2. `pnpm --filter @cio/db build`
3. `pnpm --filter @cio/api build`
4. `pnpm --filter @cio/api upload:openapi`
5. `pnpm --filter @cio/dashboard build`
6. `pnpm --filter @cio/zapier build`
7. `pnpm --filter @cio/zapier zapier:push` (manual, gated)

Manual verification:

1. Create a Zapier-typed key in `/org/[slug]/automation/zapier` with default scopes.
2. Paste into Zapier private invite URL; confirm `Test Connection` shows the org name.
3. Build a Zap: `New audience member` → Slack message. Trigger by adding an audience member; receive Slack message within 5 minutes.
4. Build a Zap: HubSpot deal → `Enroll student in course`. Add a deal; confirm the audience member appears and is assigned.
5. Build a Zap: `Certificate issued` → Google Drive upload. Issue a cert; confirm the file appears.
6. Revoke the key from the dashboard; confirm all three Zaps surface authentication errors on next run.
7. Downgrade the plan to Basic; confirm the dashboard tab shows the upgrade CTA and the existing key continues to work (or is gracefully disabled — decide in implementation).

## Open Questions

1. On plan downgrade from Early Adopter to Basic, should existing Zapier keys keep working or be auto-disabled?
2. Should Zap usage count against the same monthly credit pool as MCP, or have a separate Zapier credit budget?
3. Do we expose `client_id` / `client_secret` style OAuth in a later version for orgs that prefer it over API keys?
4. Should the private invite URL be a single shareable link, or one-per-customer for revocation control?
5. Do we surface a "Disconnect Zapier" button on the dashboard that revokes all `type: 'zapier'` keys in one click, or rely on the existing per-key revoke?
6. Is `program_completed` worth shipping in v1, or wait until at least one paying org asks for it?
