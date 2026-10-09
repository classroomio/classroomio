ALTER TABLE "lesson" ADD COLUMN IF NOT EXISTS "session_duration_minutes" integer;--> statement-breakpoint
ALTER TABLE "lesson" ADD COLUMN IF NOT EXISTS "recording_url" text;
