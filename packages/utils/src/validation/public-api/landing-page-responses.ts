import * as z from 'zod';

export const ZPublicApiFeaturedCoursesResponse = z.object({
  courseIds: z
    .array(z.string().uuid())
    .describe(
      'Featured course ids in display order. GET /courses returns each position as displayOrder, null when not featured.'
    )
});
