/**
 * Main SSO Handler
 * Coordinates OIDC/SAML authentication and user provisioning
 */

import { db } from '@db/drizzle';
import * as schema from '@db/schema';
import { eq, and } from 'drizzle-orm';
import type { SsoConfig, SsoUserInfo, SsoInitiateResponse, SsoCallbackRequest } from './types';
import * as queries from './queries';
import { initiateOidcAuth, handleOidcCallback } from './oidc';
import { initiateSamlAuth, handleSamlCallback, parseSamlMetadata } from './saml';

export interface SsoAuthResult {
  user: {
    id: string;
    email: string;
    name: string;
    emailVerified: boolean;
  };
  profile: {
    id: string;
    fullname: string;
    email: string;
  };
  organizationMembership: {
    id: number;
    organizationId: string;
    roleId: number;
  };
  isNewUser: boolean;
  redirectUrl?: string;
}

/**
 * Initiate SSO authentication for an organization
 */
export async function initiateSsoAuth(
  organizationId: string,
  callbackUrl: string,
  redirectAfterAuth?: string
): Promise<SsoInitiateResponse> {
  // Get SSO config for organization
  const ssoConfig = await queries.getSsoConfigByOrgId(organizationId);

  if (!ssoConfig) {
    throw new Error('SSO is not configured for this organization');
  }

  if (!ssoConfig.enabled) {
    throw new Error('SSO is not enabled for this organization');
  }

  // Initiate based on provider type
  if (ssoConfig.providerType === 'oidc') {
    return initiateOidcAuth(ssoConfig, callbackUrl, redirectAfterAuth);
  } else if (ssoConfig.providerType === 'saml') {
    return initiateSamlAuth(ssoConfig, callbackUrl, redirectAfterAuth);
  } else {
    throw new Error(`Unsupported SSO provider type: ${ssoConfig.providerType}`);
  }
}

/**
 * Handle SSO callback and provision user
 */
export async function handleSsoCallback(
  request: SsoCallbackRequest,
  callbackUrl: string
): Promise<SsoAuthResult> {
  const { state, code, samlResponse, error, errorDescription } = request;

  // Check for errors from IdP
  if (error) {
    throw new Error(errorDescription || error);
  }

  if (!state) {
    throw new Error('Missing state parameter');
  }

  let userInfo: SsoUserInfo;
  let ssoConfig: SsoConfig;
  let redirectUrl: string | undefined;

  // Handle callback based on what we received
  if (code) {
    // OIDC callback
    const result = await handleOidcCallback(state, code, callbackUrl);
    userInfo = result.userInfo;
    ssoConfig = result.ssoConfig;
    redirectUrl = result.redirectUrl;
  } else if (samlResponse) {
    // SAML callback
    const result = await handleSamlCallback(state, samlResponse);
    userInfo = result.userInfo;
    ssoConfig = result.ssoConfig;
    redirectUrl = result.redirectUrl;
  } else {
    throw new Error('Missing authorization code or SAML response');
  }

  // Provision or update user
  const authResult = await provisionSsoUser(userInfo, ssoConfig);

  return {
    ...authResult,
    redirectUrl
  };
}

/**
 * Provision or link SSO user
 */
async function provisionSsoUser(
  userInfo: SsoUserInfo,
  ssoConfig: SsoConfig
): Promise<Omit<SsoAuthResult, 'redirectUrl'>> {
  const { email, name, firstName, lastName, avatar, sub } = userInfo;

  // Check if user already exists
  const existingUser = await db
    .select()
    .from(schema.user)
    .where(eq(schema.user.email, email))
    .limit(1);

  let userId: string;
  let isNewUser = false;

  if (existingUser.length > 0) {
    // User exists - update if needed
    userId = existingUser[0].id;

    // Update user info if changed
    const updateData: Partial<typeof schema.user.$inferInsert> = {};
    
    if (name && existingUser[0].name !== name) {
      updateData.name = name;
    }
    if (avatar && existingUser[0].image !== avatar) {
      updateData.image = avatar;
    }
    if (!existingUser[0].emailVerified) {
      updateData.emailVerified = true; // SSO users are considered verified
    }

    if (Object.keys(updateData).length > 0) {
      await db
        .update(schema.user)
        .set(updateData)
        .where(eq(schema.user.id, userId));
    }
  } else {
    // Create new user if auto-provisioning is enabled
    if (!ssoConfig.autoProvisionUsers) {
      throw new Error('User does not exist and auto-provisioning is disabled');
    }

    const displayName = name || [firstName, lastName].filter(Boolean).join(' ') || email.split('@')[0];

    const newUser = await db
      .insert(schema.user)
      .values({
        email,
        name: displayName,
        emailVerified: true, // SSO users are verified
        image: avatar
      })
      .returning();

    userId = newUser[0].id;
    isNewUser = true;
  }

  // Check/create SSO account link
  await ensureSsoAccountLink(userId, ssoConfig, sub || email);

  // Ensure profile exists
  const profile = await ensureProfile(userId, email, name, firstName, lastName, avatar);

  // Ensure organization membership
  const membership = await ensureOrganizationMembership(
    profile.id,
    ssoConfig.organizationId,
    ssoConfig.defaultRoleId || 3 // Default to student role (3)
  );

  // Get updated user
  const user = await db
    .select()
    .from(schema.user)
    .where(eq(schema.user.id, userId))
    .limit(1);

  return {
    user: {
      id: user[0].id,
      email: user[0].email,
      name: user[0].name,
      emailVerified: user[0].emailVerified
    },
    profile: {
      id: profile.id,
      fullname: profile.fullname,
      email: profile.email || email
    },
    organizationMembership: {
      id: membership.id,
      organizationId: membership.organizationId,
      roleId: membership.roleId
    },
    isNewUser
  };
}

/**
 * Ensure SSO account link exists
 */
async function ensureSsoAccountLink(
  userId: string,
  ssoConfig: SsoConfig,
  accountId: string
): Promise<void> {
  const providerId = `sso_${ssoConfig.providerName}_${ssoConfig.organizationId}`;

  // Check if account link exists
  const existing = await db
    .select()
    .from(schema.account)
    .where(
      and(
        eq(schema.account.userId, userId),
        eq(schema.account.providerId, providerId)
      )
    )
    .limit(1);

  if (existing.length === 0) {
    // Create account link
    await db.insert(schema.account).values({
      userId,
      providerId,
      accountId
    });
  }
}

/**
 * Ensure profile exists for user
 */
async function ensureProfile(
  userId: string,
  email: string,
  name?: string,
  firstName?: string,
  lastName?: string,
  avatar?: string
): Promise<{ id: string; fullname: string; email: string | null }> {
  // Check if profile exists
  const existing = await db
    .select()
    .from(schema.profile)
    .where(eq(schema.profile.id, userId))
    .limit(1);

  if (existing.length > 0) {
    // Update profile if needed
    const profile = existing[0];
    const updateData: Partial<typeof schema.profile.$inferInsert> = {};

    const fullname = name || [firstName, lastName].filter(Boolean).join(' ');
    if (fullname && profile.fullname !== fullname) {
      updateData.fullname = fullname;
    }
    if (avatar && profile.avatarUrl !== avatar) {
      updateData.avatarUrl = avatar;
    }
    if (!profile.isEmailVerified) {
      updateData.isEmailVerified = true;
      updateData.verifiedAt = new Date().toISOString();
    }

    if (Object.keys(updateData).length > 0) {
      await db
        .update(schema.profile)
        .set(updateData)
        .where(eq(schema.profile.id, userId));
    }

    return { id: profile.id, fullname: profile.fullname, email: profile.email };
  }

  // Create profile
  const emailPrefix = email.split('@')[0];
  const username = `${emailPrefix}${Date.now()}`;
  const fullname = name || [firstName, lastName].filter(Boolean).join(' ') || emailPrefix;

  const newProfile = await db
    .insert(schema.profile)
    .values({
      id: userId,
      username,
      fullname,
      email,
      avatarUrl: avatar,
      isEmailVerified: true,
      verifiedAt: new Date().toISOString()
    })
    .returning();

  return { id: newProfile[0].id, fullname: newProfile[0].fullname, email: newProfile[0].email };
}

/**
 * Ensure user is a member of the organization
 */
async function ensureOrganizationMembership(
  profileId: string,
  organizationId: string,
  defaultRoleId: number
): Promise<{ id: number; organizationId: string; roleId: number }> {
  // Check if membership exists
  const existing = await db
    .select()
    .from(schema.organizationmember)
    .where(
      and(
        eq(schema.organizationmember.profileId, profileId),
        eq(schema.organizationmember.organizationId, organizationId)
      )
    )
    .limit(1);

  if (existing.length > 0) {
    // Update verified status if needed
    if (!existing[0].verified) {
      await db
        .update(schema.organizationmember)
        .set({ verified: true })
        .where(eq(schema.organizationmember.id, existing[0].id));
    }
    return {
      id: Number(existing[0].id),
      organizationId: existing[0].organizationId,
      roleId: Number(existing[0].roleId)
    };
  }

  // Create membership
  const newMembership = await db
    .insert(schema.organizationmember)
    .values({
      profileId,
      organizationId,
      roleId: BigInt(defaultRoleId),
      verified: true
    })
    .returning();

  return {
    id: Number(newMembership[0].id),
    organizationId: newMembership[0].organizationId,
    roleId: Number(newMembership[0].roleId)
  };
}

/**
 * Get SSO configuration for organization (public info only)
 */
export async function getSsoConfigForLogin(organizationId: string): Promise<{
  enabled: boolean;
  forceSso: boolean;
  providerType: string;
  providerName: string;
  displayName: string;
} | null> {
  const config = await queries.getSsoConfigByOrgId(organizationId);

  if (!config || !config.enabled) {
    return null;
  }

  return {
    enabled: config.enabled,
    forceSso: config.forceSso,
    providerType: config.providerType,
    providerName: config.providerName,
    displayName: config.displayName || `Sign in with ${config.providerName}`
  };
}

// Re-export for convenience
export { parseSamlMetadata };
export * from './queries';
export * from './types';
