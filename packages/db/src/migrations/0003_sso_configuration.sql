-- SSO Provider Type Enum
DO $$ BEGIN
  CREATE TYPE "SSO_PROVIDER_TYPE" AS ENUM ('saml', 'oidc');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Organization SSO Configuration Table
CREATE TABLE IF NOT EXISTS "organization_sso_config" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "organization_id" uuid NOT NULL,
  "provider_type" "SSO_PROVIDER_TYPE" NOT NULL,
  "provider_name" text NOT NULL,
  "display_name" text,
  "enabled" boolean DEFAULT false NOT NULL,
  "saml_config" jsonb,
  "oidc_config" jsonb,
  "force_sso" boolean DEFAULT false NOT NULL,
  "auto_provision_users" boolean DEFAULT true NOT NULL,
  "allowed_domains" text[],
  "default_role_id" bigint,
  "attribute_mapping" jsonb DEFAULT '{"email":"email","name":"name","firstName":"given_name","lastName":"family_name"}'::jsonb,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now(),
  CONSTRAINT "organization_sso_config_org_id_key" UNIQUE ("organization_id")
);

-- SSO Session Table (for tracking auth flow state)
CREATE TABLE IF NOT EXISTS "sso_session" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "organization_id" uuid NOT NULL,
  "sso_config_id" uuid NOT NULL,
  "state" text NOT NULL UNIQUE,
  "nonce" text,
  "code_verifier" text,
  "redirect_url" text,
  "status" text DEFAULT 'pending' NOT NULL,
  "error_message" text,
  "user_id" uuid,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "expires_at" timestamp with time zone NOT NULL
);

-- Foreign Key Constraints
ALTER TABLE "organization_sso_config" 
  ADD CONSTRAINT "organization_sso_config_organization_id_fkey" 
  FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE CASCADE;

ALTER TABLE "organization_sso_config" 
  ADD CONSTRAINT "organization_sso_config_default_role_id_fkey" 
  FOREIGN KEY ("default_role_id") REFERENCES "role"("id");

ALTER TABLE "sso_session" 
  ADD CONSTRAINT "sso_session_organization_id_fkey" 
  FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE CASCADE;

ALTER TABLE "sso_session" 
  ADD CONSTRAINT "sso_session_sso_config_id_fkey" 
  FOREIGN KEY ("sso_config_id") REFERENCES "organization_sso_config"("id") ON DELETE CASCADE;

ALTER TABLE "sso_session" 
  ADD CONSTRAINT "sso_session_user_id_fkey" 
  FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE SET NULL;

-- Indexes
CREATE INDEX IF NOT EXISTS "idx_organization_sso_config_org_id" ON "organization_sso_config" ("organization_id");
CREATE INDEX IF NOT EXISTS "idx_sso_session_state" ON "sso_session" ("state");
CREATE INDEX IF NOT EXISTS "idx_sso_session_org_id" ON "sso_session" ("organization_id");
