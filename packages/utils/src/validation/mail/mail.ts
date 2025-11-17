import { z } from 'zod';

export const ZEmailData = z.object({
  from: z.string().optional(),
  to: z.email(),
  subject: z.string().min(1),
  content: z.string().min(1),
  replyTo: z.string().optional()
});
export type TEmailData = z.infer<typeof ZEmailData>;

export const ZDeliverEmail = z.array(ZEmailData).min(1);
export type TDeliverEmail = z.infer<typeof ZDeliverEmail>;
