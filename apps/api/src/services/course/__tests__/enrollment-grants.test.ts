import { describe, expect, it, vi } from 'vitest';
import { is, Param, SQL } from 'drizzle-orm';

vi.mock('@cio/db/queries/learning-path', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@cio/db/queries/learning-path')>();

  return {
    ...actual,
    grantCourseAccess: vi.fn().mockResolvedValue({ id: 'grant-1' })
  };
});

import { recordDirectCourseGrant, recordDirectCourseGrantsBulk } from '../enrollment-grants';
import { grantCourseAccess } from '@cio/db/queries/learning-path';

/** Collects single bind values from a drizzle SQLWrapper, descending into nested fragments. */
function collectParamValues(node: unknown, out: unknown[]): void {
  if (is(node, Param)) {
    out.push((node as Param).value);

    return;
  }

  if (is(node, SQL)) {
    for (const chunk of (node as SQL).queryChunks) {
      collectParamValues(chunk, out);
    }

    return;
  }

  if (Array.isArray(node)) {
    for (const chunk of node) {
      collectParamValues(chunk, out);
    }
  }
}

describe('direct course grant helpers', () => {
  it('records a single grant through the idempotent upsert', async () => {
    await recordDirectCourseGrant(
      { groupmemberId: 'gm-1', courseId: 'c-1', profileId: 'p-1' },
      { source: 'SELF_ENROLL' }
    );

    expect(vi.mocked(grantCourseAccess)).toHaveBeenCalledWith(
      expect.objectContaining({
        groupmemberId: 'gm-1',
        courseId: 'c-1',
        profileId: 'p-1',
        source: 'SELF_ENROLL'
      }),
      expect.anything()
    );
  });

  it('bulk path skips empty inputs without touching the database', async () => {
    const execute = vi.fn();

    expect(
      await recordDirectCourseGrantsBulk(
        { groupIds: [], profileIds: ['p-1'], courseIds: ['c-1'], source: 'ORG_AUDIENCE' },
        { execute } as never
      )
    ).toBe(0);
    expect(
      await recordDirectCourseGrantsBulk(
        { groupIds: ['g-1'], profileIds: [], courseIds: ['c-1'], source: 'ORG_AUDIENCE' },
        { execute } as never
      )
    ).toBe(0);
    expect(execute).not.toHaveBeenCalled();
  });

  it('bulk path inserts missing grants and reports the count', async () => {
    const execute = vi.fn().mockResolvedValue([{ id: 'grant-1' }, { id: 'grant-2' }]);

    const inserted = await recordDirectCourseGrantsBulk(
      { groupIds: ['g-1'], profileIds: ['p-1', 'p-2'], courseIds: ['c-1'], source: 'ORG_AUDIENCE' },
      { execute } as never
    );

    expect(inserted).toBe(2);
    expect(execute).toHaveBeenCalledTimes(1);
  });

  it('bulk path binds id lists as single array params for ANY()', async () => {
    const execute = vi.fn().mockResolvedValue([]);

    await recordDirectCourseGrantsBulk(
      { groupIds: ['g-1', 'g-2'], profileIds: ['p-1'], courseIds: ['c-1', 'c-2'], source: 'ORG_AUDIENCE' },
      { execute } as never
    );

    expect(execute).toHaveBeenCalledTimes(1);
    const values: unknown[] = [];
    collectParamValues(execute.mock.calls[0][0], values);

    // A bare `${array}` in drizzle's `sql` tag spreads into scalar params
    // (`ANY(($5))`), which Postgres rejects with `malformed array literal`.
    expect(values).toContainEqual(['g-1', 'g-2']);
    expect(values).toContainEqual(['p-1']);
    expect(values).toContainEqual(['c-1', 'c-2']);
  });
});

describe('backfill row-count helpers (postgres-js array shape)', () => {
  it('bulk insert counts rows from a bare array (postgres-js)', async () => {
    const execute = vi.fn().mockResolvedValue([{ id: 'a' }]);
    const inserted = await recordDirectCourseGrantsBulk(
      { groupIds: ['g-1'], profileIds: ['p-1'], courseIds: ['c-1'], source: 'ORG_AUDIENCE' },
      { execute } as never
    );
    expect(inserted).toBe(1);
  });

  it('bulk insert still counts legacy { rows } shape', async () => {
    const execute = vi.fn().mockResolvedValue({ rows: [{ id: 'a' }, { id: 'b' }] });
    const inserted = await recordDirectCourseGrantsBulk(
      { groupIds: ['g-1'], profileIds: ['p-1'], courseIds: ['c-1'], source: 'ORG_AUDIENCE' },
      { execute } as never
    );
    expect(inserted).toBe(2);
  });

  it('count helpers read total from array and legacy shapes', async () => {
    const { countMissingCourseEnrollmentGrants, countMissingCohortCourseEnrollmentGrants } = await import(
      '@cio/db/queries/learning-path/enrollment-grant'
    );

    const arrayClient = { execute: vi.fn().mockResolvedValue([{ total: 5 }]) } as never;
    await expect(countMissingCourseEnrollmentGrants(undefined, arrayClient)).resolves.toBe(5);

    const legacyClient = { execute: vi.fn().mockResolvedValue({ rows: [{ total: 3 }] }) } as never;
    await expect(countMissingCohortCourseEnrollmentGrants(undefined, legacyClient)).resolves.toBe(3);

    const stringTotal = { execute: vi.fn().mockResolvedValue([{ total: '7' }]) } as never;
    await expect(countMissingCourseEnrollmentGrants(undefined, stringTotal)).resolves.toBe(7);
  });
});
