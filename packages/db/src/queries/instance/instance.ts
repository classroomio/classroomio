import * as schema from '@db/schema';

import { and, eq, gte, sql } from 'drizzle-orm';
import { db, type DbOrTxClient } from '@db/drizzle';
import type { TInstance } from '@db/types';
import { ROLE } from '@cio/utils/constants';

export type InstanceUsageCounts = {
  orgCount: number;
  studentCount: number;
  publishedCourseCount: number;
  activeStudentCount: number;
};

/**
 * Returns this install's row, creating it on first call. Safe to race: the singleton
 * constraint lets only one insert win.
 */
export const getOrCreateInstance = async (dbClient: DbOrTxClient = db): Promise<TInstance> => {
  try {
    await dbClient.insert(schema.instance).values({}).onConflictDoNothing({ target: schema.instance.singleton });

    const [row] = await dbClient.select().from(schema.instance).limit(1);

    return row;
  } catch (error) {
    console.error('getOrCreateInstance error:', error);
    throw new Error('Failed to get or create instance');
  }
};

export const markInstanceFirstReported = async (instanceId: string, dbClient: DbOrTxClient = db): Promise<void> => {
  try {
    await dbClient
      .update(schema.instance)
      .set({ firstReportedAt: new Date().toISOString() })
      .where(eq(schema.instance.id, instanceId));
  } catch (error) {
    console.error('markInstanceFirstReported error:', error);
    throw new Error('Failed to mark instance as reported');
  }
};

const countRows = async (query: Promise<{ count: number }[]>): Promise<number> => {
  const [result] = await query;

  return result?.count ?? 0;
};

/**
 * Install-wide totals for the self-hosted usage ping. Active students are students
 * who did anything in the last 30 days.
 */
export const getInstanceUsageCounts = async (dbClient: DbOrTxClient = db): Promise<InstanceUsageCounts> => {
  const count = sql<number>`count(*)::int`.as('count');
  const activeSince = new Date(Date.now() - 30 * 86_400_000).toISOString();
  const isActiveStudent = and(
    eq(schema.organizationmember.roleId, ROLE.STUDENT),
    eq(schema.organizationmember.status, 'ACTIVE')
  );

  try {
    const [orgCount, studentCount, publishedCourseCount, activeStudentCount] = await Promise.all([
      countRows(dbClient.select({ count }).from(schema.organization)),
      countRows(dbClient.select({ count }).from(schema.organizationmember).where(isActiveStudent)),
      countRows(
        dbClient
          .select({ count })
          .from(schema.course)
          .where(and(eq(schema.course.isPublished, true), eq(schema.course.status, 'ACTIVE')))
      ),
      countRows(
        dbClient
          .select({ count })
          .from(schema.organizationmember)
          .where(and(isActiveStudent, gte(schema.organizationmember.lastActiveAt, activeSince)))
      )
    ]);

    return { orgCount, studentCount, publishedCourseCount, activeStudentCount };
  } catch (error) {
    console.error('getInstanceUsageCounts error:', error);
    throw new Error('Failed to count instance usage');
  }
};
