# Enterprise SSO PRD (SAML 2.0 + OIDC)

## Purpose
Add enterprise SSO for ClassroomIO with per-organization configuration, supporting both SAML 2.0 and OIDC, while preserving the current Better Auth session model and multi-tenant org permissions.

## Confirmed Decisions (2026-02-17)
1. IdPs to support: Auth0, Google Workspace, Okta.
2. Scope: per organization (not global tenant-wide config).
3. Protocols: OIDC for v1. SAML 2.0 deferred to v2.
4. Force SSO: enabled (orgs can disable email/password when SSO is enabled).
5. Provisioning: JIT only for v1. SCIM deferred to future phase.
6. SAML deferred to v2 (Better Auth SAML is in active development).
7. Break-glass: simplified emergency access via pre-configured admin bypass.
8. Domain enforcement: simplified to auto-join toggle.
9. Entitlement: SSO is gated to `PLAN.ENTERPRISE`.
10. SCIM deprovisioning: future phase, with interim login-time entitlement checks.

## Architecture: Better Auth SSO Plugin

v1 leverages **Better Auth's official SSO plugin** (`@better-auth/sso`) for OIDC support:
- Built-in OIDC discovery and flow handling
- Automatic callback URL generation
- Domain-based provider routing
- Claim mapping support
- Session management via Better Auth

Our custom layer handles:
- Enterprise plan entitlement checks
- Organization-scoped provider management
- Force SSO policy enforcement
- Org membership JIT provisioning
- Admin configuration UI

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
1. Allow each organization to configure one SSO connection.
2. Support Auth0, Google Workspace, and Okta with OIDC.
3. Preserve existing Better Auth sessions/cookies and downstream auth middleware behavior.
4. Add Force SSO policy at org level.
5. Keep invite/onboarding flows compatible with SSO.
6. Ship JIT provisioning for v1.
7. Add simple domain-based auto-join policy.
8. Gate all SSO capabilities to Enterprise plan organizations.

## Non-Goals (v1)
- **SAML 2.0** (deferred to v2 - Better Auth SAML is in active development).
- SCIM implementation (deferred to future phase).
- Multiple SSO connections per organization.
- Custom claim mapping UI (use standard claims).
- Global logout / SAML Single Logout (SLO).
- Arbitrary custom IdP templates beyond Auth0/Google Workspace/Okta.
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
- Org admins can create/update/disable one SSO connection per org.
- Supported providers: Auth0, Google Workspace, Okta.
- Supported protocols: OIDC and SAML 2.0.
- Connection supports test/verify before activation.

### 2. SSO Discovery and Login Start
- On org domains (`{org}.domain.com` or custom domain), login should use that org context directly.
- On shared app domain, user can enter email to discover SSO route by org policy/domain mapping.
- Discovery response should indicate:
  - SSO required or optional
  - Provider type
  - Whether password login is allowed

### 3. OIDC Flow (Better Auth SSO Plugin)
Better Auth handles the OIDC flow:
- Authorization code flow with PKCE, `state`, and `nonce`.
- Auto-discovery from `.well-known/openid-configuration`.
- Token validation and userinfo retrieval.
- Claim mapping to user fields.

Our layer handles:
- Provider registration via `auth.api.registerSSOProvider`.
- Post-sign-in org membership provisioning via `dbHooks`.
- Role mapping from `groups` claim.

### 4. SAML 2.0 Flow (v2)
- **Deferred to v2** - will be implemented once Better Auth's SAML support is stable.

### 5. JIT Provisioning and Membership Linking
- On successful SSO callback:
  - Find or create user/profile
  - Upsert org membership in `organizationmember`
  - Link external identity (`connection + subject`) to local user
- If invited member row exists by email, bind `profileId` and mark verified
- Default JIT role for new users: `ROLE.STUDENT`

### 6. Role Mapping
- Simple role mapping from IdP `groups` claim:
  - Map group names to `ROLE.ADMIN`, `ROLE.TUTOR`, `ROLE.STUDENT`
  - If no mapping matched, fallback to `ROLE.STUDENT`
- Configuration: simple key-value mapping in connection settings

### 7. Force SSO
- Org-level `forceSso=true` disables email/password login for that org context
- Enforce server-side, not only UI-level
- Users attempting password login for a force-SSO org receive structured error + SSO redirect hints
- Existing email/password sessions: remain valid until expiry (no forced logout)
- Break-glass: pre-configured emergency admin can bypass (audited)

### 8. Audit and Observability
- Use existing audit/logging infrastructure with structured event types:
  - `sso.connection_created`, `sso.connection_updated`, `sso.connection_disabled`
  - `sso.login_success`, `sso.login_failure`
  - `sso.provisioned`, `sso.role_assigned`
  - `sso.force_sso_block`
- Include orgId, connectionId, actor/profile (when available), IP, user agent

### 9. Domain Auto-Join Policy
- Simple toggle: `auto_join_sso_domains` (boolean)
- When enabled, users with matching email domain can auto-join org via SSO
- When disabled, users must have pending invite to join via SSO
- Trust IdP-verified email domains

### 10. Enterprise Plan Entitlement
- SSO configuration and login endpoints must verify org entitlement to `PLAN.ENTERPRISE`
- Non-enterprise orgs receive explicit upgrade-required responses

## Technical Design

### Architecture Summary
Leverage **Better Auth SSO plugin** (`@better-auth/sso`) for OIDC protocol handling. Our custom layer provides:
1. **Admin management** - CRUD SSO connections (stored in our schema for UI)
2. **Enterprise gating** - Verify `PLAN.ENTERPRISE` before allowing SSO
3. **Force SSO enforcement** - Block email/password when policy enabled
4. **JIT provisioning** - Create org membership post-authentication via `dbHooks`

Better Auth handles:
- OIDC discovery, authorization, token exchange
- Session creation and management
- User creation/linking

### Data Model

#### `organization_auth_policy`
- `organization_id` (uuid, pk/fk)
- `force_sso` (boolean, default `false`)
- `default_role_id` (bigint, default `ROLE.STUDENT`)
- `allow_email_password_fallback` (boolean, default `true`)
- `auto_join_sso_domains` (boolean, default `false`)
- `break_glass_enabled` (boolean, default `true`)
- `created_at`, `updated_at`

#### `organization_sso_connection`
- `id` (uuid, pk)
- `organization_id` (uuid, fk, indexed, unique)
- `provider` (`OKTA` | `GOOGLE_WORKSPACE` | `AUTH0`)
- `protocol` (`OIDC`) - enum for future SAML extension
- `display_name` (text)
- `is_active` (boolean, default `false`)
- `issuer` (text) - IdP issuer URL
- `domain` (text) - email domain for discovery
- `oidc_config` (jsonb) - clientId, scopes, etc (clientSecret stored in Better Auth)
- `role_mapping` (jsonb) - simple key-value: group name → role
- `better_auth_provider_id` (text) - reference to Better Auth's stored provider
- `created_by_profile_id`, `updated_by_profile_id` (uuid)
- `created_at`, `updated_at`

#### `sso_identity_link`
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

## API and Route Plan

### Better Auth Integration
The SSO plugin provides these endpoints automatically:
- `POST /api/auth/sso/register` - Register OIDC provider (admin only)
- `GET/POST /api/auth/sso/authorize/:providerId` - Start SSO flow
- `GET/POST /api/auth/sso/callback/:providerId` - OIDC callback

### Our Custom Layer

#### Validation Layer
- `packages/utils/src/validation/organization/sso.ts`
  - `ZCreateSsoConnection`
  - `ZUpdateSsoConnection`
  - `ZSsoDiscoveryQuery`

#### Query Layer
- `packages/db/src/queries/organization/sso.ts`
  - connection CRUD
  - org auth policy read/write

#### Service Layer
- `apps/api/src/services/organization/sso.ts`
  - Admin CRUD with Enterprise plan check
  - Call `auth.api.registerSSOProvider` on activation
  - Call `auth.api.deleteSSOProvider` on deactivation
- `apps/api/src/services/auth/sso.ts`
  - Discovery logic
  - Force SSO enforcement

#### Route Layer
- `apps/api/src/routes/organization/sso.ts` - Admin CRUD endpoints
- `apps/api/src/routes/sso/discovery.ts` - Public discovery endpoint
- Register in:
  - `apps/api/src/routes/organization/index.ts`
  - `apps/api/src/app.ts`

#### Better Auth Hooks
- `dbHooks.user.afterCreate` - JIT org membership provisioning

## Frontend Plan (Dashboard)

### Login UX
- Update:
  - `apps/dashboard/src/routes/(auth)/login/+page.svelte`
  - `apps/dashboard/src/lib/features/ui/auth-ui.svelte`
- Add SSO discovery step:
  - org-site context: direct SSO action for current org
  - shared app login: email-based discovery before method selection
- If Force SSO for org, hide password fields and show SSO-only CTA

### Org Settings UX
- Add new page: `apps/dashboard/src/routes/org/[slug]/settings/sso/+page.svelte`
- Add settings feature page: `apps/dashboard/src/lib/features/settings/pages/sso.svelte`
- Export page in `apps/dashboard/src/lib/features/settings/pages/index.ts`
- Add org navigation nested route in `apps/dashboard/src/lib/features/ui/navigation/org-navigation.ts`
- Add controls for:
  - Provider selection (Auth0, Google Workspace, Okta)
  - Protocol selection (OIDC, SAML)
  - Force SSO toggle
  - Auto-join toggle
  - Simple role mapping
  - Break-glass enable/disable
- Add translation keys in `apps/dashboard/src/lib/utils/translations/en.json`

### Admin SSO Configuration UI Spec

#### Page Information Architecture
- `Connection` section:
  - Current SSO connection status (provider, protocol, active/inactive)
  - Actions: `Configure`, `Edit`, `Disable`, `Test`, `Activate`
- `Policies` section:
  - Force SSO toggle
  - Auto-join toggle
  - Break-glass toggle
- `Role Mapping` section:
  - Simple table: IdP group name → ClassroomIO role

#### Setup Wizard (Create/Edit Connection)
- Step 1 `Choose Provider`:
  - Provider: `Auth0`, `Google Workspace`, `Okta`
  - Protocol: `OIDC` or `SAML`
- Step 2 `Configure Identity Provider`:
  - Render provider/protocol-specific fields
  - Show generated callback values to copy into IdP
- Step 3 `Test Connection` (optional):
  - Run live test with state/nonce checks
  - Display pass/fail results with remediation hints
- Step 4 `Activate`:
  - Summary of config
  - Activate now or save as draft
  - If Force SSO enabled, require explicit confirmation

#### Provider-Specific Form Fields (OIDC Only)
- Common fields:
  - `display_name` (required)
  - `domain` (required) - email domain for discovery (e.g., `company.com`)
- OIDC fields:
  - `issuer` (required URL) - e.g., `https://company.okta.com`
  - `client_id` (required)
  - `client_secret` (required) - sent to Better Auth, not stored locally
  - `scopes` (default `openid profile email`)
  - Read-only: callback URL (`/api/auth/sso/callback/{providerId}`)

#### Validation Rules and Error UX
- Field-level validation:
  - URLs must be valid HTTPS (localhost exception for dev)
  - Required fields present before activation
  - Claim mapping must include `email` and `sub`/`NameID`
- Cross-field validation:
  - `force_sso=true` requires active connection
  - Connection can be saved as draft without full validation
- Error presentation:
  - Inline field errors for input validation
  - Structured backend errors for: issuer mismatch, invalid cert, callback mismatch, missing claims

#### Safety and Recovery UX
- Draft mode supported; drafts cannot be used for login
- Disable/rollback action always available to org admins
- All admin actions write visible audit entries

### Client Types/API Class
- Add request types in `apps/dashboard/src/lib/features/org/utils/types.ts`
- Add API class in `apps/dashboard/src/lib/features/org/api/sso.svelte.ts`
- Use `this.execute<RequestType>()` pattern only

## Documentation Plan (`apps/docs`)

### Required Documentation Updates
- Add core feature documentation:
  - `apps/docs/content/docs/enterprise-sso.mdx` - feature overview
- Add how-to guides:
  - `apps/docs/content/docs/how-to/sso-auth0.mdx`
  - `apps/docs/content/docs/how-to/sso-google-workspace.mdx`
  - `apps/docs/content/docs/how-to/sso-okta.mdx`
- Register pages in root docs nav:
  - `apps/docs/content/docs/meta.json` under `---Core Features---`
- Update self-hosting reference:
  - `apps/docs/content/docs/quickstart/self-hosting.mdx`
  - Include SSO-related env vars and callback URL guidance

### Required Topics in Docs
- SSO prerequisites and Enterprise plan requirement
- Provider-by-provider setup checklist (Auth0, Google Workspace, Okta)
- Force SSO behavior and user experience
- JIT behavior and invite interactions
- Break-glass policy
- Troubleshooting: callback mismatch, certificate issues, entitlement errors

## Security Requirements
1. Encrypt all SSO secrets at rest
2. Strict signature/issuer/audience checks for SAML/OIDC
3. Anti-CSRF and replay protection via `state`/`nonce` and one-time callback state
4. Rate-limit discovery/start/callback endpoints
5. Full audit trail for admin config and auth outcomes via existing logging
6. No trust of frontend-enforced Force SSO alone; must be validated on backend

## Rollout Plan

### Phase 1: Foundation + OIDC + JIT
- Install `@better-auth/sso` plugin
- Schema + policy/connection management
- Integration with Better Auth SSO plugin
- OIDC flows for Auth0/Google Workspace/Okta via Better Auth
- SSO discovery + login UI
- Force SSO enforcement
- Domain auto-join policy + admin settings UI
- Enterprise plan entitlement checks
- JIT org membership via `dbHooks`
- Publish docs updates

### Phase 2: SAML 2.0
- Enable when Better Auth SAML is stable
- SAML flows for supported providers
- Force SSO parity for SAML

### Phase 3: Future Enhancements
- SCIM provisioning (if customer demand)
- Multiple connections per org (if customer demand)
- Advanced claim mapping (if customer demand)

## Acceptance Criteria
1. Org admin can configure an active SSO connection (OIDC).
2. User can successfully login through Auth0, Google Workspace, and Okta.
3. Successful SSO login creates/links user and org membership via JIT.
4. Force SSO org cannot authenticate through email/password for org-context access.
5. Auto-join policy is configurable in UI and enforced server-side.
6. SSO access is blocked for non-enterprise orgs.
7. Existing non-SSO orgs keep current auth behavior unchanged.
8. Audit events are logged for config changes and SSO auth events.
9. `apps/docs` includes SSO feature docs and provider how-to guides before GA.
10. Org admins can configure Auth0, Google Workspace, and Okta through a setup wizard.
11. Connection can be saved as draft without full validation.
12. UI surfaces actionable errors for provider setup and configuration issues.

## Risks and Mitigations
- Risk: Force SSO lockout due to bad config.
  - Mitigation: connection can be disabled by any org admin + break-glass emergency access.
- Risk: role escalation by incorrect claim mapping.
  - Mitigation: simple mapping validation + default least privilege (`ROLE.STUDENT`).
- Risk: callback replay attacks.
  - Mitigation: one-time state, timestamp windows, assertion ID tracking.

## Finalized Decisions
1. **OIDC only for v1** - SAML deferred to v2 (Better Auth SAML in active development).
2. Use **Better Auth SSO plugin** (`@better-auth/sso`) for OIDC flow handling.
3. Break-glass local admin access is included with strict auditing.
4. Domain enforcement simplified to auto-join toggle.
5. SSO is gated to `PLAN.ENTERPRISE`.
6. SCIM deferred to future phase.
7. Single connection per org for v1.
8. Standard claims only, no custom claim mapping UI.
