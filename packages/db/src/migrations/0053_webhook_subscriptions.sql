ALTER TABLE "webhook_endpoint" ADD COLUMN IF NOT EXISTS "oauth_consent_id" uuid;--> statement-breakpoint
ALTER TABLE "webhook_endpoint" ADD COLUMN IF NOT EXISTS "filter_course_id" uuid;--> statement-breakpoint
ALTER TABLE "webhook_endpoint" ADD COLUMN IF NOT EXISTS "filter_cohort_id" uuid;--> statement-breakpoint
DO $$ BEGIN
	ALTER TABLE "webhook_endpoint" ADD CONSTRAINT "webhook_endpoint_oauth_consent_id_oauth_consent_id_fk" FOREIGN KEY ("oauth_consent_id") REFERENCES "public"."oauth_consent"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_webhook_endpoint_oauth_consent_id" ON "webhook_endpoint" USING btree ("oauth_consent_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "uq_webhook_endpoint_consent_target" ON "webhook_endpoint" USING btree ("oauth_consent_id","payload_url") WHERE "oauth_consent_id" IS NOT NULL;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_webhook_event_org_type_created_at" ON "webhook_event" USING btree ("organization_id","event_type","created_at" DESC);

