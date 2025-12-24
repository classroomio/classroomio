import {
  ZCommunityComment,
  ZCommunityCommentDelete,
  ZCommunityQuestion,
  ZCommunityQuestionUpdate,
  ZCommunityQuestions,
  ZGetCommunity,
  ZGetCommunityCommentQuestionId,
  ZNewCommunityQuestion,
  ZUpvotePost,
  ZUpvotePostParam
} from '@cio/utils/validation/community';
import {
  createComment,
  createQuestion,
  deleteComment,
  deleteCommentsByQuestionId,
  deleteQuestion,
  editQuestion,
  fetchCommunityQuestion,
  fetchCommunityQuestions,
  upvote
} from '@api/services/community';

import { Hono } from '@api/utils/hono';
import { authMiddleware } from '@api/middlewares/auth';
import { commentAuthorOrTeamMiddleware } from './middlewares/comment-author-or-team';
import { handleError } from '@api/utils/errors';
import { orgMemberMiddleware } from '@api/middlewares/org-member';
import { orgTeamMemberMiddleware } from '@api/middlewares/org-team-member';
import { questionAuthorOrTeamMiddleware } from './middlewares/question-author-or-team';
import { zValidator } from '@hono/zod-validator';

export const communityRouter = new Hono()
  .get('/', authMiddleware, orgMemberMiddleware, zValidator('query', ZCommunityQuestions), async (c) => {
    try {
      const { orgId } = c.req.valid('query');

      const result = await fetchCommunityQuestions(orgId);

      return c.json({ success: true, data: result }, 200);
    } catch (error) {
      return handleError(c, error, 'Failed to load community posts');
    }
  })
  .get('/:slug', authMiddleware, orgMemberMiddleware, zValidator('param', ZCommunityQuestion), async (c) => {
    try {
      const { slug } = c.req.valid('param');

      const result = await fetchCommunityQuestion({ slug });

      return c.json({ success: true, data: result }, 200);
    } catch (error) {
      return handleError(c, error, 'Failed to load community post');
    }
  })
  .post('/', authMiddleware, orgMemberMiddleware, zValidator('json', ZNewCommunityQuestion), async (c) => {
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
    questionAuthorOrTeamMiddleware,
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
  .delete('/:id', authMiddleware, questionAuthorOrTeamMiddleware, zValidator('param', ZGetCommunity), async (c) => {
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
    orgMemberMiddleware,
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
    orgMemberMiddleware,
    zValidator('param', ZUpvotePostParam),
    zValidator('json', ZUpvotePost),
    async (c) => {
      try {
        const { id } = c.req.valid('param');
        const { isQuestion } = c.req.valid('json');

        const result = await upvote({
          id,
          isQuestion
        });

        return c.json({ success: true, data: result }, 200);
      } catch (error) {
        return handleError(c, error, 'Failed to upvote post');
      }
    }
  )
  .delete(
    '/:id/comment',
    authMiddleware,
    commentAuthorOrTeamMiddleware,
    zValidator('param', ZCommunityCommentDelete),
    async (c) => {
      const { id } = c.req.valid('param');
      const result = await deleteComment({ id });
      return c.json({ success: true, data: result }, 200);
    }
  )
  .delete(
    '/:questionId/comments',
    authMiddleware,
    orgTeamMemberMiddleware,
    zValidator('param', ZGetCommunityCommentQuestionId),
    async (c) => {
      const { questionId } = c.req.valid('param');
      const result = await deleteCommentsByQuestionId({ questionId });
      return c.json({ success: true, data: result }, 200);
    }
  );
