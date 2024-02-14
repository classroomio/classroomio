alter table "public"."links" drop constraint "links_short_code_key";

alter table "public"."links" drop constraint "links_pkey";

drop index if exists "public"."links_short_code_key";

drop index if exists "public"."links_pkey";

alter table "public"."links" drop column "id";

alter table "public"."links" alter column "short_code" set not null;

drop sequence if exists "public"."links_id_seq";

CREATE UNIQUE INDEX links_pkey ON public.links USING btree (short_code);

alter table "public"."links" add constraint "links_pkey" PRIMARY KEY using index "links_pkey";