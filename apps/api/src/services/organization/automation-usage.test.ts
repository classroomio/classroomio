import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { TOrganizationApiKey } from '@db/types';

const mocks = vi.hoisted(() => ({
  createOrganizationAutomationUsage: vi.fn(),
  reserveOrganizationAutomationUsage: vi.fn(),
  getActiveOrganizationPlan: vi.fn()
}));

vi.mock('@cio/db/queries/organization', () => ({
  countActiveOrganizationApiKeys: vi.fn(),
  countOrganizationAutomationUsageSince: vi.fn(),
  countOrganizationAutomationUsageSinceByKey: vi.fn(),
  completeOrganizationAutomationUsage: vi.fn(),
  createOrganizationAutomationUsage: mocks.createOrganizationAutomationUsage,
  getActiveOrganizationPlan: mocks.getActiveOrganizationPlan,
  listRecentOrganizationAutomationUsage: vi.fn(),
  releaseOrganizationAutomationUsage: vi.fn(),
  reserveOrganizationAutomationUsage: mocks.reserveOrganizationAutomationUsage
}));

import { recordMcpAutomationUsage, reserveMcpAutomationUsage } from './automation-usage';
import { getMcpAutomationLimits } from '@cio/utils/plans';

const automationKey = {
  id: 'key-id',
  organizationId: 'org-id',
  type: 'mcp'
} as TOrganizationApiKey;

describe('recordMcpAutomationUsage', () => {
  beforeEach(() => {
    mocks.createOrganizationAutomationUsage.mockReset();
  });

  it('records the credit cost defined for the tool', async () => {
    await recordMcpAutomationUsage(automationKey, 'create_cohort_goal', { cohortId: 'cohort-id' });

    expect(mocks.createOrganizationAutomationUsage).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'create_cohort_goal',
        category: 'write',
        creditsConsumed: 1
      })
    );
  });

  it('records zero credits for a read tool', async () => {
    await recordMcpAutomationUsage(automationKey, 'list_cohort_goals');

    expect(mocks.createOrganizationAutomationUsage).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'list_cohort_goals',
        category: 'read',
        creditsConsumed: 0
      })
    );
  });
});

describe('reserveMcpAutomationUsage', () => {
  beforeEach(() => {
    mocks.reserveOrganizationAutomationUsage.mockReset();
    mocks.getActiveOrganizationPlan.mockResolvedValue(null);
  });

  it("reserves a slot with the plan's per-key and per-org limits for the category", async () => {
    mocks.reserveOrganizationAutomationUsage.mockResolvedValue('reservation-id');
    const { perKey, perOrg } = getMcpAutomationLimits('BASIC').rateLimits;

    const reservationId = await reserveMcpAutomationUsage(automationKey, 'write', 'pending POST');

    expect(reservationId).toBe('reservation-id');
    expect(mocks.reserveOrganizationAutomationUsage).toHaveBeenCalledWith(
      expect.objectContaining({
        organizationId: 'org-id',
        organizationApiKeyId: 'key-id',
        type: 'mcp',
        category: 'write',
        keyLimit: perKey.writePerMinute,
        orgLimit: perOrg.writePerMinute
      })
    );
  });

  it('returns 429 when the atomic reservation finds the limit reached', async () => {
    mocks.reserveOrganizationAutomationUsage.mockResolvedValue(null);

    await expect(reserveMcpAutomationUsage(automationKey, 'read', 'pending GET')).rejects.toMatchObject({
      statusCode: 429,
      code: 'AUTOMATION_RATE_LIMIT_EXCEEDED'
    });
  });

  it('fails closed with 503 when the reservation cannot be recorded', async () => {
    mocks.reserveOrganizationAutomationUsage.mockRejectedValue(new Error('connection refused'));

    await expect(reserveMcpAutomationUsage(automationKey, 'read', 'pending GET')).rejects.toMatchObject({
      statusCode: 503,
      code: 'AUTOMATION_USAGE_UNAVAILABLE'
    });
  });
});
