alter table "public"."community_answer" add column "author_profile_id" uuid;

alter table "public"."community_question" add column "author_profile_id" uuid;

alter table "public"."community_answer" add constraint "community_answer_author_profile_id_fkey" FOREIGN KEY (author_profile_id) REFERENCES profile(id) not valid;

alter table "public"."community_answer" validate constraint "community_answer_author_profile_id_fkey";

alter table "public"."community_question" add constraint "community_question_author_profile_id_fkey" FOREIGN KEY (author_profile_id) REFERENCES profile(id) not valid;

alter table "public"."community_question" validate constraint "community_question_author_profile_id_fkey";