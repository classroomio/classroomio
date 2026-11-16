import {
  ZCourseCommentCourseParam,
  ZCourseCommentParam,
  ZCourseCommentThreadParam,
  ZCourseCommentWrite,
  ZCreateCourseCommentThread,
  ZListCourseCommentThreadsQuery
} from '@cio/utils/validation/course-comment';
import {
  createCourseCommentThread,
  deleteCourseComment,
  editCourseComment,
  getCourseCommentSummary,
  listCourseCommentTeamView,
  listCourseCommentThreadViews,
  markAllCourseCommentsRead,
  markCourseCommentThreadRead,
  reopenCourseCommentThread,
  replyToCourseCommentThread,
  readCourseCommentThread,
  resolveCourseCommentThread
} from '@api/services/course-comment';
import { authMiddleware } from '@api/middlewares/auth';
import { courseTeamMemberMiddleware } from '@api/middlewares/course-team-member';
import { handleError } from '@api/utils/errors';
import { Hono } from '@api/utils/hono';
import { zValidator } from '@hono/zod-validator';

export const courseCommentsRouter = new Hono()
  .get(
    '/',
    authMiddleware,
    courseTeamMemberMiddleware,
    zValidator('param', ZCourseCommentCourseParam),
    zValidator('query', ZListCourseCommentThreadsQuery),
    async (c) => {
      try {
        const user = c.get('user')!;
        const { courseId } = c.req.valid('param');
        const { status } = c.req.valid('query');
        const threads = await listCourseCommentThreadViews(courseId, user.id, status);

        return c.json({ success: true, data: threads }, 200);
      } catch (error) {
        return handleError(c, error, 'Failed to list comments');
      }
    }
  )
  .get(
    '/summary',
    authMiddleware,
    courseTeamMemberMiddleware,
    zValidator('param', ZCourseCommentCourseParam),
    async (c) => {
      try {
        const user = c.get('user')!;
        const { courseId } = c.req.valid('param');
        const summary = await getCourseCommentSummary(courseId, user.id);

        return c.json({ success: true, data: summary }, 200);
      } catch (error) {
        return handleError(c, error, 'Failed to load comment counts');
      }
    }
  )
  .get(
    '/team',
    authMiddleware,
    courseTeamMemberMiddleware,
    zValidator('param', ZCourseCommentCourseParam),
    async (c) => {
      try {
        const { courseId } = c.req.valid('param');
        const team = await listCourseCommentTeamView(courseId);

        return c.json({ success: true, data: team }, 200);
      } catch (error) {
        return handleError(c, error, 'Failed to load the comment team');
      }
    }
  )
  .post(
    '/read-all',
    authMiddleware,
    courseTeamMemberMiddleware,
    zValidator('param', ZCourseCommentCourseParam),
    async (c) => {
      try {
        const user = c.get('user')!;
        const { courseId } = c.req.valid('param');
        await markAllCourseCommentsRead({ courseId, actorId: user.id });

        return c.json({ success: true, data: { ok: true } }, 200);
      } catch (error) {
        return handleError(c, error, 'Failed to mark comments read');
      }
    }
  )
  .post(
    '/',
    authMiddleware,
    courseTeamMemberMiddleware,
    zValidator('param', ZCourseCommentCourseParam),
    zValidator('json', ZCreateCourseCommentThread),
    async (c) => {
      try {
        const user = c.get('user')!;
        const { courseId } = c.req.valid('param');
        const data = c.req.valid('json');
        const thread = await createCourseCommentThread({ courseId, actorId: user.id, data });

        return c.json({ success: true, data: thread }, 201);
      } catch (error) {
        return handleError(c, error, 'Failed to create comment');
      }
    }
  )
  .get(
    '/:threadId',
    authMiddleware,
    courseTeamMemberMiddleware,
    zValidator('param', ZCourseCommentThreadParam),
    async (c) => {
      try {
        const user = c.get('user')!;
        const { courseId, threadId } = c.req.valid('param');
        const thread = await readCourseCommentThread(courseId, threadId, user.id);

        return c.json({ success: true, data: thread }, 200);
      } catch (error) {
        return handleError(c, error, 'Failed to load comment thread');
      }
    }
  )
  .post(
    '/:threadId/comments',
    authMiddleware,
    courseTeamMemberMiddleware,
    zValidator('param', ZCourseCommentThreadParam),
    zValidator('json', ZCourseCommentWrite),
    async (c) => {
      try {
        const user = c.get('user')!;
        const { courseId, threadId } = c.req.valid('param');
        const data = c.req.valid('json');
        const thread = await replyToCourseCommentThread({ courseId, threadId, actorId: user.id, data });

        return c.json({ success: true, data: thread }, 201);
      } catch (error) {
        return handleError(c, error, 'Failed to reply');
      }
    }
  )
  .patch(
    '/:threadId/comments/:commentId',
    authMiddleware,
    courseTeamMemberMiddleware,
    zValidator('param', ZCourseCommentParam),
    zValidator('json', ZCourseCommentWrite),
    async (c) => {
      try {
        const user = c.get('user')!;
        const { courseId, threadId, commentId } = c.req.valid('param');
        const data = c.req.valid('json');
        const thread = await editCourseComment({ courseId, threadId, commentId, actorId: user.id, data });

        return c.json({ success: true, data: thread }, 200);
      } catch (error) {
        return handleError(c, error, 'Failed to edit comment');
      }
    }
  )
  .delete(
    '/:threadId/comments/:commentId',
    authMiddleware,
    courseTeamMemberMiddleware,
    zValidator('param', ZCourseCommentParam),
    async (c) => {
      try {
        const user = c.get('user')!;
        const { courseId, threadId, commentId } = c.req.valid('param');
        const result = await deleteCourseComment({ courseId, threadId, commentId, actorId: user.id });

        return c.json({ success: true, data: result }, 200);
      } catch (error) {
        return handleError(c, error, 'Failed to delete comment');
      }
    }
  )
  .post(
    '/:threadId/resolve',
    authMiddleware,
    courseTeamMemberMiddleware,
    zValidator('param', ZCourseCommentThreadParam),
    async (c) => {
      try {
        const user = c.get('user')!;
        const { courseId, threadId } = c.req.valid('param');
        const thread = await resolveCourseCommentThread({ courseId, threadId, actorId: user.id });

        return c.json({ success: true, data: thread }, 200);
      } catch (error) {
        return handleError(c, error, 'Failed to resolve thread');
      }
    }
  )
  .post(
    '/:threadId/reopen',
    authMiddleware,
    courseTeamMemberMiddleware,
    zValidator('param', ZCourseCommentThreadParam),
    async (c) => {
      try {
        const user = c.get('user')!;
        const { courseId, threadId } = c.req.valid('param');
        const thread = await reopenCourseCommentThread({ courseId, threadId, actorId: user.id });

        return c.json({ success: true, data: thread }, 200);
      } catch (error) {
        return handleError(c, error, 'Failed to reopen thread');
      }
    }
  )
  .post(
    '/:threadId/read',
    authMiddleware,
    courseTeamMemberMiddleware,
    zValidator('param', ZCourseCommentThreadParam),
    async (c) => {
      try {
        const user = c.get('user')!;
        const { courseId, threadId } = c.req.valid('param');
        await markCourseCommentThreadRead({ courseId, threadId, actorId: user.id });

        return c.json({ success: true, data: { ok: true } }, 200);
      } catch (error) {
        return handleError(c, error, 'Failed to mark thread read');
      }
    }
  );
