import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@cio/db/queries/course/course', () => ({
  getCourseProgress: vi.fn(),
  getCourseCertificationRow: vi.fn()
}));

vi.mock('@cio/db/queries/course/certification-exercise', () => ({
  exerciseBelongsToCourse: vi.fn(),
  getExerciseTitleAndMaxPoints: vi.fn(),
  getStudentSubmissionsForExercise: vi.fn()
}));

vi.mock('@cio/db/queries/course/people', () => ({
  claimMemberCertificateEarned: vi.fn()
}));

vi.mock('@api/services/course/certificate-plan', () => ({
  orgHasCertificatesEnabled: vi.fn()
}));

vi.mock('@cio/core/utils/redis/org-stats-cache', () => ({
  invalidateOrgStats: vi.fn()
}));

vi.mock('@cio/analytics', () => ({
  trackServerEvent: vi.fn(),
  SERVER_EVENTS: { COURSE_COMPLETED: 'course_completed', CERTIFICATE_ISSUED: 'certificate_issued' }
}));

vi.mock('@api/utils/course-completion', async (importOriginal) => {
  const original = await importOriginal<typeof import('@api/utils/course-completion')>();

  return {
    ...original,
    scheduleCertificationCompletionWork: vi.fn()
  };
});

import { getCourseCertificationRow, getCourseProgress } from '@cio/db/queries/course/course';
import { exerciseBelongsToCourse } from '@cio/db/queries/course/certification-exercise';
import { claimMemberCertificateEarned } from '@cio/db/queries/course/people';
import { orgHasCertificatesEnabled } from '@api/services/course/certificate-plan';
import { evaluateCourseCertification } from '@api/services/course/completion';

function progress(overrides: Record<string, unknown> = {}) {
  return {
    lessonsCount: 2,
    lessonsCompleted: 2,
    exercisesCount: 1,
    exercisesCompleted: 1,
    groupMemberId: 'member-1',
    roleId: 3,
    certificateEarnedAt: null,
    certificationEmailSentAt: null,
    ...overrides
  };
}

function courseRow(overrides: Record<string, unknown> = {}) {
  return {
    type: 'SELF_PACED',
    compliance: null,
    certificate: { threshold: 100 },
    title: 'Course',
    orgId: 'org-1',
    orgSiteName: null,
    orgCustomDomain: null,
    orgIsCustomDomainVerified: false,
    orgName: 'Org',
    orgAvatarUrl: null,
    orgTheme: null,
    ...overrides
  };
}

describe('characterization: evaluateCourseCertification (zero activities)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getCourseProgress).mockResolvedValue(progress() as never);
    vi.mocked(getCourseCertificationRow).mockResolvedValue(courseRow() as never);
    vi.mocked(exerciseBelongsToCourse).mockResolvedValue(false);
    vi.mocked(orgHasCertificatesEnabled).mockResolvedValue(true);
    vi.mocked(claimMemberCertificateEarned).mockResolvedValue(true);
  });

  it('reports CERT_NO_CONTENT for a course with no lessons or exercises', async () => {
    vi.mocked(getCourseProgress).mockResolvedValue(progress({ lessonsCount: 0, exercisesCount: 0 }) as never);

    const evaluation = await evaluateCourseCertification('course-1', 'profile-1');

    expect(evaluation.progressPercent).toBe(0);
    expect(evaluation.eligibleForCertificate).toBe(false);
    expect(evaluation.blockers.map((blocker) => blocker.code)).toContain('CERT_NO_CONTENT');
    expect(evaluation.isNewCompletion).toBe(false);
  });

  it('is eligible at 100% with no final exercise and claims once', async () => {
    const evaluation = await evaluateCourseCertification('course-1', 'profile-1');

    expect(evaluation).toMatchObject({
      progressPercent: 100,
      certificationThreshold: 100,
      meetsThreshold: true,
      eligibleForCertificate: true,
      meetsFinalExerciseRule: true,
      isNewCompletion: true
    });
    expect(evaluation.blockers).toEqual([]);
    expect(claimMemberCertificateEarned).toHaveBeenCalledWith('member-1', expect.any(String));
  });

  it('blocks below the certificate threshold', async () => {
    vi.mocked(getCourseProgress).mockResolvedValue(progress({ lessonsCompleted: 1, exercisesCompleted: 0 }) as never);

    const evaluation = await evaluateCourseCertification('course-1', 'profile-1');

    expect(evaluation.progressPercent).toBe(33);
    expect(evaluation.eligibleForCertificate).toBe(false);
    expect(evaluation.blockers).toEqual([{ code: 'CERT_PROGRESS', params: { current: 33, required: 100 } }]);
    expect(claimMemberCertificateEarned).not.toHaveBeenCalled();
  });

  it('blocks on a past certificate deadline', async () => {
    vi.mocked(getCourseCertificationRow).mockResolvedValue(
      courseRow({ certificate: { threshold: 100, deadline: '2020-01-01T00:00:00.000Z' } }) as never
    );

    const evaluation = await evaluateCourseCertification('course-1', 'profile-1');

    expect(evaluation.eligibleForCertificate).toBe(false);
    expect(evaluation.blockers.map((blocker) => blocker.code)).toContain('CERT_DEADLINE_PASSED');
  });

  it('requires the final exercise submission when configured', async () => {
    vi.mocked(getCourseCertificationRow).mockResolvedValue(
      courseRow({ certificate: { threshold: 100, requiredExerciseId: 'exercise-1' } }) as never
    );
    vi.mocked(exerciseBelongsToCourse).mockResolvedValue(true);
    const { getExerciseTitleAndMaxPoints, getStudentSubmissionsForExercise } = await import(
      '@cio/db/queries/course/certification-exercise'
    );
    vi.mocked(getExerciseTitleAndMaxPoints).mockResolvedValue({ title: 'Final quiz', maxPoints: 100 } as never);
    vi.mocked(getStudentSubmissionsForExercise).mockResolvedValue([]);

    const evaluation = await evaluateCourseCertification('course-1', 'profile-1');

    expect(evaluation.meetsFinalExerciseRule).toBe(false);
    expect(evaluation.eligibleForCertificate).toBe(false);
    expect(evaluation.blockers.map((blocker) => blocker.code)).toContain('CERT_FINAL_EXERCISE_NOT_SUBMITTED');
  });

  it('throws 404 for an unknown course', async () => {
    vi.mocked(getCourseCertificationRow).mockResolvedValue(null);

    await expect(evaluateCourseCertification('missing', 'profile-1')).rejects.toMatchObject({ statusCode: 404 });
  });
});
