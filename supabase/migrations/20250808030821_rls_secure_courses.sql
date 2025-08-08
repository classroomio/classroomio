drop policy "Enable access to all users" on "public"."course";

drop policy "User must be an course member to INSERT" on "public"."lesson_completion";

drop policy "User must be a course member to INSERT" on "public"."apps_poll";

drop policy "User must be course member to SELECT" on "public"."apps_poll";

drop policy "User must be a course member to INSERT" on "public"."apps_poll_option";

drop policy "User must be a course member to UPDATE" on "public"."apps_poll_option";

drop policy "User must be a teacher to DELETE" on "public"."apps_poll_option";

drop policy "User must be course member to SELECT" on "public"."apps_poll_option";

drop policy "User must be a course member to INSERT" on "public"."course_newsfeed";

drop policy "User must be a course member to SELECT" on "public"."course_newsfeed";

drop policy "User must be a course member to INSERT" on "public"."course_newsfeed_comment";

drop policy "User must be a course member to SELECT" on "public"."course_newsfeed_comment";

drop policy "User must be a course member to INSERT" on "public"."group_attendance";

drop policy "User must be a course member to SELECT" on "public"."group_attendance";

drop policy "User must be a course member to UPDATE" on "public"."group_attendance";

drop policy "User must be in course group to INSERT" on "public"."lesson_comment";

drop policy "User must be an course member to DELETE" on "public"."question_answer";

drop policy "User must be an course member to INSERT" on "public"."question_answer";

drop policy "User must be an course member to UPDATE" on "public"."question_answer";

drop policy "User must be a course member to DELETE" on "public"."submission";

drop policy "User must be a course member to INSERT" on "public"."submission";

drop policy "User must be a course member to UPDATE" on "public"."submission";

drop function if exists "public"."is_user_in_group_with_role"(group_id integer);

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.is_user_in_course_group_or_admin(group_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  org_id uuid;
  is_admin boolean;
  is_member boolean;
BEGIN
  SELECT organization_id INTO org_id FROM "group" WHERE id = $1 LIMIT 1;
  is_admin := is_org_admin(org_id);
  is_member := is_user_in_course_group($1);
  RETURN is_admin OR is_member;
END;
$function$
;

create policy "Enable access to all users if PUBLIC or to course members when "
on "public"."course"
as permissive
for select
to public
using ((is_published OR is_user_in_course_group_or_admin(group_id)));


create policy "User must be an course member or Admin to perform ALL operation"
on "public"."lesson_completion"
as permissive
for all
to public
with check (is_user_in_course_group_or_admin(( SELECT course.group_id
   FROM course
  WHERE (course.id = ( SELECT lesson.course_id
           FROM lesson
          WHERE (lesson.id = lesson_completion.lesson_id)
         LIMIT 1))
 LIMIT 1)));


create policy "User must be an admin to INSERT or allow if no existing member"
on "public"."organizationmember"
as permissive
for insert
to public
with check ((is_org_admin() OR (NOT (EXISTS ( SELECT 1
   FROM organizationmember organizationmember_1
  WHERE (organizationmember_1.organization_id = organizationmember_1.organization_id))))));


create policy "User must be a course member to INSERT"
on "public"."apps_poll"
as permissive
for insert
to public
with check (is_user_in_course_group_or_admin(( SELECT groupmember.group_id
   FROM groupmember
  WHERE (groupmember.id = apps_poll."authorId")
 LIMIT 1)));


create policy "User must be course member to SELECT"
on "public"."apps_poll"
as permissive
for select
to public
using (is_user_in_course_group_or_admin(( SELECT groupmember.group_id
   FROM groupmember
  WHERE (groupmember.id = apps_poll."authorId")
 LIMIT 1)));


create policy "User must be a course member to INSERT"
on "public"."apps_poll_option"
as permissive
for insert
to public
with check (is_user_in_course_group_or_admin(( SELECT groupmember.group_id
   FROM groupmember
  WHERE (groupmember.id = ( SELECT apps_poll."authorId"
           FROM apps_poll
          WHERE (apps_poll.id = apps_poll_option.poll_id)
         LIMIT 1))
 LIMIT 1)));


create policy "User must be a course member to UPDATE"
on "public"."apps_poll_option"
as permissive
for update
to public
using (is_user_in_course_group_or_admin(( SELECT groupmember.group_id
   FROM groupmember
  WHERE (groupmember.id = ( SELECT apps_poll."authorId"
           FROM apps_poll
          WHERE (apps_poll.id = apps_poll_option.poll_id)
         LIMIT 1))
 LIMIT 1)))
with check (is_user_in_course_group_or_admin(( SELECT groupmember.group_id
   FROM groupmember
  WHERE (groupmember.id = ( SELECT apps_poll."authorId"
           FROM apps_poll
          WHERE (apps_poll.id = apps_poll_option.poll_id)
         LIMIT 1))
 LIMIT 1)));


create policy "User must be a teacher to DELETE"
on "public"."apps_poll_option"
as permissive
for delete
to public
using (is_user_in_course_group_or_admin(( SELECT groupmember.group_id
   FROM groupmember
  WHERE (groupmember.id = ( SELECT apps_poll."authorId"
           FROM apps_poll
          WHERE (apps_poll.id = apps_poll_option.poll_id)
         LIMIT 1))
 LIMIT 1)));


create policy "User must be course member to SELECT"
on "public"."apps_poll_option"
as permissive
for select
to public
using (is_user_in_course_group_or_admin(( SELECT groupmember.group_id
   FROM groupmember
  WHERE (groupmember.id = ( SELECT apps_poll."authorId"
           FROM apps_poll
          WHERE (apps_poll.id = apps_poll_option.poll_id)
         LIMIT 1))
 LIMIT 1)));


create policy "User must be a course member to INSERT"
on "public"."course_newsfeed"
as permissive
for insert
to public
with check (is_user_in_course_group_or_admin(( SELECT course.group_id
   FROM course
  WHERE (course.id = course_newsfeed.course_id)
 LIMIT 1)));


create policy "User must be a course member to SELECT"
on "public"."course_newsfeed"
as permissive
for select
to public
using (is_user_in_course_group_or_admin(( SELECT course.group_id
   FROM course
  WHERE (course.id = course_newsfeed.course_id)
 LIMIT 1)));


create policy "User must be a course member to INSERT"
on "public"."course_newsfeed_comment"
as permissive
for insert
to public
with check (is_user_in_course_group_or_admin(( SELECT course.group_id
   FROM course
  WHERE (course.id = ( SELECT course_newsfeed.course_id
           FROM course_newsfeed
          WHERE (course_newsfeed.id = course_newsfeed_comment.course_newsfeed_id)))
 LIMIT 1)));


create policy "User must be a course member to SELECT"
on "public"."course_newsfeed_comment"
as permissive
for select
to public
using (is_user_in_course_group_or_admin(( SELECT course.group_id
   FROM course
  WHERE (course.id = ( SELECT course_newsfeed.course_id
           FROM course_newsfeed
          WHERE (course_newsfeed.id = course_newsfeed_comment.course_newsfeed_id)))
 LIMIT 1)));


create policy "User must be a course member to INSERT"
on "public"."group_attendance"
as permissive
for insert
to public
with check (is_user_in_course_group_or_admin(( SELECT course.group_id
   FROM course
  WHERE (course.id = group_attendance.course_id)
 LIMIT 1)));


create policy "User must be a course member to SELECT"
on "public"."group_attendance"
as permissive
for select
to public
using (is_user_in_course_group_or_admin(( SELECT course.group_id
   FROM course
  WHERE (course.id = group_attendance.course_id)
 LIMIT 1)));


create policy "User must be a course member to UPDATE"
on "public"."group_attendance"
as permissive
for update
to public
using (is_user_in_course_group_or_admin(( SELECT course.group_id
   FROM course
  WHERE (course.id = group_attendance.course_id)
 LIMIT 1)))
with check (is_user_in_course_group_or_admin(( SELECT course.group_id
   FROM course
  WHERE (course.id = group_attendance.course_id)
 LIMIT 1)));


create policy "User must be in course group to INSERT"
on "public"."lesson_comment"
as permissive
for insert
to public
with check (is_user_in_course_group_or_admin(( SELECT course.group_id
   FROM course
  WHERE (course.id = ( SELECT lesson.course_id
           FROM lesson
          WHERE (lesson.id = lesson_comment.lesson_id)
         LIMIT 1))
 LIMIT 1)));


create policy "User must be an course member to DELETE"
on "public"."question_answer"
as permissive
for delete
to public
using (is_user_in_course_group_or_admin(( SELECT course.group_id
   FROM course
  WHERE (course.id = ( SELECT lesson.course_id
           FROM lesson
          WHERE (lesson.id = ( SELECT exercise.lesson_id
                   FROM exercise
                  WHERE (exercise.id = ( SELECT question.exercise_id
                           FROM question
                          WHERE (question.id = question_answer.question_id)
                         LIMIT 1))
                 LIMIT 1))
         LIMIT 1))
 LIMIT 1)));


create policy "User must be an course member to INSERT"
on "public"."question_answer"
as permissive
for insert
to public
with check (is_user_in_course_group_or_admin(( SELECT course.group_id
   FROM course
  WHERE (course.id = ( SELECT lesson.course_id
           FROM lesson
          WHERE (lesson.id = ( SELECT exercise.lesson_id
                   FROM exercise
                  WHERE (exercise.id = ( SELECT question.exercise_id
                           FROM question
                          WHERE (question.id = question_answer.question_id)
                         LIMIT 1))
                 LIMIT 1))
         LIMIT 1))
 LIMIT 1)));


create policy "User must be an course member to UPDATE"
on "public"."question_answer"
as permissive
for update
to public
using (is_user_in_course_group_or_admin(( SELECT course.group_id
   FROM course
  WHERE (course.id = ( SELECT lesson.course_id
           FROM lesson
          WHERE (lesson.id = ( SELECT exercise.lesson_id
                   FROM exercise
                  WHERE (exercise.id = ( SELECT question.exercise_id
                           FROM question
                          WHERE (question.id = question_answer.question_id)
                         LIMIT 1))
                 LIMIT 1))
         LIMIT 1))
 LIMIT 1)))
with check (is_user_in_course_group_or_admin(( SELECT course.group_id
   FROM course
  WHERE (course.id = ( SELECT lesson.course_id
           FROM lesson
          WHERE (lesson.id = ( SELECT exercise.lesson_id
                   FROM exercise
                  WHERE (exercise.id = ( SELECT question.exercise_id
                           FROM question
                          WHERE (question.id = question_answer.question_id)
                         LIMIT 1))
                 LIMIT 1))
         LIMIT 1))
 LIMIT 1)));


create policy "User must be a course member to DELETE"
on "public"."submission"
as permissive
for delete
to public
using (is_user_in_course_group_or_admin(( SELECT course.group_id
   FROM course
  WHERE (course.id = submission.course_id)
 LIMIT 1)));


create policy "User must be a course member to INSERT"
on "public"."submission"
as permissive
for insert
to public
with check (is_user_in_course_group_or_admin(( SELECT course.group_id
   FROM course
  WHERE (course.id = submission.course_id)
 LIMIT 1)));


create policy "User must be a course member to UPDATE"
on "public"."submission"
as permissive
for update
to public
using (is_user_in_course_group_or_admin(( SELECT course.group_id
   FROM course
  WHERE (course.id = submission.course_id)
 LIMIT 1)))
with check (is_user_in_course_group_or_admin(( SELECT course.group_id
   FROM course
  WHERE (course.id = submission.course_id)
 LIMIT 1)));
