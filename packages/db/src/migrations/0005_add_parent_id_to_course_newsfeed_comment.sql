ALTER TABLE "course_newsfeed_comment" ADD COLUMN "parent_id" bigint;
--> statement-breakpoint
ALTER TABLE "course_newsfeed_comment" ADD CONSTRAINT "course_newsfeed_comment_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "public"."course_newsfeed_comment"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "course_newsfeed_comment_parent_id_idx" ON "course_newsfeed_comment" USING btree ("parent_id");
