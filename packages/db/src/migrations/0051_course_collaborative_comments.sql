CREATE TYPE "public"."COURSE_COMMENT_ANCHOR_TYPE" AS ENUM('course', 'page', 'block', 'text', 'time', 'slide', 'point', 'question');--> statement-breakpoint
CREATE TYPE "public"."COURSE_COMMENT_THREAD_STATUS" AS ENUM('open', 'resolved');--> statement-breakpoint
CREATE TYPE "public"."COURSE_COMMENT_THREAD_EVENT_TYPE" AS ENUM('resolved', 'reopened');--> statement-breakpoint
ALTER TABLE "organizationmember_email_notifications" ADD COLUMN "course_comments" boolean DEFAULT true NOT NULL;--> statement-breakpoint
CREATE TABLE "course_comment_thread" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"course_id" uuid NOT NULL,
	"lesson_id" uuid,
	"exercise_id" uuid,
	"block_id" uuid,
	"question_id" bigint,
	"anchor_type" "COURSE_COMMENT_ANCHOR_TYPE" NOT NULL,
	"anchor" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"text_detached" boolean DEFAULT false NOT NULL,
	"status" "COURSE_COMMENT_THREAD_STATUS" DEFAULT 'open' NOT NULL,
	"created_by" uuid,
	"created_by_deleted_name" text,
	"resolved_by" uuid,
	"resolved_by_deleted_name" text,
	"resolved_at" timestamp with time zone,
	"last_activity_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "course_comment_thread_page_owner_check" CHECK (("anchor_type" = 'course' and "lesson_id" is null and "exercise_id" is null) or ("anchor_type" <> 'course' and num_nonnulls("lesson_id", "exercise_id") = 1)),
	CONSTRAINT "course_comment_thread_block_anchor_check" CHECK ("anchor_type" not in ('block', 'text', 'time', 'slide', 'point') or "lesson_id" is not null),
	CONSTRAINT "course_comment_thread_question_anchor_check" CHECK ("anchor_type" <> 'question' or "exercise_id" is not null)
);--> statement-breakpoint
CREATE TABLE "course_comment" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"thread_id" uuid NOT NULL,
	"author_id" uuid,
	"author_deleted_name" text,
	"body" text NOT NULL,
	"mentions" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"edited_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
CREATE TABLE "course_comment_thread_read" (
	"thread_id" uuid NOT NULL,
	"profile_id" uuid NOT NULL,
	"last_read_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "course_comment_thread_read_pkey" PRIMARY KEY("thread_id","profile_id")
);--> statement-breakpoint
CREATE TABLE "course_comment_thread_event" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"thread_id" uuid NOT NULL,
	"type" "COURSE_COMMENT_THREAD_EVENT_TYPE" NOT NULL,
	"actor_id" uuid,
	"actor_name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
CREATE TABLE "notification" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"recipient_id" uuid NOT NULL,
	"actor_id" uuid,
	"kind" varchar(64) NOT NULL,
	"course_id" uuid,
	"course_comment_thread_id" uuid,
	"course_comment_id" uuid,
	"read_at" timestamp with time zone,
	"emailed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
ALTER TABLE "course_comment_thread" ADD CONSTRAINT "course_comment_thread_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "course_comment_thread" ADD CONSTRAINT "course_comment_thread_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "public"."course"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "course_comment_thread" ADD CONSTRAINT "course_comment_thread_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "public"."lesson"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "course_comment_thread" ADD CONSTRAINT "course_comment_thread_exercise_id_fkey" FOREIGN KEY ("exercise_id") REFERENCES "public"."exercise"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "course_comment_thread" ADD CONSTRAINT "course_comment_thread_block_id_fkey" FOREIGN KEY ("block_id") REFERENCES "public"."block"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "course_comment_thread" ADD CONSTRAINT "course_comment_thread_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "public"."question"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "course_comment_thread" ADD CONSTRAINT "course_comment_thread_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profile"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "course_comment_thread" ADD CONSTRAINT "course_comment_thread_resolved_by_fkey" FOREIGN KEY ("resolved_by") REFERENCES "public"."profile"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "course_comment" ADD CONSTRAINT "course_comment_thread_id_fkey" FOREIGN KEY ("thread_id") REFERENCES "public"."course_comment_thread"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "course_comment" ADD CONSTRAINT "course_comment_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "public"."profile"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "course_comment_thread_read" ADD CONSTRAINT "course_comment_thread_read_thread_id_fkey" FOREIGN KEY ("thread_id") REFERENCES "public"."course_comment_thread"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "course_comment_thread_read" ADD CONSTRAINT "course_comment_thread_read_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."profile"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "course_comment_thread_event" ADD CONSTRAINT "course_comment_thread_event_thread_id_fkey" FOREIGN KEY ("thread_id") REFERENCES "public"."course_comment_thread"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "course_comment_thread_event" ADD CONSTRAINT "course_comment_thread_event_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "public"."profile"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "notification" ADD CONSTRAINT "notification_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "notification" ADD CONSTRAINT "notification_recipient_id_fkey" FOREIGN KEY ("recipient_id") REFERENCES "public"."profile"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "notification" ADD CONSTRAINT "notification_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "public"."profile"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "notification" ADD CONSTRAINT "notification_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "public"."course"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "notification" ADD CONSTRAINT "notification_course_comment_thread_id_fkey" FOREIGN KEY ("course_comment_thread_id") REFERENCES "public"."course_comment_thread"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "notification" ADD CONSTRAINT "notification_course_comment_id_fkey" FOREIGN KEY ("course_comment_id") REFERENCES "public"."course_comment"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
CREATE INDEX "course_comment_thread_course_status_idx" ON "course_comment_thread" USING btree ("course_id","status");--> statement-breakpoint
CREATE INDEX "course_comment_thread_lesson_idx" ON "course_comment_thread" USING btree ("lesson_id") WHERE "course_comment_thread"."lesson_id" is not null;--> statement-breakpoint
CREATE INDEX "course_comment_thread_exercise_idx" ON "course_comment_thread" USING btree ("exercise_id") WHERE "course_comment_thread"."exercise_id" is not null;--> statement-breakpoint
CREATE INDEX "course_comment_thread_block_idx" ON "course_comment_thread" USING btree ("block_id") WHERE "course_comment_thread"."block_id" is not null;--> statement-breakpoint
CREATE INDEX "course_comment_thread_question_idx" ON "course_comment_thread" USING btree ("question_id") WHERE "course_comment_thread"."question_id" is not null;--> statement-breakpoint
CREATE INDEX "course_comment_thread_created_idx" ON "course_comment" USING btree ("thread_id","created_at");--> statement-breakpoint
CREATE INDEX "course_comment_mentions_gin_idx" ON "course_comment" USING gin ("mentions");--> statement-breakpoint
CREATE INDEX "course_comment_thread_read_profile_idx" ON "course_comment_thread_read" USING btree ("profile_id");--> statement-breakpoint
CREATE INDEX "course_comment_thread_event_thread_idx" ON "course_comment_thread_event" USING btree ("thread_id","created_at");--> statement-breakpoint
CREATE INDEX "notification_recipient_org_created_idx" ON "notification" USING btree ("recipient_id","organization_id","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "notification_recipient_unread_idx" ON "notification" USING btree ("recipient_id","organization_id") WHERE "notification"."read_at" is null;--> statement-breakpoint
CREATE INDEX "notification_thread_recipient_pending_idx" ON "notification" USING btree ("course_comment_thread_id","recipient_id") WHERE "notification"."emailed_at" is null and "notification"."read_at" is null;--> statement-breakpoint
CREATE INDEX "notification_course_comment_id_idx" ON "notification" USING btree ("course_comment_id") WHERE "notification"."course_comment_id" is not null;
