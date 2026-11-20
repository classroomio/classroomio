import * as z from 'zod';

export const PRACTICE_MAX_QUESTIONS = 10;
export const PRACTICE_MAX_STUDENTS = 200;
export const PRACTICE_MAX_SOURCE_QUESTIONS = 20;

export const ZPracticeCreate = z
  .object({
    skillId: z.uuid().optional(),
    sourceQuestionIds: z.array(z.number().int().positive()).min(1).max(PRACTICE_MAX_SOURCE_QUESTIONS).optional(),
    profileIds: z.array(z.uuid()).min(1).max(PRACTICE_MAX_STUDENTS),
    count: z.number().int().min(1).max(PRACTICE_MAX_QUESTIONS).default(5),
    title: z.string().trim().min(1).max(200).optional()
  })
  .refine((input) => Boolean(input.skillId) !== Boolean(input.sourceQuestionIds), { path: ['skillId'] });
export type TPracticeCreate = z.infer<typeof ZPracticeCreate>;
