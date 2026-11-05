import * as z from 'zod';

export const ZPublicApiInviteStudentsToCohort = z.object({
  recipientCsv: z.string().min(1).max(25000).describe('CSV of emails, optionally with names.'),
  sendEmail: z.boolean().default(true).describe('Queue invite and welcome emails. Default: true.')
});
export type TPublicApiInviteStudentsToCohort = z.infer<typeof ZPublicApiInviteStudentsToCohort>;

export const ZPublicApiAssignStudentsToCohort = z.object({
  profileIds: z
    .array(z.string().uuid())
    .min(1)
    .max(500)
    .describe(
      'Profiles that are already students in your organization; any other profileId is skipped and not counted.'
    ),
  sendEmail: z
    .boolean()
    .default(true)
    .describe('Queue a cohort welcome email for each newly assigned student. Default: true.')
});
export type TPublicApiAssignStudentsToCohort = z.infer<typeof ZPublicApiAssignStudentsToCohort>;

export const ZPublicApiSetCohortInviteLinkRevoked = z.object({
  isRevoked: z.boolean().describe('true disables the link, false re-enables it. The link keeps the same URL.')
});
export type TPublicApiSetCohortInviteLinkRevoked = z.infer<typeof ZPublicApiSetCohortInviteLinkRevoked>;
