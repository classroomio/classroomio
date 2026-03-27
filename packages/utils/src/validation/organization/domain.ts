import * as z from 'zod';

export const ZDomainAction = z.enum(['connect', 'refresh', 'remove']);

export const ZDomainActionRequest = z.object({
  action: ZDomainAction,
  domain: z.string().min(1)
});

export type TDomainAction = z.infer<typeof ZDomainAction>;
export type TDomainActionRequest = z.infer<typeof ZDomainActionRequest>;
