import * as schema from '@db/schema';

import { and, eq, like, ne } from 'drizzle-orm';

import { db, type DbOrTxClient } from '@db/drizzle';
import type { TCourse } from '@db/types';
import { STARTER_COURSE_SEED_KEY_PREFIX } from '@cio/utils/constants/onboarding';

export async function listStarterCourses(organizationId: string, dbClient: DbOrTxClient = db): Promise<TCourse[]> {
  try {
    return await dbClient
      .select()
      .from(schema.course)
      .where(
        and(
          like(schema.course.seedKey, `${STARTER_COURSE_SEED_KEY_PREFIX}${organizationId}:%`),
          ne(schema.course.status, 'DELETED')
        )
      )
      .orderBy(schema.course.createdAt);
  } catch (error) {
    console.error('listStarterCourses error:', error);
    throw new Error('Failed to list starter courses');
  }
}

/**
 * Soft-deletes a starter course that failed halfway and releases its seed key, so the slot can be created again.
 */
export async function discardStarterCourse(courseId: string, dbClient: DbOrTxClient = db): Promise<void> {
  try {
    await dbClient
      .update(schema.course)
      .set({ status: 'DELETED', seedKey: null, updatedAt: new Date().toISOString() })
      .where(eq(schema.course.id, courseId));
  } catch (error) {
    console.error('discardStarterCourse error:', error);
    throw new Error('Failed to discard starter course');
  }
}
