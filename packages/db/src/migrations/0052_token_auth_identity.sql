-- Binds an external app's stable user id (sub) to a ClassroomIO user, per org, so token exchange keys off
-- (org, sub) rather than email. Without it, one org's signing secret could sign in any user by email.
CREATE TABLE IF NOT EXISTS "organization_token_auth_identity" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "organization_id" uuid NOT NULL,
  "external_subject" text NOT NULL,
  "user_id" uuid NOT NULL,
  "created_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  CONSTRAINT "organization_token_auth_identity_organization_id_organization_id_fk"
    FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE cascade,
  CONSTRAINT "organization_token_auth_identity_user_id_user_id_fk"
    FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE cascade
);--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "organization_token_auth_identity_org_subject_unique"
  ON "organization_token_auth_identity" ("organization_id", "external_subject");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_organization_token_auth_identity_user_id"
  ON "organization_token_auth_identity" ("user_id");
