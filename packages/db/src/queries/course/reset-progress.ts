import * as schema from '@db/schema';

import { and, count, eq, inArray, sql } from '@db/drizzle';
import type { DbOrTxClient } from '@db/drizzle';
import { db } from '@db/drizzle';

export type StudentCourseProgressImpactCounts = {
  completedLessons: number;
  totalLessons: number;
  exerciseSubmissions: number;
  lessonComments: number;
  courseNewsfeedActivity: number;
  videoProgressLessons: number;
  attendanceEntries: number;
  hasCertificationRecords: boolean;
};

export type ResetStudentCourseProgressSummary = {
  lessonCompletion: number;
  lessonVideoProgress: number;
  submissions: number;
  groupAttendance: number;
  lessonComments: number;
  courseNewsfeed: number;
  courseNewsfeedComments: number;
  courseCertificateIssues: number;
  courseCompletionRecords: number;
  aiChatConversations: number;
};

async function getCourseLessonIds(tx: DbOrTxClient, courseId: string): Promise<string[]> {
  const lessons = await tx
    .select({ id: schema.lesson.id })
    .from(schema.lesson)
    .where(eq(schema.lesson.courseId, courseId));

  return lessons.map((lesson) => lesson.id);
}

async function getCourseNewsfeedIds(tx: DbOrTxClient, courseId: string): Promise<string[]> {
  const newsfeeds = await tx
    .select({ id: schema.courseNewsfeed.id })
    .from(schema.courseNewsfeed)
    .where(eq(schema.courseNewsfeed.courseId, courseId));

  return newsfeeds.map((newsfeed) => newsfeed.id);
}

async function getStudentCourseNewsfeedPostIds(
  tx: DbOrTxClient,
  courseId: string,
  groupMemberId: string
): Promise<string[]> {
  const posts = await tx
    .select({ id: schema.courseNewsfeed.id })
    .from(schema.courseNewsfeed)
    .where(and(eq(schema.courseNewsfeed.courseId, courseId), eq(schema.courseNewsfeed.authorId, groupMemberId)));

  return posts.map((post) => post.id);
}

/**
 * Returns counts of progress-like data that would be removed by a course reset.
 */
export async function getStudentCourseProgressImpactCounts(input: {
  courseId: string;
  groupMemberId: string;
  profileId: string;
}): Promise<StudentCourseProgressImpactCounts> {
  const { courseId, groupMemberId, profileId } = input;

  try {
    const lessonIds = await getCourseLessonIds(db, courseId);
    const newsfeedIds = await getCourseNewsfeedIds(db, courseId);
    const studentNewsfeedPostIds = await getStudentCourseNewsfeedPostIds(db, courseId, groupMemberId);

    const lessonScope =
      lessonIds.length > 0
        ? and(eq(schema.lessonCompletion.profileId, profileId), inArray(schema.lessonCompletion.lessonId, lessonIds))
        : sql`false`;

    const [completedLessonsResult, totalLessonsResult] = await Promise.all([
      db
        .select({ total: count() })
        .from(schema.lessonCompletion)
        .where(and(lessonScope, eq(schema.lessonCompletion.isComplete, true))),
      db.select({ total: count() }).from(schema.lesson).where(eq(schema.lesson.courseId, courseId))
    ]);

    const [exerciseSubmissionsResult, lessonCommentsResult, newsfeedPostsResult, newsfeedCommentsResult] =
      await Promise.all([
        db
          .select({ total: count() })
          .from(schema.submission)
          .where(and(eq(schema.submission.courseId, courseId), eq(schema.submission.submittedBy, groupMemberId))),
        lessonIds.length > 0
          ? db
              .select({ total: count() })
              .from(schema.lessonComment)
              .where(
                and(
                  eq(schema.lessonComment.groupmemberId, groupMemberId),
                  inArray(schema.lessonComment.lessonId, lessonIds)
                )
              )
          : Promise.resolve([{ total: 0 }]),
        db
          .select({ total: count() })
          .from(schema.courseNewsfeed)
          .where(and(eq(schema.courseNewsfeed.courseId, courseId), eq(schema.courseNewsfeed.authorId, groupMemberId))),
        newsfeedIds.length > 0
          ? db
              .select({ total: count() })
              .from(schema.courseNewsfeedComment)
              .where(
                and(
                  eq(schema.courseNewsfeedComment.authorId, groupMemberId),
                  inArray(schema.courseNewsfeedComment.courseNewsfeedId, newsfeedIds)
                )
              )
          : Promise.resolve([{ total: 0 }])
      ]);

    const [commentsOnStudentPostsResult, videoProgressResult, attendanceResult, certificationResult] =
      await Promise.all([
        studentNewsfeedPostIds.length > 0
          ? db
              .select({ total: count() })
              .from(schema.courseNewsfeedComment)
              .where(inArray(schema.courseNewsfeedComment.courseNewsfeedId, studentNewsfeedPostIds))
          : Promise.resolve([{ total: 0 }]),
        lessonIds.length > 0
          ? db
              .select({
                total: sql<number>`COUNT(DISTINCT ${schema.lessonVideoProgress.lessonId})::int`.as('total')
              })
              .from(schema.lessonVideoProgress)
              .where(
                and(
                  eq(schema.lessonVideoProgress.profileId, profileId),
                  inArray(schema.lessonVideoProgress.lessonId, lessonIds)
                )
              )
          : Promise.resolve([{ total: 0 }]),
        db
          .select({ total: count() })
          .from(schema.groupAttendance)
          .where(
            and(eq(schema.groupAttendance.courseId, courseId), eq(schema.groupAttendance.studentId, groupMemberId))
          ),
        db
          .select({ total: count() })
          .from(schema.courseCompletionRecord)
          .where(
            and(
              eq(schema.courseCompletionRecord.courseId, courseId),
              eq(schema.courseCompletionRecord.profileId, profileId)
            )
          )
      ]);

    const courseNewsfeedActivity =
      (newsfeedPostsResult[0]?.total ?? 0) +
      (newsfeedCommentsResult[0]?.total ?? 0) +
      (commentsOnStudentPostsResult[0]?.total ?? 0);

    const certificateIssuesResult = await db
      .select({ total: count() })
      .from(schema.courseCertificateIssue)
      .where(
        and(
          eq(schema.courseCertificateIssue.courseId, courseId),
          eq(schema.courseCertificateIssue.profileId, profileId)
        )
      );

    const certificationCount = (certificationResult[0]?.total ?? 0) + (certificateIssuesResult[0]?.total ?? 0);

    return {
      completedLessons: completedLessonsResult[0]?.total ?? 0,
      totalLessons: totalLessonsResult[0]?.total ?? 0,
      exerciseSubmissions: exerciseSubmissionsResult[0]?.total ?? 0,
      lessonComments: lessonCommentsResult[0]?.total ?? 0,
      courseNewsfeedActivity,
      videoProgressLessons: videoProgressResult[0]?.total ?? 0,
      attendanceEntries: attendanceResult[0]?.total ?? 0,
      hasCertificationRecords: certificationCount > 0
    };
  } catch (error) {
    console.error('getStudentCourseProgressImpactCounts error:', error);
    throw new Error(
      `Failed to get student course progress impact counts: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Clears all learner progress for one student in one course inside a single transaction.
 */
export async function resetStudentCourseProgress(input: {
  courseId: string;
  groupMemberId: string;
  profileId: string;
}): Promise<ResetStudentCourseProgressSummary> {
  const { courseId, groupMemberId, profileId } = input;

  try {
    return await db.transaction(async (tx) => {
      const lessonIds = await getCourseLessonIds(tx, courseId);
      const newsfeedIds = await getCourseNewsfeedIds(tx, courseId);
      const studentNewsfeedPostIds = await getStudentCourseNewsfeedPostIds(tx, courseId, groupMemberId);

      const deletedCommentsOnStudentPosts =
        studentNewsfeedPostIds.length > 0
          ? await tx
              .delete(schema.courseNewsfeedComment)
              .where(inArray(schema.courseNewsfeedComment.courseNewsfeedId, studentNewsfeedPostIds))
              .returning({ id: schema.courseNewsfeedComment.id })
          : [];

      const deletedStudentNewsfeedComments =
        newsfeedIds.length > 0
          ? await tx
              .delete(schema.courseNewsfeedComment)
              .where(
                and(
                  eq(schema.courseNewsfeedComment.authorId, groupMemberId),
                  inArray(schema.courseNewsfeedComment.courseNewsfeedId, newsfeedIds)
                )
              )
              .returning({ id: schema.courseNewsfeedComment.id })
          : [];

      const deletedNewsfeedPosts = await tx
        .delete(schema.courseNewsfeed)
        .where(and(eq(schema.courseNewsfeed.courseId, courseId), eq(schema.courseNewsfeed.authorId, groupMemberId)))
        .returning({ id: schema.courseNewsfeed.id });

      const deletedSubmissions = await tx
        .delete(schema.submission)
        .where(and(eq(schema.submission.courseId, courseId), eq(schema.submission.submittedBy, groupMemberId)))
        .returning({ id: schema.submission.id });

      const deletedLessonCompletions =
        lessonIds.length > 0
          ? await tx
              .delete(schema.lessonCompletion)
              .where(
                and(
                  eq(schema.lessonCompletion.profileId, profileId),
                  inArray(schema.lessonCompletion.lessonId, lessonIds)
                )
              )
              .returning({ id: schema.lessonCompletion.id })
          : [];

      const deletedVideoProgress =
        lessonIds.length > 0
          ? await tx
              .delete(schema.lessonVideoProgress)
              .where(
                and(
                  eq(schema.lessonVideoProgress.profileId, profileId),
                  inArray(schema.lessonVideoProgress.lessonId, lessonIds)
                )
              )
              .returning({ id: schema.lessonVideoProgress.id })
          : [];

      const deletedAttendance = await tx
        .delete(schema.groupAttendance)
        .where(and(eq(schema.groupAttendance.courseId, courseId), eq(schema.groupAttendance.studentId, groupMemberId)))
        .returning({ id: schema.groupAttendance.id });

      const deletedLessonComments =
        lessonIds.length > 0
          ? await tx
              .delete(schema.lessonComment)
              .where(
                and(
                  eq(schema.lessonComment.groupmemberId, groupMemberId),
                  inArray(schema.lessonComment.lessonId, lessonIds)
                )
              )
              .returning({ id: schema.lessonComment.id })
          : [];

      const deletedCompletionRecords = await tx
        .delete(schema.courseCompletionRecord)
        .where(
          and(
            eq(schema.courseCompletionRecord.courseId, courseId),
            eq(schema.courseCompletionRecord.profileId, profileId)
          )
        )
        .returning({ id: schema.courseCompletionRecord.id });

      const deletedCertificateIssues = await tx
        .delete(schema.courseCertificateIssue)
        .where(
          and(
            eq(schema.courseCertificateIssue.courseId, courseId),
            eq(schema.courseCertificateIssue.profileId, profileId)
          )
        )
        .returning({ id: schema.courseCertificateIssue.id });

      const deletedAiChatConversations = await tx
        .delete(schema.aiChatConversation)
        .where(and(eq(schema.aiChatConversation.courseId, courseId), eq(schema.aiChatConversation.userId, profileId)))
        .returning({ id: schema.aiChatConversation.id });

      await tx
        .update(schema.groupmember)
        .set({
          certificateEarnedAt: null,
          certificationEmailSentAt: null
        })
        .where(eq(schema.groupmember.id, groupMemberId));

      return {
        lessonCompletion: deletedLessonCompletions.length,
        lessonVideoProgress: deletedVideoProgress.length,
        submissions: deletedSubmissions.length,
        groupAttendance: deletedAttendance.length,
        lessonComments: deletedLessonComments.length,
        courseNewsfeed: deletedNewsfeedPosts.length,
        courseNewsfeedComments: deletedCommentsOnStudentPosts.length + deletedStudentNewsfeedComments.length,
        courseCertificateIssues: deletedCertificateIssues.length,
        courseCompletionRecords: deletedCompletionRecords.length,
        aiChatConversations: deletedAiChatConversations.length
      };
    });
  } catch (error) {
    console.error('resetStudentCourseProgress error:', error);
    throw new Error(
      `Failed to reset student course progress: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}
