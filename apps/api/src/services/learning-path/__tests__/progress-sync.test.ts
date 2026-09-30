import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ROLE } from '@cio/utils/constants';

const mocks = vi.hoisted(() => ({
  listActivePathMemberIds: vi.fn(),
  listMembersForProgressReconcile: vi.fn(),
  getLearningPathById: vi.fn(),
  getMemberByPathAndProfile: vi.fn()
}));

vi.mock('@cio/db/drizzle', () => ({ db: {} }));

vi.mock('@cio/db/queries/learning-path', () => ({
  listActivePathMemberIds: mocks.listActivePathMemberIds,
  listMembersForProgressReconcile: mocks.listMembersForProgressReconcile,
  getLearningPathById: mocks.getLearningPathById,
  getMemberByPathAndProfile: mocks.getMemberByPathAndProfile
}));

vi.mock('@cio/jobs', () => ({ enqueueEmailSend: vi.fn(), isRedisConfigured: vi.fn().mockReturnValue(false) }));
vi.mock('@cio/analytics', () => ({ trackServerEvent: vi.fn(), SERVER_EVENTS: {} }));

import {
  reconcileLearningPathProgress,
  syncLearningPathMembersProgress
} from '@cio/core/services/learning-path/progress-sync';

const PATH_ID = '11111111-1111-1111-1111-111111111111';

describe('learning-path progress fan-out', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getLearningPathById.mockResolvedValue({ id: PATH_ID, organizationId: 'org-1' });
    // No member row means syncPathProgressForMember stops before writing, which is all these tests need.
    mocks.getMemberByPathAndProfile.mockResolvedValue(null);
  });

  it('syncs every active student of the path when no profiles are given', async () => {
    mocks.listActivePathMemberIds.mockResolvedValue([
      { id: 'm-1', profileId: 'student-1', roleId: ROLE.STUDENT },
      { id: 'm-2', profileId: 'tutor-1', roleId: ROLE.TUTOR },
      { id: 'm-3', profileId: null, roleId: ROLE.STUDENT },
      { id: 'm-4', profileId: 'student-2', roleId: ROLE.STUDENT }
    ]);

    const result = await syncLearningPathMembersProgress({ pathId: PATH_ID });

    expect(result).toEqual({ synced: 2, failed: 0 });
    expect(mocks.getMemberByPathAndProfile.mock.calls.map((call) => call[1]).sort()).toEqual([
      'student-1',
      'student-2'
    ]);
  });

  it('syncs only the given profiles, and one failure never stops the rest', async () => {
    mocks.getMemberByPathAndProfile.mockImplementation(async (_pathId: string, profileId: string) => {
      if (profileId === 'broken') throw new Error('db blip');

      return null;
    });

    const result = await syncLearningPathMembersProgress({ pathId: PATH_ID, profileIds: ['a', 'broken', 'b'] });

    expect(result).toEqual({ synced: 2, failed: 1 });
    expect(mocks.listActivePathMemberIds).not.toHaveBeenCalled();
  });

  it('reconciles the members the reconcile query returns, over the configured windows', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-09-30T00:00:00.000Z'));
    mocks.listMembersForProgressReconcile.mockResolvedValue([
      { learningPathId: PATH_ID, profileId: 'student-1' },
      { learningPathId: PATH_ID, profileId: 'student-2' }
    ]);

    const result = await reconcileLearningPathProgress({ activeWithinDays: 30, contentChangedWithinHours: 26 });

    expect(mocks.listMembersForProgressReconcile).toHaveBeenCalledWith({
      activeSinceIso: '2026-08-31T00:00:00.000Z',
      contentChangedSinceIso: '2026-09-28T22:00:00.000Z'
    });
    expect(result).toEqual({ synced: 2, failed: 0 });
    vi.useRealTimers();
  });
});
