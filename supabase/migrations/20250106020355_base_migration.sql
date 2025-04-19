
SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

CREATE EXTENSION IF NOT EXISTS "pg_net" WITH SCHEMA "extensions";

CREATE EXTENSION IF NOT EXISTS "pgsodium" WITH SCHEMA "pgsodium";

ALTER SCHEMA "public" OWNER TO "postgres";

COMMENT ON SCHEMA "public" IS 'standard public schema';

CREATE EXTENSION IF NOT EXISTS "moddatetime" WITH SCHEMA "extensions";

CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";

CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";

CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";

CREATE EXTENSION IF NOT EXISTS "pgjwt" WITH SCHEMA "extensions";

CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";

CREATE EXTENSION IF NOT EXISTS "vector" WITH SCHEMA "extensions";

CREATE TYPE "public"."COURSE_TYPE" AS ENUM (
    'SELF_PACED',
    'LIVE_CLASS'
);

ALTER TYPE "public"."COURSE_TYPE" OWNER TO "postgres";

CREATE TYPE "public"."COURSE_VERSION" AS ENUM (
    'V1',
    'V2'
);

ALTER TYPE "public"."COURSE_VERSION" OWNER TO "postgres";

CREATE TYPE "public"."LOCALE" AS ENUM (
    'en',
    'hi',
    'fr',
    'pt',
    'de',
    'vi',
    'ru',
    'es'
);

ALTER TYPE "public"."LOCALE" OWNER TO "postgres";

CREATE TYPE "public"."PLAN" AS ENUM (
    'EARLY_ADOPTER',
    'ENTERPRISE',
    'BASIC'
);

ALTER TYPE "public"."PLAN" OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."add_them"("a" integer, "b" integer) RETURNS integer
    LANGUAGE "sql" IMMUTABLE
    AS $$
 SELECT a + b;
$$;

ALTER FUNCTION "public"."add_them"("a" integer, "b" integer) OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."check_if_student_completed_exercises"("lesson_id_arg" "uuid", "groupmember_id_arg" "uuid") RETURNS boolean
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    all_exercises_exist boolean;
BEGIN
    SELECT COUNT(*) = COUNT(s.id) INTO all_exercises_exist
    FROM exercise e
    LEFT JOIN submission s ON e.id = s.exercise_id AND s.submitted_by = groupmember_id_arg
    WHERE e.lesson_id = lesson_id_arg;

    RETURN all_exercises_exist;
END;
$$;

ALTER FUNCTION "public"."check_if_student_completed_exercises"("lesson_id_arg" "uuid", "groupmember_id_arg" "uuid") OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."convert_course_to_v2"("course_id_arg" "uuid") RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
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
$$;

ALTER FUNCTION "public"."convert_course_to_v2"("course_id_arg" "uuid") OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."get_course_progress"("course_id_arg" "uuid", "profile_id_arg" "uuid") RETURNS TABLE("lessons_count" bigint, "lessons_completed" bigint, "exercises_count" bigint, "exercises_completed" bigint)
    LANGUAGE "plpgsql"
    AS $$
BEGIN
RETURN QUERY
select
  count(lesson.id) as lessons_count,
  count(lesson_completion.id) as lessons_completed,
  count(exercise.id) as exercises_count,
  count(submission.id) as exercises_completed
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
$$;

ALTER FUNCTION "public"."get_course_progress"("course_id_arg" "uuid", "profile_id_arg" "uuid") OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."get_courses"("org_id_arg" "uuid", "profile_id_arg" "uuid") RETURNS TABLE("id" "uuid", "org_id" "uuid", "title" character varying, "slug" character varying, "description" character varying, "logo" "text", "banner_image" "text", "cost" bigint, "currency" character varying, "is_published" boolean, "total_lessons" bigint, "total_students" bigint, "progress_rate" bigint, "type" "public"."COURSE_TYPE", "member_profile_id" "uuid")
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  Return query
  select course.id, organization.id AS org_id, course.title, course.slug, course.description, course.logo, course.banner_image, course.cost, course.currency, course.is_published, (select COUNT(*) from lesson as l where l.course_id = course.id) AS total_lessons, (select COUNT(*) from groupmember as gm where gm.group_id = course.group_id AND gm.role_id = 3) as total_students, (select COUNT(*) from lesson_completion as lc join lesson as l on l.id = lc.lesson_id where l.course_id = course.id and lc.is_complete = true and lc.profile_id = profile_id_arg) AS progress_rate, course.type as type, (select groupmember.profile_id from groupmember where groupmember.group_id = "group".id and groupmember.profile_id =  profile_id_arg) as member_profile_id
  from course
  join "group" on "group".id = course.group_id
  join organization on organization.id = "group".organization_id
  where course.status = 'ACTIVE' AND organization.id = org_id_arg
  -- GROUP BY course.id, groupmember.profile_id
  ORDER BY course.created_at DESC;
END;
$$;

ALTER FUNCTION "public"."get_courses"("org_id_arg" "uuid", "profile_id_arg" "uuid") OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."get_dash_org_recent_enrollments"("org_id_arg" "uuid") RETURNS TABLE("profile_id" "uuid", "avatar_url" "text", "fullname" "text", "course_id" "uuid", "course_title" character varying, "enrolled_at" timestamp with time zone)
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.avatar_url,
        p.fullname,
        course.id,
        course.title,
        gm.created_at as enrolled_at
    FROM
        course
        JOIN "group" as gp ON gp.id = course.group_id
        LEFT JOIN groupmember as gm ON gm.group_id = gp.id AND gm.role_id = 3
        JOIN profile as p ON p.id = gm.profile_id
    WHERE 
        course.status = 'ACTIVE' 
        AND gp.organization_id = org_id_arg
    GROUP BY 
        p.id,
        course.id,
        course.title,
        enrolled_at
    ORDER BY 
        enrolled_at DESC
    LIMIT 5;
END;
$$;

ALTER FUNCTION "public"."get_dash_org_recent_enrollments"("org_id_arg" "uuid") OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."get_dash_org_top_courses"("org_id_arg" "uuid") RETURNS TABLE("course_id" "uuid", "course_title" character varying, "total_students" integer, "completion_percentage" integer)
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  RETURN QUERY
SELECT 
    course_stats.course_id,
    course_stats.course_title,
    course_stats.total_students::integer,
    CASE 
      WHEN course_stats.total_students * course_stats.total_lessons = 0 THEN 0
      ELSE ROUND((course_stats.completed_lessons::numeric / (course_stats.total_students * course_stats.total_lessons)) * 100)::integer
    END as completion_percentage
  FROM (
    SELECT 
      c.id as course_id,
      c.title as course_title,
      COUNT(DISTINCT gm.id) as total_students,
      COUNT(DISTINCT l.id) as total_lessons,
      COUNT(DISTINCT lc.id) FILTER (WHERE lc.is_complete = true) as completed_lessons
    FROM course c
    JOIN "group" g ON g.id = c.group_id
    LEFT JOIN groupmember gm ON gm.group_id = g.id and gm.role_id = 3
    LEFT JOIN lesson l ON l.course_id = c.id
    LEFT JOIN lesson_completion lc ON lc.lesson_id = l.id 
      AND lc.profile_id = gm.profile_id
    WHERE c.status = 'ACTIVE'  AND g.organization_id = org_id_arg
    GROUP BY c.id, c.title
    ORDER BY completed_lessons DESC
  ) as course_stats
  LIMIT 5;
END;
$$;

ALTER FUNCTION "public"."get_dash_org_top_courses"("org_id_arg" "uuid") OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."get_exercises"() RETURNS TABLE("course_id" "uuid", "lesson_id" "uuid", "exercise_id" "uuid", "exercise_title" character varying, "points" integer)
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  Return query
  select lesson.course_id course_id, lesson.id lesson_id, exercise.id exercise_id, exercise.title exercise_title, sum(question.points)::int points
  from exercise
  join lesson on exercise.lesson_id = lesson.id
  right join question on question.exercise_id = exercise.id
  GROUP BY lesson.course_id, lesson.id, exercise.id, exercise.title
  ORDER BY lesson.created_at ASC;
END;
$$;

ALTER FUNCTION "public"."get_exercises"() OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."get_explore_courses"("org_id_arg" "uuid", "profile_id_arg" "uuid") RETURNS TABLE("id" "uuid", "org_id" "uuid", "title" character varying, "slug" character varying, "description" character varying, "logo" "text", "banner_image" "text", "cost" bigint, "currency" character varying, "is_published" boolean, "total_lessons" bigint, "total_students" bigint, "progress_rate" bigint, "type" "public"."COURSE_TYPE", "other_profile_id" "uuid")
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  Return query
  select course.id, organization.id AS org_id, course.title, course.slug, course.description, course.logo, course.banner_image, course.cost, course.currency, course.is_published, (select COUNT(*) from lesson 
as l where l.course_id = course.id) AS total_lessons, (select COUNT(*) from groupmember as gm where gm.group_id = course.group_id AND gm.role_id = 3) as total_students, (select COUNT(*) from lesson_completion as lc join lesson as l on l.id = lc.lesson_id where l.course_id = course.id and lc.is_complete = true and lc.profile_id = profile_id_arg) AS progress_rate, course.type as type, (select groupmember.profile_id from groupmember where groupmember.group_id = "group".id and groupmember.profile_id !=  profile_id_arg 
limit 1) as other_profile_id
  from course
  join "group" on "group".id = course.group_id
  join organization on organization.id = "group".organization_id
  where course.status = 'ACTIVE' AND course.is_published = true AND organization.id = org_id_arg AND profile_id_arg NOT IN (SELECT groupmember.profile_id FROM groupmember WHERE groupmember.group_id = course.group_id)
  ORDER BY course.created_at DESC;
END;
$$;

ALTER FUNCTION "public"."get_explore_courses"("org_id_arg" "uuid", "profile_id_arg" "uuid") OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."get_marks"() RETURNS TABLE("course_id" "uuid", "exercise_id" "uuid", "exercise_title" character varying, "exercise_points" integer, "lesson_id" "uuid", "lesson_title" character varying, "status_id" bigint, "total_points_gotten" bigint, "groupmember_id" "uuid", "fullname" "text", "assigned_student_id" character varying, "avatar_url" "text")
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  Return query
  select lesson.course_id course_id, exercise.id exercise_id, exercise.title exercise_title, sum(question.points)::int exercise_points, lesson.id lesson_id, lesson.title lesson_title, submission.status_id, submission.total total_points_gotten, submission.submitted_by groupmember_id, profile.fullname, groupmember.assigned_student_id, profile.avatar_url
  from exercise
  join lesson on exercise.lesson_id = lesson.id
  left join submission on exercise.id = submission.exercise_id
  join groupmember on groupmember.id = submission.submitted_by
  right join question on question.exercise_id = exercise.id
  join profile on profile.id = groupmember.profile_id
  GROUP BY exercise.id, lesson.id, submission.status_id, submission.total, submission.submitted_by, profile.fullname, groupmember.assigned_student_id, profile.avatar_url
  ORDER BY lesson.created_at ASC;
END;
$$;

ALTER FUNCTION "public"."get_marks"() OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."get_student_exercises"("org_id_arg" "uuid", "profile_id_arg" "uuid") RETURNS TABLE("exercise_id" "uuid", "exercise_title" character varying, "lesson_id" "uuid", "lesson_title" character varying, "status_id" integer, "total" integer)
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  Return query
  select exercise.id as exercise_id, exercise.title as exercise_title, lesson.id as lesson_id, lesson.title as lesson_title, submission.status_id, submission.total
  from exercise
  inner join lesson on lesson.id = exercise.lesson_id
  inner join course on course.id = lesson.course_id
  inner join "group" on "group".id = course.group_id
  inner join organization on "group".organization_id = organization.id
  inner join groupmember on groupmember.group_id = course.group_id
  inner join profile on groupmember.profile_id = profile.id
  left join submission on submission.submitted_by = groupmember.id
  where course.status = 'ACTIVE' AND organization.id = org_id_arg AND profile.id = profile_id_arg;
END;
$$;

ALTER FUNCTION "public"."get_student_exercises"("org_id_arg" "uuid", "profile_id_arg" "uuid") OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."get_user_upcoming_lessons"("profile_id_arg" "uuid", "org_id_arg" "uuid") RETURNS TABLE("course_id" "uuid", "course_title" character varying, "lesson_id" "uuid", "lesson_title" character varying, "call_url" "text", "lesson_at" timestamp with time zone, "is_complete" boolean)
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  Return query
  select course.id course_id, course.title course_title, lesson.id lesson_id, lesson.title lesson_title, lesson.call_url call_url, lesson.lesson_at lesson_at, lesson.is_complete is_complete
  from lesson
  join course on course.id = lesson.course_id
  join "group" on "group".id = course.group_id
  join groupmember on groupmember.group_id = course.group_id
  where course.status = 'ACTIVE' AND groupmember.profile_id = profile_id_arg AND "group".organization_id = org_id_arg
  ORDER BY lesson_at ASC;
END
$$;

ALTER FUNCTION "public"."get_user_upcoming_lessons"("profile_id_arg" "uuid", "org_id_arg" "uuid") OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."insert_login_event_on_user_login"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  IF (NEW.last_sign_in_at IS NOT NULL) THEN
    INSERT INTO public.analytics_login_events (logged_in_at, user_id)
    VALUES (NEW.last_sign_in_at, NEW.id)
    ON CONFLICT (user_id) DO UPDATE
    SET logged_in_at = NEW.last_sign_in_at;
  END IF;
  RETURN NEW;
END;
$$;

ALTER FUNCTION "public"."insert_login_event_on_user_login"() OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."insert_login_event_on_user_session_update"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  IF (NEW.updated_at IS NOT NULL AND NEW.updated_at != OLD.updated_at) THEN
    INSERT INTO public.analytics_login_events (logged_in_at, user_id)
    VALUES (NEW.updated_at, NEW.user_id)
    ON CONFLICT (user_id) DO UPDATE
    SET logged_in_at = EXCLUDED.logged_in_at
    WHERE analytics_login_events.logged_in_at < EXCLUDED.logged_in_at;
  END IF;
  RETURN NEW;
END;
$$;

ALTER FUNCTION "public"."insert_login_event_on_user_session_update"() OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."is_org_admin"() RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM organizationmember
        WHERE organization_id = organization_id
        AND profile_id = (select auth.uid())
        AND role_id = 1
    );
END;
$$;

ALTER FUNCTION "public"."is_org_admin"() OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."is_org_admin"("org_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM organizationmember
        WHERE organization_id = org_id
        AND profile_id = (select auth.uid())
        AND role_id = 1
    );
END;
$$;

ALTER FUNCTION "public"."is_org_admin"("org_id" "uuid") OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."is_org_member"() RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM organizationmember
        WHERE organization_id = organization_id
        AND profile_id = (select auth.uid())
    );
END;
$$;

ALTER FUNCTION "public"."is_org_member"() OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."is_user_in_course_group"("group_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $_$ begin return exists 
(SELECT 1 FROM groupmember member
JOIN "group" g ON g.id = member.group_id
WHERE member.role_id IS NOT NULL
AND member.profile_id = auth.uid()
AND g.id = $1
);
END;
$_$;

ALTER FUNCTION "public"."is_user_in_course_group"("group_id" "uuid") OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."is_user_in_group_with_role"("group_id" integer) RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $_$
begin
  return exists (
    SELECT 1
    FROM organizationmember m
    JOIN organization o ON o.organization_id = m.organization_id
    WHERE m.role_id IS NOT NULL
    AND m.profile_id = auth.uid ()
      AND EXISTS (
        SELECT 1
        FROM "group" g
        WHERE g.group_id = $1
          AND g.organization_id = o.organization_id
      )
  );
END;
$_$;

ALTER FUNCTION "public"."is_user_in_group_with_role"("group_id" integer) OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."is_user_in_group_with_role"("group_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $_$
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
$_$;

ALTER FUNCTION "public"."is_user_in_group_with_role"("group_id" "uuid") OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."update_lesson_language_history"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  IF TG_OP IN ('INSERT', 'UPDATE') THEN
    INSERT INTO lesson_language_history (lesson_language_id, old_content, new_content)
    VALUES (NEW.id, COALESCE(OLD.content, ''), NEW.content);
  END IF;
  RETURN NULL;
END;
$$;

ALTER FUNCTION "public"."update_lesson_language_history"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";

CREATE TABLE IF NOT EXISTS "public"."analytics_login_events" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "logged_in_at" timestamp with time zone DEFAULT "now"()
);

ALTER TABLE "public"."analytics_login_events" OWNER TO "postgres";

CREATE TABLE IF NOT EXISTS "public"."apps_poll" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "question" "text",
    "authorId" "uuid",
    "isPublic" boolean,
    "status" character varying DEFAULT 'draft'::character varying,
    "expiration" timestamp with time zone,
    "courseId" "uuid"
);

ALTER TABLE "public"."apps_poll" OWNER TO "postgres";

CREATE TABLE IF NOT EXISTS "public"."apps_poll_option" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone,
    "poll_id" "uuid",
    "label" character varying
);

ALTER TABLE "public"."apps_poll_option" OWNER TO "postgres";

ALTER TABLE "public"."apps_poll_option" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."apps_poll_option_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);

CREATE TABLE IF NOT EXISTS "public"."apps_poll_submission" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "poll_option_id" bigint,
    "selected_by_id" "uuid",
    "poll_id" "uuid"
);

ALTER TABLE "public"."apps_poll_submission" OWNER TO "postgres";

ALTER TABLE "public"."apps_poll_submission" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."apps_poll_submision_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);

CREATE TABLE IF NOT EXISTS "public"."community_answer" (
    "id" "uuid" DEFAULT "extensions"."gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "question_id" bigint,
    "body" character varying,
    "author_id" bigint,
    "votes" bigint,
    "author_profile_id" "uuid"
);

ALTER TABLE "public"."community_answer" OWNER TO "postgres";

CREATE TABLE IF NOT EXISTS "public"."community_question" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "title" character varying,
    "body" "text",
    "author_id" bigint,
    "votes" bigint DEFAULT '0'::bigint,
    "organization_id" "uuid",
    "slug" "text",
    "author_profile_id" "uuid",
    "course_id" "uuid" NOT NULL
);

ALTER TABLE "public"."community_question" OWNER TO "postgres";

ALTER TABLE "public"."community_question" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."community_question_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);

CREATE TABLE IF NOT EXISTS "public"."course" (
    "title" character varying NOT NULL,
    "description" character varying NOT NULL,
    "overview" character varying DEFAULT 'Welcome to this amazing course 🚀 '::character varying,
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "group_id" "uuid",
    "is_template" boolean DEFAULT true,
    "logo" "text" DEFAULT ''::"text" NOT NULL,
    "slug" character varying,
    "metadata" "jsonb" DEFAULT '{"goals": "", "description": "", "requirements": ""}'::"jsonb" NOT NULL,
    "cost" bigint DEFAULT '0'::bigint,
    "currency" character varying DEFAULT 'USD'::character varying NOT NULL,
    "banner_image" "text",
    "is_published" boolean DEFAULT false,
    "is_certificate_downloadable" boolean DEFAULT false,
    "certificate_theme" "text",
    "status" "text" DEFAULT 'ACTIVE'::"text" NOT NULL,
    "type" "public"."COURSE_TYPE" DEFAULT 'LIVE_CLASS'::"public"."COURSE_TYPE",
    "version" "public"."COURSE_VERSION" DEFAULT 'V1'::"public"."COURSE_VERSION" NOT NULL
);

ALTER TABLE "public"."course" OWNER TO "postgres";

CREATE TABLE IF NOT EXISTS "public"."course_newsfeed" (
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "author_id" "uuid",
    "content" "text",
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "course_id" "uuid",
    "reaction" "jsonb" DEFAULT '{"clap": [], "smile": [], "thumbsup": [], "thumbsdown": []}'::"jsonb",
    "is_pinned" boolean DEFAULT false NOT NULL
);

ALTER TABLE "public"."course_newsfeed" OWNER TO "postgres";

CREATE TABLE IF NOT EXISTS "public"."course_newsfeed_comment" (
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "author_id" "uuid",
    "content" "text",
    "id" bigint NOT NULL,
    "course_newsfeed_id" "uuid"
);

ALTER TABLE "public"."course_newsfeed_comment" OWNER TO "postgres";

ALTER TABLE "public"."course_newsfeed_comment" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."course_newsfeed_comment_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);

CREATE TABLE IF NOT EXISTS "public"."currency" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "name" character varying
);

ALTER TABLE "public"."currency" OWNER TO "postgres";

ALTER TABLE "public"."currency" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."currency_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);

CREATE TABLE IF NOT EXISTS "public"."group" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "name" character varying NOT NULL,
    "description" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "organization_id" "uuid"
);

ALTER TABLE "public"."group" OWNER TO "postgres";

CREATE TABLE IF NOT EXISTS "public"."groupmember" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "group_id" "uuid" NOT NULL,
    "role_id" bigint NOT NULL,
    "profile_id" "uuid",
    "email" character varying,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "assigned_student_id" character varying
);

ALTER TABLE "public"."groupmember" OWNER TO "postgres";

CREATE OR REPLACE VIEW "public"."dash_org_stats" AS
 SELECT "gp"."organization_id" AS "org_id",
    "count"(DISTINCT "course"."id") AS "no_of_courses",
    "count"(DISTINCT "gm"."profile_id") AS "enrolled_students"
   FROM (("public"."course"
     JOIN "public"."group" "gp" ON (("gp"."id" = "course"."group_id")))
     LEFT JOIN "public"."groupmember" "gm" ON ((("gm"."group_id" = "gp"."id") AND ("gm"."role_id" = 3))))
  WHERE ("course"."status" = 'ACTIVE'::"text")
  GROUP BY "gp"."organization_id";

ALTER TABLE "public"."dash_org_stats" OWNER TO "postgres";

CREATE TABLE IF NOT EXISTS "public"."exercise" (
    "title" character varying NOT NULL,
    "description" character varying,
    "lesson_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "due_by" timestamp without time zone
);

ALTER TABLE "public"."exercise" OWNER TO "postgres";

CREATE TABLE IF NOT EXISTS "public"."group_attendance" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "course_id" "uuid",
    "student_id" "uuid",
    "is_present" boolean DEFAULT false,
    "lesson_id" "uuid" NOT NULL
);

ALTER TABLE "public"."group_attendance" OWNER TO "postgres";

ALTER TABLE "public"."group_attendance" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."group_attendance_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);

CREATE TABLE IF NOT EXISTS "public"."lesson" (
    "note" character varying,
    "video_url" character varying,
    "slide_url" character varying,
    "course_id" "uuid" NOT NULL,
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "title" character varying NOT NULL,
    "public" boolean DEFAULT false,
    "lesson_at" timestamp with time zone DEFAULT "now"(),
    "teacher_id" "uuid",
    "is_complete" boolean DEFAULT false,
    "call_url" "text",
    "order" bigint,
    "is_unlocked" boolean DEFAULT false,
    "videos" "jsonb" DEFAULT '[]'::"jsonb",
    "section_id" "uuid"
);

ALTER TABLE "public"."lesson" OWNER TO "postgres";

CREATE TABLE IF NOT EXISTS "public"."lesson_comment" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "lesson_id" "uuid",
    "groupmember_id" "uuid",
    "comment" "text"
);

ALTER TABLE "public"."lesson_comment" OWNER TO "postgres";

ALTER TABLE "public"."lesson_comment" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."lesson_comment_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);

CREATE TABLE IF NOT EXISTS "public"."lesson_completion" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "lesson_id" "uuid",
    "profile_id" "uuid",
    "is_complete" boolean DEFAULT false,
    "updated_at" timestamp with time zone DEFAULT "now"()
);

ALTER TABLE "public"."lesson_completion" OWNER TO "postgres";

ALTER TABLE "public"."lesson_completion" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."lesson_completion_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);

CREATE TABLE IF NOT EXISTS "public"."lesson_language" (
    "id" bigint NOT NULL,
    "content" "text",
    "lesson_id" "uuid" DEFAULT "gen_random_uuid"(),
    "locale" "public"."LOCALE" DEFAULT 'en'::"public"."LOCALE"
);

ALTER TABLE "public"."lesson_language" OWNER TO "postgres";

CREATE TABLE IF NOT EXISTS "public"."lesson_language_history" (
    "id" integer NOT NULL,
    "lesson_language_id" integer,
    "old_content" "text",
    "new_content" "text",
    "timestamp" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);

ALTER TABLE "public"."lesson_language_history" OWNER TO "postgres";

CREATE SEQUENCE IF NOT EXISTS "public"."lesson_language_history_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER TABLE "public"."lesson_language_history_id_seq" OWNER TO "postgres";

ALTER SEQUENCE "public"."lesson_language_history_id_seq" OWNED BY "public"."lesson_language_history"."id";

ALTER TABLE "public"."lesson_language" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."lesson_language_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);

CREATE TABLE IF NOT EXISTS "public"."lesson_section" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "title" character varying,
    "order" bigint DEFAULT '0'::bigint,
    "course_id" "uuid"
);

ALTER TABLE "public"."lesson_section" OWNER TO "postgres";

CREATE OR REPLACE VIEW "public"."lesson_versions" AS
 SELECT "llh"."old_content",
    "llh"."new_content",
    "llh"."timestamp",
    "ll"."locale",
    "ll"."lesson_id"
   FROM ("public"."lesson_language_history" "llh"
     JOIN "public"."lesson_language" "ll" ON (("ll"."id" = "llh"."lesson_language_id")));

ALTER TABLE "public"."lesson_versions" OWNER TO "postgres";

CREATE TABLE IF NOT EXISTS "public"."option" (
    "id" bigint NOT NULL,
    "label" character varying NOT NULL,
    "is_correct" boolean DEFAULT false NOT NULL,
    "question_id" bigint NOT NULL,
    "value" "uuid" DEFAULT "extensions"."gen_random_uuid"(),
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);

ALTER TABLE "public"."option" OWNER TO "postgres";

ALTER TABLE "public"."option" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."option_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);

CREATE TABLE IF NOT EXISTS "public"."organization" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "name" character varying NOT NULL,
    "siteName" "text",
    "avatar_url" "text",
    "settings" "jsonb" DEFAULT '{}'::"jsonb",
    "landingpage" "jsonb" DEFAULT '{}'::"jsonb",
    "theme" "text",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "customization" "json" DEFAULT '{"apps":{"poll":true,"comments":true},"course":{"grading":true,"newsfeed":true},"dashboard":{"exercise":true,"community":true,"bannerText":"","bannerImage":""}}'::"json" NOT NULL,
    "is_restricted" boolean DEFAULT false NOT NULL,
    "customCode" "text",
    "customDomain" "text",
    "favicon" "text",
    "isCustomDomainVerified" boolean DEFAULT false
);

ALTER TABLE "public"."organization" OWNER TO "postgres";

CREATE TABLE IF NOT EXISTS "public"."organization_contacts" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "email" "text",
    "phone" "text",
    "name" "text",
    "message" "text",
    "organization_id" "uuid"
);

ALTER TABLE "public"."organization_contacts" OWNER TO "postgres";

ALTER TABLE "public"."organization_contacts" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."organization_contacts_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);

CREATE TABLE IF NOT EXISTS "public"."organization_emaillist" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "email" "text",
    "organization_id" "uuid"
);

ALTER TABLE "public"."organization_emaillist" OWNER TO "postgres";

ALTER TABLE "public"."organization_emaillist" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."organization_emaillist_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);

CREATE TABLE IF NOT EXISTS "public"."organization_plan" (
    "id" bigint NOT NULL,
    "activated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "org_id" "uuid",
    "plan_name" "public"."PLAN",
    "is_active" boolean,
    "deactivated_at" timestamp with time zone,
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "payload" "jsonb",
    "triggered_by" bigint,
    "provider" "text" DEFAULT 'lmz'::"text",
    "subscription_id" "text"
);

ALTER TABLE "public"."organization_plan" OWNER TO "postgres";

ALTER TABLE "public"."organization_plan" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."organization_plan_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);

CREATE TABLE IF NOT EXISTS "public"."organizationmember" (
    "id" bigint NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "role_id" bigint NOT NULL,
    "profile_id" "uuid",
    "email" "text",
    "verified" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);

ALTER TABLE "public"."organizationmember" OWNER TO "postgres";

ALTER TABLE "public"."organizationmember" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."organizationmember_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);

CREATE TABLE IF NOT EXISTS "public"."quiz_play" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "quiz_id" "uuid",
    "players" "json" DEFAULT '[]'::"json",
    "started" boolean DEFAULT false,
    "currentQuestionId" bigint DEFAULT '0'::bigint,
    "showCurrentQuestionAnswer" boolean DEFAULT false,
    "isLastQuestion" boolean,
    "step" "text" DEFAULT 'CONNECT_TO_PLAY'::"text",
    "studentStep" "text" DEFAULT 'PIN_SETUP'::"text",
    "pin" "text"
);

ALTER TABLE "public"."quiz_play" OWNER TO "postgres";

ALTER TABLE "public"."quiz_play" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."play_quiz_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);

CREATE TABLE IF NOT EXISTS "public"."profile" (
    "id" "uuid" NOT NULL,
    "fullname" "text" NOT NULL,
    "username" "text" NOT NULL,
    "avatar_url" "text" DEFAULT 'https://pgrest.classroomio.com/storage/v1/object/public/avatars/avatar.png'::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "email" character varying,
    "can_add_course" boolean DEFAULT true,
    "role" character varying,
    "goal" character varying,
    "source" character varying,
    "metadata" "json",
    "telegram_chat_id" bigint,
    "is_email_verified" boolean DEFAULT false,
    "verified_at" timestamp with time zone,
    "locale" "public"."LOCALE" DEFAULT 'en'::"public"."LOCALE",
    "is_restricted" boolean DEFAULT false NOT NULL
);

ALTER TABLE "public"."profile" OWNER TO "postgres";

CREATE TABLE IF NOT EXISTS "public"."question" (
    "id" bigint NOT NULL,
    "question_type_id" bigint NOT NULL,
    "title" character varying NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "exercise_id" "uuid" NOT NULL,
    "name" "uuid" DEFAULT "extensions"."gen_random_uuid"(),
    "points" double precision,
    "order" bigint
);

ALTER TABLE "public"."question" OWNER TO "postgres";

CREATE TABLE IF NOT EXISTS "public"."question_answer" (
    "id" bigint NOT NULL,
    "answers" character varying[],
    "question_id" bigint NOT NULL,
    "open_answer" "text",
    "group_member_id" "uuid" NOT NULL,
    "submission_id" "uuid",
    "point" bigint DEFAULT '0'::bigint
);

ALTER TABLE "public"."question_answer" OWNER TO "postgres";

ALTER TABLE "public"."question_answer" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."question_answer_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);

ALTER TABLE "public"."question" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."question_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);

CREATE TABLE IF NOT EXISTS "public"."question_type" (
    "id" bigint NOT NULL,
    "label" character varying NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "typename" character varying
);

ALTER TABLE "public"."question_type" OWNER TO "postgres";

ALTER TABLE "public"."question_type" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."question_type_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);

CREATE TABLE IF NOT EXISTS "public"."quiz" (
    "id" "uuid" DEFAULT "extensions"."gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "title" "text",
    "questions" "json",
    "timelimit" character varying DEFAULT '10s'::character varying,
    "theme" character varying DEFAULT 'standard'::character varying,
    "organization_id" "uuid" NOT NULL
);

ALTER TABLE "public"."quiz" OWNER TO "postgres";

CREATE TABLE IF NOT EXISTS "public"."role" (
    "type" character varying NOT NULL,
    "description" character varying,
    "id" bigint NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "created_at" timestamp with time zone DEFAULT "now"()
);

ALTER TABLE "public"."role" OWNER TO "postgres";

ALTER TABLE "public"."role" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."role_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);

CREATE TABLE IF NOT EXISTS "public"."submission" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "reviewer_id" bigint,
    "status_id" bigint DEFAULT '1'::bigint,
    "total" bigint DEFAULT '0'::bigint,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "exercise_id" "uuid" NOT NULL,
    "submitted_by" "uuid",
    "course_id" "uuid",
    "feedback" "text"
);

ALTER TABLE "public"."submission" OWNER TO "postgres";

CREATE TABLE IF NOT EXISTS "public"."submissionstatus" (
    "id" bigint NOT NULL,
    "label" character varying NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"()
);

ALTER TABLE "public"."submissionstatus" OWNER TO "postgres";

ALTER TABLE "public"."submissionstatus" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."submission_status_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);

CREATE TABLE IF NOT EXISTS "public"."test_tenant" (
    "id" integer NOT NULL,
    "details" "text"
);

ALTER TABLE "public"."test_tenant" OWNER TO "postgres";

CREATE SEQUENCE IF NOT EXISTS "public"."test_tenant_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER TABLE "public"."test_tenant_id_seq" OWNER TO "postgres";

ALTER SEQUENCE "public"."test_tenant_id_seq" OWNED BY "public"."test_tenant"."id";

CREATE TABLE IF NOT EXISTS "public"."video_transcripts" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "muse_svid" "text",
    "transcript" "text",
    "downloaded" boolean DEFAULT false,
    "link" "text"
);

ALTER TABLE "public"."video_transcripts" OWNER TO "postgres";

ALTER TABLE "public"."video_transcripts" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."video_transcripts_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);

CREATE TABLE IF NOT EXISTS "public"."waitinglist" (
    "id" bigint NOT NULL,
    "email" character varying NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);

ALTER TABLE "public"."waitinglist" OWNER TO "postgres";

ALTER TABLE "public"."waitinglist" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."waitinglist_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);

ALTER TABLE ONLY "public"."lesson_language_history" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."lesson_language_history_id_seq"'::"regclass");

ALTER TABLE ONLY "public"."test_tenant" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."test_tenant_id_seq"'::"regclass");

ALTER TABLE ONLY "public"."analytics_login_events"
    ADD CONSTRAINT "analytics_login_events_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."analytics_login_events"
    ADD CONSTRAINT "analytics_login_events_user_id_unique" UNIQUE ("user_id");

ALTER TABLE ONLY "public"."apps_poll_option"
    ADD CONSTRAINT "apps_poll_option_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."apps_poll"
    ADD CONSTRAINT "apps_poll_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."apps_poll_submission"
    ADD CONSTRAINT "apps_poll_submision_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."community_answer"
    ADD CONSTRAINT "community_answer_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."community_question"
    ADD CONSTRAINT "community_question_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."waitinglist"
    ADD CONSTRAINT "constraint_name" UNIQUE ("email");

ALTER TABLE ONLY "public"."course_newsfeed_comment"
    ADD CONSTRAINT "course_newsfeed_comment_id_key" UNIQUE ("id");

ALTER TABLE ONLY "public"."course_newsfeed_comment"
    ADD CONSTRAINT "course_newsfeed_comment_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."course_newsfeed"
    ADD CONSTRAINT "course_newsfeed_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."course"
    ADD CONSTRAINT "course_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."course"
    ADD CONSTRAINT "course_slug_key" UNIQUE ("slug");

ALTER TABLE ONLY "public"."currency"
    ADD CONSTRAINT "currency_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."exercise"
    ADD CONSTRAINT "exercise_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."group_attendance"
    ADD CONSTRAINT "group_attendance_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."group"
    ADD CONSTRAINT "group_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."groupmember"
    ADD CONSTRAINT "groupmember_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."lesson_comment"
    ADD CONSTRAINT "lesson_comment_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."lesson_completion"
    ADD CONSTRAINT "lesson_completion_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."lesson_language_history"
    ADD CONSTRAINT "lesson_language_history_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."lesson_language"
    ADD CONSTRAINT "lesson_language_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."lesson"
    ADD CONSTRAINT "lesson_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."lesson_section"
    ADD CONSTRAINT "lesson_section_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."option"
    ADD CONSTRAINT "option_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."organization_contacts"
    ADD CONSTRAINT "organization_contacts_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."organization"
    ADD CONSTRAINT "organization_customDomain_key" UNIQUE ("customDomain");

ALTER TABLE ONLY "public"."organization_emaillist"
    ADD CONSTRAINT "organization_emaillist_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."organization"
    ADD CONSTRAINT "organization_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."organization_plan"
    ADD CONSTRAINT "organization_plan_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."organization_plan"
    ADD CONSTRAINT "organization_plan_subscription_id_key" UNIQUE ("subscription_id");

ALTER TABLE ONLY "public"."organization"
    ADD CONSTRAINT "organization_siteName_key" UNIQUE ("siteName");

ALTER TABLE ONLY "public"."organizationmember"
    ADD CONSTRAINT "organizationmember_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."quiz_play"
    ADD CONSTRAINT "play_quiz_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."profile"
    ADD CONSTRAINT "profile_email_key" UNIQUE ("email");

ALTER TABLE ONLY "public"."profile"
    ADD CONSTRAINT "profile_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."profile"
    ADD CONSTRAINT "profile_username_key" UNIQUE ("username");

ALTER TABLE ONLY "public"."question_answer"
    ADD CONSTRAINT "question_answer_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."question"
    ADD CONSTRAINT "question_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."question_type"
    ADD CONSTRAINT "question_type_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."quiz"
    ADD CONSTRAINT "quiz_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."quiz_play"
    ADD CONSTRAINT "quiz_play_pin_key" UNIQUE ("pin");

ALTER TABLE ONLY "public"."role"
    ADD CONSTRAINT "role_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."submission"
    ADD CONSTRAINT "submission_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."submissionstatus"
    ADD CONSTRAINT "submission_status_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."test_tenant"
    ADD CONSTRAINT "test_tenant_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."groupmember"
    ADD CONSTRAINT "unique_entries" UNIQUE ("group_id", "profile_id", "email");

ALTER TABLE ONLY "public"."groupmember"
    ADD CONSTRAINT "unique_group_email" UNIQUE ("group_id", "email");

ALTER TABLE ONLY "public"."groupmember"
    ADD CONSTRAINT "unique_group_profile" UNIQUE ("group_id", "profile_id");

ALTER TABLE ONLY "public"."video_transcripts"
    ADD CONSTRAINT "video_transcripts_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."waitinglist"
    ADD CONSTRAINT "waitinglist_pkey" PRIMARY KEY ("id");

CREATE INDEX "idx_analytics_login_events_logged_in_at" ON "public"."analytics_login_events" USING "btree" ("logged_in_at");

CREATE INDEX "idx_analytics_login_events_user_id" ON "public"."analytics_login_events" USING "btree" ("user_id");

CREATE OR REPLACE TRIGGER "handle_exercise_updated_at" BEFORE UPDATE ON "public"."exercise" FOR EACH ROW EXECUTE FUNCTION "extensions"."moddatetime"('updated_at');

CREATE OR REPLACE TRIGGER "handle_lesson_updated_at" BEFORE UPDATE ON "public"."lesson" FOR EACH ROW EXECUTE FUNCTION "extensions"."moddatetime"('updated_at');

CREATE OR REPLACE TRIGGER "handle_question_type_updated_at" BEFORE UPDATE ON "public"."question_type" FOR EACH ROW EXECUTE FUNCTION "extensions"."moddatetime"('updated_at');

CREATE OR REPLACE TRIGGER "handle_question_updated_at" BEFORE UPDATE ON "public"."question" FOR EACH ROW EXECUTE FUNCTION "extensions"."moddatetime"('updated_at');

CREATE OR REPLACE TRIGGER "handle_role_updated_at" BEFORE UPDATE ON "public"."role" FOR EACH ROW EXECUTE FUNCTION "extensions"."moddatetime"('updated_at');

CREATE OR REPLACE TRIGGER "handle_submission_updated_at" BEFORE UPDATE ON "public"."submission" FOR EACH ROW EXECUTE FUNCTION "extensions"."moddatetime"('updated_at');

CREATE OR REPLACE TRIGGER "handle_updated_at" BEFORE UPDATE ON "public"."exercise" FOR EACH ROW EXECUTE FUNCTION "extensions"."moddatetime"('updated_at');

CREATE OR REPLACE TRIGGER "handle_updated_at" BEFORE UPDATE ON "public"."lesson" FOR EACH ROW EXECUTE FUNCTION "extensions"."moddatetime"('updated_at');

CREATE OR REPLACE TRIGGER "handle_updated_at" BEFORE UPDATE ON "public"."question" FOR EACH ROW EXECUTE FUNCTION "extensions"."moddatetime"('updated_at');

CREATE OR REPLACE TRIGGER "update_lesson_language_history_trigger" AFTER INSERT OR UPDATE ON "public"."lesson_language" FOR EACH ROW EXECUTE FUNCTION "public"."update_lesson_language_history"();

ALTER TABLE ONLY "public"."analytics_login_events"
    ADD CONSTRAINT "analytics_login_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");

ALTER TABLE ONLY "public"."apps_poll"
    ADD CONSTRAINT "apps_poll_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "public"."groupmember"("id");

ALTER TABLE ONLY "public"."apps_poll"
    ADD CONSTRAINT "apps_poll_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "public"."course"("id");

ALTER TABLE ONLY "public"."apps_poll_option"
    ADD CONSTRAINT "apps_poll_option_poll_id_fkey" FOREIGN KEY ("poll_id") REFERENCES "public"."apps_poll"("id");

ALTER TABLE ONLY "public"."apps_poll_submission"
    ADD CONSTRAINT "apps_poll_submission_poll_id_fkey" FOREIGN KEY ("poll_id") REFERENCES "public"."apps_poll"("id");

ALTER TABLE ONLY "public"."apps_poll_submission"
    ADD CONSTRAINT "apps_poll_submission_poll_option_id_fkey" FOREIGN KEY ("poll_option_id") REFERENCES "public"."apps_poll_option"("id");

ALTER TABLE ONLY "public"."apps_poll_submission"
    ADD CONSTRAINT "apps_poll_submission_selected_by_id_fkey" FOREIGN KEY ("selected_by_id") REFERENCES "public"."groupmember"("id");

ALTER TABLE ONLY "public"."community_answer"
    ADD CONSTRAINT "community_answer_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "public"."organizationmember"("id");

ALTER TABLE ONLY "public"."community_answer"
    ADD CONSTRAINT "community_answer_author_profile_id_fkey" FOREIGN KEY ("author_profile_id") REFERENCES "public"."profile"("id");

ALTER TABLE ONLY "public"."community_answer"
    ADD CONSTRAINT "community_answer_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "public"."community_question"("id");

ALTER TABLE ONLY "public"."community_question"
    ADD CONSTRAINT "community_question_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "public"."organizationmember"("id");

ALTER TABLE ONLY "public"."community_question"
    ADD CONSTRAINT "community_question_author_profile_id_fkey" FOREIGN KEY ("author_profile_id") REFERENCES "public"."profile"("id");

ALTER TABLE ONLY "public"."community_question"
    ADD CONSTRAINT "community_question_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "public"."course"("id");

ALTER TABLE ONLY "public"."community_question"
    ADD CONSTRAINT "community_question_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id");

ALTER TABLE ONLY "public"."course"
    ADD CONSTRAINT "course_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "public"."group"("id");

ALTER TABLE ONLY "public"."course_newsfeed"
    ADD CONSTRAINT "course_newsfeed_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "public"."groupmember"("id");

ALTER TABLE ONLY "public"."course_newsfeed_comment"
    ADD CONSTRAINT "course_newsfeed_comment_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "public"."groupmember"("id");

ALTER TABLE ONLY "public"."course_newsfeed_comment"
    ADD CONSTRAINT "course_newsfeed_comment_course_newsfeed_id_fkey" FOREIGN KEY ("course_newsfeed_id") REFERENCES "public"."course_newsfeed"("id");

ALTER TABLE ONLY "public"."course_newsfeed"
    ADD CONSTRAINT "course_newsfeed_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "public"."course"("id");

ALTER TABLE ONLY "public"."exercise"
    ADD CONSTRAINT "exercise_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "public"."lesson"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."group_attendance"
    ADD CONSTRAINT "group_attendance_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "public"."course"("id");

ALTER TABLE ONLY "public"."group_attendance"
    ADD CONSTRAINT "group_attendance_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "public"."groupmember"("id");

ALTER TABLE ONLY "public"."group"
    ADD CONSTRAINT "group_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id");

ALTER TABLE ONLY "public"."groupmember"
    ADD CONSTRAINT "groupmember_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "public"."group"("id");

ALTER TABLE ONLY "public"."groupmember"
    ADD CONSTRAINT "groupmember_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."profile"("id");

ALTER TABLE ONLY "public"."groupmember"
    ADD CONSTRAINT "groupmember_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "public"."role"("id");

ALTER TABLE ONLY "public"."lesson_comment"
    ADD CONSTRAINT "lesson_comment_groupmember_id_fkey" FOREIGN KEY ("groupmember_id") REFERENCES "public"."groupmember"("id");

ALTER TABLE ONLY "public"."lesson_comment"
    ADD CONSTRAINT "lesson_comment_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "public"."lesson"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."lesson_completion"
    ADD CONSTRAINT "lesson_completion_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "public"."lesson"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."lesson_completion"
    ADD CONSTRAINT "lesson_completion_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."profile"("id");

ALTER TABLE ONLY "public"."lesson"
    ADD CONSTRAINT "lesson_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "public"."course"("id");

ALTER TABLE ONLY "public"."lesson"
    ADD CONSTRAINT "lesson_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "public"."profile"("id");

ALTER TABLE ONLY "public"."option"
    ADD CONSTRAINT "option_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "public"."question"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."organization_contacts"
    ADD CONSTRAINT "organization_contacts_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id");

ALTER TABLE ONLY "public"."organization_emaillist"
    ADD CONSTRAINT "organization_emaillist_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id");

ALTER TABLE ONLY "public"."organization_plan"
    ADD CONSTRAINT "organization_plan_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."organization"("id");

ALTER TABLE ONLY "public"."organization_plan"
    ADD CONSTRAINT "organization_plan_triggered_by_fkey" FOREIGN KEY ("triggered_by") REFERENCES "public"."organizationmember"("id");

ALTER TABLE ONLY "public"."organizationmember"
    ADD CONSTRAINT "organizationmember_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id");

ALTER TABLE ONLY "public"."organizationmember"
    ADD CONSTRAINT "organizationmember_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."profile"("id");

ALTER TABLE ONLY "public"."organizationmember"
    ADD CONSTRAINT "organizationmember_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "public"."role"("id");

ALTER TABLE ONLY "public"."profile"
    ADD CONSTRAINT "profile_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id");

ALTER TABLE ONLY "public"."lesson_language_history"
    ADD CONSTRAINT "public_lesson_language_history_lesson_language_id_fkey" FOREIGN KEY ("lesson_language_id") REFERENCES "public"."lesson_language"("id") ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE ONLY "public"."lesson_language"
    ADD CONSTRAINT "public_lesson_language_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "public"."lesson"("id") ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE ONLY "public"."lesson_section"
    ADD CONSTRAINT "public_lesson_section_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "public"."course"("id") ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE ONLY "public"."lesson"
    ADD CONSTRAINT "public_lesson_section_id_fkey" FOREIGN KEY ("section_id") REFERENCES "public"."lesson_section"("id") ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE ONLY "public"."question_answer"
    ADD CONSTRAINT "question_answer_group_member_id_fkey" FOREIGN KEY ("group_member_id") REFERENCES "public"."groupmember"("id");

ALTER TABLE ONLY "public"."question_answer"
    ADD CONSTRAINT "question_answer_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "public"."question"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."question_answer"
    ADD CONSTRAINT "question_answer_submission_id_fkey" FOREIGN KEY ("submission_id") REFERENCES "public"."submission"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."question"
    ADD CONSTRAINT "question_exercise_id_fkey" FOREIGN KEY ("exercise_id") REFERENCES "public"."exercise"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."question"
    ADD CONSTRAINT "question_question_type_id_fkey" FOREIGN KEY ("question_type_id") REFERENCES "public"."question_type"("id");

ALTER TABLE ONLY "public"."quiz"
    ADD CONSTRAINT "quiz_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id");

ALTER TABLE ONLY "public"."quiz_play"
    ADD CONSTRAINT "quiz_play_quiz_id_fkey" FOREIGN KEY ("quiz_id") REFERENCES "public"."quiz"("id");

ALTER TABLE ONLY "public"."submission"
    ADD CONSTRAINT "submission_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "public"."course"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."submission"
    ADD CONSTRAINT "submission_exercise_id_fkey" FOREIGN KEY ("exercise_id") REFERENCES "public"."exercise"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."submission"
    ADD CONSTRAINT "submission_status_id_fkey" FOREIGN KEY ("status_id") REFERENCES "public"."submissionstatus"("id");

ALTER TABLE ONLY "public"."submission"
    ADD CONSTRAINT "submission_submitted_by_fkey" FOREIGN KEY ("submitted_by") REFERENCES "public"."groupmember"("id");

CREATE POLICY "Allow authenticated users to SELECT" ON "public"."option" FOR SELECT USING (("auth"."uid"() IS NOT NULL));

CREATE POLICY "Allow authenticated users to SELECT" ON "public"."question" FOR SELECT USING (("auth"."uid"() IS NOT NULL));

CREATE POLICY "Allow authenticated users to read." ON "public"."organizationmember" FOR SELECT USING (("auth"."uid"() IS NOT NULL));

CREATE POLICY "Authenticated users can SELECT" ON "public"."community_answer" FOR SELECT USING (("auth"."uid"() IS NOT NULL));

CREATE POLICY "Authenticated users can SELECT" ON "public"."community_question" FOR SELECT USING (("auth"."uid"() IS NOT NULL));

CREATE POLICY "Authenticated users can SELECT" ON "public"."lesson_language_history" FOR SELECT USING (("auth"."uid"() IS NOT NULL));

CREATE POLICY "Authenticated users can SELECT" ON "public"."quiz" FOR SELECT TO "authenticated" USING (true);

CREATE POLICY "Authenticated users can SELECT" ON "public"."quiz_play" FOR SELECT TO "authenticated" USING (true);

CREATE POLICY "Authenticated users can SELECT" ON "public"."submissionstatus" FOR SELECT TO "authenticated" USING (true);

CREATE POLICY "Authenticated users can delete" ON "public"."organization" FOR DELETE USING (("auth"."uid"() IS NOT NULL));

CREATE POLICY "Authenticated users can read" ON "public"."apps_poll_submission" FOR SELECT USING (("auth"."uid"() IS NOT NULL));

CREATE POLICY "Delete only your own comment" ON "public"."lesson_comment" FOR DELETE USING (("auth"."uid"() = ( SELECT "groupmember"."profile_id"
   FROM "public"."groupmember"
  WHERE ("groupmember"."id" = "lesson_comment"."groupmember_id"))));

CREATE POLICY "Delete only your own poll" ON "public"."apps_poll" FOR DELETE USING (("auth"."uid"() = ( SELECT "groupmember"."profile_id"
   FROM "public"."groupmember"
  WHERE ("groupmember"."id" = "apps_poll"."authorId"))));

CREATE POLICY "Delete your own" ON "public"."course_newsfeed_comment" FOR DELETE USING (("auth"."uid"() = ( SELECT "groupmember"."profile_id"
   FROM "public"."groupmember"
  WHERE ("groupmember"."id" = "course_newsfeed_comment"."author_id"))));

CREATE POLICY "Delete your own answer" ON "public"."community_answer" FOR DELETE USING (("auth"."uid"() = "author_profile_id"));

CREATE POLICY "Delete your own comment" ON "public"."course_newsfeed" FOR DELETE USING (("auth"."uid"() = ( SELECT "groupmember"."profile_id"
   FROM "public"."groupmember"
  WHERE ("groupmember"."id" = "course_newsfeed"."author_id"))));

CREATE POLICY "Delete your own question" ON "public"."community_question" FOR DELETE USING (("auth"."uid"() = "author_profile_id"));

CREATE POLICY "Delete your own submission" ON "public"."apps_poll_submission" FOR DELETE USING (("auth"."uid"() = ( SELECT "groupmember"."profile_id"
   FROM "public"."groupmember"
  WHERE ("groupmember"."id" = "apps_poll_submission"."selected_by_id"))));

CREATE POLICY "Enable access to all users" ON "public"."course" FOR SELECT USING (true);

CREATE POLICY "Enable delete for users based on user_id" ON "public"."analytics_login_events" FOR DELETE USING (("auth"."uid"() = "user_id"));

CREATE POLICY "Enable insert for authenticated users only" ON "public"."apps_poll_submission" FOR INSERT TO "authenticated" WITH CHECK (true);

CREATE POLICY "Enable insert for authenticated users only" ON "public"."community_answer" FOR INSERT TO "authenticated" WITH CHECK (true);

CREATE POLICY "Enable insert for authenticated users only" ON "public"."community_question" FOR INSERT TO "authenticated" WITH CHECK (true);

CREATE POLICY "Enable insert for authenticated users only" ON "public"."group" FOR INSERT TO "authenticated" WITH CHECK (true);

CREATE POLICY "Enable insert for authenticated users only" ON "public"."groupmember" FOR INSERT TO "authenticated" WITH CHECK (true);

CREATE POLICY "Enable insert for authenticated users only" ON "public"."organization" FOR INSERT TO "authenticated" WITH CHECK (true);

CREATE POLICY "Enable insert for authenticated users only" ON "public"."organizationmember" FOR INSERT TO "authenticated" WITH CHECK (true);

CREATE POLICY "Enable read access for all users" ON "public"."exercise" FOR SELECT USING (true);

CREATE POLICY "Enable read access for all users" ON "public"."group" FOR SELECT USING (true);

CREATE POLICY "Enable read access for all users" ON "public"."groupmember" FOR SELECT USING (true);

CREATE POLICY "Enable read access for all users" ON "public"."lesson" FOR SELECT USING (true);

CREATE POLICY "Enable read access for all users" ON "public"."lesson_comment" FOR SELECT USING (true);

CREATE POLICY "Enable read access for all users" ON "public"."lesson_completion" FOR SELECT USING (true);

CREATE POLICY "Enable read access for all users" ON "public"."lesson_language" FOR SELECT USING (true);

CREATE POLICY "Enable read access for all users" ON "public"."lesson_section" FOR SELECT USING (true);

CREATE POLICY "Enable read access for all users" ON "public"."organization" FOR SELECT USING (true);

CREATE POLICY "Enable read access for all users" ON "public"."organization_contacts" FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable read access for all users" ON "public"."organization_emaillist" FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable read access for all users" ON "public"."organization_plan" FOR SELECT USING (true);

CREATE POLICY "Enable read access for all users" ON "public"."question_type" FOR SELECT USING (true);

CREATE POLICY "Enable read access for all users" ON "public"."role" FOR SELECT USING (true);

CREATE POLICY "Only admin can delete" ON "public"."organizationmember" FOR DELETE USING ("public"."is_org_admin"());

CREATE POLICY "Only admin can update" ON "public"."organizationmember" FOR UPDATE USING ("public"."is_org_admin"()) WITH CHECK ("public"."is_org_admin"());

CREATE POLICY "Only auth users can read profile" ON "public"."profile" FOR SELECT TO "authenticated", "anon" USING (true);

CREATE POLICY "Only authenticated users can SELECT" ON "public"."submission" FOR SELECT TO "authenticated" USING (true);

CREATE POLICY "Only authenticated users can select." ON "public"."question_answer" FOR SELECT USING (("auth"."uid"() IS NOT NULL));

CREATE POLICY "Only org admins can delete" ON "public"."group" FOR DELETE USING ("public"."is_org_admin"());

CREATE POLICY "Only org admins can update" ON "public"."group" FOR UPDATE USING ("public"."is_org_admin"()) WITH CHECK ("public"."is_org_admin"());

CREATE POLICY "Only user can update their account via email" ON "public"."organizationmember" FOR UPDATE USING (((( SELECT "auth"."jwt"() AS "jwt") ->> 'email'::"text") = "email")) WITH CHECK (((( SELECT "auth"."jwt"() AS "jwt") ->> 'email'::"text") = "email"));

CREATE POLICY "Public profiles are viewable by everyone." ON "public"."profile" FOR SELECT USING (true);

CREATE POLICY "Update only your own" ON "public"."apps_poll" FOR UPDATE USING (("auth"."uid"() = ( SELECT "groupmember"."profile_id"
   FROM "public"."groupmember"
  WHERE ("groupmember"."id" = "apps_poll"."authorId")))) WITH CHECK (("auth"."uid"() = ( SELECT "groupmember"."profile_id"
   FROM "public"."groupmember"
  WHERE ("groupmember"."id" = "apps_poll"."authorId"))));

CREATE POLICY "Update only your own" ON "public"."course_newsfeed" FOR UPDATE USING (("auth"."uid"() = ( SELECT "groupmember"."profile_id"
   FROM "public"."groupmember"
  WHERE ("groupmember"."id" = "course_newsfeed"."author_id")))) WITH CHECK (("auth"."uid"() = ( SELECT "groupmember"."profile_id"
   FROM "public"."groupmember"
  WHERE ("groupmember"."id" = "course_newsfeed"."author_id"))));

CREATE POLICY "Update only your own" ON "public"."course_newsfeed_comment" FOR UPDATE USING (("auth"."uid"() = ( SELECT "groupmember"."profile_id"
   FROM "public"."groupmember"
  WHERE ("groupmember"."id" = "course_newsfeed_comment"."author_id")))) WITH CHECK (("auth"."uid"() = ( SELECT "groupmember"."profile_id"
   FROM "public"."groupmember"
  WHERE ("groupmember"."id" = "course_newsfeed_comment"."author_id"))));

CREATE POLICY "Update only your own" ON "public"."lesson_comment" FOR UPDATE USING (("auth"."uid"() = ( SELECT "groupmember"."profile_id"
   FROM "public"."groupmember"
  WHERE ("groupmember"."id" = "lesson_comment"."groupmember_id")))) WITH CHECK (("auth"."uid"() = ( SELECT "groupmember"."profile_id"
   FROM "public"."groupmember"
  WHERE ("groupmember"."id" = "lesson_comment"."groupmember_id"))));

CREATE POLICY "Update your own answer" ON "public"."community_answer" FOR UPDATE USING (("auth"."uid"() = "author_profile_id")) WITH CHECK (("auth"."uid"() = "author_profile_id"));

CREATE POLICY "Update your own question" ON "public"."community_question" FOR UPDATE USING (("auth"."uid"() = "author_profile_id")) WITH CHECK (("auth"."uid"() = "author_profile_id"));

CREATE POLICY "Update your own submission" ON "public"."apps_poll_submission" FOR UPDATE USING (("auth"."uid"() = ( SELECT "groupmember"."profile_id"
   FROM "public"."groupmember"
  WHERE ("groupmember"."id" = "apps_poll_submission"."selected_by_id")))) WITH CHECK (("auth"."uid"() = ( SELECT "groupmember"."profile_id"
   FROM "public"."groupmember"
  WHERE ("groupmember"."id" = "apps_poll_submission"."selected_by_id"))));

CREATE POLICY "User can only delete their profiles" ON "public"."profile" FOR DELETE USING (("auth"."uid"() = "id"));

CREATE POLICY "User must be a course member to DELETE" ON "public"."submission" FOR DELETE USING ("public"."is_user_in_course_group"(( SELECT "course"."group_id"
   FROM "public"."course"
  WHERE ("course"."id" = "submission"."course_id")
 LIMIT 1)));

CREATE POLICY "User must be a course member to INSERT" ON "public"."apps_poll" FOR INSERT WITH CHECK ("public"."is_user_in_course_group"(( SELECT "groupmember"."group_id"
   FROM "public"."groupmember"
  WHERE ("groupmember"."id" = "apps_poll"."authorId")
 LIMIT 1)));

CREATE POLICY "User must be a course member to INSERT" ON "public"."apps_poll_option" FOR INSERT WITH CHECK ("public"."is_user_in_course_group"(( SELECT "groupmember"."group_id"
   FROM "public"."groupmember"
  WHERE ("groupmember"."id" = ( SELECT "apps_poll"."authorId"
           FROM "public"."apps_poll"
          WHERE ("apps_poll"."id" = "apps_poll_option"."poll_id")
         LIMIT 1))
 LIMIT 1)));

CREATE POLICY "User must be a course member to INSERT" ON "public"."course_newsfeed" FOR INSERT WITH CHECK ("public"."is_user_in_course_group"(( SELECT "course"."group_id"
   FROM "public"."course"
  WHERE ("course"."id" = "course_newsfeed"."course_id")
 LIMIT 1)));

CREATE POLICY "User must be a course member to INSERT" ON "public"."course_newsfeed_comment" FOR INSERT WITH CHECK ("public"."is_user_in_course_group"(( SELECT "course"."group_id"
   FROM "public"."course"
  WHERE ("course"."id" = ( SELECT "course_newsfeed"."course_id"
           FROM "public"."course_newsfeed"
          WHERE ("course_newsfeed"."id" = "course_newsfeed_comment"."course_newsfeed_id")))
 LIMIT 1)));

CREATE POLICY "User must be a course member to INSERT" ON "public"."group_attendance" FOR INSERT WITH CHECK ("public"."is_user_in_course_group"(( SELECT "course"."group_id"
   FROM "public"."course"
  WHERE ("course"."id" = "group_attendance"."course_id")
 LIMIT 1)));

CREATE POLICY "User must be a course member to INSERT" ON "public"."submission" FOR INSERT WITH CHECK ("public"."is_user_in_course_group"(( SELECT "course"."group_id"
   FROM "public"."course"
  WHERE ("course"."id" = "submission"."course_id")
 LIMIT 1)));

CREATE POLICY "User must be a course member to SELECT" ON "public"."course_newsfeed" FOR SELECT USING ("public"."is_user_in_course_group"(( SELECT "course"."group_id"
   FROM "public"."course"
  WHERE ("course"."id" = "course_newsfeed"."course_id")
 LIMIT 1)));

CREATE POLICY "User must be a course member to SELECT" ON "public"."course_newsfeed_comment" FOR SELECT USING ("public"."is_user_in_course_group"(( SELECT "course"."group_id"
   FROM "public"."course"
  WHERE ("course"."id" = ( SELECT "course_newsfeed"."course_id"
           FROM "public"."course_newsfeed"
          WHERE ("course_newsfeed"."id" = "course_newsfeed_comment"."course_newsfeed_id")))
 LIMIT 1)));

CREATE POLICY "User must be a course member to SELECT" ON "public"."group_attendance" FOR SELECT USING ("public"."is_user_in_course_group"(( SELECT "course"."group_id"
   FROM "public"."course"
  WHERE ("course"."id" = "group_attendance"."course_id")
 LIMIT 1)));

CREATE POLICY "User must be a course member to UPDATE" ON "public"."apps_poll_option" FOR UPDATE USING ("public"."is_user_in_course_group"(( SELECT "groupmember"."group_id"
   FROM "public"."groupmember"
  WHERE ("groupmember"."id" = ( SELECT "apps_poll"."authorId"
           FROM "public"."apps_poll"
          WHERE ("apps_poll"."id" = "apps_poll_option"."poll_id")
         LIMIT 1))
 LIMIT 1))) WITH CHECK ("public"."is_user_in_course_group"(( SELECT "groupmember"."group_id"
   FROM "public"."groupmember"
  WHERE ("groupmember"."id" = ( SELECT "apps_poll"."authorId"
           FROM "public"."apps_poll"
          WHERE ("apps_poll"."id" = "apps_poll_option"."poll_id")
         LIMIT 1))
 LIMIT 1)));

CREATE POLICY "User must be a course member to UPDATE" ON "public"."group_attendance" FOR UPDATE USING ("public"."is_user_in_course_group"(( SELECT "course"."group_id"
   FROM "public"."course"
  WHERE ("course"."id" = "group_attendance"."course_id")
 LIMIT 1))) WITH CHECK ("public"."is_user_in_course_group"(( SELECT "course"."group_id"
   FROM "public"."course"
  WHERE ("course"."id" = "group_attendance"."course_id")
 LIMIT 1)));

CREATE POLICY "User must be a course member to UPDATE" ON "public"."submission" FOR UPDATE USING ("public"."is_user_in_course_group"(( SELECT "course"."group_id"
   FROM "public"."course"
  WHERE ("course"."id" = "submission"."course_id")
 LIMIT 1))) WITH CHECK ("public"."is_user_in_course_group"(( SELECT "course"."group_id"
   FROM "public"."course"
  WHERE ("course"."id" = "submission"."course_id")
 LIMIT 1)));

CREATE POLICY "User must be a teacher to DELETE" ON "public"."apps_poll_option" FOR DELETE USING ("public"."is_user_in_group_with_role"(( SELECT "groupmember"."group_id"
   FROM "public"."groupmember"
  WHERE ("groupmember"."id" = ( SELECT "apps_poll"."authorId"
           FROM "public"."apps_poll"
          WHERE ("apps_poll"."id" = "apps_poll_option"."poll_id")
         LIMIT 1))
 LIMIT 1)));

CREATE POLICY "User must be admin to UPDATE" ON "public"."organization" FOR UPDATE USING (("id" IN ( SELECT "organizationmember"."organization_id"
   FROM "public"."organizationmember"
  WHERE (("organizationmember"."profile_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("organizationmember"."role_id" = 1))))) WITH CHECK (("id" IN ( SELECT "organizationmember"."organization_id"
   FROM "public"."organizationmember"
  WHERE (("organizationmember"."profile_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("organizationmember"."role_id" = 1)))));

CREATE POLICY "User must be an course member to DELETE" ON "public"."question_answer" FOR DELETE USING ("public"."is_user_in_course_group"(( SELECT "course"."group_id"
   FROM "public"."course"
  WHERE ("course"."id" = ( SELECT "lesson"."course_id"
           FROM "public"."lesson"
          WHERE ("lesson"."id" = ( SELECT "exercise"."lesson_id"
                   FROM "public"."exercise"
                  WHERE ("exercise"."id" = ( SELECT "question"."exercise_id"
                           FROM "public"."question"
                          WHERE ("question"."id" = "question_answer"."question_id")
                         LIMIT 1))
                 LIMIT 1))
         LIMIT 1))
 LIMIT 1)));

CREATE POLICY "User must be an course member to INSERT" ON "public"."lesson_completion" WITH CHECK ("public"."is_user_in_course_group"(( SELECT "course"."group_id"
   FROM "public"."course"
  WHERE ("course"."id" = ( SELECT "lesson"."course_id"
           FROM "public"."lesson"
          WHERE ("lesson"."id" = "lesson_completion"."lesson_id")
         LIMIT 1))
 LIMIT 1)));

CREATE POLICY "User must be an course member to INSERT" ON "public"."question_answer" FOR INSERT WITH CHECK ("public"."is_user_in_course_group"(( SELECT "course"."group_id"
   FROM "public"."course"
  WHERE ("course"."id" = ( SELECT "lesson"."course_id"
           FROM "public"."lesson"
          WHERE ("lesson"."id" = ( SELECT "exercise"."lesson_id"
                   FROM "public"."exercise"
                  WHERE ("exercise"."id" = ( SELECT "question"."exercise_id"
                           FROM "public"."question"
                          WHERE ("question"."id" = "question_answer"."question_id")
                         LIMIT 1))
                 LIMIT 1))
         LIMIT 1))
 LIMIT 1)));

CREATE POLICY "User must be an course member to UPDATE" ON "public"."question_answer" FOR UPDATE USING ("public"."is_user_in_course_group"(( SELECT "course"."group_id"
   FROM "public"."course"
  WHERE ("course"."id" = ( SELECT "lesson"."course_id"
           FROM "public"."lesson"
          WHERE ("lesson"."id" = ( SELECT "exercise"."lesson_id"
                   FROM "public"."exercise"
                  WHERE ("exercise"."id" = ( SELECT "question"."exercise_id"
                           FROM "public"."question"
                          WHERE ("question"."id" = "question_answer"."question_id")
                         LIMIT 1))
                 LIMIT 1))
         LIMIT 1))
 LIMIT 1))) WITH CHECK ("public"."is_user_in_course_group"(( SELECT "course"."group_id"
   FROM "public"."course"
  WHERE ("course"."id" = ( SELECT "lesson"."course_id"
           FROM "public"."lesson"
          WHERE ("lesson"."id" = ( SELECT "exercise"."lesson_id"
                   FROM "public"."exercise"
                  WHERE ("exercise"."id" = ( SELECT "question"."exercise_id"
                           FROM "public"."question"
                          WHERE ("question"."id" = "question_answer"."question_id")
                         LIMIT 1))
                 LIMIT 1))
         LIMIT 1))
 LIMIT 1)));

CREATE POLICY "User must be an org member to DELETE" ON "public"."course" FOR DELETE USING ("public"."is_user_in_group_with_role"("group_id"));

CREATE POLICY "User must be an org member to DELETE" ON "public"."exercise" FOR DELETE USING ("public"."is_user_in_group_with_role"(( SELECT "course"."group_id"
   FROM "public"."course"
  WHERE ("course"."id" = ( SELECT "lesson"."course_id"
           FROM "public"."lesson"
          WHERE ("lesson"."id" = "exercise"."lesson_id")
         LIMIT 1))
 LIMIT 1)));

CREATE POLICY "User must be an org member to DELETE" ON "public"."group_attendance" FOR DELETE USING ("public"."is_user_in_group_with_role"(( SELECT "course"."group_id"
   FROM "public"."course"
  WHERE ("course"."id" = "group_attendance"."course_id")
 LIMIT 1)));

CREATE POLICY "User must be an org member to DELETE" ON "public"."groupmember" FOR DELETE USING ("public"."is_user_in_group_with_role"("group_id"));

CREATE POLICY "User must be an org member to DELETE" ON "public"."lesson" FOR DELETE USING ("public"."is_user_in_group_with_role"(( SELECT "course"."group_id"
   FROM "public"."course"
  WHERE ("course"."id" = "lesson"."course_id")
 LIMIT 1)));

CREATE POLICY "User must be an org member to DELETE" ON "public"."lesson_completion" FOR DELETE USING ("public"."is_user_in_group_with_role"(( SELECT "course"."group_id"
   FROM "public"."course"
  WHERE ("course"."id" = ( SELECT "lesson"."course_id"
           FROM "public"."lesson"
          WHERE ("lesson"."id" = "lesson_completion"."lesson_id")
         LIMIT 1))
 LIMIT 1)));

CREATE POLICY "User must be an org member to DELETE" ON "public"."lesson_language" FOR DELETE USING ("public"."is_user_in_group_with_role"(( SELECT "course"."group_id"
   FROM "public"."course"
  WHERE ("course"."id" = ( SELECT "lesson"."course_id"
           FROM "public"."lesson"
          WHERE ("lesson"."id" = "lesson_language"."lesson_id")
         LIMIT 1))
 LIMIT 1)));

CREATE POLICY "User must be an org member to DELETE" ON "public"."lesson_language_history" FOR DELETE USING ("public"."is_user_in_group_with_role"(( SELECT "course"."group_id"
   FROM "public"."course"
  WHERE ("course"."id" = ( SELECT "lesson"."course_id"
           FROM "public"."lesson"
          WHERE ("lesson"."id" = ( SELECT "lesson_language"."lesson_id"
                   FROM "public"."lesson_language"
                  WHERE ("lesson_language"."id" = "lesson_language_history"."lesson_language_id")))
         LIMIT 1))
 LIMIT 1)));

CREATE POLICY "User must be an org member to DELETE" ON "public"."lesson_section" FOR DELETE USING ("public"."is_user_in_group_with_role"(( SELECT "course"."group_id"
   FROM "public"."course"
  WHERE ("course"."id" = "lesson_section"."course_id")
 LIMIT 1)));

CREATE POLICY "User must be an org member to DELETE" ON "public"."option" FOR DELETE USING ("public"."is_user_in_group_with_role"(( SELECT "course"."group_id"
   FROM "public"."course"
  WHERE ("course"."id" = ( SELECT "lesson"."course_id"
           FROM "public"."lesson"
          WHERE ("lesson"."id" = ( SELECT "exercise"."lesson_id"
                   FROM "public"."exercise"
                  WHERE ("exercise"."id" = ( SELECT "question"."exercise_id"
                           FROM "public"."question"
                          WHERE ("question"."id" = "option"."question_id")
                         LIMIT 1))
                 LIMIT 1))
         LIMIT 1))
 LIMIT 1)));

CREATE POLICY "User must be an org member to DELETE" ON "public"."organization_plan" FOR DELETE USING ("public"."is_org_member"());

CREATE POLICY "User must be an org member to DELETE" ON "public"."question" FOR DELETE USING ("public"."is_user_in_group_with_role"(( SELECT "course"."group_id"
   FROM "public"."course"
  WHERE ("course"."id" = ( SELECT "lesson"."course_id"
           FROM "public"."lesson"
          WHERE ("lesson"."id" = ( SELECT "exercise"."lesson_id"
                   FROM "public"."exercise"
                  WHERE ("exercise"."id" = "question"."exercise_id")))
         LIMIT 1))
 LIMIT 1)));

CREATE POLICY "User must be an org member to INSERT" ON "public"."course" FOR INSERT WITH CHECK ("public"."is_user_in_group_with_role"("group_id"));

CREATE POLICY "User must be an org member to INSERT" ON "public"."exercise" FOR INSERT WITH CHECK ("public"."is_user_in_group_with_role"(( SELECT "course"."group_id"
   FROM "public"."course"
  WHERE ("course"."id" = ( SELECT "lesson"."course_id"
           FROM "public"."lesson"
          WHERE ("lesson"."id" = "exercise"."lesson_id")
         LIMIT 1))
 LIMIT 1)));

CREATE POLICY "User must be an org member to INSERT" ON "public"."lesson" FOR INSERT WITH CHECK ("public"."is_user_in_group_with_role"(( SELECT "course"."group_id"
   FROM "public"."course"
  WHERE ("course"."id" = "lesson"."course_id")
 LIMIT 1)));

CREATE POLICY "User must be an org member to INSERT" ON "public"."lesson_language" FOR INSERT WITH CHECK ("public"."is_user_in_group_with_role"(( SELECT "course"."group_id"
   FROM "public"."course"
  WHERE ("course"."id" = ( SELECT "lesson"."course_id"
           FROM "public"."lesson"
          WHERE ("lesson"."id" = "lesson_language"."lesson_id")
         LIMIT 1))
 LIMIT 1)));

CREATE POLICY "User must be an org member to INSERT" ON "public"."lesson_language_history" FOR INSERT WITH CHECK ("public"."is_user_in_group_with_role"(( SELECT "course"."group_id"
   FROM "public"."course"
  WHERE ("course"."id" = ( SELECT "lesson"."course_id"
           FROM "public"."lesson"
          WHERE ("lesson"."id" = ( SELECT "lesson_language"."lesson_id"
                   FROM "public"."lesson_language"
                  WHERE ("lesson_language"."id" = "lesson_language_history"."lesson_language_id")))
         LIMIT 1))
 LIMIT 1)));

CREATE POLICY "User must be an org member to INSERT" ON "public"."lesson_section" FOR INSERT WITH CHECK ("public"."is_user_in_group_with_role"(( SELECT "course"."group_id"
   FROM "public"."course"
  WHERE ("course"."id" = "lesson_section"."course_id")
 LIMIT 1)));

CREATE POLICY "User must be an org member to INSERT" ON "public"."option" FOR INSERT WITH CHECK ("public"."is_user_in_group_with_role"(( SELECT "course"."group_id"
   FROM "public"."course"
  WHERE ("course"."id" = ( SELECT "lesson"."course_id"
           FROM "public"."lesson"
          WHERE ("lesson"."id" = ( SELECT "exercise"."lesson_id"
                   FROM "public"."exercise"
                  WHERE ("exercise"."id" = ( SELECT "question"."exercise_id"
                           FROM "public"."question"
                          WHERE ("question"."id" = "option"."question_id")
                         LIMIT 1))
                 LIMIT 1))
         LIMIT 1))
 LIMIT 1)));

CREATE POLICY "User must be an org member to INSERT" ON "public"."organization_plan" FOR INSERT WITH CHECK ("public"."is_org_member"());

CREATE POLICY "User must be an org member to INSERT" ON "public"."question" FOR INSERT WITH CHECK ("public"."is_user_in_group_with_role"(( SELECT "course"."group_id"
   FROM "public"."course"
  WHERE ("course"."id" = ( SELECT "lesson"."course_id"
           FROM "public"."lesson"
          WHERE ("lesson"."id" = ( SELECT "exercise"."lesson_id"
                   FROM "public"."exercise"
                  WHERE ("exercise"."id" = "question"."exercise_id")))
         LIMIT 1))
 LIMIT 1)));

CREATE POLICY "User must be an org member to UPDATE" ON "public"."course" FOR UPDATE USING ("public"."is_user_in_group_with_role"("group_id")) WITH CHECK ("public"."is_user_in_group_with_role"("group_id"));

CREATE POLICY "User must be an org member to UPDATE" ON "public"."exercise" FOR UPDATE USING ("public"."is_user_in_group_with_role"(( SELECT "course"."group_id"
   FROM "public"."course"
  WHERE ("course"."id" = ( SELECT "lesson"."course_id"
           FROM "public"."lesson"
          WHERE ("lesson"."id" = "exercise"."lesson_id")
         LIMIT 1))
 LIMIT 1))) WITH CHECK ("public"."is_user_in_group_with_role"(( SELECT "course"."group_id"
   FROM "public"."course"
  WHERE ("course"."id" = ( SELECT "lesson"."course_id"
           FROM "public"."lesson"
          WHERE ("lesson"."id" = "exercise"."lesson_id")
         LIMIT 1))
 LIMIT 1)));

CREATE POLICY "User must be an org member to UPDATE" ON "public"."groupmember" FOR UPDATE USING ("public"."is_user_in_group_with_role"("group_id")) WITH CHECK ("public"."is_user_in_group_with_role"("group_id"));

CREATE POLICY "User must be an org member to UPDATE" ON "public"."lesson" FOR UPDATE USING ("public"."is_user_in_group_with_role"(( SELECT "course"."group_id"
   FROM "public"."course"
  WHERE ("course"."id" = "lesson"."course_id")
 LIMIT 1))) WITH CHECK ("public"."is_user_in_group_with_role"(( SELECT "course"."group_id"
   FROM "public"."course"
  WHERE ("course"."id" = "lesson"."course_id")
 LIMIT 1)));

CREATE POLICY "User must be an org member to UPDATE" ON "public"."lesson_completion" FOR UPDATE USING ("public"."is_user_in_group_with_role"(( SELECT "course"."group_id"
   FROM "public"."course"
  WHERE ("course"."id" = ( SELECT "lesson"."course_id"
           FROM "public"."lesson"
          WHERE ("lesson"."id" = "lesson_completion"."lesson_id")
         LIMIT 1))
 LIMIT 1))) WITH CHECK ("public"."is_user_in_group_with_role"(( SELECT "course"."group_id"
   FROM "public"."course"
  WHERE ("course"."id" = ( SELECT "lesson"."course_id"
           FROM "public"."lesson"
          WHERE ("lesson"."id" = "lesson_completion"."lesson_id")
         LIMIT 1))
 LIMIT 1)));

CREATE POLICY "User must be an org member to UPDATE" ON "public"."lesson_language" FOR UPDATE USING ("public"."is_user_in_group_with_role"(( SELECT "course"."group_id"
   FROM "public"."course"
  WHERE ("course"."id" = ( SELECT "lesson"."course_id"
           FROM "public"."lesson"
          WHERE ("lesson"."id" = "lesson_language"."lesson_id")
         LIMIT 1))
 LIMIT 1))) WITH CHECK ("public"."is_user_in_group_with_role"(( SELECT "course"."group_id"
   FROM "public"."course"
  WHERE ("course"."id" = ( SELECT "lesson"."course_id"
           FROM "public"."lesson"
          WHERE ("lesson"."id" = "lesson_language"."lesson_id")
         LIMIT 1))
 LIMIT 1)));

CREATE POLICY "User must be an org member to UPDATE" ON "public"."lesson_language_history" FOR UPDATE USING ("public"."is_user_in_group_with_role"(( SELECT "course"."group_id"
   FROM "public"."course"
  WHERE ("course"."id" = ( SELECT "lesson"."course_id"
           FROM "public"."lesson"
          WHERE ("lesson"."id" = ( SELECT "lesson_language"."lesson_id"
                   FROM "public"."lesson_language"
                  WHERE ("lesson_language"."id" = "lesson_language_history"."lesson_language_id")))
         LIMIT 1))
 LIMIT 1))) WITH CHECK ("public"."is_user_in_group_with_role"(( SELECT "course"."group_id"
   FROM "public"."course"
  WHERE ("course"."id" = ( SELECT "lesson"."course_id"
           FROM "public"."lesson"
          WHERE ("lesson"."id" = ( SELECT "lesson_language"."lesson_id"
                   FROM "public"."lesson_language"
                  WHERE ("lesson_language"."id" = "lesson_language_history"."lesson_language_id")))
         LIMIT 1))
 LIMIT 1)));

CREATE POLICY "User must be an org member to UPDATE" ON "public"."lesson_section" FOR UPDATE USING ("public"."is_user_in_group_with_role"(( SELECT "course"."group_id"
   FROM "public"."course"
  WHERE ("course"."id" = "lesson_section"."course_id")
 LIMIT 1))) WITH CHECK ("public"."is_user_in_group_with_role"(( SELECT "course"."group_id"
   FROM "public"."course"
  WHERE ("course"."id" = "lesson_section"."course_id")
 LIMIT 1)));

CREATE POLICY "User must be an org member to UPDATE" ON "public"."option" FOR UPDATE USING ("public"."is_user_in_group_with_role"(( SELECT "course"."group_id"
   FROM "public"."course"
  WHERE ("course"."id" = ( SELECT "lesson"."course_id"
           FROM "public"."lesson"
          WHERE ("lesson"."id" = ( SELECT "exercise"."lesson_id"
                   FROM "public"."exercise"
                  WHERE ("exercise"."id" = ( SELECT "question"."exercise_id"
                           FROM "public"."question"
                          WHERE ("question"."id" = "option"."question_id")
                         LIMIT 1))
                 LIMIT 1))
         LIMIT 1))
 LIMIT 1))) WITH CHECK ("public"."is_user_in_group_with_role"(( SELECT "course"."group_id"
   FROM "public"."course"
  WHERE ("course"."id" = ( SELECT "lesson"."course_id"
           FROM "public"."lesson"
          WHERE ("lesson"."id" = ( SELECT "exercise"."lesson_id"
                   FROM "public"."exercise"
                  WHERE ("exercise"."id" = ( SELECT "question"."exercise_id"
                           FROM "public"."question"
                          WHERE ("question"."id" = "option"."question_id")
                         LIMIT 1))
                 LIMIT 1))
         LIMIT 1))
 LIMIT 1)));

CREATE POLICY "User must be an org member to UPDATE" ON "public"."organization_plan" FOR UPDATE USING ("public"."is_org_member"()) WITH CHECK ("public"."is_org_member"());

CREATE POLICY "User must be an org member to UPDATE" ON "public"."question" FOR UPDATE USING ("public"."is_user_in_group_with_role"(( SELECT "course"."group_id"
   FROM "public"."course"
  WHERE ("course"."id" = ( SELECT "lesson"."course_id"
           FROM "public"."lesson"
          WHERE ("lesson"."id" = ( SELECT "exercise"."lesson_id"
                   FROM "public"."exercise"
                  WHERE ("exercise"."id" = "question"."exercise_id")))
         LIMIT 1))
 LIMIT 1))) WITH CHECK ("public"."is_user_in_group_with_role"(( SELECT "course"."group_id"
   FROM "public"."course"
  WHERE ("course"."id" = ( SELECT "lesson"."course_id"
           FROM "public"."lesson"
          WHERE ("lesson"."id" = ( SELECT "exercise"."lesson_id"
                   FROM "public"."exercise"
                  WHERE ("exercise"."id" = "question"."exercise_id")))
         LIMIT 1))
 LIMIT 1)));

CREATE POLICY "User must be course member to SELECT" ON "public"."apps_poll" FOR SELECT USING ("public"."is_user_in_course_group"(( SELECT "groupmember"."group_id"
   FROM "public"."groupmember"
  WHERE ("groupmember"."id" = "apps_poll"."authorId")
 LIMIT 1)));

CREATE POLICY "User must be course member to SELECT" ON "public"."apps_poll_option" FOR SELECT USING ("public"."is_user_in_course_group"(( SELECT "groupmember"."group_id"
   FROM "public"."groupmember"
  WHERE ("groupmember"."id" = ( SELECT "apps_poll"."authorId"
           FROM "public"."apps_poll"
          WHERE ("apps_poll"."id" = "apps_poll_option"."poll_id")
         LIMIT 1))
 LIMIT 1)));

CREATE POLICY "User must be in course group to INSERT" ON "public"."lesson_comment" FOR INSERT WITH CHECK ("public"."is_user_in_course_group"(( SELECT "course"."group_id"
   FROM "public"."course"
  WHERE ("course"."id" = ( SELECT "lesson"."course_id"
           FROM "public"."lesson"
          WHERE ("lesson"."id" = "lesson_comment"."lesson_id")
         LIMIT 1))
 LIMIT 1)));

CREATE POLICY "Users can insert their own login events" ON "public"."analytics_login_events" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "user_id"));

CREATE POLICY "Users can insert their own profile." ON "public"."profile" FOR INSERT WITH CHECK (("auth"."uid"() = "id"));

CREATE POLICY "Users can update own profile." ON "public"."profile" FOR UPDATE USING (("auth"."uid"() = "id"));

ALTER TABLE "public"."analytics_login_events" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."apps_poll" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."apps_poll_option" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."apps_poll_submission" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."community_answer" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."community_question" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."course" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."course_newsfeed" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."course_newsfeed_comment" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."currency" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."exercise" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."group" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."group_attendance" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."groupmember" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."lesson" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."lesson_comment" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."lesson_completion" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."lesson_language" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."lesson_language_history" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."lesson_section" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."option" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."organization" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."organization_contacts" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."organization_emaillist" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."organization_plan" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."organizationmember" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."profile" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."question" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."question_answer" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."question_type" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."quiz" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."quiz_play" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."role" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."submission" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."submissionstatus" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."test_tenant" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."video_transcripts" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."waitinglist" ENABLE ROW LEVEL SECURITY;

ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";

REVOKE USAGE ON SCHEMA "public" FROM PUBLIC;
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";
GRANT ALL ON SCHEMA "public" TO PUBLIC;

GRANT ALL ON FUNCTION "public"."add_them"("a" integer, "b" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."add_them"("a" integer, "b" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."add_them"("a" integer, "b" integer) TO "service_role";

GRANT ALL ON FUNCTION "public"."check_if_student_completed_exercises"("lesson_id_arg" "uuid", "groupmember_id_arg" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."check_if_student_completed_exercises"("lesson_id_arg" "uuid", "groupmember_id_arg" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_if_student_completed_exercises"("lesson_id_arg" "uuid", "groupmember_id_arg" "uuid") TO "service_role";

GRANT ALL ON FUNCTION "public"."convert_course_to_v2"("course_id_arg" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."convert_course_to_v2"("course_id_arg" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."convert_course_to_v2"("course_id_arg" "uuid") TO "service_role";

GRANT ALL ON FUNCTION "public"."get_course_progress"("course_id_arg" "uuid", "profile_id_arg" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_course_progress"("course_id_arg" "uuid", "profile_id_arg" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_course_progress"("course_id_arg" "uuid", "profile_id_arg" "uuid") TO "service_role";

GRANT ALL ON FUNCTION "public"."get_courses"("org_id_arg" "uuid", "profile_id_arg" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_courses"("org_id_arg" "uuid", "profile_id_arg" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_courses"("org_id_arg" "uuid", "profile_id_arg" "uuid") TO "service_role";

GRANT ALL ON FUNCTION "public"."get_dash_org_recent_enrollments"("org_id_arg" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_dash_org_recent_enrollments"("org_id_arg" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_dash_org_recent_enrollments"("org_id_arg" "uuid") TO "service_role";

GRANT ALL ON FUNCTION "public"."get_dash_org_top_courses"("org_id_arg" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_dash_org_top_courses"("org_id_arg" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_dash_org_top_courses"("org_id_arg" "uuid") TO "service_role";

GRANT ALL ON FUNCTION "public"."get_exercises"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_exercises"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_exercises"() TO "service_role";

GRANT ALL ON FUNCTION "public"."get_explore_courses"("org_id_arg" "uuid", "profile_id_arg" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_explore_courses"("org_id_arg" "uuid", "profile_id_arg" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_explore_courses"("org_id_arg" "uuid", "profile_id_arg" "uuid") TO "service_role";

GRANT ALL ON FUNCTION "public"."get_marks"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_marks"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_marks"() TO "service_role";

GRANT ALL ON FUNCTION "public"."get_student_exercises"("org_id_arg" "uuid", "profile_id_arg" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_student_exercises"("org_id_arg" "uuid", "profile_id_arg" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_student_exercises"("org_id_arg" "uuid", "profile_id_arg" "uuid") TO "service_role";

GRANT ALL ON FUNCTION "public"."get_user_upcoming_lessons"("profile_id_arg" "uuid", "org_id_arg" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_upcoming_lessons"("profile_id_arg" "uuid", "org_id_arg" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_upcoming_lessons"("profile_id_arg" "uuid", "org_id_arg" "uuid") TO "service_role";

GRANT ALL ON FUNCTION "public"."insert_login_event_on_user_login"() TO "anon";
GRANT ALL ON FUNCTION "public"."insert_login_event_on_user_login"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."insert_login_event_on_user_login"() TO "service_role";

GRANT ALL ON FUNCTION "public"."insert_login_event_on_user_session_update"() TO "anon";
GRANT ALL ON FUNCTION "public"."insert_login_event_on_user_session_update"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."insert_login_event_on_user_session_update"() TO "service_role";

GRANT ALL ON FUNCTION "public"."is_org_admin"() TO "anon";
GRANT ALL ON FUNCTION "public"."is_org_admin"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_org_admin"() TO "service_role";

GRANT ALL ON FUNCTION "public"."is_org_admin"("org_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."is_org_admin"("org_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_org_admin"("org_id" "uuid") TO "service_role";

GRANT ALL ON FUNCTION "public"."is_org_member"() TO "anon";
GRANT ALL ON FUNCTION "public"."is_org_member"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_org_member"() TO "service_role";

GRANT ALL ON FUNCTION "public"."is_user_in_course_group"("group_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."is_user_in_course_group"("group_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_user_in_course_group"("group_id" "uuid") TO "service_role";

GRANT ALL ON FUNCTION "public"."is_user_in_group_with_role"("group_id" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."is_user_in_group_with_role"("group_id" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_user_in_group_with_role"("group_id" integer) TO "service_role";

GRANT ALL ON FUNCTION "public"."is_user_in_group_with_role"("group_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."is_user_in_group_with_role"("group_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_user_in_group_with_role"("group_id" "uuid") TO "service_role";

GRANT ALL ON FUNCTION "public"."update_lesson_language_history"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_lesson_language_history"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_lesson_language_history"() TO "service_role";

GRANT ALL ON TABLE "public"."analytics_login_events" TO "anon";
GRANT ALL ON TABLE "public"."analytics_login_events" TO "authenticated";
GRANT ALL ON TABLE "public"."analytics_login_events" TO "service_role";

GRANT ALL ON TABLE "public"."apps_poll" TO "anon";
GRANT ALL ON TABLE "public"."apps_poll" TO "authenticated";
GRANT ALL ON TABLE "public"."apps_poll" TO "service_role";

GRANT ALL ON TABLE "public"."apps_poll_option" TO "anon";
GRANT ALL ON TABLE "public"."apps_poll_option" TO "authenticated";
GRANT ALL ON TABLE "public"."apps_poll_option" TO "service_role";

GRANT ALL ON SEQUENCE "public"."apps_poll_option_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."apps_poll_option_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."apps_poll_option_id_seq" TO "service_role";

GRANT ALL ON TABLE "public"."apps_poll_submission" TO "anon";
GRANT ALL ON TABLE "public"."apps_poll_submission" TO "authenticated";
GRANT ALL ON TABLE "public"."apps_poll_submission" TO "service_role";

GRANT ALL ON SEQUENCE "public"."apps_poll_submision_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."apps_poll_submision_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."apps_poll_submision_id_seq" TO "service_role";

GRANT ALL ON TABLE "public"."community_answer" TO "anon";
GRANT ALL ON TABLE "public"."community_answer" TO "authenticated";
GRANT ALL ON TABLE "public"."community_answer" TO "service_role";

GRANT ALL ON TABLE "public"."community_question" TO "anon";
GRANT ALL ON TABLE "public"."community_question" TO "authenticated";
GRANT ALL ON TABLE "public"."community_question" TO "service_role";

GRANT ALL ON SEQUENCE "public"."community_question_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."community_question_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."community_question_id_seq" TO "service_role";

GRANT ALL ON TABLE "public"."course" TO "anon";
GRANT ALL ON TABLE "public"."course" TO "authenticated";
GRANT ALL ON TABLE "public"."course" TO "service_role";

GRANT ALL ON TABLE "public"."course_newsfeed" TO "anon";
GRANT ALL ON TABLE "public"."course_newsfeed" TO "authenticated";
GRANT ALL ON TABLE "public"."course_newsfeed" TO "service_role";

GRANT ALL ON TABLE "public"."course_newsfeed_comment" TO "anon";
GRANT ALL ON TABLE "public"."course_newsfeed_comment" TO "authenticated";
GRANT ALL ON TABLE "public"."course_newsfeed_comment" TO "service_role";

GRANT ALL ON SEQUENCE "public"."course_newsfeed_comment_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."course_newsfeed_comment_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."course_newsfeed_comment_id_seq" TO "service_role";

GRANT ALL ON TABLE "public"."currency" TO "anon";
GRANT ALL ON TABLE "public"."currency" TO "authenticated";
GRANT ALL ON TABLE "public"."currency" TO "service_role";

GRANT ALL ON SEQUENCE "public"."currency_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."currency_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."currency_id_seq" TO "service_role";

GRANT ALL ON TABLE "public"."group" TO "anon";
GRANT ALL ON TABLE "public"."group" TO "authenticated";
GRANT ALL ON TABLE "public"."group" TO "service_role";

GRANT ALL ON TABLE "public"."groupmember" TO "anon";
GRANT ALL ON TABLE "public"."groupmember" TO "authenticated";
GRANT ALL ON TABLE "public"."groupmember" TO "service_role";

GRANT ALL ON TABLE "public"."dash_org_stats" TO "anon";
GRANT ALL ON TABLE "public"."dash_org_stats" TO "authenticated";
GRANT ALL ON TABLE "public"."dash_org_stats" TO "service_role";

GRANT ALL ON TABLE "public"."exercise" TO "anon";
GRANT ALL ON TABLE "public"."exercise" TO "authenticated";
GRANT ALL ON TABLE "public"."exercise" TO "service_role";

GRANT ALL ON TABLE "public"."group_attendance" TO "anon";
GRANT ALL ON TABLE "public"."group_attendance" TO "authenticated";
GRANT ALL ON TABLE "public"."group_attendance" TO "service_role";

GRANT ALL ON SEQUENCE "public"."group_attendance_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."group_attendance_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."group_attendance_id_seq" TO "service_role";

GRANT ALL ON TABLE "public"."lesson" TO "anon";
GRANT ALL ON TABLE "public"."lesson" TO "authenticated";
GRANT ALL ON TABLE "public"."lesson" TO "service_role";

GRANT ALL ON TABLE "public"."lesson_comment" TO "anon";
GRANT ALL ON TABLE "public"."lesson_comment" TO "authenticated";
GRANT ALL ON TABLE "public"."lesson_comment" TO "service_role";

GRANT ALL ON SEQUENCE "public"."lesson_comment_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."lesson_comment_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."lesson_comment_id_seq" TO "service_role";

GRANT ALL ON TABLE "public"."lesson_completion" TO "anon";
GRANT ALL ON TABLE "public"."lesson_completion" TO "authenticated";
GRANT ALL ON TABLE "public"."lesson_completion" TO "service_role";

GRANT ALL ON SEQUENCE "public"."lesson_completion_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."lesson_completion_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."lesson_completion_id_seq" TO "service_role";

GRANT ALL ON TABLE "public"."lesson_language" TO "anon";
GRANT ALL ON TABLE "public"."lesson_language" TO "authenticated";
GRANT ALL ON TABLE "public"."lesson_language" TO "service_role";

GRANT ALL ON TABLE "public"."lesson_language_history" TO "anon";
GRANT ALL ON TABLE "public"."lesson_language_history" TO "authenticated";
GRANT ALL ON TABLE "public"."lesson_language_history" TO "service_role";

GRANT ALL ON SEQUENCE "public"."lesson_language_history_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."lesson_language_history_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."lesson_language_history_id_seq" TO "service_role";

GRANT ALL ON SEQUENCE "public"."lesson_language_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."lesson_language_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."lesson_language_id_seq" TO "service_role";

GRANT ALL ON TABLE "public"."lesson_section" TO "anon";
GRANT ALL ON TABLE "public"."lesson_section" TO "authenticated";
GRANT ALL ON TABLE "public"."lesson_section" TO "service_role";

GRANT ALL ON TABLE "public"."lesson_versions" TO "anon";
GRANT ALL ON TABLE "public"."lesson_versions" TO "authenticated";
GRANT ALL ON TABLE "public"."lesson_versions" TO "service_role";

GRANT ALL ON TABLE "public"."option" TO "anon";
GRANT ALL ON TABLE "public"."option" TO "authenticated";
GRANT ALL ON TABLE "public"."option" TO "service_role";

GRANT ALL ON SEQUENCE "public"."option_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."option_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."option_id_seq" TO "service_role";

GRANT ALL ON TABLE "public"."organization" TO "anon";
GRANT ALL ON TABLE "public"."organization" TO "authenticated";
GRANT ALL ON TABLE "public"."organization" TO "service_role";

GRANT ALL ON TABLE "public"."organization_contacts" TO "anon";
GRANT ALL ON TABLE "public"."organization_contacts" TO "authenticated";
GRANT ALL ON TABLE "public"."organization_contacts" TO "service_role";

GRANT ALL ON SEQUENCE "public"."organization_contacts_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."organization_contacts_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."organization_contacts_id_seq" TO "service_role";

GRANT ALL ON TABLE "public"."organization_emaillist" TO "anon";
GRANT ALL ON TABLE "public"."organization_emaillist" TO "authenticated";
GRANT ALL ON TABLE "public"."organization_emaillist" TO "service_role";

GRANT ALL ON SEQUENCE "public"."organization_emaillist_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."organization_emaillist_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."organization_emaillist_id_seq" TO "service_role";

GRANT ALL ON TABLE "public"."organization_plan" TO "anon";
GRANT ALL ON TABLE "public"."organization_plan" TO "authenticated";
GRANT ALL ON TABLE "public"."organization_plan" TO "service_role";

GRANT ALL ON SEQUENCE "public"."organization_plan_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."organization_plan_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."organization_plan_id_seq" TO "service_role";

GRANT ALL ON TABLE "public"."organizationmember" TO "anon";
GRANT ALL ON TABLE "public"."organizationmember" TO "authenticated";
GRANT ALL ON TABLE "public"."organizationmember" TO "service_role";

GRANT ALL ON SEQUENCE "public"."organizationmember_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."organizationmember_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."organizationmember_id_seq" TO "service_role";

GRANT ALL ON TABLE "public"."quiz_play" TO "anon";
GRANT ALL ON TABLE "public"."quiz_play" TO "authenticated";
GRANT ALL ON TABLE "public"."quiz_play" TO "service_role";

GRANT ALL ON SEQUENCE "public"."play_quiz_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."play_quiz_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."play_quiz_id_seq" TO "service_role";

GRANT ALL ON TABLE "public"."profile" TO "anon";
GRANT ALL ON TABLE "public"."profile" TO "authenticated";
GRANT ALL ON TABLE "public"."profile" TO "service_role";

GRANT ALL ON TABLE "public"."question" TO "anon";
GRANT ALL ON TABLE "public"."question" TO "authenticated";
GRANT ALL ON TABLE "public"."question" TO "service_role";

GRANT ALL ON TABLE "public"."question_answer" TO "anon";
GRANT ALL ON TABLE "public"."question_answer" TO "authenticated";
GRANT ALL ON TABLE "public"."question_answer" TO "service_role";

GRANT ALL ON SEQUENCE "public"."question_answer_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."question_answer_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."question_answer_id_seq" TO "service_role";

GRANT ALL ON SEQUENCE "public"."question_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."question_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."question_id_seq" TO "service_role";

GRANT ALL ON TABLE "public"."question_type" TO "anon";
GRANT ALL ON TABLE "public"."question_type" TO "authenticated";
GRANT ALL ON TABLE "public"."question_type" TO "service_role";

GRANT ALL ON SEQUENCE "public"."question_type_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."question_type_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."question_type_id_seq" TO "service_role";

GRANT ALL ON TABLE "public"."quiz" TO "anon";
GRANT ALL ON TABLE "public"."quiz" TO "authenticated";
GRANT ALL ON TABLE "public"."quiz" TO "service_role";

GRANT ALL ON TABLE "public"."role" TO "anon";
GRANT ALL ON TABLE "public"."role" TO "authenticated";
GRANT ALL ON TABLE "public"."role" TO "service_role";

GRANT ALL ON SEQUENCE "public"."role_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."role_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."role_id_seq" TO "service_role";

GRANT ALL ON TABLE "public"."submission" TO "anon";
GRANT ALL ON TABLE "public"."submission" TO "authenticated";
GRANT ALL ON TABLE "public"."submission" TO "service_role";

GRANT ALL ON TABLE "public"."submissionstatus" TO "anon";
GRANT ALL ON TABLE "public"."submissionstatus" TO "authenticated";
GRANT ALL ON TABLE "public"."submissionstatus" TO "service_role";

GRANT ALL ON SEQUENCE "public"."submission_status_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."submission_status_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."submission_status_id_seq" TO "service_role";

GRANT ALL ON TABLE "public"."test_tenant" TO "anon";
GRANT ALL ON TABLE "public"."test_tenant" TO "authenticated";
GRANT ALL ON TABLE "public"."test_tenant" TO "service_role";

GRANT ALL ON SEQUENCE "public"."test_tenant_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."test_tenant_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."test_tenant_id_seq" TO "service_role";

GRANT ALL ON TABLE "public"."video_transcripts" TO "anon";
GRANT ALL ON TABLE "public"."video_transcripts" TO "authenticated";
GRANT ALL ON TABLE "public"."video_transcripts" TO "service_role";

GRANT ALL ON SEQUENCE "public"."video_transcripts_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."video_transcripts_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."video_transcripts_id_seq" TO "service_role";

GRANT ALL ON TABLE "public"."waitinglist" TO "anon";
GRANT ALL ON TABLE "public"."waitinglist" TO "authenticated";
GRANT ALL ON TABLE "public"."waitinglist" TO "service_role";

GRANT ALL ON SEQUENCE "public"."waitinglist_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."waitinglist_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."waitinglist_id_seq" TO "service_role";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "service_role";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "service_role";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "service_role";

RESET ALL;

--
-- Dumped schema changes for auth and storage
--

CREATE OR REPLACE TRIGGER "insert_login_event_on_user_login_trigger" AFTER UPDATE OF "last_sign_in_at" ON "auth"."users" FOR EACH ROW EXECUTE FUNCTION "public"."insert_login_event_on_user_login"();

CREATE OR REPLACE TRIGGER "insert_login_event_on_user_session_update_trigger" AFTER UPDATE OF "updated_at" ON "auth"."sessions" FOR EACH ROW EXECUTE FUNCTION "public"."insert_login_event_on_user_session_update"();

CREATE POLICY "Anyone can update an avatar. 1oj01fe_0" ON "storage"."objects" FOR SELECT USING (("bucket_id" = 'avatars'::"text"));

CREATE POLICY "Anyone can update an avatar. 1oj01fe_1" ON "storage"."objects" FOR INSERT WITH CHECK (("bucket_id" = 'avatars'::"text"));

CREATE POLICY "Avatar images are publicly accessible 1oj01fe_0" ON "storage"."objects" FOR SELECT USING (("bucket_id" = 'avatars'::"text"));

