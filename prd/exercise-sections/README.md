# Exercise Sections PRD

## Status

- Draft

## Date

- February 26, 2026

## Implementation Plan

- See [implementation-plan.md](./implementation-plan.md) for ticket breakdown and delivery sequencing.

## Purpose

Allow instructors to group exercise questions into named sections, so exercises can be structured into logical parts (e.g., "Section A: Multiple Choice", "Section B: Written Responses") with per-section navigation, descriptions, and configurable post-section behavior.

## Problem Statement

Today, every exercise is a flat list of questions. Instructors cannot:

1. **Organize questions by topic or format** — a 30-question exam has no visual grouping, making it harder for students to navigate and for teachers to author.
2. **Provide per-section instructions** — if Section A requires different rules than Section B, the instructor must embed instructions into individual question prompts.
3. **Control post-section flow** — there is no way to submit answers after a subset of questions or to route students to a specific next section.
4. **Grade or review by section** — submissions are a single flat list, so teachers cannot quickly assess performance on distinct parts of an exercise.

## Current-State Audit

| Area | Current State | Gap |
| --- | --- | --- |
| `exercise` table | Has `title`, `description`, questions linked via `question.exercise_id` | No section concept |
| `question` table | Has `exercise_id`, `order`, `title`, `points`, `question_type_id` | No `section_id` or section ordering |
| Exercise store | `questionnaire.questions` is a flat `Question[]` | No section grouping or section metadata |
| Edit mode UI | Renders all questions in a single vertical list | No section headers, section CRUD, or drag-between-sections |
| Take mode (view-mode) | Shows one question at a time via `currentQuestionIndex` on flat array | No section-at-a-time mode, no section overview screen |
| Question navigation | `QuestionNavigation` component has `onPrevious`/`onNext` with `isLast` flag | No section awareness |
| Preview mode | Renders all questions via `QuestionList` | No section grouping |
| Submissions/Grading UI | `individual.svelte` and `summary.svelte` iterate flat question list | No section-level subtotals |
| Exercise templates | `exercise_template.questionnaire` is `{ questions: [...] }` JSON | No sections in template schema |
| Clone service | `cloneExercises` copies exercises → questions → options | No section cloning |
| Progress bar | Computes `currentQuestionIndex / questions.length` | No section-aware progress |

## Data Sources Checked

- `packages/db/src/schema.ts` — `exercise`, `question`, `questionAnswer`, `submission`, `exerciseTemplate` tables
- `apps/dashboard/src/lib/features/course/components/exercise/store.ts`
- `apps/dashboard/src/lib/features/course/components/exercise/edit-mode.svelte`
- `apps/dashboard/src/lib/features/course/components/exercise/view-mode.svelte`
- `apps/dashboard/src/lib/features/course/components/exercise/preview.svelte`
- `apps/dashboard/src/lib/features/course/components/exercise/submissions/individual.svelte`
- `apps/dashboard/src/lib/features/course/components/exercise/submissions/summary.svelte`
- `apps/dashboard/src/lib/features/course/pages/exercise.svelte`
- `apps/api/src/services/course/clone.ts`
- `packages/ui/src/custom/exercise-question/question-navigation.svelte`
- `packages/ui/src/custom/exercise-question/question-list.svelte`
- `packages/question-types/src/exercise-types.ts`
- `prd/exercise-question-types/README.md`

## Primary Users

- **Instructors** creating structured exams and assignments with logical groupings.
- **Students** taking exercises and navigating between sections.
- **Admins/Tutors** grading and reviewing submissions by section.

## Goals

1. Allow instructors to create, edit, reorder, and delete sections within an exercise.
2. Allow students to navigate exercises section-by-section with configurable question display (one-at-a-time or all-at-once within a section).
3. Show section-level subtotals alongside overall totals in grading.
4. Support configurable post-section behavior (continue, go to specific section, submit).
5. Maintain full backward compatibility — existing sectionless exercises work unchanged.
6. Support sections in exercise templates and cloning.

## Non-Goals (v1)

- Per-section time limits (exercise-level timing does not exist yet; out of scope).
- Per-section scoring weights (section score is the sum of its question points).
- Conditional/branching logic beyond post-section routing (no "if student scored < 50% on Section A, skip to Section C").
- Section-level randomization separate from exercise-level randomization.
- Nested sections (sections within sections).

## Confirmed Decisions

1. An exercise is either **flat questions** (no sections) or **sections with questions** — not a mix of both. If an exercise has sections, every question must belong to a section.
2. A question belongs to exactly **one** section. No multi-section membership.
3. Section scoring is the **sum of question points** within that section — no separate section-level weight multiplier.
4. Student display mode is **configurable per exercise**: either "one question at a time" (current behavior, but section-aware) or "one section at a time" (all questions in the current section shown together).
5. Students see a **section overview screen** before beginning each section (section title + description + question count + total points).
6. Students navigate sections **linearly by default**, but the post-section behavior can route them elsewhere.
7. Post-section behavior options: **"Continue to next section"** (default), **"Go to section [X]"** (select from list), **"Submit exercise"**.
8. Progress bar tracks **questions completed** (not sections). The question navigation sidebar shows questions **grouped by section** (e.g., "Section 1: Q1, Q2, Q3 | Section 2: Q1, Q2").
9. Grading UI shows submissions **grouped by section** with per-section subtotals and an overall total.
10. Existing exercises without sections continue to work exactly as they do today. Sections are **fully optional**.
11. Exercise templates support sections. Exercise cloning preserves sections.
12. Instructors can **drag questions between sections**, **reorder sections**, and **select which section** when adding a new question.

---

## Functional Requirements

### FR-1: Section CRUD (Instructor — Edit Mode)

#### FR-1.1: Create Section

- Instructor can add a section to an exercise via an "Add Section" button (similar to Google Forms section add).
- When the first section is added to a previously sectionless exercise, all existing questions are automatically moved into "Section 1".
- A new section is created with default title "Untitled Section" and empty description.
- The new section is appended after the last section (or after the current section if contextually clear).

#### FR-1.2: Edit Section

- Instructor can edit the section **title** (required, min 1 character).
- Instructor can edit the section **description** (optional, supports plain text).
- Instructor can configure the **after-section behavior** via a dropdown at the bottom of each section:
  - "Continue to next section" (default)
  - "Go to section [X]" (dropdown listing all other sections by title)
  - "Submit exercise"
- The last section's default after-section behavior is "Submit exercise".

#### FR-1.3: Delete Section

- Instructor can delete a section.
- When a section is deleted, the instructor is prompted: "Move questions to [other section] or delete them?"
- If the exercise has only one section and it's deleted, the exercise becomes sectionless and all questions remain as a flat list.

#### FR-1.4: Reorder Sections

- Instructor can reorder sections via drag-and-drop or an order modal (consistent with the existing question reorder pattern).
- When sections are reordered, the `order` field on each section is updated accordingly.

#### FR-1.5: Move Questions Between Sections

- Instructor can drag a question from one section to another.
- Instructor can move a question via a context menu: "Move to Section → [list of sections]".
- When adding a new question, the instructor selects which section it belongs to (defaults to the currently focused or last section).

### FR-2: Student Experience (Take Mode)

#### FR-2.1: Section Overview Screen

- Before the first question of each section, the student sees a section overview:
  - Section title
  - Section description (if any)
  - Number of questions in this section
  - Total points available in this section
  - "Begin Section" button
- This mirrors the existing exercise start screen pattern but at the section level.

#### FR-2.2: Question Display Mode (Configurable)

The exercise has a setting `sectionDisplayMode` with two options:

- **`one_question`** (default): Questions are shown one at a time. The student navigates with Previous/Next buttons. A section header/indicator is visible showing which section the student is in (e.g., "Section 1 of 3 — Multiple Choice"). When the last question of a section is completed, the post-section behavior fires.
- **`all_questions`**: All questions in the current section are displayed together in a scrollable list. The student answers all questions and clicks a "Complete Section" button. Post-section behavior then fires.

#### FR-2.3: Post-Section Behavior

After completing a section:

- **"Continue to next section"**: Show the next section's overview screen.
- **"Go to section [X]"**: Show section X's overview screen.
- **"Submit exercise"**: Submit all answers collected so far and show the completion/grading screen.

If the student finishes the last section and its after-behavior is "Continue to next section" (or not explicitly set), the exercise auto-submits.

#### FR-2.4: Section-Aware Navigation

- The question navigation UI groups questions by section:
  ```
  Section 1: Multiple Choice
    Q1  Q2  Q3  Q4

  Section 2: Written Responses
    Q1  Q2
  ```
- Answered questions are visually distinguished (filled dot, checkmark, etc.).
- The current section and question are highlighted.
- Students can only navigate within the current section (no jumping between sections) unless the exercise allows free navigation (future enhancement, not v1).

#### FR-2.5: Progress Tracking

- The progress bar reflects **total questions answered / total questions** across all sections.
- A secondary indicator shows the current section (e.g., "Section 2 of 3").

#### FR-2.6: Autosave

- Existing autosave behavior extends to section-aware exercises.
- The autosaved state includes which section the student is currently in and which question within that section.
- On resume, the student returns to their last position (correct section and question).

### FR-3: Preview Mode (Instructor)

- Preview mode shows questions grouped under section headers.
- Each section header displays the section title and description.
- Questions are numbered within their section (Section 1: Q1, Q2; Section 2: Q1, Q2).

### FR-4: Grading & Submissions

#### FR-4.1: Section-Grouped Grading View

- In the individual student submission view (`individual.svelte`), questions are grouped under section headers.
- Each section shows a subtotal: "Section 1: 15/20 points".
- An overall total is shown at the top/bottom: "Total: 35/50 points".

#### FR-4.2: Summary Analytics

- In the summary view (`summary.svelte`), chart data is grouped by section.
- Each section has its own aggregate view before the overall aggregate.

### FR-5: Exercise Templates

- Exercise templates (`exercise_template` table) support sections in the `questionnaire` JSONB field.
- Template schema extends to:
  ```json
  {
    "sections": [
      {
        "title": "Section Title",
        "description": "Optional description",
        "order": 0,
        "afterBehavior": { "action": "continue" },
        "questions": [{ "title": "...", ... }]
      }
    ],
    "questions": [...]
  }
  ```
- If `sections` is present, `questions` at the root level is empty/ignored.
- If `sections` is absent, `questions` is used (backward compatible).

### FR-6: Cloning

- The clone service (`apps/api/src/services/course/clone.ts`) clones exercise sections alongside questions and options.
- Section ordering, titles, descriptions, and after-behavior settings are preserved.
- Question-to-section mappings are preserved via the section ID map.

---

## Technical Design

### 1. Data Model Changes

#### 1.1: New `exercise_section` Table

```sql
CREATE TABLE exercise_section (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exercise_id UUID NOT NULL REFERENCES exercise(id) ON DELETE CASCADE,
  title       VARCHAR NOT NULL DEFAULT 'Untitled Section',
  description TEXT,
  "order"     BIGINT NOT NULL DEFAULT 0,
  after_behavior JSONB NOT NULL DEFAULT '{"action": "continue"}',
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_exercise_section_exercise_id ON exercise_section(exercise_id);
```

The `after_behavior` JSONB stores one of:

```typescript
// Continue to the next section in order
{ action: 'continue' }

// Jump to a specific section
{ action: 'go_to_section', sectionId: '<uuid>' }

// Submit the exercise immediately
{ action: 'submit' }
```

#### 1.2: `question` Table — Add `section_id`

```sql
ALTER TABLE question ADD COLUMN section_id UUID REFERENCES exercise_section(id) ON DELETE SET NULL;
CREATE INDEX idx_question_section_id ON question(section_id);
```

- `section_id` is **nullable**. When `NULL`, the question belongs to a sectionless exercise (backward compatible).
- When a question is part of a sectioned exercise, `section_id` is required (enforced at the application level, not DB constraint, to keep migration safe).

#### 1.3: `exercise` Table — Add `section_display_mode`

```sql
ALTER TABLE exercise ADD COLUMN section_display_mode VARCHAR DEFAULT 'one_question';
```

Values: `'one_question'` | `'all_questions'`

This column is only meaningful when the exercise has sections. For sectionless exercises it is ignored.

#### 1.4: Drizzle Schema Updates

File: `packages/db/src/schema.ts`

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
      .default({ action: 'continue' })
      .$type<ExerciseSectionAfterBehavior>(),
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

Add to `question` table:

```typescript
sectionId: uuid('section_id'),
```

Add foreign key in `question` table constraints:

```typescript
foreignKey({
  columns: [table.sectionId],
  foreignColumns: [exerciseSection.id],
  name: 'question_section_id_fkey'
}).onDelete('set null')
```

Add to `exercise` table:

```typescript
sectionDisplayMode: varchar('section_display_mode').default('one_question'),
```

#### 1.5: TypeScript Types

File: `packages/db/src/types.ts` (inferred from schema)

```typescript
export type TExerciseSection = typeof exerciseSection.$inferSelect;
export type TExerciseSectionInsert = typeof exerciseSection.$inferInsert;
```

File: `packages/question-types/src/exercise-section-types.ts` (new)

```typescript
export type ExerciseSectionAfterAction = 'continue' | 'go_to_section' | 'submit';

export interface ExerciseSectionAfterBehavior {
  action: ExerciseSectionAfterAction;
  sectionId?: string; // only when action === 'go_to_section'
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

### 2. Validation Layer

File: `packages/utils/src/validation/exercise/exercise-section.ts` (new)

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
  afterBehavior: ZExerciseSectionAfterBehavior.default({ action: 'continue' })
});

export const ZExerciseSectionCreate = ZExerciseSection.omit({ id: true });
export const ZExerciseSectionUpdate = ZExerciseSection.partial().required({ id: true });

export type TExerciseSection = z.infer<typeof ZExerciseSection>;
export type TExerciseSectionCreate = z.infer<typeof ZExerciseSectionCreate>;
export type TExerciseSectionUpdate = z.infer<typeof ZExerciseSectionUpdate>;
```

Extend existing `ZExerciseUpdate` to accept optional `sections` array:

```typescript
export const ZExerciseUpdate = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  dueBy: z.string().optional(),
  questions: z.array(ZQuestion).optional(),
  sections: z.array(ZExerciseSection).optional(),
  sectionDisplayMode: z.enum(['one_question', 'all_questions']).optional()
});
```

### 3. Database Queries

File: `packages/db/src/queries/exercise/exercise-section.ts` (new)

Required query functions:

| Function | Description |
| --- | --- |
| `getExerciseSectionsByExerciseId(exerciseId)` | Fetch all sections for an exercise, ordered by `order` |
| `createExerciseSections(sections[])` | Bulk insert sections, return created rows |
| `updateExerciseSection(sectionId, data)` | Update a single section's title, description, order, or afterBehavior |
| `deleteExerciseSection(sectionId)` | Delete a section (questions cascade to `section_id = NULL`) |
| `reorderExerciseSections(exerciseId, orderedIds[])` | Batch update `order` field for all sections |
| `moveQuestionToSection(questionId, sectionId)` | Update a question's `section_id` |
| `bulkMoveQuestionsToSection(questionIds[], sectionId)` | Move multiple questions to a section |

### 4. API Layer Changes

#### 4.1: Exercise Fetch — Include Sections

When fetching an exercise (`GET /course/:courseId/exercise/:exerciseId`), the response includes sections:

```typescript
{
  id: string;
  title: string;
  description: string;
  sectionDisplayMode: 'one_question' | 'all_questions';
  sections: Array<{
    id: string;
    title: string;
    description: string | null;
    order: number;
    afterBehavior: { action: string; sectionId?: string };
    questions: Array<{ /* existing question shape */ }>;
  }>;
  questions: Array<{ /* questions without sections (backward compat) */ }>;
}
```

- If the exercise has sections, `sections` is populated and `questions` only contains ungrouped questions (should be empty for a properly formed sectioned exercise).
- If the exercise has no sections, `sections` is an empty array and `questions` contains all questions (current behavior preserved).

#### 4.2: Exercise Update — Accept Sections

The `PUT /course/:courseId/exercise/:exerciseId` endpoint accepts an optional `sections` array:

```typescript
{
  title?: string;
  description?: string;
  dueBy?: string;
  sectionDisplayMode?: 'one_question' | 'all_questions';
  sections?: Array<{
    id?: string;       // present for existing sections, absent for new
    title: string;
    description?: string;
    order: number;
    afterBehavior: { action: string; sectionId?: string };
    questionIds: string[];  // ordered list of question IDs in this section
  }>;
  questions?: Array<{ /* existing question update shape */ }>;
}
```

Service logic:

1. Upsert sections (create new, update existing, delete removed).
2. Update `question.section_id` for each question based on `questionIds` in each section.
3. Update `question.order` within each section.
4. Validate that all `go_to_section` references point to valid section IDs within the same exercise.
5. Validate that if sections exist, every non-deleted question has a section assignment.

#### 4.3: Exercise Submission — Section-Aware

No changes to the submission API shape. Students still submit a flat array of `{ questionId, optionId?, answer? }`. The server groups answers by section for grading display, not at submission time.

#### 4.4: Submission Fetch — Section-Grouped Response

When fetching submissions for grading, the API returns section groupings:

```typescript
{
  sections: Array<{
    sectionId: string;
    sectionTitle: string;
    subtotal: number;
    maxPoints: number;
    answers: Array<{ /* per-question answer + grade */ }>;
  }>;
  totalScore: number;
  maxScore: number;
}
```

For sectionless exercises, `sections` is a single entry with no section metadata (backward compatible).

### 5. Clone Service Changes

File: `apps/api/src/services/course/clone.ts`

Update `cloneExercises` to:

1. After creating new exercises, fetch sections for all old exercises.
2. Create a section ID map (old → new).
3. Bulk insert new sections with the new exercise IDs.
4. When cloning questions, include the mapped `sectionId`.

```typescript
// Pseudocode addition to cloneExercises():
const oldExerciseIds = oldExercises.map((ex) => ex.id);
const oldSections = await getExerciseSectionsByExerciseIds(oldExerciseIds);

if (oldSections.length > 0) {
  const newSections = await createExerciseSections(
    oldSections.map((section) => ({
      title: section.title,
      description: section.description,
      order: section.order,
      afterBehavior: section.afterBehavior,
      exerciseId: exerciseIdMap.get(section.exerciseId)!
    }))
  );

  const sectionIdMap = new Map<string, string>();
  oldSections.forEach((oldSection, index) => {
    sectionIdMap.set(oldSection.id, newSections[index].id);
  });

  // When cloning questions, include mapped sectionId:
  // sectionId: question.sectionId ? sectionIdMap.get(question.sectionId) : null
}
```

Update `afterBehavior` references: if a section's `afterBehavior.action === 'go_to_section'`, remap the `sectionId` using the section ID map.

### 6. Exercise Template Changes

File: `packages/db/src/schema.ts` — `exerciseTemplate`

Extend the `questionnaire` JSONB type:

```typescript
questionnaire: jsonb().default({}).$type<{
  sections?: Array<{
    title: string;
    description?: string;
    order: number;
    afterBehavior: { action: string; sectionId?: string };
    questions: Array<{
      title: string;
      name: string;
      points: number;
      order: number;
      question_type: { id: number; label: string };
      options: Array<{ label: string; is_correct: boolean }>;
    }>;
  }>;
  questions: Array<{ /* existing shape */ }>;
}>()
```

### 7. Dashboard Store Changes

File: `apps/dashboard/src/lib/features/course/components/exercise/store.ts`

#### 7.1: Extend Questionnaire Store

```typescript
export interface ExerciseSectionState {
  id: string;
  title: string;
  description: string | null;
  order: number;
  afterBehavior: ExerciseSectionAfterBehavior;
  isDirty?: boolean;
  deletedAt?: string;
}

export const questionnaire: Writable<{
  title?: string | null;
  dueBy?: string | null;
  isDueByDirty?: boolean;
  isTitleDirty?: boolean;
  description?: string | null;
  isDescriptionDirty?: boolean;
  questions: Question[];
  sections: ExerciseSectionState[];
  sectionDisplayMode: ExerciseSectionDisplayMode;
  totalSubmissions: number;
}> = writable({
  title: '',
  dueBy: '',
  isDueByDirty: false,
  isTitleDirty: false,
  description: '',
  isDescriptionDirty: false,
  questions: [],
  sections: [],
  sectionDisplayMode: 'one_question',
  totalSubmissions: 0
});
```

#### 7.2: Extend Question Type

Add `sectionId` to the `Question` type:

```typescript
export type Question = Omit<ApiQuestion, 'options'> & {
  isDirty?: boolean;
  deletedAt?: string;
  sectionId?: string | null;
  options: QuestionOption[];
};
```

#### 7.3: Extend Metadata Store

```typescript
const initAnswerState = {
  answers: {},
  scores: {},
  grades: {},
  totalPossibleGrade: 0,
  finalTotalGrade: 0,
  currentQuestionIndex: 0,
  currentSectionIndex: 0,        // NEW
  sectionPhase: 'overview',      // NEW: 'overview' | 'questions' | 'completed'
  isFinished: false,
  progressValue: 0,
  status: STATUS.PENDING,
  comment: '',
  exerciseId: null as string | null
};
```

#### 7.4: New Store Helper Functions

```typescript
export function handleAddSection() {
  questionnaire.update((q) => {
    const newSection: ExerciseSectionState = {
      id: `${Date.now()}-section-form`,
      title: 'Untitled Section',
      description: null,
      order: q.sections.length,
      afterBehavior: { action: 'continue' },
      isDirty: true
    };
    return { ...q, sections: [...q.sections, newSection] };
  });
}

export function handleRemoveSection(sectionId: string, moveQuestionsToSectionId?: string) {
  questionnaire.update((q) => {
    const section = q.sections.find((s) => s.id === sectionId);
    if (!section) return q;

    let updatedQuestions = q.questions;
    if (moveQuestionsToSectionId) {
      updatedQuestions = q.questions.map((question) =>
        question.sectionId === sectionId
          ? { ...question, sectionId: moveQuestionsToSectionId, isDirty: true }
          : question
      );
    } else {
      updatedQuestions = q.questions.map((question) =>
        question.sectionId === sectionId
          ? { ...question, deletedAt: new Date().toString() }
          : question
      );
    }

    return {
      ...q,
      sections: q.sections.map((s) =>
        s.id === sectionId ? { ...s, deletedAt: new Date().toString() } : s
      ),
      questions: updatedQuestions
    };
  });
}

export function handleMoveQuestionToSection(questionId: string, sectionId: string) {
  questionnaire.update((q) => ({
    ...q,
    questions: q.questions.map((question) =>
      question.id === questionId
        ? { ...question, sectionId, isDirty: true }
        : question
    )
  }));
}

export function handleUpdateSectionAfterBehavior(
  sectionId: string,
  afterBehavior: ExerciseSectionAfterBehavior
) {
  questionnaire.update((q) => ({
    ...q,
    sections: q.sections.map((section) =>
      section.id === sectionId
        ? { ...section, afterBehavior, isDirty: true }
        : section
    )
  }));
}

export function getQuestionsForSection(
  questions: Question[],
  sectionId: string
): Question[] {
  return questions
    .filter((q) => q.sectionId === sectionId && !q.deletedAt)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}

export function hasSections(sections: ExerciseSectionState[]): boolean {
  return sections.filter((s) => !s.deletedAt).length > 0;
}
```

### 8. Dashboard UI Changes

#### 8.1: Edit Mode — Section Headers

File: `apps/dashboard/src/lib/features/course/components/exercise/edit-mode.svelte`

When sections exist, render questions grouped under collapsible section headers:

```
┌─────────────────────────────────────────┐
│ Section 1 of 2                      ✕ ⋮ │
│ [Section Title Input                  ] │
│ [Description (optional)               ] │
├─────────────────────────────────────────┤
│  ┌─ Question Card ──────────────────┐   │
│  │ Q1: What is...        [Radio ▼]  │   │
│  │ ...                              │   │
│  └──────────────────────────────────┘   │
│  ┌─ Question Card ──────────────────┐   │
│  │ Q2: Explain...      [Textarea ▼] │   │
│  │ ...                              │   │
│  └──────────────────────────────────┘   │
│                                         │
│  After section 1: [Continue       ▼]   │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ Section 2 of 2                      ✕ ⋮ │
│ ...                                     │
└─────────────────────────────────────────┘

[ + Add Section ]
```

- Each section has an inline title input and optional description textarea.
- The "After section N" dropdown appears at the bottom of each section, styled like the Google Forms pattern (see reference image).
- The three-dot menu (`⋮`) on each section header offers: "Move section up", "Move section down", "Delete section".
- The "Add question" button inside a section adds a question to that specific section.
- Questions can be dragged between sections.

#### 8.2: New Shared UI Component — `SectionHeader`

File: `packages/ui/src/custom/exercise-question/section-header.svelte` (new)

```typescript
interface Props {
  title: string;
  description?: string | null;
  sectionNumber: number;
  totalSections: number;
  questionCount: number;
  totalPoints: number;
  mode: 'edit' | 'take' | 'preview' | 'view';
}
```

- In **edit** mode: editable title/description inputs.
- In **take** mode: read-only title, description, question count, points.
- In **preview/view** mode: read-only header.

#### 8.3: New Shared UI Component — `SectionAfterBehavior`

File: `packages/ui/src/custom/exercise-question/section-after-behavior.svelte` (new)

A dropdown component that renders the "After section N" control:

```typescript
interface Props {
  sectionId: string;
  allSections: Array<{ id: string; title: string }>;
  afterBehavior: ExerciseSectionAfterBehavior;
  onChange: (behavior: ExerciseSectionAfterBehavior) => void;
  labels: {
    afterSectionPrefix: string;  // "After section"
    continue: string;            // "Continue to next section"
    goToSection: string;         // "Go to section"
    submit: string;              // "Submit exercise"
  };
}
```

#### 8.4: View Mode — Section-Aware Navigation

File: `apps/dashboard/src/lib/features/course/components/exercise/view-mode.svelte`

State machine for sectioned exercise student flow:

```
START → Section Overview (section 0) → Questions (section 0)
     → [after-behavior] → Section Overview (section 1) → Questions (section 1)
     → [after-behavior] → ... → Submit → Finished
```

Key state variables:

```typescript
currentSectionIndex: number;    // which section the student is on
sectionPhase: 'overview' | 'questions' | 'completed';
currentQuestionIndex: number;   // within the current section
```

When `sectionPhase === 'overview'`: render the `SectionHeader` in take mode with a "Begin Section" button.
When `sectionPhase === 'questions'`: render questions using existing `QuestionRenderer` / `QuestionNavigation`.
When the last question in a section is answered: evaluate `afterBehavior` and transition.

#### 8.5: Updated `QuestionNavigation` Component

File: `packages/ui/src/custom/exercise-question/question-navigation.svelte`

Add section-awareness:

```typescript
interface Props {
  // ... existing props ...
  sectionLabel?: string;           // e.g., "Section 1 of 3"
  completeSectionLabel?: string;   // e.g., "Complete Section" (for all_questions mode)
  onCompleteSection?: () => void;
}
```

#### 8.6: New Shared UI Component — `SectionNavigationSidebar`

File: `packages/ui/src/custom/exercise-question/section-navigation-sidebar.svelte` (new)

A sidebar/panel that shows the section-grouped question map:

```typescript
interface Props {
  sections: Array<{
    id: string;
    title: string;
    questions: Array<{
      key: string;
      label: string;      // "Q1", "Q2"
      isAnswered: boolean;
      isCurrent: boolean;
    }>;
    isCurrent: boolean;
  }>;
}
```

Rendered as:

```
Section 1: Multiple Choice
  [●] Q1  [●] Q2  [○] Q3  [○] Q4

Section 2: Written Responses
  [○] Q1  [○] Q2
```

Where `●` = answered, `○` = unanswered, and the current question is highlighted.

#### 8.7: Preview Mode — Section-Grouped

File: `apps/dashboard/src/lib/features/course/components/exercise/preview.svelte`

When sections exist, group questions under section headers:

```svelte
{#each activeSections as section, sectionIndex}
  <SectionHeader
    title={section.title}
    description={section.description}
    sectionNumber={sectionIndex + 1}
    totalSections={activeSections.length}
    questionCount={getQuestionsForSection(questions, section.id).length}
    totalPoints={getSectionPoints(questions, section.id)}
    mode="preview"
  />
  {#each getQuestionsForSection(questions, section.id) as question, qIndex}
    <QuestionRenderer ... />
  {/each}
{/each}
```

#### 8.8: Grading Views — Section-Grouped

File: `apps/dashboard/src/lib/features/course/components/exercise/submissions/individual.svelte`

When sections exist, wrap question rendering in section groups:

```svelte
{#each activeSections as section}
  <div class="section-group">
    <h3>{section.title}</h3>
    {#each getQuestionsForSection(questions, section.id) as q, i}
      <QuestionRenderer ... />
    {/each}
    <div class="section-subtotal">
      Section: {sectionScore}/{sectionMaxPoints} points
    </div>
  </div>
{/each}
<div class="overall-total">
  Total: {totalScore}/{totalMaxPoints} points
</div>
```

File: `apps/dashboard/src/lib/features/course/components/exercise/submissions/summary.svelte`

Group chart data by section, rendering a section header before each section's question charts.

### 9. Translation Keys

File: `apps/dashboard/src/lib/utils/translations/en.json`

Add under `course.navItem.lessons.exercises.all_exercises`:

```json
{
  "section.add": "Add Section",
  "section.untitled": "Untitled Section",
  "section.description_placeholder": "Description (optional)",
  "section.delete": "Delete Section",
  "section.delete_confirm": "What should happen to the questions in this section?",
  "section.delete_move": "Move to another section",
  "section.delete_remove": "Delete questions",
  "section.move_up": "Move section up",
  "section.move_down": "Move section down",
  "section.reorder": "Reorder Sections",
  "section.after_behavior_prefix": "After section",
  "section.after_continue": "Continue to next section",
  "section.after_go_to": "Go to section",
  "section.after_submit": "Submit exercise",
  "section.overview_begin": "Begin Section",
  "section.overview_questions": "questions",
  "section.overview_points": "points",
  "section.of": "of",
  "section.complete": "Complete Section",
  "section.display_mode_label": "Question display within sections",
  "section.display_mode_one": "One question at a time",
  "section.display_mode_all": "All questions at once",
  "section.subtotal": "Section subtotal",
  "section.move_question_to": "Move to section",
  "section.add_question_to": "Add question to section",
  "section.nav_label": "Section {number} of {total}"
}
```

### 10. Backward Compatibility

| Scenario | Behavior |
| --- | --- |
| Existing exercise, no sections | `sections` array is empty. All code paths fall through to existing flat-question logic. No migration needed. |
| Existing exercise, first section added | All questions auto-assigned to "Section 1". `sectionId` set on all questions. |
| Sectioned exercise, last section deleted | All questions become sectionless. `sectionId` set to `NULL`. Exercise reverts to flat mode. |
| Old API clients that don't send `sections` | `sections` field is optional in update payload. Omitting it means "don't change sections." |
| Exercise templates without sections | `sections` field is absent in JSONB. Template import uses `questions` array (current behavior). |

---

## Migration Plan

### Database Migration

1. Create `exercise_section` table.
2. Add `section_id` column to `question` table (nullable, FK to `exercise_section`).
3. Add `section_display_mode` column to `exercise` table (default `'one_question'`).
4. Add index on `question.section_id`.
5. No data migration needed — existing exercises remain sectionless.

### Rollout Strategy

1. **Feature flag**: `exercise_sections_enabled` (off by default).
2. Deploy database migration first (additive, no breaking changes).
3. Deploy API changes (backward compatible — sections are optional in all endpoints).
4. Deploy dashboard changes behind feature flag.
5. Enable flag for internal testing.
6. Gradual rollout to all users.

---

## File Change Manifest

### New Files

| File | Description |
| --- | --- |
| `packages/db/src/queries/exercise/exercise-section.ts` | CRUD queries for exercise sections |
| `packages/utils/src/validation/exercise/exercise-section.ts` | Zod schemas for section validation |
| `packages/question-types/src/exercise-section-types.ts` | TypeScript types for sections |
| `packages/ui/src/custom/exercise-question/section-header.svelte` | Section header UI component |
| `packages/ui/src/custom/exercise-question/section-after-behavior.svelte` | After-section behavior dropdown |
| `packages/ui/src/custom/exercise-question/section-navigation-sidebar.svelte` | Section-grouped question nav |
| `apps/dashboard/src/lib/features/course/components/exercise/section-editor.svelte` | Section editing card (edit mode) |
| `apps/dashboard/src/lib/features/course/components/exercise/section-overview.svelte` | Section overview screen (take mode) |
| `apps/dashboard/src/lib/features/course/components/exercise/section-delete-modal.svelte` | Section deletion confirmation |

### Modified Files

| File | Changes |
| --- | --- |
| `packages/db/src/schema.ts` | Add `exerciseSection` table, `sectionId` to `question`, `sectionDisplayMode` to `exercise` |
| `packages/db/src/queries/exercise/index.ts` | Export new section queries |
| `packages/question-types/src/index.ts` | Export `exercise-section-types` |
| `packages/ui/src/custom/exercise-question/index.ts` | Export new section components |
| `packages/ui/src/custom/exercise-question/question-navigation.svelte` | Add section-aware props |
| `packages/ui/src/custom/exercise-question/question-list.svelte` | Support section-grouped rendering |
| `apps/api/src/routes/course/exercise.ts` | Accept/return sections in exercise endpoints |
| `apps/api/src/services/exercise/exercise.ts` | Section upsert logic in exercise update |
| `apps/api/src/services/course/clone.ts` | Clone sections, remap IDs and afterBehavior references |
| `apps/dashboard/src/lib/features/course/components/exercise/store.ts` | Add `sections`, `sectionDisplayMode`, section helpers |
| `apps/dashboard/src/lib/features/course/components/exercise/edit-mode.svelte` | Render section-grouped editor |
| `apps/dashboard/src/lib/features/course/components/exercise/view-mode.svelte` | Section-aware take flow |
| `apps/dashboard/src/lib/features/course/components/exercise/preview.svelte` | Section-grouped preview |
| `apps/dashboard/src/lib/features/course/components/exercise/submissions/individual.svelte` | Section-grouped grading |
| `apps/dashboard/src/lib/features/course/components/exercise/submissions/summary.svelte` | Section-grouped analytics |
| `apps/dashboard/src/lib/features/course/pages/exercise.svelte` | "Add Section" button, section display mode setting |
| `apps/dashboard/src/lib/features/course/types.ts` | Extend `Question` with `sectionId` |
| `apps/dashboard/src/lib/utils/translations/en.json` | Section-related translation keys |

---

## Testing Requirements

### API

- Section CRUD operations (create, read, update, delete).
- Exercise update with sections — questions correctly assigned to sections.
- Exercise fetch returns sections with nested questions in correct order.
- After-behavior validation — `go_to_section` must reference a valid section.
- Clone service preserves sections, question mappings, and remaps afterBehavior sectionIds.
- Backward compat: exercise without sections works identically to before.
- Submission fetch returns section-grouped data when sections exist.

### Dashboard

- Edit mode: add/edit/delete/reorder sections.
- Edit mode: drag question between sections.
- Edit mode: add question to specific section.
- Edit mode: after-behavior dropdown shows correct options and persists selection.
- Edit mode: deleting a section with "move questions" moves them correctly.
- Take mode (`one_question`): section overview → questions one at a time → post-section behavior.
- Take mode (`all_questions`): section overview → all questions shown → complete section → post-section behavior.
- Take mode: progress bar reflects total questions across all sections.
- Take mode: section navigation sidebar shows correct grouping and answered state.
- Take mode: autosave preserves section + question position on resume.
- Preview mode: questions grouped under section headers.
- Grading: individual view shows section subtotals.
- Grading: summary view shows section-grouped charts.

### Regression

- Existing sectionless exercises: all CRUD, take, preview, grading flows unchanged.
- Exercise cloning without sections works as before.
- Exercise templates without sections work as before.

---

## Build and Verification Commands

```bash
pnpm --filter @cio/db build
pnpm --filter @cio/utils build
pnpm --filter @cio/question-types build
pnpm --filter @cio/ui build
pnpm --filter @cio/api build
pnpm --filter @cio/dashboard build
```

---

## Success Metrics (90 Days Post-Launch)

1. 30% of newly created exercises with 10+ questions use at least one section.
2. Students report improved navigation experience in sectioned exercises (qualitative feedback).
3. Grading time for sectioned exercises is comparable to flat exercises (no regression).
4. Zero backward-compatibility incidents for existing exercises.

---

## Risks and Mitigations

| Risk | Mitigation |
| --- | --- |
| Section-aware state machine in take mode adds complexity and potential navigation bugs | Comprehensive state machine tests; keep flat-exercise code path untouched |
| After-behavior "go to section" can create loops (A→B→A) | Validate at save time: warn if cycles detected, but allow (instructor may want loops intentionally for review) |
| Drag-and-drop between sections may be unreliable on mobile | Provide "Move to section" context menu as a fallback; drag-drop is enhancement only |
| Large exercises with many sections may slow down the editor | Lazy-render collapsed sections; only expand the active section |
| Clone service must remap `afterBehavior.sectionId` references | Explicit remap step in clone logic with validation |

---

## Open Questions

1. Should we support a "section shuffle" mode (randomize section order) independently of question shuffle?
2. Should the section navigation sidebar be collapsible or always visible during take mode?
3. Should after-behavior "Go to section X" carry over answered data, or should the target section reset?
