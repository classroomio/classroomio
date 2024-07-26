create policy "User must be an org member to DELETE"
on "public"."lesson_language_history"
as permissive
for delete
to public
using (is_user_in_group_with_role(( SELECT course.group_id
   FROM course
  WHERE (course.id = ( SELECT lesson.course_id
           FROM lesson
          WHERE (lesson.id = ( SELECT lesson_language.lesson_id
                   FROM lesson_language
                  WHERE (lesson_language.id = lesson_language_history.lesson_language_id)))
         LIMIT 1))
 LIMIT 1)));


create policy "User must be an org member to INSERT"
on "public"."lesson_language_history"
as permissive
for insert
to public
with check (is_user_in_group_with_role(( SELECT course.group_id
   FROM course
  WHERE (course.id = ( SELECT lesson.course_id
           FROM lesson
          WHERE (lesson.id = ( SELECT lesson_language.lesson_id
                   FROM lesson_language
                  WHERE (lesson_language.id = lesson_language_history.lesson_language_id)))
         LIMIT 1))
 LIMIT 1)));


create policy "User must be an org member to UPDATE"
on "public"."lesson_language_history"
as permissive
for update
to public
using (is_user_in_group_with_role(( SELECT course.group_id
   FROM course
  WHERE (course.id = ( SELECT lesson.course_id
           FROM lesson
          WHERE (lesson.id = ( SELECT lesson_language.lesson_id
                   FROM lesson_language
                  WHERE (lesson_language.id = lesson_language_history.lesson_language_id)))
         LIMIT 1))
 LIMIT 1)))
with check (is_user_in_group_with_role(( SELECT course.group_id
   FROM course
  WHERE (course.id = ( SELECT lesson.course_id
           FROM lesson
          WHERE (lesson.id = ( SELECT lesson_language.lesson_id
                   FROM lesson_language
                  WHERE (lesson_language.id = lesson_language_history.lesson_language_id)))
         LIMIT 1))
 LIMIT 1)));




