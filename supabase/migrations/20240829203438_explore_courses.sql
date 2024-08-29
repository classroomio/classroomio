CREATE OR REPLACE FUNCTION public.get_all_explore_courses(org_id_arg uuid, profile_id_arg uuid)     
 RETURNS TABLE(id uuid, org_id uuid, title text, slug text, description text, logo text, banner_image text, cost numeric, currency text, is_published boolean, total_count integer, total_students integer, progress_rate integer, type text, other_profile_id uuid, "isPathway" boolean)
 LANGUAGE plpgsql
AS $function$
BEGIN
  -- Fetch courses
  RETURN QUERY
  SELECT
    course.id::UUID,
    organization.id::UUID AS org_id,
    course.title::TEXT,
    course.slug::TEXT,
    course.description::TEXT,
    course.logo::TEXT,
    course.banner_image::TEXT,
    course.cost::NUMERIC,
    course.currency::TEXT,
    course.is_published::BOOLEAN,
    (SELECT COUNT(*) FROM lesson AS l WHERE l.course_id = course.id)::INTEGER AS total_count,       
    (SELECT COUNT(*) FROM groupmember AS gm WHERE gm.group_id = course.group_id AND gm.role_id = 3)::INTEGER AS total_students,
    (SELECT COUNT(*) FROM lesson_completion AS lc
      JOIN lesson AS l ON l.id = lc.lesson_id
      WHERE l.course_id = course.id
        AND lc.is_complete = TRUE
        AND lc.profile_id = profile_id_arg
    )::INTEGER AS progress_rate,
    course.type::TEXT AS type,
    (SELECT groupmember.profile_id
      FROM groupmember
      WHERE groupmember.group_id = "group".id
        AND groupmember.profile_id != profile_id_arg
      LIMIT 1
    )::UUID AS other_profile_id,
    FALSE AS isPathway
  FROM course
  JOIN "group" ON "group".id = course.group_id
  JOIN organization ON organization.id = "group".organization_id
  WHERE course.status = 'ACTIVE'
    AND course.is_published = TRUE
    AND organization.id = org_id_arg
    AND profile_id_arg NOT IN (
      SELECT groupmember.profile_id
      FROM groupmember
      WHERE groupmember.group_id = course.group_id
    );


  RETURN QUERY
  SELECT
    pathway.id::UUID,
    organization.id::UUID AS org_id,
    pathway.title::TEXT,
    pathway.slug::TEXT,
    pathway.description::TEXT,
    pathway.logo::TEXT,
    pathway.banner_image::TEXT,
    pathway.cost::NUMERIC,
    pathway.currency::TEXT,
    pathway.is_published::BOOLEAN,
    (SELECT COUNT(*) FROM pathway_course AS pc WHERE pc.pathway_id = pathway.id)::INTEGER AS total_count,
    (SELECT COUNT(*) FROM groupmember AS gm WHERE gm.group_id = pathway.group_id AND gm.role_id = 3)::INTEGER AS total_students,
    NULL::INTEGER AS progress_rate,
    NULL::TEXT AS type,
    (SELECT groupmember.profile_id
      FROM groupmember
      WHERE groupmember.group_id = "group".id
        AND groupmember.profile_id != profile_id_arg
      LIMIT 1
    )::UUID AS other_profile_id,
    TRUE AS isPathway  -- Explicitly name column with correct casing
  FROM pathway
  JOIN "group" ON "group".id = pathway.group_id
  JOIN organization ON organization.id = "group".organization_id
  WHERE pathway.status = 'ACTIVE'
    AND pathway.is_published = TRUE
    AND organization.id = org_id_arg
    AND profile_id_arg NOT IN (
      SELECT groupmember.profile_id
      FROM groupmember
      WHERE groupmember.group_id = pathway.group_id
    );

END;
$function$
;