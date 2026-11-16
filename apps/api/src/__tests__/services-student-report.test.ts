import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getStudentReportByTokenHash: vi.fn(),
  insertStudentReport: vi.fn(),
  getStudentExerciseScores: vi.fn(),
  recordStudentReportView: vi.fn(),
  getStudentSkillMastery: vi.fn(),
  getCourseStudentMemberIds: vi.fn(),
  enqueueEmailSend: vi.fn()
}));

vi.mock('@cio/db/queries/student-report', () => ({
  getStudentReportByTokenHash: mocks.getStudentReportByTokenHash,
  insertStudentReport: mocks.insertStudentReport,
  getStudentExerciseScores: mocks.getStudentExerciseScores,
  recordStudentReportView: mocks.recordStudentReportView,
  listStudentReports: vi.fn(),
  revokeStudentReport: vi.fn()
}));
vi.mock('@cio/db/queries/exercise', () => ({ getCourseStudentMemberIds: mocks.getCourseStudentMemberIds }));
vi.mock('@cio/db/queries/organization', () => ({ getOrganizationById: vi.fn() }));
vi.mock('@cio/db/queries/course', () => ({ getCourseById: vi.fn() }));
vi.mock('@cio/db/queries/auth', () => ({ getProfileById: vi.fn() }));
vi.mock('@cio/jobs', () => ({ enqueueEmailSend: mocks.enqueueEmailSend }));
vi.mock('@cio/core/config/dashboard-url', () => ({ getAppBaseUrl: () => 'https://app.test' }));
vi.mock('@api/services/skill/mastery', () => ({ getStudentSkillMastery: mocks.getStudentSkillMastery }));

import { createStudentReportsService, getPublicStudentReport } from '@api/services/student-report/student-report';

const FUTURE = new Date(Date.now() + 86_400_000).toISOString();
const PAST = new Date(Date.now() - 86_400_000).toISOString();

const storedReport = {
  id: 'report-1',
  courseId: 'course-1',
  profileId: 'profile-1',
  periodStart: '2026-10-01T00:00:00.000Z',
  periodEnd: '2026-11-01T00:00:00.000Z',
  teacherComment: 'Well done',
  expiresAt: FUTURE,
  revokedAt: null,
  studentName: 'Ada Obi',
  courseTitle: 'Algebra',
  orgName: 'Academy',
  orgLogoUrl: null,
  orgTheme: 'rose'
};

describe('student report share links', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getStudentSkillMastery.mockResolvedValue([
      { code: 'A', name: 'Add', level: 'mastered', score: 91.2 },
      { code: 'B', name: 'Subtract', level: 'learning', score: 40.4 },
      { code: 'C', name: 'Divide', level: 'not_started', score: null }
    ]);
    mocks.getStudentExerciseScores.mockResolvedValue([
      { exerciseId: 'e1', title: 'Quiz', score: 3, maxScore: 4, submittedAt: '2026-10-05T00:00:00.000Z' }
    ]);
  });

  it('stores only a hash of the token and returns the full link once', async () => {
    mocks.getCourseStudentMemberIds.mockResolvedValue(new Map([['profile-1', 'member-1']]));
    mocks.insertStudentReport.mockImplementation(async (values) => ({ id: 'report-1', ...values }));

    const { reports } = await createStudentReportsService('course-1', 'org-1', 'teacher-1', {
      profileIds: ['profile-1'],
      periodStart: '2026-10-01T00:00:00.000Z',
      periodEnd: '2026-11-01T00:00:00.000Z',
      expiresInDays: 30,
      sendToParent: false
    });

    const token = reports[0].url.replace('https://app.test/report/', '');
    const stored = mocks.insertStudentReport.mock.calls[0][0];

    expect(token).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(stored.tokenHash).toMatch(/^[0-9a-f]{64}$/);
    expect(JSON.stringify(stored)).not.toContain(token);
  });

  it('refuses students who are not in the course', async () => {
    mocks.getCourseStudentMemberIds.mockResolvedValue(new Map());

    await expect(
      createStudentReportsService('course-1', 'org-1', 'teacher-1', {
        profileIds: ['profile-9'],
        periodStart: '2026-10-01T00:00:00.000Z',
        periodEnd: '2026-11-01T00:00:00.000Z',
        expiresInDays: 30,
        sendToParent: false
      })
    ).rejects.toMatchObject({ statusCode: 400 });
    expect(mocks.insertStudentReport).not.toHaveBeenCalled();
  });

  it.each([
    ['an unknown token', null],
    ['an expired token', { ...storedReport, expiresAt: PAST }],
    ['a revoked token', { ...storedReport, revokedAt: PAST }]
  ])('answers %s with the same 404', async (_label, row) => {
    mocks.getStudentReportByTokenHash.mockResolvedValue(row);

    await expect(getPublicStudentReport('x'.repeat(43))).rejects.toMatchObject({
      statusCode: 404,
      message: 'Report not found'
    });
    expect(mocks.recordStudentReportView).not.toHaveBeenCalled();
  });

  it('returns branded, minimal data for a live token', async () => {
    mocks.getStudentReportByTokenHash.mockResolvedValue(storedReport);

    const report = await getPublicStudentReport('x'.repeat(43));

    expect(report.organization).toEqual({ name: 'Academy', logoUrl: null, themeColor: '#e11d48' });
    expect(report.masteredSkills).toEqual([{ code: 'A', name: 'Add', level: 'mastered', score: 91 }]);
    expect(report.skillsToWorkOn).toEqual([{ code: 'B', name: 'Subtract', level: 'learning', score: 40 }]);
    expect(report.scores[0]).toMatchObject({ exerciseTitle: 'Quiz', percent: 75 });
    expect(JSON.stringify(report)).not.toMatch(/profile-1|course-1|@/);
    expect(mocks.recordStudentReportView).toHaveBeenCalledWith('report-1');
  });
});
