import { z } from 'zod';

export const ZTokenExchangeQuery = z.object({
  token: z.string().min(1),
  redirect: z.string().optional()
});

export type TTokenExchangeQuery = z.infer<typeof ZTokenExchangeQuery>;

export const ZTokenExchangePayload = z.object({
  sub: z.string(),
  email: z.email(),
  name: z.string().optional(),
  avatar: z.url().optional(),
  iat: z.number(),
  exp: z.number()
});

export type TTokenExchangePayload = z.infer<typeof ZTokenExchangePayload>;
