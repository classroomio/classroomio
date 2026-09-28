import * as z from 'zod';

import { ROLE } from '@cio/utils/constants';

import { isAllowedHref } from '../shared';

import { ZLearningPathCertificateConfig } from './certificate';
import { ZLandingPage } from './landing-page';

export const LEARNING_PATH_MEMBER_STATUS = ['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED'] as const;
export type TLearningPathMemberStatusValue = (typeof LEARNING_PATH_MEMBER_STATUS)[number];

export const LEARNING_PATH_COURSE_STATUS = ['LOCKED', 'NOT_STARTED', 'IN_PROGRESS', 'COMPLETED'] as const;
export type TLearningPathCourseStatusValue = (typeof LEARNING_PATH_COURSE_STATUS)[number];

export const ZCreateLearningPath = z.object({
  name: z.string().trim().min(1, 'Name is required').max(255),
  description: z.string().trim().min(1, 'Description is required').max(5000),
  organizationId: z.string().min(1)
});
export type TCreateLearningPath = z.infer<typeof ZCreateLearningPath>;
export type TCreateLearningPathInput = Omit<TCreateLearningPath, 'organizationId'>;

export const ZUpdateLearningPath = z.object({
  name: z.string().trim().min(1).max(255).optional(),
  slug: z.string().min(1).max(255).optional(),
  description: z.string().trim().min(1).max(5000).optional(),
  coverImage: z
    .string()
    .max(2048)
    .refine((value) => !value || isAllowedHref(value), {
      message: 'URL scheme not allowed'
    })
    .nullable()
    .optional(),
  welcomeEmailMessage: z.string().max(20000).nullish(),
  isPublished: z.boolean().optional(),
  cost: z.number().int().min(0).optional(),
  currency: z.enum(['NGN', 'USD']).optional(),
  sequentialUnlock: z.boolean().optional(),
  selfEnrollment: z.boolean().optional(),
  autoEnroll: z.boolean().optional(),
  certificate: ZLearningPathCertificateConfig.optional(),
  landingPage: ZLandingPage.optional(),
  courseOrderSetAt: z.string().datetime().nullable().optional()
});
export type TUpdateLearningPath = z.infer<typeof ZUpdateLearningPath>;

export const ZAddLearningPathCourse = z
  .object({
    courseId: z.string().uuid().optional(),
    courseIds: z.array(z.string().uuid()).min(1).optional()
  })
  .refine((data) => Number(Boolean(data.courseId)) + Number(Boolean(data.courseIds?.length)) === 1, {
    message: 'Must provide exactly one of courseId or courseIds'
  });
export type TAddLearningPathCourse = z.infer<typeof ZAddLearningPathCourse>;

export const ZReorderLearningPathCourses = z.object({
  courseIds: z.array(z.string().uuid()).min(1)
});
export type TReorderLearningPathCourses = z.infer<typeof ZReorderLearningPathCourses>;

export const ZEnrollInLearningPath = z.object({}).optional();
export type TEnrollInLearningPath = z.infer<typeof ZEnrollInLearningPath>;

export const ZPathMembersQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED']).optional(),
  roleId: z.coerce.number().int().optional(),
  search: z.string().optional()
});
export type TPathMembersQuery = z.infer<typeof ZPathMembersQuery>;

/**
 * Member adds above this size run on the queue instead of in the request.
 * Mirrors `AUDIENCE_BULK_SYNC_MAX` for audience lifecycle actions.
 */
export const LEARNING_PATH_BULK_SYNC_MAX = 50;

export const ZGetLearningPathsQuery = z.object({
  organizationId: z.string().uuid(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional()
});
export type TGetLearningPathsQuery = z.infer<typeof ZGetLearningPathsQuery>;

export const ZAddLearningPathMembers = z.object({
  members: z
    .array(
      z.object({
        profileId: z.string().uuid().optional(),
        email: z.string().email().optional(),
        roleId: z.union([z.literal(ROLE.STUDENT), z.literal(ROLE.TUTOR)], {
          error: 'roleId must be STUDENT or TUTOR'
        })
      })
    )
    .min(1)
    .refine((members) => members.every((member) => Boolean(member.profileId) || Boolean(member.email)), {
      message: 'Each member must provide a profileId or email'
    })
});
export type TAddLearningPathMembers = z.infer<typeof ZAddLearningPathMembers>;

export const ZPublicLearningPathQuery = z.object({
  organizationId: z.string().uuid()
});
export type TPublicLearningPathQuery = z.infer<typeof ZPublicLearningPathQuery>;

export const ZPublicLearningPathsQuery = z.object({
  organizationId: z.string().uuid(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional()
});
export type TPublicLearningPathsQuery = z.infer<typeof ZPublicLearningPathsQuery>;

export const ZEnrolledLearningPathsQuery = z.object({
  organizationId: z.string().uuid().optional()
});
export type TEnrolledLearningPathsQuery = z.infer<typeof ZEnrolledLearningPathsQuery>;

export const ZVerifyLearningPathCertificateParam = z.object({
  certificateId: z.string().min(1)
});
export type TVerifyLearningPathCertificateParam = z.infer<typeof ZVerifyLearningPathCertificateParam>;

export const ZLearningPathIdParam = z.object({
  pathId: z.string().min(1)
});
export type TLearningPathIdParam = z.infer<typeof ZLearningPathIdParam>;

export const ZLearningPathCourseParam = z.object({
  pathId: z.string().min(1),
  courseId: z.string().uuid()
});
export type TLearningPathCourseParam = z.infer<typeof ZLearningPathCourseParam>;

export const ZLearningPathMemberParam = z.object({
  pathId: z.string().min(1),
  memberId: z.string().min(1)
});
export type TLearningPathMemberParam = z.infer<typeof ZLearningPathMemberParam>;

export const ZUpdateLearningPathMemberRole = z.object({
  roleId: z.union([z.literal(ROLE.STUDENT), z.literal(ROLE.TUTOR)], {
    error: 'roleId must be STUDENT or TUTOR'
  })
});
export type TUpdateLearningPathMemberRole = z.infer<typeof ZUpdateLearningPathMemberRole>;

export const ZLearningPathCertificateDownloadRequest = z.object({
  studentName: z.string().max(255).optional(),
  studentId: z.string().max(255).optional(),
  issuedAt: z.string().optional(),
  /** When true, skips the completion check (path team previewing their own design). */
  previewMode: z.boolean().optional()
});
export type TLearningPathCertificateDownloadRequest = z.infer<typeof ZLearningPathCertificateDownloadRequest>;
