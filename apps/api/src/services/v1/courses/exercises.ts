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
import { getCourseItemRanks } from '@cio/core/services/course/outline';
import { getCourseSectionById } from '@cio/db/queries/course';
import { getExerciseById, getExerciseSectionOwnersByIds } from '@cio/db/queries/exercise';
import { getAnsweredQuestionIds } from '@cio/db/queries/submission';
import { getLessonById } from '@cio/db/queries/lesson';
import type { TExercise } from '@cio/db/types';
import { getQuestionOptionIssues, type TExerciseUpdate } from '@cio/utils/validation/exercise';
import {
  PUBLIC_API_MAX_QUESTION_OPTIONS,
  type TPublicApiCourseExerciseNotifyParam,
  type TPublicApiCourseExerciseNotifyStatusQuery,
  type TPublicApiCourseExerciseParam,
  type TPublicApiCourseExercisesQuery,
  type TPublicApiCourseParam,
  type TPublicApiForceQuery,
  type TPublicApiCreateCourseExercise,
  type TPublicApiUpdateCourseExercise
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
type SectionAfterBehavior = NonNullable<TPublicApiUpdateCourseExercise['sections']>[number]['afterBehavior'];

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

type ExerciseDetailQuestion = NonNullable<ExerciseDetail['questions']>[number];
type ExerciseDetailOption = ExerciseDetailQuestion['options'][number];
type ExerciseDetailSection = NonNullable<ExerciseDetail['sections']>[number];

function toPublicOption(option: ExerciseDetailOption) {
  return {
    id: Number(option.id),
    label: option.label,
    value: option.value,
    isCorrect: option.isCorrect,
    settings: option.settings ?? {}
  };
}

function toPublicQuestion(question: ExerciseDetailQuestion) {
  const options = question.options.map(toPublicOption);

  return {
    id: Number(question.id),
    name: question.name,
    question: question.title,
    questionTypeId: question.questionTypeId,
    points: question.points,
    order: question.order,
    settings: question.settings ?? {},
    exerciseSectionId: question.exerciseSectionId ?? null,
    options
  };
}

function toPublicSection(section: ExerciseDetailSection) {
  const questionIds = section.questions.map((question) => Number(question.id));

  return {
    id: section.id,
    title: section.title,
    description: section.description,
    order: section.order,
    colorTheme: section.colorTheme,
    afterBehavior: section.afterBehavior,
    questionIds
  };
}

function toPublicExerciseDetail(exercise: ExerciseDetail) {
  const questions = (exercise.questions ?? []).map(toPublicQuestion);
  const sections = (exercise.sections ?? []).map(toPublicSection);

  return {
    ...toPublicExercise(exercise),
    questions,
    sections
  };
}

async function assertCourseTeamAccess(orgId: string, actorId: string | null, courseId: string) {
  await assertCourseBelongsToOrganization(orgId, courseId);
  await assertCourseTeamMemberOrOrgAdmin(courseId, actorId);
}

/** Returns the exercise, or throws 404 if it does not belong to the course. */
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

/** Throws 404 if the update references another exercise's question, option or section, or 400 if a kept question would lose its section. */
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
  const currentSections = current.sections ?? [];
  const currentSectionIds = new Set(currentSections.map((section) => section.id));
  const sentSections = payload.sections ?? [];

  const removedSectionIds = new Set(
    sentSections.filter((section) => section.delete).map((section) => section.id as string)
  );
  const unknownRemovedId = [...removedSectionIds].find((id) => !currentSectionIds.has(id));
  if (unknownRemovedId) {
    throw new AppError(`Exercise section ${unknownRemovedId} not found in this exercise`, ErrorCodes.NOT_FOUND, 404);
  }

  const newSections = sentSections.filter(
    (section) => !section.delete && (!section.id || !currentSectionIds.has(section.id))
  );
  if (newSections.some((section) => section.title === undefined || section.order === undefined)) {
    throw new AppError('title and order are required for a new section', ErrorCodes.VALIDATION_ERROR, 400, 'sections');
  }

  const newSectionIds = newSections.map((section) => section.id).filter((id): id is string => Boolean(id));
  const takenSection = (await getExerciseSectionOwnersByIds(newSectionIds)).find(
    (section) => section.exerciseId !== exerciseId
  );
  if (takenSection) {
    throw new AppError(`Exercise section ${takenSection.id} not found in this exercise`, ErrorCodes.NOT_FOUND, 404);
  }

  const keptSectionIds = [...currentSectionIds].filter((id) => !removedSectionIds.has(id));
  const assignableSectionIds = new Set([...keptSectionIds, ...newSectionIds]);

  const sentSectionById = new Map(sentSections.filter((section) => section.id).map((section) => [section.id, section]));
  const finalBehaviors = [
    ...currentSections
      .filter((section) => !removedSectionIds.has(section.id))
      .map((section) => sentSectionById.get(section.id)?.afterBehavior ?? section.afterBehavior),
    ...newSections.map((section) => section.afterBehavior)
  ] as Array<SectionAfterBehavior | null | undefined>;
  const strandedTarget = finalBehaviors.find(
    (behavior) => behavior?.action === 'go_to_section' && !assignableSectionIds.has(behavior.exerciseSectionId)
  );
  if (strandedTarget?.action === 'go_to_section') {
    const targetId = strandedTarget.exerciseSectionId;
    if (removedSectionIds.has(targetId)) {
      throw new AppError(
        `Another section's afterBehavior goes to section ${targetId}: change it before removing that section`,
        ErrorCodes.CONFLICT,
        409
      );
    }
    throw new AppError(`Exercise section ${targetId} not found in this exercise`, ErrorCodes.NOT_FOUND, 404);
  }

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

    if (question.exerciseSectionId === null && !question.delete && assignableSectionIds.size > 0) {
      throw new AppError(
        'exerciseSectionId cannot be null while the exercise has sections',
        ErrorCodes.VALIDATION_ERROR,
        400,
        'questions'
      );
    }
  }

  if (sentSections.length === 0) return;

  const incomingById = new Map((payload.questions ?? []).filter((q) => q.id).map((q) => [q.id, q]));
  for (const question of current.questions ?? []) {
    const incoming = incomingById.get(Number(question.id));
    if (incoming?.delete) continue;

    const sectionId =
      incoming?.exerciseSectionId !== undefined ? incoming.exerciseSectionId : question.exerciseSectionId;
    if (sectionId && removedSectionIds.has(sectionId)) {
      throw new AppError(
        `Section ${sectionId} still holds question ${question.id}: move or delete it in the same request`,
        ErrorCodes.CONFLICT,
        409
      );
    }

    if (assignableSectionIds.size > 0 && (!sectionId || !assignableSectionIds.has(sectionId))) {
      throw new AppError(
        `Question ${question.id} would be left without a section: move it to a section of this exercise or delete it`,
        ErrorCodes.VALIDATION_ERROR,
        400
      );
    }
  }
}

/** Throws 409 if the update deletes a question students have answered, unless `force` is set. */
async function assertDeletedQuestionsUnanswered(payload: TPublicApiUpdateCourseExercise, force: boolean) {
  if (force) return;

  const deletedIds = (payload.questions ?? [])
    .filter((question) => question.delete && question.id)
    .map((question) => question.id as number);
  const answeredIds = await getAnsweredQuestionIds(deletedIds);
  if (answeredIds.length > 0) {
    throw new AppError(
      `Students have answered question ${answeredIds.join(', ')}. Pass force=true to delete it together with their answers`,
      ErrorCodes.CONFLICT,
      409
    );
  }
}

/** Throws 400 if an edited question's merged options break the option rules or the option limit. */
function assertEditedQuestionOptionsValid(current: ExerciseDetail, payload: TPublicApiUpdateCourseExercise) {
  const currentById = new Map((current.questions ?? []).map((question) => [Number(question.id), question]));

  for (const question of payload.questions ?? []) {
    const existing = question.id ? currentById.get(question.id) : undefined;
    if (!existing || question.delete) continue;
    if (question.options === undefined && question.questionTypeId === undefined && question.settings === undefined) {
      continue;
    }

    const sent = question.options ?? [];
    const sentIds = new Set(sent.map((option) => option.id));
    const storedById = new Map(existing.options.map((option) => [Number(option.id), option]));
    const merged = [
      ...existing.options.filter((option) => !sentIds.has(Number(option.id))),
      ...sent
        .filter((option) => !option.delete)
        .map((option) => ({ isCorrect: option.isCorrect ?? storedById.get(option.id ?? -1)?.isCorrect }))
    ];
    if (merged.length > PUBLIC_API_MAX_QUESTION_OPTIONS) {
      throw new AppError(
        `Question ${question.id}: a question can have at most ${PUBLIC_API_MAX_QUESTION_OPTIONS} options`,
        ErrorCodes.VALIDATION_ERROR,
        400,
        'questions'
      );
    }

    const [issue] = getQuestionOptionIssues({
      questionTypeId: question.questionTypeId ?? existing.questionTypeId ?? undefined,
      settings: question.settings ?? (existing.settings as Record<string, unknown> | null) ?? undefined,
      options: merged.map((option) => ({ isCorrect: option.isCorrect === true }))
    });
    if (issue) {
      throw new AppError(`Question ${question.id}: ${issue}`, ErrorCodes.VALIDATION_ERROR, 400, 'questions');
    }
  }
}

type InternalQuestion = NonNullable<TExerciseUpdate['questions']>[number];
type InternalOption = NonNullable<InternalQuestion['options']>[number];

function toStoredSettings(settings: unknown): Record<string, unknown> | undefined {
  return (settings as Record<string, unknown> | null) ?? undefined;
}

function toInternalOption(option: ExerciseDetailOption): InternalOption {
  return {
    id: Number(option.id),
    label: option.label ?? '',
    isCorrect: option.isCorrect,
    settings: toStoredSettings(option.settings)
  };
}

type PublicQuestionUpdate = NonNullable<TPublicApiUpdateCourseExercise['questions']>[number];
type PublicOptionUpdate = NonNullable<PublicQuestionUpdate['options']>[number];

function toInternalSentOption(
  { delete: isOptionDeleted, ...option }: PublicOptionUpdate,
  storedOptionById: Map<number, ExerciseDetailOption>,
  deletedAt: string
): InternalOption {
  const storedOption = option.id ? storedOptionById.get(option.id) : undefined;
  const label = option.label ?? storedOption?.label ?? '';
  const isCorrect = option.isCorrect ?? storedOption?.isCorrect ?? false;
  const settings = option.settings ?? toStoredSettings(storedOption?.settings);

  return {
    id: option.id,
    label,
    isCorrect,
    settings,
    deletedAt: isOptionDeleted ? deletedAt : undefined
  };
}

function toInternalQuestion(
  { delete: isDeleted, options, ...question }: PublicQuestionUpdate,
  storedQuestionById: Map<number, ExerciseDetailQuestion>,
  deletedAt: string
): InternalQuestion {
  const stored = question.id ? storedQuestionById.get(question.id) : undefined;
  const storedOptionById = new Map((stored?.options ?? []).map((option) => [Number(option.id), option]));
  const sentOptionIds = new Set((options ?? []).map((option) => option.id));

  const keptOptions =
    stored && !isDeleted
      ? stored.options.filter((option) => !sentOptionIds.has(Number(option.id))).map(toInternalOption)
      : [];
  const sentOptions = options?.map((option) => toInternalSentOption(option, storedOptionById, deletedAt));
  const mergedOptions = sentOptions || keptOptions.length > 0 ? [...keptOptions, ...(sentOptions ?? [])] : undefined;

  const title = question.question ?? stored?.title ?? '';
  const points = question.points ?? stored?.points ?? 1;
  const settings = question.settings ?? toStoredSettings(stored?.settings);
  const exerciseSectionId =
    question.exerciseSectionId !== undefined ? question.exerciseSectionId : (stored?.exerciseSectionId ?? undefined);

  return {
    ...question,
    question: title,
    points,
    settings,
    exerciseSectionId,
    deletedAt: isDeleted ? deletedAt : undefined,
    options: mergedOptions
  };
}

/** Returns the full core update, filling every field the caller omitted from the stored exercise. */
type PublicSectionUpdate = NonNullable<TPublicApiUpdateCourseExercise['sections']>[number];
type InternalSection = NonNullable<TExerciseUpdate['sections']>[number];

function toInternalSections(sent: PublicSectionUpdate[], current: ExerciseDetail): InternalSection[] {
  const sentById = new Map(sent.filter((section) => section.id).map((section) => [section.id as string, section]));
  const storedIds = new Set((current.sections ?? []).map((section) => section.id));

  const kept = (current.sections ?? [])
    .filter((stored) => !sentById.get(stored.id)?.delete)
    .map((stored): InternalSection => {
      const edit = sentById.get(stored.id);
      const description = edit?.description !== undefined ? edit.description : stored.description;

      return {
        id: stored.id,
        title: edit?.title ?? stored.title,
        description,
        order: edit?.order ?? stored.order,
        colorTheme: (edit?.colorTheme ?? stored.colorTheme) as InternalSection['colorTheme'],
        afterBehavior: (edit?.afterBehavior ?? stored.afterBehavior) as InternalSection['afterBehavior']
      };
    });
  const added = sent
    .filter((section) => !section.delete && (!section.id || !storedIds.has(section.id)))
    .map(
      (section): InternalSection => ({
        id: section.id,
        title: section.title as string,
        description: section.description ?? null,
        order: section.order as number,
        colorTheme: section.colorTheme ?? 'blue',
        afterBehavior: section.afterBehavior ?? { action: 'continue' }
      })
    );

  return [...kept, ...added];
}

function toInternalUpdate(payload: TPublicApiUpdateCourseExercise, current: ExerciseDetail): TExerciseUpdate {
  const deletedAt = new Date().toISOString();
  const { questions, sections, ...fields } = payload;
  const storedQuestionById = new Map((current.questions ?? []).map((question) => [Number(question.id), question]));
  const internalQuestions = questions?.map((question) => toInternalQuestion(question, storedQuestionById, deletedAt));

  const internalSections = sections !== undefined ? toInternalSections(sections, current) : undefined;

  return {
    ...fields,
    questions: internalQuestions,
    ...(internalSections !== undefined && { sections: internalSections })
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
  const ranks = await getCourseItemRanks(params.courseId);
  const rankOf = (exercise: (typeof exercises)[number]) => ranks.get(exercise.id) ?? Number.MAX_SAFE_INTEGER;
  const sorted = [...exercises].sort((a, b) => rankOf(a) - rankOf(b) || a.order - b.order || a.id.localeCompare(b.id));
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

/** Applies a partial exercise update and returns the exercise with the ids of the questions it created. */
export async function applyCourseExerciseUpdate(
  orgId: string,
  actorId: string | null,
  params: TPublicApiCourseExerciseParam,
  payload: TPublicApiUpdateCourseExercise,
  options: TPublicApiForceQuery = { force: false }
) {
  await assertCourseTeamAccess(orgId, actorId, params.courseId);
  await assertExerciseBelongsToCourse(params.courseId, params.exerciseId);
  await assertPlacementBelongsToCourse(params.courseId, payload);

  const current = await getExercise(params.exerciseId);
  await assertUpdateIdsBelongToExercise(params.exerciseId, current, payload);
  await assertDeletedQuestionsUnanswered(payload, options.force);
  assertEditedQuestionOptionsValid(current, payload);

  await assertQuestionTypesAllowed(
    orgId,
    (payload.questions ?? []).filter((question) => !question.delete).map((question) => question.questionTypeId)
  );

  const { createdQuestionIds = [], ...updated } = await updateExerciseService(
    params.exerciseId,
    toInternalUpdate(payload, current)
  );
  const exercise = toPublicExerciseDetail(updated as ExerciseDetail);

  return { exercise, createdQuestionIds };
}

export async function updateCourseExerciseService(
  orgId: string,
  actorId: string | null,
  params: TPublicApiCourseExerciseParam,
  payload: TPublicApiUpdateCourseExercise,
  options: TPublicApiForceQuery = { force: false }
) {
  const { exercise } = await applyCourseExerciseUpdate(orgId, actorId, params, payload, options);

  return exercise;
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

export async function notifyCourseExerciseStudentsService(
  orgId: string,
  actorId: string | null,
  params: TPublicApiCourseExerciseParam
) {
  await assertCourseTeamAccess(orgId, actorId, params.courseId);
  await assertExerciseBelongsToCourse(params.courseId, params.exerciseId);

  return notifyCourseExerciseService(params.courseId, params.exerciseId);
}

/** Throws 404 unless the job is this exercise's notification. */
async function assertNotifyJobBelongsToExercise(params: TPublicApiCourseExerciseNotifyParam) {
  const job = await getQueueJobMeta(QUEUE_NAMES.notifications, params.jobId);
  if (
    !job ||
    job.name !== JOB_NAMES.notifications.notifyCourseExercise ||
    job.data.courseId !== params.courseId ||
    job.data.exerciseId !== params.exerciseId
  ) {
    throw new AppError('Notification job not found', ErrorCodes.NOT_FOUND, 404);
  }
}

export async function getCourseExerciseNotifyStatusService(
  orgId: string,
  actorId: string | null,
  params: TPublicApiCourseExerciseNotifyParam,
  query: TPublicApiCourseExerciseNotifyStatusQuery
) {
  await assertCourseTeamAccess(orgId, actorId, params.courseId);
  await assertExerciseBelongsToCourse(params.courseId, params.exerciseId);

  await assertNotifyJobBelongsToExercise(params);

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
