CREATE INDEX IF NOT EXISTS "idx_submission_exercise_id_submitted_by" ON "submission" ("exercise_id", "submitted_by");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_question_exercise_id" ON "question" ("exercise_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_question_answer_submission_id" ON "question_answer" ("submission_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_lesson_completion_profile_id_lesson_id" ON "lesson_completion" ("profile_id", "lesson_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_groupmember_profile_id" ON "groupmember" ("profile_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_group_attendance_course_id_lesson_id" ON "group_attendance" ("course_id", "lesson_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_group_attendance_student_id" ON "group_attendance" ("student_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_exercise_section_id" ON "exercise" ("section_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_lesson_section_id" ON "lesson" ("section_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_course_section_course_id" ON "course_section" ("course_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_cohort_course_course_id" ON "cohort_course" ("course_id");
