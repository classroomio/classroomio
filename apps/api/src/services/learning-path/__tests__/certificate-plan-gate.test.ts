import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ROLE } from '@cio/utils/constants';
import { ErrorCodes } from '@api/utils/errors';

const mocks = vi.hoisted(() => ({
  transaction: vi.fn(),
  getLearningPathById: vi.fn(),
  getLearningPathByPublicId: vi.fn(),
  getMemberByPathAndProfile: vi.fn(),
  getCourseIdsInPath: vi.fn(),
  getCourseCompletionStatsForProfile: vi.fn(),
  updateMemberProgress: vi.fn(),
  getLearningPathCertificate: vi.fn(),
  issueLearningPathCertificate: vi.fn(),
  getOrganizationById: vi.fn(),
  getProfileById: vi.fn(),
  orgHasCertificatesEnabled: vi.fn(),
  trackServerEvent: vi.fn(),
  enqueueTransactionalEmail: vi.fn().mockResolvedValue(undefined)
}));

const tx = { id: 'test-tx' };

vi.mock('@cio/db/drizzle', () => ({
  db: { transaction: mocks.transaction }
}));

vi.mock('@cio/db/queries/learning-path', () => ({
  getLearningPathById: mocks.getLearningPathById,
  getLearningPathByPublicId: mocks.getLearningPathByPublicId,
  getMemberByPathAndProfile: mocks.getMemberByPathAndProfile,
  getCourseIdsInPath: mocks.getCourseIdsInPath,
  getCourseCompletionStatsForProfile: mocks.getCourseCompletionStatsForProfile,
  updateMemberProgress: mocks.updateMemberProgress,
  getLearningPathCertificate: mocks.getLearningPathCertificate,
  issueLearningPathCertificate: mocks.issueLearningPathCertificate
}));

vi.mock('@cio/db/queries/group', () => ({
  isCourseTeamMemberOrOrgAdmin: vi.fn().mockResolvedValue(false)
}));

vi.mock('@cio/db/queries/organization', () => ({
  getOrganizationById: mocks.getOrganizationById
}));

vi.mock('@cio/db/queries', () => ({
  getOrganizationById: mocks.getOrganizationById
}));

vi.mock('@api/utils/plan-features', () => ({
  orgHasCertificatesEnabled: mocks.orgHasCertificatesEnabled
}));

vi.mock('@cio/db/queries/auth', () => ({
  getProfileById: mocks.getProfileById
}));

vi.mock('@cio/analytics', () => ({
  trackServerEvent: mocks.trackServerEvent,
  SERVER_EVENTS: {
    ENROLLMENT_COMPLETED: 'enrollment_completed',
    COURSE_COMPLETED: 'course_completed',
    CERTIFICATE_ISSUED: 'certificate_issued'
  }
}));

vi.mock('@api/services/jobs', () => ({
  enqueueTransactionalEmail: mocks.enqueueTransactionalEmail
}));

import { evaluatePathCompletion } from '../unlock';
import {
  assertLearningPathCertificateDownloadAllowed,
  assertLearningPathCertificatePreviewAllowed
} from '../certificate';

const PATH_ID = '11111111-1111-1111-1111-111111111111';

const mockPath = {
  id: PATH_ID,
  organizationId: 'org-1',
  name: 'Gated Path',
  certificate: { isDownloadable: true }
};

const mockMember = {
  id: 'm-1',
  completedAt: null,
  status: 'IN_PROGRESS',
  removedAt: null
};

describe('certificate plan gate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.transaction.mockImplementation(async (callback: (t: unknown) => Promise<unknown>) => callback(tx));
    mocks.getLearningPathById.mockResolvedValue(mockPath);
    mocks.getMemberByPathAndProfile.mockResolvedValue(mockMember);
    mocks.getCourseIdsInPath.mockResolvedValue(['c-1']);
    mocks.getCourseCompletionStatsForProfile.mockResolvedValue({ isComplete: true });
    mocks.getOrganizationById.mockResolvedValue({ id: 'org-1', name: 'Org' });
  });

  it('marks the path complete but skips issuance when the plan disables certificates', async () => {
    mocks.orgHasCertificatesEnabled.mockResolvedValue(false);

    const result = await evaluatePathCompletion(PATH_ID, 'student-1', tx as never);

    expect(result.isComplete).toBe(true);
    expect(result.certificateId).toBeNull();
    expect(mocks.orgHasCertificatesEnabled).toHaveBeenCalledWith('org-1');
    expect(mocks.issueLearningPathCertificate).not.toHaveBeenCalled();
    expect(mocks.updateMemberProgress).toHaveBeenCalledWith(
      'm-1',
      expect.objectContaining({ status: 'COMPLETED' }),
      tx
    );
  });

  it('issues the certificate when the plan enables certificates', async () => {
    mocks.orgHasCertificatesEnabled.mockResolvedValue(true);
    mocks.getLearningPathCertificate.mockResolvedValue(null);
    mocks.issueLearningPathCertificate.mockResolvedValue({ certificateId: 'cert-1' });

    const result = await evaluatePathCompletion(PATH_ID, 'student-1', tx as never);

    expect(result.isComplete).toBe(true);
    expect(result.certificateId).toBe('cert-1');
    expect(mocks.issueLearningPathCertificate).toHaveBeenCalled();
  });

  it('sends the completion email and tracks completion events on first completion', async () => {
    mocks.orgHasCertificatesEnabled.mockResolvedValue(true);
    mocks.getLearningPathCertificate.mockResolvedValue(null);
    mocks.issueLearningPathCertificate.mockResolvedValue({ certificateId: 'cert-1' });
    mocks.getProfileById.mockResolvedValue({ id: 'student-1', email: 'learner@example.com', fullname: 'Learner' });

    const result = await evaluatePathCompletion(PATH_ID, 'student-1', tx as never);

    expect(result.isComplete).toBe(true);
    expect(mocks.trackServerEvent).toHaveBeenCalledWith(
      expect.objectContaining({ eventType: 'course_completed', orgId: 'org-1', userId: 'student-1' })
    );
    expect(mocks.trackServerEvent).toHaveBeenCalledWith(
      expect.objectContaining({ eventType: 'certificate_issued', orgId: 'org-1', userId: 'student-1' })
    );
    // Completion email is fire-and-forget; flush it before asserting.
    await vi.waitFor(() => {
      expect(mocks.enqueueTransactionalEmail).toHaveBeenCalledWith(
        'studentLearningPathCompletion',
        expect.objectContaining({ to: 'learner@example.com' })
      );
    });
  });

  it('sends no completion email or events on repeat evaluation', async () => {
    mocks.orgHasCertificatesEnabled.mockResolvedValue(true);
    mocks.getMemberByPathAndProfile.mockResolvedValue({
      ...mockMember,
      status: 'COMPLETED',
      completedAt: '2026-01-01T00:00:00.000Z'
    });
    mocks.getLearningPathCertificate.mockResolvedValue({ certificateId: 'cert-1' });
    mocks.getProfileById.mockResolvedValue({ id: 'student-1', email: 'learner@example.com', fullname: 'Learner' });

    const result = await evaluatePathCompletion(PATH_ID, 'student-1', tx as never);

    expect(result.isComplete).toBe(true);
    expect(mocks.updateMemberProgress).not.toHaveBeenCalled();
    expect(mocks.trackServerEvent).not.toHaveBeenCalled();
  });

  it('blocks certificate download when the plan disables certificates', async () => {
    mocks.getMemberByPathAndProfile.mockResolvedValue({ ...mockMember, status: 'COMPLETED' });
    mocks.getLearningPathCertificate.mockResolvedValue({ certificateId: 'cert-1', issuedAt: '2026-01-01' });
    mocks.orgHasCertificatesEnabled.mockResolvedValue(false);

    await expect(assertLearningPathCertificateDownloadAllowed(PATH_ID, 'student-1')).rejects.toMatchObject({
      code: ErrorCodes.UNAUTHORIZED,
      statusCode: 403
    });
  });

  it('allows certificate download when the plan enables certificates', async () => {
    mocks.getMemberByPathAndProfile.mockResolvedValue({ ...mockMember, status: 'COMPLETED' });
    mocks.getLearningPathCertificate.mockResolvedValue({ certificateId: 'cert-1', issuedAt: '2026-01-01' });
    mocks.orgHasCertificatesEnabled.mockResolvedValue(true);

    const issued = await assertLearningPathCertificateDownloadAllowed(PATH_ID, 'student-1');

    expect(issued).toEqual({ certificateId: 'cert-1', issuedAt: '2026-01-01' });
  });

  it('still allows team preview without a plan check', async () => {
    mocks.getLearningPathById.mockResolvedValue(mockPath);

    await expect(
      assertLearningPathCertificatePreviewAllowed(PATH_ID, 'admin-1', { 'org-1': ROLE.ADMIN })
    ).resolves.toBeUndefined();
    expect(mocks.orgHasCertificatesEnabled).not.toHaveBeenCalled();
  });
});
