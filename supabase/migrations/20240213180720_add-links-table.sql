create sequence "public"."links_id_seq";

create table "public"."links" (
    "id" integer not null default nextval('links_id_seq'::regclass),
    "original_url" text not null,
    "short_code" character varying(20),
    "created_at" timestamp without time zone default CURRENT_TIMESTAMP
);


alter sequence "public"."links_id_seq" owned by "public"."links"."id";

CREATE UNIQUE INDEX links_pkey ON public.links USING btree (id);

CREATE INDEX links_short_code_idx ON public.links USING btree (short_code);

CREATE UNIQUE INDEX links_short_code_key ON public.links USING btree (short_code);

alter table "public"."links" add constraint "links_pkey" PRIMARY KEY using index "links_pkey";

alter table "public"."links" add constraint "links_short_code_key" UNIQUE using index "links_short_code_key";