import { enrichObjectsWithUrls, extractKeysFromObjects } from '@api/utils/presigned-urls';
import { generateDocumentDownloadPresignedUrls, generateVideoDownloadPresignedUrls } from '@api/utils/s3';

import type { LessonById } from '@cio/db/queries/lesson';
import type { TLesson } from '@cio/db/types';

// Extract types from schema
type LessonVideo = NonNullable<TLesson['videos']>[number];
type LessonDocument = NonNullable<TLesson['documents']>[number];

/**
 * Enriches lesson with presigned URLs for videos and documents
 * @param lesson Lesson to enrich
 * @returns Lesson with presigned URLs added
 */
export async function enrichLessonWithPresignedUrls(lesson: LessonById): Promise<LessonById> {
  // videos and documents are jsonb fields from the database, now properly typed
  // Normalize them to arrays safely (handles null/undefined cases)
  const videos = lesson.videos || [];
  const documents = lesson.documents || [];

  const videoKeys = extractKeysFromObjects(videos.filter((video) => video.type === 'upload'));
  const docKeys = extractKeysFromObjects(documents);

  // Early return if no keys to process
  if (videoKeys.length === 0 && docKeys.length === 0) {
    return lesson;
  }

  // Generate presigned URLs in parallel
  const [videoUrls, docUrls] = await Promise.all([
    generateVideoDownloadPresignedUrls(videoKeys),
    generateDocumentDownloadPresignedUrls(docKeys)
  ]);

  return {
    ...lesson,
    videos: enrichObjectsWithUrls<LessonVideo>(videos, videoUrls),
    documents: enrichObjectsWithUrls<LessonDocument>(documents, docUrls)
  };
}
