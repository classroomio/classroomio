--> Replace the single onboarding goal with the structured onboarding questionnaire.
--> `goal` is superseded by `use_cases` (multi-select) and is left in place along with the other
--> existing columns. The new columns hold the single-select answers and the optional free-text
--> "Other" values.
ALTER TABLE "profile" ADD COLUMN "use_cases" jsonb DEFAULT '[]'::jsonb NOT NULL;
ALTER TABLE "profile" ADD COLUMN "use_case_other" text;
ALTER TABLE "profile" ADD COLUMN "learning_method" varchar;
ALTER TABLE "profile" ADD COLUMN "learning_method_other" text;
ALTER TABLE "profile" ADD COLUMN "company_size" varchar;
ALTER TABLE "profile" ADD COLUMN "job_role" varchar;
ALTER TABLE "profile" ADD COLUMN "job_role_other" text;
ALTER TABLE "profile" ADD COLUMN "source_other" text;
ALTER TABLE "profile" ADD COLUMN "ai_provider" varchar;
ALTER TABLE "profile" ADD COLUMN "ai_provider_other" text;
