import * as z from 'zod';

// Response shapes for OpenAPI docs only; handlers don't validate against them.
export const peopleListItemId = z
  .string()
  .describe('Membership id; an invited person without one gets an invited:<kind>:<email> key');

export const peopleListMembership = z
  .enum(['joined', 'invited'])
  .describe('invited = the invite has not been accepted yet');

export const invitationFields = {
  kind: z.enum(['org_invite', 'course_invite', 'email_only_member']),
  status: z.enum(['pending', 'expired']),
  orgInviteId: z.string().uuid().nullable(),
  expiresAt: z.string().nullable(),
  courseIds: z.array(z.string().uuid()),
  cohortIds: z.array(z.string().uuid())
};
