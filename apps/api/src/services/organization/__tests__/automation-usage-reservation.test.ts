import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => {
  const counts: number[] = [];
  const selectQuery = {
    from: vi.fn(),
    where: vi.fn(() => Promise.resolve([{ total: counts.shift() ?? 0 }]))
  };
  const insertQuery = { values: vi.fn(), returning: vi.fn() };
  const tx = {
    execute: vi.fn(),
    select: vi.fn(() => selectQuery),
    insert: vi.fn(() => insertQuery)
  };

  return {
    counts,
    selectQuery,
    insertQuery,
    tx,
    db: { transaction: vi.fn((callback: (client: typeof tx) => unknown) => callback(tx)) }
  };
});

vi.mock('@db/drizzle', () => ({ db: mocks.db }));
vi.mock('@cio/db/drizzle', () => ({ db: mocks.db }));

import { reserveOrganizationAutomationUsage } from '@cio/db/queries/organization/automation-usage';

const input = {
  organizationId: 'org-1',
  organizationApiKeyId: 'key-1',
  type: 'mcp' as const,
  category: 'write' as const,
  action: 'pending POST',
  since: '2026-09-26T00:00:00.000Z',
  keyLimit: 2,
  orgLimit: 5
};

describe('reserveOrganizationAutomationUsage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.counts.length = 0;
    mocks.selectQuery.from.mockReturnValue(mocks.selectQuery);
    mocks.insertQuery.values.mockReturnValue(mocks.insertQuery);
    mocks.insertQuery.returning.mockResolvedValue([{ id: 'reservation-1' }]);
  });

  it('takes the per-org lock, then counts and inserts inside the same transaction', async () => {
    mocks.counts.push(1, 4);

    const result = await reserveOrganizationAutomationUsage(input);

    expect(result).toBe('reservation-1');
    expect(mocks.tx.execute).toHaveBeenCalledTimes(1);
    expect(mocks.tx.execute.mock.invocationCallOrder[0]).toBeLessThan(mocks.tx.select.mock.invocationCallOrder[0]!);
    expect(mocks.tx.insert).toHaveBeenCalled();
    expect(mocks.insertQuery.values).toHaveBeenCalledWith(
      expect.objectContaining({ organizationId: 'org-1', organizationApiKeyId: 'key-1', category: 'write' })
    );
  });

  it.each([
    ['the key', [2, 0]],
    ['the organization', [0, 5]]
  ])('returns null without inserting when %s is at its limit', async (_label, counts) => {
    mocks.counts.push(...counts);

    const result = await reserveOrganizationAutomationUsage(input);

    expect(result).toBeNull();
    expect(mocks.tx.insert).not.toHaveBeenCalled();
  });

  it('throws when the lock or insert fails, so the caller can fail closed', async () => {
    mocks.tx.execute.mockRejectedValueOnce(new Error('lock timeout'));

    await expect(reserveOrganizationAutomationUsage(input)).rejects.toThrow(
      'Failed to reserve organization automation usage'
    );
  });
});
