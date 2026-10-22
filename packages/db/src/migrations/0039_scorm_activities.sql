CREATE TYPE "public"."ACTIVITY_KIND" AS ENUM('scorm');--> statement-breakpoint
CREATE TYPE "public"."CONTENT_PACKAGE_FORMAT" AS ENUM('scorm12', 'scorm2004_2', 'scorm2004_3', 'scorm2004_4');--> statement-breakpoint
CREATE TYPE "public"."CONTENT_PACKAGE_STATUS" AS ENUM('uploading', 'processing', 'ready', 'failed', 'archived');--> statement-breakpoint
CREATE TYPE "public"."CONTENT_PACKAGE_UNIT_TYPE" AS ENUM('sco', 'asset');--> statement-breakpoint
CREATE TYPE "public"."COURSE_FORMAT" AS ENUM('standard', 'single_activity');--> statement-breakpoint
CREATE TYPE "public"."SCORM_ATTEMPT_CLOSE_REASON" AS ENUM('finished', 'replaced');--> statement-breakpoint
CREATE TYPE "public"."SCORM_COMPLETION_RULE" AS ENUM('auto', 'completed', 'passed', 'score');--> statement-breakpoint
CREATE TYPE "public"."SCORM_COMPLETION_MODULES" AS ENUM('all', 'graded_only');--> statement-breakpoint
CREATE TYPE "public"."SCORM_MODULE_ORDER" AS ENUM('free', 'sequential');--> statement-breakpoint
CREATE TYPE "public"."SCORM_SCO_ATTEMPT_STATUS" AS ENUM('active', 'suspended', 'closed');--> statement-breakpoint
CREATE TYPE "public"."SCORM_SESSION_EVENT_KIND" AS ENUM('launch', 'initialize', 'commit', 'terminate', 'beacon', 'error', 'not_initialized');--> statement-breakpoint
CREATE TABLE "activity_completion" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"activity_id" uuid NOT NULL,
	"profile_id" uuid NOT NULL,
	"is_complete" boolean DEFAULT false NOT NULL,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "activity_completion_activity_profile_key" UNIQUE("activity_id","profile_id"),
	CONSTRAINT "activity_completion_complete_check" CHECK ("activity_completion"."is_complete" = ("activity_completion"."completed_at" IS NOT NULL))
);
--> statement-breakpoint
CREATE TABLE "activity_completion_side_effect" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"activity_id" uuid NOT NULL,
	"profile_id" uuid NOT NULL,
	"certification_pending" boolean DEFAULT true NOT NULL,
	"compliance_pending" boolean DEFAULT true NOT NULL,
	"generation" integer DEFAULT 0 NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"next_attempt_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "activity_completion_side_effect_activity_profile_key" UNIQUE("activity_id","profile_id")
);
--> statement-breakpoint
CREATE TABLE "activity_scorm" (
	"activity_id" uuid PRIMARY KEY NOT NULL,
	"asset_id" uuid,
	"completion_rule" "SCORM_COMPLETION_RULE" DEFAULT 'auto' NOT NULL,
	"min_score_percent" integer,
	"allow_retakes" boolean DEFAULT false NOT NULL,
	"module_order" "SCORM_MODULE_ORDER" DEFAULT 'free' NOT NULL,
	"completion_modules" "SCORM_COMPLETION_MODULES" DEFAULT 'all' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "activity_scorm_min_score_check" CHECK ("activity_scorm"."min_score_percent" IS NULL OR "activity_scorm"."min_score_percent" BETWEEN 0 AND 100)
);
--> statement-breakpoint
CREATE TABLE "content_package_unit" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"package_version_id" uuid NOT NULL,
	"identifier" text NOT NULL,
	"parent_identifier" text,
	"title" text NOT NULL,
	"position" integer NOT NULL,
	"unit_type" "CONTENT_PACKAGE_UNIT_TYPE" NOT NULL,
	"href" text NOT NULL,
	"parameters" text,
	"mastery_score_raw" numeric,
	"passing_score_scaled" numeric,
	"completion_threshold" numeric,
	"launch_data" text,
	"format_details" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"is_visible" boolean DEFAULT true NOT NULL,
	CONSTRAINT "content_package_unit_version_identifier_key" UNIQUE("package_version_id","identifier"),
	CONSTRAINT "content_package_unit_mastery_score_raw_check" CHECK ("content_package_unit"."mastery_score_raw" IS NULL OR "content_package_unit"."mastery_score_raw" BETWEEN 0 AND 100),
	CONSTRAINT "content_package_unit_passing_score_scaled_check" CHECK ("content_package_unit"."passing_score_scaled" IS NULL OR "content_package_unit"."passing_score_scaled" BETWEEN -1 AND 1),
	CONSTRAINT "content_package_unit_completion_threshold_check" CHECK ("content_package_unit"."completion_threshold" IS NULL OR "content_package_unit"."completion_threshold" BETWEEN 0 AND 1)
);
--> statement-breakpoint
CREATE TABLE "content_package_version" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"asset_id" uuid NOT NULL,
	"version_number" integer NOT NULL,
	"is_current" boolean DEFAULT false NOT NULL,
	"status" "CONTENT_PACKAGE_STATUS" DEFAULT 'uploading' NOT NULL,
	"format" "CONTENT_PACKAGE_FORMAT",
	"manifest_identifier" text,
	"title" text,
	"manifest" jsonb,
	"warnings" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"error" jsonb,
	"upload_key" text NOT NULL,
	"content_prefix" text NOT NULL,
	"zip_bytes" bigint,
	"content_sha256" text,
	"extracted_bytes" bigint,
	"file_count" integer,
	"processing_job_id" uuid,
	"created_by_profile_id" uuid,
	"processed_at" timestamp with time zone,
	"replaced_at" timestamp with time zone,
	"archived_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "content_package_version_asset_number_key" UNIQUE("asset_id","version_number"),
	CONSTRAINT "content_package_version_current_not_replaced_check" CHECK (NOT ("content_package_version"."is_current" AND "content_package_version"."replaced_at" IS NOT NULL))
);
--> statement-breakpoint
CREATE TABLE "course_activity" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"course_id" uuid NOT NULL,
	"section_id" uuid,
	"kind" "ACTIVITY_KIND" NOT NULL,
	"title" varchar NOT NULL,
	"instructions" text,
	"slug" varchar DEFAULT '' NOT NULL,
	"order" bigint NOT NULL,
	"is_unlocked" boolean DEFAULT true NOT NULL,
	"source_id" uuid,
	"source_synced_at" timestamp with time zone,
	"created_by_profile_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "scorm_attempt" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"activity_id" uuid NOT NULL,
	"profile_id" uuid NOT NULL,
	"package_version_id" uuid NOT NULL,
	"attempt_number" integer NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"closed_at" timestamp with time zone,
	"close_reason" "SCORM_ATTEMPT_CLOSE_REASON",
	CONSTRAINT "scorm_attempt_activity_profile_number_key" UNIQUE("activity_id","profile_id","attempt_number"),
	CONSTRAINT "scorm_attempt_close_reason_check" CHECK (("scorm_attempt"."closed_at" IS NULL) = ("scorm_attempt"."close_reason" IS NULL))
);
--> statement-breakpoint
CREATE TABLE "scorm_sco_attempt" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"attempt_id" uuid NOT NULL,
	"unit_id" uuid NOT NULL,
	"status" "SCORM_SCO_ATTEMPT_STATUS" DEFAULT 'active' NOT NULL,
	"cmi" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"commit_seq" integer DEFAULT 0 NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_commit_at" timestamp with time zone,
	"terminated_at" timestamp with time zone,
	"time_spent_seconds" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "scorm_session_event" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sco_attempt_id" uuid NOT NULL,
	"kind" "SCORM_SESSION_EVENT_KIND" NOT NULL,
	"detail" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"user_agent" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "course" ADD COLUMN "format" "COURSE_FORMAT" DEFAULT 'standard' NOT NULL;--> statement-breakpoint
ALTER TABLE "activity_completion" ADD CONSTRAINT "activity_completion_activity_id_fkey" FOREIGN KEY ("activity_id") REFERENCES "public"."course_activity"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_completion" ADD CONSTRAINT "activity_completion_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."profile"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_completion_side_effect" ADD CONSTRAINT "activity_completion_side_effect_activity_id_fkey" FOREIGN KEY ("activity_id") REFERENCES "public"."course_activity"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_completion_side_effect" ADD CONSTRAINT "activity_completion_side_effect_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."profile"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_scorm" ADD CONSTRAINT "activity_scorm_activity_id_fkey" FOREIGN KEY ("activity_id") REFERENCES "public"."course_activity"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_scorm" ADD CONSTRAINT "activity_scorm_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "public"."assets"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_package_unit" ADD CONSTRAINT "content_package_unit_package_version_id_fkey" FOREIGN KEY ("package_version_id") REFERENCES "public"."content_package_version"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_package_version" ADD CONSTRAINT "content_package_version_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "public"."assets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_package_version" ADD CONSTRAINT "content_package_version_processing_job_id_fkey" FOREIGN KEY ("processing_job_id") REFERENCES "public"."media_job"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_package_version" ADD CONSTRAINT "content_package_version_created_by_profile_id_fkey" FOREIGN KEY ("created_by_profile_id") REFERENCES "public"."profile"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_activity" ADD CONSTRAINT "course_activity_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "public"."course"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_activity" ADD CONSTRAINT "course_activity_section_id_fkey" FOREIGN KEY ("section_id") REFERENCES "public"."course_section"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_activity" ADD CONSTRAINT "course_activity_source_id_fkey" FOREIGN KEY ("source_id") REFERENCES "public"."course_activity"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_activity" ADD CONSTRAINT "course_activity_created_by_profile_id_fkey" FOREIGN KEY ("created_by_profile_id") REFERENCES "public"."profile"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scorm_attempt" ADD CONSTRAINT "scorm_attempt_activity_id_fkey" FOREIGN KEY ("activity_id") REFERENCES "public"."course_activity"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scorm_attempt" ADD CONSTRAINT "scorm_attempt_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."profile"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scorm_attempt" ADD CONSTRAINT "scorm_attempt_package_version_id_fkey" FOREIGN KEY ("package_version_id") REFERENCES "public"."content_package_version"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scorm_sco_attempt" ADD CONSTRAINT "scorm_sco_attempt_attempt_id_fkey" FOREIGN KEY ("attempt_id") REFERENCES "public"."scorm_attempt"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scorm_sco_attempt" ADD CONSTRAINT "scorm_sco_attempt_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "public"."content_package_unit"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scorm_session_event" ADD CONSTRAINT "scorm_session_event_sco_attempt_id_fkey" FOREIGN KEY ("sco_attempt_id") REFERENCES "public"."scorm_sco_attempt"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_activity_scorm_asset_id" ON "activity_scorm" USING btree ("asset_id");--> statement-breakpoint
CREATE UNIQUE INDEX "content_package_version_current_key" ON "content_package_version" USING btree ("asset_id") WHERE "content_package_version"."is_current";--> statement-breakpoint
CREATE INDEX "idx_content_package_version_replaced" ON "content_package_version" USING btree ("replaced_at") WHERE "content_package_version"."is_current" = false;--> statement-breakpoint
CREATE INDEX "idx_course_activity_course_id" ON "course_activity" USING btree ("course_id");--> statement-breakpoint
CREATE INDEX "idx_course_activity_course_slug" ON "course_activity" USING btree ("course_id","slug");--> statement-breakpoint
CREATE INDEX "course_activity_source_id_idx" ON "course_activity" USING btree ("source_id") WHERE "course_activity"."source_id" is not null;--> statement-breakpoint
CREATE UNIQUE INDEX "scorm_attempt_open_key" ON "scorm_attempt" USING btree ("activity_id","profile_id") WHERE "scorm_attempt"."closed_at" is null;--> statement-breakpoint
CREATE INDEX "idx_scorm_attempt_activity_id" ON "scorm_attempt" USING btree ("activity_id");--> statement-breakpoint
CREATE INDEX "idx_scorm_attempt_package_version_id" ON "scorm_attempt" USING btree ("package_version_id");--> statement-breakpoint
CREATE INDEX "scorm_attempt_profile_id_idx" ON "scorm_attempt" USING btree ("profile_id");--> statement-breakpoint
CREATE INDEX "activity_completion_profile_id_idx" ON "activity_completion" USING btree ("profile_id");--> statement-breakpoint
CREATE INDEX "activity_completion_side_effect_next_attempt_at_idx" ON "activity_completion_side_effect" USING btree ("next_attempt_at");--> statement-breakpoint
CREATE INDEX "course_activity_section_id_idx" ON "course_activity" USING btree ("section_id");--> statement-breakpoint
CREATE UNIQUE INDEX "scorm_sco_attempt_open_key" ON "scorm_sco_attempt" USING btree ("attempt_id","unit_id") WHERE "scorm_sco_attempt"."status" in ('active', 'suspended');--> statement-breakpoint
CREATE INDEX "idx_scorm_sco_attempt_attempt_id" ON "scorm_sco_attempt" USING btree ("attempt_id","unit_id","started_at");--> statement-breakpoint
CREATE INDEX "idx_scorm_sco_attempt_unit_id" ON "scorm_sco_attempt" USING btree ("unit_id");--> statement-breakpoint
CREATE INDEX "idx_scorm_session_event_sco_attempt_created" ON "scorm_session_event" USING btree ("sco_attempt_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_scorm_session_event_created_at" ON "scorm_session_event" USING btree ("created_at");--> statement-breakpoint
ALTER TABLE "course" ADD CONSTRAINT "course_format_type_check" CHECK ("course"."format" = 'standard' OR "course"."type" = 'SELF_PACED');