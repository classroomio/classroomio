import * as z from 'zod';

export const ZOrganizationInviteTokenParam = z.object({
  token: z.string().min(10).max(512)
});

export type TOrganizationInviteTokenParam = z.infer<typeof ZOrganizationInviteTokenParam>;
