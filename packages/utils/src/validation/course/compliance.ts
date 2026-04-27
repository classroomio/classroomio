import { z } from 'zod';

export const ZCourseComplianceParam = z.object({
  courseId: z.string().uuid()
});

export type TCourseComplianceParam = z.infer<typeof ZCourseComplianceParam>;

export const ZCourseComplianceLearnerParam = ZCourseComplianceParam.extend({
  profileId: z.string().uuid()
});

export type TCourseComplianceLearnerParam = z.infer<typeof ZCourseComplianceLearnerParam>;

const ZOptionalProfileIds = z.array(z.string().uuid()).min(1).optional();

export const ZCourseComplianceReset = z.object({
  profileIds: ZOptionalProfileIds,
  dueDate: z.string().datetime()
});

export type TCourseComplianceReset = z.infer<typeof ZCourseComplianceReset>;

export const ZCourseComplianceExtend = z.object({
  profileIds: ZOptionalProfileIds,
  dueDate: z.string().datetime()
});

export type TCourseComplianceExtend = z.infer<typeof ZCourseComplianceExtend>;

export const ZCourseComplianceWaive = z.object({
  profileIds: ZOptionalProfileIds,
  waiverReason: z.string().trim().min(1).max(1000).optional(),
  waiverExpiresAt: z.string().datetime().optional()
});

export type TCourseComplianceWaive = z.infer<typeof ZCourseComplianceWaive>;
