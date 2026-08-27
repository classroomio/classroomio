import { AppError, ErrorCodes } from '@api/utils/errors';
import {
  createOrganizationMember,
  getOrganizationById,
  getOrganizationMemberIdByOrgAndProfile
} from '@cio/db/queries/organization';
import {
  getActivePendingOrgInviteForEmail,
  selectOrganizationMemberByOrgAndNormalizedEmail,
  updateOrganizationMemberById
} from '@cio/db/queries/organization/invite';

import { ROLE } from '@cio/utils/constants';
import { getProfileById } from '@cio/db/queries/auth';
import { db } from '@cio/db/drizzle';
import { env } from '@cio/core/config/env';
import { assertStudentCapacityOrThrow } from './student-limit';

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
}

/**
 * Links a pre-existing org roster row (audience import, team invite, tutor add)
 * that was created with email but no profile_id yet. Preserves the existing role
 * (TUTOR, ADMIN, etc.) — does not downgrade to STUDENT.
 */
async function linkExistingMemberByEmail(
  userId: string,
  orgId: string,
  normalizedEmail: string
): Promise<JoinOrganizationResult | null> {
  const existingMemberByEmail = await selectOrganizationMemberByOrgAndNormalizedEmail(db, orgId, normalizedEmail);

  if (!existingMemberByEmail) {
    return null;
  }

  if (existingMemberByEmail.profileId && existingMemberByEmail.profileId !== userId) {
    throw new AppError('Email is already linked to another profile', ErrorCodes.CONFLICT, 409);
  }

  if (!existingMemberByEmail.profileId) {
    await updateOrganizationMemberById(db, existingMemberByEmail.id, {
      profileId: userId,
      email: normalizedEmail,
      verified: true
    });

    return { alreadyMember: true, linkedExistingMember: true };
  }

  return { alreadyMember: true, linkedExistingMember: false };
}

/**
 * Joins an authenticated user to an open organization as a student.
 *
 * The caller owns the intent: tenant signup invokes this after creating a new
 * account, while an existing account invokes it from the explicit Join Academy
 * action. Login and app bootstrap never call this service.
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

  const linked = await linkExistingMemberByEmail(userId, orgId, normalizedEmail);
  if (linked) {
    return linked;
  }

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

  await assertStudentCapacityOrThrow(orgId, 1);

  await createOrganizationMember({
    organizationId: orgId,
    profileId: userId,
    email: normalizedEmail,
    roleId: ROLE.STUDENT,
    verified: true
  });

  return { alreadyMember: false, linkedExistingMember: false };
}
