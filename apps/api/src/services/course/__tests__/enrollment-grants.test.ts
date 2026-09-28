import { describe, expect, it, vi } from 'vitest';

vi.mock('@cio/db/queries/learning-path', () => ({
  grantCourseAccess: vi.fn().mockResolvedValue({ id: 'grant-1' })
}));

import { recordDirectCourseGrant, recordDirectCourseGrantsBulk } from '../enrollment-grants';
import { grantCourseAccess } from '@cio/db/queries/learning-path';

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
    const execute = vi.fn().mockResolvedValue({ rows: [{ id: 'grant-1' }, { id: 'grant-2' }] });

    const inserted = await recordDirectCourseGrantsBulk(
      { groupIds: ['g-1'], profileIds: ['p-1', 'p-2'], courseIds: ['c-1'], source: 'ORG_AUDIENCE' },
      { execute } as never
    );

    expect(inserted).toBe(2);
    expect(execute).toHaveBeenCalledTimes(1);
  });
});
