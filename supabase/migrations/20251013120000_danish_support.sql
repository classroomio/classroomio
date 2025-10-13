drop view if exists "public"."lesson_versions";

alter table "public"."lesson_language" alter column "locale" drop default;

alter table "public"."profile" alter column "locale" drop default;

alter type "public"."LOCALE" rename to "LOCALE__old_version_to_be_dropped";

create type "public"."LOCALE" as enum ('en', 'hi', 'fr', 'pt', 'de', 'vi', 'ru', 'es', 'pl', 'da');

alter table "public"."lesson_language" alter column locale type "public"."LOCALE" using locale::text::"public"."LOCALE";

alter table "public"."profile" alter column locale type "public"."LOCALE" using locale::text::"public"."LOCALE";

alter table "public"."lesson_language" alter column "locale" set default 'en'::"LOCALE";

alter table "public"."profile" alter column "locale" set default 'en'::"LOCALE";

drop type "public"."LOCALE__old_version_to_be_dropped";           