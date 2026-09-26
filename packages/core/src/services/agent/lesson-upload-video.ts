import { AppError, ErrorCodes } from '@cio/utils/errors';

import { attachAssetService, createAssetFromUploadService } from '../assets/assets';
import { getLesson, updateLessonService } from '../lesson/lesson';
import { generateVideoDownloadPresignedUrls } from '../../utils/s3';
import { readOrganizationIdFromFileKey } from '../../utils/upload';

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

/**
 * Attach an uploaded (already-in-storage) video to a lesson. `updateLessonService`
 * fully replaces the `videos` column on write — there's no merge at that layer —
 * so this reads the lesson's current videos and writes the whole array back with
 * the new entry appended, same as the YouTube attach path.
 */
export async function attachUploadedVideoToLesson(
  input: AttachUploadedVideoToLessonInput
): Promise<AttachUploadedVideoToLessonResult> {
  const { orgId, actorId, courseId, lessonId, fileKey, fileName, fileType, fileSize } = input;

  const fileKeyOrgId = readOrganizationIdFromFileKey(fileKey);
  if (fileKeyOrgId !== orgId) {
    throw new AppError('Storage key does not belong to this organization', ErrorCodes.FORBIDDEN, 403);
  }

  const signedUrls = await generateVideoDownloadPresignedUrls([fileKey]);
  const downloadUrl = signedUrls[fileKey];
  if (!downloadUrl) {
    throw new AppError('Uploaded video could not be signed for playback', ErrorCodes.VALIDATION_ERROR, 400);
  }

  const lesson = await getLesson(lessonId);
  if (lesson.courseId !== courseId) {
    throw new AppError('Lesson does not belong to this course', ErrorCodes.LESSON_NOT_FOUND, 404);
  }

  const lessonWithVideos = lesson as { id: string; title: string; videos?: LessonVideoEntry[] | null };
  const existingVideos = lessonWithVideos.videos ?? [];

  const asset = await createAssetFromUploadService(orgId, actorId, {
    kind: 'video',
    provider: 'upload',
    storageProvider: 's3',
    storageKey: fileKey,
    sourceUrl: downloadUrl,
    mimeType: fileType,
    byteSize: fileSize,
    title: fileName,
    isExternal: false
  });

  const position = existingVideos.length;

  await attachAssetService(orgId, asset.id, actorId, {
    targetType: 'lesson',
    targetId: lessonId,
    slotType: 'lesson_video',
    position
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
    lessonTitle: lessonWithVideos.title,
    assetId: asset.id,
    fileKey,
    position
  };
}
