import * as schema from '@db/schema';
import type { TCourseCertificateIssue, TNewCourseCertificateIssue } from '@db/types';
import { and, desc, eq, inArray, isNull, sql } from 'drizzle-orm';

import { db, type DbOrTxClient } from '@db/drizzle';

export async function getCertificateByVerifyCode(
  verifyCode: string,
  dbClient: DbOrTxClient = db
): Promise<TCourseCertificateIssue | null> {
  try {
    const [row] = await dbClient
      .select()
      .from(schema.courseCertificateIssue)
      .where(eq(schema.courseCertificateIssue.verifyCode, verifyCode))
      .limit(1);

    return row ?? null;
  } catch (error) {
    console.error('getCertificateByVerifyCode error:', error);
    throw new Error(
      `Failed to get certificate by verify code: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export async function getCertificateById(
  certificateId: string,
  dbClient: DbOrTxClient = db
): Promise<TCourseCertificateIssue | null> {
  try {
    const [row] = await dbClient
      .select()
      .from(schema.courseCertificateIssue)
      .where(eq(schema.courseCertificateIssue.id, certificateId))
      .limit(1);

    return row ?? null;
  } catch (error) {
    console.error('getCertificateById error:', error);
    throw new Error(`Failed to get certificate by id: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function getCertificateByCourseProfile(
  courseId: string,
  profileId: string,
  cycleNumber: number,
  dbClient: DbOrTxClient = db
): Promise<TCourseCertificateIssue | null> {
  try {
    const [row] = await dbClient
      .select()
      .from(schema.courseCertificateIssue)
      .where(
        and(
          eq(schema.courseCertificateIssue.courseId, courseId),
          eq(schema.courseCertificateIssue.profileId, profileId),
          eq(schema.courseCertificateIssue.cycleNumber, cycleNumber)
        )
      )
      .limit(1);

    return row ?? null;
  } catch (error) {
    console.error('getCertificateByCourseProfile error:', error);
    throw new Error(
      `Failed to get certificate by course profile: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Returns the learner's certificate from their most recent cycle (compliance recertifications issue a new one each cycle).
 */
export async function getLatestCertificateByCourseProfile(
  courseId: string,
  profileId: string,
  dbClient: DbOrTxClient = db
): Promise<TCourseCertificateIssue | null> {
  try {
    const [row] = await dbClient
      .select()
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
    console.error('getLatestCertificateByCourseProfile error:', error);
    throw new Error(
      `Failed to get latest certificate by course profile: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export async function createCertificateIssue(
  values: TNewCourseCertificateIssue,
  dbClient: DbOrTxClient = db
): Promise<TCourseCertificateIssue | null> {
  try {
    const [created] = await dbClient.insert(schema.courseCertificateIssue).values(values).returning();

    return created ?? null;
  } catch (error) {
    console.error('createCertificateIssue error:', error);
    const err = new Error(
      `Failed to create certificate issue: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
    (err as unknown as { cause: unknown }).cause = error;
    throw err;
  }
}

export async function upsertCertificateIssue(
  values: TNewCourseCertificateIssue,
  dbClient: DbOrTxClient = db
): Promise<TCourseCertificateIssue | null> {
  try {
    const [created] = await dbClient
      .insert(schema.courseCertificateIssue)
      .values(values)
      .onConflictDoNothing({
        target: [
          schema.courseCertificateIssue.courseId,
          schema.courseCertificateIssue.profileId,
          schema.courseCertificateIssue.cycleNumber
        ]
      })
      .returning();

    if (created) return created;

    const existing = await getCertificateByCourseProfile(
      values.courseId,
      values.profileId,
      values.cycleNumber,
      dbClient
    );

    return existing;
  } catch (error) {
    console.error('upsertCertificateIssue error:', error);
    throw new Error(`Failed to upsert certificate issue: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function updateCertificateRevocation(
  certificateId: string,
  values: {
    revokedAt: string | null;
    revokedBy: string | null;
    revokeReason: string | null;
  },
  dbClient: DbOrTxClient = db
): Promise<TCourseCertificateIssue | null> {
  try {
    const [updated] = await dbClient
      .update(schema.courseCertificateIssue)
      .set(values)
      .where(eq(schema.courseCertificateIssue.id, certificateId))
      .returning();

    return updated ?? null;
  } catch (error) {
    console.error('updateCertificateRevocation error:', error);
    throw new Error(
      `Failed to update certificate revocation: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export async function updateCertificateMetadata(
  certificateId: string,
  metadata: Record<string, unknown>,
  dbClient: DbOrTxClient = db
): Promise<TCourseCertificateIssue | null> {
  try {
    const [updated] = await dbClient
      .update(schema.courseCertificateIssue)
      .set({ metadata: metadata as never })
      .where(eq(schema.courseCertificateIssue.id, certificateId))
      .returning();

    return updated ?? null;
  } catch (error) {
    console.error('updateCertificateMetadata error:', error);
    throw new Error(
      `Failed to update certificate metadata: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export async function verifyCodeExists(verifyCode: string, dbClient: DbOrTxClient = db): Promise<boolean> {
  try {
    const result = await dbClient
      .select({ count: sql<number>`count(*)::int` })
      .from(schema.courseCertificateIssue)
      .where(eq(schema.courseCertificateIssue.verifyCode, verifyCode));

    return (result[0]?.count ?? 0) > 0;
  } catch (error) {
    console.error('verifyCodeExists error:', error);
    throw new Error(`Failed to check verify code exists: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function getVerifyCodeExistsForPrefix(_prefix: string, _dbClient: DbOrTxClient = db): Promise<boolean> {
  return false;
}

export async function updateCertificateVerifyCode(
  certificateId: string,
  verifyCode: string,
  dbClient: DbOrTxClient = db
): Promise<TCourseCertificateIssue | null> {
  try {
    const [updated] = await dbClient
      .update(schema.courseCertificateIssue)
      .set({ verifyCode })
      .where(and(eq(schema.courseCertificateIssue.id, certificateId), isNull(schema.courseCertificateIssue.verifyCode)))
      .returning();

    if (updated) return updated;

    const [existing] = await dbClient
      .select()
      .from(schema.courseCertificateIssue)
      .where(eq(schema.courseCertificateIssue.id, certificateId))
      .limit(1);

    return existing ?? null;
  } catch (error) {
    console.error('updateCertificateVerifyCode error:', error);
    const err = new Error(
      `Failed to update certificate verify code: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
    (err as unknown as { cause: unknown }).cause = error;
    throw err;
  }
}

export async function getLatestCertificatesByCourseProfiles(
  courseId: string,
  profileIds: string[],
  dbClient: DbOrTxClient = db
): Promise<TCourseCertificateIssue[]> {
  if (profileIds.length === 0) return [];
  try {
    const rows = await dbClient
      .select()
      .from(schema.courseCertificateIssue)
      .where(
        and(
          eq(schema.courseCertificateIssue.courseId, courseId),
          inArray(schema.courseCertificateIssue.profileId, profileIds)
        )
      )
      .orderBy(desc(schema.courseCertificateIssue.cycleNumber));

    const latestByProfile = new Map<string, TCourseCertificateIssue>();
    for (const row of rows) {
      if (!latestByProfile.has(row.profileId)) latestByProfile.set(row.profileId, row);
    }
    return Array.from(latestByProfile.values());
  } catch (error) {
    console.error('getLatestCertificatesByCourseProfiles error:', error);
    throw new Error(
      `Failed to get latest certificates by course profiles: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}
