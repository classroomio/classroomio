import * as z from 'zod';

export const LEARNING_PATH_STATUSES = ['ACTIVE', 'DRAFT', 'ARCHIVED'] as const;
export type TLearningPathStatusValue = (typeof LEARNING_PATH_STATUSES)[number];

export const ZLearningPathParam = z.object({
  pathId: z.string().uuid()
});

export const ZLearningPathCourseParam = z.object({
  pathId: z.string().uuid(),
  courseId: z.string().uuid()
});

export const ZLearningPathMemberParam = z.object({
  pathId: z.string().uuid(),
  memberId: z.string().uuid()
});

export const ZCreateLearningPath = z.object({
  name: z.string().trim().min(1).max(255),
  description: z.string().max(5000).optional()
});
export type TCreateLearningPath = z.infer<typeof ZCreateLearningPath>;

export const ZUpdateLearningPath = z
  .object({
    name: z.string().trim().min(1).max(255).optional(),
    description: z.string().max(5000).nullable().optional(),
    coverImage: z.string().url().nullable().optional(),
    status: z.enum(LEARNING_PATH_STATUSES).optional(),
    sequentialUnlock: z.boolean().optional(),
    selfEnrollment: z.boolean().optional(),
    autoEnroll: z.boolean().optional()
  })
  .refine((data) => Object.keys(data).length > 0, { message: 'No fields to update' });
export type TUpdateLearningPath = z.infer<typeof ZUpdateLearningPath>;

export const ZAddLearningPathCourse = z.object({
  courseId: z.string().uuid()
});
export type TAddLearningPathCourse = z.infer<typeof ZAddLearningPathCourse>;

export const ZReorderLearningPathCourses = z.object({
  courseIds: z
    .array(z.string().uuid())
    .min(1)
    .refine((ids) => new Set(ids).size === ids.length, { message: 'Course ids must be unique' })
});
export type TReorderLearningPathCourses = z.infer<typeof ZReorderLearningPathCourses>;

export const ZAddLearningPathMembers = z.object({
  emails: z
    .array(z.string().trim().toLowerCase().email())
    .min(1)
    .max(200)
    .refine((emails) => new Set(emails).size === emails.length, { message: 'Emails must be unique' })
});
export type TAddLearningPathMembers = z.infer<typeof ZAddLearningPathMembers>;
