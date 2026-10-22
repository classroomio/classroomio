import {
  buildVideoCheckpointResultsCsv,
  createVideoCheckpointService,
  deleteVideoCheckpointService,
  getVideoCheckpointResultsService,
  listVideoCheckpointsForViewer,
  updateVideoCheckpointService,
  type VideoCheckpointPayload
} from '@cio/core/services/lesson/video-checkpoint';
import type {
  TPublicApiCourseLessonParam,
  TPublicApiCreateVideoCheckpoint,
  TPublicApiUpdateVideoCheckpoint,
  TPublicApiVideoCheckpointParam,
  TPublicApiVideoCheckpointQuestionType,
  TPublicApiVideoCheckpointResponse
} from '@cio/utils/validation/public-api';
import { AppError, ErrorCodes } from '@api/utils/errors';
import { assertAutomationActor, assertCourseTeamAccess, assertLessonInCourse } from '../shared';

function toPublicCheckpoint(checkpoint: VideoCheckpointPayload): TPublicApiVideoCheckpointResponse {
  const { question } = checkpoint;

  return {
    id: checkpoint.id,
    lessonId: checkpoint.lessonId,
    assetId: checkpoint.assetId,
    timestampSeconds: checkpoint.timestampSeconds,
    questionType: question.questionType as TPublicApiVideoCheckpointQuestionType,
    title: question.title,
    settings: question.settings ?? {},
    resumePolicy: checkpoint.resumePolicy as TPublicApiVideoCheckpointResponse['resumePolicy'],
    options: (question.options ?? []).map((option) => ({
      id: Number(option.id),
      label: option.label,
      value: option.value ?? null,
      isCorrect: option.isCorrect ?? false,
      settings: option.settings ?? {}
    }))
  };
}

async function assertTeamLessonAccess(orgId: string, actorId: string | null, params: TPublicApiCourseLessonParam) {
  await assertCourseTeamAccess(orgId, actorId, params.courseId);
  await assertLessonInCourse(params.courseId, params.lessonId);
}

export async function listPublicApiVideoCheckpointsService(
  orgId: string,
  actorId: string | null,
  params: TPublicApiCourseLessonParam
) {
  assertAutomationActor(actorId);
  await assertTeamLessonAccess(orgId, actorId, params);

  const { checkpoints } = await listVideoCheckpointsForViewer(params.lessonId, actorId, true);

  return { checkpoints: checkpoints.map(toPublicCheckpoint) };
}

export async function createPublicApiVideoCheckpointService(
  orgId: string,
  actorId: string | null,
  params: TPublicApiCourseLessonParam,
  payload: TPublicApiCreateVideoCheckpoint
) {
  assertAutomationActor(actorId);
  await assertTeamLessonAccess(orgId, actorId, params);

  return toPublicCheckpoint(await createVideoCheckpointService(params.lessonId, payload));
}

export async function updatePublicApiVideoCheckpointService(
  orgId: string,
  actorId: string | null,
  params: TPublicApiVideoCheckpointParam,
  payload: TPublicApiUpdateVideoCheckpoint
) {
  assertAutomationActor(actorId);
  await assertTeamLessonAccess(orgId, actorId, params);

  return toPublicCheckpoint(await updateVideoCheckpointService(params.lessonId, params.checkpointId, payload));
}

export async function deletePublicApiVideoCheckpointService(
  orgId: string,
  actorId: string | null,
  params: TPublicApiVideoCheckpointParam
) {
  assertAutomationActor(actorId);
  await assertTeamLessonAccess(orgId, actorId, params);

  return deleteVideoCheckpointService(params.lessonId, params.checkpointId);
}

export async function getPublicApiVideoCheckpointResultsService(
  orgId: string,
  actorId: string | null,
  params: TPublicApiCourseLessonParam
) {
  assertAutomationActor(actorId);
  await assertTeamLessonAccess(orgId, actorId, params);

  return getVideoCheckpointResultsService(params.lessonId);
}

export async function exportPublicApiVideoCheckpointResultsCsvService(
  orgId: string,
  actorId: string | null,
  params: TPublicApiCourseLessonParam
) {
  const results = await getPublicApiVideoCheckpointResultsService(orgId, actorId, params);
  if (results.checkpoints.length === 0) {
    throw new AppError('This lesson has no video questions', ErrorCodes.VIDEO_CHECKPOINT_NOT_FOUND, 404);
  }

  return buildVideoCheckpointResultsCsv(results);
}
