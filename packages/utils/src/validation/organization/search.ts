import * as z from 'zod';

export const ZSearchOrganization = z.object({
  q: z.string().trim().min(1).max(200),
  limit: z.coerce.number().int().min(1).max(20).default(5)
});

export type TSearchOrganization = z.infer<typeof ZSearchOrganization>;
