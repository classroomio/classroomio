CREATE TYPE "public"."note_origin" AS ENUM('workspace', 'lesson_capture');--> statement-breakpoint
CREATE TYPE "public"."note_visibility" AS ENUM('private', 'team', 'public');--> statement-breakpoint
CREATE TYPE "public"."note_comment_thread_status" AS ENUM('open', 'resolved');--> statement-breakpoint
CREATE TYPE "public"."note_comment_author_type" AS ENUM('user', 'ai');--> statement-breakpoint
CREATE TABLE "org_note" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"owner_id" uuid NOT NULL,
	"title" varchar NOT NULL,
	"content" text DEFAULT '' NOT NULL,
	"plain_text" text DEFAULT '' NOT NULL,
	"origin" "note_origin" DEFAULT 'workspace' NOT NULL,
	"visibility" "note_visibility" DEFAULT 'private' NOT NULL,
	"slug" varchar,
	"is_pinned" boolean DEFAULT false NOT NULL,
	"is_template" boolean DEFAULT false NOT NULL,
	"course_id" uuid,
	"lesson_id" uuid,
	"video_anchors" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"converted_course_id" uuid,
	"created_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
	"updated_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "org_note_version" (
	"id" serial PRIMARY KEY NOT NULL,
	"note_id" uuid NOT NULL,
	"old_content" text,
	"new_content" text NOT NULL,
	"changed_by" uuid NOT NULL,
	"change_source" varchar DEFAULT 'manual' NOT NULL,
	"timestamp" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "note_tag_assignment" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tag_id" uuid NOT NULL,
	"note_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
	CONSTRAINT "note_tag_assignment_tag_note_key" UNIQUE("tag_id","note_id")
);
--> statement-breakpoint
CREATE TABLE "org_note_comment_thread" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"note_id" uuid NOT NULL,
	"status" "note_comment_thread_status" DEFAULT 'open' NOT NULL,
	"anchor" jsonb NOT NULL,
	"created_by" uuid,
	"author_type" "note_comment_author_type" DEFAULT 'user' NOT NULL,
	"resolved_at" timestamp with time zone,
	"resolved_by" uuid,
	"created_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
	"updated_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "org_note_comment" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"thread_id" uuid NOT NULL,
	"author_id" uuid,
	"author_type" "note_comment_author_type" DEFAULT 'user' NOT NULL,
	"body" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
	"updated_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "org_note_comment_mention" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"comment_id" uuid NOT NULL,
	"profile_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);
--> statement-breakpoint
ALTER TABLE "org_note" ADD CONSTRAINT "org_note_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_note" ADD CONSTRAINT "org_note_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "public"."profile"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_note" ADD CONSTRAINT "org_note_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "public"."course"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_note" ADD CONSTRAINT "org_note_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "public"."lesson"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_note" ADD CONSTRAINT "org_note_converted_course_id_fkey" FOREIGN KEY ("converted_course_id") REFERENCES "public"."course"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_note_version" ADD CONSTRAINT "org_note_version_note_id_fkey" FOREIGN KEY ("note_id") REFERENCES "public"."org_note"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_note_version" ADD CONSTRAINT "org_note_version_changed_by_fkey" FOREIGN KEY ("changed_by") REFERENCES "public"."profile"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "note_tag_assignment" ADD CONSTRAINT "note_tag_assignment_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "public"."tag"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "note_tag_assignment" ADD CONSTRAINT "note_tag_assignment_note_id_fkey" FOREIGN KEY ("note_id") REFERENCES "public"."org_note"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_note_comment_thread" ADD CONSTRAINT "org_note_comment_thread_note_id_fkey" FOREIGN KEY ("note_id") REFERENCES "public"."org_note"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_note_comment_thread" ADD CONSTRAINT "org_note_comment_thread_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profile"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_note_comment_thread" ADD CONSTRAINT "org_note_comment_thread_resolved_by_fkey" FOREIGN KEY ("resolved_by") REFERENCES "public"."profile"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_note_comment" ADD CONSTRAINT "org_note_comment_thread_id_fkey" FOREIGN KEY ("thread_id") REFERENCES "public"."org_note_comment_thread"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_note_comment" ADD CONSTRAINT "org_note_comment_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "public"."profile"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_note_comment_mention" ADD CONSTRAINT "org_note_comment_mention_comment_id_fkey" FOREIGN KEY ("comment_id") REFERENCES "public"."org_note_comment"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_note_comment_mention" ADD CONSTRAINT "org_note_comment_mention_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."profile"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_org_note_organization_owner_updated" ON "org_note" USING btree ("organization_id","owner_id","updated_at");--> statement-breakpoint
CREATE INDEX "idx_org_note_lesson_id" ON "org_note" USING btree ("lesson_id");--> statement-breakpoint
CREATE INDEX "idx_org_note_origin" ON "org_note" USING btree ("origin");--> statement-breakpoint
CREATE INDEX "idx_org_note_visibility" ON "org_note" USING btree ("organization_id","visibility");--> statement-breakpoint
CREATE INDEX "idx_org_note_is_template" ON "org_note" USING btree ("organization_id","is_template");--> statement-breakpoint
CREATE UNIQUE INDEX "org_note_owner_lesson_capture_key" ON "org_note" USING btree ("owner_id","lesson_id") WHERE "org_note"."origin" = 'lesson_capture' AND "org_note"."deleted_at" IS NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "org_note_org_slug_key" ON "org_note" USING btree ("organization_id","slug") WHERE "deleted_at" IS NULL AND "slug" IS NOT NULL;--> statement-breakpoint
CREATE INDEX "idx_org_note_version_note_id_timestamp" ON "org_note_version" USING btree ("note_id","timestamp");--> statement-breakpoint
CREATE INDEX "idx_note_tag_assignment_tag_id" ON "note_tag_assignment" USING btree ("tag_id");--> statement-breakpoint
CREATE INDEX "idx_note_tag_assignment_note_id" ON "note_tag_assignment" USING btree ("note_id");--> statement-breakpoint
CREATE INDEX "idx_org_note_comment_thread_note_id_status" ON "org_note_comment_thread" USING btree ("note_id","status");--> statement-breakpoint
CREATE INDEX "idx_org_note_comment_thread_note_id_created" ON "org_note_comment_thread" USING btree ("note_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_org_note_comment_thread_id_created" ON "org_note_comment" USING btree ("thread_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_org_note_comment_mention_comment_id" ON "org_note_comment_mention" USING btree ("comment_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_org_note_comment_mention_unique" ON "org_note_comment_mention" USING btree ("comment_id","profile_id");
