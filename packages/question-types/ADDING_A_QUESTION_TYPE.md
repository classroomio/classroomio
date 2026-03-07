# Guide: Adding a New Question Type

This guide walks through adding a new question type to ClassroomIO. Question types are defined in `@cio/question-types` (contracts), implemented as renderers in `@cio/ui`, and wired into the dashboard and API. Follow these steps in order.

---

## Overview

A question type flows through several layers:

1. **`@cio/question-types`** — Keys, metadata, answer serialization (codecs)
2. **`@cio/db`** — Database seed/migration for the `question_type` table
3. **`@cio/ui`** — Edit, take, and preview renderers
4. **`apps/dashboard`** — Translation keys, question type picker
5. **`apps/api`** — Uses the above via `@cio/question-types`; no code changes usually needed

---

## Step 1: Add the question type key

**File:** `packages/question-types/src/question-type-keys.ts`

Add a new key to the `QUESTION_TYPE_KEY` constant:

```typescript
export const QUESTION_TYPE_KEY = {
  // ... existing keys
  MY_NEW_TYPE: 'MY_NEW_TYPE'
} as const;
```

The key must be unique and is used everywhere (registry, codecs, renderer lookup). Use `SCREAMING_SNAKE_CASE`.

---

## Step 2: Add registry metadata

**File:** `packages/question-types/src/question-type-registry.ts`

Add an entry to `QUESTION_TYPE_REGISTRY` with a unique numeric `id`:

```typescript
{
  key: QUESTION_TYPE_KEY.MY_NEW_TYPE,
  typename: 'MY_NEW_TYPE',
  label: 'My New Type',
  id: 13,  // Use the next unused id (currently 1–12 are used)
  autoGradable: true,       // Can the system auto-grade?
  supportsPartialCredit: true,  // For auto-gradable: allow partial points?
  manualGradingRequired: false  // Must a human grade this?
}
```

- `typename` must match the key string; it is stored in the DB.
- `id` must match the `question_type.id` in the database (see Step 3).
- `autoGradable`: `true` if grading can be automated (e.g. multiple choice, numeric).
- `supportsPartialCredit`: only meaningful when `autoGradable` is true.
- `manualGradingRequired`: `true` for free-text, file uploads, etc.

---

## Step 3: Add answer data type and codec

### 3a. Define `AnswerData` in `answer-data.ts`

**File:** `packages/question-types/src/answer-data.ts`

```typescript
export type MyNewAnswerData = { type: 'MY_NEW_TYPE'; value: string }; // adjust shape as needed

// Add to the AnswerData union
export type AnswerData =
  | RadioAnswerData
  // ... existing types
  | MyNewAnswerData;
```

Use a `type` discriminator matching your key. Design the shape to fit both the renderer (take/edit) and storage.

### 3b. Implement an `AnswerCodec` in `answer-codecs.ts`

**File:** `packages/question-types/src/answer-codecs.ts`

Implement the `AnswerCodec` interface:

Renderers emit and consume `AnswerData` directly. The codec only needs `toApiPayload` and `fromApiPayload`:

```typescript
const MY_NEW_TYPE_CODEC: AnswerCodec<MyNewAnswerData> = {
  type: 'MY_NEW_TYPE',
  toApiPayload(data, questionId) {
    return { questionId, answer: JSON.stringify({ type: 'MY_NEW_TYPE', value: data.value }) };
  },
  fromApiPayload(payload, question) {
    if (!payload.answer) return null;
    try {
      const parsed = JSON.parse(payload.answer) as { type?: string; value?: string };
      if (parsed?.type === 'MY_NEW_TYPE' && typeof parsed.value === 'string') {
        return { type: 'MY_NEW_TYPE', value: parsed.value };
      }
    } catch {}
    return null;
  }
};
```

Register it in `ANSWER_CODECS`:

```typescript
export const ANSWER_CODECS: Record<QuestionTypeKey, AnswerCodec> = {
  // ... existing entries
  [QUESTION_TYPE_KEY.MY_NEW_TYPE]: MY_NEW_TYPE_CODEC
};
```

---

## Step 4: Optional — extend question answer payload

**File:** `packages/question-types/src/question-answer-payload.ts`

If you want a typed payload for API or validation, add:

```typescript
export interface MyNewAnswerPayload extends BaseAnswerPayload {
  type: typeof QUESTION_TYPE_KEY.MY_NEW_TYPE;
  value: string;
}

// Add to QuestionAnswerPayload union
```

This is optional; the codecs are the source of truth for serialization.

---

## Step 5: Add label keys (if the renderer needs them)

**File:** `packages/question-types/src/exercise-types.ts`

If your renderer uses `getExerciseQuestionLabel`, add keys to `ExerciseQuestionLabelKey`:

```typescript
export type ExerciseQuestionLabelKey =
  | 'common.option_prefix'
  // ... existing keys
  | 'my_new_type.edit.placeholder'
  | 'my_new_type.take.helper'
  | 'my_new_type.preview.helper';
```

---

## Step 6: Database — seed and migration

### 6a. Seed (for new environments)

**File:** `packages/db/src/utils/seed/questionType.ts`

Add a seed entry so new databases get the type:

```typescript
{
  label: 'My New Type',
  typename: 'MY_NEW_TYPE',
  createdAt: '2021-08-07 18:49:46.246529+00',
  updatedAt: '2021-08-15 00:57:08.12069+00'
}
```

The `id` is auto-generated. Use the next sequential id (e.g. 13) in `QUESTION_TYPE_REGISTRY` so it matches after seed runs.

### 6b. Migration (for existing databases)

For existing production databases, add a migration that inserts the new question type:

```sql
INSERT INTO question_type (label, typename) VALUES ('My New Type', 'MY_NEW_TYPE');
```

If you need a specific `id` to match the registry, you may need to use `SELECT setval(...)` or an `ON CONFLICT`-style approach depending on your migration strategy.

---

## Step 7: Implement renderers in `@cio/ui`

Create three Svelte components under `packages/ui/src/custom/exercise-question/renderers/`:

```
renderers/my-new-type/
  edit.svelte   — authoring/editing the question
  take.svelte   — student answering
  preview.svelte — showing correct/expected answer
```

Each receives `ExerciseQuestionRendererProps` from `@cio/question-types`:

- `question`: `ExerciseQuestionModel`
- `answer`: `AnswerData | null` (typed for your question type, e.g. `MyNewAnswerData`)
- `onAnswerChange`: `(answer: AnswerData) => void` — renderers must emit the full AnswerData shape, e.g. `onAnswerChange({ type: 'MY_NEW_TYPE', value })`
- `onQuestionChange` as needed
- `labels` for i18n
- `onImageUpload`, `onFileUpload` if needed

**Take renderer:** Extract display value from `answer?.value` (or the relevant field), emit `{ type: 'MY_NEW_TYPE', value }` on change.

**Preview renderer:** Read from `answer` (AnswerData) for display.

### Register in the renderer contract

**File:** `packages/ui/src/custom/exercise-question/renderer-contract.ts`

```typescript
import { default as MyNewTypeEdit } from './renderers/my-new-type/edit.svelte';
import { default as MyNewTypeTake } from './renderers/my-new-type/take.svelte';
import { default as MyNewTypePreview } from './renderers/my-new-type/preview.svelte';

// In EXERCISE_QUESTION_RENDERER_CONTRACT:
[QUESTION_TYPE_KEY.MY_NEW_TYPE]: {
  edit: MyNewTypeEdit,
  take: MyNewTypeTake,
  preview: MyNewTypePreview
}
```

Export the components from `packages/ui/src/custom/exercise-question/index.ts` if they are used directly elsewhere.

---

## Step 8: Dashboard — translations and picker

### 8a. Translation key

**File:** `apps/dashboard/src/lib/features/ui/question/constants.ts`

Add to `QUESTION_TYPE_LABEL_KEYS`:

```typescript
[QUESTION_TYPE_KEY.MY_NEW_TYPE]: 'course.navItem.lessons.exercises.all_exercises.edit_mode.question_types.my_new_type',
```

### 8b. Translation strings

**File:** `apps/dashboard/src/lib/utils/translations/en.json`

Add under the appropriate path, e.g.:

```json
"course": {
  "navItem": {
    "lessons": {
      "exercises": {
        "all_exercises": {
          "edit_mode": {
            "question_types": {
              "my_new_type": "My New Type"
            }
          }
        }
      }
    }
  }
}
```

Add strings for any `ExerciseQuestionLabelKey` entries used by your renderer (e.g. `my_new_type.edit.placeholder`, `my_new_type.take.helper`).

### 8c. Premium / visibility (optional)

In `constants.ts`, you can:

- Add to `PREMIUM_QUESTION_TYPE_KEYS` if the type is paid-only.
- Add to `HIDDEN_QUESTION_TYPE_KEYS` if it should not appear in the picker yet.

---

## Step 9: Verify

1. **Build**

   ```bash
   pnpm --filter @cio/question-types build
   pnpm --filter @cio/ui build
   pnpm --filter @cio/db build
   ```

2. **Tests**
   - Run `packages/question-types` tests.
   - Optionally add a test for your codec (`toApiPayload` ↔ `fromApiPayload`).

3. **Integration**
   - Create an exercise with the new question type.
   - Submit an answer.
   - Confirm serialization, storage, and display in view/submissions.

---

## Checklist

- [ ] `QUESTION_TYPE_KEY` in `question-type-keys.ts`
- [ ] Entry in `QUESTION_TYPE_REGISTRY` with correct `id`, `typename`, capabilities
- [ ] `AnswerData` type and union in `answer-data.ts`
- [ ] `AnswerCodec` (`toApiPayload`, `fromApiPayload`) in `answer-codecs.ts` and registration in `ANSWER_CODECS`
- [ ] Optional: payload in `question-answer-payload.ts`
- [ ] Optional: label keys in `exercise-types.ts`
- [ ] Seed in `questionType.ts` and migration for existing DBs
- [ ] Three renderers (edit, take, preview) in `@cio/ui`
- [ ] Registration in `EXERCISE_QUESTION_RENDERER_CONTRACT`
- [ ] Translation keys in dashboard `constants.ts` and `en.json`
- [ ] Build and manual/integration testing

---

## Reference: Existing Types

| Key          | Id  | Capabilities                  |
| ------------ | --- | ----------------------------- |
| RADIO        | 1   | Auto-gradable                 |
| CHECKBOX     | 2   | Auto-gradable, partial credit |
| TEXTAREA     | 3   | Manual grading                |
| TRUE_FALSE   | 4   | Auto-gradable                 |
| SHORT_ANSWER | 5   | Manual grading                |
| NUMERIC      | 6   | Auto-gradable, partial credit |
| FILL_BLANK   | 7   | Auto-gradable, partial credit |
| FILE_UPLOAD  | 8   | Manual grading                |
| MATCHING     | 9   | Auto-gradable, partial credit |
| ORDERING     | 10  | Auto-gradable, partial credit |
| HOTSPOT      | 11  | Auto-gradable, partial credit |
| LINK         | 12  | Manual grading                |

Use the next available id (13) for your new type, and ensure the DB `question_type` row has a matching id.
