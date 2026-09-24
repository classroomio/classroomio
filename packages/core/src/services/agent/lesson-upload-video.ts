import { AppError, ErrorCodes } from '@cio/utils/errors';
import { getAssetsByStorageKeys } from '@cio/db/queries/assets';
import { getLessonById } from '@cio/db/queries/lesson';

import { attachAssetService } from '../assets/assets';
import { updateLessonService } from '../lesson/lesson';

interface LessonVideoEntry {
  type: 'youtube' | 'vimeo' | 'generic' | 'upload' | 'google_drive';
  link: string;
  key?: string;
  assetId?: string;
  watchEnforced?: boolean;
  fileName?: string;
  metadata?: Record<string, unknown>;
}

export interface AttachUploadedVideoToLessonInput {
  orgId: string;
  actorId: string;
  courseId: string;
  lessonId: string;
  fileKey: string;
  downloadUrl: string;
  fileName: string;
  fileType: string;
  fileSize?: number;
}

export interface AttachUploadedVideoToLessonResult {
  lessonId: string;
  lessonTitle: string;
  assetId: string;
  fileKey: string;
  position: number;
}

export async function attachUploadedVideoToLesson(
  input: AttachUploadedVideoToLessonInput
): Promise<AttachUploadedVideoToLessonResult> {
  const { orgId, actorId, courseId, lessonId, fileKey, downloadUrl, fileName } = input;

  const lesson = await getLessonById(lessonId);
  if (!lesson || lesson.courseId !== courseId) {
    throw new AppError('Lesson not found', ErrorCodes.LESSON_NOT_FOUND, 404);
  }

  const existingVideos = (lesson.videos ?? []) as LessonVideoEntry[];
  const existingPosition = existingVideos.findIndex((video) => video.key === fileKey);
  if (existingPosition !== -1) {
    return {
      lessonId,
      lessonTitle: lesson.title,
      assetId: existingVideos[existingPosition]!.assetId ?? '',
      fileKey,
      position: existingPosition
    };
  }

  const [asset] = await getAssetsByStorageKeys(orgId, [fileKey]);
  if (!asset) {
    throw new AppError('This file does not belong to your organization', ErrorCodes.FORBIDDEN, 403);
  }

  const position = existingVideos.length;

  await attachAssetService(orgId, asset.id, actorId, {
    targetType: 'lesson',
    targetId: lessonId,
    slotType: 'lesson_video',
    position
  }).catch((error) => {
    const alreadyAttached = error instanceof AppError && error.code === ErrorCodes.ASSET_ALREADY_ATTACHED;
    if (!alreadyAttached) throw error;
  });

  const newVideo: LessonVideoEntry = {
    type: 'upload',
    link: downloadUrl,
    key: fileKey,
    assetId: asset.id,
    fileName,
    metadata: {
      fileName,
      createdAt: new Date().toISOString()
    }
  };

  await updateLessonService(lessonId, { videos: [...existingVideos, newVideo] });

  return {
    lessonId,
    lessonTitle: lesson.title,
    assetId: asset.id,
    fileKey,
    position
  };
}
