alter table "public"."profile" add column "is_email_verified" boolean default false;
alter table "public"."profile" add column "verified_at" timestamp with time zone;

CREATE UNIQUE INDEX profile_email_key ON public.profile USING btree (email);

alter table "public"."profile" add constraint "profile_email_key" UNIQUE using index "profile_email_key";