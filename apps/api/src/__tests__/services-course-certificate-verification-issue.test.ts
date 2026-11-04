import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  tx: { tx: true },
  getCourseCertificationRow: vi.fn(),
  getCourseProgress: vi.fn(),
  getActiveOrganizationPlan: vi.fn(),
  claimMemberCertificateEarned: vi.fn(),
  claimMemberCompleted: vi.fn(),
  createCourseCertificateVerification: vi.fn(),
  transaction: vi.fn()
}));

vi.mock('@cio/db/drizzle', () => ({ db: { transaction: mocks.transaction } }));
vi.mock('@cio/db/queries/course/course', () => ({
  getCourseById: vi.fn(),
  getCourseCertificationRow: mocks.getCourseCertificationRow,
  getCourseProgress: mocks.getCourseProgress
}));
vi.mock('@cio/db/queries/course/people', () => ({
  claimMemberCertificateEarned: mocks.claimMemberCertificateEarned,
  claimMemberCompleted: mocks.claimMemberCompleted
}));
vi.mock('@cio/db/queries/course/certificate-verification', () => ({
  createCourseCertificateVerification: mocks.createCourseCertificateVerification
}));
vi.mock('@cio/db/queries/organization', () => ({ getActiveOrganizationPlan: mocks.getActiveOrganizationPlan }));
vi.mock('@cio/db/queries/tag', () => ({ getCourseOrganizationId: vi.fn() }));
vi.mock('@cio/core/services/webhook/emit', () => ({ emitWebhookEvent: vi.fn() }));
vi.mock('@cio/core/services/posthog', () => ({ captureServerEvent: vi.fn() }));
vi.mock('@cio/core/utils/redis/org-stats-cache', () => ({ invalidateOrgStats: vi.fn() }));
vi.mock('@cio/analytics', () => ({ trackServerEvent: vi.fn(), SERVER_EVENTS: {} }));
vi.mock('@api/utils/course-completion', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@api/utils/course-completion')>();

  return { ...actual, scheduleCertificationCompletionWork: vi.fn() };
});

import { evaluateCourseCertification } from '@api/services/course/completion';

const completedProgress = {
  groupMemberId: 'member-1',
  lessonsCompleted: 2,
  lessonsCount: 2,
  exercisesCompleted: 0,
  exercisesCount: 0,
  completedAt: '2026-10-01T00:00:00Z',
  certificateEarnedAt: null
};

describe('evaluateCourseCertification verification record', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.transaction.mockImplementation(async (callback: (tx: unknown) => unknown) => callback(mocks.tx));
    mocks.getCourseProgress.mockResolvedValue(completedProgress);
    mocks.getActiveOrganizationPlan.mockResolvedValue({ planName: 'EARLY_ADOPTER' });
    mocks.claimMemberCertificateEarned.mockResolvedValue(true);
  });

  it('creates the record in the same transaction as the certificate claim for a regular course', async () => {
    mocks.getCourseCertificationRow.mockResolvedValue({ orgId: 'org-1', type: 'SELF_PACED', certificate: {} });

    const result = await evaluateCourseCertification('course-1', 'profile-1');

    expect(mocks.claimMemberCertificateEarned).toHaveBeenCalledWith('member-1', result.certificateEarnedAt, mocks.tx);
    expect(mocks.createCourseCertificateVerification).toHaveBeenCalledWith(
      { courseId: 'course-1', profileId: 'profile-1', groupMemberId: 'member-1', issuedAt: result.certificateEarnedAt },
      mocks.tx
    );
  });

  it('creates no record when another request already claimed the certificate', async () => {
    mocks.getCourseCertificationRow.mockResolvedValue({ orgId: 'org-1', type: 'SELF_PACED', certificate: {} });
    mocks.claimMemberCertificateEarned.mockResolvedValue(false);

    await evaluateCourseCertification('course-1', 'profile-1');

    expect(mocks.createCourseCertificateVerification).not.toHaveBeenCalled();
  });

  it('leaves compliance courses to their per-cycle record', async () => {
    mocks.getCourseCertificationRow.mockResolvedValue({ orgId: 'org-1', type: 'COMPLIANCE', certificate: {} });

    await evaluateCourseCertification('course-1', 'profile-1');

    expect(mocks.claimMemberCertificateEarned).toHaveBeenCalled();
    expect(mocks.createCourseCertificateVerification).not.toHaveBeenCalled();
  });

  it('does not keep the claim when the record cannot be created', async () => {
    mocks.getCourseCertificationRow.mockResolvedValue({ orgId: 'org-1', type: 'SELF_PACED', certificate: {} });
    mocks.createCourseCertificateVerification.mockRejectedValue(new Error('insert failed'));

    await expect(evaluateCourseCertification('course-1', 'profile-1')).rejects.toThrow('insert failed');
    expect(mocks.transaction).toHaveBeenCalledTimes(1);
  });
});
