CREATE TABLE IF NOT EXISTS "course_certificate_verification" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"course_id" uuid NOT NULL,
	"profile_id" uuid NOT NULL,
	"group_member_id" uuid,
	"certificate_issue_id" uuid,
	"issued_at" timestamp with time zone NOT NULL,
	"expires_at" timestamp with time zone,
	"revoked_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "course_certificate_verification" ADD CONSTRAINT "course_certificate_verification_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "public"."course"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_certificate_verification" ADD CONSTRAINT "course_certificate_verification_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."profile"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_certificate_verification" ADD CONSTRAINT "course_certificate_verification_group_member_id_fkey" FOREIGN KEY ("group_member_id") REFERENCES "public"."groupmember"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_certificate_verification" ADD CONSTRAINT "course_certificate_verification_certificate_issue_id_fkey" FOREIGN KEY ("certificate_issue_id") REFERENCES "public"."course_certificate_issue"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "course_certificate_verification_certificate_issue_id_key" ON "course_certificate_verification" USING btree ("certificate_issue_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_course_certificate_verification_course_profile" ON "course_certificate_verification" USING btree ("course_id","profile_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_course_certificate_verification_group_member_id" ON "course_certificate_verification" USING btree ("group_member_id");--> statement-breakpoint
--> Backfill: every certificate already earned on a regular course gets a verification record.
INSERT INTO "course_certificate_verification" ("course_id", "profile_id", "group_member_id", "issued_at")
SELECT "course"."id", "groupmember"."profile_id", "groupmember"."id", "groupmember"."certificate_earned_at"
FROM "groupmember"
INNER JOIN "course" ON "course"."group_id" = "groupmember"."group_id"
WHERE "groupmember"."certificate_earned_at" IS NOT NULL
  AND "groupmember"."profile_id" IS NOT NULL
  AND "groupmember"."role_id" = 3
  AND "course"."type" IS DISTINCT FROM 'COMPLIANCE';--> statement-breakpoint
--> Backfill: every compliance certificate cycle already issued gets a verification record.
INSERT INTO "course_certificate_verification" ("course_id", "profile_id", "group_member_id", "certificate_issue_id", "issued_at", "expires_at")
SELECT "course_certificate_issue"."course_id", "course_certificate_issue"."profile_id", "groupmember"."id", "course_certificate_issue"."id", "course_certificate_issue"."issued_at", "course_certificate_issue"."expires_at"
FROM "course_certificate_issue"
INNER JOIN "course_completion_record" ON "course_completion_record"."id" = "course_certificate_issue"."course_completion_record_id"
LEFT JOIN "groupmember" ON "groupmember"."id" = "course_completion_record"."group_member_id"
ON CONFLICT ("certificate_issue_id") DO NOTHING;
