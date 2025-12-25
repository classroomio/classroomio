import * as z from 'zod';

import { blockedSubdomain } from '@cio/utils/constants';

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

export const ZUpdateOrganizationParam = z.object({
  orgId: z.uuid()
});

export type TUpdateOrganizationParam = z.infer<typeof ZUpdateOrganizationParam>;

export const ZGetOrganizationAudience = z.object({
  orgId: z.uuid()
});

export type TGetOrganizationAudience = z.infer<typeof ZGetOrganizationAudience>;

export const ZGetCoursesBySiteName = z.object({
  siteName: z.string().min(1)
});

export type TGetCoursesBySiteName = z.infer<typeof ZGetCoursesBySiteName>;

export const ZGetOrgSetup = z.object({
  siteName: z.string().min(1)
});

export type TGetOrgSetup = z.infer<typeof ZGetOrgSetup>;

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

export const ZCreateOrganization = z.object({
  name: z
    .string()
    .min(5)
    .refine((val) => !/^[-]|[-]$/.test(val), {
      message: 'Organization name cannot start or end with a hyphen'
    }),
  siteName: z
    .string()
    .min(5)
    .refine((val) => !/^[-]|[-]$/.test(val), {
      message: 'Site name cannot start or end with a hyphen'
    })
    .refine((val) => !blockedSubdomain.includes(val), {
      message: 'Sitename already exists.'
    })
});

export type TCreateOrganization = z.infer<typeof ZCreateOrganization>;

export const ZUpdateOrganization = z.object({
  name: z
    .string()
    .min(5)
    .refine((val) => !/^[-]|[-]$/.test(val), {
      message: 'Organization name cannot start or end with a hyphen'
    })
    .optional(),
  avatarUrl: z.url().optional(),
  theme: z.string().optional(),
  landingpage: z.record(z.string(), z.unknown()).optional(),
  siteName: z.string().min(1).optional(),
  customDomain: z.string().nullable().optional(),
  isCustomDomainVerified: z.boolean().optional(),
  customization: z.record(z.string(), z.unknown()).optional()
});

export type TUpdateOrganization = z.infer<typeof ZUpdateOrganization>;

export const ZInviteTeamMembers = z.object({
  emails: z.array(z.string().email()).min(1).max(50),
  roleId: z.number().int().positive()
});

export type TInviteTeamMembers = z.infer<typeof ZInviteTeamMembers>;

export const ZRemoveTeamMember = z.object({
  orgId: z.uuid(),
  memberId: z.number().int().positive()
});

export type TRemoveTeamMember = z.infer<typeof ZRemoveTeamMember>;

export const ZGetUserAnalytics = z.object({
  orgId: z.uuid(),
  userId: z.uuid()
});

export type TGetUserAnalytics = z.infer<typeof ZGetUserAnalytics>;
