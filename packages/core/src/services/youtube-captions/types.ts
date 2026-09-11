export type YoutubeCaptionProvider = 'supadata' | 'manual' | 'unavailable';

export interface YoutubeCaptionFetchResult {
  youtubeVideoId: string;
  language: string;
  isGenerated: boolean;
  text: string;
  segments: Array<{ start: number; end: number; text: string }>;
  provider: YoutubeCaptionProvider;
  sourceTrackKind: 'manual' | 'asr' | 'unknown';
}

export interface YoutubeCaptionUnavailable {
  unavailable: true;
  reason: string;
}

/**
 * Billing context for a caption fetch. Required — every path that can reach the
 * provider must say who to charge, so an unmetered call fails to compile.
 *
 * `courseId` is nullable because asset creation and lesson attachment are two
 * separate client round-trips: the prefetch fires before any `asset_usages` row
 * exists, so there is genuinely no course to attribute yet. A `null` is written
 * as the nil-UUID sentinel, which is safe because `ai_token_usage.course_id`
 * carries no foreign key.
 */
export interface YoutubeCaptionBillingContext {
  organizationId: string;
  userId: string;
  courseId: string | null;
}

/**
 * `providerCalls` is how many billed provider requests this call made — `0` on
 * any cache hit or refusal. Preferred over a `cached` boolean because it stays
 * correct if a multi-attempt path is ever reintroduced.
 */
export type YoutubeCaptionOutcome = (YoutubeCaptionFetchResult | YoutubeCaptionUnavailable) & {
  providerCalls: number;
};

export interface YoutubeCaptionAdapter {
  fetchNativeCaptions(input: {
    youtubeVideoId: string;
    canonicalUrl: string;
    language: string;
  }): Promise<YoutubeCaptionFetchResult | YoutubeCaptionUnavailable>;
}
