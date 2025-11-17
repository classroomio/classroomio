import { TOrganization, TOrganizationPlan, TOrganizationmember } from '@db/types';

export type OrganizationPlan = Pick<TOrganizationPlan, 'planName' | 'isActive' | 'provider' | 'subscriptionId'> & {
  customerId: string | null;
};

export type OrganizationWithMemberAndPlans = TOrganization & {
  member: TOrganizationmember;
  plans: OrganizationPlan[];
};
