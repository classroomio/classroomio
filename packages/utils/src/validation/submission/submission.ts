import * as z from 'zod';

export const ZSubmissionGradingState = z.enum(['queued', 'processing', 'awaiting_manual', 'completed', 'failed']);
export type TSubmissionGradingState = z.infer<typeof ZSubmissionGradingState>;

export const ZSubmissionOverallStatus = z.enum(['auto_graded', 'manual_required', 'hybrid']);
export type TSubmissionOverallStatus = z.infer<typeof ZSubmissionOverallStatus>;

export const ZSubmissionGetParam = z.object({
  submissionId: z.string().min(1)
});
export type TSubmissionGetParam = z.infer<typeof ZSubmissionGetParam>;

/** Points a student earned; stored as numeric(10, 2), so values round to two decimals. */
export const ZAwardedPoints = z.number().min(0).max(99_999_999.99);

export const ZSubmissionUpdate = z.object({
  statusId: z.number().int().optional(),
  gradingState: ZSubmissionGradingState.optional(),
  total: ZAwardedPoints.optional(),
  feedback: z.string().optional(),
  reviewerId: z.number().int().optional()
});
export type TSubmissionUpdate = z.infer<typeof ZSubmissionUpdate>;

export const ZSubmissionAnswerUpdate = z.object({
  questionId: z.number().int(),
  optionId: z.number().int().optional(),
  answer: z.string().optional(),
  points: ZAwardedPoints.optional()
});
export type TSubmissionAnswerUpdate = z.infer<typeof ZSubmissionAnswerUpdate>;

/** Batch update for grading: all answer points + submission total/feedback in one request */
export const ZSubmissionGradeItem = z.object({
  questionId: z.number().int(),
  points: ZAwardedPoints
});
export type TSubmissionGradeItem = z.infer<typeof ZSubmissionGradeItem>;

export const ZSubmissionGradesUpdate = z.object({
  answers: z.array(ZSubmissionGradeItem),
  total: ZAwardedPoints,
  feedback: z.string().optional(),
  statusId: z.number().int().min(1).max(3).optional()
});
export type TSubmissionGradesUpdate = z.infer<typeof ZSubmissionGradesUpdate>;
