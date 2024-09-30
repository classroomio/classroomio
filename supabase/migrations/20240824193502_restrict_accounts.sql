drop function if exists "public"."convert_course_to_v2"(course_id uuid);

alter table "public"."organization" add column "is_restricted" boolean not null default false;

alter table "public"."profile" add column "is_restricted" boolean not null default false;

set check_function_bodies = off;

CREATE
OR REPLACE FUNCTION convert_course_to_v2 (course_id_arg uuid) RETURNS void AS $$
DECLARE
    new_section_id uuid;
BEGIN
    UPDATE course
    SET version = 'V2'
    WHERE id = course_id_arg;

    INSERT INTO lesson_section (title, course_id) VALUES ('First Section [edit me]', course_id_arg) RETURNING id INTO new_section_id;

    UPDATE lesson
    SET section_id = new_section_id
    WHERE lesson.course_id = course_id_arg;
END;
$$ LANGUAGE plpgsql;



