import * as schema from '@db/schema';

export type OrganizationPlan = Pick<
  typeof schema.organizationPlan.$inferSelect,
  'planName' | 'isActive' | 'provider' | 'subscriptionId'
> & { customerId: string | null };

export type OrganizationWithMemberAndPlans = typeof schema.organization.$inferSelect & {
  member: typeof schema.organizationmember.$inferSelect;
  plans: OrganizationPlan[];
};
