-- Legacy trigger writing the dropped `old_content`; history is now written by the app.

DROP TRIGGER IF EXISTS "update_lesson_language_history_trigger" ON "lesson_language";--> statement-breakpoint
DROP FUNCTION IF EXISTS "public"."update_lesson_language_history"();
