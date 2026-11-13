import { z } from 'zod';

export const ZSelectOAuthOrganization = z.object({
  organizationId: z.string().uuid()
});
export type TSelectOAuthOrganization = z.infer<typeof ZSelectOAuthOrganization>;

export const ZOAuthConnectedAppParam = z.object({
  consentId: z.string().uuid()
});
export type TOAuthConnectedAppParam = z.infer<typeof ZOAuthConnectedAppParam>;

export const ZListOAuthOrganizationsQuery = z.object({
  resource: z.url().optional()
});
export type TListOAuthOrganizationsQuery = z.infer<typeof ZListOAuthOrganizationsQuery>;

export const ZOAuthClientParam = z.object({
  clientId: z.string().min(1).max(255)
});
export type TOAuthClientParam = z.infer<typeof ZOAuthClientParam>;
