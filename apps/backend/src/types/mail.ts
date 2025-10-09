import { z } from 'zod';

export const ZSendEmailValidation = z.array(
  z.object({
    from: z.string().optional(),
    to: z.string().email(),
    subject: z.string().min(1),
    content: z.string().min(1),
    replyTo: z.string().email().optional()
  })
);

export type TSendEmailValidation = z.infer<typeof ZSendEmailValidation>;
