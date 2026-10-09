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

vi.mock('@cio/db/drizzle', () => ({
  db: {
    transaction: vi.fn(async (callback: (tx: unknown) => unknown) => callback({}))
  }
}));

import { getCourseById } from '@cio/db/queries/course';
import { getProfileByGroupMemberId } from '@cio/db/queries/course/people';
import { getGroupMemberIdByCourseAndProfile } from '@cio/db/queries/group/group';
import { evaluateCourseCertification } from '@api/services/course/completion';
import {
  createCourseCertificateIssue,
  getLatestComplianceRecordsByProfiles,
  updateCourseCompletionRecord
} from '@cio/db/queries/course/compliance';
import { db } from '@cio/db/drizzle';
import { syncComplianceProgressForMember, syncComplianceProgressFromSubmission } from '@api/services/course/compliance';

function buildComplianceCourse() {
  return {
    id: 'course-1',
    type: 'COMPLIANCE',
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
    status: 'not_started',
    dueDate: '2027-12-31T23:59:00.000Z',
    startedAt: null,
    completedAt: null,
    validUntil: null,
    score: null,
    attempts: 0,
    timeSpentMinutes: 0,
    ...overrides
  };
}

describe('syncComplianceProgressForMember', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getCourseById).mockResolvedValue([buildComplianceCourse()] as never);
    vi.mocked(getGroupMemberIdByCourseAndProfile).mockResolvedValue('member-1');
    vi.mocked(getLatestComplianceRecordsByProfiles).mockResolvedValue([buildActiveRecord()] as never);
    vi.mocked(evaluateCourseCertification).mockResolvedValue({
      eligibleForCertificate: true
    } as never);
  });

  it('returns null for non-compliance courses', async () => {
    vi.mocked(getCourseById).mockResolvedValue([{ id: 'course-1', type: 'SELF_PACED' }] as never);

    const result = await syncComplianceProgressForMember('course-1', 'profile-1', 'lesson');

    expect(result).toBeNull();
    expect(evaluateCourseCertification).not.toHaveBeenCalled();
  });

  it('returns null when the learner has no course membership', async () => {
    vi.mocked(getGroupMemberIdByCourseAndProfile).mockResolvedValue(null);

    const result = await syncComplianceProgressForMember('course-1', 'profile-1', 'lesson');

    expect(result).toBeNull();
  });

  it('marks a lessons-only course compliant once certification is eligible', async () => {
    const result = await syncComplianceProgressForMember('course-1', 'profile-1', 'lesson');

    expect(evaluateCourseCertification).toHaveBeenCalledWith('course-1', 'profile-1');
    expect(db.transaction).toHaveBeenCalledTimes(1);
    expect(result).toMatchObject({ status: 'compliant', completed: true });
  });

  it('stays in progress when certification is not yet eligible', async () => {
    vi.mocked(evaluateCourseCertification).mockResolvedValue({
      eligibleForCertificate: false
    } as never);

    const result = await syncComplianceProgressForMember('course-1', 'profile-1', 'lesson');

    expect(result).toEqual({ status: 'in_progress', completed: false });
    expect(db.transaction).not.toHaveBeenCalled();
  });

  it('stores supplied time on progress and completion', async () => {
    const result = await syncComplianceProgressForMember('course-1', 'profile-1', 'lesson', 45);

    expect(updateCourseCompletionRecord).toHaveBeenCalled();
    const progressCall = vi
      .mocked(updateCourseCompletionRecord)
      .mock.calls.find((call) => (call[1] as { status?: string }).status === 'in_progress');

    expect(progressCall?.[1]).toMatchObject({ timeSpentMinutes: 45 });
    expect(result).toMatchObject({ completed: true });
  });

  it('lets a smaller supplied time replace the stored value', async () => {
    vi.mocked(getLatestComplianceRecordsByProfiles).mockResolvedValue([
      buildActiveRecord({ status: 'in_progress', startedAt: '2026-09-01T00:00:00.000Z', timeSpentMinutes: 60 })
    ] as never);

    const result = await syncComplianceProgressForMember('course-1', 'profile-1', 'activity', 20);

    const timeWrites = vi
      .mocked(updateCourseCompletionRecord)
      .mock.calls.filter((call: Parameters<typeof updateCourseCompletionRecord>) => 'timeSpentMinutes' in call[1]);

    expect(timeWrites.length).toBeGreaterThan(0);
    for (const call of timeWrites) {
      expect(call[1].timeSpentMinutes).toBe(20);
    }
    expect(result).toMatchObject({ completed: true });
  });

  it('does not move a record that is already complete', async () => {
    vi.mocked(getLatestComplianceRecordsByProfiles).mockResolvedValue([
      buildActiveRecord({ status: 'compliant', completedAt: '2026-10-01T00:00:00.000Z' })
    ] as never);

    const result = await syncComplianceProgressForMember('course-1', 'profile-1', 'lesson');

    expect(result).toMatchObject({ completed: true });
    expect(db.transaction).not.toHaveBeenCalled();
  });
});

describe('syncComplianceProgressFromSubmission', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getCourseById).mockResolvedValue([buildComplianceCourse()] as never);
    vi.mocked(getProfileByGroupMemberId).mockResolvedValue({ id: 'profile-1' } as never);
    vi.mocked(getGroupMemberIdByCourseAndProfile).mockResolvedValue('member-1');
    vi.mocked(getLatestComplianceRecordsByProfiles).mockResolvedValue([buildActiveRecord()] as never);
    vi.mocked(evaluateCourseCertification).mockResolvedValue({
      eligibleForCertificate: true
    } as never);
  });

  it('resolves the profile and syncs as before', async () => {
    const result = await syncComplianceProgressFromSubmission('course-1', 'member-1');

    expect(getProfileByGroupMemberId).toHaveBeenCalledWith('member-1');
    expect(getGroupMemberIdByCourseAndProfile).toHaveBeenCalledWith('course-1', 'profile-1');
    expect(createCourseCertificateIssue).not.toHaveBeenCalled();
    expect(result).toMatchObject({ status: 'compliant', completed: true });
  });

  it('returns null when the submission member has no profile', async () => {
    vi.mocked(getProfileByGroupMemberId).mockResolvedValue(null);

    const result = await syncComplianceProgressFromSubmission('course-1', 'member-1');

    expect(result).toBeNull();
    expect(evaluateCourseCertification).not.toHaveBeenCalled();
  });
});
