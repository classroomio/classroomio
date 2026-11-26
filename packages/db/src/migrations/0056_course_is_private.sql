ALTER TABLE "course" ADD COLUMN IF NOT EXISTS "is_private" boolean DEFAULT false NOT NULL;
