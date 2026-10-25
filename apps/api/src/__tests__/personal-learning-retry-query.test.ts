import { beforeEach, describe, expect, it, vi } from 'vitest';

const { db, updateValues } = vi.hoisted(() => {
  const result = { journey: { id: 'journey-1' }, session: { id: 'session-1', status: 'failed', attempt: 3 } };
  const updateValues: Record<string, unknown>[] = [];
  type SelectBuilder = {
    from: (...args: unknown[]) => SelectBuilder;
    innerJoin: (...args: unknown[]) => SelectBuilder;
    where: (...args: unknown[]) => SelectBuilder;
    for: (...args: unknown[]) => SelectBuilder;
    limit: (...args: unknown[]) => Promise<Array<typeof result>>;
  };
  const selectBuilder: SelectBuilder = {
    from: () => selectBuilder,
    innerJoin: () => selectBuilder,
    where: () => selectBuilder,
    for: () => selectBuilder,
    limit: async () => [result]
  };
  const updatedRows = [
    { id: 'journey-1' },
    { id: 'session-1', status: 'queued', attempt: 4, retryCount: 0 },
    { id: 'session-1', status: 'sourcing', attempt: 5, retryCount: 2 }
  ];
  const transactionClient = {
    select: vi.fn(() => selectBuilder),
    update: vi.fn(() => {
      const updateIndex = updateValues.length;
      return {
        set: vi.fn((values: Record<string, unknown>) => {
          updateValues.push(values);
          return {
            where: vi.fn(() => ({ returning: vi.fn(async () => [updatedRows[updateIndex]]) }))
          };
        })
      };
    })
  };

  return {
    updateValues,
    db: {
      ...transactionClient,
      transaction: vi.fn(async (callback: (client: typeof transactionClient) => unknown) => callback(transactionClient))
    }
  };
});

vi.mock('@db/drizzle', () => ({ db }));

import { claimPersonalLearningSession, retryPersonalLearningSessionForOwner } from '@cio/db/queries/personal-learning';

describe('retryPersonalLearningSessionForOwner', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    updateValues.length = 0;
  });

  it('resets the retry budget without resetting the fencing attempt', async () => {
    const result = await retryPersonalLearningSessionForOwner('owner-1', 'journey-1', []);
    const sessionUpdate = updateValues[1];

    expect(result?.session).toMatchObject({ status: 'queued', attempt: 4, retryCount: 0 });
    expect(sessionUpdate).toMatchObject({ status: 'queued', failureCode: null, retryCount: 0 });
    expect(sessionUpdate.attempt).toBeDefined();
    expect(sessionUpdate.attempt).not.toBe(0);
  });

  it('increments the retry budget for every claimed attempt', async () => {
    await claimPersonalLearningSession('session-1');
    const claimUpdate = updateValues[0];

    expect(claimUpdate).toMatchObject({ status: 'sourcing' });
    expect(claimUpdate.attempt).toBeDefined();
    expect(claimUpdate.retryCount).toBeDefined();
    expect(claimUpdate.retryCount).not.toBe(0);
  });
});
