import { TOrganization, TOrganizationPlan } from '@db/types';
import type { OrgUsageLimits } from '@cio/utils/plans';

export type OrganizationPlan = Pick<TOrganizationPlan, 'planName' | 'isActive' | 'provider' | 'subscriptionId'> & {
  customerId: string | null;
};

export type OrganizationWithMemberAndPlans = TOrganization & {
  memberId?: number;
  roleId?: number;
  plans: OrganizationPlan[];
  limits?: OrgUsageLimits;
};

export type OrganizationWithPlans = TOrganization & {
  plans: OrganizationPlan[];
};
