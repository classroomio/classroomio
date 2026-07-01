CREATE TYPE "public"."note_origin" AS ENUM('workspace', 'lesson_capture');--> statement-breakpoint
CREATE TABLE "org_note" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"owner_id" uuid NOT NULL,
	"title" varchar NOT NULL,
	"content" text DEFAULT '' NOT NULL,
	"plain_text" text DEFAULT '' NOT NULL,
	"origin" "note_origin" DEFAULT 'workspace' NOT NULL,
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
ALTER TABLE "org_note" ADD CONSTRAINT "org_note_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_note" ADD CONSTRAINT "org_note_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "public"."profile"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_note" ADD CONSTRAINT "org_note_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "public"."course"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_note" ADD CONSTRAINT "org_note_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "public"."lesson"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_note" ADD CONSTRAINT "org_note_converted_course_id_fkey" FOREIGN KEY ("converted_course_id") REFERENCES "public"."course"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_note_version" ADD CONSTRAINT "org_note_version_note_id_fkey" FOREIGN KEY ("note_id") REFERENCES "public"."org_note"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_note_version" ADD CONSTRAINT "org_note_version_changed_by_fkey" FOREIGN KEY ("changed_by") REFERENCES "public"."profile"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_org_note_organization_owner_updated" ON "org_note" USING btree ("organization_id","owner_id","updated_at");--> statement-breakpoint
CREATE INDEX "idx_org_note_lesson_id" ON "org_note" USING btree ("lesson_id");--> statement-breakpoint
CREATE INDEX "idx_org_note_origin" ON "org_note" USING btree ("origin");--> statement-breakpoint
CREATE UNIQUE INDEX "org_note_owner_lesson_capture_key" ON "org_note" USING btree ("owner_id","lesson_id") WHERE "org_note"."origin" = 'lesson_capture' AND "org_note"."deleted_at" IS NULL;--> statement-breakpoint
CREATE INDEX "idx_org_note_version_note_id_timestamp" ON "org_note_version" USING btree ("note_id","timestamp");