import { emitOrganizationMemberWebhookEvent } from '@cio/core/services/webhook/emit';
import { AppError, ErrorCodes } from '@api/utils/errors';
import {
  countActiveStudents,
  ensureSelfHostedStudentMembership,
  getOrganizationByProfileId,
  getUserOrgRolesMap
} from '@cio/db/queries/organization';
import { getPlanLimit, toResourceUsage } from '@cio/utils/plans';
import {
  getProfileByEmail,
  getProfileById,
  syncProfileEmailVerificationFromAuthUser,
  updateAuthUserProfile,
  updateProfile
} from '@cio/db/queries/auth';

import { db, type DbOrTxClient } from '@cio/db/drizzle';
import { getPostgresError } from '@cio/utils/errors';
import type { OrganizationWithMemberAndPlans } from '@cio/db/queries/organization/types';
import { sendProfileUpdatedEmail } from './profile-updated-email';
import { ROLE } from '@cio/utils/constants';
import type { TProfile } from '@cio/db/types';
import type { TUpdateProfile } from '@cio/utils/validation/account';
import { countOrgTemplates } from '@cio/db/queries/course';
import { env } from '@cio/core/config/env';
import { getLicenseStatus } from '@cio/core/services/license';

export type GetAccountDataResult = {
  profile: TProfile;
  organizations: OrganizationWithMemberAndPlans[];
  licenseFeatures: string[];
};

/**
 * Fetches account data including profile and organizations for a user
 * In self-hosted mode: auto-adds non-member users as students to the single org
 * @param userId - The user ID to fetch account data for
 * @returns Account data with profile and organizations
 */
export async function getAccountData(userId: string): Promise<GetAccountDataResult> {
  const isSelfHosted = env.PUBLIC_IS_SELFHOSTED === 'true';

  let [profile, organizations, licenseStatus] = await Promise.all([
    getProfileById(userId),
    getOrganizationByProfileId(userId),
    isSelfHosted ? getLicenseStatus() : Promise.resolve({ valid: true, features: [] as string[] })
  ]);

  if (!profile) {
    throw new AppError(`Account not found for user ID: ${userId}`, ErrorCodes.ACCOUNT_NOT_FOUND, 404);
  }

  profile = (await syncProfileEmailVerificationFromAuthUser(userId)) ?? profile;

  // Self-hosted: auto-add user as student to the single org if they are not a member.
  // Skip if they already have membership (by profileId) or a pending invite (by email).
  // Also skip if the user is an admin/tutor in any org — they should not be downgraded to student.
  if (isSelfHosted && organizations.length === 0) {
    const orgRoles = await getUserOrgRolesMap(userId);
    const isTeamMember = Object.values(orgRoles).some((roleId) => roleId === ROLE.ADMIN || roleId === ROLE.TUTOR);

    if (!isTeamMember) {
      const { ensured: membershipEnsured, createdMember } = await ensureSelfHostedStudentMembership({
        profileId: userId,
        email: profile.email
      });

      if (createdMember) {
        await emitOrganizationMemberWebhookEvent(
          'organization.member.added',
          createdMember.organizationId,
          createdMember,
          userId
        );
      }

      if (membershipEnsured) {
        organizations = await getOrganizationByProfileId(userId);
      }
    }
  }

  // Attach per-resource usage + plan limits for admin/tutor members only.
  // Plain COUNTs (no rows) so the payload stays light and students never
  // receive org limit data. Skip self-hosted (unlimited, matching the guard).
  if (!isSelfHosted) {
    await Promise.all(
      organizations.map(async (org) => {
        if (org.roleId !== ROLE.ADMIN && org.roleId !== ROLE.TUTOR) return;

        const activePlan = org.plans.find((plan) => plan.isActive);
        const studentsUsed = await countActiveStudents(org.id);
        const studentsLimit = getPlanLimit('students', activePlan?.planName);
        const templatesUsed = await countOrgTemplates(org.id);
        const templatesLimit = getPlanLimit('templates', activePlan?.planName);

        org.limits = {
          students: toResourceUsage(studentsUsed, studentsLimit),
          templates: toResourceUsage(templatesUsed, templatesLimit)
        };
      })
    );
  }

  return {
    profile,
    organizations,
    licenseFeatures: isSelfHosted ? licenseStatus.features : []
  };
}

export type TProfileField = 'fullname' | 'username' | 'avatarUrl' | 'locale';

/** Who changed a profile. Decides the wording and branding of the profile-updated email. */
export type TProfileChangeActor =
  | { kind: 'self'; orgId?: string }
  | { kind: 'org_admin'; orgId: string; actorId: string };

export type TAppliedProfileUpdate = {
  profile: TProfile;
  previous: TProfile;
  changedFields: TProfileField[];
};

/**
 * The one write path for profile edits (dashboard, public API, MCP). Writes only the fields whose value
 * changes and keeps the auth user's name and image in step. Pass a transaction to join a larger write,
 * then call `sendProfileUpdatedEmail` once it commits.
 */
export async function applyProfileUpdate(
  userId: string,
  data: TUpdateProfile,
  dbClient: DbOrTxClient = db
): Promise<TAppliedProfileUpdate> {
  const previous = await getProfileById(userId, dbClient);
  if (!previous) {
    throw new AppError(`Profile not found for user ID: ${userId}`, ErrorCodes.PROFILE_NOT_FOUND, 404);
  }

  const changes: TUpdateProfile = {};
  if (data.fullname !== undefined && data.fullname !== previous.fullname) changes.fullname = data.fullname;
  if (data.username !== undefined && data.username !== previous.username) changes.username = data.username;
  if (data.avatarUrl !== undefined && data.avatarUrl !== previous.avatarUrl) changes.avatarUrl = data.avatarUrl;
  if (data.locale !== undefined && data.locale !== previous.locale) changes.locale = data.locale;

  const changedFields = Object.keys(changes) as TProfileField[];
  if (changedFields.length === 0) {
    return { profile: previous, previous, changedFields };
  }

  let profile: TProfile | undefined;
  try {
    profile = await updateProfile(userId, changes, dbClient);
  } catch (error) {
    if (getPostgresError(error)?.constraint === 'profile_username_key') {
      throw new AppError('Username already exists', ErrorCodes.VALIDATION_ERROR, 400, 'username');
    }
    throw error;
  }

  if (!profile) {
    throw new AppError(`Profile not found for user ID: ${userId}`, ErrorCodes.PROFILE_NOT_FOUND, 404);
  }

  if (changes.fullname !== undefined || changes.avatarUrl !== undefined) {
    await updateAuthUserProfile(userId, { name: changes.fullname, image: changes.avatarUrl }, dbClient);
  }

  return { profile, previous, changedFields };
}

/**
 * Updates a user's profile and emails them about it.
 * @param userId - The user whose profile changes
 * @param data - The profile fields to set
 * @param actor - Who made the change; defaults to the user themselves
 * @returns Updated profile data
 */
export async function updateUser(userId: string, data: TUpdateProfile, actor: TProfileChangeActor = { kind: 'self' }) {
  try {
    const update = await db.transaction((tx) => applyProfileUpdate(userId, data, tx));
    await sendProfileUpdatedEmail(update, actor);

    return update.profile;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError(
      error instanceof Error ? error.message : 'Failed to update profile',
      ErrorCodes.PROFILE_UPDATE_FAILED,
      500
    );
  }
}

/**
 * Gets profile by email
 * @param email - The email address
 * @returns Profile or null if not found
 */
export async function getProfileByEmailService(email: string): Promise<TProfile | null> {
  try {
    const profile = await getProfileByEmail(email);
    return profile;
  } catch (error) {
    throw new AppError(
      error instanceof Error ? error.message : 'Failed to fetch profile by email',
      ErrorCodes.PROFILE_NOT_FOUND,
      500
    );
  }
}
