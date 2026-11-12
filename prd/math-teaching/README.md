# Math Teaching Platform PRD

## Status

- Draft

## Date

- November 12, 2026

## Implementation Plan

- See [implementation-plan.md](./implementation-plan.md) for the ticket breakdown and sequencing.

## Purpose

A math teaching business told us:

> The problem with math is that students need to be able to write math problems easily, use artificial intelligence, and I need to be able to view their results easily, etc.

This PRD sets out how ClassroomIO becomes the most capable and most customisable LMS for math teaching businesses (tutoring centres, exam-prep academies, online math schools, homeschool co-ops). It is grounded in an audit of the current codebase, and every gap below names the file where it lives.

---

## 1. Executive summary

### Three jobs the customer named

| Job | What "great" looks like | Where we are today |
| --- | --- | --- |
| **Students write math easily** | A visual math keyboard on every answer field (desktop and phone), auto-graded expression answers, a "show your work" canvas or photo upload | Students can only type raw LaTeX in the paragraph (`TEXTAREA`) answer. Every other answer field is a plain `Input`. Math is stored but **never rendered** back to the teacher |
| **Use AI** | A tutor that speaks math (rendered formulas, hint ladders, mistake diagnosis), AI pre-grading of written and handwritten work, AI-generated practice variants | AI chat does not render LaTeX. There is no AI grading, no vision/OCR and no math-aware tutoring |
| **Teachers view results easily** | Item analysis per question, skill mastery heatmaps, grading one question across all students, a gradebook that clicks through to work | The gradebook is a colour table with no drill-down and inconsistent numbers. There is no per-question analytics, no skills and no "grade by question" view |

### Product vision

A teacher builds a lesson with beautiful math, assigns a randomised problem set, and lets students answer with a math keyboard or a photo of their working. Correct expressions are graded instantly by mathematical equivalence, not string match. AI drafts feedback on the open-ended work and the teacher approves it in one pass. The next morning the teacher sees a mastery heatmap: who is stuck on *factorising quadratics*, which wrong answer they all gave, and a one-click "generate 10 more practice problems on this" for those students.

### Why we can win

- **We already own the hard plumbing.** We have a question-type registry (`packages/question-types`), a renderer contract (`packages/ui/src/custom/exercise-question/renderers/<type>/{edit,take,preview,submission,review}.svelte`), a multi-provider AI SDK layer (`packages/ai-assistant`), metering (`packages/core/src/services/agent/usage.ts`), an MCP server, white-labelled org sites and custom domains.
- **Math is a registry entry, not a rewrite.** Most of this plan adds new question types, one shared math library and better result views on top of the existing contracts.
- **Customisability is our wedge.** Competitors in math are either content-locked (Khan, IXL), assessment-only (Desmos Classroom, DeltaMath) or generic LMSs with weak math (Teachable, Thinkific, Moodle's STACK is powerful but painful). A business wants its own curriculum, brand, pricing and question bank, with math that "just works". That is exactly our shape.

---

## 2. Current-state audit

### 2.1 Writing and rendering math

| Area | Current state | Gap |
| --- | --- | --- |
| Editor | Tiptap v3 with `@tiptap/extension-mathematics` (`packages/ui/src/custom/editor/editor.ts`). Stored as `<span data-type="inline-math" data-latex="…">` / `<div data-type="block-math" …>` | Editing a formula opens a native `window.prompt()` (`editor.ts:104,112`). No preview, no visual input. Only the `$$…$$` input rule exists (`extensions/InlineMathReplacer.ts`); single `$…$` does not work. Math is inserted from the toolbar's Inline/Block Expression buttons or the slash menu, and both always insert a fixed default formula |
| Renderer | `renderMathInElement` (`packages/ui/src/tools/render-math.ts`) runs KaTeX on the placeholders | Only `HTMLRender` (`apps/dashboard/src/lib/features/ui/html-render.svelte`) calls it, and that component is used in 5 places (plus one with a commented-out import). `SafeHtmlContent`, `ZoomableHtmlContent` and comment rendering never render math, so **math shows as blank** in question descriptions, textarea submissions, public lesson and exercise views, community and comments |
| Question title and options | `question-title.svelte` renders `<h4>{title}</h4>`. Options are edited with a plain `Input` (`renderers/radio/edit.svelte:176`, `renderers/checkbox/edit.svelte:181`) and shown as `{option.label}` | No math in the two places math questions need it most |
| Student answers | Only `TEXTAREA` (`renderers/textarea/take.svelte`) uses the rich editor. `SHORT_ANSWER` and `FILL_BLANK` use a plain `Input`, `MATCHING` a plain `Textarea`. `NUMERIC` uses `NumberField` | No expressions, fractions, roots, units or exponents. Teachers grading a textarea see empty spans (`renderers/textarea/submission.svelte:56`) |
| Sanitiser | `packages/utils/src/functions/sanitize.ts` forbids `math` and keeps `data-latex` | Fine for the "store placeholder, render after sanitising" pattern, but it means we can never store KaTeX/MathML output. That is the right call; keep it |
| Graphs and geometry | Nothing (no Desmos, GeoGebra, JSXGraph or plotting) | Graphing is a core math need |
| Other surfaces | AI chat uses plain `marked` (`features/ai-assistant/utils/markdown.ts`). Lesson PDF export is disabled (`apps/api/src/utils/lesson.ts:141`). Certificates and emails have no math | Math must render everywhere text renders |
| Dead code | `GET /course/katex` (`apps/api/src/routes/course/katex.ts`) is unauthenticated, hand-parses the query string and has no callers | Delete it |

### 2.2 Assessment and grading

| Area | Current state | Gap |
| --- | --- | --- |
| Question types | 16 registered (`packages/question-types/src/question-type-registry.ts`), including `NUMERIC`, `FILL_BLANK`, `FILE_UPLOAD` | No math-expression type, no graph type, no multi-part question, no handwriting canvas |
| Numeric grading | `scoreNumeric` in `question-scoring.ts`: `abs(value − correct) ≤ tolerance`, all or nothing | No relative tolerance, significant figures, fractions, multiple accepted answers, units or partial credit (even though the registry says NUMERIC supports partial credit) |
| Text grading | `FILL_BLANK` / `WORD_BANK` use `.trim().toLowerCase()` exact match. `acceptedAnswers` is one comma-split string, so `1,000` breaks it | No equivalence. `2x+1` ≠ `1+2x` today |
| Fractional points | `question_answer.point` and `submission.total` are `bigint` (`packages/db/src/schema.ts:2565`, `:795`). `scoreSubmissionAnswers` does `Math.round`, and `mark-exercise-modal.svelte` uses `parseInt` | Can't award ½ a mark. Math marking schemes (method marks, accuracy marks) depend on this |
| Mixed exercises | Auto-grading runs only if **every** question is auto-gradable (`apps/api/src/services/submission/submission.ts` ~line 825). One paragraph question means the teacher hand-grades the MCQs too | Pre-score the auto-gradable parts, queue only the rest |
| **Answer-key exposure** | `GET /course/:courseId/exercise/:exerciseId` returns `getExercise()` → `transformQuestion()` (`packages/core/src/services/exercise/utils.ts`), which includes `option.isCorrect` and full `question.settings` (`correctValue`, `tolerance`, `acceptedAnswers`) to enrolled students. No stripping on the student path | **P0 security issue.** Any auto-graded quiz is answerable from the network tab. Must be fixed before we market auto-graded math |
| Attempts and test controls | `exercise.allowMultipleAttempts` is a boolean. `ATTEMPT_SCORING_RULE`, `SHOW_CORRECT_ANSWERS_POLICY` and `QUESTION_SCORING_MODE` are defined in `question-scoring-rules.ts` but unused. `dueBy` is only a label | No max attempts, time limits, answer release policy, shuffle or late penalties |
| Feedback | One `submission.feedback` text for the whole attempt | No per-question feedback, worked solution or rubric |
| Question banks | `exercise_template` stores a `questionnaire` jsonb blob | No reusable item bank, pools, randomisation or parameterised questions |

### 2.3 AI

| Area | Current state | Gap |
| --- | --- | --- |
| Stack | Vercel AI SDK v6 with OpenAI, Anthropic, Google and Moonshot providers (`packages/ai-assistant/src/providers/index.ts`). Streaming at `POST /agent/chat`. Metering in `packages/core/src/services/agent/usage.ts` | Solid foundation |
| Teacher assistant | Can create exercises and questions (`add_questions`) and knows the math block recipe (`tools/block-recipes.ts`) | Doesn't know about math question types or equivalence settings, and can't generate variants |
| Student tutor | `prompt/student.ts` with `hint_only` / `block_during_exercise` modes and read-only tools (`read_exercise` strips answer keys) | Replies render as plain markdown without LaTeX. The prompt has no math conventions. The tutor isn't handed the open question, so it must call `read_exercise` |
| Grading | Deterministic only. The "Grade with AI" button in `mark-exercise-modal.svelte` is hidden and its logic is commented out | No AI pre-grading, feedback drafting or mistake diagnosis |
| Vision | None. Documents go through `pdf-parse` / `mammoth` text extraction (`packages/core/src/services/agent/document.ts`) | Can't read a photo of handwritten working or import a scanned worksheet |

### 2.4 Results and reporting

| Area | Current state | Gap |
| --- | --- | --- |
| Gradebook | `features/course/pages/marks.svelte` and `apps/api/src/services/mark/gradebook.ts`. A colour-coded student × exercise table with export | Cells don't link to the submission. `buildStudentMarksByExerciseId` keeps whichever row comes last while `gradedPointsByExerciseId` takes the max, so the same student can show two different numbers |
| Per-exercise results | `features/course/components/exercise/submissions/{summary,individual}.svelte`. Response distribution charts | No % correct, average score, discrimination or "most common wrong answer" per question |
| Grading workflow | `mark-exercise-modal.svelte` grades one student at a time | No next/previous student, no "grade question 3 for everyone", no rubric, no keyboard flow |
| Skills | Tags exist for courses (`prd/tags-feature [DONE]`) | Questions can't be tagged with skills or standards, so there's no mastery view |

---

## 3. Principles

1. **One representation, one renderer.** Math is LaTeX in a `data-latex` attribute (or a `latex` field in answer JSON). One shared `MathContent` component renders it on every surface. No surface may render user HTML without it.
2. **Grading is server-side and keys never leave the server for learners.** Equivalence checks run in the API. The learner payload is built by an explicit redaction function owned by the question-type registry.
3. **Every new capability is a registry entry.** New question types follow `packages/question-types` and the renderer contract, so the editor, taking view, review, MCP, public API and AI assistant all pick them up.
4. **AI drafts; teachers decide.** AI grades are suggestions with reasons until a teacher (or an org policy the teacher set) accepts them.
5. **Customisable by default.** Every policy (tolerance, accepted forms, attempts, answer release, AI hint strictness, rubrics) is a setting with a sensible default, configurable per org, course, exercise and question.
6. **Mobile is first-class.** Most students will do homework on a phone. The math keyboard, photo upload and results must work there.

---

## 4. Solution by pillar

### Pillar A: Math renders everywhere (foundation)

- **`MathContent` component** in `packages/ui/src/custom/math-content/`: sanitise, then `renderMathInElement`, with KaTeX `output: 'htmlAndMathml'` so screen readers get MathML. Replace `SafeHtmlContent` / `ZoomableHtmlContent` usage in exercise renderers, public course views, community and comments. Fold `HTMLRender` into it.
- **Inline math in plain-text fields**: question titles and option labels accept `$…$` and render through a `MathText` component. Storage stays plain text with delimiters, so no migration is needed.
- **Better authoring**: replace `window.prompt()` with a popover containing a MathLive field plus a raw-LaTeX tab and live preview. Add a `$…$` input rule and a block-math input rule (`$$` on its own line). Make the existing toolbar Inline/Block Expression buttons open that popover instead of inserting a fixed default formula.
- **AI chat**: add a KaTeX markdown extension to `features/ai-assistant/utils/markdown.ts` (`$…$`, `$$…$$`, `\(…\)`, `\[…\]`) and tell both prompts to emit LaTeX in those delimiters.
- **Print and PDF**: server-side KaTeX for worksheet and lesson PDFs (re-enable the disabled export path in `apps/api/src/utils/lesson.ts` with math support).
- **Delete** `apps/api/src/routes/course/katex.ts`.

### Pillar B: Students write math easily

- **Math keyboard input**: adopt [MathLive](https://github.com/arnog/mathlive) (`<math-field>` web component, MIT) as a `MathField` wrapper in `packages/ui/src/custom/math-field/`. It gives a virtual keyboard on mobile, typing shortcuts (`sqrt`, `/` for fractions, `^`), and LaTeX output. Use it in:
  - the new `MATH_EXPRESSION` answer type
  - an upgraded `NUMERIC` (fractions such as `3/4`, `\frac{1}{3}`, scientific notation)
  - math-aware `FILL_BLANK` blanks
  - the editor's math popover and the textarea answer toolbar
- **New question type `MATH_EXPRESSION`** (auto-gradable, partial credit), configured per question:
  - one or more accepted answers, each with optional partial credit and a feedback message ("you forgot the ±")
  - comparison mode: `equivalent` (symbolic), `numeric` (sample-point evaluation), `exact_form` (e.g. must be fully factorised, simplified, or in `y = mx + c` form), `literal`
  - variables and domain for sampling, absolute or relative tolerance, significant figures, units (with accepted unit conversions)
  - common wrong answers mapped to targeted feedback (misconception library)
- **Equivalence engine**: a new pure package `@cio/math` wrapping the [Cortex Compute Engine](https://mathlive.io/compute-engine/guides/symbolic-computing/) for parsing LaTeX to MathJSON, canonicalisation, form checks and evaluation. Its `isEqual()` is a numeric check that returns `undefined` when undecided, and it does not prove identities such as `(x+1)^2 = x^2+2x+1`. So our grader uses **randomised multi-point evaluation over the declared domain as the source of truth**, with symbolic canonical-form comparison for `exact_form`. Every grading decision stores which rule matched, for auditability.
- **Multi-part questions** (`MULTI_PART`): a shared stem (with graph or diagram) and parts (a), (b), (c), each its own sub-answer and marks. This is how real math exams work, and it gives method and accuracy marks.
- **"Show your work"**: every math question can optionally require working, either as a drawing canvas (pen, eraser, graph-paper background, stored as an image plus vector JSON) or as a photo upload. Working is reviewed by the teacher and readable by AI (Pillar C). This reuses the `FILE_UPLOAD` storage path.
- **Graphing**:
  - Lesson block `graph` (new block definition in `packages/utils/src/validation/block/definitions/`, following `ADDING_A_BLOCK_TYPE.md`): interactive function plotter for teaching.
  - Question type `GRAPH`: student plots points, lines or curves; auto-graded by comparing the plotted object with tolerance.
  - Engine choice is an open question (section 8): Desmos API (best UX, needs a production API key and terms review), GeoGebra (rich, licence review needed), or open-source JSXGraph / function-plot (fully ours, more build).

### Pillar C: AI that understands math

- **Math-fluent tutor**:
  - inject the currently open question (redacted) into context instead of relying on a `read_exercise` call
  - add math conventions to `prompt/student.ts`: LaTeX delimiters, one step at a time, ask the student for their next step, never reveal the final answer in `hint_only` mode
  - **hint ladder** per question: teacher-authored hints first, then AI hints, each step logged so teachers see how much help a student needed
  - a "check my step" action: the student submits an intermediate line, and the tutor verifies it with `@cio/math` (deterministic) before commenting, so it doesn't hallucinate arithmetic
- **AI grading assistant** (re-enable and rebuild the hidden "Grade with AI" button):
  - for `TEXTAREA`, `MULTI_PART` and "show your work", a vision-capable model reads the typed or handwritten working against the teacher's rubric and marking scheme and proposes points per criterion with a short justification
  - it never auto-publishes unless the org explicitly enables it per exercise; the default is "suggested, teacher approves"
  - bulk "approve all AI suggestions above confidence X" in the grade-by-question view
- **Mistake diagnosis**: on a wrong `MATH_EXPRESSION` answer, first match the teacher's misconception list, then (optionally) ask the model to classify the error (sign error, distribution, order of operations…). Store it as a tag on the answer to feed analytics.
- **Generation**:
  - teacher assistant tools: `create_math_question`, `generate_variants` (N parameterised variants of a question), `generate_practice_set(skill, difficulty, count)`
  - **import a worksheet**: upload a PDF or photo; a vision model (or Mathpix, see section 8) converts it to questions with LaTeX, and the teacher reviews before saving
  - all generated questions are validated by `@cio/math` (the answer key must parse and evaluate) before they're saved
- **Cost control**: all of this meters through the existing `recordTokenUsage` / `enforceTokenBalance`, with grading counted per submission rather than per token in the UI so businesses can predict spend.

### Pillar D: Teachers see results easily

- **Fix the gradebook**: one scoring rule driven by the exercise's `attemptScoringRule` (highest, latest or average). Every cell links to the submission. Show attempts and lateness.
- **Grade by question**: a grader that walks question 1 for all students, then question 2, with keyboard shortcuts, rubric chips, AI suggestions and "apply this comment to all identical answers" (group identical or equivalent answers using `@cio/math`, so 30 students who wrote `x = 3` are graded once).
- **Item analysis** on the exercise summary tab: % correct, average points, time spent, discrimination index, and the **top wrong answers** grouped by mathematical equivalence with the misconception tag.
- **Skills and mastery**:
  - skill tags on questions (a new `skill` taxonomy, org-defined, with optional import of standards such as Common Core, GCSE or IB as templates)
  - **mastery heatmap**: students × skills for a course or cohort, coloured by mastery and clickable to the evidence
  - learner page shows their own skill progress
  - "assign practice on this skill" from any red cell, closing the loop with Pillar C generation
- **Per-question feedback and worked solutions**: new `question.solution` (rich text with math) and `question_answer.feedback`. Implement `SHOW_CORRECT_ANSWERS_POLICY`: never, after submit, after due date, or after grading.
- **Reports for the business**: parent/guardian-friendly progress report PDF per student (math renders), cohort progress over time, and CSV/XLSX export of item-level data (the existing `features/ui/export/`).

### Pillar E: The most powerful and customisable

- **Question bank and pools**: promote questions to a first-class, org-level bank with tags (skill, difficulty, source). Exercises can draw "N questions from pool X" per student.
- **Parameterised (randomised) questions**: variables with ranges or sets and constraints (e.g. `a ∈ {2..9}`, `b ≠ 0`), computed answers via `@cio/math` expressions, and a per-student seed stored on the submission so the teacher sees exactly what each student got. This kills answer sharing and gives unlimited practice.
- **Test controls**: max attempts, time limits, availability windows, shuffle questions and options, a lockdown-lite (no tutor during test, which already exists as `block_during_exercise`), and late penalties.
- **Adaptive practice mode**: an exercise mode that keeps serving questions from a skill pool until the student hits N in a row correct, raising difficulty as they go. It is the "IXL-style" loop that math businesses pay for.
- **Curriculum templates**: course templates (`prd/course-templates`) shipped for common exam tracks (SAT Math, GCSE Maths, IB AA/AI, AP Calculus, Common Core grades 6–8) with skill taxonomies and starter question banks, so a new business is productive on day one.
- **API, MCP and webhooks parity**: every new type, the question bank and mastery data are exposed through the public API and MCP tools (`packages/mcp/src/tools/course-exercises.ts`, `course-submissions.ts`), following `skills/public-api-review/SKILL.md`. That lets businesses plug in their own tools.

---

## 5. Data model changes (summary)

All schema changes for a PR ship in a single migration, per the repo's migration rules.

| Table | Change |
| --- | --- |
| `question_answer` | `point` `bigint` → `numeric(8,2)`; add `feedback text`, `grading_meta jsonb` (matched rule, misconception tag, AI suggestion and confidence, who accepted it) |
| `submission` | `total` `bigint` → `numeric(10,2)`; add `attempt_number int`, `started_at`, `time_spent_seconds`, `variant_seed bigint` |
| `question` | add `solution text` (rich text), `hints jsonb` (ordered list); `settings` jsonb gains math-type configs (validated by Zod per type) |
| `exercise` | add `max_attempts`, `attempt_scoring_rule`, `show_correct_answers_policy`, `time_limit_minutes`, `available_from`, `shuffle_questions`, `shuffle_options`, `mode` (`standard` / `adaptive`) |
| New `skill`, `question_skill` | org-scoped skill taxonomy and many-to-many with questions |
| New `question_bank_item` (or promote `question` with nullable `exercise_id`) | org-level bank with tags and pools; decision in the implementation plan |
| New `question_type` seeds | `MATH_EXPRESSION`, `MULTI_PART`, `GRAPH` (and a `DRAWING` working attachment) |

---

## 6. Architecture notes

- **`@cio/math` (new package, pure, no DB)**: `parseLatex`, `normalize`, `isEquivalent(a, b, opts)`, `checkForm(expr, form)`, `evaluate(expr, vars)`, `renderToString(latex)`. It is used by the API grader, the dashboard (live "answer looks valid" preview), the AI tutor "check my step" tool, and question generation validation. It does not own grading workflow; `question-scoring.ts` calls it, keeping the existing rule that grading logic lives in `@cio/question-types` / API.
- **Answer-key redaction**: add `toLearnerPayload(question)` to each registry entry (next to the existing codecs) and route every learner-facing read through it. Add a test that asserts no registered type leaks `isCorrect`, `correctValue`, `acceptedAnswers` or the math answer config.
- **Renderers**: new types live under `packages/ui/src/custom/exercise-question/renderers/{math-expression,multi-part,graph}/{edit,take,preview,submission,review}.svelte`, with all copy passed in via the render contract (no hardcoded English), plus Storybook stories for every state.
- **SSR**: MathLive and graphing libraries are browser-only. Load them with the same browser-guarded dynamic import pattern used for `layerchart`.
- **AI**: new tutor and grading tools go in `packages/ai-assistant/src/tools/` with implementations in `apps/api/src/services/agent/`. AI grading runs as a BullMQ job (`apps/jobs`) per submission, never inline in the request.

---

## 7. Success metrics

- **Authoring**: % of math-tagged courses whose exercises use `MATH_EXPRESSION`, `NUMERIC` or `GRAPH` rather than `TEXTAREA`.
- **Grading time**: median teacher minutes per submission graded (target: −60% for mixed exercises).
- **Auto-grade coverage**: % of question answers graded without a human (target: >80% in math courses).
- **Student input**: % of math answers submitted from mobile without error; tutor sessions per active student.
- **Results**: weekly active teachers on item analysis or mastery views.
- **Business**: conversion and retention of orgs tagged as math businesses; NPS from this customer segment.

---

## 8. Open questions and risks

1. **Graphing engine**: Desmos (needs a production API key; terms for a commercial LMS need review), GeoGebra (licence review), or open-source JSXGraph / function-plot (more build, full control). Recommendation: spike JSXGraph for the `GRAPH` question type and offer a Desmos embed block for orgs that bring their own key.
2. **Compute Engine licence and accuracy**: confirm the licence before adopting it. Build a golden test corpus (≥500 answer pairs from real math courses) to measure false accepts and false rejects before `MATH_EXPRESSION` goes GA.
3. **Handwriting OCR**: frontier vision models vs. [Mathpix](https://mathpix.com/pricing/api) (purpose-built, per-image pricing). Start with our existing providers behind an interface, and benchmark Mathpix on the same corpus.
4. **AI grading trust**: default to "suggested". Show confidence and reasons. Log every AI suggestion against the final teacher grade to measure agreement before offering auto-publish.
5. **Accessibility**: MathLive and KaTeX MathML output must work with screen readers. Include it in QA.
6. **Plan gating**: decide which pieces are premium (`premium-question-types.ts`). Recommendation: math rendering, `MATH_EXPRESSION` and the item analysis are free (they're table stakes for math); parameterised questions, adaptive mode, AI grading and the mastery heatmap are paid.

---

## 9. Sources

- MathLive: https://github.com/arnog/mathlive (MIT)
- Compute Engine `isEqual` semantics: https://mathlive.io/compute-engine/guides/symbolic-computing/
- Desmos API (versioned script with API key; demo key is development-only): https://www.desmos.com/api
- Mathpix API pricing: https://mathpix.com/pricing/api
