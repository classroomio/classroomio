CREATE OR REPLACE FUNCTION public.get_explore_courses(org_id_arg uuid, profile_id_arg uuid)
 RETURNS TABLE(id uuid, org_id uuid, title character varying, slug character varying, description character varying, logo text, banner_image text, cost bigint, currency character varying, is_published boolean, total_lessons bigint, total_students bigint, progress_rate bigint, type "COURSE_TYPE", other_profile_id uuid)
 LANGUAGE plpgsql
AS $function$
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
$function$
;