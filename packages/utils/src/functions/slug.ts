export const SLUG_FALLBACK = 'item';
export const FILENAME_SLUG_MAX_LENGTH = 60;
export const FILENAME_SLUG_FALLBACK = 'certificate';

export type GenerateSlugOptions = {
  fallback?: string;
  appendTimestamp?: boolean;
  now?: number;
};

export function generateSlug(source: string | null | undefined, options: GenerateSlugOptions = {}): string {
  const { fallback = SLUG_FALLBACK, appendTimestamp = false, now = Date.now() } = options;

  const base =
    (source ?? fallback)
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '') || fallback;

  return appendTimestamp ? `${base}-${now}` : base;
}

/**
 * Sanitize a free-form title for use in a `Content-Disposition` filename
 * (e.g. `certificate-${slugifyForFilename(courseName)}.pdf`).
 * Kebab-case, ASCII-only, capped to keep headers short.
 */
export function slugifyForFilename(value: string, maxLength: number = FILENAME_SLUG_MAX_LENGTH): string {
  const slug = value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, maxLength)
    .replace(/-+$/g, '');

  return slug || FILENAME_SLUG_FALLBACK;
}

/** Longest slug the path update API accepts (`ZUpdateLearningPath`). */
export const MAX_PATH_SLUG_LENGTH = 255;

/**
 * Mints a unique public slug for a learning path. Truncates the source first
 * because `generateSlug` appends `-{Date.now()}` without shortening it: a
 * 255-char name would otherwise produce a slug the update API rejects.
 */
export function generatePathSlug(name: string): string {
  const timestampSuffixLength = String(Date.now()).length + 1;
  const slugSource = name.slice(0, MAX_PATH_SLUG_LENGTH - timestampSuffixLength);

  return generateSlug(slugSource, { appendTimestamp: true });
}
