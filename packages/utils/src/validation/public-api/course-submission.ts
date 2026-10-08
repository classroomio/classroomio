import * as z from 'zod';

import { ZPublicApiCourseParam } from './course';
import { ZPublicApiPaginationQuery } from './pagination';

export const ZPublicApiSubmissionGradingState = z.enum([
  'queued',
  'processing',
  'awaiting_manual',
  'completed',
  'failed'
]);

export const ZPublicApiCourseSubmissionParam = ZPublicApiCourseParam.extend({
  submissionId: z.string().uuid()
});
export type TPublicApiCourseSubmissionParam = z.infer<typeof ZPublicApiCourseSubmissionParam>;

export const ZPublicApiCourseSubmissionsQuery = ZPublicApiPaginationQuery.extend({
  exerciseId: z.string().uuid().optional(),
  memberId: z.string().uuid().optional(),
  gradingState: ZPublicApiSubmissionGradingState.optional()
});
export type TPublicApiCourseSubmissionsQuery = z.infer<typeof ZPublicApiCourseSubmissionsQuery>;

export const ZPublicApiGradeCourseSubmission = z
  .object({
    answers: z
      .array(
        z.object({
          questionId: z.number().int().positive(),
          points: z.number().int().min(0)
        })
      )
      .max(500),
    total: z.number().int().min(0),
    feedback: z.string().optional()
  })
  .refine((data) => new Set(data.answers.map((answer) => answer.questionId)).size === data.answers.length, {
    message: 'Each questionId can appear only once',
    path: ['answers']
  });
export type TPublicApiGradeCourseSubmission = z.infer<typeof ZPublicApiGradeCourseSubmission>;

export const ZPublicApiUpdateCourseSubmission = z
  .object({
    gradingState: ZPublicApiSubmissionGradingState.optional(),
    feedback: z.string().optional()
  })
  .refine((data) => data.gradingState !== undefined || data.feedback !== undefined, {
    message: 'Send gradingState or feedback'
  });
export type TPublicApiUpdateCourseSubmission = z.infer<typeof ZPublicApiUpdateCourseSubmission>;

export const ZPublicApiCourseMarksQuery = ZPublicApiPaginationQuery;
export type TPublicApiCourseMarksQuery = z.infer<typeof ZPublicApiCourseMarksQuery>;
