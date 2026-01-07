import { AppError, ErrorCodes } from '@api/utils/errors';
import {
  createExercises,
  deleteExercise,
  getExerciseById,
  getExercisesByCourseId,
  getLMSExercises,
  updateExercise
} from '@cio/db/queries/exercise';
import type { TExercise, TNewExercise } from '@db/types';

/**
 * Gets LMS exercises for a student in an organization
 * Returns exercises from unlocked lessons in courses where the student is a member
 * @param profileId - The profile ID of the student
 * @param orgId - The organization ID
 * @returns Array of exercises with related data
 */
export async function getLMSExercisesService(profileId: string, orgId: string) {
  try {
    const exercises = await getLMSExercises(profileId, orgId);
    return exercises;
  } catch (error) {
    throw new AppError(
      error instanceof Error ? error.message : 'Failed to fetch LMS exercises',
      ErrorCodes.EXERCISE_FETCH_FAILED,
      500
    );
  }
}

/**
 * Gets an exercise by ID
 * @param exerciseId - The exercise ID
 * @returns Exercise or null
 */
export async function getExercise(exerciseId: string) {
  try {
    const exercise = await getExerciseById(exerciseId);
    if (!exercise) {
      throw new AppError('Exercise not found', ErrorCodes.EXERCISE_NOT_FOUND, 404);
    }
    return exercise;
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(
      error instanceof Error ? error.message : 'Failed to fetch exercise',
      ErrorCodes.EXERCISE_FETCH_FAILED,
      500
    );
  }
}

/**
 * Lists exercises for a course
 * @param courseId - The course ID
 * @param lessonId - Optional lesson ID filter
 * @returns Array of exercises
 */
export async function listExercises(courseId: string, lessonId?: string) {
  try {
    return await getExercisesByCourseId(courseId, lessonId);
  } catch (error) {
    throw new AppError(
      error instanceof Error ? error.message : 'Failed to list exercises',
      ErrorCodes.EXERCISE_FETCH_FAILED,
      500
    );
  }
}

/**
 * Creates a new exercise
 * @param data - Exercise data
 * @returns Created exercise
 */
export async function createExercise(data: TNewExercise) {
  try {
    const [exercise] = await createExercises([data]);
    return exercise;
  } catch (error) {
    throw new AppError(
      error instanceof Error ? error.message : 'Failed to create exercise',
      ErrorCodes.EXERCISE_FETCH_FAILED,
      500
    );
  }
}

/**
 * Creates an exercise from a template
 * @param templateId - Template ID
 * @param lessonId - Lesson ID
 * @returns Created exercise
 */
export async function createExerciseFromTemplate(templateId: number, lessonId: string) {
  // TODO: Implement template-based exercise creation
  throw new AppError('Not implemented', ErrorCodes.EXERCISE_FETCH_FAILED, 501);
}

/**
 * Updates an exercise
 * @param exerciseId - The exercise ID
 * @param data - Update data
 * @returns Updated exercise
 */
export async function updateExerciseService(exerciseId: string, data: Partial<TExercise>) {
  try {
    const updated = await updateExercise(exerciseId, data);
    if (!updated) {
      throw new AppError('Exercise not found', ErrorCodes.EXERCISE_NOT_FOUND, 404);
    }
    return updated;
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(
      error instanceof Error ? error.message : 'Failed to update exercise',
      ErrorCodes.EXERCISE_FETCH_FAILED,
      500
    );
  }
}

/**
 * Deletes an exercise
 * @param exerciseId - The exercise ID
 */
export async function deleteExerciseService(exerciseId: string) {
  try {
    const deleted = await deleteExercise(exerciseId);
    if (!deleted) {
      throw new AppError('Exercise not found', ErrorCodes.EXERCISE_NOT_FOUND, 404);
    }
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(
      error instanceof Error ? error.message : 'Failed to delete exercise',
      ErrorCodes.EXERCISE_FETCH_FAILED,
      500
    );
  }
}
