import * as z from 'zod';

export const ZPublicApiSetFeaturedCourses = z.object({
  courseIds: z
    .array(z.string().uuid())
    .max(4)
    .refine((ids) => new Set(ids).size === ids.length, { message: 'Course ids must be unique' })
    .describe(
      'Published courses to show first, in this order (at most 4). Replaces the current list; an empty array clears it, so courses show newest first'
    )
});
export type TPublicApiSetFeaturedCourses = z.infer<typeof ZPublicApiSetFeaturedCourses>;
