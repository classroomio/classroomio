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
import { and, asc, count, db, desc, eq, gt, inArray, lt, ne, or, sql } from '@db/drizzle';

import type { DbOrTxClient } from '@db/drizzle';
import { contentWriteBumpsTimestamp } from '@db/queries/course/content-timestamp';

// Lesson Queries
export async function getLessonsByCourseId(courseId: string, dbClient: DbOrTxClient = db) {
  try {
    return dbClient.select().from(schema.lesson).where(eq(schema.lesson.courseId, courseId));
  } catch (error) {
    console.error('getLessonsByCourseId error:', error);
    throw new Error(
      `Failed to get lessons by course ID "${courseId}": ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export async function getPaginatedLessonsByCourseId(
  courseId: string,
  options: { sectionId?: string; page: number; limit: number }
): Promise<{ items: TLesson[]; total: number }> {
  try {
    const { sectionId, page, limit } = options;
    const where = and(
      eq(schema.lesson.courseId, courseId),
      sectionId ? eq(schema.lesson.sectionId, sectionId) : undefined
    );

    const [countRows, items] = await Promise.all([
      db.select({ total: count() }).from(schema.lesson).where(where),
      // A lesson in a section sorts at its section's top-level position, then by its order in the section.
      db
        .select({ lesson: schema.lesson })
        .from(schema.lesson)
        .leftJoin(schema.courseSection, eq(schema.courseSection.id, schema.lesson.sectionId))
        .where(where)
        .orderBy(
          asc(sql`coalesce(${schema.courseSection.order}, ${schema.lesson.order})`),
          asc(schema.lesson.sectionId),
          asc(schema.lesson.order),
          asc(schema.lesson.id)
        )
        .limit(limit)
        .offset((page - 1) * limit)
    ]);

    return { items: items.map((row) => row.lesson), total: Number(countRows[0]?.total ?? 0) };
  } catch (error) {
    console.error('getPaginatedLessonsByCourseId error:', error);
    throw new Error(
      `Failed to get paginated lessons for course "${courseId}": ${error instanceof Error ? error.message : 'Unknown error'}`
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
    console.error('getLessonById error:', error);
    throw new Error(
      `Failed to get lesson by ID "${lessonId}": ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export async function getPluginLessonReadingSource(
  lessonId: string,
  organizationId: string
): Promise<{ courseId: string; content: string | null } | null> {
  const rows = await db
    .select({
      courseId: schema.lesson.courseId,
      content: schema.lessonLanguage.content,
      locale: schema.lessonLanguage.locale
    })
    .from(schema.lesson)
    .innerJoin(schema.course, eq(schema.lesson.courseId, schema.course.id))
    .innerJoin(schema.group, eq(schema.course.groupId, schema.group.id))
    .leftJoin(schema.lessonLanguage, eq(schema.lessonLanguage.lessonId, schema.lesson.id))
    .where(and(eq(schema.lesson.id, lessonId), eq(schema.group.organizationId, organizationId)));

  if (rows.length === 0) return null;

  const preferredRow = rows.find((row) => row.locale === 'en') ?? rows[0];

  return { courseId: preferredRow.courseId, content: preferredRow.content };
}

/**
 * Resolves the minimum host-owned context needed to authorize a lesson-scoped
 * plugin operation. Plugins never receive this course identifier directly.
 */
export async function getPluginLessonAccessContext(
  lessonId: string,
  organizationId: string
): Promise<{ courseId: string } | null> {
  const [lessonContext] = await db
    .select({ courseId: schema.course.id })
    .from(schema.lesson)
    .innerJoin(schema.course, eq(schema.lesson.courseId, schema.course.id))
    .innerJoin(schema.group, eq(schema.course.groupId, schema.group.id))
    .where(and(eq(schema.lesson.id, lessonId), eq(schema.group.organizationId, organizationId)))
    .limit(1);

  return lessonContext ?? null;
}

export interface PluginLessonSourceItem {
  id: string;
  courseId: string;
  title: string;
  order: number;
  public: boolean | null;
  createdAt: string | null;
  updatedAt: string | null;
  content: string | null;
}

function parseLessonCursor(cursor?: string | null): { order: number; id: string } | null {
  if (!cursor) return null;
  try {
    const decoded = Buffer.from(cursor, 'base64url').toString('utf8');
    const [orderStr, id] = decoded.split('|');
    const order = Number(orderStr);
    if (!Number.isNaN(order) && id) return { order, id };
  } catch {}
  const [orderStr, id] = cursor.split('|');
  const order = Number(orderStr);
  if (!Number.isNaN(order) && id) return { order, id };
  return null;
}

function encodeLessonCursor(order: number, id: string): string {
  return Buffer.from(`${order}|${id}`).toString('base64url');
}

export async function getPluginLessonsByCourseId(
  organizationId: string,
  courseId: string,
  options?: { limit?: number; cursor?: string | null }
): Promise<{ items: PluginLessonSourceItem[]; nextCursor: string | null } | null> {
  const [courseExists] = await db
    .select({ id: schema.course.id })
    .from(schema.course)
    .innerJoin(schema.group, eq(schema.course.groupId, schema.group.id))
    .where(
      and(
        eq(schema.course.id, courseId),
        eq(schema.group.organizationId, organizationId),
        eq(schema.course.isTemplate, false)
      )
    )
    .limit(1);

  if (!courseExists) return null;

  const limit = Math.max(1, Math.min(Number(options?.limit) || 20, 100));
  const conditions = [eq(schema.lesson.courseId, courseId)];

  const parsedCursor = parseLessonCursor(options?.cursor);
  if (parsedCursor) {
    conditions.push(
      or(
        gt(schema.lesson.order, parsedCursor.order),
        and(eq(schema.lesson.order, parsedCursor.order), gt(schema.lesson.id, parsedCursor.id))
      )!
    );
  }

  const rows = await db
    .select({
      id: schema.lesson.id,
      courseId: schema.lesson.courseId,
      title: schema.lesson.title,
      order: schema.lesson.order,
      public: schema.lesson.public,
      createdAt: schema.lesson.createdAt,
      updatedAt: schema.lesson.updatedAt,
      content: schema.lessonLanguage.content
    })
    .from(schema.lesson)
    .leftJoin(
      schema.lessonLanguage,
      and(eq(schema.lessonLanguage.lessonId, schema.lesson.id), eq(schema.lessonLanguage.locale, 'en'))
    )
    .where(and(...conditions))
    .orderBy(asc(schema.lesson.order), asc(schema.lesson.id))
    .limit(limit + 1);

  const hasMore = rows.length > limit;
  const items = hasMore ? rows.slice(0, limit) : rows;
  const lastItem = items[items.length - 1];
  const nextCursor = hasMore && lastItem ? encodeLessonCursor(Number(lastItem.order), lastItem.id) : null;

  return { items, nextCursor };
}

export async function getPluginLessonById(
  organizationId: string,
  lessonId: string
): Promise<PluginLessonSourceItem | null> {
  const [row] = await db
    .select({
      id: schema.lesson.id,
      courseId: schema.lesson.courseId,
      title: schema.lesson.title,
      order: schema.lesson.order,
      public: schema.lesson.public,
      createdAt: schema.lesson.createdAt,
      updatedAt: schema.lesson.updatedAt,
      content: schema.lessonLanguage.content
    })
    .from(schema.lesson)
    .innerJoin(schema.course, eq(schema.lesson.courseId, schema.course.id))
    .innerJoin(schema.group, eq(schema.course.groupId, schema.group.id))
    .leftJoin(
      schema.lessonLanguage,
      and(eq(schema.lessonLanguage.lessonId, schema.lesson.id), eq(schema.lessonLanguage.locale, 'en'))
    )
    .where(
      and(
        eq(schema.lesson.id, lessonId),
        eq(schema.group.organizationId, organizationId),
        eq(schema.course.isTemplate, false)
      )
    )
    .limit(1);

  return row ?? null;
}

export interface PluginLessonContentItem {
  id: string;
  courseId: string;
  title: string;
  order: number;
  content: string | null;
  attachments: {
    name: string;
    url: string;
    type: string;
    size?: number;
  }[];
  updatedAt: string;
}

export async function getPluginLessonContent(
  organizationId: string,
  lessonId: string,
  actorId?: string,
  canReadAll = false
): Promise<PluginLessonContentItem | null> {
  const conditions = [
    eq(schema.lesson.id, lessonId),
    eq(schema.group.organizationId, organizationId),
    eq(schema.course.isTemplate, false)
  ];

  if (!canReadAll) {
    conditions.push(
      eq(schema.lesson.public, true),
      or(
        and(
          eq(schema.course.status, 'ACTIVE'),
          eq(schema.course.isPublished, true),
          eq(schema.course.publicForAll, true)
        ),
        sql<boolean>`exists (
          select 1 from ${schema.groupmember}
          where ${schema.groupmember.groupId} = ${schema.course.groupId}
            and ${schema.groupmember.profileId} = ${actorId}
        )`
      )!
    );
  }

  const [row] = await db
    .select({
      id: schema.lesson.id,
      courseId: schema.lesson.courseId,
      title: schema.lesson.title,
      order: schema.lesson.order,
      documents: schema.lesson.documents,
      createdAt: schema.lesson.createdAt,
      updatedAt: schema.lesson.updatedAt,
      content: schema.lessonLanguage.content
    })
    .from(schema.lesson)
    .innerJoin(schema.course, eq(schema.lesson.courseId, schema.course.id))
    .innerJoin(schema.group, eq(schema.course.groupId, schema.group.id))
    .leftJoin(
      schema.lessonLanguage,
      and(eq(schema.lessonLanguage.lessonId, schema.lesson.id), eq(schema.lessonLanguage.locale, 'en'))
    )
    .where(and(...conditions))
    .limit(1);

  if (!row) return null;

  const rawDocs = Array.isArray(row.documents) ? row.documents : [];
  const attachments = rawDocs
    .filter((doc): doc is NonNullable<typeof doc> => Boolean(doc && doc.name && doc.link))
    .map((doc) => {
      const item: { name: string; url: string; type: string; size?: number } = {
        name: doc.name,
        url: doc.link,
        type: doc.type || 'document'
      };
      if (typeof doc.size === 'number' && Number.isFinite(doc.size)) {
        item.size = Math.max(0, Math.floor(doc.size));
      }
      return item;
    });

  return {
    id: row.id,
    courseId: row.courseId,
    title: row.title,
    order: Number(row.order),
    content: row.content ?? null,
    attachments,
    updatedAt: row.updatedAt ?? row.createdAt ?? new Date().toISOString()
  };
}

export interface LessonCommentsAvailability {
  lessonId: string;
  courseId: string;
  organizationCommentsEnabled: boolean;
  lessonCommentsEnabled: boolean;
  courseCommentsEnabled: boolean;
}

type LessonCommentsAvailabilityRow = Omit<
  LessonCommentsAvailability,
  'courseCommentsEnabled' | 'organizationCommentsEnabled'
> & {
  courseMetadata: typeof schema.course.$inferSelect.metadata;
  organizationCustomization: typeof schema.organization.$inferSelect.customization | null;
};

function mapLessonCommentsAvailability(row: LessonCommentsAvailabilityRow): LessonCommentsAvailability {
  return {
    lessonId: row.lessonId,
    courseId: row.courseId,
    organizationCommentsEnabled: row.organizationCustomization?.apps?.comments === true,
    lessonCommentsEnabled: row.lessonCommentsEnabled,
    courseCommentsEnabled: row.courseMetadata.commentsEnabled ?? true
  };
}

export async function getLessonCommentsAvailability(lessonId: string): Promise<LessonCommentsAvailability | null> {
  try {
    const [row] = await db
      .select({
        lessonId: schema.lesson.id,
        courseId: schema.lesson.courseId,
        organizationCustomization: schema.organization.customization,
        lessonCommentsEnabled: schema.lesson.commentsEnabled,
        courseMetadata: schema.course.metadata
      })
      .from(schema.lesson)
      .innerJoin(schema.course, eq(schema.lesson.courseId, schema.course.id))
      .innerJoin(schema.group, eq(schema.course.groupId, schema.group.id))
      .innerJoin(schema.organization, eq(schema.group.organizationId, schema.organization.id))
      .where(eq(schema.lesson.id, lessonId))
      .limit(1);

    return row ? mapLessonCommentsAvailability(row) : null;
  } catch (error) {
    console.error('getLessonCommentsAvailability error:', error);
    throw new Error(
      `Failed to get lesson comments availability for lesson "${lessonId}": ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export async function getLessonCommentsAvailabilityByCommentId(
  commentId: number
): Promise<LessonCommentsAvailability | null> {
  try {
    const [row] = await db
      .select({
        lessonId: schema.lesson.id,
        courseId: schema.lesson.courseId,
        organizationCustomization: schema.organization.customization,
        lessonCommentsEnabled: schema.lesson.commentsEnabled,
        courseMetadata: schema.course.metadata
      })
      .from(schema.lessonComment)
      .innerJoin(schema.lesson, eq(schema.lessonComment.lessonId, schema.lesson.id))
      .innerJoin(schema.course, eq(schema.lesson.courseId, schema.course.id))
      .innerJoin(schema.group, eq(schema.course.groupId, schema.group.id))
      .innerJoin(schema.organization, eq(schema.group.organizationId, schema.organization.id))
      .where(eq(schema.lessonComment.id, commentId))
      .limit(1);

    return row ? mapLessonCommentsAvailability(row) : null;
  } catch (error) {
    console.error('getLessonCommentsAvailabilityByCommentId error:', error);
    throw new Error(
      `Failed to get lesson comments availability for comment "${commentId}": ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export interface LessonNavInfo {
  id: string;
  courseId: string;
  lessonTitle: string;
  courseTitle: string;
}

/**
 * Resolve navigation context (`/courses/{courseId}/lessons/{id}` + titles) for
 * a set of lesson ids in one query. Used to turn raw lesson ids into clickable
 * "go to lesson" links. Lessons in soft-deleted courses (`status = 'DELETED'`)
 * are excluded so callers don't link into a course that no longer exists.
 */
export async function getLessonNavInfoByIds(lessonIds: string[]): Promise<LessonNavInfo[]> {
  if (lessonIds.length === 0) return [];

  try {
    return await db
      .select({
        id: schema.lesson.id,
        courseId: schema.lesson.courseId,
        lessonTitle: schema.lesson.title,
        courseTitle: schema.course.title
      })
      .from(schema.lesson)
      .innerJoin(schema.course, eq(schema.course.id, schema.lesson.courseId))
      .where(and(inArray(schema.lesson.id, lessonIds), ne(schema.course.status, 'DELETED')));
  } catch (error) {
    console.error('getLessonNavInfoByIds error:', error);
    throw new Error(`Failed to get lesson nav info: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function createLessons(values: TNewLesson[], dbClient: DbOrTxClient = db) {
  try {
    return await dbClient.insert(schema.lesson).values(values).returning();
  } catch (error) {
    console.error('createLessons error:', error);
    throw new Error(`Failed to create lessons: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function updateLesson(lessonId: string, data: Partial<TLesson>, dbClient: DbOrTxClient = db) {
  try {
    const fields = { ...data };
    delete fields.updatedAt;
    const fieldNames = Object.keys(fields);
    const patch = contentWriteBumpsTimestamp(fieldNames) ? { ...fields, updatedAt: new Date().toISOString() } : fields;
    const [updated] = await dbClient.update(schema.lesson).set(patch).where(eq(schema.lesson.id, lessonId)).returning();
    return updated || null;
  } catch (error) {
    console.error('updateLesson error:', error);
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
    console.error('deleteLesson error:', error);
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
    console.error('getLessonCommentsByLessonId error:', error);
    throw new Error(
      `Failed to get lesson comments for lesson "${lessonId}": ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

// Date.parse rolls Feb 31 over to March; Postgres rejects it.
function isRealTimestamp(value: string): boolean {
  if (Number.isNaN(Date.parse(value))) return false;

  const [year, month, day] = value.slice(0, 10).split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

// Cursor is `<createdAt>|<id>`; a bare id is the format dashboards loaded before this change still hold.
function parseLessonCommentCursor(cursor?: string): { createdAt?: string; id: number } | undefined {
  if (!cursor) return undefined;
  if (/^\d+$/.test(cursor)) return { id: Number(cursor) };

  const separatorIndex = cursor.lastIndexOf('|');
  const createdAt = cursor.slice(0, separatorIndex);
  const id = cursor.slice(separatorIndex + 1);
  if (separatorIndex <= 0 || !/^\d+$/.test(id) || !isRealTimestamp(createdAt)) return undefined;

  return { createdAt, id: Number(id) };
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
    const { limit } = options;
    const cursor = parseLessonCommentCursor(options.cursor);

    // Build where conditions
    const whereConditions = [eq(schema.lessonComment.lessonId, lessonId)];
    if (cursor) {
      whereConditions.push(
        cursor.createdAt
          ? sql`(${schema.lessonComment.createdAt}, ${schema.lessonComment.id}) < (${cursor.createdAt}::timestamptz, ${cursor.id}::bigint)`
          : lt(schema.lessonComment.id, cursor.id)
      );
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
      .orderBy(desc(schema.lessonComment.createdAt), desc(schema.lessonComment.id))
      .limit(limit + 1);

    // Check if there are more comments
    const hasMore = comments.length > limit;
    const items = comments.slice(0, limit);

    // Get next cursor (oldest comment in this batch - for loading older comments)
    const lastComment = items[items.length - 1]?.comment;
    const nextCursor = hasMore && lastComment ? `${lastComment.createdAt}|${lastComment.id}` : null;

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
    console.error('getLessonCommentsByLessonIdPaginated error:', error);
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
    console.error('createLessonComment error:', error);
    throw new Error(`Failed to create lesson comment: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function getLessonCommentById(commentId: number): Promise<TLessonComment | null> {
  try {
    const [comment] = await db
      .select()
      .from(schema.lessonComment)
      .where(eq(schema.lessonComment.id, commentId))
      .limit(1);
    return comment || null;
  } catch (error) {
    console.error('getLessonCommentById error:', error);
    throw new Error(
      `Failed to get lesson comment "${commentId}": ${error instanceof Error ? error.message : 'Unknown error'}`
    );
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
    console.error('updateLessonComment error:', error);
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
    console.error('deleteLessonComment error:', error);
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
    console.error('getLessonCompletion error:', error);
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
    console.error('upsertLessonCompletion error:', error);
    throw new Error(`Failed to upsert lesson completion: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Lesson Language Queries
export async function getLessonLanguagesByLessonIds(lessonIds: string[], dbClient: DbOrTxClient = db) {
  if (lessonIds.length === 0) return [];
  try {
    return dbClient.select().from(schema.lessonLanguage).where(inArray(schema.lessonLanguage.lessonId, lessonIds));
  } catch (error) {
    console.error('getLessonLanguagesByLessonIds error:', error);
    throw new Error(
      `Failed to get lesson languages by lesson IDs: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export async function createLessonLanguages(values: TNewLessonLanguage[], dbClient: DbOrTxClient = db) {
  if (values.length === 0) return [];
  try {
    return await dbClient.insert(schema.lessonLanguage).values(values).returning();
  } catch (error) {
    console.error('createLessonLanguages error:', error);
    throw new Error(`Failed to create lesson languages: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
