INSERT INTO "public"."question_type" ("id", "typename", "label")
VALUES (17, 'PLUGIN_CUSTOM', 'Custom (Plugin)')
ON CONFLICT ("id") DO UPDATE SET "typename" = EXCLUDED."typename", "label" = EXCLUDED."label";--> statement-breakpoint
SELECT setval('question_type_id_seq', (SELECT GREATEST(MAX(id), 17) FROM "public"."question_type"));

