import * as z from 'zod';

export const ZGetProfileByEmail = z.object({
  email: z.email()
});

export type TGetProfileByEmail = z.infer<typeof ZGetProfileByEmail>;
