# Onboarding AI Website Bootstrap PRD

## Status
- Draft

## Date
- February 19, 2026

## Purpose
Redesign onboarding so a new creator can paste their website URL, get two AI-generated starter courses about their product, and have organization branding/personalization applied automatically.

## Problem Statement
Current onboarding collects profile + org metadata, then lands users in an empty workspace. New users still need to:
- manually define course structure
- manually pick brand/theme settings
- manually decide first setup actions

This creates a high time-to-first-value and lower activation for creators who already have product content on their website.

## ICP (Primary)
1. SaaS founders who want to launch an academy for their product.
2. Businesses that want to help customers understand and adopt their offering.
3. Operational teams in hospitals, hotels, and restaurants that need internal compliance training for staff.

## Target Jobs-To-Be-Done
1. Turn existing website/product content into structured training quickly.
2. Launch a branded learning experience without manual setup from scratch.
3. Deliver onboarding, enablement, and compliance training with minimal content ops overhead.

## Persona-Specific Onboarding Paths (v1)

### Path A: SaaS Academy
Default generated course pair:
1. `Product Foundations` (core concepts, setup, first value)
2. `Advanced Workflows by Role` (admin/user role playbooks + best practices)

Default suggestions:
- Add role-based tags (`admin`, `manager`, `end-user`)
- Add “Getting Started” landing-page CTA
- Invite internal CS/support as tutors

### Path B: Customer Enablement
Default generated course pair:
1. `Customer Onboarding Essentials` (what to do in week 1)
2. `Value Expansion and Advanced Features` (adoption and retention playbooks)

Default suggestions:
- Add “New Customer” and “Power User” tracks
- Add recommended completion timeline
- Enable course update/newsfeed cadence for release education

### Path C: Compliance Training (Hospital / Hotel / Restaurant)
Default generated course pair:
1. `Mandatory Compliance Fundamentals` (policy, safety, conduct)
2. `Role-Based SOP and Incident Handling` (scenario-based operational compliance)

Default suggestions:
- Mark courses as compliance-required (draft policy metadata for v1)
- Enable completion/certificate checklist prompts
- Recommend recurring review cadence (for example quarterly refresher)

## Goals
1. Capture a website URL during onboarding and extract product + brand context.
2. Generate exactly two starter courses during onboarding.
3. Personalize the workspace by setting org theme color from detected brand color.
4. Suggest/apply light or dark appearance preference for the onboarding user.
5. Suggest additional setup actions based on extracted context and land users in a ready-to-edit org.

## Non-Goals (v1)
- Fully autonomous publishing (courses remain draft/unpublished).
- Deep multi-domain crawling or full docs migration.
- Perfect brand identity replication.
- Replacing long-form course import providers (Teachable/Thinkific/SCORM/CSV).

## Confirmed Product Decisions
1. Onboarding asks for the user website.
2. AI generates two courses as part of onboarding.
3. Theme personalization is included (dark/light + auto-picked org color).
4. Onboarding should include additional setup suggestions beyond courses and color.

## Data Sources Checked
- `apps/dashboard/src/routes/(auth)/onboarding/+page.svelte`
- `apps/dashboard/src/lib/features/onboarding/api/onboarding.svelte.ts`
- `apps/dashboard/src/lib/features/onboarding/utils/constants.ts`
- `apps/api/src/routes/onboarding/onboarding.ts`
- `apps/api/src/services/onboarding.ts`
- `packages/utils/src/validation/onboarding/onboarding.ts`
- `apps/dashboard/src/lib/features/settings/pages/org.svelte`
- `apps/dashboard/src/lib/utils/functions/theme.ts`
- `apps/dashboard/src/lib/features/ui/sidebar/footer/theme-toggle.svelte`
- `apps/api/src/routes/organization/organization.ts`
- `packages/utils/src/validation/organization/organization.ts`
- `packages/db/src/schema.ts`
- `apps/api/src/routes/course/course.ts`
- `apps/api/src/services/course/course.ts`
- `prd/course-import/implementation-plan.md`

## Current Baseline (As-Is)
1. Onboarding is a 2-step flow (step 1: fullname + orgName + siteName, step 2: goal + source + locale).
2. No course creation happens during onboarding.
3. Org theme supports named values and custom hex (`organization.theme`), and can be updated today.
4. Dark/light mode is currently user preference in local UI mode state, not part of onboarding data.

## Proposed Onboarding V2 Experience

### Step 1: Account + Org Basics
Collect or confirm:
- fullname
- organization name
- siteName
- locale

### Step 2: Website Input
Collect:
- primary website URL (required)
- optional product page/docs URL override
- optional target audience prompt (for better AI output)
- optional onboarding path selector (`saas_academy`, `customer_enablement`, `compliance_training`)

### Step 3: AI Analysis
System runs async website analysis:
- crawl same-domain pages (bounded depth/page limit)
- extract product summary, ICP hints, feature areas
- detect brand assets (logo/favicon/theme color)
- infer recommended onboarding path if user did not explicitly choose one

### Step 4: Course Blueprint Review
Show two generated course blueprints:
1. Course A: Product Fundamentals
2. Course B: Advanced Use Cases / Role-based Workflows

Each course includes:
- title
- description
- default section
- 4-6 lesson outlines
- 1 starter exercise draft

User actions:
- edit titles/descriptions
- regenerate one course or both
- remove/add lesson outline items
- switch onboarding path template and re-generate course pair

### Step 5: Personalization Review
Show and allow override:
- detected primary brand color (mapped to `organization.theme`)
- appearance preference (`light`, `dark`, or `system`)
- detected logo/avatar suggestion

Also show onboarding suggestions:
- suggested landing page headline/subheadline
- suggested course tags
- suggested first invite actions (team members, first students)

### Step 6: Apply + Finish
On confirm:
- create org (if not already created in flow)
- persist theme and optional avatar
- create the two draft courses with starter content
- store onboarding metadata and suggestions
- redirect to org dashboard with a “generated setup” success state

## Functional Requirements

### FR-1 Website Analysis Input
- Validate and normalize URL.
- Restrict crawling to HTTP/HTTPS and public domains only.
- Protect against SSRF/local-network targets.
- Enforce crawl limits (page count, timeout, response size).

### FR-2 Brand Extraction
- Derive brand color with fallback priority:
1. explicit CSS/theme token
2. `<meta name="theme-color">`
3. dominant logo/favicon color
4. fallback (`blue`)
- Validate color contrast; if unsafe, auto-adjust and flag it in preview.

### FR-3 AI Course Blueprint Generation
- Generate exactly two course blueprints.
- Return structured output only (schema-validated JSON).
- Include source traceability (which pages influenced which course sections).
- Mark all generated courses as draft/unpublished.

### FR-4 Human-in-the-loop Review
- Users must approve before final apply.
- Users can regenerate and edit blueprint fields in onboarding UI.
- “Skip AI” path should remain available and continue with basic onboarding.

### FR-5 Persisted Personalization
- Set `organization.theme` to selected/detected theme value.
- Save appearance preference for current user (proposed `profile.metadata.appearanceMode`).
- Apply appearance and theme immediately in client after onboarding completion.

### FR-6 Starter Course Creation
- Use existing course service layer to create course shells.
- Create default section + lessons + exercise stubs through current services/routes.
- Keep generation idempotent for retries (no duplicate courses on accidental resubmit).

### FR-7 Setup Suggestions
Post-onboarding suggestions should include:
- publish checklist for generated courses
- customization recommendations (logo, landing page, custom domain)
- invitation recommendations (team setup + learner onboarding)

### FR-8 Observability + Analytics
- Track funnel events: `onboarding_v2_started`, `website_analysis_completed`, `blueprint_regenerated`,
  `onboarding_v2_applied`, `onboarding_v2_skipped_ai`.
- Track time-to-first-course-created and time-to-first-publish.

### FR-9 Persona Routing Rules
- Respect explicit user-selected onboarding path over inferred path.
- If no explicit path is selected, infer path from website analysis with confidence score.
- If inference confidence is low, default to `customer_enablement` and ask user to confirm.
- Store chosen path in onboarding metadata for post-onboarding recommendations.

## Proposed API + Service Design

### Validation (`packages/utils/src/validation/onboarding/`)
- `ZOnboardingBootstrapStart`
- `ZOnboardingBootstrapStatusParam`
- `ZOnboardingBootstrapApply`
- `ZOnboardingBootstrapRegenerateCourse`

### Routes (`apps/api/src/routes/onboarding/`)
- `POST /onboarding/bootstrap/start`
- `GET /onboarding/bootstrap/:jobId`
- `POST /onboarding/bootstrap/:jobId/regenerate-course`
- `POST /onboarding/bootstrap/:jobId/apply`

### Services (`apps/api/src/services/`)
- `onboarding-bootstrap.ts` for create/run bootstrap jobs, website extraction orchestration, AI blueprint generation,
  and apply workflow (org theme + course creation + metadata persistence).

### Dashboard (`apps/dashboard/src/lib/features/onboarding/`)
- add onboarding v2 API class + step components
- show async analysis status and blueprint review UI
- call apply endpoint and handle redirect

## Data Model Changes (Proposed)

### New Table: `onboarding_bootstrap_job`
Fields:
- `id`
- `profileId`
- `organizationId` (nullable until org exists)
- `websiteUrl`
- `status` (`PENDING` | `RUNNING` | `COMPLETED` | `FAILED` | `CANCELED`)
- `progressPercent`
- `stage`
- `extraction` (jsonb)
- `blueprint` (jsonb)
- `suggestions` (jsonb)
- `error` (jsonb)
- timestamps

### Profile metadata extension
- `profile.metadata.onboarding.appearanceMode`
- `profile.metadata.onboarding.websiteUrl`
- `profile.metadata.onboarding.bootstrapJobId`

## Security and Quality Constraints
1. No crawling of private IP ranges or localhost targets.
2. Strip scripts and unsafe HTML before sending page content to LLM.
3. Limit token/page budgets to protect cost.
4. Do not auto-publish generated courses.
5. Preserve source links for user trust and editability.

## Rollout Plan
1. Phase 1: Internal alpha behind feature flag (`onboarding_v2_ai_bootstrap`).
2. Phase 2: 10-20% cloud rollout for new signups.
3. Phase 3: Default onboarding for cloud; legacy flow remains fallback.
4. Phase 4: Evaluate self-hosted behavior (likely disabled by default unless keys configured).

## Success Metrics
1. +25% improvement in onboarding completion rate.
2. +40% improvement in “first course created within first session”.
3. Median onboarding time under 8 minutes.
4. >60% of onboarding_v2 users keep at least one generated course.
5. <5% failure rate for website analysis jobs.

## Risks and Mitigations
1. Risk: hallucinated or low-quality course outlines. Mitigation: strict JSON schema + source-backed generation + review step.
2. Risk: wrong brand color extraction. Mitigation: preview + manual override + contrast guard.
3. Risk: long-running or stuck jobs. Mitigation: async job model with stage/progress, retries, and cancellation.
4. Risk: duplicate course creation on retries. Mitigation: idempotency keys and apply-step deduplication.

## Open Questions
1. Should “Apply” immediately create both courses, or should users choose one/both?
2. What is the default lesson/exercise depth per generated course for v1?
3. Should appearance preference remain user-only or introduce org-level default appearance?
4. Should self-hosted instances get this flow if they provide their own LLM key?
5. Which model/provider should power generation in v1 and what is per-user cost budget?
