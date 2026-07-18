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
import { assertStudentCapacityOrThrow } from './student-limit';

interface OrgSignupSettings {
  signup?: {
    inviteOnly?: boolean;
  };
}

export interface AutoJoinResult {
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
): Promise<AutoJoinResult | null> {
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
 * Auto-join the authenticated user to the given org. Used by the dashboard when
 * a newly-signed-in user lands on a tenant site they aren't yet a member of
 * (free-tier `<org>.myclassroomio.com` or a verified BYOD domain).
 *
 * New members are created as STUDENT when no roster row or invite applies.
 * Idempotent: existing members get an `alreadyMember: true` no-op so invited
 * admins/tutors don't get downgraded.
 *
 * Pre-existing roster rows matched by email (e.g. tutors added with
 * `profile_id` null) are linked before signup policy checks — invite-only and
 * disableSignup only apply to net-new student signups.
 */
export async function autoJoinOrg(userId: string, orgId: string): Promise<AutoJoinResult> {
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
