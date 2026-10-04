CREATE TABLE IF NOT EXISTS "org_capability" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "org_id" uuid NOT NULL REFERENCES "organization"("id") ON DELETE CASCADE,
  "capability_id" varchar(128) NOT NULL,
  "is_enabled" boolean DEFAULT false NOT NULL,
  "created_at" timestamptz DEFAULT now(),
  "updated_at" timestamptz DEFAULT now(),
  CONSTRAINT "org_capability_org_capability_uniq" UNIQUE ("org_id", "capability_id")
);

CREATE INDEX IF NOT EXISTS "org_capability_org_id_idx"
  ON "org_capability" ("org_id");

CREATE INDEX IF NOT EXISTS "org_capability_capability_id_idx"
  ON "org_capability" ("capability_id");

CREATE TABLE IF NOT EXISTS "org_certificate_preset" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "org_id" uuid NOT NULL REFERENCES "organization"("id") ON DELETE CASCADE,
  "name" varchar(128) NOT NULL,
  "description" text,
  "design" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "is_active" boolean DEFAULT true NOT NULL,
  "created_by" uuid REFERENCES "user"("id") ON DELETE SET NULL,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "org_certificate_preset_org_active_idx"
  ON "org_certificate_preset" ("org_id", "is_active");

CREATE INDEX IF NOT EXISTS "org_certificate_preset_org_created_idx"
  ON "org_certificate_preset" ("org_id", "created_at");
