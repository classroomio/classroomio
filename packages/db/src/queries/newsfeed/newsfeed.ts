import * as schema from '@db/schema';

import type { TCourseNewsfeed, TCourseNewsfeedComment, TNewCourseNewsfeed, TNewCourseNewsfeedComment } from '@db/types';
import { and, db, desc, eq, lt, ne, sql } from '@db/drizzle';

/**
 * Gets newsfeed items by course ID
 * @param courseId Course ID
 * @returns Array of newsfeed items with flattened author profile fields
 */
export async function getNewsfeedByCourseId(courseId: string): Promise<
  (TCourseNewsfeed & {
    authorProfileId: string | null;
    authorFullname: string | null;
    authorUsername: string | null;
    authorAvatarUrl: string | null;
  })[]
> {
  try {
    const feeds = await db
      .select({
        feed: schema.courseNewsfeed,
        profile: schema.profile
      })
      .from(schema.courseNewsfeed)
      .leftJoin(schema.groupmember, eq(schema.courseNewsfeed.authorId, schema.groupmember.id))
      .leftJoin(schema.profile, eq(schema.groupmember.profileId, schema.profile.id))
      .where(eq(schema.courseNewsfeed.courseId, courseId))
      .orderBy(desc(schema.courseNewsfeed.createdAt));

    return feeds.map((row) => ({
      ...row.feed,
      authorProfileId: row.profile?.id || null,
      authorFullname: row.profile?.fullname || null,
      authorUsername: row.profile?.username || null,
      authorAvatarUrl: row.profile?.avatarUrl || null
    }));
  } catch (error) {
    throw new Error(
      `Failed to get newsfeed by course ID "${courseId}": ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Gets paginated newsfeed items by course ID
 * @param courseId Course ID
 * @param options Pagination options (cursor, limit)
 * @returns Object with feeds array, total count, hasMore flag, and nextCursor
 */
export async function getNewsfeedByCourseIdPaginated(
  courseId: string,
  options: { cursor?: string; limit: number }
): Promise<{
  items: (TCourseNewsfeed & {
    authorProfileId: string | null;
    authorFullname: string | null;
    authorUsername: string | null;
    authorAvatarUrl: string | null;
    commentCount: number;
  })[];
  totalCount: number;
  hasMore: boolean;
  nextCursor: string | null;
}> {
  try {
    const { cursor, limit } = options;

    // Build where conditions
    const whereConditions = [eq(schema.courseNewsfeed.courseId, courseId)];
    if (cursor) {
      // Cursor is the last feed ID, fetch feeds created before it
      whereConditions.push(lt(schema.courseNewsfeed.createdAt, cursor));
    }

    // Get total count
    const totalCountResult = await db
      .select({ count: sql<number>`count(*)`.as('count') })
      .from(schema.courseNewsfeed)
      .where(eq(schema.courseNewsfeed.courseId, courseId));
    const totalCount = Number(totalCountResult[0]?.count || 0);

    // Fetch feeds with author profile and comment count (limit + 1 to check if there are more)
    const feeds = await db
      .select({
        feed: schema.courseNewsfeed,
        profile: schema.profile,
        commentCount: getCommentCount()
      })
      .from(schema.courseNewsfeed)
      .leftJoin(schema.groupmember, eq(schema.courseNewsfeed.authorId, schema.groupmember.id))
      .leftJoin(schema.profile, eq(schema.groupmember.profileId, schema.profile.id))
      .where(and(...whereConditions))
      .orderBy(desc(schema.courseNewsfeed.createdAt))
      .limit(limit + 1);

    // Check if there are more feeds
    const hasMore = feeds.length > limit;
    const items = feeds.slice(0, limit);

    // Get next cursor (createdAt timestamp of the oldest feed in this batch)
    const nextCursor = hasMore && items.length > 0 ? items[items.length - 1].feed.createdAt : null;

    return {
      items: items.map((row) => ({
        ...row.feed,
        authorProfileId: row.profile?.id || null,
        authorFullname: row.profile?.fullname || null,
        authorUsername: row.profile?.username || null,
        authorAvatarUrl: row.profile?.avatarUrl || null,
        commentCount: Number(row.commentCount || 0)
      })),
      totalCount,
      hasMore,
      nextCursor
    };
  } catch (error) {
    throw new Error(
      `Failed to get paginated newsfeed by course ID "${courseId}": ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Gets a newsfeed item by ID
 * @param feedId Newsfeed ID
 * @returns Newsfeed item or null
 */
export async function getNewsfeedById(feedId: string): Promise<TCourseNewsfeed | null> {
  try {
    const [feed] = await db.select().from(schema.courseNewsfeed).where(eq(schema.courseNewsfeed.id, feedId)).limit(1);
    return feed || null;
  } catch (error) {
    throw new Error(
      `Failed to get newsfeed by ID "${feedId}": ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Creates a new newsfeed item
 * @param data Newsfeed data
 * @returns Created newsfeed item
 */
export async function createNewsfeed(data: TNewCourseNewsfeed): Promise<TCourseNewsfeed> {
  try {
    const [feed] = await db.insert(schema.courseNewsfeed).values(data).returning();
    if (!feed) {
      throw new Error('Failed to create newsfeed');
    }
    return feed;
  } catch (error) {
    throw new Error(`Failed to create newsfeed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Updates a newsfeed item
 * @param feedId Newsfeed ID
 * @param data Partial newsfeed data
 * @returns Updated newsfeed item or null
 */
export async function updateNewsfeed(feedId: string, data: Partial<TCourseNewsfeed>): Promise<TCourseNewsfeed | null> {
  try {
    const [updated] = await db
      .update(schema.courseNewsfeed)
      .set(data)
      .where(eq(schema.courseNewsfeed.id, feedId))
      .returning();
    return updated || null;
  } catch (error) {
    throw new Error(
      `Failed to update newsfeed "${feedId}": ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Deletes a newsfeed item
 * @param feedId Newsfeed ID
 * @returns Deleted newsfeed item or null
 */
export async function deleteNewsfeed(feedId: string): Promise<TCourseNewsfeed | null> {
  try {
    const [deleted] = await db.delete(schema.courseNewsfeed).where(eq(schema.courseNewsfeed.id, feedId)).returning();
    return deleted || null;
  } catch (error) {
    throw new Error(
      `Failed to delete newsfeed "${feedId}": ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Gets comments for a newsfeed item
 * @param feedId Newsfeed ID
 * @returns Array of comments
 */
export async function getNewsfeedCommentsByFeedId(feedId: string): Promise<TCourseNewsfeedComment[]> {
  try {
    return db
      .select()
      .from(schema.courseNewsfeedComment)
      .where(eq(schema.courseNewsfeedComment.courseNewsfeedId, feedId))
      .orderBy(schema.courseNewsfeedComment.createdAt);
  } catch (error) {
    throw new Error(
      `Failed to get newsfeed comments for feed "${feedId}": ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Gets paginated comments for a newsfeed item with author profile
 * @param feedId Newsfeed ID
 * @param options Pagination options (cursor, limit)
 * @returns Object with comments array, total count, hasMore flag, and nextCursor
 */
export async function getNewsfeedCommentsByFeedIdPaginated(
  feedId: string,
  options: { cursor?: string; limit: number }
) {
  try {
    const { cursor, limit } = options;

    // Build where conditions
    const whereConditions = [eq(schema.courseNewsfeedComment.courseNewsfeedId, feedId)];
    if (cursor) {
      // Cursor is the last comment ID, fetch comments created after it
      whereConditions.push(lt(schema.courseNewsfeedComment.id, Number(cursor)));
    }

    // Get total count
    const totalCountResult = await db
      .select({ count: sql<number>`count(*)`.as('count') })
      .from(schema.courseNewsfeedComment)
      .where(eq(schema.courseNewsfeedComment.courseNewsfeedId, feedId));
    const totalCount = Number(totalCountResult[0]?.count || 0);

    // Fetch comments with author profile (limit + 1 to check if there are more)
    const comments = await db
      .select({
        comment: schema.courseNewsfeedComment,
        groupmember: schema.groupmember,
        profile: schema.profile
      })
      .from(schema.courseNewsfeedComment)
      .leftJoin(schema.groupmember, eq(schema.courseNewsfeedComment.authorId, schema.groupmember.id))
      .leftJoin(schema.profile, eq(schema.groupmember.profileId, schema.profile.id))
      .where(and(...whereConditions))
      .orderBy(desc(schema.courseNewsfeedComment.createdAt))
      .limit(limit + 1);

    // Check if there are more comments
    const hasMore = comments.length > limit;
    const items = comments.slice(0, limit);

    // Get next cursor (ID of the oldest comment in this batch - for loading older comments)
    const nextCursor = hasMore && items.length > 0 ? String(items[items.length - 1].comment.id) : null;

    return {
      items: items.map((row) => ({
        ...row.comment,
        authorProfileId: row.profile?.id || null,
        authorFullname: row.profile?.fullname || null,
        authorUsername: row.profile?.username || null,
        authorAvatarUrl: row.profile?.avatarUrl || null
      })),
      totalCount,
      hasMore,
      nextCursor
    };
  } catch (error) {
    throw new Error(
      `Failed to get paginated newsfeed comments for feed "${feedId}": ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Creates a newsfeed comment
 * @param data Comment data
 * @returns Created comment
 */
export async function createNewsfeedComment(data: TNewCourseNewsfeedComment): Promise<TCourseNewsfeedComment> {
  try {
    const [comment] = await db.insert(schema.courseNewsfeedComment).values(data).returning();
    if (!comment) {
      throw new Error('Failed to create newsfeed comment');
    }
    return comment;
  } catch (error) {
    throw new Error(`Failed to create newsfeed comment: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Deletes a newsfeed comment
 * @param commentId Comment ID
 * @returns Deleted comment or null
 */
export async function updateNewsfeedComment(
  commentId: number,
  content: string
): Promise<TCourseNewsfeedComment | null> {
  try {
    const [updated] = await db
      .update(schema.courseNewsfeedComment)
      .set({ content })
      .where(eq(schema.courseNewsfeedComment.id, commentId))
      .returning();
    return updated || null;
  } catch (error) {
    throw new Error(
      `Failed to update newsfeed comment "${commentId}": ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export async function deleteNewsfeedComment(commentId: number): Promise<TCourseNewsfeedComment | null> {
  try {
    const [deleted] = await db
      .delete(schema.courseNewsfeedComment)
      .where(eq(schema.courseNewsfeedComment.id, commentId))
      .returning();
    return deleted || null;
  } catch (error) {
    throw new Error(
      `Failed to delete newsfeed comment "${commentId}": ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Gets comment author and course ID for authorization checks
 * @param commentId Comment ID
 * @returns Object with authorId (group member ID) and courseId, or null if not found
 */
export async function getNewsfeedCommentAuthorAndCourse(commentId: number): Promise<{
  authorId: string | null;
  courseId: string | null;
} | null> {
  try {
    const result = await db
      .select({
        authorId: schema.courseNewsfeedComment.authorId,
        courseId: schema.courseNewsfeed.courseId
      })
      .from(schema.courseNewsfeedComment)
      .innerJoin(schema.courseNewsfeed, eq(schema.courseNewsfeedComment.courseNewsfeedId, schema.courseNewsfeed.id))
      .where(eq(schema.courseNewsfeedComment.id, commentId))
      .limit(1);

    if (result.length === 0) {
      return null;
    }

    return {
      authorId: result[0].authorId,
      courseId: result[0].courseId
    };
  } catch (error) {
    throw new Error(
      `Failed to get newsfeed comment author for comment "${commentId}": ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Gets feed data with course, organization, author, and members info for email notifications
 * @param feedId Feed ID
 * @param excludeAuthorId Group member ID to exclude from course members list
 * @returns Feed data with course, org, author, and members info, or null if not found
 */
export async function getNewsfeedForEmail(
  feedId: string,
  excludeAuthorId?: string
): Promise<{
  feedId: string;
  courseId: string | null;
  courseTitle: string | null;
  content: string | null;
  author: {
    groupMemberId: string | null;
    fullname: string | null;
    email: string | null;
  } | null;
  organization: {
    name: string | null;
    siteName: string | null;
  } | null;
  courseMembers: Array<{
    email: string | null;
    fullname: string | null;
  }>;
} | null> {
  try {
    const result = await db
      .select({
        feed: schema.courseNewsfeed,
        course: schema.course,
        organization: schema.organization,
        authorGroupMember: schema.groupmember,
        authorProfile: schema.profile
      })
      .from(schema.courseNewsfeed)
      .innerJoin(schema.course, eq(schema.courseNewsfeed.courseId, schema.course.id))
      .innerJoin(schema.group, eq(schema.course.groupId, schema.group.id))
      .innerJoin(schema.organization, eq(schema.group.organizationId, schema.organization.id))
      .leftJoin(schema.groupmember, eq(schema.courseNewsfeed.authorId, schema.groupmember.id))
      .leftJoin(schema.profile, eq(schema.groupmember.profileId, schema.profile.id))
      .where(eq(schema.courseNewsfeed.id, feedId))
      .limit(1);

    if (result.length === 0) {
      return null;
    }

    const row = result[0];

    // Get all course members (excluding author if specified)
    const memberConditions = [eq(schema.course.id, row.course.id)];
    if (excludeAuthorId) {
      memberConditions.push(ne(schema.groupmember.id, excludeAuthorId));
    }

    const membersResult = await db
      .select({
        groupMember: schema.groupmember,
        profile: schema.profile
      })
      .from(schema.groupmember)
      .innerJoin(schema.course, eq(schema.course.groupId, schema.groupmember.groupId))
      .leftJoin(schema.profile, eq(schema.groupmember.profileId, schema.profile.id))
      .where(and(...memberConditions));

    return {
      feedId,
      courseId: row.course.id,
      courseTitle: row.course.title,
      content: row.feed.content,
      author: row.authorGroupMember
        ? {
            groupMemberId: row.authorGroupMember.id,
            fullname: row.authorProfile?.fullname || null,
            email: row.authorProfile?.email || null
          }
        : null,
      organization: {
        name: row.organization.name,
        siteName: row.organization.siteName
      },
      courseMembers: membersResult
        .filter((m) => m.profile?.email) // Only include members with email
        .map((m) => ({
          email: m.profile?.email || null,
          fullname: m.profile?.fullname || null
        }))
    };
  } catch (error) {
    throw new Error(
      `Failed to get newsfeed data for email "${feedId}": ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

function getCommentCount() {
  return sql<number>`
          COALESCE(
            (SELECT COUNT(*)::int 
             FROM ${schema.courseNewsfeedComment} 
             WHERE ${schema.courseNewsfeedComment.courseNewsfeedId} = ${schema.courseNewsfeed.id}),
            0
          )
        `.as('commentCount');
}
