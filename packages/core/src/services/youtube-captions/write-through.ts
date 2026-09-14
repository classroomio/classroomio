import { upsertMediaTranscript } from '@cio/db/queries/media-transcript';
import { segmentsToWebVtt } from '@cio/utils/functions';
import type { YoutubeCaptionFetchResult } from './types';

/**
 * Write a successful YouTube caption fetch through to `media_transcript`
 * so the existing transcript panel, AI agent tools, and VTT caption track
 * all work for YouTube videos without any special-casing.
 *
 * Also generates and stores a VTT file in the media bucket so the transcript
 * panel can serve it via the existing `/transcripts/:assetId/track.vtt` endpoint.
 */
export async function writeYoutubeCaptionToMediaTranscript(input: {
  assetId: string;
  organizationId: string;
  captionResult: YoutubeCaptionFetchResult;
  uploadBufferToBucket: (
    bucket: string,
    key: string,
    buffer: Buffer,
    contentType: string,
    cacheControl?: string
  ) => Promise<void>;
  mediaBucket: () => string;
}): Promise<void> {
  const { assetId, organizationId, captionResult, uploadBufferToBucket, mediaBucket } = input;
  const { language, text, segments, youtubeVideoId } = captionResult;

  const vttBody = segmentsToWebVtt(segments);
  const vttKey = `transcripts/${assetId}/youtube-${youtubeVideoId}.vtt`;
  const bucket = mediaBucket();

  await uploadBufferToBucket(
    bucket,
    vttKey,
    Buffer.from(vttBody, 'utf8'),
    'text/vtt; charset=utf-8',
    'private, max-age=0'
  );

  await upsertMediaTranscript({
    organizationId,
    assetId,
    mediaJobId: null,
    language,
    provider: 'supadata',
    model: 'youtube-native',
    text,
    segments,
    vttStorageKey: vttKey,
    vttBucket: bucket,
    durationSeconds: null,
    costCents: 0
  });
}
