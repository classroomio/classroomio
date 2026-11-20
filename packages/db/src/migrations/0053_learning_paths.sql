--> Learning paths: ordered sequences of courses with path enrollment, per-course
--> path progress, path certificates and a per-course enrollment grant ledger.
--> Statements are idempotent so databases that already applied the learning path
--> preview migrations (0018_brave_randall / 0019_bent_ma_gnuci) converge too.
DO $$ BEGIN
  CREATE TYPE "public"."COURSE_ENROLLMENT_SOURCE" AS ENUM('SELF_ENROLL', 'INVITE', 'ADMIN_ADD', 'ORG_AUDIENCE', 'COHORT', 'LEARNING_PATH', 'PROGRAM', 'IMPORT');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint
DO $$ BEGIN
  CREATE TYPE "public"."LEARNING_PATH_CERTIFICATE_STATUS" AS ENUM('valid', 'revoked');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint
DO $$ BEGIN
  CREATE TYPE "public"."LEARNING_PATH_COURSE_STATUS" AS ENUM('LOCKED', 'NOT_STARTED', 'IN_PROGRESS', 'COMPLETED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint
DO $$ BEGIN
  CREATE TYPE "public"."LEARNING_PATH_MEMBER_STATUS" AS ENUM('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint
ALTER TYPE "public"."INVITE_LINK_RESOURCE_TYPE" ADD VALUE IF NOT EXISTS 'LEARNING_PATH';--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "learning_path" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"public_id" varchar(8) NOT NULL,
	"organization_id" uuid NOT NULL,
	"name" varchar NOT NULL,
	"slug" varchar,
	"status" text DEFAULT 'ACTIVE' NOT NULL,
	"description" text NOT NULL,
	"cover_image" text,
	"is_published" boolean DEFAULT false NOT NULL,
	"cost" bigint DEFAULT '0' NOT NULL,
	"currency" varchar DEFAULT 'USD' NOT NULL,
	"sequential_unlock" boolean DEFAULT true NOT NULL,
	"self_enrollment" boolean DEFAULT true NOT NULL,
	"certificate" jsonb DEFAULT '{}'::jsonb,
	"welcome_email_message" text,
	"landing_page" jsonb DEFAULT '{}'::jsonb,
	"course_order_set_at" timestamp with time zone,
	"created_by_profile_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "learning_path_public_id_unique" UNIQUE("public_id"),
	CONSTRAINT "learning_path_slug_key" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "learning_path_course" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"learning_path_id" uuid NOT NULL,
	"course_id" uuid NOT NULL,
	"order" integer NOT NULL,
	"added_at" timestamp with time zone DEFAULT now() NOT NULL,
	"removed_at" timestamp with time zone,
	CONSTRAINT "learning_path_course_path_id_course_id_unique" UNIQUE("learning_path_id","course_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "learning_path_member" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"learning_path_id" uuid NOT NULL,
	"profile_id" uuid NOT NULL,
	"email" text,
	"role_id" bigint NOT NULL,
	"enrolled_at" timestamp with time zone DEFAULT now() NOT NULL,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"removed_at" timestamp with time zone,
	"status" "LEARNING_PATH_MEMBER_STATUS" DEFAULT 'NOT_STARTED' NOT NULL,
	"progress_percent" integer DEFAULT 0 NOT NULL,
	"completed_course_count" integer DEFAULT 0 NOT NULL,
	"current_course_id" uuid,
	"last_activity_at" timestamp with time zone,
	CONSTRAINT "learning_path_member_path_id_profile_id_unique" UNIQUE("learning_path_id","profile_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "learning_path_member_course" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"learning_path_member_id" uuid NOT NULL,
	"learning_path_course_id" uuid NOT NULL,
	"status" "LEARNING_PATH_COURSE_STATUS" DEFAULT 'LOCKED' NOT NULL,
	"progress_percent" integer DEFAULT 0 NOT NULL,
	"lessons_completed" integer DEFAULT 0 NOT NULL,
	"lessons_total" integer DEFAULT 0 NOT NULL,
	"exercises_completed" integer DEFAULT 0 NOT NULL,
	"exercises_total" integer DEFAULT 0 NOT NULL,
	"unlocked_at" timestamp with time zone,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "learning_path_member_course_member_id_path_course_id_unique" UNIQUE("learning_path_member_id","learning_path_course_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "learning_path_certificate_issue" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"learning_path_id" uuid NOT NULL,
	"learning_path_member_id" uuid NOT NULL,
	"profile_id" uuid NOT NULL,
	"certificate_id" varchar NOT NULL,
	"title" text NOT NULL,
	"issuer" text,
	"issued_at" timestamp with time zone DEFAULT now() NOT NULL,
	"status" "LEARNING_PATH_CERTIFICATE_STATUS" DEFAULT 'valid' NOT NULL,
	"revoked_at" timestamp with time zone,
	"file_url" text,
	CONSTRAINT "learning_path_certificate_issue_certificate_id_key" UNIQUE("certificate_id"),
	CONSTRAINT "learning_path_certificate_issue_member_id_key" UNIQUE("learning_path_member_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "course_enrollment_grant" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"groupmember_id" uuid NOT NULL,
	"course_id" uuid NOT NULL,
	"profile_id" uuid,
	"source" "COURSE_ENROLLMENT_SOURCE" NOT NULL,
	"cohort_id" uuid,
	"learning_path_id" uuid,
	"granted_by_profile_id" uuid,
	"granted_at" timestamp with time zone DEFAULT now() NOT NULL,
	"revoked_at" timestamp with time zone,
	CONSTRAINT "course_enrollment_grant_source_unique" UNIQUE NULLS NOT DISTINCT("groupmember_id","course_id","source","cohort_id","learning_path_id")
);
--> statement-breakpoint
--> Databases that applied the preview migration got a per-org partial slug index
--> instead of the global slug uniqueness the schema declares.
DROP INDEX IF EXISTS "idx_learning_path_org_slug_active";--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'learning_path'::regclass AND conname = 'learning_path_slug_key') THEN
    ALTER TABLE "learning_path" ADD CONSTRAINT "learning_path_slug_key" UNIQUE ("slug");
  END IF;
END $$;--> statement-breakpoint
ALTER TABLE "course" ADD COLUMN IF NOT EXISTS "enroll_only_in_learning_path" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "invite_link" ADD COLUMN IF NOT EXISTS "learning_path_id" uuid;--> statement-breakpoint
--> question_answer_group_member_id_fkey is ON DELETE SET NULL since 0017, which
--> cannot succeed while the column is NOT NULL.
ALTER TABLE "question_answer" ALTER COLUMN "group_member_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "learning_path" DROP CONSTRAINT IF EXISTS "learning_path_organization_id_fkey";--> statement-breakpoint
ALTER TABLE "learning_path" ADD CONSTRAINT "learning_path_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learning_path" DROP CONSTRAINT IF EXISTS "learning_path_created_by_profile_id_fkey";--> statement-breakpoint
ALTER TABLE "learning_path" ADD CONSTRAINT "learning_path_created_by_profile_id_fkey" FOREIGN KEY ("created_by_profile_id") REFERENCES "public"."profile"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learning_path_course" DROP CONSTRAINT IF EXISTS "learning_path_course_learning_path_id_fkey";--> statement-breakpoint
ALTER TABLE "learning_path_course" ADD CONSTRAINT "learning_path_course_learning_path_id_fkey" FOREIGN KEY ("learning_path_id") REFERENCES "public"."learning_path"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learning_path_course" DROP CONSTRAINT IF EXISTS "learning_path_course_course_id_fkey";--> statement-breakpoint
ALTER TABLE "learning_path_course" ADD CONSTRAINT "learning_path_course_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "public"."course"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learning_path_member" DROP CONSTRAINT IF EXISTS "learning_path_member_learning_path_id_fkey";--> statement-breakpoint
ALTER TABLE "learning_path_member" ADD CONSTRAINT "learning_path_member_learning_path_id_fkey" FOREIGN KEY ("learning_path_id") REFERENCES "public"."learning_path"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learning_path_member" DROP CONSTRAINT IF EXISTS "learning_path_member_profile_id_fkey";--> statement-breakpoint
ALTER TABLE "learning_path_member" ADD CONSTRAINT "learning_path_member_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."profile"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learning_path_member" DROP CONSTRAINT IF EXISTS "learning_path_member_role_id_fkey";--> statement-breakpoint
ALTER TABLE "learning_path_member" ADD CONSTRAINT "learning_path_member_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "public"."role"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learning_path_member" DROP CONSTRAINT IF EXISTS "learning_path_member_current_course_id_fkey";--> statement-breakpoint
ALTER TABLE "learning_path_member" ADD CONSTRAINT "learning_path_member_current_course_id_fkey" FOREIGN KEY ("current_course_id") REFERENCES "public"."course"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learning_path_member_course" DROP CONSTRAINT IF EXISTS "learning_path_member_course_member_id_fkey";--> statement-breakpoint
ALTER TABLE "learning_path_member_course" ADD CONSTRAINT "learning_path_member_course_member_id_fkey" FOREIGN KEY ("learning_path_member_id") REFERENCES "public"."learning_path_member"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learning_path_member_course" DROP CONSTRAINT IF EXISTS "learning_path_member_course_path_course_id_fkey";--> statement-breakpoint
ALTER TABLE "learning_path_member_course" ADD CONSTRAINT "learning_path_member_course_path_course_id_fkey" FOREIGN KEY ("learning_path_course_id") REFERENCES "public"."learning_path_course"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learning_path_certificate_issue" DROP CONSTRAINT IF EXISTS "learning_path_certificate_issue_learning_path_id_fkey";--> statement-breakpoint
ALTER TABLE "learning_path_certificate_issue" ADD CONSTRAINT "learning_path_certificate_issue_learning_path_id_fkey" FOREIGN KEY ("learning_path_id") REFERENCES "public"."learning_path"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learning_path_certificate_issue" DROP CONSTRAINT IF EXISTS "learning_path_certificate_issue_member_id_fkey";--> statement-breakpoint
ALTER TABLE "learning_path_certificate_issue" ADD CONSTRAINT "learning_path_certificate_issue_member_id_fkey" FOREIGN KEY ("learning_path_member_id") REFERENCES "public"."learning_path_member"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learning_path_certificate_issue" DROP CONSTRAINT IF EXISTS "learning_path_certificate_issue_profile_id_fkey";--> statement-breakpoint
ALTER TABLE "learning_path_certificate_issue" ADD CONSTRAINT "learning_path_certificate_issue_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."profile"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_enrollment_grant" DROP CONSTRAINT IF EXISTS "course_enrollment_grant_groupmember_id_fkey";--> statement-breakpoint
ALTER TABLE "course_enrollment_grant" ADD CONSTRAINT "course_enrollment_grant_groupmember_id_fkey" FOREIGN KEY ("groupmember_id") REFERENCES "public"."groupmember"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_enrollment_grant" DROP CONSTRAINT IF EXISTS "course_enrollment_grant_course_id_fkey";--> statement-breakpoint
ALTER TABLE "course_enrollment_grant" ADD CONSTRAINT "course_enrollment_grant_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "public"."course"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_enrollment_grant" DROP CONSTRAINT IF EXISTS "course_enrollment_grant_profile_id_fkey";--> statement-breakpoint
ALTER TABLE "course_enrollment_grant" ADD CONSTRAINT "course_enrollment_grant_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."profile"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_enrollment_grant" DROP CONSTRAINT IF EXISTS "course_enrollment_grant_cohort_id_fkey";--> statement-breakpoint
ALTER TABLE "course_enrollment_grant" ADD CONSTRAINT "course_enrollment_grant_cohort_id_fkey" FOREIGN KEY ("cohort_id") REFERENCES "public"."cohort"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_enrollment_grant" DROP CONSTRAINT IF EXISTS "course_enrollment_grant_learning_path_id_fkey";--> statement-breakpoint
ALTER TABLE "course_enrollment_grant" ADD CONSTRAINT "course_enrollment_grant_learning_path_id_fkey" FOREIGN KEY ("learning_path_id") REFERENCES "public"."learning_path"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_enrollment_grant" DROP CONSTRAINT IF EXISTS "course_enrollment_grant_granted_by_profile_id_fkey";--> statement-breakpoint
ALTER TABLE "course_enrollment_grant" ADD CONSTRAINT "course_enrollment_grant_granted_by_profile_id_fkey" FOREIGN KEY ("granted_by_profile_id") REFERENCES "public"."profile"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invite_link" DROP CONSTRAINT IF EXISTS "invite_link_learning_path_id_fkey";--> statement-breakpoint
ALTER TABLE "invite_link" ADD CONSTRAINT "invite_link_learning_path_id_fkey" FOREIGN KEY ("learning_path_id") REFERENCES "public"."learning_path"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_newsfeed" DROP CONSTRAINT IF EXISTS "course_newsfeed_author_id_fkey";--> statement-breakpoint
ALTER TABLE "course_newsfeed" ADD CONSTRAINT "course_newsfeed_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "public"."groupmember"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_newsfeed_comment" DROP CONSTRAINT IF EXISTS "course_newsfeed_comment_author_id_fkey";--> statement-breakpoint
ALTER TABLE "course_newsfeed_comment" ADD CONSTRAINT "course_newsfeed_comment_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "public"."groupmember"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "group_attendance" DROP CONSTRAINT IF EXISTS "group_attendance_student_id_fkey";--> statement-breakpoint
ALTER TABLE "group_attendance" ADD CONSTRAINT "group_attendance_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "public"."groupmember"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_learning_path_organization_id" ON "learning_path" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_learning_path_organization_id_is_published" ON "learning_path" USING btree ("organization_id","is_published");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_learning_path_course_path_id_order" ON "learning_path_course" USING btree ("learning_path_id","order");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_learning_path_course_course_id" ON "learning_path_course" USING btree ("course_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "idx_learning_path_member_path_email_active" ON "learning_path_member" USING btree ("learning_path_id","email") WHERE "learning_path_member"."removed_at" IS NULL;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_learning_path_member_learning_path_id" ON "learning_path_member" USING btree ("learning_path_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_learning_path_member_profile_id" ON "learning_path_member" USING btree ("profile_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_learning_path_member_path_role_status" ON "learning_path_member" USING btree ("learning_path_id","role_id","status") WHERE "learning_path_member"."removed_at" IS NULL;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_learning_path_member_course_member_id" ON "learning_path_member_course" USING btree ("learning_path_member_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_learning_path_member_course_path_course_id" ON "learning_path_member_course" USING btree ("learning_path_course_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_learning_path_certificate_issue_profile_id" ON "learning_path_certificate_issue" USING btree ("profile_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_learning_path_certificate_issue_learning_path_id" ON "learning_path_certificate_issue" USING btree ("learning_path_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_course_enrollment_grant_course_id_source" ON "course_enrollment_grant" USING btree ("course_id","source");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_course_enrollment_grant_groupmember_id" ON "course_enrollment_grant" USING btree ("groupmember_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_course_enrollment_grant_cohort_id_course_id" ON "course_enrollment_grant" USING btree ("cohort_id","course_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_course_enrollment_grant_learning_path_id_course_id" ON "course_enrollment_grant" USING btree ("learning_path_id","course_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_course_enrollment_grant_profile_id" ON "course_enrollment_grant" USING btree ("profile_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_course_enrollment_grant_lp_profile_revoked" ON "course_enrollment_grant" USING btree ("learning_path_id","profile_id") WHERE "course_enrollment_grant"."revoked_at" IS NULL;--> statement-breakpoint
--> The preview migration created this duplicate of 0051's idx_lesson_completion_profile_id_lesson_id.
DROP INDEX IF EXISTS "idx_lesson_completion_profile_lesson";--> statement-breakpoint
ALTER TABLE "invite_link" DROP CONSTRAINT IF EXISTS "invite_link_learning_path_id_role_id_unique";--> statement-breakpoint
ALTER TABLE "invite_link" ADD CONSTRAINT "invite_link_learning_path_id_role_id_unique" UNIQUE("learning_path_id","role_id");--> statement-breakpoint
ALTER TABLE "invite_link" DROP CONSTRAINT IF EXISTS "invite_link_resource_target_check";--> statement-breakpoint
ALTER TABLE "invite_link" ADD CONSTRAINT "invite_link_resource_target_check" CHECK ((
        ("invite_link"."resource_type"::text = 'COURSE' AND "invite_link"."course_id" IS NOT NULL AND "invite_link"."cohort_id" IS NULL AND "invite_link"."learning_path_id" IS NULL)
        OR ("invite_link"."resource_type"::text = 'COHORT' AND "invite_link"."cohort_id" IS NOT NULL AND "invite_link"."course_id" IS NULL AND "invite_link"."learning_path_id" IS NULL)
        OR ("invite_link"."resource_type"::text = 'LEARNING_PATH' AND "invite_link"."learning_path_id" IS NOT NULL AND "invite_link"."course_id" IS NULL AND "invite_link"."cohort_id" IS NULL)
      ));--> statement-breakpoint
--> Give existing MCP keys the learning_path:read and learning_path:write scopes that new MCP keys get by default.
--> Only keys holding the full previous default set are touched, so a key created
--> with a narrower custom scope list is not widened. Only missing scopes are appended.
UPDATE "organization_api_key"
SET "scopes" = "scopes" || (
  SELECT jsonb_agg(scope)
  FROM jsonb_array_elements_text('["learning_path:read", "learning_path:write"]'::jsonb) AS scope
  WHERE NOT "organization_api_key"."scopes" ? scope
)
WHERE "type" = 'mcp'
  AND "scopes" @> '["course_import:draft:create", "course_import:draft:read", "course_import:draft:update", "course_import:draft:publish", "course:read", "course:write", "course:tag:write", "course:exercise:read", "course:exercise:write", "cohort:read", "cohort:write", "course:member:read", "course:member:write", "course:certificate:read", "course:certificate:write", "analytics:read", "media:write", "course:submission:read", "course:submission:write", "course:student:write", "audience:read", "audience:write", "team:read", "team:write", "organization:read", "organization:write", "organization:domain:write"]'::jsonb
  AND NOT "scopes" @> '["learning_path:read", "learning_path:write"]'::jsonb;--> statement-breakpoint
--> Record groupmember.completed_at for students who already finished all course content before
--> completion was recorded (mainly plans without certificates). Same rule as completion evaluation:
--> every lesson and exercise whose completion_policy is not 'none' is done, and the course has at least one.
--> db:setup then copies certificate_earned_at over this date where a certificate was earned.
WITH "finished" AS (
SELECT gm."id"
FROM "groupmember" AS gm
JOIN "course" AS c ON c."group_id" = gm."group_id"
CROSS JOIN LATERAL (
  SELECT
    (SELECT count(*) FROM "lesson" l WHERE l."course_id" = c."id" AND l."completion_policy" != 'none') AS lessons_total,
    (SELECT count(*) FROM "lesson_completion" lc JOIN "lesson" l ON l."id" = lc."lesson_id"
      WHERE l."course_id" = c."id" AND l."completion_policy" != 'none' AND lc."profile_id" = gm."profile_id" AND lc."is_complete") AS lessons_completed,
    (SELECT count(*) FROM "exercise" e LEFT JOIN "lesson" l ON l."id" = e."lesson_id"
      WHERE (e."course_id" = c."id" OR l."course_id" = c."id") AND e."completion_policy" != 'none') AS exercises_total,
    (SELECT count(*) FROM "exercise" e LEFT JOIN "lesson" l ON l."id" = e."lesson_id"
      WHERE (e."course_id" = c."id" OR l."course_id" = c."id") AND e."completion_policy" != 'none'
        AND EXISTS (
          SELECT 1 FROM "submission" cs
          WHERE cs."exercise_id" = e."id" AND cs."submitted_by" = gm."id"
            AND (
              e."completion_policy" != 'passed'
              OR (
                cs."grading_state" = 'completed'
                AND (
                  SELECT CASE
                    WHEN COALESCE(SUM(q."points"), 0) <= 0 THEN false
                    ELSE ROUND((cs."total"::numeric / SUM(q."points")::numeric) * 100) >= COALESCE(e."pass_threshold", 100)
                  END
                  FROM "question" q WHERE q."exercise_id" = e."id"
                )
              )
            )
        )) AS exercises_completed
) AS progress
WHERE c."status" = 'ACTIVE'
  AND gm."completed_at" IS NULL
  AND gm."profile_id" IS NOT NULL
  AND gm."role_id" = 3
  AND progress.lessons_total + progress.exercises_total > 0
  AND progress.lessons_completed + progress.exercises_completed >= progress.lessons_total + progress.exercises_total
)
UPDATE "groupmember"
SET "completed_at" = now()
FROM "finished"
WHERE "groupmember"."id" = "finished"."id";
