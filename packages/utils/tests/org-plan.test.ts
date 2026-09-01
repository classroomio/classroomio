import { describe, expect, it } from 'vitest';

import { getActiveOrgPlan, isOrgOnFreePlan } from '../src/plans/org-plan';

describe('organization plan selection', () => {
  it('ignores an inactive historical plan', () => {
    const plans = [{ planName: 'EARLY_ADOPTER', isActive: false }];

    expect(getActiveOrgPlan(plans)).toBeUndefined();
    expect(isOrgOnFreePlan({ plans, isSelfHosted: false, orgId: 'org-id' })).toBe(true);
  });

  it('selects the active plan instead of the first plan', () => {
    const plans = [
      { planName: 'EARLY_ADOPTER', isActive: false },
      { planName: 'ENTERPRISE', isActive: true }
    ];

    expect(getActiveOrgPlan(plans)).toEqual(plans[1]);
    expect(isOrgOnFreePlan({ plans, isSelfHosted: false, orgId: 'org-id' })).toBe(false);
  });
});
