import { lessonApi } from '$features/course/api';
import type { Lesson } from '$features/course/utils/types';

type LessonVideo = NonNullable<Lesson['videos']>[number];
type LessonDocument = NonNullable<Lesson['documents']>[number];
type PickHandler<T> = (items: T[]) => void;

let videoHandler: PickHandler<LessonVideo> | null = null;
let documentHandler: PickHandler<LessonDocument> | null = null;

/**
 * Routes videos the add-video modal produces to `handler` instead of the lesson's video list.
 * @returns a function that stops capturing.
 */
export function captureLessonVideoPicks(handler: PickHandler<LessonVideo>): () => void {
  videoHandler = handler;

  return () => {
    if (videoHandler === handler) videoHandler = null;
  };
}

/**
 * Routes documents the add-document modal produces to `handler` instead of the lesson's document list.
 * @returns a function that stops capturing.
 */
export function captureLessonDocumentPicks(handler: PickHandler<LessonDocument>): () => void {
  documentHandler = handler;

  return () => {
    if (documentHandler === handler) documentHandler = null;
  };
}

export function addLessonVideos(videos: LessonVideo[]): void {
  if (videos.length === 0) return;

  if (videoHandler) {
    videoHandler(videos);
    return;
  }

  lessonApi.updateLessonState('videos', videos, { append: true });
}

export function addLessonDocuments(documents: LessonDocument[]): void {
  if (documents.length === 0) return;

  if (documentHandler) {
    documentHandler(documents);
    return;
  }

  lessonApi.updateLessonState('documents', documents, { append: true });
}
