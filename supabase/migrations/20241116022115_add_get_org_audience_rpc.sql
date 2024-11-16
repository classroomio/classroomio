CREATE OR REPLACE FUNCTION public.get_students_by_org(org_id uuid)
 RETURNS TABLE(id uuid, email character varying, fullname text)
 LANGUAGE plpgsql
AS $function$
begin
  return query
  select distinct "profile"."id", "profile"."email", "profile"."fullname"
  from
    "public"."organization" as "org"
  join "public"."group" as "group" on "org"."id" = "group"."organization_id"
  join "public"."groupmember" as "groupmember" on "groupmember"."group_id" = "group"."id"
  join "public"."profile" as "profile" on "profile"."id" = "groupmember"."profile_id"
  where "groupmember"."role_id" = 3 and "org"."id" = org_id
  limit 1000;
end;
$function$
;