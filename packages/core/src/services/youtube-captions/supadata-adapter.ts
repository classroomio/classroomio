import type { Transcript, TranscriptChunk, TranscriptOrJobId } from '@supadata/js';

import type { YoutubeCaptionAdapter, YoutubeCaptionFetchResult, YoutubeCaptionUnavailable } from './types';

/**
 * Supadata adapter for fetching YouTube native captions.
 *
 * `supadata.transcript()` returns `Transcript | JobId`; long videos come back as
 * `{ jobId }` and are polled via `getJobStatus()`. Failures arrive as a thrown
 * `SupadataError`, never as a property on the result.
 *
 * Exactly one provider call is made per invocation: Supadata bills per request,
 * so trying several languages would multiply the cost of one caption fetch.
 */
export class SupadataAdapter implements YoutubeCaptionAdapter {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async fetchNativeCaptions(input: {
    youtubeVideoId: string;
    canonicalUrl: string;
    language: string;
  }): Promise<YoutubeCaptionFetchResult | YoutubeCaptionUnavailable> {
    const { youtubeVideoId, canonicalUrl, language } = input;

    return this.fetchCaptionsForLanguage(youtubeVideoId, canonicalUrl, language);
  }

  private async fetchCaptionsForLanguage(
    youtubeVideoId: string,
    canonicalUrl: string,
    requestedLanguage: string
  ): Promise<YoutubeCaptionFetchResult | YoutubeCaptionUnavailable> {
    const { Supadata, SupadataError } = await import('@supadata/js');
    const supadata = new Supadata({ apiKey: this.apiKey });

    let transcript: Transcript;

    try {
      const response: TranscriptOrJobId = await supadata.transcript({
        url: canonicalUrl,
        text: false,
        mode: 'native' as const,
        lang: requestedLanguage
      });

      if ('jobId' in response) {
        const jobResult = await supadata.transcript.getJobStatus(response.jobId);

        if (jobResult.status === 'failed') {
          return { unavailable: true, reason: 'provider_error' };
        }

        if (jobResult.status !== 'completed' || !jobResult.result) {
          return { unavailable: true, reason: 'async_pending' };
        }

        transcript = jobResult.result;
      } else {
        transcript = response;
      }
    } catch (error) {
      if (error instanceof SupadataError) {
        return this.toUnavailableOrRethrow(error);
      }

      throw error;
    }

    const segments = normalizeSegments(transcript.content);
    if (segments.length === 0) {
      return { unavailable: true, reason: 'no_captions' };
    }

    const text = segments
      .map((segment) => segment.text)
      .join(' ')
      .trim();

    if (!text) {
      return { unavailable: true, reason: 'no_captions' };
    }

    return {
      youtubeVideoId,
      language: transcript.lang ?? requestedLanguage,
      isGenerated: false,
      text,
      segments,
      provider: 'supadata',
      sourceTrackKind: 'unknown'
    };
  }

  private toUnavailableOrRethrow(error: { error: string }): YoutubeCaptionUnavailable {
    const reason = captionReasonForSupadataError(error.error);

    if (!reason) {
      throw error;
    }

    return { unavailable: true, reason };
  }
}

/**
 * Map a `SupadataError.error` code to a cacheable unavailability reason, or
 * `null` when the job should rethrow and retry.
 *
 * Getting this wrong costs money in both directions: a terminal failure that
 * rethrows is re-billed on every BullMQ retry, and a transient failure that
 * gets cached hides a broken API key behind "this video has no captions" for
 * the whole negative-cache TTL.
 */
export function captionReasonForSupadataError(code: string): string | null {
  switch (code) {
    case 'transcript-unavailable':
      return 'no_captions';
    case 'not-found':
      return 'not_found';
    case 'invalid-request':
      return 'other';
    // internal-error, limit-exceeded, unauthorized, upgrade-required
    default:
      return null;
  }
}

/** `content` is `TranscriptChunk[]` when `text: false`, but the SDK also allows a plain string. */
function normalizeSegments(content: Transcript['content']): Array<{ start: number; end: number; text: string }> {
  if (typeof content === 'string') {
    const text = content.trim();

    return text ? [{ start: 0, end: 0, text }] : [];
  }

  return content
    .filter((chunk: TranscriptChunk) => Boolean(chunk.text?.trim()))
    .map((chunk: TranscriptChunk) => ({
      start: typeof chunk.offset === 'number' ? chunk.offset / 1000 : 0,
      end:
        typeof chunk.offset === 'number' && typeof chunk.duration === 'number'
          ? (chunk.offset + chunk.duration) / 1000
          : 0,
      text: chunk.text.trim()
    }));
}
