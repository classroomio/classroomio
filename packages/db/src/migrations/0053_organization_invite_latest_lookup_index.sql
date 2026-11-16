-- Latest-invite lookup in invite-status.ts (org, lower(email), newest first). On a large database, create it with
-- CREATE INDEX CONCURRENTLY before deploying; IF NOT EXISTS then skips it here.
CREATE INDEX IF NOT EXISTS "idx_organization_invite_org_lower_email_created" ON "organization_invite" ("organization_id", lower("email"), "created_at" DESC);
