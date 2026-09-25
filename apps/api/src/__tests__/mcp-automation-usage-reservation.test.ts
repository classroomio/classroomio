import { beforeEach, describe, expect, it, vi } from 'vitest';

const { fakeTx } = vi.hoisted(() => ({ fakeTx: { tx: true } }));

vi.mock('@cio/core/config/env', () => ({ env: { PUBLIC_IS_SELFHOSTED: 'false' } }));

vi.mock('@cio/db/drizzle', () => ({
  db: { transaction: vi.fn(async (callback: (tx: unknown) => unknown) => callback(fakeTx)) }
}));

vi.mock('@cio/db/queries/organization', () => ({
  countActiveOrganizationApiKeys: vi.fn(),
  countOrganizationAutomationUsageSince: vi.fn(),
  countOrganizationAutomationUsageSinceByKey: vi.fn(),
  createOrganizationAutomationUsage: vi.fn(),
  deleteOrganizationAutomationUsage: vi.fn(),
  getActiveOrganizationPlan: vi.fn(),
  listRecentOrganizationAutomationUsage: vi.fn(),
  lockOrganizationAutomationUsage: vi.fn()
}));

import type { TOrganizationApiKey } from '@cio/db/types';
import { getMcpAutomationLimits } from '@cio/utils/plans';
import { db } from '@cio/db/drizzle';
import {
  countOrganizationAutomationUsageSince,
  countOrganizationAutomationUsageSinceByKey,
  createOrganizationAutomationUsage,
  deleteOrganizationAutomationUsage,
  getActiveOrganizationPlan,
  lockOrganizationAutomationUsage
} from '@cio/db/queries/organization';
import { releaseMcpAutomationUsage, reserveMcpAutomationUsage } from '@api/services/organization/automation-usage';

const mcpKey = { id: 'key-1', organizationId: 'org-1', type: 'mcp' } as TOrganizationApiKey;
const basicLimits = getMcpAutomationLimits('BASIC').rateLimits;

type TUsageRow = Awaited<ReturnType<typeof createOrganizationAutomationUsage>>;
type TPlanRow = Awaited<ReturnType<typeof getActiveOrganizationPlan>>;

describe('reserveMcpAutomationUsage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getActiveOrganizationPlan).mockResolvedValue({ planName: 'BASIC' } as unknown as TPlanRow);
    vi.mocked(countOrganizationAutomationUsageSinceByKey).mockResolvedValue(0);
    vi.mocked(countOrganizationAutomationUsageSince).mockResolvedValue(0);
    vi.mocked(createOrganizationAutomationUsage).mockResolvedValue({ id: 'usage-1' } as TUsageRow);
  });

  it('locks, checks, and records the usage in one transaction and returns the reservation id', async () => {
    const callOrder: string[] = [];
    vi.mocked(lockOrganizationAutomationUsage).mockImplementation(async () => {
      callOrder.push('lock');
    });
    vi.mocked(countOrganizationAutomationUsageSinceByKey).mockImplementation(async () => {
      callOrder.push('count');
      return 0;
    });
    vi.mocked(createOrganizationAutomationUsage).mockImplementation(async () => {
      callOrder.push('insert');
      return { id: 'usage-1' } as TUsageRow;
    });

    const usageId = await reserveMcpAutomationUsage(mcpKey, 'update_course_certificate', { courseId: 'course-1' });

    expect(usageId).toBe('usage-1');
    expect(db.transaction).toHaveBeenCalledTimes(1);
    expect(callOrder).toEqual(['lock', 'count', 'insert']);
    expect(lockOrganizationAutomationUsage).toHaveBeenCalledWith('org-1', 'mcp', fakeTx);
    expect(countOrganizationAutomationUsageSinceByKey).toHaveBeenCalledWith(
      'key-1',
      'write',
      expect.any(String),
      fakeTx
    );
    expect(countOrganizationAutomationUsageSince).toHaveBeenCalledWith(
      'org-1',
      'mcp',
      'write',
      expect.any(String),
      fakeTx
    );
    expect(createOrganizationAutomationUsage).toHaveBeenCalledWith(
      expect.objectContaining({
        organizationId: 'org-1',
        organizationApiKeyId: 'key-1',
        action: 'update_course_certificate',
        category: 'write',
        metadata: { courseId: 'course-1' }
      }),
      fakeTx
    );
  });

  it('throws 429 without recording when the key has used its limit', async () => {
    vi.mocked(countOrganizationAutomationUsageSinceByKey).mockResolvedValue(basicLimits.perKey.readPerMinute);

    await expect(reserveMcpAutomationUsage(mcpKey, 'get_course_certificate')).rejects.toMatchObject({
      statusCode: 429
    });
    expect(createOrganizationAutomationUsage).not.toHaveBeenCalled();
  });

  it('throws 429 without recording when the organization has used its limit', async () => {
    vi.mocked(countOrganizationAutomationUsageSince).mockResolvedValue(basicLimits.perOrg.writePerMinute);

    await expect(reserveMcpAutomationUsage(mcpKey, 'update_course_certificate')).rejects.toMatchObject({
      statusCode: 429
    });
    expect(createOrganizationAutomationUsage).not.toHaveBeenCalled();
  });

  it('allows the last call under the limit', async () => {
    vi.mocked(countOrganizationAutomationUsageSinceByKey).mockResolvedValue(basicLimits.perKey.writePerMinute - 1);

    await expect(reserveMcpAutomationUsage(mcpKey, 'update_course_certificate')).resolves.toBe('usage-1');
  });

  it.each([
    ['taking the lock', () => vi.mocked(lockOrganizationAutomationUsage)],
    ['counting usage', () => vi.mocked(countOrganizationAutomationUsageSince)],
    ['recording usage', () => vi.mocked(createOrganizationAutomationUsage)]
  ])('fails closed when %s fails', async (_step, getMock) => {
    getMock().mockRejectedValue(new Error('database unavailable'));

    await expect(reserveMcpAutomationUsage(mcpKey, 'update_course_certificate')).rejects.toThrow(
      'database unavailable'
    );
  });
});

describe('releaseMcpAutomationUsage', () => {
  it('deletes the reserved usage row', async () => {
    await releaseMcpAutomationUsage('usage-1');

    expect(deleteOrganizationAutomationUsage).toHaveBeenCalledWith('usage-1');
  });
});
