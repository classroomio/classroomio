
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

CREATE EXTENSION IF NOT EXISTS "moddatetime" WITH SCHEMA "extensions";

CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";

CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";

CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";

CREATE EXTENSION IF NOT EXISTS "pgjwt" WITH SCHEMA "extensions";

CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";

CREATE EXTENSION IF NOT EXISTS "vector" WITH SCHEMA "extensions";

CREATE OR REPLACE FUNCTION "public"."add_them"("a" integer, "b" integer) RETURNS integer
    LANGUAGE "sql" IMMUTABLE
    AS $$
 SELECT a + b;
$$;

ALTER FUNCTION "public"."add_them"("a" integer, "b" integer) OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."get_courses"("org_id_arg" "uuid", "profile_id_arg" "uuid") RETURNS TABLE("id" "uuid", "org_id" "uuid", "title" character varying, "slug" character varying, "description" character varying, "logo" "text", "banner_image" "text", "cost" bigint, "currency" character varying, "is_published" boolean, "profile_id" "uuid", "role_id" bigint, "total_lessons" bigint, "progress_rate" bigint)
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  Return query
  select course.id, organization.id AS org_id, course.title, course.slug, course.description, course.logo, course.banner_image, course.cost, course.currency, course.is_published, groupmember.profile_id, groupmember.role_id, (select COUNT(*) from lesson as l where l.course_id = course.id) AS total_lessons, (select COUNT(*) from lesson_completion as lc join lesson as l on l.id = lc.lesson_id where l.course_id = course.id and lc.is_complete = true and lc.profile_id = profile_id_arg) AS progress_rate
  from course
  join "group" on "group".id = course.group_id
  join groupmember on groupmember.group_id = course.group_id
  join organization on organization.id = "group".organization_id
  where course.status = 'ACTIVE' AND organization.id = org_id_arg
  -- GROUP BY course.id, groupmember.profile_id
  ORDER BY course.created_at DESC;
END;
$$;

ALTER FUNCTION "public"."get_courses"("org_id_arg" "uuid", "profile_id_arg" "uuid") OWNER TO "postgres";

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

SET default_tablespace = '';

SET default_table_access_method = "heap";

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
    "votes" bigint
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
    "slug" "text"
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
    "currency" character varying DEFAULT 'NGN'::character varying NOT NULL,
    "banner_image" "text",
    "is_published" boolean DEFAULT false,
    "is_certificate_downloadable" boolean DEFAULT false,
    "certificate_theme" "text",
    "status" "text" DEFAULT 'ACTIVE'::"text" NOT NULL
);

ALTER TABLE "public"."course" OWNER TO "postgres";

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

CREATE TABLE IF NOT EXISTS "public"."group" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "name" character varying NOT NULL,
    "description" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "organization_id" "uuid"
);

ALTER TABLE "public"."group" OWNER TO "postgres";

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
    "videos" "jsonb" DEFAULT '[]'::"jsonb"
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
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
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
    "avatar_url" "text" NULL DEFAULT ''::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "email" character varying,
    "can_add_course" boolean DEFAULT true,
    "role" character varying,
    "goal" character varying,
    "source" character varying,
    "metadata" "json",
    "telegram_chat_id" bigint
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
    "course_id" "uuid"
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

ALTER TABLE ONLY "public"."lesson"
    ADD CONSTRAINT "lesson_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."option"
    ADD CONSTRAINT "option_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."organization_contacts"
    ADD CONSTRAINT "organization_contacts_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."organization_emaillist"
    ADD CONSTRAINT "organization_emaillist_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."organization"
    ADD CONSTRAINT "organization_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."organization"
    ADD CONSTRAINT "organization_siteName_key" UNIQUE ("siteName");

ALTER TABLE ONLY "public"."organizationmember"
    ADD CONSTRAINT "organizationmember_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."quiz_play"
    ADD CONSTRAINT "play_quiz_pkey" PRIMARY KEY ("id");

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

CREATE OR REPLACE TRIGGER "handle_exercise_updated_at" BEFORE UPDATE ON "public"."exercise" FOR EACH ROW EXECUTE FUNCTION "extensions"."moddatetime"('updated_at');

CREATE OR REPLACE TRIGGER "handle_lesson_updated_at" BEFORE UPDATE ON "public"."lesson" FOR EACH ROW EXECUTE FUNCTION "extensions"."moddatetime"('updated_at');

CREATE OR REPLACE TRIGGER "handle_question_type_updated_at" BEFORE UPDATE ON "public"."question_type" FOR EACH ROW EXECUTE FUNCTION "extensions"."moddatetime"('updated_at');

CREATE OR REPLACE TRIGGER "handle_question_updated_at" BEFORE UPDATE ON "public"."question" FOR EACH ROW EXECUTE FUNCTION "extensions"."moddatetime"('updated_at');

CREATE OR REPLACE TRIGGER "handle_role_updated_at" BEFORE UPDATE ON "public"."role" FOR EACH ROW EXECUTE FUNCTION "extensions"."moddatetime"('updated_at');

CREATE OR REPLACE TRIGGER "handle_submission_updated_at" BEFORE UPDATE ON "public"."submission" FOR EACH ROW EXECUTE FUNCTION "extensions"."moddatetime"('updated_at');

CREATE OR REPLACE TRIGGER "handle_updated_at" BEFORE UPDATE ON "public"."exercise" FOR EACH ROW EXECUTE FUNCTION "extensions"."moddatetime"('updated_at');

CREATE OR REPLACE TRIGGER "handle_updated_at" BEFORE UPDATE ON "public"."lesson" FOR EACH ROW EXECUTE FUNCTION "extensions"."moddatetime"('updated_at');

CREATE OR REPLACE TRIGGER "handle_updated_at" BEFORE UPDATE ON "public"."question" FOR EACH ROW EXECUTE FUNCTION "extensions"."moddatetime"('updated_at');

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
    ADD CONSTRAINT "community_answer_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "public"."community_question"("id");

ALTER TABLE ONLY "public"."community_question"
    ADD CONSTRAINT "community_question_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "public"."organizationmember"("id");

ALTER TABLE ONLY "public"."community_question"
    ADD CONSTRAINT "community_question_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id");

ALTER TABLE ONLY "public"."course"
    ADD CONSTRAINT "course_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "public"."group"("id");

ALTER TABLE ONLY "public"."exercise"
    ADD CONSTRAINT "exercise_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "public"."lesson"("id");

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
    ADD CONSTRAINT "lesson_comment_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "public"."lesson"("id");

ALTER TABLE ONLY "public"."lesson_completion"
    ADD CONSTRAINT "lesson_completion_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "public"."lesson"("id");

ALTER TABLE ONLY "public"."lesson_completion"
    ADD CONSTRAINT "lesson_completion_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."profile"("id");

ALTER TABLE ONLY "public"."lesson"
    ADD CONSTRAINT "lesson_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "public"."course"("id");

ALTER TABLE ONLY "public"."lesson"
    ADD CONSTRAINT "lesson_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "public"."profile"("id");

ALTER TABLE ONLY "public"."option"
    ADD CONSTRAINT "option_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "public"."question"("id");

ALTER TABLE ONLY "public"."organization_contacts"
    ADD CONSTRAINT "organization_contacts_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id");

ALTER TABLE ONLY "public"."organization_emaillist"
    ADD CONSTRAINT "organization_emaillist_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id");

ALTER TABLE ONLY "public"."organizationmember"
    ADD CONSTRAINT "organizationmember_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id");

ALTER TABLE ONLY "public"."organizationmember"
    ADD CONSTRAINT "organizationmember_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."profile"("id");

ALTER TABLE ONLY "public"."organizationmember"
    ADD CONSTRAINT "organizationmember_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "public"."role"("id");

ALTER TABLE ONLY "public"."profile"
    ADD CONSTRAINT "profile_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id");

ALTER TABLE ONLY "public"."question_answer"
    ADD CONSTRAINT "question_answer_group_member_id_fkey" FOREIGN KEY ("group_member_id") REFERENCES "public"."groupmember"("id");

ALTER TABLE ONLY "public"."question_answer"
    ADD CONSTRAINT "question_answer_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "public"."question"("id");

ALTER TABLE ONLY "public"."question_answer"
    ADD CONSTRAINT "question_answer_submission_id_fkey" FOREIGN KEY ("submission_id") REFERENCES "public"."submission"("id");

ALTER TABLE ONLY "public"."question"
    ADD CONSTRAINT "question_exercise_id_fkey" FOREIGN KEY ("exercise_id") REFERENCES "public"."exercise"("id");

ALTER TABLE ONLY "public"."question"
    ADD CONSTRAINT "question_question_type_id_fkey" FOREIGN KEY ("question_type_id") REFERENCES "public"."question_type"("id");

ALTER TABLE ONLY "public"."quiz"
    ADD CONSTRAINT "quiz_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id");

ALTER TABLE ONLY "public"."quiz_play"
    ADD CONSTRAINT "quiz_play_quiz_id_fkey" FOREIGN KEY ("quiz_id") REFERENCES "public"."quiz"("id");

ALTER TABLE ONLY "public"."submission"
    ADD CONSTRAINT "submission_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "public"."course"("id");

ALTER TABLE ONLY "public"."submission"
    ADD CONSTRAINT "submission_exercise_id_fkey" FOREIGN KEY ("exercise_id") REFERENCES "public"."exercise"("id");

ALTER TABLE ONLY "public"."submission"
    ADD CONSTRAINT "submission_status_id_fkey" FOREIGN KEY ("status_id") REFERENCES "public"."submissionstatus"("id");

ALTER TABLE ONLY "public"."submission"
    ADD CONSTRAINT "submission_submitted_by_fkey" FOREIGN KEY ("submitted_by") REFERENCES "public"."groupmember"("id");

CREATE POLICY "Enable access to all users" ON "public"."course" FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users only" ON "public"."community_question" FOR INSERT TO "authenticated" WITH CHECK (true);

CREATE POLICY "Enable insert for authenticated users only" ON "public"."course" FOR INSERT WITH CHECK (("auth"."role"() = 'authenticated'::"text"));

CREATE POLICY "Enable insert for authenticated users only" ON "public"."lesson_comment" FOR INSERT TO "authenticated" WITH CHECK (true);

CREATE POLICY "Enable read access for all users" ON "public"."lesson_comment" FOR SELECT USING (true);

CREATE POLICY "Enable read access for all users" ON "public"."organization_contacts" FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable read access for all users" ON "public"."organization_emaillist" FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users only" ON "public"."course" FOR UPDATE USING (("auth"."role"() = 'authenticated'::"text")) WITH CHECK (("auth"."role"() = 'authenticated'::"text"));

CREATE POLICY "Public profiles are viewable by everyone." ON "public"."profile" FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile." ON "public"."profile" FOR INSERT WITH CHECK (("auth"."uid"() = "id"));

CREATE POLICY "Users can update own profile." ON "public"."profile" FOR UPDATE USING (("auth"."uid"() = "id"));

ALTER TABLE "public"."currency" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."lesson_comment" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."organization_contacts" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."organization_emaillist" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."profile" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."video_transcripts" ENABLE ROW LEVEL SECURITY;

REVOKE USAGE ON SCHEMA "public" FROM PUBLIC;
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";
GRANT ALL ON SCHEMA "public" TO PUBLIC;

GRANT ALL ON FUNCTION "public"."add_them"("a" integer, "b" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."add_them"("a" integer, "b" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."add_them"("a" integer, "b" integer) TO "service_role";

GRANT ALL ON FUNCTION "public"."get_courses"("org_id_arg" "uuid", "profile_id_arg" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_courses"("org_id_arg" "uuid", "profile_id_arg" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_courses"("org_id_arg" "uuid", "profile_id_arg" "uuid") TO "service_role";

GRANT ALL ON FUNCTION "public"."get_exercises"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_exercises"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_exercises"() TO "service_role";

GRANT ALL ON FUNCTION "public"."get_marks"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_marks"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_marks"() TO "service_role";

GRANT ALL ON FUNCTION "public"."get_student_exercises"("org_id_arg" "uuid", "profile_id_arg" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_student_exercises"("org_id_arg" "uuid", "profile_id_arg" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_student_exercises"("org_id_arg" "uuid", "profile_id_arg" "uuid") TO "service_role";

GRANT ALL ON FUNCTION "public"."get_user_upcoming_lessons"("profile_id_arg" "uuid", "org_id_arg" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_upcoming_lessons"("profile_id_arg" "uuid", "org_id_arg" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_upcoming_lessons"("profile_id_arg" "uuid", "org_id_arg" "uuid") TO "service_role";

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

GRANT ALL ON TABLE "public"."currency" TO "anon";
GRANT ALL ON TABLE "public"."currency" TO "authenticated";
GRANT ALL ON TABLE "public"."currency" TO "service_role";

GRANT ALL ON SEQUENCE "public"."currency_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."currency_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."currency_id_seq" TO "service_role";

GRANT ALL ON TABLE "public"."exercise" TO "anon";
GRANT ALL ON TABLE "public"."exercise" TO "authenticated";
GRANT ALL ON TABLE "public"."exercise" TO "service_role";

GRANT ALL ON TABLE "public"."group" TO "anon";
GRANT ALL ON TABLE "public"."group" TO "authenticated";
GRANT ALL ON TABLE "public"."group" TO "service_role";

GRANT ALL ON TABLE "public"."group_attendance" TO "anon";
GRANT ALL ON TABLE "public"."group_attendance" TO "authenticated";
GRANT ALL ON TABLE "public"."group_attendance" TO "service_role";

GRANT ALL ON SEQUENCE "public"."group_attendance_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."group_attendance_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."group_attendance_id_seq" TO "service_role";

GRANT ALL ON TABLE "public"."groupmember" TO "anon";
GRANT ALL ON TABLE "public"."groupmember" TO "authenticated";
GRANT ALL ON TABLE "public"."groupmember" TO "service_role";

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

INSERT INTO "public"."role" (type, description) VALUES ('ADMIN', 'The main controller');
INSERT INTO "public"."role" (type, description) VALUES ('TUTOR', 'Can make changes to content, courses, but cant control passwords and cant add other tutors');
INSERT INTO "public"."role" (type, description) VALUES ('STUDENT', 'A student role, can interact with application but cant make changes');
INSERT INTO "public"."submissionstatus" (label) VALUES ('Submitted');
INSERT INTO "public"."submissionstatus" (label) VALUES ('In Progress');
INSERT INTO "public"."submissionstatus" (label) VALUES ('Graded');

INSERT INTO "public"."question_type" (label, created_at, updated_at, typename) VALUES ('Single answer', '2021-08-07 18:49:46.246529+00', '2021-08-15 00:57:08.12069+00', 'RADIO');
INSERT INTO "public"."question_type" (label, created_at, updated_at, typename) VALUES ('Multiple answers', '2021-08-07 18:49:46.246529+00', '2021-08-15 00:57:27.935478+00', 'CHECKBOX');
INSERT INTO "public"."question_type" (label, created_at, updated_at, typename) VALUES ('Paragraph', '2021-08-07 18:49:46.246529+00', '2021-08-15 00:57:38.634665+00', 'TEXTAREA');


-- First, let's check if the constraint 'buckets_owner_fkey' exists before trying to drop it.
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.constraint_column_usage 
               WHERE table_schema = 'storage' 
               AND table_name = 'buckets' 
               AND constraint_name = 'buckets_owner_fkey') THEN
        ALTER TABLE "storage"."buckets" DROP CONSTRAINT "buckets_owner_fkey";
    END IF;
END
$$;

-- Now, we check if the column 'owner_id' exists in 'buckets' before trying to add it.
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'storage' 
                   AND table_name = 'buckets' 
                   AND column_name = 'owner_id') THEN
        ALTER TABLE "storage"."buckets" ADD COLUMN "owner_id" text;
    END IF;
END
$$;

-- Similarly, check if 'owner_id' exists in 'objects' before adding it.
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'storage' 
                   AND table_name = 'objects' 
                   AND column_name = 'owner_id') THEN
        ALTER TABLE "storage"."objects" ADD COLUMN "owner_id" text;
    END IF;
END
$$;


create policy "Anyone can update an avatar. 1oj01fe_0"
on "storage"."objects"
as permissive
for select
to public
using ((bucket_id = 'avatars'::text));


create policy "Anyone can update an avatar. 1oj01fe_1"
on "storage"."objects"
as permissive
for insert
to public
with check ((bucket_id = 'avatars'::text));


create policy "Avatar images are publicly accessible 1oj01fe_0"
on "storage"."objects"
as permissive
for select
to public
using ((bucket_id = 'avatars'::text));

RESET ALL;
