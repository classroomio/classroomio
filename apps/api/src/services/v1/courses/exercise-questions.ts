import type {
  TPublicApiAddExerciseQuestion,
  TPublicApiCourseExerciseParam,
  TPublicApiForceQuery,
  TPublicApiExerciseQuestionParam,
  TPublicApiUpdateExerciseQuestionFields
} from '@cio/utils/validation/public-api';
import { AppError, ErrorCodes } from '@api/utils/errors';
import { applyCourseExerciseUpdate, getCourseExerciseService, updateCourseExerciseService } from './exercises';

type PublicExerciseDetail = Awaited<ReturnType<typeof getCourseExerciseService>>;

function questionNotFound() {
  return new AppError('Question not found in this exercise', ErrorCodes.NOT_FOUND, 404);
}

function findQuestion(exercise: PublicExerciseDetail, questionId: number) {
  const question = exercise.questions.find((candidate) => candidate.id === questionId);
  if (!question) {
    throw questionNotFound();
  }

  return question;
}

function splitQuestionParam({ questionId, ...exerciseParams }: TPublicApiExerciseQuestionParam) {
  return { questionId, exerciseParams: exerciseParams as TPublicApiCourseExerciseParam };
}

/** Adds one question to the exercise and returns it. Throws 400 if the exercise has sections and none is given. */
export async function addCourseExerciseQuestionService(
  orgId: string,
  actorId: string | null,
  params: TPublicApiCourseExerciseParam,
  payload: TPublicApiAddExerciseQuestion
) {
  const current = await getCourseExerciseService(orgId, actorId, params);
  if (current.sections.length > 0 && !payload.exerciseSectionId) {
    throw new AppError(
      'exerciseSectionId is required when the exercise has sections',
      ErrorCodes.VALIDATION_ERROR,
      400,
      'exerciseSectionId'
    );
  }

  const { exercise, createdQuestionIds } = await applyCourseExerciseUpdate(orgId, actorId, params, {
    questions: [payload]
  });
  const [createdId] = createdQuestionIds;
  if (createdId === undefined) {
    throw new AppError('Failed to add the question', ErrorCodes.INTERNAL_ERROR, 500);
  }

  return findQuestion(exercise, createdId);
}

/** Edits one question; fields and options the caller does not name keep their values. Throws 404 for another exercise's ids. */
export async function updateCourseExerciseQuestionService(
  orgId: string,
  actorId: string | null,
  params: TPublicApiExerciseQuestionParam,
  payload: TPublicApiUpdateExerciseQuestionFields
) {
  const { questionId, exerciseParams } = splitQuestionParam(params);
  const { addOptions = [], updateOptions = [], removeOptionIds = [], ...fields } = payload;
  const removedOptions = removeOptionIds.map((id) => ({ id, delete: true }));
  const options = [...updateOptions, ...removedOptions, ...addOptions];
  const question = { id: questionId, ...fields, ...(options.length > 0 && { options }) };

  const updated = await updateCourseExerciseService(orgId, actorId, exerciseParams, { questions: [question] });

  return findQuestion(updated, questionId);
}

/**
 * Deletes one question and returns it as it was. Throws 409 if a student has answered it, unless `force` is set, which
 * also deletes those answers.
 */
export async function deleteCourseExerciseQuestionService(
  orgId: string,
  actorId: string | null,
  params: TPublicApiExerciseQuestionParam,
  query: TPublicApiForceQuery
) {
  const { questionId, exerciseParams } = splitQuestionParam(params);
  const exercise = await getCourseExerciseService(orgId, actorId, exerciseParams);
  const question = findQuestion(exercise, questionId);

  await updateCourseExerciseService(
    orgId,
    actorId,
    exerciseParams,
    { questions: [{ id: questionId, delete: true }] },
    query
  );

  return question;
}
