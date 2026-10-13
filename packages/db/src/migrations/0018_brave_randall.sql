CREATE TYPE "public"."COURSE_ENROLLMENT_SOURCE" AS ENUM('SELF_ENROLL', 'INVITE', 'ADMIN_ADD', 'ORG_AUDIENCE', 'COHORT', 'LEARNING_PATH', 'PROGRAM', 'IMPORT');--> statement-breakpoint
CREATE TYPE "public"."LEARNING_PATH_CERTIFICATE_STATUS" AS ENUM('valid', 'revoked');--> statement-breakpoint
CREATE TYPE "public"."LEARNING_PATH_COURSE_STATUS" AS ENUM('LOCKED', 'NOT_STARTED', 'IN_PROGRESS', 'COMPLETED');--> statement-breakpoint
CREATE TYPE "public"."LEARNING_PATH_MEMBER_STATUS" AS ENUM('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED');--> statement-breakpoint
CREATE TYPE "public"."ORGANIZATION_MEMBER_EVENT_TYPE" AS ENUM('DEACTIVATED', 'REACTIVATED', 'ARCHIVED', 'UNARCHIVED', 'REMOVED');--> statement-breakpoint
CREATE TYPE "public"."ORGANIZATION_MEMBER_STATUS" AS ENUM('ACTIVE', 'DEACTIVATED', 'ARCHIVED');--> statement-breakpoint
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON t.oid = e.enumtypid WHERE t.typname = 'INVITE_LINK_RESOURCE_TYPE' AND e.enumlabel = 'LEARNING_PATH') THEN ALTER TYPE "public"."INVITE_LINK_RESOURCE_TYPE" ADD VALUE 'LEARNING_PATH'; END IF; END $$;--> statement-breakpoint
CREATE TABLE "course_enrollment_grant" (
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
CREATE TABLE "learning_path" (
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
	CONSTRAINT "learning_path_public_id_unique" UNIQUE("public_id")
);
--> statement-breakpoint
CREATE TABLE "learning_path_certificate_issue" (
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
CREATE TABLE "learning_path_course" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"learning_path_id" uuid NOT NULL,
	"course_id" uuid NOT NULL,
	"order" integer NOT NULL,
	"added_at" timestamp with time zone DEFAULT now() NOT NULL,
	"removed_at" timestamp with time zone,
	CONSTRAINT "learning_path_course_path_id_course_id_unique" UNIQUE("learning_path_id","course_id")
);
--> statement-breakpoint
CREATE TABLE "learning_path_member" (
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
CREATE TABLE "learning_path_member_course" (
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
CREATE TABLE "organization_member_audit" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"member_id" bigint,
	"profile_id" uuid,
	"target_email" varchar,
	"event_type" "ORGANIZATION_MEMBER_EVENT_TYPE" NOT NULL,
	"actor_profile_id" uuid,
	"reason" text,
	"filter_snapshot" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);
--> statement-breakpoint
ALTER TABLE "invite_link" DROP CONSTRAINT "invite_link_resource_target_check";--> statement-breakpoint
ALTER TABLE "apps_poll" DROP CONSTRAINT "apps_poll_authorId_fkey";
--> statement-breakpoint
ALTER TABLE "apps_poll_submission" DROP CONSTRAINT "apps_poll_submission_selected_by_id_fkey";
--> statement-breakpoint
ALTER TABLE "course_newsfeed" DROP CONSTRAINT "course_newsfeed_author_id_fkey";
--> statement-breakpoint
ALTER TABLE "course_newsfeed_comment" DROP CONSTRAINT "course_newsfeed_comment_author_id_fkey";
--> statement-breakpoint
ALTER TABLE "group_attendance" DROP CONSTRAINT "group_attendance_student_id_fkey";
--> statement-breakpoint
ALTER TABLE "lesson_comment" DROP CONSTRAINT "lesson_comment_groupmember_id_fkey";
--> statement-breakpoint
ALTER TABLE "question_answer" DROP CONSTRAINT "question_answer_group_member_id_fkey";
--> statement-breakpoint
ALTER TABLE "submission" DROP CONSTRAINT "submission_submitted_by_fkey";
--> statement-breakpoint
ALTER TABLE "question_answer" ALTER COLUMN "group_member_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "course" ADD COLUMN "enroll_only_in_learning_path" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "invite_link" ADD COLUMN "learning_path_id" uuid;--> statement-breakpoint
ALTER TABLE "organizationmember" ADD COLUMN "status" "ORGANIZATION_MEMBER_STATUS" DEFAULT 'ACTIVE' NOT NULL;--> statement-breakpoint
ALTER TABLE "organizationmember" ADD COLUMN "status_changed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "organizationmember" ADD COLUMN "status_changed_by" uuid;--> statement-breakpoint
ALTER TABLE "organizationmember" ADD COLUMN "last_active_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "course_enrollment_grant" ADD CONSTRAINT "course_enrollment_grant_groupmember_id_fkey" FOREIGN KEY ("groupmember_id") REFERENCES "public"."groupmember"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_enrollment_grant" ADD CONSTRAINT "course_enrollment_grant_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "public"."course"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_enrollment_grant" ADD CONSTRAINT "course_enrollment_grant_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."profile"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_enrollment_grant" ADD CONSTRAINT "course_enrollment_grant_cohort_id_fkey" FOREIGN KEY ("cohort_id") REFERENCES "public"."cohort"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_enrollment_grant" ADD CONSTRAINT "course_enrollment_grant_learning_path_id_fkey" FOREIGN KEY ("learning_path_id") REFERENCES "public"."learning_path"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_enrollment_grant" ADD CONSTRAINT "course_enrollment_grant_granted_by_profile_id_fkey" FOREIGN KEY ("granted_by_profile_id") REFERENCES "public"."profile"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learning_path" ADD CONSTRAINT "learning_path_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learning_path" ADD CONSTRAINT "learning_path_created_by_profile_id_fkey" FOREIGN KEY ("created_by_profile_id") REFERENCES "public"."profile"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learning_path_certificate_issue" ADD CONSTRAINT "learning_path_certificate_issue_learning_path_id_fkey" FOREIGN KEY ("learning_path_id") REFERENCES "public"."learning_path"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learning_path_certificate_issue" ADD CONSTRAINT "learning_path_certificate_issue_member_id_fkey" FOREIGN KEY ("learning_path_member_id") REFERENCES "public"."learning_path_member"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learning_path_certificate_issue" ADD CONSTRAINT "learning_path_certificate_issue_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."profile"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learning_path_course" ADD CONSTRAINT "learning_path_course_learning_path_id_fkey" FOREIGN KEY ("learning_path_id") REFERENCES "public"."learning_path"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learning_path_course" ADD CONSTRAINT "learning_path_course_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "public"."course"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learning_path_member" ADD CONSTRAINT "learning_path_member_learning_path_id_fkey" FOREIGN KEY ("learning_path_id") REFERENCES "public"."learning_path"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learning_path_member" ADD CONSTRAINT "learning_path_member_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."profile"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learning_path_member" ADD CONSTRAINT "learning_path_member_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "public"."role"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learning_path_member" ADD CONSTRAINT "learning_path_member_current_course_id_fkey" FOREIGN KEY ("current_course_id") REFERENCES "public"."course"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learning_path_member_course" ADD CONSTRAINT "learning_path_member_course_member_id_fkey" FOREIGN KEY ("learning_path_member_id") REFERENCES "public"."learning_path_member"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learning_path_member_course" ADD CONSTRAINT "learning_path_member_course_path_course_id_fkey" FOREIGN KEY ("learning_path_course_id") REFERENCES "public"."learning_path_course"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_member_audit" ADD CONSTRAINT "organization_member_audit_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_member_audit" ADD CONSTRAINT "organization_member_audit_actor_profile_id_fkey" FOREIGN KEY ("actor_profile_id") REFERENCES "public"."profile"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_course_enrollment_grant_course_id_source" ON "course_enrollment_grant" USING btree ("course_id","source");--> statement-breakpoint
CREATE INDEX "idx_course_enrollment_grant_groupmember_id" ON "course_enrollment_grant" USING btree ("groupmember_id");--> statement-breakpoint
CREATE INDEX "idx_course_enrollment_grant_cohort_id_course_id" ON "course_enrollment_grant" USING btree ("cohort_id","course_id");--> statement-breakpoint
CREATE INDEX "idx_course_enrollment_grant_learning_path_id_course_id" ON "course_enrollment_grant" USING btree ("learning_path_id","course_id");--> statement-breakpoint
CREATE INDEX "idx_course_enrollment_grant_profile_id" ON "course_enrollment_grant" USING btree ("profile_id");--> statement-breakpoint
CREATE INDEX "idx_course_enrollment_grant_lp_profile_revoked" ON "course_enrollment_grant" USING btree ("learning_path_id","profile_id") WHERE "course_enrollment_grant"."revoked_at" IS NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "idx_learning_path_org_slug_active" ON "learning_path" USING btree ("organization_id","slug") WHERE "learning_path"."status" != 'DELETED';--> statement-breakpoint
CREATE INDEX "idx_learning_path_organization_id" ON "learning_path" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_learning_path_organization_id_is_published" ON "learning_path" USING btree ("organization_id","is_published");--> statement-breakpoint
CREATE INDEX "idx_learning_path_certificate_issue_profile_id" ON "learning_path_certificate_issue" USING btree ("profile_id");--> statement-breakpoint
CREATE INDEX "idx_learning_path_certificate_issue_learning_path_id" ON "learning_path_certificate_issue" USING btree ("learning_path_id");--> statement-breakpoint
CREATE INDEX "idx_learning_path_course_path_id_order" ON "learning_path_course" USING btree ("learning_path_id","order");--> statement-breakpoint
CREATE INDEX "idx_learning_path_course_course_id" ON "learning_path_course" USING btree ("course_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_learning_path_member_path_email_active" ON "learning_path_member" USING btree ("learning_path_id","email") WHERE "learning_path_member"."removed_at" IS NULL;--> statement-breakpoint
CREATE INDEX "idx_learning_path_member_learning_path_id" ON "learning_path_member" USING btree ("learning_path_id");--> statement-breakpoint
CREATE INDEX "idx_learning_path_member_profile_id" ON "learning_path_member" USING btree ("profile_id");--> statement-breakpoint
CREATE INDEX "idx_learning_path_member_path_role_status" ON "learning_path_member" USING btree ("learning_path_id","role_id","status") WHERE "learning_path_member"."removed_at" IS NULL;--> statement-breakpoint
CREATE INDEX "idx_learning_path_member_course_member_id" ON "learning_path_member_course" USING btree ("learning_path_member_id");--> statement-breakpoint
CREATE INDEX "idx_learning_path_member_course_path_course_id" ON "learning_path_member_course" USING btree ("learning_path_course_id");--> statement-breakpoint
CREATE INDEX "idx_organization_member_audit_org_id" ON "organization_member_audit" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_organization_member_audit_member_id" ON "organization_member_audit" USING btree ("member_id");--> statement-breakpoint
CREATE INDEX "idx_organization_member_audit_profile_id" ON "organization_member_audit" USING btree ("profile_id");--> statement-breakpoint
CREATE INDEX "idx_organization_member_audit_event_type" ON "organization_member_audit" USING btree ("event_type");--> statement-breakpoint
CREATE INDEX "idx_organization_member_audit_created_at" ON "organization_member_audit" USING btree ("created_at");--> statement-breakpoint
ALTER TABLE "apps_poll" ADD CONSTRAINT "apps_poll_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "public"."groupmember"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "apps_poll_submission" ADD CONSTRAINT "apps_poll_submission_selected_by_id_fkey" FOREIGN KEY ("selected_by_id") REFERENCES "public"."groupmember"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_newsfeed" ADD CONSTRAINT "course_newsfeed_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "public"."groupmember"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_newsfeed_comment" ADD CONSTRAINT "course_newsfeed_comment_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "public"."groupmember"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "group_attendance" ADD CONSTRAINT "group_attendance_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "public"."groupmember"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invite_link" ADD CONSTRAINT "invite_link_learning_path_id_fkey" FOREIGN KEY ("learning_path_id") REFERENCES "public"."learning_path"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lesson_comment" ADD CONSTRAINT "lesson_comment_groupmember_id_fkey" FOREIGN KEY ("groupmember_id") REFERENCES "public"."groupmember"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organizationmember" ADD CONSTRAINT "organizationmember_status_changed_by_fkey" FOREIGN KEY ("status_changed_by") REFERENCES "public"."profile"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "question_answer" ADD CONSTRAINT "question_answer_group_member_id_fkey" FOREIGN KEY ("group_member_id") REFERENCES "public"."groupmember"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "submission" ADD CONSTRAINT "submission_submitted_by_fkey" FOREIGN KEY ("submitted_by") REFERENCES "public"."groupmember"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_lesson_completion_profile_lesson" ON "lesson_completion" USING btree ("profile_id","lesson_id");--> statement-breakpoint
CREATE INDEX "idx_orgmember_org_role_status" ON "organizationmember" USING btree ("organization_id","role_id","status");--> statement-breakpoint
CREATE INDEX "idx_orgmember_org_last_active" ON "organizationmember" USING btree ("organization_id","last_active_at");--> statement-breakpoint
CREATE INDEX "idx_question_exercise_id" ON "question" USING btree ("exercise_id");--> statement-breakpoint
ALTER TABLE "invite_link" ADD CONSTRAINT "invite_link_learning_path_id_role_id_unique" UNIQUE("learning_path_id","role_id");--> statement-breakpoint
ALTER TABLE "invite_link" ADD CONSTRAINT "invite_link_resource_target_check" CHECK ((
        ("invite_link"."resource_type"::text = 'COURSE' AND "invite_link"."course_id" IS NOT NULL AND "invite_link"."cohort_id" IS NULL AND "invite_link"."learning_path_id" IS NULL)
        OR ("invite_link"."resource_type"::text = 'COHORT' AND "invite_link"."cohort_id" IS NOT NULL AND "invite_link"."course_id" IS NULL AND "invite_link"."learning_path_id" IS NULL)
        OR ("invite_link"."resource_type"::text = 'LEARNING_PATH' AND "invite_link"."learning_path_id" IS NOT NULL AND "invite_link"."course_id" IS NULL AND "invite_link"."cohort_id" IS NULL)
      ));