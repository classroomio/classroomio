INSERT INTO "question_type" ("id", "label", "typename", "created_at", "updated_at")
SELECT v."id", v."label", v."typename", '2026-11-16 00:00:00+00'::timestamptz, '2026-11-16 00:00:00+00'::timestamptz
FROM (VALUES
  (19, 'Graph plot', 'GRAPH_PLOT'),
  (20, 'Graph reading', 'GRAPH_READ')
) AS v("id", "label", "typename")
WHERE NOT EXISTS (SELECT 1 FROM "question_type" qt WHERE qt."id" = v."id" OR qt."typename" = v."typename");--> statement-breakpoint
SELECT setval(pg_get_serial_sequence('question_type', 'id'), (SELECT MAX("id") FROM "question_type"));
