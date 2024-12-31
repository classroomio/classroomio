set check_function_bodies = off;

create or replace view "public"."dash_org_stats" as  SELECT gp.organization_id AS org_id,
    count(DISTINCT course.id) AS no_of_courses,
    count(DISTINCT gm.profile_id) AS enrolled_students
   FROM ((course
     JOIN "group" gp ON ((gp.id = course.group_id)))
     LEFT JOIN groupmember gm ON (((gm.group_id = gp.id) AND (gm.role_id = 3))))
  WHERE (course.status = 'ACTIVE'::text)
  GROUP BY gp.organization_id;


CREATE OR REPLACE FUNCTION public.get_dash_org_recent_enrollments(org_id_arg uuid)
 RETURNS TABLE(profile_id uuid, avatar_url text, fullname text, course_id uuid, course_title character varying, enrolled_at timestamp with time zone)
 LANGUAGE plpgsql
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.get_dash_org_top_courses(org_id_arg uuid)
 RETURNS TABLE(course_id uuid, course_title character varying, total_students integer, completion_percentage integer)
 LANGUAGE plpgsql
AS $function$
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
  ) as course_stats
  LIMIT 5;
END;
$function$
;
