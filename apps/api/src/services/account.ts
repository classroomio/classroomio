import { AppError, ErrorCodes } from '@api/utils/errors';
import {
  createOrganizationMember,
  getFirstOrganization,
  getOrganizationByProfileId,
  hasOrgMemberByProfileIdOrEmail
} from '@cio/db/queries/organization';
import { getProfileByEmail, getProfileById, updateProfile } from '@cio/db/queries/auth';

import type { OrganizationWithMemberAndPlans } from '@cio/db/queries/organization/types';
import { ROLE } from '@cio/utils/constants';
import type { TProfile } from '@cio/db/types';
import { env } from '@api/config/env';
import { getLicenseStatus } from '@api/services/license';

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
  let [profile, organizations, licenseStatus] = await Promise.all([
    getProfileById(userId),
    getOrganizationByProfileId(userId),
    getLicenseStatus()
  ]);

  if (!profile) {
    throw new AppError(`Account not found for user ID: ${userId}`, ErrorCodes.ACCOUNT_NOT_FOUND, 404);
  }

  // Self-hosted: auto-add user as student to the single org if they are not a member.
  // Skip if they already have membership (by profileId) or a pending invite (by email).
  if (env.PUBLIC_IS_SELFHOSTED === 'true' && organizations.length === 0) {
    const firstOrg = await getFirstOrganization();
    if (firstOrg) {
      const alreadyInOrg = await hasOrgMemberByProfileIdOrEmail(firstOrg.id, userId, profile.email ?? undefined);

      if (!alreadyInOrg) {
        await createOrganizationMember({
          organizationId: firstOrg.id,
          profileId: userId,
          roleId: ROLE.STUDENT,
          verified: true
        });
      }

      organizations = await getOrganizationByProfileId(userId);
    }
  }

  return {
    profile,
    organizations,
    licenseFeatures: licenseStatus.features
  };
}

/**
 * Updates profile data for a user
 * @param userId - The user ID to update profile for
 * @param data - Partial profile data to update (excluding email, id, createdAt, updatedAt)
 * @returns Updated profile data
 */
export async function updateUser(
  userId: string,
  data: Partial<Omit<TProfile, 'id' | 'email' | 'createdAt' | 'updatedAt'>>
) {
  try {
    const updatedProfile = await updateProfile(userId, data);

    if (!updatedProfile) {
      throw new AppError(`Profile not found for user ID: ${userId}`, ErrorCodes.PROFILE_NOT_FOUND, 404);
    }

    return updatedProfile;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    // Handle unique constraint violations
    if (error instanceof Error && error.message.includes('profile_username_key')) {
      throw new AppError('Username already exists', ErrorCodes.VALIDATION_ERROR, 400, 'username');
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
