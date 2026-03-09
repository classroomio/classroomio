# Exercise Question Types Expansion PRD

## Status

- In progress

## Date

- February 24, 2026

## Implementation Plan

- See [implementation-plan.md](./implementation-plan.md) for ticket breakdown and delivery sequencing.

## Purpose

Expand ClassroomIO exercise questions beyond `single answer`, `multiple answers`, and `paragraph`, so instructors can run stronger assessments, reduce manual grading where possible, and collect richer assignment submissions inside the LMS.

## Problem Statement

Current exercise functionality is constrained by three legacy question types and a grading/answer model tuned for those types. This creates four product issues:

1. Limited assessment design for instructors.
2. Lower auto-grading coverage.
3. Weak first-class support for assignment-style submissions.
4. Increased instructor grading overhead and external-tool leakage.

## Current-State Audit

| Area | Current State | Gaps |
| --- | --- | --- |
| Question types | `RADIO`, `CHECKBOX`, `TEXTAREA` only | No true/false, numeric, fill-blank, matching, ordering, file-upload, hotspot |
| DB `question_type` | Seeded from `packages/db/src/utils/seed/questionType.ts` | Typename coverage too narrow |
| Validation constants | `QUESTION_TYPE` in `packages/utils/src/validation/constants.ts` contains only 3 numeric IDs | Hardcoded numeric assumptions are fragile as type set grows |
| Exercise validation | `packages/utils/src/validation/exercise/exercise.ts` has option rules for radio/checkbox + textarea | No schema-per-type authoring or submission validation |
| Exercise authoring UI | `edit-mode.svelte` renders only radio, checkbox, textarea | No renderer registry or extensibility contract |
| Exercise taking UI | `view-mode.svelte` answer flow assumes options or open text | No type-specific interaction patterns for new formats |
| Submission model | `question_answer` stores `answers[]` + `open_answer` | No structured payload for richer responses (fill blanks, ordering, matching, uploads) |
| Attempt controls | No max-attempt rule or attempt scoring strategy on `exercise` | Cannot configure highest/latest/average grading behavior |
| Test controls | No persisted timer/randomization/availability settings on exercise | Missing in-schema support for test-mode controls |
| File response support | No exercise-question-level upload config | Cannot do per-question file constraints |

## Data Sources Checked

- `packages/db/src/schema.ts`
- `packages/db/src/utils/seed/questionType.ts`
- `packages/db/src/queries/exercise/exercise.ts`
- `packages/utils/src/validation/constants.ts`
- `packages/utils/src/validation/exercise/exercise.ts`
- `apps/api/src/routes/course/exercise.ts`
- `apps/api/src/services/exercise/exercise.ts`
- `apps/api/src/services/exercise/utils.ts`
- `apps/api/src/services/submission/submission.ts`
- `apps/api/src/services/course/clone.ts`
- `apps/dashboard/src/lib/features/ui/question/constants.ts`
- `apps/dashboard/src/lib/features/course/components/exercise/edit-mode.svelte`
- `apps/dashboard/src/lib/features/course/components/exercise/view-mode.svelte`
- `apps/dashboard/src/lib/features/course/components/exercise/functions.ts`
- `apps/dashboard/src/lib/features/course/components/exercise/store.ts`
- `apps/dashboard/src/lib/features/course/api/exercise.svelte.ts`

## Primary Users

- Instructors creating tests and assignments.
- Students answering exercises on desktop and mobile.
- Admins and tutors grading and reviewing progress.

## Goals

1. Support additional objective and subjective question types.
2. Increase auto-grading coverage for objective formats.
3. Add first-class assignment upload support at question level.
4. Keep authoring UX consistent across question types.
5. Add explicit exercise-level controls for attempts, scoring rule, answer reveal, and test behavior.

## Non-Goals (v1)

- Online proctoring.
- AI-generated grading feedback.
- Code execution/judging sandboxes.
- LTI/QTI export.
- Negative marking.
- Audio/video response question type.

## Confirmed Decisions

1. Code execution is out of scope.
2. Upload size limits are plan-based: Free `2MB`, Paid `10MB`.
3. Resubmission policy is exercise-level, not per question.
4. Rollout phases remain `P0`, `P1`, `P2`.
5. If an exercise contains `short answer` or `paragraph`, final grading is manual.
6. Numeric-answer grading mode is configurable.
7. Fill-in-the-blank does not support multiple accepted answers per blank in v1.
8. Partial credit is enabled by default where supported.
9. Partial credit settings are question-level with exercise-level override.
10. File upload configuration is per question.
11. Exercise settings include max attempts.
12. Correct-answer visibility is exercise-level configurable.
13. Test-only controls are in scope.
14. Allowed upload file types in v1: `PDF`, `DOCX`, `PPTX`, `XLSX`, `ZIP`, and images.
15. Attempt grading rule is exercise-level configurable: `highest`, `latest`, `average`.
16. Upload question accepts exactly one file in v1.

## Proposed Question Types

| Type | Auto-gradable | Partial Credit | Assignment Fit | Test Fit | Phase |
| --- | --- | --- | --- | --- | --- |
| True/False | Yes | No | Medium | High | P0 |
| Short Answer (single-line) | No | N/A | High | High | P0 |
| Numeric Answer | Yes | Optional | Medium | High | P0 |
| Fill in the Blank | Yes | Yes | Medium | High | P0 |
| File Upload | No | N/A | High | Low | P0 |
| Matching | Yes | Yes | Medium | High | P1 |
| Ordering/Sequence | Yes | Yes | Medium | High | P1 |
| Hotspot/Image Labeling | Yes | Optional | Medium | Medium | P2 |

## Functional Requirements

### Authoring

- Instructor can choose question type from a type picker.
- Instructor can configure:
  - prompt
  - points
  - required/optional
  - per-question instructions
  - type-specific settings
- Instructor can define answer key for auto-graded types.
- Instructor can configure scoring mode (`all_or_nothing` or `partial`) where supported.
- Instructor can preview question behavior before publish.

### Student Experience

- Students can answer all released types on desktop and mobile.
- Answers autosave while taking exercise.
- One exercise can contain mixed question types.
- File upload question enforces allowed MIME/extensions and plan-based limits.
- File upload question accepts one file in v1.

### Grading

- Objective types auto-grade immediately unless exercise is in manual-only mode.
- Manual types route to grading queue with teacher feedback.
- Instructors can override auto-graded scores.
- Gradebook stores per-question points and final exercise score.
- Exercise-level `auto-grade` toggle can only be enabled when all active question types are auto-gradable; otherwise it must be disabled with a hint message.

### Attempts and Test Controls

- Exercise-level settings:
  - `maxAttempts`
  - `attemptScoringRule` (`highest`, `latest`, `average`)
  - `showCorrectAnswers` policy
  - `timerSeconds` (optional)
  - `randomizeQuestionOrder`
  - `randomizeOptionOrder`
  - availability window (`availableFrom`, `availableTo`)

## Technical Design

### 1. Canonical Question Type Registry

Keep one canonical source for question type metadata used by API and dashboard.

Target package:

- `packages/question-types/src/` (new, published as `@cio/question-types`)

Registry includes:

- stable key (`TRUE_FALSE`, `SHORT_ANSWER`, etc.)
- DB typename
- DB id (resolved at startup/seed, not hardcoded in scattered files)
- auto-gradable flag
- partial-credit support
- submission payload schema key
- rollout phase

### 1.1 Canonical Renderer Components

Keep question renderer components in `@cio/ui` and keep all shared logic/contracts in `@cio/question-types`.

Target package:

- `packages/ui/src/custom/exercise-question/` (new)
- exports via `packages/ui/src/index.ts`

Rules:

- renderer registry/contracts live in `@cio/question-types`.
- answer serialization and shared form-state utilities live in `@cio/question-types`.
- render contract object lives in `@cio/question-types` (`ExerciseQuestionRenderContract` / `ExerciseQuestionListRenderContract`) and is deterministic for the same inputs.
- question type renderer components live in `@cio/ui/custom/exercise-question`.
- `@cio/ui/custom/exercise-question` is components-only and does not own shared exercise logic.
- dashboard screens consume type keys/contracts from `@cio/question-types` and renderers from `@cio/ui/custom/exercise-question`.

### 1.2 Cross-App File Contract

- The complete individual file list for reusable shared packages is defined in `implementation-plan.md` under `Shared Package File Contract (Cross-App Reuse)`.
- Shared package code must stay app-agnostic so any app can consume it to build an exercise/forms product.

### 2. Data Model Changes

#### `question` table

Add:

- `settings` (`jsonb`, default `{}`, not null)
- `scoring_mode` (`varchar`, default `all_or_nothing`)
- `manual_grading_required` (`boolean`, default `false`)

`settings` examples:

- numeric: `{ "mode": "exact" | "tolerance_abs" | "tolerance_pct", "tolerance": number }`
- upload: `{ "maxFiles": 1, "allowedTypes": [...], "maxSizeMb": 2|10 }`
- matching: `{ "shuffleLeft": true, "shuffleRight": true }`

#### `question_answer` table

Add:

- `payload` (`jsonb`, default `{}`, not null)

Keep existing `answers[]` and `open_answer` for backward compatibility during migration; new types write to `payload`.

#### `exercise` table

Add:

- `max_attempts` (`integer`, default `1`)
- `attempt_scoring_rule` (`varchar`, default `latest`)
- `show_correct_answers` (`varchar`, default `after_grading`)
- `timer_seconds` (`integer`, nullable)
- `randomize_question_order` (`boolean`, default `false`)
- `randomize_option_order` (`boolean`, default `false`)
- `available_from` (`timestamptz`, nullable)
- `available_to` (`timestamptz`, nullable)

#### `submission` table

Add:

- `attempt_number` (`integer`, default `1`)
- `finalized_score` (`double precision`, nullable)
- `grading_mode` (`varchar`, default `auto_or_manual`)

### 3. Validation Layer

Update/expand `packages/utils/src/validation/exercise/`:

- `question-base.ts` (shared prompt/points/rules)
- `question-true-false.ts`
- `question-short-answer.ts`
- `question-numeric.ts`
- `question-fill-blank.ts`
- `question-file-upload.ts`
- `question-matching.ts`
- `question-ordering.ts`
- `question-hotspot.ts`
- compose into:
  - `ZExerciseCreate`
  - `ZExerciseUpdate`
  - `ZExerciseSubmissionCreate`

Validation must run:

- in API routes
- in dashboard before submit/update
- in grading service for defensive checks

### 4. API Layer Changes

Primary touchpoints:

- `apps/api/src/routes/course/exercise.ts`
- `apps/api/src/services/exercise/exercise.ts`
- `apps/api/src/services/exercise/utils.ts`
- `apps/api/src/services/submission/submission.ts`
- `packages/db/src/queries/exercise/exercise.ts`

Key changes:

1. Accept/store question `settings` and `scoringMode`.
2. Support typed answer payload writes to `question_answer.payload`.
3. Enforce attempt limits before creating a submission.
4. Compute final grade using `attemptScoringRule`.
5. Auto/manual grading decision based on question mix.
6. Support file-response references through existing assets model.

### 5. Dashboard Layer Changes

Primary touchpoints:

- `packages/ui/src/custom/exercise-question/*` (new shared UI component set; components only)
- `packages/ui/src/index.ts`
- `apps/dashboard/src/lib/features/course/components/exercise/edit-mode.svelte`
- `apps/dashboard/src/lib/features/course/components/exercise/view-mode.svelte`
- `apps/dashboard/src/lib/features/course/components/exercise/functions.ts`
- `apps/dashboard/src/lib/features/course/components/exercise/store.ts`
- `apps/dashboard/src/lib/features/course/api/exercise.svelte.ts`
- `apps/dashboard/src/lib/features/course/utils/types.ts`
- translations in `apps/dashboard/src/lib/utils/translations/en.json`

Refactor plan:

1. Introduce registry/contracts in `@cio/question-types` and map question type keys to shared UI renderers.
2. Keep existing mode structure (`edit`, `view`, `preview`) but remove hardcoded `if RADIO/CHECKBOX/TEXTAREA` branching.
3. Add type-specific renderer components under `packages/ui/src/custom/exercise-question`.
4. Add translation keys for new types and setting labels.
5. Add exercise-level `auto-grade` toggle with eligibility guard and hint message when blocked by manual-only question types.

### 6. Legacy Compatibility and Migration

1. Existing exercises keep working without migration rewrite of question data.
2. New columns default safely (`{}` / false / null / default enums).
3. `question_type` seed extends with new typenames.
4. Replace hardcoded numeric assumptions where present.

Known cleanup item discovered during audit:

- `apps/api/src/services/course/clone.ts` uses `QUESTION_TYPE_TEXTAREA = 2`, while shared constant maps `TEXTAREA = 3`.
- This must be corrected before rollout to avoid option-cloning regressions for paragraph questions.

## Progress Update (Feb 26, 2026)

Completed in branch:

1. Shared package contracts/registry implemented in `@cio/question-types`.
2. Dashboard renderer logic centralized via shared render contracts and shared `@cio/ui/custom/exercise-question` components.
3. Shared question renderer component files implemented for legacy and expanded question types.
4. Clone service question-type ID mismatch fixed to use shared constants.

Still pending for grading engine milestone:

1. End-to-end server auto-grading engine across non-legacy types.
2. Exercise-level `auto-grade` toggle + disabled-state hint behavior.
3. Full per-type validation/attempt-rule enforcement rollout in API.

## Rollout Plan

### Phase 1 (P0)

Question types:

- True/False
- Short Answer
- Numeric
- Fill in the Blank
- File Upload

Required deliverables:

1. DB columns for settings/payload/attempt controls.
2. Validation and API support for P0 types.
3. Dashboard renderer registry + P0 components.
4. Attempt scoring rule support.
5. Migration + seed updates.

### Phase 2 (P1)

Question types:

- Matching
- Ordering/Sequence

Required deliverables:

1. Partial-credit grading helpers.
2. Enhanced analytics aggregation for pair/order correctness.
3. UX polish for drag/drop and accessibility.

### Phase 3 (P2)

Question types:

- Hotspot/Image Labeling

Required deliverables:

1. Image coordinate mapping schema.
2. Responsive touch/mobile interaction hardening.
3. Additional grading explainability in teacher UI.

## Testing Requirements

### API

- Schema validation tests for each type (create/update/submit).
- Grading tests:
  - all-or-nothing
  - partial-credit
  - manual-required fallback
- Attempt rule tests (`highest`, `latest`, `average`).
- Upload constraint tests by plan limit.

### Dashboard

- Component tests for each type renderer in edit/take modes.
- Store tests for autosave and answer serialization.
- Integration tests for submission payload generation.

### Regression

- Existing three types must pass unchanged behavior tests.
- Exercise cloning must preserve all supported question types correctly.

## Build and Verification Commands

1. `pnpm --filter @cio/db build`
2. `pnpm --filter @cio/utils build`
3. `pnpm --filter @cio/api build`
4. `pnpm --filter @cio/dashboard build`

## Success Metrics (90 Days Post-Launch)

1. 40% of newly created exercises include at least one new type.
2. 25% reduction in average grading time per exercise.
3. 20% increase in completion for assignment-heavy exercises.
4. 30% increase in auto-graded question share in test exercises.

## Risks and Mitigations

1. Hardcoded question-type IDs may cause logic drift.
   - Mitigation: canonical registry + typename-based mapping.
2. Rich payload types can increase complexity in submission parsing.
   - Mitigation: strict per-type schema and shared serializer/deserializer utilities.
3. File uploads can introduce abuse/security risk.
   - Mitigation: MIME/size validation, one-file v1 cap, server-side checks, existing asset safeguards.

## Open Questions

1. Should `short answer` support optional case-insensitive exact-match auto-grading in v1.1?
2. For fill-in-the-blank, should punctuation normalization be strict or relaxed by default?
3. Should hotspot remain P2 or shift post-P2 depending on demand?
