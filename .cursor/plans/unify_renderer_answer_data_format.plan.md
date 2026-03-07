---
name: ""
overview: ""
todos: []
isProject: false
---

# Unify Renderer Format with AnswerData

## Overview

Eliminate the impedance mismatch between UI (ExerciseAnswerValue) and storage (AnswerData) by having renderers emit and consume AnswerData directly. This removes the need for `serialize` and `toRendererValue` in the codec.

## Current State

- **Renderers** emit `ExerciseAnswerValue` (heterogeneous: optionId, boolean, string, string[], etc.)
- **Storage** uses `AnswerData` (discriminated union)
- **serialize** converts ExerciseAnswerValue → AnswerData
- **toRendererValue** converts AnswerData → ExerciseAnswerValue (for display)

## Target State

- **Renderers** emit and consume `AnswerData` directly
- **Storage** uses `AnswerData`
- **Codec** only has `toApiPayload` and `fromApiPayload` (for API flat format)
- No serialize, no toRendererValue

---

## Phase 1: Update Types and Contracts

### 1.1 exercise-types.ts

- Add `AnswerData` to imports/re-exports (or keep in answer-data.ts)
- Change `ExerciseQuestionRendererProps.answer` from `ExerciseAnswerValue` to `AnswerData | null`
- Change `onAnswerChange` from `(answer: ExerciseAnswerValue) => void` to `(answer: AnswerData) => void`
- Optionally deprecate or remove `ExerciseAnswerValue` from renderer contracts (it may still be used internally in some components)

### 1.2 render-contract.ts

- Change `ExerciseQuestionRenderContract.answer` to `AnswerData | null`
- Change `ExerciseQuestionListRenderContract.answersByKey` to `Record<string, AnswerData>`

### 1.3 form-state.ts

- Change `answers: Record<string, ExerciseAnswerValue>` to `answers: Record<string, AnswerData>`

---

## Phase 2: Update Take Renderers (12 files)

Each take renderer must:

1. Accept `answer?: AnswerData` (typed for its question type)
2. Extract display value from AnswerData (e.g. `answer?.optionId` for RADIO)
3. Call `onAnswerChange(AnswerData)` when user submits, constructing the correct AnswerData shape


| Renderer          | Current emit               | New emit (AnswerData)                             |
| ----------------- | -------------------------- | ------------------------------------------------- |
| radio/take        | optionId (number)          | `{ type: 'RADIO', optionId }`                     |
| checkbox/take     | optionIds (number[])       | `{ type: 'CHECKBOX', optionIds }`                 |
| true-false/take   | boolean                    | `{ type: 'TRUE_FALSE', value: boolean }`          |
| textarea/take     | string                     | `{ type: 'TEXTAREA', text }`                      |
| short-answer/take | string                     | `{ type: 'SHORT_ANSWER', text }`                  |
| numeric/take      | number                     | `{ type: 'NUMERIC', value }`                      |
| fill-blank/take   | string                     | string[]                                          |
| file-upload/take  | { fileKey, fileName, ... } | `{ type: 'FILE_UPLOAD', fileKey, fileName, ... }` |
| matching/take     | pairs[]                    | `{ type: 'MATCHING', pairs }`                     |
| ordering/take     | string[]                   | `{ type: 'ORDERING', orderedValues }`             |
| link/take         | string[]                   | `{ type: 'LINK', urls }`                          |
| hotspot/take      | coordinates[]              | `{ type: 'HOTSPOT', coordinates }`                |


### Per-renderer pattern

```svelte
<!-- Before -->
let { answer, onAnswerChange } = $props();
onAnswerChange(selectedOptionId);

<!-- After -->
let { answer, onAnswerChange } = $props();
// answer is RadioAnswerData | undefined
const displayValue = answer?.optionId;
onAnswerChange({ type: 'RADIO', optionId: selectedOptionId });
```

---

## Phase 3: Update Preview Renderers (10 files)

Preview renderers display the answer in read-only mode. They receive `answer` and render it.

- **radio/preview**, **checkbox/preview**, **true-false/preview**: Extract optionId/optionIds/value from AnswerData for display
- **textarea/preview**, **short-answer/preview**: Extract text
- **numeric/preview**: Extract value
- **fill-blank/preview**: Extract values
- **file-upload/preview**: Extract fileKey, fileName, etc.
- **matching/preview**, **ordering/preview**, **link/preview**, **hotspot/preview**: Extract pairs/orderedValues/urls/coordinates

Preview components need the question (with options) for RADIO/CHECKBOX/TRUE_FALSE to resolve ids to labels for display. The AnswerData gives the structure; options give the labels.

---

## Phase 4: Update Dashboard Components

### 4.1 view-mode.svelte

- Change `questionnaireMetaData.answers` to `Record<string, AnswerData>`
- Replace `mapAnswerToApiPayload` usage: call `toApiPayload(answer, questionId)` directly (answer is already AnswerData)
- Remove `serializeAnswer` call from the submit flow
- `onSharedAnswerChange` receives AnswerData
- `checkForSubmission` / `formatAnswers`: answers from API are AnswerData → pass through to questionnaireMetaData

### 4.2 preview.svelte

- `grades`, `answers` in questionnaireMetaData: use AnswerData
- Pass AnswerData to QuestionRenderer contract

### 4.3 individual.svelte

- `getStudentAnswerForQuestion` returns `AnswerData` (or the raw answerData from API)
- Pass to QuestionRenderer as answer prop

### 4.4 formatAnswers (functions.ts)

- Returns `Record<string, AnswerData>` instead of `Record<string, ExerciseAnswerValue>`
- Or keep as-is if consumers expect AnswerData

### 4.5 mark-exercise-modal.svelte

- `answersToDisplay` becomes `Record<string, AnswerData>` 
- Preview receives AnswerData
- `enrichFileUploadAnswersWithUrls` may need to accept AnswerData and enrich FILE_UPLOAD entries

### 4.6 summary.svelte

- `getAnswerToQuestionOfStudent` returns AnswerData
- Chart logic extracts values from AnswerData (e.g. optionIds for option-based, text for text)

### 4.7 Store (store.ts)

- `answers` in questionnaireMetaData: `Record<string, AnswerData>`

---

## Phase 5: Simplify Answer Codec

### 5.1 Remove from AnswerCodec interface

- Remove `serialize`
- Remove `toRendererValue`

### 5.2 Remove from each codec implementation

- Delete serialize implementation
- Delete toRendererValue implementation

### 5.3 Remove exported functions

- Remove `serializeAnswer`
- Remove `deserializeAnswer` (or rename to `toDisplayValue` if still needed for enrichFileUploadAnswersWithUrls, etc.)

### 5.4 Keep

- `toApiPayload` – for API submission
- `fromApiPayload` – for API write path (payload → AnswerData)
- `ANSWER_CODECS` – lookup by type

### 5.5 Add helper if needed

- `toApiPayload(data: AnswerData, questionId: number)` – already exists
- For submission: frontend has AnswerData → toApiPayload → API
- For display: AnswerData goes directly to renderer, no conversion

---

## Phase 6: Update API and Submission Flow

### 6.1 createSubmissionService

- Already uses `fromApiPayload` to convert API payload → AnswerData
- No change if API still receives flat format

### 6.2 Optional: Accept AnswerData in API

- If we change the submission API to accept `AnswerData` directly (e.g. `answers: AnswerData[]`), we can skip `fromApiPayload` and `toApiPayload` for submission. But the current API uses flat `{ questionId, optionId?, answer? }`. Plan assumes we keep that for now.

---

## Phase 7: enrichFileUploadAnswersWithUrls

- Currently expects `Record<string, unknown>` and looks for `fileKey` in values
- With AnswerData, FILE_UPLOAD answers are `{ type: 'FILE_UPLOAD', fileKey, fileName, ... }`
- Update to detect `value?.type === 'FILE_UPLOAD'` and use `value.fileKey`
- Return enriched AnswerData (add fileUrl to the object)

---

## Phase 8: Migration / Compatibility

- **No DB migration** – AnswerData format is unchanged
- **Existing data** – Already AnswerData in answer_data column
- **ExerciseAnswerValue** – Can be deprecated or removed from exercise-types once all consumers are updated

---

## Phase 9: Update ADDING_A_QUESTION_TYPE.md

**File:** `packages/question-types/ADDING_A_QUESTION_TYPE.md`

Update the guide so new question types follow the AnswerData-only flow.

### 9.1 Step 3 — Answer data type and codec

**3a. answer-data.ts** — No change; still add the AnswerData type and union.

**3b. answer-codecs.ts** — Simplify the codec example:

- Remove `serialize` — renderers emit AnswerData directly
- Remove `toRendererValue` — renderers consume AnswerData directly
- Keep only `toApiPayload` and `fromApiPayload`

Example to replace the current Step 3b block:

```typescript
const MY_NEW_TYPE_CODEC: AnswerCodec<MyNewAnswerData> = {
  type: 'MY_NEW_TYPE',
  toApiPayload(data, questionId) {
    return { questionId, answer: JSON.stringify({ type: 'MY_NEW_TYPE', value: data.value }) };
  },
  fromApiPayload(payload) {
    if (!payload.answer) return null;
    const { value } = JSON.parse(payload.answer) as { type: 'MY_NEW_TYPE'; value: string };
    return { type: 'MY_NEW_TYPE', value };
  }
};
```

### 9.2 Step 7 — Implement renderers

Update the renderer section to state:

- `answer` prop is `AnswerData | null` (typed for the question type, e.g. `MyNewAnswerData`)
- `onAnswerChange` receives `AnswerData` — renderers must emit the full AnswerData shape, e.g. `onAnswerChange({ type: 'MY_NEW_TYPE', value })`
- Take renderer: extract display value from `answer?.value` (or relevant field), emit `{ type: 'MY_NEW_TYPE', value }` on change
- Preview renderer: read from `answer` (AnswerData) for display

### 9.3 Checklist

- Update checklist item for the codec to say "`AnswerCodec` (toApiPayload, fromApiPayload)" — no serialize/toRendererValue

### 9.4 Step 9 — Verify

- Update the test bullet to mention: "codec (toApiPayload ↔ fromApiPayload)"
- Remove references to "serialize" in the verification steps

---

## Files to Modify (Summary)


| Area              | Files                                                                                                                                 |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| Types             | `exercise-types.ts`, `render-contract.ts`, `form-state.ts`                                                                            |
| Codec             | `answer-codecs.ts` (remove serialize, toRendererValue)                                                                                |
| Take renderers    | 12× `packages/ui/.../renderers/*/take.svelte`                                                                                         |
| Preview renderers | 10× `packages/ui/.../renderers/*/preview.svelte`                                                                                      |
| Dashboard         | `view-mode.svelte`, `preview.svelte`, `individual.svelte`, `summary.svelte`, `mark-exercise-modal.svelte`, `store.ts`, `functions.ts` |
| Utils             | `enrichFileUploadAnswersWithUrls` in functions.ts                                                                                     |
| Storybook         | `question-type-modes.svelte`, `question-fixtures.ts` if they use answer                                                               |
| ordering-utils    | `applyOrderingAnswer` – change to accept AnswerData (OrderingAnswerData)                                                              |
| Docs              | `packages/question-types/ADDING_A_QUESTION_TYPE.md`                                                                                   |


---

## Estimated Effort

- Phase 1: ~30 min
- Phase 2: ~2–3 hours (12 renderers, each ~10–15 min)
- Phase 3: ~1–2 hours (10 preview components)
- Phase 4: ~1–2 hours (dashboard)
- Phase 5: ~30 min (codec cleanup)
- Phase 6: minimal
- Phase 7: ~15 min
- Phase 8: N/A
- Phase 9: ~15 min (update ADDING_A_QUESTION_TYPE.md)

**Total: ~6–8 hours**

---

## Risks

- **Preview mode** for edit: Edit renderers may not use answer; verify which modes each renderer supports
- **ordering-utils**: `applyOrderingAnswer` merges initial items with answer; ensure it works with `OrderingAnswerData`
- **Storybook**: Update fixtures and stories to pass AnswerData

