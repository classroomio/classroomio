import { describe, expect, it } from 'vitest';

import { resolveBillingPortalAccess } from './billing-portal-utils';

const ORG_ID = 'org-1';

function membership(overrides: Partial<Parameters<typeof resolveBillingPortalAccess>[0][number]> = {}) {
  return {
    id: ORG_ID,
    roleId: 1,
    plans: [{ planName: 'EARLY_ADOPTER', isActive: true, customerId: 'cus_123' }],
    ...overrides
  };
}

describe('resolveBillingPortalAccess', () => {
  it('allows an org admin with an active billing customer', () => {
    expect(resolveBillingPortalAccess([membership()], ORG_ID)).toEqual({
      status: 'allowed',
      customerId: 'cus_123'
    });
  });

  it('allows an admin when the stored plan uses the webhook customer id format', () => {
    const webhookFormat = membership({
      plans: [{ planName: 'EARLY_ADOPTER', isActive: true, customer_id: 'cus_456' }]
    });

    expect(resolveBillingPortalAccess([webhookFormat], ORG_ID)).toEqual({
      status: 'allowed',
      customerId: 'cus_456'
    });
  });

  it('forbids tutors and students of the org', () => {
    expect(resolveBillingPortalAccess([membership({ roleId: 2 })], ORG_ID)).toEqual({ status: 'forbidden' });
    expect(resolveBillingPortalAccess([membership({ roleId: 3 })], ORG_ID)).toEqual({ status: 'forbidden' });
  });

  it('forbids orgs the user does not belong to, and a missing org id', () => {
    expect(resolveBillingPortalAccess([membership()], 'org-2')).toEqual({ status: 'forbidden' });
    expect(resolveBillingPortalAccess([membership()], null)).toEqual({ status: 'forbidden' });
    expect(resolveBillingPortalAccess([], ORG_ID)).toEqual({ status: 'forbidden' });
  });

  it('reports no customer when the active plan has none', () => {
    const withoutCustomer = membership({ plans: [{ planName: 'EARLY_ADOPTER', isActive: true, customerId: null }] });

    expect(resolveBillingPortalAccess([withoutCustomer], ORG_ID)).toEqual({ status: 'no-customer' });
  });

  it('ignores customers on inactive plans', () => {
    const inactiveOnly = membership({ plans: [{ planName: 'EARLY_ADOPTER', isActive: false, customerId: 'cus_old' }] });

    expect(resolveBillingPortalAccess([inactiveOnly], ORG_ID)).toEqual({ status: 'no-customer' });
    expect(resolveBillingPortalAccess([membership({ plans: null })], ORG_ID)).toEqual({ status: 'no-customer' });
  });
});
