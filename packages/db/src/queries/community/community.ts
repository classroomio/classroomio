import {
  communityAnswer,
  communityQuestion,
  course,
  db,
  desc,
  eq,
  inArray,
  organization,
  profile,
  sql
} from '@db/drizzle';
import { TCommunityAnswer, TCommunityQuestion, TNewCommunityQuestion } from '@db/types';

export async function getCommunityQuestions(courseIdsFilter: string[]) {
  const commentsCount = sql<number>`COUNT(${communityAnswer.id})`;

  return db
    .select({
      organizationId: communityQuestion.organizationId,
      courseId: communityQuestion.courseId,
      title: communityQuestion.title,
      votes: communityQuestion.votes,
      createdAt: communityQuestion.createdAt,
      slug: communityQuestion.slug,
      comments: commentsCount,
      authorFullname: profile.fullname,
      courseTitle: course.title
    })
    .from(communityQuestion)
    .innerJoin(course, eq(communityQuestion.courseId, course.id))
    .leftJoin(communityAnswer, eq(communityAnswer.questionId, communityQuestion.id))
    .leftJoin(profile, eq(profile.id, communityQuestion.authorProfileId))
    .where(inArray(communityQuestion.courseId, courseIdsFilter))
    .groupBy(
      communityQuestion.organizationId,
      communityQuestion.courseId,
      communityQuestion.title,
      communityQuestion.votes,
      communityQuestion.createdAt,
      communityQuestion.slug,
      profile.fullname,
      course.title
    )
    .orderBy(desc(communityQuestion.createdAt));
}

export async function getCommunityQuestion(slug: string) {
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
      organizationId: communityQuestion.organizationId
    })
    .from(communityQuestion)
    .innerJoin(course, eq(course.id, communityQuestion.courseId))
    .leftJoin(profile, eq(profile.id, communityQuestion.authorProfileId))
    .where(eq(communityQuestion.slug, slug))
    .limit(1);

  if (questionRows.length === 0) return null;

  const q = questionRows[0];

  const commentsRows = await db
    .select({
      id: communityAnswer.id,
      body: communityAnswer.body,
      votes: communityAnswer.votes,
      createdAt: communityAnswer.createdAt,

      authorId: profile.id,
      authorName: profile.fullname,
      authorAvatar: profile.avatarUrl
    })
    .from(communityAnswer)
    .leftJoin(profile, eq(profile.id, communityAnswer.authorProfileId))
    .where(eq(communityAnswer.questionId, q.id))
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

export async function upvoteQuestion({ id, votes }: Partial<TCommunityQuestion>) {
  if (!id) throw new Error('Question ID is required for upvoting');

  await db.update(communityQuestion).set({ votes }).where(eq(communityQuestion.id, id));
}

export async function upvoteAnswer({ id, votes }: Partial<TCommunityAnswer>) {
  if (!id) throw new Error('Answer ID is required for upvoting');

  await db.update(communityAnswer).set({ votes }).where(eq(communityAnswer.id, id));
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
