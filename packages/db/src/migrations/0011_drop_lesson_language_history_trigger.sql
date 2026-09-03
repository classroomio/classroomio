-- Legacy trigger that predates migrations: it inserted a `lesson_language_history`
-- row on every INSERT/UPDATE of `lesson_language`, writing `old_content`, which
-- migration 0009 removed. Any database still carrying it fails every write to
-- `lesson_language` with:
--
--   column "old_content" of relation "lesson_language_history" does not exist  (42703)
--
-- It is dropped rather than repaired. History is now written by the application
-- (`recordLessonLanguageVersion`), which coalesces consecutive autosaves into one
-- session and records the author and kind. A trigger firing on every write would
-- add a second, uncoalesced row per save and defeat that entirely.
--
-- Guarded, so environments that never had the trigger are unaffected.

DROP TRIGGER IF EXISTS "update_lesson_language_history_trigger" ON "lesson_language";--> statement-breakpoint
DROP FUNCTION IF EXISTS "public"."update_lesson_language_history"();
