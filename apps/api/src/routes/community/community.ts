import { Hono } from '@api/utils/hono';
import { zValidator } from '@hono/zod-validator';

import { handleError } from '@api/utils/errors';
import { authMiddleware } from '@api/middlewares/auth';
import {
  fetchCommunityQuestion,
  fetchCommunityQuestions,
  createQuestion,
  deleteComment,
  deleteCommentsByQuestionId,
  deleteQuestion,
  createComment,
  editQuestion,
  upvote
} from '@api/services/community';
import {
  ZCommunityComment,
  ZCommunityCommentDelete,
  ZCommunityQuestion,
  ZCommunityQuestions,
  ZCommunityQuestionUpdate,
  ZGetCommunity,
  ZGetCommunityCommentQuestionId,
  ZNewCommunityQuestion,
  ZUpvotePost,
  ZUpvotePostParam
} from '@cio/utils/validation/community';

export const communityRouter = new Hono()
  .get('/', authMiddleware, zValidator('query', ZCommunityQuestions), async (c) => {
    try {
      const { orgId } = c.req.valid('query');

      const result = await fetchCommunityQuestions(orgId);

      return c.json({ success: true, data: result }, 200);
    } catch (error) {
      return handleError(c, error, 'Failed to load community posts');
    }
  })
  .get('/:slug', authMiddleware, zValidator('param', ZCommunityQuestion), async (c) => {
    try {
      const { slug } = c.req.valid('param');

      const result = await fetchCommunityQuestion({ slug });

      return c.json({ success: true, data: result }, 200);
    } catch (error) {
      return handleError(c, error, 'Failed to load community post');
    }
  })
  .post('/', authMiddleware, zValidator('json', ZNewCommunityQuestion), async (c) => {
    try {
      const { title, body, courseId, organizationId, authorProfileId, votes, slug } = c.req.valid('json');

      const result = await createQuestion({
        title,
        body,
        courseId,
        organizationId,
        authorProfileId,
        votes,
        slug
      });

      return c.json({ success: true, data: result }, 201);
    } catch (error) {
      return handleError(c, error, 'Failed to create community post');
    }
  })
  .put(
    '/:id',
    authMiddleware,
    zValidator('param', ZGetCommunity),
    zValidator('json', ZCommunityQuestionUpdate),
    async (c) => {
      try {
        const { id } = c.req.valid('param');
        const { title, body, courseId } = c.req.valid('json');

        const result = await editQuestion({ id, title, body, courseId });

        return c.json({ success: true, data: result }, 200);
      } catch (error) {
        return handleError(c, error, 'Failed to update community post');
      }
    }
  )
  .delete('/:id', authMiddleware, zValidator('param', ZGetCommunity), async (c) => {
    try {
      const { id } = c.req.valid('param');

      const result = await deleteQuestion({ id });

      return c.json({ success: true, data: result }, 200);
    } catch (error) {
      return handleError(c, error, 'Failed to delete community post');
    }
  })

  .post(
    '/:id/comment',
    authMiddleware,
    zValidator('param', ZGetCommunity),
    zValidator('json', ZCommunityComment),
    async (c) => {
      try {
        const { id } = c.req.valid('param');
        console.log('question id', id);
        const { body, authorProfileId, votes } = c.req.valid('json');

        const result = await createComment({
          body,
          questionId: id,
          authorProfileId,
          votes
        });

        return c.json({ success: true, data: result }, 201);
      } catch (error) {
        return handleError(c, error, 'Failed to submit comment');
      }
    }
  )
  .post(
    '/:id/upvote',
    authMiddleware,
    zValidator('param', ZUpvotePostParam),
    zValidator('json', ZUpvotePost),
    async (c) => {
      try {
        const { id } = c.req.valid('param');
        const { votes, isQuestion } = c.req.valid('json');

        const result = await upvote({
          id,
          votes,
          isQuestion
        });

        return c.json({ success: true, data: result }, 200);
      } catch (error) {
        return handleError(c, error, 'Failed to upvote post');
      }
    }
  )
  .delete('/:id/comment', authMiddleware, zValidator('param', ZCommunityCommentDelete), async (c) => {
    const { id } = c.req.valid('param');
    const result = await deleteComment({ id });
    return c.json({ success: true, data: result }, 200);
  })
  .delete('/:questionId/comments', authMiddleware, zValidator('param', ZGetCommunityCommentQuestionId), async (c) => {
    const { questionId } = c.req.valid('param');
    const result = await deleteCommentsByQuestionId({ questionId });
    return c.json({ success: true, data: result }, 200);
  });
