-- Latest-invite lookup in invite-status.ts (org, lower(email), newest first). On a large database, create it with
-- CREATE INDEX CONCURRENTLY before deploying; IF NOT EXISTS then skips it here. A failed concurrent build leaves an
-- invalid index that IF NOT EXISTS would also skip, so drop that first.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_index
    WHERE indexrelid = to_regclass('public.idx_organization_invite_org_lower_email_created') AND NOT indisvalid
  ) THEN
    DROP INDEX "public"."idx_organization_invite_org_lower_email_created";
  END IF;
END $$;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_organization_invite_org_lower_email_created" ON "organization_invite" ("organization_id", lower("email"), "created_at" DESC);
