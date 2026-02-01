import * as z from 'zod';

export const ZSubmissionGetParam = z.object({
  submissionId: z.string().min(1)
});
export type TSubmissionGetParam = z.infer<typeof ZSubmissionGetParam>;

export const ZSubmissionListQuery = z.object({
  exerciseId: z.string().optional(),
  submittedBy: z.string().optional()
});
export type TSubmissionListQuery = z.infer<typeof ZSubmissionListQuery>;

export const ZSubmissionUpdate = z.object({
  statusId: z.number().int().optional(),
  total: z.number().int().min(0).optional(),
  feedback: z.string().optional(),
  reviewerId: z.number().int().optional()
});
export type TSubmissionUpdate = z.infer<typeof ZSubmissionUpdate>;

export const ZSubmissionAnswerUpdate = z.object({
  questionId: z.number().int(),
  optionId: z.number().int().optional(),
  answer: z.string().optional(),
  points: z.number().int().min(0).optional()
});
export type TSubmissionAnswerUpdate = z.infer<typeof ZSubmissionAnswerUpdate>;
