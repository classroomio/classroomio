import * as z from 'zod';

import { ZCourseSlug, ZSlug } from '../shared/slug';

/**
 * Route params + query schemas for the anonymous, SEO-indexable public course
 * surface under `(org-site)/course/[courseSlug]`.
 */

export const ZPublicCourseBySlugParam = z.object({
  courseSlug: ZCourseSlug
});
export type TPublicCourseBySlugParam = z.infer<typeof ZPublicCourseBySlugParam>;

export const ZPublicCourseItemParam = z.object({
  courseSlug: ZCourseSlug,
  itemSlug: ZSlug
});
export type TPublicCourseItemParam = z.infer<typeof ZPublicCourseItemParam>;
