---
name: Refactor lessonDocUpload to use lessonApi types
overview: Refactor the document upload component to use document types and logic from lessonApi instead of duplicating fields. Extract the document type from the Lesson API type and use it consistently throughout the upload flow.
todos:
  - id: extract-document-type
    content: Add LessonDocument type export to lessonApi by extracting it from Lesson type
    status: pending
  - id: update-component-type
    content: Update add-document-to-lesson.svelte to use LessonDocument type from lessonApi when creating document object
    status: pending
    dependencies:
      - extract-document-type
  - id: update-store-type
    content: Update lessonDocUpload store to use LessonDocument type for uploadedDocument field
    status: pending
    dependencies:
      - extract-document-type
---

# Refact

or lessonDocUpload to use lessonApi types

## Current Issues

1. **Duplicated document structure**: The component manually creates a document object with fields (`type`, `name`, `link`, `key`, `size`) that should come from the `Lesson` type
2. **Type inconsistency**: The `uploadedDocument` in the store uses a custom type instead of the API type
3. **Missing type extraction**: No helper to extract the document type from `Lesson['documents'][number]`

## Solution

### 1. Add document type helper to lessonApi

- Extract the document type from `Lesson['documents'][number]` in [`apps/dashboard/src/lib/features/course/api/lesson.svelte.ts`](apps/dashboard/src/lib/features/course/api/lesson.svelte.ts)
- Create a type alias: `type LessonDocument = NonNullable<Lesson['documents']>[number]`
- Export this type for use in components

### 2. Update the component to use the API type

- In [`apps/dashboard/src/lib/features/course/components/lesson/materials/document/add-document-to-lesson.svelte`](apps/dashboard/src/lib/features/course/components/lesson/materials/document/add-document-to-lesson.svelte):
- Import the `LessonDocument` type from lessonApi
- Use this type when creating the document object (lines 125-131)
- Ensure the document structure matches the API type exactly

### 3. Update the store to use the API type

- In [`apps/dashboard/src/lib/features/course/components/lesson/store/lessons.ts`](apps/dashboard/src/lib/features/course/components/lesson/store/lessons.ts):
- Update `uploadedDocument` field to use `LessonDocument | null` instead of a custom type
- Import the type from lessonApi

### 4. Optional: Consider adding upload method to lessonApi

- If needed, add a `uploadDocument()` method to lessonApi that encapsulates the upload logic
- This would centralize the upload flow similar to other lesson operations

## Files to Modify

1. [`apps/dashboard/src/lib/features/course/api/lesson.svelte.ts`](apps/dashboard/src/lib/features/course/api/lesson.svelte.ts) - Add type export
2. [`apps/dashboard/src/lib/features/course/components/lesson/materials/document/add-document-to-lesson.svelte`](apps/dashboard/src/lib/features/course/components/lesson/materials/document/add-document-to-lesson.svelte) - Use API type