set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.get_course_progress(course_id_arg uuid, profile_id_arg uuid)
 RETURNS TABLE(lessons_count bigint, lessons_completed bigint, exercises_count bigint, exercises_completed bigint)
 LANGUAGE plpgsql
AS $function$
BEGIN
RETURN QUERY
select
  count(distinct lesson.id) as lessons_count,
  count(distinct lesson_completion.id) as lessons_completed,
  count(distinct exercise.id) as exercises_count,
  count(distinct submission.id) as exercises_completed
from
  course
  join "group" on "group".id = course.group_id
  join groupmember on groupmember.group_id = course.group_id
  join profile on profile.id = groupmember.profile_id
  left join lesson on lesson.course_id = course.id
  left join lesson_completion on lesson_completion.lesson_id = lesson.id
  and lesson_completion.is_complete = true
  and lesson_completion.profile_id = profile.id
  left join exercise on exercise.lesson_id = lesson.id
  left join submission on submission.exercise_id = exercise.id
  and submission.submitted_by = groupmember.id
where
  course.id = course_id_arg
  and profile.id = profile_id_arg;
END;
$function$
;

ALTER TABLE public.lesson_completion
ADD CONSTRAINT unique_lesson_profile UNIQUE (lesson_id, profile_id);
