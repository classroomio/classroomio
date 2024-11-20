drop policy "User must be an org member to SELECT" on "public"."organization_plan";

create policy "Enable read access for all users"
on "public"."organization_plan"
as permissive
for select
to public
using (true);
