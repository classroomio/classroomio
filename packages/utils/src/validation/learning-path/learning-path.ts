import * as z from 'zod';

export const LEARNING_PATH_DIFFICULTY = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'] as const;
export type TLearningPathDifficultyValue = (typeof LEARNING_PATH_DIFFICULTY)[number];

export const LEARNING_PATH_MEMBER_STATUS = ['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED'] as const;
export type TLearningPathMemberStatusValue = (typeof LEARNING_PATH_MEMBER_STATUS)[number];

export const LEARNING_PATH_COURSE_STATUS = ['LOCKED', 'NOT_STARTED', 'IN_PROGRESS', 'COMPLETED'] as const;
export type TLearningPathCourseStatusValue = (typeof LEARNING_PATH_COURSE_STATUS)[number];

export const ZCreateLearningPath = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  description: z.string().min(1, 'Description is required').max(5000),
  organizationId: z.string().min(1)
});
export type TCreateLearningPath = z.infer<typeof ZCreateLearningPath>;

export const ZUpdateLearningPath = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().min(1).max(5000).optional(),
  coverImage: z.string().nullable().optional(),
  isPublished: z.boolean().optional(),
  difficulty: z.enum(LEARNING_PATH_DIFFICULTY).nullable().optional(),
  estimatedDurationMinutes: z.number().int().min(0).nullable().optional(),
  cost: z.number().int().min(0).optional(),
  currency: z.string().max(3).optional(),
  showSavings: z.boolean().optional(),
  sequentialUnlock: z.boolean().optional(),
  selfEnrollment: z.boolean().optional(),
  autoEnroll: z.boolean().optional(),
  certificateEnabled: z.boolean().optional(),
  certificateTitle: z.string().nullable().optional(),
  certificateIssuer: z.string().nullable().optional(),
  certificateDesign: z.record(z.string(), z.unknown()).optional(),
  landingPage: z.record(z.string(), z.unknown()).optional(),
  courseOrderSetAt: z.string().datetime().nullable().optional()
});
export type TUpdateLearningPath = z.infer<typeof ZUpdateLearningPath>;

export const ZAddLearningPathCourse = z
  .object({
    courseId: z.string().uuid().optional(),
    courseIds: z.array(z.string().uuid()).min(1).optional()
  })
  .refine((data) => Boolean(data.courseId || (data.courseIds && data.courseIds.length > 0)), {
    message: 'Must provide either courseId or courseIds'
  });
export type TAddLearningPathCourse = z.infer<typeof ZAddLearningPathCourse>;

export const ZUpdateLearningPathCourse = z.object({
  outcomes: z.array(z.string().trim()).optional()
});
export type TUpdateLearningPathCourse = z.infer<typeof ZUpdateLearningPathCourse>;

export const ZReorderLearningPathCourses = z.object({
  courseIds: z.array(z.string().uuid()).min(1)
});
export type TReorderLearningPathCourses = z.infer<typeof ZReorderLearningPathCourses>;

export const ZEnrollInLearningPath = z
  .object({
    paymentReference: z.string().optional()
  })
  .optional();
export type TEnrollInLearningPath = z.infer<typeof ZEnrollInLearningPath>;

export const ZAddLearningPathMembers = z.object({
  members: z
    .array(
      z.object({
        profileId: z.string().uuid().optional(),
        email: z.string().email().optional(),
        roleId: z.number().int()
      })
    )
    .min(1)
    .refine((members) => members.every((member) => member.profileId || member.email), {
      message: 'Each member must include a profileId or email'
    })
});
export type TAddLearningPathMembers = z.infer<typeof ZAddLearningPathMembers>;

export const ZPublicLearningPathQuery = z.object({
  organizationId: z.string().uuid()
});
export type TPublicLearningPathQuery = z.infer<typeof ZPublicLearningPathQuery>;

export const ZVerifyLearningPathCertificateParam = z.object({
  certificateId: z.string().min(1)
});
export type TVerifyLearningPathCertificateParam = z.infer<typeof ZVerifyLearningPathCertificateParam>;
