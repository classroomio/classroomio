create type "public"."COURSE_VERSION" as enum ('V1', 'V2');

alter table "public"."course" add column "version" "COURSE_VERSION" not null default 'V1'::"COURSE_VERSION";
