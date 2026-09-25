import * as z from 'zod';

import { ZPublicApiCourseParam } from './course';

export const ZPublicApiCourseInviteParam = ZPublicApiCourseParam;
export type TPublicApiCourseInviteParam = z.infer<typeof ZPublicApiCourseInviteParam>;

export const ZPublicApiCourseInviteRevokeParam = ZPublicApiCourseParam.extend({
  inviteId: z.string().uuid()
});
export type TPublicApiCourseInviteRevokeParam = z.infer<typeof ZPublicApiCourseInviteRevokeParam>;

export const ZPublicApiCreateCourseInvite = z
  .object({
    preset: z.enum(['ONE_TIME_24H', 'MULTI_USE_7D', 'MULTI_USE_30D', 'CUSTOM']).default('MULTI_USE_30D'),
    expiresAt: z.string().min(1).optional(),
    maxUses: z.number().int().min(1).max(1000).optional(),
    allowedEmails: z.array(z.string().email()).max(100).optional(),
    allowedDomains: z.array(z.string().min(1)).max(100).optional(),
    recipientEmails: z.array(z.string().email()).max(500).optional(),
    recipientCsv: z.string().max(25000).optional(),
    sendEmail: z.boolean().default(false),
    metadata: z.record(z.string(), z.unknown()).optional()
  })
  .refine(
    (data) => {
      const hasEmails = (data.recipientEmails?.length ?? 0) > 0;
      const hasCsv = typeof data.recipientCsv === 'string' && data.recipientCsv.trim().length > 0;
      return hasEmails || hasCsv;
    },
    { message: 'recipientEmails or recipientCsv is required', path: ['recipientEmails'] }
  );
export type TPublicApiCreateCourseInvite = z.infer<typeof ZPublicApiCreateCourseInvite>;

export const ZPublicApiCourseInvitesQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20)
});
export type TPublicApiCourseInvitesQuery = z.infer<typeof ZPublicApiCourseInvitesQuery>;
