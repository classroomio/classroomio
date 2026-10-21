import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getCourseById: vi.fn(),
  getCourseCertificationRow: vi.fn(),
  getCourseProgress: vi.fn(),
  getCourseOrganizationId: vi.fn(),
  getActiveOrganizationPlan: vi.fn(),
  claimMemberCertificateEarned: vi.fn()
}));

vi.mock('@cio/db/queries/course/course', () => ({
  getCourseById: mocks.getCourseById,
  getCourseCertificationRow: mocks.getCourseCertificationRow,
  getCourseProgress: mocks.getCourseProgress
}));

vi.mock('@cio/db/queries/course/people', () => ({
  claimMemberCertificateEarned: mocks.claimMemberCertificateEarned
}));

vi.mock('@cio/db/queries/tag', () => ({
  getCourseOrganizationId: mocks.getCourseOrganizationId
}));

vi.mock('@cio/db/queries/organization', () => ({
  getActiveOrganizationPlan: mocks.getActiveOrganizationPlan
}));

vi.mock('@cio/core/utils/redis/org-stats-cache', () => ({ invalidateOrgStats: vi.fn() }));
vi.mock('@cio/analytics', () => ({ trackServerEvent: vi.fn(), SERVER_EVENTS: {} }));
vi.mock('@api/utils/course-completion', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@api/utils/course-completion')>();

  return { ...actual, scheduleCertificationCompletionWork: vi.fn() };
});

import { assertCertificateDownloadAllowed } from '../completion';

const completedProgress = {
  groupMemberId: 'member-1',
  lessonsCompleted: 2,
  lessonsCount: 2,
  exercisesCompleted: 0,
  exercisesCount: 0,
  certificateEarnedAt: null
};

describe('assertCertificateDownloadAllowed', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getCourseProgress.mockResolvedValue(completedProgress);
    mocks.getCourseCertificationRow.mockResolvedValue({ orgId: 'org-1', type: 'SELF_PACED', certificate: {} });
    mocks.getCourseById.mockResolvedValue([{ certificate: { isDownloadable: true } }]);
    mocks.getCourseOrganizationId.mockResolvedValue('org-1');
  });

  it('allows a learner who met the requirements when the plan includes certificates', async () => {
    mocks.getActiveOrganizationPlan.mockResolvedValue({ planName: 'EARLY_ADOPTER' });

    await expect(assertCertificateDownloadAllowed('course-1', 'ada')).resolves.toBeUndefined();
  });

  it.each([
    ['the Basic plan', { planName: 'BASIC' }],
    ['no active plan', null]
  ])('rejects with UPGRADE_REQUIRED on %s, even for a learner who met the requirements', async (_label, plan) => {
    mocks.getActiveOrganizationPlan.mockResolvedValue(plan);

    await expect(assertCertificateDownloadAllowed('course-1', 'ada')).rejects.toMatchObject({
      code: 'UPGRADE_REQUIRED',
      statusCode: 403
    });
  });

  it('rejects a certificate earned before the org moved to the Basic plan', async () => {
    mocks.getCourseProgress.mockResolvedValue({ ...completedProgress, certificateEarnedAt: '2026-09-01T00:00:00Z' });
    mocks.getActiveOrganizationPlan.mockResolvedValue({ planName: 'BASIC' });

    await expect(assertCertificateDownloadAllowed('course-1', 'ada')).rejects.toMatchObject({
      code: 'UPGRADE_REQUIRED'
    });
  });
});
