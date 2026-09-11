/**
 * `youtube_caption` is keyed on `(youtube_video_id, language)`, so the language
 * used to read the cache must be byte-identical to the one used to write it.
 * Providers report regional tags (`en-US`) while callers request base tags
 * (`en`); without normalizing both sides, a written row never matches the next
 * lookup and every request re-bills the provider.
 */

const DEFAULT_LANGUAGE = 'en';
const MAX_LANGUAGE_LENGTH = 8; // youtube_caption.language is varchar(8)

/** Cache key for rows describing the video rather than one language of it. */
export const VIDEO_LEVEL_LANGUAGE_KEY = '*';

const VIDEO_LEVEL_UNAVAILABLE_REASONS = new Set(['no_captions', 'private', 'disabled']);

export function isVideoLevelUnavailableReason(reason: string): boolean {
  return VIDEO_LEVEL_UNAVAILABLE_REASONS.has(reason);
}

/** `en-US` → `en`, `pt_BR` → `pt`, anything unusable → `en`. */
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

/** Only one provider call is ever made, so only the first preference is honored. */
export function resolveRequestLanguage(preferredLanguages?: string[]): string {
  return normalizeCaptionLanguage(preferredLanguages?.[0]);
}
