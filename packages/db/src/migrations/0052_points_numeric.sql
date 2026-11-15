ALTER TABLE "question_answer" ALTER COLUMN "point" SET DATA TYPE numeric(10, 2) USING "point"::numeric(10, 2);--> statement-breakpoint
ALTER TABLE "question_answer" ALTER COLUMN "point" SET DEFAULT 0;--> statement-breakpoint
ALTER TABLE "submission" ALTER COLUMN "total" SET DATA TYPE numeric(10, 2) USING "total"::numeric(10, 2);--> statement-breakpoint
ALTER TABLE "submission" ALTER COLUMN "total" SET DEFAULT 0;
