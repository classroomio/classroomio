drop policy "Only user can update their account via email" on "public"."organizationmember";

alter table "public"."lesson_completion" drop constraint "lesson_completion_lesson_id_fkey";

create table "public"."activity_log" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "table_name" text not null,
    "action" text not null,
    "record_id" text,
    "changed_data" jsonb,
    "created_at" timestamp with time zone default now()
);


alter table "public"."course_newsfeed_comment" disable row level security;

alter table "public"."profile" alter column "avatar_url" set default 'https://tapaozmyjsuykgerrfkt.supabase.co/storage/v1/object/public/avatars/avatar.png'::text;

CREATE UNIQUE INDEX activity_log_pkey ON public.activity_log USING btree (id);

alter table "public"."activity_log" add constraint "activity_log_pkey" PRIMARY KEY using index "activity_log_pkey";

alter table "public"."lesson_completion" add constraint "lesson_completion_lesson_id_fkey" FOREIGN KEY (lesson_id) REFERENCES lesson(id) not valid;

alter table "public"."lesson_completion" validate constraint "lesson_completion_lesson_id_fkey";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.get_user_activity(org_id_arg uuid, profile_id_arg uuid)
 RETURNS TABLE(date date, activities json)
 LANGUAGE plpgsql
AS $function$
BEGIN
    -- Check activities only if the user is part of the organization
    -- Aggregate activities from posts
    RETURN QUERY
    SELECT
        course_newsfeed.created_at::DATE AS date,
        json_agg(json_build_object('id', course_newsfeed.id, 'type', 'newsfeed post')) AS activities        
    FROM course_newsfeed
    JOIN groupmember ON course_newsfeed.author_id = groupmember.id
    JOIN organizationmember ON organizationmember.profile_id = groupmember.profile_id
    WHERE groupmember.profile_id = profile_id_arg
    AND organizationmember.organization_id = org_id_arg
    GROUP BY course_newsfeed.created_at::DATE;

    -- Aggregate activities from comments
    RETURN QUERY
    SELECT
        course_newsfeed_comment.created_at::DATE AS date,
        json_agg(json_build_object('id', course_newsfeed_comment.id, 'type', 'comment')) AS activities      
    FROM course_newsfeed_comment
    JOIN groupmember ON course_newsfeed_comment.author_id = groupmember.id
    JOIN organizationmember ON organizationmember.profile_id = groupmember.profile_id
    WHERE groupmember.profile_id = profile_id_arg
    AND organizationmember.organization_id = org_id_arg
    GROUP BY course_newsfeed_comment.created_at::DATE;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_userlog_activity(org_id_arg uuid, profile_id_arg uuid)
 RETURNS TABLE(date date, activities json)
 LANGUAGE plpgsql
AS $function$
BEGIN
    -- First, check if the user is part of the organization
    IF EXISTS (
        SELECT 1 FROM organizationmember
        WHERE organization_id = org_id_arg
        AND profile_id = profile_id_arg
    ) THEN
        -- If the user belongs to the organization, return their activity log

        -- Aggregate activities from the activity_log table
        RETURN QUERY
        SELECT
            created_at::DATE AS date,
            json_agg(
                json_build_object(
                    'id', record_id,
                    'type', table_name,
                    'action', action,
                    'data', changed_data
                )
            ) AS activities
        FROM activity_log
        WHERE user_id = (
            SELECT groupmember.id
            FROM groupmember
            WHERE groupmember.profile_id = profile_id_arg
        )
        AND EXISTS (
            SELECT 1
            FROM organizationmember
            WHERE organization_id = org_id_arg
            AND profile_id = profile_id_arg
        )
        GROUP BY created_at::DATE;

    ELSE
        -- If the user doesn't belong to the organization, raise an exception or return no data
        RAISE EXCEPTION 'User % does not belong to organization %', profile_id_arg, org_id_arg;
    END IF;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.log_user_activity()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
    user_id UUID;
BEGIN
    -- Identify the user column (author_id, submitted_by, created_by, etc.)
    IF TG_TABLE_NAME = 'course_newsfeed' THEN
        user_id := CASE
            WHEN TG_OP = 'DELETE' THEN OLD.author_id  -- Use OLD for DELETE
            ELSE NEW.author_id
        END;
    ELSIF TG_TABLE_NAME = 'course_newsfeed_comment' THEN
        user_id := CASE
            WHEN TG_OP = 'DELETE' THEN OLD.author_id  -- Use OLD for DELETE
            ELSE NEW.author_id
        END;
    ELSIF TG_TABLE_NAME = 'apps_poll_submission' THEN
        user_id := CASE
            WHEN TG_OP = 'DELETE' THEN OLD.selected_by_id  -- Use OLD for DELETE
            ELSE NEW.selected_by_id
        END;
    ELSIF TG_TABLE_NAME = 'submission' THEN
        user_id := CASE
            WHEN TG_OP = 'DELETE' THEN OLD.submitted_by  -- Use OLD for DELETE
            ELSE NEW.submitted_by
        END;

    -- Handling 'lesson_completion' table with backtracking from 'groupmember' table
    ELSIF TG_TABLE_NAME = 'lesson_completion' THEN
        SELECT groupmember.id INTO user_id
        FROM groupmember
        WHERE groupmember.profile_id = (CASE WHEN TG_OP = 'DELETE' THEN OLD.profile_id ELSE NEW.profile_id END);

    -- Handling 'community_answer' table (backtracking using author_profile_id)
    ELSIF TG_TABLE_NAME = 'community_answer' THEN
        SELECT groupmember.id INTO user_id
        FROM groupmember
        WHERE groupmember.profile_id = (CASE WHEN TG_OP = 'DELETE' THEN OLD.author_profile_id ELSE NEW.author_profile_id END);

    -- Handling 'community_question' table (backtracking using author_profile_id)
    ELSIF TG_TABLE_NAME = 'community_question' THEN
        SELECT groupmember.id INTO user_id
        FROM groupmember
        WHERE groupmember.profile_id = (CASE WHEN TG_OP = 'DELETE' THEN OLD.author_profile_id ELSE NEW.author_profile_id END);

    ELSE
        RAISE EXCEPTION 'No user column identified for table %', TG_TABLE_NAME;
    END IF;

    -- Log the activity in the activity_log table
    INSERT INTO activity_log (
        user_id,
        table_name,
        action,
        record_id,
        changed_data
    ) VALUES (
        user_id, -- ID of the user performing the action
        TG_TABLE_NAME, -- table name where the action occurred
        TG_OP, -- type of operation (INSERT, UPDATE, DELETE)
        CASE WHEN TG_OP = 'DELETE' THEN OLD.id ELSE NEW.id END, -- ID of the record
        CASE WHEN TG_OP = 'DELETE' THEN row_to_json(OLD) ELSE row_to_json(NEW) END -- data being logged     
    );

    -- For DELETE, return NULL to indicate the deletion should proceed
    RETURN CASE WHEN TG_OP = 'DELETE' THEN NULL ELSE NEW END;
END;

$function$
;

grant delete on table "public"."activity_log" to "anon";

grant insert on table "public"."activity_log" to "anon";

grant references on table "public"."activity_log" to "anon";

grant select on table "public"."activity_log" to "anon";

grant trigger on table "public"."activity_log" to "anon";

grant truncate on table "public"."activity_log" to "anon";

grant update on table "public"."activity_log" to "anon";

grant delete on table "public"."activity_log" to "authenticated";

grant insert on table "public"."activity_log" to "authenticated";

grant references on table "public"."activity_log" to "authenticated";

grant select on table "public"."activity_log" to "authenticated";

grant trigger on table "public"."activity_log" to "authenticated";

grant truncate on table "public"."activity_log" to "authenticated";

grant update on table "public"."activity_log" to "authenticated";

grant delete on table "public"."activity_log" to "service_role";

grant insert on table "public"."activity_log" to "service_role";

grant references on table "public"."activity_log" to "service_role";

grant select on table "public"."activity_log" to "service_role";

grant trigger on table "public"."activity_log" to "service_role";

grant truncate on table "public"."activity_log" to "service_role";

grant update on table "public"."activity_log" to "service_role";

CREATE TRIGGER track_poll_submission AFTER INSERT ON public.apps_poll_submission FOR EACH ROW EXECUTE FUNCTION log_user_activity();

CREATE TRIGGER track_community_answer AFTER INSERT ON public.community_answer FOR EACH ROW EXECUTE FUNCTION 
log_user_activity();

CREATE TRIGGER track_community_question AFTER INSERT ON public.community_question FOR EACH ROW EXECUTE FUNCTION log_user_activity();

CREATE TRIGGER track_posts AFTER INSERT OR DELETE OR UPDATE ON public.course_newsfeed FOR EACH ROW EXECUTE FUNCTION log_user_activity();

CREATE TRIGGER track_comments AFTER INSERT OR DELETE OR UPDATE ON public.course_newsfeed_comment FOR EACH ROW EXECUTE FUNCTION log_user_activity();

CREATE TRIGGER track_lesson_completion AFTER INSERT ON public.lesson_completion FOR EACH ROW EXECUTE FUNCTION log_user_activity();

CREATE TRIGGER track_submission AFTER INSERT ON public.submission FOR EACH ROW EXECUTE FUNCTION log_user_activity();
