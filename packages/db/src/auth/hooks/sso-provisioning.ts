import * as schema from '@db/schema';

import { and, desc, eq, gt, isNull, or, sql } from 'drizzle-orm';

import { User } from 'better-auth';
import { db } from '@db/drizzle';
import { markUserAndProfileEmailVerified } from '@db/queries/auth';
import { getInviteEnrollmentHandler } from '../invite-handler';
import { ROLE } from '@cio/utils/constants';
import {
  parseCohortIdsFromInviteMetadata,
  parseCourseIdsFromInviteMetadata,
  parsePathIdsFromInviteMetadata
} from '@cio/utils/functions';

const DEFAULT_STUDENT_ROLE_ID = ROLE.STUDENT;

/**
 * Ensure a user is a member of the given organization.
 * If membership exists, no-op. If there's a pending invite, accept it.
 * Otherwise create membership with the given roleId or org's default role.
 */
export async function ensureOrgMembership(
  userId: string,
  email: string,
  orgId: string,
  roleId?: number
): Promise<void> {
  const emailLower = email.toLowerCase();
  console.log('ensureOrgMembership', {
    userId,
    orgId,
    roleId,
    email
  });

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

  const [invite] = await db
    .select()
    .from(schema.organizationInvite)
    .where(
      and(
        eq(schema.organizationInvite.organizationId, orgId),
        eq(schema.organizationInvite.email, emailLower),
        eq(schema.organizationInvite.isRevoked, false),
        isNull(schema.organizationInvite.acceptedAt),
        or(isNull(schema.organizationInvite.expiresAt), gt(schema.organizationInvite.expiresAt, sql`NOW()`))
      )
    )
    .orderBy(desc(schema.organizationInvite.createdAt))
    .limit(1);

  if (invite) {
    const courseIds = parseCourseIdsFromInviteMetadata(invite.metadata);
    const cohortIds = parseCohortIdsFromInviteMetadata(invite.metadata);
    const pathIds = parsePathIdsFromInviteMetadata(invite.metadata);
    const hasResources = courseIds.length > 0 || cohortIds.length > 0 || pathIds.length > 0;
    const handler = getInviteEnrollmentHandler();

    // Fail safe: accepting without enrolling would consume the invite and
    // silently drop its access. Leave it pending until a handler is registered.
    if (hasResources && !handler) {
      console.error('ensureOrgMembership: no invite enrollment handler registered; leaving invite pending', {
        inviteId: invite.id,
        orgId
      });
      return;
    }

    await db.transaction(async (tx) => {
      // A new STUDENT row takes a seat; an audience-imported row already holds one.
      if (!existingByEmail && invite.roleId === ROLE.STUDENT && handler) {
        await handler.assertStudentCapacity(orgId, 1, tx);
      }

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

      if (hasResources && handler) {
        await handler.enroll(tx, {
          courseIds,
          cohortIds,
          pathIds,
          organizationId: orgId,
          profileId: userId,
          email: emailLower,
          roleId: invite.roleId,
          grantedByProfileId: invite.createdByProfileId
        });
      }
    });

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
 * Handle JIT provisioning for SSO users
 * This runs after profile creation and creates organization membership
 */
export const ssoProvisioningHook = async (user: User) => {
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
  await ensureOrgMembership(user.id, user.email, orgId);
};
