import type { TProfile } from '@cio/db/types';
import { classroomio } from '$lib/utils/services/api';

export async function getProfile(email: string): Promise<TProfile | null> {
  try {
    const response = await classroomio.account.profile.$get({
      query: { email }
    });

    const result = await response.json();

    if (result.success && result.profile) {
      return result.profile;
    }

    return null;
  } catch (error) {
    console.error('Error fetching profile by email:', error);
    return null;
  }
}
