# Webhooks PRD

## Purpose

Enable organization admins to send real-time ClassroomIO events to external systems (CRM, Slack, custom backend, analytics, HRIS) through secure outbound webhooks.

This closes the current automation gap between ClassroomIO actions and downstream business workflows.

## Problem Statement

Today, ClassroomIO has no outbound webhook product:

- Organizations cannot trigger external workflows when key events happen (invites, enrollments, submissions, payment requests, etc.).
- Teams rely on manual exports, inbox monitoring, or custom polling against internal APIs.
- Current integrations UI (`/settings/integrations`) is Telegram-specific and does not provide event-driven automation.
- The public API PRD already reserved an "Automation > Webhooks" tab, but it is currently "coming soon."

## Current-State Audit

| Capability | Current State | Notes |
| --- | --- | --- |
| Outbound webhooks | missing | No endpoint configuration, no delivery system |
| Event audit sources | partial | Strong invite audit trails exist (`course_invite_audit`, `organization_invite_audit`) |
| Trigger points in services | available | Existing service flows for invites, members, submissions, payments, newsfeed, community, lesson completion |
| Integrations UI | partial | Telegram-only settings page exists |
| API auth middleware | available | `authMiddleware`, `orgAdminMiddleware`, `apiKeyMiddleware` patterns already in use |
| Queue/worker infra | partial | Redis exists for rate-limiting; no webhook delivery queue yet |
| API documentation pipeline | available | OpenAPI generation/publishing flow already defined in repo |

## Data Sources Checked

- `apps/api/src/services/course/invite.ts`
- `apps/api/src/services/organization/invite.ts`
- `apps/api/src/services/course/people.ts`
- `apps/api/src/services/submission/submission.ts`
- `apps/api/src/services/course/payment-request.ts`
- `apps/api/src/services/newsfeed/newsfeed.ts`
- `apps/api/src/services/community.ts`
- `apps/api/src/services/lesson/lesson.ts`
- `apps/api/src/routes/invite/invite.ts`
- `apps/api/src/routes/course/invite.ts`
- `apps/api/src/routes/course/people.ts`
- `apps/api/src/routes/course/submission.ts`
- `apps/api/src/routes/course/payment-request.ts`
- `apps/dashboard/src/routes/org/[slug]/settings/integrations/+page.svelte`
- `apps/dashboard/src/lib/features/settings/pages/integrations.svelte`
- `prd/public-api/README.md`

## Product Goals

1. Admins can create and manage organization-scoped webhook endpoints.
2. Admins can subscribe webhooks to all events or selected events.
3. ClassroomIO delivers signed event payloads reliably with retry and delivery logs.
4. Admins can inspect delivery history and manually redeliver failed (or any past) events.
5. Webhooks are exposed in a dedicated Automation UX (not Telegram settings).
6. Initial event catalog maps directly to existing domain actions already implemented in services.

## Non-Goals (v1)

- Incoming webhooks (ClassroomIO as receiver).
- OAuth app ecosystem / public app marketplace.
- Zapier app implementation (kept separate; can reuse webhook infrastructure later).
- Custom per-webhook payload templates.
- Exactly-once delivery guarantees.
- Branch-level or object-field-level subscription filters.

## User Stories

1. As an org admin, I want to send `course.submission.created` to Slack so tutors are alerted instantly.
2. As an org admin, I want to sync `course.invite.accepted` and `course.member.added` to my CRM.
3. As an org admin, I want a secret-signed payload so I can verify requests came from ClassroomIO.
4. As an org admin, I want delivery logs and redelivery so failures are operable and debuggable.

## UX Requirements

### Navigation and IA

- Add an org nav item: `Automation` (`/org/[slug]/automation`) for org admins.
- Page tabs:
  - `API`
  - `Zapier` (coming soon)
  - `Webhooks`
- Keep existing `/settings/integrations` (Telegram) unchanged in v1.

### Webhooks Tab

#### List View

- Table columns:
  - Name
  - Payload URL
  - Events count (`All` or count of selected events)
  - Last delivery status
  - Last delivery timestamp
  - Active toggle
- Actions:
  - Edit
  - Send test payload
  - View deliveries
  - Delete

#### Add/Edit Form

Fields (GitHub-like, adapted to ClassroomIO):

- `Payload URL` (required, HTTPS recommended)
- `Content type` (v1: `application/json` only)
- `Secret` (optional but strongly recommended)
- `SSL verification`
  - `Enable SSL verification` (default)
  - `Disable` (warning shown; intended for dev/self-host)
- `Event selection mode`
  - `Send me everything`
  - `Let me select individual events`
- If individual mode: checkbox list of supported events with one-line descriptions.
- `Active` toggle.

#### Delivery Log View

- Filter by status (`Success`, `Failed`, `Pending`, `Retrying`).
- Shows:
  - Event type
  - Attempt number
  - HTTP status
  - Request timestamp
  - Response time
  - Retry schedule / next retry
- Delivery details panel:
  - Request headers (including delivery and signature headers)
  - Payload JSON
  - Response status/body (truncated with copy action)
  - Error message if network/TLS failure
- `Redeliver` action for any delivery event retained in window.

## Event Catalog (v1)

Event names use dot notation: `domain.entity.action`.

| Event Type | Trigger Point | Source |
| --- | --- | --- |
| `organization.invite.created` | Team invite created | `services/organization/invite.ts` |
| `organization.invite.accepted` | Team invite accepted | `services/organization/invite.ts` |
| `organization.invite.revoked` | Team invite revoked/superseded | `services/organization/invite.ts` |
| `course.invite.created` | Student invite created | `services/course/invite.ts` |
| `course.invite.accepted` | Student invite accepted/enrolled | `services/course/invite.ts` |
| `course.invite.revoked` | Student invite revoked | `services/course/invite.ts` |
| `course.member.added` | Member added to course | `services/course/people.ts` |
| `course.submission.created` | Exercise submission created | `services/submission/submission.ts` |
| `course.submission.status_changed` | Submission status updated (e.g. graded) | `services/submission/submission.ts` |
| `course.payment_request.created` | Payment request form submitted | `services/course/payment-request.ts` |
| `course.newsfeed.post.created` | Newsfeed post created | `services/newsfeed/newsfeed.ts` |
| `course.newsfeed.comment.created` | Newsfeed comment created | `services/newsfeed/newsfeed.ts` |
| `community.question.created` | Community post created | `services/community.ts` |
| `community.answer.created` | Community comment/answer created | `services/community.ts` |
| `lesson.completion.updated` | Learner completion state changed | `services/lesson/lesson.ts` |

Default recommendation in UI for first-time setup:

- Pre-check high-signal workflow events:
  - `course.invite.accepted`
  - `course.member.added`
  - `course.submission.created`
  - `course.submission.status_changed`
  - `course.payment_request.created`

## Payload Contract

### HTTP Headers

- `Content-Type: application/json`
- `User-Agent: ClassroomIO-Webhooks/1.0`
- `X-Cio-Event: <event_type>`
- `X-Cio-Delivery: <delivery_id>`
- `X-Cio-Webhook: <webhook_id>`
- `X-Cio-Timestamp: <unix_seconds>`
- `X-Cio-Signature-256: sha256=<hmac_hex>` (present when secret configured)

### Signature

- Algorithm: HMAC-SHA256
- Signed content: `<timestamp>.<raw_request_body>`
- Secret handling:
  - Stored encrypted at rest (not plain text)
  - Not returned from read APIs after creation
- Verification window recommendation to consumers: 5 minutes.

### Event Body Envelope

```json
{
  "id": "evt_01JXXXX",
  "type": "course.submission.created",
  "createdAt": "2026-02-24T12:15:30.000Z",
  "apiVersion": "2026-02-24",
  "organization": {
    "id": "org_uuid",
    "siteName": "acme"
  },
  "data": {
    "submissionId": "sub_uuid",
    "courseId": "course_uuid",
    "exerciseId": "exercise_uuid",
    "submittedByProfileId": "profile_uuid",
    "statusId": 1
  }
}
```

### Delivery Semantics

- At-least-once delivery.
- Consumers must treat `event.id` as idempotency key.
- Success = any 2xx response.
- Non-2xx or network/TLS timeout triggers retry policy.

## Reliability and Retry Policy

- Request timeout per attempt: 10 seconds.
- Max attempts: 6.
- Backoff schedule: `10s`, `1m`, `5m`, `30m`, `2h`, `6h`.
- Per-endpoint in-flight limit: 1 concurrent delivery (preserve ordering per endpoint).
- Retention:
  - Event payloads: 30 days.
  - Delivery attempts: 30 days.
- Automatic endpoint health behavior:
  - Mark endpoint `degraded` after 20 consecutive failed deliveries.
  - Auto-disable endpoint after 100 consecutive failed deliveries (admin can re-enable).

## Security Requirements

1. Only org admins can create/update/delete webhooks.
2. Secret is write-only in API/UI (shown once at creation or regeneration).
3. URL validation:
   - Reject localhost and private network targets by default in cloud mode.
   - Allow private/internal targets only when `PUBLIC_IS_SELFHOSTED=true`.
4. TLS verification enabled by default.
5. Delivery logs redact sensitive response headers/body beyond configurable truncation limits.

## Technical Design

### Data Model

Add webhook tables in `packages/db/src/schema.ts`.

1. `webhook_endpoint`
   - `id`
   - `organization_id`
   - `name`
   - `payload_url`
   - `content_type` (`application/json` in v1)
   - `secret_ciphertext` (encrypted)
   - `secret_last4`
   - `verify_ssl`
   - `is_active`
   - `created_by_profile_id`
   - `updated_by_profile_id`
   - `created_at`, `updated_at`
2. `webhook_subscription`
   - `id`
   - `webhook_id`
   - `event_type`
   - unique (`webhook_id`, `event_type`)
3. `webhook_event`
   - `id` (`evt_...` stable idempotency key)
   - `organization_id`
   - `event_type`
   - `payload` (`jsonb`)
   - `created_at`
4. `webhook_delivery`
   - `id` (`whd_...`)
   - `webhook_id`
   - `event_id`
   - `attempt`
   - `status` (`PENDING | SUCCESS | FAILED | GAVE_UP`)
   - `next_retry_at`
   - `response_status`
   - `response_body` (truncated)
   - `error_message`
   - `duration_ms`
   - `delivered_at`
   - `created_at`

### Validation Layer

New package:

- `packages/utils/src/validation/webhook/webhook.ts`
- `packages/utils/src/validation/webhook/index.ts`
- export from `packages/utils/src/validation/index.ts`

Schemas:

- `ZCreateWebhook`
- `ZUpdateWebhook`
- `ZWebhookParams`
- `ZWebhookDeliveryListQuery`
- `ZRedeliverWebhookDeliveryParams`
- `ZSendWebhookTest`

### Query Layer

New package:

- `packages/db/src/queries/webhook/webhook.ts`
- `packages/db/src/queries/webhook/index.ts`

Core query functions:

- endpoint CRUD
- subscription CRUD
- enqueue event
- enqueue deliveries for subscribed endpoints
- claim due deliveries (`FOR UPDATE SKIP LOCKED`)
- record success/failure and schedule retries
- list webhook deliveries for dashboard

### Service Layer

New services:

- `apps/api/src/services/webhook/webhook.ts` (management + listing)
- `apps/api/src/services/webhook/events.ts` (`emitWebhookEvent`)
- `apps/api/src/services/webhook/delivery.ts` (sign/send/retry worker)

Producer integration:

- call `emitWebhookEvent(...)` inside existing domain services after successful writes:
  - course invite
  - organization invite
  - course people
  - submission
  - payment request
  - newsfeed
  - community
  - lesson completion

### Route Layer

New routes under organization scope:

- `GET /organization/webhooks`
- `POST /organization/webhooks`
- `GET /organization/webhooks/:webhookId`
- `PUT /organization/webhooks/:webhookId`
- `DELETE /organization/webhooks/:webhookId`
- `POST /organization/webhooks/:webhookId/test`
- `GET /organization/webhooks/:webhookId/deliveries`
- `POST /organization/webhooks/:webhookId/deliveries/:deliveryId/redeliver`

Route guards:

- `authMiddleware`
- `orgAdminMiddleware` for mutating actions
- `orgMemberMiddleware` allowed for read-only delivery inspection if desired (decision: admin-only in v1 for simplicity)

### Delivery Worker

Worker runs in API process:

1. Poll due `webhook_delivery` rows at a fixed interval (e.g. every 5 seconds).
2. Lock rows, deliver, and update status atomically.
3. Schedule next retry by writing `next_retry_at`.
4. Expose internal manual trigger endpoint (API-key protected) for self-host/ops:
   - `POST /internal/jobs/webhooks/process`

### Frontend

New feature module:

- `apps/dashboard/src/lib/features/automation/api/webhook.svelte.ts`
- `apps/dashboard/src/lib/features/automation/utils/types.ts`
- `apps/dashboard/src/lib/features/automation/pages/webhooks.svelte`
- `apps/dashboard/src/lib/features/automation/components/*`
- `apps/dashboard/src/routes/org/[slug]/automation/+page.svelte`

Translations:

- Add `org_navigation.automation`
- Add `automation.*` group:
  - `automation.tabs.webhooks`
  - `automation.webhooks.form.*`
  - `automation.webhooks.events.*`
  - `automation.webhooks.delivery.*`
  - `automation.webhooks.snackbar.*`

## API and Docs Requirements

1. Add OpenAPI metadata for all webhook management routes.
2. Regenerate/publish OpenAPI spec using existing upload flow.
3. Add docs page in `apps/docs`:
   - setup
   - security/signature verification
   - event catalog
   - payload examples
   - retry behavior and idempotency guidance

## Rollout Plan

### Phase 1: Backend Foundation

1. Schema + queries + validation.
2. Endpoint management routes.
3. Event enqueue + delivery worker + retry engine.
4. Basic API tests and signature tests.

### Phase 2: Dashboard UX

1. Automation route + Webhooks tab.
2. Create/edit form + event selector.
3. Delivery logs + redelivery + test delivery.

### Phase 3: Hardening and GA

1. Add observability dashboards and failure alerts.
2. Expand docs with language-specific signature verification snippets.
3. Enable additional low-priority events based on usage.

## Success Metrics

1. 10% of paid orgs create at least one webhook within 60 days of release.
2. >= 99% delivery success after retries for active endpoints.
3. p95 time-to-first-attempt under 30 seconds.
4. < 1% support tickets related to unverifiable signatures after docs launch.

## Risks and Mitigations

1. High-volume events (lesson completion) may increase queue pressure.
   - Mitigation: keep event opt-in, enforce per-endpoint concurrency limits, track throughput metrics.
2. Misconfigured endpoints can create retry storms.
   - Mitigation: exponential backoff, auto-disable thresholds, visible health state.
3. Secret handling mistakes can weaken security.
   - Mitigation: encrypted storage, write-only UI semantics, strict signature contract docs.

## Build and Verification Commands (Implementation)

1. `pnpm --filter @cio/db build`
2. `pnpm --filter @cio/utils build`
3. `pnpm --filter @cio/api build`
4. `pnpm --filter @cio/dashboard build`
5. `pnpm --filter @cio/api upload:openapi`

## Open Questions

1. Should webhook management be Early Adopter+ only or Enterprise-only?
2. Should private-network payload URLs be allowed in cloud for approved enterprise tenants?
3. Should redelivery retention be 30 days or 90 days?
4. Should `lesson.completion.updated` ship in v1 or wait for post-GA volume tuning?
