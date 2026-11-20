import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ROLE } from '@cio/utils/constants';

const mocks = vi.hoisted(() => ({
  getLearningPathById: vi.fn(),
  getMemberByPathAndProfile: vi.fn(),
  getJob: vi.fn(),
  getQueueJobEnvelope: vi.fn()
}));

vi.mock('@cio/jobs', () => ({
  QUEUE_NAMES: { audience: 'audience' },
  JOB_NAMES: { audience: { bulkAction: 'bulk-action', pathBulkEnroll: 'path-bulk-enroll' } },
  getQueue: vi.fn(() => ({ getJob: mocks.getJob })),
  getQueueJobEnvelope: mocks.getQueueJobEnvelope
}));

vi.mock('@cio/db/queries/learning-path', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@cio/db/queries/learning-path')>();

  return {
    ...actual,
    getLearningPathById: mocks.getLearningPathById,
    getMemberByPathAndProfile: mocks.getMemberByPathAndProfile
  };
});

import { getBulkPathEnrollmentStatus } from '../learning-path';

const PATH = { id: '11111111-1111-1111-1111-111111111111', organizationId: 'org-1' };

describe('getBulkPathEnrollmentStatus job scoping', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getLearningPathById.mockResolvedValue(PATH);
    mocks.getMemberByPathAndProfile.mockResolvedValue({ id: 'caller', roleId: ROLE.ADMIN, removedAt: null });
  });

  it('returns the envelope for the matching path job', async () => {
    mocks.getJob.mockResolvedValue({
      id: 'job-1',
      name: 'path-bulk-enroll',
      data: { organizationId: 'org-1', pathId: '11111111-1111-1111-1111-111111111111' }
    });
    mocks.getQueueJobEnvelope.mockResolvedValue({ job: { id: 'job-1', status: 'running' } });

    const envelope = await getBulkPathEnrollmentStatus('11111111-1111-1111-1111-111111111111', 'job-1', 'admin-1', {
      'org-1': ROLE.ADMIN
    });

    expect(envelope).toMatchObject({ job: { id: 'job-1' } });
  });

  it('a job of another type returns 404', async () => {
    mocks.getJob.mockResolvedValue({
      id: 'job-1',
      name: 'bulk-action',
      data: { organizationId: 'org-1', pathId: '11111111-1111-1111-1111-111111111111' }
    });

    await expect(
      getBulkPathEnrollmentStatus('11111111-1111-1111-1111-111111111111', 'job-1', 'admin-1', { 'org-1': ROLE.ADMIN })
    ).rejects.toMatchObject({ statusCode: 404 });
    expect(mocks.getQueueJobEnvelope).not.toHaveBeenCalled();
  });

  it('a same-org job for another path returns 404', async () => {
    mocks.getJob.mockResolvedValue({
      id: 'job-1',
      name: 'path-bulk-enroll',
      data: { organizationId: 'org-1', pathId: '22222222-2222-2222-2222-222222222222' }
    });

    await expect(
      getBulkPathEnrollmentStatus('11111111-1111-1111-1111-111111111111', 'job-1', 'admin-1', { 'org-1': ROLE.ADMIN })
    ).rejects.toMatchObject({ statusCode: 404 });
    expect(mocks.getQueueJobEnvelope).not.toHaveBeenCalled();
  });
});
