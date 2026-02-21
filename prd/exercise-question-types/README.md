# Exercise Question Types Expansion PRD

## Status
- Draft

## Date
- February 17, 2026

## Purpose
Expand exercise question formats beyond `single answer`, `multiple answer`, and `paragraph` so instructors can run better tests and collect richer assignment submissions.

## Problem Statement
Current question support is too limited for many subjects and assessment styles. This creates avoidable manual grading work, weakens test quality, and forces instructors to move assignment collection outside the LMS.

## Goals
1. Support more objective and subjective question types for tests and assignments.
2. Increase auto-grading coverage for objective questions.
3. Improve assignment collection for project-based work.
4. Keep authoring simple and consistent across question types.

## Non-Goals
- Online proctoring.
- AI grading feedback generation in v1.
- Code execution/judging.
- LTI/QTI export in v1.

## Primary Users
- Instructors creating tests and assignments.
- Students submitting answers on desktop and mobile.
- Admins reviewing performance and completion analytics.

## Confirmed Decisions
1. Code execution is out of scope for now.
2. File upload size limits are plan-based (Free: `2MB`, Paid: `10MB`).
3. Resubmission policy is configured at the exercise level, not per question type.
4. Rollout phases remain as currently defined in this PRD.
5. If an exercise contains `short answer` or `paragraph`, automatic grading is disabled for final exercise grading.
6. Numeric-answer grading mode is configurable.
7. Fill-in-the-blank does not need multiple accepted answers per blank in v1.
8. Partial credit is enabled by default for supported types.
9. Partial-credit settings are primarily question-level, with exercise-level override.
10. File upload configuration is per question.
11. Exercise settings include max attempts.
12. Correct-answer visibility is configurable by teacher at exercise level.
13. Negative marking is out of scope for now.
14. Test-only controls should be included in this PRD.
15. Allowed upload file types in v1 include common assignment formats: `PDF`, `DOCX`, `PPTX`, `XLSX`, `ZIP`, and images.
16. Audio/Video response question type is not in v1.
17. Attempt grading rule is configurable by teacher at exercise level (`highest`, `latest`, or `average`) with explanation in UI.
18. Upload questions accept exactly 1 file in v1.

## Proposed Question Types

| Type | Best For | Auto-gradable | Assignment Use | Test Use | Priority |
| --- | --- | --- | --- | --- | --- |
| True/False | Quick concept checks | Yes | Medium | High | P0 |
| Short Answer (single-line) | Definitions and recall | No (manual) | High | High | P0 |
| Numeric Answer | Math/science/business values | Yes (configurable mode) | Medium | High | P0 |
| Fill in the Blank (Cloze) | Language, formulas, recall | Yes | Medium | High | P0 |
| File Upload | Docs, slides, sheets, designs | Manual | High | Low | P0 |
| Matching | Concept mapping, vocab | Yes (supports partial credit) | Medium | High | P1 |
| Ordering/Sequence | Steps, chronology, process | Yes (supports partial credit) | Medium | High | P1 |
| Hotspot/Image Labeling | Diagram/anatomy/geography tasks | Yes | Medium | Medium | P2 |

## What Partial Credit Means
Partial credit allows awarding some points for a partially correct response instead of strict all-or-nothing scoring.

Examples:
- Matching with 5 pairs and 10 points can award 2 points per correct pair.
- Ordering questions can award points per correctly positioned item.
- Fill-in-the-blank with multiple blanks can score per blank.

Recommended v1 support:
- Enable partial credit for `matching`, `ordering`, and multi-blank `fill in the blank`.
- Keep `true/false` and most single-choice items all-or-nothing.
- Default partial credit to enabled for supported types.
- Allow question-level scoring configuration with exercise-level override.

## Functional Requirements

### Authoring (Instructor)
- Instructor can select a question type from a question-type picker.
- Instructor can configure points, required/optional, and per-question instructions.
- Instructor can define answer keys for auto-graded types.
- Instructor can set scoring mode (`all-or-nothing` or `partial`) where supported.
- Numeric-answer scoring mode is configurable (for example: exact, tolerance, percentage tolerance).
- Upload constraints are configured per upload question.
- Instructor can preview each question type before publishing.

### Student Experience
- Students can answer all supported types on desktop and mobile.
- Answer state autosaves while working.
- Students submit one exercise containing mixed question types.
- Upload fields enforce allowed file types and plan-based file-size limits per upload question.
- Upload questions accept one file per question in v1.

### Grading and Results
- Objective types are auto-graded immediately (or after test closes).
- Manual types are queued for instructor grading with point entry and feedback.
- If an exercise includes `short answer` or `paragraph`, final exercise auto-grading is disabled and the exercise enters manual grading flow.
- Instructors can override auto-graded scores.
- Gradebook stores question-level points and total exercise score.

### Attempts and Resubmissions
- Attempts and resubmissions are configured per exercise.
- The same resubmission rules apply to all question types in that exercise.
- Exercise settings define allowed attempts, late policy, and resubmission window.
- Exercise settings include configurable attempt scoring rule (`highest`, `latest`, `average`) with clear explanation of each option.
- Correct-answer reveal timing is configurable per exercise by the teacher.

### Test-Only Controls (In Scope)
- Timer configuration per exercise.
- Randomize question order per exercise.
- Optional randomize option order for eligible question types.
- Availability window controls for test start/end.

## Data and Platform Requirements
- Question schema includes: `type`, `prompt`, `settings`, `points`, `answerKey`, `scoringMode`.
- Responses are validated per question type.
- Question definitions are versioned to preserve historical attempts.
- Upload handling enforces backend limits by active workspace plan.

## Non-Functional Requirements
- Accessibility target: WCAG 2.2 AA.
- Reliability target: autosave success rate > 99%.
- Performance target: smooth interaction on large exercises without noticeable typing lag.
- Security target: validated uploads, secure storage, audit trail for grading overrides.

## Rollout Plan
1. Phase 1 (P0): True/False, Short Answer, Numeric, Fill in the Blank, File Upload.
2. Phase 2 (P1): Matching, Ordering/Sequence.
3. Phase 3 (P2): Hotspot/Image Labeling.

## Success Metrics (90 Days Post-Launch)
- 40% of newly created exercises include at least one new question type.
- 25% reduction in average grading time per exercise.
- 20% increase in assessment completion rate for assignment-heavy courses.
- 30% increase in auto-graded question share for tests.

## Open Questions
- Should Hotspot/Image Labeling remain in P2 or move to a later phase?

## Implementation Framework for Question Types

- **Single question-type package**: centralize metadata, enum IDs, shared validation helpers, seeds, and front-end render configs into a dedicated package (e.g. `packages/question-types`). Every service, route, dashboard feature, and seed script imports the canonical question-type registry so new formats stay in sync everywhere and versioning/rollout phases are easy to read.
- **Guided onboarding checklist**: each new type runs through the same pipeline—add Zod schema in `packages/utils`, add seed + query helpers, wire service grading/validation logic, expose via API route and register it in `apps/api`, then define dashboard request/response types and API class helpers before implementing UI renderers/translation keys. A shared README/checklist in the question-type package prompts engineers to validate both client and server, add translations, and run the API build before marking the type ready.
- **Release automation**: attach metadata to each type indicating its rollout bucket (P0/P1/P2), required tests (validation, grading), plan-aware configs (file limits/allowed upload types), and documentation updates. Require backend seeding, frontend integration, and automated tests before a type moves out of draft, so the phase definition in this PRD becomes the gating criteria for rollout.

## Question Mode Structure

- Maintain an `ExerciseMode` enum (`view | edit | take`) declared in one shared module and pass it through a Svelte store/context so that every question renderer, toolbar, and UX shell can react to the current experience.
- Split the UI per mode: grow `apps/dashboard/src/lib/features/course/components/exercise` into `view-mode/`, `edit-mode/`, and `take-mode/` subdirectories, each owning its own store, renderer components, autosave hooks, and submission logic while reusing shared question shells from the centralized registry.
- Document file layout expectations in the package README so when engineers add a new mode they create `index.svelte`, `store.ts`, and `components/question-shell.svelte` plus any supporting API or autosave helpers; `mode` gets wired to toolbar controls (e.g., preview toggle, grade overrides) and ensures constraints (timers, plan-based upload limits) only run in the correct context.

## Question Type Structure Reference

- **Metadata/registry**: define IDs, labels, auto-grade flags, partial-credit support, and target UI component references in the shared package so the dashboard can look up renderer props (e.g., `ExerciseTrueFalse`) without duplicating constants.
- **Validation schemas**: keep Zod schemas per type under `packages/utils/src/validation/exercise/` and reuse them in API routes, dashboard editors, and autosave validation logic to keep client/server checks aligned.
- **Service/grade helpers**: have the API grading service switch on `question.type` to call `gradeTrueFalse`, `gradeNumeric`, etc., or fall back to manual grading, so each type owns its scoring rules and partial-credit behavior.
- **UI renderers**: map each type to a renderer + validator in `apps/dashboard/src/lib/features/exercise/api/question-renderers.ts`, passing `mode` to inform view/edit/take behaviors and prevent duplicated logic across experiences.
