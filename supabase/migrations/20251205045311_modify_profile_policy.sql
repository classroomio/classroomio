drop policy if exists "Public profiles are viewable by everyone." on "public"."profile";

drop policy if exists "Only auth users can read profile" on "public"."profile";

create policy "You can only view your own profile"
on "public"."profile"
as permissive
for select
to authenticated, anon
using ((auth.uid() = id));
