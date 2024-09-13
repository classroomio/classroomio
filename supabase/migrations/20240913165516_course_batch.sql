drop policy "Enable read access for all users" on "public"."organization_plan";

drop policy "User must be an course member to DELETE" on "public"."question_answer";

drop policy "User must be an course member to INSERT" on "public"."question_answer";

drop policy "User must be an course member to UPDATE" on "public"."question_answer";

drop policy "User must be an org member to DELETE" on "public"."course";

drop policy "User must be an org member to INSERT" on "public"."course";

drop policy "User must be an org member to UPDATE" on "public"."course";

drop policy "User must be a course member to INSERT" on "public"."course_newsfeed";

drop policy "User must be a course member to SELECT" on "public"."course_newsfeed";

drop policy "User must be a course member to INSERT" on "public"."course_newsfeed_comment";

drop policy "User must be a course member to SELECT" on "public"."course_newsfeed_comment";

drop policy "User must be an org member to DELETE" on "public"."exercise";

drop policy "User must be an org member to INSERT" on "public"."exercise";

drop policy "User must be an org member to UPDATE" on "public"."exercise";

drop policy "User must be a course member to INSERT" on "public"."group_attendance";

drop policy "User must be a course member to SELECT" on "public"."group_attendance";

drop policy "User must be a course member to UPDATE" on "public"."group_attendance";

drop policy "User must be an org member to DELETE" on "public"."group_attendance";

drop policy "User must be an org member to DELETE" on "public"."lesson";

drop policy "User must be an org member to INSERT" on "public"."lesson";

drop policy "User must be an org member to UPDATE" on "public"."lesson";

drop policy "User must be in course group to INSERT" on "public"."lesson_comment";

drop policy "User must be an course member to INSERT" on "public"."lesson_completion";

drop policy "User must be an org member to DELETE" on "public"."lesson_completion";

drop policy "User must be an org member to UPDATE" on "public"."lesson_completion";

drop policy "User must be an org member to DELETE" on "public"."lesson_language";

drop policy "User must be an org member to INSERT" on "public"."lesson_language";

drop policy "User must be an org member to UPDATE" on "public"."lesson_language";

drop policy "User must be an org member to DELETE" on "public"."option";

drop policy "User must be an org member to INSERT" on "public"."option";

drop policy "User must be an org member to UPDATE" on "public"."option";

drop policy "Allow authenticated users to read." on "public"."organizationmember";

drop policy "User must be an org member to DELETE" on "public"."question";

drop policy "User must be an org member to INSERT" on "public"."question";

drop policy "User must be an org member to UPDATE" on "public"."question";

drop policy "User must be a course member to DELETE" on "public"."submission";

drop policy "User must be a course member to INSERT" on "public"."submission";

drop policy "User must be a course member to UPDATE" on "public"."submission";

alter table "public"."organization" drop constraint "organization_customDomain_key";

alter table "public"."lesson_completion" drop constraint "lesson_completion_lesson_id_fkey";

drop function if exists "public"."is_user_in_group_with_role"(group_id integer);

drop index if exists "public"."organization_customDomain_key";

alter table "public"."group" add column "course_id" uuid;

alter table "public"."group" add column "is_active" boolean default false;

alter table "public"."organization" drop column "customCode";

alter table "public"."organization" drop column "customDomain";

alter table "public"."organization" drop column "favicon";

alter table "public"."organization" drop column "isCustomDomainVerified";

alter table "public"."lesson_completion" add constraint "lesson_completion_lesson_id_fkey" FOREIGN KEY (lesson_id) REFERENCES lesson(id) not valid;

alter table "public"."lesson_completion" validate constraint "lesson_completion_lesson_id_fkey";

set check_function_bodies = off;

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
$function$
;

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
$function$
;

CREATE OR REPLACE FUNCTION public.get_courses(org_id_arg uuid, profile_id_arg uuid)
 RETURNS TABLE(id uuid, org_id uuid, title character varying, slug character varying, description character varying, logo text, banner_image text, cost bigint, currency character varying, is_published boolean, total_lessons bigint, total_students bigint, progress_rate bigint, type "COURSE_TYPE", member_profile_id uuid)
 LANGUAGE plpgsql
AS $function$
BEGIN
  Return query
  select course.id, organization.id AS org_id, course.title, course.slug, course.description, course.logo, course.banner_image, course.cost, course.currency, course.is_published, 
  (select COUNT(*) from lesson as l where l.course_id = course.id) AS total_lessons, 
  (select COUNT(*) from groupmember as gm where gm.group_id = 
  (
    SELECT "group".id from "group" where "group".course_id = course.id and "group".is_active = true LIMIT 1
  ) AND gm.role_id = 3) as total_students, (select COUNT(*) from lesson_completion as lc join lesson as l on l.id = lc.lesson_id where l.course_id = course.id and lc.is_complete = true and lc.profile_id = profile_id_arg) AS progress_rate, course.type as type, (select groupmember.profile_id from groupmember where groupmember.group_id = "group".id and groupmember.profile_id =  profile_id_arg) as member_profile_id
  from course
  join "group" on "group".course_id = course.id

join organization on organization.id = "group".organization_id
  where course.status = 'ACTIVE' AND organization.id = org_id_arg
  -- GROUP BY course.id, groupmember.profile_id
  ORDER BY course.created_at DESC;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_explore_courses(org_id_arg uuid, profile_id_arg uuid)
 RETURNS TABLE(id uuid, org_id uuid, title character varying, slug character varying, description character varying, logo text, banner_image text, cost bigint, currency character varying, is_published boolean, total_lessons bigint, total_students bigint, progress_rate bigint, type "COURSE_TYPE", other_profile_id uuid)
 LANGUAGE plpgsql
AS $function$
BEGIN
    RETURN QUERY
    SELECT 
        course.id,
        organization.id AS org_id,
        course.title,
        course.slug,
        course.description,
        course.logo,
        course.banner_image,
        course.cost,
        course.currency,
        course.is_published,
        (
            SELECT COUNT(*)
            FROM lesson as l
            WHERE l.course_id = course.id
        ) AS total_lessons,
        (
            SELECT COUNT(*)
            FROM groupmember as gm
            JOIN "group" on "group".id = gm.group_id
            WHERE "group".course_id = course.id
            AND gm.role_id = 3
        ) AS total_students,
        (
            SELECT COUNT(*)
            FROM lesson_completion as lc
            JOIN lesson as l on l.id = lc.lesson_id
            WHERE l.course_id = course.id
            AND lc.is_complete = true
            AND lc.profile_id = profile_id_arg
        ) AS progress_rate,
        course.type as type,
        (
            SELECT groupmember.profile_id 
            FROM groupmember 
            JOIN "group" on "group".id = groupmember.group_id
            WHERE "group".course_id = course.id
            AND groupmember.profile_id != profile_id_arg 
            LIMIT 1
        ) AS other_profile_id
    FROM 
        course
    JOIN 
        "group" on "group".course_id = course.id
    JOIN 
        organization on organization.id = "group".organization_id
    WHERE 
        course.status = 'ACTIVE' 
        AND course.is_published = true 
        AND organization.id = org_id_arg 
        AND profile_id_arg NOT IN (
            SELECT groupmember.profile_id 
            FROM groupmember 
            JOIN "group" on "group".id = groupmember.group_id
            WHERE "group".course_id = course.id
        )
    ORDER BY 
        course.created_at DESC;
END;
$function$
;

create policy "User must be an org member to SELECT"
on "public"."organization_plan"
as permissive
for select
to public
using (is_org_member());


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


create policy "User must be a course member to INSERT"
on "public"."course_newsfeed"
as permissive
for insert
to public
with check (is_user_in_course_group(( SELECT "group".id
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


create policy "Allow authenticated users to read."
on "public"."organizationmember"
as permissive
for select
to public
using ((auth.uid() = profile_id));


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
