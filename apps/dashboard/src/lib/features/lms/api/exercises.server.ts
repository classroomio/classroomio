import { classroomio } from '$lib/utils/services/api';
import { getApiKeyHeaders } from '$lib/utils/services/api/server';
import type { LMSExercise } from './exercises.svelte';

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
  static async fetchLMSExercises(orgId: string, profileId: string): Promise<LMSExercise[] | null> {
    try {
      const response = await classroomio.organization[':orgId'].exercises.lms.$get(
        {
          param: { orgId }
        },
        getApiKeyHeaders()
      );

      const data = await response.json();
      return data.success && data.data ? data.data : null;
    } catch (error) {
      console.error('Error fetching LMS exercises (server):', error);
      return null;
    }
  }
}
