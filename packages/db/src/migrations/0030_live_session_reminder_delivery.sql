CREATE TYPE "public"."LIVE_SESSION_REMINDER_STATUS" AS ENUM('pending', 'queued', 'sent', 'failed', 'skipped');--> statement-breakpoint
CREATE TABLE "live_session_reminder_delivery" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"course_id" uuid NOT NULL,
	"lesson_id" uuid NOT NULL,
	"profile_id" uuid NOT NULL,
	"offset_minutes" integer NOT NULL,
	"lesson_at" timestamp with time zone NOT NULL,
	"status" "LIVE_SESSION_REMINDER_STATUS" DEFAULT 'pending' NOT NULL,
	"skip_reason" varchar(64),
	"bullmq_job_id" text,
	"provider_id" text,
	"last_error" text,
	"attempt_count" integer DEFAULT 0 NOT NULL,
	"queued_at" timestamp with time zone,
	"sent_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "live_session_reminder_delivery" ADD CONSTRAINT "live_session_reminder_delivery_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "live_session_reminder_delivery" ADD CONSTRAINT "live_session_reminder_delivery_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "public"."course"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "live_session_reminder_delivery" ADD CONSTRAINT "live_session_reminder_delivery_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "public"."lesson"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "live_session_reminder_delivery" ADD CONSTRAINT "live_session_reminder_delivery_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."profile"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "live_session_reminder_delivery_lesson_profile_offset_unique" ON "live_session_reminder_delivery" USING btree ("lesson_id","profile_id","offset_minutes");--> statement-breakpoint
CREATE INDEX "idx_live_session_reminder_delivery_organization_id" ON "live_session_reminder_delivery" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_live_session_reminder_delivery_course_lesson_at" ON "live_session_reminder_delivery" USING btree ("course_id","lesson_at");--> statement-breakpoint
CREATE INDEX "idx_live_session_reminder_delivery_profile_id" ON "live_session_reminder_delivery" USING btree ("profile_id");--> statement-breakpoint
CREATE INDEX "idx_live_session_reminder_delivery_status_lesson_at" ON "live_session_reminder_delivery" USING btree ("status","lesson_at");
