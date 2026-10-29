import { beforeEach, describe, expect, it, vi } from 'vitest';

const env = vi.hoisted(() => ({ PUBLIC_IS_SELFHOSTED: 'false' as string | undefined }));

vi.mock('@cio/core/config/env', () => ({ env }));

vi.mock('@cio/db/queries/organization', () => ({
  getActiveOrganizationPlan: vi.fn()
}));

import { getActiveOrganizationPlan } from '@cio/db/queries/organization';
import { AppError } from '@api/utils/errors';
import { assertInsightsRangeAllowed } from '@api/services/insights/plan';

const ORG_ID = '11111111-1111-4111-8111-111111111111';

function plan(planName: string) {
  return { id: 'plan-1', orgId: ORG_ID, planName, isActive: true };
}

describe('assertInsightsRangeAllowed', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    env.PUBLIC_IS_SELFHOSTED = 'false';
  });

  it('allows a range inside the free allowance without reading the plan', async () => {
    await expect(assertInsightsRangeAllowed(ORG_ID, '7d')).resolves.toBeUndefined();

    expect(getActiveOrganizationPlan).not.toHaveBeenCalled();
  });

  it('rejects All time on the Free plan', async () => {
    vi.mocked(getActiveOrganizationPlan).mockResolvedValue(plan('BASIC') as never);

    await expect(assertInsightsRangeAllowed(ORG_ID, 'all')).rejects.toMatchObject({
      statusCode: 402,
      code: 'PLAN_UPGRADE_REQUIRED'
    });
  });

  it('rejects a ninety-day range on an org without an active plan', async () => {
    vi.mocked(getActiveOrganizationPlan).mockResolvedValue(null);

    await expect(assertInsightsRangeAllowed(ORG_ID, '90d')).rejects.toBeInstanceOf(AppError);
  });

  it('allows every range on a paid plan', async () => {
    vi.mocked(getActiveOrganizationPlan).mockResolvedValue(plan('ENTERPRISE') as never);

    await expect(assertInsightsRangeAllowed(ORG_ID, 'all')).resolves.toBeUndefined();
  });

  it('allows every range on a self-hosted install without reading the plan', async () => {
    env.PUBLIC_IS_SELFHOSTED = 'true';

    await expect(assertInsightsRangeAllowed(ORG_ID, 'all')).resolves.toBeUndefined();

    expect(getActiveOrganizationPlan).not.toHaveBeenCalled();
  });
});
