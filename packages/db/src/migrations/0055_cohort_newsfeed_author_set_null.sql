--> Deleting a student from the audience now also deletes their cohort_member rows. Newsfeed posts and comments
--> point at cohort_member with ON DELETE NO ACTION, which would block that delete. SET NULL keeps the posts and
--> drops only the author link, as 0017 did for groupmember. NOT VALID skips the table scan; existing rows already comply.
ALTER TABLE "cohort_newsfeed" DROP CONSTRAINT IF EXISTS "cohort_newsfeed_author_id_fkey";--> statement-breakpoint
ALTER TABLE "cohort_newsfeed"
  ADD CONSTRAINT "cohort_newsfeed_author_id_fkey"
  FOREIGN KEY ("author_id") REFERENCES "cohort_member"("id") ON DELETE SET NULL
  NOT VALID;--> statement-breakpoint
ALTER TABLE "cohort_newsfeed_comment" DROP CONSTRAINT IF EXISTS "cohort_newsfeed_comment_author_id_fkey";--> statement-breakpoint
ALTER TABLE "cohort_newsfeed_comment"
  ADD CONSTRAINT "cohort_newsfeed_comment_author_id_fkey"
  FOREIGN KEY ("author_id") REFERENCES "cohort_member"("id") ON DELETE SET NULL
  NOT VALID;
