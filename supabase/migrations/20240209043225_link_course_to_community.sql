alter table "public"."community_question" add constraint "community_question_course_id_fkey" FOREIGN KEY (course_id) REFERENCES course(id) not valid;

alter table "public"."community_question" validate constraint "community_question_course_id_fkey";


