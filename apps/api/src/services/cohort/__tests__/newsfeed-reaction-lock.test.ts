import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PgDialect } from 'drizzle-orm/pg-core';

const mocks = vi.hoisted(() => {
  const selectQuery = { from: vi.fn(), where: vi.fn(), for: vi.fn() };
  const updateQuery = { set: vi.fn(), where: vi.fn(), returning: vi.fn() };
  const tx = { select: vi.fn(() => selectQuery), update: vi.fn(() => updateQuery) };

  return {
    db: { transaction: vi.fn((callback: (client: typeof tx) => unknown) => callback(tx)) },
    selectQuery,
    updateQuery,
    tx
  };
});

vi.mock('@db/drizzle', () => ({ db: mocks.db }));
vi.mock('@cio/db/drizzle', () => ({ db: mocks.db }));

import { updateCohortNewsfeedReactionLocked } from '@cio/db/queries/cohort/cohort';

describe('updateCohortNewsfeedReactionLocked', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.selectQuery.from.mockReturnValue(mocks.selectQuery);
    mocks.selectQuery.where.mockReturnValue(mocks.selectQuery);
    mocks.updateQuery.set.mockReturnValue(mocks.updateQuery);
    mocks.updateQuery.where.mockReturnValue(mocks.updateQuery);
    mocks.updateQuery.returning.mockResolvedValue([{ id: 'feed-1' }]);
  });

  it('locks the post row, then writes the updated reaction in the same transaction', async () => {
    const current = { clap: ['a'], smile: [], thumbsup: [], thumbsdown: [] };
    const next = { clap: ['a', 'b'], smile: [], thumbsup: [], thumbsdown: [] };
    mocks.selectQuery.for.mockResolvedValue([{ reaction: current }]);
    const update = vi.fn().mockReturnValue(next);

    const result = await updateCohortNewsfeedReactionLocked('cohort-1', 'feed-1', update);

    expect(mocks.selectQuery.for).toHaveBeenCalledWith('update');
    expect(update).toHaveBeenCalledWith(current);
    expect(mocks.updateQuery.set).toHaveBeenCalledWith({ reaction: next });
    expect(result).toEqual({ id: 'feed-1' });

    const query = new PgDialect().sqlToQuery(mocks.selectQuery.where.mock.calls[0][0]);
    expect(query.sql).toContain('"cohort_newsfeed"."cohort_id"');
    expect(query.params).toEqual(expect.arrayContaining(['feed-1', 'cohort-1']));
  });

  it('returns null without writing when the post is not in the cohort', async () => {
    mocks.selectQuery.for.mockResolvedValue([]);

    const result = await updateCohortNewsfeedReactionLocked('cohort-1', 'feed-1', vi.fn());

    expect(result).toBeNull();
    expect(mocks.tx.update).not.toHaveBeenCalled();
  });
});
