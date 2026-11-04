import * as schema from '@db/schema';

import type { TCourseCertificateVerification, TNewCourseCertificateVerification } from '@db/types';
import { and, desc, eq, inArray, isNull, type SQL, type SQLWrapper } from 'drizzle-orm';

import { db, type DbOrTxClient } from '@db/drizzle';

export type CertificateVerificationDetails = {
  id: string;
  issuedAt: string;
  expiresAt: string | null;
  revokedAt: string | null;
  studentName: string | null;
  courseTitle: string;
  organizationName: string;
};

export type MemberCertificateVerification = Pick<
  TCourseCertificateVerification,
  'id' | 'groupMemberId' | 'issuedAt' | 'expiresAt' | 'revokedAt'
>;

export async function createCourseCertificateVerification(
  values: TNewCourseCertificateVerification,
  dbClient: DbOrTxClient = db
): Promise<TCourseCertificateVerification | null> {
  try {
    const [created] = await dbClient
      .insert(schema.courseCertificateVerification)
      .values(values)
      .onConflictDoNothing({ target: [schema.courseCertificateVerification.certificateIssueId] })
      .returning();

    return created ?? null;
  } catch (error) {
    console.error('createCourseCertificateVerification error:', error);
    throw new Error(
      `Failed to create course certificate verification: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Marks every unrevoked certificate a student holds in one course as revoked. Returns how many were revoked.
 */
export async function revokeStudentCourseCertificateVerifications(
  courseId: string,
  profileId: string,
  revokedAt: string,
  dbClient: DbOrTxClient = db
): Promise<number> {
  const studentCondition = and(
    eq(schema.courseCertificateVerification.courseId, courseId),
    eq(schema.courseCertificateVerification.profileId, profileId)
  )!;

  return revokeCertificateVerificationsWhere(studentCondition, revokedAt, dbClient);
}

/**
 * Marks every unrevoked certificate tied to the given course memberships as revoked. Returns how many were revoked.
 */
export async function revokeCertificateVerificationsForGroupMembers(
  groupMemberIds: string[] | SQLWrapper,
  revokedAt: string,
  dbClient: DbOrTxClient = db
): Promise<number> {
  if (Array.isArray(groupMemberIds) && groupMemberIds.length === 0) {
    return 0;
  }

  const memberCondition = inArray(schema.courseCertificateVerification.groupMemberId, groupMemberIds);

  return revokeCertificateVerificationsWhere(memberCondition, revokedAt, dbClient);
}

async function revokeCertificateVerificationsWhere(
  condition: SQL,
  revokedAt: string,
  dbClient: DbOrTxClient
): Promise<number> {
  try {
    const revoked = await dbClient
      .update(schema.courseCertificateVerification)
      .set({ revokedAt })
      .where(and(condition, isNull(schema.courseCertificateVerification.revokedAt)))
      .returning({ id: schema.courseCertificateVerification.id });

    return revoked.length;
  } catch (error) {
    console.error('revokeCertificateVerificationsWhere error:', error);
    throw new Error(
      `Failed to revoke course certificate verifications: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Loads a certificate with the names printed on it, in one query. Returns null for an unknown id.
 */
export async function getCertificateVerificationDetails(id: string): Promise<CertificateVerificationDetails | null> {
  try {
    const [row] = await db
      .select({
        id: schema.courseCertificateVerification.id,
        issuedAt: schema.courseCertificateVerification.issuedAt,
        expiresAt: schema.courseCertificateVerification.expiresAt,
        revokedAt: schema.courseCertificateVerification.revokedAt,
        studentName: schema.profile.fullname,
        courseTitle: schema.course.title,
        organizationName: schema.organization.name
      })
      .from(schema.courseCertificateVerification)
      .innerJoin(schema.course, eq(schema.course.id, schema.courseCertificateVerification.courseId))
      .innerJoin(schema.group, eq(schema.group.id, schema.course.groupId))
      .innerJoin(schema.organization, eq(schema.organization.id, schema.group.organizationId))
      .innerJoin(schema.profile, eq(schema.profile.id, schema.courseCertificateVerification.profileId))
      .where(eq(schema.courseCertificateVerification.id, id))
      .limit(1);

    return row ?? null;
  } catch (error) {
    console.error('getCertificateVerificationDetails error:', error);
    throw new Error(
      `Failed to get certificate verification details: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Returns the most recently issued certificate for each of the given members of a course.
 */
export async function getLatestCertificateVerificationsForMembers(
  courseId: string,
  groupMemberIds: string[]
): Promise<MemberCertificateVerification[]> {
  if (groupMemberIds.length === 0) {
    return [];
  }

  try {
    return await db
      .selectDistinctOn([schema.courseCertificateVerification.groupMemberId], {
        id: schema.courseCertificateVerification.id,
        groupMemberId: schema.courseCertificateVerification.groupMemberId,
        issuedAt: schema.courseCertificateVerification.issuedAt,
        expiresAt: schema.courseCertificateVerification.expiresAt,
        revokedAt: schema.courseCertificateVerification.revokedAt
      })
      .from(schema.courseCertificateVerification)
      .where(
        and(
          eq(schema.courseCertificateVerification.courseId, courseId),
          inArray(schema.courseCertificateVerification.groupMemberId, groupMemberIds)
        )
      )
      .orderBy(
        schema.courseCertificateVerification.groupMemberId,
        desc(schema.courseCertificateVerification.issuedAt),
        desc(schema.courseCertificateVerification.createdAt)
      );
  } catch (error) {
    console.error('getLatestCertificateVerificationsForMembers error:', error);
    throw new Error(
      `Failed to get certificate verifications for members: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}
