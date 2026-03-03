CREATE TYPE "public"."EMAIL_TEMPLATE_AUDIT_ACTION" AS ENUM('CREATED', 'UPDATED', 'DELETED', 'ENABLED', 'DISABLED');--> statement-breakpoint
CREATE TABLE "organization_email_template" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"email_id" text NOT NULL,
	"locale" "LOCALE" DEFAULT 'en' NOT NULL,
	"is_enabled" boolean DEFAULT true NOT NULL,
	"logo_url" text,
	"content" text,
	"updated_by_profile_id" uuid,
	"created_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
	"updated_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
	CONSTRAINT "organization_email_template_org_email_locale_key" UNIQUE("organization_id","email_id","locale")
);
--> statement-breakpoint
CREATE TABLE "organization_email_template_audit" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"email_template_id" uuid,
	"action" "EMAIL_TEMPLATE_AUDIT_ACTION" NOT NULL,
	"before" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"after" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"actor_profile_id" uuid,
	"created_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);
--> statement-breakpoint
ALTER TABLE "organization_email_template" ADD CONSTRAINT "organization_email_template_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_email_template" ADD CONSTRAINT "organization_email_template_updated_by_profile_id_fkey" FOREIGN KEY ("updated_by_profile_id") REFERENCES "public"."profile"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_email_template_audit" ADD CONSTRAINT "organization_email_template_audit_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_email_template_audit" ADD CONSTRAINT "organization_email_template_audit_email_template_id_fkey" FOREIGN KEY ("email_template_id") REFERENCES "public"."organization_email_template"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_email_template_audit" ADD CONSTRAINT "organization_email_template_audit_actor_profile_id_fkey" FOREIGN KEY ("actor_profile_id") REFERENCES "public"."profile"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_organization_email_template_org_email" ON "organization_email_template" USING btree ("organization_id","email_id");--> statement-breakpoint
CREATE INDEX "idx_organization_email_template_org_locale" ON "organization_email_template" USING btree ("organization_id","locale");--> statement-breakpoint
CREATE INDEX "idx_organization_email_template_audit_org_id" ON "organization_email_template_audit" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_organization_email_template_audit_template_id" ON "organization_email_template_audit" USING btree ("email_template_id");--> statement-breakpoint
CREATE INDEX "idx_organization_email_template_audit_created_at" ON "organization_email_template_audit" USING btree ("created_at");
