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
  db: { transaction: vi.fn(async (callback: (tx: unknown) => unknown) => callback({})) }
}));

import { getCourseById } from '@cio/db/queries/course';
import { getProfileByGroupMemberId } from '@cio/db/queries/course/people';
import { getGroupMemberIdByCourseAndProfile } from '@cio/db/queries/group/group';
import { evaluateCourseCertification } from '@api/services/course/completion';
import { getLatestComplianceRecordsByProfiles } from '@cio/db/queries/course/compliance';
import { syncComplianceProgressFromSubmission } from '@api/services/course/compliance';

function activeRecord() {
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
    timeSpentMinutes: 0
  };
}

function complianceCourse() {
  return {
    id: 'course-1',
    type: 'COMPLIANCE',
    compliance: { retakeIntervalMonths: 12 },
    certificate: { deadline: '2027-12-31T23:59:00.000Z', requiredExerciseId: null, isDownloadable: false }
  };
}

describe('characterization: syncComplianceProgressFromSubmission (zero activities)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getCourseById).mockResolvedValue([complianceCourse()] as never);
    vi.mocked(getProfileByGroupMemberId).mockResolvedValue({ id: 'profile-1' } as never);
    vi.mocked(getGroupMemberIdByCourseAndProfile).mockResolvedValue('member-1');
    vi.mocked(getLatestComplianceRecordsByProfiles).mockResolvedValue([activeRecord()] as never);
    vi.mocked(evaluateCourseCertification).mockResolvedValue({ eligibleForCertificate: false } as never);
  });

  it('returns null for non-compliance courses after resolving the profile', async () => {
    vi.mocked(getCourseById).mockResolvedValue([{ id: 'course-1', type: 'SELF_PACED' }] as never);

    await expect(syncComplianceProgressFromSubmission('course-1', 'member-1')).resolves.toBeNull();
    expect(getProfileByGroupMemberId).toHaveBeenCalledWith('member-1');
    expect(evaluateCourseCertification).not.toHaveBeenCalled();
  });

  it('returns null when the submission member has no profile', async () => {
    vi.mocked(getProfileByGroupMemberId).mockResolvedValue(null);

    await expect(syncComplianceProgressFromSubmission('course-1', 'member-1')).resolves.toBeNull();
    expect(evaluateCourseCertification).not.toHaveBeenCalled();
  });

  it('resolves the member profile and delegates to the member sync', async () => {
    const result = await syncComplianceProgressFromSubmission('course-1', 'member-1');

    expect(getProfileByGroupMemberId).toHaveBeenCalledWith('member-1');
    expect(getGroupMemberIdByCourseAndProfile).toHaveBeenCalledWith('course-1', 'profile-1');
    expect(result).toEqual({ status: 'in_progress', completed: false });
  });
});
