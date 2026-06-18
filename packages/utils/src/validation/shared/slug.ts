import * as z from 'zod';

/**
 * Slug format used by public-course URLs (and shared by `lesson.slug` and `exercise.slug`).
 * Kebab-case, 1–80 chars, lowercase alphanumerics with single `-` separators, no leading/trailing dash.
 */
export const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const ZSlug = z
  .string()
  .min(1, { message: 'Slug is required' })
  .max(80, { message: 'Slug must be 80 characters or fewer' })
  .regex(SLUG_REGEX, {
    message: 'Slug must be lowercase letters, numbers, and single dashes'
  });
export type TSlug = z.infer<typeof ZSlug>;

/**
 * Course slugs are `slugify(title)` (capped at 80) plus a `-<timestamp>` uniqueness
 * suffix, so they routinely exceed the 80-char `ZSlug` cap. The `course.slug` column is
 * unbounded `varchar` and there's no technical reason to cap the URL, so don't.
 */
export const ZCourseSlug = z.string().min(1, { message: 'Slug is required' }).regex(SLUG_REGEX, {
  message: 'Slug must be lowercase letters, numbers, and single dashes'
});
export type TCourseSlug = z.infer<typeof ZCourseSlug>;

/**
 * Generate a kebab-case slug from a free-form title. Does not enforce uniqueness;
 * callers must resolve collisions against the target namespace (e.g. per-course).
 */
export function slugifyTitle(title: string): string {
  const normalized = title
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
    .replace(/-+$/g, '');

  return normalized || 'untitled';
}

/**
 * Resolve a slug against a list of already-taken slugs by appending `-2`, `-3`, ...
 * until a free value is found. Respects the 80-char cap by trimming the base slug
 * as needed to fit the suffix.
 */
export function resolveSlugCollision(baseSlug: string, takenSlugs: Iterable<string>): string {
  const taken = new Set(takenSlugs);

  if (!taken.has(baseSlug)) {
    return baseSlug;
  }

  let counter = 2;
  while (true) {
    const suffix = `-${counter}`;
    const trimmedBase = baseSlug.slice(0, 80 - suffix.length).replace(/-+$/g, '') || 'untitled';
    const candidate = `${trimmedBase}${suffix}`;
    if (!taken.has(candidate)) {
      return candidate;
    }
    counter += 1;
  }
}
