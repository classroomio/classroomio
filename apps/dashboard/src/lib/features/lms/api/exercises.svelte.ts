import { BaseApiWithErrors, classroomio, type InferResponseType } from '$lib/utils/services/api';

export type GetLMSExercisesRequest = (typeof classroomio.organization)[':orgId']['exercises']['lms']['$get'];
export type GetLMSExercisesResponse = InferResponseType<GetLMSExercisesRequest>;
export type GetLMSExercisesSuccess = Extract<GetLMSExercisesResponse, { success: true }>;
export type LMSExercise = GetLMSExercisesSuccess['data'][number];
export type LMSExercises = GetLMSExercisesSuccess['data'];

/**
 * API class for LMS exercises
 */
class LMSExercisesApi extends BaseApiWithErrors {
  exercises = $state<LMSExercise[]>([]);

  /**
   * Fetches LMS exercises for a student in an organization
   * @param orgId - Organization ID
   * @returns Array of exercises with submissions and related data
   */
  async fetchLMSExercises(orgId: string) {
    return this.execute<GetLMSExercisesRequest>({
      requestFn: () => classroomio.organization[':orgId'].exercises.lms.$get({ param: { orgId } }),
      logContext: 'fetching LMS exercises',
      onSuccess: (response) => {
        if (response.data) {
          this.exercises = response.data;
        }
      }
    });
  }
}

export const lmsExercisesApi = new LMSExercisesApi();
