import { AppError, ErrorCodes } from '@api/utils/errors';
import { sanitizeHtml, sanitizeOptionalHtml, sanitizeUnknownStrings } from '@api/utils/sanitize-html';
import type { TExercise, TExerciseTemplate, TNewOption, TNewQuestion } from '@cio/db/types';
import type { TExerciseCreate, TExerciseUpdate } from '@cio/utils/validation/exercise';
import { getLessonById } from '@cio/db/queries/lesson';
import {
  createExercises,
  syncOptionIdSequence,
  syncQuestionIdSequence,
  createOptions,
  createQuestions,
  deleteExercise,
  deleteOptionsByIds,
  deleteQuestionsByIds,
  getExerciseById,
  getExerciseCompletionByProfile,
  getExerciseCompletionsByProfile,
  getExerciseSectionsByExerciseId,
  getExerciseWithRelationsOptimized,
  getExercisesByCourseId,
  getLMSExercises,
  createExerciseSections,
  deleteExerciseSectionsByIds,
  updateExerciseSection,
  updateExercise,
  updateOptions,
  updateQuestions
} from '@cio/db/queries/exercise';
import { touchCourseUpdatedAt } from '@cio/db/queries/course';
import { resolveItemSlug } from '@api/services/course/slug';
import { guardNonAutoGradableQuestionsForCourseType } from '@api/services/course/public-course-guard';

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
  isComplete: boolean;
  questions?: QuestionWithRelations[];
  sections?: ExerciseSectionWithQuestions[];
};

type ExerciseSectionWithQuestions = {
  id: string;
  title: string;
  description: string | null;
  order: number;
  colorTheme: string;
  afterBehavior: unknown;
  questions: QuestionWithRelations[];
};

type ExerciseWithCompletion = TExercise & {
  isComplete: boolean;
};

function sanitizeExerciseQuestions(questions: TExerciseCreate['questions'] | TExerciseUpdate['questions']) {
  return questions?.map((question) => ({
    ...question,
    question: sanitizeHtml(question.question),
    settings: question.settings ? sanitizeUnknownStrings(question.settings) : question.settings,
    options: question.options?.map((option) => ({
      ...option,
      label: sanitizeHtml(option.label),
      settings: option.settings ? sanitizeUnknownStrings(option.settings) : option.settings
    }))
  }));
}

function sanitizeExercisePayload(data: TExerciseCreate): TExerciseCreate;
function sanitizeExercisePayload(data: TExerciseUpdate): TExerciseUpdate;
function sanitizeExercisePayload(data: TExerciseCreate | TExerciseUpdate): TExerciseCreate | TExerciseUpdate {
  return {
    ...data,
    description: sanitizeOptionalHtml(data.description),
    sections:
      'sections' in data
        ? data.sections?.map((section) => ({
            ...section,
            title: sanitizeHtml(section.title),
            description: sanitizeOptionalHtml(section.description ?? undefined)
          }))
        : undefined,
    questions: sanitizeExerciseQuestions(data.questions)
  };
}

function groupQuestionsBySections(
  sections: Awaited<ReturnType<typeof getExerciseSectionsByExerciseId>>,
  questions: QuestionWithRelations[]
) {
  const questionsBySectionId = new Map<string, QuestionWithRelations[]>();
  const unsectionedQuestions: QuestionWithRelations[] = [];

  for (const question of questions) {
    if (question.exerciseSectionId) {
      const sectionQuestions = questionsBySectionId.get(question.exerciseSectionId) ?? [];
      sectionQuestions.push(question);
      questionsBySectionId.set(question.exerciseSectionId, sectionQuestions);
      continue;
    }

    unsectionedQuestions.push(question);
  }

  return {
    sections: sections.map((section) => ({
      id: section.id,
      title: section.title,
      description: section.description,
      order: section.order,
      colorTheme: section.colorTheme,
      afterBehavior: section.afterBehavior,
      questions: questionsBySectionId.get(section.id) ?? []
    })),
    unsectionedQuestions
  };
}

async function syncExerciseSections(
  exerciseId: string,
  sections: NonNullable<TExerciseUpdate['sections']>,
  txClient: DbOrTxClient
) {
  const currentSections = await getExerciseSectionsByExerciseId(exerciseId, txClient);
  const currentSectionIds = new Set(currentSections.map((section) => section.id));
  const incomingSectionIds = new Set(sections.map((section) => section.id).filter((id): id is string => !!id));

  for (const section of sections) {
    if (section.afterBehavior.action !== 'go_to_section') continue;
    if (!incomingSectionIds.has(section.afterBehavior.exerciseSectionId)) {
      throw new AppError('Section routing target must exist in this exercise', ErrorCodes.VALIDATION_ERROR, 400);
    }
  }

  const sectionsToDelete = currentSections
    .filter((section) => !incomingSectionIds.has(section.id))
    .map((section) => section.id);

  if (sectionsToDelete.length > 0) {
    await deleteExerciseSectionsByIds(sectionsToDelete, txClient);
  }

  const sectionsToCreate = sections
    .filter((section) => !section.id || !currentSectionIds.has(section.id))
    .map((section) => ({
      id: section.id,
      exerciseId,
      title: section.title,
      description: section.description ?? null,
      order: section.order,
      colorTheme: section.colorTheme,
      afterBehavior: section.afterBehavior
    }));

  if (sectionsToCreate.length > 0) {
    await createExerciseSections(sectionsToCreate, txClient);
  }

  await Promise.all(
    sections
      .filter((section) => section.id && currentSectionIds.has(section.id))
      .map((section) =>
        updateExerciseSection(
          section.id!,
          {
            title: section.title,
            description: section.description ?? null,
            order: section.order,
            colorTheme: section.colorTheme,
            afterBehavior: section.afterBehavior
          },
          txClient
        )
      )
  );
}

function validateSectionQuestionAssignments(data: TExerciseUpdate) {
  if (!data.sections || data.sections.length === 0 || !data.questions) return;

  const sectionIds = new Set(data.sections.map((section) => section.id).filter((id): id is string => !!id));
  const unassignedQuestion = data.questions.find(
    (question) => !question.deletedAt && (!question.exerciseSectionId || !sectionIds.has(question.exerciseSectionId))
  );

  if (unassignedQuestion) {
    throw new AppError(
      'All active questions must be assigned to an exercise section',
      ErrorCodes.VALIDATION_ERROR,
      400
    );
  }
}

async function resolveExerciseCourseId(exercise: TExercise): Promise<string | null> {
  if (exercise.courseId) {
    return exercise.courseId;
  }

  if (!exercise.lessonId) {
    return null;
  }

  const lesson = await getLessonById(exercise.lessonId);

  return lesson?.courseId ?? null;
}

/**
 * Creates a new exercise with optional questions and options
 * @param data Exercise creation data
 * @returns Created exercise
 */
export async function createExercise(data: TExerciseCreate): Promise<TExercise> {
  try {
    const sanitizedData = sanitizeExercisePayload(data);

    await guardNonAutoGradableQuestionsForCourseType({
      courseId: sanitizedData.courseId,
      questionTypeIds: (sanitizedData.questions ?? []).map((question) => question.questionTypeId)
    });

    const slug = await resolveItemSlug({
      courseId: sanitizedData.courseId,
      title: sanitizedData.title,
      requestedSlug: sanitizedData.slug
    });

    const exerciseData = {
      title: sanitizedData.title,
      description: sanitizedData.description ?? null,
      lessonId: sanitizedData.lessonId || null,
      courseId: sanitizedData.courseId,
      sectionId: sanitizedData.sectionId || null,
      order: sanitizedData.order ?? null,
      dueBy: sanitizedData.dueBy || null,
      slug
    };

    const [exercise] = await createExercises([exerciseData]);
    if (!exercise) {
      throw new AppError('Failed to create exercise', ErrorCodes.INTERNAL_ERROR, 500);
    }

    // Create questions and options if provided
    if (sanitizedData.questions && sanitizedData.questions.length > 0) {
      await db.transaction(async (tx) => {
        const txClient = tx as DbOrTxClient;
        const questionsData: TNewQuestion[] = sanitizedData.questions!.map((q) => ({
          exerciseId: exercise.id,
          title: q.question,
          questionTypeId: q.questionTypeId || 1,
          points: q.points || 0,
          order: typeof q.order === 'number' ? q.order : undefined,
          settings: q.settings ?? {}
        }));

        const questions = await createQuestions(questionsData, txClient);
        const hasOptions = sanitizedData.questions!.some((question) => (question.options?.length ?? 0) > 0);

        if (hasOptions) {
          await syncOptionIdSequence(txClient);
        }

        // Create options for each question
        for (const [index, questionData] of sanitizedData.questions!.entries()) {
          const question = questions[index];
          if (!question) continue;

          const optionsData: TNewOption[] = (questionData.options ?? []).map((opt) => ({
            questionId: question.id,
            label: opt.label,
            isCorrect: opt.isCorrect,
            settings: opt.settings ?? {}
          }));

          await createOptions(optionsData, txClient);
        }
      });
    }

    // Fetch the complete exercise with questions and options
    const result = await getExercise(exercise.id);

    if (sanitizedData.courseId) {
      await touchCourseUpdatedAt(sanitizedData.courseId);
    }

    return result;
  } catch (error) {
    console.error('createExercise error:', error);
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
export async function getExercise(
  exerciseId: string,
  dbClient?: DbOrTxClient,
  profileId?: string
): Promise<ExerciseWithQuestions> {
  try {
    // Optimized: Fetch exercise + questions + questionTypes + options in one JOIN query
    const { exercise, questions } = await getExerciseWithRelationsOptimized(exerciseId, dbClient);

    const isComplete = profileId ? await getExerciseCompletionByProfile(exerciseId, profileId, dbClient) : false;

    // Build questionTypeMap from questions (already fetched with questionType)
    const questionTypeMap = new Map(questions.map((q) => [q.questionType.id, q.questionType]));

    // Extract options from questions and transform
    const allOptions = questions.flatMap((q) => q.options || []);

    // Transform questions (strip questionType and options since they're handled in transform)
    const questionsForTransform = questions.map(({ questionType, options, ...q }) => q);
    const questionsWithOptions = transformQuestions(questionsForTransform, allOptions, questionTypeMap);
    const sections = await getExerciseSectionsByExerciseId(exerciseId, dbClient);
    const sectionGroups = groupQuestionsBySections(sections, questionsWithOptions);

    return {
      ...exercise,
      isComplete,
      questions: questionsWithOptions,
      sections: sectionGroups.sections
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
    const sanitizedData = sanitizeExercisePayload(data);
    validateSectionQuestionAssignments(sanitizedData);

    const existing = await getExerciseById(exerciseId);

    if (existing?.courseId) {
      await guardNonAutoGradableQuestionsForCourseType({
        courseId: existing.courseId,
        questionTypeIds: (sanitizedData.questions ?? [])
          .filter((question) => !('deletedAt' in question && question.deletedAt))
          .map((question) => question.questionTypeId)
      });
    }

    if (sanitizedData.slug !== undefined && existing?.courseId) {
      sanitizedData.slug = await resolveItemSlug({
        courseId: existing.courseId,
        title: sanitizedData.title ?? existing.title,
        requestedSlug: sanitizedData.slug,
        ignoreItemSlug: existing.slug ?? undefined
      });
    }

    const result = await db.transaction(async (tx) => {
      const txClient = tx as DbOrTxClient;

      // Update exercise basic fields only if they changed
      const exerciseUpdate = buildExerciseUpdateFields(sanitizedData);
      if (Object.keys(exerciseUpdate).length > 0) {
        const updated = await updateExercise(exerciseId, exerciseUpdate, txClient);
        if (!updated) {
          throw new AppError('Failed to update exercise', ErrorCodes.INTERNAL_ERROR, 500);
        }
      }

      if (sanitizedData.sections !== undefined) {
        await syncExerciseSections(exerciseId, sanitizedData.sections, txClient);
      }

      // Process questions - only update what changed
      if (sanitizedData.questions && sanitizedData.questions.length > 0) {
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
        const diff = computeExerciseDiff(currentQuestionsWithOptions, sanitizedData.questions);

        const hasNewQuestions = diff.questions.newQuestions.length > 0;
        const hasNewOptions = diff.options.creates.length > 0 || hasNewQuestions;

        if (hasNewQuestions) {
          await syncQuestionIdSequence(txClient);
        }

        if (hasNewOptions) {
          await syncOptionIdSequence(txClient);
        }

        // Apply question/option graph changes in dependency order. Question deletes cascade
        // options, while new question creation can also create options.
        if (diff.questions.deletedIds.length > 0) {
          await deleteQuestionsByIds(diff.questions.deletedIds, txClient);
        }

        if (diff.options.deletedIds.length > 0) {
          await deleteOptionsByIds(diff.options.deletedIds, txClient);
        }

        if (diff.questions.updates.length > 0) {
          await updateQuestions(diff.questions.updates, txClient);
        }

        if (diff.options.updates.length > 0) {
          await updateOptions(diff.options.updates, txClient);
        }

        if (diff.options.creates.length > 0) {
          await createOptions(diff.options.creates, txClient);
        }

        if (hasNewQuestions) {
          await createNewQuestionsWithOptions(exerciseId, diff.questions.newQuestions, txClient);
        }
      }

      // Return the updated exercise
      return await getExercise(exerciseId, txClient);
    });

    const courseId = existing?.courseId;
    if (courseId) {
      await touchCourseUpdatedAt(courseId);
    }

    return result;
  } catch (error) {
    console.error('updateExerciseService error:', error);
    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError('Failed to update exercise', ErrorCodes.INTERNAL_ERROR, 500);
  }
}

export async function updateExerciseSectionMetadataService(
  exerciseId: string,
  exerciseSectionId: string,
  data: { title?: string; description?: string | null }
) {
  try {
    const sections = await getExerciseSectionsByExerciseId(exerciseId);
    const belongs = sections.some((section) => section.id === exerciseSectionId);

    if (!belongs) {
      throw new AppError(
        'That exercise section was not found on this exercise. Call get_exercise_details and use a section id from the sections array.',
        ErrorCodes.VALIDATION_ERROR,
        404
      );
    }

    const patch: { title?: string; description?: string | null } = {};

    if (data.title !== undefined) {
      patch.title = sanitizeHtml(data.title);
    }

    if (data.description !== undefined) {
      patch.description = data.description === '' ? null : (sanitizeOptionalHtml(data.description) ?? null);
    }

    if (Object.keys(patch).length === 0) {
      throw new AppError('No fields to update', ErrorCodes.VALIDATION_ERROR, 400);
    }

    const updated = await updateExerciseSection(exerciseSectionId, patch);

    if (!updated) {
      throw new AppError('Failed to update exercise section', ErrorCodes.INTERNAL_ERROR, 500);
    }

    const existing = await getExerciseById(exerciseId);

    if (existing?.courseId) {
      await touchCourseUpdatedAt(existing.courseId);
    }

    return {
      id: updated.id,
      title: updated.title,
      description: updated.description ?? null,
      exerciseId
    };
  } catch (error) {
    console.error('updateExerciseSectionMetadataService error:', error);
    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError(
      error instanceof Error ? error.message : 'Failed to update exercise section',
      ErrorCodes.INTERNAL_ERROR,
      500
    );
  }
}

export async function createExerciseSectionService(
  exerciseId: string,
  data: {
    title: string;
    description?: string | null;
    order: number;
    colorTheme?: 'blue' | 'green' | 'amber' | 'rose' | 'violet' | 'slate';
    afterBehavior?:
      | { action: 'continue' }
      | { action: 'submit' }
      | { action: 'go_to_section'; exerciseSectionId: string };
  }
) {
  try {
    const sections = await getExerciseSectionsByExerciseId(exerciseId);
    const afterBehavior = data.afterBehavior;

    if (afterBehavior?.action === 'go_to_section') {
      const targetExists = sections.some((section) => section.id === afterBehavior.exerciseSectionId);

      if (!targetExists) {
        throw new AppError(
          'That exercise section was not found on this exercise. Call get_exercise_details and use a section id from the sections array.',
          ErrorCodes.VALIDATION_ERROR,
          404
        );
      }
    }

    const [created] = await createExerciseSections([
      {
        exerciseId,
        title: data.title,
        description: data.description ?? null,
        order: data.order,
        colorTheme: data.colorTheme ?? 'blue',
        afterBehavior: data.afterBehavior ?? { action: 'continue' }
      }
    ]);

    if (!created) {
      throw new AppError('Failed to create exercise section', ErrorCodes.INTERNAL_ERROR, 500);
    }

    const existing = await getExerciseById(exerciseId);

    if (existing?.courseId) {
      await touchCourseUpdatedAt(existing.courseId);
    }

    return {
      id: created.id,
      exerciseId: created.exerciseId,
      title: created.title,
      description: created.description ?? null,
      order: created.order,
      colorTheme: created.colorTheme,
      afterBehavior: created.afterBehavior
    };
  } catch (error) {
    console.error('createExerciseSectionService error:', error);
    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError(
      error instanceof Error ? error.message : 'Failed to create exercise section',
      ErrorCodes.INTERNAL_ERROR,
      500
    );
  }
}

/**
 * Replaces an exercise's questions and options with the provided payload.
 * Existing questions are deleted and recreated from the replacement payload.
 */
export async function replaceExerciseService(exerciseId: string, data: TExerciseUpdate): Promise<TExercise> {
  try {
    const sanitizedData = sanitizeExercisePayload(data);

    const existing = await getExerciseById(exerciseId);

    const result = await db.transaction(async (tx) => {
      const txClient = tx as DbOrTxClient;

      const exerciseUpdate = buildExerciseUpdateFields(sanitizedData);
      if (Object.keys(exerciseUpdate).length > 0) {
        const updated = await updateExercise(exerciseId, exerciseUpdate, txClient);
        if (!updated) {
          throw new AppError('Failed to update exercise', ErrorCodes.INTERNAL_ERROR, 500);
        }
      }

      const { questions: currentQuestions } = await fetchQuestionsAndOptions(exerciseId, txClient);
      const currentQuestionIds = currentQuestions
        .map((question) => question.id)
        .filter((id): id is number => id !== undefined);

      if (currentQuestionIds.length > 0) {
        await deleteQuestionsByIds(currentQuestionIds, txClient);
      }

      const replacementQuestions = sanitizedData.questions ?? [];
      const hasReplacementOptions = replacementQuestions.some((question) => (question.options?.length ?? 0) > 0);

      if (replacementQuestions.length > 0) {
        await syncQuestionIdSequence(txClient);

        if (hasReplacementOptions) {
          await syncOptionIdSequence(txClient);
        }

        await createNewQuestionsWithOptions(exerciseId, replacementQuestions, txClient);
      }

      return await getExercise(exerciseId, txClient);
    });

    const courseId = existing?.courseId;
    if (courseId) {
      await touchCourseUpdatedAt(courseId);
    }

    return result;
  } catch (error) {
    console.error('replaceExerciseService error:', error);
    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError('Failed to replace exercise', ErrorCodes.INTERNAL_ERROR, 500);
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

    if (exercise.courseId) {
      await touchCourseUpdatedAt(exercise.courseId);
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

export async function deleteExerciseForCourseService(courseId: string, exerciseId: string): Promise<TExercise> {
  try {
    const exercise = await getExerciseById(exerciseId);
    if (!exercise) {
      throw new AppError('Exercise not found', ErrorCodes.EXERCISE_NOT_FOUND, 404);
    }

    const exerciseCourseId = await resolveExerciseCourseId(exercise);
    if (exerciseCourseId !== courseId) {
      throw new AppError('Exercise does not belong to this course', ErrorCodes.EXERCISE_NOT_FOUND, 404);
    }

    const deleted = await deleteExercise(exerciseId);
    if (!deleted) {
      throw new AppError('Failed to delete exercise', ErrorCodes.INTERNAL_ERROR, 500);
    }

    await touchCourseUpdatedAt(courseId);

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
export async function listExercises(
  courseId: string,
  filters: { lessonId?: string; sectionId?: string } = {},
  profileId?: string
): Promise<ExerciseWithCompletion[]> {
  try {
    const exercises = await getExercisesByCourseId(courseId, filters);

    if (!profileId) {
      return exercises.map((exercise) => ({
        ...exercise,
        isComplete: false
      }));
    }

    const completedIds = await getExerciseCompletionsByProfile(
      exercises.map((exercise) => exercise.id),
      profileId
    );
    const completedSet = new Set(completedIds);

    return exercises.map((exercise) => ({
      ...exercise,
      isComplete: completedSet.has(exercise.id)
    }));
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
  lessonId: string | undefined,
  sectionId: string | undefined,
  order: number | undefined,
  template: TExerciseTemplate
): Promise<TExercise> {
  try {
    // Create the exercise
    const exerciseData: TExerciseCreate = {
      title: template.title!,
      description: template.description ?? undefined,
      lessonId,
      sectionId,
      order,
      courseId
    };

    const exercise = await createExercise(exerciseData);

    // Process the questionnaire to create questions and options
    const { questions } = template.questionnaire!;

    if (questions && questions.length > 0) {
      await db.transaction(async (tx) => {
        const txClient = tx as DbOrTxClient;
        const hasTemplateOptions = questions.some(
          (question) => question.question_type.id !== 3 && (question.options?.length ?? 0) > 0
        );

        if (hasTemplateOptions) {
          await syncOptionIdSequence(txClient);
        }

        for (const question of questions) {
          const { title, question_type, options, order, points } = question;
          const questionSettings = sanitizeUnknownStrings(
            (question as { settings?: Record<string, unknown> }).settings ?? {}
          );

          // Create question
          const [newQuestion] = await createQuestions(
            [
              {
                exerciseId: exercise.id,
                title: sanitizeHtml(title),
                questionTypeId: question_type.id,
                points: points || 0,
                order: order || 0,
                settings: questionSettings
              }
            ],
            txClient
          );

          if (!newQuestion) continue;

          // Create options if not TEXTAREA type
          if (question_type.id !== 3 && options && options.length > 0) {
            // Filter out deleted options

            // value column is UUID (default gen_random_uuid()); label is the display text only
            const optionsData: TNewOption[] = options.map((opt) => ({
              questionId: newQuestion.id,
              label: sanitizeHtml(opt.label || ''),
              isCorrect: opt.is_correct || false,
              settings: sanitizeUnknownStrings((opt as { settings?: Record<string, unknown> }).settings ?? {})
            }));

            await createOptions(optionsData, txClient);
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
