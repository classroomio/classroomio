create table "public"."product_invite" (
    "id" uuid not null default uuid_generate_v4(),
    "created_at" timestamp with time zone default now(),
    "items" jsonb,
    "email" character varying,
    "expires_at" timestamp with time zone,
    "organization_id" uuid,
    "accepted_at" timestamp with time zone
);


alter table "public"."product_invite" enable row level security;

CREATE UNIQUE INDEX product_invite_pkey ON public.product_invite USING btree (id);

alter table "public"."product_invite" add constraint "product_invite_pkey" PRIMARY KEY using index "product_invite_pkey";

alter table "public"."product_invite" add constraint "product_invite_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES organization(id) not valid;

alter table "public"."product_invite" validate constraint "product_invite_organization_id_fkey";

grant delete on table "public"."product_invite" to "anon";

grant insert on table "public"."product_invite" to "anon";

grant references on table "public"."product_invite" to "anon";

grant select on table "public"."product_invite" to "anon";

grant trigger on table "public"."product_invite" to "anon";

grant truncate on table "public"."product_invite" to "anon";

grant update on table "public"."product_invite" to "anon";

grant delete on table "public"."product_invite" to "authenticated";

grant insert on table "public"."product_invite" to "authenticated";

grant references on table "public"."product_invite" to "authenticated";

grant select on table "public"."product_invite" to "authenticated";

grant trigger on table "public"."product_invite" to "authenticated";

grant truncate on table "public"."product_invite" to "authenticated";

grant update on table "public"."product_invite" to "authenticated";

grant delete on table "public"."product_invite" to "service_role";

grant insert on table "public"."product_invite" to "service_role";

grant references on table "public"."product_invite" to "service_role";

grant select on table "public"."product_invite" to "service_role";

grant trigger on table "public"."product_invite" to "service_role";

grant truncate on table "public"."product_invite" to "service_role";

grant update on table "public"."product_invite" to "service_role";

create policy "Only authenticated users can read"
on "public"."product_invite"
as permissive
for select
to authenticated
using (true);


create policy "Org member can delete"
on "public"."product_invite"
as permissive
for delete
to authenticated
using (is_org_member());


create policy "Org member can insert"
on "public"."product_invite"
as permissive
for insert
to authenticated
with check (is_org_member());


create policy "User can update theirs"
on "public"."product_invite"
as permissive
for update
to authenticated
using ((( SELECT (auth.jwt() ->> 'email'::text)) = (email)::text))
with check ((( SELECT (auth.jwt() ->> 'email'::text)) = (email)::text));



