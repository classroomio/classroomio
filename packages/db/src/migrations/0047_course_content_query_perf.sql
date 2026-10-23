--> Course content query performance (2,000 concurrent learners readiness, task 1).
--> `getCourseContentItems` was ~79% of all database time: an un-indexed `course_id`
--> on course_section/exercise, an OR-across-a-left-join on exercise that defeats
--> indexing on both sides, and a correlated completion subquery per row.
--> See `packages/db/src/queries/course/content.ts`.

--> `drizzle-kit migrate` runs inside a transaction, so CONCURRENTLY is not
--> available here (same constraint as 0017_learner_lifecycle.sql). These tables
--> are already large in production, so build each index out of band with
--> `CREATE INDEX CONCURRENTLY` before deploying; the statements below are
--> `IF NOT EXISTS` and become no-ops once that's done.
CREATE INDEX IF NOT EXISTS "idx_course_section_course_id" ON "course_section" USING btree ("course_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_exercise_lesson_id" ON "exercise" USING btree ("lesson_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_question_exercise_id" ON "question" USING btree ("exercise_id");--> statement-breakpoint
--> The existing `idx_submission_submitted_by_exercise_id` is `(submitted_by, exercise_id)`,
--> which doesn't serve a lookup by `exercise_id` alone.
CREATE INDEX IF NOT EXISTS "idx_submission_exercise_id_submitted_by" ON "submission" USING btree ("exercise_id","submitted_by");--> statement-breakpoint

--> One-off: `exercise.lesson_id` is deprecated (exercises no longer belong to a
--> lesson), but older rows may still only carry it. Backfilling `course_id` lets
--> most exercises resolve through the fast, indexed path in content.ts; the
--> slower lesson-join path stays as a fallback for whatever this doesn't cover.
UPDATE "exercise"
SET "course_id" = "lesson"."course_id"
FROM "lesson"
WHERE "exercise"."course_id" IS NULL
  AND "exercise"."lesson_id" = "lesson"."id";
