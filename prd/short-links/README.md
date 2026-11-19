# Branded Short Links PRD

## Status

- Proposed

## Date

- September 20, 2026

## Purpose

Add a first-party branded short-link service for ClassroomIO links that people explicitly copy, share, print, or encode as QR codes.

The service will use `clmio.com` and will shorten only known ClassroomIO resources. It will not be a general-purpose URL shortener, and it will not replace direct links in transactional emails.

## Executive Summary

ClassroomIO currently exposes long but functional public course and invitation URLs. Their length is mostly invisible in email buttons, but it is inconvenient when an admin copies a link into a message, document, social post, slide, or QR code.

The product should generate short links lazily at existing copy/share surfaces:

- Public course links use a 6-character Base58 code.
- Reusable course and cohort invite links use a 12-character Base58 code.
- Reusable organization admin or tutor invite links use a 22-character Base58 code.
- Email-specific course, learner, admin, and tutor invitations continue using their direct canonical URLs.

Example public course link:

```text
https://clmio.com/K7mQ2p
```

Short links are aliases, not a second authorization or lifecycle system. Public course aliases resolve to the course's current canonical public URL. Invite aliases redirect to the canonical invite URL, where the existing application flow enforces revocation, expiry where supported, capacity, resource availability, and acceptance rules.

## Problem Statement

Public course and reusable invite links contain a long host, route, slug, and often a high-entropy token. This is appropriate for canonical navigation and secure email delivery, but cumbersome at explicit share points.

The current experience creates several problems:

1. Copied links are difficult to scan, type, or fit into limited space.
2. Printed and QR-based sharing unnecessarily encodes long URLs.
3. Public course links become stale if the organization domain or course slug changes after the link is copied.
4. Each feature constructs or copies its own canonical URL rather than requesting a stable product-owned share alias.
5. Using a third-party shortener would expose ClassroomIO invitation destinations to another system and duplicate existing lifecycle controls.

## Product Principles

1. Shorten at explicit copy/share boundaries, not everywhere a URL exists.
2. Preserve direct canonical URLs for transactional email.
3. Treat every reusable invite alias as a bearer credential.
4. Resolve internal resources by identity, not by storing an arbitrary destination URL.
5. Keep the underlying resource or invitation as the source of truth for availability and authorization.
6. Never mutate membership, enrollment, or invitation state from a redirect request.
7. Prefer a successful canonical-link copy over failing the user's copy action when short-link creation is unavailable.

## Confirmed Product Decisions

1. The canonical short-link domain is `clmio.com`.
2. `clsrio.com` remains separate because ClassroomIO already uses its subdomains for CDN infrastructure.
3. The shortener accepts only ClassroomIO-owned target types; users cannot paste arbitrary destinations.
4. Public course codes contain 6 Base58 characters.
5. Reusable course and cohort invite codes contain 12 Base58 characters.
6. Reusable organization admin and tutor invite codes contain 22 Base58 characters.
7. Email-specific invitation links are not shortened.
8. Codes are generated with a cryptographically secure random generator.
9. Codes exclude visually ambiguous characters such as `0`, `O`, `I`, and `l`.
10. Code collisions are handled with a unique database constraint and bounded retries.
11. Short links are created lazily on the first copy/share request and reused on later requests.
12. Redirects use HTTP `302`; the service does not use permanent redirects because slugs, domains, publication state, and invite state can change.
13. Incoming query parameters are discarded in v1 rather than copied to the destination.
14. Short-link access does not count as invitation acceptance or resource membership.
15. A short link's code and target association are immutable in v1; users cannot edit, retarget, or regenerate them.
16. The redirect service does not duplicate expiry, revocation, or resource-availability enforcement from the canonical destination.
17. Alias creation is idempotent on `(targetType, targetId)`; the target type defines the sharing purpose in v1.
18. A code is permanently reserved after creation. Short-link records are never hard-deleted, and codes are never reused.
19. Operationally disabled and tombstoned records remain part of the idempotency and uniqueness rules and cannot be replaced with a new alias.
20. Any future invite rotation must create a new invite database row. The original invite row and its alias remain bound together and are retained in a revoked or tombstoned state.

## Why the Code Lengths Differ

One code length should not serve both public content and privileged bearer links.

### Public Course: 6 Base58 Characters

Six Base58 characters provide 38,068,692,544 possible values. Public course pages are already public, so discovering a valid alias does not grant private access. A unique constraint and retry loop make collisions an implementation concern rather than a user-visible failure.

The six-character decision prioritizes compact sharing while remaining within established shortener patterns. Dub defaults to seven random characters, Bitly and TinyURL commonly show seven-character generated aliases, and Rebrandly documents generated aliases between three and eight characters.

### Course or Cohort Invite: 12 Base58 Characters

Reusable resource invitations grant enrollment to an authenticated holder. A six-character namespace becomes unsafe as the number of active invite links grows because guessing any valid link is sufficient.

Twelve Base58 characters provide approximately 70 bits of entropy. This remains compact while making online enumeration impractical when combined with rate limiting, revocation, and the existing authenticated acceptance flow.

### Organization Admin or Tutor Invite: 22 Base58 Characters

Reusable organization role links grant privileged membership and require a stronger capability token. Twenty-two Base58 characters provide approximately 129 bits of entropy.

These links are intentionally longer than public course aliases. Shortening a privileged link to six characters would replace the current secure token with a guessable credential.

## Goals

1. Make copied public course links compact and brand-recognizable.
2. Make reusable course, cohort, and organization role invites easier to share without weakening their security model.
3. Keep short links stable when a public course slug, tenant domain, or verified custom domain changes.
4. Centralize short-link creation, resolution, immutable mapping, and abuse controls.
5. Preserve every existing invitation validation and acceptance rule.
6. Provide a safe path for future QR and SMS sharing without changing canonical URLs.

## Non-Goals

- Shortening links embedded in transactional email.
- Accepting arbitrary or external destination URLs.
- Replacing canonical URLs in browser navigation or SEO metadata.
- Creating a Bitly-style marketing link management product.
- Customer-selected aliases in v1.
- Customer-owned short domains in v1.
- Geo, device, language, or operating-system routing.
- Link cloaking, password protection, or interstitial advertising.
- A per-link analytics dashboard in v1.
- Retrofitting previously sent or already copied links.

## Primary Use Cases

### UC-1: Copy a Published Course Link

An organization admin or tutor selects an existing **Copy course link** action. ClassroomIO creates or retrieves the stable alias for that course and copies a URL such as `https://clmio.com/K7mQ2p`.

When opened, the alias resolves the current course and organization data and redirects to the current canonical public URL. A later slug, tenant hostname, or verified custom-domain change does not invalidate the short link.

### UC-2: Copy a Reusable Course or Cohort Invite

An authorized team member creates or views an existing course or cohort invite link and copies it. ClassroomIO creates or retrieves a 12-character alias tied to the existing `invite_link` record.

Opening the alias redirects to the existing invite preview and join flow. Disabling or closing the underlying invite does not change the short alias; the canonical invite flow displays and enforces the appropriate unavailable state.

### UC-3: Copy a Reusable Admin or Tutor Quick Invite

An authorized organization admin creates a reusable admin or tutor quick-invite link from team settings. ClassroomIO creates or retrieves a 22-character alias tied to the existing organization `LINK` invite.

The alias always redirects to the canonical organization invite flow, which remains responsible for role, revocation, and acceptance checks. It is not used for email-specific team invitations.

### UC-4: Share Through a QR Code or Limited-Space Channel

A future QR, SMS, slide, or printable share action uses the same stable alias already created for the target. It must not create a new alias for each channel.

### UC-5: Send a Transactional Invitation Email

ClassroomIO continues sending the current direct application or tenant URL. The email button hides URL length, while the direct URL avoids an unnecessary redirect and maintains a clear destination domain for recipients and email security systems.

## Current-State Audit

### Public Course Copying

Public course links are copied from several dashboard surfaces:

- `apps/dashboard/src/lib/features/course/components/course-context-menu-content.svelte`
- `apps/dashboard/src/lib/features/course/pages/settings.svelte`
- `apps/dashboard/src/lib/features/lms/pages/dashboard.svelte`

These surfaces currently copy a canonical URL derived from the course slug and the current organization domain.

### Course and Cohort Share Invites

The existing `invite_link` model supports permanent, revocable course and cohort share links with join counts and last-used timestamps:

- `packages/db/src/schema.ts`
- `packages/db/src/queries/invite-link/`
- `apps/api/src/services/invite-link/`
- `apps/dashboard/src/lib/features/people/components/invite-link-section.svelte`

The service currently returns a long `app.classroomio.com/invite/r/{token}` URL. The token is cryptographically random, and acceptance rechecks the invite under a database lock.

### Organization Role Share Invites

Organization team settings already expose a reusable quick-invite copy action for admin and tutor roles:

- `apps/dashboard/src/lib/features/settings/pages/teams.svelte`
- `apps/dashboard/src/lib/features/org/api/org.svelte.ts`
- `apps/api/src/services/organization/invite.ts`
- `packages/db/src/queries/organization/link-invite.ts`

These organization `LINK` invites are reusable and separate from targeted email invitations.

### Email Invitations

Email-specific course and organization invitations build direct URLs in the API before enqueueing transactional email. These flows remain unchanged:

- `apps/api/src/services/course/invite.ts`
- `apps/api/src/services/organization/invite.ts`
- `apps/api/src/services/organization/audience.ts`

### Edge Routing

ClassroomIO already runs a Cloudflare Worker for browser-facing host routing in `apps/tenant-router`. The short-link service should be separately deployable so redirect changes cannot disrupt tenant, admin, embed, or media routing.

## Functional Requirements

### FR-1: Create or Retrieve a Short Link

1. Only authenticated and authorized users may request aliases from dashboard copy/share actions.
2. The request identifies a supported target type and target ID; it never submits a destination URL.
3. The API verifies access to the target before returning an alias.
4. Repeated requests for the same `(targetType, targetId)` return the existing alias record, including when it is operationally disabled or tombstoned; they never create a replacement alias.
5. Concurrent first requests must converge on one alias through database uniqueness and retry handling.
6. The response contains one stable shape with the short URL, link type, and availability state so the client can use its canonical-copy fallback when the existing alias is unavailable.

### FR-2: Resolve a Public Course Alias

1. The resolver loads the current course and organization needed to construct the canonical public URL.
2. It derives the destination using the current course slug and public organization base URL.
3. The resolver does not duplicate publication or visibility decisions from the canonical course route.
4. The redirect discards incoming query parameters in v1.
5. Resolution never changes course or organization state.

### FR-3: Resolve an Invite Alias

1. The alias resolves through its underlying invite record.
2. While the underlying invite identity exists, the resolver redirects to its canonical invite URL without independently evaluating revocation, expiry, or resource availability.
3. Course and cohort revocation and availability rules remain enforced by their existing preview and acceptance flows.
4. Organization role, revocation, expiry where supported, and authorization rules remain enforced by the existing organization invite flow.
5. A redirect request never enrolls, joins, accepts, or consumes an invite.
6. Social preview bots and email scanners therefore cannot accept an invite by opening the alias.

### FR-4: Immutable Mapping and Lifecycle Ownership

1. A public course alias remains stable across slug and public-domain changes.
2. A short-link record cannot be edited, retargeted, or regenerated in v1.
3. Revoking, expiring, closing, or re-enabling an invite does not modify its short-link record.
4. The alias continues redirecting to the same canonical invite identity, and that destination renders or enforces its current lifecycle state.
5. V1 does not add invite-token regeneration. Any future rotation must create a new invite database row and a new short alias rather than changing the token on the existing row.
6. The original invite row must be retained as revoked or tombstoned so its alias continues to resolve only to that original canonical invite identity and can never expose the replacement token.
7. Deleting a target tombstones its short-link record instead of deleting it. The code remains permanently reserved and resolves to a generic unavailable response.
8. Operationally disabled aliases use the same generic unavailable response without changing their immutable mapping. Re-enabling the same record restores the same alias.

### FR-5: Copy Fallback

1. If alias creation fails or the existing alias is operationally disabled or tombstoned, the dashboard copies the canonical URL instead.
2. The user receives the normal copy-success feedback when the canonical fallback succeeds.
3. The client records an operational error without displaying secret tokens or destination details in logs.

### FR-6: Redirect Behavior

1. The public route accepts only `GET` and `HEAD`.
2. Successful resolution returns HTTP `302` with an absolute HTTPS `Location` header.
3. Invitation redirects include `Cache-Control: no-store`.
4. Public course redirects may use a short bounded edge cache, but must remain responsive to unpublishing and deletion.
5. Responses include an `X-Robots-Tag` directive preventing short-link indexing.
6. The domain root displays or redirects to a ClassroomIO-branded informational page.

## UX Requirements

1. Existing **Copy link** and **Copy invite link** actions remain in their current locations.
2. Copy actions return `clmio.com` URLs when short-link creation succeeds.
3. Public course settings may display the short URL while **Open link** continues opening the canonical course page.
4. Invite settings display the short alias intended for sharing, not the underlying canonical token URL.
5. The UI does not describe six-character public codes as secure invitation tokens.
6. Existing revoke, enable, join-count, and last-used controls remain authoritative.
7. User-facing copy uses dashboard translation keys.

## Recommended Architecture

### Dedicated Edge Worker

Create a separately deployable `apps/short-links` Cloudflare Worker bound to the `clmio.com` Custom Domain.

Responsibilities:

- Parse and validate a single root-level code.
- Reject unsupported methods and reserved paths.
- Call an authenticated internal API resolution endpoint.
- Return the API-approved redirect or a generic unavailable response.
- Apply redirect headers, rate limits, and operational telemetry.

The Worker must not accept a client-provided destination and must not connect directly to the application database.

### API Service

The API owns:

- Authorization to create or retrieve an alias.
- Code generation and collision handling.
- Query-layer access to short-link and target records.
- Current canonical destination derivation.
- Canonical invite URL construction without duplicating destination lifecycle checks.
- A service-authenticated resolver contract for the edge Worker.

The public Worker-to-API resolver must use a dedicated shared secret or equivalent service authentication. It must not expose an unauthenticated arbitrary resolution API.

### Database Source of Truth

Add one `short_link` table in one migration. The model should include:

- ID.
- Link type.
- Hashed code used for lookup.
- Application-encrypted code material only where a stable copyable alias must be returned again.
- Organization ID.
- Immutable target identity key used for idempotency after the target is deleted.
- Exactly one supported target relationship.
- Creator profile ID.
- Availability state covering active, operationally disabled, and tombstoned records.
- Created and updated timestamps.

Supported target relationships in v1:

- Public course ID.
- Resource invite-link ID.
- Organization link-invite ID.

Database checks must ensure the selected target relationship matches the link type. An unconditional unique constraint on `(link type, immutable target identity key)` must enforce one alias per target across active, operationally disabled, and tombstoned records. Target deletion must clear or tombstone the resolvable relationship without deleting the short-link row or its identity key.

The table must not store a copied destination URL. Destination URLs are derived from live target data at resolution time.

### Code Generation

Use a shared server-side generator with these rules:

- Cryptographically secure randomness.
- Base58 alphabet without ambiguous characters.
- Length selected exclusively from the server-owned link-type policy.
- Profanity and reserved-word rejection.
- Unique code constraint across every record, including tombstones, followed by bounded retry on collision.
- Permanent code reservation with no reuse after target deletion or operational disablement.
- No sequential IDs, timestamps, truncated database IDs, or reversible identifiers.

The client cannot request a shorter code or supply a custom code in v1.

### Caching

PostgreSQL remains authoritative for alias ownership, immutable target relationships, and operational disables.

- Invite revocation and expiry do not require short-link cache invalidation because the canonical destination enforces those states.
- Invitation redirects retain `no-store` in v1 so an operational disable or incident kill switch takes effect without a browser retaining the redirect.
- Public course resolution may be cached briefly after the correctness path is implemented and measured.
- A cached public result must have a bounded lifetime and must not outlive deletion or an operational disable indefinitely.
- Negative lookups are not cached long-term.

## API Shape

### Authenticated Creation

Expose a product-owned endpoint under the single `/short-links` root segment. The request selects a supported target type and ID, for example:

```json
{
  "targetType": "PUBLIC_COURSE",
  "targetId": "course-uuid"
}
```

The success response uses one stable shape:

```json
{
  "success": true,
  "data": {
    "id": "short-link-uuid",
    "targetType": "PUBLIC_COURSE",
    "availability": "ACTIVE",
    "shortUrl": "https://clmio.com/K7mQ2p"
  }
}
```

Supported target types:

- `PUBLIC_COURSE`
- `RESOURCE_INVITE`
- `ORGANIZATION_ROLE_INVITE`

### Internal Resolution

The edge Worker calls a service-authenticated API endpoint with the provided code. The response returns either:

- A validated absolute destination and cache policy.
- A generic unavailable outcome.

The API never returns the destination supplied by the browser because the browser cannot supply one.

## Security and Abuse Controls

1. Allow only ClassroomIO resource targets and verified organization custom domains derived by server code.
2. Apply rate limits by client IP and code, with stricter unknown-code limits.
3. Do not log raw invite codes, canonical invite tokens, cookies, or authorization headers.
4. Return a generic unavailable response for unknown, operationally disabled, or deleted aliases; revoked and expired invites still redirect to their canonical flow.
5. Do not place membership or enrollment side effects on `GET` or `HEAD`.
6. Keep acceptance as an authenticated `POST` in the existing application flow.
7. Add a per-link operational disable mechanism for abuse response without mutating the underlying resource.
8. Add a domain-level kill switch that can stop redirects during an incident.
9. Prevent search indexing of the short domain.
10. Discard incoming query parameters in v1 to avoid destination manipulation and cache-key ambiguity.
11. Preserve existing invite preview and acceptance rate limits after redirect.
12. Monitor spikes in unknown-code requests and repeated enumeration patterns.

## Analytics and Privacy

V1 needs operational and adoption telemetry, not a marketing analytics product.

Record asynchronously:

- Short-link creation by link type.
- Successful resolution by link type.
- Unavailable resolution by coarse reason.
- Canonical-copy fallback.
- Redirect latency and error rate.

Do not block redirect responses on analytics delivery. Do not count `HEAD` as a human click. Do not equate a redirect with enrollment or invitation acceptance. Existing join and acceptance events remain the source of truth for conversion.

Avoid persistent raw-IP storage. If approximate unique-open measurement is added later, use a rotating keyed identifier with documented retention.

## Reliability Requirements

1. The redirect path must remain lightweight and independently deployable.
2. API or analytics failures must not cause target-state mutations.
3. Alias creation is idempotent per `(targetType, targetId)` across active, operationally disabled, and tombstoned records.
4. The Worker returns a controlled response for API timeouts or malformed resolver payloads.
5. Operational metrics distinguish Worker failures, API failures, unavailable targets, and invalid codes.
6. Deployment includes a health check that does not require a real alias.

## Rollout Plan

### Phase 1: Foundation

1. Configure `clmio.com` in Cloudflare.
2. Add the short-link table, query functions, service, validation, and authenticated creation endpoint.
3. Add the internal resolver endpoint.
4. Add the dedicated Worker, service authentication, rate limits, and generic unavailable response.
5. Verify TLS, DNS, redirects, no-index behavior, logs, and kill-switch behavior in staging.

### Phase 2: Public Course Copying

1. Integrate published-course copy actions with `PUBLIC_COURSE` aliases.
2. Retain canonical-copy fallback.
3. Verify slug, tenant-host, verified custom-domain, unpublish, republish, and delete behavior.
4. Measure creation and redirect reliability before adding invite targets.

### Phase 3: Resource Invite Copying

1. Integrate the shared invite-link component for course and cohort targets.
2. Confirm disabled, re-enabled, closed, and deleted invite behavior while keeping alias mappings immutable.
3. Verify that link scanners cannot join a resource.

### Phase 4: Organization Role Quick Invites

1. Integrate the team-settings quick-invite copy action.
2. Verify the 22-character policy and existing role authorization.
3. Confirm revocation and acceptance behavior remains owned by the canonical invite flow.
4. Keep targeted team invitation emails on direct canonical URLs.

### Phase 5: Optional Share Channels

After the core system is stable, reuse existing aliases for QR, SMS, slide, and printable sharing. These channels must not create parallel aliases for the same target.

## Migration Strategy

1. Do not backfill aliases for every existing course or invite.
2. Create aliases lazily when an authorized user first invokes a supported copy/share action.
3. Keep all existing canonical links valid indefinitely according to their current lifecycle.
4. Do not rewrite links in previously sent emails, persisted content, or audit records.
5. Do not redirect canonical URLs to `clmio.com`; the short domain redirects only toward canonical destinations.
6. Retain every created short-link row as a permanent code reservation, including after its target is deleted.

## Testing Strategy

### Unit Tests

- Alphabet and length policy per link type.
- Reserved-word and profanity rejection.
- Collision retry and retry exhaustion.
- Target-type authorization.
- Canonical destination derivation.
- Query-parameter discard behavior.
- Worker response validation and security headers.

### Integration Tests

- Concurrent creation returns one stable alias.
- Published course resolves to the current tenant or verified custom domain.
- Slug and domain changes preserve the alias.
- Unpublishing a course still redirects to the canonical route, which enforces visibility; deleting the course returns the generic unavailable response.
- Revoked, expired where supported, or closed invitations still redirect, and the canonical flow rejects or explains their current state.
- Short-link codes and target associations cannot be edited, retargeted, or regenerated.
- Operationally disabling an alias preserves its uniqueness key; later creation requests find the same record and cannot create a replacement.
- Deleting a target tombstones its alias, and collision handling never reallocates the reserved code.
- Re-enabled invites restore their existing alias when the underlying invite is unchanged.
- A future invite-rotation implementation creates a new invite row and alias while the original alias remains bound to the retained original row.
- Invite redirect `GET` and `HEAD` do not enroll or accept.
- Authorization prevents cross-organization alias creation.
- Unknown-code rate limits and generic responses work as intended.
- Email invitation builders still return direct canonical URLs.

### Manual Verification

- Copy from every supported dashboard surface.
- Paste into common messaging and social applications.
- Verify public-course link previews reach the canonical course page.
- Exercise common email and social link scanners without causing acceptance.
- Test desktop and mobile browsers.
- Test Cloudflare outage, API timeout, and canonical-copy fallback behavior.
- Confirm that raw invite codes and tokens do not appear in application error logs.

## Acceptance Criteria

- `clmio.com/{code}` serves production redirects through a dedicated Worker.
- Published course copy actions return stable 6-character aliases.
- Course and cohort invite copy actions return stable 12-character aliases.
- Organization admin and tutor quick-invite copy actions return stable 22-character aliases.
- Targeted transactional emails continue using direct canonical URLs.
- Users cannot create redirects to arbitrary destinations.
- Slug and organization-domain changes do not break public course aliases.
- Revoked, expired where supported, closed, or unpublished targets still redirect to canonical application routes that enforce their lifecycle state.
- Deleted targets and operationally disabled aliases return the generic unavailable response.
- Short-link codes and target associations are immutable and have no edit or regeneration endpoint.
- Repeated creation requests use `(targetType, targetId)` and cannot create a replacement for a disabled or tombstoned alias.
- Deleted aliases are tombstoned, and their codes can never be reused for another target.
- Future invite rotation requires a new invite row; an existing invite row and alias can never resolve to a replacement token.
- Opening an invite alias cannot accept the invite or mutate membership.
- Copy actions fall back to the canonical URL if short-link creation fails.
- Short-link responses are not indexed and sensitive redirects are not cached.
- Required API, dashboard, database, and Worker tests pass.

## Success Metrics

- At least 99.99% successful redirect responses for valid aliases, excluding unavailable targets.
- P95 edge-to-redirect latency remains below 300 ms before optional public caching.
- Fewer than 0.1% of supported copy actions require canonical fallback.
- No invitation acceptances attributed to redirect-only requests or automated preview scans.
- No arbitrary external redirect or open-redirect path is introduced.
- Measurable adoption of short URLs from existing copy/share actions.

## Risks and Mitigations

### Short Alias Enumeration

Public six-character aliases are discoverable at sufficient request volume. They point only to published public courses. Reusable invites use longer code policies, authentication at acceptance, and rate limiting.

### Domain Reputation

Short domains can be associated with phishing. Restrict creation to known internal resource types, disable indexing, monitor abuse, provide a kill switch, and never offer arbitrary destination shortening.

### Duplicated Invite Lifecycle Logic

If the redirect service independently evaluates expiry, revocation, or resource availability, it can drift from the canonical invite flow. The shortener therefore resolves only the immutable mapping and redirects; the canonical preview and acceptance routes remain the single source of truth for invitation state.

### Link Scanner Traffic

Messaging and security tools open links automatically. Keep redirect and preview requests read-only and distinguish redirects from accepted invitations in analytics.

### Redirect-Service Dependency

A short link adds an extra service hop. Deploy the Worker independently, keep the resolver contract small, monitor it separately, and retain canonical-link fallback during alias creation.

### Stale Copied Destinations

Persisting full destination URLs would freeze old slugs and domains. Store target relationships and derive the current canonical URL on every authoritative resolution.

## Research Basis

- [Dub link creation API](https://dub.co/docs/api-reference/links/bulk-create) documents a default 7-character random slug.
- [Bitly short-link documentation](https://dev.bitly.com/docs/tutorials/shorten-customize-links/) shows common generated back-half patterns.
- [Rebrandly link creation documentation](https://developers.rebrandly.com/docs/create-a-new-link) describes adaptive 3-to-8-character aliases and collision allocation.
- [OWASP Unvalidated Redirects and Forwards](https://cheatsheetseries.owasp.org/cheatsheets/Unvalidated_Redirects_and_Forwards_Cheat_Sheet.html) recommends mapping server-side identifiers to approved destinations instead of redirecting to user-supplied URLs.
- [Cloudflare Workers Custom Domains](https://developers.cloudflare.com/workers/configuration/routing/custom-domains/) supports using a Worker as the origin for a dedicated hostname.
- [Cloudflare Workers KV consistency](https://developers.cloudflare.com/kv/concepts/how-kv-works/) documents eventually consistent propagation, so PostgreSQL remains authoritative for alias creation, deletion, and operational disable state.

## Open Operational Prerequisites

- Add `clmio.com` to the ClassroomIO Cloudflare account if it is not already managed there.
- Provision the production and preview Worker routes, secrets, monitoring, and deployment workflow.
- Define the production incident owner and kill-switch procedure before invite aliases launch.
