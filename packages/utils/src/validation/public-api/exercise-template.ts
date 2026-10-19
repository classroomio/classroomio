import * as z from 'zod';

import { ZPublicApiPaginationQuery } from './pagination';

export const ZPublicApiExerciseTemplatesQuery = ZPublicApiPaginationQuery.extend({
  tag: z.string().min(1).max(50).optional()
});
export type TPublicApiExerciseTemplatesQuery = z.infer<typeof ZPublicApiExerciseTemplatesQuery>;

export const ZPublicApiExerciseTemplateParam = z.object({
  templateId: z.coerce.number().int().min(1)
});
export type TPublicApiExerciseTemplateParam = z.infer<typeof ZPublicApiExerciseTemplateParam>;
