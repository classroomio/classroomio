drop policy "Enable insert for authenticated users only" on "public"."course";

drop policy "Enable update for authenticated users only" on "public"."course";

drop policy "Enable insert for authenticated users only" on "public"."lesson_comment";

alter table "public"."apps_poll" enable row level security;

alter table "public"."apps_poll_option" enable row level security;

alter table "public"."apps_poll_submission" enable row level security;

alter table "public"."community_answer" enable row level security;

alter table "public"."community_question" enable row level security;

alter table "public"."course" enable row level security;

alter table "public"."course_newsfeed" enable row level security;

alter table "public"."course_newsfeed_comment" enable row level security;

alter table "public"."exercise" enable row level security;

alter table "public"."group" enable row level security;

alter table "public"."group_attendance" enable row level security;

alter table "public"."groupmember" enable row level security;

alter table "public"."lesson" enable row level security;

alter table "public"."lesson_completion" enable row level security;

alter table "public"."lesson_language" enable row level security;

alter table "public"."lesson_language_history" enable row level security;

alter table "public"."option" enable row level security;

alter table "public"."organization" enable row level security;

alter table "public"."organization_plan" enable row level security;

alter table "public"."organizationmember" enable row level security;

alter table "public"."question" enable row level security;

alter table "public"."question_answer" enable row level security;

alter table "public"."question_type" enable row level security;

alter table "public"."quiz" enable row level security;

alter table "public"."quiz_play" enable row level security;

alter table "public"."role" enable row level security;

alter table "public"."submission" enable row level security;

alter table "public"."submissionstatus" enable row level security;

alter table "public"."test_tenant" enable row level security;

alter table "public"."waitinglist" enable row level security;

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.is_org_admin()
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM organizationmember
        WHERE organization_id = organization_id
        AND profile_id = (select auth.uid())
        AND role_id = 1
    );
END;
$function$
;

CREATE OR REPLACE FUNCTION public.is_org_admin(org_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
AS $function$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM organizationmember
        WHERE organization_id = org_id
        AND profile_id = (select auth.uid())
        AND role_id = 1
    );
END;
$function$
;

CREATE OR REPLACE FUNCTION public.is_org_member()
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM organizationmember
        WHERE organization_id = organization_id
        AND profile_id = (select auth.uid())
    );
END;
$function$
;

CREATE OR REPLACE FUNCTION public.is_user_in_course_group(group_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$ begin return exists 
(SELECT 1 FROM groupmember member
JOIN "group" g ON g.id = member.group_id
WHERE member.role_id IS NOT NULL
AND member.profile_id = auth.uid()
AND g.id = $1
);
END;
$function$
;

CREATE OR REPLACE FUNCTION public.can_user_make_changes_to_course(course_id_arg uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM organizationmember m
    JOIN organization o ON o.id = m.organization_id
    JOIN "group" g ON g.organization_id = o.id
    JOIN course c ON c.id = g.course_id
    WHERE m.profile_id = auth.uid()
    AND c.id = course_id_arg
  );
END;
$function$;


CREATE OR REPLACE FUNCTION public.is_user_authorized_to_create_course()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM organizationmember m
    JOIN "group" g ON g.organization_id = m.organization_id
WHERE m.profile_id = auth.uid()
  );
END;
$function$;


CREATE OR REPLACE FUNCTION public.is_user_in_group_with_role(group_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
begin
  return exists (
    SELECT 1
    FROM organizationmember member
    JOIN organization o ON o.id = member.organization_id
    WHERE member.role_id IS NOT NULL
    AND member.profile_id = auth.uid ()
      AND EXISTS (
        SELECT 1
        FROM "group" g
        WHERE g.id = $1
          AND g.organization_id = o.id
      )
  );
END;
$function$
;

create policy "Delete only your own poll"
on "public"."apps_poll"
as permissive
for delete
to public
using ((auth.uid() = ( SELECT groupmember.profile_id
   FROM groupmember
  WHERE (groupmember.id = apps_poll."authorId"))));


create policy "Update only your own"
on "public"."apps_poll"
as permissive
for update
to public
using ((auth.uid() = ( SELECT groupmember.profile_id
   FROM groupmember
  WHERE (groupmember.id = apps_poll."authorId"))))
with check ((auth.uid() = ( SELECT groupmember.profile_id
   FROM groupmember
  WHERE (groupmember.id = apps_poll."authorId"))));


create policy "User must be a course member to INSERT"
on "public"."apps_poll"
as permissive
for insert
to public
with check (is_user_in_course_group(( SELECT groupmember.group_id
   FROM groupmember
  WHERE (groupmember.id = apps_poll."authorId")
 LIMIT 1)));


create policy "User must be course member to SELECT"
on "public"."apps_poll"
as permissive
for select
to public
using (is_user_in_course_group(( SELECT groupmember.group_id
   FROM groupmember
  WHERE (groupmember.id = apps_poll."authorId")
 LIMIT 1)));


create policy "User must be a course member to INSERT"
on "public"."apps_poll_option"
as permissive
for insert
to public
with check (is_user_in_course_group(( SELECT groupmember.group_id
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
using (is_user_in_course_group(( SELECT groupmember.group_id
   FROM groupmember
  WHERE (groupmember.id = ( SELECT apps_poll."authorId"
           FROM apps_poll
          WHERE (apps_poll.id = apps_poll_option.poll_id)
         LIMIT 1))
 LIMIT 1)))
with check (is_user_in_course_group(( SELECT groupmember.group_id
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
using (is_user_in_group_with_role(( SELECT groupmember.group_id
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
using (is_user_in_course_group(( SELECT groupmember.group_id
   FROM groupmember
  WHERE (groupmember.id = ( SELECT apps_poll."authorId"
           FROM apps_poll
          WHERE (apps_poll.id = apps_poll_option.poll_id)
         LIMIT 1))
 LIMIT 1)));


create policy "Authenticated users can read"
on "public"."apps_poll_submission"
as permissive
for select
to public
using ((auth.uid() IS NOT NULL));


create policy "Delete your own submission"
on "public"."apps_poll_submission"
as permissive
for delete
to public
using ((auth.uid() = ( SELECT groupmember.profile_id
   FROM groupmember
  WHERE (groupmember.id = apps_poll_submission.selected_by_id))));


create policy "Enable insert for authenticated users only"
on "public"."apps_poll_submission"
as permissive
for insert
to authenticated
with check (true);


create policy "Update your own submission"
on "public"."apps_poll_submission"
as permissive
for update
to public
using ((auth.uid() = ( SELECT groupmember.profile_id
   FROM groupmember
  WHERE (groupmember.id = apps_poll_submission.selected_by_id))))
with check ((auth.uid() = ( SELECT groupmember.profile_id
   FROM groupmember
  WHERE (groupmember.id = apps_poll_submission.selected_by_id))));


create policy "Authenticated users can SELECT"
on "public"."community_answer"
as permissive
for select
to public
using ((auth.uid() IS NOT NULL));


create policy "Delete your own answer"
on "public"."community_answer"
as permissive
for delete
to public
using ((auth.uid() = author_profile_id));


create policy "Enable insert for authenticated users only"
on "public"."community_answer"
as permissive
for insert
to authenticated
with check (true);


create policy "Update your own answer"
on "public"."community_answer"
as permissive
for update
to public
using ((auth.uid() = author_profile_id))
with check ((auth.uid() = author_profile_id));


create policy "Authenticated users can SELECT"
on "public"."community_question"
as permissive
for select
to public
using ((auth.uid() IS NOT NULL));


create policy "Delete your own question"
on "public"."community_question"
as permissive
for delete
to public
using ((auth.uid() = author_profile_id));


create policy "Update your own question"
on "public"."community_question"
as permissive
for update
to public
using ((auth.uid() = author_profile_id))
with check ((auth.uid() = author_profile_id));


create policy "User must be an org member to DELETE"
on "public"."course"
as permissive
for delete
to public
using (can_user_make_changes_to_course(id));

create policy "User must be an org member to INSERT"
on "public"."course"
as permissive
for insert
to public
with check (is_user_authorized_to_create_course());

create policy "User must be an org member to UPDATE"
on "public"."course"
as permissive
for update
to public
using (can_user_make_changes_to_course(id))
with check (can_user_make_changes_to_course(id));


create policy "Delete your own comment"
on "public"."course_newsfeed"
as permissive
for delete
to public
using ((auth.uid() = ( SELECT groupmember.profile_id
   FROM groupmember
  WHERE (groupmember.id = course_newsfeed.author_id))));


create policy "Update only your own"
on "public"."course_newsfeed"
as permissive
for update
to public
using ((auth.uid() = ( SELECT groupmember.profile_id
   FROM groupmember
  WHERE (groupmember.id = course_newsfeed.author_id))))
with check ((auth.uid() = ( SELECT groupmember.profile_id
   FROM groupmember
  WHERE (groupmember.id = course_newsfeed.author_id))));


 create policy "User must be a course member to INSERT"
on "public"."course_newsfeed"
as permissive
for insert
to public
with check (is_user_in_course_group((SELECT "group".id
   FROM "group"
  WHERE ("group".course_id = course_newsfeed.course_id)
 LIMIT 1))); 


create policy "User must be a course member to SELECT"
on "public"."course_newsfeed"
as permissive
for select
to public
using (is_user_in_course_group(( SELECT "group".id
   FROM "group"
  WHERE ("group".course_id = course_newsfeed.course_id)
 LIMIT 1)));


create policy "Delete your own"
on "public"."course_newsfeed_comment"
as permissive
for delete
to public
using ((auth.uid() = ( SELECT groupmember.profile_id
   FROM groupmember
  WHERE (groupmember.id = course_newsfeed_comment.author_id))));


create policy "Update only your own"
on "public"."course_newsfeed_comment"
as permissive
for update
to public
using ((auth.uid() = ( SELECT groupmember.profile_id
   FROM groupmember
  WHERE (groupmember.id = course_newsfeed_comment.author_id))))
with check ((auth.uid() = ( SELECT groupmember.profile_id
   FROM groupmember
  WHERE (groupmember.id = course_newsfeed_comment.author_id))));


create policy "User must be a course member to INSERT"
on "public"."course_newsfeed_comment"
as permissive
for insert
to public
with check (is_user_in_course_group(( SELECT "group".id
   FROM "group"
  WHERE ("group".course_id = ( SELECT course_newsfeed.course_id
           FROM course_newsfeed
          WHERE (course_newsfeed.id = course_newsfeed_comment.course_newsfeed_id)))
 LIMIT 1)));


create policy "User must be a course member to SELECT"
on "public"."course_newsfeed_comment"
as permissive
for select
to public
using (is_user_in_course_group(( SELECT "group".id
   FROM "group"
  WHERE ("group".course_id = ( SELECT course_newsfeed.course_id
           FROM course_newsfeed
          WHERE (course_newsfeed.id = course_newsfeed_comment.course_newsfeed_id)))
 LIMIT 1)));


create policy "Enable read access for all users"
on "public"."exercise"
as permissive
for select
to public
using (true);


create policy "User must be an org member to DELETE"
on "public"."exercise"
as permissive
for delete
to public
using (is_user_in_group_with_role(( SELECT "group".id
   FROM "group"
  WHERE ("group".course_id = ( SELECT lesson.course_id
           FROM lesson
          WHERE (lesson.id = exercise.lesson_id)
         LIMIT 1))
 LIMIT 1)));


create policy "User must be an org member to INSERT"
on "public"."exercise"
as permissive
for insert
to public
with check (is_user_in_group_with_role(( SELECT "group".id
   FROM "group"
  WHERE ("group".course_id = ( SELECT lesson.course_id
           FROM lesson
          WHERE (lesson.id = exercise.lesson_id)
         LIMIT 1))
 LIMIT 1)));


create policy "User must be an org member to UPDATE"
on "public"."exercise"
as permissive
for update
to public
using (is_user_in_group_with_role(( SELECT "group".id
   FROM "group"
  WHERE ("group".course_id = ( SELECT lesson.course_id
           FROM lesson
          WHERE (lesson.id = exercise.lesson_id)
         LIMIT 1))
 LIMIT 1)))
with check (is_user_in_group_with_role(( SELECT "group".id
   FROM "group"
  WHERE ("group".course_id = ( SELECT lesson.course_id
           FROM lesson
          WHERE (lesson.id = exercise.lesson_id)
         LIMIT 1))
 LIMIT 1)));


create policy "Enable insert for authenticated users only"
on "public"."group"
as permissive
for insert
to authenticated
with check (true);


create policy "Enable read access for all users"
on "public"."group"
as permissive
for select
to public
using (true);


create policy "Only org admins can delete"
on "public"."group"
as permissive
for delete
to public
using (is_org_admin());


create policy "Only org admins can update"
on "public"."group"
as permissive
for update
to public
using (is_org_admin())
with check (is_org_admin());


create policy "User must be a course member to INSERT"
on "public"."group_attendance"
as permissive
for insert
to public
with check (is_user_in_course_group(( SELECT "group".id
   FROM "group"
  WHERE ("group".course_id = group_attendance.course_id)
 LIMIT 1)));


create policy "User must be a course member to SELECT"
on "public"."group_attendance"
as permissive
for select
to public
using (is_user_in_course_group(( SELECT "group".id
   FROM "group"
  WHERE ("group".course_id = group_attendance.course_id)
 LIMIT 1)));


create policy "User must be a course member to UPDATE"
on "public"."group_attendance"
as permissive
for update
to public
using (is_user_in_course_group(( SELECT "group".id
   FROM "group"
  WHERE ("group".course_id = group_attendance.course_id)
 LIMIT 1)))
with check (is_user_in_course_group(( SELECT "group".id
   FROM "group"
  WHERE ("group".course_id = group_attendance.course_id)
 LIMIT 1)));


create policy "User must be an org member to DELETE"
on "public"."group_attendance"
as permissive
for delete
to public
using (is_user_in_group_with_role(( SELECT "group".id
   FROM "group"
  WHERE ("group".course_id = group_attendance.course_id)
 LIMIT 1)));


create policy "Enable insert for authenticated users only"
on "public"."groupmember"
as permissive
for insert
to authenticated
with check (true);


create policy "Enable read access for all users"
on "public"."groupmember"
as permissive
for select
to public
using (true);


create policy "User must be an org member to DELETE"
on "public"."groupmember"
as permissive
for delete
to public
using (is_user_in_group_with_role(group_id));


create policy "User must be an org member to UPDATE"
on "public"."groupmember"
as permissive
for update
to public
using (is_user_in_group_with_role(group_id))
with check (is_user_in_group_with_role(group_id));


create policy "Enable read access for all users"
on "public"."lesson"
as permissive
for select
to public
using (true);


create policy "User must be an org member to DELETE"
on "public"."lesson"
as permissive
for delete
to public
using (is_user_in_group_with_role(( SELECT "group".id
   FROM "group"
  WHERE ("group".course_id = lesson.course_id)
 LIMIT 1)));


create policy "User must be an org member to INSERT"
on "public"."lesson"
as permissive
for insert
to public
with check (is_user_in_group_with_role(( SELECT "group".id
   FROM "group"
  WHERE ("group".course_id = lesson.course_id)
 LIMIT 1)));


create policy "User must be an org member to UPDATE"
on "public"."lesson"
as permissive
for update
to public
using (is_user_in_group_with_role(( SELECT "group".id
   FROM "group"
  WHERE ("group".course_id = lesson.course_id)
 LIMIT 1)))
with check (is_user_in_group_with_role(( SELECT "group".id
   FROM "group"
  WHERE ("group".course_id = lesson.course_id)
 LIMIT 1)));


create policy "Delete only your own comment"
on "public"."lesson_comment"
as permissive
for delete
to public
using ((auth.uid() = ( SELECT groupmember.profile_id
   FROM groupmember
  WHERE (groupmember.id = lesson_comment.groupmember_id))));


create policy "Update only your own"
on "public"."lesson_comment"
as permissive
for update
to public
using ((auth.uid() = ( SELECT groupmember.profile_id
   FROM groupmember
  WHERE (groupmember.id = lesson_comment.groupmember_id))))
with check ((auth.uid() = ( SELECT groupmember.profile_id
   FROM groupmember
  WHERE (groupmember.id = lesson_comment.groupmember_id))));


create policy "User must be in course group to INSERT"
on "public"."lesson_comment"
as permissive
for insert
to public
with check (is_user_in_course_group(( SELECT "group".id
   FROM "group"
  WHERE ("group".course_id = ( SELECT lesson.course_id
           FROM lesson
          WHERE (lesson.id = lesson_comment.lesson_id)
         LIMIT 1))
 LIMIT 1)));


create policy "Enable read access for all users"
on "public"."lesson_completion"
as permissive
for select
to public
using (true);


create policy "User must be an course member to INSERT"
on "public"."lesson_completion"
as permissive
for all
to public
with check (is_user_in_course_group(( SELECT "group".id
   FROM "group"
  WHERE ("group".course_id = ( SELECT lesson.course_id
           FROM lesson
          WHERE (lesson.id = lesson_completion.lesson_id)
         LIMIT 1))
 LIMIT 1)));


create policy "User must be an org member to DELETE"
on "public"."lesson_completion"
as permissive
for delete
to public
using (is_user_in_group_with_role(( SELECT "group".id
   FROM "group"
  WHERE ("group".course_id = ( SELECT lesson.course_id
           FROM lesson
          WHERE (lesson.id = lesson_completion.lesson_id)
         LIMIT 1))
 LIMIT 1)));


create policy "User must be an org member to UPDATE"
on "public"."lesson_completion"
as permissive
for update
to public
using (is_user_in_group_with_role(( SELECT "group".id
   FROM "group"
  WHERE ("group".course_id = ( SELECT lesson.course_id
           FROM lesson
          WHERE (lesson.id = lesson_completion.lesson_id)
         LIMIT 1))
 LIMIT 1)))
with check (is_user_in_group_with_role(( SELECT "group".id
   FROM "group"
  WHERE ("group".course_id = ( SELECT lesson.course_id
           FROM lesson
          WHERE (lesson.id = lesson_completion.lesson_id)
         LIMIT 1))
 LIMIT 1)));


create policy "Enable read access for all users"
on "public"."lesson_language"
as permissive
for select
to public
using (true);


create policy "User must be an org member to DELETE"
on "public"."lesson_language"
as permissive
for delete
to public
using (is_user_in_group_with_role(( SELECT "group".id
   FROM "group"
  WHERE ("group".course_id = ( SELECT lesson.course_id
           FROM lesson
          WHERE (lesson.id = lesson_language.lesson_id)
         LIMIT 1))
 LIMIT 1)));


create policy "User must be an org member to INSERT"
on "public"."lesson_language"
as permissive
for insert
to public
with check (is_user_in_group_with_role(( SELECT "group".id
   FROM "group"
  WHERE ("group".course_id = ( SELECT lesson.course_id
           FROM lesson
          WHERE (lesson.id = lesson_language.lesson_id)
         LIMIT 1))
 LIMIT 1)));


create policy "User must be an org member to UPDATE"
on "public"."lesson_language"
as permissive
for update
to public
using (is_user_in_group_with_role(( SELECT "group".id
   FROM "group"
  WHERE ("group".course_id = ( SELECT lesson.course_id
           FROM lesson
          WHERE (lesson.id = lesson_language.lesson_id)
         LIMIT 1))
 LIMIT 1)))
with check (is_user_in_group_with_role(( SELECT "group".id
   FROM "group"
  WHERE ("group".course_id = ( SELECT lesson.course_id
           FROM lesson
          WHERE (lesson.id = lesson_language.lesson_id)
         LIMIT 1))
 LIMIT 1)));


create policy "Authenticated users can SELECT"
on "public"."lesson_language_history"
as permissive
for select
to public
using ((auth.uid() IS NOT NULL));


create policy "Allow authenticated users to SELECT"
on "public"."option"
as permissive
for select
to public
using ((auth.uid() IS NOT NULL));


create policy "User must be an org member to DELETE"
on "public"."option"
as permissive
for delete
to public
using (is_user_in_group_with_role(( SELECT "group".id
   FROM "group"
  WHERE ("group".course_id = ( SELECT lesson.course_id
           FROM lesson
          WHERE (lesson.id = ( SELECT exercise.lesson_id
                   FROM exercise
                  WHERE (exercise.id = ( SELECT question.exercise_id
                           FROM question
                          WHERE (question.id = option.question_id)
                         LIMIT 1))
                 LIMIT 1))
         LIMIT 1))
 LIMIT 1)));


create policy "User must be an org member to INSERT"
on "public"."option"
as permissive
for insert
to public
with check (is_user_in_group_with_role(( SELECT "group".id
   FROM "group"
  WHERE ("group".course_id = ( SELECT lesson.course_id
           FROM lesson
          WHERE (lesson.id = ( SELECT exercise.lesson_id
                   FROM exercise
                  WHERE (exercise.id = ( SELECT question.exercise_id
                           FROM question
                          WHERE (question.id = option.question_id)
                         LIMIT 1))
                 LIMIT 1))
         LIMIT 1))
 LIMIT 1)));


create policy "User must be an org member to UPDATE"
on "public"."option"
as permissive
for update
to public
using (is_user_in_group_with_role(( SELECT "group".id
   FROM "group"
  WHERE ("group".course_id = ( SELECT lesson.course_id
           FROM lesson
          WHERE (lesson.id = ( SELECT exercise.lesson_id
                   FROM exercise
                  WHERE (exercise.id = ( SELECT question.exercise_id
                           FROM question
                          WHERE (question.id = option.question_id)
                         LIMIT 1))
                 LIMIT 1))
         LIMIT 1))
 LIMIT 1)))
with check (is_user_in_group_with_role(( SELECT "group".id
   FROM "group"
  WHERE ("group".course_id = ( SELECT lesson.course_id
           FROM lesson
          WHERE (lesson.id = ( SELECT exercise.lesson_id
                   FROM exercise
                  WHERE (exercise.id = ( SELECT question.exercise_id
                           FROM question
                          WHERE (question.id = option.question_id)
                         LIMIT 1))
                 LIMIT 1))
         LIMIT 1))
 LIMIT 1)));


create policy "Authenticated users can delete"
on "public"."organization"
as permissive
for delete
to public
using ((auth.uid() IS NOT NULL));


create policy "Enable read access for all users"
on "public"."organization"
as permissive
for select
to public
using (true);


create policy "User must be an admin to INSERT"
on "public"."organization"
as permissive
for insert
to public
with check ((id = ( SELECT organizationmember.organization_id
   FROM organizationmember
  WHERE ((organizationmember.profile_id = ( SELECT auth.uid() AS uid)) AND (organizationmember.role_id = 1))
 LIMIT 1)));


create policy "User must be an admin to UPDATE"
on "public"."organization"
as permissive
for update
to public
using ((id = ( SELECT organizationmember.organization_id
   FROM organizationmember
  WHERE ((organizationmember.profile_id = ( SELECT auth.uid() AS uid)) AND (organizationmember.role_id = 1))
 LIMIT 1)))
with check ((id = ( SELECT organizationmember.organization_id
   FROM organizationmember
  WHERE ((organizationmember.profile_id = ( SELECT auth.uid() AS uid)) AND (organizationmember.role_id = 1))
 LIMIT 1)));


create policy "User must be an org member to DELETE"
on "public"."organization_plan"
as permissive
for delete
to public
using (is_org_member());


create policy "User must be an org member to INSERT"
on "public"."organization_plan"
as permissive
for insert
to public
with check (is_org_member());


create policy "User must be an org member to SELECT"
on "public"."organization_plan"
as permissive
for select
to public
using (is_org_member());


create policy "User must be an org member to UPDATE"
on "public"."organization_plan"
as permissive
for update
to public
using (is_org_member())
with check (is_org_member());


create policy "Allow authenticated users to read."
on "public"."organizationmember"
as permissive
for select
to public
using ((auth.uid() = profile_id));


create policy "Enable insert for authenticated users only"
on "public"."organizationmember"
as permissive
for insert
to authenticated
with check (true);


create policy "Only admin can delete"
on "public"."organizationmember"
as permissive
for delete
to public
using (is_org_admin());


create policy "Only admin can update"
on "public"."organizationmember"
as permissive
for update
to public
using (is_org_admin())
with check (is_org_admin());


create policy "Only auth users can read profile"
on "public"."profile"
as permissive
for select
to authenticated, anon
using (true);


create policy "User can only delete their profiles"
on "public"."profile"
as permissive
for delete
to public
using ((auth.uid() = id));


create policy "Allow authenticated users to SELECT"
on "public"."question"
as permissive
for select
to public
using ((auth.uid() IS NOT NULL));


create policy "User must be an org member to DELETE"
on "public"."question"
as permissive
for delete
to public
using (is_user_in_group_with_role(( SELECT "group".id
   FROM "group"
  WHERE ("group".course_id = ( SELECT lesson.course_id
           FROM lesson
          WHERE (lesson.id = ( SELECT exercise.lesson_id
                   FROM exercise
                  WHERE (exercise.id = question.exercise_id)))
         LIMIT 1))
 LIMIT 1)));


create policy "User must be an org member to INSERT"
on "public"."question"
as permissive
for insert
to public
with check (is_user_in_group_with_role(( SELECT "group".id
   FROM "group"
  WHERE ("group".course_id = ( SELECT lesson.course_id
           FROM lesson
          WHERE (lesson.id = ( SELECT exercise.lesson_id
                   FROM exercise
                  WHERE (exercise.id = question.exercise_id)))
         LIMIT 1))
 LIMIT 1)));


create policy "User must be an org member to UPDATE"
on "public"."question"
as permissive
for update
to public
using (is_user_in_group_with_role(( SELECT "group".id
   FROM "group"
  WHERE ("group".course_id = ( SELECT lesson.course_id
           FROM lesson
          WHERE (lesson.id = ( SELECT exercise.lesson_id
                   FROM exercise
                  WHERE (exercise.id = question.exercise_id)))
         LIMIT 1))
 LIMIT 1)))
with check (is_user_in_group_with_role(( SELECT "group".id
   FROM "group"
  WHERE ("group".course_id = ( SELECT lesson.course_id
           FROM lesson
          WHERE (lesson.id = ( SELECT exercise.lesson_id
                   FROM exercise
                  WHERE (exercise.id = question.exercise_id)))
         LIMIT 1))
 LIMIT 1)));


create policy "Only authenticated users can select."
on "public"."question_answer"
as permissive
for select
to public
using ((auth.uid() IS NOT NULL));


create policy "User must be an org member to DELETE"
on "public"."question_answer"
as permissive
for delete
to public
using (is_user_in_group_with_role(( SELECT "group".id
   FROM "group"
  WHERE ("group".course_id = ( SELECT lesson.course_id
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


create policy "User must be an org member to INSERT"
on "public"."question_answer"
as permissive
for insert
to public
with check (is_user_in_group_with_role(( SELECT "group".id
   FROM "group"
  WHERE ("group".course_id = ( SELECT lesson.course_id
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


create policy "User must be an org member to UPDATE"
on "public"."question_answer"
as permissive
for update
to public
using (is_user_in_group_with_role(( SELECT "group".id
   FROM "group"
  WHERE ("group".course_id = ( SELECT lesson.course_id
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
with check (is_user_in_group_with_role(( SELECT "group".id
   FROM "group"
  WHERE ("group".course_id = ( SELECT lesson.course_id
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


create policy "Enable read access for all users"
on "public"."question_type"
as permissive
for select
to public
using (true);


create policy "Authenticated users can SELECT"
on "public"."quiz"
as permissive
for select
to authenticated
using (true);


create policy "Authenticated users can SELECT"
on "public"."quiz_play"
as permissive
for select
to authenticated
using (true);


create policy "Enable read access for all users"
on "public"."role"
as permissive
for select
to public
using (true);


create policy "Only authenticated users can SELECT"
on "public"."submission"
as permissive
for select
to authenticated
using (true);


create policy "User must be a course member to DELETE"
on "public"."submission"
as permissive
for delete
to public
using (is_user_in_course_group(( SELECT "group".id
   FROM "group"
  WHERE ("group".course_id = submission.course_id)
 LIMIT 1)));


create policy "User must be a course member to INSERT"
on "public"."submission"
as permissive
for insert
to public
with check (is_user_in_course_group(( SELECT "group".id
   FROM "group"
  WHERE ("group".course_id = submission.course_id)
 LIMIT 1)));


create policy "User must be a course member to UPDATE"
on "public"."submission"
as permissive
for update
to public
using (is_user_in_course_group(( SELECT "group".id
   FROM "group"
  WHERE ("group".course_id = submission.course_id)
 LIMIT 1)))
with check (is_user_in_course_group(( SELECT "group".id
   FROM "group"
  WHERE ("group".course_id = submission.course_id)
 LIMIT 1)));


create policy "Authenticated users can SELECT"
on "public"."submissionstatus"
as permissive
for select
to authenticated
using (true);

alter table "public"."course" alter column "currency" set default 'USD'::character varying;