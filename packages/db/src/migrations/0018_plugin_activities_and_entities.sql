
CREATE TABLE IF NOT EXISTS "plugin_entity_records" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "plugin_name" varchar(128) NOT NULL,
  "entity_name" varchar(128) NOT NULL,
  "org_id" uuid NOT NULL REFERENCES "organization"("id") ON DELETE CASCADE,
  "course_id" uuid REFERENCES "course"("id") ON DELETE CASCADE,
  "lesson_id" uuid REFERENCES "lesson"("id") ON DELETE CASCADE,
  "user_id" uuid REFERENCES "user"("id") ON DELETE CASCADE,
  "data" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "created_at" timestamptz DEFAULT now(),
  "updated_at" timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "plugin_entity_records_plugin_entity_org_idx"
  ON "plugin_entity_records" ("plugin_name", "entity_name", "org_id");

CREATE INDEX IF NOT EXISTS "plugin_entity_records_org_id_idx"
  ON "plugin_entity_records" ("org_id");

CREATE INDEX IF NOT EXISTS "plugin_entity_records_user_id_idx"
  ON "plugin_entity_records" ("user_id");

CREATE INDEX IF NOT EXISTS "plugin_entity_records_course_id_idx"
  ON "plugin_entity_records" ("course_id");

CREATE INDEX IF NOT EXISTS "plugin_entity_records_lesson_id_idx"
  ON "plugin_entity_records" ("lesson_id");
