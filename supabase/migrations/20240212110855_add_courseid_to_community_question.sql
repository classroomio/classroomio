create sequence "public"."test_tenant_id_seq";

create table "public"."test_tenant" (
    "id" integer not null default nextval('test_tenant_id_seq'::regclass),
    "details" text
);

truncate "public"."community_question" cascade;

alter table "public"."community_question" add column "course_id" uuid not null;

alter sequence "public"."test_tenant_id_seq" owned by "public"."test_tenant"."id";

CREATE UNIQUE INDEX test_tenant_pkey ON public.test_tenant USING btree (id);

alter table "public"."test_tenant" add constraint "test_tenant_pkey" PRIMARY KEY using index "test_tenant_pkey";

alter table "public"."community_question" add constraint "community_question_course_id_fkey" FOREIGN KEY (course_id) REFERENCES course(id) not valid;

alter table "public"."community_question" validate constraint "community_question_course_id_fkey";