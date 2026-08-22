import * as schema from '@db/schema';

import type { TCourseNewsfeed, TCourseNewsfeedComment, TNewCourseNewsfeed, TNewCourseNewsfeedComment } from '@db/types';
import { and, db, desc, eq, isNull, lt, ne, sql } from '@db/drizzle';
import { ROLE } from '@cio/utils/constants';

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
    console.error('getNewsfeedByCourseId error:', error);
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
    console.error('getNewsfeedByCourseIdPaginated error:', error);
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
    console.error('getNewsfeedById error:', error);
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
    console.error('createNewsfeed error:', error);
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
    console.error('updateNewsfeed error:', error);
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
    console.error('deleteNewsfeed error:', error);
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
    console.error('getNewsfeedCommentsByFeedId error:', error);
    throw new Error(
      `Failed to get newsfeed comments for feed "${feedId}": ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export type TNewsfeedCommentNode = {
  id: number;
  parentId: number | null;
  replyToCommentId: number | null;
  courseNewsfeedId: string | null;
  authorId: string | null;
  content: string | null;
  createdAt: string;
  /** Levels below the requested root. */
  depth: number;
  authorProfileId: string | null;
  authorFullname: string | null;
  authorUsername: string | null;
  authorAvatarUrl: string | null;
  replyToAuthorFullname: string | null;
  /** Immediate children in the database, not just the fetched ones. */
  directReplyCount: number;
  /** Whole subtree size in the database, including nodes below the fetched depth. */
  descendantCount: number;
  loadedChildCount: number;
  hasMoreChildren: boolean;
};

type ThreadRow = Omit<TNewsfeedCommentNode, 'loadedChildCount' | 'hasMoreChildren'> & {
  hasMoreRoots: boolean;
  remainingChildren: number;
  totalRootCount: number;
  totalCommentCount: number;
};

/**
 * Gets a comment subtree for a newsfeed item in a single round trip.
 *
 * Ordering and pagination are both on `id DESC`. The identity sequence and `created_at`
 * default advance together, so newest-first by id is a total, stable keyset — mixing
 * `ORDER BY created_at` with an id cursor would silently skip rows.
 *
 * `descendantCount` is computed over a feed-scoped closure that ignores `maxDepth`, so a
 * node sitting exactly at the fetch depth still reports how much is hidden beneath it.
 */
export async function getNewsfeedCommentThread(
  feedId: string,
  options: {
    rootId?: number;
    cursor?: string;
    childCursor?: string;
    rootLimit?: number;
    childLimit?: number;
    maxDepth?: number;
  } = {}
) {
  try {
    const rootLimit = options.rootLimit ?? 5;
    const childLimit = options.childLimit ?? 3;
    const maxDepth = options.maxDepth ?? 3;
    const rootId = options.rootId ?? null;
    const cursor = options.cursor ? Number(options.cursor) : null;
    const childCursor = options.childCursor ? Number(options.childCursor) : null;

    const result = await db.execute(sql`
      WITH RECURSIVE
      feed_comments AS MATERIALIZED (
        SELECT id::int AS id, parent_id::int AS parent_id
        FROM course_newsfeed_comment
        WHERE course_newsfeed_id = ${feedId}
      ),
      direct_counts AS (
        SELECT parent_id AS id, COUNT(*)::int AS direct_reply_count
        FROM feed_comments WHERE parent_id IS NOT NULL GROUP BY parent_id
      ),
      roots AS (
        SELECT id::int AS id
        FROM course_newsfeed_comment
        WHERE course_newsfeed_id = ${feedId}
          AND CASE WHEN ${rootId}::int IS NULL THEN parent_id IS NULL ELSE id = ${rootId}::int END
          AND (${cursor}::int IS NULL OR id < ${cursor}::int)
        ORDER BY id DESC
        LIMIT ${rootLimit + 1}
      ),
      root_page AS (
        SELECT id FROM (SELECT id, row_number() OVER (ORDER BY id DESC) AS rn FROM roots) r
        WHERE rn <= ${rootLimit}
      ),
      subtree AS (
        SELECT rp.id, 0 AS depth FROM root_page rp
        UNION ALL
        SELECT fc.id, st.depth + 1
        FROM subtree st
        JOIN feed_comments fc ON fc.parent_id = st.id
        WHERE st.depth < ${maxDepth}
          AND (st.depth > 0 OR ${childCursor}::int IS NULL OR fc.id < ${childCursor}::int)
      ),
      ranked AS (
        SELECT st.id, st.depth, fc.parent_id,
               row_number() OVER (PARTITION BY fc.parent_id ORDER BY st.id DESC) AS sibling_rank
        FROM subtree st JOIN feed_comments fc ON fc.id = st.id
      ),
      visible AS (
        SELECT r.id, r.depth FROM ranked r WHERE r.depth = 0
        UNION ALL
        SELECT r.id, r.depth
        FROM visible v JOIN ranked r ON r.parent_id = v.id
        WHERE r.sibling_rank <= ${childLimit}
      ),
      closure AS (
        SELECT v.id AS ancestor_id, v.id AS node_id FROM visible v
        UNION ALL
        SELECT cl.ancestor_id, fc.id
        FROM closure cl
        JOIN feed_comments fc ON fc.parent_id = cl.node_id
      ),
      descendant_counts AS (
        SELECT ancestor_id AS id, (COUNT(*) - 1)::int AS descendant_count
        FROM closure GROUP BY ancestor_id
      ),
      remaining_children AS (
        SELECT COUNT(*)::int AS n
        FROM feed_comments fc
        WHERE ${rootId}::int IS NOT NULL
          AND fc.parent_id = ${rootId}::int
          AND fc.id < COALESCE((SELECT MIN(v.id) FROM visible v WHERE v.depth = 1), 0)
      )
      SELECT
        c.id::int                  AS "id",
        c.parent_id::int           AS "parentId",
        c.reply_to_comment_id::int AS "replyToCommentId",
        c.course_newsfeed_id       AS "courseNewsfeedId",
        c.author_id                AS "authorId",
        c.content                  AS "content",
        c.created_at               AS "createdAt",
        v.depth::int               AS "depth",
        p.id                       AS "authorProfileId",
        p.fullname                 AS "authorFullname",
        p.username                 AS "authorUsername",
        p.avatar_url               AS "authorAvatarUrl",
        rtp.fullname               AS "replyToAuthorFullname",
        COALESCE(dc.direct_reply_count, 0)::int AS "directReplyCount",
        COALESCE(dsc.descendant_count, 0)::int  AS "descendantCount",
        ((SELECT COUNT(*) FROM roots) > ${rootLimit})                       AS "hasMoreRoots",
        (SELECT n FROM remaining_children)                                  AS "remainingChildren",
        (SELECT COUNT(*)::int FROM feed_comments WHERE parent_id IS NULL)   AS "totalRootCount",
        (SELECT COUNT(*)::int FROM feed_comments)                           AS "totalCommentCount"
      FROM visible v
      JOIN course_newsfeed_comment c ON c.id = v.id
      LEFT JOIN groupmember gm  ON gm.id  = c.author_id
      LEFT JOIN profile p       ON p.id   = gm.profile_id
      LEFT JOIN course_newsfeed_comment rt ON rt.id = c.reply_to_comment_id
      LEFT JOIN groupmember rtm ON rtm.id = rt.author_id
      LEFT JOIN profile rtp     ON rtp.id = rtm.profile_id
      LEFT JOIN direct_counts dc   ON dc.id  = c.id
      LEFT JOIN descendant_counts dsc ON dsc.id = c.id
      ORDER BY v.depth ASC, c.id DESC
    `);

    const rows = result.map((row) => row as unknown as ThreadRow);

    const loadedByParent = new Map<number, number>();
    for (const row of rows) {
      if (row.parentId === null) continue;

      const parentId = Number(row.parentId);
      loadedByParent.set(parentId, (loadedByParent.get(parentId) ?? 0) + 1);
    }

    const items: TNewsfeedCommentNode[] = rows.map((row) => {
      const directReplyCount = Number(row.directReplyCount);
      const loadedChildCount = loadedByParent.get(Number(row.id)) ?? 0;

      return {
        id: Number(row.id),
        parentId: row.parentId === null ? null : Number(row.parentId),
        replyToCommentId: row.replyToCommentId === null ? null : Number(row.replyToCommentId),
        courseNewsfeedId: row.courseNewsfeedId,
        authorId: row.authorId,
        content: row.content,
        createdAt: row.createdAt,
        depth: Number(row.depth),
        authorProfileId: row.authorProfileId,
        authorFullname: row.authorFullname,
        authorUsername: row.authorUsername,
        authorAvatarUrl: row.authorAvatarUrl,
        replyToAuthorFullname: row.replyToAuthorFullname,
        directReplyCount,
        descendantCount: Number(row.descendantCount),
        loadedChildCount,
        hasMoreChildren: directReplyCount > loadedChildCount
      };
    });

    const totals = rows[0];
    const rootRows = items.filter((item) => item.depth === 0);
    const isChildPage = rootId !== null;

    const hasMore = isChildPage ? Number(totals?.remainingChildren ?? 0) > 0 : Boolean(totals?.hasMoreRoots);
    const childRows = isChildPage ? items.filter((item) => item.depth === 1) : [];
    const lastChild = childRows.length > 0 ? childRows[childRows.length - 1] : undefined;
    const lastRoot = rootRows.length > 0 ? rootRows[rootRows.length - 1] : undefined;
    const nextCursorSource = isChildPage ? lastChild : lastRoot;

    return {
      items,
      totalRootCount: Number(totals?.totalRootCount ?? 0),
      totalCommentCount: Number(totals?.totalCommentCount ?? 0),
      hasMore,
      nextCursor: hasMore && nextCursorSource ? String(nextCursorSource.id) : null,
      rootId,
      maxDepth
    };
  } catch (error) {
    console.error('getNewsfeedCommentThread error:', error);
    throw new Error(
      `Failed to get newsfeed comment thread for feed "${feedId}": ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Counts every descendant, including any the caller never fetched.
 */
export async function countNewsfeedCommentDescendants(commentId: number): Promise<number> {
  try {
    const result = await db.execute(sql`
      WITH RECURSIVE descendants AS (
        SELECT id::int AS id FROM course_newsfeed_comment WHERE parent_id = ${commentId}
        UNION ALL
        SELECT c.id::int
        FROM course_newsfeed_comment c
        JOIN descendants d ON c.parent_id = d.id
      )
      SELECT COUNT(*)::int AS "count" FROM descendants
    `);
    const rows = result.map((row) => row as unknown as { count: number });

    return Number(rows[0]?.count ?? 0);
  } catch (error) {
    console.error('countNewsfeedCommentDescendants error:', error);
    throw new Error(`Failed to count descendants for comment "${commentId}"`);
  }
}

/** Depth within the thread; 0 for a top-level comment. */
export async function getNewsfeedCommentDepth(commentId: number): Promise<number> {
  try {
    const result = await db.execute(sql`
      WITH RECURSIVE ancestors AS (
        SELECT id::int AS id, parent_id::int AS parent_id, 0 AS depth
        FROM course_newsfeed_comment WHERE id = ${commentId}
        UNION ALL
        SELECT c.id::int, c.parent_id::int, a.depth + 1
        FROM course_newsfeed_comment c
        JOIN ancestors a ON a.parent_id = c.id
      )
      SELECT MAX(depth)::int AS "depth" FROM ancestors
    `);
    const rows = result.map((row) => row as unknown as { depth: number | null });

    return Number(rows[0]?.depth ?? 0);
  } catch (error) {
    console.error('getNewsfeedCommentDepth error:', error);
    throw new Error(`Failed to get depth for comment "${commentId}"`);
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
    console.error('createNewsfeedComment error:', error);
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
    console.error('updateNewsfeedComment error:', error);
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
    console.error('deleteNewsfeedComment error:', error);
    throw new Error(
      `Failed to delete newsfeed comment "${commentId}": ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Gets a single newsfeed comment by ID
 * @param commentId Comment ID
 * @returns Comment or null
 */
export async function getNewsfeedCommentById(commentId: number): Promise<TCourseNewsfeedComment | null> {
  try {
    const [comment] = await db
      .select()
      .from(schema.courseNewsfeedComment)
      .where(eq(schema.courseNewsfeedComment.id, commentId))
      .limit(1);
    return comment || null;
  } catch (error) {
    console.error('getNewsfeedCommentById error:', error);
    throw new Error(
      `Failed to get newsfeed comment by ID "${commentId}": ${error instanceof Error ? error.message : 'Unknown error'}`
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
    console.error('getNewsfeedCommentAuthorAndCourse error:', error);
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
    id: string;
    name: string | null;
    siteName: string | null;
    avatarUrl: string | null;
    theme: string | null;
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
    const memberConditions = [eq(schema.course.id, row.course.id), eq(schema.groupmember.roleId, ROLE.STUDENT)];
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
        id: row.organization.id,
        name: row.organization.name,
        siteName: row.organization.siteName,
        avatarUrl: row.organization.avatarUrl,
        theme: row.organization.theme
      },
      courseMembers: membersResult
        .filter((m) => m.profile?.email) // Only include members with email
        .map((m) => ({
          email: m.profile?.email || null,
          fullname: m.profile?.fullname || null
        }))
    };
  } catch (error) {
    console.error('getNewsfeedForEmail error:', error);
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
             WHERE ${eq(schema.courseNewsfeedComment.courseNewsfeedId, schema.courseNewsfeed.id)}
             AND ${isNull(schema.courseNewsfeedComment.parentId)}),
            0
          )
        `.as('commentCount');
}
