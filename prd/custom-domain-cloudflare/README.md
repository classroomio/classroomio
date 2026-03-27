# Cloudflare Custom Subdomain Reconnect PRD

## Status
- Draft

## Date
- March 22, 2026

## Purpose
Replace the current Vercel-managed custom domain setup flow with a Cloudflare-managed custom subdomain flow, and require existing customers to reconnect their custom domains through the new setup path.

## Problem Statement
Custom-domain setup is currently tightly coupled to Vercel project-domain APIs. The backend route in `apps/api/src/routes/domain/domain.ts` proxies directly to Vercel-specific actions, and the dashboard UI in `apps/dashboard/src/lib/features/settings/pages/domains.svelte` hardcodes Vercel DNS guidance (`cname.vercel-dns.com`).

This creates three problems:
1. Domain provisioning logic is provider-specific instead of product-specific.
2. The dashboard cannot render provider-agnostic DNS instructions or richer setup states.
3. Existing setup assumes Vercel remains the control plane for custom domains, which no longer matches the intended infrastructure direction.

We are not doing an in-place live migration of existing Vercel-managed domains. Instead, organizations will be asked to set up their custom domain again through a new Cloudflare-backed flow.

## Confirmed Decisions
1. Cloudflare will manage custom-domain setup going forward.
2. The app itself will not be served by Cloudflare as a full-app hosting migration in this project.
3. Scope is limited to custom subdomains only.
4. Apex/root domains are out of scope.
5. Existing customers will reconnect their domain through the new flow instead of being transparently migrated from Vercel.

## Goals
1. Replace Vercel-specific custom-domain setup with a Cloudflare-backed setup flow.
2. Keep the existing organization data model centered on `customDomain` and `isCustomDomainVerified`.
3. Move domain orchestration into the backend so the dashboard does not manage provider sequencing itself.
4. Render DNS instructions from API responses instead of hardcoded provider copy.
5. Preserve runtime host-to-organization lookup for verified custom domains.
6. Provide a clear reset and reconnect path for organizations with previously configured domains.

## Non-Goals
- Supporting apex/root domains.
- Running the main app on Cloudflare.
- Preserving old Vercel domain attachments indefinitely.
- Building a multi-provider long-term abstraction unless required for rollout safety.
- Automatic migration of existing Vercel domain config without user action.

## Data Sources Checked
- `apps/api/src/routes/domain/domain.ts`
- `apps/api/src/services/org/domain.ts`
- `apps/dashboard/src/lib/features/settings/pages/domains.svelte`
- `apps/dashboard/src/lib/features/org/api/org.svelte.ts`
- `apps/dashboard/src/lib/utils/functions/domain.ts`
- `apps/dashboard/src/lib/utils/services/org/domain.ts`
- `apps/dashboard/src/lib/utils/types/org.ts`
- `apps/dashboard/src/lib/features/app/layout-setup.ts`
- `apps/dashboard/src/lib/features/org/api/org.server.ts`
- `apps/docs/content/docs/how-to-guides/customize-organization.mdx`

## Current State

### Backend
- `POST /domain` accepts `verify_domain`, `add_domain`, and `remove_domain`.
- Those actions proxy directly to Vercel in `apps/api/src/services/org/domain.ts`.
- The backend contract is provider-shaped rather than product-shaped.

### Dashboard
- The settings page stores `customDomain` first via organization update, then separately calls the domain route.
- DNS instructions are hardcoded to `CNAME -> cname.vercel-dns.com`.
- Verification UX is reduced to a simple pending/verified state with no provider-neutral detail.

### Runtime
- Runtime org resolution already supports `customDomain` lookups in `apps/dashboard/src/lib/features/app/layout-setup.ts`.
- Server-side org fetchers already support `customDomain + isCustomDomainVerified`.
- This means the main runtime routing model can stay mostly intact if Cloudflare forwards the original host correctly.

### Docs
- User-facing docs still say external custom domains are “coming soon”, which no longer matches the in-app paid feature.

## User Story
As an organization admin, I want to connect a branded subdomain like `courses.example.com` to ClassroomIO through a clear Cloudflare-backed flow, so learners can access my organization site on my own domain.

As an existing organization admin with a previously configured domain, I want to understand that I must reconnect the domain through the new setup flow, and I want the product to show me the exact DNS record I need to add.

## Functional Requirements
1. Custom domain setup must accept only valid subdomains.
2. The API must return normalized domain setup data instead of Vercel-specific payloads.
3. The backend must own the full provisioning sequence:
- validate input
- provision/register domain with Cloudflare
- persist organization domain state
- return DNS instructions and current status
4. The dashboard must render DNS instructions from API data.
5. The dashboard must support at least these states:
- no domain configured
- reconnect required
- pending DNS
- pending verification
- verified
- error
6. The dashboard must allow admins to remove a configured domain.
7. Existing domains that were previously configured through Vercel must be markable as needing reconnection.
8. Host-based org lookup must continue to work for verified custom domains.
9. Free-plan gating for custom domains must remain unchanged unless a separate pricing decision changes it.

## Non-Functional Requirements
1. Domain-related errors must be actionable and provider-neutral in UI copy.
2. Domain setup operations must be idempotent enough for safe retries by admins.
3. Partial state must be minimized; backend orchestration should avoid “saved in DB but not provisioned” behavior.
4. Rollout must allow safe validation in staging before production reset/reconnect begins.

## Product Requirements

### 1) Setup Scope
- Accept only subdomains such as `courses.example.com` or `www.example.com`.
- Reject apex domains such as `example.com`.
- Continue rejecting `*.classroomio.com` as a custom domain.

### 2) Reconnect Requirement
- Existing organizations with `customDomain` set under the old system must not be treated as automatically healthy.
- The product should clearly indicate that custom domains must be reconnected through the new Cloudflare flow.
- A one-time reset/backfill step may mark existing domains as unverified or reconnect-required.

### 3) Backend-Owned Orchestration
The system should move from this sequence:
1. dashboard updates organization record
2. dashboard calls domain provider API

To this sequence:
1. dashboard submits desired domain
2. backend validates and provisions the domain
3. backend updates organization state
4. backend returns DNS instructions and status

### 4) DNS Instruction Model
The API should return a product-owned response shape, for example:
- `status`
- `verified`
- `hostname`
- `dnsRecords[]`
- `message`
- `reconnectRequired`

The dashboard must not hardcode provider DNS values.

### 5) Verification Model
The system should support a refresh/check action that re-queries current provider state and updates organization verification status.

Minimum statuses:
- `pending_dns`
- `pending_verification`
- `verified`
- `error`

### 6) Remove Domain
Removing a domain should:
1. remove or deactivate provider-side setup where applicable
2. clear organization `customDomain`
3. clear verification state

## UX Requirements
1. The settings page must clearly tell admins that only subdomains are supported.
2. Existing domains that need reconnection must show a clear callout instead of silently appearing valid.
3. DNS records must be copyable from the UI.
4. Status badges and refresh actions must remain available after setup begins.
5. User-facing copy must move through dashboard translations and not be hardcoded in component markup.

## Technical Approach

### Recommended Direction
Use a Cloudflare-backed service layer for custom-domain operations and expose a provider-neutral API contract to the dashboard.

### Backend Changes
1. Replace Vercel-specific service functions in `apps/api/src/services/org/domain.ts`.
2. Refactor `apps/api/src/routes/domain/domain.ts` so route responses are normalized around ClassroomIO product states, not Vercel response shapes.
3. Move organization-state persistence into backend orchestration rather than split frontend/backend sequencing.
4. Add any required Cloudflare env configuration in API config.

### Dashboard Changes
1. Update `apps/dashboard/src/lib/features/settings/pages/domains.svelte` to consume normalized API responses.
2. Remove hardcoded Vercel DNS values.
3. Replace any Vercel-specific types in `apps/dashboard/src/lib/utils/types/org.ts`.
4. Remove or refactor Vercel-specific helpers in `apps/dashboard/src/lib/utils/services/org/domain.ts`.
5. Keep request typing in feature `utils/types.ts` consistent with existing dashboard conventions.

### Runtime Changes
1. Keep `apps/dashboard/src/lib/features/app/layout-setup.ts` as the primary host-to-org resolver.
2. Verify that custom domains routed through the new provider path still preserve host-based organization lookup.
3. No large routing-model rewrite is expected in this project.

## Current State Audit

| Area | Current State | Gap | Priority |
| --- | --- | --- | --- |
| API domain setup | Vercel-specific proxy route | Needs Cloudflare-backed product contract | P0 |
| Backend orchestration | Frontend updates org, then provisions domain | Partial-state risk | P0 |
| Dashboard DNS instructions | Hardcoded Vercel CNAME target | Must become API-driven | P0 |
| Verification states | Basic pending/verified only | Needs richer reconnect/pending/error model | P0 |
| Existing domain rollout | Assumes current domain remains valid | Need reset + reconnect plan | P0 |
| Runtime org lookup | Already supports verified custom domains | Needs validation only, not redesign | P1 |
| Docs | External custom domains marked “coming soon” | Needs correction | P1 |

## Implementation Plan

### Phase 1: API Contract + Cloudflare Service
1. Replace Vercel-specific service implementation in `apps/api/src/services/org/domain.ts`.
2. Redesign `POST /domain` response shape to be provider-neutral.
3. Implement backend orchestration so setup and persistence happen together.
4. Add backend validation to enforce subdomain-only custom domains.

### Phase 2: Dashboard Reconnect UX
1. Update the domains settings page to render DNS instructions from API responses.
2. Add reconnect-required state for existing domains.
3. Update remove and refresh flows to use the new backend contract.
4. Remove Vercel-specific helper/types that no longer apply.

### Phase 3: Existing Domain Reset
1. Identify organizations with existing `customDomain` values.
2. Decide reset behavior:
- mark all as unverified
- add reconnect-required marker in UI
- optionally notify admins out-of-band
3. Validate that old Vercel-managed domains no longer appear healthy in the product by default.

### Phase 4: Docs + Rollout
1. Update docs to describe the Cloudflare-backed custom-domain flow.
2. Align in-app copy with product behavior.
3. Test in staging with at least one reconnect scenario and one fresh setup scenario.
4. Roll out production reset/reconnect.

## Required File Touchpoints

### Core API
- `apps/api/src/routes/domain/domain.ts`
- `apps/api/src/services/org/domain.ts`
- `apps/api/src/config/env.ts` or related provider config files
- `apps/api/src/services/organization.ts` if orchestration is moved into org service layer

### Dashboard
- `apps/dashboard/src/lib/features/settings/pages/domains.svelte`
- `apps/dashboard/src/lib/features/org/api/org.svelte.ts`
- `apps/dashboard/src/lib/features/org/utils/types.ts`
- `apps/dashboard/src/lib/utils/functions/domain.ts`
- `apps/dashboard/src/lib/utils/services/org/domain.ts`
- `apps/dashboard/src/lib/utils/types/org.ts`
- `apps/dashboard/src/lib/utils/translations/en.json`

### Runtime Validation
- `apps/dashboard/src/lib/features/app/layout-setup.ts`
- `apps/dashboard/src/lib/features/org/api/org.server.ts`

### Docs
- `apps/docs/content/docs/how-to-guides/customize-organization.mdx`

## Rollout Plan
1. Build the Cloudflare-backed flow behind a feature flag if needed.
2. Validate fresh setup and reconnect flows in staging.
3. Reset existing production custom domains into reconnect-required state.
4. Publish updated docs and product copy.
5. Ask affected organizations to reconnect their domains.
6. Remove stale Vercel-specific setup code after production rollout stabilizes.

## Testing Strategy

### Unit Tests
1. Domain input normalization and subdomain validation.
2. Backend mapping from provider responses to product statuses.
3. Reconnect-required state handling.

### Integration Tests
1. Add domain returns DNS instructions and a pending status.
2. Refresh/verify updates `isCustomDomainVerified` when provider verification succeeds.
3. Remove domain clears organization state correctly.
4. Verified custom domain still resolves organization context via host-based lookup.

### Manual Verification
1. Fresh org connects a new subdomain successfully.
2. Existing org with previously configured domain is shown reconnect-required state.
3. DNS instructions shown in UI match backend response.
4. Verified domain loads the correct organization site.
5. Removing the domain clears status and UI state cleanly.

## Acceptance Criteria
1. The system no longer depends on Vercel project-domain APIs for custom-domain setup.
2. Only subdomains are accepted for custom domains.
3. The dashboard no longer hardcodes `cname.vercel-dns.com`.
4. Existing domains can be explicitly reset into a reconnect-required flow.
5. Verified custom domains continue to resolve to the correct organization site.
6. Docs and in-app copy accurately describe the supported custom-domain flow.

## Risks and Mitigations

| Risk | Impact | Mitigation |
| --- | --- | --- |
| Backend/provider mismatch causes false verification state | Broken domain UX | Normalize provider states and add integration coverage |
| Existing domains appear valid after rollout even though reconnect is required | Admin confusion and broken trust | Reset state explicitly and surface reconnect-required UI |
| Host forwarding differs from current assumptions | Verified domains fail to resolve org context | Validate host preservation in staging before rollout |
| Frontend/backend sequencing remains split | Partial failures persist | Move orchestration into backend before release |
| Docs lag behind rollout | Support burden | Update docs in same release |

## Open Questions
1. Do we need a new persisted field for reconnect-required, or is resetting `isCustomDomainVerified=false` with derived UI state sufficient?
2. Should production rollout notify affected organizations by email, in-app banner, or both?
3. Do we want to keep the existing `/domain` endpoint shape and only change payloads, or introduce a clearer route contract now?
