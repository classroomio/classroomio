--> Let a learner be removed from an organization without destroying their work.
--> Removing a member hard-deletes their `groupmember` rows, and three tables
--> referenced those rows with ON DELETE NO ACTION, so the delete raised a
--> foreign key violation and rolled the whole batch back. In practice that
--> meant bulk delete failed for every learner who had ever submitted an
--> exercise, answered a question, or commented on a lesson.

--> SET NULL rather than CASCADE: the submission, answer and comment are the
--> learner's work and stay as evidence of what happened in the course. Only
--> the link back to the deleted membership goes. All three columns are already
--> nullable, so no data change is needed.

--> NOT VALID on each re-add so the constraint does not scan the whole table
--> while holding a lock. Existing rows already satisfy it: they were valid
--> under the stricter NO ACTION rule, and SET NULL only widens what is
--> allowed. Run the VALIDATE statements at the bottom out of band if a later
--> audit wants them marked validated.

ALTER TABLE "submission" DROP CONSTRAINT IF EXISTS "submission_submitted_by_fkey";
ALTER TABLE "submission"
  ADD CONSTRAINT "submission_submitted_by_fkey"
  FOREIGN KEY ("submitted_by") REFERENCES "groupmember"("id") ON DELETE SET NULL
  NOT VALID;

ALTER TABLE "question_answer" DROP CONSTRAINT IF EXISTS "question_answer_group_member_id_fkey";
ALTER TABLE "question_answer"
  ADD CONSTRAINT "question_answer_group_member_id_fkey"
  FOREIGN KEY ("group_member_id") REFERENCES "groupmember"("id") ON DELETE SET NULL
  NOT VALID;

ALTER TABLE "lesson_comment" DROP CONSTRAINT IF EXISTS "lesson_comment_groupmember_id_fkey";
ALTER TABLE "lesson_comment"
  ADD CONSTRAINT "lesson_comment_groupmember_id_fkey"
  FOREIGN KEY ("groupmember_id") REFERENCES "groupmember"("id") ON DELETE SET NULL
  NOT VALID;

--> Deliberately unchanged: `course_completion_record.group_member_id` stays
--> ON DELETE CASCADE. A completion record describes a membership that no
--> longer exists, so keeping it detached would assert a completion nobody can
--> be matched to. The help docs say so explicitly.

--> Out of band, after deploy:
--> ALTER TABLE "submission" VALIDATE CONSTRAINT "submission_submitted_by_fkey";
--> ALTER TABLE "question_answer" VALIDATE CONSTRAINT "question_answer_group_member_id_fkey";
--> ALTER TABLE "lesson_comment" VALIDATE CONSTRAINT "lesson_comment_groupmember_id_fkey";
