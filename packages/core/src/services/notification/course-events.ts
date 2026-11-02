import { getQuestionAuthorAndCourse, listCommunityQuestionRecipientIds } from '@cio/db/queries/community/community';
import { getNewsfeedById, getNewsfeedCommentById } from '@cio/db/queries/newsfeed/newsfeed';
import {
  getCourseOrganization,
  getCourseStudentAudience,
  getGroupMemberProfileIds
} from '@cio/db/queries/notifications/notification-recipients';

import { notify } from './notify';

async function safely(event: string, run: () => Promise<unknown>): Promise<void> {
  try {
    await run();
  } catch (error) {
    console.error(`notification event ${event} failed:`, error);
  }
}

export function notifyCourseEnrollment(params: {
  courseId: string;
  profileIds: string[];
  actorProfileId?: string | null;
}) {
  return safely('course_enrolled', async () => {
    const organizationId = await getCourseOrganization(params.courseId);
    if (!organizationId) return;

    await notify({
      organizationId,
      recipientProfileIds: params.profileIds,
      type: 'course_enrolled',
      entityId: params.courseId,
      courseId: params.courseId,
      actorProfileId: params.actorProfileId,
      dedupeKey: `course_enrolled:${params.courseId}`
    });
  });
}

export function notifyNewsfeedPost(params: { feedId: string; courseId: string; authorGroupMemberId: string }) {
  return safely('newsfeed_post', async () => {
    const audience = await getCourseStudentAudience(params.courseId);
    if (!audience) return;

    const authorProfiles = await getGroupMemberProfileIds([params.authorGroupMemberId]);

    await notify({
      organizationId: audience.organizationId,
      recipientProfileIds: audience.studentProfileIds,
      type: 'newsfeed_post',
      entityId: params.feedId,
      courseId: params.courseId,
      actorProfileId: authorProfiles.get(params.authorGroupMemberId) ?? null,
      dedupeKey: `newsfeed_post:${params.feedId}`
    });
  });
}

/** Tells the author of the parent comment about a reply, and the post's author about a new comment. */
export function notifyNewsfeedComment(params: {
  feedId: string;
  commentId: number;
  commenterGroupMemberId: string;
  parentCommentId?: number | null;
}) {
  return safely('newsfeed_comment', async () => {
    const feed = await getNewsfeedById(params.feedId);
    if (!feed?.courseId) return;

    const organizationId = await getCourseOrganization(feed.courseId);
    if (!organizationId) return;

    const parent = params.parentCommentId ? await getNewsfeedCommentById(params.parentCommentId) : null;
    const memberIds = [params.commenterGroupMemberId, feed.authorId, parent?.authorId].filter((id): id is string =>
      Boolean(id)
    );
    const profileByMember = await getGroupMemberProfileIds(memberIds);
    const actorProfileId = profileByMember.get(params.commenterGroupMemberId) ?? null;
    const parentAuthorProfileId = parent?.authorId ? profileByMember.get(parent.authorId) : undefined;
    const postAuthorProfileId = feed.authorId ? profileByMember.get(feed.authorId) : undefined;

    if (parentAuthorProfileId) {
      await notify({
        organizationId,
        recipientProfileIds: [parentAuthorProfileId],
        type: 'newsfeed_reply',
        entityId: params.feedId,
        courseId: feed.courseId,
        actorProfileId,
        dedupeKey: `newsfeed_reply:${params.commentId}`
      });
    }

    if (postAuthorProfileId && postAuthorProfileId !== parentAuthorProfileId) {
      await notify({
        organizationId,
        recipientProfileIds: [postAuthorProfileId],
        type: 'newsfeed_comment',
        entityId: params.feedId,
        courseId: feed.courseId,
        actorProfileId,
        dedupeKey: `newsfeed_comment:${params.commentId}`
      });
    }
  });
}

export function notifyLessonPublished(params: { lessonId: string; courseId: string; actorProfileId?: string | null }) {
  return safely('lesson_published', async () => {
    const audience = await getCourseStudentAudience(params.courseId);
    if (!audience) return;

    await notify({
      organizationId: audience.organizationId,
      recipientProfileIds: audience.studentProfileIds,
      type: 'lesson_published',
      entityId: params.lessonId,
      courseId: params.courseId,
      actorProfileId: params.actorProfileId,
      dedupeKey: `lesson_published:${params.lessonId}`
    });
  });
}

export function notifyExerciseGraded(params: {
  submissionId: string;
  exerciseId: string;
  courseId: string;
  submittedByGroupMemberId: string;
  actorProfileId?: string | null;
}) {
  return safely('exercise_graded', async () => {
    const organizationId = await getCourseOrganization(params.courseId);
    if (!organizationId) return;

    const profileByMember = await getGroupMemberProfileIds([params.submittedByGroupMemberId]);
    const studentProfileId = profileByMember.get(params.submittedByGroupMemberId);
    if (!studentProfileId) return;

    await notify({
      organizationId,
      recipientProfileIds: [studentProfileId],
      type: 'exercise_graded',
      entityId: params.exerciseId,
      courseId: params.courseId,
      actorProfileId: params.actorProfileId,
      dedupeKey: `exercise_graded:${params.submissionId}`
    });
  });
}

export function notifyCommunityAnswer(params: { questionId: number; answerId: string; authorProfileId: string }) {
  return safely('community_answer', async () => {
    const question = await getQuestionAuthorAndCourse(params.questionId);
    // Learners cannot open a hidden question, so its followers get nothing to act on.
    if (!question || question.isHidden) return;

    const organizationId = question.organizationId ?? (await getCourseOrganization(question.courseId));
    if (!organizationId) return;

    const recipientProfileIds = await listCommunityQuestionRecipientIds(params.questionId);

    await notify({
      organizationId,
      recipientProfileIds,
      type: 'community_answer',
      entityId: String(params.questionId),
      courseId: question.courseId,
      actorProfileId: params.authorProfileId,
      dedupeKey: `community_answer:${params.answerId}`
    });
  });
}

export function notifyCertificateIssued(params: { courseId: string; profileId: string; dedupeKey: string }) {
  return safely('certificate_issued', async () => {
    const organizationId = await getCourseOrganization(params.courseId);
    if (!organizationId) return;

    await notify({
      organizationId,
      recipientProfileIds: [params.profileId],
      type: 'certificate_issued',
      entityId: params.courseId,
      courseId: params.courseId,
      dedupeKey: params.dedupeKey
    });
  });
}

/** Compliance reminders for one learner's completion record; `dedupeKey` separates each reminder day or cycle. */
export function notifyComplianceRecord(params: {
  type: 'compliance_due_soon' | 'compliance_overdue' | 'compliance_renewal_due';
  recordId: string;
  courseId: string;
  profileId: string;
  dedupeKey: string;
}) {
  return safely(params.type, async () => {
    const organizationId = await getCourseOrganization(params.courseId);
    if (!organizationId) return;

    await notify({
      organizationId,
      recipientProfileIds: [params.profileId],
      type: params.type,
      entityId: params.recordId,
      courseId: params.courseId,
      dedupeKey: params.dedupeKey
    });
  });
}
