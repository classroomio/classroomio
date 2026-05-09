import { z } from 'zod';

export const ZExerciseSectionAfterBehavior = z.discriminatedUnion('action', [
  z.object({ action: z.literal('continue') }),
  z.object({ action: z.literal('go_to_section'), exerciseSectionId: z.string().uuid() }),
  z.object({ action: z.literal('submit') })
]);

export const ZExerciseSection = z.object({
  id: z.string().uuid().optional(),
  title: z.string().min(1, 'Section title is required'),
  description: z.string().optional().nullable(),
  order: z.number().int().min(0),
  colorTheme: z.enum(['blue', 'green', 'amber', 'rose', 'violet', 'slate']).default('blue'),
  afterBehavior: ZExerciseSectionAfterBehavior.default({ action: 'continue' }),
  questionIds: z.array(z.union([z.string(), z.number().int()])).optional()
});

export const ZExerciseSectionCreate = ZExerciseSection.omit({ id: true });
export const ZExerciseSectionUpdate = ZExerciseSection.partial().required({ id: true });

export type TExerciseSection = z.infer<typeof ZExerciseSection>;
export type TExerciseSectionAfterBehavior = z.infer<typeof ZExerciseSectionAfterBehavior>;
