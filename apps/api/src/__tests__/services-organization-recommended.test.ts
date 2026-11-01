import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@cio/db/queries/course', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@cio/db/queries/course')>()),
  getExploreCourses: vi.fn().mockResolvedValue({ data: [], total: 0 })
}));

import { getExploreCourses } from '@cio/db/queries/course';
import { getRecommendedCourses } from '@api/services/organization';
import { ZGetRecommendedCourses } from '@cio/utils/validation/course';

describe('getRecommendedCourses', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('sorts in the query so every page follows the same order', async () => {
    await getRecommendedCourses('org-1', 'user-1', 12, 2, 'name', 'asc');

    expect(getExploreCourses).toHaveBeenCalledWith({
      orgId: 'org-1',
      profileId: 'user-1',
      limit: 12,
      page: 2,
      sortKey: 'name',
      order: 'asc'
    });
  });

  it('keeps the default order when no sort is given', async () => {
    await getRecommendedCourses('org-1', 'user-1', 12, 1);

    expect(getExploreCourses).toHaveBeenCalledWith(expect.objectContaining({ sortKey: undefined, order: undefined }));
  });
});

describe('ZGetRecommendedCourses', () => {
  it('accepts the course sorts and rejects others', () => {
    expect(ZGetRecommendedCourses.parse({ sort: 'price', order: 'desc' })).toMatchObject({
      sort: 'price',
      order: 'desc'
    });
    expect(ZGetRecommendedCourses.safeParse({ sort: 'popularity' }).success).toBe(false);
    expect(ZGetRecommendedCourses.safeParse({ order: 'up' }).success).toBe(false);
  });
});
