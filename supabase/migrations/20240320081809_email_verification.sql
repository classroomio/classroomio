alter table "public"."profile" add column "is_email_verified" boolean default false,
alter table "public"."profile" add column "verified_at" timestamp with time zone