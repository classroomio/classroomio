import * as schema from '@db/schema';

import type {
  TLesson,
  TLessonComment,
  TLessonCompletion,
  TLessonLanguage,
  TNewLesson,
  TNewLessonComment,
  TNewLessonCompletion,
  TNewLessonLanguage
} from '@db/types';
import { and, db, desc, eq, inArray, lt, sql } from '@db/drizzle';

import type { DbOrTxClient } from '@db/drizzle';

// Lesson Queries
export async function getLessonsByCourseId(courseId: string) {
  try {
    return db.select().from(schema.lesson).where(eq(schema.lesson.courseId, courseId));
  } catch (error) {
    throw new Error(
      `Failed to get lessons by course ID "${courseId}": ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export interface LessonById extends TLesson {
  lessonLanguages: TLessonLanguage[];
}

export async function getLessonById(lessonId: string): Promise<LessonById | null> {
  try {
    const [lesson] = await db.select().from(schema.lesson).where(eq(schema.lesson.id, lessonId)).limit(1);
    if (!lesson) return null;

    // Fetch lesson languages
    const lessonLanguages = await db
      .select()
      .from(schema.lessonLanguage)
      .where(eq(schema.lessonLanguage.lessonId, lessonId));

    return {
      ...lesson,
      lessonLanguages
    };
  } catch (error) {
    throw new Error(
      `Failed to get lesson by ID "${lessonId}": ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export async function createLessons(values: TNewLesson[]) {
  try {
    return db.insert(schema.lesson).values(values).returning();
  } catch (error) {
    throw new Error(`Failed to create lessons: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function updateLesson(lessonId: string, data: Partial<TLesson>, dbClient: DbOrTxClient = db) {
  try {
    const [updated] = await dbClient
      .update(schema.lesson)
      .set({ ...data, updatedAt: new Date().toISOString() })
      .where(eq(schema.lesson.id, lessonId))
      .returning();
    return updated || null;
  } catch (error) {
    throw new Error(
      `Failed to update lesson "${lessonId}": ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export async function deleteLesson(lessonId: string, dbClient: DbOrTxClient = db) {
  try {
    const [deleted] = await dbClient.delete(schema.lesson).where(eq(schema.lesson.id, lessonId)).returning();
    return deleted || null;
  } catch (error) {
    throw new Error(
      `Failed to delete lesson "${lessonId}": ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

// Lesson Comment Queries
export async function getLessonCommentsByLessonId(lessonId: string) {
  try {
    const comments = await db
      .select({
        comment: schema.lessonComment,
        groupmember: schema.groupmember,
        profile: schema.profile
      })
      .from(schema.lessonComment)
      .leftJoin(schema.groupmember, eq(schema.lessonComment.groupmemberId, schema.groupmember.id))
      .leftJoin(schema.profile, eq(schema.groupmember.profileId, schema.profile.id))
      .where(eq(schema.lessonComment.lessonId, lessonId))
      .orderBy(desc(schema.lessonComment.createdAt));

    return comments.map((row) => ({
      ...row.comment,
      groupmember: row.groupmember
        ? {
            id: row.groupmember.id
          }
        : null,
      profile: row.profile
        ? {
            fullname: row.profile.fullname,
            avatarUrl: row.profile.avatarUrl
          }
        : null
    }));
  } catch (error) {
    throw new Error(
      `Failed to get lesson comments for lesson "${lessonId}": ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Gets paginated comments for a lesson with author profile
 * @param lessonId Lesson ID
 * @param options Pagination options (cursor, limit)
 * @returns Object with comments array, total count, hasMore flag, and nextCursor
 */
export async function getLessonCommentsByLessonIdPaginated(
  lessonId: string,
  options: { cursor?: string; limit: number }
): Promise<{
  items: Array<
    TLessonComment & {
      groupmember: { id: string } | null;
      profile: { fullname: string | null; avatarUrl: string | null } | null;
    }
  >;
  totalCount: number;
  hasMore: boolean;
  nextCursor: string | null;
}> {
  try {
    const { cursor, limit } = options;

    // Build where conditions
    const whereConditions = [eq(schema.lessonComment.lessonId, lessonId)];
    if (cursor) {
      // Cursor is the last comment ID, fetch comments created before it
      whereConditions.push(lt(schema.lessonComment.id, Number(cursor)));
    }

    // Get total count
    const totalCountResult = await db
      .select({ count: sql<number>`count(*)`.as('count') })
      .from(schema.lessonComment)
      .where(eq(schema.lessonComment.lessonId, lessonId));
    const totalCount = Number(totalCountResult[0]?.count || 0);

    // Fetch comments with author profile (limit + 1 to check if there are more)
    const comments = await db
      .select({
        comment: schema.lessonComment,
        groupmember: schema.groupmember,
        profile: schema.profile
      })
      .from(schema.lessonComment)
      .leftJoin(schema.groupmember, eq(schema.lessonComment.groupmemberId, schema.groupmember.id))
      .leftJoin(schema.profile, eq(schema.groupmember.profileId, schema.profile.id))
      .where(and(...whereConditions))
      .orderBy(desc(schema.lessonComment.createdAt))
      .limit(limit + 1);

    // Check if there are more comments
    const hasMore = comments.length > limit;
    const items = comments.slice(0, limit);

    // Get next cursor (ID of the oldest comment in this batch - for loading older comments)
    const nextCursor = hasMore && items.length > 0 ? String(items[items.length - 1].comment.id) : null;

    return {
      items: items.map((row) => ({
        ...row.comment,
        groupmember: row.groupmember
          ? {
              id: row.groupmember.id
            }
          : null,
        profile: row.profile
          ? {
              fullname: row.profile.fullname,
              avatarUrl: row.profile.avatarUrl
            }
          : null
      })),
      totalCount,
      hasMore,
      nextCursor
    };
  } catch (error) {
    throw new Error(
      `Failed to get paginated lesson comments for lesson "${lessonId}": ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export async function createLessonComment(data: TNewLessonComment): Promise<TLessonComment> {
  try {
    const [comment] = await db.insert(schema.lessonComment).values(data).returning();
    if (!comment) {
      throw new Error('Failed to create lesson comment');
    }
    return comment;
  } catch (error) {
    console.log('createLessonComment', error);
    throw new Error(`Failed to create lesson comment: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function updateLessonComment(commentId: number, comment: string): Promise<TLessonComment | null> {
  try {
    const [updated] = await db
      .update(schema.lessonComment)
      .set({ comment, updatedAt: new Date().toISOString() })
      .where(eq(schema.lessonComment.id, commentId))
      .returning();
    return updated || null;
  } catch (error) {
    throw new Error(
      `Failed to update lesson comment "${commentId}": ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export async function deleteLessonComment(commentId: number) {
  try {
    const [deleted] = await db.delete(schema.lessonComment).where(eq(schema.lessonComment.id, commentId)).returning();
    return deleted || null;
  } catch (error) {
    throw new Error(
      `Failed to delete lesson comment "${commentId}": ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

// Lesson Completion Queries
export async function getLessonCompletion(lessonId: string, profileId: string): Promise<TLessonCompletion | null> {
  try {
    const [completion] = await db
      .select()
      .from(schema.lessonCompletion)
      .where(and(eq(schema.lessonCompletion.lessonId, lessonId), eq(schema.lessonCompletion.profileId, profileId)))
      .limit(1);
    return completion || null;
  } catch (error) {
    throw new Error(`Failed to get lesson completion: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function upsertLessonCompletion(data: TNewLessonCompletion): Promise<TLessonCompletion> {
  try {
    const [completion] = await db
      .insert(schema.lessonCompletion)
      .values(data)
      .onConflictDoUpdate({
        target: [schema.lessonCompletion.lessonId, schema.lessonCompletion.profileId],
        set: {
          isComplete: data.isComplete,
          updatedAt: new Date().toISOString()
        }
      })
      .returning();
    if (!completion) {
      throw new Error('Failed to upsert lesson completion');
    }
    return completion;
  } catch (error) {
    throw new Error(`Failed to upsert lesson completion: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Lesson Language Queries
export async function getLessonLanguagesByLessonIds(lessonIds: string[]) {
  if (lessonIds.length === 0) return [];
  try {
    return db.select().from(schema.lessonLanguage).where(inArray(schema.lessonLanguage.lessonId, lessonIds));
  } catch (error) {
    throw new Error(
      `Failed to get lesson languages by lesson IDs: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export async function createLessonLanguages(values: TNewLessonLanguage[]) {
  if (values.length === 0) return [];
  try {
    return db.insert(schema.lessonLanguage).values(values).returning();
  } catch (error) {
    throw new Error(`Failed to create lesson languages: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Gets lesson version history for a lesson and locale
 * @param lessonId Lesson ID
 * @param locale Locale
 * @param endRange End range for pagination (0-indexed, inclusive)
 * @returns Array of lesson version history entries
 */
export async function getLessonVersionHistory(
  lessonId: string,
  locale: string,
  endRange: number
): Promise<
  Array<{
    oldContent: string | null;
    newContent: string | null;
    timestamp: string | null;
    locale: string | null;
    lessonId: string | null;
  }>
> {
  try {
    const result = await db
      .select()
      .from(schema.lessonVersions)
      .where(and(eq(schema.lessonVersions.lessonId, lessonId), eq(schema.lessonVersions.locale, locale as any)))
      .orderBy(desc(schema.lessonVersions.timestamp))
      .limit(endRange + 1);

    return result;
  } catch (error) {
    throw new Error(
      `Failed to get lesson version history: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}
