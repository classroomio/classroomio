ALTER TABLE "lesson" ALTER COLUMN "is_unlocked" SET DEFAULT true;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_submission_submitted_by_exercise_id" ON "submission" USING btree ("submitted_by","exercise_id");
