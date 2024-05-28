-- Drop table cause it was never used
drop table if exists public.lesson_progress;

alter table public.exercise
drop constraint exercise_lesson_id_fkey,
add constraint exercise_lesson_id_fkey foreign key (lesson_id) references lesson (id)
on delete cascade;

alter table public.lesson_comment
drop constraint lesson_comment_lesson_id_fkey,
add constraint lesson_comment_lesson_id_fkey foreign key (lesson_id) references lesson (id)
on delete cascade;

alter table public.question
drop constraint question_exercise_id_fkey,
add constraint question_exercise_id_fkey foreign key (exercise_id) references exercise (id)
on delete cascade;

alter table public.option
drop constraint option_question_id_fkey,
add constraint option_question_id_fkey foreign key (question_id) references question (id)
on delete cascade;

alter table public.question_answer
drop constraint question_answer_question_id_fkey,
add constraint question_answer_question_id_fkey foreign key (question_id) references question (id)
on delete cascade;

alter table public.submission
drop constraint submission_exercise_id_fkey,
add constraint submission_exercise_id_fkey foreign key (exercise_id) references exercise (id)
on delete cascade;

alter table public.submission
drop constraint submission_course_id_fkey,
add constraint submission_course_id_fkey foreign key (course_id) references course (id)
on delete cascade;

alter table public.question_answer
drop constraint question_answer_submission_id_fkey,
add constraint question_answer_submission_id_fkey foreign key (submission_id) references submission (id)
on delete cascade;
