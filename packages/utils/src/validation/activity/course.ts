import * as z from 'zod';

export const ZActivityCoursesCreate = z.object({
  assetIds: z.array(z.string().uuid()).min(1).max(20),
  courseType: z.literal('SELF_PACED').default('SELF_PACED'),
  titles: z.record(z.string(), z.string().min(1).max(256)).optional()
});
export type TActivityCoursesCreate = z.infer<typeof ZActivityCoursesCreate>;
