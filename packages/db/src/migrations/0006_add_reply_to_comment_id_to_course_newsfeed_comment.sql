ALTER TABLE "course_newsfeed_comment" ADD COLUMN IF NOT EXISTS "reply_to_comment_id" bigint;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "course_newsfeed_comment" ADD CONSTRAINT "course_newsfeed_comment_reply_to_comment_id_fkey" FOREIGN KEY ("reply_to_comment_id") REFERENCES "public"."course_newsfeed_comment"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "course_newsfeed_comment_course_newsfeed_id_idx" ON "course_newsfeed_comment" USING btree ("course_newsfeed_id");
