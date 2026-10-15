import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getUserEnrolled: vi.fn(),
  getOrganizationMemberRoleId: vi.fn()
}));

vi.mock('@api/services/organization', () => ({
  getUserEnrolled: mocks.getUserEnrolled
}));

vi.mock('@cio/db/queries/organization', () => ({
  getOrganizationMemberRoleId: mocks.getOrganizationMemberRoleId
}));

import { listEnrolledService } from '../enrolled';

const ORG_ID = '11111111-1111-1111-1111-111111111111';
const ACTOR_ID = '22222222-2222-2222-2222-222222222222';

describe('v1 enrolled service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getOrganizationMemberRoleId.mockResolvedValue(3);
    mocks.getUserEnrolled.mockResolvedValue({
      items: [{ kind: 'course', data: { id: 'course-1' } }],
      total: 25,
      counts: { inProgress: 20, completed: 5 }
    });
  });

  it('returns the key creator own feed scoped by organization and learner', async () => {
    const result = await listEnrolledService(ORG_ID, ACTOR_ID, {
      page: 1,
      limit: 20,
      status: 'all'
    });

    expect(mocks.getOrganizationMemberRoleId).toHaveBeenCalledWith(ORG_ID, ACTOR_ID);
    expect(mocks.getUserEnrolled).toHaveBeenCalledWith(ORG_ID, ACTOR_ID, {
      page: 1,
      limit: 20,
      status: 'all'
    });
    expect(result).toEqual({
      data: [{ kind: 'course', data: { id: 'course-1' } }],
      pagination: { page: 1, limit: 20, total: 25, totalPages: 2 },
      counts: { inProgress: 20, completed: 5 }
    });
  });

  it('passes status and trimmed search through to the feed', async () => {
    await listEnrolledService(ORG_ID, ACTOR_ID, {
      page: 3,
      limit: 10,
      status: 'completed',
      search: 'excel'
    });

    expect(mocks.getUserEnrolled).toHaveBeenCalledWith(ORG_ID, ACTOR_ID, {
      page: 3,
      limit: 10,
      status: 'completed',
      search: 'excel'
    });
  });

  it('requires an automation actor', async () => {
    await expect(listEnrolledService(ORG_ID, null, { page: 1, limit: 20, status: 'all' })).rejects.toMatchObject({
      statusCode: 401
    });
    expect(mocks.getUserEnrolled).not.toHaveBeenCalled();
  });

  it('rejects actors outside the organization', async () => {
    mocks.getOrganizationMemberRoleId.mockResolvedValue(null);

    await expect(listEnrolledService(ORG_ID, ACTOR_ID, { page: 1, limit: 20, status: 'all' })).rejects.toMatchObject({
      statusCode: 403
    });
    expect(mocks.getUserEnrolled).not.toHaveBeenCalled();
  });
});
