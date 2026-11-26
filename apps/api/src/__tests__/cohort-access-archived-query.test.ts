import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PgDialect } from 'drizzle-orm/pg-core';

const mocks = vi.hoisted(() => {
  const selectQuery = {
    from: vi.fn(),
    innerJoin: vi.fn(),
    where: vi.fn(),
    limit: vi.fn(),
    orderBy: vi.fn()
  };
  return { db: { select: vi.fn(() => selectQuery) }, selectQuery };
});

vi.mock('@db/drizzle', () => ({ db: mocks.db }));
vi.mock('@cio/db/drizzle', () => ({ db: mocks.db }));

import { getCohortMemberByProfileId, getEnrolledCohortsByProfile } from '@cio/db/queries/cohort/cohort';
import { getAssignmentsForProfile } from '@cio/db/queries/cohort/goal';

function renderWhere() {
  const [predicate] = mocks.selectQuery.where.mock.calls[0];
  return new PgDialect().sqlToQuery(predicate).sql;
}

describe('cohort access queries require an active org membership for students', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.selectQuery.from.mockReturnValue(mocks.selectQuery);
    mocks.selectQuery.innerJoin.mockReturnValue(mocks.selectQuery);
    mocks.selectQuery.where.mockReturnValue(mocks.selectQuery);
    mocks.selectQuery.limit.mockResolvedValue([]);
    mocks.selectQuery.orderBy.mockResolvedValue([]);
  });

  it('checks the org member status on the access lookup', async () => {
    await getCohortMemberByProfileId('cohort-1', 'profile-1');

    const sql = renderWhere();
    expect(sql).toContain('NOT EXISTS');
    expect(sql).toContain('"organizationmember"."status" = \'ARCHIVED\'');
    expect(sql).toContain('"cohort_member"."role_id" <> $');
    expect(sql).toContain('OR EXISTS');
    expect(sql).toContain('"organizationmember"."status" = \'ACTIVE\'');
    expect(sql).toContain('"cohort"."organization_id"');
  });

  it('checks the org member status on the enrolled cohorts list', async () => {
    await getEnrolledCohortsByProfile('profile-1');

    const sql = renderWhere();
    expect(sql).toContain('"organizationmember"."status" = \'ACTIVE\'');
  });

  it('checks the org member status on the my goals list', async () => {
    mocks.selectQuery.where.mockResolvedValueOnce([]);

    await getAssignmentsForProfile('profile-1');

    const sql = renderWhere();
    expect(sql).toContain('"organizationmember"."status" = \'ACTIVE\'');
  });
});
