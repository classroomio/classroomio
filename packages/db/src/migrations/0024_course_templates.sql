UPDATE "course" SET "is_template" = false;

ALTER TABLE "course" ALTER COLUMN "is_template" SET DEFAULT false;
ALTER TABLE "course" ALTER COLUMN "is_template" SET NOT NULL;

ALTER TABLE "course" ADD COLUMN "template_id" uuid;
ALTER TABLE "course" ADD COLUMN "public_for_all" boolean DEFAULT false NOT NULL;
ALTER TABLE "course" ADD COLUMN "seed_key" varchar;

CREATE UNIQUE INDEX "course_seed_key_unique" ON "course" ("seed_key") WHERE "seed_key" IS NOT NULL;

ALTER TABLE "course"
ADD CONSTRAINT "course_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "course"("id") ON DELETE SET NULL;

CREATE INDEX "course_template_id_idx" ON "course" ("template_id") WHERE "template_id" IS NOT NULL;

ALTER TABLE "course_section" ADD COLUMN "source_id" uuid;
ALTER TABLE "course_section" ADD COLUMN "source_synced_at" timestamp with time zone;

ALTER TABLE "course_section"
ADD CONSTRAINT "course_section_source_id_fkey" FOREIGN KEY ("source_id") REFERENCES "course_section"("id") ON DELETE SET NULL;

CREATE INDEX "course_section_source_id_idx" ON "course_section" ("source_id") WHERE "source_id" IS NOT NULL;

ALTER TABLE "lesson" ADD COLUMN "source_id" uuid;
ALTER TABLE "lesson" ADD COLUMN "source_synced_at" timestamp with time zone;

ALTER TABLE "lesson"
ADD CONSTRAINT "lesson_source_id_fkey" FOREIGN KEY ("source_id") REFERENCES "lesson"("id") ON DELETE SET NULL;

CREATE INDEX "lesson_source_id_idx" ON "lesson" ("source_id") WHERE "source_id" IS NOT NULL;

ALTER TABLE "exercise" ADD COLUMN "source_id" uuid;
ALTER TABLE "exercise" ADD COLUMN "source_synced_at" timestamp with time zone;

ALTER TABLE "exercise"
ADD CONSTRAINT "exercise_source_id_fkey" FOREIGN KEY ("source_id") REFERENCES "exercise"("id") ON DELETE SET NULL;

CREATE INDEX "exercise_source_id_idx" ON "exercise" ("source_id") WHERE "source_id" IS NOT NULL;

ALTER TABLE "lesson_language" ADD COLUMN "updated_at" timestamp with time zone DEFAULT now() NOT NULL;

CREATE TABLE "template_highlight" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "course_id" uuid NOT NULL,
  "position" integer NOT NULL,
  "title" varchar(80) NOT NULL,
  "description" varchar(200)
);

ALTER TABLE "template_highlight"
ADD CONSTRAINT "template_highlight_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "course"("id") ON DELETE CASCADE;

CREATE INDEX "template_highlight_course_id_idx" ON "template_highlight" ("course_id");

CREATE TABLE "course_template_setting_sync" (
  "course_id" uuid NOT NULL,
  "setting_key" varchar NOT NULL,
  "synced_at" timestamp with time zone NOT NULL,
  CONSTRAINT "course_template_setting_sync_pkey" PRIMARY KEY ("course_id", "setting_key")
);

ALTER TABLE "course_template_setting_sync"
ADD CONSTRAINT "course_template_setting_sync_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "course"("id") ON DELETE CASCADE;
