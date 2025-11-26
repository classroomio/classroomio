import * as z from 'zod';

export const ZGetOrganizations = z.object({
  siteName: z.string().min(1).optional(),
  customDomain: z.string().min(1).optional(),
  isCustomDomainVerified: z.boolean().optional()
});

export type TGetOrganizations = z.infer<typeof ZGetOrganizations>;

export const ZGetOrganizationTeam = z.object({
  orgId: z.uuid()
});

export type TGetOrganizationTeam = z.infer<typeof ZGetOrganizationTeam>;

export const ZGetOrganizationAudience = z.object({
  orgId: z.uuid()
});

export type TGetOrganizationAudience = z.infer<typeof ZGetOrganizationAudience>;

export const ZGetCoursesBySiteName = z.object({
  siteName: z.string().min(1)
});

export type TGetCoursesBySiteName = z.infer<typeof ZGetCoursesBySiteName>;

export const ZCreateOrgPlan = z.object({
  orgId: z.uuid(),
  planName: z.enum(['EARLY_ADOPTER', 'ENTERPRISE', 'BASIC']),
  subscriptionId: z.string().min(1),
  triggeredBy: z.number().int().positive(),
  payload: z.record(z.string(), z.unknown())
});

export type TCreateOrgPlan = z.infer<typeof ZCreateOrgPlan>;

export const ZUpdateOrgPlan = z.object({
  subscriptionId: z.string().min(1),
  payload: z.record(z.string(), z.unknown())
});

export type TUpdateOrgPlan = z.infer<typeof ZUpdateOrgPlan>;

export const ZCancelOrgPlan = z.object({
  subscriptionId: z.string().min(1),
  payload: z.record(z.string(), z.unknown())
});

export type TCancelOrgPlan = z.infer<typeof ZCancelOrgPlan>;
