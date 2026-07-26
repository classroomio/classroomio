# Forms Product Implementation Plan

## Scope Lock

1. Forms is a new top-level product domain and must not be implemented by repurposing course exercise routes or submission entities directly.
2. Shared question rendering and answer modeling must be reused from `@cio/question-types` and `@cio/ui/custom/exercise-question`.
3. Exercise behavior must remain backward compatible throughout delivery.
4. MVP includes public forms and authenticated organization forms.
5. Invite-only / explicitly targeted forms are phase 2, not MVP.
6. MVP includes draft, published, closed, and archived lifecycle states.
7. MVP includes response inbox, per-question aggregates, and CSV export.
8. MVP excludes grading, points, reviewer workflow, and correctness semantics.
9. MVP may ship with form-specific question tables rather than a generalized cross-product questionnaire schema.
10. Public forms must ship with abuse controls before general rollout.
11. Binding is attachment-level: `form_attachment` binds a reusable form to a context (course, lesson, landing page, checkout) and holds lifecycle/limit/dedup settings; responses record their attachment.
12. MVP includes the purchase-request pipeline (default org form replacing `payment-modal.svelte`, pending → approve → enroll) and per-lesson pulse feedback.
13. MVP is one-page presentation only; respondent save-and-resume (FORM-B6) and edit-submitted-response are deferred to phase 2. Author-side DRAFT → PUBLISHED lifecycle stays.
14. Commercial model is free-standalone / paid-integrations: free orgs get unlimited forms with share-link collection, inbox, analytics, and export; attachments, triggers, and consequences (approve→enroll, lesson pulse, landing-page blocks) require a paid plan. Checkout exception: the default purchase-request form collects on free; one-click approve→enroll is paid. Self-hosted ungated.
15. Form creation and response access are restricted to org admins and teachers; students can only respond.

## Delivery Phases

1. Phase A: Shared foundations and schema.
2. Phase B: API validation, services, and public/internal response flow.
3. Phase C: Dashboard builder and management UI.
4. Phase D: Response inbox, analytics, and export.
5. Phase E: Hardening, abuse controls, rollout, and follow-up platform extraction.

## Ticket Breakdown

| ID | Phase | Area | Task | Key Files | Depends On | Done When |
| --- | --- | --- | --- | --- | --- | --- |
| FORM-A1 | A | Shared Contracts | Audit `@cio/question-types` and `@cio/ui/custom/exercise-question` for exercise-only assumptions and document the locked reusable surface | `packages/question-types/*`, `packages/ui/src/custom/exercise-question/*`, `prd/forms-product/README.md` | None | Reuse boundaries are explicit and no hidden coupling remains undiscovered |
| FORM-A2 | A | Shared Labels | Extend shared render contracts so host apps can inject forms-specific labels and submit copy without introducing hardcoded strings | `packages/question-types/src/exercise-types.ts`, `packages/question-types/src/render-contract.ts`, `packages/question-types/src/index.ts` | FORM-A1 | Forms runner can use shared components with product-appropriate copy |
| FORM-A3 | A | DB Schema | Add `form` table with lifecycle, access, response settings, timing, slug, and org ownership | `packages/db/src/schema.ts` | None | Schema compiles and form entity supports draft/publish/close flows |
| FORM-A4 | A | DB Schema | Add `formQuestion` and `formQuestionOption` tables aligned to shared question contracts | `packages/db/src/schema.ts` | FORM-A3 | Form questions/options persist independently of exercises |
| FORM-A5 | A | DB Schema | Add `formResponse` and `formResponseAnswer` tables for respondent identity and answer storage | `packages/db/src/schema.ts` | FORM-A3, FORM-A4 | Responses can be stored without grading or groupmember coupling |
| FORM-A6 | A | DB Relations/Types | Add DB relations and exported inferred types for forms entities | `packages/db/src/relations.ts`, `packages/db/src/types.ts` | FORM-A3, FORM-A4, FORM-A5 | Query layer can consume typed forms entities cleanly |
| FORM-A7 | A | DB Migration | Generate migration SQL and metadata for all new forms tables and constraints | `packages/db/src/migrations/*` | FORM-A3, FORM-A4, FORM-A5 | Migration applies cleanly against local DB |
| FORM-A8 | A | Validation | Add form CRUD schemas, publish/close schemas, public response schemas, and response query schemas | `packages/utils/src/validation/form/form.ts`, `packages/utils/src/validation/form/index.ts` | FORM-A3, FORM-A4, FORM-A5 | API can validate form authoring and response payloads consistently |
| FORM-A9 | A | Query Layer | Add CRUD queries for forms, form questions/options, and response storage/read paths | `packages/db/src/queries/form/*` | FORM-A6 | Query layer supports form create/read/update/publish/respond flows |
| FORM-B1 | B | API Errors | Add forms-specific error codes for unavailable form, closed form, invalid responder, response limit reached, and duplicate response | `apps/api/src/utils/errors.ts` | None | Forms routes can return precise failure codes |
| FORM-B2 | B | API Service | Add org-side forms service for create, get, list, update, duplicate, archive, publish, and close | `apps/api/src/services/form/form.ts`, `apps/api/src/services/form/index.ts` | FORM-A8, FORM-A9 | Admin lifecycle actions work through a single service layer |
| FORM-B3 | B | API Service | Add public/internal form runner service to resolve form by slug and compute access rules | `apps/api/src/services/form/runner.ts` | FORM-A8, FORM-A9 | Public and authenticated forms load through one normalized response model |
| FORM-B4 | B | API Service | Add response submission service with typed answer serialization using shared question contracts | `apps/api/src/services/form/response.ts` | FORM-A8, FORM-A9 | Shared renderer payloads can be submitted and persisted end-to-end |
| FORM-B5 | B | API Service | Implement one-response-per-user/email and response-limit enforcement | `apps/api/src/services/form/response.ts` | FORM-B4 | Duplicate/over-limit submissions are blocked server-side |
| FORM-B6 | B | API Service | Add authenticated draft save/resume support only if retained in MVP; otherwise defer and mark explicitly | `apps/api/src/services/form/response.ts`, `apps/api/src/services/form/runner.ts` | FORM-B4 | Scope decision is resolved and API shape is stable |
| FORM-B7 | B | API Routes | Add organization management routes for forms CRUD and lifecycle actions | `apps/api/src/routes/organization/form.ts`, route exports, `apps/api/src/app.ts` | FORM-B2 | Org admins can manage forms over typed RPC routes |
| FORM-B8 | B | API Routes | Add public routes for `GET /forms/:slug` and `POST /forms/:slug/respond` | `apps/api/src/routes/public/form.ts`, `apps/api/src/app.ts` | FORM-B3, FORM-B4, FORM-B5 | Public runner is reachable without course context |
| FORM-B9 | B | API Routes | Add org response routes for list/detail/export preparation | `apps/api/src/routes/organization/form.ts` | FORM-B2, FORM-B4 | Dashboard can load responses and analytics data |
| FORM-B10 | B | File Upload | Reuse upload answer payload model for forms file upload and add size/type restrictions by access mode | `apps/api/src/services/form/response.ts`, shared upload helpers, form routes | FORM-B4 | File-upload questions work safely for forms |
| FORM-C1 | C | Dashboard Types | Add forms feature request/response types inferred from API contracts | `apps/dashboard/src/lib/features/forms/utils/types.ts` | FORM-B7, FORM-B8, FORM-B9 | Dashboard code uses inferred API types only |
| FORM-C2 | C | Dashboard API | Add forms API classes for management, runner, and responses | `apps/dashboard/src/lib/features/forms/api/*.svelte.ts`, `.server.ts` where needed | FORM-C1 | Components can call form APIs through feature-local classes |
| FORM-C3 | C | Navigation | Add forms entry point and routing in dashboard navigation | `apps/dashboard/src/lib/features/ui/navigation/*`, new routes under `apps/dashboard/src/routes/forms/*` | FORM-C2 | Admin can discover and enter forms product from dashboard |
| FORM-C4 | C | Builder State | Create forms builder store/state using shared question contracts without course/exercise dependencies | `apps/dashboard/src/lib/features/forms/store/*`, util files | FORM-C2 | Builder state supports question add/edit/reorder/preview |
| FORM-C5 | C | Builder UI | Build forms editor page reusing shared question renderer/edit mode patterns | `apps/dashboard/src/lib/features/forms/components/builder/*`, routes | FORM-C4 | Admin can author a form end-to-end |
| FORM-C6 | C | Settings UI | Build form settings panel for lifecycle, access mode, identity collection, limits, and success screen copy | `apps/dashboard/src/lib/features/forms/components/settings/*` | FORM-C5 | Admin can configure MVP settings without raw JSON |
| FORM-C7 | C | Public Runner UI | Build form runner page for public and authenticated response flows using shared question renderer in `take` mode | `apps/dashboard/src/routes/forms/respond/[slug]/+page.svelte` or public site equivalent, feature components | FORM-C2, FORM-B8 | Respondents can complete and submit forms |
| FORM-C8 | C | Preview UI | Add builder preview mode matching shared runner behavior | `apps/dashboard/src/lib/features/forms/components/preview/*` | FORM-C5, FORM-C7 | Admin preview matches live runner closely |
| FORM-C9 | C | Templates UI | Add starter templates for feedback, review, enrollment, intake, RSVP, and staff request | `apps/dashboard/src/lib/features/forms/components/templates/*`, template seed/query source as needed | FORM-C5 | Admin can create common forms quickly |
| FORM-C10 | C | Translations | Add forms translation keys and remove hardcoded UI copy from forms feature | `apps/dashboard/src/lib/utils/translations/en.json` and peer locales as needed | FORM-C5, FORM-C6, FORM-C7 | Forms UI follows translation conventions |
| FORM-D1 | D | Response Inbox | Build responses list with filters, counts, completion metadata, and detail drill-in | `apps/dashboard/src/lib/features/forms/components/responses/*`, routes | FORM-B9, FORM-C2 | Admin can inspect submissions without export |
| FORM-D2 | D | Response Detail | Build single-response review view using shared question replay patterns | `apps/dashboard/src/lib/features/forms/components/responses/response-detail.svelte` | FORM-D1 | Admin can inspect each answer question-by-question |
| FORM-D3 | D | Analytics | Build per-question aggregate analytics using submission summary/chart patterns already used in exercises | `apps/dashboard/src/lib/features/forms/components/analytics/*` | FORM-D1 | Admin can see distribution charts and basic trends |
| FORM-D4 | D | Export | Implement CSV export service and dashboard trigger | `apps/api/src/services/form/export.ts`, form routes, dashboard responses UI | FORM-B9, FORM-D1 | Export produces one row per response with respondent metadata and question columns |
| FORM-D5 | D | Permissions | Ensure only authorized org users can view responses and exports | forms services/routes, auth middleware wiring | FORM-B7, FORM-B9 | Response data is not exposed to unauthorized users |
| FORM-E1 | E | Abuse Controls | Add rate limiting and bot protection for public response endpoints | public form routes, middleware/config | FORM-B8 | Public forms are protected against basic spam/abuse |
| FORM-E2 | E | Monitoring | Add logging and monitoring hooks for submit failures, file-upload abuse, and export usage | forms services/routes | FORM-B8, FORM-D4, FORM-E1 | Operational visibility exists before rollout |
| FORM-E3 | E | QA/Tests | Add validation, query, API, and dashboard tests for form create/publish/respond/export flows | tests across `packages/utils`, `packages/db`, `apps/api`, `apps/dashboard` | FORM-D4 | Core flows have regression coverage |
| FORM-E4 | E | Rollout | Add feature flag, rollout checklist, and production enablement notes | forms config/docs, PRD references | FORM-E1, FORM-E2, FORM-E3 | Safe staged rollout is documented and executable |
| FORM-E5 | E | Follow-up Platforming | Evaluate whether to generalize forms/exercises into a shared questionnaire persistence layer after MVP stability | follow-up PRD/docs | FORM-E4 | Decision is made with real usage data instead of pre-optimizing |
| FORM-F1 | A | DB Schema | Add `formAttachment` table (context type, course/lesson refs, lifecycle window, response limit, dedup flag) and `formResponse.formAttachmentId` + `approvedForDisplay` | `packages/db/src/schema.ts`, relations/types | FORM-A3, FORM-A5 | Reusable forms can bind to contexts and responses resolve to their attachment |
| FORM-F2 | B | API Service | Attachment CRUD + response filtering by attachment/context; library view aggregates across attachments | `apps/api/src/services/form/attachment.ts`, form routes | FORM-F1, FORM-B2 | Course context shows only its responses; library shows per-context breakdown |
| FORM-F3 | C | Attach Picker | "Attach a form" picker component with inline create-in-context (builder in modal/drawer, template pre-seeded by context) | `apps/dashboard/src/lib/features/forms/components/attach-picker/*`, course/lesson settings surfaces | FORM-C5, FORM-F2 | Admin can attach or create+attach a form without leaving the course |
| FORM-F4 | B/C | Purchase Pipeline | Seed default "Course purchase request" form per org; checkout attachment on paid courses; submit stores PENDING response then redirects to `paymentLink`; preserve teacher/student emails | seed logic, `apps/api/src/services/form/purchase.ts`, org-site course routes | FORM-F2 | Buy click leads to the org form and a stored purchase request; legacy `payment-modal.svelte` retired |
| FORM-F5 | C/D | Approve → Enroll | Response inbox actions for purchase requests: approve (enrolls student), reject with reason | forms inbox components, enrollment service wiring | FORM-F4, FORM-D1 | Admin approval enrolls the student without leaving the inbox |
| FORM-F6 | C | Lesson Pulse | Per-lesson pulse feedback attachment shown after lesson completion, with per-lesson aggregate view for instructors | lesson completion surface, `apps/dashboard/src/lib/features/forms/components/analytics/*` | FORM-F2, FORM-D3 | Instructor sees pulse results grouped by lesson |
| FORM-F7 | C | Landing Page Blocks | Landing-page form section block and approved-reviews display block (consent checkbox + `approvedForDisplay` curation) | `packages/ui` landing themes, org landing-page editor | FORM-F2, FORM-C7 | Org can embed a form and display curated reviews on its public site |
| FORM-F8 | E | Plan Gating | Gate the integration layer (attachment creation, approve→enroll, lesson pulse, landing-page blocks) behind paid plans; standalone forms stay ungated and unlimited; default checkout form collects on free with approve→enroll gated; self-hosted ungated | plan config, form/attachment services, dashboard upsell states | FORM-B2, FORM-F2, FORM-F4 | Free orgs can collect without limits; every integration touchpoint shows a paid upsell instead of failing silently |
| FORM-F9 | B/C | Permissions | Restrict form creation, editing, response viewing, and export to org ADMIN and TUTOR roles across routes and dashboard nav; students only respond | forms routes middleware, dashboard nav/route guards | FORM-B7, FORM-C3 | Student accounts cannot reach form authoring or response data |

## Route Targets

### Organization Management Routes

1. `GET /organization/:orgId/forms`
2. `POST /organization/:orgId/forms`
3. `GET /organization/:orgId/forms/:formId`
4. `PUT /organization/:orgId/forms/:formId`
5. `POST /organization/:orgId/forms/:formId/publish`
6. `POST /organization/:orgId/forms/:formId/close`
7. `GET /organization/:orgId/forms/:formId/responses`
8. `GET /organization/:orgId/forms/:formId/responses/:responseId`
9. `GET /organization/:orgId/forms/:formId/export`

### Public / Runner Routes

1. `GET /forms/:slug`
2. `POST /forms/:slug/respond`

### Optional Authenticated Draft Routes

Only if MVP keeps save/resume:

1. `POST /forms/:slug/draft`
2. `PUT /forms/:slug/draft/:draftId`

## Acceptance Criteria by Phase

### Phase A

1. New forms schema exists without altering exercise semantics.
2. Shared question/render contracts are usable by forms without hardcoded exercise wording.
3. Query layer can create and read forms, questions, and responses independently from courses.
4. Build passes for `@cio/db`, `@cio/utils`, and `@cio/question-types`.

### Phase B

1. Org admins can create, update, publish, close, and fetch forms through API routes.
2. Public and authenticated forms can be loaded by slug without course membership.
3. Response submission persists typed answers and enforces lifecycle and limit rules.
4. File upload questions work with safe restrictions.

### Phase C

1. Dashboard has a discoverable Forms area.
2. Admin can author a form, configure settings, preview it, and publish it.
3. Respondent-facing runner works for public and authenticated forms.
4. No hardcoded user-facing copy is introduced in dashboard forms UI.

### Phase D

1. Admin can list responses, open a single response, and inspect answers.
2. Admin can see basic aggregate analytics for supported structured question types.
3. CSV export includes response metadata and one column per question.

### Phase E

1. Public endpoints have rate limiting and bot mitigation.
2. Submit, export, and failure paths are monitored.
3. Automated tests cover create/publish/respond/export paths.
4. Rollout can be staged safely behind a feature flag.

## Verification Commands

1. `pnpm --filter @cio/question-types build`
2. `pnpm --filter @cio/db build`
3. `pnpm --filter @cio/utils build`
4. `pnpm --filter @cio/api build`
5. `pnpm --filter @cio/dashboard build`
6. Run targeted tests for forms validation, API routes, and dashboard feature flows.

## Suggested First Sprint Slice

1. `FORM-A1` to `FORM-A9`, `FORM-F1`
2. `FORM-B1` to `FORM-B5`, `FORM-F2`
3. `FORM-B7`, `FORM-B8`
4. `FORM-C1`, `FORM-C2`

This gets the core platform decision made early, lands the schema/query/API foundation, and proves the highest-risk assumption: that the shared question engine can power a new standalone product without breaking exercises.

## Suggested Second Sprint Slice

1. `FORM-C3` to `FORM-C8`
2. `FORM-D1`, `FORM-D2`
3. `FORM-E1`
4. `FORM-F3` to `FORM-F5`

This delivers an MVP loop: create form, publish form, submit response, inspect response, and keep public endpoints safe enough for controlled rollout — plus the flagship integration demo: attach a form from a course, and buy a paid course through the purchase-request pipeline with approve → enroll.

## Post-MVP Follow-Up Candidates

1. Invite-only / explicitly targeted forms.
2. Save and resume drafts if not shipped in MVP.
3. Edit submitted response.
4. Multi-section/page builder if one-page MVP ships first.
5. Shared questionnaire persistence model for exercises and forms.
