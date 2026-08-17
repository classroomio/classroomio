import * as schema from '@db/schema';

import type { TContentReportSnapshot, TContentReportTargetType } from '@cio/utils/validation/report';
import { and, db, eq } from '@db/drizzle';

export type ResolvedReportTarget = {
  targetType: TContentReportTargetType;
  targetId: string;
  organizationId: string;
  authorProfileId: string | null;
  snapshot: TContentReportSnapshot;
};

function parseNumericId(value: string): number | null {
  if (!/^\d+$/.test(value)) {
    return null;
  }

  const parsed = Number(value);

  return Number.isSafeInteger(parsed) ? parsed : null;
}

function toPlainText(value: string | null | undefined, maxLength = 2000): string {
  if (!value) {
    return '';
  }

  const stripped = value
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/\s+/g, ' ')
    .trim();

  return stripped.slice(0, maxLength);
}

function buildSnapshot(input: {
  text: string | null | undefined;
  title?: string | null;
  authorId: string | null;
  authorName: string | null;
  surface: string;
  url?: string | null;
}): TContentReportSnapshot {
  return {
    text: toPlainText(input.text),
    title: input.title ?? null,
    authorId: input.authorId,
    authorName: input.authorName,
    surface: input.surface,
    url: input.url ?? null,
    capturedAt: new Date().toISOString()
  };
}

async function resolveCourseNewsfeedPost(targetId: string): Promise<ResolvedReportTarget | null> {
  const [row] = await db
    .select({
      id: schema.courseNewsfeed.id,
      content: schema.courseNewsfeed.content,
      courseId: schema.courseNewsfeed.courseId,
      organizationId: schema.group.organizationId,
      authorProfileId: schema.profile.id,
      authorName: schema.profile.fullname
    })
    .from(schema.courseNewsfeed)
    .innerJoin(schema.course, eq(schema.courseNewsfeed.courseId, schema.course.id))
    .innerJoin(schema.group, eq(schema.course.groupId, schema.group.id))
    .leftJoin(schema.groupmember, eq(schema.courseNewsfeed.authorId, schema.groupmember.id))
    .leftJoin(schema.profile, eq(schema.groupmember.profileId, schema.profile.id))
    .where(eq(schema.courseNewsfeed.id, targetId))
    .limit(1);

  if (!row?.organizationId) {
    return null;
  }

  return {
    targetType: 'course_newsfeed_post',
    targetId,
    organizationId: row.organizationId,
    authorProfileId: row.authorProfileId ?? null,
    snapshot: buildSnapshot({
      text: row.content,
      authorId: row.authorProfileId ?? null,
      authorName: row.authorName ?? null,
      surface: 'course_newsfeed',
      url: `/courses/${row.courseId}/newsfeed`
    })
  };
}

async function resolveCourseNewsfeedComment(targetId: string): Promise<ResolvedReportTarget | null> {
  const commentId = parseNumericId(targetId);

  if (commentId === null) {
    return null;
  }

  const [row] = await db
    .select({
      id: schema.courseNewsfeedComment.id,
      content: schema.courseNewsfeedComment.content,
      courseId: schema.courseNewsfeed.courseId,
      organizationId: schema.group.organizationId,
      authorProfileId: schema.profile.id,
      authorName: schema.profile.fullname
    })
    .from(schema.courseNewsfeedComment)
    .innerJoin(schema.courseNewsfeed, eq(schema.courseNewsfeedComment.courseNewsfeedId, schema.courseNewsfeed.id))
    .innerJoin(schema.course, eq(schema.courseNewsfeed.courseId, schema.course.id))
    .innerJoin(schema.group, eq(schema.course.groupId, schema.group.id))
    .leftJoin(schema.groupmember, eq(schema.courseNewsfeedComment.authorId, schema.groupmember.id))
    .leftJoin(schema.profile, eq(schema.groupmember.profileId, schema.profile.id))
    .where(eq(schema.courseNewsfeedComment.id, commentId))
    .limit(1);

  if (!row?.organizationId) {
    return null;
  }

  return {
    targetType: 'course_newsfeed_comment',
    targetId,
    organizationId: row.organizationId,
    authorProfileId: row.authorProfileId ?? null,
    snapshot: buildSnapshot({
      text: row.content,
      authorId: row.authorProfileId ?? null,
      authorName: row.authorName ?? null,
      surface: 'course_newsfeed_comment',
      url: `/courses/${row.courseId}/newsfeed`
    })
  };
}

async function resolveCohortNewsfeedPost(targetId: string): Promise<ResolvedReportTarget | null> {
  const [row] = await db
    .select({
      id: schema.cohortNewsfeed.id,
      content: schema.cohortNewsfeed.content,
      cohortId: schema.cohortNewsfeed.cohortId,
      organizationId: schema.cohort.organizationId,
      authorProfileId: schema.profile.id,
      authorName: schema.profile.fullname
    })
    .from(schema.cohortNewsfeed)
    .innerJoin(schema.cohort, eq(schema.cohortNewsfeed.cohortId, schema.cohort.id))
    .leftJoin(schema.cohortMember, eq(schema.cohortNewsfeed.authorId, schema.cohortMember.id))
    .leftJoin(schema.profile, eq(schema.cohortMember.profileId, schema.profile.id))
    .where(eq(schema.cohortNewsfeed.id, targetId))
    .limit(1);

  if (!row?.organizationId) {
    return null;
  }

  return {
    targetType: 'cohort_newsfeed_post',
    targetId,
    organizationId: row.organizationId,
    authorProfileId: row.authorProfileId ?? null,
    snapshot: buildSnapshot({
      text: row.content,
      authorId: row.authorProfileId ?? null,
      authorName: row.authorName ?? null,
      surface: 'cohort_newsfeed',
      url: row.cohortId ? `/cohorts/${row.cohortId}/newsfeed` : null
    })
  };
}

async function resolveCohortNewsfeedComment(targetId: string): Promise<ResolvedReportTarget | null> {
  const commentId = parseNumericId(targetId);

  if (commentId === null) {
    return null;
  }

  const [row] = await db
    .select({
      id: schema.cohortNewsfeedComment.id,
      content: schema.cohortNewsfeedComment.content,
      cohortId: schema.cohortNewsfeed.cohortId,
      organizationId: schema.cohort.organizationId,
      authorProfileId: schema.profile.id,
      authorName: schema.profile.fullname
    })
    .from(schema.cohortNewsfeedComment)
    .innerJoin(schema.cohortNewsfeed, eq(schema.cohortNewsfeedComment.cohortNewsfeedId, schema.cohortNewsfeed.id))
    .innerJoin(schema.cohort, eq(schema.cohortNewsfeed.cohortId, schema.cohort.id))
    .leftJoin(schema.cohortMember, eq(schema.cohortNewsfeedComment.authorId, schema.cohortMember.id))
    .leftJoin(schema.profile, eq(schema.cohortMember.profileId, schema.profile.id))
    .where(eq(schema.cohortNewsfeedComment.id, commentId))
    .limit(1);

  if (!row?.organizationId) {
    return null;
  }

  return {
    targetType: 'cohort_newsfeed_comment',
    targetId,
    organizationId: row.organizationId,
    authorProfileId: row.authorProfileId ?? null,
    snapshot: buildSnapshot({
      text: row.content,
      authorId: row.authorProfileId ?? null,
      authorName: row.authorName ?? null,
      surface: 'cohort_newsfeed_comment',
      url: row.cohortId ? `/cohorts/${row.cohortId}/newsfeed` : null
    })
  };
}

async function resolveCommunityQuestion(targetId: string): Promise<ResolvedReportTarget | null> {
  const questionId = parseNumericId(targetId);

  if (questionId === null) {
    return null;
  }

  const [row] = await db
    .select({
      id: schema.communityQuestion.id,
      title: schema.communityQuestion.title,
      body: schema.communityQuestion.body,
      slug: schema.communityQuestion.slug,
      organizationId: schema.communityQuestion.organizationId,
      authorProfileId: schema.communityQuestion.authorProfileId,
      authorName: schema.profile.fullname
    })
    .from(schema.communityQuestion)
    .leftJoin(schema.profile, eq(schema.communityQuestion.authorProfileId, schema.profile.id))
    .where(eq(schema.communityQuestion.id, questionId))
    .limit(1);

  if (!row?.organizationId) {
    return null;
  }

  return {
    targetType: 'community_question',
    targetId,
    organizationId: row.organizationId,
    authorProfileId: row.authorProfileId ?? null,
    snapshot: buildSnapshot({
      text: row.body,
      title: row.title,
      authorId: row.authorProfileId ?? null,
      authorName: row.authorName ?? null,
      surface: 'community_question',
      url: row.slug ? `/community/${row.slug}` : null
    })
  };
}

async function resolveCommunityAnswer(targetId: string): Promise<ResolvedReportTarget | null> {
  const [row] = await db
    .select({
      id: schema.communityAnswer.id,
      body: schema.communityAnswer.body,
      slug: schema.communityQuestion.slug,
      organizationId: schema.communityQuestion.organizationId,
      authorProfileId: schema.communityAnswer.authorProfileId,
      authorName: schema.profile.fullname
    })
    .from(schema.communityAnswer)
    .innerJoin(schema.communityQuestion, eq(schema.communityAnswer.questionId, schema.communityQuestion.id))
    .leftJoin(schema.profile, eq(schema.communityAnswer.authorProfileId, schema.profile.id))
    .where(eq(schema.communityAnswer.id, targetId))
    .limit(1);

  if (!row?.organizationId) {
    return null;
  }

  return {
    targetType: 'community_answer',
    targetId,
    organizationId: row.organizationId,
    authorProfileId: row.authorProfileId ?? null,
    snapshot: buildSnapshot({
      text: row.body,
      authorId: row.authorProfileId ?? null,
      authorName: row.authorName ?? null,
      surface: 'community_answer',
      url: row.slug ? `/community/${row.slug}` : null
    })
  };
}

async function resolveLessonComment(targetId: string): Promise<ResolvedReportTarget | null> {
  const commentId = parseNumericId(targetId);

  if (commentId === null) {
    return null;
  }

  const [row] = await db
    .select({
      id: schema.lessonComment.id,
      comment: schema.lessonComment.comment,
      lessonId: schema.lessonComment.lessonId,
      courseId: schema.lesson.courseId,
      organizationId: schema.group.organizationId,
      authorProfileId: schema.profile.id,
      authorName: schema.profile.fullname
    })
    .from(schema.lessonComment)
    .innerJoin(schema.lesson, eq(schema.lessonComment.lessonId, schema.lesson.id))
    .innerJoin(schema.course, eq(schema.lesson.courseId, schema.course.id))
    .innerJoin(schema.group, eq(schema.course.groupId, schema.group.id))
    .leftJoin(schema.groupmember, eq(schema.lessonComment.groupmemberId, schema.groupmember.id))
    .leftJoin(schema.profile, eq(schema.groupmember.profileId, schema.profile.id))
    .where(eq(schema.lessonComment.id, commentId))
    .limit(1);

  if (!row?.organizationId) {
    return null;
  }

  return {
    targetType: 'lesson_comment',
    targetId,
    organizationId: row.organizationId,
    authorProfileId: row.authorProfileId ?? null,
    snapshot: buildSnapshot({
      text: row.comment,
      authorId: row.authorProfileId ?? null,
      authorName: row.authorName ?? null,
      surface: 'lesson_comment',
      url: row.courseId && row.lessonId ? `/courses/${row.courseId}/lessons/${row.lessonId}` : null
    })
  };
}

async function resolveProfile(orgId: string, targetId: string): Promise<ResolvedReportTarget | null> {
  const [row] = await db
    .select({
      id: schema.profile.id,
      fullname: schema.profile.fullname,
      username: schema.profile.username,
      memberId: schema.organizationmember.id
    })
    .from(schema.profile)
    .innerJoin(
      schema.organizationmember,
      and(
        eq(schema.organizationmember.profileId, schema.profile.id),
        eq(schema.organizationmember.organizationId, orgId)
      )
    )
    .where(eq(schema.profile.id, targetId))
    .limit(1);

  if (!row) {
    return null;
  }

  return {
    targetType: 'profile',
    targetId,
    organizationId: orgId,
    authorProfileId: row.id,
    snapshot: buildSnapshot({
      text: row.username,
      title: row.fullname,
      authorId: row.id,
      authorName: row.fullname,
      surface: 'profile'
    })
  };
}

export async function resolveReportTarget(
  orgId: string,
  targetType: TContentReportTargetType,
  targetId: string
): Promise<ResolvedReportTarget | null> {
  try {
    switch (targetType) {
      case 'course_newsfeed_post':
        return resolveCourseNewsfeedPost(targetId);
      case 'course_newsfeed_comment':
        return resolveCourseNewsfeedComment(targetId);
      case 'cohort_newsfeed_post':
        return resolveCohortNewsfeedPost(targetId);
      case 'cohort_newsfeed_comment':
        return resolveCohortNewsfeedComment(targetId);
      case 'community_question':
        return resolveCommunityQuestion(targetId);
      case 'community_answer':
        return resolveCommunityAnswer(targetId);
      case 'lesson_comment':
        return resolveLessonComment(targetId);
      case 'profile':
        return resolveProfile(orgId, targetId);
      default:
        return null;
    }
  } catch (error) {
    console.error('resolveReportTarget error:', error);
    throw new Error(
      `Failed to resolve report target "${targetType}:${targetId}": ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}
