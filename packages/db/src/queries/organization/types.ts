import { TOrganization, TOrganizationPlan } from '@db/types';

export type OrganizationPlan = Pick<TOrganizationPlan, 'planName' | 'isActive' | 'provider' | 'subscriptionId'> & {
  customerId: string | null;
};

export type OrganizationWithMemberAndPlans = TOrganization & {
  roleId?: number;
  plans: OrganizationPlan[];
};

export type OrganizationWithPlans = TOrganization & {
  plans: OrganizationPlan[];
};
