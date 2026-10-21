import {
  scoreAnswerForQuestion,
  type AnswerData,
  type ExerciseQuestionModel,
  type QuestionTypeKey
} from '@cio/question-types';
import {
  copyLessonVideoCheckpoints,
  countLessonVideoCheckpointsForAsset,
  deleteLessonVideoCheckpoint,
  deleteLessonVideoCheckpointAnswers,
  getLessonVideoCheckpointAnswer,
  getLessonVideoCheckpointAnswersForProfile,
  getLessonVideoCheckpointById,
  getLessonById,
  getLessonCompletion,
  insertLessonVideoCheckpoint,
  listLessonVideoCheckpointAnswers,
  listLessonVideoCheckpoints,
  replaceLessonVideoCheckpoint,
  upsertLessonCompletion,
  upsertLessonVideoCheckpointAnswer,
  type LessonVideoCheckpointWithOptions
} from '@cio/db/queries/lesson';
import { getCourseOrganizationId } from '@cio/db/queries';
import { countCourseStudents } from '@cio/db/queries/course';
import { getActiveOrganizationPlan } from '@cio/db/queries/organization';
import { db } from '@cio/db/drizzle';
import type { DbOrTxClient } from '@cio/db/drizzle';
import type { TLesson, TLessonVideoCheckpointAnswer } from '@cio/db/types';
import { env } from '@cio/core/config/env';
import { PLAN } from '@cio/utils/plans';
import { AppError, ErrorCodes } from '@cio/utils/errors';
import {
  VIDEO_CHECKPOINT_MAX_PER_ASSET,
  VIDEO_CHECKPOINT_MIN_GAP_SECONDS,
  type TVideoCheckpointCreate,
  type TVideoCheckpointUpdate
} from '@cio/utils/validation/lesson';
import { emitCourseWebhookEvent } from '../webhook/emit';
import { getLessonWatchProgressService } from './lesson';
import { resolveWatchEnforcedAssetIds } from '../../utils/lesson-watch-enforcement';

export type VideoCheckpointPayload = {
  id: string;
  lessonId: string;
  assetId: string;
  timestampSeconds: number;
  resumePolicy: string;
  question: ExerciseQuestionModel;
};

export type VideoCheckpointResult = {
  checkpointId: string;
  timestampSeconds: number;
  title: string;
  questionType: string;
  answeredCount: number;
  correctCount: number;
  correctPercent: number | null;
  commonWrongAnswer: { label: string; count: number; percent: number } | null;
};

export type VideoCheckpointResultAnswer = {
  checkpointId: string;
  profileId: string;
  fullname: string | null;
  avatarUrl: string | null;
  answerData: AnswerData;
  answerSummary: string;
  isCorrect: boolean;
  answeredAt: string;
};

export type VideoCheckpointResults = {
  enrolledStudentCount: number;
  learnersAnsweredAll: number;
  learnersAnsweredAny: number;
  overallCorrectPercent: number | null;
  checkpoints: VideoCheckpointResult[];
  answers: VideoCheckpointResultAnswer[];
};

/**
 * Checkpoints ride the same entitlement as video upload, so a free-plan org cannot author or read results for them.
 * Self-hosted deployments always have the feature.
 */
export async function assertVideoCheckpointsEnabled(orgId: string): Promise<void> {
  if (env.PUBLIC_IS_SELFHOSTED === 'true') return;

  const activePlan = await getActiveOrganizationPlan(orgId);
  if (activePlan && activePlan.planName !== PLAN.BASIC) return;

  throw new AppError('In-video questions require a paid plan', ErrorCodes.UPGRADE_REQUIRED, 403);
}

async function assertCheckpointsEnabledForLesson(lesson: Pick<TLesson, 'courseId'>): Promise<void> {
  const orgId = await getCourseOrganizationId(lesson.courseId);
  if (!orgId) {
    throw new AppError('Course not found', ErrorCodes.COURSE_NOT_FOUND, 404);
  }

  await assertVideoCheckpointsEnabled(orgId);
}

async function requireLesson(lessonId: string) {
  const lesson = await getLessonById(lessonId);
  if (!lesson) {
    throw new AppError('Lesson not found', ErrorCodes.LESSON_NOT_FOUND, 404);
  }

  return lesson;
}

function uploadedAssetIds(lesson: Pick<TLesson, 'videos'>): string[] {
  return (lesson.videos ?? [])
    .filter((video) => video.type === 'upload' && typeof video.assetId === 'string')
    .map((video) => video.assetId as string);
}

function assertEnforceableAsset(lesson: Pick<TLesson, 'videos'>, assetId: string) {
  if (!uploadedAssetIds(lesson).includes(assetId)) {
    throw new AppError(
      'In-video questions only work on videos uploaded to this lesson',
      ErrorCodes.VALIDATION_ERROR,
      400,
      'assetId'
    );
  }
}

function assertTimestampAvailable(
  existing: LessonVideoCheckpointWithOptions[],
  assetId: string,
  timestampSeconds: number,
  excludeId?: string
) {
  const collides = existing.some(
    (checkpoint) =>
      checkpoint.assetId === assetId &&
      checkpoint.id !== excludeId &&
      Math.abs(checkpoint.timestampSeconds - timestampSeconds) < VIDEO_CHECKPOINT_MIN_GAP_SECONDS
  );

  if (collides) {
    throw new AppError(
      `Another question is already within ${VIDEO_CHECKPOINT_MIN_GAP_SECONDS} seconds of this time`,
      ErrorCodes.VALIDATION_ERROR,
      409,
      'timestampSeconds'
    );
  }
}

function assertWithinDuration(lesson: Pick<TLesson, 'videos'>, assetId: string, timestampSeconds: number) {
  const video = (lesson.videos ?? []).find((item) => item.assetId === assetId);
  const duration = Number(video?.metadata?.duration);
  if (Number.isFinite(duration) && duration > 0 && timestampSeconds >= duration) {
    throw new AppError('That time is past the end of the video', ErrorCodes.VALIDATION_ERROR, 400, 'timestampSeconds');
  }
}

function toQuestionModel(checkpoint: LessonVideoCheckpointWithOptions): ExerciseQuestionModel {
  return {
    id: checkpoint.id,
    key: checkpoint.id,
    title: checkpoint.title,
    questionType: checkpoint.questionType as QuestionTypeKey,
    points: 1,
    required: true,
    settings: (checkpoint.settings ?? {}) as Record<string, unknown>,
    options: checkpoint.options.map((option) => ({
      id: option.id,
      label: option.label,
      value: option.value ?? undefined,
      isCorrect: option.isCorrect,
      settings: (option.settings ?? {}) as Record<string, unknown>
    }))
  };
}

export function toTeacherVideoCheckpoint(checkpoint: LessonVideoCheckpointWithOptions): VideoCheckpointPayload {
  return {
    id: checkpoint.id,
    lessonId: checkpoint.lessonId,
    assetId: checkpoint.assetId,
    timestampSeconds: checkpoint.timestampSeconds,
    resumePolicy: checkpoint.resumePolicy,
    question: toQuestionModel(checkpoint)
  };
}

function seededShuffle<T>(items: T[], seed: string): T[] {
  const result = [...items];
  let state = 0;
  for (let index = 0; index < seed.length; index += 1) {
    state = (state * 31 + seed.charCodeAt(index)) >>> 0;
  }

  for (let index = result.length - 1; index > 0; index -= 1) {
    state = (state * 1664525 + 1013904223) >>> 0;
    const swapIndex = state % (index + 1);
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }

  return result;
}

/**
 * Learner-facing shape: no correct flags, no answer keys. Ordering options are shuffled and word-bank words are
 * merged with the distractors so the bank does not reveal which words are right.
 */
export function toStudentVideoCheckpoint(checkpoint: LessonVideoCheckpointWithOptions): VideoCheckpointPayload {
  const question = toQuestionModel(checkpoint);
  const settings = { ...(question.settings ?? {}) };
  delete settings.correctValue;
  delete settings.acceptedAnswers;
  delete settings.items;

  if (question.questionType === 'WORD_BANK') {
    const words = [
      ...(Array.isArray(settings.correctAnswers) ? settings.correctAnswers : []),
      ...(Array.isArray(settings.distractors) ? settings.distractors : [])
    ].map((word) => String(word));
    settings.correctAnswers = seededShuffle(words, checkpoint.id);
    settings.distractors = [];
  }

  if (question.questionType === 'STAR') {
    settings.maxStars = Number(checkpoint.settings && (checkpoint.settings as Record<string, unknown>).maxStars) || 5;
  }

  const options = (question.options ?? []).map((option) => ({ ...option, isCorrect: false }));

  return {
    id: checkpoint.id,
    lessonId: checkpoint.lessonId,
    assetId: checkpoint.assetId,
    timestampSeconds: checkpoint.timestampSeconds,
    resumePolicy: checkpoint.resumePolicy,
    question: {
      ...question,
      settings,
      options: question.questionType === 'ORDERING' ? seededShuffle(options, checkpoint.id) : options
    }
  };
}

function normalizeCheckpointInput<T extends TVideoCheckpointCreate | TVideoCheckpointUpdate>(data: T): T {
  const settings = { ...data.settings };
  if (data.questionType === 'ORDERING') delete settings.items;

  const options = data.options
    .map((option) => ({
      label: option.label.trim(),
      value: option.value ?? null,
      isCorrect: option.isCorrect ?? false,
      settings: option.settings ?? {}
    }))
    .filter((option) => option.label.length > 0 || option.value);

  return { ...data, settings, options };
}

export async function listVideoCheckpointsForViewer(
  lessonId: string,
  profileId: string,
  isStaff: boolean
): Promise<{
  checkpoints: VideoCheckpointPayload[];
  answeredCheckpointIds: string[];
  satisfiedCheckpointIds: string[];
}> {
  const lesson = await requireLesson(lessonId);
  const assetIds = new Set(uploadedAssetIds(lesson));
  const stored = (await listLessonVideoCheckpoints(lessonId)).filter((checkpoint) => assetIds.has(checkpoint.assetId));
  const answers = await getLessonVideoCheckpointAnswersForProfile(lessonId, profileId);
  const answerByCheckpoint = new Map(answers.map((answer) => [answer.checkpointId, answer]));

  const answeredCheckpointIds = stored.filter((checkpoint) => answerByCheckpoint.has(checkpoint.id)).map((c) => c.id);
  const satisfiedCheckpointIds = stored
    .filter((checkpoint) => {
      const answer = answerByCheckpoint.get(checkpoint.id);
      if (!answer) return false;

      return checkpoint.resumePolicy !== 'correct' || answer.isCorrect;
    })
    .map((checkpoint) => checkpoint.id);

  return {
    checkpoints: stored.map((checkpoint) =>
      isStaff ? toTeacherVideoCheckpoint(checkpoint) : toStudentVideoCheckpoint(checkpoint)
    ),
    answeredCheckpointIds,
    satisfiedCheckpointIds
  };
}

export async function createVideoCheckpointService(lessonId: string, rawData: TVideoCheckpointCreate) {
  const lesson = await requireLesson(lessonId);
  await assertCheckpointsEnabledForLesson(lesson);

  const data = normalizeCheckpointInput(rawData);
  assertEnforceableAsset(lesson, data.assetId);
  assertWithinDuration(lesson, data.assetId, data.timestampSeconds);

  const checkpoint = await db.transaction(async (tx) => {
    const existingForAsset = await countLessonVideoCheckpointsForAsset(lessonId, data.assetId, tx);
    if (existingForAsset >= VIDEO_CHECKPOINT_MAX_PER_ASSET) {
      throw new AppError(
        `A video can have at most ${VIDEO_CHECKPOINT_MAX_PER_ASSET} questions`,
        ErrorCodes.VALIDATION_ERROR,
        400
      );
    }

    assertTimestampAvailable(await listLessonVideoCheckpoints(lessonId, tx), data.assetId, data.timestampSeconds);

    return insertLessonVideoCheckpoint(
      {
        lessonId,
        assetId: data.assetId,
        timestampSeconds: data.timestampSeconds,
        questionType: data.questionType,
        title: data.title,
        settings: data.settings,
        resumePolicy: data.resumePolicy
      },
      data.options,
      tx
    );
  });

  return toTeacherVideoCheckpoint(checkpoint);
}

async function requireCheckpoint(lessonId: string, checkpointId: string) {
  const checkpoint = await getLessonVideoCheckpointById(checkpointId);
  if (!checkpoint || checkpoint.lessonId !== lessonId) {
    throw new AppError('Question not found', ErrorCodes.VIDEO_CHECKPOINT_NOT_FOUND, 404);
  }

  return checkpoint;
}

function hasQuestionContentChanged(
  existing: LessonVideoCheckpointWithOptions,
  next: Pick<TVideoCheckpointUpdate, 'questionType' | 'title' | 'settings' | 'resumePolicy' | 'options'>
): boolean {
  const toComparable = (
    questionType: string,
    title: string,
    settings: unknown,
    resumePolicy: string,
    options: Array<{ label: string; value?: string | null; isCorrect?: boolean | null }>
  ) =>
    JSON.stringify({
      questionType,
      title,
      settings: settings ?? {},
      resumePolicy,
      options: options.map((option) => [option.label, option.value ?? null, option.isCorrect ?? false])
    });

  return (
    toComparable(existing.questionType, existing.title, existing.settings, existing.resumePolicy, existing.options) !==
    toComparable(next.questionType, next.title, next.settings, next.resumePolicy, next.options)
  );
}

/**
 * Editing a question's content rewrites its options and invalidates earlier answers, so they are cleared in the
 * same transaction. Moving the marker in time keeps them.
 */
export async function updateVideoCheckpointService(
  lessonId: string,
  checkpointId: string,
  rawData: TVideoCheckpointUpdate
) {
  const lesson = await requireLesson(lessonId);
  await assertCheckpointsEnabledForLesson(lesson);

  const existing = await requireCheckpoint(lessonId, checkpointId);
  const data = normalizeCheckpointInput(rawData);
  assertWithinDuration(lesson, existing.assetId, data.timestampSeconds);

  const checkpoint = await db.transaction(async (tx) => {
    assertTimestampAvailable(
      await listLessonVideoCheckpoints(lessonId, tx),
      existing.assetId,
      data.timestampSeconds,
      checkpointId
    );

    const updated = await replaceLessonVideoCheckpoint(
      checkpointId,
      {
        timestampSeconds: data.timestampSeconds,
        questionType: data.questionType,
        title: data.title,
        settings: data.settings,
        resumePolicy: data.resumePolicy
      },
      data.options,
      tx
    );
    if (!updated) {
      throw new AppError('Question not found', ErrorCodes.VIDEO_CHECKPOINT_NOT_FOUND, 404);
    }

    if (hasQuestionContentChanged(existing, data)) {
      await deleteLessonVideoCheckpointAnswers(checkpointId, tx);
    }

    return updated;
  });

  return toTeacherVideoCheckpoint(checkpoint);
}

export async function deleteVideoCheckpointService(lessonId: string, checkpointId: string) {
  await requireLesson(lessonId);
  await requireCheckpoint(lessonId, checkpointId);

  await deleteLessonVideoCheckpoint(checkpointId);

  return { id: checkpointId };
}

/**
 * True when the learner has satisfied every checkpoint on the lesson's uploaded videos: answered, and for
 * `correct`-policy checkpoints answered correctly. Lessons without checkpoints are always satisfied.
 */
export async function areLessonCheckpointsSatisfied(
  lessonId: string,
  profileId: string,
  dbClient: DbOrTxClient = db
): Promise<boolean> {
  const lesson = await getLessonById(lessonId);
  if (!lesson) return true;

  const assetIds = new Set(uploadedAssetIds(lesson));
  const checkpoints = (await listLessonVideoCheckpoints(lessonId, dbClient)).filter((checkpoint) =>
    assetIds.has(checkpoint.assetId)
  );
  if (checkpoints.length === 0) return true;

  const answers = await getLessonVideoCheckpointAnswersForProfile(lessonId, profileId, dbClient);
  const answerByCheckpoint = new Map(answers.map((answer) => [answer.checkpointId, answer]));

  return checkpoints.every((checkpoint) => {
    const answer = answerByCheckpoint.get(checkpoint.id);
    if (!answer) return false;

    return checkpoint.resumePolicy !== 'correct' || answer.isCorrect;
  });
}

export function assertCheckpointsSatisfiedMessage(): AppError {
  return new AppError(
    'Answer every question in the video to complete this lesson',
    ErrorCodes.VIDEO_CHECKPOINTS_INCOMPLETE,
    400
  );
}

function isFullMark(question: ExerciseQuestionModel, answerData: AnswerData): boolean {
  return scoreAnswerForQuestion({ ...question, points: 1 }, answerData) >= 1;
}

export type VideoCheckpointAnswerResult = {
  isCorrect: boolean;
  satisfied: boolean;
  lessonSatisfied: boolean;
  didJustComplete: boolean;
};

/**
 * Records one learner answer. `any` checkpoints keep the first answer; `correct` checkpoints accept retries until
 * the answer is a full mark, then freeze. When this answer satisfies the last open checkpoint of a lesson whose
 * watch requirement is already met, the lesson is completed here, because the watch heartbeat will not fire again.
 */
export async function answerVideoCheckpointService(
  lessonId: string,
  checkpointId: string,
  profileId: string,
  answerData: AnswerData
): Promise<VideoCheckpointAnswerResult> {
  const lesson = await requireLesson(lessonId);
  const checkpoint = await requireCheckpoint(lessonId, checkpointId);
  const question = toQuestionModel(checkpoint);
  const isCorrect = isFullMark(question, answerData);

  const existing = await getLessonVideoCheckpointAnswer(checkpointId, profileId);
  const frozen = existing && (checkpoint.resumePolicy === 'any' || existing.isCorrect);

  let saved: TLessonVideoCheckpointAnswer | null = existing;
  if (!frozen) {
    saved = await upsertLessonVideoCheckpointAnswer({ checkpointId, profileId, answerData, isCorrect });
  }

  const satisfied = Boolean(saved) && (checkpoint.resumePolicy !== 'correct' || Boolean(saved?.isCorrect));
  const lessonSatisfied = await areLessonCheckpointsSatisfied(lessonId, profileId);

  let didJustComplete = false;
  if (lessonSatisfied && lesson.completionPolicy === 'video_watch') {
    didJustComplete = await completeLessonIfWatchMet(lesson, profileId);
  }

  return { isCorrect: saved?.isCorrect ?? isCorrect, satisfied, lessonSatisfied, didJustComplete };
}

async function completeLessonIfWatchMet(lesson: TLesson, profileId: string): Promise<boolean> {
  const requiredAssetIds = resolveWatchEnforcedAssetIds(lesson.videos, lesson.completionPolicy);
  if (requiredAssetIds.length === 0) return false;

  const watchProgress = await getLessonWatchProgressService(lesson.id, profileId);
  if (!watchProgress?.isComplete) return false;

  const completion = await getLessonCompletion(lesson.id, profileId);
  if (completion?.isComplete) return false;

  await upsertLessonCompletion({ lessonId: lesson.id, profileId, isComplete: true });
  await emitCourseWebhookEvent(lesson.courseId, 'lesson.completion.updated', {
    lessonId: lesson.id,
    profileId,
    isComplete: true
  });

  return true;
}

export async function copyVideoCheckpointsForClone(
  lessonIdMap: ReadonlyMap<string, string>,
  assetIdMap: ReadonlyMap<string, string>,
  dbClient: DbOrTxClient
): Promise<number> {
  return copyLessonVideoCheckpoints(lessonIdMap, assetIdMap, dbClient);
}

function summarizeAnswer(question: ExerciseQuestionModel, answer: AnswerData): string {
  const labelFor = (optionId: string | number) => {
    const match = (question.options ?? []).find((option) => String(option.id) === String(optionId));

    return match?.label?.trim() || String(optionId);
  };

  switch (answer.type) {
    case 'RADIO':
      return labelFor(answer.optionId);
    case 'CHECKBOX':
      return answer.optionIds.map(labelFor).join(', ');
    case 'TRUE_FALSE':
      return answer.value ? 'True' : 'False';
    case 'NUMERIC':
    case 'STAR':
      return String(answer.value);
    case 'FILL_BLANK':
      return answer.values.join(', ');
    case 'WORD_BANK':
      return answer.filledBlanks.join(', ');
    case 'ORDERING':
      return answer.orderedValues.map(labelFor).join(' → ');
    default:
      return '';
  }
}

function wrongAnswerLabel(question: ExerciseQuestionModel, answer: AnswerData): string | null {
  if (answer.type === 'RADIO') return summarizeAnswer(question, answer);
  if (answer.type === 'TRUE_FALSE') return summarizeAnswer(question, answer);

  return null;
}

function percentOf(part: number, whole: number): number | null {
  if (whole <= 0) return null;

  return Math.round((part / whole) * 100);
}

/** Staff-only aggregate of how learners answered the lesson's video questions. */
export async function getVideoCheckpointResultsService(lessonId: string): Promise<VideoCheckpointResults> {
  const lesson = await requireLesson(lessonId);
  await assertCheckpointsEnabledForLesson(lesson);

  const enrolledStudentCount = await countCourseStudents(lesson.courseId);

  const assetIds = new Set(uploadedAssetIds(lesson));
  const checkpoints = (await listLessonVideoCheckpoints(lessonId)).filter((checkpoint) =>
    assetIds.has(checkpoint.assetId)
  );
  const answers = await listLessonVideoCheckpointAnswers(lessonId);
  const checkpointById = new Map(checkpoints.map((checkpoint) => [checkpoint.id, checkpoint]));

  const answersByCheckpoint = new Map<string, typeof answers>();
  const checkpointCountByProfile = new Map<string, number>();
  for (const answer of answers) {
    if (!checkpointById.has(answer.checkpointId)) continue;

    const bucket = answersByCheckpoint.get(answer.checkpointId) ?? [];
    bucket.push(answer);
    answersByCheckpoint.set(answer.checkpointId, bucket);
    checkpointCountByProfile.set(answer.profileId, (checkpointCountByProfile.get(answer.profileId) ?? 0) + 1);
  }

  const results: VideoCheckpointResult[] = checkpoints.map((checkpoint) => {
    const checkpointAnswers = answersByCheckpoint.get(checkpoint.id) ?? [];
    const correctCount = checkpointAnswers.filter((answer) => answer.isCorrect).length;
    const question = toQuestionModel(checkpoint);

    const wrongCounts = new Map<string, number>();
    for (const answer of checkpointAnswers) {
      if (answer.isCorrect) continue;

      const label = wrongAnswerLabel(question, answer.answerData as AnswerData);
      if (label) wrongCounts.set(label, (wrongCounts.get(label) ?? 0) + 1);
    }

    const [topWrong] = [...wrongCounts.entries()].sort((left, right) => right[1] - left[1]);
    const wrongTotal = checkpointAnswers.length - correctCount;

    return {
      checkpointId: checkpoint.id,
      timestampSeconds: checkpoint.timestampSeconds,
      title: checkpoint.title,
      questionType: checkpoint.questionType,
      answeredCount: checkpointAnswers.length,
      correctCount,
      correctPercent: percentOf(correctCount, checkpointAnswers.length),
      commonWrongAnswer: topWrong
        ? { label: topWrong[0], count: topWrong[1], percent: percentOf(topWrong[1], wrongTotal) ?? 0 }
        : null
    };
  });

  const totalAnswers = results.reduce((sum, result) => sum + result.answeredCount, 0);
  const totalCorrect = results.reduce((sum, result) => sum + result.correctCount, 0);
  const learnersAnsweredAll = [...checkpointCountByProfile.values()].filter(
    (answered) => answered >= checkpoints.length && checkpoints.length > 0
  ).length;

  return {
    enrolledStudentCount,
    learnersAnsweredAll,
    learnersAnsweredAny: checkpointCountByProfile.size,
    overallCorrectPercent: percentOf(totalCorrect, totalAnswers),
    checkpoints: results,
    answers: answers
      .filter((answer) => checkpointById.has(answer.checkpointId))
      .map((answer) => ({
        checkpointId: answer.checkpointId,
        profileId: answer.profileId,
        fullname: answer.fullname,
        avatarUrl: answer.avatarUrl,
        answerData: answer.answerData as AnswerData,
        answerSummary: summarizeAnswer(
          toQuestionModel(checkpointById.get(answer.checkpointId)!),
          answer.answerData as AnswerData
        ),
        isCorrect: answer.isCorrect,
        answeredAt: answer.answeredAt
      }))
  };
}

function csvCell(value: string | number | boolean | null): string {
  const text = value === null ? '' : String(value);
  const guarded = /^[=+\-@\t\r]/.test(text) ? `'${text}` : text;

  return /[",\n\r]/.test(guarded) ? `"${guarded.replace(/"/g, '""')}"` : guarded;
}

export function buildVideoCheckpointResultsCsv(results: VideoCheckpointResults): string {
  const checkpointById = new Map(results.checkpoints.map((checkpoint) => [checkpoint.checkpointId, checkpoint]));
  const header = ['Learner', 'Time', 'Question', 'Answer', 'Correct', 'Answered at'];
  const rows = results.answers.map((answer) => {
    const checkpoint = checkpointById.get(answer.checkpointId);
    const seconds = checkpoint?.timestampSeconds ?? 0;
    const time = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;

    return [
      answer.fullname ?? answer.profileId,
      time,
      checkpoint?.title ?? '',
      answer.answerSummary,
      answer.isCorrect ? 'Yes' : 'No',
      answer.answeredAt
    ];
  });

  return [header, ...rows].map((row) => row.map(csvCell).join(',')).join('\n');
}
