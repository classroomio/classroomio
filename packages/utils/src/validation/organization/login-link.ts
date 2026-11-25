import { z } from 'zod';

import { ZSafeRedirectPath } from '../shared/safe-redirect';

export const ZLoginLinkQuery = z.object({
  token: z.string().min(1),
  redirect: ZSafeRedirectPath
});

export type TLoginLinkQuery = z.infer<typeof ZLoginLinkQuery>;

export const ZLoginLinkPayload = z.object({
  sub: z.uuid(),
  jti: z.uuid(),
  email: z.email(),
  type: z.literal('login-link')
});

export type TLoginLinkPayload = z.infer<typeof ZLoginLinkPayload>;
