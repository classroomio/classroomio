import * as schema from '@db/schema';

import { and, eq, isNull } from 'drizzle-orm';

import { User } from 'better-auth';
import { db } from '@db/drizzle';
import { enrollUsersInCourseGroups } from '@db/queries/group';
import { getOrgCourseGroups } from '@db/queries/course';
import { markUserAndProfileEmailVerified } from '@db/queries/auth';
import { getInviteBindingHandler } from '@db/auth/invite-binding-handler';

const DEFAULT_STUDENT_ROLE_ID = 3;

/**
 * Ensure a user is a member of the given organization.
 * If membership exists, no-op. For a proven email, a pending membership is linked and its invite accepted, and the
 * email is marked verified. Otherwise a new membership is created with the given roleId or the org's default role.
 * @param identityProven True only when the caller has proof the user owns `email` (IdP assertion, signed token, or a
 * verified email); pending access and the verified flag are never granted without it.
 */
export async function ensureOrgMembership(
  userId: string,
  email: string,
  orgId: string,
  roleId: number | undefined,
  trigger: 'sso' | 'token-auth',
  identityProven: boolean
): Promise<void> {
  const emailLower = email.toLowerCase();
  console.log('ensureOrgMembership', {
    userId,
    orgId,
    roleId,
    email
  });

  const bindingHandler = getInviteBindingHandler();
  if (bindingHandler) {
    const sideEffects = await db.transaction(async (tx) => {
      const result = await bindingHandler(tx, {
        orgId,
        profileId: userId,
        email: emailLower,
        trigger,
        identityProven,
        roleForNewMember: roleId
      });
      return result.sideEffects ?? [];
    });
    if (identityProven) {
      await markUserAndProfileEmailVerified(userId).catch((error) => {
        console.error('ensureOrgMembership mark verified error:', error);
      });
    }
    for (const run of sideEffects) {
      try {
        await run();
      } catch (error) {
        console.error('ensureOrgMembership post-commit side effect error:', error);
      }
    }
    return;
  }

  const [existingByProfile] = await db
    .select()
    .from(schema.organizationmember)
    .where(and(eq(schema.organizationmember.organizationId, orgId), eq(schema.organizationmember.profileId, userId)))
    .limit(1);

  if (existingByProfile) {
    return;
  }

  /** Audience import pre-creates a row with org + email before profile exists; do not insert again. */
  const [existingByEmail] = await db
    .select()
    .from(schema.organizationmember)
    .where(and(eq(schema.organizationmember.organizationId, orgId), eq(schema.organizationmember.email, emailLower)))
    .limit(1);

  if (existingByEmail?.profileId && existingByEmail.profileId !== userId) {
    console.error('ensureOrgMembership: org member email already linked to another profile');
    return;
  }

  if (existingByEmail && !identityProven) {
    console.error('ensureOrgMembership: refusing to link a pending membership to an unverified email');
    return;
  }

  const [invite] = await db
    .select()
    .from(schema.organizationInvite)
    .where(
      and(
        eq(schema.organizationInvite.organizationId, orgId),
        eq(schema.organizationInvite.email, emailLower),
        eq(schema.organizationInvite.isRevoked, false),
        isNull(schema.organizationInvite.acceptedAt)
      )
    )
    .limit(1);

  if (invite && identityProven) {
    await db.transaction(async (tx) => {
      if (existingByEmail) {
        await tx
          .update(schema.organizationmember)
          .set({
            profileId: userId,
            email: emailLower,
            roleId: invite.roleId,
            verified: true
          })
          .where(eq(schema.organizationmember.id, existingByEmail.id));
      } else {
        await tx.insert(schema.organizationmember).values({
          organizationId: orgId,
          profileId: userId,
          email: emailLower,
          roleId: invite.roleId,
          verified: true
        });
      }

      await tx
        .update(schema.organizationInvite)
        .set({
          acceptedAt: new Date().toISOString(),
          acceptedByProfileId: userId,
          updatedAt: new Date().toISOString()
        })
        .where(eq(schema.organizationInvite.id, invite.id));

      await markUserAndProfileEmailVerified(userId, tx);
    });

    const metadata = invite.metadata as Record<string, unknown> | null;
    const courseIds = Array.isArray(metadata?.courseIds) ? (metadata.courseIds as string[]) : [];

    if (courseIds.length > 0) {
      try {
        const courseGroups = await getOrgCourseGroups(orgId, courseIds);
        const validGroupIds = courseGroups.map((cg) => cg.groupId).filter(Boolean) as string[];
        await enrollUsersInCourseGroups(validGroupIds, [{ profileId: userId, email: emailLower }], invite.roleId);
      } catch (error) {
        console.error('ensureOrgMembership course enrollment error:', error);
      }
    }

    console.debug('User joined org via invite:', orgId);
    return;
  }

  if (existingByEmail) {
    const [policy] = await db
      .select()
      .from(schema.organizationAuthPolicy)
      .where(eq(schema.organizationAuthPolicy.organizationId, orgId))
      .limit(1);

    const defaultRoleId = policy?.defaultRoleId ?? DEFAULT_STUDENT_ROLE_ID;
    const finalRoleId = roleId ?? defaultRoleId;

    await db
      .update(schema.organizationmember)
      .set({
        profileId: userId,
        verified: true,
        roleId: finalRoleId
      })
      .where(eq(schema.organizationmember.id, existingByEmail.id));

    console.debug('User linked to existing org membership row:', orgId);
    return;
  }

  const [policy] = await db
    .select()
    .from(schema.organizationAuthPolicy)
    .where(eq(schema.organizationAuthPolicy.organizationId, orgId))
    .limit(1);

  const defaultRoleId = policy?.defaultRoleId ?? DEFAULT_STUDENT_ROLE_ID;
  const finalRoleId = roleId ?? defaultRoleId;

  await db.insert(schema.organizationmember).values({
    organizationId: orgId,
    profileId: userId,
    email: emailLower,
    roleId: finalRoleId,
    verified: true
  });

  console.debug('User auto-joined org:', orgId);
}

/**
 * The SSO provider that authenticated a sign-up, read from the better-auth endpoint context of an SSO callback
 * (`/sso/callback/:providerId`, `/sso/saml2/sp/acs/:providerId`); null for any other sign-up path.
 */
export function getSsoProviderIdFromContext(
  context: { path?: string; params?: Record<string, unknown> | null } | null | undefined
): string | null {
  if (!context?.path?.startsWith('/sso/')) return null;

  const providerId = context.params?.providerId;
  return typeof providerId === 'string' && providerId ? providerId : null;
}

/**
 * Handle JIT provisioning for users whose email domain has an active organization SSO config. The email counts as
 * proven when it is verified or when the sign-up came through that organization's own SSO provider; a password
 * sign-up on the same domain with an unverified email gets no pending access.
 */
export const ssoProvisioningHook = async (
  user: User,
  proof: { emailVerified: boolean; ssoProviderId: string | null }
) => {
  console.log('[auth] ssoProvisioningHook: running', { userId: user.id });
  if (!user.email) {
    console.debug('No email for user, skipping SSO provisioning');
    return;
  }

  const emailDomain = user.email.toLowerCase().split('@')[1];
  if (!emailDomain) {
    console.debug('Invalid email format, skipping SSO provisioning');
    return;
  }

  const [ssoConfig] = await db
    .select({
      config: schema.organizationSsoConfig,
      policy: schema.organizationAuthPolicy
    })
    .from(schema.organizationSsoConfig)
    .leftJoin(
      schema.organizationAuthPolicy,
      eq(schema.organizationSsoConfig.organizationId, schema.organizationAuthPolicy.organizationId)
    )
    .where(and(eq(schema.organizationSsoConfig.domain, emailDomain), eq(schema.organizationSsoConfig.isActive, true)))
    .limit(1);

  if (!ssoConfig?.config) {
    console.debug('No active SSO config for domain:', emailDomain);
    return;
  }

  const orgId = ssoConfig.config.organizationId;
  const signedInWithOrgProvider = proof.ssoProviderId === ssoConfig.config.betterAuthProviderId;
  const identityProven = proof.emailVerified || signedInWithOrgProvider;
  await ensureOrgMembership(user.id, user.email, orgId, undefined, 'sso', identityProven);
};
