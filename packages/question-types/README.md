# @cio/question-types

Shared, framework-agnostic question type contracts for ClassroomIO exercise products.

This package is the source of truth for:

- Question type keys and DB id mappings
- Type metadata and capability flags
- Stable render contracts and list contracts
- Answer payload and serialization helpers
- Renderer registry helpers (without UI implementation)
- Form state primitives for question flows

It is intentionally pure TypeScript and contains no UI components.

## Why this package exists

`@cio/question-types` centralizes exercise domain contracts so every app/package can use the same behavior:

- `apps/dashboard` uses the same question keys/types as API and DB consumers
- `apps/api` can rely on stable question type IDs
- `@cio/ui` can implement renderers against one shared contract
- Future products (for example, forms/assessments) can reuse the same domain model

## Package boundary

What belongs here:

- Domain constants and type-level contracts
- Pure mapping/lookup helpers
- Deterministic utilities (same input => same output)
- Serialization rules for answer payloads

What does not belong here:

- Svelte/React/Vue components
- Package-specific UI behavior
- Network calls
- DB query implementations

## Architecture

```mermaid
flowchart LR
  subgraph Product Apps
    DASH[apps/dashboard]
    API[apps/api]
    FUTURE[future app e.g. forms]
  end

  subgraph Shared Packages
    QT[@cio/question-types\ncontracts + registry + serializer]
    UI[@cio/ui/custom/exercise-question\nrendering implementation]
    DB[(DB question_types ids)]
  end

  DASH -->|question models, keys, lookups| QT
  FUTURE -->|same contracts| QT
  UI -->|imports types + registry helpers| QT
  DASH -->|renders via props/contracts| UI
  API -->|imports QUESTION_TYPE_IDS| QT
  QT -->|stable id <-> key mapping| DB
  DASH -->|answersByKey| QT
  QT -->|serializeExerciseAnswerMap| API
```

## Source layout

```text
packages/question-types/src/
  answer-serializer.ts
  exercise-types.ts
  form-state.ts
  index.ts
  math-engine.ts
  math-forms.ts
  math-grading.ts
  math-settings.ts
  question-answer-payload.ts
  question-scoring-rules.ts
  question-type-capabilities.ts
  question-type-keys.ts
  question-type-lookup.ts
  question-type-registry.ts
  question-type-types.ts
  render-contract.ts
  renderer-registry.ts
```

## Supported question types

Registry source: `src/question-type-registry.ts`

| key               |  id | label             | autoGradable | supportsPartialCredit | manualGradingRequired | disabled |
| ----------------- | --: | ----------------- | -----------: | --------------------: | --------------------: | -------: |
| `RADIO`           |   1 | Single answer     |          yes |                    no |                    no |       no |
| `CHECKBOX`        |   2 | Multiple answers  |          yes |                   yes |                    no |       no |
| `TEXTAREA`        |   3 | Paragraph         |           no |                    no |                   yes |       no |
| `TRUE_FALSE`      |   4 | True/False        |          yes |                    no |                    no |       no |
| `SHORT_ANSWER`    |   5 | Short answer      |           no |                    no |                   yes |       no |
| `NUMERIC`         |   6 | Numeric answer    |          yes |                   yes |                    no |       no |
| `FILL_BLANK`      |   7 | Fill in the blank |          yes |                   yes |                    no |       no |
| `FILE_UPLOAD`     |   8 | File upload       |           no |                    no |                   yes |       no |
| `ORDERING`        |   9 | Ordering          |          yes |                   yes |                    no |       no |
| `LINK`            |  10 | Links             |           no |                    no |                   yes |       no |
| `WORD_BANK`       |  11 | Word bank         |          yes |                   yes |                    no |       no |
| `STAR`            |  12 | Star rating       |          yes |                    no |                    no |       no |
| `VIDEO_RECORDING` |  13 | Video recording   |           no |                    no |                   yes |       no |
| `THUMBS`          |  14 | Thumbs up/down    |           no |                    no |                    no |       no |
| `MATCHING`        |  15 | Matching          |          yes |                   yes |                    no |      yes |
| `HOTSPOT`         |  16 | Hotspot           |          yes |                   yes |                    no |      yes |
| `MATH_EXPRESSION` |  17 | Math expression   |          yes |                    no |                    no |      yes |
| `WORKED_SOLUTION` |  18 | Worked solution   |           no |                   yes |                   yes |      yes |

Disabled types are built but have no `question_type` row yet, so they stay out of the type picker and the AI tool enum.
`MATH_EXPRESSION` and `WORKED_SOLUTION` are also left out of the exercise validation id list.

## Math grading

Math answers are graded with the [Cortex Compute Engine](https://cortexjs.io/compute-engine/) on the server. The engine
is large, so it lives in its own entry point, `@cio/question-types/math-grading`, which the package index does not
import. Pass its `mathGrader` to `scoreAnswerForQuestion` / `scoreSubmissionAnswers`; without it,
`MATH_EXPRESSION` and `WORKED_SOLUTION` answers score 0, and `NUMERIC` compares the numeric `value` using
`tolerance`, `relativeTolerance` and `significantFigures`; LaTeX answers and a LaTeX `correctValue` need the grader.

- `scoreMathExpression(settings, latex)` returns a reason (`equivalent`, `not_simplified`, `wrong_form`,
  `wrong_units`, `wrong`, `needs_review`, `invalid`) and the teacher's `wrongAnswerFeedback` when the answer
  matches a known wrong answer. It checks symbolic identity first and samples random real points second, and returns
  `needs_review` when they disagree or the two sides have different domains (`\ln(x^2)` vs `2\ln x`). Equations are
  compared up to a constant factor, then by their solution sets; inequalities up to a positive factor.
- `MATH_EXPRESSION` settings (`readMathExpressionSettings`): `acceptedAnswers`, `compare` (`equivalent`,
  `exact_form` with `simplified | factored | expanded | lowest_terms | rationalised_denominator`, `numeric` with
  `absoluteTolerance` / `relativeTolerance` / `significantFigures`, or `set`), `units` (`unit`,
  `allowConversion`), `variables` (declare `e`, `i` or `\pi` to read them as variables) and
  `wrongAnswerFeedback`.
- `WORKED_SOLUTION` adds `answerPoints` (defaults to half the question's points) and `workingInputs`.
  `gradeMathQuestion` auto-grades the answer part and reports the working points as `pendingManualPoints`.
- `NUMERIC` settings accept `relativeTolerance` and `significantFigures` with or without the grader. With the grader,
  answers may also carry the typed `latex` (`3/4`, `1 1/2`, `\pi`, `\sqrt{2}`, `3.2\times10^4`) and `correctValue`
  may be LaTeX. Legacy `{ value }` answers grade as before.
- `normaliseMathAnswer(latex)` returns the canonical MathJSON string used to group equal answers.

## Public API overview

### 1) Keys and metadata

- `QUESTION_TYPE_KEY`
- `QuestionTypeKey`
- `QUESTION_TYPE_REGISTRY`
- `QUESTION_TYPE_IDS`
- `QUESTION_TYPE_BY_KEY`
- `QUESTION_TYPE_TYPENAME_TO_KEY`
- `QUESTION_TYPE_ID_TO_KEY`

Lookup helpers:

- `getQuestionTypeByKey(key)`
- `getQuestionTypeByTypename(typename)`
- `getQuestionTypeById(id)`
- `getQuestionTypeId(key)`

Capability helpers:

- `isAutoGradableQuestionType(key)`
- `supportsPartialCredit(key)`
- `requiresManualGrading(key)`

### 2) Exercise rendering contracts

Core types (`src/exercise-types.ts`):

- `ExerciseQuestionModel`
- `ExerciseQuestionOption`
- `ExerciseAnswerValue`
- `ExerciseRendererMode` (`edit | take | preview | view`)
- `ExerciseRendererDefinition<TRenderer>`
- `ExerciseQuestionRendererProps`

Render contracts (`src/render-contract.ts`):

- `ExerciseQuestionRenderContract`
- `ExerciseQuestionListRenderContract`
- `ExerciseQuestionImageUploader`
- `getExerciseQuestionContractKey(question, fallbackIndex)`

### 3) Renderer registry helpers (UI-agnostic)

From `src/renderer-registry.ts`:

- `ExerciseRendererRegistry<TRenderer>`
- `getRendererDefinition(registry, questionType, fallback)`
- `getRendererForMode(registry, questionType, mode, fallback)`

Important behavior:

- `mode: 'view'` resolves to `'take'` internally in `getRendererForMode`.

### 4) Answer payload and serialization

Answer payload union (`src/question-answer-payload.ts`):

- `QuestionAnswerPayload` and per-type payload interfaces (`RadioAnswerPayload`, `CheckboxAnswerPayload`, etc.)

Serializer (`src/answer-serializer.ts`):

- `serializeExerciseAnswer(question, answer)`
- `serializeExerciseAnswerMap(questions, answersByKey)`
- `SerializedExerciseAnswer`

### 5) Form state and scoring constants

Form state (`src/form-state.ts`):

- `ExerciseQuestionFormState`
- `createExerciseQuestionFormState(initialQuestions)`
- `getQuestionStateKey(question, fallbackIndex)`

Scoring constants (`src/question-scoring-rules.ts`):

- `QUESTION_SCORING_MODE`
- `ATTEMPT_SCORING_RULE`
- `SHOW_CORRECT_ANSWERS_POLICY`

## Deterministic contract guarantees

The following helpers are deterministic and should be treated as stable contracts:

- `getExerciseQuestionContractKey`
- `getQuestionStateKey`
- `getQuestionTypeById` / `getQuestionTypeId`
- `getRendererForMode`
- `serializeExerciseAnswer` / `serializeExerciseAnswerMap`

If given the same inputs, they always return the same outputs.

## Usage examples

### Resolve question type from id

```ts
import { getQuestionTypeById } from '@cio/question-types';

const metadata = getQuestionTypeById(10);
// => { key: 'ORDERING', label: 'Ordering', ... }
```

### Build a renderer registry in another package

```ts
import {
  QUESTION_TYPE_KEY,
  getRendererForMode,
  type ExerciseRendererRegistry,
  type ExerciseRendererDefinition
} from '@cio/question-types';

type Renderer = unknown;

const registry: ExerciseRendererRegistry<Renderer> = {
  [QUESTION_TYPE_KEY.RADIO]: {
    edit: 'RadioEditRenderer',
    take: 'RadioTakeRenderer',
    preview: 'RadioPreviewRenderer'
  }
};

const fallback: ExerciseRendererDefinition<Renderer> = {
  edit: 'FallbackEdit',
  take: 'FallbackTake',
  preview: 'FallbackPreview'
};

const renderer = getRendererForMode(registry, QUESTION_TYPE_KEY.RADIO, 'view', fallback);
// 'view' resolves to 'take'
```

### Serialize answers for API submission

```ts
import { serializeExerciseAnswerMap } from '@cio/question-types';

const payload = serializeExerciseAnswerMap(questions, answersByKey);
// => Array<{ questionId, optionId?, answer?, payload? }>
```

### Create question form state

```ts
import { createExerciseQuestionFormState } from '@cio/question-types';

const state = createExerciseQuestionFormState(initialQuestions);
```

## Adding a new question type

See **[ADDING_A_QUESTION_TYPE.md](./ADDING_A_QUESTION_TYPE.md)** for a step-by-step guide. At a high level:

## Build

```bash
pnpm -C packages/question-types build
```

## Notes for consumers

- Prefer importing keys/lookup helpers from this package instead of duplicating constants.
- Use `getExerciseQuestionContractKey` consistently for stable answer maps.
- Keep UI implementation in `@cio/ui`; keep domain contracts in `@cio/question-types`.
