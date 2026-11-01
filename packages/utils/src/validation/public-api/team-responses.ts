import * as z from 'zod';

// Response shape for OpenAPI docs only; handlers don't validate against it.
export const ZPublicApiTeamMemberResponse = z.object({
  id: z.number(),
  profileId: z.string().uuid().nullable().describe('null until the invited person creates an account'),
  name: z.string().describe('Empty until the invited person creates an account'),
  email: z.string(),
  roleId: z.number().describe('1 = admin, 2 = tutor'),
  verified: z.boolean().describe('false while the invite is still pending')
});

export const ZPublicApiInviteTeamMembersResponse = z.object({
  requiresConfirmation: z
    .boolean()
    .describe('true when a student address is missing from confirmedStudentEmails; nothing was sent'),
  studentEmails: z.array(z.string()).describe('Addresses that already belong to students in this organization'),
  existingTeamMembers: z
    .array(z.object({ email: z.string(), roleId: z.number() }))
    .describe('Addresses already on the team; when this is not empty, nothing was sent'),
  queuedCount: z.number().describe('Invite emails queued for sending'),
  failedEmails: z.array(z.string()).describe('Addresses whose invite could not be created or queued')
});

export const ZPublicApiRemoveTeamMemberResponse = z.object({
  id: z.number(),
  email: z.string().nullable(),
  roleId: z.number().describe('The role the member had: 1 = admin, 2 = tutor')
});

export const ZPublicApiTeamInviteLinkResponse = z.object({
  id: z.string(),
  roleId: z.number().describe('1 = admin, 2 = tutor'),
  enabled: z.boolean(),
  url: z.string().describe('Anyone who opens this link and signs in joins the organization with this role')
});
