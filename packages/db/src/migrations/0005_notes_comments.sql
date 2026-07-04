CREATE TYPE "public"."note_comment_thread_status" AS ENUM('open', 'resolved');--> statement-breakpoint
CREATE TYPE "public"."note_comment_author_type" AS ENUM('user', 'ai');--> statement-breakpoint
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
);--> statement-breakpoint
CREATE TABLE "org_note_comment" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"thread_id" uuid NOT NULL,
	"author_id" uuid,
	"author_type" "note_comment_author_type" DEFAULT 'user' NOT NULL,
	"body" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
	"updated_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
	"deleted_at" timestamp with time zone
);--> statement-breakpoint
ALTER TABLE "org_note_comment_thread" ADD CONSTRAINT "org_note_comment_thread_note_id_fkey" FOREIGN KEY ("note_id") REFERENCES "public"."org_note"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_note_comment_thread" ADD CONSTRAINT "org_note_comment_thread_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profile"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_note_comment_thread" ADD CONSTRAINT "org_note_comment_thread_resolved_by_fkey" FOREIGN KEY ("resolved_by") REFERENCES "public"."profile"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_note_comment" ADD CONSTRAINT "org_note_comment_thread_id_fkey" FOREIGN KEY ("thread_id") REFERENCES "public"."org_note_comment_thread"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_note_comment" ADD CONSTRAINT "org_note_comment_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "public"."profile"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_org_note_comment_thread_note_id_status" ON "org_note_comment_thread" USING btree ("note_id","status");--> statement-breakpoint
CREATE INDEX "idx_org_note_comment_thread_note_id_created" ON "org_note_comment_thread" USING btree ("note_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_org_note_comment_thread_id_created" ON "org_note_comment" USING btree ("thread_id","created_at");
