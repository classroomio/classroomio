import * as z from 'zod';

// SSO Provider enum values
export const SSO_PROVIDERS = ['OKTA', 'GOOGLE_WORKSPACE', 'AUTH0'] as const;

// Create SSO connection
export const ZCreateSsoConnection = z.object({
  provider: z.enum(SSO_PROVIDERS),
  displayName: z.string().min(1, 'Display name is required'),
  issuer: z.url('Must be a valid URL'),
  domain: z
    .string()
    .min(1, 'Domain is required')
    .regex(/^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$/, 'Invalid domain format'),
  clientId: z.string().min(1, 'Client ID is required'),
  clientSecret: z.string().min(1, 'Client secret is required'),
  scopes: z.string().default('openid profile email')
});

export type TCreateSsoConnection = z.infer<typeof ZCreateSsoConnection>;

// Update SSO connection
export const ZUpdateSsoConnection = z.object({
  displayName: z.string().min(1).optional(),
  issuer: z.url().optional(),
  domain: z.string().optional(),
  clientId: z.string().optional(),
  clientSecret: z.string().optional(),
  scopes: z.string().optional(),
  isActive: z.boolean().optional()
});

export type TUpdateSsoConnection = z.infer<typeof ZUpdateSsoConnection>;

// Update SSO policy
export const ZUpdateSsoPolicy = z.object({
  forceSso: z.boolean().optional(),
  autoJoinSsoDomains: z.boolean().optional(),
  breakGlassEnabled: z.boolean().optional(),
  defaultRoleId: z.number().int().positive().optional(),
  roleMapping: z.record(z.string(), z.number()).optional()
});

export type TUpdateSsoPolicy = z.infer<typeof ZUpdateSsoPolicy>;

// SSO Discovery query
export const ZSsoDiscoveryQuery = z.object({
  email: z.email('Valid email is required')
});

export type TSsoDiscoveryQuery = z.infer<typeof ZSsoDiscoveryQuery>;

// Get SSO config by org (param)
export const ZGetSsoConfig = z.object({
  orgId: z.uuid()
});

export type TGetSsoConfig = z.infer<typeof ZGetSsoConfig>;
