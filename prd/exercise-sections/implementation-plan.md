# Exercise Sections — Implementation Plan

## Delivery Phases

The work is broken into 4 sequential phases. Each phase is independently shippable and testable. Phases must be completed in order because later phases depend on earlier ones.

---

## Phase 1: Database & Shared Types (Foundation)

**Goal**: Schema changes, shared types, and validation — no UI or API behavior changes yet.

### Ticket 1.1: Drizzle Schema — `exercise_section` Table

**Priority**: P0
**Estimate**: 1–2 hours

**What to do**:

1. Open `packages/db/src/schema.ts`.
2. Add the `exerciseSection` table definition **above** the `question` table (because `question` will reference it):

```typescript
export const exerciseSection = pgTable(
  'exercise_section',
  {
    id: uuid()
      .default(sql`gen_random_uuid()`)
      .primaryKey()
      .notNull(),
    exerciseId: uuid('exercise_id').notNull(),
    title: varchar().notNull().default('Untitled Section'),
    description: text(),
    order: bigint({ mode: 'number' }).notNull().default(0),
    afterBehavior: jsonb('after_behavior')
      .notNull()
      .default({ action: 'continue' }),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow()
  },
  (table) => [
    foreignKey({
      columns: [table.exerciseId],
      foreignColumns: [exercise.id],
      name: 'exercise_section_exercise_id_fkey'
    }).onDelete('cascade'),
    index('idx_exercise_section_exercise_id').on(table.exerciseId)
  ]
);
```

3. Add `sectionId` column to the existing `question` table definition. Find the `question` table object and add this column after `exerciseId`:

```typescript
sectionId: uuid('section_id'),
```

4. Add a foreign key constraint in the `question` table's constraint array:

```typescript
foreignKey({
  columns: [table.sectionId],
  foreignColumns: [exerciseSection.id],
  name: 'question_section_id_fkey'
}).onDelete('set null')
```

5. Add `sectionDisplayMode` column to the existing `exercise` table definition:

```typescript
sectionDisplayMode: varchar('section_display_mode').default('one_question'),
```

6. Run `pnpm --filter @cio/db build` and fix any type errors.

**Files to change**:
- `packages/db/src/schema.ts`

**How to verify**:
- `pnpm --filter @cio/db build` succeeds with no errors.

---

### Ticket 1.2: Database Migration Script

**Priority**: P0
**Estimate**: 1 hour

**What to do**:

1. Generate a Drizzle migration from the schema changes in Ticket 1.1.
2. The generated SQL should create the `exercise_section` table, add `section_id` to `question`, add `section_display_mode` to `exercise`, and create the index.
3. Review the generated migration carefully to ensure:
   - `section_id` on `question` is nullable (no `NOT NULL`).
   - `section_display_mode` on `exercise` has default `'one_question'`.
   - The `exercise_section` table has `ON DELETE CASCADE` for `exercise_id`.
   - The `question.section_id` FK has `ON DELETE SET NULL`.

**How to verify**:
- Migration runs successfully against a local database.
- Existing data is not affected.
- `SELECT * FROM exercise_section` returns empty.
- `SELECT section_id FROM question LIMIT 1` returns `NULL`.

---

### Ticket 1.3: Shared TypeScript Types

**Priority**: P0
**Estimate**: 1 hour

**What to do**:

1. Create `packages/question-types/src/exercise-section-types.ts`:

```typescript
import type { ExerciseQuestionModel } from './exercise-types';

export type ExerciseSectionAfterAction = 'continue' | 'go_to_section' | 'submit';

export interface ExerciseSectionAfterBehavior {
  action: ExerciseSectionAfterAction;
  sectionId?: string;
}

export type ExerciseSectionDisplayMode = 'one_question' | 'all_questions';

export interface ExerciseSectionModel {
  id?: string;
  title: string;
  description?: string | null;
  order: number;
  afterBehavior: ExerciseSectionAfterBehavior;
  questions: ExerciseQuestionModel[];
}
```

2. Export from `packages/question-types/src/index.ts`:

```typescript
export * from './exercise-section-types';
```

3. Run `pnpm --filter @cio/question-types build`.

**Files to create**:
- `packages/question-types/src/exercise-section-types.ts`

**Files to change**:
- `packages/question-types/src/index.ts`

**How to verify**:
- `pnpm --filter @cio/question-types build` succeeds.
- Types are importable: `import { ExerciseSectionModel } from '@cio/question-types'` resolves.

---

### Ticket 1.4: Zod Validation Schemas for Sections

**Priority**: P0
**Estimate**: 1–2 hours

**What to do**:

1. Create `packages/utils/src/validation/exercise/exercise-section.ts`:

```typescript
import { z } from 'zod';

export const ZExerciseSectionAfterBehavior = z.discriminatedUnion('action', [
  z.object({ action: z.literal('continue') }),
  z.object({ action: z.literal('go_to_section'), sectionId: z.string().uuid() }),
  z.object({ action: z.literal('submit') })
]);

export const ZExerciseSection = z.object({
  id: z.string().uuid().optional(),
  title: z.string().min(1, 'Section title is required'),
  description: z.string().optional().nullable(),
  order: z.number().int().min(0),
  afterBehavior: ZExerciseSectionAfterBehavior.default({ action: 'continue' }),
  questionIds: z.array(z.string()).optional()
});

export const ZExerciseSectionCreate = ZExerciseSection.omit({ id: true });
export const ZExerciseSectionUpdate = ZExerciseSection.partial().required({ id: true });

export type TExerciseSection = z.infer<typeof ZExerciseSection>;
```

2. Update the existing exercise validation file to accept optional `sections` and `sectionDisplayMode`. Find the existing `ZExerciseUpdate` in `packages/utils/src/validation/exercise/exercise.ts` and extend it:

```typescript
import { ZExerciseSection } from './exercise-section';

// Add to ZExerciseUpdate:
sections: z.array(ZExerciseSection).optional(),
sectionDisplayMode: z.enum(['one_question', 'all_questions']).optional()
```

3. Export from the validation index:

```typescript
export * from './exercise-section';
```

**Files to create**:
- `packages/utils/src/validation/exercise/exercise-section.ts`

**Files to change**:
- `packages/utils/src/validation/exercise/exercise.ts`
- `packages/utils/src/validation/exercise/index.ts` (or wherever exercise validation is exported)

**How to verify**:
- `pnpm --filter @cio/utils build` succeeds.
- `ZExerciseSection.parse({ title: 'Test', order: 0 })` succeeds.
- `ZExerciseSection.parse({ title: '', order: 0 })` fails with "Section title is required".

---

### Ticket 1.5: Database Query Functions for Sections

**Priority**: P0
**Estimate**: 2–3 hours

**What to do**:

1. Create `packages/db/src/queries/exercise/exercise-section.ts` with these functions:

```typescript
import { db } from '../../db';
import { exerciseSection, question } from '../../schema';
import { eq, inArray, sql } from 'drizzle-orm';

export async function getExerciseSectionsByExerciseId(exerciseId: string) {
  return db
    .select()
    .from(exerciseSection)
    .where(eq(exerciseSection.exerciseId, exerciseId))
    .orderBy(exerciseSection.order);
}

export async function getExerciseSectionsByExerciseIds(exerciseIds: string[]) {
  if (exerciseIds.length === 0) return [];
  return db
    .select()
    .from(exerciseSection)
    .where(inArray(exerciseSection.exerciseId, exerciseIds))
    .orderBy(exerciseSection.order);
}

export async function createExerciseSections(
  sections: Array<{
    exerciseId: string;
    title: string;
    description?: string | null;
    order: number;
    afterBehavior?: { action: string; sectionId?: string };
  }>
) {
  if (sections.length === 0) return [];
  return db.insert(exerciseSection).values(sections).returning();
}

export async function updateExerciseSection(
  sectionId: string,
  data: Partial<{
    title: string;
    description: string | null;
    order: number;
    afterBehavior: { action: string; sectionId?: string };
  }>
) {
  return db
    .update(exerciseSection)
    .set({ ...data, updatedAt: new Date().toISOString() })
    .where(eq(exerciseSection.id, sectionId))
    .returning();
}

export async function deleteExerciseSection(sectionId: string) {
  return db.delete(exerciseSection).where(eq(exerciseSection.id, sectionId));
}

export async function moveQuestionToSection(questionId: number, sectionId: string | null) {
  return db
    .update(question)
    .set({ sectionId })
    .where(eq(question.id, questionId));
}

export async function bulkMoveQuestionsToSection(questionIds: number[], sectionId: string | null) {
  if (questionIds.length === 0) return;
  return db
    .update(question)
    .set({ sectionId })
    .where(inArray(question.id, questionIds));
}
```

2. Export from the queries index file (create or update `packages/db/src/queries/exercise/index.ts`):

```typescript
export * from './exercise-section';
```

**Files to create**:
- `packages/db/src/queries/exercise/exercise-section.ts`

**Files to change**:
- `packages/db/src/queries/exercise/index.ts`
- `packages/db/src/queries/index.ts` (if needed for top-level re-export)

**How to verify**:
- `pnpm --filter @cio/db build` succeeds.
- Functions are importable from `@db/queries`.

---

## Phase 2: API Layer

**Goal**: API endpoints accept and return sections. No dashboard changes yet — testable via API calls.

### Ticket 2.1: Exercise Fetch — Return Sections

**Priority**: P0
**Estimate**: 2–3 hours

**What to do**:

1. Open the exercise fetch service/query (likely `packages/db/src/queries/exercise/exercise.ts` or `apps/api/src/services/exercise/exercise.ts`).
2. After fetching an exercise and its questions, also fetch sections:

```typescript
const sections = await getExerciseSectionsByExerciseId(exerciseId);
```

3. Group questions by `sectionId`:
   - Questions with a `sectionId` go into their respective section's `questions` array.
   - Questions without a `sectionId` go into the top-level `questions` array.
4. Return the response shaped as:

```typescript
{
  ...exercise,
  sectionDisplayMode: exercise.sectionDisplayMode,
  sections: sections.map((section) => ({
    id: section.id,
    title: section.title,
    description: section.description,
    order: section.order,
    afterBehavior: section.afterBehavior,
    questions: questionsInSection  // sorted by order
  })),
  questions: unsectionedQuestions  // sorted by order
}
```

5. For backward compatibility, if there are no sections, `sections` is `[]` and all questions are in `questions`.

**Files to change**:
- Exercise fetch query/service file
- Exercise route handler (response shape)

**How to verify**:
- `GET /course/:courseId/exercise/:exerciseId` returns `sections: []` for existing exercises.
- After manually inserting a section and assigning questions to it, the endpoint returns the section with nested questions.

---

### Ticket 2.2: Exercise Update — Accept Sections

**Priority**: P0
**Estimate**: 3–4 hours

**What to do**:

1. Open the exercise update service (likely `apps/api/src/services/exercise/exercise.ts`).
2. Accept `sections` and `sectionDisplayMode` in the update payload.
3. Implement section upsert logic:

```
For each section in the payload:
  - If section has `id` and exists in DB → update title, description, order, afterBehavior
  - If section has no `id` → create new section
  - Sections in DB that are NOT in the payload → delete them

For each section:
  - Get `questionIds` from the section payload
  - Update each question's `sectionId` to this section's ID
  - Update each question's `order` based on its position in `questionIds`
```

4. Validation rules:
   - If `sections` is provided and non-empty, every non-deleted question must be assigned to a section.
   - If any section has `afterBehavior.action === 'go_to_section'`, the referenced `sectionId` must exist in the same exercise.
   - If `sections` is empty or omitted, don't touch existing sections.

5. Update `sectionDisplayMode` on the exercise if provided.

**Files to change**:
- `apps/api/src/services/exercise/exercise.ts`
- `apps/api/src/routes/course/exercise.ts` (accept new fields in validator)

**How to verify**:
- `PUT /course/:courseId/exercise/:exerciseId` with `sections: [{ title: 'Part A', order: 0, questionIds: ['q1', 'q2'] }]` creates a section and assigns questions.
- Sending the same request with an updated title updates the section.
- Sending a request without the section deletes it.
- `sectionDisplayMode` persists correctly.
- Invalid `go_to_section` reference returns a 400 error.

---

### Ticket 2.3: Submission Fetch — Section-Grouped Response

**Priority**: P1
**Estimate**: 2–3 hours

**What to do**:

1. Open the submission fetch service (used by the grading/submissions views).
2. When returning submission data for an exercise that has sections:
   - Fetch sections for the exercise.
   - Group question answers by section.
   - Compute per-section subtotals (sum of points awarded) and max points (sum of question points).
   - Return a `sections` array with grouped answers alongside the existing flat data.
3. For exercises without sections, return the existing flat response (backward compatible).

**Response shape** (when sections exist):

```typescript
{
  // existing fields...
  sections: [
    {
      sectionId: 'uuid',
      sectionTitle: 'Part A',
      subtotal: 15,
      maxPoints: 20,
      answers: [/* answers for questions in this section */]
    },
    // ...
  ],
  totalScore: 35,
  maxScore: 50
}
```

**Files to change**:
- Submission fetch service/query
- Submission route handler

**How to verify**:
- Submission fetch for sectionless exercise returns existing shape unchanged.
- Submission fetch for sectioned exercise returns `sections` with correct groupings and subtotals.

---

### Ticket 2.4: Clone Service — Support Sections

**Priority**: P1
**Estimate**: 2–3 hours

**What to do**:

1. Open `apps/api/src/services/course/clone.ts`.
2. In `cloneExercises`, after creating new exercises:

```typescript
// 4a. Fetch sections for old exercises
const oldExerciseIds = oldExercises.map((ex) => ex.id);
const oldSections = await getExerciseSectionsByExerciseIds(oldExerciseIds);

let sectionIdMap = new Map<string, string>();

if (oldSections.length > 0) {
  // 4b. Create new sections with mapped exercise IDs
  const newSections = await createExerciseSections(
    oldSections.map((section) => ({
      title: section.title,
      description: section.description,
      order: section.order,
      afterBehavior: section.afterBehavior,
      exerciseId: exerciseIdMap.get(section.exerciseId)!
    }))
  );

  // 4c. Build section ID map
  oldSections.forEach((oldSection, index) => {
    sectionIdMap.set(oldSection.id, newSections[index].id);
  });

  // 4d. Remap afterBehavior.sectionId references
  for (const newSection of newSections) {
    const behavior = newSection.afterBehavior as any;
    if (behavior?.action === 'go_to_section' && behavior.sectionId) {
      const remappedId = sectionIdMap.get(behavior.sectionId);
      if (remappedId) {
        await updateExerciseSection(newSection.id, {
          afterBehavior: { action: 'go_to_section', sectionId: remappedId }
        });
      }
    }
  }
}
```

3. When inserting cloned questions, include `sectionId`:

```typescript
sectionId: question.sectionId ? sectionIdMap.get(question.sectionId) ?? null : null
```

4. Also copy `sectionDisplayMode` when creating the new exercise.

**Files to change**:
- `apps/api/src/services/course/clone.ts`

**How to verify**:
- Clone a course with sectioned exercises.
- Verify cloned exercise has same number of sections with correct titles.
- Verify questions are assigned to correct cloned sections.
- Verify afterBehavior `sectionId` references point to the NEW section IDs (not old ones).
- Verify `sectionDisplayMode` is preserved.

---

## Phase 3: Dashboard — Edit Mode

**Goal**: Instructors can create, edit, reorder, and delete sections. Questions can be moved between sections.

### Ticket 3.1: Extend Exercise Store with Section State

**Priority**: P0
**Estimate**: 2–3 hours

**What to do**:

1. Open `apps/dashboard/src/lib/features/course/components/exercise/store.ts`.
2. Add the `ExerciseSectionState` interface and extend the `questionnaire` writable:

```typescript
import type {
  ExerciseSectionAfterBehavior,
  ExerciseSectionDisplayMode
} from '@cio/question-types';

export interface ExerciseSectionState {
  id: string;
  title: string;
  description: string | null;
  order: number;
  afterBehavior: ExerciseSectionAfterBehavior;
  isDirty?: boolean;
  deletedAt?: string;
}
```

Add `sections` and `sectionDisplayMode` to the questionnaire writable's type and default value (see PRD Section 7.1).

3. Add helper functions (see PRD Section 7.4):
   - `handleAddSection()`
   - `handleRemoveSection(sectionId, moveQuestionsToSectionId?)`
   - `handleMoveQuestionToSection(questionId, sectionId)`
   - `handleUpdateSectionAfterBehavior(sectionId, afterBehavior)`
   - `getQuestionsForSection(questions, sectionId)`
   - `hasSections(sections)`
   - `handleReorderSections(orderedSectionIds)`

4. Update `handleAddQuestion()` to accept an optional `sectionId` parameter. When sections exist, the new question must have a `sectionId`.

5. Extend `Question` type in `apps/dashboard/src/lib/features/course/types.ts` to include `sectionId`.

6. Extend the metadata store to include `currentSectionIndex` and `sectionPhase`.

**Files to change**:
- `apps/dashboard/src/lib/features/course/components/exercise/store.ts`
- `apps/dashboard/src/lib/features/course/types.ts`

**How to verify**:
- Import and call `handleAddSection()` — store updates with a new section.
- `getQuestionsForSection()` returns filtered questions.
- `handleMoveQuestionToSection()` updates the question's `sectionId`.
- `pnpm --filter @cio/dashboard build` succeeds.

---

### Ticket 3.2: Section Header UI Component

**Priority**: P0
**Estimate**: 2–3 hours

**What to do**:

1. Create `packages/ui/src/custom/exercise-question/section-header.svelte`:

```typescript
interface Props {
  title: string;
  description?: string | null;
  sectionNumber: number;
  totalSections: number;
  questionCount?: number;
  totalPoints?: number;
  mode: 'edit' | 'take' | 'preview' | 'view';
  onTitleChange?: (title: string) => void;
  onDescriptionChange?: (description: string) => void;
  onDelete?: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  canMoveUp?: boolean;
  canMoveDown?: boolean;
  labels?: Record<string, string>;
}
```

2. In **edit** mode, render:
   - A badge showing "Section N of M" (styled similar to the Google Forms purple badge in the reference image).
   - An editable title input (inline, not a dialog).
   - An optional description textarea (placeholder: "Description (optional)").
   - A close button (✕) and a three-dot menu with "Move up", "Move down", "Delete section".

3. In **take** mode, render:
   - Section title (read-only, prominent).
   - Section description (read-only).
   - Question count and total points.
   - No edit controls.

4. In **preview/view** mode, render:
   - Section title as a heading.
   - Section description below it.
   - No interactive controls.

5. Export from `packages/ui/src/custom/exercise-question/index.ts`.

**Files to create**:
- `packages/ui/src/custom/exercise-question/section-header.svelte`

**Files to change**:
- `packages/ui/src/custom/exercise-question/index.ts`

**How to verify**:
- Component renders correctly in all modes.
- Edit mode: typing in title/description fires callbacks.
- `pnpm --filter @cio/ui build` succeeds.

---

### Ticket 3.3: Section After-Behavior Dropdown

**Priority**: P0
**Estimate**: 1–2 hours

**What to do**:

1. Create `packages/ui/src/custom/exercise-question/section-after-behavior.svelte`:

```typescript
interface Props {
  sectionIndex: number;
  allSections: Array<{ id: string; title: string; order: number }>;
  afterBehavior: ExerciseSectionAfterBehavior;
  onChange: (behavior: ExerciseSectionAfterBehavior) => void;
  labels: {
    afterSectionPrefix: string;
    continue: string;
    goToSection: string;
    submit: string;
  };
}
```

2. Render a row at the bottom of each section card:
   - Label: "After section {N}" (left side).
   - A `<Select>` dropdown (right side) with options:
     - "Continue to next section" → `{ action: 'continue' }`
     - "Go to section: [Section Title]" → one entry per OTHER section → `{ action: 'go_to_section', sectionId: '...' }`
     - "Submit exercise" → `{ action: 'submit' }`
   - The currently selected option is shown in the trigger.

3. Style to match the Google Forms reference (see reference image): the row sits inside the section card, slightly separated from the questions above.

4. Export from `packages/ui/src/custom/exercise-question/index.ts`.

**Files to create**:
- `packages/ui/src/custom/exercise-question/section-after-behavior.svelte`

**Files to change**:
- `packages/ui/src/custom/exercise-question/index.ts`

**How to verify**:
- Dropdown renders all options.
- Selecting an option fires `onChange` with the correct payload.
- "Go to section" shows other section titles (not the current one).
- `pnpm --filter @cio/ui build` succeeds.

---

### Ticket 3.4: Edit Mode — Section-Grouped Editor

**Priority**: P0
**Estimate**: 4–6 hours

**What to do**:

This is the largest ticket. It modifies `edit-mode.svelte` to render questions inside section groups when sections exist.

1. Open `apps/dashboard/src/lib/features/course/components/exercise/edit-mode.svelte`.

2. Add a conditional: if `hasSections($questionnaire.sections)`, render the section-grouped editor. Otherwise, render the existing flat editor (no changes to the current code path).

3. For the section-grouped editor:

```svelte
{#each activeSections as section, sectionIndex}
  <div class="section-card">
    <SectionHeader
      title={section.title}
      description={section.description}
      sectionNumber={sectionIndex + 1}
      totalSections={activeSections.length}
      mode="edit"
      onTitleChange={(title) => updateSection(section.id, { title })}
      onDescriptionChange={(desc) => updateSection(section.id, { description: desc })}
      onDelete={() => initDeleteSection(section.id)}
      onMoveUp={() => moveSectionUp(section.id)}
      onMoveDown={() => moveSectionDown(section.id)}
      canMoveUp={sectionIndex > 0}
      canMoveDown={sectionIndex < activeSections.length - 1}
    />

    {#each getQuestionsForSection($questionnaire.questions, section.id) as question}
      {#if !question.deletedAt}
        <!-- Reuse existing QuestionContainer + QuestionRenderer markup -->
        <QuestionContainer ...>
          ...existing question editing UI...
        </QuestionContainer>
      {/if}
    {/each}

    <div class="section-footer">
      <Button onclick={() => handleAddQuestion(section.id)}>
        + Add Question
      </Button>
      <SectionAfterBehavior
        sectionIndex={sectionIndex}
        allSections={activeSections}
        afterBehavior={section.afterBehavior}
        onChange={(behavior) => handleUpdateSectionAfterBehavior(section.id, behavior)}
        labels={sectionAfterBehaviorLabels}
      />
    </div>
  </div>
{/each}
```

4. Add an "Add Section" button at the bottom of the page (or in the header actions area alongside "Add Question"):

```svelte
<Button variant="outline" onclick={handleAddSection}>
  {$t('course.navItem.lessons.exercises.all_exercises.section.add')}
</Button>
```

5. Implement section deletion with the delete modal (ask user whether to move questions or delete them):

Create `apps/dashboard/src/lib/features/course/components/exercise/section-delete-modal.svelte`:

```svelte
<Dialog.Root>
  <!-- "What should happen to the questions in this section?" -->
  <!-- Option A: Move to [select another section] -->
  <!-- Option B: Delete questions -->
</Dialog.Root>
```

6. When the first section is added to a sectionless exercise, auto-create "Section 1" and move all existing questions into it.

7. When the last section is deleted, move all remaining questions to sectionless (set `sectionId` to `null`).

**Files to create**:
- `apps/dashboard/src/lib/features/course/components/exercise/section-delete-modal.svelte`

**Files to change**:
- `apps/dashboard/src/lib/features/course/components/exercise/edit-mode.svelte`

**How to verify**:
- Adding a section to a sectionless exercise creates "Section 1" with all existing questions.
- Adding a second section creates an empty "Section 2".
- Questions render inside their respective section cards.
- Section title/description edits are reflected in the store.
- After-behavior dropdown works and persists selection.
- Deleting a section with "move questions" moves them.
- Deleting a section with "delete questions" marks them as deleted.
- Adding a question to a section assigns it to that section.
- `pnpm --filter @cio/dashboard build` succeeds.

---

### Ticket 3.5: Save Flow — Include Sections in API Payload

**Priority**: P0
**Estimate**: 2–3 hours

**What to do**:

1. Open `apps/dashboard/src/lib/features/course/pages/exercise.svelte`.
2. In the `handleSave` function, include sections in the update payload:

```typescript
const activeSections = $questionnaire.sections.filter((s) => !s.deletedAt);
const sectionsPayload = activeSections.map((section) => ({
  id: isUUID(section.id) ? section.id : undefined,
  title: section.title,
  description: section.description,
  order: section.order,
  afterBehavior: section.afterBehavior,
  questionIds: getQuestionsForSection($questionnaire.questions, section.id)
    .map((q) => q.id)
}));

await exerciseApi.update(courseApi.course?.id, exerciseId, {
  title: $questionnaire.title ?? '',
  description: $questionnaire.description ?? '',
  dueBy: $questionnaire.dueBy ?? '',
  questions: questions,
  sections: sectionsPayload.length > 0 ? sectionsPayload : undefined,
  sectionDisplayMode: $questionnaire.sectionDisplayMode
});
```

3. Update the exercise API class to include `sections` and `sectionDisplayMode` in the request type.

4. On successful save, update the store with the API response (which returns sections with server-generated IDs for new sections).

**Files to change**:
- `apps/dashboard/src/lib/features/course/pages/exercise.svelte`
- `apps/dashboard/src/lib/features/course/api/exercise.svelte.ts` (if needed)

**How to verify**:
- Save an exercise with sections — sections are persisted.
- Reload the page — sections appear correctly with questions in the right sections.
- Save an exercise without sections — no `sections` field sent, no regression.

---

### Ticket 3.6: Exercise Fetch — Populate Sections in Store

**Priority**: P0
**Estimate**: 1–2 hours

**What to do**:

1. Find where the exercise data is fetched and populated into the questionnaire store (likely in the exercise page's `load` function or an `$effect` that calls `exerciseApi.get`).
2. When the API response includes `sections`, populate `$questionnaire.sections`:

```typescript
questionnaire.set({
  ...existingData,
  sections: response.sections.map((section) => ({
    id: section.id,
    title: section.title,
    description: section.description,
    order: section.order,
    afterBehavior: section.afterBehavior
  })),
  sectionDisplayMode: response.sectionDisplayMode || 'one_question',
  questions: allQuestions.map((q) => ({ ...q, sectionId: q.sectionId ?? null }))
});
```

3. Ensure `sectionId` is set on each question from the API response.

**Files to change**:
- Exercise page load/fetch logic
- Exercise store population logic

**How to verify**:
- Navigate to an exercise with sections — store has `sections` populated.
- Questions have correct `sectionId` values.
- Navigate to a sectionless exercise — store has `sections: []`.

---

### Ticket 3.7: Section Display Mode Setting

**Priority**: P1
**Estimate**: 1 hour

**What to do**:

1. Add a setting in the exercise page (within the "Questions" tab, possibly in the header actions dropdown or a settings panel) that lets the instructor choose the section display mode.
2. Use a `ToggleGroup` or `Select` with two options:
   - "One question at a time" (`one_question`)
   - "All questions at once" (`all_questions`)
3. This setting is only shown when the exercise has sections.
4. Bind to `$questionnaire.sectionDisplayMode`.

**Files to change**:
- `apps/dashboard/src/lib/features/course/pages/exercise.svelte` (or a settings sub-component)

**How to verify**:
- Setting appears only when sections exist.
- Changing the setting updates the store.
- Saving persists the setting.
- Reloading shows the correct setting.

---

### Ticket 3.8: Preview Mode — Section-Grouped

**Priority**: P1
**Estimate**: 2–3 hours

**What to do**:

1. Open `apps/dashboard/src/lib/features/course/components/exercise/preview.svelte`.
2. When sections exist, render questions grouped under section headers:

```svelte
{#if hasSections(activeSections)}
  {#each activeSections as section, sectionIndex}
    <SectionHeader
      title={section.title}
      description={section.description}
      sectionNumber={sectionIndex + 1}
      totalSections={activeSections.length}
      questionCount={sectionQuestions.length}
      totalPoints={sectionPoints}
      mode="preview"
    />
    {#each getQuestionsForSection(questions, section.id) as question, qIndex}
      <ExerciseQuestion.QuestionRenderer ... />
    {/each}
  {/each}
{:else}
  <!-- existing flat rendering -->
{/if}
```

3. Questions are numbered within their section: "1.", "2." etc., resetting per section.

**Files to change**:
- `apps/dashboard/src/lib/features/course/components/exercise/preview.svelte`

**How to verify**:
- Preview of sectioned exercise shows section headers and grouped questions.
- Preview of sectionless exercise works as before.

---

## Phase 4: Dashboard — Take Mode & Grading

**Goal**: Students experience section-aware navigation. Teachers see section-grouped grading.

### Ticket 4.1: Section Navigation Sidebar Component

**Priority**: P1
**Estimate**: 2–3 hours

**What to do**:

1. Create `packages/ui/src/custom/exercise-question/section-navigation-sidebar.svelte`:

```typescript
interface SectionNavQuestion {
  key: string;
  label: string;
  isAnswered: boolean;
  isCurrent: boolean;
}

interface SectionNavGroup {
  id: string;
  title: string;
  questions: SectionNavQuestion[];
  isCurrent: boolean;
}

interface Props {
  sections: SectionNavGroup[];
}
```

2. Render a compact sidebar showing:
   - Section titles as group headers.
   - Question pills/badges within each section (e.g., "Q1", "Q2").
   - Answered questions have a filled style; unanswered have an outlined style.
   - Current question is highlighted.

3. Export from `packages/ui/src/custom/exercise-question/index.ts`.

**Files to create**:
- `packages/ui/src/custom/exercise-question/section-navigation-sidebar.svelte`

**Files to change**:
- `packages/ui/src/custom/exercise-question/index.ts`

**How to verify**:
- Component renders section groups with question indicators.
- Visual states (answered, current) display correctly.
- `pnpm --filter @cio/ui build` succeeds.

---

### Ticket 4.2: Section Overview Screen Component

**Priority**: P0
**Estimate**: 1–2 hours

**What to do**:

1. Create `apps/dashboard/src/lib/features/course/components/exercise/section-overview.svelte`:

```typescript
interface Props {
  sectionTitle: string;
  sectionDescription?: string | null;
  sectionNumber: number;
  totalSections: number;
  questionCount: number;
  totalPoints: number;
  onBegin: () => void;
  labels: {
    beginSection: string;
    questions: string;
    points: string;
    sectionOf: string;
  };
}
```

2. Render:
   - Section title prominently.
   - Section description (if any).
   - "N questions · M points"
   - "Begin Section" button.
   - Pattern similar to the existing exercise start screen in `view-mode.svelte`.

**Files to create**:
- `apps/dashboard/src/lib/features/course/components/exercise/section-overview.svelte`

**How to verify**:
- Component renders with correct data.
- "Begin Section" button fires callback.

---

### Ticket 4.3: View Mode — Section-Aware Take Flow

**Priority**: P0
**Estimate**: 5–7 hours

This is the most complex ticket. It modifies the student take flow to navigate through sections.

**What to do**:

1. Open `apps/dashboard/src/lib/features/course/components/exercise/view-mode.svelte`.

2. Add section-aware state derived from the metadata store:

```typescript
const activeSections = $derived(
  $questionnaire.sections.filter((s) => !s.deletedAt).sort((a, b) => a.order - b.order)
);
const hasSectionedExercise = $derived(activeSections.length > 0);
const currentSection = $derived(
  hasSectionedExercise ? activeSections[$questionnaireMetaData.currentSectionIndex] : null
);
const currentSectionQuestions = $derived(
  currentSection
    ? getQuestionsForSection($questionnaire.questions, currentSection.id)
    : $questionnaire.questions
);
const sectionPhase = $derived($questionnaireMetaData.sectionPhase);
```

3. Implement the section state machine:

```
if hasSectionedExercise:
  if sectionPhase === 'overview':
    → render SectionOverview for currentSection
    → "Begin Section" → set sectionPhase to 'questions', reset question index

  if sectionPhase === 'questions':
    if sectionDisplayMode === 'one_question':
      → render current question (same as existing one-at-a-time flow)
      → on last question answered → evaluate afterBehavior

    if sectionDisplayMode === 'all_questions':
      → render all questions in currentSection
      → "Complete Section" button → evaluate afterBehavior

  evaluateAfterBehavior(currentSection.afterBehavior):
    if action === 'continue':
      → if more sections, advance currentSectionIndex, set sectionPhase to 'overview'
      → if no more sections, submit exercise

    if action === 'go_to_section':
      → find target section by sectionId
      → set currentSectionIndex to target's index, set sectionPhase to 'overview'

    if action === 'submit':
      → submit exercise

else:
  → existing flat flow (no changes)
```

4. Add the `SectionNavigationSidebar` to the take mode layout (positioned on the side or as a collapsible panel).

5. Update progress calculation:

```typescript
function getProgressValue() {
  if (hasSectionedExercise) {
    const totalQuestions = $questionnaire.questions.filter((q) => !q.deletedAt).length;
    const answeredCount = Object.keys($questionnaireMetaData.answers).length;
    return Math.round((answeredCount / totalQuestions) * 100) || 0;
  }
  // existing calculation
}
```

6. Update autosave to include `currentSectionIndex` and `sectionPhase`.

**Files to change**:
- `apps/dashboard/src/lib/features/course/components/exercise/view-mode.svelte`

**How to verify**:
- Student sees section overview before starting each section.
- In `one_question` mode: questions navigate one at a time within a section, then post-section behavior fires.
- In `all_questions` mode: all section questions shown, "Complete Section" triggers post-section behavior.
- "Continue to next section" advances correctly.
- "Go to section X" jumps to the correct section.
- "Submit exercise" submits immediately.
- Progress bar reflects total questions answered across all sections.
- Navigation sidebar shows correct section/question state.
- Autosave preserves section + question position.
- Sectionless exercises work exactly as before.

---

### Ticket 4.4: Grading — Section-Grouped Individual View

**Priority**: P1
**Estimate**: 2–3 hours

**What to do**:

1. Open `apps/dashboard/src/lib/features/course/components/exercise/submissions/individual.svelte`.

2. When the exercise has sections, group the question rendering:

```svelte
{#if hasSections}
  {#each activeSections as section}
    <div class="section-group mb-6">
      <h3 class="text-lg font-semibold mb-2">{section.title}</h3>

      {#each getQuestionsForSection($questionnaire.questions, section.id) as q, i}
        <div class="pb-4">
          <ExerciseQuestion.QuestionRenderer
            contract={{
              mode: 'view',
              question: { ...toExerciseQuestionModel(q), title: `${i + 1}. ${q.title}` },
              answer: getStudentAnswerForQuestion($submissions[studentSelected], q),
              labels: questionLabels,
              disabled: true
            }}
          />
        </div>
      {/each}

      <div class="border-t pt-2 text-sm font-medium">
        Section subtotal: {sectionScore}/{sectionMaxPoints}
      </div>
    </div>
  {/each}

  <div class="border-t-2 pt-3 text-base font-bold">
    Total: {totalScore}/{totalMaxPoints}
  </div>
{:else}
  <!-- existing flat rendering -->
{/if}
```

**Files to change**:
- `apps/dashboard/src/lib/features/course/components/exercise/submissions/individual.svelte`

**How to verify**:
- Sectioned exercise submissions show questions grouped by section with subtotals.
- Sectionless exercise submissions work as before.

---

### Ticket 4.5: Grading — Section-Grouped Summary View

**Priority**: P1
**Estimate**: 2–3 hours

**What to do**:

1. Open `apps/dashboard/src/lib/features/course/components/exercise/submissions/summary.svelte`.

2. When sections exist, group the chart data by section:

```svelte
{#if hasSections}
  {#each activeSections as section}
    <div class="section-summary mb-8">
      <h3 class="text-lg font-semibold mb-3">{section.title}</h3>
      {#each getSectionTransformedQuestions(section.id) as q}
        <!-- existing chart rendering per question -->
      {/each}
    </div>
  {/each}
{:else}
  <!-- existing flat rendering -->
{/if}
```

**Files to change**:
- `apps/dashboard/src/lib/features/course/components/exercise/submissions/summary.svelte`

**How to verify**:
- Sectioned exercise summary shows charts grouped by section.
- Sectionless exercise summary works as before.

---

### Ticket 4.6: Translation Keys

**Priority**: P0
**Estimate**: 30 minutes

**What to do**:

1. Open `apps/dashboard/src/lib/utils/translations/en.json`.
2. Add all section-related translation keys under `course.navItem.lessons.exercises.all_exercises` (see PRD Section 9 for the full list).

**Files to change**:
- `apps/dashboard/src/lib/utils/translations/en.json`

**How to verify**:
- All section-related UI text uses translation keys.
- No hardcoded strings in section components.

---

## Dependency Graph

```
Ticket 1.1 (Schema)
  ├── Ticket 1.2 (Migration)
  ├── Ticket 1.3 (Types)
  │     └── Ticket 1.4 (Validation)
  └── Ticket 1.5 (Queries)
        ├── Ticket 2.1 (API Fetch)
        ├── Ticket 2.2 (API Update)
        │     └── Ticket 3.5 (Save Flow)
        ├── Ticket 2.3 (API Submission)
        └── Ticket 2.4 (Clone)

Ticket 1.3 (Types)
  ├── Ticket 3.1 (Store)
  │     ├── Ticket 3.4 (Edit Mode)
  │     │     └── Ticket 3.5 (Save Flow)
  │     ├── Ticket 3.6 (Fetch → Store)
  │     └── Ticket 4.3 (View Mode)
  ├── Ticket 3.2 (Section Header)
  │     ├── Ticket 3.4 (Edit Mode)
  │     ├── Ticket 3.8 (Preview)
  │     └── Ticket 4.2 (Section Overview)
  └── Ticket 3.3 (After-Behavior)
        └── Ticket 3.4 (Edit Mode)

Ticket 4.6 (Translations) — can be done any time, needed before any UI ticket ships

Ticket 4.1 (Nav Sidebar) → Ticket 4.3 (View Mode)
Ticket 4.2 (Section Overview) → Ticket 4.3 (View Mode)
Ticket 4.4 (Grading Individual) — depends on Ticket 2.3
Ticket 4.5 (Grading Summary) — depends on Ticket 2.3
Ticket 3.7 (Display Mode Setting) — depends on Ticket 3.1
Ticket 3.8 (Preview) — depends on Ticket 3.2, 3.1
```

## Suggested Work Order

For a single developer working sequentially:

1. **Ticket 4.6** — Translations (quick, unblocks all UI work)
2. **Ticket 1.1** — Schema
3. **Ticket 1.2** — Migration
4. **Ticket 1.3** — Types
5. **Ticket 1.4** — Validation
6. **Ticket 1.5** — Queries
7. **Ticket 2.1** — API Fetch
8. **Ticket 2.2** — API Update
9. **Ticket 3.1** — Store
10. **Ticket 3.2** — Section Header
11. **Ticket 3.3** — After-Behavior
12. **Ticket 3.6** — Fetch → Store
13. **Ticket 3.4** — Edit Mode
14. **Ticket 3.5** — Save Flow
15. **Ticket 3.7** — Display Mode Setting
16. **Ticket 3.8** — Preview
17. **Ticket 4.2** — Section Overview
18. **Ticket 4.1** — Nav Sidebar
19. **Ticket 4.3** — View Mode (Take)
20. **Ticket 2.3** — API Submission Grouped
21. **Ticket 4.4** — Grading Individual
22. **Ticket 4.5** — Grading Summary
23. **Ticket 2.4** — Clone

**Estimated total**: 40–55 hours of development time.

---

## Shared Package File Contract

### `packages/question-types/src/`

| File | Status | Description |
| --- | --- | --- |
| `exercise-section-types.ts` | **New** | Section model, after-behavior types, display mode type |
| `index.ts` | Modified | Add section types export |

### `packages/ui/src/custom/exercise-question/`

| File | Status | Description |
| --- | --- | --- |
| `section-header.svelte` | **New** | Section header for edit/take/preview/view modes |
| `section-after-behavior.svelte` | **New** | After-section behavior dropdown |
| `section-navigation-sidebar.svelte` | **New** | Section-grouped question navigation |
| `question-navigation.svelte` | Modified | Add section-aware props |
| `question-list.svelte` | Modified | Support section-grouped rendering |
| `index.ts` | Modified | Export new components |
