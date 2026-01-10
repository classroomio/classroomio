import * as schema from '@cio/db/schema';

import { AppError, ErrorCodes } from '@api/utils/errors';
import type { TExercise, TExerciseTemplate, TNewOption, TNewQuestion, TQuestionType } from '@cio/db/types';
import type { TExerciseCreate, TExerciseUpdate } from '@cio/utils/validation/exercise';
import {
  createExercises,
  createOptions,
  createQuestions,
  deleteExercise,
  getExerciseById,
  getExercisesByCourseId,
  getLMSExercises,
  getOptionsByQuestionIds,
  getQuestionsByExerciseIds,
  updateExercise,
  updateOption,
  updateQuestion
} from '@cio/db/queries/exercise';
import { db, inArray } from '@cio/db/drizzle';

type QuestionWithRelations = TNewQuestion & {
  question_type: {
    id: number;
    label: string;
  } | null;
  options: TNewOption[];
};

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
export async function getExercise(exerciseId: string): Promise<ExerciseWithQuestions> {
  try {
    const exercise = await getExerciseById(exerciseId);
    if (!exercise) {
      throw new AppError('Exercise not found', ErrorCodes.EXERCISE_NOT_FOUND, 404);
    }

    // Fetch questions and options
    const questions = await getQuestionsByExerciseIds([exerciseId]);
    const questionIds = questions.map((q) => q.id).filter((id) => id !== undefined);
    const options = questionIds.length > 0 ? await getOptionsByQuestionIds(questionIds) : [];

    // Fetch all question types
    const questionTypeIds = [...new Set(questions.map((q) => q.questionTypeId).filter((id) => id !== undefined))];
    const questionTypes: TQuestionType[] =
      questionTypeIds.length > 0
        ? await db.select().from(schema.questionType).where(inArray(schema.questionType.id, questionTypeIds))
        : [];

    // Create a map for quick lookup
    const questionTypeMap = new Map(questionTypes.map((qt) => [qt.id, qt]));

    // Attach options and question_type to questions
    const questionsWithOptions = questions.map((question) => {
      const questionType = questionTypeMap.get(question.questionTypeId);
      return {
        ...question,
        question_type: questionType
          ? {
              id: questionType.id,
              label: questionType.label
            }
          : null,
        options: options.filter((opt) => opt.questionId === question.id)
      };
    });

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
 * Updates an exercise with questions and options
 * @param exerciseId Exercise ID
 * @param data Partial exercise update data
 * @returns Updated exercise
 */
export async function updateExerciseService(exerciseId: string, data: TExerciseUpdate): Promise<TExercise> {
  try {
    const exercise = await getExerciseById(exerciseId);
    if (!exercise) {
      throw new AppError('Exercise not found', ErrorCodes.EXERCISE_NOT_FOUND, 404);
    }

    // Update exercise basic fields
    const exerciseUpdate: Partial<TExercise> = {};
    if (data.title !== undefined) exerciseUpdate.title = data.title;
    if (data.description !== undefined) exerciseUpdate.description = data.description;
    if (data.lessonId !== undefined) exerciseUpdate.lessonId = data.lessonId || null;
    if (data.dueBy !== undefined) exerciseUpdate.dueBy = data.dueBy || null;

    if (Object.keys(exerciseUpdate).length > 0) {
      const updated = await updateExercise(exerciseId, exerciseUpdate);
      if (!updated) {
        throw new AppError('Failed to update exercise', ErrorCodes.INTERNAL_ERROR, 500);
      }
    }

    // Update questions and options if provided
    if (data.questions && data.questions.length > 0) {
      await db.transaction(async (tx) => {
        for (const q of data.questions!) {
          if (q.id) {
            // Update existing question
            await updateQuestion(q.id, {
              title: q.question,
              points: q.points
            });

            // Update options
            if (q.options) {
              for (const opt of q.options) {
                if (opt.id) {
                  await updateOption(opt.id, {
                    label: opt.label,
                    isCorrect: opt.isCorrect
                  });
                } else {
                  // Create new option
                  await createOptions([
                    {
                      questionId: q.id,
                      label: opt.label,
                      isCorrect: opt.isCorrect
                    }
                  ]);
                }
              }
            }
          } else {
            // Create new question
            const [newQuestion] = await createQuestions([
              {
                exerciseId,
                title: q.question,
                questionTypeId: 1, // Default to RADIO (1), can be updated later
                points: q.points || 0
              }
            ]);

            if (newQuestion && q.options) {
              const optionsData: TNewOption[] = q.options.map((opt) => ({
                questionId: newQuestion.id,
                label: opt.label,
                isCorrect: opt.isCorrect
              }));

              await createOptions(optionsData);
            }
          }
        }
      });
    }

    // Fetch the updated exercise
    return await getExercise(exerciseId);
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
