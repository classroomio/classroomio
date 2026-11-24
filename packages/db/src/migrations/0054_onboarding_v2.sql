CREATE TYPE "public"."ONBOARDING_PHASE" AS ENUM('business', 'workspace', 'customise', 'complete');--> statement-breakpoint
CREATE TYPE "public"."ONBOARDING_STARTER_JOB_STATUS" AS ENUM('PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELED');--> statement-breakpoint
CREATE TYPE "public"."ONBOARDING_STARTER_JOB_STAGE" AS ENUM('queued', 'understanding', 'drafting', 'organising', 'finishing', 'done');--> statement-breakpoint
CREATE TYPE "public"."ONBOARDING_STARTER_JOB_MODE" AS ENUM('ai', 'sample', 'website');--> statement-breakpoint
CREATE TYPE "public"."ONBOARDING_COMPLETION_ROUTE" AS ENUM('publish', 'skip_to_courses', 'skip_to_academy');--> statement-breakpoint
ALTER TYPE "public"."COURSE_IMPORT_SOURCE_TYPE" ADD VALUE IF NOT EXISTS 'website';--> statement-breakpoint
ALTER TYPE "public"."COURSE_IMPORT_SOURCE_TYPE" ADD VALUE IF NOT EXISTS 'sample';--> statement-breakpoint
ALTER TABLE "ai_token_usage" ADD COLUMN "counts_toward_balance" boolean DEFAULT true NOT NULL;--> statement-breakpoint
CREATE TABLE "onboarding_session" (
	"profile_id" uuid PRIMARY KEY NOT NULL,
	"organization_id" uuid,
	"phase" "ONBOARDING_PHASE" DEFAULT 'business' NOT NULL,
	"business" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"brand" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"tour" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"terms_accepted_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"completed_via" "ONBOARDING_COMPLETION_ROUTE",
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
CREATE TABLE "onboarding_starter_job" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"profile_id" uuid NOT NULL,
	"status" "ONBOARDING_STARTER_JOB_STATUS" DEFAULT 'PENDING' NOT NULL,
	"stage" "ONBOARDING_STARTER_JOB_STAGE" DEFAULT 'queued' NOT NULL,
	"mode" "ONBOARDING_STARTER_JOB_MODE" NOT NULL,
	"input_hash" varchar NOT NULL,
	"input" jsonb NOT NULL,
	"extraction" jsonb,
	"error" jsonb,
	"model_id" varchar,
	"started_at" timestamp with time zone,
	"finished_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
ALTER TABLE "onboarding_session" ADD CONSTRAINT "onboarding_session_profile_id_profile_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profile"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "onboarding_session" ADD CONSTRAINT "onboarding_session_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "onboarding_starter_job" ADD CONSTRAINT "onboarding_starter_job_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "onboarding_starter_job" ADD CONSTRAINT "onboarding_starter_job_profile_id_profile_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profile"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_onboarding_session_org_id" ON "onboarding_session" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_onboarding_starter_job_org_created" ON "onboarding_starter_job" USING btree ("organization_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "onboarding_starter_job_org_input_active" ON "onboarding_starter_job" USING btree ("organization_id","input_hash") WHERE "onboarding_starter_job"."status" in ('PENDING', 'RUNNING');
--> statement-breakpoint
CREATE TYPE "public"."COURSE_BUILD_STATUS" AS ENUM('PENDING', 'RUNNING', 'COMPLETED', 'NOTHING_TO_BUILD', 'FAILED', 'CANCELED');--> statement-breakpoint
CREATE TYPE "public"."COURSE_BUILD_STAGE" AS ENUM('queued', 'discover', 'read', 'understand', 'plan', 'write', 'finish', 'export', 'done');--> statement-breakpoint
CREATE TYPE "public"."COURSE_BUILD_SOURCE_STATUS" AS ENUM('PENDING', 'READING', 'READ', 'FAILED');--> statement-breakpoint
CREATE TYPE "public"."COURSE_BUILD_COURSE_STATUS" AS ENUM('PLANNED', 'WRITING', 'CHECKING', 'EXPORTING', 'READY', 'FAILED');--> statement-breakpoint
CREATE TABLE "course_build_job" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"profile_id" uuid NOT NULL,
	"status" "COURSE_BUILD_STATUS" DEFAULT 'PENDING' NOT NULL,
	"stage" "COURSE_BUILD_STAGE" DEFAULT 'queued' NOT NULL,
	"scope" jsonb NOT NULL,
	"source_map" jsonb,
	"gate" jsonb,
	"understanding" jsonb,
	"course_list" jsonb,
	"cost_usd" double precision DEFAULT 0 NOT NULL,
	"cost_by_role" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"seconds_by_stage" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"error" jsonb,
	"started_at" timestamp with time zone,
	"finished_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
CREATE TABLE "course_build_source" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"job_id" uuid NOT NULL,
	"position" integer NOT NULL,
	"kind" varchar NOT NULL,
	"url" varchar NOT NULL,
	"source" jsonb NOT NULL,
	"status" "COURSE_BUILD_SOURCE_STATUS" DEFAULT 'PENDING' NOT NULL,
	"outcome" varchar,
	"completeness" jsonb,
	"pages_read" integer DEFAULT 0 NOT NULL,
	"read_at" timestamp with time zone,
	"error" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
CREATE TABLE "course_build_page" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"job_id" uuid NOT NULL,
	"source_id" uuid NOT NULL,
	"url" varchar NOT NULL,
	"position" integer NOT NULL,
	"page" jsonb NOT NULL,
	"media" jsonb,
	"card" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
CREATE TABLE "course_build_course" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"job_id" uuid NOT NULL,
	"position" integer NOT NULL,
	"title" varchar NOT NULL,
	"status" "COURSE_BUILD_COURSE_STATUS" DEFAULT 'PLANNED' NOT NULL,
	"plan" jsonb NOT NULL,
	"sections_total" integer DEFAULT 0 NOT NULL,
	"sections_written" integer DEFAULT 0 NOT NULL,
	"written" jsonb,
	"finished" jsonb,
	"course_import_draft_id" uuid,
	"course_id" uuid,
	"error" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
ALTER TABLE "onboarding_starter_job" ADD COLUMN "course_build_job_id" uuid;--> statement-breakpoint
ALTER TABLE "course_build_job" ADD CONSTRAINT "course_build_job_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_build_job" ADD CONSTRAINT "course_build_job_profile_id_profile_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profile"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_build_source" ADD CONSTRAINT "course_build_source_job_id_course_build_job_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."course_build_job"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_build_page" ADD CONSTRAINT "course_build_page_job_id_course_build_job_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."course_build_job"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_build_page" ADD CONSTRAINT "course_build_page_source_id_course_build_source_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."course_build_source"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_build_course" ADD CONSTRAINT "course_build_course_job_id_course_build_job_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."course_build_job"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_build_course" ADD CONSTRAINT "course_build_course_course_import_draft_id_course_import_draft_id_fk" FOREIGN KEY ("course_import_draft_id") REFERENCES "public"."course_import_draft"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_build_course" ADD CONSTRAINT "course_build_course_course_id_course_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."course"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "onboarding_starter_job" ADD CONSTRAINT "onboarding_starter_job_course_build_job_id_course_build_job_id_fk" FOREIGN KEY ("course_build_job_id") REFERENCES "public"."course_build_job"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_course_build_job_org_created" ON "course_build_job" USING btree ("organization_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_course_build_source_job" ON "course_build_source" USING btree ("job_id","position");--> statement-breakpoint
CREATE INDEX "idx_course_build_page_job" ON "course_build_page" USING btree ("job_id","source_id","position");--> statement-breakpoint
CREATE INDEX "idx_course_build_course_job" ON "course_build_course" USING btree ("job_id","position");
