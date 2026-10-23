ALTER TABLE "groupmember" ADD COLUMN IF NOT EXISTS "completed_at" timestamp with time zone;--> statement-breakpoint
UPDATE "groupmember" SET "completed_at" = "certificate_earned_at" WHERE "completed_at" IS NULL AND "certificate_earned_at" IS NOT NULL;
