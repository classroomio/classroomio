import {
  createLessonCommentService,
  deleteLessonCommentService,
  getLessonCommentsPaginated,
  updateLessonCommentService
} from '@api/services/lesson';
import { ensureCourseGroupMemberId } from '@cio/core/services/course/course';
import { getLessonCommentById } from '@cio/db/queries/lesson';
import type { TLessonComment } from '@cio/db/types';
import type {
  TPublicApiCourseLessonCommentParam,
  TPublicApiCourseLessonCommentsQuery,
  TPublicApiCourseLessonParam,
  TPublicApiCreateCourseLessonComment,
  TPublicApiUpdateCourseLessonComment
} from '@cio/utils/validation/public-api';
import { AppError, ErrorCodes } from '@api/utils/errors';
import {
  assertAutomationActor,
  assertCourseTeamAccess,
  assertLessonCommentAuthorOrTeam,
  assertLessonInCourse
} from '../shared';

function toPublicComment(comment: TLessonComment) {
  return {
    id: comment.id,
    lessonId: comment.lessonId,
    groupmemberId: comment.groupmemberId,
    comment: comment.comment,
    createdAt: comment.createdAt,
    updatedAt: comment.updatedAt
  };
}

async function assertCommentInLesson(params: TPublicApiCourseLessonCommentParam): Promise<TLessonComment> {
  await assertLessonInCourse(params.courseId, params.lessonId);

  const comment = await getLessonCommentById(params.commentId);
  if (!comment || comment.lessonId !== params.lessonId) {
    throw new AppError('Comment not found', ErrorCodes.COMMENT_NOT_FOUND, 404);
  }

  return comment;
}

export async function listPublicApiCourseLessonCommentsService(
  orgId: string,
  actorId: string | null,
  params: TPublicApiCourseLessonParam,
  query: TPublicApiCourseLessonCommentsQuery
) {
  await assertCourseTeamAccess(orgId, actorId, params.courseId);
  await assertLessonInCourse(params.courseId, params.lessonId);

  const page = await getLessonCommentsPaginated(params.lessonId, query);

  return {
    items: page.items.map((comment) => ({ ...toPublicComment(comment), author: comment.profile })),
    total: page.totalCount,
    nextCursor: page.nextCursor
  };
}

export async function createPublicApiCourseLessonCommentService(
  orgId: string,
  actorId: string | null,
  params: TPublicApiCourseLessonParam,
  payload: TPublicApiCreateCourseLessonComment
) {
  assertAutomationActor(actorId);
  await assertCourseTeamAccess(orgId, actorId, params.courseId);
  await assertLessonInCourse(params.courseId, params.lessonId);

  const groupMemberId = await ensureCourseGroupMemberId(params.courseId, actorId);
  if (!groupMemberId) {
    throw new AppError('The API key creator is not a member of this course', ErrorCodes.FORBIDDEN, 403);
  }

  return toPublicComment(await createLessonCommentService(params.lessonId, groupMemberId, payload.comment));
}

export async function updatePublicApiCourseLessonCommentService(
  orgId: string,
  actorId: string | null,
  params: TPublicApiCourseLessonCommentParam,
  payload: TPublicApiUpdateCourseLessonComment
) {
  await assertCourseTeamAccess(orgId, actorId, params.courseId);
  const comment = await assertCommentInLesson(params);
  await assertLessonCommentAuthorOrTeam(params.courseId, actorId, comment.groupmemberId, 'edit');

  return toPublicComment(await updateLessonCommentService(params.commentId, payload.comment));
}

export async function deletePublicApiCourseLessonCommentService(
  orgId: string,
  actorId: string | null,
  params: TPublicApiCourseLessonCommentParam
) {
  await assertCourseTeamAccess(orgId, actorId, params.courseId);
  const comment = await assertCommentInLesson(params);
  await assertLessonCommentAuthorOrTeam(params.courseId, actorId, comment.groupmemberId, 'delete');

  return toPublicComment(await deleteLessonCommentService(params.commentId));
}
