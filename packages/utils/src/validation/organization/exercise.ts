import * as z from 'zod';

export const ZLMSExercisesParam = z.object({
  orgId: z.uuid()
});

export type TLMSExercisesParam = z.infer<typeof ZLMSExercisesParam>;
