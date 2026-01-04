---
name: Add currentLocale to lessonApi and replace $lesson with lessonApi
overview: Add `currentLocale` state to `lessonApi` class, then update `lesson-version-history.svelte` to use `lessonApi.lesson` and `lessonApi.currentLocale` instead of `$lesson` store, as part of migrating away from the `$lesson` store.
todos:
  - id: add-current-locale
    content: Add currentLocale state property to LessonApi class
    status: completed
  - id: remove-lesson-import
    content: Remove lesson store import from lesson-version-history.svelte
    status: completed
  - id: replace-lesson-locale
    content: Replace $lesson.locale with lessonApi.currentLocale on line 177
    status: completed
---

# Add currentLocale to lessonApi and replace $lesson with lessonApi

## Problem

1. Line 177 in `lesson-version-history.svelte` uses `$lesson.locale` but should use `lessonApi`
2. The `Lesson` type from the API doesn't include `locale` 
3. We want to migrate away from the `$lesson` store to use `lessonApi` instead

## Solution

1. Add `currentLocale` state property to `LessonApi` class to track the currently selected locale
2. Update `lesson-version-history.svelte` to use `lessonApi.currentLocale` instead of `$lesson.locale`
3. Lines 48-49 already use `lessonApi.lesson` correctly ✓

## Changes

### File: [apps/dashboard/src/lib/features/course/api/lesson.svelte.ts](apps/dashboard/src/lib/features/course/api/lesson.svelte.ts)

**Add `currentLocale` state property** after line 58:

```typescript
export class LessonApi extends BaseApiWithErrors {
  lesson = $state<Lesson | null>(null);
  lessons = $state<ListLessons>([]);
  sections = $state<LessonSectionWithLessons[]>([]);
  comments = $state<LessonComments>([]);
  translations = $state<Record<string, Record<TLocale, string>>>({});
  completion = $state<LessonCompletion | null>(null);
  currentLocale = $state<TLocale>('en'); // Add this line
  isSaving = $state(false);
  isDirty = $state(false);
  // ... rest of the class
}
```



### File: [apps/dashboard/src/lib/features/course/components/lesson/lesson-version-history.svelte](apps/dashboard/src/lib/features/course/components/lesson/lesson-version-history.svelte)

**Line 11:** Remove the import of `lesson` store (no longer needed):

```typescript
// Remove this line:
import { lesson } from '$features/course/components/lesson/store/lessons';
```

**Line 177:** Replace `$lesson.locale` with `lessonApi.currentLocale`:

```typescript
// Before:
$effect(() => {
  fetchLessonHistory(lessonId, $lesson.locale, versionsToFetch);
});

// After:
$effect(() => {
  fetchLessonHistory(lessonId, lessonApi.currentLocale, versionsToFetch);
});
```



## Notes