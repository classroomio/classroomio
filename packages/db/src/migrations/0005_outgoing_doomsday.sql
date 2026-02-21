CREATE TYPE "public"."COURSE_INVITE_EVENT_TYPE" AS ENUM('CREATED', 'REVOKED', 'PREVIEWED', 'ACCEPTED', 'EMAIL_SENT', 'EMAIL_FAILED', 'ABUSE_BLOCKED');--> statement-breakpoint
CREATE TYPE "public"."ORGANIZATION_INVITE_EVENT_TYPE" AS ENUM('CREATED', 'REVOKED', 'PREVIEWED', 'ACCEPTED', 'EMAIL_SENT', 'EMAIL_FAILED', 'ABUSE_BLOCKED');--> statement-breakpoint
CREATE TABLE "course_invite" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"course_id" uuid NOT NULL,
	"role_id" bigint DEFAULT '3' NOT NULL,
	"token_hash" text NOT NULL,
	"created_by_profile_id" uuid NOT NULL,
	"revoked_by_profile_id" uuid,
	"revoked_at" timestamp with time zone,
	"expires_at" timestamp with time zone NOT NULL,
	"max_uses" integer DEFAULT 1 NOT NULL,
	"used_count" integer DEFAULT 0 NOT NULL,
	"is_revoked" boolean DEFAULT false NOT NULL,
	"allowed_emails" text[],
	"allowed_domains" text[],
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
	"updated_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
	"last_used_at" timestamp with time zone,
	CONSTRAINT "course_invite_token_hash_key" UNIQUE("token_hash")
);
--> statement-breakpoint
CREATE TABLE "course_invite_audit" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"invite_id" uuid NOT NULL,
	"course_id" uuid NOT NULL,
	"event_type" "COURSE_INVITE_EVENT_TYPE" NOT NULL,
	"actor_profile_id" uuid,
	"target_email" varchar,
	"ip_address" text,
	"user_agent" text,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "organization_invite" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"role_id" bigint NOT NULL,
	"email" text NOT NULL,
	"token_hash" text NOT NULL,
	"created_by_profile_id" uuid NOT NULL,
	"accepted_by_profile_id" uuid,
	"accepted_at" timestamp with time zone,
	"revoked_by_profile_id" uuid,
	"revoked_at" timestamp with time zone,
	"expires_at" timestamp with time zone NOT NULL,
	"is_revoked" boolean DEFAULT false NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
	"updated_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
	CONSTRAINT "organization_invite_token_hash_key" UNIQUE("token_hash")
);
--> statement-breakpoint
CREATE TABLE "organization_invite_audit" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"invite_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"event_type" "ORGANIZATION_INVITE_EVENT_TYPE" NOT NULL,
	"actor_profile_id" uuid,
	"target_email" varchar,
	"ip_address" text,
	"user_agent" text,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);
--> statement-breakpoint
ALTER TABLE "course_invite" ADD CONSTRAINT "course_invite_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "public"."course"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_invite" ADD CONSTRAINT "course_invite_created_by_profile_id_fkey" FOREIGN KEY ("created_by_profile_id") REFERENCES "public"."profile"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_invite" ADD CONSTRAINT "course_invite_revoked_by_profile_id_fkey" FOREIGN KEY ("revoked_by_profile_id") REFERENCES "public"."profile"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_invite" ADD CONSTRAINT "course_invite_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "public"."role"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_invite_audit" ADD CONSTRAINT "course_invite_audit_invite_id_fkey" FOREIGN KEY ("invite_id") REFERENCES "public"."course_invite"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_invite_audit" ADD CONSTRAINT "course_invite_audit_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "public"."course"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_invite_audit" ADD CONSTRAINT "course_invite_audit_actor_profile_id_fkey" FOREIGN KEY ("actor_profile_id") REFERENCES "public"."profile"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_invite" ADD CONSTRAINT "organization_invite_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_invite" ADD CONSTRAINT "organization_invite_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "public"."role"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_invite" ADD CONSTRAINT "organization_invite_created_by_profile_id_fkey" FOREIGN KEY ("created_by_profile_id") REFERENCES "public"."profile"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_invite" ADD CONSTRAINT "organization_invite_accepted_by_profile_id_fkey" FOREIGN KEY ("accepted_by_profile_id") REFERENCES "public"."profile"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_invite" ADD CONSTRAINT "organization_invite_revoked_by_profile_id_fkey" FOREIGN KEY ("revoked_by_profile_id") REFERENCES "public"."profile"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_invite_audit" ADD CONSTRAINT "organization_invite_audit_invite_id_fkey" FOREIGN KEY ("invite_id") REFERENCES "public"."organization_invite"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_invite_audit" ADD CONSTRAINT "organization_invite_audit_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_invite_audit" ADD CONSTRAINT "organization_invite_audit_actor_profile_id_fkey" FOREIGN KEY ("actor_profile_id") REFERENCES "public"."profile"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_course_invite_course_id" ON "course_invite" USING btree ("course_id");--> statement-breakpoint
CREATE INDEX "idx_course_invite_expires_at" ON "course_invite" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "idx_course_invite_created_by" ON "course_invite" USING btree ("created_by_profile_id");--> statement-breakpoint
CREATE INDEX "idx_course_invite_revoked_by" ON "course_invite" USING btree ("revoked_by_profile_id");--> statement-breakpoint
CREATE INDEX "idx_course_invite_audit_invite_id" ON "course_invite_audit" USING btree ("invite_id");--> statement-breakpoint
CREATE INDEX "idx_course_invite_audit_course_id" ON "course_invite_audit" USING btree ("course_id");--> statement-breakpoint
CREATE INDEX "idx_course_invite_audit_event_type" ON "course_invite_audit" USING btree ("event_type");--> statement-breakpoint
CREATE INDEX "idx_course_invite_audit_created_at" ON "course_invite_audit" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_organization_invite_organization_id" ON "organization_invite" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_organization_invite_email_org" ON "organization_invite" USING btree ("email","organization_id");--> statement-breakpoint
CREATE INDEX "idx_organization_invite_expires_at" ON "organization_invite" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "idx_organization_invite_created_by" ON "organization_invite" USING btree ("created_by_profile_id");--> statement-breakpoint
CREATE INDEX "idx_organization_invite_accepted_by" ON "organization_invite" USING btree ("accepted_by_profile_id");--> statement-breakpoint
CREATE INDEX "idx_organization_invite_revoked_by" ON "organization_invite" USING btree ("revoked_by_profile_id");--> statement-breakpoint
CREATE INDEX "idx_organization_invite_audit_invite_id" ON "organization_invite_audit" USING btree ("invite_id");--> statement-breakpoint
CREATE INDEX "idx_organization_invite_audit_org_id" ON "organization_invite_audit" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_organization_invite_audit_event_type" ON "organization_invite_audit" USING btree ("event_type");--> statement-breakpoint
CREATE INDEX "idx_organization_invite_audit_created_at" ON "organization_invite_audit" USING btree ("created_at");