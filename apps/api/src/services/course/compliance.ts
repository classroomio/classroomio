import { AppError, ErrorCodes } from '@api/utils/errors';
import {
  createCourseCertificateIssue,
  createCourseCompletionNotificationEvent,
  createCourseCompletionRecord,
  getCourseComplianceHistoryRows,
  getCourseCurrentComplianceRows,
  getLatestComplianceRecordsByProfiles,
  getOrgComplianceLearnerRows,
  getStudentCourseMembersForCompliance,
  listComplianceRecordsReadyForExpiry,
  listLatestComplianceRecordsForReminderScan,
  updateCourseCertificateIssueStatusByRecordId,
  updateCourseCompletionRecord,
  type OrgComplianceLearnerRow
} from '@cio/db/queries/course/compliance';
import { db } from '@cio/db/drizzle';
import { getCourseById } from '@cio/db/queries/course';

import { ROLE } from '@cio/utils/constants';
import type {
  TCourseComplianceExtend,
  TCourseComplianceReset,
  TCourseComplianceWaive
} from '@cio/utils/validation/course/compliance';
import type { TCourseCompletionRecord } from '@cio/db/types';
import {
  getExerciseTitleAndMaxPoints,
  getStudentSubmissionsForExercise
} from '@cio/db/queries/course/certification-exercise';
import { getProfileByGroupMemberId } from '@cio/db/queries/course/people';
import { getUserCourseRole } from '@cio/db/queries/group/group';
import { evaluateCourseCertification } from './completion';

type ComplianceStatus =
  | 'not_started'
  | 'in_progress'
  | 'compliant'
  | 'expiring_soon'
  | 'in_grace_period'
  | 'non_compliant'
  | 'waived';

type ComplianceSettings = NonNullable<Awaited<ReturnType<typeof getComplianceCourseOrThrow>>['compliance']>;

function ensureFutureOrPresentIsoDate(dateIso: string, field: string) {
  const date = new Date(dateIso);
  if (Number.isNaN(date.getTime())) {
    throw new AppError('Invalid date provided', ErrorCodes.VALIDATION_ERROR, 400, field);
  }
}

function getReminderEventType(daysUntilDue: number) {
  return `reminder_${daysUntilDue}d`;
}

function addMonths(isoDate: string, months: number) {
  const date = new Date(isoDate);
  date.setUTCMonth(date.getUTCMonth() + months);
  return date.toISOString();
}

function getWholeDaysUntil(startDate: Date, endDate: Date) {
  const millisecondsPerDay = 24 * 60 * 60 * 1000;
  return Math.ceil((endDate.getTime() - startDate.getTime()) / millisecondsPerDay);
}

function getStatusCounts(records: Array<{ record: TCourseCompletionRecord | null }>) {
  const counts: Record<ComplianceStatus | 'no_record', number> = {
    no_record: 0,
    not_started: 0,
    in_progress: 0,
    compliant: 0,
    expiring_soon: 0,
    in_grace_period: 0,
    non_compliant: 0,
    waived: 0
  };

  for (const row of records) {
    if (!row.record) {
      counts.no_record += 1;
      continue;
    }

    const status = row.record.status as ComplianceStatus;
    counts[status] = (counts[status] ?? 0) + 1;
  }

  return counts;
}

async function getComplianceCourseOrThrow(courseId: string) {
  const [course] = await getCourseById(courseId);

  if (!course) {
    throw new AppError('Course not found', ErrorCodes.COURSE_NOT_FOUND, 404);
  }

  if (course.type !== 'COMPLIANCE' || !course.compliance) {
    throw new AppError('Course is not a compliance course', ErrorCodes.VALIDATION_ERROR, 400);
  }

  return course;
}

async function assertCourseComplianceHistoryAccess(
  courseId: string,
  currentProfileId: string,
  targetProfileId: string
) {
  if (currentProfileId === targetProfileId) {
    return;
  }

  const roleId = await getUserCourseRole(courseId, currentProfileId);

  if (roleId !== ROLE.ADMIN && roleId !== ROLE.TUTOR) {
    throw new AppError('You do not have permission to view this learner', ErrorCodes.VALIDATION_ERROR, 403);
  }
}

async function getTargetStudentMembers(courseId: string, profileIds?: string[]) {
  const students = await getStudentCourseMembersForCompliance(courseId, profileIds);

  if (profileIds && students.length !== profileIds.length) {
    throw new AppError(
      'One or more learners were not found in this course',
      ErrorCodes.VALIDATION_ERROR,
      400,
      'profileIds'
    );
  }

  return students;
}

function resolveComplianceInitialDueDate(course: Awaited<ReturnType<typeof getComplianceCourseOrThrow>>) {
  const dueDate = course.certificate?.deadline ?? null;

  if (!dueDate) {
    throw new AppError(
      'Compliance courses require a certificate deadline before learners can be enrolled',
      ErrorCodes.VALIDATION_ERROR,
      400,
      'certificate.deadline'
    );
  }

  const parsedDueDate = new Date(dueDate);
  if (Number.isNaN(parsedDueDate.getTime())) {
    throw new AppError(
      'Compliance course deadline is invalid',
      ErrorCodes.VALIDATION_ERROR,
      400,
      'certificate.deadline'
    );
  }

  return dueDate;
}

function getCurrentIncompleteRecord(record: TCourseCompletionRecord | undefined | null) {
  if (!record) {
    return null;
  }

  if (record.completedAt) {
    return null;
  }

  return record;
}

async function getComplianceCompletionSnapshot(params: {
  groupMemberId: string;
  requiredExerciseId: string | null | undefined;
}) {
  const { groupMemberId, requiredExerciseId } = params;

  if (!requiredExerciseId) {
    return {
      score: null,
      attempts: null
    };
  }

  const { maxPoints } = await getExerciseTitleAndMaxPoints(requiredExerciseId);
  const submissions = await getStudentSubmissionsForExercise(groupMemberId, requiredExerciseId);
  const completedSubmissions = submissions.filter((submission) => submission.gradingState === 'completed');

  if (completedSubmissions.length === 0 || maxPoints <= 0) {
    return {
      score: null,
      attempts: submissions.length
    };
  }

  const bestScorePercent = completedSubmissions.reduce((highestPercent, submission) => {
    const totalPoints = Number(submission.total ?? 0);
    const nextPercent = Math.round((totalPoints / maxPoints) * 100);

    return Math.max(highestPercent, nextPercent);
  }, 0);

  return {
    score: bestScorePercent,
    attempts: submissions.length
  };
}

async function ensureComplianceEnrollmentRecordForLearner(courseId: string, groupMemberId: string, profileId: string) {
  const course = await getComplianceCourseOrThrow(courseId);
  const dueDate = resolveComplianceInitialDueDate(course);
  const [existingRecord] = await getLatestComplianceRecordsByProfiles(courseId, [profileId]);

  if (existingRecord) {
    return existingRecord;
  }

  return createCourseCompletionRecord({
    courseId,
    groupMemberId,
    profileId,
    cycleNumber: 1,
    status: 'not_started',
    dueDate,
    attempts: 0,
    timeSpentMinutes: 0
  });
}

export async function ensureComplianceEnrollmentRecordsForProfiles(courseIds: string[], profileIds: string[]) {
  if (courseIds.length === 0 || profileIds.length === 0) {
    return {
      createdCount: 0
    };
  }

  let createdCount = 0;

  for (const courseId of courseIds) {
    const [course] = await getCourseById(courseId);

    if (!course || course.type !== 'COMPLIANCE') {
      continue;
    }

    resolveComplianceInitialDueDate(await getComplianceCourseOrThrow(courseId));

    const learners = await getStudentCourseMembersForCompliance(courseId, profileIds);
    for (const learner of learners) {
      const profileId = learner.member.profileId;
      if (!profileId) {
        continue;
      }

      const [existingRecord] = await getLatestComplianceRecordsByProfiles(courseId, [profileId]);
      if (existingRecord) {
        continue;
      }

      await ensureComplianceEnrollmentRecordForLearner(courseId, learner.member.id, profileId);
      createdCount += 1;
    }
  }

  return {
    createdCount
  };
}

export async function syncComplianceProgressFromSubmission(courseId: string, groupMemberId: string) {
  const [course] = await getCourseById(courseId);

  if (!course || course.type !== 'COMPLIANCE') {
    return null;
  }

  const profile = await getProfileByGroupMemberId(groupMemberId);
  if (!profile) {
    return null;
  }

  const activeRecord = await ensureComplianceEnrollmentRecordForLearner(courseId, groupMemberId, profile.id);
  if (!activeRecord.completedAt && activeRecord.status === 'not_started') {
    await updateCourseCompletionRecord(activeRecord.id, {
      status: 'in_progress',
      startedAt: activeRecord.startedAt ?? new Date().toISOString()
    });
  }

  const evaluation = await evaluateCourseCertification(courseId, profile.id);
  if (!evaluation.eligibleForCertificate) {
    return {
      status: 'in_progress',
      completed: false
    };
  }

  const latestRecord = await ensureComplianceEnrollmentRecordForLearner(courseId, groupMemberId, profile.id);
  if (latestRecord.completedAt) {
    return {
      status: latestRecord.status,
      completed: true
    };
  }

  const completedAt = new Date().toISOString();
  const validUntil = addMonths(completedAt, course.compliance?.retakeIntervalMonths ?? 0);
  const completionSnapshot = await getComplianceCompletionSnapshot({
    groupMemberId,
    requiredExerciseId: course.certificate?.requiredExerciseId ?? null
  });

  await db.transaction(async (tx) => {
    await updateCourseCompletionRecord(
      latestRecord.id,
      {
        status: 'compliant',
        startedAt: latestRecord.startedAt ?? completedAt,
        completedAt,
        validUntil,
        score: completionSnapshot.score ?? latestRecord.score,
        attempts: completionSnapshot.attempts ?? latestRecord.attempts
      },
      tx
    );

    if (course.certificate?.isDownloadable) {
      await createCourseCertificateIssue(
        {
          courseId,
          profileId: profile.id,
          courseCompletionRecordId: latestRecord.id,
          cycleNumber: latestRecord.cycleNumber,
          expiresAt: validUntil,
          status: 'valid'
        },
        tx
      );
    }
  });

  return {
    status: 'compliant',
    completed: true,
    validUntil
  };
}

export async function getCourseComplianceOverview(courseId: string) {
  const course = await getComplianceCourseOrThrow(courseId);
  const rows = await getCourseCurrentComplianceRows(courseId);
  const counts = getStatusCounts(rows);

  return {
    courseId: course.id,
    compliance: course.compliance,
    summary: {
      totalLearners: rows.length,
      noRecord: counts.no_record,
      notStarted: counts.not_started,
      inProgress: counts.in_progress,
      compliant: counts.compliant,
      expiringSoon: counts.expiring_soon,
      inGracePeriod: counts.in_grace_period,
      nonCompliant: counts.non_compliant,
      waived: counts.waived
    },
    learners: rows.map((row) => ({
      groupMemberId: row.member.id,
      profileId: row.member.profileId,
      fullname: row.profile?.fullname ?? null,
      username: row.profile?.username ?? null,
      email: row.profile?.email ?? row.member.email ?? null,
      status: row.record?.status ?? 'not_started',
      cycleNumber: row.record?.cycleNumber ?? null,
      dueDate: row.record?.dueDate ?? null,
      completedAt: row.record?.completedAt ?? null,
      validUntil: row.record?.validUntil ?? null,
      score: row.record?.score ?? null,
      attempts: row.record?.attempts ?? 0,
      waiverExpiresAt: row.record?.waiverExpiresAt ?? null
    }))
  };
}

export async function getLearnerComplianceHistory(courseId: string, currentProfileId: string, targetProfileId: string) {
  await getComplianceCourseOrThrow(courseId);
  await assertCourseComplianceHistoryAccess(courseId, currentProfileId, targetProfileId);

  const history = await getCourseComplianceHistoryRows(courseId, targetProfileId);

  if (!history.member) {
    throw new AppError('Learner not found in this course', ErrorCodes.NOT_FOUND, 404);
  }

  return {
    learner: {
      groupMemberId: history.member.id,
      profileId: history.member.profileId,
      fullname: history.profile?.fullname ?? null,
      username: history.profile?.username ?? null,
      avatarUrl: history.profile?.avatarUrl ?? null,
      email: history.profile?.email ?? history.member.email ?? null
    },
    currentRecord: history.records[0] ?? null,
    history: history.records
  };
}

export async function resetCourseCompliance(courseId: string, payload: TCourseComplianceReset) {
  await getComplianceCourseOrThrow(courseId);
  ensureFutureOrPresentIsoDate(payload.dueDate, 'dueDate');

  const students = await getTargetStudentMembers(courseId, payload.profileIds);
  const profileIds = students.flatMap((student) => (student.member.profileId ? [student.member.profileId] : []));
  const existingRecords = await getLatestComplianceRecordsByProfiles(courseId, profileIds);
  const recordByProfileId = new Map(existingRecords.map((record) => [record.profileId, record]));

  let createdCount = 0;
  let updatedCount = 0;

  await db.transaction(async (tx) => {
    for (const student of students) {
      const profileId = student.member.profileId;
      if (!profileId) {
        continue;
      }

      const existingRecord = recordByProfileId.get(profileId);
      if (!existingRecord) {
        await createCourseCompletionRecord(
          {
            courseId,
            groupMemberId: student.member.id,
            profileId,
            cycleNumber: 1,
            status: 'not_started',
            dueDate: payload.dueDate,
            attempts: 0,
            timeSpentMinutes: 0
          },
          tx
        );
        createdCount += 1;
        continue;
      }

      await updateCourseCompletionRecord(
        existingRecord.id,
        {
          status: 'not_started',
          dueDate: payload.dueDate,
          startedAt: null,
          completedAt: null,
          validUntil: null,
          expiredAt: null,
          score: null,
          attempts: 0,
          timeSpentMinutes: 0,
          waivedBy: null,
          waiverReason: null,
          waiverExpiresAt: null
        },
        tx
      );
      updatedCount += 1;
    }
  });

  return {
    createdCount,
    updatedCount,
    learnerCount: students.length,
    dueDate: payload.dueDate
  };
}

export async function extendCourseCompliance(courseId: string, payload: TCourseComplianceExtend) {
  await getComplianceCourseOrThrow(courseId);
  ensureFutureOrPresentIsoDate(payload.dueDate, 'dueDate');

  const students = await getTargetStudentMembers(courseId, payload.profileIds);
  const profileIds = students.flatMap((student) => (student.member.profileId ? [student.member.profileId] : []));
  const existingRecords = await getLatestComplianceRecordsByProfiles(courseId, profileIds);
  const recordByProfileId = new Map(existingRecords.map((record) => [record.profileId, record]));

  let createdCount = 0;
  let updatedCount = 0;
  let skippedCount = 0;

  await db.transaction(async (tx) => {
    for (const student of students) {
      const profileId = student.member.profileId;
      if (!profileId) {
        continue;
      }

      const existingRecord = getCurrentIncompleteRecord(recordByProfileId.get(profileId));
      if (!existingRecord) {
        const latestRecord = recordByProfileId.get(profileId);
        if (latestRecord?.completedAt) {
          skippedCount += 1;
          continue;
        }

        await createCourseCompletionRecord(
          {
            courseId,
            groupMemberId: student.member.id,
            profileId,
            cycleNumber: latestRecord ? latestRecord.cycleNumber + 1 : 1,
            status: 'not_started',
            dueDate: payload.dueDate,
            attempts: 0,
            timeSpentMinutes: 0
          },
          tx
        );
        createdCount += 1;
        continue;
      }

      await updateCourseCompletionRecord(
        existingRecord.id,
        {
          dueDate: payload.dueDate
        },
        tx
      );
      updatedCount += 1;
    }
  });

  return {
    createdCount,
    updatedCount,
    skippedCount,
    learnerCount: students.length,
    dueDate: payload.dueDate
  };
}

export async function waiveCourseCompliance(courseId: string, actorProfileId: string, payload: TCourseComplianceWaive) {
  await getComplianceCourseOrThrow(courseId);

  if (payload.waiverExpiresAt) {
    ensureFutureOrPresentIsoDate(payload.waiverExpiresAt, 'waiverExpiresAt');
  }

  const students = await getTargetStudentMembers(courseId, payload.profileIds);
  const profileIds = students.flatMap((student) => (student.member.profileId ? [student.member.profileId] : []));
  const existingRecords = await getLatestComplianceRecordsByProfiles(courseId, profileIds);
  const recordByProfileId = new Map(existingRecords.map((record) => [record.profileId, record]));

  let updatedCount = 0;
  let skippedCount = 0;

  await db.transaction(async (tx) => {
    for (const student of students) {
      const profileId = student.member.profileId;
      if (!profileId) {
        continue;
      }

      const existingRecord = getCurrentIncompleteRecord(recordByProfileId.get(profileId));
      if (!existingRecord) {
        skippedCount += 1;
        continue;
      }

      await updateCourseCompletionRecord(
        existingRecord.id,
        {
          status: 'waived',
          waivedBy: actorProfileId,
          waiverReason: payload.waiverReason ?? null,
          waiverExpiresAt: payload.waiverExpiresAt ?? null
        },
        tx
      );
      updatedCount += 1;
    }
  });

  return {
    updatedCount,
    skippedCount,
    learnerCount: students.length,
    waiverExpiresAt: payload.waiverExpiresAt ?? null
  };
}

export async function runComplianceExpiryCheck() {
  const nowIso = new Date().toISOString();
  const records = await listComplianceRecordsReadyForExpiry(nowIso);

  let processedCount = 0;
  let createdCycleCount = 0;
  let skippedCount = 0;

  for (const record of records) {
    if (!record.validUntil) {
      skippedCount += 1;
      continue;
    }

    const nextDueDate = record.validUntil;

    await db.transaction(async (tx) => {
      await updateCourseCompletionRecord(
        record.id,
        {
          expiredAt: nowIso
        },
        tx
      );

      await updateCourseCertificateIssueStatusByRecordId(record.id, 'expired', tx);

      const created = await createCourseCompletionRecord(
        {
          courseId: record.courseId,
          groupMemberId: record.groupMemberId,
          profileId: record.profileId,
          cycleNumber: record.cycleNumber + 1,
          status: 'not_started',
          dueDate: nextDueDate,
          attempts: 0,
          timeSpentMinutes: 0
        },
        tx
      ).catch((error) => {
        if (error instanceof Error && error.message.includes('duplicate key value')) {
          return null;
        }

        throw error;
      });

      processedCount += 1;
      if (created) {
        createdCycleCount += 1;
      } else {
        skippedCount += 1;
      }
    });
  }

  return {
    processedCount,
    createdCycleCount,
    skippedCount
  };
}

export async function runComplianceReminderScan() {
  const now = new Date();
  const rows = await listLatestComplianceRecordsForReminderScan();

  let scannedCount = 0;
  let statusUpdatedCount = 0;
  let reminderEventCount = 0;

  for (const row of rows) {
    scannedCount += 1;

    const compliance = row.course.compliance as ComplianceSettings | null;
    if (!compliance) {
      continue;
    }

    if (row.record.status === 'waived') {
      continue;
    }

    const dueDate = new Date(row.record.dueDate);
    if (Number.isNaN(dueDate.getTime())) {
      continue;
    }

    const daysUntilDue = getWholeDaysUntil(now, dueDate);
    const gracePeriodDays = compliance.gracePeriodDays ?? 0;
    let nextStatus: ComplianceStatus | null = null;

    if (daysUntilDue < 0) {
      const gracePeriodEndsAt = new Date(dueDate.getTime() + gracePeriodDays * 24 * 60 * 60 * 1000);
      nextStatus = gracePeriodDays > 0 && now <= gracePeriodEndsAt ? 'in_grace_period' : 'non_compliant';
    } else if ((compliance.reminderDaysBefore ?? []).includes(daysUntilDue)) {
      nextStatus = 'expiring_soon';

      const createdEvent = await createCourseCompletionNotificationEvent({
        courseCompletionRecordId: row.record.id,
        channel: 'email',
        eventType: getReminderEventType(daysUntilDue)
      });

      if (createdEvent) {
        reminderEventCount += 1;
      }
    }

    if (nextStatus && row.record.status !== nextStatus) {
      await updateCourseCompletionRecord(row.record.id, { status: nextStatus });
      statusUpdatedCount += 1;
    }
  }

  return {
    scannedCount,
    statusUpdatedCount,
    reminderEventCount
  };
}

type OrgComplianceStatus = ComplianceStatus | 'no_record';

const STATUS_KEYS: OrgComplianceStatus[] = [
  'compliant',
  'expiring_soon',
  'in_grace_period',
  'non_compliant',
  'waived',
  'in_progress',
  'not_started',
  'no_record'
];

function emptyStatusCounts() {
  const counts = {} as Record<OrgComplianceStatus, number>;
  for (const status of STATUS_KEYS) counts[status] = 0;
  return counts;
}

export type OrgComplianceOverview = {
  summary: {
    totalLearners: number;
    totalCourses: number;
    counts: Record<OrgComplianceStatus, number>;
  };
  courses: Array<{
    courseId: string;
    courseTitle: string;
    learnerCount: number;
    counts: Record<OrgComplianceStatus, number>;
  }>;
  learners: Array<{
    groupMemberId: string;
    profileId: string | null;
    fullname: string | null;
    email: string | null;
    avatarUrl: string | null;
    courseId: string;
    courseTitle: string;
    status: OrgComplianceStatus;
    cycleNumber: number | null;
    dueDate: string | null;
    completedAt: string | null;
    validUntil: string | null;
  }>;
};

/**
 * Aggregates compliance state across every COMPLIANCE course in an
 * organization. Returns status tallies, per-course breakdown, and the
 * flat learner-by-course list for the dashboard table.
 */
export async function getOrgComplianceOverview(orgId: string): Promise<OrgComplianceOverview> {
  const rows = await getOrgComplianceLearnerRows(orgId);

  const summaryCounts = emptyStatusCounts();
  const courseMap = new Map<
    string,
    { title: string; learnerCount: number; counts: Record<OrgComplianceStatus, number> }
  >();
  const uniqueLearners = new Set<string>();

  for (const row of rows) {
    const status = row.status as OrgComplianceStatus;
    summaryCounts[status] = (summaryCounts[status] ?? 0) + 1;
    if (row.profileId) uniqueLearners.add(row.profileId);

    let courseAcc = courseMap.get(row.courseId);
    if (!courseAcc) {
      courseAcc = { title: row.courseTitle, learnerCount: 0, counts: emptyStatusCounts() };
      courseMap.set(row.courseId, courseAcc);
    }
    courseAcc.learnerCount += 1;
    courseAcc.counts[status] = (courseAcc.counts[status] ?? 0) + 1;
  }

  return {
    summary: {
      totalLearners: uniqueLearners.size,
      totalCourses: courseMap.size,
      counts: summaryCounts
    },
    courses: Array.from(courseMap.entries()).map(([courseId, c]) => ({
      courseId,
      courseTitle: c.title,
      learnerCount: c.learnerCount,
      counts: c.counts
    })),
    learners: rows.map((row: OrgComplianceLearnerRow) => ({
      groupMemberId: row.groupMemberId,
      profileId: row.profileId,
      fullname: row.profile?.fullname ?? null,
      email: row.email,
      avatarUrl: row.profile?.avatarUrl ?? null,
      courseId: row.courseId,
      courseTitle: row.courseTitle,
      status: row.status as OrgComplianceStatus,
      cycleNumber: row.cycleNumber,
      dueDate: row.dueDate,
      completedAt: row.completedAt,
      validUntil: row.validUntil
    }))
  };
}
