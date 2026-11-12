# Math Teaching Platform: Implementation Plan

Companion to [README.md](./README.md). Each ticket is sized to fit one PR. Every PR that adds schema ships exactly one migration (see the root `CLAUDE.md` § Database migrations).

## Scope lock

1. Grading stays server-authoritative. `@cio/math` is a pure library; workflow and transitions remain in `apps/api` / `question-scoring.ts`.
2. Learner-facing exercise payloads never contain answer keys. This lands before any new auto-graded type ships.
3. Math is stored as LaTeX only (`data-latex` in HTML, `latex` in answer JSON, `$…$` in plain-text fields). Never store rendered KaTeX or MathML.
4. New question types use the existing registry and renderer contract; no type branching outside the registry files.
5. AI grading is "suggest, teacher approves" by default.
6. All new UI copy goes in `en.json` and is translated; renderers in `@cio/ui` take copy through the render contract.
7. Every new `packages/ui` component ships with a Storybook story covering all states.

## Phase 0: Fix what's broken (about 2 weeks)

Goal: a math business can trust us today, before any new feature.

| # | Ticket | Key files | Size |
| --- | --- | --- | --- |
| 0.1 | **Strip answer keys from learner exercise reads.** Add `toLearnerPayload` per question type, apply it in `GET /course/:courseId/exercise/:exerciseId` when the caller is a student, and add a regression test across all registered types | `packages/core/src/services/exercise/{exercise,utils}.ts`, `apps/api/src/routes/course/exercise.ts`, `packages/question-types/src/question-type-registry.ts` | M |
| 0.2 | **`MathContent` everywhere.** Shared component (sanitise + KaTeX, `htmlAndMathml`). Replace `SafeHtmlContent` / `ZoomableHtmlContent` in exercise renderers, textarea submission, public lesson and exercise views, community and comments. Fold `HTMLRender` into it | `packages/ui/src/tools/render-math.ts`, `packages/ui/src/custom/…`, `apps/dashboard/src/lib/features/ui/html-render.svelte` | M |
| 0.3 | **Math in question titles and option labels.** `MathText` renders `$…$` segments; edit inputs show a live preview | `question-title.svelte`, `renderers/{radio,checkbox,ordering,word-bank,true-false}/*` | S |
| 0.4 | **Fractional points.** `point` and `total` → `numeric`; remove `Math.round` in `scoreSubmissionAnswers` and `parseInt` in `mark-exercise-modal.svelte`; NUMERIC partial credit honoured | `packages/db/src/schema.ts`, `packages/question-types/src/question-scoring.ts`, `apps/dashboard/.../mark-exercise-modal.svelte` | M |
| 0.5 | **Pre-score mixed exercises.** Auto-grade the auto-gradable questions, set `hybrid`, queue only the manual ones | `apps/api/src/services/submission/submission.ts` | S |
| 0.6 | **Gradebook consistency and drill-down.** One attempt rule; cells link to the submission | `apps/api/src/services/mark/gradebook.ts`, `features/course/pages/marks.svelte`, `marks-utils.ts` | S |
| 0.7 | **AI chat renders math.** KaTeX markdown extension; prompts instruct LaTeX delimiters | `features/ai-assistant/utils/markdown.ts`, `packages/ai-assistant/src/prompt/{teacher,student}.ts` | S |
| 0.8 | **Authoring polish.** Replace `window.prompt()` with a preview popover; add `$…$` and block input rules; make the existing toolbar math buttons open the popover | `packages/ui/src/custom/editor/{editor.ts,extensions/InlineMathReplacer.ts,commands/toolbar-commands.ts}` | S |
| 0.9 | Delete the unused `/course/katex` route | `apps/api/src/routes/course/{katex,course}.ts` | XS |

## Phase 1: Students write math (about 4–6 weeks)

| # | Ticket | Size |
| --- | --- | --- |
| 1.1 | `@cio/math` package: LaTeX parse, normalise, sample-point equivalence, form checks, evaluation. Golden corpus test suite (≥500 pairs) with false-accept and false-reject rates reported in CI | L |
| 1.2 | `MathField` wrapper around MathLive (browser-only dynamic import, mobile virtual keyboard, a11y), plus a Storybook story | M |
| 1.3 | `MATH_EXPRESSION` question type: registry entry, Zod settings (accepted answers, mode, tolerance, variables and domain, units, misconception feedback), renderers (`edit/take/preview/submission/review`), scorer, learner redaction, seed, translations | L |
| 1.4 | NUMERIC v2: multiple accepted values, relative tolerance, significant figures, fraction input, units, partial credit; backwards-compatible settings parse | M |
| 1.5 | Math blanks in `FILL_BLANK` (per-blank `math: true` uses `MathField` + `@cio/math`); replace comma-split `acceptedAnswers` with an array (migrate existing settings) | M |
| 1.6 | "Show your work": a drawing canvas plus photo attachment on any question (`question.settings.requireWorking`), reusing `FILE_UPLOAD` storage | M |
| 1.7 | Rich-text math toolbar inside the `TEXTAREA` answer (MathField popover) | S |
| 1.8 | Teacher assistant knows the new types: update `agent-question-type-guide.ts`, `prompt/teacher.ts` and the `add_questions` tool schema; validate generated keys with `@cio/math` | S |

## Phase 2: Results teachers love (about 4 weeks, can run in parallel with Phase 1)

| # | Ticket | Size |
| --- | --- | --- |
| 2.1 | Per-question `feedback` and `question.solution`; implement `SHOW_CORRECT_ANSWERS_POLICY` and `ATTEMPT_SCORING_RULE` (already defined, unused) plus `max_attempts` | M |
| 2.2 | Item analysis on the exercise summary tab: % correct, average points, time spent, discrimination, top wrong answers grouped by equivalence | M |
| 2.3 | Grade-by-question view with keyboard flow, rubric chips and "apply to equivalent answers" | L |
| 2.4 | Skills taxonomy (`skill`, `question_skill`), tagging UI in the question editor, and AI-suggested tags | M |
| 2.5 | Mastery heatmap (students × skills) per course and cohort, with drill-down to evidence, plus the learner's own skill view | L |
| 2.6 | Student progress report PDF (math rendered server-side) and item-level CSV/XLSX export | M |

## Phase 3: AI that understands math (about 4–6 weeks)

| # | Ticket | Size |
| --- | --- | --- |
| 3.1 | Tutor context: inject the open question (redacted), math conventions in `prompt/student.ts`, and teacher-authored hints in `question.hints` | S |
| 3.2 | `check_my_step` student tool: deterministic verification via `@cio/math`, and the model explains | M |
| 3.3 | AI grading job (BullMQ, vision-capable model): rubric-based suggestions with confidence and reasons, stored in `question_answer.grading_meta`; rebuild the hidden "Grade with AI" button; bulk approve in grade-by-question | L |
| 3.4 | Mistake diagnosis on wrong math answers (misconception list first, then the model), tags feeding item analysis | M |
| 3.5 | Teacher tools: `generate_variants`, `generate_practice_set(skill, difficulty, n)` | M |
| 3.6 | Worksheet import from PDF or photo via a vision model behind an `OcrProvider` interface; benchmark Mathpix on the same corpus | L |
| 3.7 | Metering: per-submission AI grading units in `usage.ts`; teacher-visible spend estimate before bulk runs | S |

## Phase 4: The most powerful and customisable (ongoing)

| # | Ticket | Size |
| --- | --- | --- |
| 4.1 | Org-level question bank with pools; "draw N from pool" in exercises | L |
| 4.2 | Parameterised questions: variables, constraints, computed answers, per-student `variant_seed` | L |
| 4.3 | Test controls: time limit, availability window, shuffle, late penalty | M |
| 4.4 | `GRAPH` lesson block and question type (engine chosen by spike, see README §8) | L |
| 4.5 | `MULTI_PART` question type with method and accuracy marks | L |
| 4.6 | Adaptive practice mode (streak-to-mastery over a skill pool) | L |
| 4.7 | Curriculum templates (SAT, GCSE, IB, AP Calculus, Common Core 6–8) with skill taxonomies and starter banks | M per template |
| 4.8 | Public API, MCP and webhook parity for new types, the bank and mastery data (`skills/public-api-review/SKILL.md`) | M |

## Suggested order

1. **Phase 0 in full.** 0.1 is a security fix and should ship immediately, independent of this PRD.
2. **1.1 → 1.2 → 1.3** (the core "write math, get graded" loop) **in parallel with 2.1 → 2.2 → 2.3** (the core "see results" loop).
3. **3.1 → 3.3** (tutor and AI grading).
4. Then skills and mastery (2.4, 2.5), parameterised questions (4.2), and the rest by customer demand.

## Verification per ticket

- Unit: `@cio/math` golden corpus; scorer tests per type; learner-redaction test for every registered type.
- Build: `pnpm --filter @cio/api^... build && pnpm --filter @cio/api build` and the dashboard build (see root `CLAUDE.md`).
- E2E: Playwright flows for author → student answers on mobile viewport → auto-grade → teacher item analysis, with `testId`s on primary actions.
