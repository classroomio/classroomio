import * as z from 'zod';

export const TEACHING_LEARNER_FILTERS = ['all', 'needs-nudge'] as const;

export type TTeachingLearnerFilter = (typeof TEACHING_LEARNER_FILTERS)[number];

export const ZTeachingSessionsQuery = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(20)
});
export type TTeachingSessionsQuery = z.infer<typeof ZTeachingSessionsQuery>;

export const ZTeachingActivityQuery = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(20),
  cursor: z.string().min(1).max(200).optional()
});
export type TTeachingActivityQuery = z.infer<typeof ZTeachingActivityQuery>;

export const ZTeachingSubmissionHistoryQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  courseId: z.uuid().optional()
});
export type TTeachingSubmissionHistoryQuery = z.infer<typeof ZTeachingSubmissionHistoryQuery>;

export const ZTeachingLearnersQuery = z.object({
  filter: z.enum(TEACHING_LEARNER_FILTERS).default('all'),
  courseId: z.uuid().optional(),
  search: z.string().trim().max(120).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20)
});
export type TTeachingLearnersQuery = z.infer<typeof ZTeachingLearnersQuery>;

export const ZLearnerNudge = z.object({
  courseId: z.uuid(),
  profileId: z.uuid()
});
export type TLearnerNudge = z.infer<typeof ZLearnerNudge>;
