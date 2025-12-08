import { Hono } from '@api/utils/hono';
import { zValidator } from '@hono/zod-validator';

import { handleError } from '@api/utils/errors';
import { authMiddleware } from '@api/middlewares/auth';
import {
  fetchCommunityQuestion,
  fetchCommunityQuestions,
  handleAddQuestion,
  handleDeleteCommentById,
  handleDeleteCommentByQuestionId,
  handleDeleteQuestion,
  handleSubmitComment,
  handleUpdateQuestion,
  handleUpvote
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

export const communityRouter = new Hono()
  // --- get all community questions
  .get('/questions', authMiddleware, zValidator('query', ZCommunityQuestions), async (c) => {
    try {
      const { orgId } = c.req.valid('query');

      const result = await fetchCommunityQuestions(orgId);

      return c.json({ success: true, data: result }, 201);
    } catch (error) {
      return handleError(c, error, 'Failed to load community questions');
    }
  })
  // --- get single community question
  .get('/question', authMiddleware, zValidator('query', ZCommunityQuestion), async (c) => {
    try {
      const { slug } = c.req.valid('query');

      const result = await fetchCommunityQuestion(slug);

      return c.json({ success: true, data: result }, 201);
    } catch (error) {
      return handleError(c, error, 'Failed to load community question');
    }
  })
  // --- add community question
  .post('/question', authMiddleware, zValidator('json', ZNewCommunityQuestion), async (c) => {
    try {
      const { title, body, course_id, organization_id, author_profile_id, votes, slug } = c.req.valid('json');

      const result = await handleAddQuestion({
        title,
        body,
        course_id,
        organization_id,
        author_profile_id,
        votes,
        slug
      });

      return c.json({ success: true, data: result }, 201);
    } catch (error) {
      return handleError(c, error, 'Failed to add community question');
    }
  })
  // --- update community question
  .put('/question', authMiddleware, zValidator('json', ZCommunityQuestionUpdate), async (c) => {
    try {
      const { id, title, body, course_id } = c.req.valid('json');

      const result = await handleUpdateQuestion({ id: Number(id), title, body, course_id });

      return c.json({ success: true, data: result }, 201);
    } catch (error) {
      return handleError(c, error, 'Failed to update community question');
    }
  })
  // --- delete community question (by id)
  .delete('/question', authMiddleware, zValidator('json', ZCommunityQuestionDelete), async (c) => {
    try {
      const { id } = c.req.valid('json');

      const result = await handleDeleteQuestion({ id: Number(id) });

      return c.json({ success: true, data: result }, 201);
    } catch (error) {
      return handleError(c, error, 'Failed to delete community question');
    }
  })

  // --- add comment
  .post('/comment', authMiddleware, zValidator('json', ZCommunityComment), async (c) => {
    try {
      const { body, questionId, authorId, votes } = c.req.valid('json');

      const result = await handleSubmitComment({
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
  // --- upvote comment/question
  .put('/comment', authMiddleware, zValidator('json', ZUpvoteComment), async (c) => {
    try {
      const { id, votes, isQuestion } = c.req.valid('json');

      const result = await handleUpvote({
        id,
        votes: Number(votes),
        isQuestion
      });

      return c.json({ success: true, data: result }, 201);
    } catch (error) {
      return handleError(c, error, 'Failed to upvote comment');
    }
  })
  // --- delete comment by id
  .delete('/comment/:id', authMiddleware, async (c) => {
    const id = c.req.param('id');
    const result = await handleDeleteCommentById({ id });
    return c.json({ success: true, data: result }, 200);
  })
  // --- delete comment by questionId
  .delete('/comments/:questionId', authMiddleware, async (c) => {
    const questionId = c.req.param('questionId');
    const result = await handleDeleteCommentByQuestionId({ questionId: Number(questionId) });
    return c.json({ success: true, data: result }, 200);
  });
