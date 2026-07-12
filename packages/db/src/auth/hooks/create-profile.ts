import * as schema from '@db/schema';

import { eq } from 'drizzle-orm';

import { User, type GenericEndpointContext } from 'better-auth';
import { db } from '@db/drizzle';
import { hasVerifiedEmailProvider } from '@db/queries/auth/profile';
import { getOrganizationById, getOrganizationCount } from '@db/queries/organization';
import { ensureOrgMembership, ssoProvisioningHook } from './sso-provisioning';

/**
 * True when this is a first-time signup on a self-hosted instance (no orgs exist yet).
 * The first signup creates the only org; we auto-verify their email.
 */
async function isSelfHostedFirstSignup(): Promise<boolean> {
  if (process.env.PUBLIC_IS_SELFHOSTED !== 'true') return false;
  const count = await getOrganizationCount();
  return count === 0;
}

/**
 * Enrolls the new user in the org they signed up under, when the signup request
 * carried the tenant's `cio-org-id` header (dashboard sends it for org-site /
 * self-hosted signups). This makes the common email/password path create the
 * `organizationmember` row atomically at signup instead of relying on the
 * client-side auto-enroll fallback.
 *
 * `signupGuard` has already enforced `disableSignup` / invite-only rules before
 * the user was created, and `ensureOrgMembership` accepts any matching invite
 * (with its role) or falls back to the org's default (STUDENT) role. OAuth
 * signups don't carry the header (redirect flow), so those still rely on the
 * client-side auto-enroll fallback.
 */
async function enrollFromSignupOrgContext(user: User, ctx?: GenericEndpointContext | null): Promise<void> {
  const orgId = ctx?.request?.headers?.get('cio-org-id') ?? ctx?.headers?.get('cio-org-id');
  if (!orgId || !user.email) {
    return;
  }

  try {
    const organization = await getOrganizationById(orgId);
    if (!organization) {
      return;
    }

    await ensureOrgMembership(user.id, user.email, orgId);
  } catch (error) {
    console.error('enrollFromSignupOrgContext error:', error);
  }
}

/**
 * This hook runs after user creation (email/password or OAuth signup).
 *
 * We use the profile table for everything related to the user because we heavily used supabase and supabase didn't allow you add fields to the auth.users table.
 *
 * Self-hosted first signup: auto-verify email (no orgs exist yet, this user will create the only org).
 */
export const createProfileHook = async (user: User, ctx?: GenericEndpointContext | null) => {
  console.log('[auth] createProfileHook: running', { userId: user.id });

  const existingProfile = await db.select().from(schema.profile).where(eq(schema.profile.id, user.id)).limit(1);
  console.debug('existingProfile', existingProfile);

  let isEmailVerified = user.emailVerified || (await hasVerifiedEmailProvider(user.id));

  // Self-hosted first signup: auto-verify email and update existing profile if needed
  if (!isEmailVerified && (await isSelfHostedFirstSignup())) {
    isEmailVerified = true;
    await db.update(schema.user).set({ emailVerified: true }).where(eq(schema.user.id, user.id));
    // Also mark the profile as verified if it already exists
    if (existingProfile.length) {
      await db
        .update(schema.profile)
        .set({ isEmailVerified: true, verifiedAt: new Date().toISOString() })
        .where(eq(schema.profile.id, user.id));
      await enrollFromSignupOrgContext(user, ctx);
      return;
    }
  }

  if (existingProfile.length) {
    if (!existingProfile[0].isEmailVerified && isEmailVerified) {
      await db.update(schema.user).set({ emailVerified: true }).where(eq(schema.user.id, user.id));
      await db
        .update(schema.profile)
        .set({ isEmailVerified: true, verifiedAt: new Date().toISOString() })
        .where(eq(schema.profile.id, user.id));
    }

    await enrollFromSignupOrgContext(user, ctx);
    return;
  }

  const verifiedAt = isEmailVerified ? new Date().toISOString() : undefined;

  // Extract username from email (part before @)
  const emailMatch = user.email?.match(/^([^@]+)@/);
  const emailPrefix = emailMatch ? emailMatch[1] : 'user';
  const username = `${emailPrefix}${new Date().getTime()}`;
  const fullname = emailPrefix;

  try {
    const newProfile = await db.insert(schema.profile).values({
      id: user.id,
      username,
      fullname,
      email: user.email || undefined,
      isEmailVerified,
      verifiedAt
    });
    console.debug('newProfile', newProfile);

    // Run SSO provisioning hook for JIT org membership (email-domain match)
    await ssoProvisioningHook(user);

    // Enroll into the tenant the user signed up under (cio-org-id header).
    await enrollFromSignupOrgContext(user, ctx);
  } catch (error) {
    console.error('Error creating profile for user:', error);
  }
};
