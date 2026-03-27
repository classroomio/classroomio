import * as z from 'zod';

export const ZImportAudienceMembers = z.object({
  recipientCsv: z.string().max(25000),
  courseIds: z.array(z.string().uuid()).optional(),
  allCourses: z.boolean().optional().default(false),
  sendEmail: z.boolean().default(true)
});

export type TImportAudienceMembers = z.infer<typeof ZImportAudienceMembers>;

export const ZAssignAudienceCourses = z.object({
  profileIds: z.array(z.uuid()).min(1).max(500),
  courseIds: z.array(z.uuid()).min(1),
  sendEmail: z.boolean().default(true)
});

export type TAssignAudienceCourses = z.infer<typeof ZAssignAudienceCourses>;

export const ZAudienceInviteByEmail = z.object({
  email: z.email()
});

export type TAudienceInviteByEmail = z.infer<typeof ZAudienceInviteByEmail>;
