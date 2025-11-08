import type { User, Session, Profile, Organization, OrganizationMember, OrganizationPlan } from '@cio/utils/types/db';

type AccountOrganization = Organization & {
  member: OrganizationMember | null;
  plan:
    | (Pick<OrganizationPlan, 'planName' | 'isActive' | 'provider' | 'subscriptionId'> & { customerId: string })
    | null;
};

// src/app.d.ts
declare global {
  namespace App {
    interface Locals {
      user: User | null;
      session: Session | null;
      profile: Profile | null;
      organizations: AccountOrganization[];
      // getAccount: () =>
    }
    // interface PageData {}
    // interface Error {}
    // interface Platform {}
  }
}

export {};
