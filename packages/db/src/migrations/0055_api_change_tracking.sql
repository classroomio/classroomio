ALTER TABLE "course" ADD COLUMN "created_via" varchar;--> statement-breakpoint
ALTER TABLE "course_section" ADD COLUMN "created_via" varchar;--> statement-breakpoint
ALTER TABLE "lesson" ADD COLUMN "created_via" varchar;--> statement-breakpoint
ALTER TABLE "exercise" ADD COLUMN "created_via" varchar;--> statement-breakpoint
ALTER TABLE "exercise_section" ADD COLUMN "created_via" varchar;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "automation_change_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"organization_api_key_id" uuid,
	"oauth_client_id" text,
	"key_type" "ORGANIZATION_API_KEY_TYPE" NOT NULL,
	"channel" varchar(20) NOT NULL,
	"client_name" varchar(120),
	"actor_profile_id" uuid,
	"method" varchar(10) NOT NULL,
	"route" varchar(255) NOT NULL,
	"action" varchar(160) NOT NULL,
	"resource_ids" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"status_code" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);--> statement-breakpoint
DO $$ BEGIN
	ALTER TABLE "automation_change_log" ADD CONSTRAINT "automation_change_log_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint
DO $$ BEGIN
	ALTER TABLE "automation_change_log" ADD CONSTRAINT "automation_change_log_organization_api_key_id_organization_api_key_id_fk" FOREIGN KEY ("organization_api_key_id") REFERENCES "public"."organization_api_key"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint
DO $$ BEGIN
	ALTER TABLE "automation_change_log" ADD CONSTRAINT "automation_change_log_actor_profile_id_profile_id_fk" FOREIGN KEY ("actor_profile_id") REFERENCES "public"."profile"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_automation_change_log_org_created_at" ON "automation_change_log" USING btree ("organization_id","created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_automation_change_log_channel_created_at" ON "automation_change_log" USING btree ("channel","created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_automation_change_log_action" ON "automation_change_log" USING btree ("action");
