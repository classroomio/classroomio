import { describe, expect, it, vi } from 'vitest';

import { pageJoinedThenInvited } from '@api/utils/joined-then-invited-page';

function listOf(prefix: string, count: number) {
  return Array.from({ length: count }, (_, index) => `${prefix}${index + 1}`);
}

function slicer(rows: string[]) {
  return vi.fn(async (offset: number, limit: number) => ({
    items: rows.slice(offset, offset + limit),
    total: rows.length
  }));
}

describe('pageJoinedThenInvited', () => {
  const joinedRows = listOf('j', 5);
  const invitedRows = listOf('i', 4);

  it('fills a page with joined rows only and still counts the invited ones', async () => {
    const fetchJoined = slicer(joinedRows);
    const fetchInvited = slicer(invitedRows);

    const result = await pageJoinedThenInvited({ page: 1, limit: 3, fetchJoined, fetchInvited });

    expect(result).toEqual({ joined: ['j1', 'j2', 'j3'], invited: [], total: 9 });
    expect(fetchInvited).toHaveBeenCalledWith(0, 0);
  });

  it('continues a page with invited rows once the joined rows run out', async () => {
    const result = await pageJoinedThenInvited({
      page: 2,
      limit: 3,
      fetchJoined: slicer(joinedRows),
      fetchInvited: slicer(invitedRows)
    });

    expect(result).toEqual({ joined: ['j4', 'j5'], invited: ['i1'], total: 9 });
  });

  it('offsets into the invited rows on pages past the joined ones', async () => {
    const fetchInvited = slicer(invitedRows);

    const result = await pageJoinedThenInvited({ page: 3, limit: 3, fetchJoined: slicer(joinedRows), fetchInvited });

    expect(result).toEqual({ joined: [], invited: ['i2', 'i3', 'i4'], total: 9 });
    expect(fetchInvited).toHaveBeenCalledWith(1, 3);
  });

  it('lists only invited rows when nobody has joined', async () => {
    const result = await pageJoinedThenInvited({
      page: 1,
      limit: 10,
      fetchJoined: slicer([]),
      fetchInvited: slicer(invitedRows)
    });

    expect(result).toEqual({ joined: [], invited: invitedRows, total: 4 });
  });
});
