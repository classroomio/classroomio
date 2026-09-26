import { attachAssetService, createAssetFromUploadService } from '../assets/assets';
import { getLesson, updateLessonService } from '../lesson/lesson';

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

/**
 * Attach an uploaded (already-in-storage) video to a lesson. `updateLessonService`
 * fully replaces the `videos` column on write — there's no merge at that layer —
 * so this reads the lesson's current videos and writes the whole array back with
 * the new entry appended, same as the YouTube attach path.
 */
export async function attachUploadedVideoToLesson(
  input: AttachUploadedVideoToLessonInput
): Promise<AttachUploadedVideoToLessonResult> {
  const { orgId, actorId, lessonId, fileKey, downloadUrl, fileName, fileType, fileSize } = input;

  const lesson = await getLesson(lessonId);
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
