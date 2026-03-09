import { User } from 'better-auth';
import { db } from '@db/drizzle';
import * as schema from '@db/schema';
import { eq, sql } from 'drizzle-orm';

/**
 * Check if signup is allowed for the given email domain
 * Returns { allowed: boolean, message?: string }
 */
export async function checkSignupAllowed(email: string): Promise<{ allowed: boolean; message?: string }> {
  const domain = email.split('@')[1]?.toLowerCase();
  if (!domain) {
    return { allowed: false, message: 'Invalid email address' };
  }

  try {
    // Find organization by email domain (via SSO config or custom domain)
    const orgResult = await db
      .select({
        org: schema.organization,
        ssoConfig: schema.organizationSsoConfig
      })
      .from(schema.organization)
      .leftJoin(schema.organizationSsoConfig, eq(schema.organization.id, schema.organizationSsoConfig.organizationId))
      .where(
        sql`LOWER(${schema.organizationSsoConfig.domain}) = LOWER(${domain}) OR 
            LOWER(${schema.organization.customDomain}) = LOWER(${domain}) OR
            EXISTS (
              SELECT 1 FROM ${schema.organizationmember} 
              JOIN ${schema.profile} ON ${schema.organizationmember.profileId} = ${schema.profile.id}
              WHERE LOWER(${schema.profile.email}) = LOWER(${email})
              LIMIT 1
            )`
      )
      .limit(1);

    if (!orgResult.length) {
      // No org found with this domain - allow signup (default behavior)
      return { allowed: true };
    }

    const org = orgResult[0].org;

    // Check if signup is disabled for this org
    if (org.disableSignup) {
      return {
        allowed: false,
        message: 'Signup is disabled for this organization. Please contact your administrator for an invitation.'
      };
    }

    return { allowed: true };
  } catch (error) {
    console.error('Error checking signup allowed:', error);
    // Allow on error to not block legitimate users
    return { allowed: true };
  }
}

/**
 * Check if email/password login is allowed
 */
export async function checkEmailPasswordAllowed(email: string): Promise<{ allowed: boolean; message?: string }> {
  const domain = email.split('@')[1]?.toLowerCase();
  if (!domain) {
    return { allowed: true }; // Let normal validation handle invalid email
  }

  try {
    // Find organization by domain or existing membership
    const orgResult = await db
      .select({
        org: schema.organization
      })
      .from(schema.organization)
      .leftJoin(schema.organizationSsoConfig, eq(schema.organization.id, schema.organizationSsoConfig.organizationId))
      .where(
        sql`LOWER(${schema.organizationSsoConfig.domain}) = LOWER(${domain}) OR 
            LOWER(${schema.organization.customDomain}) = LOWER(${domain}) OR
            EXISTS (
              SELECT 1 FROM ${schema.organizationmember} 
              JOIN ${schema.profile} ON ${schema.organizationmember.profileId} = ${schema.profile.id}
              WHERE LOWER(${schema.profile.email}) = LOWER(${email})
              LIMIT 1
            )`
      )
      .limit(1);

    if (!orgResult.length) {
      return { allowed: true };
    }

    const org = orgResult[0].org;

    if (org.disableEmailPassword) {
      return {
        allowed: false,
        message: 'Email/password login is disabled. Please use SSO or contact your administrator.'
      };
    }

    return { allowed: true };
  } catch (error) {
    console.error('Error checking email/password allowed:', error);
    return { allowed: true };
  }
}

/**
 * Check if Google OAuth is allowed
 */
export async function checkGoogleAuthAllowed(email: string): Promise<{ allowed: boolean; message?: string }> {
  const domain = email.split('@')[1]?.toLowerCase();
  if (!domain) {
    return { allowed: true };
  }

  try {
    const orgResult = await db
      .select({
        org: schema.organization
      })
      .from(schema.organization)
      .leftJoin(schema.organizationSsoConfig, eq(schema.organization.id, schema.organizationSsoConfig.organizationId))
      .where(
        sql`LOWER(${schema.organizationSsoConfig.domain}) = LOWER(${domain}) OR 
            LOWER(${schema.organization.customDomain}) = LOWER(${domain}) OR
            EXISTS (
              SELECT 1 FROM ${schema.organizationmember} 
              JOIN ${schema.profile} ON ${schema.organizationmember.profileId} = ${schema.profile.id}
              WHERE LOWER(${schema.profile.email}) = LOWER(${email})
              LIMIT 1
            )`
      )
      .limit(1);

    if (!orgResult.length) {
      return { allowed: true };
    }

    const org = orgResult[0].org;

    if (org.disableGoogleAuth) {
      return {
        allowed: false,
        message: 'Google authentication is disabled. Please use email/password or SSO.'
      };
    }

    return { allowed: true };
  } catch (error) {
    console.error('Error checking Google auth allowed:', error);
    return { allowed: true };
  }
}
