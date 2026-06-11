import * as schema from '@db/schema';

import type { TLessonVideoProgress, TNewLessonVideoProgress } from '@db/types';
import { and, db, eq } from '@db/drizzle';

export async function getLessonVideoProgress(
  lessonId: string,
  profileId: string,
  assetId: string
): Promise<TLessonVideoProgress | null> {
  try {
    const [row] = await db
      .select()
      .from(schema.lessonVideoProgress)
      .where(
        and(
          eq(schema.lessonVideoProgress.lessonId, lessonId),
          eq(schema.lessonVideoProgress.profileId, profileId),
          eq(schema.lessonVideoProgress.assetId, assetId)
        )
      )
      .limit(1);

    return row ?? null;
  } catch (error) {
    console.error('getLessonVideoProgress error:', error);
    throw new Error(
      `Failed to get lesson video progress for lesson "${lessonId}": ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export async function getLessonVideoProgressForLesson(
  lessonId: string,
  profileId: string
): Promise<TLessonVideoProgress[]> {
  try {
    return db
      .select()
      .from(schema.lessonVideoProgress)
      .where(
        and(eq(schema.lessonVideoProgress.lessonId, lessonId), eq(schema.lessonVideoProgress.profileId, profileId))
      );
  } catch (error) {
    console.error('getLessonVideoProgressForLesson error:', error);
    throw new Error(
      `Failed to get lesson video progress rows for lesson "${lessonId}": ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

function normalizeLessonVideoProgressValues(
  data: TNewLessonVideoProgress & { lessonId: string; profileId: string; assetId: string }
): TNewLessonVideoProgress & { lessonId: string; profileId: string; assetId: string } {
  return {
    ...data,
    durationSeconds: data.durationSeconds != null ? Math.round(data.durationSeconds) : data.durationSeconds,
    watchedSeconds: data.watchedSeconds != null ? Math.round(data.watchedSeconds) : data.watchedSeconds,
    furthestSeconds: data.furthestSeconds != null ? Math.floor(data.furthestSeconds) : data.furthestSeconds,
    lastPositionSeconds:
      data.lastPositionSeconds != null ? Math.floor(data.lastPositionSeconds) : data.lastPositionSeconds
  };
}

export async function upsertLessonVideoProgress(
  data: TNewLessonVideoProgress & { lessonId: string; profileId: string; assetId: string }
): Promise<TLessonVideoProgress> {
  try {
    const normalized = normalizeLessonVideoProgressValues(data);
    const existing = await getLessonVideoProgress(normalized.lessonId, normalized.profileId, normalized.assetId);
    const now = new Date().toISOString();

    if (existing) {
      const [updated] = await db
        .update(schema.lessonVideoProgress)
        .set({ ...normalized, updatedAt: now })
        .where(eq(schema.lessonVideoProgress.id, existing.id))
        .returning();

      if (!updated) {
        throw new Error('Failed to update lesson video progress');
      }

      return updated;
    }

    const [inserted] = await db
      .insert(schema.lessonVideoProgress)
      .values({ ...normalized, createdAt: now, updatedAt: now })
      .returning();

    if (!inserted) {
      throw new Error('Failed to insert lesson video progress');
    }

    return inserted;
  } catch (error) {
    console.error('upsertLessonVideoProgress error:', error);
    throw new Error(
      `Failed to upsert lesson video progress for lesson "${data.lessonId}": ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}
