import * as z from 'zod';

export const ZTemplateById = z.object({
  id: z.coerce.number().min(1, 'ID is required')
});

export const ZTemplateByTag = z.object({
  tag: z.string().min(1, 'Tag is required')
});

export type TTemplateById = z.infer<typeof ZTemplateById>;
export type TTemplateByTag = z.infer<typeof ZTemplateByTag>;
