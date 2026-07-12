import { lessonApi } from '$features/course/api';
import { isHtmlValueEmpty } from '$lib/utils/functions/toHtml';
import { isEnforceableLessonVideo, type LessonVideo } from '../video/video-card-utils';

export function hasUploadedLessonVideo(videos: LessonVideo[] | null | undefined): boolean {
  return (videos ?? []).some((video) => isEnforceableLessonVideo(video));
}

export function hasLessonNoteContentForLesson(lessonId: string): boolean {
  const rawNote = lessonApi.lesson?.note;
  const hasLegacyNote = typeof rawNote === 'string' && rawNote.trim().length > 0;

  if (hasLegacyNote) {
    return true;
  }

  const translations = Object.values(lessonApi.translations[lessonId] || {});

  return translations.some((content) => typeof content === 'string' && !isHtmlValueEmpty(content));
}

export function buildLessonSummarizePrompt(lessonId: string): string {
  const videos = lessonApi.lesson?.videos ?? [];
  const hasUploadedVideo = hasUploadedLessonVideo(videos);
  const hasLessonNotes = hasLessonNoteContentForLesson(lessonId);

  if (!hasUploadedVideo) {
    return 'Summarize what has been taught in this lesson.';
  }

  if (hasLessonNotes) {
    return 'Look at the transcript of the uploaded video and summarize what is mentioned in the transcript. Also summarize what is covered in the lesson notes.';
  }

  return 'Look at the transcript of the uploaded video and summarize what is mentioned in the transcript.';
}
