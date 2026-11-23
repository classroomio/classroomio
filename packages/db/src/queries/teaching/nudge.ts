import * as schema from '@db/schema';

import { and, desc, eq, gt, isNotNull, sql } from 'drizzle-orm';

import { ROLE } from '@cio/utils/constants/roles';
import type { TLearnerNudge } from '@db/types';
import { db, type DbOrTxClient } from '@db/drizzle';

export type RecordLearnerNudgeResult =
  | { created: true; nudge: TLearnerNudge }
  | { created: false; lastNudgedAt: string };

/**
 * Records a nudge unless the learner was already nudged in this course after `windowStart`. Serialized per course and
 * learner with a transaction-scoped advisory lock, so two tutors pressing Nudge at once record one nudge.
 */
export async function recordLearnerNudge(input: {
  organizationId: string;
  courseId: string;
  learnerProfileId: string;
  nudgedByProfileId: string;
  windowStart: Date;
}): Promise<RecordLearnerNudgeResult> {
  try {
    return await db.transaction(async (tx) => {
      await tx.execute(
        sql`SELECT pg_advisory_xact_lock(hashtext(${`learner_nudge:${input.courseId}:${input.learnerProfileId}`}))`
      );

      const [recent] = await tx
        .select({ createdAt: schema.learnerNudge.createdAt })
        .from(schema.learnerNudge)
        .where(
          and(
            eq(schema.learnerNudge.courseId, input.courseId),
            eq(schema.learnerNudge.learnerProfileId, input.learnerProfileId),
            gt(schema.learnerNudge.createdAt, input.windowStart.toISOString())
          )
        )
        .orderBy(desc(schema.learnerNudge.createdAt))
        .limit(1);

      if (recent) return { created: false as const, lastNudgedAt: recent.createdAt };

      const [nudge] = await tx
        .insert(schema.learnerNudge)
        .values({
          organizationId: input.organizationId,
          courseId: input.courseId,
          learnerProfileId: input.learnerProfileId,
          nudgedByProfileId: input.nudgedByProfileId
        })
        .returning();

      return { created: true as const, nudge: nudge! };
    });
  } catch (error) {
    console.error('recordLearnerNudge error:', error);
    throw new Error('Failed to record learner nudge');
  }
}

/** Whether the profile is enrolled as a student in the course. */
export async function isCourseStudent(
  courseId: string,
  profileId: string,
  dbClient: DbOrTxClient = db
): Promise<boolean> {
  try {
    const [row] = await dbClient
      .select({ id: schema.groupmember.id })
      .from(schema.groupmember)
      .innerJoin(schema.course, eq(schema.course.groupId, schema.groupmember.groupId))
      .where(
        and(
          eq(schema.course.id, courseId),
          eq(schema.groupmember.profileId, profileId),
          eq(schema.groupmember.roleId, ROLE.STUDENT),
          isNotNull(schema.groupmember.profileId)
        )
      )
      .limit(1);

    return Boolean(row);
  } catch (error) {
    console.error('isCourseStudent error:', error);
    throw new Error('Failed to check course enrollment');
  }
}
