CREATE INDEX IF NOT EXISTS "idx_organization_invite_org_lower_email_created_at" ON "organization_invite" USING btree ("organization_id", lower("email"), "created_at" DESC);
