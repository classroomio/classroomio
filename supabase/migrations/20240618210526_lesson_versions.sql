create or replace view "public"."lesson_versions" as SELECT llh.old_content,
    llh.new_content,
    llh."timestamp",
    ll.locale,
    ll.lesson_id
   FROM (lesson_language_history llh
     JOIN lesson_language ll ON ((ll.id = llh.lesson_language_id)));