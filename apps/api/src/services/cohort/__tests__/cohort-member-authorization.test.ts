import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PgDialect } from 'drizzle-orm/pg-core';

const mocks = vi.hoisted(() => {
  const deleteQuery = { where: vi.fn(), returning: vi.fn() };
  const updateQuery = { set: vi.fn(), where: vi.fn(), returning: vi.fn() };

  return {
    db: {
      delete: vi.fn(() => deleteQuery),
      update: vi.fn(() => updateQuery)
    },
    deleteQuery,
    updateQuery
  };
});

vi.mock('@db/drizzle', () => ({ db: mocks.db }));
vi.mock('@cio/db/drizzle', () => ({ db: mocks.db }));

import { removeCohortMember, updateCohortMember } from '@cio/db/queries/cohort/cohort';

describe('cohort member authorization scope', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.deleteQuery.where.mockReturnValue(mocks.deleteQuery);
    mocks.deleteQuery.returning.mockResolvedValue([]);
    mocks.updateQuery.set.mockReturnValue(mocks.updateQuery);
    mocks.updateQuery.where.mockReturnValue(mocks.updateQuery);
    mocks.updateQuery.returning.mockResolvedValue([]);
  });

  it('scopes member updates to the requested cohort', async () => {
    await updateCohortMember('cohort-1', 'member-1', { roleId: 2 });

    expect(mocks.db.update).toHaveBeenCalledWith(expect.anything());
    expect(mocks.updateQuery.set).toHaveBeenCalledWith({ roleId: 2 });

    const [predicate] = mocks.updateQuery.where.mock.calls[0];
    const query = new PgDialect().sqlToQuery(predicate);
    expect(query.sql).toContain('"cohort_member"."id"');
    expect(query.sql).toContain('"cohort_member"."cohort_id"');
    expect(query.params).toEqual(expect.arrayContaining(['member-1', 'cohort-1']));
  });

  it('scopes member removal to the requested cohort', async () => {
    await removeCohortMember('cohort-1', 'member-1');

    expect(mocks.db.delete).toHaveBeenCalledWith(expect.anything());

    const [predicate] = mocks.deleteQuery.where.mock.calls[0];
    const query = new PgDialect().sqlToQuery(predicate);
    expect(query.sql).toContain('"cohort_member"."id"');
    expect(query.sql).toContain('"cohort_member"."cohort_id"');
    expect(query.params).toEqual(expect.arrayContaining(['member-1', 'cohort-1']));
  });
});
