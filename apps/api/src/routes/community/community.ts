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
  ZCommunityQuestion,
  ZCommunityQuestionDelete,
  ZCommunityQuestions,
  ZCommunityQuestionUpdate,
  ZNewCommunityQuestion,
  ZUpvoteComment
} from '@cio/utils/validation/community';
import z from 'zod';

export const communityRouter = new Hono()
  .get('/questions', authMiddleware, zValidator('query', ZCommunityQuestions), async (c) => {
    try {
      const { orgId } = c.req.valid('query');

      const result = await fetchCommunityQuestions(orgId);

      return c.json({ success: true, data: result }, 201);
    } catch (error) {
      return handleError(c, error, 'Failed to load community questions');
    }
  })
  .get('/question/:slug', authMiddleware, zValidator('param', ZCommunityQuestion), async (c) => {
    try {
      const { slug } = c.req.valid('param');

      const result = await fetchCommunityQuestion(slug);

      return c.json({ success: true, data: result }, 201);
    } catch (error) {
      return handleError(c, error, 'Failed to load community question');
    }
  })
  .post('/question', authMiddleware, zValidator('json', ZNewCommunityQuestion), async (c) => {
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
      return handleError(c, error, 'Failed to add community question');
    }
  })
  .put(
    '/question/:id',
    authMiddleware,
    zValidator('param', z.object({ id: z.coerce.number() })),
    zValidator('json', ZCommunityQuestionUpdate),
    async (c) => {
      try {
        const { id } = c.req.valid('param');
        const { title, body, courseId } = c.req.valid('json');

        const result = await editQuestion({ id, title, body, courseId });

        return c.json({ success: true, data: result }, 200);
      } catch (error) {
        return handleError(c, error, 'Failed to update community question');
      }
    }
  )
  .delete('/question', authMiddleware, zValidator('json', ZCommunityQuestionDelete), async (c) => {
    try {
      const { id } = c.req.valid('json');

      const result = await deleteQuestion({ id: Number(id) });

      return c.json({ success: true, data: result }, 201);
    } catch (error) {
      return handleError(c, error, 'Failed to delete community question');
    }
  })

  .post('/comment', authMiddleware, zValidator('json', ZCommunityComment), async (c) => {
    try {
      const { body, questionId, authorId, votes } = c.req.valid('json');

      const result = await createComment({
        body,
        questionId: Number(questionId),
        authorId: String(authorId),
        votes: Number(votes)
      });

      return c.json({ success: true, data: result }, 201);
    } catch (error) {
      return handleError(c, error, 'Failed to submit comment');
    }
  })
  .put('/comment', authMiddleware, zValidator('json', ZUpvoteComment), async (c) => {
    try {
      const { id, votes, isQuestion } = c.req.valid('json');

      const result = await upvote({
        id,
        votes: Number(votes),
        isQuestion
      });

      return c.json({ success: true, data: result }, 200);
    } catch (error) {
      return handleError(c, error, 'Failed to upvote comment');
    }
  })
  .delete('/comment/:id', authMiddleware, async (c) => {
    const id = c.req.param('id');
    const result = await deleteComment({ id });
    return c.json({ success: true, data: result }, 200);
  })
  .delete('/comments/:questionId', authMiddleware, async (c) => {
    const questionId = c.req.param('questionId');
    const result = await deleteCommentsByQuestionId({ questionId: Number(questionId) });
    return c.json({ success: true, data: result }, 200);
  });
