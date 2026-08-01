CREATE TYPE "public"."doc_origin" AS ENUM('organization', 'lesson_capture');--> statement-breakpoint
CREATE TYPE "public"."doc_visibility" AS ENUM('private', 'team', 'public');--> statement-breakpoint
CREATE TYPE "public"."doc_comment_thread_status" AS ENUM('open', 'resolved');--> statement-breakpoint
CREATE TYPE "public"."doc_comment_author_type" AS ENUM('user', 'ai');--> statement-breakpoint
CREATE TABLE "org_doc" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"owner_id" uuid NOT NULL,
	"title" varchar NOT NULL,
	"content" text DEFAULT '' NOT NULL,
	"plain_text" text DEFAULT '' NOT NULL,
	"origin" "doc_origin" DEFAULT 'organization' NOT NULL,
	"visibility" "doc_visibility" DEFAULT 'private' NOT NULL,
	"slug" varchar,
	"is_pinned" boolean DEFAULT false NOT NULL,
	"is_template" boolean DEFAULT false NOT NULL,
	"course_id" uuid,
	"lesson_id" uuid,
	"video_anchors" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"converted_course_id" uuid,
	"parent_id" uuid,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"cover_image_url" varchar,
	"created_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
	"updated_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "org_doc_version" (
	"id" serial PRIMARY KEY NOT NULL,
	"doc_id" uuid NOT NULL,
	"old_content" text,
	"new_content" text NOT NULL,
	"changed_by" uuid NOT NULL,
	"change_source" varchar DEFAULT 'manual' NOT NULL,
	"timestamp" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "doc_tag_assignment" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tag_id" uuid NOT NULL,
	"doc_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
	CONSTRAINT "doc_tag_assignment_tag_note_key" UNIQUE("tag_id","doc_id")
);
--> statement-breakpoint
CREATE TABLE "org_doc_comment_thread" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"doc_id" uuid NOT NULL,
	"status" "doc_comment_thread_status" DEFAULT 'open' NOT NULL,
	"anchor" jsonb NOT NULL,
	"created_by" uuid,
	"author_type" "doc_comment_author_type" DEFAULT 'user' NOT NULL,
	"resolved_at" timestamp with time zone,
	"resolved_by" uuid,
	"created_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
	"updated_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "org_doc_comment" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"thread_id" uuid NOT NULL,
	"author_id" uuid,
	"author_type" "doc_comment_author_type" DEFAULT 'user' NOT NULL,
	"body" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
	"updated_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "org_doc_comment_mention" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"comment_id" uuid NOT NULL,
	"profile_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);
--> statement-breakpoint
ALTER TABLE "org_doc" ADD CONSTRAINT "org_doc_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_doc" ADD CONSTRAINT "org_doc_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "public"."profile"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_doc" ADD CONSTRAINT "org_doc_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "public"."course"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_doc" ADD CONSTRAINT "org_doc_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "public"."lesson"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_doc" ADD CONSTRAINT "org_doc_converted_course_id_fkey" FOREIGN KEY ("converted_course_id") REFERENCES "public"."course"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_doc_version" ADD CONSTRAINT "org_doc_version_doc_id_fkey" FOREIGN KEY ("doc_id") REFERENCES "public"."org_doc"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_doc_version" ADD CONSTRAINT "org_doc_version_changed_by_fkey" FOREIGN KEY ("changed_by") REFERENCES "public"."profile"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "doc_tag_assignment" ADD CONSTRAINT "doc_tag_assignment_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "public"."tag"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "doc_tag_assignment" ADD CONSTRAINT "doc_tag_assignment_doc_id_fkey" FOREIGN KEY ("doc_id") REFERENCES "public"."org_doc"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_doc_comment_thread" ADD CONSTRAINT "org_doc_comment_thread_doc_id_fkey" FOREIGN KEY ("doc_id") REFERENCES "public"."org_doc"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_doc_comment_thread" ADD CONSTRAINT "org_doc_comment_thread_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profile"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_doc_comment_thread" ADD CONSTRAINT "org_doc_comment_thread_resolved_by_fkey" FOREIGN KEY ("resolved_by") REFERENCES "public"."profile"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_doc_comment" ADD CONSTRAINT "org_doc_comment_thread_id_fkey" FOREIGN KEY ("thread_id") REFERENCES "public"."org_doc_comment_thread"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_doc_comment" ADD CONSTRAINT "org_doc_comment_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "public"."profile"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_doc_comment_mention" ADD CONSTRAINT "org_doc_comment_mention_comment_id_fkey" FOREIGN KEY ("comment_id") REFERENCES "public"."org_doc_comment"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_doc_comment_mention" ADD CONSTRAINT "org_doc_comment_mention_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."profile"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_org_doc_organization_owner_updated" ON "org_doc" USING btree ("organization_id","owner_id","updated_at");--> statement-breakpoint
CREATE INDEX "idx_org_doc_lesson_id" ON "org_doc" USING btree ("lesson_id");--> statement-breakpoint
CREATE INDEX "idx_org_doc_origin" ON "org_doc" USING btree ("origin");--> statement-breakpoint
CREATE INDEX "idx_org_doc_visibility" ON "org_doc" USING btree ("organization_id","visibility");--> statement-breakpoint
CREATE INDEX "idx_org_doc_is_template" ON "org_doc" USING btree ("organization_id","is_template");--> statement-breakpoint
CREATE UNIQUE INDEX "org_doc_owner_lesson_capture_key" ON "org_doc" USING btree ("owner_id","lesson_id") WHERE "org_doc"."origin" = 'lesson_capture' AND "org_doc"."deleted_at" IS NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "org_doc_org_slug_key" ON "org_doc" USING btree ("organization_id","slug") WHERE "deleted_at" IS NULL AND "slug" IS NOT NULL;--> statement-breakpoint
CREATE INDEX "idx_org_doc_version_doc_id_timestamp" ON "org_doc_version" USING btree ("doc_id","timestamp");--> statement-breakpoint
CREATE INDEX "idx_doc_tag_assignment_tag_id" ON "doc_tag_assignment" USING btree ("tag_id");--> statement-breakpoint
CREATE INDEX "idx_doc_tag_assignment_doc_id" ON "doc_tag_assignment" USING btree ("doc_id");--> statement-breakpoint
CREATE INDEX "idx_org_doc_comment_thread_doc_id_status" ON "org_doc_comment_thread" USING btree ("doc_id","status");--> statement-breakpoint
CREATE INDEX "idx_org_doc_comment_thread_doc_id_created" ON "org_doc_comment_thread" USING btree ("doc_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_org_doc_comment_thread_id_created" ON "org_doc_comment" USING btree ("thread_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_org_doc_comment_mention_comment_id" ON "org_doc_comment_mention" USING btree ("comment_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_org_doc_comment_mention_unique" ON "org_doc_comment_mention" USING btree ("comment_id","profile_id");--> statement-breakpoint
ALTER TABLE "org_doc" ADD CONSTRAINT "org_doc_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "public"."org_doc"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_org_doc_parent_sort" ON "org_doc" USING btree ("parent_id","sort_order");--> statement-breakpoint
CREATE INDEX "idx_org_doc_org_parent" ON "org_doc" USING btree ("organization_id","parent_id");--> statement-breakpoint
CREATE TYPE "public"."doc_share_permission" AS ENUM('read', 'write');--> statement-breakpoint
CREATE TABLE "org_doc_favorite" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"profile_id" uuid NOT NULL,
	"doc_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
	CONSTRAINT "org_doc_favorite_profile_note_key" UNIQUE("profile_id","doc_id")
);--> statement-breakpoint
ALTER TABLE "org_doc_favorite" ADD CONSTRAINT "org_doc_favorite_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."profile"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_doc_favorite" ADD CONSTRAINT "org_doc_favorite_doc_id_fkey" FOREIGN KEY ("doc_id") REFERENCES "public"."org_doc"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_org_doc_favorite_profile" ON "org_doc_favorite" USING btree ("profile_id");--> statement-breakpoint
CREATE TABLE "org_doc_share" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"doc_id" uuid NOT NULL,
	"profile_id" uuid NOT NULL,
	"shared_by" uuid NOT NULL,
	"permission" "doc_share_permission" DEFAULT 'read' NOT NULL,
	"created_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
	CONSTRAINT "org_doc_share_note_profile_key" UNIQUE("doc_id","profile_id")
);--> statement-breakpoint
ALTER TABLE "org_doc_share" ADD CONSTRAINT "org_doc_share_doc_id_fkey" FOREIGN KEY ("doc_id") REFERENCES "public"."org_doc"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_doc_share" ADD CONSTRAINT "org_doc_share_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."profile"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_doc_share" ADD CONSTRAINT "org_doc_share_shared_by_fkey" FOREIGN KEY ("shared_by") REFERENCES "public"."profile"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_org_doc_share_profile" ON "org_doc_share" USING btree ("profile_id");--> statement-breakpoint
CREATE INDEX "idx_org_doc_share_note" ON "org_doc_share" USING btree ("doc_id");--> statement-breakpoint
INSERT INTO "org_doc_favorite" ("profile_id", "doc_id", "created_at")
SELECT "owner_id", "id", COALESCE("updated_at", "created_at")
FROM "org_doc"
WHERE "is_pinned" = true AND "deleted_at" IS NULL
ON CONFLICT DO NOTHING;--> statement-breakpoint
ALTER TABLE "org_doc" ADD COLUMN IF NOT EXISTS "cover_image_url" varchar;--> statement-breakpoint
ALTER TABLE "analytics_page_event" ADD COLUMN IF NOT EXISTS "doc_id" uuid;--> statement-breakpoint
ALTER TABLE "analytics_page_event" ADD CONSTRAINT "analytics_page_event_doc_id_fkey" FOREIGN KEY ("doc_id") REFERENCES "public"."org_doc"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_ape_note_occurred" ON "analytics_page_event" USING btree ("doc_id","occurred_at");--> statement-breakpoint
ALTER TABLE "analytics_org_daily" ADD COLUMN IF NOT EXISTS "doc_page_views" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "analytics_doc_daily" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"doc_id" uuid NOT NULL,
	"org_id" uuid NOT NULL,
	"date" date NOT NULL,
	"views" integer DEFAULT 0 NOT NULL,
	"unique_visitors" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
	CONSTRAINT "analytics_doc_daily_note_date_unique" UNIQUE("doc_id","date")
);--> statement-breakpoint
ALTER TABLE "analytics_doc_daily" ADD CONSTRAINT "analytics_doc_daily_doc_id_fkey" FOREIGN KEY ("doc_id") REFERENCES "public"."org_doc"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "analytics_doc_daily" ADD CONSTRAINT "analytics_doc_daily_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_and_org_date" ON "analytics_doc_daily" USING btree ("org_id","date");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_and_note_date" ON "analytics_doc_daily" USING btree ("doc_id","date");
