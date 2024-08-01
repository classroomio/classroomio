drop policy "User must be an admin to INSERT" on "public"."organization";

create policy "Enable insert for authenticated users only"
on "public"."organization"
as permissive
for insert
to authenticated
with check (true);
