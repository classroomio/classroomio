import * as schema from '@db/schema';
import { and, count, desc, eq, lte, sql } from 'drizzle-orm';
import { db, type DbOrTxClient } from '@db/drizzle';

export type TWebhookMemberDetails = {
  memberId: string;
  enrolledAt: string | null;
  profileId: string | null;
};

export type TWebhookCompletionRecordDetails = {
  cycleNumber: number;
  startedAt: string | null;
  completedAt: string | null;
  dueDate: string;
  validUntil: string | null;
  score: number | null;
  attempts: number | null;
  timeSpentMinutes: number | null;
};

export type TWebhookCertificateIssueDetails = {
  id: string;
  issuedAt: string;
  expiresAt: string;
  cycleNumber: number;
  status: string;
};

export type TWebhookExerciseDetails = {
  maxScore: number;
  passThreshold: number | null;
  dueBy: string | null;
  allowMultipleAttempts: boolean;
  sectionId: string | null;
  sectionTitle: string | null;
};

export type TWebhookSubmissionDetails = {
  overallStatus: string;
  gradingState: string;
  gradedBy: string | null;
  submittedAt: string | null;
  updatedAt: string | null;
  attemptNumber: number;
};

export type TWebhookInviteDetails = {
  roleId: number;
  expiresAt: string;
  maxUses: number | null;
  usedCount: number | null;
  allowedDomains: string[] | null;
  acceptedByProfileId: string | null;
};

/**
 * Reads the enrollment row for a course member. Returns null when the member no longer exists.
 */
export async function getWebhookMemberDetails(
  memberId: string,
  client: DbOrTxClient = db
): Promise<TWebhookMemberDetails | null> {
  try {
    const [row] = await client
      .select({
        memberId: schema.groupmember.id,
        enrolledAt: schema.groupmember.createdAt,
        profileId: schema.groupmember.profileId
      })
      .from(schema.groupmember)
      .where(eq(schema.groupmember.id, memberId))
      .limit(1);

    return row ?? null;
  } catch (error) {
    console.error('getWebhookMemberDetails error:', error);
    throw new Error('Failed to read webhook member details');
  }
}

/**
 * Reads the member id for a student in a course. Returns null when the student is not enrolled.
 */
export async function getWebhookMemberIdForProfile(
  courseId: string,
  profileId: string,
  client: DbOrTxClient = db
): Promise<string | null> {
  try {
    const [row] = await client
      .select({ id: schema.groupmember.id })
      .from(schema.groupmember)
      .innerJoin(schema.course, eq(schema.course.groupId, schema.groupmember.groupId))
      .where(and(eq(schema.course.id, courseId), eq(schema.groupmember.profileId, profileId)))
      .limit(1);

    return row?.id ?? null;
  } catch (error) {
    console.error('getWebhookMemberIdForProfile error:', error);
    throw new Error('Failed to read webhook member id');
  }
}

/**
 * Reads the latest compliance cycle for a student in a course. Returns null for courses without one.
 */
export async function getWebhookCompletionRecord(
  courseId: string,
  profileId: string,
  client: DbOrTxClient = db
): Promise<TWebhookCompletionRecordDetails | null> {
  try {
    const [row] = await client
      .select({
        cycleNumber: schema.courseCompletionRecord.cycleNumber,
        startedAt: schema.courseCompletionRecord.startedAt,
        completedAt: schema.courseCompletionRecord.completedAt,
        dueDate: schema.courseCompletionRecord.dueDate,
        validUntil: schema.courseCompletionRecord.validUntil,
        score: schema.courseCompletionRecord.score,
        attempts: schema.courseCompletionRecord.attempts,
        timeSpentMinutes: schema.courseCompletionRecord.timeSpentMinutes
      })
      .from(schema.courseCompletionRecord)
      .where(
        and(
          eq(schema.courseCompletionRecord.courseId, courseId),
          eq(schema.courseCompletionRecord.profileId, profileId)
        )
      )
      .orderBy(desc(schema.courseCompletionRecord.cycleNumber))
      .limit(1);

    return row ?? null;
  } catch (error) {
    console.error('getWebhookCompletionRecord error:', error);
    throw new Error('Failed to read webhook completion record');
  }
}

/**
 * Reads the latest stored certificate for a student in a course. Standard courses store none.
 */
export async function getWebhookCertificateIssue(
  courseId: string,
  profileId: string,
  client: DbOrTxClient = db
): Promise<TWebhookCertificateIssueDetails | null> {
  try {
    const [row] = await client
      .select({
        id: schema.courseCertificateIssue.id,
        issuedAt: schema.courseCertificateIssue.issuedAt,
        expiresAt: schema.courseCertificateIssue.expiresAt,
        cycleNumber: schema.courseCertificateIssue.cycleNumber,
        status: schema.courseCertificateIssue.status
      })
      .from(schema.courseCertificateIssue)
      .where(
        and(
          eq(schema.courseCertificateIssue.courseId, courseId),
          eq(schema.courseCertificateIssue.profileId, profileId)
        )
      )
      .orderBy(desc(schema.courseCertificateIssue.cycleNumber))
      .limit(1);

    return row ?? null;
  } catch (error) {
    console.error('getWebhookCertificateIssue error:', error);
    throw new Error('Failed to read webhook certificate');
  }
}

/**
 * Reads the grading settings and section of an exercise, with the summed question points as `maxScore`.
 */
export async function getWebhookExerciseDetails(
  exerciseId: string,
  client: DbOrTxClient = db
): Promise<TWebhookExerciseDetails | null> {
  try {
    const [[exerciseRow], [pointsRow]] = await Promise.all([
      client
        .select({
          passThreshold: schema.exercise.passThreshold,
          dueBy: schema.exercise.dueBy,
          allowMultipleAttempts: schema.exercise.allowMultipleAttempts,
          sectionId: schema.exercise.sectionId,
          sectionTitle: schema.courseSection.title
        })
        .from(schema.exercise)
        .leftJoin(schema.courseSection, eq(schema.courseSection.id, schema.exercise.sectionId))
        .where(eq(schema.exercise.id, exerciseId))
        .limit(1),
      client
        .select({ maxScore: sql<number>`coalesce(sum(${schema.question.points}), 0)::float` })
        .from(schema.question)
        .where(eq(schema.question.exerciseId, exerciseId))
    ]);

    if (!exerciseRow) return null;

    return { ...exerciseRow, maxScore: pointsRow?.maxScore ?? 0 };
  } catch (error) {
    console.error('getWebhookExerciseDetails error:', error);
    throw new Error('Failed to read webhook exercise details');
  }
}

/**
 * Reads the section a lesson belongs to. Returns null when the lesson has none.
 */
export async function getWebhookLessonSection(
  lessonId: string,
  client: DbOrTxClient = db
): Promise<{ id: string; title: string | null } | null> {
  try {
    const [row] = await client
      .select({ id: schema.courseSection.id, title: schema.courseSection.title })
      .from(schema.lesson)
      .innerJoin(schema.courseSection, eq(schema.courseSection.id, schema.lesson.sectionId))
      .where(eq(schema.lesson.id, lessonId))
      .limit(1);

    return row ?? null;
  } catch (error) {
    console.error('getWebhookLessonSection error:', error);
    throw new Error('Failed to read webhook lesson section');
  }
}

/**
 * Reads when a submission was made and which attempt it is for the member and exercise.
 */
export async function getWebhookSubmissionDetails(
  submissionId: string,
  client: DbOrTxClient = db
): Promise<TWebhookSubmissionDetails | null> {
  try {
    const [row] = await client
      .select({
        overallStatus: schema.submission.overallStatus,
        gradingState: schema.submission.gradingState,
        gradedBy: schema.submission.gradedBy,
        submittedAt: schema.submission.createdAt,
        updatedAt: schema.submission.updatedAt,
        exerciseId: schema.submission.exerciseId,
        submittedBy: schema.submission.submittedBy
      })
      .from(schema.submission)
      .where(eq(schema.submission.id, submissionId))
      .limit(1);

    if (!row) return null;

    const attemptFilters = [
      eq(schema.submission.exerciseId, row.exerciseId),
      row.submittedAt ? lte(schema.submission.createdAt, row.submittedAt) : undefined,
      row.submittedBy ? eq(schema.submission.submittedBy, row.submittedBy) : undefined
    ].filter((filter) => filter !== undefined);

    const [attemptRow] = await client
      .select({ attempts: count() })
      .from(schema.submission)
      .where(and(...attemptFilters));

    return {
      overallStatus: row.overallStatus,
      gradingState: row.gradingState,
      gradedBy: row.gradedBy,
      submittedAt: row.submittedAt,
      updatedAt: row.updatedAt,
      attemptNumber: Math.max(1, attemptRow?.attempts ?? 1)
    };
  } catch (error) {
    console.error('getWebhookSubmissionDetails error:', error);
    throw new Error('Failed to read webhook submission details');
  }
}

/**
 * Reads what a course invite grants and how it can be used.
 */
export async function getWebhookCourseInviteDetails(
  inviteId: string,
  client: DbOrTxClient = db
): Promise<TWebhookInviteDetails | null> {
  try {
    const [row] = await client
      .select({
        roleId: schema.courseInvite.roleId,
        expiresAt: schema.courseInvite.expiresAt,
        maxUses: schema.courseInvite.maxUses,
        usedCount: schema.courseInvite.usedCount,
        allowedDomains: schema.courseInvite.allowedDomains
      })
      .from(schema.courseInvite)
      .where(eq(schema.courseInvite.id, inviteId))
      .limit(1);

    return row ? { ...row, acceptedByProfileId: null } : null;
  } catch (error) {
    console.error('getWebhookCourseInviteDetails error:', error);
    throw new Error('Failed to read webhook course invite details');
  }
}

/**
 * Reads what an organization invite grants and who accepted it.
 */
export async function getWebhookOrganizationInviteDetails(
  inviteId: string,
  client: DbOrTxClient = db
): Promise<TWebhookInviteDetails | null> {
  try {
    const [row] = await client
      .select({
        roleId: schema.organizationInvite.roleId,
        expiresAt: schema.organizationInvite.expiresAt,
        acceptedByProfileId: schema.organizationInvite.acceptedByProfileId
      })
      .from(schema.organizationInvite)
      .where(eq(schema.organizationInvite.id, inviteId))
      .limit(1);

    return row ? { ...row, maxUses: null, usedCount: null, allowedDomains: null } : null;
  } catch (error) {
    console.error('getWebhookOrganizationInviteDetails error:', error);
    throw new Error('Failed to read webhook organization invite details');
  }
}

/**
 * Reads the score of the member's latest submission for an exercise. Returns null when there is none.
 */
export async function getWebhookLatestSubmissionScore(
  exerciseId: string,
  memberId: string,
  client: DbOrTxClient = db
): Promise<number | null> {
  try {
    const [row] = await client
      .select({ total: schema.submission.total })
      .from(schema.submission)
      .where(and(eq(schema.submission.exerciseId, exerciseId), eq(schema.submission.submittedBy, memberId)))
      .orderBy(desc(schema.submission.createdAt))
      .limit(1);

    return row?.total ?? null;
  } catch (error) {
    console.error('getWebhookLatestSubmissionScore error:', error);
    throw new Error('Failed to read webhook submission score');
  }
}

/**
 * Reads a cohort's name. Returns null when the cohort no longer exists.
 */
export async function getWebhookCohortName(cohortId: string, client: DbOrTxClient = db): Promise<string | null> {
  try {
    const [row] = await client
      .select({ name: schema.cohort.name })
      .from(schema.cohort)
      .where(eq(schema.cohort.id, cohortId))
      .limit(1);

    return row?.name ?? null;
  } catch (error) {
    console.error('getWebhookCohortName error:', error);
    throw new Error('Failed to read webhook cohort name');
  }
}

/**
 * Reads when a person was last active in an organization. Returns null when never recorded.
 */
export async function getWebhookLastActiveAt(
  organizationId: string,
  profileId: string,
  client: DbOrTxClient = db
): Promise<string | null> {
  try {
    const [row] = await client
      .select({ lastActiveAt: schema.organizationmember.lastActiveAt })
      .from(schema.organizationmember)
      .where(
        and(
          eq(schema.organizationmember.organizationId, organizationId),
          eq(schema.organizationmember.profileId, profileId)
        )
      )
      .limit(1);

    return row?.lastActiveAt ?? null;
  } catch (error) {
    console.error('getWebhookLastActiveAt error:', error);
    throw new Error('Failed to read webhook last active time');
  }
}
