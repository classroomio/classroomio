import { AppError, ErrorCodes } from '@api/utils/errors';
import { getTakenItemSlugs } from '@cio/db/queries/course';
import { SLUG_REGEX, resolveSlugCollision, slugifyTitle } from '@cio/utils/validation';

/**
 * Resolve an item (lesson or exercise) slug for a given course:
 *  - If `requestedSlug` is provided, validate it and reject if already taken (excluding `ignoreItemId`).
 *  - Otherwise derive a slug from `title` and append `-2`, `-3`, ... until free.
 *
 * Uniqueness is enforced across the union of `lesson.slug` and `exercise.slug` per course.
 */
export async function resolveItemSlug(params: {
  courseId: string;
  title: string;
  requestedSlug?: string;
  ignoreItemSlug?: string;
}): Promise<string> {
  const { courseId, title, requestedSlug, ignoreItemSlug } = params;
  const takenSlugs = await getTakenItemSlugs(courseId);

  if (ignoreItemSlug) {
    takenSlugs.delete(ignoreItemSlug);
  }

  if (requestedSlug) {
    if (!SLUG_REGEX.test(requestedSlug)) {
      throw new AppError(
        'Slug must be lowercase letters, numbers, and single dashes',
        ErrorCodes.VALIDATION_ERROR,
        400,
        'slug'
      );
    }
    if (takenSlugs.has(requestedSlug)) {
      throw new AppError('Slug is already in use in this course', ErrorCodes.SLUG_IN_USE, 409, 'slug');
    }
    return requestedSlug;
  }

  const base = slugifyTitle(title);
  return resolveSlugCollision(base, takenSlugs);
}
