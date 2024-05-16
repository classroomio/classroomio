create type "public"."COURSE_TYPE" as enum ('SELF_PACED', 'LIVE_CLASS');

alter table "public"."course" add column "course_type" "COURSE_TYPE" default 'LIVE_CLASS'::"COURSE_TYPE";