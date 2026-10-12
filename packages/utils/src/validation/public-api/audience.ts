import * as z from 'zod';

const ZPublicApiAudienceActivityWindow = z.enum(['7d', '30d', '90d', '180d', 'never']);

export const ZPublicApiAudienceQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().optional(),
  sortBy: z.enum(['createdAt', 'name', 'email', 'lastLoginAt', 'lastActiveAt']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  status: z.enum(['ACTIVE', 'DEACTIVATED', 'ARCHIVED']).default('ACTIVE'),
  inviteStatus: z.enum(['active', 'pending', 'expired', 'revoked']).optional(),
  enrollment: z.enum(['enrolled', 'not_enrolled']).optional(),
  completion: z.enum(['not_started', 'in_progress', 'completed']).optional(),
  lastLoginBefore: ZPublicApiAudienceActivityWindow.optional(),
  lastActiveBefore: ZPublicApiAudienceActivityWindow.optional(),
  excludeRecentJoiners: z
    .union([z.boolean(), z.enum(['true', 'false'])])
    .default(true)
    .transform((value) => value === true || value === 'true')
});
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

export const ZPublicApiAssignAudienceCourses = z
  .object({
    profileIds: z.array(z.uuid()).min(1).max(500),
    courseIds: z.array(z.uuid()).optional(),
    cohortIds: z.array(z.uuid()).optional(),
    sendEmail: z.boolean().default(true)
  })
  .refine((data) => (data.courseIds?.length ?? 0) > 0 || (data.cohortIds?.length ?? 0) > 0, {
    message: 'At least one course or cohort must be selected',
    path: ['courseIds']
  });
export type TPublicApiAssignAudienceCourses = z.infer<typeof ZPublicApiAssignAudienceCourses>;

export const ZPublicApiAudienceMemberParam = z.object({
  memberId: z.coerce.number().int().positive()
});
export type TPublicApiAudienceMemberParam = z.infer<typeof ZPublicApiAudienceMemberParam>;
