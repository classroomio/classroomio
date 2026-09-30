import * as z from 'zod';

export const ZPublicApiLearningPathsQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().optional()
});
export type TPublicApiLearningPathsQuery = z.infer<typeof ZPublicApiLearningPathsQuery>;

export const ZPublicApiLearningPathParam = z.object({
  pathId: z.string().uuid()
});
export type TPublicApiLearningPathParam = z.infer<typeof ZPublicApiLearningPathParam>;

export const ZPublicApiCreateLearningPath = z.object({
  name: z.string().trim().min(1, 'Name is required').max(255),
  description: z.string().trim().min(1, 'Description is required').max(5000),
  cost: z.number().int().min(0).optional()
});
export type TPublicApiCreateLearningPath = z.infer<typeof ZPublicApiCreateLearningPath>;

export const ZPublicApiUpdateLearningPath = z.object({
  name: z.string().trim().min(1).max(255).optional(),
  description: z.string().trim().min(1).max(5000).optional(),
  cost: z.number().int().min(0).optional(),
  sequentialUnlock: z.boolean().optional(),
  selfEnrollment: z.boolean().optional(),
  autoEnroll: z.boolean().optional()
});
export type TPublicApiUpdateLearningPath = z.infer<typeof ZPublicApiUpdateLearningPath>;

export const ZPublicApiReorderPathCourses = z.object({
  courseIds: z.array(z.string().uuid()).min(1)
});
export type TPublicApiReorderPathCourses = z.infer<typeof ZPublicApiReorderPathCourses>;

export const ZPublicApiLearningPathCourseParam = z.object({
  pathId: z.string().uuid(),
  courseId: z.string().uuid()
});
export type TPublicApiLearningPathCourseParam = z.infer<typeof ZPublicApiLearningPathCourseParam>;
