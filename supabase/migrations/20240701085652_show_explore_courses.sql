CREATE OR REPLACE FUNCTION public.get_explore_courses(org_id_arg uuid, profile_id_arg uuid)
RETURNS TABLE(
    id uuid,
    org_id uuid,
    title character varying,
    slug character varying,
    description character varying,
    logo text,
    banner_image text,
    cost bigint,
    currency character varying,
    is_published boolean,
    total_lessons bigint,
    total_students bigint,
    progress_rate bigint,
    type "COURSE_TYPE",
    other_profile_id uuid
)
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
$function$;
