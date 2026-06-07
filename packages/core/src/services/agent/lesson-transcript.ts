import { listMediaTranscriptsByAssetIds } from '@cio/db/queries/media-transcript';
import { getLesson } from '../lesson/lesson';

export interface LessonVideoTranscriptResult {
  lessonId: string;
  title: string;
  hasTranscript: boolean;
  transcript: string | null;
  message?: string;
}

/**
 * Assembles the transcript text for a lesson's uploaded video(s).
 *
 * Lesson `videos[]` carry an `assetId` for uploaded videos; the transcription
 * pipeline stores Whisper output in `media_transcript` keyed by that assetId.
 * YouTube/embedded links have no assetId and are never transcribed.
 */
export async function getLessonVideoTranscript(lessonId: string, orgId: string): Promise<LessonVideoTranscriptResult> {
  const lesson = await getLesson(lessonId);
  const lessonWithVideos = lesson as {
    id: string;
    title: string;
    videos?: Array<{ assetId?: string }> | null;
  };

  const assetIds = (lessonWithVideos.videos ?? [])
    .map((video) => video.assetId)
    .filter((assetId): assetId is string => typeof assetId === 'string' && assetId.length > 0);

  if (assetIds.length === 0) {
    return {
      lessonId: lesson.id,
      title: lesson.title,
      hasTranscript: false,
      transcript: null,
      message:
        'This lesson has no uploaded video with a transcript. Only uploaded videos are transcribed — embedded links (YouTube, Google Drive, etc.) are not.'
    };
  }

  const transcripts = await listMediaTranscriptsByAssetIds(assetIds, orgId);
  const transcript = transcripts
    .map((row) => row.text?.trim())
    .filter((text): text is string => Boolean(text))
    .join('\n\n');

  if (!transcript) {
    return {
      lessonId: lesson.id,
      title: lesson.title,
      hasTranscript: false,
      transcript: null,
      message:
        'This lesson has an uploaded video, but no transcript is available yet — transcription may still be processing.'
    };
  }

  return {
    lessonId: lesson.id,
    title: lesson.title,
    hasTranscript: true,
    transcript
  };
}
