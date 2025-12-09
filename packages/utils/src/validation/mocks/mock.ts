import * as z from 'zod';

export const ZMock = z.object({
  id: z.string().min(1, 'ID is required')
});

export type TMock = z.infer<typeof ZMock>;
