/**
 * `bannerImage` is the canonical course image; `logo` is the deprecated column
 * it replaced. Rows written before the rename have only `logo` until the
 * backfill runs, so every read resolves through here rather than assuming the
 * backfill has already happened.
 */
export function resolveCourseBannerImage(course: { bannerImage?: string | null; logo?: string | null }): string | null {
  return course.bannerImage || course.logo || null;
}
