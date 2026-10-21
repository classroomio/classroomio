import { generateSlug } from '@cio/utils/functions';

/** Longest slug the path update API accepts (`ZUpdateLearningPath`). */
export const MAX_PATH_SLUG_LENGTH = 255;

/**
 * Mints a unique public slug for a path. Truncates the source first because
 * `generateSlug` appends `-{Date.now()}` without shortening it: a 255-char
 * name would otherwise produce a slug the update API rejects.
 */
export function generatePathSlug(name: string): string {
  const timestampSuffixLength = String(Date.now()).length + 1;
  const slugSource = name.slice(0, MAX_PATH_SLUG_LENGTH - timestampSuffixLength);

  return generateSlug(slugSource, { appendTimestamp: true });
}
