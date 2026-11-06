import { beforeEach, describe, expect, it, vi } from 'vitest';

const env = vi.hoisted(() => ({ PUBLIC_IS_SELFHOSTED: 'false' as string | undefined }));

vi.mock('@cio/core/config/env', () => ({ env }));

vi.mock('@cio/db/queries/organization', () => ({
  getActiveOrganizationPlan: vi.fn()
}));

vi.mock('@api/utils/redis/cached-read', () => ({
  cachedRead: vi.fn(async (_key, _ttl, compute) => {
    const data = await compute();
    const generatedAt = new Date().toISOString();

    return { data, generatedAt };
  })
}));

import { cachedRead } from '@api/utils/redis/cached-read';

import { getActiveOrganizationPlan } from '@cio/db/queries/organization';
import { FREE_PLAN_INSIGHTS_DAYS, INSIGHTS_RANGE_DAYS } from '@cio/utils/constants/insights';
import { FREE_PLAN_INSIGHTS_RANGE, resolveInsightsRange } from '@api/services/insights/plan';

const ORG_ID = '11111111-1111-4111-8111-111111111111';

function plan(planName: string) {
  return { id: 'plan-1', orgId: ORG_ID, planName, isActive: true };
}

describe('resolveInsightsRange', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    env.PUBLIC_IS_SELFHOSTED = 'false';
  });

  it('keeps the free allowance range without reading the plan', async () => {
    await expect(resolveInsightsRange(ORG_ID, '7d')).resolves.toBe('7d');

    expect(getActiveOrganizationPlan).not.toHaveBeenCalled();
  });

  it('clamps All time to the free allowance on the Free plan', async () => {
    vi.mocked(getActiveOrganizationPlan).mockResolvedValue(plan('BASIC') as never);

    await expect(resolveInsightsRange(ORG_ID, 'all')).resolves.toBe(FREE_PLAN_INSIGHTS_RANGE);
  });

  it('clamps a ninety-day range on an org without an active plan', async () => {
    vi.mocked(getActiveOrganizationPlan).mockResolvedValue(null);

    await expect(resolveInsightsRange(ORG_ID, '90d')).resolves.toBe(FREE_PLAN_INSIGHTS_RANGE);
  });

  it('keeps every range on a paid plan', async () => {
    vi.mocked(getActiveOrganizationPlan).mockResolvedValue(plan('ENTERPRISE') as never);

    await expect(resolveInsightsRange(ORG_ID, 'all')).resolves.toBe('all');
  });

  it('keeps every range on a self-hosted install without reading the plan', async () => {
    env.PUBLIC_IS_SELFHOSTED = 'true';

    await expect(resolveInsightsRange(ORG_ID, 'all')).resolves.toBe('all');

    expect(getActiveOrganizationPlan).not.toHaveBeenCalled();
  });

  it('points the free allowance range at the free allowance in days', () => {
    expect(INSIGHTS_RANGE_DAYS[FREE_PLAN_INSIGHTS_RANGE]).toBe(FREE_PLAN_INSIGHTS_DAYS);
  });

  it('reads the plan through cachedRead with the plan key and TTL', async () => {
    vi.mocked(getActiveOrganizationPlan).mockResolvedValue(plan('ENTERPRISE') as never);

    await resolveInsightsRange(ORG_ID, 'all');

    expect(cachedRead).toHaveBeenCalledWith(`insights:plan:${ORG_ID}:org:${ORG_ID}`, 60, expect.any(Function));
  });
});
