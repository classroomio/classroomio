import { AppError, ErrorCodes } from '@api/utils/errors';

import { getOrganizationByProfileId } from '@cio/db/queries/organization';
import { getProfileById } from '@cio/db/queries/auth';

/**
 * Fetches account data including profile and organizations for a user
 * @param userId - The user ID to fetch account data for
 * @returns Account data with profile and organizations
 */
export async function getAccountData(userId: string) {
  const [profile, organizations] = await Promise.all([getProfileById(userId), getOrganizationByProfileId(userId)]);

  if (!profile) {
    throw new AppError(`Account not found for user ID: ${userId}`, ErrorCodes.ACCOUNT_NOT_FOUND, 404);
  }

  return {
    profile,
    organizations
  };
}
