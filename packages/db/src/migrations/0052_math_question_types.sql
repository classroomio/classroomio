ALTER TABLE "exercise" ADD COLUMN "calculator_policy" varchar DEFAULT 'none' NOT NULL;--> statement-breakpoint
ALTER TABLE "question" ADD COLUMN "parent_question_id" bigint;--> statement-breakpoint
ALTER TABLE "question" ADD CONSTRAINT "question_parent_question_id_question_id_fk" FOREIGN KEY ("parent_question_id") REFERENCES "public"."question"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_question_parent_question_id" ON "question" USING btree ("parent_question_id");--> statement-breakpoint
INSERT INTO "question_type" ("id", "label", "typename", "created_at", "updated_at")
SELECT v."id", v."label", v."typename", '2026-11-15 00:00:00+00'::timestamptz, '2026-11-15 00:00:00+00'::timestamptz
FROM (VALUES
  (15, 'Matching', 'MATCHING'),
  (17, 'Math expression', 'MATH_EXPRESSION'),
  (18, 'Worked solution', 'WORKED_SOLUTION')
) AS v("id", "label", "typename")
WHERE NOT EXISTS (SELECT 1 FROM "question_type" qt WHERE qt."id" = v."id" OR qt."typename" = v."typename");--> statement-breakpoint
SELECT setval(pg_get_serial_sequence('question_type', 'id'), (SELECT MAX("id") FROM "question_type"));
