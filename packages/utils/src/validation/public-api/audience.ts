import * as z from 'zod';

import { ZAssignAudienceCourses, ZGetAudienceQuery } from '../organization';

export const ZPublicApiAudienceQuery = ZGetAudienceQuery;
export type TPublicApiAudienceQuery = z.infer<typeof ZPublicApiAudienceQuery>;

export const ZPublicApiCreateAudience = z.object({
  email: z.string().email(),
  courseIds: z.array(z.string().uuid()).optional(),
  sendEmail: z.boolean().default(true)
});
export type TPublicApiCreateAudience = z.infer<typeof ZPublicApiCreateAudience>;

export const ZPublicApiUpdateAudience = z.object({
  email: z.string().email(),
  sendEmail: z.boolean().default(true)
});
export type TPublicApiUpdateAudience = z.infer<typeof ZPublicApiUpdateAudience>;

export const ZPublicApiAssignAudienceCourses = ZAssignAudienceCourses;
export type TPublicApiAssignAudienceCourses = z.infer<typeof ZPublicApiAssignAudienceCourses>;

export const ZPublicApiAudienceMemberParam = z.object({
  memberId: z.coerce.number().int().positive()
});
export type TPublicApiAudienceMemberParam = z.infer<typeof ZPublicApiAudienceMemberParam>;
