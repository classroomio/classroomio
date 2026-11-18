CREATE TABLE "skill" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "organization_id" uuid NOT NULL,
  "parent_id" uuid,
  "code" varchar NOT NULL,
  "name" varchar NOT NULL,
  "description" text,
  "framework" varchar,
  "created_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  "updated_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  CONSTRAINT "skill_org_code_key" UNIQUE("organization_id","code")
);--> statement-breakpoint
CREATE TABLE "question_skill" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "question_id" bigint NOT NULL,
  "skill_id" uuid NOT NULL,
  "created_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  CONSTRAINT "question_skill_question_skill_key" UNIQUE("question_id","skill_id")
);--> statement-breakpoint
ALTER TABLE "skill" ADD CONSTRAINT "skill_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "skill" ADD CONSTRAINT "skill_parent_id_skill_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."skill"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "question_skill" ADD CONSTRAINT "question_skill_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "public"."question"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "question_skill" ADD CONSTRAINT "question_skill_skill_id_fkey" FOREIGN KEY ("skill_id") REFERENCES "public"."skill"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_skill_organization_id" ON "skill" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_skill_parent_id" ON "skill" USING btree ("parent_id");--> statement-breakpoint
CREATE INDEX "idx_question_skill_question_id" ON "question_skill" USING btree ("question_id");--> statement-breakpoint
CREATE INDEX "idx_question_skill_skill_id" ON "question_skill" USING btree ("skill_id");
