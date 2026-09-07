/**
 * Caption language keys.
 *
 * `youtube_caption` is uniquely keyed on `(youtube_video_id, language)`, so the
 * language used to *read* the cache must be byte-identical to the one used to
 * *write* it. Provider responses report regional tags (`en-US`) while callers
 * request base tags (`en`), so every key passes through
 * `normalizeCaptionLanguage` first — otherwise a written row never matches the
 * next lookup and every request re-bills the provider.
 */

const DEFAULT_LANGUAGE = 'en';
const MAX_LANGUAGE_LENGTH = 8; // youtube_caption.language is varchar(8)

/**
 * Sentinel language for cache rows that describe the **video**, not one
 * language of it (`no_captions`, `private`, `disabled`). Fits `varchar(8)` and
 * can never collide with a real BCP-47 subtag.
 */
export const VIDEO_LEVEL_LANGUAGE_KEY = '*';

/** Unavailability reasons that are properties of the video rather than of one language. */
const VIDEO_LEVEL_UNAVAILABLE_REASONS = new Set(['no_captions', 'private', 'disabled']);

export function isVideoLevelUnavailableReason(reason: string): boolean {
  return VIDEO_LEVEL_UNAVAILABLE_REASONS.has(reason);
}

/**
 * Reduce a language tag to the cache key form: lowercase base subtag, no region.
 * `en-US` → `en`, `EN` → `en`, `pt_BR` → `pt`, anything unusable → `en`.
 */
export function normalizeCaptionLanguage(value: string | null | undefined): string {
  if (!value) {
    return DEFAULT_LANGUAGE;
  }

  const baseSubtag = value.trim().toLowerCase().split(/[-_]/)[0] ?? '';
  const lettersOnly = baseSubtag.replace(/[^a-z]/g, '');

  if (!lettersOnly) {
    return DEFAULT_LANGUAGE;
  }

  return lettersOnly.slice(0, MAX_LANGUAGE_LENGTH);
}

/**
 * Pick the single language a caption request will be billed for. Only one
 * provider call is ever made, so only the first preference is honored.
 */
export function resolveRequestLanguage(preferredLanguages?: string[]): string {
  return normalizeCaptionLanguage(preferredLanguages?.[0]);
}
