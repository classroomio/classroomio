import {
  createExercise,
  createExerciseFromTemplate,
  deleteExerciseForCourseService,
  getExercise,
  listExercises,
  resolveExerciseCourseId,
  updateExerciseService
} from '@cio/core/services/exercise/exercise';
import { assertNoPremiumQuestionTypes } from '@cio/core/services/exercise/premium-guard';
import { isOrgOnPaidPlan } from '@cio/core/services/agent/usage';
import { getCourseSectionById } from '@cio/db/queries/course';
import { getExerciseById, getExerciseSectionOwnersByIds } from '@cio/db/queries/exercise';
import { getLessonById } from '@cio/db/queries/lesson';
import type { TExercise } from '@cio/db/types';
import type { TExerciseUpdate } from '@cio/utils/validation/exercise';
import type {
  TPublicApiCourseExerciseNotifyParam,
  TPublicApiCourseExerciseNotifyStatusQuery,
  TPublicApiCourseExerciseParam,
  TPublicApiCourseExercisesQuery,
  TPublicApiCourseParam,
  TPublicApiCreateCourseExercise,
  TPublicApiUpdateCourseExercise
} from '@cio/utils/validation/public-api';
import { JOB_NAMES, QUEUE_NAMES, getQueueJobMeta } from '@cio/jobs';
import {
  getNotifyCourseExerciseStatusService,
  notifyCourseExerciseService
} from '@api/services/course/notify-exercise';
import { fetchTemplateById } from '@api/services/exercise/template';
import { AppError, ErrorCodes } from '@api/utils/errors';
import { assertCourseBelongsToOrganization, assertCourseTeamMemberOrOrgAdmin, paginateInMemory } from '../shared';

type ExerciseDetail = Awaited<ReturnType<typeof getExercise>>;

function toPublicExercise(exercise: TExercise) {
  return {
    id: exercise.id,
    courseId: exercise.courseId,
    sectionId: exercise.sectionId,
    lessonId: exercise.lessonId,
    title: exercise.title,
    description: exercise.description,
    order: exercise.order,
    slug: exercise.slug,
    isUnlocked: exercise.isUnlocked,
    dueBy: exercise.dueBy,
    allowMultipleAttempts: exercise.allowMultipleAttempts,
    sectionDisplayMode: exercise.sectionDisplayMode,
    completionPolicy: exercise.completionPolicy,
    passThreshold: exercise.passThreshold,
    createdAt: exercise.createdAt,
    updatedAt: exercise.updatedAt
  };
}

function toPublicExerciseDetail(exercise: ExerciseDetail) {
  return {
    ...toPublicExercise(exercise),
    questions: (exercise.questions ?? []).map((question) => ({
      id: Number(question.id),
      name: question.name,
      question: question.title,
      questionTypeId: question.questionTypeId,
      points: question.points,
      order: question.order,
      settings: question.settings ?? {},
      exerciseSectionId: question.exerciseSectionId ?? null,
      options: question.options.map((option) => ({
        id: Number(option.id),
        label: option.label,
        value: option.value,
        isCorrect: option.isCorrect,
        settings: option.settings ?? {}
      }))
    })),
    sections: (exercise.sections ?? []).map((section) => ({
      id: section.id,
      title: section.title,
      description: section.description,
      order: section.order,
      colorTheme: section.colorTheme,
      afterBehavior: section.afterBehavior,
      questionIds: section.questions.map((question) => Number(question.id))
    }))
  };
}

async function assertCourseTeamAccess(orgId: string, actorId: string | null, courseId: string) {
  await assertCourseBelongsToOrganization(orgId, courseId);
  await assertCourseTeamMemberOrOrgAdmin(courseId, actorId);
}

/** Loads the exercise and 404s unless it belongs to the course, including legacy lesson-linked exercises. */
export async function assertExerciseBelongsToCourse(courseId: string, exerciseId: string): Promise<TExercise> {
  const exercise = await getExerciseById(exerciseId);
  if (!exercise || (await resolveExerciseCourseId(exercise)) !== courseId) {
    throw new AppError('Exercise not found', ErrorCodes.EXERCISE_NOT_FOUND, 404);
  }

  return exercise;
}

async function assertPlacementBelongsToCourse(courseId: string, placement: { sectionId?: string; lessonId?: string }) {
  if (placement.sectionId) {
    const section = await getCourseSectionById(placement.sectionId);
    if (!section || section.courseId !== courseId) {
      throw new AppError('Course section not found', ErrorCodes.COURSE_SECTION_NOT_FOUND, 404);
    }
  }

  if (placement.lessonId) {
    const lesson = await getLessonById(placement.lessonId);
    if (!lesson || lesson.courseId !== courseId) {
      throw new AppError('Lesson not found', ErrorCodes.LESSON_NOT_FOUND, 404);
    }
  }
}

async function assertQuestionTypesAllowed(orgId: string, questionTypeIds: Array<number | undefined>) {
  if (questionTypeIds.length === 0) return;

  assertNoPremiumQuestionTypes(questionTypeIds, await isOrgOnPaidPlan(orgId));
}

/**
 * Question and option ids in the update must already belong to this exercise: the core diff trusts them, so without
 * this check a caller could delete or edit another exercise's rows. Section ids may be new (callers mint them so new
 * questions can reference new sections) but must not belong to another exercise.
 */
async function assertUpdateIdsBelongToExercise(
  exerciseId: string,
  current: ExerciseDetail,
  payload: TPublicApiUpdateCourseExercise
) {
  const optionIdsByQuestionId = new Map(
    (current.questions ?? []).map((question) => [
      Number(question.id),
      new Set(question.options.map((option) => Number(option.id)))
    ])
  );
  const currentSectionIds = new Set((current.sections ?? []).map((section) => section.id));

  const newSectionIds = (payload.sections ?? [])
    .map((section) => section.id)
    .filter((id): id is string => Boolean(id) && !currentSectionIds.has(id!));
  const takenSection = (await getExerciseSectionOwnersByIds(newSectionIds)).find(
    (section) => section.exerciseId !== exerciseId
  );
  if (takenSection) {
    throw new AppError(`Exercise section ${takenSection.id} not found in this exercise`, ErrorCodes.NOT_FOUND, 404);
  }

  const assignableSectionIds = payload.sections
    ? new Set(payload.sections.map((section) => section.id).filter((id): id is string => Boolean(id)))
    : currentSectionIds;

  for (const question of payload.questions ?? []) {
    const optionIds = question.id ? optionIdsByQuestionId.get(question.id) : undefined;
    if (question.id && !optionIds) {
      throw new AppError(`Question ${question.id} not found in this exercise`, ErrorCodes.NOT_FOUND, 404);
    }

    for (const option of question.options ?? []) {
      if (option.id && !optionIds?.has(option.id)) {
        throw new AppError(`Option ${option.id} not found on this question`, ErrorCodes.NOT_FOUND, 404);
      }
    }

    if (question.exerciseSectionId && !assignableSectionIds.has(question.exerciseSectionId)) {
      throw new AppError(
        `Exercise section ${question.exerciseSectionId} not found in this exercise`,
        ErrorCodes.NOT_FOUND,
        404
      );
    }
  }
}

function toInternalUpdate(payload: TPublicApiUpdateCourseExercise): TExerciseUpdate {
  const deletedAt = new Date().toISOString();
  const { questions, ...fields } = payload;

  return {
    ...fields,
    questions: questions?.map(({ delete: isDeleted, options, ...question }) => ({
      ...question,
      deletedAt: isDeleted ? deletedAt : undefined,
      options: options?.map(({ delete: isOptionDeleted, ...option }) => ({
        ...option,
        deletedAt: isOptionDeleted ? deletedAt : undefined
      }))
    }))
  };
}

export async function listCourseExercisesService(
  orgId: string,
  actorId: string | null,
  params: TPublicApiCourseParam,
  query: TPublicApiCourseExercisesQuery
) {
  await assertCourseTeamAccess(orgId, actorId, params.courseId);

  const exercises = await listExercises(params.courseId, { sectionId: query.sectionId, lessonId: query.lessonId });
  const sorted = [...exercises].sort((a, b) => a.order - b.order || a.id.localeCompare(b.id));
  const { items, pagination } = paginateInMemory(sorted, query);

  return { items: items.map(toPublicExercise), pagination };
}

export async function createCourseExerciseService(
  orgId: string,
  actorId: string | null,
  params: TPublicApiCourseParam,
  payload: TPublicApiCreateCourseExercise
) {
  await assertCourseTeamAccess(orgId, actorId, params.courseId);
  await assertPlacementBelongsToCourse(params.courseId, payload);

  if (payload.templateId !== undefined) {
    const template = await fetchTemplateById(payload.templateId);
    if (!template) {
      throw new AppError('Exercise template not found', ErrorCodes.NOT_FOUND, 404);
    }
    if (!template.questionnaire?.questions) {
      throw new AppError('Exercise template is missing questionnaire data', ErrorCodes.VALIDATION_ERROR, 400);
    }

    await assertQuestionTypesAllowed(
      orgId,
      template.questionnaire.questions.map((question) => question.question_type.id)
    );

    const exercise = await createExerciseFromTemplate(
      params.courseId,
      payload.lessonId,
      payload.sectionId,
      payload.order,
      template
    );

    return toPublicExerciseDetail(exercise as ExerciseDetail);
  }

  const questions = payload.questions ?? [];
  await assertQuestionTypesAllowed(
    orgId,
    questions.map((question) => question.questionTypeId)
  );

  const exercise = await createExercise({
    courseId: params.courseId,
    title: payload.title!,
    description: payload.description,
    sectionId: payload.sectionId,
    lessonId: payload.lessonId,
    order: payload.order,
    dueBy: payload.dueBy,
    slug: payload.slug,
    questions
  });

  return toPublicExerciseDetail(exercise as ExerciseDetail);
}

export async function getCourseExerciseService(
  orgId: string,
  actorId: string | null,
  params: TPublicApiCourseExerciseParam
) {
  await assertCourseTeamAccess(orgId, actorId, params.courseId);
  await assertExerciseBelongsToCourse(params.courseId, params.exerciseId);

  return toPublicExerciseDetail(await getExercise(params.exerciseId));
}

export async function updateCourseExerciseService(
  orgId: string,
  actorId: string | null,
  params: TPublicApiCourseExerciseParam,
  payload: TPublicApiUpdateCourseExercise
) {
  await assertCourseTeamAccess(orgId, actorId, params.courseId);
  await assertExerciseBelongsToCourse(params.courseId, params.exerciseId);
  await assertPlacementBelongsToCourse(params.courseId, payload);

  const current = await getExercise(params.exerciseId);
  await assertUpdateIdsBelongToExercise(params.exerciseId, current, payload);

  await assertQuestionTypesAllowed(
    orgId,
    (payload.questions ?? []).filter((question) => !question.delete).map((question) => question.questionTypeId)
  );

  const exercise = await updateExerciseService(params.exerciseId, toInternalUpdate(payload));

  return toPublicExerciseDetail(exercise as ExerciseDetail);
}

export async function deleteCourseExerciseService(
  orgId: string,
  actorId: string | null,
  params: TPublicApiCourseExerciseParam
) {
  await assertCourseTeamAccess(orgId, actorId, params.courseId);

  const exercise = await deleteExerciseForCourseService(params.courseId, params.exerciseId);

  return toPublicExercise(exercise);
}

export async function notifyCourseExerciseLearnersService(
  orgId: string,
  actorId: string | null,
  params: TPublicApiCourseExerciseParam
) {
  await assertCourseTeamAccess(orgId, actorId, params.courseId);
  await assertExerciseBelongsToCourse(params.courseId, params.exerciseId);

  return notifyCourseExerciseService(params.courseId, params.exerciseId);
}

export async function getCourseExerciseNotifyStatusService(
  orgId: string,
  actorId: string | null,
  params: TPublicApiCourseExerciseNotifyParam,
  query: TPublicApiCourseExerciseNotifyStatusQuery
) {
  await assertCourseTeamAccess(orgId, actorId, params.courseId);
  await assertExerciseBelongsToCourse(params.courseId, params.exerciseId);

  // Job ids are global to the notifications queue, so check the job is this course's exercise notification.
  const job = await getQueueJobMeta(QUEUE_NAMES.notifications, params.jobId);
  if (!job || job.name !== JOB_NAMES.notifications.notifyCourseExercise || job.data.courseId !== params.courseId) {
    throw new AppError('Notification job not found', ErrorCodes.NOT_FOUND, 404);
  }

  const envelope = await getNotifyCourseExerciseStatusService(params.jobId, query.pollCount);

  return {
    jobId: envelope.job.id,
    status: envelope.job.status,
    createdAt: envelope.job.createdAt,
    updatedAt: envelope.job.updatedAt,
    error: envelope.job.error,
    nextPollMs: envelope.nextPollMs
  };
}
