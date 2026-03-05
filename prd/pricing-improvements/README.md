# Pricing Improvements PRD

## Status
- Draft

## Date
- February 17, 2026

## Purpose
Define a single, extensible pricing framework for ClassroomIO so current and future features can be clearly assigned to `BASIC`, `EARLY_ADOPTER`, or `ENTERPRISE` plans.

## Problem Statement
Plan definitions currently exist in multiple places (marketing plan copy, app UI gates, and plan constants). Some gates are only `free vs paid`, while product pricing has three tiers. We need one source of truth for feature entitlements so we can add features later without ambiguity.

## Goals
1. Keep one canonical plan-to-feature matrix for product and engineering.
2. Reflect the current in-app pricing behavior.
3. Add a future-feature allocation table so new capabilities can be assigned to plans consistently.
4. Explicitly classify Enterprise-only features (including SSO).

## Non-Goals
- Rebuilding billing provider integrations in this phase.
- Redesigning public pricing page copy in this phase.
- Shipping all entitlement backend checks in one release.

## Confirmed Decisions
1. Plan model remains `BASIC`, `EARLY_ADOPTER`, `ENTERPRISE`.
2. SSO is an Enterprise-only feature.
3. For assessment roadmap: code execution is out of scope.
4. For assessment roadmap: file upload limits are `2MB` (Basic/Free) and `10MB` (Paid plans).

## Data Sources Checked
- `packages/utils/src/plans/data.json`
- `packages/utils/src/plans/constants.ts`
- `apps/website/src/routes/pricing/+page.svelte`
- `apps/dashboard/src/lib/utils/store/org.ts`
- `apps/dashboard/src/lib/features/settings/pages/teams.svelte`
- `apps/dashboard/src/lib/features/settings/pages/domains.svelte`
- `apps/dashboard/src/lib/features/course/components/lesson/video/upload-video.svelte`
- `apps/dashboard/src/lib/features/course/components/lesson/document/add-document-modal.svelte`
- `apps/dashboard/src/lib/features/course/components/ceritficate/design.svelte`
- `apps/dashboard/src/lib/features/course/pages/settings.svelte`
- `apps/dashboard/src/lib/features/course/components/people/share-qr-image.svelte`
- `apps/dashboard/src/lib/features/ui/upgrade-powered-by.svelte`
- `apps/dashboard/src/lib/features/audience/pages/audience.svelte`
- `apps/dashboard/src/routes/org/[slug]/audience/+page.svelte`
- `prd/enterprise-sso/README.md`

## Plan Definitions in App

| Plan Key | Display Name | Pricing Source |
| --- | --- | --- |
| `BASIC` | Free / Basic | `packages/utils/src/plans/data.json` |
| `EARLY_ADOPTER` | Early Adopters | `packages/utils/src/plans/data.json` |
| `ENTERPRISE` | Enterprise | `packages/utils/src/plans/data.json` |

## Current In-App Entitlement Behavior

| Capability | BASIC | EARLY_ADOPTER | ENTERPRISE | Status |
| --- | --- | --- | --- | --- |
| Audience capacity | 20 | 10,000 | Unlimited | Live (`currentOrgMaxAudience`) |
| Team member invite/remove | No | Yes | Yes | Live (gated by `isFreePlan`) |
| Lesson video upload tab | No | Yes | Yes | Live (gated by `isFreePlan`) |
| Lesson document upload | No | Yes | Yes | Live (gated by `isFreePlan`) |
| Certificate customization | No | Yes | Yes | Live (gated by `isFreePlan`) |
| Lesson download toggle | No | Yes | Yes | Live (gated by `isFreePlan`) |
| Course download action | No | Yes | Yes | Live (gated by `isFreePlan`) |
| Powered-by branding visibility | Required | Hidden | Hidden | Live (free-only rendering) |
| QR invite ClassroomIO branding | Required | Hidden | Hidden | Live (free-only rendering) |
| Custom domain management | No | Yes (current UI behavior) | Yes | Live (currently `isFreePlan` gate) |

## Enterprise-Only Features

| Feature | BASIC | EARLY_ADOPTER | ENTERPRISE | Status |
| --- | --- | --- | --- | --- |
| SSO (SAML/OIDC) | No | No | Yes | Planned (`prd/enterprise-sso/README.md`) |
| SCIM lifecycle provisioning | No | No | Yes | Planned (phase after SSO) |

## Future Feature Allocation Backlog

| Feature Candidate | BASIC | EARLY_ADOPTER | ENTERPRISE | Status | Notes |
| --- | --- | --- | --- | --- | --- |
| Advanced assessment types (matching, ordering, audio/video, hotspot) | No | Yes | Yes | Proposed | From exercise question-types roadmap |
| Assessment file upload limit | 2MB | 10MB | 10MB | Proposed | Applies to assignment/test file submissions |
| Advanced assessment analytics (item analysis) | No | Yes | Yes | Proposed | Basic keeps completion + score only |
| Exercise-level resubmission controls | Yes | Yes | Yes | Proposed | Policy is by exercise, not by question type |

## Gaps To Fix (Pricing Improvements)
1. Move from broad `isFreePlan` checks to explicit feature entitlements per plan.
2. Align in-app enforcement with published plan matrix where they differ.
3. Add backend entitlement checks for all gated actions (not UI-only checks).
4. Add a central entitlement API used by dashboard and API services.

## Functional Requirements
1. Create a canonical entitlement registry keyed by plan and feature code.
2. Add `entitlement` checks in backend routes/services for gated actions.
3. Keep frontend checks for UX, but backend remains source of truth.
4. Return clear upgrade-required errors with plan context.
5. Preserve behavior for existing orgs during rollout.

## Rollout Plan
1. Phase 1: Normalize feature registry and map all current gates.
2. Phase 2: Add backend enforcement for current gated features.
3. Phase 3: Introduce new feature allocations (assessment roadmap, SSO gating, future additions).

## Success Metrics
- 0 critical mismatches between pricing page promises and app enforcement.
- Reduction in support tickets about "why this feature is locked/unlocked".
- Faster launch cycle for pricing new features (single matrix update + entitlement key).

## Open Questions
- Should custom domain remain available to all paid plans or become Enterprise-only in enforcement?
- Which future features should be `EARLY_ADOPTER+` versus strictly `ENTERPRISE`?
- Do we need plan-level audit reporting for entitlement failures?
