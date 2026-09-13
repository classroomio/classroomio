CREATE TABLE "youtube_caption" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"youtube_video_id" varchar(11) NOT NULL,
	"language" varchar(8) NOT NULL,
	"status" varchar(16) DEFAULT 'ready' NOT NULL,
	"unavailable_reason" varchar(32),
	"is_generated" boolean DEFAULT false NOT NULL,
	"text" text,
	"segments" jsonb,
	"provider" varchar(32) DEFAULT 'supadata' NOT NULL,
	"source_hash" text,
	"cost_cents" integer DEFAULT 0 NOT NULL,
	"fetched_at" timestamp with time zone NOT NULL,
	"expires_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "youtube_caption_video_lang_unique" UNIQUE("youtube_video_id","language")
);
--> statement-breakpoint
ALTER TABLE "lesson" ALTER COLUMN "is_unlocked" SET DEFAULT true;--> statement-breakpoint
ALTER TABLE "course_newsfeed_comment" ADD COLUMN "reply_to_comment_id" bigint;--> statement-breakpoint
CREATE INDEX "idx_youtube_caption_video_id" ON "youtube_caption" USING btree ("youtube_video_id");--> statement-breakpoint
ALTER TABLE "course_newsfeed_comment" ADD CONSTRAINT "course_newsfeed_comment_reply_to_comment_id_fkey" FOREIGN KEY ("reply_to_comment_id") REFERENCES "public"."course_newsfeed_comment"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "course_newsfeed_comment_parent_id_idx" ON "course_newsfeed_comment" USING btree ("parent_id");