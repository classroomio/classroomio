import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@cio/db/queries/course', () => ({
  getCourseById: vi.fn()
}));

vi.mock('@cio/db/queries/course/people', () => ({
  getProfileByGroupMemberId: vi.fn()
}));

vi.mock('@cio/db/queries/group/group', () => ({
  getGroupMemberIdByCourseAndProfile: vi.fn(),
  getUserCourseRole: vi.fn()
}));

vi.mock('@api/services/course/completion', () => ({
  evaluateCourseCertification: vi.fn()
}));

vi.mock('@cio/db/queries/course/compliance', () => ({
  createCourseCertificateIssue: vi.fn(),
  createCourseCompletionNotificationEvent: vi.fn(),
  createCourseCompletionRecord: vi.fn(),
  getCourseComplianceHistoryRows: vi.fn(),
  getCourseCurrentComplianceRows: vi.fn(),
  getLatestComplianceRecordsByProfiles: vi.fn(),
  getOrgComplianceLearnerRows: vi.fn(),
  getStudentCourseMembersForCompliance: vi.fn(),
  listComplianceRecordsReadyForExpiry: vi.fn(),
  listLatestComplianceRecordsForReminderScan: vi.fn(),
  updateCourseCertificateIssueStatusByRecordId: vi.fn(),
  updateCourseCompletionRecord: vi.fn()
}));

vi.mock('@cio/db/queries/course/certification-exercise', () => ({
  getExerciseTitleAndMaxPoints: vi.fn(),
  getStudentSubmissionsForExercise: vi.fn()
}));

vi.mock('@cio/db/queries/activity', () => ({
  getActivitiesByCourseId: vi.fn()
}));

vi.mock('@cio/core/services/activity/providers', () => ({
  ACTIVITY_PROVIDERS: {
    scorm: {
      complianceSnapshot: vi.fn()
    }
  }
}));

vi.mock('@cio/db/drizzle', () => ({
  db: {
    transaction: vi.fn(async (callback: (tx: unknown) => unknown) => callback({}))
  }
}));

import { getCourseById } from '@cio/db/queries/course';
import { getGroupMemberIdByCourseAndProfile } from '@cio/db/queries/group/group';
import { getActivitiesByCourseId } from '@cio/db/queries/activity';
import { ACTIVITY_PROVIDERS } from '@cio/core/services/activity/providers';
import { evaluateCourseCertification } from '@api/services/course/completion';
import { getLatestComplianceRecordsByProfiles, updateCourseCompletionRecord } from '@cio/db/queries/course/compliance';
import {
  getExerciseTitleAndMaxPoints,
  getStudentSubmissionsForExercise
} from '@cio/db/queries/course/certification-exercise';
import { db } from '@cio/db/drizzle';
import { syncComplianceProgressForMember } from '@api/services/course/compliance';

function buildScormCourse() {
  return {
    id: 'course-1',
    type: 'COMPLIANCE',
    format: 'scorm',
    compliance: { retakeIntervalMonths: 12 },
    certificate: {
      deadline: '2027-12-31T23:59:00.000Z',
      requiredExerciseId: null,
      isDownloadable: false
    }
  };
}

function buildActiveRecord(overrides: Record<string, unknown> = {}) {
  return {
    id: 'record-1',
    courseId: 'course-1',
    groupMemberId: 'member-1',
    profileId: 'profile-1',
    cycleNumber: 1,
    status: 'in_progress',
    dueDate: '2027-12-31T23:59:00.000Z',
    startedAt: '2026-01-01T00:00:00.000Z',
    completedAt: null,
    validUntil: null,
    score: null,
    attempts: 0,
    timeSpentMinutes: 0,
    ...overrides
  };
}

describe('syncComplianceProgressForMember in SCORM courses', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getCourseById).mockResolvedValue([buildScormCourse()] as never);
    vi.mocked(getGroupMemberIdByCourseAndProfile).mockResolvedValue('member-1');
    vi.mocked(getLatestComplianceRecordsByProfiles).mockResolvedValue([buildActiveRecord()] as never);
    vi.mocked(evaluateCourseCertification).mockResolvedValue({
      eligibleForCertificate: true
    } as never);
    vi.mocked(getActivitiesByCourseId).mockResolvedValue([{ id: 'activity-1', kind: 'scorm' }] as never);
    vi.mocked(ACTIVITY_PROVIDERS.scorm.complianceSnapshot).mockResolvedValue({
      score: 90,
      attempts: 2,
      minutes: 3
    });
  });

  it('records the package score, attempts and minutes when the course completes', async () => {
    const result = await syncComplianceProgressForMember('course-1', 'profile-1', 'activity');

    expect(result).toEqual(expect.objectContaining({ status: 'compliant', completed: true }));
    expect(updateCourseCompletionRecord).toHaveBeenCalledWith(
      'record-1',
      expect.objectContaining({ status: 'compliant', score: 90, attempts: 2, timeSpentMinutes: 3 }),
      expect.anything()
    );
    expect(getStudentSubmissionsForExercise).not.toHaveBeenCalled();
  });

  it('prefers caller-supplied minutes over the package snapshot', async () => {
    await syncComplianceProgressForMember('course-1', 'profile-1', 'activity', 10);

    expect(updateCourseCompletionRecord).toHaveBeenCalledWith(
      'record-1',
      expect.objectContaining({ timeSpentMinutes: 10 }),
      expect.anything()
    );
  });

  it('falls back gracefully while the package has no attempts yet', async () => {
    vi.mocked(ACTIVITY_PROVIDERS.scorm.complianceSnapshot).mockResolvedValue(null);

    const result = await syncComplianceProgressForMember('course-1', 'profile-1', 'activity');

    expect(result).toEqual(expect.objectContaining({ status: 'compliant', completed: true }));
    expect(updateCourseCompletionRecord).toHaveBeenCalledWith(
      'record-1',
      expect.objectContaining({ score: null, attempts: 0, timeSpentMinutes: 0 }),
      expect.anything()
    );
  });

  it('keeps the exercise snapshot for standard courses', async () => {
    vi.mocked(getCourseById).mockResolvedValue([
      {
        ...buildScormCourse(),
        format: 'standard',
        certificate: { deadline: '2027-12-31T23:59:00.000Z', requiredExerciseId: 'exercise-1', isDownloadable: false }
      }
    ] as never);
    vi.mocked(getExerciseTitleAndMaxPoints).mockResolvedValue({ maxPoints: 100 } as never);
    vi.mocked(getStudentSubmissionsForExercise).mockResolvedValue([{ gradingState: 'completed', total: 80 }] as never);

    await syncComplianceProgressForMember('course-1', 'profile-1', 'submission');

    expect(ACTIVITY_PROVIDERS.scorm.complianceSnapshot).not.toHaveBeenCalled();
    expect(getStudentSubmissionsForExercise).toHaveBeenCalled();
    expect(updateCourseCompletionRecord).toHaveBeenCalledWith(
      'record-1',
      expect.objectContaining({ score: 80, attempts: 1 }),
      expect.anything()
    );
  });

  it('keeps the stored minutes when neither caller nor package supplies them', async () => {
    vi.mocked(getCourseById).mockResolvedValue([{ ...buildScormCourse(), format: 'standard' }] as never);
    vi.mocked(getLatestComplianceRecordsByProfiles).mockResolvedValue([
      buildActiveRecord({ timeSpentMinutes: 7 })
    ] as never);

    await syncComplianceProgressForMember('course-1', 'profile-1', 'submission');

    expect(updateCourseCompletionRecord).toHaveBeenCalledWith(
      'record-1',
      expect.objectContaining({ timeSpentMinutes: 7 }),
      expect.anything()
    );
  });
});
