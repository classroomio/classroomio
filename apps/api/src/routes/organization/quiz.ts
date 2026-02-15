import { ZQuizCreate, ZQuizGetParam, ZQuizListParam, ZQuizUpdate } from '@cio/utils/validation/organization';
import { createQuizService, deleteQuizService, getQuiz, listQuizzes, updateQuizService } from '@api/services/quiz';

import { Hono } from '@api/utils/hono';
import { authMiddleware } from '@api/middlewares/auth';
import { handleError } from '@api/utils/errors';
import { orgMemberMiddleware } from '@api/middlewares/org-member';
import { zValidator } from '@hono/zod-validator';

export const quizRouter = new Hono()
  /**
   * GET /organization/:orgId/quiz
   * Gets all quizzes for an organization
   * Requires authentication and organization membership
   */
  .get('/', authMiddleware, orgMemberMiddleware, zValidator('param', ZQuizListParam), async (c) => {
    try {
      const { orgId } = c.req.valid('param');
      const quizzes = await listQuizzes(orgId);

      return c.json(
        {
          success: true,
          data: quizzes
        },
        200
      );
    } catch (error) {
      return handleError(c, error, 'Failed to fetch quizzes');
    }
  })
  /**
   * GET /organization/:orgId/quiz/:quizId
   * Gets a single quiz by ID
   * Requires authentication and organization membership
   */
  .get('/:quizId', authMiddleware, orgMemberMiddleware, zValidator('param', ZQuizGetParam), async (c) => {
    try {
      const { quizId } = c.req.valid('param');
      const quiz = await getQuiz(quizId);

      if (!quiz) {
        return c.json(
          {
            success: false,
            error: 'Quiz not found'
          },
          404
        );
      }

      return c.json(
        {
          success: true,
          data: quiz
        },
        200
      );
    } catch (error) {
      return handleError(c, error, 'Failed to fetch quiz');
    }
  })
  /**
   * POST /organization/:orgId/quiz
   * Creates a new quiz
   * Requires authentication and organization membership
   */
  .post(
    '/',
    authMiddleware,
    orgMemberMiddleware,
    zValidator('param', ZQuizListParam),
    zValidator('json', ZQuizCreate),
    async (c) => {
      try {
        const { orgId } = c.req.valid('param');
        const data = c.req.valid('json');

        const quiz = await createQuizService(orgId, data);

        return c.json(
          {
            success: true,
            data: quiz
          },
          201
        );
      } catch (error) {
        return handleError(c, error, 'Failed to create quiz');
      }
    }
  )
  /**
   * PUT /organization/:orgId/quiz/:quizId
   * Updates a quiz
   * Requires authentication and organization membership
   */
  .put(
    '/:quizId',
    authMiddleware,
    orgMemberMiddleware,
    zValidator('param', ZQuizGetParam),
    zValidator('json', ZQuizUpdate),
    async (c) => {
      try {
        const { quizId } = c.req.valid('param');
        const data = c.req.valid('json');

        const quiz = await updateQuizService(quizId, data);

        return c.json(
          {
            success: true,
            data: quiz
          },
          200
        );
      } catch (error) {
        return handleError(c, error, 'Failed to update quiz');
      }
    }
  )
  /**
   * DELETE /organization/:orgId/quiz/:quizId
   * Deletes a quiz
   * Requires authentication and organization membership
   */
  .delete('/:quizId', authMiddleware, orgMemberMiddleware, zValidator('param', ZQuizGetParam), async (c) => {
    try {
      const { quizId } = c.req.valid('param');

      await deleteQuizService(quizId);

      return c.json(
        {
          success: true
        },
        200
      );
    } catch (error) {
      return handleError(c, error, 'Failed to delete quiz');
    }
  });
