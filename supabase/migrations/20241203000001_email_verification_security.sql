
-- Drop existing objects first to ensure clean migration
DROP TABLE IF EXISTS "public"."email_verification_tokens" CASCADE;
DROP TRIGGER IF EXISTS profile_email_verification_protection ON "public"."profile";
DROP FUNCTION IF EXISTS prevent_email_verification_manipulation();
-- Drop all versions of verify_email_with_token function
DROP FUNCTION IF EXISTS "public"."verify_email_with_token"(text, text);
DROP FUNCTION IF EXISTS "public"."verify_email_with_token"(text, inet);
DROP FUNCTION IF EXISTS "public"."verify_email_with_token"(text);
-- Drop all versions of create_email_verification_token function
DROP FUNCTION IF EXISTS "public"."create_email_verification_token"(uuid, text, text);
DROP FUNCTION IF EXISTS "public"."create_email_verification_token"(uuid, text, inet);
DROP FUNCTION IF EXISTS "public"."create_email_verification_token"(uuid, text);
DROP FUNCTION IF EXISTS "public"."cleanup_expired_verification_tokens"();

CREATE TABLE IF NOT EXISTS "public"."email_verification_tokens" (
    "id" uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    "profile_id" uuid REFERENCES "public"."profile"("id") ON DELETE CASCADE,
    "token" text UNIQUE NOT NULL,
    "email" text NOT NULL,
    "created_at" timestamp with time zone DEFAULT timezone('utc', now()),
    "expires_at" timestamp with time zone NOT NULL,
    "used_at" timestamp with time zone,
    "created_by_ip" inet,
    "used_by_ip" inet
);

-- Drop existing policies and create secure profile update policy
DROP POLICY IF EXISTS "Users can update own profile." ON "public"."profile";
DROP POLICY IF EXISTS "Users can update own profile safely" ON "public"."profile";

-- Create a restrictive policy that prevents email verification manipulation
CREATE POLICY "Users can update own profile safely" ON "public"."profile" 
FOR UPDATE 
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Create a trigger to prevent direct email verification status changes
CREATE OR REPLACE FUNCTION prevent_email_verification_manipulation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only allow email verification changes via our secure function
  IF (OLD.is_email_verified != NEW.is_email_verified OR 
      OLD.verified_at IS DISTINCT FROM NEW.verified_at) THEN
    
    -- Check if this is being called by our secure verification function
    IF current_setting('app.verification_context', true) != 'secure_verify' THEN
      RAISE EXCEPTION 'Email verification status can only be changed through secure verification process';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER profile_email_verification_protection
  BEFORE UPDATE ON "public"."profile"
  FOR EACH ROW
  EXECUTE FUNCTION prevent_email_verification_manipulation();

CREATE OR REPLACE FUNCTION "public"."verify_email_with_token"(
  token_input text,
  user_ip text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  token_record RECORD;
  result jsonb;
  ip_addr inet;
BEGIN
  -- Safely convert IP string to inet, handle invalid IPs
  BEGIN
    IF user_ip IS NOT NULL AND user_ip != 'unknown' AND user_ip != '' THEN
      ip_addr := user_ip::inet;
    ELSE
      ip_addr := NULL;
    END IF;
  EXCEPTION WHEN others THEN
    ip_addr := NULL;
  END;
  SELECT 
    evt.id, 
    evt.profile_id, 
    evt.email,
    evt.expires_at,
    evt.used_at,
    p.email as current_email
  INTO token_record
  FROM email_verification_tokens evt
  JOIN profile p ON p.id = evt.profile_id
  WHERE evt.token = token_input;

  -- Check if token exists
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false, 
      'error', 'INVALID_TOKEN',
      'message', 'Verification token not found or invalid'
    );
  END IF;

  -- Check if token already used
  IF token_record.used_at IS NOT NULL THEN
    RETURN jsonb_build_object(
      'success', false, 
      'error', 'TOKEN_ALREADY_USED',
      'message', 'This verification link has already been used'
    );
  END IF;

  -- Check if token expired
  IF token_record.expires_at < NOW() THEN
    RETURN jsonb_build_object(
      'success', false, 
      'error', 'TOKEN_EXPIRED',
      'message', 'Verification link has expired. Please request a new one.'
    );
  END IF;

  -- Verify email matches current profile email
  IF token_record.email != token_record.current_email THEN
    RETURN jsonb_build_object(
      'success', false, 
      'error', 'EMAIL_MISMATCH',
      'message', 'Email address has been changed. Please request a new verification link.'
    );
  END IF;

  -- Mark token as used
  UPDATE email_verification_tokens 
  SET 
    used_at = NOW(),
    used_by_ip = ip_addr
  WHERE id = token_record.id;

  -- Set context for secure verification
  PERFORM set_config('app.verification_context', 'secure_verify', true);

  -- Update profile as verified
  UPDATE profile 
  SET 
    is_email_verified = true, 
    verified_at = NOW()
  WHERE id = token_record.profile_id;

  -- Reset context
  PERFORM set_config('app.verification_context', '', true);

  -- Clean up old/expired tokens for this profile
  DELETE FROM email_verification_tokens 
  WHERE 
    profile_id = token_record.profile_id 
    AND id != token_record.id;

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Email successfully verified',
    'profile_id', token_record.profile_id
  );
END;
$$;

CREATE OR REPLACE FUNCTION "public"."create_email_verification_token"(
  profile_id_input uuid,
  email_input text,
  creator_ip text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_token text;
  token_id uuid;
  profile_exists boolean;
  ip_addr inet;
BEGIN
  -- Safely convert IP string to inet, handle invalid IPs
  BEGIN
    IF creator_ip IS NOT NULL AND creator_ip != 'unknown' AND creator_ip != '' THEN
      ip_addr := creator_ip::inet;
    ELSE
      ip_addr := NULL;
    END IF;
  EXCEPTION WHEN others THEN
    ip_addr := NULL;
  END;
  -- Verify profile exists and email matches
  SELECT EXISTS(
    SELECT 1 FROM profile 
    WHERE id = profile_id_input 
    AND email = email_input
  ) INTO profile_exists;

  IF NOT profile_exists THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'INVALID_PROFILE',
      'message', 'Profile not found or email mismatch'
    );
  END IF;

  -- Generate cryptographically secure token
  new_token := encode(gen_random_bytes(32), 'base64');
  new_token := replace(replace(replace(new_token, '/', '-'), '+', '_'), '=', '');

  -- Clean up any existing tokens for this profile
  DELETE FROM email_verification_tokens 
  WHERE profile_id = profile_id_input;

  -- Insert new token
  INSERT INTO email_verification_tokens (
    profile_id, 
    token, 
    email, 
    expires_at,
    created_by_ip
  ) VALUES (
    profile_id_input,
    new_token,
    email_input,
    NOW() + INTERVAL '1 hour', -- 1 hour expiration
    ip_addr
  ) RETURNING id INTO token_id;

  RETURN jsonb_build_object(
    'success', true,
    'token', new_token,
    'token_id', token_id,
    'expires_at', NOW() + INTERVAL '1 hour'
  );
END;
$$;

-- Step 5: Add indexes for performance
CREATE INDEX idx_email_verification_tokens_token ON email_verification_tokens(token);
CREATE INDEX idx_email_verification_tokens_profile_id ON email_verification_tokens(profile_id);
CREATE INDEX idx_email_verification_tokens_expires_at ON email_verification_tokens(expires_at);

-- Step 6: Add RLS for verification tokens table
ALTER TABLE "public"."email_verification_tokens" ENABLE ROW LEVEL SECURITY;

-- Only allow service role to manage verification tokens
CREATE POLICY "Service role can manage verification tokens" ON "public"."email_verification_tokens"
FOR ALL 
TO service_role
USING (true)
WITH CHECK (true);

-- Step 7: Clean up expired tokens periodically (via cron job or manual cleanup)
CREATE OR REPLACE FUNCTION "public"."cleanup_expired_verification_tokens"()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_count integer;
BEGIN
  DELETE FROM email_verification_tokens 
  WHERE expires_at < NOW() - INTERVAL '24 hours';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

-- Step 8: Grant necessary permissions
GRANT EXECUTE ON FUNCTION "public"."verify_email_with_token"(text, text) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION "public"."create_email_verification_token"(uuid, text, text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION "public"."cleanup_expired_verification_tokens"() TO service_role;

-- Security audit log
COMMENT ON TABLE "public"."email_verification_tokens" IS 'Secure email verification tokens - CVE fix for email verification bypass';
COMMENT ON FUNCTION "public"."verify_email_with_token" IS 'Securely verify email with cryptographic token validation';
COMMENT ON FUNCTION "public"."create_email_verification_token" IS 'Generate secure verification tokens with expiration';