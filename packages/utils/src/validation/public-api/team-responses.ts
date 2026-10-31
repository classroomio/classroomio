import * as z from 'zod';

// Response shape for OpenAPI docs only; handlers don't validate against it.
export const ZPublicApiTeamMemberResponse = z.object({
  id: z.number(),
  profileId: z.string().uuid().nullable().describe('null until the invited person creates an account'),
  name: z.string().describe('Empty until the invited person creates an account'),
  username: z.string().nullable().describe('null until the invited person creates an account'),
  email: z.string(),
  avatarUrl: z.string().describe('Empty until the person sets a profile picture'),
  locale: z
    .string()
    .nullable()
    .describe('Language ClassroomIO is shown in for them; null until they create an account'),
  roleId: z.number().describe('1 = admin, 2 = tutor'),
  verified: z.boolean().describe('false while the invite is still pending')
});
