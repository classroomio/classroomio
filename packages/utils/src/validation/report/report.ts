import * as z from 'zod';

export const CONTENT_REPORT_TARGET_TYPES = [
  'course_newsfeed_post',
  'course_newsfeed_comment',
  'cohort_newsfeed_post',
  'cohort_newsfeed_comment',
  'community_question',
  'community_answer',
  'lesson_comment',
  'profile'
] as const;

export const CONTENT_REPORT_REASONS = [
  'spam',
  'harassment',
  'hate_speech',
  'sexual_content',
  'violence',
  'misinformation',
  'privacy',
  'other'
] as const;

export const CONTENT_REPORT_STATUSES = ['open', 'in_review', 'actioned', 'dismissed'] as const;

export const CONTENT_REPORT_RESOLUTION_CODES = ['removed', 'warned', 'restricted', 'no_action', 'duplicate'] as const;

export const CONTENT_REPORT_DETAILS_MAX_LENGTH = 1000;

export const ZContentReportTargetType = z.enum(CONTENT_REPORT_TARGET_TYPES);
export const ZContentReportReason = z.enum(CONTENT_REPORT_REASONS);
export const ZContentReportStatus = z.enum(CONTENT_REPORT_STATUSES);
export const ZContentReportResolutionCode = z.enum(CONTENT_REPORT_RESOLUTION_CODES);

export const ZContentReportSnapshot = z.object({
  text: z.string(),
  title: z.string().nullable().optional(),
  authorId: z.string().nullable(),
  authorName: z.string().nullable(),
  surface: z.string(),
  url: z.string().nullable().optional(),
  capturedAt: z.string()
});

export const ZCreateContentReport = z.object({
  targetType: ZContentReportTargetType,
  targetId: z.string().trim().min(1).max(128),
  reason: ZContentReportReason,
  details: z
    .string()
    .trim()
    .max(CONTENT_REPORT_DETAILS_MAX_LENGTH)
    .optional()
    .transform((value) => (value ? value : undefined))
});

export const ZListContentReportsQuery = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  status: ZContentReportStatus.optional(),
  targetType: ZContentReportTargetType.optional(),
  orgId: z.string().uuid().optional(),
  reason: ZContentReportReason.optional()
});

export const ZContentReportIdParam = z.object({
  id: z.string().uuid()
});

export const ZUpdateContentReport = z
  .object({
    status: ZContentReportStatus.optional(),
    assignedTo: z.string().uuid().nullable().optional(),
    resolutionCode: ZContentReportResolutionCode.optional(),
    resolutionNote: z.string().trim().max(2000).optional()
  })
  .refine(
    (value) =>
      value.status !== undefined ||
      value.assignedTo !== undefined ||
      value.resolutionCode !== undefined ||
      value.resolutionNote !== undefined,
    { message: 'At least one field is required' }
  );

export type TContentReportTargetType = z.infer<typeof ZContentReportTargetType>;
export type TContentReportReason = z.infer<typeof ZContentReportReason>;
export type TContentReportStatus = z.infer<typeof ZContentReportStatus>;
export type TContentReportResolutionCode = z.infer<typeof ZContentReportResolutionCode>;
export type TContentReportSnapshot = z.infer<typeof ZContentReportSnapshot>;
export type TCreateContentReport = z.infer<typeof ZCreateContentReport>;
export type TListContentReportsQuery = z.infer<typeof ZListContentReportsQuery>;
export type TUpdateContentReport = z.infer<typeof ZUpdateContentReport>;
