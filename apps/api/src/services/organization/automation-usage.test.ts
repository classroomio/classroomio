import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { TOrganizationApiKey } from '@db/types';

const mocks = vi.hoisted(() => ({
  createOrganizationAutomationUsage: vi.fn()
}));

vi.mock('@cio/db/queries/organization', () => ({
  countActiveOrganizationApiKeys: vi.fn(),
  countOrganizationAutomationUsageSince: vi.fn(),
  countOrganizationAutomationUsageSinceByKey: vi.fn(),
  createOrganizationAutomationUsage: mocks.createOrganizationAutomationUsage,
  getActiveOrganizationPlan: vi.fn(),
  listRecentOrganizationAutomationUsage: vi.fn()
}));

import { recordMcpAutomationUsage } from './automation-usage';

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

  it('records zero credits for a free-tier tool', async () => {
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
