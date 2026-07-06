import * as z from 'zod';

export const AudienceSortBy = z.enum(['createdAt', 'name', 'email']);
export const AudienceSortOrder = z.enum(['asc', 'desc']);

export const ZGetAudienceQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().optional(),
  sortBy: AudienceSortBy.default('createdAt'),
  sortOrder: AudienceSortOrder.default('desc')
});

export type TAudienceSortBy = z.infer<typeof AudienceSortBy>;
export type TAudienceSortOrder = z.infer<typeof AudienceSortOrder>;
export type TGetAudienceQuery = z.infer<typeof ZGetAudienceQuery>;

export const ZImportAudienceMembers = z.object({
  recipientCsv: z.string().max(25000),
  courseIds: z.array(z.string().uuid()).optional(),
  cohortIds: z.array(z.string().uuid()).optional(),
  allCourses: z.boolean().optional().default(false),
  allCohorts: z.boolean().optional().default(false),
  sendEmail: z.boolean().default(true)
});

export type TImportAudienceMembers = z.infer<typeof ZImportAudienceMembers>;

export const ZAssignAudienceCourses = z
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

export type TAssignAudienceCourses = z.infer<typeof ZAssignAudienceCourses>;

export const ZAudienceInviteByEmail = z.object({
  email: z.email()
});

export type TAudienceInviteByEmail = z.infer<typeof ZAudienceInviteByEmail>;
