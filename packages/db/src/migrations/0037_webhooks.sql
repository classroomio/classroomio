CREATE TYPE "public"."WEBHOOK_DELIVERY_STATUS" AS ENUM('PENDING', 'SUCCESS', 'FAILED', 'GAVE_UP');--> statement-breakpoint
CREATE TABLE "webhook_delivery" (
	"id" text PRIMARY KEY NOT NULL,
	"webhook_id" uuid NOT NULL,
	"event_id" text NOT NULL,
	"attempt" integer DEFAULT 0 NOT NULL,
	"status" "WEBHOOK_DELIVERY_STATUS" DEFAULT 'PENDING' NOT NULL,
	"is_test" boolean DEFAULT false NOT NULL,
	"next_attempt_at" timestamp with time zone,
	"request_headers" jsonb,
	"response_status" integer,
	"response_body" text,
	"error_message" text,
	"duration_ms" integer,
	"delivered_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "webhook_endpoint" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"name" varchar(120) NOT NULL,
	"payload_url" text NOT NULL,
	"secret_ciphertext" text,
	"secret_last4" varchar(4),
	"verify_ssl" boolean DEFAULT true NOT NULL,
	"event_mode" varchar(16) DEFAULT 'selected' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"consecutive_failures" integer DEFAULT 0 NOT NULL,
	"auto_disabled_at" timestamp with time zone,
	"last_delivery_status" "WEBHOOK_DELIVERY_STATUS",
	"last_delivery_at" timestamp with time zone,
	"created_by_profile_id" uuid,
	"updated_by_profile_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "webhook_event" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" uuid NOT NULL,
	"event_type" varchar(64) NOT NULL,
	"payload" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "webhook_subscription" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"webhook_id" uuid NOT NULL,
	"event_type" varchar(64) NOT NULL,
	CONSTRAINT "webhook_subscription_webhook_event_key" UNIQUE("webhook_id","event_type")
);
--> statement-breakpoint
ALTER TABLE "webhook_delivery" ADD CONSTRAINT "webhook_delivery_webhook_id_webhook_endpoint_id_fk" FOREIGN KEY ("webhook_id") REFERENCES "public"."webhook_endpoint"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "webhook_delivery" ADD CONSTRAINT "webhook_delivery_event_id_webhook_event_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."webhook_event"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "webhook_endpoint" ADD CONSTRAINT "webhook_endpoint_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "webhook_endpoint" ADD CONSTRAINT "webhook_endpoint_created_by_profile_id_profile_id_fk" FOREIGN KEY ("created_by_profile_id") REFERENCES "public"."profile"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "webhook_endpoint" ADD CONSTRAINT "webhook_endpoint_updated_by_profile_id_profile_id_fk" FOREIGN KEY ("updated_by_profile_id") REFERENCES "public"."profile"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "webhook_event" ADD CONSTRAINT "webhook_event_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "webhook_subscription" ADD CONSTRAINT "webhook_subscription_webhook_id_webhook_endpoint_id_fk" FOREIGN KEY ("webhook_id") REFERENCES "public"."webhook_endpoint"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_webhook_delivery_webhook_created_at" ON "webhook_delivery" USING btree ("webhook_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_webhook_delivery_status_next_attempt" ON "webhook_delivery" USING btree ("status","next_attempt_at");--> statement-breakpoint
CREATE INDEX "idx_webhook_delivery_event_id" ON "webhook_delivery" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "idx_webhook_endpoint_org_id" ON "webhook_endpoint" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_webhook_event_created_at" ON "webhook_event" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_webhook_event_org_created_at" ON "webhook_event" USING btree ("organization_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_webhook_subscription_event_type" ON "webhook_subscription" USING btree ("event_type");
