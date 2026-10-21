import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@cio/db/queries/course/course', () => ({
  getCourseProgress: vi.fn(),
  getCourseCertificationRow: vi.fn()
}));

vi.mock('@cio/db/queries/activity/activity', () => ({
  getActivitiesByCourseId: vi.fn(),
  getActivityCompletionsByProfile: vi.fn()
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

import { calcCourseProgressPercent } from '@api/utils/course-completion';
import { getCourseCertificationRow, getCourseProgress } from '@cio/db/queries/course/course';
import { getActivitiesByCourseId, getActivityCompletionsByProfile } from '@cio/db/queries/activity/activity';
import { claimMemberCertificateEarned } from '@cio/db/queries/course/people';
import { orgHasCertificatesEnabled } from '@api/services/course/certificate-plan';
import { evaluateCourseCertification } from '@api/services/course/completion';

function progress(overrides: Record<string, unknown> = {}) {
  return {
    lessonsCount: 1,
    lessonsCompleted: 1,
    exercisesCount: 0,
    exercisesCompleted: 0,
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
    certificate: {},
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

describe('calcCourseProgressPercent with activities', () => {
  it('keeps lesson-only maths unchanged without activity args', () => {
    expect(
      calcCourseProgressPercent({ lessonsCompleted: 1, totalLessons: 2, exercisesCompleted: 0, exercisesCount: 0 })
    ).toBe(50);
  });

  it('counts one item per activity in the shared total', () => {
    expect(
      calcCourseProgressPercent({
        lessonsCompleted: 1,
        totalLessons: 1,
        exercisesCompleted: 0,
        exercisesCount: 0,
        activitiesCompleted: 0,
        activitiesCount: 1
      })
    ).toBe(50);
  });

  it('returns 0 for an empty course in every content type', () => {
    expect(
      calcCourseProgressPercent({
        lessonsCompleted: 0,
        totalLessons: 0,
        exercisesCompleted: 0,
        exercisesCount: 0,
        activitiesCompleted: 0,
        activitiesCount: 0
      })
    ).toBe(0);
  });
});

describe('evaluateCourseCertification with activities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getCourseProgress).mockResolvedValue(progress() as never);
    vi.mocked(getCourseCertificationRow).mockResolvedValue(courseRow() as never);
    vi.mocked(getActivitiesByCourseId).mockResolvedValue([]);
    vi.mocked(getActivityCompletionsByProfile).mockResolvedValue([]);
    vi.mocked(orgHasCertificatesEnabled).mockResolvedValue(true);
    vi.mocked(claimMemberCertificateEarned).mockResolvedValue(true);
  });

  it('counts a completed activity toward the threshold', async () => {
    vi.mocked(getCourseProgress).mockResolvedValue(progress({ lessonsCount: 2, lessonsCompleted: 1 }) as never);
    vi.mocked(getActivitiesByCourseId).mockResolvedValue([{ id: 'activity-1' }] as never);
    vi.mocked(getActivityCompletionsByProfile).mockResolvedValue(['activity-1']);

    const evaluation = await evaluateCourseCertification('course-1', 'profile-1');

    // 1 lesson + 1 activity of 2 lessons + 1 activity = 67%.
    expect(evaluation.progressPercent).toBe(67);
    expect(getActivityCompletionsByProfile).toHaveBeenCalledWith(['activity-1'], 'profile-1', expect.anything(), null);
  });

  it('treats an activity-only course as content that can earn a certificate', async () => {
    vi.mocked(getCourseProgress).mockResolvedValue(progress({ lessonsCount: 0, lessonsCompleted: 0 }) as never);
    vi.mocked(getActivitiesByCourseId).mockResolvedValue([{ id: 'activity-1' }] as never);
    vi.mocked(getActivityCompletionsByProfile).mockResolvedValue(['activity-1']);

    const evaluation = await evaluateCourseCertification('course-1', 'profile-1');

    expect(evaluation.progressPercent).toBe(100);
    expect(evaluation.blockers.map((blocker) => blocker.code)).not.toContain('CERT_NO_CONTENT');
    expect(evaluation.eligibleForCertificate).toBe(true);
    expect(evaluation.isNewCompletion).toBe(true);
  });

  it('keeps CERT_NO_CONTENT for a course with no content at all', async () => {
    vi.mocked(getCourseProgress).mockResolvedValue(progress({ lessonsCount: 0, lessonsCompleted: 0 }) as never);

    const evaluation = await evaluateCourseCertification('course-1', 'profile-1');

    expect(evaluation.blockers.map((blocker) => blocker.code)).toContain('CERT_NO_CONTENT');
    expect(evaluation.eligibleForCertificate).toBe(false);
    expect(getActivitiesByCourseId).toHaveBeenCalledWith('course-1');
  });

  it('blocks an unfinished activity-only course on progress, not content', async () => {
    vi.mocked(getCourseProgress).mockResolvedValue(progress({ lessonsCount: 0, lessonsCompleted: 0 }) as never);
    vi.mocked(getActivitiesByCourseId).mockResolvedValue([{ id: 'activity-1' }] as never);
    vi.mocked(getActivityCompletionsByProfile).mockResolvedValue([]);

    const evaluation = await evaluateCourseCertification('course-1', 'profile-1');

    expect(evaluation.progressPercent).toBe(0);
    expect(evaluation.blockers.map((blocker) => blocker.code)).toEqual(expect.arrayContaining(['CERT_PROGRESS']));
    expect(evaluation.blockers.map((blocker) => blocker.code)).not.toContain('CERT_NO_CONTENT');
  });
});
