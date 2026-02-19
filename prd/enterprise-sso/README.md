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

## Product Goals
1. Allow each organization to configure one or more enterprise SSO connections.
2. Support Auth0, Google Workspace, and Okta with SAML 2.0 and OIDC.
3. Preserve existing Better Auth sessions/cookies and downstream auth middleware behavior.
4. Add Force SSO policy at org level.
5. Keep invite/onboarding flows compatible with SSO.
6. Ship JIT provisioning first, with SCIM as phase 3.
7. Add enforceable domain policy for SSO and JIT behavior.
8. Gate all SSO capabilities to Enterprise plan organizations.

## Non-Goals (v1)
- Full SCIM implementation (deferred to phase 3).
- Global logout / SAML Single Logout (SLO).
- Arbitrary custom IdP templates beyond Auth0/Google Workspace/Okta in first release.
- Cross-organization identity linking rules beyond current email + org membership model.

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

## API and Route Plan

### Validation Layer
- `packages/utils/src/validation/organization/sso.ts`
  - `ZCreateSsoConnection`
  - `ZUpdateSsoConnection`
  - `ZTestSsoConnection`
  - `ZSsoDiscoveryQuery`
  - `ZSsoStartRequest`

### Query Layer
- `packages/db/src/queries/organization/sso.ts`
  - connection CRUD
  - org auth policy read/write
  - identity link upsert
  - audit insert/list

### Service Layer
- `apps/api/src/services/organization/sso.ts` (admin config lifecycle)
- `apps/api/src/services/auth/sso.ts` (discovery/start/callback/JIT/force-SSO decisions)
- include plan entitlement checks and domain policy enforcement in service layer.

### Route Layer
- `apps/api/src/routes/organization/sso.ts` (org-admin protected config endpoints)
- `apps/api/src/routes/sso/sso.ts` (public discovery/start/callback endpoints)
- Register in:
  - `apps/api/src/routes/organization/index.ts`
  - `apps/api/src/app.ts`

Note:
- Keep enterprise callback routes outside `/api/auth/*` because that path is already handled by Better Auth in `apps/api/src/app.ts`.

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

### Admin SSO Configuration UI Spec

#### Page Information Architecture
- `Connections` section:
  - List existing SSO connections (provider, protocol, status, default, last tested).
  - Actions: `Add connection`, `Edit`, `Disable`, `Set as default`, `Delete draft`.
- `Policies` section:
  - Force SSO toggle.
  - Domain policy fields (`allowed_domains`, enforce toggle, auto-join toggle).
  - Break-glass toggle and emergency-access copy.
- `Activity` section:
  - Recent SSO audit events (connection changed, test run, activation/deactivation).

#### Setup Wizard (Create/Edit Connection)
- Step 1 `Choose Provider`:
  - Provider: `Auth0`, `Google Workspace`, `Okta`.
  - Protocol: `OIDC` or `SAML`.
  - Connection display name.
- Step 2 `Configure Identity Provider`:
  - Render provider/protocol-specific fields (defined below).
  - Show generated callback values to copy into IdP admin consoles.
- Step 3 `Claims and Roles`:
  - Claim mapping for `email`, `name`, `subject`, optional `groups`.
  - Role mapping table from claim/group values to `ROLE.ADMIN`, `ROLE.TUTOR`, `ROLE.STUDENT`.
  - Default role fallback selector (default `ROLE.STUDENT`).
- Step 4 `Test Connection`:
  - Run live test with state/nonce checks and callback verification.
  - Display structured pass/fail results with remediation hints.
- Step 5 `Review and Activate`:
  - Summary of config and policy impact (including Force SSO impact).
  - Activate now or save as draft.
  - If Force SSO is enabled, require explicit confirmation before activation.

#### Provider-Specific Form Fields
- Common fields (all providers/protocols):
  - `display_name` (required)
  - `domain_hints` (optional, comma-separated)
  - `is_default` (optional)
  - `is_active` (set at activation)
- OIDC fields:
  - `issuer` (required URL)
  - `client_id` (required)
  - `client_secret` (required for confidential clients)
  - `authorization_endpoint` (optional when derivable from issuer)
  - `token_endpoint` (optional when derivable from issuer)
  - `jwks_uri` (optional when derivable from issuer)
  - `scopes` (default `openid profile email`)
  - Read-only generated values: callback URL(s), redirect URI, expected audience.
- SAML fields:
  - `idp_metadata_url` (preferred) or metadata XML upload
  - Manual fallback fields when no metadata URL:
    - `idp_entity_id`
    - `sso_url`
    - `x509_certificate`
  - Optional: `nameid_format`, `sign_authn_request`
  - Read-only generated values: ACS URL, SP Entity ID.
- Provider presets:
  - `Okta`: prefill common issuer/entity patterns and group-claim defaults.
  - `Google Workspace`: prefill recommended claim names and expected issuer hints.
  - `Auth0`: prefill tenant issuer pattern and default OIDC claim mapping.

#### Validation Rules and Error UX
- Field-level validation:
  - URLs must be valid HTTPS URLs (localhost exception for non-production environments).
  - Required fields must be present before step completion.
  - Certificates must parse and pass basic validity checks.
  - Claim mapping must include at least `email` and `subject`.
  - `allowed_domains` must be valid domains, normalized lowercase, de-duplicated.
- Cross-field/business validation:
  - `force_sso=true` requires at least one active, tested default connection.
  - `enforce_domain_match=true` requires `allowed_domains` to be non-empty.
  - Only one default active connection per org.
- Error presentation:
  - Inline field errors for input validation.
  - Step-level banners for test/verification failures.
  - Retry actions for transient errors (timeout/network).
  - Structured backend error mapping for:
    - issuer/audience mismatch
    - invalid signature/certificate
    - callback URL mismatch
    - missing required claims (`email`, `sub`/`NameID`)
    - entitlement/plan-gating failures.

#### Safety and Recovery UX
- Draft mode is supported; drafts cannot be used for login.
- Test-before-activate is required for first active connection in an org.
- Force SSO confirmation modal includes lockout warning and break-glass status.
- Disable/rollback action is always available to org admins.
- All admin actions write visible audit entries in the `Activity` section.

### Client Types/API Class
- Add request types in `apps/dashboard/src/lib/features/org/utils/types.ts`
- Add API class in `apps/dashboard/src/lib/features/org/api/sso.svelte.ts`
- Use `this.execute<RequestType>()` pattern only (no direct RPC in components).

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
- Troubleshooting section:
  - common callback mismatch issues,
  - certificate/metadata issues for SAML,
  - domain mismatch denials,
  - entitlement/plan gating errors.

## Security Requirements
1. Encrypt all SSO secrets at rest.
2. Strict signature/issuer/audience checks for SAML/OIDC.
3. Anti-CSRF and replay protection via `state`/`nonce` and one-time callback state.
4. Rate-limit discovery/start/callback endpoints.
5. Full audit trail for admin config and auth outcomes.
6. No trust of frontend-enforced Force SSO alone; must be validated on backend.

## Rollout Plan

### Phase 1: Foundation + OIDC + JIT
- Schema + policy/connection management
- OIDC flows for Auth0/Google Workspace/Okta
- SSO discovery + login UI
- Force SSO enforcement (OIDC path)
- Domain enforcement policy + admin settings UI
- Enterprise plan entitlement checks
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
10. Org admins can configure Auth0, Google Workspace, and Okta through a step-based UI wizard for both OIDC and SAML.
11. Connection activation is blocked until required fields validate and connection test passes for first active org connection.
12. UI surfaces actionable inline and step-level errors for provider setup, callback mismatch, claim mapping, and domain policy violations.

## Risks and Mitigations
- Risk: Force SSO lockout due bad config.
  - Mitigation: test connection before activation + break-glass toggle for org admins.
- Risk: domain collisions across organizations.
  - Mitigation: deterministic discovery rules + org selection fallback.
- Risk: role escalation by incorrect claim mapping.
  - Mitigation: explicit mapping validation + default least privilege (`ROLE.STUDENT`).
- Risk: callback replay attacks.
  - Mitigation: one-time state, timestamp windows, assertion ID tracking.

## Finalized Decisions (From Open Questions)
1. SAML v1 will be SP-initiated only.
2. Break-glass local admin access is included with strict auditing.
3. Domain enforcement is an explicit org-level SSO setting in UI + backend.
4. SSO is gated to `PLAN.ENTERPRISE`.
5. SCIM deprovisioning remains phase 3; interim entitlement checks are required at login.
