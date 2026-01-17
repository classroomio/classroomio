import { AppError, ErrorCodes } from '@api/utils/errors';
import type { TExercise, TExerciseTemplate, TNewOption, TNewQuestion } from '@cio/db/types';
import type { TExerciseCreate, TExerciseUpdate } from '@cio/utils/validation/exercise';
import {
  createExercises,
  createOptions,
  createQuestions,
  deleteExercise,
  deleteOptionsByIds,
  deleteQuestionsByIds,
  getExerciseById,
  getExerciseWithRelationsOptimized,
  getExercisesByCourseId,
  getLMSExercises,
  updateExercise,
  updateOptions,
  updateQuestions
} from '@cio/db/queries/exercise';

import { db } from '@cio/db/drizzle';
import type { DbOrTxClient } from '@cio/db/drizzle';
import {
  buildExerciseUpdateFields,
  computeExerciseDiff,
  createNewQuestionsWithOptions,
  fetchQuestionsAndOptions,
  transformQuestions,
  type QuestionWithRelations
} from './utils';

type ExerciseWithQuestions = TExercise & {
  questions?: QuestionWithRelations[];
};

/**
 * Creates a new exercise with optional questions and options
 * @param data Exercise creation data
 * @returns Created exercise
 */
export async function createExercise(data: TExerciseCreate): Promise<TExercise> {
  try {
    const exerciseData = {
      title: data.title,
      description: data.description ?? null,
      lessonId: data.lessonId || null,
      dueBy: data.dueBy || null
    };

    const [exercise] = await createExercises([exerciseData]);
    if (!exercise) {
      throw new AppError('Failed to create exercise', ErrorCodes.INTERNAL_ERROR, 500);
    }

    // Create questions and options if provided
    if (data.questions && data.questions.length > 0) {
      await db.transaction(async (tx) => {
        const questionsData: TNewQuestion[] = data.questions!.map((q) => ({
          exerciseId: exercise.id,
          title: q.question,
          questionTypeId: 1, // Default to RADIO (1), can be updated later
          points: q.points || 0
        }));

        const questions = await createQuestions(questionsData);

        // Create options for each question
        const optionsPromises = data.questions!.map(async (q, index) => {
          const question = questions[index];
          if (!question) return;

          const optionsData: TNewOption[] = q.options.map((opt) => ({
            questionId: question.id,
            label: opt.label,
            isCorrect: opt.isCorrect
          }));

          return createOptions(optionsData);
        });

        await Promise.all(optionsPromises);
      });
    }

    // Fetch the complete exercise with questions and options
    return await getExercise(exercise.id);
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError(
      error instanceof Error ? error.message : 'Failed to create exercise',
      ErrorCodes.INTERNAL_ERROR,
      500
    );
  }
}

/**
 * Gets an exercise by ID with questions and options
 * @param exerciseId Exercise ID
 * @returns Exercise with questions and options
 */
export async function getExercise(exerciseId: string, dbClient?: DbOrTxClient): Promise<ExerciseWithQuestions> {
  try {
    // Optimized: Fetch exercise + questions + questionTypes + options in one JOIN query
    const { exercise, questions } = await getExerciseWithRelationsOptimized(exerciseId, dbClient);

    // Build questionTypeMap from questions (already fetched with questionType)
    const questionTypeMap = new Map(questions.map((q) => [q.questionType.id, q.questionType]));

    // Extract options from questions and transform
    const allOptions = questions.flatMap((q) => q.options || []);

    // Transform questions (strip questionType and options since they're handled in transform)
    const questionsForTransform = questions.map(({ questionType, options, ...q }) => q);
    const questionsWithOptions = transformQuestions(questionsForTransform, allOptions, questionTypeMap);

    return {
      ...exercise,
      questions: questionsWithOptions
    };
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError(
      error instanceof Error ? error.message : 'Failed to fetch exercise',
      ErrorCodes.EXERCISE_FETCH_FAILED,
      500
    );
  }
}

/**
 * Updates an exercise with questions and options.
 * Only updates what has changed by querying the current state first and computing a diff.
 * @param exerciseId Exercise ID
 * @param data Partial exercise update data
 * @returns Updated exercise
 */
export async function updateExerciseService(exerciseId: string, data: TExerciseUpdate): Promise<TExercise> {
  try {
    return await db.transaction(async (tx) => {
      const txClient = tx as unknown as typeof db;

      // Update exercise basic fields only if they changed
      const exerciseUpdate = buildExerciseUpdateFields(data);
      if (Object.keys(exerciseUpdate).length > 0) {
        const updated = await updateExercise(exerciseId, exerciseUpdate, txClient);
        if (!updated) {
          throw new AppError('Failed to update exercise', ErrorCodes.INTERNAL_ERROR, 500);
        }
      }

      // Process questions - only update what changed
      if (data.questions && data.questions.length > 0) {
        // Query current state from DB
        const { questions: currentQuestions, options: currentOptions } = await fetchQuestionsAndOptions(
          exerciseId,
          txClient
        );

        // Build current state with options mapped to their questions
        const currentQuestionsWithOptions = currentQuestions.map((q) => ({
          ...q,
          options: currentOptions.filter((opt) => opt.questionId === q.id)
        }));

        // Compute diff between current DB state and incoming data
        const diff = computeExerciseDiff(currentQuestionsWithOptions, data.questions);

        // Apply all changes in parallel (they operate on different records)
        await Promise.all([
          // Delete questions marked for deletion (cascade deletes their options)
          diff.questions.deletedIds.length > 0 && deleteQuestionsByIds(diff.questions.deletedIds, txClient),
          // Update only questions that have changed fields
          diff.questions.updates.length > 0 && updateQuestions(diff.questions.updates, txClient),
          // Delete options marked for deletion
          diff.options.deletedIds.length > 0 && deleteOptionsByIds(diff.options.deletedIds, txClient),
          // Update only options that have changed fields
          diff.options.updates.length > 0 && updateOptions(diff.options.updates, txClient),
          // Create new options for existing questions
          diff.options.creates.length > 0 && createOptions(diff.options.creates, txClient),
          // Create new questions with their options
          diff.questions.newQuestions.length > 0 &&
            createNewQuestionsWithOptions(exerciseId, diff.questions.newQuestions, txClient)
        ]);
      }

      // Return the updated exercise
      return await getExercise(exerciseId, txClient);
    });
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError(
      error instanceof Error ? error.message : 'Failed to update exercise',
      ErrorCodes.INTERNAL_ERROR,
      500
    );
  }
}

/**
 * Deletes an exercise (cascade deletes questions and options)
 * @param exerciseId Exercise ID
 * @returns Deleted exercise
 */
export async function deleteExerciseService(exerciseId: string): Promise<TExercise> {
  try {
    const exercise = await getExerciseById(exerciseId);
    if (!exercise) {
      throw new AppError('Exercise not found', ErrorCodes.EXERCISE_NOT_FOUND, 404);
    }

    const deleted = await deleteExercise(exerciseId);
    if (!deleted) {
      throw new AppError('Failed to delete exercise', ErrorCodes.INTERNAL_ERROR, 500);
    }

    return deleted;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError(
      error instanceof Error ? error.message : 'Failed to delete exercise',
      ErrorCodes.INTERNAL_ERROR,
      500
    );
  }
}

/**
 * Lists exercises for a course
 * @param courseId Course ID
 * @param lessonId Optional lesson ID filter
 * @returns Array of exercises
 */
export async function listExercises(courseId: string, lessonId?: string): Promise<TExercise[]> {
  try {
    return await getExercisesByCourseId(courseId, lessonId);
  } catch (error) {
    throw new AppError(
      error instanceof Error ? error.message : 'Failed to list exercises',
      ErrorCodes.INTERNAL_ERROR,
      500
    );
  }
}

/**
 * Creates an exercise from a template
 * @param courseId Course ID
 * @param lessonId Lesson ID
 * @param template Exercise template with questionnaire
 * @returns Created exercise with questions and options
 */
export async function createExerciseFromTemplate(
  courseId: string,
  lessonId: string,
  template: TExerciseTemplate
): Promise<TExercise> {
  try {
    // Create the exercise
    const exerciseData: TExerciseCreate = {
      title: template.title!,
      description: template.description ?? undefined,
      lessonId,
      courseId
    };

    const exercise = await createExercise(exerciseData);

    // Process the questionnaire to create questions and options
    const { questions } = template.questionnaire!;

    if (questions && questions.length > 0) {
      await db.transaction(async (tx) => {
        for (const question of questions) {
          const { title, question_type, options, order, points } = question;

          // Create question
          const [newQuestion] = await createQuestions([
            {
              exerciseId: exercise.id,
              title,
              questionTypeId: question_type.id,
              points: points || 0,
              order: order || 0
            }
          ]);

          if (!newQuestion) continue;

          // Create options if not TEXTAREA type
          if (question_type.id !== 3 && options && options.length > 0) {
            // Filter out deleted options

            const optionsData: TNewOption[] = options.map((opt) => ({
              questionId: newQuestion.id,
              label: opt.label || '',
              isCorrect: opt.is_correct || false,
              value: opt.label || null
            }));

            await createOptions(optionsData);
          }
        }
      });
    }

    // Fetch the complete exercise with questions and options
    return await getExercise(exercise.id);
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError(
      error instanceof Error ? error.message : 'Failed to create exercise from template',
      ErrorCodes.INTERNAL_ERROR,
      500
    );
  }
}

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
