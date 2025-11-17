import type { TUser, TSession, TProfile, TOrganization, TOrganizationmember, TOrganizationPlan } from '@cio/db/types';

type AccountOrganization = TOrganization & {
  member: TOrganizationmember | null;
  plan:
    | (Pick<TOrganizationPlan, 'planName' | 'isActive' | 'provider' | 'subscriptionId'> & { customerId: string })
    | null;
};

// src/app.d.ts
declare global {
  namespace App {
    interface Locals {
      user: TUser | null;
      session: TSession | null;
      profile: TProfile | null;
      organizations: AccountOrganization[];
      // getAccount: () =>
    }
    // interface PageData {}
    // interface Error {}
    // interface Platform {}
  }
}

export {};
