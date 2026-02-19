# Enterprise SSO PRD (SAML 2.0 + OIDC)

## Purpose
Add enterprise SSO for ClassroomIO with per-organization configuration, supporting both SAML 2.0 and OIDC, while preserving the current Better Auth session model and multi-tenant org permissions.

## Confirmed Decisions (2026-02-17)
1. IdPs to support: Auth0, Google Workspace, Okta.
2. Scope: per organization (not global tenant-wide config).
3. Protocols: both SAML 2.0 and OIDC.
4. Force SSO: enabled (orgs can disable email/password when SSO is enabled).
5. Provisioning recommendation for LMS: JIT first, SCIM later.
6. SAML mode in v1: SP-initiated only.
7. Break-glass policy: required (emergency local admin access under strict controls).
8. Domain enforcement: required as an org SSO setting in UI and backend policy.
9. Entitlement: SSO is gated to `PLAN.ENTERPRISE`.
10. SCIM deprovisioning: phase 3, with interim login-time entitlement checks in earlier phases.
11. Partner OAuth integration must be API-driven: customer app fetches courses via our API, and join clicks are verified server-to-server before auto-provision + course enrollment.

## Recommendation: JIT vs SCIM for LMS
For this LMS platform, use:
- `v1`: JIT provisioning (fast launch, lower integration overhead, works with current invite/member model).
- `phase 3`: SCIM (enterprise lifecycle controls, deprovisioning, group sync, HRIS/IdP governance).

Rationale:
- Existing membership flows already support email-first and later profile-linking (`organizationmember.email` + `profileId`), which fits JIT.
- SCIM is better for large enterprise IT controls, but is higher complexity and should follow once login/auth is stable.

## Current-State Audit

| Capability | Current State | Notes |
| --- | --- | --- |
| Auth framework | available | Better Auth with cookie sessions (`packages/db/src/auth.ts`) |
| Email/password auth | available | Enabled via `emailAndPassword` (`packages/db/src/auth/email-password.ts`) |
| Social login | partial | Google social login only (`packages/db/src/auth.ts`, `apps/dashboard/src/lib/features/ui/auth-ui.svelte`) |
| Session handling | available | `/api/auth/*` mounted in API, `auth.api.getSession` middleware (`apps/api/src/app.ts`) |
| Multi-tenant org model | available | `organization`, `organizationmember`, org role checks and `cio-org-id` header enforcement |
| Org invite flows | available | Role-aware organization invites already implemented |
| Enterprise SSO (SAML/OIDC per org) | missing | No SSO connection model, no discovery, no SAML/OIDC enterprise callback flows |
| Force SSO policy | missing | No org-level policy to block local email/password |
| SCIM | missing | No SCIM endpoints or provisioning sync |
| Partner OAuth API join handoff | missing | No server-verified OAuth integration flow for partner apps to auto-login + auto-enroll learners |

## Product Goals
1. Allow each organization to configure one or more enterprise SSO connections.
2. Support Auth0, Google Workspace, and Okta with SAML 2.0 and OIDC.
3. Preserve existing Better Auth sessions/cookies and downstream auth middleware behavior.
4. Add Force SSO policy at org level.
5. Keep invite/onboarding flows compatible with SSO.
6. Ship JIT provisioning first, with SCIM as phase 3.
7. Add enforceable domain policy for SSO and JIT behavior.
8. Gate all SSO capabilities to Enterprise plan organizations.
9. Support secure partner OAuth API join flow so external app clicks result in automatic login and immediate course access after backend verification.

## Non-Goals (v1)
- Full SCIM implementation (deferred to phase 3).
- Global logout / SAML Single Logout (SLO).
- Arbitrary custom IdP templates beyond Auth0/Google Workspace/Okta in first release.
- Cross-organization identity linking rules beyond current email + org membership model.
- Unsigned or long-lived launch links that can be replayed for unauthorized access.
- Browser-only partner joins that bypass server-to-server verification.

## Data Sources Checked
- `packages/db/src/auth.ts`
- `packages/db/src/auth/email-password.ts`
- `apps/api/src/app.ts`
- `apps/api/src/middlewares/auth.ts`
- `apps/api/src/middlewares/org-member.ts`
- `apps/api/src/middlewares/org-admin.ts`
- `packages/db/src/schema.ts`
- `packages/db/src/queries/organization/organization.ts`
- `apps/api/src/services/account.ts`
- `apps/api/src/services/organization/invite.ts`
- `apps/api/src/services/course/invite.ts`
- `apps/dashboard/src/lib/utils/services/auth/client.ts`
- `apps/dashboard/src/lib/utils/services/auth/session.ts`
- `apps/dashboard/src/routes/(auth)/login/+page.svelte`
- `apps/dashboard/src/lib/features/ui/auth-ui.svelte`
- `apps/dashboard/src/lib/features/app/init.svelte.ts`
- `apps/dashboard/src/lib/features/ui/navigation/org-navigation.ts`
- `apps/dashboard/src/routes/course/[slug]/enroll/+page.server.ts`
- `apps/docs/content/docs/quickstart/self-hosting.mdx`
- `apps/docs/content/docs/meta.json`
- `apps/docs/content/docs/quickstart/meta.json`

## Functional Requirements

### 1. Per-Organization SSO Connection Management
- Org admins can create/update/disable SSO connections per org.
- Supported providers: Auth0, Google Workspace, Okta.
- Supported protocols: OIDC and SAML 2.0.
- Multiple connections per org are allowed; one default can be marked active.
- Connection must support test/verify before activation.

### 2. SSO Discovery and Login Start
- On org domains (`{org}.domain.com` or custom domain), login should use that org context directly.
- On shared app domain, user can enter email to discover SSO route by org policy/domain mapping.
- Discovery response should indicate:
  - SSO required or optional
  - available providers for org
  - whether password login is allowed

### 3. OIDC Flow
- Use authorization code flow with PKCE, `state`, and `nonce`.
- Validate issuer, audience, signature, nonce, token expiry.
- Extract mapped claims (`email`, `name`, `sub`, optional group claims).

### 4. SAML 2.0 Flow
- SP-initiated login for v1 (IdP-initiated is out of scope for v1).
- Validate signed assertions, audience restriction, recipient/ACS, time conditions.
- Support metadata upload or manual config.
- Extract mapped attributes (`email`, `name`, `NameID`, optional groups).

### 5. JIT Provisioning and Membership Linking
- On successful SSO callback:
  - find or create user/profile;
  - upsert org membership in `organizationmember`;
  - link external identity (`connection + subject`) to local user.
- If invited member row exists by email, bind `profileId` and mark verified.
- Default JIT role for new users: `ROLE.STUDENT` unless role mapping overrides.

### 6. Role Mapping
- Admin config can map IdP group/claim values to local roles:
  - `ROLE.ADMIN`
  - `ROLE.TUTOR`
  - `ROLE.STUDENT`
- If no mapping is matched, fallback to org default role (default `ROLE.STUDENT`).

### 7. Force SSO
- Org-level `forceSso=true` disables email/password login for that org context.
- Enforce server-side, not only UI-level.
- Users attempting password login for a force-SSO org receive a structured error + SSO redirect hints.
- Include break-glass path for designated org admins with explicit audit logging.

### 8. Audit and Observability
- Log key events:
  - connection created/updated/disabled
  - login success/failure
  - provisioning and role assignment outcomes
  - force-SSO blocks
- Include orgId, connectionId, actor/profile (when available), IP, user agent.

### 9. Domain Enforcement Policy
- Admin-configurable domain policy in org SSO settings:
  - `allowed_domains` list (for example `school.edu`, `company.com`)
  - `enforce_domain_match` toggle
  - `auto_join_allowed_domains` toggle
- Enforcement rules:
  - if `enforce_domain_match=true`, SSO login must have an email domain in `allowed_domains`;
  - users outside allowed domains are blocked or forced through invite-only flow based on policy;
  - policy applies server-side for both SAML and OIDC claim email.

### 10. Enterprise Plan Entitlement
- SSO configuration and login endpoints must verify org entitlement to `PLAN.ENTERPRISE`.
- Non-enterprise orgs should receive explicit upgrade-required responses.

### 11. Partner OAuth API Join Flow (External App -> ClassroomIO)
- Customer app integration pattern:
  - customer app backend obtains a partner OAuth access token from ClassroomIO;
  - customer app backend uses that access token to fetch org course catalog from ClassroomIO API;
  - customer app renders course cards/buttons in its own UI;
  - on `Join course`, customer app backend calls ClassroomIO join endpoint with user + course context;
  - ClassroomIO verifies the app integration and the user identity assertion before granting access.
- Verification on ClassroomIO side must include:
  - OAuth client/token verification (active org integration + valid bearer token);
  - audience/origin checks for integration;
  - user identity verification via configured SSO connection (preferred: OIDC `id_token` from trusted IdP) or equivalent signed identity assertion;
  - one-time request protection (`jti`/nonce) and expiry checks.
- On successful verification:
  - auto-authenticate learner (create/link account via SSO JIT);
  - auto-create org membership if missing (`ROLE.STUDENT` fallback unless mapping overrides);
  - auto-enroll learner in target course using existing enrollment semantics;
  - issue ClassroomIO session and redirect learner into LMS/course context without manual login.
- Grant behavior:
  - if already enrolled, remain idempotent and continue;
  - if not enrolled, create org and course membership using current enrollment patterns;
  - for paid/invite-only courses, integration-based entitlement bypass is allowed only when explicitly enabled by org policy and audited.

## Technical Design (Proposed)

### Architecture Summary
Keep Better Auth as the session issuer and cookie manager. Add an enterprise SSO layer that verifies SAML/OIDC identity and then mints standard app session data so existing middleware (`authMiddleware`, `orgMemberMiddleware`, `hooks.server.ts`) continues to work unchanged.

### Data Model

### `organization_auth_policy`
- `organization_id` (uuid, pk/fk)
- `force_sso` (boolean, default `false`)
- `provisioning_mode` (`JIT` | `SCIM`, default `JIT`)
- `default_role_id` (bigint, default `ROLE.STUDENT`)
- `allow_email_password_fallback` (boolean, default `true`)
- `allowed_domains` (text[], default `[]`)
- `enforce_domain_match` (boolean, default `false`)
- `auto_join_allowed_domains` (boolean, default `false`)
- `break_glass_enabled` (boolean, default `true`)
- `created_at`, `updated_at`

### `organization_sso_connection`
- `id` (uuid, pk)
- `organization_id` (uuid, fk, indexed)
- `provider` (`OKTA` | `GOOGLE_WORKSPACE` | `AUTH0`)
- `protocol` (`OIDC` | `SAML`)
- `display_name` (text)
- `is_active` (boolean)
- `is_default` (boolean)
- `domain_hints` (text[] or jsonb)
- `config` (jsonb, non-secret config)
- `secrets_encrypted` (jsonb, encrypted secret material)
- `claim_mapping` (jsonb)
- `role_mapping` (jsonb)
- `created_by_profile_id`, `updated_by_profile_id` (uuid)
- `created_at`, `updated_at`

Constraints:
- unique `(organization_id, provider, protocol, display_name)`
- at most one active default connection per org

### `sso_identity_link`
- `id` (uuid, pk)
- `organization_id` (uuid, indexed)
- `connection_id` (uuid, fk)
- `user_id` (uuid, fk to `user.id`)
- `external_subject` (text)
- `email_at_link` (text)
- `last_login_at` (timestamp)
- `created_at`, `updated_at`

Constraints:
- unique `(connection_id, external_subject)`
- unique `(organization_id, user_id, connection_id)`

### `sso_audit_event`
- `id` (uuid, pk)
- `organization_id` (uuid, indexed)
- `connection_id` (uuid, nullable)
- `actor_profile_id` (uuid, nullable)
- `event_type` (text/enum)
- `target_email` (text, nullable)
- `ip_address` (text, nullable)
- `user_agent` (text, nullable)
- `metadata` (jsonb)
- `created_at` (timestamp)

### `organization_oauth_integration`
- `id` (uuid, pk)
- `organization_id` (uuid, fk, indexed)
- `name` (text)
- `status` (`ACTIVE` | `DISABLED`)
- `client_id` (text, unique)
- `client_secret_hash` (text, nullable when asymmetric mode is used)
- `signing_mode` (`HMAC` | `ASYMMETRIC`)
- `secret_or_public_key_encrypted` (text/jsonb)
- `identity_verification_mode` (`OIDC_ID_TOKEN` | `SIGNED_ASSERTION`)
- `allowed_audiences` (text[]/jsonb)
- `allowed_origins` (text[]/jsonb)
- `auto_enroll_enabled` (boolean, default `true`)
- `allow_paid_course_bypass` (boolean, default `false`)
- `created_by_profile_id`, `updated_by_profile_id` (uuid)
- `created_at`, `updated_at`

### `oauth_request_nonce`
- `id` (uuid, pk)
- `organization_id` (uuid, indexed)
- `jti` (text, unique per integration)
- `expires_at` (timestamp)
- `used_at` (timestamp, nullable)
- `created_at` (timestamp)

## API and Route Plan

### Validation Layer
- `packages/utils/src/validation/organization/sso.ts`
  - `ZCreateSsoConnection`
  - `ZUpdateSsoConnection`
  - `ZTestSsoConnection`
  - `ZSsoDiscoveryQuery`
  - `ZSsoStartRequest`
  - `ZCreateOAuthIntegration`
  - `ZUpdateOAuthIntegration`
  - `ZPartnerOAuthJoin`

### Query Layer
- `packages/db/src/queries/organization/sso.ts`
  - connection CRUD
  - org auth policy read/write
  - identity link upsert
  - audit insert/list
  - oauth integration CRUD
  - oauth nonce upsert/consume

### Service Layer
- `apps/api/src/services/organization/sso.ts` (admin config lifecycle)
- `apps/api/src/services/auth/sso.ts` (discovery/start/callback/JIT/force-SSO decisions)
- `apps/api/src/services/auth/partner-oauth.ts` (partner OAuth verification + session creation + course access grant)
- include plan entitlement checks and domain policy enforcement in service layer.

### Route Layer
- `apps/api/src/routes/organization/sso.ts` (org-admin protected config endpoints)
- `apps/api/src/routes/sso/sso.ts` (public discovery/start/callback endpoints)
- `apps/api/src/routes/organization/oauth-integration.ts` (org-admin OAuth integration settings)
- `apps/api/src/routes/integrations/oauth.ts` (partner OAuth endpoints)
- Register in:
  - `apps/api/src/routes/organization/index.ts`
  - `apps/api/src/app.ts`

Note:
- Keep enterprise callback routes outside `/api/auth/*` because that path is already handled by Better Auth in `apps/api/src/app.ts`.
- Integration join verification should be initiated by partner backend (server-to-server), not by unsigned browser-only calls.

### Partner Endpoint Contracts (v1)

### Authentication for Partner OAuth Endpoints
- Partner backend calls must be server-to-server only.
- Partner token grant:
  - `POST /integrations/oauth/token` with client credentials for integration.
  - returns short-lived bearer access token with org + integration scope.
- Required headers for protected endpoints:
  - `Authorization: Bearer <partner_access_token>`
- Invalid/expired tokens are rejected.

### 1) Fetch Courses for Partner App
`POST /integrations/oauth/courses`

Request:
```json
{
  "filters": {
    "search": "python",
    "tags": ["beginner", "backend"],
    "limit": 20,
    "cursor": null
  }
}
```

Success response:
```json
{
  "success": true,
  "data": {
    "courses": [
      {
        "id": "course_uuid",
        "slug": "intro-to-python",
        "title": "Intro to Python",
        "description": "Learn Python basics",
        "type": "SELF_PACED",
        "price": 0,
        "currency": "USD",
        "orgSiteName": "acme-academy",
        "isPublished": true
      }
    ],
    "nextCursor": null
  }
}
```

### 2) Verify Join + Create Launch Session
`POST /integrations/oauth/join`

Request:
```json
{
  "course": {
    "id": "course_uuid"
  },
  "user": {
    "email": "learner@company.com",
    "name": "Learner Name",
    "externalUserId": "ext_123"
  },
  "identity": {
    "mode": "OIDC_ID_TOKEN",
    "idToken": "<partner-issued-or-forwarded-id-token>"
  },
  "entitlement": {
    "entitled": true,
    "reason": "employee-license"
  },
  "launch": {
    "jti": "unique_request_id",
    "expiresAt": "2026-02-17T12:00:00.000Z",
    "returnPath": "/lms"
  }
}
```

Success response:
```json
{
  "success": true,
  "data": {
    "alreadyEnrolled": false,
    "launchCode": "launch_code_one_time",
    "redirectUrl": "https://app.classroomio.com/sso/launch/consume?code=launch_code_one_time",
    "expiresAt": "2026-02-17T12:00:30.000Z"
  }
}
```

Behavior on success:
- Verify partner OAuth access token and integration policy.
- Verify user identity assertion (`OIDC_ID_TOKEN` or `SIGNED_ASSERTION`).
- Create/link ClassroomIO user via SSO JIT.
- Ensure org membership and target course enrollment.
- Return one-time `launchCode` for browser redirect.

### 3) Consume Launch Code (Browser Redirect Endpoint)
`GET /sso/launch/consume?code=<launch_code_one_time>`

Behavior:
- Validate one-time code + expiry + nonce usage.
- Set ClassroomIO auth session cookies.
- Redirect to target path (`/lms` or course route) with authenticated session.

Success:
- `302` redirect with valid session cookie.

### Error Response Contract (Partner Endpoints)
```json
{
  "success": false,
  "error": "Human readable message",
  "code": "ERROR_CODE"
}
```

Common error codes:
- `INTEGRATION_UNAUTHORIZED`
- `INTEGRATION_DISABLED`
- `INVALID_SIGNATURE`
- `REQUEST_EXPIRED`
- `REPLAY_DETECTED`
- `IDENTITY_VERIFICATION_FAILED`
- `COURSE_NOT_FOUND`
- `COURSE_ENROLLMENT_NOT_ALLOWED`
- `ENTITLEMENT_REQUIRED`
- `PLAN_UPGRADE_REQUIRED`

## Frontend Plan (Dashboard)

### Login UX
- Update:
  - `apps/dashboard/src/routes/(auth)/login/+page.svelte`
  - `apps/dashboard/src/lib/features/ui/auth-ui.svelte`
- Add SSO discovery step:
  - org-site context: direct SSO actions for current org
  - shared app login: email-based discovery before method selection
- If Force SSO for org, hide password fields and show SSO-only CTA.

### Org Settings UX
- Add new page: `apps/dashboard/src/routes/org/[slug]/settings/sso/+page.svelte`
- Add settings feature page: `apps/dashboard/src/lib/features/settings/pages/sso.svelte`
- Export page in `apps/dashboard/src/lib/features/settings/pages/index.ts`
- Add org navigation nested route in `apps/dashboard/src/lib/features/ui/navigation/org-navigation.ts`
- Add controls for:
  - Force SSO
  - Allowed domains
  - Enforce domain match toggle
  - Auto-join allowed domains toggle
  - Break-glass enable/disable
- Add translation keys in `apps/dashboard/src/lib/utils/translations/en.json` and translation sync workflow.

### Client Types/API Class
- Add request types in `apps/dashboard/src/lib/features/org/utils/types.ts`
- Add API class in `apps/dashboard/src/lib/features/org/api/sso.svelte.ts`
- Use `this.execute<RequestType>()` pattern only (no direct RPC in components).

### Partner OAuth Integration UX
- Add org admin settings UI for partner OAuth integrations:
  - integration key/issuer management
  - OAuth client credential lifecycle
  - enable/disable auto-enroll-on-join
  - allowed redirect origin controls
- Provide partner backend contract docs (token, courses, join, consume flow).

## Documentation Plan (`apps/docs`)

### Required Documentation Updates
- Do not place Enterprise SSO under `how-to-guides`.
- Add core feature documentation page:
  - `apps/docs/content/docs/enterprise-sso.mdx`
  - Cover: feature scope, Auth0/Google Workspace/Okta support, OIDC vs SAML behavior, claim mapping, Force SSO, break-glass, domain enforcement, and entitlement requirements.
- Register the feature page in root docs nav:
  - `apps/docs/content/docs/meta.json` under `---Core Features---`
- Add terminology reference (either as a dedicated page or section in the feature page):
  - recommended page: `apps/docs/content/docs/sso-terminology.mdx`
  - terms: SP-initiated, IdP, ACS, JIT, SCIM, Force SSO, break-glass, domain enforcement.
- Register terminology page in:
  - `apps/docs/content/docs/meta.json`
- Update self-hosting reference:
  - `apps/docs/content/docs/quickstart/self-hosting.mdx`
  - Include SSO-related env/configuration requirements and callback URL guidance for OIDC/SAML.
- If self-hosting gets a separate SSO page, register in:
  - `apps/docs/content/docs/quickstart/meta.json`

### Required Topics in Docs
- SSO prerequisites and Enterprise plan requirement.
- Provider-by-provider setup checklist (Auth0, Google Workspace, Okta).
- Force SSO behavior and user experience.
- Key SSO terminology and protocol concepts for non-identity specialists.
- Domain enforcement behavior (`allowed_domains`, strict match, auto-join policy).
- JIT behavior, invite interactions, and role mapping behavior.
- Break-glass policy and recommended operational runbook.
- Partner OAuth join flow for external apps:
  - integration API credentials and token grant requirements,
  - customer app responsibilities,
  - backend verification handshake,
  - auto-login + auto-access behavior,
  - troubleshooting invalid/expired launch tokens.
- Troubleshooting section:
  - common callback mismatch issues,
  - certificate/metadata issues for SAML,
  - domain mismatch denials,
  - entitlement/plan gating errors,
  - partner OAuth token/nonce replay failures.

## Security Requirements
1. Encrypt all SSO secrets at rest.
2. Strict signature/issuer/audience checks for SAML/OIDC.
3. Anti-CSRF and replay protection via `state`/`nonce` and one-time callback state.
4. Rate-limit discovery/start/callback endpoints.
5. Full audit trail for admin config and auth outcomes.
6. No trust of frontend-enforced Force SSO alone; must be validated on backend.
7. Partner OAuth join requests and launch codes must be short-lived and one-time (`jti` replay protection).
8. Launch redirects must be validated to approved routes/origins; no open redirect behavior.
9. Partner join endpoints require server-to-server OAuth verification; do not trust client-only payloads for enrollment.

## Rollout Plan

### Phase 1: Foundation + OIDC + JIT
- Schema + policy/connection management
- OIDC flows for Auth0/Google Workspace/Okta
- SSO discovery + login UI
- Force SSO enforcement (OIDC path)
- Domain enforcement policy + admin settings UI
- Enterprise plan entitlement checks
- Partner OAuth join v1:
  - OAuth integration settings
  - partner OAuth endpoints for token, course list, and join verification
  - auto-login + auto course access grant
- Publish docs updates in `apps/docs` for OIDC + policy settings

### Phase 2: SAML 2.0
- SAML metadata/config support
- ACS callback, assertion validation, claim mapping
- Force SSO parity for SAML orgs
- Domain enforcement parity for SAML claims
- Extend docs in `apps/docs` with SAML-specific configuration and troubleshooting

### Phase 3: SCIM (Enterprise+)
- SCIM token management per org
- `/Users` and `/Groups` provisioning endpoints
- deprovision and role sync policy

Interim before phase 3:
- perform login-time entitlement checks against IdP claims and org/domain policy;
- deny session issuance when user is no longer entitled.

## Acceptance Criteria
1. Org admin can configure at least one active SSO connection (OIDC or SAML).
2. User can successfully login through Auth0, Google Workspace, and Okta.
3. Successful SSO login creates/links user and org membership via JIT.
4. Force SSO org cannot authenticate through email/password for org-context access.
5. Domain enforcement policy is configurable in UI and enforced server-side.
6. SSO access is blocked for non-enterprise orgs.
7. Existing non-SSO orgs keep current auth behavior unchanged.
8. Audit events are written for config changes and SSO auth events.
9. `apps/docs` includes SSO core-feature and terminology docs (not how-to placement), plus self-hosting updates, before feature GA.
10. Partner app backend can verify join with ClassroomIO and, on success, the learner is automatically logged in and granted access to the selected course without manual login.

## Risks and Mitigations
- Risk: Force SSO lockout due bad config.
  - Mitigation: test connection before activation + break-glass toggle for org admins.
- Risk: domain collisions across organizations.
  - Mitigation: deterministic discovery rules + org selection fallback.
- Risk: role escalation by incorrect claim mapping.
  - Mitigation: explicit mapping validation + default least privilege (`ROLE.STUDENT`).
- Risk: callback replay attacks.
  - Mitigation: one-time state, timestamp windows, assertion ID tracking.
- Risk: partner OAuth token or launch-code leakage/replay.
  - Mitigation: one-time `jti`, short expiry, token scope limits, strict audience/origin checks.
- Risk: partner app sends unverified or spoofed user identity.
  - Mitigation: require trusted identity assertion mode (OIDC token/signature validation) and reject unverifiable identities.
- Risk: unintended paid-course bypass via partner join.
  - Mitigation: require explicit org policy + entitlement claim + full audit trail per grant.

## Finalized Decisions (From Open Questions)
1. SAML v1 will be SP-initiated only.
2. Break-glass local admin access is included with strict auditing.
3. Domain enforcement is an explicit org-level SSO setting in UI + backend.
4. SSO is gated to `PLAN.ENTERPRISE`.
5. SCIM deprovisioning remains phase 3; interim entitlement checks are required at login.
6. Trusted partner OAuth API join flow must auto-login and auto-grant access for entitled users after app verification.
