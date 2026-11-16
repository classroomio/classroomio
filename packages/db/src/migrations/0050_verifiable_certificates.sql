ALTER TABLE "course_certificate_issue" ALTER COLUMN "course_completion_record_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "course_certificate_issue" ALTER COLUMN "expires_at" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "course_certificate_issue" ADD COLUMN "verify_code" varchar(8);--> statement-breakpoint
ALTER TABLE "course_certificate_issue" ADD COLUMN "revoked_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "course_certificate_issue" ADD COLUMN "revoked_by" uuid;--> statement-breakpoint
ALTER TABLE "course_certificate_issue" ADD COLUMN "revoke_reason" text;--> statement-breakpoint
ALTER TABLE "course_certificate_issue" ADD COLUMN "metadata" jsonb DEFAULT '{}'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "course_certificate_issue" ADD CONSTRAINT "course_certificate_issue_revoked_by_fkey" FOREIGN KEY ("revoked_by") REFERENCES "public"."profile"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
CREATE UNIQUE INDEX "course_certificate_issue_verify_code_key" ON "course_certificate_issue" USING btree ("verify_code");--> statement-breakpoint
CREATE UNIQUE INDEX "course_certificate_issue_course_profile_cycle_key" ON "course_certificate_issue" USING btree ("course_id","profile_id","cycle_number");--> statement-breakpoint
CREATE INDEX "idx_course_certificate_issue_verify_code" ON "course_certificate_issue" USING btree ("verify_code");
