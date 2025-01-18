drop function if exists "public"."get_courses"(org_id_arg uuid, profile_id_arg uuid);

create table "public"."course_tags" (
    "id" uuid not null default gen_random_uuid(),
    "tag_id" uuid,
    "course_id" uuid
);


create table "public"."tags" (
    "id" uuid not null default gen_random_uuid(),
    "name" text,
    "description" text,
    "organization_id" uuid
);


CREATE UNIQUE INDEX course_tags_pkey ON public.course_tags USING btree (id);

CREATE UNIQUE INDEX tags_pkey ON public.tags USING btree (id);

alter table "public"."course_tags" add constraint "course_tags_pkey" PRIMARY KEY using index "course_tags_pkey";

alter table "public"."tags" add constraint "tags_pkey" PRIMARY KEY using index "tags_pkey";

alter table "public"."course_tags" add constraint "course_tags_course_id_fkey" FOREIGN KEY (course_id) REFERENCES course(id) ON DELETE CASCADE not valid;

alter table "public"."course_tags" validate constraint "course_tags_course_id_fkey";

alter table "public"."course_tags" add constraint "course_tags_tag_id_fkey" FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE not valid;

alter table "public"."course_tags" validate constraint "course_tags_tag_id_fkey";

alter table "public"."tags" add constraint "tags_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES organization(id) ON DELETE CASCADE not valid;

alter table "public"."tags" validate constraint "tags_organization_id_fkey";

CREATE OR REPLACE FUNCTION public.get_courses(org_id_arg uuid, profile_id_arg uuid)
 RETURNS TABLE(id uuid, org_id uuid, title text, slug text, description text, logo text, banner_image text, cost bigint, currency text, is_published boolean, total_lessons bigint, total_students bigint, progress_rate bigint, type "COURSE_TYPE", tags text[], member_profile_id uuid)
 LANGUAGE plpgsql
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    course.id, 
    organization.id AS org_id, 
    course.title::text,  -- Explicitly cast to text
    course.slug::text,   -- Explicitly cast to text
    course.description::text,  -- Explicitly cast to text
    course.logo::text,   -- Explicitly cast to text
    course.banner_image::text,  -- Explicitly cast to text
    course.cost, 
    course.currency::text,  -- Explicitly cast to text
    course.is_published, 
    (SELECT COUNT(*) FROM lesson AS l WHERE l.course_id = course.id) AS total_lessons, 
    (SELECT COUNT(*) FROM groupmember AS gm WHERE gm.group_id = course.group_id AND gm.role_id = 3) AS total_students, 
    (SELECT COUNT(*) FROM lesson_completion AS lc JOIN lesson AS l ON l.id = lc.lesson_id WHERE l.course_id = course.id AND lc.is_complete = true AND lc.profile_id = profile_id_arg) AS progress_rate, 
    course.type,  -- Ensure this is selected from the course table
    ARRAY_AGG(tags.name) AS tags,  -- Use ARRAY_AGG with the correct alias
    (SELECT groupmember.profile_id FROM groupmember WHERE groupmember.group_id = "group".id AND groupmember.profile_id = profile_id_arg) AS member_profile_id
  FROM 
    course
  JOIN 
    "group" ON "group".id = course.group_id
  JOIN 
    organization ON organization.id = "group".organization_id
  LEFT JOIN 
    course_tags ON course_tags.course_id = course.id  -- Join with course_tags
  LEFT JOIN 
    tags ON tags.id = course_tags.tag_id  -- Join with tags
  WHERE 
    course.status = 'ACTIVE' AND organization.id = org_id_arg
  GROUP BY 
    course.id, organization.id, "group".id  -- Group by necessary fields
  ORDER BY 
    course.created_at DESC;
END;
$function$
;

grant delete on table "public"."course_tags" to "anon";

grant insert on table "public"."course_tags" to "anon";

grant references on table "public"."course_tags" to "anon";

grant select on table "public"."course_tags" to "anon";

grant trigger on table "public"."course_tags" to "anon";

grant truncate on table "public"."course_tags" to "anon";

grant update on table "public"."course_tags" to "anon";

grant delete on table "public"."course_tags" to "authenticated";

grant insert on table "public"."course_tags" to "authenticated";

grant references on table "public"."course_tags" to "authenticated";

grant select on table "public"."course_tags" to "authenticated";

grant trigger on table "public"."course_tags" to "authenticated";

grant truncate on table "public"."course_tags" to "authenticated";

grant update on table "public"."course_tags" to "authenticated";

grant delete on table "public"."course_tags" to "service_role";

grant insert on table "public"."course_tags" to "service_role";

grant references on table "public"."course_tags" to "service_role";

grant select on table "public"."course_tags" to "service_role";

grant trigger on table "public"."course_tags" to "service_role";

grant truncate on table "public"."course_tags" to "service_role";

grant update on table "public"."course_tags" to "service_role";

grant delete on table "public"."tags" to "anon";

grant insert on table "public"."tags" to "anon";

grant references on table "public"."tags" to "anon";

grant select on table "public"."tags" to "anon";

grant trigger on table "public"."tags" to "anon";

grant truncate on table "public"."tags" to "anon";

grant update on table "public"."tags" to "anon";

grant delete on table "public"."tags" to "authenticated";

grant insert on table "public"."tags" to "authenticated";

grant references on table "public"."tags" to "authenticated";

grant select on table "public"."tags" to "authenticated";

grant trigger on table "public"."tags" to "authenticated";

grant truncate on table "public"."tags" to "authenticated";

grant update on table "public"."tags" to "authenticated";

grant delete on table "public"."tags" to "service_role";

grant insert on table "public"."tags" to "service_role";

grant references on table "public"."tags" to "service_role";

grant select on table "public"."tags" to "service_role";

grant trigger on table "public"."tags" to "service_role";

grant truncate on table "public"."tags" to "service_role";

grant update on table "public"."tags" to "service_role";
