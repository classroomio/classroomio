import type { GetLMSExercisesSuccess, LMSExercise } from './exercises.svelte';
import { classroomio } from '$lib/utils/services/api';
import { getApiKeyHeaders, safeServerApi } from '$lib/utils/services/api/server';

/**
 * Server-side API methods for LMS exercises
 * These methods use API key authentication and should only be used in server-side files
 */
export class LMSExercisesApiServer {
  /**
   * Fetches LMS exercises for a student in an organization (server-side)
   * @param orgId - Organization ID
   * @param profileId - Profile ID of the student
   * @returns Array of exercises with submissions and related data, or null on error
   */
  static async fetchLMSExercises(orgId: string): Promise<LMSExercise[] | null> {
    try {
      const result = await safeServerApi<GetLMSExercisesSuccess>(() =>
        classroomio.organization[':orgId'].exercises.lms.$get(
          {
            param: { orgId }
          },
          getApiKeyHeaders()
        )
      );
      return result.ok && result.body.data ? result.body.data : null;
    } catch (error) {
      console.error('Error fetching LMS exercises (server):', error);
      return null;
    }
  }
}
