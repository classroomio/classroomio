import { z } from 'zod';

export const ZOrganizationApiKeyType = z.enum(['mcp', 'api', 'zapier']);
export type TOrganizationApiKeyType = z.infer<typeof ZOrganizationApiKeyType>;

export const ZOrganizationApiKeyScope = z.enum([
  'course_import:draft:create',
  'course_import:draft:read',
  'course_import:draft:update',
  'course_import:draft:publish',
  'public_api:*'
]);
export type TOrganizationApiKeyScope = z.infer<typeof ZOrganizationApiKeyScope>;

export const ZListOrganizationApiKeysQuery = z.object({
  type: ZOrganizationApiKeyType.optional()
});
export type TListOrganizationApiKeysQuery = z.infer<typeof ZListOrganizationApiKeysQuery>;

export const ZCreateOrganizationApiKey = z.object({
  type: ZOrganizationApiKeyType,
  label: z.string().min(1).max(120).optional(),
  expiresAt: z.string().datetime().optional(),
  scopes: z.array(ZOrganizationApiKeyScope).min(1).optional()
});
export type TCreateOrganizationApiKey = z.infer<typeof ZCreateOrganizationApiKey>;

export const ZOrganizationApiKeyParam = z.object({
  keyId: z.string().uuid()
});
export type TOrganizationApiKeyParam = z.infer<typeof ZOrganizationApiKeyParam>;
