set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.check_if_student_completed_exercises(lesson_id_arg uuid, groupmember_id_arg uuid)
 RETURNS boolean
 LANGUAGE plpgsql
AS $function$
DECLARE
    all_exercises_exist boolean;
BEGIN
    SELECT COUNT(*) = COUNT(s.id) INTO all_exercises_exist
    FROM exercise e
    LEFT JOIN submission s ON e.id = s.exercise_id AND s.submitted_by = groupmember_id_arg
    WHERE e.lesson_id = lesson_id_arg;

    RETURN all_exercises_exist;
END;
$function$
;