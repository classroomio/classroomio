import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getCourseProgress: vi.fn(),
  getCourseCertificationRow: vi.fn(),
  getCourseById: vi.fn(),
  claimMemberCompleted: vi.fn(),
  claimMemberCertificateEarned: vi.fn(),
  orgHasCertificatesEnabled: vi.fn(),
  invalidateOrgStats: vi.fn(),
  scheduleCertificationCompletionWork: vi.fn(),
  trackServerEvent: vi.fn(),
  captureServerEvent: vi.fn(),
  emitWebhookEvent: vi.fn()
}));

vi.mock('@cio/db/queries/course/course', () => ({
  getCourseProgress: mocks.getCourseProgress,
  getCourseCertificationRow: mocks.getCourseCertificationRow,
  getCourseById: mocks.getCourseById
}));

vi.mock('@cio/db/queries/course/certification-exercise', () => ({
  exerciseBelongsToCourse: vi.fn(),
  getExerciseTitleAndMaxPoints: vi.fn(),
  getStudentSubmissionsForExercise: vi.fn()
}));

vi.mock('@cio/db/queries/course/people', () => ({
  claimMemberCompleted: mocks.claimMemberCompleted,
  claimMemberCertificateEarned: mocks.claimMemberCertificateEarned
}));

vi.mock('@api/services/course/certificate-plan', () => ({
  assertCertificatesEnabled: vi.fn(),
  orgHasCertificatesEnabled: mocks.orgHasCertificatesEnabled
}));

vi.mock('@cio/core/services/posthog', () => ({
  captureServerEvent: mocks.captureServerEvent
}));

vi.mock('@cio/core/services/webhook/emit', () => ({
  emitWebhookEvent: mocks.emitWebhookEvent
}));

vi.mock('@cio/core/utils/redis/org-stats-cache', () => ({
  invalidateOrgStats: mocks.invalidateOrgStats
}));

vi.mock('@api/utils/course-completion', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@api/utils/course-completion')>();

  return { ...actual, scheduleCertificationCompletionWork: mocks.scheduleCertificationCompletionWork };
});

vi.mock('@cio/tracking', () => ({
  trackServerEvent: mocks.trackServerEvent,
  SERVER_EVENTS: { COURSE_COMPLETED: 'course_completed', CERTIFICATE_ISSUED: 'certificate_issued' }
}));

import { evaluateCourseCertification } from '../completion';

const COURSE_ID = 'course-1';
const PROFILE_ID = 'ada';
const GROUP_MEMBER_ID = 'member-1';

function progressAt(
  lessonsCompleted: number,
  recorded: { completedAt?: string | null; certificateEarnedAt?: string | null } = {}
) {
  return {
    lessonsCount: 4,
    lessonsCompleted,
    exercisesCount: 0,
    exercisesCompleted: 0,
    groupMemberId: GROUP_MEMBER_ID,
    roleId: 3,
    certificateEarnedAt: recorded.certificateEarnedAt ?? null,
    certificationEmailSentAt: null,
    completedAt: recorded.completedAt ?? null
  };
}

const courseRow = {
  type: 'SELF_PACED',
  compliance: null,
  certificate: { isDownloadable: true, threshold: 75 },
  title: 'Excel',
  orgId: 'org-1',
  orgSiteName: 'org',
  orgCustomDomain: null,
  orgIsCustomDomainVerified: null,
  orgName: 'Org',
  orgAvatarUrl: null,
  orgTheme: null
};

function trackedEvents() {
  return mocks.trackServerEvent.mock.calls.map(([event]) => event.eventType);
}

describe('evaluateCourseCertification', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getCourseCertificationRow.mockResolvedValue(courseRow);
    mocks.claimMemberCompleted.mockResolvedValue(true);
    mocks.claimMemberCertificateEarned.mockResolvedValue(true);
  });

  it('records completion on a plan without certificates, without earning the certificate', async () => {
    mocks.getCourseProgress.mockResolvedValue(progressAt(4));
    mocks.orgHasCertificatesEnabled.mockResolvedValue(false);

    const result = await evaluateCourseCertification(COURSE_ID, PROFILE_ID);

    expect(mocks.claimMemberCompleted).toHaveBeenCalledWith(GROUP_MEMBER_ID, expect.any(String));
    expect(mocks.claimMemberCertificateEarned).not.toHaveBeenCalled();
    expect(mocks.scheduleCertificationCompletionWork).not.toHaveBeenCalled();
    expect(trackedEvents()).toEqual(['course_completed']);
    expect(result).toMatchObject({ eligibleForCertificate: true, certificateEarnedAt: null, isNewCompletion: false });
    expect(typeof result.completedAt).toBe('string');
  });

  it('records completion and earns the certificate when the plan includes certificates', async () => {
    mocks.getCourseProgress.mockResolvedValue(progressAt(4));
    mocks.orgHasCertificatesEnabled.mockResolvedValue(true);

    const result = await evaluateCourseCertification(COURSE_ID, PROFILE_ID);

    expect(mocks.claimMemberCompleted).toHaveBeenCalledWith(GROUP_MEMBER_ID, expect.any(String));
    expect(mocks.claimMemberCertificateEarned).toHaveBeenCalledWith(GROUP_MEMBER_ID, expect.any(String));
    expect(mocks.scheduleCertificationCompletionWork).toHaveBeenCalledTimes(1);
    expect(trackedEvents()).toEqual(['course_completed', 'certificate_issued']);
    expect(result.isNewCompletion).toBe(true);
    expect(typeof result.completedAt).toBe('string');
  });

  it('earns the certificate for an earlier completion once the plan includes certificates', async () => {
    mocks.getCourseProgress.mockResolvedValue(progressAt(4, { completedAt: '2026-09-01T00:00:00Z' }));
    mocks.orgHasCertificatesEnabled.mockResolvedValue(true);

    const result = await evaluateCourseCertification(COURSE_ID, PROFILE_ID);

    expect(result.eligibleForCertificate).toBe(true);
    expect(mocks.claimMemberCompleted).not.toHaveBeenCalled();
    expect(mocks.claimMemberCertificateEarned).toHaveBeenCalledWith(GROUP_MEMBER_ID, expect.any(String));
    expect(trackedEvents()).toEqual(['certificate_issued']);
    expect(result.isNewCompletion).toBe(true);
    expect(result.completedAt).toBe('2026-09-01T00:00:00Z');
  });

  it('records nothing before all content is complete', async () => {
    mocks.getCourseProgress.mockResolvedValue(progressAt(3));
    mocks.orgHasCertificatesEnabled.mockResolvedValue(true);

    const result = await evaluateCourseCertification(COURSE_ID, PROFILE_ID);

    expect(result.eligibleForCertificate).toBe(false);
    expect(mocks.claimMemberCompleted).not.toHaveBeenCalled();
    expect(mocks.claimMemberCertificateEarned).not.toHaveBeenCalled();
    expect(trackedEvents()).toEqual([]);
    expect(result.completedAt).toBeNull();
  });

  it('tracks completion only for the evaluation that recorded it', async () => {
    mocks.getCourseProgress.mockResolvedValue(progressAt(4));
    mocks.orgHasCertificatesEnabled.mockResolvedValue(false);
    mocks.claimMemberCompleted.mockResolvedValue(false);

    await evaluateCourseCertification(COURSE_ID, PROFILE_ID);

    expect(trackedEvents()).toEqual([]);
  });
});
