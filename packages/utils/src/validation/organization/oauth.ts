import { z } from 'zod';

export const ZSelectOAuthOrganization = z.object({
  organizationId: z.string().uuid()
});
export type TSelectOAuthOrganization = z.infer<typeof ZSelectOAuthOrganization>;

export const ZOAuthConnectedAppParam = z.object({
  consentId: z.string().uuid()
});
export type TOAuthConnectedAppParam = z.infer<typeof ZOAuthConnectedAppParam>;
