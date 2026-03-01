# Exercise Question Types Expansion - Implementation Plan

## Scope Lock (v1)

1. Keep legacy `RADIO`, `CHECKBOX`, `TEXTAREA` behavior backward compatible.
2. Deliver P0 question types first: `TRUE_FALSE`, `SHORT_ANSWER`, `NUMERIC`, `FILL_BLANK`, `FILE_UPLOAD`.
3. Manual grading is required when exercise includes `SHORT_ANSWER` or `TEXTAREA`.
4. Attempt rules are exercise-level: `maxAttempts`, `attemptScoringRule` (`highest`, `latest`, `average`).
5. Correct-answer visibility is exercise-level policy.
6. File upload is one file per question in v1.
7. Upload limits are plan based: free `2MB`, paid `10MB`.
8. Use one canonical question-type registry to remove scattered hardcoded numeric IDs.
9. Existing submissions continue to read from `answers[]` and `openAnswer` during migration.
10. New type-rich answers write to `question_answer.payload`.
11. DB update policy for this plan: apply DB changes only in `packages/db/src/schema.ts`; do not generate new files in `packages/db/src/migrations`.
12. Question-type registry/contracts/state/serialization logic must live in `@cio/question-types`; `@cio/ui` must stay components-only.
13. Shared packages must be app-agnostic (no dashboard-local imports), so other apps can build exercise/form products from the same package APIs.
14. Exercise-level `auto-grade` toggle can be enabled only when all active questions are auto-gradable; if not, it stays disabled with a hint message.
15. Grading engine remains in `apps/api` as backend source of truth and is locked behind API contracts; no standalone grading package is introduced.
16. Submission grading workflow truth uses explicit `submission.gradingState` and `submission.overallStatus`; legacy `submission.statusId` is retained as board compatibility projection only.
17. Initial grading state on student submit is always `queued`.
18. Server-owned grading transitions are: `queued -> processing -> completed`, `queued -> processing -> awaiting_manual -> completed`, and `queued -> processing -> failed -> queued` (retry path).
19. `overallStatus` classification values are `auto_graded`, `manual_required`, and `hybrid`, computed deterministically from attempt snapshot and question capabilities.
20. Client routes do not directly own grading workflow transitions; API/service layer validates and applies allowed transitions.
21. Renderer filenames must not repeat mode suffix; canonical naming is `renderers/{question-type}/{mode}.svelte` (for example `renderers/true-false/edit.svelte`, not `true-false-edit.svelte`).
22. `@cio/ui/custom/exercise-question` must not contain hardcoded user-facing English strings (labels, helper text, placeholders, tooltips, validation messages, sr-only text); host app provides copy through render contracts/props.

## Delivery Phases

1. Phase A: Foundation (schema, seeds, shared registry, validation contracts)
2. Phase B: API + grading + submission state engine for P0
3. Phase C: Dashboard authoring/taking/grading UX for P0
4. Phase D: P1 types (`MATCHING`, `ORDERING`)
5. Phase E: P2 type (`HOTSPOT`)
6. Phase F: Regression hardening, rollout, and monitoring

## Shared Package File Contract (Cross-App Reuse)

These files are required deliverables so any app in the monorepo can consume shared packages and build a standalone exercise/forms product.

### `@cio/question-types` package files

1. `packages/question-types/src/question-type-keys.ts`
2. `packages/question-types/src/question-type-types.ts`
3. `packages/question-types/src/question-type-registry.ts`
4. `packages/question-types/src/question-type-lookup.ts`
5. `packages/question-types/src/question-type-capabilities.ts`
6. `packages/question-types/src/question-answer-payload.ts`
7. `packages/question-types/src/question-scoring-rules.ts`
8. `packages/question-types/src/exercise-types.ts`
9. `packages/question-types/src/render-contract.ts`
10. `packages/question-types/src/form-state.ts`
11. `packages/question-types/src/answer-serializer.ts`
12. `packages/question-types/src/renderer-registry.ts`
13. `packages/question-types/src/index.ts`
14. `packages/question-types/package.json` (package name: `@cio/question-types`)

### `@cio/ui` shared exercise-question component files (core)

1. `packages/ui/src/custom/exercise-question/question-form-root.svelte`
2. `packages/ui/src/custom/exercise-question/question-navigation.svelte`
3. `packages/ui/src/custom/exercise-question/question-renderer.svelte`
4. `packages/ui/src/custom/exercise-question/question-list.svelte`
5. `packages/ui/src/custom/exercise-question/renderer-contract.ts`
6. `packages/ui/src/custom/exercise-question/index.ts`
7. `packages/ui/src/index.ts` (exports `./custom/exercise-question`)

### `@cio/ui` P0 renderer files

1. `packages/ui/src/custom/exercise-question/renderers/radio/edit.svelte`
2. `packages/ui/src/custom/exercise-question/renderers/checkbox/edit.svelte`
3. `packages/ui/src/custom/exercise-question/renderers/textarea/edit.svelte`
4. `packages/ui/src/custom/exercise-question/renderers/radio/take.svelte`
5. `packages/ui/src/custom/exercise-question/renderers/checkbox/take.svelte`
6. `packages/ui/src/custom/exercise-question/renderers/textarea/take.svelte`
7. `packages/ui/src/custom/exercise-question/renderers/radio/preview.svelte`
8. `packages/ui/src/custom/exercise-question/renderers/checkbox/preview.svelte`
9. `packages/ui/src/custom/exercise-question/renderers/textarea/preview.svelte`
10. `packages/ui/src/custom/exercise-question/renderers/true-false/edit.svelte`
11. `packages/ui/src/custom/exercise-question/renderers/short-answer/edit.svelte`
12. `packages/ui/src/custom/exercise-question/renderers/numeric/edit.svelte`
13. `packages/ui/src/custom/exercise-question/renderers/fill-blank/edit.svelte`
14. `packages/ui/src/custom/exercise-question/renderers/file-upload/edit.svelte`
15. `packages/ui/src/custom/exercise-question/renderers/true-false/take.svelte`
16. `packages/ui/src/custom/exercise-question/renderers/short-answer/take.svelte`
17. `packages/ui/src/custom/exercise-question/renderers/numeric/take.svelte`
18. `packages/ui/src/custom/exercise-question/renderers/fill-blank/take.svelte`
19. `packages/ui/src/custom/exercise-question/renderers/file-upload/take.svelte`
20. `packages/ui/src/custom/exercise-question/renderers/true-false/preview.svelte`
21. `packages/ui/src/custom/exercise-question/renderers/short-answer/preview.svelte`
22. `packages/ui/src/custom/exercise-question/renderers/numeric/preview.svelte`
23. `packages/ui/src/custom/exercise-question/renderers/fill-blank/preview.svelte`
24. `packages/ui/src/custom/exercise-question/renderers/file-upload/preview.svelte`

### `@cio/ui` P1/P2 renderer files (created when phase starts)

1. `packages/ui/src/custom/exercise-question/renderers/matching/edit.svelte`
2. `packages/ui/src/custom/exercise-question/renderers/matching/take.svelte`
3. `packages/ui/src/custom/exercise-question/renderers/matching/preview.svelte`
4. `packages/ui/src/custom/exercise-question/renderers/ordering/edit.svelte`
5. `packages/ui/src/custom/exercise-question/renderers/ordering/take.svelte`
6. `packages/ui/src/custom/exercise-question/renderers/ordering/preview.svelte`
7. `packages/ui/src/custom/exercise-question/renderers/hotspot/edit.svelte`
8. `packages/ui/src/custom/exercise-question/renderers/hotspot/take.svelte`
9. `packages/ui/src/custom/exercise-question/renderers/hotspot/preview.svelte`

### Renderer Filename Convention (Locked)

1. Question type is expressed by folder: `renderers/{question-type}/`.
2. Mode is expressed only by filename: `edit.svelte`, `take.svelte`, `preview.svelte`.
3. Do not use mode-first folders (`renderers/edit/*`) or redundant suffixes like `-edit`, `-take`, or `-preview`.

### UI Copy Ownership (Locked)

1. Shared UI renderers are copyless primitives and must not embed end-user copy.
2. All labels/help/error/tooltip/placeholder/sr-only text must be provided by host app (dashboard) via typed contract props.
3. Translation key resolution stays in host apps (`apps/dashboard`), not in `packages/ui`.
4. Renderer utilities in `packages/ui` must not generate user-facing fallback words (for example `Step`); fallback semantics must come from host-provided copy.

## Ticket Breakdown

| ID | Phase | Area | Task | Key Files | Dependencies | Done When |
| --- | --- | --- | --- | --- | --- | --- |
| EX-A1 | A | DB Schema | Add new columns for `exercise`, `question`, `question_answer`, `submission` (attempt controls, settings, payload, grading metadata including workflow/classification fields) in schema only | `packages/db/src/schema.ts` | None | Schema changes compile via package builds and no new migration files are generated |
| EX-A2 | A | DB Seed | Extend `question_type` seed with new typenames/labels | `packages/db/src/utils/seed/questionType.ts` | EX-A1 | Re-seeding inserts missing types idempotently |
| EX-A3 | A | Shared Registry | Create canonical question type registry and metadata in dedicated package (`@cio/question-types`) | `packages/question-types/src/question-type-keys.ts`, `packages/question-types/src/question-type-types.ts`, `packages/question-types/src/question-type-registry.ts`, `packages/question-types/src/question-type-lookup.ts`, `packages/question-types/src/question-type-capabilities.ts`, `packages/question-types/src/question-answer-payload.ts`, `packages/question-types/src/question-scoring-rules.ts`, `packages/question-types/src/exercise-types.ts`, `packages/question-types/src/render-contract.ts`, `packages/question-types/src/form-state.ts`, `packages/question-types/src/answer-serializer.ts`, `packages/question-types/src/renderer-registry.ts`, `packages/question-types/src/index.ts`, `packages/question-types/package.json` | EX-A2 | API and dashboard consume one source of truth for type keys/traits and all shared registry files exist |
| EX-A4 | A | Validation | Replace fragile numeric-only assumptions with registry-backed schemas and enums | `packages/utils/src/validation/constants.ts`, `packages/utils/src/validation/exercise/exercise.ts` | EX-A3 | Validation accepts legacy + new types and rejects invalid per-type payloads |
| EX-A5 | A | DB Queries | Add read/write support for new columns and typed answer payload in query layer | `packages/db/src/queries/exercise/exercise.ts`, `packages/db/src/queries/submission/*` | EX-A1 | Query methods persist and return settings/payload/attempt fields |
| EX-A6 | A | Clone Safety | Fix clone question type mismatch (`TEXTAREA` id bug) using shared constant/typename | `apps/api/src/services/course/clone.ts` | EX-A3 | Exercise clone preserves paragraph questions and options correctly |
| EX-A7 | A | Shared Copy Contract | Add typed i18n/copy contract for exercise-question renderer labels and messages in shared question-types package | `packages/question-types/src/render-contract.ts`, `packages/question-types/src/exercise-types.ts`, `packages/question-types/src/index.ts`, `packages/question-types/src/renderer-registry.ts` | EX-A3 | Host apps can pass a strongly typed labels object that covers shared renderer copy needs |
| EX-B1 | B | API Validation | Split exercise schemas into base + per-type authoring/submission schemas | `packages/utils/src/validation/exercise/*` | EX-A4 | Route-level validation is discriminated by question type |
| EX-B2 | B | Exercise Service | Support create/update with `question.settings`, `scoringMode`, `manualGradingRequired`, and exercise attempt settings | `apps/api/src/services/exercise/exercise.ts`, `apps/api/src/services/exercise/utils.ts` | EX-A5, EX-B1 | Create/update persists all new fields and returns normalized exercise DTO |
| EX-B3 | B | Submission Service | Accept typed answers into `question_answer.payload` while preserving legacy fallback fields | `apps/api/src/services/submission/submission.ts` | EX-A5, EX-B1 | Submission creation supports mixed legacy/new question payloads |
| EX-B4 | B | Grading Engine | Implement auto-grading for P0 objective types (`TRUE_FALSE`, `NUMERIC`, `FILL_BLANK`) | `apps/api/src/services/submission/submission.ts`, `apps/api/src/services/exercise/utils.ts` | EX-B3 | Auto-grade computed at question level with configurable scoring mode |
| EX-B5 | B | Attempt Rules | Enforce `maxAttempts` and compute final score by `attemptScoringRule` | `apps/api/src/services/submission/submission.ts`, `packages/db/src/queries/submission/*` | EX-B3 | New attempts blocked when limit reached; final score follows configured rule |
| EX-B6 | B | Upload Handling | Add file-upload answer flow with allowed type/size validation and asset reference storage | `apps/api/src/routes/course/exercise.ts`, `apps/api/src/services/submission/submission.ts` | EX-B3 | Invalid upload types/sizes rejected; valid uploads linked in answer payload |
| EX-B7 | B | Routes | Update exercise and submission routes for new request/response contracts | `apps/api/src/routes/course/exercise.ts`, `apps/api/src/routes/course/submission.ts` | EX-B2, EX-B3 | RPC contract supports new fields without breaking legacy clients |
| EX-B8 | B | Manual Grading | Route mixed/manual exercises to manual grading path and allow override of auto score | `apps/api/src/services/submission/submission.ts`, `apps/api/src/services/mark/gradebook.ts` | EX-B4 | Teacher can override and persist final grade on submission |
| EX-B9 | B | Auto-Grade Guardrail | Enforce exercise-level `auto-grade` eligibility in API/service layer using question-type capability checks | `apps/api/src/services/exercise/exercise.ts`, `apps/api/src/services/submission/submission.ts`, `packages/question-types/src/question-type-capabilities.ts` | EX-A3, EX-B2 | API rejects `auto-grade=true` when any active question type requires manual grading |
| EX-B10 | B | Submission Workflow | Implement API-owned grading state machine and deterministic `overallStatus` computation on submission lifecycle | `packages/db/src/schema.ts`, `packages/utils/src/validation/submission/submission.ts`, `packages/db/src/queries/submission/submission.ts`, `apps/api/src/services/submission/submission.ts`, `apps/api/src/routes/course/submission.ts` | EX-A1, EX-B3, EX-B4, EX-B8 | Submit starts `queued`, transitions are validated server-side, and invalid direct state jumps are rejected |
| EX-B11 | B | Board Compatibility | Preserve existing 3 board columns by projecting workflow state to legacy `statusId` (`1=Submitted`, `2=In Progress`, `3=Graded`) in API responses | `apps/api/src/services/submission/submission.ts`, `apps/api/src/routes/course/submission.ts`, `packages/db/src/queries/submission/submission.ts` | EX-B10 | Submission board endpoints continue returning stable `statusId` while grading truth lives in workflow/classification fields |
| EX-C1 | C | Dashboard Types | Add request/response/data types for new exercise payloads in feature types | `apps/dashboard/src/lib/features/course/utils/types.ts` | EX-B7 | Frontend types inferred from API contract only |
| EX-C2 | C | Dashboard API | Update exercise API class to validate/send new create/update/submit payload shapes | `apps/dashboard/src/lib/features/course/api/exercise.svelte.ts` | EX-C1 | Create/update/submit flows pass new schema checks client-side |
| EX-C3 | C | Renderer Registry | Implement registry logic in `@cio/question-types` and wire dashboard to map question-type keys to shared `@cio/ui` renderer components | `packages/question-types/src/renderer-registry.ts`, `packages/question-types/src/exercise-types.ts`, `packages/question-types/src/index.ts`, `packages/ui/src/custom/exercise-question/index.ts`, `packages/ui/src/index.ts`, `apps/dashboard/src/lib/features/course/components/exercise/edit-mode.svelte`, `apps/dashboard/src/lib/features/course/components/exercise/view-mode.svelte` | EX-A3 | No hardcoded `if RADIO/CHECKBOX/TEXTAREA` branching remains; registry/contracts come from `@cio/question-types` and components from `@cio/ui` |
| EX-C4 | C | Edit UX | Refactor authoring UI to use registry and per-type settings editors | `apps/dashboard/src/lib/features/course/components/exercise/edit-mode.svelte` | EX-C3, EX-C2 | Instructor can configure P0 types and per-type settings in one flow |
| EX-C5 | C | Take UX | Refactor learner view to use registry and typed answer serializers | `apps/dashboard/src/lib/features/course/components/exercise/view-mode.svelte`, `apps/dashboard/src/lib/features/course/components/exercise/functions.ts` | EX-C3, EX-C2 | Student can answer mixed-type exercises and submit valid payload |
| EX-C6 | C | Store | Update exercise store/autosave model for typed answers and migration-safe hydration | `apps/dashboard/src/lib/features/course/components/exercise/store.ts` | EX-C5 | Autosave/restore works for legacy and new type payloads |
| EX-C7 | C | P0 Components | Add new UI question components (`true-false`, `short-answer`, `numeric`, `fill-blank`, `file-upload`) in shared UI package | `packages/ui/src/custom/exercise-question/renderers/true-false/edit.svelte`, `packages/ui/src/custom/exercise-question/renderers/short-answer/edit.svelte`, `packages/ui/src/custom/exercise-question/renderers/numeric/edit.svelte`, `packages/ui/src/custom/exercise-question/renderers/fill-blank/edit.svelte`, `packages/ui/src/custom/exercise-question/renderers/file-upload/edit.svelte`, `packages/ui/src/custom/exercise-question/renderers/true-false/take.svelte`, `packages/ui/src/custom/exercise-question/renderers/short-answer/take.svelte`, `packages/ui/src/custom/exercise-question/renderers/numeric/take.svelte`, `packages/ui/src/custom/exercise-question/renderers/fill-blank/take.svelte`, `packages/ui/src/custom/exercise-question/renderers/file-upload/take.svelte`, `packages/ui/src/custom/exercise-question/renderers/true-false/preview.svelte`, `packages/ui/src/custom/exercise-question/renderers/short-answer/preview.svelte`, `packages/ui/src/custom/exercise-question/renderers/numeric/preview.svelte`, `packages/ui/src/custom/exercise-question/renderers/fill-blank/preview.svelte`, `packages/ui/src/custom/exercise-question/renderers/file-upload/preview.svelte`, `packages/ui/src/custom/exercise-question/index.ts`, `packages/ui/src/index.ts` | EX-C3 | Edit/view/preview components exist for all P0 types and are exported from `@cio/ui` |
| EX-C8 | C | Grading UI | Update submission/grading views to display typed answers from payload | `apps/dashboard/src/lib/features/course/components/exercise/submissions/*` | EX-B8, EX-C5 | Teacher can review and grade all P0 answer shapes |
| EX-C9 | C | i18n | Add translation keys for new types/settings/status copy | `apps/dashboard/src/lib/utils/translations/en.json` | EX-C4, EX-C5 | No new hardcoded user-facing text |
| EX-C10 | C | Accessibility | Validate keyboard navigation and mobile rendering for new question interactions in shared UI component package | `packages/ui/src/custom/exercise-question/*` | EX-C7 | P0 UI passes accessibility checks and mobile smoke tests |
| EX-C11 | C | Edit UX Guardrail | Add exercise-level `auto-grade` toggle, disable state, and hint copy when question mix includes manual-only types | `apps/dashboard/src/lib/features/course/components/exercise/edit-mode.svelte`, `apps/dashboard/src/lib/features/course/components/exercise/question-type-utils.ts`, `apps/dashboard/src/lib/utils/translations/en.json` | EX-C3, EX-B9 | Toggle enables only when all active question types are auto-gradable; hint appears under toggle when blocked |
| EX-C12 | C | Submission Board UX | Consume API workflow data while keeping 3-column board UX, and surface failed/manual-needed hints under In Progress column | `apps/dashboard/src/lib/features/course/pages/submissions.svelte`, `apps/dashboard/src/lib/features/course/components/exercise/mark-exercise-modal.svelte`, `apps/dashboard/src/lib/features/course/utils/types.ts`, `apps/dashboard/src/lib/features/course/api/submission.svelte.ts`, `apps/dashboard/src/lib/utils/translations/en.json` | EX-B10, EX-B11 | Board still behaves as `1/2/3` columns, with additional workflow clarity from API-provided grading fields |
| EX-C13 | C | Renderer Structure Refactor | Refactor shared renderer files to question-type folders with mode file names and update imports/registry/storybook references | `packages/ui/src/custom/exercise-question/renderers/*/edit.svelte`, `packages/ui/src/custom/exercise-question/renderers/*/take.svelte`, `packages/ui/src/custom/exercise-question/renderers/*/preview.svelte`, `packages/ui/src/custom/exercise-question/index.ts`, `packages/question-types/src/renderer-registry.ts`, `packages/storybook/src/molecules/exercise-question/*`, `apps/dashboard/src/lib/features/course/components/exercise/*` | EX-C3, EX-C7 | Renderer paths use `renderers/{question-type}/{mode}.svelte`; no mode-first folders or mode-suffixed filenames remain |
| EX-C14 | C | Copy Externalization | Remove hardcoded user-facing copy from shared question renderer files and wire host-provided labels from dashboard translations | `packages/ui/src/custom/exercise-question/question-renderer.svelte`, `packages/ui/src/custom/exercise-question/question-navigation.svelte`, `packages/ui/src/custom/exercise-question/renderers/*/edit.svelte`, `packages/ui/src/custom/exercise-question/renderers/*/take.svelte`, `packages/ui/src/custom/exercise-question/renderers/*/preview.svelte`, `packages/ui/src/custom/exercise-question/renderers/ordering-utils.ts`, `apps/dashboard/src/lib/features/course/components/exercise/edit-mode.svelte`, `apps/dashboard/src/lib/features/course/components/exercise/view-mode.svelte`, `apps/dashboard/src/lib/features/course/utils/types.ts`, `apps/dashboard/src/lib/utils/translations/en.json`, `packages/storybook/src/molecules/exercise-question/*` | EX-A7, EX-C3 | Shared renderer package has no hardcoded end-user copy; dashboard injects all labels/messages from translation keys through typed contracts |
| EX-D1 | D | Matching Type | Implement `MATCHING` schema, authoring/taking UI in shared UI component package, serializer, and grader | validation, API service, `packages/ui/src/custom/exercise-question/renderers/matching/edit.svelte`, `packages/ui/src/custom/exercise-question/renderers/matching/take.svelte`, `packages/ui/src/custom/exercise-question/renderers/matching/preview.svelte` | EX-C7, EX-B4 | Matching questions can be authored, submitted, and auto-graded |
| EX-D2 | D | Ordering Type | Implement `ORDERING` schema, drag-sort UI in shared UI component package, serializer, and grader | validation, API service, `packages/ui/src/custom/exercise-question/renderers/ordering/edit.svelte`, `packages/ui/src/custom/exercise-question/renderers/ordering/take.svelte`, `packages/ui/src/custom/exercise-question/renderers/ordering/preview.svelte` | EX-C7, EX-B4 | Ordering questions can be authored, submitted, and auto-graded |
| EX-D3 | D | Partial Credit | Add partial-credit policy controls and explainability in grading details | `apps/api/src/services/submission/submission.ts`, submissions UI | EX-D1, EX-D2 | Teacher sees per-question partial-credit breakdown |
| EX-E1 | E | Hotspot Type | Implement `HOTSPOT` schema, image coordinate payload, authoring/taking UI in shared UI component package, grader | validation, API service, `packages/ui/src/custom/exercise-question/renderers/hotspot/edit.svelte`, `packages/ui/src/custom/exercise-question/renderers/hotspot/take.svelte`, `packages/ui/src/custom/exercise-question/renderers/hotspot/preview.svelte` | EX-C7 | Hotspot is fully supported end-to-end |
| EX-E2 | E | Hotspot Hardening | Improve responsive/touch behavior and precision tolerances for hotspot grading | hotspot UI + grading utilities | EX-E1 | Hotspot works reliably on mobile/tablet and desktop |
| EX-F1 | F | API Tests | Add create/update/submit tests per type, attempt rules, manual/auto grading paths | `apps/api/tests/*`, `packages/utils/src/validation/*` | EX-B8, EX-D3, EX-E1 | Core API behavior covered with passing tests |
| EX-F2 | F | Dashboard Tests | Add component/store/integration tests for authoring, taking, autosave, submission payloads across dashboard integration and shared UI component package | `apps/dashboard/src/lib/features/course/components/exercise/*`, `packages/ui/src/custom/exercise-question/*` | EX-C10, EX-D2, EX-E2 | UI and store behavior stable for legacy + new types |
| EX-F3 | F | Regression | Add clone and backward-compat regression tests for legacy question data | API/services/db test files | EX-A6, EX-F1 | Existing exercises run unchanged after rollout |
| EX-F4 | F | Rollout | Ship rollout checklist, migration runbook, and monitoring for submission/grading errors | `prd/exercise-question-types/README.md`, ops docs/config | EX-F1, EX-F2, EX-F3 | Controlled release enabled with rollback steps documented |

## Acceptance Criteria by Phase

### Phase A
1. Schema changes are limited to `packages/db/src/schema.ts` and no migration files are generated.
2. `question_type` seed is idempotent and includes all planned typenames.
3. Shared registry is imported by both API and dashboard.
4. Clone service no longer depends on mismatched hardcoded paragraph ID.
5. Shared renderer copy-contract types are defined in `@cio/question-types` and exported for host apps.

### Phase B
1. Exercise create/update APIs accept and return new settings fields.
2. Submission API accepts typed payloads and still reads legacy answer shape.
3. Attempt limits and scoring rules are enforced server-side.
4. File-upload answer validations enforce plan limits and allowed types.
5. API/service layer blocks exercise-level `auto-grade` when question mix includes any manual-only type.
6. Student submit always creates submission with workflow state `queued` and board-compatible `statusId=1`.
7. API enforces valid grading transitions only (`queued -> processing -> ...`), with retry path (`failed -> queued`), and rejects invalid direct client transitions.
8. `overallStatus` is computed deterministically as `auto_graded`, `manual_required`, or `hybrid`.
9. API projects workflow states to board `statusId` mapping (`queued=1`, `processing|awaiting_manual|failed=2`, `completed=3`).

### Phase C
1. Authoring and learner UIs support all P0 types.
2. Renderer registry removes hardcoded question-type branching in core screens.
3. Dashboard consumes registry/contracts from `@cio/question-types` and renderer components from `@cio/ui`, not dashboard-local question renderer files.
4. Grading UI can render typed payloads for teacher review.
5. No hardcoded UI copy is introduced.
6. Shared package files listed in `Shared Package File Contract` are implemented and exported.
7. Exercise-level `auto-grade` toggle is disabled with a clear hint when question mix is not fully auto-gradable.
8. Submission board continues to use 3 columns from backend-projected `statusId`, while exposing workflow hints (`failed`, `awaiting_manual`) without changing board IA.
9. Renderer files/imports follow canonical type-first paths: `renderers/{question-type}/{mode}.svelte`.
10. `@cio/ui/custom/exercise-question` does not contain hardcoded end-user copy; dashboard passes translated labels/messages via typed render contracts.

### Phase D
1. Matching and ordering are fully authorable/submittable/gradable.
2. Partial-credit configuration and score explanation are visible to instructors.

### Phase E
1. Hotspot works with responsive image rendering and touch input.
2. Hotspot grading handles coordinate tolerances consistently.

### Phase F
1. Regression tests cover legacy three types and mixed-type exercises.
2. Rollout checklist includes migration, monitoring, and rollback steps.

## Verification Commands

1. `pnpm --filter @cio/db build`
2. `pnpm --filter @cio/utils build`
3. `pnpm --filter @cio/api build`
4. `pnpm --filter @cio/dashboard build`

## Suggested First Sprint Slice

1. EX-A1 to EX-A7 (schema, seed, registry, validation foundation, clone fix, shared copy contract)
2. EX-B1 to EX-B5 + EX-B10 + EX-B11 (P0 API contracts, typed submission, attempt/scoring enforcement, workflow state machine, board projection compatibility)
3. EX-C1 to EX-C6 + EX-C14 (frontend types/API + renderer registry + core edit/view/store refactor + shared copy externalization)

This slice establishes the core contracts and de-risks the hardest migration paths before adding all P0 components and grading UI polish.

## Implementation Progress (Updated Feb 26, 2026)

Completed ticket IDs:

1. `EX-A3` Shared question-type package (`@cio/question-types`) with registry/contracts/helpers.
2. `EX-A6` Clone safety bug fix using shared question type IDs.
3. `EX-A7` Shared copy contract typing for renderer labels/messages (`ExerciseQuestionLabels`) in `@cio/question-types`.
4. `EX-C3` Dashboard/UI renderer registry centralization (`@cio/question-types` contracts + `@cio/ui` components).
5. `EX-C7` Shared `@cio/ui/custom/exercise-question` renderer component set delivered (includes P0 and additional renderer files used by current branch).
6. `EX-C13` Renderer structure refactor completed with canonical type-first paths (`renderers/{question-type}/{mode}.svelte`) and updated imports/exports/storybook wiring.
7. `EX-C14` Shared renderer copy externalization completed; dashboard now injects labels/messages from translations through typed contracts.

In-progress ticket IDs:

1. `EX-A4` Validation migration is partial (constants wired to shared IDs; full per-type schema split still pending).
2. `EX-C4` Authoring UX refactor is mostly done, but exercise-level grading controls/guards are not complete.
3. `EX-C5` Learner UX refactor is active; answer submission/grading remains mixed legacy behavior.
4. `EX-B10` Submission workflow state machine has been started (schema fields + transition validation + API projection wiring); lifecycle hardening and tests remain.
5. `EX-B11` Board compatibility projection has been started (workflow-to-legacy `statusId` projection in submission service); endpoint/test hardening remains.
6. `EX-C12` Dashboard board workflow hint wiring has been started (workflow hints + guarded transitions in board UI); full UX/polish and edge-case handling remain.
7. `EX-D1`, `EX-D2`, `EX-E1` UI renderers exist, but full API validation/submission/grader paths are not complete.
