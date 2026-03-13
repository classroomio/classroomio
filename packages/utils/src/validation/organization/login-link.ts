import { z } from 'zod';

export const ZLoginLinkQuery = z.object({
  token: z.string().min(1),
  redirect: z.string().optional()
});

export type TLoginLinkQuery = z.infer<typeof ZLoginLinkQuery>;

export const ZLoginLinkPayload = z.object({
  sub: z.uuid(),
  email: z.email(),
  type: z.literal('login-link')
});

export type TLoginLinkPayload = z.infer<typeof ZLoginLinkPayload>;
