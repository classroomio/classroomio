import {
  ZCommunityAcceptedAnswer,
  ZCommunityAnswerParam,
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
import {
  fetchCommunityForYou,
  setCommunityAcceptedAnswerService,
  setCommunityAnswerVisibility,
  setCommunityQuestionFollow,
  setCommunityQuestionVisibility
} from '@api/services/community-engagement';

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
      const user = c.get('user')!;
      const userRole = c.get('userRole');

      if (userRole === null) {
        return c.json(
          {
            success: false,
            error: 'Organization context not available',
            code: 'ORG_CONTEXT_MISSING'
          },
          500
        );
      }

      const result = await fetchCommunityQuestions(orgId, user.id, userRole);

      return c.json({ success: true, data: result }, 200);
    } catch (error) {
      return handleError(c, error, 'Failed to load community posts');
    }
  })
  /**
   * GET /community/for-you
   * Questions the signed-in member asked, answered or follows in the active organization, most recent activity
   * first, flagging those with answers they have not read.
   */
  .get('/for-you', authMiddleware, orgMemberMiddleware, async (c) => {
    try {
      const user = c.get('user')!;
      const orgId = c.get('orgId')!;
      const userRole = c.get('userRole');

      if (userRole === null || userRole === undefined) {
        return c.json(
          {
            success: false,
            error: 'Organization context not available',
            code: 'ORG_CONTEXT_MISSING'
          },
          500
        );
      }

      const result = await fetchCommunityForYou(orgId, user.id, userRole);

      return c.json({ success: true, data: result }, 200);
    } catch (error) {
      return handleError(c, error, 'Failed to load community questions');
    }
  })
  .get('/:slug', authMiddleware, orgMemberMiddleware, zValidator('param', ZCommunityQuestion), async (c) => {
    try {
      const user = c.get('user')!;
      const orgId = c.get('orgId')!;
      const { slug } = c.req.valid('param');

      const result = await fetchCommunityQuestion(orgId, user.id, slug);

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
  )
  /**
   * POST /community/:id/follow
   * Follows a question; followers are notified when someone answers.
   */
  .post('/:id/follow', authMiddleware, orgMemberMiddleware, zValidator('param', ZGetCommunity), async (c) => {
    try {
      const user = c.get('user')!;
      const orgId = c.get('orgId')!;
      const { id } = c.req.valid('param');
      const data = await setCommunityQuestionFollow(orgId, user.id, id, true);

      return c.json({ success: true, data }, 200);
    } catch (error) {
      return handleError(c, error, 'Failed to follow question');
    }
  })
  /**
   * DELETE /community/:id/follow
   * Stops following a question.
   */
  .delete('/:id/follow', authMiddleware, orgMemberMiddleware, zValidator('param', ZGetCommunity), async (c) => {
    try {
      const user = c.get('user')!;
      const orgId = c.get('orgId')!;
      const { id } = c.req.valid('param');
      const data = await setCommunityQuestionFollow(orgId, user.id, id, false);

      return c.json({ success: true, data }, 200);
    } catch (error) {
      return handleError(c, error, 'Failed to unfollow question');
    }
  })
  /**
   * POST /community/:id/hide
   * Hides a question from learners. Course team and org admins only.
   */
  .post('/:id/hide', authMiddleware, orgMemberMiddleware, zValidator('param', ZGetCommunity), async (c) => {
    try {
      const user = c.get('user')!;
      const orgId = c.get('orgId')!;
      const { id } = c.req.valid('param');
      const data = await setCommunityQuestionVisibility(orgId, user.id, id, true);

      return c.json({ success: true, data }, 200);
    } catch (error) {
      return handleError(c, error, 'Failed to hide question');
    }
  })
  /**
   * DELETE /community/:id/hide
   * Shows a hidden question to learners again. Course team and org admins only.
   */
  .delete('/:id/hide', authMiddleware, orgMemberMiddleware, zValidator('param', ZGetCommunity), async (c) => {
    try {
      const user = c.get('user')!;
      const orgId = c.get('orgId')!;
      const { id } = c.req.valid('param');
      const data = await setCommunityQuestionVisibility(orgId, user.id, id, false);

      return c.json({ success: true, data }, 200);
    } catch (error) {
      return handleError(c, error, 'Failed to unhide question');
    }
  })
  /**
   * PUT /community/:id/accepted-answer
   * Sets the question's accepted answer, or clears it with `answerId: null`. Question author, course team and org
   * admins only.
   */
  .put(
    '/:id/accepted-answer',
    authMiddleware,
    orgMemberMiddleware,
    zValidator('param', ZGetCommunity),
    zValidator('json', ZCommunityAcceptedAnswer),
    async (c) => {
      try {
        const user = c.get('user')!;
        const orgId = c.get('orgId')!;
        const { id } = c.req.valid('param');
        const { answerId } = c.req.valid('json');
        const data = await setCommunityAcceptedAnswerService(orgId, user.id, id, answerId);

        return c.json({ success: true, data }, 200);
      } catch (error) {
        return handleError(c, error, 'Failed to update accepted answer');
      }
    }
  )
  /**
   * POST /community/answer/:answerId/hide
   * Hides an answer from learners. Course team and org admins only.
   */
  .post(
    '/answer/:answerId/hide',
    authMiddleware,
    orgMemberMiddleware,
    zValidator('param', ZCommunityAnswerParam),
    async (c) => {
      try {
        const user = c.get('user')!;
        const orgId = c.get('orgId')!;
        const { answerId } = c.req.valid('param');
        const data = await setCommunityAnswerVisibility(orgId, user.id, answerId, true);

        return c.json({ success: true, data }, 200);
      } catch (error) {
        return handleError(c, error, 'Failed to hide answer');
      }
    }
  )
  /**
   * DELETE /community/answer/:answerId/hide
   * Shows a hidden answer to learners again. Course team and org admins only.
   */
  .delete(
    '/answer/:answerId/hide',
    authMiddleware,
    orgMemberMiddleware,
    zValidator('param', ZCommunityAnswerParam),
    async (c) => {
      try {
        const user = c.get('user')!;
        const orgId = c.get('orgId')!;
        const { answerId } = c.req.valid('param');
        const data = await setCommunityAnswerVisibility(orgId, user.id, answerId, false);

        return c.json({ success: true, data }, 200);
      } catch (error) {
        return handleError(c, error, 'Failed to unhide answer');
      }
    }
  );
