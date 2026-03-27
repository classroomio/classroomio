CREATE TYPE "public"."AUTOMATION_USAGE_CATEGORY" AS ENUM('read', 'write', 'publish');--> statement-breakpoint
CREATE TYPE "public"."COURSE_IMPORT_DRAFT_STATUS" AS ENUM('DRAFT', 'PUBLISHED', 'ARCHIVED');--> statement-breakpoint
CREATE TYPE "public"."COURSE_IMPORT_SOURCE_TYPE" AS ENUM('prompt', 'pdf', 'course');--> statement-breakpoint
CREATE TYPE "public"."ORGANIZATION_API_KEY_TYPE" AS ENUM('mcp', 'api', 'zapier');--> statement-breakpoint
CREATE TYPE "public"."SSO_PROVIDER" AS ENUM('OKTA', 'GOOGLE_WORKSPACE', 'AUTH0');--> statement-breakpoint
CREATE TABLE "course_import_draft" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"created_by_profile_id" uuid NOT NULL,
	"source_type" "COURSE_IMPORT_SOURCE_TYPE" NOT NULL,
	"status" "COURSE_IMPORT_DRAFT_STATUS" DEFAULT 'DRAFT' NOT NULL,
	"title" varchar NOT NULL,
	"locale" "LOCALE" DEFAULT 'en' NOT NULL,
	"idempotency_key" varchar,
	"summary" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"draft" jsonb NOT NULL,
	"warnings" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"sourceArtifacts" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"published_course_id" uuid,
	"created_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
	"updated_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "organization_api_key" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"created_by_profile_id" uuid NOT NULL,
	"type" "ORGANIZATION_API_KEY_TYPE" NOT NULL,
	"label" varchar(120) NOT NULL,
	"secret_prefix" varchar(32) NOT NULL,
	"secret_hash" text NOT NULL,
	"scopes" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"last_used_at" timestamp with time zone,
	"expires_at" timestamp with time zone,
	"revoked_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
	"updated_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "organization_auth_policy" (
	"organization_id" uuid PRIMARY KEY NOT NULL,
	"force_sso" boolean DEFAULT false NOT NULL,
	"auto_join_sso_domains" boolean DEFAULT false NOT NULL,
	"break_glass_enabled" boolean DEFAULT true NOT NULL,
	"default_role_id" bigint DEFAULT '3' NOT NULL,
	"role_mapping" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
	"updated_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "organization_automation_usage" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"organization_api_key_id" uuid,
	"type" "ORGANIZATION_API_KEY_TYPE" NOT NULL,
	"action" varchar(120) NOT NULL,
	"category" "AUTOMATION_USAGE_CATEGORY" NOT NULL,
	"credits_consumed" integer DEFAULT 0 NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "organization_sso_config" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"better_auth_provider_id" text NOT NULL,
	"provider" "SSO_PROVIDER" NOT NULL,
	"display_name" text NOT NULL,
	"domain" text NOT NULL,
	"is_active" boolean DEFAULT false NOT NULL,
	"created_by_profile_id" uuid NOT NULL,
	"updated_by_profile_id" uuid,
	"created_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
	"updated_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
	CONSTRAINT "organization_sso_config_organization_id_unique" UNIQUE("organization_id")
);
--> statement-breakpoint
CREATE TABLE "organization_token_auth" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"signing_secret" text NOT NULL,
	"is_active" boolean DEFAULT false NOT NULL,
	"created_by_profile_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
	"updated_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
	CONSTRAINT "organization_token_auth_organization_id_unique" UNIQUE("organization_id")
);
--> statement-breakpoint
CREATE TABLE "sso_provider" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"issuer" text NOT NULL,
	"oidc_config" text,
	"saml_config" text,
	"user_id" uuid NOT NULL,
	"provider_id" text NOT NULL,
	"organization_id" text,
	"domain" text NOT NULL,
	CONSTRAINT "sso_provider_provider_id_unique" UNIQUE("provider_id")
);
--> statement-breakpoint
CREATE TABLE "tag" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"group_id" uuid NOT NULL,
	"name" varchar NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"color" varchar NOT NULL,
	"created_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
	"updated_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
	CONSTRAINT "tag_org_slug_key" UNIQUE("organization_id","slug")
);
--> statement-breakpoint
CREATE TABLE "tag_assignment" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tag_id" uuid NOT NULL,
	"course_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
	CONSTRAINT "tag_assignment_tag_course_key" UNIQUE("tag_id","course_id")
);
--> statement-breakpoint
CREATE TABLE "tag_group" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"name" varchar NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
	"updated_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
	CONSTRAINT "tag_group_org_slug_key" UNIQUE("organization_id","slug")
);
--> statement-breakpoint
ALTER TABLE "organization" ALTER COLUMN "theme" SET DEFAULT 'blue';--> statement-breakpoint
ALTER TABLE "option" ADD COLUMN "settings" jsonb DEFAULT '{}'::jsonb;--> statement-breakpoint
ALTER TABLE "organization" ADD COLUMN "disable_signup" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "organization" ADD COLUMN "disable_signup_message" text;--> statement-breakpoint
ALTER TABLE "organization" ADD COLUMN "disable_email_password" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "organization" ADD COLUMN "disable_google_auth" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "question" ADD COLUMN "settings" jsonb DEFAULT '{}'::jsonb;--> statement-breakpoint
ALTER TABLE "question_answer" ADD COLUMN "answer_data" jsonb;--> statement-breakpoint
ALTER TABLE "submission" ADD COLUMN "grading_state" varchar DEFAULT 'queued' NOT NULL;--> statement-breakpoint
ALTER TABLE "submission" ADD COLUMN "overall_status" varchar DEFAULT 'manual_required' NOT NULL;--> statement-breakpoint
ALTER TABLE "course_import_draft" ADD CONSTRAINT "course_import_draft_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_import_draft" ADD CONSTRAINT "course_import_draft_created_by_profile_id_profile_id_fk" FOREIGN KEY ("created_by_profile_id") REFERENCES "public"."profile"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_import_draft" ADD CONSTRAINT "course_import_draft_published_course_id_course_id_fk" FOREIGN KEY ("published_course_id") REFERENCES "public"."course"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_api_key" ADD CONSTRAINT "organization_api_key_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_api_key" ADD CONSTRAINT "organization_api_key_created_by_profile_id_profile_id_fk" FOREIGN KEY ("created_by_profile_id") REFERENCES "public"."profile"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_auth_policy" ADD CONSTRAINT "organization_auth_policy_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_auth_policy" ADD CONSTRAINT "organization_auth_policy_default_role_id_fkey" FOREIGN KEY ("default_role_id") REFERENCES "public"."role"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_automation_usage" ADD CONSTRAINT "organization_automation_usage_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_automation_usage" ADD CONSTRAINT "organization_automation_usage_organization_api_key_id_organization_api_key_id_fk" FOREIGN KEY ("organization_api_key_id") REFERENCES "public"."organization_api_key"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_sso_config" ADD CONSTRAINT "organization_sso_config_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_sso_config" ADD CONSTRAINT "organization_sso_config_created_by_profile_id_profile_id_fk" FOREIGN KEY ("created_by_profile_id") REFERENCES "public"."profile"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_sso_config" ADD CONSTRAINT "organization_sso_config_updated_by_profile_id_profile_id_fk" FOREIGN KEY ("updated_by_profile_id") REFERENCES "public"."profile"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_token_auth" ADD CONSTRAINT "organization_token_auth_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_token_auth" ADD CONSTRAINT "organization_token_auth_created_by_profile_id_profile_id_fk" FOREIGN KEY ("created_by_profile_id") REFERENCES "public"."profile"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sso_provider" ADD CONSTRAINT "sso_provider_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tag" ADD CONSTRAINT "tag_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tag" ADD CONSTRAINT "tag_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "public"."tag_group"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tag_assignment" ADD CONSTRAINT "tag_assignment_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "public"."tag"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tag_assignment" ADD CONSTRAINT "tag_assignment_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "public"."course"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tag_group" ADD CONSTRAINT "tag_group_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_course_import_draft_org_id" ON "course_import_draft" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_course_import_draft_status" ON "course_import_draft" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "course_import_draft_org_idempotency_key" ON "course_import_draft" USING btree ("organization_id","idempotency_key") WHERE "course_import_draft"."idempotency_key" IS NOT NULL;--> statement-breakpoint
CREATE INDEX "idx_organization_api_key_org_id" ON "organization_api_key" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_organization_api_key_type" ON "organization_api_key" USING btree ("type");--> statement-breakpoint
CREATE UNIQUE INDEX "organization_api_key_secret_hash_unique" ON "organization_api_key" USING btree ("secret_hash");--> statement-breakpoint
CREATE INDEX "idx_organization_auth_policy_org_id" ON "organization_auth_policy" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_org_automation_usage_org_created_at" ON "organization_automation_usage" USING btree ("organization_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_org_automation_usage_key_created_at" ON "organization_automation_usage" USING btree ("organization_api_key_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_org_automation_usage_type_created_at" ON "organization_automation_usage" USING btree ("type","created_at");--> statement-breakpoint
CREATE INDEX "idx_organization_sso_config_org_id" ON "organization_sso_config" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_organization_sso_config_domain" ON "organization_sso_config" USING btree ("domain");--> statement-breakpoint
CREATE INDEX "idx_organization_sso_config_provider_id" ON "organization_sso_config" USING btree ("better_auth_provider_id");--> statement-breakpoint
CREATE INDEX "idx_organization_token_auth_org_id" ON "organization_token_auth" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_tag_organization_id" ON "tag" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_tag_group_id" ON "tag" USING btree ("group_id");--> statement-breakpoint
CREATE INDEX "idx_tag_assignment_tag_id" ON "tag_assignment" USING btree ("tag_id");--> statement-breakpoint
CREATE INDEX "idx_tag_assignment_course_id" ON "tag_assignment" USING btree ("course_id");--> statement-breakpoint
CREATE INDEX "idx_tag_group_organization_id" ON "tag_group" USING btree ("organization_id");--> statement-breakpoint
CREATE UNIQUE INDEX "organizationmember_org_profile_unique" ON "organizationmember" USING btree ("organization_id","profile_id") WHERE "organizationmember"."profile_id" IS NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "organizationmember_org_email_unique" ON "organizationmember" USING btree ("organization_id","email") WHERE "organizationmember"."email" IS NOT NULL;