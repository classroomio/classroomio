import { AppError, ErrorCodes } from '@api/utils/errors';
import {
  createOrganizationMember,
  getOrganizationById,
  getOrganizationMemberIdByOrgAndProfile
} from '@cio/db/queries/organization';

import { ROLE } from '@cio/utils/constants';
import { getProfileById } from '@cio/db/queries/auth';

interface OrgSignupSettings {
  signup?: {
    inviteOnly?: boolean;
  };
}

export interface AutoEnrollResult {
  alreadyMember: boolean;
}

/**
 * Auto-enroll the authenticated user as a STUDENT in the given org. Used by
 * the dashboard when a newly-signed-in user lands on a tenant site they
 * aren't yet a member of (free-tier `<org>.classroomio.school` or a verified
 * BYOD domain).
 *
 * Idempotent: existing members get an `alreadyMember: true` no-op so invited
 * admins/tutors don't get downgraded.
 *
 * Respects the same org policies as `signupGuard` does for email/password
 * signups: `disableSignup` and `settings.signup.inviteOnly` both block the
 * insert.
 */
export async function autoEnrollStudent(userId: string, orgId: string): Promise<AutoEnrollResult> {
  const existingMemberId = await getOrganizationMemberIdByOrgAndProfile(orgId, userId);
  if (existingMemberId) {
    return { alreadyMember: true };
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

  const profile = await getProfileById(userId);
  if (!profile?.email) {
    throw new AppError('Profile email not found', ErrorCodes.NOT_FOUND, 404);
  }

  await createOrganizationMember({
    organizationId: orgId,
    profileId: userId,
    email: profile.email,
    roleId: ROLE.STUDENT,
    verified: true
  });

  return { alreadyMember: false };
}
