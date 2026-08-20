CREATE TYPE "public"."CONTENT_REPORT_TARGET_TYPE" AS ENUM('course_newsfeed_post', 'course_newsfeed_comment', 'cohort_newsfeed_post', 'cohort_newsfeed_comment', 'community_question', 'community_answer', 'lesson_comment', 'profile');
--> statement-breakpoint
CREATE TYPE "public"."CONTENT_REPORT_REASON" AS ENUM('spam', 'harassment', 'hate_speech', 'sexual_content', 'violence', 'misinformation', 'privacy', 'other');
--> statement-breakpoint
CREATE TYPE "public"."CONTENT_REPORT_STATUS" AS ENUM('open', 'in_review', 'actioned', 'dismissed');
--> statement-breakpoint
CREATE TYPE "public"."CONTENT_REPORT_RESOLUTION_CODE" AS ENUM('removed', 'warned', 'restricted', 'no_action', 'duplicate');
--> statement-breakpoint
CREATE TABLE "content_report" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"reporter_id" uuid,
	"target_type" "CONTENT_REPORT_TARGET_TYPE" NOT NULL,
	"target_id" text NOT NULL,
	"target_author_id" uuid,
	"reason" "CONTENT_REPORT_REASON" NOT NULL,
	"details" text,
	"status" "CONTENT_REPORT_STATUS" DEFAULT 'open' NOT NULL,
	"priority" integer DEFAULT 2 NOT NULL,
	"content_snapshot" jsonb NOT NULL,
	"assigned_to" uuid,
	"resolution_code" "CONTENT_REPORT_RESOLUTION_CODE",
	"resolution_note" text,
	"reviewed_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"resolved_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "content_report" ADD CONSTRAINT "content_report_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "content_report" ADD CONSTRAINT "content_report_reporter_id_fkey" FOREIGN KEY ("reporter_id") REFERENCES "public"."profile"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "content_report" ADD CONSTRAINT "content_report_target_author_id_fkey" FOREIGN KEY ("target_author_id") REFERENCES "public"."profile"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "content_report" ADD CONSTRAINT "content_report_assigned_to_fkey" FOREIGN KEY ("assigned_to") REFERENCES "public"."profile"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "content_report" ADD CONSTRAINT "content_report_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "public"."profile"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "idx_content_report_status_priority_created" ON "content_report" USING btree ("status","priority","created_at");
--> statement-breakpoint
CREATE INDEX "idx_content_report_org_created" ON "content_report" USING btree ("organization_id","created_at");
--> statement-breakpoint
CREATE INDEX "idx_content_report_target" ON "content_report" USING btree ("target_type","target_id");
--> statement-breakpoint
CREATE UNIQUE INDEX "content_report_reporter_target_open_unique" ON "content_report" USING btree ("reporter_id","target_type","target_id") WHERE "content_report"."reporter_id" IS NOT NULL AND "content_report"."status" IN ('open', 'in_review');
