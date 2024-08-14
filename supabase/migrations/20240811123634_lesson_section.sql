create type "public"."COURSE_VERSION" as enum ('V1', 'V2');

alter table "public"."lesson_language_history" drop constraint "lesson_language_history_lesson_language_id_fkey";

alter table "public"."lesson_language" drop constraint "public_lesson_language_lesson_id_fkey";

create table "public"."lesson_section" (
    "id" uuid not null default gen_random_uuid(),
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone default now(),
    "title" character varying,
    "order" bigint default '0'::bigint,
    "course_id" uuid
);


alter table "public"."lesson_section" enable row level security;

alter table "public"."course" add column "version" "COURSE_VERSION" not null default 'V1'::"COURSE_VERSION";

alter table "public"."lesson" add column "section_id" uuid;

CREATE UNIQUE INDEX lesson_section_pkey ON public.lesson_section USING btree (id);

alter table "public"."lesson_section" add constraint "lesson_section_pkey" PRIMARY KEY using index "lesson_section_pkey";

alter table "public"."lesson" add constraint "public_lesson_section_id_fkey" FOREIGN KEY (section_id) REFERENCES lesson_section(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."lesson" validate constraint "public_lesson_section_id_fkey";

alter table "public"."lesson_language_history" add constraint "public_lesson_language_history_lesson_language_id_fkey" FOREIGN KEY (lesson_language_id) REFERENCES lesson_language(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."lesson_language_history" validate constraint "public_lesson_language_history_lesson_language_id_fkey";

alter table "public"."lesson_section" add constraint "public_lesson_section_course_id_fkey" FOREIGN KEY (course_id) REFERENCES course(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."lesson_section" validate constraint "public_lesson_section_course_id_fkey";

alter table "public"."lesson_language" add constraint "public_lesson_language_lesson_id_fkey" FOREIGN KEY (lesson_id) REFERENCES lesson(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."lesson_language" validate constraint "public_lesson_language_lesson_id_fkey";

grant delete on table "public"."lesson_section" to "anon";

grant insert on table "public"."lesson_section" to "anon";

grant references on table "public"."lesson_section" to "anon";

grant select on table "public"."lesson_section" to "anon";

grant trigger on table "public"."lesson_section" to "anon";

grant truncate on table "public"."lesson_section" to "anon";

grant update on table "public"."lesson_section" to "anon";

grant delete on table "public"."lesson_section" to "authenticated";

grant insert on table "public"."lesson_section" to "authenticated";

grant references on table "public"."lesson_section" to "authenticated";

grant select on table "public"."lesson_section" to "authenticated";

grant trigger on table "public"."lesson_section" to "authenticated";

grant truncate on table "public"."lesson_section" to "authenticated";

grant update on table "public"."lesson_section" to "authenticated";

grant delete on table "public"."lesson_section" to "service_role";

grant insert on table "public"."lesson_section" to "service_role";

grant references on table "public"."lesson_section" to "service_role";

grant select on table "public"."lesson_section" to "service_role";

grant trigger on table "public"."lesson_section" to "service_role";

grant truncate on table "public"."lesson_section" to "service_role";

grant update on table "public"."lesson_section" to "service_role";

create policy "Enable read access for all users"
on "public"."lesson_section"
as permissive
for select
to public
using (true);


create policy "User must be an org member to DELETE"
on "public"."lesson_section"
as permissive
for delete
to public
using (is_user_in_group_with_role(( SELECT course.group_id
   FROM course
  WHERE (course.id = lesson_section.course_id)
 LIMIT 1)));


create policy "User must be an org member to INSERT"
on "public"."lesson_section"
as permissive
for insert
to public
with check (is_user_in_group_with_role(( SELECT course.group_id
   FROM course
  WHERE (course.id = lesson_section.course_id)
 LIMIT 1)));


create policy "User must be an org member to UPDATE"
on "public"."lesson_section"
as permissive
for update
to public
using (is_user_in_group_with_role(( SELECT course.group_id
   FROM course
  WHERE (course.id = lesson_section.course_id)
 LIMIT 1)))
with check (is_user_in_group_with_role(( SELECT course.group_id
   FROM course
  WHERE (course.id = lesson_section.course_id)
 LIMIT 1)));