# Exercise Unlock & Completion Plan

## Goals
- Add `isUnlocked` for exercises (manual toggle by teachers).
- Compute `isComplete` **only** from submissions.
- Do not tie exercise unlock state to lessons or sections.
- Keep the design extensible for future unlock rules.

## Scope Summary
- **Backend**: add `isUnlocked` column + queries + API responses.
- **Dashboard**: show lock/check icons and block students from locked exercises.
- **No automation**: unlocking is purely manual for now.

## Detailed Implementation Steps

### 1) Database & Migrations
1. Add `isUnlocked` boolean to `exercise` schema with default `true`.
2. Create a migration to:
   - Add `is_unlocked` column (default `true`).
   - Backfill existing rows to `true`.
3. If needed, update backfill scripts to include `is_unlocked`.

### 2) Query Layer Updates
1. Extend exercise queries to select `isUnlocked`.
2. Add exercise completion computation:
   - `isComplete = submission exists` for `(exerciseId, profileId)`.
   - Use submission status rules consistent with existing completion logic.
3. Update course aggregate query to return exercises with:
   - `isUnlocked` (boolean)
   - `isComplete` (boolean derived)

### 3) API Contract Updates
1. Update exercise list/get responses to include `isUnlocked` and `isComplete`.
2. Update validation schemas to allow updating `isUnlocked`.
3. Add/update exercise update endpoint behavior:
   - Teachers/admins can toggle `isUnlocked`.
   - Students cannot modify.

### 4) Dashboard UI Updates
1. Sidebar content list:
   - Show a lock icon for locked exercises.
   - Show a check icon for completed exercises.
   - Clicking locked exercise as a student should be blocked.
2. Lessons list (linear and grouped):
   - Show lock/check icons for exercises.
3. Exercise detail page:
   - If student and exercise is locked, redirect or show blocked view.
4. Add lock/unlock action for exercises:
   - Mirror the lesson “Lock/Unlock” menu item.

### 5) Access & State Management
1. Update stores/types so `Exercise` includes `isUnlocked` and `isComplete`.
2. Ensure `exerciseApi.get` and `courseApi` store map these fields correctly.
3. Maintain legacy compatibility:
   - If `isUnlocked` is missing, treat as `true`.

### 6) Testing Checklist
1. Create exercise → `isUnlocked` defaults to `true`.
2. Toggle lock as teacher → student cannot open exercise.
3. Submit exercise → `isComplete` becomes `true` for that student.
4. Verify sidebar + list icons reflect lock/complete state.

## Future Extension (Rules-Based Unlocking)
- Add a `content_rules` table or metadata config to support:
  - Unlock next content after completion.
  - Unlock next section after specific exercise completion.
- Keep `isUnlocked` as the final gate (rules just update this flag).
