import * as z from 'zod';

export const ZPublicApiInviteStudentsToCohort = z.object({
  recipientCsv: z.string().min(1).max(25000),
  sendEmail: z.boolean().default(true)
});
export type TPublicApiInviteStudentsToCohort = z.infer<typeof ZPublicApiInviteStudentsToCohort>;

export const ZPublicApiAssignStudentsToCohort = z.object({
  profileIds: z.array(z.string().uuid()).min(1).max(500),
  sendEmail: z.boolean().default(true)
});
export type TPublicApiAssignStudentsToCohort = z.infer<typeof ZPublicApiAssignStudentsToCohort>;

export const ZPublicApiSetCohortInviteLinkRevoked = z.object({
  isRevoked: z.boolean()
});
export type TPublicApiSetCohortInviteLinkRevoked = z.infer<typeof ZPublicApiSetCohortInviteLinkRevoked>;
