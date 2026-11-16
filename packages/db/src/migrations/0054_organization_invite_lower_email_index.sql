DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_index
    WHERE indexrelid = to_regclass('public.idx_organization_invite_org_lower_email_created_at') AND NOT indisvalid
  ) THEN
    DROP INDEX "public"."idx_organization_invite_org_lower_email_created_at";
  END IF;
END $$;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_organization_invite_org_lower_email_created_at" ON "organization_invite" USING btree ("organization_id", lower("email"), "created_at" DESC);
