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

export const ZPublicApiMemberName = z.string().trim().min(3).max(120);

export const ZPublicApiUpdateAudience = z
  .object({
    email: z.string().email().optional().describe('Pending members only: corrects the invited email'),
    sendEmail: z.boolean().default(true).describe('Whether to email the new invite when email changes'),
    name: ZPublicApiMemberName.optional().describe('Joined members only: sets the full name on their profile')
  })
  .refine((data) => data.email !== undefined || data.name !== undefined, { message: 'No fields to update' });
export type TPublicApiUpdateAudience = z.infer<typeof ZPublicApiUpdateAudience>;

export const ZPublicApiAssignAudienceCourses = ZAssignAudienceCourses;
export type TPublicApiAssignAudienceCourses = z.infer<typeof ZPublicApiAssignAudienceCourses>;

export const ZPublicApiAudienceMemberParam = z.object({
  memberId: z.coerce.number().int().positive()
});
export type TPublicApiAudienceMemberParam = z.infer<typeof ZPublicApiAudienceMemberParam>;
