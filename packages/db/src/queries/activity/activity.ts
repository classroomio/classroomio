import * as schema from '@db/schema';

import type { TActivityCompletion, TCourseActivity, TNewActivityCompletion, TNewCourseActivity } from '@db/types';
import { and, db, eq, inArray, isNull, ne } from '@db/drizzle';

import type { DbOrTxClient } from '@db/drizzle';

export async function createActivities(values: TNewCourseActivity[], dbClient: DbOrTxClient = db) {
  if (values.length === 0) return [];
  try {
    return await dbClient.insert(schema.courseActivity).values(values).returning();
  } catch (error) {
    console.error('createActivities error:', error);
    throw new Error(`Failed to create activities: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function getActivityById(
  activityId: string,
  dbClient: DbOrTxClient = db
): Promise<TCourseActivity | null> {
  try {
    const [activity] = await dbClient
      .select()
      .from(schema.courseActivity)
      .where(eq(schema.courseActivity.id, activityId))
      .limit(1);
    return activity || null;
  } catch (error) {
    console.error('getActivityById error:', error);
    throw new Error(
      `Failed to get activity by ID "${activityId}": ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export async function getActivitiesByCourseId(
  courseId: string,
  dbClient: DbOrTxClient = db
): Promise<TCourseActivity[]> {
  try {
    return await dbClient.select().from(schema.courseActivity).where(eq(schema.courseActivity.courseId, courseId));
  } catch (error) {
    console.error('getActivitiesByCourseId error:', error);
    throw new Error(
      `Failed to get activities by course ID "${courseId}": ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export interface ActivityNavInfo {
  id: string;
  courseId: string;
  activityTitle: string;
  courseTitle: string;
}

export async function getActivityNavInfoByIds(
  activityIds: string[],
  dbClient: DbOrTxClient = db
): Promise<ActivityNavInfo[]> {
  if (activityIds.length === 0) return [];
  try {
    return await dbClient
      .select({
        id: schema.courseActivity.id,
        courseId: schema.courseActivity.courseId,
        activityTitle: schema.courseActivity.title,
        courseTitle: schema.course.title
      })
      .from(schema.courseActivity)
      .innerJoin(schema.course, eq(schema.course.id, schema.courseActivity.courseId))
      .where(and(inArray(schema.courseActivity.id, activityIds), ne(schema.course.status, 'DELETED')));
  } catch (error) {
    console.error('getActivityNavInfoByIds error:', error);
    throw new Error(`Failed to get activity nav info: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function updateActivity(
  activityId: string,
  data: Partial<TCourseActivity>,
  dbClient: DbOrTxClient = db
): Promise<TCourseActivity | null> {
  try {
    const [updated] = await dbClient
      .update(schema.courseActivity)
      .set({ ...data, updatedAt: new Date().toISOString() })
      .where(eq(schema.courseActivity.id, activityId))
      .returning();
    return updated || null;
  } catch (error) {
    console.error('updateActivity error:', error);
    throw new Error(
      `Failed to update activity "${activityId}": ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export async function deleteActivity(activityId: string, dbClient: DbOrTxClient = db): Promise<TCourseActivity | null> {
  try {
    const [deleted] = await dbClient
      .delete(schema.courseActivity)
      .where(eq(schema.courseActivity.id, activityId))
      .returning();
    return deleted || null;
  } catch (error) {
    console.error('deleteActivity error:', error);
    throw new Error(
      `Failed to delete activity "${activityId}": ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export async function countActivitiesInCourse(courseId: string, dbClient: DbOrTxClient = db): Promise<number> {
  try {
    const rows = await dbClient
      .select({ id: schema.courseActivity.id })
      .from(schema.courseActivity)
      .where(eq(schema.courseActivity.courseId, courseId));
    return rows.length;
  } catch (error) {
    console.error('countActivitiesInCourse error:', error);
    throw new Error(
      `Failed to count activities in course "${courseId}": ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export async function updateActivitiesSectionId(
  courseId: string,
  sectionId: string,
  dbClient: DbOrTxClient = db
): Promise<number> {
  try {
    const updated = await dbClient
      .update(schema.courseActivity)
      .set({ sectionId })
      .where(eq(schema.courseActivity.courseId, courseId))
      .returning();

    return updated.length;
  } catch (error) {
    console.error('updateActivitiesSectionId error:', error);
    throw new Error(
      `Failed to update activities section ID "${courseId}": ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export async function updateUngroupedActivitiesSectionId(
  courseId: string,
  sectionId: string,
  dbClient: DbOrTxClient = db
): Promise<number> {
  try {
    const updated = await dbClient
      .update(schema.courseActivity)
      .set({ sectionId })
      .where(and(eq(schema.courseActivity.courseId, courseId), isNull(schema.courseActivity.sectionId)))
      .returning();

    return updated.length;
  } catch (error) {
    console.error('updateUngroupedActivitiesSectionId error:', error);
    throw new Error(
      `Failed to update ungrouped activities section ID "${courseId}": ${
        error instanceof Error ? error.message : 'Unknown error'
      }`
    );
  }
}

export async function countActivitiesInSection(sectionId: string, dbClient: DbOrTxClient = db): Promise<number> {
  try {
    const rows = await dbClient
      .select({ id: schema.courseActivity.id })
      .from(schema.courseActivity)
      .where(eq(schema.courseActivity.sectionId, sectionId));

    return rows.length;
  } catch (error) {
    console.error('countActivitiesInSection error:', error);
    throw new Error(
      `Failed to count activities in section "${sectionId}": ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export async function getActivitiesBySectionId(
  sectionId: string,
  dbClient: DbOrTxClient = db
): Promise<Pick<TCourseActivity, 'id' | 'title'>[]> {
  try {
    return await dbClient
      .select({ id: schema.courseActivity.id, title: schema.courseActivity.title })
      .from(schema.courseActivity)
      .where(eq(schema.courseActivity.sectionId, sectionId));
  } catch (error) {
    console.error('getActivitiesBySectionId error:', error);
    throw new Error(
      `Failed to get activities by section ID "${sectionId}": ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export async function getActivityCompletionsByProfile(
  activityIds: string[],
  profileId: string,
  dbClient: DbOrTxClient = db
): Promise<string[]> {
  if (activityIds.length === 0) return [];
  try {
    const rows = await dbClient
      .select({ activityId: schema.activityCompletion.activityId })
      .from(schema.activityCompletion)
      .where(
        and(
          inArray(schema.activityCompletion.activityId, activityIds),
          eq(schema.activityCompletion.profileId, profileId),
          eq(schema.activityCompletion.isComplete, true)
        )
      );
    return rows.map((row) => row.activityId);
  } catch (error) {
    console.error('getActivityCompletionsByProfile error:', error);
    throw new Error(
      `Failed to get activity completions for profile "${profileId}": ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Deletes a learner's completions for the given activities. Runs inside the
 * caller's reset transaction. Returns the number of rows removed.
 */
export async function deleteActivityCompletions(
  activityIds: string[],
  profileId: string,
  tx: DbOrTxClient
): Promise<number> {
  if (activityIds.length === 0) return 0;
  try {
    const deleted = await tx
      .delete(schema.activityCompletion)
      .where(
        and(
          inArray(schema.activityCompletion.activityId, activityIds),
          eq(schema.activityCompletion.profileId, profileId)
        )
      )
      .returning({ id: schema.activityCompletion.id });

    return deleted.length;
  } catch (error) {
    console.error('deleteActivityCompletions error:', error);
    throw new Error(
      `Failed to delete activity completions for profile "${profileId}": ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export async function upsertActivityCompletion(
  data: TNewActivityCompletion,
  dbClient: DbOrTxClient = db
): Promise<TActivityCompletion> {
  try {
    const isComplete = Boolean(data.isComplete);
    const now = new Date().toISOString();
    const completedAt = data.completedAt !== undefined ? data.completedAt : isComplete ? now : null;
    const values = {
      ...data,
      isComplete,
      completedAt
    };

    const [completion] = await dbClient
      .insert(schema.activityCompletion)
      .values(values)
      .onConflictDoUpdate({
        target: [schema.activityCompletion.activityId, schema.activityCompletion.profileId],
        set: {
          isComplete,
          completedAt,
          updatedAt: now
        }
      })
      .returning();
    if (!completion) {
      throw new Error('Failed to upsert activity completion');
    }
    return completion;
  } catch (error) {
    console.error('upsertActivityCompletion error:', error);
    throw new Error(
      `Failed to upsert activity completion: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export async function markActivityCompleteOnce(
  activityId: string,
  profileId: string,
  dbClient: DbOrTxClient = db
): Promise<boolean> {
  try {
    const [existing] = await dbClient
      .select()
      .from(schema.activityCompletion)
      .where(
        and(eq(schema.activityCompletion.activityId, activityId), eq(schema.activityCompletion.profileId, profileId))
      )
      .limit(1);
    if (existing?.isComplete) return false;

    const completedAt = new Date().toISOString();
    if (existing) {
      await dbClient
        .update(schema.activityCompletion)
        .set({ isComplete: true, completedAt, updatedAt: completedAt })
        .where(eq(schema.activityCompletion.id, existing.id));
      return true;
    }

    await dbClient.insert(schema.activityCompletion).values({ activityId, profileId, isComplete: true, completedAt });
    return true;
  } catch (error) {
    console.error('markActivityCompleteOnce error:', error);
    throw new Error(
      `Failed to mark activity "${activityId}" complete: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}
