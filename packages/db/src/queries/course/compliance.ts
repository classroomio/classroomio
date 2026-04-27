import * as schema from '@db/schema';

import { ROLE } from '@cio/utils/constants';
import type {
  TCourse,
  TCourseCertificateIssue,
  TCourseCompletionNotificationEvent,
  TCourseCompletionRecord,
  TGroupmember,
  TNewCourseCertificateIssue,
  TNewCourseCompletionNotificationEvent,
  TNewCourseCompletionRecord
} from '@db/types';
import { and, asc, desc, eq, inArray, isNotNull, lte, or, sql } from 'drizzle-orm';

import { db, type DbOrTxClient } from '@db/drizzle';

type CourseMemberProfile = {
  id: string;
  fullname: string | null;
  username: string | null;
  avatarUrl: string | null;
  email: string | null;
};

export type CourseComplianceCurrentRow = {
  member: TGroupmember;
  profile: CourseMemberProfile | null;
  record: TCourseCompletionRecord | null;
};

export type CourseComplianceReminderRow = {
  course: TCourse;
  member: TGroupmember;
  profile: CourseMemberProfile | null;
  record: TCourseCompletionRecord;
};

export async function getStudentCourseMembersForCompliance(
  courseId: string,
  profileIds?: string[]
): Promise<Array<{ member: TGroupmember; profile: CourseMemberProfile | null }>> {
  try {
    const conditions = [
      eq(schema.course.id, courseId),
      eq(schema.groupmember.roleId, ROLE.STUDENT),
      isNotNull(schema.groupmember.profileId)
    ];

    if (profileIds && profileIds.length > 0) {
      conditions.push(inArray(schema.groupmember.profileId, profileIds));
    }

    const result = await db
      .select({
        member: schema.groupmember,
        profile: {
          id: schema.profile.id,
          fullname: schema.profile.fullname,
          username: schema.profile.username,
          avatarUrl: schema.profile.avatarUrl,
          email: schema.profile.email
        }
      })
      .from(schema.groupmember)
      .innerJoin(schema.course, eq(schema.course.groupId, schema.groupmember.groupId))
      .leftJoin(schema.profile, eq(schema.groupmember.profileId, schema.profile.id))
      .where(and(...conditions))
      .orderBy(asc(schema.profile.fullname), asc(schema.groupmember.createdAt));

    return result.map((row) => ({
      member: row.member,
      profile: row.profile ?? null
    }));
  } catch (error) {
    console.error('getStudentCourseMembersForCompliance error:', error);
    throw new Error(
      `Failed to get student course members for compliance: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export async function getCourseCurrentComplianceRows(courseId: string): Promise<CourseComplianceCurrentRow[]> {
  try {
    const latestCycles = db
      .select({
        courseId: schema.courseCompletionRecord.courseId,
        profileId: schema.courseCompletionRecord.profileId,
        latestCycleNumber: sql<number>`max(${schema.courseCompletionRecord.cycleNumber})`.as('latest_cycle_number')
      })
      .from(schema.courseCompletionRecord)
      .where(eq(schema.courseCompletionRecord.courseId, courseId))
      .groupBy(schema.courseCompletionRecord.courseId, schema.courseCompletionRecord.profileId)
      .as('latest_course_compliance_cycles');

    const result = await db
      .select({
        member: schema.groupmember,
        profile: {
          id: schema.profile.id,
          fullname: schema.profile.fullname,
          username: schema.profile.username,
          avatarUrl: schema.profile.avatarUrl,
          email: schema.profile.email
        },
        record: schema.courseCompletionRecord
      })
      .from(schema.groupmember)
      .innerJoin(schema.course, eq(schema.course.groupId, schema.groupmember.groupId))
      .leftJoin(schema.profile, eq(schema.groupmember.profileId, schema.profile.id))
      .leftJoin(
        latestCycles,
        and(eq(latestCycles.courseId, schema.course.id), eq(latestCycles.profileId, schema.groupmember.profileId))
      )
      .leftJoin(
        schema.courseCompletionRecord,
        and(
          eq(schema.courseCompletionRecord.courseId, schema.course.id),
          eq(schema.courseCompletionRecord.profileId, schema.groupmember.profileId),
          eq(schema.courseCompletionRecord.cycleNumber, latestCycles.latestCycleNumber)
        )
      )
      .where(
        and(
          eq(schema.course.id, courseId),
          eq(schema.groupmember.roleId, ROLE.STUDENT),
          isNotNull(schema.groupmember.profileId)
        )
      )
      .orderBy(asc(schema.profile.fullname), asc(schema.groupmember.createdAt));

    return result.map((row) => ({
      member: row.member,
      profile: row.profile ?? null,
      record: row.record ?? null
    }));
  } catch (error) {
    console.error('getCourseCurrentComplianceRows error:', error);
    throw new Error(
      `Failed to get course current compliance rows: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export async function getCourseComplianceHistoryRows(
  courseId: string,
  profileId: string
): Promise<{
  member: TGroupmember | null;
  profile: CourseMemberProfile | null;
  records: TCourseCompletionRecord[];
}> {
  try {
    const [memberRow, records] = await Promise.all([
      db
        .select({
          member: schema.groupmember,
          profile: {
            id: schema.profile.id,
            fullname: schema.profile.fullname,
            username: schema.profile.username,
            avatarUrl: schema.profile.avatarUrl,
            email: schema.profile.email
          }
        })
        .from(schema.groupmember)
        .innerJoin(schema.course, eq(schema.course.groupId, schema.groupmember.groupId))
        .leftJoin(schema.profile, eq(schema.groupmember.profileId, schema.profile.id))
        .where(
          and(
            eq(schema.course.id, courseId),
            eq(schema.groupmember.roleId, ROLE.STUDENT),
            eq(schema.groupmember.profileId, profileId)
          )
        )
        .limit(1),
      db
        .select()
        .from(schema.courseCompletionRecord)
        .where(
          and(
            eq(schema.courseCompletionRecord.courseId, courseId),
            eq(schema.courseCompletionRecord.profileId, profileId)
          )
        )
        .orderBy(desc(schema.courseCompletionRecord.cycleNumber))
    ]);

    return {
      member: memberRow[0]?.member ?? null,
      profile: memberRow[0]?.profile ?? null,
      records
    };
  } catch (error) {
    console.error('getCourseComplianceHistoryRows error:', error);
    throw new Error(
      `Failed to get course compliance history rows: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export async function getLatestComplianceRecordsByProfiles(
  courseId: string,
  profileIds: string[]
): Promise<TCourseCompletionRecord[]> {
  try {
    if (profileIds.length === 0) {
      return [];
    }

    const latestCycles = db
      .select({
        courseId: schema.courseCompletionRecord.courseId,
        profileId: schema.courseCompletionRecord.profileId,
        latestCycleNumber: sql<number>`max(${schema.courseCompletionRecord.cycleNumber})`.as('latest_cycle_number')
      })
      .from(schema.courseCompletionRecord)
      .where(
        and(
          eq(schema.courseCompletionRecord.courseId, courseId),
          inArray(schema.courseCompletionRecord.profileId, profileIds)
        )
      )
      .groupBy(schema.courseCompletionRecord.courseId, schema.courseCompletionRecord.profileId)
      .as('latest_course_compliance_cycles_by_profile');

    return await db
      .select({
        id: schema.courseCompletionRecord.id,
        courseId: schema.courseCompletionRecord.courseId,
        groupMemberId: schema.courseCompletionRecord.groupMemberId,
        profileId: schema.courseCompletionRecord.profileId,
        cycleNumber: schema.courseCompletionRecord.cycleNumber,
        status: schema.courseCompletionRecord.status,
        dueDate: schema.courseCompletionRecord.dueDate,
        startedAt: schema.courseCompletionRecord.startedAt,
        completedAt: schema.courseCompletionRecord.completedAt,
        validUntil: schema.courseCompletionRecord.validUntil,
        expiredAt: schema.courseCompletionRecord.expiredAt,
        score: schema.courseCompletionRecord.score,
        attempts: schema.courseCompletionRecord.attempts,
        timeSpentMinutes: schema.courseCompletionRecord.timeSpentMinutes,
        waivedBy: schema.courseCompletionRecord.waivedBy,
        waiverReason: schema.courseCompletionRecord.waiverReason,
        waiverExpiresAt: schema.courseCompletionRecord.waiverExpiresAt,
        createdAt: schema.courseCompletionRecord.createdAt,
        updatedAt: schema.courseCompletionRecord.updatedAt
      })
      .from(schema.courseCompletionRecord)
      .innerJoin(
        latestCycles,
        and(
          eq(latestCycles.courseId, schema.courseCompletionRecord.courseId),
          eq(latestCycles.profileId, schema.courseCompletionRecord.profileId),
          eq(latestCycles.latestCycleNumber, schema.courseCompletionRecord.cycleNumber)
        )
      );
  } catch (error) {
    console.error('getLatestComplianceRecordsByProfiles error:', error);
    throw new Error(
      `Failed to get latest compliance records by profiles: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export async function createCourseCompletionRecord(
  values: TNewCourseCompletionRecord,
  dbClient: DbOrTxClient = db
): Promise<TCourseCompletionRecord> {
  try {
    const [created] = await dbClient.insert(schema.courseCompletionRecord).values(values).returning();

    if (!created) {
      throw new Error('Failed to create course completion record');
    }

    return created;
  } catch (error) {
    console.error('createCourseCompletionRecord error:', error);
    throw new Error(
      `Failed to create course completion record: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export async function updateCourseCompletionRecord(
  recordId: string,
  values: Partial<TNewCourseCompletionRecord>,
  dbClient: DbOrTxClient = db
): Promise<TCourseCompletionRecord | null> {
  try {
    const [updated] = await dbClient
      .update(schema.courseCompletionRecord)
      .set({
        ...values,
        updatedAt: new Date().toISOString()
      })
      .where(eq(schema.courseCompletionRecord.id, recordId))
      .returning();

    return updated ?? null;
  } catch (error) {
    console.error('updateCourseCompletionRecord error:', error);
    throw new Error(
      `Failed to update course completion record: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export async function createCourseCompletionNotificationEvent(
  values: TNewCourseCompletionNotificationEvent,
  dbClient: DbOrTxClient = db
): Promise<TCourseCompletionNotificationEvent | null> {
  try {
    const [created] = await dbClient
      .insert(schema.courseCompletionNotificationEvent)
      .values(values)
      .onConflictDoNothing({
        target: [
          schema.courseCompletionNotificationEvent.courseCompletionRecordId,
          schema.courseCompletionNotificationEvent.channel,
          schema.courseCompletionNotificationEvent.eventType
        ]
      })
      .returning();

    return created ?? null;
  } catch (error) {
    console.error('createCourseCompletionNotificationEvent error:', error);
    throw new Error(
      `Failed to create course completion notification event: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export async function createCourseCertificateIssue(
  values: TNewCourseCertificateIssue,
  dbClient: DbOrTxClient = db
): Promise<TCourseCertificateIssue | null> {
  try {
    const [created] = await dbClient
      .insert(schema.courseCertificateIssue)
      .values(values)
      .onConflictDoNothing({
        target: [schema.courseCertificateIssue.courseCompletionRecordId]
      })
      .returning();

    return created ?? null;
  } catch (error) {
    console.error('createCourseCertificateIssue error:', error);
    throw new Error(
      `Failed to create course certificate issue: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export async function updateCourseCertificateIssueStatusByRecordId(
  courseCompletionRecordId: string,
  status: string,
  dbClient: DbOrTxClient = db
): Promise<TCourseCertificateIssue | null> {
  try {
    const [updated] = await dbClient
      .update(schema.courseCertificateIssue)
      .set({
        status
      })
      .where(eq(schema.courseCertificateIssue.courseCompletionRecordId, courseCompletionRecordId))
      .returning();

    return updated ?? null;
  } catch (error) {
    console.error('updateCourseCertificateIssueStatusByRecordId error:', error);
    throw new Error(
      `Failed to update course certificate issue status by record ID: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`
    );
  }
}

export async function listComplianceRecordsReadyForExpiry(nowIso: string): Promise<TCourseCompletionRecord[]> {
  try {
    return await db
      .select({
        record: schema.courseCompletionRecord
      })
      .from(schema.courseCompletionRecord)
      .innerJoin(schema.course, eq(schema.course.id, schema.courseCompletionRecord.courseId))
      .where(
        and(
          eq(schema.course.type, 'COMPLIANCE'),
          isNotNull(schema.courseCompletionRecord.completedAt),
          isNotNull(schema.courseCompletionRecord.validUntil),
          lte(schema.courseCompletionRecord.validUntil, nowIso),
          sql`${schema.courseCompletionRecord.expiredAt} IS NULL`
        )
      )
      .orderBy(asc(schema.courseCompletionRecord.validUntil))
      .then((rows) => rows.map((row) => row.record));
  } catch (error) {
    console.error('listComplianceRecordsReadyForExpiry error:', error);
    throw new Error(
      `Failed to list compliance records ready for expiry: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export async function listLatestComplianceRecordsForReminderScan(): Promise<CourseComplianceReminderRow[]> {
  try {
    const latestCycles = db
      .select({
        courseId: schema.courseCompletionRecord.courseId,
        profileId: schema.courseCompletionRecord.profileId,
        latestCycleNumber: sql<number>`max(${schema.courseCompletionRecord.cycleNumber})`.as('latest_cycle_number')
      })
      .from(schema.courseCompletionRecord)
      .groupBy(schema.courseCompletionRecord.courseId, schema.courseCompletionRecord.profileId)
      .as('latest_course_compliance_cycles');

    const result = await db
      .select({
        course: schema.course,
        member: schema.groupmember,
        profile: {
          id: schema.profile.id,
          fullname: schema.profile.fullname,
          username: schema.profile.username,
          avatarUrl: schema.profile.avatarUrl,
          email: schema.profile.email
        },
        record: schema.courseCompletionRecord
      })
      .from(schema.courseCompletionRecord)
      .innerJoin(
        latestCycles,
        and(
          eq(latestCycles.courseId, schema.courseCompletionRecord.courseId),
          eq(latestCycles.profileId, schema.courseCompletionRecord.profileId),
          eq(latestCycles.latestCycleNumber, schema.courseCompletionRecord.cycleNumber)
        )
      )
      .innerJoin(schema.course, eq(schema.course.id, schema.courseCompletionRecord.courseId))
      .innerJoin(schema.groupmember, eq(schema.groupmember.id, schema.courseCompletionRecord.groupMemberId))
      .leftJoin(schema.profile, eq(schema.profile.id, schema.courseCompletionRecord.profileId))
      .where(
        and(
          eq(schema.course.type, 'COMPLIANCE'),
          or(
            eq(schema.courseCompletionRecord.status, 'not_started'),
            eq(schema.courseCompletionRecord.status, 'in_progress'),
            eq(schema.courseCompletionRecord.status, 'expiring_soon'),
            eq(schema.courseCompletionRecord.status, 'in_grace_period'),
            eq(schema.courseCompletionRecord.status, 'non_compliant')
          ),
          sql`${schema.courseCompletionRecord.completedAt} IS NULL`
        )
      )
      .orderBy(asc(schema.courseCompletionRecord.dueDate));

    return result.map((row) => ({
      course: row.course,
      member: row.member,
      profile: row.profile ?? null,
      record: row.record
    }));
  } catch (error) {
    console.error('listLatestComplianceRecordsForReminderScan error:', error);
    throw new Error(
      `Failed to list latest compliance records for reminder scan: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}
