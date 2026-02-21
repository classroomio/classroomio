import * as z from 'zod';

export const ZQuizGetParam = z.object({
  orgId: z.uuid(),
  quizId: z.uuid()
});

export type TQuizGetParam = z.infer<typeof ZQuizGetParam>;

export const ZQuizListParam = z.object({
  orgId: z.uuid()
});

export type TQuizListParam = z.infer<typeof ZQuizListParam>;

export const ZQuizCreate = z.object({
  title: z.string().min(1),
  questions: z.array(z.any()).optional(),
  timelimit: z.string().optional(),
  theme: z.string().optional()
});

export type TQuizCreate = z.infer<typeof ZQuizCreate>;

export const ZQuizUpdate = z.object({
  title: z.string().min(1).optional(),
  questions: z.array(z.any()).optional(),
  timelimit: z.string().optional(),
  theme: z.string().optional()
});

export type TQuizUpdate = z.infer<typeof ZQuizUpdate>;
