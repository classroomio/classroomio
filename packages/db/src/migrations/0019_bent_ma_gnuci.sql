-- 0018 already shipped on the learning-path catalog branch. Editing it cannot
-- reach databases that already applied it, so this forward migration adds the
-- same column and uniqueness fix for those databases.
--
-- The unique constraint is intentionally global (including soft-deleted rows),
-- matching course slug uniqueness. If the constraint fails, find collisions:
--   SELECT slug, count(*) FROM learning_path GROUP BY slug HAVING count(*) > 1;
DROP INDEX IF EXISTS "idx_learning_path_org_slug_active";--> statement-breakpoint
ALTER TABLE "groupmember" ADD COLUMN IF NOT EXISTS "completed_at" timestamp with time zone;--> statement-breakpoint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'learning_path'::regclass
      AND conname = 'learning_path_slug_key'
  ) THEN
    ALTER TABLE "learning_path" ADD CONSTRAINT "learning_path_slug_key" UNIQUE ("slug");
  END IF;
END $$;
