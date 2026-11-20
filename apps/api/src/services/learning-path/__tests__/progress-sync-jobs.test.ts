import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  isRedisConfigured: vi.fn(),
  enqueueLearningPathProgressSync: vi.fn(),
  syncLearningPathMembersProgress: vi.fn()
}));

vi.mock('@cio/jobs', () => ({
  isRedisConfigured: mocks.isRedisConfigured,
  enqueueLearningPathProgressSync: mocks.enqueueLearningPathProgressSync
}));

vi.mock('@cio/core/services/learning-path/progress-sync', () => ({
  syncLearningPathMembersProgress: mocks.syncLearningPathMembersProgress
}));

import { scheduleLearningPathProgressSync } from '../progress-sync-jobs';

const payload = { pathId: '11111111-1111-1111-1111-111111111111', profileIds: ['profile-1'] };

describe('scheduleLearningPathProgressSync', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.enqueueLearningPathProgressSync.mockResolvedValue('job-1');
    mocks.syncLearningPathMembersProgress.mockResolvedValue({ synced: 1, failed: 0 });
  });

  it('hands the sync to the worker when Redis is configured', async () => {
    mocks.isRedisConfigured.mockReturnValue(true);

    scheduleLearningPathProgressSync(payload);

    await vi.waitFor(() => expect(mocks.enqueueLearningPathProgressSync).toHaveBeenCalledWith(payload));
    expect(mocks.syncLearningPathMembersProgress).not.toHaveBeenCalled();
  });

  it('syncs in process when Redis is not configured', async () => {
    mocks.isRedisConfigured.mockReturnValue(false);

    scheduleLearningPathProgressSync(payload);

    await vi.waitFor(() => expect(mocks.syncLearningPathMembersProgress).toHaveBeenCalledWith(payload));
    expect(mocks.enqueueLearningPathProgressSync).not.toHaveBeenCalled();
  });

  it('falls back to syncing in process when the enqueue fails', async () => {
    mocks.isRedisConfigured.mockReturnValue(true);
    mocks.enqueueLearningPathProgressSync.mockRejectedValue(new Error('redis down'));

    scheduleLearningPathProgressSync(payload);

    await vi.waitFor(() => expect(mocks.syncLearningPathMembersProgress).toHaveBeenCalledWith(payload));
  });

  it('never throws, even when the fallback sync fails', async () => {
    mocks.isRedisConfigured.mockReturnValue(false);
    mocks.syncLearningPathMembersProgress.mockRejectedValue(new Error('db down'));

    expect(() => scheduleLearningPathProgressSync(payload)).not.toThrow();
    await vi.waitFor(() => expect(mocks.syncLearningPathMembersProgress).toHaveBeenCalled());
  });
});
