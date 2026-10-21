# Public Plugin API v1 — Permissions and End-to-End Delivery Plan

Status: **approved contract, incremental implementation**. A scope in this document is not available
to plugins until its complete end-to-end slice is implemented, tested, documented, and marked
`active` in the platform capability registry. Public data capabilities are available only through
the backend HTTP API. The browser bridge is deliberately limited to UI hosting and launch
authorization. Other rows remain subject to the registry status.

## Purpose

Define the first useful ClassroomIO data and command surface for independently developed plugins.
This document is the platform-wide dependency for official plugins such as Certificate Studio; it is
not specific to one plugin.

The public plugin API is a compatibility and security boundary. Plugins never import ClassroomIO
stores, database queries, internal API clients, private types, session cookies, or application source
paths. First-party and third-party plugins use the same public contracts.

## Plugin icon assets

Plugin UI is free to render its own images and icons. When ClassroomIO itself renders a plugin or
contribution icon—for example in the catalog, navigation, or a host-rendered action—the manifest
uses a packaged artifact-relative asset:

```json
"icon": { "resource": "assets/icon.svg" }
```

The platform resolves that resource only against the approved immutable artifact for the relevant
plugin version. It supports SVG, PNG, JPEG, and WebP icons and uses a generic fallback if the asset
is missing or invalid. Arbitrary remote URLs are not accepted for host-rendered images; this keeps
the catalog independent of a plugin server's availability and prevents unreviewed tracking content.

## Scope names and API method names are different things

These two lines serve different purposes:

```ts
await client.organization.getProfile();
```

```text
organization.profile:read
```

- `organization.profile:read` is a **permission scope**. A plugin declares it in `plugin.json`, an
  administrator grants it during installation, and ClassroomIO checks it during every protected
  request. It describes authority; it does not fetch anything.
- `client.organization.getProfile()` is a **runtime SDK operation**. It asks ClassroomIO for data.
  The operation succeeds only when the installation has the required scope and all other actor,
  tenant, resource, and surface checks pass.

The same operation is represented differently at each layer:

| Layer | Representation |
| --- | --- |
| Manifest/grant | `organization.profile:read` |
| Server SDK | `client.organization.getProfile()` |
| Public HTTP API | `GET /plugin-api/v1/organization/profile` |
| Required scope check | `requirePluginScope('organization.profile:read')` |

One scope may authorize several closely related methods. A method may require more than one scope
only when the additional capability is genuinely independent. Scope names must not be generated
from method names.

## Naming convention

### Permission scopes

Use:

```text
<singular-resource>[.<facet>]:<action>
```

Rules:

- lowercase ASCII only;
- singular resource names;
- dot-separated facets;
- a colon before the action;
- no underscores, route names, SDK method names, or implementation terminology;
- initial actions are `read` and `write`; introduce another action only when neither describes the
  authority accurately;
- a `read` scope documents the exact fields it can disclose;
- a `write` scope includes the corresponding read-back fields only when documented;
- sensitive and bulk scopes require enhanced review and prominent consent.

Examples:

```text
organization.profile:read
course.metadata:read
course.enrollment:write
certificate.template:write
plugin.storage:read
```

The existing pre-v1 spellings below must be migrated before the v1 contract is frozen:

| Pre-v1 spelling | Canonical v1 spelling |
| --- | --- |
| `courses.metadata:read` | `course.metadata:read` |
| `courses.content:read` | `course.content:read` |
| `courses:write` | split into the narrow write scopes that are actually needed |
| `lessons.metadata:read` | `lesson.metadata:read` |
| `learners.profile:read` | `learner.profile:read` |
| `learners.progress:read` | `learner.progress:read` |
| `learners.progress:write` | `learner.progress:write` |
| `certificates.issued:read` | `certificate.issued:read` |
| `certificate_templates:read` | `certificate.template:read` |
| `certificate_templates:write` | `certificate.template:write` |

Because no public v1 has shipped, perform this as a direct pre-release migration rather than
supporting aliases indefinitely. Manifests, grants, tests, official plugins, and documentation must
change together.

### SDK methods

Use camelCase methods grouped into discoverable namespaces:

- singular namespaces for singleton context: `client.identity`, `client.organization`;
- plural namespaces for collections: `client.courses`, `client.lessons`, `client.learners`;
- conventional verbs: `get`, `list`, `create`, `update`, `delete`, plus a precise domain command
  such as `issue`, `revoke`, `enroll`, or `setCompletion`;
- list methods always use cursor pagination and explicit filters;
- no method returns an internal database row.

### HTTP routes

Use versioned REST routes under `/plugin-api/v1`. Collection routes use plural nouns. A plugin's
backend calls the HTTPS API with an audience-bound token. Plugin iframe code does not call protected
ClassroomIO data APIs through the dashboard, and the dashboard does not proxy those operations.

## Authorization equation

Possessing a scope is necessary but never sufficient. Effective access is the intersection of:

```text
declared manifest scope
AND installation grant
AND current backend-token scope
AND active and approved installation
AND organization boundary
AND acting user's ClassroomIO permissions
AND resource-level authorization
AND contribution-surface binding, when applicable
AND field, rate, quota, and data-policy restrictions
```

An organization ID, user ID, role, course ID, or lesson ID supplied by plugin code is never trusted
by itself. Tenant and actor identity come from the verified backend token. A
surface-bound command such as applying a certificate template uses the course bound by the host;
the iframe cannot substitute an arbitrary course ID.

Identity claims and profile data are deliberately separate. An opaque actor ID and role may be
required in verified launch claims for authorization and audit. A name, avatar, email address, or
other profile field requires a documented profile scope. Email and other contact data are not part
of `identity.profile:read` v1.

## Proposed v1 scope and API catalog

The catalog contains exactly 30 initial scopes. `P0` scopes support the existing launch plugins and
Certificate Studio. `P1` supports common learning integrations. `P2` covers powerful administrative
and reporting plugins and receives additional security review.

### Identity and organization

| # | Scope | SDK operations | Minimum response or effect | Priority |
| --- | --- | --- | --- | --- |
| 1 | `identity.profile:read` | `identity.getProfile()` | Current actor's installation-scoped ID, display name, avatar URL, locale, and verified organization role. No email. | P1 |
| 2 | `organization.profile:read` | `organization.getProfile()` | Organization ID, name, avatar URL, and locale. No settings blob. | P0 |
| 3 | `organization.members:read` | `organization.listMembers()`, `organization.getMember()` | Cursor-paged member ID, display name, avatar URL, status, and organization role. Email excluded. | P2 sensitive |

Raw organization settings are deliberately not part of v1. New use cases should first receive a
narrow resource API rather than access to a general settings object.

### Courses and enrollment

| # | Scope | SDK operations | Minimum response or effect | Priority |
| --- | --- | --- | --- | --- |
| 4 | `course.metadata:read` | `courses.list()`, `courses.get()` | ID, title, slug, description summary, image URL, status, visibility, published date, and timestamps. | P0 |
| 5 | `course.content:read` | `courses.getStructure()` | Ordered section and lesson references plus documented content blocks; excludes answers and private authoring state. | P1 sensitive |
| 6 | `course.metadata:write` | `courses.create()`, `courses.update()`, `courses.archive()` | Create or modify allowlisted course metadata; publishing remains a separately authorized business rule. | P2 sensitive |
| 7 | `course.enrollment:read` | `enrollments.list()`, `enrollments.get()` | Cursor-paged course/user opaque IDs, enrollment status, source, enrolled date, and completion summary. | P1 sensitive |
| 8 | `course.enrollment:write` | `enrollments.enroll()`, `enrollments.unenroll()` | Idempotent enrollment changes; cannot elevate organization roles or bypass plan limits. | P2 sensitive |

### Lessons

| # | Scope | SDK operations | Minimum response or effect | Priority |
| --- | --- | --- | --- | --- |
| 9 | `lesson.metadata:read` | `lessons.list()`, `lessons.get()` | ID, course ID, title, type, order, publication state, estimated reading metrics, and timestamps. | P0 |
| 10 | `lesson.content:read` | `lessons.getContent()` | Sanitized/versioned content blocks and public attachments; excludes solutions and private author notes. | P1 sensitive |
| 11 | `lesson:write` | `lessons.create()`, `lessons.update()`, `lessons.delete()` | Mutate allowlisted lesson fields with optimistic concurrency and course-level actor authorization. | P2 sensitive |

### Learners and progress

| # | Scope | SDK operations | Minimum response or effect | Priority |
| --- | --- | --- | --- | --- |
| 12 | `learner.profile:read` | `learners.list()`, `learners.get()` | Opaque learner ID, display name, avatar URL, membership status. Contact fields excluded. | P2 sensitive |
| 13 | `learner.progress:read` | `progress.get()`, `progress.listByCourse()` | Completion state, percentage, completed lesson IDs, dates, and aggregate scores allowed to the actor. | P0 sensitive |
| 14 | `learner.progress:write` | `progress.setCompletion()`, `progress.reset()` | Set/reset completion only for host-bound or otherwise authorized learner/course/lesson resources. | P0 sensitive |

### Exercises, submissions, and grades

| # | Scope | SDK operations | Minimum response or effect | Priority |
| --- | --- | --- | --- | --- |
| 15 | `exercise.metadata:read` | `exercises.list()`, `exercises.get()` | Exercise ID, lesson ID, title, question-type summary, availability, attempts policy, and points. No answer key. | P1 |
| 16 | `submission:read` | `submissions.list()`, `submissions.get()` | Authorized attempts, submitted responses, status, timestamps, and feedback; field filtering follows actor role. | P2 sensitive |
| 17 | `submission:write` | `submissions.create()`, `submissions.update()` | Create/update an authorized actor's attempt or a host-bound activity response; idempotency required. | P2 sensitive |
| 18 | `grade:read` | `grades.list()`, `grades.get()` | Score, maximum, status, grader type, feedback summary, and timestamps. | P2 sensitive |
| 19 | `grade:write` | `grades.set()`, `grades.release()` | Set/release grades only for authorized plugin-owned or host-bound activities; audit required. | P2 sensitive |

### Certificates

| # | Scope | SDK operations | Minimum response or effect | Priority |
| --- | --- | --- | --- | --- |
| 20 | `certificate.issued:read` | `certificates.list()`, `certificates.get()` | Credential ID, course/learner opaque IDs, issue date, status, and verification URL. | P1 sensitive |
| 21 | `certificate.issuance:write` | `certificates.issue()` | Idempotently request issuance after core eligibility validation; plugin cannot forge verification data. | P2 sensitive |
| 22 | `certificate.revocation:write` | `certificates.revoke()` | Revoke with a documented reason after privileged actor and core policy checks. | P2 highly sensitive |
| 23 | `certificate.template:read` | `certificateTemplates.listAvailable()`, `certificateTemplates.getApplied()` | Core template metadata and the normalized applied design visible in the current organization/course context. | P0 |
| 24 | `certificate.template:write` | `certificateTemplates.apply()` | Validate and snapshot a design onto the host-bound course; never provides general course write access. | P0 sensitive |

### Cohorts, analytics, messaging, and plugin storage

| # | Scope | SDK operations | Minimum response or effect | Priority |
| --- | --- | --- | --- | --- |
| 25 | `cohort.metadata:read` | `cohorts.list()`, `cohorts.get()` | ID, name, course ID, schedule, status, and member count. | P2 |
| 26 | `cohort.membership:read` | `cohorts.listMembers()` | Cursor-paged opaque learner IDs, status, and joined/completed dates. | P2 sensitive |
| 27 | `analytics.summary:read` | `analytics.getCourseSummary()`, `analytics.getOrganizationSummary()` | Pre-aggregated counts and rates with minimum-group/privacy thresholds; no arbitrary query API. | P2 sensitive |
| 28 | `notification:write` | `notifications.sendToActor()`, `notifications.sendToMembers()` | Send templated in-product notifications under recipient, volume, branding, and abuse controls. | P2 sensitive |
| 29 | `plugin.storage:read` | `storage.get()`, `storage.list()` | Read namespaced installation- or user-scoped JSON documents within field, item-size, and total quotas. | P0 |
| 30 | `plugin.storage:write` | `storage.set()`, `storage.delete()` | Write namespaced installation- or user-scoped JSON documents with quotas and optimistic concurrency. | P0 |

`plugin.secrets:read` is intentionally excluded. Browser UI must never read secrets. Backend client
credentials are provisioned out of band, and a future secret service should provide operation-bound
use or backend-only retrieval under a separately reviewed contract.

## Standard response contracts

Every public operation must have runtime schemas and stable response shapes.

```ts
interface PluginApiSuccess<T> {
  success: true;
  data: T;
  requestId: string;
}

interface PluginApiError {
  success: false;
  error: {
    code: string;
    message: string;
    retryable: boolean;
    details?: Record<string, unknown>;
  };
  requestId: string;
}

interface CursorPage<T> {
  items: T[];
  nextCursor: string | null;
}
```

Requirements:

- ISO 8601 UTC timestamps;
- opaque IDs, never sequential database identifiers;
- cursor pagination with bounded `limit`;
- deterministic filtering and documented ordering;
- idempotency keys for retryable writes;
- optimistic concurrency tokens for conflicting updates;
- `429` retry metadata and per-scope quotas;
- stable machine-readable errors such as `permission_denied`, `installation_inactive`,
  `resource_not_found`, `conflict`, `validation_failed`, and `rate_limited`;
- no raw ORM rows, settings blobs, stack traces, SQL errors, or undisclosed fields;
- response-field allowlists enforced before serialization.

## Backend authentication

A remote plugin backend receives a single-use launch code from its iframe, then exchanges that code
server-to-server using its provisioned plugin backend client ID and secret. A successful exchange
returns verified launch claims and a short-lived `Bearer` access token. The access token:

- is accepted only below `/plugin-api/v1`;
- has `classroomio:plugin-api:v1` as its resource audience;
- retains the verified plugin backend origin as `clientAudience`;
- is bound to one plugin, installed version, installation, organization, actor, role, and
  contribution target;
- carries only the scopes granted at exchange time;
- expires after 15 minutes; and
- is rechecked against the current installation, organization membership, and grants on every
  request, so disable, uninstall, actor removal, and permission revocation take effect immediately.

The iframe never receives the backend client secret or ClassroomIO access token. It sends the
single-use launch code to its own backend over the plugin's authenticated application protocol. The
plugin backend exchanges the code, creates a server client, and returns only plugin-owned response
data needed by its UI:

The browser context contains only plugin identity, version, and contribution target. Organization,
actor, and resource identifiers remain host-private and are carried in the one-time launch code and
verified backend token instead of being trusted from iframe input.

```ts
import { createClassroomIOPluginServerClient } from '@classroomio/plugin-sdk/server';

const client = createClassroomIOPluginServerClient({
  baseUrl: process.env.CLASSROOMIO_API_URL!,
  accessToken: exchangeResult.accessToken
});

const organization = await client.organization.getProfile();
```

Production deployments must configure an independent `PLUGIN_API_TOKEN_SECRET` with at least 32
characters. Backend client secrets, access tokens, and webhook secrets must never be sent to plugin
iframe code or written to logs.

## Implemented vertical slice: organization profile

`organization.profile:read` is implemented through the field-filtered backend API:

| Contract element | Implementation |
| --- | --- |
| Manifest permission | `organization.profile:read` |
| Server SDK | `client.organization.getProfile()` from `@classroomio/plugin-sdk/server` |
| HTTP | `GET /plugin-api/v1/organization/profile` |
| Fields | `id`, `name`, `avatarUrl`, `locale` |
| Limits | 120 requests per installation per minute, plus platform limits |
| Revocation | Installation, actor membership, and current grants checked on each request |
| Audit | Token verification and successful/denied profile reads include request and token IDs |

The response is parsed through `ZPluginApiOrganizationProfile` before serialization. Organization
settings, member data, contact fields, billing data, and internal database columns are not exposed.

## One capability registry, not disconnected enums and switches

Replace the scope-only enum as the source of truth with a typed capability registry. A conceptual
entry is:

```ts
interface PluginCapabilityDefinition {
  scope: PluginPermissionScope;
  status: 'planned' | 'experimental' | 'active' | 'deprecated';
  apiVersion: string;
  sensitivity: 'standard' | 'sensitive' | 'highly-sensitive';
  allowedInstallationOwners: Array<'organization' | 'user'>;
  allowedTransports: Array<'backend'>;
  fieldsDisclosed: readonly string[];
  consentDescription: string;
  documentationUrl: string;
}
```

Only `active` scopes may be used by a publishable manifest. Experimental scopes require a
development/private distribution channel. The registry drives manifest validation, installation
consent, review warnings, token scope issuance, API documentation, and conformance tests.

## End-to-end implementation template for every API operation

An operation is not complete when an SDK method or route exists. Each vertical slice must include
all of the following:

1. **Contract:** request, response, pagination, error, and field-level Zod schemas in a public,
   runtime-safe contract package. Export TypeScript types inferred from those schemas.
2. **Capability metadata:** register its scope, sensitivity, transports, disclosed fields, consent
   copy, API version, and lifecycle status.
3. **Query layer:** add pure tenant-aware query functions under `packages/db/src/queries/{domain}`.
   Routes and services never query the database directly.
4. **Authorization service:** call one centralized `authorizePluginRequest()` that authenticates
   the backend token, resolves installation and organization from trusted identity, checks grants,
   evaluates actor and resource authorization, and returns a typed authorization context.
5. **Domain service:** call normal domain rules through a plugin-specific facade. Never expose an
   internal service or database row merely because it already exists.
6. **Public route:** add the backend transport under `/plugin-api/v1`. Do not add dashboard proxy
   routes or plugin-specific routes for individual plugins.
7. **Launch binding:** carry contribution and resource context through the signed launch exchange;
   never trust caller-controlled organization, actor, course, lesson, or certificate identifiers.
8. **SDK:** add server client methods generated or checked against the contract. The SDK must not
   rely on dashboard types.
9. **Field filter:** serialize through the public response schema so internal fields cannot leak.
10. **Operational controls:** rate limit, quota, request size, timeout, idempotency, audit, metrics,
    and structured security logs.
11. **Tests:** cover success, missing scope, wrong organization, insufficient actor role, guessed
    resource ID, disabled/revoked installation, malformed payload, rate limit, and field leakage.
12. **Documentation:** publish method reference, scope consent text, field list, examples, errors,
    limits, changelog, and a mock-host fixture.

## Delivery sequence

### Phase 0 — Contract and enforcement foundation

- freeze the naming convention in this document;
- introduce the typed capability registry and migrate pre-v1 scope spellings atomically;
- create public runtime schemas for auth context, errors, pagination, and common resource refs;
- implement `authorizePluginRequest()` as the single authorization entry point;
- establish `/plugin-api/v1` as the remote-backend API root;
- keep the browser bridge limited to UI hosting, context, and backend launch authorization;
- generate an OpenAPI document and server SDK from the public contracts;
- add request IDs, standard errors, rate-limit headers, audit helpers, and conformance tests;
- fail manifest publication when it requests a planned or unknown scope.

### Phase 1 — Existing official-plugin foundation (P0)

Ship end to end:

- `organization.profile:read`;
- `course.metadata:read`;
- `lesson.metadata:read`;
- `learner.progress:read` and `learner.progress:write` for host-bound operations;
- `certificate.template:read` and `certificate.template:write`;
- `plugin.storage:read` and `plugin.storage:write`.

This phase completes the APIs already exercised by Reading Time, Announcement Banner, Lesson
Acknowledgment, and the Certificate Studio plan. Existing one-off methods such as
`courses.getLatestPublished()` should become ordinary filtered calls rather than permanent special
endpoints.

### Phase 2 — Common read integrations (P1)

Ship identity, course structure, lesson content, exercises, enrollments, and issued certificate
reads. Add cursor pagination, field projections, and backend-token examples. Use these APIs to build
one plugin outside the ClassroomIO repository as a conformance test.

### Phase 3 — Sensitive learning records

Ship learner profiles, submissions, grades, and full progress reads behind enhanced review.
Implement bulk-access thresholds, export limits, privacy logging, and organization-admin warnings
before enabling publication with these scopes.

### Phase 4 — Mutations and privileged commands

Ship course/lesson authoring, enrollment changes, submissions, grades, certificate issuance and
revocation, and notifications. Every mutation requires idempotency, audit, actor authorization,
resource binding, and rollback/error semantics before activation.

### Phase 5 — Cohorts and analytics

Ship cohort and aggregate analytics reads with privacy thresholds. Do not expose arbitrary SQL,
unbounded exports, or internal reporting tables.

### Phase 6 — Developer platform readiness

- public API reference and per-scope consent catalog;
- a browser UI-host SDK and a generated server data SDK;
- mock host and local test organization fixtures;
- contract test kit that third-party CI can run;
- API-version and deprecation policy;
- usage dashboard, audit log, rate-limit visibility, and webhook replay tools;
- external-repository reference plugin proving no monorepo dependency is required.

## Certificate Studio dependency

Certificate Studio initially needs only:

```text
organization.profile:read
certificate.template:read
certificate.template:write
```

Its template CRUD runs against its own backend and database, so it does not need general course
write access or ClassroomIO plugin storage. Its picker receives a host-bound course reference and
uses its server client's `certificateTemplates.apply()` operation; it cannot select an arbitrary
course because the launch token carries the host-bound course. The optional
`certificate.issued:read` scope should be added only when a real Studio feature needs issued
credential data.

## Definition of done for a scope

A scope is `active` only when:

- manifest validation, consent UI, grants, backend tokens, and revocation all understand it;
- every associated API method has runtime request and response schemas;
- field disclosure is documented and tested;
- tenant, actor, resource, and surface authorization tests pass;
- list operations are paginated and bounded;
- writes are idempotent or explicitly documented as non-retryable;
- rate, quota, audit, privacy, and lifecycle behavior are implemented;
- server SDK documentation and the UI-to-backend launch flow are published;
- disabled or uninstalled plugins immediately lose access;
- the public contract has compatibility and deprecation coverage.
