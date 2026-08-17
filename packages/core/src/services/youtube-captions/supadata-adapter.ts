import type { YoutubeCaptionAdapter, YoutubeCaptionFetchResult } from './types';

/**
 * Supadata adapter for fetching YouTube native captions.
 *
 * Uses the `@supadata/js` SDK to retrieve creator-uploaded or auto-generated
 * caption tracks from YouTube videos.
 *
 * SDK response shape:
 * ```json
 * {
 *   "lang": "en",
 *   "availableLangs": ["en"],
 *   "content": [{ "lang": "en", "text": "...", "offset": 80, "duration": 5120 }]
 * }
 * ```
 * `offset` and `duration` are in **milliseconds** — we convert to seconds.
 */
export class SupadataAdapter implements YoutubeCaptionAdapter {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async fetchNativeCaptions(input: {
    youtubeVideoId: string;
    canonicalUrl: string;
    preferredLanguages: string[];
  }): Promise<YoutubeCaptionFetchResult | { unavailable: true; reason: string }> {
    const { youtubeVideoId, canonicalUrl, preferredLanguages } = input;

    const languagesToTry = preferredLanguages.length > 0 ? preferredLanguages : ['en'];

    for (const lang of languagesToTry) {
      const result = await this.fetchCaptionsForLanguage(youtubeVideoId, canonicalUrl, lang);
      if (!('unavailable' in result)) {
        return result;
      }
    }

    if (languagesToTry.length > 1) {
      const fallbackResult = await this.fetchCaptionsForLanguage(youtubeVideoId, canonicalUrl);
      if (!('unavailable' in fallbackResult)) {
        return fallbackResult;
      }
    }

    const lastResult = await this.fetchCaptionsForLanguage(youtubeVideoId, canonicalUrl, languagesToTry[0]);
    return lastResult;
  }

  private async fetchCaptionsForLanguage(
    youtubeVideoId: string,
    canonicalUrl: string,
    lang?: string
  ): Promise<YoutubeCaptionFetchResult | { unavailable: true; reason: string }> {
    try {
      const { Supadata } = await import('@supadata/js');
      const supadata = new Supadata({ apiKey: this.apiKey });

      const requestParams = {
        url: canonicalUrl,
        text: false,
        mode: 'native' as const,
        ...(lang ? { lang } : {})
      };

      const response = (await supadata.transcript(requestParams)) as {
        error?: { code?: string; message?: string };
        lang?: string;
        availableLangs?: string[];
        content?: Array<{ lang?: string; text: string; offset: number; duration: number }>;
      } | null;

      if (!response || typeof response !== 'object') {
        return { unavailable: true, reason: 'invalid_response' };
      }

      if ('error' in response && response.error) {
        const code = response.error.code ?? '';
        const message = response.error.message ?? '';

        if (code === 'NOT_FOUND' || message.toLowerCase().includes('not found')) {
          return { unavailable: true, reason: 'not_found' };
        }
        if (code === 'PRIVATE' || message.toLowerCase().includes('private')) {
          return { unavailable: true, reason: 'private' };
        }
        if (code === 'NO_CAPTIONS' || message.toLowerCase().includes('no captions')) {
          return { unavailable: true, reason: 'no_captions' };
        }
        if (code === 'DISABLED' || message.toLowerCase().includes('disabled')) {
          return { unavailable: true, reason: 'disabled' };
        }

        return { unavailable: true, reason: 'other' };
      }

      const content = response.content;
      if (!content || content.length === 0) {
        return { unavailable: true, reason: 'no_captions' };
      }

      const normalizedSegments = content
        .filter((item) => item.text?.trim())
        .map((item) => ({
          start: typeof item.offset === 'number' ? item.offset / 1000 : 0,
          end:
            typeof item.offset === 'number' && typeof item.duration === 'number'
              ? (item.offset + item.duration) / 1000
              : 0,
          text: item.text.trim()
        }));

      if (normalizedSegments.length === 0) {
        return { unavailable: true, reason: 'no_captions' };
      }

      const fullText = normalizedSegments
        .map((seg) => seg.text)
        .join(' ')
        .trim();

      if (!fullText) {
        return { unavailable: true, reason: 'no_captions' };
      }

      const language = response.lang ?? lang ?? content[0]?.lang ?? 'en';

      return {
        youtubeVideoId,
        language,
        isGenerated: false,
        text: fullText,
        segments: normalizedSegments,
        provider: 'supadata',
        sourceTrackKind: 'unknown'
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);

      if (message.includes('404') || message.toLowerCase().includes('not found')) {
        return { unavailable: true, reason: 'not_found' };
      }
      if (message.toLowerCase().includes('private')) {
        return { unavailable: true, reason: 'private' };
      }
      if (message.toLowerCase().includes('captions') && message.toLowerCase().includes('disabled')) {
        return { unavailable: true, reason: 'disabled' };
      }

      throw error;
    }
  }
}
