import { AppError, ErrorCodes } from '@api/utils/errors';
import type { TProfile, TUser } from '@cio/db/types';
import {
  checkSiteNameExists,
  createOrganization,
  createOrganizationMember,
  getOrganizationByProfileId
} from '@cio/db/queries';
import { getProfileById, updateProfile } from '@cio/db/queries/auth';

import { ROLE } from '@cio/utils/constants';
import { db } from '@cio/db/drizzle';
import { sendEmail } from '@cio/email';

export async function createOrganizationWithOwner(
  profileId: string,
  input: {
    fullname?: string;
    orgName: string;
    siteName: string;
  }
) {
  // Business Logic: Check sitename availability
  const exists = await checkSiteNameExists(input.siteName);
  if (exists) {
    console.error('Site name already exists:', input.siteName);
    throw new AppError(`Site name '${input.siteName}' already exists`, ErrorCodes.SITENAME_EXISTS, 409);
  }

  // Business Logic: Create org and member in a transaction
  try {
    const result = await db.transaction(async () => {
      const organization = await createOrganization({
        name: input.orgName,
        siteName: input.siteName
      });

      const member = await createOrganizationMember({
        organizationId: organization.id,
        profileId,
        roleId: ROLE.ADMIN,
        verified: true
      });

      return { organization, member };
    });

    // Fetch updated organizations list
    const organizations = await getOrganizationByProfileId(profileId);

    return {
      organization: result.organization,
      member: result.member,
      organizations
    };
  } catch (error) {
    console.error('Error creating organization:', error);
    // Handle database constraint violations
    if (error && typeof error === 'object' && 'code' in error && error.code === '23505') {
      throw new AppError(`Site name '${input.siteName}' already exists`, ErrorCodes.SITENAME_EXISTS, 409);
    }
    throw new AppError(error instanceof Error ? error : new Error('Unknown error'), ErrorCodes.ORG_CREATE_FAILED, 500);
  }
}

export async function updateUserOnboarding(userId: string, data: Partial<TProfile>) {
  try {
    const updatedProfile = await updateProfile(userId, data);

    if (!updatedProfile) {
      throw new AppError('Failed to update profile - profile not found', ErrorCodes.PROFILE_NOT_FOUND, 404);
    }

    return updatedProfile;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError(
      error instanceof Error ? error : new Error('Unknown error'),
      ErrorCodes.PROFILE_UPDATE_FAILED,
      500
    );
  }
}

export async function completeOnboarding(user: Partial<TUser> & { id: string; email: string }) {
  try {
    const profile = await getProfileById(user.id);
    if (!profile) {
      throw new AppError('Profile not found', ErrorCodes.PROFILE_NOT_FOUND, 404);
    }

    await sendEmail('welcome', {
      to: user.email,
      fields: {
        name: profile.fullname
      }
    });
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError(error instanceof Error ? error : new Error('Unknown error'), ErrorCodes.INTERNAL_ERROR, 500);
  }
}
