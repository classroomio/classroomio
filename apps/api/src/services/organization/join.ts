import { AppError, ErrorCodes } from '@api/utils/errors';
import {
  getOrganizationById,
  getOrganizationMemberIdByOrgAndProfile,
  selectOrganizationMemberByOrgAndNormalizedEmail
} from '@cio/db/queries/organization';
import { getActivePendingOrgInviteForEmail } from '@cio/db/queries/organization/invite';

import { ROLE } from '@cio/utils/constants';
import { scheduleCourseRoleReconcile } from '@cio/core/services/organization/course-roles';
import { getProfileById } from '@cio/db/queries/auth';
import { db } from '@cio/db/drizzle';
import { env } from '@cio/core/config/env';
import {
  bindProfileInOrg,
  buildFulfilledSummary,
  runBindingSideEffects,
  type TInviteFulfilment
} from './invite-binding';

interface OrgSignupSettings {
  signup?: {
    inviteOnly?: boolean;
  };
}

export interface JoinOrganizationResult {
  alreadyMember: boolean;
  /** True when an email-only roster row was linked to the signing-in profile (session refresh needed). */
  linkedExistingMember: boolean;
  /** True when the user has an active org invite — caller should surface accept UI instead of joining. */
  pendingInvite?: boolean;
  /** Courses/cohorts fulfilled from the learner's other same-org invitations. */
  fulfilled?: TInviteFulfilment;
}

/**
 * Joins an authenticated user to an open organization as a student.
 *
 * The caller owns the intent: tenant signup invokes this after creating a new
 * account, while an existing account invokes it from the explicit Join Academy
 * action. Login and app bootstrap never call this service. A verified email already on the roster is linked even
 * when the organization is invite-only or closed to signup; everyone else must pass those settings.
 */
export async function joinOrganization(userId: string, orgId: string): Promise<JoinOrganizationResult> {
  if (env.PUBLIC_IS_SELFHOSTED === 'true') {
    throw new AppError('Join Academy is only available on cloud tenant sites', ErrorCodes.FORBIDDEN, 403);
  }

  const existingMemberId = await getOrganizationMemberIdByOrgAndProfile(orgId, userId);
  if (existingMemberId) {
    return { alreadyMember: true, linkedExistingMember: false };
  }

  const profile = await getProfileById(userId);
  if (!profile?.email) {
    throw new AppError('Profile email not found', ErrorCodes.NOT_FOUND, 404);
  }

  const normalizedEmail = profile.email.toLowerCase().trim();

  const pendingInvite = await getActivePendingOrgInviteForEmail(orgId, normalizedEmail);
  if (pendingInvite) {
    return { alreadyMember: false, linkedExistingMember: false, pendingInvite: true };
  }

  const rosterMember = await selectOrganizationMemberByOrgAndNormalizedEmail(db, orgId, normalizedEmail);
  const isVerifiedRosterMember = !!rosterMember && !rosterMember.profileId && profile.isEmailVerified === true;
  if (!isVerifiedRosterMember) {
    await assertOrganizationOpenForSignup(orgId);
  }

  const bindResult = await db.transaction(async (tx) =>
    bindProfileInOrg(tx, {
      orgId,
      profileId: userId,
      email: normalizedEmail,
      trigger: 'join-academy',
      identityProven: profile.isEmailVerified === true,
      roleForNewMember: ROLE.STUDENT
    })
  );

  await runBindingSideEffects(bindResult, {
    orgId,
    profileId: userId,
    email: normalizedEmail,
    trigger: 'join-academy'
  });

  // A course team role from a previous membership must not come back on rejoin.
  await scheduleCourseRoleReconcile(orgId, userId);

  const fulfilled = await buildFulfilledSummary(orgId, bindResult);

  return {
    alreadyMember: !bindResult.createdMember,
    linkedExistingMember: bindResult.linkedPendingMember,
    fulfilled
  };
}

async function assertOrganizationOpenForSignup(orgId: string): Promise<void> {
  const organization = await getOrganizationById(orgId);
  if (!organization) {
    throw new AppError('Organization not found', ErrorCodes.NOT_FOUND, 404);
  }

  if (organization.disableSignup) {
    throw new AppError('Signup is disabled for this organization', ErrorCodes.FORBIDDEN, 403);
  }

  const settings = organization.settings as OrgSignupSettings | null;
  if (settings?.signup?.inviteOnly) {
    throw new AppError('This organization requires an invitation to join', ErrorCodes.FORBIDDEN, 403);
  }
}
