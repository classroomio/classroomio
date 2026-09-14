import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@cio/db/queries/agent', () => ({
  aggregateTokenUsageByUser: vi.fn(),
  countRequests: vi.fn(),
  getDailyTokenUsageHistory: vi.fn(),
  getMonthlyTokenUsage: vi.fn(),
  getOrgCreditBalance: vi.fn(),
  insertTokenUsageAndDrainCredits: vi.fn(),
  summarizePurchases: vi.fn(),
  upsertCreditBalance: vi.fn()
}));

vi.mock('@cio/db/queries/organization', () => ({
  getActiveOrganizationPlan: vi.fn()
}));

import { recordFlatCostUnits, recordTokenUsage } from '@cio/core/services/agent/usage';
import { insertTokenUsageAndDrainCredits } from '@cio/db/queries/agent';
import { getActiveOrganizationPlan } from '@cio/db/queries/organization';

const ORG_ID = 'org-1';
const USER_ID = 'user-1';
const COURSE_ID = 'course-1';

describe('recordFlatCostUnits', () => {
  beforeEach(() => {
    vi.mocked(insertTokenUsageAndDrainCredits).mockReset();
    vi.mocked(getActiveOrganizationPlan).mockResolvedValue({
      planName: 'EARLY_ADOPTER',
      payload: null
    } as unknown as Awaited<ReturnType<typeof getActiveOrganizationPlan>>);
  });

  it('records the charge in cost_units and leaves both token columns at zero', async () => {
    await recordFlatCostUnits(ORG_ID, USER_ID, COURSE_ID, 6_000, 'supadata-youtube-captions');

    expect(insertTokenUsageAndDrainCredits).toHaveBeenCalledTimes(1);
    expect(vi.mocked(insertTokenUsageAndDrainCredits).mock.calls[0][0]).toMatchObject({
      orgId: ORG_ID,
      userId: USER_ID,
      courseId: COURSE_ID,
      promptTokens: 0,
      completionTokens: 0,
      costUnits: 6_000,
      model: 'supadata-youtube-captions'
    });
  });

  it('passes the plan allowance through so purchased credits drain past it', async () => {
    await recordFlatCostUnits(ORG_ID, USER_ID, COURSE_ID, 6_000, 'supadata-youtube-captions');

    // EARLY_ADOPTER allowance, unchanged by the flat charge.
    expect(vi.mocked(insertTokenUsageAndDrainCredits).mock.calls[0][0].planAllowance).toBe(3_000_000);
  });

  it.each([0, -1])('writes nothing for a non-positive charge of %s', async (costUnits) => {
    await recordFlatCostUnits(ORG_ID, USER_ID, COURSE_ID, costUnits, 'supadata-youtube-captions');

    expect(insertTokenUsageAndDrainCredits).not.toHaveBeenCalled();
  });

  it('does not apply the model cost multiplier — a flat charge is already in cost units', async () => {
    await recordFlatCostUnits(ORG_ID, USER_ID, COURSE_ID, 6_000, 'claude-sonnet-4-6');

    expect(vi.mocked(insertTokenUsageAndDrainCredits).mock.calls[0][0].costUnits).toBe(6_000);
  });

  it('differs from recordTokenUsage, which derives cost units from token counts', async () => {
    await recordTokenUsage(
      ORG_ID,
      USER_ID,
      COURSE_ID,
      { promptTokens: 1_000, completionTokens: 500, totalTokens: 1_500 },
      'kimi-k2.6'
    );

    expect(vi.mocked(insertTokenUsageAndDrainCredits).mock.calls[0][0]).toMatchObject({
      promptTokens: 1_000,
      completionTokens: 500,
      costUnits: 1_500 // (1000 + 500) x 1
    });
  });
});
