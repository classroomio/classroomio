import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getUserEnrolled: vi.fn()
}));

vi.mock('@api/services/organization', () => ({
  getUserEnrolled: mocks.getUserEnrolled
}));

import { listEnrolledService } from '../enrolled';

const ORG_ID = '11111111-1111-1111-1111-111111111111';
const PROFILE_ID = '22222222-2222-2222-2222-222222222222';

describe('v1 enrolled service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getUserEnrolled.mockResolvedValue({
      items: [{ kind: 'course', data: { id: 'course-1' } }],
      total: 25,
      counts: { inProgress: 20, completed: 5 }
    });
  });

  it('delegates to the shared enrolled feed scoped by organization and learner', async () => {
    const result = await listEnrolledService(ORG_ID, {
      profileId: PROFILE_ID,
      page: 1,
      limit: 12,
      status: 'all'
    });

    expect(mocks.getUserEnrolled).toHaveBeenCalledWith(ORG_ID, PROFILE_ID, {
      page: 1,
      limit: 12,
      status: 'all'
    });
    expect(result).toEqual({
      data: [{ kind: 'course', data: { id: 'course-1' } }],
      pagination: { page: 1, limit: 12, total: 25, totalPages: 3 },
      counts: { inProgress: 20, completed: 5 }
    });
  });

  it('passes status and trimmed search through to the feed', async () => {
    await listEnrolledService(ORG_ID, {
      profileId: PROFILE_ID,
      page: 3,
      limit: 10,
      status: 'completed',
      search: 'excel'
    });

    expect(mocks.getUserEnrolled).toHaveBeenCalledWith(ORG_ID, PROFILE_ID, {
      page: 3,
      limit: 10,
      status: 'completed',
      search: 'excel'
    });
  });
});
