import { AppError, ErrorCodes } from '@api/utils/errors';
import { getStorageConfig } from '@api/config/storage';
import { generateVideoDownloadPresignedUrls, generateVideoUploadPresignedUrl } from '@api/utils/s3';
import { createAsset, getAssetById, updateAsset } from '@cio/db/queries/assets';
import { getExerciseWithRelationsOptimized } from '@cio/db/queries/exercise';
import { getQuestionAnswersBySubmissionId, getSubmissionById } from '@cio/db/queries/submission';
import { getGroupMemberIdByCourseAndProfile, isCourseTeamMemberOrOrgAdmin } from '@cio/db/queries/group';
import { getCourseOrganizationId as getCourseOrganizationIdFromDb } from '@cio/db/queries/tag';
import { randomUUID } from 'node:crypto';
import type { VideoRecordingAnswerData } from '@cio/question-types';
import {
  QUESTION_TYPE_IDS,
  VIDEO_RECORDING_MIN_DURATION_SECONDS,
  getVideoRecordingMaxDurationSeconds
} from '@cio/question-types';
import type {
  TExerciseVideoRecordingUploadComplete,
  TExerciseVideoRecordingUploadInit
} from '@cio/utils/validation/exercise';

type RecordingContext = {
  organizationId: string;
  groupMemberId: string;
  maxDurationSeconds: number;
};

function getExtensionFromMimeType(mimeType: string): string {
  if (mimeType.includes('mp4')) return 'mp4';
  if (mimeType.includes('quicktime')) return 'mov';
  return 'webm';
}

async function getCourseOrganizationIdResolved(courseId: string): Promise<string> {
  const organizationId = await getCourseOrganizationIdFromDb(courseId);

  if (!organizationId) {
    throw new AppError('Course organization not found', ErrorCodes.NOT_FOUND, 404);
  }

  return organizationId;
}

async function getRecordingContext(
  courseId: string,
  exerciseId: string,
  questionId: number,
  profileId: string
): Promise<RecordingContext> {
  const [organizationId, groupMemberId, exerciseWithRelations] = await Promise.all([
    getCourseOrganizationIdResolved(courseId),
    getGroupMemberIdByCourseAndProfile(courseId, profileId),
    getExerciseWithRelationsOptimized(exerciseId)
  ]);

  if (!groupMemberId) {
    throw new AppError('User is not a member of this course', ErrorCodes.UNAUTHORIZED, 403);
  }

  const question = exerciseWithRelations.questions.find((item) => item.id === questionId);
  if (!question) {
    throw new AppError('Question not found for this exercise', ErrorCodes.NOT_FOUND, 404);
  }

  if (question.questionTypeId !== QUESTION_TYPE_IDS.VIDEO_RECORDING) {
    throw new AppError('Question is not a video recording question', ErrorCodes.VALIDATION_ERROR, 400);
  }

  return {
    organizationId,
    groupMemberId,
    maxDurationSeconds: getVideoRecordingMaxDurationSeconds(question.settings as Record<string, unknown> | null)
  };
}

export async function initVideoRecordingUpload(
  courseId: string,
  exerciseId: string,
  questionId: number,
  profileId: string,
  input: TExerciseVideoRecordingUploadInit
) {
  const context = await getRecordingContext(courseId, exerciseId, questionId, profileId);
  const extension = getExtensionFromMimeType(input.mimeType);
  const storageKey = [
    'exercise-recordings',
    context.organizationId,
    courseId,
    exerciseId,
    String(questionId),
    context.groupMemberId,
    `${randomUUID()}.${extension}`
  ].join('/');

  const asset = await createAsset({
    organizationId: context.organizationId,
    kind: 'video',
    provider: 'upload',
    storageProvider: 's3',
    storageKey,
    mimeType: input.mimeType,
    byteSize: input.size,
    title: input.fileName,
    status: 'pending',
    metadata: {
      source: 'exercise_video_recording',
      courseId,
      exerciseId,
      questionId,
      groupMemberId: context.groupMemberId,
      maxDurationSeconds: context.maxDurationSeconds
    },
    createdByProfileId: profileId
  });

  const uploadUrl = await generateVideoUploadPresignedUrl(storageKey, input.mimeType);
  const expiresAt = new Date(Date.now() + getStorageConfig().presignUploadExpiresSeconds * 1000).toISOString();

  return {
    assetId: asset.id,
    uploadUrl,
    storageKey,
    expiresAt
  };
}

export async function completeVideoRecordingUpload(
  courseId: string,
  exerciseId: string,
  questionId: number,
  profileId: string,
  input: TExerciseVideoRecordingUploadComplete
): Promise<VideoRecordingAnswerData> {
  const context = await getRecordingContext(courseId, exerciseId, questionId, profileId);
  if (input.durationSeconds < VIDEO_RECORDING_MIN_DURATION_SECONDS) {
    throw new AppError('Recording is too short', ErrorCodes.VALIDATION_ERROR, 400);
  }
  if (input.durationSeconds > context.maxDurationSeconds + 2) {
    throw new AppError('Recording exceeds the configured duration', ErrorCodes.VALIDATION_ERROR, 400);
  }

  const asset = await getAssetById(input.assetId, context.organizationId);
  if (!asset || asset.storageKey !== input.storageKey) {
    throw new AppError('Recording asset not found', ErrorCodes.NOT_FOUND, 404);
  }

  const uploadedAt = new Date().toISOString();

  await updateAsset(input.assetId, context.organizationId, {
    status: 'active',
    storageKey: input.storageKey,
    mimeType: input.mimeType,
    byteSize: input.size,
    title: input.fileName,
    durationSeconds: Math.ceil(input.durationSeconds),
    metadata: {
      ...(asset.metadata && typeof asset.metadata === 'object' && !Array.isArray(asset.metadata) ? asset.metadata : {}),
      recordedAt: input.recordedAt,
      uploadedAt,
      retakeCount: input.retakeCount ?? 0
    }
  });

  return {
    type: 'VIDEO_RECORDING',
    assetId: input.assetId,
    storageKey: input.storageKey,
    fileName: input.fileName,
    mimeType: input.mimeType,
    size: input.size,
    durationSeconds: Math.ceil(input.durationSeconds),
    recordedAt: input.recordedAt,
    uploadedAt,
    provider: 'cloudflare',
    retakeCount: input.retakeCount ?? 0
  };
}

export async function getVideoRecordingPlaybackUrl(
  courseId: string,
  exerciseId: string,
  submissionId: string,
  questionId: number,
  profileId: string
) {
  const [submission, groupMemberId, isReviewer] = await Promise.all([
    getSubmissionById(submissionId),
    getGroupMemberIdByCourseAndProfile(courseId, profileId),
    isCourseTeamMemberOrOrgAdmin(courseId, profileId)
  ]);

  if (!submission || submission.courseId !== courseId || submission.exerciseId !== exerciseId) {
    throw new AppError('Submission not found', ErrorCodes.NOT_FOUND, 404);
  }

  if (!isReviewer && (!groupMemberId || submission.submittedBy !== groupMemberId)) {
    throw new AppError('Unauthorized', ErrorCodes.UNAUTHORIZED, 403);
  }

  const answers = await getQuestionAnswersBySubmissionId(submissionId);
  const answer = answers.find((item) => item.questionId === questionId);
  const answerData = answer?.answerData;
  if (!answerData || answerData.type !== 'VIDEO_RECORDING') {
    throw new AppError('Video recording answer not found', ErrorCodes.NOT_FOUND, 404);
  }

  const urls = await generateVideoDownloadPresignedUrls([answerData.storageKey]);
  const playbackUrl = urls[answerData.storageKey];
  if (!playbackUrl) {
    throw new AppError('Video recording is unavailable', ErrorCodes.INTERNAL_ERROR, 500);
  }

  return {
    assetId: answerData.assetId,
    playbackUrl,
    expiresAt: new Date(Date.now() + getStorageConfig().presignDownloadExpiresSeconds * 1000).toISOString()
  };
}
