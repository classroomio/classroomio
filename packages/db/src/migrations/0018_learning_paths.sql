CREATE TYPE "public"."COURSE_ENROLLMENT_SOURCE" AS ENUM('SELF_ENROLL', 'INVITE', 'ADMIN_ADD', 'ORG_AUDIENCE', 'COHORT', 'LEARNING_PATH', 'PROGRAM', 'IMPORT');--> statement-breakpoint
CREATE TYPE "public"."LEARNING_PATH_COURSE_STATUS" AS ENUM('LOCKED', 'NOT_STARTED', 'IN_PROGRESS', 'COMPLETED');--> statement-breakpoint
CREATE TYPE "public"."LEARNING_PATH_DIFFICULTY" AS ENUM('BEGINNER', 'INTERMEDIATE', 'ADVANCED');--> statement-breakpoint
CREATE TYPE "public"."LEARNING_PATH_MEMBER_STATUS" AS ENUM('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED');--> statement-breakpoint
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
	"slug" varchar NOT NULL,
	"description" text NOT NULL,
	"cover_image" text,
	"is_published" boolean DEFAULT false NOT NULL,
	"difficulty" "LEARNING_PATH_DIFFICULTY",
	"estimated_duration_minutes" integer,
	"cost" bigint DEFAULT '0' NOT NULL,
	"currency" varchar DEFAULT 'USD' NOT NULL,
	"show_savings" boolean DEFAULT true NOT NULL,
	"sequential_unlock" boolean DEFAULT true NOT NULL,
	"self_enrollment" boolean DEFAULT true NOT NULL,
	"auto_enroll" boolean DEFAULT true NOT NULL,
	"certificate_enabled" boolean DEFAULT true NOT NULL,
	"certificate_title" text,
	"certificate_issuer" text,
	"certificate_design" jsonb DEFAULT '{}'::jsonb,
	"landing_page" jsonb DEFAULT '{}'::jsonb,
	"course_order_set_at" timestamp with time zone,
	"created_by_profile_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "learning_path_public_id_unique" UNIQUE("public_id"),
	CONSTRAINT "learning_path_organization_id_slug_unique" UNIQUE("organization_id","slug")
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
	"status" varchar DEFAULT 'valid' NOT NULL,
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
	"outcomes" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"added_at" timestamp with time zone DEFAULT now() NOT NULL,
	"removed_at" timestamp with time zone,
	CONSTRAINT "learning_path_course_path_id_course_id_unique" UNIQUE("learning_path_id","course_id")
);
--> statement-breakpoint
CREATE TABLE "learning_path_member" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"learning_path_id" uuid NOT NULL,
	"profile_id" uuid,
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
	CONSTRAINT "learning_path_member_path_id_profile_id_unique" UNIQUE("learning_path_id","profile_id"),
	CONSTRAINT "learning_path_member_path_id_email_unique" UNIQUE("learning_path_id","email")
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
ALTER TABLE "course" ADD COLUMN "requires_learning_path" boolean DEFAULT false NOT NULL;--> statement-breakpoint
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
ALTER TABLE "learning_path_certificate_issue" ADD CONSTRAINT "learning_path_certificate_issue_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."profile"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learning_path_course" ADD CONSTRAINT "learning_path_course_learning_path_id_fkey" FOREIGN KEY ("learning_path_id") REFERENCES "public"."learning_path"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learning_path_course" ADD CONSTRAINT "learning_path_course_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "public"."course"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learning_path_member" ADD CONSTRAINT "learning_path_member_learning_path_id_fkey" FOREIGN KEY ("learning_path_id") REFERENCES "public"."learning_path"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learning_path_member" ADD CONSTRAINT "learning_path_member_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."profile"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learning_path_member" ADD CONSTRAINT "learning_path_member_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "public"."role"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learning_path_member" ADD CONSTRAINT "learning_path_member_current_course_id_fkey" FOREIGN KEY ("current_course_id") REFERENCES "public"."course"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learning_path_member_course" ADD CONSTRAINT "learning_path_member_course_member_id_fkey" FOREIGN KEY ("learning_path_member_id") REFERENCES "public"."learning_path_member"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learning_path_member_course" ADD CONSTRAINT "learning_path_member_course_path_course_id_fkey" FOREIGN KEY ("learning_path_course_id") REFERENCES "public"."learning_path_course"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_course_enrollment_grant_course_id_source" ON "course_enrollment_grant" USING btree ("course_id","source");--> statement-breakpoint
CREATE INDEX "idx_course_enrollment_grant_groupmember_id" ON "course_enrollment_grant" USING btree ("groupmember_id");--> statement-breakpoint
CREATE INDEX "idx_course_enrollment_grant_cohort_id_course_id" ON "course_enrollment_grant" USING btree ("cohort_id","course_id");--> statement-breakpoint
CREATE INDEX "idx_course_enrollment_grant_learning_path_id_course_id" ON "course_enrollment_grant" USING btree ("learning_path_id","course_id");--> statement-breakpoint
CREATE INDEX "idx_course_enrollment_grant_profile_id" ON "course_enrollment_grant" USING btree ("profile_id");--> statement-breakpoint
CREATE INDEX "idx_learning_path_organization_id" ON "learning_path" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_learning_path_organization_id_is_published" ON "learning_path" USING btree ("organization_id","is_published");--> statement-breakpoint
CREATE INDEX "idx_learning_path_certificate_issue_profile_id" ON "learning_path_certificate_issue" USING btree ("profile_id");--> statement-breakpoint
CREATE INDEX "idx_learning_path_certificate_issue_learning_path_id" ON "learning_path_certificate_issue" USING btree ("learning_path_id");--> statement-breakpoint
CREATE INDEX "idx_learning_path_course_path_id_order" ON "learning_path_course" USING btree ("learning_path_id","order");--> statement-breakpoint
CREATE INDEX "idx_learning_path_course_course_id" ON "learning_path_course" USING btree ("course_id");--> statement-breakpoint
CREATE INDEX "idx_learning_path_member_learning_path_id" ON "learning_path_member" USING btree ("learning_path_id");--> statement-breakpoint
CREATE INDEX "idx_learning_path_member_profile_id" ON "learning_path_member" USING btree ("profile_id");--> statement-breakpoint
CREATE INDEX "idx_learning_path_member_course_member_id" ON "learning_path_member_course" USING btree ("learning_path_member_id");--> statement-breakpoint
CREATE INDEX "idx_learning_path_member_course_path_course_id" ON "learning_path_member_course" USING btree ("learning_path_course_id");
ALTER TYPE "public"."INVITE_LINK_RESOURCE_TYPE" ADD VALUE 'LEARNING_PATH';--> statement-breakpoint
ALTER TABLE "invite_link" ADD COLUMN "learning_path_id" uuid;--> statement-breakpoint
ALTER TABLE "invite_link" ADD CONSTRAINT "invite_link_learning_path_id_fkey" FOREIGN KEY ("learning_path_id") REFERENCES "public"."learning_path"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invite_link" ADD CONSTRAINT "invite_link_learning_path_id_role_id_unique" UNIQUE("learning_path_id","role_id");--> statement-breakpoint
ALTER TABLE "invite_link" DROP CONSTRAINT "invite_link_resource_target_check";--> statement-breakpoint
ALTER TABLE "invite_link" ADD CONSTRAINT "invite_link_resource_target_check" CHECK (("invite_link"."resource_type" = 'COURSE' AND "invite_link"."course_id" IS NOT NULL AND "invite_link"."cohort_id" IS NULL AND "invite_link"."learning_path_id" IS NULL) OR ("invite_link"."resource_type" = 'COHORT' AND "invite_link"."cohort_id" IS NOT NULL AND "invite_link"."course_id" IS NULL AND "invite_link"."learning_path_id" IS NULL) OR ("invite_link"."resource_type" = 'LEARNING_PATH' AND "invite_link"."learning_path_id" IS NOT NULL AND "invite_link"."course_id" IS NULL AND "invite_link"."cohort_id" IS NULL));--> statement-breakpoint
