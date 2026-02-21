import {
  ZNewsfeedCommentCreate,
  ZNewsfeedCommentGetParam,
  ZNewsfeedCommentUpdate,
  ZNewsfeedCommentsQuery,
  ZNewsfeedCreate,
  ZNewsfeedGetParam,
  ZNewsfeedListQuery,
  ZNewsfeedReactionUpdate,
  ZNewsfeedUpdate
} from '@cio/utils/validation/newsfeed';
import {
  createNewsfeedCommentService,
  createNewsfeedService,
  deleteNewsfeedCommentService,
  deleteNewsfeedService,
  getNewsfeedCommentsService,
  getNewsfeedItem,
  listNewsfeedPaginated,
  updateNewsfeedCommentService,
  updateNewsfeedReactionService,
  updateNewsfeedService
} from '@api/services/newsfeed';

import { Hono } from '@api/utils/hono';
import { authMiddleware } from '@api/middlewares/auth';
import { courseMemberMiddleware } from '@api/middlewares/course-member';
import { courseTeamMemberMiddleware } from '@api/middlewares/course-team-member';
import { getGroupMemberIdByCourseAndProfile } from '@cio/db/queries/group';
import { handleError } from '@api/utils/errors';
import { newsfeedCommentAuthorOrTeamMiddleware } from '@api/middlewares/newsfeed-comment-author-or-team';
import { zValidator } from '@hono/zod-validator';

export const newsfeedRouter = new Hono()
  // Newsfeed CRUD routes
  .get('/', authMiddleware, courseMemberMiddleware, zValidator('query', ZNewsfeedListQuery), async (c) => {
    try {
      const courseId = c.req.param('courseId')!;
      const { cursor, limit = 10 } = c.req.valid('query');
      const result = await listNewsfeedPaginated(courseId, { cursor, limit });

      return c.json({ success: true, data: result }, 200);
    } catch (error) {
      return handleError(c, error, 'Failed to list newsfeed');
    }
  })
  .get('/:feedId', authMiddleware, courseMemberMiddleware, zValidator('param', ZNewsfeedGetParam), async (c) => {
    try {
      const { feedId } = c.req.valid('param');
      const feed = await getNewsfeedItem(feedId);

      return c.json({ success: true, data: feed }, 200);
    } catch (error) {
      return handleError(c, error, 'Failed to fetch newsfeed item');
    }
  })
  .post('/', authMiddleware, courseTeamMemberMiddleware, zValidator('json', ZNewsfeedCreate), async (c) => {
    try {
      const user = c.get('user')!;
      const courseId = c.req.param('courseId')!;
      const data = c.req.valid('json');

      const groupMemberId = await getGroupMemberIdByCourseAndProfile(courseId, user.id);
      if (!groupMemberId) {
        return c.json({ success: false, error: 'User is not a member of this course' }, 403);
      }

      const feed = await createNewsfeedService(courseId, groupMemberId, data);

      return c.json({ success: true, data: feed }, 201);
    } catch (error) {
      return handleError(c, error, 'Failed to create newsfeed');
    }
  })
  .put(
    '/:feedId',
    authMiddleware,
    courseTeamMemberMiddleware,
    zValidator('param', ZNewsfeedGetParam),
    zValidator('json', ZNewsfeedUpdate),
    async (c) => {
      try {
        const { feedId } = c.req.valid('param');
        const data = c.req.valid('json');

        const feed = await updateNewsfeedService(feedId, data);

        return c.json({ success: true, data: feed }, 200);
      } catch (error) {
        return handleError(c, error, 'Failed to update newsfeed');
      }
    }
  )
  .put(
    '/:feedId/react',
    authMiddleware,
    courseMemberMiddleware,
    zValidator('param', ZNewsfeedGetParam),
    zValidator('json', ZNewsfeedReactionUpdate),
    async (c) => {
      try {
        const { feedId } = c.req.valid('param');
        const { reaction } = c.req.valid('json');

        const feed = await updateNewsfeedReactionService(feedId, reaction);

        return c.json({ success: true, data: feed }, 200);
      } catch (error) {
        return handleError(c, error, 'Failed to update newsfeed reaction');
      }
    }
  )
  .delete('/:feedId', authMiddleware, courseTeamMemberMiddleware, zValidator('param', ZNewsfeedGetParam), async (c) => {
    try {
      const { feedId } = c.req.valid('param');
      const feed = await deleteNewsfeedService(feedId);

      return c.json({ success: true, data: feed }, 200);
    } catch (error) {
      return handleError(c, error, 'Failed to delete newsfeed');
    }
  })
  // Newsfeed Comment routes
  .get(
    '/:feedId/comments',
    authMiddleware,
    courseMemberMiddleware,
    zValidator('param', ZNewsfeedGetParam),
    zValidator('query', ZNewsfeedCommentsQuery),
    async (c) => {
      try {
        const { feedId } = c.req.valid('param');
        const { cursor, limit = 5 } = c.req.valid('query');

        const result = await getNewsfeedCommentsService(feedId, { cursor, limit });

        return c.json({ success: true, data: result }, 200);
      } catch (error) {
        return handleError(c, error, 'Failed to fetch newsfeed comments');
      }
    }
  )
  .post(
    '/:feedId/comment',
    authMiddleware,
    courseMemberMiddleware,
    zValidator('param', ZNewsfeedGetParam),
    zValidator('json', ZNewsfeedCommentCreate),
    async (c) => {
      try {
        const user = c.get('user')!;
        const courseId = c.req.param('courseId')!;
        const { feedId } = c.req.valid('param');
        const { content } = c.req.valid('json');

        const groupMemberId = await getGroupMemberIdByCourseAndProfile(courseId, user.id);
        if (!groupMemberId) {
          return c.json({ success: false, error: 'User is not a member of this course' }, 403);
        }

        const comment = await createNewsfeedCommentService(feedId, groupMemberId, content);

        return c.json({ success: true, data: comment }, 201);
      } catch (error) {
        return handleError(c, error, 'Failed to create newsfeed comment');
      }
    }
  )
  .put(
    '/comment/:commentId',
    authMiddleware,
    newsfeedCommentAuthorOrTeamMiddleware,
    zValidator('param', ZNewsfeedCommentGetParam),
    zValidator('json', ZNewsfeedCommentUpdate),
    async (c) => {
      try {
        const { commentId } = c.req.valid('param');
        const { content } = c.req.valid('json');
        const updated = await updateNewsfeedCommentService(Number(commentId), content);

        return c.json({ success: true, data: updated }, 200);
      } catch (error) {
        return handleError(c, error, 'Failed to update newsfeed comment');
      }
    }
  )
  .delete(
    '/comment/:commentId',
    authMiddleware,
    newsfeedCommentAuthorOrTeamMiddleware,
    zValidator('param', ZNewsfeedCommentGetParam),
    async (c) => {
      try {
        const { commentId } = c.req.valid('param');
        const comment = await deleteNewsfeedCommentService(Number(commentId));

        return c.json({ success: true, data: comment }, 200);
      } catch (error) {
        return handleError(c, error, 'Failed to delete newsfeed comment');
      }
    }
  );
