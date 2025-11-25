import { AppError, ErrorCodes } from '@api/utils/errors';
import { getProfileById, updateProfile } from '@cio/db/queries/auth';

import type { TProfile } from '@cio/db/types';
import { getOrganizationByProfileId } from '@cio/db/queries/organization';
import { getSupabase } from '@api/utils/supabase';

const supabase = getSupabase();

async function supabaseGetProfile(userId: string) {
  console.time('supabaseGetProfile');
  const { data: profileData, error } = await supabase.from('profile').select('*').eq('id', userId).single();

  if (error) {
    throw error;
  }
  console.log('profileData', profileData);
  console.timeEnd('supabaseGetProfile');
}

/**
 * Fetches account data including profile and organizations for a user
 * @param userId - The user ID to fetch account data for
 * @returns Account data with profile and organizations
 */
export async function getAccountData(userId: string) {
  const [profile, organizations] = await Promise.all([
    getProfileById(userId),
    getOrganizationByProfileId(userId),
    supabaseGetProfile(userId)
  ]);

  if (!profile) {
    throw new AppError(`Account not found for user ID: ${userId}`, ErrorCodes.ACCOUNT_NOT_FOUND, 404);
  }

  return {
    profile,
    organizations
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
