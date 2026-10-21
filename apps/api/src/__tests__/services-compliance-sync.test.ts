import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@cio/db/queries/course', () => ({
  getCourseById: vi.fn()
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

vi.mock('@cio/db/queries/course/exercise-results', () => ({
  getExerciseMaxPoints: vi.fn(),
  getStudentExerciseSubmissions: vi.fn()
}));

vi.mock('@cio/db/queries/course/people', () => ({
  getProfileByGroupMemberId: vi.fn()
}));

vi.mock('@cio/db/queries/group/group', () => ({
  getUserCourseRole: vi.fn()
}));

vi.mock('@cio/db/drizzle', () => ({
  db: {
    transaction: vi.fn()
  }
}));

vi.mock('@api/services/course/completion', () => ({
  evaluateCourseCertification: vi.fn(),
  buildCertificateWebhookInput: vi.fn()
}));

vi.mock('@cio/db/queries/course/course', () => ({
  getCourseCertificationRow: vi.fn().mockResolvedValue(null)
}));

vi.mock('@cio/core/services/webhook/emit', () => ({
  emitCourseWebhookEvent: vi.fn().mockResolvedValue(undefined),
  emitWebhookEvent: vi.fn().mockResolvedValue(undefined)
}));

vi.mock('@api/services/course/certificate-plan', () => ({
  orgHasCertificatesEnabled: vi.fn().mockResolvedValue(false)
}));

import { db } from '@cio/db/drizzle';
import { getCourseById } from '@cio/db/queries/course';
import {
  createCourseCompletionRecord,
  getLatestComplianceRecordsByProfiles,
  getStudentCourseMembersForCompliance,
  updateCourseCompletionRecord
} from '@cio/db/queries/course/compliance';
import { emitCourseWebhookEvent } from '@cio/core/services/webhook/emit';
import { getExerciseMaxPoints, getStudentExerciseSubmissions } from '@cio/db/queries/course/exercise-results';
import { getProfileByGroupMemberId } from '@cio/db/queries/course/people';
import { evaluateCourseCertification } from '@api/services/course/completion';
import {
  ensureComplianceEnrollmentRecordsForProfiles,
  syncComplianceProgressFromSubmission
} from '@api/services/course/compliance';

const COURSE_ID = 'course-1';
const GROUP_MEMBER_ID = 'member-1';
const PROFILE_ID = 'profile-1';
const EXERCISE_ID = 'exercise-1';
const RECORD_ID = 'record-1';

describe('syncComplianceProgressFromSubmission', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(getCourseById).mockResolvedValue([
      {
        id: COURSE_ID,
        type: 'COMPLIANCE',
        compliance: { retakeIntervalMonths: 12 },
        certificate: { deadline: '2026-12-31T00:00:00.000Z', isDownloadable: false }
      }
    ] as unknown as Awaited<ReturnType<typeof getCourseById>>);

    vi.mocked(getProfileByGroupMemberId).mockResolvedValue({
      id: PROFILE_ID
    } as unknown as Awaited<ReturnType<typeof getProfileByGroupMemberId>>);

    vi.mocked(getLatestComplianceRecordsByProfiles).mockResolvedValue([
      {
        id: RECORD_ID,
        courseId: COURSE_ID,
        groupMemberId: GROUP_MEMBER_ID,
        profileId: PROFILE_ID,
        cycleNumber: 1,
        status: 'in_progress',
        dueDate: '2026-12-31T00:00:00.000Z',
        startedAt: '2026-01-01T00:00:00.000Z',
        completedAt: null,
        score: null,
        attempts: 0
      }
    ] as unknown as Awaited<ReturnType<typeof getLatestComplianceRecordsByProfiles>>);

    vi.mocked(evaluateCourseCertification).mockResolvedValue({
      eligibleForCertificate: true
    } as unknown as Awaited<ReturnType<typeof evaluateCourseCertification>>);

    vi.mocked(getExerciseMaxPoints).mockResolvedValue(100);
    vi.mocked(getStudentExerciseSubmissions).mockResolvedValue([
      { total: 80, gradingState: 'completed' },
      { total: 90, gradingState: 'completed' },
      { total: 50, gradingState: 'pending' }
    ]);

    vi.mocked(db.transaction).mockImplementation(((callback: (tx: unknown) => Promise<unknown>) =>
      callback({})) as unknown as typeof db.transaction);
  });

  it('records the best graded score and attempt count from the completing exercise', async () => {
    await syncComplianceProgressFromSubmission(COURSE_ID, GROUP_MEMBER_ID, EXERCISE_ID);

    expect(getExerciseMaxPoints).toHaveBeenCalledWith(EXERCISE_ID);
    expect(getStudentExerciseSubmissions).toHaveBeenCalledWith(GROUP_MEMBER_ID, EXERCISE_ID);
    expect(updateCourseCompletionRecord).toHaveBeenCalledWith(
      RECORD_ID,
      expect.objectContaining({
        status: 'compliant',
        score: 90,
        attempts: 3
      }),
      expect.anything()
    );
  });
});

describe('ensureComplianceEnrollmentRecordsForProfiles', () => {
  const createdRecord = {
    id: RECORD_ID,
    courseId: COURSE_ID,
    groupMemberId: GROUP_MEMBER_ID,
    profileId: PROFILE_ID,
    cycleNumber: 1,
    dueDate: '2026-12-31T00:00:00.000Z',
    validUntil: null
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getCourseById).mockResolvedValue([
      { id: COURSE_ID, type: 'COMPLIANCE', compliance: {}, certificate: { deadline: '2026-12-31T00:00:00.000Z' } }
    ] as unknown as Awaited<ReturnType<typeof getCourseById>>);
    vi.mocked(getStudentCourseMembersForCompliance).mockResolvedValue([
      { member: { id: GROUP_MEMBER_ID, profileId: PROFILE_ID } }
    ] as unknown as Awaited<ReturnType<typeof getStudentCourseMembersForCompliance>>);
    vi.mocked(getLatestComplianceRecordsByProfiles).mockResolvedValue([]);
    vi.mocked(createCourseCompletionRecord).mockResolvedValue(
      createdRecord as unknown as Awaited<ReturnType<typeof createCourseCompletionRecord>>
    );
  });

  it('returns the new records without announcing them when the caller owns a transaction', async () => {
    const transaction = {} as Parameters<typeof ensureComplianceEnrollmentRecordsForProfiles>[2];

    const result = await ensureComplianceEnrollmentRecordsForProfiles([COURSE_ID], [PROFILE_ID], transaction);

    expect(result.createdRecords).toEqual([createdRecord]);
    expect(emitCourseWebhookEvent).not.toHaveBeenCalled();
  });

  it('announces the new records straight away when there is no surrounding transaction', async () => {
    await ensureComplianceEnrollmentRecordsForProfiles([COURSE_ID], [PROFILE_ID]);

    expect(emitCourseWebhookEvent).toHaveBeenCalledWith(
      COURSE_ID,
      'compliance.record.status_changed',
      expect.objectContaining({ recordId: RECORD_ID, trigger: 'enrollment', previousStatus: null })
    );
  });
});
