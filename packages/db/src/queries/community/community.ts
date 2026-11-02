import { TCommunityAnswer, TCommunityQuestion, TNewCommunityQuestion } from '@db/types';
import {
  and,
  communityAnswer,
  communityQuestion,
  communityQuestionSubscription,
  course,
  db,
  desc,
  eq,
  inArray,
  profile,
  sql,
  type DbOrTxClient
} from '@db/drizzle';

export type CommunityViewer = {
  profileId: string;
  /** Staff see hidden questions and answers; everyone else never does. */
  includeHidden: boolean;
};

export type CommunityQuestionQueryResult = {
  id: TCommunityQuestion['id'];
  authorId: TCommunityQuestion['authorProfileId'];
  organizationId: TCommunityQuestion['organizationId'];
  courseId: TCommunityQuestion['courseId'];
  title: TCommunityQuestion['title'];
  votes: TCommunityQuestion['votes'];
  createdAt: TCommunityQuestion['createdAt'];
  slug: TCommunityQuestion['slug'];
  comments: number;
  authorFullname: string | null;
  courseTitle: string | null;
  isHidden: boolean;
  acceptedAnswerId: string | null;
  isFollowing: boolean;
  lastActivityAt: string;
};

export type CommunityForYouQueryResult = CommunityQuestionQueryResult & {
  hasUnread: boolean;
};

function visibleAnswerFilter(viewer: CommunityViewer) {
  return viewer.includeHidden ? undefined : eq(communityAnswer.isHidden, false);
}

function questionSummaryColumns(viewer: CommunityViewer) {
  const hiddenAnswerSql = viewer.includeHidden ? sql`true` : sql`a.is_hidden = false`;

  return {
    id: communityQuestion.id,
    authorId: communityQuestion.authorProfileId,
    organizationId: communityQuestion.organizationId,
    courseId: communityQuestion.courseId,
    title: communityQuestion.title,
    votes: communityQuestion.votes,
    createdAt: communityQuestion.createdAt,
    slug: communityQuestion.slug,
    comments: sql<number>`COUNT(${communityAnswer.id})::int`,
    authorFullname: profile.fullname,
    courseTitle: course.title,
    isHidden: communityQuestion.isHidden,
    acceptedAnswerId: sql<string | null>`(
      SELECT a.id FROM ${communityAnswer} AS a
      WHERE a.id = ${communityQuestion.acceptedAnswerId} AND ${hiddenAnswerSql}
    )`,
    isFollowing: sql<boolean>`EXISTS (
      SELECT 1 FROM ${communityQuestionSubscription} AS s
      WHERE s.question_id = ${communityQuestion.id} AND s.profile_id = ${viewer.profileId} AND s.is_following = true
    )`,
    lastActivityAt: sql<string>`GREATEST(${communityQuestion.createdAt}, MAX(${communityAnswer.createdAt}))`
  };
}

function scopeCondition(options: { courseIds: string[] } | { orgId: string }) {
  return 'courseIds' in options
    ? inArray(communityQuestion.courseId, options.courseIds)
    : eq(communityQuestion.organizationId, options.orgId);
}

function toQuestionSummary<T extends { comments: number; isFollowing: boolean; lastActivityAt: string }>(row: T) {
  return {
    ...row,
    comments: Number(row.comments),
    isFollowing: Boolean(row.isFollowing),
    lastActivityAt: new Date(row.lastActivityAt).toISOString()
  };
}

export async function getCommunityQuestions(
  options: { courseIds: string[] } | { orgId: string },
  viewer: CommunityViewer
): Promise<CommunityQuestionQueryResult[]> {
  try {
    const rows = await db
      .select(questionSummaryColumns(viewer))
      .from(communityQuestion)
      .innerJoin(course, eq(communityQuestion.courseId, course.id))
      .leftJoin(communityAnswer, and(eq(communityAnswer.questionId, communityQuestion.id), visibleAnswerFilter(viewer)))
      .leftJoin(profile, eq(profile.id, communityQuestion.authorProfileId))
      .where(and(scopeCondition(options), viewer.includeHidden ? undefined : eq(communityQuestion.isHidden, false)))
      .groupBy(communityQuestion.id, profile.fullname, course.title)
      .orderBy(desc(communityQuestion.createdAt));

    return rows.map(toQuestionSummary);
  } catch (error) {
    console.error('getCommunityQuestions error:', error);
    throw new Error('Failed to get community questions');
  }
}

/**
 * Questions in scope the viewer asked, answered or follows, most recent activity first. `hasUnread` marks questions
 * with an answer from someone else posted after the viewer last opened the question.
 */
export async function getCommunityQuestionsForYou(
  options: { courseIds: string[] } | { orgId: string },
  viewer: CommunityViewer
): Promise<CommunityForYouQueryResult[]> {
  try {
    const hiddenAnswerSql = viewer.includeHidden ? sql`true` : sql`a.is_hidden = false`;
    const hasUnread = sql<boolean>`EXISTS (
      SELECT 1 FROM ${communityAnswer} AS a
      WHERE a.question_id = ${communityQuestion.id}
        AND a.author_profile_id IS DISTINCT FROM ${viewer.profileId}
        AND ${hiddenAnswerSql}
        AND a.created_at > COALESCE((
          SELECT s.last_read_at FROM ${communityQuestionSubscription} AS s
          WHERE s.question_id = ${communityQuestion.id} AND s.profile_id = ${viewer.profileId}
        ), '-infinity'::timestamptz)
    )`;
    const isParticipant = sql`(
      ${communityQuestion.authorProfileId} = ${viewer.profileId}
      OR EXISTS (
        SELECT 1 FROM ${communityAnswer} AS mine
        WHERE mine.question_id = ${communityQuestion.id} AND mine.author_profile_id = ${viewer.profileId}
      )
      OR EXISTS (
        SELECT 1 FROM ${communityQuestionSubscription} AS s
        WHERE s.question_id = ${communityQuestion.id} AND s.profile_id = ${viewer.profileId} AND s.is_following = true
      )
    )`;

    const rows = await db
      .select({ ...questionSummaryColumns(viewer), hasUnread })
      .from(communityQuestion)
      .innerJoin(course, eq(communityQuestion.courseId, course.id))
      .leftJoin(communityAnswer, and(eq(communityAnswer.questionId, communityQuestion.id), visibleAnswerFilter(viewer)))
      .leftJoin(profile, eq(profile.id, communityQuestion.authorProfileId))
      .where(
        and(
          scopeCondition(options),
          viewer.includeHidden ? undefined : eq(communityQuestion.isHidden, false),
          isParticipant
        )
      )
      .groupBy(communityQuestion.id, profile.fullname, course.title)
      .orderBy(desc(sql`GREATEST(${communityQuestion.createdAt}, MAX(${communityAnswer.createdAt}))`));

    return rows.map((row) => ({ ...toQuestionSummary(row), hasUnread: Boolean(row.hasUnread) }));
  } catch (error) {
    console.error('getCommunityQuestionsForYou error:', error);
    throw new Error('Failed to get community questions for you');
  }
}

export async function getCommunityQuestionMetaBySlug(slug: string) {
  try {
    const [row] = await db
      .select({
        id: communityQuestion.id,
        courseId: communityQuestion.courseId,
        organizationId: communityQuestion.organizationId,
        isHidden: communityQuestion.isHidden
      })
      .from(communityQuestion)
      .where(eq(communityQuestion.slug, slug))
      .limit(1);

    return row ?? null;
  } catch (error) {
    console.error('getCommunityQuestionMetaBySlug error:', error);
    throw new Error('Failed to get community question');
  }
}

export async function getCommunityQuestion(slug: string, viewer: CommunityViewer) {
  const hiddenAnswerSql = viewer.includeHidden ? sql`true` : sql`a.is_hidden = false`;
  const questionRows = await db
    .select({
      id: communityQuestion.id,
      title: communityQuestion.title,
      body: communityQuestion.body,
      votes: communityQuestion.votes,
      createdAt: communityQuestion.createdAt,
      courseId: communityQuestion.courseId,
      slug: communityQuestion.slug,
      authorId: profile.id,
      authorName: profile.fullname,
      authorAvatar: profile.avatarUrl,
      courseTitle: course.title,
      organizationId: communityQuestion.organizationId,
      isHidden: communityQuestion.isHidden,
      acceptedAnswerId: sql<string | null>`(
        SELECT a.id FROM ${communityAnswer} AS a
        WHERE a.id = ${communityQuestion.acceptedAnswerId} AND ${hiddenAnswerSql}
      )`,
      isFollowing: sql<boolean>`EXISTS (
        SELECT 1 FROM ${communityQuestionSubscription} AS s
        WHERE s.question_id = ${communityQuestion.id} AND s.profile_id = ${viewer.profileId} AND s.is_following = true
      )`
    })
    .from(communityQuestion)
    .innerJoin(course, eq(course.id, communityQuestion.courseId))
    .leftJoin(profile, eq(profile.id, communityQuestion.authorProfileId))
    .where(
      and(eq(communityQuestion.slug, slug), viewer.includeHidden ? undefined : eq(communityQuestion.isHidden, false))
    )
    .limit(1);

  if (questionRows.length === 0) return null;

  const q = questionRows[0];

  const commentsRows = await db
    .select({
      id: communityAnswer.id,
      body: communityAnswer.body,
      votes: communityAnswer.votes,
      createdAt: communityAnswer.createdAt,
      isHidden: communityAnswer.isHidden,

      authorId: profile.id,
      authorName: profile.fullname,
      authorAvatar: profile.avatarUrl
    })
    .from(communityAnswer)
    .leftJoin(profile, eq(profile.id, communityAnswer.authorProfileId))
    .where(and(eq(communityAnswer.questionId, q.id), visibleAnswerFilter(viewer)))
    .orderBy(communityAnswer.createdAt);

  return {
    id: q.id,
    title: q.title,
    body: q.body,
    votes: q.votes,
    createdAt: q.createdAt,
    courseId: q.courseId,
    slug: q.slug,
    organizationId: q.organizationId,
    isHidden: q.isHidden,
    acceptedAnswerId: q.acceptedAnswerId,
    isFollowing: Boolean(q.isFollowing),

    author: {
      id: q.authorId,
      fullname: q.authorName,
      avatarUrl: q.authorAvatar
    },

    course: {
      title: q.courseTitle
    },

    comments: commentsRows.map((c) => ({
      id: c.id,
      body: c.body,
      votes: c.votes,
      createdAt: c.createdAt,
      isHidden: c.isHidden,
      author: {
        id: c.authorId,
        fullname: c.authorName,
        avatarUrl: c.authorAvatar
      }
    }))
  };
}

export async function submitComment({
  body,
  questionId,
  authorProfileId,
  votes
}: {
  body: string;
  questionId: number;
  authorProfileId: string;
  votes: number;
}) {
  const response = await db
    .insert(communityAnswer)
    .values({
      body,
      questionId,
      authorProfileId,
      votes
    })
    .returning();

  return response[0];
}

export async function upvoteQuestion({ id }: Partial<TCommunityQuestion>) {
  if (!id) throw new Error('Question ID is required for upvoting');

  const result = await db
    .update(communityQuestion)
    .set({ votes: sql`${communityQuestion.votes} + 1` })
    .where(eq(communityQuestion.id, id))
    .returning({ votes: communityQuestion.votes });

  return result[0];
}

export async function upvoteAnswer({ id }: Partial<TCommunityAnswer>) {
  if (!id) throw new Error('Answer ID is required for upvoting');

  const result = await db
    .update(communityAnswer)
    .set({ votes: sql`${communityAnswer.votes} + 1` })
    .where(eq(communityAnswer.id, id))
    .returning({ votes: communityAnswer.votes });

  return result[0];
}

export async function editCommunityQuestion({ id, title, body, courseId }: TNewCommunityQuestion) {
  if (!id) throw new Error('Question ID is required for editing');

  await db.update(communityQuestion).set({ title, body, courseId }).where(eq(communityQuestion.id, id));
}

export async function deleteCommentById(id: string) {
  await db.delete(communityAnswer).where(eq(communityAnswer.id, id));
}

export async function deleteCommentByQuestionId(questionId: number) {
  await db.delete(communityAnswer).where(eq(communityAnswer.questionId, questionId));
}

export async function deleteQuestionByQuestionId(questionId: number) {
  await db.delete(communityQuestion).where(eq(communityQuestion.id, questionId));
}

export async function createCommunityQuestion({
  title,
  body,
  organizationId,
  authorProfileId,
  slug,
  courseId
}: TNewCommunityQuestion) {
  const result = await db
    .insert(communityQuestion)
    .values({
      title,
      body,
      organizationId,
      authorProfileId,
      votes: 0,
      slug,
      courseId
    })
    .returning();

  return result[0];
}

/**
 * Gets question author and course information for authorization checks
 * @param questionId Question ID
 * @returns Question with author ID and course ID, or null if not found
 */
export async function getQuestionAuthorAndCourse(questionId: number | string) {
  const result = await db
    .select({
      id: communityQuestion.id,
      authorId: communityQuestion.authorProfileId,
      courseId: communityQuestion.courseId,
      organizationId: communityQuestion.organizationId,
      isHidden: communityQuestion.isHidden
    })
    .from(communityQuestion)
    .where(eq(communityQuestion.id, Number(questionId)))
    .limit(1);

  return result.length > 0 ? result[0] : null;
}

/**
 * Gets comment author and course information for authorization checks
 * @param commentId Comment ID
 * @returns Comment with author ID, question ID, and course ID, or null if not found
 */
export async function getCommentAuthorAndCourse(commentId: string) {
  const result = await db
    .select({
      id: communityAnswer.id,
      authorId: communityAnswer.authorProfileId,
      questionId: communityAnswer.questionId,
      courseId: communityQuestion.courseId,
      organizationId: communityQuestion.organizationId,
      isHidden: communityAnswer.isHidden,
      questionIsHidden: communityQuestion.isHidden
    })
    .from(communityAnswer)
    .innerJoin(communityQuestion, eq(communityAnswer.questionId, communityQuestion.id))
    .where(eq(communityAnswer.id, commentId))
    .limit(1);

  return result.length > 0 ? result[0] : null;
}

export async function setCommunityQuestionHidden(questionId: number, isHidden: boolean): Promise<boolean> {
  try {
    const rows = await db
      .update(communityQuestion)
      .set({ isHidden })
      .where(eq(communityQuestion.id, questionId))
      .returning({ id: communityQuestion.id });

    return rows.length > 0;
  } catch (error) {
    console.error('setCommunityQuestionHidden error:', error);
    throw new Error('Failed to update question visibility');
  }
}

export async function setCommunityAnswerHidden(answerId: string, isHidden: boolean): Promise<boolean> {
  try {
    const rows = await db
      .update(communityAnswer)
      .set({ isHidden })
      .where(eq(communityAnswer.id, answerId))
      .returning({ id: communityAnswer.id });

    return rows.length > 0;
  } catch (error) {
    console.error('setCommunityAnswerHidden error:', error);
    throw new Error('Failed to update answer visibility');
  }
}

export async function setCommunityAcceptedAnswer(questionId: number, answerId: string | null): Promise<boolean> {
  try {
    const rows = await db
      .update(communityQuestion)
      .set({ acceptedAnswerId: answerId })
      .where(eq(communityQuestion.id, questionId))
      .returning({ id: communityQuestion.id });

    return rows.length > 0;
  } catch (error) {
    console.error('setCommunityAcceptedAnswer error:', error);
    throw new Error('Failed to update accepted answer');
  }
}

/**
 * Creates or updates the profile's subscription to a question. `isFollowing` is changed only when given;
 * `markRead` stamps `lastReadAt` with the current time.
 */
export async function upsertCommunityQuestionSubscription(
  values: { questionId: number; profileId: string; isFollowing?: boolean; markRead?: boolean },
  dbClient: DbOrTxClient = db
): Promise<void> {
  const readAt = values.markRead ? sql`now()` : undefined;

  try {
    await dbClient
      .insert(communityQuestionSubscription)
      .values({
        questionId: values.questionId,
        profileId: values.profileId,
        isFollowing: values.isFollowing ?? false,
        lastReadAt: readAt
      })
      .onConflictDoUpdate({
        target: [communityQuestionSubscription.questionId, communityQuestionSubscription.profileId],
        set: {
          ...(values.isFollowing !== undefined ? { isFollowing: values.isFollowing } : {}),
          ...(readAt ? { lastReadAt: readAt } : {}),
          updatedAt: sql`now()`
        }
      });
  } catch (error) {
    console.error('upsertCommunityQuestionSubscription error:', error);
    throw new Error('Failed to update question subscription');
  }
}

/** Followers of a question, plus its author when the author has never followed or unfollowed it. */
export async function listCommunityQuestionRecipientIds(questionId: number): Promise<string[]> {
  try {
    const rows = await db.execute<{ profile_id: string }>(sql`
      SELECT s.profile_id FROM ${communityQuestionSubscription} AS s
      WHERE s.question_id = ${questionId} AND s.is_following = true
      UNION
      SELECT q.author_profile_id FROM ${communityQuestion} AS q
      WHERE q.id = ${questionId}
        AND q.author_profile_id IS NOT NULL
        AND NOT EXISTS (
          SELECT 1 FROM ${communityQuestionSubscription} AS own
          WHERE own.question_id = q.id AND own.profile_id = q.author_profile_id
        )
    `);

    return rows.map((row) => row.profile_id);
  } catch (error) {
    console.error('listCommunityQuestionRecipientIds error:', error);
    throw new Error('Failed to list question followers');
  }
}
