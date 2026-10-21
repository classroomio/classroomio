CREATE TYPE "public"."PLUGIN_AUDIT_OUTCOME" AS ENUM('success', 'denied', 'error');--> statement-breakpoint
CREATE TYPE "public"."PLUGIN_BACKEND_CLIENT_STATUS" AS ENUM('active', 'revoked');--> statement-breakpoint
CREATE TYPE "public"."PLUGIN_DISTRIBUTION" AS ENUM('public', 'private', 'unlisted', 'development');--> statement-breakpoint
CREATE TYPE "public"."PLUGIN_INSTALLATION_STATUS" AS ENUM('active', 'disabled', 'revoked', 'uninstalled');--> statement-breakpoint
CREATE TYPE "public"."PLUGIN_ORG_APPROVAL_STATUS" AS ENUM('approved', 'pending', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."PLUGIN_OWNER_TYPE" AS ENUM('organization', 'user');--> statement-breakpoint
CREATE TYPE "public"."PLUGIN_PUBLISHER_CLASS" AS ENUM('first-party', 'verified-third-party', 'community');--> statement-breakpoint
CREATE TYPE "public"."PLUGIN_REVIEW_STATUS" AS ENUM('pending', 'approved', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."PLUGIN_STATUS" AS ENUM('draft', 'published', 'deprecated', 'revoked');--> statement-breakpoint
CREATE TYPE "public"."PLUGIN_STORAGE_SCOPE_TYPE" AS ENUM('organization', 'user', 'global');--> statement-breakpoint
CREATE TABLE "plugin" (
	"id" varchar(128) PRIMARY KEY NOT NULL,
	"slug" varchar(128) NOT NULL,
	"publisher_id" varchar(64),
	"name" varchar(128) NOT NULL,
	"description" text,
	"publisher" varchar(128) NOT NULL,
	"status" "PLUGIN_STATUS" DEFAULT 'published' NOT NULL,
	"distribution" "PLUGIN_DISTRIBUTION" DEFAULT 'public' NOT NULL,
	"created_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
	"updated_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "plugin_audit_event" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"installation_id" uuid,
	"organization_id" uuid,
	"actor_profile_id" uuid,
	"action" varchar(120) NOT NULL,
	"resource" varchar(255),
	"outcome" "PLUGIN_AUDIT_OUTCOME" DEFAULT 'success' NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "plugin_backend_client" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"plugin_id" varchar(128) NOT NULL,
	"client_id" varchar(128) NOT NULL,
	"label" varchar(120),
	"secret_prefix" varchar(32) NOT NULL,
	"secret_hash" text NOT NULL,
	"status" "PLUGIN_BACKEND_CLIENT_STATUS" DEFAULT 'active' NOT NULL,
	"revoked_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
	"updated_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "plugin_credential" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"installation_id" uuid NOT NULL,
	"label" varchar(120),
	"secret_prefix" varchar(32) NOT NULL,
	"secret_hash" text NOT NULL,
	"expires_at" timestamp with time zone,
	"revoked_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "plugin_event_delivery" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"outbox_event_id" uuid NOT NULL,
	"subscription_id" uuid NOT NULL,
	"status" varchar(32) DEFAULT 'pending' NOT NULL,
	"attempt_count" integer DEFAULT 0 NOT NULL,
	"next_retry_at" timestamp with time zone,
	"response_status" integer,
	"error_message" text,
	"delivered_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "plugin_event_outbox" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_type" varchar(128) NOT NULL,
	"organization_id" uuid,
	"payload" jsonb NOT NULL,
	"status" varchar(32) DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
	"processed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "plugin_event_subscription" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"installation_id" uuid NOT NULL,
	"event_type" varchar(128) NOT NULL,
	"endpoint" varchar(512) NOT NULL,
	"status" varchar(32) DEFAULT 'active' NOT NULL,
	"failure_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
	"updated_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "plugin_grant" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"installation_id" uuid NOT NULL,
	"scope" varchar(128) NOT NULL,
	"granted_by_profile_id" uuid,
	"granted_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "plugin_installation" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"plugin_id" varchar(128) NOT NULL,
	"plugin_version_id" uuid NOT NULL,
	"owner_type" "PLUGIN_OWNER_TYPE" NOT NULL,
	"organization_id" uuid,
	"user_id" uuid,
	"status" "PLUGIN_INSTALLATION_STATUS" DEFAULT 'active' NOT NULL,
	"org_approval_status" "PLUGIN_ORG_APPROVAL_STATUS" DEFAULT 'approved' NOT NULL,
	"settings" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"installed_by_profile_id" uuid,
	"installed_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
	"disabled_at" timestamp with time zone,
	"uninstalled_at" timestamp with time zone,
	"updated_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "plugin_launch_code" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"installation_id" uuid NOT NULL,
	"code_hash" text NOT NULL,
	"user_id" uuid NOT NULL,
	"organization_id" uuid,
	"contribution_target" varchar(64),
	"resource_type" varchar(32),
	"resource_id" uuid,
	"audience" varchar(255),
	"handshake_nonce" varchar(128),
	"expires_at" timestamp with time zone NOT NULL,
	"used_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "plugin_publisher" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"name" varchar(128) NOT NULL,
	"publisher_class" "PLUGIN_PUBLISHER_CLASS" DEFAULT 'community' NOT NULL,
	"verified" boolean DEFAULT false NOT NULL,
	"domain" varchar(255),
	"security_contact" varchar(255),
	"support_contact" varchar(255),
	"status" varchar(32) DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
	"updated_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "plugin_storage" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"installation_id" uuid NOT NULL,
	"scope_type" "PLUGIN_STORAGE_SCOPE_TYPE" NOT NULL,
	"scope_id" uuid NOT NULL,
	"namespace" varchar(128) DEFAULT 'default' NOT NULL,
	"key" varchar(255) NOT NULL,
	"value" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
	"updated_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "plugin_version" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"plugin_id" varchar(128) NOT NULL,
	"version" varchar(64) NOT NULL,
	"manifest" jsonb NOT NULL,
	"artifact_digest" varchar(128),
	"signature" text,
	"source_commit" varchar(40),
	"release_run_url" text,
	"released_by" varchar(64) DEFAULT 'legacy' NOT NULL,
	"release_metadata" jsonb,
	"review_status" "PLUGIN_REVIEW_STATUS" DEFAULT 'approved' NOT NULL,
	"published_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
	"created_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
	CONSTRAINT "plugin_version_ci_provenance_check" CHECK ("plugin_version"."released_by" <> 'github-actions' OR ("plugin_version"."source_commit" IS NOT NULL AND "plugin_version"."release_run_url" IS NOT NULL AND "plugin_version"."artifact_digest" IS NOT NULL))
);
--> statement-breakpoint
ALTER TABLE "plugin" ADD CONSTRAINT "plugin_publisher_id_plugin_publisher_id_fk" FOREIGN KEY ("publisher_id") REFERENCES "public"."plugin_publisher"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plugin_audit_event" ADD CONSTRAINT "plugin_audit_event_installation_id_plugin_installation_id_fk" FOREIGN KEY ("installation_id") REFERENCES "public"."plugin_installation"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plugin_audit_event" ADD CONSTRAINT "plugin_audit_event_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plugin_audit_event" ADD CONSTRAINT "plugin_audit_event_actor_profile_id_profile_id_fk" FOREIGN KEY ("actor_profile_id") REFERENCES "public"."profile"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plugin_backend_client" ADD CONSTRAINT "plugin_backend_client_plugin_id_plugin_id_fk" FOREIGN KEY ("plugin_id") REFERENCES "public"."plugin"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plugin_credential" ADD CONSTRAINT "plugin_credential_installation_id_plugin_installation_id_fk" FOREIGN KEY ("installation_id") REFERENCES "public"."plugin_installation"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plugin_event_delivery" ADD CONSTRAINT "plugin_event_delivery_outbox_event_id_plugin_event_outbox_id_fk" FOREIGN KEY ("outbox_event_id") REFERENCES "public"."plugin_event_outbox"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plugin_event_delivery" ADD CONSTRAINT "plugin_event_delivery_subscription_id_plugin_event_subscription_id_fk" FOREIGN KEY ("subscription_id") REFERENCES "public"."plugin_event_subscription"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plugin_event_outbox" ADD CONSTRAINT "plugin_event_outbox_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plugin_event_subscription" ADD CONSTRAINT "plugin_event_subscription_installation_id_plugin_installation_id_fk" FOREIGN KEY ("installation_id") REFERENCES "public"."plugin_installation"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plugin_grant" ADD CONSTRAINT "plugin_grant_installation_id_plugin_installation_id_fk" FOREIGN KEY ("installation_id") REFERENCES "public"."plugin_installation"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plugin_grant" ADD CONSTRAINT "plugin_grant_granted_by_profile_id_profile_id_fk" FOREIGN KEY ("granted_by_profile_id") REFERENCES "public"."profile"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plugin_installation" ADD CONSTRAINT "plugin_installation_plugin_id_plugin_id_fk" FOREIGN KEY ("plugin_id") REFERENCES "public"."plugin"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plugin_installation" ADD CONSTRAINT "plugin_installation_plugin_version_id_plugin_version_id_fk" FOREIGN KEY ("plugin_version_id") REFERENCES "public"."plugin_version"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plugin_installation" ADD CONSTRAINT "plugin_installation_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plugin_installation" ADD CONSTRAINT "plugin_installation_user_id_profile_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profile"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plugin_installation" ADD CONSTRAINT "plugin_installation_installed_by_profile_id_profile_id_fk" FOREIGN KEY ("installed_by_profile_id") REFERENCES "public"."profile"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plugin_launch_code" ADD CONSTRAINT "plugin_launch_code_installation_id_plugin_installation_id_fk" FOREIGN KEY ("installation_id") REFERENCES "public"."plugin_installation"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plugin_launch_code" ADD CONSTRAINT "plugin_launch_code_user_id_profile_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profile"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plugin_launch_code" ADD CONSTRAINT "plugin_launch_code_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plugin_storage" ADD CONSTRAINT "plugin_storage_installation_id_plugin_installation_id_fk" FOREIGN KEY ("installation_id") REFERENCES "public"."plugin_installation"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plugin_version" ADD CONSTRAINT "plugin_version_plugin_id_plugin_id_fk" FOREIGN KEY ("plugin_id") REFERENCES "public"."plugin"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_plugin_publisher" ON "plugin" USING btree ("publisher");--> statement-breakpoint
CREATE INDEX "idx_plugin_publisher_id" ON "plugin" USING btree ("publisher_id");--> statement-breakpoint
CREATE INDEX "idx_plugin_status" ON "plugin" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_plugin_slug_unique" ON "plugin" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "idx_plugin_audit_installation_created" ON "plugin_audit_event" USING btree ("installation_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_plugin_audit_org_created" ON "plugin_audit_event" USING btree ("organization_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_plugin_backend_client_client_id_unique" ON "plugin_backend_client" USING btree ("client_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_plugin_backend_client_secret_hash_unique" ON "plugin_backend_client" USING btree ("secret_hash");--> statement-breakpoint
CREATE INDEX "idx_plugin_backend_client_plugin_id" ON "plugin_backend_client" USING btree ("plugin_id");--> statement-breakpoint
CREATE INDEX "idx_plugin_backend_client_status" ON "plugin_backend_client" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_plugin_credential_hash_unique" ON "plugin_credential" USING btree ("secret_hash");--> statement-breakpoint
CREATE INDEX "idx_plugin_credential_installation_id" ON "plugin_credential" USING btree ("installation_id");--> statement-breakpoint
CREATE INDEX "idx_plugin_delivery_status_retry" ON "plugin_event_delivery" USING btree ("status","next_retry_at");--> statement-breakpoint
CREATE INDEX "idx_plugin_delivery_sub_id" ON "plugin_event_delivery" USING btree ("subscription_id");--> statement-breakpoint
CREATE INDEX "idx_plugin_delivery_outbox_id" ON "plugin_event_delivery" USING btree ("outbox_event_id");--> statement-breakpoint
CREATE INDEX "idx_plugin_outbox_status_created" ON "plugin_event_outbox" USING btree ("status","created_at");--> statement-breakpoint
CREATE INDEX "idx_plugin_outbox_org_id" ON "plugin_event_outbox" USING btree ("organization_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_plugin_sub_inst_event_unique" ON "plugin_event_subscription" USING btree ("installation_id","event_type");--> statement-breakpoint
CREATE INDEX "idx_plugin_sub_event_type" ON "plugin_event_subscription" USING btree ("event_type");--> statement-breakpoint
CREATE INDEX "idx_plugin_sub_status" ON "plugin_event_subscription" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_plugin_grant_inst_scope_unique" ON "plugin_grant" USING btree ("installation_id","scope");--> statement-breakpoint
CREATE INDEX "idx_plugin_grant_installation_id" ON "plugin_grant" USING btree ("installation_id");--> statement-breakpoint
CREATE INDEX "idx_plugin_installation_org_id" ON "plugin_installation" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_plugin_installation_user_id" ON "plugin_installation" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_plugin_installation_plugin_id" ON "plugin_installation" USING btree ("plugin_id");--> statement-breakpoint
CREATE INDEX "idx_plugin_installation_status" ON "plugin_installation" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_plugin_installation_org_approval" ON "plugin_installation" USING btree ("org_approval_status");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_plugin_installation_owner_org_unique" ON "plugin_installation" USING btree ("plugin_id","organization_id") WHERE "plugin_installation"."organization_id" IS NOT NULL AND "plugin_installation"."owner_type" = 'organization';--> statement-breakpoint
CREATE UNIQUE INDEX "idx_plugin_installation_owner_user_unique" ON "plugin_installation" USING btree ("plugin_id","user_id") WHERE "plugin_installation"."user_id" IS NOT NULL AND "plugin_installation"."owner_type" = 'user';--> statement-breakpoint
CREATE UNIQUE INDEX "idx_plugin_launch_code_hash_unique" ON "plugin_launch_code" USING btree ("code_hash");--> statement-breakpoint
CREATE INDEX "idx_plugin_launch_code_installation_id" ON "plugin_launch_code" USING btree ("installation_id");--> statement-breakpoint
CREATE INDEX "idx_plugin_publisher_class" ON "plugin_publisher" USING btree ("publisher_class");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_plugin_storage_inst_scope_ns_key_unique" ON "plugin_storage" USING btree ("installation_id","scope_type","scope_id","namespace","key");--> statement-breakpoint
CREATE INDEX "idx_plugin_storage_lookup" ON "plugin_storage" USING btree ("installation_id","namespace");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_plugin_version_plugin_ver_unique" ON "plugin_version" USING btree ("plugin_id","version");--> statement-breakpoint
CREATE INDEX "idx_plugin_version_plugin_id" ON "plugin_version" USING btree ("plugin_id");
